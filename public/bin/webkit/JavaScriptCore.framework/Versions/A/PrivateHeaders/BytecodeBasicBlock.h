/*
 * Copyright (C) 2013-2023 Apple Inc. All rights reserved.
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

#include "InstructionStream.h"
#include "Opcode.h"
#include <limits.h>
#include <wtf/FastBitVector.h>
#include <wtf/Vector.h>

namespace JSC {

class BytecodeGraph;
class CodeBlock;
class UnlinkedCodeBlock;
class UnlinkedCodeBlockGenerator;
template<typename> struct Instruction;

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(BytecodeBasicBlock);

template<typename OpcodeTraits>
class BytecodeBasicBlock {
    WTF_MAKE_TZONE_ALLOCATED(BytecodeBasicBlock);
    WTF_MAKE_NONCOPYABLE(BytecodeBasicBlock);
    friend class BytecodeGraph;
public:
    using BasicBlockVector = Vector<BytecodeBasicBlock, 0, UnsafeVectorOverflow, 16, BytecodeBasicBlockMalloc>;
    using InstructionType = BaseInstruction<OpcodeTraits>;
    using InstructionStreamType = InstructionStream<InstructionType>;
    static_assert(maxBytecodeStructLength <= UINT8_MAX);
    enum SpecialBlockType { EntryBlock, ExitBlock };
    inline BytecodeBasicBlock(const typename InstructionStreamType::Ref&, unsigned blockIndex);
    inline BytecodeBasicBlock(SpecialBlockType, unsigned blockIndex);
    BytecodeBasicBlock(BytecodeBasicBlock<OpcodeTraits>&&) = default;


    bool isEntryBlock() { return !m_leaderOffset && !m_totalLength; }
    bool isExitBlock() { return m_leaderOffset == UINT_MAX && m_totalLength == UINT_MAX; }

    unsigned leaderOffset() const { return m_leaderOffset; }
    unsigned totalLength() const { return m_totalLength; }

    const Vector<uint8_t>& delta() const { return m_delta; }
    const Vector<unsigned>& successors() const { return m_successors; }

    FastBitVector& in() { return m_in; }
    FastBitVector& out() { return m_out; }

    unsigned index() const { return m_index; }

    explicit operator bool() const { return true; }

private:
    // Only called from BytecodeGraph.
    static BasicBlockVector compute(CodeBlock*, const InstructionStreamType& instructions);
    static BasicBlockVector compute(UnlinkedCodeBlockGenerator*, const InstructionStreamType& instructions);
    template<typename Block> static BasicBlockVector computeImpl(Block* codeBlock, const InstructionStreamType& instructions);
    void shrinkToFit();

    void addSuccessor(BytecodeBasicBlock<OpcodeTraits>& block)
    {
        if (!m_successors.contains(block.index()))
            m_successors.append(block.index());
    }

    inline void addLength(unsigned);

    typename InstructionStreamType::Offset m_leaderOffset;
    unsigned m_totalLength;
    unsigned m_index;

    Vector<uint8_t> m_delta;
    Vector<unsigned> m_successors;

    FastBitVector m_in;
    FastBitVector m_out;
};

using JSBytecodeBasicBlock = BytecodeBasicBlock<JSOpcodeTraits>;
using WasmBytecodeBasicBlock = BytecodeBasicBlock<WasmOpcodeTraits>;

} // namespace JSC
