/*
 * Copyright (C) 2012-2022 Apple Inc. All Rights Reserved.
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

#include "UnlinkedGlobalCodeBlock.h"

namespace JSC {

class Decoder;
class CachedModuleCodeBlock;

class UnlinkedModuleProgramCodeBlock final : public UnlinkedGlobalCodeBlock {
public:
    typedef UnlinkedGlobalCodeBlock Base;
    static constexpr unsigned StructureFlags = Base::StructureFlags | StructureIsImmortal;

    template<typename CellType, SubspaceAccess mode>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        return vm.unlinkedModuleProgramCodeBlockSpace<mode>();
    }

    static UnlinkedModuleProgramCodeBlock* create(VM& vm, const ExecutableInfo& info, OptionSet<CodeGenerationMode> codeGenerationMode)
    {
        UnlinkedModuleProgramCodeBlock* instance = new (NotNull, allocateCell<UnlinkedModuleProgramCodeBlock>(vm)) UnlinkedModuleProgramCodeBlock(vm, vm.unlinkedModuleProgramCodeBlockStructure.get(), info, codeGenerationMode);
        instance->finishCreation(vm);
        return instance;
    }

    static void destroy(JSCell*);

    // This offset represents the constant register offset to the stored symbol table that represents the layout of the
    // module environment. This symbol table is created by the byte code generator since the module environment includes
    // the top-most lexical captured variables inside the module code. This means that, once the module environment is
    // allocated and instantiated from this symbol table, it is titely coupled with the specific unlinked module program
    // code block and the stored symbol table. So before executing the module code, we should not clear the unlinked module
    // program code block in the module executable. This requirement is met because the garbage collector only clears
    // unlinked code in (1) unmarked executables and (2) function executables.
    //
    // Since the function code may be executed repeatedly and the environment of each function execution is different,
    // the function code need to allocate and instantiate the environment in the prologue of the function code. On the
    // other hand, the module code is executed only once. So we can instantiate the module environment outside the module
    // code. At that time, we construct the module environment by using the symbol table that is held by the module executable.
    // The symbol table held by the executable is the cloned one from one in the unlinked code block. Instantiating the module
    // environment before executing and linking the module code is required to link the imported bindings between the modules.
    //
    // The unlinked module program code block only holds the pre-cloned symbol table in its constant register pool. It does
    // not hold the instantiated module environment. So while the module environment requires the specific unlinked module
    // program code block, the unlinked module code block can be used for the module environment instantiated from this
    // unlinked code block. There is 1:N relation between the unlinked module code block and the module environments. So the
    // unlinked module program code block can be cached.
    //
    // On the other hand, the linked code block for the module environment includes the resolved references to the imported
    // bindings. The imported binding references the other module environment, so the linked code block is titly coupled
    // with the specific set of the module environments. Thus, the linked code block should not be cached.
    int moduleEnvironmentSymbolTableConstantRegisterOffset() { return m_moduleEnvironmentSymbolTableConstantRegisterOffset; }
    void setModuleEnvironmentSymbolTableConstantRegisterOffset(int offset)
    {
        m_moduleEnvironmentSymbolTableConstantRegisterOffset = offset;
    }

    bool isAsync() const { return codeFeatures() & AwaitFeature; }

private:
    friend CachedModuleCodeBlock;

    UnlinkedModuleProgramCodeBlock(VM& vm, Structure* structure, const ExecutableInfo& info, OptionSet<CodeGenerationMode> codeGenerationMode)
        : Base(vm, structure, ModuleCode, info, codeGenerationMode)
    {
    }

    UnlinkedModuleProgramCodeBlock(Decoder&, const CachedModuleCodeBlock&);

    int m_moduleEnvironmentSymbolTableConstantRegisterOffset { 0 };

public:
    inline static Structure* createStructure(VM&, JSGlobalObject*, JSValue);

    DECLARE_INFO;
};

}
