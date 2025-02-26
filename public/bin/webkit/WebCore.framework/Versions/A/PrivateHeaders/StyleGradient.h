/*
 * Copyright (C) 2022 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
 * OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
 * TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
 * THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
 */

#pragma once

#include "CSSGradient.h"
#include "StyleColor.h"
#include "StylePosition.h"
#include "StylePrimitiveNumericTypes.h"

namespace WebCore {

class Gradient;

namespace Style {

// MARK: - Common Types

using DeprecatedGradientPosition   = SpaceSeparatedArray<NumberOrPercentage<>, 2>;

using Horizontal                   = CSS::Horizontal;
using Vertical                     = CSS::Vertical;

using RadialGradientExtent         = CSS::RadialGradientExtent;
using PrefixedRadialGradientExtent = CSS::PrefixedRadialGradientExtent;

// MARK: - Gradient Color Interpolation Definitions.

using GradientColorInterpolationMethod = CSS::GradientColorInterpolationMethod;

template<> inline constexpr bool TreatAsNonConverting<GradientColorInterpolationMethod> = true;

// MARK: - Gradient Color Stop Definitions.

template<typename Stop> using GradientColorStopList = CommaSeparatedVector<Stop, 2>;

template<typename C, typename P> struct GradientColorStop {
    using Color = C;
    using Position = P;
    using List = GradientColorStopList<GradientColorStop<C, P>>;

    Color color;
    Position position;

    bool operator==(const GradientColorStop<C, P>&) const = default;
};
template<typename C, typename P> GradientColorStop(C color, P position) -> GradientColorStop<C, P>;

template<size_t I, typename C, typename P> const auto& get(const GradientColorStop<C, P>& stop)
{
    if constexpr (!I)
        return stop.color;
    else if constexpr (I == 1)
        return stop.position;
}

using GradientAngularColorStopColor = Markable<Color>;
using GradientAngularColorStopPosition = std::optional<AnglePercentage<>>;
using GradientAngularColorStop = GradientColorStop<GradientAngularColorStopColor, GradientAngularColorStopPosition>;
using GradientAngularColorStopList = GradientColorStopList<GradientAngularColorStop>;

using GradientLinearColorStopColor = Markable<Color>;
using GradientLinearColorStopPosition = std::optional<LengthPercentage<>>;
using GradientLinearColorStop = GradientColorStop<GradientLinearColorStopColor, GradientLinearColorStopPosition>;
using GradientLinearColorStopList = GradientColorStopList<GradientLinearColorStop>;

using GradientDeprecatedColorStopColor = Color;
using GradientDeprecatedColorStopPosition = NumberOrPercentageResolvedToNumber<>;
using GradientDeprecatedColorStop = GradientColorStop<GradientDeprecatedColorStopColor, GradientDeprecatedColorStopPosition>;
using GradientDeprecatedColorStopList = GradientColorStopList<GradientDeprecatedColorStop>;

template<> struct ToCSS<GradientAngularColorStop> { auto operator()(const GradientAngularColorStop&, const RenderStyle&) -> CSS::GradientAngularColorStop; };
template<> struct ToCSS<GradientLinearColorStop> { auto operator()(const GradientLinearColorStop&, const RenderStyle&) -> CSS::GradientLinearColorStop; };
template<> struct ToCSS<GradientDeprecatedColorStop> { auto operator()(const GradientDeprecatedColorStop&, const RenderStyle&) -> CSS::GradientDeprecatedColorStop; };

template<> struct ToStyle<CSS::GradientAngularColorStop> { auto operator()(const CSS::GradientAngularColorStop&, const BuilderState&) -> GradientAngularColorStop; };
template<> struct ToStyle<CSS::GradientLinearColorStop> { auto operator()(const CSS::GradientLinearColorStop&, const BuilderState&) -> GradientLinearColorStop; };
template<> struct ToStyle<CSS::GradientDeprecatedColorStop> { auto operator()(const CSS::GradientDeprecatedColorStop&, const BuilderState&) -> GradientDeprecatedColorStop; };

// MARK: - LinearGradient

struct LinearGradient {
    using GradientLine = std::variant<Angle<>, Horizontal, Vertical, SpaceSeparatedTuple<Horizontal, Vertical>>;

