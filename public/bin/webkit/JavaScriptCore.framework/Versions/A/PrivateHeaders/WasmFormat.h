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

#if ENABLE(WEBASSEMBLY)

#include "CCallHelpers.h"
#include "CallLinkInfo.h"
#include "CodeLocation.h"
#include "Identifier.h"
#include "JSString.h"
#include "MacroAssemblerCodeRef.h"
#include "MathCommon.h"
#include "PageCount.h"
#include "RegisterAtOffsetList.h"
#include "WasmMemoryInformation.h"
#include "WasmName.h"
#include "WasmNameSection.h"
#include "WasmOps.h"
#include "WasmTypeDefinition.h"
#include <cstdint>
#include <limits>
#include <memory>
#include <wtf/FixedBitVector.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

class Compilation;

namespace Wasm {

struct CompilationContext;
struct ModuleInformation;
struct UnlinkedHandlerInfo;

struct BlockSignature {
    const FunctionSignature* m_signature;
    RefPtr<TypeDefinition> m_generatedUnderlyingType;
};

enum class TableElementType : uint8_t {
    Externref,
    Funcref
};

constexpr int32_t maxI31ref = 1073741823;
constexpr int32_t minI31ref = -1073741824;

inline bool isValueType(Type type)
{
    switch (type.kind) {
    case TypeKind::I32:
    case TypeKind::I64:
    case TypeKind::F32:
    case TypeKind::F64:
        return true;
    case TypeKind::Exn:
    case TypeKind::Externref:
    case TypeKind::Funcref:
        return false;
    case TypeKind::Ref:
    case TypeKind::RefNull:
        return type.index != TypeDefinition::invalidIndex;
    case TypeKind::V128:
        return Options::useWasmSIMD();
    default:
        break;
    }
    return false;
}

inline bool isRefType(Type type)
{
    return type.isRef() || type.isRefNull();
}

// If this is a type, returns true iff it's a ref type; if it's a packed type, returns false
inline bool isRefType(StorageType type)
{
    if (type.is<Type>())
        return isRefType(type.as<Type>());
    return false;
}

inline bool isExternref(Type type)
{
    return isRefType(type) && type.index == static_cast<TypeIndex>(TypeKind::Externref);
}

inline bool isFuncref(Type type)
{
    return isRefType(type) && type.index == static_cast<TypeIndex>(TypeKind::Funcref);
}

inline bool isEqref(Type type)
{
    if (!Options::useWasmGC())
        return false;
    return isRefType(type) && type.index == static_cast<TypeIndex>(TypeKind::Eqref);
}

inline bool isAnyref(Type type)
{
    if (!Options::useWasmGC())
        return false;
    return isRefType(type) && type.index == static_cast<TypeIndex>(TypeKind::Anyref);
}

inline bool isNullref(Type type)
{
    if (!Options::useWasmGC())
        return false;
    return isRefType(type) && type.index == static_cast<TypeIndex>(TypeKind::Nullref);
}

inline bool isNullfuncref(Type type)
{
    if (!Options::useWasmGC())
        return false;
    return isRefType(type) && type.index == static_cast<TypeIndex>(TypeKind::Nullfuncref);
}

inline bool isNullexternref(Type type)
{
    if (!Options::useWasmGC())
        return false;
    return isRefType(type) && type.index == static_cast<TypeIndex>(TypeKind::Nullexternref);
}

inline bool isInternalref(Type type)
{
    if (!Options::useWasmGC() || !isRefType(type))
        return false;
    if (typeIndexIsType(type.index)) {
        switch (static_cast<TypeKind>(type.index)) {
        case TypeKind::I31ref:
        case TypeKind::Arrayref:
        case TypeKind::Structref:
        case TypeKind::Eqref:
        case TypeKind::Anyref:
        case TypeKind::Nullref:
            return true;
        default:
            return false;
        }
    }
    return !TypeInformation::get(type.index).expand().is<FunctionSignature>();
}

inline bool isI31ref(Type type)
{
    if (!Options::useWasmGC())
        return false;
    return isRefType(type) && type.index == static_cast<TypeIndex>(TypeKind::I31ref);
}

inline bool isArrayref(Type type)
{
    if (!Options::useWasmGC())
        return false;
    return isRefType(type) && type.index == static_cast<TypeIndex>(TypeKind::Arrayref);
}

inline bool isStructref(Type type)
{
    if (!Options::useWasmGC())
        return false;
    return isRefType(type) && type.index == static_cast<TypeIndex>(TypeKind::Structref);
}

inline JSString* typeToJSAPIString(VM& vm, Type type)
{
    switch (type.kind) {
    case TypeKind::I32:
        return jsNontrivialString(vm, "i32"_s);
    case TypeKind::I64:
        return jsNontrivialString(vm, "i64"_s);
    case TypeKind::F32:
        return jsNontrivialString(vm, "f32"_s);
    case TypeKind::F64:
        return jsNontrivialString(vm, "f64"_s);
    case TypeKind::V128:
        return jsNontrivialString(vm, "v128"_s);
    default: {
        if (isFuncref(type) && type.isNullable())
            return jsNontrivialString(vm, "funcref"_s);
        if (isExternref(type) && type.isNullable())
            return jsNontrivialString(vm, "externref"_s);
        // Some Wasm reference types are currently unrepresentable for the JS API.
        return nullptr;
    }
    }
    RELEASE_ASSERT_NOT_REACHED();
}

inline Type nonNullFuncrefType()
{
    return Wasm::Type { Wasm::TypeKind::Ref, static_cast<Wasm::TypeIndex>(Wasm::TypeKind::Funcref) };
}

inline Type funcrefType()
{
    return Wasm::Type { Wasm::TypeKind::RefNull, static_cast<Wasm::TypeIndex>(Wasm::TypeKind::Funcref) };
}

inline Type externrefType(bool isNullable = true)
{
    return Wasm::Type { isNullable ? Wasm::TypeKind::RefNull : Wasm::TypeKind::Ref, static_cast<Wasm::TypeIndex>(Wasm::TypeKind::Externref) };
}

inline Type eqrefType()
{
    ASSERT(Options::useWasmGC());
    return Wasm::Type { Wasm::TypeKind::RefNull, static_cast<Wasm::TypeIndex>(Wasm::TypeKind::Eqref) };
}

inline Type anyrefType(bool isNullable = true)
{
    ASSERT(Options::useWasmGC());
    return Wasm::Type { isNullable ? Wasm::TypeKind::RefNull : Wasm::TypeKind::Ref, static_cast<Wasm::TypeIndex>(Wasm::TypeKind::Anyref) };
}

inline Type arrayrefType(bool isNullable = true)
{
    ASSERT(Options::useWasmGC());
    // Returns a non-null ref type, since this is used for the return types of array operations
    // that are guaranteed to return a non-null array reference
    return Wasm::Type { isNullable ? Wasm::TypeKind::RefNull : Wasm::TypeKind::Ref, static_cast<Wasm::TypeIndex>(Wasm::TypeKind::Arrayref) };
}

inline Type exnrefType()
{
    return Wasm::Type { Wasm::TypeKind::RefNull, static_cast<Wasm::TypeIndex>(Wasm::TypeKind::Exn) };
}

inline bool isRefWithTypeIndex(Type type)
{
    return isRefType(type) && !typeIndexIsType(type.index);
}

// Determine if the ref type has a placeholder type index that is used
// for an unresolved recursive reference in a recursion group.
inline bool isRefWithRecursiveReference(Type type)
{
    if (!Options::useWasmGC())
        return false;

    if (isRefWithTypeIndex(type)) {
        const TypeDefinition& def = TypeInformation::get(type.index);
        if (def.is<Projection>())
            return def.as<Projection>()->isPlaceholder();
    }

    return false;
}

inline bool isRefWithRecursiveReference(StorageType storageType)
{
    if (storageType.is<PackedType>())
        return false;

    return isRefWithRecursiveReference(storageType.as<Type>());
}

inline bool isTypeIndexHeapType(int32_t heapType)
{
    return heapType >= 0;
}

inline bool isSubtypeIndex(TypeIndex sub, TypeIndex parent)
{
    if (sub == parent)
        return true;

    // When Wasm GC is off, RTTs are not registered and there is no subtyping on typedefs.
    if (!Options::useWasmGC())
        return false;

    auto subRTT = TypeInformation::tryGetCanonicalRTT(sub);
    auto parentRTT = TypeInformation::tryGetCanonicalRTT(parent);
    ASSERT(subRTT.has_value() && parentRTT.has_value());

    return subRTT.value()->isSubRTT(*parentRTT.value());
}

inline bool isSubtype(Type sub, Type parent)
{
    // Before the typed funcref proposal there is no non-trivial subtyping.
    if (sub.isNullable() && !parent.isNullable())
        return false;

    if (isRefWithTypeIndex(sub)) {
        if (isRefWithTypeIndex(parent))
            return isSubtypeIndex(sub.index, parent.index);

        if ((isAnyref(parent) || isEqref(parent)))
            return !TypeInformation::get(sub.index).expand().is<FunctionSignature>();

        if (isArrayref(parent))
            return TypeInformation::get(sub.index).expand().is<ArrayType>();

        if (isStructref(parent))
            return TypeInformation::get(sub.index).expand().is<StructType>();

        if (isFuncref(parent))
            return TypeInformation::get(sub.index).expand().is<FunctionSignature>();
    }

    if ((isI31ref(sub) || isStructref(sub) || isArrayref(sub)) && (isAnyref(parent) || isEqref(parent)))
        return true;

    if (isEqref(sub) && isAnyref(parent))
        return true;

    if (isNullref(sub))
        return isInternalref(parent);

    if (isNullfuncref(sub))
        return isSubtype(parent, funcrefType());

    if (isNullexternref(sub) && isExternref(parent))
        return true;

    if (sub.isRef() && parent.isRefNull())
        return sub.index == parent.index;

    return sub == parent;
}

inline bool isSubtype(StorageType sub, StorageType parent)
{
    if (sub.is<PackedType>() || parent.is<PackedType>())
        return sub == parent;

    ASSERT(sub.is<Type>() && parent.is<Type>());
    return isSubtype(sub.as<Type>(), parent.as<Type>());
}

inline bool isValidHeapTypeKind(intptr_t kind)
{
    switch (kind) {
    case static_cast<intptr_t>(TypeKind::Funcref):
    case static_cast<intptr_t>(TypeKind::Externref):
    case static_cast<intptr_t>(TypeKind::Exn):
        return true;
    case static_cast<intptr_t>(TypeKind::I31ref):
    case static_cast<intptr_t>(TypeKind::Arrayref):
    case static_cast<intptr_t>(TypeKind::Structref):
    case static_cast<intptr_t>(TypeKind::Eqref):
    case static_cast<intptr_t>(TypeKind::Anyref):
    case static_cast<intptr_t>(TypeKind::Nullref):
    case static_cast<intptr_t>(TypeKind::Nullfuncref):
    case static_cast<intptr_t>(TypeKind::Nullexternref):
        return Options::useWasmGC();
    default:
        break;
    }
    return false;
}

// FIXME: separating out heap types in wasm.json could be cleaner in the long term.
inline const char* heapTypeKindAsString(TypeKind kind)
{
    ASSERT(isValidHeapTypeKind(static_cast<intptr_t>(kind)));
    switch (kind) {
    case TypeKind::Funcref:
        return "func";
    case TypeKind::Externref:
        return "extern";
    case TypeKind::I31ref:
        return "i31";
    case TypeKind::Arrayref:
        return "array";
    case TypeKind::Structref:
        return "struct";
    case TypeKind::Eqref:
        return "eq";
    case TypeKind::Anyref:
        return "any";
    case TypeKind::Nullref:
        return "none";
    case TypeKind::Nullfuncref:
        return "nofunc";
    case TypeKind::Nullexternref:
        return "noextern";
    case TypeKind::Exn:
        return "exn";
    default:
        RELEASE_ASSERT_NOT_REACHED();
        return "";
    }
}

inline bool isDefaultableType(Type type)
{
    return !type.isRef();
}

inline bool isDefaultableType(StorageType type)
{
    if (type.is<Type>())
        return !type.as<Type>().isRef();
    // All packed types are defaultable.
    return true;
}

inline JSValue internalizeExternref(JSValue value)
{
    if (value.isDouble() && JSC::canBeStrictInt32(value.asDouble())) {
        int32_t int32Value = JSC::toInt32(value.asDouble());
        if (int32Value <= Wasm::maxI31ref && int32Value >= Wasm::minI31ref)
            return jsNumber(int32Value);
    }

    return value;
}

enum class ExternalKind : uint8_t {
    // FIXME auto-generate this. https://bugs.webkit.org/show_bug.cgi?id=165231
    Function = 0,
    Table = 1,
    Memory = 2,
    Global = 3,
    Exception = 4,
};

template<typename Int>
inline bool isValidExternalKind(Int val)
{
    switch (val) {
    case static_cast<Int>(ExternalKind::Function):
    case static_cast<Int>(ExternalKind::Table):
    case static_cast<Int>(ExternalKind::Memory):
    case static_cast<Int>(ExternalKind::Global):
    case static_cast<Int>(ExternalKind::Exception):
        return true;
    }
    return false;
}

static_assert(static_cast<int>(ExternalKind::Function) == 0, "Wasm needs Function to have the value 0");
static_assert(static_cast<int>(ExternalKind::Table)    == 1, "Wasm needs Table to have the value 1");
static_assert(static_cast<int>(ExternalKind::Memory)   == 2, "Wasm needs Memory to have the value 2");
static_assert(static_cast<int>(ExternalKind::Global)   == 3, "Wasm needs Global to have the value 3");
static_assert(static_cast<int>(ExternalKind::Exception)   == 4, "Wasm needs Exception to have the value 4");

inline ASCIILiteral makeString(ExternalKind kind)
{
    switch (kind) {
    case ExternalKind::Function: return "function"_s;
    case ExternalKind::Table: return "table"_s;
    case ExternalKind::Memory: return "memory"_s;
    case ExternalKind::Global: return "global"_s;
    case ExternalKind::Exception: return "tag"_s;
    }
    RELEASE_ASSERT_NOT_REACHED();
    return "?"_s;
}

struct Import {
    WTF_MAKE_STRUCT_FAST_ALLOCATED;
    const Name module;
    const Name field;
    ExternalKind kind;
    unsigned kindIndex; // Index in the vector of the corresponding kind.
};

struct Export {
    WTF_MAKE_STRUCT_FAST_ALLOCATED;
    const Name field;
    ExternalKind kind;
    unsigned kindIndex; // Index in the vector of the corresponding kind.
};

String makeString(const Name& characters);

struct GlobalInformation {
    WTF_MAKE_STRUCT_FAST_ALLOCATED;

