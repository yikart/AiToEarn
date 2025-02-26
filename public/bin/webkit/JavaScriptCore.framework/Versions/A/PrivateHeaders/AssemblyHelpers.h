/*
 * Copyright (C) 2011-2022 Apple Inc. All rights reserved.
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

#include "CodeBlock.h"
#include "EntryFrame.h"
#include "FPRInfo.h"
#include "GPRInfo.h"
#include "Heap.h"
#include "InlineCallFrame.h"
#include "JITAllocator.h"
#include "JITCode.h"
#include "JSBigInt.h"
#include "JSCell.h"
#include "MacroAssembler.h"
#include "MarkedSpace.h"
#include "RegisterAtOffsetList.h"
#include "RegisterSet.h"
#include "ScratchRegisterAllocator.h"
#include "StackAlignment.h"
#include "TagRegistersMode.h"
#include "TypeofType.h"
#include "VM.h"
#include <variant>
#include <wtf/TZoneMalloc.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

typedef void (*V_DebugOperation_EPP)(CallFrame*, void*, void*);

class AssemblyHelpers : public MacroAssembler {
    WTF_MAKE_TZONE_ALLOCATED(AssemblyHelpers);
public:
    AssemblyHelpers(CodeBlock* codeBlock)
        : m_codeBlock(codeBlock)
        , m_baselineCodeBlock(codeBlock ? codeBlock->baselineAlternative() : nullptr)
    {
        if (m_codeBlock) {
            ASSERT(m_baselineCodeBlock);
            ASSERT(!m_baselineCodeBlock->alternative());
            ASSERT(m_baselineCodeBlock->jitType() == JITType::None || JITCode::isBaselineCode(m_baselineCodeBlock->jitType()));
        }
    }

    CodeBlock* codeBlock() { return m_codeBlock; }
    VM& vm() { return m_codeBlock->vm(); }
    AssemblerType_T& assembler() { return m_assembler; }

    void prepareCallOperation(VM& vm)
    {
        UNUSED_PARAM(vm);
#if !USE(BUILTIN_FRAME_ADDRESS) || ASSERT_ENABLED
        storePtr(GPRInfo::callFrameRegister, &vm.topCallFrame);
#endif
    }

#if USE(JSVALUE32_64)
    template <typename Tag, typename Payload, typename Dst>
    void storeAndFence32(Tag&& tag, Payload&& payload, Dst&& dst)
    {
        static_assert(!PayloadOffset && TagOffset == 4, "Assumes little-endian system");

        auto const finish = [&](auto&& tagDst) {
            if (Options::useConcurrentJIT()) {
                store32(TrustedImm32(JSValue::InvalidTag), tagDst);
                storeFence();
                store32(payload, dst);
                storeFence();
                store32(tag, tagDst);
            } else {
                store32(payload, dst);
                store32(tag, tagDst);
            }
        };

        if constexpr (std::is_pointer_v<std::remove_reference_t<Dst>>) {
            void* tagAddr = reinterpret_cast<void*>(reinterpret_cast<uintptr_t>(dst) + TagOffset);
            finish(tagAddr);
        } else
            finish(dst.withOffset(TagOffset));
    }
#endif

#if ENABLE(WEBASSEMBLY)
    void prepareWasmCallOperation(GPRReg instanceGPR);
#endif

    void checkStackPointerAlignment()
    {
        // This check is both unneeded and harder to write correctly for ARM64
#if !defined(NDEBUG) && !CPU(ARM64)
        Jump stackPointerAligned = branchTestPtr(Zero, stackPointerRegister, TrustedImm32(0xf));
        abortWithReason(AHStackPointerMisaligned);
        stackPointerAligned.link(this);
#endif
    }

#if USE(JSVALUE64)
    void store64FromReg(Reg src, Address dst)
    {
        if (src.isFPR())
            storeDouble(src.fpr(), dst);
        else
            store64(src.gpr(), dst);
    }
#endif
    
    void store32FromReg(Reg src, Address dst)
    {
        if (src.isFPR())
            storeFloat(src.fpr(), dst);
        else
            store32(src.gpr(), dst);
    }

    void storeReg(Reg src, Address dst)
    {
#if USE(JSVALUE64)
        store64FromReg(src, dst);
#else
        store32FromReg(src, dst);
#endif
    }

#if USE(JSVALUE64)
    void load64ToReg(Address src, Reg dst)
    {
        if (dst.isFPR())
            loadDouble(src, dst.fpr());
        else
            load64(src, dst.gpr());
    }
#endif
    
    void load32ToReg(Address src, Reg dst)
    {
        if (dst.isFPR())
            loadFloat(src, dst.fpr());
        else
            load32(src, dst.gpr());
    }

    void loadReg(Address src, Reg dst)
    {
#if USE(JSVALUE64)
        load64ToReg(src, dst);
#else
        load32ToReg(src, dst);
#endif
    }

#if USE(JSVALUE64)
    template<typename T, typename U>
    void storeCell(T cell, U address)
    {
        store64(cell, address);
    }
#else
    void storeCell(GPRReg cell, Address address)
    {
        storeAndFence32(TrustedImm32(JSValue::CellTag), cell, address);
    }
#endif

#if USE(JSVALUE64)
    template<typename U>
    void storeCell(GPRReg cell, U address)
    {
        store64(cell, address);
    }
#else
    void storeCell(GPRReg cell, void* address)
    {
        storeAndFence32(TrustedImm32(JSValue::CellTag), cell, address);
    }
#endif

    void storeCell(JSValueRegs regs, void* address)
    {
#if USE(JSVALUE64)
        store64(regs.gpr(), address);
#else
        move(AssemblyHelpers::TrustedImm32(JSValue::CellTag), regs.tagGPR());
        storeAndFence32(regs.tagGPR(), regs.payloadGPR(), address);
#endif
    }

#if USE(JSVALUE32_64)
    void storeCell(TrustedImmPtr cell, Address address)
    {
#if USE(JSVALUE64)
        store64(cell, address);
#else
        storeAndFence32(TrustedImm32(JSValue::CellTag), TrustedImm32(cell.asIntptr()), address);
#endif
    }

    void storeCell(const void* address)
    {
        store32(AssemblyHelpers::TrustedImm32(JSValue::CellTag), address);
    }
#endif

    void loadCell(Address address, GPRReg gpr)
    {
#if USE(JSVALUE64)
        load64(address, gpr);
#else
        load32(address.withOffset(PayloadOffset), gpr);
#endif
    }

    void storeValue(JSValueRegs regs, Address address)
    {
#if USE(JSVALUE64)
        store64(regs.gpr(), address);
#else
        storeAndFence32(regs.tagGPR(), regs.payloadGPR(), address);
#endif
    }
    
    void storeValue(JSValueRegs regs, BaseIndex address)
    {
#if USE(JSVALUE64)
        store64(regs.gpr(), address);
#else
        storeAndFence32(regs.tagGPR(), regs.payloadGPR(), address);
#endif
    }
    
    void storeValue(JSValueRegs regs, void* address)
    {
#if USE(JSVALUE64)
        store64(regs.gpr(), address);
#else
        storeAndFence32(regs.tagGPR(), regs.payloadGPR(), address);
#endif
    }

    void loadValue(Address address, JSValueRegs regs)
    {
#if USE(JSVALUE64)
        load64(address, regs.gpr());
#else
        static_assert(!PayloadOffset && TagOffset == 4, "Assumes little-endian system");
        loadPair32(address, regs.payloadGPR(), regs.tagGPR());
#endif
    }
    
    void loadValue(BaseIndex address, JSValueRegs regs)
    {
#if USE(JSVALUE64)
        load64(address, regs.gpr());
#else
        static_assert(!PayloadOffset && TagOffset == 4, "Assumes little-endian system");
        loadPair32(address, regs.payloadGPR(), regs.tagGPR());
#endif
    }

    void loadValue(void* address, JSValueRegs regs)
    {
#if USE(JSVALUE64)
        load64(address, regs.gpr());
#else
        loadPair32(AbsoluteAddress(address), regs.payloadGPR(), regs.tagGPR());
#endif
    }
    
    // Note that these clobber offset.
    void loadProperty(GPRReg object, GPRReg offset, JSValueRegs result);
    void storeProperty(JSValueRegs value, GPRReg object, GPRReg offset, GPRReg scratch);

    JumpList loadMegamorphicProperty(VM&, GPRReg baseGPR, GPRReg uidGPR, UniquedStringImpl*, GPRReg resultGPR, GPRReg scratch1GPR, GPRReg scratch2GPR, GPRReg scratch3GPR);
    std::tuple<JumpList, JumpList> storeMegamorphicProperty(VM&, GPRReg baseGPR, GPRReg uidGPR, UniquedStringImpl*, GPRReg valueGPR, GPRReg scratch1GPR, GPRReg scratch2GPR, GPRReg scratch3GPR);
    JumpList hasMegamorphicProperty(VM&, GPRReg baseGPR, GPRReg uidGPR, UniquedStringImpl*, GPRReg resultGPR, GPRReg scratch1GPR, GPRReg scratch2GPR, GPRReg scratch3GPR);

    void moveValueRegs(JSValueRegs srcRegs, JSValueRegs destRegs)
    {
#if USE(JSVALUE32_64)
        if (destRegs.tagGPR() == srcRegs.payloadGPR()) {
            if (destRegs.payloadGPR() == srcRegs.tagGPR()) {
                swap(srcRegs.payloadGPR(), srcRegs.tagGPR());
                return;
            }
            move(srcRegs.payloadGPR(), destRegs.payloadGPR());
            move(srcRegs.tagGPR(), destRegs.tagGPR());
            return;
        }
        move(srcRegs.tagGPR(), destRegs.tagGPR());
        move(srcRegs.payloadGPR(), destRegs.payloadGPR());
#else
        move(srcRegs.gpr(), destRegs.gpr());
#endif
    }

    void moveValue(JSValue value, JSValueRegs regs)
    {
#if USE(JSVALUE64)
        move(Imm64(JSValue::encode(value)), regs.gpr());
#else
        move(Imm32(value.tag()), regs.tagGPR());
        move(Imm32(value.payload()), regs.payloadGPR());
#endif
    }

    void moveTrustedValue(JSValue value, JSValueRegs regs)
    {
#if USE(JSVALUE64)
        move(TrustedImm64(JSValue::encode(value)), regs.gpr());
#else
        move(TrustedImm32(value.tag()), regs.tagGPR());
        move(TrustedImm32(value.payload()), regs.payloadGPR());
#endif
    }

    void storeValue(JSValue value, Address address, JSValueRegs tmpJSR)
    {
#if USE(JSVALUE64)
        UNUSED_PARAM(tmpJSR);
        store64(Imm64(JSValue::encode(value)), address);
#elif USE(JSVALUE32_64)
        // Can implement this without the tmpJSR, but using it yields denser code.
        moveValue(value, tmpJSR);
        storeValue(tmpJSR, address);
#endif
    }

#if USE(JSVALUE32_64)
    void storeValue(JSValue value, void* address, JSValueRegs tmpJSR)
    {
        // Can implement this without the tmpJSR, but using it yields denser code.
        moveValue(value, tmpJSR);
        storeValue(tmpJSR, address);
    }
#endif

    void storeTrustedValue(JSValue value, Address address)
    {
#if USE(JSVALUE64)
        store64(TrustedImm64(JSValue::encode(value)), address);
#else
        storeAndFence32(TrustedImm32(value.tag()), TrustedImm32(value.payload()), address);
#endif
    }

    void storeTrustedValue(JSValue value, BaseIndex address)
    {
#if USE(JSVALUE64)
        store64(TrustedImm64(JSValue::encode(value)), address);
#else
        storeAndFence32(TrustedImm32(value.tag()), TrustedImm32(value.payload()), address);
#endif
    }

    template<typename Op> class Spooler;
    class LoadRegSpooler;
    class StoreRegSpooler;
    class CopySpooler;

    Address addressFor(const RegisterAtOffset& entry)
    {
        return Address(GPRInfo::callFrameRegister, entry.offset());
    }

    void emitSave(const RegisterAtOffsetList&);
    void emitRestore(const RegisterAtOffsetList&, GPRReg = GPRInfo::callFrameRegister);

    void emitSaveCalleeSavesFor(const RegisterAtOffsetList* calleeSaves);
    
    enum RestoreTagRegisterMode { UseExistingTagRegisterContents, CopyBaselineCalleeSavedRegistersFromBaseFrame };

    void emitSaveOrCopyLLIntBaselineCalleeSavesFor(CodeBlock*, VirtualRegister offsetVirtualRegister, RestoreTagRegisterMode, GPRReg temp1, GPRReg temp2, GPRReg temp3);

    void emitRestoreCalleeSavesFor(const RegisterAtOffsetList* calleeSaves);

    void emitSaveThenMaterializeTagRegisters()
    {
#if USE(JSVALUE64)
#if CPU(ARM64) || CPU(RISCV64)
        pushPair(GPRInfo::numberTagRegister, GPRInfo::notCellMaskRegister);
#else
        push(GPRInfo::numberTagRegister);
        push(GPRInfo::notCellMaskRegister);
#endif
        emitMaterializeTagCheckRegisters();
#endif
    }

    void emitRestoreSavedTagRegisters()
    {
#if USE(JSVALUE64)
#if CPU(ARM64) || CPU(RISCV64)
        popPair(GPRInfo::numberTagRegister, GPRInfo::notCellMaskRegister);
#else
        pop(GPRInfo::notCellMaskRegister);
        pop(GPRInfo::numberTagRegister);
#endif
#endif
    }

    // If you use this, be aware that vmGPR will get trashed.
    void copyCalleeSavesToVMEntryFrameCalleeSavesBuffer(GPRReg vmGPR)
    {
#if NUMBER_OF_CALLEE_SAVES_REGISTERS > 0
        loadPtr(Address(vmGPR, VM::topEntryFrameOffset()), vmGPR);
        copyCalleeSavesToEntryFrameCalleeSavesBufferImpl(vmGPR);
#else
        UNUSED_PARAM(vmGPR);
#endif
    }

    void copyCalleeSavesToEntryFrameCalleeSavesBuffer(EntryFrame*& topEntryFrame, GPRReg scratch)
    {
#if NUMBER_OF_CALLEE_SAVES_REGISTERS > 0
        loadPtr(&topEntryFrame, scratch);
        copyCalleeSavesToEntryFrameCalleeSavesBufferImpl(scratch);
#else
        UNUSED_PARAM(topEntryFrame);
        UNUSED_PARAM(scratch);
#endif
    }

    void copyCalleeSavesToEntryFrameCalleeSavesBuffer(GPRReg topEntryFrame)
    {
#if NUMBER_OF_CALLEE_SAVES_REGISTERS > 0
        copyCalleeSavesToEntryFrameCalleeSavesBufferImpl(topEntryFrame);
#else
        UNUSED_PARAM(topEntryFrame);
#endif
    }

    void restoreCalleeSavesFromEntryFrameCalleeSavesBuffer(EntryFrame*&);
    void restoreCalleeSavesFromVMEntryFrameCalleeSavesBuffer(GPRReg vmGPR, GPRReg scratchGPR);
    void restoreCalleeSavesFromVMEntryFrameCalleeSavesBufferImpl(GPRReg entryFrame, const RegisterSet& skipList);

    void copyLLIntBaselineCalleeSavesFromFrameOrRegisterToEntryFrameCalleeSavesBuffer(EntryFrame*&, const RegisterSet& usedRegisters = RegisterSetBuilder::stubUnavailableRegisters());

    void emitMaterializeTagCheckRegisters()
    {
#if USE(JSVALUE64)
        move(MacroAssembler::TrustedImm64(JSValue::NumberTag), GPRInfo::numberTagRegister);
        or64(MacroAssembler::TrustedImm32(JSValue::OtherTag), GPRInfo::numberTagRegister, GPRInfo::notCellMaskRegister);
#endif
    }

#if CPU(X86_64)
    void emitFunctionPrologue()
    {
        push(framePointerRegister);
        move(stackPointerRegister, framePointerRegister);
    }

    void emitFunctionEpilogueWithEmptyFrame()
    {
        pop(framePointerRegister);
    }

    void emitFunctionEpilogue()
    {
        move(framePointerRegister, stackPointerRegister);
        pop(framePointerRegister);
    }

    void preserveReturnAddressAfterCall(GPRReg reg)
    {
        pop(reg);
    }

    void restoreReturnAddressBeforeReturn(GPRReg reg)
    {
        push(reg);
    }

    void restoreReturnAddressBeforeReturn(Address address)
    {
        push(address);
    }

    // dest = base + index << shift.
    void shiftAndAdd(RegisterID base, RegisterID index, uint8_t shift, RegisterID dest, std::optional<RegisterID> optionalScratch = { })
    {
        ASSERT(shift < 32);
        if (shift <= 3) {
            x86Lea64(BaseIndex(base, index, static_cast<Scale>(shift)), dest);
            return;
        }

        RegisterID scratch = dest;
        bool needToPreserveIndexRegister = false;
        if (base == dest) {
            scratch = optionalScratch ? optionalScratch.value() : scratchRegister();
            if (base == scratch) {
                scratch = index;
                needToPreserveIndexRegister = true;
            } else if (index == scratch)
                needToPreserveIndexRegister = true;
            if (needToPreserveIndexRegister)
                push(index);
        }

        move(index, scratch);
        lshift64(TrustedImm32(shift), scratch);
        m_assembler.leaq_mr(0, base, scratch, 0, dest);

        if (needToPreserveIndexRegister)
            pop(index);
    }

#endif // CPU(X86_64)

#if CPU(ARM_THUMB2) || CPU(ARM64)
    void emitFunctionPrologue()
    {
        tagReturnAddress();
        pushPair(framePointerRegister, linkRegister);
        move(stackPointerRegister, framePointerRegister);
    }

    void emitFunctionEpilogueWithEmptyFrame()
    {
        popPair(framePointerRegister, linkRegister);
    }

    void emitFunctionEpilogue()
    {
        move(framePointerRegister, stackPointerRegister);
        emitFunctionEpilogueWithEmptyFrame();
    }

    ALWAYS_INLINE void preserveReturnAddressAfterCall(RegisterID reg)
    {
        move(linkRegister, reg);
    }

    ALWAYS_INLINE void restoreReturnAddressBeforeReturn(RegisterID reg)
    {
        move(reg, linkRegister);
    }

    ALWAYS_INLINE void restoreReturnAddressBeforeReturn(Address address)
    {
        loadPtr(address, linkRegister);
    }

#if CPU(ARM64)
    // dest = base + index << shift.
    void shiftAndAdd(RegisterID base, RegisterID index, uint8_t shift, RegisterID dest, std::optional<RegisterID> = { })
    {
        ASSERT(shift < 32);
        ASSERT(base != index);
        getEffectiveAddress(BaseIndex(base, index, static_cast<Scale>(shift)), dest);
    }
#endif // CPU(ARM64)
#endif

#if CPU(RISCV64)
    void emitFunctionPrologue()
    {
        pushPair(framePointerRegister, linkRegister);
        move(stackPointerRegister, framePointerRegister);
    }

    void emitFunctionEpilogueWithEmptyFrame()
    {
        popPair(framePointerRegister, linkRegister);
    }

    void emitFunctionEpilogue()
    {
        move(framePointerRegister, stackPointerRegister);
        emitFunctionEpilogueWithEmptyFrame();
    }

    ALWAYS_INLINE void preserveReturnAddressAfterCall(RegisterID reg)
    {
        move(linkRegister, reg);
    }

    ALWAYS_INLINE void restoreReturnAddressBeforeReturn(RegisterID reg)
    {
        move(reg, linkRegister);
    }

    ALWAYS_INLINE void restoreReturnAddressBeforeReturn(Address address)
    {
        loadPtr(address, linkRegister);
    }
#endif

    void getArityPadding(VM&, unsigned numberOfParameters, GPRReg argumentCountIncludingThisGPR, GPRReg paddingOutputGPR, GPRReg scratchGPR0, GPRReg scratchGPR1, JumpList& stackOverflow);

    void emitGetFromCallFrameHeaderPtr(VirtualRegister entry, GPRReg to, GPRReg from = GPRInfo::callFrameRegister)
    {
        ASSERT(entry.isHeader());
        loadPtr(Address(from, entry.offset() * sizeof(Register)), to);
    }

    void emitPutToCallFrameHeader(GPRReg from, VirtualRegister entry)
    {
        ASSERT(entry.isHeader());
        storePtr(from, Address(GPRInfo::callFrameRegister, entry.offset() * sizeof(Register)));
    }

    void emitPutToCallFrameHeader(void* value, VirtualRegister entry)
    {
        ASSERT(entry.isHeader());
        storePtr(TrustedImmPtr(value), Address(GPRInfo::callFrameRegister, entry.offset() * sizeof(Register)));
    }

    void emitPutCellToCallFrameHeader(GPRReg from, VirtualRegister entry)
    {
        ASSERT(entry.isHeader());
        storeCell(from, Address(GPRInfo::callFrameRegister, entry.offset() * sizeof(Register)));
    }

    void emitZeroToCallFrameHeader(VirtualRegister entry)
    {
        ASSERT(entry.isHeader());
        storePtr(TrustedImmPtr(nullptr), Address(GPRInfo::callFrameRegister, entry.offset() * sizeof(Register)));
    }

    JumpList branchIfNotEqual(JSValueRegs regs, JSValue value)
    {
#if USE(JSVALUE64)
        return branch64(NotEqual, regs.gpr(), TrustedImm64(JSValue::encode(value)));
#else
        JumpList result;
        result.append(branch32(NotEqual, regs.tagGPR(), TrustedImm32(value.tag())));
        if (value.isEmpty() || value.isUndefinedOrNull())
            return result; // These don't have anything interesting in the payload.
        result.append(branch32(NotEqual, regs.payloadGPR(), TrustedImm32(value.payload())));
        return result;
#endif
    }
    
    Jump branchIfEqual(JSValueRegs regs, JSValue value)
    {
#if USE(JSVALUE64)
        return branch64(Equal, regs.gpr(), TrustedImm64(JSValue::encode(value)));
#else
        Jump notEqual;
        // These don't have anything interesting in the payload.
        if (!value.isEmpty() && !value.isUndefinedOrNull())
            notEqual = branch32(NotEqual, regs.payloadGPR(), TrustedImm32(value.payload()));
        Jump result = branch32(Equal, regs.tagGPR(), TrustedImm32(value.tag()));
        if (notEqual.isSet())
            notEqual.link(this);
        return result;
#endif
    }

    template<typename T>
    Jump branchIfNotCell(T maybeCell, TagRegistersMode mode = HaveTagRegisters)
    {
#if USE(JSVALUE64)
        if (mode == HaveTagRegisters)
            return branchTest64(NonZero, maybeCell, GPRInfo::notCellMaskRegister);
        return branchTest64(NonZero, maybeCell, TrustedImm64(JSValue::NotCellMask));
#else
        UNUSED_PARAM(mode);
        return branch32(MacroAssembler::NotEqual, maybeCell, TrustedImm32(JSValue::CellTag));
#endif
    }

    Jump branchIfNotCell(JSValueRegs regs, TagRegistersMode mode = HaveTagRegisters)
    {
#if USE(JSVALUE64)
        return branchIfNotCell(regs.gpr(), mode);
#else
        return branchIfNotCell(regs.tagGPR(), mode);
#endif
    }

    template<typename T>
    Jump branchIfCell(T maybeCell, TagRegistersMode mode = HaveTagRegisters)
    {
#if USE(JSVALUE64)
        if (mode == HaveTagRegisters)
            return branchTest64(Zero, maybeCell, GPRInfo::notCellMaskRegister);
        return branchTest64(Zero, maybeCell, TrustedImm64(JSValue::NotCellMask));
#else
        UNUSED_PARAM(mode);
        return branch32(MacroAssembler::Equal, maybeCell, TrustedImm32(JSValue::CellTag));
#endif
    }

    Jump branchIfCell(JSValueRegs regs, TagRegistersMode mode = HaveTagRegisters)
    {
#if USE(JSVALUE64)
        return branchIfCell(regs.gpr(), mode);
#else
        return branchIfCell(regs.tagGPR(), mode);
#endif
    }
    
    Jump branchIfOther(JSValueRegs regs, GPRReg tempGPR)
    {
#if USE(JSVALUE64)
        and64(TrustedImm32(~JSValue::UndefinedTag), regs.gpr(), tempGPR);
        return branch64(Equal, tempGPR, TrustedImm64(JSValue::ValueNull));
#else
        or32(TrustedImm32(1), regs.tagGPR(), tempGPR);
        return branch32(Equal, tempGPR, TrustedImm32(JSValue::NullTag));
#endif
    }
    
    Jump branchIfNotOther(JSValueRegs regs, GPRReg tempGPR)
    {
#if USE(JSVALUE64)
        and64(TrustedImm32(~JSValue::UndefinedTag), regs.gpr(), tempGPR);
        return branch64(NotEqual, tempGPR, TrustedImm64(JSValue::ValueNull));
#else
        or32(TrustedImm32(1), regs.tagGPR(), tempGPR);
        return branch32(NotEqual, tempGPR, TrustedImm32(JSValue::NullTag));
#endif
    }
    
    Jump branchIfInt32(GPRReg gpr, TagRegistersMode mode = HaveTagRegisters)
    {
#if USE(JSVALUE64)
        if (mode == HaveTagRegisters)
            return branch64(AboveOrEqual, gpr, GPRInfo::numberTagRegister);
        return branch64(AboveOrEqual, gpr, TrustedImm64(JSValue::NumberTag));
#else
        UNUSED_PARAM(mode);
        return branch32(Equal, gpr, TrustedImm32(JSValue::Int32Tag));
#endif
    }

    Jump branchIfInt32(JSValueRegs regs, TagRegistersMode mode = HaveTagRegisters)
    {
#if USE(JSVALUE64)
        return branchIfInt32(regs.gpr(), mode);
#else
        return branchIfInt32(regs.tagGPR(), mode);
#endif
    }

    Jump branchIfNotInt32(GPRReg gpr, TagRegistersMode mode = HaveTagRegisters)
    {
#if USE(JSVALUE64)
        if (mode == HaveTagRegisters)
            return branch64(Below, gpr, GPRInfo::numberTagRegister);
        return branch64(Below, gpr, TrustedImm64(JSValue::NumberTag));
#else
        UNUSED_PARAM(mode);
        return branch32(NotEqual, gpr, TrustedImm32(JSValue::Int32Tag));
#endif
    }

    Jump branchIfNotInt32(JSValueRegs regs, TagRegistersMode mode = HaveTagRegisters)
    {
#if USE(JSVALUE64)
        return branchIfNotInt32(regs.gpr(), mode);
#else
        return branchIfNotInt32(regs.tagGPR(), mode);
#endif
    }

    // Note that the tempGPR is not used in 64-bit mode.
    Jump branchIfNumber(JSValueRegs regs, GPRReg tempGPR, TagRegistersMode mode = HaveTagRegisters)
    {
#if USE(JSVALUE64)
        UNUSED_PARAM(tempGPR);
        return branchIfNumber(regs.gpr(), mode);
#else
        UNUSED_PARAM(mode);
        ASSERT(tempGPR != InvalidGPRReg);
        add32(TrustedImm32(1), regs.tagGPR(), tempGPR);
        return branch32(Below, tempGPR, TrustedImm32(JSValue::LowestTag + 1));
#endif
    }

#if USE(JSVALUE64)
    Jump branchIfNumber(GPRReg gpr, TagRegistersMode mode = HaveTagRegisters)
    {
        if (mode == HaveTagRegisters)
            return branchTest64(NonZero, gpr, GPRInfo::numberTagRegister);
        return branchTest64(NonZero, gpr, TrustedImm64(JSValue::NumberTag));
    }
#endif
    
    // Note that the tempGPR is not used in 64-bit mode.
    Jump branchIfNotNumber(JSValueRegs regs, GPRReg tempGPR, TagRegistersMode mode = HaveTagRegisters)
    {
#if USE(JSVALUE64)
        UNUSED_PARAM(tempGPR);
        return branchIfNotNumber(regs.gpr(), mode);
#else
        UNUSED_PARAM(mode);
        add32(TrustedImm32(1), regs.tagGPR(), tempGPR);
        return branch32(AboveOrEqual, tempGPR, TrustedImm32(JSValue::LowestTag + 1));
#endif
    }

#if USE(JSVALUE64)
    Jump branchIfNotNumber(GPRReg gpr, TagRegistersMode mode = HaveTagRegisters)
    {
        if (mode == HaveTagRegisters)
            return branchTest64(Zero, gpr, GPRInfo::numberTagRegister);
        return branchTest64(Zero, gpr, TrustedImm64(JSValue::NumberTag));
    }
#endif

    Jump branchIfNotDoubleKnownNotInt32(JSValueRegs regs, TagRegistersMode mode = HaveTagRegisters)
    {
#if USE(JSVALUE64)
        if (mode == HaveTagRegisters)
            return branchTest64(Zero, regs.gpr(), GPRInfo::numberTagRegister);
        return branchTest64(Zero, regs.gpr(), TrustedImm64(JSValue::NumberTag));
#else
        UNUSED_PARAM(mode);
        return branch32(AboveOrEqual, regs.tagGPR(), TrustedImm32(JSValue::LowestTag));
#endif
    }

    // Note that the tempGPR is not used in 32-bit mode.
    Jump branchIfBoolean(GPRReg gpr, GPRReg tempGPR)
    {
#if USE(JSVALUE64)
        ASSERT(tempGPR != InvalidGPRReg);
        xor64(TrustedImm32(JSValue::ValueFalse), gpr, tempGPR);
        return branchTest64(Zero, tempGPR, TrustedImm32(static_cast<int32_t>(~1)));
#else
        UNUSED_PARAM(tempGPR);
        return branch32(Equal, gpr, TrustedImm32(JSValue::BooleanTag));
#endif
    }

    // Note that the tempGPR is not used in 32-bit mode.
    Jump branchIfBoolean(JSValueRegs regs, GPRReg tempGPR)
    {
#if USE(JSVALUE64)
        return branchIfBoolean(regs.gpr(), tempGPR);
#else
        return branchIfBoolean(regs.tagGPR(), tempGPR);
#endif
    }
    
    // Note that the tempGPR is not used in 32-bit mode.
    Jump branchIfNotBoolean(GPRReg gpr, GPRReg tempGPR)
    {
#if USE(JSVALUE64)
        ASSERT(tempGPR != InvalidGPRReg);
        xor64(TrustedImm32(JSValue::ValueFalse), gpr, tempGPR);
        return branchTest64(NonZero, tempGPR, TrustedImm32(static_cast<int32_t>(~1)));
#else
        UNUSED_PARAM(tempGPR);
        return branch32(NotEqual, gpr, TrustedImm32(JSValue::BooleanTag));
#endif
    }

    // Note that the tempGPR is not used in 32-bit mode.
    Jump branchIfNotBoolean(JSValueRegs regs, GPRReg tempGPR)
    {
#if USE(JSVALUE64)
        return branchIfNotBoolean(regs.gpr(), tempGPR);
#else
        return branchIfNotBoolean(regs.tagGPR(), tempGPR);
#endif
    }

#if USE(BIGINT32)
    Jump branchIfBigInt32(GPRReg gpr, GPRReg tempGPR, TagRegistersMode mode = HaveTagRegisters)
    {
        ASSERT(tempGPR != InvalidGPRReg);
        if (mode == HaveTagRegisters && gpr != tempGPR) {
            static_assert(JSValue::BigInt32Mask == JSValue::NumberTag + JSValue::BigInt32Tag);
            add64(TrustedImm32(JSValue::BigInt32Tag), GPRInfo::numberTagRegister, tempGPR);
            and64(gpr, tempGPR);
            return branch64(Equal, tempGPR, TrustedImm32(JSValue::BigInt32Tag));
        }

        and64(TrustedImm64(JSValue::BigInt32Mask), gpr, tempGPR);
        return branch64(Equal, tempGPR, TrustedImm32(JSValue::BigInt32Tag));
    }
    Jump branchIfNotBigInt32(GPRReg gpr, GPRReg tempGPR, TagRegistersMode mode = HaveTagRegisters)
    {
        ASSERT(tempGPR != InvalidGPRReg);
        if (mode == HaveTagRegisters && gpr != tempGPR) {
            static_assert(JSValue::BigInt32Mask == JSValue::NumberTag + JSValue::BigInt32Tag);
            add64(TrustedImm32(JSValue::BigInt32Tag), GPRInfo::numberTagRegister, tempGPR);
            and64(gpr, tempGPR);
            return branch64(NotEqual, tempGPR, TrustedImm32(JSValue::BigInt32Tag));
        }
        and64(TrustedImm64(JSValue::BigInt32Mask), gpr, tempGPR);
        return branch64(NotEqual, tempGPR, TrustedImm32(JSValue::BigInt32Tag));
    }
    Jump branchIfBigInt32(JSValueRegs regs, GPRReg tempGPR, TagRegistersMode mode = HaveTagRegisters)
    {
        return branchIfBigInt32(regs.gpr(), tempGPR, mode);
    }
    Jump branchIfNotBigInt32(JSValueRegs regs, GPRReg tempGPR, TagRegistersMode mode = HaveTagRegisters)
    {
        return branchIfNotBigInt32(regs.gpr(), tempGPR, mode);
    }
#endif // USE(BIGINT32)

    // FIXME: rename these to make it clear that they require their input to be a cell.
    Jump branchIfObject(GPRReg cellGPR)
    {
        return branch8(
            AboveOrEqual, Address(cellGPR, JSCell::typeInfoTypeOffset()), TrustedImm32(ObjectType));
    }
    
    Jump branchIfNotObject(GPRReg cellGPR)
    {
        return branch8(
            Below, Address(cellGPR, JSCell::typeInfoTypeOffset()), TrustedImm32(ObjectType));
    }

    // Note that first and last are inclusive.
    Jump branchIfType(GPRReg cellGPR, JSTypeRange range)
    {
        if (range.last == range.first)
            return branch8(Equal, Address(cellGPR, JSCell::typeInfoTypeOffset()), TrustedImm32(range.first));

        ASSERT(range.last > range.first);
        GPRReg scratch = scratchRegister();
        load8(Address(cellGPR, JSCell::typeInfoTypeOffset()), scratch);
        sub32(TrustedImm32(range.first), scratch);
        return branch32(BelowOrEqual, scratch, TrustedImm32(range.last - range.first));
    }

    Jump branchIfType(GPRReg cellGPR, JSType type)
    {
        return branchIfType(cellGPR, JSTypeRange { type, type });
    }

    Jump branchIfNotType(GPRReg cellGPR, JSTypeRange range)
    {
        if (range.last == range.first)
            return branch8(NotEqual, Address(cellGPR, JSCell::typeInfoTypeOffset()), TrustedImm32(range.first));

        ASSERT(range.last > range.first);
        GPRReg scratch = scratchRegister();
        load8(Address(cellGPR, JSCell::typeInfoTypeOffset()), scratch);
        sub32(TrustedImm32(range.first), scratch);
        return branch32(Above, scratch, TrustedImm32(range.last - range.first));
    }

    Jump branchIfNotType(GPRReg cellGPR, JSType type)
    {
        return branchIfNotType(cellGPR, JSTypeRange { type, type });
    }

    // FIXME: rename these to make it clear that they require their input to be a cell.
    Jump branchIfString(GPRReg cellGPR) { return branchIfType(cellGPR, StringType); }
    Jump branchIfNotString(GPRReg cellGPR) { return branchIfNotType(cellGPR, StringType); }
    Jump branchIfSymbol(GPRReg cellGPR) { return branchIfType(cellGPR, SymbolType); }
    Jump branchIfNotSymbol(GPRReg cellGPR) { return branchIfNotType(cellGPR, SymbolType); }
    Jump branchIfHeapBigInt(GPRReg cellGPR) { return branchIfType(cellGPR, HeapBigIntType); }
    Jump branchIfNotHeapBigInt(GPRReg cellGPR) { return branchIfNotType(cellGPR, HeapBigIntType); }
    Jump branchIfFunction(GPRReg cellGPR) { return branchIfType(cellGPR, JSFunctionType); }
    Jump branchIfNotFunction(GPRReg cellGPR) { return branchIfNotType(cellGPR, JSFunctionType); }
    Jump branchIfStructure(GPRReg cellGPR) { return branchIfType(cellGPR, StructureType); }
    Jump branchIfNotStructure(GPRReg cellGPR) { return branchIfNotType(cellGPR, StructureType); }
    
    void isEmpty(GPRReg gpr, GPRReg dst)
    {
#if USE(JSVALUE64)
        test64(Zero, gpr, gpr, dst);
#else
        compare32(Equal, gpr, TrustedImm32(JSValue::EmptyValueTag), dst);
#endif
    }

#if USE(JSVALUE64)
    void toBigInt64(GPRReg cellGPR, GPRReg destGPR, GPRReg scratchGPR, GPRReg scratch2GPR)
    {
        ASSERT(noOverlap(cellGPR, destGPR, scratchGPR, scratch2GPR));
        load32(Address(cellGPR, JSBigInt::offsetOfLength()), destGPR);
        JumpList doneCases;
        doneCases.append(branchTest32(Zero, destGPR));
        loadPtr(Address(cellGPR, JSBigInt::offsetOfData()), scratchGPR);
        cageConditionally(Gigacage::Primitive, scratchGPR, destGPR, scratch2GPR);
        load64(Address(scratchGPR), destGPR);
        doneCases.append(branchTest8(Zero, Address(cellGPR, JSBigInt::offsetOfSign())));
        neg64(destGPR);
        doneCases.link(this);
    }
#endif

    void isNotEmpty(GPRReg gpr, GPRReg dst)
    {
#if USE(JSVALUE64)
        test64(NonZero, gpr, gpr, dst);
#else
        compare32(NotEqual, gpr, TrustedImm32(JSValue::EmptyValueTag), dst);
#endif
    }

    Jump branchIfEmpty(BaseIndex address)
    {
#if USE(JSVALUE64)
        return branchTest64(Zero, address);
#else
        return branch32(Equal, address.withOffset(TagOffset), TrustedImm32(JSValue::EmptyValueTag));
#endif
    }

    Jump branchIfEmpty(GPRReg gpr)
    {
#if USE(JSVALUE64)
        return branchTest64(Zero, gpr);
#else
        return branch32(Equal, gpr, TrustedImm32(JSValue::EmptyValueTag));
#endif
    }

    Jump branchIfEmpty(JSValueRegs regs)
    {
#if USE(JSVALUE64)
        return branchIfEmpty(regs.gpr());
#else
        return branchIfEmpty(regs.tagGPR());
#endif
    }

    Jump branchIfNotEmpty(BaseIndex address)
    {
#if USE(JSVALUE64)
        return branchTest64(NonZero, address);
#else
        return branch32(NotEqual, address.withOffset(TagOffset), TrustedImm32(JSValue::EmptyValueTag));
#endif
    }

    Jump branchIfNotEmpty(GPRReg gpr)
    {
#if USE(JSVALUE64)
        return branchTest64(NonZero, gpr);
#else
        return branch32(NotEqual, gpr, TrustedImm32(JSValue::EmptyValueTag));
#endif
    }

    Jump branchIfNotEmpty(JSValueRegs regs)
    {
#if USE(JSVALUE64)
        return branchIfNotEmpty(regs.gpr());
#else
        return branchIfNotEmpty(regs.tagGPR());
#endif
    }

    void isUndefined(JSValueRegs regs, GPRReg dst)
    {
#if USE(JSVALUE64)
        compare64(Equal, regs.payloadGPR(), TrustedImm32(JSValue::ValueUndefined), dst);
#elif USE(JSVALUE32_64)
        compare32(Equal, regs.tagGPR(), TrustedImm32(JSValue::UndefinedTag), dst);
#endif
    }

    // Note that this function does not respect MasqueradesAsUndefined.
    Jump branchIfUndefined(GPRReg gpr)
    {
#if USE(JSVALUE64)
        return branch64(Equal, gpr, TrustedImm64(JSValue::encode(jsUndefined())));
#else
        return branch32(Equal, gpr, TrustedImm32(JSValue::UndefinedTag));
#endif
    }

    // Note that this function does not respect MasqueradesAsUndefined.
    Jump branchIfUndefined(JSValueRegs regs)
    {
#if USE(JSVALUE64)
        return branchIfUndefined(regs.gpr());
#else
        return branchIfUndefined(regs.tagGPR());
#endif
    }

    // Note that this function does not respect MasqueradesAsUndefined.
    Jump branchIfNotUndefined(GPRReg gpr)
    {
#if USE(JSVALUE64)
        return branch64(NotEqual, gpr, TrustedImm64(JSValue::encode(jsUndefined())));
#else
        return branch32(NotEqual, gpr, TrustedImm32(JSValue::UndefinedTag));
#endif
    }

    // Note that this function does not respect MasqueradesAsUndefined.
    Jump branchIfNotUndefined(JSValueRegs regs)
    {
#if USE(JSVALUE64)
        return branchIfNotUndefined(regs.gpr());
#else
        return branchIfNotUndefined(regs.tagGPR());
#endif
    }

    void isNull(JSValueRegs regs, GPRReg dst)
    {
#if USE(JSVALUE64)
        compare64(Equal, regs.payloadGPR(), TrustedImm32(JSValue::ValueNull), dst);
#elif USE(JSVALUE32_64)
        compare32(Equal, regs.tagGPR(), TrustedImm32(JSValue::NullTag), dst);
#endif
    }

    void isNotNull(JSValueRegs regs, GPRReg dst)
    {
#if USE(JSVALUE64)
        compare64(NotEqual, regs.payloadGPR(), TrustedImm32(JSValue::ValueNull), dst);
#elif USE(JSVALUE32_64)
        compare32(NotEqual, regs.tagGPR(), TrustedImm32(JSValue::NullTag), dst);
#endif
    }

    Jump branchIfNull(GPRReg gpr)
    {
#if USE(JSVALUE64)
        return branch64(Equal, gpr, TrustedImm64(JSValue::encode(jsNull())));
#else
        return branch32(Equal, gpr, TrustedImm32(JSValue::NullTag));
#endif
    }

    Jump branchIfNull(JSValueRegs regs)
    {
#if USE(JSVALUE64)
        return branchIfNull(regs.gpr());
#else
        return branchIfNull(regs.tagGPR());
#endif
    }

    Jump branchIfNotNull(GPRReg gpr)
    {
#if USE(JSVALUE64)
        return branch64(NotEqual, gpr, TrustedImm64(JSValue::encode(jsNull())));
#else
        return branch32(NotEqual, gpr, TrustedImm32(JSValue::NullTag));
#endif
    }

    Jump branchIfNotNull(JSValueRegs regs)
    {
#if USE(JSVALUE64)
        return branchIfNotNull(regs.gpr());
#else
        return branchIfNotNull(regs.tagGPR());
#endif
    }

    template<typename T>
    Jump branchStructure(RelationalCondition condition, T leftHandSide, Structure* structure)
    {
#if USE(JSVALUE64)
        return branch32(condition, leftHandSide, TrustedImm32(structure->id().bits()));
#else
        return branchPtr(condition, leftHandSide, TrustedImmPtr(structure));
#endif
    }

    Jump branchIfFastTypedArray(GPRReg baseGPR);
    Jump branchIfNotFastTypedArray(GPRReg baseGPR);

    Jump branchIfNaN(FPRReg fpr)
    {
        return branchDouble(DoubleNotEqualOrUnordered, fpr, fpr);
    }

    Jump branchIfNotNaN(FPRReg fpr)
    {
        return branchDouble(DoubleEqualAndOrdered, fpr, fpr);
    }

    Jump branchIfRopeStringImpl(GPRReg stringImplGPR)
    {
        return branchTestPtr(NonZero, stringImplGPR, TrustedImm32(JSString::isRopeInPointer));
    }

    Jump branchIfNotRopeStringImpl(GPRReg stringImplGPR)
    {
        return branchTestPtr(Zero, stringImplGPR, TrustedImm32(JSString::isRopeInPointer));
    }

#if USE(JSVALUE64)
    JumpList branchIfResizableOrGrowableSharedTypedArrayIsOutOfBounds(GPRReg baseGPR, GPRReg scratchGPR, GPRReg scratch2GPR, std::optional<TypedArrayType>);
    void loadTypedArrayByteLength(GPRReg baseGPR, GPRReg valueGPR, GPRReg scratchGPR, GPRReg scratch2GPR, TypedArrayType);
    void loadTypedArrayLength(GPRReg baseGPR, GPRReg valueGPR, GPRReg scratchGPR, GPRReg scratch2GPR, std::optional<TypedArrayType>);
#else
    JumpList branchIfResizableOrGrowableSharedTypedArrayIsOutOfBounds(GPRReg, GPRReg, GPRReg, std::optional<TypedArrayType>) { return { }; }
    void loadTypedArrayByteLength(GPRReg, GPRReg, GPRReg, GPRReg, TypedArrayType) { }
    void loadTypedArrayLength(GPRReg, GPRReg, GPRReg, GPRReg, std::optional<TypedArrayType>) { }
#endif

    void emitTurnUndefinedIntoNull(JSValueRegs regs)
    {
#if USE(JSVALUE64)
        static_assert((JSValue::ValueUndefined & ~JSValue::UndefinedTag) == JSValue::ValueNull);
        and64(TrustedImm32(~JSValue::UndefinedTag), regs.payloadGPR());
#elif USE(JSVALUE32_64)
        static_assert((JSValue::UndefinedTag | 1) == JSValue::NullTag);
        or32(TrustedImm32(1), regs.tagGPR());
#endif
    }

    static Address addressForByteOffset(ptrdiff_t byteOffset)
    {
        return Address(GPRInfo::callFrameRegister, byteOffset);
    }
    static Address addressFor(VirtualRegister virtualRegister, GPRReg baseReg)
    {
        ASSERT(virtualRegister.isValid());
        return Address(baseReg, virtualRegister.offset() * sizeof(Register));
    }
    static Address addressFor(VirtualRegister virtualRegister)
    {
        // NB. It's tempting on some architectures to sometimes use an offset from the stack
        // register because for some offsets that will encode to a smaller instruction. But we
        // cannot do this. We use this in places where the stack pointer has been moved to some
        // unpredictable location.
        ASSERT(virtualRegister.isValid());
        return Address(GPRInfo::callFrameRegister, virtualRegister.offset() * sizeof(Register));
    }
    static Address addressFor(Operand operand)
    {
        ASSERT(!operand.isTmp());
        return addressFor(operand.virtualRegister());
    }

    static Address tagFor(VirtualRegister virtualRegister, GPRReg baseGPR)
    {
        ASSERT(virtualRegister.isValid());
        return Address(baseGPR, virtualRegister.offset() * sizeof(Register) + TagOffset);
    }

    static Address tagFor(VirtualRegister virtualRegister)
    {
        ASSERT(virtualRegister.isValid());
        return Address(GPRInfo::callFrameRegister, virtualRegister.offset() * sizeof(Register) + TagOffset);
    }

    static Address tagFor(Operand operand)
    {
        ASSERT(!operand.isTmp());
        return tagFor(operand.virtualRegister());
    }

    static Address payloadFor(VirtualRegister virtualRegister, GPRReg baseGPR)
    {
        ASSERT(virtualRegister.isValid());
        return Address(baseGPR, virtualRegister.offset() * sizeof(Register) + PayloadOffset);
    }

    static Address payloadFor(VirtualRegister virtualRegister)
    {
        ASSERT(virtualRegister.isValid());
        return Address(GPRInfo::callFrameRegister, virtualRegister.offset() * sizeof(Register) + PayloadOffset);
    }

    static Address payloadFor(Operand operand)
    {
        ASSERT(!operand.isTmp());
        return payloadFor(operand.virtualRegister());
    }

    // Access to our fixed callee CallFrame.
    static Address calleeFrameSlot(VirtualRegister slot)
    {
        ASSERT(slot.offset() >= CallerFrameAndPC::sizeInRegisters);
        return Address(stackPointerRegister, sizeof(Register) * (slot - CallerFrameAndPC::sizeInRegisters).offset());
    }

    // Access to our fixed callee CallFrame.
    static Address calleeArgumentSlot(int argument)
    {
        return calleeFrameSlot(virtualRegisterForArgumentIncludingThis(argument));
    }

    static Address calleeFrameTagSlot(VirtualRegister slot)
    {
        return calleeFrameSlot(slot).withOffset(TagOffset);
    }

    static Address calleeFramePayloadSlot(VirtualRegister slot)
    {
        return calleeFrameSlot(slot).withOffset(PayloadOffset);
    }

    static Address calleeArgumentTagSlot(int argument)
    {
        return calleeArgumentSlot(argument).withOffset(TagOffset);
    }

    static Address calleeArgumentPayloadSlot(int argument)
    {
        return calleeArgumentSlot(argument).withOffset(PayloadOffset);
    }

    static Address calleeFrameCallerFrame()
    {
        return calleeFrameSlot(VirtualRegister(0)).withOffset(CallFrame::callerFrameOffset());
    }

    static Address calleeFrameCodeBlockBeforeCall()
    {
        return calleeFrameSlot(CallFrameSlot::codeBlock);
    }

    static Address calleeFrameCodeBlockBeforeTailCall()
    {
        // The stackPointerRegister state is "after the call, but before the function prologue".
        return calleeFrameSlot(CallFrameSlot::codeBlock).withOffset(sizeof(CallerFrameAndPC) - prologueStackPointerDelta());
    }

    static GPRReg selectScratchGPR(RegisterSet preserved)
    {
        GPRReg registers[] = {
            GPRInfo::regT0,
            GPRInfo::regT1,
            GPRInfo::regT2,
            GPRInfo::regT3,
            GPRInfo::regT4,
            GPRInfo::regT5,
#if CPU(ARM64)
            GPRInfo::regT6,
            GPRInfo::regT7,
            GPRInfo::regT8,
            GPRInfo::regT9,
            GPRInfo::regT10,
            GPRInfo::regT11,
            GPRInfo::regT12,
            GPRInfo::regT13,
            GPRInfo::regT14,
            GPRInfo::regT15,
#elif CPU(X86_64)
            GPRInfo::regT6,
            GPRInfo::regT7,
#elif CPU(ARM_THUMB2)
            GPRInfo::regT6,
            GPRInfo::regT7,
#elif CPU(RISCV64)
            GPRInfo::regT6,
            GPRInfo::regT7,
            GPRInfo::regT8,
            GPRInfo::regT9,
            GPRInfo::regT10,
            GPRInfo::regT11,
            GPRInfo::regT12,
#endif
        };

        for (GPRReg reg : registers) {
            if (!preserved.contains(reg, IgnoreVectors))
                return reg;
        }
        RELEASE_ASSERT_NOT_REACHED();
        return InvalidGPRReg;
    }

    template<typename... Regs>
    static GPRReg selectScratchGPR(Regs... args)
    {
        RegisterSet set;
        constructRegisterSet(set, args...);
        return selectScratchGPR(set);
    }

    static void constructRegisterSet(RegisterSet&)
    {
    }

    template<typename... Regs>
    static void constructRegisterSet(RegisterSet& set, JSValueRegs regs, Regs... args)
    {
        if (regs.tagGPR() != InvalidGPRReg)
            set.add(regs.tagGPR(), IgnoreVectors);
        if (regs.payloadGPR() != InvalidGPRReg)
            set.add(regs.payloadGPR(), IgnoreVectors);
        constructRegisterSet(set, args...);
    }

    template<typename... Regs>
    static void constructRegisterSet(RegisterSet& set, GPRReg reg, Regs... args)
    {
        if (reg != InvalidGPRReg) {
            ASSERT(!Reg(reg).isFPR());
            set.add(reg, IgnoreVectors);
        }
        constructRegisterSet(set, args...);
    }

    // These methods JIT generate dynamic, debug-only checks - akin to ASSERTs.
#if ASSERT_ENABLED
    void jitAssertIsInt32(GPRReg);
    void jitAssertIsJSInt32(GPRReg);
    void jitAssertIsJSNumber(GPRReg);
    void jitAssertIsJSDouble(GPRReg);
    void jitAssertIsCell(GPRReg);
    void jitAssertHasValidCallFrame();
    void jitAssertIsNull(GPRReg);
    void jitAssertTagsInPlace();
    void jitAssertArgumentCountSane();
    inline void jitAssertNoException(VM& vm) { jitReleaseAssertNoException(vm); }
    void jitAssertCodeBlockOnCallFrameWithType(GPRReg scratchGPR, JITType);
    void jitAssertCodeBlockMatchesCurrentCalleeCodeBlockOnCallFrame(GPRReg scratchGPR, GPRReg scratchGPR2, UnlinkedCodeBlock&);
    void jitAssertCodeBlockOnCallFrameIsOptimizingJIT(GPRReg scratchGPR);
#else
    void jitAssertIsInt32(GPRReg) { }
    void jitAssertIsJSInt32(GPRReg) { }
    void jitAssertIsJSNumber(GPRReg) { }
    void jitAssertIsJSDouble(GPRReg) { }
    void jitAssertIsCell(GPRReg) { }
    void jitAssertHasValidCallFrame() { }
    void jitAssertIsNull(GPRReg) { }
    void jitAssertTagsInPlace() { }
    void jitAssertArgumentCountSane() { }
    void jitAssertNoException(VM&) { }
    void jitAssertCodeBlockOnCallFrameWithType(GPRReg, JITType) { }
    void jitAssertCodeBlockOnCallFrameIsOptimizingJIT(GPRReg) { }
    void jitAssertCodeBlockMatchesCurrentCalleeCodeBlockOnCallFrame(GPRReg, GPRReg, UnlinkedCodeBlock&) { }
#endif

    void jitReleaseAssertNoException(VM&);

    void incrementSuperSamplerCount();
    void decrementSuperSamplerCount();
    
    void purifyNaN(FPRReg);

    // These methods convert between doubles, and doubles boxed and JSValues.
#if USE(JSVALUE64)
    GPRReg boxDouble(FPRReg fpr, GPRReg gpr, TagRegistersMode mode = HaveTagRegisters)
    {
        moveDoubleTo64(fpr, gpr);
        if (mode == DoNotHaveTagRegisters)
            sub64(TrustedImm64(JSValue::NumberTag), gpr);
        else {
            sub64(GPRInfo::numberTagRegister, gpr);
            jitAssertIsJSDouble(gpr);
        }
        return gpr;
    }
    FPRReg unboxDoubleWithoutAssertions(GPRReg gpr, GPRReg resultGPR, FPRReg fpr, TagRegistersMode mode = HaveTagRegisters)
    {
        if (mode == DoNotHaveTagRegisters) {
            move(TrustedImm64(JSValue::NumberTag), resultGPR);
            add64(gpr, resultGPR);
        } else
            add64(GPRInfo::numberTagRegister, gpr, resultGPR);
        move64ToDouble(resultGPR, fpr);
        return fpr;
    }
    FPRReg unboxDouble(GPRReg gpr, GPRReg resultGPR, FPRReg fpr, TagRegistersMode mode = HaveTagRegisters)
    {
        jitAssertIsJSDouble(gpr);
        return unboxDoubleWithoutAssertions(gpr, resultGPR, fpr, mode);
    }
    void unboxDouble(JSValueRegs regs, FPRReg fpr)
    {
        unboxDouble(regs.tagGPR(), regs.payloadGPR(), fpr);
    }
    void boxDouble(FPRReg fpr, JSValueRegs regs, TagRegistersMode mode = HaveTagRegisters)
    {
        boxDouble(fpr, regs.gpr(), mode);
    }

    void unboxDoubleNonDestructive(JSValueRegs regs, FPRReg destFPR, GPRReg resultGPR)
    {
        unboxDouble(regs.payloadGPR(), resultGPR, destFPR);
    }

    // Here are possible arrangements of source, target, scratch:
    // - source, target, scratch can all be separate registers.
    // - source and target can be the same but scratch is separate.
    // - target and scratch can be the same but source is separate.
    void boxInt52(GPRReg source, GPRReg target, GPRReg scratch, FPRReg fpScratch)
    {
        // Is it an int32?
        signExtend32ToPtr(source, scratch);
        Jump isInt32 = branch64(Equal, source, scratch);
        
        // Nope, it's not, but regT0 contains the int64 value.
        convertInt64ToDouble(source, fpScratch);
        boxDouble(fpScratch, target);
        Jump done = jump();
        
        isInt32.link(this);
        zeroExtend32ToWord(source, target);
        or64(GPRInfo::numberTagRegister, target);
        
        done.link(this);
    }

    void branchConvertDoubleToInt52(FPRegisterID srcFPR, RegisterID destGPR, JumpList& failureCases, RegisterID scratch1GPR, FPRegisterID scratch2FPR)
    {
        JumpList doneCases;

        truncateDoubleToInt64(srcFPR, destGPR);
        convertInt64ToDouble(destGPR, scratch2FPR);
        failureCases.append(branchDouble(DoubleNotEqualOrUnordered, srcFPR, scratch2FPR));
        auto isZero = branchTest64(Zero, destGPR);
        // This moves the checking range (fail if N >= (1 << (52 - 1)) or N < -(1 << (52 - 1))) by subtracting a value.
        // So, valid value region starts with -1 and lower. In unsigned form, which means,
        // 0xffffffffffffffff to 0xfff0000000000000. So, by shifting 52, we can extract 0xfff part, and we can check whether it is below than that (<= 4094).
        move(TrustedImm64(0xfff8000000000000ULL), scratch1GPR);
        add64(destGPR, scratch1GPR);
        urshift64(TrustedImm32(52), scratch1GPR);
        failureCases.append(branch64(BelowOrEqual, scratch1GPR, TrustedImm32(4094)));
        doneCases.append(jump());

        isZero.link(this);
        moveDoubleTo64(srcFPR, scratch1GPR);
        failureCases.append(branchTest64(NonZero, scratch1GPR, TrustedImm64(1ULL << 63)));

        doneCases.link(this);
    }
#endif // USE(JSVALUE64)

#if USE(BIGINT32)
    void unboxBigInt32(GPRReg src, GPRReg dest)
    {
#if CPU(ARM64)
        urshift64(src, trustedImm32ForShift(Imm32(16)), dest);
#else
        move(src, dest);
        urshift64(trustedImm32ForShift(Imm32(16)), dest);
#endif
    }

    void boxBigInt32(GPRReg gpr)
    {
        lshift64(trustedImm32ForShift(Imm32(16)), gpr);
        or64(TrustedImm32(JSValue::BigInt32Tag), gpr);
    }
#endif

#if USE(JSVALUE32_64)
    void boxDouble(FPRReg fpr, GPRReg tagGPR, GPRReg payloadGPR)
    {
        moveDoubleToInts(fpr, payloadGPR, tagGPR);
    }
    void unboxDouble(GPRReg tagGPR, GPRReg payloadGPR, FPRReg fpr)
    {
        moveIntsToDouble(payloadGPR, tagGPR, fpr);
    }
    
    void boxDouble(FPRReg fpr, JSValueRegs regs)
    {
        boxDouble(fpr, regs.tagGPR(), regs.payloadGPR());
    }
    void unboxDouble(JSValueRegs regs, FPRReg fpr)
    {
        unboxDouble(regs.tagGPR(), regs.payloadGPR(), fpr);
    }

    void unboxDoubleNonDestructive(JSValueRegs regs, FPRReg destFPR, GPRReg)
    {
        unboxDouble(regs, destFPR);
    }
#endif

    void unboxNativeCallee(GPRReg boxedGPR, GPRReg calleeGPR)
    {
#if USE(JSVALUE64)
        and64(TrustedImm64(~static_cast<uint64_t>(JSValue::NativeCalleeTag)), boxedGPR, calleeGPR);
        add64(TrustedImm64(lowestAccessibleAddress()), calleeGPR);
#else
        add32(TrustedImm32(lowestAccessibleAddress()), boxedGPR, calleeGPR);
#endif
    }

    void boxBooleanPayload(GPRReg boolGPR, GPRReg payloadGPR)
    {
#if USE(JSVALUE64)
        add32(TrustedImm32(JSValue::ValueFalse), boolGPR, payloadGPR);
#else
        move(boolGPR, payloadGPR);
#endif
    }

    void boxBooleanPayload(bool value, GPRReg payloadGPR)
    {
#if USE(JSVALUE64)
        move(TrustedImm32(JSValue::ValueFalse + value), payloadGPR);
#else
        move(TrustedImm32(value), payloadGPR);
#endif
    }

    void boxBoolean(GPRReg boolGPR, JSValueRegs boxedRegs)
    {
        boxBooleanPayload(boolGPR, boxedRegs.payloadGPR());
#if USE(JSVALUE32_64)
        move(TrustedImm32(JSValue::BooleanTag), boxedRegs.tagGPR());
#endif
    }

    void boxBoolean(bool value, JSValueRegs boxedRegs)
    {
        boxBooleanPayload(value, boxedRegs.payloadGPR());
#if USE(JSVALUE32_64)
        move(TrustedImm32(JSValue::BooleanTag), boxedRegs.tagGPR());
#endif
    }

    void boxInt32(GPRReg intGPR, JSValueRegs boxedRegs, TagRegistersMode mode = HaveTagRegisters)
    {
#if USE(JSVALUE64)
        if (mode == DoNotHaveTagRegisters)
            or64(TrustedImm64(JSValue::NumberTag), intGPR, boxedRegs.gpr());
        else
            or64(GPRInfo::numberTagRegister, intGPR, boxedRegs.gpr());
#else
        UNUSED_PARAM(mode);
        move(intGPR, boxedRegs.payloadGPR());
        move(TrustedImm32(JSValue::Int32Tag), boxedRegs.tagGPR());
#endif
    }

    void boxCell(GPRReg cellGPR, JSValueRegs boxedRegs)
    {
#if USE(JSVALUE64)
        move(cellGPR, boxedRegs.gpr());
#else
        move(cellGPR, boxedRegs.payloadGPR());
        move(TrustedImm32(JSValue::CellTag), boxedRegs.tagGPR());
#endif
    }

    void boxNativeCallee(GPRReg calleeGPR, GPRReg boxedGPR)
    {
#if USE(JSVALUE64)
#if CPU(ARM64)
        // NativeCallees are sometimes stored in ThreadSafeWeakOrStrongPtr, which relies on top byte ignore, so we need to strip the top byte on ARM64.
        and64(TrustedImm64(CalleeBits::nativeCalleeTopByteMask), calleeGPR);
#endif
        sub64(calleeGPR, TrustedImm64(lowestAccessibleAddress()), boxedGPR);
        or64(TrustedImm64(JSValue::NativeCalleeTag), boxedGPR);
#else
        sub32(calleeGPR, TrustedImm32(lowestAccessibleAddress()), boxedGPR);
#endif
    }

    void callExceptionFuzz(VM&, GPRReg exceptionReg);

    enum ExceptionCheckKind { NormalExceptionCheck, InvertedExceptionCheck };
    enum ExceptionJumpWidth { NormalJumpWidth, FarJumpWidth };
    JS_EXPORT_PRIVATE Jump emitExceptionCheck(VM&, ExceptionCheckKind = NormalExceptionCheck, ExceptionJumpWidth = NormalJumpWidth, GPRReg exceptionReg = InvalidGPRReg);
    JS_EXPORT_PRIVATE Jump emitNonPatchableExceptionCheck(VM&, GPRReg exceptionReg = InvalidGPRReg);
    Jump emitJumpIfException(VM&);

#if ENABLE(SAMPLING_COUNTERS)
    static void emitCount(MacroAssembler& jit, AbstractSamplingCounter& counter, int32_t increment = 1)
    {
        jit.add64(TrustedImm32(increment), AbsoluteAddress(counter.addressOfCounter()));
    }
    void emitCount(AbstractSamplingCounter& counter, int32_t increment = 1)
    {
        add64(TrustedImm32(increment), AbsoluteAddress(counter.addressOfCounter()));
    }
#endif

#if ENABLE(SAMPLING_FLAGS)
    void setSamplingFlag(int32_t);
    void clearSamplingFlag(int32_t flag);
#endif

    CodeBlock* baselineCodeBlockFor(const CodeOrigin& codeOrigin)
    {
        return baselineCodeBlockForOriginAndBaselineCodeBlock(codeOrigin, baselineCodeBlock());
    }
    
    CodeBlock* baselineCodeBlockFor(InlineCallFrame* inlineCallFrame)
    {
        if (!inlineCallFrame)
            return baselineCodeBlock();
        return baselineCodeBlockForInlineCallFrame(inlineCallFrame);
    }
    
    CodeBlock* baselineCodeBlock()
    {
        return m_baselineCodeBlock;
    }
    
    static VirtualRegister argumentsStart(InlineCallFrame* inlineCallFrame)
    {
        if (!inlineCallFrame)
            return VirtualRegister(CallFrame::argumentOffset(0));
        if (inlineCallFrame->m_argumentsWithFixup.size() <= 1)
            return virtualRegisterForLocal(0);
        ValueRecovery recovery = inlineCallFrame->m_argumentsWithFixup[1];
        RELEASE_ASSERT(recovery.technique() == DisplacedInJSStack);
        return recovery.virtualRegister();
    }
    
    static VirtualRegister argumentsStart(const CodeOrigin& codeOrigin)
    {
        return argumentsStart(codeOrigin.inlineCallFrame());
    }

    static VirtualRegister argumentCount(InlineCallFrame* inlineCallFrame)
    {
        ASSERT(!inlineCallFrame || inlineCallFrame->isVarargs());
        if (!inlineCallFrame)
            return CallFrameSlot::argumentCountIncludingThis;
        return inlineCallFrame->argumentCountRegister;
    }

    static VirtualRegister argumentCount(const CodeOrigin& codeOrigin)
    {
        return argumentCount(codeOrigin.inlineCallFrame());
    }
    
    void emitLoadStructure(RegisterID cell, RegisterID dest);
    void emitNonNullDecodeZeroExtendedStructureID(RegisterID source, RegisterID dest);
    void emitLoadStructure(VM&, RegisterID source, RegisterID dest);
    void emitLoadPrototype(VM&, GPRReg objectGPR, JSValueRegs resultRegs, JumpList& slowPath);
    void emitEncodeStructureID(RegisterID source, RegisterID dest);

    void emitStoreStructureWithTypeInfo(TrustedImmPtr structure, RegisterID dest, RegisterID)
    {
        emitStoreStructureWithTypeInfo(*this, structure, dest);
    }

    void emitStoreStructureWithTypeInfo(RegisterID structure, RegisterID dest, RegisterID scratch)
    {
        // Store the StructureID
#if USE(JSVALUE64)
        emitEncodeStructureID(structure, scratch);
        store32(scratch, MacroAssembler::Address(dest, JSCell::structureIDOffset()));
#else
        storePtr(structure, MacroAssembler::Address(dest, JSCell::structureIDOffset()));
#endif
        // Store all the info flags using a single 32-bit wide load and store.
        load32(MacroAssembler::Address(structure, Structure::indexingModeIncludingHistoryOffset()), scratch);
        store32(scratch, MacroAssembler::Address(dest, JSCell::indexingTypeAndMiscOffset()));
    }

    static void emitStoreStructureWithTypeInfo(AssemblyHelpers& jit, TrustedImmPtr structure, RegisterID dest);

    Jump barrierBranchWithoutFence(GPRReg cell)
    {
        return branch8(Above, Address(cell, JSCell::cellStateOffset()), TrustedImm32(blackThreshold));
    }

    Jump barrierBranchWithoutFence(JSCell* cell)
    {
        uint8_t* address = reinterpret_cast<uint8_t*>(cell) + JSCell::cellStateOffset();
        return branch8(Above, AbsoluteAddress(address), TrustedImm32(blackThreshold));
    }
    
    Jump barrierBranch(VM& vm, GPRReg cell, GPRReg scratchGPR)
    {
        load8(Address(cell, JSCell::cellStateOffset()), scratchGPR);
        return branch32(Above, scratchGPR, AbsoluteAddress(vm.heap.addressOfBarrierThreshold()));
    }

    Jump barrierBranch(VM& vm, JSCell* cell, GPRReg scratchGPR)
    {
        uint8_t* address = reinterpret_cast<uint8_t*>(cell) + JSCell::cellStateOffset();
        load8(address, scratchGPR);
        return branch32(Above, scratchGPR, AbsoluteAddress(vm.heap.addressOfBarrierThreshold()));
    }

    Jump branchIfBarriered(GPRReg vmGPR, GPRReg cellGPR, GPRReg scratchGPR)
    {
        load8(Address(cellGPR, JSCell::cellStateOffset()), scratchGPR);
        return branch32(BelowOrEqual, scratchGPR, Address(vmGPR, VM::offsetOfHeapBarrierThreshold()));
    }
    
    void barrierStoreLoadFence(VM& vm)
    {
        Jump ok = jumpIfMutatorFenceNotNeeded(vm);
        memoryFence();
        ok.link(this);
    }
    
    void mutatorFence(VM& vm)
    {
        if (isX86())
            return;
        Jump ok = jumpIfMutatorFenceNotNeeded(vm);
        storeFence();
        ok.link(this);
    }

    JS_EXPORT_PRIVATE void cage(Gigacage::Kind, GPRReg storage);
    // length may be the same register as scratch.
    JS_EXPORT_PRIVATE void cageConditionally(Gigacage::Kind, GPRReg storage, GPRReg length, GPRReg scratch);

    void emitComputeButterflyIndexingMask(GPRReg vectorLengthGPR, GPRReg scratchGPR, GPRReg resultGPR)
    {
        ASSERT(scratchGPR != resultGPR);
        Jump done;
        // If vectorLength == 0 then clz will return 32 on both ARM and x86. On 64-bit systems, we can then do a 64-bit right shift on a 32-bit -1 to get a 0 mask for zero vectorLength. On 32-bit ARM, shift masks with 0xff, which means it will still create a 0 mask.
        countLeadingZeros32(vectorLengthGPR, scratchGPR);
        move(TrustedImm32(-1), resultGPR);
        urshiftPtr(scratchGPR, resultGPR);
        if (done.isSet())
            done.link(this);
    }

    // If for whatever reason the butterfly is going to change vector length this function does NOT
    // update the indexing mask.
    void nukeStructureAndStoreButterfly(VM& vm, GPRReg butterfly, GPRReg object)
    {
        if (isX86()) {
            or32(TrustedImm32(std::bit_cast<int32_t>(StructureID::nukedStructureIDBit)), Address(object, JSCell::structureIDOffset()));
            storePtr(butterfly, Address(object, JSObject::butterflyOffset()));
            return;
        }

        Jump ok = jumpIfMutatorFenceNotNeeded(vm);
        or32(TrustedImm32(std::bit_cast<int32_t>(StructureID::nukedStructureIDBit)), Address(object, JSCell::structureIDOffset()));
        storeFence();
        storePtr(butterfly, Address(object, JSObject::butterflyOffset()));
        storeFence();
        Jump done = jump();
        ok.link(this);
        storePtr(butterfly, Address(object, JSObject::butterflyOffset()));
        done.link(this);
    }
    
    Jump jumpIfMutatorFenceNotNeeded(VM& vm)
    {
        return branchTest8(Zero, AbsoluteAddress(vm.heap.addressOfMutatorShouldBeFenced()));
    }
    
    // Emits the branch structure for typeof. The code emitted by this doesn't fall through. The
    // functor is called at those points where we have pinpointed a type. One way to use this is to
    // have the functor emit the code to put the type string into an appropriate register and then
    // jump out. A secondary functor is used for the call trap and masquerades-as-undefined slow
    // case. It is passed the unlinked jump to the slow case.
    template<typename Functor, typename SlowPathFunctor>
    void emitTypeOf(
        JSValueRegs regs, GPRReg tempGPR, const Functor& functor,
        const SlowPathFunctor& slowPathFunctor)
    {
        // Implements the following branching structure:
        //
        // if (is cell) {
        //     if (is object) {
        //         if (is function) {
        //             return function;
        //         } else if (doesn't have call trap and doesn't masquerade as undefined) {
        //             return object
        //         } else {
        //             return slowPath();
        //         }
        //     } else if (is string) {
        //         return string
        //     } else if (is heapbigint) {
        //         return bigint
        //     } else {
        //         return symbol
        //     }
        // } else if (is number) {
        //     return number
        // } else if (is null) {
        //     return object
        // } else if (is boolean) {
        //     return boolean
        // } else if (is bigint32) {
        //     return bigint
        // } else {
        //     return undefined
        // }
        //
        // FIXME: typeof Symbol should be more frequently seen than BigInt.
        // We should change the order of type detection based on this frequency.
        // https://bugs.webkit.org/show_bug.cgi?id=192650
        
        Jump notCell = branchIfNotCell(regs);
        
        GPRReg cellGPR = regs.payloadGPR();
        Jump notObject = branchIfNotObject(cellGPR);
        
        Jump notFunction = branchIfNotFunction(cellGPR);
        functor(TypeofType::Function, false);
        
        notFunction.link(this);
        slowPathFunctor(
            branchTest8(
                NonZero,
                Address(cellGPR, JSCell::typeInfoFlagsOffset()),
                TrustedImm32(MasqueradesAsUndefined | OverridesGetCallData)));
        functor(TypeofType::Object, false);
        
        notObject.link(this);
        
        Jump notString = branchIfNotString(cellGPR);
        functor(TypeofType::String, false);

        notString.link(this);

        Jump notHeapBigInt = branchIfNotHeapBigInt(cellGPR);
        functor(TypeofType::BigInt, false);

        notHeapBigInt.link(this);
        functor(TypeofType::Symbol, false);
        
        notCell.link(this);

        Jump notNumber = branchIfNotNumber(regs, tempGPR);
        functor(TypeofType::Number, false);
        notNumber.link(this);
        
        JumpList notNull = branchIfNotEqual(regs, jsNull());
        functor(TypeofType::Object, false);
        notNull.link(this);
        
        Jump notBoolean = branchIfNotBoolean(regs, tempGPR);
        functor(TypeofType::Boolean, false);
        notBoolean.link(this);

#if USE(BIGINT32)
        Jump notBigInt32 = branchIfNotBigInt32(regs, tempGPR);
        functor(TypeofType::BigInt, false);
        notBigInt32.link(this);
#endif
        
        functor(TypeofType::Undefined, true);
    }
    
    void emitVirtualCall(VM&, CallLinkInfo*);
    void emitVirtualCallWithoutMovingGlobalObject(VM&, GPRReg callLinkInfoGPR, CallMode);
    
    void makeSpaceOnStackForCCall();
    void reclaimSpaceOnStackForCCall();

#if USE(JSVALUE64)
    void emitRandomThunk(JSGlobalObject*, GPRReg scratch0, GPRReg scratch1, GPRReg scratch2, FPRReg result);
    void emitRandomThunk(VM&, GPRReg scratch0, GPRReg scratch1, GPRReg scratch2, GPRReg scratch3, FPRReg result);
#endif

    // Call this if you know that the value held in allocatorGPR is non-null. This DOES NOT mean
    // that allocator is non-null; allocator can be null as a signal that we don't know what the
    // value of allocatorGPR is. Additionally, if the allocator is not null, then there is no need
    // to populate allocatorGPR - this code will ignore the contents of allocatorGPR.
    enum class SlowAllocationResult : uint8_t {
        ClearToNull,
        UndefinedBehavior,
    };
    void emitAllocateWithNonNullAllocator(GPRReg resultGPR, const JITAllocator&, GPRReg allocatorGPR, GPRReg scratchGPR, JumpList& slowPath, SlowAllocationResult = SlowAllocationResult::ClearToNull);
    
    void emitAllocate(GPRReg resultGPR, const JITAllocator&, GPRReg allocatorGPR, GPRReg scratchGPR, JumpList& slowPath, SlowAllocationResult = SlowAllocationResult::ClearToNull);
    
    template<typename StructureType>
    void emitAllocateJSCell(GPRReg resultGPR, const JITAllocator& allocator, GPRReg allocatorGPR, StructureType structure, GPRReg scratchGPR, JumpList& slowPath, SlowAllocationResult slowAllocationResult = SlowAllocationResult::ClearToNull)
    {
        emitAllocate(resultGPR, allocator, allocatorGPR, scratchGPR, slowPath, slowAllocationResult);
        emitStoreStructureWithTypeInfo(structure, resultGPR, scratchGPR);
    }
    
    template<typename StructureType, typename StorageType>
    void emitAllocateJSObject(GPRReg resultGPR, const JITAllocator& allocator, GPRReg allocatorGPR, StructureType structure, StorageType storage, GPRReg scratchGPR, JumpList& slowPath, SlowAllocationResult slowAllocationResult = SlowAllocationResult::ClearToNull)
    {
        emitAllocateJSCell(resultGPR, allocator, allocatorGPR, structure, scratchGPR, slowPath, slowAllocationResult);
        storePtr(storage, Address(resultGPR, JSObject::butterflyOffset()));
    }
    
    template<typename ClassType, typename StructureType, typename StorageType>
    void emitAllocateJSObjectWithKnownSize(
        VM& vm, GPRReg resultGPR, StructureType structure, StorageType storage, GPRReg scratchGPR1,
        GPRReg scratchGPR2, JumpList& slowPath, size_t size, SlowAllocationResult slowAllocationResult = SlowAllocationResult::ClearToNull)
    {
        Allocator allocator = allocatorForConcurrently<ClassType>(vm, size, AllocatorForMode::AllocatorIfExists);
        emitAllocateJSObject(resultGPR, JITAllocator::constant(allocator), scratchGPR1, structure, storage, scratchGPR2, slowPath, slowAllocationResult);
    }
    
    template<typename ClassType, typename StructureType, typename StorageType>
    void emitAllocateJSObject(VM& vm, GPRReg resultGPR, StructureType structure, StorageType storage, GPRReg scratchGPR1, GPRReg scratchGPR2, JumpList& slowPath, SlowAllocationResult slowAllocationResult = SlowAllocationResult::ClearToNull)
    {
        emitAllocateJSObjectWithKnownSize<ClassType>(vm, resultGPR, structure, storage, scratchGPR1, scratchGPR2, slowPath, ClassType::allocationSize(0), slowAllocationResult);
    }
    
    // allocationSize can be aliased with any of the other input GPRs. If it's not aliased then it
    // won't be clobbered.
    void emitAllocateVariableSized(GPRReg resultGPR, CompleteSubspace&, GPRReg allocationSize, GPRReg scratchGPR1, GPRReg scratchGPR2, JumpList& slowPath, SlowAllocationResult = SlowAllocationResult::ClearToNull);
    
    template<typename ClassType, typename StructureType>
    void emitAllocateVariableSizedCell(VM& vm, GPRReg resultGPR, StructureType structure, GPRReg allocationSize, GPRReg scratchGPR1, GPRReg scratchGPR2, JumpList& slowPath, SlowAllocationResult slowAllocationResult = SlowAllocationResult::ClearToNull)
    {
        CompleteSubspace* subspace = subspaceForConcurrently<ClassType>(vm);
        RELEASE_ASSERT_WITH_MESSAGE(subspace, "CompleteSubspace is always allocated");
        emitAllocateVariableSized(resultGPR, *subspace, allocationSize, scratchGPR1, scratchGPR2, slowPath, slowAllocationResult);
        emitStoreStructureWithTypeInfo(structure, resultGPR, scratchGPR2);
    }

    template<typename ClassType, typename StructureType>
    void emitAllocateVariableSizedJSObject(VM& vm, GPRReg resultGPR, StructureType structure, GPRReg allocationSize, GPRReg scratchGPR1, GPRReg scratchGPR2, JumpList& slowPath, SlowAllocationResult slowAllocationResult = SlowAllocationResult::ClearToNull)
    {
        emitAllocateVariableSizedCell<ClassType>(vm, resultGPR, structure, allocationSize, scratchGPR1, scratchGPR2, slowPath, slowAllocationResult);
        storePtr(TrustedImmPtr(nullptr), Address(resultGPR, JSObject::butterflyOffset()));
    }

    enum LazyGlobalObjectLoadTag { LazyBaselineGlobalObject };
    JumpList branchIfValue(VM&, JSValueRegs, GPRReg scratch, GPRReg scratchIfShouldCheckMasqueradesAsUndefined, FPRReg, FPRReg, bool shouldCheckMasqueradesAsUndefined, std::variant<JSGlobalObject*, GPRReg, LazyGlobalObjectLoadTag>, bool negateResult);
    JumpList branchIfTruthy(VM& vm, JSValueRegs value, GPRReg scratch, GPRReg scratchIfShouldCheckMasqueradesAsUndefined, FPRReg scratchFPR0, FPRReg scratchFPR1, bool shouldCheckMasqueradesAsUndefined, std::variant<JSGlobalObject*, GPRReg, LazyGlobalObjectLoadTag> globalObject)
    {
        return branchIfValue(vm, value, scratch, scratchIfShouldCheckMasqueradesAsUndefined, scratchFPR0, scratchFPR1, shouldCheckMasqueradesAsUndefined, globalObject, false);
    }
    JumpList branchIfFalsey(VM& vm, JSValueRegs value, GPRReg scratch, GPRReg scratchIfShouldCheckMasqueradesAsUndefined, FPRReg scratchFPR0, FPRReg scratchFPR1, bool shouldCheckMasqueradesAsUndefined, std::variant<JSGlobalObject*, GPRReg, LazyGlobalObjectLoadTag> globalObject)
    {
        return branchIfValue(vm, value, scratch, scratchIfShouldCheckMasqueradesAsUndefined, scratchFPR0, scratchFPR1, shouldCheckMasqueradesAsUndefined, globalObject, true);
    }
    void emitConvertValueToBoolean(VM&, JSValueRegs, GPRReg result, GPRReg scratchIfShouldCheckMasqueradesAsUndefined, FPRReg, FPRReg, bool shouldCheckMasqueradesAsUndefined, JSGlobalObject*, bool negateResult = false);
    
    void emitInitializeInlineStorage(GPRReg baseGPR, unsigned inlineCapacity, GPRReg scratchGPR)
    {
        ptrdiff_t initialOffset = JSObject::offsetOfInlineStorage();
        emitFillStorageWithJSEmpty(baseGPR, initialOffset, inlineCapacity, scratchGPR);
    }

    void emitInitializeInlineStorage(GPRReg baseGPR, GPRReg inlineCapacity)
    {
        Jump empty = branchTest32(Zero, inlineCapacity);
        Label loop = label();
        sub32(TrustedImm32(1), inlineCapacity);
        storeTrustedValue(JSValue(), BaseIndex(baseGPR, inlineCapacity, TimesEight, JSObject::offsetOfInlineStorage()));
        branchTest32(NonZero, inlineCapacity).linkTo(loop, this);
        empty.link(this);
    }

    void emitInitializeOutOfLineStorage(GPRReg butterflyGPR, unsigned outOfLineCapacity, GPRReg scratchGPR)
    {
        ptrdiff_t initialOffset = -sizeof(IndexingHeader) - outOfLineCapacity * sizeof(EncodedJSValue);
        emitFillStorageWithJSEmpty(butterflyGPR, initialOffset, outOfLineCapacity, scratchGPR);
    }

    void loadCompactPtr(Address address, GPRReg dest)
    {
#if HAVE(36BIT_ADDRESS)
        load32(address, dest);
        lshift64(TrustedImm32(4), dest);
#else
        loadPtr(address, dest);
#endif
    }

    Jump branchCompactPtr(RelationalCondition cond, GPRReg left, Address right, GPRReg scratch)
    {
#if HAVE(36BIT_ADDRESS)
        ASSERT(left != scratch);
        load32(right, scratch);
        lshift64(TrustedImm32(4), scratch);
        return branchPtr(cond, left, Address(scratch));
#else
        UNUSED_PARAM(scratch);
        return branchPtr(cond, left, right);
#endif
    }

#if USE(JSVALUE64)
    void wangsInt64Hash(GPRReg inputAndResult, GPRReg scratch);
#endif

#if ENABLE(WEBASSEMBLY)
    void storeWasmContextInstance(GPRReg src);
#endif

    void emitFillStorageWithJSEmpty(GPRReg baseGPR, ptrdiff_t initialOffset, unsigned count, GPRReg scratchGPR)
    {
        if (!count)
            return;
#if USE(JSVALUE64)
        unsigned pairCount = count >> 1;
        unsigned pairIndex = 0;
        ASSERT(JSValue::encode(JSValue()) == 0);
#if CPU(ARM64)
        UNUSED_PARAM(scratchGPR);
        GPRReg emptyValueGPR = ARM64Registers::zr;
#else
        GPRReg emptyValueGPR = scratchGPR;
        move(TrustedImm32(0), scratchGPR);
#endif
        for (; pairIndex < pairCount; ++pairIndex)
            storePair64(emptyValueGPR, emptyValueGPR, baseGPR, TrustedImm32(initialOffset + pairIndex * 2 * sizeof(EncodedJSValue)));
        if (count & 1)
            store64(emptyValueGPR, Address(baseGPR, initialOffset + pairIndex * 2 * sizeof(EncodedJSValue)));
#else
        UNUSED_PARAM(scratchGPR);
        for (unsigned i = 0; i < count; ++i)
            storeTrustedValue(JSValue(), Address(baseGPR, initialOffset + i * sizeof(EncodedJSValue)));
#endif
    }

    void emitFillStorageWithDoubleEmpty(GPRReg baseGPR, ptrdiff_t initialOffset, unsigned count, GPRReg scratchGPR)
    {
#if USE(JSVALUE64)
        unsigned pairCount = count >> 1;
        unsigned pairIndex = 0;
        move(TrustedImm64(std::bit_cast<int64_t>(PNaN)), scratchGPR);
        for (; pairIndex < pairCount; ++pairIndex)
            storePair64(scratchGPR, scratchGPR, baseGPR, TrustedImm32(initialOffset + pairIndex * 2 * sizeof(double)));
        if (count & 1)
            store64(scratchGPR, Address(baseGPR, initialOffset + pairIndex * 2 * sizeof(double)));
#else
        UNUSED_PARAM(scratchGPR);
        for (unsigned i = 0; i < count; ++i)
            storeTrustedValue(JSValue(JSValue::EncodeAsDouble, PNaN), Address(baseGPR, initialOffset + i * sizeof(double)));
#endif
    }

#if ENABLE(WEBASSEMBLY)
#if CPU(ARM64) || CPU(X86_64) || CPU(RISCV64) || CPU(ARM_THUMB2)
    JumpList checkWasmStackOverflow(GPRReg instanceGPR, TrustedImm32, GPRReg framePointerGPR);
#endif
#endif

protected:
    void copyCalleeSavesToEntryFrameCalleeSavesBufferImpl(GPRReg calleeSavesBuffer);

    enum class TypedArrayField { Length, ByteLength };
    void loadTypedArrayByteLengthImpl(GPRReg baseGPR, GPRReg valueGPR, GPRReg scratchGPR, GPRReg scratch2GPR, std::optional<TypedArrayType>, TypedArrayField);

    CodeBlock* const m_codeBlock;
    CodeBlock* const m_baselineCodeBlock;
};

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END

#endif // ENABLE(JIT)