    GradientColorInterpolationMethod colorInterpolationMethod;
    GradientLine gradientLine;
    GradientLinearColorStopList stops;

    bool operator==(const LinearGradient&) const = default;
};

template<size_t I> const auto& get(const LinearGradient& gradient)
{
    if constexpr (!I)
        return gradient.colorInterpolationMethod;
    else if constexpr (I == 1)
        return gradient.gradientLine;
    else if constexpr (I == 2)
        return gradient.stops;
}

DEFINE_TYPE_MAPPING(CSS::LinearGradient, LinearGradient)

// MARK: - PrefixedLinearGradient

struct PrefixedLinearGradient {
    using GradientLine = std::variant<Angle<>, Horizontal, Vertical, SpaceSeparatedTuple<Horizontal, Vertical>>;

    GradientColorInterpolationMethod colorInterpolationMethod;
    GradientLine gradientLine;
    GradientLinearColorStopList stops;

    bool operator==(const PrefixedLinearGradient&) const = default;
};

template<size_t I> const auto& get(const PrefixedLinearGradient& gradient)
{
    if constexpr (!I)
        return gradient.colorInterpolationMethod;
    else if constexpr (I == 1)
        return gradient.gradientLine;
    else if constexpr (I == 2)
        return gradient.stops;
}

DEFINE_TYPE_MAPPING(CSS::PrefixedLinearGradient, PrefixedLinearGradient)

// MARK: - DeprecatedLinearGradient

struct DeprecatedLinearGradient {
    using GradientLine = CommaSeparatedArray<DeprecatedGradientPosition, 2>;

    GradientColorInterpolationMethod colorInterpolationMethod;
    GradientLine gradientLine;
    GradientDeprecatedColorStopList stops;

    bool operator==(const DeprecatedLinearGradient&) const = default;
};

template<size_t I> const auto& get(const DeprecatedLinearGradient& gradient)
{
    if constexpr (!I)
        return gradient.colorInterpolationMethod;
    else if constexpr (I == 1)
        return gradient.gradientLine;
    else if constexpr (I == 2)
        return gradient.stops;
}

DEFINE_TYPE_MAPPING(CSS::DeprecatedLinearGradient, DeprecatedLinearGradient)

// MARK: - RadialGradient

struct RadialGradient {
    using Extent = CSS::RadialGradient::Extent;
    struct Ellipse {
        using Size = SpaceSeparatedArray<LengthPercentage<CSS::Nonnegative>, 2>;
        std::variant<Size, Extent> size;
        std::optional<Position> position;
        bool operator==(const Ellipse&) const = default;
    };
    struct Circle {
        using Length = Style::Length<CSS::Nonnegative>;
        std::variant<Length, Extent> size;
        std::optional<Position> position;
        bool operator==(const Circle&) const = default;
    };
    using GradientBox = std::variant<Ellipse, Circle>;

    GradientColorInterpolationMethod colorInterpolationMethod;
    GradientBox gradientBox;
    GradientLinearColorStopList stops;

    bool operator==(const RadialGradient&) const = default;
};

template<size_t I> const auto& get(const RadialGradient::Ellipse& ellipse)
{
    if constexpr (!I)
        return ellipse.size;
    else if constexpr (I == 1)
        return ellipse.position;
}

template<size_t I> const auto& get(const RadialGradient::Circle& circle)
{
    if constexpr (!I)
        return circle.size;
    else if constexpr (I == 1)
        return circle.position;
}

template<size_t I> const auto& get(const RadialGradient& gradient)
{
    if constexpr (!I)
        return gradient.colorInterpolationMethod;
    else if constexpr (I == 1)
        return gradient.gradientBox;
    else if constexpr (I == 2)
        return gradient.stops;
}

DEFINE_TYPE_MAPPING(CSS::RadialGradient::Ellipse, RadialGradient::Ellipse)
DEFINE_TYPE_MAPPING(CSS::RadialGradient::Circle, RadialGradient::Circle)
DEFINE_TYPE_MAPPING(CSS::RadialGradient, RadialGradient)

// MARK: - PrefixedRadialGradient

struct PrefixedRadialGradient {
    using Extent = CSS::PrefixedRadialGradient::Extent;
    struct Ellipse {
        using Size = SpaceSeparatedArray<LengthPercentage<CSS::Nonnegative>, 2>;
        std::optional<std::variant<Size, Extent>> size;
        std::optional<Position> position;
        bool operator==(const Ellipse&) const = default;
    };
    struct Circle {
        std::optional<Extent> size;
        std::optional<Position> position;
        bool operator==(const Circle&) const = default;
    };
    using GradientBox = std::variant<Ellipse, Circle>;

