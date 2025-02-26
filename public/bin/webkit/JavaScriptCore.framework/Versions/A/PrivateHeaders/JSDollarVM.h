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

#include "JSObject.h"
#include "Options.h"

namespace JSC {

struct DollarVMAssertScope {
    DollarVMAssertScope() { RELEASE_ASSERT(Options::useDollarVM()); }
    ~DollarVMAssertScope() { RELEASE_ASSERT(Options::useDollarVM()); }
};

class JSDollarVM final : public JSNonFinalObject {
public:
    typedef JSNonFinalObject Base;
    static constexpr unsigned StructureFlags = Base::StructureFlags | OverridesGetOwnPropertyNames;

    template<typename CellType, SubspaceAccess>
    static CompleteSubspace* subspaceFor(VM& vm)
    {
        return &vm.cellSpace();
    }
    
    DECLARE_EXPORT_INFO;
    
    static Structure* createStructure(VM& vm, JSGlobalObject* globalObject, JSValue prototype)
    {
        DollarVMAssertScope assertScope;
        return Structure::create(vm, globalObject, prototype, TypeInfo(ObjectType, StructureFlags), info());
    }

    static JSDollarVM* create(VM& vm, Structure* structure)
    {
        DollarVMAssertScope assertScope;
        JSDollarVM* instance = new (NotNull, allocateCell<JSDollarVM>(vm)) JSDollarVM(vm, structure);
        instance->finishCreation(vm);
        return instance;
    }

    Structure* objectDoingSideEffectPutWithoutCorrectSlotStatusStructure() { return m_objectDoingSideEffectPutWithoutCorrectSlotStatusStructureID.get(); }
    
private:
    JSDollarVM(VM& vm, Structure* structure)
        : Base(vm, structure)
    {
        DollarVMAssertScope assertScope;
    }

    void finishCreation(VM&);
    void addFunction(VM&, JSGlobalObject*, ASCIILiteral name, NativeFunction, unsigned arguments);
    void addConstructibleFunction(VM&, JSGlobalObject*, ASCIILiteral name, NativeFunction, unsigned arguments);

    static void getOwnPropertyNames(JSObject*, JSGlobalObject*, PropertyNameArray&, DontEnumPropertiesMode);

    DECLARE_VISIT_CHILDREN;

    WriteBarrierStructureID m_objectDoingSideEffectPutWithoutCorrectSlotStatusStructureID;
};

} // namespace JSC
