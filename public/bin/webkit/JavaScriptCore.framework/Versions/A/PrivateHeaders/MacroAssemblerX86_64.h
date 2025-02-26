/*
 * Copyright (C) 2008-2022 Apple Inc. All rights reserved.
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

#if ENABLE(ASSEMBLER) && CPU(X86_64)

#include "X86Assembler.h"
#include "AbstractMacroAssembler.h"
#include <array>
#include <wtf/TZoneMalloc.h>

#define REPATCH_OFFSET_CALL_R11 3

inline bool CAN_SIGN_EXTEND_32_64(int64_t value) { return value == (int64_t)(int32_t)value; }

namespace JSC {

using Assembler = TARGET_ASSEMBLER;

class MacroAssemblerX86_64 : public AbstractMacroAssembler<Assembler> {
    WTF_MAKE_TZONE_ALLOCATED(MacroAssemblerX86_64);
public:
    static constexpr size_t nearJumpRange = 2 * GB;

    // Use this directly only if you're not generating code with it.
    static constexpr X86Registers::RegisterID s_scratchRegister = X86Registers::r11;
    static constexpr X86Registers::XMMRegisterID fpTempRegister = X86Registers::xmm15;

    // Use this when generating code so that we get enforcement of the disallowing of scratch register
    // usage.
    X86Registers::RegisterID scratchRegister()
    {
        RELEASE_ASSERT(m_allowScratchRegister);
        return s_scratchRegister;
    }

    static constexpr int DoubleConditionBitInvert = 0x10;
    static constexpr int DoubleConditionBitSpecial = 0x20;
    static constexpr int DoubleConditionBits = DoubleConditionBitInvert | DoubleConditionBitSpecial;

    typedef X86Assembler::XMMRegisterID XMMRegisterID;

    static bool isCompactPtrAlignedAddressOffset(ptrdiff_t value)
    {
        return value >= -128 && value <= 127;
    }

    enum RelationalCondition {
        Equal = X86Assembler::ConditionE,
        NotEqual = X86Assembler::ConditionNE,
        Above = X86Assembler::ConditionA,
        AboveOrEqual = X86Assembler::ConditionAE,
        Below = X86Assembler::ConditionB,
        BelowOrEqual = X86Assembler::ConditionBE,
        GreaterThan = X86Assembler::ConditionG,
        GreaterThanOrEqual = X86Assembler::ConditionGE,
        LessThan = X86Assembler::ConditionL,
        LessThanOrEqual = X86Assembler::ConditionLE
    };

    enum ResultCondition {
        Carry = X86Assembler::ConditionC,
        Overflow = X86Assembler::ConditionO,
        Signed = X86Assembler::ConditionS,
        PositiveOrZero = X86Assembler::ConditionNS,
        Zero = X86Assembler::ConditionE,
        NonZero = X86Assembler::ConditionNE
    };

    // FIXME: it would be neat to rename this to FloatingPointCondition in every assembler.
    enum DoubleCondition {
        // These conditions will only evaluate to true if the comparison is ordered - i.e. neither operand is NaN.
        DoubleEqualAndOrdered = X86Assembler::ConditionE | DoubleConditionBitSpecial,
        DoubleNotEqualAndOrdered = X86Assembler::ConditionNE,
        DoubleGreaterThanAndOrdered = X86Assembler::ConditionA,
        DoubleGreaterThanOrEqualAndOrdered = X86Assembler::ConditionAE,
        DoubleLessThanAndOrdered = X86Assembler::ConditionA | DoubleConditionBitInvert,
        DoubleLessThanOrEqualAndOrdered = X86Assembler::ConditionAE | DoubleConditionBitInvert,
        // If either operand is NaN, these conditions always evaluate to true.
        DoubleEqualOrUnordered = X86Assembler::ConditionE,
        DoubleNotEqualOrUnordered = X86Assembler::ConditionNE | DoubleConditionBitSpecial,
        DoubleGreaterThanOrUnordered = X86Assembler::ConditionB | DoubleConditionBitInvert,
        DoubleGreaterThanOrEqualOrUnordered = X86Assembler::ConditionBE | DoubleConditionBitInvert,
        DoubleLessThanOrUnordered = X86Assembler::ConditionB,
        DoubleLessThanOrEqualOrUnordered = X86Assembler::ConditionBE,
    };
    static_assert(
        !((X86Assembler::ConditionE | X86Assembler::ConditionNE | X86Assembler::ConditionA | X86Assembler::ConditionAE | X86Assembler::ConditionB | X86Assembler::ConditionBE) & DoubleConditionBits),
        "DoubleConditionBits should not interfere with X86Assembler Condition codes");

    static constexpr RegisterID stackPointerRegister = X86Registers::esp;
    static constexpr RegisterID framePointerRegister = X86Registers::ebp;

    static bool constexpr canBlind() { return true; }
    static bool constexpr shouldBlindForSpecificArch(uint32_t value) { return value >= 0x00ffffff; }
    static bool constexpr shouldBlindForSpecificArch(uint64_t value) { return value >= 0x00ffffff; }

    static constexpr unsigned numGPRs = 16;
    static constexpr unsigned numFPRs = 16;

    static constexpr RegisterID InvalidGPRReg = X86Registers::InvalidGPRReg;

    // Integer arithmetic operations:
    //
    // Operations are typically two operand - operation(source, srcDst)
    // For many operations the source may be an TrustedImm32, the srcDst operand
    // may often be a memory location (explicitly described using an Address
    // object).

    void add32(RegisterID src, RegisterID dest)
    {
        m_assembler.addl_rr(src, dest);
    }

    void add32(TrustedImm32 imm, Address address)
    {
        m_assembler.addl_im(imm.m_value, address.offset, address.base);
    }

    void add32(TrustedImm32 imm, BaseIndex address)
    {
        m_assembler.addl_im(imm.m_value, address.offset, address.base, address.index, address.scale);
    }

    void add8(TrustedImm32 imm, Address address)
    {
        TrustedImm32 imm8(static_cast<int8_t>(imm.m_value));
        m_assembler.addb_im(imm8.m_value, address.offset, address.base);
    }

    void add8(TrustedImm32 imm, BaseIndex address)
    {
        TrustedImm32 imm8(static_cast<int8_t>(imm.m_value));
        m_assembler.addb_im(imm8.m_value, address.offset, address.base, address.index, address.scale);
    }

    void add16(TrustedImm32 imm, Address address)
    {
        m_assembler.addw_im(imm.m_value, address.offset, address.base);
    }

    void add16(TrustedImm32 imm, BaseIndex address)
    {
        m_assembler.addw_im(imm.m_value, address.offset, address.base, address.index, address.scale);
    }

    void add32(TrustedImm32 imm, RegisterID dest)
    {
        if (imm.m_value == 1)
            m_assembler.inc_r(dest);
        else
            m_assembler.addl_ir(imm.m_value, dest);
    }

    void add32(Address src, RegisterID dest)
    {
        m_assembler.addl_mr(src.offset, src.base, dest);
    }

    void add32(BaseIndex src, RegisterID dest)
    {
        m_assembler.addl_mr(src.offset, src.base, src.index, src.scale, dest);
    }

    void add32(RegisterID src, Address dest)
    {
        m_assembler.addl_rm(src, dest.offset, dest.base);
    }

    void add32(RegisterID src, BaseIndex dest)
    {
        m_assembler.addl_rm(src, dest.offset, dest.base, dest.index, dest.scale);
    }

    void add8(RegisterID src, Address dest)
    {
        m_assembler.addb_rm(src, dest.offset, dest.base);
    }

    void add8(RegisterID src, BaseIndex dest)
    {
        m_assembler.addb_rm(src, dest.offset, dest.base, dest.index, dest.scale);
    }

    void add16(RegisterID src, Address dest)
    {
        m_assembler.addw_rm(src, dest.offset, dest.base);
    }

    void add16(RegisterID src, BaseIndex dest)
    {
        m_assembler.addw_rm(src, dest.offset, dest.base, dest.index, dest.scale);
    }

    void add32(TrustedImm32 imm, RegisterID src, RegisterID dest)
    {
        if (!imm.m_value) {
            zeroExtend32ToWord(src, dest);
            return;
        }

        if (src == dest) {
            add32(imm, dest);
            return;
        }

        m_assembler.leal_mr(imm.m_value, src, dest);
    }

    void add32(RegisterID a, RegisterID b, RegisterID dest)
    {
        x86Lea32(BaseIndex(a, b, TimesOne), dest);
    }

    void x86Lea32(BaseIndex index, RegisterID dest)
    {
        if (!index.scale && !index.offset) {
            if (index.base == dest) {
                add32(index.index, dest);
                return;
            }
            if (index.index == dest) {
                add32(index.base, dest);
                return;
            }
        }
        m_assembler.leal_mr(index.offset, index.base, index.index, index.scale, dest);
    }

    void and32(RegisterID src, RegisterID dest)
    {
        m_assembler.andl_rr(src, dest);
    }

    void and32(TrustedImm32 imm, RegisterID dest)
    {
        m_assembler.andl_ir(imm.m_value, dest);
    }

    void and32(RegisterID src, Address dest)
    {
        m_assembler.andl_rm(src, dest.offset, dest.base);
    }

    void and32(RegisterID src, BaseIndex dest)
    {
        m_assembler.andl_rm(src, dest.offset, dest.base, dest.index, dest.scale);
    }

    void and16(RegisterID src, Address dest)
    {
        m_assembler.andw_rm(src, dest.offset, dest.base);
    }

    void and16(RegisterID src, BaseIndex dest)
    {
        m_assembler.andw_rm(src, dest.offset, dest.base, dest.index, dest.scale);
    }

    void and8(RegisterID src, Address dest)
    {
        m_assembler.andb_rm(src, dest.offset, dest.base);
    }

    void and8(RegisterID src, BaseIndex dest)
    {
        m_assembler.andb_rm(src, dest.offset, dest.base, dest.index, dest.scale);
    }

    void and32(Address src, RegisterID dest)
    {
        m_assembler.andl_mr(src.offset, src.base, dest);
    }

    void and32(BaseIndex src, RegisterID dest)
    {
        m_assembler.andl_mr(src.offset, src.base, src.index, src.scale, dest);
    }

    void and16(Address src, RegisterID dest)
    {
        m_assembler.andw_mr(src.offset, src.base, dest);
    }

    void and16(BaseIndex src, RegisterID dest)
    {
        m_assembler.andw_mr(src.offset, src.base, src.index, src.scale, dest);
    }

    void and32(TrustedImm32 imm, Address address)
    {
        m_assembler.andl_im(imm.m_value, address.offset, address.base);
    }

    void and32(TrustedImm32 imm, BaseIndex address)
    {
        m_assembler.andl_im(imm.m_value, address.offset, address.base, address.index, address.scale);
    }

    void and16(TrustedImm32 imm, Address address)
    {
        m_assembler.andw_im(static_cast<int16_t>(imm.m_value), address.offset, address.base);
    }

    void and16(TrustedImm32 imm, BaseIndex address)
    {
        m_assembler.andw_im(static_cast<int16_t>(imm.m_value), address.offset, address.base, address.index, address.scale);
    }

    void and8(TrustedImm32 imm, Address address)
    {
        m_assembler.andb_im(static_cast<int8_t>(imm.m_value), address.offset, address.base);
    }

    void and8(TrustedImm32 imm, BaseIndex address)
    {
        m_assembler.andb_im(static_cast<int8_t>(imm.m_value), address.offset, address.base, address.index, address.scale);
    }

    void and32(RegisterID op1, RegisterID op2, RegisterID dest)
    {
        if (op1 == op2)
            zeroExtend32ToWord(op1, dest);
        else if (op1 == dest)
            and32(op2, dest);
        else {
            move32IfNeeded(op2, dest);
            and32(op1, dest);
        }
    }

    void and32(Address op1, RegisterID op2, RegisterID dest)
    {
        if (op2 == dest)
            and32(op1, dest);
        else if (op1.base == dest) {
            load32(op1, dest);
            and32(op2, dest);
        } else {
            zeroExtend32ToWord(op2, dest);
            and32(op1, dest);
        }
    }

    void and32(RegisterID op1, Address op2, RegisterID dest)
    {
        and32(op2, op1, dest);
    }

    void and32(TrustedImm32 imm, RegisterID src, RegisterID dest)
    {
        move32IfNeeded(src, dest);
        and32(imm, dest);
    }

    void countLeadingZeros32(RegisterID src, RegisterID dst)
    {
        if (supportsLZCNT()) {
            m_assembler.lzcnt_rr(src, dst);
            return;
        }
        m_assembler.bsr_rr(src, dst);
        clz32AfterBsr(dst);
    }

    void countLeadingZeros32(Address src, RegisterID dst)
    {
        if (supportsLZCNT()) {
            m_assembler.lzcnt_mr(src.offset, src.base, dst);
            return;
        }
        m_assembler.bsr_mr(src.offset, src.base, dst);
        clz32AfterBsr(dst);
    }

    void countTrailingZeros32(RegisterID src, RegisterID dst)
    {
        if (supportsBMI1()) {
            m_assembler.tzcnt_rr(src, dst);
            return;
        }
        m_assembler.bsf_rr(src, dst);
        ctzAfterBsf<32>(dst);
    }

    void countPopulation32(Address src, RegisterID dst)
    {
        ASSERT(supportsCountPopulation());
        m_assembler.popcnt_mr(src.offset, src.base, dst);
    }

    void countPopulation32(RegisterID src, RegisterID dst)
    {
        ASSERT(supportsCountPopulation());
        m_assembler.popcnt_rr(src, dst);
    }

    void countPopulation32(Address src, RegisterID dst, FPRegisterID)
    {
        ASSERT(supportsCountPopulation());
        m_assembler.popcnt_mr(src.offset, src.base, dst);
    }

    void countPopulation32(RegisterID src, RegisterID dst, FPRegisterID)
    {
        ASSERT(supportsCountPopulation());
        m_assembler.popcnt_rr(src, dst);
    }

    void byteSwap32(RegisterID dst)
    {
        m_assembler.bswapl_r(dst);
    }

    void byteSwap16(RegisterID dst)
    {
        m_assembler.rolw_i8r(8, dst);
        zeroExtend16To32(dst, dst);
    }

    void byteSwap64(RegisterID dst)
    {
        m_assembler.bswapq_r(dst);
    }

    // Only used for testing purposes.
    void illegalInstruction()
    {
        m_assembler.illegalInstruction();
    }

    void lshift32(RegisterID shift_amount, RegisterID dest)
    {
        if (shift_amount == X86Registers::ecx)
            m_assembler.shll_CLr(dest);
        else {
            ASSERT(shift_amount != dest);
            // On x86 we can only shift by ecx; if asked to shift by another register we'll
            // need rejig the shift amount into ecx first, and restore the registers afterwards.
            // If we dest is ecx, then shift the swapped register!
            swap(shift_amount, X86Registers::ecx);
            m_assembler.shll_CLr(dest == X86Registers::ecx ? shift_amount : dest);
            swap(shift_amount, X86Registers::ecx);
        }
    }

    void lshift32(RegisterID src, RegisterID shift_amount, RegisterID dest)
    {
        ASSERT(shift_amount != dest);

        move32IfNeeded(src, dest);
        lshift32(shift_amount, dest);
    }

    void lshift32(TrustedImm32 imm, RegisterID dest)
    {
        m_assembler.shll_i8r(imm.m_value, dest);
    }

    void lshift32(RegisterID src, TrustedImm32 imm, RegisterID dest)
    {
        move32IfNeeded(src, dest);
        lshift32(imm, dest);
    }

    void lshift32(Address src, RegisterID shiftAmount, RegisterID dest)
    {
        if (shiftAmount == dest) {
            move(shiftAmount, scratchRegister());
            load32(src, dest);
            lshift32(scratchRegister(), dest);
        } else {
            load32(src, dest);
            lshift32(shiftAmount, dest);
        }
    }

    void lshift32(TrustedImm32 imm, RegisterID shiftAmount, RegisterID dest)
    {
        if (shiftAmount == dest) {
            move(imm, scratchRegister());
            lshift32(shiftAmount, scratchRegister());
            move(scratchRegister(), dest);
        } else {
            move(imm, dest);
            lshift32(shiftAmount, dest);
        }
    }

    void mul32(RegisterID src, RegisterID dest)
    {
        m_assembler.imull_rr(src, dest);
    }

    void mul32(RegisterID src1, RegisterID src2, RegisterID dest)
    {
        if (src2 == dest) {
            m_assembler.imull_rr(src1, dest);
            return;
        }
        move32IfNeeded(src1, dest);
        m_assembler.imull_rr(src2, dest);
    }

    void mul32(Address src, RegisterID dest)
    {
        m_assembler.imull_mr(src.offset, src.base, dest);
    }

    void mul32(Address op1, RegisterID op2, RegisterID dest)
    {
        if (op2 == dest)
            mul32(op1, dest);
        else if (op1.base == dest) {
            load32(op1, dest);
            mul32(op2, dest);
        } else {
            zeroExtend32ToWord(op2, dest);
            mul32(op1, dest);
        }
    }

    void mul32(RegisterID src1, Address src2, RegisterID dest)
    {
        mul32(src2, src1, dest);
    }

    void mul32(TrustedImm32 imm, RegisterID src, RegisterID dest)
    {
        m_assembler.imull_i32r(src, imm.m_value, dest);
    }

    void x86ConvertToDoubleWord32()
    {
        m_assembler.cdq();
    }

    void x86ConvertToDoubleWord32(RegisterID eax, RegisterID edx)
    {
        ASSERT_UNUSED(eax, eax == X86Registers::eax);
        ASSERT_UNUSED(edx, edx == X86Registers::edx);
        x86ConvertToDoubleWord32();
    }

    void x86Div32(RegisterID denominator)
    {
        m_assembler.idivl_r(denominator);
    }

    void x86Div32(RegisterID eax, RegisterID edx, RegisterID denominator)
    {
        ASSERT_UNUSED(eax, eax == X86Registers::eax);
        ASSERT_UNUSED(edx, edx == X86Registers::edx);
        x86Div32(denominator);
    }

    void x86UDiv32(RegisterID denominator)
    {
        m_assembler.divl_r(denominator);
    }

    void x86UDiv32(RegisterID eax, RegisterID edx, RegisterID denominator)
    {
        ASSERT_UNUSED(eax, eax == X86Registers::eax);
        ASSERT_UNUSED(edx, edx == X86Registers::edx);
        x86UDiv32(denominator);
    }

    void neg32(RegisterID srcDest)
    {
        m_assembler.negl_r(srcDest);
    }

    void neg32(RegisterID src, RegisterID dest)
    {
        move32IfNeeded(src, dest);
        m_assembler.negl_r(dest);
    }

    void neg32(Address srcDest)
    {
        m_assembler.negl_m(srcDest.offset, srcDest.base);
    }

    void neg32(BaseIndex srcDest)
    {
        m_assembler.negl_m(srcDest.offset, srcDest.base, srcDest.index, srcDest.scale);
    }

    void neg16(Address srcDest)
    {
        m_assembler.negw_m(srcDest.offset, srcDest.base);
    }

    void neg16(BaseIndex srcDest)
    {
        m_assembler.negw_m(srcDest.offset, srcDest.base, srcDest.index, srcDest.scale);
    }

    void neg8(Address srcDest)
    {
        m_assembler.negb_m(srcDest.offset, srcDest.base);
    }

    void neg8(BaseIndex srcDest)
    {
        m_assembler.negb_m(srcDest.offset, srcDest.base, srcDest.index, srcDest.scale);
    }

    void or32(RegisterID src, RegisterID dest)
    {
        m_assembler.orl_rr(src, dest);
    }

    void or32(TrustedImm32 imm, RegisterID dest)
    {
        m_assembler.orl_ir(imm.m_value, dest);
    }

    void or32(RegisterID src, Address dest)
    {
        m_assembler.orl_rm(src, dest.offset, dest.base);
    }

    void or32(RegisterID src, BaseIndex dest)
    {
        m_assembler.orl_rm(src, dest.offset, dest.base, dest.index, dest.scale);
    }

    void or16(RegisterID src, Address dest)
    {
        m_assembler.orw_rm(src, dest.offset, dest.base);
    }

    void or16(RegisterID src, BaseIndex dest)
    {
        m_assembler.orw_rm(src, dest.offset, dest.base, dest.index, dest.scale);
    }

    void or8(RegisterID src, Address dest)
    {
        m_assembler.orb_rm(src, dest.offset, dest.base);
    }

    void or8(RegisterID src, BaseIndex dest)
    {
        m_assembler.orb_rm(src, dest.offset, dest.base, dest.index, dest.scale);
    }

    void or8(RegisterID src, AbsoluteAddress address)
    {
        move(TrustedImmPtr(address.m_ptr), scratchRegister());
        or8(src, Address(scratchRegister()));
    }

    void or32(Address src, RegisterID dest)
    {
        m_assembler.orl_mr(src.offset, src.base, dest);
    }

    void or32(BaseIndex src, RegisterID dest)
    {
        m_assembler.orl_mr(src.offset, src.base, src.index, src.scale, dest);
    }

    void or32(TrustedImm32 imm, Address address)
    {
        m_assembler.orl_im(imm.m_value, address.offset, address.base);
    }

    void or32(TrustedImm32 imm, BaseIndex address)
    {
        m_assembler.orl_im(imm.m_value, address.offset, address.base, address.index, address.scale);
    }

    void or16(TrustedImm32 imm, Address address)
    {
        m_assembler.orw_im(static_cast<int16_t>(imm.m_value), address.offset, address.base);
    }

    void or16(TrustedImm32 imm, BaseIndex address)
    {
        m_assembler.orw_im(static_cast<int16_t>(imm.m_value), address.offset, address.base, address.index, address.scale);
    }

    void or8(TrustedImm32 imm, Address address)
    {
        m_assembler.orb_im(static_cast<int8_t>(imm.m_value), address.offset, address.base);
    }

    void or8(TrustedImm32 imm, BaseIndex address)
    {
        m_assembler.orb_im(static_cast<int8_t>(imm.m_value), address.offset, address.base, address.index, address.scale);
    }

    void or8(TrustedImm32 imm, AbsoluteAddress address)
    {
        move(TrustedImmPtr(address.m_ptr), scratchRegister());
        or8(imm, Address(scratchRegister()));
    }

    void or32(RegisterID op1, RegisterID op2, RegisterID dest)
    {
        if (op1 == op2)
            zeroExtend32ToWord(op1, dest);
        else if (op1 == dest)
            or32(op2, dest);
        else {
            move32IfNeeded(op2, dest);
            or32(op1, dest);
        }
    }

    void or32(Address op1, RegisterID op2, RegisterID dest)
    {
        if (op2 == dest)
            or32(op1, dest);
        else if (op1.base == dest) {
            load32(op1, dest);
            or32(op2, dest);
        } else {
            zeroExtend32ToWord(op2, dest);
            or32(op1, dest);
        }
    }

    void or32(RegisterID op1, Address op2, RegisterID dest)
    {
        or32(op2, op1, dest);
    }

    void or32(TrustedImm32 imm, RegisterID src, RegisterID dest)
    {
        move32IfNeeded(src, dest);
        or32(imm, dest);
    }

    void rshift32(RegisterID shift_amount, RegisterID dest)
    {
        if (shift_amount == X86Registers::ecx)
            m_assembler.sarl_CLr(dest);
        else {
            ASSERT(shift_amount != dest);

            // On x86 we can only shift by ecx; if asked to shift by another register we'll
            // need rejig the shift amount into ecx first, and restore the registers afterwards.
            // If we dest is ecx, then shift the swapped register!
            swap(shift_amount, X86Registers::ecx);
            m_assembler.sarl_CLr(dest == X86Registers::ecx ? shift_amount : dest);
            swap(shift_amount, X86Registers::ecx);
        }
    }

    void rshift32(RegisterID src, RegisterID shift_amount, RegisterID dest)
    {
        ASSERT(shift_amount != dest);

        move32IfNeeded(src, dest);
        rshift32(shift_amount, dest);
    }

    void rshift32(TrustedImm32 imm, RegisterID dest)
    {
        m_assembler.sarl_i8r(imm.m_value, dest);
    }

    void rshift32(RegisterID src, TrustedImm32 imm, RegisterID dest)
    {
        move32IfNeeded(src, dest);
        rshift32(imm, dest);
    }

    void urshift32(RegisterID shift_amount, RegisterID dest)
    {
        if (shift_amount == X86Registers::ecx)
            m_assembler.shrl_CLr(dest);
        else {
            ASSERT(shift_amount != dest);

            // On x86 we can only shift by ecx; if asked to shift by another register we'll
            // need rejig the shift amount into ecx first, and restore the registers afterwards.
            // If we dest is ecx, then shift the swapped register!
            swap(shift_amount, X86Registers::ecx);
            m_assembler.shrl_CLr(dest == X86Registers::ecx ? shift_amount : dest);
            swap(shift_amount, X86Registers::ecx);
        }
    }

    void urshift32(RegisterID src, RegisterID shift_amount, RegisterID dest)
    {
        ASSERT(shift_amount != dest);

        move32IfNeeded(src, dest);
        urshift32(shift_amount, dest);
    }

    void urshift32(TrustedImm32 imm, RegisterID dest)
    {
        m_assembler.shrl_i8r(imm.m_value, dest);
    }

    void urshift32(RegisterID src, TrustedImm32 imm, RegisterID dest)
    {
        move32IfNeeded(src, dest);
        urshift32(imm, dest);
    }

    void rotateRight32(TrustedImm32 imm, RegisterID dest)
    {
        m_assembler.rorl_i8r(imm.m_value, dest);
    }

    void rotateRight32(RegisterID src, RegisterID dest)
    {
        if (src == X86Registers::ecx)
            m_assembler.rorl_CLr(dest);
        else {
            ASSERT(src != dest);

            // Can only rotate by ecx, so we do some swapping if we see anything else.
            swap(src, X86Registers::ecx);
            m_assembler.rorl_CLr(dest == X86Registers::ecx ? src : dest);
            swap(src, X86Registers::ecx);
        }
    }

    void rotateRight32(RegisterID src, TrustedImm32 shift_amount, RegisterID dest)
    {
        move32IfNeeded(src, dest);
        rotateRight32(shift_amount, dest);
    }

    void rotateRight32(RegisterID src, RegisterID shift_amount, RegisterID dest)
    {
        ASSERT(shift_amount != dest);

        move32IfNeeded(src, dest);
        rotateRight32(shift_amount, dest);
    }

    void rotateLeft32(TrustedImm32 imm, RegisterID dest)
    {
        m_assembler.roll_i8r(imm.m_value, dest);
    }

    void rotateLeft32(RegisterID src, RegisterID dest)
    {
        if (src == X86Registers::ecx)
            m_assembler.roll_CLr(dest);
        else {
            ASSERT(src != dest);

            // Can only rotate by ecx, so we do some swapping if we see anything else.
            swap(src, X86Registers::ecx);
            m_assembler.roll_CLr(dest == X86Registers::ecx ? src : dest);
            swap(src, X86Registers::ecx);
        }
    }

    void rotateLeft32(RegisterID src, TrustedImm32 shift_amount, RegisterID dest)
    {
        move32IfNeeded(src, dest);
        rotateLeft32(shift_amount, dest);
    }

    void rotateLeft32(RegisterID src, RegisterID shift_amount, RegisterID dest)
    {
        ASSERT(shift_amount != dest);

        move32IfNeeded(src, dest);
        rotateLeft32(shift_amount, dest);
    }

    void sub32(RegisterID src, RegisterID dest)
    {
        m_assembler.subl_rr(src, dest);
    }

    void sub32(RegisterID left, RegisterID right, RegisterID dest)
    {
        if (dest == right) {
            neg32(dest);
            add32(left, dest);
            return;
        }
        move(left, dest);
        sub32(right, dest);
    }

    void sub32(RegisterID src, TrustedImm32 imm, RegisterID dest)
    {
        if (!imm.m_value) {
            zeroExtend32ToWord(src, dest);
            return;
        }

        if (src == dest) {
            sub32(imm, dest);
            return;
        }

        // Add a negative using lea
        m_assembler.leal_mr(WTF::negate(imm.m_value), src, dest);
    }

    void sub32(TrustedImm32 imm, RegisterID dest)
    {
        if (imm.m_value == 1)
            m_assembler.dec_r(dest);
        else
            m_assembler.subl_ir(imm.m_value, dest);
    }

    void sub32(TrustedImm32 imm, Address address)
    {
        m_assembler.subl_im(imm.m_value, address.offset, address.base);
    }

    void sub16(TrustedImm32 imm, Address address)
    {
        m_assembler.subw_im(static_cast<int16_t>(imm.m_value), address.offset, address.base);
    }

    void sub8(TrustedImm32 imm, Address address)
    {
        m_assembler.subb_im(static_cast<int8_t>(imm.m_value), address.offset, address.base);
    }

    void sub32(TrustedImm32 imm, BaseIndex address)
    {
        m_assembler.subl_im(imm.m_value, address.offset, address.base, address.index, address.scale);
    }

    void sub16(TrustedImm32 imm, BaseIndex address)
    {
        m_assembler.subw_im(static_cast<int16_t>(imm.m_value), address.offset, address.base, address.index, address.scale);
    }

    void sub8(TrustedImm32 imm, BaseIndex address)
    {
        m_assembler.subb_im(static_cast<int8_t>(imm.m_value), address.offset, address.base, address.index, address.scale);
    }

    void sub32(Address src, RegisterID dest)
    {
        m_assembler.subl_mr(src.offset, src.base, dest);
    }

    void sub32(BaseIndex src, RegisterID dest)
    {
        m_assembler.subl_mr(src.offset, src.base, src.index, src.scale, dest);
    }

    void sub32(RegisterID src, Address dest)
    {
        m_assembler.subl_rm(src, dest.offset, dest.base);
    }

    void sub16(RegisterID src, Address dest)
    {
        m_assembler.subw_rm(src, dest.offset, dest.base);
    }

    void sub8(RegisterID src, Address dest)
    {
        m_assembler.subb_rm(src, dest.offset, dest.base);
    }

    void sub32(RegisterID src, BaseIndex dest)
    {
        m_assembler.subl_rm(src, dest.offset, dest.base, dest.index, dest.scale);
    }

    void sub16(RegisterID src, BaseIndex dest)
    {
        m_assembler.subw_rm(src, dest.offset, dest.base, dest.index, dest.scale);
    }

    void sub8(RegisterID src, BaseIndex dest)
    {
        m_assembler.subb_rm(src, dest.offset, dest.base, dest.index, dest.scale);
    }

    void xor32(RegisterID src, RegisterID dest)
    {
        m_assembler.xorl_rr(src, dest);
    }

    void xor32(TrustedImm32 imm, Address dest)
    {
        if (imm.m_value == -1)
            m_assembler.notl_m(dest.offset, dest.base);
        else
            m_assembler.xorl_im(imm.m_value, dest.offset, dest.base);
    }

    void xor32(TrustedImm32 imm, BaseIndex dest)
    {
        if (imm.m_value == -1)
            m_assembler.notl_m(dest.offset, dest.base, dest.index, dest.scale);
        else
            m_assembler.xorl_im(imm.m_value, dest.offset, dest.base, dest.index, dest.scale);
    }

    void xor16(TrustedImm32 imm, Address dest)
    {
        imm.m_value = static_cast<int16_t>(imm.m_value);
        if (imm.m_value == -1)
            m_assembler.notw_m(dest.offset, dest.base);
        else
            m_assembler.xorw_im(imm.m_value, dest.offset, dest.base);
    }

    void xor16(TrustedImm32 imm, BaseIndex dest)
    {
        imm.m_value = static_cast<int16_t>(imm.m_value);
        if (imm.m_value == -1)
            m_assembler.notw_m(dest.offset, dest.base, dest.index, dest.scale);
        else
            m_assembler.xorw_im(imm.m_value, dest.offset, dest.base, dest.index, dest.scale);
    }

    void xor8(TrustedImm32 imm, Address dest)
    {
        imm.m_value = static_cast<int8_t>(imm.m_value);
        if (imm.m_value == -1)
            m_assembler.notb_m(dest.offset, dest.base);
        else
            m_assembler.xorb_im(imm.m_value, dest.offset, dest.base);
    }

    void xor8(TrustedImm32 imm, BaseIndex dest)
    {
        imm.m_value = static_cast<int8_t>(imm.m_value);
        if (imm.m_value == -1)
            m_assembler.notb_m(dest.offset, dest.base, dest.index, dest.scale);
        else
            m_assembler.xorb_im(imm.m_value, dest.offset, dest.base, dest.index, dest.scale);
    }

    void xor32(TrustedImm32 imm, RegisterID dest)
    {
        if (imm.m_value == -1)
            m_assembler.notl_r(dest);
        else
            m_assembler.xorl_ir(imm.m_value, dest);
    }

    void xor32(RegisterID src, Address dest)
    {
        m_assembler.xorl_rm(src, dest.offset, dest.base);
    }

    void xor32(RegisterID src, BaseIndex dest)
    {
        m_assembler.xorl_rm(src, dest.offset, dest.base, dest.index, dest.scale);
    }

    void xor16(RegisterID src, Address dest)
    {
        m_assembler.xorw_rm(src, dest.offset, dest.base);
    }

    void xor16(RegisterID src, BaseIndex dest)
    {
        m_assembler.xorw_rm(src, dest.offset, dest.base, dest.index, dest.scale);
    }

    void xor8(RegisterID src, Address dest)
    {
        m_assembler.xorb_rm(src, dest.offset, dest.base);
    }

    void xor8(RegisterID src, BaseIndex dest)
    {
        m_assembler.xorb_rm(src, dest.offset, dest.base, dest.index, dest.scale);
    }

    void xor32(Address src, RegisterID dest)
    {
        m_assembler.xorl_mr(src.offset, src.base, dest);
    }

    void xor32(BaseIndex src, RegisterID dest)
    {
        m_assembler.xorl_mr(src.offset, src.base, src.index, src.scale, dest);
    }

    void xor32(RegisterID op1, RegisterID op2, RegisterID dest)
    {
        if (op1 == op2)
            move(TrustedImm32(0), dest);
        else if (op1 == dest)
            xor32(op2, dest);
        else {
            move32IfNeeded(op2, dest);
            xor32(op1, dest);
        }
    }

    void xor32(Address op1, RegisterID op2, RegisterID dest)
    {
        if (op2 == dest)
            xor32(op1, dest);
        else if (op1.base == dest) {
            load32(op1, dest);
            xor32(op2, dest);
        } else {
            zeroExtend32ToWord(op2, dest);
            xor32(op1, dest);
        }
    }

    void xor32(RegisterID op1, Address op2, RegisterID dest)
    {
        xor32(op2, op1, dest);
    }

    void xor32(TrustedImm32 imm, RegisterID src, RegisterID dest)
    {
        move32IfNeeded(src, dest);
        xor32(imm, dest);
    }

    void not32(RegisterID srcDest)
    {
        m_assembler.notl_r(srcDest);
    }

    void not32(Address dest)
    {
        m_assembler.notl_m(dest.offset, dest.base);
    }

    void not32(BaseIndex dest)
    {
        m_assembler.notl_m(dest.offset, dest.base, dest.index, dest.scale);
    }

    void not16(Address dest)
    {
        m_assembler.notw_m(dest.offset, dest.base);
    }

    void not16(BaseIndex dest)
    {
        m_assembler.notw_m(dest.offset, dest.base, dest.index, dest.scale);
    }

    void not8(Address dest)
    {
        m_assembler.notb_m(dest.offset, dest.base);
    }

    void not8(BaseIndex dest)
    {
        m_assembler.notb_m(dest.offset, dest.base, dest.index, dest.scale);
    }

    void sqrtDouble(FPRegisterID src, FPRegisterID dst)
    {
        if (supportsAVX())
            m_assembler.vsqrtsd_rrr(src, dst, dst);
        else
            m_assembler.sqrtsd_rr(src, dst);
    }

    void sqrtDouble(Address src, FPRegisterID dst)
    {
        if (supportsAVX())
            m_assembler.vsqrtsd_mrr(src.offset, src.base, dst, dst);
        else
            m_assembler.sqrtsd_mr(src.offset, src.base, dst);
    }

    void sqrtFloat(FPRegisterID src, FPRegisterID dst)
    {
        if (supportsAVX())
            m_assembler.vsqrtss_rrr(src, dst, dst);
        else
            m_assembler.sqrtss_rr(src, dst);
    }

    void sqrtFloat(Address src, FPRegisterID dst)
    {
        if (supportsAVX())
            m_assembler.vsqrtss_mrr(src.offset, src.base, dst, dst);
        else
            m_assembler.sqrtss_mr(src.offset, src.base, dst);
    }

    void absDouble(FPRegisterID src, FPRegisterID dst)
    {
        ASSERT(src != dst);
        move64ToDouble(TrustedImm64(std::bit_cast<int64_t>(-0.0)), dst);
        if (supportsAVX())
            m_assembler.vandnpd_rrr(src, dst, dst);
        else
            m_assembler.andnpd_rr(src, dst);
    }

    void negateDouble(FPRegisterID src, FPRegisterID dst)
    {
        ASSERT(src != dst);
        static constexpr double negativeZeroConstant = -0.0;
        loadDouble(TrustedImmPtr(&negativeZeroConstant), dst);
        if (supportsAVX())
            m_assembler.vxorpd_rrr(src, dst, dst);
        else
            m_assembler.xorpd_rr(src, dst);
    }

    void ceilDouble(FPRegisterID src, FPRegisterID dst)
    {
        if (supportsAVX())
            m_assembler.vroundsd_i8rrr(X86Assembler::RoundingType::TowardInfiniti, src, dst, dst);
        else
            m_assembler.roundsd_rr(src, dst, X86Assembler::RoundingType::TowardInfiniti);
    }

    void ceilDouble(Address src, FPRegisterID dst)
    {
        if (supportsAVX())
            m_assembler.vroundsd_i8mrr(X86Assembler::RoundingType::TowardInfiniti, src.offset, src.base, dst, dst);
        else
            m_assembler.roundsd_mr(src.offset, src.base, dst, X86Assembler::RoundingType::TowardInfiniti);
    }

    void ceilFloat(FPRegisterID src, FPRegisterID dst)
    {
        if (supportsAVX())
            m_assembler.vroundss_i8rrr(X86Assembler::RoundingType::TowardInfiniti, src, dst, dst);
        else
            m_assembler.roundss_rr(src, dst, X86Assembler::RoundingType::TowardInfiniti);
    }

    void ceilFloat(Address src, FPRegisterID dst)
    {
        if (supportsAVX())
            m_assembler.vroundss_i8mrr(X86Assembler::RoundingType::TowardInfiniti, src.offset, src.base, dst, dst);
        else
            m_assembler.roundss_mr(src.offset, src.base, dst, X86Assembler::RoundingType::TowardInfiniti);
    }

    void floorDouble(FPRegisterID src, FPRegisterID dst)
    {
        if (supportsAVX())
            m_assembler.vroundsd_i8rrr(X86Assembler::RoundingType::TowardNegativeInfiniti, src, dst, dst);
        else
            m_assembler.roundsd_rr(src, dst, X86Assembler::RoundingType::TowardNegativeInfiniti);
    }

    void floorDouble(Address src, FPRegisterID dst)
    {
        if (supportsAVX())
            m_assembler.vroundsd_i8mrr(X86Assembler::RoundingType::TowardNegativeInfiniti, src.offset, src.base, dst, dst);
        else
            m_assembler.roundsd_mr(src.offset, src.base, dst, X86Assembler::RoundingType::TowardNegativeInfiniti);
    }

    void floorFloat(FPRegisterID src, FPRegisterID dst)
    {
        if (supportsAVX())
            m_assembler.vroundss_i8rrr(X86Assembler::RoundingType::TowardNegativeInfiniti, src, dst, dst);
        else
            m_assembler.roundss_rr(src, dst, X86Assembler::RoundingType::TowardNegativeInfiniti);
    }

    void floorFloat(Address src, FPRegisterID dst)
    {
        if (supportsAVX())
            m_assembler.vroundss_i8mrr(X86Assembler::RoundingType::TowardNegativeInfiniti, src.offset, src.base, dst, dst);
        else
            m_assembler.roundss_mr(src.offset, src.base, dst, X86Assembler::RoundingType::TowardNegativeInfiniti);
    }

    void roundTowardNearestIntDouble(FPRegisterID src, FPRegisterID dst)
    {
        if (supportsAVX())
            m_assembler.vroundsd_i8rrr(X86Assembler::RoundingType::ToNearestWithTiesToEven, src, dst, dst);
        else
            m_assembler.roundsd_rr(src, dst, X86Assembler::RoundingType::ToNearestWithTiesToEven);
    }

    void roundTowardNearestIntFloat(FPRegisterID src, FPRegisterID dst)
    {
        if (supportsAVX())
            m_assembler.vroundss_i8rrr(X86Assembler::RoundingType::ToNearestWithTiesToEven, src, dst, dst);
        else
            m_assembler.roundss_rr(src, dst, X86Assembler::RoundingType::ToNearestWithTiesToEven);
    }

    void roundTowardZeroDouble(FPRegisterID src, FPRegisterID dst)
    {
        if (supportsAVX())
            m_assembler.vroundsd_i8rrr(X86Assembler::RoundingType::TowardZero, src, dst, dst);
        else
            m_assembler.roundsd_rr(src, dst, X86Assembler::RoundingType::TowardZero);
    }

    void roundTowardZeroDouble(Address src, FPRegisterID dst)
    {
        if (supportsAVX())
            m_assembler.vroundsd_i8mrr(X86Assembler::RoundingType::TowardZero, src.offset, src.base, dst, dst);
        else
            m_assembler.roundsd_mr(src.offset, src.base, dst, X86Assembler::RoundingType::TowardZero);
    }

    void roundTowardZeroFloat(FPRegisterID src, FPRegisterID dst)
    {
        if (supportsAVX())
            m_assembler.vroundss_i8rrr(X86Assembler::RoundingType::TowardZero, src, dst, dst);
        else
            m_assembler.roundss_rr(src, dst, X86Assembler::RoundingType::TowardZero);
    }

    void roundTowardZeroFloat(Address src, FPRegisterID dst)
    {
        if (supportsAVX())
            m_assembler.vroundss_i8mrr(X86Assembler::RoundingType::TowardZero, src.offset, src.base, dst, dst);
        else
            m_assembler.roundss_mr(src.offset, src.base, dst, X86Assembler::RoundingType::TowardZero);
    }

    // Memory access operations:
    //
    // Loads are of the form load(address, destination) and stores of the form
    // store(source, address).  The source for a store may be an TrustedImm32.  Address
    // operand objects to loads and store will be implicitly constructed if a
    // register is passed.

    void load32(Address address, RegisterID dest)
    {
        m_assembler.movl_mr(address.offset, address.base, dest);
    }

    void load32(BaseIndex address, RegisterID dest)
    {
        m_assembler.movl_mr(address.offset, address.base, address.index, address.scale, dest);
    }

    void load32WithUnalignedHalfWords(BaseIndex address, RegisterID dest)
    {
        load32(address, dest);
    }

    void load16Unaligned(Address address, RegisterID dest)
    {
        load16(address, dest);
    }

    void load16Unaligned(BaseIndex address, RegisterID dest)
    {
        load16(address, dest);
    }

    DataLabelCompact loadCompactWithAddressOffsetPatch(Address address, RegisterID dest)
    {
        padBeforePatch();
        m_assembler.movl_mr_disp8(address.offset, address.base, dest);
        return DataLabelCompact(this);
    }

    void load8(BaseIndex address, RegisterID dest)
    {
        m_assembler.movzbl_mr(address.offset, address.base, address.index, address.scale, dest);
    }

    void load8(Address address, RegisterID dest)
    {
        m_assembler.movzbl_mr(address.offset, address.base, dest);
    }

    void load8SignedExtendTo32(BaseIndex address, RegisterID dest)
    {
        m_assembler.movsbl_mr(address.offset, address.base, address.index, address.scale, dest);
    }

    void load8SignedExtendTo32(Address address, RegisterID dest)
    {
        m_assembler.movsbl_mr(address.offset, address.base, dest);
    }

    void zeroExtend8To32(RegisterID src, RegisterID dest)
    {
        m_assembler.movzbl_rr(src, dest);
    }

    void signExtend8To32(RegisterID src, RegisterID dest)
    {
        m_assembler.movsbl_rr(src, dest);
    }

    void load16(Address address, RegisterID dest)
    {
        m_assembler.movzwl_mr(address.offset, address.base, dest);
    }

    void load16(BaseIndex address, RegisterID dest)
    {
        m_assembler.movzwl_mr(address.offset, address.base, address.index, address.scale, dest);
    }

    void load16SignedExtendTo32(BaseIndex address, RegisterID dest)
    {
        m_assembler.movswl_mr(address.offset, address.base, address.index, address.scale, dest);
    }

    void load16SignedExtendTo32(Address address, RegisterID dest)
    {
        m_assembler.movswl_mr(address.offset, address.base, dest);
    }

    void loadPair32(RegisterID src, RegisterID dest1, RegisterID dest2)
    {
        loadPair32(src, TrustedImm32(0), dest1, dest2);
    }

    void loadPair32(RegisterID src, TrustedImm32 offset, RegisterID dest1, RegisterID dest2)
    {
        ASSERT(dest1 != dest2); // If it is the same, ldp becomes illegal instruction.
        if (src == dest1) {
            load32(Address(src, offset.m_value + 4), dest2);
            load32(Address(src, offset.m_value), dest1);
        } else {
            load32(Address(src, offset.m_value), dest1);
            load32(Address(src, offset.m_value + 4), dest2);
        }
    }

    void loadPair32(Address src, RegisterID dest1, RegisterID dest2)
    {
        loadPair32(src.base, TrustedImm32(src.offset), dest1, dest2);
    }

    void zeroExtend16To32(RegisterID src, RegisterID dest)
    {
        m_assembler.movzwl_rr(src, dest);
    }

    void signExtend16To32(RegisterID src, RegisterID dest)
    {
        m_assembler.movswl_rr(src, dest);
    }

    void store32(RegisterID src, Address address)
    {
        m_assembler.movl_rm(src, address.offset, address.base);
    }

    void store32(RegisterID src, BaseIndex address)
    {
        m_assembler.movl_rm(src, address.offset, address.base, address.index, address.scale);
    }

    void store32(TrustedImm32 imm, Address address)
    {
        m_assembler.movl_i32m(imm.m_value, address.offset, address.base);
    }

    void store32(TrustedImm32 imm, BaseIndex address)
    {
        m_assembler.movl_i32m(imm.m_value, address.offset, address.base, address.index, address.scale);
    }

    void store8(TrustedImm32 imm, Address address)
    {
        TrustedImm32 imm8(static_cast<int8_t>(imm.m_value));
        m_assembler.movb_i8m(imm8.m_value, address.offset, address.base);
    }

    void store8(TrustedImm32 imm, BaseIndex address)
    {
        TrustedImm32 imm8(static_cast<int8_t>(imm.m_value));
        m_assembler.movb_i8m(imm8.m_value, address.offset, address.base, address.index, address.scale);
    }

    void storePair32(RegisterID src1, RegisterID src2, RegisterID dest)
    {
        storePair32(src1, src2, dest, TrustedImm32(0));
    }

    void storePair32(RegisterID src1, RegisterID src2, RegisterID dest, TrustedImm32 offset)
    {
        store32(src1, Address(dest, offset.m_value));
        store32(src2, Address(dest, offset.m_value + 4));
    }

    void storePair32(RegisterID src1, RegisterID src2, Address dest)
    {
        storePair32(src1, src2, dest.base, TrustedImm32(dest.offset));
    }

    static ALWAYS_INLINE RegisterID getUnusedRegister(BaseIndex address)
    {
        if (address.base != X86Registers::eax && address.index != X86Registers::eax)
            return X86Registers::eax;

        if (address.base != X86Registers::ebx && address.index != X86Registers::ebx)
            return X86Registers::ebx;

        ASSERT(address.base != X86Registers::ecx && address.index != X86Registers::ecx);
        return X86Registers::ecx;
    }

    static ALWAYS_INLINE RegisterID getUnusedRegister(Address address)
    {
        if (address.base != X86Registers::eax)
            return X86Registers::eax;

        ASSERT(address.base != X86Registers::edx);
        return X86Registers::edx;
    }

    void store8(RegisterID src, BaseIndex address)
    {
        m_assembler.movb_rm(src, address.offset, address.base, address.index, address.scale);
    }

    void store8(RegisterID src, Address address)
    {
        m_assembler.movb_rm(src, address.offset, address.base);
    }

    void store16(RegisterID src, BaseIndex address)
    {
        m_assembler.movw_rm(src, address.offset, address.base, address.index, address.scale);
    }

    void store16(RegisterID src, Address address)
    {
        m_assembler.movw_rm(src, address.offset, address.base);
    }

    void store16(TrustedImm32 imm, BaseIndex address)
    {
        m_assembler.movw_im(static_cast<int16_t>(imm.m_value), address.offset, address.base, address.index, address.scale);
    }

    void store16(TrustedImm32 imm, Address address)
    {
        m_assembler.movw_im(static_cast<int16_t>(imm.m_value), address.offset, address.base);
    }

    // Floating-point operation:
    //
    void moveDouble(FPRegisterID src, FPRegisterID dest)
    {
        if (src == dest)
            return;
        if (supportsAVX())
            m_assembler.vmovaps_rr(src, dest);
        else
            m_assembler.movaps_rr(src, dest);
    }

    void loadDouble(TrustedImmPtr address, FPRegisterID dest)
    {
        move(address, scratchRegister());
        loadDouble(Address(scratchRegister()), dest);
    }

    void loadDouble(Address address, FPRegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vmovsd_mr(address.offset, address.base, dest);
        else
            m_assembler.movsd_mr(address.offset, address.base, dest);
    }

    void loadDouble(BaseIndex address, FPRegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vmovsd_mr(address.offset, address.base, address.index, address.scale, dest);
        else
            m_assembler.movsd_mr(address.offset, address.base, address.index, address.scale, dest);
    }

    void loadFloat(TrustedImmPtr address, FPRegisterID dest)
    {
        move(address, scratchRegister());
        loadFloat(Address(scratchRegister()), dest);
    }

    void loadFloat(Address address, FPRegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vmovss_mr(address.offset, address.base, dest);
        else
            m_assembler.movss_mr(address.offset, address.base, dest);
    }

    void loadFloat(BaseIndex address, FPRegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vmovss_mr(address.offset, address.base, address.index, address.scale, dest);
        else
            m_assembler.movss_mr(address.offset, address.base, address.index, address.scale, dest);
    }

    void storeDouble(FPRegisterID src, Address address)
    {
        if (supportsAVX())
            m_assembler.vmovsd_rm(src, address.offset, address.base);
        else
            m_assembler.movsd_rm(src, address.offset, address.base);
    }

    void storeDouble(FPRegisterID src, BaseIndex address)
    {
        if (supportsAVX())
            m_assembler.vmovsd_rm(src, address.offset, address.base, address.index, address.scale);
        else
            m_assembler.movsd_rm(src, address.offset, address.base, address.index, address.scale);
    }

    void storeFloat(FPRegisterID src, Address address)
    {
        if (supportsAVX())
            m_assembler.vmovss_rm(src, address.offset, address.base);
        else
            m_assembler.movss_rm(src, address.offset, address.base);
    }

    void storeFloat(FPRegisterID src, BaseIndex address)
    {
        if (supportsAVX())
            m_assembler.vmovss_rm(src, address.offset, address.base, address.index, address.scale);
        else
            m_assembler.movss_rm(src, address.offset, address.base, address.index, address.scale);
    }

    void convertDoubleToFloat(FPRegisterID src, FPRegisterID dst)
    {
        if (supportsAVX())
            m_assembler.vcvtsd2ss_rrr(src, dst, dst);
        else
            m_assembler.cvtsd2ss_rr(src, dst);
    }

    void convertDoubleToFloat(Address address, FPRegisterID dst)
    {
        if (supportsAVX())
            m_assembler.vcvtsd2ss_mrr(address.offset, address.base, dst, dst);
        else
            m_assembler.cvtsd2ss_mr(address.offset, address.base, dst);
    }

    void convertFloatToDouble(FPRegisterID src, FPRegisterID dst)
    {
        if (supportsAVX())
            m_assembler.vcvtss2sd_rrr(src, dst, dst);
        else
            m_assembler.cvtss2sd_rr(src, dst);
    }

    void convertFloatToDouble(Address address, FPRegisterID dst)
    {
        if (supportsAVX())
            m_assembler.vcvtss2sd_mrr(address.offset, address.base, dst, dst);
        else
            m_assembler.cvtss2sd_mr(address.offset, address.base, dst);
    }

    void addDouble(FPRegisterID src, FPRegisterID dest)
    {
        addDouble(src, dest, dest);
    }

    void addDouble(FPRegisterID op1, FPRegisterID op2, FPRegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vaddsd_rrr(op1, op2, dest);
        else {
            if (op1 == dest)
                m_assembler.addsd_rr(op2, dest);
            else {
                moveDouble(op2, dest);
                m_assembler.addsd_rr(op1, dest);
            }
        }
    }

    void addDouble(Address src, FPRegisterID dest)
    {
        addDouble(src, dest, dest);
    }

    void addDouble(Address op1, FPRegisterID op2, FPRegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vaddsd_mrr(op1.offset, op1.base, op2, dest);
        else {
            if (op2 == dest) {
                m_assembler.addsd_mr(op1.offset, op1.base, dest);
                return;
            }

            loadDouble(op1, dest);
            addDouble(op2, dest);
        }
    }

    void addDouble(FPRegisterID op1, Address op2, FPRegisterID dest)
    {
        addDouble(op2, op1, dest);
    }

    void addDouble(BaseIndex op1, FPRegisterID op2, FPRegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vaddsd_mrr(op1.offset, op1.base, op1.index, op1.scale, op2, dest);
        else {
            if (op2 == dest) {
                m_assembler.addsd_mr(op1.offset, op1.base, op1.index, op1.scale, dest);
                return;
            }
            loadDouble(op1, dest);
            addDouble(op2, dest);
        }
    }

    void addFloat(FPRegisterID src, FPRegisterID dest)
    {
        addFloat(src, dest, dest);
    }

    void addFloat(Address src, FPRegisterID dest)
    {
        addFloat(src, dest, dest);
    }

    void addFloat(FPRegisterID op1, FPRegisterID op2, FPRegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vaddss_rrr(op1, op2, dest);
        else {
            if (op1 == dest)
                m_assembler.addss_rr(op2, dest);
            else {
                moveDouble(op2, dest);
                m_assembler.addss_rr(op1, dest);
            }
        }
    }

    void addFloat(Address op1, FPRegisterID op2, FPRegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vaddss_mrr(op1.offset, op1.base, op2, dest);
        else {
            if (op2 == dest) {
                m_assembler.addss_mr(op1.offset, op1.base, dest);
                return;
            }

            loadFloat(op1, dest);
            addFloat(op2, dest);
        }
    }

    void addFloat(FPRegisterID op1, Address op2, FPRegisterID dest)
    {
        addFloat(op2, op1, dest);
    }

    void addFloat(BaseIndex op1, FPRegisterID op2, FPRegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vaddss_mrr(op1.offset, op1.base, op1.index, op1.scale, op2, dest);
        else {
            if (op2 == dest) {
                m_assembler.addss_mr(op1.offset, op1.base, op1.index, op1.scale, dest);
                return;
            }
            loadFloat(op1, dest);
            addFloat(op2, dest);
        }
    }

    void divDouble(FPRegisterID src, FPRegisterID dest)
    {
        // dest = dest / src
        // https://www.felixcloutier.com/x86/divsd
        // VEX.LIG.F2.0F.WIG 5E /r VDIVSD xmm1, xmm2, xmm3/m64
        // B   NA   ModRM:reg (w)   VEX.vvvv (r)   ModRM:r/m (r)   NA
        if (supportsAVX())
            m_assembler.vdivsd_rrr(src, dest, dest);
        else
            m_assembler.divsd_rr(src, dest);
    }

    void divDouble(FPRegisterID op1, FPRegisterID op2, FPRegisterID dest)
    {
        // dest = op1 / op2
        if (supportsAVX())
            m_assembler.vdivsd_rrr(op2, op1, dest);
        else {
            // B := A / B is invalid.
            if (op1 != dest && op2 == dest) {
                moveDouble(op2, fpTempRegister);
                moveDouble(op1, dest);
                divDouble(fpTempRegister, dest);
                return;
            }
            moveDouble(op1, dest);
            divDouble(op2, dest);
        }
    }

    void divDouble(Address src, FPRegisterID dest)
    {
        // dest = dest / src
        if (supportsAVX())
            m_assembler.vdivsd_mrr(src.offset, src.base, dest, dest);
        else
            m_assembler.divsd_mr(src.offset, src.base, dest);
    }

    void divFloat(FPRegisterID src, FPRegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vdivss_rrr(src, dest, dest);
        else
            m_assembler.divss_rr(src, dest);
    }

    void divFloat(Address src, FPRegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vdivss_mrr(src.offset, src.base, dest, dest);
        else
            m_assembler.divss_mr(src.offset, src.base, dest);
    }

    void divFloat(FPRegisterID op1, FPRegisterID op2, FPRegisterID dest)
    {
        // dest = op1 / op2
        if (supportsAVX())
            m_assembler.vdivss_rrr(op2, op1, dest);
        else {
            // B := A / B is invalid.
            if (op1 != dest && op2 == dest) {
                moveDouble(op2, fpTempRegister);
                moveDouble(op1, dest);
                divFloat(fpTempRegister, dest);
                return;
            }
            moveDouble(op1, dest);
            divFloat(op2, dest);
        }
    }

    void subDouble(FPRegisterID src, FPRegisterID dest)
    {
        subDouble(dest, src, dest);
    }

    void subDouble(FPRegisterID op1, FPRegisterID op2, FPRegisterID dest)
    {
        // dest = op1 - op2
        if (supportsAVX())
            m_assembler.vsubsd_rrr(op2, op1, dest);
        else {
            // B := A - B is invalid.
            if (op1 != dest && op2 == dest) {
                moveDouble(op2, fpTempRegister);
                moveDouble(op1, dest);
                m_assembler.subsd_rr(fpTempRegister, dest);
                return;
            }
            moveDouble(op1, dest);
            m_assembler.subsd_rr(op2, dest);
        }
    }

    void subDouble(FPRegisterID op1, Address op2, FPRegisterID dest)
    {
        // dest = op1 - op2
        if (supportsAVX())
            m_assembler.vsubsd_mrr(op2.offset, op2.base, op1, dest);
        else {
            moveDouble(op1, dest);
            m_assembler.subsd_mr(op2.offset, op2.base, dest);
        }
    }

    void subDouble(FPRegisterID op1, BaseIndex op2, FPRegisterID dest)
    {
        // dest = op1 - op2
        if (supportsAVX())
            m_assembler.vsubsd_mrr(op2.offset, op2.base, op2.index, op2.scale, op1, dest);
        else {
            moveDouble(op1, dest);
            m_assembler.subsd_mr(op2.offset, op2.base, op2.index, op2.scale, dest);
        }
    }

    void subDouble(Address src, FPRegisterID dest)
    {
        subDouble(dest, src, dest);
    }

    void subFloat(FPRegisterID src, FPRegisterID dest)
    {
        subFloat(dest, src, dest);
    }

    void subFloat(FPRegisterID op1, FPRegisterID op2, FPRegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vsubss_rrr(op2, op1, dest);
        else {
            // B := A - B is invalid.
            if (op1 != dest && op2 == dest) {
                moveDouble(op2, fpTempRegister);
                moveDouble(op1, dest);
                m_assembler.subss_rr(fpTempRegister, dest);
                return;
            }
            moveDouble(op1, dest);
            m_assembler.subss_rr(op2, dest);
        }
    }

    void subFloat(FPRegisterID op1, Address op2, FPRegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vsubss_mrr(op2.offset, op2.base, op1, dest);
        else {
            moveDouble(op1, dest);
            m_assembler.subss_mr(op2.offset, op2.base, dest);
        }
    }

    void subFloat(FPRegisterID op1, BaseIndex op2, FPRegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vsubss_mrr(op2.offset, op2.base, op2.index, op2.scale, op1, dest);
        else {
            moveDouble(op1, dest);
            m_assembler.subss_mr(op2.offset, op2.base, op2.index, op2.scale, dest);
        }
    }

    void subFloat(Address src, FPRegisterID dest)
    {
        subFloat(dest, src, dest);
    }

    void mulDouble(FPRegisterID src, FPRegisterID dest)
    {
        mulDouble(src, dest, dest);
    }

    void mulDouble(FPRegisterID op1, FPRegisterID op2, FPRegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vmulsd_rrr(op1, op2, dest);
        else {
            if (op1 == dest)
                m_assembler.mulsd_rr(op2, dest);
            else {
                moveDouble(op2, dest);
                m_assembler.mulsd_rr(op1, dest);
            }
        }
    }

    void mulDouble(Address src, FPRegisterID dest)
    {
        mulDouble(src, dest, dest);
    }

    void mulDouble(Address op1, FPRegisterID op2, FPRegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vmulsd_mrr(op1.offset, op1.base, op2, dest);
        else {
            if (op2 == dest) {
                m_assembler.mulsd_mr(op1.offset, op1.base, dest);
                return;
            }
            loadDouble(op1, dest);
            mulDouble(op2, dest);
        }
    }

    void mulDouble(FPRegisterID op1, Address op2, FPRegisterID dest)
    {
        return mulDouble(op2, op1, dest);
    }

    void mulDouble(BaseIndex op1, FPRegisterID op2, FPRegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vmulsd_mrr(op1.offset, op1.base, op1.index, op1.scale, op2, dest);
        else {
            if (op2 == dest) {
                m_assembler.mulsd_mr(op1.offset, op1.base, op1.index, op1.scale, dest);
                return;
            }
            loadDouble(op1, dest);
            mulDouble(op2, dest);
        }
    }

    void mulFloat(FPRegisterID src, FPRegisterID dest)
    {
        mulFloat(src, dest, dest);
    }

    void mulFloat(Address src, FPRegisterID dest)
    {
        mulFloat(src, dest, dest);
    }

    void mulFloat(FPRegisterID op1, FPRegisterID op2, FPRegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vmulss_rrr(op1, op2, dest);
        else {
            if (op1 == dest)
                m_assembler.mulss_rr(op2, dest);
            else {
                moveDouble(op2, dest);
                m_assembler.mulss_rr(op1, dest);
            }
        }
    }

    void mulFloat(Address op1, FPRegisterID op2, FPRegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vmulss_mrr(op1.offset, op1.base, op2, dest);
        else {
            if (op2 == dest) {
                m_assembler.mulss_mr(op1.offset, op1.base, dest);
                return;
            }
            loadFloat(op1, dest);
            mulFloat(op2, dest);
        }
    }

    void mulFloat(FPRegisterID op1, Address op2, FPRegisterID dest)
    {
        mulFloat(op2, op1, dest);
    }

    void mulFloat(BaseIndex op1, FPRegisterID op2, FPRegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vmulss_mrr(op1.offset, op1.base, op1.index, op1.scale, op2, dest);
        else {
            if (op2 == dest) {
                m_assembler.mulss_mr(op1.offset, op1.base, op1.index, op1.scale, dest);
                return;
            }
            loadFloat(op1, dest);
            mulFloat(op2, dest);
        }
    }

    void andDouble(FPRegisterID src, FPRegisterID dst)
    {
        // ANDPS is defined on 128bits and is shorter than ANDPD.
        if (supportsAVX())
            m_assembler.vandps_rrr(src, dst, dst);
        else
            m_assembler.andps_rr(src, dst);
    }

    void andDouble(FPRegisterID src1, FPRegisterID src2, FPRegisterID dst)
    {
        if (supportsAVX())
            m_assembler.vandps_rrr(src2, src1, dst);
        else {
            if (src1 == dst)
                andDouble(src2, dst);
            else {
                moveDouble(src2, dst);
                andDouble(src1, dst);
            }
        }
    }

    void andFloat(FPRegisterID src, FPRegisterID dst)
    {
        if (supportsAVX())
            m_assembler.vandps_rrr(src, dst, dst);
        else
            m_assembler.andps_rr(src, dst);
    }

    void andFloat(FPRegisterID src1, FPRegisterID src2, FPRegisterID dst)
    {
        if (supportsAVX())
            m_assembler.vandps_rrr(src2, src1, dst);
        else {
            if (src1 == dst)
                andFloat(src2, dst);
            else {
                moveDouble(src2, dst);
                andFloat(src1, dst);
            }
        }
    }

    void orDouble(FPRegisterID src, FPRegisterID dst)
    {
        if (supportsAVX())
            m_assembler.vorps_rrr(src, dst, dst);
        else
            m_assembler.orps_rr(src, dst);
    }

    void orDouble(FPRegisterID src1, FPRegisterID src2, FPRegisterID dst)
    {
        if (supportsAVX())
            m_assembler.vorps_rrr(src2, src1, dst);
        else {
            if (src1 == dst)
                orDouble(src2, dst);
            else {
                moveDouble(src2, dst);
                orDouble(src1, dst);
            }
        }
    }

    void orFloat(FPRegisterID src, FPRegisterID dst)
    {
        if (supportsAVX())
            m_assembler.vorps_rrr(src, dst, dst);
        else
            m_assembler.orps_rr(src, dst);
    }

    void orFloat(FPRegisterID src1, FPRegisterID src2, FPRegisterID dst)
    {
        if (supportsAVX())
            m_assembler.vorps_rrr(src2, src1, dst);
        else {
            if (src1 == dst)
                orFloat(src2, dst);
            else {
                moveDouble(src2, dst);
                orFloat(src1, dst);
            }
        }
    }

    void xorDouble(FPRegisterID src, FPRegisterID dst)
    {
        if (supportsAVX())
            m_assembler.vxorps_rrr(src, dst, dst);
        else
            m_assembler.xorps_rr(src, dst);
    }

    void xorDouble(FPRegisterID src1, FPRegisterID src2, FPRegisterID dst)
    {
        if (supportsAVX())
            m_assembler.vxorps_rrr(src2, src1, dst);
        else {
            if (src1 == dst)
                xorDouble(src2, dst);
            else {
                moveDouble(src2, dst);
                xorDouble(src1, dst);
            }
        }
    }

    void xorFloat(FPRegisterID src, FPRegisterID dst)
    {
        if (supportsAVX())
            m_assembler.vxorps_rrr(src, dst, dst);
        else
            m_assembler.xorps_rr(src, dst);
    }

    void xorFloat(FPRegisterID src1, FPRegisterID src2, FPRegisterID dst)
    {
        if (supportsAVX())
            m_assembler.vxorps_rrr(src2, src1, dst);
        else {
            if (src1 == dst)
                xorFloat(src2, dst);
            else {
                moveDouble(src2, dst);
                xorFloat(src1, dst);
            }
        }
    }

    void convertInt32ToDouble(RegisterID src, FPRegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vcvtsi2sd_rrr(src, dest, dest);
        else
            m_assembler.cvtsi2sd_rr(src, dest);
    }

    void convertInt32ToDouble(Address src, FPRegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vcvtsi2sd_mrr(src.offset, src.base, dest, dest);
        else
            m_assembler.cvtsi2sd_mr(src.offset, src.base, dest);
    }

    void convertInt32ToFloat(RegisterID src, FPRegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vcvtsi2ss_rrr(src, dest, dest);
        else
            m_assembler.cvtsi2ss_rr(src, dest);
    }

    void convertInt32ToFloat(Address src, FPRegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vcvtsi2ss_mrr(src.offset, src.base, dest, dest);
        else
            m_assembler.cvtsi2ss_mr(src.offset, src.base, dest);
    }

    Jump branchDouble(DoubleCondition cond, FPRegisterID left, FPRegisterID right)
    {
        if (cond & DoubleConditionBitInvert) {
            if (supportsAVX())
                m_assembler.vucomisd_rr(left, right);
            else
                m_assembler.ucomisd_rr(left, right);
        } else {
            if (supportsAVX())
                m_assembler.vucomisd_rr(right, left);
            else
                m_assembler.ucomisd_rr(right, left);
        }
        return jumpAfterFloatingPointCompare(cond, left, right);
    }

    Jump branchFloat(DoubleCondition cond, FPRegisterID left, FPRegisterID right)
    {
        if (cond & DoubleConditionBitInvert) {
            if (supportsAVX())
                m_assembler.vucomiss_rr(left, right);
            else
                m_assembler.ucomiss_rr(left, right);
        } else {
            if (supportsAVX())
                m_assembler.vucomiss_rr(right, left);
            else
                m_assembler.ucomiss_rr(right, left);
        }
        return jumpAfterFloatingPointCompare(cond, left, right);
    }

    Jump branchDoubleWithZero(DoubleCondition cond, FPRegisterID left)
    {
        UNUSED_PARAM(cond);
        UNUSED_PARAM(left);
        UNREACHABLE_FOR_PLATFORM();
        return { };
    }

    Jump branchFloatWithZero(DoubleCondition cond, FPRegisterID left)
    {
        UNUSED_PARAM(cond);
        UNUSED_PARAM(left);
        UNREACHABLE_FOR_PLATFORM();
        return { };
    }

    void compareDouble(DoubleCondition cond, FPRegisterID left, FPRegisterID right, RegisterID dest)
    {
        floatingPointCompare(cond, left, right, dest, [this] (FPRegisterID arg1, FPRegisterID arg2) {
            if (supportsAVX())
                m_assembler.vucomisd_rr(arg1, arg2);
            else
                m_assembler.ucomisd_rr(arg1, arg2);
        });
    }

    void compareFloat(DoubleCondition cond, FPRegisterID left, FPRegisterID right, RegisterID dest)
    {
        floatingPointCompare(cond, left, right, dest, [this] (FPRegisterID arg1, FPRegisterID arg2) {
            if (supportsAVX())
                m_assembler.vucomiss_rr(arg1, arg2);
            else
                m_assembler.ucomiss_rr(arg1, arg2);
        });
    }

    void compareDoubleWithZero(DoubleCondition cond, FPRegisterID left, RegisterID dest)
    {
        UNUSED_PARAM(cond);
        UNUSED_PARAM(left);
        UNUSED_PARAM(dest);
        UNREACHABLE_FOR_PLATFORM();
    }

    void compareFloatWithZero(DoubleCondition cond, FPRegisterID left, RegisterID dest)
    {
        UNUSED_PARAM(cond);
        UNUSED_PARAM(left);
        UNUSED_PARAM(dest);
        UNREACHABLE_FOR_PLATFORM();
    }

    // Truncates 'src' to an integer, and places the resulting 'dest'.
    // If the result is not representable as a 32 bit value, branch.
    // May also branch for some values that are representable in 32 bits
    // (specifically, in this case, INT_MIN).
    enum BranchTruncateType { BranchIfTruncateFailed, BranchIfTruncateSuccessful };
    Jump branchTruncateDoubleToInt32(FPRegisterID src, RegisterID dest, BranchTruncateType branchType = BranchIfTruncateFailed)
    {
        if (supportsAVX())
            m_assembler.vcvttsd2si_rr(src, dest);
        else
            m_assembler.cvttsd2si_rr(src, dest);
        return branch32(branchType ? NotEqual : Equal, dest, TrustedImm32(0x80000000));
    }

    void truncateDoubleToInt32(FPRegisterID src, RegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vcvttsd2si_rr(src, dest);
        else
            m_assembler.cvttsd2si_rr(src, dest);
    }

    void truncateFloatToInt32(FPRegisterID src, RegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vcvttss2si_rr(src, dest);
        else
            m_assembler.cvttss2si_rr(src, dest);
    }

    // Convert 'src' to an integer, and places the resulting 'dest'.
    // If the result is not representable as a 32 bit value, branch.
    // May also branch for some values that are representable in 32 bits
    // (specifically, in this case, 0).
    void branchConvertDoubleToInt32(FPRegisterID src, RegisterID dest, JumpList& failureCases, FPRegisterID fpTemp, bool negZeroCheck = true)
    {
        if (supportsAVX())
            m_assembler.vcvttsd2si_rr(src, dest);
        else
            m_assembler.cvttsd2si_rr(src, dest);

        // If the result is zero, it might have been -0.0, and the double comparison won't catch this!
        if (negZeroCheck) {
            Jump valueIsNonZero = branchTest32(NonZero, dest);
            if (supportsAVX())
                m_assembler.vmovmskpd_rr(src, scratchRegister());
            else
                m_assembler.movmskpd_rr(src, scratchRegister());
            failureCases.append(branchTest32(NonZero, scratchRegister(), TrustedImm32(1)));
            valueIsNonZero.link(this);
        }

        // Convert the integer result back to float & compare to the original value - if not equal or unordered (NaN) then jump.
        convertInt32ToDouble(dest, fpTemp);
        if (supportsAVX())
            m_assembler.vucomisd_rr(fpTemp, src);
        else
            m_assembler.ucomisd_rr(fpTemp, src);
        failureCases.append(m_assembler.jp());
        failureCases.append(m_assembler.jne());
    }

    void moveZeroToDouble(FPRegisterID reg)
    {
        if (supportsAVX())
            m_assembler.vxorps_rrr(reg, reg, reg);
        else
            m_assembler.xorps_rr(reg, reg);
    }

    void moveZeroToFloat(FPRegisterID reg)
    {
        if (supportsAVX())
            m_assembler.vxorps_rrr(reg, reg, reg);
        else
            m_assembler.xorps_rr(reg, reg);
    }

    Jump branchDoubleNonZero(FPRegisterID reg, FPRegisterID scratch)
    {
        if (supportsAVX())
            m_assembler.vxorpd_rrr(scratch, scratch, scratch);
        else
            m_assembler.xorpd_rr(scratch, scratch);
        return branchDouble(DoubleNotEqualAndOrdered, reg, scratch);
    }

    Jump branchDoubleZeroOrNaN(FPRegisterID reg, FPRegisterID scratch)
    {
        if (supportsAVX())
            m_assembler.vxorpd_rrr(scratch, scratch, scratch);
        else
            m_assembler.xorpd_rr(scratch, scratch);
        return branchDouble(DoubleEqualOrUnordered, reg, scratch);
    }

    void moveFloatTo32(FPRegisterID src, RegisterID dst)
    {
        if (supportsAVX())
            m_assembler.vmovd_rr(src, dst);
        else
            m_assembler.movd_rr(src, dst);
    }

    // Stack manipulation operations:
    //
    // The ABI is assumed to provide a stack abstraction to memory,
    // containing machine word sized units of data.  Push and pop
    // operations add and remove a single register sized unit of data
    // to or from the stack.  Peek and poke operations read or write
    // values on the stack, without moving the current stack position.

    void pop(RegisterID dest)
    {
        m_assembler.pop_r(dest);
    }

    void push(RegisterID src)
    {
        m_assembler.push_r(src);
    }

    void push(Address address)
    {
        m_assembler.push_m(address.offset, address.base);
    }

    void push(TrustedImm32 imm)
    {
        m_assembler.push_i32(imm.m_value);
    }

    void popPair(RegisterID dest1, RegisterID dest2)
    {
        pop(dest2);
        pop(dest1);
    }

    void pushPair(RegisterID src1, RegisterID src2)
    {
        push(src1);
        push(src2);
    }

    // Register move operations:
    //
    // Move values in registers.

    void move(TrustedImm32 imm, RegisterID dest)
    {
        // Note: on 64-bit the TrustedImm32 value is zero extended into the register, it
        // may be useful to have a separate version that sign extends the value?
        if (!imm.m_value)
            m_assembler.xorl_rr(dest, dest);
        else
            m_assembler.movl_i32r(imm.m_value, dest);
    }

    void move(RegisterID src, RegisterID dest)
    {
        // Note: on 64-bit this is is a full register move; perhaps it would be
        // useful to have separate move32 & movePtr, with move32 zero extending?
        if (src != dest)
            m_assembler.movq_rr(src, dest);
    }

    void move(TrustedImmPtr imm, RegisterID dest)
    {
        if (!imm.m_value)
            m_assembler.xorq_rr(dest, dest);
        else
            m_assembler.movq_i64r(imm.asIntptr(), dest);
    }

    void move(TrustedImm64 imm, RegisterID dest)
    {
        if (!imm.m_value)
            m_assembler.xorq_rr(dest, dest);
        else
            m_assembler.movq_i64r(imm.m_value, dest);
    }

    void moveConditionallyDouble(DoubleCondition cond, FPRegisterID left, FPRegisterID right, RegisterID src, RegisterID dest)
    {
        if (cond & DoubleConditionBitInvert) {
            if (supportsAVX())
                m_assembler.vucomisd_rr(left, right);
            else
                m_assembler.ucomisd_rr(left, right);
        } else {
            if (supportsAVX())
                m_assembler.vucomisd_rr(right, left);
            else
                m_assembler.ucomisd_rr(right, left);
        }
        moveConditionallyAfterFloatingPointCompare(cond, left, right, src, dest);
    }

    void moveConditionallyDouble(DoubleCondition cond, FPRegisterID left, FPRegisterID right, RegisterID thenCase, RegisterID elseCase, RegisterID dest)
    {
        if (thenCase != dest && elseCase != dest) {
            move(elseCase, dest);
            elseCase = dest;
        }

        RegisterID src;
        if (elseCase == dest)
            src = thenCase;
        else {
            cond = invert(cond);
            src = elseCase;
        }

        if (cond & DoubleConditionBitInvert) {
            if (supportsAVX())
                m_assembler.vucomisd_rr(left, right);
            else
                m_assembler.ucomisd_rr(left, right);
        } else {
            if (supportsAVX())
                m_assembler.vucomisd_rr(right, left);
            else
                m_assembler.ucomisd_rr(right, left);
        }
        moveConditionallyAfterFloatingPointCompare(cond, left, right, src, dest);
    }

    void moveConditionallyDoubleWithZero(DoubleCondition cond, FPRegisterID left, RegisterID src, RegisterID dest)
    {
        UNUSED_PARAM(cond);
        UNUSED_PARAM(left);
        UNUSED_PARAM(src);
        UNUSED_PARAM(dest);
        UNREACHABLE_FOR_PLATFORM();
    }

    void moveConditionallyDoubleWithZero(DoubleCondition cond, FPRegisterID left, RegisterID thenCase, RegisterID elseCase, RegisterID dest)
    {
        UNUSED_PARAM(cond);
        UNUSED_PARAM(left);
        UNUSED_PARAM(thenCase);
        UNUSED_PARAM(elseCase);
        UNUSED_PARAM(dest);
        UNREACHABLE_FOR_PLATFORM();
    }

    void moveConditionallyFloat(DoubleCondition cond, FPRegisterID left, FPRegisterID right, RegisterID src, RegisterID dest)
    {
        if (cond & DoubleConditionBitInvert) {
            if (supportsAVX())
                m_assembler.vucomiss_rr(left, right);
            else
                m_assembler.ucomiss_rr(left, right);
        } else {
            if (supportsAVX())
                m_assembler.vucomiss_rr(right, left);
            else
                m_assembler.ucomiss_rr(right, left);
        }
        moveConditionallyAfterFloatingPointCompare(cond, left, right, src, dest);
    }

    void moveConditionallyFloat(DoubleCondition cond, FPRegisterID left, FPRegisterID right, RegisterID thenCase, RegisterID elseCase, RegisterID dest)
    {
        if (thenCase != dest && elseCase != dest) {
            move(elseCase, dest);
            elseCase = dest;
        }

        RegisterID src;
        if (elseCase == dest)
            src = thenCase;
        else {
            cond = invert(cond);
            src = elseCase;
        }

        if (cond & DoubleConditionBitInvert) {
            if (supportsAVX())
                m_assembler.vucomiss_rr(left, right);
            else
                m_assembler.ucomiss_rr(left, right);
        } else {
            if (supportsAVX())
                m_assembler.vucomiss_rr(right, left);
            else
                m_assembler.ucomiss_rr(right, left);
        }
        moveConditionallyAfterFloatingPointCompare(cond, left, right, src, dest);
    }

    void moveConditionallyFloatWithZero(DoubleCondition cond, FPRegisterID left, RegisterID src, RegisterID dest)
    {
        UNUSED_PARAM(cond);
        UNUSED_PARAM(left);
        UNUSED_PARAM(src);
        UNUSED_PARAM(dest);
        UNREACHABLE_FOR_PLATFORM();
    }

    void moveConditionallyFloatWithZero(DoubleCondition cond, FPRegisterID left, RegisterID thenCase, RegisterID elseCase, RegisterID dest)
    {
        UNUSED_PARAM(cond);
        UNUSED_PARAM(left);
        UNUSED_PARAM(thenCase);
        UNUSED_PARAM(elseCase);
        UNUSED_PARAM(dest);
        UNREACHABLE_FOR_PLATFORM();
    }

    void swap(RegisterID reg1, RegisterID reg2)
    {
        if (reg1 != reg2)
            m_assembler.xchgq_rr(reg1, reg2);
    }

    void signExtend32To64(TrustedImm32 imm, RegisterID dest)
    {
        if (!imm.m_value)
            m_assembler.xorq_rr(dest, dest);
        else
            m_assembler.mov_i32r(imm.m_value, dest);
    }

    void signExtend32To64(RegisterID src, RegisterID dest)
    {
        m_assembler.movsxd_rr(src, dest);
    }

    void signExtend32ToPtr(RegisterID src, RegisterID dest)
    {
        signExtend32To64(src, dest);
    }

    void signExtend32ToPtr(TrustedImm32 imm, RegisterID dest)
    {
        signExtend32To64(imm, dest);
    }

    void zeroExtend32ToWord(RegisterID src, RegisterID dest)
    {
        m_assembler.movl_rr(src, dest);
    }

    void zeroExtend32ToWord(TrustedImm32 src, RegisterID dest)
    {
        m_assembler.movl_i32r(src.m_value, dest);
    }

    void swap32(RegisterID src, RegisterID dest)
    {
        m_assembler.xchgl_rr(src, dest);
    }

    void swap32(RegisterID src, Address dest)
    {
        m_assembler.xchgl_rm(src, dest.offset, dest.base);
    }

    void moveConditionally32(RelationalCondition cond, RegisterID left, RegisterID right, RegisterID src, RegisterID dest)
    {
        m_assembler.cmpl_rr(right, left);
        cmov(x86Condition(cond), src, dest);
    }

    void moveConditionally32(RelationalCondition cond, RegisterID left, RegisterID right, RegisterID thenCase, RegisterID elseCase, RegisterID dest)
    {
        m_assembler.cmpl_rr(right, left);

        if (thenCase != dest && elseCase != dest) {
            move(elseCase, dest);
            elseCase = dest;
        }

        if (elseCase == dest)
            cmov(x86Condition(cond), thenCase, dest);
        else
            cmov(x86Condition(invert(cond)), elseCase, dest);
    }

    void moveConditionally32(RelationalCondition cond, RegisterID left, TrustedImm32 right, RegisterID thenCase, RegisterID elseCase, RegisterID dest)
    {
        if (!right.m_value) {
            if (auto resultCondition = commuteCompareToZeroIntoTest(cond)) {
                moveConditionallyTest32(*resultCondition, left, left, thenCase, elseCase, dest);
                return;
            }
        }

        m_assembler.cmpl_ir(right.m_value, left);

        if (thenCase != dest && elseCase != dest) {
            move(elseCase, dest);
            elseCase = dest;
        }

        if (elseCase == dest)
            cmov(x86Condition(cond), thenCase, dest);
        else
            cmov(x86Condition(invert(cond)), elseCase, dest);
    }

    void moveConditionallyTest32(ResultCondition cond, RegisterID testReg, RegisterID mask, RegisterID src, RegisterID dest)
    {
        m_assembler.testl_rr(testReg, mask);
        cmov(x86Condition(cond), src, dest);
    }

    void moveConditionallyTest32(ResultCondition cond, RegisterID left, RegisterID right, RegisterID thenCase, RegisterID elseCase, RegisterID dest)
    {
        ASSERT(isInvertible(cond));
        ASSERT_WITH_MESSAGE(cond != Overflow, "TEST does not set the Overflow Flag.");

        m_assembler.testl_rr(right, left);

        if (thenCase != dest && elseCase != dest) {
            move(elseCase, dest);
            elseCase = dest;
        }

        if (elseCase == dest)
            cmov(x86Condition(cond), thenCase, dest);
        else
            cmov(x86Condition(invert(cond)), elseCase, dest);
    }

    void moveConditionallyTest32(ResultCondition cond, RegisterID testReg, TrustedImm32 mask, RegisterID src, RegisterID dest)
    {
        test32(testReg, mask);
        cmov(x86Condition(cond), src, dest);
    }

    void moveConditionallyTest32(ResultCondition cond, RegisterID testReg, TrustedImm32 mask, RegisterID thenCase, RegisterID elseCase, RegisterID dest)
    {
        ASSERT(isInvertible(cond));
        ASSERT_WITH_MESSAGE(cond != Overflow, "TEST does not set the Overflow Flag.");

        test32(testReg, mask);

        if (thenCase != dest && elseCase != dest) {
            move(elseCase, dest);
            elseCase = dest;
        }

        if (elseCase == dest)
            cmov(x86Condition(cond), thenCase, dest);
        else
            cmov(x86Condition(invert(cond)), elseCase, dest);
    }

    template<typename LeftType, typename RightType>
    void moveDoubleConditionally32(RelationalCondition cond, LeftType left, RightType right, FPRegisterID thenCase, FPRegisterID elseCase, FPRegisterID dest)
    {
        static_assert(!std::is_same<LeftType, FPRegisterID>::value && !std::is_same<RightType, FPRegisterID>::value, "One of the tested argument could be aliased on dest. Use moveDoubleConditionallyDouble().");

        if (thenCase != dest && elseCase != dest) {
            moveDouble(elseCase, dest);
            elseCase = dest;
        }

        if (elseCase == dest) {
            Jump falseCase = branch32(invert(cond), left, right);
            moveDouble(thenCase, dest);
            falseCase.link(this);
        } else {
            Jump trueCase = branch32(cond, left, right);
            moveDouble(elseCase, dest);
            trueCase.link(this);
        }
    }

    template<typename TestType, typename MaskType>
    void moveDoubleConditionallyTest32(ResultCondition cond, TestType test, MaskType mask, FPRegisterID thenCase, FPRegisterID elseCase, FPRegisterID dest)
    {
        static_assert(!std::is_same<TestType, FPRegisterID>::value && !std::is_same<MaskType, FPRegisterID>::value, "One of the tested argument could be aliased on dest. Use moveDoubleConditionallyDouble().");

        if (elseCase == dest && isInvertible(cond)) {
            Jump falseCase = branchTest32(invert(cond), test, mask);
            moveDouble(thenCase, dest);
            falseCase.link(this);
        } else if (thenCase == dest) {
            Jump trueCase = branchTest32(cond, test, mask);
            moveDouble(elseCase, dest);
            trueCase.link(this);
        }

        Jump trueCase = branchTest32(cond, test, mask);
        moveDouble(elseCase, dest);
        Jump falseCase = jump();
        trueCase.link(this);
        moveDouble(thenCase, dest);
        falseCase.link(this);
    }

    void moveDoubleConditionallyDouble(DoubleCondition cond, FPRegisterID left, FPRegisterID right, FPRegisterID thenCase, FPRegisterID elseCase, FPRegisterID dest)
    {
        if (elseCase == dest) {
            Jump falseCase = branchDouble(invert(cond), left, right);
            moveDouble(thenCase, dest);
            falseCase.link(this);
        } else if (thenCase == dest) {
            Jump trueCase = branchDouble(cond, left, right);
            moveDouble(elseCase, dest);
            trueCase.link(this);
        } else {
            Jump trueCase = branchDouble(cond, left, right);
            moveDouble(elseCase, dest);
            Jump falseCase = jump();
            trueCase.link(this);
            moveDouble(thenCase, dest);
            falseCase.link(this);
        }
    }

    void moveDoubleConditionallyFloat(DoubleCondition cond, FPRegisterID left, FPRegisterID right, FPRegisterID thenCase, FPRegisterID elseCase, FPRegisterID dest)
    {
        if (elseCase == dest) {
            Jump falseCase = branchFloat(invert(cond), left, right);
            moveDouble(thenCase, dest);
            falseCase.link(this);
        } else if (thenCase == dest) {
            Jump trueCase = branchFloat(cond, left, right);
            moveDouble(elseCase, dest);
            trueCase.link(this);
        } else {
            Jump trueCase = branchFloat(cond, left, right);
            moveDouble(elseCase, dest);
            Jump falseCase = jump();
            trueCase.link(this);
            moveDouble(thenCase, dest);
            falseCase.link(this);
        }
    }

    void moveDoubleConditionallyDoubleWithZero(DoubleCondition cond, FPRegisterID left, FPRegisterID thenCase, FPRegisterID elseCase, FPRegisterID dest)
    {
        UNUSED_PARAM(cond);
        UNUSED_PARAM(left);
        UNUSED_PARAM(thenCase);
        UNUSED_PARAM(elseCase);
        UNUSED_PARAM(dest);
        UNREACHABLE_FOR_PLATFORM();
    }

    void moveDoubleConditionallyFloatWithZero(DoubleCondition cond, FPRegisterID left, FPRegisterID thenCase, FPRegisterID elseCase, FPRegisterID dest)
    {
        UNUSED_PARAM(cond);
        UNUSED_PARAM(left);
        UNUSED_PARAM(thenCase);
        UNUSED_PARAM(elseCase);
        UNUSED_PARAM(dest);
        UNREACHABLE_FOR_PLATFORM();
    }

    // Forwards / external control flow operations:
    //
    // This set of jump and conditional branch operations return a Jump
    // object which may linked at a later point, allow forwards jump,
    // or jumps that will require external linkage (after the code has been
    // relocated).
    //
    // For branches, signed <, >, <= and >= are denoted as l, g, le, and ge
    // respecitvely, for unsigned comparisons the names b, a, be, and ae are
    // used (representing the names 'below' and 'above').
    //
    // Operands to the comparision are provided in the expected order, e.g.
    // jle32(reg1, TrustedImm32(5)) will branch if the value held in reg1, when
    // treated as a signed 32bit value, is less than or equal to 5.
    //
    // jz and jnz test whether the first operand is equal to zero, and take
    // an optional second operand of a mask under which to perform the test.

public:
    Jump branch8(RelationalCondition cond, Address left, TrustedImm32 right)
    {
        TrustedImm32 right8(static_cast<int8_t>(right.m_value));
        m_assembler.cmpb_im(right8.m_value, left.offset, left.base);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branch16(RelationalCondition cond, Address left, TrustedImm32 right)
    {
        TrustedImm32 right16(static_cast<int16_t>(right.m_value));
        m_assembler.cmpw_im(right16.m_value, left.offset, left.base);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branch32(RelationalCondition cond, RegisterID left, RegisterID right)
    {
        m_assembler.cmpl_rr(right, left);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branch32(RelationalCondition cond, RegisterID left, TrustedImm32 right)
    {
        if (!right.m_value) {
            if (auto resultCondition = commuteCompareToZeroIntoTest(cond))
                return branchTest32(*resultCondition, left, left);
        }

        m_assembler.cmpl_ir(right.m_value, left);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branch32(RelationalCondition cond, RegisterID left, Address right)
    {
        m_assembler.cmpl_mr(right.offset, right.base, left);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branch32(RelationalCondition cond, Address left, RegisterID right)
    {
        m_assembler.cmpl_rm(right, left.offset, left.base);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branch32(RelationalCondition cond, Address left, TrustedImm32 right)
    {
        m_assembler.cmpl_im(right.m_value, left.offset, left.base);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branch32(RelationalCondition cond, BaseIndex left, TrustedImm32 right)
    {
        m_assembler.cmpl_im(right.m_value, left.offset, left.base, left.index, left.scale);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branch32WithUnalignedHalfWords(RelationalCondition cond, BaseIndex left, TrustedImm32 right)
    {
        return branch32(cond, left, right);
    }

    Jump branchTest32(ResultCondition cond, RegisterID reg, RegisterID mask)
    {
        m_assembler.testl_rr(reg, mask);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branchTestBit32(ResultCondition cond, RegisterID reg, TrustedImm32 bit)
    {
        m_assembler.bt_ir(static_cast<unsigned>(bit.m_value) % 32, reg);
        if (cond == NonZero)
            return Jump(m_assembler.jb());
        if (cond == Zero)
            return Jump(m_assembler.jae());
        RELEASE_ASSERT_NOT_REACHED();
    }

    Jump branchTestBit32(ResultCondition cond, Address testValue, TrustedImm32 bit)
    {
        m_assembler.bt_im(static_cast<unsigned>(bit.m_value) % 32, testValue.offset, testValue.base);
        if (cond == NonZero)
            return Jump(m_assembler.jb());
        if (cond == Zero)
            return Jump(m_assembler.jae());
        RELEASE_ASSERT_NOT_REACHED();
    }

    Jump branchTestBit32(ResultCondition cond, RegisterID reg, RegisterID bit)
    {
        m_assembler.bt_ir(bit, reg);
        if (cond == NonZero)
            return Jump(m_assembler.jb());
        if (cond == Zero)
            return Jump(m_assembler.jae());
        RELEASE_ASSERT_NOT_REACHED();
    }

    void test32(RegisterID reg, TrustedImm32 mask = TrustedImm32(-1))
    {
        if (mask.m_value == -1)
            m_assembler.testl_rr(reg, reg);
        else if (!(mask.m_value & ~0xff) && reg < X86Registers::esp) { // Using esp and greater as a byte register yields the upper half of the 16 bit registers ax, cx, dx and bx, e.g. esp, register 4, is actually ah.
            if (mask.m_value == 0xff)
                m_assembler.testb_rr(reg, reg);
            else
                m_assembler.testb_i8r(mask.m_value, reg);
        } else
            m_assembler.testl_i32r(mask.m_value, reg);
    }

    Jump branch(ResultCondition cond)
    {
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branchTest32(ResultCondition cond, RegisterID reg, TrustedImm32 mask = TrustedImm32(-1))
    {
        test32(reg, mask);
        return branch(cond);
    }

    Jump branchTest32(ResultCondition cond, Address address, TrustedImm32 mask = TrustedImm32(-1))
    {
        generateTest32(address, mask);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branchTest32(ResultCondition cond, BaseIndex address, TrustedImm32 mask = TrustedImm32(-1))
    {
        if (mask.m_value == -1)
            m_assembler.cmpl_im(0, address.offset, address.base, address.index, address.scale);
        else
            m_assembler.testl_i32m(mask.m_value, address.offset, address.base, address.index, address.scale);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branchTest32(ResultCondition cond, AbsoluteAddress address, TrustedImm32 mask = TrustedImm32(-1))
    {
        move(TrustedImmPtr(address.m_ptr), scratchRegister());
        return branchTest32(cond, Address(scratchRegister()), mask);
    }

    Jump branchTest8(ResultCondition cond, Address address, TrustedImm32 mask = TrustedImm32(-1))
    {
        TrustedImm32 mask8(static_cast<int8_t>(mask.m_value));
        if (mask8.m_value == -1)
            m_assembler.cmpb_im(0, address.offset, address.base);
        else
            m_assembler.testb_im(mask8.m_value, address.offset, address.base);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branchTest8(ResultCondition cond, BaseIndex address, TrustedImm32 mask = TrustedImm32(-1))
    {
        TrustedImm32 mask8(static_cast<int8_t>(mask.m_value));
        if (mask8.m_value == -1)
            m_assembler.cmpb_im(0, address.offset, address.base, address.index, address.scale);
        else
            m_assembler.testb_im(mask8.m_value, address.offset, address.base, address.index, address.scale);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branchTest16(ResultCondition cond, Address address, TrustedImm32 mask = TrustedImm32(-1))
    {
        TrustedImm32 mask16(static_cast<int16_t>(mask.m_value));
        if (mask16.m_value == -1)
            m_assembler.cmpw_im(0, address.offset, address.base);
        else
            m_assembler.testw_im(mask16.m_value, address.offset, address.base);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branchTest16(ResultCondition cond, BaseIndex address, TrustedImm32 mask = TrustedImm32(-1))
    {
        TrustedImm32 mask16(static_cast<int16_t>(mask.m_value));
        if (mask16.m_value == -1)
            m_assembler.cmpw_im(0, address.offset, address.base, address.index, address.scale);
        else
            m_assembler.testw_im(mask16.m_value, address.offset, address.base, address.index, address.scale);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branch8(RelationalCondition cond, BaseIndex left, TrustedImm32 right)
    {
        TrustedImm32 right8(static_cast<int8_t>(right.m_value));
        m_assembler.cmpb_im(right8.m_value, left.offset, left.base, left.index, left.scale);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branch16(RelationalCondition cond, BaseIndex left, TrustedImm32 right)
    {
        TrustedImm32 right16(static_cast<int16_t>(right.m_value));
        m_assembler.cmpw_im(right16.m_value, left.offset, left.base, left.index, left.scale);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump jump()
    {
        return Jump(m_assembler.jmp());
    }

    void farJump(RegisterID target, PtrTag)
    {
        m_assembler.jmp_r(target);
    }

    void farJump(TrustedImmPtr target, PtrTag)
    {
        move(target, scratchRegister());
        m_assembler.jmp_r(scratchRegister());
    }

    // Address is a memory location containing the address to jump to
    void farJump(Address address, PtrTag)
    {
        m_assembler.jmp_m(address.offset, address.base);
    }

    // Address is a memory location containing the address to jump to
    void farJump(BaseIndex address, PtrTag)
    {
        m_assembler.jmp_m(address.offset, address.base, address.index, address.scale);
    }

    ALWAYS_INLINE void farJump(RegisterID target, RegisterID jumpTag) { UNUSED_PARAM(jumpTag), farJump(target, NoPtrTag); }
    ALWAYS_INLINE void farJump(Address address, RegisterID jumpTag) { UNUSED_PARAM(jumpTag), farJump(address, NoPtrTag); }
    ALWAYS_INLINE void farJump(BaseIndex address, RegisterID jumpTag) { UNUSED_PARAM(jumpTag), farJump(address, NoPtrTag); }

    // Arithmetic control flow operations:
    //
    // This set of conditional branch operations branch based
    // on the result of an arithmetic operation.  The operation
    // is performed as normal, storing the result.
    //
    // * jz operations branch if the result is zero.
    // * jo operations branch if the (signed) arithmetic
    //   operation caused an overflow to occur.

    Jump branchAdd32(ResultCondition cond, RegisterID src, RegisterID dest)
    {
        add32(src, dest);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branchAdd32(ResultCondition cond, TrustedImm32 imm, RegisterID dest)
    {
        add32(imm, dest);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branchAdd32(ResultCondition cond, TrustedImm32 src, Address dest)
    {
        add32(src, dest);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branchAdd32(ResultCondition cond, RegisterID src, Address dest)
    {
        add32(src, dest);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branchAdd32(ResultCondition cond, Address src, RegisterID dest)
    {
        add32(src, dest);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branchAdd32(ResultCondition cond, RegisterID src1, RegisterID src2, RegisterID dest)
    {
        if (src1 == dest)
            return branchAdd32(cond, src2, dest);
        move32IfNeeded(src2, dest);
        return branchAdd32(cond, src1, dest);
    }

    Jump branchAdd32(ResultCondition cond, Address op1, RegisterID op2, RegisterID dest)
    {
        if (op2 == dest)
            return branchAdd32(cond, op1, dest);
        if (op1.base == dest) {
            load32(op1, dest);
            return branchAdd32(cond, op2, dest);
        }
        zeroExtend32ToWord(op2, dest);
        return branchAdd32(cond, op1, dest);
    }

    Jump branchAdd32(ResultCondition cond, RegisterID src1, Address src2, RegisterID dest)
    {
        return branchAdd32(cond, src2, src1, dest);
    }

    Jump branchAdd32(ResultCondition cond, RegisterID src, TrustedImm32 imm, RegisterID dest)
    {
        move32IfNeeded(src, dest);
        return branchAdd32(cond, imm, dest);
    }

    Jump branchMul32(ResultCondition cond, RegisterID src, RegisterID dest)
    {
        mul32(src, dest);
        if (cond != Overflow)
            m_assembler.testl_rr(dest, dest);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branchMul32(ResultCondition cond, Address src, RegisterID dest)
    {
        mul32(src, dest);
        if (cond != Overflow)
            m_assembler.testl_rr(dest, dest);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branchMul32(ResultCondition cond, RegisterID src, TrustedImm32 imm, RegisterID dest)
    {
        mul32(imm, src, dest);
        if (cond != Overflow)
            m_assembler.testl_rr(dest, dest);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branchMul32(ResultCondition cond, RegisterID src1, RegisterID src2, RegisterID dest)
    {
        if (src1 == dest)
            return branchMul32(cond, src2, dest);
        move32IfNeeded(src2, dest);
        return branchMul32(cond, src1, dest);
    }

    Jump branchSub32(ResultCondition cond, RegisterID src, RegisterID dest)
    {
        sub32(src, dest);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branchSub32(ResultCondition cond, TrustedImm32 imm, RegisterID dest)
    {
        sub32(imm, dest);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branchSub32(ResultCondition cond, TrustedImm32 imm, Address dest)
    {
        sub32(imm, dest);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branchSub32(ResultCondition cond, RegisterID src, Address dest)
    {
        sub32(src, dest);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branchSub32(ResultCondition cond, Address src, RegisterID dest)
    {
        sub32(src, dest);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branchSub32(ResultCondition cond, RegisterID src1, RegisterID src2, RegisterID dest)
    {
        // B := A - B is invalid.
        ASSERT(src1 == dest || src2 != dest);

        move32IfNeeded(src1, dest);
        return branchSub32(cond, src2, dest);
    }

    Jump branchSub32(ResultCondition cond, RegisterID src1, TrustedImm32 src2, RegisterID dest)
    {
        move32IfNeeded(src1, dest);
        return branchSub32(cond, src2, dest);
    }

    Jump branchNeg32(ResultCondition cond, RegisterID srcDest)
    {
        neg32(srcDest);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branchOr32(ResultCondition cond, RegisterID src, RegisterID dest)
    {
        or32(src, dest);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }


    // Miscellaneous operations:

    void breakpoint()
    {
        m_assembler.int3();
    }

    static bool isBreakpoint(void* address) { return X86Assembler::isInt3(address); }

    Call nearTailCall()
    {
        return Call(m_assembler.jmp(), Call::LinkableNearTail);
    }

    Call nearCall()
    {
        return Call(m_assembler.call(), Call::LinkableNear);
    }

    Call call(RegisterID target, PtrTag)
    {
        return Call(m_assembler.call(target), Call::None);
    }

    void call(Address address, PtrTag)
    {
        m_assembler.call_m(address.offset, address.base);
    }

    ALWAYS_INLINE Call call(RegisterID target, RegisterID callTag) { return UNUSED_PARAM(callTag), call(target, NoPtrTag); }
    ALWAYS_INLINE void call(Address address, RegisterID callTag) { UNUSED_PARAM(callTag), call(address, NoPtrTag); }

    void ret()
    {
        m_assembler.ret();
    }

    void compare8(RelationalCondition cond, Address left, TrustedImm32 right, RegisterID dest)
    {
        TrustedImm32 right8(static_cast<int8_t>(right.m_value));
        m_assembler.cmpb_im(right8.m_value, left.offset, left.base);
        set32(x86Condition(cond), dest);
    }

    void compare32(RelationalCondition cond, RegisterID left, RegisterID right, RegisterID dest)
    {
        m_assembler.cmpl_rr(right, left);
        set32(x86Condition(cond), dest);
    }

    void compare32(RelationalCondition cond, RegisterID left, TrustedImm32 right, RegisterID dest)
    {
        if (!right.m_value) {
            if (auto resultCondition = commuteCompareToZeroIntoTest(cond)) {
                test32(*resultCondition, left, left, dest);
                return;
            }
        }

        m_assembler.cmpl_ir(right.m_value, left);
        set32(x86Condition(cond), dest);
    }

    // FIXME:
    // The mask should be optional... perhaps the argument order should be
    // dest-src, operations always have a dest? ... possibly not true, considering
    // asm ops like test, or pseudo ops like pop().

    void test8(ResultCondition cond, Address address, TrustedImm32 mask, RegisterID dest)
    {
        TrustedImm32 mask8(static_cast<int8_t>(mask.m_value));
        if (mask8.m_value == -1)
            m_assembler.cmpb_im(0, address.offset, address.base);
        else
            m_assembler.testb_im(mask8.m_value, address.offset, address.base);
        set32(x86Condition(cond), dest);
    }

    void test32(ResultCondition cond, Address address, TrustedImm32 mask, RegisterID dest)
    {
        generateTest32(address, mask);
        set32(x86Condition(cond), dest);
    }

    void test32(ResultCondition cond, RegisterID reg, RegisterID mask, RegisterID dest)
    {
        m_assembler.testl_rr(reg, mask);
        set32(x86Condition(cond), dest);
    }

    void test32(ResultCondition cond, RegisterID reg, TrustedImm32 mask, RegisterID dest)
    {
        test32(reg, mask);
        set32(x86Condition(cond), dest);
    }

    void setCarry(RegisterID dest)
    {
        set32(X86Assembler::ConditionC, dest);
    }

    // Invert a relational condition, e.g. == becomes !=, < becomes >=, etc.
    static RelationalCondition invert(RelationalCondition cond)
    {
        return static_cast<RelationalCondition>(cond ^ 1);
    }

    static DoubleCondition invert(DoubleCondition cond)
    {
        switch (cond) {
        case DoubleEqualAndOrdered:
            return DoubleNotEqualOrUnordered;
        case DoubleNotEqualAndOrdered:
            return DoubleEqualOrUnordered;
        case DoubleGreaterThanAndOrdered:
            return DoubleLessThanOrEqualOrUnordered;
        case DoubleGreaterThanOrEqualAndOrdered:
            return DoubleLessThanOrUnordered;
        case DoubleLessThanAndOrdered:
            return DoubleGreaterThanOrEqualOrUnordered;
        case DoubleLessThanOrEqualAndOrdered:
            return DoubleGreaterThanOrUnordered;
        case DoubleEqualOrUnordered:
            return DoubleNotEqualAndOrdered;
        case DoubleNotEqualOrUnordered:
            return DoubleEqualAndOrdered;
        case DoubleGreaterThanOrUnordered:
            return DoubleLessThanOrEqualAndOrdered;
        case DoubleGreaterThanOrEqualOrUnordered:
            return DoubleLessThanAndOrdered;
        case DoubleLessThanOrUnordered:
            return DoubleGreaterThanOrEqualAndOrdered;
        case DoubleLessThanOrEqualOrUnordered:
            return DoubleGreaterThanAndOrdered;
        }
        RELEASE_ASSERT_NOT_REACHED();
        return DoubleEqualAndOrdered; // make compiler happy
    }

    static bool isInvertible(ResultCondition cond)
    {
        switch (cond) {
        case Zero:
        case NonZero:
        case Signed:
        case PositiveOrZero:
            return true;
        default:
            return false;
        }
    }

    static ResultCondition invert(ResultCondition cond)
    {
        switch (cond) {
        case Zero:
            return NonZero;
        case NonZero:
            return Zero;
        case Signed:
            return PositiveOrZero;
        case PositiveOrZero:
            return Signed;
        default:
            RELEASE_ASSERT_NOT_REACHED();
            return Zero; // Make compiler happy for release builds.
        }
    }

    static std::optional<ResultCondition> commuteCompareToZeroIntoTest(RelationalCondition cond)
    {
        switch (cond) {
        case Equal:
            return Zero;
        case NotEqual:
            return NonZero;
        case LessThan:
            return Signed;
        case GreaterThanOrEqual:
            return PositiveOrZero;
            break;
        default:
            return std::nullopt;
        }
    }

    void nop()
    {
        m_assembler.nop();
    }

    void xchg8(RegisterID reg, Address address)
    {
        m_assembler.xchgb_rm(reg, address.offset, address.base);
    }

    void xchg8(RegisterID reg, BaseIndex address)
    {
        m_assembler.xchgb_rm(reg, address.offset, address.base, address.index, address.scale);
    }

    void xchg16(RegisterID reg, Address address)
    {
        m_assembler.xchgw_rm(reg, address.offset, address.base);
    }

    void xchg16(RegisterID reg, BaseIndex address)
    {
        m_assembler.xchgw_rm(reg, address.offset, address.base, address.index, address.scale);
    }

    void xchg32(RegisterID reg, Address address)
    {
        m_assembler.xchgl_rm(reg, address.offset, address.base);
    }

    void xchg32(RegisterID reg, BaseIndex address)
    {
        m_assembler.xchgl_rm(reg, address.offset, address.base, address.index, address.scale);
    }

    // We take memoryFence to mean acqrel. This has acqrel semantics on x86.
    void memoryFence()
    {
        // lock; orl $0, (%rsp)
        m_assembler.lock();
        m_assembler.orl_im(0, 0, X86Registers::esp);
    }

    ALWAYS_INLINE RegisterID checkAliasOfEAX(RegisterID expectedAndResult, RegisterID newValue)
    {
        if (newValue != X86Registers::eax || expectedAndResult == X86Registers::eax)
            return newValue;

        RegisterID tempNewValue = scratchRegister();
        move(newValue, tempNewValue);
        return tempNewValue;
    }

    void atomicStrongCAS8(StatusCondition cond, RegisterID expectedAndResult, RegisterID newValue, Address address, RegisterID result)
    {
        newValue = checkAliasOfEAX(expectedAndResult, newValue);
        atomicStrongCAS(cond, expectedAndResult, result, address, [&] { m_assembler.cmpxchgb_rm(newValue, address.offset, address.base); });
    }

    void atomicStrongCAS8(StatusCondition cond, RegisterID expectedAndResult, RegisterID newValue, BaseIndex address, RegisterID result)
    {
        newValue = checkAliasOfEAX(expectedAndResult, newValue);
        atomicStrongCAS(cond, expectedAndResult, result, address, [&] { m_assembler.cmpxchgb_rm(newValue, address.offset, address.base, address.index, address.scale); });
    }

    void atomicStrongCAS16(StatusCondition cond, RegisterID expectedAndResult, RegisterID newValue, Address address, RegisterID result)
    {
        newValue = checkAliasOfEAX(expectedAndResult, newValue);
        atomicStrongCAS(cond, expectedAndResult, result, address, [&] { m_assembler.cmpxchgw_rm(newValue, address.offset, address.base); });
    }

    void atomicStrongCAS16(StatusCondition cond, RegisterID expectedAndResult, RegisterID newValue, BaseIndex address, RegisterID result)
    {
        newValue = checkAliasOfEAX(expectedAndResult, newValue);
        atomicStrongCAS(cond, expectedAndResult, result, address, [&] { m_assembler.cmpxchgw_rm(newValue, address.offset, address.base, address.index, address.scale); });
    }

    void atomicStrongCAS32(StatusCondition cond, RegisterID expectedAndResult, RegisterID newValue, Address address, RegisterID result)
    {
        newValue = checkAliasOfEAX(expectedAndResult, newValue);
        atomicStrongCAS(cond, expectedAndResult, result, address, [&] { m_assembler.cmpxchgl_rm(newValue, address.offset, address.base); });
    }

    void atomicStrongCAS32(StatusCondition cond, RegisterID expectedAndResult, RegisterID newValue, BaseIndex address, RegisterID result)
    {
        newValue = checkAliasOfEAX(expectedAndResult, newValue);
        atomicStrongCAS(cond, expectedAndResult, result, address, [&] { m_assembler.cmpxchgl_rm(newValue, address.offset, address.base, address.index, address.scale); });
    }

    void atomicStrongCAS8(RegisterID expectedAndResult, RegisterID newValue, Address address)
    {
        newValue = checkAliasOfEAX(expectedAndResult, newValue);
        atomicStrongCAS(expectedAndResult, address, [&] { m_assembler.cmpxchgb_rm(newValue, address.offset, address.base); });
    }

    void atomicStrongCAS8(RegisterID expectedAndResult, RegisterID newValue, BaseIndex address)
    {
        newValue = checkAliasOfEAX(expectedAndResult, newValue);
        atomicStrongCAS(expectedAndResult, address, [&] { m_assembler.cmpxchgb_rm(newValue, address.offset, address.base, address.index, address.scale); });
    }

    void atomicStrongCAS16(RegisterID expectedAndResult, RegisterID newValue, Address address)
    {
        newValue = checkAliasOfEAX(expectedAndResult, newValue);
        atomicStrongCAS(expectedAndResult, address, [&] { m_assembler.cmpxchgw_rm(newValue, address.offset, address.base); });
    }

    void atomicStrongCAS16(RegisterID expectedAndResult, RegisterID newValue, BaseIndex address)
    {
        newValue = checkAliasOfEAX(expectedAndResult, newValue);
        atomicStrongCAS(expectedAndResult, address, [&] { m_assembler.cmpxchgw_rm(newValue, address.offset, address.base, address.index, address.scale); });
    }

    void atomicStrongCAS32(RegisterID expectedAndResult, RegisterID newValue, Address address)
    {
        newValue = checkAliasOfEAX(expectedAndResult, newValue);
        atomicStrongCAS(expectedAndResult, address, [&] { m_assembler.cmpxchgl_rm(newValue, address.offset, address.base); });
    }

    void atomicStrongCAS32(RegisterID expectedAndResult, RegisterID newValue, BaseIndex address)
    {
        newValue = checkAliasOfEAX(expectedAndResult, newValue);
        atomicStrongCAS(expectedAndResult, address, [&] { m_assembler.cmpxchgl_rm(newValue, address.offset, address.base, address.index, address.scale); });
    }

    Jump branchAtomicStrongCAS8(StatusCondition cond, RegisterID expectedAndResult, RegisterID newValue, Address address)
    {
        newValue = checkAliasOfEAX(expectedAndResult, newValue);
        return branchAtomicStrongCAS(cond, expectedAndResult, address, [&] { m_assembler.cmpxchgb_rm(newValue, address.offset, address.base); });
    }

    Jump branchAtomicStrongCAS8(StatusCondition cond, RegisterID expectedAndResult, RegisterID newValue, BaseIndex address)
    {
        newValue = checkAliasOfEAX(expectedAndResult, newValue);
        return branchAtomicStrongCAS(cond, expectedAndResult, address, [&] { m_assembler.cmpxchgb_rm(newValue, address.offset, address.base, address.index, address.scale); });
    }

    Jump branchAtomicStrongCAS16(StatusCondition cond, RegisterID expectedAndResult, RegisterID newValue, Address address)
    {
        newValue = checkAliasOfEAX(expectedAndResult, newValue);
        return branchAtomicStrongCAS(cond, expectedAndResult, address, [&] { m_assembler.cmpxchgw_rm(newValue, address.offset, address.base); });
    }

    Jump branchAtomicStrongCAS16(StatusCondition cond, RegisterID expectedAndResult, RegisterID newValue, BaseIndex address)
    {
        newValue = checkAliasOfEAX(expectedAndResult, newValue);
        return branchAtomicStrongCAS(cond, expectedAndResult, address, [&] { m_assembler.cmpxchgw_rm(newValue, address.offset, address.base, address.index, address.scale); });
    }

    Jump branchAtomicStrongCAS32(StatusCondition cond, RegisterID expectedAndResult, RegisterID newValue, Address address)
    {
        newValue = checkAliasOfEAX(expectedAndResult, newValue);
        return branchAtomicStrongCAS(cond, expectedAndResult, address, [&] { m_assembler.cmpxchgl_rm(newValue, address.offset, address.base); });
    }

    Jump branchAtomicStrongCAS32(StatusCondition cond, RegisterID expectedAndResult, RegisterID newValue, BaseIndex address)
    {
        newValue = checkAliasOfEAX(expectedAndResult, newValue);
        return branchAtomicStrongCAS(cond, expectedAndResult, address, [&] { m_assembler.cmpxchgl_rm(newValue, address.offset, address.base, address.index, address.scale); });
    }

    // If you use weak CAS, you cannot rely on expectedAndClobbered to have any particular value after
    // this completes. On x86, it will contain the result of the strong CAS. On ARM, it will still have
    // the expected value.
    void atomicWeakCAS8(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, Address address, RegisterID result)
    {
        atomicStrongCAS8(cond, expectedAndClobbered, newValue, address, result);
    }

    void atomicWeakCAS8(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, BaseIndex address, RegisterID result)
    {
        atomicStrongCAS8(cond, expectedAndClobbered, newValue, address, result);
    }

    void atomicWeakCAS16(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, Address address, RegisterID result)
    {
        atomicStrongCAS16(cond, expectedAndClobbered, newValue, address, result);
    }

    void atomicWeakCAS16(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, BaseIndex address, RegisterID result)
    {
        atomicStrongCAS16(cond, expectedAndClobbered, newValue, address, result);
    }

    void atomicWeakCAS32(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, Address address, RegisterID result)
    {
        atomicStrongCAS32(cond, expectedAndClobbered, newValue, address, result);
    }

    void atomicWeakCAS32(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, BaseIndex address, RegisterID result)
    {
        atomicStrongCAS32(cond, expectedAndClobbered, newValue, address, result);
    }

    Jump branchAtomicWeakCAS8(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, Address address)
    {
        return branchAtomicStrongCAS8(cond, expectedAndClobbered, newValue, address);
    }

    Jump branchAtomicWeakCAS8(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, BaseIndex address)
    {
        return branchAtomicStrongCAS8(cond, expectedAndClobbered, newValue, address);
    }

    Jump branchAtomicWeakCAS16(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, Address address)
    {
        return branchAtomicStrongCAS16(cond, expectedAndClobbered, newValue, address);
    }

    Jump branchAtomicWeakCAS16(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, BaseIndex address)
    {
        return branchAtomicStrongCAS16(cond, expectedAndClobbered, newValue, address);
    }

    Jump branchAtomicWeakCAS32(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, Address address)
    {
        return branchAtomicStrongCAS32(cond, expectedAndClobbered, newValue, address);
    }

    Jump branchAtomicWeakCAS32(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, BaseIndex address)
    {
        return branchAtomicStrongCAS32(cond, expectedAndClobbered, newValue, address);
    }

    void atomicRelaxedWeakCAS8(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, Address address, RegisterID result)
    {
        atomicStrongCAS8(cond, expectedAndClobbered, newValue, address, result);
    }

    void atomicRelaxedWeakCAS8(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, BaseIndex address, RegisterID result)
    {
        atomicStrongCAS8(cond, expectedAndClobbered, newValue, address, result);
    }

    void atomicRelaxedWeakCAS16(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, Address address, RegisterID result)
    {
        atomicStrongCAS16(cond, expectedAndClobbered, newValue, address, result);
    }

    void atomicRelaxedWeakCAS16(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, BaseIndex address, RegisterID result)
    {
        atomicStrongCAS16(cond, expectedAndClobbered, newValue, address, result);
    }

    void atomicRelaxedWeakCAS32(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, Address address, RegisterID result)
    {
        atomicStrongCAS32(cond, expectedAndClobbered, newValue, address, result);
    }

    void atomicRelaxedWeakCAS32(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, BaseIndex address, RegisterID result)
    {
        atomicStrongCAS32(cond, expectedAndClobbered, newValue, address, result);
    }

    Jump branchAtomicRelaxedWeakCAS8(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, Address address)
    {
        return branchAtomicStrongCAS8(cond, expectedAndClobbered, newValue, address);
    }

    Jump branchAtomicRelaxedWeakCAS8(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, BaseIndex address)
    {
        return branchAtomicStrongCAS8(cond, expectedAndClobbered, newValue, address);
    }

    Jump branchAtomicRelaxedWeakCAS16(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, Address address)
    {
        return branchAtomicStrongCAS16(cond, expectedAndClobbered, newValue, address);
    }

    Jump branchAtomicRelaxedWeakCAS16(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, BaseIndex address)
    {
        return branchAtomicStrongCAS16(cond, expectedAndClobbered, newValue, address);
    }

    Jump branchAtomicRelaxedWeakCAS32(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, Address address)
    {
        return branchAtomicStrongCAS32(cond, expectedAndClobbered, newValue, address);
    }

    Jump branchAtomicRelaxedWeakCAS32(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, BaseIndex address)
    {
        return branchAtomicStrongCAS32(cond, expectedAndClobbered, newValue, address);
    }

    void atomicAdd8(TrustedImm32 imm, Address address)
    {
        m_assembler.lock();
        add8(imm, address);
    }

    void atomicAdd8(TrustedImm32 imm, BaseIndex address)
    {
        m_assembler.lock();
        add8(imm, address);
    }

    void atomicAdd8(RegisterID reg, Address address)
    {
        m_assembler.lock();
        add8(reg, address);
    }

    void atomicAdd8(RegisterID reg, BaseIndex address)
    {
        m_assembler.lock();
        add8(reg, address);
    }

    void atomicAdd16(TrustedImm32 imm, Address address)
    {
        m_assembler.lock();
        add16(imm, address);
    }

    void atomicAdd16(TrustedImm32 imm, BaseIndex address)
    {
        m_assembler.lock();
        add16(imm, address);
    }

    void atomicAdd16(RegisterID reg, Address address)
    {
        m_assembler.lock();
        add16(reg, address);
    }

    void atomicAdd16(RegisterID reg, BaseIndex address)
    {
        m_assembler.lock();
        add16(reg, address);
    }

    void atomicAdd32(TrustedImm32 imm, Address address)
    {
        m_assembler.lock();
        add32(imm, address);
    }

    void atomicAdd32(TrustedImm32 imm, BaseIndex address)
    {
        m_assembler.lock();
        add32(imm, address);
    }

    void atomicAdd32(RegisterID reg, Address address)
    {
        m_assembler.lock();
        add32(reg, address);
    }

    void atomicAdd32(RegisterID reg, BaseIndex address)
    {
        m_assembler.lock();
        add32(reg, address);
    }

    void atomicSub8(TrustedImm32 imm, Address address)
    {
        m_assembler.lock();
        sub8(imm, address);
    }

    void atomicSub8(TrustedImm32 imm, BaseIndex address)
    {
        m_assembler.lock();
        sub8(imm, address);
    }

    void atomicSub8(RegisterID reg, Address address)
    {
        m_assembler.lock();
        sub8(reg, address);
    }

    void atomicSub8(RegisterID reg, BaseIndex address)
    {
        m_assembler.lock();
        sub8(reg, address);
    }

    void atomicSub16(TrustedImm32 imm, Address address)
    {
        m_assembler.lock();
        sub16(imm, address);
    }

    void atomicSub16(TrustedImm32 imm, BaseIndex address)
    {
        m_assembler.lock();
        sub16(imm, address);
    }

    void atomicSub16(RegisterID reg, Address address)
    {
        m_assembler.lock();
        sub16(reg, address);
    }

    void atomicSub16(RegisterID reg, BaseIndex address)
    {
        m_assembler.lock();
        sub16(reg, address);
    }

    void atomicSub32(TrustedImm32 imm, Address address)
    {
        m_assembler.lock();
        sub32(imm, address);
    }

    void atomicSub32(TrustedImm32 imm, BaseIndex address)
    {
        m_assembler.lock();
        sub32(imm, address);
    }

    void atomicSub32(RegisterID reg, Address address)
    {
        m_assembler.lock();
        sub32(reg, address);
    }

    void atomicSub32(RegisterID reg, BaseIndex address)
    {
        m_assembler.lock();
        sub32(reg, address);
    }

    void atomicAnd8(TrustedImm32 imm, Address address)
    {
        m_assembler.lock();
        and8(imm, address);
    }

    void atomicAnd8(TrustedImm32 imm, BaseIndex address)
    {
        m_assembler.lock();
        and8(imm, address);
    }

    void atomicAnd8(RegisterID reg, Address address)
    {
        m_assembler.lock();
        and8(reg, address);
    }

    void atomicAnd8(RegisterID reg, BaseIndex address)
    {
        m_assembler.lock();
        and8(reg, address);
    }

    void atomicAnd16(TrustedImm32 imm, Address address)
    {
        m_assembler.lock();
        and16(imm, address);
    }

    void atomicAnd16(TrustedImm32 imm, BaseIndex address)
    {
        m_assembler.lock();
        and16(imm, address);
    }

    void atomicAnd16(RegisterID reg, Address address)
    {
        m_assembler.lock();
        and16(reg, address);
    }

    void atomicAnd16(RegisterID reg, BaseIndex address)
    {
        m_assembler.lock();
        and16(reg, address);
    }

    void atomicAnd32(TrustedImm32 imm, Address address)
    {
        m_assembler.lock();
        and32(imm, address);
    }

    void atomicAnd32(TrustedImm32 imm, BaseIndex address)
    {
        m_assembler.lock();
        and32(imm, address);
    }

    void atomicAnd32(RegisterID reg, Address address)
    {
        m_assembler.lock();
        and32(reg, address);
    }

    void atomicAnd32(RegisterID reg, BaseIndex address)
    {
        m_assembler.lock();
        and32(reg, address);
    }

    void atomicOr8(TrustedImm32 imm, Address address)
    {
        m_assembler.lock();
        or8(imm, address);
    }

    void atomicOr8(TrustedImm32 imm, BaseIndex address)
    {
        m_assembler.lock();
        or8(imm, address);
    }

    void atomicOr8(RegisterID reg, Address address)
    {
        m_assembler.lock();
        or8(reg, address);
    }

    void atomicOr8(RegisterID reg, BaseIndex address)
    {
        m_assembler.lock();
        or8(reg, address);
    }

    void atomicOr16(TrustedImm32 imm, Address address)
    {
        m_assembler.lock();
        or16(imm, address);
    }

    void atomicOr16(TrustedImm32 imm, BaseIndex address)
    {
        m_assembler.lock();
        or16(imm, address);
    }

    void atomicOr16(RegisterID reg, Address address)
    {
        m_assembler.lock();
        or16(reg, address);
    }

    void atomicOr16(RegisterID reg, BaseIndex address)
    {
        m_assembler.lock();
        or16(reg, address);
    }

    void atomicOr32(TrustedImm32 imm, Address address)
    {
        m_assembler.lock();
        or32(imm, address);
    }

    void atomicOr32(TrustedImm32 imm, BaseIndex address)
    {
        m_assembler.lock();
        or32(imm, address);
    }

    void atomicOr32(RegisterID reg, Address address)
    {
        m_assembler.lock();
        or32(reg, address);
    }

    void atomicOr32(RegisterID reg, BaseIndex address)
    {
        m_assembler.lock();
        or32(reg, address);
    }

    void atomicXor8(TrustedImm32 imm, Address address)
    {
        m_assembler.lock();
        xor8(imm, address);
    }

    void atomicXor8(TrustedImm32 imm, BaseIndex address)
    {
        m_assembler.lock();
        xor8(imm, address);
    }

    void atomicXor8(RegisterID reg, Address address)
    {
        m_assembler.lock();
        xor8(reg, address);
    }

    void atomicXor8(RegisterID reg, BaseIndex address)
    {
        m_assembler.lock();
        xor8(reg, address);
    }

    void atomicXor16(TrustedImm32 imm, Address address)
    {
        m_assembler.lock();
        xor16(imm, address);
    }

    void atomicXor16(TrustedImm32 imm, BaseIndex address)
    {
        m_assembler.lock();
        xor16(imm, address);
    }

    void atomicXor16(RegisterID reg, Address address)
    {
        m_assembler.lock();
        xor16(reg, address);
    }

    void atomicXor16(RegisterID reg, BaseIndex address)
    {
        m_assembler.lock();
        xor16(reg, address);
    }

    void atomicXor32(TrustedImm32 imm, Address address)
    {
        m_assembler.lock();
        xor32(imm, address);
    }

    void atomicXor32(TrustedImm32 imm, BaseIndex address)
    {
        m_assembler.lock();
        xor32(imm, address);
    }

    void atomicXor32(RegisterID reg, Address address)
    {
        m_assembler.lock();
        xor32(reg, address);
    }

    void atomicXor32(RegisterID reg, BaseIndex address)
    {
        m_assembler.lock();
        xor32(reg, address);
    }

    void atomicNeg8(Address address)
    {
        m_assembler.lock();
        neg8(address);
    }

    void atomicNeg8(BaseIndex address)
    {
        m_assembler.lock();
        neg8(address);
    }

    void atomicNeg16(Address address)
    {
        m_assembler.lock();
        neg16(address);
    }

    void atomicNeg16(BaseIndex address)
    {
        m_assembler.lock();
        neg16(address);
    }

    void atomicNeg32(Address address)
    {
        m_assembler.lock();
        neg32(address);
    }

    void atomicNeg32(BaseIndex address)
    {
        m_assembler.lock();
        neg32(address);
    }

    void atomicNot8(Address address)
    {
        m_assembler.lock();
        not8(address);
    }

    void atomicNot8(BaseIndex address)
    {
        m_assembler.lock();
        not8(address);
    }

    void atomicNot16(Address address)
    {
        m_assembler.lock();
        not16(address);
    }

    void atomicNot16(BaseIndex address)
    {
        m_assembler.lock();
        not16(address);
    }

    void atomicNot32(Address address)
    {
        m_assembler.lock();
        not32(address);
    }

    void atomicNot32(BaseIndex address)
    {
        m_assembler.lock();
        not32(address);
    }

    void atomicXchgAdd8(RegisterID reg, Address address)
    {
        m_assembler.lock();
        m_assembler.xaddb_rm(reg, address.offset, address.base);
    }

    void atomicXchgAdd8(RegisterID reg, BaseIndex address)
    {
        m_assembler.lock();
        m_assembler.xaddb_rm(reg, address.offset, address.base, address.index, address.scale);
    }

    void atomicXchgAdd16(RegisterID reg, Address address)
    {
        m_assembler.lock();
        m_assembler.xaddw_rm(reg, address.offset, address.base);
    }

    void atomicXchgAdd16(RegisterID reg, BaseIndex address)
    {
        m_assembler.lock();
        m_assembler.xaddw_rm(reg, address.offset, address.base, address.index, address.scale);
    }

    void atomicXchgAdd32(RegisterID reg, Address address)
    {
        m_assembler.lock();
        m_assembler.xaddl_rm(reg, address.offset, address.base);
    }

    void atomicXchgAdd32(RegisterID reg, BaseIndex address)
    {
        m_assembler.lock();
        m_assembler.xaddl_rm(reg, address.offset, address.base, address.index, address.scale);
    }

    void atomicXchg8(RegisterID reg, Address address)
    {
        m_assembler.xchgb_rm(reg, address.offset, address.base);
    }

    void atomicXchg8(RegisterID reg, BaseIndex address)
    {
        m_assembler.xchgb_rm(reg, address.offset, address.base, address.index, address.scale);
    }

    void atomicXchg16(RegisterID reg, Address address)
    {
        m_assembler.xchgw_rm(reg, address.offset, address.base);
    }

    void atomicXchg16(RegisterID reg, BaseIndex address)
    {
        m_assembler.xchgw_rm(reg, address.offset, address.base, address.index, address.scale);
    }

    void atomicXchg32(RegisterID reg, Address address)
    {
        m_assembler.xchgl_rm(reg, address.offset, address.base);
    }

    void atomicXchg32(RegisterID reg, BaseIndex address)
    {
        m_assembler.xchgl_rm(reg, address.offset, address.base, address.index, address.scale);
    }

    void atomicLoad32(Address address, RegisterID dest)
    {
        load32(address, dest);
    }

    void atomicLoad32(BaseIndex address, RegisterID dest)
    {
        load32(address, dest);
    }

    // We take this to mean that it prevents motion of normal stores. So, it's a no-op on x86.
    void storeFence()
    {
    }

    // We take this to mean that it prevents motion of normal loads. So, it's a no-op on x86.
    void loadFence()
    {
    }

#if ENABLE(FAST_TLS_JIT)
    void loadFromTLS32(uint32_t offset, RegisterID dst)
    {
        m_assembler.gs();
        m_assembler.movl_mr(offset, dst);
    }


    static bool loadFromTLSPtrNeedsMacroScratchRegister()
    {
        return false;
    }

    void storeToTLS32(RegisterID src, uint32_t offset)
    {
        m_assembler.gs();
        m_assembler.movl_rm(src, offset);
    }

    static bool storeToTLSPtrNeedsMacroScratchRegister()
    {
        return false;
    }
#endif

    template<PtrTag tag>
    static void replaceWithVMHalt(CodeLocationLabel<tag> instructionStart)
    {
        X86Assembler::replaceWithHlt(instructionStart.taggedPtr());
    }

    template<PtrTag startTag, PtrTag destTag>
    static void replaceWithJump(CodeLocationLabel<startTag> instructionStart, CodeLocationLabel<destTag> destination)
    {
        X86Assembler::replaceWithJump(instructionStart.taggedPtr(), destination.taggedPtr());
    }

    template<PtrTag startTag>
    static void replaceWithNops(CodeLocationLabel<startTag> instructionStart, size_t memoryToFillWithNopsInBytes)
    {
        X86Assembler::replaceWithNops(instructionStart.taggedPtr(), memoryToFillWithNopsInBytes);
    }

    static ptrdiff_t maxJumpReplacementSize()
    {
        return X86Assembler::maxJumpReplacementSize();
    }

    static ptrdiff_t patchableJumpSize()
    {
        return X86Assembler::patchableJumpSize();
    }

    static bool supportsSSE4_1()
    {
        if (s_sse4_1CheckState == CPUIDCheckState::NotChecked)
            collectCPUFeatures();
        return s_sse4_1CheckState == CPUIDCheckState::Set;
    }

    static bool supportsFloatingPointRounding()
    {
        if (s_sse4_1CheckState == CPUIDCheckState::NotChecked)
            collectCPUFeatures();
        return s_sse4_1CheckState == CPUIDCheckState::Set;
    }

    static bool supportsCountPopulation()
    {
        if (s_popcntCheckState == CPUIDCheckState::NotChecked)
            collectCPUFeatures();
        return s_popcntCheckState == CPUIDCheckState::Set;
    }

    static bool supportsSSE3()
    {
        if (s_sse3CheckState == CPUIDCheckState::NotChecked)
            collectCPUFeatures();
        return s_sse3CheckState == CPUIDCheckState::Set;
    }

    static bool supportsSupplementalSSE3()
    {
        if (s_supplementalSSE3CheckState == CPUIDCheckState::NotChecked)
            collectCPUFeatures();
        return s_supplementalSSE3CheckState == CPUIDCheckState::Set;
    }

    static bool supportsAVX()
    {
        if (s_avxCheckState == CPUIDCheckState::NotChecked)
            collectCPUFeatures();
        return s_avxCheckState == CPUIDCheckState::Set;
    }

    static bool supportsAVX2()
    {
        if (s_avx2CheckState == CPUIDCheckState::NotChecked)
            collectCPUFeatures();
        return s_avx2CheckState == CPUIDCheckState::Set;
    }

    void lfence()
    {
        m_assembler.lfence();
    }

    void mfence()
    {
        m_assembler.mfence();
    }

    void sfence()
    {
        m_assembler.sfence();
    }

    void rdtsc()
    {
        m_assembler.rdtsc();
    }

    void pause()
    {
        m_assembler.pause();
    }

    void cpuid()
    {
        m_assembler.cpuid();
    }

protected:
    X86Assembler::Condition x86Condition(RelationalCondition cond)
    {
        return static_cast<X86Assembler::Condition>(cond);
    }

    X86Assembler::Condition x86Condition(ResultCondition cond)
    {
        return static_cast<X86Assembler::Condition>(cond);
    }

    X86Assembler::Condition x86Condition(StatusCondition cond)
    {
        switch (cond) {
        case Success:
            return X86Assembler::ConditionE;
        case Failure:
            return X86Assembler::ConditionNE;
        }
        RELEASE_ASSERT_NOT_REACHED();
        return X86Assembler::ConditionE;
    }

    void set32(X86Assembler::Condition cond, RegisterID dest)
    {
        m_assembler.setCC_r(cond, dest);
        m_assembler.movzbl_rr(dest, dest);
    }

    void cmov(X86Assembler::Condition cond, RegisterID src, RegisterID dest)
    {
        m_assembler.cmovq_rr(cond, src, dest);
    }

    static bool supportsLZCNT()
    {
        if (s_lzcntCheckState == CPUIDCheckState::NotChecked)
            collectCPUFeatures();
        return s_lzcntCheckState == CPUIDCheckState::Set;
    }

    static bool supportsBMI1()
    {
        if (s_bmi1CheckState == CPUIDCheckState::NotChecked)
            collectCPUFeatures();
        return s_bmi1CheckState == CPUIDCheckState::Set;
    }

    template<int sizeOfRegister>
    void ctzAfterBsf(RegisterID dst)
    {
        Jump srcIsNonZero = m_assembler.jCC(x86Condition(NonZero));
        move(TrustedImm32(sizeOfRegister), dst);
        srcIsNonZero.link(this);
    }

    template<typename AddressType, typename Func>
    void atomicStrongCAS(StatusCondition cond, RegisterID expectedAndResult, RegisterID result, AddressType& address, const Func& func)
    {
        address = address.withSwappedRegister(X86Registers::eax, expectedAndResult);
        swap(expectedAndResult, X86Registers::eax);
        m_assembler.lock();
        func();
        swap(expectedAndResult, X86Registers::eax);
        set32(x86Condition(cond), result);
    }

    template<typename AddressType, typename Func>
    void atomicStrongCAS(RegisterID expectedAndResult, AddressType& address, const Func& func)
    {
        address = address.withSwappedRegister(X86Registers::eax, expectedAndResult);
        swap(expectedAndResult, X86Registers::eax);
        m_assembler.lock();
        func();
        swap(expectedAndResult, X86Registers::eax);
    }

    template<typename AddressType, typename Func>
    Jump branchAtomicStrongCAS(StatusCondition cond, RegisterID expectedAndResult, AddressType& address, const Func& func)
    {
        address = address.withSwappedRegister(X86Registers::eax, expectedAndResult);
        swap(expectedAndResult, X86Registers::eax);
        m_assembler.lock();
        func();
        swap(expectedAndResult, X86Registers::eax);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

private:
    // Only MacroAssemblerX86 should be using the following method; SSE2 is always available on
    // x86_64, and clients & subclasses of MacroAssembler should be using 'supportsFloatingPoint()'.
    friend class MacroAssemblerX86;

    ALWAYS_INLINE void generateTest32(Address address, TrustedImm32 mask = TrustedImm32(-1))
    {
        if (mask.m_value == -1)
            m_assembler.cmpl_im(0, address.offset, address.base);
        else if (!(mask.m_value & ~0xff))
            m_assembler.testb_im(mask.m_value, address.offset, address.base);
        else if (!(mask.m_value & ~0xff00))
            m_assembler.testb_im(mask.m_value >> 8, address.offset + 1, address.base);
        else if (!(mask.m_value & ~0xff0000))
            m_assembler.testb_im(mask.m_value >> 16, address.offset + 2, address.base);
        else if (!(mask.m_value & ~0xff000000))
            m_assembler.testb_im(mask.m_value >> 24, address.offset + 3, address.base);
        else
            m_assembler.testl_i32m(mask.m_value, address.offset, address.base);
    }

    // If lzcnt is not available, use this after BSR
    // to count the leading zeros.
    void clz32AfterBsr(RegisterID dst)
    {
        Jump srcIsNonZero = m_assembler.jCC(x86Condition(NonZero));
        move(TrustedImm32(32), dst);

        Jump skipNonZeroCase = jump();
        srcIsNonZero.link(this);
        xor32(TrustedImm32(0x1f), dst);
        skipNonZeroCase.link(this);
    }

    template<typename Function>
    void floatingPointCompare(DoubleCondition cond, FPRegisterID left, FPRegisterID right, RegisterID dest, Function compare)
    {
        if (cond & DoubleConditionBitSpecial) {
            ASSERT(!(cond & DoubleConditionBitInvert));
            if (cond == DoubleEqualAndOrdered) {
                if (left == right) {
                    compare(right, left);
                    set32(X86Assembler::ConditionNP, dest);
                    return;
                }

                move(TrustedImm32(0), dest);
                compare(right, left);
                Jump isUnordered = m_assembler.jp();
                set32(X86Assembler::ConditionE, dest);
                isUnordered.link(this);
                return;
            }
            if (cond == DoubleNotEqualOrUnordered) {
                if (left == right) {
                    compare(right, left);
                    set32(X86Assembler::ConditionP, dest);
                    return;
                }

                move(TrustedImm32(1), dest);
                compare(right, left);
                Jump isUnordered = m_assembler.jp();
                set32(X86Assembler::ConditionNE, dest);
                isUnordered.link(this);
                return;
            }

            RELEASE_ASSERT_NOT_REACHED();
            return;
        }

        if (cond & DoubleConditionBitInvert)
            compare(left, right);
        else
            compare(right, left);
        set32(static_cast<X86Assembler::Condition>(cond & ~DoubleConditionBits), dest);
    }

    Jump jumpAfterFloatingPointCompare(DoubleCondition cond, FPRegisterID left, FPRegisterID right)
    {
        if (cond == DoubleEqualAndOrdered) {
            if (left == right)
                return Jump(m_assembler.jnp());
            Jump isUnordered(m_assembler.jp());
            Jump result = Jump(m_assembler.je());
            isUnordered.link(this);
            return result;
        }
        if (cond == DoubleNotEqualOrUnordered) {
            if (left == right)
                return Jump(m_assembler.jp());
            Jump isUnordered(m_assembler.jp());
            Jump isEqual(m_assembler.je());
            isUnordered.link(this);
            Jump result = jump();
            isEqual.link(this);
            return result;
        }

        ASSERT(!(cond & DoubleConditionBitSpecial));
        return Jump(m_assembler.jCC(static_cast<X86Assembler::Condition>(cond & ~DoubleConditionBits)));
    }

    // The 32bit Move does not need the REX byte for low registers, making it shorter.
    // Use this if the top bits are irrelevant because they will be reset by the next instruction.
    void move32IfNeeded(RegisterID src, RegisterID dest)
    {
        if (src == dest)
            return;
        m_assembler.movl_rr(src, dest);
    }

    void moveConditionallyAfterFloatingPointCompare(DoubleCondition cond, FPRegisterID left, FPRegisterID right, RegisterID src, RegisterID dest)
    {
        if (cond == DoubleEqualAndOrdered) {
            if (left == right) {
                m_assembler.cmovnpq_rr(src, dest);
                return;
            }

            Jump isUnordered(m_assembler.jp());
            m_assembler.cmoveq_rr(src, dest);
            isUnordered.link(this);
            return;
        }

        if (cond == DoubleNotEqualOrUnordered) {
            if (left == right) {
                m_assembler.cmovpq_rr(src, dest);
                return;
            }

            m_assembler.cmovpq_rr(src, dest);
            m_assembler.cmovneq_rr(src, dest);
            return;
        }

        ASSERT(!(cond & DoubleConditionBitSpecial));
        cmov(static_cast<X86Assembler::Condition>(cond & ~DoubleConditionBits), src, dest);
    }

public:
    void add32(TrustedImm32 imm, AbsoluteAddress address)
    {
        move(TrustedImmPtr(address.m_ptr), scratchRegister());
        add32(imm, Address(scratchRegister()));
    }
    
    void and32(TrustedImm32 imm, AbsoluteAddress address)
    {
        move(TrustedImmPtr(address.m_ptr), scratchRegister());
        and32(imm, Address(scratchRegister()));
    }
    
    void add32(AbsoluteAddress address, RegisterID dest)
    {
        move(TrustedImmPtr(address.m_ptr), scratchRegister());
        add32(Address(scratchRegister()), dest);
    }
    
    void or32(TrustedImm32 imm, AbsoluteAddress address)
    {
        move(TrustedImmPtr(address.m_ptr), scratchRegister());
        or32(imm, Address(scratchRegister()));
    }

    void or32(RegisterID reg, AbsoluteAddress address)
    {
        move(TrustedImmPtr(address.m_ptr), scratchRegister());
        or32(reg, Address(scratchRegister()));
    }

    void or16(TrustedImm32 imm, AbsoluteAddress address)
    {
        move(TrustedImmPtr(address.m_ptr), scratchRegister());
        or16(imm, Address(scratchRegister()));
    }

    void or16(RegisterID mask, AbsoluteAddress address)
    {
        move(TrustedImmPtr(address.m_ptr), scratchRegister());
        or16(mask, Address(scratchRegister()));
    }

    void sub32(TrustedImm32 imm, AbsoluteAddress address)
    {
        move(TrustedImmPtr(address.m_ptr), scratchRegister());
        sub32(imm, Address(scratchRegister()));
    }

    void load8(const void* address, RegisterID dest)
    {
        move(TrustedImmPtr(address), dest);
        load8(Address(dest), dest);
    }

    void load16(ExtendedAddress address, RegisterID dest)
    {
        TrustedImmPtr addr(reinterpret_cast<void*>(address.offset));
        move(addr, scratchRegister());
        load16(BaseIndex(scratchRegister(), address.base, TimesTwo), dest);
    }

    void load32(const void* address, RegisterID dest)
    {
        if (dest == X86Registers::eax)
            m_assembler.movl_mEAX(address);
        else {
            move(TrustedImmPtr(address), dest);
            load32(Address(dest), dest);
        }
    }

    void clearSIMDStatus()
    {
        if (supportsAVX())
            m_assembler.vzeroupper();
    }

    void addDouble(AbsoluteAddress address, FPRegisterID dest)
    {
        move(TrustedImmPtr(address.m_ptr), scratchRegister());
        if (supportsAVX())
            m_assembler.vaddsd_mrr(0, scratchRegister(), dest, dest);
        else
            m_assembler.addsd_mr(0, scratchRegister(), dest);
    }

    void convertInt32ToDouble(TrustedImm32 imm, FPRegisterID dest)
    {
        move(imm, scratchRegister());
        if (supportsAVX())
            m_assembler.vcvtsi2sd_rrr(scratchRegister(), dest, dest);
        else
            m_assembler.cvtsi2sd_rr(scratchRegister(), dest);
    }

    void store32(TrustedImm32 imm, void* address)
    {
        move(TrustedImmPtr(address), scratchRegister());
        store32(imm, Address(scratchRegister()));
    }

    void store32(RegisterID source, void* address)
    {
        if (source == X86Registers::eax)
            m_assembler.movl_EAXm(address);
        else {
            move(TrustedImmPtr(address), scratchRegister());
            store32(source, Address(scratchRegister()));
        }
    }
    
    void store8(TrustedImm32 imm, void* address)
    {
        TrustedImm32 imm8(static_cast<int8_t>(imm.m_value));
        move(TrustedImmPtr(address), scratchRegister());
        store8(imm8, Address(scratchRegister()));
    }

    void store8(RegisterID reg, void* address)
    {
        move(TrustedImmPtr(address), scratchRegister());
        store8(reg, Address(scratchRegister()));
    }

    Call call(PtrTag)
    {
        DataLabelPtr label = moveWithPatch(TrustedImmPtr(nullptr), scratchRegister());
        Call result = Call(m_assembler.call(scratchRegister()), Call::Linkable);
        ASSERT_UNUSED(label, differenceBetween(label, result) == REPATCH_OFFSET_CALL_R11);
        return result;
    }

    template<PtrTag tag>
    void callOperation(const CodePtr<tag> operation)
    {
        move(TrustedImmPtr(operation.taggedPtr()), scratchRegister());
        m_assembler.call(scratchRegister());
    }

    ALWAYS_INLINE Call call(RegisterID callTag) { return UNUSED_PARAM(callTag), call(NoPtrTag); }

    // Address is a memory location containing the address to jump to
    void farJump(AbsoluteAddress address, PtrTag tag)
    {
        move(TrustedImmPtr(address.m_ptr), scratchRegister());
        farJump(Address(scratchRegister()), tag);
    }

    ALWAYS_INLINE void farJump(AbsoluteAddress address, RegisterID jumpTag) { UNUSED_PARAM(jumpTag), farJump(address, NoPtrTag); }

    Call threadSafePatchableNearCall()
    {
        padBeforePatch();
        const size_t nearCallOpcodeSize = 1;
        const size_t nearCallRelativeLocationSize = sizeof(int32_t);
        // We want to make sure the 32-bit near call immediate is 32-bit aligned.
        size_t codeSize = m_assembler.codeSize();
        size_t alignedSize = WTF::roundUpToMultipleOf<nearCallRelativeLocationSize>(codeSize + nearCallOpcodeSize);
        emitNops(alignedSize - (codeSize + nearCallOpcodeSize));
        DataLabelPtr label = DataLabelPtr(this);
        Call result = nearCall();
        ASSERT_UNUSED(label, differenceBetween(label, result) == (nearCallOpcodeSize + nearCallRelativeLocationSize));
        return result;
    }

    Call threadSafePatchableNearTailCall()
    {
        const size_t nearCallOpcodeSize = 1;
        const size_t nearCallRelativeLocationSize = sizeof(int32_t);
        // We want to make sure the 32-bit near call immediate is 32-bit aligned.
        size_t codeSize = m_assembler.codeSize();
        size_t alignedSize = WTF::roundUpToMultipleOf<nearCallRelativeLocationSize>(codeSize + nearCallOpcodeSize);
        emitNops(alignedSize - (codeSize + nearCallOpcodeSize));
        DataLabelPtr label = DataLabelPtr(this);
        Call result = nearTailCall();
        ASSERT_UNUSED(label, differenceBetween(label, result) == (nearCallOpcodeSize + nearCallRelativeLocationSize));
        return result;
    }

    Jump branchAdd32(ResultCondition cond, TrustedImm32 src, AbsoluteAddress dest)
    {
        move(TrustedImmPtr(dest.m_ptr), scratchRegister());
        add32(src, Address(scratchRegister()));
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    void add64(RegisterID src, RegisterID dest)
    {
        m_assembler.addq_rr(src, dest);
    }
    
    void add64(Address src, RegisterID dest)
    {
        m_assembler.addq_mr(src.offset, src.base, dest);
    }

    void add64(BaseIndex src, RegisterID dest)
    {
        m_assembler.addq_mr(src.offset, src.base, src.index, src.scale, dest);
    }

    void add64(RegisterID src, Address dest)
    {
        m_assembler.addq_rm(src, dest.offset, dest.base);
    }

    void add64(RegisterID src, BaseIndex dest)
    {
        m_assembler.addq_rm(src, dest.offset, dest.base, dest.index, dest.scale);
    }

    void add64(AbsoluteAddress src, RegisterID dest)
    {
        move(TrustedImmPtr(src.m_ptr), scratchRegister());
        add64(Address(scratchRegister()), dest);
    }

    void add64(TrustedImm32 imm, RegisterID srcDest)
    {
        if (imm.m_value == 1)
            m_assembler.incq_r(srcDest);
        else
            m_assembler.addq_ir(imm.m_value, srcDest);
    }

    void add64(TrustedImm64 imm, RegisterID dest)
    {
        if (imm.m_value == 1)
            m_assembler.incq_r(dest);
        else {
            move(imm, scratchRegister());
            add64(scratchRegister(), dest);
        }
    }

    void add64(TrustedImm32 imm, RegisterID src, RegisterID dest)
    {
        m_assembler.leaq_mr(imm.m_value, src, dest);
    }

    void add64(TrustedImm64 imm, RegisterID src, RegisterID dest)
    {
        if (WTF::isRepresentableAs<int32_t>(imm.m_value))
            m_assembler.leaq_mr(imm.m_value, src, dest);
        else {
            move(src, dest);
            add64(imm, dest);
        }
    }

    void add64(TrustedImm32 imm, Address address)
    {
        if (imm.m_value == 1)
            m_assembler.incq_m(address.offset, address.base);
        else
            m_assembler.addq_im(imm.m_value, address.offset, address.base);
    }

    void add64(TrustedImm32 imm, BaseIndex address)
    {
        if (imm.m_value == 1)
            m_assembler.incq_m(address.offset, address.base, address.index, address.scale);
        else
            m_assembler.addq_im(imm.m_value, address.offset, address.base, address.index, address.scale);
    }

    void add64(TrustedImm32 imm, AbsoluteAddress address)
    {
        move(TrustedImmPtr(address.m_ptr), scratchRegister());
        add64(imm, Address(scratchRegister()));
    }

    void add64(RegisterID a, RegisterID b, RegisterID dest)
    {
        x86Lea64(BaseIndex(a, b, TimesOne), dest);
    }

    void x86Lea64(BaseIndex index, RegisterID dest)
    {
        if (!index.scale && !index.offset) {
            if (index.base == dest) {
                add64(index.index, dest);
                return;
            }
            if (index.index == dest) {
                add64(index.base, dest);
                return;
            }
        }
        m_assembler.leaq_mr(index.offset, index.base, index.index, index.scale, dest);
    }

    void getEffectiveAddress(BaseIndex address, RegisterID dest)
    {
        return x86Lea64(address, dest);
    }

    void addPtrNoFlags(TrustedImm32 imm, RegisterID srcDest)
    {
        m_assembler.leaq_mr(imm.m_value, srcDest, srcDest);
    }

    void and64(RegisterID src, RegisterID dest)
    {
        m_assembler.andq_rr(src, dest);
    }

    void and64(RegisterID src, Address dest)
    {
        m_assembler.andq_rm(src, dest.offset, dest.base);
    }

    void and64(RegisterID src, BaseIndex dest)
    {
        m_assembler.andq_rm(src, dest.offset, dest.base, dest.index, dest.scale);
    }

    void and64(Address src, RegisterID dest)
    {
        m_assembler.andq_mr(src.offset, src.base, dest);
    }

    void and64(BaseIndex src, RegisterID dest)
    {
        m_assembler.andq_mr(src.offset, src.base, src.index, src.scale, dest);
    }

    void and64(TrustedImm32 imm, RegisterID srcDest)
    {
        m_assembler.andq_ir(imm.m_value, srcDest);
    }

    void and64(TrustedImm32 imm, Address dest)
    {
        m_assembler.andq_im(imm.m_value, dest.offset, dest.base);
    }

    void and64(TrustedImm32 imm, BaseIndex dest)
    {
        m_assembler.andq_im(imm.m_value, dest.offset, dest.base, dest.index, dest.scale);
    }

    void and64(TrustedImmPtr imm, RegisterID srcDest)
    {
        static_assert(sizeof(void*) == sizeof(int64_t));
        and64(TrustedImm64(std::bit_cast<int64_t>(imm.m_value)), srcDest);
    }

    void and64(TrustedImm64 imm, RegisterID srcDest)
    {
        int64_t intValue = imm.m_value;
        if (isRepresentableAs<int32_t>(intValue)) {
            and64(TrustedImm32(static_cast<int32_t>(intValue)), srcDest);
            return;
        }
        move(imm, scratchRegister());
        and64(scratchRegister(), srcDest);
    }

    void and64(RegisterID op1, RegisterID op2, RegisterID dest)
    {
        if (op1 == op2 && op1 != dest && op2 != dest)
            move(op1, dest);
        else if (op1 == dest)
            and64(op2, dest);
        else {
            move(op2, dest);
            and64(op1, dest);
        }
    }

    void and64(TrustedImm32 imm, RegisterID src, RegisterID dest)
    {
        move(src, dest);
        and64(imm, dest);
    }

    void and64(TrustedImm64 imm, RegisterID src, RegisterID dest)
    {
        move(src, dest);
        and64(imm, dest);
    }

    void countLeadingZeros64(RegisterID src, RegisterID dst)
    {
        if (supportsLZCNT()) {
            m_assembler.lzcntq_rr(src, dst);
            return;
        }
        m_assembler.bsrq_rr(src, dst);
        clz64AfterBsr(dst);
    }

    void countLeadingZeros64(Address src, RegisterID dst)
    {
        if (supportsLZCNT()) {
            m_assembler.lzcntq_mr(src.offset, src.base, dst);
            return;
        }
        m_assembler.bsrq_mr(src.offset, src.base, dst);
        clz64AfterBsr(dst);
    }

    void countTrailingZeros64(RegisterID src, RegisterID dst)
    {
        if (supportsBMI1()) {
            m_assembler.tzcntq_rr(src, dst);
            return;
        }
        m_assembler.bsfq_rr(src, dst);
        ctzAfterBsf<64>(dst);
    }

    void countTrailingZeros64WithoutNullCheck(RegisterID src, RegisterID dst)
    {
#if ASSERT_ENABLED
        Jump notZero = branchTest64(NonZero, src);
        abortWithReason(MacroAssemblerOops, __LINE__);
        notZero.link(this);
#endif
        if (supportsBMI1()) {
            m_assembler.tzcntq_rr(src, dst);
            return;
        }
        m_assembler.bsfq_rr(src, dst);
    }

    void clearBit64(RegisterID bitToClear, RegisterID dst, RegisterID = InvalidGPRReg)
    {
        m_assembler.btrq_rr(dst, bitToClear);
    }

    enum class ClearBitsAttributes {
        OKToClobberMask,
        MustPreserveMask
    };

    void clearBits64WithMask(RegisterID mask, RegisterID dest, ClearBitsAttributes maskPreservation = ClearBitsAttributes::OKToClobberMask)
    {
        not64(mask);
        m_assembler.andq_rr(mask, dest);
        if (maskPreservation == ClearBitsAttributes::MustPreserveMask)
            not64(mask);
    }

    void clearBits64WithMask(RegisterID src, RegisterID mask, RegisterID dest, ClearBitsAttributes maskPreservation = ClearBitsAttributes::OKToClobberMask)
    {
        move(src, dest);
        clearBits64WithMask(mask, dest, maskPreservation);
    }

    void countPopulation64(RegisterID src, RegisterID dst)
    {
        ASSERT(supportsCountPopulation());
        m_assembler.popcntq_rr(src, dst);
    }

    void countPopulation64(Address src, RegisterID dst)
    {
        ASSERT(supportsCountPopulation());
        m_assembler.popcntq_mr(src.offset, src.base, dst);
    }

    void countPopulation64(RegisterID src, RegisterID dst, FPRegisterID)
    {
        ASSERT(supportsCountPopulation());
        m_assembler.popcntq_rr(src, dst);
    }

    void countPopulation64(Address src, RegisterID dst, FPRegisterID)
    {
        ASSERT(supportsCountPopulation());
        m_assembler.popcntq_mr(src.offset, src.base, dst);
    }

    void addUnsignedRightShift32(RegisterID src1, RegisterID src2, TrustedImm32 amount, RegisterID dest)
    {
        // dest = src1 + (src2 >> amount)
        urshift32(src2, amount, scratchRegister());
        add32(src1, scratchRegister(), dest);
    }

    void lshift64(TrustedImm32 imm, RegisterID dest)
    {
        if (UNLIKELY(!imm.m_value))
            return;
        m_assembler.shlq_i8r(imm.m_value, dest);
    }
    
    void lshift64(RegisterID src, RegisterID dest)
    {
        if (src == X86Registers::ecx)
            m_assembler.shlq_CLr(dest);
        else {
            ASSERT(src != dest);

            // Can only shift by ecx, so we do some swapping if we see anything else.
            swap(src, X86Registers::ecx);
            m_assembler.shlq_CLr(dest == X86Registers::ecx ? src : dest);
            swap(src, X86Registers::ecx);
        }
    }

    void lshift64(RegisterID src, TrustedImm32 imm, RegisterID dest)
    {
        if (src == dest)
            lshift64(imm, src);
        else {
            move(src, dest);
            lshift64(imm, dest);
        }
    }

    void lshift64(TrustedImm32 imm, RegisterID shiftAmount, RegisterID dest)
    {
        if (shiftAmount == dest) {
            move(imm, scratchRegister());
            lshift64(shiftAmount, scratchRegister());
            move(scratchRegister(), dest);
        } else {
            move(imm, dest);
            lshift64(shiftAmount, dest);
        }
    }

    void lshift64(Address src, RegisterID shiftAmount, RegisterID dest)
    {
        if (shiftAmount == dest) {
            move(shiftAmount, scratchRegister());
            load64(src, dest);
            lshift64(scratchRegister(), dest);
        } else {
            load64(src, dest);
            lshift64(shiftAmount, dest);
        }
    }

    void lshift64(RegisterID src, RegisterID shiftAmount, RegisterID dest)
    {
        if (shiftAmount == dest) {
            move(shiftAmount, scratchRegister());
            move(src, dest);
            lshift64(scratchRegister(), dest);
        } else {
            move(src, dest);
            lshift64(shiftAmount, dest);
        }
    }

    void rshift64(TrustedImm32 imm, RegisterID dest)
    {
        if (UNLIKELY(!imm.m_value))
            return;
        m_assembler.sarq_i8r(imm.m_value, dest);
    }

    void rshift64(RegisterID src, RegisterID dest)
    {
        if (src == X86Registers::ecx)
            m_assembler.sarq_CLr(dest);
        else {
            ASSERT(src != dest);
            
            // Can only shift by ecx, so we do some swapping if we see anything else.
            swap(src, X86Registers::ecx);
            m_assembler.sarq_CLr(dest == X86Registers::ecx ? src : dest);
            swap(src, X86Registers::ecx);
        }
    }

    void rshift64(RegisterID src, TrustedImm32 imm, RegisterID dest)
    {
        move(src, dest);
        rshift64(imm, dest);
    }

    void rshift64(RegisterID src, RegisterID shiftAmount, RegisterID dest)
    {
        if (shiftAmount == dest) {
            move(shiftAmount, scratchRegister());
            move(src, dest);
            rshift64(scratchRegister(), dest);
        } else {
            move(src, dest);
            rshift64(shiftAmount, dest);
        }
    }

    void urshift64(TrustedImm32 imm, RegisterID dest)
    {
        if (UNLIKELY(!imm.m_value))
            return;
        m_assembler.shrq_i8r(imm.m_value, dest);
    }

    void urshift64(RegisterID src, RegisterID dest)
    {
        if (src == X86Registers::ecx)
            m_assembler.shrq_CLr(dest);
        else {
            ASSERT(src != dest);
            
            // Can only shift by ecx, so we do some swapping if we see anything else.
            swap(src, X86Registers::ecx);
            m_assembler.shrq_CLr(dest == X86Registers::ecx ? src : dest);
            swap(src, X86Registers::ecx);
        }
    }

    void urshift64(RegisterID src, RegisterID shiftAmount, RegisterID dest)
    {
        if (shiftAmount == dest) {
            move(shiftAmount, scratchRegister());
            move(src, dest);
            urshift64(scratchRegister(), dest);
        } else {
            move(src, dest);
            urshift64(shiftAmount, dest);
        }
    }

    void urshift64(RegisterID src, TrustedImm32 imm, RegisterID dest)
    {
        move(src, dest);
        urshift64(imm, dest);
    }

    void rotateRight64(TrustedImm32 imm, RegisterID dest)
    {
        if (UNLIKELY(!imm.m_value))
            return;
        m_assembler.rorq_i8r(imm.m_value, dest);
    }

    void rotateRight64(RegisterID src, RegisterID dest)
    {
        if (src == X86Registers::ecx)
            m_assembler.rorq_CLr(dest);
        else {
            ASSERT(src != dest);

            // Can only rotate by ecx, so we do some swapping if we see anything else.
            swap(src, X86Registers::ecx);
            m_assembler.rorq_CLr(dest == X86Registers::ecx ? src : dest);
            swap(src, X86Registers::ecx);
        }
    }

    void rotateRight64(RegisterID src, RegisterID shiftAmount, RegisterID dest)
    {
        if (shiftAmount == dest) {
            move(shiftAmount, scratchRegister());
            move(src, dest);
            rotateRight64(scratchRegister(), dest);
        } else {
            move(src, dest);
            rotateRight64(shiftAmount, dest);
        }
    }

    void rotateRight64(RegisterID src, TrustedImm32 shiftAmount, RegisterID dest)
    {
        move(src, dest);
        rotateRight64(shiftAmount, dest);
    }

    void rotateLeft64(TrustedImm32 imm, RegisterID dest)
    {
        if (UNLIKELY(!imm.m_value))
            return;
        m_assembler.rolq_i8r(imm.m_value, dest);
    }

    void rotateLeft64(RegisterID src, RegisterID dest)
    {
        if (src == X86Registers::ecx)
            m_assembler.rolq_CLr(dest);
        else {
            ASSERT(src != dest);

            // Can only rotate by ecx, so we do some swapping if we see anything else.
            swap(src, X86Registers::ecx);
            m_assembler.rolq_CLr(dest == X86Registers::ecx ? src : dest);
            swap(src, X86Registers::ecx);
        }
    }

    void rotateLeft64(RegisterID src, RegisterID shiftAmount, RegisterID dest)
    {
        if (shiftAmount == dest) {
            move(shiftAmount, scratchRegister());
            move(src, dest);
            rotateLeft64(scratchRegister(), dest);
        } else {
            move(src, dest);
            rotateLeft64(shiftAmount, dest);
        }
    }

    void rotateLeft64(RegisterID src, TrustedImm32 shiftAmount, RegisterID dest)
    {
        move(src, dest);
        rotateLeft64(shiftAmount, dest);
    }

    void mul64(RegisterID src, RegisterID dest)
    {
        m_assembler.imulq_rr(src, dest);
    }

    void mul64(RegisterID src1, RegisterID src2, RegisterID dest)
    {
        if (src2 == dest) {
            m_assembler.imulq_rr(src1, dest);
            return;
        }
        move(src1, dest);
        m_assembler.imulq_rr(src2, dest);
    }
    
    void x86ConvertToQuadWord64()
    {
        m_assembler.cqo();
    }

    void x86ConvertToQuadWord64(RegisterID rax, RegisterID rdx)
    {
        ASSERT_UNUSED(rax, rax == X86Registers::eax);
        ASSERT_UNUSED(rdx, rdx == X86Registers::edx);
        x86ConvertToQuadWord64();
    }

    void x86Div64(RegisterID denominator)
    {
        m_assembler.idivq_r(denominator);
    }

    void x86Div64(RegisterID rax, RegisterID rdx, RegisterID denominator)
    {
        ASSERT_UNUSED(rax, rax == X86Registers::eax);
        ASSERT_UNUSED(rdx, rdx == X86Registers::edx);
        x86Div64(denominator);
    }

    void x86UDiv64(RegisterID denominator)
    {
        m_assembler.divq_r(denominator);
    }

    void x86UDiv64(RegisterID rax, RegisterID rdx, RegisterID denominator)
    {
        ASSERT_UNUSED(rax, rax == X86Registers::eax);
        ASSERT_UNUSED(rdx, rdx == X86Registers::edx);
        x86UDiv64(denominator);
    }

    void neg64(RegisterID dest)
    {
        m_assembler.negq_r(dest);
    }

    void neg64(RegisterID src, RegisterID dest)
    {
        move(src, dest);
        m_assembler.negq_r(dest);
    }

    void neg64(Address dest)
    {
        m_assembler.negq_m(dest.offset, dest.base);
    }

    void neg64(BaseIndex dest)
    {
        m_assembler.negq_m(dest.offset, dest.base, dest.index, dest.scale);
    }

    void or64(RegisterID src, RegisterID dest)
    {
        m_assembler.orq_rr(src, dest);
    }

    void or64(RegisterID src, Address dest)
    {
        m_assembler.orq_rm(src, dest.offset, dest.base);
    }

    void or64(RegisterID src, BaseIndex dest)
    {
        m_assembler.orq_rm(src, dest.offset, dest.base, dest.index, dest.scale);
    }

    void or64(Address src, RegisterID dest)
    {
        m_assembler.orq_mr(src.offset, src.base, dest);
    }

    void or64(BaseIndex src, RegisterID dest)
    {
        m_assembler.orq_mr(src.offset, src.base, src.index, src.scale, dest);
    }

    void or64(TrustedImm32 imm, Address dest)
    {
        m_assembler.orq_im(imm.m_value, dest.offset, dest.base);
    }

    void or64(TrustedImm32 imm, BaseIndex dest)
    {
        m_assembler.orq_im(imm.m_value, dest.offset, dest.base, dest.index, dest.scale);
    }

    void or64(TrustedImm64 imm, RegisterID srcDest)
    {
        if (isRepresentableAs<int32_t>(imm.m_value)) {
            or64(TrustedImm32(static_cast<int32_t>(imm.m_value)), srcDest);
            return;
        }
        move(imm, scratchRegister());
        or64(scratchRegister(), srcDest);
    }

    void or64(TrustedImm32 imm, RegisterID dest)
    {
        m_assembler.orq_ir(imm.m_value, dest);
    }

    void or64(RegisterID op1, RegisterID op2, RegisterID dest)
    {
        if (op1 == op2)
            move(op1, dest);
        else if (op1 == dest)
            or64(op2, dest);
        else {
            move(op2, dest);
            or64(op1, dest);
        }
    }

    void or64(TrustedImm32 imm, RegisterID src, RegisterID dest)
    {
        move(src, dest);
        or64(imm, dest);
    }

    void or64(TrustedImm64 imm, RegisterID src, RegisterID dest)
    {
        move(src, dest);
        or64(imm, dest);
    }

    void sub64(RegisterID src, RegisterID dest)
    {
        m_assembler.subq_rr(src, dest);
    }
    
    void sub64(RegisterID a, RegisterID b, RegisterID dest)
    {
        if (b != dest) {
            move(a, dest);
            sub64(b, dest);
        } else if (a != b) {
            neg64(b);
            add64(a, b);
        } else
            move(TrustedImm32(0), dest);
    }

    void sub64(TrustedImm32 imm, RegisterID dest)
    {
        if (imm.m_value == 1)
            m_assembler.decq_r(dest);
        else
            m_assembler.subq_ir(imm.m_value, dest);
    }

    void sub64(RegisterID a, TrustedImm32 imm, RegisterID dest)
    {
        if (a == dest) {
            sub64(imm, dest);
            return;
        }

        if (UNLIKELY(imm.m_value == INT32_MIN)) {
            move(a, dest);
            sub64(imm, dest);
        } else
            m_assembler.leaq_mr(-imm.m_value, a, dest);
    }

    void sub64(TrustedImm64 imm, RegisterID dest)
    {
        if (imm.m_value == 1)
            m_assembler.decq_r(dest);
        else {
            move(imm, scratchRegister());
            sub64(scratchRegister(), dest);
        }
    }

    void sub64(RegisterID src, TrustedImm64 imm, RegisterID dest)
    {
        if (src == dest) {
            sub64(imm, dest);
            return;
        }

        if (isRepresentableAs<int32_t>(imm.m_value) && LIKELY(imm.m_value != INT32_MIN))
            m_assembler.leaq_mr(-imm.m_value, src, dest);
        else {
            move(src, dest);
            sub64(imm, dest);
        }
    }

    void sub64(TrustedImm32 imm, Address address)
    {
        m_assembler.subq_im(imm.m_value, address.offset, address.base);
    }

    void sub64(TrustedImm32 imm, BaseIndex address)
    {
        m_assembler.subq_im(imm.m_value, address.offset, address.base, address.index, address.scale);
    }

    void sub64(Address src, RegisterID dest)
    {
        m_assembler.subq_mr(src.offset, src.base, dest);
    }

    void sub64(BaseIndex src, RegisterID dest)
    {
        m_assembler.subq_mr(src.offset, src.base, src.index, src.scale, dest);
    }

    void sub64(RegisterID src, Address dest)
    {
        m_assembler.subq_rm(src, dest.offset, dest.base);
    }

    void sub64(RegisterID src, BaseIndex dest)
    {
        m_assembler.subq_rm(src, dest.offset, dest.base, dest.index, dest.scale);
    }

    void xor64(RegisterID src, RegisterID dest)
    {
        m_assembler.xorq_rr(src, dest);
    }

    void xor64(RegisterID op1, RegisterID op2, RegisterID dest)
    {
        if (op1 == op2)
            move(TrustedImm32(0), dest);
        else if (op1 == dest)
            xor64(op2, dest);
        else {
            move(op2, dest);
            xor64(op1, dest);
        }
    }
    
    void xor64(RegisterID src, Address dest)
    {
        m_assembler.xorq_rm(src, dest.offset, dest.base);
    }

    void xor64(RegisterID src, BaseIndex dest)
    {
        m_assembler.xorq_rm(src, dest.offset, dest.base, dest.index, dest.scale);
    }

    void xor64(Address src, RegisterID dest)
    {
        m_assembler.xorq_mr(src.offset, src.base, dest);
    }

    void xor64(BaseIndex src, RegisterID dest)
    {
        m_assembler.xorq_mr(src.offset, src.base, src.index, src.scale, dest);
    }

    void xor64(TrustedImm32 imm, Address dest)
    {
        m_assembler.xorq_im(imm.m_value, dest.offset, dest.base);
    }

    void xor64(TrustedImm32 imm, BaseIndex dest)
    {
        m_assembler.xorq_im(imm.m_value, dest.offset, dest.base, dest.index, dest.scale);
    }

    void xor64(TrustedImm32 imm, RegisterID srcDest)
    {
        m_assembler.xorq_ir(imm.m_value, srcDest);
    }

    void xor64(TrustedImm32 imm, RegisterID src, RegisterID dest)
    {
        move(src, dest);
        xor64(imm, dest);
    }

    void xor64(TrustedImm64 imm, RegisterID srcDest)
    {
        if (isRepresentableAs<int32_t>(imm.m_value))
            return xor64(TrustedImm32(imm.m_value), srcDest);
        move(imm, scratchRegister());
        xor64(scratchRegister(), srcDest);
    }

    void xor64(TrustedImm64 imm, RegisterID src, RegisterID dest)
    {
        move(src, dest);
        xor64(imm, dest);
    }

    void not64(RegisterID srcDest)
    {
        m_assembler.notq_r(srcDest);
    }

    void not64(Address dest)
    {
        m_assembler.notq_m(dest.offset, dest.base);
    }

    void not64(BaseIndex dest)
    {
        m_assembler.notq_m(dest.offset, dest.base, dest.index, dest.scale);
    }

    void zeroExtend8To64(RegisterID src, RegisterID dest)
    {
        zeroExtend8To32(src, dest);
    }

    void signExtend8To64(RegisterID src, RegisterID dest)
    {
        m_assembler.movsbq_rr(src, dest);
    }

    void zeroExtend16To64(RegisterID src, RegisterID dest)
    {
        zeroExtend16To32(src, dest);
    }

    void signExtend16To64(RegisterID src, RegisterID dest)
    {
        m_assembler.movswq_rr(src, dest);
    }

    void load64(Address address, RegisterID dest)
    {
        m_assembler.movq_mr(address.offset, address.base, dest);
    }

    void load64(BaseIndex address, RegisterID dest)
    {
        m_assembler.movq_mr(address.offset, address.base, address.index, address.scale, dest);
    }

    void load64(const void* address, RegisterID dest)
    {
        if (dest == X86Registers::eax)
            m_assembler.movq_mEAX(address);
        else {
            move(TrustedImmPtr(address), dest);
            load64(Address(dest), dest);
        }
    }

    void loadPair64(RegisterID src, RegisterID dest1, RegisterID dest2)
    {
        loadPair64(src, TrustedImm32(0), dest1, dest2);
    }

    void loadPair64(RegisterID src, TrustedImm32 offset, RegisterID dest1, RegisterID dest2)
    {
        ASSERT(dest1 != dest2); // If it is the same, ldp becomes illegal instruction.
        if (src == dest1) {
            load64(Address(src, offset.m_value + 8), dest2);
            load64(Address(src, offset.m_value), dest1);
        } else {
            load64(Address(src, offset.m_value), dest1);
            load64(Address(src, offset.m_value + 8), dest2);
        }
    }

    void loadPair64(Address src, RegisterID dest1, RegisterID dest2)
    {
        loadPair64(src.base, TrustedImm32(src.offset), dest1, dest2);
    }

    DataLabel32 load64WithAddressOffsetPatch(Address address, RegisterID dest)
    {
        padBeforePatch();
        m_assembler.movq_mr_disp32(address.offset, address.base, dest);
        return DataLabel32(this);
    }
    
    DataLabelCompact load64WithCompactAddressOffsetPatch(Address address, RegisterID dest)
    {
        padBeforePatch();
        m_assembler.movq_mr_disp8(address.offset, address.base, dest);
        return DataLabelCompact(this);
    }

    void store64(RegisterID src, Address address)
    {
        m_assembler.movq_rm(src, address.offset, address.base);
    }

    void store64(RegisterID src, BaseIndex address)
    {
        m_assembler.movq_rm(src, address.offset, address.base, address.index, address.scale);
    }
    
    void store64(RegisterID src, void* address)
    {
        if (src == X86Registers::eax)
            m_assembler.movq_EAXm(address);
        else {
            move(TrustedImmPtr(address), scratchRegister());
            store64(src, Address(scratchRegister()));
        }
    }

    void store64(TrustedImm32 imm, Address address)
    {
        m_assembler.movq_i32m(imm.m_value, address.offset, address.base);
    }

    void store64(TrustedImm32 imm, BaseIndex address)
    {
        m_assembler.movq_i32m(imm.m_value, address.offset, address.base, address.index, address.scale);
    }

    void store64(TrustedImm64 imm, void* address)
    {
        if (CAN_SIGN_EXTEND_32_64(imm.m_value)) {
            auto addressReg = scratchRegister();
            move(TrustedImmPtr(address), addressReg);
            store64(TrustedImm32(static_cast<int32_t>(imm.m_value)), Address(addressReg));
            return;
        }

        auto src = scratchRegister();
        move(imm, src);
        swap(src, X86Registers::eax);
        m_assembler.movq_EAXm(address);
        swap(src, X86Registers::eax);
    }

    void store64(TrustedImm64 imm, Address address)
    {
        if (CAN_SIGN_EXTEND_32_64(imm.m_value)) {
            store64(TrustedImm32(static_cast<int32_t>(imm.m_value)), address);
            return;
        }

        move(imm, scratchRegister());
        store64(scratchRegister(), address);
    }

    void store64(TrustedImmPtr imm, Address address)
    {
        move(imm, scratchRegister());
        store64(scratchRegister(), address);
    }

    void store64(TrustedImm64 imm, BaseIndex address)
    {
        move(imm, scratchRegister());
        m_assembler.movq_rm(scratchRegister(), address.offset, address.base, address.index, address.scale);
    }

    void storePair64(RegisterID src1, RegisterID src2, RegisterID dest)
    {
        storePair64(src1, src2, dest, TrustedImm32(0));
    }

    void storePair64(RegisterID src1, RegisterID src2, RegisterID dest, TrustedImm32 offset)
    {
        store64(src1, Address(dest, offset.m_value));
        store64(src2, Address(dest, offset.m_value + 8));
    }

    void storePair64(RegisterID src1, RegisterID src2, Address dest)
    {
        storePair64(src1, src2, dest.base, TrustedImm32(dest.offset));
    }

    void transfer32(Address src, Address dest)
    {
        if (src == dest)
            return;
        load32(src, scratchRegister());
        store32(scratchRegister(), dest);
    }

    void transfer64(Address src, Address dest)
    {
        if (src == dest)
            return;
        load64(src, scratchRegister());
        store64(scratchRegister(), dest);
    }

    void transferFloat(Address src, Address dest)
    {
        transfer32(src, dest);
    }

    void transferDouble(Address src, Address dest)
    {
        transfer64(src, dest);
    }

    void transferVector(Address src, Address dest)
    {
        if (src == dest)
            return;
        loadVector(src, fpTempRegister);
        storeVector(fpTempRegister, dest);
    }

    void transferPtr(Address src, Address dest)
    {
        transfer64(src, dest);
    }

    void transfer32(BaseIndex src, BaseIndex dest)
    {
        if (src == dest)
            return;
        load32(src, scratchRegister());
        store32(scratchRegister(), dest);
    }

    void transfer64(BaseIndex src, BaseIndex dest)
    {
        if (src == dest)
            return;
        load64(src, scratchRegister());
        store64(scratchRegister(), dest);
    }

    void transferFloat(BaseIndex src, BaseIndex dest)
    {
        transfer32(src, dest);
    }

    void transferDouble(BaseIndex src, BaseIndex dest)
    {
        transfer64(src, dest);
    }

    void transferVector(BaseIndex src, BaseIndex dest)
    {
        if (src == dest)
            return;
        loadVector(src, fpTempRegister);
        storeVector(fpTempRegister, dest);
    }

    void transferPtr(BaseIndex src, BaseIndex dest)
    {
        transfer64(src, dest);
    }

    DataLabel32 store64WithAddressOffsetPatch(RegisterID src, Address address)
    {
        padBeforePatch();
        m_assembler.movq_rm_disp32(src, address.offset, address.base);
        return DataLabel32(this);
    }

    void swap64(RegisterID src, RegisterID dest)
    {
        m_assembler.xchgq_rr(src, dest);
    }

    void swap64(RegisterID src, Address dest)
    {
        m_assembler.xchgq_rm(src, dest.offset, dest.base);
    }

    void swapDouble(FPRegisterID reg1, FPRegisterID reg2)
    {
        if (reg1 == reg2)
            return;

        moveDouble(reg1, fpTempRegister);
        moveDouble(reg2, reg1);
        moveDouble(fpTempRegister, reg2);
    }

    void move32ToFloat(RegisterID src, FPRegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vmovd_rr(src, dest);
        else
            m_assembler.movd_rr(src, dest);
    }

    void move32ToFloat(TrustedImm32 imm, FPRegisterID dest)
    {
        if (!imm.m_value) {
            moveZeroToFloat(dest);
            return;
        }
        move(imm, scratchRegister());
        if (supportsAVX())
            m_assembler.vmovd_rr(scratchRegister(), dest);
        else
            m_assembler.movd_rr(scratchRegister(), dest);
    }

    void move64ToDouble(RegisterID src, FPRegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vmovq_rr(src, dest);
        else
            m_assembler.movq_rr(src, dest);
    }

    void move64ToDouble(TrustedImm64 imm, FPRegisterID dest)
    {
        if (!imm.m_value) {
            moveZeroToDouble(dest);
            return;
        }
        move(imm, scratchRegister());
        if (supportsAVX())
            m_assembler.vmovq_rr(scratchRegister(), dest);
        else
            m_assembler.movq_rr(scratchRegister(), dest);
    }

    void moveDoubleTo64(FPRegisterID src, RegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vmovq_rr(src, dest);
        else
            m_assembler.movq_rr(src, dest);
    }
    
    void moveVector(FPRegisterID src, FPRegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vmovaps_rr(src, dest);
        else
            m_assembler.movaps_rr(src, dest);
    }

    void materializeVector(v128_t value, FPRegisterID dest)
    {
        if (bitEquals(value, vectorAllZeros())) {
            moveZeroToVector(dest);
            return;
        }
        move(TrustedImm64(value.u64x2[0]), scratchRegister());
        vectorReplaceLaneInt64(TrustedImm32(0), scratchRegister(), dest);
        move(TrustedImm64(value.u64x2[1]), scratchRegister());
        vectorReplaceLaneInt64(TrustedImm32(1), scratchRegister(), dest);
    }

    void loadVector(TrustedImmPtr address, FPRegisterID dest)
    {
        move(address, scratchRegister());
        loadVector(Address(scratchRegister()), dest);
    }

    void loadVector(Address address, FPRegisterID dest)
    {
        ASSERT(supportsAVX());
        m_assembler.vmovups_mr(address.offset, address.base, dest);
    }

    void loadVector(BaseIndex address, FPRegisterID dest)
    {
        ASSERT(supportsAVX());
        m_assembler.vmovups_mr(address.offset, address.base, address.index, address.scale, dest);
    }
    
    void storeVector(FPRegisterID src, Address address)
    {
        ASSERT(supportsAVX());
        ASSERT(Options::useWasmSIMD());
        m_assembler.vmovups_rm(src, address.offset, address.base);
    }
    
    void storeVector(FPRegisterID src, BaseIndex address)
    {
        ASSERT(supportsAVX());
        ASSERT(Options::useWasmSIMD());
        m_assembler.vmovups_rm(src, address.offset, address.base, address.index, address.scale);
    }

    void compare64(RelationalCondition cond, RegisterID left, TrustedImm32 right, RegisterID dest)
    {
        if (!right.m_value) {
            if (auto resultCondition = commuteCompareToZeroIntoTest(cond)) {
                test64(*resultCondition, left, left, dest);
                return;
            }
        }

        m_assembler.cmpq_ir(right.m_value, left);
        set32(x86Condition(cond), dest);
    }

    void compare64(RelationalCondition cond, RegisterID left, TrustedImm64 right, RegisterID dest)
    {
        if (!right.m_value) {
            if (auto resultCondition = commuteCompareToZeroIntoTest(cond)) {
                test64(*resultCondition, left, left, dest);
                return;
            }
        }

        if (isRepresentableAs<int32_t>(right.m_value))
            m_assembler.cmpq_ir(right.m_value, left);
        else {
            move(right, scratchRegister());
            m_assembler.cmpq_rr(scratchRegister(), left);
        }
        set32(x86Condition(cond), dest);
    }
    
    void compare64(RelationalCondition cond, RegisterID left, RegisterID right, RegisterID dest)
    {
        m_assembler.cmpq_rr(right, left);
        set32(x86Condition(cond), dest);
    }

    Jump branch64(RelationalCondition cond, RegisterID left, RegisterID right)
    {
        m_assembler.cmpq_rr(right, left);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branch64(RelationalCondition cond, RegisterID left, TrustedImm32 right)
    {
        if (!right.m_value) {
            if (auto resultCondition = commuteCompareToZeroIntoTest(cond))
                return branchTest64(*resultCondition, left, left);
        }
        m_assembler.cmpq_ir(right.m_value, left);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branch64(RelationalCondition cond, RegisterID left, TrustedImm64 right)
    {
        if (((cond == Equal) || (cond == NotEqual)) && !right.m_value) {
            m_assembler.testq_rr(left, left);
            return Jump(m_assembler.jCC(x86Condition(cond)));
        }
        move(right, scratchRegister());
        return branch64(cond, left, scratchRegister());
    }

    Jump branch64(RelationalCondition cond, RegisterID left, Address right)
    {
        m_assembler.cmpq_mr(right.offset, right.base, left);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branch64(RelationalCondition cond, AbsoluteAddress left, RegisterID right)
    {
        move(TrustedImmPtr(left.m_ptr), scratchRegister());
        return branch64(cond, Address(scratchRegister()), right);
    }

    Jump branch64(RelationalCondition cond, Address left, RegisterID right)
    {
        m_assembler.cmpq_rm(right, left.offset, left.base);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branch64(RelationalCondition cond, Address left, TrustedImm32 right)
    {
        m_assembler.cmpq_im(right.m_value, left.offset, left.base);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branch64(RelationalCondition cond, Address left, TrustedImm64 right)
    {
        move(right, scratchRegister());
        return branch64(cond, left, scratchRegister());
    }

    Jump branch64(RelationalCondition cond, BaseIndex address, RegisterID right)
    {
        m_assembler.cmpq_rm(right, address.offset, address.base, address.index, address.scale);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branch64(RelationalCondition cond, Address left, Address right)
    {
        load64(right, scratchRegister());
        return branch64(cond, left, scratchRegister());
    }
    
    Jump branch32(RelationalCondition cond, AbsoluteAddress left, RegisterID right)
    {
        load32(left.m_ptr, scratchRegister());
        return branch32(cond, scratchRegister(), right);
    }

    Jump branch32WithMemory16(RelationalCondition cond, Address left, RegisterID right)
    {
        MacroAssemblerHelpers::load16OnCondition(*this, cond, left, scratchRegister());
        return branch32(cond, scratchRegister(), right);
    }

    Jump branchPtr(RelationalCondition cond, BaseIndex left, RegisterID right)
    {
        return branch64(cond, left, right);
    }

    Jump branchPtr(RelationalCondition cond, BaseIndex left, TrustedImmPtr right)
    {
        move(right, scratchRegister());
        return branchPtr(cond, left, scratchRegister());
    }

    Jump branchPtr(RelationalCondition cond, Address left, Address right)
    {
        return branch64(cond, left, right);
    }

    Jump branchTest64(ResultCondition cond, RegisterID reg, RegisterID mask)
    {
        m_assembler.testq_rr(reg, mask);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }
    
    Jump branchTest64(ResultCondition cond, RegisterID reg, TrustedImm32 mask = TrustedImm32(-1))
    {
        // if we are only interested in the low seven bits, this can be tested with a testb
        if (mask.m_value == -1)
            m_assembler.testq_rr(reg, reg);
        else if ((mask.m_value & ~0x7f) == 0)
            m_assembler.testb_i8r(mask.m_value, reg);
        else
            m_assembler.testq_i32r(mask.m_value, reg);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branchTest64(ResultCondition cond, RegisterID reg, TrustedImm64 mask)
    {
        move(mask, scratchRegister());
        return branchTest64(cond, reg, scratchRegister());
    }

    Jump branchTestBit64(ResultCondition cond, RegisterID testValue, TrustedImm32 bit)
    {
        m_assembler.btw_ir(static_cast<unsigned>(bit.m_value) % 64, testValue);
        if (cond == NonZero)
            return Jump(m_assembler.jb());
        if (cond == Zero)
            return Jump(m_assembler.jae());
        RELEASE_ASSERT_NOT_REACHED();
    }

    Jump branchTestBit64(ResultCondition cond, Address testValue, TrustedImm32 bit)
    {
        m_assembler.btw_im(static_cast<unsigned>(bit.m_value) % 64, testValue.offset, testValue.base);
        if (cond == NonZero)
            return Jump(m_assembler.jb());
        if (cond == Zero)
            return Jump(m_assembler.jae());
        RELEASE_ASSERT_NOT_REACHED();
    }

    Jump branchTestBit64(ResultCondition cond, RegisterID reg, RegisterID bit)
    {
        m_assembler.btw_ir(bit, reg);
        if (cond == NonZero)
            return Jump(m_assembler.jb());
        if (cond == Zero)
            return Jump(m_assembler.jae());
        RELEASE_ASSERT_NOT_REACHED();
    }

    void test64(ResultCondition cond, RegisterID reg, TrustedImm32 mask, RegisterID dest)
    {
        if (mask.m_value == -1)
            m_assembler.testq_rr(reg, reg);
        else if ((mask.m_value & ~0x7f) == 0)
            m_assembler.testb_i8r(mask.m_value, reg);
        else
            m_assembler.testq_i32r(mask.m_value, reg);
        set32(x86Condition(cond), dest);
    }

    void test64(ResultCondition cond, RegisterID reg, RegisterID mask, RegisterID dest)
    {
        m_assembler.testq_rr(reg, mask);
        set32(x86Condition(cond), dest);
    }

    Jump branchTest64(ResultCondition cond, AbsoluteAddress address, TrustedImm32 mask = TrustedImm32(-1))
    {
        load64(address.m_ptr, scratchRegister());
        return branchTest64(cond, scratchRegister(), mask);
    }

    Jump branchTest64(ResultCondition cond, Address address, TrustedImm32 mask = TrustedImm32(-1))
    {
        if (mask.m_value == -1)
            m_assembler.cmpq_im(0, address.offset, address.base);
        else
            m_assembler.testq_i32m(mask.m_value, address.offset, address.base);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branchTest64(ResultCondition cond, Address address, RegisterID reg)
    {
        m_assembler.testq_rm(reg, address.offset, address.base);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branchTest64(ResultCondition cond, BaseIndex address, TrustedImm32 mask = TrustedImm32(-1))
    {
        if (mask.m_value == -1)
            m_assembler.cmpq_im(0, address.offset, address.base, address.index, address.scale);
        else
            m_assembler.testq_i32m(mask.m_value, address.offset, address.base, address.index, address.scale);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }


    Jump branchAdd64(ResultCondition cond, TrustedImm32 imm, RegisterID dest)
    {
        add64(imm, dest);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branchAdd64(ResultCondition cond, RegisterID src1, RegisterID src2, RegisterID dest)
    {
        if (src1 == dest)
            return branchAdd64(cond, src2, dest);
        move(src2, dest);
        return branchAdd64(cond, src1, dest);
    }

    Jump branchAdd64(ResultCondition cond, Address op1, RegisterID op2, RegisterID dest)
    {
        if (op2 == dest)
            return branchAdd64(cond, op1, dest);
        if (op1.base == dest) {
            load32(op1, dest);
            return branchAdd64(cond, op2, dest);
        }
        move(op2, dest);
        return branchAdd64(cond, op1, dest);
    }

    Jump branchAdd64(ResultCondition cond, RegisterID src1, Address src2, RegisterID dest)
    {
        return branchAdd64(cond, src2, src1, dest);
    }

    Jump branchAdd64(ResultCondition cond, RegisterID src, RegisterID dest)
    {
        add64(src, dest);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branchAdd64(ResultCondition cond, Address src, RegisterID dest)
    {
        add64(src, dest);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branchMul64(ResultCondition cond, RegisterID src, RegisterID dest)
    {
        mul64(src, dest);
        if (cond != Overflow)
            m_assembler.testq_rr(dest, dest);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branchMul64(ResultCondition cond, RegisterID src1, RegisterID src2, RegisterID dest)
    {
        if (src1 == dest)
            return branchMul64(cond, src2, dest);
        move(src2, dest);
        return branchMul64(cond, src1, dest);
    }

    Jump branchSub64(ResultCondition cond, TrustedImm32 imm, RegisterID dest)
    {
        sub64(imm, dest);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branchSub64(ResultCondition cond, RegisterID src, RegisterID dest)
    {
        sub64(src, dest);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    Jump branchSub64(ResultCondition cond, RegisterID src1, TrustedImm32 src2, RegisterID dest)
    {
        move(src1, dest);
        return branchSub64(cond, src2, dest);
    }

    Jump branchNeg64(ResultCondition cond, RegisterID srcDest)
    {
        neg64(srcDest);
        return Jump(m_assembler.jCC(x86Condition(cond)));
    }

    void moveConditionally64(RelationalCondition cond, RegisterID left, RegisterID right, RegisterID src, RegisterID dest)
    {
        m_assembler.cmpq_rr(right, left);
        cmov(x86Condition(cond), src, dest);
    }

    void moveConditionally64(RelationalCondition cond, RegisterID left, RegisterID right, RegisterID thenCase, RegisterID elseCase, RegisterID dest)
    {
        m_assembler.cmpq_rr(right, left);

        if (thenCase != dest && elseCase != dest) {
            move(elseCase, dest);
            elseCase = dest;
        }

        if (elseCase == dest)
            cmov(x86Condition(cond), thenCase, dest);
        else
            cmov(x86Condition(invert(cond)), elseCase, dest);
    }

    void moveConditionally64(RelationalCondition cond, RegisterID left, TrustedImm32 right, RegisterID thenCase, RegisterID elseCase, RegisterID dest)
    {
        if (!right.m_value) {
            if (auto resultCondition = commuteCompareToZeroIntoTest(cond)) {
                moveConditionallyTest64(*resultCondition, left, left, thenCase, elseCase, dest);
                return;
            }
        }

        m_assembler.cmpq_ir(right.m_value, left);

        if (thenCase != dest && elseCase != dest) {
            move(elseCase, dest);
            elseCase = dest;
        }

        if (elseCase == dest)
            cmov(x86Condition(cond), thenCase, dest);
        else
            cmov(x86Condition(invert(cond)), elseCase, dest);
    }

    void moveConditionallyTest64(ResultCondition cond, RegisterID testReg, RegisterID mask, RegisterID src, RegisterID dest)
    {
        m_assembler.testq_rr(testReg, mask);
        cmov(x86Condition(cond), src, dest);
    }

    void moveConditionallyTest64(ResultCondition cond, RegisterID left, RegisterID right, RegisterID thenCase, RegisterID elseCase, RegisterID dest)
    {
        ASSERT(isInvertible(cond));
        ASSERT_WITH_MESSAGE(cond != Overflow, "TEST does not set the Overflow Flag.");

        m_assembler.testq_rr(right, left);

        if (thenCase != dest && elseCase != dest) {
            move(elseCase, dest);
            elseCase = dest;
        }

        if (elseCase == dest)
            cmov(x86Condition(cond), thenCase, dest);
        else
            cmov(x86Condition(invert(cond)), elseCase, dest);
    }
    
    void moveConditionallyTest64(ResultCondition cond, RegisterID testReg, TrustedImm32 mask, RegisterID src, RegisterID dest)
    {
        // if we are only interested in the low seven bits, this can be tested with a testb
        if (mask.m_value == -1)
            m_assembler.testq_rr(testReg, testReg);
        else if ((mask.m_value & ~0x7f) == 0)
            m_assembler.testb_i8r(mask.m_value, testReg);
        else
            m_assembler.testq_i32r(mask.m_value, testReg);
        cmov(x86Condition(cond), src, dest);
    }

    void moveConditionallyTest64(ResultCondition cond, RegisterID testReg, TrustedImm32 mask, RegisterID thenCase, RegisterID elseCase, RegisterID dest)
    {
        ASSERT(isInvertible(cond));
        ASSERT_WITH_MESSAGE(cond != Overflow, "TEST does not set the Overflow Flag.");

        if (mask.m_value == -1)
            m_assembler.testq_rr(testReg, testReg);
        else if (!(mask.m_value & ~0x7f))
            m_assembler.testb_i8r(mask.m_value, testReg);
        else
            m_assembler.testq_i32r(mask.m_value, testReg);

        if (thenCase != dest && elseCase != dest) {
            move(elseCase, dest);
            elseCase = dest;
        }

        if (elseCase == dest)
            cmov(x86Condition(cond), thenCase, dest);
        else
            cmov(x86Condition(invert(cond)), elseCase, dest);
    }

    template<typename LeftType, typename RightType>
    void moveDoubleConditionally64(RelationalCondition cond, LeftType left, RightType right, FPRegisterID thenCase, FPRegisterID elseCase, FPRegisterID dest)
    {
        static_assert(!std::is_same<LeftType, FPRegisterID>::value && !std::is_same<RightType, FPRegisterID>::value, "One of the tested argument could be aliased on dest. Use moveDoubleConditionallyDouble().");

        if (thenCase != dest && elseCase != dest) {
            moveDouble(elseCase, dest);
            elseCase = dest;
        }

        if (elseCase == dest) {
            Jump falseCase = branch64(invert(cond), left, right);
            moveDouble(thenCase, dest);
            falseCase.link(this);
        } else {
            Jump trueCase = branch64(cond, left, right);
            moveDouble(elseCase, dest);
            trueCase.link(this);
        }
    }

    template<typename TestType, typename MaskType>
    void moveDoubleConditionallyTest64(ResultCondition cond, TestType test, MaskType mask, FPRegisterID thenCase, FPRegisterID elseCase, FPRegisterID dest)
    {
        static_assert(!std::is_same<TestType, FPRegisterID>::value && !std::is_same<MaskType, FPRegisterID>::value, "One of the tested argument could be aliased on dest. Use moveDoubleConditionallyDouble().");

        if (elseCase == dest && isInvertible(cond)) {
            Jump falseCase = branchTest64(invert(cond), test, mask);
            moveDouble(thenCase, dest);
            falseCase.link(this);
        } else if (thenCase == dest) {
            Jump trueCase = branchTest64(cond, test, mask);
            moveDouble(elseCase, dest);
            trueCase.link(this);
        }

        Jump trueCase = branchTest64(cond, test, mask);
        moveDouble(elseCase, dest);
        Jump falseCase = jump();
        trueCase.link(this);
        moveDouble(thenCase, dest);
        falseCase.link(this);
    }
    
    void abortWithReason(AbortReason reason)
    {
        move(TrustedImm32(reason), X86Registers::r11);
        breakpoint();
    }

    void abortWithReason(AbortReason reason, intptr_t misc)
    {
        move(TrustedImm64(misc), X86Registers::r10);
        abortWithReason(reason);
    }

    ConvertibleLoadLabel convertibleLoadPtr(Address address, RegisterID dest)
    {
        ConvertibleLoadLabel result = ConvertibleLoadLabel(this);
        m_assembler.movq_mr(address.offset, address.base, dest);
        return result;
    }

    DataLabelPtr moveWithPatch(TrustedImmPtr initialValue, RegisterID dest)
    {
        padBeforePatch();
        m_assembler.movq_i64r(initialValue.asIntptr(), dest);
        return DataLabelPtr(this);
    }

    DataLabelPtr moveWithPatch(TrustedImm32 initialValue, RegisterID dest)
    {
        padBeforePatch();
        m_assembler.movq_i64r(initialValue.m_value, dest);
        return DataLabelPtr(this);
    }

    Jump branchPtrWithPatch(RelationalCondition cond, RegisterID left, DataLabelPtr& dataLabel, TrustedImmPtr initialRightValue = TrustedImmPtr(nullptr))
    {
        dataLabel = moveWithPatch(initialRightValue, scratchRegister());
        return branch64(cond, left, scratchRegister());
    }

    Jump branchPtrWithPatch(RelationalCondition cond, Address left, DataLabelPtr& dataLabel, TrustedImmPtr initialRightValue = TrustedImmPtr(nullptr))
    {
        dataLabel = moveWithPatch(initialRightValue, scratchRegister());
        return branch64(cond, left, scratchRegister());
    }

    Jump branch32WithPatch(RelationalCondition cond, Address left, DataLabel32& dataLabel, TrustedImm32 initialRightValue = TrustedImm32(0))
    {
        padBeforePatch();
        m_assembler.movl_i32r(initialRightValue.m_value, scratchRegister());
        dataLabel = DataLabel32(this);
        return branch32(cond, left, scratchRegister());
    }

    DataLabelPtr storePtrWithPatch(TrustedImmPtr initialValue, Address address)
    {
        DataLabelPtr label = moveWithPatch(initialValue, scratchRegister());
        store64(scratchRegister(), address);
        return label;
    }

    PatchableJump patchableBranch64(RelationalCondition cond, RegisterID reg, TrustedImm64 imm)
    {
        padBeforePatch();
        return PatchableJump(branch64(cond, reg, imm));
    }

    PatchableJump patchableBranch64(RelationalCondition cond, RegisterID left, RegisterID right)
    {
        padBeforePatch();
        return PatchableJump(branch64(cond, left, right));
    }

    Jump branch8(RelationalCondition cond, AbsoluteAddress left, TrustedImm32 right)
    {
        move(TrustedImmPtr(left.m_ptr), scratchRegister());
        return branch8(cond, Address(scratchRegister()), right);
    }

    Jump branchTest8(ResultCondition cond, ExtendedAddress address, TrustedImm32 mask = TrustedImm32(-1))
    {
        TrustedImm32 mask8(static_cast<int8_t>(mask.m_value));
        TrustedImmPtr addr(reinterpret_cast<void*>(address.offset));
        move(addr, scratchRegister());
        return branchTest8(cond, BaseIndex(scratchRegister(), address.base, TimesOne), mask8);
    }

    Jump branchTest8(ResultCondition cond, AbsoluteAddress address, TrustedImm32 mask = TrustedImm32(-1))
    {
        TrustedImm32 mask8(static_cast<int8_t>(mask.m_value));
        move(TrustedImmPtr(address.m_ptr), scratchRegister());
        return branchTest8(cond, Address(scratchRegister()), mask8);
    }

    Jump branch16(RelationalCondition cond, AbsoluteAddress left, TrustedImm32 right)
    {
        move(TrustedImmPtr(left.m_ptr), scratchRegister());
        return branch16(cond, Address(scratchRegister()), right);
    }

    Jump branchTest16(ResultCondition cond, ExtendedAddress address, TrustedImm32 mask = TrustedImm32(-1))
    {
        TrustedImm32 mask16(static_cast<int16_t>(mask.m_value));
        TrustedImmPtr addr(reinterpret_cast<void*>(address.offset));
        move(addr, scratchRegister());
        return branchTest16(cond, BaseIndex(scratchRegister(), address.base, TimesOne), mask16);
    }

    Jump branchTest16(ResultCondition cond, AbsoluteAddress address, TrustedImm32 mask = TrustedImm32(-1))
    {
        TrustedImm32 mask16(static_cast<int16_t>(mask.m_value));
        move(TrustedImmPtr(address.m_ptr), scratchRegister());
        return branchTest16(cond, Address(scratchRegister()), mask16);
    }

    void xchg64(RegisterID reg, Address address)
    {
        m_assembler.xchgq_rm(reg, address.offset, address.base);
    }
    
    void xchg64(RegisterID reg, BaseIndex address)
    {
        m_assembler.xchgq_rm(reg, address.offset, address.base, address.index, address.scale);
    }
    
    void atomicStrongCAS64(StatusCondition cond, RegisterID expectedAndResult, RegisterID newValue, Address address, RegisterID result)
    {
        newValue = checkAliasOfEAX(expectedAndResult, newValue);
        atomicStrongCAS(cond, expectedAndResult, result, address, [&] { m_assembler.cmpxchgq_rm(newValue, address.offset, address.base); });
    }

    void atomicStrongCAS64(StatusCondition cond, RegisterID expectedAndResult, RegisterID newValue, BaseIndex address, RegisterID result)
    {
        newValue = checkAliasOfEAX(expectedAndResult, newValue);
        atomicStrongCAS(cond, expectedAndResult, result, address, [&] { m_assembler.cmpxchgq_rm(newValue, address.offset, address.base, address.index, address.scale); });
    }

    void atomicStrongCAS64(RegisterID expectedAndResult, RegisterID newValue, Address address)
    {
        newValue = checkAliasOfEAX(expectedAndResult, newValue);
        atomicStrongCAS(expectedAndResult, address, [&] { m_assembler.cmpxchgq_rm(newValue, address.offset, address.base); });
    }

    void atomicStrongCAS64(RegisterID expectedAndResult, RegisterID newValue, BaseIndex address)
    {
        newValue = checkAliasOfEAX(expectedAndResult, newValue);
        atomicStrongCAS(expectedAndResult, address, [&] { m_assembler.cmpxchgq_rm(newValue, address.offset, address.base, address.index, address.scale); });
    }

    Jump branchAtomicStrongCAS64(StatusCondition cond, RegisterID expectedAndResult, RegisterID newValue, Address address)
    {
        newValue = checkAliasOfEAX(expectedAndResult, newValue);
        return branchAtomicStrongCAS(cond, expectedAndResult, address, [&] { m_assembler.cmpxchgq_rm(newValue, address.offset, address.base); });
    }

    Jump branchAtomicStrongCAS64(StatusCondition cond, RegisterID expectedAndResult, RegisterID newValue, BaseIndex address)
    {
        newValue = checkAliasOfEAX(expectedAndResult, newValue);
        return branchAtomicStrongCAS(cond, expectedAndResult, address, [&] { m_assembler.cmpxchgq_rm(newValue, address.offset, address.base, address.index, address.scale); });
    }

    void atomicWeakCAS64(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, Address address, RegisterID result)
    {
        atomicStrongCAS64(cond, expectedAndClobbered, newValue, address, result);
    }

    void atomicWeakCAS64(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, BaseIndex address, RegisterID result)
    {
        atomicStrongCAS64(cond, expectedAndClobbered, newValue, address, result);
    }

    Jump branchAtomicWeakCAS64(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, Address address)
    {
        return branchAtomicStrongCAS64(cond, expectedAndClobbered, newValue, address);
    }

    Jump branchAtomicWeakCAS64(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, BaseIndex address)
    {
        return branchAtomicStrongCAS64(cond, expectedAndClobbered, newValue, address);
    }

    void atomicRelaxedWeakCAS64(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, Address address, RegisterID result)
    {
        atomicStrongCAS64(cond, expectedAndClobbered, newValue, address, result);
    }

    void atomicRelaxedWeakCAS64(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, BaseIndex address, RegisterID result)
    {
        atomicStrongCAS64(cond, expectedAndClobbered, newValue, address, result);
    }

    Jump branchAtomicRelaxedWeakCAS64(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, Address address)
    {
        return branchAtomicStrongCAS64(cond, expectedAndClobbered, newValue, address);
    }

    Jump branchAtomicRelaxedWeakCAS64(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, BaseIndex address)
    {
        return branchAtomicStrongCAS64(cond, expectedAndClobbered, newValue, address);
    }

    void atomicAdd64(TrustedImm32 imm, Address address)
    {
        m_assembler.lock();
        add64(imm, address);
    }
    
    void atomicAdd64(TrustedImm32 imm, BaseIndex address)
    {
        m_assembler.lock();
        add64(imm, address);
    }
    
    void atomicAdd64(RegisterID reg, Address address)
    {
        m_assembler.lock();
        add64(reg, address);
    }
    
    void atomicAdd64(RegisterID reg, BaseIndex address)
    {
        m_assembler.lock();
        add64(reg, address);
    }
    
    void atomicSub64(TrustedImm32 imm, Address address)
    {
        m_assembler.lock();
        sub64(imm, address);
    }
    
    void atomicSub64(TrustedImm32 imm, BaseIndex address)
    {
        m_assembler.lock();
        sub64(imm, address);
    }
    
    void atomicSub64(RegisterID reg, Address address)
    {
        m_assembler.lock();
        sub64(reg, address);
    }
    
    void atomicSub64(RegisterID reg, BaseIndex address)
    {
        m_assembler.lock();
        sub64(reg, address);
    }
    
    void atomicAnd64(TrustedImm32 imm, Address address)
    {
        m_assembler.lock();
        and64(imm, address);
    }
    
    void atomicAnd64(TrustedImm32 imm, BaseIndex address)
    {
        m_assembler.lock();
        and64(imm, address);
    }
    
    void atomicAnd64(RegisterID reg, Address address)
    {
        m_assembler.lock();
        and64(reg, address);
    }
    
    void atomicAnd64(RegisterID reg, BaseIndex address)
    {
        m_assembler.lock();
        and64(reg, address);
    }
    
    void atomicOr64(TrustedImm32 imm, Address address)
    {
        m_assembler.lock();
        or64(imm, address);
    }
    
    void atomicOr64(TrustedImm32 imm, BaseIndex address)
    {
        m_assembler.lock();
        or64(imm, address);
    }
    
    void atomicOr64(RegisterID reg, Address address)
    {
        m_assembler.lock();
        or64(reg, address);
    }
    
    void atomicOr64(RegisterID reg, BaseIndex address)
    {
        m_assembler.lock();
        or64(reg, address);
    }
    
    void atomicXor64(TrustedImm32 imm, Address address)
    {
        m_assembler.lock();
        xor64(imm, address);
    }
    
    void atomicXor64(TrustedImm32 imm, BaseIndex address)
    {
        m_assembler.lock();
        xor64(imm, address);
    }
    
    void atomicXor64(RegisterID reg, Address address)
    {
        m_assembler.lock();
        xor64(reg, address);
    }
    
    void atomicXor64(RegisterID reg, BaseIndex address)
    {
        m_assembler.lock();
        xor64(reg, address);
    }
    
    void atomicNeg64(Address address)
    {
        m_assembler.lock();
        neg64(address);
    }
    
    void atomicNeg64(BaseIndex address)
    {
        m_assembler.lock();
        neg64(address);
    }
    
    void atomicNot64(Address address)
    {
        m_assembler.lock();
        not64(address);
    }
    
    void atomicNot64(BaseIndex address)
    {
        m_assembler.lock();
        not64(address);
    }
    
    void atomicXchgAdd64(RegisterID reg, Address address)
    {
        m_assembler.lock();
        m_assembler.xaddq_rm(reg, address.offset, address.base);
    }
    
    void atomicXchgAdd64(RegisterID reg, BaseIndex address)
    {
        m_assembler.lock();
        m_assembler.xaddq_rm(reg, address.offset, address.base, address.index, address.scale);
    }
    
    void atomicXchg64(RegisterID reg, Address address)
    {
        m_assembler.lock();
        m_assembler.xchgq_rm(reg, address.offset, address.base);
    }
    
    void atomicXchg64(RegisterID reg, BaseIndex address)
    {
        m_assembler.lock();
        m_assembler.xchgq_rm(reg, address.offset, address.base, address.index, address.scale);
    }

    void atomicLoad64(Address address, RegisterID dest)
    {
        load64(address, dest);
    }

    void atomicLoad64(BaseIndex address, RegisterID dest)
    {
        load64(address, dest);
    }
    
#if ENABLE(FAST_TLS_JIT)
    void loadFromTLS64(uint32_t offset, RegisterID dst)
    {
        m_assembler.gs();
        m_assembler.movq_mr(offset, dst);
    }

    void storeToTLS64(RegisterID src, uint32_t offset)
    {
        m_assembler.gs();
        m_assembler.movq_rm(src, offset);
    }
#endif

    void truncateDoubleToUint32(FPRegisterID src, RegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vcvttsd2siq_rr(src, dest);
        else
            m_assembler.cvttsd2siq_rr(src, dest);
    }

    void truncateDoubleToInt64(FPRegisterID src, RegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vcvttsd2siq_rr(src, dest);
        else
            m_assembler.cvttsd2siq_rr(src, dest);
    }

    // int64Min should contain exactly 0x43E0000000000000 == static_cast<double>(int64_t::min()). scratch may
    // be the same FPR as src.
    void truncateDoubleToUint64(FPRegisterID src, RegisterID dest, FPRegisterID scratch, FPRegisterID int64Min)
    {
        ASSERT(scratch != int64Min);

        // Since X86 does not have a floating point to unsigned integer instruction, we need to use the signed
        // integer conversion instruction. If the src is less than int64_t::min() then the results of the two
        // instructions are the same. Otherwise, we need to: subtract int64_t::min(); truncate double to
        // uint64_t; then add back int64_t::min() in the destination gpr.

        Jump large = branchDouble(DoubleGreaterThanOrEqualAndOrdered, src, int64Min);
        if (supportsAVX())
            m_assembler.vcvttsd2siq_rr(src, dest);
        else
            m_assembler.cvttsd2siq_rr(src, dest);
        Jump done = jump();
        large.link(this);
        if (supportsAVX()) {
            m_assembler.vsubsd_rrr(int64Min, src, scratch);
            m_assembler.vcvttsd2siq_rr(scratch, dest);
        } else {
            moveDouble(src, scratch);
            m_assembler.subsd_rr(int64Min, scratch);
            m_assembler.cvttsd2siq_rr(scratch, dest);
        }

        m_assembler.movq_i64r(0x8000000000000000, scratchRegister());
        m_assembler.orq_rr(scratchRegister(), dest);
        done.link(this);
    }

    void truncateFloatToUint32(FPRegisterID src, RegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vcvttss2siq_rr(src, dest);
        else
            m_assembler.cvttss2siq_rr(src, dest);
    }

    void truncateFloatToInt64(FPRegisterID src, RegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vcvttss2siq_rr(src, dest);
        else
            m_assembler.cvttss2siq_rr(src, dest);
    }

    // int64Min should contain exactly 0x5f000000 == static_cast<float>(int64_t::min()). scratch may be the
    // same FPR as src.
    void truncateFloatToUint64(FPRegisterID src, RegisterID dest, FPRegisterID scratch, FPRegisterID int64Min)
    {
        ASSERT(scratch != int64Min);

        // Since X86 does not have a floating point to unsigned integer instruction, we need to use the signed
        // integer conversion instruction. If the src is less than int64_t::min() then the results of the two
        // instructions are the same. Otherwise, we need to: subtract int64_t::min(); truncate double to
        // uint64_t; then add back int64_t::min() in the destination gpr.

        Jump large = branchFloat(DoubleGreaterThanOrEqualAndOrdered, src, int64Min);
        if (supportsAVX())
            m_assembler.vcvttss2siq_rr(src, dest);
        else
            m_assembler.cvttss2siq_rr(src, dest);
        Jump done = jump();
        large.link(this);
        if (supportsAVX()) {
            m_assembler.vsubss_rrr(int64Min, src, scratch);
            m_assembler.vcvttss2siq_rr(scratch, dest);
        } else {
            moveDouble(src, scratch);
            m_assembler.subss_rr(int64Min, scratch);
            m_assembler.cvttss2siq_rr(scratch, dest);
        }
        m_assembler.movq_i64r(0x8000000000000000, scratchRegister());
        m_assembler.orq_rr(scratchRegister(), dest);
        done.link(this);
    }

    void convertInt64ToDouble(RegisterID src, FPRegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vcvtsi2sdq_rrr(src, dest, dest);
        else
            m_assembler.cvtsi2sdq_rr(src, dest);
    }

    void convertInt64ToDouble(Address src, FPRegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vcvtsi2sdq_mrr(src.offset, src.base, dest, dest);
        else
            m_assembler.cvtsi2sdq_mr(src.offset, src.base, dest);
    }

    void convertInt64ToFloat(RegisterID src, FPRegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vcvtsi2ssq_rrr(src, dest, dest);
        else
            m_assembler.cvtsi2ssq_rr(src, dest);
    }

    void convertInt64ToFloat(Address src, FPRegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vcvtsi2ssq_mrr(src.offset, src.base, dest, dest);
        else
            m_assembler.cvtsi2ssq_mr(src.offset, src.base, dest);
    }

    // One of scratch or scratch2 may be the same as src
    void convertUInt64ToDouble(RegisterID src, FPRegisterID dest, RegisterID scratch)
    {
        RegisterID scratch2 = scratchRegister();

        m_assembler.testq_rr(src, src);
        AssemblerLabel signBitSet = m_assembler.jCC(x86Condition(Signed));
        if (supportsAVX())
            m_assembler.vcvtsi2sdq_rrr(src, dest, dest);
        else
            m_assembler.cvtsi2sdq_rr(src, dest);
        AssemblerLabel done = m_assembler.jmp();
        m_assembler.linkJump(signBitSet, m_assembler.label());
        if (scratch != src)
            m_assembler.movq_rr(src, scratch);
        m_assembler.movq_rr(src, scratch2);
        m_assembler.shrq_i8r(1, scratch);
        m_assembler.andq_ir(1, scratch2);
        m_assembler.orq_rr(scratch, scratch2);
        if (supportsAVX()) {
            m_assembler.vcvtsi2sdq_rrr(scratch2, dest, dest);
            m_assembler.vaddsd_rrr(dest, dest, dest);
        } else {
            m_assembler.cvtsi2sdq_rr(scratch2, dest);
            m_assembler.addsd_rr(dest, dest);
        }
        m_assembler.linkJump(done, m_assembler.label());
    }

    // One of scratch or scratch2 may be the same as src
    void convertUInt64ToFloat(RegisterID src, FPRegisterID dest, RegisterID scratch)
    {
        RegisterID scratch2 = scratchRegister();
        m_assembler.testq_rr(src, src);
        AssemblerLabel signBitSet = m_assembler.jCC(x86Condition(Signed));
        if (supportsAVX())
            m_assembler.vcvtsi2ssq_rrr(src, dest, dest);
        else
            m_assembler.cvtsi2ssq_rr(src, dest);
        AssemblerLabel done = m_assembler.jmp();
        m_assembler.linkJump(signBitSet, m_assembler.label());
        if (scratch != src)
            m_assembler.movq_rr(src, scratch);
        m_assembler.movq_rr(src, scratch2);
        m_assembler.shrq_i8r(1, scratch);
        m_assembler.andq_ir(1, scratch2);
        m_assembler.orq_rr(scratch, scratch2);
        if (supportsAVX()) {
            m_assembler.vcvtsi2ssq_rrr(scratch2, dest, dest);
            m_assembler.vaddss_rrr(dest, dest, dest);
        } else {
            m_assembler.cvtsi2ssq_rr(scratch2, dest);
            m_assembler.addss_rr(dest, dest);
        }
        m_assembler.linkJump(done, m_assembler.label());
    }

    // SIMD

    void signExtendForSIMDLane(RegisterID reg, SIMDLane simdLane)
    {
        RELEASE_ASSERT(scalarTypeIsIntegral(simdLane));
        if (elementByteSize(simdLane) == 1)
            m_assembler.movsbl_rr(reg, reg);
        else if (elementByteSize(simdLane) == 2)
            m_assembler.movswl_rr(reg, reg);
        else
            RELEASE_ASSERT_NOT_REACHED();
    }

    void vectorReplaceLaneAVX(SIMDLane simdLane, TrustedImm32 lane, RegisterID src, FPRegisterID dest)
    {
        switch (simdLane) {
        case SIMDLane::i8x16:
            m_assembler.vpinsrb_i8rrr(lane.m_value, src, dest, dest);
            return;
        case SIMDLane::i16x8:
            m_assembler.vpinsrw_i8rrr(lane.m_value, src, dest, dest);
            return;
        case SIMDLane::i32x4:
            m_assembler.vpinsrd_i8rrr(lane.m_value, src, dest, dest);
            return;
        case SIMDLane::i64x2:
            m_assembler.vpinsrq_i8rrr(lane.m_value, src, dest, dest);
            return;
        default:
            RELEASE_ASSERT_NOT_REACHED();
        }
    }

    void vectorReplaceLane(SIMDLane simdLane, TrustedImm32 lane, RegisterID src, FPRegisterID dest)
    {
        if (supportsAVX())
            return vectorReplaceLaneAVX(simdLane, lane, src, dest);

        switch (simdLane) {
        case SIMDLane::i8x16:
            m_assembler.pinsrb_i8rr(lane.m_value, src, dest);
            return;
        case SIMDLane::i16x8:
            m_assembler.pinsrw_i8rr(lane.m_value, src, dest);
            return;
        case SIMDLane::i32x4:
            m_assembler.pinsrd_i8rr(lane.m_value, src, dest);
            return;
        case SIMDLane::i64x2:
            m_assembler.pinsrq_i8rr(lane.m_value, src, dest);
            return;
        default:
            RELEASE_ASSERT_NOT_REACHED();
        }
    }

    void vectorReplaceLaneAVX(SIMDLane simdLane, TrustedImm32 lane, FPRegisterID src, FPRegisterID dest)
    {
        switch (simdLane) {
        case SIMDLane::f32x4:
            m_assembler.vinsertps_i8rrr(lane.m_value, src, dest, dest);
            return;
        case SIMDLane::f64x2:
            ASSERT(lane.m_value < 2);
            if (lane.m_value)
                m_assembler.vunpcklpd_rrr(src, dest, dest);
            else
                m_assembler.vmovsd_rrr(src, dest, dest);
            return;
        default:
            RELEASE_ASSERT_NOT_REACHED();
        }
    }

    void vectorReplaceLane(SIMDLane simdLane, TrustedImm32 lane, FPRegisterID src, FPRegisterID dest)
    {
        if (supportsAVX())
            return vectorReplaceLaneAVX(simdLane, lane, src, dest);

        switch (simdLane) {
        case SIMDLane::f32x4:
            if (supportsSSE4_1())
                m_assembler.insertps_i8rr(lane.m_value, src, dest);
            else
                RELEASE_ASSERT_NOT_REACHED();
            return;
        case SIMDLane::f64x2:
            ASSERT(lane.m_value < 2);
            if (lane.m_value)
                m_assembler.unpcklpd_rr(src, dest);
            else
                m_assembler.movsd_rr(src, dest);
            return;
        default:
            RELEASE_ASSERT_NOT_REACHED();
        }
    }

    DEFINE_SIMD_FUNCS(vectorReplaceLane);

    void vectorExtractLane(SIMDLane simdLane, SIMDSignMode signMode, TrustedImm32 lane, FPRegisterID src, RegisterID dest)
    {
        switch (simdLane) {
        case SIMDLane::i8x16:
            if (supportsAVX())
                m_assembler.vpextrb_i8rr(lane.m_value, src, dest);
            else
                m_assembler.pextrb_i8rr(lane.m_value, src, dest);
            break;
        case SIMDLane::i16x8:
            if (supportsAVX())
                m_assembler.vpextrw_i8rr(lane.m_value, src, dest);
            else
                m_assembler.pextrw_i8rr(lane.m_value, src, dest);
            break;
        case SIMDLane::i32x4:
            if (supportsAVX())
                m_assembler.vpextrd_i8rr(lane.m_value, src, dest);
            else
                m_assembler.pextrd_i8rr(lane.m_value, src, dest);
            break;
        case SIMDLane::i64x2:
            if (supportsAVX())
                m_assembler.vpextrq_i8rr(lane.m_value, src, dest);
            else
                m_assembler.pextrq_i8rr(lane.m_value, src, dest);
            break;
        default:
            RELEASE_ASSERT_NOT_REACHED();
        }

        if (signMode == SIMDSignMode::Signed)
            signExtendForSIMDLane(dest, simdLane);
    }

    void vectorExtractLaneAVX(SIMDLane simdLane, TrustedImm32 lane, FPRegisterID src, FPRegisterID dest)
    {
        if (!lane.m_value) {
            if (src != dest)
                m_assembler.vmovaps_rr(src, dest);
            return;
        }

        switch (simdLane) {
        case SIMDLane::f32x4: {
            ASSERT(lane.m_value < 4);
            if (lane.m_value == 1) {
                m_assembler.vmovshdup_rr(src, dest);
                return;
            }

            if (lane.m_value == 2) {
                m_assembler.vmovhlps_rrr(src, dest, dest);
                return;
            }

            if (src != dest)
                m_assembler.vpshufd_i8rr(lane.m_value, src, dest);
            else {
                ASSERT(src == dest);
                m_assembler.vshufps_i8rrr(lane.m_value, dest, dest, dest);
            }
            return;
        }
        case SIMDLane::f64x2:
            ASSERT(lane.m_value == 1);
            m_assembler.vmovhlps_rrr(src, dest, dest);
            return;
        default:
            RELEASE_ASSERT_NOT_REACHED();
        }
    }

    void vectorExtractLane(SIMDLane simdLane, TrustedImm32 lane, FPRegisterID src, FPRegisterID dest)
    {
        if (supportsAVX())
            return vectorExtractLaneAVX(simdLane, lane, src, dest);

        // For lane 0, we just move since we do not ensure the upper bits.
        if (!lane.m_value) {
            if (src != dest)
                m_assembler.movaps_rr(src, dest);
            return;
        }

        switch (simdLane) {
        case SIMDLane::f32x4: {
            ASSERT(lane.m_value < 4);
            if (lane.m_value == 1 && supportsSSE3()) {
                m_assembler.movshdup_rr(src, dest);
                return;
            }

            if (lane.m_value == 2) {
                m_assembler.movhlps_rr(src, dest);
                return;
            }

            if (src != dest)
                m_assembler.pshufd_i8rr(lane.m_value, src, dest);
            else {
                ASSERT(src == dest);
                m_assembler.shufps_i8rr(lane.m_value, dest, dest);
            }
            return;
        }
        case SIMDLane::f64x2:
            ASSERT(lane.m_value == 1);
            m_assembler.movhlps_rr(src, dest);
            return;
        default:
            RELEASE_ASSERT_NOT_REACHED();
        }
    }

    DEFINE_SIGNED_SIMD_FUNCS(vectorExtractLane);

    void vectorDupElement(SIMDLane simdLane, TrustedImm32 lane, FPRegisterID src, FPRegisterID dest)
    {
        UNUSED_PARAM(simdLane); UNUSED_PARAM(lane); UNUSED_PARAM(src); UNUSED_PARAM(dest);
    }

    DEFINE_SIMD_FUNCS(vectorDupElement);

    void compareFloatingPointVectorUnordered(SIMDInfo simdInfo, FPRegisterID left, FPRegisterID right, FPRegisterID dest)
    {
        RELEASE_ASSERT(supportsAVX());
        RELEASE_ASSERT(scalarTypeIsFloatingPoint(simdInfo.lane));

        using PackedCompareCondition = X86Assembler::PackedCompareCondition;

        if (simdInfo.lane == SIMDLane::f32x4)
            m_assembler.vcmpps_rrr(PackedCompareCondition::Unordered, right, left, dest);
        else
            m_assembler.vcmppd_rrr(PackedCompareCondition::Unordered, right, left, dest);
    }

    void compareFloatingPointVector(DoubleCondition cond, SIMDInfo simdInfo, FPRegisterID left, FPRegisterID right, FPRegisterID dest)
    {
        RELEASE_ASSERT(supportsAVX());
        RELEASE_ASSERT(scalarTypeIsFloatingPoint(simdInfo.lane));

        using PackedCompareCondition = X86Assembler::PackedCompareCondition;

        switch (cond) {
        case DoubleEqualAndOrdered:
            if (simdInfo.lane == SIMDLane::f32x4)
                m_assembler.vcmpps_rrr(PackedCompareCondition::EqualAndOrdered, right, left, dest);
            else
                m_assembler.vcmppd_rrr(PackedCompareCondition::EqualAndOrdered, right, left, dest);
            break;
        case DoubleNotEqualOrUnordered:
            if (simdInfo.lane == SIMDLane::f32x4)
                m_assembler.vcmpps_rrr(PackedCompareCondition::NotEqualOrUnordered, right, left, dest);
            else
                m_assembler.vcmppd_rrr(PackedCompareCondition::NotEqualOrUnordered, right, left, dest);
            break;
        case DoubleGreaterThanAndOrdered:
            if (simdInfo.lane == SIMDLane::f32x4)
                m_assembler.vcmpps_rrr(PackedCompareCondition::GreaterThanAndOrdered, right, left, dest);
            else
                m_assembler.vcmppd_rrr(PackedCompareCondition::GreaterThanAndOrdered, right, left, dest);
            break;
        case DoubleGreaterThanOrEqualAndOrdered:
            if (simdInfo.lane == SIMDLane::f32x4)
                m_assembler.vcmpps_rrr(PackedCompareCondition::GreaterThanOrEqualAndOrdered, right, left, dest);
            else
                m_assembler.vcmppd_rrr(PackedCompareCondition::GreaterThanOrEqualAndOrdered, right, left, dest);
            break;
        case DoubleLessThanAndOrdered:
            if (simdInfo.lane == SIMDLane::f32x4)
                m_assembler.vcmpps_rrr(PackedCompareCondition::LessThanAndOrdered, right, left, dest);
            else
                m_assembler.vcmppd_rrr(PackedCompareCondition::LessThanAndOrdered, right, left, dest);
            break;
        case DoubleLessThanOrEqualAndOrdered:
            if (simdInfo.lane == SIMDLane::f32x4)
                m_assembler.vcmpps_rrr(PackedCompareCondition::LessThanOrEqualAndOrdered, right, left, dest);
            else
                m_assembler.vcmppd_rrr(PackedCompareCondition::LessThanOrEqualAndOrdered, right, left, dest);
            break;
        default:
            RELEASE_ASSERT_NOT_REACHED();
        }
    }

    void compareIntegerVector(RelationalCondition cond, SIMDInfo simdInfo, FPRegisterID left, FPRegisterID right, FPRegisterID dest, FPRegisterID scratch)
    {
        RELEASE_ASSERT(supportsAVX());
        RELEASE_ASSERT(scalarTypeIsIntegral(simdInfo.lane));

        switch (cond) {
        case Equal:
            switch (simdInfo.lane) {
            case SIMDLane::i8x16:
                m_assembler.vpcmpeqb_rrr(right, left, dest);
                break;
            case SIMDLane::i16x8:
                m_assembler.vpcmpeqw_rrr(right, left, dest);
                break;
            case SIMDLane::i32x4:
                m_assembler.vpcmpeqd_rrr(right, left, dest);
                break;
            case SIMDLane::i64x2:
                m_assembler.vpcmpeqq_rrr(right, left, dest);
                break;
            default:
                RELEASE_ASSERT_NOT_REACHED_WITH_MESSAGE("Unsupported SIMD lane for comparison");
            }
            break;
        case NotEqual:
            // NotEqual comparisons are implemented by negating Equal on Intel, which should be
            // handled before we ever reach this point.
            RELEASE_ASSERT_NOT_REACHED_WITH_MESSAGE("Shouldn't emit integer vector NotEqual comparisons directly.");
            break;
        case Above:
            // Above comparisons are implemented by negating BelowOrEqual on Intel, which should be
            // handled before we ever reach this point.
            RELEASE_ASSERT_NOT_REACHED_WITH_MESSAGE("Shouldn't emit integer vector Above comparisons directly.");
            break;
        case AboveOrEqual:
            switch (simdInfo.lane) {
            case SIMDLane::i8x16:
                m_assembler.vpmaxub_rrr(right, left, scratch);
                m_assembler.vpcmpeqb_rrr(left, scratch, dest);
                break;
            case SIMDLane::i16x8:
                m_assembler.vpmaxuw_rrr(right, left, scratch);
                m_assembler.vpcmpeqw_rrr(left, scratch, dest);
                break;
            case SIMDLane::i32x4:
                m_assembler.vpmaxud_rrr(right, left, scratch);
                m_assembler.vpcmpeqd_rrr(left, scratch, dest);
                break;
            case SIMDLane::i64x2:
                RELEASE_ASSERT_NOT_REACHED_WITH_MESSAGE("i64x2 unsigned comparisons are not supported.");
                break;
            default:
                RELEASE_ASSERT_NOT_REACHED_WITH_MESSAGE("Unsupported SIMD lane for comparison");
            }
            break;
        case Below:
            // Below comparisons are implemented by negating AboveOrEqual on Intel, which should be
            // handled before we ever reach this point.
            RELEASE_ASSERT_NOT_REACHED_WITH_MESSAGE("Shouldn't emit integer vector Below comparisons directly.");
            break;
        case BelowOrEqual:
            switch (simdInfo.lane) {
            case SIMDLane::i8x16:
                m_assembler.vpminub_rrr(right, left, scratch);
                m_assembler.vpcmpeqb_rrr(left, scratch, dest);
                break;
            case SIMDLane::i16x8:
                m_assembler.vpminuw_rrr(right, left, scratch);
                m_assembler.vpcmpeqw_rrr(left, scratch, dest);
                break;
            case SIMDLane::i32x4:
                m_assembler.vpminud_rrr(right, left, scratch);
                m_assembler.vpcmpeqd_rrr(left, scratch, dest);
                break;
            case SIMDLane::i64x2:
                RELEASE_ASSERT_NOT_REACHED_WITH_MESSAGE("i64x2 unsigned comparisons are not supported.");
                break;
            default:
                RELEASE_ASSERT_NOT_REACHED_WITH_MESSAGE("Unsupported SIMD lane for comparison");
            }
            break;
        case GreaterThan:
            switch (simdInfo.lane) {
            case SIMDLane::i8x16:
                m_assembler.vpcmpgtb_rrr(right, left, dest);
                break;
            case SIMDLane::i16x8:
                m_assembler.vpcmpgtw_rrr(right, left, dest);
                break;
            case SIMDLane::i32x4:
                m_assembler.vpcmpgtd_rrr(right, left, dest);
                break;
            case SIMDLane::i64x2:
                m_assembler.vpcmpgtq_rrr(right, left, dest);
                break;
            default:
                RELEASE_ASSERT_NOT_REACHED_WITH_MESSAGE("Unsupported SIMD lane for comparison");
            }
            break;
        case GreaterThanOrEqual:
            switch (simdInfo.lane) {
            case SIMDLane::i8x16:
                m_assembler.vpmaxsb_rrr(right, left, scratch);
                m_assembler.vpcmpeqb_rrr(left, scratch, dest);
                break;
            case SIMDLane::i16x8:
                m_assembler.vpmaxsw_rrr(right, left, scratch);
                m_assembler.vpcmpeqw_rrr(left, scratch, dest);
                break;
            case SIMDLane::i32x4:
                m_assembler.vpmaxsd_rrr(right, left, scratch);
                m_assembler.vpcmpeqd_rrr(left, scratch, dest);
                break;
            case SIMDLane::i64x2:
                // Intel doesn't support 64-bit packed maximum/minimum without AVX512, so this condition should have been transformed
                // into a negated LessThan prior to reaching the macro assembler.
                RELEASE_ASSERT_NOT_REACHED_WITH_MESSAGE("Shouldn't emit integer vector GreaterThanOrEqual comparisons directly.");
                break;
            default:
                RELEASE_ASSERT_NOT_REACHED_WITH_MESSAGE("Unsupported SIMD lane for comparison");
            }
            break;
        case LessThan:
            switch (simdInfo.lane) {
            case SIMDLane::i8x16:
                m_assembler.vpcmpgtb_rrr(left, right, dest);
                break;
            case SIMDLane::i16x8:
                m_assembler.vpcmpgtw_rrr(left, right, dest);
                break;
            case SIMDLane::i32x4:
                m_assembler.vpcmpgtd_rrr(left, right, dest);
                break;
            case SIMDLane::i64x2:
                m_assembler.vpcmpgtq_rrr(left, right, dest);
                break;
            default:
                RELEASE_ASSERT_NOT_REACHED_WITH_MESSAGE("Unsupported SIMD lane for comparison");
            }
            break;
        case LessThanOrEqual:
            switch (simdInfo.lane) {
            case SIMDLane::i8x16:
                m_assembler.vpminsb_rrr(right, left, scratch);
                m_assembler.vpcmpeqb_rrr(left, scratch, dest);
                break;
            case SIMDLane::i16x8:
                m_assembler.vpminsw_rrr(right, left, scratch);
                m_assembler.vpcmpeqw_rrr(left, scratch, dest);
                break;
            case SIMDLane::i32x4:
                m_assembler.vpminsd_rrr(right, left, scratch);
                m_assembler.vpcmpeqd_rrr(left, scratch, dest);
                break;
            case SIMDLane::i64x2:
                // Intel doesn't support 64-bit packed maximum/minimum without AVX512, so this condition should have been transformed
                // into a negated GreaterThan prior to reaching the macro assembler.
                RELEASE_ASSERT_NOT_REACHED_WITH_MESSAGE("Shouldn't emit integer vector LessThanOrEqual comparisons directly.");
                break;
            default:
                RELEASE_ASSERT_NOT_REACHED_WITH_MESSAGE("Unsupported SIMD lane for comparison");
            }
            break;
        default:
            RELEASE_ASSERT_NOT_REACHED();
        }
    }

    void compareIntegerVectorWithZero(RelationalCondition cond, SIMDInfo simdInfo, FPRegisterID vector, FPRegisterID dest, RegisterID scratch)
    {
        RELEASE_ASSERT(scalarTypeIsIntegral(simdInfo.lane));
        RELEASE_ASSERT(supportsAVX());
        RELEASE_ASSERT(cond == RelationalCondition::Equal || cond == RelationalCondition::NotEqual);

        m_assembler.vptest_rr(vector, vector);
        m_assembler.setCC_r(x86Condition(cond), scratch);
        vectorSplatInt8(scratch, dest);
    }

    void add64(FPRegisterID left, FPRegisterID right, FPRegisterID dest)
    {
        UNUSED_PARAM(left);
        UNUSED_PARAM(right);
        UNUSED_PARAM(dest);
    }

    void sub64(FPRegisterID left, FPRegisterID right, FPRegisterID dest)
    {
        UNUSED_PARAM(left);
        UNUSED_PARAM(right);
        UNUSED_PARAM(dest);
    }

    void vectorAdd(SIMDInfo simdInfo, FPRegisterID left, FPRegisterID right, FPRegisterID dest)
    {
        RELEASE_ASSERT(supportsAVX());

        switch (simdInfo.lane) {
        case SIMDLane::f32x4:
            m_assembler.vaddps_rrr(right, left, dest);
            break;
        case SIMDLane::f64x2:
            m_assembler.vaddpd_rrr(right, left, dest);
            break;
        case SIMDLane::i8x16:
            m_assembler.vpaddb_rrr(right, left, dest);
            break;
        case SIMDLane::i16x8:
            m_assembler.vpaddw_rrr(right, left, dest);
            break;
        case SIMDLane::i32x4:
            m_assembler.vpaddd_rrr(right, left, dest);
            break;
        case SIMDLane::i64x2:
            m_assembler.vpaddq_rrr(right, left, dest);
            break;
        default:
            RELEASE_ASSERT_NOT_REACHED_WITH_MESSAGE("Invalid SIMD lane for vector add.");
        }
    }

    void vectorSub(SIMDInfo simdInfo, FPRegisterID left, FPRegisterID right, FPRegisterID dest)
    {
        RELEASE_ASSERT(supportsAVX());

        switch (simdInfo.lane) {
        case SIMDLane::f32x4:
            m_assembler.vsubps_rrr(right, left, dest);
            break;
        case SIMDLane::f64x2:
            m_assembler.vsubpd_rrr(right, left, dest);
            break;
        case SIMDLane::i8x16:
            m_assembler.vpsubb_rrr(right, left, dest);
            break;
        case SIMDLane::i16x8:
            m_assembler.vpsubw_rrr(right, left, dest);
            break;
        case SIMDLane::i32x4:
            m_assembler.vpsubd_rrr(right, left, dest);
            break;
        case SIMDLane::i64x2:
            m_assembler.vpsubq_rrr(right, left, dest);
            break;
        default:
            RELEASE_ASSERT_NOT_REACHED_WITH_MESSAGE("Invalid SIMD lane for vector subtract.");
        }
    }

    void vectorMul(SIMDInfo simdInfo, FPRegisterID left, FPRegisterID right, FPRegisterID dest)
    {
        RELEASE_ASSERT(supportsAVX());

        switch (simdInfo.lane) {
        case SIMDLane::f32x4:
            m_assembler.vmulps_rrr(right, left, dest);
            break;
        case SIMDLane::f64x2:
            m_assembler.vmulpd_rrr(right, left, dest);
            break;
        case SIMDLane::i16x8:
            m_assembler.vpmullw_rrr(right, left, dest);
            break;
        case SIMDLane::i32x4:
            m_assembler.vpmulld_rrr(right, left, dest);
            break;
        case SIMDLane::i64x2:
            RELEASE_ASSERT_NOT_REACHED_WITH_MESSAGE("i64x2 multiply is not supported on Intel without AVX-512. This instruction should have been lowered before reaching the assembler.");
            break;
        default:
            RELEASE_ASSERT_NOT_REACHED_WITH_MESSAGE("Invalid SIMD lane for vector multiply.");
        }
    }

    void vectorFusedMulAdd(SIMDInfo simdInfo, FPRegisterID mul1, FPRegisterID mul2, FPRegisterID addend, FPRegisterID dest, FPRegisterID scratch)
    {
        ASSERT(scalarTypeIsFloatingPoint(simdInfo.lane));
        vectorMul(simdInfo, mul1, mul2, scratch);
        vectorAdd(simdInfo, addend, scratch, dest);
    }

    void vectorFusedNegMulAdd(SIMDInfo simdInfo, FPRegisterID mul1, FPRegisterID mul2, FPRegisterID addend, FPRegisterID dest, FPRegisterID scratch)
    {
        ASSERT(scalarTypeIsFloatingPoint(simdInfo.lane));
        vectorMul(simdInfo, mul1, mul2, scratch);
        vectorSub(simdInfo, addend, scratch, dest);
    }

    void vectorDiv(SIMDInfo simdInfo, FPRegisterID left, FPRegisterID right, FPRegisterID dest)
    {
        RELEASE_ASSERT(supportsAVX());
        ASSERT(scalarTypeIsFloatingPoint(simdInfo.lane));
        switch (simdInfo.lane) {
        case SIMDLane::f32x4:
            m_assembler.vdivps_rrr(right, left, dest);
            break;
        case SIMDLane::f64x2:
            m_assembler.vdivpd_rrr(right, left, dest);
            break;
        default:
            RELEASE_ASSERT_NOT_REACHED_WITH_MESSAGE("Invalid SIMD lane for vector divide.");
        }
    }

    void vectorMax(SIMDInfo simdInfo, FPRegisterID left, FPRegisterID right, FPRegisterID dest)
    {
        switch (simdInfo.lane) {
        case SIMDLane::i8x16:
            if (supportsAVX()) {
                if (simdInfo.signMode == SIMDSignMode::Signed)
                    m_assembler.vpmaxsb_rrr(right, left, dest);
                else
                    m_assembler.vpmaxub_rrr(right, left, dest);
            } else {
                if (left != dest)
                    m_assembler.movapd_rr(left, dest);
                if (simdInfo.signMode == SIMDSignMode::Signed) {
                    if (supportsSSE4_1())
                        m_assembler.pmaxsb_rr(right, dest);
                    else
                        RELEASE_ASSERT_NOT_REACHED();
                } else
                    m_assembler.pmaxub_rr(right, dest);
            }
            return;
        case SIMDLane::i16x8:
            if (supportsAVX()) {
                if (simdInfo.signMode == SIMDSignMode::Signed)
                    m_assembler.vpmaxsw_rrr(right, left, dest);
                else
                    m_assembler.vpmaxuw_rrr(right, left, dest);
            } else {
                if (left != dest)
                    m_assembler.movapd_rr(left, dest);
                if (simdInfo.signMode == SIMDSignMode::Signed)
                    m_assembler.pmaxsw_rr(right, dest);
                else {
                    if (supportsSSE4_1())
                        m_assembler.pmaxuw_rr(right, dest);
                    else
                        RELEASE_ASSERT_NOT_REACHED();
                }
            }
            return;
        case SIMDLane::i32x4:
            if (supportsAVX()) {
                if (simdInfo.signMode == SIMDSignMode::Signed)
                    m_assembler.vpmaxsd_rrr(right, left, dest);
                else
                    m_assembler.vpmaxud_rrr(right, left, dest);
            } else {
                if (left != dest)
                    m_assembler.movapd_rr(left, dest);
                if (simdInfo.signMode == SIMDSignMode::Signed) {
                    if (supportsSSE4_1())
                        m_assembler.pmaxsd_rr(right, dest);
                    else
                        RELEASE_ASSERT_NOT_REACHED();
                } else
                    m_assembler.pmaxud_rr(right, dest);
            }
            return;
        case SIMDLane::f32x4:
        case SIMDLane::f64x2:
            RELEASE_ASSERT_NOT_REACHED_WITH_MESSAGE("Should have expanded f32x4/f64x2 maximum before reaching macro assembler.");
            break;
        default:
            RELEASE_ASSERT_NOT_REACHED();
        }
    }

    void vectorMin(SIMDInfo simdInfo, FPRegisterID left, FPRegisterID right, FPRegisterID dest)
    {
        switch (simdInfo.lane) {
        case SIMDLane::i8x16:
            if (supportsAVX()) {
                if (simdInfo.signMode == SIMDSignMode::Signed)
                    m_assembler.vpminsb_rrr(right, left, dest);
                else
                    m_assembler.vpminub_rrr(right, left, dest);
            } else {
                if (left != dest)
                    m_assembler.movapd_rr(left, dest);
                if (simdInfo.signMode == SIMDSignMode::Signed) {
                    if (supportsSSE4_1())
                        m_assembler.pminsb_rr(right, dest);
                    else
                        RELEASE_ASSERT_NOT_REACHED();
                } else
                    m_assembler.pminub_rr(right, dest);
            }
            return;
        case SIMDLane::i16x8:
            if (supportsAVX()) {
                if (simdInfo.signMode == SIMDSignMode::Signed)
                    m_assembler.vpminsw_rrr(right, left, dest);
                else
                    m_assembler.vpminuw_rrr(right, left, dest);
            } else {
                if (left != dest)
                    m_assembler.movapd_rr(left, dest);
                if (simdInfo.signMode == SIMDSignMode::Signed)
                    m_assembler.pminsw_rr(right, dest);
                else {
                    if (supportsSSE4_1())
                        m_assembler.pminuw_rr(right, dest);
                    else
                        RELEASE_ASSERT_NOT_REACHED();
                }
            }
            return;
        case SIMDLane::i32x4:
            if (supportsAVX()) {
                if (simdInfo.signMode == SIMDSignMode::Signed)
                    m_assembler.vpminsd_rrr(right, left, dest);
                else
                    m_assembler.vpminud_rrr(right, left, dest);
            } else {
                if (left != dest)
                    m_assembler.movapd_rr(left, dest);
                if (simdInfo.signMode == SIMDSignMode::Signed) {
                    if (supportsSSE4_1())
                        m_assembler.pminsd_rr(right, dest);
                    else
                        RELEASE_ASSERT_NOT_REACHED();
                } else
                    m_assembler.pminud_rr(right, dest);
            }
            return;
        case SIMDLane::f32x4:
        case SIMDLane::f64x2:
            RELEASE_ASSERT_NOT_REACHED_WITH_MESSAGE("Should have expanded f32x4/f64x2 minimum before reaching macro assembler.");
            break;
        default:
            RELEASE_ASSERT_NOT_REACHED();
        }
    }

    void vectorPmin(SIMDInfo simdInfo, FPRegisterID left, FPRegisterID right, FPRegisterID dest)
    {
        RELEASE_ASSERT(supportsAVX());
        ASSERT(scalarTypeIsFloatingPoint(simdInfo.lane));
        // When comparing min(0.0, -0.0), the WebAssembly semantics of Pmin say we should return 0.0, since
        // Pmin is defined as right < left ? right : left. However, the vminps instruction breaks ties towards the second
        // source operand - essentially left < right ? left : right. So we reverse the usual operand order for the
        // instruction.
        if (simdInfo.lane == SIMDLane::f32x4)
            m_assembler.vminps_rrr(left, right, dest);
        else
            m_assembler.vminpd_rrr(left, right, dest);
    }

    void vectorPmax(SIMDInfo simdInfo, FPRegisterID left, FPRegisterID right, FPRegisterID dest)
    {
        RELEASE_ASSERT(supportsAVX());
        ASSERT(scalarTypeIsFloatingPoint(simdInfo.lane));
        // When comparing max(0.0, -0.0), the WebAssembly semantics of Pmax say we should return 0.0, since
        // Pmax is defined as right > left ? right : left. However, the vmaxps instruction breaks ties towards the second
        // source operand - essentially left > right ? left : right. So we reverse the usual operand order for the
        // instruction.
        if (simdInfo.lane == SIMDLane::f32x4)
            m_assembler.vmaxps_rrr(left, right, dest);
        else
            m_assembler.vmaxpd_rrr(left, right, dest);
    }

    void vectorBitwiseSelect(FPRegisterID left, FPRegisterID right, FPRegisterID inputBitsAndDest)
    {
        UNUSED_PARAM(left); UNUSED_PARAM(right); UNUSED_PARAM(inputBitsAndDest);
    }

    void vectorAnd(SIMDInfo simdInfo, FPRegisterID left, FPRegisterID right, FPRegisterID dest)
    {
        RELEASE_ASSERT(supportsAVX());
        RELEASE_ASSERT(simdInfo.lane == SIMDLane::v128);
        m_assembler.vandps_rrr(right, left, dest);
    }

    void vectorAndnot(SIMDInfo simdInfo, FPRegisterID left, FPRegisterID right, FPRegisterID dest)
    {
        RELEASE_ASSERT(supportsAVX());
        RELEASE_ASSERT(simdInfo.lane == SIMDLane::v128);
        // WebAssembly v128.andnot is equivalent to (v128.and left (v128.not right)). However, the Intel
        // vandnps instruction negates the first source operand, essentially (v128.and (v128.not left) right).
        // To achieve correct WebAssembly semantics, we provide left and right in reversed order here.
        m_assembler.vandnps_rrr(left, right, dest);
    }

    void vectorOr(SIMDInfo simdInfo, FPRegisterID left, FPRegisterID right, FPRegisterID dest)
    {
        RELEASE_ASSERT(supportsAVX());
        RELEASE_ASSERT(simdInfo.lane == SIMDLane::v128);
        m_assembler.vorps_rrr(right, left, dest);
    }

    void vectorXor(SIMDInfo simdInfo, FPRegisterID left, FPRegisterID right, FPRegisterID dest)
    {
        RELEASE_ASSERT(supportsAVX());
        RELEASE_ASSERT(simdInfo.lane == SIMDLane::v128);
        m_assembler.vxorps_rrr(right, left, dest);
    }

    void moveZeroToVector(FPRegisterID dest)
    {
        vectorXor({ SIMDLane::v128, SIMDSignMode::None }, dest, dest, dest);
    }

    void vectorAbsInt64(FPRegisterID input, FPRegisterID dest, FPRegisterID scratch)
    {
        // https://github.com/WebAssembly/simd/pull/413
        ASSERT(supportsAVX());
        m_assembler.vpxor_rrr(scratch, scratch, scratch);
        m_assembler.vpsubq_rrr(input, scratch, scratch);
        m_assembler.vblendvpd_rrrr(input, scratch, input, dest);
    }

    void vectorAbs(SIMDInfo simdInfo, FPRegisterID input, FPRegisterID dest)
    {
        switch (simdInfo.lane) {
        case SIMDLane::i8x16:
            if (supportsAVX())
                m_assembler.vpabsb_rr(input, dest);
            else if (supportsSupplementalSSE3())
                m_assembler.pabsb_rr(input, dest);
            else
                RELEASE_ASSERT_NOT_REACHED();
            return;
        case SIMDLane::i16x8:
            if (supportsAVX())
                m_assembler.vpabsw_rr(input, dest);
            else if (supportsSupplementalSSE3())
                m_assembler.pabsw_rr(input, dest);
            else
                RELEASE_ASSERT_NOT_REACHED();
            return;
        case SIMDLane::i32x4:
            if (supportsAVX())
                m_assembler.vpabsd_rr(input, dest);
            else if (supportsSupplementalSSE3())
                m_assembler.pabsd_rr(input, dest);
            else
                RELEASE_ASSERT_NOT_REACHED();
            return;
        case SIMDLane::i64x2:
        case SIMDLane::f32x4:
        case SIMDLane::f64x2:
            RELEASE_ASSERT_NOT_REACHED_WITH_MESSAGE("i64, f32, f64 vector absolute value are not supported on x86, so this should have been expanded out prior to reaching the macro assembler.");
            return;
        default:
            RELEASE_ASSERT_NOT_REACHED();
        }
    }

    using RoundingType = X86Assembler::RoundingType;

    void vectorCeil(SIMDInfo simdInfo, FPRegisterID input, FPRegisterID dest)
    {
        RELEASE_ASSERT(supportsAVX());
        ASSERT(scalarTypeIsFloatingPoint(simdInfo.lane));
        if (simdInfo.lane == SIMDLane::f32x4)
            m_assembler.vroundps_rr(input, dest, RoundingType::TowardInfiniti);
        else
            m_assembler.vroundpd_rr(input, dest, RoundingType::TowardInfiniti);
    }

    void vectorFloor(SIMDInfo simdInfo, FPRegisterID input, FPRegisterID dest)
    {
        RELEASE_ASSERT(supportsAVX());
        ASSERT(scalarTypeIsFloatingPoint(simdInfo.lane));
        if (simdInfo.lane == SIMDLane::f32x4)
            m_assembler.vroundps_rr(input, dest, RoundingType::TowardNegativeInfiniti);
        else
            m_assembler.vroundpd_rr(input, dest, RoundingType::TowardNegativeInfiniti);
    }

    void vectorTrunc(SIMDInfo simdInfo, FPRegisterID input, FPRegisterID dest)
    {
        RELEASE_ASSERT(supportsAVX());
        ASSERT(scalarTypeIsFloatingPoint(simdInfo.lane));
        if (simdInfo.lane == SIMDLane::f32x4)
            m_assembler.vroundps_rr(input, dest, RoundingType::TowardZero);
        else
            m_assembler.vroundpd_rr(input, dest, RoundingType::TowardZero);
    }

    void vectorTruncSat(SIMDInfo simdInfo, FPRegisterID src, FPRegisterID dest, RegisterID scratchGPR, FPRegisterID scratchFPR1, FPRegisterID scratchFPR2)
    {
        ASSERT(supportsAVX());
        ASSERT_UNUSED(simdInfo, simdInfo.signMode == SIMDSignMode::Signed);
        ASSERT(simdInfo.lane == SIMDLane::f32x4);

        // The instruction cvttps2dq only saturates overflows to 0x80000000 and cannot handle NaN.
        // However, i32x4.nearest_sat_f32x4_s requires:
        //     1. saturate positive-overflow integer to 0x7FFFFFFF
        //     2. saturate negative-overflow integer to 0x80000000
        //     3. convert NaN or -0 to 0.

        m_assembler.vmovaps_rr(src, scratchFPR1);                               // scratchFPR1 = src
        m_assembler.vcmpunordps_rrr(scratchFPR1, scratchFPR1, scratchFPR1);     // scratchFPR1 = NaN mask by unordered comparison
        m_assembler.vandnps_rrr(src, scratchFPR1, scratchFPR1);                 // scratchFPR1 = src with NaN lanes cleared

        alignas(16) static constexpr float masks[] = {
            0x1.0p+31f,
            0x1.0p+31f,
            0x1.0p+31f,
            0x1.0p+31f,
        };
        move(TrustedImmPtr(masks), scratchGPR);                                 // scratchGPR = minimum positive-overflow integer 0x80000000
        m_assembler.vcmpnltps_mrr(0, scratchGPR, scratchFPR1, scratchFPR2);     // scratchFPR2 = positive-overflow mask by checking src >= 0x80000000

        m_assembler.vcvttps2dq_rr(scratchFPR1, scratchFPR1);                    // convert scratchFPR1 to integer with overflow saturated to 0x80000000

        m_assembler.vpxor_rrr(scratchFPR2, scratchFPR1, dest);                  // convert positive-overflow lane to 0x7FFFFFFF
    }

    void vectorTruncSatUnsignedFloat32(FPRegisterID src, FPRegisterID dest, RegisterID scratchGPR, FPRegisterID scratchFPR1, FPRegisterID scratchFPR2)
    {
        ASSERT(supportsAVX());

        // https://github.com/WebAssembly/simd/pull/247
        // https://github.com/WebAssembly/relaxed-simd/issues/21

        // The instruction cvttps2dq only saturates overflows to 0x80000000 and cannot handle NaN.
        // However, i32x4.nearest_sat_f32x4_u requires:
        //     1. saturate positive-overflow integer to 0xFFFFFFFF
        //     2. saturate negative-overflow integer to 0
        //     3. convert NaN or -0 to 0.    
        
        m_assembler.vxorps_rrr(scratchFPR1, scratchFPR1, scratchFPR1);
        m_assembler.vmaxps_rrr(scratchFPR1, src, dest);                     // dest = f[lane]x4 = src with NaN and negatives cleared

        alignas(16) static constexpr float masks[] = {
            2147483647.0f,
            2147483647.0f,
            2147483647.0f,
            2147483647.0f,
        };
        move(TrustedImmPtr(masks), scratchGPR);                             // scratchGPR = f[0x80000000]x4

        m_assembler.vmovaps_rr(dest, scratchFPR2);
        m_assembler.vsubps_mrr(0, scratchGPR, scratchFPR2, scratchFPR2);    // scratchFPR2 = f[lane - 0x80000000]x4

        m_assembler.vcmpnltps_mrr(0, scratchGPR, scratchFPR2, scratchFPR1); // scratchFPR1 = mask for [lane >= 0xFFFFFFFF]x4

        m_assembler.vcvttps2dq_rr(scratchFPR2, scratchFPR2);                // scratchFPR2 = i[lane - 0x80000000]x4 with satruated lane 0x80000000 for int32 overflow

        m_assembler.vpxor_rrr(scratchFPR1, scratchFPR2, scratchFPR2);       // scratchFPR2 = i[lane - 0x80000000]x4 with satruated lane 0x7FFFFFFF for int32 positive-overflow and 0x80000000 for int32 negative-overflow

        m_assembler.vpxor_rrr(scratchFPR1, scratchFPR1, scratchFPR1);
        m_assembler.vpmaxsd_rrr(scratchFPR1, scratchFPR2, scratchFPR2);     // scratchFPR2 = i[lane - 0x80000000]x4 with satruated lane 0x7FFFFFFF for int32 positive-overflow and negatives cleared

        m_assembler.vcvttps2dq_rr(dest, dest);                              // dest = i[lane]x4 with satruated lane 0x80000000 for int32 positive-overflow

        m_assembler.vpaddd_rrr(scratchFPR2, dest, dest);                    // dest = dest + scratchFPR2 = i[lane]x4 with satruated 0xFFFFFFFF for int32 positive-overflow    
    }

    void vectorTruncSatSignedFloat64(FPRegisterID src, FPRegisterID dest, RegisterID scratchGPR, FPRegisterID scratchFPR)
    {
        // https://github.com/WebAssembly/simd/pull/383
        ASSERT(supportsAVX());
        alignas(16) static constexpr double masks[] = {
            2147483647.0,
            2147483647.0,
        };

        using PackedCompareCondition = X86Assembler::PackedCompareCondition;

        m_assembler.vcmppd_rrr(PackedCompareCondition::EqualAndOrdered, src, src, scratchFPR);
        move(TrustedImmPtr(masks), scratchGPR);
        m_assembler.vandpd_mrr(0, scratchGPR, scratchFPR, scratchFPR);
        m_assembler.vminpd_rrr(scratchFPR, src, dest);
        m_assembler.vcvttpd2dq_rr(dest, dest);
    }

    void vectorTruncSatUnsignedFloat64(FPRegisterID src, FPRegisterID dest, RegisterID scratchGPR, FPRegisterID scratchFPR)
    {
        // https://github.com/WebAssembly/simd/pull/383
        ASSERT(supportsAVX());

        alignas(16) static constexpr double masks[] = {
            4294967295.0,
            4294967295.0,
            0x1.0p+52,
            0x1.0p+52,
        };
        move(TrustedImmPtr(masks), scratchGPR);

        m_assembler.vxorpd_rrr(scratchFPR, scratchFPR, scratchFPR);
        m_assembler.vmaxpd_rrr(scratchFPR, src, dest);
        m_assembler.vminpd_mrr(0, scratchGPR, dest, dest);
        m_assembler.vroundpd_rr(dest, dest, RoundingType::TowardZero);
        m_assembler.vaddpd_mrr(sizeof(double) * 2, scratchGPR, dest, dest);
        m_assembler.vshufps_i8rrr(0x88, scratchFPR, dest, dest);
    }

    void vectorNearest(SIMDInfo simdInfo, FPRegisterID input, FPRegisterID dest)
    {
        RELEASE_ASSERT(supportsAVX());
        ASSERT(scalarTypeIsFloatingPoint(simdInfo.lane));
        if (simdInfo.lane == SIMDLane::f32x4)
            m_assembler.vroundps_rr(input, dest, RoundingType::ToNearestWithTiesToEven);
        else
            m_assembler.vroundpd_rr(input, dest, RoundingType::ToNearestWithTiesToEven);
    }

    void vectorSqrt(SIMDInfo simdInfo, FPRegisterID input, FPRegisterID dest)
    {
        RELEASE_ASSERT(supportsAVX());
        ASSERT(scalarTypeIsFloatingPoint(simdInfo.lane));
        if (simdInfo.lane == SIMDLane::f32x4)
            m_assembler.vsqrtps_rr(input, dest);
        else
            m_assembler.vsqrtpd_rr(input, dest);
    }

    void vectorExtendLow(SIMDInfo simdInfo, FPRegisterID input, FPRegisterID dest)
    {
        switch (simdInfo.lane) {
        case SIMDLane::i16x8:
            if (simdInfo.signMode == SIMDSignMode::Signed) {
                if (supportsAVX())
                    m_assembler.vpmovsxbw_rr(input, dest);
                else if (supportsSSE4_1())
                    m_assembler.pmovsxbw(input, dest);
                else
                    RELEASE_ASSERT_NOT_REACHED();
            } else {
                if (supportsAVX())
                    m_assembler.vpmovzxbw_rr(input, dest);
                else if (supportsSSE4_1())
                    m_assembler.pmovzxbw(input, dest);
                else
                    RELEASE_ASSERT_NOT_REACHED();
            }
            return;
        case SIMDLane::i32x4:
            if (simdInfo.signMode == SIMDSignMode::Signed) {
                if (supportsAVX())
                    m_assembler.vpmovsxwd_rr(input, dest);
                else if (supportsSSE4_1())
                    m_assembler.pmovsxwd(input, dest);
                else
                    RELEASE_ASSERT_NOT_REACHED();
            } else {
                if (supportsAVX())
                    m_assembler.vpmovzxwd_rr(input, dest);
                else if (supportsSSE4_1())
                    m_assembler.pmovzxwd(input, dest);
                else
                    RELEASE_ASSERT_NOT_REACHED();
            }
            return;
        case SIMDLane::i64x2:
            if (simdInfo.signMode == SIMDSignMode::Signed) {
                if (supportsAVX())
                    m_assembler.vpmovsxdq_rr(input, dest);
                else if (supportsSSE4_1())
                    m_assembler.pmovsxdq(input, dest);
                else
                    RELEASE_ASSERT_NOT_REACHED();
            } else {
                if (supportsAVX())
                    m_assembler.vpmovzxdq_rr(input, dest);
                else if (supportsSSE4_1())
                    m_assembler.pmovzxdq(input, dest);
                else
                    RELEASE_ASSERT_NOT_REACHED();
            }
            return;
        default:
            RELEASE_ASSERT_NOT_REACHED();
        }
    }

    void vectorExtendHigh(SIMDInfo simdInfo, FPRegisterID input, FPRegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vunpckhpd_rrr(dest, input, dest);
        else {
            if (input != dest)
                m_assembler.movapd_rr(input, dest);
            m_assembler.shufpd_i8rr(1, dest, dest);
        }
        vectorExtendLow(simdInfo, dest, dest);
    }

    void vectorPromote(SIMDInfo simdInfo, FPRegisterID input, FPRegisterID dest)
    {
        ASSERT_UNUSED(simdInfo, simdInfo.lane == SIMDLane::f32x4);
        ASSERT(supportsAVX());
        m_assembler.vcvtps2pd_rr(input, dest);
    }

    void vectorDemote(SIMDInfo simdInfo, FPRegisterID input, FPRegisterID dest)
    {
        ASSERT_UNUSED(simdInfo, simdInfo.lane == SIMDLane::f64x2);
        ASSERT(supportsAVX());
        m_assembler.vcvtpd2ps_rr(input, dest);
    }

    void vectorNarrow(SIMDInfo simdInfo, FPRegisterID lower, FPRegisterID upper, FPRegisterID dest, FPRegisterID)
    {
        ASSERT(simdInfo.signMode != SIMDSignMode::None);
        ASSERT(scalarTypeIsIntegral(simdInfo.lane));

        switch (simdInfo.lane) {
        case SIMDLane::i16x8:
            if (simdInfo.signMode == SIMDSignMode::Signed) {
                if (supportsAVX())
                    m_assembler.vpacksswb_rrr(upper, lower, dest);
                else {
                    if (lower != dest)
                        m_assembler.movapd_rr(lower, dest);
                    m_assembler.packsswb_rr(upper, dest);
                }
            } else {
                if (supportsAVX())
                    m_assembler.vpackuswb_rrr(upper, lower, dest);
                else {
                    if (lower != dest)
                        m_assembler.movapd_rr(lower, dest);
                    m_assembler.packuswb_rr(upper, dest);
                }
            }
            return;
        case SIMDLane::i32x4:
            if (simdInfo.signMode == SIMDSignMode::Signed) {
                if (supportsAVX())
                    m_assembler.vpackssdw_rrr(upper, lower, dest);
                else {
                    if (lower != dest)
                        m_assembler.movapd_rr(lower, dest);
                    m_assembler.packssdw_rr(upper, dest);
                }
            } else {
                if (supportsAVX())
                    m_assembler.vpackusdw_rrr(upper, lower, dest);
                else if (supportsSSE4_1()) {
                    if (lower != dest)
                        m_assembler.movapd_rr(lower, dest);
                    m_assembler.packusdw_rr(upper, dest);
                } else
                    RELEASE_ASSERT_NOT_REACHED();
            }
            return;
        default:
            RELEASE_ASSERT_NOT_REACHED();
        }
    }

    void vectorConvert(SIMDInfo simdInfo, FPRegisterID input, FPRegisterID dest)
    {
        ASSERT_UNUSED(simdInfo, scalarTypeIsIntegral(simdInfo.lane));
        ASSERT(elementByteSize(simdInfo.lane) == 4);
        ASSERT(simdInfo.signMode == SIMDSignMode::Signed);
        if (supportsAVX())
            m_assembler.vcvtdq2ps_rr(input, dest);
        else
            m_assembler.cvtdq2ps_rr(input, dest);
    }

    void vectorConvertUnsigned(FPRegisterID src, FPRegisterID dst, FPRegisterID scratch)
    {
        ASSERT(supportsAVX());
        m_assembler.vpxor_rrr(scratch, scratch, scratch);           // clear scratch
        m_assembler.vpblendw_i8rrr(0x55, src, scratch, scratch);    // i_low = low 16 bits of src
        m_assembler.vpsubd_rrr(scratch, src, dst);                  // i_high = high 16 bits of src
        m_assembler.vcvtdq2ps_rr(scratch, scratch);                 // f_low = convertToF32(i_low)
        m_assembler.vpsrld_i8rr(1, dst, dst);                       // i_half_high = i_high / 2
        m_assembler.vcvtdq2ps_rr(dst, dst);                         // f_half_high = convertToF32(i_half_high)
        m_assembler.vaddps_rrr(dst, dst, dst);                      // dst = f_half_high + f_half_high + f_low
        m_assembler.vaddps_rrr(scratch, dst, dst);
    }

    void vectorConvertLowUnsignedInt32(FPRegisterID input, FPRegisterID dest, RegisterID scratchGPR, FPRegisterID scratchFPR)
    {
        // https://github.com/WebAssembly/simd/pull/383
        ASSERT(supportsAVX());
        ASSERT(scratchFPR != dest);
        constexpr uint32_t high32Bits = 0x43300000;
        alignas(16) static constexpr double masks[] = {
            0x1.0p+52,
            0x1.0p+52,
        };
        move(TrustedImm32(high32Bits), scratchGPR);
        vectorSplatInt32(scratchGPR, scratchFPR);
        m_assembler.vunpcklps_rrr(scratchFPR, input, dest);
        move(TrustedImmPtr(masks), scratchGPR);
        loadVector(Address(scratchGPR), scratchFPR);
        m_assembler.vsubpd_rrr(scratchFPR, dest, dest);
    }

    void vectorConvertLowSignedInt32(FPRegisterID input, FPRegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vcvtdq2pd_rr(input, dest);
        else
            m_assembler.cvtdq2pd_rr(input, dest);
    }

    void vectorUshl(SIMDInfo simdInfo, FPRegisterID input, FPRegisterID shift, FPRegisterID dest)
    {
        ASSERT(scalarTypeIsIntegral(simdInfo.lane));
        RELEASE_ASSERT(supportsAVX());
        switch (simdInfo.lane) {
        case SIMDLane::i8x16:
            // FIXME: 8-bit shift is awful on intel.
            break;
        case SIMDLane::i16x8:
            m_assembler.vpsllw_rrr(shift, input, dest);
            break;
        case SIMDLane::i32x4:
            m_assembler.vpslld_rrr(shift, input, dest);
            break;
        case SIMDLane::i64x2:
            m_assembler.vpsllq_rrr(shift, input, dest);
            break;
        default:
            RELEASE_ASSERT_NOT_REACHED_WITH_MESSAGE("Invalid lane kind for unsigned vector left shift.");
        }
    }

    void vectorUshl8(FPRegisterID input, FPRegisterID shift, FPRegisterID dest, FPRegisterID tmp1, FPRegisterID tmp2)
    {
        RELEASE_ASSERT(supportsAVX());

        // Unpack and zero-extend low input bytes.
        m_assembler.vxorps_rrr(tmp2, tmp2, tmp2);
        m_assembler.vpunpcklbw_rrr(input, tmp2, tmp1);

        // Word-wise shift low input bytes into tmp1.
        m_assembler.vpsllw_rrr(shift, tmp1, tmp1);

        // Unpack and zero-extend high input bytes.
        m_assembler.vpunpckhbw_rrr(input, tmp2, tmp2);

        // Word-wise shift high input bytes into tmp2.
        m_assembler.vpsllw_rrr(shift, tmp2, tmp2);

        // Mask away higher bits of left-shifted results.
        m_assembler.vpsllw_i8rr(8, tmp1, tmp1);
        m_assembler.vpsllw_i8rr(8, tmp2, tmp2);
        m_assembler.vpsrlw_i8rr(8, tmp1, tmp1);
        m_assembler.vpsrlw_i8rr(8, tmp2, tmp2);

        // Pack low and high results into destination.
        m_assembler.vpackuswb_rrr(tmp2, tmp1, dest);
    }

    void vectorUshr8(FPRegisterID input, FPRegisterID shift, FPRegisterID dest, FPRegisterID tmp1, FPRegisterID tmp2)
    {
        RELEASE_ASSERT(supportsAVX());

        // Unpack and zero-extend low input bytes.
        m_assembler.vxorps_rrr(tmp2, tmp2, tmp2);
        m_assembler.vpunpcklbw_rrr(input, tmp2, tmp1);

        // Word-wise shift low input bytes into tmp1.
        m_assembler.vpsrlw_rrr(shift, tmp1, tmp1);

        // Unpack and zero-extend high input bytes.
        m_assembler.vpunpckhbw_rrr(input, tmp2, tmp2);

        // Word-wise shift high input bytes into tmp2.
        m_assembler.vpsrlw_rrr(shift, tmp2, tmp2);

        // Pack low and high results into destination.
        m_assembler.vpackuswb_rrr(tmp2, tmp1, dest);
    }

    void vectorSshr8(FPRegisterID input, FPRegisterID shift, FPRegisterID dest, FPRegisterID tmp1, FPRegisterID tmp2)
    {
        RELEASE_ASSERT(supportsAVX());

        // Unpack and zero-extend low input bytes.
        m_assembler.vpmovsxbw_rr(input, tmp1);

        // Word-wise shift low input bytes into tmp1.
        m_assembler.vpsraw_rrr(shift, tmp1, tmp1);

        // Unpack and sign-extend high input bytes.
        m_assembler.vpshufd_i8rr(0b00001110, input, tmp2);
        m_assembler.vpmovsxbw_rr(tmp2, tmp2);

        // Word-wise shift high input bytes into tmp2.
        m_assembler.vpsraw_rrr(shift, tmp2, tmp2);

        // Pack low and high results into destination.
        m_assembler.vpacksswb_rrr(tmp2, tmp1, dest);
    }

    void vectorSshr8(SIMDInfo simdInfo, FPRegisterID input, TrustedImm32 shift, FPRegisterID dest)
    {
        RELEASE_ASSERT(scalarTypeIsIntegral(simdInfo.lane));
        RELEASE_ASSERT(simdInfo.lane != SIMDLane::i8x16);
        RELEASE_ASSERT(supportsAVX());
        switch (simdInfo.lane) {
        case SIMDLane::i16x8:
            m_assembler.vpsraw_i8rr(shift.m_value, input, dest);
            break;
        case SIMDLane::i32x4:
            m_assembler.vpsrad_i8rr(shift.m_value, input, dest);
            break;
        case SIMDLane::i64x2:
            RELEASE_ASSERT_NOT_REACHED_WITH_MESSAGE("i64x2 signed shift right is not supported natively on Intel.");
            break;
        default:
            RELEASE_ASSERT_NOT_REACHED_WITH_MESSAGE("Invalid lane kind for signed vector right shift.");
        }
    }

    void vectorUshr8(SIMDInfo simdInfo, FPRegisterID input, TrustedImm32 shift, FPRegisterID dest)
    {
        RELEASE_ASSERT(scalarTypeIsIntegral(simdInfo.lane));
        RELEASE_ASSERT(simdInfo.lane != SIMDLane::i8x16);
        RELEASE_ASSERT(supportsAVX());
        switch (simdInfo.lane) {
        case SIMDLane::i16x8:
            m_assembler.vpsrlw_i8rr(shift.m_value, input, dest);
            break;
        case SIMDLane::i32x4:
            m_assembler.vpsrld_i8rr(shift.m_value, input, dest);
            break;
        case SIMDLane::i64x2:
            m_assembler.vpsrlq_i8rr(shift.m_value, input, dest);
            break;
        default:
            RELEASE_ASSERT_NOT_REACHED_WITH_MESSAGE("Invalid lane kind for unsigned vector right shift.");
        }
    }

    void vectorUshr(SIMDInfo simdInfo, FPRegisterID input, FPRegisterID shift, FPRegisterID dest)
    {
        ASSERT(scalarTypeIsIntegral(simdInfo.lane));
        RELEASE_ASSERT(supportsAVX());
        switch (simdInfo.lane) {
        case SIMDLane::i8x16:
            // FIXME: 8-bit shift is awful on intel.
            break;
        case SIMDLane::i16x8:
            m_assembler.vpsrlw_rrr(shift, input, dest);
            break;
        case SIMDLane::i32x4:
            m_assembler.vpsrld_rrr(shift, input, dest);
            break;
        case SIMDLane::i64x2:
            m_assembler.vpsrlq_rrr(shift, input, dest);
            break;
        default:
            RELEASE_ASSERT_NOT_REACHED_WITH_MESSAGE("Invalid lane kind for unsigned vector right shift.");
        }
    }

    void vectorSshr(SIMDInfo simdInfo, FPRegisterID input, FPRegisterID shift, FPRegisterID dest)
    {
        ASSERT(scalarTypeIsIntegral(simdInfo.lane));
        RELEASE_ASSERT(supportsAVX());
        switch (simdInfo.lane) {
        case SIMDLane::i8x16:
            // FIXME: 8-bit shift is awful on intel.
            break;
        case SIMDLane::i16x8:
            m_assembler.vpsraw_rrr(shift, input, dest);
            break;
        case SIMDLane::i32x4:
            m_assembler.vpsrad_rrr(shift, input, dest);
            break;
        case SIMDLane::i64x2:
            RELEASE_ASSERT_NOT_REACHED_WITH_MESSAGE("i64x2 signed shift right is not supported natively on Intel.");
            break;
        default:
            RELEASE_ASSERT_NOT_REACHED_WITH_MESSAGE("Invalid lane kind for unsigned vector right shift.");
        }
    }

    void vectorSplatAVX(SIMDLane lane, RegisterID src, FPRegisterID dest)
    {
        m_assembler.vmovq_rr(src, dest);
        switch (lane) {
        case SIMDLane::i64x2:
            m_assembler.vmovddup_rr(dest, dest);
            return;
        case SIMDLane::i32x4:
            m_assembler.vshufps_i8rrr(0, dest, dest, dest);
            return;
        case SIMDLane::i8x16:
            vectorReplaceLane(SIMDLane::i8x16, TrustedImm32(1), src, dest);
            FALLTHROUGH;
        case SIMDLane::i16x8:
            m_assembler.vpshuflw_i8rr(0, dest, dest);
            m_assembler.vpunpcklqdq_rrr(dest, dest, dest);
            return;
        default:
            RELEASE_ASSERT_NOT_REACHED();
        }
    }

    void vectorSplat(SIMDLane lane, RegisterID src, FPRegisterID dest)
    {
        if (supportsAVX())
            return vectorSplatAVX(lane, src, dest);

        m_assembler.movq_rr(src, dest);
        switch (lane) {
        case SIMDLane::i64x2:
            if (supportsSSE3())
                m_assembler.movddup_rr(dest, dest);
            else
                m_assembler.shufpd_i8rr(0, dest, dest);
            return;
        case SIMDLane::i32x4:
            m_assembler.shufps_i8rr(0, dest, dest);
            return;
        case SIMDLane::i8x16:
            vectorReplaceLane(SIMDLane::i8x16, TrustedImm32(1), src, dest);
            FALLTHROUGH;
        case SIMDLane::i16x8:
            m_assembler.pshuflw_i8rr(0, dest, dest);
            m_assembler.punpcklqdq_rr(dest, dest);
            return;
        default:
            RELEASE_ASSERT_NOT_REACHED();
        }
    }

    void vectorSplatAVX(SIMDLane lane, FPRegisterID src, FPRegisterID dest)
    {
        switch (lane) {
        case SIMDLane::f32x4:
            if (src != dest)
                m_assembler.vpshufd_i8rr(0, src, dest);
            else {
                ASSERT(src == dest);
                m_assembler.vshufps_i8rrr(0, dest, dest, dest);
            }
            return;
        case SIMDLane::f64x2:
            m_assembler.vmovddup_rr(src, dest);
            return;
        default:
            RELEASE_ASSERT_NOT_REACHED();
        }
    }

    void vectorSplat(SIMDLane lane, FPRegisterID src, FPRegisterID dest)
    {
        if (supportsAVX())
            return vectorSplatAVX(lane, src, dest);

        switch (lane) {
        case SIMDLane::f32x4:
            if (src != dest)
                m_assembler.pshufd_i8rr(0, src, dest);
            else {
                ASSERT(src == dest);
                m_assembler.shufps_i8rr(0, dest, dest);
            }
            return;
        case SIMDLane::f64x2:
            if (supportsSSE3())
                m_assembler.movddup_rr(src, dest);
            else {
                if (src != dest)
                    m_assembler.movapd_rr(src, dest);
                m_assembler.shufpd_i8rr(0, dest, dest);
            }
            return;
        default:
            RELEASE_ASSERT_NOT_REACHED();
        }
    }

    void vectorSplatInt8(RegisterID src, FPRegisterID dest) { vectorSplat(SIMDLane::i8x16, src, dest); }
    void vectorSplatInt16(RegisterID src, FPRegisterID dest) { vectorSplat(SIMDLane::i16x8, src, dest); }
    void vectorSplatInt32(RegisterID src, FPRegisterID dest) { vectorSplat(SIMDLane::i32x4, src, dest); }
    void vectorSplatInt64(RegisterID src, FPRegisterID dest) { vectorSplat(SIMDLane::i64x2, src, dest); }
    void vectorSplatFloat32(FPRegisterID src, FPRegisterID dest) { vectorSplat(SIMDLane::f32x4, src, dest); }
    void vectorSplatFloat64(FPRegisterID src, FPRegisterID dest) { vectorSplat(SIMDLane::f64x2, src, dest); }

    void vectorAddSat(SIMDInfo simdInfo, FPRegisterID left, FPRegisterID right, FPRegisterID dest)
    {
        ASSERT(simdInfo.signMode != SIMDSignMode::None);

        switch (simdInfo.lane) {
        case SIMDLane::i8x16:
            if (supportsAVX()) {
                if (simdInfo.signMode == SIMDSignMode::Signed)
                    m_assembler.vpaddsb_rrr(right, left, dest);
                else
                    m_assembler.vpaddusb_rrr(right, left, dest);
            } else {
                if (left != dest)
                    m_assembler.movapd_rr(left, dest);
                if (simdInfo.signMode == SIMDSignMode::Signed)
                    m_assembler.paddsb_rr(right, dest);
                else
                    m_assembler.paddusb_rr(right, dest);
            }
            return;
        case SIMDLane::i16x8:
            if (supportsAVX()) {
                if (simdInfo.signMode == SIMDSignMode::Signed)
                    m_assembler.vpaddsw_rrr(right, left, dest);
                else
                    m_assembler.vpaddusw_rrr(right, left, dest);
            } else {
                if (left != dest)
                    m_assembler.movapd_rr(left, dest);
                if (simdInfo.signMode == SIMDSignMode::Signed)
                    m_assembler.paddsw_rr(right, dest);
                else
                    m_assembler.paddusw_rr(right, dest);
            }
            return;
        default:
            RELEASE_ASSERT_NOT_REACHED();
        }
    }

    void vectorSubSat(SIMDInfo simdInfo, FPRegisterID left, FPRegisterID right, FPRegisterID dest)
    {
        ASSERT(scalarTypeIsIntegral(simdInfo.lane));

        switch (simdInfo.lane) {
        case SIMDLane::i8x16:
            if (supportsAVX()) {
                if (simdInfo.signMode == SIMDSignMode::Signed)
                    m_assembler.vpsubsb_rrr(right, left, dest);
                else
                    m_assembler.vpsubusb_rrr(right, left, dest);
            } else {
                if (left != dest)
                    m_assembler.movapd_rr(left, dest);
                if (simdInfo.signMode == SIMDSignMode::Signed)
                    m_assembler.psubsb_rr(right, dest);
                else
                    m_assembler.psubusb_rr(right, dest);
            }
            return;
        case SIMDLane::i16x8:
            if (supportsAVX()) {
                if (simdInfo.signMode == SIMDSignMode::Signed)
                    m_assembler.vpsubsw_rrr(right, left, dest);
                else
                    m_assembler.vpsubusw_rrr(right, left, dest);
            } else {
                if (left != dest)
                    m_assembler.movapd_rr(left, dest);
                if (simdInfo.signMode == SIMDSignMode::Signed)
                    m_assembler.psubsw_rr(right, dest);
                else
                    m_assembler.psubusw_rr(right, dest);
            }
            return;
        default:
            RELEASE_ASSERT_NOT_REACHED();
        }
    }

    void vectorLoad8Splat(Address address, FPRegisterID dest, FPRegisterID scratch)
    {
        ASSERT(supportsAVX());
        m_assembler.vpinsrb_i8mrr(0, address.offset, address.base, dest, dest);
        m_assembler.vpxor_rrr(scratch, scratch, scratch);
        m_assembler.vpshufb_rrr(scratch, dest, dest);
    }

    void vectorLoad16Splat(Address address, FPRegisterID dest)
    {
        ASSERT(supportsAVX());
        m_assembler.vpinsrw_i8mrr(0, address.offset, address.base, dest, dest);
        m_assembler.vpshuflw_i8rr(0, dest, dest);
        m_assembler.vpunpcklqdq_rrr(dest, dest, dest);
    }

    void vectorLoad32Splat(Address address, FPRegisterID dest)
    {
        ASSERT(supportsAVX());
        m_assembler.vbroadcastss_mr(address.offset, address.base, dest);
    }

    void vectorLoad64Splat(Address address, FPRegisterID dest)
    {
        ASSERT(supportsAVX());
        m_assembler.vmovddup_mr(address.offset, address.base, dest);
    }

    void vectorLoad8Lane(Address address, TrustedImm32 imm, FPRegisterID dest)
    {
        ASSERT(supportsAVX());
        m_assembler.vpinsrb_i8mrr(imm.m_value, address.offset, address.base, dest, dest);
    }

    void vectorLoad16Lane(Address address, TrustedImm32 imm, FPRegisterID dest)
    {
        ASSERT(supportsAVX());
        m_assembler.vpinsrw_i8mrr(imm.m_value, address.offset, address.base, dest, dest);
    }

    void vectorLoad32Lane(Address address, TrustedImm32 imm, FPRegisterID dest)
    {
        ASSERT(supportsAVX());
        m_assembler.vpinsrd_i8mrr(imm.m_value, address.offset, address.base, dest, dest);
    }

    void vectorLoad64Lane(Address address, TrustedImm32 imm, FPRegisterID dest)
    {
        ASSERT(supportsAVX());
        m_assembler.vpinsrq_i8mrr(imm.m_value, address.offset, address.base, dest, dest);
    }

    void vectorStore8Lane(FPRegisterID src, Address address, TrustedImm32 imm)
    {
        ASSERT(supportsAVX());
        m_assembler.vpextrb_i8rm(imm.m_value, src, address.base, address.offset);
    }

    void vectorStore16Lane(FPRegisterID src, Address address, TrustedImm32 imm)
    {
        ASSERT(supportsAVX());
        m_assembler.vpextrw_i8rm(imm.m_value, src, address.base, address.offset);
    }

    void vectorStore32Lane(FPRegisterID src, Address address, TrustedImm32 imm)
    {
        ASSERT(supportsAVX());
        m_assembler.vpextrd_i8rm(imm.m_value, src, address.base, address.offset);
    }

    void vectorStore64Lane(FPRegisterID src, Address address, TrustedImm32 imm)
    {
        ASSERT(supportsAVX());
        m_assembler.vpextrq_i8rm(imm.m_value, src, address.base, address.offset);
    }

    void vectorAnyTrue(FPRegisterID vec, RegisterID dest)
    {
        RELEASE_ASSERT(supportsAVX());
        m_assembler.vptest_rr(vec, vec);
        m_assembler.setCC_r(x86Condition(NonZero), dest);
        m_assembler.movzbl_rr(dest, dest);
    }

    void vectorAllTrue(SIMDInfo simdInfo, FPRegisterID vec, RegisterID dest, FPRegisterID scratch)
    {
        RELEASE_ASSERT(supportsAVX());

        m_assembler.vpxor_rrr(scratch, scratch, scratch); // Zero scratch register.
        switch (simdInfo.lane) {
        case SIMDLane::i8x16:
            m_assembler.vpcmpeqb_rrr(vec, scratch, scratch);
            break;
        case SIMDLane::i16x8:
            m_assembler.vpcmpeqw_rrr(vec, scratch, scratch);
            break;
        case SIMDLane::i32x4:
            m_assembler.vpcmpeqd_rrr(vec, scratch, scratch);
            break;
        case SIMDLane::i64x2:
            m_assembler.vpcmpeqq_rrr(vec, scratch, scratch);
            break;
        default:
            RELEASE_ASSERT_NOT_REACHED_WITH_MESSAGE("Invalid SIMD lane for vector all-true.");
        }
        m_assembler.vptest_rr(scratch, scratch);
        m_assembler.setCC_r(x86Condition(RelationalCondition::Equal), dest);
        m_assembler.movzbl_rr(dest, dest);
    }

    void vectorBitmask(SIMDInfo simdInfo, FPRegisterID vec, RegisterID dest, FPRegisterID tmp)
    {
        RELEASE_ASSERT(supportsAVX());

        switch (simdInfo.lane) {
        case SIMDLane::i8x16:
            m_assembler.vpmovmskb_rr(vec, dest);
            break;
        case SIMDLane::i16x8:
            m_assembler.vpxor_rrr(tmp, tmp, tmp);
            m_assembler.vpacksswb_rrr(tmp, vec, tmp);
            m_assembler.vpmovmskb_rr(tmp, dest);
            break;
        case SIMDLane::i32x4:
            m_assembler.vmovmskps_rr(vec, dest);
            break;
        case SIMDLane::i64x2:
            m_assembler.vmovmskpd_rr(vec, dest);
            break;
        default:
            RELEASE_ASSERT_NOT_REACHED_WITH_MESSAGE("Invalid SIMD lane for vector bitmask.");
        }
    }

    void vectorExtaddPairwise(SIMDInfo simdInfo, FPRegisterID vec, FPRegisterID dest, RegisterID scratchGPR, FPRegisterID scratchFPR)
    {
        RELEASE_ASSERT(supportsAVX());

        // https://github.com/WebAssembly/simd/pull/380
        move(TrustedImm64(1), scratchGPR);
        switch (simdInfo.lane) {
        case SIMDLane::i8x16:
            vectorSplatInt8(scratchGPR, scratchFPR);
            if (simdInfo.signMode == SIMDSignMode::Signed)
                m_assembler.vpmaddubsw_rrr(vec, scratchFPR, dest);
            else
                m_assembler.vpmaddubsw_rrr(scratchFPR, vec, dest);
            return;
        case SIMDLane::i16x8:
            vectorSplatInt16(scratchGPR, scratchFPR);
            if (simdInfo.signMode == SIMDSignMode::Signed)
                m_assembler.vpmaddwd_rrr(vec, scratchFPR, dest);
            else
                RELEASE_ASSERT_NOT_REACHED();
            return;
        default:
            RELEASE_ASSERT_NOT_REACHED();
        }
    }

    void vectorExtaddPairwiseUnsignedInt16(FPRegisterID src, FPRegisterID dest, FPRegisterID scratch)
    {
        RELEASE_ASSERT(supportsAVX());
        // It can be src == dest.
        ASSERT(dest != scratch);
        ASSERT(src != scratch);
        m_assembler.vpsrld_i8rr(16, src, scratch);
        m_assembler.vpblendw_i8rrr(0xAA, scratch, src, dest);
        m_assembler.vpaddd_rrr(scratch, dest, dest);
    }

    void vectorAvgRound(SIMDInfo simdInfo, FPRegisterID a, FPRegisterID b, FPRegisterID dest)
    {
        switch (simdInfo.lane) {
        case SIMDLane::i8x16:
            if (supportsAVX())
                m_assembler.vpavgb_rrr(b, a, dest);
            else {
                if (a != dest)
                    m_assembler.movapd_rr(a, dest);
                m_assembler.pavgb_rr(b, dest);
            }
            return;
        case SIMDLane::i16x8:
            if (supportsAVX())
                m_assembler.vpavgw_rrr(b, a, dest);
            else {
                if (a != dest)
                    m_assembler.movapd_rr(a, dest);
                m_assembler.pavgw_rr(b, dest);
            }
            return;
        default:
            RELEASE_ASSERT_NOT_REACHED();
        }
    }

    void vectorMulSat(FPRegisterID a, FPRegisterID b, FPRegisterID dest, RegisterID scratchGPR, FPRegisterID scratchFPR)
    {
        // https://github.com/WebAssembly/simd/pull/365
        if (supportsAVX()) {
            m_assembler.vpmulhrsw_rrr(b, a, dest);
            m_assembler.movq_i64r(0x8000, scratchGPR);
            vectorSplat(SIMDLane::i16x8, scratchGPR, scratchFPR);
            m_assembler.vpcmpeqw_rrr(scratchFPR, dest, scratchFPR);
            m_assembler.vpxor_rrr(scratchFPR, dest, dest);
        } else if (supportsSupplementalSSE3())
            RELEASE_ASSERT_NOT_REACHED();
        else
            RELEASE_ASSERT_NOT_REACHED();
    }

    void vectorSwizzle(FPRegisterID a, FPRegisterID b, FPRegisterID dest)
    {
        if (supportsAVX())
            m_assembler.vpshufb_rrr(b, a, dest);
        else {
            if (a != dest)
                m_assembler.movapd_rr(a, dest);
            m_assembler.pshufb_rr(b, dest);
        }
    }

    void vectorDotProduct(FPRegisterID a, FPRegisterID b, FPRegisterID dest)
    {
        RELEASE_ASSERT(supportsAVX());
        m_assembler.vpmaddwd_rrr(b, a, dest);
    }

    void convertDoubleToFloat16(FPRegisterID src, FPRegisterID dest)
    {
        UNUSED_PARAM(src);
        UNUSED_PARAM(dest);
        UNREACHABLE_FOR_PLATFORM();
    }

    void convertFloat16ToDouble(FPRegisterID src, FPRegisterID dest)
    {
        UNUSED_PARAM(src);
        UNUSED_PARAM(dest);
        UNREACHABLE_FOR_PLATFORM();
    }

    void loadFloat16(Address address, FPRegisterID dest)
    {
        UNUSED_PARAM(address);
        UNUSED_PARAM(dest);
        UNREACHABLE_FOR_PLATFORM();
    }

    void loadFloat16(BaseIndex address, FPRegisterID dest)
    {
        UNUSED_PARAM(address);
        UNUSED_PARAM(dest);
        UNREACHABLE_FOR_PLATFORM();
    }

    void loadFloat16(TrustedImmPtr address, FPRegisterID dest)
    {
        UNUSED_PARAM(address);
        UNUSED_PARAM(dest);
        UNREACHABLE_FOR_PLATFORM();
    }

    void moveZeroToFloat16(FPRegisterID reg)
    {
        UNUSED_PARAM(reg);
        UNREACHABLE_FOR_PLATFORM();
    }

    void move16ToFloat16(RegisterID src, FPRegisterID dest)
    {
        UNUSED_PARAM(src);
        UNUSED_PARAM(dest);
        UNREACHABLE_FOR_PLATFORM();
    }

    void move16ToFloat16(TrustedImm32 imm, FPRegisterID dest)
    {
        UNUSED_PARAM(imm);
        UNUSED_PARAM(dest);
        UNREACHABLE_FOR_PLATFORM();
    }

    void moveFloat16To16(FPRegisterID src, RegisterID dest)
    {
        UNUSED_PARAM(src);
        UNUSED_PARAM(dest);
        UNREACHABLE_FOR_PLATFORM();
    }

    void storeFloat16(FPRegisterID src, Address address)
    {
        UNUSED_PARAM(src);
        UNUSED_PARAM(address);
        UNREACHABLE_FOR_PLATFORM();
    }

    void storeFloat16(FPRegisterID src, BaseIndex address)
    {
        UNUSED_PARAM(src);
        UNUSED_PARAM(address);
        UNREACHABLE_FOR_PLATFORM();
    }

    // Misc helper functions.

    static bool supportsFloatingPoint() { return true; }
    static bool supportsFloatingPointTruncate() { return true; }
    static bool supportsFloatingPointSqrt() { return true; }
    static bool supportsFloatingPointAbs() { return true; }
    static bool supportsFloat16() { return false; }

    template<PtrTag resultTag, PtrTag locationTag>
    static CodePtr<resultTag> readCallTarget(CodeLocationCall<locationTag> call)
    {
        return CodePtr<resultTag>(X86Assembler::readPointer(call.dataLabelPtrAtOffset(-REPATCH_OFFSET_CALL_R11).dataLocation()));
    }

    bool haveScratchRegisterForBlinding() { return m_allowScratchRegister; }
    RegisterID scratchRegisterForBlinding() { return scratchRegister(); }

    static bool canJumpReplacePatchableBranchPtrWithPatch() { return true; }
    static bool canJumpReplacePatchableBranch32WithPatch() { return true; }

    template<PtrTag tag>
    static CodeLocationLabel<tag> startOfBranchPtrWithPatchOnRegister(CodeLocationDataLabelPtr<tag> label)
    {
        const int rexBytes = 1;
        const int opcodeBytes = 1;
        const int immediateBytes = 8;
        const int totalBytes = rexBytes + opcodeBytes + immediateBytes;
        ASSERT(totalBytes >= maxJumpReplacementSize());
        return label.labelAtOffset(-totalBytes);
    }

    template<PtrTag tag>
    static CodeLocationLabel<tag> startOfBranch32WithPatchOnRegister(CodeLocationDataLabel32<tag> label)
    {
        const int rexBytes = 1;
        const int opcodeBytes = 1;
        const int immediateBytes = 4;
        const int totalBytes = rexBytes + opcodeBytes + immediateBytes;
        ASSERT(totalBytes >= maxJumpReplacementSize());
        return label.labelAtOffset(-totalBytes);
    }

    template<PtrTag tag>
    static CodeLocationLabel<tag> startOfPatchableBranchPtrWithPatchOnAddress(CodeLocationDataLabelPtr<tag> label)
    {
        return startOfBranchPtrWithPatchOnRegister(label);
    }

    template<PtrTag tag>
    static CodeLocationLabel<tag> startOfPatchableBranch32WithPatchOnAddress(CodeLocationDataLabel32<tag> label)
    {
        return startOfBranch32WithPatchOnRegister(label);
    }

    template<PtrTag tag>
    static void revertJumpReplacementToPatchableBranchPtrWithPatch(CodeLocationLabel<tag> instructionStart, Address, void* initialValue)
    {
        X86Assembler::revertJumpTo_movq_i64r(instructionStart.taggedPtr(), reinterpret_cast<intptr_t>(initialValue), s_scratchRegister);
    }

    template<PtrTag tag>
    static void revertJumpReplacementToPatchableBranch32WithPatch(CodeLocationLabel<tag> instructionStart, Address, int32_t initialValue)
    {
        X86Assembler::revertJumpTo_movl_i32r(instructionStart.taggedPtr(), initialValue, s_scratchRegister);
    }

    template<PtrTag tag>
    static void revertJumpReplacementToBranchPtrWithPatch(CodeLocationLabel<tag> instructionStart, RegisterID, void* initialValue)
    {
        X86Assembler::revertJumpTo_movq_i64r(instructionStart.taggedPtr(), reinterpret_cast<intptr_t>(initialValue), s_scratchRegister);
    }

    template<PtrTag callTag, PtrTag destTag>
    static void repatchCall(CodeLocationCall<callTag> call, CodeLocationLabel<destTag> destination)
    {
        X86Assembler::repatchPointer(call.dataLabelPtrAtOffset(-REPATCH_OFFSET_CALL_R11).dataLocation(), destination.taggedPtr());
    }

    template<PtrTag callTag, PtrTag destTag>
    static void repatchCall(CodeLocationCall<callTag> call, CodePtr<destTag> destination)
    {
        X86Assembler::repatchPointer(call.dataLabelPtrAtOffset(-REPATCH_OFFSET_CALL_R11).dataLocation(), destination.taggedPtr());
    }

    using CPUID = std::array<unsigned, 4>;
    static CPUID getCPUID(unsigned level);
    static CPUID getCPUIDEx(unsigned level, unsigned count);
    JS_EXPORT_PRIVATE static void collectCPUFeatures();

    JS_EXPORT_PRIVATE static CPUIDCheckState s_sse3CheckState;
    JS_EXPORT_PRIVATE static CPUIDCheckState s_supplementalSSE3CheckState;
    JS_EXPORT_PRIVATE static CPUIDCheckState s_sse4_1CheckState;
    JS_EXPORT_PRIVATE static CPUIDCheckState s_sse4_2CheckState;
    JS_EXPORT_PRIVATE static CPUIDCheckState s_avxCheckState;
    JS_EXPORT_PRIVATE static CPUIDCheckState s_avx2CheckState;
    JS_EXPORT_PRIVATE static CPUIDCheckState s_lzcntCheckState;
    JS_EXPORT_PRIVATE static CPUIDCheckState s_bmi1CheckState;
    JS_EXPORT_PRIVATE static CPUIDCheckState s_popcntCheckState;

private:
    // If lzcnt is not available, use this after BSR
    // to count the leading zeros.
    void clz64AfterBsr(RegisterID dst)
    {
        Jump srcIsNonZero = m_assembler.jCC(x86Condition(NonZero));
        move(TrustedImm32(64), dst);

        Jump skipNonZeroCase = jump();
        srcIsNonZero.link(this);
        xor64(TrustedImm32(0x3f), dst);
        skipNonZeroCase.link(this);
    }

    friend class LinkBuffer;

    template<PtrTag tag>
    static void linkCall(void* code, Call call, CodePtr<tag> function)
    {
        if (!call.isFlagSet(Call::Near))
            X86Assembler::linkPointer(code, call.m_label.labelAtOffset(-REPATCH_OFFSET_CALL_R11), function.taggedPtr());
        else if (call.isFlagSet(Call::Tail))
            X86Assembler::linkJump(code, call.m_label, function.taggedPtr());
        else
            X86Assembler::linkCall(code, call.m_label, function.taggedPtr());
    }
};

} // namespace JSC

#endif // ENABLE(ASSEMBLER)
