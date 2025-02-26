/*
 * Copyright (C) 2012-2024 Apple Inc. All rights reserved.
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
#include "BlockDirectoryBits.h"
#include "CellAttributes.h"
#include "FreeList.h"
#include "LocalAllocator.h"
#include "MarkedBlock.h"
#include <wtf/DataLog.h>
#include <wtf/FastBitVector.h>
#include <wtf/MonotonicTime.h>
#include <wtf/SharedTask.h>
#include <wtf/Vector.h>

namespace WTF {
class SimpleStats;
}

namespace JSC {

class GCDeferralContext;
class Heap;
class IsoCellSet;
class MarkedSpace;
class LLIntOffsetsExtractor;

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(BlockDirectory);

class BlockDirectory {
    WTF_MAKE_NONCOPYABLE(BlockDirectory);
    WTF_MAKE_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(BlockDirectory);
    
    friend class LLIntOffsetsExtractor;

public:
    BlockDirectory(size_t cellSize);
    ~BlockDirectory();
    void setSubspace(Subspace*);
    void lastChanceToFinalize();
    void prepareForAllocation();
    void stopAllocating();
    void stopAllocatingForGood();
    void resumeAllocating();
    void beginMarkingForFullCollection();
    void endMarking();
    void snapshotUnsweptForEdenCollection();
    void snapshotUnsweptForFullCollection();
    void sweep();
    void shrink();
    void assertNoUnswept();
    size_t cellSize() const { return m_cellSize; }
    CellAttributes attributes() const { return m_attributes; }
    bool needsDestruction() const { return m_attributes.destruction == NeedsDestruction; }
    DestructionMode destruction() const { return m_attributes.destruction; }
    HeapCell::Kind cellKind() const { return m_attributes.cellKind; }

    inline void forEachBlock(const std::invocable<MarkedBlock::Handle*> auto&);
    inline void forEachNotEmptyBlock(const std::invocable<MarkedBlock::Handle*> auto&);
    
    RefPtr<SharedTask<MarkedBlock::Handle*()>> parallelNotEmptyBlockSource();
    
    void addBlock(MarkedBlock::Handle*);
    enum class WillDeleteBlock : bool { No, Yes };
    // If WillDeleteBlock::Yes is passed then the block will be left in an invalid state. We do this, however, to avoid potentially paging in / decompressing old blocks to update their handle just before freeing them.
    void removeBlock(MarkedBlock::Handle*, WillDeleteBlock = WillDeleteBlock::No);

    void updatePercentageOfPagedOutPages(WTF::SimpleStats&);
    
#if ASSERT_ENABLED
    void assertIsMutatorOrMutatorIsStopped() const WTF_ASSERTS_ACQUIRED_SHARED_LOCK(m_bitvectorLock);
    void assertSweeperIsSuspended() const WTF_ASSERTS_ACQUIRED_LOCK(m_bitvectorLock);
#else
    ALWAYS_INLINE void assertIsMutatorOrMutatorIsStopped() const WTF_ASSERTS_ACQUIRED_SHARED_LOCK(m_bitvectorLock) { }
    ALWAYS_INLINE void assertSweeperIsSuspended() const WTF_ASSERTS_ACQUIRED_LOCK(m_bitvectorLock) { }
#endif
    // This feels like it shouldn't be needed to go from assertIsMutatorOrMutatorIsStopped -> Locker but Clang's seems to think it is necessary
    // to release the capability.
    ALWAYS_INLINE void releaseAssertAcquiredBitVectorLock() const WTF_RELEASES_SHARED_CAPABILITY(m_bitvectorLock) WTF_IGNORES_THREAD_SAFETY_ANALYSIS { }

    Lock& bitvectorLock() WTF_RETURNS_LOCK(m_bitvectorLock) { return m_bitvectorLock; }

#define BLOCK_DIRECTORY_BIT_ACCESSORS(lowerBitName, capitalBitName)     \
    bool is ## capitalBitName(size_t index) const WTF_REQUIRES_SHARED_LOCK(m_bitvectorLock) { return m_bits.is ## capitalBitName(index); } \
    bool is ## capitalBitName(MarkedBlock::Handle* block) const WTF_REQUIRES_SHARED_LOCK(m_bitvectorLock) { return is ## capitalBitName(block->index()); } \
    BlockDirectoryBits::BlockDirectoryBitVectorView<BlockDirectoryBits::Kind::capitalBitName> lowerBitName ## BitsView() const WTF_REQUIRES_SHARED_LOCK(m_bitvectorLock) { return m_bits.lowerBitName(); } \
    \
    void setIs ## capitalBitName(size_t index, bool value) WTF_REQUIRES_LOCK(m_bitvectorLock) { m_bits.setIs ## capitalBitName(index, value); } \
    void setIs ## capitalBitName(MarkedBlock::Handle* block, bool value) WTF_REQUIRES_LOCK(m_bitvectorLock) { setIs ## capitalBitName(block->index(), value); } \
    BlockDirectoryBits::BlockDirectoryBitVectorRef<BlockDirectoryBits::Kind::capitalBitName> lowerBitName ## Bits() WTF_REQUIRES_LOCK(m_bitvectorLock) { return m_bits.lowerBitName(); }

    FOR_EACH_BLOCK_DIRECTORY_BIT(BLOCK_DIRECTORY_BIT_ACCESSORS)
#undef BLOCK_DIRECTORY_BIT_ACCESSORS

    template<typename Func>
    void forEachBitVector(const Func& func) WTF_REQUIRES_LOCK(m_bitvectorLock)
    {
#define BLOCK_DIRECTORY_BIT_CALLBACK(lowerBitName, capitalBitName) \
        func(m_bits.lowerBitName());
        FOR_EACH_BLOCK_DIRECTORY_BIT(BLOCK_DIRECTORY_BIT_CALLBACK);
#undef BLOCK_DIRECTORY_BIT_CALLBACK
    }
    
    template<typename Func>
    void forEachBitVectorWithName(const Func& func) const WTF_REQUIRES_SHARED_LOCK(m_bitvectorLock)
    {
#define BLOCK_DIRECTORY_BIT_CALLBACK(lowerBitName, capitalBitName) \
        func(m_bits.lowerBitName(), #capitalBitName);
        FOR_EACH_BLOCK_DIRECTORY_BIT(BLOCK_DIRECTORY_BIT_CALLBACK);
#undef BLOCK_DIRECTORY_BIT_CALLBACK
    }
    
    BlockDirectory* nextDirectory() const { return m_nextDirectory; }
    BlockDirectory* nextDirectoryInSubspace() const { return m_nextDirectoryInSubspace; }
    BlockDirectory* nextDirectoryInAlignedMemoryAllocator() const { return m_nextDirectoryInAlignedMemoryAllocator; }
    
    void setNextDirectory(BlockDirectory* directory) { m_nextDirectory = directory; }
    void setNextDirectoryInSubspace(BlockDirectory* directory) { m_nextDirectoryInSubspace = directory; }
    void setNextDirectoryInAlignedMemoryAllocator(BlockDirectory* directory) { m_nextDirectoryInAlignedMemoryAllocator = directory; }
    
    MarkedBlock::Handle* findEmptyBlockToSteal();
    
    MarkedBlock::Handle* findBlockToSweep() { return findBlockToSweep(m_unsweptCursor); }
    MarkedBlock::Handle* findBlockToSweep(unsigned& unsweptCursor);

    // FIXME: rdar://139998916
    MarkedBlock::Handle* findMarkedBlockHandleDebug(MarkedBlock*);

    void didFinishUsingBlock(MarkedBlock::Handle*);
    void didFinishUsingBlock(AbstractLocker&, MarkedBlock::Handle*) WTF_REQUIRES_LOCK(m_bitvectorLock);

    Subspace* subspace() const { return m_subspace; }
    MarkedSpace& markedSpace() const;
    
    void dump(PrintStream&) const;
    void dumpBits(PrintStream& = WTF::dataFile()) WTF_REQUIRES_SHARED_LOCK(m_bitvectorLock);

private:
    friend class IsoCellSet;
    friend class LocalAllocator;
    friend class LocalSideAllocator;
    friend class MarkedBlock;
    
    MarkedBlock::Handle* findBlockForAllocation(LocalAllocator&);
    
    MarkedBlock::Handle* tryAllocateBlock(Heap&);
    
    Vector<MarkedBlock::Handle*> m_blocks;
    Vector<unsigned> m_freeBlockIndices;

    // Mutator uses this to guard resizing the bitvectors. Those things in the GC that may run
    // concurrently to the mutator must lock this when accessing the bitvectors.
    BlockDirectoryBits m_bits WTF_GUARDED_BY_LOCK(m_bitvectorLock); // Don't access this directly use one of the accessors above.
    Lock m_bitvectorLock;
    Lock m_localAllocatorsLock;
    CellAttributes m_attributes;

    unsigned m_cellSize;
    
    // After you do something to a block based on one of these cursors, you clear the bit in the
    // corresponding bitvector and leave the cursor where it was. We can use unsigned instead of size_t since
    // this number is bound by capacity of Vector m_blocks, which must be within unsigned.
    unsigned m_emptyCursor { 0 };
    unsigned m_unsweptCursor { 0 }; // Points to the next block that is a candidate for incremental sweeping.
    
    // FIXME: All of these should probably be references.
    // https://bugs.webkit.org/show_bug.cgi?id=166988
    Subspace* m_subspace { nullptr };
    BlockDirectory* m_nextDirectory { nullptr };
    BlockDirectory* m_nextDirectoryInSubspace { nullptr };
    BlockDirectory* m_nextDirectoryInAlignedMemoryAllocator { nullptr };
    
    SentinelLinkedList<LocalAllocator, BasicRawSentinelNode<LocalAllocator>> m_localAllocators;
};

} // namespace JSC
