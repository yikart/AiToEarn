/*
 * Copyright (C) 2023 Apple Inc. All rights reserved.
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

#if ENABLE(THREADED_ANIMATION_RESOLUTION)

#include "AcceleratedEffectValues.h"
#include "AnimationEffectTiming.h"
#include "CompositeOperation.h"
#include "KeyframeInterpolation.h"
#include "TimingFunction.h"
#include "WebAnimationTypes.h"
#include <wtf/OptionSet.h>
#include <wtf/RefCountedAndCanMakeWeakPtr.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/WeakPtr.h>

namespace WebCore {

class FloatRect;
class IntRect;
class KeyframeEffect;

class AcceleratedEffect : public RefCountedAndCanMakeWeakPtr<AcceleratedEffect>, public KeyframeInterpolation {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(AcceleratedEffect);
public:

    class WEBCORE_EXPORT Keyframe final : public KeyframeInterpolation::Keyframe {
    public:
        Keyframe(double offset, AcceleratedEffectValues&&);
        Keyframe(double offset, AcceleratedEffectValues&&, RefPtr<TimingFunction>&&, std::optional<CompositeOperation>, OptionSet<AcceleratedEffectProperty>&&);
        Keyframe clone() const;

        // KeyframeInterpolation::Keyframe
        double offset() const final { return m_offset; }
        std::optional<CompositeOperation> compositeOperation() const final { return m_compositeOperation; }
        bool animatesProperty(KeyframeInterpolation::Property) const final;
        bool isAcceleratedEffectKeyframe() const final { return true; }

        void clearProperty(AcceleratedEffectProperty);
        const OptionSet<AcceleratedEffectProperty>& animatedProperties() const { return m_animatedProperties; }
        const RefPtr<TimingFunction>& timingFunction() const { return m_timingFunction; }
        const AcceleratedEffectValues& values() const { return m_values; }

    private:
        double m_offset;
        AcceleratedEffectValues m_values;
        RefPtr<TimingFunction> m_timingFunction;
        std::optional<CompositeOperation> m_compositeOperation;
        OptionSet<AcceleratedEffectProperty> m_animatedProperties;
    };

    static RefPtr<AcceleratedEffect> create(const KeyframeEffect&, const IntRect&, const AcceleratedEffectValues&, OptionSet<AcceleratedEffectProperty>&);
    WEBCORE_EXPORT static Ref<AcceleratedEffect> create(AnimationEffectTiming, Vector<Keyframe>&&, WebAnimationType, CompositeOperation, RefPtr<TimingFunction>&& defaultKeyframeTimingFunction, OptionSet<AcceleratedEffectProperty>&&, bool paused, double playbackRate, std::optional<WebAnimationTime> startTime, std::optional<WebAnimationTime> holdTime);

    virtual ~AcceleratedEffect() = default;

    WEBCORE_EXPORT Ref<AcceleratedEffect> clone() const;
    WEBCORE_EXPORT Ref<AcceleratedEffect> copyWithProperties(OptionSet<AcceleratedEffectProperty>&) const;

    WEBCORE_EXPORT void apply(WebAnimationTime, AcceleratedEffectValues&, const FloatRect&);

    // Encoding and decoding support
    AnimationEffectTiming timing() const { return m_timing; }
    const Vector<Keyframe>& keyframes() const { return m_keyframes; }
    WebAnimationType animationType() const { return m_animationType; }
    CompositeOperation compositeOperation() const final { return m_compositeOperation; }
    const RefPtr<TimingFunction>& defaultKeyframeTimingFunction() const { return m_defaultKeyframeTimingFunction; }
    const OptionSet<AcceleratedEffectProperty>& animatedProperties() const { return m_animatedProperties; }
    bool paused() const { return m_paused; }
    double playbackRate() const { return m_playbackRate; }
    std::optional<WebAnimationTime> startTime() const { return m_startTime; }
    std::optional<WebAnimationTime> holdTime() const { return m_holdTime; }

    const OptionSet<AcceleratedEffectProperty>& disallowedProperties() const { return m_disallowedProperties; }

    bool animatesTransformRelatedProperty() const;

private:
    AcceleratedEffect(const KeyframeEffect&, const IntRect&, const OptionSet<AcceleratedEffectProperty>&);
    explicit AcceleratedEffect(AnimationEffectTiming, Vector<Keyframe>&&, WebAnimationType, CompositeOperation, RefPtr<TimingFunction>&& defaultKeyframeTimingFunction, OptionSet<AcceleratedEffectProperty>&&, bool paused, double playbackRate, std::optional<WebAnimationTime> startTime, std::optional<WebAnimationTime> holdTime);
    explicit AcceleratedEffect(const AcceleratedEffect&, OptionSet<AcceleratedEffectProperty>&);

    void validateFilters(const AcceleratedEffectValues& baseValues, OptionSet<AcceleratedEffectProperty>&);

    // KeyframeInterpolation
    bool isPropertyAdditiveOrCumulative(KeyframeInterpolation::Property) const final;
    const KeyframeInterpolation::Keyframe& keyframeAtIndex(size_t) const final;
    size_t numberOfKeyframes() const final { return m_keyframes.size(); }
    const TimingFunction* timingFunctionForKeyframe(const KeyframeInterpolation::Keyframe&) const final;

    AnimationEffectTiming m_timing;
    Vector<Keyframe> m_keyframes;
    WebAnimationType m_animationType { WebAnimationType::WebAnimation };
    CompositeOperation m_compositeOperation { CompositeOperation::Replace };
    RefPtr<TimingFunction> m_defaultKeyframeTimingFunction;
    OptionSet<AcceleratedEffectProperty> m_animatedProperties;
    OptionSet<AcceleratedEffectProperty> m_disallowedProperties;
    bool m_paused { false };
    double m_playbackRate { 1 };
    std::optional<WebAnimationTime> m_startTime;
    std::optional<WebAnimationTime> m_holdTime;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_KEYFRAME_INTERPOLATION_KEYFRAME(AcceleratedEffect::Keyframe, isAcceleratedEffectKeyframe());

#endif // ENABLE(THREADED_ANIMATION_RESOLUTION)
