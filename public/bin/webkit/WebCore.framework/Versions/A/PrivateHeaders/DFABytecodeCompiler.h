/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
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

#if ENABLE(CONTENT_EXTENSIONS)

#include "DFABytecode.h"
#include <wtf/Vector.h>

namespace WebCore {

namespace ContentExtensions {

struct DFA;
class DFANode;

class WEBCORE_EXPORT DFABytecodeCompiler {
public:
    DFABytecodeCompiler(const DFA& dfa, Vector<DFABytecode>& bytecode)
        : m_bytecode(bytecode)
        , m_dfa(dfa)
    {
    }
    
    void compile();

private:
    struct Range {
        Range(uint8_t min, uint8_t max, uint32_t destination, bool caseSensitive)
            : min(min)
            , max(max)
            , destination(destination)
            , caseSensitive(caseSensitive)
        {
        }
        uint8_t min;
        uint8_t max;
        uint32_t destination;
        bool caseSensitive;
    };
    struct JumpTable {
        ~JumpTable()
        {
            ASSERT(min + destinations.size() == static_cast<size_t>(max + 1));
            ASSERT(min == max || destinations.size() > 1);
        }

        uint8_t min { 0 };
        uint8_t max { 0 };
        bool caseSensitive { true };
        Vector<uint32_t> destinations;
    };
    struct Transitions {
        Vector<JumpTable> jumpTables;
        Vector<Range> ranges;
        bool useFallbackTransition { false };
        uint32_t fallbackTransitionTarget { std::numeric_limits<uint32_t>::max() };
    };
    JumpTable extractJumpTable(Vector<Range>&, unsigned first, unsigned last);
    Transitions transitions(const DFANode&);
    
    unsigned compiledNodeMaxBytecodeSize(uint32_t index);
    void compileNode(uint32_t index, bool root);
    unsigned nodeTransitionsMaxBytecodeSize(const DFANode&);
    void compileNodeTransitions(uint32_t nodeIndex);
    unsigned checkForJumpTableMaxBytecodeSize(const JumpTable&);
    unsigned checkForRangeMaxBytecodeSize(const Range&);
    void compileJumpTable(uint32_t nodeIndex, const JumpTable&);
    void compileCheckForRange(uint32_t nodeIndex, const Range&);
    int32_t longestPossibleJump(uint32_t jumpLocation, uint32_t sourceNodeIndex, uint32_t destinationNodeIndex);

    void emitAppendAction(uint64_t);
    void emitJump(uint32_t sourceNodeIndex, uint32_t destinationNodeIndex);
    void emitCheckValue(uint8_t value, uint32_t sourceNodeIndex, uint32_t destinationNodeIndex, bool caseSensitive);
    void emitCheckValueRange(uint8_t lowValue, uint8_t highValue, uint32_t sourceNodeIndex, uint32_t destinationNodeIndex, bool caseSensitive);
    void emitTerminate();

    Vector<DFABytecode>& m_bytecode;
    const DFA& m_dfa;
    
    Vector<uint32_t> m_maxNodeStartOffsets;
    Vector<uint32_t> m_nodeStartOffsets;
    
    struct LinkRecord {
        DFABytecodeJumpSize jumpSize;
        int32_t longestPossibleJump;
        uint32_t instructionLocation;
        uint32_t jumpLocation;
        uint32_t destinationNodeIndex;
    };
    Vector<LinkRecord> m_linkRecords;
};

} // namespace ContentExtensions
} // namespace WebCore

#endif // ENABLE(CONTENT_EXTENSIONS)
