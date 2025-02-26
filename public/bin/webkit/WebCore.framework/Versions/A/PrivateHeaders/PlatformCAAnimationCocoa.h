/*
 * Copyright (C) 2014 Apple Inc. All rights reserved.
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

#ifndef PlatformCAAnimationCocoa_h
#define PlatformCAAnimationCocoa_h

#include "PlatformCAAnimation.h"

#include <wtf/RetainPtr.h>

OBJC_CLASS CAMediaTimingFunction;
OBJC_CLASS CAAnimation;
OBJC_CLASS CAPropertyAnimation;
OBJC_CLASS NSString;

typedef CAAnimation* PlatformAnimationRef;

namespace WebCore {

WEBCORE_EXPORT NSString* toCAFillModeType(PlatformCAAnimation::FillModeType);
WEBCORE_EXPORT NSString* toCAValueFunctionType(PlatformCAAnimation::ValueFunctionType);
WEBCORE_EXPORT CAMediaTimingFunction* toCAMediaTimingFunction(const TimingFunction&, bool reverse);

bool hasExplicitBeginTime(CAAnimation *);
void setHasExplicitBeginTime(CAAnimation *, bool);

class PlatformCAAnimationCocoa final : public PlatformCAAnimation {
public:
    static Ref<PlatformCAAnimation> create(AnimationType, const String& keyPath);
    WEBCORE_EXPORT static Ref<PlatformCAAnimation> create(PlatformAnimationRef);

    virtual ~PlatformCAAnimationCocoa();

    bool isPlatformCAAnimationCocoa() const override { return true; }

    Ref<PlatformCAAnimation> copy() const override;

    PlatformAnimationRef platformAnimation() const;
    
    String keyPath() const override;
    
    CFTimeInterval beginTime() const override;
    void setBeginTime(CFTimeInterval) override;
    
    CFTimeInterval duration() const override;
    void setDuration(CFTimeInterval) override;
    
    float speed() const override;
    void setSpeed(float) override;

    CFTimeInterval timeOffset() const override;
    void setTimeOffset(CFTimeInterval) override;

    float repeatCount() const override;
    void setRepeatCount(float) override;

    bool autoreverses() const override;
    void setAutoreverses(bool) override;

    FillModeType fillMode() const override;
    void setFillMode(FillModeType) override;
    
    void setTimingFunction(const TimingFunction*, bool reverse = false) override;
    void copyTimingFunctionFrom(const PlatformCAAnimation&) override;

    bool isRemovedOnCompletion() const override;
    void setRemovedOnCompletion(bool) override;

    bool isAdditive() const override;
    void setAdditive(bool) override;

    ValueFunctionType valueFunction() const override;
    void setValueFunction(ValueFunctionType) override;

    // Basic-animation properties.
    void setFromValue(float) override;
    void setFromValue(const WebCore::TransformationMatrix&) override;
    void setFromValue(const FloatPoint3D&) override;
    void setFromValue(const WebCore::Color&) override;
    void setFromValue(const FilterOperation&) override;
    void copyFromValueFrom(const PlatformCAAnimation&) override;

    void setToValue(float) override;
    void setToValue(const WebCore::TransformationMatrix&) override;
    void setToValue(const FloatPoint3D&) override;
    void setToValue(const WebCore::Color&) override;
    void setToValue(const FilterOperation&) override;
    void copyToValueFrom(const PlatformCAAnimation&) override;

    // Keyframe-animation properties.
    void setValues(const Vector<float>&) override;
    void setValues(const Vector<WebCore::TransformationMatrix>&) override;
    void setValues(const Vector<FloatPoint3D>&) override;
    void setValues(const Vector<WebCore::Color>&) override;
    void setValues(const Vector<Ref<FilterOperation>>&) override;
    void copyValuesFrom(const PlatformCAAnimation&) override;

    void setKeyTimes(const Vector<float>&) override;
    void copyKeyTimesFrom(const PlatformCAAnimation&) override;

    void setTimingFunctions(const Vector<Ref<const TimingFunction>>&, bool reverse) override;
    void copyTimingFunctionsFrom(const PlatformCAAnimation&) override;

    // Animation group properties.
    void setAnimations(const Vector<RefPtr<PlatformCAAnimation>>&) final;
    void copyAnimationsFrom(const PlatformCAAnimation&) final;

private:
    PlatformCAAnimationCocoa(AnimationType, const String& keyPath);
    PlatformCAAnimationCocoa(PlatformAnimationRef);

    RetainPtr<CAAnimation> m_animation;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_CAANIMATION(WebCore::PlatformCAAnimationCocoa, isPlatformCAAnimationCocoa())

#endif // PlatformCAAnimationCocoa_h
