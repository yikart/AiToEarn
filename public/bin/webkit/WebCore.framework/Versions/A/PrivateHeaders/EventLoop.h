/*
 * Copyright (C) 2008-2023 Apple Inc. All rights reserved.
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

#include "TaskSource.h"
#include <optional>
#include <wtf/ApproximateTime.h>
#include <wtf/CheckedRef.h>
#include <wtf/Function.h>
#include <wtf/Markable.h>
#include <wtf/MonotonicTime.h>
#include <wtf/RefCountedAndCanMakeWeakPtr.h>
#include <wtf/StdLibExtras.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/WeakHashSet.h>
#include <wtf/WeakPtr.h>

namespace WebCore {

class ActiveDOMCallbackMicrotask;
class EventLoopTaskGroup;
class EventLoopTimer;
class EventTarget;
class MicrotaskQueue;
class ScriptExecutionContext;
class TimerAlignment;

class EventLoopTask {
    WTF_MAKE_TZONE_ALLOCATED(EventLoopTask);
    WTF_MAKE_NONCOPYABLE(EventLoopTask);

public:
    virtual ~EventLoopTask() = default;

    TaskSource taskSource() { return m_taskSource; }
    virtual void execute() = 0;

    EventLoopTaskGroup* group() const { return m_group.get(); }

protected:
    EventLoopTask(TaskSource, EventLoopTaskGroup&);

private:
    const TaskSource m_taskSource;
    WeakPtr<EventLoopTaskGroup> m_group;
};

class EventLoopTimerHandle {
    WTF_MAKE_TZONE_ALLOCATED(EventLoopTimerHandle);
public:
    EventLoopTimerHandle();
    EventLoopTimerHandle(EventLoopTimer&);
    EventLoopTimerHandle(const EventLoopTimerHandle&);
    EventLoopTimerHandle(EventLoopTimerHandle&&);
    ~EventLoopTimerHandle();

    EventLoopTimerHandle& operator=(const EventLoopTimerHandle&);
    EventLoopTimerHandle& operator=(std::nullptr_t);

    // This conversion operator allows implicit conversion to bool but not to other integer types.
    using UnspecifiedBoolType = void (EventLoopTimerHandle::*)() const;
    operator UnspecifiedBoolType() const { return m_timer ? &EventLoopTimerHandle::unspecifiedBoolTypeInstance : nullptr; }

private:
    friend class EventLoop;
    friend class EventLoopTaskGroup;

    void unspecifiedBoolTypeInstance() const { }

    RefPtr<EventLoopTimer> m_timer;
};

enum class HasReachedMaxNestingLevel : bool { No, Yes };

// https://html.spec.whatwg.org/multipage/webappapis.html#event-loop
class EventLoop : public RefCountedAndCanMakeWeakPtr<EventLoop> {
public:
    virtual ~EventLoop();

    typedef Function<void ()> TaskFunction;
    void queueTask(std::unique_ptr<EventLoopTask>&&);

    EventLoopTimerHandle scheduleTask(Seconds timeout, TimerAlignment*, HasReachedMaxNestingLevel, std::unique_ptr<EventLoopTask>&&);
    void removeScheduledTimer(EventLoopTimer&);

    EventLoopTimerHandle scheduleRepeatingTask(Seconds nextTimeout, Seconds interval, TimerAlignment*, HasReachedMaxNestingLevel, std::unique_ptr<EventLoopTask>&&);
    void removeRepeatingTimer(EventLoopTimer&);

    // https://html.spec.whatwg.org/multipage/webappapis.html#queue-a-microtask
    void queueMicrotask(std::unique_ptr<EventLoopTask>&&);

    // https://html.spec.whatwg.org/multipage/webappapis.html#perform-a-microtask-checkpoint
    void performMicrotaskCheckpoint();
    virtual MicrotaskQueue& microtaskQueue() = 0;

    void resumeGroup(EventLoopTaskGroup&);
    void stopGroup(EventLoopTaskGroup&);

    void registerGroup(EventLoopTaskGroup&);
    void unregisterGroup(EventLoopTaskGroup&);
    void stopAssociatedGroupsIfNecessary();

    void forEachAssociatedContext(const Function<void(ScriptExecutionContext&)>&);
    bool findMatchingAssociatedContext(const Function<bool(ScriptExecutionContext&)>&);
    void addAssociatedContext(ScriptExecutionContext&);
    void removeAssociatedContext(ScriptExecutionContext&);

    void invalidateNextTimerFireTimeCache() { m_nextTimerFireTimeCache = std::nullopt; }
    Markable<MonotonicTime> nextTimerFireTime() const;

protected:
    EventLoop();
    void scheduleToRunIfNeeded();
    void run(std::optional<ApproximateTime> deadline = std::nullopt);
    void clearAllTasks();

    bool hasTasksForFullyActiveDocument() const;

private:
    virtual void scheduleToRun() = 0;
    virtual bool isContextThread() const = 0;

    // Use a global queue instead of multiple task queues since HTML5 spec allows UA to pick arbitrary queue.
    Vector<std::unique_ptr<EventLoopTask>> m_tasks;
    WeakHashSet<EventLoopTimer> m_scheduledTasks;
    WeakHashSet<EventLoopTimer> m_repeatingTasks;
    WeakHashSet<EventLoopTaskGroup> m_associatedGroups;
    WeakHashSet<EventLoopTaskGroup> m_groupsWithSuspendedTasks;
    WeakHashSet<ScriptExecutionContext> m_associatedContexts;
    bool m_isScheduledToRun { false };
    mutable Markable<MonotonicTime> m_nextTimerFireTimeCache;
};

class EventLoopTaskGroup final : public CanMakeWeakPtr<EventLoopTaskGroup>, public CanMakeCheckedPtr<EventLoopTaskGroup> {
    WTF_MAKE_TZONE_ALLOCATED(EventLoopTaskGroup);
    WTF_MAKE_NONCOPYABLE(EventLoopTaskGroup);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(EventLoopTaskGroup);
public:
    EventLoopTaskGroup(EventLoop& eventLoop)
        : m_eventLoop(eventLoop)
    {
        eventLoop.registerGroup(*this);
    }

    ~EventLoopTaskGroup()
    {
        if (auto* eventLoop = m_eventLoop.get())
            eventLoop->unregisterGroup(*this);
    }

    bool hasSameEventLoopAs(EventLoopTaskGroup& otherGroup)
    {
        ASSERT(m_eventLoop);
        return m_eventLoop == otherGroup.m_eventLoop;
    }

    bool matchesTask(EventLoopTask& task) const
    {
        auto* group = task.group();
        return group == this;
    }

    // Marks the group as ready to stop but it won't actually be stopped
    // until all groups in this event loop are ready to stop.
    void markAsReadyToStop();

    // This gets called by the event loop when all groups in the EventLoop as ready to stop.
    void stopAndDiscardAllTasks()
    {
        ASSERT(isReadyToStop());
        m_state = State::Stopped;
        if (auto* eventLoop = m_eventLoop.get())
            eventLoop->stopGroup(*this);
    }

    void suspend();
    void resume();

    bool isStoppedPermanently() const { return m_state == State::Stopped; }
    bool isSuspended() const { return m_state == State::Suspended; }
    bool isReadyToStop() const { return m_state == State::ReadyToStop; }

    void queueTask(std::unique_ptr<EventLoopTask>&&);
    WEBCORE_EXPORT void queueTask(TaskSource, EventLoop::TaskFunction&&);

    // https://html.spec.whatwg.org/multipage/webappapis.html#queue-a-microtask
    WEBCORE_EXPORT void queueMicrotask(EventLoop::TaskFunction&&);
    MicrotaskQueue& microtaskQueue() { return m_eventLoop->microtaskQueue(); }

    // https://html.spec.whatwg.org/multipage/webappapis.html#perform-a-microtask-checkpoint
    void performMicrotaskCheckpoint();

    void runAtEndOfMicrotaskCheckpoint(EventLoop::TaskFunction&&);

    EventLoopTimerHandle scheduleTask(Seconds timeout, TaskSource, EventLoop::TaskFunction&&);
    EventLoopTimerHandle scheduleTask(Seconds timeout, TimerAlignment&, HasReachedMaxNestingLevel, TaskSource, EventLoop::TaskFunction&&);
    void didExecuteScheduledTask(EventLoopTimer&);
    void removeScheduledTimer(EventLoopTimer&);

    EventLoopTimerHandle scheduleRepeatingTask(Seconds nextTimeout, Seconds interval, TaskSource, EventLoop::TaskFunction&&);
    EventLoopTimerHandle scheduleRepeatingTask(Seconds nextTimeout, Seconds interval, TimerAlignment&, HasReachedMaxNestingLevel, TaskSource, EventLoop::TaskFunction&&);
    void removeRepeatingTimer(EventLoopTimer&);

    void didChangeTimerAlignmentInterval(EventLoopTimerHandle);
    void setTimerHasReachedMaxNestingLevel(EventLoopTimerHandle, bool);
    void adjustTimerNextFireTime(EventLoopTimerHandle, Seconds delta);
    void adjustTimerRepeatInterval(EventLoopTimerHandle, Seconds delta);

    void didAddTimer(EventLoopTimer&);
    void didRemoveTimer(EventLoopTimer&);

private:
    enum class State : uint8_t { Running, Suspended, ReadyToStop, Stopped };

    RefPtr<EventLoop> protectedEventLoop() const;

    WeakPtr<EventLoop> m_eventLoop;
    WeakHashSet<EventLoopTimer> m_timers;
    State m_state { State::Running };
};

inline EventLoopTask::EventLoopTask(TaskSource source, EventLoopTaskGroup& group)
    : m_taskSource(source)
    , m_group(group)
{ }

} // namespace WebCore
