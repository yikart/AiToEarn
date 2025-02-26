/*
 * Copyright (C) 2012-2021 Apple Inc. All rights reserved.
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

#if ENABLE(JIT)

#include "FPRInfo.h"
#include "RegisterSet.h"

namespace JSC {

class AssemblyHelpers;
struct ScratchBuffer;

// This class provides a low-level register allocator for use in stubs.

class ScratchRegisterAllocator {
public:
    ScratchRegisterAllocator() = default;
    ScratchRegisterAllocator(const RegisterSet& usedRegisters);
    ~ScratchRegisterAllocator();

    void lock(GPRReg);
    void lock(FPRReg);
    void lock(JSValueRegs);
    
    template<typename BankInfo>
    typename BankInfo::RegisterType allocateScratch();
    
    GPRReg allocateScratchGPR();
    FPRReg allocateScratchFPR();
    
    bool didReuseRegisters() const
    {
        return !!m_numberOfReusedRegisters;
    }
    
    unsigned numberOfReusedRegisters() const
    {
        return m_numberOfReusedRegisters;
    }

    RegisterSet usedRegisters() const { return m_usedRegisters; }
    
    enum class ExtraStackSpace { SpaceForCCall, NoExtraSpace };

    struct PreservedState {
        PreservedState()
            : numberOfBytesPreserved(std::numeric_limits<unsigned>::max())
            , extraStackSpaceRequirement(ExtraStackSpace::SpaceForCCall)
        { }

        PreservedState(unsigned numberOfBytes, ExtraStackSpace extraStackSpace)
            : numberOfBytesPreserved(numberOfBytes)
            , extraStackSpaceRequirement(extraStackSpace)
        { }

        explicit operator bool() const { return numberOfBytesPreserved != std::numeric_limits<unsigned>::max(); }

        unsigned numberOfBytesPreserved;
        ExtraStackSpace extraStackSpaceRequirement;
    };

    PreservedState preserveReusedRegistersByPushing(AssemblyHelpers& jit, ExtraStackSpace);
    void restoreReusedRegistersByPopping(AssemblyHelpers& jit, const PreservedState&);

    static unsigned preserveRegistersToStackForCall(AssemblyHelpers& jit, const RegisterSet& usedRegisters, unsigned extraPaddingInBytes);
    static void restoreRegistersFromStackForCall(AssemblyHelpers& jit, const RegisterSet& usedRegisters, const RegisterSet& ignore, unsigned numberOfStackBytesUsedForRegisterPreservation, unsigned extraPaddingInBytes);

private:
    RegisterSet m_usedRegisters { };
    RegisterSet m_scratchRegisters { };
    ScalarRegisterSet m_lockedRegisters { };
    unsigned m_numberOfReusedRegisters { 0 };
};

} // namespace JSC

#endif // ENABLE(JIT)
