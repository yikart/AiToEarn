/*
 *  Copyright (C) 1999-2000 Harri Porten (porten@kde.org)
 *  Copyright (C) 2002-2020 Apple Inc. All rights reserved.
 *
 *  This library is free software; you can redistribute it and/or
 *  modify it under the terms of the GNU Library General Public
 *  License as published by the Free Software Foundation; either
 *  version 2 of the License, or (at your option) any later version.
 *
 *  This library is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 *  Library General Public License for more details.
 *
 *  You should have received a copy of the GNU Library General Public License
 *  along with this library; see the file COPYING.LIB.  If not, write to
 *  the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 *  Boston, MA 02110-1301, USA.
 *
 */

#pragma once

#include "CallFrame.h"
#include "ExceptionHelpers.h"
#include "JSBigInt.h"
#include "JSGlobalObject.h"
#include <wtf/text/MakeString.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

#define InvalidPrototypeChain (std::numeric_limits<size_t>::max())

NEVER_INLINE JSValue jsAddSlowCase(JSGlobalObject*, JSValue, JSValue);
JSString* jsTypeStringForValueWithConcurrency(VM&, JSGlobalObject*, JSValue, Concurrency);
size_t normalizePrototypeChain(JSGlobalObject*, JSCell*, bool& sawPolyProto);

template<Concurrency concurrency>
ALWAYS_INLINE TriState jsTypeofIsObjectWithConcurrency(JSGlobalObject* globalObject, JSValue value)
{
    if (!value.isObject())
        return triState(value.isNull());
    JSObject* object = asObject(value);
    if (object->structure()->masqueradesAsUndefined(globalObject))
        return TriState::False;
    return invert(object->isCallableWithConcurrency<concurrency>());
}

template<Concurrency concurrency>
ALWAYS_INLINE TriState jsTypeofIsFunctionWithConcurrency(JSGlobalObject* globalObject, JSValue value)
{
    if (!value.isObject())
        return TriState::False;
    JSObject* object = asObject(value);
    if (object->structure()->masqueradesAsUndefined(globalObject))
        return TriState::False;
    return object->isCallableWithConcurrency<concurrency>();
}

inline JSString* jsTypeStringForValue(JSGlobalObject* globalObject, JSValue value)
{
    return jsTypeStringForValueWithConcurrency(getVM(globalObject), globalObject, value, Concurrency::MainThread);
}

ALWAYS_INLINE bool jsTypeofIsObject(JSGlobalObject* globalObject, JSValue value)
{
    auto result = jsTypeofIsObjectWithConcurrency<Concurrency::MainThread>(globalObject, value);
    ASSERT(result != TriState::Indeterminate);
    return result == TriState::True;
}

ALWAYS_INLINE bool jsTypeofIsFunction(JSGlobalObject* globalObject, JSValue value)
{
    auto result = jsTypeofIsFunctionWithConcurrency<Concurrency::MainThread>(globalObject, value);
    ASSERT(result != TriState::Indeterminate);
    return result == TriState::True;
}

ALWAYS_INLINE JSString* jsString(JSGlobalObject* globalObject, const String& u1, JSString* s2)
{
    VM& vm = getVM(globalObject);
    auto scope = DECLARE_THROW_SCOPE(vm);

    unsigned length1 = u1.length();
    if (!length1)
        return s2;
    unsigned length2 = s2->length();
    if (!length2)
        return jsString(vm, u1);
    static_assert(JSString::MaxLength == std::numeric_limits<int32_t>::max());
    if (sumOverflows<int32_t>(length1, length2)) {
        throwOutOfMemoryError(globalObject, scope);
        return nullptr;
    }

    // (1) Cost of making JSString    : sizeof(JSString) (for new string) + sizeof(StringImpl header) + length1 + length2
    // (2) Cost of making JSRopeString: sizeof(JSString) (for u1) + sizeof(JSRopeString)
    // We do not account u1 cost in (2) since u1 may be shared StringImpl, and it may not introduce additional cost.
    // We conservatively consider the cost of u1. Currently, we are not considering about is8Bit() case because 16-bit
    // strings are relatively rare. But we can do that if we need to consider it.
    if (s2->isRope() || (StringImpl::headerSize<LChar>() + length1 + length2) >= sizeof(JSRopeString))
        return JSRopeString::create(vm, jsString(vm, u1), s2);

    ASSERT(!s2->isRope());
    auto u2 = s2->value(globalObject);
    scope.assertNoException();
    String newString = tryMakeString(u1, u2.data);
    if (!newString) {
        throwOutOfMemoryError(globalObject, scope);
        return nullptr;
    }
    return JSString::create(vm, newString.releaseImpl().releaseNonNull());
}

