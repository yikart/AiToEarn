/*
 * Copyright (C) 2016 Yusuke Suzuki <utatane.tea@gmail.com>
 * Copyright (C) 2016-2023 Apple Inc. All rights reserved.
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

#include "BytecodeBasicBlock.h"
#include "BytecodeDumper.h"
#include <wtf/IndexedContainerIterator.h>
#include <wtf/IteratorRange.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

class BytecodeGraph {
    WTF_MAKE_NONCOPYABLE(BytecodeGraph);
    WTF_MAKE_TZONE_ALLOCATED(BytecodeGraph);
public:
    using BasicBlockType = JSBytecodeBasicBlock;
    using BasicBlocksVector = typename BasicBlockType::BasicBlockVector;
    using InstructionStreamType = typename BasicBlockType::InstructionStreamType;

    typedef WTF::IndexedContainerIterator<BytecodeGraph> iterator;

    template <typename CodeBlockType>
    inline BytecodeGraph(CodeBlockType*, const InstructionStreamType&);

    WTF::IteratorRange<BasicBlocksVector::reverse_iterator> basicBlocksInReverseOrder()
    {
        return WTF::makeIteratorRange(m_basicBlocks.rbegin(), m_basicBlocks.rend());
    }

    static bool blockContainsBytecodeOffset(const BasicBlockType& block, typename InstructionStreamType::Offset bytecodeOffset)
    {
        unsigned leaderOffset = block.leaderOffset();
        return bytecodeOffset >= leaderOffset && bytecodeOffset < leaderOffset + block.totalLength();
    }

    BasicBlockType* findBasicBlockForBytecodeOffset(typename InstructionStreamType::Offset bytecodeOffset)
    {
        /*
            for (unsigned i = 0; i < m_basicBlocks.size(); i++) {
                if (blockContainsBytecodeOffset(m_basicBlocks[i], bytecodeOffset))
                    return &m_basicBlocks[i];
            }
            return 0;
        */

        BasicBlockType* basicBlock = approximateBinarySearch<BasicBlockType, unsigned>(m_basicBlocks, m_basicBlocks.size(), bytecodeOffset, [] (BasicBlockType* basicBlock) { return basicBlock->leaderOffset(); });
        // We found the block we were looking for.
        if (blockContainsBytecodeOffset(*basicBlock, bytecodeOffset))
            return basicBlock;

        // Basic block is to the left of the returned block.
        if (bytecodeOffset < basicBlock->leaderOffset()) {
            ASSERT(basicBlock - 1 >= m_basicBlocks.data());
            ASSERT(blockContainsBytecodeOffset(basicBlock[-1], bytecodeOffset));
            return &basicBlock[-1];
        }

        // Basic block is to the right of the returned block.
        ASSERT(&basicBlock[1] <= &m_basicBlocks.last());
        ASSERT(blockContainsBytecodeOffset(basicBlock[1], bytecodeOffset));
        return &basicBlock[1];
    }

    BasicBlockType* findBasicBlockWithLeaderOffset(typename InstructionStreamType::Offset leaderOffset)
    {
        return tryBinarySearch<BasicBlockType, unsigned>(m_basicBlocks, m_basicBlocks.size(), leaderOffset, [] (BasicBlockType* basicBlock) { return basicBlock->leaderOffset(); });
    }

    unsigned size() const { return m_basicBlocks.size(); }
    BasicBlockType& at(unsigned index) const { return const_cast<BytecodeGraph*>(this)->m_basicBlocks[index]; }
    BasicBlockType& operator[](unsigned index) const { return at(index); }

    iterator begin() { return iterator(*this, 0); }
    iterator end() { return iterator(*this, size()); }
    BasicBlockType& first() { return at(0); }
    BasicBlockType& last() { return at(size() - 1); }


    template <typename CodeBlockType>
    void dump(CodeBlockType* codeBlock, const InstructionStreamType& instructions, std::optional<Vector<Operands<SpeculatedType>>> speculationAtHead, PrintStream& printer = WTF::dataFile())
    {
        CodeBlockBytecodeDumper<CodeBlockType>::dumpGraph(codeBlock, instructions, *this, speculationAtHead, printer);
    }

private:
    BasicBlocksVector m_basicBlocks;
};


template<typename CodeBlockType>
BytecodeGraph::BytecodeGraph(CodeBlockType* codeBlock, const InstructionStreamType& instructions)
    : m_basicBlocks(BasicBlockType::compute(codeBlock, instructions))
{
    ASSERT(m_basicBlocks.size());
}

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
