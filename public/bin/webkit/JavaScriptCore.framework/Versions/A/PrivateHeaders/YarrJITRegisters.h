/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
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

#if ENABLE(YARR_JIT)

#include "GPRInfo.h"

namespace JSC {

namespace Yarr {

struct YarrJITDefaultRegisters {
public:
#if CPU(ARM_THUMB2)
    static constexpr GPRReg input = ARMRegisters::r0;
    static constexpr GPRReg index = ARMRegisters::r1;
    static constexpr GPRReg length = ARMRegisters::r2;
    static constexpr GPRReg output = ARMRegisters::r3;

    static constexpr GPRReg regT0 = ARMRegisters::r4;
    static constexpr GPRReg regT1 = ARMRegisters::r5;
    // r6 is reserved for MacroAssemblerARMv7,
    // r7 is fp.
    static constexpr GPRReg regT2 = ARMRegisters::r8;
    // r9 is sb in EABI.
    static constexpr GPRReg initialStart = ARMRegisters::r10; // r10 is SL, but no longer a special register.

    static constexpr GPRReg returnRegister = ARMRegisters::r0;
    static constexpr GPRReg returnRegister2 = ARMRegisters::r1;

#elif CPU(ARM64)
    // Argument registers
    static constexpr GPRReg input = ARM64Registers::x0;
    static constexpr GPRReg index = ARM64Registers::x1;
    static constexpr GPRReg length = ARM64Registers::x2;
    static constexpr GPRReg output = ARM64Registers::x3;
    static constexpr GPRReg matchingContext = ARM64Registers::x4;
    static constexpr GPRReg freelistRegister = ARM64Registers::x4; // Loaded from the MatchingContextHolder in the prologue.
    static constexpr GPRReg freelistSizeRegister = ARM64Registers::x5; // Only used during initialization.

    // Scratch registers
    static constexpr GPRReg regT0 = ARM64Registers::x6;
    static constexpr GPRReg regT1 = ARM64Registers::x7;
    static constexpr GPRReg regT2 = ARM64Registers::x8;
    static constexpr GPRReg remainingMatchCount = ARM64Registers::x9;
    static constexpr GPRReg regUnicodeInputAndTrail = ARM64Registers::x10;
    static constexpr GPRReg unicodeAndSubpatternIdTemp = ARM64Registers::x5;
    static constexpr GPRReg initialStart = ARM64Registers::x11;

#if ENABLE(YARR_JIT_UNICODE_CAN_INCREMENT_INDEX_FOR_NON_BMP)
    static constexpr GPRReg firstCharacterAdditionalReadSize { ARM64Registers::x12 };
#else
    static constexpr GPRReg firstCharacterAdditionalReadSize { InvalidGPRReg };
#endif

    static constexpr GPRReg leadingSurrogateTag = ARM64Registers::x13;
    static constexpr GPRReg trailingSurrogateTag = ARM64Registers::x14;
    static constexpr GPRReg endOfStringAddress = ARM64Registers::x15;

    static constexpr GPRReg returnRegister = ARM64Registers::x0;
    static constexpr GPRReg returnRegister2 = ARM64Registers::x1;

    static constexpr MacroAssembler::TrustedImm32 supplementaryPlanesBase = MacroAssembler::TrustedImm32(0x10000);
    static constexpr MacroAssembler::TrustedImm32 surrogateTagMask = MacroAssembler::TrustedImm32(0xfffffc00);
#elif CPU(X86_64)
    // Argument registers
    static constexpr GPRReg input = X86Registers::edi;
    static constexpr GPRReg index = X86Registers::esi;
    static constexpr GPRReg length = X86Registers::edx;
    static constexpr GPRReg output = X86Registers::ecx;
    static constexpr GPRReg matchingContext = X86Registers::r8;
    static constexpr GPRReg freelistRegister = X86Registers::r8; // Loaded from the MatchingContextHolder in the prologue.
    static constexpr GPRReg freelistSizeRegister = X86Registers::r9; // Only used during initialization.

    // Scratch registers
    static constexpr GPRReg regT0 = X86Registers::eax;
    static constexpr GPRReg regT1 = X86Registers::r9;
    static constexpr GPRReg regT2 = X86Registers::r10;

    static constexpr GPRReg initialStart = X86Registers::ebx;
    static constexpr GPRReg remainingMatchCount = X86Registers::r12;
    static constexpr GPRReg regUnicodeInputAndTrail = X86Registers::r13;
    static constexpr GPRReg unicodeAndSubpatternIdTemp = X86Registers::r14;
    static constexpr GPRReg endOfStringAddress = X86Registers::r15;

    static constexpr GPRReg returnRegister = X86Registers::eax;
    static constexpr GPRReg returnRegister2 = X86Registers::edx;