ALWAYS_INLINE JSString* jsString(JSGlobalObject* globalObject, JSString* s1, const String& u2)
{
    VM& vm = getVM(globalObject);
    auto scope = DECLARE_THROW_SCOPE(vm);

    unsigned length1 = s1->length();
    if (!length1)
        return jsString(vm, u2);
    unsigned length2 = u2.length();
    if (!length2)
        return s1;
    static_assert(JSString::MaxLength == std::numeric_limits<int32_t>::max());
    if (sumOverflows<int32_t>(length1, length2)) {
        throwOutOfMemoryError(globalObject, scope);
        return nullptr;
    }

    // (1) Cost of making JSString    : sizeof(JSString) (for new string) + sizeof(StringImpl header) + length1 + length2
    // (2) Cost of making JSRopeString: sizeof(JSString) (for u2) + sizeof(JSRopeString)
    if (s1->isRope() || (StringImpl::headerSize<LChar>() + length1 + length2) >= sizeof(JSRopeString))
        return JSRopeString::create(vm, s1, jsString(vm, u2));

    ASSERT(!s1->isRope());
    auto u1 = s1->value(globalObject);
    scope.assertNoException();
    String newString = tryMakeString(u1.data, u2);
    if (!newString) {
        throwOutOfMemoryError(globalObject, scope);
        return nullptr;
    }
    return JSString::create(vm, newString.releaseImpl().releaseNonNull());
}

ALWAYS_INLINE JSString* jsString(JSGlobalObject* globalObject, JSString* s1, JSString* s2)
{
    VM& vm = getVM(globalObject);
    auto scope = DECLARE_THROW_SCOPE(vm);

    unsigned length1 = s1 ? s1->length() : 0;
    if (!length1)
        return s2;
    unsigned length2 = s2 ? s2->length() : 0;
    if (!length2)
        return s1;
    static_assert(JSString::MaxLength == std::numeric_limits<int32_t>::max());
    if (sumOverflows<int32_t>(length1, length2)) {
        throwOutOfMemoryError(globalObject, scope);
        return nullptr;
    }

    return JSRopeString::create(vm, s1, s2);
}

ALWAYS_INLINE JSString* jsString(JSGlobalObject* globalObject, JSString* s1, JSString* s2, JSString* s3)
{
    VM& vm = getVM(globalObject);
    auto scope = DECLARE_THROW_SCOPE(vm);

    unsigned length1 = s1 ? s1->length() : 0;
    if (!length1)
        RELEASE_AND_RETURN(scope, jsString(globalObject, s2, s3));

    unsigned length2 = s2 ? s2->length() : 0;
    if (!length2)
        RELEASE_AND_RETURN(scope, jsString(globalObject, s1, s3));

    unsigned length3 = s3 ? s3->length() : 0;
    if (!length3)
        RELEASE_AND_RETURN(scope, jsString(globalObject, s1, s2));

    static_assert(JSString::MaxLength == std::numeric_limits<int32_t>::max());
    if (sumOverflows<int32_t>(length1, length2, length3)) {
        throwOutOfMemoryError(globalObject, scope);
        return nullptr;
    }

    return JSRopeString::create(vm, s1, s2, s3);
}

ALWAYS_INLINE JSString* jsString(JSGlobalObject* globalObject, const String& u1, const String& u2)
{
    VM& vm = getVM(globalObject);
    auto scope = DECLARE_THROW_SCOPE(vm);

    unsigned length1 = u1.length();
    if (!length1)
        return jsString(vm, u2);
    unsigned length2 = u2.length();
    if (!length2)
        return jsString(vm, u1);
    static_assert(JSString::MaxLength == std::numeric_limits<int32_t>::max());
    if (sumOverflows<int32_t>(length1, length2)) {
        throwOutOfMemoryError(globalObject, scope);
        return nullptr;
    }

    // (1) Cost of making JSString    : sizeof(JSString) (for new string) + sizeof(StringImpl header) + length1 + length2
    // (2) Cost of making JSRopeString: sizeof(JSString) (for u1) + sizeof(JSString) (for u2) + sizeof(JSRopeString)
    if ((StringImpl::headerSize<LChar>() + length1 + length2) >= (sizeof(JSRopeString) + sizeof(JSString)))
        return JSRopeString::create(vm, jsString(vm, u1), jsString(vm, u2));

    String newString = tryMakeString(u1, u2);
    if (!newString) {
        throwOutOfMemoryError(globalObject, scope);
        return nullptr;
    }
    return JSString::create(vm, newString.releaseImpl().releaseNonNull());
}

ALWAYS_INLINE JSString* jsString(JSGlobalObject* globalObject, const String& u1, const String& u2, const String& u3)
{
    VM& vm = getVM(globalObject);
    auto scope = DECLARE_THROW_SCOPE(vm);

    unsigned length1 = u1.length();
    unsigned length2 = u2.length();
    unsigned length3 = u3.length();
    ASSERT(length1 <= JSString::MaxLength);
    ASSERT(length2 <= JSString::MaxLength);
    ASSERT(length3 <= JSString::MaxLength);

    if (!length1)
        RELEASE_AND_RETURN(scope, jsString(globalObject, u2, u3));

    if (!length2)
        RELEASE_AND_RETURN(scope, jsString(globalObject, u1, u3));

    if (!length3)
        RELEASE_AND_RETURN(scope, jsString(globalObject, u1, u2));

    static_assert(JSString::MaxLength == std::numeric_limits<int32_t>::max());
    if (sumOverflows<int32_t>(length1, length2, length3)) {
        throwOutOfMemoryError(globalObject, scope);
        return nullptr;
    }

    // (1) Cost of making JSString    : sizeof(JSString) (for new string) + sizeof(StringImpl header) + length1 + length2 + length3
    // (2) Cost of making JSRopeString: sizeof(JSString) (for u1) + sizeof(JSString) (for u2) + sizeof(JSString) (for u3) + sizeof(JSRopeString)
    if ((StringImpl::headerSize<LChar>() + length1 + length2 + length3) >= (sizeof(JSRopeString) + sizeof(JSString) * 2))
        return JSRopeString::create(vm, jsString(vm, u1), jsString(vm, u2), jsString(vm, u3));

    String newString = tryMakeString(u1, u2, u3);
    if (!newString) {
        throwOutOfMemoryError(globalObject, scope);
        return nullptr;
    }
    return JSString::create(vm, newString.releaseImpl().releaseNonNull());
}

