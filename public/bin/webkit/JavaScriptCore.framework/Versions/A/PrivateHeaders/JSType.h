/*
 *  Copyright (C) 2006-2024 Apple Inc. All rights reserved.
 *  Copyright (C) 2024 Sosuke Suzuki <aosukeke@gmail.com>.
 *  Copyright (C) 2024 Tetsuharu Ohzeki <tetsuharu.ohzeki@gmail.com>.
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

namespace JSC {

// macro(JSType, DirectSpeculatedType)
#define FOR_EACH_JS_TYPE(macro) \
    /* The CellType value must come before any JSType that is a JSCell. */ \
    macro(CellType, SpecCellOther) \
    macro(StructureType, SpecCellOther) \
    macro(StringType, SpecString) \
    macro(HeapBigIntType, SpecHeapBigInt) \
    macro(SymbolType, SpecSymbol) \
    \
    macro(GetterSetterType, SpecCellOther) \
    macro(CustomGetterSetterType, SpecCellOther) \
    macro(APIValueWrapperType, SpecCellOther) \
    \
    macro(NativeExecutableType, SpecCellOther) \
    \
    macro(ProgramExecutableType, SpecCellOther) \
    macro(ModuleProgramExecutableType, SpecCellOther) \
    macro(EvalExecutableType, SpecCellOther) \
    macro(FunctionExecutableType, SpecCellOther) \
    \
    macro(UnlinkedFunctionExecutableType, SpecCellOther) \
    \
    macro(UnlinkedProgramCodeBlockType, SpecCellOther) \
    macro(UnlinkedModuleProgramCodeBlockType, SpecCellOther) \
    macro(UnlinkedEvalCodeBlockType, SpecCellOther) \
    macro(UnlinkedFunctionCodeBlockType, SpecCellOther) \
    \
    macro(CodeBlockType, SpecCellOther) \
    \
    macro(JSImmutableButterflyType, SpecCellOther) \
    macro(JSSourceCodeType, SpecCellOther) \
    macro(JSScriptFetcherType, SpecCellOther) \
    macro(JSScriptFetchParametersType, SpecCellOther) \
    \
    /* The ObjectType value must come before any JSType that is a subclass of JSObject. */ \
    macro(ObjectType, SpecObjectOther) \
    macro(FinalObjectType, SpecFinalObject) \
    macro(JSCalleeType, SpecObjectOther) \
    macro(JSFunctionType, SpecFunction) \
    macro(InternalFunctionType, SpecObjectOther) \
    macro(NullSetterFunctionType, SpecObjectOther) \
    macro(BooleanObjectType, SpecObjectOther) \
    macro(NumberObjectType, SpecObjectOther) \
    macro(ErrorInstanceType, SpecObjectOther) \
    macro(GlobalProxyType, SpecGlobalProxy) \
    macro(DirectArgumentsType, SpecDirectArguments) \
    macro(ScopedArgumentsType, SpecScopedArguments) \
    macro(ClonedArgumentsType, SpecObjectOther) \
    \
    /* Start JSArray types. */ \
    macro(ArrayType, SpecArray) \
    macro(DerivedArrayType, SpecDerivedArray) \
    /* End JSArray types. */ \
    \
    macro(ArrayBufferType, SpecObjectOther) \
    \
    /* Start JSArrayBufferView types. Keep in sync with the order of FOR_EACH_TYPED_ARRAY_TYPE_EXCLUDING_DATA_VIEW. */ \
    macro(Int8ArrayType, SpecInt8Array) \
    macro(Uint8ArrayType,SpecUint8Array) \
    macro(Uint8ClampedArrayType, SpecUint8ClampedArray) \
    macro(Int16ArrayType, SpecInt16Array) \
    macro(Uint16ArrayType, SpecUint16Array) \
    macro(Int32ArrayType, SpecInt32Array) \
    macro(Uint32ArrayType, SpecUint32Array) \
    macro(Float16ArrayType, SpecFloat16Array) \
    macro(Float32ArrayType, SpecFloat32Array) \
    macro(Float64ArrayType, SpecFloat64Array) \
    macro(BigInt64ArrayType, SpecBigInt64Array) \
    macro(BigUint64ArrayType, SpecBigUint64Array) \
    macro(DataViewType, SpecDataViewObject) \
    /* End JSArrayBufferView types. */ \
    \
    /* JSScope <- JSWithScope */ \
    /*         <- StrictEvalActivation */ \
    /*         <- JSSymbolTableObject  <- JSLexicalEnvironment      <- JSModuleEnvironment */ \
    /*                                 <- JSSegmentedVariableObject <- JSGlobalLexicalEnvironment */ \
    /*                                                              <- JSGlobalObject */ \
    /* Start JSScope types. */ \
    /* Start environment record types. */ \
    macro(GlobalObjectType, SpecObjectOther) \
    macro(GlobalLexicalEnvironmentType, SpecObjectOther) \
    macro(LexicalEnvironmentType, SpecObjectOther) \
    macro(ModuleEnvironmentType, SpecObjectOther) \
    macro(StrictEvalActivationType, SpecObjectOther) \
    /* End environment record types. */ \
    macro(WithScopeType, SpecObjectOther) \
    /* End JSScope types. */ \
    \
    macro(ModuleNamespaceObjectType, SpecObjectOther) \
    macro(ShadowRealmType, SpecObjectOther) \
    macro(RegExpObjectType, SpecRegExpObject) \
    macro(JSDateType, SpecDateObject) \
    macro(ProxyObjectType, SpecProxyObject) \
    macro(JSGeneratorType, SpecObjectOther) \
    macro(JSAsyncGeneratorType, SpecObjectOther) \
    macro(JSArrayIteratorType, SpecObjectOther) \
    macro(JSIteratorType, SpecObjectOther) \
    macro(JSIteratorHelperType, SpecObjectOther) \
    macro(JSMapIteratorType, SpecObjectOther) \
    macro(JSSetIteratorType, SpecObjectOther) \
    macro(JSStringIteratorType, SpecObjectOther) \
    macro(JSWrapForValidIteratorType, SpecObjectOther) \
    macro(JSRegExpStringIteratorType, SpecObjectOther) \
    macro(JSAsyncFromSyncIteratorType, SpecObjectOther) \
    macro(JSPromiseType, SpecPromiseObject) \
    macro(JSMapType, SpecMapObject) \
    macro(JSSetType, SpecSetObject) \
    macro(JSWeakMapType, SpecWeakMapObject) \
    macro(JSWeakSetType, SpecWeakSetObject) \
    macro(WebAssemblyModuleType, SpecObjectOther) \
    macro(WebAssemblyInstanceType, SpecObjectOther) \
    macro(WebAssemblyGCObjectType, SpecObjectOther) \
    /* Start StringObjectType types. */ \
    macro(StringObjectType, SpecStringObject) \
    /* We do not want to accept String.prototype in StringObjectUse, so that we do not include it as SpecStringObject. */ \
    macro(DerivedStringObjectType, SpecObjectOther) \
    /* End StringObjectType types. */ \


