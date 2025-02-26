/*
 * Copyright (C) 2017-2023 Apple Inc. All rights reserved.
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

#include "MacroAssembler.h"
#include "ProbeStack.h"
#include <wtf/TZoneMalloc.h>

#if ENABLE(ASSEMBLER)

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {
namespace Probe {

struct CPUState {
    using RegisterID = MacroAssembler::RegisterID;
    using SPRegisterID = MacroAssembler::SPRegisterID;
    using FPRegisterID = MacroAssembler::FPRegisterID;

    static ASCIILiteral gprName(RegisterID id) { return MacroAssembler::gprName(id); }
    static ASCIILiteral sprName(SPRegisterID id) { return MacroAssembler::sprName(id); }
    static ASCIILiteral fprName(FPRegisterID id) { return MacroAssembler::fprName(id); }
    inline UCPURegister& gpr(RegisterID);
    inline UCPURegister& spr(SPRegisterID);
    template<SavedFPWidth = SavedFPWidth::DontSaveVectors> inline double& fpr(FPRegisterID);
#if CPU(X86_64) || CPU(ARM64)
    inline v128_t& vector(FPRegisterID);
#endif

    template<typename T> T gpr(RegisterID) const;
    template<typename T> T spr(SPRegisterID) const;
    template<typename T, SavedFPWidth = SavedFPWidth::DontSaveVectors> T fpr(FPRegisterID) const;

    void*& pc();
    void*& fp();
    void*& sp();
    template<typename T> T pc() const;
    template<typename T> T fp() const;
    template<typename T> T sp() const;

    UCPURegister gprs[MacroAssembler::numberOfRegisters()];
    UCPURegister sprs[MacroAssembler::numberOfSPRegisters()];
    union {
        double fprs[MacroAssembler::numberOfFPRegisters()];
#if CPU(X86_64) || CPU(ARM64)
        v128_t vectors[MacroAssembler::numberOfFPRegisters()] = { };
#endif
    } fprs;
};

inline UCPURegister& CPUState::gpr(RegisterID id)
{
    ASSERT(id >= MacroAssembler::firstRegister() && id <= MacroAssembler::lastRegister());
    return gprs[id];
}

inline UCPURegister& CPUState::spr(SPRegisterID id)
{
    ASSERT(id >= MacroAssembler::firstSPRegister() && id <= MacroAssembler::lastSPRegister());
    return sprs[id];
}

template<SavedFPWidth savedFPWidth>
inline double& CPUState::fpr(FPRegisterID id)
{
    ASSERT(id >= MacroAssembler::firstFPRegister() && id <= MacroAssembler::lastFPRegister());
#if CPU(X86_64) || CPU(ARM64)
    return (savedFPWidth == SavedFPWidth::SaveVectors) ? fprs.vectors[id].f64x2[0] : fprs.fprs[id];
#else
    ASSERT(savedFPWidth == SavedFPWidth::DontSaveVectors);
    return fprs.fprs[id];
#endif
}

#if CPU(X86_64) || CPU(ARM64)
inline v128_t& CPUState::vector(FPRegisterID id)
{
    ASSERT(id >= MacroAssembler::firstFPRegister() && id <= MacroAssembler::lastFPRegister());
    return fprs.vectors[id];
}
#endif

template<typename T>
T CPUState::gpr(RegisterID id) const
{
    CPUState* cpu = const_cast<CPUState*>(this);
    auto& from = cpu->gpr(id);
    typename std::remove_const<T>::type to { };
    std::memcpy(static_cast<void*>(&to), &from, sizeof(to)); // Use std::memcpy to avoid strict aliasing issues.
    return to;
}

template<typename T>
T CPUState::spr(SPRegisterID id) const
{
    CPUState* cpu = const_cast<CPUState*>(this);
    auto& from = cpu->spr(id);
    typename std::remove_const<T>::type to { };
    std::memcpy(static_cast<void*>(&to), &from, sizeof(to)); // Use std::memcpy to avoid strict aliasing issues.
    return to;
}

template<typename T, SavedFPWidth savedFPWidth>
T CPUState::fpr(FPRegisterID id) const
{
    CPUState* cpu = const_cast<CPUState*>(this);
    return std::bit_cast<T>(cpu->fpr<savedFPWidth>(id));
}

inline void*& CPUState::pc()
{
#if CPU(X86_64)
    return *reinterpret_cast<void**>(&spr(X86Registers::eip));
#elif CPU(ARM64)
    return *reinterpret_cast<void**>(&spr(ARM64Registers::pc));
#elif CPU(ARM_THUMB2)
    return *reinterpret_cast<void**>(&gpr(ARMRegisters::pc));
#elif CPU(RISCV64)
    return *reinterpret_cast<void**>(&spr(RISCV64Registers::pc));
#else
#error "Unsupported CPU"
#endif
}

inline void*& CPUState::fp()
{
#if CPU(X86_64)
    return *reinterpret_cast<void**>(&gpr(X86Registers::ebp));
#elif CPU(ARM64)
    return *reinterpret_cast<void**>(&gpr(ARM64Registers::fp));
#elif CPU(ARM_THUMB2)
    return *reinterpret_cast<void**>(&gpr(ARMRegisters::fp));
#elif CPU(RISCV64)
    return *reinterpret_cast<void**>(&gpr(RISCV64Registers::fp));
#else
#error "Unsupported CPU"
#endif
}

inline void*& CPUState::sp()
{
#if CPU(X86_64)
    return *reinterpret_cast<void**>(&gpr(X86Registers::esp));
#elif CPU(ARM64)
    return *reinterpret_cast<void**>(&gpr(ARM64Registers::sp));
#elif CPU(ARM_THUMB2)
    return *reinterpret_cast<void**>(&gpr(ARMRegisters::sp));
#elif CPU(RISCV64)
    return *reinterpret_cast<void**>(&gpr(RISCV64Registers::sp));
#else
#error "Unsupported CPU"
#endif
}

template<typename T>
T CPUState::pc() const
{
    CPUState* cpu = const_cast<CPUState*>(this);
    return reinterpret_cast<T>(cpu->pc());
}

template<typename T>
T CPUState::fp() const
{
    CPUState* cpu = const_cast<CPUState*>(this);
    return reinterpret_cast<T>(cpu->fp());
}

template<typename T>
T CPUState::sp() const
{
    CPUState* cpu = const_cast<CPUState*>(this);
    return reinterpret_cast<T>(cpu->sp());
}

struct State;
typedef void (SYSV_ABI *StackInitializationFunction)(State*);

#if CPU(ARM64E)
#define PROBE_FUNCTION_PTRAUTH __ptrauth(ptrauth_key_process_dependent_code, 0, JITProbePtrTag)
#define PROBE_STACK_INITIALIZATION_FUNCTION_PTRAUTH __ptrauth(ptrauth_key_process_dependent_code, 0, JITProbeStackInitializationFunctionPtrTag)
#else
#define PROBE_FUNCTION_PTRAUTH
#define PROBE_STACK_INITIALIZATION_FUNCTION_PTRAUTH
#endif

struct State {
    Probe::Function PROBE_FUNCTION_PTRAUTH probeFunction;
    void* arg;
    StackInitializationFunction PROBE_STACK_INITIALIZATION_FUNCTION_PTRAUTH initializeStackFunction;
    void* initializeStackArg;
    CPUState cpu;
};

class Context {
    WTF_MAKE_TZONE_ALLOCATED(Context);
public:
    using RegisterID = MacroAssembler::RegisterID;
    using SPRegisterID = MacroAssembler::SPRegisterID;
    using FPRegisterID = MacroAssembler::FPRegisterID;

    Context(State* state)
        : cpu(state->cpu)
        , m_state(state)
    { }

    template<typename T>
    T arg() { return reinterpret_cast<T>(m_state->arg); }

    UCPURegister& gpr(RegisterID id) { return cpu.gpr(id); }
    UCPURegister& spr(SPRegisterID id) { return cpu.spr(id); }
    double& fpr(FPRegisterID id, SavedFPWidth savedFPWidth = SavedFPWidth::DontSaveVectors)
    {
        if (savedFPWidth == SavedFPWidth::SaveVectors)
            return cpu.fpr<SavedFPWidth::SaveVectors>(id);
        return cpu.fpr<SavedFPWidth::DontSaveVectors>(id);
    }
#if CPU(X86_64) || CPU(ARM64)
    v128_t& vector(FPRegisterID id) { return cpu.vector(id); }
#endif
    ASCIILiteral gprName(RegisterID id) { return cpu.gprName(id); }
    ASCIILiteral sprName(SPRegisterID id) { return cpu.sprName(id); }
    ASCIILiteral fprName(FPRegisterID id) { return cpu.fprName(id); }

    template<typename T> T gpr(RegisterID id) const { return cpu.gpr<T>(id); }
    template<typename T> T spr(SPRegisterID id) const { return cpu.spr<T>(id); }
    template<typename T> T fpr(FPRegisterID id) const { return cpu.fpr<T>(id); }

    void*& pc() { return cpu.pc(); }
    void*& fp() { return cpu.fp(); }
    void*& sp() { return cpu.sp(); }

    template<typename T> T pc() { return cpu.pc<T>(); }
    template<typename T> T fp() { return cpu.fp<T>(); }
    template<typename T> T sp() { return cpu.sp<T>(); }

    Stack& stack()
    {
        ASSERT(m_stack.isValid());
        return m_stack;
    };

    bool hasWritesToFlush() { return m_stack.hasWritesToFlush(); }
    Stack* releaseStack() { return new Stack(WTFMove(m_stack)); }

    CPUState& cpu;

private:
    State* m_state;
    Stack m_stack;

    friend JS_EXPORT_PRIVATE void* probeStateForContext(Context&); // Not for general use. This should only be for writing tests.
};

extern "C" void SYSV_ABI executeJSCJITProbe(State*) REFERENCED_FROM_ASM WTF_INTERNAL;

} // namespace Probe
} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END

#endif // ENABLE(ASSEMBLER)
