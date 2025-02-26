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
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER “AS IS” AND ANY
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

#include "LayoutShape.h"
#include "LayoutSize.h"
#include <wtf/HashMap.h>
#include <wtf/NeverDestroyed.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class RenderBlockFlow;
class RenderBox;
class StyleImage;
class FloatingObject;

Ref<const LayoutShape> makeShapeForShapeOutside(const RenderBox&);

class ShapeOutsideDeltas final {
    WTF_MAKE_TZONE_ALLOCATED(ShapeOutsideDeltas);
public:
    ShapeOutsideDeltas()
        : m_lineOverlapsShape(false)
        , m_isValid(false)
    {
    }

    ShapeOutsideDeltas(LayoutUnit leftMarginBoxDelta, LayoutUnit rightMarginBoxDelta, bool lineOverlapsShape, LayoutUnit borderBoxLineTop, LayoutUnit lineHeight)
        : m_leftMarginBoxDelta(leftMarginBoxDelta)
        , m_rightMarginBoxDelta(rightMarginBoxDelta)
        , m_borderBoxLineTop(borderBoxLineTop)
        , m_lineHeight(lineHeight)
        , m_lineOverlapsShape(lineOverlapsShape)
        , m_isValid(true)
    {
    }

    bool isForLine(LayoutUnit borderBoxLineTop, LayoutUnit lineHeight)
    {
        return m_isValid && m_borderBoxLineTop == borderBoxLineTop && m_lineHeight == lineHeight;
    }

    bool isValid() { return m_isValid; }
    LayoutUnit leftMarginBoxDelta() { ASSERT(m_isValid); return m_leftMarginBoxDelta; }
    LayoutUnit rightMarginBoxDelta() { ASSERT(m_isValid); return m_rightMarginBoxDelta; }
    bool lineOverlapsShape() { ASSERT(m_isValid); return m_lineOverlapsShape; }

private:
    LayoutUnit m_leftMarginBoxDelta;
    LayoutUnit m_rightMarginBoxDelta;
    LayoutUnit m_borderBoxLineTop;
    LayoutUnit m_lineHeight;
    unsigned m_lineOverlapsShape : 1;
    unsigned m_isValid : 1;
};

class ShapeOutsideInfo final {
    WTF_MAKE_TZONE_ALLOCATED(ShapeOutsideInfo);
public:
    ShapeOutsideInfo(const RenderBox& renderer)
        : m_renderer(renderer)
    {
    }

    static bool isEnabledFor(const RenderBox&);

    ShapeOutsideDeltas computeDeltasForContainingBlockLine(const RenderBlockFlow&, const FloatingObject&, LayoutUnit lineTop, LayoutUnit lineHeight);

    void invalidateForSizeChangeIfNeeded();

    LayoutUnit shapeLogicalBottom() const { return computedShape().shapeMarginLogicalBoundingBox().maxY(); }

    void markShapeAsDirty() { m_shape = nullptr; }
    bool isShapeDirty() { return !m_shape; }

    LayoutRect computedShapePhysicalBoundingBox() const;
    FloatPoint shapeToRendererPoint(const FloatPoint&) const;

    const LayoutShape& computedShape() const;

private:
    LayoutUnit logicalTopOffset() const;
    LayoutUnit logicalLeftOffset() const;

    const RenderBox& m_renderer;

    mutable RefPtr<const LayoutShape> m_shape;
    LayoutSize m_cachedShapeLogicalSize;

    ShapeOutsideDeltas m_shapeOutsideDeltas;
};

}
