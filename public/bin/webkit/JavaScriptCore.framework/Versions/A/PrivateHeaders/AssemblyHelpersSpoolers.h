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

#if ENABLE(JIT)

#include "AssemblyHelpers.h"
#include "SIMDInfo.h"
#include "Width.h"

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

template<typename RegType>
struct RegDispatch {
    static bool hasSameType(Reg);
    static RegType get(Reg);
    template<typename Spooler> static RegType temp1(const Spooler*);
    template<typename Spooler> static RegType temp2(const Spooler*);
    template<typename Spooler> static RegType& regToStore(Spooler*);
    static constexpr RegType invalid();
    static constexpr size_t regSize();
    static bool isValidLoadPairImm(int);
    static bool isValidStorePairImm(int);
};

template<>
struct RegDispatch<GPRReg> {
    static bool hasSameType(Reg reg) { return reg.isGPR(); }
    static GPRReg get(Reg reg) { return reg.gpr(); }
    template<typename Spooler> static GPRReg temp1(const Spooler* spooler) { return spooler->m_temp1GPR; }
    template<typename Spooler> static GPRReg temp2(const Spooler* spooler) { return spooler->m_temp2GPR; }
    template<typename Spooler> static GPRReg& regToStore(Spooler* spooler) { return spooler->m_gprToStore; }
    static constexpr GPRReg invalid() { return InvalidGPRReg; }
    static constexpr size_t regSize() { return sizeof(CPURegister); }
#if CPU(ARM64)
    static bool isValidLoadPairImm(int offset) { return ARM64Assembler::isValidLDPImm<64>(offset); }
    static bool isValidStorePairImm(int offset) { return ARM64Assembler::isValidSTPImm<64>(offset); }
#else
    static bool isValidLoadPairImm(int) { return false; }
    static bool isValidStorePairImm(int) { return false; }
#endif
};

template<>
struct RegDispatch<FPRReg> {
    static bool hasSameType(Reg reg) { return reg.isFPR(); }
    static FPRReg get(Reg reg) { return reg.fpr(); }
    template<typename Spooler> static FPRReg temp1(const Spooler* spooler) { return spooler->m_temp1FPR; }
    template<typename Spooler> static FPRReg temp2(const Spooler* spooler) { return spooler->m_temp2FPR; }
    template<typename Spooler> static FPRReg& regToStore(Spooler* spooler) { return spooler->m_fprToStore; }
    static constexpr FPRReg invalid() { return InvalidFPRReg; }
    static constexpr size_t regSize() { return sizeof(double); }
#if CPU(ARM64)
    static bool isValidLoadPairImm(int offset) { return ARM64Assembler::isValidLDPFPImm<64>(offset); }
    static bool isValidStorePairImm(int offset) { return ARM64Assembler::isValidSTPFPImm<64>(offset); }
#else
    static bool isValidLoadPairImm(int) { return false; }
    static bool isValidStorePairImm(int) { return false; }
#endif
};

template<typename Op>
class AssemblyHelpers::Spooler {
public:
    using JIT = AssemblyHelpers;

    Spooler(JIT& jit, GPRReg baseGPR)
        : m_jit(jit)
        , m_baseGPR(baseGPR)
    { }

    template<typename RegType>
    void execute(const RegisterAtOffset& entry)
    {
        RELEASE_ASSERT(RegDispatch<RegType>::hasSameType(entry.reg()));
        ASSERT(entry.width() == pointerWidth() || entry.width() == Width64);

        if constexpr (!hasPairOp)
            return op().executeSingle(entry.offset(), RegDispatch<RegType>::get(entry.reg()));

        if (!m_bufferedEntry.reg().isSet()) {
            m_bufferedEntry = entry;
            return;
        }

        constexpr ptrdiff_t regSize = RegDispatch<RegType>::regSize();
        RegType bufferedEntryReg = RegDispatch<RegType>::get(m_bufferedEntry.reg());
        RegType entryReg = RegDispatch<RegType>::get(entry.reg());

        if (entry.offset() == m_bufferedEntry.offset() + regSize) {
            op().executePair(m_bufferedEntry.offset(), bufferedEntryReg, entryReg);
            m_bufferedEntry = { };
            return;
        }
        if (m_bufferedEntry.offset() == entry.offset() + regSize) {
            op().executePair(entry.offset(), entryReg, bufferedEntryReg);
            m_bufferedEntry = { };
            return;
        }

        // We don't have a pair of operations that we can execute as a pair.
        // Execute the previous one as a single (finalize will do that), and then
        // buffer the current entry to potentially be paired with the next entry.
        finalize<RegType>();
        execute<RegType>(entry);
    }