    enum InitializationType : uint8_t {
        IsImport,
        FromGlobalImport,
        FromRefFunc,
        FromExpression,
        FromVector,
        FromExtendedExpression,
    };

    enum class BindingMode : uint8_t {
        EmbeddedInInstance = 0,
        Portable,
    };

    Mutability mutability;
    Type type;
    InitializationType initializationType { IsImport };
    BindingMode bindingMode { BindingMode::EmbeddedInInstance };
    union {
        uint64_t initialBitsOrImportNumber;
        v128_t initialVector { };
    } initialBits;
};

struct FunctionData {
    WTF_MAKE_STRUCT_FAST_ALLOCATED;
    size_t start;
    size_t end;
    Vector<uint8_t> data;
    bool usesSIMD : 1 { false };
    bool usesExceptions : 1 { false };
    bool usesAtomics : 1 { false };
    bool finishedValidating : 1 { false };
};

class I32InitExpr {
    WTF_MAKE_TZONE_ALLOCATED(I32InitExpr);
    enum Type : uint8_t {
        Global,
        Const,
        ExtendedExpression
    };

    I32InitExpr(Type type, uint32_t bits)
        : m_bits(bits)
        , m_type(type)
    { }

public:
    I32InitExpr() = delete;

    static I32InitExpr globalImport(uint32_t globalImportNumber) { return I32InitExpr(Global, globalImportNumber); }
    static I32InitExpr constValue(uint32_t constValue) { return I32InitExpr(Const, constValue); }
    static I32InitExpr extendedExpression(uint32_t constantExpressionNumber) { return I32InitExpr(ExtendedExpression, constantExpressionNumber); }