ALWAYS_INLINE JSValue jsStringFromRegisterArray(JSGlobalObject* globalObject, Register* strings, unsigned count)
{
    VM& vm = getVM(globalObject);
    auto scope = DECLARE_THROW_SCOPE(vm);
    JSRopeString::RopeBuilder<RecordOverflow> ropeBuilder(vm);

    for (unsigned i = 0; i < count; ++i) {
        JSValue v = strings[-static_cast<int>(i)].jsValue();
        JSString* string = v.toString(globalObject);
        RETURN_IF_EXCEPTION(scope, { });
        if (!ropeBuilder.append(string))
            return throwOutOfMemoryError(globalObject, scope);
    }

    return ropeBuilder.release();
}

ALWAYS_INLINE JSBigInt::ComparisonResult compareBigInt(JSValue left, JSValue right)
{
    ASSERT(left.isBigInt());
    ASSERT(right.isBigInt());
#if USE(BIGINT32)
    if (left.isBigInt32()) {
        if (right.isBigInt32())
            return JSBigInt::compare(left.bigInt32AsInt32(), right.bigInt32AsInt32());
        ASSERT(right.isHeapBigInt());
        return JSBigInt::compare(left.bigInt32AsInt32(), right.asHeapBigInt());
    }
    if (right.isBigInt32()) {
        ASSERT(left.isHeapBigInt());
        return JSBigInt::compare(left.asHeapBigInt(), right.bigInt32AsInt32());
    }
#endif
    return JSBigInt::compare(left.asHeapBigInt(), right.asHeapBigInt());
}

ALWAYS_INLINE JSBigInt::ComparisonResult compareBigIntToOtherPrimitive(JSGlobalObject* globalObject, JSBigInt* v1, JSValue primValue)
{
    VM& vm = globalObject->vm();
    auto scope = DECLARE_THROW_SCOPE(vm);

    ASSERT(primValue.isPrimitive());
    ASSERT(!primValue.isBigInt());

    if (primValue.isString()) {
        auto string = asString(primValue)->value(globalObject);
        RETURN_IF_EXCEPTION(scope, JSBigInt::ComparisonResult::Undefined);
        JSValue bigIntValue = JSBigInt::stringToBigInt(globalObject, WTFMove(string));
        RETURN_IF_EXCEPTION(scope, JSBigInt::ComparisonResult::Undefined);
        if (!bigIntValue)
            return JSBigInt::ComparisonResult::Undefined;

        if (bigIntValue.isHeapBigInt())
            return JSBigInt::compare(v1, bigIntValue.asHeapBigInt());

        ASSERT(bigIntValue.isBigInt32());
#if USE(BIGINT32)
        // FIXME: use something less hacky, e.g. some kind of JSBigInt::compareToInt32
        return JSBigInt::compareToDouble(v1, static_cast<double>(bigIntValue.bigInt32AsInt32()));
#endif
    }

    double numberValue = primValue.toNumber(globalObject);
    RETURN_IF_EXCEPTION(scope, JSBigInt::ComparisonResult::Undefined);
    return JSBigInt::compareToDouble(v1, numberValue);
}

ALWAYS_INLINE JSBigInt::ComparisonResult compareBigInt32ToOtherPrimitive(JSGlobalObject* globalObject, int32_t v1, JSValue primValue)
{
    VM& vm = globalObject->vm();
    auto scope = DECLARE_THROW_SCOPE(vm);

    ASSERT(primValue.isPrimitive());
    ASSERT(!primValue.isBigInt());

    auto compare = [&] (auto v1, auto v2) {
        static_assert(std::is_same_v<decltype(v1), decltype(v2)>);
        if (v1 == v2)
            return JSBigInt::ComparisonResult::Equal;
        if (v1 < v2)
            return JSBigInt::ComparisonResult::LessThan;
        return JSBigInt::ComparisonResult::GreaterThan;
    };

    if (primValue.isString()) {
        auto string = asString(primValue)->value(globalObject);
        RETURN_IF_EXCEPTION(scope, JSBigInt::ComparisonResult::Undefined);
        JSValue bigIntValue = JSBigInt::stringToBigInt(globalObject, WTFMove(string));
        RETURN_IF_EXCEPTION(scope, JSBigInt::ComparisonResult::Undefined);
        if (!bigIntValue)
            return JSBigInt::ComparisonResult::Undefined;

        if (bigIntValue.isHeapBigInt())
            return JSBigInt::compare(v1, bigIntValue.asHeapBigInt());

        ASSERT(bigIntValue.isBigInt32());
#if USE(BIGINT32)
        return compare(v1, bigIntValue.bigInt32AsInt32());
#endif
    }

    // Note that 0n <=> -0.0 is handling -0.0 as +0.
    double numberValue = primValue.toNumber(globalObject);
    RETURN_IF_EXCEPTION(scope, JSBigInt::ComparisonResult::Undefined);
    if (std::isnan(numberValue))
        return JSBigInt::ComparisonResult::Undefined;
    return compare(static_cast<double>(v1), numberValue);
}

