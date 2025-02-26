/*
 * Copyright (C) 2011-2023 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "ConcurrentJSLock.h"
#include "SpeculatedType.h"
#include "Structure.h"
#include "VirtualRegister.h"
#include <span>
#include <wtf/PrintStream.h>
#include <wtf/StringPrintStream.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

class UnlinkedValueProfile;

template<unsigned numberOfBucketsArgument, unsigned numberOfSpecFailBucketsArgument>
struct ValueProfileBase {
    friend class UnlinkedValueProfile;

    static constexpr unsigned numberOfBuckets = numberOfBucketsArgument;
    static constexpr unsigned numberOfSpecFailBuckets = numberOfSpecFailBucketsArgument;
    static constexpr unsigned totalNumberOfBuckets = numberOfBuckets + numberOfSpecFailBuckets;
    
    ValueProfileBase()
    {
        clearBuckets();
    }
    
    EncodedJSValue* specFailBucket(unsigned i)
    {
        ASSERT(numberOfBuckets + i < totalNumberOfBuckets);
        return m_buckets + numberOfBuckets + i;
    }

    void clearBuckets()
    {
        for (unsigned i = 0; i < totalNumberOfBuckets; ++i)
            clearEncodedJSValueConcurrent(m_buckets[i]);
    }
    
    const ClassInfo* classInfo(unsigned bucket) const
    {
        JSValue value = JSValue::decodeConcurrent(&m_buckets[bucket]);
        if (!!value) {
            if (!value.isCell())
                return nullptr;
            return value.asCell()->classInfo();
        }
        return nullptr;
    }
    
    unsigned numberOfSamples() const
    {
        unsigned result = 0;
        for (unsigned i = 0; i < totalNumberOfBuckets; ++i) {
            if (!!JSValue::decodeConcurrent(&m_buckets[i]))
                result++;
        }
        return result;
    }
    
    unsigned totalNumberOfSamples() const
    {
        return numberOfSamples() + isSampledBefore();
    }

    bool isSampledBefore() const { return m_prediction != SpecNone; }
    
    bool isLive() const
    {
        for (unsigned i = 0; i < totalNumberOfBuckets; ++i) {
            if (!!JSValue::decodeConcurrent(&m_buckets[i]))
                return true;
        }
        return false;
    }
    
    CString briefDescription(const ConcurrentJSLocker& locker)
    {
        SpeculatedType prediction = computeUpdatedPrediction(locker);
        
        StringPrintStream out;
        out.print("predicting ", SpeculationDump(prediction));
        return out.toCString();
    }
    
    void dump(PrintStream& out)
    {
        out.print("sampled before = ", isSampledBefore(), " live samples = ", numberOfSamples(), " prediction = ", SpeculationDump(m_prediction));
        bool first = true;
        for (unsigned i = 0; i < totalNumberOfBuckets; ++i) {
            JSValue value = JSValue::decode(m_buckets[i]);
            if (!!value) {
                if (first) {
                    out.printf(": ");
                    first = false;
                } else
                    out.printf(", ");
                out.print(value);
            }
        }
    }
    
    SpeculatedType computeUpdatedPrediction(const ConcurrentJSLocker&)
    {
        SpeculatedType merged = SpecNone;
        for (unsigned i = 0; i < totalNumberOfBuckets; ++i) {
            JSValue value = JSValue::decodeConcurrent(&m_buckets[i]);
            if (!value)
                continue;
            
            mergeSpeculation(merged, speculationFromValue(value));

            updateEncodedJSValueConcurrent(m_buckets[i], JSValue::encode(JSValue()));
        }

        mergeSpeculation(m_prediction, merged);
        
        return m_prediction;
    }

    void computeUpdatedPredictionForExtraValue(const ConcurrentJSLocker&, JSValue& value)
    {
        if (value)
            mergeSpeculation(m_prediction, speculationFromValue(value));
        value = JSValue();
    }

    EncodedJSValue m_buckets[totalNumberOfBuckets];

    SpeculatedType m_prediction { SpecNone };
};

struct MinimalValueProfile : public ValueProfileBase<0, 1> {
    MinimalValueProfile(): ValueProfileBase<0, 1>() { }
};

struct ValueProfile : public ValueProfileBase<1, 0> {
    ValueProfile() : ValueProfileBase<1, 0>() { }
    static constexpr ptrdiff_t offsetOfFirstBucket() { return OBJECT_OFFSETOF(ValueProfile, m_buckets[0]); }
};

struct ArgumentValueProfile : public ValueProfileBase<1, 1> {
    ArgumentValueProfile() : ValueProfileBase<1, 1>() { }
    static constexpr ptrdiff_t offsetOfFirstBucket() { return OBJECT_OFFSETOF(ValueProfile, m_buckets[0]); }
};

struct ValueProfileAndVirtualRegister : public ValueProfile {
    VirtualRegister m_operand;
};

static_assert(sizeof(ValueProfileAndVirtualRegister) >= sizeof(unsigned));
class alignas(ValueProfileAndVirtualRegister) ValueProfileAndVirtualRegisterBuffer final {
    WTF_MAKE_NONCOPYABLE(ValueProfileAndVirtualRegisterBuffer);
public:

    static ValueProfileAndVirtualRegisterBuffer* create(unsigned size)
    {
        void* buffer = VMMalloc::malloc(sizeof(ValueProfileAndVirtualRegisterBuffer) + size * sizeof(ValueProfileAndVirtualRegister));
        return new (buffer) ValueProfileAndVirtualRegisterBuffer(size);
    }

    static void destroy(ValueProfileAndVirtualRegisterBuffer* buffer)
    {
        buffer->~ValueProfileAndVirtualRegisterBuffer();
        VMMalloc::free(buffer);
    }

    template <typename Function>
    void forEach(Function function)
    {
        for (unsigned i = 0; i < m_size; ++i)
            function(data()[i]);
    }

    unsigned size() const { return m_size; }
    ValueProfileAndVirtualRegister* data() const
    {
        return std::bit_cast<ValueProfileAndVirtualRegister*>(this + 1);
    }

    std::span<ValueProfileAndVirtualRegister> span() { return { data(), size() }; }

private:

    ValueProfileAndVirtualRegisterBuffer(unsigned size)
        : m_size(size)
    {
        // FIXME: ValueProfile has more stuff than we need. We could optimize these value profiles
        // to be more space efficient.
        // https://bugs.webkit.org/show_bug.cgi?id=175413
        for (unsigned i = 0; i < m_size; ++i)
            new (&data()[i]) ValueProfileAndVirtualRegister();
    }

    ~ValueProfileAndVirtualRegisterBuffer()
    {
        for (unsigned i = 0; i < m_size; ++i)
            data()[i].~ValueProfileAndVirtualRegister();
    }

    unsigned m_size;
};

class UnlinkedValueProfile {
public:
    UnlinkedValueProfile() = default;

    void update(ValueProfile& profile)
    {
        SpeculatedType newType = profile.m_prediction | m_prediction;
        profile.m_prediction = newType;
        m_prediction = newType;
    }

    void update(ArgumentValueProfile& profile)
    {
        SpeculatedType newType = profile.m_prediction | m_prediction;
        profile.m_prediction = newType;
        m_prediction = newType;
    }

private:
    SpeculatedType m_prediction { SpecNone };
};

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
