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

#include "CSSInsetFunction.h"
#include "StyleBorderRadius.h"
#include "StylePathComputation.h"
#include "StylePrimitiveNumericTypes.h"

namespace WebCore {

class Path;

namespace Style {

struct Inset {
    using Insets = MinimallySerializingSpaceSeparatedRectEdges<LengthPercentage<>>;

    Insets insets;
    BorderRadius radii;

    bool operator==(const Inset&) const = default;
};
using InsetFunction = FunctionNotation<CSSValueInset, Inset>;

template<size_t I> const auto& get(const Inset& value)
{
    if constexpr (!I)
        return value.insets;
    else if constexpr (I == 1)
        return value.radii;
}

DEFINE_TYPE_MAPPING(CSS::Inset, Inset)

template<> struct PathComputation<Inset> { WebCore::Path operator()(const Inset&, const FloatRect&); };

} // namespace Style
} // namespace WebCore

STYLE_TUPLE_LIKE_CONFORMANCE(Inset, 2)
