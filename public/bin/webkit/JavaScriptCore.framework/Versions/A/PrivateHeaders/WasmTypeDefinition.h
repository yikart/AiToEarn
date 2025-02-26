/*
 * Copyright (C) 2016-2024 Apple Inc. All rights reserved.
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

#include <variant>

#if ENABLE(WEBASSEMBLY)

#include "JITCompilation.h"
#include "SIMDInfo.h"
#include "WasmLLIntBuiltin.h"
#include "WasmOps.h"
#include "WasmSIMDOpcodes.h"
#include "Width.h"
#include "WriteBarrier.h"
#include <wtf/CheckedArithmetic.h>
#include <wtf/FixedVector.h>
#include <wtf/HashMap.h>
#include <wtf/HashSet.h>
#include <wtf/HashTraits.h>
#include <wtf/Lock.h>
#include <wtf/StdLibExtras.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/ThreadSafeRefCounted.h>
#include <wtf/Vector.h>

#if ENABLE(WEBASSEMBLY_OMGJIT) || ENABLE(WEBASSEMBLY_BBQJIT)
#include "B3Type.h"
#endif

#if HAVE(36BIT_ADDRESS)
#define RTT_ALIGNMENT alignas(16)
#else
#define RTT_ALIGNMENT
#endif

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

namespace Wasm {

class JSToWasmICCallee;

#define CREATE_ENUM_VALUE(name, id, ...) name = id,
enum class ExtSIMDOpType : uint32_t {
    FOR_EACH_WASM_EXT_SIMD_OP(CREATE_ENUM_VALUE)
};
#undef CREATE_ENUM_VALUE

#define CREATE_CASE(name, ...) case ExtSIMDOpType::name: return #name ## _s;
inline ASCIILiteral makeString(ExtSIMDOpType op)
{
    switch (op) {
        FOR_EACH_WASM_EXT_SIMD_OP(CREATE_CASE)
    }
    RELEASE_ASSERT_NOT_REACHED();
    return { };
}
#undef CREATE_CASE

constexpr std::pair<size_t, size_t> countNumberOfWasmExtendedSIMDOpcodes()
{
    uint8_t numberOfOpcodes = 0;
    uint8_t mapSize = 0;
#define COUNT_EXT_SIMD_OPERATION(name, id, ...) \
    numberOfOpcodes++; \
    mapSize = std::max<size_t>(mapSize, (size_t)id);
    FOR_EACH_WASM_EXT_SIMD_OP(COUNT_EXT_SIMD_OPERATION)
#undef COUNT_EXT_SIMD_OPERATION
    return { numberOfOpcodes, mapSize + 1 };
}

constexpr bool isRegisteredWasmExtendedSIMDOpcode(ExtSIMDOpType op)
{
    switch (op) {
#define CREATE_CASE(name, id, ...) case ExtSIMDOpType::name:
    FOR_EACH_WASM_EXT_SIMD_OP(CREATE_CASE)
#undef CREATE_CASE
        return true;
    default:
        return false;
    }
}

constexpr void dumpExtSIMDOpType(PrintStream& out, ExtSIMDOpType op)
{
    switch (op) {
#define CREATE_CASE(name, id, ...) case ExtSIMDOpType::name: out.print(#name); break;
    FOR_EACH_WASM_EXT_SIMD_OP(CREATE_CASE)
#undef CREATE_CASE
    default:
        return;
    }
}

MAKE_PRINT_ADAPTOR(ExtSIMDOpTypeDump, ExtSIMDOpType, dumpExtSIMDOpType);

constexpr std::pair<size_t, size_t> countNumberOfWasmExtendedAtomicOpcodes()
{
    uint8_t numberOfOpcodes = 0;
    uint8_t mapSize = 0;
#define COUNT_WASM_EXT_ATOMIC_OP(name, id, ...) \
    numberOfOpcodes++;                      \
    mapSize = std::max<size_t>(mapSize, (size_t)id);
    FOR_EACH_WASM_EXT_ATOMIC_LOAD_OP(COUNT_WASM_EXT_ATOMIC_OP);
    FOR_EACH_WASM_EXT_ATOMIC_STORE_OP(COUNT_WASM_EXT_ATOMIC_OP);
    FOR_EACH_WASM_EXT_ATOMIC_BINARY_RMW_OP(COUNT_WASM_EXT_ATOMIC_OP);
    FOR_EACH_WASM_EXT_ATOMIC_OTHER_OP(COUNT_WASM_EXT_ATOMIC_OP);
#undef COUNT_WASM_EXT_ATOMIC_OP
    return { numberOfOpcodes, mapSize + 1 };
}

constexpr bool isRegisteredExtenedAtomicOpcode(ExtAtomicOpType op)
{
    switch (op) {
#define CREATE_CASE(name, id, ...) case ExtAtomicOpType::name:
    FOR_EACH_WASM_EXT_ATOMIC_LOAD_OP(CREATE_CASE)
    FOR_EACH_WASM_EXT_ATOMIC_STORE_OP(CREATE_CASE)
    FOR_EACH_WASM_EXT_ATOMIC_BINARY_RMW_OP(CREATE_CASE)
    FOR_EACH_WASM_EXT_ATOMIC_OTHER_OP(CREATE_CASE)
#undef CREATE_CASE
        return true;
    default:
        return false;
    }
}

constexpr void dumpExtAtomicOpType(PrintStream& out, ExtAtomicOpType op)
{
    switch (op) {
#define CREATE_CASE(name, id, ...) case ExtAtomicOpType::name: out.print(#name); break;
    FOR_EACH_WASM_EXT_ATOMIC_LOAD_OP(CREATE_CASE)
    FOR_EACH_WASM_EXT_ATOMIC_STORE_OP(CREATE_CASE)
    FOR_EACH_WASM_EXT_ATOMIC_BINARY_RMW_OP(CREATE_CASE)
    FOR_EACH_WASM_EXT_ATOMIC_OTHER_OP(CREATE_CASE)
#undef CREATE_CASE
    default:
        return;
    }
}

MAKE_PRINT_ADAPTOR(ExtAtomicOpTypeDump, ExtAtomicOpType, dumpExtAtomicOpType);

constexpr std::pair<size_t, size_t> countNumberOfWasmGCOpcodes()
{
    uint8_t numberOfOpcodes = 0;
    uint8_t mapSize = 0;
#define COUNT_WASM_GC_OP(name, id, ...) \
    numberOfOpcodes++;                  \
    mapSize = std::max<size_t>(mapSize, (size_t)id);
    FOR_EACH_WASM_GC_OP(COUNT_WASM_GC_OP);
#undef COUNT_WASM_GC_OP
    return { numberOfOpcodes, mapSize + 1 };
}

constexpr bool isRegisteredGCOpcode(ExtGCOpType op)
{
    switch (op) {
#define CREATE_CASE(name, id, ...) case ExtGCOpType::name:
    FOR_EACH_WASM_GC_OP(CREATE_CASE)
#undef CREATE_CASE
        return true;
    default:
        return false;
    }
}

constexpr void dumpExtGCOpType(PrintStream& out, ExtGCOpType op)
{
    switch (op) {
#define CREATE_CASE(name, id, ...) case ExtGCOpType::name: out.print(#name); break;
    FOR_EACH_WASM_GC_OP(CREATE_CASE)
#undef CREATE_CASE
    default:
        return;
    }
}

MAKE_PRINT_ADAPTOR(ExtGCOpTypeDump, ExtGCOpType, dumpExtGCOpType);

constexpr std::pair<size_t, size_t> countNumberOfWasmBaseOpcodes()
{
    uint8_t numberOfOpcodes = 0;
    uint8_t mapSize = 0;
#define COUNT_WASM_OP(name, id, ...) \
    numberOfOpcodes++;               \
    mapSize = std::max<size_t>(mapSize, (size_t)id);
    FOR_EACH_WASM_OP(COUNT_WASM_OP);
#undef COUNT_WASM_OP
    return { numberOfOpcodes, mapSize + 1 };
}

constexpr bool isRegisteredBaseOpcode(OpType op)
{
    switch (op) {
#define CREATE_CASE(name, id, ...) case OpType::name:
    FOR_EACH_WASM_OP(CREATE_CASE)
#undef CREATE_CASE
        return true;
    default:
        return false;
    }
}

constexpr void dumpOpType(PrintStream& out, OpType op)
{
    switch (op) {
#define CREATE_CASE(name, id, ...) case OpType::name: out.print(#name); break;
    FOR_EACH_WASM_OP(CREATE_CASE)
#undef CREATE_CASE
    default:
        return;
    }
}

MAKE_PRINT_ADAPTOR(OpTypeDump, OpType, dumpOpType);

constexpr Type simdScalarType(SIMDLane lane)
{
    switch (lane) {
    case SIMDLane::v128:
        RELEASE_ASSERT_NOT_REACHED();
        return Types::Void;
    case SIMDLane::i64x2:
        return Types::I64;
    case SIMDLane::f64x2:
        return Types::F64;
    case SIMDLane::i8x16:
    case SIMDLane::i16x8:
    case SIMDLane::i32x4:
        return Types::I32;
    case SIMDLane::f32x4:
        return Types::F32;
    }
    RELEASE_ASSERT_NOT_REACHED();
}

using FunctionArgCount = uint32_t;
using StructFieldCount = uint32_t;
using RecursionGroupCount = uint32_t;
using ProjectionIndex = uint32_t;
using DisplayCount = uint32_t;
using SupertypeCount = uint32_t;

inline Width Type::width() const
{
    switch (kind) {
#define CREATE_CASE(name, id, b3type, inc, wasmName, width, ...) case TypeKind::name: return widthForBytes(width / 8);
    FOR_EACH_WASM_TYPE(CREATE_CASE)
#undef CREATE_CASE
    }
    RELEASE_ASSERT_NOT_REACHED();
}

#if ENABLE(WEBASSEMBLY_OMGJIT) || ENABLE(WEBASSEMBLY_BBQJIT)
#define CREATE_CASE(name, id, b3type, ...) case TypeKind::name: return b3type;
inline B3::Type toB3Type(Type type)
{
    switch (type.kind) {
    FOR_EACH_WASM_TYPE(CREATE_CASE)
    }
    RELEASE_ASSERT_NOT_REACHED();
    return B3::Void;
}
#undef CREATE_CASE
#endif

constexpr size_t typeKindSizeInBytes(TypeKind kind)
{
    switch (kind) {
    case TypeKind::I32:
    case TypeKind::F32: {
        return 4;
    }
    case TypeKind::I64:
    case TypeKind::F64: {
        return 8;
    }
    case TypeKind::V128:
        return 16;

    case TypeKind::Arrayref:
    case TypeKind::Structref:
    case TypeKind::Funcref:
    case TypeKind::Exn:
    case TypeKind::Externref:
    case TypeKind::Ref:
    case TypeKind::RefNull: {
        return sizeof(WriteBarrierBase<Unknown>);
    }
    case TypeKind::Array:
    case TypeKind::Func:
    case TypeKind::Struct:
    case TypeKind::Void:
    case TypeKind::Sub:
    case TypeKind::Subfinal:
    case TypeKind::Rec:
    case TypeKind::Eqref:
    case TypeKind::Anyref:
    case TypeKind::Nullref:
    case TypeKind::Nullfuncref:
    case TypeKind::Nullexternref:
    case TypeKind::I31ref: {
        break;
    }
    }

    ASSERT_NOT_REACHED();
    return 0;
}

class FunctionSignature {
public:
    FunctionSignature(Type* payload, FunctionArgCount argumentCount, FunctionArgCount returnCount);
    ~FunctionSignature();

    FunctionArgCount argumentCount() const { return m_argCount; }
    FunctionArgCount returnCount() const { return m_retCount; }
    bool hasRecursiveReference() const { return m_hasRecursiveReference; }
    void setHasRecursiveReference(bool value) { m_hasRecursiveReference = value; }
    Type returnType(FunctionArgCount i) const { ASSERT(i < returnCount()); return const_cast<FunctionSignature*>(this)->getReturnType(i); }
    bool returnsVoid() const { return !returnCount(); }
    Type argumentType(FunctionArgCount i) const { return const_cast<FunctionSignature*>(this)->getArgumentType(i); }
    bool argumentsOrResultsIncludeV128() const { return m_argumentsOrResultsIncludeV128; }
    void setArgumentsOrResultsIncludeV128(bool value) { m_argumentsOrResultsIncludeV128 = value; }

    size_t numVectors() const
    {
        size_t n = 0;
        for (size_t i = 0; i < argumentCount(); ++i) {
            if (argumentType(i).isV128())
                ++n;
        }
        return n;
    }

    size_t numReturnVectors() const
    {
        size_t n = 0;
        for (size_t i = 0; i < returnCount(); ++i) {
            if (returnType(i).isV128())
                ++n;
        }
        return n;
    }

    bool hasReturnVector() const
    {
        for (size_t i = 0; i < returnCount(); ++i) {
            if (returnType(i).isV128())
                return true;
        }
        return false;
    }

    bool operator==(const FunctionSignature& other) const
    {
        // Function signatures are unique because it is just an view class over TypeDefinition and
        // so, we can compare two signatures with just payload pointers comparision.
        // Other checks probably aren't necessary but it's good to be paranoid.
        return m_payload == other.m_payload && m_argCount == other.m_argCount && m_retCount == other.m_retCount;
    }

    WTF::String toString() const;
    void dump(WTF::PrintStream& out) const;

    Type& getReturnType(FunctionArgCount i) { ASSERT(i < returnCount()); return *storage(i); }
    Type& getArgumentType(FunctionArgCount i) { ASSERT(i < argumentCount()); return *storage(returnCount() + i); }

    Type* storage(FunctionArgCount i) { return i + m_payload; }
    const Type* storage(FunctionArgCount i) const { return const_cast<FunctionSignature*>(this)->storage(i); }

#if ENABLE(JIT)
    // This is const because we generally think of FunctionSignatures as immutable.
    // Conceptually this more like using the `const FunctionSignature*` as a global UncheckedKeyHashMap
    // key to the JIT code though.
    CodePtr<JSEntryPtrTag> jsToWasmICEntrypoint() const;
#endif

private:
    friend class TypeInformation;

    Type* m_payload;
    FunctionArgCount m_argCount;
    FunctionArgCount m_retCount;
#if ENABLE(JIT)
    mutable RefPtr<JSToWasmICCallee> m_jsToWasmICCallee;
    // FIXME: We should have a WTF::Once that uses ParkingLot and the low bits of a pointer as a lock and use that here.
    mutable Lock m_jitCodeLock;
    // FIXME: Support caching wasmToJSEntrypoints too.
#endif
    bool m_hasRecursiveReference { false };
    bool m_argumentsOrResultsIncludeV128 { false };
};

// FIXME auto-generate this. https://bugs.webkit.org/show_bug.cgi?id=165231
enum Mutability : uint8_t {
    Mutable = 1,
    Immutable = 0
};

struct StorageType {
public:
    template <typename T>
    bool is() const { return std::holds_alternative<T>(m_storageType); }

    template <typename T>
    const T as() const { ASSERT(is<T>()); return *std::get_if<T>(&m_storageType); }

    StorageType() = default;

    explicit StorageType(Type t)
    {
        m_storageType = std::variant<Type, PackedType>(t);
    }

    explicit StorageType(PackedType t)
    {
        m_storageType = std::variant<Type, PackedType>(t);
    }

    // Return a value type suitable for validating instruction arguments. Packed types cannot show up as value types and need to be unpacked to I32.
    Type unpacked() const
    {
        if (is<Type>())
            return as<Type>();
        return Types::I32;
    }

    size_t elementSize() const
    {
        if (is<Type>()) {
            switch (as<Type>().kind) {
            case Wasm::TypeKind::I32:
            case Wasm::TypeKind::F32:
                return sizeof(uint32_t);
            case Wasm::TypeKind::I64:
            case Wasm::TypeKind::F64:
            case Wasm::TypeKind::Ref:
            case Wasm::TypeKind::RefNull:
                return sizeof(uint64_t);
            case Wasm::TypeKind::V128:
                return sizeof(v128_t);
            default:
                RELEASE_ASSERT_NOT_REACHED();
            }
        }
        switch (as<PackedType>()) {
        case PackedType::I8:
            return sizeof(uint8_t);
        case PackedType::I16:
            return sizeof(uint16_t);
        }
        RELEASE_ASSERT_NOT_REACHED();
    }

    bool operator==(const StorageType& rhs) const
    {
        if (rhs.is<PackedType>())
            return (is<PackedType>() && as<PackedType>() == rhs.as<PackedType>());
        if (!is<Type>())
            return false;
        return(as<Type>() == rhs.as<Type>());
    }

    int8_t typeCode() const
    {
        if (is<Type>())
            return static_cast<int8_t>(as<Type>().kind);
        return static_cast<int8_t>(as<PackedType>());
    }

    TypeIndex index() const
    {
        if (is<Type>())
            return as<Type>().index;
        return 0;
    }
    void dump(WTF::PrintStream& out) const;

private:
    std::variant<Type, PackedType> m_storageType;

};

inline ASCIILiteral makeString(const StorageType& storageType)
{
    return(storageType.is<Type>() ? makeString(storageType.as<Type>().kind) :
        makeString(storageType.as<PackedType>()));
}

inline size_t typeSizeInBytes(const StorageType& storageType)
{
    if (storageType.is<PackedType>()) {
        switch (storageType.as<PackedType>()) {
        case PackedType::I8: {
            return 1;
        }
        case PackedType::I16: {
            return 2;
        }
        }
    }
    return typeKindSizeInBytes(storageType.as<Type>().kind);
}

inline size_t typeAlignmentInBytes(const StorageType& storageType)
{
    return typeSizeInBytes(storageType);
}

class FieldType {
public:
    StorageType type;
    Mutability mutability;

    friend bool operator==(const FieldType&, const FieldType&) = default;
};

class StructType {
public:
    StructType(FieldType*, StructFieldCount, const FieldType*);

    StructFieldCount fieldCount() const { return m_fieldCount; }
    bool hasRecursiveReference() const { return m_hasRecursiveReference; }
    void setHasRecursiveReference(bool value) { m_hasRecursiveReference = value; }
    FieldType field(StructFieldCount i) const { return const_cast<StructType*>(this)->getField(i); }

    WTF::String toString() const;
    void dump(WTF::PrintStream& out) const;

    FieldType& getField(StructFieldCount i) { ASSERT(i < fieldCount()); return *storage(i); }
    FieldType* storage(StructFieldCount i) { return i + m_payload; }
    const FieldType* storage(StructFieldCount i) const { return const_cast<StructType*>(this)->storage(i); }

    // Returns the offset relative to `m_payload` (the internal vector of fields)
    const unsigned* offsetOfField(StructFieldCount i) const { ASSERT(i < fieldCount()); return std::bit_cast<const unsigned*>(m_payload + m_fieldCount) + i; }
    unsigned* offsetOfField(StructFieldCount i) { return const_cast<unsigned*>(const_cast<const StructType*>(this)->offsetOfField(i)); }

    // Returns the offset relative to `m_payload.storage` (the internal storage for the internal vector of fields)
    unsigned offsetOfFieldInternal(StructFieldCount i) const { ASSERT(i < fieldCount()); return(*offsetOfField(i) - FixedVector<uint8_t>::Storage::offsetOfData()); }
    size_t instancePayloadSize() const { return m_instancePayloadSize; }

private:
    // Payload is structured this way = | field types | precalculated field offsets |.
    FieldType* m_payload;
    StructFieldCount m_fieldCount;
    bool m_hasRecursiveReference;
    size_t m_instancePayloadSize;
};

class ArrayType {
public:
    ArrayType(FieldType* payload)
        : m_payload(payload)
        , m_hasRecursiveReference(false)
    {
    }

    FieldType elementType() const { return const_cast<ArrayType*>(this)->getElementType(); }
    bool hasRecursiveReference() const { return m_hasRecursiveReference; }
    void setHasRecursiveReference(bool value) { m_hasRecursiveReference = value; }

    WTF::String toString() const;
    void dump(WTF::PrintStream& out) const;

    FieldType& getElementType() { return *storage(); }
    FieldType* storage() { return m_payload; }
    const FieldType* storage() const { return const_cast<ArrayType*>(this)->storage(); }

private:
    FieldType* m_payload;
    bool m_hasRecursiveReference;
};

class RecursionGroup {
public:
    RecursionGroup(TypeIndex* payload, RecursionGroupCount typeCount)
        : m_payload(payload)
        , m_typeCount(typeCount)
    {
    }

    bool cleanup();

    RecursionGroupCount typeCount() const { return m_typeCount; }
    TypeIndex type(RecursionGroupCount i) const { return const_cast<RecursionGroup*>(this)->getType(i); }

    WTF::String toString() const;
    void dump(WTF::PrintStream& out) const;

    TypeIndex& getType(RecursionGroupCount i) { ASSERT(i < typeCount()); return *storage(i); }
    TypeIndex* storage(RecursionGroupCount i) { return i + m_payload; }
    const TypeIndex* storage(RecursionGroupCount i) const { return const_cast<RecursionGroup*>(this)->storage(i); }

private:
    TypeIndex* m_payload;
    RecursionGroupCount m_typeCount;
};

// This class represents a projection into a recursion group. That is, if a recursion
// group is defined as $r = (rec (type $s ...) (type $t ...)), then a projection accesses
// the inner types. For example $r.$s or $r.$t, or $r.0 or $r.1 with numeric indices.
//
// See https://github.com/WebAssembly/gc/blob/main/proposals/gc/MVP.md#type-contexts
//
// We store projections rather than the implied unfolding because the actual type being
// represented may be recursive and infinite. Projections are unfolded into a concrete type
// when operations on the type require a specific concrete type.
//
// A projection with an invalid PlaceholderGroup index represents a recursive reference
// that has not yet been resolved. The expand() function on type definitions resolves it.
class Projection {
public:
    Projection(TypeIndex* payload)
        : m_payload(payload)
    {
    }

    bool cleanup();

    TypeIndex recursionGroup() const { return const_cast<Projection*>(this)->getRecursionGroup(); }
    ProjectionIndex index() const { return const_cast<Projection*>(this)->getIndex(); }

    WTF::String toString() const;
    void dump(WTF::PrintStream& out) const;

    TypeIndex& getRecursionGroup() { return *storage(0); }
    ProjectionIndex& getIndex() { return *reinterpret_cast<ProjectionIndex*>(storage(1)); }
    TypeIndex* storage(uint32_t i) { ASSERT(i <= 1); return i + m_payload; }
    const TypeIndex* storage(uint32_t i) const { return const_cast<Projection*>(this)->storage(i); }

    static constexpr TypeIndex PlaceholderGroup = 0;
    bool isPlaceholder() const { return recursionGroup() == PlaceholderGroup; }

private:
    TypeIndex* m_payload;
};
static_assert(sizeof(ProjectionIndex) <= sizeof(TypeIndex));

// A Subtype represents a type that is declared to be a subtype of another type
// definition.
//
// The representation allows multiple supertypes for simplicity, as it needs to
// support 0 or 1 supertypes. More than 1 supertype is not supported in the initial
// GC proposal.
class Subtype {
public:
    Subtype(TypeIndex* payload, SupertypeCount count, bool isFinal)
        : m_payload(payload)
        , m_supertypeCount(count)
        , m_final(isFinal)
    {
    }

    bool cleanup();

    SupertypeCount supertypeCount() const { return m_supertypeCount; }
    bool isFinal() const { return m_final; }
    TypeIndex firstSuperType() const { return superType(0); }
    TypeIndex superType(SupertypeCount i) const { return const_cast<Subtype*>(this)->getSuperType(i); }
    TypeIndex underlyingType() const { return const_cast<Subtype*>(this)->getUnderlyingType(); }

    WTF::String toString() const;
    void dump(WTF::PrintStream& out) const;

    TypeIndex& getSuperType(SupertypeCount i) { return *storage(1 + i); }
    TypeIndex& getUnderlyingType() { return *storage(0); }
    TypeIndex* storage(uint32_t i) { return i + m_payload; }
    TypeIndex* storage(uint32_t i) const { return const_cast<Subtype*>(this)->storage(i); }

private:
    TypeIndex* m_payload;
    SupertypeCount m_supertypeCount;
    bool m_final;
};

// An RTT encodes subtyping information in a way that is suitable for executing
// runtime subtyping checks, e.g., for ref.cast and related operations. RTTs are also
// used to facilitate static subtyping checks for references.
//
// It contains a display data structure that allows subtyping of references to be checked in constant time.
//
// See https://github.com/WebAssembly/gc/blob/main/proposals/gc/MVP.md#runtime-types for an explanation of displays.
enum class RTTKind : uint8_t {
    Function,
    Array,
    Struct
};

class RTT_ALIGNMENT RTT : public ThreadSafeRefCounted<RTT> {
    WTF_MAKE_FAST_COMPACT_ALLOCATED;

public:
    RTT() = delete;
    RTT(const RTT&) = delete;

    explicit RTT(RTTKind kind, DisplayCount displaySize)
        : m_kind(kind)
        , m_displaySize(displaySize)
    {
    }

    static RefPtr<RTT> tryCreateRTT(RTTKind, DisplayCount);

    DisplayCount displaySize() const { return m_displaySize; }
    const RTT* displayEntry(DisplayCount i) const { ASSERT(i < displaySize()); return const_cast<RTT*>(this)->payload()[i]; }
    void setDisplayEntry(DisplayCount i, RefPtr<const RTT> entry) { ASSERT(i < displaySize()); payload()[i] = entry.get(); }

    bool isSubRTT(const RTT& other) const;
    static size_t allocatedRTTSize(Checked<DisplayCount> count) { return sizeof(RTT) + count * sizeof(TypeIndex); }

    static constexpr ptrdiff_t offsetOfKind() { return OBJECT_OFFSETOF(RTT, m_kind); }
    static constexpr ptrdiff_t offsetOfDisplaySize() { return OBJECT_OFFSETOF(RTT, m_displaySize); }
    static constexpr ptrdiff_t offsetOfPayload() { return sizeof(RTT); }

private:
    // Payload starts past end of this object.
    const RTT** payload() { return static_cast<const RTT**>(static_cast<void*>(this + 1)); }

    RTTKind m_kind;
    DisplayCount m_displaySize;
};

enum class TypeDefinitionKind : uint8_t {
    FunctionSignature,
    StructType,
    ArrayType,
    RecursionGroup,
    Projection,
    Subtype
};

class TypeDefinition : public ThreadSafeRefCounted<TypeDefinition> {
    WTF_MAKE_TZONE_ALLOCATED(TypeDefinition);
    WTF_MAKE_NONCOPYABLE(TypeDefinition);

    TypeDefinition() = delete;

    TypeDefinition(TypeDefinitionKind kind, FunctionArgCount retCount, FunctionArgCount argCount)
        // FunctionSignature is not moveable.
        : m_typeHeader(std::in_place_index<0>, static_cast<Type*>(payload()), argCount, retCount)
    {
        RELEASE_ASSERT(kind == TypeDefinitionKind::FunctionSignature);
    }

    TypeDefinition(TypeDefinitionKind kind, uint32_t fieldCount, const FieldType* fields)
        : m_typeHeader { StructType { static_cast<FieldType*>(payload()), static_cast<StructFieldCount>(fieldCount), fields } }
    {
        RELEASE_ASSERT(kind == TypeDefinitionKind::StructType);
    }

    TypeDefinition(TypeDefinitionKind kind, uint32_t fieldCount)
        : m_typeHeader { RecursionGroup { static_cast<TypeIndex*>(payload()), static_cast<RecursionGroupCount>(fieldCount) } }
    {
        RELEASE_ASSERT(kind == TypeDefinitionKind::RecursionGroup);
    }

    TypeDefinition(TypeDefinitionKind kind, SupertypeCount count, bool isFinal)
        : m_typeHeader { Subtype { static_cast<TypeIndex*>(payload()), count, isFinal } }
    {
        RELEASE_ASSERT(kind == TypeDefinitionKind::Subtype);
    }

    TypeDefinition(TypeDefinitionKind kind)
        : m_typeHeader { ArrayType { static_cast<FieldType*>(payload()) } }
    {
        if (kind == TypeDefinitionKind::Projection)
            m_typeHeader = Projection { static_cast<TypeIndex*>(payload()) };
        else
            RELEASE_ASSERT(kind == TypeDefinitionKind::ArrayType);
    }

    // Payload starts past end of this object.
    void* payload() { return this + 1; }

    static size_t allocatedFunctionSize(Checked<FunctionArgCount> retCount, Checked<FunctionArgCount> argCount) { return sizeof(TypeDefinition) + (retCount + argCount) * sizeof(Type); }
    static size_t allocatedStructSize(Checked<StructFieldCount> fieldCount) { return sizeof(TypeDefinition) + fieldCount * (sizeof(FieldType) + sizeof(unsigned)); }
    static size_t allocatedArraySize() { return sizeof(TypeDefinition) + sizeof(FieldType); }
    static size_t allocatedRecursionGroupSize(Checked<RecursionGroupCount> typeCount) { return sizeof(TypeDefinition) + typeCount * sizeof(TypeIndex); }
    static size_t allocatedProjectionSize() { return sizeof(TypeDefinition) + 2 * sizeof(TypeIndex); }
    static size_t allocatedSubtypeSize() { return sizeof(TypeDefinition) + 2 * sizeof(TypeIndex); }

public:
    template <typename T>
    bool is() const { return std::holds_alternative<T>(m_typeHeader); }

    template <typename T>
    T* as() { ASSERT(is<T>()); return std::get_if<T>(&m_typeHeader); }

    template <typename T>
    const T* as() const { return const_cast<TypeDefinition*>(this)->as<T>(); }

    TypeIndex index() const;

    WTF::String toString() const;
    void dump(WTF::PrintStream& out) const;
    bool operator==(const TypeDefinition& rhs) const { return this == &rhs; }
    unsigned hash() const;

    Ref<const TypeDefinition> replacePlaceholders(TypeIndex) const;
    const TypeDefinition& unroll() const;
    const TypeDefinition& expand() const;
    bool hasRecursiveReference() const;
    bool isFinalType() const;

    // Type definitions that are compound and contain references to other definitions
    // via a type index should ref() the other definition when new unique instances are
    // constructed, and need to be cleaned up and have deref() called through this cleanup()
    // method when the containing module is destroyed. Returns true if any ref counts may
    // have changed.
    bool cleanup();

    // Type definitions are uniqued and, for call_indirect, validated at runtime. Tables can create invalid TypeIndex values which cause call_indirect to fail. We use 0 as the invalidIndex so that the codegen can easily test for it and trap, and we add a token invalid entry in TypeInformation.
    static const constexpr TypeIndex invalidIndex = 0;

private:
    // Returns the TypeIndex of a potentially unowned (other than TypeInformation::m_typeSet) TypeDefinition.
    TypeIndex unownedIndex() const { return std::bit_cast<TypeIndex>(this); }

    friend class TypeInformation;
    friend struct FunctionParameterTypes;
    friend struct StructParameterTypes;
    friend struct ArrayParameterTypes;
    friend struct RecursionGroupParameterTypes;
    friend struct ProjectionParameterTypes;
    friend struct SubtypeParameterTypes;

    static RefPtr<TypeDefinition> tryCreateFunctionSignature(FunctionArgCount returnCount, FunctionArgCount argumentCount);
    static RefPtr<TypeDefinition> tryCreateStructType(StructFieldCount, const FieldType*);
    static RefPtr<TypeDefinition> tryCreateArrayType();
    static RefPtr<TypeDefinition> tryCreateRecursionGroup(RecursionGroupCount);
    static RefPtr<TypeDefinition> tryCreateProjection();
    static RefPtr<TypeDefinition> tryCreateSubtype(SupertypeCount, bool);

    static Type substitute(Type, TypeIndex);

    std::variant<FunctionSignature, StructType, ArrayType, RecursionGroup, Projection, Subtype> m_typeHeader;
    // Payload is stored here.
};

inline void Type::dump(PrintStream& out) const
{
    TypeKind kindToPrint = kind;
    if (index != TypeDefinition::invalidIndex) {
        if (typeIndexIsType(index)) {
            // If the index is negative, we assume we're using it to represent a TypeKind.
            // FIXME: Reusing index to store a typekind is kind of messy? We should consider
            // refactoring Type to handle this case more explicitly, since it's used in
            // funcrefType() and externrefType().
            // https://bugs.webkit.org/show_bug.cgi?id=247454
            kindToPrint = static_cast<TypeKind>(index);
        } else {
            // Assume the index is a pointer to a TypeDefinition.
            out.print(*reinterpret_cast<TypeDefinition*>(index));
            return;
        }
    }
    switch (kindToPrint) {
#define CREATE_CASE(name, ...) case TypeKind::name: out.print(#name); break;
        FOR_EACH_WASM_TYPE(CREATE_CASE)
#undef CREATE_CASE
    }
}

struct TypeHash {
    RefPtr<TypeDefinition> key { nullptr };
    TypeHash() = default;
    explicit TypeHash(Ref<TypeDefinition>&& key)
        : key(WTFMove(key))
    { }
    explicit TypeHash(WTF::HashTableDeletedValueType)
        : key(WTF::HashTableDeletedValue)
    { }
    bool operator==(const TypeHash& rhs) const { return equal(*this, rhs); }
    static bool equal(const TypeHash& lhs, const TypeHash& rhs) { return lhs.key == rhs.key; }
    static unsigned hash(const TypeHash& typeHash) { return typeHash.key ? typeHash.key->hash() : 0; }
    static constexpr bool safeToCompareToEmptyOrDeleted = false;
    bool isHashTableDeletedValue() const { return key.isHashTableDeletedValue(); }
};

} } // namespace JSC::Wasm


namespace WTF {

template<typename T> struct DefaultHash;
template<> struct DefaultHash<JSC::Wasm::TypeHash> : JSC::Wasm::TypeHash { };

template<typename T> struct HashTraits;
template<> struct HashTraits<JSC::Wasm::TypeHash> : SimpleClassHashTraits<JSC::Wasm::TypeHash> {
    static constexpr bool emptyValueIsZero = true;
};

} // namespace WTF


namespace JSC { namespace Wasm {

// Type information is held globally and shared by the entire process to allow all type definitions to be unique. This is required when wasm calls another wasm instance, and must work when modules are shared between multiple VMs.
class TypeInformation {
    WTF_MAKE_NONCOPYABLE(TypeInformation);
    WTF_MAKE_TZONE_ALLOCATED(TypeInformation);

    TypeInformation();

public:
    static TypeInformation& singleton();

    static const TypeDefinition& signatureForLLIntBuiltin(LLIntBuiltin);

    static RefPtr<TypeDefinition> typeDefinitionForFunction(const Vector<Type, 16>& returnTypes, const Vector<Type, 16>& argumentTypes);
    static RefPtr<TypeDefinition> typeDefinitionForStruct(const Vector<FieldType>& fields);
    static RefPtr<TypeDefinition> typeDefinitionForArray(FieldType);
    static RefPtr<TypeDefinition> typeDefinitionForRecursionGroup(const Vector<TypeIndex>& types);
    static RefPtr<TypeDefinition> typeDefinitionForProjection(TypeIndex, ProjectionIndex);
    static RefPtr<TypeDefinition> typeDefinitionForSubtype(const Vector<TypeIndex>&, TypeIndex, bool);
    static RefPtr<TypeDefinition> getPlaceholderProjection(ProjectionIndex);
    ALWAYS_INLINE const FunctionSignature* thunkFor(Type type) const { return thunkTypes[linearizeType(type.kind)]; }

    static void addCachedUnrolling(TypeIndex, const TypeDefinition&);
    static std::optional<TypeIndex> tryGetCachedUnrolling(TypeIndex);

    // Every type definition that is in a module's signature list should have a canonical RTT registered for subtyping checks.
    static void registerCanonicalRTTForType(TypeIndex);
    static RefPtr<RTT> canonicalRTTForType(TypeIndex);
    // This will only return valid results for types in the type signature list and that have a registered canonical RTT.
    static std::optional<RefPtr<const RTT>> tryGetCanonicalRTT(TypeIndex);
    static RefPtr<const RTT> getCanonicalRTT(TypeIndex);

    static bool castReference(JSValue, bool, TypeIndex);

    static const TypeDefinition& get(TypeIndex);
    static TypeIndex get(const TypeDefinition&);

    inline static const FunctionSignature& getFunctionSignature(TypeIndex);
    inline static std::optional<const FunctionSignature*> tryGetFunctionSignature(TypeIndex);

    static void tryCleanup();
private:
    HashSet<Wasm::TypeHash> m_typeSet;
    UncheckedKeyHashMap<TypeIndex, RefPtr<const TypeDefinition>> m_unrollingCache;
    UncheckedKeyHashMap<TypeIndex, RefPtr<RTT>> m_rttMap;
    HashSet<RefPtr<TypeDefinition>> m_placeholders;
    const FunctionSignature* thunkTypes[numTypes];
    RefPtr<TypeDefinition> m_I64_Void;
    RefPtr<TypeDefinition> m_Void_I32;
    RefPtr<TypeDefinition> m_Void_I32I32I32;
    RefPtr<TypeDefinition> m_Void_I32I32I32I32;
    RefPtr<TypeDefinition> m_Void_I32I32I32I32I32;
    RefPtr<TypeDefinition> m_I32_I32;
    RefPtr<TypeDefinition> m_I32_RefI32I32I32;
    RefPtr<TypeDefinition> m_Ref_RefI32I32;
    RefPtr<TypeDefinition> m_Arrayref_I32I32I32I32;
    RefPtr<TypeDefinition> m_Anyref_Externref;
    RefPtr<TypeDefinition> m_Void_I32AnyrefI32;
    RefPtr<TypeDefinition> m_Void_I32AnyrefI32I32I32I32;
    RefPtr<TypeDefinition> m_Void_I32AnyrefI32I32AnyrefI32I32;
    Lock m_lock;
};

} } // namespace JSC::Wasm

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END

#endif // ENABLE(WEBASSEMBLY)