ALWAYS_INLINE bool bigIntCompareResult(JSBigInt::ComparisonResult comparisonResult, JSBigInt::ComparisonMode comparisonMode)
{
    if (comparisonMode == JSBigInt::ComparisonMode::LessThan)
        return comparisonResult == JSBigInt::ComparisonResult::LessThan;

    ASSERT(comparisonMode == JSBigInt::ComparisonMode::LessThanOrEqual);
    return comparisonResult == JSBigInt::ComparisonResult::LessThan || comparisonResult == JSBigInt::ComparisonResult::Equal;
}

ALWAYS_INLINE bool bigIntCompare(JSGlobalObject* globalObject, JSValue v1, JSValue v2, JSBigInt::ComparisonMode comparisonMode)
{
    ASSERT(v1.isBigInt() || v2.isBigInt());
    ASSERT(v1.isPrimitive() && v2.isPrimitive());

    VM& vm = globalObject->vm();
    auto scope = DECLARE_THROW_SCOPE(vm);

    if (v1.isBigInt() && v2.isBigInt())
        return bigIntCompareResult(compareBigInt(v1, v2), comparisonMode);

#if USE(BIGINT32)
    if (v1.isBigInt32()) {
        ASSERT(!v2.isBigInt());
        auto comparisonResult = compareBigInt32ToOtherPrimitive(globalObject, v1.bigInt32AsInt32(), v2);
        RETURN_IF_EXCEPTION(scope, false);
        return bigIntCompareResult(comparisonResult, comparisonMode);
    }
    if (v2.isBigInt32()) {
        ASSERT(!v1.isBigInt());
        auto comparisonResult = compareBigInt32ToOtherPrimitive(globalObject, v2.bigInt32AsInt32(), v1);
        RETURN_IF_EXCEPTION(scope, false);
        return bigIntCompareResult(invertBigIntCompareResult(comparisonResult), comparisonMode);
    }
    ASSERT(!v1.isBigInt32() && !v2.isBigInt32());
#endif

    if (v1.isHeapBigInt()) {
        ASSERT(!v2.isBigInt());
        auto comparisonResult = compareBigIntToOtherPrimitive(globalObject, v1.asHeapBigInt(), v2);
        RETURN_IF_EXCEPTION(scope, false);
        return bigIntCompareResult(comparisonResult, comparisonMode);
    }

    // Here we check inverted because BigInt is the v2
    ASSERT(!v1.isBigInt());
    ASSERT(v2.isHeapBigInt());
    auto comparisonResult = compareBigIntToOtherPrimitive(globalObject, v2.asHeapBigInt(), v1);
    RETURN_IF_EXCEPTION(scope, false);
    return bigIntCompareResult(invertBigIntCompareResult(comparisonResult), comparisonMode);
}

ALWAYS_INLINE bool toPrimitiveNumeric(JSGlobalObject* globalObject, JSValue v, JSValue& p, double& n)
{
    VM& vm = globalObject->vm();
    auto scope = DECLARE_THROW_SCOPE(vm);
    
    p = v.toPrimitive(globalObject, PreferNumber);
    RETURN_IF_EXCEPTION(scope, false);
    if (p.isBigInt())
        return true;
    
    n = p.toNumber(globalObject);
    RETURN_IF_EXCEPTION(scope, false);
    return !p.isString();
}

// See ES5 11.8.1/11.8.2/11.8.5 for definition of leftFirst, this value ensures correct
// evaluation ordering for argument conversions for '<' and '>'. For '<' pass the value
// true, for leftFirst, for '>' pass the value false (and reverse operand order).
template<bool leftFirst>
ALWAYS_INLINE bool jsLess(JSGlobalObject* globalObject, JSValue v1, JSValue v2)
{
    VM& vm = globalObject->vm();
    auto scope = DECLARE_THROW_SCOPE(vm);

    if (v1.isInt32() && v2.isInt32())
        return v1.asInt32() < v2.asInt32();

    if (v1.isNumber() && v2.isNumber())
        return v1.asNumber() < v2.asNumber();

    if (isJSString(v1) && isJSString(v2)) {
        auto s1 = asString(v1)->value(globalObject);
        RETURN_IF_EXCEPTION(scope, false);
        auto s2 = asString(v2)->value(globalObject);
        RETURN_IF_EXCEPTION(scope, false);
        return codePointCompareLessThan(s1, s2);
    }

    double n1;
    double n2;
    JSValue p1;
    JSValue p2;
    bool wasNotString1;
    bool wasNotString2;
    if (leftFirst) {
        wasNotString1 = toPrimitiveNumeric(globalObject, v1, p1, n1);
        RETURN_IF_EXCEPTION(scope, false);
        wasNotString2 = toPrimitiveNumeric(globalObject, v2, p2, n2);
    } else {
        wasNotString2 = toPrimitiveNumeric(globalObject, v2, p2, n2);
        RETURN_IF_EXCEPTION(scope, false);
        wasNotString1 = toPrimitiveNumeric(globalObject, v1, p1, n1);
    }
    RETURN_IF_EXCEPTION(scope, false);

    if (wasNotString1 || wasNotString2) {
        if (p1.isBigInt() || p2.isBigInt())
            RELEASE_AND_RETURN(scope, bigIntCompare(globalObject, p1, p2, JSBigInt::ComparisonMode::LessThan));

        return n1 < n2;
    }

    return codePointCompareLessThan(asString(p1)->value(globalObject), asString(p2)->value(globalObject));
}

