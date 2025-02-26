/*
 * Copyright (C) 2021-2023 Apple Inc. All rights reserved.
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

#include "JSCJSValue.h"
#include "MarkStack.h"
#include "RootMarkReason.h"
#include "VisitRaceKey.h"
#include <wtf/ConcurrentPtrHashSet.h>
#include <wtf/SharedTask.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/text/CString.h>

namespace JSC {

class ConservativeRoots;
class Heap;
class HeapCell;
class JSCell;
class MarkedBlock;
class MarkingConstraint;
class MarkingConstraintSolver;
class PreciseAllocation;
class SlotVisitor;
class VM;
class VerifierSlotVisitor;
template<typename T> class Weak;
template<typename T, typename Traits> class WriteBarrierBase;
template<typename T, typename Traits> class WriteBarrier;
class WriteBarrierStructureID;

class AbstractSlotVisitor {
    WTF_MAKE_NONCOPYABLE(AbstractSlotVisitor);
    WTF_MAKE_TZONE_ALLOCATED(AbstractSlotVisitor);
public:
    enum OpaqueRootTag { OpaqueRoot };

    class ReferrerToken {
    public:
        ReferrerToken() = default;
        ReferrerToken(std::nullptr_t) { }
        ReferrerToken(HeapCell*);
        ReferrerToken(OpaqueRootTag, void* opaqueRoot);
        ReferrerToken(RootMarkReason);

        explicit operator bool() const { return m_bits; }
        bool operator!() const { return !m_bits; }

        HeapCell* asCell() const;
        void* asOpaqueRoot() const;
        RootMarkReason asRootMarkReason() const;

    private:
        enum {
            HeapCellToken = 0,
            OpaqueRootToken = 0b01,
            RootMarkReasonToken = 0b10,
        };

        static constexpr uintptr_t tokenTypeShift = 2;
        static constexpr uintptr_t tokenTypeMask = 0x3;

        bool isHeapCell() const { return (m_bits & tokenTypeMask) == HeapCellToken; }
        bool isOpaqueRoot() const { return (m_bits & tokenTypeMask) == OpaqueRootToken; }
        bool isRootMarkReason() const { return (m_bits & tokenTypeMask) == RootMarkReasonToken; }
        uintptr_t m_bits { 0 };
    };

    class ReferrerContext {
    public:
        ReferrerContext(AbstractSlotVisitor&, ReferrerToken);
        ReferrerContext(AbstractSlotVisitor&, OpaqueRootTag);
        ~ReferrerContext();

        ReferrerToken referrer() const { return m_referrer; }
        void setReferrer(ReferrerToken referrer)
        {
            ASSERT(!m_referrer);
            m_referrer = referrer;
        }

        bool isOpaqueRootContext() const { return m_isOpaqueRootContext; }

    private:
        AbstractSlotVisitor& m_visitor;
        ReferrerToken m_referrer;
        ReferrerContext* m_previous;
        bool m_isOpaqueRootContext { false };
    };

    class SuppressGCVerifierScope {
    public:
        SuppressGCVerifierScope(AbstractSlotVisitor& visitor)
            : m_visitor(visitor)
        {
            ASSERT(!m_visitor.m_suppressVerifier);
            m_visitor.m_suppressVerifier = true;
        }
        ~SuppressGCVerifierScope() { m_visitor.m_suppressVerifier = false; }
    private:
        AbstractSlotVisitor& m_visitor;
    };

    class DefaultMarkingViolationAssertionScope {
    public:
        DefaultMarkingViolationAssertionScope(AbstractSlotVisitor&) { }
    };

    virtual ~AbstractSlotVisitor() = default;

    MarkStackArray& collectorMarkStack() { return m_collectorStack; }
    MarkStackArray& mutatorMarkStack() { return m_mutatorStack; }
    const MarkStackArray& collectorMarkStack() const { return m_collectorStack; }
    const MarkStackArray& mutatorMarkStack() const { return m_mutatorStack; }

    bool isEmpty() { return m_collectorStack.isEmpty() && m_mutatorStack.isEmpty(); }

    VM& vm();
    const VM& vm() const;
    JSC::Heap* heap() const;

    virtual void append(const ConservativeRoots&) = 0;

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
    virtual void appendUnbarriered(JSCell*) = 0;

    inline bool addOpaqueRoot(void*); // Returns true if the root was new.
    inline bool containsOpaqueRoot(void*) const;
    void setIgnoreNewOpaqueRoots(bool value) { m_ignoreNewOpaqueRoots = value; }

    virtual bool isFirstVisit() const = 0;

    virtual bool isMarked(const void*) const = 0;
    virtual bool isMarked(MarkedBlock&, HeapCell*) const = 0;
    virtual bool isMarked(PreciseAllocation&, HeapCell*) const = 0;

    template<typename T>
    void append(const Weak<T>&);

    ALWAYS_INLINE void appendHiddenUnbarriered(JSValue);
    virtual void appendHiddenUnbarriered(JSCell*) = 0;

    size_t visitCount() const { return m_visitCount; }

    void addToVisitCount(size_t value) { m_visitCount += value; }

    virtual void addParallelConstraintTask(RefPtr<SharedTask<void(AbstractSlotVisitor&)>>) = 0;
    virtual void addParallelConstraintTask(RefPtr<SharedTask<void(SlotVisitor&)>>) = 0;

    virtual void markAuxiliary(const void* base) = 0;

    virtual void reportExtraMemoryVisited(size_t) = 0;
#if ENABLE(RESOURCE_USAGE)
    virtual void reportExternalMemoryVisited(size_t) = 0;
#endif

    // This can't be pure virtual as it breaks our Dumpable concept.
    // FIXME: Make this virtual after we stop suppporting the Montery Clang.
    virtual void dump(PrintStream&) const { }

    RootMarkReason rootMarkReason() const { return m_rootMarkReason; }
    void setRootMarkReason(RootMarkReason reason) { m_rootMarkReason = reason; }

    virtual bool mutatorIsStopped() const = 0;

    virtual void didRace(const VisitRaceKey&) = 0;
    void didRace(JSCell* cell, const char* reason) { didRace(VisitRaceKey(cell, reason)); }

    virtual void visitAsConstraint(const JSCell*) = 0;

    const char* codeName() const { return m_codeName.data(); }

protected:
    inline AbstractSlotVisitor(Heap&, CString codeName, ConcurrentPtrHashSet&);

    virtual void didAddOpaqueRoot(void*) { }
    virtual void didFindOpaqueRoot(void*) { }

    ReferrerToken referrer() const;
    void reset();

    MarkStackArray m_collectorStack;
    MarkStackArray m_mutatorStack;

    size_t m_visitCount { 0 };

    JSC::Heap& m_heap;
    ReferrerContext* m_context { nullptr };
    CString m_codeName;

    MarkingConstraint* m_currentConstraint { nullptr };
    MarkingConstraintSolver* m_currentSolver { nullptr };
    ConcurrentPtrHashSet& m_opaqueRoots;

    RootMarkReason m_rootMarkReason { RootMarkReason::None };
    bool m_suppressVerifier { false };
    bool m_ignoreNewOpaqueRoots { false }; // Useful as a debugging mode.
    bool m_needsExtraOpaqueRootHandling { false };

    friend class MarkingConstraintSolver;
};

template<typename Visitor>
class SetRootMarkReasonScope {
public:
    SetRootMarkReasonScope(Visitor& visitor, RootMarkReason reason)
        : m_visitor(visitor)
        , m_previousReason(visitor.rootMarkReason())
        , m_context(visitor, reason)
    {
        m_visitor.setRootMarkReason(reason);
    }

    ~SetRootMarkReasonScope()
    {
        m_visitor.setRootMarkReason(m_previousReason);
    }

private:
    Visitor& m_visitor;
    RootMarkReason m_previousReason;
    typename Visitor::ReferrerContext m_context;
};

} // namespace JSC
