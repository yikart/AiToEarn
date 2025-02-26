/*
 * Copyright (C) 2013-2021 Apple Inc. All rights reserved.
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

#if ENABLE(FTL_JIT)

#include "B3Procedure.h"
#include "DFGCommon.h"
#include "DFGGraph.h"
#include "DFGJumpReplacement.h"
#include "FTLAbbreviatedTypes.h"
#include "FTLJITCode.h"
#include "FTLJITFinalizer.h"
#include <wtf/Box.h>
#include <wtf/Noncopyable.h>

namespace JSC {

namespace B3 {
class PatchpointValue;
namespace Air {
class StackSlot;
} // namespace Air
} // namespace B3

namespace FTL {

class PatchpointExceptionHandle;

inline bool verboseCompilationEnabled()
{
    return DFG::verboseCompilationEnabled(JITCompilationMode::FTL);
}

inline bool shouldDumpDisassembly()
{
    return DFG::shouldDumpDisassembly(JITCompilationMode::FTL);
}

class State {
    WTF_MAKE_NONCOPYABLE(State);
    
public:
    State(DFG::Graph& graph);
    ~State();

    VM& vm() { return graph.m_vm; }

    void dumpDisassembly(PrintStream&, LinkBuffer&, const ScopedLambda<void(DFG::Node*)>& perDFGNodeCallback = scopedLambda<void(DFG::Node*)>([] (DFG::Node*) { }));

    StructureStubInfo* addStructureStubInfo();
    OptimizingCallLinkInfo* addCallLinkInfo(CodeOrigin);

    // None of these things is owned by State. It is the responsibility of
    // FTL phases to properly manage the lifecycle of the module and function.
    DFG::Graph& graph;
    std::unique_ptr<B3::Procedure> proc;
    bool allocationFailed { false }; // Throw out the compilation once B3 returns.
    RefPtr<FTL::JITCode> jitCode;
    JITFinalizer* finalizer;
    std::unique_ptr<LinkBuffer> b3CodeLinkBuffer;
    // Top-level exception handler. Jump here if you know that you have to genericUnwind() and there
    // are no applicable catch blocks anywhere in the Graph.
    RefPtr<PatchpointExceptionHandle> defaultExceptionHandle;
    Box<CCallHelpers::Label> exceptionHandler { Box<CCallHelpers::Label>::create() };
    B3::Air::StackSlot* capturedValue { nullptr };
    Vector<DFG::JumpReplacement> jumpReplacements;
};

} } // namespace JSC::FTL

#endif // ENABLE(FTL_JIT)