// See ES5 11.8.3/11.8.4/11.8.5 for definition of leftFirst, this value ensures correct
// evaluation ordering for argument conversions for '<=' and '=>'. For '<=' pass the
// value true, for leftFirst, for '=>' pass the value false (and reverse operand order).
template<bool leftFirst>
ALWAYS_INLINE bool jsLessEq(JSGlobalObject* globalObject, JSValue v1, JSValue v2)
{
    VM& vm = globalObject->vm();
    auto scope = DECLARE_THROW_SCOPE(vm);

    if (v1.isInt32() && v2.isInt32())
        return v1.asInt32() <= v2.asInt32();

    if (v1.isNumber() && v2.isNumber())
        return v1.asNumber() <= v2.asNumber();

    if (isJSString(v1) && isJSString(v2)) {
        auto s1 = asString(v1)->value(globalObject);
        RETURN_IF_EXCEPTION(scope, false);
        auto s2 = asString(v2)->value(globalObject);
        RETURN_IF_EXCEPTION(scope, false);
        return !codePointCompareLessThan(s2, s1);
    }

    double n1;
    double n2;
    JSValue p1;
    JSValue p2;
    bool wasNotString1;
    bool wasNotString2;
    if (leftFirst) {
        wasNotString1 = toPrimitiveNumeric(globalObject, v1, p1, n1);
        RETURN_IF_EXCEPTION(scope, false);
        wasNotString2 = toPrimitiveNumeric(globalObject, v2, p2, n2);
    } else {
        wasNotString2 = toPrimitiveNumeric(globalObject, v2, p2, n2);
        RETURN_IF_EXCEPTION(scope, false);
        wasNotString1 = toPrimitiveNumeric(globalObject, v1, p1, n1);
    }
    RETURN_IF_EXCEPTION(scope, false);

    if (wasNotString1 || wasNotString2) {
        if (p1.isBigInt() || p2.isBigInt())
            RELEASE_AND_RETURN(scope, bigIntCompare(globalObject, p1, p2, JSBigInt::ComparisonMode::LessThanOrEqual));

        return n1 <= n2;
    }
    return !codePointCompareLessThan(asString(p2)->value(globalObject), asString(p1)->value(globalObject));
}

// Fast-path choices here are based on frequency data from SunSpider:
//    <times> Add case: <t1> <t2>
//    ---------------------------
//    5626160 Add case: 3 3 (of these, 3637690 are for immediate values)
//    247412  Add case: 5 5
//    20900   Add case: 5 6
//    13962   Add case: 5 3
//    4000    Add case: 3 5


ALWAYS_INLINE JSValue jsAddNonNumber(JSGlobalObject* globalObject, JSValue v1, JSValue v2)
{
    VM& vm = globalObject->vm();
    auto scope = DECLARE_THROW_SCOPE(vm);
    ASSERT(!v1.isNumber() || !v2.isNumber());

    if (LIKELY(v1.isString() && !v2.isObject())) {
        if (v2.isString())
            RELEASE_AND_RETURN(scope, jsString(globalObject, asString(v1), asString(v2)));
        String s2 = v2.toWTFString(globalObject);
        RETURN_IF_EXCEPTION(scope, { });
        RELEASE_AND_RETURN(scope, jsString(globalObject, asString(v1), s2));
    }

    // All other cases are pretty uncommon
    RELEASE_AND_RETURN(scope, jsAddSlowCase(globalObject, v1, v2));
}

ALWAYS_INLINE JSValue jsAdd(JSGlobalObject* globalObject, JSValue v1, JSValue v2)
{
    if (v1.isNumber() && v2.isNumber())
        return jsNumber(v1.asNumber() + v2.asNumber());
        
    return jsAddNonNumber(globalObject, v1, v2);
}

template<typename DoubleOperation, typename BigIntOp>
ALWAYS_INLINE JSValue arithmeticBinaryOp(JSGlobalObject* globalObject, JSValue v1, JSValue v2, DoubleOperation&& doubleOp, BigIntOp&& bigIntOp, ASCIILiteral errorMessage)
{
    VM& vm = globalObject->vm();
    auto scope = DECLARE_THROW_SCOPE(vm);

    JSValue leftNumeric = v1.toNumeric(globalObject);
    RETURN_IF_EXCEPTION(scope, { });
    JSValue rightNumeric = v2.toNumeric(globalObject);
    RETURN_IF_EXCEPTION(scope, { });

    if (leftNumeric.isNumber() && rightNumeric.isNumber())
        return jsNumber(doubleOp(leftNumeric.asNumber(), rightNumeric.asNumber()));

#if USE(BIGINT32)
    if (leftNumeric.isBigInt32()) {
        if (rightNumeric.isBigInt32())
            RELEASE_AND_RETURN(scope, bigIntOp(globalObject, leftNumeric.bigInt32AsInt32(), rightNumeric.bigInt32AsInt32()));
        if (rightNumeric.isHeapBigInt())
            RELEASE_AND_RETURN(scope, bigIntOp(globalObject, leftNumeric.bigInt32AsInt32(), rightNumeric.asHeapBigInt()));
    } else if (leftNumeric.isHeapBigInt()) {
        if (rightNumeric.isBigInt32())
            RELEASE_AND_RETURN(scope, bigIntOp(globalObject, leftNumeric.asHeapBigInt(), rightNumeric.bigInt32AsInt32()));
        else if (rightNumeric.isHeapBigInt())
            RELEASE_AND_RETURN(scope, bigIntOp(globalObject, leftNumeric.asHeapBigInt(), rightNumeric.asHeapBigInt()));
    }
#else
    if (leftNumeric.isHeapBigInt() && rightNumeric.isHeapBigInt())
        RELEASE_AND_RETURN(scope, bigIntOp(globalObject, leftNumeric.asHeapBigInt(), rightNumeric.asHeapBigInt()));
#endif

    return throwTypeError(globalObject, scope, errorMessage);
}

