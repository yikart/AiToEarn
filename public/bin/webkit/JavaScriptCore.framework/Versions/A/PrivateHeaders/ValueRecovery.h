/*
 * Copyright (C) 2011-2019 Apple Inc. All rights reserved.
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

#include "DFGMinifiedID.h"
#include "DataFormat.h"
#if ENABLE(JIT)
#include "GPRInfo.h"
#include "FPRInfo.h"
#include "Reg.h"
#endif
#include "JSCJSValue.h"
#include "MacroAssembler.h"
#include "VirtualRegister.h"

namespace JSC {

struct DumpContext;
struct InlineCallFrame;

// Describes how to recover a given bytecode virtual register at a given
// code point.
enum ValueRecoveryTechnique : uint8_t {
    // It's in a register.
    InGPR,
    UnboxedInt32InGPR,
    UnboxedInt52InGPR,
    UnboxedStrictInt52InGPR,
    UnboxedBooleanInGPR,
    UnboxedCellInGPR,
#if USE(JSVALUE32_64)
    InPair,
#endif
    InFPR,
    UnboxedDoubleInFPR,
    // It's in the stack, but at a different location.
    DisplacedInJSStack,
    // It's in the stack, at a different location, and it's unboxed.
    Int32DisplacedInJSStack,
#if USE(JSVALUE32_64)
    Int32TagDisplacedInJSStack, // int32 stored in tag field
#endif
    Int52DisplacedInJSStack,
    StrictInt52DisplacedInJSStack,
    DoubleDisplacedInJSStack,
    CellDisplacedInJSStack,
    BooleanDisplacedInJSStack,
    // It's an Arguments object. This arises because of the simplified arguments simplification done by the DFG.
    DirectArgumentsThatWereNotCreated,
    ClonedArgumentsThatWereNotCreated,
    // It's a constant.
    Constant,
    // Don't know how to recover it.
    DontKnow
};

class ValueRecovery {
public:
    ValueRecovery()
        : m_technique(DontKnow)
    {
    }
    
    bool isSet() const { return m_technique != DontKnow; }
    bool operator!() const { return !isSet(); }

#if ENABLE(JIT)
    static ValueRecovery inRegister(Reg reg, DataFormat dataFormat)
    {
        if (reg.isGPR())
            return inGPR(reg.gpr(), dataFormat);

        ASSERT(reg.isFPR());
        return inFPR(reg.fpr(), dataFormat);
    }
#endif

    explicit operator bool() const { return isSet(); }
    
    static ValueRecovery inGPR(MacroAssembler::RegisterID gpr, DataFormat dataFormat)
    {
        ASSERT(dataFormat != DataFormatNone);
#if USE(JSVALUE32_64)
        ASSERT(dataFormat == DataFormatInt32 || dataFormat == DataFormatCell || dataFormat == DataFormatBoolean);
#endif
        ValueRecovery result;
        if (dataFormat == DataFormatInt32)
            result.m_technique = UnboxedInt32InGPR;
        else if (dataFormat == DataFormatInt52)
            result.m_technique = UnboxedInt52InGPR;
        else if (dataFormat == DataFormatStrictInt52)
            result.m_technique = UnboxedStrictInt52InGPR;
        else if (dataFormat == DataFormatBoolean)
            result.m_technique = UnboxedBooleanInGPR;
        else if (dataFormat == DataFormatCell)
            result.m_technique = UnboxedCellInGPR;
        else
            result.m_technique = InGPR;
        UnionType u;
        u.gpr = gpr;
        result.m_source = WTFMove(u);
        return result;
    }
    
#if USE(JSVALUE32_64)
    static ValueRecovery inPair(MacroAssembler::RegisterID tagGPR, MacroAssembler::RegisterID payloadGPR)
    {
        ValueRecovery result;
        result.m_technique = InPair;
        UnionType u;
        u.pair.tagGPR = tagGPR;
        u.pair.payloadGPR = payloadGPR;
        result.m_source = WTFMove(u);
        return result;
    }
#endif

    static ValueRecovery inFPR(MacroAssembler::FPRegisterID fpr, DataFormat dataFormat)
    {
        ASSERT(dataFormat == DataFormatDouble || dataFormat & DataFormatJS);
        ValueRecovery result;
        if (dataFormat == DataFormatDouble)
            result.m_technique = UnboxedDoubleInFPR;
        else
            result.m_technique = InFPR;
        UnionType u;
        u.fpr = fpr;
        result.m_source = WTFMove(u);
        return result;
    }
    
    static ValueRecovery displacedInJSStack(VirtualRegister virtualReg, DataFormat dataFormat)
    {
        ValueRecovery result;
        switch (dataFormat) {
        case DataFormatInt32:
            result.m_technique = Int32DisplacedInJSStack;
            break;
            
        case DataFormatInt52:
            result.m_technique = Int52DisplacedInJSStack;
            break;
            
        case DataFormatStrictInt52:
            result.m_technique = StrictInt52DisplacedInJSStack;
            break;
            
        case DataFormatDouble:
            result.m_technique = DoubleDisplacedInJSStack;
            break;

        case DataFormatCell:
            result.m_technique = CellDisplacedInJSStack;
            break;
            
        case DataFormatBoolean:
            result.m_technique = BooleanDisplacedInJSStack;
            break;
            
        default:
            ASSERT(dataFormat != DataFormatNone && dataFormat != DataFormatStorage);
            result.m_technique = DisplacedInJSStack;
            break;
        }
        UnionType u;
        u.virtualReg = virtualReg.offset();
        result.m_source = WTFMove(u);
        return result;
    }

#if USE(JSVALUE32_64)
    static ValueRecovery calleeSaveGPRDisplacedInJSStack(VirtualRegister virtualReg, bool inTag)
    {
        ValueRecovery result;
        UnionType u;
        u.virtualReg = virtualReg.offset();
        result.m_source = WTFMove(u);
        result.m_technique = inTag ? Int32TagDisplacedInJSStack : Int32DisplacedInJSStack;
        return result;
    }
#endif

    static ValueRecovery constant(JSValue value)
    {
        ValueRecovery result;
        result.m_technique = Constant;
        UnionType u;
        u.constant = JSValue::encode(value);
        result.m_source = WTFMove(u);
        return result;
    }
    
    static ValueRecovery directArgumentsThatWereNotCreated(DFG::MinifiedID id)
    {
        ValueRecovery result;
        result.m_technique = DirectArgumentsThatWereNotCreated;
        UnionType u;
        u.nodeID = id.bits();
        result.m_source = WTFMove(u);
        return result;
    }
    
    static ValueRecovery clonedArgumentsThatWereNotCreated(DFG::MinifiedID id)
    {
        ValueRecovery result;
        result.m_technique = ClonedArgumentsThatWereNotCreated;
        UnionType u;
        u.nodeID = id.bits();
        result.m_source = WTFMove(u);
        return result;
    }

    ValueRecoveryTechnique technique() const { return m_technique; }
    
    bool isConstant() const { return m_technique == Constant; }

    bool isInGPR() const
    {
        switch (m_technique) {
        case InGPR:
        case UnboxedInt32InGPR:
        case UnboxedBooleanInGPR:
        case UnboxedCellInGPR:
        case UnboxedInt52InGPR:
        case UnboxedStrictInt52InGPR:
            return true;
        default:
            return false;
        }
    }

    bool isInFPR() const
    {
        switch (m_technique) {
        case InFPR:
        case UnboxedDoubleInFPR:
            return true;
        default:
            return false;
        }
    }

    bool isInRegisters() const
    {
        return isInJSValueRegs() || isInGPR() || isInFPR();
    }

    bool isInJSStack() const
    {
        switch (m_technique) {
        case DisplacedInJSStack:
        case Int32DisplacedInJSStack:
#if USE(JSVALUE32_64)
        case Int32TagDisplacedInJSStack:
#endif
        case Int52DisplacedInJSStack:
        case StrictInt52DisplacedInJSStack:
        case DoubleDisplacedInJSStack:
        case CellDisplacedInJSStack:
        case BooleanDisplacedInJSStack:
            return true;
        default:
            return false;
        }
    }

    DataFormat dataFormat() const
    {
        switch (m_technique) {
        case InGPR:
        case InFPR:
        case DisplacedInJSStack:
        case Constant:
#if USE(JSVALUE32_64)
        case InPair:
#endif
            return DataFormatJS;
        case UnboxedInt32InGPR:
        case Int32DisplacedInJSStack:
#if USE(JSVALUE32_64)
        case Int32TagDisplacedInJSStack:
#endif
            return DataFormatInt32;
        case UnboxedInt52InGPR:
        case Int52DisplacedInJSStack:
            return DataFormatInt52;
        case UnboxedStrictInt52InGPR:
        case StrictInt52DisplacedInJSStack:
            return DataFormatStrictInt52;
        case UnboxedBooleanInGPR:
        case BooleanDisplacedInJSStack:
            return DataFormatBoolean;
        case UnboxedCellInGPR:
        case CellDisplacedInJSStack:
            return DataFormatCell;
        case UnboxedDoubleInFPR:
        case DoubleDisplacedInJSStack:
            return DataFormatDouble;
        default:
            return DataFormatNone;
        }
    }
    
    MacroAssembler::RegisterID gpr() const
    {
        ASSERT(isInGPR());
        return m_source.get().gpr;
    }
    
#if USE(JSVALUE32_64)
    MacroAssembler::RegisterID tagGPR() const
    {
        ASSERT(m_technique == InPair);
        return m_source.get().pair.tagGPR;
    }
    
    MacroAssembler::RegisterID payloadGPR() const
    {
        ASSERT(m_technique == InPair);
        return m_source.get().pair.payloadGPR;
    }

    bool isInJSValueRegs() const
    {
        return m_technique == InPair;
    }

#if ENABLE(JIT)
    JSValueRegs jsValueRegs() const
    {
        ASSERT(isInJSValueRegs());
        return JSValueRegs(tagGPR(), payloadGPR());
    }
#endif // ENABLE(JIT)
#else
    bool isInJSValueRegs() const
    {
        return isInGPR();
    }
#endif // USE(JSVALUE32_64)
    
    MacroAssembler::FPRegisterID fpr() const
    {
        ASSERT(isInFPR());
        return m_source.get().fpr;
    }
    
    VirtualRegister virtualRegister() const
    {
        ASSERT(isInJSStack());
        return VirtualRegister(m_source.get().virtualReg);
    }
    
    ValueRecovery withLocalsOffset(int offset) const
    {
        switch (m_technique) {
        case DisplacedInJSStack:
        case Int32DisplacedInJSStack:
#if USE(JSVALUE32_64)
        case Int32TagDisplacedInJSStack:
#endif
        case DoubleDisplacedInJSStack:
        case CellDisplacedInJSStack:
        case BooleanDisplacedInJSStack:
        case Int52DisplacedInJSStack:
        case StrictInt52DisplacedInJSStack: {
            ValueRecovery result;
            result.m_technique = m_technique;
            UnionType u;
            u.virtualReg = m_source.get().virtualReg + offset;
            result.m_source = WTFMove(u);
            return result;
        }
            
        default:
            return *this;
        }
    }
    
    JSValue constant() const
    {
        ASSERT(isConstant());
        return JSValue::decode(m_source.get().constant);
    }
    
    DFG::MinifiedID nodeID() const
    {
        ASSERT(m_technique == DirectArgumentsThatWereNotCreated || m_technique == ClonedArgumentsThatWereNotCreated);
        return DFG::MinifiedID::fromBits(m_source.get().nodeID);
    }
    
    JSValue recover(CallFrame*) const;
    
#if ENABLE(JIT)
    template<typename Func>
    void forEachReg(const Func& func)
    {
        switch (m_technique) {
        case InGPR:
        case UnboxedInt32InGPR:
        case UnboxedBooleanInGPR:
        case UnboxedCellInGPR:
        case UnboxedInt52InGPR:
        case UnboxedStrictInt52InGPR:
            func(gpr());
            return;
        case InFPR:
        case UnboxedDoubleInFPR:
            func(fpr());
            return;
#if USE(JSVALUE32_64)
        case InPair:
            func(jsValueRegs().payloadGPR());
            func(jsValueRegs().tagGPR());
            return;
#endif
        default:
            return;
        }
    }
    
    void dumpInContext(PrintStream& out, DumpContext* context) const;
    void dump(PrintStream& out) const;
#endif

private:
    ValueRecoveryTechnique m_technique;
    union UnionType {
        MacroAssembler::RegisterID gpr;
        MacroAssembler::FPRegisterID fpr;
#if USE(JSVALUE32_64)
        struct {
            MacroAssembler::RegisterID tagGPR;
            MacroAssembler::RegisterID payloadGPR;
        } pair;
#endif
        int virtualReg;
        EncodedJSValue constant;
        unsigned nodeID;
    };
    Packed<UnionType> m_source;
};
static_assert(alignof(ValueRecovery) == 1);

} // namespace JSC
