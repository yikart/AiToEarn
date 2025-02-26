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

#include "CSSShapeFunction.h"
#include "StyleFillRule.h"
#include "StylePathComputation.h"
#include "StylePosition.h"
#include "StylePrimitiveNumericTypes.h"
#include "StyleWindRuleComputation.h"

namespace WebCore {
namespace Style {

struct Path;

// <coordinate-pair> = <length-percentage>{2}
using CoordinatePair  = SpaceSeparatedPoint<LengthPercentage<>>;

using CommandAffinity = CSS::CommandAffinity;
using ArcSweep        = CSS::ArcSweep;
using ArcSize         = CSS::ArcSize;

// <control-point-anchor> = start | end | origin
using ControlPointAnchor = CSS::ControlPointAnchor;

// <to-position> = to <position>
struct ToPosition {
    static constexpr CommandAffinity affinity = CSS::Keyword::To { };

    Position offset;

    bool operator==(const ToPosition&) const = default;
};
DEFINE_TYPE_WRAPPER(ToPosition, offset);
DEFINE_TYPE_MAPPING(CSS::ToPosition, ToPosition)

// <by-coordinate-pair> = by <coordinate-pair>
struct ByCoordinatePair {
    static constexpr CommandAffinity affinity = CSS::Keyword::By { };

    CoordinatePair offset;

    bool operator==(const ByCoordinatePair&) const = default;
};
DEFINE_TYPE_WRAPPER(ByCoordinatePair, offset);
DEFINE_TYPE_MAPPING(CSS::ByCoordinatePair, ByCoordinatePair)

// <relative-control-point> = [<coordinate-pair> [from [start | end | origin]]?]
// Specified https://github.com/w3c/csswg-drafts/issues/10649#issuecomment-2412816773
struct RelativeControlPoint {
    using Anchor = ControlPointAnchor;
    static constexpr auto defaultAnchor = Anchor { CSS::Keyword::Start { } };

    CoordinatePair offset;
    std::optional<Anchor> anchor;

    bool operator==(const RelativeControlPoint&) const = default;
};
template<size_t I> const auto& get(const RelativeControlPoint& value)
{
    if constexpr (!I)
        return value.offset;
    if constexpr (I == 1)
        return value.anchor;
}
DEFINE_TYPE_MAPPING(CSS::RelativeControlPoint, RelativeControlPoint)

template<> struct Blending<RelativeControlPoint> {
    auto canBlend(const RelativeControlPoint&, const RelativeControlPoint&) -> bool;
    auto blend(const RelativeControlPoint&, const RelativeControlPoint&, const BlendingContext&) -> RelativeControlPoint;
};

// <to-control-point> = [<position> | <relative-control-point>]
// Specified https://github.com/w3c/csswg-drafts/issues/10649#issuecomment-2412816773
struct AbsoluteControlPoint {
    using Anchor = ControlPointAnchor;
    static constexpr auto defaultAnchor = Anchor { CSS::Keyword::Origin { } };

    Position offset;
    std::optional<Anchor> anchor;

    bool operator==(const AbsoluteControlPoint&) const = default;
};
template<size_t I> const auto& get(const AbsoluteControlPoint& value)
{
    if constexpr (!I)
        return value.offset;
    if constexpr (I == 1)
        return value.anchor;
}
DEFINE_TYPE_MAPPING(CSS::AbsoluteControlPoint, AbsoluteControlPoint)

template<> struct Blending<AbsoluteControlPoint> {
    auto canBlend(const AbsoluteControlPoint&, const AbsoluteControlPoint&) -> bool;
    auto blend(const AbsoluteControlPoint&, const AbsoluteControlPoint&, const BlendingContext&) -> AbsoluteControlPoint;
};

// MARK: - Move Command

// <move-command> = move [to <position>] | [by <coordinate-pair>]
// https://drafts.csswg.org/css-shapes-2/#typedef-shape-move-command
// Modified by https://github.com/w3c/csswg-drafts/issues/10649#issuecomment-2412816773
struct MoveCommand {
    static constexpr auto name = CSSValueMove;
    using To = ToPosition;
    using By = ByCoordinatePair;
    std::variant<To, By> toBy;