    template<typename RegType>
    void finalize()
    {
        if constexpr (hasPairOp) {
            if (m_bufferedEntry.reg().isSet()) {
                op().executeSingle(m_bufferedEntry.offset(), RegDispatch<RegType>::get(m_bufferedEntry.reg()));
                m_bufferedEntry = { };
            }
        }
    }

    template<typename RegType>
    void executeVector(const RegisterAtOffset& entry)
    {
        ASSERT(RegDispatch<RegType>::hasSameType(entry.reg()));
        ASSERT(entry.reg().isFPR());
        finalize<RegType>();
        op().executeVector(entry.offset(), RegDispatch<RegType>::get(entry.reg()));
    }

private:
    static constexpr bool hasPairOp = isARM_THUMB2() || isARM64();

    Op& op() { return *reinterpret_cast<Op*>(this); }

protected:
    JIT& m_jit;
    GPRReg m_baseGPR;
    RegisterAtOffset m_bufferedEntry;
};

class AssemblyHelpers::LoadRegSpooler : public AssemblyHelpers::Spooler<LoadRegSpooler> {
    using Base = Spooler<LoadRegSpooler>;
    using JIT = Base::JIT;
public:
    LoadRegSpooler(JIT& jit, GPRReg baseGPR)
        : Base(jit, baseGPR)
    { }

    ALWAYS_INLINE void loadGPR(const RegisterAtOffset& entry) { ASSERT(bytesForWidth(entry.width()) == sizeof(CPURegister)); execute<GPRReg>(entry); }
    ALWAYS_INLINE void finalizeGPR() { finalize<GPRReg>(); }
    ALWAYS_INLINE void loadFPR(const RegisterAtOffset& entry) { ASSERT(entry.width() == Width64); execute<FPRReg>(entry); }
    ALWAYS_INLINE void finalizeFPR() { finalize<FPRReg>(); }
    ALWAYS_INLINE void loadVector(const RegisterAtOffset& entry) { ASSERT(entry.width() == Width128); Base::executeVector<FPRReg>(entry); }

private:
#if CPU(ARM64) || CPU(ARM)
    ALWAYS_INLINE void executePair(ptrdiff_t offset, GPRReg reg1, GPRReg reg2)
    {
#if USE(JSVALUE64)
        m_jit.loadPair64(m_baseGPR, TrustedImm32(offset), reg1, reg2);
#else
        m_jit.loadPair32(m_baseGPR, TrustedImm32(offset), reg1, reg2);
#endif
    }
    ALWAYS_INLINE void executePair(ptrdiff_t offset, FPRReg reg1, FPRReg reg2)
    {
        m_jit.loadPair64(m_baseGPR, TrustedImm32(offset), reg1, reg2);
    }
#else
    template<typename RegType>
    ALWAYS_INLINE void executePair(ptrdiff_t, RegType, RegType) { }
#endif

    ALWAYS_INLINE void executeSingle(ptrdiff_t offset, GPRReg reg)
    {
#if USE(JSVALUE64)
        m_jit.load64(Address(m_baseGPR, offset), reg);
#else
        m_jit.load32(Address(m_baseGPR, offset), reg);
#endif
    }

    ALWAYS_INLINE void executeSingle(ptrdiff_t offset, FPRReg reg)
    {
        m_jit.loadDouble(Address(m_baseGPR, offset), reg);
    }

    ALWAYS_INLINE void executeVector(ptrdiff_t offset, FPRReg reg)
    {
#if USE(JSVALUE64)
        m_jit.loadVector(Address(m_baseGPR, offset), reg);
#else
        UNUSED_PARAM(offset);
        UNUSED_PARAM(reg);
        UNREACHABLE_FOR_PLATFORM();
#endif
    }

    friend class AssemblyHelpers::Spooler<LoadRegSpooler>;
};

