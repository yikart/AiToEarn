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

#include "Element.h"
#include "ElementRuleCollector.h"
#include "KeyframeEffectStack.h"
#include "PseudoElement.h"
#include "PseudoElementIdentifier.h"
#include "RenderStyleConstants.h"
#include "WebAnimationTypes.h"

namespace WebCore {

class KeyframeEffectStack;
class RenderElement;
class RenderStyle;
class WebAnimation;

namespace Style {
enum class IsInDisplayNoneTree : bool;
}

struct Styleable {
    Element& element;
    std::optional<Style::PseudoElementIdentifier> pseudoElementIdentifier;

    Styleable(Element& element, const std::optional<Style::PseudoElementIdentifier>& pseudoElementIdentifier)
        : element(element)
        , pseudoElementIdentifier(pseudoElementIdentifier)
    {
    }

    static const Styleable fromElement(Element& element)
    {
        if (auto* pseudoElement = dynamicDowncast<PseudoElement>(element))
            return Styleable(*pseudoElement->hostElement(), Style::PseudoElementIdentifier { element.pseudoId() });
        ASSERT(element.pseudoId() == PseudoId::None);
        return Styleable(element, std::nullopt);
    }

    static const std::optional<const Styleable> fromRenderer(const RenderElement&);

    bool operator==(const Styleable& other) const
    {
        return (&element == &other.element && pseudoElementIdentifier == other.pseudoElementIdentifier);
    }

    RenderElement* renderer() const;

    std::unique_ptr<RenderStyle> computeAnimatedStyle() const;

    // If possible, compute the visual extent of any transform animation using the given rect,
    // returning the result in the rect. Return false if there is some transform animation but
    // we were unable to cheaply compute its effect on the extent.
    bool computeAnimationExtent(LayoutRect&) const;

    bool mayHaveNonZeroOpacity() const;

    bool isRunningAcceleratedTransformAnimation() const;

    bool hasRunningAcceleratedAnimations() const;

    bool capturedInViewTransition() const;
    void setCapturedInViewTransition(AtomString);

    KeyframeEffectStack* keyframeEffectStack() const
    {
        return element.keyframeEffectStack(pseudoElementIdentifier);
    }

    KeyframeEffectStack& ensureKeyframeEffectStack() const
    {
        return element.ensureKeyframeEffectStack(pseudoElementIdentifier);
    }

    bool hasKeyframeEffects() const
    {
        return element.hasKeyframeEffects(pseudoElementIdentifier);
    }

    OptionSet<AnimationImpact> applyKeyframeEffects(RenderStyle& targetStyle, HashSet<AnimatableCSSProperty>& affectedProperties, const RenderStyle* previousLastStyleChangeEventStyle, const Style::ResolutionContext& resolutionContext) const
    {
        return element.ensureKeyframeEffectStack(pseudoElementIdentifier).applyKeyframeEffects(targetStyle, affectedProperties, previousLastStyleChangeEventStyle, resolutionContext);
    }

    const AnimationCollection* animations() const
    {
        return element.animations(pseudoElementIdentifier);
    }

    bool hasCompletedTransitionForProperty(const AnimatableCSSProperty& property) const
    {
        return element.hasCompletedTransitionForProperty(pseudoElementIdentifier, property);
    }

    bool hasRunningTransitionForProperty(const AnimatableCSSProperty& property) const
    {
        return element.hasRunningTransitionForProperty(pseudoElementIdentifier, property);
    }

    bool hasRunningTransitions() const
    {
        return element.hasRunningTransitions(pseudoElementIdentifier);
    }

    AnimationCollection& ensureAnimations() const
    {
        return element.ensureAnimations(pseudoElementIdentifier);
    }

    AnimatableCSSPropertyToTransitionMap& ensureCompletedTransitionsByProperty() const
    {
        return element.ensureCompletedTransitionsByProperty(pseudoElementIdentifier);
    }

    AnimatableCSSPropertyToTransitionMap& ensureRunningTransitionsByProperty() const
    {
        return element.ensureRunningTransitionsByProperty(pseudoElementIdentifier);
    }

    CSSAnimationCollection& animationsCreatedByMarkup() const
    {
        return element.animationsCreatedByMarkup(pseudoElementIdentifier);
    }

    void setAnimationsCreatedByMarkup(CSSAnimationCollection&& collection) const
    {
        element.setAnimationsCreatedByMarkup(pseudoElementIdentifier, WTFMove(collection));
    }

    const RenderStyle* lastStyleChangeEventStyle() const
    {
        return element.lastStyleChangeEventStyle(pseudoElementIdentifier);
    }

    void setLastStyleChangeEventStyle(std::unique_ptr<const RenderStyle>&& style) const
    {
        element.setLastStyleChangeEventStyle(pseudoElementIdentifier, WTFMove(style));
    }

    bool hasPropertiesOverridenAfterAnimation() const
    {
        return element.hasPropertiesOverridenAfterAnimation(pseudoElementIdentifier);
    }

    void setHasPropertiesOverridenAfterAnimation(bool value) const
    {
        element.setHasPropertiesOverridenAfterAnimation(pseudoElementIdentifier, value);
    }

    void keyframesRuleDidChange() const
    {
        element.keyframesRuleDidChange(pseudoElementIdentifier);
    }

    void queryContainerDidChange() const;

    bool animationListContainsNewlyValidAnimation(const AnimationList&) const;

    void elementWasRemoved() const;

    void willChangeRenderer() const;
    void cancelStyleOriginatedAnimations() const;
    void cancelStyleOriginatedAnimations(const WeakStyleOriginatedAnimations&) const;

    void animationWasAdded(WebAnimation&) const;
    void animationWasRemoved(WebAnimation&) const;

    void removeStyleOriginatedAnimationFromListsForOwningElement(WebAnimation&) const;

    void updateCSSAnimations(const RenderStyle* currentStyle, const RenderStyle& afterChangeStyle, const Style::ResolutionContext&, WeakStyleOriginatedAnimations&, Style::IsInDisplayNoneTree) const;
    void updateCSSTransitions(const RenderStyle& currentStyle, const RenderStyle& newStyle, WeakStyleOriginatedAnimations&) const;
    void updateCSSScrollTimelines(const RenderStyle* currentStyle, const RenderStyle& afterChangeStyle) const;
    void updateCSSViewTimelines(const RenderStyle* currentStyle, const RenderStyle& afterChangeStyle) const;
};

class WeakStyleable {
public:
    WeakStyleable() = default;

    explicit operator bool() const { return !!m_element; }

    WeakStyleable& operator=(const Styleable& styleable)
    {
        m_element = styleable.element;
        m_pseudoElementIdentifier = styleable.pseudoElementIdentifier;
        return *this;
    }

    std::optional<Styleable> styleable() const
    {
        if (!m_element)
            return std::nullopt;
        return Styleable(*m_element, m_pseudoElementIdentifier);
    }

private:
    WeakPtr<Element, WeakPtrImplWithEventTargetData> m_element;
    std::optional<Style::PseudoElementIdentifier> m_pseudoElementIdentifier;
};

} // namespace WebCore
