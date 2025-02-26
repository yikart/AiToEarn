/*
 * Copyright (C) 2008, 2014 Apple Inc. All Rights Reserved.
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
 *
 */

#pragma once

#include "ActiveDOMObject.h"
#include "EventLoop.h"
#include "UserGestureIndicator.h"
#include <memory>
#include <wtf/MonotonicTime.h>
#include <wtf/RefCountedAndCanMakeWeakPtr.h>
#include <wtf/Seconds.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/WeakPtr.h>

namespace WebCore {

class DOMTimerFireState;
class Document;
class ImminentlyScheduledWorkScope;
class ScheduledAction;

class DOMTimer final : public RefCountedAndCanMakeWeakPtr<DOMTimer>, public ActiveDOMObject {
    WTF_MAKE_NONCOPYABLE(DOMTimer);
    WTF_MAKE_TZONE_ALLOCATED(DOMTimer);
public:
    void ref() const final { RefCounted::ref(); }
    void deref() const final { RefCounted::deref(); }

    WEBCORE_EXPORT virtual ~DOMTimer();

    static Seconds defaultMinimumInterval() { return 4_ms; }
    static Seconds defaultAlignmentInterval() { return 0_s; }
    static Seconds defaultAlignmentIntervalInLowPowerOrThermallyMitigatedMode() { return 30_ms; }
    static Seconds nonInteractedCrossOriginFrameAlignmentInterval() { return 30_ms; }
    static Seconds hiddenPageAlignmentInterval() { return 1_s; }

    enum class Type : bool { SingleShot, Repeating };
    static int install(ScriptExecutionContext&, std::unique_ptr<ScheduledAction>, Seconds timeout, Type);
    static int install(ScriptExecutionContext&, Function<void(ScriptExecutionContext&)>&&, Seconds timeout, Type);
    static void removeById(ScriptExecutionContext&, int timeoutId);

    // Notify that the interval may need updating (e.g. because the minimum interval
    // setting for the context has changed).
    void updateTimerIntervalIfNecessary();

    static void scriptDidInteractWithPlugin();

    EventLoopTimerHandle timer() const { return m_timer; }
    bool hasReachedMaxNestingLevel() const { return m_hasReachedMaxNestingLevel; }

private:
    DOMTimer(ScriptExecutionContext&, Function<void(ScriptExecutionContext&)>&&, Seconds interval, Type);
    friend class Internals;

    WEBCORE_EXPORT Seconds intervalClampedToMinimum() const;

    bool isDOMTimersThrottlingEnabled(const Document&) const;
    void updateThrottlingStateIfNecessary(const DOMTimerFireState&);

    void fired();

    // ActiveDOMObject.
    void stop() final;

    void makeImminentlyScheduledWorkScopeIfPossible(ScriptExecutionContext&);
    void clearImminentlyScheduledWorkScope();

    enum TimerThrottleState {
        Undetermined,
        ShouldThrottle,
        ShouldNotThrottle
    };

    int m_timeoutId;
    int m_nestingLevel;
    EventLoopTimerHandle m_timer;
    Function<void(ScriptExecutionContext&)> m_action;
    Seconds m_originalInterval;
    TimerThrottleState m_throttleState;
    bool m_oneShot;
    bool m_hasReachedMaxNestingLevel;
    Seconds m_currentTimerInterval;
    RefPtr<UserGestureToken> m_userGestureTokenToForward;
    RefPtr<ImminentlyScheduledWorkScope> m_imminentlyScheduledWorkScope;
};

} // namespace WebCore
