/*
 * Copyright (C) 2011-2023 Apple Inc. All rights reserved.
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

#include "JSFunction.h"
#include "JSImmutableButterfly.h"

namespace JSC {

JSC_DECLARE_HOST_FUNCTION(boundThisNoArgsFunctionCall);
JSC_DECLARE_HOST_FUNCTION(boundFunctionCall);
JSC_DECLARE_HOST_FUNCTION(boundFunctionConstruct);
JSC_DECLARE_HOST_FUNCTION(isBoundFunction);
JSC_DECLARE_HOST_FUNCTION(hasInstanceBoundFunction);

class JSBoundFunction final : public JSFunction {
public:
    using Base = JSFunction;
    static constexpr unsigned StructureFlags = Base::StructureFlags & ~ImplementsDefaultHasInstance;
    static_assert(StructureFlags & ImplementsHasInstance);
    static constexpr unsigned maxEmbeddedArgs = 3; // Keep sizeof(JSBoundFunction) <= 96.

    template<typename CellType, SubspaceAccess mode>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        return vm.boundFunctionSpace<mode>();
    }

    JS_EXPORT_PRIVATE static JSBoundFunction* create(VM&, JSGlobalObject*, JSObject* targetFunction, JSValue boundThis, ArgList, double length, JSString* nameMayBeNull);
    static JSBoundFunction* createRaw(VM&, JSGlobalObject*, JSFunction* targetFunction, unsigned boundArgsLength, JSValue boundThis, JSValue arg0, JSValue arg1, JSValue arg2);
    
    static bool customHasInstance(JSObject*, JSGlobalObject*, JSValue);

    JSObject* targetFunction() { return m_targetFunction.get(); }
    JSValue boundThis() { return m_boundThis.get(); }
    unsigned boundArgsLength() const { return m_boundArgsLength; }
    JSArray* boundArgsCopy(JSGlobalObject*);
    JSString* nameMayBeNull() { return m_nameMayBeNull.get(); }
    JSString* name()
    {
        if (m_nameMayBeNull)
            return m_nameMayBeNull.get();
        return nameSlow(vm());
    }
    String nameString()
    {
        if (!m_nameMayBeNull)
            name();
        ASSERT(!m_nameMayBeNull->isRope());
        bool allocationAllowed = false;
        return m_nameMayBeNull->tryGetValue(allocationAllowed);
    }
    String nameStringWithoutGC(VM& vm)
    {
        if (m_nameMayBeNull) {
            ASSERT(!m_nameMayBeNull->isRope());
            bool allocationAllowed = false;
            return m_nameMayBeNull->tryGetValue(allocationAllowed);
        }
        return nameStringWithoutGCSlow(vm);
    }

    double length(VM& vm)
    {
        if (std::isnan(m_length))
            return lengthSlow(vm);
        return m_length;
    }

    inline static Structure* createStructure(VM&, JSGlobalObject*, JSValue);
    
    static constexpr ptrdiff_t offsetOfTargetFunction() { return OBJECT_OFFSETOF(JSBoundFunction, m_targetFunction); }
    static constexpr ptrdiff_t offsetOfBoundThis() { return OBJECT_OFFSETOF(JSBoundFunction, m_boundThis); }
    static constexpr ptrdiff_t offsetOfBoundArgs() { return OBJECT_OFFSETOF(JSBoundFunction, m_boundArgs); }
    static constexpr ptrdiff_t offsetOfBoundArgsLength() { return OBJECT_OFFSETOF(JSBoundFunction, m_boundArgsLength); }
    static constexpr ptrdiff_t offsetOfNameMayBeNull() { return OBJECT_OFFSETOF(JSBoundFunction, m_nameMayBeNull); }
    static constexpr ptrdiff_t offsetOfLength() { return OBJECT_OFFSETOF(JSBoundFunction, m_length); }
    static constexpr ptrdiff_t offsetOfCanConstruct() { return OBJECT_OFFSETOF(JSBoundFunction, m_canConstruct); }

    template<typename Functor>
    void forEachBoundArg(const Functor& func)
    {
        unsigned length = boundArgsLength();
        if (!length)
            return;
        if (length <= m_boundArgs.size()) {
            for (unsigned index = 0; index < length; ++index) {
                if (func(m_boundArgs[index].get()) == IterationStatus::Done)
                    return;
            }
            return;
        }
        for (unsigned index = 0; index < length; ++index) {
            if (func(jsCast<JSImmutableButterfly*>(m_boundArgs[0].get())->get(index)) == IterationStatus::Done)
                return;
        }
    }

    bool canConstruct()
    {
        if (m_canConstruct == TriState::Indeterminate)
            return canConstructSlow();
        return m_canConstruct == TriState::True;
    }

    static bool canSkipNameAndLengthMaterialization(JSGlobalObject*, Structure*);

    DECLARE_INFO;

private:
    JSBoundFunction(VM&, NativeExecutable*, JSGlobalObject*, Structure*, JSObject* targetFunction, JSValue boundThis, unsigned boundArgsLength, JSValue arg0, JSValue arg1, JSValue arg2, JSString* nameMayBeNull, double length);

    JSString* nameSlow(VM&);
    double lengthSlow(VM&);
    bool canConstructSlow();
    String nameStringWithoutGCSlow(VM&);

    DECLARE_DEFAULT_FINISH_CREATION;
    DECLARE_VISIT_CHILDREN;

    WriteBarrier<JSObject> m_targetFunction;
    WriteBarrier<Unknown> m_boundThis;
    std::array<WriteBarrier<Unknown>, maxEmbeddedArgs> m_boundArgs { };
    WriteBarrier<JSString> m_nameMayBeNull;
    double m_length { PNaN };
    unsigned m_boundArgsLength { 0 };
    TriState m_canConstruct { TriState::Indeterminate };
};

JSC_DECLARE_HOST_FUNCTION(boundFunctionCall);
JSC_DECLARE_HOST_FUNCTION(boundFunctionConstruct);
JSC_DECLARE_HOST_FUNCTION(boundThisNoArgsFunctionCall);

} // namespace JSC
