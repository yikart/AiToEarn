/*
 * Copyright (C) 2022 Apple Inc. All rights reserved.
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

#include "CPU.h"

#include <wtf/PrintStream.h>

namespace JSC {

enum class Width : uint8_t {
    Width8,
    Width16,
    Width32,
    Width64,
    Width128,
};
static constexpr Width Width8 = Width::Width8;
static constexpr Width Width16 = Width::Width16;
static constexpr Width Width32 = Width::Width32;
static constexpr Width Width64 = Width::Width64;
static constexpr Width Width128 = Width::Width128;

#if CPU(ADDRESS64)
static constexpr Width WidthPtr = Width::Width64;
#else
static constexpr Width WidthPtr = Width::Width32;
#endif

enum class PreservedWidth : uint8_t {
    PreservesNothing = 0,
    Preserves64 = 1,
};
static constexpr PreservedWidth PreservesNothing = PreservedWidth::PreservesNothing;
static constexpr PreservedWidth Preserves64 = PreservedWidth::Preserves64;

ALWAYS_INLINE constexpr Width widthForBytes(unsigned bytes)
{
    switch (bytes) {
    case 0:
    case 1:
        return Width8;
    case 2:
        return Width16;
    case 3:
    case 4:
        return Width32;
    case 5:
    case 6:
    case 7:
    case 8:
        return Width64;
    default:
        return Width128;
    }
}

ALWAYS_INLINE constexpr unsigned bytesForWidth(Width width)
{
    switch (width) {
    case Width8:
        return 1;
    case Width16:
        return 2;
    case Width32:
        return 4;
    case Width64:
        return 8;
    case Width128:
        return 16;
    }
    RELEASE_ASSERT_NOT_REACHED();
    return 0;
}

ALWAYS_INLINE constexpr unsigned alignmentForWidth(Width width)
{
    switch (width) {
    case Width8:
        return 1;
    case Width16:
        return 2;
    case Width32:
        return 4;
    case Width64:
        return 8;
    case Width128:
        return 8;
    }
    RELEASE_ASSERT_NOT_REACHED();
    return 0;
}

inline constexpr uint64_t mask(Width width)
{
    switch (width) {
    case Width8:
        return 0x00000000000000ffllu;
    case Width16:
        return 0x000000000000ffffllu;
    case Width32:
        return 0x00000000ffffffffllu;
    case Width64:
        return 0xffffffffffffffffllu;
    case Width128:
        RELEASE_ASSERT_NOT_REACHED();
        return 0;
    }
    RELEASE_ASSERT_NOT_REACHED();
    return 0;
}

constexpr Width pointerWidth()
{
    if (isAddress64Bit())
        return Width64;
    return Width32;
}

constexpr Width registerWidth()
{
    if (isRegister64Bit())
        return Width64;
    return Width32;
}

inline Width canonicalWidth(Width width)
{
    return std::max(Width32, width);
}

inline bool isCanonicalWidth(Width width)
{
    return width >= Width32;
}

} // namespace JSC

namespace WTF {

void printInternal(PrintStream& out, JSC::Width width);

} // namespace WTF
