/*
 * Copyright (C) 2003-2022 Apple Inc. All rights reserved.
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

#include "BridgeJSC.h"
#include <JavaScriptCore/InternalFunction.h>
#include <JavaScriptCore/JSGlobalObject.h>

namespace JSC {

class WEBCORE_EXPORT RuntimeMethod : public InternalFunction {
public:
    using Base = InternalFunction;
    static constexpr unsigned StructureFlags = Base::StructureFlags | OverridesGetOwnPropertySlot | OverridesGetCallData;

    template<typename CellType, JSC::SubspaceAccess>
    static GCClient::IsoSubspace* subspaceFor(JSC::VM& vm)
    {
        static_assert(sizeof(CellType) == sizeof(RuntimeMethod), "RuntimeMethod subclasses that add fields need to override subspaceFor<>()");
        static_assert(CellType::destroy == JSC::JSCell::destroy);
        return subspaceForImpl(vm);
    }
    
    static RuntimeMethod* create(JSGlobalObject*, JSGlobalObject* globalObject, Structure* structure, const String& name, Bindings::Method* method)
    {
        VM& vm = globalObject->vm();
        RuntimeMethod* runtimeMethod = new (NotNull, allocateCell<RuntimeMethod>(vm)) RuntimeMethod(vm, structure, method);
        runtimeMethod->finishCreation(vm, name);
        return runtimeMethod;
    }

    Bindings::Method* method() const { return m_method; }

    DECLARE_INFO;

    static FunctionPrototype* createPrototype(VM&, JSGlobalObject& globalObject)
    {
        return globalObject.functionPrototype();
    }

    static Structure* createStructure(VM& vm, JSGlobalObject* globalObject, JSValue prototype)
    {
        return Structure::create(vm, globalObject, prototype, TypeInfo(InternalFunctionType, StructureFlags), info());
    }

protected:
    RuntimeMethod(VM&, Structure*, Bindings::Method*);
    void finishCreation(VM&, const String&);

    static bool getOwnPropertySlot(JSObject*, JSGlobalObject*, PropertyName, PropertySlot&);

private:
    static GCClient::IsoSubspace* subspaceForImpl(VM&);

    Bindings::Method* m_method;
};

} // namespace JSC
