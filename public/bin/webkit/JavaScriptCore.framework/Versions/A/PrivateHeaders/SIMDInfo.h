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

#include <wtf/PrintStream.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

typedef union v128_u {
    float f32x4[4];
    double f64x2[2];
    uint8_t u8x16[16];
    uint16_t u16x8[8];
    uint32_t u32x4[4];
    uint64_t u64x2[2] = { 0, 0 };

    constexpr v128_u() = default;
    constexpr v128_u(uint64_t first, uint64_t second)
        : u64x2 { first, second }
    { }
} v128_t;

constexpr v128_t vectorAllOnes()
{
    return v128_t { UINT64_MAX, UINT64_MAX };
}

constexpr v128_t vectorAllZeros()
{
    return v128_t { 0, 0 };
}

// Comparing based on bits. Not using float/double comparison.
constexpr bool bitEquals(const v128_t& lhs, const v128_t rhs)
{
    return lhs.u64x2[0] == rhs.u64x2[0] && lhs.u64x2[1] == rhs.u64x2[1];
}

constexpr v128_t vectorOr(v128_t lhs, v128_t rhs)
{
    return v128_t { lhs.u64x2[0] | rhs.u64x2[0], lhs.u64x2[1] | rhs.u64x2[1] };
}

constexpr v128_t vectorAnd(v128_t lhs, v128_t rhs)
{
    return v128_t { lhs.u64x2[0] & rhs.u64x2[0], lhs.u64x2[1] & rhs.u64x2[1] };
}

constexpr v128_t vectorXor(v128_t lhs, v128_t rhs)
{
    return v128_t { lhs.u64x2[0] ^ rhs.u64x2[0], lhs.u64x2[1] ^ rhs.u64x2[1] };
}

enum class SIMDLane : uint8_t {
    v128 = 0,
    i8x16,
    i16x8,
    i32x4,
    i64x2,
    f32x4,
    f64x2,
};
static constexpr unsigned bitsOfSIMDLane = 6;

enum class SIMDSignMode : uint8_t {
    None = 0,
    Signed,
    Unsigned,
};
static constexpr unsigned bitsOfSIMDSignMode = 2;

struct SIMDInfo {
    SIMDLane lane : bitsOfSIMDLane { SIMDLane::v128 };
    SIMDSignMode signMode : bitsOfSIMDSignMode { SIMDSignMode::None };

    constexpr SIMDInfo(SIMDLane passedLane, SIMDSignMode passedSignMode)
        : lane(passedLane)
        , signMode(passedSignMode)
    { }

    constexpr SIMDInfo() = default;

    friend bool operator==(const SIMDInfo&, const SIMDInfo&) = default;
};

constexpr uint8_t elementCount(SIMDLane lane)
{
    switch (lane) {
    case SIMDLane::i8x16:
        return 16;
    case SIMDLane::i16x8:
        return 8;
    case SIMDLane::f32x4:
    case SIMDLane::i32x4:
        return 4;
    case SIMDLane::f64x2:
    case SIMDLane::i64x2:
        return 2;
    case SIMDLane::v128:
        RELEASE_ASSERT_NOT_REACHED();
    }
    RELEASE_ASSERT_NOT_REACHED();
}

constexpr bool scalarTypeIsFloatingPoint(SIMDLane lane)
{
    switch (lane) {
    case SIMDLane::f32x4:
    case SIMDLane::f64x2:
        return true;
    default:
        return false;
    }
}

constexpr bool scalarTypeIsIntegral(SIMDLane lane)
{
    switch (lane) {
    case SIMDLane::i8x16:
    case SIMDLane::i16x8:
    case SIMDLane::i32x4:
    case SIMDLane::i64x2:
        return true;
    default:
        return false;
    }
}

constexpr SIMDLane narrowedLane(SIMDLane lane)
{
    switch (lane) {
    case SIMDLane::v128:
    case SIMDLane::i8x16:
    case SIMDLane::f32x4:
        RELEASE_ASSERT_NOT_REACHED();
        return lane;
    case SIMDLane::i16x8:
        return SIMDLane::i8x16;
    case SIMDLane::i32x4:
        return SIMDLane::i16x8;
    case SIMDLane::i64x2:
        return SIMDLane::i32x4;
    case SIMDLane::f64x2:
        return SIMDLane::f32x4;
    }
    RELEASE_ASSERT_NOT_REACHED();
}

constexpr SIMDLane promotedLane(SIMDLane lane)
{
    switch (lane) {
    case SIMDLane::v128:
    case SIMDLane::i64x2:
    case SIMDLane::f64x2:
        RELEASE_ASSERT_NOT_REACHED();
        return lane;
    case SIMDLane::i8x16:
        return SIMDLane::i16x8;
    case SIMDLane::i16x8:
        return SIMDLane::i32x4;
    case SIMDLane::i32x4:
        return SIMDLane::i64x2;
    case SIMDLane::f32x4:
        return SIMDLane::f64x2;
    }
    RELEASE_ASSERT_NOT_REACHED();
}

constexpr unsigned elementByteSize(SIMDLane simdLane)
{
    switch (simdLane) {
    case SIMDLane::i8x16:
        return 1;
    case SIMDLane::i16x8:
        return 2;
    case SIMDLane::i32x4:
    case SIMDLane::f32x4:
        return 4;
    case SIMDLane::i64x2:
    case SIMDLane::f64x2:
        return 8;
    case SIMDLane::v128:
        return 16;
    }
    RELEASE_ASSERT_NOT_REACHED();
}

} // namespace JSC

namespace WTF {

JS_EXPORT_PRIVATE void printInternal(PrintStream& out, JSC::SIMDLane);

JS_EXPORT_PRIVATE void printInternal(PrintStream& out, JSC::SIMDSignMode);

JS_EXPORT_PRIVATE void printInternal(PrintStream& out, JSC::v128_t);

} // namespace WTF

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
