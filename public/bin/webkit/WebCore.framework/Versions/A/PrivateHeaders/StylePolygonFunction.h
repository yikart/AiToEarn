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

#include "CSSPolygonFunction.h"
#include "StyleFillRule.h"
#include "StylePathComputation.h"
#include "StylePrimitiveNumericTypes.h"
#include "StyleWindRuleComputation.h"

namespace WebCore {
namespace Style {

struct Polygon {
    using Vertex = SpaceSeparatedPoint<LengthPercentage<>>;
    using Vertices = CommaSeparatedVector<Vertex>;

    // FIXME: Add support the "round" clause.

    std::optional<FillRule> fillRule;
    Vertices vertices;

    bool operator==(const Polygon&) const = default;
};
using PolygonFunction = FunctionNotation<CSSValuePolygon, Polygon>;

template<size_t I> const auto& get(const Polygon& value)
{
    if constexpr (!I)
        return value.fillRule;
    else if constexpr (I == 1)
        return value.vertices;
}

DEFINE_TYPE_MAPPING(CSS::Polygon, Polygon)

template<> struct PathComputation<Polygon> { WebCore::Path operator()(const Polygon&, const FloatRect&); };
template<> struct WindRuleComputation<Polygon> { WebCore::WindRule operator()(const Polygon&); };

template<> struct Blending<Polygon> {
    auto canBlend(const Polygon&, const Polygon&) -> bool;
    auto blend(const Polygon&, const Polygon&, const BlendingContext&) -> Polygon;
};

} // namespace Style
} // namespace WebCore

STYLE_TUPLE_LIKE_CONFORMANCE(Polygon, 2)
