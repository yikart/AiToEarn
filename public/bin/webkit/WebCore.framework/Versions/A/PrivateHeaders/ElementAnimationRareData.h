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

#include "KeyframeEffectStack.h"
#include "PseudoElementIdentifier.h"
#include "WebAnimationTypes.h"

namespace WebCore {

class CSSAnimation;
class CSSTransition;
class RenderStyle;
class WebAnimation;

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(ElementAnimationRareData);
class ElementAnimationRareData {
    WTF_MAKE_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(ElementAnimationRareData);
    WTF_MAKE_NONCOPYABLE(ElementAnimationRareData);
public:
    explicit ElementAnimationRareData();
    ~ElementAnimationRareData();

    KeyframeEffectStack* keyframeEffectStack() { return m_keyframeEffectStack.get(); }
    KeyframeEffectStack& ensureKeyframeEffectStack();

    AnimationCollection& animations() { return m_animations; }
    CSSAnimationCollection& animationsCreatedByMarkup() { return m_animationsCreatedByMarkup; }
    void setAnimationsCreatedByMarkup(CSSAnimationCollection&&);
    AnimatableCSSPropertyToTransitionMap& completedTransitionsByProperty() { return m_completedTransitionsByProperty; }
    AnimatableCSSPropertyToTransitionMap& runningTransitionsByProperty() { return m_runningTransitionsByProperty; }
    const RenderStyle* lastStyleChangeEventStyle() const { return m_lastStyleChangeEventStyle.get(); }
    void setLastStyleChangeEventStyle(std::unique_ptr<const RenderStyle>&&);
    void cssAnimationsDidUpdate() { m_hasPendingKeyframesUpdate = false; }
    void keyframesRuleDidChange() { m_hasPendingKeyframesUpdate = true; }
    bool hasPendingKeyframesUpdate() const { return m_hasPendingKeyframesUpdate; }
    bool hasPropertiesOverridenAfterAnimation() const { return m_hasPropertiesOverridenAfterAnimation; }
    void setHasPropertiesOverridenAfterAnimation(bool value) { m_hasPropertiesOverridenAfterAnimation = value; }

private:
    std::unique_ptr<KeyframeEffectStack> m_keyframeEffectStack;
    std::unique_ptr<const RenderStyle> m_lastStyleChangeEventStyle;
    AnimationCollection m_animations;
    CSSAnimationCollection m_animationsCreatedByMarkup;
    AnimatableCSSPropertyToTransitionMap m_completedTransitionsByProperty;
    AnimatableCSSPropertyToTransitionMap m_runningTransitionsByProperty;
    bool m_hasPendingKeyframesUpdate { false };
    bool m_hasPropertiesOverridenAfterAnimation { false };
};

} // namespace WebCore

