/*
 * Copyright (C) 2008 Alex Mathews <possessedpenguinbob@gmail.com>
 * Copyright (C) 2009 Dirk Schulze <krit@webkit.org>
 * Copyright (C) Research In Motion Limited 2010. All rights reserved.
 * Copyright (C) 2021-2022 Apple Inc. All rights reserved.
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

#include "DestinationColorSpace.h"
#include "FilterEffectApplier.h"
#include "FilterFunction.h"
#include "FilterImageVector.h"

namespace WTF {
class TextStream;
}

namespace WebCore {

class Filter;
class FilterEffectGeometry;
class FilterResults;

class FilterEffect : public FilterFunction {
    using FilterFunction::apply;

public:
    virtual bool operator==(const FilterEffect&) const;

    const DestinationColorSpace& operatingColorSpace() const { return m_operatingColorSpace; }
    virtual void setOperatingColorSpace(const DestinationColorSpace& colorSpace) { m_operatingColorSpace = colorSpace; }

    unsigned numberOfImageInputs() const { return filterType() == FilterEffect::Type::SourceGraphic ? 1 : numberOfEffectInputs(); }
    FilterImageVector takeImageInputs(FilterImageVector& stack) const;

    RefPtr<FilterImage> apply(const Filter&, const FilterImageVector& inputs, FilterResults&, const std::optional<FilterEffectGeometry>& = std::nullopt);
    FilterStyle createFilterStyle(GraphicsContext&, const Filter&, const FilterStyle& input, const std::optional<FilterEffectGeometry>& = std::nullopt) const;

    WTF::TextStream& externalRepresentation(WTF::TextStream&, FilterRepresentation) const override;

protected:
    explicit FilterEffect(Type, DestinationColorSpace = DestinationColorSpace::SRGB(), std::optional<RenderingResourceIdentifier> = std::nullopt);

    template<typename FilterEffectType>
    static bool areEqual(const FilterEffectType& a, const FilterEffect& b)
    {
        auto* bType = dynamicDowncast<FilterEffectType>(b);
        return bType && a.operator==(*bType);
    }

    virtual unsigned numberOfEffectInputs() const { return 1; }

    FloatRect calculatePrimitiveSubregion(const Filter&, std::span<const FloatRect> inputPrimitiveSubregions, const std::optional<FilterEffectGeometry>&) const;

    virtual FloatRect calculateImageRect(const Filter&, std::span<const FloatRect> inputImageRects, const FloatRect& primitiveSubregion) const;

    // Solid black image with different alpha values.
    virtual bool resultIsAlphaImage(const FilterImageVector&) const { return false; }

    virtual bool resultIsValidPremultiplied() const { return true; }

    virtual const DestinationColorSpace& resultColorSpace(const FilterImageVector&) const { return m_operatingColorSpace; }

    virtual void transformInputsColorSpace(const FilterImageVector& inputs) const;
    
    void correctPremultipliedInputs(const FilterImageVector& inputs) const;

    std::unique_ptr<FilterEffectApplier> createApplier(const Filter&) const;

    virtual std::unique_ptr<FilterEffectApplier> createAcceleratedApplier() const { return nullptr; }
    virtual std::unique_ptr<FilterEffectApplier> createSoftwareApplier() const = 0;
    virtual std::optional<GraphicsStyle> createGraphicsStyle(GraphicsContext&, const Filter&) const { return std::nullopt; }

    RefPtr<FilterImage> apply(const Filter&, FilterImage& input, FilterResults&) override;
    FilterStyleVector createFilterStyles(GraphicsContext&, const Filter&, const FilterStyle& input) const override;

    DestinationColorSpace m_operatingColorSpace { DestinationColorSpace::SRGB() };
};

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const FilterEffect&);

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::FilterEffect)
    static bool isType(const WebCore::FilterFunction& function) { return function.isFilterEffect(); }
SPECIALIZE_TYPE_TRAITS_END()
