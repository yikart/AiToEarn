/*
 * Copyright (C) 2017-2018 Apple Inc. All rights reserved.
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

#include "ActiveDOMObject.h"
#include "AnimationFrameRate.h"
#include "AnimationFrameRatePreset.h"
#include "CSSKeywordValue.h"
#include "CSSNumericValue.h"
#include "ContextDestructionObserverInlines.h"
#include "EventTarget.h"
#include "ExceptionOr.h"
#include "IDLTypes.h"
#include "Styleable.h"
#include "WebAnimationTypes.h"
#include <wtf/Forward.h>
#include <wtf/Markable.h>
#include <wtf/RefCounted.h>
#include <wtf/Seconds.h>
#include <wtf/UniqueRef.h>
#include <wtf/WeakPtr.h>

namespace WebCore {

class AnimationEffect;
class AnimationEventBase;
class AnimationTimeline;
class Document;
class RenderStyle;

template<typename IDLType> class DOMPromiseProxyWithResolveCallback;

namespace Style {
struct ResolutionContext;
}

class WebAnimation : public RefCounted<WebAnimation>, public EventTarget, public ActiveDOMObject {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(WebAnimation);
public:
    void ref() const final { RefCounted::ref(); }
    void deref() const final { RefCounted::deref(); }

    static Ref<WebAnimation> create(Document&, AnimationEffect*);
    static Ref<WebAnimation> create(Document&, AnimationEffect*, AnimationTimeline*);
    ~WebAnimation();

    WEBCORE_EXPORT static HashSet<WebAnimation*>& instances();

    virtual bool isStyleOriginatedAnimation() const { return false; }
    virtual bool isCSSAnimation() const { return false; }
    virtual bool isCSSTransition() const { return false; }

    bool isSkippedContentAnimation() const;

    const String& id() const { return m_id; }
    void setId(String&&);

    AnimationEffect* bindingsEffect() const { return effect(); }
    virtual void setBindingsEffect(RefPtr<AnimationEffect>&&);
    AnimationEffect* effect() const { return m_effect.get(); }
    void setEffect(RefPtr<AnimationEffect>&&);

    virtual AnimationTimeline* bindingsTimeline() const { return timeline(); }
    virtual void setBindingsTimeline(RefPtr<AnimationTimeline>&&);
    AnimationTimeline* timeline() const { return m_timeline.get(); }
    virtual void setTimeline(RefPtr<AnimationTimeline>&&);

    std::optional<WebAnimationTime> currentTime(std::optional<WebAnimationTime> = std::nullopt) const;
    ExceptionOr<void> setCurrentTime(std::optional<WebAnimationTime>);

    double playbackRate() const { return m_playbackRate + 0; }
    void setPlaybackRate(double);

    enum class PlayState : uint8_t { Idle, Running, Paused, Finished };
    PlayState playState() const;

    enum class ReplaceState : uint8_t { Active, Removed, Persisted };
    ReplaceState replaceState() const { return m_replaceState; }
    void setReplaceState(ReplaceState replaceState) { m_replaceState = replaceState; }

    bool pending() const { return hasPendingPauseTask() || hasPendingPlayTask(); }

    using ReadyPromise = DOMPromiseProxyWithResolveCallback<IDLInterface<WebAnimation>>;
    ReadyPromise& ready() { return m_readyPromise.get(); }

    using FinishedPromise = DOMPromiseProxyWithResolveCallback<IDLInterface<WebAnimation>>;
    FinishedPromise& finished() { return m_finishedPromise.get(); }

    enum class Silently : bool { No, Yes };
    virtual void cancel(Silently = Silently::No);
    ExceptionOr<void> finish();
    ExceptionOr<void> play();
    void updatePlaybackRate(double);
    ExceptionOr<void> pause();
    virtual ExceptionOr<void> bindingsReverse();
    ExceptionOr<void> reverse();
    void persist();
    ExceptionOr<void> commitStyles();

    virtual std::optional<WebAnimationTime> bindingsStartTime() const { return startTime(); }
    virtual ExceptionOr<void> setBindingsStartTime(const std::optional<WebAnimationTime>&);
    std::optional<WebAnimationTime> startTime() const { return m_startTime; }
    void setStartTime(std::optional<WebAnimationTime>);
    virtual std::optional<WebAnimationTime> bindingsCurrentTime() const { return currentTime(); };
    virtual ExceptionOr<void> setBindingsCurrentTime(const std::optional<WebAnimationTime>&);
    std::optional<double> overallProgress() const;
    virtual PlayState bindingsPlayState() const { return playState(); }
    virtual ReplaceState bindingsReplaceState() const { return replaceState(); }
    virtual bool bindingsPending() const { return pending(); }
    virtual ReadyPromise& bindingsReady() { return ready(); }
    virtual FinishedPromise& bindingsFinished() { return finished(); }
    virtual ExceptionOr<void> bindingsPlay() { return play(); }
    virtual ExceptionOr<void> bindingsPause() { return pause(); }
    std::optional<WebAnimationTime> holdTime() const { return m_holdTime; }

    virtual std::variant<FramesPerSecond, AnimationFrameRatePreset> bindingsFrameRate() const { return m_bindingsFrameRate; }
    virtual void setBindingsFrameRate(std::variant<FramesPerSecond, AnimationFrameRatePreset>&&);
    std::optional<FramesPerSecond> frameRate() const { return m_effectiveFrameRate; }

    TimelineRangeValue bindingsRangeStart() const { return m_timelineRange.start.serialize(); }
    TimelineRangeValue bindingsRangeEnd() const { return m_timelineRange.end.serialize(); }
    virtual void setBindingsRangeStart(TimelineRangeValue&&);
    virtual void setBindingsRangeEnd(TimelineRangeValue&&);
    void setRange(TimelineRange);
    const TimelineRange& range() const { return m_timelineRange; }

    bool needsTick() const;
    virtual void tick();
    WEBCORE_EXPORT Seconds timeToNextTick() const;
    virtual OptionSet<AnimationImpact> resolve(RenderStyle& targetStyle, const Style::ResolutionContext&, std::optional<Seconds> = std::nullopt);
    void effectTargetDidChange(const std::optional<const Styleable>& previousTarget, const std::optional<const Styleable>& newTarget);
    void acceleratedStateDidChange();
    void willChangeRenderer();

    bool isRelevant() const { return m_isRelevant; }
    void updateRelevance();
    void effectTimingDidChange();
    void suspendEffectInvalidation();
    void unsuspendEffectInvalidation();
    bool isEffectInvalidationSuspended() const { return m_suspendCount; }
    void setSuspended(bool);
    bool isSuspended() const { return m_isSuspended; }
    bool isReplaceable() const;
    void remove();
    void enqueueAnimationPlaybackEvent(const AtomString&, std::optional<WebAnimationTime> currentTime, std::optional<WebAnimationTime> scheduledTime);

    uint64_t globalPosition() const { return m_globalPosition; }
    void setGlobalPosition(uint64_t globalPosition) { m_globalPosition = globalPosition; }

    virtual bool canHaveGlobalPosition() { return true; }

    std::optional<Seconds> convertAnimationTimeToTimelineTime(Seconds) const;

    void progressBasedTimelineSourceDidChangeMetrics();

    // ContextDestructionObserver.
    ScriptExecutionContext* scriptExecutionContext() const final { return ActiveDOMObject::scriptExecutionContext(); }
    void contextDestroyed() final;

protected:
    explicit WebAnimation(Document&);

    void initialize();
    void enqueueAnimationEvent(Ref<AnimationEventBase>&&);
    virtual void animationDidFinish();
    WebAnimationTime zeroTime() const;

private:
    enum class DidSeek : bool { No, Yes };
    enum class SynchronouslyNotify : bool { No, Yes };
    enum class RespectHoldTime : bool { No, Yes };
    enum class AutoRewind : bool { No, Yes };
    enum class TimeToRunPendingTask : uint8_t { NotScheduled, ASAP, WhenReady };

    void timingDidChange(DidSeek, SynchronouslyNotify, Silently = Silently::No);
    void updateFinishedState(DidSeek, SynchronouslyNotify);
    WebAnimationTime effectEndTime() const;
    WebAnimation& readyPromiseResolve();
    WebAnimation& finishedPromiseResolve();
    std::optional<WebAnimationTime> currentTime(RespectHoldTime, std::optional<WebAnimationTime> = std::nullopt) const;
    ExceptionOr<void> silentlySetCurrentTime(std::optional<WebAnimationTime>);
    void finishNotificationSteps();
    bool hasPendingPauseTask() const { return m_timeToRunPendingPauseTask != TimeToRunPendingTask::NotScheduled; }
    bool hasPendingPlayTask() const { return m_timeToRunPendingPlayTask != TimeToRunPendingTask::NotScheduled; }
    ExceptionOr<void> play(AutoRewind);
    void runPendingPauseTask();
    void runPendingPlayTask();
    void resetPendingTasks();
    void setEffectInternal(RefPtr<AnimationEffect>&&, bool = false);
    void setTimelineInternal(RefPtr<AnimationTimeline>&&);
    bool computeRelevance();
    void invalidateEffect();
    double effectivePlaybackRate() const;
    void applyPendingPlaybackRate();
    void setEffectiveFrameRate(std::optional<FramesPerSecond>);
    void autoAlignStartTime();
    bool isTimeValid(const std::optional<WebAnimationTime>&) const;

    // ActiveDOMObject.
    void suspend(ReasonForSuspension) final;
    void resume() final;
    void stop() final;
    bool virtualHasPendingActivity() const final;

    // EventTarget
    enum EventTargetInterfaceType eventTargetInterface() const final { return EventTargetInterfaceType::WebAnimation; }
    void refEventTarget() final { ref(); }
    void derefEventTarget() final { deref(); }

    RefPtr<AnimationEffect> m_effect;
    RefPtr<AnimationTimeline> m_timeline;
    UniqueRef<ReadyPromise> m_readyPromise;
    UniqueRef<FinishedPromise> m_finishedPromise;
    std::optional<WebAnimationTime> m_previousCurrentTime;
    std::optional<WebAnimationTime> m_startTime;
    std::optional<WebAnimationTime> m_holdTime;
    MarkableDouble m_pendingPlaybackRate;
    double m_playbackRate { 1 };
    std::variant<FramesPerSecond, AnimationFrameRatePreset> m_bindingsFrameRate { AnimationFrameRatePreset::Auto };
    std::optional<FramesPerSecond> m_effectiveFrameRate;
    String m_id;

    int m_suspendCount { 0 };

    bool m_isSuspended { false };
    bool m_finishNotificationStepsMicrotaskPending;
    bool m_isRelevant;
    bool m_shouldSkipUpdatingFinishedStateWhenResolving;
    bool m_hasScheduledEventsDuringTick { false };
    bool m_autoAlignStartTime { false };
    TimeToRunPendingTask m_timeToRunPendingPlayTask { TimeToRunPendingTask::NotScheduled };
    TimeToRunPendingTask m_timeToRunPendingPauseTask { TimeToRunPendingTask::NotScheduled };
    ReplaceState m_replaceState { ReplaceState::Active };
    uint64_t m_globalPosition { 0 };
    TimelineRange m_timelineRange;
};

} // namespace WebCore

#define SPECIALIZE_TYPE_TRAITS_WEB_ANIMATION(ToValueTypeName, predicate) \
SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::ToValueTypeName) \
static bool isType(const WebCore::WebAnimation& value) { return value.predicate; } \
SPECIALIZE_TYPE_TRAITS_END()
