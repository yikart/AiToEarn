/*
 * Copyright (C) 2013-2023 Apple Inc. All rights reserved.
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

#if !ENABLE(C_LOOP)

#include "FPRInfo.h"
#include "GPRInfo.h"
#include "MacroAssembler.h"
#include "MemoryMode.h"
#include "Reg.h"
#include "Width.h"
#include <wtf/BitSet.h>
#include <wtf/CommaPrinter.h>

namespace JSC {

class ScalarRegisterSet;
using RegisterBitSet = WTF::BitSet<MacroAssembler::numGPRs + MacroAssembler::numFPRs>;
class RegisterAtOffsetList;
struct RegisterSetBuilderHash;
class RegisterSet;

enum IgnoreVectorsTag { IgnoreVectors };

class RegisterSetBuilder final {
    friend ScalarRegisterSet;
    friend RegisterSet;

public:
    constexpr RegisterSetBuilder() { }

    inline constexpr RegisterSetBuilder(RegisterSet);

    template<typename... Regs>
    inline constexpr explicit RegisterSetBuilder(Regs... regs)
    {
        setMany(regs...);
    }

    inline constexpr RegisterSetBuilder& add(Reg reg, Width width)
    {
        ASSERT_UNDER_CONSTEXPR_CONTEXT(!!reg);
        m_bits.set(reg.index());

        if (UNLIKELY(width > conservativeWidthWithoutVectors(reg) && conservativeWidth(reg) > conservativeWidthWithoutVectors(reg)))
            m_upperBits.set(reg.index());
        return *this;
    }

    inline constexpr RegisterSetBuilder& add(JSValueRegs regs, IgnoreVectorsTag)
    {
        if (regs.tagGPR() != InvalidGPRReg)
            add(regs.tagGPR(), IgnoreVectors);
        add(regs.payloadGPR(), IgnoreVectors);
        return *this;
    }

    inline constexpr void add(Reg reg, IgnoreVectorsTag)
    {
        add(reg, conservativeWidthWithoutVectors(reg));
    }

    inline constexpr RegisterSetBuilder& remove(Reg reg)
    {
        ASSERT_UNDER_CONSTEXPR_CONTEXT(!!reg);
        m_bits.clear(reg.index());
        m_upperBits.clear(reg.index());
        return *this;
    }

    inline constexpr RegisterSetBuilder& remove(JSValueRegs regs)
    {
        if (regs.tagGPR() != InvalidGPRReg)
            remove(regs.tagGPR());
        remove(regs.payloadGPR());
        return *this;
    }

    inline constexpr bool hasAnyWideRegisters() const { return m_upperBits.count(); }
    inline constexpr bool isEmpty() const { return m_bits.isEmpty() && m_upperBits.isEmpty(); }

    inline constexpr RegisterSetBuilder& merge(const RegisterSetBuilder& other)
    {
        m_bits.merge(other.m_bits);
        m_upperBits.merge(other.m_upperBits);
        return *this;
    }

    inline constexpr RegisterSetBuilder& filter(const RegisterSetBuilder& other)
    {
        m_bits.filter(other.m_bits);
        m_upperBits.filter(other.m_upperBits);
        return *this;
    }

    inline constexpr RegisterSetBuilder& exclude(const RegisterSetBuilder& other)
    {
        m_bits.exclude(other.m_bits);
        m_upperBits.exclude(other.m_upperBits);
        return *this;
    }

    inline constexpr RegisterSet buildAndValidate() const WARN_UNUSED_RETURN;
    inline constexpr RegisterSet buildWithLowerBits() const WARN_UNUSED_RETURN;
    inline constexpr ScalarRegisterSet buildScalarRegisterSet() const WARN_UNUSED_RETURN;
    inline constexpr size_t numberOfSetRegisters() const;
    inline size_t numberOfSetGPRs() const;
    inline size_t numberOfSetFPRs() const;

    template<typename Func>
    inline constexpr void forEachWithWidthAndPreserved(const Func& func) const
    {
        auto allBits = m_bits;
        allBits.merge(m_upperBits);
        allBits.forEachSetBit(
            [&] (size_t index) {
                Reg reg = Reg::fromIndex(index);
                Width includedWidth = m_upperBits.get(index) ? conservativeWidth(reg) : conservativeWidthWithoutVectors(reg);
                PreservedWidth preservedWidth = PreservesNothing;
                if (!m_bits.get(index))
                    preservedWidth = Preserves64;
                func(reg, includedWidth, preservedWidth);
            });
    }

    void dump(PrintStream& out) const
    {
        CommaPrinter comma;
        out.print("["_s);
        for (Reg reg = Reg::first(); reg <= Reg::last(); reg = reg.next()) {
            if (!m_bits.get(reg.index()) && !m_upperBits.get(reg.index()))
                continue;
            out.print(comma, reg);
            if (m_bits.get(reg.index()) && (m_upperBits.get(reg.index()) || conservativeWidth(reg) == conservativeWidthWithoutVectors(reg)))
                continue;

            if (m_bits.get(reg.index()))
                out.print("↓");
            else
                out.print("↑");
        }
        out.print("]"_s);
    }

    friend constexpr bool operator==(const RegisterSetBuilder&, const RegisterSetBuilder&) = default;

protected:
    inline constexpr void setAny(Reg reg) { ASSERT_UNDER_CONSTEXPR_CONTEXT(!reg.isFPR()); add(reg, IgnoreVectors); }
    inline constexpr void setAny(JSValueRegs regs) { add(regs, IgnoreVectors); }
    inline constexpr void setAny(const RegisterSetBuilder& set) { merge(set); }
    inline constexpr void setMany() { }
    template<typename RegType, typename... Regs>
    inline constexpr void setMany(RegType reg, Regs... regs)
    {
        setAny(reg);
        setMany(regs...);
    }

    // These offsets mirror the logic in Reg.h.
    static constexpr unsigned gprOffset = 0;
    static constexpr unsigned fprOffset = gprOffset + MacroAssembler::numGPRs;

    RegisterBitSet m_bits = { };
    RegisterBitSet m_upperBits = { };

public:
    JS_EXPORT_PRIVATE static RegisterSet allGPRs();
    JS_EXPORT_PRIVATE static RegisterSet allFPRs();
    JS_EXPORT_PRIVATE static RegisterSet allRegisters();
    JS_EXPORT_PRIVATE static RegisterSet allScalarRegisters();
    JS_EXPORT_PRIVATE static RegisterSet stackRegisters();
    JS_EXPORT_PRIVATE static RegisterSet reservedHardwareRegisters();
    JS_EXPORT_PRIVATE static RegisterSet macroClobberedGPRs();
    JS_EXPORT_PRIVATE static RegisterSet macroClobberedFPRs();
    JS_EXPORT_PRIVATE static RegisterSet runtimeTagRegisters();
    JS_EXPORT_PRIVATE static RegisterSet specialRegisters(); // The union of stack, reserved hardware, and runtime registers.
    JS_EXPORT_PRIVATE static RegisterSet calleeSaveRegisters();
    JS_EXPORT_PRIVATE static RegisterSet vmCalleeSaveRegisters(); // Callee save registers that might be saved and used by any tier.
    JS_EXPORT_PRIVATE static RegisterAtOffsetList* vmCalleeSaveRegisterOffsets();
    JS_EXPORT_PRIVATE static RegisterSet llintBaselineCalleeSaveRegisters(); // Registers saved and used by the LLInt.
    JS_EXPORT_PRIVATE static RegisterSet dfgCalleeSaveRegisters(); // Registers saved and used by the DFG JIT.
    JS_EXPORT_PRIVATE static RegisterSet ftlCalleeSaveRegisters(); // Registers that might be saved and used by the FTL JIT.
    JS_EXPORT_PRIVATE static RegisterSet stubUnavailableRegisters(); // The union of callee saves and special registers.
    JS_EXPORT_PRIVATE static RegisterSet argumentGPRs();
    JS_EXPORT_PRIVATE static RegisterSet argumentFPRs();
#if ENABLE(WEBASSEMBLY)
    JS_EXPORT_PRIVATE static RegisterSet wasmPinnedRegisters();
#endif
    JS_EXPORT_PRIVATE static RegisterSetBuilder registersToSaveForJSCall(RegisterSetBuilder live);
    JS_EXPORT_PRIVATE static RegisterSetBuilder registersToSaveForCCall(RegisterSetBuilder live);
};

class RegisterSet final {
    friend ScalarRegisterSet;
    friend RegisterSetBuilder;

    constexpr explicit inline RegisterSet(const RegisterSetBuilder& set)
        : m_bits(set.m_bits)
        , m_upperBits(set.m_upperBits)
    {
        m_bits.merge(m_upperBits);
    }

public:
    constexpr RegisterSet() = default;

    template<typename RegType, typename... Regs>
    constexpr explicit inline RegisterSet(RegType reg, Regs... regs)
        : RegisterSet(regs...)
    {
        add(reg, IgnoreVectors);
    }

    inline constexpr bool contains(Reg reg, Width width) const
    {
        ASSERT_UNDER_CONSTEXPR_CONTEXT(m_bits.count() >= m_upperBits.count());
        if (LIKELY(width < conservativeWidth(reg)) || conservativeWidth(reg) <= conservativeWidthWithoutVectors(reg))
            return m_bits.get(reg.index());
        return m_bits.get(reg.index()) && m_upperBits.get(reg.index());
    }

    inline constexpr bool contains(Reg reg, IgnoreVectorsTag) const
    {
        return contains(reg, conservativeWidthWithoutVectors(reg));
    }

    inline size_t numberOfSetGPRs() const
    {
        RegisterBitSet temp = m_bits;
        temp.filter(RegisterSetBuilder::allGPRs().m_bits);
        return temp.count();
    }

    inline size_t numberOfSetFPRs() const
    {
        RegisterBitSet temp = m_bits;
        temp.filter(RegisterSetBuilder::allFPRs().m_bits);
        return temp.count();
    }

    inline constexpr size_t numberOfSetRegisters() const
    {
        ASSERT_UNDER_CONSTEXPR_CONTEXT(m_bits.count() >= m_upperBits.count());
        return m_bits.count();
    }

    inline size_t byteSizeOfSetRegisters() const
    {
#if CPU(REGISTER64)
        return (m_bits.count() + m_upperBits.count()) * sizeof(CPURegister);
#else
        auto effectiveGPRCount = numberOfSetFPRs()
            ? WTF::roundUpToMultipleOf<2>(numberOfSetGPRs())
            : numberOfSetGPRs();
        return effectiveGPRCount * bytesForWidth(pointerWidth()) + numberOfSetFPRs() * sizeof(double);
#endif
    }

    inline constexpr bool subsumes(const RegisterSet& other) const
    {
        return m_bits.subsumes(other.m_bits) && m_upperBits.subsumes(other.m_upperBits);
    }

    inline constexpr bool isEmpty() const
    {
        ASSERT_UNDER_CONSTEXPR_CONTEXT(m_bits.count() >= m_upperBits.count());
        return m_bits.isEmpty();
    }

    inline constexpr RegisterSet& includeWholeRegisterWidth()
    {
        ASSERT_UNDER_CONSTEXPR_CONTEXT(m_bits.count() >= m_upperBits.count());
        m_upperBits.merge(m_bits);
        return *this;
    }

    inline constexpr ScalarRegisterSet buildScalarRegisterSet() const WARN_UNUSED_RETURN;

    template<typename Func>
    inline constexpr void forEach(const Func& func) const
    {
        ASSERT_UNDER_CONSTEXPR_CONTEXT(m_bits.count() >= m_upperBits.count());
        m_bits.forEachSetBit(
            [&] (size_t index) {
                ASSERT_UNDER_CONSTEXPR_CONTEXT(m_bits.get(index) >= m_upperBits.get(index));
                func(Reg::fromIndex(index));
            });
    }

    template<typename Func>
    inline constexpr void forEachWithWidth(const Func& func) const
    {
        ASSERT_UNDER_CONSTEXPR_CONTEXT(m_bits.count() >= m_upperBits.count());
        m_bits.forEachSetBit(
            [&] (size_t index) {
                ASSERT_UNDER_CONSTEXPR_CONTEXT(m_bits.get(index) >= m_upperBits.get(index));
                Reg reg = Reg::fromIndex(index);
                Width includedWidth = m_upperBits.get(index) ? conservativeWidth(reg) : conservativeWidthWithoutVectors(reg);
                func(reg, includedWidth);
            });
    }

    class iterator {
    public:
        inline constexpr iterator() { }

        inline constexpr iterator(const RegisterBitSet::iterator& iter)
            : m_iter(iter)
        {
        }

        inline constexpr Reg reg() const { return Reg::fromIndex(*m_iter); }
        inline constexpr Reg operator*() const { return reg(); }

        inline constexpr bool isGPR() const { return reg().isGPR(); }
        inline constexpr bool isFPR() const { return reg().isFPR(); }

        inline constexpr GPRReg gpr() const { return reg().gpr(); }
        inline constexpr FPRReg fpr() const { return reg().fpr(); }

        iterator& operator++()
        {
            ++m_iter;
            return *this;
        }

        friend constexpr bool operator==(const iterator&, const iterator&) = default;

    private:
        RegisterBitSet::iterator m_iter;
    };

    inline constexpr iterator begin() const { return iterator(m_bits.begin()); }
    inline constexpr iterator end() const { return iterator(m_bits.end()); }

    inline constexpr RegisterSet& add(Reg reg, Width width)
    {
        ASSERT_UNDER_CONSTEXPR_CONTEXT(!!reg);
        m_bits.set(reg.index());

        if (UNLIKELY(width > conservativeWidthWithoutVectors(reg) && conservativeWidth(reg) > conservativeWidthWithoutVectors(reg)))
            m_upperBits.set(reg.index());
        return *this;
    }

    inline constexpr void add(Reg reg, IgnoreVectorsTag)
    {
        add(reg, conservativeWidthWithoutVectors(reg));
    }

    inline constexpr RegisterSet& add(JSValueRegs regs, IgnoreVectorsTag)
    {
        if (regs.tagGPR() != InvalidGPRReg)
            add(regs.tagGPR(), IgnoreVectors);
        add(regs.payloadGPR(), IgnoreVectors);
        return *this;
    }

    inline constexpr RegisterSet& remove(Reg reg)
    {
        ASSERT_UNDER_CONSTEXPR_CONTEXT(!!reg);
        m_bits.clear(reg.index());
        m_upperBits.clear(reg.index());
        return *this;
    }

    inline constexpr RegisterSet& remove(JSValueRegs regs)
    {
        if (regs.tagGPR() != InvalidGPRReg)
            remove(regs.tagGPR());
        remove(regs.payloadGPR());
        return *this;
    }

    inline constexpr bool hasAnyWideRegisters() const { return m_upperBits.count(); }

    inline constexpr RegisterSet& merge(const RegisterSet& other)
    {
        m_bits.merge(other.m_bits);
        m_upperBits.merge(other.m_upperBits);
        ASSERT_UNDER_CONSTEXPR_CONTEXT(m_bits.count() >= m_upperBits.count());
        return *this;
    }

    void dump(PrintStream& out) const
    {
        CommaPrinter comma;
        out.print("["_s);
        for (Reg reg = Reg::first(); reg <= Reg::last(); reg = reg.next()) {
            if (!m_bits.get(reg.index()) && !m_upperBits.get(reg.index()))
                continue;
            out.print(comma, reg);
            if (m_bits.get(reg.index()) && (m_upperBits.get(reg.index()) || conservativeWidth(reg) == conservativeWidthWithoutVectors(reg)))
                continue;

            if (m_bits.get(reg.index()))
                out.print("↓");
            else
                out.print("↑");
        }
        out.print("]"_s);
    }

    friend constexpr bool operator==(const RegisterSet&, const RegisterSet&) = default;

private:
    RegisterBitSet m_bits = { };
    RegisterBitSet m_upperBits = { };
};

constexpr RegisterSetBuilder::RegisterSetBuilder(RegisterSet set)
    : m_bits(set.m_bits)
    , m_upperBits(set.m_upperBits)
{ }

constexpr RegisterSet RegisterSetBuilder::buildAndValidate() const
{
#if ASSERT_ENABLED
    for (Reg reg = Reg::first(); reg <= Reg::last(); reg = reg.next()) {
        if (!m_bits.get(reg.index()) && !m_upperBits.get(reg.index()))
            continue;

        ASSERT_UNDER_CONSTEXPR_CONTEXT(!m_upperBits.get(reg.index()) || m_bits.get(reg.index()));
    }
#endif
    return RegisterSet(*this);
}

constexpr RegisterSet RegisterSetBuilder::buildWithLowerBits() const
{
    return RegisterSet(*this);
}

constexpr size_t RegisterSetBuilder::numberOfSetRegisters() const { return buildAndValidate().numberOfSetRegisters(); }
size_t RegisterSetBuilder::numberOfSetGPRs() const { return buildAndValidate().numberOfSetGPRs(); }
size_t RegisterSetBuilder::numberOfSetFPRs() const { return buildAndValidate().numberOfSetFPRs(); }

class ScalarRegisterSet final {
    friend RegisterSet;
    friend RegisterSetBuilder;

    inline constexpr ScalarRegisterSet(const RegisterSet& registers)
        : m_bits(registers.m_bits)
    {
    }

public:
    constexpr ScalarRegisterSet() { }

    inline constexpr unsigned hash() const { return m_bits.hash(); }
    inline uint64_t bitsForDebugging() const { return *m_bits.storage(); }
    friend constexpr bool operator==(const ScalarRegisterSet&, const ScalarRegisterSet&) = default;

    inline constexpr RegisterSet toRegisterSet() const WARN_UNUSED_RETURN
    {
        RegisterSet result;
        m_bits.forEachSetBit(
            [&] (size_t index) {
                result.add(Reg::fromIndex(index), conservativeWidthWithoutVectors(Reg::fromIndex(index)));
            });
        return result;
    }

    inline constexpr void add(Reg reg, IgnoreVectorsTag)
    {
        ASSERT_UNDER_CONSTEXPR_CONTEXT(!!reg);
        m_bits.set(reg.index());
    }

    inline constexpr void add(JSValueRegs regs, IgnoreVectorsTag)
    {
        if (regs.tagGPR() != InvalidGPRReg)
            add(regs.tagGPR(), IgnoreVectors);
        add(regs.payloadGPR(), IgnoreVectors);
    }

    inline constexpr void remove(Reg reg)
    {
        ASSERT_UNDER_CONSTEXPR_CONTEXT(!!reg);
        m_bits.clear(reg.index());
    }

    inline constexpr bool contains(Reg reg, IgnoreVectorsTag) const
    {
        ASSERT_UNDER_CONSTEXPR_CONTEXT(!!reg);
        return m_bits.get(reg.index());
    }

    inline size_t numberOfSetGPRs() const
    {
        RegisterBitSet temp = m_bits;
        temp.filter(RegisterSetBuilder::allGPRs().m_bits);
        return temp.count();
    }

    inline size_t numberOfSetFPRs() const
    {
        RegisterBitSet temp = m_bits;
        temp.filter(RegisterSetBuilder::allFPRs().m_bits);
        return temp.count();
    }

    inline constexpr size_t numberOfSetRegisters() const
    {
        return m_bits.count();
    }

    void dump(PrintStream& out) const { toRegisterSet().dump(out); }

private:
    RegisterBitSet m_bits;
};

constexpr ScalarRegisterSet RegisterSetBuilder::buildScalarRegisterSet() const
{
    return ScalarRegisterSet(buildAndValidate());
}

constexpr ScalarRegisterSet RegisterSet::buildScalarRegisterSet() const
{
    return ScalarRegisterSet(*this);
}

struct RegisterSetBuilderHash {
    static constexpr unsigned hash(const ScalarRegisterSet& set) { return set.hash(); }
    static constexpr bool equal(const ScalarRegisterSet& a, const ScalarRegisterSet& b) { return a == b; }
    static constexpr bool safeToCompareToEmptyOrDeleted = false;
};

} // namespace JSC

namespace WTF {

template<typename T> struct DefaultHash;
template<> struct DefaultHash<JSC::ScalarRegisterSet> : JSC::RegisterSetBuilderHash { };

} // namespace WTF

#endif // !ENABLE(C_LOOP)
