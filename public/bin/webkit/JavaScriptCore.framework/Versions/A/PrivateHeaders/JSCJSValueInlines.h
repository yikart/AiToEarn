/*
 * Copyright (C) 2011-2021 Apple Inc. All rights reserved.
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

#include <wtf/Compiler.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

#include "CatchScope.h"
#include "Error.h"
#include "ExceptionHelpers.h"
#include "Identifier.h"
#include "InternalFunction.h"
#include "JSBigInt.h"
#include "JSCJSValue.h"
#include "JSCellInlines.h"
#include "JSFunction.h"
#include "JSGlobalProxy.h"
#include "JSObject.h"
#include "JSStringInlines.h"
#include "MathCommon.h"
#include <wtf/text/MakeString.h>
#include <wtf/text/StringImpl.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END

namespace JSC {

ALWAYS_INLINE int32_t JSValue::toInt32(JSGlobalObject* globalObject) const
{
    if (isInt32())
        return asInt32();

    double d = toNumber(globalObject);
    return JSC::toInt32(d);
}

inline uint32_t JSValue::toUInt32(JSGlobalObject* globalObject) const
{
    // The only difference between toInt32 and toUint32 is that toUint32 reinterprets resulted int32_t value as uint32_t.
    // https://tc39.es/ecma262/#sec-touint32
    return toInt32(globalObject);
}

inline uint32_t JSValue::toIndex(JSGlobalObject* globalObject, ASCIILiteral errorName) const
{
    VM& vm = getVM(globalObject);
    auto scope = DECLARE_THROW_SCOPE(vm);

    double d = toNumber(globalObject);
    RETURN_IF_EXCEPTION(scope, 0);
    if (d <= -1) {
        throwException(globalObject, scope, createRangeError(globalObject, makeString(errorName, " cannot be negative"_s)));
        return 0;
    }

    if (isInt32())
        return asInt32();

    if (d > static_cast<double>(std::numeric_limits<unsigned>::max())) {
        throwException(globalObject, scope, createRangeError(globalObject, makeString(errorName, " too large"_s)));
        return 0;
    }

    RELEASE_AND_RETURN(scope, JSC::toInt32(d));
}

inline size_t JSValue::toTypedArrayIndex(JSGlobalObject* globalObject, ASCIILiteral errorName) const
{
    VM& vm = getVM(globalObject);
    auto scope = DECLARE_THROW_SCOPE(vm);

    double d = toNumber(globalObject);
    RETURN_IF_EXCEPTION(scope, 0);
    if (d <= -1) {
        throwException(globalObject, scope, createRangeError(globalObject, makeString(errorName, " cannot be negative"_s)));
        return 0;
    }

    if (isInt32())
        return asInt32();

    if (d > static_cast<double>(MAX_ARRAY_BUFFER_SIZE)) {
        throwException(globalObject, scope, createRangeError(globalObject, makeString(errorName, " too large"_s)));
        return 0;
    }

    // All of this monstrosity is just to give the correct result on 1<<32.
    size_t outputOffset = 0;
    double inputOffset = 0;
    size_t int32Max = std::numeric_limits<int32_t>::max();
    if (d > static_cast<double>(int32Max)) {
        outputOffset = int32Max;
        inputOffset = int32Max;
    }
    RELEASE_AND_RETURN(scope, outputOffset + static_cast<size_t>(static_cast<uint32_t>(JSC::toInt32(d - inputOffset))));
}

// https://tc39.es/proposal-temporal/#sec-tointegerwithtruncation
inline double JSValue::toIntegerWithTruncation(JSGlobalObject* globalObject) const
{
    if (isInt32())
        return asInt32();
    return trunc(toNumber(globalObject) + 0.0);
}

// https://tc39.es/ecma262/#sec-tointegerorinfinity
inline double JSValue::toIntegerOrInfinity(JSGlobalObject* globalObject) const
{
    if (isInt32())
        return asInt32();
    double d = toNumber(globalObject);
    return trunc(std::isnan(d) ? 0.0 : d + 0.0);
}

inline bool JSValue::isUInt32() const
{
    return isInt32() && asInt32() >= 0;
}

inline uint32_t JSValue::asUInt32() const
{
    ASSERT(isUInt32());
    return asInt32();
}

inline double JSValue::asNumber() const
{
    ASSERT(isNumber());
    return isInt32() ? asInt32() : asDouble();
}

inline std::optional<uint32_t> JSValue::tryGetAsUint32Index()
{
    if (isUInt32()) {
        ASSERT(isIndex(asUInt32()));
        return asUInt32();
    }
    if (isNumber()) {
        double number = asNumber();
        uint32_t asUint = static_cast<uint32_t>(number);
        if (static_cast<double>(asUint) == number && isIndex(asUint))
            return asUint;
    }
    return std::nullopt;
}

inline std::optional<int32_t> JSValue::tryGetAsInt32()
{
    if (isInt32())
        return asInt32();
    if (isNumber()) {
        double number = asNumber();
        int32_t asInt = static_cast<int32_t>(number);
        if (static_cast<double>(asInt) == number)
            return asInt;
    }
    return std::nullopt;
}

inline JSValue jsNaN()
{
    return JSValue(JSValue::EncodeAsDouble, PNaN);
}

inline JSValue::JSValue(char i)
{
    *this = JSValue(static_cast<int32_t>(i));
}

inline JSValue::JSValue(unsigned char i)
{
    *this = JSValue(static_cast<int32_t>(i));
}

inline JSValue::JSValue(short i)
{
    *this = JSValue(static_cast<int32_t>(i));
}

inline JSValue::JSValue(unsigned short i)
{
    *this = JSValue(static_cast<int32_t>(i));
}

inline JSValue::JSValue(unsigned i)
{
    if (static_cast<int32_t>(i) < 0) {
        *this = JSValue(EncodeAsDouble, static_cast<double>(i));
        return;
    }
    *this = JSValue(static_cast<int32_t>(i));
}

inline JSValue::JSValue(long i)
{
    if (static_cast<int32_t>(i) != i) {
        *this = JSValue(EncodeAsDouble, static_cast<double>(i));
        return;
    }
    *this = JSValue(static_cast<int32_t>(i));
}

inline JSValue::JSValue(unsigned long i)
{
    if (static_cast<uint32_t>(i) != i) {
        *this = JSValue(EncodeAsDouble, static_cast<double>(i));
        return;
    }
    *this = JSValue(static_cast<uint32_t>(i));
}

inline JSValue::JSValue(long long i)
{
    if (static_cast<int32_t>(i) != i) {
        *this = JSValue(EncodeAsDouble, static_cast<double>(i));
        return;
    }
    *this = JSValue(static_cast<int32_t>(i));
}

inline JSValue::JSValue(unsigned long long i)
{
    if (static_cast<uint32_t>(i) != i) {
        *this = JSValue(EncodeAsDouble, static_cast<double>(i));
        return;
    }
    *this = JSValue(static_cast<uint32_t>(i));
}

inline JSValue::JSValue(double d)
{
    if (canBeStrictInt32(d)) {
        *this = JSValue(static_cast<int32_t>(d));
        return;
    }
    *this = JSValue(EncodeAsDouble, d);
}

inline EncodedJSValue JSValue::encode(JSValue value)
{
    return value.u.asInt64;
}

inline JSValue JSValue::decode(EncodedJSValue encodedJSValue)
{
    JSValue v;
    v.u.asInt64 = encodedJSValue;
    return v;
}

#if USE(JSVALUE32_64)
inline JSValue::JSValue()
{
    u.asBits.tag = EmptyValueTag;
    u.asBits.payload = 0;
}

inline JSValue::JSValue(JSNullTag)
{
    u.asBits.tag = NullTag;
    u.asBits.payload = 0;
}
    
inline JSValue::JSValue(JSUndefinedTag)
{
    u.asBits.tag = UndefinedTag;
    u.asBits.payload = 0;
}
    
inline JSValue::JSValue(JSTrueTag)
{
    u.asBits.tag = BooleanTag;
    u.asBits.payload = 1;
}
    
inline JSValue::JSValue(JSFalseTag)
{
    u.asBits.tag = BooleanTag;
    u.asBits.payload = 0;
}

inline JSValue::JSValue(HashTableDeletedValueTag)
{
    u.asBits.tag = DeletedValueTag;
    u.asBits.payload = 0;
}

inline JSValue::JSValue(JSCell* ptr)
{
    if (ptr)
        u.asBits.tag = CellTag;
    else
        u.asBits.tag = EmptyValueTag;
    u.asBits.payload = reinterpret_cast<int32_t>(ptr);
}

inline JSValue::JSValue(const JSCell* ptr)
{
    if (ptr)
        u.asBits.tag = CellTag;
    else
        u.asBits.tag = EmptyValueTag;
    u.asBits.payload = reinterpret_cast<int32_t>(const_cast<JSCell*>(ptr));
}

inline JSValue::operator bool() const
{
    ASSERT(tag() != DeletedValueTag);
    return tag() != EmptyValueTag;
}

inline bool JSValue::operator==(const JSValue& other) const
{
    return u.asInt64 == other.u.asInt64;
}

inline bool JSValue::isEmpty() const
{
    return tag() == EmptyValueTag;
}

inline bool JSValue::isUndefined() const
{
    return tag() == UndefinedTag;
}

inline bool JSValue::isNull() const
{
    return tag() == NullTag;
}

inline bool JSValue::isUndefinedOrNull() const
{
    return isUndefined() || isNull();
}

inline bool JSValue::isCell() const
{
    return tag() == CellTag;
}

inline bool JSValue::isInt32() const
{
    return tag() == Int32Tag;
}

inline bool JSValue::isDouble() const
{
    return tag() < LowestTag;
}

inline bool JSValue::isTrue() const
{
    return tag() == BooleanTag && payload();
}

inline bool JSValue::isFalse() const
{
    return tag() == BooleanTag && !payload();
}

inline uint32_t JSValue::tag() const
{
    return u.asBits.tag;
}
    
inline int32_t JSValue::payload() const
{
    return u.asBits.payload;
}
    
inline int32_t JSValue::asInt32() const
{
    ASSERT(isInt32());
    return u.asBits.payload;
}
    
inline double JSValue::asDouble() const
{
    ASSERT(isDouble());
    return u.asDouble;
}
    
ALWAYS_INLINE JSCell* JSValue::asCell() const
{
    ASSERT(isCell());
    return reinterpret_cast<JSCell*>(u.asBits.payload);
}

ALWAYS_INLINE JSBigInt* JSValue::asHeapBigInt() const
{
    ASSERT(isHeapBigInt());
    return reinterpret_cast<JSBigInt*>(u.asBits.payload);
}

ALWAYS_INLINE JSValue::JSValue(EncodeAsDoubleTag, double d)
{
    ASSERT(!isImpureNaN(d));
    u.asDouble = d;
}

inline JSValue::JSValue(int i)
{
    u.asBits.tag = Int32Tag;
    u.asBits.payload = i;
}

inline JSValue::JSValue(int32_t tag, int32_t payload)
{
    u.asBits.tag = tag;
    u.asBits.payload = payload;
}

inline bool JSValue::isNumber() const
{
    return isInt32() || isDouble();
}

inline bool JSValue::isBoolean() const
{
    return tag() == BooleanTag;
}

inline bool JSValue::asBoolean() const
{
    ASSERT(isBoolean());
    return payload();
}

#else // !USE(JSVALUE32_64) i.e. USE(JSVALUE64)

// 0x0 can never occur naturally because it has a tag of 00, indicating a pointer value, but a payload of 0x0, which is in the (invalid) zero page.
inline JSValue::JSValue()
{
    u.asInt64 = ValueEmpty;
}

// 0x4 can never occur naturally because it has a tag of 00, indicating a pointer value, but a payload of 0x4, which is in the (invalid) zero page.
inline JSValue::JSValue(HashTableDeletedValueTag)
{
    u.asInt64 = ValueDeleted;
}

inline JSValue::JSValue(JSCell* ptr)
{
    u.asInt64 = reinterpret_cast<uintptr_t>(ptr);
}

inline JSValue::JSValue(const JSCell* ptr)
{
    u.asInt64 = reinterpret_cast<uintptr_t>(const_cast<JSCell*>(ptr));
}

inline JSValue::operator bool() const
{
    return u.asInt64;
}

inline bool JSValue::operator==(const JSValue& other) const
{
    return u.asInt64 == other.u.asInt64;
}

inline bool JSValue::isEmpty() const
{
    return u.asInt64 == ValueEmpty;
}

inline bool JSValue::isUndefined() const
{
    return asValue() == JSValue(JSUndefined);
}

inline bool JSValue::isNull() const
{
    return asValue() == JSValue(JSNull);
}

inline bool JSValue::isTrue() const
{
    return asValue() == JSValue(JSTrue);
}

inline bool JSValue::isFalse() const
{
    return asValue() == JSValue(JSFalse);
}

inline bool JSValue::asBoolean() const
{
    ASSERT(isBoolean());
    return asValue() == JSValue(JSTrue);
}

inline int32_t JSValue::asInt32() const
{
    ASSERT(isInt32());
    return static_cast<int32_t>(u.asInt64);
}

inline bool JSValue::isDouble() const
{
    return isNumber() && !isInt32();
}

inline JSValue::JSValue(JSNullTag)
{
    u.asInt64 = ValueNull;
}
    
inline JSValue::JSValue(JSUndefinedTag)
{
    u.asInt64 = ValueUndefined;
}

inline JSValue::JSValue(JSTrueTag)
{
    u.asInt64 = ValueTrue;
}

inline JSValue::JSValue(JSFalseTag)
{
    u.asInt64 = ValueFalse;
}

inline bool JSValue::isUndefinedOrNull() const
{
    // Undefined and null share the same value, bar the 'undefined' bit in the extended tag.
    return (u.asInt64 & ~UndefinedTag) == ValueNull;
}

inline bool JSValue::isBoolean() const
{
    return (u.asInt64 & ~1) == ValueFalse;
}

inline bool JSValue::isCell() const
{
    return !(u.asInt64 & NotCellMask);
}

inline bool JSValue::isInt32() const
{
    return (u.asInt64 & NumberTag) == NumberTag;
}

inline int64_t reinterpretDoubleToInt64(double value)
{
    return std::bit_cast<int64_t>(value);
}
inline double reinterpretInt64ToDouble(int64_t value)
{
    return std::bit_cast<double>(value);
}

ALWAYS_INLINE JSValue::JSValue(EncodeAsDoubleTag, double d)
{
    ASSERT(!isImpureNaN(d));
    u.asInt64 = reinterpretDoubleToInt64(d) + JSValue::DoubleEncodeOffset;
}

inline JSValue::JSValue(int i)
{
    u.asInt64 = JSValue::NumberTag | static_cast<uint32_t>(i);
}

inline double JSValue::asDouble() const
{
    ASSERT(isDouble());
    return reinterpretInt64ToDouble(u.asInt64 - JSValue::DoubleEncodeOffset);
}

inline bool JSValue::isNumber() const
{
    return u.asInt64 & JSValue::NumberTag;
}

ALWAYS_INLINE JSCell* JSValue::asCell() const
{
    ASSERT(isCell());
    return u.ptr;
}

ALWAYS_INLINE JSBigInt* JSValue::asHeapBigInt() const
{
    ASSERT(isHeapBigInt());
    return static_cast<JSBigInt*>(u.ptr);
}

#endif // USE(JSVALUE64)

#if USE(BIGINT32)
inline JSValue::JSValue(EncodeAsBigInt32Tag, int32_t value)
{
    uint64_t shiftedValue = static_cast<uint64_t>(static_cast<uint32_t>(value)) << 16;
    ASSERT(!(shiftedValue & NumberTag));
    u.asInt64 = shiftedValue | BigInt32Tag;
}
#endif // USE(BIGINT32)

#if ENABLE(WEBASSEMBLY) && USE(JSVALUE32_64)
inline JSValue::JSValue(EncodeAsUnboxedFloatTag, float value)
{
    u.asBits.payload = std::bit_cast<int32_t>(value);
}
#endif

inline int64_t tryConvertToInt52(double number)
{
    if (number != number)
        return JSValue::notInt52;
#if OS(WINDOWS) && CPU(X86)
    // The VS Compiler for 32-bit builds generates a floating point error when attempting to cast
    // from an infinity to a 64-bit integer. We leave this routine with the floating point error
    // left in a register, causing undefined behavior in later floating point operations.
    //
    // To avoid this issue, we check for infinity here, and return false in that case.
    if (std::isinf(number))
        return JSValue::notInt52;
#endif
    int64_t asInt64 = static_cast<int64_t>(number);
    if (asInt64 != number)
        return JSValue::notInt52;
    if (!asInt64 && std::signbit(number))
        return JSValue::notInt52;
    if (asInt64 >= (static_cast<int64_t>(1) << (JSValue::numberOfInt52Bits - 1)))
        return JSValue::notInt52;
    if (asInt64 < -(static_cast<int64_t>(1) << (JSValue::numberOfInt52Bits - 1)))
        return JSValue::notInt52;
    return asInt64;
}

inline bool isInt52(double number)
{
    return tryConvertToInt52(number) != JSValue::notInt52;
}

inline bool JSValue::isAnyInt() const
{
    if (isInt32())
        return true;
    if (!isNumber())
        return false;
    return isInt52(asDouble());
}

inline int64_t JSValue::asAnyInt() const
{
    ASSERT(isAnyInt());
    if (isInt32())
        return asInt32();
    return static_cast<int64_t>(asDouble());
}

inline bool JSValue::isInt32AsAnyInt() const
{
    if (!isAnyInt())
        return false;
    int64_t value = asAnyInt();
    return value >= INT32_MIN && value <= INT32_MAX;
}

inline int32_t JSValue::asInt32AsAnyInt() const
{
    ASSERT(isInt32AsAnyInt());
    if (isInt32())
        return asInt32();
    return static_cast<int32_t>(asDouble());
}

inline bool JSValue::isUInt32AsAnyInt() const
{
    if (!isAnyInt())
        return false;
    int64_t value = asAnyInt();
    return value >= 0 && value <= UINT32_MAX;
}

inline uint32_t JSValue::asUInt32AsAnyInt() const
{
    ASSERT(isUInt32AsAnyInt());
    if (isUInt32())
        return asUInt32();
    return static_cast<uint32_t>(asDouble());
}

inline bool JSValue::isString() const
{
    return isCell() && asCell()->isString();
}

inline bool JSValue::isBigInt() const
{
    return isBigInt32() || isHeapBigInt();
}

inline bool JSValue::isHeapBigInt() const
{
    return isCell() && asCell()->isHeapBigInt();
}

inline bool JSValue::isBigInt32() const
{
#if USE(BIGINT32)
    return (u.asInt64 & BigInt32Mask) == BigInt32Tag;
#else
    return false;
#endif
}

#if USE(BIGINT32)
inline int32_t JSValue::bigInt32AsInt32() const
{
    ASSERT(isBigInt32());
    return static_cast<int32_t>(u.asInt64 >> 16);
}
#endif // USE(BIGINT32)

inline bool JSValue::isZeroBigInt() const
{
    ASSERT(isBigInt());
#if USE(BIGINT32)
    if (isBigInt32())
        return !bigInt32AsInt32();
#endif
    ASSERT(isHeapBigInt());
    return asHeapBigInt()->isZero();
}

inline bool JSValue::isNegativeBigInt() const
{
    ASSERT(isBigInt());
#if USE(BIGINT32)
    if (isBigInt32())
        return bigInt32AsInt32() < 0;
#endif
    ASSERT(isHeapBigInt());
    return asHeapBigInt()->sign();
}

inline bool JSValue::isSymbol() const
{
    return isCell() && asCell()->isSymbol();
}

inline bool JSValue::isPrimitive() const
{
    return !isCell() || asCell()->isString() || asCell()->isSymbol() || asCell()->isHeapBigInt();
}

inline bool JSValue::isGetterSetter() const
{
    return isCell() && asCell()->isGetterSetter();
}

inline bool JSValue::isCustomGetterSetter() const
{
    return isCell() && asCell()->isCustomGetterSetter();
}

inline bool JSValue::isObject() const
{
    return isCell() && asCell()->isObject();
}

inline bool JSValue::getString(JSGlobalObject* globalObject, String& s) const
{
    return isCell() && asCell()->getString(globalObject, s);
}

inline String JSValue::getString(JSGlobalObject* globalObject) const
{
    return isCell() ? asCell()->getString(globalObject) : String();
}

template <typename Base> String HandleConverter<Base, Unknown>::getString(JSGlobalObject* globalObject) const
{
    return jsValue().getString(globalObject);
}

inline JSObject* JSValue::getObject() const
{
    return isCell() ? asCell()->getObject() : nullptr;
}

ALWAYS_INLINE bool JSValue::getUInt32(uint32_t& v) const
{
    if (isInt32()) {
        int32_t i = asInt32();
        v = static_cast<uint32_t>(i);
        return i >= 0;
    }
    if (isDouble()) {
        double d = asDouble();
        v = static_cast<uint32_t>(d);
        return v == d;
    }
    return false;
}

ALWAYS_INLINE Identifier JSValue::toPropertyKey(JSGlobalObject* globalObject) const
{
    VM& vm = getVM(globalObject);
    auto scope = DECLARE_THROW_SCOPE(vm);

    if (isString())
        RELEASE_AND_RETURN(scope, asString(*this)->toIdentifier(globalObject));

    JSValue primitive = toPrimitive(globalObject, PreferString);
    RETURN_IF_EXCEPTION(scope, vm.propertyNames->emptyIdentifier);
    if (primitive.isSymbol())
        RELEASE_AND_RETURN(scope, Identifier::fromUid(asSymbol(primitive)->privateName()));

    auto string = primitive.toString(globalObject);
    RETURN_IF_EXCEPTION(scope, { });
    RELEASE_AND_RETURN(scope, string->toIdentifier(globalObject));
}

ALWAYS_INLINE JSValue JSValue::toPropertyKeyValue(JSGlobalObject* globalObject) const
{
    VM& vm = getVM(globalObject);
    auto scope = DECLARE_THROW_SCOPE(vm);

    if (isString() || isSymbol())
        return *this;

    JSValue primitive = toPrimitive(globalObject, PreferString);
    RETURN_IF_EXCEPTION(scope, JSValue());
    if (primitive.isSymbol())
        return primitive;

    RELEASE_AND_RETURN(scope, primitive.toString(globalObject));
}

inline JSValue JSValue::toPrimitive(JSGlobalObject* globalObject, PreferredPrimitiveType preferredType) const
{
    return isCell() ? asCell()->toPrimitive(globalObject, preferredType) : asValue();
}

inline PreferredPrimitiveType toPreferredPrimitiveType(JSGlobalObject* globalObject, JSValue value)
{
    VM& vm = getVM(globalObject);
    auto scope = DECLARE_THROW_SCOPE(vm);

    if (!value.isString()) {
        throwTypeError(globalObject, scope, "Primitive hint is not a string."_s);
        return NoPreference;
    }

    auto hintString = asString(value)->view(globalObject);
    RETURN_IF_EXCEPTION(scope, NoPreference);

    if (WTF::equal(hintString, "default"_s))
        return NoPreference;
    if (WTF::equal(hintString, "number"_s))
        return PreferNumber;
    if (WTF::equal(hintString, "string"_s))
        return PreferString;

    throwTypeError(globalObject, scope, "Expected primitive hint to match one of 'default', 'number', 'string'."_s);
    return NoPreference;
}

ALWAYS_INLINE double JSValue::toNumber(JSGlobalObject* globalObject) const
{
    if (isInt32())
        return asInt32();
    if (isDouble())
        return asDouble();
    return toNumberSlowCase(globalObject);
}

ALWAYS_INLINE JSValue JSValue::toNumeric(JSGlobalObject* globalObject) const
{
    VM& vm = globalObject->vm();
    auto scope = DECLARE_THROW_SCOPE(vm);

    if (isInt32() || isDouble() || isBigInt())
        return *this;

    if (isString())
        RELEASE_AND_RETURN(scope, jsNumber(asString(*this)->toNumber(globalObject)));

    JSValue primValue = this->toPrimitive(globalObject, PreferNumber);
    RETURN_IF_EXCEPTION(scope, { });

    if (primValue.isDouble() || primValue.isBigInt())
        return primValue;

    double value = primValue.toNumber(globalObject);
    RETURN_IF_EXCEPTION(scope, { });

    return jsNumber(value);
}

ALWAYS_INLINE std::optional<uint32_t> JSValue::toUInt32AfterToNumeric(JSGlobalObject* globalObject) const
{
    VM& vm = getVM(globalObject);
    auto scope = DECLARE_THROW_SCOPE(vm);
    JSValue result = toBigIntOrInt32(globalObject);
    RETURN_IF_EXCEPTION(scope, { });
    if (LIKELY(result.isInt32()))
        return static_cast<uint32_t>(result.asInt32());
    return std::nullopt;
}

ALWAYS_INLINE JSValue JSValue::toBigIntOrInt32(JSGlobalObject* globalObject) const
{
    VM& vm = getVM(globalObject);
    auto scope = DECLARE_THROW_SCOPE(vm);

    if (isInt32() || isBigInt())
        return *this;
    if (isDouble() && canBeInt32(asDouble()))
        return jsNumber(static_cast<int32_t>(asDouble()));

    JSValue primValue = this->toPrimitive(globalObject, PreferNumber);
    RETURN_IF_EXCEPTION(scope, { });

    if (primValue.isInt32() || primValue.isBigInt())
        return primValue;

    int32_t value = primValue.toInt32(globalObject);
    RETURN_IF_EXCEPTION(scope, { });
    return jsNumber(value);
}

inline bool JSValue::toBoolean(JSGlobalObject* globalObject) const
{
    if (isInt32())
        return asInt32();
    if (isDouble())
        return asDouble() > 0.0 || asDouble() < 0.0; // false for NaN
    if (isCell())
        return asCell()->toBoolean(globalObject);
#if USE(BIGINT32)
    if (isBigInt32())
        return !!bigInt32AsInt32();
#endif
    return isTrue(); // false, null, and undefined all convert to false.
}

inline JSString* JSValue::toString(JSGlobalObject* globalObject) const
{
    if (isString())
        return asString(asCell());
    bool returnEmptyStringOnError = true;
    return toStringSlowCase(globalObject, returnEmptyStringOnError);
}

inline JSString* JSValue::toStringOrNull(JSGlobalObject* globalObject) const
{
    if (isString())
        return asString(asCell());
    bool returnEmptyStringOnError = false;
    return toStringSlowCase(globalObject, returnEmptyStringOnError);
}

inline String JSValue::toWTFString(JSGlobalObject* globalObject) const
{
    if (isString())
        return static_cast<JSString*>(asCell())->value(globalObject);
    return toWTFStringSlowCase(globalObject);
}

inline JSObject* JSValue::toObject(JSGlobalObject* globalObject) const
{
    return isCell() ? asCell()->toObject(globalObject) : toObjectSlowCase(globalObject);
}

inline bool JSValue::isCallable() const
{
    return isCell() && asCell()->isCallable();
}

template<Concurrency concurrency>
inline TriState JSValue::isCallableWithConcurrency() const
{
    if (!isCell())
        return TriState::False;
    return asCell()->isCallableWithConcurrency<concurrency>();
}

inline bool JSValue::isConstructor() const
{
    return isCell() && asCell()->isConstructor();
}

template<Concurrency concurrency>
inline TriState JSValue::isConstructorWithConcurrency() const
{
    if (!isCell())
        return TriState::False;
    return asCell()->isConstructorWithConcurrency<concurrency>();
}

// this method is here to be after the inline declaration of JSCell::inherits
inline bool JSValue::inherits(const ClassInfo* classInfo) const
{
    return isCell() && asCell()->inherits(classInfo);
}

template<typename Target>
inline bool JSValue::inherits() const
{
    return isCell() && asCell()->inherits<Target>();
}

inline const ClassInfo* JSValue::classInfoOrNull() const
{
    return isCell() ? asCell()->classInfo() : nullptr;
}

inline JSValue JSValue::toThis(JSGlobalObject* globalObject, ECMAMode ecmaMode) const
{
    if (isObject()) {
        if (asObject(*this)->inherits<JSScope>())
            return ecmaMode.isStrict() ? jsUndefined() : globalObject->globalThis();
        return *this;
    }

    if (ecmaMode.isStrict())
        return *this;

    ASSERT(!ecmaMode.isStrict());
    if (isUndefinedOrNull())
        return globalObject->globalThis();

    return toThisSloppySlowCase(globalObject);
}

ALWAYS_INLINE JSValue JSValue::get(JSGlobalObject* globalObject, PropertyName propertyName) const
{
    PropertySlot slot(asValue(), PropertySlot::InternalMethodType::Get);
    return get(globalObject, propertyName, slot);
}

ALWAYS_INLINE JSValue JSValue::get(JSGlobalObject* globalObject, PropertyName propertyName, PropertySlot& slot) const
{
    auto scope = DECLARE_THROW_SCOPE(getVM(globalObject));
    bool hasSlot = getPropertySlot(globalObject, propertyName, slot);
    EXCEPTION_ASSERT(!scope.exception() || !hasSlot);
    if (!hasSlot)
        return jsUndefined();
    RELEASE_AND_RETURN(scope, slot.getValue(globalObject, propertyName));
}

template<typename CallbackWhenNoException>
ALWAYS_INLINE typename std::invoke_result<CallbackWhenNoException, bool, PropertySlot&>::type JSValue::getPropertySlot(JSGlobalObject* globalObject, PropertyName propertyName, CallbackWhenNoException callback) const
{
    PropertySlot slot(asValue(), PropertySlot::InternalMethodType::Get);
    return getPropertySlot(globalObject, propertyName, slot, callback);
}

template<typename CallbackWhenNoException>
ALWAYS_INLINE typename std::invoke_result<CallbackWhenNoException, bool, PropertySlot&>::type JSValue::getPropertySlot(JSGlobalObject* globalObject, PropertyName propertyName, PropertySlot& slot, CallbackWhenNoException callback) const
{
    auto scope = DECLARE_THROW_SCOPE(getVM(globalObject));
    bool found = getPropertySlot(globalObject, propertyName, slot);
    RETURN_IF_EXCEPTION(scope, { });
    RELEASE_AND_RETURN(scope, callback(found, slot));
}

ALWAYS_INLINE bool JSValue::getPropertySlot(JSGlobalObject* globalObject, PropertyName propertyName, PropertySlot& slot) const
{
    auto scope = DECLARE_THROW_SCOPE(getVM(globalObject));
    // If this is a primitive, we'll need to synthesize the prototype -
    // and if it's a string there are special properties to check first.
    JSObject* object;
    if (UNLIKELY(!isObject())) {
        if (isString()) {
            bool hasProperty = asString(*this)->getStringPropertySlot(globalObject, propertyName, slot);
            RETURN_IF_EXCEPTION(scope, false);
            if (hasProperty)
                return true;
        }
        object = synthesizePrototype(globalObject);
        EXCEPTION_ASSERT(!!scope.exception() == !object);
        if (UNLIKELY(!object))
            return false;
    } else
        object = asObject(asCell());

    RELEASE_AND_RETURN(scope, object->getPropertySlot(globalObject, propertyName, slot));
}

ALWAYS_INLINE bool JSValue::getOwnPropertySlot(JSGlobalObject* globalObject, PropertyName propertyName, PropertySlot& slot) const
{
    // If this is a primitive, we'll need to synthesize the prototype -
    // and if it's a string there are special properties to check first.
    auto scope = DECLARE_THROW_SCOPE(getVM(globalObject));
    if (UNLIKELY(!isObject())) {
        if (isString())
            RELEASE_AND_RETURN(scope, asString(*this)->getStringPropertySlot(globalObject, propertyName, slot));

        if (isUndefinedOrNull())
            throwException(globalObject, scope, createNotAnObjectError(globalObject, *this));
        return false;
    }
    RELEASE_AND_RETURN(scope, asObject(asCell())->getOwnPropertySlotInline(globalObject, propertyName, slot));
}

ALWAYS_INLINE JSValue JSValue::get(JSGlobalObject* globalObject, unsigned propertyName) const
{
    PropertySlot slot(asValue(), PropertySlot::InternalMethodType::Get);
    return get(globalObject, propertyName, slot);
}

ALWAYS_INLINE JSValue JSValue::get(JSGlobalObject* globalObject, unsigned propertyName, PropertySlot& slot) const
{
    auto scope = DECLARE_THROW_SCOPE(getVM(globalObject));
    // If this is a primitive, we'll need to synthesize the prototype -
    // and if it's a string there are special properties to check first.
    JSObject* object;
    if (UNLIKELY(!isObject())) {
        if (isString()) {
            bool hasProperty = asString(*this)->getStringPropertySlot(globalObject, propertyName, slot);
            RETURN_IF_EXCEPTION(scope, { });
            if (hasProperty)
                RELEASE_AND_RETURN(scope, slot.getValue(globalObject, propertyName));
        }
        object = synthesizePrototype(globalObject);
        EXCEPTION_ASSERT(!!scope.exception() == !object);
        if (UNLIKELY(!object))
            return JSValue();
    } else
        object = asObject(asCell());
    
    bool hasSlot = object->getPropertySlot(globalObject, propertyName, slot);
    EXCEPTION_ASSERT(!scope.exception() || !hasSlot);
    if (!hasSlot)
        return jsUndefined();
    RELEASE_AND_RETURN(scope, slot.getValue(globalObject, propertyName));
}

ALWAYS_INLINE JSValue JSValue::get(JSGlobalObject* globalObject, uint64_t propertyName) const
{
    if (LIKELY(propertyName <= std::numeric_limits<unsigned>::max()))
        return get(globalObject, static_cast<unsigned>(propertyName));
    return get(globalObject, Identifier::from(getVM(globalObject), static_cast<double>(propertyName)));
}

template<typename T, typename PropertyNameType>
ALWAYS_INLINE T JSValue::getAs(JSGlobalObject* globalObject, PropertyNameType propertyName) const
{
    JSValue value = get(globalObject, propertyName);
#if ASSERT_ENABLED || ENABLE(SECURITY_ASSERTIONS)
    VM& vm = getVM(globalObject);
    if (vm.exceptionForInspection())
        return nullptr;
#endif
    return jsCast<T>(value);
}

inline bool JSValue::put(JSGlobalObject* globalObject, PropertyName propertyName, JSValue value, PutPropertySlot& slot)
{
    if (UNLIKELY(!isCell()))
        return putToPrimitive(globalObject, propertyName, value, slot);

    return asCell()->methodTable()->put(asCell(), globalObject, propertyName, value, slot);
}

ALWAYS_INLINE bool JSValue::putInline(JSGlobalObject* globalObject, PropertyName propertyName, JSValue value, PutPropertySlot& slot)
{
    if (UNLIKELY(!isCell()))
        return putToPrimitive(globalObject, propertyName, value, slot);
    return asCell()->putInline(globalObject, propertyName, value, slot);
}

inline bool JSValue::putByIndex(JSGlobalObject* globalObject, unsigned propertyName, JSValue value, bool shouldThrow)
{
    if (UNLIKELY(!isCell()))
        return putToPrimitiveByIndex(globalObject, propertyName, value, shouldThrow);

    return asCell()->methodTable()->putByIndex(asCell(), globalObject, propertyName, value, shouldThrow);
}

ALWAYS_INLINE JSValue JSValue::getPrototype(JSGlobalObject* globalObject) const
{
    VM& vm = getVM(globalObject);
    if (isObject())
        return asObject(asCell())->getPrototype(vm, globalObject);
    return synthesizePrototype(globalObject);
}

inline Structure* JSValue::structureOrNull() const
{
    if (isCell())
        return asCell()->structure();
    return nullptr;
}

// ECMA 11.9.3
inline bool JSValue::equal(JSGlobalObject* globalObject, JSValue v1, JSValue v2)
{
    if (v1.isInt32() && v2.isInt32())
        return v1 == v2;

    return equalSlowCase(globalObject, v1, v2);
}

ALWAYS_INLINE bool JSValue::equalSlowCaseInline(JSGlobalObject* globalObject, JSValue v1, JSValue v2)
{
    VM& vm = getVM(globalObject);
    auto scope = DECLARE_THROW_SCOPE(vm);
    do {
        if (v1.isNumber()) {
            if (v2.isNumber())
                return v1.asNumber() == v2.asNumber();
            // Guaranteeing that if we have a number it is v2 makes some of the cases below simpler.
            std::swap(v1, v2);
        }

        // This deals with Booleans, BigInt32, Objects, and is a shortcut for a few more types.
        // It has to come here and not before, because it is NOT true that NaN == NaN
        if (v1 == v2)
            return true;

        if (v1.isUndefinedOrNull()) {
            if (v2.isUndefinedOrNull())
                return true;
            if (!v2.isCell())
                return false;
            return v2.asCell()->structure()->masqueradesAsUndefined(globalObject);
        }

        if (v2.isUndefinedOrNull()) {
            if (!v1.isCell())
                return false;
            return v1.asCell()->structure()->masqueradesAsUndefined(globalObject);
        }

        if (v1.isObject()) {
            if (v2.isObject())
                return false; // v1 == v2 is already dealt with previously
            JSValue p1 = v1.toPrimitive(globalObject);
            RETURN_IF_EXCEPTION(scope, false);
            v1 = p1;
            if (v1.isInt32() && v2.isInt32())
                return v1 == v2;
            continue;
        }

        if (v2.isObject()) {
            JSValue p2 = v2.toPrimitive(globalObject);
            RETURN_IF_EXCEPTION(scope, false);
            v2 = p2;
            if (v1.isInt32() && v2.isInt32())
                return v1 == v2;
            continue;
        }

        bool sym1 = v1.isSymbol();
        bool sym2 = v2.isSymbol();
        if (sym1 || sym2) {
            if (sym1 && sym2)
                return false; // v1 == v2 is already dealt with previously
            return false;
        }

        bool s1 = v1.isString();
        bool s2 = v2.isString();
        if (s1) {
            if (s2)
                RELEASE_AND_RETURN(scope, asString(v1)->equal(globalObject, asString(v2)));
            std::swap(v1, v2);
            // We are guaranteed to enter the next case, so losing the invariant of only v2 being a number is fine
        }
        if (s1 || s2) {
            // We are guaranteed that the string is v2 (thanks to the swap above)
            if (v1.isBigInt()) {
                auto v2String = asString(v2)->value(globalObject);
                RETURN_IF_EXCEPTION(scope, false);
                v2 = JSBigInt::stringToBigInt(globalObject, v2String);
                RETURN_IF_EXCEPTION(scope, false);
                if (!v2)
                    return false;
                if (v1 == v2)
                    return true; // For BigInt32
                // We fallthrough to the generic code for comparing BigInts (which is only missing the BigInt32/BigInt32 case, hence the check above)
            } else {
                ASSERT(v1.isNumber() || v1.isBoolean());
                double d1 = v1.toNumber(globalObject);
                RETURN_IF_EXCEPTION(scope, false);
                double d2 = v2.toNumber(globalObject);
                RETURN_IF_EXCEPTION(scope, false);
                return d1 == d2;
            }
        }

        if (v1.isBoolean()) {
            if (v2.isNumber())
                return static_cast<double>(v1.asBoolean()) == v2.asNumber();
            v1 = JSValue(v1.toNumber(globalObject));
            RETURN_IF_EXCEPTION(scope, false);
            // We fallthrough to the BigInt/Number comparison below
            // We just need one more swap to repair the rule that only v2 is allowed to be a number in these comparisons
            std::swap(v1, v2);
        } else if (v2.isBoolean()) {
            v2 = JSValue(v2.toNumber(globalObject));
            RETURN_IF_EXCEPTION(scope, false);
            // We fallthrough to the BigInt/Number comparison below
        }

#if USE(BIGINT32)
        if (v1.isBigInt32()) {
            if (v2.isInt32())
                return v1.bigInt32AsInt32() == v2.asInt32();
            if (v2.isDouble())
                return static_cast<double>(v1.bigInt32AsInt32()) == v2.asDouble();
            std::swap(v1, v2);
        }
#endif // USE(BIGINT32)

        if (v1.isHeapBigInt()) {
            if (v2.isHeapBigInt())
                return JSBigInt::equals(v1.asHeapBigInt(), v2.asHeapBigInt());
#if USE(BIGINT32)
            if (v2.isBigInt32())
                return v1.asHeapBigInt()->equalsToInt32(v2.bigInt32AsInt32());
#endif // USE(BIGINT32)
            if (v2.isNumber())
                return v1.asHeapBigInt()->equalsToNumber(v2);
        }

        return false;
    } while (true);
}

// ECMA 11.9.3
ALWAYS_INLINE bool JSValue::strictEqualForCells(JSGlobalObject* globalObject, JSCell* v1, JSCell* v2)
{
    if (v1->isString() && v2->isString())
        return asString(v1)->equal(globalObject, asString(v2));
    if (v1->isHeapBigInt() && v2->isHeapBigInt())
        return JSBigInt::equals(static_cast<JSBigInt*>(v1), static_cast<JSBigInt*>(v2));
    return v1 == v2;
}

inline bool JSValue::strictEqual(JSGlobalObject* globalObject, JSValue v1, JSValue v2)
{
    if (v1.isInt32() && v2.isInt32())
        return v1 == v2;

    if (v1.isNumber() && v2.isNumber())
        return v1.asNumber() == v2.asNumber();

#if USE(BIGINT32)
    if (v1.isHeapBigInt() && v2.isBigInt32())
        return v1.asHeapBigInt()->equalsToInt32(v2.bigInt32AsInt32());
    if (v1.isBigInt32() && v2.isHeapBigInt())
        return v2.asHeapBigInt()->equalsToInt32(v1.bigInt32AsInt32());
#endif

    if (v1.isCell() && v2.isCell())
        return strictEqualForCells(globalObject, v1.asCell(), v2.asCell());

    return v1 == v2;
}

inline int32_t JSValue::asInt32ForArithmetic() const
{
    if (isBoolean())
        return asBoolean();
    return asInt32();
}

inline TriState JSValue::pureStrictEqual(JSValue v1, JSValue v2)
{
    if (v1.isInt32() && v2.isInt32())
        return triState(v1 == v2);

    if (v1.isNumber() && v2.isNumber())
        return triState(v1.asNumber() == v2.asNumber());

#if USE(BIGINT32)
    if (v1.isHeapBigInt() && v2.isBigInt32())
        return triState(v1.asHeapBigInt()->equalsToInt32(v2.bigInt32AsInt32()));
    if (v1.isBigInt32() && v2.isHeapBigInt())
        return triState(v2.asHeapBigInt()->equalsToInt32(v1.bigInt32AsInt32()));
#endif

    if (v1.isCell() && v2.isCell()) {
        if (v1.asCell()->isString() && v2.asCell()->isString()) {
            const StringImpl* v1String = asString(v1)->tryGetValueImpl();
            const StringImpl* v2String = asString(v2)->tryGetValueImpl();
            if (!v1String || !v2String)
                return TriState::Indeterminate;
            return triState(WTF::equal(*v1String, *v2String));
        }
        if (v1.asCell()->isHeapBigInt() && v2.asCell()->isHeapBigInt())
            return triState(JSBigInt::equals(v1.asHeapBigInt(), v2.asHeapBigInt()));
    }
    
    return triState(v1 == v2);
}

inline TriState JSValue::pureToBoolean() const
{
    if (isInt32())
        return asInt32() ? TriState::True : TriState::False;
    if (isDouble())
        return isNotZeroAndOrdered(asDouble()) ? TriState::True : TriState::False; // false for NaN
    if (isCell())
        return asCell()->pureToBoolean();
#if USE(BIGINT32)
    if (isBigInt32())
        return bigInt32AsInt32() ? TriState::True : TriState::False;
#endif
    return isTrue() ? TriState::True : TriState::False;
}

ALWAYS_INLINE bool JSValue::requireObjectCoercible(JSGlobalObject* globalObject) const
{
    VM& vm = getVM(globalObject);
    auto scope = DECLARE_THROW_SCOPE(vm);

    if (!isUndefinedOrNull())
        return true;
    throwException(globalObject, scope, createNotAnObjectError(globalObject, *this));
    return false;
}

ALWAYS_INLINE bool isThisValueAltered(const PutPropertySlot& slot, JSObject* baseObject)
{
    JSValue thisValue = slot.thisValue();
    if (LIKELY(thisValue == baseObject))
        return false;

    if (!thisValue.isObject())
        return true;
    JSObject* thisObject = asObject(thisValue);
    // Only GlobalProxyType can be seen as the same to the original target object.
    if (thisObject->type() == GlobalProxyType && jsCast<JSGlobalProxy*>(thisObject)->target() == baseObject)
        return false;
    return true;
}

// See section 7.2.9: https://tc39.github.io/ecma262/#sec-samevalue
ALWAYS_INLINE bool sameValue(JSGlobalObject* globalObject, JSValue a, JSValue b)
{
    if (a == b)
        return true;

    if (!a.isNumber())
        return JSValue::strictEqual(globalObject, a, b);
    if (!b.isNumber())
        return false;
    double x = a.asNumber();
    double y = b.asNumber();
    bool xIsNaN = std::isnan(x);
    bool yIsNaN = std::isnan(y);
    if (xIsNaN || yIsNaN)
        return xIsNaN && yIsNaN;
    return std::bit_cast<uint64_t>(x) == std::bit_cast<uint64_t>(y);
}

} // namespace JSC
