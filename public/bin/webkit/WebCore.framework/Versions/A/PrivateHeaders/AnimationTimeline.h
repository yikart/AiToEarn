/*
 * Copyright (C) Canon Inc. 2016
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

#include "TimelineRange.h"
#include "WebAnimationTypes.h"
#include <wtf/Forward.h>
#include <wtf/RefCountedAndCanMakeWeakPtr.h>
#include <wtf/WeakPtr.h>

namespace WebCore {

class AnimationTimelinesController;
class WebAnimation;

class AnimationTimeline : public RefCountedAndCanMakeWeakPtr<AnimationTimeline> {
public:
    virtual ~AnimationTimeline();

    virtual bool isDocumentTimeline() const { return false; }
    virtual bool isScrollTimeline() const { return false; }
    virtual bool isViewTimeline() const { return false; }

    bool isMonotonic() const { return !m_duration; }
    bool isProgressBased() const { return !isMonotonic(); }

    const AnimationCollection& relevantAnimations() const { return m_animations; }

    virtual void animationTimingDidChange(WebAnimation&);
    virtual void removeAnimation(WebAnimation&);

    virtual std::optional<WebAnimationTime> currentTime() { return m_currentTime; }
    virtual std::optional<WebAnimationTime> duration() const { return m_duration; }

    virtual void detachFromDocument();

    enum class ShouldUpdateAnimationsAndSendEvents : bool { No, Yes };
    virtual ShouldUpdateAnimationsAndSendEvents documentWillUpdateAnimationsAndSendEvents() { return ShouldUpdateAnimationsAndSendEvents::No; }

    virtual void suspendAnimations();
    virtual void resumeAnimations();
    bool animationsAreSuspended() const;

    virtual AnimationTimelinesController* controller() const { return nullptr; }

    virtual TimelineRange defaultRange() const { return { }; }
    static void updateGlobalPosition(WebAnimation&);
protected:
    AnimationTimeline(std::optional<WebAnimationTime> = std::nullopt);

    AnimationCollection m_animations;

private:

    std::optional<WebAnimationTime> m_currentTime;
    std::optional<WebAnimationTime> m_duration;
};

} // namespace WebCore

#define SPECIALIZE_TYPE_TRAITS_ANIMATION_TIMELINE(ToValueTypeName, predicate) \
SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::ToValueTypeName) \
static bool isType(const WebCore::AnimationTimeline& value) { return value.predicate; } \
SPECIALIZE_TYPE_TRAITS_END()
