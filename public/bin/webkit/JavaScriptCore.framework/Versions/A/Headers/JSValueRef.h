/*
 * Copyright (C) 2006-2024 Apple Inc.  All rights reserved.
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

#ifndef JSValueRef_h
#define JSValueRef_h

#include <JavaScriptCore/JSBase.h>
#include <JavaScriptCore/WebKitAvailability.h>

#ifndef __cplusplus
#include <stdbool.h>
#endif
#include <stddef.h> /* for size_t */
#include <stdint.h> /* for int64_t and uint64_t */

/*!
@enum JSType
@abstract     A constant identifying the type of a JSValue.
@constant     kJSTypeUndefined  The unique undefined value.
@constant     kJSTypeNull       The unique null value.
@constant     kJSTypeBoolean    A primitive boolean value, one of true or false.
@constant     kJSTypeNumber     A primitive number value.
@constant     kJSTypeString     A primitive string value.
@constant     kJSTypeObject     An object value (meaning that this JSValueRef is a JSObjectRef).
@constant     kJSTypeSymbol     A primitive symbol value.
@constant     kJSTypeBigInt     A primitive BigInt value.
*/
typedef enum {
    kJSTypeUndefined,
    kJSTypeNull,
    kJSTypeBoolean,
    kJSTypeNumber,
    kJSTypeString,
    kJSTypeObject,
    kJSTypeSymbol JSC_API_AVAILABLE(macos(10.15), ios(13.0)),
    kJSTypeBigInt JSC_API_AVAILABLE(macos(15.0), ios(18.0))
} JSType;

/*!
 @enum JSTypedArrayType
 @abstract     A constant identifying the Typed Array type of a JSObjectRef.
 @constant     kJSTypedArrayTypeInt8Array            Int8Array
 @constant     kJSTypedArrayTypeInt16Array           Int16Array
 @constant     kJSTypedArrayTypeInt32Array           Int32Array
 @constant     kJSTypedArrayTypeUint8Array           Uint8Array
 @constant     kJSTypedArrayTypeUint8ClampedArray    Uint8ClampedArray
 @constant     kJSTypedArrayTypeUint16Array          Uint16Array
 @constant     kJSTypedArrayTypeUint32Array          Uint32Array
 @constant     kJSTypedArrayTypeFloat32Array         Float32Array
 @constant     kJSTypedArrayTypeFloat64Array         Float64Array
 @constant     kJSTypedArrayTypeBigInt64Array        BigInt64Array
 @constant     kJSTypedArrayTypeBigUint64Array       BigUint64Array
 @constant     kJSTypedArrayTypeArrayBuffer          ArrayBuffer
 @constant     kJSTypedArrayTypeNone                 Not a Typed Array

 */
typedef enum {
    kJSTypedArrayTypeInt8Array,
    kJSTypedArrayTypeInt16Array,
    kJSTypedArrayTypeInt32Array,
    kJSTypedArrayTypeUint8Array,
    kJSTypedArrayTypeUint8ClampedArray,
    kJSTypedArrayTypeUint16Array,
    kJSTypedArrayTypeUint32Array,
    kJSTypedArrayTypeFloat32Array,
    kJSTypedArrayTypeFloat64Array,
    kJSTypedArrayTypeArrayBuffer,
    kJSTypedArrayTypeNone,
    kJSTypedArrayTypeBigInt64Array,
    kJSTypedArrayTypeBigUint64Array,
} JSTypedArrayType JSC_API_AVAILABLE(macos(10.12), ios(10.0));

/*!
@enum JSRelationCondition
@abstract     A constant identifying the type of JavaScript relation condition.
@constant     kJSRelationConditionUndefined    Fail to compare two operands.
@constant     kJSRelationConditionEqual        Two operands have equivalent values.
@constant     kJSRelationConditionGreaterThan  The left operand is greater than the right operand.
@constant     kJSRelationConditionLessThan     The left operand is less than the right operand.
*/
JSC_CF_ENUM(JSRelationCondition,
    kJSRelationConditionUndefined,
    kJSRelationConditionEqual,
    kJSRelationConditionGreaterThan,
    kJSRelationConditionLessThan
) JSC_API_AVAILABLE(macos(15.0), ios(18.0));

