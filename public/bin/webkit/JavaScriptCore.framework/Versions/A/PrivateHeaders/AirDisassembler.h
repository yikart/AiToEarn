/*
 * Copyright (C) 2017-2023 Apple Inc. All rights reserved.
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

#if ENABLE(B3_JIT)

#include "MacroAssembler.h"
#include <wtf/TZoneMalloc.h>

namespace JSC {

class CCallHelpers;
class LinkBuffer;

namespace B3 { namespace Air {

class BasicBlock;
class Code;
struct Inst;

class Disassembler {
    WTF_MAKE_TZONE_ALLOCATED(Disassembler);
public:
    Disassembler() = default;

    void startEntrypoint(CCallHelpers&);
    void endEntrypoint(CCallHelpers&);
    void startLatePath(CCallHelpers&);
    void endLatePath(CCallHelpers&);
    void startBlock(BasicBlock*, CCallHelpers&);
    void addInst(Inst*, MacroAssembler::Label, MacroAssembler::Label);

    void dump(Code&, PrintStream&, LinkBuffer&, const char* airPrefix, const char* asmPrefix, const WTF::ScopedLambda<void(Inst&)>& doToEachInst);

private:
    UncheckedKeyHashMap<Inst*, std::pair<MacroAssembler::Label, MacroAssembler::Label>> m_instToRange;
    Vector<BasicBlock*> m_blocks;
    MacroAssembler::Label m_entrypointStart;
    MacroAssembler::Label m_entrypointEnd;
    MacroAssembler::Label m_latePathStart;
    MacroAssembler::Label m_latePathEnd;
};

} } } // namespace JSC::B3::Air

#endif // ENABLE(B3_JIT)