class AssemblyHelpers::StoreRegSpooler : public AssemblyHelpers::Spooler<StoreRegSpooler> {
    using Base = Spooler<StoreRegSpooler>;
    using JIT = typename Base::JIT;
public:
    StoreRegSpooler(JIT& jit, GPRReg baseGPR)
        : Base(jit, baseGPR)
    { }

    ALWAYS_INLINE void storeGPR(const RegisterAtOffset& entry) { ASSERT(bytesForWidth(entry.width()) == sizeof(CPURegister)); execute<GPRReg>(entry); }
    ALWAYS_INLINE void finalizeGPR() { finalize<GPRReg>(); }
    ALWAYS_INLINE void storeFPR(const RegisterAtOffset& entry) { ASSERT(entry.width() == Width64); execute<FPRReg>(entry); }
    ALWAYS_INLINE void finalizeFPR() { finalize<FPRReg>(); }
    ALWAYS_INLINE void storeVector(const RegisterAtOffset& entry) { ASSERT(entry.width() == Width128); Base::executeVector<FPRReg>(entry); }

private:
#if CPU(ARM64) || CPU(ARM)
    ALWAYS_INLINE void executePair(ptrdiff_t offset, GPRReg reg1, GPRReg reg2)
    {
#if USE(JSVALUE64)
        m_jit.storePair64(reg1, reg2, m_baseGPR, TrustedImm32(offset));
#else
        m_jit.storePair32(reg1, reg2, m_baseGPR, TrustedImm32(offset));
#endif
    }
    ALWAYS_INLINE void executePair(ptrdiff_t offset, FPRReg reg1, FPRReg reg2)
    {
        m_jit.storePair64(reg1, reg2, m_baseGPR, TrustedImm32(offset));
    }
#else
    template<typename RegType>
    ALWAYS_INLINE void executePair(ptrdiff_t, RegType, RegType) { }
#endif

    ALWAYS_INLINE void executeSingle(ptrdiff_t offset, GPRReg reg)
    {
#if USE(JSVALUE64)
        m_jit.store64(reg, Address(m_baseGPR, offset));
#else
        m_jit.store32(reg, Address(m_baseGPR, offset));
#endif
    }

    ALWAYS_INLINE void executeSingle(ptrdiff_t offset, FPRReg reg)
    {
        m_jit.storeDouble(reg, Address(m_baseGPR, offset));
    }

    ALWAYS_INLINE void executeVector(ptrdiff_t offset, FPRReg reg)
    {
#if USE(JSVALUE64)
        m_jit.storeVector(reg, Address(m_baseGPR, offset));
#else
        UNUSED_PARAM(offset);
        UNUSED_PARAM(reg);
        UNREACHABLE_FOR_PLATFORM();
#endif
    }

    friend class AssemblyHelpers::Spooler<StoreRegSpooler>;
};

class AssemblyHelpers::CopySpooler {
public:
    using JIT = AssemblyHelpers;
    using Address = JIT::Address;
    using TrustedImm32 = JIT::TrustedImm32;

    struct Source {
        enum class Type { BufferOffset, Reg, EncodedJSValue } type;
        int offset;
        Reg reg;
        EncodedJSValue value;

        template<typename RegType> RegType getReg() { return RegDispatch<RegType>::get(reg); };
    };

    enum class BufferRegs {
        NeedPreservation,
        AllowModification
    };

    CopySpooler(BufferRegs attribute, JIT& jit, GPRReg srcBuffer, GPRReg destBuffer, GPRReg temp1, GPRReg temp2, FPRReg fpTemp1 = InvalidFPRReg, FPRReg fpTemp2 = InvalidFPRReg)
        : m_jit(jit)
        , m_srcBufferGPR(srcBuffer)
        , m_dstBufferGPR(destBuffer)
        , m_temp1GPR(temp1)
        , m_temp2GPR(temp2)
        , m_temp1FPR(fpTemp1)
        , m_temp2FPR(fpTemp2)
        , m_bufferRegsAttr(attribute)
        {
        if constexpr (hasPairOp && !(isARM_THUMB2() || isARM64()))
            RELEASE_ASSERT_NOT_REACHED(); // unsupported architecture.
    }

