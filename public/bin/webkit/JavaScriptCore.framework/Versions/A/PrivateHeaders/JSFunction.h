/*
 *  Copyright (C) 1999-2000 Harri Porten (porten@kde.org)
 *  Copyright (C) 2003-2023 Apple Inc. All rights reserved.
 *  Copyright (C) 2007 Cameron Zwarich (cwzwarich@uwaterloo.ca)
 *  Copyright (C) 2007 Maks Orlovich
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

#include "FunctionRareData.h"
#include "InternalFunction.h"
#include "JSCallee.h"
#include "JSScope.h"

namespace JSC {

class ExecutableBase;
class FunctionExecutable;
class FunctionPrototype;
class JSLexicalEnvironment;
class JSGlobalObject;
class LLIntOffsetsExtractor;
class NativeExecutable;
class SourceCode;
class InternalFunction;
namespace DFG {
class SpeculativeJIT;
class JITCompiler;
}

namespace DOMJIT {
class Signature;
}


JS_EXPORT_PRIVATE JSC_DECLARE_HOST_FUNCTION(callHostFunctionAsConstructor);

JS_EXPORT_PRIVATE String getCalculatedDisplayName(VM&, JSObject*);

class JSFunction : public JSCallee {
    friend class JIT;
    friend class DFG::SpeculativeJIT;
    friend class DFG::JITCompiler;
    friend class VM;
    friend class InternalFunction;

public:
    static constexpr uintptr_t rareDataTag = 0x1;
    
    template<typename CellType, SubspaceAccess>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        return &vm.functionSpace();
    }
    
    typedef JSCallee Base;
    static constexpr unsigned StructureFlags = Base::StructureFlags | OverridesGetOwnPropertySlot | OverridesGetOwnSpecialPropertyNames | OverridesGetCallData | OverridesPut;

    static size_t allocationSize(Checked<size_t> inlineCapacity)
    {
        ASSERT_UNUSED(inlineCapacity, !inlineCapacity);
        return sizeof(JSFunction);
    }

    static Structure* selectStructureForNewFuncExp(JSGlobalObject*, FunctionExecutable*);

    JS_EXPORT_PRIVATE static JSFunction* create(VM&, JSGlobalObject*, unsigned length, const String& name, NativeFunction, ImplementationVisibility, Intrinsic = NoIntrinsic, NativeFunction nativeConstructor = callHostFunctionAsConstructor, const DOMJIT::Signature* = nullptr);
    
    static JSFunction* createWithInvalidatedReallocationWatchpoint(VM&, JSGlobalObject*, FunctionExecutable*, JSScope*);
    static JSFunction* createWithInvalidatedReallocationWatchpoint(VM&, JSGlobalObject*, FunctionExecutable*, JSScope*, Structure*);

    JS_EXPORT_PRIVATE static JSFunction* create(VM&, JSGlobalObject*, FunctionExecutable*, JSScope*);
    static JSFunction* create(VM&, JSGlobalObject*, FunctionExecutable*, JSScope*, Structure*);

    JS_EXPORT_PRIVATE String name(VM&);
    JS_EXPORT_PRIVATE String displayName(VM&);
    JS_EXPORT_PRIVATE const String calculatedDisplayName(VM&);
    JS_EXPORT_PRIVATE JSString* toString(JSGlobalObject*);

    String nameWithoutGC(VM&);

    JSString* asStringConcurrently() const;

    ExecutableBase* executable() const
    {
        uintptr_t executableOrRareData = m_executableOrRareData;
        if (executableOrRareData & rareDataTag)
            return std::bit_cast<FunctionRareData*>(executableOrRareData & ~rareDataTag)->executable();
        return std::bit_cast<ExecutableBase*>(executableOrRareData);
    }

    // To call any of these methods include JSFunctionInlines.h
    bool isHostFunction() const;
    bool isNonBoundHostFunction() const;
    FunctionExecutable* jsExecutable() const;
    Intrinsic intrinsic() const;

    JS_EXPORT_PRIVATE const SourceCode* sourceCode() const;

    DECLARE_EXPORT_INFO;

    inline static Structure* createStructure(VM&, JSGlobalObject*, JSValue);

    TaggedNativeFunction nativeFunction();
    TaggedNativeFunction nativeConstructor();

    JS_EXPORT_PRIVATE static CallData getConstructData(JSCell*);
    JS_EXPORT_PRIVATE static CallData getCallData(JSCell*);

    static constexpr ptrdiff_t offsetOfExecutableOrRareData()
    {
        return OBJECT_OFFSETOF(JSFunction, m_executableOrRareData);
    }

    FunctionRareData* ensureRareData(VM& vm)
    {
        uintptr_t executableOrRareData = m_executableOrRareData;
        if (UNLIKELY(!(executableOrRareData & rareDataTag)))
            return allocateRareData(vm);
        return std::bit_cast<FunctionRareData*>(executableOrRareData & ~rareDataTag);
    }

    FunctionRareData* ensureRareDataAndObjectAllocationProfile(JSGlobalObject*, unsigned inlineCapacity);

    FunctionRareData* rareData() const
    {
        uintptr_t executableOrRareData = m_executableOrRareData;
        if (executableOrRareData & rareDataTag)
            return std::bit_cast<FunctionRareData*>(executableOrRareData & ~rareDataTag);
        return nullptr;
    }

    bool isHostOrBuiltinFunction() const;
    bool isBuiltinFunction() const;
    JS_EXPORT_PRIVATE bool isHostFunctionNonInline() const;
    bool isClassConstructorFunction() const;
    bool isRemoteFunction() const;

    void setFunctionName(JSGlobalObject*, JSValue name);

    // Returns the __proto__ for the |this| value if this JSFunction were to be constructed.
    JSObject* prototypeForConstruction(VM&, JSGlobalObject*);

    bool canUseAllocationProfiles();

    enum class PropertyStatus {
        Eager,
        Lazy,
        Reified,
    };
    enum class SetHasModifiedLengthOrName : uint8_t { Yes, No };
    template <SetHasModifiedLengthOrName set = SetHasModifiedLengthOrName::Yes>
    PropertyStatus reifyLazyPropertyIfNeeded(VM&, JSGlobalObject*, PropertyName);

    bool canAssumeNameAndLengthAreOriginal(VM&);
    double originalLength(VM&);
    JSString* originalName(JSGlobalObject*);

    bool mayHaveNonReifiedPrototype();

protected:
    JS_EXPORT_PRIVATE JSFunction(VM&, NativeExecutable*, JSGlobalObject*, Structure*);
    JSFunction(VM&, FunctionExecutable*, JSScope*, Structure*);

    void finishCreation(VM&, NativeExecutable*, unsigned length, const String& name);
#if ASSERT_ENABLED
    void finishCreation(VM&);
#else
    using Base::finishCreation;
#endif

    static bool getOwnPropertySlot(JSObject*, JSGlobalObject*, PropertyName, PropertySlot&);
    static void getOwnSpecialPropertyNames(JSObject*, JSGlobalObject*, PropertyNameArray&, DontEnumPropertiesMode);
    static bool defineOwnProperty(JSObject*, JSGlobalObject*, PropertyName, const PropertyDescriptor&, bool shouldThrow);

    static bool put(JSCell*, JSGlobalObject*, PropertyName, JSValue, PutPropertySlot&);

    static bool deleteProperty(JSCell*, JSGlobalObject*, PropertyName, DeletePropertySlot&);

    DECLARE_VISIT_CHILDREN;

private:
    static JSFunction* createImpl(VM& vm, FunctionExecutable* executable, JSScope* scope, Structure* structure)
    {
        JSFunction* function = new (NotNull, allocateCell<JSFunction>(vm)) JSFunction(vm, executable, scope, structure);
        ASSERT(function->structure()->globalObject());
        function->finishCreation(vm);
        return function;
    }

    FunctionRareData* allocateRareData(VM&);
    FunctionRareData* allocateAndInitializeRareData(JSGlobalObject*, size_t inlineCapacity);
    FunctionRareData* initializeRareData(JSGlobalObject*, size_t inlineCapacity);

    bool hasReifiedLength() const;
    bool hasReifiedName() const;
    void reifyLength(VM&);
    PropertyStatus reifyName(VM&, JSGlobalObject*);
    PropertyStatus reifyName(VM&, JSGlobalObject*, String name);

    static bool isLazy(PropertyStatus property) { return property == PropertyStatus::Lazy || property == PropertyStatus::Reified; }
    static bool isReified(PropertyStatus property) { return property == PropertyStatus::Reified; }

    PropertyStatus reifyLazyPropertyForHostOrBuiltinIfNeeded(VM&, JSGlobalObject*, PropertyName);
    PropertyStatus reifyLazyPrototypeIfNeeded(VM&, JSGlobalObject*, PropertyName);
    PropertyStatus reifyLazyLengthIfNeeded(VM&, JSGlobalObject*, PropertyName);
    PropertyStatus reifyLazyNameIfNeeded(VM&, JSGlobalObject*, PropertyName);
    PropertyStatus reifyLazyBoundNameIfNeeded(VM&, JSGlobalObject*, PropertyName);

#if ASSERT_ENABLED
    void assertTypeInfoFlagInvariants();
#else
    void assertTypeInfoFlagInvariants() { }
#endif

    friend class LLIntOffsetsExtractor;

    uintptr_t m_executableOrRareData;
};

class JSStrictFunction final : public JSFunction {
public:
    using Base = JSFunction;

    DECLARE_EXPORT_INFO;

    static constexpr unsigned StructureFlags = Base::StructureFlags;

    inline static Structure* createStructure(VM&, JSGlobalObject*, JSValue);
};
static_assert(sizeof(JSStrictFunction) == sizeof(JSFunction), "Allocated in JSFunction IsoSubspace");

class JSSloppyFunction final : public JSFunction {
public:
    using Base = JSFunction;

    DECLARE_EXPORT_INFO;

    static constexpr unsigned StructureFlags = Base::StructureFlags;

    inline static Structure* createStructure(VM&, JSGlobalObject*, JSValue);
};
static_assert(sizeof(JSSloppyFunction) == sizeof(JSFunction), "Allocated in JSFunction IsoSubspace");

class JSArrowFunction final : public JSFunction {
public:
    using Base = JSFunction;

    DECLARE_EXPORT_INFO;

    static constexpr unsigned StructureFlags = Base::StructureFlags;

    inline static Structure* createStructure(VM&, JSGlobalObject*, JSValue);
};
static_assert(sizeof(JSArrowFunction) == sizeof(JSFunction), "Allocated in JSFunction IsoSubspace");

} // namespace JSC
