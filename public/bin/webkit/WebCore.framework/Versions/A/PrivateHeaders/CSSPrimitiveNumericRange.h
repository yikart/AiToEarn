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

#include <algorithm>
#include <limits>

namespace WebCore {
namespace CSS {

// Options to indicate how the range should be interpreted.
enum class RangeOptions {
    // `Default` indicates that at parse time, out of range values invalidate the parse.
    // Out of range values at style building always clamp.
    Default,

    // `ClampLower` indicates that parse time, an out of range lower value should clamp
    // instead of invalidating the parse. An out of range upper value will still invalidate
    // the parse. Out of range values at style building always clamp.
    ClampLower,

    // `ClampUpper` indicates that parse time, an out of range upper value should clamp
    // instead of invalidating the parse. An out of range lower value will still invalidate
    // the parse. Out of range values at style building always clamp.
    ClampUpper,

    // `ClampBoth` indicates that parse time, an out of range lower or upper value should
    // clamp instead of invalidating the parse. Out of range values at style building
    // always clamp.
    ClampBoth
};

// Representation for `CSS bracketed range notation`. Represents a closed range between (and including) `min` and `max`.
// https://drafts.csswg.org/css-values-4/#numeric-ranges
struct Range {
    // Convenience to allow for a shorter spelling of the appropriate infinity.
    static constexpr auto infinity = std::numeric_limits<double>::infinity();

    double min { -infinity };
    double max {  infinity };
    RangeOptions options { RangeOptions::Default };

    constexpr Range(double min, double max, RangeOptions options = RangeOptions::Default)
        : min { min }
        , max { max }
        , options { options }
    {
    }

    constexpr bool operator==(const Range&) const = default;
};

// Constant value for `[−∞,∞]`.
inline constexpr auto All = Range { -Range::infinity, Range::infinity, RangeOptions::Default };

// Constant value for `[0,∞]`.
inline constexpr auto Nonnegative = Range { 0, Range::infinity, RangeOptions::Default };

// Constant value for `[0,1]`.
inline constexpr auto ClosedUnitRange = Range { 0, 1 };

// Constant value for `[0,1(clamp upper)]`.
inline constexpr auto ClosedUnitRangeClampUpper = Range { 0, 1, RangeOptions::ClampUpper };

// Constant value for `[0,100]`.
inline constexpr auto ClosedPercentageRange = Range { 0, 100 };

// Constant value for `[0,100(clamp upper)]`.
inline constexpr auto ClosedPercentageRangeClampUpper = Range { 0, 100, RangeOptions::ClampUpper };

// Clamps a floating point value to within `range`.
template<Range range, std::floating_point T> constexpr T clampToRange(T value)
{
    return std::clamp<T>(value, range.min, range.max);
}

} // namespace CSS
} // namespace WebCore