    CopySpooler(JIT& jit, GPRReg srcBuffer, GPRReg destBuffer, GPRReg temp1, GPRReg temp2, FPRReg fpTemp1 = InvalidFPRReg, FPRReg fpTemp2 = InvalidFPRReg)
        : CopySpooler(BufferRegs::NeedPreservation, jit, srcBuffer, destBuffer, temp1, temp2, fpTemp1, fpTemp2)
    { }

private:
    template<typename RegType> RegType temp1() const { return RegDispatch<RegType>::temp1(this); }
    template<typename RegType> RegType temp2() const { return RegDispatch<RegType>::temp2(this); }
    template<typename RegType> RegType& regToStore() { return RegDispatch<RegType>::regToStore(this); }

    template<typename RegType> static constexpr RegType invalid() { return RegDispatch<RegType>::invalid(); }
    template<typename RegType> static constexpr int regSize() { return RegDispatch<RegType>::regSize(); }

    template<typename RegType> static bool isValidLoadPairImm(int offset) { return RegDispatch<RegType>::isValidLoadPairImm(offset); }
    template<typename RegType> static bool isValidStorePairImm(int offset) { return RegDispatch<RegType>::isValidStorePairImm(offset); }

    template<typename RegType>
    void load(int offset)
    {
        if constexpr (!hasPairOp) {
            auto& regToStore = this->regToStore<RegType>();
            regToStore = temp1<RegType>();
            load(offset, regToStore);
            return;
        }

        auto& source = m_sources[m_currentSource++];
        source.type = Source::Type::BufferOffset;
        source.offset = offset;
    }

    void move(EncodedJSValue value)
    {
        if constexpr (!hasPairOp) {
            auto& regToStore = this->regToStore<GPRReg>();
            regToStore = temp1<GPRReg>();
            move(value, regToStore);
            return;
        }

        auto& source = m_sources[m_currentSource++];
        source.type = Source::Type::EncodedJSValue;
        source.value = value;
    }

    template<typename RegType>
    void copy(RegType reg)
    {
        if constexpr (!hasPairOp) {
            auto& regToStore = this->regToStore<RegType>();
            regToStore = reg;
            return;
        }

        auto& source = m_sources[m_currentSource++];
        source.type = Source::Type::Reg;
        source.reg = reg;
    }

