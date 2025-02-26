/*
 * Copyright (C) 2013-2017 Apple Inc. All rights reserved.
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

#include "BytecodeGraph.h"
#include "BytecodeLivenessAnalysis.h"
#include "BytecodeUseDef.h"
#include "CodeBlock.h"
#include "InterpreterInlines.h"

namespace JSC {

inline bool virtualRegisterIsAlwaysLive(VirtualRegister reg)
{
    return !reg.isLocal();
}

inline bool virtualRegisterThatIsNotAlwaysLiveIsLive(const FastBitVector& out, VirtualRegister reg)
{
    unsigned local = reg.toLocal();
    if (local >= out.numBits())
        return false;
    return out[local];
}

inline bool virtualRegisterIsLive(const FastBitVector& out, VirtualRegister operand)
{
    return virtualRegisterIsAlwaysLive(operand) || virtualRegisterThatIsNotAlwaysLiveIsLive(out, operand);
}

inline bool isValidRegisterForLiveness(VirtualRegister operand)
{
    if (operand.isConstant())
        return false;
    return operand.isLocal();
}

template<typename CodeBlockType, typename DefFunctor>
inline void BytecodeLivenessPropagation::stepOverBytecodeIndexDef(CodeBlockType* codeBlock, const JSInstructionStream& instructions, BytecodeGraph&, BytecodeIndex bytecodeIndex, const DefFunctor& def)
{
    auto* instruction = instructions.at(bytecodeIndex).ptr();
    computeDefsForBytecodeIndex(
        codeBlock, instruction, bytecodeIndex.checkpoint(),
        [&] (VirtualRegister operand) {
            if (isValidRegisterForLiveness(operand))
                def(operand.toLocal());
        });
}

template<typename CodeBlockType, typename UseFunctor>
inline void BytecodeLivenessPropagation::stepOverBytecodeIndexUse(CodeBlockType* codeBlock, const JSInstructionStream& instructions, BytecodeGraph&, BytecodeIndex bytecodeIndex, const UseFunctor& use)
{
    auto* instruction = instructions.at(bytecodeIndex).ptr();
    computeUsesForBytecodeIndex(
        codeBlock, instruction, bytecodeIndex.checkpoint(),
        [&] (VirtualRegister operand) {
            if (isValidRegisterForLiveness(operand))
                use(operand.toLocal());
        });
}

template<typename CodeBlockType, typename UseFunctor>
inline void BytecodeLivenessPropagation::stepOverBytecodeIndexUseInExceptionHandler(CodeBlockType* codeBlock, const JSInstructionStream&, BytecodeGraph& graph, BytecodeIndex bytecodeIndex, const UseFunctor& use)
{
    // If we have an exception handler, we want the live-in variables of the
    // exception handler block to be included in the live-in of this particular BytecodeIndex.
    if (auto* handler = codeBlock->handlerForBytecodeIndex(bytecodeIndex)) {
        auto* handlerBlock = graph.findBasicBlockWithLeaderOffset(handler->target);
        ASSERT(handlerBlock);
        handlerBlock->in().forEachSetBit(use);
    }
}

// Simplified interface to bytecode use/def, which determines defs first and then uses, and includes
// exception handlers in the uses.
template<typename CodeBlockType, typename UseFunctor, typename DefFunctor>
inline void BytecodeLivenessPropagation::stepOverBytecodeIndex(CodeBlockType* codeBlock, const JSInstructionStream& instructions, BytecodeGraph& graph, BytecodeIndex bytecodeIndex, const UseFunctor& use, const DefFunctor& def)
{
    // This abstractly executes the BytecodeIndex in reverse. Instructions logically first use operands and
    // then define operands. This logical ordering is necessary for operations that use and def the same
    // operand, like:
    //
    //     op_add loc1, loc1, loc2
    //
    // The use of loc1 happens before the def of loc1. That's a semantic requirement since the add
    // operation cannot travel forward in time to read the value that it will produce after reading that
    // value. Since we are executing in reverse, this means that we must do defs before uses (reverse of
    // uses before defs).
    //
    // Since this is a liveness analysis, this ordering ends up being particularly important: if we did
    // uses before defs, then the add operation above would appear to not have loc1 live, since we'd
    // first add it to the out set (the use), and then we'd remove it (the def).

    stepOverBytecodeIndexDef(codeBlock, instructions, graph, bytecodeIndex, def);
    stepOverBytecodeIndexUseInExceptionHandler(codeBlock, instructions, graph, bytecodeIndex, use);
    stepOverBytecodeIndexUse(codeBlock, instructions, graph, bytecodeIndex, use);
}

template<typename CodeBlockType>
inline void BytecodeLivenessPropagation::stepOverInstruction(CodeBlockType* codeBlock, const JSInstructionStream& instructions, BytecodeGraph& graph, BytecodeIndex bytecodeIndex, FastBitVector& out)
{
    auto numberOfCheckpoints = instructions.at(bytecodeIndex)->numberOfCheckpoints();
    for (Checkpoint checkpoint = numberOfCheckpoints; checkpoint--;) {
        stepOverBytecodeIndex(
            codeBlock, instructions, graph, bytecodeIndex.withCheckpoint(checkpoint),
            [&] (unsigned bitIndex) {
                // This is the use functor, so we set the bit.
                out[bitIndex] = true;
            },
            [&] (unsigned bitIndex) {
                // This is the def functor, so we clear the bit.
                out[bitIndex] = false;
            });
    }
}

template<typename CodeBlockType, typename Instructions>
inline bool BytecodeLivenessPropagation::computeLocalLivenessForInstruction(CodeBlockType* codeBlock, const Instructions& instructions, BytecodeGraph& graph, JSBytecodeBasicBlock& block, BytecodeIndex targetIndex, FastBitVector& result)
{
    ASSERT(!block.isExitBlock());
    ASSERT(!block.isEntryBlock());
    ASSERT_WITH_MESSAGE(!targetIndex.checkpoint(), "computeLocalLivenessForInstruction can't be used to ask questions about checkpoints");

    FastBitVector out = block.out();

    unsigned cursor = block.totalLength();
    for (unsigned i = block.delta().size(); i--;) {
        cursor -= block.delta()[i];
        BytecodeIndex bytecodeIndex = BytecodeIndex(block.leaderOffset() + cursor);
        if (targetIndex.offset() > bytecodeIndex.offset())
            break;
        stepOverInstruction(codeBlock, instructions, graph, bytecodeIndex, out);
    }

    return result.setAndCheck(out);
}

template<typename CodeBlockType, typename Instructions>
inline bool BytecodeLivenessPropagation::computeLocalLivenessForBlock(CodeBlockType* codeBlock, const Instructions& instructions, BytecodeGraph& graph, JSBytecodeBasicBlock& block)
{
    if (block.isExitBlock() || block.isEntryBlock())
        return false;
    return computeLocalLivenessForInstruction(codeBlock, instructions, graph, block, BytecodeIndex(block.leaderOffset()), block.in());
}

template<typename CodeBlockType, typename Instructions>
inline FastBitVector BytecodeLivenessPropagation::getLivenessInfoAtInstruction(CodeBlockType* codeBlock, const Instructions& instructions, BytecodeGraph& graph, BytecodeIndex bytecodeIndex)
{
    ASSERT_WITH_MESSAGE(!bytecodeIndex.checkpoint(), "getLivenessInfoAtInstruction can't be used to ask questions about checkpoints");
    auto* block = graph.findBasicBlockForBytecodeOffset(bytecodeIndex.offset());
    ASSERT(block);
    ASSERT(!block->isEntryBlock());
    ASSERT(!block->isExitBlock());
    FastBitVector out;
    out.resize(block->out().numBits());
    computeLocalLivenessForInstruction(codeBlock, instructions, graph, *block, bytecodeIndex, out);
    return out;
}

template<typename CodeBlockType, typename Instructions>
inline void BytecodeLivenessPropagation::runLivenessFixpoint(CodeBlockType* codeBlock, const Instructions& instructions, BytecodeGraph& graph)
{
    unsigned numberOfVariables = codeBlock->numCalleeLocals();
    for (auto& block : graph) {
        block.in().resize(numberOfVariables);
        block.out().resize(numberOfVariables);
        block.in().clearAll();
        block.out().clearAll();
    }

    bool changed;
    auto& lastBlock = graph.last();
    lastBlock.in().clearAll();
    lastBlock.out().clearAll();
    FastBitVector newOut;
    newOut.resize(lastBlock.out().numBits());
    do {
        changed = false;
        for (auto& block : graph.basicBlocksInReverseOrder()) {
            newOut.clearAll();
            for (unsigned blockIndex : block.successors()) {
                auto& successor = graph[blockIndex];
                newOut |= successor.in();
            }
            block.out() = newOut;
            changed |= computeLocalLivenessForBlock(codeBlock, instructions, graph, block);
        }
    } while (changed);
}

} // namespace JSC
