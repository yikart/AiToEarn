/*
 * Copyright (C) 2018-2023 Apple Inc. All rights reserved.
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

#if ENABLE(ASSEMBLER) && CPU(ARM64E)

#include "DisallowMacroScratchRegisterUsage.h"
#include <wtf/MathExtras.h>

// We need to include this before MacroAssemblerARM64.h because MacroAssemblerARM64
// will be defined in terms of ARM64EAssembler for ARM64E.
#include "ARM64EAssembler.h"
#include "JITOperationValidation.h"
#include "JSCConfig.h"
#include "JSCPtrTag.h"
#include "MacroAssemblerARM64.h"
#include <wtf/TZoneMalloc.h>

#if OS(DARWIN)
#include <mach/vm_param.h>
#endif

namespace JSC {

using Assembler = TARGET_ASSEMBLER;

class MacroAssemblerARM64E : public MacroAssemblerARM64 {
    WTF_MAKE_TZONE_ALLOCATED(MacroAssemblerARM64E);
public:
    static constexpr unsigned numberOfPointerBits = sizeof(void*) * CHAR_BIT;
    static constexpr unsigned maxNumberOfAllowedPACBits = numberOfPointerBits - OS_CONSTANT(EFFECTIVE_ADDRESS_WIDTH);
    static constexpr uintptr_t nonPACBitsMask = (1ull << (numberOfPointerBits - maxNumberOfAllowedPACBits)) - 1;

    ALWAYS_INLINE void tagReturnAddress()
    {
        tagPtr(ARM64Registers::sp, ARM64Registers::lr);
    }

    ALWAYS_INLINE void untagReturnAddress(RegisterID scratch = InvalidGPR)
    {
        untagPtr(ARM64Registers::sp, ARM64Registers::lr);
        validateUntaggedPtr(ARM64Registers::lr, scratch);
    }

    ALWAYS_INLINE void tagPtr(PtrTag tag, RegisterID target)
    {
        if (!tag) {
            m_assembler.pacizb(target);
            return;
        }

        RELEASE_ASSERT(Options::allowNonSPTagging());
        auto tagGPR = getCachedDataTempRegisterIDAndInvalidate();
        move(TrustedImm64(tag), tagGPR);
        m_assembler.pacib(target, tagGPR);
    }

    ALWAYS_INLINE void tagPtr(RegisterID tag, RegisterID target)
    {
        if (target == ARM64Registers::lr && tag == ARM64Registers::sp) {
            m_assembler.pacibsp();
            return;
        }
        RELEASE_ASSERT(Options::allowNonSPTagging());
        m_assembler.pacib(target, tag);
    }

    ALWAYS_INLINE void untagPtr(PtrTag tag, RegisterID target)
    {
        if (!tag) {
            m_assembler.autizb(target);
            return;
        }

        auto tagGPR = getCachedDataTempRegisterIDAndInvalidate();
        move(TrustedImm64(tag), tagGPR);
        m_assembler.autib(target, tagGPR);
    }

    ALWAYS_INLINE void validateUntaggedPtr(RegisterID target, RegisterID scratch = InvalidGPR)
    {
        if (g_jscConfig.canUseFPAC)
            return;

        if (scratch == InvalidGPR)
            scratch = getCachedDataTempRegisterIDAndInvalidate();

        DisallowMacroScratchRegisterUsage disallowScope(*this);
        ASSERT(target != scratch);
        rshift64(target, TrustedImm32(8), scratch);
        and64(TrustedImm64(0xff000000000000), scratch, scratch);
        or64(target, scratch, scratch);
        load8(Address(scratch), scratch);
    }

    ALWAYS_INLINE void untagPtr(RegisterID tag, RegisterID target)
    {
        m_assembler.autib(target, tag);
    }

    ALWAYS_INLINE void removePtrTag(RegisterID target)
    {
        m_assembler.xpaci(target);
    }

    ALWAYS_INLINE void tagArrayPtr(RegisterID length, RegisterID target)
    {
        m_assembler.pacdb(target, length);
    }

    ALWAYS_INLINE void untagArrayPtr(RegisterID length, RegisterID target, bool validateAuth, RegisterID scratch)
    {
        validateAuth = validateAuth && !g_jscConfig.canUseFPAC;
        if (validateAuth) {
            ASSERT(scratch != InvalidGPRReg);
            move(target, scratch);
        }

        m_assembler.autdb(target, length);

        if (validateAuth) {
            ASSERT(target != ARM64Registers::sp);
            ASSERT(scratch != ARM64Registers::sp);
            removeArrayPtrTag(scratch);
            auto isValidPtr = branch64(Equal, scratch, target);
            breakpoint(0xc473);
            isValidPtr.link(this);
        }
    }

    ALWAYS_INLINE void untagArrayPtrLength64(Address length, RegisterID target, bool validateAuth)
    {
        validateAuth = validateAuth && !g_jscConfig.canUseFPAC;
        auto lengthGPR = getCachedDataTempRegisterIDAndInvalidate();
        load64(length, lengthGPR);
        auto scratch = validateAuth ? getCachedMemoryTempRegisterIDAndInvalidate() : InvalidGPRReg; 
        untagArrayPtr(lengthGPR, target, validateAuth, scratch);
    }

    ALWAYS_INLINE void removeArrayPtrTag(RegisterID target)
    {
        // If we couldn't fit this into a single instruction, we'd be better
        // off emitting two shifts to mask off the top bits.
        ASSERT(LogicalImmediate::create64(nonPACBitsMask).isValid());
        and64(TrustedImmPtr(nonPACBitsMask), target);
    }

    static constexpr RegisterID InvalidGPR  = static_cast<RegisterID>(-1);

    enum class CallSignatureType {
        JITCall,
        NativeCall,
    };

    enum class JumpSignatureType {
        JITJump,
        NativeJump,
    };

    template<CallSignatureType type>
    ALWAYS_INLINE Call callTrustedPtr(RegisterID tagGPR = InvalidGPR)
    {
        UNUSED_PARAM(type);
        ASSERT(tagGPR != dataTempRegister);
        AssemblerLabel pointerLabel = m_assembler.label();
        moveWithFixedWidth(TrustedImmPtr(nullptr), getCachedDataTempRegisterIDAndInvalidate());
        invalidateAllTempRegisters();
#if ENABLE(JIT_CAGE)
        if (Options::useJITCage()) {
            JSC_JIT_CAGED_CALL(type, dataTempRegister, tagGPR);
        } else
#endif
            m_assembler.blrab(dataTempRegister, tagGPR);
        AssemblerLabel callLabel = m_assembler.label();
        ASSERT_UNUSED(pointerLabel, ARM64Assembler::getDifferenceBetweenLabels(callLabel, pointerLabel) == REPATCH_OFFSET_CALL_TO_POINTER);
        return Call(callLabel, Call::Linkable);
    }

    ALWAYS_INLINE Call call(PtrTag tag)
    {
        ASSERT(tag != CFunctionPtrTag && tag != NoPtrTag);
        ASSERT(!Options::useJITCage() || callerType(tag) == PtrTagCallerType::JIT);
        move(TrustedImm64(tag), ARM64Registers::lr);
        if (calleeType(tag) == PtrTagCalleeType::JIT)
            return callTrustedPtr<CallSignatureType::JITCall>(ARM64Registers::lr);
        return callTrustedPtr<CallSignatureType::NativeCall>(ARM64Registers::lr);
    }

    ALWAYS_INLINE Call call(RegisterID tagGPR)
    {
        return callTrustedPtr<CallSignatureType::NativeCall>(tagGPR);
    }

    template<CallSignatureType type>
    ALWAYS_INLINE Call callRegister(RegisterID targetGPR, RegisterID tagGPR = InvalidGPR)
    {
        UNUSED_PARAM(type);
        ASSERT(tagGPR != targetGPR);
        invalidateAllTempRegisters();
#if ENABLE(JIT_CAGE)
        if (Options::useJITCage()) {
            JSC_JIT_CAGED_CALL(type, targetGPR, tagGPR);
        } else
#endif
            m_assembler.blrab(targetGPR, tagGPR);
        return Call(m_assembler.labelIgnoringWatchpoints(), Call::None);
    }

    ALWAYS_INLINE Call call(RegisterID targetGPR, PtrTag tag)
    {
        ASSERT(tag != CFunctionPtrTag && tag != NoPtrTag);
        ASSERT(!Options::useJITCage() || callerType(tag) == PtrTagCallerType::JIT);
        move(TrustedImm64(tag), ARM64Registers::lr);
        if (calleeType(tag) == PtrTagCalleeType::JIT)
            return callRegister<CallSignatureType::JITCall>(targetGPR, ARM64Registers::lr);
        return callRegister<CallSignatureType::NativeCall>(targetGPR, ARM64Registers::lr);
    }

    ALWAYS_INLINE Call call(RegisterID targetGPR, RegisterID tagGPR)
    {
        return callRegister<CallSignatureType::NativeCall>(targetGPR, tagGPR);
    }

    ALWAYS_INLINE void call(Address address, PtrTag tag)
    {
        ASSERT(tag != CFunctionPtrTag && tag != NoPtrTag);
        ASSERT(!Options::useJITCage() || callerType(tag) == PtrTagCallerType::JIT);
        load64(address, getCachedDataTempRegisterIDAndInvalidate());
        call(dataTempRegister, tag);
    }

    ALWAYS_INLINE void call(Address address, RegisterID tag)
    {
        ASSERT(tag != dataTempRegister);
        load64(address, getCachedDataTempRegisterIDAndInvalidate());
        call(dataTempRegister, tag);
    }

    template<PtrTag tag>
    ALWAYS_INLINE void callOperation(const CodePtr<tag> operation)
    {
        auto tmp = getCachedDataTempRegisterIDAndInvalidate();
        move(TrustedImmPtr(operation.taggedPtr()), tmp);
        call(tmp, tag);
    }

    ALWAYS_INLINE Jump jump() { return MacroAssemblerARM64::jump(); }

    template<JumpSignatureType type>
    ALWAYS_INLINE void farJumpRegister(RegisterID targetGPR, RegisterID tagGPR = InvalidGPR)
    {
        UNUSED_PARAM(type);
        ASSERT(tagGPR != targetGPR);
#if ENABLE(JIT_CAGE)
        if (Options::useJITCage()) {
            JSC_JIT_CAGED_FAR_JUMP(type, targetGPR, tagGPR);
        } else
#endif
            m_assembler.brab(targetGPR, tagGPR);
    }

    void farJump(RegisterID targetGPR, PtrTag tag)
    {
        ASSERT(tag != CFunctionPtrTag && tag != NoPtrTag);
        ASSERT(!Options::useJITCage() || callerType(tag) == PtrTagCallerType::JIT);

        ASSERT(tag != CFunctionPtrTag);
        RegisterID diversityGPR = getCachedDataTempRegisterIDAndInvalidate();
        move(TrustedImm64(tag), diversityGPR);
        if (calleeType(tag) == PtrTagCalleeType::JIT)
            farJumpRegister<JumpSignatureType::JITJump>(targetGPR, diversityGPR);
        else
            farJumpRegister<JumpSignatureType::NativeJump>(targetGPR, diversityGPR);
    }

    void farJump(TrustedImmPtr target, PtrTag tag)
    {
        ASSERT(tag != CFunctionPtrTag && tag != NoPtrTag);
        ASSERT(!Options::useJITCage() || callerType(tag) == PtrTagCallerType::JIT);
        RegisterID targetGPR = getCachedDataTempRegisterIDAndInvalidate();
        RegisterID diversityGPR = getCachedMemoryTempRegisterIDAndInvalidate();
        move(target, targetGPR);
        move(TrustedImm64(tag), diversityGPR);
        if (calleeType(tag) == PtrTagCalleeType::JIT)
            farJumpRegister<JumpSignatureType::JITJump>(targetGPR, diversityGPR);
        else
            farJumpRegister<JumpSignatureType::NativeJump>(targetGPR, diversityGPR);
    }

    void farJump(RegisterID targetGPR, RegisterID tagGPR)
    {
        ASSERT(tagGPR != targetGPR);
        farJumpRegister<JumpSignatureType::JITJump>(targetGPR, tagGPR);
    }

    void farJump(Address address, RegisterID tagGPR)
    {
        RegisterID targetGPR = getCachedDataTempRegisterIDAndInvalidate();
        ASSERT(tagGPR != targetGPR);
        load64(address, targetGPR);
        farJumpRegister<JumpSignatureType::JITJump>(targetGPR, tagGPR);
    }

    void farJump(BaseIndex address, RegisterID tagGPR)
    {
        RegisterID targetGPR = getCachedDataTempRegisterIDAndInvalidate();
        ASSERT(tagGPR != targetGPR);
        load64(address, targetGPR);
        farJumpRegister<JumpSignatureType::JITJump>(targetGPR, tagGPR);
    }

    void farJump(AbsoluteAddress address, RegisterID tagGPR)
    {
        RegisterID targetGPR = getCachedDataTempRegisterIDAndInvalidate();
        ASSERT(tagGPR != targetGPR);
        move(TrustedImmPtr(address.m_ptr), targetGPR);
        load64(Address(targetGPR), targetGPR);
        farJumpRegister<JumpSignatureType::JITJump>(targetGPR, tagGPR);
    }

    void farJump(Address address, PtrTag tag)
    {
        ASSERT(tag != CFunctionPtrTag && tag != NoPtrTag);
        ASSERT(!Options::useJITCage() || callerType(tag) == PtrTagCallerType::JIT);
        RegisterID targetGPR = getCachedDataTempRegisterIDAndInvalidate();
        RegisterID diversityGPR = getCachedMemoryTempRegisterIDAndInvalidate();
        load64(address, targetGPR);
        move(TrustedImm64(tag), diversityGPR);
        if (calleeType(tag) == PtrTagCalleeType::JIT)
            farJumpRegister<JumpSignatureType::JITJump>(targetGPR, diversityGPR);
        else
            farJumpRegister<JumpSignatureType::NativeJump>(targetGPR, diversityGPR);
    }

    void farJump(BaseIndex address, PtrTag tag)
    {
        ASSERT(tag != CFunctionPtrTag && tag != NoPtrTag);
        ASSERT(!Options::useJITCage() || callerType(tag) == PtrTagCallerType::JIT);
        RegisterID targetGPR = getCachedDataTempRegisterIDAndInvalidate();
        RegisterID diversityGPR = getCachedMemoryTempRegisterIDAndInvalidate();
        load64(address, targetGPR);
        move(TrustedImm64(tag), diversityGPR);
        if (calleeType(tag) == PtrTagCalleeType::JIT)
            farJumpRegister<JumpSignatureType::JITJump>(targetGPR, diversityGPR);
        else
            farJumpRegister<JumpSignatureType::NativeJump>(targetGPR, diversityGPR);
    }

    void farJump(AbsoluteAddress address, PtrTag tag)
    {
        ASSERT(tag != CFunctionPtrTag && tag != NoPtrTag);
        ASSERT(!Options::useJITCage() || callerType(tag) == PtrTagCallerType::JIT);
        RegisterID targetGPR = getCachedDataTempRegisterIDAndInvalidate();
        RegisterID diversityGPR = getCachedMemoryTempRegisterIDAndInvalidate();
        move(TrustedImmPtr(address.m_ptr), targetGPR);
        load64(Address(targetGPR), targetGPR);
        move(TrustedImm64(tag), diversityGPR);
        if (calleeType(tag) == PtrTagCalleeType::JIT)
            farJumpRegister<JumpSignatureType::JITJump>(targetGPR, diversityGPR);
        else
            farJumpRegister<JumpSignatureType::NativeJump>(targetGPR, diversityGPR);
    }

    ALWAYS_INLINE void ret()
    {
#if ENABLE(JIT_CAGE)
        if (Options::useJITCage()) {
            JSC_JIT_CAGED_RET();
        } else
#endif
            m_assembler.retab();
    }
};

} // namespace JSC

#endif // ENABLE(ASSEMBLER) && CPU(ARM64E)
