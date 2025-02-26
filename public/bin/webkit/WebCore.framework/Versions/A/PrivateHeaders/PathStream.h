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

#include "PathImpl.h"
#include "PathSegment.h"
#include <wtf/DataRef.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/ThreadSafeRefCounted.h>
#include <wtf/Vector.h>

namespace WebCore {

class PathStream final : public PathImpl {
    WTF_MAKE_TZONE_ALLOCATED(PathStream);
public:
    static Ref<PathStream> create();
    static Ref<PathStream> create(PathSegment&&);
    static Ref<PathStream> create(const Vector<FloatPoint>&);
    static Ref<PathStream> create(Vector<PathSegment>&&);

    bool definitelyEqual(const PathImpl&) const final;
    Ref<PathImpl> copy() const final;

    void add(PathMoveTo) final;
    void add(PathLineTo) final;
    void add(PathQuadCurveTo) final;
    void add(PathBezierCurveTo) final;
    void add(PathArcTo) final;
    void add(PathArc) final;
    void add(PathClosedArc) final;
    void add(PathEllipse) final;
    void add(PathEllipseInRect) final;
    void add(PathRect) final;
    void add(PathRoundedRect) final;
    void add(PathCloseSubpath) final;

    const Vector<PathSegment>& segments() const { return m_segments; }

    void applySegments(const PathSegmentApplier&) const final;
    bool applyElements(const PathElementApplier&) const final;

    bool transform(const AffineTransform&) final;

    FloatRect fastBoundingRect() const final;
    FloatRect boundingRect() const final;

    bool hasSubpaths() const final;

    static FloatRect computeFastBoundingRect(std::span<const PathSegment>);
    static FloatRect computeBoundingRect(std::span<const PathSegment>);
    static bool computeHasSubpaths(std::span<const PathSegment>);

private:
    PathStream() = default;
    PathStream(PathSegment&&);
    PathStream(Vector<PathSegment>&&);
    PathStream(const Vector<PathSegment>&);

    static Ref<PathStream> create(const Vector<PathSegment>&);

    const PathMoveTo* lastIfMoveTo() const;

    bool isPathStream() const final { return true; }

    template<typename DataType>
    std::optional<DataType> singleDataType() const;

    std::optional<PathSegment> singleSegment() const final;
    std::optional<PathDataLine> singleDataLine() const final;
    std::optional<PathRect> singleRect() const final;
    std::optional<PathRoundedRect> singleRoundedRect() const final;
    std::optional<PathArc> singleArc() const final;
    std::optional<PathClosedArc> singleClosedArc() const final;
    std::optional<PathDataQuadCurve> singleQuadCurve() const final;
    std::optional<PathDataBezierCurve> singleBezierCurve() const final;

    bool isEmpty() const final { return m_segments.isEmpty(); }

    bool isClosed() const final;
    FloatPoint currentPoint() const final;

    Vector<PathSegment>& segments() { return m_segments; }

    Vector<PathSegment> m_segments;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::PathStream)
    static bool isType(const WebCore::PathImpl& pathImpl) { return pathImpl.isPathStream(); }
SPECIALIZE_TYPE_TRAITS_END()
