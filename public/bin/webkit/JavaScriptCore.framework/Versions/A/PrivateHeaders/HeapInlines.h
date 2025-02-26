/*
 * Copyright (C) 2014-2022 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "GCDeferralContext.h"
#include "Heap.h"
#include "HeapCellInlines.h"
#include "IndexingHeader.h"
#include "JSCast.h"
#include "Structure.h"
#include <type_traits>
#include <wtf/Assertions.h>
#include <wtf/MainThread.h>

namespace JSC {

ALWAYS_INLINE VM& Heap::vm() const
{
    return *std::bit_cast<VM*>(std::bit_cast<uintptr_t>(this) - OBJECT_OFFSETOF(VM, heap));
}

ALWAYS_INLINE JSC::Heap* Heap::heap(const HeapCell* cell)
{
    if (!cell)
        return nullptr;
    return cell->heap();
}

inline JSC::Heap* Heap::heap(const JSValue v)
{
    if (!v.isCell())
        return nullptr;
    return heap(v.asCell());
}

inline bool Heap::hasHeapAccess() const
{
    return m_worldState.load() & hasAccessBit;
}

inline bool Heap::worldIsStopped() const
{
    return m_worldIsStopped;
}

ALWAYS_INLINE bool Heap::isMarked(const void* rawCell)
{
    ASSERT(!m_isMarkingForGCVerifier);
    HeapCell* cell = std::bit_cast<HeapCell*>(rawCell);
    if (cell->isPreciseAllocation())
        return cell->preciseAllocation().isMarked();
    MarkedBlock& block = cell->markedBlock();
    return block.isMarked(m_objectSpace.markingVersion(), cell);
}

ALWAYS_INLINE bool Heap::testAndSetMarked(HeapVersion markingVersion, const void* rawCell)
{
    HeapCell* cell = std::bit_cast<HeapCell*>(rawCell);
    if (cell->isPreciseAllocation())
        return cell->preciseAllocation().testAndSetMarked();
    MarkedBlock& block = cell->markedBlock();
    Dependency dependency = block.aboutToMark(markingVersion, cell);
    return block.testAndSetMarked(cell, dependency);
}

ALWAYS_INLINE size_t Heap::cellSize(const void* rawCell)
{
    return std::bit_cast<HeapCell*>(rawCell)->cellSize();
}

inline void Heap::writeBarrier(const JSCell* from, JSValue to)
{
#if ENABLE(WRITE_BARRIER_PROFILING)
    WriteBarrierCounters::countWriteBarrier();
#endif
    if (!to.isCell())
        return;
    writeBarrier(from, to.asCell());
}

inline void Heap::writeBarrier(const JSCell* from, JSCell* to)
{
#if ENABLE(WRITE_BARRIER_PROFILING)
    WriteBarrierCounters::countWriteBarrier();
#endif
    if (!from)
        return;
    if (LIKELY(!to))
        return;
    if (!isWithinThreshold(from->cellState(), barrierThreshold()))
        return;
    writeBarrierSlowPath(from);
}

inline void Heap::writeBarrier(const JSCell* from)
{
    ASSERT_GC_OBJECT_LOOKS_VALID(const_cast<JSCell*>(from));
    if (!from)
        return;
    if (UNLIKELY(isWithinThreshold(from->cellState(), barrierThreshold())))
        writeBarrierSlowPath(from);
}

inline void Heap::mutatorFence()
{
    if (isX86() || UNLIKELY(mutatorShouldBeFenced()))
        WTF::storeStoreFence();
}

template<typename Functor> inline void Heap::forEachCodeBlock(const Functor& func)
{
    forEachCodeBlockImpl(scopedLambdaRef<void(CodeBlock*)>(func));
}

template<typename Functor> inline void Heap::forEachCodeBlockIgnoringJITPlans(const AbstractLocker& codeBlockSetLocker, const Functor& func)
{
    forEachCodeBlockIgnoringJITPlansImpl(codeBlockSetLocker, scopedLambdaRef<void(CodeBlock*)>(func));
}

template<typename Functor> inline void Heap::forEachProtectedCell(const Functor& functor)
{
    for (auto& pair : m_protectedValues)
        functor(pair.key);
    m_handleSet.forEachStrongHandle(functor, m_protectedValues);
}

#if USE(FOUNDATION)
template <typename T>
inline void Heap::releaseSoon(RetainPtr<T>&& object)
{
    m_delayedReleaseObjects.append(WTFMove(object));
}
#endif

#ifdef JSC_GLIB_API_ENABLED
inline void Heap::releaseSoon(std::unique_ptr<JSCGLibWrapperObject>&& object)
{
    m_delayedReleaseObjects.append(WTFMove(object));
}
#endif

inline void Heap::incrementDeferralDepth()
{
    ASSERT(!Thread::mayBeGCThread() || m_worldIsStopped);
    m_deferralDepth++;
}

inline void Heap::decrementDeferralDepth()
{
    ASSERT(!Thread::mayBeGCThread() || m_worldIsStopped);
    m_deferralDepth--;
}

inline void Heap::decrementDeferralDepthAndGCIfNeeded()
{
    ASSERT(!Thread::mayBeGCThread() || m_worldIsStopped);
    m_deferralDepth--;
    
    if (UNLIKELY(m_didDeferGCWork) || Options::forceDidDeferGCWork()) {
        decrementDeferralDepthAndGCIfNeededSlow();
        
        // Here are the possible relationships between m_deferralDepth and m_didDeferGCWork.
        // Note that prior to the call to decrementDeferralDepthAndGCIfNeededSlow,
        // m_didDeferGCWork had to have been true. Now it can be either false or true. There is
        // nothing we can reliably assert.
        //
        // Possible arrangements of m_didDeferGCWork and !!m_deferralDepth:
        //
        // Both false: We popped out of all DeferGCs and we did whatever work was deferred.
        //
        // Only m_didDeferGCWork is true: We stopped for GC and the GC did DeferGC. This is
        // possible because of how we handle the baseline JIT's worklist. It's also perfectly
        // safe because it only protects reportExtraMemory. We can just ignore this.
        //
        // Only !!m_deferralDepth is true: m_didDeferGCWork had been set spuriously. It is only
        // cleared by decrementDeferralDepthAndGCIfNeededSlow(). So, if we had deferred work but
        // then decrementDeferralDepth()'d, then we might have the bit set even if we GC'd since
        // then.
        //
        // Both true: We're in a recursive ~DeferGC. We wanted to do something about the
        // deferred work, but were unable to.
    }
}

inline HashSet<MarkedVectorBase*>& Heap::markListSet()
{
    return m_markListSet;
}

inline void Heap::reportExtraMemoryAllocated(const JSCell* cell, size_t size)
{
    if (size > minExtraMemory)
        reportExtraMemoryAllocatedSlowCase(nullptr, cell, size);
}

inline void Heap::reportExtraMemoryAllocated(GCDeferralContext* deferralContext, const JSCell* cell, size_t size)
{
    if (size > minExtraMemory)
        reportExtraMemoryAllocatedSlowCase(deferralContext, cell, size);
}

inline void Heap::deprecatedReportExtraMemory(size_t size)
{
    if (size > minExtraMemory) 
        deprecatedReportExtraMemorySlowCase(size);
}

inline void Heap::acquireAccess()
{
    if constexpr (validateDFGDoesGC)
        vm().verifyCanGC();

    if (m_worldState.compareExchangeWeak(0, hasAccessBit))
        return;
    acquireAccessSlow();
}

inline bool Heap::hasAccess() const
{
    return m_worldState.loadRelaxed() & hasAccessBit;
}

inline void Heap::releaseAccess()
{
    if (m_worldState.compareExchangeWeak(hasAccessBit, 0))
        return;
    releaseAccessSlow();
}

inline bool Heap::mayNeedToStop()
{
    return m_worldState.loadRelaxed() != hasAccessBit;
}

inline void Heap::stopIfNecessary()
{
    if constexpr (validateDFGDoesGC)
        vm().verifyCanGC();

    if (mayNeedToStop())
        stopIfNecessarySlow();
}

template<typename Func>
void Heap::forEachSlotVisitor(const Func& func)
{
    func(*m_collectorSlotVisitor);
    func(*m_mutatorSlotVisitor);
    for (auto& visitor : m_parallelSlotVisitors)
        func(*visitor);
}

namespace GCClient {

ALWAYS_INLINE VM& Heap::vm() const
{
    return *std::bit_cast<VM*>(std::bit_cast<uintptr_t>(this) - OBJECT_OFFSETOF(VM, clientHeap));
}

} // namespace GCClient

} // namespace JSC
