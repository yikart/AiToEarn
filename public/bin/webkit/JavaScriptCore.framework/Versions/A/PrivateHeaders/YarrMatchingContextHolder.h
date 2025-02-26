/*
 * Copyright (C) 2009-2021 Apple Inc. All rights reserved.
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

#include "VM.h"
#include "Yarr.h"
#include "YarrJIT.h"

namespace JSC {

class VM;
class ExecutablePool;
class RegExp;

namespace Yarr {

class MatchingContextHolder {
    WTF_FORBID_HEAP_ALLOCATION;
public:
    MatchingContextHolder(VM&, bool, RegExp*, MatchFrom);
    ~MatchingContextHolder();

    static constexpr ptrdiff_t offsetOfStackLimit() { return OBJECT_OFFSETOF(MatchingContextHolder, m_stackLimit); }
#if ENABLE(YARR_JIT_ALL_PARENS_EXPRESSIONS)
    static constexpr ptrdiff_t offsetOfPatternContextBuffer() { return OBJECT_OFFSETOF(MatchingContextHolder, m_patternContextBuffer); }
    static constexpr ptrdiff_t offsetOfPatternContextBufferSize() { return OBJECT_OFFSETOF(MatchingContextHolder, m_patternContextBufferSize); }
#endif

private:
    VM& m_vm;
    void* m_stackLimit;
#if ENABLE(YARR_JIT_ALL_PARENS_EXPRESSIONS)
    void* m_patternContextBuffer { nullptr };
    unsigned m_patternContextBufferSize { 0 };
#endif
    MatchFrom m_matchFrom;
};

inline MatchingContextHolder::MatchingContextHolder(VM& vm, bool usesPatternContextBuffer, RegExp* regExp, MatchFrom matchFrom)
    : m_vm(vm)
    , m_matchFrom(matchFrom)
{
    if (matchFrom == MatchFrom::VMThread) {
        m_stackLimit = vm.softStackLimit();
        vm.m_executingRegExp = regExp;
    } else {
        StackBounds stack = Thread::current().stack();
        m_stackLimit = stack.recursionLimit(Options::reservedZoneSize());
    }

#if ENABLE(YARR_JIT_ALL_PARENS_EXPRESSIONS)
    if (usesPatternContextBuffer) {
        m_patternContextBuffer = m_vm.acquireRegExpPatternContexBuffer();
        m_patternContextBufferSize = VM::patternContextBufferSize;
    }
#else
    UNUSED_PARAM(usesPatternContextBuffer);
#endif
}

inline MatchingContextHolder::~MatchingContextHolder()
{
#if ENABLE(YARR_JIT_ALL_PARENS_EXPRESSIONS)
    if (m_patternContextBuffer)
        m_vm.releaseRegExpPatternContexBuffer();
#endif
    if (m_matchFrom == MatchFrom::VMThread)
        m_vm.m_executingRegExp = nullptr;
}

} } // namespace JSC::Yarr
