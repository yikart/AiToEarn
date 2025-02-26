/*
 *  Copyright (C) 1999-2000 Harri Porten (porten@kde.org)
 *  Copyright (C) 2001 Peter Kelly (pmk@post.com)
 *  Copyright (C) 2003-2024 Apple Inc. All rights reserved.
 *
 *  This library is free software; you can redistribute it and/or
 *  modify it under the terms of the GNU Lesser General Public
 *  License as published by the Free Software Foundation; either
 *  version 2 of the License, or (at your option) any later version.
 *
 *  This library is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 *  Lesser General Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public
 *  License along with this library; if not, write to the Free Software
 *  Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 *
 */

#pragma once

#include "BlockDirectory.h"
#include "MarkedBlock.h"
#include "MarkedBlockSet.h"
#include "PreciseAllocation.h"
#include <array>
#include <wtf/Bag.h>
#include <wtf/HashSet.h>
#include <wtf/IterationStatus.h>
#include <wtf/Noncopyable.h>
#include <wtf/RetainPtr.h>
#include <wtf/SentinelLinkedList.h>
#include <wtf/SinglyLinkedListWithTail.h>
#include <wtf/Vector.h>

namespace JSC {

class CompleteSubspace;
class Heap;
class HeapCell;
class HeapIterationScope;
class IsoSubspace;
class LLIntOffsetsExtractor;
class Subspace;
class WeakSet;

typedef uint32_t HeapVersion;

class MarkedSpace {
    WTF_MAKE_NONCOPYABLE(MarkedSpace);
public:
    // sizeStep is really a synonym for atomSize; it's no accident that they are the same.
    static constexpr size_t sizeStep = MarkedBlock::atomSize;
    
    // Sizes up to this amount get a size class for each size step.
    static constexpr size_t preciseCutoff = 80;
    
    // The amount of available payload in a block is the block's size minus the header.
    static constexpr size_t blockPayload = MarkedBlock::payloadSize;
    
    // The largest cell we're willing to allocate in a MarkedBlock the "normal way" (i.e. using size
    // classes, rather than a large allocation) is half the size of the payload, rounded down. This
    // ensures that we only use the size class approach if it means being able to pack two things
    // into one block.
    static constexpr size_t largeCutoff = (blockPayload / 2) & ~(sizeStep - 1);
    static_assert(largeCutoff <= UINT32_MAX);

    // We have an extra size class for size zero.
    static constexpr size_t numSizeClasses = largeCutoff / sizeStep + 1;
    
    static constexpr HeapVersion nullVersion = 0; // The version of freshly allocated blocks.
    static constexpr HeapVersion initialVersion = 2; // The version that the heap starts out with. Set to make sure that nextVersion(nullVersion) != initialVersion.
    
    static HeapVersion nextVersion(HeapVersion version)
    {
        version++;
        if (version == nullVersion)
            version = initialVersion;
        return version;
    }
    
    static size_t sizeClassToIndex(size_t size)
    {
        return (size + sizeStep - 1) / sizeStep;
    }
    
    static size_t indexToSizeClass(size_t index)
    {
        size_t result = index * sizeStep;
        ASSERT(sizeClassToIndex(result) == index);
        return result;
    }
    
    MarkedSpace(Heap*);
    ~MarkedSpace();
    
    JSC::Heap& heap() const;
    
    void lastChanceToFinalize(); // Must call stopAllocatingForGood first.
    void freeMemory();

    static size_t optimalSizeFor(size_t);
    
    void prepareForAllocation();

    void reapWeakSets();

    template<typename Visitor>
    Ref<SharedTask<void(Visitor&)>> forEachWeakInParallel(Visitor&);

    MarkedBlockSet& blocks() { return m_blocks; }

    void willStartIterating();
    bool isIterating() const { return m_isIterating; }
    void didFinishIterating();

    void stopAllocating();
    void stopAllocatingForGood();
    void resumeAllocating(); // If we just stopped allocation but we didn't do a collection, we need to resume allocation.
    
    void prepareForMarking();
    
    void prepareForConservativeScan();

    typedef HashSet<MarkedBlock*>::iterator BlockIterator;

    template<typename Functor> void forEachLiveCell(HeapIterationScope&, const Functor&);
    template<typename Functor> void forEachDeadCell(HeapIterationScope&, const Functor&);
    template<typename Functor> void forEachBlock(const Functor&);
    template<typename Functor> void forEachSubspace(const Functor&);

    void shrink();
    void freeBlock(MarkedBlock::Handle*);
    void freeOrShrinkBlock(MarkedBlock::Handle*);

    void didAddBlock(MarkedBlock::Handle*);
    void didConsumeFreeList(MarkedBlock::Handle*);
    void didAllocateInBlock(MarkedBlock::Handle*);

    // FIXME: rdar://139998916
    MarkedBlock::Handle* findMarkedBlockHandleDebug(MarkedBlock*);

    void beginMarking();
    void endMarking();
    void snapshotUnswept();
    void clearNewlyAllocated();
    void sweepBlocks();
    void sweepPreciseAllocations();
    void assertNoUnswept();
    size_t objectCount();
    size_t size();
    size_t capacity();