    bool isConst() const { return m_type == Const; }
    bool isGlobalImport() const { return m_type == Global; }
    bool isExtendedExpression() const { return m_type == ExtendedExpression; }
    uint32_t constValue() const
    {
        RELEASE_ASSERT(isConst());
        return m_bits;
    }
    uint32_t globalImportIndex() const
    {
        RELEASE_ASSERT(isGlobalImport());
        return m_bits;
    }
    uint32_t constantExpressionIndex() const
    {
        RELEASE_ASSERT(isExtendedExpression());
        return m_bits;
    }

private:
    uint32_t m_bits;
    Type m_type;
};

struct Segment {
    WTF_MAKE_STRUCT_FAST_ALLOCATED;

    enum class Kind : uint8_t {
        Active,
        Passive,
    };

    Kind kind;
    uint32_t sizeInBytes;
    std::optional<I32InitExpr> offsetIfActive;
    // Bytes are allocated at the end.
    uint8_t& byte(uint32_t pos)
    {
        ASSERT(pos < sizeInBytes);
        return *(reinterpret_cast<uint8_t*>(this) + sizeof(Segment) + pos);
    }

    static void destroy(Segment*);
    typedef std::unique_ptr<Segment, decltype(&Segment::destroy)> Ptr;
    static Segment::Ptr create(std::optional<I32InitExpr>, uint32_t, Kind);

