/*
 * Copyright (C) 2014-2023 Apple Inc. All rights reserved.
 * Copyright (C) 2014 Saam Barati. <saambarati1@gmail.com>
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

#include "CPU.h"
#include "MacroAssembler.h"
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>

namespace JSC {

class CCallHelpers;
class LLIntOffsetsExtractor;

class BasicBlockLocation {
    WTF_MAKE_TZONE_ALLOCATED(BasicBlockLocation);
public:
    typedef std::pair<int, int> Gap;

    BasicBlockLocation(int startOffset = -1, int endOffset = -1);

    int startOffset() const { return m_startOffset; }
    int endOffset() const { return m_endOffset; }
    void setStartOffset(int startOffset) { m_startOffset = startOffset; }
    void setEndOffset(int endOffset) { m_endOffset = endOffset; }
    bool hasExecuted() const { return m_executionCount > 0; }
    size_t executionCount() const { return m_executionCount; }
    void insertGap(int, int);
    Vector<Gap> getExecutedRanges() const;
    JS_EXPORT_PRIVATE void dumpData() const;
#if ENABLE(JIT)
#if USE(JSVALUE64)
    void emitExecuteCode(CCallHelpers&) const;
#else
    void emitExecuteCode(CCallHelpers&, MacroAssembler::RegisterID scratch) const;
#endif
#endif

private:
    friend class LLIntOffsetsExtractor;

    int m_startOffset;
    int m_endOffset;
    Vector<Gap> m_gaps;
    UCPURegister m_executionCount;
};

} // namespace JSC
