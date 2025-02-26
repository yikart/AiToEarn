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

#include "CSSGradient.h"
#include "CSSPosition.h"
#include "CSSPrimitiveNumericTypes.h"

namespace WebCore {
namespace CSS {

// <circle()> = circle( <radial-size>? [ at <position> ]? )
// https://drafts.csswg.org/css-shapes-1/#funcdef-basic-shape-circle
struct Circle {
    using Extent = std::variant<Keyword::ClosestCorner, Keyword::ClosestSide, Keyword::FarthestCorner, Keyword::FarthestSide>;
    // FIXME: The spec says that this should take Length, not a LengthPercentage, but this does not match the tests.
    using Length = CSS::LengthPercentage<Nonnegative>;
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

template<> struct Serialize<Circle> { void operator()(StringBuilder&, const Circle&); };

} // namespace CSS
} // namespace WebCore

CSS_TUPLE_LIKE_CONFORMANCE(Circle, 2)
