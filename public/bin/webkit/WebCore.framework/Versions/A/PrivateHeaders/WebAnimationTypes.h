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

#include "CSSPropertyNames.h"
#include "CSSValue.h"
#include "EventTarget.h"
#include "TimelineRangeOffset.h"
#include "WebAnimationTime.h"
#include <wtf/BitSet.h>
#include <wtf/HashMap.h>
#include <wtf/ListHashSet.h>
#include <wtf/Markable.h>
#include <wtf/OptionSet.h>
#include <wtf/WeakPtr.h>
#include <wtf/text/AtomString.h>
#include <wtf/text/AtomStringHash.h>

namespace WebCore {

class AnimationEventBase;
class AnimationList;
class CSSAnimation;
class CSSKeywordValue;
class CSSTransition;
class StyleOriginatedAnimation;
class WebAnimation;

struct WebAnimationsMarkableDoubleTraits {
    static bool isEmptyValue(double value)
    {
        return std::isnan(value);
    }

    static constexpr double emptyValue()
    {
        return std::numeric_limits<double>::quiet_NaN();
    }
};

enum class AnimationImpact : uint8_t {
    RequiresRecomposite     = 1 << 0,
    ForcesStackingContext   = 1 << 1
};

enum class UseAcceleratedAction : bool { No, Yes };

enum class WebAnimationType : uint8_t { CSSAnimation, CSSTransition, WebAnimation };

using MarkableDouble = Markable<double, WebAnimationsMarkableDoubleTraits>;

using WeakStyleOriginatedAnimations = Vector<WeakPtr<StyleOriginatedAnimation, WeakPtrImplWithEventTargetData>>;
using AnimationCollection = ListHashSet<Ref<WebAnimation>>;
using AnimationEvents = Vector<Ref<AnimationEventBase>>;
using CSSAnimationCollection = ListHashSet<Ref<CSSAnimation>>;

using AnimatableCSSProperty = std::variant<CSSPropertyID, AtomString>;
using AnimatableCSSPropertyToTransitionMap = UncheckedKeyHashMap<AnimatableCSSProperty, Ref<CSSTransition>>;

enum class AcceleratedEffectProperty : uint16_t {
    Invalid = 1 << 0,
    Opacity = 1 << 1,
    Transform = 1 << 2,
    Translate = 1 << 3,
    Rotate = 1 << 4,
    Scale = 1 << 5,
    OffsetPath = 1 << 6,
    OffsetDistance = 1 << 7,
    OffsetPosition = 1 << 8,
    OffsetAnchor = 1 << 9,
    OffsetRotate = 1 << 10,
    Filter = 1 << 11,
    BackdropFilter = 1 << 12
};

constexpr OptionSet<AcceleratedEffectProperty> transformRelatedAcceleratedProperties = {
    AcceleratedEffectProperty::Transform,
    AcceleratedEffectProperty::Translate,
    AcceleratedEffectProperty::Rotate,
    AcceleratedEffectProperty::Scale,
    AcceleratedEffectProperty::OffsetAnchor,
    AcceleratedEffectProperty::OffsetDistance,
    AcceleratedEffectProperty::OffsetPath,
    AcceleratedEffectProperty::OffsetPosition,
    AcceleratedEffectProperty::OffsetRotate
};

struct CSSPropertiesBitSet {
    WTF::BitSet<numCSSProperties> m_properties { };
};

using TimelineRangeValue = std::variant<TimelineRangeOffset, RefPtr<CSSNumericValue>, RefPtr<CSSKeywordValue>, String>;

} // namespace WebCore

namespace WTF {

template<> struct DefaultHash<WebCore::AnimatableCSSProperty> {
    static unsigned hash(const WebCore::AnimatableCSSProperty& key) {
        return WTF::switchOn(key,
            [] (WebCore::CSSPropertyID property) {
                return DefaultHash<WebCore::CSSPropertyID>::hash(property);
            },
            [] (const AtomString& string) {
                return DefaultHash<AtomString>::hash(string);
            }
        );
    }
    static bool equal(const WebCore::AnimatableCSSProperty& a, const WebCore::AnimatableCSSProperty& b) { return a == b; }
    static const bool safeToCompareToEmptyOrDeleted = true;
};

template<> struct HashTraits<WebCore::AnimatableCSSProperty> : GenericHashTraits<WebCore::AnimatableCSSProperty> {
    static const bool emptyValueIsZero = true;
    static void constructDeletedValue(WebCore::AnimatableCSSProperty& slot) {
        WebCore::CSSPropertyID property;
        HashTraits<WebCore::CSSPropertyID>::constructDeletedValue(property);
        new (NotNull, &slot) WebCore::AnimatableCSSProperty(property);
    }
    static bool isDeletedValue(const WebCore::AnimatableCSSProperty& value) {
        return WTF::switchOn(value,
            [] (WebCore::CSSPropertyID property) {
                return HashTraits<WebCore::CSSPropertyID>::isDeletedValue(property);
            },
            [] (const AtomString&) {
                return false;
            }
        );
    }
};

} // namespace WTF
