/*
 * Copyright (C) 2013-2018 Apple Inc. All rights reserved.
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

#include "JSType.h"
#include <wtf/Float16.h>
#include <wtf/PrintStream.h>

namespace JSC {

struct ClassInfo;

// Keep in sync with the order of JSType.
#define FOR_EACH_TYPED_ARRAY_TYPE_EXCLUDING_DATA_VIEW(macro) \
    macro(Int8) \
    macro(Uint8) \
    macro(Uint8Clamped) \
    macro(Int16) \
    macro(Uint16) \
    macro(Int32) \
    macro(Uint32) \
    macro(Float16) \
    macro(Float32) \
    macro(Float64) \
    macro(BigInt64) \
    macro(BigUint64)

#define FOR_EACH_TYPED_ARRAY_TYPE(macro) \
    FOR_EACH_TYPED_ARRAY_TYPE_EXCLUDING_DATA_VIEW(macro) \
    macro(DataView)

enum TypedArrayType : uint8_t {
    NotTypedArray,
#define DECLARE_TYPED_ARRAY_TYPE(name) Type ## name,
    FOR_EACH_TYPED_ARRAY_TYPE(DECLARE_TYPED_ARRAY_TYPE)
#undef DECLARE_TYPED_ARRAY_TYPE
};

enum class TypedArrayContentType : uint8_t {
    None,
    Number,
    BigInt,
};

#define ASSERT_TYPED_ARRAY_TYPE(name) \
    static_assert(static_cast<uint32_t>(Type ## name) == (static_cast<uint32_t>(name ## ArrayType) - FirstTypedArrayType + static_cast<uint32_t>(TypeInt8)));
    FOR_EACH_TYPED_ARRAY_TYPE_EXCLUDING_DATA_VIEW(ASSERT_TYPED_ARRAY_TYPE)
#undef ASSERT_TYPED_ARRAY_TYPE

static_assert(TypeDataView == (DataViewType - FirstTypedArrayType + TypeInt8));

inline unsigned toIndex(TypedArrayType type)
{
    return static_cast<unsigned>(type) - 1;
}

inline TypedArrayType indexToTypedArrayType(unsigned index)
{
    TypedArrayType result = static_cast<TypedArrayType>(index + 1);
    ASSERT(result >= TypeInt8 && result <= TypeDataView);
    return result;
}

inline constexpr TypedArrayType typedArrayType(JSType type)
{
    switch (type) {
    case Int8ArrayType:
        return TypeInt8;
    case Uint8ArrayType:
        return TypeUint8;
    case Uint8ClampedArrayType:
        return TypeUint8Clamped;
    case Int16ArrayType:
        return TypeInt16;
    case Uint16ArrayType:
        return TypeUint16;
    case Int32ArrayType:
        return TypeInt32;
    case Uint32ArrayType:
        return TypeUint32;
    case Float16ArrayType:
        return TypeFloat16;
    case Float32ArrayType:
        return TypeFloat32;
    case Float64ArrayType:
        return TypeFloat64;
    case BigInt64ArrayType:
        return TypeBigInt64;
    case BigUint64ArrayType:
        return TypeBigUint64;
    case DataViewType:
        return TypeDataView;
    default:
        return NotTypedArray;
    }
}

inline bool isTypedView(JSType type)
{
    return type >= FirstTypedArrayType && type <= LastTypedArrayTypeExcludingDataView;
}

inline bool isTypedView(TypedArrayType type)
{
    switch (type) {
    case NotTypedArray:
    case TypeDataView:
        return false;
    default:
        return true;
    }
}

inline bool isBigIntTypedView(TypedArrayType type)
{
    switch (type) {
    case TypeBigInt64:
    case TypeBigUint64:
        return true;
    default:
        return false;
    }
}

inline constexpr unsigned logElementSize(TypedArrayType type)
{
    switch (type) {
    case NotTypedArray:
        break;
    case TypeInt8:
    case TypeUint8:
    case TypeUint8Clamped:
    case TypeDataView:
        return 0;
    case TypeInt16:
    case TypeUint16:
    case TypeFloat16:
        return 1;
    case TypeInt32:
    case TypeUint32:
    case TypeFloat32:
        return 2;
    case TypeFloat64:
    case TypeBigInt64:
    case TypeBigUint64:
        return 3;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return 0;
}

inline constexpr unsigned logElementSize(JSType type)
{
    return logElementSize(typedArrayType(type));
}

inline size_t elementSize(TypedArrayType type)
{
    return static_cast<size_t>(1) << logElementSize(type);
}

inline size_t elementSize(JSType type)
{
    return elementSize(typedArrayType(type));
}

const ClassInfo* constructorClassInfoForType(TypedArrayType);

inline TypedArrayType typedArrayTypeForType(JSType type)
{
    if (type >= FirstTypedArrayType && type <= LastTypedArrayType)
        return static_cast<TypedArrayType>(type - FirstTypedArrayType + TypeInt8);
    return NotTypedArray;
}

inline JSType typeForTypedArrayType(TypedArrayType type)
{
    if (type >= TypeInt8 && type <= TypeDataView)
        return static_cast<JSType>(type - TypeInt8 + FirstTypedArrayType);

    RELEASE_ASSERT_NOT_REACHED();
    return Int8ArrayType;
}

inline bool isInt(TypedArrayType type)
{
    switch (type) {
    case TypeInt8:
    case TypeUint8:
    case TypeUint8Clamped:
    case TypeInt16:
    case TypeUint16:
    case TypeInt32:
    case TypeUint32:
        return true;
    default:
        return false;
    }
}

inline bool isFloat(TypedArrayType type)
{
    switch (type) {
    case TypeFloat16:
    case TypeFloat32:
    case TypeFloat64:
        return true;
    default:
        return false;
    }
}

inline bool isBigInt(TypedArrayType type)
{
    switch (type) {
    case TypeBigInt64:
    case TypeBigUint64:
        return true;
    default:
        return false;
    }
}

inline bool isSigned(TypedArrayType type)
{
    switch (type) {
    case TypeInt8:
    case TypeInt16:
    case TypeInt32:
    case TypeFloat16:
    case TypeFloat32:
    case TypeFloat64:
    case TypeBigInt64:
        return true;
    default:
        return false;
    }
}

inline bool isClamped(TypedArrayType type)
{
    return type == TypeUint8Clamped;
}

inline constexpr TypedArrayContentType contentType(JSType type)
{
    switch (type) {
    case BigInt64ArrayType:
    case BigUint64ArrayType:
        return TypedArrayContentType::BigInt;
    case Int8ArrayType:
    case Int16ArrayType:
    case Int32ArrayType:
    case Uint8ArrayType:
    case Uint16ArrayType:
    case Uint32ArrayType:
    case Float16ArrayType:
    case Float32ArrayType:
    case Float64ArrayType:
    case Uint8ClampedArrayType:
        return TypedArrayContentType::Number;
    default:
        return TypedArrayContentType::None;
    }
}

inline constexpr TypedArrayContentType contentType(TypedArrayType type)
{
    switch (type) {
    case TypeBigInt64:
    case TypeBigUint64:
        return TypedArrayContentType::BigInt;
    case TypeInt8:
    case TypeInt16:
    case TypeInt32:
    case TypeUint8:
    case TypeUint16:
    case TypeUint32:
    case TypeFloat16:
    case TypeFloat32:
    case TypeFloat64:
    case TypeUint8Clamped:
        return TypedArrayContentType::Number;
    case NotTypedArray:
    case TypeDataView:
        return TypedArrayContentType::None;
    }
    return TypedArrayContentType::None;
}

inline constexpr bool isSomeUint8(TypedArrayType type)
{
    switch (type) {
    case TypeUint8:
    case TypeUint8Clamped:
        return true;
    case TypeInt8:
    case TypeInt16:
    case TypeInt32:
    case TypeUint16:
    case TypeUint32:
    case TypeFloat16:
    case TypeFloat32:
    case TypeFloat64:
    case TypeBigInt64:
    case TypeBigUint64:
    case NotTypedArray:
    case TypeDataView:
        return false;
    }
    return false;
}

JS_EXPORT_PRIVATE extern const uint8_t logElementSizes[NumberOfTypedArrayTypes];

} // namespace JSC

namespace WTF {

void printInternal(PrintStream&, JSC::TypedArrayType);

} // namespace WTF
