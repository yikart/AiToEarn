/*
 * Copyright (C) 1999 Lars Knoll (knoll@kde.org)
 * Copyright (C) 2006, 2015-2016 Apple Inc.
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

#include "LocalFrameView.h"
#include "Region.h"
#include "RenderBlockFlow.h"
#include "RenderSelection.h"
#include "RenderWidget.h"
#include <memory>
#include <wtf/HashSet.h>
#include <wtf/ListHashSet.h>
#include <wtf/WeakHashSet.h>

namespace WebCore {

class ImageQualityController;
class RenderLayerCompositor;
class RenderLayoutState;
class RenderCounter;
class RenderQuote;

namespace Layout {
class InitialContainingBlock;
class LayoutState;
}

class RenderView final : public RenderBlockFlow {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(RenderView);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(RenderView);
public:
    RenderView(Document&, RenderStyle&&);
    virtual ~RenderView();

    ASCIILiteral renderName() const override { return "RenderView"_s; }

    bool requiresLayer() const override { return true; }

    bool isChildAllowed(const RenderObject&, const RenderStyle&) const override;

    void layout() override;
    void updateLogicalWidth() override;
    LogicalExtentComputedValues computeLogicalHeight(LayoutUnit logicalHeight, LayoutUnit logicalTop) const override;

    LayoutUnit availableLogicalHeight(AvailableLogicalHeightType) const override;

    // The same as the FrameView's layoutHeight/layoutWidth but with null check guards.
    int viewHeight() const;
    int viewWidth() const;
    inline int viewLogicalWidth() const;
    int viewLogicalHeight() const;

    LayoutUnit clientLogicalWidthForFixedPosition() const;
    LayoutUnit clientLogicalHeightForFixedPosition() const;

    float zoomFactor() const;

    LocalFrameView& frameView() const { return m_frameView.get(); }
    Ref<LocalFrameView> protectedFrameView() const { return m_frameView.get(); }

    Layout::InitialContainingBlock& initialContainingBlock() { return m_initialContainingBlock.get(); }
    const Layout::InitialContainingBlock& initialContainingBlock() const { return m_initialContainingBlock.get(); }
    Layout::LayoutState& layoutState() { return *m_layoutState; }
    void updateQuirksMode();

    bool needsRepaintHackAfterCompositingLayerUpdateForDebugOverlaysOnly() const { return m_needsRepaintHackAfterCompositingLayerUpdateForDebugOverlaysOnly; };
    void setNeedsRepaintHackAfterCompositingLayerUpdateForDebugOverlaysOnly(bool value = true) { m_needsRepaintHackAfterCompositingLayerUpdateForDebugOverlaysOnly = value; }

    bool needsEventRegionUpdateForNonCompositedFrame() const { return m_needsEventRegionUpdateForNonCompositedFrame; }
    void setNeedsEventRegionUpdateForNonCompositedFrame(bool value = true) { m_needsEventRegionUpdateForNonCompositedFrame = value; }

    std::optional<RepaintRects> computeVisibleRectsInContainer(const RepaintRects&, const RenderLayerModelObject* container, VisibleRectContext) const override;
    void repaintRootContents();
    void repaintViewRectangle(const LayoutRect&) const;
    void repaintViewAndCompositedLayers();

    void paint(PaintInfo&, const LayoutPoint&) override;
    void paintBoxDecorations(PaintInfo&, const LayoutPoint&) override;
    // Return the renderer whose background style is used to paint the root background.
    RenderElement* rendererForRootBackground() const;

    RenderSelection& selection() { return m_selection; }

    bool printing() const;

    void boundingRects(Vector<LayoutRect>&, const LayoutPoint& accumulatedOffset) const override;
    void absoluteQuads(Vector<FloatQuad>&, bool* wasFixed) const override;

    LayoutRect viewRect() const;

    void updateHitTestResult(HitTestResult&, const LayoutPoint&) const override;

    void setPageLogicalSize(LayoutSize);
    LayoutUnit pageOrViewLogicalHeight() const;

    // This method is used to assign a page number only when pagination modes have
    // a block progression. This happens with vertical-rl books for example, but it
    // doesn't happen for normal horizontal-tb books. This is a very specialized
    // function and should not be mistaken for a general page number API.
    unsigned pageNumberForBlockProgressionOffset(int offset) const;

    unsigned pageCount() const;

    // FIXME: These functions are deprecated. No code should be added that uses these.
    int bestTruncatedAt() const { return m_legacyPrinting.m_bestTruncatedAt; }
    void setBestTruncatedAt(int y, RenderBoxModelObject* forRenderer, bool forcedBreak = false);
    int truncatedAt() const { return m_legacyPrinting.m_truncatedAt; }
    void setTruncatedAt(int y)
    { 
        m_legacyPrinting.m_truncatedAt = y;
        m_legacyPrinting.m_bestTruncatedAt = 0;
        m_legacyPrinting.m_truncatorWidth = 0;
        m_legacyPrinting.m_forcedPageBreak = false;
    }
    const IntRect& printRect() const { return m_legacyPrinting.m_printRect; }
    void setPrintRect(const IntRect& r) { m_legacyPrinting.m_printRect = r; }
    // End deprecated functions.

    // Notification that this view moved into or out of a native window.
    void setIsInWindow(bool);

    WEBCORE_EXPORT RenderLayerCompositor& compositor();
    WEBCORE_EXPORT bool usesCompositing() const;

    WEBCORE_EXPORT IntRect unscaledDocumentRect() const;
    LayoutRect unextendedBackgroundRect() const;
    LayoutRect backgroundRect() const;

    WEBCORE_EXPORT IntRect documentRect() const;

    // Renderer that paints the root background has background-images which all have background-attachment: fixed.
    bool rootBackgroundIsEntirelyFixed() const;

    bool rootElementShouldPaintBaseBackground() const;
    bool shouldPaintBaseBackground() const;

    FloatSize sizeForCSSSmallViewportUnits() const;
    FloatSize sizeForCSSLargeViewportUnits() const;
    FloatSize sizeForCSSDynamicViewportUnits() const;
    FloatSize sizeForCSSDefaultViewportUnits() const;

    bool hasQuotesNeedingUpdate() const { return m_hasQuotesNeedingUpdate; }
    void setHasQuotesNeedingUpdate(bool b) { m_hasQuotesNeedingUpdate = b; }

    void addCounterNeedingUpdate(RenderCounter&);
    SingleThreadWeakHashSet<RenderCounter> takeCountersNeedingUpdate();

    void incrementRendersWithOutline() { ++m_renderersWithOutlineCount; }
    void decrementRendersWithOutline() { ASSERT(m_renderersWithOutlineCount > 0); --m_renderersWithOutlineCount; }
    bool hasRenderersWithOutline() const { return m_renderersWithOutlineCount; }

    ImageQualityController& imageQualityController();

    void setHasSoftwareFilters(bool hasSoftwareFilters) { m_hasSoftwareFilters = hasSoftwareFilters; }
    bool hasSoftwareFilters() const { return m_hasSoftwareFilters; }

    uint64_t rendererCount() const { return m_rendererCount; }
    void didCreateRenderer() { ++m_rendererCount; }
    void didDestroyRenderer() { --m_rendererCount; }

    void updateVisibleViewportRect(const IntRect&);
    void registerForVisibleInViewportCallback(RenderElement&);
    void unregisterForVisibleInViewportCallback(RenderElement&);

    void resumePausedImageAnimationsIfNeeded(const IntRect& visibleRect);
#if ENABLE(ACCESSIBILITY_ANIMATION_CONTROL)
    void updatePlayStateForAllAnimations(const IntRect& visibleRect);
#endif
    void addRendererWithPausedImageAnimations(RenderElement&, CachedImage&);
    void removeRendererWithPausedImageAnimations(RenderElement&);
    void removeRendererWithPausedImageAnimations(RenderElement&, CachedImage&);

    class RepaintRegionAccumulator {
        WTF_MAKE_NONCOPYABLE(RepaintRegionAccumulator);
    public:
        RepaintRegionAccumulator(RenderView*);
        ~RepaintRegionAccumulator();

    private:
        SingleThreadWeakPtr<RenderView> m_rootView;
        bool m_wasAccumulatingRepaintRegion { false };
    };

    void registerBoxWithScrollSnapPositions(const RenderBox&);
    void unregisterBoxWithScrollSnapPositions(const RenderBox&);
    const SingleThreadWeakHashSet<const RenderBox>& boxesWithScrollSnapPositions() { return m_boxesWithScrollSnapPositions; }

    void registerContainerQueryBox(const RenderBox&);
    void unregisterContainerQueryBox(const RenderBox&);
    const SingleThreadWeakHashSet<const RenderBox>& containerQueryBoxes() const { return m_containerQueryBoxes; }

    void registerAnchor(const RenderBoxModelObject&);
    void unregisterAnchor(const RenderBoxModelObject&);
    const SingleThreadWeakHashSet<const RenderBoxModelObject>& anchors() const { return m_anchors; }

    SingleThreadWeakPtr<RenderElement> viewTransitionRoot() const;
    void setViewTransitionRoot(RenderElement& renderer);

    void addViewTransitionGroup(const AtomString&, RenderElement&);
    void removeViewTransitionGroup(const AtomString&);
    RenderElement* viewTransitionGroupForName(const AtomString&);

private:
    void styleDidChange(StyleDifference, const RenderStyle* oldStyle) override;

    void mapLocalToContainer(const RenderLayerModelObject* repaintContainer, TransformState&, OptionSet<MapCoordinatesMode>, bool* wasFixed) const override;
    const RenderObject* pushMappingToContainer(const RenderLayerModelObject* ancestorToStopAt, RenderGeometryMap&) const override;
    void mapAbsoluteToLocalPoint(OptionSet<MapCoordinatesMode>, TransformState&) const override;
    bool requiresColumns(int desiredColumnCount) const override;

    void computeColumnCountAndWidth() override;

    bool shouldRepaint(const LayoutRect&) const;
    void flushAccumulatedRepaintRegion() const;

    void layoutContent(const RenderLayoutState&);

    bool isScrollableOrRubberbandableBox() const override;

    Node* nodeForHitTest() const override;

    void updateInitialContainingBlockSize();

    CheckedRef<LocalFrameView> m_frameView;

    // Include this RenderView.
    uint64_t m_rendererCount { 1 };

    // Note that currently RenderView::layoutBox(), if it exists, is a child of m_initialContainingBlock.
    UniqueRef<Layout::InitialContainingBlock> m_initialContainingBlock;
    UniqueRef<Layout::LayoutState> m_layoutState;

    mutable std::unique_ptr<Region> m_accumulatedRepaintRegion;
    RenderSelection m_selection;

    // FIXME: Only used by embedded WebViews inside AppKit NSViews.  Find a way to remove.
    struct LegacyPrinting {
        int m_bestTruncatedAt { 0 };
        int m_truncatedAt { 0 };
        int m_truncatorWidth { 0 };
        IntRect m_printRect;
        bool m_forcedPageBreak { false };
    };
    LegacyPrinting m_legacyPrinting;
    // End deprecated members.

    bool shouldUsePrintingLayout() const;

    std::unique_ptr<ImageQualityController> m_imageQualityController;
    std::optional<LayoutSize> m_pageLogicalSize;
    bool m_pageLogicalHeightChanged { false };
    std::unique_ptr<RenderLayerCompositor> m_compositor;

    bool m_hasQuotesNeedingUpdate { false };

    SingleThreadWeakHashSet<RenderCounter> m_countersNeedingUpdate;
    unsigned m_renderCounterCount { 0 };
    unsigned m_renderersWithOutlineCount { 0 };

    bool m_hasSoftwareFilters { false };
    bool m_needsRepaintHackAfterCompositingLayerUpdateForDebugOverlaysOnly { false };
    bool m_needsEventRegionUpdateForNonCompositedFrame { false };

    SingleThreadWeakHashMap<RenderElement, Vector<WeakPtr<CachedImage>>> m_renderersWithPausedImageAnimation;
    WeakHashSet<SVGSVGElement, WeakPtrImplWithEventTargetData> m_SVGSVGElementsWithPausedImageAnimation;
    SingleThreadWeakHashSet<RenderElement> m_visibleInViewportRenderers;

    SingleThreadWeakHashSet<const RenderBox> m_boxesWithScrollSnapPositions;
    SingleThreadWeakHashSet<const RenderBox> m_containerQueryBoxes;
    SingleThreadWeakHashSet<const RenderBoxModelObject> m_anchors;

    SingleThreadWeakPtr<RenderElement> m_viewTransitionRoot;
    HashMap<AtomString, SingleThreadWeakPtr<RenderElement>> m_viewTransitionGroups;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_RENDER_OBJECT(RenderView, isRenderView())
