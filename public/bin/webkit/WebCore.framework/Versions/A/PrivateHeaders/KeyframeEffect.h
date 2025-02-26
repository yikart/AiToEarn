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

#include "AcceleratedEffect.h"
#include "AnimationEffect.h"
#include "AnimationEffectPhase.h"
#include "BlendingKeyframes.h"
#include "CSSPropertyBlendingClient.h"
#include "CompositeOperation.h"
#include "CompositeOperationOrAuto.h"
#include "Document.h"
#include "EffectTiming.h"
#include "Element.h"
#include "IterationCompositeOperation.h"
#include "KeyframeEffectOptions.h"
#include "KeyframeInterpolation.h"
#include "RenderStyle.h"
#include "Styleable.h"
#include "WebAnimationTypes.h"
#include <wtf/Ref.h>
#include <wtf/text/AtomString.h>
#include <wtf/text/AtomStringHash.h>

namespace WebCore {

class Element;
class FilterOperations;
class MutableStyleProperties;
class RenderStyle;

#if ENABLE(THREADED_ANIMATION_RESOLUTION)
class AcceleratedEffect;
#endif

namespace Style {
struct ResolutionContext;
}

class KeyframeEffect final : public AnimationEffect, public CSSPropertyBlendingClient, public KeyframeInterpolation {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(KeyframeEffect);
public:
    static ExceptionOr<Ref<KeyframeEffect>> create(JSC::JSGlobalObject&, Document&, Element*, JSC::Strong<JSC::JSObject>&&, std::optional<std::variant<double, KeyframeEffectOptions>>&&);
    static Ref<KeyframeEffect> create(Ref<KeyframeEffect>&&);
    static Ref<KeyframeEffect> create(const Element&, const std::optional<Style::PseudoElementIdentifier>&);

    struct BasePropertyIndexedKeyframe {
        std::variant<std::nullptr_t, Vector<std::optional<double>>, double> offset = Vector<std::optional<double>>();
        std::variant<Vector<String>, String> easing = Vector<String>();
        std::variant<Vector<CompositeOperationOrAuto>, CompositeOperationOrAuto> composite = Vector<CompositeOperationOrAuto>();
    };

    struct BaseKeyframe {
        MarkableDouble offset;
        String easing { "linear"_s };
        CompositeOperationOrAuto composite { CompositeOperationOrAuto::Auto };
    };

    struct PropertyAndValues {
        CSSPropertyID property;
        AtomString customProperty;
        Vector<String> values;
    };

    struct KeyframeLikeObject {
        BasePropertyIndexedKeyframe baseProperties;
        Vector<PropertyAndValues> propertiesAndValues;
    };

    struct BaseComputedKeyframe : BaseKeyframe {
        double computedOffset;
    };

    struct ComputedKeyframe : BaseComputedKeyframe {
        UncheckedKeyHashMap<CSSPropertyID, String> styleStrings;
        UncheckedKeyHashMap<AtomString, String> customStyleStrings;
    };

    struct ParsedKeyframe : ComputedKeyframe {
        RefPtr<TimingFunction> timingFunction;
        Ref<MutableStyleProperties> style;

        ParsedKeyframe();
        ~ParsedKeyframe();
    };

    const Vector<ParsedKeyframe>& parsedKeyframes() const { return m_parsedKeyframes; }

    Element* target() const { return m_target.get(); }
    void setTarget(RefPtr<Element>&&);

    bool targetsPseudoElement() const;
    const String pseudoElement() const;
    ExceptionOr<void> setPseudoElement(const String&);

    const std::optional<const Styleable> targetStyleable() const;

    Vector<ComputedKeyframe> getKeyframes();
    ExceptionOr<void> setBindingsKeyframes(JSC::JSGlobalObject&, Document&, JSC::Strong<JSC::JSObject>&&);
    ExceptionOr<void> setKeyframes(JSC::JSGlobalObject&, Document&, JSC::Strong<JSC::JSObject>&&);

