/*
 * Copyright (C) 2016-2024 Apple Inc. All rights reserved.
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

#include "BytecodeIndex.h"
#include "Heap.h"
#include "LineColumn.h"
#include "SlotVisitorMacros.h"
#include "VM.h"
#include "WasmIndexOrName.h"
#include "WriteBarrier.h"
#include <limits.h>

namespace JSC {

class CodeBlock;
class JSObject;

class StackFrame {
public:
    StackFrame(VM&, JSCell* owner, JSCell* callee);
    StackFrame(VM&, JSCell* owner, JSCell* callee, CodeBlock*, BytecodeIndex);
    StackFrame(VM&, JSCell* owner, CodeBlock*, BytecodeIndex);
    StackFrame(Wasm::IndexOrName);
    StackFrame() = default;

    bool hasLineAndColumnInfo() const { return !!m_codeBlock; }
    CodeBlock* codeBlock() const { return m_codeBlock.get(); }

    LineColumn computeLineAndColumn() const;
    String functionName(VM&) const;
    SourceID sourceID() const;
    String sourceURL(VM&) const;
    String sourceURLStripped(VM&) const;
    String toString(VM&) const;

    bool hasBytecodeIndex() const { return m_bytecodeIndex && !m_isWasmFrame; }
    BytecodeIndex bytecodeIndex()
    {
        ASSERT(hasBytecodeIndex());
        return m_bytecodeIndex;
    }

    template<typename Visitor>
    void visitAggregate(Visitor& visitor)
    {
        if (m_callee)
            visitor.append(m_callee);
        if (m_codeBlock)
            visitor.append(m_codeBlock);
    }

    bool isMarked(VM& vm) const { return (!m_callee || vm.heap.isMarked(m_callee.get())) && (!m_codeBlock || vm.heap.isMarked(m_codeBlock.get())); }

private:
    WriteBarrier<JSCell> m_callee { };
    WriteBarrier<CodeBlock> m_codeBlock { };
    Wasm::IndexOrName m_wasmFunctionIndexOrName;
    BytecodeIndex m_bytecodeIndex;
    bool m_isWasmFrame { false };
};

} // namespace JSC