    bool isActive() const { return kind == Kind::Active; }
    bool isPassive() const { return kind == Kind::Passive; }
};

struct Element {
    WTF_MAKE_STRUCT_FAST_ALLOCATED;

    enum class Kind : uint8_t {
        Active,
        Passive,
        Declared,
    };

    enum InitializationType : uint8_t {
        FromGlobal,
        FromRefFunc,
        FromRefNull,
        FromExtendedExpression,
    };

    Element(Element::Kind kind, Type elementType, std::optional<uint32_t> tableIndex, std::optional<I32InitExpr> initExpr)
        : kind(kind)
        , elementType(elementType)
        , tableIndexIfActive(WTFMove(tableIndex))
        , offsetIfActive(WTFMove(initExpr))
    { }

    Element(Element::Kind kind, Type elemType)
        : Element(kind, elemType, std::nullopt, std::nullopt)
    { }

    uint32_t length() const { return initTypes.size(); }

    bool isActive() const { return kind == Kind::Active; }
    bool isPassive() const { return kind == Kind::Passive; }

    Kind kind;
    Type elementType;
    std::optional<uint32_t> tableIndexIfActive;
    std::optional<I32InitExpr> offsetIfActive;

    Vector<InitializationType> initTypes;
    Vector<uint64_t> initialBitsOrIndices;
};

class TableInformation {
    WTF_MAKE_TZONE_ALLOCATED(TableInformation);
public:
    enum InitializationType : uint8_t {
        Default,
        FromGlobalImport,
        FromRefFunc,
        FromRefNull,
        FromExtendedExpression,
    };

