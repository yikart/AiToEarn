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

#include "PathSegmentData.h"
#include <wtf/Function.h>

namespace WebCore {

class PathSegment {
public:
    using Data = std::variant<
        PathMoveTo,

        PathLineTo,
        PathQuadCurveTo,
        PathBezierCurveTo,
        PathArcTo,

        PathArc,
        PathClosedArc,
        PathEllipse,
        PathEllipseInRect,
        PathRect,
        PathRoundedRect,

        PathDataLine,
        PathDataQuadCurve,
        PathDataBezierCurve,
        PathDataArc,

        PathCloseSubpath
    >;

    WEBCORE_EXPORT PathSegment(Data&&);

    bool operator==(const PathSegment&) const = default;

    const Data& data() const & { return m_data; }
    Data&& data() && { return WTFMove(m_data); }
    bool closesSubpath() const { return std::holds_alternative<PathCloseSubpath>(m_data) || std::holds_alternative<PathClosedArc>(m_data); }

    FloatPoint calculateEndPoint(const FloatPoint& currentPoint, FloatPoint& lastMoveToPoint) const;
    std::optional<FloatPoint> tryGetEndPointWithoutContext() const;
    void extendFastBoundingRect(const FloatPoint& currentPoint, const FloatPoint& lastMoveToPoint, FloatRect& boundingRect) const;
    void extendBoundingRect(const FloatPoint& currentPoint, const FloatPoint& lastMoveToPoint, FloatRect& boundingRect) const;

    bool canApplyElements() const;
    bool applyElements(const PathElementApplier&) const;

    bool canTransform() const;
    bool transform(const AffineTransform&);

private:
    Data m_data;
};

using PathSegmentApplier = Function<void(const PathSegment&)>;

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const PathSegment&);

} // namespace WebCore