    IterationCompositeOperation iterationComposite() const { return m_iterationCompositeOperation; }
    void setIterationComposite(IterationCompositeOperation);
    CompositeOperation composite() const { return m_compositeOperation; }
    void setComposite(CompositeOperation);
    CompositeOperation bindingsComposite() const;
    void setBindingsComposite(CompositeOperation);

    void getAnimatedStyle(std::unique_ptr<RenderStyle>& animatedStyle);
    OptionSet<AnimationImpact> apply(RenderStyle& targetStyle, const Style::ResolutionContext&, std::optional<Seconds> = std::nullopt);
    void invalidate();

    void animationTimingDidChange();
    void animationRelevancyDidChange();
    void transformRelatedPropertyDidChange();
    enum class RecomputationReason : uint8_t { LogicalPropertyChange, Other };
    std::optional<RecomputationReason> recomputeKeyframesIfNecessary(const RenderStyle* previousUnanimatedStyle, const RenderStyle& unanimatedStyle, const Style::ResolutionContext&);
    void applyPendingAcceleratedActions();
    void applyPendingAcceleratedActionsOrUpdateTimingProperties();

    void willChangeRenderer();

    Document* document() const final;
    RenderElement* renderer() const final;
    const RenderStyle& currentStyle() const final;
    bool triggersStackingContext() const { return m_triggersStackingContext; }
    bool isRunningAccelerated() const;

    // FIXME: These ignore the fact that some timing functions can prevent acceleration.
    bool isAboutToRunAccelerated() const { return m_acceleratedPropertiesState != AcceleratedProperties::None && m_lastRecordedAcceleratedAction != AcceleratedAction::Stop; }

    std::optional<unsigned> transformFunctionListPrefix() const override;

    void computeStyleOriginatedAnimationBlendingKeyframes(const RenderStyle* oldStyle, const RenderStyle& newStyle, const Style::ResolutionContext&);
    const BlendingKeyframes& blendingKeyframes() const { return m_blendingKeyframes; }
    const HashSet<AnimatableCSSProperty>& animatedProperties();
    bool animatesProperty(const AnimatableCSSProperty&) const;
    const HashSet<AnimatableCSSProperty>& acceleratedProperties() const { return m_acceleratedProperties; }
    const HashSet<AnimatableCSSProperty>& acceleratedPropertiesWithImplicitKeyframe() const { return m_acceleratedPropertiesWithImplicitKeyframe; }

    bool computeExtentOfTransformAnimation(LayoutRect&) const;
    bool computeTransformedExtentViaTransformList(const FloatRect&, const RenderStyle&, LayoutRect&) const;
    bool computeTransformedExtentViaMatrix(const FloatRect&, const RenderStyle&, LayoutRect&) const;
    bool forceLayoutIfNeeded();

    enum class Accelerated : bool { No, Yes };
    bool isCurrentlyAffectingProperty(CSSPropertyID, Accelerated = Accelerated::No) const;
    bool isRunningAcceleratedAnimationForProperty(CSSPropertyID) const;
    bool isRunningAcceleratedTransformRelatedAnimation() const;

    bool requiresPseudoElement() const;
    bool hasImplicitKeyframes() const;

    void keyframesRuleDidChange();
    void customPropertyRegistrationDidChange(const AtomString&);

    bool canBeAccelerated() const;
    bool accelerationWasPrevented() const { return m_runningAccelerated == RunningAccelerated::Prevented; }
    bool preventsAcceleration() const;
    void effectStackNoLongerPreventsAcceleration();
    void effectStackNoLongerAllowsAcceleration();
    void effectStackNoLongerAllowsAccelerationDuringAcceleratedActionApplication();
    void wasAddedToEffectStack();
    void wasRemovedFromEffectStack();

    void lastStyleChangeEventStyleDidChange(const RenderStyle* previousStyle, const RenderStyle* currentStyle);
    void acceleratedPropertiesOverriddenByCascadeDidChange();

