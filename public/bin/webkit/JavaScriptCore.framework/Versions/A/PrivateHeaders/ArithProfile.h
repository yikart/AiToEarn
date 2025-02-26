/*
 * Copyright (C) 2016-2020 Apple Inc. All rights reserved.
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

#include "GPRInfo.h"
#include "JSCJSValue.h"
#include "ResultType.h"
#include "TagRegistersMode.h"

namespace JSC {

class CCallHelpers;

struct ObservedType {
    constexpr ObservedType(uint8_t bits = TypeEmpty)
        : m_bits(bits)
    { }

    constexpr bool sawInt32() const { return m_bits & TypeInt32; }
    constexpr bool isOnlyInt32() const { return m_bits == TypeInt32; }
    constexpr bool sawNumber() const { return m_bits & TypeNumber; }
    constexpr bool isOnlyNumber() const { return m_bits == TypeNumber; }
    constexpr bool sawNonNumber() const { return m_bits & TypeNonNumber; }
    constexpr bool isOnlyNonNumber() const { return m_bits == TypeNonNumber; }
    constexpr bool isEmpty() const { return !m_bits; }
    constexpr uint8_t bits() const { return m_bits; }

    constexpr ObservedType withInt32() const { return ObservedType(m_bits | TypeInt32); }
    constexpr ObservedType withNumber() const { return ObservedType(m_bits | TypeNumber); }
    constexpr ObservedType withNonNumber() const { return ObservedType(m_bits | TypeNonNumber); }
    constexpr ObservedType withoutNonNumber() const { return ObservedType(m_bits & ~TypeNonNumber); }

    friend constexpr bool operator==(const ObservedType&, const ObservedType&) = default;

    static constexpr uint8_t TypeEmpty = 0x0;
    static constexpr uint8_t TypeInt32 = 0x1;
    static constexpr uint8_t TypeNumber = 0x02;
    static constexpr uint8_t TypeNonNumber = 0x04;

    static constexpr uint32_t numBitsNeeded = 3;

private:
    uint8_t m_bits { 0 };
};

class ObservedResults {
public:
    enum Tags : uint8_t {
        NonNegZeroDouble = 1 << 0,
        NegZeroDouble    = 1 << 1,
        NonNumeric       = 1 << 2,
        Int32Overflow    = 1 << 3,
        Int52Overflow    = 1 << 4,
        HeapBigInt       = 1 << 5,
        BigInt32         = 1 << 6,
    };
    static constexpr uint32_t numBitsNeeded = 7;

    ObservedResults() = default;
    explicit ObservedResults(uint8_t bits)
        : m_bits(bits)
    { }

    bool didObserveNonInt32() { return m_bits & (NonNegZeroDouble | NegZeroDouble | NonNumeric | HeapBigInt | BigInt32); }
    bool didObserveDouble() { return m_bits & (NonNegZeroDouble | NegZeroDouble); }
    bool didObserveNonNegZeroDouble() { return m_bits & NonNegZeroDouble; }
    bool didObserveNegZeroDouble() { return m_bits & NegZeroDouble; }
    bool didObserveNonNumeric() { return m_bits & NonNumeric; }
    bool didObserveBigInt() { return m_bits & (HeapBigInt | BigInt32); }
    bool didObserveHeapBigInt() { return m_bits & HeapBigInt; }
    bool didObserveBigInt32() { return m_bits & BigInt32; }
    bool didObserveInt32Overflow() { return m_bits & Int32Overflow; }
    bool didObserveInt52Overflow() { return m_bits & Int52Overflow; }

private:
    uint8_t m_bits { 0 };
};

template <typename BitfieldType>
class ArithProfile {
public:
    ObservedResults observedResults() const
    {
        return ObservedResults(m_bits & ((1 << ObservedResults::numBitsNeeded) - 1));
    }
    bool didObserveNonInt32() const { return observedResults().didObserveNonInt32();}
    bool didObserveDouble() const { return observedResults().didObserveDouble(); }
    bool didObserveNonNegZeroDouble() const { return observedResults().didObserveNonNegZeroDouble(); }
    bool didObserveNegZeroDouble() const { return observedResults().didObserveNegZeroDouble(); }
    bool didObserveNonNumeric() const { return observedResults().didObserveNonNumeric(); }
    bool didObserveBigInt() const { return observedResults().didObserveBigInt(); }
    bool didObserveHeapBigInt() const { return observedResults().didObserveHeapBigInt(); }
    bool didObserveBigInt32() const { return observedResults().didObserveBigInt32(); }
    bool didObserveInt32Overflow() const { return observedResults().didObserveInt32Overflow(); }
    bool didObserveInt52Overflow() const { return observedResults().didObserveInt52Overflow(); }

    void setObservedNonNegZeroDouble() { setBit(ObservedResults::NonNegZeroDouble); }
    void setObservedNegZeroDouble() { setBit(ObservedResults::NegZeroDouble); }
    void setObservedNonNumeric() { setBit(ObservedResults::NonNumeric); }
    void setObservedHeapBigInt() { setBit(ObservedResults::HeapBigInt); }
    void setObservedBigInt32() { setBit(ObservedResults::BigInt32); }
    void setObservedInt32Overflow() { setBit(ObservedResults::Int32Overflow); }
    void setObservedInt52Overflow() { setBit(ObservedResults::Int52Overflow); }

    void observeResult(JSValue value)
    {
        if (value.isInt32())
            return;
        if (value.isNumber()) {
            m_bits |= ObservedResults::Int32Overflow | ObservedResults::Int52Overflow | ObservedResults::NonNegZeroDouble | ObservedResults::NegZeroDouble;
            return;
        }
        if (value.isBigInt32()) {
            m_bits |= ObservedResults::BigInt32;
            return;
        }
        if (value && value.isHeapBigInt()) {
            m_bits |= ObservedResults::HeapBigInt;
            return;
        }
        m_bits |= ObservedResults::NonNumeric;
    }

    const void* addressOfBits() const { return &m_bits; }

#if ENABLE(JIT)
    // Sets (Int32Overflow | Int52Overflow | NonNegZeroDouble | NegZeroDouble) if it sees a
    // double. Sets NonNumeric if it sees a non-numeric.
    void emitObserveResult(CCallHelpers&, JSValueRegs, GPRReg tempGPR, TagRegistersMode = HaveTagRegisters);

    // Sets (Int32Overflow | Int52Overflow | NonNegZeroDouble | NegZeroDouble).
    bool shouldEmitSetDouble() const;
    void emitSetDouble(CCallHelpers&, GPRReg scratchGPR) const;

    void emitSetNonNumeric(CCallHelpers&) const;
    bool shouldEmitSetNonNumeric() const;

    bool shouldEmitSetHeapBigInt() const;
    void emitSetHeapBigInt(CCallHelpers&) const;

    bool shouldEmitSetBigInt32() const;
#if USE(BIGINT32)
    void emitSetBigInt32(CCallHelpers&) const;
#endif

    void emitUnconditionalSet(CCallHelpers&, BitfieldType) const;
    void emitUnconditionalSet(CCallHelpers&, GPRReg) const;
#endif // ENABLE(JIT)

    constexpr uint32_t bits() const { return m_bits; }

protected:
    ArithProfile() = default;

    bool hasBits(int mask) const { return m_bits & mask; }
    void setBit(int mask) { m_bits |= mask; }

    BitfieldType m_bits { 0 }; // We take care to update m_bits only in a single operation. We don't ever store an inconsistent bit representation to it.
};

/* This class stores the following components in 16 bits:
 * - ObservedResults
 * - ObservedType for the argument
 */