ALWAYS_INLINE JSValue jsSub(JSGlobalObject* globalObject, JSValue v1, JSValue v2)
{
    auto doubleOp = [] (double left, double right) -> double {
        return left - right;
    };

    auto bigIntOp = [] (JSGlobalObject* globalObject, auto left, auto right) {
        return JSBigInt::sub(globalObject, left, right);
    };

    return arithmeticBinaryOp(globalObject, v1, v2, doubleOp, bigIntOp, "Invalid mix of BigInt and other type in subtraction."_s);
}

ALWAYS_INLINE JSValue jsMul(JSGlobalObject* globalObject, JSValue v1, JSValue v2)
{
    auto doubleOp = [] (double left, double right) -> double {
        return left * right;
    };

    auto bigIntOp = [] (JSGlobalObject* globalObject, auto left, auto right) {
        return JSBigInt::multiply(globalObject, left, right);
    };

    return arithmeticBinaryOp(globalObject, v1, v2, doubleOp, bigIntOp, "Invalid mix of BigInt and other type in multiplication."_s);
}

ALWAYS_INLINE JSValue jsDiv(JSGlobalObject* globalObject, JSValue v1, JSValue v2)
{
    auto doubleOp = [] (double left, double right) -> double {
        return left / right;
    };

    auto bigIntOp = [] (JSGlobalObject* globalObject, auto left, auto right) {
        return JSBigInt::divide(globalObject, left, right);
    };

    return arithmeticBinaryOp(globalObject, v1, v2, doubleOp, bigIntOp, "Invalid mix of BigInt and other type in division."_s);
}

ALWAYS_INLINE JSValue jsRemainder(JSGlobalObject* globalObject, JSValue v1, JSValue v2)
{
    auto doubleOp = [] (double left, double right) -> double {
        return Math::fmodDouble(left, right);
    };

    auto bigIntOp = [] (JSGlobalObject* globalObject, auto left, auto right) {
        return JSBigInt::remainder(globalObject, left, right);
    };

    return arithmeticBinaryOp(globalObject, v1, v2, doubleOp, bigIntOp, "Invalid mix of BigInt and other type in remainder."_s);
}

ALWAYS_INLINE JSValue jsPow(JSGlobalObject* globalObject, JSValue v1, JSValue v2)
{
    auto doubleOp = [] (double left, double right) -> double {
        return operationMathPow(left, right);
    };

    auto bigIntOp = [] (JSGlobalObject* globalObject, auto left, auto right) {
        return JSBigInt::exponentiate(globalObject, left, right);
    };

    return arithmeticBinaryOp(globalObject, v1, v2, doubleOp, bigIntOp, "Invalid mix of BigInt and other type in exponentiation."_s);
}

ALWAYS_INLINE JSValue jsInc(JSGlobalObject* globalObject, JSValue v)
{
    VM& vm = globalObject->vm();
    auto scope = DECLARE_THROW_SCOPE(vm);

    auto operandNumeric = v.toNumeric(globalObject);
    RETURN_IF_EXCEPTION(scope, { });

    if (operandNumeric.isNumber())
        return jsNumber(operandNumeric.asNumber() + 1);

#if USE(BIGINT32)
    if (operandNumeric.isBigInt32())
        RELEASE_AND_RETURN(scope, JSBigInt::inc(globalObject, operandNumeric.bigInt32AsInt32()));
#endif

    ASSERT(operandNumeric.isHeapBigInt());
    RELEASE_AND_RETURN(scope, JSBigInt::inc(globalObject, operandNumeric.asHeapBigInt()));
}

ALWAYS_INLINE JSValue jsDec(JSGlobalObject* globalObject, JSValue v)
{
    VM& vm = globalObject->vm();
    auto scope = DECLARE_THROW_SCOPE(vm);

    auto operandNumeric = v.toNumeric(globalObject);
    RETURN_IF_EXCEPTION(scope, { });

    if (operandNumeric.isNumber())
        return jsNumber(operandNumeric.asNumber() - 1);

#if USE(BIGINT32)
    if (operandNumeric.isBigInt32())
        RELEASE_AND_RETURN(scope, JSBigInt::dec(globalObject, operandNumeric.bigInt32AsInt32()));
#endif

    ASSERT(operandNumeric.isHeapBigInt());
    RELEASE_AND_RETURN(scope, JSBigInt::dec(globalObject, operandNumeric.asHeapBigInt()));
}

