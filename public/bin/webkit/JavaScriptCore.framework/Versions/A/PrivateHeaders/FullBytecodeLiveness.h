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

#include "BytecodeLivenessAnalysis.h"
#include "Operands.h"
#include <wtf/FastBitVector.h>
#include <wtf/FixedVector.h>
#include <wtf/TZoneMalloc.h>

namespace JSC {

class BytecodeLivenessAnalysis;
class CodeBlock;

// Note: Full bytecode liveness does not track any information about the liveness of temps.
// If you want tmp liveness for a checkpoint ask tmpLivenessForCheckpoint.
class FullBytecodeLiveness {
    WTF_MAKE_TZONE_ALLOCATED(FullBytecodeLiveness);
public:
    explicit FullBytecodeLiveness(size_t size)
        : m_usesBefore(size)
        , m_usesAfter(size)
    { }

    const FastBitVector& getLiveness(BytecodeIndex bytecodeIndex, LivenessCalculationPoint point) const
    {
        // We don't have to worry about overflowing into the next bytecodeoffset in our vectors because we
        // static assert that bytecode length is greater than the number of checkpoints in BytecodeStructs.h
        switch (point) {
        case LivenessCalculationPoint::BeforeUse:
            return m_usesBefore[toIndex(bytecodeIndex)];
        case LivenessCalculationPoint::AfterUse:
            return m_usesAfter[toIndex(bytecodeIndex)];
        }
        RELEASE_ASSERT_NOT_REACHED();
    }
    
    bool virtualRegisterIsLive(VirtualRegister reg, BytecodeIndex bytecodeIndex, LivenessCalculationPoint point) const
    {
        return virtualRegisterIsAlwaysLive(reg) || virtualRegisterThatIsNotAlwaysLiveIsLive(getLiveness(bytecodeIndex, point), reg);
    }
    
private:
    friend class BytecodeLivenessAnalysis;
    
    static size_t toIndex(BytecodeIndex bytecodeIndex) { return bytecodeIndex.offset() + bytecodeIndex.checkpoint(); }

    // FIXME: Use FastBitVector's view mechanism to make them compact.
    // https://bugs.webkit.org/show_bug.cgi?id=204427
    FixedVector<FastBitVector> m_usesBefore;
    FixedVector<FastBitVector> m_usesAfter;
};

} // namespace JSC
