/*
 * Copyright (C) 2016-2022 Apple Inc. All rights reserved.
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

#include "BlockDirectory.h"
#include "JSCast.h"
#include "MarkedBlock.h"
#include "MarkedSpace.h"
#include "Scribble.h"
#include "SuperSampler.h"
#include "VM.h"

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

inline unsigned MarkedBlock::Handle::cellsPerBlock()
{
    return MarkedSpace::blockPayload / cellSize();
}

inline bool MarkedBlock::isNewlyAllocatedStale() const
{
    return header().m_newlyAllocatedVersion != space()->newlyAllocatedVersion();
}

inline bool MarkedBlock::hasAnyNewlyAllocated()
{
    return !isNewlyAllocatedStale();
}

inline JSC::Heap* MarkedBlock::heap() const
{
    return &vm().heap;
}

inline MarkedSpace* MarkedBlock::space() const
{
    return &heap()->objectSpace();
}

inline MarkedSpace* MarkedBlock::Handle::space() const
{
    return &heap()->objectSpace();
}

inline bool MarkedBlock::marksConveyLivenessDuringMarking(HeapVersion markingVersion)
{
    return marksConveyLivenessDuringMarking(header().m_markingVersion, markingVersion);
}

inline bool MarkedBlock::marksConveyLivenessDuringMarking(HeapVersion myMarkingVersion, HeapVersion markingVersion)
{
    // This returns true if any of these is true:
    // - We just created the block and so the bits are clear already.
    // - This block has objects marked during the last GC, and so its version was up-to-date just
    //   before the current collection did beginMarking(). This means that any objects that have
    //   their mark bit set are valid objects that were never deleted, and so are candidates for
    //   marking in any conservative scan. Using our jargon, they are "live".
    // - We did ~2^32 collections and rotated the version back to null, so we needed to hard-reset
    //   everything. If the marks had been stale, we would have cleared them. So, we can be sure that
    //   any set mark bit reflects objects marked during last GC, i.e. "live" objects.
    // It would be absurd to use this method when not collecting, since this special "one version
    // back" state only makes sense when we're in a concurrent collection and have to be
    // conservative.
    ASSERT(space()->isMarking());
    if (heap()->collectionScope() != CollectionScope::Full)
        return false;
    return myMarkingVersion == MarkedSpace::nullVersion
        || MarkedSpace::nextVersion(myMarkingVersion) == markingVersion;
}

inline bool MarkedBlock::Handle::isAllocated()
{
    m_directory->assertIsMutatorOrMutatorIsStopped();
    return m_directory->isAllocated(this);
}

ALWAYS_INLINE bool MarkedBlock::Handle::isLive(HeapVersion markingVersion, HeapVersion newlyAllocatedVersion, bool isMarking, const HeapCell* cell)
{
    m_directory->assertIsMutatorOrMutatorIsStopped();
    if (m_directory->isAllocated(this))
        return true;

    // We need to do this while holding the lock because marks might be stale. In that case, newly
    // allocated will not yet be valid. Consider this interleaving.
    //
    // One thread is doing this:
    //
    // 1) IsLiveChecksNewlyAllocated: We check if newly allocated is valid. If it is valid, and the bit is
    //    set, we return true. Let's assume that this executes atomically. It doesn't have to in general,
    //    but we can assume that for the purpose of seeing this bug.
    //
    // 2) IsLiveChecksMarks: Having failed that, we check the mark bits. This step implies the rest of
    //    this function. It happens under a lock so it's atomic.
    //
    // Another thread is doing:
    //
    // 1) AboutToMarkSlow: This is the entire aboutToMarkSlow function, and let's say it's atomic. It
    //    sorta is since it holds a lock, but that doesn't actually make it atomic with respect to
    //    IsLiveChecksNewlyAllocated, since that does not hold a lock in our scenario.
    //
    // The harmful interleaving happens if we start out with a block that has stale mark bits that
    // nonetheless convey liveness during marking (the off-by-one version trick). The interleaving is
    // just:
    //
    // IsLiveChecksNewlyAllocated AboutToMarkSlow IsLiveChecksMarks
    //
    // We started with valid marks but invalid newly allocated. So, the first part doesn't think that
    // anything is live, but dutifully drops down to the marks step. But in the meantime, we clear the
    // mark bits and transfer their contents into newlyAllocated. So IsLiveChecksMarks also sees nothing
    // live. Ooops!
    //
    // Fortunately, since this is just a read critical section, we can use a CountingLock.
    //
    // Probably many users of CountingLock could use its lambda-based and locker-based APIs. But here, we
    // need to ensure that everything is ALWAYS_INLINE. It's hard to do that when using lambdas. It's
    // more reliable to write it inline instead. Empirically, it seems like how inline this is has some
    // impact on perf - around 2% on splay if you get it wrong.

    MarkedBlock& block = this->block();
    MarkedBlock::Header& header = block.header();

    auto count = header.m_lock.tryOptimisticFencelessRead();
    if (count.value) {
        Dependency fenceBefore = Dependency::fence(count.input);
        MarkedBlock& fencedBlock = *fenceBefore.consume(&block);
        MarkedBlock::Header& fencedHeader = fencedBlock.header();
        MarkedBlock::Handle* fencedThis = fenceBefore.consume(this);

        ASSERT_UNUSED(fencedThis, !fencedThis->isFreeListed());

        HeapVersion myNewlyAllocatedVersion = fencedHeader.m_newlyAllocatedVersion;
        if (myNewlyAllocatedVersion == newlyAllocatedVersion) {
            bool result = fencedBlock.isNewlyAllocated(cell);
            if (header.m_lock.fencelessValidate(count.value, Dependency::fence(result)))
                return result;
        } else {
            HeapVersion myMarkingVersion = fencedHeader.m_markingVersion;
            if (myMarkingVersion != markingVersion
                && (!isMarking || !fencedBlock.marksConveyLivenessDuringMarking(myMarkingVersion, markingVersion))) {
                if (header.m_lock.fencelessValidate(count.value, Dependency::fence(myMarkingVersion)))
                    return false;
            } else {
                bool result = fencedHeader.m_marks.get(block.atomNumber(cell));
                if (header.m_lock.fencelessValidate(count.value, Dependency::fence(result)))
                    return result;
            }
        }
    }

    Locker locker { header.m_lock };

    ASSERT(!isFreeListed());

    HeapVersion myNewlyAllocatedVersion = header.m_newlyAllocatedVersion;
    if (myNewlyAllocatedVersion == newlyAllocatedVersion)
        return block.isNewlyAllocated(cell);

    if (block.areMarksStale(markingVersion)) {
        if (!isMarking)
            return false;
        if (!block.marksConveyLivenessDuringMarking(markingVersion))
            return false;
    }

    return header.m_marks.get(block.atomNumber(cell));
}

inline bool MarkedBlock::Handle::isLiveCell(HeapVersion markingVersion, HeapVersion newlyAllocatedVersion, bool isMarking, const void* p)
{
    if (!m_block->isAtom(p))
        return false;
    return isLive(markingVersion, newlyAllocatedVersion, isMarking, static_cast<const HeapCell*>(p));
}

inline bool MarkedBlock::Handle::isLive(const HeapCell* cell)
{
    return isLive(space()->markingVersion(), space()->newlyAllocatedVersion(), space()->isMarking(), cell);
}

inline bool MarkedBlock::Handle::isLiveCell(const void* p)
{
    return isLiveCell(space()->markingVersion(), space()->newlyAllocatedVersion(), space()->isMarking(), p);
}

inline bool MarkedBlock::Handle::areMarksStaleForSweep()
{
    return marksMode() == MarksStale;
}

// The following has to be true for specialization to kick in:
//
// sweepMode == SweepToFreeList
// scribbleMode == DontScribble
// newlyAllocatedMode == DoesNotHaveNewlyAllocated
// destructionMode != BlockHasDestructorsAndCollectorIsRunning
//
// emptyMode = IsEmpty
//     destructionMode = DoesNotNeedDestruction
//         marksMode = MarksNotStale (1)
//         marksMode = MarksStale (2)
// emptyMode = NotEmpty
//     destructionMode = DoesNotNeedDestruction
//         marksMode = MarksNotStale (3)
//         marksMode = MarksStale (4)
//     destructionMode = NeedsDestruction
//         marksMode = MarksNotStale (5)
//         marksMode = MarksStale (6)
//
// Only the DoesNotNeedDestruction one should be specialized by MarkedBlock.

template<size_t storageSize, bool alwaysFitsOnStack>
class DeadCellStorage {
public:
    DeadCellStorage() = default;
    void append(MarkedBlock::AtomNumberType cell) { return m_deadCells.append(cell); }
    std::span<const MarkedBlock::AtomNumberType> span() const { return m_deadCells.span(); }
private:
    Vector<MarkedBlock::AtomNumberType, storageSize> m_deadCells;
};

template<size_t storageSize>
class DeadCellStorage<storageSize, true> {
public:
    DeadCellStorage() = default;
    void append(MarkedBlock::AtomNumberType cell) { m_deadCells[m_size++] = cell; }
    std::span<const MarkedBlock::AtomNumberType> span() const { return { m_deadCells.data(), m_size }; }
private:
    std::array<MarkedBlock::AtomNumberType, storageSize> m_deadCells;
    size_t m_size { 0 };
};

template<bool specialize, MarkedBlock::Handle::EmptyMode specializedEmptyMode, MarkedBlock::Handle::SweepMode specializedSweepMode, MarkedBlock::Handle::SweepDestructionMode specializedDestructionMode, MarkedBlock::Handle::ScribbleMode specializedScribbleMode, MarkedBlock::Handle::NewlyAllocatedMode specializedNewlyAllocatedMode, MarkedBlock::Handle::MarksMode specializedMarksMode, typename DestroyFunc>
void MarkedBlock::Handle::specializedSweep(FreeList* freeList, MarkedBlock::Handle::EmptyMode emptyMode, MarkedBlock::Handle::SweepMode sweepMode, MarkedBlock::Handle::SweepDestructionMode destructionMode, MarkedBlock::Handle::ScribbleMode scribbleMode, MarkedBlock::Handle::NewlyAllocatedMode newlyAllocatedMode, MarkedBlock::Handle::MarksMode marksMode, const DestroyFunc& destroyFunc)
{
    if (specialize) {
        emptyMode = specializedEmptyMode;
        sweepMode = specializedSweepMode;
        destructionMode = specializedDestructionMode;
        scribbleMode = specializedScribbleMode;
        newlyAllocatedMode = specializedNewlyAllocatedMode;
        marksMode = specializedMarksMode;
    }

    RELEASE_ASSERT(!(destructionMode == BlockHasNoDestructors && sweepMode == SweepOnly));

    SuperSamplerScope superSamplerScope(false);

    MarkedBlock& block = this->block();
    MarkedBlock::Header& header = block.header();

    if (false)
        dataLog(RawPointer(this), "/", RawPointer(&block), ": MarkedBlock::Handle::specializedSweep!\n");

    unsigned cellSize = this->cellSize();

    VM& vm = this->vm();
    uint64_t secret = vm.heapRandom().getUint64();
    auto destroy = [&] (void* cell) {
        JSCell* jsCell = static_cast<JSCell*>(cell);
        if (!jsCell->isZapped()) {
            destroyFunc(vm, jsCell);
            jsCell->zap(HeapCell::Destruction);
        }
    };

    auto setBits = [&] (bool isEmpty) ALWAYS_INLINE_LAMBDA {
        Locker locker { m_directory->bitvectorLock() };
        m_directory->setIsUnswept(this, false);
        m_directory->setIsDestructible(this, false);
        m_directory->setIsEmpty(this, false);
        if (sweepMode == SweepToFreeList)
            m_isFreeListed = true;
        else if (isEmpty)
            m_directory->setIsEmpty(this, true);
    };
    UNUSED_PARAM(setBits);

    if (Options::useBumpAllocator()
        && emptyMode == IsEmpty
        && newlyAllocatedMode == DoesNotHaveNewlyAllocated) {

        // This is an incredibly powerful assertion that checks the sanity of our block bits.
        if (marksMode == MarksNotStale && !header.m_marks.isEmpty()) {
            WTF::dataFile().atomically(
                [&] (PrintStream& out) {
                    out.print("Block ", RawPointer(&block), ": marks not empty!\n");
                    out.print("Block lock is held: ", header.m_lock.isHeld(), "\n");
                    out.print("Marking version of block: ", header.m_markingVersion, "\n");
                    out.print("Marking version of heap: ", space()->markingVersion(), "\n");
                    UNREACHABLE_FOR_PLATFORM();
                });
        }

        char* payloadEnd = std::bit_cast<char*>(block.atoms() + numberOfAtoms);
        char* payloadBegin = std::bit_cast<char*>(block.atoms() + m_startAtom);
        RELEASE_ASSERT(static_cast<size_t>(payloadEnd - payloadBegin) <= payloadSize, payloadBegin, payloadEnd, &block, cellSize, m_startAtom);

        setBits(true);
        if (space()->isMarking())
            header.m_lock.unlock();
        if (destructionMode != BlockHasNoDestructors) {
            for (char* cell = payloadBegin; cell < payloadEnd; cell += cellSize)
                destroy(cell);
        }
        if (sweepMode == SweepToFreeList) {
            if (UNLIKELY(scribbleMode == Scribble))
                scribble(payloadBegin, payloadEnd - payloadBegin);
            FreeCell* interval = reinterpret_cast_ptr<FreeCell*>(payloadBegin);
            interval->makeLast(payloadEnd - payloadBegin, secret);
            freeList->initialize(interval, secret, payloadEnd - payloadBegin);
        }
        if (false)
            dataLog("Quickly swept block ", RawPointer(this), " with cell size ", cellSize, " and attributes ", m_attributes, ": ", pointerDump(freeList), "\n");
        return;
    }

    // This produces a free list that is ordered in reverse through the block.
    // This is fine, since the allocation code makes no assumptions about the
    // order of the free list.
    size_t freedBytes = 0;
    bool isEmpty = true;
    FreeCell* head = nullptr;
    size_t currentInterval = 0;
    size_t previousDeadCell = 0;

    // We try to allocate the deadCells vector entirely on the stack if possible.
    // Otherwise, we use the maximum permitted space (currently 8kB) to store as
    // many elements as possible. If we know that all the atoms in the block will
    // fit in the stack buffer, however, we can use unchecked append instead of
    // checked.
    constexpr size_t maxDeadCellBufferBytes = 8 * KB; // Arbitrary limit of 8kB for stack buffer.
    constexpr size_t deadCellBufferBytes = std::min(atomsPerBlock * sizeof(AtomNumberType), maxDeadCellBufferBytes);
    static_assert(deadCellBufferBytes <= maxDeadCellBufferBytes);
    constexpr bool deadCellsAlwaysFitsOnStack = (deadCellBufferBytes / sizeof(AtomNumberType)) <= atomsPerBlock;
    DeadCellStorage<deadCellBufferBytes / sizeof(AtomNumberType), deadCellsAlwaysFitsOnStack> deadCells;

    auto handleDeadCell = [&] (size_t i) {
        HeapCell* cell = reinterpret_cast_ptr<HeapCell*>(&block.atoms()[i]);
        if (destructionMode != BlockHasNoDestructors)
            destroy(cell);
        if (sweepMode == SweepToFreeList) {
            if (UNLIKELY(scribbleMode == Scribble))
                scribble(cell, cellSize);

            // The following check passing implies there was at least one live cell
            // between us and the last dead cell, meaning that the previous dead
            // cell is the start of its interval.
            if (i + m_atomsPerCell < previousDeadCell) {
                size_t intervalLength = currentInterval * atomSize;
                FreeCell* cell = reinterpret_cast_ptr<FreeCell*>(&block.atoms()[previousDeadCell]);
                if (LIKELY(head))
                    cell->setNext(head, intervalLength, secret);
                else
                    cell->makeLast(intervalLength, secret);
                freedBytes += intervalLength;
                head = cell;
                currentInterval = 0;
            }
            currentInterval += m_atomsPerCell;
            previousDeadCell = i;
        }
    };

    auto checkForFinalInterval = [&] () {
        if (sweepMode == SweepToFreeList && currentInterval) {
            size_t intervalLength = currentInterval * atomSize;
            FreeCell* cell = reinterpret_cast_ptr<FreeCell*>(&block.atoms()[previousDeadCell]);

            if (LIKELY(head))
                cell->setNext(head, intervalLength, secret);
            else
                cell->makeLast(intervalLength, secret);
            freedBytes += intervalLength;
            head = cell;
        }
    };

    for (int i = endAtom - m_atomsPerCell; i >= static_cast<int>(m_startAtom); i -= m_atomsPerCell) {
        if (emptyMode == NotEmpty
            && ((marksMode == MarksNotStale && header.m_marks.get(i))
                || (newlyAllocatedMode == HasNewlyAllocated && header.m_newlyAllocated.get(i)))) {
            isEmpty = false;
            continue;
        }

        if (destructionMode == BlockHasDestructorsAndCollectorIsRunning)
            deadCells.append(i);
        else
            handleDeadCell(i);
    }
    if (destructionMode != BlockHasDestructorsAndCollectorIsRunning)
        checkForFinalInterval(); // We need this to handle the first interval in the block, since it has no dead cells before it.

    // We only want to discard the newlyAllocated bits if we're creating a FreeList,
    // otherwise we would lose information on what's currently alive.
    if (sweepMode == SweepToFreeList && newlyAllocatedMode == HasNewlyAllocated)
        header.m_newlyAllocatedVersion = MarkedSpace::nullVersion;

    if (space()->isMarking())
        header.m_lock.unlock();

    if (destructionMode == BlockHasDestructorsAndCollectorIsRunning) {
        for (size_t i : deadCells.span())
            handleDeadCell(i);
        checkForFinalInterval();
    }

    if (sweepMode == SweepToFreeList)
        freeList->initialize(head, secret, freedBytes);
    setBits(isEmpty);

    if (false)
        dataLog("Slowly swept block ", RawPointer(&block), " with cell size ", cellSize, " and attributes ", m_attributes, ": ", pointerDump(freeList), "\n");
}

template<typename DestroyFunc>
void MarkedBlock::Handle::finishSweepKnowingHeapCellType(FreeList* freeList, const DestroyFunc& destroyFunc)
{
    SweepMode sweepMode = freeList ? SweepToFreeList : SweepOnly;
    SweepDestructionMode destructionMode = this->sweepDestructionMode();
    EmptyMode emptyMode = this->emptyMode();
    ScribbleMode scribbleMode = this->scribbleMode();
    NewlyAllocatedMode newlyAllocatedMode = this->newlyAllocatedMode();
    MarksMode marksMode = this->marksMode();

    auto trySpecialized = [&] () -> bool {
        if (scribbleMode != DontScribble)
            return false;
        if (newlyAllocatedMode != DoesNotHaveNewlyAllocated)
            return false;
        if (destructionMode != BlockHasDestructors)
            return false;

        switch (emptyMode) {
        case IsEmpty:
            switch (sweepMode) {
            case SweepOnly:
                switch (marksMode) {
                case MarksNotStale:
                    specializedSweep<true, IsEmpty, SweepOnly, BlockHasDestructors, DontScribble, DoesNotHaveNewlyAllocated, MarksNotStale>(freeList, IsEmpty, SweepOnly, BlockHasDestructors, DontScribble, DoesNotHaveNewlyAllocated, MarksNotStale, destroyFunc);
                    return true;
                case MarksStale:
                    specializedSweep<true, IsEmpty, SweepOnly, BlockHasDestructors, DontScribble, DoesNotHaveNewlyAllocated, MarksStale>(freeList, IsEmpty, SweepOnly, BlockHasDestructors, DontScribble, DoesNotHaveNewlyAllocated, MarksStale, destroyFunc);
                    return true;
                }
                RELEASE_ASSERT_NOT_REACHED();
            case SweepToFreeList:
                switch (marksMode) {
                case MarksNotStale:
                    specializedSweep<true, IsEmpty, SweepToFreeList, BlockHasDestructors, DontScribble, DoesNotHaveNewlyAllocated, MarksNotStale>(freeList, IsEmpty, SweepToFreeList, BlockHasDestructors, DontScribble, DoesNotHaveNewlyAllocated, MarksNotStale, destroyFunc);
                    return true;
                case MarksStale:
                    specializedSweep<true, IsEmpty, SweepToFreeList, BlockHasDestructors, DontScribble, DoesNotHaveNewlyAllocated, MarksStale>(freeList, IsEmpty, SweepToFreeList, BlockHasDestructors, DontScribble, DoesNotHaveNewlyAllocated, MarksStale, destroyFunc);
                    return true;
                }
            }
            RELEASE_ASSERT_NOT_REACHED();
        case NotEmpty:
            switch (sweepMode) {
            case SweepOnly:
                switch (marksMode) {
                case MarksNotStale:
                    specializedSweep<true, NotEmpty, SweepOnly, BlockHasDestructors, DontScribble, DoesNotHaveNewlyAllocated, MarksNotStale>(freeList, NotEmpty, SweepOnly, BlockHasDestructors, DontScribble, DoesNotHaveNewlyAllocated, MarksNotStale, destroyFunc);
                    return true;
                case MarksStale:
                    specializedSweep<true, NotEmpty, SweepOnly, BlockHasDestructors, DontScribble, DoesNotHaveNewlyAllocated, MarksStale>(freeList, NotEmpty, SweepOnly, BlockHasDestructors, DontScribble, DoesNotHaveNewlyAllocated, MarksStale, destroyFunc);
                    return true;
                }
                RELEASE_ASSERT_NOT_REACHED();
            case SweepToFreeList:
                switch (marksMode) {
                case MarksNotStale:
                    specializedSweep<true, NotEmpty, SweepToFreeList, BlockHasDestructors, DontScribble, DoesNotHaveNewlyAllocated, MarksNotStale>(freeList, NotEmpty, SweepToFreeList, BlockHasDestructors, DontScribble, DoesNotHaveNewlyAllocated, MarksNotStale, destroyFunc);
                    return true;
                case MarksStale:
                    specializedSweep<true, NotEmpty, SweepToFreeList, BlockHasDestructors, DontScribble, DoesNotHaveNewlyAllocated, MarksStale>(freeList, NotEmpty, SweepToFreeList, BlockHasDestructors, DontScribble, DoesNotHaveNewlyAllocated, MarksStale, destroyFunc);
                    return true;
                }
            }
        }

        return false;
    };

    if (trySpecialized())
        return;

    // The template arguments don't matter because the first one is false.
    specializedSweep<false, IsEmpty, SweepOnly, BlockHasNoDestructors, DontScribble, HasNewlyAllocated, MarksStale>(freeList, emptyMode, sweepMode, destructionMode, scribbleMode, newlyAllocatedMode, marksMode, destroyFunc);
}

inline MarkedBlock::Handle::SweepDestructionMode MarkedBlock::Handle::sweepDestructionMode()
{
    if (m_attributes.destruction == NeedsDestruction) {
        if (space()->isMarking())
            return BlockHasDestructorsAndCollectorIsRunning;
        return BlockHasDestructors;
    }
    return BlockHasNoDestructors;
}

inline bool MarkedBlock::Handle::isEmpty()
{
    m_directory->assertIsMutatorOrMutatorIsStopped();
    return m_directory->isEmpty(this);
}

inline MarkedBlock::Handle::EmptyMode MarkedBlock::Handle::emptyMode()
{
    // It's not obvious, but this is the only way to know if the block is empty. It's the only
    // bit that captures these caveats:
    // - It's true when the block is freshly allocated.
    // - It's true if the block had been swept in the past, all destructors were called, and that
    //   sweep proved that the block is empty.
    return isEmpty() ? IsEmpty : NotEmpty;
}

inline MarkedBlock::Handle::ScribbleMode MarkedBlock::Handle::scribbleMode()
{
    return scribbleFreeCells() ? Scribble : DontScribble;
}

inline MarkedBlock::Handle::NewlyAllocatedMode MarkedBlock::Handle::newlyAllocatedMode()
{
    return block().hasAnyNewlyAllocated() ? HasNewlyAllocated : DoesNotHaveNewlyAllocated;
}

inline MarkedBlock::Handle::MarksMode MarkedBlock::Handle::marksMode()
{
    HeapVersion markingVersion = space()->markingVersion();
    bool marksAreUseful = !block().areMarksStale(markingVersion);
    if (space()->isMarking())
        marksAreUseful |= block().marksConveyLivenessDuringMarking(markingVersion);
    return marksAreUseful ? MarksNotStale : MarksStale;
}

template <typename Functor>
inline IterationStatus MarkedBlock::Handle::forEachLiveCell(const Functor& functor)
{
    // FIXME: This is not currently efficient to use in the constraint solver because isLive() grabs a
    // lock to protect itself from concurrent calls to aboutToMarkSlow(). But we could get around this by
    // having this function grab the lock before and after the iteration, and check if the marking version
    // changed. If it did, just run again. Inside the loop, we only need to ensure that if a race were to
    // happen, we will just overlook objects. I think that because of how aboutToMarkSlow() does things,
    // a race ought to mean that it just returns false when it should have returned true - but this is
    // something that would have to be verified carefully.
    //
    // NOTE: Some users of forEachLiveCell require that their callback is called exactly once for
    // each live cell. We could optimize this function for those users by using a slow loop if the
    // block is in marks-mean-live mode. That would only affect blocks that had partial survivors
    // during the last collection and no survivors (yet) during this collection.
    //
    // https://bugs.webkit.org/show_bug.cgi?id=180315

    HeapCell::Kind kind = m_attributes.cellKind;
    for (size_t i = m_startAtom; i < endAtom; i += m_atomsPerCell) {
        HeapCell* cell = reinterpret_cast_ptr<HeapCell*>(&m_block->atoms()[i]);
        if (!isLive(cell))
            continue;

        if (functor(i, cell, kind) == IterationStatus::Done)
            return IterationStatus::Done;
    }
    return IterationStatus::Continue;
}

template <typename Functor>
inline IterationStatus MarkedBlock::Handle::forEachDeadCell(const Functor& functor)
{
    HeapCell::Kind kind = m_attributes.cellKind;
    for (size_t i = m_startAtom; i < endAtom; i += m_atomsPerCell) {
        HeapCell* cell = reinterpret_cast_ptr<HeapCell*>(&m_block->atoms()[i]);
        if (isLive(cell))
            continue;

        if (functor(cell, kind) == IterationStatus::Done)
            return IterationStatus::Done;
    }
    return IterationStatus::Continue;
}

template <typename Functor>
inline IterationStatus MarkedBlock::Handle::forEachMarkedCell(const Functor& functor)
{
    HeapCell::Kind kind = m_attributes.cellKind;
    MarkedBlock& block = this->block();
    bool areMarksStale = block.areMarksStale();
    WTF::loadLoadFence();
    if (areMarksStale)
        return IterationStatus::Continue;
    for (size_t i = m_startAtom; i < endAtom; i += m_atomsPerCell) {
        if (!block.header().m_marks.get(i))
            continue;

        HeapCell* cell = reinterpret_cast_ptr<HeapCell*>(&m_block->atoms()[i]);

        if (functor(i, cell, kind) == IterationStatus::Done)
            return IterationStatus::Done;
    }
    return IterationStatus::Continue;
}

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
