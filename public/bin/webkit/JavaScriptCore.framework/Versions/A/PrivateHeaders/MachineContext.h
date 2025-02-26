/*
 * Copyright (C) 2017 Yusuke Suzuki <utatane.tea@gmail.com>.
 * Copyright (C) 2018-2022 Apple Inc. All rights reserved.
 * Copyright (C) 2022 Leonardo Taccari <leot@NetBSD.org>.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "GPRInfo.h"
#include "LLIntPCRanges.h"
#include "MacroAssemblerCodeRef.h"
#include <wtf/PlatformRegisters.h>
#include <wtf/PointerPreparations.h>
#include <wtf/StdLibExtras.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {
namespace MachineContext {

template<typename T = void*> T stackPointer(const PlatformRegisters&);

#if OS(WINDOWS) || HAVE(MACHINE_CONTEXT)
template<typename T = void*> T framePointer(const PlatformRegisters&);
inline CodePtr<PlatformRegistersLRPtrTag> linkRegister(const PlatformRegisters&);
inline std::optional<CodePtr<PlatformRegistersPCPtrTag>> instructionPointer(const PlatformRegisters&);
inline void setInstructionPointer(PlatformRegisters&, CodePtr<CFunctionPtrTag>);
inline void setInstructionPointer(PlatformRegisters&, void *);

template<size_t N> void*& argumentPointer(PlatformRegisters&);
template<size_t N> void* argumentPointer(const PlatformRegisters&);
#if !ENABLE(C_LOOP)
void*& llintInstructionPointer(PlatformRegisters&);
void* llintInstructionPointer(const PlatformRegisters&);
#endif // !ENABLE(C_LOOP)

#if HAVE(MACHINE_CONTEXT)

#if !USE(PLATFORM_REGISTERS_WITH_PROFILE)

#if !USE(DARWIN_REGISTER_MACROS)
static inline void*& stackPointerImpl(mcontext_t&);
static inline void*& instructionPointerImpl(mcontext_t&);
#endif // !USE(DARWIN_REGISTER_MACROS)

static inline void*& framePointerImpl(mcontext_t&);
#endif // !USE(PLATFORM_REGISTERS_WITH_PROFILE)

template<typename T = void*> T stackPointer(const mcontext_t&);
template<typename T = void*> T framePointer(const mcontext_t&);
inline CodePtr<PlatformRegistersPCPtrTag> instructionPointer(const mcontext_t&);

template<size_t N> void*& argumentPointer(mcontext_t&);
template<size_t N> void* argumentPointer(const mcontext_t&);
#if !ENABLE(C_LOOP)
void*& llintInstructionPointer(mcontext_t&);
void* llintInstructionPointer(const mcontext_t&);
#endif // !ENABLE(C_LOOP)
#endif // HAVE(MACHINE_CONTEXT)
#endif // OS(WINDOWS) || HAVE(MACHINE_CONTEXT)

#if OS(WINDOWS) || HAVE(MACHINE_CONTEXT)

#if !USE(PLATFORM_REGISTERS_WITH_PROFILE) && !USE(DARWIN_REGISTER_MACROS)
static inline void*& stackPointerImpl(PlatformRegisters& regs)
{
#if OS(DARWIN)
#if __DARWIN_UNIX03

#if CPU(X86)
    return reinterpret_cast<void*&>(regs.__esp);
#elif CPU(X86_64)
    return reinterpret_cast<void*&>(regs.__rsp);
#elif CPU(PPC) || CPU(PPC64)
    return reinterpret_cast<void*&>(regs.__r1);
#elif CPU(ARM_THUMB2) || CPU(ARM)
    return reinterpret_cast<void*&>(regs.__sp);
#else
#error Unknown Architecture
#endif

#else // !__DARWIN_UNIX03

#if CPU(X86)
    return reinterpret_cast<void*&>(regs.esp);
#elif CPU(X86_64)
    return reinterpret_cast<void*&>(regs.rsp);
#elif CPU(PPC) || CPU(PPC64)
    return reinterpret_cast<void*&>(regs.r1);
#else
#error Unknown Architecture
#endif

#endif // __DARWIN_UNIX03

#elif OS(WINDOWS)

#if CPU(ARM)
    return reinterpret_cast<void*&>((uintptr_t&) regs.Sp);
#elif CPU(MIPS)
    return reinterpret_cast<void*&>((uintptr_t&) regs.IntSp);
#elif CPU(X86)
    return reinterpret_cast<void*&>((uintptr_t&) regs.Esp);
#elif CPU(X86_64)
    return reinterpret_cast<void*&>((uintptr_t&) regs.Rsp);
#else
#error Unknown Architecture
#endif

#elif HAVE(MACHINE_CONTEXT)
    return stackPointerImpl(regs.machineContext);
#endif
}
#endif // !USE(PLATFORM_REGISTERS_WITH_PROFILE)

template<typename T>
inline T stackPointer(const PlatformRegisters& regs)
{
#if USE(PLATFORM_REGISTERS_WITH_PROFILE)
    void* value = WTF_READ_PLATFORM_REGISTERS_SP_WITH_PROFILE(regs);
    assertIsNotTagged(value);
    return std::bit_cast<T>(value);
#elif USE(DARWIN_REGISTER_MACROS)
    return std::bit_cast<T>(reinterpret_cast<void*>(__darwin_arm_thread_state64_get_sp(regs)));
#else
    return std::bit_cast<T>(stackPointerImpl(const_cast<PlatformRegisters&>(regs)));
#endif
}

#else // not OS(WINDOWS) || HAVE(MACHINE_CONTEXT)

template<typename T>
inline T stackPointer(const PlatformRegisters& regs)
{
    return std::bit_cast<T>(regs.stackPointer);
}
#endif // OS(WINDOWS) || HAVE(MACHINE_CONTEXT)

#if HAVE(MACHINE_CONTEXT)

#if !USE(PLATFORM_REGISTERS_WITH_PROFILE) && !USE(DARWIN_REGISTER_MACROS)
static inline void*& stackPointerImpl(mcontext_t& machineContext)
{
#if OS(DARWIN)
    return stackPointerImpl(machineContext->__ss);
#elif OS(FREEBSD)

#if CPU(X86)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.mc_esp);
#elif CPU(X86_64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.mc_rsp);
#elif CPU(ARM)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.__gregs[_REG_SP]);
#elif CPU(ARM64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.mc_gpregs.gp_sp);
#elif CPU(MIPS)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.mc_regs[29]);
#else
#error Unknown Architecture
#endif

#elif OS(NETBSD)

#if CPU(X86)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.__gregs[_REG_UESP]);
#elif CPU(X86_64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.__gregs[_REG_RSP]);
#elif CPU(ARM)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.__gregs[_REG_SP]);
#elif CPU(ARM64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.__gregs[_REG_SP]);
#elif CPU(MIPS)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.__gregs[_REG_SP]);
#else
#error Unknown Architecture
#endif

#elif OS(FUCHSIA) || OS(LINUX)

#if CPU(X86)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.gregs[REG_ESP]);
#elif CPU(X86_64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.gregs[REG_RSP]);
#elif CPU(ARM)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.arm_sp);
#elif CPU(ARM64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.sp);
#elif CPU(MIPS)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.gregs[29]);
#elif CPU(RISCV64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.__gregs[REG_SP]);
#else
#error Unknown Architecture
#endif
#endif
}
#endif // !USE(PLATFORM_REGISTERS_WITH_PROFILE)

template<typename T>
inline T stackPointer(const mcontext_t& machineContext)
{
#if USE(PLATFORM_REGISTERS_WITH_PROFILE)
    void* value = WTF_READ_MACHINE_CONTEXT_SP_WITH_PROFILE(machineContext);
    assertIsNotTagged(value);
    return std::bit_cast<T>(value);
#elif USE(DARWIN_REGISTER_MACROS)
    return stackPointer(machineContext->__ss);
#else
    return std::bit_cast<T>(stackPointerImpl(const_cast<mcontext_t&>(machineContext)));
#endif
}
#endif // HAVE(MACHINE_CONTEXT)


#if OS(WINDOWS) || HAVE(MACHINE_CONTEXT)

#if !USE(PLATFORM_REGISTERS_WITH_PROFILE)
static inline void*& framePointerImpl(PlatformRegisters& regs)
{
#if OS(DARWIN)

#if __DARWIN_UNIX03

#if CPU(X86)
    return reinterpret_cast<void*&>(regs.__ebp);
#elif CPU(X86_64)
    return reinterpret_cast<void*&>(regs.__rbp);
#elif CPU(ARM_THUMB2)
    return reinterpret_cast<void*&>(regs.__r[7]);
#elif CPU(ARM)
    return reinterpret_cast<void*&>(regs.__r[11]);
#elif CPU(ARM64)
    return reinterpret_cast<void*&>(regs.__x[29]);
#else
#error Unknown Architecture
#endif

#else // !__DARWIN_UNIX03

#if CPU(X86)
    return reinterpret_cast<void*&>(regs.esp);
#elif CPU(X86_64)
    return reinterpret_cast<void*&>(regs.rsp);
#else
#error Unknown Architecture
#endif

#endif // __DARWIN_UNIX03

#elif OS(WINDOWS)

#if CPU(ARM)
    return reinterpret_cast<void*&>((uintptr_t&) regs.R11);
#elif CPU(MIPS)
#error Dont know what to do with mips. Do we even need this?
#elif CPU(X86)
    return reinterpret_cast<void*&>((uintptr_t&) regs.Ebp);
#elif CPU(X86_64)
    return reinterpret_cast<void*&>((uintptr_t&) regs.Rbp);
#else
#error Unknown Architecture
#endif

#elif HAVE(MACHINE_CONTEXT)
    return framePointerImpl(regs.machineContext);
#endif
}
#endif // !USE(PLATFORM_REGISTERS_WITH_PROFILE)

template<typename T>
inline T framePointer(const PlatformRegisters& regs)
{
#if USE(PLATFORM_REGISTERS_WITH_PROFILE)
    void* value = WTF_READ_PLATFORM_REGISTERS_FP_WITH_PROFILE(regs);
    assertIsNotTagged(value);
    return std::bit_cast<T>(value);
#else
    return std::bit_cast<T>(framePointerImpl(const_cast<PlatformRegisters&>(regs)));
#endif
}
#endif // OS(WINDOWS) || HAVE(MACHINE_CONTEXT)


#if HAVE(MACHINE_CONTEXT)

#if !USE(PLATFORM_REGISTERS_WITH_PROFILE)
static inline void*& framePointerImpl(mcontext_t& machineContext)
{
#if OS(DARWIN)
    return framePointerImpl(machineContext->__ss);
#elif OS(FREEBSD)

#if CPU(X86)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.mc_ebp);
#elif CPU(X86_64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.mc_rbp);
#elif CPU(ARM)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.__gregs[_REG_FP]);
#elif CPU(ARM64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.mc_gpregs.gp_x[29]);
#elif CPU(MIPS)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.mc_regs[30]);
#else
#error Unknown Architecture
#endif

#elif OS(NETBSD)

#if CPU(X86)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.__gregs[_REG_EBP]);
#elif CPU(X86_64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.__gregs[_REG_RBP]);
#elif CPU(ARM)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.__gregs[_REG_FP]);
#elif CPU(ARM64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.__gregs[_REG_FP]);
#elif CPU(MIPS)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.__gregs[_REG_S8]);
#else
#error Unknown Architecture
#endif

#elif OS(FUCHSIA) || OS(LINUX)

// The following sequence depends on glibc's sys/ucontext.h.
#if CPU(X86)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.gregs[REG_EBP]);
#elif CPU(X86_64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.gregs[REG_RBP]);
#elif CPU(ARM)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.arm_fp);
#elif CPU(ARM64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.regs[29]);
#elif CPU(MIPS)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.gregs[30]);
#elif CPU(RISCV64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.__gregs[REG_S0]);
#else
#error Unknown Architecture
#endif

#elif OS(QNX)
#if CPU(X86_64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.cpu.rbp);
#elif CPU(ARM64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.cpu.gpr[29]);
#else
#error Unknown Architecture
#endif

#else
#error Need a way to get the frame pointer for another thread on this platform
#endif
}
#endif // !USE(PLATFORM_REGISTERS_WITH_PROFILE)

template<typename T>
inline T framePointer(const mcontext_t& machineContext)
{
#if USE(PLATFORM_REGISTERS_WITH_PROFILE)
    void* value = WTF_READ_MACHINE_CONTEXT_FP_WITH_PROFILE(machineContext);
    assertIsNotTagged(value);
    return std::bit_cast<T>(value);
#else
    return std::bit_cast<T>(framePointerImpl(const_cast<mcontext_t&>(machineContext)));
#endif
}
#endif // HAVE(MACHINE_CONTEXT)


#if OS(WINDOWS) || HAVE(MACHINE_CONTEXT)

#if !USE(PLATFORM_REGISTERS_WITH_PROFILE) && !USE(DARWIN_REGISTER_MACROS)
static inline void*& instructionPointerImpl(PlatformRegisters& regs)
{
#if OS(DARWIN)
#if __DARWIN_UNIX03

#if CPU(X86)
    return reinterpret_cast<void*&>(regs.__eip);
#elif CPU(X86_64)
    return reinterpret_cast<void*&>(regs.__rip);
#elif CPU(ARM_THUMB2) || CPU(ARM)
    return reinterpret_cast<void*&>(regs.__pc);
#else
#error Unknown Architecture
#endif

#else // !__DARWIN_UNIX03
#if CPU(X86)
    return reinterpret_cast<void*&>(regs.eip);
#elif CPU(X86_64)
    return reinterpret_cast<void*&>(regs.rip);
#else
#error Unknown Architecture
#endif

#endif // __DARWIN_UNIX03

#elif OS(WINDOWS)

#if CPU(ARM)
    return reinterpret_cast<void*&>((uintptr_t&) regs.Pc);
#elif CPU(MIPS)
#error Dont know what to do with mips. Do we even need this?
#elif CPU(X86)
    return reinterpret_cast<void*&>((uintptr_t&) regs.Eip);
#elif CPU(X86_64)
    return reinterpret_cast<void*&>((uintptr_t&) regs.Rip);
#else
#error Unknown Architecture
#endif

#elif HAVE(MACHINE_CONTEXT)
    return instructionPointerImpl(regs.machineContext);
#endif
}
#endif // !USE(PLATFORM_REGISTERS_WITH_PROFILE)

inline std::optional<CodePtr<PlatformRegistersPCPtrTag>> instructionPointer(const PlatformRegisters& regs)
{
#if USE(PLATFORM_REGISTERS_WITH_PROFILE)
    void* value = WTF_READ_PLATFORM_REGISTERS_PC_WITH_PROFILE(regs);
#elif USE(DARWIN_REGISTER_MACROS)
    void* value = __darwin_arm_thread_state64_get_pc_fptr(regs);
#else
    void* value = instructionPointerImpl(const_cast<PlatformRegisters&>(regs));
#endif
    if (!value)
        return std::make_optional(CodePtr<PlatformRegistersPCPtrTag>(nullptr));
    if (!usesPointerTagging())
        return std::make_optional(CodePtr<PlatformRegistersPCPtrTag>(value));
    if (isTaggedWith<PlatformRegistersPCPtrTag>(value))
        return std::make_optional(CodePtr<PlatformRegistersPCPtrTag>(value));
    return std::nullopt;
}

inline void setInstructionPointer(PlatformRegisters& regs, CodePtr<CFunctionPtrTag> value)
{
#if USE(PLATFORM_REGISTERS_WITH_PROFILE)
    WTF_WRITE_PLATFORM_REGISTERS_PC_WITH_PROFILE(regs, value.taggedPtr());
#elif USE(DARWIN_REGISTER_MACROS)
    __darwin_arm_thread_state64_set_pc_fptr(regs, value.taggedPtr());
#else
    instructionPointerImpl(regs) = value.taggedPtr();
#endif
}

inline void setInstructionPointer(PlatformRegisters& regs, void* value)
{
#if USE(PLATFORM_REGISTERS_WITH_PROFILE)
    WTF_WRITE_PLATFORM_REGISTERS_PC_WITH_PROFILE(regs, value);
#elif USE(DARWIN_REGISTER_MACROS) && HAVE(HARDENED_MACH_EXCEPTIONS) && CPU(ARM64E)
    __darwin_arm_thread_state64_set_presigned_pc_fptr(regs, value);
#elif USE(DARWIN_REGISTER_MACROS)
    __darwin_arm_thread_state64_set_pc_fptr(regs, value);
#else
    instructionPointerImpl(regs) = value;
#endif
}
#endif // OS(WINDOWS) || HAVE(MACHINE_CONTEXT)


#if HAVE(MACHINE_CONTEXT)

#if !USE(PLATFORM_REGISTERS_WITH_PROFILE) && !USE(DARWIN_REGISTER_MACROS)
static inline void*& instructionPointerImpl(mcontext_t& machineContext)
{
#if OS(DARWIN)
    return instructionPointerImpl(machineContext->__ss);
#elif OS(FREEBSD)

#if CPU(X86)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.mc_eip);
#elif CPU(X86_64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.mc_rip);
#elif CPU(ARM)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.__gregs[_REG_PC]);
#elif CPU(ARM64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.mc_gpregs.gp_elr);
#elif CPU(MIPS)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.mc_pc);
#else
#error Unknown Architecture
#endif

#elif OS(NETBSD)

#if CPU(X86)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.__gregs[_REG_EIP]);
#elif CPU(X86_64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.__gregs[_REG_RIP]);
#elif CPU(ARM)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.__gregs[_REG_PC]);
#elif CPU(ARM64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.__gregs[_REG_PC]);
#elif CPU(MIPS)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.__gregs[_REG_EPC]);
#else
#error Unknown Architecture
#endif

#elif OS(FUCHSIA) || OS(LINUX)

// The following sequence depends on glibc's sys/ucontext.h.
#if CPU(X86)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.gregs[REG_EIP]);
#elif CPU(X86_64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.gregs[REG_RIP]);
#elif CPU(ARM)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.arm_pc);
#elif CPU(ARM64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.pc);
#elif CPU(MIPS)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.pc);
#elif CPU(RISCV64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.__gregs[REG_PC]);
#else
#error Unknown Architecture
#endif

#elif OS(QNX)
#if CPU(X86_64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.cpu.rip);
#elif CPU(ARM64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.cpu.elr);
#else
#error Unknown Architecture
#endif

#else
#error Need a way to get the instruction pointer for another thread on this platform
#endif
}
#endif // !USE(PLATFORM_REGISTERS_WITH_PROFILE)

inline CodePtr<PlatformRegistersPCPtrTag> instructionPointer(const mcontext_t& machineContext)
{
#if USE(DARWIN_REGISTER_MACROS)
    return *instructionPointer(machineContext->__ss);
#else

#if USE(PLATFORM_REGISTERS_WITH_PROFILE)
    void* value = WTF_READ_MACHINE_CONTEXT_PC_WITH_PROFILE(machineContext);
#else
    void* value = instructionPointerImpl(const_cast<mcontext_t&>(machineContext));
#endif

    return CodePtr<PlatformRegistersPCPtrTag>(value);
#endif
}
#endif // HAVE(MACHINE_CONTEXT)


#if OS(WINDOWS) || HAVE(MACHINE_CONTEXT)

#if OS(DARWIN) && __DARWIN_UNIX03 && CPU(ARM64)

inline CodePtr<PlatformRegistersLRPtrTag> linkRegister(const PlatformRegisters& regs)
{
#if USE(PLATFORM_REGISTERS_WITH_PROFILE)
    void* value = WTF_READ_PLATFORM_REGISTERS_LR_WITH_PROFILE(regs);
#else
    void* value = __darwin_arm_thread_state64_get_lr_fptr(regs);
#endif
    return CodePtr<PlatformRegistersLRPtrTag>(value);
}
#endif // OS(DARWIN) && __DARWIN_UNIX03 && CPU(ARM64)

#if HAVE(MACHINE_CONTEXT)
template<> void*& argumentPointer<1>(mcontext_t&);
#endif

template<>
inline void*& argumentPointer<1>(PlatformRegisters& regs)
{
#if OS(DARWIN)
#if __DARWIN_UNIX03

#if CPU(X86)
    return reinterpret_cast<void*&>(regs.__edx);
#elif CPU(X86_64)
    return reinterpret_cast<void*&>(regs.__rsi);
#elif CPU(ARM_THUMB2) || CPU(ARM)
    return reinterpret_cast<void*&>(regs.__r[1]);
#elif CPU(ARM64)
    return reinterpret_cast<void*&>(regs.__x[1]);
#else
#error Unknown Architecture
#endif

#else // !__DARWIN_UNIX03

#if CPU(X86)
    return reinterpret_cast<void*&>(regs.edx);
#elif CPU(X86_64)
    return reinterpret_cast<void*&>(regs.rsi);
#else
#error Unknown Architecture
#endif

#endif // __DARWIN_UNIX03

#elif OS(WINDOWS)

#if CPU(ARM)
    return reinterpret_cast<void*&>((uintptr_t&) regs.R1);
#elif CPU(MIPS)
#error Dont know what to do with mips. Do we even need this?
#elif CPU(X86)
    return reinterpret_cast<void*&>((uintptr_t&) regs.Edx);
#elif CPU(X86_64)
    return reinterpret_cast<void*&>((uintptr_t&) regs.Rdx);
#else
#error Unknown Architecture
#endif

#elif HAVE(MACHINE_CONTEXT)
    return argumentPointer<1>(regs.machineContext);
#endif
}

template<size_t N>
inline void* argumentPointer(const PlatformRegisters& regs)
{
    return argumentPointer<N>(const_cast<PlatformRegisters&>(regs));
}
#endif // OS(WINDOWS) || HAVE(MACHINE_CONTEXT)

#if HAVE(MACHINE_CONTEXT)
template<>
inline void*& argumentPointer<1>(mcontext_t& machineContext)
{
#if OS(DARWIN)
    return argumentPointer<1>(machineContext->__ss);
#elif OS(FREEBSD)

#if CPU(X86)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.mc_edx);
#elif CPU(X86_64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.mc_rsi);
#elif CPU(ARM)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.__gregs[_REG_R1]);
#elif CPU(ARM64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.mc_gpregs.gp_x[1]);
#elif CPU(MIPS)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.mc_regs[5]);
#else
#error Unknown Architecture
#endif

#elif OS(NETBSD)

#if CPU(X86)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.__gregs[_REG_EDX]);
#elif CPU(X86_64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.__gregs[_REG_RSI]);
#elif CPU(ARM)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.__gregs[_REG_R1]);
#elif CPU(ARM64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.__gregs[_REG_X1]);
#elif CPU(MIPS)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.__gregs[_REG_A1]);
#else
#error Unknown Architecture
#endif

#elif OS(FUCHSIA) || OS(LINUX)

// The following sequence depends on glibc's sys/ucontext.h.
#if CPU(X86)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.gregs[REG_EDX]);
#elif CPU(X86_64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.gregs[REG_RSI]);
#elif CPU(ARM)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.arm_r1);
#elif CPU(ARM64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.regs[1]);
#elif CPU(MIPS)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.gregs[5]);
#elif CPU(RISCV64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.__gregs[REG_A0 + 1]);
#else
#error Unknown Architecture
#endif

#elif OS(QNX)
#if CPU(X86_64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.cpu.rsi);
#elif CPU(ARM64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.cpu.gpr[1]);
#else
#error Unknown Architecture
#endif

#else
#error Need a way to get the frame pointer for another thread on this platform
#endif
}

template<unsigned N>
inline void* argumentPointer(const mcontext_t& machineContext)
{
    return argumentPointer<N>(const_cast<mcontext_t&>(machineContext));
}
#endif // HAVE(MACHINE_CONTEXT)

#if !ENABLE(C_LOOP)
#if OS(WINDOWS) || HAVE(MACHINE_CONTEXT)
inline void*& llintInstructionPointer(PlatformRegisters& regs)
{
    // LLInt uses regT4 as PC.
#if OS(DARWIN)
#if __DARWIN_UNIX03

#if CPU(X86)
    static_assert(LLInt::LLIntPC == X86Registers::esi, "Wrong LLInt PC.");
    return reinterpret_cast<void*&>(regs.__esi);
#elif CPU(X86_64)
    static_assert(LLInt::LLIntPC == X86Registers::r8, "Wrong LLInt PC.");
    return reinterpret_cast<void*&>(regs.__r8);
#elif CPU(ARM)
    static_assert(LLInt::LLIntPC == ARMRegisters::r8, "Wrong LLInt PC.");
    return reinterpret_cast<void*&>(regs.__r[8]);
#elif CPU(ARM64)
    static_assert(LLInt::LLIntPC == ARM64Registers::x4, "Wrong LLInt PC.");
    return reinterpret_cast<void*&>(regs.__x[4]);
#else
#error Unknown Architecture
#endif

#else // !__DARWIN_UNIX03
#if CPU(X86)
    static_assert(LLInt::LLIntPC == X86Registers::esi, "Wrong LLInt PC.");
    return reinterpret_cast<void*&>(regs.esi);
#elif CPU(X86_64)
    static_assert(LLInt::LLIntPC == X86Registers::r8, "Wrong LLInt PC.");
    return reinterpret_cast<void*&>(regs.r8);
#else
#error Unknown Architecture
#endif

#endif // __DARWIN_UNIX03

#elif OS(WINDOWS)

#if CPU(ARM)
    static_assert(LLInt::LLIntPC == ARMRegisters::r8, "Wrong LLInt PC.");
    return reinterpret_cast<void*&>((uintptr_t&) regs.R8);
#elif CPU(MIPS)
#error Dont know what to do with mips. Do we even need this?
#elif CPU(X86)
    static_assert(LLInt::LLIntPC == X86Registers::esi, "Wrong LLInt PC.");
    return reinterpret_cast<void*&>((uintptr_t&) regs.Esi);
#elif CPU(X86_64)
    static_assert(LLInt::LLIntPC == X86Registers::r8, "Wrong LLInt PC.");
    return reinterpret_cast<void*&>((uintptr_t&) regs.R8);
#else
#error Unknown Architecture
#endif

#elif HAVE(MACHINE_CONTEXT)
    return llintInstructionPointer(regs.machineContext);
#endif
}

inline void* llintInstructionPointer(const PlatformRegisters& regs)
{
    return llintInstructionPointer(const_cast<PlatformRegisters&>(regs));
}
#endif // OS(WINDOWS) || HAVE(MACHINE_CONTEXT)


#if HAVE(MACHINE_CONTEXT)
inline void*& llintInstructionPointer(mcontext_t& machineContext)
{
    // LLInt uses regT4 as PC.
#if OS(DARWIN)
    return llintInstructionPointer(machineContext->__ss);
#elif OS(FREEBSD)

#if CPU(X86)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.mc_esi);
#elif CPU(X86_64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.mc_r8);
#elif CPU(ARM)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.__gregs[_REG_R8]);
#elif CPU(ARM64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.mc_gpregs.gp_x[4]);
#elif CPU(MIPS)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.mc_regs[12]);
#else
#error Unknown Architecture
#endif

#elif OS(NETBSD)

#if CPU(X86)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.__gregs[_REG_ESI]);
#elif CPU(X86_64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.__gregs[_REG_R8]);
#elif CPU(ARM)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.__gregs[_REG_R8]);
#elif CPU(ARM64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.__gregs[_REG_X4]);
#elif CPU(MIPS)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.__gregs[_REG_T4]);
#else
#error Unknown Architecture
#endif

#elif OS(FUCHSIA) || OS(LINUX)

// The following sequence depends on glibc's sys/ucontext.h.
#if CPU(X86)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.gregs[REG_ESI]);
#elif CPU(X86_64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.gregs[REG_R8]);
#elif CPU(ARM)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.arm_r8);
#elif CPU(ARM64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.regs[4]);
#elif CPU(MIPS)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.gregs[12]);
#elif CPU(RISCV64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.__gregs[14]);
#else
#error Unknown Architecture
#endif

#elif OS(QNX)
#if CPU(X86_64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.cpu.r8);
#elif CPU(ARM64)
    return reinterpret_cast<void*&>((uintptr_t&) machineContext.cpu.gpr[4]);
#else
#error Unknown Architecture
#endif

#else
#error Need a way to get the LLIntPC for another thread on this platform
#endif
}

inline void* llintInstructionPointer(const mcontext_t& machineContext)
{
    return llintInstructionPointer(const_cast<mcontext_t&>(machineContext));
}
#endif // HAVE(MACHINE_CONTEXT)
#endif // !ENABLE(C_LOOP)

}
}

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
