/*
 * Copyright (C) 2023 Apple Inc. All rights reserved.
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

#include "SIMDInfo.h"

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

class SIMDShuffle {
public:
    static std::optional<unsigned> isOnlyOneSideMask(v128_t pattern)
    {
        unsigned first = pattern.u8x16[0];
        if (first < 16) {
            for (unsigned i = 1; i < 16; ++i) {
                if (pattern.u8x16[i] >= 16)
                    return std::nullopt;
            }
            return 0;
        }

        if (first >= 32)
            return std::nullopt;

        for (unsigned i = 1; i < 16; ++i) {
            if (pattern.u8x16[i] < 16)
                return std::nullopt;
            if (pattern.u8x16[i] >= 32)
                return std::nullopt;
        }
        return 1;
    }

    static std::optional<uint8_t> isI8x16DupElement(v128_t pattern)
    {
        constexpr unsigned numberOfElements = 16 / sizeof(uint8_t);
        if (std::all_of(pattern.u8x16, pattern.u8x16 + numberOfElements, [&](auto value) { return value == pattern.u8x16[0]; })) {
            uint8_t lane = pattern.u8x16[0] / sizeof(uint8_t);
            if (lane < numberOfElements)
                return lane;
        }
        return std::nullopt;
    }

    static std::optional<uint8_t> isI16x8DupElement(v128_t pattern)
    {
        if (!isI16x8Shuffle(pattern))
            return std::nullopt;
        constexpr unsigned numberOfElements = 16 / sizeof(uint16_t);
        if (std::all_of(pattern.u16x8, pattern.u16x8 + numberOfElements, [&](auto value) { return value == pattern.u16x8[0]; })) {
            uint8_t lane = pattern.u8x16[0] / sizeof(uint16_t);
            if (lane < numberOfElements)
                return lane;
        }
        return std::nullopt;
    }

    static std::optional<uint8_t> isI32x4DupElement(v128_t pattern)
    {
        if (!isI32x4Shuffle(pattern))
            return std::nullopt;
        constexpr unsigned numberOfElements = 16 / sizeof(uint32_t);
        if (std::all_of(pattern.u32x4, pattern.u32x4 + numberOfElements, [&](auto value) { return value == pattern.u32x4[0]; })) {
            uint8_t lane = pattern.u8x16[0] / sizeof(uint32_t);
            if (lane < numberOfElements)
                return lane;
        }
        return std::nullopt;
    }

    static std::optional<uint8_t> isI64x2DupElement(v128_t pattern)
    {
        if (!isI64x2Shuffle(pattern))
            return std::nullopt;
        constexpr unsigned numberOfElements = 16 / sizeof(uint64_t);
        if (std::all_of(pattern.u64x2, pattern.u64x2 + numberOfElements, [&](auto value) { return value == pattern.u64x2[0]; })) {
            uint8_t lane = pattern.u8x16[0] / sizeof(uint64_t);
            if (lane < numberOfElements)
                return lane;
        }
        return std::nullopt;
    }

    static bool isI16x8Shuffle(v128_t pattern)
    {
        return isLargerElementShuffle(pattern, 2);
    }

    static bool isI32x4Shuffle(v128_t pattern)
    {
        return isLargerElementShuffle(pattern, 4);
    }

    static bool isI64x2Shuffle(v128_t pattern)
    {
        return isLargerElementShuffle(pattern, 8);
    }

    static bool isIdentity(v128_t pattern)
    {
        return isLargerElementShuffle(pattern, 16);
    }

    static bool isAllOutOfBoundsForUnaryShuffle(v128_t pattern)
    {
        for (unsigned i = 0; i < 16; ++i) {
            if constexpr (isX86()) {
                // https://www.felixcloutier.com/x86/pshufb
                // On x64, OOB index means that highest bit is set.
                // The acutal index is extracted by masking with 0b1111.
                // So, for example, 0x11 index (17) will be converted to 0x1 access (not OOB).
                if (!(pattern.u8x16[i] & 0x80))
                    return false;
            } else if constexpr (isARM64()) {
                // https://developer.arm.com/documentation/dui0801/g/A64-SIMD-Vector-Instructions/TBL--vector-
                // On ARM64, OOB index means out of 0..15 range for unary TBL.
                if (pattern.u8x16[i] < 16)
                    return false;
            } else
                return false;
        }
        return true;
    }

    static bool isAllOutOfBoundsForBinaryShuffle(v128_t pattern)
    {
        ASSERT(isARM64()); // Binary Shuffle is only supported by ARM64.
        for (unsigned i = 0; i < 16; ++i) {
            if (pattern.u8x16[i] < 32)
                return false;
        }
        return true;
    }

private:
    static bool isLargerElementShuffle(v128_t pattern, unsigned size)
    {
        unsigned numberOfElements = 16 / size;
        for (unsigned i = 0; i < numberOfElements; ++i) {
            unsigned firstIndex = i * size;
            unsigned first = pattern.u8x16[firstIndex];
            if (first % size != 0)
                return false;
            for (unsigned j = 1; j < size; ++j) {
                unsigned index = j + firstIndex;
                if (pattern.u8x16[index] != (first + j))
                    return false;
            }
        }
        return true;
    }
};

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
