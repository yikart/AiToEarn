/*
 * Copyright (C) 1999 Lars Knoll (knoll@kde.org)
 *           (C) 1999 Antti Koivisto (koivisto@kde.org)
 * Copyright (C) 2003, 2004, 2005, 2006, 2007, 2008, 2009 Apple Inc. All rights reserved.
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
#include "RenderLineBoxList.h"

namespace WebCore {

class Position;
class RenderFragmentContainer;

class RenderInline : public RenderBoxModelObject {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(RenderInline);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(RenderInline);
public:
    RenderInline(Type, Element&, RenderStyle&&);
    RenderInline(Type, Document&, RenderStyle&&);
    virtual ~RenderInline();

    LayoutUnit marginLeft() const final;
    LayoutUnit marginRight() const final;
    LayoutUnit marginTop() const final;
    LayoutUnit marginBottom() const final;
    LayoutUnit marginBefore(const WritingMode) const final;
    LayoutUnit marginAfter(const WritingMode) const final;
    LayoutUnit marginStart(const WritingMode) const final;
    LayoutUnit marginEnd(const WritingMode) const final;
    LayoutUnit marginBefore() const { return marginBefore(writingMode()); }
    LayoutUnit marginAfter() const { return marginAfter(writingMode()); }
    LayoutUnit marginStart() const { return marginStart(writingMode()); }
    LayoutUnit marginEnd() const { return marginEnd(writingMode()); }

    void boundingRects(Vector<LayoutRect>&, const LayoutPoint& accumulatedOffset) const final;
    void absoluteQuads(Vector<FloatQuad>&, bool* wasFixed) const override;

    LayoutSize offsetFromContainer(RenderElement&, const LayoutPoint&, bool* offsetDependsOnPoint = nullptr) const final;

    LayoutRect borderBoundingBox() const final
    {
        return LayoutRect(LayoutPoint(), linesBoundingBox().size());
    }

    LayoutUnit innerPaddingBoxWidth() const;
    LayoutUnit innerPaddingBoxHeight() const;

    WEBCORE_EXPORT IntRect linesBoundingBox() const;
    LayoutRect linesVisualOverflowBoundingBox() const;

    LegacyInlineFlowBox* createAndAppendInlineFlowBox();

    RenderLineBoxList& legacyLineBoxes() { return m_legacyLineBoxes; }
    const RenderLineBoxList& legacyLineBoxes() const { return m_legacyLineBoxes; }
    void dirtyLegacyLineBoxes(bool fullLayout);
    void deleteLegacyLines();
    LegacyInlineFlowBox* firstLegacyInlineBox() const { return m_legacyLineBoxes.firstLegacyLineBox(); }
    LegacyInlineFlowBox* lastLegacyInlineBox() const { return m_legacyLineBoxes.lastLegacyLineBox(); }

#if PLATFORM(IOS_FAMILY)
    void absoluteQuadsForSelection(Vector<FloatQuad>& quads) const override;
#endif
    
    LayoutSize offsetForInFlowPositionedInline(const RenderBox* child) const;

    void addFocusRingRects(Vector<LayoutRect>&, const LayoutPoint& additionalOffset, const RenderLayerModelObject* paintContainer = 0) const final;
    void paintOutline(PaintInfo&, const LayoutPoint&) const;

    bool mayAffectLayout() const;

    bool requiresLayer() const override;

    LayoutPoint firstInlineBoxTopLeft() const;

protected:
    void willBeDestroyed() override;

    void styleWillChange(StyleDifference, const RenderStyle& newStyle) override;
    void styleDidChange(StyleDifference, const RenderStyle* oldStyle) override;

    void updateFromStyle() override;

private:
    ASCIILiteral renderName() const override;

    bool canHaveChildren() const final { return true; }

    void absoluteQuadsIgnoringContinuation(const FloatRect&, Vector<FloatQuad>&, bool* wasFixed) const override;

    template<typename GeneratorContext>
    void generateLineBoxRects(GeneratorContext& yield) const;

    void layout() final { ASSERT_NOT_REACHED(); } // Do nothing for layout()

    void paint(PaintInfo&, const LayoutPoint&) final;

    bool nodeAtPoint(const HitTestRequest&, HitTestResult&, const HitTestLocation& locationInContainer, const LayoutPoint& accumulatedOffset, HitTestAction) final;

    LayoutUnit offsetLeft() const final;
    LayoutUnit offsetTop() const final;
    LayoutUnit offsetWidth() const final { return linesBoundingBox().width(); }
    LayoutUnit offsetHeight() const final { return linesBoundingBox().height(); }

protected:
    LayoutRect clippedOverflowRect(const RenderLayerModelObject* repaintContainer, VisibleRectContext) const override;
    RepaintRects rectsForRepaintingAfterLayout(const RenderLayerModelObject* repaintContainer, RepaintOutlineBounds) const override;
    LayoutRect rectWithOutlineForRepaint(const RenderLayerModelObject* repaintContainer, LayoutUnit outlineWidth) const final;

    std::optional<RepaintRects> computeVisibleRectsInContainer(const RepaintRects&, const RenderLayerModelObject* container, VisibleRectContext) const final;
    RepaintRects computeVisibleRectsUsingPaintOffset(const RepaintRects&) const;

    void mapLocalToContainer(const RenderLayerModelObject* repaintContainer, TransformState&, OptionSet<MapCoordinatesMode>, bool* wasFixed) const override;
    const RenderObject* pushMappingToContainer(const RenderLayerModelObject* ancestorToStopAt, RenderGeometryMap&) const override;

private:
    VisiblePosition positionForPoint(const LayoutPoint&, HitTestSource, const RenderFragmentContainer*) final;

    LayoutRect frameRectForStickyPositioning() const final { return linesBoundingBox(); }

    virtual std::unique_ptr<LegacyInlineFlowBox> createInlineFlowBox(); // Subclassed by RenderSVGInline

    void dirtyLineFromChangedChild() final { m_legacyLineBoxes.dirtyLineFromChangedChild(*this); }

    LayoutUnit lineHeight(bool firstLine, LineDirectionMode, LinePositionMode = PositionOnContainingLine) const final;
    LayoutUnit baselinePosition(FontBaseline, bool firstLine, LineDirectionMode, LinePositionMode = PositionOnContainingLine) const final;
    
    void updateHitTestResult(HitTestResult&, const LayoutPoint&) const final;

    void imageChanged(WrappedImagePtr, const IntRect* = 0) final;

    inline bool willChangeCreatesStackingContext() const;

    // All of the line boxes created for this svg inline.
    RenderLineBoxList m_legacyLineBoxes;
};

bool isEmptyInline(const RenderInline&);

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_RENDER_OBJECT(RenderInline, isRenderInline())
