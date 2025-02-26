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

enum class CompositeOperationType : uint8_t {
    FECOMPOSITE_OPERATOR_UNKNOWN    = 0,
    FECOMPOSITE_OPERATOR_OVER       = 1,
    FECOMPOSITE_OPERATOR_IN         = 2,
    FECOMPOSITE_OPERATOR_OUT        = 3,
    FECOMPOSITE_OPERATOR_ATOP       = 4,
    FECOMPOSITE_OPERATOR_XOR        = 5,
    FECOMPOSITE_OPERATOR_ARITHMETIC = 6,
    FECOMPOSITE_OPERATOR_LIGHTER    = 7
};

class FEComposite : public FilterEffect {
public:
    WEBCORE_EXPORT static Ref<FEComposite> create(const CompositeOperationType&, float k1, float k2, float k3, float k4, DestinationColorSpace = DestinationColorSpace::SRGB());

    bool operator==(const FEComposite&) const;

    CompositeOperationType operation() const { return m_type; }
    bool setOperation(CompositeOperationType);

    float k1() const { return m_k1; }
    bool setK1(float);

    float k2() const { return m_k2; }
    bool setK2(float);

    float k3() const { return m_k3; }
    bool setK3(float);

    float k4() const { return m_k4; }
    bool setK4(float);

private:
    FEComposite(const CompositeOperationType&, float k1, float k2, float k3, float k4, DestinationColorSpace);

    bool operator==(const FilterEffect& other) const override { return areEqual<FEComposite>(*this, other); }

    unsigned numberOfEffectInputs() const override { return 2; }

    FloatRect calculateImageRect(const Filter&, std::span<const FloatRect> inputImageRects, const FloatRect& primitiveSubregion) const override;

    bool resultIsValidPremultiplied() const override { return m_type != CompositeOperationType::FECOMPOSITE_OPERATOR_ARITHMETIC; }

    std::unique_ptr<FilterEffectApplier> createSoftwareApplier() const override;

    WTF::TextStream& externalRepresentation(WTF::TextStream&, FilterRepresentation) const override;

#if HAVE(ARM_NEON_INTRINSICS)
    template <int b1, int b4>
    static inline void computeArithmeticPixelsNeon(const uint8_t* source, uint8_t* destination, unsigned pixelArrayLength, float k1, float k2, float k3, float k4);

    static inline void platformArithmeticNeon(const uint8_t* source, uint8_t* destination, unsigned pixelArrayLength, float k1, float k2, float k3, float k4);
#endif

    CompositeOperationType m_type;
    float m_k1;
    float m_k2;
    float m_k3;
    float m_k4;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_FILTER_FUNCTION(FEComposite)
