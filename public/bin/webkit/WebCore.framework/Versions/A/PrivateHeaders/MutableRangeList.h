/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
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

#include "MutableRange.h"

#if ENABLE(CONTENT_EXTENSIONS)

namespace WebCore {

namespace ContentExtensions {

// A range list keeps ranges sorted. Ranges are not sorted in the vector, but
template <typename CharacterType, typename DataType, unsigned inlineCapacity = 0>
class MutableRangeList {
    typedef MutableRange<CharacterType, DataType> TypedMutableRange;
public:
    class ConstIterator {
    public:
        const MutableRangeList& rangeList;
        uint32_t index;
        bool atEnd;

        using iterator_category = std::forward_iterator_tag;
        using value_type = TypedMutableRange;
        using difference_type = ptrdiff_t;
        using pointer = const value_type*;
        using reference = const value_type&;

        const TypedMutableRange& operator*() const { return rangeList.m_ranges[index]; }
        const TypedMutableRange* operator->() const { return &rangeList.m_ranges[index]; }

        CharacterType first() const { return rangeList.m_ranges[index].first; }
        CharacterType last() const { return rangeList.m_ranges[index].last; }
        CharacterType data() const { return rangeList.m_ranges[index].data; }

        bool operator==(const ConstIterator& other) const
        {
            ASSERT(&rangeList == &other.rangeList);
            if (atEnd || other.atEnd)
                return atEnd == other.atEnd;
            return index == other.index;
        }

        ConstIterator& operator++()
        {
            ASSERT(!atEnd);
            index = rangeList.m_ranges[index].nextRangeIndex;
            if (!index)
                atEnd = true;
            return *this;
        }
    };

    ConstIterator begin() const { return ConstIterator { *this, 0, m_ranges.isEmpty() }; }
    ConstIterator end() const { return ConstIterator { *this, 0, true }; }

    uint32_t appendRange(uint32_t lastRangeIndex, CharacterType first, CharacterType last, const DataType& data)
    {
        uint32_t newRangeIndex = m_ranges.size();
        m_ranges.append(TypedMutableRange(data, 0, first, last));
        if (!newRangeIndex)
            return 0;

        ASSERT(!m_ranges[lastRangeIndex].nextRangeIndex);
        ASSERT(m_ranges[lastRangeIndex].last < first);

        m_ranges[lastRangeIndex].nextRangeIndex = newRangeIndex;
        return newRangeIndex;
    }

    template <typename RangeIterator, typename DataConverter>
    void extend(RangeIterator otherIterator, RangeIterator otherEnd, DataConverter dataConverter)
    {
        if (otherIterator == otherEnd)
            return;

        if (m_ranges.isEmpty()) {
            initializeFrom(otherIterator, otherEnd, dataConverter);
            return;
        }

        bool reachedSelfEnd = false;
        uint32_t lastSelfRangeIndex = 0;
        uint32_t selfRangeIndex = 0;

        auto otherRangeOffset = otherIterator.first(); // To get the right type :)
        otherRangeOffset = 0;

        do {
            TypedMutableRange* activeSelfRange = &m_ranges[selfRangeIndex];

            // First, we move forward until we find something interesting.
            if (activeSelfRange->last < otherIterator.first() + otherRangeOffset) {
                lastSelfRangeIndex = selfRangeIndex;
                selfRangeIndex = activeSelfRange->nextRangeIndex;
                reachedSelfEnd = !selfRangeIndex;
                continue;
            }
            if (otherIterator.last() < activeSelfRange->first) {
                insertBetween(lastSelfRangeIndex, selfRangeIndex, otherIterator.first() + otherRangeOffset, otherIterator.last(), dataConverter.convert(otherIterator.data()));

                ++otherIterator;
                otherRangeOffset = 0;
                continue;
            }

            // If we reached here, we have:
            // 1) activeRangeA->last >= activeRangeB->first.
            // 2) activeRangeA->first <= activeRangeB->last.
            // But we don't know how they collide.

            // Do we have a part on the left? Create a new range for it.
            if (activeSelfRange->first < otherIterator.first() + otherRangeOffset) {
                DataType copiedData = activeSelfRange->data;
                CharacterType newRangeFirstCharacter = activeSelfRange->first;
                activeSelfRange->first = otherIterator.first() + otherRangeOffset;
                insertBetween(lastSelfRangeIndex, selfRangeIndex, newRangeFirstCharacter, otherIterator.first() + otherRangeOffset - 1, WTFMove(copiedData));
                activeSelfRange = &m_ranges[selfRangeIndex];
            } else if (otherIterator.first() + otherRangeOffset < activeSelfRange->first) {
                insertBetween(lastSelfRangeIndex, selfRangeIndex, otherIterator.first() + otherRangeOffset, activeSelfRange->first - 1, dataConverter.convert(otherIterator.data()));

                activeSelfRange = &m_ranges[selfRangeIndex];
                ASSERT_WITH_MESSAGE(otherRangeOffset < activeSelfRange->first - otherIterator.first(), "The offset must move forward or we could get stuck on this operation.");
                otherRangeOffset = activeSelfRange->first - otherIterator.first();
            }

            // Here, we know both ranges start at the same point, we need to create the part that intersect
            // and merge the data.

            if (activeSelfRange->last == otherIterator.last()) {
                // If they finish together, things are really easy: we just add B to A.
                dataConverter.extend(activeSelfRange->data, otherIterator.data());

                lastSelfRangeIndex = selfRangeIndex;
                selfRangeIndex = activeSelfRange->nextRangeIndex;
                reachedSelfEnd = !selfRangeIndex;

                ++otherIterator;
                otherRangeOffset = 0;
                continue;
            }

            if (activeSelfRange->last > otherIterator.last()) {
                // If A is bigger than B, we add a merged version and move A to the right.

                CharacterType combinedPartStart = activeSelfRange->first;
                activeSelfRange->first = otherIterator.last() + 1;

                DataType combinedData = activeSelfRange->data;
                dataConverter.extend(combinedData, otherIterator.data());
                insertBetween(lastSelfRangeIndex, selfRangeIndex, combinedPartStart, otherIterator.last(), WTFMove(combinedData));

                ++otherIterator;
                otherRangeOffset = 0;
                continue;
            }

            // If we reached here, B ends after A. We merge the intersection and move on.
            ASSERT(otherIterator.last() > activeSelfRange->last);
            dataConverter.extend(activeSelfRange->data, otherIterator.data());

            otherRangeOffset = activeSelfRange->last - otherIterator.first() + 1;
            lastSelfRangeIndex = selfRangeIndex;
            selfRangeIndex = activeSelfRange->nextRangeIndex;
            reachedSelfEnd = !selfRangeIndex;
        } while (!reachedSelfEnd && otherIterator != otherEnd);

        while (otherIterator != otherEnd) {
            lastSelfRangeIndex = appendRange(lastSelfRangeIndex, otherIterator.first() + otherRangeOffset, otherIterator.last(), dataConverter.convert(otherIterator.data()));
            otherRangeOffset = 0;
            ++otherIterator;
        }
    }