    TableInformation()
    {
        ASSERT(!*this);
    }

    TableInformation(uint32_t initial, std::optional<uint32_t> maximum, bool isImport, TableElementType type, Type wasmType, InitializationType initType, uint64_t initialBitsOrImportNumber)
        : m_initial(initial)
        , m_maximum(maximum)
        , m_isImport(isImport)
        , m_isValid(true)
        , m_type(type)
        , m_wasmType(wasmType)
        , m_initType(initType)
        , m_initialBitsOrImportNumber(initialBitsOrImportNumber)
    {
        ASSERT(*this);
    }

    explicit operator bool() const { return m_isValid; }
    bool isImport() const { return m_isImport; }
    uint32_t initial() const { return m_initial; }
    std::optional<uint32_t> maximum() const { return m_maximum; }
    TableElementType type() const { return m_type; }
    Type wasmType() const { return m_wasmType; }
    InitializationType initType() const { return m_initType; }
    uint64_t initialBitsOrImportNumber() const { return m_initialBitsOrImportNumber; }

private:
    uint32_t m_initial;
    std::optional<uint32_t> m_maximum;
    bool m_isImport { false };
    bool m_isValid { false };
    TableElementType m_type;
    Type m_wasmType;
    InitializationType m_initType { Default };
    uint64_t m_initialBitsOrImportNumber;
};
    
struct CustomSection {
    WTF_MAKE_STRUCT_FAST_ALLOCATED;
    Name name;
    Vector<uint8_t> payload;
};

enum class NameType : uint8_t {
    Module = 0,
    Function = 1,
    Local = 2,
};
    
template<typename Int>
inline bool isValidNameType(Int val)
{
    switch (val) {
    case static_cast<Int>(NameType::Module):
    case static_cast<Int>(NameType::Function):
    case static_cast<Int>(NameType::Local):
        return true;
    }
    return false;
}

// A code index is an index in the code section of the module, thus does not include imports. This is also sometimes called an internal function.
// A space index is an index into the total function space of a module and includes imports. It's broken down into [ imports..., code section... ].
// These are **NOT** convertable without knowing how many imports there are e.g. via ModuleInformation/CalleeGroup's toCodeIndex/toSpaceIndex

class FunctionSpaceIndex;
class TRIVIAL_ABI FunctionCodeIndex {
public:
    FunctionCodeIndex() = default;
    FunctionCodeIndex(FunctionSpaceIndex) = delete;
    explicit constexpr FunctionCodeIndex(uint32_t index)
        : m_index(index)
    { }

