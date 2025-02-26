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

#include "FTLJITCode.h"
#include <wtf/FixedVector.h>

namespace JSC { namespace FTL {

// OSR entry into the FTL has a number of quirks:
//
// - OSR entry only happens through special OSR entry compilations. They have their
//   own CodeBlock and their own JITCode.
//
// - We only OSR enter in loop headers that have a null inline call frame.
//
// - Each OSR entry compilation allows entry through only one bytecode index.

class ForOSREntryJITCode final : public FTL::JITCode {
public:
    ForOSREntryJITCode();
    ~ForOSREntryJITCode() final;
    
    void initializeEntryBuffer(VM&, unsigned numCalleeLocals);
    ScratchBuffer* entryBuffer() const { return m_entryBuffer; }
    
    void setBytecodeIndex(BytecodeIndex value) { m_bytecodeIndex = value; }
    BytecodeIndex bytecodeIndex() const { return m_bytecodeIndex; }
    
    void countEntryFailure() { m_entryFailureCount++; }
    unsigned entryFailureCount() const { return m_entryFailureCount; }
    
    ForOSREntryJITCode* ftlForOSREntry() final;

    void setArgumentFlushFormats(FixedVector<DFG::FlushFormat>&& argumentFlushFormats)
    {
        m_argumentFlushFormats = WTFMove(argumentFlushFormats);
    }
    const FixedVector<DFG::FlushFormat>& argumentFlushFormats() { return m_argumentFlushFormats; }

private:
    FixedVector<DFG::FlushFormat> m_argumentFlushFormats;
    ScratchBuffer* m_entryBuffer; // Only for OSR entry code blocks.
    BytecodeIndex m_bytecodeIndex;
    unsigned m_entryFailureCount;
};

} } // namespace JSC::FTL

#endif // ENABLE(FTL_JIT)
