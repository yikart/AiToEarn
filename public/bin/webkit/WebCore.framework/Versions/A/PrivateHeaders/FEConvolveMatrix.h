/*
 * Copyright (C) 2004, 2005, 2006, 2007 Nikolas Zimmermann <zimmermann@kde.org>
 * Copyright (C) 2004, 2005 Rob Buis <buis@kde.org>
 * Copyright (C) 2005 Eric Seidel <eric@webkit.org>
 * Copyright (C) 2010 Zoltan Herczeg <zherczeg@webkit.org>
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
#include "FloatPoint.h"
#include <wtf/Vector.h>

namespace WebCore {

enum class EdgeModeType : uint8_t {
    Unknown,
    Duplicate,
    Wrap,
    None
};

class FEConvolveMatrix : public FilterEffect {
public:
    WEBCORE_EXPORT static Ref<FEConvolveMatrix> create(const IntSize& kernelSize, float divisor, float bias, const IntPoint& targetOffset, EdgeModeType, const FloatPoint& kernelUnitLength, bool preserveAlpha, const Vector<float>& kernelMatrix, DestinationColorSpace = DestinationColorSpace::SRGB());

    bool operator==(const FEConvolveMatrix&) const;

    IntSize kernelSize() const { return m_kernelSize; }
    void setKernelSize(const IntSize&);

    const Vector<float>& kernel() const { return m_kernelMatrix; }
    void setKernel(const Vector<float>&);

    float divisor() const { return m_divisor; }
    bool setDivisor(float);

    float bias() const { return m_bias; }
    bool setBias(float);

    IntPoint targetOffset() const { return m_targetOffset; }
    bool setTargetOffset(const IntPoint&);

    EdgeModeType edgeMode() const { return m_edgeMode; }
    bool setEdgeMode(EdgeModeType);

    FloatPoint kernelUnitLength() const { return m_kernelUnitLength; }
    bool setKernelUnitLength(const FloatPoint&);

    bool preserveAlpha() const { return m_preserveAlpha; }
    bool setPreserveAlpha(bool);

private:
    FEConvolveMatrix(const IntSize& kernelSize, float divisor, float bias, const IntPoint& targetOffset, EdgeModeType, const FloatPoint& kernelUnitLength, bool preserveAlpha, const Vector<float>& kernelMatrix, DestinationColorSpace);

    bool operator==(const FilterEffect& other) const override { return areEqual<FEConvolveMatrix>(*this, other); }

    FloatRect calculateImageRect(const Filter&, std::span<const FloatRect> inputImageRects, const FloatRect& primitiveSubregion) const override;

    std::unique_ptr<FilterEffectApplier> createSoftwareApplier() const override;

    WTF::TextStream& externalRepresentation(WTF::TextStream&, FilterRepresentation) const override;

    IntSize m_kernelSize;
    float m_divisor;
    float m_bias;
    IntPoint m_targetOffset;
    EdgeModeType m_edgeMode;
    FloatPoint m_kernelUnitLength;
    bool m_preserveAlpha;
    Vector<float> m_kernelMatrix;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_FILTER_FUNCTION(FEConvolveMatrix)
