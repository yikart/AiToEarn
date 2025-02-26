/*
 * Copyright (C) 2015-2023 Apple Inc. All rights reserved.
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
#include "JITOperationValidation.h"
#include "OperationResult.h"
#include <climits>
#include <cmath>
#include <optional>

namespace JSC {

const int32_t maxExponentForIntegerMathPow = 1000;
JSC_DECLARE_NOEXCEPT_JIT_OPERATION(operationMathPow, double, (double x, double y));
JSC_DECLARE_NOEXCEPT_JIT_OPERATION(operationToInt32, UCPUStrictInt32, (double));
JSC_DECLARE_NOEXCEPT_JIT_OPERATION(operationToInt32SensibleSlow, UCPUStrictInt32, (double));

constexpr double maxSafeInteger()
{
    // 2 ^ 53 - 1
    return 9007199254740991.0;
}

constexpr double minSafeInteger()
{
    // -(2 ^ 53 - 1)
    return -9007199254740991.0;
}

constexpr uint64_t maxSafeIntegerAsUInt64()
{
    // 2 ^ 53 - 1
    return 9007199254740991ULL;
}

inline bool isInteger(double value)
{
    return std::isfinite(value) && std::trunc(value) == value;
}

inline bool isInteger(float value)
{
    return std::isfinite(value) && std::trunc(value) == value;
}

inline bool isSafeInteger(double value)
{
    return std::trunc(value) == value && std::abs(value) <= maxSafeInteger();
}

inline bool isNegativeZero(double value)
{
    return std::signbit(value) && value == 0;
}

// This in the ToInt32 operation is defined in section 9.5 of the ECMA-262 spec.
// Note that this operation is identical to ToUInt32 other than to interpretation
// of the resulting bit-pattern (as such this method is also called to implement
// ToUInt32).
//
// The operation can be described as round towards zero, then select the 32 or 64 least
// bits of the resulting value in 2s-complement representation.
enum ToIntMode {
    Generic,
    Int32AfterSensibleConversionAttempt,
};
template<class Int, ToIntMode Mode = Generic>
ALWAYS_INLINE Int toIntImpl(double number)
{
    static_assert(std::is_same_v<Int, int32_t> || std::is_same_v<Int, int64_t>);
    constexpr unsigned intBytes = sizeof(Int);
    constexpr unsigned intBits = intBytes * CHAR_BIT;
    constexpr unsigned intBitsMinusOne = intBits - 1;
    static_assert(intBitsMinusOne == 63 || intBitsMinusOne == 31);
    using UInt = std::make_unsigned_t<Int>;

    uint64_t bits = std::bit_cast<uint64_t>(number);
    int32_t exp = (static_cast<int32_t>(bits >> 52) & 0x7ff) - 0x3ff;

    // If exponent < 0 there will be no bits to the left of the decimal point
    // after rounding; if the exponent is > maxExpForLeftShift then no bits of precision can be
    // left in the low intBits range of the result (IEEE-754 doubles have 52 bits
    // of fractional precision).
    // Note this case handles 0, -0, and all infinite, NaN, & denormal value.
    constexpr uint32_t maxExpForLeftShift = intBitsMinusOne + 52;

    // We need to check exp > maxExpForLeftShift because:
    // 1. exp may be used as a left shift value below in (exp - 52), and
    // 2. Left shift amounts that exceed intBitsMinusOne results in undefined behavior. See:
    //    http://en.cppreference.com/w/cpp/language/operator_arithmetic#Bitwise_shift_operators
    //
    // Using an unsigned comparison here also gives us a exp < 0 check for free.
    if (static_cast<uint32_t>(exp) > maxExpForLeftShift)
        return 0;

    // Select the appropriate intBits from the floating point mantissa. If the
    // exponent is 52 then the bits we need to select are already aligned to the
    // lowest bits of the 64-bit integer representation of the number, no need
    // to shift. If the exponent is greater than 52 we need to shift the value
    // left by (exp - 52), if the value is less than 52 we need to shift right
    // accordingly.
    UInt result = (exp > 52)
        ? static_cast<UInt>(bits << (exp - 52))
        : static_cast<UInt>(bits >> (52 - exp));

    // IEEE-754 double precision values are stored omitting an implicit 1 before
    // the decimal point; we need to reinsert this now. We may also the shifted
    // invalid bits into the result that are not a part of the mantissa (the sign
    // and exponent bits from the floatingpoint representation); mask these out.
    // Note that missingOne should be held as UInt since ((1 << intBitsMinusOne) - 1) causes
    // Int overflow.
    if constexpr (Mode == ToIntMode::Int32AfterSensibleConversionAttempt) {
        static_assert(intBitsMinusOne == 31);
        if (exp == intBitsMinusOne) {
            // This is an optimization for when toInt32() is called in the slow path
            // of a JIT operation. Currently, this optimization is only applicable for
            // x86 ports. This optimization offers 5% performance improvement in
            // kraken-crypto-pbkdf2.
            //
            // On x86, the fast path does a sensible double-to-int32 conversion, by
            // first attempting to truncate the double value to int32 using the
            // cvttsd2si_rr instruction. According to Intel's manual, cvttsd2si performs
            // the following truncate operation:
            //
            //     If src = NaN, +-Inf, or |(src)rz| > 0x7fffffff and (src)rz != 0x80000000,
            //     then the result becomes 0x80000000. Otherwise, the operation succeeds.
            //
            // Note that the ()rz notation means rounding towards zero.
            // We'll call the slow case function only when the above cvttsd2si fails. The
            // JIT code checks for fast path failure by checking if result == 0x80000000.
            // Hence, the slow path will only see the following possible set of numbers:
            //
            //     NaN, +-Inf, or |(src)rz| > 0x7fffffff.
            //
            // As a result, the exp of the double is always >= 31. We can take advantage
            // of this by specifically checking for (exp == 31) and give the compiler a
            // chance to constant fold the operations below.
            const constexpr UInt missingOne = static_cast<UInt>(1U) << intBitsMinusOne;
            result &= missingOne - 1;
            result += missingOne;
        }
    } else {
        if (exp < static_cast<int32_t>(intBits)) {
            const UInt missingOne = static_cast<UInt>(1U) << exp;
            result &= missingOne - 1;
            result += missingOne;
        }
    }

    // If the input value was negative (we could test either 'number' or 'bits',
    // but testing 'bits' is likely faster) invert the result appropriately.
    return static_cast<int64_t>(bits) < 0 ? -static_cast<Int>(result) : static_cast<Int>(result);
}

ALWAYS_INLINE int32_t toInt32(double number)
{
#if HAVE(FJCVTZS_INSTRUCTION)
    int32_t result = 0;
    __asm__ ("fjcvtzs %w0, %d1" : "=r" (result) : "w" (number) : "cc");
    return result;
#else
    return toIntImpl<int32_t>(number);
#endif
}

// This implements ToUInt32, defined in ECMA-262 9.6.
inline uint32_t toUInt32(double number)
{
    // As commented in the spec, the operation of ToInt32 and ToUint32 only differ
    // in how the result is interpreted; see NOTEs in sections 9.5 and 9.6.
    return toInt32(number);
}

ALWAYS_INLINE constexpr UCPUStrictInt32 toUCPUStrictInt32(int32_t value)
{
    // StrictInt32 format requires that higher bits are all zeros even if value is negative.
    return static_cast<UCPUStrictInt32>(static_cast<uint32_t>(value));
}

// This implementation follows https://tc39.es/ecma262/#sec-touint32 but use int64 instead.
ALWAYS_INLINE int64_t toInt64(double number)
{
    return toIntImpl<int64_t>(number);
}

ALWAYS_INLINE uint64_t toUInt64(double number)
{
    return static_cast<uint64_t>(toInt64(number));
}

inline std::optional<double> safeReciprocalForDivByConst(double constant)
{
    // No "weird" numbers (NaN, Denormal, etc).
    if (!constant || !std::isnormal(constant))
        return std::nullopt;

    int exponent;
    if (std::frexp(constant, &exponent) != 0.5)
        return std::nullopt;

    // Note that frexp() returns the value divided by two
    // so we to offset this exponent by one.
    exponent -= 1;

    // A double exponent is between -1022 and 1023.
    // Nothing we can do to invert 1023.
    if (exponent == 1023)
        return std::nullopt;

    double reciprocal = std::ldexp(1, -exponent);
    ASSERT(std::isnormal(reciprocal));
    ASSERT(1. / constant == reciprocal);
    ASSERT(constant == 1. / reciprocal);
    ASSERT(1. == constant * reciprocal);

    return reciprocal;
}

ALWAYS_INLINE bool canBeStrictInt32(double value)
{
    if (std::isinf(value) || std::isnan(value))
        return false;
    const int32_t asInt32 = static_cast<int32_t>(value);
    return !(asInt32 != value || (!asInt32 && std::signbit(value))); // true for -0.0
}

ALWAYS_INLINE bool canBeInt32(double value)
{
    if (std::isinf(value) || std::isnan(value))
        return false;
    return static_cast<int32_t>(value) == value;
}

extern "C" {
JSC_DECLARE_NOEXCEPT_JIT_OPERATION(jsRound, double, (double));
}

namespace Math {

// This macro defines a set of information about all known arith unary generic node.
#define FOR_EACH_ARITH_UNARY_OP_CUSTOM(macro) \
    macro(Log1p, log1p) \

#define FOR_EACH_ARITH_UNARY_OP_STD(macro) \
    macro(Sin, sin) \
    macro(Sinh, sinh) \
    macro(Cos, cos) \
    macro(Cosh, cosh) \
    macro(Tan, tan) \
    macro(Tanh, tanh) \
    macro(ASin, asin) \
    macro(ASinh, asinh) \
    macro(ACos, acos) \
    macro(ACosh, acosh) \
    macro(ATan, atan) \
    macro(ATanh, atanh) \
    macro(Log, log) \
    macro(Log10, log10) \
    macro(Log2, log2) \
    macro(Cbrt, cbrt) \
    macro(Exp, exp) \
    macro(Expm1, expm1) \

#define FOR_EACH_ARITH_UNARY_OP(macro) \
    FOR_EACH_ARITH_UNARY_OP_STD(macro) \
    FOR_EACH_ARITH_UNARY_OP_CUSTOM(macro) \

#define JSC_DEFINE_VIA_STD(capitalizedName, lowerName) \
    using std::lowerName; \
    JSC_DECLARE_NOEXCEPT_JIT_OPERATION(lowerName##Double, double, (double)); \
    JSC_DECLARE_NOEXCEPT_JIT_OPERATION(lowerName##Float, float, (float));
FOR_EACH_ARITH_UNARY_OP_STD(JSC_DEFINE_VIA_STD)
#undef JSC_DEFINE_VIA_STD

#define JSC_DEFINE_VIA_CUSTOM(capitalizedName, lowerName) \
    JS_EXPORT_PRIVATE double lowerName(double); \
    JSC_DECLARE_NOEXCEPT_JIT_OPERATION(lowerName##Double, double, (double)); \
    JSC_DECLARE_NOEXCEPT_JIT_OPERATION(lowerName##Float, float, (float));
FOR_EACH_ARITH_UNARY_OP_CUSTOM(JSC_DEFINE_VIA_CUSTOM)
#undef JSC_DEFINE_VIA_CUSTOM

template<typename FloatType>
ALWAYS_INLINE FloatType fMax(FloatType a, FloatType b)
{
    if (std::isnan(a) || std::isnan(b))
        return a + b;
    if (a == static_cast<FloatType>(0.0) && b == static_cast<FloatType>(0.0) && std::signbit(a) != std::signbit(b))
        return static_cast<FloatType>(0.0);
    return std::max(a, b);
}

template<typename FloatType>
ALWAYS_INLINE FloatType fMin(FloatType a, FloatType b)
{
    if (std::isnan(a) || std::isnan(b))
        return a + b;
    if (a == static_cast<FloatType>(0.0) && b == static_cast<FloatType>(0.0) && std::signbit(a) != std::signbit(b))
        return static_cast<FloatType>(-0.0);
    return std::min(a, b);
}

ALWAYS_INLINE double jsMaxDouble(double lhs, double rhs)
{
#if CPU(ARM64)
    // Intentionally using fmax, not fmaxnm since fmax is aligned to JS Math.max semantics.
    // fmaxnm returns non-NaN number when either lhs or rhs is NaN. But Math.max returns NaN.
    double result;
    asm (
        "fmax %d[result], %d[lhs], %d[rhs]"
        : [result] "=w"(result)
        : [lhs] "w"(lhs), [rhs] "w"(rhs)
        :
        );
    return result;
#else
    return fMax(lhs, rhs);
#endif
}

ALWAYS_INLINE double jsMinDouble(double lhs, double rhs)
{
#if CPU(ARM64)
    // Intentionally using fmin, not fminnm since fmin is aligned to JS Math.min semantics.
    // fminnm returns non-NaN number when either lhs or rhs is NaN. But Math.min returns NaN.
    double result;
    asm (
        "fmin %d[result], %d[lhs], %d[rhs]"
        : [result] "=w"(result)
        : [lhs] "w"(lhs), [rhs] "w"(rhs)
        :
        );
    return result;
#else
    return fMin(lhs, rhs);
#endif
}

JSC_DECLARE_NOEXCEPT_JIT_OPERATION(truncDouble, double, (double));
JSC_DECLARE_NOEXCEPT_JIT_OPERATION(truncFloat, float, (float));
JSC_DECLARE_NOEXCEPT_JIT_OPERATION(ceilDouble, double, (double));
JSC_DECLARE_NOEXCEPT_JIT_OPERATION(ceilFloat, float, (float));
JSC_DECLARE_NOEXCEPT_JIT_OPERATION(floorDouble, double, (double));
JSC_DECLARE_NOEXCEPT_JIT_OPERATION(floorFloat, float, (float));
JSC_DECLARE_NOEXCEPT_JIT_OPERATION(sqrtDouble, double, (double));
JSC_DECLARE_NOEXCEPT_JIT_OPERATION(sqrtFloat, float, (float));

JSC_DECLARE_NOEXCEPT_JIT_OPERATION(stdPowDouble, double, (double, double));
JSC_DECLARE_NOEXCEPT_JIT_OPERATION(stdPowFloat, float, (float, float));

JSC_DECLARE_NOEXCEPT_JIT_OPERATION(fmodDouble, double, (double, double));
JSC_DECLARE_NOEXCEPT_JIT_OPERATION(roundDouble, double, (double));
JSC_DECLARE_NOEXCEPT_JIT_OPERATION(jsRoundDouble, double, (double));
JSC_DECLARE_NOEXCEPT_JIT_OPERATION(roundFloat, float, (float));

JSC_DECLARE_NOEXCEPT_JIT_OPERATION(f32_nearest, float, (float));
JSC_DECLARE_NOEXCEPT_JIT_OPERATION(f64_nearest, double, (double));
JSC_DECLARE_NOEXCEPT_JIT_OPERATION(f32_roundeven, float, (float));
JSC_DECLARE_NOEXCEPT_JIT_OPERATION(f64_roundeven, double, (double));
JSC_DECLARE_NOEXCEPT_JIT_OPERATION(f32_trunc, float, (float));
JSC_DECLARE_NOEXCEPT_JIT_OPERATION(f64_trunc, double, (double));

JSC_DECLARE_NOEXCEPT_JIT_OPERATION(i32_div_s, int32_t, (int32_t, int32_t));
JSC_DECLARE_NOEXCEPT_JIT_OPERATION(i32_div_u, uint32_t, (uint32_t, uint32_t));
JSC_DECLARE_NOEXCEPT_JIT_OPERATION(i32_rem_s, int32_t, (int32_t, int32_t));
JSC_DECLARE_NOEXCEPT_JIT_OPERATION(i32_rem_u, uint32_t, (uint32_t, uint32_t));
JSC_DECLARE_NOEXCEPT_JIT_OPERATION(i64_div_s, int64_t, (int64_t, int64_t));
JSC_DECLARE_NOEXCEPT_JIT_OPERATION(i64_div_u, uint64_t, (uint64_t, uint64_t));
JSC_DECLARE_NOEXCEPT_JIT_OPERATION(i64_rem_s, int64_t, (int64_t, int64_t));
JSC_DECLARE_NOEXCEPT_JIT_OPERATION(i64_rem_u, uint64_t, (uint64_t, uint64_t));

JSC_DECLARE_NOEXCEPT_JIT_OPERATION(i64_trunc_u_f32, uint64_t, (float));
JSC_DECLARE_NOEXCEPT_JIT_OPERATION(i64_trunc_s_f32, int64_t, (float));
JSC_DECLARE_NOEXCEPT_JIT_OPERATION(i64_trunc_u_f64, uint64_t, (double));
JSC_DECLARE_NOEXCEPT_JIT_OPERATION(i64_trunc_s_f64, int64_t, (double));

JSC_DECLARE_NOEXCEPT_JIT_OPERATION(f32_convert_u_i64, float, (uint64_t));
JSC_DECLARE_NOEXCEPT_JIT_OPERATION(f32_convert_s_i64, float, (int64_t));
JSC_DECLARE_NOEXCEPT_JIT_OPERATION(f64_convert_u_i64, double, (uint64_t));
JSC_DECLARE_NOEXCEPT_JIT_OPERATION(f64_convert_s_i64, double, (int64_t));

} // namespace Math
} // namespace JSC