enum JSType : uint8_t {
#define JSC_DEFINE_JS_TYPE(type, speculatedType) type,
    FOR_EACH_JS_TYPE(JSC_DEFINE_JS_TYPE)
#undef JSC_DEFINE_JS_TYPE
    LastJSCObjectType = DerivedStringObjectType, // This is the last "JSC" Object type. After this, we have embedder's (e.g., WebCore) extended object types.
    MaxJSType = 0b11111111,
};

static constexpr uint32_t LastMaybeFalsyCellPrimitive = HeapBigIntType;

static constexpr uint32_t FirstTypedArrayType = Int8ArrayType;
static constexpr uint32_t LastTypedArrayType = DataViewType;
static constexpr uint32_t LastTypedArrayTypeExcludingDataView = LastTypedArrayType - 1;

// LastObjectType should be MaxJSType (not LastJSCObjectType) since embedders can add their extended object types after the enums listed in JSType.
static constexpr uint32_t FirstObjectType = ObjectType;
static constexpr uint32_t LastObjectType = MaxJSType;

static constexpr uint32_t FirstScopeType = GlobalObjectType;
static constexpr uint32_t LastScopeType = WithScopeType;

static constexpr uint32_t NumberOfTypedArrayTypes = LastTypedArrayType - FirstTypedArrayType + 1;
static constexpr uint32_t NumberOfTypedArrayTypesExcludingDataView = NumberOfTypedArrayTypes - 1;
static constexpr uint32_t NumberOfTypedArrayTypesExcludingBigIntArraysAndDataView = NumberOfTypedArrayTypes - 3;

static_assert(sizeof(JSType) == sizeof(uint8_t), "sizeof(JSType) is one byte.");
static_assert(LastJSCObjectType < 0b11100000, "Embedder can use 0b11100000 or upper.");

inline constexpr bool isTypedArrayType(JSType type)
{
    return (static_cast<uint32_t>(type) - FirstTypedArrayType) < NumberOfTypedArrayTypesExcludingDataView;
}

inline constexpr bool isTypedArrayTypeIncludingDataView(JSType type)
{
    return (static_cast<uint32_t>(type) - FirstTypedArrayType) < NumberOfTypedArrayTypes;
}

inline constexpr bool isObjectType(JSType type) { return type >= ObjectType; }

} // namespace JSC

namespace WTF {

class PrintStream;

void printInternal(PrintStream&, JSC::JSType);

} // namespace WTF
