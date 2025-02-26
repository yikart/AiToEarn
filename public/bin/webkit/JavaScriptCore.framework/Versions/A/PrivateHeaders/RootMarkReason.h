/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
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

#include <wtf/Forward.h>

namespace JSC {

#define FOR_EACH_ROOT_MARK_REASON(v) \
    v(None) \
    v(ConservativeScan) \
    v(ExecutableToCodeBlockEdges) \
    v(ExternalRememberedSet) \
    v(StrongReferences) \
    v(ProtectedValues) \
    v(MarkedJSValueRefArray) \
    v(MarkListSet) \
    v(VMExceptions) \
    v(StrongHandles) \
    v(Debugger) \
    v(JITStubRoutines) \
    v(WeakMapSpace) \
    v(WeakSets) \
    v(Output) \
    v(JITWorkList) \
    v(CodeBlocks) \
    v(DOMGCOutput)

#define DECLARE_ROOT_MARK_REASON(reason) reason,

enum class RootMarkReason : uint8_t {
    FOR_EACH_ROOT_MARK_REASON(DECLARE_ROOT_MARK_REASON)
};

#undef DECLARE_ROOT_MARK_REASON

ASCIILiteral rootMarkReasonDescription(RootMarkReason);

} // namespace JSC

namespace WTF {

class PrintStream;

void printInternal(PrintStream&, JSC::RootMarkReason);

} // namespace WTF
