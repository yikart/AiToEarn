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
#include "UnlinkedEvalCodeBlock.h"

namespace JSC {

class EvalExecutable : public GlobalExecutable {
    friend class LLIntOffsetsExtractor;
public:
    using Base = GlobalExecutable;
    static constexpr unsigned StructureFlags = Base::StructureFlags | StructureIsImmortal;

    static void destroy(JSCell*);
    
    EvalCodeBlock* codeBlock() const
    {
        return std::bit_cast<EvalCodeBlock*>(Base::codeBlock());
    }

    UnlinkedEvalCodeBlock* unlinkedCodeBlock() const
    {
        return std::bit_cast<UnlinkedEvalCodeBlock*>(Base::unlinkedCodeBlock());
    }

    Ref<JSC::JITCode> generatedJITCode()
    {
        return generatedJITCodeForCall();
    }

    inline static Structure* createStructure(VM&, JSGlobalObject*, JSValue);

    template<typename CellType, SubspaceAccess mode>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        return vm.evalExecutableSpace<mode>();
    }

    DECLARE_INFO;

    unsigned numVariables() { return unlinkedCodeBlock()->numVariables(); }
    unsigned numFunctionHoistingCandidates() { return unlinkedCodeBlock()->numFunctionHoistingCandidates(); }
    unsigned numTopLevelFunctionDecls() { return unlinkedCodeBlock()->numberOfFunctionDecls(); }
    bool allowDirectEvalCache() const { return unlinkedCodeBlock()->allowDirectEvalCache(); }
    NeedsClassFieldInitializer needsClassFieldInitializer() const { return static_cast<NeedsClassFieldInitializer>(m_needsClassFieldInitializer); }
    PrivateBrandRequirement privateBrandRequirement() const { return static_cast<PrivateBrandRequirement>(m_privateBrandRequirement); }
    TemplateObjectMap& ensureTemplateObjectMap(VM&);

protected:
    friend class ExecutableBase;
    friend class ScriptExecutable;

    using Base::finishCreation;
    EvalExecutable(JSGlobalObject*, const SourceCode&, LexicallyScopedFeatures, DerivedContextType, bool isArrowFunctionContext, bool isInsideOrdinaryFunction, EvalContextType, NeedsClassFieldInitializer, PrivateBrandRequirement);

    DECLARE_VISIT_CHILDREN;

    unsigned m_needsClassFieldInitializer : 1;
    unsigned m_privateBrandRequirement : 1;

    std::unique_ptr<TemplateObjectMap> m_templateObjectMap;
};

} // namespace JSC
