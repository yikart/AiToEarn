/*
 * Copyright (C) 2017-2022 Apple Inc. All rights reserved.
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

#include <wtf/AutomaticThread.h>
#include <wtf/Box.h>
#include <wtf/Expected.h>
#include <wtf/HashSet.h>
#include <wtf/Lock.h>
#include <wtf/Locker.h>
#include <wtf/RefPtr.h>
#include <wtf/StackBounds.h>

namespace JSC {

class CallFrame;
class JSGlobalObject;
class VM;

class VMTraps {
public:
    using BitField = uint32_t;
    static constexpr size_t bitsInBitField = sizeof(BitField) * CHAR_BIT;

    // The following are the type of VMTrap events / signals that can be fired.
    // This list should be sorted in servicing priority order from highest to
    // lowest.
    //
    // The currently imlemented events are (in highest to lowest priority):
    //
    //  NeedShellTimeoutCheck
    //  - Only used by the jsc shell to check if we need to force a hard shutdown.
    //  - This event may fire more than once before the jsc shell forces the
    //    shutdown (see NeedWatchdogCheck's discussion of CPU time for why
    //    this may be).
    //
    //  NeedTermination
    //  - Used to request the termination of execution of the "current" stack.
    //    Note: "Termination" here simply means we terminate whatever is currently
    //    executing on the stack. It does not mean termination of the VM, and hence,
    //    is not permanent. Permanent VM termination mechanisms (like stopping the
    //    request to stop a woker thread) may use this Event to terminate the
    //    "current" stack, but it needs to do some additional work to prevent
    //    re-entry into the VM.
    //
    //  - The mechanism for achieving this stack termination is by throwing the
    //    uncatchable TerminationException that piggy back on the VM's exception
    //    handling machinery to the unwind stack. The TerminationException is
    //    uncatchable in the sense that the VM will refuse to let JS code's
    //    catch handlers catch the exception. C++ code in the VM (that calls into
    //    JS) needs to do exception checks, and make sure to propagate the
    //    exception if it is the TerminationException.
    //
    //  - Again, the termination request is not permanent. Once the VM unwinds out
    //    of the "current" execution state on the stack, the client may choose to
    //    clear the exception, and re-enter the VM to executing JS code again.
    //    See NeedWatchdogCheck below on why the VM watchdog needs this ability
    //    to re-enter the VM after terminating the current stack.
    //
    //  - Many clients enter the VM via APIs that return an uncaught exception
    //    in a NakedPointer<Exception>&. Those APIs would automatically clear
    //    the uncaught TerminationException and return it via the
    //    NakedPointer<Exception>&. Hence, the VM is ready for re-entry upon
    //    returning to the client.
    //
    //  - In the above notes, "current" (as in "current" stack) is in quotes because
    //    NeedTermination needs to guarantee that the TerminationException has
    //    been thrown in response to this event. If the event fires just before
    //    the VM exits and the TerminationException was not thrown yet, then we'll
    //    keep the NeedTermination trap bit set for the next VM entry. In this case,
    //    the termination will actual happen on the next stack of execution.
    //
    //    This behavior is needed because some clients rely on seeing an uncaught
    //    TerminationException to know that a termination has been requested.
    //    Technically, there are better ways for the client to know about the
    //    termination request (after all, the termination is initiated by the
    //    client). However, this is how some current client code works. So, we need
    //    to retain this behavior until we can change all the clients that rely on
    //    it.
    //
    //  NeedWatchdogCheck
    //  - Used to request a check as to whether the watchdog timer has expired.
    //    Note: the watchdog timeout is logically measured in CPU time. However,
    //    the real timer implementation (that fires this NeedWatchdogCheck event)
    //    has to operate on wall clock time. Hence, NeedWatchdogCheck firing does not
    //    necessarily mean that the watchdog timeout has expired, and we can expect
    //    to see NeedWatchdogCheck firing more than once for a single watchdog
    //    timeout.
    //
    //  - The watchdog mechanism has the option to request termination of the
    //    the current execution stack on watchdog timeout (see
    //    Watchdog::shouldTerminate()). If termination is requested, it will
    //    be executed via the same mechanism as NeedTermination (see how the
    //    NeedWatchdogCheck case can fall through to the NeedTermination case in
    //    VMTraps::handleTraps()).
    //
    //  - The watchdog timing out is not permanent i.e. after terminating the
    //    current stack, the client may choose to re-enter the VM to execute more
    //    JS. For example, a client may use the watchdog to ensure that an untrusted
    //    3rd party script (that it runs) does not get trapped in an infinite loop.
    //    If so, the watchdog timeout can terminate that script. After terminating
    //    that bad script, the client may choose to allow other 3rd party scripts
    //    to execute, or even allow more tries on the current one that timed out.
    //    Hence, the timeout and termination must not be permanent.
    //
    //    This is why termination via the NeedTermination event is not permanent,
    //    but only terminates the "current" stack.
    //
    //  NeedDebuggerBreak
    //  - Services asynchronous debugger break requests.
    //
    //  NeedExceptionHandling
    //  - Unlike the other events (which are asynchronous to the mutator thread),
    //    NeedExceptionHandling is set when the mutator thread throws a JS exception
    //    and cleared when the exception is handled / caught.
    //
    //  - The reason why NeedExceptionHandling is a bit on VMTraps as well is so
    //    that we can piggy back on all the RETURN_IF_EXCEPTION checks in C++ code
    //    to service VMTraps as well. Having the NeedExceptionHandling event as
    //    part of VMTraps allows RETURN_IF_EXCEPTION to optimally only do a single
    //    check to determine if the VM possibly has a pending exception to handle,
    //    as well as if there are asynchronous VMTraps events to handle.

#define FOR_EACH_VMTRAPS_EVENTS(v) \
    v(NeedShellTimeoutCheck) \
    v(NeedTermination) \
    v(NeedWatchdogCheck) \
    v(NeedDebuggerBreak) \
    v(NeedExceptionHandling) \
    v(DeferTrapHandling) // Must come last in the enum. This defers all events except NeedExceptionHandling.

#define DECLARE_VMTRAPS_EVENT_BIT_SHIFT(event__)  event__##BitShift,
    enum EventBitShift {
        FOR_EACH_VMTRAPS_EVENTS(DECLARE_VMTRAPS_EVENT_BIT_SHIFT)
    };
#undef DECLARE_VMTRAPS_EVENT_BIT_SHIFT


#define COUNT_EVENT(event) + 1
    static constexpr BitField NumberOfEvents = FOR_EACH_VMTRAPS_EVENTS(COUNT_EVENT) - 1; // Don't count DeferTrapHandling.
    static constexpr BitField NumberOfEventsIncludingDefer = FOR_EACH_VMTRAPS_EVENTS(COUNT_EVENT);
#undef COUNT_EVENT

    using Event = BitField;

#define DECLARE_VMTRAPS_EVENT(event__) \
    static_assert(event__##BitShift < bitsInBitField); \
    static constexpr Event event__ = (1 << event__##BitShift);
    FOR_EACH_VMTRAPS_EVENTS(DECLARE_VMTRAPS_EVENT)
#undef DECLARE_VMTRAPS_EVENT

#undef FOR_EACH_VMTRAPS_EVENTS

    static constexpr Event NoEvent = 0;

    static_assert(NumberOfEventsIncludingDefer <= bitsInBitField);
    static constexpr BitField AllEvents = (1ull << NumberOfEvents) - 1;
    static constexpr BitField AllEventsIncludingDefer = (1ull << NumberOfEventsIncludingDefer) - 1;
    static constexpr BitField AsyncEvents = AllEvents & ~NeedExceptionHandling;
    static constexpr BitField NonDebuggerEvents = AllEvents & ~NeedDebuggerBreak;
    static constexpr BitField NonDebuggerAsyncEvents = AsyncEvents & ~NeedDebuggerBreak;

    static constexpr bool onlyContainsAsyncEvents(BitField events)
    {
        return (AsyncEvents & events) && !(~AsyncEvents & events);
    }

    ~VMTraps();
    VMTraps();

    static void initializeSignals();

    void willDestroyVM();

    ALWAYS_INLINE bool needHandling(BitField mask) const
    {
        auto maskedValue = m_trapBits.loadRelaxed() & (mask | DeferTrapHandling);
        if (UNLIKELY(maskedValue))
            return (maskedValue & NeedExceptionHandling) || !(maskedValue & DeferTrapHandling);
        return false;
    }
    // Designed to be a fast check to rule out if we might need handling, and we need to ensure needHandling on the slow path.
    ALWAYS_INLINE bool maybeNeedHandling() const { return m_trapBits.loadRelaxed(); }
    void* trapBitsAddress() { return &m_trapBits; }
    static constexpr ptrdiff_t offsetOfTrapsBits() { return OBJECT_OFFSETOF(VMTraps, m_trapBits); }

    enum class DeferAction {
        DeferForAWhile,
        DeferUntilEndOfScope
    };

    bool isDeferringTermination() const { return m_deferTerminationCount; }
    void deferTermination(DeferAction);
    void undoDeferTermination(DeferAction);

    void notifyGrabAllLocks()
    {
        if (needHandling(AsyncEvents))
            invalidateCodeBlocksOnStack();
    }

    bool hasTrapBit(Event event)
    {
        return m_trapBits.loadRelaxed() & event;
    }
    bool hasTrapBit(Event event, BitField mask)
    {
        BitField maskedBits = event & mask;
        return m_trapBits.loadRelaxed() & maskedBits;
    }
    void clearTrapBit(Event event) { m_trapBits.exchangeAnd(~event); }
    void setTrapBit(Event event)
    {
        ASSERT((event & ~AllEventsIncludingDefer) == 0);
        m_trapBits.exchangeOr(event);
    }

    JS_EXPORT_PRIVATE void fireTrap(Event);
    void handleTraps(BitField mask = AsyncEvents);

#if ENABLE(SIGNAL_BASED_VM_TRAPS)
    struct SignalContext;
    void tryInstallTrapBreakpoints(struct VMTraps::SignalContext&, StackBounds);
#endif

private:
    VM& vm() const;

    JS_EXPORT_PRIVATE void deferTerminationSlow(DeferAction);
    JS_EXPORT_PRIVATE void undoDeferTerminationSlow(DeferAction);
    Event takeTopPriorityTrap(BitField mask);

#if ENABLE(SIGNAL_BASED_VM_TRAPS)
    class SignalSender;
    friend class SignalSender;

    void invalidateCodeBlocksOnStack();
    void invalidateCodeBlocksOnStack(CallFrame* topCallFrame);
    void invalidateCodeBlocksOnStack(Locker<Lock>& codeBlockSetLocker, CallFrame* topCallFrame);

    void addSignalSender(SignalSender*);
    void removeSignalSender(SignalSender*);
#else
    void invalidateCodeBlocksOnStack() { }
    void invalidateCodeBlocksOnStack(CallFrame*) { }
#endif

    static constexpr BitField NeedExceptionHandlingMask = ~(1 << NeedExceptionHandling);

    Box<Lock> m_lock;
    Ref<AutomaticThreadCondition> m_condition;
    Atomic<BitField> m_trapBits { 0 };
    bool m_needToInvalidatedCodeBlocks { false };
    bool m_isShuttingDown { false };
    bool m_suspendedTerminationException { false };
    unsigned m_deferTerminationCount { 0 };

#if ENABLE(SIGNAL_BASED_VM_TRAPS)
    RefPtr<SignalSender> m_signalSender;
#endif

    friend class LLIntOffsetsExtractor;
    friend class SignalSender;
};

class DeferTraps {
public:
    DeferTraps(VM&);
    ~DeferTraps();
private:
    VMTraps& m_traps;
    bool m_isActive;
};

} // namespace JSC
