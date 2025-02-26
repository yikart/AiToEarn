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

#include "FELighting.h"

namespace WebCore {

class FESpecularLighting : public FELighting {
public:
    WEBCORE_EXPORT static Ref<FESpecularLighting> create(const Color& lightingColor, float surfaceScale, float specularConstant, float specularExponent, float kernelUnitLengthX, float kernelUnitLengthY, Ref<LightSource>&&, DestinationColorSpace = DestinationColorSpace::SRGB());

    bool operator==(const FESpecularLighting& other) const { return FELighting::operator==(other); }

    float specularConstant() const { return m_specularConstant; }
    bool setSpecularConstant(float);

    float specularExponent() const { return m_specularExponent; }
    bool setSpecularExponent(float);

    WTF::TextStream& externalRepresentation(WTF::TextStream&, FilterRepresentation) const override;

private:
    FESpecularLighting(const Color& lightingColor, float surfaceScale, float specularConstant, float specularExponent, float kernelUnitLengthX, float kernelUnitLengthY, Ref<LightSource>&&, DestinationColorSpace);

    bool operator==(const FilterEffect& other) const override { return areEqual<FESpecularLighting>(*this, other); }
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_FILTER_FUNCTION(FESpecularLighting)
