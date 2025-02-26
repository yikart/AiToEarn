/*
 * Copyright (C) 2011 Google Inc. All rights reserved.
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

#include "IndexedDB.h"
#include "ThreadSafeDataBuffer.h"
#include <variant>
#include <wtf/Forward.h>
#include <wtf/RefCounted.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>
#include <wtf/text/WTFString.h>

namespace JSC {
class JSArrayBuffer;
class JSArrayBufferView;
}

namespace WebCore {

class IDBKey : public RefCounted<IDBKey> {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(IDBKey);
public:
    static Ref<IDBKey> createInvalid()
    {
        return adoptRef(*new IDBKey());
    }

    static Ref<IDBKey> createNumber(double number)
    {
        return adoptRef(*new IDBKey(IndexedDB::KeyType::Number, number));
    }

    static Ref<IDBKey> createString(const String& string)
    {
        return adoptRef(*new IDBKey(string));
    }

    static Ref<IDBKey> createDate(double date)
    {
        return adoptRef(*new IDBKey(IndexedDB::KeyType::Date, date));
    }

    static Ref<IDBKey> createMultiEntryArray(const Vector<RefPtr<IDBKey>>& array)
    {
        Vector<RefPtr<IDBKey>> result;

        size_t sizeEstimate = 0;
        for (auto& key : array) {
            if (!key->isValid())
                continue;

            bool skip = false;
            for (auto& resultKey : result) {
                if (key->isEqual(*resultKey)) {
                    skip = true;
                    break;
                }
            }
            if (!skip) {
                result.append(key);
                sizeEstimate += key->m_sizeEstimate;
            }
        }
        auto idbKey = adoptRef(*new IDBKey(result, sizeEstimate));
        ASSERT(idbKey->isValid());
        return idbKey;
    }

    static Ref<IDBKey> createArray(const Vector<RefPtr<IDBKey>>& array)
    {
        size_t sizeEstimate = 0;
        for (auto& key : array)
            sizeEstimate += key->m_sizeEstimate;

        return adoptRef(*new IDBKey(array, sizeEstimate));
    }

    static Ref<IDBKey> createBinary(const ThreadSafeDataBuffer&);
    static Ref<IDBKey> createBinary(JSC::JSArrayBuffer&);
    static Ref<IDBKey> createBinary(JSC::JSArrayBufferView&);

    WEBCORE_EXPORT ~IDBKey();

    IndexedDB::KeyType type() const { return m_type; }
    WEBCORE_EXPORT bool isValid() const;

    const Vector<RefPtr<IDBKey>>& array() const
    {
        ASSERT(m_type == IndexedDB::KeyType::Array);
        return std::get<Vector<RefPtr<IDBKey>>>(m_value);
    }

    const String& string() const
    {
        ASSERT(m_type == IndexedDB::KeyType::String);
        return std::get<String>(m_value);
    }

    double date() const
    {
        ASSERT(m_type == IndexedDB::KeyType::Date);
        return std::get<double>(m_value);
    }

    double number() const
    {
        ASSERT(m_type == IndexedDB::KeyType::Number);
        return std::get<double>(m_value);
    }

    const ThreadSafeDataBuffer& binary() const
    {
        ASSERT(m_type == IndexedDB::KeyType::Binary);
        return std::get<ThreadSafeDataBuffer>(m_value);
    }

    int compare(const IDBKey& other) const;
    bool isLessThan(const IDBKey& other) const;
    bool isEqual(const IDBKey& other) const;

    size_t sizeEstimate() const { return m_sizeEstimate; }

    using RefCounted<IDBKey>::ref;
    using RefCounted<IDBKey>::deref;

#if !LOG_DISABLED
    String loggingString() const;
#endif

private:
    IDBKey()
        : m_type(IndexedDB::KeyType::Invalid)
        , m_sizeEstimate(OverheadSize)
    {
    }

    IDBKey(IndexedDB::KeyType, double number);
    explicit IDBKey(const String& value);
    IDBKey(const Vector<RefPtr<IDBKey>>& keyArray, size_t arraySize);
    explicit IDBKey(const ThreadSafeDataBuffer&);

    const IndexedDB::KeyType m_type;
    std::variant<Vector<RefPtr<IDBKey>>, String, double, ThreadSafeDataBuffer> m_value;

    const size_t m_sizeEstimate;

    // Very rough estimate of minimum key size overhead.
    enum { OverheadSize = 16 };
};

inline int compareBinaryKeyData(const Vector<uint8_t>& a, const Vector<uint8_t>& b)
{
    size_t length = std::min(a.size(), b.size());

    for (size_t i = 0; i < length; ++i) {
        if (a[i] > b[i])
            return 1;
        if (a[i] < b[i])
            return -1;
    }

    if (a.size() == b.size())
        return 0;

    if (a.size() > b.size())
        return 1;

    return -1;
}

inline int compareBinaryKeyData(const ThreadSafeDataBuffer& a, const ThreadSafeDataBuffer& b)
{
    auto* aData = a.data();
    auto* bData = b.data();

    // Covers the cases where both pointers are null as well as both pointing to the same buffer.
    if (aData == bData)
        return 0;

    if (aData && !bData)
        return 1;
    if (!aData && bData)
        return -1;

    return compareBinaryKeyData(*aData, *bData);
}

} // namespace WebCore
