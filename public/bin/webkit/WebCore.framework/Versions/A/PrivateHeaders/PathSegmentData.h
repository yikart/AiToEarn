/*
 * Copyright (C) 2023 Apple Inc.  All rights reserved.
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

#include "FloatRect.h"
#include "FloatRoundedRect.h"
#include "PathElement.h"
#include "RotationDirection.h"

namespace WTF {
class TextStream;
}

namespace WebCore {

struct PathMoveTo {
    FloatPoint point;

    static constexpr bool canApplyElements = true;
    static constexpr bool canTransform = true;

    bool operator==(const PathMoveTo&) const = default;

    FloatPoint calculateEndPoint(const FloatPoint& currentPoint, FloatPoint& lastMoveToPoint) const;
    std::optional<FloatPoint> tryGetEndPointWithoutContext() const;

    void extendFastBoundingRect(const FloatPoint& currentPoint, const FloatPoint& lastMoveToPoint, FloatRect& boundingRect) const;
    void extendBoundingRect(const FloatPoint& currentPoint, const FloatPoint& lastMoveToPoint, FloatRect& boundingRect) const;

    void applyElements(const PathElementApplier&) const;

    void transform(const AffineTransform&);
};

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const PathMoveTo&);

struct PathLineTo {
    FloatPoint point;

    static constexpr bool canApplyElements = true;
    static constexpr bool canTransform = true;

    bool operator==(const PathLineTo&) const = default;

    FloatPoint calculateEndPoint(const FloatPoint& currentPoint, FloatPoint& lastMoveToPoint) const;
    std::optional<FloatPoint> tryGetEndPointWithoutContext() const;

    void extendFastBoundingRect(const FloatPoint& currentPoint, const FloatPoint& lastMoveToPoint, FloatRect& boundingRect) const;
    void extendBoundingRect(const FloatPoint& currentPoint, const FloatPoint& lastMoveToPoint, FloatRect& boundingRect) const;

    void applyElements(const PathElementApplier&) const;

    void transform(const AffineTransform&);
};

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const PathLineTo&);

struct PathQuadCurveTo {
    FloatPoint controlPoint;
    FloatPoint endPoint;

    static constexpr bool canApplyElements = true;
    static constexpr bool canTransform = true;

    bool operator==(const PathQuadCurveTo&) const = default;

    FloatPoint calculateEndPoint(const FloatPoint& currentPoint, FloatPoint& lastMoveToPoint) const;
    std::optional<FloatPoint> tryGetEndPointWithoutContext() const;

    void extendFastBoundingRect(const FloatPoint& currentPoint, const FloatPoint& lastMoveToPoint, FloatRect& boundingRect) const;
    void extendBoundingRect(const FloatPoint& currentPoint, const FloatPoint& lastMoveToPoint, FloatRect& boundingRect) const;

    void applyElements(const PathElementApplier&) const;

    void transform(const AffineTransform&);
};

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const PathQuadCurveTo&);

struct PathBezierCurveTo {
    FloatPoint controlPoint1;
    FloatPoint controlPoint2;
    FloatPoint endPoint;

    static constexpr bool canApplyElements = true;
    static constexpr bool canTransform = true;

    bool operator==(const PathBezierCurveTo&) const = default;

    FloatPoint calculateEndPoint(const FloatPoint& currentPoint, FloatPoint& lastMoveToPoint) const;
    std::optional<FloatPoint> tryGetEndPointWithoutContext() const;

    void extendFastBoundingRect(const FloatPoint& currentPoint, const FloatPoint& lastMoveToPoint, FloatRect& boundingRect) const;
    void extendBoundingRect(const FloatPoint& currentPoint, const FloatPoint& lastMoveToPoint, FloatRect& boundingRect) const;

    void applyElements(const PathElementApplier&) const;

    void transform(const AffineTransform&);
};

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const PathBezierCurveTo&);

struct PathArcTo {
    FloatPoint controlPoint1;
    FloatPoint controlPoint2;
    float radius;

    static constexpr bool canApplyElements = false;
    static constexpr bool canTransform = false;

    bool operator==(const PathArcTo&) const = default;

    FloatPoint calculateEndPoint(const FloatPoint& currentPoint, FloatPoint& lastMoveToPoint) const;
    std::optional<FloatPoint> tryGetEndPointWithoutContext() const;

    void extendFastBoundingRect(const FloatPoint& currentPoint, const FloatPoint& lastMoveToPoint, FloatRect& boundingRect) const;
    void extendBoundingRect(const FloatPoint& currentPoint, const FloatPoint& lastMoveToPoint, FloatRect& boundingRect) const;

};

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const PathArcTo&);

struct PathArc {
    FloatPoint center;
    float radius;
    float startAngle;
    float endAngle;
    RotationDirection direction;

    static constexpr bool canApplyElements = false;
    static constexpr bool canTransform = false;

    bool operator==(const PathArc&) const = default;

    FloatPoint calculateEndPoint(const FloatPoint& currentPoint, FloatPoint& lastMoveToPoint) const;
    std::optional<FloatPoint> tryGetEndPointWithoutContext() const;

    void extendFastBoundingRect(const FloatPoint& currentPoint, const FloatPoint& lastMoveToPoint, FloatRect& boundingRect) const;
    void extendBoundingRect(const FloatPoint& currentPoint, const FloatPoint& lastMoveToPoint, FloatRect& boundingRect) const;

};

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const PathArc&);

struct PathClosedArc {
    PathArc arc;

    static constexpr bool canApplyElements = false;
    static constexpr bool canTransform = false;

    bool operator==(const PathClosedArc&) const = default;

    FloatPoint calculateEndPoint(const FloatPoint& currentPoint, FloatPoint& lastMoveToPoint) const;
    std::optional<FloatPoint> tryGetEndPointWithoutContext() const;

    void extendFastBoundingRect(const FloatPoint& currentPoint, const FloatPoint& lastMoveToPoint, FloatRect& boundingRect) const;
    void extendBoundingRect(const FloatPoint& currentPoint, const FloatPoint& lastMoveToPoint, FloatRect& boundingRect) const;

};

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const PathClosedArc&);

struct PathEllipse {
    FloatPoint center;
    float radiusX;
    float radiusY;
    float rotation;
    float startAngle;
    float endAngle;
    RotationDirection direction;

    static constexpr bool canApplyElements = false;
    static constexpr bool canTransform = false;

    bool operator==(const PathEllipse&) const = default;

    FloatPoint calculateEndPoint(const FloatPoint& currentPoint, FloatPoint& lastMoveToPoint) const;
    std::optional<FloatPoint> tryGetEndPointWithoutContext() const;

    void extendFastBoundingRect(const FloatPoint& currentPoint, const FloatPoint& lastMoveToPoint, FloatRect& boundingRect) const;
    void extendBoundingRect(const FloatPoint& currentPoint, const FloatPoint& lastMoveToPoint, FloatRect& boundingRect) const;

};

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const PathEllipse&);

struct PathEllipseInRect {
    FloatRect rect;

    static constexpr bool canApplyElements = false;
    static constexpr bool canTransform = false;

    bool operator==(const PathEllipseInRect&) const = default;

    FloatPoint calculateEndPoint(const FloatPoint& currentPoint, FloatPoint& lastMoveToPoint) const;
    std::optional<FloatPoint> tryGetEndPointWithoutContext() const;

    void extendFastBoundingRect(const FloatPoint& currentPoint, const FloatPoint& lastMoveToPoint, FloatRect& boundingRect) const;
    void extendBoundingRect(const FloatPoint& currentPoint, const FloatPoint& lastMoveToPoint, FloatRect& boundingRect) const;

};

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const PathEllipseInRect&);

struct PathRect {
    FloatRect rect;

    static constexpr bool canApplyElements = false;
    static constexpr bool canTransform = false;

    bool operator==(const PathRect&) const = default;

    FloatPoint calculateEndPoint(const FloatPoint& currentPoint, FloatPoint& lastMoveToPoint) const;
    std::optional<FloatPoint> tryGetEndPointWithoutContext() const;

    void extendFastBoundingRect(const FloatPoint& currentPoint, const FloatPoint& lastMoveToPoint, FloatRect& boundingRect) const;
    void extendBoundingRect(const FloatPoint& currentPoint, const FloatPoint& lastMoveToPoint, FloatRect& boundingRect) const;

};

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const PathRect&);

struct PathRoundedRect {
    enum class Strategy : uint8_t {
        PreferNative,
        PreferBezier
    };

    FloatRoundedRect roundedRect;
    Strategy strategy;

    static constexpr bool canApplyElements = false;
    static constexpr bool canTransform = false;

    bool operator==(const PathRoundedRect&) const = default;

    FloatPoint calculateEndPoint(const FloatPoint& currentPoint, FloatPoint& lastMoveToPoint) const;
    std::optional<FloatPoint> tryGetEndPointWithoutContext() const;

    void extendFastBoundingRect(const FloatPoint& currentPoint, const FloatPoint& lastMoveToPoint, FloatRect& boundingRect) const;
    void extendBoundingRect(const FloatPoint& currentPoint, const FloatPoint& lastMoveToPoint, FloatRect& boundingRect) const;

};

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const PathRoundedRect&);

struct PathDataLine {
    FloatPoint start;
    FloatPoint end;

    static constexpr bool canApplyElements = true;
    static constexpr bool canTransform = true;

    bool operator==(const PathDataLine&) const = default;

    FloatPoint calculateEndPoint(const FloatPoint& currentPoint, FloatPoint& lastMoveToPoint) const;
    std::optional<FloatPoint> tryGetEndPointWithoutContext() const;

    void extendFastBoundingRect(const FloatPoint& currentPoint, const FloatPoint& lastMoveToPoint, FloatRect& boundingRect) const;
    void extendBoundingRect(const FloatPoint& currentPoint, const FloatPoint& lastMoveToPoint, FloatRect& boundingRect) const;

    void applyElements(const PathElementApplier&) const;

    void transform(const AffineTransform&);
};

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const PathDataLine&);

struct PathDataQuadCurve {
    FloatPoint start;
    FloatPoint controlPoint;
    FloatPoint endPoint;

    static constexpr bool canApplyElements = true;
    static constexpr bool canTransform = true;

    bool operator==(const PathDataQuadCurve&) const = default;

    FloatPoint calculateEndPoint(const FloatPoint& currentPoint, FloatPoint& lastMoveToPoint) const;
    std::optional<FloatPoint> tryGetEndPointWithoutContext() const;

    void extendFastBoundingRect(const FloatPoint& currentPoint, const FloatPoint& lastMoveToPoint, FloatRect& boundingRect) const;
    void extendBoundingRect(const FloatPoint& currentPoint, const FloatPoint& lastMoveToPoint, FloatRect& boundingRect) const;

    void applyElements(const PathElementApplier&) const;

    void transform(const AffineTransform&);
};

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const PathDataQuadCurve&);

struct PathDataBezierCurve {
    FloatPoint start;
    FloatPoint controlPoint1;
    FloatPoint controlPoint2;
    FloatPoint endPoint;

    static constexpr bool canApplyElements = true;
    static constexpr bool canTransform = true;

    bool operator==(const PathDataBezierCurve&) const = default;

    FloatPoint calculateEndPoint(const FloatPoint& currentPoint, FloatPoint& lastMoveToPoint) const;
    std::optional<FloatPoint> tryGetEndPointWithoutContext() const;

    void extendFastBoundingRect(const FloatPoint& currentPoint, const FloatPoint& lastMoveToPoint, FloatRect& boundingRect) const;
    void extendBoundingRect(const FloatPoint& currentPoint, const FloatPoint& lastMoveToPoint, FloatRect& boundingRect) const;

    void applyElements(const PathElementApplier&) const;

    void transform(const AffineTransform&);
};

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const PathDataBezierCurve&);

struct PathDataArc {
    FloatPoint start;
    FloatPoint controlPoint1;
    FloatPoint controlPoint2;
    float radius;

    static constexpr bool canApplyElements = false;
    static constexpr bool canTransform = false;

    bool operator==(const PathDataArc&) const = default;

    FloatPoint calculateEndPoint(const FloatPoint& currentPoint, FloatPoint& lastMoveToPoint) const;
    std::optional<FloatPoint> tryGetEndPointWithoutContext() const;

    void extendFastBoundingRect(const FloatPoint& currentPoint, const FloatPoint& lastMoveToPoint, FloatRect& boundingRect) const;
    void extendBoundingRect(const FloatPoint& currentPoint, const FloatPoint& lastMoveToPoint, FloatRect& boundingRect) const;

};

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const PathDataArc&);

struct PathCloseSubpath {
    static constexpr bool canApplyElements = true;
    static constexpr bool canTransform = true;

    bool operator==(const PathCloseSubpath&) const = default;

    FloatPoint calculateEndPoint(const FloatPoint& currentPoint, FloatPoint& lastMoveToPoint) const;
    std::optional<FloatPoint> tryGetEndPointWithoutContext() const;

    void extendFastBoundingRect(const FloatPoint& currentPoint, const FloatPoint& lastMoveToPoint, FloatRect& boundingRect) const;
    void extendBoundingRect(const FloatPoint& currentPoint, const FloatPoint& lastMoveToPoint, FloatRect& boundingRect) const;

    void applyElements(const PathElementApplier&) const;

    void transform(const AffineTransform&);
};

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const PathCloseSubpath&);

} // namespace WebCore
