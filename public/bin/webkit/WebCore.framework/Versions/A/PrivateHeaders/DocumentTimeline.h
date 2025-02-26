/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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

#include "AnimationFrameRate.h"
#include "AnimationTimeline.h"
#include "DocumentTimelineOptions.h"
#include "ExceptionOr.h"
#include "Timer.h"
#include <wtf/Ref.h>
#include <wtf/WeakPtr.h>

namespace WebCore {

class AnimationTimelinesController;
class AnimationEventBase;
class CustomEffectCallback;
class Document;
class AnimationTimelinesController;
class Element;
class RenderBoxModelObject;
class RenderElement;
class WeakPtrImplWithEventTargetData;
class WebAnimation;

struct CustomAnimationOptions;

class DocumentTimeline final : public AnimationTimeline
{
public:
    static Ref<DocumentTimeline> create(Document&);
    static Ref<DocumentTimeline> create(Document&, DocumentTimelineOptions&&);

    virtual ~DocumentTimeline();

    Document* document() const { return m_document.get(); }

    std::optional<WebAnimationTime> currentTime() override;
    ExceptionOr<Ref<WebAnimation>> animate(Ref<CustomEffectCallback>&&, std::optional<std::variant<double, CustomAnimationOptions>>&&);

    void animationTimingDidChange(WebAnimation&) override;
    void removeAnimation(WebAnimation&) override;
    void transitionDidComplete(Ref<CSSTransition>&&);

    void animationAcceleratedRunningStateDidChange(WebAnimation&);
    void detachFromDocument() override;

    void enqueueAnimationEvent(AnimationEventBase&);
    bool hasPendingAnimationEventForAnimation(const WebAnimation&) const;
    
    ShouldUpdateAnimationsAndSendEvents documentWillUpdateAnimationsAndSendEvents() override;
    void removeReplacedAnimations();
    AnimationEvents prepareForPendingAnimationEventsDispatch();
    void documentDidUpdateAnimationsAndSendEvents();
    void styleOriginatedAnimationsWereCreated();

    WEBCORE_EXPORT Seconds animationInterval() const;
    void suspendAnimations() override;
    void resumeAnimations() override;
    WEBCORE_EXPORT unsigned numberOfActiveAnimationsForTesting() const;
    WEBCORE_EXPORT Vector<std::pair<String, double>> acceleratedAnimationsForElement(Element&) const;    
    WEBCORE_EXPORT unsigned numberOfAnimationTimelineInvalidationsForTesting() const;

    Seconds convertTimelineTimeToOriginRelativeTime(Seconds) const;

    std::optional<FramesPerSecond> maximumFrameRate() const;

private:
    DocumentTimeline(Document&, Seconds);

    bool isDocumentTimeline() const final { return true; }

    AnimationTimelinesController* controller() const override;
    void applyPendingAcceleratedAnimations();
    void scheduleInvalidationTaskIfNeeded();
    void scheduleAnimationResolution();
    void clearTickScheduleTimer();
    void internalUpdateAnimationsAndSendEvents();
    void scheduleNextTick();
    bool animationCanBeRemoved(WebAnimation&);
    bool shouldRunUpdateAnimationsAndSendEventsIgnoringSuspensionState() const;

    Timer m_tickScheduleTimer;
    HashSet<RefPtr<WebAnimation>> m_acceleratedAnimationsPendingRunningStateChange;
    AnimationEvents m_pendingAnimationEvents;
    WeakPtr<Document, WeakPtrImplWithEventTargetData> m_document;
    Seconds m_originTime;
    unsigned m_numberOfAnimationTimelineInvalidationsForTesting { 0 };
    bool m_animationResolutionScheduled { false };
    bool m_shouldScheduleAnimationResolutionForNewPendingEvents { true };
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_ANIMATION_TIMELINE(DocumentTimeline, isDocumentTimeline())
