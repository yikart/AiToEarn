/*
 * Copyright (C) 2016-2018 Apple Inc. All rights reserved.
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

#include "JSCPtrTag.h"

namespace JSC {

namespace LLInt {

// These are used just to denote where LLInt code begins and where it ends.
extern "C" {
    void llintPCRangeStart();
    void llintPCRangeEnd();
#if ENABLE(WEBASSEMBLY)
    void wasmLLIntPCRangeStart();
    void wasmLLIntPCRangeEnd();
#endif
}

ALWAYS_INLINE bool isLLIntPC(void* pc)
{
    uintptr_t pcAsInt = std::bit_cast<uintptr_t>(pc);
    uintptr_t llintStart = untagCodePtr<uintptr_t, CFunctionPtrTag>(llintPCRangeStart);
    uintptr_t llintEnd = untagCodePtr<uintptr_t, CFunctionPtrTag>(llintPCRangeEnd);
    RELEASE_ASSERT(llintStart < llintEnd);
    return llintStart <= pcAsInt && pcAsInt <= llintEnd;
}

#if ENABLE(WEBASSEMBLY)
ALWAYS_INLINE bool isWasmLLIntPC(void* pc)
{
    uintptr_t pcAsInt = std::bit_cast<uintptr_t>(pc);
    uintptr_t start = untagCodePtr<uintptr_t, CFunctionPtrTag>(wasmLLIntPCRangeStart);
    uintptr_t end = untagCodePtr<uintptr_t, CFunctionPtrTag>(wasmLLIntPCRangeEnd);
    RELEASE_ASSERT(start < end);
    return start <= pcAsInt && pcAsInt <= end;
}
#endif

#if !ENABLE(C_LOOP)
static constexpr GPRReg LLIntPC = GPRInfo::regT4;
#endif

} } // namespace JSC::LLInt
