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

#include "CSSCircleFunction.h"
#include "StylePathComputation.h"
#include "StylePosition.h"
#include "StylePrimitiveNumericTypes.h"

namespace WebCore {
namespace Style {

struct Circle {
    using Extent = CSS::Circle::Extent;
    using Length = Style::LengthPercentage<CSS::Nonnegative>;
    using RadialSize = std::variant<Length, Extent>;

    RadialSize radius;
    std::optional<Position> position;

    bool operator==(const Circle&) const = default;
};
using CircleFunction = FunctionNotation<CSSValueCircle, Circle>;

template<size_t I> const auto& get(const Circle& value)
{
    if constexpr (!I)
        return value.radius;
    else if constexpr (I == 1)
        return value.position;
}

DEFINE_TYPE_MAPPING(CSS::Circle, Circle)

FloatPoint resolvePosition(const Circle& value, FloatSize boxSize);
float resolveRadius(const Circle& value, FloatSize boxSize, FloatPoint center);
WebCore::Path pathForCenterCoordinate(const Circle&, const FloatRect&, FloatPoint);

template<> struct PathComputation<Circle> { WebCore::Path operator()(const Circle&, const FloatRect&); };

template<> struct Blending<Circle> {
    auto canBlend(const Circle&, const Circle&) -> bool;
    auto blend(const Circle&, const Circle&, const BlendingContext&) -> Circle;
};

} // namespace Style
} // namespace WebCore

STYLE_TUPLE_LIKE_CONFORMANCE(Circle, 2)
