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

#include "CSSBorderRadius.h"
#include "CSSPrimitiveNumericTypes.h"
#include "RectEdges.h"

namespace WebCore {
namespace CSS {

// <rect()> = rect( [ <length-percentage> | auto ]{4} [ round <'border-radius'> ]? )
// https://drafts.csswg.org/css-shapes-1/#funcdef-basic-shape-rect
struct Rect {
    using Edge = std::variant<LengthPercentage<>, Keyword::Auto>;

    SpaceSeparatedRectEdges<Edge> edges;
    BorderRadius radii;

    bool operator==(const Rect&) const = default;
};
using RectFunction = FunctionNotation<CSSValueRect, Rect>;

template<size_t I> const auto& get(const Rect& value)
{
    if constexpr (!I)
        return value.edges;
    else if constexpr (I == 1)
        return value.radii;
}

template<> struct Serialize<Rect> { void operator()(StringBuilder&, const Rect&); };

} // namespace CSS
} // namespace WebCore

CSS_TUPLE_LIKE_CONFORMANCE(Rect, 2)
