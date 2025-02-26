/*
 * Copyright (C) 2015-2021 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "JSLexicalEnvironment.h"

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

class AbstractModuleRecord;
class Register;

class JSModuleEnvironment final : public JSLexicalEnvironment {
    friend class JIT;
    friend class LLIntOffsetsExtractor;
public:
    using Base = JSLexicalEnvironment;
    static constexpr unsigned StructureFlags = Base::StructureFlags | OverridesGetOwnPropertySlot | OverridesGetOwnSpecialPropertyNames | OverridesPut;

    static JSModuleEnvironment* create(VM& vm, JSGlobalObject* globalObject, JSScope* currentScope, SymbolTable* symbolTable, JSValue initialValue, AbstractModuleRecord* moduleRecord)
    {
        Structure* structure = globalObject->moduleEnvironmentStructure();
        return create(vm, structure, currentScope, symbolTable, initialValue, moduleRecord);
    }

    DECLARE_INFO;

    inline static Structure* createStructure(VM&, JSGlobalObject*);

    static size_t offsetOfModuleRecord(SymbolTable* symbolTable)
    {
        size_t offset = Base::allocationSize(symbolTable);
        ASSERT(WTF::roundUpToMultipleOf<sizeof(WriteBarrier<AbstractModuleRecord>)>(offset) == offset);
        return offset;
    }

    static size_t allocationSize(SymbolTable* symbolTable)
    {
        return offsetOfModuleRecord(symbolTable) + sizeof(WriteBarrier<AbstractModuleRecord>);
    }

    AbstractModuleRecord* moduleRecord()
    {
        return moduleRecordSlot().get();
    }

    static bool getOwnPropertySlot(JSObject*, JSGlobalObject*, PropertyName, PropertySlot&);
    static void getOwnSpecialPropertyNames(JSObject*, JSGlobalObject*, PropertyNameArray&, DontEnumPropertiesMode);
    static bool put(JSCell*, JSGlobalObject*, PropertyName, JSValue, PutPropertySlot&);
    static bool deleteProperty(JSCell*, JSGlobalObject*, PropertyName, DeletePropertySlot&);

private:
    JSModuleEnvironment(VM&, Structure*, JSScope*, SymbolTable*, JSValue initialValue, AbstractModuleRecord*);

    static JSModuleEnvironment* create(VM&, Structure*, JSScope*, SymbolTable*, JSValue initialValue, AbstractModuleRecord*);

    DECLARE_DEFAULT_FINISH_CREATION;

    WriteBarrierBase<AbstractModuleRecord>& moduleRecordSlot()
    {
        return *std::bit_cast<WriteBarrierBase<AbstractModuleRecord>*>(std::bit_cast<char*>(this) + offsetOfModuleRecord(symbolTable()));
    }

    DECLARE_VISIT_CHILDREN;
};

inline JSModuleEnvironment::JSModuleEnvironment(VM& vm, Structure* structure, JSScope* currentScope, SymbolTable* symbolTable, JSValue initialValue, AbstractModuleRecord* moduleRecord)
    : Base(vm, structure, currentScope, symbolTable, initialValue)
{
    this->moduleRecordSlot().setWithoutWriteBarrier(moduleRecord);
}

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
