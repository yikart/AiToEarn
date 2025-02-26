/*
 * Copyright (C) 2017 Caio Lima <ticaiolima@gmail.com>
 * Copyright (C) 2019-2022 Apple Inc. All rights reserved.
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
#include "Error.h"
#include "ExceptionHelpers.h"
#include "JSObject.h"
#include "MathCommon.h"
#include <wtf/CagedUniquePtr.h>
#include <wtf/Int128.h>
#include <wtf/text/StringBuilder.h>
#include <wtf/text/StringView.h>
#include <wtf/text/WTFString.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

class Int32BigIntImpl;
class HeapBigIntImpl;

class JSBigInt final : public JSCell {
public:
    using Base = JSCell;
    using Digit = UCPURegister;

    static constexpr unsigned StructureFlags = Base::StructureFlags | StructureIsImmortal | OverridesPut;
    friend class CachedBigInt;

    DECLARE_VISIT_CHILDREN;

    template<typename CellType, SubspaceAccess>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        return &vm.bigIntSpace();
    }

    enum class InitializationType { None, WithZero };
    void initialize(InitializationType);

    static size_t estimatedSize(JSCell*, VM&);

    static Structure* createStructure(VM&, JSGlobalObject*, JSValue prototype);
    JS_EXPORT_PRIVATE static JSBigInt* createZero(JSGlobalObject*);
    JS_EXPORT_PRIVATE static JSBigInt* tryCreateZero(VM&);
    JS_EXPORT_PRIVATE static JSBigInt* tryCreateWithLength(VM&, unsigned length);
    JS_EXPORT_PRIVATE static JSBigInt* createWithLength(JSGlobalObject*, unsigned length);

    JS_EXPORT_PRIVATE static JSBigInt* createFrom(JSGlobalObject*, int32_t value);
    static JSBigInt* tryCreateFrom(VM&, int32_t value);
    static JSBigInt* createFrom(JSGlobalObject*, uint32_t value);
    JS_EXPORT_PRIVATE static JSBigInt* createFrom(JSGlobalObject*, int64_t value);
    JS_EXPORT_PRIVATE static JSBigInt* createFrom(JSGlobalObject*, uint64_t value);
    JS_EXPORT_PRIVATE static JSBigInt* createFrom(JSGlobalObject*, Int128 value);
    static JSBigInt* createFrom(JSGlobalObject*, bool value);
    static JSBigInt* createFrom(JSGlobalObject*, double value);

    static JSBigInt* createFrom(JSGlobalObject*, VM&, int32_t value);

    static constexpr size_t offsetOfLength()
    {
        return OBJECT_OFFSETOF(JSBigInt, m_length);
    }

    static constexpr size_t offsetOfSign()
    {
        return OBJECT_OFFSETOF(JSBigInt, m_sign);
    }

    static constexpr size_t offsetOfData()
    {
        return OBJECT_OFFSETOF(JSBigInt, m_data);
    }

    DECLARE_EXPORT_INFO;

    JSValue toPrimitive(JSGlobalObject*, PreferredPrimitiveType) const;

    void setSign(bool sign) { m_sign = sign; }
    bool sign() const { return m_sign; }

    unsigned length() const { return m_length; }

    ALWAYS_INLINE static JSValue makeHeapBigIntOrBigInt32(JSGlobalObject* globalObject, int64_t value)
    {
#if USE(BIGINT32)
        if (value <= INT_MAX && value >= INT_MIN)
            return jsBigInt32(static_cast<int32_t>(value));
#endif
        return JSBigInt::createFrom(globalObject, value);
    }

    ALWAYS_INLINE static JSValue makeHeapBigIntOrBigInt32(JSGlobalObject* globalObject, uint64_t value)
    {
#if USE(BIGINT32)
        if (value <= INT_MAX)
            return jsBigInt32(static_cast<int32_t>(value));
#endif
        return JSBigInt::createFrom(globalObject, value);
    }

    ALWAYS_INLINE static JSValue makeHeapBigIntOrBigInt32(JSGlobalObject* globalObject, double value)
    {
        ASSERT(isInteger(value));
        if (std::abs(value) <= maxSafeInteger())
            return makeHeapBigIntOrBigInt32(globalObject, static_cast<int64_t>(value));
        return JSBigInt::createFrom(globalObject, value);
    }

    enum class ErrorParseMode {
        ThrowExceptions,
        IgnoreExceptions
    };

    enum class ParseIntMode { DisallowEmptyString, AllowEmptyString };
    enum class ParseIntSign { Unsigned, Signed };

    static JSValue parseInt(JSGlobalObject*, VM&, StringView, uint8_t radix, ErrorParseMode = ErrorParseMode::ThrowExceptions, ParseIntSign = ParseIntSign::Unsigned);
    static JSValue parseInt(JSGlobalObject*, StringView, ErrorParseMode = ErrorParseMode::ThrowExceptions);
    static JSValue stringToBigInt(JSGlobalObject*, StringView);

    static String tryGetString(VM&, JSBigInt*, unsigned radix);

    String toString(JSGlobalObject*, unsigned radix);
    
    enum class ComparisonMode {
        LessThan,
        LessThanOrEqual
    };

    enum class ComparisonResult {
        Equal,
        Undefined,
        GreaterThan,
        LessThan
    };

    JS_EXPORT_PRIVATE static bool equals(JSBigInt*, JSBigInt*);
    bool equalsToNumber(JSValue);
    JS_EXPORT_PRIVATE bool equalsToInt32(int32_t);
    static ComparisonResult compare(JSBigInt* x, JSBigInt* y);
    static ComparisonResult compare(int32_t x, JSBigInt* y);
    static ComparisonResult compare(JSBigInt* x, int32_t y);
    static ComparisonResult compare(JSBigInt* x, int64_t y);
    static ComparisonResult compare(JSValue x, int64_t y);
    static ComparisonResult compare(JSBigInt* x, uint64_t y);
    static ComparisonResult compare(JSValue x, uint64_t y);
    static ComparisonResult compare(JSValue x, JSValue y);

    double toNumber(JSGlobalObject*) const;
    JSObject* toObject(JSGlobalObject*) const;
    inline bool toBoolean() const { return !isZero(); }

    static ComparisonResult compareToDouble(JSBigInt* x, double y);
    static ComparisonResult compareToDouble(double x, JSBigInt* y);
    template<typename BigIntImpl>
    static ComparisonResult compareToDouble(BigIntImpl x, double y);
    template <typename BigIntImpl>
    static ComparisonResult compareToDouble(double x, BigIntImpl y) { return flip(compareToDouble(y, x)); }
    static ComparisonResult compareToDouble(int32_t x, double y);
    static ComparisonResult compareToDouble(double x, int32_t y) { return flip(compareToDouble(y, x)); }
    static ComparisonResult compareToDouble(int64_t x, double y);
    static ComparisonResult compareToDouble(double x, int64_t y) { return flip(compareToDouble(y, x)); }
    static ComparisonResult compareToDouble(uint64_t x, double y);
    static ComparisonResult compareToDouble(double x, uint64_t y) { return flip(compareToDouble(y, x)); }
    static ComparisonResult compareToDouble(JSValue x, double y);
    static ComparisonResult compareToDouble(double x, JSValue y) { return flip(compareToDouble(y, x)); }

private:
    ALWAYS_INLINE static ComparisonResult flip(ComparisonResult result)
    {
        switch (result) {
        case JSBigInt::ComparisonResult::LessThan:
            return JSBigInt::ComparisonResult::GreaterThan;
        case JSBigInt::ComparisonResult::GreaterThan:
            return JSBigInt::ComparisonResult::LessThan;
        case JSBigInt::ComparisonResult::Equal:
        case JSBigInt::ComparisonResult::Undefined:
            return result;
        default:
            RELEASE_ASSERT_NOT_REACHED();
            return JSBigInt::ComparisonResult::Undefined;
        }
    }

private:
    friend class HeapBigIntImpl;
public:
    struct ImplResult {
        ImplResult(HeapBigIntImpl&);
        ImplResult(JSBigInt*);
#if USE(BIGINT32)
        ImplResult(Int32BigIntImpl&);
#endif
        ImplResult(JSValue);
        JSValue payload;
    };
private:
    static JSBigInt* createWithLength(JSGlobalObject*, VM&, unsigned length);
    static JSBigInt* createZero(JSGlobalObject*, VM&);

    template <typename BigIntImpl1, typename BigIntImpl2>
    static ImplResult exponentiateImpl(JSGlobalObject*, BigIntImpl1 base, BigIntImpl2 exponent);

    template <typename BigIntImpl1, typename BigIntImpl2>
    static ImplResult multiplyImpl(JSGlobalObject*, BigIntImpl1 x, BigIntImpl2 y);

    template <typename BigIntImpl>
    static ImplResult incImpl(JSGlobalObject*, BigIntImpl x);

    template <typename BigIntImpl>
    static ImplResult decImpl(JSGlobalObject*, BigIntImpl x);

    template <typename BigIntImpl1, typename BigIntImpl2>
    static ImplResult addImpl(JSGlobalObject*, BigIntImpl1 x, BigIntImpl2 y);

    template <typename BigIntImpl1, typename BigIntImpl2>
    static ImplResult subImpl(JSGlobalObject*, BigIntImpl1 x, BigIntImpl2 y);

    template <typename BigIntImpl1, typename BigIntImpl2>
    static ImplResult divideImpl(JSGlobalObject*, BigIntImpl1 x, BigIntImpl2 y);

    template <typename BigIntImpl1, typename BigIntImpl2>
    static ImplResult remainderImpl(JSGlobalObject*, BigIntImpl1 x, BigIntImpl2 y);

    template <typename BigIntImpl>
    static ImplResult unaryMinusImpl(JSGlobalObject*, BigIntImpl x);

    template <typename BigIntImpl1, typename BigIntImpl2>
    static ImplResult bitwiseAndImpl(JSGlobalObject*, BigIntImpl1 x, BigIntImpl2 y);

    template <typename BigIntImpl1, typename BigIntImpl2>
    static ImplResult bitwiseOrImpl(JSGlobalObject*, BigIntImpl1 x, BigIntImpl2 y);

    template <typename BigIntImpl1, typename BigIntImpl2>
    static ImplResult bitwiseXorImpl(JSGlobalObject*, BigIntImpl1 x, BigIntImpl2 y);

    template <typename BigIntImpl>
    static ImplResult bitwiseNotImpl(JSGlobalObject*, BigIntImpl x);

    template <typename BigIntImpl1, typename BigIntImpl2>
    static ImplResult leftShiftImpl(JSGlobalObject*, BigIntImpl1 x, BigIntImpl2 y);

    template <typename BigIntImpl1, typename BigIntImpl2>
    static ImplResult signedRightShiftImpl(JSGlobalObject*, BigIntImpl1 x, BigIntImpl2 y);

    template <typename BigIntImpl1, typename BigIntImpl2>
    static ComparisonResult compareImpl(BigIntImpl1 x, BigIntImpl2 y);

public:
    static JSValue exponentiate(JSGlobalObject*, JSBigInt* base, JSBigInt* exponent);
#if USE(BIGINT32)
    static JSValue exponentiate(JSGlobalObject*, JSBigInt* base, int32_t exponent);
    static JSValue exponentiate(JSGlobalObject*, int32_t base, JSBigInt* exponent);
    static JSValue exponentiate(JSGlobalObject*, int32_t base, int32_t exponent);
#endif

    static JSValue multiply(JSGlobalObject*, JSBigInt* x, JSBigInt* y);
#if USE(BIGINT32)
    static JSValue multiply(JSGlobalObject*, int32_t x, JSBigInt* y);
    static JSValue multiply(JSGlobalObject*, JSBigInt* x, int32_t y);
    static JSValue multiply(JSGlobalObject* globalObject, int32_t x, int32_t y)
    {
        int64_t result = static_cast<int64_t>(x) * static_cast<int64_t>(y); 
        return makeHeapBigIntOrBigInt32(globalObject, result);
    }
#endif
    
    static JSValue inc(JSGlobalObject*, JSBigInt* x);
#if USE(BIGINT32)
    static JSValue inc(JSGlobalObject* globalObject, int32_t x)
    {
        return makeHeapBigIntOrBigInt32(globalObject, static_cast<int64_t>(x) + 1);
    }
#endif

    static JSValue dec(JSGlobalObject*, JSBigInt* x);
#if USE(BIGINT32)
    static JSValue dec(JSGlobalObject* globalObject, int32_t x)
    {
        return makeHeapBigIntOrBigInt32(globalObject, static_cast<int64_t>(x) - 1);
    }
#endif

    static JSValue add(JSGlobalObject*, JSBigInt* x, JSBigInt* y);
#if USE(BIGINT32)
    static JSValue add(JSGlobalObject*, JSBigInt* x, int32_t y);
    static JSValue add(JSGlobalObject*, int32_t x, JSBigInt* y);
    static JSValue add(JSGlobalObject* globalObject, int32_t x, int32_t y)
    {
        return makeHeapBigIntOrBigInt32(globalObject, static_cast<int64_t>(x) + static_cast<int64_t>(y));
    }
#endif

    static JSValue sub(JSGlobalObject*, JSBigInt* x, JSBigInt* y);
#if USE(BIGINT32)
    static JSValue sub(JSGlobalObject*, JSBigInt* x, int32_t y);
    static JSValue sub(JSGlobalObject*, int32_t x, JSBigInt* y);
    static JSValue sub(JSGlobalObject* globalObject, int32_t x, int32_t y)
    {
        return makeHeapBigIntOrBigInt32(globalObject, static_cast<int64_t>(x) - static_cast<int64_t>(y));
    }
#endif

    static JSValue divide(JSGlobalObject*, JSBigInt* x, JSBigInt* y);
#if USE(BIGINT32)
    static JSValue divide(JSGlobalObject*, JSBigInt* x, int32_t y);
    static JSValue divide(JSGlobalObject*, int32_t x, JSBigInt* y);
    static JSValue divide(JSGlobalObject* globalObject, int32_t x, int32_t y)
    {
        if (!y) {
            auto scope = DECLARE_THROW_SCOPE(getVM(globalObject));
            throwRangeError(globalObject, scope, "0 is an invalid divisor value."_s);
            return JSValue();
        }
        return makeHeapBigIntOrBigInt32(globalObject, static_cast<int64_t>(x) / static_cast<int64_t>(y));
    }
#endif

    static JSValue remainder(JSGlobalObject*, JSBigInt* x, JSBigInt* y);
#if USE(BIGINT32)
    static JSValue remainder(JSGlobalObject*, JSBigInt* x, int32_t y);
    static JSValue remainder(JSGlobalObject*, int32_t x, JSBigInt* y);
    static JSValue remainder(JSGlobalObject* globalObject, int32_t x, int32_t y)
    {
        if (!y) {
            auto scope = DECLARE_THROW_SCOPE(getVM(globalObject));
            throwRangeError(globalObject, scope, "0 is an invalid divisor value."_s);
            return JSValue();
        }
        return makeHeapBigIntOrBigInt32(globalObject, static_cast<int64_t>(x) % static_cast<int64_t>(y));
    }
#endif

    static JSValue unaryMinus(JSGlobalObject*, JSBigInt* x);
#if USE(BIGINT32)
    static JSValue unaryMinus(JSGlobalObject* globalObject, int32_t x)
    {
        return makeHeapBigIntOrBigInt32(globalObject, -static_cast<int64_t>(x));
    }
#endif

    static JSValue bitwiseAnd(JSGlobalObject*, JSBigInt* x, JSBigInt* y);
#if USE(BIGINT32)
    static JSValue bitwiseAnd(JSGlobalObject*, JSBigInt* x, int32_t y);
    static JSValue bitwiseAnd(JSGlobalObject*, int32_t x, JSBigInt* y);
    static JSValue bitwiseAnd(JSGlobalObject* globalObject, int32_t x, int32_t y)
    {
        return makeHeapBigIntOrBigInt32(globalObject, x & y);
    }
#endif

    static JSValue bitwiseOr(JSGlobalObject*, JSBigInt* x, JSBigInt* y);
#if USE(BIGINT32)
    static JSValue bitwiseOr(JSGlobalObject*, JSBigInt* x, int32_t y);
    static JSValue bitwiseOr(JSGlobalObject*, int32_t x, JSBigInt* y);
    static JSValue bitwiseOr(JSGlobalObject* globalObject, int32_t x, int32_t y)
    {
        return makeHeapBigIntOrBigInt32(globalObject, x | y);
    }
#endif

    static JSValue bitwiseXor(JSGlobalObject*, JSBigInt* x, JSBigInt* y);
#if USE(BIGINT32)
    static JSValue bitwiseXor(JSGlobalObject*, JSBigInt* x, int32_t y);
    static JSValue bitwiseXor(JSGlobalObject*, int32_t x, JSBigInt* y);
    static JSValue bitwiseXor(JSGlobalObject* globalObject, int32_t x, int32_t y)
    {
        return makeHeapBigIntOrBigInt32(globalObject, x ^ y);
    }
#endif

    static JSValue bitwiseNot(JSGlobalObject*, JSBigInt* x);
#if USE(BIGINT32)
    static JSValue bitwiseNot(JSGlobalObject* globalObject, int32_t x)
    {
        return makeHeapBigIntOrBigInt32(globalObject, ~x);
    }
#endif

    static JSValue leftShift(JSGlobalObject*, JSBigInt* x, JSBigInt* y);
#if USE(BIGINT32)
    static JSValue leftShift(JSGlobalObject*, JSBigInt* x, int32_t y);
    static JSValue leftShift(JSGlobalObject*, int32_t x, JSBigInt* y);
private:
    static JSValue leftShiftSlow(JSGlobalObject*, int32_t x, int32_t y);
public:
    static JSValue leftShift(JSGlobalObject* globalObject, int32_t x, int32_t y)
    {
        if (y < 0) {
            // Shifts one less than requested, but doesn't matter since lhs is int32
            return signedRightShift(globalObject, x, y == INT32_MIN ? INT32_MAX : -y);
        }

        // Do some checks to detect overflow of left-shift. But this is much cheaper compared to allocating two JSBigInt and perform shift operations in JSBigInt.
        if (!x)
            return jsBigInt32(0);
        if (y < 32)
            return makeHeapBigIntOrBigInt32(globalObject, static_cast<int64_t>(x) << y);
        return leftShiftSlow(globalObject, x, y);
    }
#endif

    static JSValue signedRightShift(JSGlobalObject*, JSBigInt* x, JSBigInt* y);
#if USE(BIGINT32)
    static JSValue signedRightShift(JSGlobalObject*, JSBigInt* x, int32_t y);
    static JSValue signedRightShift(JSGlobalObject*, int32_t x, JSBigInt* y);
    static JSValue signedRightShift(JSGlobalObject* globalObject, int32_t x, int32_t y)
    {
        if (y < 0) {
            // Shifts one less than requested, but doesn't matter since lhs is int32
            return leftShift(globalObject, x, y == INT32_MIN ? INT32_MAX : -y);
        }

        return jsBigInt32(x >> std::min(y, 31));
    }
#endif

    static JSValue toNumberHeap(JSBigInt*);
    static JSValue toNumber(JSValue bigInt)
    {
        ASSERT(bigInt.isBigInt());
#if USE(BIGINT32)
        if (bigInt.isBigInt32())
            return jsNumber(bigInt.bigInt32AsInt32());
#endif
        return toNumberHeap(jsCast<JSBigInt*>(bigInt));
    }


    static JSValue asIntN(JSGlobalObject*, uint64_t numberOfBits, JSBigInt*);
    static JSValue asUintN(JSGlobalObject*, uint64_t numberOfBits, JSBigInt*);
#if USE(BIGINT32)
    static JSValue asIntN(JSGlobalObject*, uint64_t numberOfBits, int32_t bigIntAsInt32);
    static JSValue asUintN(JSGlobalObject*, uint64_t numberOfBits, int32_t bigIntAsInt32);
#endif

    static uint64_t toBigUInt64(JSValue bigInt)
    {
        ASSERT(bigInt.isBigInt());
#if USE(BIGINT32)
        if (bigInt.isBigInt32())
            return static_cast<uint64_t>(static_cast<int64_t>(bigInt.bigInt32AsInt32()));
#endif
        return toBigUInt64Heap(bigInt.asHeapBigInt());
    }

    static int64_t toBigInt64(JSValue bigInt)
    {
        ASSERT(bigInt.isBigInt());
#if USE(BIGINT32)
        if (bigInt.isBigInt32())
            return static_cast<int64_t>(bigInt.bigInt32AsInt32());
#endif
        return static_cast<int64_t>(toBigUInt64Heap(bigInt.asHeapBigInt()));
    }

    Digit digit(unsigned);
    void setDigit(unsigned, Digit); // Use only when initializing.
    JS_EXPORT_PRIVATE JSBigInt* rightTrim(JSGlobalObject*);
    JS_EXPORT_PRIVATE JSBigInt* tryRightTrim(VM&);

    JS_EXPORT_PRIVATE std::optional<unsigned> concurrentHash();
    unsigned hash()
    {
        if (m_hash)
            return m_hash;
        return hashSlow();
    }

    static std::optional<double> tryExtractDouble(JSValue);

    inline bool isZero() const
    {
        ASSERT(length() || !sign());
        return !length();
    }

private:
    JSBigInt(VM&, Structure*, Digit*, unsigned length);

    JSBigInt* rightTrim(JSGlobalObject*, VM&);

    JS_EXPORT_PRIVATE unsigned hashSlow();

    static JSBigInt* createFromImpl(JSGlobalObject*, uint64_t value, bool sign);

    static constexpr unsigned bitsPerByte = 8;
    static constexpr unsigned digitBits = sizeof(Digit) * bitsPerByte;
    static constexpr unsigned halfDigitBits = digitBits / 2;
    static constexpr Digit halfDigitMask = (1ull << halfDigitBits) - 1;
    static constexpr int maxInt = 0x7FFFFFFF;

    static constexpr unsigned doubleMantissaSize = 53;
    static constexpr unsigned doublePhysicalMantissaSize = 52; // Excluding hidden-bit.
    static constexpr uint64_t doublePhysicalMantissaMask = (1ULL << doublePhysicalMantissaSize) - 1;
    static constexpr uint64_t doubleMantissaHiddenBit = 1ULL << doublePhysicalMantissaSize;
    
    // The maximum length that the current implementation supports would be
    // maxInt / digitBits. However, we use a lower limit for now, because
    // raising it later is easier than lowering it.
    // Support up to 1 million bits.
    static constexpr unsigned maxLengthBits = 1024 * 1024;
    static constexpr unsigned maxLength = maxLengthBits / digitBits;
    static_assert(maxLengthBits % digitBits == 0);
    
    static uint64_t calculateMaximumCharactersRequired(unsigned length, unsigned radix, Digit lastDigit, bool sign);
    
    template <typename BigIntImpl1, typename BigIntImpl2>
    static ComparisonResult absoluteCompare(BigIntImpl1 x, BigIntImpl2 y);
    template <typename BigIntImpl>
    static bool absoluteDivWithDigitDivisor(JSGlobalObject*, VM&, BigIntImpl x, Digit divisor, JSBigInt** quotient, Digit& remainder);
    template <typename BigIntImpl>
    static void internalMultiplyAdd(BigIntImpl source, Digit factor, Digit summand, unsigned, JSBigInt* result);
    template <typename BigIntImpl>
    static void multiplyAccumulate(BigIntImpl multiplicand, Digit multiplier, JSBigInt* accumulator, unsigned accumulatorIndex);
    template <typename BigIntImpl1>
    static void absoluteDivWithBigIntDivisor(JSGlobalObject*, BigIntImpl1 dividend, JSBigInt* divisor, JSBigInt** quotient, JSBigInt** remainder);
    
    enum class LeftShiftMode {
        SameSizeResult,
        AlwaysAddOneDigit
    };
    
    template <typename BigIntImpl>
    static JSBigInt* absoluteLeftShiftAlwaysCopy(JSGlobalObject*, BigIntImpl x, unsigned shift, LeftShiftMode);
    static bool productGreaterThan(Digit factor1, Digit factor2, Digit high, Digit low);

    Digit absoluteInplaceAdd(JSBigInt* summand, unsigned startIndex);
    Digit absoluteInplaceSub(JSBigInt* subtrahend, unsigned startIndex);
    void inplaceRightShift(unsigned shift);

    enum class RoundingResult {
        RoundDown,
        Tie,
        RoundUp
    };

    static RoundingResult decideRounding(JSBigInt*, int32_t mantissaBitsUnset, int32_t digitIndex, uint64_t currentDigit);

    enum class ExtraDigitsHandling {
        Copy,
        Skip
    };

    template<typename BigIntImpl1, typename BigIntImpl2, typename BitwiseOp>
    static JSBigInt* absoluteBitwiseOp(JSGlobalObject*, BigIntImpl1 x, BigIntImpl2 y, ExtraDigitsHandling, BitwiseOp&&);

    template <typename BigIntImpl1, typename BigIntImpl2>
    static JSBigInt* absoluteAnd(JSGlobalObject*, BigIntImpl1 x, BigIntImpl2 y);
    template <typename BigIntImpl1, typename BigIntImpl2>
    static JSBigInt* absoluteOr(JSGlobalObject*, BigIntImpl1 x, BigIntImpl2 y);
    template <typename BigIntImpl1, typename BigIntImpl2>
    static JSBigInt* absoluteAndNot(JSGlobalObject*, BigIntImpl1 x, BigIntImpl2 y);
    template <typename BigIntImpl1, typename BigIntImpl2>
    static JSBigInt* absoluteXor(JSGlobalObject*, BigIntImpl1 x, BigIntImpl2 y);

    enum class SignOption {
        Signed,
        Unsigned
    };

    template <typename BigIntImpl>
    static JSBigInt* absoluteAddOne(JSGlobalObject*, BigIntImpl x, SignOption);
    template <typename BigIntImpl>
    static JSBigInt* absoluteSubOne(JSGlobalObject*, BigIntImpl x, unsigned resultLength);

    // Digit arithmetic helpers.
    static Digit digitAdd(Digit a, Digit b, Digit& carry);
    static Digit digitSub(Digit a, Digit b, Digit& borrow);
    static Digit digitMul(Digit a, Digit b, Digit& high);
    static Digit digitDiv(Digit high, Digit low, Digit divisor, Digit& remainder);
    static Digit digitPow(Digit base, Digit exponent);

    static String toStringBasePowerOfTwo(VM&, JSGlobalObject*, JSBigInt*, unsigned radix);
    static String toStringGeneric(VM&, JSGlobalObject*, JSBigInt*, unsigned radix);

    template <typename CharType>
    static JSValue parseInt(JSGlobalObject*, std::span<const CharType> data, ErrorParseMode);

    template <typename CharType>
    static JSValue parseInt(JSGlobalObject*, VM&, std::span<const CharType> data, unsigned startIndex, unsigned radix, ErrorParseMode, ParseIntSign = ParseIntSign::Signed, ParseIntMode = ParseIntMode::AllowEmptyString);

    static JSBigInt* allocateFor(JSGlobalObject*, VM&, unsigned radix, unsigned charcount);

    template <typename BigIntImpl>
    static JSBigInt* copy(JSGlobalObject*, BigIntImpl x);

    void inplaceMultiplyAdd(Digit multiplier, Digit part);
    template <typename BigIntImpl1, typename BigIntImpl2>
    static ImplResult absoluteAdd(JSGlobalObject*, BigIntImpl1 x, BigIntImpl2 y, bool resultSign);
    template <typename BigIntImpl1, typename BigIntImpl2>
    static ImplResult absoluteSub(JSGlobalObject*, BigIntImpl1 x, BigIntImpl2 y, bool resultSign);

    template <typename BigIntImpl1, typename BigIntImpl2>
    static ImplResult leftShiftByAbsolute(JSGlobalObject*, BigIntImpl1 x, BigIntImpl2 y);
    template <typename BigIntImpl1, typename BigIntImpl2>
    static ImplResult rightShiftByAbsolute(JSGlobalObject*, BigIntImpl1 x, BigIntImpl2 y);

    static ImplResult rightShiftByMaximum(JSGlobalObject*, bool sign);

    template <typename BigIntImpl>
    static std::optional<Digit> toShiftAmount(BigIntImpl x);

    template <typename BigIntImpl>
    static ImplResult asIntNImpl(JSGlobalObject*, uint64_t, BigIntImpl);
    template <typename BigIntImpl>
    static ImplResult asUintNImpl(JSGlobalObject*, uint64_t, BigIntImpl);
    template <typename BigIntImpl>
    static ImplResult truncateToNBits(JSGlobalObject*, int32_t, BigIntImpl);
    template <typename BigIntImpl>
    static ImplResult truncateAndSubFromPowerOfTwo(JSGlobalObject*, int32_t, BigIntImpl, bool resultSign);

    JS_EXPORT_PRIVATE static uint64_t toBigUInt64Heap(JSBigInt*);

    inline Digit* dataStorage() { return m_data.get(); }
    inline Digit* dataStorageUnsafe() { return m_data.getUnsafe(); }

    const unsigned m_length;
    unsigned m_hash { 0 };
    uint8_t m_sign { false };
    CagedBarrierPtr<Gigacage::Primitive, Digit> m_data;
};

inline JSBigInt* asHeapBigInt(JSValue value)
{
    ASSERT(value.asCell()->isHeapBigInt());
    return jsCast<JSBigInt*>(value.asCell());
}

inline JSBigInt::Digit JSBigInt::digit(unsigned n)
{
    ASSERT(n < length());
    return dataStorage()[n];
}

inline void JSBigInt::setDigit(unsigned n, Digit value)
{
    ASSERT(n < length());
    dataStorage()[n] = value;
}

ALWAYS_INLINE JSBigInt::ComparisonResult invertBigIntCompareResult(JSBigInt::ComparisonResult comparisonResult)
{
    switch (comparisonResult) {
    case JSBigInt::ComparisonResult::GreaterThan:
        return JSBigInt::ComparisonResult::LessThan;
    case JSBigInt::ComparisonResult::LessThan:
        return JSBigInt::ComparisonResult::GreaterThan;
    default:
        return comparisonResult;
    }
}

ALWAYS_INLINE JSValue tryConvertToBigInt32(JSBigInt* bigInt)
{
#if USE(BIGINT32)
    if (UNLIKELY(!bigInt))
        return JSValue();

    if (bigInt->length() <= 1) {
        if (!bigInt->length())
            return jsBigInt32(0);
        JSBigInt::Digit digit = bigInt->digit(0);
        if (bigInt->sign()) {
            static constexpr uint64_t maxValue = -static_cast<int64_t>(std::numeric_limits<int32_t>::min());
            if (digit <= maxValue)
                return jsBigInt32(static_cast<int32_t>(-static_cast<int64_t>(digit)));
        } else {
            static constexpr uint64_t maxValue = static_cast<uint64_t>(std::numeric_limits<int32_t>::max());
            if (digit <= maxValue)
                return jsBigInt32(static_cast<int32_t>(digit));
        }
    }
#endif

    return bigInt;
}

ALWAYS_INLINE std::optional<double> JSBigInt::tryExtractDouble(JSValue value)
{
    if (value.isNumber())
        return value.asNumber();

    if (!value.isBigInt())
        return std::nullopt;

#if USE(BIGINT32)
    if (value.isBigInt32())
        return value.bigInt32AsInt32();
#endif

    ASSERT(value.isHeapBigInt());
    JSBigInt* bigInt = value.asHeapBigInt();
    if (!bigInt->length())
        return 0;

    uint64_t integer = 0;
    if constexpr (sizeof(Digit) == 8) {
        if (bigInt->length() != 1)
            return std::nullopt;
        integer = bigInt->digit(0);
    } else {
        ASSERT(sizeof(Digit) == 4);
        if (bigInt->length() > 2)
            return std::nullopt;
        integer = bigInt->digit(0);
        if (bigInt->length() == 2)
            integer |= (static_cast<uint64_t>(bigInt->digit(1)) << 32);
    }

    if (integer <= static_cast<uint64_t>(maxSafeInteger()))
        return (bigInt->sign()) ? -static_cast<double>(integer) : static_cast<double>(integer);

    return std::nullopt;
}

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
