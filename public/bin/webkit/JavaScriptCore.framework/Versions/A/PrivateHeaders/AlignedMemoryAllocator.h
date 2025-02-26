/*
 * Copyright (C) 2017-2018 Apple Inc. All rights reserved.
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

#include <wtf/PrintStream.h>
#include <wtf/SinglyLinkedListWithTail.h>

namespace JSC {

class BlockDirectory;
class Heap;
class Subspace;

class AlignedMemoryAllocator {
    WTF_MAKE_NONCOPYABLE(AlignedMemoryAllocator);
    WTF_MAKE_FAST_ALLOCATED;
public:
    AlignedMemoryAllocator();
    virtual ~AlignedMemoryAllocator();
    
    virtual void* tryAllocateAlignedMemory(size_t alignment, size_t size) = 0;
    virtual void freeAlignedMemory(void*) = 0;
    
    // This can't be pure virtual as it breaks our Dumpable concept.
    // FIXME: Make this virtual after we stop suppporting the Montery Clang.
    virtual void dump(PrintStream&) const { }

    void registerDirectory(Heap&, BlockDirectory*);
    BlockDirectory* firstDirectory() const { return m_directories.first(); }

    void registerSubspace(Subspace*);

    // Some of derived memory allocators do not have these features because they do not use them.
    // For example, IsoAlignedMemoryAllocator does not have "realloc" feature since it never extends / shrinks the allocated memory region.
    virtual void* tryAllocateMemory(size_t) = 0;
    virtual void freeMemory(void*) = 0;
    virtual void* tryReallocateMemory(void*, size_t) = 0;

private:
    SinglyLinkedListWithTail<BlockDirectory> m_directories;
    SinglyLinkedListWithTail<Subspace> m_subspaces;
};

} // namespace WTF