    GradientColorInterpolationMethod colorInterpolationMethod;
    GradientBox gradientBox;
    GradientLinearColorStopList stops;

    bool operator==(const PrefixedRadialGradient&) const = default;
};

template<size_t I> const auto& get(const PrefixedRadialGradient::Ellipse& ellipse)
{
    if constexpr (!I)
        return ellipse.size;
    else if constexpr (I == 1)
        return ellipse.position;
}

template<size_t I> const auto& get(const PrefixedRadialGradient::Circle& circle)
{
    if constexpr (!I)
        return circle.size;
    else if constexpr (I == 1)
        return circle.position;
}

template<size_t I> const auto& get(const PrefixedRadialGradient& gradient)
{
    if constexpr (!I)
        return gradient.colorInterpolationMethod;
    else if constexpr (I == 1)
        return gradient.gradientBox;
    else if constexpr (I == 2)
        return gradient.stops;
}

DEFINE_TYPE_MAPPING(CSS::PrefixedRadialGradient::Ellipse, PrefixedRadialGradient::Ellipse)
DEFINE_TYPE_MAPPING(CSS::PrefixedRadialGradient::Circle, PrefixedRadialGradient::Circle)
DEFINE_TYPE_MAPPING(CSS::PrefixedRadialGradient, PrefixedRadialGradient)

// MARK: - DeprecatedRadialGradient

struct DeprecatedRadialGradient {
    struct GradientBox {
        DeprecatedGradientPosition first;
        Number<CSS::Nonnegative> firstRadius;
        DeprecatedGradientPosition second;
        Number<CSS::Nonnegative> secondRadius;

        bool operator==(const GradientBox&) const = default;
    };

    GradientColorInterpolationMethod colorInterpolationMethod;
    GradientBox gradientBox;
    GradientDeprecatedColorStopList stops;

    bool operator==(const DeprecatedRadialGradient&) const = default;
};

template<size_t I> const auto& get(const DeprecatedRadialGradient::GradientBox& gradientBox)
{
    if constexpr (!I)
        return gradientBox.first;
    else if constexpr (I == 1)
        return gradientBox.firstRadius;
    else if constexpr (I == 2)
        return gradientBox.second;
    else if constexpr (I == 3)
        return gradientBox.secondRadius;
}

template<size_t I> const auto& get(const DeprecatedRadialGradient& gradient)
{
    if constexpr (!I)
        return gradient.colorInterpolationMethod;
    else if constexpr (I == 1)
        return gradient.gradientBox;
    else if constexpr (I == 2)
        return gradient.stops;
}

DEFINE_TYPE_MAPPING(CSS::DeprecatedRadialGradient::GradientBox, DeprecatedRadialGradient::GradientBox)
DEFINE_TYPE_MAPPING(CSS::DeprecatedRadialGradient, DeprecatedRadialGradient)

// MARK: - ConicGradient

struct ConicGradient {
    struct GradientBox {
        std::optional<Angle<>> angle;
        std::optional<Position> position;

        bool operator==(const GradientBox&) const = default;
    };

    GradientColorInterpolationMethod colorInterpolationMethod;
    GradientBox gradientBox;
    GradientAngularColorStopList stops;

