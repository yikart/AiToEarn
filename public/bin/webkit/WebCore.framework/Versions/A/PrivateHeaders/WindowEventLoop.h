/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

#include "EventLoop.h"
#include "GCReachableRef.h"
#include "Timer.h"
#include <wtf/HashSet.h>
#include <wtf/WeakHashMap.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class CustomElementQueue;
class Document;
class HTMLSlotElement;
class MutationObserver;
class Page;
class SecurityOrigin;

// https://html.spec.whatwg.org/multipage/webappapis.html#window-event-loop
class WindowEventLoop final : public EventLoop {
public:
    static Ref<WindowEventLoop> eventLoopForSecurityOrigin(const SecurityOrigin&);

    virtual ~WindowEventLoop();

    void queueMutationObserverCompoundMicrotask();
    Vector<GCReachableRef<HTMLSlotElement>>& signalSlotList() { return m_signalSlotList; }
    HashSet<RefPtr<MutationObserver>>& activeMutationObservers() { return m_activeObservers; }
    HashSet<RefPtr<MutationObserver>>& suspendedMutationObservers() { return m_suspendedObservers; }

    CustomElementQueue& backupElementQueue();

    void scheduleIdlePeriod();
    void opportunisticallyRunIdleCallbacks(std::optional<MonotonicTime> deadline = std::nullopt);
    MonotonicTime computeIdleDeadline();

    WEBCORE_EXPORT static void breakToAllowRenderingUpdate();

private:
    static Ref<WindowEventLoop> create(const String&);
    WindowEventLoop(const String&);

    void scheduleToRun() final;
    bool isContextThread() const final;
    MicrotaskQueue& microtaskQueue() final;

    void startIdlePeriod(MonotonicTime);
    bool shouldEndIdlePeriod();
    std::optional<MonotonicTime> nextScheduledWorkTime() const;
    std::optional<MonotonicTime> nextRenderingTime() const;
    void didReachTimeToRun();
    void didFireIdleTimer();

    void decayIdleCallbackDuration() { m_expectedIdleCallbackDuration /= 2; }

    String m_agentClusterKey;
    Timer m_timer;
    Timer m_idleTimer;
    std::unique_ptr<MicrotaskQueue> m_microtaskQueue;

    // Each task scheduled in event loop is associated with a document so that it can be suspened or stopped
    // when the associated document is suspened or stopped. This task group is used to schedule a task
    // which is not scheduled to a specific document, and should only be used when it's absolutely required.
    EventLoopTaskGroup m_perpetualTaskGroupForSimilarOriginWindowAgents;

    bool m_mutationObserverCompoundMicrotaskQueuedFlag { false };
    bool m_deliveringMutationRecords { false }; // FIXME: This flag doesn't exist in the spec.
    Vector<GCReachableRef<HTMLSlotElement>> m_signalSlotList; // https://dom.spec.whatwg.org/#signal-slot-list
    HashSet<RefPtr<MutationObserver>> m_activeObservers;
    HashSet<RefPtr<MutationObserver>> m_suspendedObservers;

    std::unique_ptr<CustomElementQueue> m_customElementQueue;
    bool m_processingBackupElementQueue { false };

    MonotonicTime m_lastIdlePeriodStartTime;
    Seconds m_expectedIdleCallbackDuration { 4_ms };
};

} // namespace WebCore
