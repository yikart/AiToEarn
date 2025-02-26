/*
 * Copyright (C) 2013-2024 Apple Inc. All rights reserved.
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

#include "JSBigInt.h"
#include "JSCJSValue.h"
#include "MathCommon.h"
#include "TypedArrayAdaptersForwardDeclarations.h"
#include "TypedArrayType.h"
#include <wtf/MathExtras.h>

namespace JSC {

template<
    typename TypeArg, typename ViewTypeArg, typename JSViewTypeArg,
    TypedArrayType typeValueArg>
struct IntegralTypedArrayAdaptor {
    typedef TypeArg Type;
    typedef ViewTypeArg ViewType;
    typedef JSViewTypeArg JSViewType;
    static constexpr TypedArrayType typeValue = typeValueArg;
    static constexpr TypeArg minValue = std::numeric_limits<TypeArg>::lowest();
    static constexpr TypeArg maxValue = std::numeric_limits<TypeArg>::max();
    static constexpr bool canConvertToJSQuickly = true;
    static constexpr TypedArrayContentType contentType = JSC::contentType(typeValue);
    static constexpr bool isInteger = true;
    static constexpr bool isFloat = false;
    static constexpr bool isBigInt = false;

    static JSValue toJSValue(JSGlobalObject*, Type value)
    {
        static_assert(!std::is_floating_point<Type>::value);
        return jsNumber(value);
    }
    
    static Type toNativeFromInt32(int32_t value)
    {
        return static_cast<Type>(value);
    }
    
    static Type toNativeFromUint32(uint32_t value)
    {
        return static_cast<Type>(value);
    }
    
    static Type toNativeFromDouble(double value)
    {
#if HAVE(FJCVTZS_INSTRUCTION)
        return static_cast<Type>(toInt32(value));
#else
        int32_t result = static_cast<int32_t>(value);
        if (static_cast<double>(result) != value)
            result = toInt32(value);
        return static_cast<Type>(result);
#endif
    }

    static constexpr Type toNativeFromUndefined()
    {
        return 0;
    }
    
    template<typename OtherAdaptor>
    static typename OtherAdaptor::Type convertTo(Type value)
    {
        if (typeValue == TypeUint32)
            return OtherAdaptor::toNativeFromUint32(value);
        return OtherAdaptor::toNativeFromInt32(value);
    }

    static std::optional<Type> toNativeFromInt32WithoutCoercion(int32_t value)
    {
        if ((value >= 0 && static_cast<uint32_t>(value) > static_cast<uint32_t>(maxValue)) || value < static_cast<int32_t>(minValue))
            return std::nullopt;
        return static_cast<Type>(value);
    }

    static std::optional<Type> toNativeFromUint32WithoutCoercion(uint32_t value)
    {
        if (value > static_cast<uint32_t>(maxValue))
            return std::nullopt;

        return static_cast<Type>(value);
    }

    static std::optional<Type> toNativeFromDoubleWithoutCoercion(double value)
    {
        Type integer = static_cast<Type>(value);
        if (static_cast<double>(integer) != value)
            return std::nullopt;

        if (value < 0)
            return toNativeFromInt32WithoutCoercion(static_cast<int32_t>(value));
        
        return toNativeFromUint32WithoutCoercion(static_cast<uint32_t>(value));
    }
};

template<
    typename TypeArg, typename ViewTypeArg, typename JSViewTypeArg,
    TypedArrayType typeValueArg>
struct FloatTypedArrayAdaptor {
    typedef TypeArg Type;
    typedef ViewTypeArg ViewType;
    typedef JSViewTypeArg JSViewType;
    static constexpr TypedArrayType typeValue = typeValueArg;
    static constexpr TypeArg minValue = std::numeric_limits<TypeArg>::lowest();
    static constexpr TypeArg maxValue = std::numeric_limits<TypeArg>::max();
    static constexpr bool canConvertToJSQuickly = true;
    static constexpr TypedArrayContentType contentType = JSC::contentType(typeValue);
    static constexpr bool isInteger = false;
    static constexpr bool isFloat = true;
    static constexpr bool isBigInt = false;

    static JSValue toJSValue(JSGlobalObject*, Type value)
    {
        return jsDoubleNumber(purifyNaN(value));
    }

    static Type toNativeFromInt32(int32_t value)
    {
        return static_cast<Type>(value);
    }

    static Type toNativeFromUint32(uint32_t value)
    {
        return static_cast<Type>(value);
    }

    static Type toNativeFromDouble(double value)
    {
        return static_cast<Type>(value);
    }

    static Type toNativeFromUndefined()
    {
        return PNaN;
    }

    template<typename OtherAdaptor>
    static typename OtherAdaptor::Type convertTo(Type value)
    {
        return OtherAdaptor::toNativeFromDouble(value);
    }

    static std::optional<Type> toNativeFromInt32WithoutCoercion(int32_t value)
    {
        return static_cast<Type>(value);
    }

    static std::optional<Type> toNativeFromDoubleWithoutCoercion(double value)
    {
        if (std::isnan(value) || std::isinf(value))
            return static_cast<Type>(value);

        Type valueResult = static_cast<Type>(value);

        if (static_cast<double>(valueResult) != value)
            return std::nullopt;

        if (value < minValue || value > maxValue)
            return std::nullopt;

        return valueResult;
    }
};

template<
    typename TypeArg, typename ViewTypeArg, typename JSViewTypeArg,
    TypedArrayType typeValueArg>
struct BigIntTypedArrayAdaptor {
    typedef TypeArg Type;
    typedef ViewTypeArg ViewType;
    typedef JSViewTypeArg JSViewType;
    static constexpr TypedArrayType typeValue = typeValueArg;
    static constexpr TypeArg minValue = std::numeric_limits<TypeArg>::lowest();
    static constexpr TypeArg maxValue = std::numeric_limits<TypeArg>::max();
    static constexpr bool canConvertToJSQuickly = false;
    static constexpr TypedArrayContentType contentType = JSC::contentType(typeValue);
    static constexpr bool isInteger = true;
    static constexpr bool isFloat = false;
    static constexpr bool isBigInt = true;

    static JSValue toJSValue(JSGlobalObject* globalObject, Type value)
    {
        ASSERT(globalObject);
        return JSBigInt::makeHeapBigIntOrBigInt32(globalObject, value);
    }

    static Type toNativeFromInt32(int32_t value)
    {
        return static_cast<Type>(value);
    }

    static Type toNativeFromUint32(uint32_t value)
    {
        return static_cast<Type>(value);
    }

    static Type toNativeFromDouble(double value)
    {
        return static_cast<Type>(value);
    }

    static Type toNativeFromUndefined()
    {
        // This function is a stub since undefined->BigInt conversion throws an error.
        return 0;
    }

    template<typename OtherAdaptor>
    static typename OtherAdaptor::Type convertTo(Type value)
    {
        if constexpr (OtherAdaptor::isFloat)
            return OtherAdaptor::toNativeFromDouble(static_cast<double>(value));
        else
            return static_cast<typename OtherAdaptor::Type>(value);
    }
};

template<typename Adaptor> class JSGenericTypedArrayView;
using JSInt8Array = JSGenericTypedArrayView<Int8Adaptor>;
using JSInt16Array = JSGenericTypedArrayView<Int16Adaptor>;
using JSInt32Array = JSGenericTypedArrayView<Int32Adaptor>;
using JSUint8Array = JSGenericTypedArrayView<Uint8Adaptor>;
using JSUint8ClampedArray = JSGenericTypedArrayView<Uint8ClampedAdaptor>;
using JSUint16Array = JSGenericTypedArrayView<Uint16Adaptor>;
using JSUint32Array = JSGenericTypedArrayView<Uint32Adaptor>;
using JSFloat16Array = JSGenericTypedArrayView<Float16Adaptor>;
using JSFloat32Array = JSGenericTypedArrayView<Float32Adaptor>;
using JSFloat64Array = JSGenericTypedArrayView<Float64Adaptor>;
using JSBigInt64Array = JSGenericTypedArrayView<BigInt64Adaptor>;
using JSBigUint64Array = JSGenericTypedArrayView<BigUint64Adaptor>;
using JSResizableOrGrowableSharedInt8Array = JSGenericResizableOrGrowableSharedTypedArrayView<Int8Adaptor>;
using JSResizableOrGrowableSharedInt16Array = JSGenericResizableOrGrowableSharedTypedArrayView<Int16Adaptor>;
using JSResizableOrGrowableSharedInt32Array = JSGenericResizableOrGrowableSharedTypedArrayView<Int32Adaptor>;
using JSResizableOrGrowableSharedUint8Array = JSGenericResizableOrGrowableSharedTypedArrayView<Uint8Adaptor>;
using JSResizableOrGrowableSharedUint8ClampedArray = JSGenericResizableOrGrowableSharedTypedArrayView<Uint8ClampedAdaptor>;
using JSResizableOrGrowableSharedUint16Array = JSGenericResizableOrGrowableSharedTypedArrayView<Uint16Adaptor>;
using JSResizableOrGrowableSharedUint32Array = JSGenericResizableOrGrowableSharedTypedArrayView<Uint32Adaptor>;
using JSResizableOrGrowableSharedFloat16Array = JSGenericResizableOrGrowableSharedTypedArrayView<Float16Adaptor>;
using JSResizableOrGrowableSharedFloat32Array = JSGenericResizableOrGrowableSharedTypedArrayView<Float32Adaptor>;
using JSResizableOrGrowableSharedFloat64Array = JSGenericResizableOrGrowableSharedTypedArrayView<Float64Adaptor>;
using JSResizableOrGrowableSharedBigInt64Array = JSGenericResizableOrGrowableSharedTypedArrayView<BigInt64Adaptor>;
using JSResizableOrGrowableSharedBigUint64Array = JSGenericResizableOrGrowableSharedTypedArrayView<BigUint64Adaptor>;

struct Int8Adaptor : IntegralTypedArrayAdaptor<int8_t, Int8Array, JSInt8Array, TypeInt8> { };
struct Int16Adaptor : IntegralTypedArrayAdaptor<int16_t, Int16Array, JSInt16Array, TypeInt16> { };
struct Int32Adaptor : IntegralTypedArrayAdaptor<int32_t, Int32Array, JSInt32Array, TypeInt32> { };
struct Uint8Adaptor : IntegralTypedArrayAdaptor<uint8_t, Uint8Array, JSUint8Array, TypeUint8> { };
struct Uint16Adaptor : IntegralTypedArrayAdaptor<uint16_t, Uint16Array, JSUint16Array, TypeUint16> { };
struct Uint32Adaptor : IntegralTypedArrayAdaptor<uint32_t, Uint32Array, JSUint32Array, TypeUint32> { };
struct Float32Adaptor : FloatTypedArrayAdaptor<float, Float32Array, JSFloat32Array, TypeFloat32> { };
struct Float64Adaptor : FloatTypedArrayAdaptor<double, Float64Array, JSFloat64Array, TypeFloat64> { };
struct BigInt64Adaptor : BigIntTypedArrayAdaptor<int64_t, BigInt64Array, JSBigInt64Array, TypeBigInt64> { };
struct BigUint64Adaptor : BigIntTypedArrayAdaptor<uint64_t, BigUint64Array, JSBigUint64Array, TypeBigUint64> { };

struct Uint8ClampedAdaptor {
    typedef uint8_t Type;
    typedef Uint8ClampedArray ViewType;
    typedef JSUint8ClampedArray JSViewType;
    static constexpr TypedArrayType typeValue = TypeUint8Clamped;
    static constexpr uint8_t minValue = std::numeric_limits<uint8_t>::lowest();
    static constexpr uint8_t maxValue = std::numeric_limits<uint8_t>::max();
    static constexpr bool canConvertToJSQuickly = true;
    static constexpr TypedArrayContentType contentType = JSC::contentType(typeValue);
    static constexpr bool isInteger = true;
    static constexpr bool isFloat = false;
    static constexpr bool isBigInt = false;

    static JSValue toJSValue(JSGlobalObject*, uint8_t value)
    {
        return jsNumber(value);
    }

    static Type toNativeFromInt32(int32_t value)
    {
        return clamp(value);
    }

    static Type toNativeFromUint32(uint32_t value)
    {
        return std::min(static_cast<uint32_t>(255), value);
    }

    static Type toNativeFromDouble(double value)
    {
        if (std::isnan(value) || value < 0)
            return 0;
        if (value > 255)
            return 255;
        return static_cast<uint8_t>(lrint(value));
    }

    static constexpr Type toNativeFromUndefined()
    {
        return 0;
    }

    template<typename OtherAdaptor>
    static typename OtherAdaptor::Type convertTo(uint8_t value)
    {
        return OtherAdaptor::toNativeFromInt32(value);
    }
    
    static std::optional<Type> toNativeFromInt32WithoutCoercion(int32_t value)
    {
        if (value > maxValue || value < minValue)
            return std::nullopt;

        return static_cast<Type>(value);
    }

    static std::optional<Type> toNativeFromDoubleWithoutCoercion(double value)
    {
        uint8_t integer = static_cast<uint8_t>(value);
        if (static_cast<double>(integer) != value)
            return std::nullopt;

        return integer;
    }

private:
    static uint8_t clamp(int32_t value)
    {
        if (value < 0)
            return 0;
        if (value > 255)
            return 255;
        return static_cast<uint8_t>(value);
    }
};

struct Float16Adaptor {
    using Type = Float16;
    using ViewType = Float16Array;
    using JSViewType = JSFloat16Array;
    static constexpr TypedArrayType typeValue = TypeFloat16;
    static constexpr Type minValue = Float16::min();
    static constexpr Type maxValue = Float16::max();
    static constexpr bool canConvertToJSQuickly = true;
    static constexpr TypedArrayContentType contentType = JSC::contentType(typeValue);
    static constexpr bool isInteger = false;
    static constexpr bool isFloat = true;
    static constexpr bool isBigInt = false;

    static JSValue toJSValue(JSGlobalObject*, Type value)
    {
        return jsDoubleNumber(purifyNaN(value));
    }

    static Type toNativeFromInt32(int32_t value)
    {
        return static_cast<double>(value);
    }

    static Type toNativeFromUint32(uint32_t value)
    {
        return static_cast<double>(value);
    }

    static Type toNativeFromDouble(double value)
    {
        return value;
    }

    static Type toNativeFromUndefined()
    {
        return PNaN;
    }

    template<typename OtherAdaptor>
    static typename OtherAdaptor::Type convertTo(Type value)
    {
        return OtherAdaptor::toNativeFromDouble(value);
    }

    static std::optional<Type> toNativeFromInt32WithoutCoercion(int32_t value)
    {
        return static_cast<double>(value);
    }

    static std::optional<Type> toNativeFromDoubleWithoutCoercion(double value)
    {
        if (std::isnan(value) || std::isinf(value))
            return value;

        Type valueResult { value };
        if (static_cast<double>(valueResult) != value)
            return std::nullopt;

        if (value < static_cast<double>(minValue) || value > static_cast<double>(maxValue))
            return std::nullopt;

        return valueResult;
    }
};

} // namespace JSC
