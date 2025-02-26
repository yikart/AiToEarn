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

#include "CollectionScope.h"
#include <wtf/HashSet.h>
#include <wtf/Lock.h>
#include <wtf/Noncopyable.h>
#include <wtf/PrintStream.h>
#include <wtf/TZoneMalloc.h>

namespace JSC {

class CodeBlock;
class Heap;
class JSCell;
class VM;

// CodeBlockSet tracks all CodeBlocks. Every CodeBlock starts out with one
// reference coming in from GC. The GC is responsible for freeing CodeBlocks
// once they hasOneRef() and nobody is running code from that CodeBlock.

class CodeBlockSet {
    WTF_MAKE_TZONE_ALLOCATED(CodeBlockSet);
    WTF_MAKE_NONCOPYABLE(CodeBlockSet);
public:
    CodeBlockSet();
    ~CodeBlockSet();

    void mark(const AbstractLocker&, CodeBlock* candidateCodeBlock);
    
    void clearCurrentlyExecutingAndRemoveDeadCodeBlocks(VM&);

    bool contains(const AbstractLocker&, void* candidateCodeBlock);
    Lock& getLock() WTF_RETURNS_LOCK(m_lock) { return m_lock; }

    // This is expected to run only when we're not adding to the set for now. If
    // this needs to run concurrently in the future, we'll need to lock around this.
    bool isCurrentlyExecuting(CodeBlock*);

    // Visits each CodeBlock in the heap until the visitor function returns true
    // to indicate that it is done iterating, or until every CodeBlock has been
    // visited.
    template<typename Functor> void iterate(const Functor&);
    template<typename Functor> void iterate(const AbstractLocker&, const Functor&);

    template<typename Functor> void iterateCurrentlyExecuting(const Functor&);
    
    void dump(PrintStream&) const;
    
    void add(CodeBlock*);
    void remove(CodeBlock*);

private:
    HashSet<CodeBlock*> m_codeBlocks;
    HashSet<CodeBlock*> m_currentlyExecuting;
    Lock m_lock;
};

} // namespace JSC
