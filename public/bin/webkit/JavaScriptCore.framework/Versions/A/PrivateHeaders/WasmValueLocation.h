/*
 * Copyright (C) 2015-2023 Apple Inc. All rights reserved.
 * Copyright (C) 2021 Igalia S.L. All rights reserved.
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

#if ENABLE(WEBASSEMBLY)

#include "FPRInfo.h"
#include "GPRInfo.h"
#include "Reg.h"
#include <wtf/PrintStream.h>
#include <wtf/TZoneMalloc.h>

namespace JSC {

namespace Wasm {

class ValueLocation {
    WTF_MAKE_TZONE_ALLOCATED(ValueLocation);
public:
    enum Kind : uint8_t {
        GPRRegister,
        FPRRegister,
        Stack,
        StackArgument,
    };

    ValueLocation()
        : m_kind(GPRRegister)
    {
    }

    explicit ValueLocation(JSValueRegs regs)
        : m_kind(GPRRegister)
    {
        u.jsr = regs;
    }

    explicit ValueLocation(FPRReg reg)
        : m_kind(FPRRegister)
    {
        u.fpr = reg;
    }

    static ValueLocation stack(intptr_t offsetFromFP)
    {
        ValueLocation result;
        result.m_kind = Stack;
        result.u.offsetFromFP = offsetFromFP;
        return result;
    }

    static ValueLocation stackArgument(intptr_t offsetFromSP)
    {
        ValueLocation result;
        result.m_kind = StackArgument;
        result.u.offsetFromSP = offsetFromSP;
        return result;
    }

    Kind kind() const { return m_kind; }

    bool isGPR() const { return kind() == GPRRegister; }
    bool isFPR() const { return kind() == FPRRegister; }
    bool isStack() const { return kind() == Stack; }
    bool isStackArgument() const { return kind() == StackArgument; }

    JSValueRegs jsr() const
    {
        ASSERT(isGPR());
        return u.jsr;
    }

    FPRReg fpr() const
    {
        ASSERT(isFPR());
        return u.fpr;
    }

    intptr_t offsetFromFP() const
    {
        ASSERT(isStack());
        return u.offsetFromFP;
    }

    intptr_t offsetFromSP() const
    {
        ASSERT(isStackArgument());
        return u.offsetFromSP;
    }

    JS_EXPORT_PRIVATE void dump(PrintStream&) const;

private:
    union U {
        JSValueRegs jsr;
        FPRReg fpr;
        intptr_t offsetFromFP;
        intptr_t offsetFromSP;

        U()
        {
            memset(static_cast<void*>(this), 0, sizeof(*this));
        }
    } u;
    Kind m_kind;
};

} } // namespace JSC::Wasm

namespace WTF {

void printInternal(PrintStream&, JSC::Wasm::ValueLocation::Kind);

} // namespace WTF

#endif // ENABLE(WEBASSEMBLY)