    size_t rawIndex() const { return m_index; }
    operator size_t() const { return m_index; }
    void dump(PrintStream& out) const { out.print(m_index); }

private:
    uint32_t m_index { UINT_MAX };
};

class TRIVIAL_ABI FunctionSpaceIndex {
public:
    FunctionSpaceIndex() = default;
    FunctionSpaceIndex(FunctionCodeIndex) = delete;
    explicit constexpr FunctionSpaceIndex(uint32_t index)
        : m_index(index)
    { }

    size_t rawIndex() const { return m_index; }
    operator size_t() const { return m_index; }
    void dump(PrintStream& out) const { out.print(m_index); }

private:
    uint32_t m_index { UINT_MAX };
};

struct UnlinkedWasmToWasmCall {
    WTF_MAKE_STRUCT_FAST_ALLOCATED;
    CodeLocationNearCall<WasmEntryPtrTag> callLocation;
    FunctionSpaceIndex functionIndexSpace;
    CodeLocationDataLabelPtr<WasmEntryPtrTag> calleeLocation;

};

#if ENABLE(JIT)
struct Entrypoint {
    WTF_MAKE_STRUCT_FAST_ALLOCATED;
    std::unique_ptr<Compilation> compilation;
    RegisterAtOffsetList calleeSaveRegisters;
};
#endif

class OSREntryValue;
using StackMap = FixedVector<OSREntryValue>;
using StackMaps = UncheckedKeyHashMap<CallSiteIndex, StackMap>;

struct InternalFunction {
    WTF_MAKE_STRUCT_FAST_ALLOCATED;
#if ENABLE(WEBASSEMBLY_OMGJIT) || ENABLE(WEBASSEMBLY_BBQJIT)
    StackMaps stackmaps;
#endif
    Vector<UnlinkedHandlerInfo> exceptionHandlers;
#if ENABLE(JIT)
    Vector<CCallHelpers::Label> bbqLoopEntrypoints;
    std::optional<CCallHelpers::Label> bbqSharedLoopEntrypoint;
    Entrypoint entrypoint;
    FixedBitVector outgoingJITDirectCallees;
#endif
    unsigned osrEntryScratchBufferSize { 0 };
};

static constexpr uintptr_t NullWasmCallee = 0;

struct WasmCallableFunction {
    WTF_MAKE_STRUCT_FAST_ALLOCATED;
    using LoadLocation = CodePtr<WasmEntryPtrTag>*;
    static constexpr ptrdiff_t offsetOfEntrypointLoadLocation() { return OBJECT_OFFSETOF(WasmCallableFunction, entrypointLoadLocation); }
    static constexpr ptrdiff_t offsetOfBoxedWasmCalleeLoadLocation() { return OBJECT_OFFSETOF(WasmCallableFunction, boxedWasmCalleeLoadLocation); }

