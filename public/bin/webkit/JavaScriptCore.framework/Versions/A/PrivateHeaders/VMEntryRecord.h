/*
 * Copyright (C) 2014-2022 Apple Inc. All rights reserved.
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

#include "GPRInfo.h"

namespace JSC {

struct EntryFrame;
class CallFrame;
class JSGlobalObject;
class JSObject;
class VM;

struct VMEntryRecord {
    /*
     * This record stored in a vmEntryTo{JavaScript,Host} allocated frame. It is allocated on the stack
     * after callee save registers where local variables would go.
     */
    VM* const m_vm;
    CallFrame* const m_prevTopCallFrame;
    EntryFrame* const m_prevTopEntryFrame;

#if !ENABLE(C_LOOP) && NUMBER_OF_CALLEE_SAVES_REGISTERS > 0
    CPURegister calleeSaveRegistersBuffer[NUMBER_OF_CALLEE_SAVES_REGISTERS];
#elif ENABLE(C_LOOP)
    CPURegister calleeSaveRegistersBuffer[1];
#endif

    CallFrame* prevTopCallFrame() { return m_prevTopCallFrame; }
    SUPPRESS_ASAN CallFrame* unsafePrevTopCallFrame() { return m_prevTopCallFrame; }

    EntryFrame* prevTopEntryFrame() { return m_prevTopEntryFrame; }
    SUPPRESS_ASAN EntryFrame* unsafePrevTopEntryFrame() { return m_prevTopEntryFrame; }
};

extern "C" VMEntryRecord* SYSV_ABI vmEntryRecord(EntryFrame*);

} // namespace JSC
