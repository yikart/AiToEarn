/*
 * Copyright (C) 2012-2024 Apple Inc. All rights reserved.
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

#if ENABLE(ASSEMBLER) && CPU(ARM64)

#include "ARM64Assembler.h"
#include "AbstractMacroAssembler.h"
#include "JITOperationValidation.h"
#include <wtf/MathExtras.h>
#include <wtf/StdLibExtras.h>
#include <wtf/TZoneMalloc.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

using Assembler = TARGET_ASSEMBLER;
class Reg;

class MacroAssemblerARM64 : public AbstractMacroAssembler<Assembler> {
    WTF_MAKE_TZONE_ALLOCATED(MacroAssemblerARM64);
public:
    static constexpr unsigned numGPRs = 32;
    static constexpr unsigned numFPRs = 32;

    static constexpr size_t nearJumpRange = 128 * MB;

    static constexpr RegisterID dataTempRegister = ARM64Registers::ip0;
    static constexpr RegisterID memoryTempRegister = ARM64Registers::ip1;

    static constexpr RegisterID InvalidGPRReg = ARM64Registers::InvalidGPRReg;

    static constexpr ARM64Registers::FPRegisterID fpTempRegister = ARM64Registers::q31;

    RegisterID scratchRegister()
    {
        RELEASE_ASSERT(m_allowScratchRegister);
        return getCachedDataTempRegisterIDAndInvalidate();
    }

protected:
    static constexpr Assembler::SetFlags S = Assembler::S;
    static constexpr int64_t maskHalfWord0 = 0xffffl;
    static constexpr int64_t maskHalfWord1 = 0xffff0000l;
    static constexpr int64_t maskUpperWord = 0xffffffff00000000l;

    static constexpr size_t INSTRUCTION_SIZE = 4;

    // N instructions to load the pointer + 1 call instruction.
    static constexpr ptrdiff_t REPATCH_OFFSET_CALL_TO_POINTER = -((Assembler::NUMBER_OF_ADDRESS_ENCODING_INSTRUCTIONS + 1) * INSTRUCTION_SIZE);

public:
    MacroAssemblerARM64()
        : m_dataMemoryTempRegister(this, dataTempRegister)
        , m_cachedMemoryTempRegister(this, memoryTempRegister)
        , m_makeJumpPatchable(false)
    {
    }

    typedef Assembler::LinkRecord LinkRecord;
    typedef Assembler::JumpType JumpType;
    typedef Assembler::JumpLinkType JumpLinkType;
    typedef Assembler::Condition Condition;

    static constexpr Assembler::Condition DefaultCondition = Assembler::ConditionInvalid;
    static constexpr Assembler::JumpType DefaultJump = Assembler::JumpNoConditionFixedSize;

    Vector<LinkRecord, 0, UnsafeVectorOverflow>& jumpsToLink() { return m_assembler.jumpsToLink(); }
    static bool canCompact(JumpType jumpType) { return Assembler::canCompact(jumpType); }
    static JumpLinkType computeJumpType(LinkRecord& record, const uint8_t* from, const uint8_t* to) { return Assembler::computeJumpType(record, from, to); }
    static int jumpSizeDelta(JumpType jumpType, JumpLinkType jumpLinkType) { return Assembler::jumpSizeDelta(jumpType, jumpLinkType); }

    template<MachineCodeCopyMode copy>
    ALWAYS_INLINE static void link(LinkRecord& record, uint8_t* from, const uint8_t* fromInstruction, uint8_t* to) { return Assembler::link<copy>(record, from, fromInstruction, to); }

    static bool isCompactPtrAlignedAddressOffset(ptrdiff_t value)
    {
        // This is the largest 32-bit access allowed, aligned to 64-bit boundary.
        return !(value & ~0x3ff8);
    }

    enum RelationalCondition {
        Equal = Assembler::ConditionEQ,
        NotEqual = Assembler::ConditionNE,
        Above = Assembler::ConditionHI,
        AboveOrEqual = Assembler::ConditionHS,
        Below = Assembler::ConditionLO,
        BelowOrEqual = Assembler::ConditionLS,
        GreaterThan = Assembler::ConditionGT,
        GreaterThanOrEqual = Assembler::ConditionGE,
        LessThan = Assembler::ConditionLT,
        LessThanOrEqual = Assembler::ConditionLE
    };

    enum ResultCondition {
        Carry = Assembler::ConditionCS,
        Overflow = Assembler::ConditionVS,
        Signed = Assembler::ConditionMI,
        PositiveOrZero = Assembler::ConditionPL,
        Zero = Assembler::ConditionEQ,
        NonZero = Assembler::ConditionNE
    };

    enum ZeroCondition {
        IsZero = Assembler::ConditionEQ,
        IsNonZero = Assembler::ConditionNE
    };

    enum DoubleCondition {
        // These conditions will only evaluate to true if the comparison is ordered - i.e. neither operand is NaN.
        DoubleEqualAndOrdered = Assembler::ConditionEQ,
        DoubleNotEqualAndOrdered = Assembler::ConditionVC, // Not the right flag! check for this & handle differently.
        DoubleGreaterThanAndOrdered = Assembler::ConditionGT,
        DoubleGreaterThanOrEqualAndOrdered = Assembler::ConditionGE,
        DoubleLessThanAndOrdered = Assembler::ConditionLO,
        DoubleLessThanOrEqualAndOrdered = Assembler::ConditionLS,
        // If either operand is NaN, these conditions always evaluate to true.
        DoubleEqualOrUnordered = Assembler::ConditionVS, // Not the right flag! check for this & handle differently.
        DoubleNotEqualOrUnordered = Assembler::ConditionNE,
        DoubleGreaterThanOrUnordered = Assembler::ConditionHI,
        DoubleGreaterThanOrEqualOrUnordered = Assembler::ConditionHS,
        DoubleLessThanOrUnordered = Assembler::ConditionLT,
        DoubleLessThanOrEqualOrUnordered = Assembler::ConditionLE,
    };

    static constexpr RegisterID stackPointerRegister = ARM64Registers::sp;
    static constexpr RegisterID framePointerRegister = ARM64Registers::fp;
    static constexpr RegisterID linkRegister = ARM64Registers::lr;

    // FIXME: Get reasonable implementations for these
    static bool constexpr shouldBlindForSpecificArch(uint32_t value) { return value >= 0x00ffffff; }
    static bool constexpr shouldBlindForSpecificArch(uint64_t value) { return value >= 0x00ffffff; }

    // Integer operations:

    void add32(RegisterID a, RegisterID b, RegisterID dest)
    {
        ASSERT(a != ARM64Registers::sp || b != ARM64Registers::sp);
        if (b == ARM64Registers::sp)
            std::swap(a, b);
        m_assembler.add<32>(dest, a, b);
    }

    void add32(RegisterID src, RegisterID dest)
    {
        if (src == ARM64Registers::sp)
            m_assembler.add<32>(dest, src, dest);
        else
            m_assembler.add<32>(dest, dest, src);
    }

    void add32(TrustedImm32 imm, RegisterID dest)
    {
        add32(imm, dest, dest);
    }

    void add32(TrustedImm32 imm, RegisterID src, RegisterID dest)
    {
        auto immediate = imm.m_value;
        if (auto tuple = tryExtractShiftedImm(immediate)) {
            auto [u12, shift, inverted] = tuple.value();
            if (!inverted)
                m_assembler.add<32>(dest, src, u12, shift);
            else
                m_assembler.sub<32>(dest, src, u12, shift);
            return;
        }

        if (src != dest) {
            move(imm, dest);
            add32(src, dest);
        } else {
            move(imm, getCachedDataTempRegisterIDAndInvalidate());
            m_assembler.add<32>(dest, src, dataTempRegister);
        }
    }

    void add32(TrustedImm32 imm, Address address)
    {
        load32(address, getCachedDataTempRegisterIDAndInvalidate());

        auto immediate = imm.m_value;
        if (auto tuple = tryExtractShiftedImm(immediate)) {
            auto [u12, shift, inverted] = tuple.value();
            if (!inverted)
                m_assembler.add<32>(dataTempRegister, dataTempRegister, u12, shift);
            else
                m_assembler.sub<32>(dataTempRegister, dataTempRegister, u12, shift);
        } else {
            move(imm, getCachedMemoryTempRegisterIDAndInvalidate());
            m_assembler.add<32>(dataTempRegister, dataTempRegister, memoryTempRegister);
        }
        store32(dataTempRegister, address);
    }

    void add32(TrustedImm32 imm, AbsoluteAddress address)
    {
        load32(address.m_ptr, getCachedDataTempRegisterIDAndInvalidate());

        auto immediate = imm.m_value;
        if (auto tuple = tryExtractShiftedImm(immediate)) {
            auto [u12, shift, inverted] = tuple.value();
            if (!inverted)
                m_assembler.add<32>(dataTempRegister, dataTempRegister, u12, shift);
            else
                m_assembler.sub<32>(dataTempRegister, dataTempRegister, u12, shift);
        } else {
            move(imm, getCachedMemoryTempRegisterIDAndInvalidate());
            m_assembler.add<32>(dataTempRegister, dataTempRegister, memoryTempRegister);
        }
        store32(dataTempRegister, address.m_ptr);
    }

    void add32(Address src, RegisterID dest)
    {
        load32(src, getCachedDataTempRegisterIDAndInvalidate());
        add32(dataTempRegister, dest);
    }

    void add32(AbsoluteAddress src, RegisterID dest)
    {
        load32(src.m_ptr, getCachedDataTempRegisterIDAndInvalidate());
        add32(dataTempRegister, dest);
    }

    void add64(RegisterID a, RegisterID b, RegisterID dest)
    {
        ASSERT(a != ARM64Registers::sp || b != ARM64Registers::sp);
        if (b == ARM64Registers::sp)
            std::swap(a, b);
        m_assembler.add<64>(dest, a, b);
    }

    void add64(RegisterID src, RegisterID dest)
    {
        if (src == ARM64Registers::sp)
            m_assembler.add<64>(dest, src, dest);
        else
            m_assembler.add<64>(dest, dest, src);
    }

    void add64(TrustedImm32 imm, RegisterID dest)
    {
        add64(imm, dest, dest);
    }

    void add64(TrustedImm64 imm, RegisterID dest)
    {
        add64(imm, dest, dest);
    }

    void add64(TrustedImm32 imm, RegisterID src, RegisterID dest)
    {
        auto immediate = imm.m_value;
        if (auto tuple = tryExtractShiftedImm(immediate)) {
            auto [u12, shift, inverted] = tuple.value();
            if (!inverted)
                m_assembler.add<64>(dest, src, u12, shift);
            else
                m_assembler.sub<64>(dest, src, u12, shift);
        } else {
            signExtend32ToPtr(imm, getCachedDataTempRegisterIDAndInvalidate());
            m_assembler.add<64>(dest, src, dataTempRegister);
        }
    }

    void add64(TrustedImm64 imm, RegisterID src, RegisterID dest)
    {
        auto immediate = imm.m_value;
        if (auto tuple = tryExtractShiftedImm(immediate)) {
            auto [u12, shift, inverted] = tuple.value();
            if (!inverted)
                m_assembler.add<64>(dest, src, u12, shift);
            else
                m_assembler.sub<64>(dest, src, u12, shift);
        } else {
            move(imm, getCachedDataTempRegisterIDAndInvalidate());
            m_assembler.add<64>(dest, src, dataTempRegister);
        }
    }

    void add64(TrustedImm32 imm, Address address)
    {
        load64(address, getCachedDataTempRegisterIDAndInvalidate());

        auto immediate = imm.m_value;
        if (auto tuple = tryExtractShiftedImm(immediate)) {
            auto [u12, shift, inverted] = tuple.value();
            if (!inverted)
                m_assembler.add<64>(dataTempRegister, dataTempRegister, u12, shift);
            else
                m_assembler.sub<64>(dataTempRegister, dataTempRegister, u12, shift);
        } else {
            signExtend32ToPtr(imm, getCachedMemoryTempRegisterIDAndInvalidate());
            m_assembler.add<64>(dataTempRegister, dataTempRegister, memoryTempRegister);
        }
        store64(dataTempRegister, address);
    }

    void add64(TrustedImm32 imm, AbsoluteAddress address)
    {
        load64(address.m_ptr, getCachedDataTempRegisterIDAndInvalidate());

        auto immediate = imm.m_value;
        if (auto tuple = tryExtractShiftedImm(immediate)) {
            auto [u12, shift, inverted] = tuple.value();
            if (!inverted)
                m_assembler.add<64>(dataTempRegister, dataTempRegister, u12, shift);
            else
                m_assembler.sub<64>(dataTempRegister, dataTempRegister, u12, shift);
        } else {
            signExtend32ToPtr(imm, getCachedMemoryTempRegisterIDAndInvalidate());
            m_assembler.add<64>(dataTempRegister, dataTempRegister, memoryTempRegister);
        }
        store64(dataTempRegister, address.m_ptr);
    }

    void addZeroExtend64(RegisterID src, RegisterID srcExtend, RegisterID dest)
    {
        ASSERT(srcExtend != ARM64Registers::sp);
        m_assembler.add<64>(dest, src, srcExtend, Assembler::UXTW, 0);
    }

    void addSignExtend64(RegisterID src, RegisterID srcExtend, RegisterID dest)
    {
        ASSERT(srcExtend != ARM64Registers::sp);
        m_assembler.add<64>(dest, src, srcExtend, Assembler::SXTW, 0);
    }

    void addPtrNoFlags(TrustedImm32 imm, RegisterID srcDest)
    {
        add64(imm, srcDest);
    }

    void add64(Address src, RegisterID dest)
    {
        load64(src, getCachedDataTempRegisterIDAndInvalidate());
        m_assembler.add<64>(dest, dest, dataTempRegister);
    }

    void add64(RegisterID src, Address dest)
    {
        load64(dest, getCachedDataTempRegisterIDAndInvalidate());
        m_assembler.add<64>(src, dataTempRegister, dataTempRegister);
        store64(dataTempRegister, dest);
    }

    void add64(AbsoluteAddress src, RegisterID dest)
    {
        load64(src.m_ptr, getCachedDataTempRegisterIDAndInvalidate());
        m_assembler.add<64>(dest, dest, dataTempRegister);
    }

    void add8(TrustedImm32 imm, Address address)
    {
        load8(address, getCachedMemoryTempRegisterIDAndInvalidate());
        add32(imm, memoryTempRegister, getCachedDataTempRegisterIDAndInvalidate());
        store8(dataTempRegister, address);
    }

    void and32(RegisterID src, RegisterID dest)
    {
        and32(dest, src, dest);
    }

    void and32(RegisterID op1, RegisterID op2, RegisterID dest)
    {
        m_assembler.and_<32>(dest, op1, op2);
    }

    void and32(TrustedImm32 imm, RegisterID dest)
    {
        and32(imm, dest, dest);
    }

    void and32(TrustedImm32 imm, RegisterID src, RegisterID dest)
    {
        LogicalImmediate logicalImm = LogicalImmediate::create32(imm.m_value);

        if (logicalImm.isValid()) {
            m_assembler.and_<32>(dest, src, logicalImm);
            return;
        }

        move(imm, getCachedDataTempRegisterIDAndInvalidate());
        m_assembler.and_<32>(dest, src, dataTempRegister);
    }

    void and32(Address src, RegisterID dest)
    {
        load32(src, getCachedDataTempRegisterIDAndInvalidate());
        and32(dataTempRegister, dest);
    }

    void and16(Address src, RegisterID dest)
    {
        load16(src, getCachedDataTempRegisterIDAndInvalidate());
        and32(dataTempRegister, dest);
    }

    void and64(RegisterID src1, RegisterID src2, RegisterID dest)
    {
        m_assembler.and_<64>(dest, src1, src2);
    }

    void and64(TrustedImm64 imm, RegisterID src, RegisterID dest)
    {
        LogicalImmediate logicalImm = LogicalImmediate::create64(imm.m_value);

        if (logicalImm.isValid()) {
            m_assembler.and_<64>(dest, src, logicalImm);
            return;
        }

        move(imm, getCachedDataTempRegisterIDAndInvalidate());
        m_assembler.and_<64>(dest, src, dataTempRegister);
    }

    void and64(RegisterID src, RegisterID dest)
    {
        m_assembler.and_<64>(dest, dest, src);
    }

    void and64(TrustedImm32 imm, RegisterID src, RegisterID dest)
    {
        LogicalImmediate logicalImm = LogicalImmediate::create64(static_cast<intptr_t>(static_cast<int64_t>(imm.m_value)));

        if (logicalImm.isValid()) {
            m_assembler.and_<64>(dest, src, logicalImm);
            return;
        }

        signExtend32ToPtr(imm, getCachedDataTempRegisterIDAndInvalidate());
        m_assembler.and_<64>(dest, src, dataTempRegister);
    }

    void and64(TrustedImm32 imm, RegisterID dest)
    {
        and64(imm, dest, dest);
    }

    void and64(TrustedImmPtr imm, RegisterID dest)
    {
        intptr_t value = imm.asIntptr();
        if constexpr (sizeof(void*) == sizeof(uint64_t))
            and64(TrustedImm64(value), dest);
        else
            and64(TrustedImm32(static_cast<int32_t>(value)), dest);
    }

    void and64(TrustedImm64 imm, RegisterID dest)
    {
        LogicalImmediate logicalImm = LogicalImmediate::create64(std::bit_cast<uint64_t>(imm.m_value));

        if (logicalImm.isValid()) {
            m_assembler.and_<64>(dest, dest, logicalImm);
            return;
        }

        move(imm, getCachedDataTempRegisterIDAndInvalidate());
        m_assembler.and_<64>(dest, dest, dataTempRegister);
    }

    // Bit operations:
    void extractUnsignedBitfield32(RegisterID src, TrustedImm32 lsb, TrustedImm32 width, RegisterID dest)
    {
        m_assembler.ubfx<32>(dest, src, lsb.m_value, width.m_value);
    }

    void extractUnsignedBitfield64(RegisterID src, TrustedImm32 lsb, TrustedImm32 width, RegisterID dest)
    {
        m_assembler.ubfx<64>(dest, src, lsb.m_value, width.m_value);
    }

    void insertUnsignedBitfieldInZero32(RegisterID src, TrustedImm32 lsb, TrustedImm32 width, RegisterID dest)
    {
        m_assembler.ubfiz<32>(dest, src, lsb.m_value, width.m_value);
    }

    void insertUnsignedBitfieldInZero64(RegisterID src, TrustedImm32 lsb, TrustedImm32 width, RegisterID dest)
    {
        m_assembler.ubfiz<64>(dest, src, lsb.m_value, width.m_value);
    }

    void insertBitField32(RegisterID source, TrustedImm32 lsb, TrustedImm32 width, RegisterID dest)
    {
        m_assembler.bfi<32>(dest, source, lsb.m_value, width.m_value);
    }

    void insertBitField64(RegisterID source, TrustedImm32 lsb, TrustedImm32 width, RegisterID dest)
    {
        m_assembler.bfi<64>(dest, source, lsb.m_value, width.m_value);
    }

    void clearBitField32(TrustedImm32 lsb, TrustedImm32 width, RegisterID dest)
    {
        m_assembler.bfc<32>(dest, lsb.m_value, width.m_value);
    }

    void clearBitField64(TrustedImm32 lsb, TrustedImm32 width, RegisterID dest)
    {
        m_assembler.bfc<64>(dest, lsb.m_value, width.m_value);
    }

    void clearBitsWithMask32(RegisterID src, RegisterID mask, RegisterID dest)
    {
        m_assembler.bic<32>(dest, src, mask);
    }

    void clearBitsWithMaskLeftShift32(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.bic<32>(d, n, m, Assembler::LSL, amount.m_value);
    }

    void clearBitsWithMaskRightShift32(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.bic<32>(d, n, m, Assembler::ASR, amount.m_value);
    }

    void clearBitsWithMaskUnsignedRightShift32(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.bic<32>(d, n, m, Assembler::LSR, amount.m_value);
    }

    void clearBitsWithMask64(RegisterID src, RegisterID mask, RegisterID dest)
    {
        m_assembler.bic<64>(dest, src, mask);
    }

    void clearBitsWithMaskLeftShift64(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.bic<64>(d, n, m, Assembler::LSL, amount.m_value);
    }

    void clearBitsWithMaskRightShift64(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.bic<64>(d, n, m, Assembler::ASR, amount.m_value);
    }

    void clearBitsWithMaskUnsignedRightShift64(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.bic<64>(d, n, m, Assembler::LSR, amount.m_value);
    }

    void orNot32(RegisterID src, RegisterID mask, RegisterID dest)
    {
        m_assembler.orn<32>(dest, src, mask);
    }

    void orNot64(RegisterID src, RegisterID mask, RegisterID dest)
    {
        m_assembler.orn<64>(dest, src, mask);
    }

    void xorNot32(RegisterID src, RegisterID mask, RegisterID dest)
    {
        m_assembler.eon<32>(dest, src, mask);
    }

    void xorNot64(RegisterID src, RegisterID mask, RegisterID dest)
    {
        m_assembler.eon<64>(dest, src, mask);
    }

    void xorNotLeftShift32(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.eon<32>(d, n, m, Assembler::LSL, amount.m_value);
    }

    void xorNotRightShift32(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.eon<32>(d, n, m, Assembler::ASR, amount.m_value);
    }

    void xorNotUnsignedRightShift32(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.eon<32>(d, n, m, Assembler::LSR, amount.m_value);
    }

    void xorNotLeftShift64(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.eon<64>(d, n, m, Assembler::LSL, amount.m_value);
    }

    void xorNotRightShift64(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.eon<64>(d, n, m, Assembler::ASR, amount.m_value);
    }

    void xorNotUnsignedRightShift64(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.eon<64>(d, n, m, Assembler::LSR, amount.m_value);
    }

    void extractInsertBitfieldAtLowEnd32(RegisterID src, TrustedImm32 lsb, TrustedImm32 width, RegisterID dest)
    {
        m_assembler.bfxil<32>(dest, src, lsb.m_value, width.m_value);
    }

    void extractInsertBitfieldAtLowEnd64(RegisterID src, TrustedImm32 lsb, TrustedImm32 width, RegisterID dest)
    {
        m_assembler.bfxil<64>(dest, src, lsb.m_value, width.m_value);
    }

    void insertSignedBitfieldInZero32(RegisterID src, TrustedImm32 lsb, TrustedImm32 width, RegisterID dest)
    {
        m_assembler.sbfiz<32>(dest, src, lsb.m_value, width.m_value);
    }

    void insertSignedBitfieldInZero64(RegisterID src, TrustedImm32 lsb, TrustedImm32 width, RegisterID dest)
    {
        m_assembler.sbfiz<64>(dest, src, lsb.m_value, width.m_value);
    }

    void extractSignedBitfield32(RegisterID src, TrustedImm32 lsb, TrustedImm32 width, RegisterID dest)
    {
        m_assembler.sbfx<32>(dest, src, lsb.m_value, width.m_value);
    }

    void extractSignedBitfield64(RegisterID src, TrustedImm32 lsb, TrustedImm32 width, RegisterID dest)
    {
        m_assembler.sbfx<64>(dest, src, lsb.m_value, width.m_value);
    }    

    void extractRegister32(RegisterID n, RegisterID m, TrustedImm32 lsb, RegisterID d)
    {
        m_assembler.extr<32>(d, n, m, lsb.m_value);
    }

    void extractRegister64(RegisterID n, RegisterID m, TrustedImm32 lsb, RegisterID d)
    {
        m_assembler.extr<64>(d, n, m, lsb.m_value);
    } 

    void addLeftShift32(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.add<32>(d, n, m, Assembler::LSL, amount.m_value);
    }

    void addRightShift32(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.add<32>(d, n, m, Assembler::ASR, amount.m_value);
    }

    void addUnsignedRightShift32(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.add<32>(d, n, m, Assembler::LSR, amount.m_value);
    }

    void addLeftShift64(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.add<64>(d, n, m, Assembler::LSL, amount.m_value);
    }

    void addRightShift64(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.add<64>(d, n, m, Assembler::ASR, amount.m_value);
    }

    void addUnsignedRightShift64(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.add<64>(d, n, m, Assembler::LSR, amount.m_value);
    }

    void subLeftShift32(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.sub<32>(d, n, m, Assembler::LSL, amount.m_value);
    }

    void subRightShift32(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.sub<32>(d, n, m, Assembler::ASR, amount.m_value);
    }

    void subUnsignedRightShift32(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.sub<32>(d, n, m, Assembler::LSR, amount.m_value);
    }

    void subLeftShift64(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.sub<64>(d, n, m, Assembler::LSL, amount.m_value);
    }

    void subRightShift64(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.sub<64>(d, n, m, Assembler::ASR, amount.m_value);
    }

    void subUnsignedRightShift64(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.sub<64>(d, n, m, Assembler::LSR, amount.m_value);
    }

    void andLeftShift32(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.and_<32>(d, n, m, Assembler::LSL, amount.m_value);
    }

    void andRightShift32(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.and_<32>(d, n, m, Assembler::ASR, amount.m_value);
    }

    void andUnsignedRightShift32(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.and_<32>(d, n, m, Assembler::LSR, amount.m_value);
    }

    void andLeftShift64(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.and_<64>(d, n, m, Assembler::LSL, amount.m_value);
    }

    void andRightShift64(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.and_<64>(d, n, m, Assembler::ASR, amount.m_value);
    }

    void andUnsignedRightShift64(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.and_<64>(d, n, m, Assembler::LSR, amount.m_value);
    }

    void xorLeftShift32(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.eor<32>(d, n, m, Assembler::LSL, amount.m_value);
    }

    void xorRightShift32(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.eor<32>(d, n, m, Assembler::ASR, amount.m_value);
    }

    void xorUnsignedRightShift32(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.eor<32>(d, n, m, Assembler::LSR, amount.m_value);
    }

    void xorLeftShift64(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.eor<64>(d, n, m, Assembler::LSL, amount.m_value);
    }

    void xorRightShift64(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.eor<64>(d, n, m, Assembler::ASR, amount.m_value);
    }

    void xorUnsignedRightShift64(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.eor<64>(d, n, m, Assembler::LSR, amount.m_value);
    }

    void orLeftShift32(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.orr<32>(d, n, m, Assembler::LSL, amount.m_value);
    }

    void orRightShift32(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.orr<32>(d, n, m, Assembler::ASR, amount.m_value);
    }

    void orUnsignedRightShift32(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.orr<32>(d, n, m, Assembler::LSR, amount.m_value);
    }

    void orLeftShift64(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.orr<64>(d, n, m, Assembler::LSL, amount.m_value);
    }

    void orRightShift64(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.orr<64>(d, n, m, Assembler::ASR, amount.m_value);
    }

    void orUnsignedRightShift64(RegisterID n, RegisterID m, TrustedImm32 amount, RegisterID d)
    {
        m_assembler.orr<64>(d, n, m, Assembler::LSR, amount.m_value);
    }

    void clearBit64(RegisterID bitToClear, RegisterID dest, RegisterID scratchForMask = InvalidGPRReg)
    {
        if (scratchForMask == InvalidGPRReg)
            scratchForMask = scratchRegister();

        move(TrustedImm32(1), scratchForMask);
        lshift64(bitToClear, scratchForMask);
        clearBits64WithMask(scratchForMask, dest);
    }

    enum class ClearBitsAttributes {
        OKToClobberMask,
        MustPreserveMask
    };

    void clearBits64WithMask(RegisterID mask, RegisterID dest, ClearBitsAttributes = ClearBitsAttributes::OKToClobberMask)
    {
        clearBits64WithMask(dest, mask, dest);
    }

    void clearBits64WithMask(RegisterID src, RegisterID mask, RegisterID dest, ClearBitsAttributes = ClearBitsAttributes::OKToClobberMask)
    {
        m_assembler.bic<64>(dest, src, mask);
    }

    void countLeadingZeros32(RegisterID src, RegisterID dest)
    {
        m_assembler.clz<32>(dest, src);
    }

    void countLeadingZeros64(RegisterID src, RegisterID dest)
    {
        m_assembler.clz<64>(dest, src);
    }

    void countTrailingZeros32(RegisterID src, RegisterID dest)
    {
        // Arm does not have a count trailing zeros only a count leading zeros.
        m_assembler.rbit<32>(dest, src);
        m_assembler.clz<32>(dest, dest);
    }

    void countTrailingZeros64(RegisterID src, RegisterID dest)
    {
        // Arm does not have a count trailing zeros only a count leading zeros.
        m_assembler.rbit<64>(dest, src);
        m_assembler.clz<64>(dest, dest);
    }

    void countTrailingZeros64WithoutNullCheck(RegisterID src, RegisterID dest)
    {
#if ASSERT_ENABLED
        Jump notZero = branchTest64(NonZero, src);
        abortWithReason(MacroAssemblerOops, __LINE__);
        notZero.link(this);
#endif
        // Arm did not need an explicit null check to begin with. So, we can do
        // exactly the same thing as in countTrailingZeros64().
        countTrailingZeros64(src, dest);
    }

    void byteSwap16(RegisterID dst)
    {
        m_assembler.rev16<32>(dst, dst);
        zeroExtend16To32(dst, dst);
    }

    void byteSwap32(RegisterID dst)
    {
        m_assembler.rev<32>(dst, dst);
    }

    void byteSwap64(RegisterID dst)
    {
        m_assembler.rev<64>(dst, dst);
    }

    // Only used for testing purposes.
    void illegalInstruction()
    {
        m_assembler.illegalInstruction();
    }

    void countPopulation32(RegisterID src, RegisterID dst, FPRegisterID temp)
    {
        move32ToFloat(src, temp);
        m_assembler.vectorCnt(temp, temp, SIMDLane::i8x16);
        m_assembler.addv(temp, temp, SIMDLane::i8x16);
        moveFloatTo32(temp, dst);
    }

    void countPopulation64(RegisterID src, RegisterID dst, FPRegisterID temp)
    {
        move64ToDouble(src, temp);
        m_assembler.vectorCnt(temp, temp, SIMDLane::i8x16);
        m_assembler.addv(temp, temp, SIMDLane::i8x16);
        moveDoubleTo64(temp, dst);
    }

    void lshift32(RegisterID src, RegisterID shiftAmount, RegisterID dest)
    {
        m_assembler.lsl<32>(dest, src, shiftAmount);
    }

    void lshift32(RegisterID src, TrustedImm32 imm, RegisterID dest)
    {
        m_assembler.lsl<32>(dest, src, imm.m_value & 0x1f);
    }

    void lshift32(TrustedImm32 imm, RegisterID shiftAmount, RegisterID dest)
    {
        move(imm, getCachedDataTempRegisterIDAndInvalidate());
        m_assembler.lsl<32>(dest, dataTempRegister, shiftAmount);
    }

    void lshift32(RegisterID shiftAmount, RegisterID dest)
    {
        lshift32(dest, shiftAmount, dest);
    }

    void lshift32(TrustedImm32 imm, RegisterID dest)
    {
        lshift32(dest, imm, dest);
    }

    void lshift32(Address src, RegisterID shiftAmount, RegisterID dest)
    {
        load32(src, getCachedDataTempRegisterIDAndInvalidate());
        m_assembler.lsl<32>(dest, dataTempRegister, shiftAmount);
    }

    void lshift64(RegisterID src, RegisterID shiftAmount, RegisterID dest)
    {
        m_assembler.lsl<64>(dest, src, shiftAmount);
    }

    void lshift64(RegisterID src, TrustedImm32 imm, RegisterID dest)
    {
        if (UNLIKELY(!imm.m_value))
            return move(src, dest);
        m_assembler.lsl<64>(dest, src, imm.m_value & 0x3f);
    }

    void lshift64(TrustedImm32 imm, RegisterID shiftAmount, RegisterID dest)
    {
        move(imm, getCachedDataTempRegisterIDAndInvalidate());
        m_assembler.lsl<64>(dest, dataTempRegister, shiftAmount);
    }

    void lshift64(RegisterID shiftAmount, RegisterID dest)
    {
        lshift64(dest, shiftAmount, dest);
    }

    void lshift64(TrustedImm32 imm, RegisterID dest)
    {
        lshift64(dest, imm, dest);
    }

    void lshift64(Address src, RegisterID shiftAmount, RegisterID dest)
    {
        load64(src, getCachedDataTempRegisterIDAndInvalidate());
        m_assembler.lsl<64>(dest, dataTempRegister, shiftAmount);
    }

    void mul32(RegisterID left, RegisterID right, RegisterID dest)
    {
        m_assembler.mul<32>(dest, left, right);
    }
    
    void mul32(RegisterID src, RegisterID dest)
    {
        m_assembler.mul<32>(dest, dest, src);
    }

    void mul32(TrustedImm32 imm, RegisterID src, RegisterID dest)
    {
        move(imm, getCachedDataTempRegisterIDAndInvalidate());
        m_assembler.mul<32>(dest, src, dataTempRegister);
    }

    void mul64(RegisterID src, RegisterID dest)
    {
        m_assembler.mul<64>(dest, dest, src);
    }

    void mul64(RegisterID left, RegisterID right, RegisterID dest)
    {
        m_assembler.mul<64>(dest, left, right);
    }

    void multiplyAdd32(RegisterID mulLeft, RegisterID mulRight, RegisterID summand, RegisterID dest)
    {
        m_assembler.madd<32>(dest, mulLeft, mulRight, summand);
    }

    void multiplySub32(RegisterID mulLeft, RegisterID mulRight, RegisterID minuend, RegisterID dest)
    {
        m_assembler.msub<32>(dest, mulLeft, mulRight, minuend);
    }

    void multiplyNeg32(RegisterID mulLeft, RegisterID mulRight, RegisterID dest)
    {
        m_assembler.mneg<32>(dest, mulLeft, mulRight);
    }

    void multiplyAdd64(RegisterID mulLeft, RegisterID mulRight, RegisterID summand, RegisterID dest)
    {
        m_assembler.madd<64>(dest, mulLeft, mulRight, summand);
    }

    void multiplyAddSignExtend32(RegisterID mulLeft, RegisterID mulRight, RegisterID summand, RegisterID dest)
    {
        m_assembler.smaddl(dest, mulLeft, mulRight, summand);
    }

    void multiplyAddZeroExtend32(RegisterID mulLeft, RegisterID mulRight, RegisterID summand, RegisterID dest)
    {
        m_assembler.umaddl(dest, mulLeft, mulRight, summand);
    }

    void multiplySub64(RegisterID mulLeft, RegisterID mulRight, RegisterID minuend, RegisterID dest)
    {
        m_assembler.msub<64>(dest, mulLeft, mulRight, minuend);
    }

    void multiplySubSignExtend32(RegisterID mulLeft, RegisterID mulRight, RegisterID minuend, RegisterID dest)
    {
        m_assembler.smsubl(dest, mulLeft, mulRight, minuend);
    }

    void multiplySubZeroExtend32(RegisterID mulLeft, RegisterID mulRight, RegisterID minuend, RegisterID dest)
    {
        m_assembler.umsubl(dest, mulLeft, mulRight, minuend);
    }

    void multiplyNeg64(RegisterID mulLeft, RegisterID mulRight, RegisterID dest)
    {
        m_assembler.mneg<64>(dest, mulLeft, mulRight);
    }

    void multiplyNegSignExtend32(RegisterID mulLeft, RegisterID mulRight, RegisterID dest)
    {
        m_assembler.smnegl(dest, mulLeft, mulRight);
    }

    void multiplyNegZeroExtend32(RegisterID mulLeft, RegisterID mulRight, RegisterID dest)
    {
        m_assembler.umnegl(dest, mulLeft, mulRight);
    }

    void multiplySignExtend32(RegisterID left, RegisterID right, RegisterID dest)
    {
        m_assembler.smull(dest, left, right);
    }

    void multiplyZeroExtend32(RegisterID left, RegisterID right, RegisterID dest)
    {
        m_assembler.umull(dest, left, right);
    }

    void div32(RegisterID dividend, RegisterID divisor, RegisterID dest)
    {
        m_assembler.sdiv<32>(dest, dividend, divisor);
    }

    void div64(RegisterID dividend, RegisterID divisor, RegisterID dest)
    {
        m_assembler.sdiv<64>(dest, dividend, divisor);
    }

    void uDiv32(RegisterID dividend, RegisterID divisor, RegisterID dest)
    {
        m_assembler.udiv<32>(dest, dividend, divisor);
    }

    void uDiv64(RegisterID dividend, RegisterID divisor, RegisterID dest)
    {
        m_assembler.udiv<64>(dest, dividend, divisor);
    }

    void neg32(RegisterID dest)
    {
        m_assembler.neg<32>(dest, dest);
    }

    void neg32(RegisterID src, RegisterID dest)
    {
        m_assembler.neg<32>(dest, src);
    }

    void neg64(RegisterID dest)
    {
        m_assembler.neg<64>(dest, dest);
    }

    void neg64(RegisterID src, RegisterID dest)
    {
        m_assembler.neg<64>(dest, src);
    }

    void or16(TrustedImm32 imm, AbsoluteAddress address)
    {
        LogicalImmediate logicalImm = LogicalImmediate::create32(imm.m_value);
        if (logicalImm.isValid()) {
            load16(address.m_ptr, getCachedDataTempRegisterIDAndInvalidate());
            m_assembler.orr<32>(dataTempRegister, dataTempRegister, logicalImm);
            store16(dataTempRegister, address.m_ptr);
        } else {
            load16(address.m_ptr, getCachedMemoryTempRegisterIDAndInvalidate());
            or32(imm, memoryTempRegister, getCachedDataTempRegisterIDAndInvalidate());
            store16(dataTempRegister, address.m_ptr);
        }
    }

    void or16(RegisterID mask, AbsoluteAddress address)
    {
        load16(address.m_ptr, getCachedDataTempRegisterIDAndInvalidate());
        m_assembler.orr<32>(dataTempRegister, dataTempRegister, mask);
        store16(dataTempRegister, address.m_ptr);
    }

    void or32(RegisterID src, RegisterID dest)
    {
        or32(dest, src, dest);
    }

    void or32(RegisterID op1, RegisterID op2, RegisterID dest)
    {
        m_assembler.orr<32>(dest, op1, op2);
    }

    void or32(TrustedImm32 imm, RegisterID dest)
    {
        or32(imm, dest, dest);
    }

    void or32(TrustedImm32 imm, RegisterID src, RegisterID dest)
    {
        LogicalImmediate logicalImm = LogicalImmediate::create32(imm.m_value);

        if (logicalImm.isValid()) {
            m_assembler.orr<32>(dest, src, logicalImm);
            return;
        }

        ASSERT(src != dataTempRegister);
        move(imm, getCachedDataTempRegisterIDAndInvalidate());
        m_assembler.orr<32>(dest, src, dataTempRegister);
    }

    void or32(RegisterID src, AbsoluteAddress address)
    {
        load32(address.m_ptr, getCachedDataTempRegisterIDAndInvalidate());
        m_assembler.orr<32>(dataTempRegister, dataTempRegister, src);
        store32(dataTempRegister, address.m_ptr);
    }

    void or32(RegisterID src, Address dest)
    {
        load32(dest, getCachedDataTempRegisterIDAndInvalidate());
        m_assembler.orr<32>(dataTempRegister, dataTempRegister, src);
        store32(dataTempRegister, dest);
    }

    void or32(TrustedImm32 imm, AbsoluteAddress address)
    {
        LogicalImmediate logicalImm = LogicalImmediate::create32(imm.m_value);
        if (logicalImm.isValid()) {
            load32(address.m_ptr, getCachedDataTempRegisterIDAndInvalidate());
            m_assembler.orr<32>(dataTempRegister, dataTempRegister, logicalImm);
            store32(dataTempRegister, address.m_ptr);
        } else {
            load32(address.m_ptr, getCachedMemoryTempRegisterIDAndInvalidate());
            or32(imm, memoryTempRegister, getCachedDataTempRegisterIDAndInvalidate());
            store32(dataTempRegister, address.m_ptr);
        }
    }

    void or32(TrustedImm32 imm, Address address)
    {
        load32(address, getCachedDataTempRegisterIDAndInvalidate());
        or32(imm, dataTempRegister, dataTempRegister);
        store32(dataTempRegister, address);
    }

    void or8(RegisterID src, AbsoluteAddress address)
    {
        load8(address.m_ptr, getCachedDataTempRegisterIDAndInvalidate());
        or32(src, dataTempRegister, dataTempRegister);
        store8(dataTempRegister, address.m_ptr);
    }

    void or8(TrustedImm32 imm, AbsoluteAddress address)
    {
        LogicalImmediate logicalImm = LogicalImmediate::create32(imm.m_value);
        if (logicalImm.isValid()) {
            load8(address.m_ptr, getCachedDataTempRegisterIDAndInvalidate());
            m_assembler.orr<32>(dataTempRegister, dataTempRegister, logicalImm);
            store8(dataTempRegister, address.m_ptr);
        } else {
            load8(address.m_ptr, getCachedMemoryTempRegisterIDAndInvalidate());
            or32(imm, memoryTempRegister, getCachedDataTempRegisterIDAndInvalidate());
            store8(dataTempRegister, address.m_ptr);
        }
    }

    void or64(RegisterID src, RegisterID dest)
    {
        or64(dest, src, dest);
    }

    void or64(RegisterID op1, RegisterID op2, RegisterID dest)
    {
        m_assembler.orr<64>(dest, op1, op2);
    }

    void or64(TrustedImm32 imm, RegisterID dest)
    {
        or64(imm, dest, dest);
    }

    void or64(TrustedImm32 imm, RegisterID src, RegisterID dest)
    {
        LogicalImmediate logicalImm = LogicalImmediate::create64(static_cast<intptr_t>(static_cast<int64_t>(imm.m_value)));

        if (logicalImm.isValid()) {
            m_assembler.orr<64>(dest, src, logicalImm);
            return;
        }

        signExtend32ToPtr(imm, getCachedDataTempRegisterIDAndInvalidate());
        m_assembler.orr<64>(dest, src, dataTempRegister);
    }

    void or64(TrustedImm64 imm, RegisterID src, RegisterID dest)
    {
        LogicalImmediate logicalImm = LogicalImmediate::create64(imm.m_value);

        if (logicalImm.isValid()) {
            m_assembler.orr<64>(dest, src, logicalImm);
            return;
        }

        move(imm, getCachedDataTempRegisterIDAndInvalidate());
        m_assembler.orr<64>(dest, src, dataTempRegister);
    }

    void or64(TrustedImm64 imm, RegisterID dest)
    {
        LogicalImmediate logicalImm = LogicalImmediate::create64(static_cast<intptr_t>(static_cast<int64_t>(imm.m_value)));

        if (logicalImm.isValid()) {
            m_assembler.orr<64>(dest, dest, logicalImm);
            return;
        }

        move(imm, getCachedDataTempRegisterIDAndInvalidate());
        m_assembler.orr<64>(dest, dest, dataTempRegister);
    }

    void rotateRight32(RegisterID src, TrustedImm32 imm, RegisterID dest)
    {
        m_assembler.ror<32>(dest, src, imm.m_value & 31);
    }

    void rotateRight32(TrustedImm32 imm, RegisterID srcDst)
    {
        rotateRight32(srcDst, imm, srcDst);
    }

    void rotateRight32(RegisterID src, RegisterID shiftAmmount, RegisterID dest)
    {
        m_assembler.ror<32>(dest, src, shiftAmmount);
    }

    void rotateRight64(RegisterID src, TrustedImm32 imm, RegisterID dest)
    {
        if (UNLIKELY(!imm.m_value))
            return move(src, dest);
        m_assembler.ror<64>(dest, src, imm.m_value & 63);
    }

    void rotateRight64(TrustedImm32 imm, RegisterID srcDst)
    {
        rotateRight64(srcDst, imm, srcDst);
    }

    void rotateRight64(RegisterID src, RegisterID shiftAmmount, RegisterID dest)
    {
        m_assembler.ror<64>(dest, src, shiftAmmount);
    }

    void rshift32(RegisterID src, RegisterID shiftAmount, RegisterID dest)
    {
        m_assembler.asr<32>(dest, src, shiftAmount);
    }

    void rshift32(RegisterID src, TrustedImm32 imm, RegisterID dest)
    {
        m_assembler.asr<32>(dest, src, imm.m_value & 0x1f);
    }

    void rshift32(RegisterID shiftAmount, RegisterID dest)
    {
        rshift32(dest, shiftAmount, dest);
    }
    
    void rshift32(TrustedImm32 imm, RegisterID dest)
    {
        rshift32(dest, imm, dest);
    }
    
    void rshift64(RegisterID src, RegisterID shiftAmount, RegisterID dest)
    {
        m_assembler.asr<64>(dest, src, shiftAmount);
    }
    
    void rshift64(RegisterID src, TrustedImm32 imm, RegisterID dest)
    {
        if (UNLIKELY(!imm.m_value))
            return move(src, dest);
        m_assembler.asr<64>(dest, src, imm.m_value & 0x3f);
    }
    
    void rshift64(RegisterID shiftAmount, RegisterID dest)
    {
        rshift64(dest, shiftAmount, dest);
    }
    
    void rshift64(TrustedImm32 imm, RegisterID dest)
    {
        rshift64(dest, imm, dest);
    }

    void sub32(RegisterID src, RegisterID dest)
    {
        m_assembler.sub<32>(dest, dest, src);
    }

    void sub32(RegisterID left, RegisterID right, RegisterID dest)
    {
        m_assembler.sub<32>(dest, left, right);
    }

    void sub32(TrustedImm32 imm, RegisterID dest)
    {
        sub32(dest, imm, dest);
    }

    void sub32(RegisterID left, TrustedImm32 imm, RegisterID dest)
    {
        auto immediate = imm.m_value;
        if (auto tuple = tryExtractShiftedImm(immediate)) {
            auto [u12, shift, inverted] = tuple.value();
            if (!inverted)
                m_assembler.sub<32>(dest, left, u12, shift);
            else
                m_assembler.add<32>(dest, left, u12, shift);
        } else {
            move(imm, getCachedDataTempRegisterIDAndInvalidate());
            m_assembler.sub<32>(dest, left, dataTempRegister);
        }
    }

    void sub32(TrustedImm32 imm, Address address)
    {
        load32(address, getCachedDataTempRegisterIDAndInvalidate());

        auto immediate = imm.m_value;
        if (auto tuple = tryExtractShiftedImm(immediate)) {
            auto [u12, shift, inverted] = tuple.value();
            if (!inverted)
                m_assembler.sub<32>(dataTempRegister, dataTempRegister, u12, shift);
            else
                m_assembler.add<32>(dataTempRegister, dataTempRegister, u12, shift);
        } else {
            move(imm, getCachedMemoryTempRegisterIDAndInvalidate());
            m_assembler.sub<32>(dataTempRegister, dataTempRegister, memoryTempRegister);
        }
        store32(dataTempRegister, address);
    }

    void sub32(TrustedImm32 imm, AbsoluteAddress address)
    {
        load32(address.m_ptr, getCachedDataTempRegisterIDAndInvalidate());

        auto immediate = imm.m_value;
        if (auto tuple = tryExtractShiftedImm(immediate)) {
            auto [u12, shift, inverted] = tuple.value();
            if (!inverted)
                m_assembler.sub<32>(dataTempRegister, dataTempRegister, u12, shift);
            else
                m_assembler.add<32>(dataTempRegister, dataTempRegister, u12, shift);
        } else {
            move(imm, getCachedMemoryTempRegisterIDAndInvalidate());
            m_assembler.sub<32>(dataTempRegister, dataTempRegister, memoryTempRegister);
        }
        store32(dataTempRegister, address.m_ptr);
    }

    void sub32(Address src, RegisterID dest)
    {
        load32(src, getCachedDataTempRegisterIDAndInvalidate());
        sub32(dataTempRegister, dest);
    }

    void sub64(RegisterID src, RegisterID dest)
    {
        m_assembler.sub<64>(dest, dest, src);
    }

    void sub64(RegisterID left, RegisterID right, RegisterID dest)
    {
        m_assembler.sub<64>(dest, left, right);
    }

    void sub64(TrustedImm32 imm, RegisterID dest)
    {
        sub64(dest, imm, dest);
    }

    void sub64(RegisterID left, TrustedImm32 imm, RegisterID dest)
    {
        auto immediate = imm.m_value;
        if (auto tuple = tryExtractShiftedImm(immediate)) {
            auto [u12, shift, inverted] = tuple.value();
            if (!inverted)
                m_assembler.sub<64>(dest, left, u12, shift);
            else
                m_assembler.add<64>(dest, left, u12, shift);
        } else {
            signExtend32ToPtr(imm, getCachedDataTempRegisterIDAndInvalidate());
            m_assembler.sub<64>(dest, left, dataTempRegister);
        }
    }

    void sub64(TrustedImm64 imm, RegisterID dest)
    {
        sub64(dest, imm, dest);
    }

    void sub64(RegisterID left, TrustedImm64 imm, RegisterID dest)
    {
        auto immediate = imm.m_value;
        if (auto tuple = tryExtractShiftedImm(immediate)) {
            auto [u12, shift, inverted] = tuple.value();
            if (!inverted)
                m_assembler.sub<64>(dest, left, u12, shift);
            else
                m_assembler.add<64>(dest, left, u12, shift);
        } else {
            move(imm, getCachedDataTempRegisterIDAndInvalidate());
            m_assembler.sub<64>(dest, left, dataTempRegister);
        }
    }

    void urshift32(RegisterID src, RegisterID shiftAmount, RegisterID dest)
    {
        m_assembler.lsr<32>(dest, src, shiftAmount);
    }
    
    void urshift32(RegisterID src, TrustedImm32 imm, RegisterID dest)
    {
        m_assembler.lsr<32>(dest, src, imm.m_value & 0x1f);
    }

    void urshift32(RegisterID shiftAmount, RegisterID dest)
    {
        urshift32(dest, shiftAmount, dest);
    }
    
    void urshift32(TrustedImm32 imm, RegisterID dest)
    {
        urshift32(dest, imm, dest);
    }

    void urshift64(RegisterID src, RegisterID shiftAmount, RegisterID dest)
    {
        m_assembler.lsr<64>(dest, src, shiftAmount);
    }
    
    void urshift64(RegisterID src, TrustedImm32 imm, RegisterID dest)
    {
        if (UNLIKELY(!imm.m_value))
            return move(src, dest);
        m_assembler.lsr<64>(dest, src, imm.m_value & 0x3f);
    }

    void urshift64(RegisterID shiftAmount, RegisterID dest)
    {
        urshift64(dest, shiftAmount, dest);
    }
    
    void urshift64(TrustedImm32 imm, RegisterID dest)
    {
        urshift64(dest, imm, dest);
    }

    void xor32(RegisterID src, RegisterID dest)
    {
        xor32(dest, src, dest);
    }

    void xor32(Address src, RegisterID dest)
    {
        load32(src, getCachedDataTempRegisterIDAndInvalidate());
        xor32(dataTempRegister, dest);
    }

    void xor32(RegisterID op1, RegisterID op2, RegisterID dest)
    {
        m_assembler.eor<32>(dest, op1, op2);
    }

    void xor32(TrustedImm32 imm, RegisterID dest)
    {
        xor32(imm, dest, dest);
    }

    void xor32(TrustedImm32 imm, RegisterID src, RegisterID dest)
    {
        if (imm.m_value == -1)
            m_assembler.mvn<32>(dest, src);
        else {
            LogicalImmediate logicalImm = LogicalImmediate::create32(imm.m_value);

            if (logicalImm.isValid()) {
                m_assembler.eor<32>(dest, src, logicalImm);
                return;
            }

            move(imm, getCachedDataTempRegisterIDAndInvalidate());
            m_assembler.eor<32>(dest, src, dataTempRegister);
        }
    }

    void xor64(RegisterID src, Address address)
    {
        load64(address, getCachedDataTempRegisterIDAndInvalidate());
        m_assembler.eor<64>(dataTempRegister, dataTempRegister, src);
        store64(dataTempRegister, address);
    }

    void xor64(RegisterID src, RegisterID dest)
    {
        xor64(dest, src, dest);
    }

    void xor64(RegisterID op1, RegisterID op2, RegisterID dest)
    {
        m_assembler.eor<64>(dest, op1, op2);
    }

    void xor64(TrustedImm32 imm, RegisterID dest)
    {
        xor64(imm, dest, dest);
    }

    void xor64(TrustedImm64 imm, RegisterID src, RegisterID dest)
    {
        if (imm.m_value == -1)
            m_assembler.mvn<64>(dest, src);
        else {
            LogicalImmediate logicalImm = LogicalImmediate::create64(imm.m_value);

            if (logicalImm.isValid()) {
                m_assembler.eor<64>(dest, src, logicalImm);
                return;
            }

            move(imm, getCachedDataTempRegisterIDAndInvalidate());
            m_assembler.eor<64>(dest, src, dataTempRegister);
        }
    }

    void xor64(TrustedImm64 imm, RegisterID srcDest)
    {
        xor64(imm, srcDest, srcDest);
    }

    void xor64(TrustedImm32 imm, RegisterID src, RegisterID dest)
    {
        if (imm.m_value == -1)
            m_assembler.mvn<64>(dest, src);
        else {
            LogicalImmediate logicalImm = LogicalImmediate::create64(static_cast<intptr_t>(static_cast<int64_t>(imm.m_value)));

            if (logicalImm.isValid()) {
                m_assembler.eor<64>(dest, src, logicalImm);
                return;
            }

            signExtend32ToPtr(imm, getCachedDataTempRegisterIDAndInvalidate());
            m_assembler.eor<64>(dest, src, dataTempRegister);
        }
    }
    
    void xor64(Address src, RegisterID dest)
    {
        load64(src, getCachedDataTempRegisterIDAndInvalidate());
        xor64(dataTempRegister, dest);
    }

    void not32(RegisterID srcDest)
    {
        m_assembler.mvn<32>(srcDest, srcDest);
    }

    void not32(RegisterID src, RegisterID dest)
    {
        m_assembler.mvn<32>(dest, src);
    }

    void not64(RegisterID src, RegisterID dest)
    {
        m_assembler.mvn<64>(dest, src);
    }

    void not64(RegisterID srcDst)
    {
        m_assembler.mvn<64>(srcDst, srcDst);
    }

    // Memory access operations:
    Assembler::ExtendType indexExtendType(BaseIndex address)
    {
        switch (address.extend) {
        case Extend::ZExt32:
            return Assembler::UXTW;
        case Extend::SExt32:
            return Assembler::SXTW;
        case Extend::None:
            return Assembler::UXTX;
        }
        RELEASE_ASSERT_NOT_REACHED();
    }

    void load64(Address address, RegisterID dest)
    {
        if (tryLoadWithOffset<64>(dest, address.base, address.offset))
            return;

        signExtend32ToPtr(TrustedImm32(address.offset), getCachedMemoryTempRegisterIDAndInvalidate());
        m_assembler.ldr<64>(dest, address.base, memoryTempRegister);
    }

    void load64(BaseIndex address, RegisterID dest)
    {
        if (address.scale == TimesOne || address.scale == TimesEight) {
            if (auto baseGPR = tryFoldBaseAndOffsetPart(address)) {
                m_assembler.ldr<64>(dest, baseGPR.value(), address.index, indexExtendType(address), address.scale);
                return;
            }
        }

        signExtend32ToPtr(TrustedImm32(address.offset), getCachedMemoryTempRegisterIDAndInvalidate());
        m_assembler.add<64>(memoryTempRegister, memoryTempRegister, address.index, indexExtendType(address), address.scale);
        m_assembler.ldr<64>(dest, address.base, memoryTempRegister);
    }

    void load64(const void* address, RegisterID dest)
    {
        load<64>(address, dest);
    }

    void load64(PreIndexAddress src, RegisterID dest)
    {
        m_assembler.ldr<64>(dest, src.base, PreIndex(src.index));
    }

    void load64(PostIndexAddress src, RegisterID dest)
    {
        m_assembler.ldr<64>(dest, src.base, PostIndex(src.index));
    }

    DataLabel32 load64WithAddressOffsetPatch(Address address, RegisterID dest)
    {
        DataLabel32 label(this);
        signExtend32ToPtrWithFixedWidth(address.offset, getCachedMemoryTempRegisterIDAndInvalidate());
        m_assembler.ldr<64>(dest, address.base, memoryTempRegister, Assembler::SXTW, 0);
        return label;
    }
    
    DataLabelCompact load64WithCompactAddressOffsetPatch(Address address, RegisterID dest)
    {
        ASSERT(isCompactPtrAlignedAddressOffset(address.offset));
        DataLabelCompact label(this);
        m_assembler.ldr<64>(dest, address.base, address.offset);
        return label;
    }

    void loadPair32(RegisterID src, RegisterID dest1, RegisterID dest2)
    {
        loadPair32(src, TrustedImm32(0), dest1, dest2);
    }

    void loadPair32(RegisterID src, TrustedImm32 offset, RegisterID dest1, RegisterID dest2)
    {
        ASSERT(dest1 != dest2); // If it is the same, ldp becomes illegal instruction.
        if (ARM64Assembler::isValidLDPImm<32>(offset.m_value)) {
            m_assembler.ldp<32>(dest1, dest2, src, offset.m_value);
            return;
        }
        if (src == dest1) {
            load32(Address(src, offset.m_value + 4), dest2);
            load32(Address(src, offset.m_value), dest1);
        } else {
            load32(Address(src, offset.m_value), dest1);
            load32(Address(src, offset.m_value + 4), dest2);
        }
    }

    void loadPair32(PreIndexAddress src, RegisterID dest1, RegisterID dest2)
    {
        m_assembler.ldp<32>(dest1, dest2, src.base, PairPreIndex(src.index));
    }

    void loadPair32(PostIndexAddress src, RegisterID dest1, RegisterID dest2)
    {
        m_assembler.ldp<32>(dest1, dest2, src.base, PairPostIndex(src.index));
    }

    void loadPair32(Address address, RegisterID dest1, RegisterID dest2)
    {
        loadPair32(address.base, TrustedImm32(address.offset), dest1, dest2);
    }

    void loadPair32(RegisterID src, TrustedImm32 offset, FPRegisterID dest1, FPRegisterID dest2)
    {
        ASSERT(dest1 != dest2); // If it is the same, ldp becomes illegal instruction.
        if (ARM64Assembler::isValidLDPFPImm<32>(offset.m_value)) {
            m_assembler.ldp<32>(dest1, dest2, src, offset.m_value);
            return;
        }
        loadFloat(Address(src, offset.m_value), dest1);
        loadFloat(Address(src, offset.m_value + 8), dest2);
    }

    void loadPairFloat(Address src, FPRegisterID dest1, FPRegisterID dest2)
    {
        loadPair32(src.base, TrustedImm32(src.offset), dest1, dest2);
    }

    void loadPair64(RegisterID src, RegisterID dest1, RegisterID dest2)
    {
        loadPair64(src, TrustedImm32(0), dest1, dest2);
    }

    void loadPair64(RegisterID src, TrustedImm32 offset, RegisterID dest1, RegisterID dest2)
    {
        ASSERT(dest1 != dest2); // If it is the same, ldp becomes illegal instruction.
        if (ARM64Assembler::isValidLDPImm<64>(offset.m_value)) {
            m_assembler.ldp<64>(dest1, dest2, src, offset.m_value);
            return;
        }
        if (src == dest1) {
            load64(Address(src, offset.m_value + 8), dest2);
            load64(Address(src, offset.m_value), dest1);
        } else {
            load64(Address(src, offset.m_value), dest1);
            load64(Address(src, offset.m_value + 8), dest2);
        }
    }

    void loadPair64(PreIndexAddress src, RegisterID dest1, RegisterID dest2)
    {
        m_assembler.ldp<64>(dest1, dest2, src.base, PairPreIndex(src.index));
    }

    void loadPair64(PostIndexAddress src, RegisterID dest1, RegisterID dest2)
    {
        m_assembler.ldp<64>(dest1, dest2, src.base, PairPostIndex(src.index));
    }

    void loadPair64(Address address, RegisterID dest1, RegisterID dest2)
    {
        loadPair64(address.base, TrustedImm32(address.offset), dest1, dest2);
    }

    void loadPair64WithNonTemporalAccess(RegisterID src, RegisterID dest1, RegisterID dest2)
    {
        loadPair64WithNonTemporalAccess(src, TrustedImm32(0), dest1, dest2);
    }

    void loadPair64WithNonTemporalAccess(RegisterID src, TrustedImm32 offset, RegisterID dest1, RegisterID dest2)
    {
        ASSERT(dest1 != dest2); // If it is the same, ldp becomes illegal instruction.
        if (ARM64Assembler::isValidLDPImm<64>(offset.m_value)) {
            m_assembler.ldnp<64>(dest1, dest2, src, offset.m_value);
            return;
        }
        if (src == dest1) {
            load64(Address(src, offset.m_value + 8), dest2);
            load64(Address(src, offset.m_value), dest1);
        } else {
            load64(Address(src, offset.m_value), dest1);
            load64(Address(src, offset.m_value + 8), dest2);
        }
    }

    void loadPair64(RegisterID src, FPRegisterID dest1, FPRegisterID dest2)
    {
        loadPair64(src, TrustedImm32(0), dest1, dest2);
    }

    void loadPair64(RegisterID src, TrustedImm32 offset, FPRegisterID dest1, FPRegisterID dest2)
    {
        ASSERT(dest1 != dest2); // If it is the same, ldp becomes illegal instruction.
        if (ARM64Assembler::isValidLDPFPImm<64>(offset.m_value)) {
            m_assembler.ldp<64>(dest1, dest2, src, offset.m_value);
            return;
        }
        loadDouble(Address(src, offset.m_value), dest1);
        loadDouble(Address(src, offset.m_value + 8), dest2);
    }

    void loadPairDouble(Address src, FPRegisterID dest1, FPRegisterID dest2)
    {
        loadPair64(src.base, TrustedImm32(src.offset), dest1, dest2);
    }

    void abortWithReason(AbortReason reason)
    {
        // It is safe to use dataTempRegister directly since this is a crashing JIT Assert.
        move(TrustedImm32(reason), dataTempRegister);
        breakpoint();
    }

    void abortWithReason(AbortReason reason, intptr_t misc)
    {
        // It is safe to use memoryTempRegister directly since this is a crashing JIT Assert.
        move(TrustedImm64(misc), memoryTempRegister);
        abortWithReason(reason);
    }

    ConvertibleLoadLabel convertibleLoadPtr(Address address, RegisterID dest)
    {
        ConvertibleLoadLabel result(this);
        ASSERT(!(address.offset & ~0xff8));
        m_assembler.ldr<64>(dest, address.base, address.offset);
        return result;
    }

    void load32(Address address, RegisterID dest)
    {
        if (tryLoadWithOffset<32>(dest, address.base, address.offset))
            return;

        signExtend32ToPtr(TrustedImm32(address.offset), getCachedMemoryTempRegisterIDAndInvalidate());
        m_assembler.ldr<32>(dest, address.base, memoryTempRegister);
    }

    void load32(BaseIndex address, RegisterID dest)
    {
        if (address.scale == TimesOne || address.scale == TimesFour) {
            if (auto baseGPR = tryFoldBaseAndOffsetPart(address)) {
                m_assembler.ldr<32>(dest, baseGPR.value(), address.index, indexExtendType(address), address.scale);
                return;
            }
        }

        signExtend32ToPtr(TrustedImm32(address.offset), getCachedMemoryTempRegisterIDAndInvalidate());
        m_assembler.add<64>(memoryTempRegister, memoryTempRegister, address.index, indexExtendType(address), address.scale);
        m_assembler.ldr<32>(dest, address.base, memoryTempRegister);
    }

    void load32(const void* address, RegisterID dest)
    {
        load<32>(address, dest);
    }

    void load32(PreIndexAddress src, RegisterID dest)
    {
        m_assembler.ldr<32>(dest, src.base, PreIndex(src.index));
    }

    void load32(PostIndexAddress src, RegisterID dest)
    {
        m_assembler.ldr<32>(dest, src.base, PostIndex(src.index));
    }

    void load32WithUnalignedHalfWords(BaseIndex address, RegisterID dest)
    {
        load32(address, dest);
    }

    void load16(Address address, RegisterID dest)
    {
        if (tryLoadWithOffset<16>(dest, address.base, address.offset))
            return;

        signExtend32ToPtr(TrustedImm32(address.offset), getCachedMemoryTempRegisterIDAndInvalidate());
        m_assembler.ldrh(dest, address.base, memoryTempRegister);
    }
    
    void load16(BaseIndex address, RegisterID dest)
    {
        if (address.scale == TimesOne || address.scale == TimesTwo) {
            if (auto baseGPR = tryFoldBaseAndOffsetPart(address)) {
                m_assembler.ldrh(dest, baseGPR.value(), address.index, indexExtendType(address), address.scale);
                return;
            }
        }

        signExtend32ToPtr(TrustedImm32(address.offset), getCachedMemoryTempRegisterIDAndInvalidate());
        m_assembler.add<64>(memoryTempRegister, memoryTempRegister, address.index, indexExtendType(address), address.scale);
        m_assembler.ldrh(dest, address.base, memoryTempRegister);
    }

    void load16(ExtendedAddress address, RegisterID dest)
    {
        moveToCachedReg(TrustedImmPtr(reinterpret_cast<void*>(address.offset)), cachedMemoryTempRegister());
        m_assembler.ldrh(dest, memoryTempRegister, address.base, Assembler::UXTX, 1);
        if (dest == memoryTempRegister)
            cachedMemoryTempRegister().invalidate();
    }

    void load16(const void* address, RegisterID dest)
    {
        load<16>(address, dest);
    }

    void load16Unaligned(Address address, RegisterID dest)
    {
        load16(address, dest);
    }

    void load16Unaligned(BaseIndex address, RegisterID dest)
    {
        load16(address, dest);
    }

    void load16SignedExtendTo32(Address address, RegisterID dest)
    {
        if (tryLoadSignedWithOffset<16>(dest, address.base, address.offset))
            return;

        signExtend32ToPtr(TrustedImm32(address.offset), getCachedMemoryTempRegisterIDAndInvalidate());
        m_assembler.ldrsh<32>(dest, address.base, memoryTempRegister);
    }

    void load16SignedExtendTo32(BaseIndex address, RegisterID dest)
    {
        if (address.scale == TimesOne || address.scale == TimesTwo) {
            if (auto baseGPR = tryFoldBaseAndOffsetPart(address)) {
                m_assembler.ldrsh<32>(dest, baseGPR.value(), address.index, indexExtendType(address), address.scale);
                return;
            }
        }

        signExtend32ToPtr(TrustedImm32(address.offset), getCachedMemoryTempRegisterIDAndInvalidate());
        m_assembler.add<64>(memoryTempRegister, memoryTempRegister, address.index, indexExtendType(address), address.scale);
        m_assembler.ldrsh<32>(dest, address.base, memoryTempRegister);
    }

    void load16SignedExtendTo32(const void* address, RegisterID dest)
    {
        moveToCachedReg(TrustedImmPtr(address), cachedMemoryTempRegister());
        m_assembler.ldrsh<32>(dest, memoryTempRegister, ARM64Registers::zr);
        if (dest == memoryTempRegister)
            cachedMemoryTempRegister().invalidate();
    }

    void zeroExtend16To32(RegisterID src, RegisterID dest)
    {
        and32(TrustedImm32(0xffff), src, dest);
    }

    void signExtend16To32(RegisterID src, RegisterID dest)
    {
        m_assembler.sxth<32>(dest, src);
    }

    void zeroExtend16To64(RegisterID src, RegisterID dest)
    {
        and64(TrustedImm64(0xffff), src, dest);
    }

    void signExtend16To64(RegisterID src, RegisterID dest)
    {
        m_assembler.sxth<64>(dest, src);
    }

    void load8(Address address, RegisterID dest)
    {
        if (tryLoadWithOffset<8>(dest, address.base, address.offset))
            return;

        signExtend32ToPtr(TrustedImm32(address.offset), getCachedMemoryTempRegisterIDAndInvalidate());
        m_assembler.ldrb(dest, address.base, memoryTempRegister);
    }

    void load8(BaseIndex address, RegisterID dest)
    {
        if (address.scale == TimesOne) {
            if (auto baseGPR = tryFoldBaseAndOffsetPart(address)) {
                m_assembler.ldrb(dest, baseGPR.value(), address.index, indexExtendType(address), address.scale);
                return;
            }
        }

        signExtend32ToPtr(TrustedImm32(address.offset), getCachedMemoryTempRegisterIDAndInvalidate());
        m_assembler.add<64>(memoryTempRegister, memoryTempRegister, address.index, indexExtendType(address), address.scale);
        m_assembler.ldrb(dest, address.base, memoryTempRegister);
    }
    
    void load8(const void* address, RegisterID dest)
    {
        moveToCachedReg(TrustedImmPtr(address), cachedMemoryTempRegister());
        m_assembler.ldrb(dest, memoryTempRegister, ARM64Registers::zr);
        if (dest == memoryTempRegister)
            cachedMemoryTempRegister().invalidate();
    }

    void load8(RegisterID src, PostIndex simm, RegisterID dest)
    {
        m_assembler.ldrb(dest, src, simm);
    }

    void load8SignedExtendTo32(Address address, RegisterID dest)
    {
        if (tryLoadSignedWithOffset<8>(dest, address.base, address.offset))
            return;

        signExtend32ToPtr(TrustedImm32(address.offset), getCachedMemoryTempRegisterIDAndInvalidate());
        m_assembler.ldrsb<32>(dest, address.base, memoryTempRegister);
    }

    void load8SignedExtendTo32(BaseIndex address, RegisterID dest)
    {
        if (address.scale == TimesOne) {
            if (auto baseGPR = tryFoldBaseAndOffsetPart(address)) {
                m_assembler.ldrsb<32>(dest, baseGPR.value(), address.index, indexExtendType(address), address.scale);
                return;
            }
        }

        signExtend32ToPtr(TrustedImm32(address.offset), getCachedMemoryTempRegisterIDAndInvalidate());
        m_assembler.add<64>(memoryTempRegister, memoryTempRegister, address.index, indexExtendType(address), address.scale);
        m_assembler.ldrsb<32>(dest, address.base, memoryTempRegister);
    }

    void load8SignedExtendTo32(const void* address, RegisterID dest)
    {
        moveToCachedReg(TrustedImmPtr(address), cachedMemoryTempRegister());
        m_assembler.ldrsb<32>(dest, memoryTempRegister, ARM64Registers::zr);
        if (dest == memoryTempRegister)
            cachedMemoryTempRegister().invalidate();
    }

    void zeroExtend8To32(RegisterID src, RegisterID dest)
    {
        and32(TrustedImm32(0xff), src, dest);
    }

    void signExtend8To32(RegisterID src, RegisterID dest)
    {
        m_assembler.sxtb<32>(dest, src);
    }

    void zeroExtend8To64(RegisterID src, RegisterID dest)
    {
        and64(TrustedImm64(0xff), src, dest);
    }

    void signExtend8To64(RegisterID src, RegisterID dest)
    {
        m_assembler.sxtb<64>(dest, src);
    }

    void store64(RegisterID src, Address address)
    {
        if (tryStoreWithOffset<64>(src, address.base, address.offset))
            return;

        signExtend32ToPtr(TrustedImm32(address.offset), getCachedMemoryTempRegisterIDAndInvalidate());
        m_assembler.str<64>(src, address.base, memoryTempRegister);
    }

    void store64(RegisterID src, BaseIndex address)
    {
        if (address.scale == TimesOne || address.scale == TimesEight) {
            if (auto baseGPR = tryFoldBaseAndOffsetPart(address)) {
                m_assembler.str<64>(src, baseGPR.value(), address.index, indexExtendType(address), address.scale);
                return;
            }
        }

        signExtend32ToPtr(TrustedImm32(address.offset), getCachedMemoryTempRegisterIDAndInvalidate());
        m_assembler.add<64>(memoryTempRegister, memoryTempRegister, address.index, indexExtendType(address), address.scale);
        m_assembler.str<64>(src, address.base, memoryTempRegister);
    }

    void store64(RegisterID src, PreIndexAddress dest)
    {
        m_assembler.str<64>(src, dest.base, PreIndex(dest.index));
    }

    void store64(RegisterID src, PostIndexAddress dest)
    {
        m_assembler.str<64>(src, dest.base, PostIndex(dest.index));
    }

    void store64(RegisterID src, const void* address)
    {
        store<64>(src, address);
    }

    void store64(TrustedImm64 imm, const void* address)
    {
        if (!imm.m_value) {
            store64(ARM64Registers::zr, address);
            return;
        }

        moveToCachedReg(imm, dataMemoryTempRegister());
        store64(dataTempRegister, address);
    }

    void store64(TrustedImm32 imm, Address address)
    {
        store64(TrustedImm64(imm.m_value), address);
    }

    void store64(TrustedImm64 imm, Address address)
    {
        if (!imm.m_value) {
            store64(ARM64Registers::zr, address);
            return;
        }

        moveToCachedReg(imm, dataMemoryTempRegister());
        store64(dataTempRegister, address);
    }

    void store64(TrustedImmPtr imm, Address address)
    {
        if (!imm.m_value) {
            store64(ARM64Registers::zr, address);
            return;
        }

        moveToCachedReg(imm, dataMemoryTempRegister());
        store64(dataTempRegister, address);
    }

    void store64(TrustedImm64 imm, BaseIndex address)
    {
        if (!imm.m_value) {
            store64(ARM64Registers::zr, address);
            return;
        }

        moveToCachedReg(imm, dataMemoryTempRegister());
        store64(dataTempRegister, address);
    }

    void transfer32(Address src, Address dest)
    {
        if (src == dest)
            return;
        load32(src, getCachedDataTempRegisterIDAndInvalidate());
        store32(getCachedDataTempRegisterIDAndInvalidate(), dest);
    }

    void transfer64(Address src, Address dest)
    {
        if (src == dest)
            return;
        load64(src, getCachedDataTempRegisterIDAndInvalidate());
        store64(getCachedDataTempRegisterIDAndInvalidate(), dest);
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
        load32(src, getCachedDataTempRegisterIDAndInvalidate());
        store32(getCachedDataTempRegisterIDAndInvalidate(), dest);
    }

    void transfer64(BaseIndex src, BaseIndex dest)
    {
        if (src == dest)
            return;
        load64(src, getCachedDataTempRegisterIDAndInvalidate());
        store64(getCachedDataTempRegisterIDAndInvalidate(), dest);
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
        DataLabel32 label(this);
        signExtend32ToPtrWithFixedWidth(address.offset, getCachedMemoryTempRegisterIDAndInvalidate());
        m_assembler.str<64>(src, address.base, memoryTempRegister, Assembler::SXTW, 0);
        return label;
    }

    void storePair32(RegisterID src1, RegisterID src2, RegisterID dest)
    {
        storePair32(src1, src2, dest, TrustedImm32(0));
    }

    void storePair32(RegisterID src1, RegisterID src2, RegisterID dest, TrustedImm32 offset)
    {
        if (ARM64Assembler::isValidSTPImm<32>(offset.m_value)) {
            m_assembler.stp<32>(src1, src2, dest, offset.m_value);
            return;
        }
        store32(src1, Address(dest, offset.m_value));
        store32(src2, Address(dest, offset.m_value + 4));
    }

    void storePair32(RegisterID src1, RegisterID src2, PreIndexAddress dest)
    {
        m_assembler.stp<32>(src1, src2, dest.base, PairPreIndex(dest.index));
    }

    void storePair32(RegisterID src1, RegisterID src2, PostIndexAddress dest)
    {
        m_assembler.stp<32>(src1, src2, dest.base, PairPostIndex(dest.index));
    }

    void storePair32(RegisterID src1, RegisterID src2, Address dest)
    {
        storePair32(src1, src2, dest.base, TrustedImm32(dest.offset));
    }

    void storePair32(FPRegisterID src1, FPRegisterID src2, RegisterID dest, TrustedImm32 offset)
    {
        if (ARM64Assembler::isValidSTPFPImm<32>(offset.m_value)) {
            m_assembler.stp<32>(src1, src2, dest, offset.m_value);
            return;
        }
        storeFloat(src1, Address(dest, offset.m_value));
        storeFloat(src2, Address(dest, offset.m_value + 8));
    }

    void storePairFloat(FPRegisterID src1, FPRegisterID src2, Address dest)
    {
        storePair32(src1, src2, dest.base, TrustedImm32(dest.offset));
    }

    void storePair64(RegisterID src1, RegisterID src2, RegisterID dest)
    {
        storePair64(src1, src2, dest, TrustedImm32(0));
    }

    void storePair64(RegisterID src1, RegisterID src2, RegisterID dest, TrustedImm32 offset)
    {
        if (ARM64Assembler::isValidSTPImm<64>(offset.m_value)) {
            m_assembler.stp<64>(src1, src2, dest, offset.m_value);
            return;
        }
        store64(src1, Address(dest, offset.m_value));
        store64(src2, Address(dest, offset.m_value + 8));
    }

    void storePair64(RegisterID src1, RegisterID src2, PreIndexAddress dest)
    {
        m_assembler.stp<64>(src1, src2, dest.base, PairPreIndex(dest.index));
    }

    void storePair64(RegisterID src1, RegisterID src2, PostIndexAddress dest)
    {
        m_assembler.stp<64>(src1, src2, dest.base, PairPostIndex(dest.index));
    }

    void storePair64WithNonTemporalAccess(RegisterID src1, RegisterID src2, RegisterID dest)
    {
        storePair64WithNonTemporalAccess(src1, src2, dest, TrustedImm32(0));
    }

    void storePair64WithNonTemporalAccess(RegisterID src1, RegisterID src2, RegisterID dest, TrustedImm32 offset)
    {
        if (ARM64Assembler::isValidSTPImm<64>(offset.m_value)) {
            m_assembler.stnp<64>(src1, src2, dest, offset.m_value);
            return;
        }
        store64(src1, Address(dest, offset.m_value));
        store64(src2, Address(dest, offset.m_value + 8));
    }

    void storePair64(RegisterID src1, RegisterID src2, Address dest)
    {
        storePair64(src1, src2, dest.base, TrustedImm32(dest.offset));
    }

    void storePair64(FPRegisterID src1, FPRegisterID src2, RegisterID dest)
    {
        storePair64(src1, src2, dest, TrustedImm32(0));
    }

    void storePair64(FPRegisterID src1, FPRegisterID src2, RegisterID dest, TrustedImm32 offset)
    {
        if (ARM64Assembler::isValidSTPFPImm<64>(offset.m_value)) {
            m_assembler.stp<64>(src1, src2, dest, offset.m_value);
            return;
        }
        storeDouble(src1, Address(dest, offset.m_value));
        storeDouble(src2, Address(dest, offset.m_value + 8));
    }

    void storePairDouble(FPRegisterID src1, FPRegisterID src2, Address dest)
    {
        storePair64(src1, src2, dest.base, TrustedImm32(dest.offset));
    }

    void store32(RegisterID src, Address address)
    {
        if (tryStoreWithOffset<32>(src, address.base, address.offset))
            return;

        signExtend32ToPtr(TrustedImm32(address.offset), getCachedMemoryTempRegisterIDAndInvalidate());
        m_assembler.str<32>(src, address.base, memoryTempRegister);
    }

    void store32(RegisterID src, BaseIndex address)
    {
        if (address.scale == TimesOne || address.scale == TimesFour) {
            if (auto baseGPR = tryFoldBaseAndOffsetPart(address)) {
                m_assembler.str<32>(src, baseGPR.value(), address.index, indexExtendType(address), address.scale);
                return;
            }
        }

        signExtend32ToPtr(TrustedImm32(address.offset), getCachedMemoryTempRegisterIDAndInvalidate());
        m_assembler.add<64>(memoryTempRegister, memoryTempRegister, address.index, indexExtendType(address), address.scale);
        m_assembler.str<32>(src, address.base, memoryTempRegister);
    }

    void store32(RegisterID src, const void* address)
    {
        store<32>(src, address);
    }

    void store32(TrustedImm32 imm, Address address)
    {
        if (!imm.m_value) {
            store32(ARM64Registers::zr, address);
            return;
        }

        moveToCachedReg(imm, dataMemoryTempRegister());
        store32(dataTempRegister, address);
    }

    void store32(TrustedImm32 imm, BaseIndex address)
    {
        if (!imm.m_value) {
            store32(ARM64Registers::zr, address);
            return;
        }

        moveToCachedReg(imm, dataMemoryTempRegister());
        store32(dataTempRegister, address);
    }

    void store32(TrustedImm32 imm, const void* address)
    {
        if (!imm.m_value) {
            store32(ARM64Registers::zr, address);
            return;
        }

        moveToCachedReg(imm, dataMemoryTempRegister());
        store32(dataTempRegister, address);
    }

    void store32(RegisterID src, PreIndexAddress dest)
    {
        m_assembler.str<32>(src, dest.base, PreIndex(dest.index));
    }

    void store32(RegisterID src, PostIndexAddress dest)
    {
        m_assembler.str<32>(src, dest.base, PostIndex(dest.index));
    }

    void store16(RegisterID src, Address address)
    {
        if (tryStoreWithOffset<16>(src, address.base, address.offset))
            return;

        signExtend32ToPtr(TrustedImm32(address.offset), getCachedMemoryTempRegisterIDAndInvalidate());
        m_assembler.strh(src, address.base, memoryTempRegister);
    }

    void store16(RegisterID src, BaseIndex address)
    {
        if (address.scale == TimesOne || address.scale == TimesTwo) {
            if (auto baseGPR = tryFoldBaseAndOffsetPart(address)) {
                m_assembler.strh(src, baseGPR.value(), address.index, indexExtendType(address), address.scale);
                return;
            }
        }

        signExtend32ToPtr(TrustedImm32(address.offset), getCachedMemoryTempRegisterIDAndInvalidate());
        m_assembler.add<64>(memoryTempRegister, memoryTempRegister, address.index, indexExtendType(address), address.scale);
        m_assembler.strh(src, address.base, memoryTempRegister);
    }

    void store16(RegisterID src, const void* address)
    {
        store<16>(src, address);
    }

    void store16(TrustedImm32 imm, const void* address)
    {
        if (!imm.m_value) {
            store16(ARM64Registers::zr, address);
            return;
        }

        moveToCachedReg(imm, dataMemoryTempRegister());
        store16(dataTempRegister, address);
    }

    void store16(TrustedImm32 imm, Address address)
    {
        TrustedImm32 imm16(static_cast<int16_t>(imm.m_value));
        if (!imm16.m_value) {
            store16(ARM64Registers::zr, address);
            return;
        }

        move(imm16, getCachedDataTempRegisterIDAndInvalidate());
        store16(dataTempRegister, address);
    }

    void store16(TrustedImm32 imm, BaseIndex address)
    {
        TrustedImm32 imm16(static_cast<int16_t>(imm.m_value));
        if (!imm16.m_value) {
            store16(ARM64Registers::zr, address);
            return;
        }

        move(imm16, getCachedDataTempRegisterIDAndInvalidate());
        store16(dataTempRegister, address);
    }

    void store8(RegisterID src, BaseIndex address)
    {
        if (address.scale == TimesOne) {
            if (auto baseGPR = tryFoldBaseAndOffsetPart(address)) {
                m_assembler.strb(src, baseGPR.value(), address.index, indexExtendType(address), address.scale);
                return;
            }
        }

        signExtend32ToPtr(TrustedImm32(address.offset), getCachedMemoryTempRegisterIDAndInvalidate());
        m_assembler.add<64>(memoryTempRegister, memoryTempRegister, address.index, indexExtendType(address), address.scale);
        m_assembler.strb(src, address.base, memoryTempRegister);
    }

    void store8(RegisterID src, const void* address)
    {
        move(TrustedImmPtr(address), getCachedMemoryTempRegisterIDAndInvalidate());
        m_assembler.strb(src, memoryTempRegister, 0);
    }

    void store8(RegisterID src, Address address)
    {
        if (tryStoreWithOffset<8>(src, address.base, address.offset))
            return;

        signExtend32ToPtr(TrustedImm32(address.offset), getCachedMemoryTempRegisterIDAndInvalidate());
        m_assembler.strb(src, address.base, memoryTempRegister);
    }

    void store8(TrustedImm32 imm, const void* address)
    {
        TrustedImm32 imm8(static_cast<int8_t>(imm.m_value));
        if (!imm8.m_value) {
            store8(ARM64Registers::zr, address);
            return;
        }

        move(imm8, getCachedDataTempRegisterIDAndInvalidate());
        store8(dataTempRegister, address);
    }

    void store8(TrustedImm32 imm, Address address)
    {
        TrustedImm32 imm8(static_cast<int8_t>(imm.m_value));
        if (!imm8.m_value) {
            store8(ARM64Registers::zr, address);
            return;
        }

        move(imm8, getCachedDataTempRegisterIDAndInvalidate());
        store8(dataTempRegister, address);
    }

    void store8(TrustedImm32 imm, BaseIndex address)
    {
        TrustedImm32 imm8(static_cast<int8_t>(imm.m_value));
        if (!imm8.m_value) {
            store8(ARM64Registers::zr, address);
            return;
        }

        move(imm8, getCachedDataTempRegisterIDAndInvalidate());
        store8(dataTempRegister, address);
    }

    void store8(RegisterID src, RegisterID dest, PostIndex simm)
    {
        m_assembler.strb(src, dest, simm);
    }

    void getEffectiveAddress(BaseIndex address, RegisterID dest)
    {
        m_assembler.add<64>(dest, address.base, address.index, Assembler::LSL, address.scale);
        if (address.offset)
            add64(TrustedImm32(address.offset), dest);
    }

    // Floating-point operations:

    static bool supportsFloatingPoint() { return true; }
    static bool supportsFloatingPointTruncate() { return true; }
    static bool supportsFloatingPointSqrt() { return true; }
    static bool supportsFloatingPointAbs() { return true; }
    static bool supportsFloatingPointRounding() { return true; }
    static bool supportsCountPopulation() { return true; }

    enum BranchTruncateType { BranchIfTruncateFailed, BranchIfTruncateSuccessful };

    void absDouble(FPRegisterID src, FPRegisterID dest)
    {
        m_assembler.fabs<64>(dest, src);
    }

    void absFloat(FPRegisterID src, FPRegisterID dest)
    {
        m_assembler.fabs<32>(dest, src);
    }

    void addDouble(FPRegisterID src, FPRegisterID dest)
    {
        addDouble(dest, src, dest);
    }

    void addDouble(FPRegisterID op1, FPRegisterID op2, FPRegisterID dest)
    {
        m_assembler.fadd<64>(dest, op1, op2);
    }

    void addDouble(Address src, FPRegisterID dest)
    {
        loadDouble(src, fpTempRegister);
        addDouble(fpTempRegister, dest);
    }

    void addDouble(AbsoluteAddress address, FPRegisterID dest)
    {
        loadDouble(TrustedImmPtr(address.m_ptr), fpTempRegister);
        addDouble(fpTempRegister, dest);
    }

    void addFloat(FPRegisterID op1, FPRegisterID op2, FPRegisterID dest)
    {
        m_assembler.fadd<32>(dest, op1, op2);
    }

    void ceilDouble(FPRegisterID src, FPRegisterID dest)
    {
        m_assembler.frintp<64>(dest, src);
    }

    void ceilFloat(FPRegisterID src, FPRegisterID dest)
    {
        m_assembler.frintp<32>(dest, src);
    }

    void floorDouble(FPRegisterID src, FPRegisterID dest)
    {
        m_assembler.frintm<64>(dest, src);
    }

    void floorFloat(FPRegisterID src, FPRegisterID dest)
    {
        m_assembler.frintm<32>(dest, src);
    }

    void roundTowardNearestIntDouble(FPRegisterID src, FPRegisterID dest)
    {
        m_assembler.frintn<64>(dest, src);
    }

    void roundTowardNearestIntFloat(FPRegisterID src, FPRegisterID dest)
    {
        m_assembler.frintn<32>(dest, src);
    }

    void roundTowardZeroDouble(FPRegisterID src, FPRegisterID dest)
    {
        m_assembler.frintz<64>(dest, src);
    }

    void roundTowardZeroFloat(FPRegisterID src, FPRegisterID dest)
    {
        m_assembler.frintz<32>(dest, src);
    }

    void roundTowardZeroInt32Double(FPRegisterID src, FPRegisterID dest)
    {
        ASSERT(supportsRoundFloatToIntegerFloat());
        m_assembler.frint32z<64>(dest, src);
    }

    void roundTowardZeroInt32Float(FPRegisterID src, FPRegisterID dest)
    {
        ASSERT(supportsRoundFloatToIntegerFloat());
        m_assembler.frint32z<32>(dest, src);
    }

    void roundTowardZeroInt64Double(FPRegisterID src, FPRegisterID dest)
    {
        ASSERT(supportsRoundFloatToIntegerFloat());
        m_assembler.frint64z<64>(dest, src);
    }

    void roundTowardZeroInt64Float(FPRegisterID src, FPRegisterID dest)
    {
        ASSERT(supportsRoundFloatToIntegerFloat());
        m_assembler.frint64z<32>(dest, src);
    }

    // Convert 'src' to an integer, and places the resulting 'dest'.
    // If the result is not representable as a 32 bit value, branch.
    // May also branch for some values that are representable in 32 bits
    // (specifically, in this case, 0).
    void branchConvertDoubleToInt32(FPRegisterID src, RegisterID dest, JumpList& failureCases, FPRegisterID, bool negZeroCheck = true)
    {
        m_assembler.fcvtns<32, 64>(dest, src);
        if (supportsRoundFloatToIntegerFloat())
            m_assembler.frint32z<64>(fpTempRegister, src);
        else {
            // Convert the integer result back to float & compare to the original value - if not equal or unordered (NaN) then jump.
            m_assembler.scvtf<64, 32>(fpTempRegister, dest);
        }
        failureCases.append(branchDouble(DoubleNotEqualOrUnordered, src, fpTempRegister));

        // Test for negative zero.
        if (negZeroCheck) {
            Jump valueIsNonZero = branchTest32(NonZero, dest);
            RegisterID scratch = getCachedMemoryTempRegisterIDAndInvalidate();
            m_assembler.fmov<64>(scratch, src);
            failureCases.append(makeTestBitAndBranch(scratch, 63, IsNonZero));
            valueIsNonZero.link(this);
        }
    }

    Jump branchDouble(DoubleCondition cond, FPRegisterID left, FPRegisterID right)
    {
        m_assembler.fcmp<64>(left, right);
        return jumpAfterFloatingPointCompare(cond);
    }

    Jump branchFloat(DoubleCondition cond, FPRegisterID left, FPRegisterID right)
    {
        m_assembler.fcmp<32>(left, right);
        return jumpAfterFloatingPointCompare(cond);
    }

    Jump branchDoubleWithZero(DoubleCondition cond, FPRegisterID left)
    {
        m_assembler.fcmp_0<64>(left);
        return jumpAfterFloatingPointCompare(cond);
    }

    Jump branchFloatWithZero(DoubleCondition cond, FPRegisterID left)
    {
        m_assembler.fcmp_0<32>(left);
        return jumpAfterFloatingPointCompare(cond);
    }

    void compareDouble(DoubleCondition cond, FPRegisterID left, FPRegisterID right, RegisterID dest)
    {
        floatingPointCompare(cond, dest, [&]() {
            m_assembler.fcmp<64>(left, right);
        });
    }

    void compareFloat(DoubleCondition cond, FPRegisterID left, FPRegisterID right, RegisterID dest)
    {
        floatingPointCompare(cond, dest, [&]() {
            m_assembler.fcmp<32>(left, right);
        });
    }

    void compareDoubleWithZero(DoubleCondition cond, FPRegisterID left, RegisterID dest)
    {
        floatingPointCompare(cond, dest, [&]() {
            m_assembler.fcmp_0<64>(left);
        });
    }

    void compareFloatWithZero(DoubleCondition cond, FPRegisterID left, RegisterID dest)
    {
        floatingPointCompare(cond, dest, [&]() {
            m_assembler.fcmp_0<32>(left);
        });
    }

    Jump branchDoubleNonZero(FPRegisterID reg, FPRegisterID)
    {
        m_assembler.fcmp_0<64>(reg);
        Jump unordered = makeBranch(Assembler::ConditionVS);
        Jump result = makeBranch(Assembler::ConditionNE);
        unordered.link(this);
        return result;
    }

    Jump branchDoubleZeroOrNaN(FPRegisterID reg, FPRegisterID)
    {
        m_assembler.fcmp_0<64>(reg);
        Jump unordered = makeBranch(Assembler::ConditionVS);
        Jump notEqual = makeBranch(Assembler::ConditionNE);
        unordered.link(this);
        // We get here if either unordered or equal.
        Jump result = jump();
        notEqual.link(this);
        return result;
    }

    Jump branchTruncateDoubleToInt32(FPRegisterID src, RegisterID dest, BranchTruncateType branchType = BranchIfTruncateFailed)
    {
        // Truncate to a 64-bit integer in dataTempRegister, copy the low 32-bit to dest.
        m_assembler.fcvtzs<64, 64>(getCachedDataTempRegisterIDAndInvalidate(), src);
        zeroExtend32ToWord(dataTempRegister, dest);
        // Check the low 32-bits sign extend to be equal to the full value.
        m_assembler.cmp<64>(dataTempRegister, dataTempRegister, Assembler::SXTW, 0);
        return Jump(makeBranch(branchType == BranchIfTruncateSuccessful ? Equal : NotEqual));
    }

    void convertDoubleToFloat(FPRegisterID src, FPRegisterID dest)
    {
        m_assembler.fcvt<32, 64>(dest, src);
    }

    void convertFloatToDouble(FPRegisterID src, FPRegisterID dest)
    {
        m_assembler.fcvt<64, 32>(dest, src);
    }

    void convertDoubleToFloat16(FPRegisterID src, FPRegisterID dest)
    {
        m_assembler.fcvt<16, 64>(dest, src);
    }

    void convertFloat16ToDouble(FPRegisterID src, FPRegisterID dest)
    {
        m_assembler.fcvt<64, 16>(dest, src);
    }

    void convertInt32ToDouble(TrustedImm32 imm, FPRegisterID dest)
    {
        move(imm, getCachedDataTempRegisterIDAndInvalidate());
        convertInt32ToDouble(dataTempRegister, dest);
    }
    
    void convertInt32ToDouble(RegisterID src, FPRegisterID dest)
    {
        m_assembler.scvtf<64, 32>(dest, src);
    }

    void convertInt32ToDouble(Address address, FPRegisterID dest)
    {
        load32(address, getCachedDataTempRegisterIDAndInvalidate());
        convertInt32ToDouble(dataTempRegister, dest);
    }

    void convertInt32ToDouble(AbsoluteAddress address, FPRegisterID dest)
    {
        load32(address.m_ptr, getCachedDataTempRegisterIDAndInvalidate());
        convertInt32ToDouble(dataTempRegister, dest);
    }

    void convertInt32ToFloat(RegisterID src, FPRegisterID dest)
    {
        m_assembler.scvtf<32, 32>(dest, src);
    }
    
    void convertInt64ToDouble(RegisterID src, FPRegisterID dest)
    {
        m_assembler.scvtf<64, 64>(dest, src);
    }

    void convertInt64ToFloat(RegisterID src, FPRegisterID dest)
    {
        m_assembler.scvtf<32, 64>(dest, src);
    }

    void convertUInt64ToDouble(RegisterID src, FPRegisterID dest)
    {
        m_assembler.ucvtf<64, 64>(dest, src);
    }

    void convertUInt64ToFloat(RegisterID src, FPRegisterID dest)
    {
        m_assembler.ucvtf<32, 64>(dest, src);
    }

    void divDouble(FPRegisterID src, FPRegisterID dest)
    {
        divDouble(dest, src, dest);
    }

    void divDouble(FPRegisterID op1, FPRegisterID op2, FPRegisterID dest)
    {
        m_assembler.fdiv<64>(dest, op1, op2);
    }

    void divFloat(FPRegisterID op1, FPRegisterID op2, FPRegisterID dest)
    {
        m_assembler.fdiv<32>(dest, op1, op2);
    }
    
    void loadVector(Address address, FPRegisterID dest)
    {
        if (tryLoadWithOffset<128>(dest, address.base, address.offset))
            return;

        signExtend32ToPtr(TrustedImm32(address.offset), getCachedMemoryTempRegisterIDAndInvalidate());
        m_assembler.ldr<128>(dest, address.base, memoryTempRegister);
    }

    void loadVector(BaseIndex address, FPRegisterID dest)
    {
        if (address.scale == TimesOne || address.scale == TimesEight) {
            if (auto baseGPR = tryFoldBaseAndOffsetPart(address)) {
                m_assembler.ldr<128>(dest, baseGPR.value(), address.index, indexExtendType(address), address.scale);
                return;
            }
        }

        signExtend32ToPtr(TrustedImm32(address.offset), getCachedMemoryTempRegisterIDAndInvalidate());
        m_assembler.add<64>(memoryTempRegister, memoryTempRegister, address.index, indexExtendType(address), address.scale);
        m_assembler.ldr<128>(dest, address.base, memoryTempRegister);
    }
    
    void loadVector(TrustedImmPtr address, FPRegisterID dest)
    {
        moveToCachedReg(address, cachedMemoryTempRegister());
        m_assembler.ldr<128>(dest, memoryTempRegister, ARM64Registers::zr);
    }

    void loadDouble(Address address, FPRegisterID dest)
    {
        if (tryLoadWithOffset<64>(dest, address.base, address.offset))
            return;

        signExtend32ToPtr(TrustedImm32(address.offset), getCachedMemoryTempRegisterIDAndInvalidate());
        m_assembler.ldr<64>(dest, address.base, memoryTempRegister);
    }

    void loadDouble(BaseIndex address, FPRegisterID dest)
    {
        if (address.scale == TimesOne || address.scale == TimesEight) {
            if (auto baseGPR = tryFoldBaseAndOffsetPart(address)) {
                m_assembler.ldr<64>(dest, baseGPR.value(), address.index, indexExtendType(address), address.scale);
                return;
            }
        }

        signExtend32ToPtr(TrustedImm32(address.offset), getCachedMemoryTempRegisterIDAndInvalidate());
        m_assembler.add<64>(memoryTempRegister, memoryTempRegister, address.index, indexExtendType(address), address.scale);
        m_assembler.ldr<64>(dest, address.base, memoryTempRegister);
    }
    
    void loadDouble(TrustedImmPtr address, FPRegisterID dest)
    {
        moveToCachedReg(address, cachedMemoryTempRegister());
        m_assembler.ldr<64>(dest, memoryTempRegister, ARM64Registers::zr);
    }

    void loadFloat(Address address, FPRegisterID dest)
    {
        if (tryLoadWithOffset<32>(dest, address.base, address.offset))
            return;

        signExtend32ToPtr(TrustedImm32(address.offset), getCachedMemoryTempRegisterIDAndInvalidate());
        m_assembler.ldr<32>(dest, address.base, memoryTempRegister);
    }

    void loadFloat(BaseIndex address, FPRegisterID dest)
    {
        if (address.scale == TimesOne || address.scale == TimesFour) {
            if (auto baseGPR = tryFoldBaseAndOffsetPart(address)) {
                m_assembler.ldr<32>(dest, baseGPR.value(), address.index, indexExtendType(address), address.scale);
                return;
            }
        }

        signExtend32ToPtr(TrustedImm32(address.offset), getCachedMemoryTempRegisterIDAndInvalidate());
        m_assembler.add<64>(memoryTempRegister, memoryTempRegister, address.index, indexExtendType(address), address.scale);
        m_assembler.ldr<32>(dest, address.base, memoryTempRegister);
    }

    void loadFloat(TrustedImmPtr address, FPRegisterID dest)
    {
        moveToCachedReg(address, cachedMemoryTempRegister());
        m_assembler.ldr<32>(dest, memoryTempRegister, ARM64Registers::zr);
    }

    void loadFloat16(Address address, FPRegisterID dest)
    {
        if (tryLoadWithOffset<16>(dest, address.base, address.offset))
            return;

        signExtend32ToPtr(TrustedImm32(address.offset), getCachedMemoryTempRegisterIDAndInvalidate());
        m_assembler.ldr<16>(dest, address.base, memoryTempRegister);
    }

    void loadFloat16(BaseIndex address, FPRegisterID dest)
    {
        if (address.scale == TimesOne || address.scale == TimesFour) {
            if (auto baseGPR = tryFoldBaseAndOffsetPart(address)) {
                m_assembler.ldr<16>(dest, baseGPR.value(), address.index, indexExtendType(address), address.scale);
                return;
            }
        }

        signExtend32ToPtr(TrustedImm32(address.offset), getCachedMemoryTempRegisterIDAndInvalidate());
        m_assembler.add<64>(memoryTempRegister, memoryTempRegister, address.index, indexExtendType(address), address.scale);
        m_assembler.ldr<16>(dest, address.base, memoryTempRegister);
    }

    void loadFloat16(TrustedImmPtr address, FPRegisterID dest)
    {
        moveToCachedReg(address, cachedMemoryTempRegister());
        m_assembler.ldr<16>(dest, memoryTempRegister, ARM64Registers::zr);
    }

    void moveDouble(FPRegisterID src, FPRegisterID dest)
    {
        m_assembler.fmov<64>(dest, src);
    }

    void moveVector(FPRegisterID src, FPRegisterID dest)
    {
        m_assembler.vorr<128>(dest, src, src);
    }

    void materializeVector(v128_t value, FPRegisterID dest)
    {
        if (bitEquals(value, vectorAllZeros())) {
            moveZeroToVector(dest);
            return;
        }
        move(TrustedImm64(value.u64x2[0]), scratchRegister());
        vectorSplatInt64(scratchRegister(), dest);
        move(TrustedImm64(value.u64x2[1]), scratchRegister());
        vectorReplaceLaneInt64(TrustedImm32(1), scratchRegister(), dest);
    }

    void moveZeroToDouble(FPRegisterID reg)
    {
        // Intentionally use 128bit width here to clear all part of this register with zero.
        m_assembler.movi<128>(reg, 0);
    }

    void moveZeroToFloat(FPRegisterID reg)
    {
        // Intentionally use 128bit width here to clear all part of this register with zero.
        m_assembler.movi<128>(reg, 0);
    }

    void moveZeroToFloat16(FPRegisterID reg)
    {
        // Intentionally use 128bit width here to clear all part of this register with zero.
        m_assembler.movi<128>(reg, 0);
    }

    void moveDoubleTo64(FPRegisterID src, RegisterID dest)
    {
        m_assembler.fmov<64>(dest, src);
    }

    void moveFloatTo32(FPRegisterID src, RegisterID dest)
    {
        m_assembler.fmov<32>(dest, src);
    }

    void moveFloat16To16(FPRegisterID src, RegisterID dest)
    {
        ASSERT(supportsFloat16());
        m_assembler.fmov<16>(dest, src);
    }

    void move64ToDouble(RegisterID src, FPRegisterID dest)
    {
        m_assembler.fmov<64>(dest, src);
    }

    void move64ToDouble(TrustedImm64 imm, FPRegisterID dest)
    {
        if (!imm.m_value) {
            moveZeroToDouble(dest);
            return;
        }

        if (ARM64Assembler::canEncodeFPImm<64>(imm.m_value)) {
            m_assembler.fmov<64>(dest, imm.m_value);
            return;
        }

        auto fpImm = ARM64FPImmediate::create64(static_cast<uint64_t>(imm.m_value));
        if (fpImm.isValid()) {
            m_assembler.movi<64>(dest, fpImm.value());
            return;
        }

        move(imm, getCachedDataTempRegisterIDAndInvalidate());
        m_assembler.fmov<64>(dest, dataTempRegister);
    }

    void move32ToFloat(RegisterID src, FPRegisterID dest)
    {
        m_assembler.fmov<32>(dest, src);
    }

    void move32ToFloat(TrustedImm32 imm, FPRegisterID dest)
    {
        if (!imm.m_value) {
            moveZeroToFloat(dest);
            return;
        }

        if (ARM64Assembler::canEncodeFPImm<32>(imm.m_value)) {
            m_assembler.fmov<32>(dest, imm.m_value);
            return;
        }

        move(imm, getCachedDataTempRegisterIDAndInvalidate());
        m_assembler.fmov<32>(dest, dataTempRegister);
    }

    void move16ToFloat16(RegisterID src, FPRegisterID dest)
    {
        ASSERT(supportsFloat16());
        m_assembler.fmov<16>(dest, src);
    }

    void move16ToFloat16(TrustedImm32 imm, FPRegisterID dest)
    {
        ASSERT(supportsFloat16());
        move(imm, getCachedDataTempRegisterIDAndInvalidate());
        m_assembler.fmov<16>(dest, dataTempRegister);
    }

    void moveConditionallyDouble(DoubleCondition cond, FPRegisterID left, FPRegisterID right, RegisterID src, RegisterID dest)
    {
        m_assembler.fcmp<64>(left, right);
        moveConditionallyAfterFloatingPointCompare<64>(cond, src, dest);
    }

    void moveConditionallyDouble(DoubleCondition cond, FPRegisterID left, FPRegisterID right, RegisterID thenCase, RegisterID elseCase, RegisterID dest)
    {
        m_assembler.fcmp<64>(left, right);
        moveConditionallyAfterFloatingPointCompare<64>(cond, thenCase, elseCase, dest);
    }

    void moveConditionallyDoubleWithZero(DoubleCondition cond, FPRegisterID left, RegisterID src, RegisterID dest)
    {
        m_assembler.fcmp_0<64>(left);
        moveConditionallyAfterFloatingPointCompare<64>(cond, src, dest);
    }

    void moveConditionallyDoubleWithZero(DoubleCondition cond, FPRegisterID left, RegisterID thenCase, RegisterID elseCase, RegisterID dest)
    {
        m_assembler.fcmp_0<64>(left);
        moveConditionallyAfterFloatingPointCompare<64>(cond, thenCase, elseCase, dest);
    }

    void moveConditionallyFloat(DoubleCondition cond, FPRegisterID left, FPRegisterID right, RegisterID src, RegisterID dest)
    {
        m_assembler.fcmp<32>(left, right);
        moveConditionallyAfterFloatingPointCompare<64>(cond, src, dest);
    }

    void moveConditionallyFloat(DoubleCondition cond, FPRegisterID left, FPRegisterID right, RegisterID thenCase, RegisterID elseCase, RegisterID dest)
    {
        m_assembler.fcmp<32>(left, right);
        moveConditionallyAfterFloatingPointCompare<64>(cond, thenCase, elseCase, dest);
    }

    void moveConditionallyFloatWithZero(DoubleCondition cond, FPRegisterID left, RegisterID src, RegisterID dest)
    {
        m_assembler.fcmp_0<32>(left);
        moveConditionallyAfterFloatingPointCompare<64>(cond, src, dest);
    }

    void moveConditionallyFloatWithZero(DoubleCondition cond, FPRegisterID left, RegisterID thenCase, RegisterID elseCase, RegisterID dest)
    {
        m_assembler.fcmp_0<32>(left);
        moveConditionallyAfterFloatingPointCompare<64>(cond, thenCase, elseCase, dest);
    }

    template<int datasize>
    void moveConditionallyAfterFloatingPointCompare(DoubleCondition cond, RegisterID src, RegisterID dest)
    {
        if (cond == DoubleNotEqualAndOrdered) {
            Jump unordered = makeBranch(Assembler::ConditionVS);
            m_assembler.csel<datasize>(dest, src, dest, Assembler::ConditionNE);
            unordered.link(this);
            return;
        }
        if (cond == DoubleEqualOrUnordered) {
            // If the compare is unordered, src is copied to dest and the
            // next csel has all arguments equal to src.
            // If the compare is ordered, dest is unchanged and EQ decides
            // what value to set.
            m_assembler.csel<datasize>(dest, src, dest, Assembler::ConditionVS);
            m_assembler.csel<datasize>(dest, src, dest, Assembler::ConditionEQ);
            return;
        }
        m_assembler.csel<datasize>(dest, src, dest, ARM64Condition(cond));
    }

    template<int datasize>
    void moveConditionallyAfterFloatingPointCompare(DoubleCondition cond, RegisterID thenCase, RegisterID elseCase, RegisterID dest)
    {
        if (cond == DoubleNotEqualAndOrdered) {
            if (dest == thenCase) {
                // If the compare is unordered, elseCase is copied to thenCase and the
                // next csel has all arguments equal to elseCase.
                // If the compare is ordered, dest is unchanged and NE decides
                // what value to set.
                m_assembler.csel<datasize>(thenCase, elseCase, thenCase, Assembler::ConditionVS);
                m_assembler.csel<datasize>(dest, thenCase, elseCase, Assembler::ConditionNE);
            } else {
                move(elseCase, dest);
                Jump unordered = makeBranch(Assembler::ConditionVS);
                m_assembler.csel<datasize>(dest, thenCase, elseCase, Assembler::ConditionNE);
                unordered.link(this);
            }
            return;
        }
        if (cond == DoubleEqualOrUnordered) {
            if (dest == elseCase) {
                // If the compare is unordered, thenCase is copied to elseCase and the
                // next csel has all arguments equal to thenCase.
                // If the compare is ordered, dest is unchanged and EQ decides
                // what value to set.
                m_assembler.csel<datasize>(elseCase, thenCase, elseCase, Assembler::ConditionVS);
                m_assembler.csel<datasize>(dest, thenCase, elseCase, Assembler::ConditionEQ);
            } else {
                move(thenCase, dest);
                Jump unordered = makeBranch(Assembler::ConditionVS);
                m_assembler.csel<datasize>(dest, thenCase, elseCase, Assembler::ConditionEQ);
                unordered.link(this);
            }
            return;
        }
        m_assembler.csel<datasize>(dest, thenCase, elseCase, ARM64Condition(cond));
    }

    template<int datasize>
    void moveDoubleConditionallyAfterFloatingPointCompare(DoubleCondition cond, FPRegisterID thenCase, FPRegisterID elseCase, FPRegisterID dest)
    {
        if (cond == DoubleNotEqualAndOrdered) {
            if (dest == thenCase) {
                // If the compare is unordered, elseCase is copied to thenCase and the
                // next fcsel has all arguments equal to elseCase.
                // If the compare is ordered, dest is unchanged and NE decides
                // what value to set.
                m_assembler.fcsel<datasize>(thenCase, elseCase, thenCase, Assembler::ConditionVS);
                m_assembler.fcsel<datasize>(dest, thenCase, elseCase, Assembler::ConditionNE);
            } else {
                m_assembler.fmov<64>(dest, elseCase);
                Jump unordered = makeBranch(Assembler::ConditionVS);
                m_assembler.fcsel<datasize>(dest, thenCase, elseCase, Assembler::ConditionNE);
                unordered.link(this);
            }
            return;
        }
        if (cond == DoubleEqualOrUnordered) {
            if (dest == elseCase) {
                // If the compare is unordered, thenCase is copied to elseCase and the
                // next csel has all arguments equal to thenCase.
                // If the compare is ordered, dest is unchanged and EQ decides
                // what value to set.
                m_assembler.fcsel<datasize>(elseCase, thenCase, elseCase, Assembler::ConditionVS);
                m_assembler.fcsel<datasize>(dest, thenCase, elseCase, Assembler::ConditionEQ);
            } else {
                m_assembler.fmov<64>(dest, thenCase);
                Jump unordered = makeBranch(Assembler::ConditionVS);
                m_assembler.fcsel<datasize>(dest, thenCase, elseCase, Assembler::ConditionEQ);
                unordered.link(this);
            }
            return;
        }
        m_assembler.fcsel<datasize>(dest, thenCase, elseCase, ARM64Condition(cond));
    }

    void moveDoubleConditionallyDouble(DoubleCondition cond, FPRegisterID left, FPRegisterID right, FPRegisterID thenCase, FPRegisterID elseCase, FPRegisterID dest)
    {
        m_assembler.fcmp<64>(left, right);
        moveDoubleConditionallyAfterFloatingPointCompare<64>(cond, thenCase, elseCase, dest);
    }

    void moveDoubleConditionallyDoubleWithZero(DoubleCondition cond, FPRegisterID left, FPRegisterID thenCase, FPRegisterID elseCase, FPRegisterID dest)
    {
        m_assembler.fcmp_0<64>(left);
        moveDoubleConditionallyAfterFloatingPointCompare<64>(cond, thenCase, elseCase, dest);
    }

    void moveDoubleConditionallyFloat(DoubleCondition cond, FPRegisterID left, FPRegisterID right, FPRegisterID thenCase, FPRegisterID elseCase, FPRegisterID dest)
    {
        m_assembler.fcmp<32>(left, right);
        moveDoubleConditionallyAfterFloatingPointCompare<64>(cond, thenCase, elseCase, dest);
    }

    void moveDoubleConditionallyFloatWithZero(DoubleCondition cond, FPRegisterID left, FPRegisterID thenCase, FPRegisterID elseCase, FPRegisterID dest)
    {
        m_assembler.fcmp_0<32>(left);
        moveDoubleConditionallyAfterFloatingPointCompare<64>(cond, thenCase, elseCase, dest);
    }

    void mulDouble(FPRegisterID src, FPRegisterID dest)
    {
        mulDouble(dest, src, dest);
    }

    void mulDouble(FPRegisterID op1, FPRegisterID op2, FPRegisterID dest)
    {
        m_assembler.fmul<64>(dest, op1, op2);
    }

    void mulDouble(Address src, FPRegisterID dest)
    {
        loadDouble(src, fpTempRegister);
        mulDouble(fpTempRegister, dest);
    }

    void mulFloat(FPRegisterID op1, FPRegisterID op2, FPRegisterID dest)
    {
        m_assembler.fmul<32>(dest, op1, op2);
    }

    void andDouble(FPRegisterID op1, FPRegisterID op2, FPRegisterID dest)
    {
        m_assembler.vand<64>(dest, op1, op2);
    }

    void andFloat(FPRegisterID op1, FPRegisterID op2, FPRegisterID dest)
    {
        andDouble(op1, op2, dest);
    }

    void orDouble(FPRegisterID op1, FPRegisterID op2, FPRegisterID dest)
    {
        m_assembler.vorr<64>(dest, op1, op2);
    }

    void orFloat(FPRegisterID op1, FPRegisterID op2, FPRegisterID dest)
    {
        orDouble(op1, op2, dest);
    }

    void floatMax(FPRegisterID op1, FPRegisterID op2, FPRegisterID dest)
    {
        m_assembler.fmax<32>(dest, op1, op2);
    }

    void floatMin(FPRegisterID op1, FPRegisterID op2, FPRegisterID dest)
    {
        m_assembler.fmin<32>(dest, op1, op2);
    }

    void doubleMax(FPRegisterID op1, FPRegisterID op2, FPRegisterID dest)
    {
        m_assembler.fmax<64>(dest, op1, op2);
    }

    void doubleMin(FPRegisterID op1, FPRegisterID op2, FPRegisterID dest)
    {
        m_assembler.fmin<64>(dest, op1, op2);
    }

    void negateDouble(FPRegisterID src, FPRegisterID dest)
    {
        m_assembler.fneg<64>(dest, src);
    }

    void negateFloat(FPRegisterID src, FPRegisterID dest)
    {
        m_assembler.fneg<32>(dest, src);
    }

    void sqrtDouble(FPRegisterID src, FPRegisterID dest)
    {
        m_assembler.fsqrt<64>(dest, src);
    }

    void sqrtFloat(FPRegisterID src, FPRegisterID dest)
    {
        m_assembler.fsqrt<32>(dest, src);
    }

    void storeDouble(FPRegisterID src, Address address)
    {
        if (tryStoreWithOffset<64>(src, address.base, address.offset))
            return;

        signExtend32ToPtr(TrustedImm32(address.offset), getCachedMemoryTempRegisterIDAndInvalidate());
        m_assembler.str<64>(src, address.base, memoryTempRegister);
    }

    void storeDouble(FPRegisterID src, TrustedImmPtr address)
    {
        moveToCachedReg(address, cachedMemoryTempRegister());
        m_assembler.str<64>(src, memoryTempRegister, ARM64Registers::zr);
    }

    void storeDouble(FPRegisterID src, BaseIndex address)
    {
        if (address.scale == TimesOne || address.scale == TimesEight) {
            if (auto baseGPR = tryFoldBaseAndOffsetPart(address)) {
                m_assembler.str<64>(src, baseGPR.value(), address.index, indexExtendType(address), address.scale);
                return;
            }
        }

        signExtend32ToPtr(TrustedImm32(address.offset), getCachedMemoryTempRegisterIDAndInvalidate());
        m_assembler.add<64>(memoryTempRegister, memoryTempRegister, address.index, indexExtendType(address), address.scale);
        m_assembler.str<64>(src, address.base, memoryTempRegister);
    }

    void storeFloat(FPRegisterID src, Address address)
    {
        if (tryStoreWithOffset<32>(src, address.base, address.offset))
            return;

        signExtend32ToPtr(TrustedImm32(address.offset), getCachedMemoryTempRegisterIDAndInvalidate());
        m_assembler.str<32>(src, address.base, memoryTempRegister);
    }

    void storeFloat(FPRegisterID src, BaseIndex address)
    {
        if (address.scale == TimesOne || address.scale == TimesFour) {
            if (auto baseGPR = tryFoldBaseAndOffsetPart(address)) {
                m_assembler.str<32>(src, baseGPR.value(), address.index, indexExtendType(address), address.scale);
                return;
            }
        }

        signExtend32ToPtr(TrustedImm32(address.offset), getCachedMemoryTempRegisterIDAndInvalidate());
        m_assembler.add<64>(memoryTempRegister, memoryTempRegister, address.index, indexExtendType(address), address.scale);
        m_assembler.str<32>(src, address.base, memoryTempRegister);
    }

    void storeVector(FPRegisterID src, Address address)
    {
        ASSERT(Options::useWasmSIMD());
        if (tryStoreWithOffset<128>(src, address.base, address.offset))
            return;

        signExtend32ToPtr(TrustedImm32(address.offset), getCachedMemoryTempRegisterIDAndInvalidate());
        m_assembler.str<128>(src, address.base, memoryTempRegister);
    }

    void storeVector(FPRegisterID src, TrustedImmPtr address)
    {
        ASSERT(Options::useWasmSIMD());
        moveToCachedReg(address, cachedMemoryTempRegister());
        m_assembler.str<128>(src, memoryTempRegister, ARM64Registers::zr);
    }

    void storeVector(FPRegisterID src, BaseIndex address)
    {
        ASSERT(Options::useWasmSIMD());
        if (address.scale == TimesOne || address.scale == TimesEight) {
            if (auto baseGPR = tryFoldBaseAndOffsetPart(address)) {
                m_assembler.str<128>(src, baseGPR.value(), address.index, indexExtendType(address), address.scale);
                return;
            }
        }

        signExtend32ToPtr(TrustedImm32(address.offset), getCachedMemoryTempRegisterIDAndInvalidate());
        m_assembler.add<64>(memoryTempRegister, memoryTempRegister, address.index, indexExtendType(address), address.scale);
        m_assembler.str<128>(src, address.base, memoryTempRegister);
    }

    void storeFloat16(FPRegisterID src, Address address)
    {
        if (tryStoreWithOffset<16>(src, address.base, address.offset))
            return;

        signExtend32ToPtr(TrustedImm32(address.offset), getCachedMemoryTempRegisterIDAndInvalidate());
        m_assembler.str<16>(src, address.base, memoryTempRegister);
    }

    void storeFloat16(FPRegisterID src, BaseIndex address)
    {
        if (address.scale == TimesOne || address.scale == TimesFour) {
            if (auto baseGPR = tryFoldBaseAndOffsetPart(address)) {
                m_assembler.str<16>(src, baseGPR.value(), address.index, indexExtendType(address), address.scale);
                return;
            }
        }

        signExtend32ToPtr(TrustedImm32(address.offset), getCachedMemoryTempRegisterIDAndInvalidate());
        m_assembler.add<64>(memoryTempRegister, memoryTempRegister, address.index, indexExtendType(address), address.scale);
        m_assembler.str<16>(src, address.base, memoryTempRegister);
    }

    void subDouble(FPRegisterID src, FPRegisterID dest)
    {
        subDouble(dest, src, dest);
    }

    void subDouble(FPRegisterID op1, FPRegisterID op2, FPRegisterID dest)
    {
        m_assembler.fsub<64>(dest, op1, op2);
    }

    void subDouble(Address src, FPRegisterID dest)
    {
        loadDouble(src, fpTempRegister);
        subDouble(fpTempRegister, dest);
    }

    void subFloat(FPRegisterID op1, FPRegisterID op2, FPRegisterID dest)
    {
        m_assembler.fsub<32>(dest, op1, op2);
    }

    // Result is undefined if the value is outside of the integer range.
    void truncateDoubleToInt32(FPRegisterID src, RegisterID dest)
    {
        m_assembler.fcvtzs<32, 64>(dest, src);
    }

    void truncateDoubleToUint32(FPRegisterID src, RegisterID dest)
    {
        m_assembler.fcvtzu<32, 64>(dest, src);
    }

    void truncateDoubleToInt64(FPRegisterID src, RegisterID dest)
    {
        m_assembler.fcvtzs<64, 64>(dest, src);
    }

    void truncateDoubleToUint64(FPRegisterID src, RegisterID dest, FPRegisterID, FPRegisterID)
    {
        truncateDoubleToUint64(src, dest);
    }

    void truncateDoubleToUint64(FPRegisterID src, RegisterID dest)
    {
        m_assembler.fcvtzu<64, 64>(dest, src);
    }

    void truncateFloatToInt32(FPRegisterID src, RegisterID dest)
    {
        m_assembler.fcvtzs<32, 32>(dest, src);
    }

    void truncateFloatToUint32(FPRegisterID src, RegisterID dest)
    {
        m_assembler.fcvtzu<32, 32>(dest, src);
    }

    void truncateFloatToInt64(FPRegisterID src, RegisterID dest)
    {
        m_assembler.fcvtzs<64, 32>(dest, src);
    }

    void truncateFloatToUint64(FPRegisterID src, RegisterID dest, FPRegisterID, FPRegisterID)
    {
        truncateFloatToUint64(src, dest);
    }

    void truncateFloatToUint64(FPRegisterID src, RegisterID dest)
    {
        m_assembler.fcvtzu<64, 32>(dest, src);
    }

    // Stack manipulation operations:
    //
    // The ABI is assumed to provide a stack abstraction to memory,
    // containing machine word sized units of data. Push and pop
    // operations add and remove a single register sized unit of data
    // to or from the stack. These operations are not supported on
    // ARM64. Peek and poke operations read or write values on the
    // stack, without moving the current stack position. Additionally,
    // there are popToRestore and pushToSave operations, which are
    // designed just for quick-and-dirty saving and restoring of
    // temporary values. These operations don't claim to have any
    // ABI compatibility.
    
    void pop(RegisterID) NO_RETURN_DUE_TO_CRASH
    {
        CRASH();
    }

    void push(RegisterID) NO_RETURN_DUE_TO_CRASH
    {
        CRASH();
    }

    void push(Address) NO_RETURN_DUE_TO_CRASH
    {
        CRASH();
    }

    void push(TrustedImm32) NO_RETURN_DUE_TO_CRASH
    {
        CRASH();
    }

    void popPair(RegisterID dest1, RegisterID dest2)
    {
        m_assembler.ldp<64>(dest1, dest2, ARM64Registers::sp, PairPostIndex(16));
    }

    void pushPair(RegisterID src1, RegisterID src2)
    {
        m_assembler.stp<64>(src1, src2, ARM64Registers::sp, PairPreIndex(-16));
    }

    void popToRestore(RegisterID dest)
    {
        m_assembler.ldr<64>(dest, ARM64Registers::sp, PostIndex(16));
    }

    void pushToSave(RegisterID src)
    {
        m_assembler.str<64>(src, ARM64Registers::sp, PreIndex(-16));
    }
    
    void pushToSaveImmediateWithoutTouchingRegisters(TrustedImm32 imm)
    {
        // We can use any non-hardware reserved register here since we restore its value.
        // We pick dataTempRegister arbitrarily. We don't need to invalidate it here since
        // we restore its original value.
        RegisterID reg = dataTempRegister;

        pushPair(reg, reg);
        move(imm, reg);
        store64(reg, Address(stackPointerRegister));
        load64(Address(stackPointerRegister, 8), reg);
    }

    void pushToSave(Address address)
    {
        load32(address, getCachedDataTempRegisterIDAndInvalidate());
        pushToSave(dataTempRegister);
    }

    void pushToSave(TrustedImm32 imm)
    {
        move(imm, getCachedDataTempRegisterIDAndInvalidate());
        pushToSave(dataTempRegister);
    }
    
    void popToRestore(FPRegisterID dest)
    {
        loadDouble(Address(stackPointerRegister), dest);
        add64(TrustedImm32(16), stackPointerRegister);
    }
    
    void pushToSave(FPRegisterID src)
    {
        sub64(TrustedImm32(16), stackPointerRegister);
        storeDouble(src, Address(stackPointerRegister));
    }

    static constexpr ptrdiff_t pushToSaveByteOffset() { return 16; }

    // Register move operations:

    void move(RegisterID src, RegisterID dest)
    {
        if (src != dest) {
            if (src == ARM64Registers::zr && dest != ARM64Registers::sp)
                m_assembler.movz<64>(dest, 0);
            else
                m_assembler.mov<64>(dest, src);
        }
    }

    void move(TrustedImm32 imm, RegisterID dest)
    {
        moveInternal<TrustedImm32, int32_t>(imm, dest);
    }

    void move(TrustedImmPtr imm, RegisterID dest)
    {
        moveInternal<TrustedImmPtr, intptr_t>(imm, dest);
    }

    void move(TrustedImm64 imm, RegisterID dest)
    {
        moveInternal<TrustedImm64, int64_t>(imm, dest);
    }

    void swap(RegisterID reg1, RegisterID reg2)
    {
        if (reg1 == reg2)
            return;
        move(reg1, getCachedDataTempRegisterIDAndInvalidate());
        move(reg2, reg1);
        move(dataTempRegister, reg2);
    }

    void swapDouble(FPRegisterID reg1, FPRegisterID reg2)
    {
        if (reg1 == reg2)
            return;
        moveDouble(reg1, fpTempRegister);
        moveDouble(reg2, reg1);
        moveDouble(fpTempRegister, reg2);
    }

    void signExtend32To64(TrustedImm32 imm, RegisterID dest)
    {
        move(TrustedImm64(imm.m_value), dest);
    }

    void signExtend32To64(RegisterID src, RegisterID dest)
    {
        m_assembler.sxtw(dest, src);
    }

    void signExtend32ToPtr(TrustedImm32 imm, RegisterID dest)
    {
        signExtend32To64(imm, dest);
    }

    void signExtend32ToPtr(RegisterID src, RegisterID dest)
    {
        signExtend32To64(src, dest);
    }

    void zeroExtend32ToWord(RegisterID src, RegisterID dest)
    {
        and64(TrustedImm64(0xffffffffU), src, dest);
    }

    void zeroExtend48ToWord(RegisterID src, RegisterID dest)
    {
        m_assembler.ubfx<64>(dest, src, 0, 48);
    }

    void moveConditionally32(RelationalCondition cond, RegisterID left, RegisterID right, RegisterID src, RegisterID dest)
    {
        m_assembler.cmp<32>(left, right);
        m_assembler.csel<64>(dest, src, dest, ARM64Condition(cond));
    }

    void moveConditionally32(RelationalCondition cond, RegisterID left, RegisterID right, RegisterID thenCase, RegisterID elseCase, RegisterID dest)
    {
        m_assembler.cmp<32>(left, right);
        m_assembler.csel<64>(dest, thenCase, elseCase, ARM64Condition(cond));
    }

    void moveConditionally32(RelationalCondition cond, RegisterID left, TrustedImm32 right, RegisterID thenCase, RegisterID elseCase, RegisterID dest)
    {
        auto immediate = right.m_value;
        if (!immediate) {
            if (auto resultCondition = commuteCompareToZeroIntoTest(cond)) {
                moveConditionallyTest32(*resultCondition, left, left, thenCase, elseCase, dest);
                return;
            }
        }

        if (auto tuple = tryExtractShiftedImm(immediate)) {
            auto [u12, shift, inverted] = tuple.value();
            if (!inverted)
                m_assembler.cmp<32>(left, u12, shift);
            else
                m_assembler.cmn<32>(left, u12, shift);
        } else {
            moveToCachedReg(right, dataMemoryTempRegister());
            m_assembler.cmp<32>(left, dataTempRegister);
        }
        m_assembler.csel<64>(dest, thenCase, elseCase, ARM64Condition(cond));
    }

    void moveConditionally64(RelationalCondition cond, RegisterID left, RegisterID right, RegisterID src, RegisterID dest)
    {
        m_assembler.cmp<64>(left, right);
        m_assembler.csel<64>(dest, src, dest, ARM64Condition(cond));
    }

    void moveConditionally64(RelationalCondition cond, RegisterID left, RegisterID right, RegisterID thenCase, RegisterID elseCase, RegisterID dest)
    {
        m_assembler.cmp<64>(left, right);
        m_assembler.csel<64>(dest, thenCase, elseCase, ARM64Condition(cond));
    }

    void moveConditionally64(RelationalCondition cond, RegisterID left, TrustedImm32 right, RegisterID thenCase, RegisterID elseCase, RegisterID dest)
    {
        auto immediate = right.m_value;
        if (!immediate) {
            if (auto resultCondition = commuteCompareToZeroIntoTest(cond)) {
                moveConditionallyTest64(*resultCondition, left, left, thenCase, elseCase, dest);
                return;
            }
        }

        if (auto tuple = tryExtractShiftedImm(immediate)) {
            auto [u12, shift, inverted] = tuple.value();
            if (!inverted)
                m_assembler.cmp<64>(left, u12, shift);
            else
                m_assembler.cmn<64>(left, u12, shift);
        } else {
            moveToCachedReg(right, dataMemoryTempRegister());
            m_assembler.cmp<64>(left, dataTempRegister);
        }
        m_assembler.csel<64>(dest, thenCase, elseCase, ARM64Condition(cond));
    }

    void moveConditionally64(RelationalCondition cond, RegisterID left, TrustedImm64 right, RegisterID thenCase, RegisterID elseCase, RegisterID dest)
    {
        auto immediate = right.m_value;
        if (!immediate) {
            if (auto resultCondition = commuteCompareToZeroIntoTest(cond)) {
                moveConditionallyTest64(*resultCondition, left, left, thenCase, elseCase, dest);
                return;
            }
        }

        if (auto tuple = tryExtractShiftedImm(immediate)) {
            auto [u12, shift, inverted] = tuple.value();
            if (!inverted)
                m_assembler.cmp<64>(left, u12, shift);
            else
                m_assembler.cmn<64>(left, u12, shift);
        } else {
            moveToCachedReg(right, dataMemoryTempRegister());
            m_assembler.cmp<64>(left, dataTempRegister);
        }
        m_assembler.csel<64>(dest, thenCase, elseCase, ARM64Condition(cond));
    }

    void moveConditionallyTest32(ResultCondition cond, RegisterID testReg, RegisterID mask, RegisterID src, RegisterID dest)
    {
        m_assembler.tst<32>(testReg, mask);
        m_assembler.csel<64>(dest, src, dest, ARM64Condition(cond));
    }

    void moveConditionallyTest32(ResultCondition cond, RegisterID testReg, TrustedImm32 mask, RegisterID src, RegisterID dest)
    {
        test32(testReg, mask);
        m_assembler.csel<64>(dest, src, dest, ARM64Condition(cond));
    }

    void moveConditionallyTest32(ResultCondition cond, RegisterID left, RegisterID right, RegisterID thenCase, RegisterID elseCase, RegisterID dest)
    {
        m_assembler.tst<32>(left, right);
        m_assembler.csel<64>(dest, thenCase, elseCase, ARM64Condition(cond));
    }

    void moveConditionallyTest32(ResultCondition cond, RegisterID left, TrustedImm32 right, RegisterID thenCase, RegisterID elseCase, RegisterID dest)
    {
        test32(left, right);
        m_assembler.csel<64>(dest, thenCase, elseCase, ARM64Condition(cond));
    }

    void moveConditionallyTest64(ResultCondition cond, RegisterID testReg, RegisterID mask, RegisterID src, RegisterID dest)
    {
        m_assembler.tst<64>(testReg, mask);
        m_assembler.csel<64>(dest, src, dest, ARM64Condition(cond));
    }

    void moveConditionallyTest64(ResultCondition cond, RegisterID left, RegisterID right, RegisterID thenCase, RegisterID elseCase, RegisterID dest)
    {
        m_assembler.tst<64>(left, right);
        m_assembler.csel<64>(dest, thenCase, elseCase, ARM64Condition(cond));
    }

    void moveDoubleConditionally32(RelationalCondition cond, RegisterID left, RegisterID right, FPRegisterID thenCase, FPRegisterID elseCase, FPRegisterID dest)
    {
        m_assembler.cmp<32>(left, right);
        m_assembler.fcsel<64>(dest, thenCase, elseCase, ARM64Condition(cond));
    }

    void moveDoubleConditionally32(RelationalCondition cond, RegisterID left, TrustedImm32 right, FPRegisterID thenCase, FPRegisterID elseCase, FPRegisterID dest)
    {
        auto immediate = right.m_value;
        if (!immediate) {
            if (auto resultCondition = commuteCompareToZeroIntoTest(cond)) {
                moveDoubleConditionallyTest32(*resultCondition, left, left, thenCase, elseCase, dest);
                return;
            }
        }

        if (auto tuple = tryExtractShiftedImm(immediate)) {
            auto [u12, shift, inverted] = tuple.value();
            if (!inverted)
                m_assembler.cmp<32>(left, u12, shift);
            else
                m_assembler.cmn<32>(left, u12, shift);
        } else {
            moveToCachedReg(right, dataMemoryTempRegister());
            m_assembler.cmp<32>(left, dataTempRegister);
        }
        m_assembler.fcsel<64>(dest, thenCase, elseCase, ARM64Condition(cond));
    }

    void moveDoubleConditionally64(RelationalCondition cond, RegisterID left, RegisterID right, FPRegisterID thenCase, FPRegisterID elseCase, FPRegisterID dest)
    {
        m_assembler.cmp<64>(left, right);
        m_assembler.fcsel<64>(dest, thenCase, elseCase, ARM64Condition(cond));
    }

    void moveDoubleConditionally64(RelationalCondition cond, RegisterID left, TrustedImm32 right, FPRegisterID thenCase, FPRegisterID elseCase, FPRegisterID dest)
    {
        auto immediate = right.m_value;
        if (!immediate) {
            if (auto resultCondition = commuteCompareToZeroIntoTest(cond)) {
                moveDoubleConditionallyTest64(*resultCondition, left, left, thenCase, elseCase, dest);
                return;
            }
        }

        if (auto tuple = tryExtractShiftedImm(immediate)) {
            auto [u12, shift, inverted] = tuple.value();
            if (!inverted)
                m_assembler.cmp<64>(left, u12, shift);
            else
                m_assembler.cmn<64>(left, u12, shift);
        } else {
            moveToCachedReg(right, dataMemoryTempRegister());
            m_assembler.cmp<64>(left, dataTempRegister);
        }
        m_assembler.fcsel<64>(dest, thenCase, elseCase, ARM64Condition(cond));
    }

    void moveDoubleConditionallyTest32(ResultCondition cond, RegisterID left, RegisterID right, FPRegisterID thenCase, FPRegisterID elseCase, FPRegisterID dest)
    {
        m_assembler.tst<32>(left, right);
        m_assembler.fcsel<64>(dest, thenCase, elseCase, ARM64Condition(cond));
    }

    void moveDoubleConditionallyTest32(ResultCondition cond, RegisterID left, TrustedImm32 right, FPRegisterID thenCase, FPRegisterID elseCase, FPRegisterID dest)
    {
        test32(left, right);
        m_assembler.fcsel<64>(dest, thenCase, elseCase, ARM64Condition(cond));
    }

    void moveDoubleConditionallyTest64(ResultCondition cond, RegisterID left, RegisterID right, FPRegisterID thenCase, FPRegisterID elseCase, FPRegisterID dest)
    {
        m_assembler.tst<64>(left, right);
        m_assembler.fcsel<64>(dest, thenCase, elseCase, ARM64Condition(cond));
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

    Jump branch32(RelationalCondition cond, RegisterID left, RegisterID right)
    {
        m_assembler.cmp<32>(left, right);
        return Jump(makeBranch(cond));
    }

    Jump branch32(RelationalCondition cond, RegisterID left, TrustedImm32 right)
    {
        auto immediate = right.m_value;
        if (!immediate) {
            if (auto resultCondition = commuteCompareToZeroIntoTest(cond))
                return branchTest32(*resultCondition, left, left);
        }

        if (auto tuple = tryExtractShiftedImm(immediate)) {
            auto [u12, shift, inverted] = tuple.value();
            if (!inverted)
                m_assembler.cmp<32>(left, u12, shift);
            else
                m_assembler.cmn<32>(left, u12, shift);
        } else {
            moveToCachedReg(right, dataMemoryTempRegister());
            m_assembler.cmp<32>(left, dataTempRegister);
        }
        return Jump(makeBranch(cond));
    }

    Jump branch32(RelationalCondition cond, RegisterID left, Address right)
    {
        load32(right, getCachedMemoryTempRegisterIDAndInvalidate());
        return branch32(cond, left, memoryTempRegister);
    }

    Jump branch32(RelationalCondition cond, Address left, RegisterID right)
    {
        load32(left, getCachedMemoryTempRegisterIDAndInvalidate());
        return branch32(cond, memoryTempRegister, right);
    }

    Jump branch32(RelationalCondition cond, Address left, TrustedImm32 right)
    {
        load32(left, getCachedMemoryTempRegisterIDAndInvalidate());
        return branch32(cond, memoryTempRegister, right);
    }

    Jump branch32(RelationalCondition cond, BaseIndex left, TrustedImm32 right)
    {
        load32(left, getCachedMemoryTempRegisterIDAndInvalidate());
        return branch32(cond, memoryTempRegister, right);
    }

    Jump branch32(RelationalCondition cond, AbsoluteAddress left, RegisterID right)
    {
        load32(left.m_ptr, getCachedDataTempRegisterIDAndInvalidate());
        return branch32(cond, dataTempRegister, right);
    }

    Jump branch32(RelationalCondition cond, AbsoluteAddress left, TrustedImm32 right)
    {
        load32(left.m_ptr, getCachedMemoryTempRegisterIDAndInvalidate());
        return branch32(cond, memoryTempRegister, right);
    }

    Jump branch64(RelationalCondition cond, RegisterID left, RegisterID right)
    {
        if (right == ARM64Registers::sp) {
            if (cond == Equal && left != ARM64Registers::sp) {
                // CMP can only use SP for the left argument, since we are testing for equality, the order
                // does not matter here.
                std::swap(left, right);
            } else {
                move(right, getCachedDataTempRegisterIDAndInvalidate());
                right = dataTempRegister;
            }
        }
        m_assembler.cmp<64>(left, right);
        return Jump(makeBranch(cond));
    }

    Jump branch64(RelationalCondition cond, RegisterID left, TrustedImm32 right)
    {
        auto immediate = right.m_value;
        if (!immediate) {
            if (auto resultCondition = commuteCompareToZeroIntoTest(cond))
                return branchTest64(*resultCondition, left, left);
        }

        if (auto tuple = tryExtractShiftedImm(immediate)) {
            auto [u12, shift, inverted] = tuple.value();
            if (!inverted)
                m_assembler.cmp<64>(left, u12, shift);
            else
                m_assembler.cmn<64>(left, u12, shift);
        } else {
            moveToCachedReg(right, dataMemoryTempRegister());
            m_assembler.cmp<64>(left, dataTempRegister);
        }
        return Jump(makeBranch(cond));
    }

    Jump branch64(RelationalCondition cond, RegisterID left, TrustedImm64 right)
    {
        auto immediate = right.m_value;
        if (!immediate) {
            if (auto resultCondition = commuteCompareToZeroIntoTest(cond))
                return branchTest64(*resultCondition, left, left);
        }

        if (auto tuple = tryExtractShiftedImm(immediate)) {
            auto [u12, shift, inverted] = tuple.value();
            if (!inverted)
                m_assembler.cmp<64>(left, u12, shift);
            else
                m_assembler.cmn<64>(left, u12, shift);
        } else {
            moveToCachedReg(right, dataMemoryTempRegister());
            m_assembler.cmp<64>(left, dataTempRegister);
        }
        return Jump(makeBranch(cond));
    }

    Jump branch64(RelationalCondition cond, RegisterID left, Imm64 right)
    {
        return branch64(cond, left, right.asTrustedImm64());
    }

    Jump branch64(RelationalCondition cond, RegisterID left, Address right)
    {
        load64(right, getCachedMemoryTempRegisterIDAndInvalidate());
        return branch64(cond, left, memoryTempRegister);
    }

    Jump branch64(RelationalCondition cond, AbsoluteAddress left, RegisterID right)
    {
        load64(left.m_ptr, getCachedDataTempRegisterIDAndInvalidate());
        return branch64(cond, dataTempRegister, right);
    }

    Jump branch64(RelationalCondition cond, Address left, RegisterID right)
    {
        load64(left, getCachedMemoryTempRegisterIDAndInvalidate());
        return branch64(cond, memoryTempRegister, right);
    }

    Jump branch64(RelationalCondition cond, Address left, TrustedImm64 right)
    {
        load64(left, getCachedMemoryTempRegisterIDAndInvalidate());
        return branch64(cond, memoryTempRegister, right);
    }

    Jump branch64(RelationalCondition cond, BaseIndex left, RegisterID right)
    {
        load64(left, getCachedMemoryTempRegisterIDAndInvalidate());
        return branch64(cond, memoryTempRegister, right);
    }

    Jump branch64(RelationalCondition cond, Address left, Address right)
    {
        // load64 clobbers memoryTempRegister, thus we should first use dataTempRegister here.
        load64(left, getCachedDataTempRegisterIDAndInvalidate());
        // And branch64 will use memoryTempRegister to load right to a register.
        return branch64(cond, dataTempRegister, right);
    }

    Jump branchPtr(RelationalCondition cond, Address left, Address right)
    {
        return branch64(cond, left, right);
    }

    Jump branchPtr(RelationalCondition cond, BaseIndex left, RegisterID right)
    {
        return branch64(cond, left, right);
    }

    Jump branch8(RelationalCondition cond, Address left, TrustedImm32 right)
    {
        TrustedImm32 right8 = MacroAssemblerHelpers::mask8OnCondition(*this, cond, right);
        MacroAssemblerHelpers::load8OnCondition(*this, cond, left, getCachedMemoryTempRegisterIDAndInvalidate());
        return branch32(cond, memoryTempRegister, right8);
    }

    Jump branch8(RelationalCondition cond, BaseIndex left, TrustedImm32 right)
    {
        TrustedImm32 right8 = MacroAssemblerHelpers::mask8OnCondition(*this, cond, right);
        MacroAssemblerHelpers::load8OnCondition(*this, cond, left, getCachedMemoryTempRegisterIDAndInvalidate());
        return branch32(cond, memoryTempRegister, right8);
    }

    Jump branch8(RelationalCondition cond, AbsoluteAddress left, TrustedImm32 right)
    {
        TrustedImm32 right8 = MacroAssemblerHelpers::mask8OnCondition(*this, cond, right);
        MacroAssemblerHelpers::load8OnCondition(*this, cond, left.m_ptr, getCachedMemoryTempRegisterIDAndInvalidate());
        return branch32(cond, memoryTempRegister, right8);
    }

    Jump branch16(RelationalCondition cond, Address left, TrustedImm32 right)
    {
        TrustedImm32 right16 = MacroAssemblerHelpers::mask16OnCondition(*this, cond, right);
        MacroAssemblerHelpers::load16OnCondition(*this, cond, left, getCachedMemoryTempRegisterIDAndInvalidate());
        return branch32(cond, memoryTempRegister, right16);
    }

    Jump branch16(RelationalCondition cond, BaseIndex left, TrustedImm32 right)
    {
        TrustedImm32 right16 = MacroAssemblerHelpers::mask16OnCondition(*this, cond, right);
        MacroAssemblerHelpers::load16OnCondition(*this, cond, left, getCachedMemoryTempRegisterIDAndInvalidate());
        return branch32(cond, memoryTempRegister, right16);
    }

    Jump branch16(RelationalCondition cond, AbsoluteAddress left, TrustedImm32 right)
    {
        TrustedImm32 right16 = MacroAssemblerHelpers::mask16OnCondition(*this, cond, right);
        MacroAssemblerHelpers::load16OnCondition(*this, cond, left.m_ptr, getCachedMemoryTempRegisterIDAndInvalidate());
        return branch32(cond, memoryTempRegister, right16);
    }

    Jump branchTest32(ResultCondition cond, RegisterID reg, RegisterID mask)
    {
        if (reg == mask && (cond == Zero || cond == NonZero))
            return Jump(makeCompareAndBranch<32>(static_cast<ZeroCondition>(cond), reg));
        m_assembler.tst<32>(reg, mask);
        return Jump(makeBranch(cond));
    }

    void test32(RegisterID reg, TrustedImm32 mask = TrustedImm32(-1))
    {
        if (mask.m_value == -1)
            m_assembler.tst<32>(reg, reg);
        else {
            LogicalImmediate logicalImm = LogicalImmediate::create32(mask.m_value);

            if (logicalImm.isValid())
                m_assembler.tst<32>(reg, logicalImm);
            else {
                move(mask, getCachedDataTempRegisterIDAndInvalidate());
                m_assembler.tst<32>(reg, dataTempRegister);
            }
        }
    }

    Jump branch(ResultCondition cond)
    {
        return Jump(makeBranch(cond));
    }

    Jump branchTest32(ResultCondition cond, RegisterID reg, TrustedImm32 mask = TrustedImm32(-1))
    {
        if (mask.m_value == -1) {
            if ((cond == Zero) || (cond == NonZero))
                return Jump(makeCompareAndBranch<32>(static_cast<ZeroCondition>(cond), reg));
            m_assembler.tst<32>(reg, reg);
        } else if (hasOneBitSet(mask.m_value) && ((cond == Zero) || (cond == NonZero)))
            return Jump(makeTestBitAndBranch(reg, getLSBSet(mask.m_value), static_cast<ZeroCondition>(cond)));
        else {
            LogicalImmediate logicalImm = LogicalImmediate::create32(mask.m_value);
            if (logicalImm.isValid()) {
                m_assembler.tst<32>(reg, logicalImm);
                return Jump(makeBranch(cond));
            }

            ASSERT(reg != dataTempRegister);
            move(mask, getCachedDataTempRegisterIDAndInvalidate());
            m_assembler.tst<32>(reg, dataTempRegister);
        }
        return Jump(makeBranch(cond));
    }

    Jump branchTest32(ResultCondition cond, Address address, TrustedImm32 mask = TrustedImm32(-1))
    {
        load32(address, getCachedMemoryTempRegisterIDAndInvalidate());
        return branchTest32(cond, memoryTempRegister, mask);
    }

    Jump branchTest32(ResultCondition cond, BaseIndex address, TrustedImm32 mask = TrustedImm32(-1))
    {
        load32(address, getCachedMemoryTempRegisterIDAndInvalidate());
        return branchTest32(cond, memoryTempRegister, mask);
    }

    Jump branchTest32(ResultCondition cond, AbsoluteAddress address, TrustedImm32 mask = TrustedImm32(-1))
    {
        move(TrustedImmPtr(address.m_ptr), getCachedMemoryTempRegisterIDAndInvalidate());
        load32(Address(memoryTempRegister), memoryTempRegister);
        return branchTest32(cond, memoryTempRegister, mask);
    }

    Jump branchTest64(ResultCondition cond, RegisterID reg, RegisterID mask)
    {
        if (reg == mask && (cond == Zero || cond == NonZero))
            return Jump(makeCompareAndBranch<64>(static_cast<ZeroCondition>(cond), reg));
        m_assembler.tst<64>(reg, mask);
        return Jump(makeBranch(cond));
    }

    Jump branchTest64(ResultCondition cond, RegisterID reg, TrustedImm32 mask = TrustedImm32(-1))
    {
        if (mask.m_value == -1) {
            if ((cond == Zero) || (cond == NonZero))
                return Jump(makeCompareAndBranch<64>(static_cast<ZeroCondition>(cond), reg));
            m_assembler.tst<64>(reg, reg);
        } else if (hasOneBitSet(mask.m_value) && ((cond == Zero) || (cond == NonZero)))
            return Jump(makeTestBitAndBranch(reg, getLSBSet(mask.m_value), static_cast<ZeroCondition>(cond)));
        else {
            LogicalImmediate logicalImm = LogicalImmediate::create64(mask.m_value);

            if (logicalImm.isValid()) {
                m_assembler.tst<64>(reg, logicalImm);
                return Jump(makeBranch(cond));
            }

            signExtend32ToPtr(mask, getCachedDataTempRegisterIDAndInvalidate());
            m_assembler.tst<64>(reg, dataTempRegister);
        }
        return Jump(makeBranch(cond));
    }

    Jump branchTest64(ResultCondition cond, RegisterID reg, TrustedImm64 mask)
    {
        if (mask.m_value == -1) {
            if ((cond == Zero) || (cond == NonZero))
                return Jump(makeCompareAndBranch<64>(static_cast<ZeroCondition>(cond), reg));
            m_assembler.tst<64>(reg, reg);
        } else if (hasOneBitSet(mask.m_value) && ((cond == Zero) || (cond == NonZero)))
            return Jump(makeTestBitAndBranch(reg, getLSBSet(mask.m_value), static_cast<ZeroCondition>(cond)));
        else {
            LogicalImmediate logicalImm = LogicalImmediate::create64(mask.m_value);

            if (logicalImm.isValid()) {
                m_assembler.tst<64>(reg, logicalImm);
                return Jump(makeBranch(cond));
            }

            move(mask, getCachedDataTempRegisterIDAndInvalidate());
            m_assembler.tst<64>(reg, dataTempRegister);
        }
        return Jump(makeBranch(cond));
    }

    Jump branchTest64(ResultCondition cond, Address address, RegisterID mask)
    {
        load64(address, getCachedDataTempRegisterIDAndInvalidate());
        return branchTest64(cond, dataTempRegister, mask);
    }

    Jump branchTest64(ResultCondition cond, Address address, TrustedImm32 mask = TrustedImm32(-1))
    {
        load64(address, getCachedDataTempRegisterIDAndInvalidate());
        return branchTest64(cond, dataTempRegister, mask);
    }

    Jump branchTest64(ResultCondition cond, BaseIndex address, TrustedImm32 mask = TrustedImm32(-1))
    {
        load64(address, getCachedDataTempRegisterIDAndInvalidate());
        return branchTest64(cond, dataTempRegister, mask);
    }

    Jump branchTest64(ResultCondition cond, AbsoluteAddress address, TrustedImm32 mask = TrustedImm32(-1))
    {
        load64(address.m_ptr, getCachedDataTempRegisterIDAndInvalidate());
        return branchTest64(cond, dataTempRegister, mask);
    }

    Jump branchTest8(ResultCondition cond, Address address, TrustedImm32 mask = TrustedImm32(-1))
    {
        TrustedImm32 mask8 = MacroAssemblerHelpers::mask8OnCondition(*this, cond, mask);
        MacroAssemblerHelpers::load8OnCondition(*this, cond, address, getCachedMemoryTempRegisterIDAndInvalidate());
        return branchTest32(cond, memoryTempRegister, mask8);
    }

    Jump branchTest8(ResultCondition cond, AbsoluteAddress address, TrustedImm32 mask = TrustedImm32(-1))
    {
        TrustedImm32 mask8 = MacroAssemblerHelpers::mask8OnCondition(*this, cond, mask);
        MacroAssemblerHelpers::load8OnCondition(*this, cond, address.m_ptr, getCachedMemoryTempRegisterIDAndInvalidate());
        return branchTest32(cond, memoryTempRegister, mask8);
    }

    Jump branchTest8(ResultCondition cond, ExtendedAddress address, TrustedImm32 mask = TrustedImm32(-1))
    {
        TrustedImm32 mask8 = MacroAssemblerHelpers::mask8OnCondition(*this, cond, mask);
        move(TrustedImmPtr(reinterpret_cast<void*>(address.offset)), getCachedMemoryTempRegisterIDAndInvalidate());

        if (MacroAssemblerHelpers::isUnsigned<MacroAssemblerARM64>(cond))
            m_assembler.ldrb(memoryTempRegister, address.base, memoryTempRegister);
        else
            m_assembler.ldrsb<32>(memoryTempRegister, address.base, memoryTempRegister);

        return branchTest32(cond, memoryTempRegister, mask8);
    }

    Jump branchTest8(ResultCondition cond, BaseIndex address, TrustedImm32 mask = TrustedImm32(-1))
    {
        TrustedImm32 mask8 = MacroAssemblerHelpers::mask8OnCondition(*this, cond, mask);
        MacroAssemblerHelpers::load8OnCondition(*this, cond, address, getCachedMemoryTempRegisterIDAndInvalidate());
        return branchTest32(cond, memoryTempRegister, mask8);
    }

    Jump branchTest16(ResultCondition cond, Address address, TrustedImm32 mask = TrustedImm32(-1))
    {
        TrustedImm32 mask16 = MacroAssemblerHelpers::mask16OnCondition(*this, cond, mask);
        MacroAssemblerHelpers::load16OnCondition(*this, cond, address, getCachedMemoryTempRegisterIDAndInvalidate());
        return branchTest32(cond, memoryTempRegister, mask16);
    }

    Jump branchTest16(ResultCondition cond, AbsoluteAddress address, TrustedImm32 mask = TrustedImm32(-1))
    {
        TrustedImm32 mask16 = MacroAssemblerHelpers::mask16OnCondition(*this, cond, mask);
        MacroAssemblerHelpers::load16OnCondition(*this, cond, address.m_ptr, getCachedMemoryTempRegisterIDAndInvalidate());
        return branchTest32(cond, memoryTempRegister, mask16);
    }

    Jump branchTest16(ResultCondition cond, ExtendedAddress address, TrustedImm32 mask = TrustedImm32(-1))
    {
        TrustedImm32 mask16 = MacroAssemblerHelpers::mask16OnCondition(*this, cond, mask);
        move(TrustedImmPtr(reinterpret_cast<void*>(address.offset)), getCachedMemoryTempRegisterIDAndInvalidate());

        if (MacroAssemblerHelpers::isUnsigned<MacroAssemblerARM64>(cond))
            m_assembler.ldrh(memoryTempRegister, address.base, memoryTempRegister);
        else
            m_assembler.ldrsh<32>(memoryTempRegister, address.base, memoryTempRegister);

        return branchTest32(cond, memoryTempRegister, mask16);
    }

    Jump branchTest16(ResultCondition cond, BaseIndex address, TrustedImm32 mask = TrustedImm32(-1))
    {
        TrustedImm32 mask16 = MacroAssemblerHelpers::mask16OnCondition(*this, cond, mask);
        MacroAssemblerHelpers::load16OnCondition(*this, cond, address, getCachedMemoryTempRegisterIDAndInvalidate());
        return branchTest32(cond, memoryTempRegister, mask16);
    }

    Jump branch32WithUnalignedHalfWords(RelationalCondition cond, BaseIndex left, TrustedImm32 right)
    {
        return branch32(cond, left, right);
    }

    Jump branch32WithMemory16(RelationalCondition cond, Address left, RegisterID right)
    {
        MacroAssemblerHelpers::load16OnCondition(*this, cond, left, getCachedMemoryTempRegisterIDAndInvalidate());
        return branch32(cond, memoryTempRegister, right);
    }

    // Arithmetic control flow operations:
    //
    // This set of conditional branch operations branch based
    // on the result of an arithmetic operation. The operation
    // is performed as normal, storing the result.
    //
    // * jz operations branch if the result is zero.
    // * jo operations branch if the (signed) arithmetic
    //   operation caused an overflow to occur.
    
    Jump branchAdd32(ResultCondition cond, RegisterID op1, RegisterID op2, RegisterID dest)
    {
        m_assembler.add<32, S>(dest, op1, op2);
        return Jump(makeBranch(cond));
    }

    Jump branchAdd32(ResultCondition cond, RegisterID op1, TrustedImm32 imm, RegisterID dest)
    {
        auto immediate = imm.m_value;
        if (auto tuple = tryExtractShiftedImm(immediate)) {
            auto [u12, shift, inverted] = tuple.value();
            if (!inverted)
                m_assembler.add<32, S>(dest, op1, u12, shift);
            else
                m_assembler.sub<32, S>(dest, op1, u12, shift);
            return Jump(makeBranch(cond));
        }
        signExtend32ToPtr(imm, getCachedDataTempRegisterIDAndInvalidate());
        return branchAdd32(cond, op1, dataTempRegister, dest);
    }

    Jump branchAdd32(ResultCondition cond, Address src, RegisterID dest)
    {
        load32(src, getCachedDataTempRegisterIDAndInvalidate());
        return branchAdd32(cond, dest, dataTempRegister, dest);
    }

    Jump branchAdd32(ResultCondition cond, RegisterID src, RegisterID dest)
    {
        return branchAdd32(cond, dest, src, dest);
    }

    Jump branchAdd32(ResultCondition cond, TrustedImm32 imm, RegisterID dest)
    {
        return branchAdd32(cond, dest, imm, dest);
    }

    Jump branchAdd32(ResultCondition cond, TrustedImm32 imm, AbsoluteAddress address)
    {
        load32(address.m_ptr, getCachedDataTempRegisterIDAndInvalidate());

        auto immediate = imm.m_value;
        if (auto tuple = tryExtractShiftedImm(immediate)) {
            auto [u12, shift, inverted] = tuple.value();
            if (!inverted)
                m_assembler.add<32, S>(dataTempRegister, dataTempRegister, u12, shift);
            else
                m_assembler.sub<32, S>(dataTempRegister, dataTempRegister, u12, shift);
        } else {
            move(imm, getCachedMemoryTempRegisterIDAndInvalidate());
            m_assembler.add<32, S>(dataTempRegister, dataTempRegister, memoryTempRegister);
        }
        store32(dataTempRegister, address.m_ptr);
        return Jump(makeBranch(cond));
    }

    Jump branchAdd32(ResultCondition cond, TrustedImm32 imm, Address address)
    {
        load32(address, getCachedDataTempRegisterIDAndInvalidate());

        auto immediate = imm.m_value;
        if (auto tuple = tryExtractShiftedImm(immediate)) {
            auto [u12, shift, inverted] = tuple.value();
            if (!inverted)
                m_assembler.add<32, S>(dataTempRegister, dataTempRegister, u12, shift);
            else
                m_assembler.sub<32, S>(dataTempRegister, dataTempRegister, u12, shift);
        } else {
            move(imm, getCachedMemoryTempRegisterIDAndInvalidate());
            m_assembler.add<32, S>(dataTempRegister, dataTempRegister, memoryTempRegister);
        }
        store32(dataTempRegister, address);
        return Jump(makeBranch(cond));
    }

    Jump branchAdd64(ResultCondition cond, RegisterID op1, RegisterID op2, RegisterID dest)
    {
        m_assembler.add<64, S>(dest, op1, op2);
        return Jump(makeBranch(cond));
    }

    Jump branchAdd64(ResultCondition cond, RegisterID op1, TrustedImm32 imm, RegisterID dest)
    {
        auto immediate = imm.m_value;
        if (auto tuple = tryExtractShiftedImm(immediate)) {
            auto [u12, shift, inverted] = tuple.value();
            if (!inverted)
                m_assembler.add<64, S>(dest, op1, u12, shift);
            else
                m_assembler.sub<64, S>(dest, op1, u12, shift);
            return Jump(makeBranch(cond));
        }

        move(imm, getCachedDataTempRegisterIDAndInvalidate());
        return branchAdd64(cond, op1, dataTempRegister, dest);
    }

    Jump branchAdd64(ResultCondition cond, RegisterID src, RegisterID dest)
    {
        return branchAdd64(cond, dest, src, dest);
    }

    Jump branchAdd64(ResultCondition cond, TrustedImm32 imm, RegisterID dest)
    {
        return branchAdd64(cond, dest, imm, dest);
    }

    Jump branchAdd64(RelationalCondition cond, TrustedImm32 imm, RegisterID dest)
    {
        // This is not supporting -imm.m_value UInt12. Thus we are not listing BranchAdd64 RelCond, Imm, Tmp in AirOpcode.opcodes.
        ASSERT(isUInt12(imm.m_value));
        m_assembler.add<64, S>(dest, dest, UInt12(imm.m_value));
        return Jump(makeBranch(cond));
    }

    Jump branchMul32(ResultCondition cond, RegisterID src1, RegisterID src2, RegisterID dest)
    {
        ASSERT(cond != Signed);

        if (cond != Overflow) {
            m_assembler.mul<32>(dest, src1, src2);
            return branchTest32(cond, dest);
        }

        // This is a signed multiple of two 32-bit values, producing a 64-bit result.
        m_assembler.smull(dest, src1, src2);
        m_assembler.cmp<64>(dest, dest, Assembler::SXTW, 0);
        zeroExtend32ToWord(dest, dest);
        return Jump(makeBranch(NotEqual));
    }

    Jump branchMul32(ResultCondition cond, RegisterID src, RegisterID dest)
    {
        return branchMul32(cond, dest, src, dest);
    }

    Jump branchMul32(ResultCondition cond, RegisterID src, TrustedImm32 imm, RegisterID dest)
    {
        move(imm, getCachedDataTempRegisterIDAndInvalidate());
        return branchMul32(cond, dataTempRegister, src, dest);
    }

    Jump branchMul64(ResultCondition cond, RegisterID src1, RegisterID src2, RegisterID scratch1, RegisterID dest)
    {
        ASSERT(cond != Signed);
        ASSERT(src1 != scratch1);
        ASSERT(src2 != scratch1);

        // mul<64> does a signed multiple of two 64-bit values, producing a 64-bit result.
        if (cond != Overflow) {
            m_assembler.mul<64>(dest, src1, src2);
            return branchTest64(cond, dest);
        }

        // Compute bits 127..64 of the result into scratch1.
        m_assembler.smulh(scratch1, src1, src2);
        // dest may equal src1 or src2. So, we should always compute dest after we've
        // computed the smulh result in scratch1 so as not to corrupt src1 and src2.
        m_assembler.mul<64>(dest, src1, src2);

        // Splat bit 63 of the result to bits 63..0 of scratch1.
        m_assembler.cmp<64>(scratch1, dest, Assembler::ASR, 63);
        // Check that bits 31..63 of the original result were all equal.
        return Jump(makeBranch(NotEqual));
    }

    Jump branchMul64(ResultCondition cond, RegisterID src1, RegisterID src2, RegisterID dest)
    {
        return branchMul64(cond, src1, src2, getCachedDataTempRegisterIDAndInvalidate(), dest);
    }

    Jump branchNeg32(ResultCondition cond, RegisterID dest)
    {
        m_assembler.neg<32, S>(dest, dest);
        return Jump(makeBranch(cond));
    }

    Jump branchNeg64(ResultCondition cond, RegisterID srcDest)
    {
        m_assembler.neg<64, S>(srcDest, srcDest);
        return Jump(makeBranch(cond));
    }

    Jump branchSub32(ResultCondition cond, RegisterID dest)
    {
        m_assembler.neg<32, S>(dest, dest);
        return Jump(makeBranch(cond));
    }

    Jump branchSub32(ResultCondition cond, RegisterID op1, RegisterID op2, RegisterID dest)
    {
        m_assembler.sub<32, S>(dest, op1, op2);
        return Jump(makeBranch(cond));
    }

    Jump branchSub32(ResultCondition cond, RegisterID op1, TrustedImm32 imm, RegisterID dest)
    {
        auto immediate = imm.m_value;
        if (auto tuple = tryExtractShiftedImm(immediate)) {
            auto [u12, shift, inverted] = tuple.value();
            if (!inverted)
                m_assembler.sub<32, S>(dest, op1, u12, shift);
            else
                m_assembler.add<32, S>(dest, op1, u12, shift);
            return Jump(makeBranch(cond));
        }

        signExtend32ToPtr(imm, getCachedDataTempRegisterIDAndInvalidate());
        return branchSub32(cond, op1, dataTempRegister, dest);
    }

    Jump branchSub32(ResultCondition cond, RegisterID src, RegisterID dest)
    {
        return branchSub32(cond, dest, src, dest);
    }

    Jump branchSub32(ResultCondition cond, TrustedImm32 imm, RegisterID dest)
    {
        return branchSub32(cond, dest, imm, dest);
    }

    Jump branchSub64(ResultCondition cond, RegisterID op1, RegisterID op2, RegisterID dest)
    {
        m_assembler.sub<64, S>(dest, op1, op2);
        return Jump(makeBranch(cond));
    }

    Jump branchSub64(ResultCondition cond, RegisterID op1, TrustedImm32 imm, RegisterID dest)
    {
        auto immediate = imm.m_value;
        if (auto tuple = tryExtractShiftedImm(immediate)) {
            auto [u12, shift, inverted] = tuple.value();
            if (!inverted)
                m_assembler.sub<64, S>(dest, op1, u12, shift);
            else
                m_assembler.add<64, S>(dest, op1, u12, shift);
            return Jump(makeBranch(cond));
        }

        move(imm, getCachedDataTempRegisterIDAndInvalidate());
        return branchSub64(cond, op1, dataTempRegister, dest);
    }

    Jump branchSub64(ResultCondition cond, RegisterID src, RegisterID dest)
    {
        return branchSub64(cond, dest, src, dest);
    }

    Jump branchSub64(ResultCondition cond, TrustedImm32 imm, RegisterID dest)
    {
        return branchSub64(cond, dest, imm, dest);
    }

    Jump branchSub64(RelationalCondition cond, TrustedImm32 imm, RegisterID dest)
    {
        // This is not supporting -imm.m_value UInt12. Thus we are not listing BranchSub64 RelCond, Imm, Tmp in AirOpcode.opcodes.
        ASSERT(isUInt12(imm.m_value));
        m_assembler.sub<64, S>(dest, dest, UInt12(imm.m_value));
        return Jump(makeBranch(cond));
    }

    // Jumps, calls, returns

    // duplicate MacroAssembler's loadPtr for loading call targets.
    template<typename... Args>
    ALWAYS_INLINE void loadPtr(Args... args)
    {
#if CPU(ADDRESS64)
        load64(args...);
#else
        load32(args...);
#endif
    }

    ALWAYS_INLINE Call call(PtrTag)
    {
        AssemblerLabel pointerLabel = m_assembler.label();
        moveWithFixedWidth(TrustedImmPtr(nullptr), getCachedDataTempRegisterIDAndInvalidate());
        invalidateAllTempRegisters();
        m_assembler.blr(dataTempRegister);
        AssemblerLabel callLabel = m_assembler.label();
        ASSERT_UNUSED(pointerLabel, Assembler::getDifferenceBetweenLabels(callLabel, pointerLabel) == REPATCH_OFFSET_CALL_TO_POINTER);
        return Call(callLabel, Call::Linkable);
    }

    ALWAYS_INLINE Call call(RegisterID target, PtrTag)
    {
        invalidateAllTempRegisters();
        m_assembler.blr(target);
        return Call(m_assembler.labelIgnoringWatchpoints(), Call::None);
    }

    ALWAYS_INLINE Call call(Address address, PtrTag tag)
    {
        loadPtr(address, getCachedDataTempRegisterIDAndInvalidate());
        return call(dataTempRegister, tag);
    }

    ALWAYS_INLINE Call call(RegisterID callTag) { return UNUSED_PARAM(callTag), call(NoPtrTag); }
    ALWAYS_INLINE Call call(RegisterID target, RegisterID callTag) { return UNUSED_PARAM(callTag), call(target, NoPtrTag); }
    ALWAYS_INLINE Call call(Address address, RegisterID callTag) { return UNUSED_PARAM(callTag), call(address, NoPtrTag); }

    template<PtrTag tag>
    ALWAYS_INLINE void callOperation(const CodePtr<tag> operation)
    {
        auto tmp = getCachedDataTempRegisterIDAndInvalidate();
        move(TrustedImmPtr(operation.taggedPtr()), tmp);
        call(tmp, tag);
    }

    ALWAYS_INLINE Jump jump()
    {
        AssemblerLabel label = m_assembler.label();
        m_assembler.b();
        return Jump(label, m_makeJumpPatchable ? Assembler::JumpNoConditionFixedSize : Assembler::JumpNoCondition);
    }

    void farJump(RegisterID target, PtrTag)
    {
        m_assembler.br(target);
    }

    void farJump(TrustedImmPtr target, PtrTag)
    {
        move(target, getCachedDataTempRegisterIDAndInvalidate());
        m_assembler.br(dataTempRegister);
    }

    void farJump(Address address, PtrTag)
    {
        loadPtr(address, getCachedDataTempRegisterIDAndInvalidate());
        m_assembler.br(dataTempRegister);
    }
    
    void farJump(BaseIndex address, PtrTag)
    {
        loadPtr(address, getCachedDataTempRegisterIDAndInvalidate());
        m_assembler.br(dataTempRegister);
    }

    void farJump(AbsoluteAddress address, PtrTag)
    {
        move(TrustedImmPtr(address.m_ptr), getCachedDataTempRegisterIDAndInvalidate());
        loadPtr(Address(dataTempRegister), dataTempRegister);
        m_assembler.br(dataTempRegister);
    }

    ALWAYS_INLINE void farJump(RegisterID target, RegisterID jumpTag) { UNUSED_PARAM(jumpTag), farJump(target, NoPtrTag); }
    ALWAYS_INLINE void farJump(Address address, RegisterID jumpTag) { UNUSED_PARAM(jumpTag), farJump(address, NoPtrTag); }
    ALWAYS_INLINE void farJump(BaseIndex address, RegisterID jumpTag) { UNUSED_PARAM(jumpTag), farJump(address, NoPtrTag); }
    ALWAYS_INLINE void farJump(AbsoluteAddress address, RegisterID jumpTag) { UNUSED_PARAM(jumpTag), farJump(address, NoPtrTag); }

    ALWAYS_INLINE Call nearCall()
    {
        invalidateAllTempRegisters();
        m_assembler.bl();
        return Call(m_assembler.labelIgnoringWatchpoints(), Call::LinkableNear);
    }

    ALWAYS_INLINE Call nearTailCall()
    {
        AssemblerLabel label = m_assembler.label();
        m_assembler.b();
        return Call(label, Call::LinkableNearTail);
    }

    ALWAYS_INLINE Call threadSafePatchableNearCall()
    {
        invalidateAllTempRegisters();
        padBeforePatch();
        m_assembler.bl();
        return Call(m_assembler.labelIgnoringWatchpoints(), Call::LinkableNear);
    }

    ALWAYS_INLINE Call threadSafePatchableNearTailCall()
    {
        AssemblerLabel label = m_assembler.label();
        m_assembler.b();
        return Call(label, Call::LinkableNearTail);
    }

    ALWAYS_INLINE void ret()
    {
        m_assembler.ret();
    }

    // Comparisons operations

    void compare32(RelationalCondition cond, RegisterID left, RegisterID right, RegisterID dest)
    {
        m_assembler.cmp<32>(left, right);
        m_assembler.cset<32>(dest, ARM64Condition(cond));
    }

    void compare32(RelationalCondition cond, Address left, RegisterID right, RegisterID dest)
    {
        load32(left, getCachedDataTempRegisterIDAndInvalidate());
        m_assembler.cmp<32>(dataTempRegister, right);
        m_assembler.cset<32>(dest, ARM64Condition(cond));
    }

    void compare32(RelationalCondition cond, RegisterID left, TrustedImm32 right, RegisterID dest)
    {
        auto immediate = right.m_value;
        if (!immediate) {
            if (auto resultCondition = commuteCompareToZeroIntoTest(cond)) {
                test32(*resultCondition, left, left, dest);
                return;
            }
        }

        if (auto tuple = tryExtractShiftedImm(immediate)) {
            auto [u12, shift, inverted] = tuple.value();
            if (!inverted)
                m_assembler.cmp<32>(left, u12, shift);
            else
                m_assembler.cmn<32>(left, u12, shift);
        } else {
            move(right, getCachedDataTempRegisterIDAndInvalidate());
            m_assembler.cmp<32>(left, dataTempRegister);
        }
        m_assembler.cset<32>(dest, ARM64Condition(cond));
    }

    void compare64(RelationalCondition cond, RegisterID left, RegisterID right, RegisterID dest)
    {
        m_assembler.cmp<64>(left, right);
        m_assembler.cset<32>(dest, ARM64Condition(cond));
    }
    
    void compare64(RelationalCondition cond, RegisterID left, TrustedImm32 right, RegisterID dest)
    {
        auto immediate = right.m_value;
        if (!immediate) {
            if (auto resultCondition = commuteCompareToZeroIntoTest(cond)) {
                test64(*resultCondition, left, left, dest);
                return;
            }
        }

        if (auto tuple = tryExtractShiftedImm(immediate)) {
            auto [u12, shift, inverted] = tuple.value();
            if (!inverted)
                m_assembler.cmp<64>(left, u12, shift);
            else
                m_assembler.cmn<64>(left, u12, shift);
        } else {
            signExtend32ToPtr(right, getCachedDataTempRegisterIDAndInvalidate());
            m_assembler.cmp<64>(left, dataTempRegister);
        }
        m_assembler.cset<32>(dest, ARM64Condition(cond));
    }

    void compare64(RelationalCondition cond, RegisterID left, TrustedImm64 right, RegisterID dest)
    {
        auto immediate = right.m_value;
        if (!immediate) {
            if (auto resultCondition = commuteCompareToZeroIntoTest(cond)) {
                test64(*resultCondition, left, left, dest);
                return;
            }
        }

        if (auto tuple = tryExtractShiftedImm(immediate)) {
            auto [u12, shift, inverted] = tuple.value();
            if (!inverted)
                m_assembler.cmp<64>(left, u12, shift);
            else
                m_assembler.cmn<64>(left, u12, shift);
        } else {
            move(right, getCachedDataTempRegisterIDAndInvalidate());
            m_assembler.cmp<64>(left, dataTempRegister);
        }
        m_assembler.cset<32>(dest, ARM64Condition(cond));
    }

    void compare8(RelationalCondition cond, Address left, TrustedImm32 right, RegisterID dest)
    {
        TrustedImm32 right8 = MacroAssemblerHelpers::mask8OnCondition(*this, cond, right);
        MacroAssemblerHelpers::load8OnCondition(*this, cond, left, getCachedMemoryTempRegisterIDAndInvalidate());
        move(right8, getCachedDataTempRegisterIDAndInvalidate());
        compare32(cond, memoryTempRegister, dataTempRegister, dest);
    }

    void test32(ResultCondition cond, RegisterID src, RegisterID mask, RegisterID dest)
    {
        m_assembler.tst<32>(src, mask);
        m_assembler.cset<32>(dest, ARM64Condition(cond));
    }

    void test32(ResultCondition cond, RegisterID src, TrustedImm32 mask, RegisterID dest)
    {
        test32(src, mask);
        m_assembler.cset<32>(dest, ARM64Condition(cond));
    }

    void addOneConditionally32(ResultCondition cond, RegisterID src, RegisterID dest)
    {
        m_assembler.cinc<32>(dest, src, ARM64Condition(cond));
    }

    void test32(ResultCondition cond, Address address, TrustedImm32 mask, RegisterID dest)
    {
        load32(address, getCachedMemoryTempRegisterIDAndInvalidate());
        test32(cond, memoryTempRegister, mask, dest);
    }

    void test8(ResultCondition cond, Address address, TrustedImm32 mask, RegisterID dest)
    {
        TrustedImm32 mask8 = MacroAssemblerHelpers::mask8OnCondition(*this, cond, mask);
        MacroAssemblerHelpers::load8OnCondition(*this, cond, address, getCachedMemoryTempRegisterIDAndInvalidate());
        test32(cond, memoryTempRegister, mask8, dest);
    }

    void test64(ResultCondition cond, RegisterID op1, RegisterID op2, RegisterID dest)
    {
        m_assembler.tst<64>(op1, op2);
        m_assembler.cset<32>(dest, ARM64Condition(cond));
    }

    void test64(ResultCondition cond, RegisterID src, TrustedImm32 mask, RegisterID dest)
    {
        if (mask.m_value == -1)
            m_assembler.tst<64>(src, src);
        else {
            signExtend32ToPtr(mask, getCachedDataTempRegisterIDAndInvalidate());
            m_assembler.tst<64>(src, dataTempRegister);
        }
        m_assembler.cset<32>(dest, ARM64Condition(cond));
    }

    void setCarry(RegisterID dest)
    {
        m_assembler.cset<32>(dest, Assembler::ConditionCS);
    }

    // Patchable operations

    ALWAYS_INLINE DataLabel32 moveWithPatch(TrustedImm32 imm, RegisterID dest)
    {
        DataLabel32 label(this);
        moveWithFixedWidth(imm, dest);
        return label;
    }

    ALWAYS_INLINE DataLabelPtr moveWithPatch(TrustedImmPtr imm, RegisterID dest)
    {
        DataLabelPtr label(this);
        moveWithFixedWidth(imm, dest);
        return label;
    }

    ALWAYS_INLINE Jump branchPtrWithPatch(RelationalCondition cond, RegisterID left, DataLabelPtr& dataLabel, TrustedImmPtr initialRightValue = TrustedImmPtr(nullptr))
    {
        dataLabel = DataLabelPtr(this);
        moveWithPatch(initialRightValue, getCachedDataTempRegisterIDAndInvalidate());
        return branch64(cond, left, dataTempRegister);
    }

    ALWAYS_INLINE Jump branchPtrWithPatch(RelationalCondition cond, Address left, DataLabelPtr& dataLabel, TrustedImmPtr initialRightValue = TrustedImmPtr(nullptr))
    {
        dataLabel = DataLabelPtr(this);
        moveWithPatch(initialRightValue, getCachedDataTempRegisterIDAndInvalidate());
        return branch64(cond, left, dataTempRegister);
    }

    ALWAYS_INLINE Jump branch32WithPatch(RelationalCondition cond, Address left, DataLabel32& dataLabel, TrustedImm32 initialRightValue = TrustedImm32(0))
    {
        dataLabel = DataLabel32(this);
        moveWithPatch(initialRightValue, getCachedDataTempRegisterIDAndInvalidate());
        return branch32(cond, left, dataTempRegister);
    }

    PatchableJump patchableBranchPtr(RelationalCondition cond, Address left, TrustedImmPtr right)
    {
        m_makeJumpPatchable = true;
        Jump result = branch64(cond, left, TrustedImm64(right));
        m_makeJumpPatchable = false;
        return PatchableJump(result);
    }

    PatchableJump patchableBranch8(RelationalCondition cond, Address left, TrustedImm32 imm)
    {
        m_makeJumpPatchable = true;
        Jump result = branch8(cond, left, imm);
        m_makeJumpPatchable = false;
        return PatchableJump(result);
    }

    PatchableJump patchableBranch16(RelationalCondition cond, Address left, TrustedImm32 imm)
    {
        m_makeJumpPatchable = true;
        Jump result = branch16(cond, left, imm);
        m_makeJumpPatchable = false;
        return PatchableJump(result);
    }

    PatchableJump patchableBranchTest32(ResultCondition cond, RegisterID reg, TrustedImm32 mask = TrustedImm32(-1))
    {
        m_makeJumpPatchable = true;
        Jump result = branchTest32(cond, reg, mask);
        m_makeJumpPatchable = false;
        return PatchableJump(result);
    }

    PatchableJump patchableBranch32(RelationalCondition cond, RegisterID reg, TrustedImm32 imm)
    {
        m_makeJumpPatchable = true;
        Jump result = branch32(cond, reg, imm);
        m_makeJumpPatchable = false;
        return PatchableJump(result);
    }

    PatchableJump patchableBranch32(RelationalCondition cond, Address left, TrustedImm32 imm)
    {
        m_makeJumpPatchable = true;
        Jump result = branch32(cond, left, imm);
        m_makeJumpPatchable = false;
        return PatchableJump(result);
    }

    PatchableJump patchableBranch64(RelationalCondition cond, RegisterID reg, TrustedImm64 imm)
    {
        m_makeJumpPatchable = true;
        Jump result = branch64(cond, reg, imm);
        m_makeJumpPatchable = false;
        return PatchableJump(result);
    }

    PatchableJump patchableBranch64(RelationalCondition cond, RegisterID left, RegisterID right)
    {
        m_makeJumpPatchable = true;
        Jump result = branch64(cond, left, right);
        m_makeJumpPatchable = false;
        return PatchableJump(result);
    }

    PatchableJump patchableBranchPtrWithPatch(RelationalCondition cond, Address left, DataLabelPtr& dataLabel, TrustedImmPtr initialRightValue = TrustedImmPtr(nullptr))
    {
        m_makeJumpPatchable = true;
        Jump result = branchPtrWithPatch(cond, left, dataLabel, initialRightValue);
        m_makeJumpPatchable = false;
        return PatchableJump(result);
    }

    PatchableJump patchableBranch32WithPatch(RelationalCondition cond, Address left, DataLabel32& dataLabel, TrustedImm32 initialRightValue = TrustedImm32(0))
    {
        m_makeJumpPatchable = true;
        Jump result = branch32WithPatch(cond, left, dataLabel, initialRightValue);
        m_makeJumpPatchable = false;
        return PatchableJump(result);
    }

    PatchableJump patchableJump()
    {
        m_makeJumpPatchable = true;
        Jump result = jump();
        m_makeJumpPatchable = false;
        return PatchableJump(result);
    }

    ALWAYS_INLINE DataLabelPtr storePtrWithPatch(TrustedImmPtr initialValue, Address address)
    {
        DataLabelPtr label(this);
        moveWithFixedWidth(initialValue, getCachedDataTempRegisterIDAndInvalidate());
        store64(dataTempRegister, address);
        return label;
    }

    ALWAYS_INLINE DataLabelPtr storePtrWithPatch(Address address)
    {
        return storePtrWithPatch(TrustedImmPtr(nullptr), address);
    }

    static void reemitInitialMoveWithPatch(void* address, void* value)
    {
        Assembler::setPointer(static_cast<int*>(address), value, dataTempRegister, true);
    }

    // Miscellaneous operations:

    void breakpoint(uint16_t imm = WTF_FATAL_CRASH_CODE)
    {
        m_assembler.brk(imm);
    }

    static bool isBreakpoint(void* address) { return Assembler::isBrk(address); }

    void nop()
    {
        m_assembler.nop();
    }
    
    // We take memoryFence to mean acqrel. This has acqrel semantics on ARM64.
    void memoryFence()
    {
        m_assembler.dmbISH();
    }

    // We take this to mean that it prevents motion of normal stores. That's a store fence on ARM64 (hence the "ST").
    void storeFence()
    {
        m_assembler.dmbISHST();
    }

    // We take this to mean that it prevents motion of normal loads. Ideally we'd have expressed this
    // using dependencies or half fences, but there are cases where this is as good as it gets. The only
    // way to get a standalone load fence instruction on ARM is to use the ISH fence, which is just like
    // the memoryFence().
    void loadFence()
    {
        m_assembler.dmbISH();
    }
    
    void loadAcq8SignedExtendTo32(Address address, RegisterID dest)
    {
        m_assembler.ldar<8>(dest, extractSimpleAddress(address));
    }
    
    void loadAcq8(Address address, RegisterID dest)
    {
        loadAcq8SignedExtendTo32(address, dest);
        and32(TrustedImm32(0xff), dest);
    }
    
    void storeRel8(RegisterID src, Address address)
    {
        m_assembler.stlr<8>(src, extractSimpleAddress(address));
    }
    
    void loadAcq16SignedExtendTo32(Address address, RegisterID dest)
    {
        m_assembler.ldar<16>(dest, extractSimpleAddress(address));
    }
    
    void loadAcq16(Address address, RegisterID dest)
    {
        loadAcq16SignedExtendTo32(address, dest);
        and32(TrustedImm32(0xffff), dest);
    }
    
    void storeRel16(RegisterID src, Address address)
    {
        m_assembler.stlr<16>(src, extractSimpleAddress(address));
    }
    
    void loadAcq32(Address address, RegisterID dest)
    {
        m_assembler.ldar<32>(dest, extractSimpleAddress(address));
    }
    
    void loadAcq64(Address address, RegisterID dest)
    {
        m_assembler.ldar<64>(dest, extractSimpleAddress(address));
    }

    void loadAcq32(BaseIndex address, RegisterID dest)
    {
        m_assembler.ldar<32>(dest, extractSimpleAddress(address));
    }

    void loadAcq64(BaseIndex address, RegisterID dest)
    {
        m_assembler.ldar<64>(dest, extractSimpleAddress(address));
    }

    void storeRel32(RegisterID dest, Address address)
    {
        m_assembler.stlr<32>(dest, extractSimpleAddress(address));
    }
    
    void storeRel64(RegisterID dest, Address address)
    {
        m_assembler.stlr<64>(dest, extractSimpleAddress(address));
    }
    
    void loadLink8(Address address, RegisterID dest)
    {
        m_assembler.ldxr<8>(dest, extractSimpleAddress(address));
    }
    
    void loadLinkAcq8(Address address, RegisterID dest)
    {
        m_assembler.ldaxr<8>(dest, extractSimpleAddress(address));
    }
    
    void storeCond8(RegisterID src, Address address, RegisterID result)
    {
        m_assembler.stxr<8>(result, src, extractSimpleAddress(address));
    }
    
    void storeCondRel8(RegisterID src, Address address, RegisterID result)
    {
        m_assembler.stlxr<8>(result, src, extractSimpleAddress(address));
    }
    
    void loadLink16(Address address, RegisterID dest)
    {
        m_assembler.ldxr<16>(dest, extractSimpleAddress(address));
    }
    
    void loadLinkAcq16(Address address, RegisterID dest)
    {
        m_assembler.ldaxr<16>(dest, extractSimpleAddress(address));
    }
    
    void storeCond16(RegisterID src, Address address, RegisterID result)
    {
        m_assembler.stxr<16>(result, src, extractSimpleAddress(address));
    }
    
    void storeCondRel16(RegisterID src, Address address, RegisterID result)
    {
        m_assembler.stlxr<16>(result, src, extractSimpleAddress(address));
    }
    
    void loadLink32(Address address, RegisterID dest)
    {
        m_assembler.ldxr<32>(dest, extractSimpleAddress(address));
    }
    
    void loadLinkAcq32(Address address, RegisterID dest)
    {
        m_assembler.ldaxr<32>(dest, extractSimpleAddress(address));
    }
    
    void storeCond32(RegisterID src, Address address, RegisterID result)
    {
        m_assembler.stxr<32>(result, src, extractSimpleAddress(address));
    }
    
    void storeCondRel32(RegisterID src, Address address, RegisterID result)
    {
        m_assembler.stlxr<32>(result, src, extractSimpleAddress(address));
    }
    
    void loadLink64(Address address, RegisterID dest)
    {
        m_assembler.ldxr<64>(dest, extractSimpleAddress(address));
    }
    
    void loadLinkAcq64(Address address, RegisterID dest)
    {
        m_assembler.ldaxr<64>(dest, extractSimpleAddress(address));
    }
    
    void storeCond64(RegisterID src, Address address, RegisterID result)
    {
        m_assembler.stxr<64>(result, src, extractSimpleAddress(address));
    }
    
    void storeCondRel64(RegisterID src, Address address, RegisterID result)
    {
        m_assembler.stlxr<64>(result, src, extractSimpleAddress(address));
    }
    
    template<typename AddressType>
    void atomicStrongCAS8(StatusCondition cond, RegisterID expectedAndResult, RegisterID newValue, AddressType address, RegisterID result)
    {
        atomicStrongCAS<8>(cond, expectedAndResult, newValue, address, result);
    }
    
    template<typename AddressType>
    void atomicStrongCAS16(StatusCondition cond, RegisterID expectedAndResult, RegisterID newValue, AddressType address, RegisterID result)
    {
        atomicStrongCAS<16>(cond, expectedAndResult, newValue, address, result);
    }
    
    template<typename AddressType>
    void atomicStrongCAS32(StatusCondition cond, RegisterID expectedAndResult, RegisterID newValue, AddressType address, RegisterID result)
    {
        atomicStrongCAS<32>(cond, expectedAndResult, newValue, address, result);
    }
    
    template<typename AddressType>
    void atomicStrongCAS64(StatusCondition cond, RegisterID expectedAndResult, RegisterID newValue, AddressType address, RegisterID result)
    {
        atomicStrongCAS<64>(cond, expectedAndResult, newValue, address, result);
    }
    
    template<typename AddressType>
    void atomicRelaxedStrongCAS8(StatusCondition cond, RegisterID expectedAndResult, RegisterID newValue, AddressType address, RegisterID result)
    {
        atomicRelaxedStrongCAS<8>(cond, expectedAndResult, newValue, address, result);
    }
    
    template<typename AddressType>
    void atomicRelaxedStrongCAS16(StatusCondition cond, RegisterID expectedAndResult, RegisterID newValue, AddressType address, RegisterID result)
    {
        atomicRelaxedStrongCAS<16>(cond, expectedAndResult, newValue, address, result);
    }
    
    template<typename AddressType>
    void atomicRelaxedStrongCAS32(StatusCondition cond, RegisterID expectedAndResult, RegisterID newValue, AddressType address, RegisterID result)
    {
        atomicRelaxedStrongCAS<32>(cond, expectedAndResult, newValue, address, result);
    }
    
    template<typename AddressType>
    void atomicRelaxedStrongCAS64(StatusCondition cond, RegisterID expectedAndResult, RegisterID newValue, AddressType address, RegisterID result)
    {
        atomicRelaxedStrongCAS<64>(cond, expectedAndResult, newValue, address, result);
    }
    
    template<typename AddressType>
    JumpList branchAtomicWeakCAS8(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, AddressType address)
    {
        return branchAtomicWeakCAS<8>(cond, expectedAndClobbered, newValue, address);
    }
    
    template<typename AddressType>
    JumpList branchAtomicWeakCAS16(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, AddressType address)
    {
        return branchAtomicWeakCAS<16>(cond, expectedAndClobbered, newValue, address);
    }
    
    template<typename AddressType>
    JumpList branchAtomicWeakCAS32(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, AddressType address)
    {
        return branchAtomicWeakCAS<32>(cond, expectedAndClobbered, newValue, address);
    }
    
    template<typename AddressType>
    JumpList branchAtomicWeakCAS64(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, AddressType address)
    {
        return branchAtomicWeakCAS<64>(cond, expectedAndClobbered, newValue, address);
    }
    
    template<typename AddressType>
    JumpList branchAtomicRelaxedWeakCAS8(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, AddressType address)
    {
        return branchAtomicRelaxedWeakCAS<8>(cond, expectedAndClobbered, newValue, address);
    }
    
    template<typename AddressType>
    JumpList branchAtomicRelaxedWeakCAS16(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, AddressType address)
    {
        return branchAtomicRelaxedWeakCAS<16>(cond, expectedAndClobbered, newValue, address);
    }
    
    template<typename AddressType>
    JumpList branchAtomicRelaxedWeakCAS32(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, AddressType address)
    {
        return branchAtomicRelaxedWeakCAS<32>(cond, expectedAndClobbered, newValue, address);
    }
    
    template<typename AddressType>
    JumpList branchAtomicRelaxedWeakCAS64(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, AddressType address)
    {
        return branchAtomicRelaxedWeakCAS<64>(cond, expectedAndClobbered, newValue, address);
    }

    void atomicXchgAdd8(RegisterID src, Address address, RegisterID dest)
    {
        ASSERT(supportsLSE());
        m_assembler.ldaddal<8>(src, dest, extractSimpleAddress(address));
    }

    void atomicXchgAdd16(RegisterID src, Address address, RegisterID dest)
    {
        ASSERT(supportsLSE());
        m_assembler.ldaddal<16>(src, dest, extractSimpleAddress(address));
    }

    void atomicXchgAdd32(RegisterID src, Address address, RegisterID dest)
    {
        ASSERT(supportsLSE());
        m_assembler.ldaddal<32>(src, dest, extractSimpleAddress(address));
    }

    void atomicXchgAdd64(RegisterID src, Address address, RegisterID dest)
    {
        ASSERT(supportsLSE());
        m_assembler.ldaddal<64>(src, dest, extractSimpleAddress(address));
    }

    void atomicXchgXor8(RegisterID src, Address address, RegisterID dest)
    {
        ASSERT(supportsLSE());
        m_assembler.ldeoral<8>(src, dest, extractSimpleAddress(address));
    }

    void atomicXchgXor16(RegisterID src, Address address, RegisterID dest)
    {
        ASSERT(supportsLSE());
        m_assembler.ldeoral<16>(src, dest, extractSimpleAddress(address));
    }

    void atomicXchgXor32(RegisterID src, Address address, RegisterID dest)
    {
        ASSERT(supportsLSE());
        m_assembler.ldeoral<32>(src, dest, extractSimpleAddress(address));
    }

    void atomicXchgXor64(RegisterID src, Address address, RegisterID dest)
    {
        ASSERT(supportsLSE());
        m_assembler.ldeoral<64>(src, dest, extractSimpleAddress(address));
    }

    void atomicXchgOr8(RegisterID src, Address address, RegisterID dest)
    {
        ASSERT(supportsLSE());
        m_assembler.ldsetal<8>(src, dest, extractSimpleAddress(address));
    }

    void atomicXchgOr16(RegisterID src, Address address, RegisterID dest)
    {
        ASSERT(supportsLSE());
        m_assembler.ldsetal<16>(src, dest, extractSimpleAddress(address));
    }

    void atomicXchgOr32(RegisterID src, Address address, RegisterID dest)
    {
        ASSERT(supportsLSE());
        m_assembler.ldsetal<32>(src, dest, extractSimpleAddress(address));
    }

    void atomicXchgOr64(RegisterID src, Address address, RegisterID dest)
    {
        ASSERT(supportsLSE());
        m_assembler.ldsetal<64>(src, dest, extractSimpleAddress(address));
    }

    void atomicXchgClear8(RegisterID src, Address address, RegisterID dest)
    {
        ASSERT(supportsLSE());
        m_assembler.ldclral<8>(src, dest, extractSimpleAddress(address));
    }

    void atomicXchgClear16(RegisterID src, Address address, RegisterID dest)
    {
        ASSERT(supportsLSE());
        m_assembler.ldclral<16>(src, dest, extractSimpleAddress(address));
    }

    void atomicXchgClear32(RegisterID src, Address address, RegisterID dest)
    {
        ASSERT(supportsLSE());
        m_assembler.ldclral<32>(src, dest, extractSimpleAddress(address));
    }

    void atomicXchgClear64(RegisterID src, Address address, RegisterID dest)
    {
        ASSERT(supportsLSE());
        m_assembler.ldclral<64>(src, dest, extractSimpleAddress(address));
    }

    void atomicXchg8(RegisterID src, Address address, RegisterID dest)
    {
        ASSERT(supportsLSE());
        m_assembler.swpal<8>(src, dest, extractSimpleAddress(address));
    }

    void atomicXchg16(RegisterID src, Address address, RegisterID dest)
    {
        ASSERT(supportsLSE());
        m_assembler.swpal<16>(src, dest, extractSimpleAddress(address));
    }

    void atomicXchg32(RegisterID src, Address address, RegisterID dest)
    {
        ASSERT(supportsLSE());
        m_assembler.swpal<32>(src, dest, extractSimpleAddress(address));
    }

    void atomicXchg64(RegisterID src, Address address, RegisterID dest)
    {
        ASSERT(supportsLSE());
        m_assembler.swpal<64>(src, dest, extractSimpleAddress(address));
    }

    void atomicStrongCAS8(RegisterID expectedAndResult, RegisterID newValue, Address address)
    {
        ASSERT(supportsLSE());
        m_assembler.casal<8>(expectedAndResult, newValue, extractSimpleAddress(address));
    }

    void atomicStrongCAS16(RegisterID expectedAndResult, RegisterID newValue, Address address)
    {
        ASSERT(supportsLSE());
        m_assembler.casal<16>(expectedAndResult, newValue, extractSimpleAddress(address));
    }

    void atomicStrongCAS32(RegisterID expectedAndResult, RegisterID newValue, Address address)
    {
        ASSERT(supportsLSE());
        m_assembler.casal<32>(expectedAndResult, newValue, extractSimpleAddress(address));
    }

    void atomicStrongCAS64(RegisterID expectedAndResult, RegisterID newValue, Address address)
    {
        ASSERT(supportsLSE());
        m_assembler.casal<64>(expectedAndResult, newValue, extractSimpleAddress(address));
    }
    
    void depend32(RegisterID src, RegisterID dest)
    {
        m_assembler.eor<32>(dest, src, src);
    }
    
    void depend64(RegisterID src, RegisterID dest)
    {
        m_assembler.eor<64>(dest, src, src);
    }

    ALWAYS_INLINE static bool supportsFloat16()
    {
#if HAVE(FLOAT16_INSTRUCTION)
        return true;
#else
        if (s_float16CheckState == CPUIDCheckState::NotChecked)
            collectCPUFeatures();

        return s_float16CheckState == CPUIDCheckState::Set;
#endif
    }

    ALWAYS_INLINE static bool supportsLSE()
    {
#if HAVE(LSE_INSTRUCTION)
        return true;
#else
        if (s_lseCheckState == CPUIDCheckState::NotChecked)
            collectCPUFeatures();

        return s_lseCheckState == CPUIDCheckState::Set;
#endif
    }

    ALWAYS_INLINE static bool supportsDoubleToInt32ConversionUsingJavaScriptSemantics()
    {
#if HAVE(FJCVTZS_INSTRUCTION)
        return true;
#else
        if (s_jscvtCheckState == CPUIDCheckState::NotChecked)
            collectCPUFeatures();

        return s_jscvtCheckState == CPUIDCheckState::Set;
#endif
    }

    ALWAYS_INLINE static bool supportsRoundFloatToIntegerFloat()
    {
#if HAVE(FRINT_INSTRUCTION)
        return true;
#else
        if (s_frintCheckState == CPUIDCheckState::NotChecked)
            collectCPUFeatures();

        return s_frintCheckState == CPUIDCheckState::Set;
#endif
    }

    void convertDoubleToInt32UsingJavaScriptSemantics(FPRegisterID src, RegisterID dest)
    {
        m_assembler.fjcvtzs(dest, src); // This zero extends.
    }
    
#if ENABLE(FAST_TLS_JIT)
    // This will use scratch registers if the offset is not legal.

    void loadFromTLS32(uint32_t offset, RegisterID dst)
    {
        m_assembler.mrs_TPIDRRO_EL0(dst);
#if !HAVE(SIMPLIFIED_FAST_TLS_BASE)
        and64(TrustedImm32(~7), dst);
#endif
        load32(Address(dst, offset), dst);
    }
    
    void loadFromTLS64(uint32_t offset, RegisterID dst)
    {
        m_assembler.mrs_TPIDRRO_EL0(dst);
#if !HAVE(SIMPLIFIED_FAST_TLS_BASE)
        and64(TrustedImm32(~7), dst);
#endif
        load64(Address(dst, offset), dst);
    }

    static bool loadFromTLSPtrNeedsMacroScratchRegister()
    {
        return true;
    }

    void storeToTLS32(RegisterID src, uint32_t offset)
    {
        RegisterID tmp = getCachedDataTempRegisterIDAndInvalidate();
        ASSERT(src != tmp);
        m_assembler.mrs_TPIDRRO_EL0(tmp);
#if !HAVE(SIMPLIFIED_FAST_TLS_BASE)
        and64(TrustedImm32(~7), tmp);
#endif
        store32(src, Address(tmp, offset));
    }
    
    void storeToTLS64(RegisterID src, uint32_t offset)
    {
        RegisterID tmp = getCachedDataTempRegisterIDAndInvalidate();
        ASSERT(src != tmp);
        m_assembler.mrs_TPIDRRO_EL0(tmp);
#if !HAVE(SIMPLIFIED_FAST_TLS_BASE)
        and64(TrustedImm32(~7), tmp);
#endif
        store64(src, Address(tmp, offset));
    }

    static bool storeToTLSPtrNeedsMacroScratchRegister()
    {
        return true;
    }
#endif // ENABLE(FAST_TLS_JIT)
    
    // SIMD

    void vectorReplaceLane(SIMDLane simdLane, TrustedImm32 lane, RegisterID src, FPRegisterID dest)
    {
        m_assembler.ins(dest, src, simdLane, lane.m_value);
    }

    void vectorReplaceLane(SIMDLane simdLane, TrustedImm32 lane, FPRegisterID src, FPRegisterID dest)
    {
        m_assembler.ins(dest, src, simdLane, lane.m_value);
    }

    DEFINE_SIMD_FUNCS(vectorReplaceLane);
    
    void vectorExtractLane(SIMDLane simdLane, SIMDSignMode signMode, TrustedImm32 lane, FPRegisterID src, RegisterID dest)
    {
        if (signMode == SIMDSignMode::Signed)
            m_assembler.smov(dest, src, simdLane, lane.m_value);
        else
            m_assembler.umov(dest, src, simdLane, lane.m_value);
    }

    void vectorExtractLane(SIMDLane simdLane, TrustedImm32 lane, FPRegisterID src, FPRegisterID dest)
    {
        if (!lane.m_value) {
            if (src != dest)
                moveDouble(src, dest);
            return;
        }
        m_assembler.dupElement(dest, src, simdLane, lane.m_value);
    }

    DEFINE_SIGNED_SIMD_FUNCS(vectorExtractLane);

    // The behavior is the same to vectorExtractLane on ARM64.
    void vectorDupElement(SIMDLane simdLane, TrustedImm32 lane, FPRegisterID src, FPRegisterID dest)
    {
        m_assembler.dupElement(dest, src, simdLane, lane.m_value);
    }

    DEFINE_SIMD_FUNCS(vectorDupElement);

    void compareFloatingPointVector(DoubleCondition cond, SIMDInfo simdInfo, FPRegisterID left, FPRegisterID right, FPRegisterID dest)
    {
        RELEASE_ASSERT(scalarTypeIsFloatingPoint(simdInfo.lane));
        switch (cond) {
        case DoubleEqualAndOrdered:
            m_assembler.fcmeq(dest, left, right, simdInfo.lane);
            break;
        case DoubleNotEqualOrUnordered:
            m_assembler.fcmeq(dest, left, right, simdInfo.lane);
            m_assembler.vectorNot(dest, dest);
            break;
        case DoubleGreaterThanAndOrdered:
            m_assembler.fcmgt(dest, left, right, simdInfo.lane);
            break;
        case DoubleGreaterThanOrEqualAndOrdered:
            m_assembler.fcmge(dest, left, right, simdInfo.lane);
            break;
        case DoubleLessThanAndOrdered:
            // a < b   =>   b > a
            m_assembler.fcmgt(dest, right, left, simdInfo.lane);
            break;
        case DoubleLessThanOrEqualAndOrdered:
            // a <= b   =>   b >= a
            m_assembler.fcmge(dest, right, left, simdInfo.lane);
            break;
        default:
            RELEASE_ASSERT_NOT_REACHED();
        }
    }

    void compareIntegerVector(RelationalCondition cond, SIMDInfo simdInfo, FPRegisterID left, FPRegisterID right, FPRegisterID dest)
    {
        RELEASE_ASSERT(scalarTypeIsIntegral(simdInfo.lane));

        switch (cond) {
        case Equal:
            m_assembler.cmeq(dest, left, right, simdInfo.lane);
            break;
        case NotEqual:
            m_assembler.cmeq(dest, left, right, simdInfo.lane);
            m_assembler.vectorNot(dest, dest);
            break;
        case Above:
            m_assembler.cmhi(dest, left, right, simdInfo.lane);
            break;
        case AboveOrEqual:
            m_assembler.cmhs(dest, left, right, simdInfo.lane);
            break;
        case Below:
            // a < b  =>  b > a
            m_assembler.cmhi(dest, right, left, simdInfo.lane);
            break;
        case BelowOrEqual:
            // a <= b  =>  b >= a
            m_assembler.cmhs(dest, right, left, simdInfo.lane);
            break;
        case GreaterThan:
            m_assembler.cmgt(dest, left, right, simdInfo.lane);
            break;
        case GreaterThanOrEqual:
            m_assembler.cmge(dest, left, right, simdInfo.lane);
            break;
        case LessThan:
            // a < b  =>  b > a
            m_assembler.cmgt(dest, right, left, simdInfo.lane);
            break;
        case LessThanOrEqual:
            // a <= b  =>  b >= a
            m_assembler.cmge(dest, right, left, simdInfo.lane);
            break;
        default:
            RELEASE_ASSERT_NOT_REACHED();
        }
    }

    void compareIntegerVectorWithZero(RelationalCondition cond, SIMDInfo simdInfo, FPRegisterID vector, FPRegisterID dest)
    {
        RELEASE_ASSERT(scalarTypeIsIntegral(simdInfo.lane));

        switch (cond) {
        case Equal:
            m_assembler.cmeqz(dest, vector, simdInfo.lane);
            break;
        case NotEqual:
            m_assembler.cmeqz(dest, vector, simdInfo.lane);
            m_assembler.vectorNot(dest, dest);
            break;
        default:
            RELEASE_ASSERT_NOT_REACHED();
        }
    }

    void add64(FPRegisterID left, FPRegisterID right, FPRegisterID dest)
    {
        m_assembler.add(dest, left, right);
    }

    void sub64(FPRegisterID left, FPRegisterID right, FPRegisterID dest)
    {
        m_assembler.sub(dest, left, right);
    }

    void vectorAdd(SIMDInfo simdInfo, FPRegisterID left, FPRegisterID right, FPRegisterID dest)
    {
        if (scalarTypeIsFloatingPoint(simdInfo.lane))
            m_assembler.vectorFadd(dest, left, right, simdInfo.lane);
        else
            m_assembler.vectorAdd(dest, left, right, simdInfo.lane);
    }

    void vectorSub(SIMDInfo simdInfo, FPRegisterID left, FPRegisterID right, FPRegisterID dest)
    {
        if (scalarTypeIsFloatingPoint(simdInfo.lane))
            m_assembler.vectorFsub(dest, left, right, simdInfo.lane);
        else
            m_assembler.vectorSub(dest, left, right, simdInfo.lane);
    }

    void vectorMul(SIMDInfo simdInfo, FPRegisterID left, FPRegisterID right, FPRegisterID dest)
    {
        if (scalarTypeIsFloatingPoint(simdInfo.lane))
            m_assembler.vectorFmul(dest, left, right, simdInfo.lane);
        else
            m_assembler.vectorMul(dest, left, right, simdInfo.lane);
    }

    void vectorMulByElementFloat32(FPRegisterID left, FPRegisterID right, TrustedImm32 lane, FPRegisterID dest)
    {
        m_assembler.vectorFmulByElement(dest, left, right, SIMDLane::f32x4, lane.m_value);
    }

    void vectorMulByElementFloat64(FPRegisterID left, FPRegisterID right, TrustedImm32 lane, FPRegisterID dest)
    {
        m_assembler.vectorFmulByElement(dest, left, right, SIMDLane::f64x2, lane.m_value);
    }

    void vectorFusedMulAdd(SIMDInfo simdInfo, FPRegisterID mul1, FPRegisterID mul2, FPRegisterID addend, FPRegisterID dest, FPRegisterID scratch)
    {
        ASSERT(scalarTypeIsFloatingPoint(simdInfo.lane));
        moveVector(addend, scratch);
        m_assembler.vectorFmla(scratch, mul1, mul2, simdInfo.lane);
        moveVector(scratch, dest);
    }

    void vectorFusedNegMulAdd(SIMDInfo simdInfo, FPRegisterID mul1, FPRegisterID mul2, FPRegisterID addend, FPRegisterID dest, FPRegisterID scratch)
    {
        ASSERT(scalarTypeIsFloatingPoint(simdInfo.lane));
        moveVector(addend, scratch);
        m_assembler.vectorFmls(scratch, mul1, mul2, simdInfo.lane);
        moveVector(scratch, dest);
    }

    void vectorDiv(SIMDInfo simdInfo, FPRegisterID left, FPRegisterID right, FPRegisterID dest)
    {
        ASSERT(scalarTypeIsFloatingPoint(simdInfo.lane));
        m_assembler.vectorFdiv(dest, left, right, simdInfo.lane);
    }

    void vectorMax(SIMDInfo simdInfo, FPRegisterID left, FPRegisterID right, FPRegisterID dest)
    {
        if (scalarTypeIsFloatingPoint(simdInfo.lane))
            m_assembler.vectorFmax(dest, left, right, simdInfo.lane);
        else {
            ASSERT(simdInfo.signMode != SIMDSignMode::None);
            if (simdInfo.signMode == SIMDSignMode::Signed)
                m_assembler.smax(dest, left, right, simdInfo.lane);
            else
                m_assembler.umax(dest, left, right, simdInfo.lane);
        }
    }

    void vectorMin(SIMDInfo simdInfo, FPRegisterID left, FPRegisterID right, FPRegisterID dest)
    {
        if (scalarTypeIsFloatingPoint(simdInfo.lane))
            m_assembler.vectorFmin(dest, left, right, simdInfo.lane);
        else {
            ASSERT(simdInfo.signMode != SIMDSignMode::None);
            if (simdInfo.signMode == SIMDSignMode::Signed)
                m_assembler.smin(dest, left, right, simdInfo.lane);
            else
                m_assembler.umin(dest, left, right, simdInfo.lane);
        }
    }

    void vectorPmin(SIMDInfo simdInfo, FPRegisterID left, FPRegisterID right, FPRegisterID dest, FPRegisterID scratch)
    {
        ASSERT(scalarTypeIsFloatingPoint(simdInfo.lane));
        ASSERT(left != scratch);
        ASSERT(right != scratch);
        // right < left ? right : left <=>
        // left > right, dest = right

        // each bit in lane is 1 if left > right
        m_assembler.fcmgt(scratch, left, right, simdInfo.lane);
        // 1 means use left
        m_assembler.bsl(scratch, right, left);
        moveVector(scratch, dest);

    }

    void vectorPmax(SIMDInfo simdInfo, FPRegisterID left, FPRegisterID right, FPRegisterID dest, FPRegisterID scratch)
    {
        ASSERT(scalarTypeIsFloatingPoint(simdInfo.lane));
        ASSERT(left != scratch);
        ASSERT(right != scratch);
        // right > left, dest = left
        m_assembler.fcmgt(scratch, right, left, simdInfo.lane);
        m_assembler.bsl(scratch, right, left);
        moveVector(scratch, dest);
    }

    void vectorBitwiseSelect(FPRegisterID left, FPRegisterID right, FPRegisterID inputBitsAndDest)
    {
        m_assembler.bsl(inputBitsAndDest, left, right);
    }

    void vectorNot(SIMDInfo simdInfo, FPRegisterID input, FPRegisterID dest)
    {
        ASSERT_UNUSED(simdInfo, simdInfo.lane == SIMDLane::v128);
        m_assembler.vectorNot(dest, input);
    }

    void vectorAnd(SIMDInfo simdInfo, FPRegisterID left, FPRegisterID right, FPRegisterID dest)
    {
        ASSERT_UNUSED(simdInfo, simdInfo.lane == SIMDLane::v128);
        m_assembler.vand<128>(dest, left, right);
    }

    void vectorAndnot(SIMDInfo simdInfo, FPRegisterID left, FPRegisterID right, FPRegisterID dest)
    {
        ASSERT_UNUSED(simdInfo, simdInfo.lane == SIMDLane::v128);
        m_assembler.vbic<128>(dest, left, right);
    }

    void vectorOr(SIMDInfo simdInfo, FPRegisterID left, FPRegisterID right, FPRegisterID dest)
    {
        ASSERT_UNUSED(simdInfo, simdInfo.lane == SIMDLane::v128);
        m_assembler.vorr<128>(dest, left, right);
    }

    void vectorXor(SIMDInfo simdInfo, FPRegisterID left, FPRegisterID right, FPRegisterID dest)
    {
        ASSERT_UNUSED(simdInfo, simdInfo.lane == SIMDLane::v128);
        m_assembler.vectorEor(dest, left, right);
    }

    void moveZeroToVector(FPRegisterID dest)
    {
        m_assembler.movi<128>(dest, 0);
    }

    void vectorAbs(SIMDInfo simdInfo, FPRegisterID input, FPRegisterID dest)
    {
        if (scalarTypeIsFloatingPoint(simdInfo.lane))
            m_assembler.vectorFabs(dest, input, simdInfo.lane);
        else
            m_assembler.vectorAbs(dest, input, simdInfo.lane);
    }

    void vectorNeg(SIMDInfo simdInfo, FPRegisterID input, FPRegisterID dest)
    {
        if (scalarTypeIsFloatingPoint(simdInfo.lane))
            m_assembler.vectorFneg(dest, input, simdInfo.lane);
        else
            m_assembler.vectorNeg(dest, input, simdInfo.lane);
    }

    void vectorPopcnt(SIMDInfo simdInfo, FPRegisterID input, FPRegisterID dest)
    {
        ASSERT(simdInfo.lane == SIMDLane::i8x16);
        m_assembler.vectorCnt(dest, input, simdInfo.lane);
    }

    void vectorCeil(SIMDInfo simdInfo, FPRegisterID input, FPRegisterID dest)
    {
        ASSERT(scalarTypeIsFloatingPoint(simdInfo.lane));
        m_assembler.vectorFrintp(dest, input, simdInfo.lane);
    }

    void vectorFloor(SIMDInfo simdInfo, FPRegisterID input, FPRegisterID dest)
    {
        ASSERT(scalarTypeIsFloatingPoint(simdInfo.lane));
        m_assembler.vectorFrintm(dest, input, simdInfo.lane);
    }

    void vectorTrunc(SIMDInfo simdInfo, FPRegisterID input, FPRegisterID dest)
    {
        ASSERT(scalarTypeIsFloatingPoint(simdInfo.lane));
        m_assembler.vectorFrintz(dest, input, simdInfo.lane);
    }

    void vectorTruncSat(SIMDInfo simdInfo, FPRegisterID input, FPRegisterID dest)
    {
        ASSERT(scalarTypeIsFloatingPoint(simdInfo.lane));
        ASSERT(simdInfo.signMode != SIMDSignMode::None);
        if (simdInfo.signMode == SIMDSignMode::Signed) {
            m_assembler.vectorFcvtzs(dest, input, simdInfo.lane);
            if (simdInfo.lane == SIMDLane::f64x2)
                m_assembler.sqxtn(dest, dest, simdInfo.lane);
        } else {
            m_assembler.vectorFcvtzu(dest, input, simdInfo.lane);
            if (simdInfo.lane == SIMDLane::f64x2)
                m_assembler.uqxtn(dest, dest, simdInfo.lane);
        }
    }

    void vectorNearest(SIMDInfo simdInfo, FPRegisterID input, FPRegisterID dest)
    {
        ASSERT(scalarTypeIsFloatingPoint(simdInfo.lane));
        m_assembler.vectorFrintn(dest, input, simdInfo.lane);
    }

    void vectorSqrt(SIMDInfo simdInfo, FPRegisterID input, FPRegisterID dest)
    {
        ASSERT(scalarTypeIsFloatingPoint(simdInfo.lane));
        m_assembler.vectorFsqrt(dest, input, simdInfo.lane);
    }

    void vectorExtendLow(SIMDInfo simdInfo, FPRegisterID input, FPRegisterID dest)
    {
        ASSERT(simdInfo.signMode != SIMDSignMode::None);
        ASSERT(elementByteSize(simdInfo.lane) <= 8 && elementByteSize(simdInfo.lane) >=2);
        if (simdInfo.signMode == SIMDSignMode::Signed)
            m_assembler.sxtl(dest, input, simdInfo.lane);
        else
            m_assembler.uxtl(dest, input, simdInfo.lane);
    }

    void vectorExtendHigh(SIMDInfo simdInfo, FPRegisterID input, FPRegisterID dest)
    {
        ASSERT(simdInfo.signMode != SIMDSignMode::None);
        ASSERT(elementByteSize(simdInfo.lane) <= 8 && elementByteSize(simdInfo.lane) >=2);
        if (simdInfo.signMode == SIMDSignMode::Signed)
            m_assembler.sxtl2(dest, input, simdInfo.lane);
        else
            m_assembler.uxtl2(dest, input, simdInfo.lane);
    }

    void vectorPromote(SIMDInfo simdInfo, FPRegisterID input, FPRegisterID dest)
    {
        ASSERT(simdInfo.lane == SIMDLane::f32x4);
        m_assembler.fcvtl(dest, input, simdInfo.lane);
    }

    void vectorDemote(SIMDInfo simdInfo, FPRegisterID input, FPRegisterID dest)
    {
        ASSERT(simdInfo.lane == SIMDLane::f64x2);
        m_assembler.fcvtn(dest, input, simdInfo.lane);
    }

    void vectorNarrow(SIMDInfo simdInfo, FPRegisterID lower, FPRegisterID upper, FPRegisterID dest, FPRegisterID scratch)
    {
        ASSERT(simdInfo.signMode != SIMDSignMode::None);
        ASSERT(scalarTypeIsIntegral(simdInfo.lane));
        ASSERT(scratch != upper);
        if (simdInfo.signMode == SIMDSignMode::Signed) {
            m_assembler.sqxtn(scratch, lower, simdInfo.lane);
            m_assembler.sqxtn2(scratch, upper, simdInfo.lane);
        } else {
            m_assembler.sqxtun(scratch, lower, simdInfo.lane);
            m_assembler.sqxtun2(scratch, upper, simdInfo.lane);
        }
        moveVector(scratch, dest);
    }

    void vectorConvert(SIMDInfo simdInfo, FPRegisterID input, FPRegisterID dest)
    {
        ASSERT(scalarTypeIsIntegral(simdInfo.lane));
        ASSERT(elementByteSize(simdInfo.lane) == 4);
        ASSERT(simdInfo.signMode != SIMDSignMode::None);
        // Going from i32x4 to f32x4
        if (simdInfo.signMode == SIMDSignMode::Signed)
            m_assembler.vectorScvtf(dest, input, simdInfo.lane);
        else
            m_assembler.vectorUcvtf(dest, input, simdInfo.lane);
    }

    void vectorConvertLow(SIMDInfo simdInfo, FPRegisterID input, FPRegisterID dest)
    {
        ASSERT(scalarTypeIsIntegral(simdInfo.lane));
        ASSERT(elementByteSize(simdInfo.lane) == 4);
        vectorExtendLow({ SIMDLane::i64x2, simdInfo.signMode }, input, dest);
        // Going from lower two elements of i32x4 to f64x2
        if (simdInfo.signMode == SIMDSignMode::Signed)
            m_assembler.vectorScvtf(dest, dest, SIMDLane::f64x2);
        else
            m_assembler.vectorUcvtf(dest, dest, SIMDLane::f64x2);
    }

    void vectorUshl(SIMDInfo simdInfo, FPRegisterID input, FPRegisterID shift, FPRegisterID dest)
    {
        ASSERT(scalarTypeIsIntegral(simdInfo.lane));
        m_assembler.ushl(dest, input, shift, simdInfo.lane);
    }

    void vectorSshl(SIMDInfo simdInfo, FPRegisterID input, FPRegisterID shift, FPRegisterID dest)
    {
        ASSERT(scalarTypeIsIntegral(simdInfo.lane));
        m_assembler.sshl(dest, input, shift, simdInfo.lane);
    }

    void vectorSshr8(SIMDInfo simdInfo, FPRegisterID input, TrustedImm32 shift, FPRegisterID dest)
    {
        ASSERT(scalarTypeIsIntegral(simdInfo.lane));
        m_assembler.sshr_vi(dest, input, shift.m_value, simdInfo.lane);
    }

    void vectorHorizontalAdd(SIMDInfo simdInfo, FPRegisterID input, FPRegisterID dest)
    {
        RELEASE_ASSERT(scalarTypeIsIntegral(simdInfo.lane));
        RELEASE_ASSERT(simdInfo.lane != SIMDLane::i64x2);
        m_assembler.addv(dest, input, simdInfo.lane);
    }

    void vectorZipUpper(SIMDInfo simdInfo, FPRegisterID n, FPRegisterID m, FPRegisterID dest)
    {
        ASSERT(scalarTypeIsIntegral(simdInfo.lane));
        m_assembler.zip1(dest, n, m, simdInfo.lane);
    }

    void vectorUnzipEven(SIMDInfo simdInfo, FPRegisterID n, FPRegisterID m, FPRegisterID dest)
    {
        ASSERT(scalarTypeIsIntegral(simdInfo.lane));
        m_assembler.uzip1(dest, n, m, simdInfo.lane);
    }

    void reverseBits64(RegisterID src, RegisterID dest)
    {
        m_assembler.rbit<64>(dest, src);
    }

    void reverseBits32(RegisterID src, RegisterID dest)
    {
        m_assembler.rbit<32>(dest, src);
    }

    void vectorExtractPair(SIMDInfo simdInfo, TrustedImm32 firstLane, FPRegisterID n, FPRegisterID m, FPRegisterID dest)
    {
        ASSERT(simdInfo.lane == SIMDLane::i8x16);
        m_assembler.ext(dest, n, m, firstLane.m_value, simdInfo.lane);
    }

    void vectorSplat(SIMDLane lane, RegisterID src, FPRegisterID dest)
    {
        ASSERT(scalarTypeIsIntegral(lane));
        m_assembler.dupGeneral(dest, src, lane);
    }

    void vectorSplat(SIMDLane lane, FPRegisterID src, FPRegisterID dest)
    {
        ASSERT(scalarTypeIsFloatingPoint(lane));
        m_assembler.dupElement(dest, src, lane, 0);
    }

    void vectorSplatInt8(RegisterID src, FPRegisterID dest) { vectorSplat(SIMDLane::i8x16, src, dest); }
    void vectorSplatInt16(RegisterID src, FPRegisterID dest) { vectorSplat(SIMDLane::i16x8, src, dest); }
    void vectorSplatInt32(RegisterID src, FPRegisterID dest) { vectorSplat(SIMDLane::i32x4, src, dest); }
    void vectorSplatInt64(RegisterID src, FPRegisterID dest) { vectorSplat(SIMDLane::i64x2, src, dest); }
    void vectorSplatFloat32(FPRegisterID src, FPRegisterID dest) { vectorSplat(SIMDLane::f32x4, src, dest); }
    void vectorSplatFloat64(FPRegisterID src, FPRegisterID dest) { vectorSplat(SIMDLane::f64x2, src, dest); }

    void vectorAddSat(SIMDInfo simdInfo, FPRegisterID left, FPRegisterID right, FPRegisterID dest)
    {
        ASSERT(scalarTypeIsIntegral(simdInfo.lane));
        ASSERT(simdInfo.signMode != SIMDSignMode::None);
        if (simdInfo.signMode == SIMDSignMode::Signed)
            m_assembler.sqadd(dest, left, right, simdInfo.lane);
        else
            m_assembler.uqadd(dest, left, right, simdInfo.lane);
    }

    void vectorSubSat(SIMDInfo simdInfo, FPRegisterID left, FPRegisterID right, FPRegisterID dest)
    {
        ASSERT(scalarTypeIsIntegral(simdInfo.lane));
        ASSERT(simdInfo.signMode != SIMDSignMode::None);
        if (simdInfo.signMode == SIMDSignMode::Signed)
            m_assembler.sqsub(dest, left, right, simdInfo.lane);
        else
            m_assembler.uqsub(dest, left, right, simdInfo.lane);
    }

    void vectorLoad8Splat(Address address, FPRegisterID dest) { m_assembler.ld1r<8>(dest, extractSimpleAddress(address)); }
    void vectorLoad16Splat(Address address, FPRegisterID dest) { m_assembler.ld1r<16>(dest, extractSimpleAddress(address)); }
    void vectorLoad32Splat(Address address, FPRegisterID dest) { m_assembler.ld1r<32>(dest, extractSimpleAddress(address)); }
    void vectorLoad64Splat(Address address, FPRegisterID dest) { m_assembler.ld1r<64>(dest, extractSimpleAddress(address)); }

    void vectorLoad8Lane(Address address, TrustedImm32 imm, FPRegisterID dest) { m_assembler.ld1<8>(dest, extractSimpleAddress(address), imm.m_value); }
    void vectorLoad16Lane(Address address, TrustedImm32 imm, FPRegisterID dest) { m_assembler.ld1<16>(dest, extractSimpleAddress(address), imm.m_value); }
    void vectorLoad32Lane(Address address, TrustedImm32 imm, FPRegisterID dest) { m_assembler.ld1<32>(dest, extractSimpleAddress(address), imm.m_value); }
    void vectorLoad64Lane(Address address, TrustedImm32 imm, FPRegisterID dest) { m_assembler.ld1<64>(dest, extractSimpleAddress(address), imm.m_value); }

    void vectorStore8Lane(FPRegisterID val, Address address, TrustedImm32 imm) { m_assembler.st1<8>(val, extractSimpleAddress(address), imm.m_value); }
    void vectorStore16Lane(FPRegisterID val, Address address, TrustedImm32 imm) { m_assembler.st1<16>(val, extractSimpleAddress(address), imm.m_value); }
    void vectorStore32Lane(FPRegisterID val, Address address, TrustedImm32 imm) { m_assembler.st1<32>(val, extractSimpleAddress(address), imm.m_value); }
    void vectorStore64Lane(FPRegisterID val, Address address, TrustedImm32 imm) { m_assembler.st1<64>(val, extractSimpleAddress(address), imm.m_value); }

    void vectorUnsignedMax(SIMDInfo simdInfo, FPRegisterID vec, FPRegisterID dst) 
    {
        switch (simdInfo.lane) {
        case SIMDLane::i32x4:
            m_assembler.umaxv<32>(dst, vec);
            return;
        case SIMDLane::i16x8:
            m_assembler.umaxv<16>(dst, vec);
            return;
        case SIMDLane::i8x16:
            m_assembler.umaxv<8>(dst, vec);
            return;
        default:
            break;
        }
        RELEASE_ASSERT_NOT_REACHED();
    }

    void vectorUnsignedMin(SIMDInfo simdInfo, FPRegisterID vec, FPRegisterID dst) 
    {
        switch (simdInfo.lane) {
        case SIMDLane::i32x4:
            m_assembler.uminv<32>(dst, vec);
            return;
        case SIMDLane::i16x8:
            m_assembler.uminv<16>(dst, vec);
            return;
        case SIMDLane::i8x16:
            m_assembler.uminv<8>(dst, vec);
            return;
        default:
            break;
        }
        RELEASE_ASSERT_NOT_REACHED();
    }

    void vectorAnyTrue(FPRegisterID, RegisterID) 
    { 
        // This macro should have been lowered by now.
        bool hideNoReturn = true;
        if (hideNoReturn)
            RELEASE_ASSERT_NOT_REACHED();
    }

    void vectorAllTrue(SIMDInfo, FPRegisterID, RegisterID)
    {
        // This macro should have been lowered by now.
        bool hideNoReturn = true;
        if (hideNoReturn)
            RELEASE_ASSERT_NOT_REACHED();
    }

    void vectorBitmask(SIMDInfo, FPRegisterID, RegisterID) 
    {
        // This macro should have been lowered by now.
        bool hideNoReturn = true;
        if (hideNoReturn)
            RELEASE_ASSERT_NOT_REACHED();
    }

    void vectorExtaddPairwise(SIMDInfo simdInfo, FPRegisterID a, FPRegisterID dst)
    {
        if (simdInfo.signMode == SIMDSignMode::Signed)
            m_assembler.vectorSaddlp(dst, a, simdInfo.lane);
        else
            m_assembler.vectorUaddlp(dst, a, simdInfo.lane);
    }

    void vectorAddPairwise(SIMDInfo simdInfo, FPRegisterID a, FPRegisterID b, FPRegisterID dst)
    {
        ASSERT(scalarTypeIsIntegral(simdInfo.lane));
        ASSERT(simdInfo.signMode == SIMDSignMode::None);
        m_assembler.addpv(dst, a, b, simdInfo.lane);
    }

    void vectorAvgRound(SIMDInfo simdInfo, FPRegisterID a, FPRegisterID b, FPRegisterID dest) { m_assembler.urhadd(dest, a, b, simdInfo.lane); }
    
    void vectorMulSat(FPRegisterID a, FPRegisterID b, FPRegisterID dest)
    {
        // (i_1 * i_2 + 2^14) >> 15
        // <=>
        // (i_1 * i_2 * 2 + 2^15) >> 16
        // <=>
        // i_1 * i_2 * 2 + 2^15 (high half)
        m_assembler.sqrdmulhv(dest, a, b, SIMDLane::i16x8);
    }

    void vectorDotProduct(FPRegisterID a, FPRegisterID b, FPRegisterID dest, FPRegisterID scratch) 
    {
        ASSERT(scratch != dest);
        ASSERT(scratch != a);
        ASSERT(scratch != b);
        m_assembler.smullv(scratch, a, b, SIMDLane::i16x8);
        m_assembler.smull2v(dest, a, b, SIMDLane::i16x8);
        m_assembler.addpv(dest, scratch, dest, SIMDLane::i32x4);
    }
    void vectorSwizzle(FPRegisterID a, FPRegisterID control, FPRegisterID dest) { m_assembler.tbl(dest, a, control); }
    void vectorSwizzle2(FPRegisterID a, FPRegisterID b, FPRegisterID control, FPRegisterID dest)
    {
        RELEASE_ASSERT(b == a + 1);
        m_assembler.tbl2(dest, a, b, control);
    }

    // Misc helper functions.

    // Invert a relational condition, e.g. == becomes !=, < becomes >=, etc.
    static RelationalCondition invert(RelationalCondition cond)
    {
        return static_cast<RelationalCondition>(Assembler::invert(static_cast<Assembler::Condition>(cond)));
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

    template<PtrTag resultTag, PtrTag locationTag>
    static CodePtr<resultTag> readCallTarget(CodeLocationCall<locationTag> call)
    {
        return CodePtr<resultTag>(Assembler::readCallTarget(call.dataLocation()));
    }

    template<PtrTag tag>
    static void replaceWithVMHalt(CodeLocationLabel<tag> instructionStart)
    {
        Assembler::replaceWithVMHalt(instructionStart.dataLocation());
    }

    template<PtrTag startTag, PtrTag destTag>
    static void replaceWithJump(CodeLocationLabel<startTag> instructionStart, CodeLocationLabel<destTag> destination)
    {
        Assembler::replaceWithJump(instructionStart.dataLocation(), destination.dataLocation());
    }

    template<PtrTag startTag>
    static void replaceWithNops(CodeLocationLabel<startTag> instructionStart, size_t memoryToFillWithNopsInBytes)
    {
        Assembler::replaceWithNops(instructionStart.dataLocation(), memoryToFillWithNopsInBytes);
    }

    static ptrdiff_t maxJumpReplacementSize()
    {
        return Assembler::maxJumpReplacementSize();
    }

    static ptrdiff_t patchableJumpSize()
    {
        return Assembler::patchableJumpSize();
    }

    RegisterID scratchRegisterForBlinding()
    {
        // We *do not* have a scratch register for blinding.
        RELEASE_ASSERT_NOT_REACHED();
        return getCachedDataTempRegisterIDAndInvalidate();
    }

    static bool canJumpReplacePatchableBranchPtrWithPatch() { return false; }
    static bool canJumpReplacePatchableBranch32WithPatch() { return false; }

    template<PtrTag tag>
    static CodeLocationLabel<tag> startOfBranchPtrWithPatchOnRegister(CodeLocationDataLabelPtr<tag> label)
    {
        return label.labelAtOffset(0);
    }

    template<PtrTag tag>
    static CodeLocationLabel<tag> startOfPatchableBranchPtrWithPatchOnAddress(CodeLocationDataLabelPtr<tag>)
    {
        UNREACHABLE_FOR_PLATFORM();
        return CodeLocationLabel<tag>();
    }

    template<PtrTag tag>
    static CodeLocationLabel<tag> startOfPatchableBranch32WithPatchOnAddress(CodeLocationDataLabel32<tag>)
    {
        UNREACHABLE_FOR_PLATFORM();
        return CodeLocationLabel<tag>();
    }

    template<PtrTag tag>
    static void revertJumpReplacementToBranchPtrWithPatch(CodeLocationLabel<tag> instructionStart, RegisterID, void* initialValue)
    {
        reemitInitialMoveWithPatch(instructionStart.dataLocation(), initialValue);
    }

    template<PtrTag tag>
    static void revertJumpReplacementToPatchableBranchPtrWithPatch(CodeLocationLabel<tag>, Address, void*)
    {
        UNREACHABLE_FOR_PLATFORM();
    }

    template<PtrTag tag>
    static void revertJumpReplacementToPatchableBranch32WithPatch(CodeLocationLabel<tag>, Address, int32_t)
    {
        UNREACHABLE_FOR_PLATFORM();
    }

    template<PtrTag callTag, PtrTag destTag>
    static void repatchCall(CodeLocationCall<callTag> call, CodeLocationLabel<destTag> destination)
    {
        Assembler::repatchPointer(call.dataLabelPtrAtOffset(REPATCH_OFFSET_CALL_TO_POINTER).dataLocation(), destination.taggedPtr());
    }

    template<PtrTag callTag, PtrTag destTag>
    static void repatchCall(CodeLocationCall<callTag> call, CodePtr<destTag> destination)
    {
        Assembler::repatchPointer(call.dataLabelPtrAtOffset(REPATCH_OFFSET_CALL_TO_POINTER).dataLocation(), destination.taggedPtr());
    }

    JSC_OPERATION_VALIDATION_MACROASSEMBLER_ARM64_SUPPORT();

protected:
    ALWAYS_INLINE Jump makeBranch(Assembler::Condition cond)
    {
        if (m_makeJumpPatchable)
            padBeforePatch();
        m_assembler.b_cond(cond);
        AssemblerLabel label = m_assembler.labelIgnoringWatchpoints();
        m_assembler.nop();
        return Jump(label, m_makeJumpPatchable ? Assembler::JumpConditionFixedSize : Assembler::JumpCondition, cond);
    }
    ALWAYS_INLINE Jump makeBranch(RelationalCondition cond) { return makeBranch(ARM64Condition(cond)); }
    ALWAYS_INLINE Jump makeBranch(ResultCondition cond) { return makeBranch(ARM64Condition(cond)); }
    ALWAYS_INLINE Jump makeBranch(DoubleCondition cond) { return makeBranch(ARM64Condition(cond)); }

    template <int dataSize>
    ALWAYS_INLINE Jump makeCompareAndBranch(ZeroCondition cond, RegisterID reg)
    {
        if (m_makeJumpPatchable)
            padBeforePatch();
        if (cond == IsZero)
            m_assembler.cbz<dataSize>(reg);
        else
            m_assembler.cbnz<dataSize>(reg);
        AssemblerLabel label = m_assembler.labelIgnoringWatchpoints();
        m_assembler.nop();
        return Jump(label, m_makeJumpPatchable ? Assembler::JumpCompareAndBranchFixedSize : Assembler::JumpCompareAndBranch, static_cast<Assembler::Condition>(cond), dataSize == 64, reg);
    }

    ALWAYS_INLINE Jump makeTestBitAndBranch(RegisterID reg, unsigned bit, ZeroCondition cond)
    {
        if (m_makeJumpPatchable)
            padBeforePatch();
        ASSERT(bit < 64);
        bit &= 0x3f;
        if (cond == IsZero)
            m_assembler.tbz(reg, bit);
        else
            m_assembler.tbnz(reg, bit);
        AssemblerLabel label = m_assembler.labelIgnoringWatchpoints();
        m_assembler.nop();
        return Jump(label, m_makeJumpPatchable ? Assembler::JumpTestBitFixedSize : Assembler::JumpTestBit, static_cast<Assembler::Condition>(cond), bit, reg);
    }

    Assembler::Condition ARM64Condition(RelationalCondition cond)
    {
        return static_cast<Assembler::Condition>(cond);
    }

    Assembler::Condition ARM64Condition(ResultCondition cond)
    {
        return static_cast<Assembler::Condition>(cond);
    }

    Assembler::Condition ARM64Condition(DoubleCondition cond)
    {
        return static_cast<Assembler::Condition>(cond);
    }
    
protected:
    ALWAYS_INLINE RegisterID getCachedDataTempRegisterIDAndInvalidate()
    {
        RELEASE_ASSERT(m_allowScratchRegister);
        return dataMemoryTempRegister().registerIDInvalidate();
    }
    ALWAYS_INLINE RegisterID getCachedMemoryTempRegisterIDAndInvalidate()
    {
        RELEASE_ASSERT(m_allowScratchRegister);
        return cachedMemoryTempRegister().registerIDInvalidate();
    }
    ALWAYS_INLINE CachedTempRegister& dataMemoryTempRegister()
    {
        RELEASE_ASSERT(m_allowScratchRegister);
        return m_dataMemoryTempRegister;
    }
    ALWAYS_INLINE CachedTempRegister& cachedMemoryTempRegister()
    {
        RELEASE_ASSERT(m_allowScratchRegister);
        return m_cachedMemoryTempRegister;
    }

    template<typename ImmediateType, typename rawType>
    void moveInternal(ImmediateType imm, RegisterID dest)
    {
        const int dataSize = sizeof(rawType) * 8;
        const int numberHalfWords = dataSize / 16;
        rawType value = std::bit_cast<rawType>(imm.m_value);
        uint16_t halfword[numberHalfWords];

        // Handle 0 and ~0 here to simplify code below
        if (!value) {
            m_assembler.movz<dataSize>(dest, 0);
            return;
        }
        if (!~value) {
            m_assembler.movn<dataSize>(dest, 0);
            return;
        }

        LogicalImmediate logicalImm = dataSize == 64 ? LogicalImmediate::create64(static_cast<uint64_t>(value)) : LogicalImmediate::create32(static_cast<uint32_t>(value));

        if (logicalImm.isValid()) {
            m_assembler.movi<dataSize>(dest, logicalImm);
            return;
        }

        // Figure out how many halfwords are 0 or FFFF, then choose movz or movn accordingly.
        int zeroOrNegateVote = 0;
        for (int i = 0; i < numberHalfWords; ++i) {
            halfword[i] = getHalfword(value, i);
            if (!halfword[i])
                zeroOrNegateVote++;
            else if (halfword[i] == 0xffff)
                zeroOrNegateVote--;
        }

        bool needToClearRegister = true;
        if (zeroOrNegateVote >= 0) {
            for (int i = 0; i < numberHalfWords; i++) {
                if (halfword[i]) {
                    if (needToClearRegister) {
                        m_assembler.movz<dataSize>(dest, halfword[i], 16*i);
                        needToClearRegister = false;
                    } else
                        m_assembler.movk<dataSize>(dest, halfword[i], 16*i);
                }
            }
        } else {
            for (int i = 0; i < numberHalfWords; i++) {
                if (halfword[i] != 0xffff) {
                    if (needToClearRegister) {
                        m_assembler.movn<dataSize>(dest, ~halfword[i], 16*i);
                        needToClearRegister = false;
                    } else
                        m_assembler.movk<dataSize>(dest, halfword[i], 16*i);
                }
            }
        }
    }

    template<int datasize>
    ALWAYS_INLINE void loadUnsignedImmediate(RegisterID rt, RegisterID rn, unsigned pimm)
    {
        m_assembler.ldr<datasize>(rt, rn, pimm);
    }

    template<int datasize>
    ALWAYS_INLINE void loadUnscaledImmediate(RegisterID rt, RegisterID rn, int simm)
    {
        m_assembler.ldur<datasize>(rt, rn, simm);
    }

    template<int datasize>
    ALWAYS_INLINE void loadSignedAddressedByUnsignedImmediate(RegisterID rt, RegisterID rn, unsigned pimm)
    {
        loadUnsignedImmediate<datasize>(rt, rn, pimm);
    }

    template<int datasize>
    ALWAYS_INLINE void loadSignedAddressedByUnscaledImmediate(RegisterID rt, RegisterID rn, int simm)
    {
        loadUnscaledImmediate<datasize>(rt, rn, simm);
    }

    template<int datasize>
    ALWAYS_INLINE void storeUnsignedImmediate(RegisterID rt, RegisterID rn, unsigned pimm)
    {
        m_assembler.str<datasize>(rt, rn, pimm);
    }

    template<int datasize>
    ALWAYS_INLINE void storeUnscaledImmediate(RegisterID rt, RegisterID rn, int simm)
    {
        m_assembler.stur<datasize>(rt, rn, simm);
    }

    void moveWithFixedWidth(TrustedImm32 imm, RegisterID dest)
    {
        int32_t value = imm.m_value;
        m_assembler.movz<32>(dest, getHalfword(value, 0));
        m_assembler.movk<32>(dest, getHalfword(value, 1), 16);
    }

    void moveWithFixedWidth(TrustedImmPtr imm, RegisterID dest)
    {
        intptr_t value = reinterpret_cast<intptr_t>(imm.m_value);
        m_assembler.movz<64>(dest, getHalfword(value, 0));
        m_assembler.movk<64>(dest, getHalfword(value, 1), 16);
        if constexpr (Assembler::NUMBER_OF_ADDRESS_ENCODING_INSTRUCTIONS > 2)
            m_assembler.movk<64>(dest, getHalfword(value, 2), 32);
        if constexpr (Assembler::NUMBER_OF_ADDRESS_ENCODING_INSTRUCTIONS > 3)
            m_assembler.movk<64>(dest, getHalfword(value, 3), 48);
    }

    void signExtend32ToPtrWithFixedWidth(int32_t value, RegisterID dest)
    {
        if (value >= 0) {
            m_assembler.movz<32>(dest, getHalfword(value, 0));
            m_assembler.movk<32>(dest, getHalfword(value, 1), 16);
        } else {
            m_assembler.movn<32>(dest, ~getHalfword(value, 0));
            m_assembler.movk<32>(dest, getHalfword(value, 1), 16);
        }
    }

    template<int datasize>
    ALWAYS_INLINE void load(const void* address, RegisterID dest)
    {
        intptr_t currentRegisterContents;
        if (cachedMemoryTempRegister().value(currentRegisterContents)) {
            intptr_t addressAsInt = reinterpret_cast<intptr_t>(address);
            intptr_t addressDelta = addressAsInt - currentRegisterContents;

            if (dest == memoryTempRegister)
                cachedMemoryTempRegister().invalidate();

            if (isInt<32>(addressDelta)) {
                if (Assembler::canEncodeSImmOffset(addressDelta)) {
                    loadUnscaledImmediate<datasize>(dest, memoryTempRegister, addressDelta);
                    return;
                }

                if (Assembler::canEncodePImmOffset<datasize>(addressDelta)) {
                    loadUnsignedImmediate<datasize>(dest, memoryTempRegister, addressDelta);
                    return;
                }
            }

            if ((addressAsInt & (~maskHalfWord0)) == (currentRegisterContents & (~maskHalfWord0))) {
                m_assembler.movk<64>(memoryTempRegister, addressAsInt & maskHalfWord0, 0);
                cachedMemoryTempRegister().setValue(reinterpret_cast<intptr_t>(address));
                if constexpr (datasize == 16)
                    m_assembler.ldrh(dest, memoryTempRegister, ARM64Registers::zr);
                else
                    m_assembler.ldr<datasize>(dest, memoryTempRegister, ARM64Registers::zr);
                return;
            }
        }

        move(TrustedImmPtr(address), memoryTempRegister);
        if (dest == memoryTempRegister)
            cachedMemoryTempRegister().invalidate();
        else
            cachedMemoryTempRegister().setValue(reinterpret_cast<intptr_t>(address));
        if constexpr (datasize == 16)
            m_assembler.ldrh(dest, memoryTempRegister, ARM64Registers::zr);
        else
            m_assembler.ldr<datasize>(dest, memoryTempRegister, ARM64Registers::zr);
    }

    template<int datasize>
    ALWAYS_INLINE void store(RegisterID src, const void* address)
    {
        ASSERT(src != memoryTempRegister);
        intptr_t currentRegisterContents;
        if (cachedMemoryTempRegister().value(currentRegisterContents)) {
            intptr_t addressAsInt = reinterpret_cast<intptr_t>(address);
            intptr_t addressDelta = addressAsInt - currentRegisterContents;

            if (isInt<32>(addressDelta)) {
                if (Assembler::canEncodeSImmOffset(addressDelta)) {
                    storeUnscaledImmediate<datasize>(src, memoryTempRegister, addressDelta);
                    return;
                }

                if (Assembler::canEncodePImmOffset<datasize>(addressDelta)) {
                    storeUnsignedImmediate<datasize>(src, memoryTempRegister, addressDelta);
                    return;
                }
            }

            if ((addressAsInt & (~maskHalfWord0)) == (currentRegisterContents & (~maskHalfWord0))) {
                m_assembler.movk<64>(memoryTempRegister, addressAsInt & maskHalfWord0, 0);
                cachedMemoryTempRegister().setValue(reinterpret_cast<intptr_t>(address));
                if constexpr (datasize == 16)
                    m_assembler.strh(src, memoryTempRegister, ARM64Registers::zr);
                else
                    m_assembler.str<datasize>(src, memoryTempRegister, ARM64Registers::zr);
                return;
            }
        }

        move(TrustedImmPtr(address), memoryTempRegister);
        cachedMemoryTempRegister().setValue(reinterpret_cast<intptr_t>(address));
        if constexpr (datasize == 16)
            m_assembler.strh(src, memoryTempRegister, ARM64Registers::zr);
        else
            m_assembler.str<datasize>(src, memoryTempRegister, ARM64Registers::zr);
    }

    template <int dataSize>
    ALWAYS_INLINE bool tryMoveUsingCacheRegisterContents(intptr_t immediate, CachedTempRegister& dest)
    {
        intptr_t currentRegisterContents;
        if (dest.value(currentRegisterContents)) {
            if (currentRegisterContents == immediate)
                return true;

            LogicalImmediate logicalImm = dataSize == 64 ? LogicalImmediate::create64(static_cast<uint64_t>(immediate)) : LogicalImmediate::create32(static_cast<uint32_t>(immediate));

            if (logicalImm.isValid()) {
                m_assembler.movi<dataSize>(dest.registerIDNoInvalidate(), logicalImm);
                dest.setValue(immediate);
                return true;
            }

            if ((immediate & maskUpperWord) == (currentRegisterContents & maskUpperWord)) {
                if ((immediate & maskHalfWord1) != (currentRegisterContents & maskHalfWord1))
                    m_assembler.movk<dataSize>(dest.registerIDNoInvalidate(), (immediate & maskHalfWord1) >> 16, 16);

                if ((immediate & maskHalfWord0) != (currentRegisterContents & maskHalfWord0))
                    m_assembler.movk<dataSize>(dest.registerIDNoInvalidate(), immediate & maskHalfWord0, 0);

                dest.setValue(immediate);
                return true;
            }
        }

        return false;
    }

    void moveToCachedReg(TrustedImm32 imm, CachedTempRegister& dest)
    {
        if (tryMoveUsingCacheRegisterContents<32>(static_cast<intptr_t>(imm.m_value), dest))
            return;

        moveInternal<TrustedImm32, int32_t>(imm, dest.registerIDNoInvalidate());
        dest.setValue(imm.m_value);
    }

    void moveToCachedReg(TrustedImmPtr imm, CachedTempRegister& dest)
    {
        if (tryMoveUsingCacheRegisterContents<64>(imm.asIntptr(), dest))
            return;

        moveInternal<TrustedImmPtr, intptr_t>(imm, dest.registerIDNoInvalidate());
        dest.setValue(imm.asIntptr());
    }

    void moveToCachedReg(TrustedImm64 imm, CachedTempRegister& dest)
    {
        if (tryMoveUsingCacheRegisterContents<64>(static_cast<intptr_t>(imm.m_value), dest))
            return;

        moveInternal<TrustedImm64, int64_t>(imm, dest.registerIDNoInvalidate());
        dest.setValue(imm.m_value);
    }

    template<int datasize>
    ALWAYS_INLINE bool tryLoadWithOffset(RegisterID rt, RegisterID rn, int32_t offset)
    {
        if (Assembler::canEncodeSImmOffset(offset)) {
            loadUnscaledImmediate<datasize>(rt, rn, offset);
            return true;
        }
        if (Assembler::canEncodePImmOffset<datasize>(offset)) {
            loadUnsignedImmediate<datasize>(rt, rn, static_cast<unsigned>(offset));
            return true;
        }
        return false;
    }

    template<int datasize>
    ALWAYS_INLINE bool tryLoadSignedWithOffset(RegisterID rt, RegisterID rn, int32_t offset)
    {
        if (Assembler::canEncodeSImmOffset(offset)) {
            loadSignedAddressedByUnscaledImmediate<datasize>(rt, rn, offset);
            return true;
        }
        if (Assembler::canEncodePImmOffset<datasize>(offset)) {
            loadSignedAddressedByUnsignedImmediate<datasize>(rt, rn, static_cast<unsigned>(offset));
            return true;
        }
        return false;
    }

    template<int datasize>
    ALWAYS_INLINE bool tryLoadWithOffset(FPRegisterID rt, RegisterID rn, int32_t offset)
    {
        if (Assembler::canEncodeSImmOffset(offset)) {
            m_assembler.ldur<datasize>(rt, rn, offset);
            return true;
        }
        if (Assembler::canEncodePImmOffset<datasize>(offset)) {
            m_assembler.ldr<datasize>(rt, rn, static_cast<unsigned>(offset));
            return true;
        }
        return false;
    }

    template<int datasize>
    ALWAYS_INLINE bool tryStoreWithOffset(RegisterID rt, RegisterID rn, int32_t offset)
    {
        if (Assembler::canEncodeSImmOffset(offset)) {
            storeUnscaledImmediate<datasize>(rt, rn, offset);
            return true;
        }
        if (Assembler::canEncodePImmOffset<datasize>(offset)) {
            storeUnsignedImmediate<datasize>(rt, rn, static_cast<unsigned>(offset));
            return true;
        }
        return false;
    }

    template<int datasize>
    ALWAYS_INLINE bool tryStoreWithOffset(FPRegisterID rt, RegisterID rn, int32_t offset)
    {
        if (Assembler::canEncodeSImmOffset(offset)) {
            m_assembler.stur<datasize>(rt, rn, offset);
            return true;
        }
        if (Assembler::canEncodePImmOffset<datasize>(offset)) {
            m_assembler.str<datasize>(rt, rn, static_cast<unsigned>(offset));
            return true;
        }
        return false;
    }

    std::optional<RegisterID> tryFoldBaseAndOffsetPart(BaseIndex address)
    {
        auto immediate = address.offset;
        if (!immediate)
            return address.base;

        if (auto tuple = tryExtractShiftedImm(immediate)) {
            auto [u12, shift, inverted] = tuple.value();
            if (!inverted)
                m_assembler.add<64>(getCachedMemoryTempRegisterIDAndInvalidate(), address.base, u12, shift);
            else
                m_assembler.sub<64>(getCachedMemoryTempRegisterIDAndInvalidate(), address.base, u12, shift);
            return memoryTempRegister;
        }

        return std::nullopt;
    }

    template<typename IntType>
    std::optional<std::tuple<UInt12, int32_t, bool>> tryExtractShiftedImm(IntType immediate)
    {
        if (isUInt12(immediate))
            return std::tuple { UInt12(immediate), 0, false };

        auto negatedImmediate = toTwosComplement(immediate);
        if (isUInt12(negatedImmediate))
            return std::tuple { UInt12(negatedImmediate), 0, true };

        auto shifted = immediate >> 12;
        if ((shifted << 12) == immediate) {
            if (isUInt12(shifted))
                return std::tuple { UInt12(shifted), 12, false };

            auto negatedShifted = toTwosComplement(shifted);
            if (isUInt12(negatedShifted))
                return std::tuple { UInt12(negatedShifted), 12, true };
        }

        return std::nullopt;
    }
    
    template<int datasize>
    void loadLink(RegisterID src, RegisterID dest)
    {
        m_assembler.ldxr<datasize>(dest, src);
    }
    
    template<int datasize>
    void loadLinkAcq(RegisterID src, RegisterID dest)
    {
        m_assembler.ldaxr<datasize>(dest, src);
    }
    
    template<int datasize>
    void storeCond(RegisterID src, RegisterID dest, RegisterID result)
    {
        m_assembler.stxr<datasize>(src, dest, result);
    }
    
    template<int datasize>
    void storeCondRel(RegisterID src, RegisterID dest, RegisterID result)
    {
        m_assembler.stlxr<datasize>(result, src, dest);
    }
    
    template<int datasize>
    void zeroExtend(RegisterID src, RegisterID dest)
    {
        if constexpr (datasize == 8)
            zeroExtend8To32(src, dest);
        else if constexpr (datasize == 16)
            zeroExtend16To32(src, dest);
        else
            move(src, dest);
    }
    
    template<int datasize>
    Jump branch(RelationalCondition cond, RegisterID left, RegisterID right)
    {
        return branch32(cond, left, right);
    }
    
    template<int datasize>
    void atomicStrongCAS(StatusCondition cond, RegisterID expectedAndResult, RegisterID newValue, Address address, RegisterID result)
    {
        zeroExtend<datasize>(expectedAndResult, expectedAndResult);
        
        RegisterID simpleAddress = extractSimpleAddress(address);
        RegisterID tmp = getCachedDataTempRegisterIDAndInvalidate();
        
        Label reloop = label();
        loadLinkAcq<datasize>(simpleAddress, tmp);
        Jump failure = branch<datasize>(NotEqual, expectedAndResult, tmp);
        
        storeCondRel<datasize>(newValue, simpleAddress, result);
        branchTest32(NonZero, result).linkTo(reloop, this);
        move(TrustedImm32(cond == Success), result);
        Jump done = jump();
        
        failure.link(this);
        move(tmp, expectedAndResult);
        storeCondRel<datasize>(tmp, simpleAddress, result);
        branchTest32(NonZero, result).linkTo(reloop, this);
        move(TrustedImm32(cond == Failure), result);
        
        done.link(this);
    }
    
    template<int datasize, typename AddressType>
    void atomicRelaxedStrongCAS(StatusCondition cond, RegisterID expectedAndResult, RegisterID newValue, AddressType address, RegisterID result)
    {
        zeroExtend<datasize>(expectedAndResult, expectedAndResult);
        
        RegisterID simpleAddress = extractSimpleAddress(address);
        RegisterID tmp = getCachedDataTempRegisterIDAndInvalidate();
        
        Label reloop = label();
        loadLink<datasize>(simpleAddress, tmp);
        Jump failure = branch<datasize>(NotEqual, expectedAndResult, tmp);
        
        storeCond<datasize>(newValue, simpleAddress, result);
        branchTest32(NonZero, result).linkTo(reloop, this);
        move(TrustedImm32(cond == Success), result);
        Jump done = jump();
        
        failure.link(this);
        move(tmp, expectedAndResult);
        move(TrustedImm32(cond == Failure), result);
        
        done.link(this);
    }
    
    template<int datasize, typename AddressType>
    JumpList branchAtomicWeakCAS(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, AddressType address)
    {
        zeroExtend<datasize>(expectedAndClobbered, expectedAndClobbered);
        
        RegisterID simpleAddress = extractSimpleAddress(address);
        RegisterID tmp = getCachedDataTempRegisterIDAndInvalidate();
        
        JumpList success;
        JumpList failure;

        loadLinkAcq<datasize>(simpleAddress, tmp);
        failure.append(branch<datasize>(NotEqual, expectedAndClobbered, tmp));
        storeCondRel<datasize>(newValue, simpleAddress, expectedAndClobbered);
        
        switch (cond) {
        case Success:
            success.append(branchTest32(Zero, expectedAndClobbered));
            failure.link(this);
            return success;
        case Failure:
            failure.append(branchTest32(NonZero, expectedAndClobbered));
            return failure;
        }
        
        RELEASE_ASSERT_NOT_REACHED();
    }
    
    template<int datasize, typename AddressType>
    JumpList branchAtomicRelaxedWeakCAS(StatusCondition cond, RegisterID expectedAndClobbered, RegisterID newValue, AddressType address)
    {
        zeroExtend<datasize>(expectedAndClobbered, expectedAndClobbered);
        
        RegisterID simpleAddress = extractSimpleAddress(address);
        RegisterID tmp = getCachedDataTempRegisterIDAndInvalidate();
        
        JumpList success;
        JumpList failure;

        loadLink<datasize>(simpleAddress, tmp);
        failure.append(branch<datasize>(NotEqual, expectedAndClobbered, tmp));
        storeCond<datasize>(newValue, simpleAddress, expectedAndClobbered);
        
        switch (cond) {
        case Success:
            success.append(branchTest32(Zero, expectedAndClobbered));
            failure.link(this);
            return success;
        case Failure:
            failure.append(branchTest32(NonZero, expectedAndClobbered));
            return failure;
        }
        
        RELEASE_ASSERT_NOT_REACHED();
    }

    void atomicLoad32(Address address, RegisterID dest)
    {
        loadAcq32(address, dest);
    }

    void atomicLoad64(Address address, RegisterID dest)
    {
        loadAcq64(address, dest);
    }

    void atomicLoad32(BaseIndex address, RegisterID dest)
    {
        loadAcq32(address, dest);
    }

    void atomicLoad64(BaseIndex address, RegisterID dest)
    {
        loadAcq64(address, dest);
    }

    RegisterID extractSimpleAddress(Address address)
    {
        if (!address.offset)
            return address.base;
        
        signExtend32ToPtr(TrustedImm32(address.offset), getCachedMemoryTempRegisterIDAndInvalidate());
        add64(address.base, memoryTempRegister);
        return memoryTempRegister;
    }

    // This uses both the memory and data temp, but only returns the memorty temp. So you can use the
    // data temp after this finishes.
    RegisterID extractSimpleAddress(BaseIndex address)
    {
        RegisterID result = getCachedMemoryTempRegisterIDAndInvalidate();
        lshift64(address.index, TrustedImm32(address.scale), result);
        add64(address.base, result);
        add64(TrustedImm32(address.offset), result);
        return result;
    }

    Jump jumpAfterFloatingPointCompare(DoubleCondition cond)
    {
        if (cond == DoubleNotEqualAndOrdered) {
            // ConditionNE jumps if NotEqual *or* unordered - force the unordered cases not to jump.
            Jump unordered = makeBranch(Assembler::ConditionVS);
            Jump result = makeBranch(Assembler::ConditionNE);
            unordered.link(this);
            return result;
        }
        if (cond == DoubleEqualOrUnordered) {
            Jump unordered = makeBranch(Assembler::ConditionVS);
            Jump notEqual = makeBranch(Assembler::ConditionNE);
            unordered.link(this);
            // We get here if either unordered or equal.
            Jump result = jump();
            notEqual.link(this);
            return result;
        }
        return makeBranch(cond);
    }

    template<typename Function>
    void floatingPointCompare(DoubleCondition cond, RegisterID dest, Function compare)
    {
        if (cond == DoubleNotEqualAndOrdered) {
            // ConditionNE sets 1 if NotEqual *or* unordered - force the unordered cases not to set 1.
            move(TrustedImm32(0), dest);
            compare();
            Jump unordered = makeBranch(Assembler::ConditionVS);
            m_assembler.cset<32>(dest, Assembler::ConditionNE);
            unordered.link(this);
            return;
        }
        if (cond == DoubleEqualOrUnordered) {
            // ConditionEQ sets 1 only if Equal - force the unordered cases to set 1 too.
            move(TrustedImm32(1), dest);
            compare();
            Jump unordered = makeBranch(Assembler::ConditionVS);
            m_assembler.cset<32>(dest, Assembler::ConditionEQ);
            unordered.link(this);
            return;
        }
        compare();
        m_assembler.cset<32>(dest, ARM64Condition(cond));
    }

    friend class LinkBuffer;

    template<PtrTag tag>
    static void linkCall(void* code, Call call, CodePtr<tag> function)
    {
        if (!call.isFlagSet(Call::Near))
            Assembler::linkPointer(code, call.m_label.labelAtOffset(REPATCH_OFFSET_CALL_TO_POINTER), function.taggedPtr());
        else if (call.isFlagSet(Call::Tail))
            Assembler::linkJump(code, call.m_label, function.untaggedPtr());
        else
            Assembler::linkCall(code, call.m_label, function.untaggedPtr());
    }

    JS_EXPORT_PRIVATE static void collectCPUFeatures();

    JS_EXPORT_PRIVATE static CPUIDCheckState s_lseCheckState;
    JS_EXPORT_PRIVATE static CPUIDCheckState s_jscvtCheckState;
    JS_EXPORT_PRIVATE static CPUIDCheckState s_float16CheckState;
    JS_EXPORT_PRIVATE static CPUIDCheckState s_frintCheckState;

    CachedTempRegister m_dataMemoryTempRegister;
    CachedTempRegister m_cachedMemoryTempRegister;
    bool m_makeJumpPatchable;
};

// Extend the {load,store}{Unsigned,Unscaled}Immediate templated general register methods to cover all load/store sizes
template<>
ALWAYS_INLINE void MacroAssemblerARM64::loadUnsignedImmediate<8>(RegisterID rt, RegisterID rn, unsigned pimm)
{
    m_assembler.ldrb(rt, rn, pimm);
}

template<>
ALWAYS_INLINE void MacroAssemblerARM64::loadUnsignedImmediate<16>(RegisterID rt, RegisterID rn, unsigned pimm)
{
    m_assembler.ldrh(rt, rn, pimm);
}

template<>
ALWAYS_INLINE void MacroAssemblerARM64::loadSignedAddressedByUnsignedImmediate<8>(RegisterID rt, RegisterID rn, unsigned pimm)
{
    m_assembler.ldrsb<64>(rt, rn, pimm);
}

template<>
ALWAYS_INLINE void MacroAssemblerARM64::loadSignedAddressedByUnsignedImmediate<16>(RegisterID rt, RegisterID rn, unsigned pimm)
{
    m_assembler.ldrsh<64>(rt, rn, pimm);
}

template<>
ALWAYS_INLINE void MacroAssemblerARM64::loadUnscaledImmediate<8>(RegisterID rt, RegisterID rn, int simm)
{
    m_assembler.ldurb(rt, rn, simm);
}

template<>
ALWAYS_INLINE void MacroAssemblerARM64::loadUnscaledImmediate<16>(RegisterID rt, RegisterID rn, int simm)
{
    m_assembler.ldurh(rt, rn, simm);
}

template<>
ALWAYS_INLINE void MacroAssemblerARM64::loadSignedAddressedByUnscaledImmediate<8>(RegisterID rt, RegisterID rn, int simm)
{
    m_assembler.ldursb<64>(rt, rn, simm);
}

template<>
ALWAYS_INLINE void MacroAssemblerARM64::loadSignedAddressedByUnscaledImmediate<16>(RegisterID rt, RegisterID rn, int simm)
{
    m_assembler.ldursh<64>(rt, rn, simm);
}

template<>
ALWAYS_INLINE void MacroAssemblerARM64::storeUnsignedImmediate<8>(RegisterID rt, RegisterID rn, unsigned pimm)
{
    m_assembler.strb(rt, rn, pimm);
}

template<>
ALWAYS_INLINE void MacroAssemblerARM64::storeUnsignedImmediate<16>(RegisterID rt, RegisterID rn, unsigned pimm)
{
    m_assembler.strh(rt, rn, pimm);
}

template<>
ALWAYS_INLINE void MacroAssemblerARM64::storeUnscaledImmediate<8>(RegisterID rt, RegisterID rn, int simm)
{
    m_assembler.sturb(rt, rn, simm);
}

template<>
ALWAYS_INLINE void MacroAssemblerARM64::storeUnscaledImmediate<16>(RegisterID rt, RegisterID rn, int simm)
{
    m_assembler.sturh(rt, rn, simm);
}

template<>
inline MacroAssemblerARM64::Jump MacroAssemblerARM64::branch<64>(RelationalCondition cond, RegisterID left, RegisterID right)
{
    return branch64(cond, left, right);
}

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END

#endif // ENABLE(ASSEMBLER) && CPU(ARM64)
