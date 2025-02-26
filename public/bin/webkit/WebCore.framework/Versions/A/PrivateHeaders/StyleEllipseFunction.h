/*
 * Copyright (C) 2024 Samuel Weinig <sam@webkit.org>
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "CSSEllipseFunction.h"
#include "StylePathComputation.h"
#include "StylePosition.h"
#include "StylePrimitiveNumericTypes.h"

namespace WebCore {
namespace Style {

struct Ellipse {
    using Extent = CSS::Ellipse::Extent;
    using Length = Style::LengthPercentage<CSS::Nonnegative>;
    using RadialSize = std::variant<Length, Extent>;

    SpaceSeparatedPair<RadialSize> radii;
    std::optional<Position> position;

    bool operator==(const Ellipse&) const = default;
};
using EllipseFunction = FunctionNotation<CSSValueEllipse, Ellipse>;

template<size_t I> const auto& get(const Ellipse& value)
{
    if constexpr (!I)
        return value.radii;
    else if constexpr (I == 1)
        return value.position;
}

DEFINE_TYPE_MAPPING(CSS::Ellipse, Ellipse)

FloatPoint resolvePosition(const Ellipse& value, FloatSize boxSize);
FloatSize resolveRadii(const Ellipse&, FloatSize boxSize, FloatPoint center);
WebCore::Path pathForCenterCoordinate(const Ellipse&, const FloatRect&, FloatPoint);

template<> struct PathComputation<Ellipse> { WebCore::Path operator()(const Ellipse&, const FloatRect&); };

template<> struct Blending<Ellipse> {
    auto canBlend(const Ellipse&, const Ellipse&) -> bool;
    auto blend(const Ellipse&, const Ellipse&, const BlendingContext&) -> Ellipse;
};

} // namespace Style
} // namespace WebCore

STYLE_TUPLE_LIKE_CONFORMANCE(Ellipse, 2)
