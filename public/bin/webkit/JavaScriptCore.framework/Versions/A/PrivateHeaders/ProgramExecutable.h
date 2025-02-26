/*
 * Copyright (C) 2009-2022 Apple Inc. All rights reserved.
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

#include "GlobalExecutable.h"

namespace JSC {

class UnlinkedProgramCodeBlock;

class ProgramExecutable final : public GlobalExecutable {
    friend class LLIntOffsetsExtractor;
public:
    using Base = GlobalExecutable;
    static constexpr unsigned StructureFlags = Base::StructureFlags | StructureIsImmortal;

    template<typename CellType, SubspaceAccess>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        return &vm.programExecutableSpace();
    }

    static ProgramExecutable* create(JSGlobalObject* globalObject, const SourceCode& source)
    {
        VM& vm = getVM(globalObject);
        ProgramExecutable* executable = new (NotNull, allocateCell<ProgramExecutable>(vm)) ProgramExecutable(globalObject, source);
        executable->finishCreation(vm);
        return executable;
    }

    JSObject* initializeGlobalProperties(VM&, JSGlobalObject*, JSScope*);

    static void destroy(JSCell*);

    ProgramCodeBlock* codeBlock() const
    {
        return std::bit_cast<ProgramCodeBlock*>(Base::codeBlock());
    }

    UnlinkedProgramCodeBlock* unlinkedCodeBlock() const
    {
        return std::bit_cast<UnlinkedProgramCodeBlock*>(Base::unlinkedCodeBlock());
    }

    Ref<JSC::JITCode> generatedJITCode()
    {
        return generatedJITCodeForCall();
    }
        
    inline static Structure* createStructure(VM&, JSGlobalObject*, JSValue);
        
    DECLARE_INFO;

    TemplateObjectMap& ensureTemplateObjectMap(VM&);

private:
    friend class ExecutableBase;
    friend class ScriptExecutable;

    ProgramExecutable(JSGlobalObject*, const SourceCode&);

    DECLARE_VISIT_CHILDREN;

    std::unique_ptr<TemplateObjectMap> m_templateObjectMap;
};

} // namespace JSC
