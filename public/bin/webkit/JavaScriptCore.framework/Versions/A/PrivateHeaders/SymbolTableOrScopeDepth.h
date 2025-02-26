/*
 * Copyright (C) 2019 Apple Inc. All Rights Reserved.
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

#include "VirtualRegister.h"
#include <wtf/PrintStream.h>

namespace JSC {

class SymbolTableOrScopeDepth {
public:
    SymbolTableOrScopeDepth() = default;

    static SymbolTableOrScopeDepth symbolTable(VirtualRegister reg)
    {
        ASSERT(reg.isConstant());
        return SymbolTableOrScopeDepth(reg.offset() - FirstConstantRegisterIndex);
    }

    static SymbolTableOrScopeDepth scopeDepth(unsigned scopeDepth)
    {
        return SymbolTableOrScopeDepth(scopeDepth);
    }

    static SymbolTableOrScopeDepth raw(unsigned value)
    {
        return SymbolTableOrScopeDepth(value);
    }

    VirtualRegister symbolTable() const
    {
        return VirtualRegister(m_raw + FirstConstantRegisterIndex);
    }

    unsigned scopeDepth() const
    {
        return m_raw;
    }

    unsigned raw() const { return m_raw; }

    void dump(PrintStream& out) const
    {
        out.print(m_raw);
    }

private:
    SymbolTableOrScopeDepth(unsigned value)
        : m_raw(value)
    { }

    unsigned m_raw { 0 };
};

} // namespace JSC
