/*
 * Copyright (C) 2014-2023 Apple Inc. All rights reserved.
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

#include "JSGlobalObject.h"
#include "JSObject.h"
#include "JSScope.h"

namespace JSC {

class JSGlobalObject;
class LLIntOffsetsExtractor;


class JSCallee : public JSNonFinalObject {
    friend class JIT;
#if ENABLE(DFG_JIT)
    friend class DFG::SpeculativeJIT;
    friend class DFG::JITCompiler;
#endif
    friend class VM;

public:
    using Base = JSNonFinalObject;
    static constexpr unsigned StructureFlags = Base::StructureFlags | ImplementsHasInstance | ImplementsDefaultHasInstance;

    template<typename CellType, SubspaceAccess>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        return &vm.calleeSpace();
    }

    static JSCallee* create(VM& vm, JSGlobalObject* globalObject, JSScope* scope)
    {
        JSCallee* callee = new (NotNull, allocateCell<JSCallee>(vm)) JSCallee(vm, scope, globalObject->calleeStructure());
        callee->finishCreation(vm);
        return callee;
    }
    
    JSScope* scope()
    {
        return m_scope.get();
    }

    // This method may be called for host functions, in which case it
    // will return an arbitrary value. This should only be used for
    // optimized paths in which the return value does not matter for
    // host functions, and checking whether the function is a host
    // function is deemed too expensive.
    JSScope* scopeUnchecked()
    {
        return m_scope.get();
    }

    void setScope(VM& vm, JSScope* scope)
    {
        m_scope.set(vm, this, scope);
    }

    DECLARE_EXPORT_INFO;

    inline static Structure* createStructure(VM&, JSGlobalObject*, JSValue);

    static constexpr ptrdiff_t offsetOfScopeChain()
    {
        return OBJECT_OFFSETOF(JSCallee, m_scope);
    }

protected:
    JSCallee(VM&, JSGlobalObject*, Structure*);
    JSCallee(VM&, JSScope*, Structure*);

    DECLARE_DEFAULT_FINISH_CREATION;
    DECLARE_VISIT_CHILDREN;

private:
    friend class LLIntOffsetsExtractor;

    WriteBarrier<JSScope> m_scope;
};

} // namespace JSC
