/*
 * Copyright (C) 2012 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. 
 */

#pragma once

#include <wtf/StdLibExtras.h>

namespace JSC {

typedef int PropertyOffset;

static constexpr PropertyOffset invalidOffset = -1;
static constexpr PropertyOffset firstOutOfLineOffset = 64;
static constexpr PropertyOffset knownPolyProtoOffset = 0;
static_assert(knownPolyProtoOffset < firstOutOfLineOffset, "We assume in all the JITs that the poly proto offset is an inline offset");

// Declare all of the functions because they tend to do forward calls.
constexpr inline void checkOffset(PropertyOffset);
constexpr inline void checkOffset(PropertyOffset, int inlineCapacity);
constexpr inline void validateOffset(PropertyOffset);
constexpr inline void validateOffset(PropertyOffset, int inlineCapacity);
constexpr inline bool isValidOffset(PropertyOffset);
constexpr inline bool isInlineOffset(PropertyOffset);
constexpr inline bool isOutOfLineOffset(PropertyOffset);
constexpr inline intptr_t offsetInInlineStorage(PropertyOffset);
constexpr inline intptr_t offsetInOutOfLineStorage(PropertyOffset);
constexpr inline intptr_t offsetInRespectiveStorage(PropertyOffset);
constexpr inline size_t numberOfOutOfLineSlotsForMaxOffset(PropertyOffset);
constexpr inline size_t numberOfSlotsForMaxOffset(PropertyOffset, int inlineCapacity);

constexpr inline void checkOffset(PropertyOffset offset)
{
    UNUSED_PARAM(offset);
    ASSERT(offset >= invalidOffset);
}

constexpr inline void checkOffset(PropertyOffset offset, int inlineCapacity)
{
    UNUSED_PARAM(offset);
    UNUSED_PARAM(inlineCapacity);
    ASSERT(offset >= invalidOffset);
    ASSERT(offset == invalidOffset
        || offset < inlineCapacity
        || isOutOfLineOffset(offset));
}

constexpr inline void validateOffset(PropertyOffset offset)
{
    checkOffset(offset);
    ASSERT(isValidOffset(offset));
}

constexpr inline void validateOffset(PropertyOffset offset, int inlineCapacity)
{
    checkOffset(offset, inlineCapacity);
    ASSERT(isValidOffset(offset));
}

constexpr inline bool isValidOffset(PropertyOffset offset)
{
    checkOffset(offset);
    return offset != invalidOffset;
}

constexpr inline bool isInlineOffset(PropertyOffset offset)
{
    checkOffset(offset);
    return offset < firstOutOfLineOffset;
}

constexpr inline bool isOutOfLineOffset(PropertyOffset offset)
{
    checkOffset(offset);
    return !isInlineOffset(offset);
}

constexpr inline intptr_t offsetInInlineStorage(PropertyOffset offset)
{
    validateOffset(offset);
    ASSERT(isInlineOffset(offset));
    return offset;
}

constexpr inline intptr_t offsetInOutOfLineStorage(PropertyOffset offset)
{
    validateOffset(offset);
    ASSERT(isOutOfLineOffset(offset));
    return -static_cast<ptrdiff_t>(offset - firstOutOfLineOffset) - 1;
}

constexpr inline intptr_t offsetInRespectiveStorage(PropertyOffset offset)
{
    if (isInlineOffset(offset))
        return offsetInInlineStorage(offset);
    return offsetInOutOfLineStorage(offset);
}

constexpr inline size_t numberOfOutOfLineSlotsForMaxOffset(PropertyOffset offset)
{
    checkOffset(offset);
    if (offset < firstOutOfLineOffset)
        return 0;
    return offset - firstOutOfLineOffset + 1;
}

constexpr inline size_t numberOfSlotsForMaxOffset(PropertyOffset offset, int inlineCapacity)
{
    checkOffset(offset, inlineCapacity);
    if (offset < inlineCapacity)
        return offset + 1;
    return inlineCapacity + numberOfOutOfLineSlotsForMaxOffset(offset);
}

constexpr inline PropertyOffset offsetForPropertyNumber(int propertyNumber, int inlineCapacity)
{
    PropertyOffset offset = propertyNumber;
    if (offset >= inlineCapacity) {
        offset += firstOutOfLineOffset;
        offset -= inlineCapacity;
    }
    return offset;
}

} // namespace JSC