    static constexpr MacroAssembler::TrustedImm32 supplementaryPlanesBase = MacroAssembler::TrustedImm32(0x10000);
    static constexpr MacroAssembler::TrustedImm32 leadingSurrogateTag = MacroAssembler::TrustedImm32(0xd800);
    static constexpr MacroAssembler::TrustedImm32 trailingSurrogateTag = MacroAssembler::TrustedImm32(0xdc00);
    static constexpr MacroAssembler::TrustedImm32 surrogateTagMask = MacroAssembler::TrustedImm32(0xfffffc00);
#elif CPU(RISCV64)
    // Argument registers
    static constexpr GPRReg input = RISCV64Registers::x10;
    static constexpr GPRReg index = RISCV64Registers::x11;
    static constexpr GPRReg length = RISCV64Registers::x12;
    static constexpr GPRReg output = RISCV64Registers::x13;
    static constexpr GPRReg matchingContext = RISCV64Registers::x14;
    static constexpr GPRReg freelistRegister = RISCV64Registers::x14; // Loaded from the MatchingContextHolder in the prologue.
    static constexpr GPRReg freelistSizeRegister = RISCV64Registers::x15; // Only used during initialization.

    // Scratch registers
    static constexpr GPRReg regT0 = RISCV64Registers::x16;
    static constexpr GPRReg regT1 = RISCV64Registers::x17;
    static constexpr GPRReg regT2 = RISCV64Registers::x5;
    static constexpr GPRReg remainingMatchCount = RISCV64Registers::x6;
    static constexpr GPRReg regUnicodeInputAndTrail = RISCV64Registers::x7;
    static constexpr GPRReg unicodeAndSubpatternIdTemp = RISCV64Registers::x15;
    static constexpr GPRReg initialStart = RISCV64Registers::x28;
    static constexpr GPRReg endOfStringAddress = RISCV64Registers::x29;

    static constexpr GPRReg returnRegister = RISCV64Registers::x10;
    static constexpr GPRReg returnRegister2 = RISCV64Registers::x11;

    static constexpr MacroAssembler::TrustedImm32 supplementaryPlanesBase = MacroAssembler::TrustedImm32(0x10000);
    static constexpr MacroAssembler::TrustedImm32 leadingSurrogateTag = MacroAssembler::TrustedImm32(0xd800);
    static constexpr MacroAssembler::TrustedImm32 trailingSurrogateTag = MacroAssembler::TrustedImm32(0xdc00);
    static constexpr MacroAssembler::TrustedImm32 surrogateTagMask = MacroAssembler::TrustedImm32(0xfffffc00);
#endif
};

#if ENABLE(YARR_JIT_REGEXP_TEST_INLINE)
class YarrJITRegisters {
public:
    YarrJITRegisters() = default;

    void validate()
    {
#if ASSERT_ENABLED
        ASSERT(input != InvalidGPRReg);
        ASSERT(index != InvalidGPRReg);
        ASSERT(length != InvalidGPRReg);
        ASSERT(output != InvalidGPRReg);

        ASSERT(returnRegister != InvalidGPRReg);
        ASSERT(returnRegister2 != InvalidGPRReg);

        ASSERT(regT0 != InvalidGPRReg);
        ASSERT(regT1 != InvalidGPRReg);

        ASSERT(noOverlap(input, index, length, output, regT0, regT1));
        ASSERT(noOverlap(returnRegister, returnRegister2));
        ASSERT(noOverlap(index, output, returnRegister));
#endif
    }

    // Argument registers
    GPRReg input { InvalidGPRReg };
    GPRReg index { InvalidGPRReg };
    GPRReg length { InvalidGPRReg };
    GPRReg output { InvalidGPRReg };

    GPRReg matchingContext { InvalidGPRReg };
    GPRReg freelistRegister { InvalidGPRReg };
    GPRReg freelistSizeRegister { InvalidGPRReg };

    GPRReg returnRegister { InvalidGPRReg };
    GPRReg returnRegister2 { InvalidGPRReg };

    // Scratch registers
    GPRReg regT0 { InvalidGPRReg };
    GPRReg regT1 { InvalidGPRReg };
    GPRReg regT2 { InvalidGPRReg };

    // DotStarEnclosure
    GPRReg initialStart { InvalidGPRReg };

    // Unicode character processing
    GPRReg remainingMatchCount { InvalidGPRReg };
    GPRReg regUnicodeInputAndTrail { InvalidGPRReg };
    GPRReg unicodeAndSubpatternIdTemp { InvalidGPRReg };
    GPRReg endOfStringAddress { InvalidGPRReg };
    GPRReg firstCharacterAdditionalReadSize { InvalidGPRReg };

    const MacroAssembler::TrustedImm32 supplementaryPlanesBase = MacroAssembler::TrustedImm32(0x10000);
    const MacroAssembler::TrustedImm32 leadingSurrogateTag = MacroAssembler::TrustedImm32(0xd800);
    const MacroAssembler::TrustedImm32 trailingSurrogateTag = MacroAssembler::TrustedImm32(0xdc00);
    const MacroAssembler::TrustedImm32 surrogateTagMask = MacroAssembler::TrustedImm32(0xfffffc00);
};
#endif

} } // namespace JSC::Yarr

#endif