    static String CSSPropertyIDToIDLAttributeName(CSSPropertyID);

    WebAnimationType animationType() const { return m_animationType; }

#if ENABLE(THREADED_ANIMATION_RESOLUTION)
    const AcceleratedEffect* acceleratedRepresentation() const { return m_acceleratedRepresentation.get(); }
    void setAcceleratedRepresentation(const AcceleratedEffect* acceleratedRepresentation) { m_acceleratedRepresentation = acceleratedRepresentation; }
#endif

private:
    KeyframeEffect(Element*, const std::optional<Style::PseudoElementIdentifier>&);

    enum class AcceleratedAction : uint8_t { Play, Pause, UpdateProperties, TransformChange, Stop };
    enum class AcceleratedProperties : uint8_t { None, Some, All };
    enum class RunningAccelerated : uint8_t { NotStarted, Yes, Prevented, Failed };

    class CanBeAcceleratedMutationScope {
        WTF_MAKE_NONCOPYABLE(CanBeAcceleratedMutationScope);
    public:
        CanBeAcceleratedMutationScope(KeyframeEffect*);
        ~CanBeAcceleratedMutationScope();

    private:
        RefPtr<KeyframeEffect> m_effect;
        bool m_couldOriginallyPreventAcceleration;
#if ENABLE(THREADED_ANIMATION_RESOLUTION)
        bool m_couldOriginallyBeAccelerated;
#endif
    };

    void updateEffectStackMembership();
    void copyPropertiesFromSource(Ref<KeyframeEffect>&&);
    void didChangeTargetStyleable(const std::optional<const Styleable>&);
    ExceptionOr<void> processKeyframes(JSC::JSGlobalObject&, Document&, JSC::Strong<JSC::JSObject>&&);
    void addPendingAcceleratedAction(AcceleratedAction);
    bool isCompletelyAccelerated() const { return m_acceleratedPropertiesState == AcceleratedProperties::All; }
    void updateAcceleratedActions();
    void setAnimatedPropertiesInStyle(RenderStyle&, const ComputedEffectTiming&);
    const TimingFunction* timingFunctionForKeyframeAtIndex(size_t) const;
    const TimingFunction* timingFunctionForBlendingKeyframe(const BlendingKeyframe&) const;
    Ref<const Animation> backingAnimationForCompositedRenderer();
    void computedNeedsForcedLayout();
    void computeStackingContextImpact();
    void computeSomeKeyframesUseStepsOrLinearTimingFunctionWithPoints();
    void clearBlendingKeyframes();
    void updateBlendingKeyframes(RenderStyle& elementStyle, const Style::ResolutionContext&);
    void computeCSSAnimationBlendingKeyframes(const RenderStyle& unanimatedStyle, const Style::ResolutionContext&);
    void computeCSSTransitionBlendingKeyframes(const RenderStyle& oldStyle, const RenderStyle& newStyle);
    void computeAcceleratedPropertiesState();
    void setBlendingKeyframes(BlendingKeyframes&&);
    void checkForMatchingTransformFunctionLists();
    void computeHasImplicitKeyframeForAcceleratedProperty();
    void computeHasKeyframeComposingAcceleratedProperty();
    void computeHasAcceleratedPropertyOverriddenByCascadeProperty();
    void computeHasReferenceFilter();
    void computeHasSizeDependentTransform();
    void analyzeAcceleratedProperties();

    void abilityToBeAcceleratedDidChange();
    void updateAcceleratedAnimationIfNecessary();

#if ENABLE(THREADED_ANIMATION_RESOLUTION)
    class StackMembershipMutationScope {
        WTF_MAKE_NONCOPYABLE(StackMembershipMutationScope);
    public:
        StackMembershipMutationScope(KeyframeEffect&);
        ~StackMembershipMutationScope();