ALWAYS_INLINE JSValue jsBitwiseNot(JSGlobalObject* globalObject, JSValue v)
{
    VM& vm = globalObject->vm();
    auto scope = DECLARE_THROW_SCOPE(vm);

    auto operandNumeric = v.toBigIntOrInt32(globalObject);
    RETURN_IF_EXCEPTION(scope, { });

    if (operandNumeric.isInt32())
        return jsNumber(~operandNumeric.asInt32());

#if USE(BIGINT32)
    if (operandNumeric.isBigInt32())
        RELEASE_AND_RETURN(scope, JSBigInt::bitwiseNot(globalObject, operandNumeric.bigInt32AsInt32()));
#endif

    ASSERT(operandNumeric.isHeapBigInt());
    RELEASE_AND_RETURN(scope, JSBigInt::bitwiseNot(globalObject, operandNumeric.asHeapBigInt()));
}

template <bool isLeft>
ALWAYS_INLINE JSValue shift(JSGlobalObject* globalObject, JSValue v1, JSValue v2)
{
    VM& vm = globalObject->vm();
    auto scope = DECLARE_THROW_SCOPE(vm);

    auto leftNumeric = v1.toBigIntOrInt32(globalObject);
    RETURN_IF_EXCEPTION(scope, { });
    auto rightNumeric = v2.toBigIntOrInt32(globalObject);
    RETURN_IF_EXCEPTION(scope, { });

    if (leftNumeric.isInt32() && rightNumeric.isInt32()) {
        int32_t leftInt32 = leftNumeric.asInt32();
        int32_t rightInt32 = rightNumeric.asInt32() & 31;
        int32_t result = isLeft ? (leftInt32 << rightInt32) : (leftInt32 >> rightInt32);
        return jsNumber(result);
    }

#if USE(BIGINT32)
    if (leftNumeric.isBigInt32()) {
        if (rightNumeric.isBigInt32()) {
            if (isLeft)
                RELEASE_AND_RETURN(scope, JSBigInt::leftShift(globalObject, leftNumeric.bigInt32AsInt32(), rightNumeric.bigInt32AsInt32()));
            RELEASE_AND_RETURN(scope, JSBigInt::signedRightShift(globalObject, leftNumeric.bigInt32AsInt32(), rightNumeric.bigInt32AsInt32()));
        }
        if (rightNumeric.isHeapBigInt()) {
            if (isLeft)
                RELEASE_AND_RETURN(scope, JSBigInt::leftShift(globalObject, leftNumeric.bigInt32AsInt32(), rightNumeric.asHeapBigInt()));
            RELEASE_AND_RETURN(scope, JSBigInt::signedRightShift(globalObject, leftNumeric.bigInt32AsInt32(), rightNumeric.asHeapBigInt()));
        }
    } else if (leftNumeric.isHeapBigInt()) {
        if (rightNumeric.isBigInt32()) {
            if (isLeft)
                RELEASE_AND_RETURN(scope, JSBigInt::leftShift(globalObject, leftNumeric.asHeapBigInt(), rightNumeric.bigInt32AsInt32()));
            RELEASE_AND_RETURN(scope, JSBigInt::signedRightShift(globalObject, leftNumeric.asHeapBigInt(), rightNumeric.bigInt32AsInt32()));
        } else if (rightNumeric.isHeapBigInt()) {
            if (isLeft)
                RELEASE_AND_RETURN(scope, JSBigInt::leftShift(globalObject, leftNumeric.asHeapBigInt(), rightNumeric.asHeapBigInt()));
            RELEASE_AND_RETURN(scope, JSBigInt::signedRightShift(globalObject, leftNumeric.asHeapBigInt(), rightNumeric.asHeapBigInt()));
        }
    }
#else
    if (leftNumeric.isHeapBigInt() && rightNumeric.isHeapBigInt()) {
        if (isLeft)
            RELEASE_AND_RETURN(scope, JSBigInt::leftShift(globalObject, leftNumeric.asHeapBigInt(), rightNumeric.asHeapBigInt()));
        RELEASE_AND_RETURN(scope, JSBigInt::signedRightShift(globalObject, leftNumeric.asHeapBigInt(), rightNumeric.asHeapBigInt()));
    }
#endif

    auto errorMessage = isLeft ? "Invalid mix of BigInt and other type in left shift operation."_s : "Invalid mix of BigInt and other type in signed right shift operation."_s;
    return throwTypeError(globalObject, scope, errorMessage);
}

ALWAYS_INLINE JSValue jsLShift(JSGlobalObject* globalObject, JSValue v1, JSValue v2)
{
    constexpr bool isLeft = true;
    return shift<isLeft>(globalObject, v1, v2);
}

ALWAYS_INLINE JSValue jsRShift(JSGlobalObject* globalObject, JSValue v1, JSValue v2)
{
    constexpr bool isLeft = false;
    return shift<isLeft>(globalObject, v1, v2);
}

ALWAYS_INLINE JSValue jsURShift(JSGlobalObject* globalObject, JSValue left, JSValue right)
{
    VM& vm = globalObject->vm();
    auto scope = DECLARE_THROW_SCOPE(vm);

    std::optional<uint32_t> leftUint32 = left.toUInt32AfterToNumeric(globalObject);
    RETURN_IF_EXCEPTION(scope, { });
    std::optional<uint32_t> rightUint32 = right.toUInt32AfterToNumeric(globalObject);
    RETURN_IF_EXCEPTION(scope, { });

    if (UNLIKELY(!leftUint32 || !rightUint32)) {
        throwTypeError(globalObject, scope, "BigInt does not support >>> operator"_s);
        return { };
    }

    return jsNumber(static_cast<int32_t>(leftUint32.value() >> (rightUint32.value() & 31)));
}

