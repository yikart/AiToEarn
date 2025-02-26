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

#include "AnimationEventBase.h"
#include "AnimationPlaybackEventInit.h"
#include "WebAnimationTypes.h"
#include <wtf/Markable.h>

namespace WebCore {

class AnimationPlaybackEvent final : public AnimationEventBase {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(AnimationPlaybackEvent);
public:
    static Ref<AnimationPlaybackEvent> create(const AtomString& type, WebAnimation* animation, std::optional<WebAnimationTime> scheduledTime, std::optional<WebAnimationTime> timelineTime, std::optional<WebAnimationTime> currentTime)
    {
        return adoptRef(*new AnimationPlaybackEvent(type, animation, scheduledTime, timelineTime, currentTime));
    }

    static Ref<AnimationPlaybackEvent> create(const AtomString& type, const AnimationPlaybackEventInit& initializer, IsTrusted isTrusted = IsTrusted::No)
    {
        return adoptRef(*new AnimationPlaybackEvent(type, initializer, isTrusted));
    }

    virtual ~AnimationPlaybackEvent();

    bool isAnimationPlaybackEvent() const final { return true; }

    std::optional<WebAnimationTime> timelineTime() const { return m_timelineTime; }
    std::optional<WebAnimationTime> currentTime() const { return m_currentTime; }

private:
    AnimationPlaybackEvent(const AtomString&, WebAnimation*, std::optional<WebAnimationTime> scheduledTime, std::optional<WebAnimationTime> timelineTime, std::optional<WebAnimationTime> currentTime);
    AnimationPlaybackEvent(const AtomString&, const AnimationPlaybackEventInit&, IsTrusted);

    std::optional<WebAnimationTime> m_timelineTime;
    std::optional<WebAnimationTime> m_currentTime;
};

}

SPECIALIZE_TYPE_TRAITS_ANIMATION_EVENT_BASE(AnimationPlaybackEvent, isAnimationPlaybackEvent())
