/*
 * Copyright (C) 2010-2020 Apple Inc. All rights reserved.
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

#include "Color.h"
#include "FilterOperation.h"
#include "FloatPoint3D.h"
#include "GraphicsLayerClient.h"
#include "PlatformCAFilters.h"
#include "TransformationMatrix.h"
#include <wtf/Forward.h>
#include <wtf/MonotonicTime.h>
#include <wtf/RefCounted.h>
#include <wtf/TypeCasts.h>

namespace WebCore {

class FloatRect;
class TimingFunction;

enum class PlatformCAAnimationType : uint8_t {
    Basic,
    Group,
    Keyframe,
    Spring
};

enum class PlatformCAAnimationFillModeType : uint8_t {
    NoFillMode,
    Forwards,
    Backwards,
    Both
};

enum class PlatformCAAnimationValueFunctionType : uint8_t {
    NoValueFunction,
    RotateX,
    RotateY,
    RotateZ,
    ScaleX,
    ScaleY,
    ScaleZ,
    Scale,
    TranslateX,
    TranslateY,
    TranslateZ,
    Translate
};

class PlatformCAAnimation : public RefCounted<PlatformCAAnimation> {
public:
    using AnimationType = PlatformCAAnimationType;
    using FillModeType = PlatformCAAnimationFillModeType;
    using ValueFunctionType = PlatformCAAnimationValueFunctionType;

    virtual ~PlatformCAAnimation() = default;

    virtual bool isPlatformCAAnimationCocoa() const { return false; }
    virtual bool isPlatformCAAnimationWin() const { return false; }
    virtual bool isPlatformCAAnimationRemote() const { return false; }
    
    virtual Ref<PlatformCAAnimation> copy() const = 0;
    
    AnimationType animationType() const { return m_type; }
    virtual String keyPath() const = 0;
    
    virtual CFTimeInterval beginTime() const = 0;
    virtual void setBeginTime(CFTimeInterval) = 0;
    
    virtual CFTimeInterval duration() const = 0;
    virtual void setDuration(CFTimeInterval) = 0;
    
    virtual float speed() const = 0;
    virtual void setSpeed(float) = 0;

    virtual CFTimeInterval timeOffset() const = 0;
    virtual void setTimeOffset(CFTimeInterval) = 0;

    virtual float repeatCount() const = 0;
    virtual void setRepeatCount(float) = 0;

    virtual bool autoreverses() const = 0;
    virtual void setAutoreverses(bool) = 0;

    virtual FillModeType fillMode() const = 0;
    virtual void setFillMode(FillModeType) = 0;
    
    virtual void setTimingFunction(const TimingFunction*, bool reverse = false) = 0;
    virtual void copyTimingFunctionFrom(const PlatformCAAnimation&) = 0;

    virtual bool isRemovedOnCompletion() const = 0;
    virtual void setRemovedOnCompletion(bool) = 0;

    virtual bool isAdditive() const = 0;
    virtual void setAdditive(bool) = 0;

    virtual ValueFunctionType valueFunction() const = 0;
    virtual void setValueFunction(ValueFunctionType) = 0;

    // Basic-animation properties.
    virtual void setFromValue(float) = 0;
    virtual void setFromValue(const WebCore::TransformationMatrix&) = 0;
    virtual void setFromValue(const FloatPoint3D&) = 0;
    virtual void setFromValue(const WebCore::Color&) = 0;
    virtual void setFromValue(const FilterOperation&) = 0;
    virtual void copyFromValueFrom(const PlatformCAAnimation&) = 0;

    virtual void setToValue(float) = 0;
    virtual void setToValue(const WebCore::TransformationMatrix&) = 0;
    virtual void setToValue(const FloatPoint3D&) = 0;
    virtual void setToValue(const WebCore::Color&) = 0;
    virtual void setToValue(const FilterOperation&) = 0;
    virtual void copyToValueFrom(const PlatformCAAnimation&) = 0;

    // Keyframe-animation properties.
    virtual void setValues(const Vector<float>&) = 0;
    virtual void setValues(const Vector<WebCore::TransformationMatrix>&) = 0;
    virtual void setValues(const Vector<FloatPoint3D>&) = 0;
    virtual void setValues(const Vector<WebCore::Color>&) = 0;
    virtual void setValues(const Vector<Ref<FilterOperation>>&) = 0;
    virtual void copyValuesFrom(const PlatformCAAnimation&) = 0;

    virtual void setKeyTimes(const Vector<float>&) = 0;
    virtual void copyKeyTimesFrom(const PlatformCAAnimation&) = 0;

    virtual void setTimingFunctions(const Vector<Ref<const TimingFunction>>&, bool reverse) = 0;
    virtual void copyTimingFunctionsFrom(const PlatformCAAnimation&) = 0;

    // Animation group properties.
    virtual void setAnimations(const Vector<RefPtr<PlatformCAAnimation>>&) = 0;
    virtual void copyAnimationsFrom(const PlatformCAAnimation&) = 0;

    void setActualStartTimeIfNeeded(CFTimeInterval t)
    {
        if (beginTime() <= 0)
            setBeginTime(t);
    }

    bool isBasicAnimation() const;

    WEBCORE_EXPORT static String makeGroupKeyPath();
    WEBCORE_EXPORT static String makeKeyPath(AnimatedProperty, FilterOperation::Type = FilterOperation::Type::None, int = 0);
    WEBCORE_EXPORT static bool isValidKeyPath(const String&, AnimationType = AnimationType::Basic);

protected:
    PlatformCAAnimation(AnimationType type = AnimationType::Basic)
        : m_type(type)
    {
    }

    void setType(AnimationType type) { m_type = type; }

private:
    AnimationType m_type;
};

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, PlatformCAAnimation::AnimationType);
WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, PlatformCAAnimation::FillModeType);
WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, PlatformCAAnimation::ValueFunctionType);

} // namespace WebCore

#define SPECIALIZE_TYPE_TRAITS_CAANIMATION(ToValueTypeName, predicate) \
SPECIALIZE_TYPE_TRAITS_BEGIN(ToValueTypeName) \
    static bool isType(const WebCore::PlatformCAAnimation& animation) { return animation.predicate; } \
SPECIALIZE_TYPE_TRAITS_END()
