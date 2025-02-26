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

#include "CodeSpecializationKind.h"
#include "JSDestructibleObject.h"

namespace JSC {

class FunctionPrototype;

class InternalFunction : public JSNonFinalObject {
    friend class JIT;
    friend class LLIntOffsetsExtractor;
public:
    using Base = JSNonFinalObject;
    static constexpr unsigned StructureFlags = Base::StructureFlags | ImplementsHasInstance | ImplementsDefaultHasInstance | OverridesGetCallData;

    template<typename CellType, SubspaceAccess>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        static_assert(sizeof(CellType) == sizeof(InternalFunction), "InternalFunction subclasses that add fields need to override subspaceFor<>()");
        return &vm.internalFunctionSpace();
    }

    DECLARE_EXPORT_INFO;

    DECLARE_VISIT_CHILDREN_WITH_MODIFIER(JS_EXPORT_PRIVATE);

    JS_EXPORT_PRIVATE String name();
    String displayName(VM&);
    String calculatedDisplayName(VM&);

    inline static Structure* createStructure(VM&, JSGlobalObject*, JSValue);

    JS_EXPORT_PRIVATE static Structure* createSubclassStructure(JSGlobalObject*, JSObject* newTarget, Structure*);
    JS_EXPORT_PRIVATE static InternalFunction* createFunctionThatMasqueradesAsUndefined(VM&, JSGlobalObject*, unsigned length, const String& name, NativeFunction);

    TaggedNativeFunction nativeFunctionFor(CodeSpecializationKind kind)
    {
        if (kind == CodeForCall)
            return m_functionForCall;
        ASSERT(kind == CodeForConstruct);
        return m_functionForConstruct;
    }

    static constexpr ptrdiff_t offsetOfNativeFunctionFor(CodeSpecializationKind kind)
    {
        if (kind == CodeForCall)
            return OBJECT_OFFSETOF(InternalFunction, m_functionForCall);
        ASSERT(kind == CodeForConstruct);
        return OBJECT_OFFSETOF(InternalFunction, m_functionForConstruct);
    }

    static constexpr ptrdiff_t offsetOfGlobalObject()
    {
        return OBJECT_OFFSETOF(InternalFunction, m_globalObject);
    }

    JSGlobalObject* globalObject() const { return m_globalObject.get(); }

protected:
    JS_EXPORT_PRIVATE InternalFunction(VM&, Structure*, NativeFunction functionForCall, NativeFunction functionForConstruct = nullptr);

    enum class PropertyAdditionMode { WithStructureTransition, WithoutStructureTransition };
    JS_EXPORT_PRIVATE void finishCreation(VM&, unsigned length, const String& name, PropertyAdditionMode = PropertyAdditionMode::WithStructureTransition);
    DECLARE_DEFAULT_FINISH_CREATION;

    JS_EXPORT_PRIVATE static CallData getConstructData(JSCell*);
    JS_EXPORT_PRIVATE static CallData getCallData(JSCell*);

    TaggedNativeFunction m_functionForCall;
    TaggedNativeFunction m_functionForConstruct;
    WriteBarrier<JSString> m_originalName;
    WriteBarrier<JSGlobalObject> m_globalObject;
};

JS_EXPORT_PRIVATE JSGlobalObject* getFunctionRealm(JSGlobalObject*, JSObject*);

#define JSC_GET_DERIVED_STRUCTURE(vm, structureMemberFunctionName, newTarget, constructor) \
    ((newTarget) == (constructor) \
        ? globalObject->structureMemberFunctionName() \
        : ([&]() -> Structure* { \
            auto scope = DECLARE_THROW_SCOPE((vm)); \
            auto* functionGlobalObject = getFunctionRealm(globalObject, (newTarget)); \
            RETURN_IF_EXCEPTION(scope, nullptr); \
            RELEASE_AND_RETURN(scope, InternalFunction::createSubclassStructure(globalObject, (newTarget), functionGlobalObject->structureMemberFunctionName())); \
        }()))

} // namespace JSC
