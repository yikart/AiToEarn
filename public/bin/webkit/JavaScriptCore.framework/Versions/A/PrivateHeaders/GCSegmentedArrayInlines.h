/*
 * Copyright (C) 2014-2021 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "GCSegmentedArray.h"

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

template <typename T>
GCSegmentedArray<T>::GCSegmentedArray()
    : m_top(0)
    , m_numberOfSegments(0)
{
    m_segments.push(GCArraySegment<T>::create());
    m_numberOfSegments++;
}

template <typename T>
GCSegmentedArray<T>::~GCSegmentedArray()
{
    ASSERT(m_numberOfSegments == 1);
    ASSERT(m_segments.size() == 1);
    GCArraySegment<T>::destroy(m_segments.removeHead());
    m_numberOfSegments--;
    ASSERT(!m_numberOfSegments);
    ASSERT(!m_segments.size());
}

template <typename T>
void GCSegmentedArray<T>::clear()
{
    if (!m_segments.head())
        return;
    GCArraySegment<T>* next;
    for (GCArraySegment<T>* current = m_segments.head(); current->next(); current = next) {
        next = current->next();
        m_segments.remove(current);
        GCArraySegment<T>::destroy(current);
    }
    m_top = 0;
    m_numberOfSegments = 1;
#if ASSERT_ENABLED
    m_segments.head()->m_top = 0;
#endif
}

template <typename T>
void GCSegmentedArray<T>::expand()
{
    ASSERT(m_segments.head()->m_top == s_segmentCapacity);
    
    GCArraySegment<T>* nextSegment = GCArraySegment<T>::create();
    m_numberOfSegments++;
    
#if ASSERT_ENABLED
    nextSegment->m_top = 0;
#endif

    m_segments.push(nextSegment);
    setTopForEmptySegment();
    validatePrevious();
}

template <typename T>
bool GCSegmentedArray<T>::refill()
{
    validatePrevious();
    if (top())
        return true;
    GCArraySegment<T>::destroy(m_segments.removeHead());
    ASSERT(m_numberOfSegments > 1);
    m_numberOfSegments--;
    setTopForFullSegment();
    validatePrevious();
    return true;
}

template <typename T>
void GCSegmentedArray<T>::fillVector(Vector<T>& vector)
{
    ASSERT(vector.size() == size());

    GCArraySegment<T>* currentSegment = m_segments.head();
    if (!currentSegment)
        return;

    unsigned count = 0;
    for (unsigned i = 0; i < m_top; ++i) {
        ASSERT(currentSegment->data()[i]);
        vector[count++] = currentSegment->data()[i];
    }

    currentSegment = currentSegment->next();
    while (currentSegment) {
        for (unsigned i = 0; i < s_segmentCapacity; ++i) {
            ASSERT(currentSegment->data()[i]);
            vector[count++] = currentSegment->data()[i];
        }
        currentSegment = currentSegment->next();
    }
}

template <typename T>
inline GCArraySegment<T>* GCArraySegment<T>::create()
{
    return new (NotNull, GCSegmentedArrayMalloc::malloc(blockSize)) GCArraySegment<T>();
}

template <typename T>
inline void GCArraySegment<T>::destroy(GCArraySegment* segment)
{
    segment->~GCArraySegment();
    GCSegmentedArrayMalloc::free(segment);
}

template <typename T>
inline size_t GCSegmentedArray<T>::postIncTop()
{
    size_t result = m_top++;
    ASSERT(result == m_segments.head()->m_top++);
    return result;
}

template <typename T>
inline size_t GCSegmentedArray<T>::preDecTop()
{
    size_t result = --m_top;
    ASSERT(result == --m_segments.head()->m_top);
    return result;
}

template <typename T>
inline void GCSegmentedArray<T>::setTopForFullSegment()
{
    ASSERT(m_segments.head()->m_top == s_segmentCapacity);
    m_top = s_segmentCapacity;
}

template <typename T>
inline void GCSegmentedArray<T>::setTopForEmptySegment()
{
    ASSERT(!m_segments.head()->m_top);
    m_top = 0;
}

template <typename T>
inline size_t GCSegmentedArray<T>::top()
{
    ASSERT(m_top == m_segments.head()->m_top);
    return m_top;
}

template <typename T>
#if ASSERT_ENABLED
inline void GCSegmentedArray<T>::validatePrevious()
{
    ASSERT(m_segments.size() == m_numberOfSegments);
}
#else
inline void GCSegmentedArray<T>::validatePrevious() { }
#endif // ASSERT_ENABLED

template <typename T>
inline void GCSegmentedArray<T>::append(T value)
{
    if (m_top == s_segmentCapacity)
        expand();
    m_segments.head()->data()[postIncTop()] = value;
}

template <typename T>
inline bool GCSegmentedArray<T>::canRemoveLast()
{
    return !!m_top;
}

template <typename T>
inline const T GCSegmentedArray<T>::removeLast()
{
    return m_segments.head()->data()[preDecTop()];
}

template <typename T>
inline bool GCSegmentedArray<T>::isEmpty() const
{
    // This happens to be safe to call concurrently. It's important to preserve that capability.
    if (m_top)
        return false;
    if (m_segments.head()->next())
        return false;
    return true;
}

template <typename T>
inline size_t GCSegmentedArray<T>::size() const
{
    return m_top + s_segmentCapacity * (m_numberOfSegments - 1);
}

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
