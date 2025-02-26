/*
 * Copyright (C) 2013-2018 Apple Inc. All rights reserved.
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

#include "CCallHelpers.h"
#include "FTLSlowPathCallKey.h"
#include "FTLState.h"

namespace JSC { namespace FTL {

class SlowPathCall {
public:
    SlowPathCall() { }
    
    SlowPathCall(MacroAssembler::Call call, const SlowPathCallKey& key)
        : m_call(call)
        , m_key(key)
    {
    }
    
    MacroAssembler::Call call() const { return m_call; }
    SlowPathCallKey key() const { return m_key; }
    
private:
    MacroAssembler::Call m_call;
    SlowPathCallKey m_key;
};

// This will be an RAII thingy that will set up the necessary stack sizes and offsets and such.
class SlowPathCallContext {
public:
    SlowPathCallContext(ScalarRegisterSet usedRegisters, CCallHelpers&, unsigned numArgs, GPRReg returnRegister, GPRReg indirectCallTargetRegister);
    ~SlowPathCallContext();

    // NOTE: The call that this returns is already going to be linked by the JIT using addLinkTask(),
    // so there is no need for you to link it yourself.
    SlowPathCall makeCall(VM&, CodePtr<CFunctionPtrTag> callTarget);
    SlowPathCall makeCall(VM&, CCallHelpers::Address);

private:
    SlowPathCallKey keyWithTarget(CodePtr<CFunctionPtrTag> callTarget) const;
    SlowPathCallKey keyWithTarget(CCallHelpers::Address) const;
    
    ScalarRegisterSet m_argumentRegisters;
    ScalarRegisterSet m_callingConventionRegisters;
    CCallHelpers& m_jit;
    unsigned m_numArgs;
    GPRReg m_returnRegister;
    size_t m_offsetToSavingArea;
    size_t m_stackBytesNeeded;
    ScalarRegisterSet m_thunkSaveSet;
    size_t m_offset;
};

template<typename... ArgumentTypes>
SlowPathCall callOperation(
    VM& vm, const ScalarRegisterSet& usedRegisters, CCallHelpers& jit, CCallHelpers::JumpList* exceptionTarget,
    CodePtr<CFunctionPtrTag> function, GPRReg resultGPR, ArgumentTypes... arguments)
{
    SlowPathCall call;
    {
        SlowPathCallContext context(usedRegisters, jit, sizeof...(ArgumentTypes) + 1, resultGPR, InvalidGPRReg);
        jit.setupArguments<void(ArgumentTypes...)>(arguments...);
        call = context.makeCall(vm, function);
    }
    if (exceptionTarget)
        exceptionTarget->append(jit.emitExceptionCheck(vm));
    return call;
}

template<typename... ArgumentTypes>
SlowPathCall callOperation(
    VM& vm, const RegisterSetBuilder& usedRegisters, CCallHelpers& jit, CCallHelpers::JumpList* exceptionTarget,
    CodePtr<CFunctionPtrTag> function, GPRReg resultGPR, ArgumentTypes... arguments)
{
    auto regs = usedRegisters.buildScalarRegisterSet();
    return callOperation(vm, regs, jit, exceptionTarget, function, resultGPR, arguments...);
}

template<typename RS, typename... ArgumentTypes>
SlowPathCall callOperation(
    VM& vm, const RS& usedRegisters, CCallHelpers& jit, CallSiteIndex callSiteIndex,
    CCallHelpers::JumpList* exceptionTarget, CodePtr<CFunctionPtrTag> function, GPRReg resultGPR,
    ArgumentTypes... arguments)
{
    if (callSiteIndex) {
        jit.store32(
            CCallHelpers::TrustedImm32(callSiteIndex.bits()),
            CCallHelpers::tagFor(CallFrameSlot::argumentCountIncludingThis));
    }
    return callOperation(vm, usedRegisters, jit, exceptionTarget, function, resultGPR, arguments...);
}

CallSiteIndex callSiteIndexForCodeOrigin(State&, CodeOrigin);

template<typename RS, typename... ArgumentTypes>
SlowPathCall callOperation(
    State& state, const RS& usedRegisters, CCallHelpers& jit, CodeOrigin codeOrigin,
    CCallHelpers::JumpList* exceptionTarget, CodePtr<CFunctionPtrTag> function, GPRReg result, ArgumentTypes... arguments)
{
    return callOperation(
        state.vm(), usedRegisters, jit, callSiteIndexForCodeOrigin(state, codeOrigin), exceptionTarget, function,
        result, arguments...);
}

template<typename... ArgumentTypes>
SlowPathCall callOperation(
    VM& vm, const ScalarRegisterSet& usedRegisters, CCallHelpers& jit, CCallHelpers::JumpList* exceptionTarget,
    CCallHelpers::Address function, GPRReg resultGPR, ArgumentTypes... arguments)
{
    SlowPathCall call;
    {
        SlowPathCallContext context(usedRegisters, jit, sizeof...(ArgumentTypes) + 1, resultGPR, GPRInfo::nonArgGPR0);
        jit.setupArgumentsForIndirectCall<void(ArgumentTypes...)>(function, arguments...);
        call = context.makeCall(vm, CCallHelpers::Address(GPRInfo::nonArgGPR0, function.offset));
    }
    if (exceptionTarget)
        exceptionTarget->append(jit.emitExceptionCheck(vm));
    return call;
}

template<typename... ArgumentTypes>
SlowPathCall callOperation(
    VM& vm, const RegisterSetBuilder& usedRegisters, CCallHelpers& jit, CCallHelpers::JumpList* exceptionTarget,
    CCallHelpers::Address function, GPRReg resultGPR, ArgumentTypes... arguments)
{
    auto regs = usedRegisters.buildScalarRegisterSet();
    return callOperation(vm, regs, jit, exceptionTarget, function, resultGPR, arguments...);
}

template<typename RS, typename... ArgumentTypes>
SlowPathCall callOperation(
    VM& vm, const RS& usedRegisters, CCallHelpers& jit, CallSiteIndex callSiteIndex,
    CCallHelpers::JumpList* exceptionTarget, CCallHelpers::Address function, GPRReg resultGPR,
    ArgumentTypes... arguments)
{
    if (callSiteIndex) {
        jit.store32(
            CCallHelpers::TrustedImm32(callSiteIndex.bits()),
            CCallHelpers::tagFor(CallFrameSlot::argumentCountIncludingThis));
    }
    return callOperation(vm, usedRegisters, jit, exceptionTarget, function, resultGPR, arguments...);
}

CallSiteIndex callSiteIndexForCodeOrigin(State&, CodeOrigin);

template<typename RS, typename... ArgumentTypes>
SlowPathCall callOperation(
    State& state, const RS& usedRegisters, CCallHelpers& jit, CodeOrigin codeOrigin,
    CCallHelpers::JumpList* exceptionTarget, CCallHelpers::Address function, GPRReg result, ArgumentTypes... arguments)
{
    return callOperation(
        state.vm(), usedRegisters, jit, callSiteIndexForCodeOrigin(state, codeOrigin), exceptionTarget, function,
        result, arguments...);
}

} } // namespace JSC::FTL

#endif // ENABLE(FTL_JIT)
