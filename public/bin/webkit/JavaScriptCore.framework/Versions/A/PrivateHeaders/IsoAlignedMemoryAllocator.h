/*
 * Copyright (C) 2017-2021 Apple Inc. All rights reserved.
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

#include "IsoMemoryAllocatorBase.h"
#include <wtf/BitVector.h>
#include <wtf/HashMap.h>
#include <wtf/Vector.h>

#if ENABLE(MALLOC_HEAP_BREAKDOWN)
#include <wtf/DebugHeap.h>
#endif

namespace JSC {

class IsoAlignedMemoryAllocator final : public IsoMemoryAllocatorBase {
public:
    using Base = IsoMemoryAllocatorBase;

    IsoAlignedMemoryAllocator(CString);
    ~IsoAlignedMemoryAllocator() final;

    void dump(PrintStream&) const final;

    void* tryAllocateMemory(size_t) final;
    void freeMemory(void*) final;
    void* tryReallocateMemory(void*, size_t) final;

protected:
    void* tryMallocBlock() final;
    void freeBlock(void* block) final;
    void commitBlock(void* block) final;
    void decommitBlock(void* block) final;

#if ENABLE(MALLOC_HEAP_BREAKDOWN)
    WTF::DebugHeap m_heap;
#endif
};

} // namespace JSC

