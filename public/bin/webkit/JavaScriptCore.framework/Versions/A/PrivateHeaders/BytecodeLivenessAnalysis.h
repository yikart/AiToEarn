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

#include "BytecodeBasicBlock.h"
#include "BytecodeGraph.h"
#include "CodeBlock.h"
#include <wtf/BitSet.h>
#include <wtf/FastBitVector.h>

namespace JSC {

class BytecodeKills;
class FullBytecodeLiveness;

// We model our bytecode effects like the following and insert the liveness calculation points.
//
// <- BeforeUse
//     Use
// <- AfterUse
//     Use by exception handlers
//     Def
enum class LivenessCalculationPoint : uint8_t {
    BeforeUse,
    AfterUse,
};

class BytecodeLivenessPropagation {
public:
    template<typename CodeBlockType, typename UseFunctor>
    static void stepOverBytecodeIndexUse(CodeBlockType*, const JSInstructionStream&, BytecodeGraph&, BytecodeIndex, const UseFunctor&);
    template<typename CodeBlockType, typename UseFunctor>
    static void stepOverBytecodeIndexUseInExceptionHandler(CodeBlockType*, const JSInstructionStream&, BytecodeGraph&, BytecodeIndex, const UseFunctor&);
    template<typename CodeBlockType, typename DefFunctor>
    static void stepOverBytecodeIndexDef(CodeBlockType*, const JSInstructionStream&, BytecodeGraph&, BytecodeIndex, const DefFunctor&);

    template<typename CodeBlockType, typename UseFunctor, typename DefFunctor>
    static void stepOverBytecodeIndex(CodeBlockType*, const JSInstructionStream&, BytecodeGraph&, BytecodeIndex, const UseFunctor&, const DefFunctor&);

    template<typename CodeBlockType>
    static void stepOverInstruction(CodeBlockType*, const JSInstructionStream&, BytecodeGraph&, BytecodeIndex, FastBitVector& out);

    template<typename CodeBlockType, typename Instructions>
    static bool computeLocalLivenessForInstruction(CodeBlockType*, const Instructions&, BytecodeGraph&, JSBytecodeBasicBlock&, BytecodeIndex, FastBitVector& result);

    template<typename CodeBlockType, typename Instructions>
    static bool computeLocalLivenessForBlock(CodeBlockType*, const Instructions&, BytecodeGraph&, JSBytecodeBasicBlock&);

    template<typename CodeBlockType, typename Instructions>
    static FastBitVector getLivenessInfoAtInstruction(CodeBlockType*, const Instructions&, BytecodeGraph&, BytecodeIndex);

    template<typename CodeBlockType, typename Instructions>
    static void runLivenessFixpoint(CodeBlockType*, const Instructions&, BytecodeGraph&);
};

class BytecodeLivenessAnalysis : private BytecodeLivenessPropagation {
    WTF_MAKE_TZONE_ALLOCATED(BytecodeLivenessAnalysis);
    WTF_MAKE_NONCOPYABLE(BytecodeLivenessAnalysis);
public:
    friend class BytecodeLivenessPropagation;
    BytecodeLivenessAnalysis(CodeBlock*);
    
    FastBitVector getLivenessInfoAtInstruction(CodeBlock* codeBlock, BytecodeIndex bytecodeIndex) { return BytecodeLivenessPropagation::getLivenessInfoAtInstruction(codeBlock, codeBlock->instructions(), m_graph, bytecodeIndex); }
    
    std::unique_ptr<FullBytecodeLiveness> computeFullLiveness(CodeBlock*);

    BytecodeGraph& graph() { return m_graph; }

private:
    void dumpResults(CodeBlock*);

    BytecodeGraph m_graph;
};

WTF::BitSet<maxNumCheckpointTmps> tmpLivenessForCheckpoint(const CodeBlock&, BytecodeIndex);

inline bool operandIsAlwaysLive(int operand);
inline bool operandThatIsNotAlwaysLiveIsLive(const FastBitVector& out, int operand);
inline bool operandIsLive(const FastBitVector& out, int operand);
inline bool isValidRegisterForLiveness(int operand);

} // namespace JSC