    template<typename RegType>
    void store(int storeOffset)
    {
        if constexpr (!hasPairOp) {
            auto regToStore = this->regToStore<RegType>();
            store(regToStore, storeOffset);
            return;
        }

        constexpr bool regTypeIsGPR = std::is_same<RegType, GPRReg>::value;

        if (m_currentSource < 2) {
            m_deferredStoreOffset = storeOffset;
            return;
        }

        RegType regToStore1 = invalid<RegType>();
        RegType regToStore2 = invalid<RegType>();
        auto& source1 = m_sources[0];
        auto& source2 = m_sources[1];
        auto srcOffset1 = m_sources[0].offset - m_srcOffsetAdjustment;
        auto srcOffset2 = m_sources[1].offset - m_srcOffsetAdjustment;
        constexpr int registerSize = regSize<RegType>();

        if (source1.type == Source::Type::BufferOffset && source2.type == Source::Type::BufferOffset) {
            regToStore1 = temp1<RegType>();
            regToStore2 = temp2<RegType>();

            int offsetDelta = std::abs(srcOffset1 - srcOffset2);
            int minOffset = std::min(srcOffset1, srcOffset2);
            bool isValidOffset = isValidLoadPairImm<RegType>(minOffset);

            if (offsetDelta != registerSize || (!isValidOffset && m_bufferRegsAttr != BufferRegs::AllowModification)) {
                load(srcOffset1, regToStore1);
                load(srcOffset2, regToStore2);
            } else {
                if (!isValidOffset) {
                    ASSERT(m_bufferRegsAttr == BufferRegs::AllowModification);
                    m_srcOffsetAdjustment += minOffset;
                    m_jit.addPtr(TrustedImm32(minOffset), m_srcBufferGPR);

                    srcOffset1 -= minOffset;
                    srcOffset2 -= minOffset;
                    ASSERT(isValidLoadPairImm<RegType>(std::min(srcOffset1, srcOffset2)));
                }
                if (srcOffset1 < srcOffset2)
                    loadPair(srcOffset1, regToStore1, regToStore2);
                else
                    loadPair(srcOffset2, regToStore2, regToStore1);
            }
        } else if (source1.type == Source::Type::BufferOffset) {
            regToStore1 = temp1<RegType>();
            load(srcOffset1, regToStore1);
            if (source2.type == Source::Type::EncodedJSValue) {
                if constexpr (regTypeIsGPR) {
                    regToStore2 = temp2<RegType>();
                    move(source2.value, regToStore2);
                } else
                    RELEASE_ASSERT_NOT_REACHED();
            } else
                regToStore2 = source2.getReg<RegType>();

        } else if (source2.type == Source::Type::BufferOffset) {
            if (source1.type == Source::Type::EncodedJSValue) {
                if constexpr (regTypeIsGPR) {
                    regToStore1 = temp1<RegType>();
                    move(source1.value, regToStore1);
                } else
                    RELEASE_ASSERT_NOT_REACHED();
            } else
                regToStore1 = source1.getReg<RegType>();
            regToStore2 = temp2<RegType>();
            load(srcOffset2, regToStore2);

        } else {
            if (source1.type == Source::Type::EncodedJSValue) {
                if constexpr (regTypeIsGPR) {
                    regToStore1 = temp1<RegType>();
                    move(source1.value, regToStore1);
                } else
                    RELEASE_ASSERT_NOT_REACHED();
            } else
                regToStore1 = source1.getReg<RegType>();

            if (source2.type == Source::Type::EncodedJSValue) {
                if constexpr (regTypeIsGPR) {
                    regToStore2 = temp2<RegType>();
                    move(source2.value, regToStore2);
                } else
                    RELEASE_ASSERT_NOT_REACHED();
            } else
                regToStore2 = source2.getReg<RegType>();
        }

        int dstOffset1 = m_deferredStoreOffset - m_dstOffsetAdjustment;
        int dstOffset2 = storeOffset - m_dstOffsetAdjustment;

        int offsetDelta = std::abs(dstOffset1 - dstOffset2);
        int minOffset = std::min(dstOffset1, dstOffset2);
        bool isValidOffset = isValidStorePairImm<RegType>(minOffset);

        if (offsetDelta != registerSize || (!isValidOffset && m_bufferRegsAttr != BufferRegs::AllowModification)) {
            store(regToStore1, dstOffset1);
            store(regToStore2, dstOffset2);
        } else {
            if (!isValidOffset) {
                ASSERT(m_bufferRegsAttr == BufferRegs::AllowModification);
                m_dstOffsetAdjustment += minOffset;
                m_jit.addPtr(TrustedImm32(minOffset), m_dstBufferGPR);

                dstOffset1 -= minOffset;
                dstOffset2 -= minOffset;
                ASSERT(isValidStorePairImm<RegType>(std::min(dstOffset1, dstOffset2)));
            }
            if (dstOffset1 < dstOffset2)
                storePair(regToStore1, regToStore2, dstOffset1);
            else
                storePair(regToStore2, regToStore1, dstOffset2);
        }

        m_currentSource = 0;
    }

    template<typename RegType>
    void finalize()
    {
        if constexpr (!hasPairOp)
            return;

        if (!m_currentSource)
            return; // Nothing to finalize.

        ASSERT(m_currentSource == 1);

        RegType regToStore = invalid<RegType>();
        auto& source = m_sources[0];
        auto& srcOffset = source.offset;
        constexpr bool regTypeIsGPR = std::is_same<RegType, GPRReg>::value;

        if (source.type == Source::Type::BufferOffset) {
            regToStore = temp1<RegType>();
            load(srcOffset - m_srcOffsetAdjustment, regToStore);
        } else if (source.type == Source::Type::Reg)
            regToStore = source.getReg<RegType>();
        else if constexpr (regTypeIsGPR) {
            regToStore = temp1<RegType>();
            move(source.value, regToStore);
        } else
            RELEASE_ASSERT_NOT_REACHED();

        store(regToStore, m_deferredStoreOffset - m_dstOffsetAdjustment);
        m_currentSource = 0;
    }

public:
    ALWAYS_INLINE void loadGPR(int srcOffset) { load<GPRReg>(srcOffset); }
    ALWAYS_INLINE void copyGPR(GPRReg gpr) { copy<GPRReg>(gpr); }
    ALWAYS_INLINE void moveConstant(EncodedJSValue value) { move(value); }
    ALWAYS_INLINE void storeGPR(int dstOffset) { store<GPRReg>(dstOffset); }
    ALWAYS_INLINE void finalizeGPR() { finalize<GPRReg>(); }

