/*
 * Copyright (C) 2010-2022 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "BytecodeConventions.h"
#include "CCallHelpers.h"
#include "FPRInfo.h"
#include "GPRInfo.h"
#include "JSCJSValue.h"
#include "JSString.h"
#include "MacroAssembler.h"
#include <wtf/TZoneMalloc.h>

#if ENABLE(JIT)

namespace JSC {
    class JSInterfaceJIT : public CCallHelpers, public GPRInfo, public JSRInfo, public FPRInfo {
        WTF_MAKE_TZONE_ALLOCATED(JSInterfaceJIT);
    public:

        JSInterfaceJIT(VM* vm = nullptr, CodeBlock* codeBlock = nullptr)
            : CCallHelpers(codeBlock)
            , m_vm(vm)
        {
        }

        inline Jump emitLoadJSCell(VirtualRegister, RegisterID payload);
        inline Jump emitLoadInt32(VirtualRegister, RegisterID dst);
        inline Jump emitLoadDouble(VirtualRegister, FPRegisterID dst, RegisterID scratch);

        inline void emitLoadJSValue(VirtualRegister, JSValueRegs dst);

        VM* vm() const { return m_vm; }

        VM* const m_vm;
    };

#if USE(JSVALUE32_64)
    inline JSInterfaceJIT::Jump JSInterfaceJIT::emitLoadJSCell(VirtualRegister virtualRegister, RegisterID payload)
    {
        ASSERT(virtualRegister < VirtualRegister(FirstConstantRegisterIndex));
        loadPtr(payloadFor(virtualRegister), payload);
        return branchIfNotCell(tagFor(virtualRegister));
    }

    inline JSInterfaceJIT::Jump JSInterfaceJIT::emitLoadInt32(VirtualRegister virtualRegister, RegisterID dst)
    {
        ASSERT(virtualRegister < VirtualRegister(FirstConstantRegisterIndex));
        loadPtr(payloadFor(virtualRegister), dst);
        return branch32(NotEqual, tagFor(virtualRegister), TrustedImm32(JSValue::Int32Tag));
    }

    inline JSInterfaceJIT::Jump JSInterfaceJIT::emitLoadDouble(VirtualRegister virtualRegister, FPRegisterID dst, RegisterID scratch)
    {
        ASSERT(virtualRegister < VirtualRegister(FirstConstantRegisterIndex));
        loadPtr(tagFor(virtualRegister), scratch);
        Jump isDouble = branch32(Below, scratch, TrustedImm32(JSValue::LowestTag));
        Jump notInt = branch32(NotEqual, scratch, TrustedImm32(JSValue::Int32Tag));
        loadPtr(payloadFor(virtualRegister), scratch);
        convertInt32ToDouble(scratch, dst);
        Jump done = jump();
        isDouble.link(this);
        loadDouble(addressFor(virtualRegister), dst);
        done.link(this);
        return notInt;
    }
#elif USE(JSVALUE64)
    inline JSInterfaceJIT::Jump JSInterfaceJIT::emitLoadJSCell(VirtualRegister virtualRegister, RegisterID dst)
    {
        load64(addressFor(virtualRegister), dst);
        return branchIfNotCell(dst);
    }

    inline JSInterfaceJIT::Jump JSInterfaceJIT::emitLoadInt32(VirtualRegister virtualRegister, RegisterID dst)
    {
        load64(addressFor(virtualRegister), dst);
        Jump notInt32 = branchIfNotInt32(dst);
        zeroExtend32ToWord(dst, dst);
        return notInt32;
    }

    inline JSInterfaceJIT::Jump JSInterfaceJIT::emitLoadDouble(VirtualRegister virtualRegister, FPRegisterID dst, RegisterID scratch)
    {
        load64(addressFor(virtualRegister), scratch);
        Jump notNumber = branchIfNotNumber(scratch);
        Jump notInt = branchIfNotInt32(scratch);
        convertInt32ToDouble(scratch, dst);
        Jump done = jump();
        notInt.link(this);
        unboxDouble(scratch, scratch, dst);
        done.link(this);
        return notNumber;
    }
#endif

inline void JSInterfaceJIT::emitLoadJSValue(VirtualRegister virtualRegister, JSValueRegs dst)
{
    loadValue(addressFor(virtualRegister), dst);
}

} // namespace JSC

#endif // ENABLE(JIT)
