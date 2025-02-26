/*
 * Copyright (C) 2017-2024 Apple Inc. All rights reserved.
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

#include "MacroAssemblerCodeRef.h"
#include "MemoryMode.h"
#include "WasmCallee.h"
#include "WasmJS.h"
#include <wtf/CrossThreadCopier.h>
#include <wtf/FixedBitVector.h>
#include <wtf/FixedVector.h>
#include <wtf/Lock.h>
#include <wtf/RefPtr.h>
#include <wtf/SharedTask.h>
#include <wtf/ThreadSafeRefCounted.h>
#include <wtf/text/WTFString.h>

namespace JSC {

class VM;

namespace Wasm {

class EntryPlan;
struct ModuleInformation;
struct UnlinkedWasmToWasmCall;

class CalleeGroup final : public ThreadSafeRefCounted<CalleeGroup> {
public:
    typedef void CallbackType(Ref<CalleeGroup>&&, bool);
    using AsyncCompilationCallback = RefPtr<WTF::SharedTask<CallbackType>>;
    static Ref<CalleeGroup> createFromLLInt(VM&, MemoryMode, ModuleInformation&, RefPtr<LLIntCallees>);
    static Ref<CalleeGroup> createFromIPInt(VM&, MemoryMode, ModuleInformation&, RefPtr<IPIntCallees>);
    static Ref<CalleeGroup> createFromExisting(MemoryMode, const CalleeGroup&);

    void waitUntilFinished();
    void compileAsync(VM&, AsyncCompilationCallback&&);

    bool compilationFinished()
    {
        return m_compilationFinished.load();
    }
    bool runnable() { return compilationFinished() && !m_errorMessage; }

    // Note, we do this copy to ensure it's thread safe to have this
    // called from multiple threads simultaneously.
    String errorMessage()
    {
        ASSERT(!runnable());
        return crossThreadCopy(m_errorMessage);
    }

    unsigned functionImportCount() const { return m_wasmToWasmExitStubs.size(); }
    FunctionSpaceIndex toSpaceIndex(FunctionCodeIndex codeIndex) const
    {
        ASSERT(codeIndex < m_calleeCount);
        return FunctionSpaceIndex(codeIndex + functionImportCount());
    }
    FunctionCodeIndex toCodeIndex(FunctionSpaceIndex spaceIndex) const
    {
        ASSERT(functionImportCount() <= spaceIndex);
        ASSERT(spaceIndex < m_calleeCount + functionImportCount());
        return FunctionCodeIndex(spaceIndex - functionImportCount());
    }

    // These two callee getters are only valid once the callees have been populated.

    JSEntrypointCallee& jsEntrypointCalleeFromFunctionIndexSpace(FunctionSpaceIndex functionIndexSpace)
    {
        ASSERT(runnable());
        ASSERT(functionIndexSpace >= functionImportCount());
        unsigned calleeIndex = functionIndexSpace - functionImportCount();

        auto callee = m_jsEntrypointCallees.get(calleeIndex);
        RELEASE_ASSERT(callee);
        return *callee;
    }

    JITCallee* replacement(const AbstractLocker&, FunctionSpaceIndex functionIndexSpace) WTF_REQUIRES_LOCK(m_lock)
    {
        ASSERT(runnable());
        ASSERT(functionIndexSpace >= functionImportCount());
        unsigned calleeIndex = functionIndexSpace - functionImportCount();
        UNUSED_PARAM(calleeIndex);
#if ENABLE(WEBASSEMBLY_OMGJIT)
        if (!m_omgCallees.isEmpty() && m_omgCallees[calleeIndex])
            return m_omgCallees[calleeIndex].get();
#endif
#if ENABLE(WEBASSEMBLY_BBQJIT)
        if (!m_bbqCallees.isEmpty() && m_bbqCallees[calleeIndex].ptr())
            return m_bbqCallees[calleeIndex].ptr();
#endif
        return nullptr;
    }

    Callee& wasmEntrypointCalleeFromFunctionIndexSpace(const AbstractLocker& locker, FunctionSpaceIndex functionIndexSpace) WTF_REQUIRES_LOCK(m_lock)
    {

        if (auto* replacement = this->replacement(locker, functionIndexSpace))
            return *replacement;
        unsigned calleeIndex = functionIndexSpace - functionImportCount();
        if (Options::useWasmIPInt())
            return m_ipintCallees->at(calleeIndex).get();
        return m_llintCallees->at(calleeIndex).get();
    }


#if ENABLE(WEBASSEMBLY_BBQJIT)
    BBQCallee& wasmBBQCalleeFromFunctionIndexSpace(FunctionSpaceIndex functionIndexSpace) WTF_IGNORES_THREAD_SAFETY_ANALYSIS
    {
        // We do not look up without locking because this function is called from this BBQCallee itself.
        ASSERT(runnable());
        ASSERT(functionIndexSpace >= functionImportCount());
        unsigned calleeIndex = functionIndexSpace - functionImportCount();
        ASSERT(m_bbqCallees[calleeIndex].ptr());
        return *m_bbqCallees[calleeIndex].ptr();
    }

    BBQCallee* bbqCallee(const AbstractLocker&, FunctionCodeIndex functionIndex) WTF_REQUIRES_LOCK(m_lock)
    {
        if (m_bbqCallees.isEmpty())
            return nullptr;
        return m_bbqCallees[functionIndex].ptr();
    }

    void setBBQCallee(const AbstractLocker&, FunctionCodeIndex functionIndex, Ref<BBQCallee>&& callee) WTF_REQUIRES_LOCK(m_lock)
    {
        if (m_bbqCallees.isEmpty())
            m_bbqCallees = FixedVector<ThreadSafeWeakOrStrongPtr<BBQCallee>>(m_calleeCount);
        m_bbqCallees[functionIndex] = WTFMove(callee);
    }

    BBQCallee* tryGetBBQCalleeForLoopOSR(const AbstractLocker&, VM&, FunctionCodeIndex) WTF_REQUIRES_LOCK(m_lock);
    void releaseBBQCallee(const AbstractLocker&, FunctionCodeIndex) WTF_REQUIRES_LOCK(m_lock);
#endif

#if ENABLE(WEBASSEMBLY_OMGJIT)
    OMGCallee* omgCallee(const AbstractLocker&, FunctionCodeIndex functionIndex) WTF_REQUIRES_LOCK(m_lock)
    {
        if (m_omgCallees.isEmpty())
            return nullptr;
        return m_omgCallees[functionIndex].get();
    }

    void setOMGCallee(const AbstractLocker&, FunctionCodeIndex functionIndex, Ref<OMGCallee>&& callee) WTF_REQUIRES_LOCK(m_lock)
    {
        if (m_omgCallees.isEmpty())
            m_omgCallees = FixedVector<RefPtr<OMGCallee>>(m_calleeCount);
        m_omgCallees[functionIndex] = WTFMove(callee);
    }

    void recordOMGOSREntryCallee(const AbstractLocker&, FunctionCodeIndex functionIndex, OMGOSREntryCallee& callee) WTF_REQUIRES_LOCK(m_lock)
    {
        auto result = m_osrEntryCallees.add(functionIndex, callee);
        ASSERT_UNUSED(result, result.isNewEntry);
    }
#endif

    CodePtr<WasmEntryPtrTag>* entrypointLoadLocationFromFunctionIndexSpace(FunctionSpaceIndex functionIndexSpace)
    {
        RELEASE_ASSERT(functionIndexSpace >= functionImportCount());
        unsigned calleeIndex = functionIndexSpace - functionImportCount();
        return &m_wasmIndirectCallEntryPoints[calleeIndex];
    }

    // This is the callee used by LLInt/IPInt, not by the JS->Wasm entrypoint
    Wasm::Callee* wasmCalleeFromFunctionIndexSpace(FunctionSpaceIndex functionIndexSpace)
    {
        RELEASE_ASSERT(functionIndexSpace >= functionImportCount());
        unsigned calleeIndex = functionIndexSpace - functionImportCount();
        return m_wasmIndirectCallWasmCallees[calleeIndex].get();
    }

    CodePtr<WasmEntryPtrTag> wasmToWasmExitStub(FunctionSpaceIndex functionIndex)
    {
        return m_wasmToWasmExitStubs[functionIndex].code();
    }

    bool isSafeToRun(MemoryMode);

    MemoryMode mode() const { return m_mode; }

#if ENABLE(WEBASSEMBLY_OMGJIT) || ENABLE(WEBASSEMBLY_BBQJIT)
    void updateCallsitesToCallUs(const AbstractLocker&, CodeLocationLabel<WasmEntryPtrTag> entrypoint, FunctionCodeIndex functionIndex) WTF_REQUIRES_LOCK(m_lock);
    void reportCallees(const AbstractLocker&, JITCallee* caller, const FixedBitVector& callees) WTF_REQUIRES_LOCK(m_lock);
#endif

    // TriState::Indeterminate means weakly referenced.
    TriState calleeIsReferenced(const AbstractLocker&, Wasm::Callee*) const WTF_REQUIRES_LOCK(m_lock);

    ~CalleeGroup();
private:
    friend class Plan;
#if ENABLE(WEBASSEMBLY_BBQJIT)
    friend class BBQPlan;
#endif
#if ENABLE(WEBASSEMBLY_OMGJIT)
    friend class OMGPlan;
    friend class OSREntryPlan;
#endif

    CalleeGroup(VM&, MemoryMode, ModuleInformation&, RefPtr<LLIntCallees>);
    CalleeGroup(VM&, MemoryMode, ModuleInformation&, RefPtr<IPIntCallees>);
    CalleeGroup(MemoryMode, const CalleeGroup&);
    void setCompilationFinished();

    unsigned m_calleeCount;
    MemoryMode m_mode;
#if ENABLE(WEBASSEMBLY_OMGJIT)
    FixedVector<RefPtr<OMGCallee>> m_omgCallees WTF_GUARDED_BY_LOCK(m_lock);
#endif
#if ENABLE(WEBASSEMBLY_BBQJIT)
    FixedVector<ThreadSafeWeakOrStrongPtr<BBQCallee>> m_bbqCallees WTF_GUARDED_BY_LOCK(m_lock);
#endif
    RefPtr<IPIntCallees> m_ipintCallees WTF_GUARDED_BY_LOCK(m_lock);
    RefPtr<LLIntCallees> m_llintCallees WTF_GUARDED_BY_LOCK(m_lock);
    UncheckedKeyHashMap<uint32_t, RefPtr<JSEntrypointCallee>, DefaultHash<uint32_t>, WTF::UnsignedWithZeroKeyHashTraits<uint32_t>> m_jsEntrypointCallees;
#if ENABLE(WEBASSEMBLY_BBQJIT) || ENABLE(WEBASSEMBLY_OMGJIT)
    // FIXME: We should probably find some way to prune dead entries periodically.
    UncheckedKeyHashMap<uint32_t, ThreadSafeWeakPtr<OMGOSREntryCallee>, DefaultHash<uint32_t>, WTF::UnsignedWithZeroKeyHashTraits<uint32_t>> m_osrEntryCallees WTF_GUARDED_BY_LOCK(m_lock);
#endif

    // functionCodeIndex -> functionCodeIndex of internal functions that have direct JIT callsites to the lhs.
    // Note, this can grow over time since OMG inlining can add to the set of callers and we'll tranisition from
    // a sparse adjacency matrix to a bit vector based one if that's more space efficient.
    // FIXME: This should be a WTF class and we should use it in the JIT Plans.
    using SparseCallers = HashSet<uint32_t, DefaultHash<uint32_t>, WTF::UnsignedWithZeroKeyHashTraits<uint32_t>>;
    using DenseCallers = BitVector;
    FixedVector<std::variant<SparseCallers, DenseCallers>> m_callers WTF_GUARDED_BY_LOCK(m_lock);
    FixedVector<CodePtr<WasmEntryPtrTag>> m_wasmIndirectCallEntryPoints;
    FixedVector<RefPtr<Wasm::Callee>> m_wasmIndirectCallWasmCallees;
    FixedVector<MacroAssemblerCodeRef<WasmEntryPtrTag>> m_wasmToWasmExitStubs;
    RefPtr<EntryPlan> m_plan;
    std::atomic<bool> m_compilationFinished { false };
    String m_errorMessage;
public:
    Lock m_lock;
};

} } // namespace JSC::Wasm

#endif // ENABLE(WEBASSEMBLY)
