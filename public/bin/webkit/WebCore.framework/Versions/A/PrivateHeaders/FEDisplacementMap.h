/*
 * Copyright (C) 2004, 2005, 2006, 2007 Nikolas Zimmermann <zimmermann@kde.org>
 * Copyright (C) 2004, 2005 Rob Buis <buis@kde.org>
 * Copyright (C) 2005 Eric Seidel <eric@webkit.org>
 * Copyright (C) 2021-2023 Apple Inc.  All rights reserved.
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Library General Public License
 * along with this library; see the file COPYING.LIB.  If not, write to
 * the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 * Boston, MA 02110-1301, USA.
 */

#pragma once

#include "FilterEffect.h"
#include <wtf/text/WTFString.h>

namespace WebCore {

enum class ChannelSelectorType : uint8_t {
    CHANNEL_UNKNOWN = 0,
    CHANNEL_R = 1,
    CHANNEL_G = 2,
    CHANNEL_B = 3,
    CHANNEL_A = 4
};

class FEDisplacementMap : public FilterEffect {
public:
    WEBCORE_EXPORT static Ref<FEDisplacementMap> create(ChannelSelectorType xChannelSelector, ChannelSelectorType yChannelSelector, float scale, DestinationColorSpace = DestinationColorSpace::SRGB());

    bool operator==(const FEDisplacementMap&) const;

    ChannelSelectorType xChannelSelector() const { return m_xChannelSelector; }
    bool setXChannelSelector(const ChannelSelectorType);

    ChannelSelectorType yChannelSelector() const { return m_yChannelSelector; }
    bool setYChannelSelector(const ChannelSelectorType);

    float scale() const { return m_scale; }
    bool setScale(float);

private:
    FEDisplacementMap(ChannelSelectorType xChannelSelector, ChannelSelectorType yChannelSelector, float, DestinationColorSpace);

    bool operator==(const FilterEffect& other) const override { return areEqual<FEDisplacementMap>(*this, other); }

    unsigned numberOfEffectInputs() const override { return 2; }

    FloatRect calculateImageRect(const Filter&, std::span<const FloatRect> inputImageRects, const FloatRect& primitiveSubregion) const override;

    const DestinationColorSpace& resultColorSpace(const FilterImageVector&) const override;
    void transformInputsColorSpace(const FilterImageVector& inputs) const override;

    std::unique_ptr<FilterEffectApplier> createSoftwareApplier() const override;

    WTF::TextStream& externalRepresentation(WTF::TextStream&, FilterRepresentation) const override;

    ChannelSelectorType m_xChannelSelector;
    ChannelSelectorType m_yChannelSelector;
    float m_scale;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_FILTER_FUNCTION(FEDisplacementMap)
