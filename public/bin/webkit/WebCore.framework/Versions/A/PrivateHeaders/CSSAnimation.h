/*
 * Copyright (C) 2018 Apple Inc. All rights reserved.
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

#include "StyleOriginatedAnimation.h"
#include "Styleable.h"
#include <wtf/OptionSet.h>
#include <wtf/Ref.h>

namespace WebCore {

class Animation;
class RenderStyle;

class CSSAnimation final : public StyleOriginatedAnimation {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(CSSAnimation);
public:
    static Ref<CSSAnimation> create(const Styleable&, const Animation&, const RenderStyle* oldStyle, const RenderStyle& newStyle, const Style::ResolutionContext&);
    ~CSSAnimation() = default;

    bool isCSSAnimation() const override { return true; }
    const String& animationName() const { return m_animationName; }

    void effectTimingWasUpdatedUsingBindings(OptionalEffectTiming);
    void effectKeyframesWereSetUsingBindings();
    void effectCompositeOperationWasSetUsingBindings();
    void keyframesRuleDidChange();
    void updateKeyframesIfNeeded(const RenderStyle* oldStyle, const RenderStyle& newStyle, const Style::ResolutionContext&);

private:
    CSSAnimation(const Styleable&, const Animation&);

    void syncPropertiesWithBackingAnimation() final;
    Ref<StyleOriginatedAnimationEvent> createEvent(const AtomString& eventType, std::optional<Seconds> scheduledTime, double elapsedTime, const std::optional<Style::PseudoElementIdentifier>&) final;

    AnimationTimeline* bindingsTimeline() const final;
    void setBindingsTimeline(RefPtr<AnimationTimeline>&&) final;
    ExceptionOr<void> bindingsPlay() final;
    ExceptionOr<void> bindingsPause() final;
    void setBindingsEffect(RefPtr<AnimationEffect>&&) final;
    ExceptionOr<void> setBindingsStartTime(const std::optional<WebAnimationTime>&) final;
    ExceptionOr<void> bindingsReverse() final;
    void setBindingsRangeStart(TimelineRangeValue&&) final;
    void setBindingsRangeEnd(TimelineRangeValue&&) final;

    enum class Property : uint16_t {
        Name = 1 << 0,
        Duration = 1 << 1,
        TimingFunction = 1 << 2,
        IterationCount = 1 << 3,
        Direction = 1 << 4,
        PlayState = 1 << 5,
        Delay = 1 << 6,
        FillMode = 1 << 7,
        Keyframes = 1 << 8,
        CompositeOperation = 1 << 9,
        Timeline = 1 << 10,
        Range = 1 << 11
    };

    String m_animationName;
    OptionSet<Property> m_overriddenProperties;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_WEB_ANIMATION(CSSAnimation, isCSSAnimation())
