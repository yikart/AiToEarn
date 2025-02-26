/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
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

#include "CSSPropertyNames.h"
#include <wtf/RefCounted.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>

namespace WebCore {

class WillChangeData : public RefCounted<WillChangeData> {
    WTF_MAKE_TZONE_ALLOCATED(WillChangeData);
public:
    static Ref<WillChangeData> create()
    {
        return adoptRef(*new WillChangeData);
    }
    
    bool operator==(const WillChangeData&) const;

    bool isAuto() const { return m_animatableFeatures.isEmpty(); }
    size_t numFeatures() const { return m_animatableFeatures.size(); }

    bool containsScrollPosition() const;
    bool containsContents() const;
    bool containsProperty(CSSPropertyID) const;

    bool createsContainingBlockForAbsolutelyPositioned(bool isRootElement) const;
    bool createsContainingBlockForOutOfFlowPositioned(bool isRootElement) const;
    bool canCreateStackingContext() const { return m_canCreateStackingContext; }
    bool canBeBackdropRoot() const;
    bool canTriggerCompositing() const { return m_canTriggerCompositing; }
    bool canTriggerCompositingOnInline() const { return m_canTriggerCompositingOnInline; }

    enum class Feature: uint8_t {
        ScrollPosition,
        Contents,
        Property,
        Invalid
    };

    void addFeature(Feature, CSSPropertyID = CSSPropertyInvalid);
    
    typedef std::pair<Feature, CSSPropertyID> FeaturePropertyPair;
    FeaturePropertyPair featureAt(size_t) const;

    static bool propertyCreatesStackingContext(CSSPropertyID);

private:
    WillChangeData()
    {
    }

    struct AnimatableFeature {
        static const int numCSSPropertyIDBits = 14;
        static_assert(numCSSProperties < (1 << numCSSPropertyIDBits), "CSSPropertyID should fit in 14_bits");

        Feature m_feature { Feature::Property };
        unsigned m_cssPropertyID : numCSSPropertyIDBits { CSSPropertyInvalid };

        Feature feature() const
        {
            return m_feature;
        }

        CSSPropertyID property() const
        {
            return feature() == Feature::Property ? static_cast<CSSPropertyID>(m_cssPropertyID) : CSSPropertyInvalid;
        }
        
        FeaturePropertyPair featurePropertyPair() const
        {
            return FeaturePropertyPair(feature(), property());
        }

        AnimatableFeature(Feature willChange, CSSPropertyID willChangeProperty = CSSPropertyInvalid)
        {
            switch (willChange) {
            case Feature::Property:
                ASSERT(willChangeProperty != CSSPropertyInvalid);
                m_cssPropertyID = willChangeProperty;
                FALLTHROUGH;
            case Feature::ScrollPosition:
            case Feature::Contents:
                m_feature = willChange;
                break;
            case Feature::Invalid:
                ASSERT_NOT_REACHED();
                break;
            }
        }
        
        friend bool operator==(const AnimatableFeature&, const AnimatableFeature&) = default;
    };

    Vector<AnimatableFeature, 1> m_animatableFeatures;
    bool m_canCreateStackingContext { false };
    bool m_canTriggerCompositing { false };
    bool m_canTriggerCompositingOnInline { false };
};

} // namespace WebCore