    unsigned size() const
    {
        return m_ranges.size();
    }

    bool isEmpty() const
    {
        return m_ranges.isEmpty();
    }

    void clear()
    {
        m_ranges.clear();
    }

#if CONTENT_EXTENSIONS_STATE_MACHINE_DEBUGGING
    void debugPrint() const
    {
        for (const TypedMutableRange& range : *this)
            WTFLogAlways("    %d-%d", range.first, range.last);
    }
#endif

    Vector<MutableRange<CharacterType, DataType>, inlineCapacity, ContentExtensionsOverflowHandler> m_ranges;
private:
    void insertBetween(uint32_t& leftRangeIndex, uint32_t& rightRangeIndex, CharacterType first, CharacterType last, DataType&& data)
    {
        ASSERT(m_ranges[rightRangeIndex].first > last);

        if (!rightRangeIndex) {
            // This is a special case. We always keep the first range as the first element in the vector.
            uint32_t movedRangeIndex = m_ranges.size();
            m_ranges.append(WTFMove(m_ranges.first()));
            m_ranges[0] = TypedMutableRange(WTFMove(data), movedRangeIndex, first, last);
            leftRangeIndex = 0;
            rightRangeIndex = movedRangeIndex;
            return;
        }

        ASSERT(m_ranges[leftRangeIndex].nextRangeIndex == rightRangeIndex);
        ASSERT(m_ranges[leftRangeIndex].last < first);

        uint32_t newRangeIndex = m_ranges.size();
        m_ranges.append(TypedMutableRange(WTFMove(data), rightRangeIndex, first, last));
        m_ranges[leftRangeIndex].nextRangeIndex = newRangeIndex;
        leftRangeIndex = newRangeIndex;
    }

    template <typename RangeIterator, typename DataConverter>
    void initializeFrom(RangeIterator otherIterator, RangeIterator otherEnd, DataConverter dataConverter)
    {
        ASSERT_WITH_MESSAGE(otherIterator != otherEnd, "We should never do anything when extending with a null range.");
        ASSERT_WITH_MESSAGE(m_ranges.isEmpty(), "This code does not handle splitting, it can only be used on empty RangeList.");

        uint32_t loopCounter = 0;
        do {
            m_ranges.append(TypedMutableRange(dataConverter.convert(otherIterator.data()),
                loopCounter + 1,
                otherIterator.first(),
                otherIterator.last()));
            ++loopCounter;
            ++otherIterator;
        } while (otherIterator != otherEnd);

        if (!m_ranges.isEmpty())
            m_ranges.last().nextRangeIndex = 0;
    }
};

} // namespace ContentExtensions
} // namespace WebCore

#endif // ENABLE(CONTENT_EXTENSIONS)