#ifdef __cplusplus
extern "C" {
#endif

/*!
@function
@abstract       Returns a JavaScript value's type.
@param ctx  The execution context to use.
@param value    The JSValue whose type you want to obtain.
@result         A value of type JSType that identifies value's type.
*/
JS_EXPORT JSType JSValueGetType(JSC_NULL_UNSPECIFIED JSContextRef ctx, JSC_NULL_UNSPECIFIED JSValueRef value);

/*!
@function
@abstract       Tests whether a JavaScript value's type is the undefined type.
@param ctx  The execution context to use.
@param value    The JSValue to test.
@result         true if value's type is the undefined type, otherwise false.
*/
JS_EXPORT bool JSValueIsUndefined(JSC_NULL_UNSPECIFIED JSContextRef ctx, JSC_NULL_UNSPECIFIED JSValueRef value);

/*!
@function
@abstract       Tests whether a JavaScript value's type is the null type.
@param ctx  The execution context to use.
@param value    The JSValue to test.
@result         true if value's type is the null type, otherwise false.
*/
JS_EXPORT bool JSValueIsNull(JSC_NULL_UNSPECIFIED JSContextRef ctx, JSC_NULL_UNSPECIFIED JSValueRef value);

/*!
@function
@abstract       Tests whether a JavaScript value's type is the boolean type.
@param ctx  The execution context to use.
@param value    The JSValue to test.
@result         true if value's type is the boolean type, otherwise false.
*/
JS_EXPORT bool JSValueIsBoolean(JSC_NULL_UNSPECIFIED JSContextRef ctx, JSC_NULL_UNSPECIFIED JSValueRef value);

/*!
@function
@abstract       Tests whether a JavaScript value's type is the number type.
@param ctx  The execution context to use.
@param value    The JSValue to test.
@result         true if value's type is the number type, otherwise false.
*/
JS_EXPORT bool JSValueIsNumber(JSC_NULL_UNSPECIFIED JSContextRef ctx, JSC_NULL_UNSPECIFIED JSValueRef value);

/*!
@function
@abstract       Tests whether a JavaScript value's type is the string type.
@param ctx  The execution context to use.
@param value    The JSValue to test.
@result         true if value's type is the string type, otherwise false.
*/
JS_EXPORT bool JSValueIsString(JSC_NULL_UNSPECIFIED JSContextRef ctx, JSC_NULL_UNSPECIFIED JSValueRef value);

/*!
@function
@abstract       Tests whether a JavaScript value's type is the symbol type.
@param ctx      The execution context to use.
@param value    The JSValue to test.
@result         true if value's type is the symbol type, otherwise false.
*/
JS_EXPORT bool JSValueIsSymbol(JSC_NULL_UNSPECIFIED JSContextRef ctx, JSC_NULL_UNSPECIFIED JSValueRef value) JSC_API_AVAILABLE(macos(10.15), ios(13.0));

JSC_ASSUME_NONNULL_BEGIN
/*!
@function
@abstract       Tests whether a JavaScript value's type is the BigInt type.
@param ctx      The execution context to use.
@param value    The JSValue to test.
@result         true if value's type is the BigInt type, otherwise false.
*/
JS_EXPORT bool JSValueIsBigInt(JSContextRef ctx, JSValueRef value) JSC_API_AVAILABLE(macos(15.0), ios(18.0));
JSC_ASSUME_NONNULL_END

/*!
@function
@abstract       Tests whether a JavaScript value's type is the object type.
@param ctx  The execution context to use.
@param value    The JSValue to test.
@result         true if value's type is the object type, otherwise false.
*/
JS_EXPORT bool JSValueIsObject(JSC_NULL_UNSPECIFIED JSContextRef ctx, JSC_NULL_UNSPECIFIED JSValueRef value);


/*!
@function
@abstract Tests whether a JavaScript value is an object with a given class in its class chain.
@param ctx The execution context to use.
@param value The JSValue to test.
@param jsClass The JSClass to test against.
@result true if value is an object and has jsClass in its class chain, otherwise false.
*/
JS_EXPORT bool JSValueIsObjectOfClass(JSC_NULL_UNSPECIFIED JSContextRef ctx, JSC_NULL_UNSPECIFIED JSValueRef value, JSC_NULL_UNSPECIFIED JSClassRef jsClass);

/*!
@function
@abstract       Tests whether a JavaScript value is an array.
@param ctx      The execution context to use.
@param value    The JSValue to test.
@result         true if value is an array, otherwise false.
*/
JS_EXPORT bool JSValueIsArray(JSC_NULL_UNSPECIFIED JSContextRef ctx, JSC_NULL_UNSPECIFIED JSValueRef value) JSC_API_AVAILABLE(macos(10.11), ios(9.0));

/*!
@function
@abstract       Tests whether a JavaScript value is a date.
@param ctx      The execution context to use.
@param value    The JSValue to test.
@result         true if value is a date, otherwise false.
*/
JS_EXPORT bool JSValueIsDate(JSC_NULL_UNSPECIFIED JSContextRef ctx, JSC_NULL_UNSPECIFIED JSValueRef value) JSC_API_AVAILABLE(macos(10.11), ios(9.0));

/*!
@function
@abstract           Returns a JavaScript value's Typed Array type.
@param ctx          The execution context to use.
@param value        The JSValue whose Typed Array type to return.
@param exception    A pointer to a JSValueRef in which to store an exception, if any. To reliable detect exception, initialize this to null before the call. Pass NULL if you do not care to store an exception.
@result             A value of type JSTypedArrayType that identifies value's Typed Array type, or kJSTypedArrayTypeNone if the value is not a Typed Array object.
 */
JS_EXPORT JSTypedArrayType JSValueGetTypedArrayType(JSC_NULL_UNSPECIFIED JSContextRef ctx, JSC_NULL_UNSPECIFIED JSValueRef value, JSC_NULL_UNSPECIFIED JSValueRef* JSC_NULL_UNSPECIFIED exception) JSC_API_AVAILABLE(macos(10.12), ios(10.0));

/* Comparing values */

/*!
@function
@abstract Tests whether two JavaScript values are equal, as compared by the JS == operator.
@param ctx The execution context to use.
@param a The first value to test.
@param b The second value to test.
@param exception A pointer to a JSValueRef in which to store an exception, if any. To reliable detect exception, initialize this to null before the call. Pass NULL if you do not care to store an exception.
@result true if the two values are equal, false if they are not equal or an exception is thrown.
*/
JS_EXPORT bool JSValueIsEqual(JSC_NULL_UNSPECIFIED JSContextRef ctx, JSC_NULL_UNSPECIFIED JSValueRef a, JSC_NULL_UNSPECIFIED JSValueRef b, JSC_NULL_UNSPECIFIED JSValueRef* JSC_NULL_UNSPECIFIED exception);

/*!
@function
@abstract       Tests whether two JavaScript values are strict equal, as compared by the JS === operator.
@param ctx  The execution context to use.
@param a        The first value to test.
@param b        The second value to test.
@result         true if the two values are strict equal, otherwise false.
*/
JS_EXPORT bool JSValueIsStrictEqual(JSC_NULL_UNSPECIFIED JSContextRef ctx, JSC_NULL_UNSPECIFIED JSValueRef a, JSC_NULL_UNSPECIFIED JSValueRef b);

/*!
@function
@abstract Tests whether a JavaScript value is an object constructed by a given constructor, as compared by the JS instanceof operator.
@param ctx The execution context to use.
@param value The JSValue to test.
@param constructor The constructor to test against.
@param exception A pointer to a JSValueRef in which to store an exception, if any. To reliable detect exception, initialize this to null before the call. Pass NULL if you do not care to store an exception.
@result true if value is an object constructed by constructor, as compared by the JS instanceof operator, otherwise false.
*/
JS_EXPORT bool JSValueIsInstanceOfConstructor(JSC_NULL_UNSPECIFIED JSContextRef ctx, JSC_NULL_UNSPECIFIED JSValueRef value, JSC_NULL_UNSPECIFIED JSObjectRef constructor, JSC_NULL_UNSPECIFIED JSValueRef* JSC_NULL_UNSPECIFIED exception);

JSC_ASSUME_NONNULL_BEGIN
/*!
    @function
    @abstract         Compares two JSValues.
    @param ctx        The execution context to use.
    @param left       The JSValue as the left operand.
    @param right      The JSValue as the right operand.
    @param exception  A pointer to a JSValueRef in which to store an exception, if any. To reliable detect exception, initialize this to null before the call. Pass NULL if you do not care to store an exception.
    @result           A value of JSRelationCondition, a kJSRelationConditionUndefined is returned if an exception is thrown.
    @discussion       The result is computed by comparing the results of JavaScript's `==`, `<`, and `>` operators. If either `left` or `right` is (or would coerce to) `NaN` in JavaScript, then the result is kJSRelationConditionUndefined.
*/
JS_EXPORT JSRelationCondition JSValueCompare(JSContextRef ctx, JSValueRef left, JSValueRef right, JSC_NULLABLE JSValueRef* JSC_NULLABLE exception) JSC_API_AVAILABLE(macos(15.0), ios(18.0));

/*!
    @function
    @abstract         Compares a JSValue with a signed 64-bit integer.
    @param ctx        The execution context to use.
    @param left       The JSValue as the left operand.
    @param right      The int64_t as the right operand.
    @param exception  A pointer to a JSValueRef in which to store an exception, if any. To reliable detect exception, initialize this to null before the call. Pass NULL if you do not care to store an exception.
    @result           A value of JSRelationCondition, a kJSRelationConditionUndefined is returned if an exception is thrown.
    @discussion       `left` is converted to an integer according to the rules specified by the JavaScript language then compared with `right`.
*/
JS_EXPORT JSRelationCondition JSValueCompareInt64(JSContextRef ctx, JSValueRef left, int64_t right, JSC_NULLABLE JSValueRef* JSC_NULLABLE exception) JSC_API_AVAILABLE(macos(15.0), ios(18.0));

/*!
    @function
    @abstract         Compares a JSValue with an unsigned 64-bit integer.
    @param ctx        The execution context to use.
    @param left       The JSValue as the left operand.
    @param right      The uint64_t as the right operand.
    @param exception  A pointer to a JSValueRef in which to store an exception, if any. To reliable detect exception, initialize this to null before the call. Pass NULL if you do not care to store an exception.
    @result           A value of JSRelationCondition, a kJSRelationConditionUndefined is returned if an exception is thrown.
    @discussion       `left` is converted to an integer according to the rules specified by the JavaScript language then compared with `right`.
*/
JS_EXPORT JSRelationCondition JSValueCompareUInt64(JSContextRef ctx, JSValueRef left, uint64_t right, JSC_NULLABLE JSValueRef* JSC_NULLABLE exception) JSC_API_AVAILABLE(macos(15.0), ios(18.0));

/*!
    @function
    @abstract         Compares a JSValue with a double.
    @param ctx        The execution context to use.
    @param left       The JSValue as the left operand.
    @param right      The double as the right operand.
    @param exception  A pointer to a JSValueRef in which to store an exception, if any. To reliable detect exception, initialize this to null before the call. Pass NULL if you do not care to store an exception.
    @result           A value of JSRelationCondition, a kJSRelationConditionUndefined is returned if an exception is thrown.
    @discussion       `left` is converted to a double according to the rules specified by the JavaScript language then compared with `right`.
*/
JS_EXPORT JSRelationCondition JSValueCompareDouble(JSContextRef ctx, JSValueRef left, double right, JSC_NULLABLE JSValueRef* JSC_NULLABLE exception) JSC_API_AVAILABLE(macos(15.0), ios(18.0));
JSC_ASSUME_NONNULL_END

/* Creating values */

/*!
@function
@abstract       Creates a JavaScript value of the undefined type.
@param ctx  The execution context to use.
@result         The unique undefined value.
*/
JS_EXPORT JSC_NULL_UNSPECIFIED JSValueRef JSValueMakeUndefined(JSC_NULL_UNSPECIFIED JSContextRef ctx);

/*!
@function
@abstract       Creates a JavaScript value of the null type.
@param ctx  The execution context to use.
@result         The unique null value.
*/
JS_EXPORT JSC_NULL_UNSPECIFIED JSValueRef JSValueMakeNull(JSC_NULL_UNSPECIFIED JSContextRef ctx);

/*!
@function
@abstract       Creates a JavaScript value of the boolean type.
@param ctx  The execution context to use.
@param boolean  The bool to assign to the newly created JSValue.
@result         A JSValue of the boolean type, representing the value of boolean.
*/
JS_EXPORT JSC_NULL_UNSPECIFIED JSValueRef JSValueMakeBoolean(JSC_NULL_UNSPECIFIED JSContextRef ctx, bool boolean);

/*!
@function
@abstract       Creates a JavaScript value of the number type.
@param ctx  The execution context to use.
@param number   The double to assign to the newly created JSValue.
@result         A JSValue of the number type, representing the value of number.
*/
JS_EXPORT JSC_NULL_UNSPECIFIED JSValueRef JSValueMakeNumber(JSC_NULL_UNSPECIFIED JSContextRef ctx, double number);

/*!
@function
@abstract       Creates a JavaScript value of the string type.
@param ctx  The execution context to use.
@param string   The JSString to assign to the newly created JSValue. The
 newly created JSValue retains string, and releases it upon garbage collection.
@result         A JSValue of the string type, representing the value of string.
*/
JS_EXPORT JSC_NULL_UNSPECIFIED JSValueRef JSValueMakeString(JSC_NULL_UNSPECIFIED JSContextRef ctx, JSC_NULL_UNSPECIFIED JSStringRef string);

/*!
 @function
 @abstract            Creates a JavaScript value of the symbol type.
 @param ctx           The execution context to use.
 @param description   A description of the newly created symbol value.
 @result              A unique JSValue of the symbol type, whose description matches the one provided.
 */
JS_EXPORT JSC_NULL_UNSPECIFIED JSValueRef JSValueMakeSymbol(JSC_NULL_UNSPECIFIED JSContextRef ctx, JSC_NULL_UNSPECIFIED JSStringRef description) JSC_API_AVAILABLE(macos(10.15), ios(13.0));

JSC_ASSUME_NONNULL_BEGIN
/*!
    @function
    @abstract         Creates a JavaScript BigInt with a double.
    @param ctx        The execution context to use.
    @param value      The value to copy into the new BigInt JSValue.
    @param exception  A pointer to a JSValueRef in which to store an exception, if any. To reliable detect exception, initialize this to null before the call. Pass NULL if you do not care to store an exception.
    @result           A BigInt JSValue of the value, or NULL if an exception is thrown.
    @discussion       If the value is not an integer, an exception is thrown.
*/
JS_EXPORT JSValueRef JSBigIntCreateWithDouble(JSContextRef ctx, double value, JSC_NULLABLE JSValueRef* JSC_NULLABLE exception) JSC_API_AVAILABLE(macos(15.0), ios(18.0));

/*!
    @function
    @abstract         Creates a JavaScript BigInt with a 64-bit signed integer.
    @param ctx        The execution context to use.
    @param integer    The 64-bit signed integer to copy into the new BigInt JSValue.
    @param exception  A pointer to a JSValueRef in which to store an exception, if any. To reliable detect exception, initialize this to null before the call. Pass NULL if you do not care to store an exception.
    @result           A BigInt JSValue of the integer, or NULL if an exception is thrown.
*/
JS_EXPORT JSValueRef JSBigIntCreateWithInt64(JSContextRef ctx, int64_t integer, JSC_NULLABLE JSValueRef* JSC_NULLABLE exception) JSC_API_AVAILABLE(macos(15.0), ios(18.0));

/*!
    @function
    @abstract         Creates a JavaScript BigInt with a 64-bit unsigned integer.
    @param ctx        The execution context to use.
    @param integer    The 64-bit unsigned integer to copy into the new BigInt JSValue.
    @param exception  A pointer to a JSValueRef in which to store an exception, if any. To reliable detect exception, initialize this to null before the call. Pass NULL if you do not care to store an exception.
    @result           A BigInt JSValue of the integer, or NULL if an exception is thrown.
*/
JS_EXPORT JSValueRef JSBigIntCreateWithUInt64(JSContextRef ctx, uint64_t integer, JSC_NULLABLE JSValueRef* JSC_NULLABLE exception) JSC_API_AVAILABLE(macos(15.0), ios(18.0));

/*!
    @function
    @abstract         Creates a JavaScript BigInt with an integer represented in string.
    @param ctx        The execution context to use.
    @param string     The JSStringRef representation of an integer.
    @param exception  A pointer to a JSValueRef in which to store an exception, if any. To reliable detect exception, initialize this to null before the call. Pass NULL if you do not care to store an exception.
    @result           A BigInt JSValue of the string, or NULL if an exception is thrown.
    @discussion       This is equivalent to calling the `BigInt` constructor from JavaScript with a string argument.
*/
JS_EXPORT JSValueRef JSBigIntCreateWithString(JSContextRef ctx, JSStringRef string, JSC_NULLABLE JSValueRef* JSC_NULLABLE exception) JSC_API_AVAILABLE(macos(15.0), ios(18.0));
JSC_ASSUME_NONNULL_END

/* Converting to and from JSON formatted strings */

/*!
 @function
 @abstract       Creates a JavaScript value from a JSON formatted string.
 @param ctx      The execution context to use.
 @param string   The JSString containing the JSON string to be parsed.
 @result         A JSValue containing the parsed value, or NULL if the input is invalid.
 */
JS_EXPORT JSC_NULL_UNSPECIFIED JSValueRef JSValueMakeFromJSONString(JSC_NULL_UNSPECIFIED JSContextRef ctx, JSC_NULL_UNSPECIFIED JSStringRef string) JSC_API_AVAILABLE(macos(10.7), ios(7.0));

/*!
 @function
 @abstract       Creates a JavaScript string containing the JSON serialized representation of a JS value.
 @param ctx      The execution context to use.
 @param value    The value to serialize.
 @param indent   The number of spaces to indent when nesting.  If 0, the resulting JSON will not contains newlines.  The size of the indent is clamped to 10 spaces.
 @param exception A pointer to a JSValueRef in which to store an exception, if any. To reliable detect exception, initialize this to null before the call. Pass NULL if you do not care to store an exception.
 @result         A JSString with the result of serialization, or NULL if an exception is thrown.
 */
JS_EXPORT JSC_NULL_UNSPECIFIED JSStringRef JSValueCreateJSONString(JSC_NULL_UNSPECIFIED JSContextRef ctx, JSC_NULL_UNSPECIFIED JSValueRef value, unsigned indent, JSC_NULL_UNSPECIFIED JSValueRef* JSC_NULL_UNSPECIFIED exception) JSC_API_AVAILABLE(macos(10.7), ios(7.0));

/* Converting to primitive values */

/*!
@function
@abstract       Converts a JavaScript value to boolean and returns the resulting boolean.
@param ctx  The execution context to use.
@param value    The JSValue to convert.
@result         The boolean result of conversion.
*/
JS_EXPORT bool JSValueToBoolean(JSC_NULL_UNSPECIFIED JSContextRef ctx, JSC_NULL_UNSPECIFIED JSValueRef value);

/*!
@function
@abstract       Converts a JavaScript value to number and returns the resulting number.
@param ctx  The execution context to use.
@param value    The JSValue to convert.
@param exception A pointer to a JSValueRef in which to store an exception, if any. To reliable detect exception, initialize this to null before the call. Pass NULL if you do not care to store an exception.
@result         The numeric result of conversion, or NaN if an exception is thrown.
@discussion     The result is equivalent to `Number(value)` in JavaScript.
*/
JS_EXPORT double JSValueToNumber(JSC_NULL_UNSPECIFIED JSContextRef ctx, JSC_NULL_UNSPECIFIED JSValueRef value, JSC_NULL_UNSPECIFIED JSValueRef* JSC_NULL_UNSPECIFIED exception);

JSC_ASSUME_NONNULL_BEGIN
/*!
    @function
    @abstract         Converts a JSValue to a singed 32-bit integer and returns the resulting integer.
    @param ctx        The execution context to use.
    @param value      The JSValue to convert.
    @param exception  A pointer to a JSValueRef in which to store an exception, if any. To reliable detect exception, initialize this to null before the call. Pass NULL if you do not care to store an exception.
    @result           An int32_t with the result of conversion, or 0 if an exception is thrown. Since 0 is valid value, `exception` must be checked after the call.
    @discussion       The JSValue is converted to an integer according to the rules specified by the JavaScript language. If the value is a BigInt, then the JSValue is truncated to an int32_t.
*/
JS_EXPORT int32_t JSValueToInt32(JSContextRef ctx, JSValueRef value, JSC_NULLABLE JSValueRef* JSC_NULLABLE exception) JSC_API_AVAILABLE(macos(15.0), ios(18.0));

/*!
    @function
    @abstract         Converts a JSValue to an unsigned 32-bit integer and returns the resulting integer.
    @param ctx        The execution context to use.
    @param value      The JSValue to convert.
    @param exception  A pointer to a JSValueRef in which to store an exception, if any. To reliable detect exception, initialize this to null before the call. Pass NULL if you do not care to store an exception.
    @result           A uint32_t with the result of conversion, or 0 if an exception is thrown. Since 0 is valid value, `exception` must be checked after the call.
    @discussion       The JSValue is converted to an integer according to the rules specified by the JavaScript language. If the value is a BigInt, then the JSValue is truncated to a uint32_t.
*/
JS_EXPORT uint32_t JSValueToUInt32(JSContextRef ctx, JSValueRef value, JSC_NULLABLE JSValueRef* JSC_NULLABLE exception) JSC_API_AVAILABLE(macos(15.0), ios(18.0));

/*!
    @function
    @abstract         Converts a JSValue to a singed 64-bit integer and returns the resulting integer.
    @param ctx        The execution context to use.
    @param value      The JSValue to convert.
    @param exception  A pointer to a JSValueRef in which to store an exception, if any. To reliable detect exception, initialize this to null before the call. Pass NULL if you do not care to store an exception.
    @result           An int64_t with the result of conversion, or 0 if an exception is thrown. Since 0 is valid value, `exception` must be checked after the call.
    @discussion       The JSValue is converted to an integer according to the rules specified by the JavaScript language. If the value is a BigInt, then the JSValue is truncated to an int64_t.
*/
JS_EXPORT int64_t JSValueToInt64(JSContextRef ctx, JSValueRef value, JSC_NULLABLE JSValueRef* JSC_NULLABLE exception) JSC_API_AVAILABLE(macos(15.0), ios(18.0));

/*!
    @function
    @abstract         Converts a JSValue to an unsigned 64-bit integer and returns the resulting integer.
    @param ctx        The execution context to use.
    @param value      The JSValue to convert.
    @param exception  A pointer to a JSValueRef in which to store an exception, if any. To reliable detect exception, initialize this to null before the call. Pass NULL if you do not care to store an exception.
    @result           A uint64_t with the result of conversion, or 0 if an exception is thrown. Since 0 is valid value, `exception` must be checked after the call.
    @discussion       The JSValue is converted to an integer according to the rules specified by the JavaScript language. If the value is a BigInt, then the JSValue is truncated to a uint64_t.
*/
JS_EXPORT uint64_t JSValueToUInt64(JSContextRef ctx, JSValueRef value, JSC_NULLABLE JSValueRef* JSC_NULLABLE exception) JSC_API_AVAILABLE(macos(15.0), ios(18.0));
JSC_ASSUME_NONNULL_END

/*!
@function
@abstract       Converts a JavaScript value to string and copies the result into a JavaScript string.
@param ctx  The execution context to use.
@param value    The JSValue to convert.
@param exception A pointer to a JSValueRef in which to store an exception, if any. To reliable detect exception, initialize this to null before the call. Pass NULL if you do not care to store an exception.
@result         A JSString with the result of conversion, or NULL if an exception is thrown. Ownership follows the Create Rule.
*/
JS_EXPORT JSC_NULL_UNSPECIFIED JSStringRef JSValueToStringCopy(JSC_NULL_UNSPECIFIED JSContextRef ctx, JSC_NULL_UNSPECIFIED JSValueRef value, JSC_NULL_UNSPECIFIED JSValueRef* JSC_NULL_UNSPECIFIED exception);

/*!
@function
@abstract Converts a JavaScript value to object and returns the resulting object.
@param ctx  The execution context to use.
@param value    The JSValue to convert.
@param exception A pointer to a JSValueRef in which to store an exception, if any. To reliable detect exception, initialize this to null before the call. Pass NULL if you do not care to store an exception.
@result         The JSObject result of conversion, or NULL if an exception is thrown.
*/
JS_EXPORT JSC_NULL_UNSPECIFIED JSObjectRef JSValueToObject(JSC_NULL_UNSPECIFIED JSContextRef ctx, JSC_NULL_UNSPECIFIED JSValueRef value, JSC_NULL_UNSPECIFIED JSValueRef* JSC_NULL_UNSPECIFIED exception);

/* Garbage collection */
/*!
@function
@abstract Protects a JavaScript value from garbage collection.
@param ctx The execution context to use.
@param value The JSValue to protect.
@discussion Use this method when you want to store a JSValue in a global or on the heap, where the garbage collector will not be able to discover your reference to it.
 
A value may be protected multiple times and must be unprotected an equal number of times before becoming eligible for garbage collection.
*/
JS_EXPORT void JSValueProtect(JSC_NULL_UNSPECIFIED JSContextRef ctx, JSC_NULL_UNSPECIFIED JSValueRef value);

/*!
@function
@abstract       Unprotects a JavaScript value from garbage collection.
@param ctx      The execution context to use.
@param value    The JSValue to unprotect.
@discussion     A value may be protected multiple times and must be unprotected an 
 equal number of times before becoming eligible for garbage collection.
*/
JS_EXPORT void JSValueUnprotect(JSC_NULL_UNSPECIFIED JSContextRef ctx, JSC_NULL_UNSPECIFIED JSValueRef value);

#ifdef __cplusplus
}
#endif

#endif /* JSValueRef_h */
