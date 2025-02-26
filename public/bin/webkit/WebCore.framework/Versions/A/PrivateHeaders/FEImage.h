/*
 * Copyright (C) 2004, 2005, 2006, 2007 Nikolas Zimmermann <zimmermann@kde.org>
 * Copyright (C) 2004, 2005 Rob Buis <buis@kde.org>
 * Copyright (C) 2005 Eric Seidel <eric@webkit.org>
 * Copyright (C) 2010 Dirk Schulze <krit@webkit.org>
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
#include "Image.h"
#include "ImageBuffer.h"
#include "SVGPreserveAspectRatioValue.h"
#include "SourceImage.h"

namespace WebCore {

class Image;
class ImageBuffer;

class FEImage final : public FilterEffect {
public:
    WEBCORE_EXPORT static Ref<FEImage> create(SourceImage&&, const FloatRect& sourceImageRect, const SVGPreserveAspectRatioValue&);

    bool operator==(const FEImage&) const;

    const SourceImage& sourceImage() const { return m_sourceImage; }
    void setImageSource(SourceImage&& sourceImage) { m_sourceImage = WTFMove(sourceImage); }

    FloatRect sourceImageRect() const { return m_sourceImageRect; }
    const SVGPreserveAspectRatioValue& preserveAspectRatio() const { return m_preserveAspectRatio; }

private:
    FEImage(SourceImage&&, const FloatRect& sourceImageRect, const SVGPreserveAspectRatioValue&);

    bool operator==(const FilterEffect& other) const override { return areEqual<FEImage>(*this, other); }

    unsigned numberOfEffectInputs() const override { return 0; }

    // FEImage results are always in DestinationColorSpace::SRGB()
    void setOperatingColorSpace(const DestinationColorSpace&) override { }

    FloatRect calculateImageRect(const Filter&, std::span<const FloatRect> inputImageRects, const FloatRect& primitiveSubregion) const override;

    std::unique_ptr<FilterEffectApplier> createSoftwareApplier() const final;

    WTF::TextStream& externalRepresentation(WTF::TextStream&, FilterRepresentation) const final;

    SourceImage m_sourceImage;
    FloatRect m_sourceImageRect;
    SVGPreserveAspectRatioValue m_preserveAspectRatio;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_FILTER_FUNCTION(FEImage)
