/*
 * Copyright (C) 2008-2021 Apple Inc. All rights reserved.
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
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "CSSColor.h"
#include "CSSPosition.h"
#include "CSSValueTypes.h"
#include "ColorInterpolationMethod.h"

namespace WebCore {
namespace CSS {

// MARK: - Common Types

using DeprecatedGradientPosition = SpaceSeparatedArray<NumberOrPercentage<>, 2>;

using Horizontal = std::variant<Keyword::Left, Keyword::Right>;
using Vertical   = std::variant<Keyword::Top, Keyword::Bottom>;

using RadialGradientExtent         = std::variant<Keyword::ClosestCorner, Keyword::ClosestSide, Keyword::FarthestCorner, Keyword::FarthestSide>;
using PrefixedRadialGradientExtent = std::variant<Keyword::ClosestCorner, Keyword::ClosestSide, Keyword::FarthestCorner, Keyword::FarthestSide, Keyword::Contain, Keyword::Cover>;

// MARK: - Gradient Color Interpolation Definitions.

struct GradientColorInterpolationMethod {
    enum class Default : bool { SRGB, OKLab };

    ColorInterpolationMethod method;
    Default defaultMethod;

    static GradientColorInterpolationMethod legacyMethod(AlphaPremultiplication alphaPremultiplication)
    {
        return { { ColorInterpolationMethod::SRGB { }, alphaPremultiplication }, Default::SRGB };
    }

    bool operator==(const GradientColorInterpolationMethod&) const = default;
};

template<> struct ComputedStyleDependenciesCollector<GradientColorInterpolationMethod> { constexpr void operator()(ComputedStyleDependencies&, const GradientColorInterpolationMethod&) { } };
template<> struct CSSValueChildrenVisitor<GradientColorInterpolationMethod> { constexpr IterationStatus operator()(const Function<IterationStatus(CSSValue&)>&, const GradientColorInterpolationMethod&) { return IterationStatus::Continue; } };

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

template<> struct Serialize<GradientAngularColorStop> { void operator()(StringBuilder&, const GradientAngularColorStop&); };
template<> struct Serialize<GradientLinearColorStop> { void operator()(StringBuilder&, const GradientLinearColorStop&); };
template<> struct Serialize<GradientDeprecatedColorStop> { void operator()(StringBuilder&, const GradientDeprecatedColorStop&); };

// MARK: - LinearGradient

struct LinearGradient {
    using GradientLine = std::variant<Angle<>, Horizontal, Vertical, SpaceSeparatedTuple<Horizontal, Vertical>>;

    GradientColorInterpolationMethod colorInterpolationMethod;
    GradientLine gradientLine;
    GradientLinearColorStopList stops;

    bool operator==(const LinearGradient&) const = default;
};

template<> struct Serialize<LinearGradient> { void operator()(StringBuilder&, const LinearGradient&); };

template<size_t I> const auto& get(const LinearGradient& gradient)
{
    if constexpr (!I)
        return gradient.colorInterpolationMethod;
    else if constexpr (I == 1)
        return gradient.gradientLine;
    else if constexpr (I == 2)
        return gradient.stops;
}

// MARK: - PrefixedLinearGradient

struct PrefixedLinearGradient {
    using GradientLine = std::variant<Angle<>, Horizontal, Vertical, SpaceSeparatedTuple<Horizontal, Vertical>>;

    GradientColorInterpolationMethod colorInterpolationMethod;
    GradientLine gradientLine;
    GradientLinearColorStopList stops;

    bool operator==(const PrefixedLinearGradient&) const = default;
};

template<> struct Serialize<PrefixedLinearGradient> { void operator()(StringBuilder&, const PrefixedLinearGradient&); };

template<size_t I> const auto& get(const PrefixedLinearGradient& gradient)
{
    if constexpr (!I)
        return gradient.colorInterpolationMethod;
    else if constexpr (I == 1)
        return gradient.gradientLine;
    else if constexpr (I == 2)
        return gradient.stops;
}

// MARK: - DeprecatedLinearGradient

struct DeprecatedLinearGradient {
    using GradientLine = CommaSeparatedArray<DeprecatedGradientPosition, 2>;

    GradientColorInterpolationMethod colorInterpolationMethod;
    GradientLine gradientLine;
    GradientDeprecatedColorStopList stops;

    bool operator==(const DeprecatedLinearGradient&) const = default;
};

template<> struct Serialize<DeprecatedLinearGradient> { void operator()(StringBuilder&, const DeprecatedLinearGradient&); };

template<size_t I> const auto& get(const DeprecatedLinearGradient& gradient)
{
    if constexpr (!I)
        return gradient.colorInterpolationMethod;
    else if constexpr (I == 1)
        return gradient.gradientLine;
    else if constexpr (I == 2)
        return gradient.stops;
}

// MARK: - RadialGradient

struct RadialGradient {
    using Extent = RadialGradientExtent;
    struct Ellipse {
        using Size = SpaceSeparatedArray<LengthPercentage<Nonnegative>, 2>;
        std::variant<Size, Extent> size;
        std::optional<Position> position;
        bool operator==(const Ellipse&) const = default;
    };
    struct Circle {
        using Length = CSS::Length<Nonnegative>;
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

template<> struct Serialize<RadialGradient::Ellipse> { void operator()(StringBuilder&, const RadialGradient::Ellipse&); };
template<> struct Serialize<RadialGradient::Circle> { void operator()(StringBuilder&, const RadialGradient::Circle&); };
template<> struct Serialize<RadialGradient> { void operator()(StringBuilder&, const RadialGradient&); };

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

// MARK: - PrefixedRadialGradient

struct PrefixedRadialGradient {
    using Extent = PrefixedRadialGradientExtent;
    struct Ellipse {
        using Size = SpaceSeparatedArray<LengthPercentage<Nonnegative>, 2>;
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

template<> struct Serialize<PrefixedRadialGradient::Ellipse> { void operator()(StringBuilder&, const PrefixedRadialGradient::Ellipse&); };
template<> struct Serialize<PrefixedRadialGradient::Circle> { void operator()(StringBuilder&, const PrefixedRadialGradient::Circle&); };
template<> struct Serialize<PrefixedRadialGradient> { void operator()(StringBuilder&, const PrefixedRadialGradient&); };

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

// MARK: - DeprecatedRadialGradient

struct DeprecatedRadialGradient {
    struct GradientBox {
        DeprecatedGradientPosition first;
        Number<Nonnegative> firstRadius;
        DeprecatedGradientPosition second;
        Number<Nonnegative> secondRadius;

        bool operator==(const GradientBox&) const = default;
    };

    GradientColorInterpolationMethod colorInterpolationMethod;
    GradientBox gradientBox;
    GradientDeprecatedColorStopList stops;

    bool operator==(const DeprecatedRadialGradient&) const = default;
};

template<> struct Serialize<DeprecatedRadialGradient::GradientBox> { void operator()(StringBuilder&, const DeprecatedRadialGradient::GradientBox&); };
template<> struct Serialize<DeprecatedRadialGradient> { void operator()(StringBuilder&, const DeprecatedRadialGradient&); };

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

template<> struct Serialize<ConicGradient::GradientBox> { void operator()(StringBuilder&, const ConicGradient::GradientBox&); };
template<> struct Serialize<ConicGradient> { void operator()(StringBuilder&, const ConicGradient&); };

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

} // namespace CSS
} // namespace WebCore

CSS_TUPLE_LIKE_CONFORMANCE(LinearGradient, 3)
CSS_TUPLE_LIKE_CONFORMANCE(PrefixedLinearGradient, 3)
CSS_TUPLE_LIKE_CONFORMANCE(DeprecatedLinearGradient, 3)
CSS_TUPLE_LIKE_CONFORMANCE(RadialGradient::Ellipse, 2)
CSS_TUPLE_LIKE_CONFORMANCE(RadialGradient::Circle, 2)
CSS_TUPLE_LIKE_CONFORMANCE(RadialGradient, 3)
CSS_TUPLE_LIKE_CONFORMANCE(PrefixedRadialGradient::Ellipse, 2)
CSS_TUPLE_LIKE_CONFORMANCE(PrefixedRadialGradient::Circle, 2)
CSS_TUPLE_LIKE_CONFORMANCE(PrefixedRadialGradient, 3)
CSS_TUPLE_LIKE_CONFORMANCE(DeprecatedRadialGradient::GradientBox, 4)
CSS_TUPLE_LIKE_CONFORMANCE(DeprecatedRadialGradient, 3)
CSS_TUPLE_LIKE_CONFORMANCE(ConicGradient::GradientBox, 2)
CSS_TUPLE_LIKE_CONFORMANCE(ConicGradient, 3)

template<typename C, typename P> inline constexpr bool WebCore::TreatAsTupleLike<WebCore::CSS::GradientColorStop<C, P>> = true;

namespace std {

template<typename C, typename P> class tuple_size<WebCore::CSS::GradientColorStop<C, P>> : public std::integral_constant<size_t, 2> { };
template<size_t I, typename C, typename P> class tuple_element<I, WebCore::CSS::GradientColorStop<C, P>> {
public:
    using type = decltype(WebCore::CSS::get<I>(std::declval<WebCore::CSS::GradientColorStop<C, P>>()));
};

} // namespace std
