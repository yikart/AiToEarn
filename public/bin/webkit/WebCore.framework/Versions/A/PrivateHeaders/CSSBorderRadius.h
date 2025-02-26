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

#include "CSSPrimitiveNumericTypes.h"

namespace WebCore {
namespace CSS {

// <'border-radius'> = <length-percentage [0,∞]>{1,4} [ / <length-percentage [0,∞]>{1,4} ]?
// https://drafts.csswg.org/css-backgrounds-3/#propdef-border-radius
struct BorderRadius {
    using Axis = SpaceSeparatedArray<LengthPercentage<Nonnegative>, 4>;
    using Corner = SpaceSeparatedSize<LengthPercentage<Nonnegative>>;

    static BorderRadius defaultValue();

    Axis horizontal;
    Axis vertical;

    Corner topLeft() const      { return { horizontal.value[0], vertical.value[0] }; }
    Corner topRight() const     { return { horizontal.value[1], vertical.value[1] }; }
    Corner bottomRight() const  { return { horizontal.value[2], vertical.value[2] }; }
    Corner bottomLeft() const   { return { horizontal.value[3], vertical.value[3] }; }

    bool operator==(const BorderRadius&) const = default;
};

template<size_t I> const auto& get(const BorderRadius& value)
{
    if constexpr (!I)
        return value.horizontal;
    else if constexpr (I == 1)
        return value.vertical;
}

// Returns true if the provided `BorderRadius` contains the default value. This
// is used to know ahead of time if serialization is needed.
bool hasDefaultValue(const BorderRadius&);

inline BorderRadius BorderRadius::defaultValue()
{
    return BorderRadius {
        .horizontal = {
            LengthPercentage<Nonnegative> { LengthPercentageRaw<Nonnegative> { CSSUnitType::CSS_PX, 0 } },
            LengthPercentage<Nonnegative> { LengthPercentageRaw<Nonnegative> { CSSUnitType::CSS_PX, 0 } },
            LengthPercentage<Nonnegative> { LengthPercentageRaw<Nonnegative> { CSSUnitType::CSS_PX, 0 } },
            LengthPercentage<Nonnegative> { LengthPercentageRaw<Nonnegative> { CSSUnitType::CSS_PX, 0 } },
        },
        .vertical = {
            LengthPercentage<Nonnegative> { LengthPercentageRaw<Nonnegative> { CSSUnitType::CSS_PX, 0 } },
            LengthPercentage<Nonnegative> { LengthPercentageRaw<Nonnegative> { CSSUnitType::CSS_PX, 0 } },
            LengthPercentage<Nonnegative> { LengthPercentageRaw<Nonnegative> { CSSUnitType::CSS_PX, 0 } },
            LengthPercentage<Nonnegative> { LengthPercentageRaw<Nonnegative> { CSSUnitType::CSS_PX, 0 } },
        }
    };
}

template<> struct Serialize<BorderRadius> { void operator()(StringBuilder&, const BorderRadius&); };

} // namespace CSS
} // namespace WebCore

CSS_TUPLE_LIKE_CONFORMANCE(BorderRadius, 2)