    const uintptr_t* boxedWasmCalleeLoadLocation { &NullWasmCallee };
    // Target instance and entrypoint are only set for wasm->wasm calls, and are otherwise nullptr. The js-specific logic occurs through import function.
    WriteBarrier<JSWebAssemblyInstance> targetInstance { };
    LoadLocation entrypointLoadLocation { };
};

// WebAssembly direct calls and call_indirect use indices into "function index space". This space starts
// with all imports, and then all internal functions. WasmToWasmImportableFunction and FunctionIndexSpace are only
// meant as fast lookup tables for these opcodes and do not own code.
struct WasmToWasmImportableFunction : public WasmCallableFunction {
    WTF_MAKE_STRUCT_FAST_ALLOCATED;
    static constexpr ptrdiff_t offsetOfSignatureIndex() { return OBJECT_OFFSETOF(WasmToWasmImportableFunction, typeIndex); }
    static constexpr ptrdiff_t offsetOfRTT() { return OBJECT_OFFSETOF(WasmToWasmImportableFunction, rtt); }

    // FIXME: Pack type index and code pointer into one 64-bit value. See <https://bugs.webkit.org/show_bug.cgi?id=165511>.
    TypeIndex typeIndex { TypeDefinition::invalidIndex };
    // Used when GC proposal is enabled, otherwise can be null.
    const RTT* rtt;
};
using FunctionIndexSpace = Vector<WasmToWasmImportableFunction>;

struct WasmOrJSImportableFunction final : public WasmToWasmImportableFunction {
    WTF_MAKE_STRUCT_FAST_ALLOCATED;
    using LoadLocation = CodePtr<WasmEntryPtrTag>*;

    CodePtr<WasmEntryPtrTag> importFunctionStub;
    WriteBarrier<JSObject> importFunction { };
    DataOnlyCallLinkInfo callLinkInfo { };
    uintptr_t boxedCallee { 0xBEEF };

    static constexpr ptrdiff_t offsetOfCallLinkInfo() { return OBJECT_OFFSETOF(WasmOrJSImportableFunction, callLinkInfo); }
};

} } // namespace JSC::Wasm

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END

namespace WTF {

void printInternal(PrintStream&, JSC::Wasm::TableElementType);

} // namespace WTF

#endif // ENABLE(WEBASSEMBLY)