    bool operator==(const MoveCommand&) const = default;
};
DEFINE_TYPE_WRAPPER(MoveCommand, toBy);
DEFINE_TYPE_MAPPING(CSS::MoveCommand, MoveCommand)

// MARK: - Line Command

// <line-command> = line [to <position>] | [by <coordinate-pair>]
// https://drafts.csswg.org/css-shapes-2/#typedef-shape-line-command
// Modified by https://github.com/w3c/csswg-drafts/issues/10649#issuecomment-2412816773
struct LineCommand {
    static constexpr auto name = CSSValueLine;
    using To = ToPosition;
    using By = ByCoordinatePair;
    std::variant<To, By> toBy;

    bool operator==(const LineCommand&) const = default;
};
DEFINE_TYPE_WRAPPER(LineCommand, toBy);
DEFINE_TYPE_MAPPING(CSS::LineCommand, LineCommand)

// MARK: - HLine Command

// <horizontal-line-command> = hline [ to [ <length-percentage> | left | center | right | x-start | x-end ] | by <length-percentage> ]
// https://drafts.csswg.org/css-shapes-2/#typedef-shape-hv-line-command
// Modified by https://github.com/w3c/csswg-drafts/issues/10649#issuecomment-2426552611
struct HLineCommand {
    static constexpr auto name = CSSValueHline;
    struct To {
        static constexpr CommandAffinity affinity = CSS::Keyword::To { };

        TwoComponentPositionHorizontal offset;

        bool operator==(const To&) const = default;
    };
    struct By {
        static constexpr CommandAffinity affinity = CSS::Keyword::By { };

        LengthPercentage<> offset;

        bool operator==(const By&) const = default;
    };
    std::variant<To, By> toBy;

    bool operator==(const HLineCommand&) const = default;
};
DEFINE_TYPE_WRAPPER(HLineCommand::By, offset);
DEFINE_TYPE_WRAPPER(HLineCommand::To, offset);
DEFINE_TYPE_WRAPPER(HLineCommand, toBy);
DEFINE_TYPE_MAPPING(CSS::HLineCommand::To, HLineCommand::To)
DEFINE_TYPE_MAPPING(CSS::HLineCommand::By, HLineCommand::By)
DEFINE_TYPE_MAPPING(CSS::HLineCommand, HLineCommand)

// MARK: - VLine Command

// <vertical-line-command> = vline [ to [ <length-percentage> | top | center | bottom | y-start | y-end ] | by <length-percentage> ]
// https://drafts.csswg.org/css-shapes-2/#typedef-shape-hv-line-command
// Modified by https://github.com/w3c/csswg-drafts/issues/10649#issuecomment-2426552611
struct VLineCommand {
    static constexpr auto name = CSSValueVline;
    struct To {
        static constexpr CommandAffinity affinity = CSS::Keyword::To { };

        TwoComponentPositionVertical offset;

        bool operator==(const To&) const = default;
    };
    struct By {
        static constexpr CommandAffinity affinity = CSS::Keyword::By { };

        LengthPercentage<> offset;

        bool operator==(const By&) const = default;
    };
    std::variant<To, By> toBy;

    bool operator==(const VLineCommand&) const = default;
};
DEFINE_TYPE_WRAPPER(VLineCommand::By, offset);
DEFINE_TYPE_WRAPPER(VLineCommand::To, offset);
DEFINE_TYPE_WRAPPER(VLineCommand, toBy);
DEFINE_TYPE_MAPPING(CSS::VLineCommand::To, VLineCommand::To)
DEFINE_TYPE_MAPPING(CSS::VLineCommand::By, VLineCommand::By)
DEFINE_TYPE_MAPPING(CSS::VLineCommand, VLineCommand)

// MARK: - Curve Command

// <curve-command> = curve [to <position> with <to-control-point> [/ <to-control-point>]?]
//                       | [by <coordinate-pair> with <relative-control-point> [/ <relative-control-point>]?]
// https://drafts.csswg.org/css-shapes-2/#typedef-shape-curve-command
// Modified by https://github.com/w3c/csswg-drafts/issues/10649#issuecomment-2412816773
struct CurveCommand {
    static constexpr auto name = CSSValueCurve;
    struct To {
        static constexpr CommandAffinity affinity = CSS::Keyword::To { };

        Position offset;
        AbsoluteControlPoint controlPoint1;
        std::optional<AbsoluteControlPoint> controlPoint2;

        bool operator==(const To&) const = default;
    };
    struct By {
        static constexpr CommandAffinity affinity = CSS::Keyword::By { };