using UnaryArithProfileBase = uint16_t;
class UnaryArithProfile : public ArithProfile<UnaryArithProfileBase> {
    static constexpr unsigned argObservedTypeShift = ObservedResults::numBitsNeeded;

    static_assert(argObservedTypeShift + ObservedType::numBitsNeeded <= sizeof(UnaryArithProfileBase) * 8, "Should fit in the type of the underlying bitfield.");

    static constexpr UnaryArithProfileBase clearArgObservedTypeBitMask = static_cast<UnaryArithProfileBase>(~(0b111 << argObservedTypeShift));

    static constexpr UnaryArithProfileBase observedTypeMask = (1 << ObservedType::numBitsNeeded) - 1;

public:
    UnaryArithProfile()
        : ArithProfile<UnaryArithProfileBase>()
    {
        ASSERT(argObservedType().isEmpty());
        ASSERT(argObservedType().isEmpty());
    }

    static constexpr UnaryArithProfileBase observedIntBits()
    {
        constexpr ObservedType observedInt32 { ObservedType().withInt32() };
        constexpr UnaryArithProfileBase bits = observedInt32.bits() << argObservedTypeShift;
        return bits;
    }
    static constexpr UnaryArithProfileBase observedNumberBits()
    {
        constexpr ObservedType observedNumber { ObservedType().withNumber() };
        constexpr UnaryArithProfileBase bits = observedNumber.bits() << argObservedTypeShift;
        return bits;
    }
    static constexpr UnaryArithProfileBase observedNonNumberBits()
    {
        constexpr ObservedType observedNumber { ObservedType().withNonNumber() };
        constexpr UnaryArithProfileBase bits = observedNumber.bits() << argObservedTypeShift;
        return bits;
    }

