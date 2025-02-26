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
#include "FloatRoundedRect.h"
#include "StylePrimitiveNumericTypes.h"

namespace WebCore {
namespace Style {

// <'border-radius'> = <length-percentage [0,∞]>{1,4} [ / <length-percentage [0,∞]>{1,4} ]?
// https://drafts.csswg.org/css-backgrounds-3/#propdef-border-radius
struct BorderRadius {
    using Corner = SpaceSeparatedSize<LengthPercentage<CSS::Nonnegative>>;

    constexpr bool operator==(const BorderRadius&) const = default;

    Corner topLeft;
    Corner topRight;
    Corner bottomRight;
    Corner bottomLeft;
};

template<size_t I> const auto& get(const BorderRadius& value)
{
    if constexpr (!I)
        return value.topLeft;
    else if constexpr (I == 1)
        return value.topRight;
    else if constexpr (I == 2)
        return value.bottomRight;
    else if constexpr (I == 3)
        return value.bottomLeft;
}

template<> struct ToCSS<BorderRadius> { auto operator()(const BorderRadius&, const RenderStyle&) -> CSS::BorderRadius; };
template<> struct ToStyle<CSS::BorderRadius> { auto operator()(const CSS::BorderRadius&, const BuilderState&) -> BorderRadius; };

FloatRoundedRect::Radii evaluate(const BorderRadius&, FloatSize referenceBox);

} // namespace Style
} // namespace WebCore

STYLE_TUPLE_LIKE_CONFORMANCE(BorderRadius, 4)