    ALWAYS_INLINE void loadFPR(int srcOffset) { load<FPRReg>(srcOffset); }
    ALWAYS_INLINE void copyFPR(FPRReg gpr) { copy<FPRReg>(gpr); }
    ALWAYS_INLINE void storeFPR(int dstOffset) { store<FPRReg>(dstOffset); }
    ALWAYS_INLINE void finalizeFPR() { finalize<FPRReg>(); }

protected:
#if USE(JSVALUE64)
    ALWAYS_INLINE void move(EncodedJSValue value, GPRReg dest)
    {
        m_jit.move(TrustedImm64(value), dest);
    }
#else
    NO_RETURN_DUE_TO_CRASH void move(EncodedJSValue, GPRReg) { RELEASE_ASSERT_NOT_REACHED(); }
#endif

    ALWAYS_INLINE void load(int offset, GPRReg dest)
    {
        m_jit.loadPtr(Address(m_srcBufferGPR, offset), dest);
    }

    ALWAYS_INLINE void store(GPRReg src, int offset)
    {
        m_jit.storePtr(src, Address(m_dstBufferGPR, offset));
    }

    ALWAYS_INLINE void load(int offset, FPRReg dest)
    {
        m_jit.loadDouble(Address(m_srcBufferGPR, offset), dest);
    }

    ALWAYS_INLINE void store(FPRReg src, int offset)
    {
        m_jit.storeDouble(src, Address(m_dstBufferGPR, offset));
    }

#if CPU(ARM64) || CPU(ARM)
    ALWAYS_INLINE void loadPair(int offset, GPRReg dest1, GPRReg dest2)
    {
#if USE(JSVALUE64)
        m_jit.loadPair64(m_srcBufferGPR, TrustedImm32(offset), dest1, dest2);
#else
        m_jit.loadPair32(m_srcBufferGPR, TrustedImm32(offset), dest1, dest2);
#endif
    }

    ALWAYS_INLINE void loadPair(int offset, FPRReg dest1, FPRReg dest2)
    {
        m_jit.loadPair64(m_srcBufferGPR, TrustedImm32(offset), dest1, dest2);
    }

    ALWAYS_INLINE void storePair(GPRReg src1, GPRReg src2, int offset)
    {
#if USE(JSVALUE64)
        m_jit.storePair64(src1, src2, m_dstBufferGPR, TrustedImm32(offset));
#else
        m_jit.storePair32(src1, src2, m_dstBufferGPR, TrustedImm32(offset));
#endif
    }

    ALWAYS_INLINE void storePair(FPRReg src1, FPRReg src2, int offset)
    {
        m_jit.storePair64(src1, src2, m_dstBufferGPR, TrustedImm32(offset));
    }

    static constexpr bool hasPairOp = true;
#else
    template<typename RegType> ALWAYS_INLINE void loadPair(int, RegType, RegType) { }
    template<typename RegType> ALWAYS_INLINE void storePair(RegType, RegType, int) { }

    static constexpr bool hasPairOp = false;
#endif

    JIT& m_jit;

    GPRReg m_srcBufferGPR;
    GPRReg m_dstBufferGPR;
    GPRReg m_temp1GPR;
    GPRReg m_temp2GPR;
    FPRReg m_temp1FPR;
    FPRReg m_temp2FPR;

private:
    static constexpr int gprSize = static_cast<int>(sizeof(CPURegister));
    static constexpr int fprSize = static_cast<int>(sizeof(double));

    // These point to which register to use.
    GPRReg m_gprToStore { InvalidGPRReg }; // Only used when !hasPairOp.
    FPRReg m_fprToStore { InvalidFPRReg }; // Only used when !hasPairOp.

    BufferRegs m_bufferRegsAttr;
    Source m_sources[2];
    unsigned m_currentSource { 0 };
    int m_srcOffsetAdjustment { 0 };
    int m_dstOffsetAdjustment { 0 };
    int m_deferredStoreOffset;

    template<typename RegTypem> friend struct RegDispatch;
};

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END

#endif // ENABLE(JIT)
