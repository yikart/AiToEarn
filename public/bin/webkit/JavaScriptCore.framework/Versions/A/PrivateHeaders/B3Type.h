/*
 * Copyright (C) 2015-2016 Apple Inc. All rights reserved.
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

#if ENABLE(B3_JIT) || ENABLE(WEBASSEMBLY_BBQJIT)

#include "B3Common.h"
#include "SIMDInfo.h"
#include "Width.h"
#include <wtf/StdLibExtras.h>

#if !ASSERT_ENABLED
IGNORE_RETURN_TYPE_WARNINGS_BEGIN
#endif

namespace JSC { namespace B3 {

static constexpr uint32_t tupleFlag = 1ul << (std::numeric_limits<uint32_t>::digits - 1);
static constexpr uint32_t tupleIndexMask = tupleFlag - 1;

enum TypeKind : uint32_t {
    Void,
    Int32,
    Int64,
    Float,
    Double,
    V128,

    // Tuples are represented as the tupleFlag | with the tuple's index into Procedure's m_tuples table.
    Tuple = tupleFlag,
};

class Type {
public:
    constexpr Type() = default;
    constexpr Type(const Type&) = default;
    constexpr Type(TypeKind kind)
        : m_kind(kind)
    {
        ASSERT(kind != Tuple);
    }

    ~Type() = default;

    static const unsigned numberOfPrimitiveTypes = V128 + 1;
    static Type tupleFromIndex(unsigned index) { ASSERT(!(index & tupleFlag)); return std::bit_cast<Type>(index | tupleFlag); }

    TypeKind kind() const { return m_kind & tupleFlag ? Tuple : m_kind; }
    uint32_t tupleIndex() const { ASSERT(m_kind & tupleFlag); return m_kind & tupleIndexMask; }
    uint32_t hash() const { return m_kind; }

    inline bool isInt() const;
    inline bool isFloat() const;
    inline bool isNumeric() const;
    inline bool isTuple() const;
    inline bool isVector() const;

    friend bool operator==(const Type&, const Type&) = default;

private:
    TypeKind m_kind { Void };
};

inline constexpr TypeKind simdB3ScalarTypeKind(SIMDLane lane)
{
    switch (lane) {
    case SIMDLane::i8x16:
    case SIMDLane::i16x8:
    case SIMDLane::i32x4:
        return Int32;
    case SIMDLane::i64x2:
        return Int64;
    case SIMDLane::f32x4:
        return Float;
    case SIMDLane::f64x2:
        return Double;
    case SIMDLane::v128:
        RELEASE_ASSERT_NOT_REACHED();
        return Int64;
    }
}

inline Type simdB3ScalarType(SIMDLane lane)
{
    return { simdB3ScalarTypeKind(lane) };
}

static_assert(sizeof(TypeKind) == sizeof(Type));

inline bool Type::isInt() const
{
    return kind() == Int32 || kind() == Int64;
}

inline bool Type::isFloat() const
{
    return kind() == Float || kind() == Double;
}

inline bool Type::isNumeric() const
{
    return isInt() || isFloat() || isVector();
}

inline bool Type::isTuple() const
{
    return kind() == Tuple;
}

inline bool Type::isVector() const
{
    return kind() == V128;
}

constexpr Type pointerType()
{
    if (is32Bit())
        return Int32;
    return Int64;
}

constexpr Type registerType()
{
    if (isRegister64Bit())
        return Int64;
    return Int32;
}

inline size_t sizeofType(Type type)
{
    switch (type.kind()) {
    case Void:
    case Tuple:
        return 0;
    case Int32:
    case Float:
        return 4;
    case Int64:
    case Double:
        return 8;
    case V128:
        return 16;
    }
    ASSERT_NOT_REACHED();
}

} } // namespace JSC::B3

namespace WTF {

class PrintStream;

void printInternal(PrintStream&, JSC::B3::Type);

} // namespace WTF

#if !ASSERT_ENABLED
IGNORE_RETURN_TYPE_WARNINGS_END
#endif

#endif // ENABLE(B3_JIT)
