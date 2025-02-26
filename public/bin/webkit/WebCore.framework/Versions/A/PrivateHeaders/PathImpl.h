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

#include "FloatRoundedRect.h"
#include "PathElement.h"
#include "PathSegment.h"
#include <wtf/TZoneMalloc.h>
#include <wtf/ThreadSafeRefCounted.h>
#include <wtf/UniqueRef.h>

namespace WebCore {

class PathImpl : public ThreadSafeRefCounted<PathImpl> {
    WTF_MAKE_TZONE_ALLOCATED(PathImpl);
public:
    virtual ~PathImpl() = default;

    static constexpr float circleControlPoint()
    {
        // Approximation of control point positions on a bezier to simulate a quarter of a circle.
        // This is 1-kappa, where kappa = 4 * (sqrt(2) - 1) / 3
        return 0.447715;
    }

    virtual bool isPathStream() const { return false; }

    virtual bool definitelyEqual(const PathImpl&) const = 0;

    virtual Ref<PathImpl> copy() const = 0;

    void addSegment(PathSegment);
    virtual void add(PathMoveTo) = 0;
    virtual void add(PathLineTo) = 0;
    virtual void add(PathQuadCurveTo) = 0;
    virtual void add(PathBezierCurveTo) = 0;
    virtual void add(PathArcTo) = 0;
    virtual void add(PathArc) = 0;
    virtual void add(PathClosedArc) = 0;
    virtual void add(PathEllipse) = 0;
    virtual void add(PathEllipseInRect) = 0;
    virtual void add(PathRect) = 0;
    virtual void add(PathRoundedRect) = 0;
    virtual void add(PathCloseSubpath) = 0;

    void addLinesForRect(const FloatRect&);
    void addBeziersForRoundedRect(const FloatRoundedRect&);

    virtual void applySegments(const PathSegmentApplier&) const;
    virtual bool applyElements(const PathElementApplier&) const = 0;

    virtual bool transform(const AffineTransform&) = 0;

    virtual std::optional<PathSegment> singleSegment() const { return std::nullopt; }
    virtual std::optional<PathDataLine> singleDataLine() const { return std::nullopt; }
    virtual std::optional<PathRect> singleRect() const { return std::nullopt; }
    virtual std::optional<PathRoundedRect> singleRoundedRect() const { return std::nullopt; }
    virtual std::optional<PathArc> singleArc() const { return std::nullopt; }
    virtual std::optional<PathClosedArc> singleClosedArc() const { return std::nullopt; }
    virtual std::optional<PathDataQuadCurve> singleQuadCurve() const { return std::nullopt; }
    virtual std::optional<PathDataBezierCurve> singleBezierCurve() const { return std::nullopt; }

    virtual bool isEmpty() const = 0;

    virtual bool isClosed() const;

    virtual bool hasSubpaths() const;

    virtual FloatPoint currentPoint() const = 0;

    virtual FloatRect fastBoundingRect() const = 0;
    virtual FloatRect boundingRect() const = 0;

protected:
    PathImpl() = default;
};

inline void PathImpl::addSegment(PathSegment segment)
{
    WTF::switchOn(WTFMove(segment).data(),
        [&](auto&& segment) {
            add(WTFMove(segment));
        },
        [&](PathDataLine segment) {
            add(PathMoveTo { segment.start });
            add(PathLineTo { segment.end });
        },
        [&](PathDataQuadCurve segment) {
            add(PathMoveTo { segment.start });
            add(PathQuadCurveTo { segment.controlPoint, segment.endPoint });
        },
        [&](PathDataBezierCurve segment) {
            add(PathMoveTo { segment.start });
            add(PathBezierCurveTo { segment.controlPoint1, segment.controlPoint2, segment.endPoint });
        },
        [&](PathDataArc segment) {
            add(PathMoveTo { segment.start });
            add(PathArcTo { segment.controlPoint1, segment.controlPoint2, segment.radius });
        });
}

} // namespace WebCore