    constexpr ObservedType argObservedType() const { return ObservedType((m_bits >> argObservedTypeShift) & observedTypeMask); }
    void setArgObservedType(ObservedType type)
    {
        UnaryArithProfileBase bits = m_bits;
        bits &= clearArgObservedTypeBitMask;
        bits |= type.bits() << argObservedTypeShift;
        m_bits = bits;
        ASSERT(argObservedType() == type);
    }

    void argSawInt32() { setArgObservedType(argObservedType().withInt32()); }
    void argSawNumber() { setArgObservedType(argObservedType().withNumber()); }
    void argSawNonNumber() { setArgObservedType(argObservedType().withNonNumber()); }

    void observeArg(JSValue arg)
    {
        UnaryArithProfile newProfile = *this;
        if (arg.isNumber()) {
            if (arg.isInt32())
                newProfile.argSawInt32();
            else
                newProfile.argSawNumber();
        } else
            newProfile.argSawNonNumber();

        m_bits = newProfile.bits();
    }

    bool isObservedTypeEmpty()
    {
        return argObservedType().isEmpty();
    }

    friend class JSC::LLIntOffsetsExtractor;
};

/* This class stores the following components in 16 bits:
 * - ObservedResults
 * - ObservedType for right-hand-side
 * - ObservedType for left-hand-side
 * - a bit used by division to indicate whether a special fast path was taken
 */
using BinaryArithProfileBase = uint16_t;
class BinaryArithProfile : public ArithProfile<BinaryArithProfileBase> {
    static constexpr uint32_t rhsObservedTypeShift = ObservedResults::numBitsNeeded;
    static constexpr uint32_t lhsObservedTypeShift = rhsObservedTypeShift + ObservedType::numBitsNeeded;

    static_assert(ObservedType::numBitsNeeded == 3, "We make a hard assumption about that here.");
    static constexpr BinaryArithProfileBase clearRhsObservedTypeBitMask = static_cast<BinaryArithProfileBase>(~(0b111 << rhsObservedTypeShift));
    static constexpr BinaryArithProfileBase clearLhsObservedTypeBitMask = static_cast<BinaryArithProfileBase>(~(0b111 << lhsObservedTypeShift));

    static constexpr BinaryArithProfileBase observedTypeMask = (1 << ObservedType::numBitsNeeded) - 1;

public:
    static constexpr BinaryArithProfileBase specialFastPathBit = 1 << (lhsObservedTypeShift + ObservedType::numBitsNeeded);
    static_assert((lhsObservedTypeShift + ObservedType::numBitsNeeded + 1) <= sizeof(BinaryArithProfileBase) * 8, "Should fit in the underlying type.");
    static_assert(!(specialFastPathBit & ~clearLhsObservedTypeBitMask), "These bits should not intersect.");
    static_assert(specialFastPathBit & clearLhsObservedTypeBitMask, "These bits should intersect.");
    static_assert(static_cast<unsigned>(specialFastPathBit) > static_cast<unsigned>(static_cast<BinaryArithProfileBase>(~clearLhsObservedTypeBitMask)), "These bits should not intersect and specialFastPathBit should be a higher bit.");

    BinaryArithProfile()
        : ArithProfile<BinaryArithProfileBase> ()
    {
        ASSERT(lhsObservedType().isEmpty());
        ASSERT(rhsObservedType().isEmpty());
    }

