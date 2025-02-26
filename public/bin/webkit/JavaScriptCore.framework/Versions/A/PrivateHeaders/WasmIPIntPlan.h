/*
 * Copyright (C) 2023 Apple Inc. All rights reserved.
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

#if ENABLE(WEBASSEMBLY)

#include "WasmCallee.h"
#include "WasmEntryPlan.h"
#include "WasmIPIntGenerator.h"
#include "WasmLLIntPlan.h"

namespace JSC {

namespace Wasm {

class IPIntCallee;

using JSEntrypointCalleeMap = UncheckedKeyHashMap<uint32_t, RefPtr<JSEntrypointCallee>, DefaultHash<uint32_t>, WTF::UnsignedWithZeroKeyHashTraits<uint32_t>>;

using TailCallGraph = UncheckedKeyHashMap<uint32_t, HashSet<uint32_t, IntHash<uint32_t>, WTF::UnsignedWithZeroKeyHashTraits<uint32_t>>, IntHash<uint32_t>, WTF::UnsignedWithZeroKeyHashTraits<uint32_t>>;


class IPIntPlan final : public EntryPlan {
    using Base = EntryPlan;

public:
    JS_EXPORT_PRIVATE IPIntPlan(VM&, Vector<uint8_t>&&, CompilerMode, CompletionTask&&);
    IPIntPlan(VM&, Ref<ModuleInformation>, const Ref<IPIntCallee>*, CompletionTask&&);
    IPIntPlan(VM&, Ref<ModuleInformation>, CompilerMode, CompletionTask&&); // For StreamingCompiler.

    Vector<Ref<IPIntCallee>>&& takeCallees()
    {
        RELEASE_ASSERT(!failed() && !hasWork());
        return WTFMove(m_calleesVector);
    }

    JSEntrypointCalleeMap&& takeJSCallees()
    {
        RELEASE_ASSERT(!failed() && !hasWork());
        return WTFMove(m_jsEntrypointCallees);
    }

    bool hasWork() const final
    {
        // We'll use "Compiled" here to signify that IPInt has finished parsing and
        // validating, and is ready to execute
        return m_state < State::Compiled;
    }

    void work(CompilationEffort) final;

    bool didReceiveFunctionData(FunctionCodeIndex, const FunctionData&) final;

    void compileFunction(FunctionCodeIndex functionIndex) final;

    void completeInStreaming();
    void didCompileFunctionInStreaming();
    void didFailInStreaming(String&&);

private:
    bool prepareImpl() final;
    void didCompleteCompilation() WTF_REQUIRES_LOCK(m_lock) final;

    void addTailCallEdge(uint32_t, uint32_t);
    void computeTransitiveTailCalls() const;

    bool ensureEntrypoint(IPIntCallee&, FunctionCodeIndex functionIndex);

    Vector<std::unique_ptr<FunctionIPIntMetadataGenerator>> m_wasmInternalFunctions;
    const Ref<IPIntCallee>* m_callees { nullptr };
    Vector<Ref<IPIntCallee>> m_calleesVector;
    Vector<RefPtr<JSEntrypointCallee>> m_entrypoints;
    JSEntrypointCalleeMap m_jsEntrypointCallees;
    TailCallGraph m_tailCallGraph;
};

} } // namespace JSC::Wasm

#endif // ENABLE(WEBASSEMBLY)
