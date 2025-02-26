/*
 * Copyright (C) 2014-2023 Apple Inc. All rights reserved.
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

#include <wtf/DebugHeap.h>
#include <wtf/DoublyLinkedList.h>
#include <wtf/Forward.h>
#include <wtf/Noncopyable.h>
#include <wtf/TZoneMalloc.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(GCSegmentedArray);

template <typename T>
class GCArraySegment : public DoublyLinkedListNode<GCArraySegment<T>> {
    friend class WTF::DoublyLinkedListNode<GCArraySegment<T>>;
public:
    GCArraySegment()
        : DoublyLinkedListNode<GCArraySegment<T>>()
#if ASSERT_ENABLED
        , m_top(0)
#endif
    {
    }

    static GCArraySegment* create();
    static void destroy(GCArraySegment*);

    T* data()
    {
        return std::bit_cast<T*>(this + 1);
    }

    static constexpr size_t blockSize = 4 * KB;

    GCArraySegment* m_prev;
    GCArraySegment* m_next;
#if ASSERT_ENABLED
    size_t m_top;
#endif
};

template <typename T> class GCSegmentedArrayIterator;

template <typename T>
class GCSegmentedArray {
    WTF_MAKE_TZONE_ALLOCATED(GCSegmentedArray);
    WTF_MAKE_NONCOPYABLE(GCSegmentedArray);
    friend class GCSegmentedArrayIterator<T>;
    friend class GCSegmentedArrayIterator<const T>;
public:
    GCSegmentedArray();
    ~GCSegmentedArray();

    void append(T);

    bool canRemoveLast();
    const T removeLast();
    bool refill();
    
    size_t size() const;
    bool isEmpty() const;

    void fillVector(Vector<T>&);
    void clear();

    typedef GCSegmentedArrayIterator<T> iterator;
    iterator begin() const { return GCSegmentedArrayIterator<T>(m_segments.head(), m_top); }
    iterator end() const { return GCSegmentedArrayIterator<T>(); }

protected:
    template <size_t size> struct CapacityFromSize {
        static constexpr size_t value = (size - sizeof(GCArraySegment<T>)) / sizeof(T);
    };

    void expand();
    
    size_t postIncTop();
    size_t preDecTop();
    void setTopForFullSegment();
    void setTopForEmptySegment();
    size_t top();
    
    void validatePrevious();

    DoublyLinkedList<GCArraySegment<T>> m_segments;

    JS_EXPORT_PRIVATE static const size_t s_segmentCapacity = CapacityFromSize<GCArraySegment<T>::blockSize>::value;
    size_t m_top;
    size_t m_numberOfSegments;
};

template <typename T>
class GCSegmentedArrayIterator {
    friend class GCSegmentedArray<T>;
public:
    GCSegmentedArrayIterator()
        : m_currentSegment(nullptr)
        , m_currentOffset(0)
    {
    }

    T& get() { return m_currentSegment->data()[m_currentOffset]; }
    T& operator*() { return get(); }
    T& operator->() { return get(); }

    bool operator==(const GCSegmentedArrayIterator& other) const
    {
        return m_currentSegment == other.m_currentSegment && m_currentOffset == other.m_currentOffset;
    }

    GCSegmentedArrayIterator& operator++()
    {
        ASSERT(m_currentSegment);

        m_currentOffset++;

        if (m_currentOffset >= m_offsetLimit) {
            m_currentSegment = m_currentSegment->next();
            m_currentOffset = 0;
            m_offsetLimit = GCSegmentedArray<T>::s_segmentCapacity;
        }

        return *this;
    }

private:
    GCSegmentedArrayIterator(GCArraySegment<T>* start, size_t top)
        : m_currentSegment(start)
        , m_currentOffset(0)
        , m_offsetLimit(top)
    {
        if (!m_offsetLimit)
            m_currentSegment = nullptr;
    }

    GCArraySegment<T>* m_currentSegment;
    size_t m_currentOffset;
    size_t m_offsetLimit;
};

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