    static constexpr BinaryArithProfileBase observedIntIntBits()
    {
        constexpr ObservedType observedInt32 { ObservedType().withInt32() };
        constexpr BinaryArithProfileBase bits = (observedInt32.bits() << lhsObservedTypeShift) | (observedInt32.bits() << rhsObservedTypeShift);
        return bits;
    }
    static constexpr BinaryArithProfileBase observedNumberIntBits()
    {
        constexpr ObservedType observedNumber { ObservedType().withNumber() };
        constexpr ObservedType observedInt32 { ObservedType().withInt32() };
        constexpr BinaryArithProfileBase bits = (observedNumber.bits() << lhsObservedTypeShift) | (observedInt32.bits() << rhsObservedTypeShift);
        return bits;
    }
    static constexpr BinaryArithProfileBase observedIntNumberBits()
    {
        constexpr ObservedType observedNumber { ObservedType().withNumber() };
        constexpr ObservedType observedInt32 { ObservedType().withInt32() };
        constexpr BinaryArithProfileBase bits = (observedInt32.bits() << lhsObservedTypeShift) | (observedNumber.bits() << rhsObservedTypeShift);
        return bits;
    }
    static constexpr BinaryArithProfileBase observedNumberNumberBits()
    {
        constexpr ObservedType observedNumber { ObservedType().withNumber() };
        constexpr BinaryArithProfileBase bits = (observedNumber.bits() << lhsObservedTypeShift) | (observedNumber.bits() << rhsObservedTypeShift);
        return bits;
    }

    constexpr ObservedType lhsObservedType() const { return ObservedType((m_bits >> lhsObservedTypeShift) & observedTypeMask); }
    constexpr ObservedType rhsObservedType() const { return ObservedType((m_bits >> rhsObservedTypeShift) & observedTypeMask); }
    void setLhsObservedType(ObservedType type)
    {
        BinaryArithProfileBase bits = m_bits;
        bits &= clearLhsObservedTypeBitMask;
        bits |= type.bits() << lhsObservedTypeShift;
        m_bits = bits;
        ASSERT(lhsObservedType() == type);
    }

    void setRhsObservedType(ObservedType type)
    { 
        BinaryArithProfileBase bits = m_bits;
        bits &= clearRhsObservedTypeBitMask;
        bits |= type.bits() << rhsObservedTypeShift;
        m_bits = bits;
        ASSERT(rhsObservedType() == type);
    }

    bool tookSpecialFastPath() const { return m_bits & specialFastPathBit; }

    void lhsSawInt32() { setLhsObservedType(lhsObservedType().withInt32()); }
    void lhsSawNumber() { setLhsObservedType(lhsObservedType().withNumber()); }
    void lhsSawNonNumber() { setLhsObservedType(lhsObservedType().withNonNumber()); }
    void rhsSawInt32() { setRhsObservedType(rhsObservedType().withInt32()); }
    void rhsSawNumber() { setRhsObservedType(rhsObservedType().withNumber()); }
    void rhsSawNonNumber() { setRhsObservedType(rhsObservedType().withNonNumber()); }

    void observeLHS(JSValue lhs)
    {
        BinaryArithProfile newProfile = *this;
        if (lhs.isNumber()) {
            if (lhs.isInt32())
                newProfile.lhsSawInt32();
            else
                newProfile.lhsSawNumber();
        } else
            newProfile.lhsSawNonNumber();

        m_bits = newProfile.bits();
    }

    void observeLHSAndRHS(JSValue lhs, JSValue rhs)
    {
        observeLHS(lhs);

        BinaryArithProfile newProfile = *this;
        if (rhs.isNumber()) {
            if (rhs.isInt32())
                newProfile.rhsSawInt32();
            else
                newProfile.rhsSawNumber();
        } else
            newProfile.rhsSawNonNumber();

        m_bits = newProfile.bits();
    }

    bool isObservedTypeEmpty()
    {
        return lhsObservedType().isEmpty() && rhsObservedType().isEmpty();
    }

    friend class JSC::LLIntOffsetsExtractor;
};

} // namespace JSC

namespace WTF {

void printInternal(PrintStream&, const JSC::UnaryArithProfile&);
void printInternal(PrintStream&, const JSC::BinaryArithProfile&);
void printInternal(PrintStream&, const JSC::ObservedType&);

} // namespace WTF
