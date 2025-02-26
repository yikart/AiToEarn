/*
 * Copyright (C) 2000 Lars Knoll (knoll@kde.org)
 * Copyright (C) 2013 Apple Inc. All rights reserved.
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Library General Public License
 * along with this library; see the file COPYING.LIB.  If not, write to
 * the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 * Boston, MA 02110-1301, USA.
 *
 */

#pragma once

#include "RenderBoxModelObject.h"

namespace WebCore {

class HTMLElement;
class Position;

class RenderLineBreak final : public RenderBoxModelObject {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(RenderLineBreak);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(RenderLineBreak);
public:
    RenderLineBreak(HTMLElement&, RenderStyle&&);
    virtual ~RenderLineBreak();

    // FIXME: The lies here keep render tree dump based test results unchanged.
    ASCIILiteral renderName() const final { return isWBR() ? "RenderWordBreak"_s : "RenderBR"_s; }

    IntRect linesBoundingBox() const;

    void boundingRects(Vector<LayoutRect>&, const LayoutPoint& accumulatedOffset) const final;
    void absoluteQuads(Vector<FloatQuad>&, bool* wasFixed = nullptr) const final;
#if PLATFORM(IOS_FAMILY)
    void collectSelectionGeometries(Vector<SelectionGeometry>&, unsigned startOffset = 0, unsigned endOffset = std::numeric_limits<unsigned>::max()) final;
#endif

    bool isBR() const { return !hasWBRLineBreakFlag(); }
    bool isWBR() const { return hasWBRLineBreakFlag(); }
    bool isLineBreakOpportunity() const { return isWBR(); }

private:
    void node() const = delete;

    bool canHaveChildren() const final { return false; }
    void paint(PaintInfo&, const LayoutPoint&) final { }

    VisiblePosition positionForPoint(const LayoutPoint&, HitTestSource, const RenderFragmentContainer*) final;
    int caretMinOffset() const final;
    int caretMaxOffset() const final;
    bool canBeSelectionLeaf() const final;

    LayoutUnit lineHeight(bool firstLine, LineDirectionMode, LinePositionMode) const final;
    LayoutUnit baselinePosition(FontBaseline, bool firstLine, LineDirectionMode, LinePositionMode) const final;

    LayoutUnit marginTop() const final { return 0; }
    LayoutUnit marginBottom() const final { return 0; }
    LayoutUnit marginLeft() const final { return 0; }
    LayoutUnit marginRight() const final { return 0; }
    LayoutUnit marginBefore(const WritingMode) const final { return 0; }
    LayoutUnit marginAfter(const WritingMode) const final { return 0; }
    LayoutUnit marginStart(const WritingMode) const final { return 0; }
    LayoutUnit marginEnd(const WritingMode) const final { return 0; }
    LayoutUnit offsetWidth() const final { return linesBoundingBox().width(); }
    LayoutUnit offsetHeight() const final { return linesBoundingBox().height(); }
    LayoutRect borderBoundingBox() const final { return LayoutRect(LayoutPoint(), linesBoundingBox().size()); }
    LayoutRect frameRectForStickyPositioning() const final { ASSERT_NOT_REACHED(); return { }; }
    RepaintRects localRectsForRepaint(RepaintOutlineBounds) const final { return { }; }

    void updateFromStyle() final;
    bool requiresLayer() const final { return false; }

    mutable std::optional<LayoutUnit> m_cachedLineHeight { };
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_RENDER_OBJECT(RenderLineBreak, isRenderLineBreak())