    bool operator==(const ConicGradient&) const = default;
};

template<size_t I> const auto& get(const ConicGradient::GradientBox& gradientBox)
{
    if constexpr (!I)
        return gradientBox.angle;
    else if constexpr (I == 1)
        return gradientBox.position;
}

template<size_t I> const auto& get(const ConicGradient& gradient)
{
    if constexpr (!I)
        return gradient.colorInterpolationMethod;
    else if constexpr (I == 1)
        return gradient.gradientBox;
    else if constexpr (I == 2)
        return gradient.stops;
}

DEFINE_TYPE_MAPPING(CSS::ConicGradient::GradientBox, ConicGradient::GradientBox)
DEFINE_TYPE_MAPPING(CSS::ConicGradient, ConicGradient)

// MARK: - Gradient (variant)

using Gradient = std::variant<
    // Linear
    FunctionNotation<CSSValueLinearGradient, LinearGradient>,
    FunctionNotation<CSSValueRepeatingLinearGradient, LinearGradient>,
    FunctionNotation<CSSValueWebkitLinearGradient, PrefixedLinearGradient>,
    FunctionNotation<CSSValueWebkitRepeatingLinearGradient, PrefixedLinearGradient>,
    FunctionNotation<CSSValueWebkitGradient, DeprecatedLinearGradient>,

    // Radial
    FunctionNotation<CSSValueRadialGradient, RadialGradient>,
    FunctionNotation<CSSValueRepeatingRadialGradient, RadialGradient>,
    FunctionNotation<CSSValueWebkitRadialGradient, PrefixedRadialGradient>,
    FunctionNotation<CSSValueWebkitRepeatingRadialGradient, PrefixedRadialGradient>,
    FunctionNotation<CSSValueWebkitGradient, DeprecatedRadialGradient>,

    // Conic
    FunctionNotation<CSSValueConicGradient, ConicGradient>,
    FunctionNotation<CSSValueRepeatingConicGradient, ConicGradient>
>;

// Creates a platform gradient from the style representation.
Ref<WebCore::Gradient> createPlatformGradient(const Gradient&, const FloatSize&, const RenderStyle&);

// Returns whether it caching based on the gradient's stops is allowed.
bool stopsAreCacheable(const Gradient&);

// Returns whether the gradient is opaque.
bool isOpaque(const Gradient&, const RenderStyle&);

} // namespace Style
} // namespace WebCore

STYLE_TUPLE_LIKE_CONFORMANCE(LinearGradient, 3)
STYLE_TUPLE_LIKE_CONFORMANCE(PrefixedLinearGradient, 3)
STYLE_TUPLE_LIKE_CONFORMANCE(DeprecatedLinearGradient, 3)
STYLE_TUPLE_LIKE_CONFORMANCE(RadialGradient::Ellipse, 2)
STYLE_TUPLE_LIKE_CONFORMANCE(RadialGradient::Circle, 2)
STYLE_TUPLE_LIKE_CONFORMANCE(RadialGradient, 3)
STYLE_TUPLE_LIKE_CONFORMANCE(PrefixedRadialGradient::Ellipse, 2)
STYLE_TUPLE_LIKE_CONFORMANCE(PrefixedRadialGradient::Circle, 2)
STYLE_TUPLE_LIKE_CONFORMANCE(PrefixedRadialGradient, 3)
STYLE_TUPLE_LIKE_CONFORMANCE(DeprecatedRadialGradient::GradientBox, 4)
STYLE_TUPLE_LIKE_CONFORMANCE(DeprecatedRadialGradient, 3)
STYLE_TUPLE_LIKE_CONFORMANCE(ConicGradient::GradientBox, 2)
STYLE_TUPLE_LIKE_CONFORMANCE(ConicGradient, 3)

template<typename C, typename P> inline constexpr bool WebCore::TreatAsTupleLike<WebCore::Style::GradientColorStop<C, P>> = true;

namespace std {

template<typename C, typename P> class tuple_size<WebCore::Style::GradientColorStop<C, P>> : public std::integral_constant<size_t, 2> { };
template<size_t I, typename C, typename P> class tuple_element<I, WebCore::Style::GradientColorStop<C, P>> {
public:
    using type = decltype(WebCore::Style::get<I>(std::declval<WebCore::Style::GradientColorStop<C, P>>()));
};

} // namespace std
