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

#if ENABLE(CONTENT_EXTENSIONS)

namespace WebCore {

namespace ContentExtensions {

template <typename CharacterType, typename DataType>
class MutableRange {
    typedef MutableRange<CharacterType, DataType> TypedMutableRange;
public:
    MutableRange(uint32_t nextRangeIndex, CharacterType first, CharacterType last)
        : nextRangeIndex(nextRangeIndex)
        , first(first)
        , last(last)
    {
        ASSERT(first <= last);
    }

    MutableRange(const DataType& data, uint32_t nextRangeIndex, CharacterType first, CharacterType last)
        : data(data)
        , nextRangeIndex(nextRangeIndex)
        , first(first)
        , last(last)
    {
        ASSERT(first <= last);
    }

    MutableRange(DataType&& data, uint32_t nextRangeIndex, CharacterType first, CharacterType last)
        : data(WTFMove(data))
        , nextRangeIndex(nextRangeIndex)
        , first(first)
        , last(last)
    {
        ASSERT(first <= last);
    }

    MutableRange(MutableRange&& other)
        : data(WTFMove(other.data))
        , nextRangeIndex(other.nextRangeIndex)
        , first(other.first)
        , last(other.last)
    {
        ASSERT(first <= last);
    }

    TypedMutableRange& operator=(TypedMutableRange&& other)
    {
        data = WTFMove(other.data);
        nextRangeIndex = WTFMove(other.nextRangeIndex);
        first = WTFMove(other.first);
        last = WTFMove(other.last);
        return *this;
    }

    DataType data;

    // We use a funny convention: if there are no nextRange, the nextRangeIndex is zero.
    // This is faster to check than a special value in many cases.
    // We can use zero because ranges can only form a chain, and the first range is always zero by convention.
    // When we insert something in from of the first range, we swap the values.
    uint32_t nextRangeIndex;
    CharacterType first;
    CharacterType last;
};

} // namespace ContentExtensions
} // namespace WebCore

#endif // ENABLE(CONTENT_EXTENSIONS)
