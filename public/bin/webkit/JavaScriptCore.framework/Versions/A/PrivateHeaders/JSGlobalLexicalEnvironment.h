/*
 * Copyright (C) 2015-2022 Apple Inc. All Rights Reserved.
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

#include "JSSegmentedVariableObject.h"

namespace JSC {

class JSGlobalLexicalEnvironment final : public JSSegmentedVariableObject {
public:
    using Base = JSSegmentedVariableObject;

    static constexpr unsigned StructureFlags = Base::StructureFlags | OverridesGetOwnPropertySlot | OverridesPut;

    template<typename CellType, SubspaceAccess mode>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        return &vm.globalLexicalEnvironmentSpace();
    }

    static JSGlobalLexicalEnvironment* create(VM& vm, Structure* structure, JSScope* parentScope)
    {
        JSGlobalLexicalEnvironment* result =
            new (NotNull, allocateCell<JSGlobalLexicalEnvironment>(vm)) JSGlobalLexicalEnvironment(vm, structure, parentScope);
        result->finishCreation(vm);
        result->symbolTable()->setScopeType(SymbolTable::ScopeType::GlobalLexicalScope);
        return result;
    }

    static bool getOwnPropertySlot(JSObject*, JSGlobalObject*, PropertyName, PropertySlot&);
    static bool put(JSCell*, JSGlobalObject*, PropertyName, JSValue, PutPropertySlot&);

    static void destroy(JSCell*);
    static constexpr bool needsDestruction = true;

    bool isEmpty() const { return !symbolTable()->size(); }
    bool isConstVariable(UniquedStringImpl*);

    DECLARE_INFO;

    inline static Structure* createStructure(VM&, JSGlobalObject*);

private:
    JSGlobalLexicalEnvironment(VM& vm, Structure* structure, JSScope* scope)
        : Base(vm, structure, scope)
    {
    }
};

} // namespace JSC
