/*
 * Copyright (C) 2003-2023 Apple Inc. All rights reserved.
 * Copyright (C) 2006 Rob Buis <buis@kde.org>
 * Copyright (C) 2007-2008 Torch Mobile, Inc.
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

#include "PathElement.h"
#include "PathImpl.h"
#include "PathSegment.h"
#include "PlatformPath.h"
#include "WindRule.h"
#include <wtf/DataRef.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class GraphicsContext;
class PathTraversalState;
class RoundedRect;

class Path {
    WTF_MAKE_TZONE_ALLOCATED(Path);
public:
    Path() = default;
    WEBCORE_EXPORT Path(PathSegment&&);
    WEBCORE_EXPORT Path(Vector<PathSegment>&&);
    explicit Path(const Vector<FloatPoint>& points);
    Path(Ref<PathImpl>&&);

    WEBCORE_EXPORT Path(const Path&);
    Path(Path&&) = default;
    Path& operator=(const Path&) = default;
    Path& operator=(Path&&) = default;

    WEBCORE_EXPORT bool definitelyEqual(const Path&) const;

    WEBCORE_EXPORT void moveTo(const FloatPoint&);

    WEBCORE_EXPORT void addLineTo(const FloatPoint&);
    WEBCORE_EXPORT void addQuadCurveTo(const FloatPoint& controlPoint, const FloatPoint& endPoint);
    WEBCORE_EXPORT void addBezierCurveTo(const FloatPoint& controlPoint1, const FloatPoint& controlPoint2, const FloatPoint& endPoint);
    void addArcTo(const FloatPoint& point1, const FloatPoint& point2, float radius);

    void addArc(const FloatPoint&, float radius, float startAngle, float endAngle, RotationDirection);
    void addEllipse(const FloatPoint&, float radiusX, float radiusY, float rotation, float startAngle, float endAngle, RotationDirection);
    void addEllipseInRect(const FloatRect&);
    WEBCORE_EXPORT void addRect(const FloatRect&);
    WEBCORE_EXPORT void addRoundedRect(const FloatRoundedRect&, PathRoundedRect::Strategy = PathRoundedRect::Strategy::PreferNative);
    void addRoundedRect(const FloatRect&, const FloatSize& roundingRadii, PathRoundedRect::Strategy = PathRoundedRect::Strategy::PreferNative);
    void addRoundedRect(const RoundedRect&);

    WEBCORE_EXPORT void closeSubpath();

    void addPath(const Path&, const AffineTransform&);

    void applySegments(const PathSegmentApplier&) const;
    WEBCORE_EXPORT void applyElements(const PathElementApplier&) const;
    void clear();

    void translate(const FloatSize& delta);
    void transform(const AffineTransform&);

    static constexpr float circleControlPoint() { return PathImpl::circleControlPoint(); }

    WEBCORE_EXPORT std::optional<PathSegment> singleSegment() const;
    std::optional<PathDataLine> singleDataLine() const;
    std::optional<PathRect> singleRect() const;
    std::optional<PathRoundedRect> singleRoundedRect() const;
    std::optional<PathArc> singleArc() const;
    std::optional<PathClosedArc> singleClosedArc() const;
    std::optional<PathDataQuadCurve> singleQuadCurve() const;
    std::optional<PathDataBezierCurve> singleBezierCurve() const;

    WEBCORE_EXPORT bool isEmpty() const;
    bool definitelySingleLine() const;
    WEBCORE_EXPORT PlatformPathPtr platformPath() const;

    const PathSegment* singleSegmentIfExists() const { return asSingle(); }
    WEBCORE_EXPORT const Vector<PathSegment>* segmentsIfExists() const;
    WEBCORE_EXPORT Vector<PathSegment> segments() const;

    float length() const;
    bool isClosed() const;
    bool hasSubpaths() const;
    FloatPoint currentPoint() const;
    PathTraversalState traversalStateAtLength(float length) const;
    FloatPoint pointAtLength(float length) const;

    bool contains(const FloatPoint&, WindRule = WindRule::NonZero) const;
    bool strokeContains(const FloatPoint&, const Function<void(GraphicsContext&)>& strokeStyleApplier) const;

    WEBCORE_EXPORT FloatRect fastBoundingRect() const;
    WEBCORE_EXPORT FloatRect boundingRect() const;
    FloatRect strokeBoundingRect(const Function<void(GraphicsContext&)>& strokeStyleApplier = { }) const;

    WEBCORE_EXPORT void ensureImplForTesting();

private:
    PlatformPathImpl& ensurePlatformPathImpl();
    PathImpl& setImpl(Ref<PathImpl>&&);
    PathImpl& ensureImpl();

    PathSegment* asSingle() { return std::get_if<PathSegment>(&m_data); }
    const PathSegment* asSingle() const { return std::get_if<PathSegment>(&m_data); }

    PathImpl* asImpl();
    const PathImpl* asImpl() const;

    const PathMoveTo* asSingleMoveTo() const;
    const PathArc* asSingleArc() const;

    std::variant<std::monostate, PathSegment, DataRef<PathImpl>> m_data;
};

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const Path&);

} // namespace WebCore
