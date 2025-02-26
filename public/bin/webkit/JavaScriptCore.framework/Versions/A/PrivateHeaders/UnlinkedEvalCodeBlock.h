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
#include <wtf/FixedVector.h>

namespace JSC {

class CachedEvalCodeBlock;

class UnlinkedEvalCodeBlock final : public UnlinkedGlobalCodeBlock {
public:
    typedef UnlinkedGlobalCodeBlock Base;
    static constexpr unsigned StructureFlags = Base::StructureFlags | StructureIsImmortal;

    template<typename CellType, SubspaceAccess mode>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        return vm.unlinkedEvalCodeBlockSpace<mode>();
    }

    static UnlinkedEvalCodeBlock* create(VM& vm, const ExecutableInfo& info, OptionSet<CodeGenerationMode> codeGenerationMode)
    {
        UnlinkedEvalCodeBlock* instance = new (NotNull, allocateCell<UnlinkedEvalCodeBlock>(vm)) UnlinkedEvalCodeBlock(vm, vm.unlinkedEvalCodeBlockStructure.get(), info, codeGenerationMode);
        instance->finishCreation(vm);
        return instance;
    }

    static void destroy(JSCell*);

    const Identifier& variable(unsigned index) { return m_variables[index]; }
    unsigned numVariables() { return m_variables.size(); }
    void adoptVariables(Vector<Identifier, 0, UnsafeVectorOverflow>&& variables)
    {
        ASSERT(m_variables.isEmpty());
        m_variables = FixedVector<Identifier>(WTFMove(variables));
    }

    const Identifier& functionHoistingCandidate(unsigned index) { return m_functionHoistingCandidates[index]; }
    unsigned numFunctionHoistingCandidates() { return m_functionHoistingCandidates.size(); }
    void adoptFunctionHoistingCandidates(Vector<Identifier, 0, UnsafeVectorOverflow>&& functionHoistingCandidates)
    {
        ASSERT(m_functionHoistingCandidates.isEmpty());
        m_functionHoistingCandidates = FixedVector<Identifier>(WTFMove(functionHoistingCandidates));
    }
private:
    friend CachedEvalCodeBlock;

    UnlinkedEvalCodeBlock(VM& vm, Structure* structure, const ExecutableInfo& info, OptionSet<CodeGenerationMode> codeGenerationMode)
        : Base(vm, structure, EvalCode, info, codeGenerationMode)
    {
    }

    UnlinkedEvalCodeBlock(Decoder&, const CachedEvalCodeBlock&);

    FixedVector<Identifier> m_variables;
    FixedVector<Identifier> m_functionHoistingCandidates;

public:
    inline static Structure* createStructure(VM&, JSGlobalObject*, JSValue);

    DECLARE_INFO;
};

}
