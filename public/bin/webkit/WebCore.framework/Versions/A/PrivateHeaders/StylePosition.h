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

#include "CSSPosition.h"
#include "StylePrimitiveNumericTypes.h"

namespace WebCore {
namespace Style {

struct TwoComponentPositionHorizontal {
    LengthPercentage<> offset;

    bool operator==(const TwoComponentPositionHorizontal&) const = default;
};
DEFINE_TYPE_WRAPPER(TwoComponentPositionHorizontal, offset);

struct TwoComponentPositionVertical {
    LengthPercentage<> offset;

    bool operator==(const TwoComponentPositionVertical&) const = default;
};
DEFINE_TYPE_WRAPPER(TwoComponentPositionVertical, offset);

struct Position  {
    Position(TwoComponentPositionHorizontal&& x, TwoComponentPositionVertical&& y)
        : value { WTFMove(x.offset), WTFMove(y.offset) }
    {
    }

    Position(LengthPercentage<>&& x, LengthPercentage<>&& y)
        : value { WTFMove(x), WTFMove(y) }
    {
    }

    Position(SpaceSeparatedPoint<LengthPercentage<>>&& point)
        : value { WTFMove(point) }
    {
    }

    Position(FloatPoint point)
        : value { LengthPercentage<> { Length<> { point.x() } }, LengthPercentage<> { Length<> { point.y() } } }
    {
    }

    bool operator==(const Position&) const = default;

    LengthPercentage<> x() const { return value.x(); }
    LengthPercentage<> y() const { return value.y(); }

    SpaceSeparatedPoint<LengthPercentage<>> value;
};

template<size_t I> const auto& get(const Position& position)
{
    return get<I>(position.value);
}

// MARK: - Conversion

// Specialization is needed for ToStyle to implement resolution of keyword value to <length-percentage>.
template<> struct ToCSSMapping<TwoComponentPositionHorizontal> { using type = CSS::TwoComponentPositionHorizontal; };
template<> struct ToStyle<CSS::TwoComponentPositionHorizontal> { auto operator()(const CSS::TwoComponentPositionHorizontal&, const BuilderState&) -> TwoComponentPositionHorizontal; };
template<> struct ToCSSMapping<TwoComponentPositionVertical> { using type = CSS::TwoComponentPositionVertical; };
template<> struct ToStyle<CSS::TwoComponentPositionVertical> { auto operator()(const CSS::TwoComponentPositionVertical&, const BuilderState&) -> TwoComponentPositionVertical; };

// Specialization is needed for both ToCSS and ToStyle due to differences in type structure.
template<> struct ToCSS<Position> { auto operator()(const Position&, const RenderStyle&) -> CSS::Position; };
template<> struct ToStyle<CSS::Position> { auto operator()(const CSS::Position&, const BuilderState&) -> Position; };

// MARK: - Evaluation

FloatPoint evaluate(const Position&, FloatSize referenceBox);
float evaluate(const TwoComponentPositionHorizontal&, float referenceWidth);
float evaluate(const TwoComponentPositionVertical&, float referenceHeight);

} // namespace Style
} // namespace WebCore

STYLE_TUPLE_LIKE_CONFORMANCE(TwoComponentPositionHorizontal, 1)
STYLE_TUPLE_LIKE_CONFORMANCE(TwoComponentPositionVertical, 1)
STYLE_TUPLE_LIKE_CONFORMANCE(Position, 2)
