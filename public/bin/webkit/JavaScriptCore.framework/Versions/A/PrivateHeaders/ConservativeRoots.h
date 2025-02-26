/*
 * Copyright (C) 2009-2024 Apple Inc. All rights reserved.
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

#include "Heap.h"

namespace JSC {

class CodeBlockSet;
class HeapCell;
class JITStubRoutineSet;

class ConservativeRoots {
public:
    ConservativeRoots(Heap&);
    ~ConservativeRoots();

    void add(void* begin, void* end);
    void add(void* begin, void* end, JITStubRoutineSet&, CodeBlockSet&);
    
    size_t size() const;
    HeapCell** roots() const;

private:
    static constexpr size_t inlineCapacity = 2048;
    
    template<bool lookForWasmCallees, typename MarkHook>
    void genericAddPointer(char*, HeapVersion markingVersion, HeapVersion newlyAllocatedVersion, TinyBloomFilter<uintptr_t> jsGCFilter, TinyBloomFilter<uintptr_t> boxedWasmCalleeFilter, MarkHook&);

    template<typename MarkHook>
    void genericAddSpan(void* begin, void* end, MarkHook&);
    
    void grow();

    // We can't just use the copy of Heap::m_wasmCalleesPendingDestruction since new callees could be registered while
    // we're actively scanning the stack. A bad race would be:
    // 1) Start scanning the stack passing a frame with Wasm::Callee foo.
    // 2) tier up finishes for foo and is added to Heap::m_wasmCalleesPendingDestruction
    // 3) foo isn't added to m_wasmCalleesDiscovered
    // 4) foo gets derefed and destroyed.
    HashSet<const Wasm::Callee*> m_wasmCalleesPendingDestructionCopy;
    HashSet<const Wasm::Callee*> m_wasmCalleesDiscovered;
    TinyBloomFilter<uintptr_t> m_boxedWasmCalleeFilter;
    HeapCell** m_roots;
    size_t m_size;
    size_t m_capacity;
    JSC::Heap& m_heap;
    HeapCell* m_inlineRoots[inlineCapacity];
};

inline size_t ConservativeRoots::size() const
{
    return m_size;
}

inline HeapCell** ConservativeRoots::roots() const
{
    return m_roots;
}

} // namespace JSC
