/*
 * Copyright (C) 2020 Apple Inc. All rights reserved.
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

#include "FrameRateAligner.h"
#include "ReducedResolutionSeconds.h"
#include "ScrollAxis.h"
#include "TimelineScope.h"
#include "Timer.h"
#include <wtf/CancellableTask.h>
#include <wtf/CheckedRef.h>
#include <wtf/Markable.h>
#include <wtf/Seconds.h>
#include <wtf/WeakHashSet.h>
#include <wtf/text/AtomStringHash.h>

namespace WebCore {

class AnimationTimeline;
class CSSTransition;
class Document;
class Element;
class ScrollTimeline;
class ViewTimeline;
class WeakPtrImplWithEventTargetData;
class WebAnimation;

#if ENABLE(THREADED_ANIMATION_RESOLUTION)
class AcceleratedEffectStackUpdater;
#endif

struct ViewTimelineInsets;
struct TimelineMapAttachOperation {
    WeakPtr<Element, WeakPtrImplWithEventTargetData> element;
    AtomString name;
    Ref<WebAnimation> animation;
};

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(AnimationTimelinesController);
class AnimationTimelinesController final : public CanMakeCheckedPtr<AnimationTimelinesController> {
    WTF_MAKE_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(AnimationTimelinesController);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(AnimationTimelinesController);
public:
    explicit AnimationTimelinesController(Document&);
    ~AnimationTimelinesController();

    void addTimeline(AnimationTimeline&);
    void removeTimeline(AnimationTimeline&);
    void detachFromDocument();
    void updateAnimationsAndSendEvents(ReducedResolutionSeconds);

    std::optional<Seconds> currentTime();
    std::optional<FramesPerSecond> maximumAnimationFrameRate() const { return m_frameRateAligner.maximumFrameRate(); }
    std::optional<Seconds> timeUntilNextTickForAnimationsWithFrameRate(FramesPerSecond) const;

    WEBCORE_EXPORT void suspendAnimations();
    WEBCORE_EXPORT void resumeAnimations();
    bool animationsAreSuspended() const { return m_isSuspended; }

    void registerNamedScrollTimeline(const AtomString&, const Element&, ScrollAxis);
    void registerNamedViewTimeline(const AtomString&, const Element&, ScrollAxis, ViewTimelineInsets&&);
    void unregisterNamedTimeline(const AtomString&, const Element&);
    void setTimelineForName(const AtomString&, const Element&, WebAnimation&);
    void updateNamedTimelineMapForTimelineScope(const TimelineScope&, const Element&);
    void updateTimelineForTimelineScope(const Ref<ScrollTimeline>&, const AtomString&);
    void unregisterNamedTimelinesAssociatedWithElement(const Element&);

#if ENABLE(THREADED_ANIMATION_RESOLUTION)
    AcceleratedEffectStackUpdater* existingAcceleratedEffectStackUpdater() const { return m_acceleratedEffectStackUpdater.get(); }
    AcceleratedEffectStackUpdater& acceleratedEffectStackUpdater();
#endif

private:

    ReducedResolutionSeconds liveCurrentTime() const;
    void cacheCurrentTime(ReducedResolutionSeconds);
    void maybeClearCachedCurrentTime();

    Vector<Ref<ScrollTimeline>>& timelinesForName(const AtomString&);
    Vector<WeakPtr<Element, WeakPtrImplWithEventTargetData>> relatedTimelineScopeElements(const AtomString&);
    void attachPendingOperations();
    bool isPendingTimelineAttachment(const WebAnimation&) const;

    Vector<TimelineMapAttachOperation> m_pendingAttachOperations;
    Vector<std::pair<TimelineScope, WeakPtr<Element, WeakPtrImplWithEventTargetData>>> m_timelineScopeEntries;
    UncheckedKeyHashMap<AtomString, Vector<Ref<ScrollTimeline>>> m_nameToTimelineMap;

#if ENABLE(THREADED_ANIMATION_RESOLUTION)
    std::unique_ptr<AcceleratedEffectStackUpdater> m_acceleratedEffectStackUpdater;
#endif

    UncheckedKeyHashMap<FramesPerSecond, ReducedResolutionSeconds> m_animationFrameRateToLastTickTimeMap;
    WeakHashSet<AnimationTimeline> m_timelines;
    TaskCancellationGroup m_currentTimeClearingTaskCancellationGroup;
    Document& m_document;
    FrameRateAligner m_frameRateAligner;
    Markable<Seconds, Seconds::MarkableTraits> m_cachedCurrentTime;
    bool m_isSuspended { false };
    bool m_waitingOnVMIdle { false };
};

} // namespace WebCore
