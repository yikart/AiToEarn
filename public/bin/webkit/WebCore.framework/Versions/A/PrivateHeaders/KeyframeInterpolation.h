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

#include "CompositeOperation.h"
#include "IterationCompositeOperation.h"
#include "TimingFunction.h"
#include "WebAnimationTypes.h"
#include <optional>
#include <wtf/Seconds.h>

namespace WebCore {

class KeyframeInterpolation {
public:
    using Property = std::variant<AnimatableCSSProperty, AcceleratedEffectProperty>;

    class Keyframe {
    public:
        virtual double offset() const = 0;
        virtual std::optional<CompositeOperation> compositeOperation() const = 0;
        virtual bool animatesProperty(Property) const = 0;

        virtual bool isAcceleratedEffectKeyframe() const { return false; }
        virtual bool isBlendingKeyframe() const { return false; }

        virtual ~Keyframe() = default;
    };

    virtual CompositeOperation compositeOperation() const = 0;
    virtual bool isPropertyAdditiveOrCumulative(Property) const = 0;
    virtual IterationCompositeOperation iterationCompositeOperation() const { return IterationCompositeOperation::Replace; }
    virtual const Keyframe& keyframeAtIndex(size_t) const = 0;
    virtual size_t numberOfKeyframes() const = 0;
    virtual const TimingFunction* timingFunctionForKeyframe(const Keyframe&) const = 0;

    struct KeyframeInterval {
        const Vector<const Keyframe*> endpoints;
        bool hasImplicitZeroKeyframe { false };
        bool hasImplicitOneKeyframe { false };
    };

    const KeyframeInterval interpolationKeyframes(Property, double iterationProgress, const Keyframe& defaultStartKeyframe, const Keyframe& defaultEndKeyframe) const;

    using CompositionCallback = Function<void(const Keyframe&, CompositeOperation)>;
    using AccumulationCallback = Function<void(const Keyframe&)>;
    using InterpolationCallback = Function<void(double intervalProgress, double currentIteration, IterationCompositeOperation)>;
    using RequiresBlendingForAccumulativeIterationCallback = Function<bool()>;
    void interpolateKeyframes(Property, const KeyframeInterval&, double iterationProgress, double currentIteration, const WebAnimationTime& iterationDuration, TimingFunction::Before, const CompositionCallback&, const AccumulationCallback&, const InterpolationCallback&, const RequiresBlendingForAccumulativeIterationCallback&) const;

    virtual ~KeyframeInterpolation() = default;
};

} // namespace WebCore

#define SPECIALIZE_TYPE_TRAITS_KEYFRAME_INTERPOLATION_KEYFRAME(ToValueTypeName, predicate) \
SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::ToValueTypeName) \
static bool isType(const WebCore::KeyframeInterpolation::Keyframe& value) { return value.predicate; } \
SPECIALIZE_TYPE_TRAITS_END()
