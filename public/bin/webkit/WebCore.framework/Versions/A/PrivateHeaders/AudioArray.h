/*
 * Copyright (C) 2010 Google Inc. All rights reserved.
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

#ifndef AudioArray_h
#define AudioArray_h

#include <span>
#include <string.h>
#include <wtf/CheckedArithmetic.h>
#include <wtf/StdLibExtras.h>
#include <wtf/TZoneMallocInlines.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace WebCore {

template<typename T>
class AudioArray {
    WTF_MAKE_TZONE_ALLOCATED_INLINE(AudioArray);
public:
    AudioArray() = default;
    explicit AudioArray(size_t n)
    {
        resize(n);
    }

    ~AudioArray()
    {
        fastAlignedFree(m_allocation);
    }

    // It's OK to call resize() multiple times, but data will *not* be copied from an initial allocation
    // if re-allocated. Allocations are zero-initialized.
    void resize(Checked<size_t> n)
    {
        if (n == m_size)
            return;

        Checked<size_t> initialSize = sizeof(T) * n;
        // Accelerate.framework behaves differently based on input vector alignment. And each implementation
        // has very small difference in output! We ensure 32byte alignment so that we will always take the most
        // optimized implementation if possible, which makes the result deterministic.
        constexpr size_t alignment = 32;

        fastAlignedFree(m_allocation);

        m_allocation = static_cast<T*>(fastAlignedMalloc(alignment, initialSize));
        if (!m_allocation)
            CRASH();
        m_size = n;
        zero();
    }

    std::span<T> span() { return { data(), size() }; }
    std::span<const T> span() const { return { data(), size() }; }
    T* data() { return m_allocation; }
    const T* data() const { return m_allocation; }
    size_t size() const { return m_size; }
    bool isEmpty() const { return !m_size; }

    T& at(size_t i)
    {
        // Note that although it is a size_t, m_size is now guaranteed to be
        // no greater than max unsigned. This guarantee is enforced in resize().
        ASSERT_WITH_SECURITY_IMPLICATION(i < size());
        return data()[i];
    }

    const T& at(size_t i) const
    {
        // Note that although it is a size_t, m_size is now guaranteed to be
        // no greater than max unsigned. This guarantee is enforced in resize().
        RELEASE_ASSERT(i < size());
        return data()[i];
    }

    T& operator[](size_t i) { return at(i); }
    const T& operator[](size_t i) const { return at(i); }

    void zero() { zeroSpan(span()); }

    void zeroRange(unsigned start, unsigned end)
    {
        bool isSafe = (start <= end) && (end <= size());
        ASSERT(isSafe);
        if (!isSafe)
            return;

        // This expression cannot overflow because end - start cannot be
        // greater than m_size, which is safe due to the check in resize().
        zeroSpan(span().subspan(start, end - start));
    }

    void copyToRange(const T* sourceData, unsigned start, unsigned end)
    {
        bool isSafe = (start <= end) && (end <= size());
        ASSERT(isSafe);
        if (!isSafe)
            return;

        // This expression cannot overflow because end - start cannot be
        // greater than m_size, which is safe due to the check in resize().
        memcpy(this->data() + start, sourceData, sizeof(T) * (end - start));
    }

    bool containsConstantValue() const
    {
        if (m_size <= 1)
            return true;
        float constant = data()[0];
        for (unsigned i = 1; i < m_size; ++i) {
            if (data()[i] != constant)
                return false;
        }
        return true;
    }

private:
    T* m_allocation { nullptr };
    size_t m_size { 0 };
};

typedef AudioArray<float> AudioFloatArray;
typedef AudioArray<double> AudioDoubleArray;

} // WebCore

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END

#endif // AudioArray_h
