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
#include <wtf/Vector.h>

namespace WebCore {

enum class ColorMatrixType : uint8_t {
    FECOLORMATRIX_TYPE_UNKNOWN          = 0,
    FECOLORMATRIX_TYPE_MATRIX           = 1,
    FECOLORMATRIX_TYPE_SATURATE         = 2,
    FECOLORMATRIX_TYPE_HUEROTATE        = 3,
    FECOLORMATRIX_TYPE_LUMINANCETOALPHA = 4
};

class FEColorMatrix : public FilterEffect {
public:
    WEBCORE_EXPORT static Ref<FEColorMatrix> create(ColorMatrixType, Vector<float>&&, DestinationColorSpace = DestinationColorSpace::SRGB());

    bool operator==(const FEColorMatrix&) const;

    ColorMatrixType type() const { return m_type; }
    bool setType(ColorMatrixType);

    const Vector<float>& values() const { return m_values; }
    bool setValues(const Vector<float>&);

    static void calculateSaturateComponents(float* components, float value);
    static void calculateHueRotateComponents(float* components, float value);
    static Vector<float> normalizedFloats(const Vector<float>& values);

private:
    FEColorMatrix(ColorMatrixType, Vector<float>&&, DestinationColorSpace);

    bool operator==(const FilterEffect& other) const override { return areEqual<FEColorMatrix>(*this, other); }

    bool resultIsAlphaImage(const FilterImageVector& inputs) const override;

    OptionSet<FilterRenderingMode> supportedFilterRenderingModes() const override;

    std::unique_ptr<FilterEffectApplier> createAcceleratedApplier() const override;
    std::unique_ptr<FilterEffectApplier> createSoftwareApplier() const override;
    std::optional<GraphicsStyle> createGraphicsStyle(GraphicsContext&, const Filter&) const override;

    WTF::TextStream& externalRepresentation(WTF::TextStream&, FilterRepresentation) const override;

    ColorMatrixType m_type;
    Vector<float> m_values;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_FILTER_FUNCTION(FEColorMatrix)
