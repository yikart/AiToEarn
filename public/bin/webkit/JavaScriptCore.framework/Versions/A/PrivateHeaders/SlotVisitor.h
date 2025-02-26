/*
 * Copyright (C) 2011-2023 Apple Inc. All rights reserved.
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

#include "AbstractSlotVisitor.h"
#include "HandleTypes.h"
#include <wtf/Forward.h>
#include <wtf/IterationStatus.h>
#include <wtf/MonotonicTime.h>
#include <wtf/TZoneMalloc.h>

namespace JSC {

class GCThreadSharedData;
class HeapCell;
class HeapAnalyzer;
class MarkingConstraint;
class MarkingConstraintSolver;

typedef uint32_t HeapVersion;

class SlotVisitor final : public AbstractSlotVisitor {
    WTF_MAKE_NONCOPYABLE(SlotVisitor);
    WTF_MAKE_TZONE_ALLOCATED(SlotVisitor);

    using Base = AbstractSlotVisitor;

    friend class SetCurrentCellScope;
    friend class Heap;

public:
    class ReferrerContext {
    public:
        ALWAYS_INLINE ReferrerContext(AbstractSlotVisitor&, ReferrerToken) { }
        ALWAYS_INLINE ReferrerContext(AbstractSlotVisitor&, OpaqueRootTag) { }
    };

    class SuppressGCVerifierScope {
    public:
        SuppressGCVerifierScope(SlotVisitor&) { }
    };

    class DefaultMarkingViolationAssertionScope {
    public:
#if ASSERT_ENABLED
        DefaultMarkingViolationAssertionScope(SlotVisitor& visitor)
            : m_visitor(visitor)
        {
            m_wasCheckingForDefaultMarkViolation = m_visitor.m_isCheckingForDefaultMarkViolation;
            m_visitor.m_isCheckingForDefaultMarkViolation = false;
        }

        ~DefaultMarkingViolationAssertionScope()
        {
            m_visitor.m_isCheckingForDefaultMarkViolation = m_wasCheckingForDefaultMarkViolation;
        }

    private:
        SlotVisitor& m_visitor;
        bool m_wasCheckingForDefaultMarkViolation;
#else
        DefaultMarkingViolationAssertionScope(SlotVisitor&) { }
#endif
    };

    SlotVisitor(Heap&, CString codeName);
    ~SlotVisitor();

    void append(const ConservativeRoots&) final;

    template<typename T, typename Traits> void append(const WriteBarrierBase<T, Traits>&);
    template<typename T, typename Traits> void appendHidden(const WriteBarrierBase<T, Traits>&);
    void append(const WriteBarrierStructureID&);
    void appendHidden(const WriteBarrierStructureID&);
    template<typename Iterator> void append(Iterator begin , Iterator end);
    ALWAYS_INLINE void appendValues(std::span<const WriteBarrier<Unknown, RawValueTraits<Unknown>>>);
    ALWAYS_INLINE void appendValues(const WriteBarrierBase<Unknown, RawValueTraits<Unknown>>*, size_t count);
    ALWAYS_INLINE void appendValuesHidden(const WriteBarrierBase<Unknown, RawValueTraits<Unknown>>*, size_t count);

    // These don't require you to prove that you have a WriteBarrier<>. That makes sense
    // for:
    //
    // - roots.
    // - sophisticated data structures that barrier through other means (like DFG::Plan and
    //   friends).
    //
    // If you are not a root and you don't know what kind of barrier you have, then you
    // shouldn't call these methods.
    ALWAYS_INLINE void appendUnbarriered(JSValue);
    ALWAYS_INLINE void appendUnbarriered(JSValue*, size_t);
    void appendUnbarriered(JSCell*) final;
    
    template<typename T>
    void append(const Weak<T>& weak);
    
    ALWAYS_INLINE void appendHiddenUnbarriered(JSValue);
    void appendHiddenUnbarriered(JSCell*) final;

    bool isFirstVisit() const final { return m_isFirstVisit; }

    bool isMarked(const void*) const final;
    bool isMarked(MarkedBlock&, HeapCell*) const final;
    bool isMarked(PreciseAllocation&, HeapCell*) const final;

    void didStartMarking();
    void reset();
    void clearMarkStacks();

    size_t bytesVisited() const { return m_bytesVisited; }

    void donate();
    void drain(MonotonicTime timeout = MonotonicTime::infinity());
    void donateAndDrain(MonotonicTime timeout = MonotonicTime::infinity());
    
    enum SharedDrainMode { HelperDrain, MainDrain };
    enum class SharedDrainResult { Done, TimedOut };
    SharedDrainResult drainFromShared(SharedDrainMode, MonotonicTime timeout = MonotonicTime::infinity());

    SharedDrainResult drainInParallel(MonotonicTime timeout = MonotonicTime::infinity());
    SharedDrainResult drainInParallelPassively(MonotonicTime timeout = MonotonicTime::infinity());
    
    SharedDrainResult waitForTermination(MonotonicTime timeout = MonotonicTime::infinity());

    // Attempts to perform an increment of draining that involves only walking `bytes` worth of data. This
    // is likely to accidentally walk more or less than that. It will usually mark more than bytes. It may
    // mark less than bytes if we're reaching termination or if the global worklist is empty (which may in
    // rare cases happen temporarily even if we're not reaching termination).
    size_t performIncrementOfDraining(size_t bytes);
    
    // This informs the GC about auxiliary of some size that we are keeping alive. If you don't do
    // this then the space will be freed at end of GC.
    void markAuxiliary(const void* base) final;

    void reportExtraMemoryVisited(size_t) final;
#if ENABLE(RESOURCE_USAGE)
    void reportExternalMemoryVisited(size_t) final;
#endif
    
    void dump(PrintStream&) const final;

    HeapVersion markingVersion() const { return m_markingVersion; }

    bool mutatorIsStopped() const final { return m_mutatorIsStopped; }
    
    Lock& rightToRun() WTF_RETURNS_LOCK(m_rightToRun) { return m_rightToRun; }
    
    void updateMutatorIsStopped(const AbstractLocker&);
    void updateMutatorIsStopped();
    
    bool hasAcknowledgedThatTheMutatorIsResumed() const;
    bool mutatorIsStoppedIsUpToDate() const;
    
    void optimizeForStoppedMutator();
    
    void didRace(const VisitRaceKey&) final;
    void didRace(JSCell* cell, const char* reason) { didRace(VisitRaceKey(cell, reason)); }
    
    void visitAsConstraint(const JSCell*) final;
    
    bool didReachTermination();
    
    void donateAll();

    NO_RETURN_DUE_TO_CRASH void addParallelConstraintTask(RefPtr<SharedTask<void(AbstractSlotVisitor&)>>) final;
    JS_EXPORT_PRIVATE void addParallelConstraintTask(RefPtr<SharedTask<void(SlotVisitor&)>>) final;

private:
    friend class ParallelModeEnabler;
    friend class MarkingConstraintSolver;
    
    void appendJSCellOrAuxiliary(HeapCell*);

    JS_EXPORT_PRIVATE void appendSlow(JSCell*, Dependency);
    JS_EXPORT_PRIVATE void appendHiddenSlow(JSCell*, Dependency);
    void appendHiddenSlowImpl(JSCell*, Dependency);
    
    template<typename ContainerType>
    void setMarkedAndAppendToMarkStack(ContainerType&, JSCell*, Dependency);
    
    void appendToMarkStack(JSCell*);
    
    template<typename ContainerType>
    void appendToMarkStack(ContainerType&, JSCell*);
    
    void noteLiveAuxiliaryCell(HeapCell*);
    
    void visitChildren(const JSCell*);

    void propagateExternalMemoryVisitedIfNecessary();
    
    void donateKnownParallel();
    void donateKnownParallel(MarkStackArray& from, MarkStackArray& to);

    void donateAll(const AbstractLocker&);

    bool hasWork(const AbstractLocker&);
    bool didReachTermination(const AbstractLocker&);

    template<typename Func>
    IterationStatus forEachMarkStack(const Func&);

    MarkStackArray& correspondingGlobalStack(MarkStackArray&);

    HeapVersion m_markingVersion;

    size_t m_bytesVisited { 0 };
    size_t m_nonCellVisitCount { 0 }; // Used for incremental draining, ignored otherwise.
    CheckedSize m_extraMemorySize { 0 };

    HeapAnalyzer* m_heapAnalyzer { nullptr };
    JSCell* m_currentCell { nullptr };
    bool m_isFirstVisit { false };
    bool m_mutatorIsStopped { false };
    bool m_canOptimizeForStoppedMutator { false };
    bool m_isInParallelMode { false };
    Lock m_rightToRun;
    
    // Put padding here to mitigate false sharing between multiple SlotVisitors.
    char padding[64];
#if ASSERT_ENABLED
    bool m_isCheckingForDefaultMarkViolation { false };
#endif
};

class ParallelModeEnabler {
public:
    ParallelModeEnabler(SlotVisitor& stack)
        : m_stack(stack)
    {
        ASSERT(!m_stack.m_isInParallelMode);
        m_stack.m_isInParallelMode = true;
    }
    
    ~ParallelModeEnabler()
    {
        ASSERT(m_stack.m_isInParallelMode);
        m_stack.m_isInParallelMode = false;
    }
    
private:
    SlotVisitor& m_stack;
};

} // namespace JSC