    bool isPagedOut();
    
    HeapVersion markingVersion() const { return m_markingVersion; }
    HeapVersion newlyAllocatedVersion() const { return m_newlyAllocatedVersion; }
    HeapVersion edenVersion() const { return m_edenVersion; }

    const Vector<PreciseAllocation*>& preciseAllocations() const { return m_preciseAllocations; }
    unsigned preciseAllocationsNurseryOffset() const { return m_preciseAllocationsNurseryOffset; }
    unsigned preciseAllocationsOffsetForThisCollection() const { return m_preciseAllocationsOffsetForThisCollection; }
    HashSet<HeapCell*>* preciseAllocationSet() const { return m_preciseAllocationSet.get(); }

    void enablePreciseAllocationTracking();
    
    // These are cached pointers and offsets for quickly searching the large allocations that are
    // relevant to this collection.
    PreciseAllocation** preciseAllocationsForThisCollectionBegin() const { return m_preciseAllocationsForThisCollectionBegin; }
    PreciseAllocation** preciseAllocationsForThisCollectionEnd() const { return m_preciseAllocationsForThisCollectionEnd; }
    unsigned preciseAllocationsForThisCollectionSize() const { return m_preciseAllocationsForThisCollectionSize; }
    
    BlockDirectory* firstDirectory() const { return m_directories.first(); }
    
    Lock& directoryLock() { return m_directoryLock; }
    void addBlockDirectory(const AbstractLocker&, BlockDirectory*);
    
    // When this is true it means that we have flipped but the mark bits haven't converged yet.
    bool isMarking() const { return m_isMarking; }
    
    void dumpBits(PrintStream& = WTF::dataFile());
    
    JS_EXPORT_PRIVATE static std::array<unsigned, numSizeClasses> s_sizeClassForSizeStep;
    
private:
    friend class CompleteSubspace;
    friend class LLIntOffsetsExtractor;
    friend class JIT;
    friend class WeakSet;
    friend class Subspace;
    friend class IsoSubspace;
    
    // Use this version when calling from within the GC where we know that the directories
    // have already been stopped.
    template<typename Functor> void forEachLiveCell(const Functor&);

    static void initializeSizeClassForStepSize();
    
    void initializeSubspace(Subspace&);

    template<typename Functor> inline void forEachDirectory(const Functor&);
    
    void addActiveWeakSet(WeakSet*);

    Vector<Subspace*> m_subspaces;

    std::unique_ptr<HashSet<HeapCell*>> m_preciseAllocationSet;
    Vector<PreciseAllocation*> m_preciseAllocations;
    unsigned m_preciseAllocationsNurseryOffset { 0 };
    unsigned m_preciseAllocationsOffsetForThisCollection { 0 };
    unsigned m_preciseAllocationsNurseryOffsetForSweep { 0 };
    unsigned m_preciseAllocationsForThisCollectionSize { 0 };
    PreciseAllocation** m_preciseAllocationsForThisCollectionBegin { nullptr };
    PreciseAllocation** m_preciseAllocationsForThisCollectionEnd { nullptr };

    size_t m_capacity { 0 };
    HeapVersion m_markingVersion { initialVersion };
    HeapVersion m_newlyAllocatedVersion { initialVersion };
    HeapVersion m_edenVersion { initialVersion };
    bool m_isIterating { false };
    bool m_isMarking { false };
    Lock m_directoryLock;
    MarkedBlockSet m_blocks;
    
    SentinelLinkedList<WeakSet, BasicRawSentinelNode<WeakSet>> m_activeWeakSets;
    SentinelLinkedList<WeakSet, BasicRawSentinelNode<WeakSet>> m_newActiveWeakSets;

    SinglyLinkedListWithTail<BlockDirectory> m_directories;

    friend class HeapVerifier;
};

template <typename Functor> inline void MarkedSpace::forEachBlock(const Functor& functor)
{
    forEachDirectory(
        [&] (BlockDirectory& directory) -> IterationStatus {
            directory.forEachBlock(functor);
            return IterationStatus::Continue;
        });
}

template <typename Functor>
void MarkedSpace::forEachDirectory(const Functor& functor)
{
    for (BlockDirectory* directory = m_directories.first(); directory; directory = directory->nextDirectory()) {
        if (functor(*directory) == IterationStatus::Done)
            return;
    }
}

template<typename Functor>
void MarkedSpace::forEachSubspace(const Functor& functor)
{
    for (auto subspace : m_subspaces) {
        if (functor(*subspace) == IterationStatus::Done)
            return;
    }
}


ALWAYS_INLINE size_t MarkedSpace::optimalSizeFor(size_t bytes)
{
    ASSERT(bytes);
    if (bytes <= preciseCutoff)
        return WTF::roundUpToMultipleOf<sizeStep>(bytes);
    if (bytes <= largeCutoff)
        return s_sizeClassForSizeStep[sizeClassToIndex(bytes)];
    return bytes;
}

} // namespace JSC
