/*
 * Copyright (C) 2013, 2015 Apple Inc. All rights reserved.
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

#include "GPRInfo.h"
#include "MacroAssembler.h"
#include <wtf/WeakRandom.h>

namespace JSC {

// The BinarySwitch class makes it easy to emit a switch statement over either
// 32-bit integers or pointers, where the switch uses a tree of branches
// rather than a jump table. This makes it particularly useful if the case
// values are too far apart to make a jump table practical, or if there are
// sufficiently few cases that the total cost of log(numCases) branches is
// less than the cost of an indirected jump.
//
// In an effort to simplify the logic of emitting code for each case, this
// uses an iterator style, rather than a functor callback style. This makes
// sense because even the iterator implementation found herein is relatively
// simple, whereas the code it's used from is usually quite complex - one
// example being the trie-of-trees string switch implementation, where the
// code emitted for each case involves recursing to emit code for a sub-trie.
//
// Use this like so:
//
// BinarySwitch switch(valueReg, casesVector, BinarySwitch::Int32);
// while (switch.advance(jit)) {
//     int value = switch.caseValue();
//     unsigned index = switch.caseIndex(); // index into casesVector, above
//     ... // generate code for this case
//     ... = jit.jump(); // you have to jump out yourself; falling through causes undefined behavior
// }
// switch.fallThrough().link(&jit);

class BinarySwitch {
public:
    enum Type {
        Int32,
        IntPtr
    };
    
    BinarySwitch(GPRReg value, std::span<const int64_t> cases, Type);
    ~BinarySwitch();
    
    unsigned caseIndex() const { return m_cases[m_caseIndex].index; }
    int64_t caseValue() const { return m_cases[m_caseIndex].value; }
    
    bool advance(MacroAssembler&);
    
    MacroAssembler::JumpList& fallThrough() { return m_fallThrough; }
    
private:
    void build(unsigned start, bool hardStart, unsigned end);
    
    struct Case {
        Case() { }

        Case(int64_t value, unsigned index)
            : value(value)
            , index(index)
        {
        }
        
        bool operator<(const Case& other) const
        {
            return value < other.value;
        }

        void dump(PrintStream& out) const;
        
        int64_t value;
        unsigned index;
    };
    
    enum BranchKind {
        NotEqualToFallThrough,
        NotEqualToPush,
        LessThanToPush,
        Pop,
        ExecuteCase
    };
        
    struct BranchCode {
        BranchCode() { }
        
        BranchCode(BranchKind kind, unsigned index = UINT_MAX)
            : kind(kind)
            , index(index)
        {
        }

        void dump(PrintStream& out) const;
        
        BranchKind kind;
        unsigned index;
    };

    WeakRandom m_weakRandom;
    Vector<Case, 16> m_cases;
    Vector<BranchCode, 32> m_branches;
    Vector<MacroAssembler::Jump, 32> m_jumpStack;
    MacroAssembler::JumpList m_fallThrough;
    Type m_type;
    GPRReg m_value;
    unsigned m_index { 0 };
    unsigned m_caseIndex { UINT_MAX };
};

} // namespace JSC

#endif // ENABLE(JIT)
