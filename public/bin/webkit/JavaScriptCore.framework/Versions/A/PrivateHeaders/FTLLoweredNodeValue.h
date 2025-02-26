/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
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

#include "DFGBasicBlock.h"
#include "FTLAbbreviatedTypes.h"

namespace JSC { namespace FTL {

// Represents the act of having lowered a DFG::Node to an LValue, and records the
// DFG::BasicBlock that did the lowering. The LValue is what we use most often, but
// we need to verify that we're in a block that is dominated by the one that did
// the lowering. We're guaranteed that for each DFG::Node, there will be one
// LoweredNodeValue that always dominates all uses of the DFG::Node; but there may
// be others that don't dominate and we're effectively doing opportunistic GVN on
// the lowering code.

class LoweredNodeValue {
public:
    LoweredNodeValue()
        : m_value(nullptr)
        , m_block(nullptr)
    {
    }
    
    LoweredNodeValue(LValue value, DFG::BasicBlock* block)
        : m_value(value)
        , m_block(block)
    {
        ASSERT(m_value);
        ASSERT(m_block);
    }
    
    bool isSet() const { return !!m_value; }
    bool operator!() const { return !isSet(); }
    
    LValue value() const { return m_value; }
    DFG::BasicBlock* block() const { return m_block; }
    
private:
    LValue m_value;
    DFG::BasicBlock* m_block;
};

} } // namespace JSC::FTL

#endif // ENABLE(FTL_JIT)
