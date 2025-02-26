/*
 * Copyright (C) 2016 Apple Inc. All rights reserved.
 * Copyright (C) 2017 Yusuke Suzuki <utatane.tea@gmail.com>.
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

#include "CCallHelpers.h"
#include "SnippetReg.h"
#include "SnippetSlowPathCalls.h"

namespace JSC {

class SnippetParams {
WTF_MAKE_NONCOPYABLE(SnippetParams);
public:
    virtual ~SnippetParams() { }

    class Value {
    public:
        Value(SnippetReg reg)
            : m_reg(reg)
        {
        }

        Value(SnippetReg reg, JSValue value)
            : m_reg(reg)
            , m_value(value)
        {
        }

        bool isGPR() const { return m_reg.isGPR(); }
        bool isFPR() const { return m_reg.isFPR(); }
        bool isJSValueRegs() const { return m_reg.isJSValueRegs(); }
        GPRReg gpr() const { return m_reg.gpr(); }
        FPRReg fpr() const { return m_reg.fpr(); }
        JSValueRegs jsValueRegs() const { return m_reg.jsValueRegs(); }

        SnippetReg reg() const
        {
            return m_reg;
        }

        JSValue value() const
        {
            return m_value;
        }

    private:
        SnippetReg m_reg;
        JSValue m_value;
    };

    unsigned size() const { return m_regs.size(); }
    const Value& at(unsigned index) const { return m_regs[index]; }
    const Value& operator[](unsigned index) const { return at(index); }

    GPRReg gpScratch(unsigned index) const { return m_gpScratch[index]; }
    FPRReg fpScratch(unsigned index) const { return m_fpScratch[index]; }

    SnippetParams(VM& vm, Vector<Value>&& regs, Vector<GPRReg>&& gpScratch, Vector<FPRReg>&& fpScratch)
        : m_vm(vm)
        , m_regs(WTFMove(regs))
        , m_gpScratch(WTFMove(gpScratch))
        , m_fpScratch(WTFMove(fpScratch))
    {
    }

    VM& vm() { return m_vm; }

    template<typename FunctionType, typename ResultType, typename... Arguments>
    void addSlowPathCall(CCallHelpers::JumpList from, CCallHelpers& jit, FunctionType function, ResultType result, Arguments... arguments)
    {
        addSlowPathCallImpl(from, jit, function, result, std::make_tuple(arguments...));
    }

private:
#define JSC_DEFINE_CALL_OPERATIONS(OperationType, ResultType, ...) JS_EXPORT_PRIVATE virtual void addSlowPathCallImpl(CCallHelpers::JumpList, CCallHelpers&, OperationType, ResultType, std::tuple<__VA_ARGS__> args) = 0;
    SNIPPET_SLOW_PATH_CALLS(JSC_DEFINE_CALL_OPERATIONS)
#undef JSC_DEFINE_CALL_OPERATIONS

    VM& m_vm;
    Vector<Value> m_regs;
    Vector<GPRReg> m_gpScratch;
    Vector<FPRReg> m_fpScratch;
};

}

#endif
