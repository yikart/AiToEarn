/*
 * Copyright (C) 2014 Apple Inc. All rights reserved.
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

#if ENABLE(FTL_JIT)

#include "DFGNode.h"
#include "DataFormat.h"
#include "FTLAbbreviatedTypes.h"
#include "FTLRecoveryOpcode.h"

namespace JSC { namespace FTL {

class AvailableRecovery {
public:
    AvailableRecovery()
        : m_node(nullptr)
        , m_format(DataFormatNone)
        , m_opcode(AddRecovery)
        , m_left(nullptr)
        , m_right(nullptr)
    {
    }
    
    AvailableRecovery(DFG::Node* node, RecoveryOpcode opcode, LValue left, LValue right, DataFormat format)
        : m_node(node)
        , m_format(format)
        , m_opcode(opcode)
        , m_left(left)
        , m_right(right)
    {
    }
    
    DFG::Node* node() const { return m_node; }
    DataFormat format() const { return m_format; }
    RecoveryOpcode opcode() const { return m_opcode; }
    LValue left() const { return m_left; }
    LValue right() const { return m_right; }
    
    void dump(PrintStream&) const;
    
private:
    DFG::Node* m_node;
    DataFormat m_format;
    RecoveryOpcode m_opcode;
    LValue m_left;
    LValue m_right;
};

} } // namespace JSC::FTL

#endif // ENABLE(FTL_JIT)