        CoordinatePair offset;
        RelativeControlPoint controlPoint1;
        std::optional<RelativeControlPoint> controlPoint2;

        bool operator==(const By&) const = default;
    };
    std::variant<To, By> toBy;

    bool operator==(const CurveCommand&) const = default;
};
template<size_t I> const auto& get(const CurveCommand::To& value)
{
    if constexpr (!I)
        return value.offset;
    if constexpr (I == 1)
        return value.controlPoint1;
    if constexpr (I == 2)
        return value.controlPoint2;
}
template<size_t I> const auto& get(const CurveCommand::By& value)
{
    if constexpr (!I)
        return value.offset;
    if constexpr (I == 1)
        return value.controlPoint1;
    if constexpr (I == 2)
        return value.controlPoint2;
}
DEFINE_TYPE_WRAPPER(CurveCommand, toBy);

DEFINE_TYPE_MAPPING(CSS::CurveCommand, CurveCommand)
DEFINE_TYPE_MAPPING(CSS::CurveCommand::To, CurveCommand::To)
DEFINE_TYPE_MAPPING(CSS::CurveCommand::By, CurveCommand::By)

// MARK: - Smooth Command

// <smooth-command> = smooth [to <position> [with <to-control-point>]?]
//                         | [by <coordinate-pair> [with <relative-control-point>]?]
// https://drafts.csswg.org/css-shapes-2/#typedef-shape-smooth-command
// Modified by https://github.com/w3c/csswg-drafts/issues/10649#issuecomment-2412816773
struct SmoothCommand {
    static constexpr auto name = CSSValueSmooth;
    struct To {
        static constexpr CommandAffinity affinity = CSS::Keyword::To { };

        Position offset;
        std::optional<AbsoluteControlPoint> controlPoint;

        bool operator==(const To&) const = default;
    };
    struct By {
        static constexpr CommandAffinity affinity = CSS::Keyword::By { };

        CoordinatePair offset;
        std::optional<RelativeControlPoint> controlPoint;

        bool operator==(const By&) const = default;
    };
    std::variant<To, By> toBy;

    bool operator==(const SmoothCommand&) const = default;
};
template<size_t I> const auto& get(const SmoothCommand::To& value)
{
    if constexpr (!I)
        return value.offset;
    if constexpr (I == 1)
        return value.controlPoint;
}
template<size_t I> const auto& get(const SmoothCommand::By& value)
{
    if constexpr (!I)
        return value.offset;
    if constexpr (I == 1)
        return value.controlPoint;
}
DEFINE_TYPE_WRAPPER(SmoothCommand, toBy);

DEFINE_TYPE_MAPPING(CSS::SmoothCommand, SmoothCommand)
DEFINE_TYPE_MAPPING(CSS::SmoothCommand::To, SmoothCommand::To)
DEFINE_TYPE_MAPPING(CSS::SmoothCommand::By, SmoothCommand::By)

// MARK: - Arc Command

// <arc-command> = arc [to <position>] | [by <coordinate-pair>] of <length-percentage>{1,2} [<arc-sweep>? || <arc-size>? || [rotate <angle>]?]
// https://drafts.csswg.org/css-shapes-2/#typedef-shape-arc-command
// Modified by https://github.com/w3c/csswg-drafts/issues/10649#issuecomment-2412816773
struct ArcCommand {
    static constexpr auto name = CSSValueArc;
    using To = ToPosition;
    using By = ByCoordinatePair;
    std::variant<To, By> toBy;

    using SizeOfEllipse = SpaceSeparatedSize<LengthPercentage<>>;
    SizeOfEllipse size;

    ArcSweep arcSweep;
    ArcSize arcSize;
    Angle<> rotation;

