/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
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

#if ENABLE(ASSEMBLER)

#include "FPRInfo.h"
#include "GPRInfo.h"
#include "MacroAssembler.h"
#include "Reg.h"

namespace JSC {

template<typename T>
class RegisterMap {
public:
    T& operator[](Reg reg)
    {
        return m_map[reg.index()];
    }

    T& operator[](GPRReg gpr)
    {
        return m_map[MacroAssembler::registerIndex(gpr)];
    }

    T& operator[](FPRReg fpr)
    {
        return m_map[MacroAssembler::registerIndex(fpr)];
    }

    const T& operator[](Reg reg) const
    {
        return m_map[reg.index()];
    }

    const T& operator[](GPRReg gpr) const
    {
        return m_map[MacroAssembler::registerIndex(gpr)];
    }

    const T& operator[](FPRReg fpr) const
    {
        return m_map[MacroAssembler::registerIndex(fpr)];
    }

private:
    std::array<T, MacroAssembler::totalNumberOfRegisters()> m_map { { } };
};

template<typename T>
class GPRMap {
public:
    T& operator[](GPRReg gpr)
    {
        return m_map[MacroAssembler::registerIndex(gpr)];
    }

    const T& operator[](GPRReg gpr) const
    {
        return m_map[MacroAssembler::registerIndex(gpr)];
    }

private:
    std::array<T, MacroAssembler::numberOfRegisters()> m_map { { } };
};

template<typename T>
class FPRMap {
public:
    T& operator[](FPRReg fpr)
    {
        return m_map[MacroAssembler::fpRegisterIndex(fpr)];
    }

    const T& operator[](FPRReg fpr) const
    {
        return m_map[MacroAssembler::fpRegisterIndex(fpr)];
    }

private:
    std::array<T, MacroAssembler::numberOfFPRegisters()> m_map { { } };
};

} // namespace JSC

#endif // ENABLE(ASSEMBLER)
