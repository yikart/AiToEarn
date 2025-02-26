/*
 * Copyright (C) 2013 Adobe Systems Incorporated. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions of source code must retain the above
 *    copyright notice, this list of conditions and the following
 *    disclaimer.
 * 2. Redistributions in binary form must reproduce the above
 *    copyright notice, this list of conditions and the following
 *    disclaimer in the documentation and/or other materials
 *    provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
 * FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 * COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
 * OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "FloatRect.h"
#include "LayoutShape.h"
#include "ShapeInterval.h"
#include <wtf/Assertions.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>

namespace WebCore {

class RasterShapeIntervals {
    WTF_MAKE_TZONE_ALLOCATED(RasterShapeIntervals);
public:
    explicit RasterShapeIntervals(unsigned size, int offset = 0)
        : m_intervals(clampTo<int>(size))
        , m_offset(offset)
    {
    }

    void initializeBounds();
    const IntRect& bounds() const { return m_bounds; }
    bool isEmpty() const { return m_bounds.isEmpty(); }

    IntShapeInterval& intervalAt(int y)
    {
        ASSERT(y + m_offset >= 0 && static_cast<unsigned>(y + m_offset) < m_intervals.size());
        return m_intervals[y + m_offset];
    }

    const IntShapeInterval& intervalAt(int y) const
    {
        ASSERT(y + m_offset >= 0 && static_cast<unsigned>(y + m_offset) < m_intervals.size());
        return m_intervals[y + m_offset];
    }

    std::unique_ptr<RasterShapeIntervals> computeShapeMarginIntervals(int shapeMargin) const;
    void buildBoundsPath(Path&) const;

private:
    int size() const { return m_intervals.size(); }
    int offset() const { return m_offset; }
    int minY() const { return -m_offset; }
    int maxY() const { return -m_offset + m_intervals.size(); }

    IntRect m_bounds;
    Vector<IntShapeInterval> m_intervals;
    int m_offset;
};

class RasterLayoutShape final : public LayoutShape {
    WTF_MAKE_NONCOPYABLE(RasterLayoutShape);
public:
    RasterLayoutShape(std::unique_ptr<RasterShapeIntervals> intervals, const IntSize& marginRectSize)
        : m_intervals(WTFMove(intervals))
        , m_marginRectSize(marginRectSize)
    {
        m_intervals->initializeBounds();
    }

    LayoutRect shapeMarginLogicalBoundingBox() const override { return static_cast<LayoutRect>(marginIntervals().bounds()); }
    bool isEmpty() const override { return m_intervals->isEmpty(); }
    LineSegment getExcludedInterval(LayoutUnit logicalTop, LayoutUnit logicalHeight) const override;

    void buildDisplayPaths(DisplayPaths& paths) const override
    {
        m_intervals->buildBoundsPath(paths.shape);
        if (shapeMargin())
            marginIntervals().buildBoundsPath(paths.marginShape);
    }

private:
    const RasterShapeIntervals& marginIntervals() const;

    std::unique_ptr<RasterShapeIntervals> m_intervals;
    mutable std::unique_ptr<RasterShapeIntervals> m_marginIntervals;
    IntSize m_marginRectSize;
};

} // namespace WebCore
