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

namespace WebCore {
namespace CSS {

// <xywh()> = xywh( <length-percentage>{2} <length-percentage [0,∞]>{2} [ round <'border-radius'> ]? )
// https://drafts.csswg.org/css-shapes-1/#funcdef-basic-shape-xywh
struct Xywh {
    using Location = SpaceSeparatedPoint<LengthPercentage<>>;
    using Size = SpaceSeparatedSize<LengthPercentage<Nonnegative>>;

    Location location;
    Size size;
    BorderRadius radii;

    bool operator==(const Xywh&) const = default;
};
using XywhFunction = FunctionNotation<CSSValueXywh, Xywh>;

template<size_t I> const auto& get(const Xywh& value)
{
    if constexpr (!I)
        return value.location;
    else if constexpr (I == 1)
        return value.size;
    else if constexpr (I == 2)
        return value.radii;
}

template<> struct Serialize<Xywh> { void operator()(StringBuilder&, const Xywh&); };

} // namespace CSS
} // namespace WebCore

CSS_TUPLE_LIKE_CONFORMANCE(Xywh, 3)