    bool operator==(const ArcCommand&) const = default;
};
template<size_t I> const auto& get(const ArcCommand& value)
{
    if constexpr (!I)
        return value.toBy;
    if constexpr (I == 1)
        return value.size;
    if constexpr (I == 2)
        return value.arcSweep;
    if constexpr (I == 3)
        return value.arcSize;
    if constexpr (I == 4)
        return value.rotation;
}

DEFINE_TYPE_MAPPING(CSS::ArcCommand, ArcCommand)

template<> struct Blending<ArcCommand> {
    auto canBlend(const ArcCommand&, const ArcCommand&) -> bool;
    auto blend(const ArcCommand&, const ArcCommand&, const BlendingContext&) -> ArcCommand;
};

// MARK: - Close Command

// <close> = close
// https://drafts.csswg.org/css-shapes-2/#valdef-shape-close
using CloseCommand = CSS::Keyword::Close;

// MARK: - Shape Command (variant)

// <shape-command> = <move-command> | <line-command> | <hv-line-command> | <curve-command> | <smooth-command> | <arc-command> | close
// https://drafts.csswg.org/css-shapes-2/#typedef-shape-command
using ShapeCommand = std::variant<MoveCommand, LineCommand, HLineCommand, VLineCommand, CurveCommand, SmoothCommand, ArcCommand, CloseCommand>;

// MARK: - <shape()>

// shape() = shape( <'fill-rule'>? from <coordinate-pair>, <shape-command>#)
// https://drafts.csswg.org/css-shapes-2/#shape-function
struct Shape {
    using Commands = CommaSeparatedVector<ShapeCommand>;

    std::optional<FillRule> fillRule;
    // FIXME: The spec says this should be a <coordinate-pair>, but the tests and some comments indicate it has changed to position.
    Position startingPoint;
    Commands commands;

    bool operator==(const Shape&) const = default;
};
using ShapeFunction = FunctionNotation<CSSValueShape, Shape>;

template<size_t I> const auto& get(const Shape& value)
{
    if constexpr (!I)
        return value.fillRule;
    else if constexpr (I == 1)
        return value.startingPoint;
    else if constexpr (I == 2)
        return value.commands;
}

DEFINE_TYPE_MAPPING(CSS::Shape, Shape)

template<> struct PathComputation<Shape> { WebCore::Path operator()(const Shape&, const FloatRect&); };
template<> struct WindRuleComputation<Shape> { WebCore::WindRule operator()(const Shape&); };

template<> struct Blending<Shape> {
    auto canBlend(const Shape&, const Shape&) -> bool;
    auto blend(const Shape&, const Shape&, const BlendingContext&) -> Shape;
};

// Returns whether the shape and path can be interpolated together
// according to the rules in https://drafts.csswg.org/css-shapes-2/#interpolating-shape.
bool canBlendShapeWithPath(const Shape&, const Path&);

// Makes a `Shape` representation of `Path`. Returns `std::nullopt` if the path cannot be parsed.
std::optional<Shape> makeShapeFromPath(const Path&);

} // namespace Style
} // namespace WebCore

STYLE_TUPLE_LIKE_CONFORMANCE(ToPosition, 1)
STYLE_TUPLE_LIKE_CONFORMANCE(ByCoordinatePair, 1)
STYLE_TUPLE_LIKE_CONFORMANCE(RelativeControlPoint, 2)
STYLE_TUPLE_LIKE_CONFORMANCE(AbsoluteControlPoint, 2)
STYLE_TUPLE_LIKE_CONFORMANCE(MoveCommand, 1)
STYLE_TUPLE_LIKE_CONFORMANCE(LineCommand, 1)
STYLE_TUPLE_LIKE_CONFORMANCE(HLineCommand::To, 1)
STYLE_TUPLE_LIKE_CONFORMANCE(HLineCommand::By, 1)
STYLE_TUPLE_LIKE_CONFORMANCE(HLineCommand, 1)
STYLE_TUPLE_LIKE_CONFORMANCE(VLineCommand::To, 1)
STYLE_TUPLE_LIKE_CONFORMANCE(VLineCommand::By, 1)
STYLE_TUPLE_LIKE_CONFORMANCE(VLineCommand, 1)
STYLE_TUPLE_LIKE_CONFORMANCE(CurveCommand::To, 3)
STYLE_TUPLE_LIKE_CONFORMANCE(CurveCommand::By, 3)
STYLE_TUPLE_LIKE_CONFORMANCE(CurveCommand, 1)
STYLE_TUPLE_LIKE_CONFORMANCE(SmoothCommand::To, 2)
STYLE_TUPLE_LIKE_CONFORMANCE(SmoothCommand::By, 2)
STYLE_TUPLE_LIKE_CONFORMANCE(SmoothCommand, 1)
STYLE_TUPLE_LIKE_CONFORMANCE(ArcCommand, 5)
STYLE_TUPLE_LIKE_CONFORMANCE(Shape, 3)