    private:
        RefPtr<KeyframeEffect> m_effect;
        RefPtr<Element> m_originalTarget;
        std::optional<Style::PseudoElementIdentifier> m_originalPseudoElementIdentifier;
    };

    bool threadedAnimationResolutionEnabled() const;
    void updateAssociatedThreadedEffectStack(const std::optional<const Styleable>& = std::nullopt);
#endif

    // AnimationEffect
    bool isKeyframeEffect() const final { return true; }
    void animationDidTick() final;
    void animationDidChangeTimingProperties() final;
    void animationWasCanceled() final;
    void animationSuspensionStateDidChange(bool) final;
    void animationTimelineDidChange(const AnimationTimeline*) final;
    void animationDidFinish() final;
    void setAnimation(WebAnimation*) final;
    Seconds timeToNextTick(const BasicEffectTiming&) final;
    bool ticksContinuouslyWhileActive() const final;
    std::optional<double> progressUntilNextStep(double) const final;
    bool preventsAnimationReadiness() const final;

    // KeyframeInterpolation
    CompositeOperation compositeOperation() const final { return m_compositeOperation; }
    IterationCompositeOperation iterationCompositeOperation() const final { return m_iterationCompositeOperation; }
    const KeyframeInterpolation::Keyframe& keyframeAtIndex(size_t) const final;
    size_t numberOfKeyframes() const final { return m_blendingKeyframes.size(); }
    const TimingFunction* timingFunctionForKeyframe(const KeyframeInterpolation::Keyframe&) const final;
    bool isPropertyAdditiveOrCumulative(KeyframeInterpolation::Property) const final;

    WeakPtr<Document, WeakPtrImplWithEventTargetData> m_document;

    AtomString m_keyframesName;
    BlendingKeyframes m_blendingKeyframes { emptyAtom() };
    HashSet<AnimatableCSSProperty> m_animatedProperties;
    HashSet<AnimatableCSSProperty> m_acceleratedProperties;
    HashSet<AnimatableCSSProperty> m_acceleratedPropertiesWithImplicitKeyframe;
    Vector<ParsedKeyframe> m_parsedKeyframes;
    Vector<AcceleratedAction> m_pendingAcceleratedActions;
    RefPtr<Element> m_target;
    std::optional<Style::PseudoElementIdentifier> m_pseudoElementIdentifier { };

#if ENABLE(THREADED_ANIMATION_RESOLUTION)
    WeakPtr<AcceleratedEffect> m_acceleratedRepresentation;
#endif

    AcceleratedAction m_lastRecordedAcceleratedAction { AcceleratedAction::Stop };
    WebAnimationType m_animationType { WebAnimationType::WebAnimation };
    IterationCompositeOperation m_iterationCompositeOperation { IterationCompositeOperation::Replace };
    CompositeOperation m_compositeOperation { CompositeOperation::Replace };
    AcceleratedProperties m_acceleratedPropertiesState { AcceleratedProperties::None };
    AnimationEffectPhase m_phaseAtLastApplication { AnimationEffectPhase::Idle };
    RunningAccelerated m_runningAccelerated { RunningAccelerated::NotStarted };
    bool m_needsForcedLayout { false };
    bool m_triggersStackingContext { false };
    size_t m_transformFunctionListsMatchPrefix { 0 };
    bool m_inTargetEffectStack { false };
    bool m_someKeyframesUseLinearTimingFunctionWithPoints { false };
    bool m_someKeyframesUseStepsTimingFunction { false };
    bool m_hasImplicitKeyframeForAcceleratedProperty { false };
    bool m_hasKeyframeComposingAcceleratedProperty { false };
    bool m_hasAcceleratedPropertyOverriddenByCascadeProperty { false };
    bool m_hasReferenceFilter { false };
    bool m_animatesSizeAndSizeDependentTransform { false };
    bool m_isAssociatedWithProgressBasedTimeline { false };
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_ANIMATION_EFFECT(KeyframeEffect, isKeyframeEffect());