template<typename Int32Operation, typename BigIntOp>
ALWAYS_INLINE JSValue bitwiseBinaryOp(JSGlobalObject* globalObject, JSValue v1, JSValue v2, Int32Operation&& int32Op, BigIntOp&& bigIntOp, ASCIILiteral errorMessage)
{
    VM& vm = globalObject->vm();
    auto scope = DECLARE_THROW_SCOPE(vm);

    auto leftNumeric = v1.toBigIntOrInt32(globalObject);
    RETURN_IF_EXCEPTION(scope, { });
    auto rightNumeric = v2.toBigIntOrInt32(globalObject);
    RETURN_IF_EXCEPTION(scope, { });

    if (leftNumeric.isInt32() && rightNumeric.isInt32())
        return jsNumber(int32Op(leftNumeric.asInt32(), rightNumeric.asInt32()));

#if USE(BIGINT32)
    if (leftNumeric.isBigInt32()) {
        if (rightNumeric.isBigInt32())
            RELEASE_AND_RETURN(scope, bigIntOp(globalObject, leftNumeric.bigInt32AsInt32(), rightNumeric.bigInt32AsInt32()));
        if (rightNumeric.isHeapBigInt())
            RELEASE_AND_RETURN(scope, bigIntOp(globalObject, leftNumeric.bigInt32AsInt32(), rightNumeric.asHeapBigInt()));
    } else if (leftNumeric.isHeapBigInt()) {
        if (rightNumeric.isBigInt32())
            RELEASE_AND_RETURN(scope, bigIntOp(globalObject, leftNumeric.asHeapBigInt(), rightNumeric.bigInt32AsInt32()));
        else if (rightNumeric.isHeapBigInt())
            RELEASE_AND_RETURN(scope, bigIntOp(globalObject, leftNumeric.asHeapBigInt(), rightNumeric.asHeapBigInt()));
    }
#else
    if (leftNumeric.isHeapBigInt() && rightNumeric.isHeapBigInt())
        RELEASE_AND_RETURN(scope, bigIntOp(globalObject, leftNumeric.asHeapBigInt(), rightNumeric.asHeapBigInt()));
#endif

    return throwTypeError(globalObject, scope, errorMessage);
}

ALWAYS_INLINE JSValue jsBitwiseAnd(JSGlobalObject* globalObject, JSValue v1, JSValue v2)
{
    auto int32Op = [] (int32_t left, int32_t right) -> int32_t {
        return left & right;
    };

    auto bigIntOp = [] (JSGlobalObject* globalObject, auto left, auto right) {
        return JSBigInt::bitwiseAnd(globalObject, left, right);
    };

    // FIXME: currently, for pairs of BigInt32, we unbox them, do the "and" and re-box them.
    // We could do it directly on the JSValue.
    return bitwiseBinaryOp(globalObject, v1, v2, int32Op, bigIntOp, "Invalid mix of BigInt and other type in bitwise 'and' operation."_s);
}

ALWAYS_INLINE JSValue jsBitwiseOr(JSGlobalObject* globalObject, JSValue v1, JSValue v2)
{
    auto int32Op = [] (int32_t left, int32_t right) -> int32_t {
        return left | right;
    };

    // FIXME: currently, for pairs of BigInt32, we unbox them, do the "or" and re-box them.
    // We could do it directly on the JSValue.

    auto bigIntOp = [] (JSGlobalObject* globalObject, auto left, auto right) {
        return JSBigInt::bitwiseOr(globalObject, left, right);
    };

    return bitwiseBinaryOp(globalObject, v1, v2, int32Op, bigIntOp, "Invalid mix of BigInt and other type in bitwise 'or' operation."_s);
}

ALWAYS_INLINE JSValue jsBitwiseXor(JSGlobalObject* globalObject, JSValue v1, JSValue v2)
{
    auto int32Op = [] (int32_t left, int32_t right) -> int32_t {
        return left ^ right;
    };

    // FIXME: currently, for pairs of BigInt32, we unbox them, do the "xor" and re-box them.
    // We could do it directly on the JSValue, and just remember to do an or with 0x12 at the end to restore the tag
    auto bigIntOp = [] (JSGlobalObject* globalObject, auto left, auto right) {
        return JSBigInt::bitwiseXor(globalObject, left, right);
    };

    return bitwiseBinaryOp(globalObject, v1, v2, int32Op, bigIntOp, "Invalid mix of BigInt and other type in bitwise 'xor' operation."_s);
}

ALWAYS_INLINE EncodedJSValue getByValWithIndexAndThis(JSGlobalObject* globalObject, JSCell* base, uint32_t index, JSValue thisValue)
{
    if (base->isObject()) {
        if (JSValue result = asObject(base)->tryGetIndexQuickly(index))
            return JSValue::encode(result);
    } if (isJSString(base)) {
        if (asString(base)->canGetIndex(index))
            return JSValue::encode(asString(base)->getIndex(globalObject, index));
    }

    PropertySlot slot(thisValue, PropertySlot::PropertySlot::InternalMethodType::Get);
    return JSValue::encode(JSValue(base).get(globalObject, index, slot));
}

ALWAYS_INLINE EncodedJSValue getByValWithIndex(JSGlobalObject* globalObject, JSCell* base, uint32_t index)
{
    return getByValWithIndexAndThis(globalObject, base, index, base);
}

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
