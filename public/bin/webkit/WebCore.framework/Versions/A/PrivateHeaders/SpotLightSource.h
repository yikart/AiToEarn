/*
 * Copyright (C) 2008 Alex Mathews <possessedpenguinbob@gmail.com>
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

#include "LightSource.h"
#include <wtf/Ref.h>

namespace WebCore {

class SpotLightSource : public LightSource {
public:
    WEBCORE_EXPORT static Ref<SpotLightSource> create(const FloatPoint3D& position, const FloatPoint3D& pointsAt, float specularExponent, float limitingConeAngle);

    bool operator==(const SpotLightSource&) const;

    const FloatPoint3D& position() const { return m_position; }
    const FloatPoint3D& direction() const { return m_pointsAt; }
    float specularExponent() const { return m_specularExponent; }
    float limitingConeAngle() const { return m_limitingConeAngle; }

    bool setX(float) override;
    bool setY(float) override;
    bool setZ(float) override;
    bool setPointsAtX(float) override;
    bool setPointsAtY(float) override;
    bool setPointsAtZ(float) override;

    bool setSpecularExponent(float) override;
    bool setLimitingConeAngle(float) override;

    void initPaintingData(const Filter&, const FilterImage& result, PaintingData&) const override;
    ComputedLightingData computePixelLightingData(const PaintingData&, int x, int y, float z) const final;

    WTF::TextStream& externalRepresentation(WTF::TextStream&) const override;

private:
    SpotLightSource(const FloatPoint3D& position, const FloatPoint3D& direction, float specularExponent, float limitingConeAngle);

    bool operator==(const LightSource& other) const override { return areEqual<SpotLightSource>(*this, other); }

    FloatPoint3D m_position;
    FloatPoint3D m_pointsAt;

    mutable FloatPoint3D m_bufferPosition;

    float m_specularExponent;
    float m_limitingConeAngle;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_LIGHTSOURCE(SpotLightSource, LightType::LS_SPOT)
