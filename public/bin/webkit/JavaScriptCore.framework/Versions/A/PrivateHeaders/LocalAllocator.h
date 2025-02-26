/*
 * Copyright (C) 2018-2022 Apple Inc. All rights reserved.
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

#include "AllocationFailureMode.h"
#include "FreeList.h"
#include "MarkedBlock.h"
#include <wtf/Noncopyable.h>

namespace JSC {

class BlockDirectory;
class GCDeferralContext;
class Heap;

class LocalAllocator : public BasicRawSentinelNode<LocalAllocator> {
    WTF_MAKE_NONCOPYABLE(LocalAllocator);
    
public:
    LocalAllocator(BlockDirectory*);
    JS_EXPORT_PRIVATE ~LocalAllocator();
    
    void* allocate(Heap&, size_t cellSize, GCDeferralContext*, AllocationFailureMode);
    
    unsigned cellSize() const { return m_freeList.cellSize(); }

    void stopAllocating();
    void prepareForAllocation();
    void resumeAllocating();
    void stopAllocatingForGood();
    
    static constexpr ptrdiff_t offsetOfFreeList();
    static constexpr ptrdiff_t offsetOfCellSize();

    BlockDirectory& directory() const { return *m_directory; }

private:
    friend class BlockDirectory;
    
    void reset();
    JS_EXPORT_PRIVATE void* allocateSlowCase(Heap&, size_t, GCDeferralContext*, AllocationFailureMode);
    void didConsumeFreeList();
    void* tryAllocateWithoutCollecting(size_t);
    void* tryAllocateIn(MarkedBlock::Handle*, size_t);
    void* allocateIn(MarkedBlock::Handle*, size_t cellSize);
    ALWAYS_INLINE void doTestCollectionsIfNeeded(Heap&, GCDeferralContext*);

    BlockDirectory* m_directory;
    FreeList m_freeList;

    MarkedBlock::Handle* m_currentBlock { nullptr };
    MarkedBlock::Handle* m_lastActiveBlock { nullptr };
    
    // After you do something to a block based on one of these cursors, you clear the bit in the
    // corresponding bitvector and leave the cursor where it was.
    unsigned m_allocationCursor { 0 }; // Points to the next block that is a candidate for allocation.
};

inline constexpr ptrdiff_t LocalAllocator::offsetOfFreeList()
{
    return OBJECT_OFFSETOF(LocalAllocator, m_freeList);
}

inline constexpr ptrdiff_t LocalAllocator::offsetOfCellSize()
{
    return OBJECT_OFFSETOF(LocalAllocator, m_freeList) + FreeList::offsetOfCellSize();
}

} // namespace JSC

