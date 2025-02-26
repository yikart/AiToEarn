/*
 * Copyright (C) 2012-2017 Apple Inc. All rights reserved.
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

// This is guarded by ENABLE_DFG_JIT only because it uses some value profiles
// that are currently only used if the DFG is enabled (i.e. they are not
// available in the profile-only configuration). Hopefully someday all of
// these #if's will disappear...
#if ENABLE(DFG_JIT)

#include "BytecodeIndex.h"
#include "CodeOrigin.h"
#include "GPRInfo.h"
#include "Operands.h"
#include "TagRegistersMode.h"

namespace JSC {

class UnaryArithProfile;
class BinaryArithProfile;
class CCallHelpers;
class CodeBlock;
struct ValueProfile;

class MethodOfGettingAValueProfile {
public:
    MethodOfGettingAValueProfile()
        : m_kind(Kind::None)
    {
    }

    static MethodOfGettingAValueProfile unaryArithProfile(CodeOrigin codeOrigin)
    {
        MethodOfGettingAValueProfile result;
        result.m_kind = Kind::UnaryArithProfile;
        result.m_codeOrigin = codeOrigin;
        return result;
    }

    static MethodOfGettingAValueProfile binaryArithProfile(CodeOrigin codeOrigin)
    {
        MethodOfGettingAValueProfile result;
        result.m_kind = Kind::BinaryArithProfile;
        result.m_codeOrigin = codeOrigin;
        return result;
    }

    static MethodOfGettingAValueProfile argumentValueProfile(CodeOrigin codeOrigin, Operand operand)
    {
        MethodOfGettingAValueProfile result;
        result.m_kind = Kind::ArgumentValueProfile;
        result.m_codeOrigin = codeOrigin;
        result.m_rawOperand = operand.asBits();
        return result;
    }

    static MethodOfGettingAValueProfile bytecodeValueProfile(CodeOrigin codeOrigin)
    {
        MethodOfGettingAValueProfile result;
        result.m_kind = Kind::BytecodeValueProfile;
        result.m_codeOrigin = codeOrigin;
        return result;
    }

    static MethodOfGettingAValueProfile lazyOperandValueProfile(CodeOrigin codeOrigin, Operand operand)
    {
        MethodOfGettingAValueProfile result;
        result.m_kind = Kind::LazyOperandValueProfile;
        result.m_codeOrigin = codeOrigin;
        result.m_rawOperand = operand.asBits();
        return result;
    }

    explicit operator bool() const { return m_kind != Kind::None; }

    // The temporary register is only needed on 64-bits builds (for testing BigInt32).
    void emitReportValue(CCallHelpers&, CodeBlock* optimizedCodeBlock, JSValueRegs, GPRReg tempGPR, TagRegistersMode = HaveTagRegisters) const;

private:
    enum class Kind : uint8_t {
        None,
        UnaryArithProfile,
        BinaryArithProfile,
        BytecodeValueProfile,
        ArgumentValueProfile,
        LazyOperandValueProfile,
    };
    static constexpr unsigned bitsOfKind = 3;
    static_assert(static_cast<unsigned>(Kind::LazyOperandValueProfile) <= ((1U << bitsOfKind) - 1));

    CodeOrigin m_codeOrigin;
    uint64_t m_rawOperand : Operand::maxBits { 0 };
    Kind m_kind : bitsOfKind;
};

} // namespace JSC

#endif // ENABLE(DFG_JIT)
