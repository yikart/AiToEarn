/*
 * Copyright (C) 2008 Alex Mathews <possessedpenguinbob@gmail.com>
 * Copyright (C) 2004, 2005, 2006, 2007 Nikolas Zimmermann <zimmermann@kde.org>
 * Copyright (C) 2004, 2005 Rob Buis <buis@kde.org>
 * Copyright (C) 2005 Eric Seidel <eric@webkit.org>
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
#include <wtf/ArgumentCoder.h>
#include <wtf/Ref.h>

namespace WebCore {

class DistantLightSource : public LightSource {
    friend struct IPC::ArgumentCoder<DistantLightSource, void>;

public:
    WEBCORE_EXPORT static Ref<DistantLightSource> create(float azimuth, float elevation);

    bool operator==(const DistantLightSource&) const;

    // These are in degrees.
    float azimuth() const { return m_azimuth; }
    float elevation() const { return m_elevation; }

    bool setAzimuth(float) override;
    bool setElevation(float) override;

    void initPaintingData(const Filter&, const FilterImage& result, PaintingData&) const override;
    ComputedLightingData computePixelLightingData(const PaintingData&, int x, int y, float z) const final;

    WTF::TextStream& externalRepresentation(WTF::TextStream&) const override;

private:
    DistantLightSource(float azimuth, float elevation);

    bool operator==(const LightSource& other) const override { return areEqual<DistantLightSource>(*this, other); }

    float m_azimuth;
    float m_elevation;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_LIGHTSOURCE(DistantLightSource, LightType::LS_DISTANT)
