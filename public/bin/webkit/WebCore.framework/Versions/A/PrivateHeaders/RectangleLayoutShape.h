/*
 * Copyright (C) 2012 Adobe Systems Incorporated. All rights reserved.
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
#include "FloatSize.h"
#include "LayoutShape.h"
#include <wtf/Assertions.h>

namespace WebCore {

class RectangleLayoutShape final : public LayoutShape {
public:
    RectangleLayoutShape(const FloatRect& bounds, const FloatSize& radii, float boxLogicalWidth)
        : m_bounds(bounds)
        , m_radii(radii)
        , m_boxLogicalWidth(boxLogicalWidth)
    {
    }

    LayoutRect shapeMarginLogicalBoundingBox() const override { return static_cast<LayoutRect>(shapeMarginBounds()); }
    bool isEmpty() const override { return m_bounds.isEmpty(); }
    LineSegment getExcludedInterval(LayoutUnit logicalTop, LayoutUnit logicalHeight) const override;

    void buildDisplayPaths(DisplayPaths&) const override;

private:
    FloatRect shapeMarginBounds() const;

    float rx() const { return m_radii.width(); }
    float ry() const { return m_radii.height(); }
    float x() const { return m_bounds.x(); }
    float y() const { return m_bounds.y(); }
    float width() const { return m_bounds.width(); }
    float height() const { return m_bounds.height(); }

    FloatRect m_bounds;
    FloatSize m_radii;
    float m_boxLogicalWidth { 0.f };
};

} // namespace WebCore
