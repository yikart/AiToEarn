/*
   Copyright (C) 1997 Martin Jones (mjones@kde.org)
             (C) 1998 Waldo Bastian (bastian@kde.org)
             (C) 1998, 1999 Torben Weis (weis@kde.org)
             (C) 1999 Lars Knoll (knoll@kde.org)
             (C) 1999 Antti Koivisto (koivisto@kde.org)
   Copyright (C) 2004-2019 Apple Inc. All rights reserved.

   This library is free software; you can redistribute it and/or
   modify it under the terms of the GNU Library General Public
   License as published by the Free Software Foundation; either
   version 2 of the License, or (at your option) any later version.

   This library is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
   Library General Public License for more details.

   You should have received a copy of the GNU Library General Public License
   along with this library; see the file COPYING.LIB.  If not, write to
   the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
   Boston, MA 02110-1301, USA.
*/

#pragma once

#include "AdjustViewSizeOrNot.h"
#include "Color.h"
#include "Document.h"
#include "FrameView.h"
#include "LayoutMilestone.h"
#include "LayoutRect.h"
#include "LocalFrame.h"
#include "LocalFrameViewLayoutContext.h"
#include "Pagination.h"
#include "PaintPhase.h"
#include "RenderPtr.h"
#include "SimpleRange.h"
#include <memory>
#include <wtf/Forward.h>
#include <wtf/Function.h>
#include <wtf/HashSet.h>
#include <wtf/ListHashSet.h>
#include <wtf/OptionSet.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/WeakHashSet.h>
#include <wtf/WeakRef.h>
#include <wtf/text/WTFString.h>

namespace WTF {
class TextStream;
}

namespace WebCore {

class AXObjectCache;
class ContainerNode;
class Element;
class FloatSize;
class Frame;
class GraphicsContext;
class HTMLFrameOwnerElement;
class Page;
class RegionContext;
class RenderBox;
class RenderElement;
class RenderEmbeddedObject;
class RenderLayer;
class RenderLayerModelObject;
class RenderObject;
class RenderScrollbarPart;
class RenderStyle;
class RenderView;
class RenderWidget;
class ScrollingCoordinator;
class ScrollAnchoringController;
class TiledBacking;

struct ScrollRectToVisibleOptions;
struct SimpleRange;
struct VelocityData;

enum class NullGraphicsContextPaintInvalidationReasons : uint8_t;
enum class StyleColorOptions : uint8_t;
enum class TiledBackingScrollability : uint8_t;

Pagination::Mode paginationModeForRenderStyle(const RenderStyle&);

enum class LayoutViewportConstraint : bool { Unconstrained, ConstrainedToDocumentRect };

class LocalFrameView final : public FrameView {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(LocalFrameView);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(LocalFrameView);
public:
    friend class Internals;
    friend class LocalFrameViewLayoutContext;
    friend class RenderView;

    WEBCORE_EXPORT static Ref<LocalFrameView> create(LocalFrame&);
    static Ref<LocalFrameView> create(LocalFrame&, const IntSize& initialSize);

    virtual ~LocalFrameView();

    void setFrameRect(const IntRect&) final;
    Type viewType() const final { return Type::Local; }
    void writeRenderTreeAsText(TextStream&, OptionSet<RenderAsTextFlag>) override;

    WEBCORE_EXPORT LocalFrame& frame() const final;
    Ref<LocalFrame> protectedFrame() const;

    WEBCORE_EXPORT RenderView* renderView() const;
    CheckedPtr<RenderView> checkedRenderView() const;

    int mapFromLayoutToCSSUnits(LayoutUnit) const;
    LayoutUnit mapFromCSSToLayoutUnits(int) const;

    WEBCORE_EXPORT void setCanHaveScrollbars(bool) final;
    WEBCORE_EXPORT void updateCanHaveScrollbars();

    bool isVisibleToHitTesting() const final;

    Ref<Scrollbar> createScrollbar(ScrollbarOrientation) final;

    void setContentsSize(const IntSize&) final;
    void updateContentsSize() final;

    const LocalFrameViewLayoutContext& layoutContext() const { return m_layoutContext; }
    LocalFrameViewLayoutContext& layoutContext() { return m_layoutContext; }
    CheckedRef<const LocalFrameViewLayoutContext> checkedLayoutContext() const;
    CheckedRef<LocalFrameViewLayoutContext> checkedLayoutContext();

    WEBCORE_EXPORT bool didFirstLayout() const;

    WEBCORE_EXPORT bool needsLayout() const;
    WEBCORE_EXPORT void setNeedsLayoutAfterViewConfigurationChange();

    void setNeedsCompositingConfigurationUpdate();
    void setNeedsCompositingGeometryUpdate();
    void setDescendantsNeedUpdateBackingAndHierarchyTraversal();

    WEBCORE_EXPORT void setViewportConstrainedObjectsNeedLayout();

    WEBCORE_EXPORT bool renderedCharactersExceed(unsigned threshold);

    void scheduleSelectionUpdate();

#if PLATFORM(IOS_FAMILY)
    bool useCustomFixedPositionLayoutRect() const;
    IntRect customFixedPositionLayoutRect() const { return m_customFixedPositionLayoutRect; }
    WEBCORE_EXPORT void setCustomFixedPositionLayoutRect(const IntRect&);
    bool updateFixedPositionLayoutRect();

    WEBCORE_EXPORT void setCustomSizeForResizeEvent(IntSize);

    WEBCORE_EXPORT void setScrollVelocity(const VelocityData&);
#else
    bool useCustomFixedPositionLayoutRect() const { return false; }
#endif

    void willRecalcStyle();
    void styleAndRenderTreeDidChange() override;

    // Called when changes to the GraphicsLayer hierarchy have to be synchronized with
    // content rendered via the normal painting path.
    void setNeedsOneShotDrawingSynchronization();

    WEBCORE_EXPORT GraphicsLayer* graphicsLayerForPlatformWidget(PlatformWidget);
    WEBCORE_EXPORT GraphicsLayer* graphicsLayerForPageScale();
    WEBCORE_EXPORT GraphicsLayer* graphicsLayerForScrolledContents();
#if HAVE(RUBBER_BANDING)
    WEBCORE_EXPORT GraphicsLayer* graphicsLayerForTransientZoomShadow();
#endif

    WEBCORE_EXPORT TiledBacking* tiledBacking() const;

    WEBCORE_EXPORT std::optional<ScrollingNodeID> scrollingNodeID() const override;
    WEBCORE_EXPORT ScrollableArea* scrollableAreaForScrollingNodeID(ScrollingNodeID) const;
    void setPluginScrollableAreaForScrollingNodeID(ScrollingNodeID nodeID, ScrollableArea& area) { m_scrollingNodeIDToPluginScrollableAreaMap.add(nodeID, &area); }
    void removePluginScrollableAreaForScrollingNodeID(ScrollingNodeID nodeID) { m_scrollingNodeIDToPluginScrollableAreaMap.remove(nodeID); }
    bool usesAsyncScrolling() const final;

    WEBCORE_EXPORT void enterCompositingMode();
    WEBCORE_EXPORT bool isEnclosedInCompositingLayer() const;

    // Only used with accelerated compositing, but outside the #ifdef to make linkage easier.
    // Returns true if the flush was completed.
    WEBCORE_EXPORT bool flushCompositingStateIncludingSubframes();

    // Returns true when a paint with the PaintBehavior::FlattenCompositingLayers flag set gives
    // a faithful representation of the content.
    WEBCORE_EXPORT bool isSoftwareRenderable() const;

    void setIsInWindow(bool);

    void resetScrollbars();
    void resetScrollbarsAndClearContentsSize();
    void prepareForDetach();
    void detachCustomScrollbars();
    WEBCORE_EXPORT void recalculateScrollbarOverlayStyle();

#if ENABLE(DARK_MODE_CSS)
    void updateBaseBackgroundColorIfNecessary();
#endif

    void clear();
    void resetLayoutMilestones();

    // This represents externally-imposed transparency. iframes are transparent by default, but that's handled in RenderView::shouldPaintBaseBackground().
    WEBCORE_EXPORT bool isTransparent() const;
    WEBCORE_EXPORT void setTransparent(bool isTransparent);
    
    // True if the FrameView is not transparent, and the base background color is opaque.
    bool hasOpaqueBackground() const;

    WEBCORE_EXPORT Color baseBackgroundColor() const;
    WEBCORE_EXPORT void setBaseBackgroundColor(const Color&);
    WEBCORE_EXPORT void updateBackgroundRecursively(const std::optional<Color>& backgroundColor);

    enum ExtendedBackgroundModeFlags {
        ExtendedBackgroundModeNone          = 0,
        ExtendedBackgroundModeVertical      = 1 << 0,
        ExtendedBackgroundModeHorizontal    = 1 << 1,
        ExtendedBackgroundModeAll           = ExtendedBackgroundModeVertical | ExtendedBackgroundModeHorizontal,
    };
    typedef unsigned ExtendedBackgroundMode;

    void updateExtendBackgroundIfNecessary();
    void updateTilesForExtendedBackgroundMode(ExtendedBackgroundMode);
    ExtendedBackgroundMode calculateExtendedBackgroundMode() const;

    bool hasExtendedBackgroundRectForPainting() const;
    IntRect extendedBackgroundRectForPainting() const;

    bool shouldUpdateWhileOffscreen() const;
    WEBCORE_EXPORT void setShouldUpdateWhileOffscreen(bool);
    bool shouldUpdate() const;

    WEBCORE_EXPORT void adjustViewSize();

    struct OverrideViewportSize {
        std::optional<float> width;
        std::optional<float> height;

        friend bool operator==(const OverrideViewportSize&, const OverrideViewportSize&) = default;
    };

    WEBCORE_EXPORT void setOverrideSizeForCSSDefaultViewportUnits(OverrideViewportSize);
    std::optional<OverrideViewportSize> overrideSizeForCSSDefaultViewportUnits() const { return m_defaultViewportSizeOverride; }
    WEBCORE_EXPORT void setSizeForCSSDefaultViewportUnits(FloatSize);
    void clearSizeOverrideForCSSDefaultViewportUnits();
    FloatSize sizeForCSSDefaultViewportUnits() const;

    WEBCORE_EXPORT void setOverrideSizeForCSSSmallViewportUnits(OverrideViewportSize);
    std::optional<OverrideViewportSize> overrideSizeForCSSSmallViewportUnits() const { return m_smallViewportSizeOverride; }
    WEBCORE_EXPORT void setSizeForCSSSmallViewportUnits(FloatSize);
    void clearSizeOverrideForCSSSmallViewportUnits();
    FloatSize sizeForCSSSmallViewportUnits() const;

    WEBCORE_EXPORT void setOverrideSizeForCSSLargeViewportUnits(OverrideViewportSize);
    std::optional<OverrideViewportSize> overrideSizeForCSSLargeViewportUnits() const { return m_largeViewportSizeOverride; }
    WEBCORE_EXPORT void setSizeForCSSLargeViewportUnits(FloatSize);
    void clearSizeOverrideForCSSLargeViewportUnits();
    FloatSize sizeForCSSLargeViewportUnits() const;

    FloatSize sizeForCSSDynamicViewportUnits() const;

    IntRect windowClipRect() const final;
    WEBCORE_EXPORT IntRect windowClipRectForFrameOwner(const HTMLFrameOwnerElement*, bool clipToLayerContents) const;

    WEBCORE_EXPORT void setScrollPosition(const ScrollPosition&, const ScrollPositionChangeOptions& = ScrollPositionChangeOptions::createProgrammatic()) final;
    void restoreScrollbar();
    void scheduleScrollToFocusedElement(SelectionRevealMode);
    void cancelScheduledScrolls();
    void scrollToFocusedElementImmediatelyIfNeeded();
    void updateLayerPositionsAfterScrolling() final;
    void updateLayerPositionsAfterOverflowScroll(RenderLayer&);
    void updateCompositingLayersAfterScrolling() final;
    static WEBCORE_EXPORT bool scrollRectToVisible(const LayoutRect& absoluteRect, const RenderObject&, bool insideFixed, const ScrollRectToVisibleOptions&);

    bool requestStartKeyboardScrollAnimation(const KeyboardScroll&) final;
    bool requestStopKeyboardScrollAnimation(bool immediate) final;

    bool requestScrollToPosition(const ScrollPosition&, const ScrollPositionChangeOptions& options = ScrollPositionChangeOptions::createProgrammatic()) final;
    void stopAsyncAnimatedScroll() final;

    bool isUserScrollInProgress() const final;
    bool isRubberBandInProgress() const final;
    WEBCORE_EXPORT ScrollPosition minimumScrollPosition() const final;
    WEBCORE_EXPORT ScrollPosition maximumScrollPosition() const final;

    // The scrollOrigin, scrollPosition, minimumScrollPosition and maximumScrollPosition are all affected by frame scale,
    // but layoutViewport computations require unscaled scroll positions.
    ScrollPosition unscaledMinimumScrollPosition() const;
    ScrollPosition unscaledMaximumScrollPosition() const;

    IntPoint unscaledScrollOrigin() const;

    WEBCORE_EXPORT LayoutPoint minStableLayoutViewportOrigin() const;
    WEBCORE_EXPORT LayoutPoint maxStableLayoutViewportOrigin() const;

    enum class TriggerLayoutOrNot : bool { No, Yes };
    // This origin can be overridden by setLayoutViewportOverrideRect.
    void setBaseLayoutViewportOrigin(LayoutPoint, TriggerLayoutOrNot = TriggerLayoutOrNot::Yes);
    // This size can be overridden by setLayoutViewportOverrideRect.
    WEBCORE_EXPORT LayoutSize baseLayoutViewportSize() const;
    
    // If set, overrides the default "m_layoutViewportOrigin, size of initial containing block" rect.
    // Used with delegated scrolling (i.e. iOS).
    WEBCORE_EXPORT void setLayoutViewportOverrideRect(std::optional<LayoutRect>, TriggerLayoutOrNot = TriggerLayoutOrNot::Yes);
    std::optional<LayoutRect> layoutViewportOverrideRect() const { return m_layoutViewportOverrideRect; }

    WEBCORE_EXPORT void setVisualViewportOverrideRect(std::optional<LayoutRect>);
    std::optional<LayoutRect> visualViewportOverrideRect() const { return m_visualViewportOverrideRect; }

    // These are in document coordinates, unaffected by page scale (but affected by zooming).
    WEBCORE_EXPORT LayoutRect layoutViewportRect() const;
    WEBCORE_EXPORT LayoutRect visualViewportRect() const;
    
    static LayoutRect visibleDocumentRect(const FloatRect& visibleContentRect, float headerHeight, float footerHeight, const FloatSize& totalContentsSize, float pageScaleFactor);

    // This is different than visibleContentRect() in that it ignores negative (or overly positive)
    // offsets from rubber-banding, and it takes zooming into account. 
    LayoutRect viewportConstrainedVisibleContentRect() const;

    WEBCORE_EXPORT void layoutOrVisualViewportChanged();

    LayoutRect rectForFixedPositionLayout() const;

    void viewportContentsChanged();
    WEBCORE_EXPORT void resumeVisibleImageAnimationsIncludingSubframes();
#if ENABLE(ACCESSIBILITY_ANIMATION_CONTROL)
    void updatePlayStateForAllAnimationsIncludingSubframes();
#endif

    AtomString mediaType() const;
    WEBCORE_EXPORT void setMediaType(const AtomString&);
    void adjustMediaTypeForPrinting(bool printing);

    void setCannotBlitToWindow();
    void setIsOverlapped(bool);
    void setContentIsOpaque(bool);

    void addSlowRepaintObject(RenderElement&);
    void removeSlowRepaintObject(RenderElement&);
    bool hasSlowRepaintObject(const RenderElement& renderer) const;
    bool hasSlowRepaintObjects() const;
    SingleThreadWeakHashSet<RenderElement>* slowRepaintObjects() const { return m_slowRepaintObjects.get(); }

    // Includes fixed- and sticky-position objects.
    void addViewportConstrainedObject(RenderLayerModelObject&);
    void removeViewportConstrainedObject(RenderLayerModelObject&);
    const SingleThreadWeakHashSet<RenderLayerModelObject>* viewportConstrainedObjects() const { return m_viewportConstrainedObjects.get(); }
    WEBCORE_EXPORT bool hasViewportConstrainedObjects() const;

    float frameScaleFactor() const;

    // Functions for querying the current scrolled position, negating the effects of overhang
    // and adjusting for page scale.
    LayoutPoint scrollPositionForFixedPosition() const;
    
    // Static function can be called from another thread.
    WEBCORE_EXPORT static LayoutPoint scrollPositionForFixedPosition(const LayoutRect& visibleContentRect, const LayoutSize& totalContentsSize, const LayoutPoint& scrollPosition, const LayoutPoint& scrollOrigin, float frameScaleFactor, bool fixedElementsLayoutRelativeToFrame, ScrollBehaviorForFixedElements, int headerHeight, int footerHeight);

    WEBCORE_EXPORT static LayoutSize expandedLayoutViewportSize(const LayoutSize& baseLayoutViewportSize, const LayoutSize& documentSize, double heightExpansionFactor);

    WEBCORE_EXPORT static LayoutRect computeUpdatedLayoutViewportRect(const LayoutRect& layoutViewport, const LayoutRect& documentRect, const LayoutSize& unobscuredContentSize, const LayoutRect& unobscuredContentRect, const LayoutSize& baseLayoutViewportSize, const LayoutPoint& stableLayoutViewportOriginMin, const LayoutPoint& stableLayoutViewportOriginMax, LayoutViewportConstraint);
    
    WEBCORE_EXPORT static LayoutPoint computeLayoutViewportOrigin(const LayoutRect& visualViewport, const LayoutPoint& stableLayoutViewportOriginMin, const LayoutPoint& stableLayoutViewportOriginMax, const LayoutRect& layoutViewport, ScrollBehaviorForFixedElements);

    // These layers are positioned differently when there is a topContentInset, a header, or a footer. These value need to be computed
    // on both the main thread and the scrolling thread.
    static float yPositionForInsetClipLayer(const FloatPoint& scrollPosition, float topContentInset);
    WEBCORE_EXPORT static FloatPoint positionForRootContentLayer(const FloatPoint& scrollPosition, const FloatPoint& scrollOrigin, float topContentInset, float headerHeight);
    WEBCORE_EXPORT FloatPoint positionForRootContentLayer() const;

    WEBCORE_EXPORT static float yPositionForHeaderLayer(const FloatPoint& scrollPosition, float topContentInset);
    WEBCORE_EXPORT static float yPositionForFooterLayer(const FloatPoint& scrollPosition, float topContentInset, float totalContentsHeight, float footerHeight);

#if PLATFORM(IOS_FAMILY)
    WEBCORE_EXPORT LayoutRect viewportConstrainedObjectsRect() const;
    // Static function can be called from another thread.
    WEBCORE_EXPORT static LayoutRect rectForViewportConstrainedObjects(const LayoutRect& visibleContentRect, const LayoutSize& totalContentsSize, float frameScaleFactor, bool fixedElementsLayoutRelativeToFrame, ScrollBehaviorForFixedElements);
#endif

    IntRect viewRectExpandedByContentInsets() const;
    
    bool fixedElementsLayoutRelativeToFrame() const;

    bool speculativeTilingEnabled() const { return m_speculativeTilingEnabled; }
    void loadProgressingStatusChanged();

    WEBCORE_EXPORT void updateControlTints();

    WEBCORE_EXPORT bool wasScrolledByUser() const;
    WEBCORE_EXPORT void setWasScrolledByUser(bool);

    bool safeToPropagateScrollToParent() const;

    void addEmbeddedObjectToUpdate(RenderEmbeddedObject&);
    void removeEmbeddedObjectToUpdate(RenderEmbeddedObject&);

    WEBCORE_EXPORT void paintContents(GraphicsContext&, const IntRect& dirtyRect, SecurityOriginPaintPolicy = SecurityOriginPaintPolicy::AnyOrigin, RegionContext* = nullptr) final;

    struct PaintingState {
        OptionSet<PaintBehavior> paintBehavior;
        bool isTopLevelPainter;
        bool isFlatteningPaintOfRootFrame;
        PaintingState()
            : paintBehavior()
            , isTopLevelPainter(false)
            , isFlatteningPaintOfRootFrame(false)
        {
        }
    };

    void willPaintContents(GraphicsContext&, const IntRect& dirtyRect, PaintingState&, RegionContext* = nullptr);
    void didPaintContents(GraphicsContext&, const IntRect& dirtyRect, PaintingState&);

#if PLATFORM(IOS_FAMILY)
    WEBCORE_EXPORT void didReplaceMultipartContent();
#endif

    WEBCORE_EXPORT void setPaintBehavior(OptionSet<PaintBehavior>);
    WEBCORE_EXPORT OptionSet<PaintBehavior> paintBehavior() const;
    bool isPainting() const;
    bool hasEverPainted() const { return !!m_lastPaintTime; }
    void setLastPaintTime(MonotonicTime lastPaintTime) { m_lastPaintTime = lastPaintTime; }
    WEBCORE_EXPORT void setNodeToDraw(Node*);

    enum SelectionInSnapshot { IncludeSelection, ExcludeSelection };
    enum CoordinateSpaceForSnapshot { DocumentCoordinates, ViewCoordinates };
    WEBCORE_EXPORT void paintContentsForSnapshot(GraphicsContext&, const IntRect& imageRect, SelectionInSnapshot shouldPaintSelection, CoordinateSpaceForSnapshot);

    void paintOverhangAreas(GraphicsContext&, const IntRect& horizontalOverhangArea, const IntRect& verticalOverhangArea, const IntRect& dirtyRect) final;
    void paintScrollCorner(GraphicsContext&, const IntRect& cornerRect) final;
    void paintScrollbar(GraphicsContext&, Scrollbar&, const IntRect&) final;

    WEBCORE_EXPORT Color documentBackgroundColor() const;

    static MonotonicTime currentPaintTimeStamp() { return sCurrentPaintTimeStamp; } // returns 0 if not painting

    WEBCORE_EXPORT void updateLayoutAndStyleIfNeededRecursive(OptionSet<LayoutOptions> = { });

    void incrementVisuallyNonEmptyCharacterCount(const String&);
    void incrementVisuallyNonEmptyPixelCount(const IntSize&);
    bool isVisuallyNonEmpty() const { return m_contentQualifiesAsVisuallyNonEmpty; }

    bool hasEnoughContentForVisualMilestones() const;
    bool hasContentfulDescendants() const;
    void checkAndDispatchDidReachVisuallyNonEmptyState();

    WEBCORE_EXPORT void enableFixedWidthAutoSizeMode(bool enable, const IntSize& minSize);
    WEBCORE_EXPORT void enableSizeToContentAutoSizeMode(bool enable, const IntSize& maxSize);
    WEBCORE_EXPORT void setAutoSizeFixedMinimumHeight(int);
    bool isFixedWidthAutoSizeEnabled() const { return m_shouldAutoSize && m_autoSizeMode == AutoSizeMode::FixedWidth; }
    bool isSizeToContentAutoSizeEnabled() const { return m_shouldAutoSize && m_autoSizeMode == AutoSizeMode::SizeToContent; }
    IntSize autoSizingIntrinsicContentSize() const { return m_autoSizeContentSize; }

    WEBCORE_EXPORT void forceLayout(bool allowSubtreeLayout = false);
    WEBCORE_EXPORT void forceLayoutForPagination(const FloatSize& pageSize, const FloatSize& originalPageSize, float maximumShrinkFactor, AdjustViewSizeOrNot);

    // FIXME: This method is retained because of embedded WebViews in AppKit.  When a WebView is embedded inside
    // some enclosing view with auto-pagination, no call happens to resize the view.  The new pagination model
    // needs the view to resize as a result of the breaks, but that means that the enclosing view has to potentially
    // resize around that view.  Auto-pagination uses the bounds of the actual view that's being printed to determine
    // the edges of the print operation, so the resize is necessary if the enclosing view's bounds depend on the
    // web document's bounds.
    // 
    // This is already a problem if the view needs to be a different size because of printer fonts or because of print stylesheets.
    // Mail/Dictionary work around this problem by using the _layoutForPrinting SPI
    // to at least get print stylesheets and printer fonts into play, but since WebKit doesn't know about the page offset or
    // page size, it can't actually paginate correctly during _layoutForPrinting.
    //
    // We can eventually move Mail to a newer SPI that would let them opt in to the layout-time pagination model,
    // but that doesn't solve the general problem of how other AppKit views could opt in to the better model.
    //
    // NO OTHER PLATFORM BESIDES MAC SHOULD USE THIS METHOD.
    WEBCORE_EXPORT void adjustPageHeightDeprecated(float* newBottom, float oldTop, float oldBottom, float bottomLimit);

    bool scrollToFragment(const URL&);
    void scrollTo(const ScrollPosition&) final;
    void maintainScrollPositionAtAnchor(ContainerNode*);
    void maintainScrollPositionAtScrollToTextFragmentRange(SimpleRange&);
    WEBCORE_EXPORT void scrollElementToRect(const Element&, const IntRect&);

    // Coordinate systems:
    //
    // "View"
    //     Top left is top left of the FrameView/ScrollView/Widget. Size is Widget::boundsRect().size(). 
    //
    // "TotalContents"
    //    Relative to ScrollView's scrolled contents, including headers and footers. Size is totalContentsSize().
    //
    // "Contents"
    //    Relative to ScrollView's scrolled contents, excluding headers and footers, so top left is top left of the scroll view's
    //    document, and size is contentsSize().
    //
    // "Absolute"
    //    Relative to the document's scroll origin (non-zero for RTL documents), but affected by page zoom and page scale. Mostly used
    //    in rendering code.
    //
    // "Document"
    //    Relative to the document's scroll origin, but not affected by page zoom or page scale. Size is equivalent to CSS pixel dimensions.
    //    FIXME: some uses are affected by page zoom (e.g. layout and visual viewports).
    //
    // "Client"
    //    Relative to the visible part of the document (or, more strictly, the layout viewport rect), and with the same scaling
    //    as Document coordinates, i.e. matching CSS pixels. Affected by scroll origin.
    //
    // "LayoutViewport"
    //    Similar to client coordinates, but affected by page zoom (but not page scale).
    //

    float documentToAbsoluteScaleFactor(std::optional<float> usedZoom = std::nullopt) const;
    float absoluteToDocumentScaleFactor(std::optional<float> usedZoom = std::nullopt) const;

    WEBCORE_EXPORT FloatRect absoluteToDocumentRect(FloatRect, std::optional<float> usedZoom = std::nullopt) const;
    WEBCORE_EXPORT FloatPoint absoluteToDocumentPoint(FloatPoint, std::optional<float> usedZoom = std::nullopt) const;

    FloatRect absoluteToClientRect(FloatRect, std::optional<float> usedZoom = std::nullopt) const;

    FloatSize documentToClientOffset() const;
    WEBCORE_EXPORT FloatRect documentToClientRect(FloatRect) const;
    FloatPoint documentToClientPoint(FloatPoint) const;
    WEBCORE_EXPORT FloatRect clientToDocumentRect(FloatRect) const;
    WEBCORE_EXPORT FloatPoint clientToDocumentPoint(FloatPoint) const;

    WEBCORE_EXPORT FloatPoint absoluteToLayoutViewportPoint(FloatPoint) const;
    FloatPoint layoutViewportToAbsolutePoint(FloatPoint) const;

    WEBCORE_EXPORT FloatRect absoluteToLayoutViewportRect(FloatRect) const;
    FloatRect layoutViewportToAbsoluteRect(FloatRect) const;

    // Unlike client coordinates, layout viewport coordinates are affected by page zoom.
    WEBCORE_EXPORT FloatRect clientToLayoutViewportRect(FloatRect) const;
    WEBCORE_EXPORT FloatPoint clientToLayoutViewportPoint(FloatPoint) const;

    bool isFrameViewScrollCorner(const RenderScrollbarPart& scrollCorner) const { return m_scrollCorner.get() == &scrollCorner; }

    // isScrollable() takes an optional Scrollability parameter that allows the caller to define what they mean by 'scrollable.'
    // Most callers are interested in the default value, Scrollability::Scrollable, which means that there is actually content
    // to scroll to, and a scrollbar that will allow you to access it. In some cases, callers want to know if the FrameView is allowed
    // to rubber-band, which the main frame might be allowed to do even if there is no content to scroll to. In that case,
    // callers use Scrollability::ScrollableOrRubberbandable.
    enum class Scrollability { Scrollable, ScrollableOrRubberbandable };
    WEBCORE_EXPORT bool isScrollable(Scrollability definitionOfScrollable = Scrollability::Scrollable);

    bool isScrollableOrRubberbandable() final;
    bool hasScrollableOrRubberbandableAncestor() final;

    enum ScrollbarModesCalculationStrategy { RulesFromWebContentOnly, AnyRule };
    void calculateScrollbarModesForLayout(ScrollbarMode& hMode, ScrollbarMode& vMode, ScrollbarModesCalculationStrategy = AnyRule);

    IntPoint lastKnownMousePositionInView() const final;
    bool isHandlingWheelEvent() const final;
    bool shouldSetCursor() const;

    WEBCORE_EXPORT bool useDarkAppearance() const final;
    OptionSet<StyleColorOptions> styleColorOptions() const;

    // FIXME: Remove this method once plugin loading is decoupled from layout.
    void flushAnyPendingPostLayoutTasks();

    bool shouldSuspendScrollAnimations() const final;

    RenderBox* embeddedContentBox() const;
    
    WEBCORE_EXPORT void setTracksRepaints(bool);
    bool isTrackingRepaints() const { return m_isTrackingRepaints; }
    WEBCORE_EXPORT void resetTrackedRepaints();
    const Vector<FloatRect>& trackedRepaintRects() const { return m_trackedRepaintRects; }
    String trackedRepaintRectsAsText() const;

    WEBCORE_EXPORT void startTrackingLayoutUpdates();
    WEBCORE_EXPORT unsigned layoutUpdateCount();
    WEBCORE_EXPORT void startTrackingRenderLayerPositionUpdates();
    WEBCORE_EXPORT unsigned renderLayerPositionUpdateCount();

    typedef WeakHashSet<ScrollableArea> ScrollableAreaSet;
    // Returns whether the scrollable area has just been newly added.
    WEBCORE_EXPORT bool addScrollableArea(ScrollableArea*);
    // Returns whether the scrollable area has just been removed.
    WEBCORE_EXPORT bool removeScrollableArea(ScrollableArea*);
    bool containsScrollableArea(ScrollableArea*) const;
    const ScrollableAreaSet* scrollableAreas() const { return m_scrollableAreas.get(); }
    
    void addScrollableAreaForAnimatedScroll(ScrollableArea*);
    void removeScrollableAreaForAnimatedScroll(ScrollableArea*);
    const ScrollableAreaSet* scrollableAreasForAnimatedScroll() const { return m_scrollableAreasForAnimatedScroll.get(); }

    WEBCORE_EXPORT void addChild(Widget&) final;
    WEBCORE_EXPORT void removeChild(Widget&) final;

    // This function exists for ports that need to handle wheel events manually.
    // On Mac WebKit1 the underlying NSScrollView just does the scrolling, but on most other platforms
    // we need this function in order to do the scroll ourselves.
    bool handleWheelEventForScrolling(const PlatformWheelEvent&, std::optional<WheelScrollGestureState>) final;

    WEBCORE_EXPORT void setScrollingPerformanceTestingEnabled(bool);

    // Page and LocalFrameView both store a Pagination value. Page::pagination() is set only by API,
    // and LocalFrameView::pagination() is set only by CSS. Page::pagination() will affect all
    // FrameViews in the back/forward cache, but LocalFrameView::pagination() only affects the current
    // LocalFrameView. LocalFrameView::pagination() will return m_pagination if it has been set. Otherwise,
    // it will return Page::pagination() since currently there are no callers that need to
    // distinguish between the two.
    const Pagination& pagination() const;
    void setPagination(const Pagination&);

#if HAVE(RUBBER_BANDING)
    WEBCORE_EXPORT GraphicsLayer* setWantsLayerForTopOverHangArea(bool) const;
    WEBCORE_EXPORT GraphicsLayer* setWantsLayerForBottomOverHangArea(bool) const;
#endif

    // This function "smears" the "position:fixed" uninflatedBounds for scrolling, returning a rect that is the union of
    // all possible locations of the given rect under page scrolling.
    LayoutRect fixedScrollableAreaBoundsInflatedForScrolling(const LayoutRect& uninflatedBounds) const;

    LayoutPoint scrollPositionRespectingCustomFixedPosition() const;

    void topContentInsetDidChange(float newTopContentInset);

    void topContentDirectionDidChange();

    WEBCORE_EXPORT void willStartLiveResize() final;
    WEBCORE_EXPORT void willEndLiveResize() final;

    WEBCORE_EXPORT void availableContentSizeChanged(AvailableSizeChangeReason) final;

    void updateTiledBackingAdaptiveSizing();
    OptionSet<TiledBackingScrollability> computeScrollability() const;

    void addPaintPendingMilestones(OptionSet<LayoutMilestone>);
    void firePaintRelatedMilestonesIfNeeded();
    void fireLayoutRelatedMilestonesIfNeeded();
    OptionSet<LayoutMilestone> milestonesPendingPaint() const { return m_milestonesPendingPaint; }

    bool visualUpdatesAllowedByClient() const { return m_visualUpdatesAllowedByClient; }
    WEBCORE_EXPORT void setVisualUpdatesAllowedByClient(bool);

    WEBCORE_EXPORT void setScrollPinningBehavior(ScrollPinningBehavior);

    ScrollBehaviorForFixedElements scrollBehaviorForFixedElements() const;

    bool hasFlippedBlockRenderers() const { return m_hasFlippedBlockRenderers; }
    void setHasFlippedBlockRenderers(bool b) { m_hasFlippedBlockRenderers = b; }

    void updateWidgetPositions();
    void scheduleUpdateWidgetPositions();

    void didAddWidgetToRenderTree(Widget&);
    void willRemoveWidgetFromRenderTree(Widget&);

    const HashSet<SingleThreadWeakRef<Widget>>& widgetsInRenderTree() const { return m_widgetsInRenderTree; }

    void notifyAllFramesThatContentAreaWillPaint() const;

    void addTrackedRepaintRect(const FloatRect&);

    // exposedRect represents WebKit's understanding of what part
    // of the view is actually exposed on screen (taking into account
    // clipping by other UI elements), whereas visibleContentRect is
    // internal to WebCore and doesn't respect those things.
    WEBCORE_EXPORT void setViewExposedRect(std::optional<FloatRect>);
    std::optional<FloatRect> viewExposedRect() const { return m_viewExposedRect; }

    void updateSnapOffsets() final;
    bool isScrollSnapInProgress() const final;
    void updateScrollingCoordinatorScrollSnapProperties() const;

    float adjustVerticalPageScrollStepForFixedContent(float step) final;

    void didChangeScrollOffset();

    void show() final;
    void hide() final;

    bool shouldPlaceVerticalScrollbarOnLeft() const final;
    bool isHorizontalWritingMode() const final;

    void didRestoreFromBackForwardCache();

    void willDestroyRenderTree();
    void didDestroyRenderTree();

    void setSpeculativeTilingDelayDisabledForTesting(bool disabled) { m_speculativeTilingDelayDisabledForTesting = disabled; }

    WEBCORE_EXPORT void invalidateControlTints();
    void invalidateImagesWithAsyncDecodes();
    void updateAccessibilityObjectRegions();
    AXObjectCache* axObjectCache() const;

    void invalidateScrollbarsForAllScrollableAreas();

    GraphicsLayer* layerForHorizontalScrollbar() const final;
    GraphicsLayer* layerForVerticalScrollbar() const final;

    void renderLayerDidScroll(const RenderLayer&);

    bool inUpdateEmbeddedObjects() const { return m_inUpdateEmbeddedObjects; }

    String debugDescription() const final;

    void willBeDestroyed() final;

    // ScrollView
    void updateScrollbarSteps() override;
    
    OverscrollBehavior horizontalOverscrollBehavior() const final;
    OverscrollBehavior verticalOverscrollBehavior() const final;

    Color scrollbarThumbColorStyle() const final;
    Color scrollbarTrackColorStyle() const final;
    ScrollbarGutter scrollbarGutterStyle() const final;
    ScrollbarWidth scrollbarWidthStyle() const final;

    void dequeueScrollableAreaForScrollAnchoringUpdate(ScrollableArea&);
    void queueScrollableAreaForScrollAnchoringUpdate(ScrollableArea&);
    void updateScrollAnchoringElementsForScrollableAreas();
    void updateScrollAnchoringPositionForScrollableAreas();

    void updateScrollAnchoringElement() final;
    void updateScrollPositionForScrollAnchoringController() final;
    void invalidateScrollAnchoringElement() final;
    ScrollAnchoringController* scrollAnchoringController() { return m_scrollAnchoringController.get(); }

    WEBCORE_EXPORT void scrollbarStyleDidChange();

    void scrollbarWidthChanged(ScrollbarWidth) override;

    std::optional<FrameIdentifier> rootFrameID() const final;

    IntSize totalScrollbarSpace() const final;
    int scrollbarGutterWidth(bool isHorizontalWritingMode = true) const;
    int insetForLeftScrollbarSpace() const final;

#if ASSERT_ENABLED
    struct AutoPreventLayerAccess {
        AutoPreventLayerAccess(LocalFrameView* view)
            : frameView(view)
            , oldPreventLayerAccess(view ? view->layerAccessPrevented() : false)
        {
            if (view)
                view->setLayerAcessPrevented(true);
        }

        ~AutoPreventLayerAccess()
        {
            if (frameView)
                frameView->setLayerAcessPrevented(oldPreventLayerAccess);
        }

    private:
        SingleThreadWeakPtr<LocalFrameView> frameView;
        bool oldPreventLayerAccess { false };
    };

    void setLayerAcessPrevented(bool prevented) { m_layerAccessPrevented = prevented; }
    bool layerAccessPrevented() const { return m_layerAccessPrevented; }
#else
    struct AutoPreventLayerAccess {
        AutoPreventLayerAccess(LocalFrameView*) { }
    };
#endif

private:
    explicit LocalFrameView(LocalFrame&);

    bool isLocalFrameView() const final { return true; }
    bool scrollContentsFastPath(const IntSize& scrollDelta, const IntRect& rectToScroll, const IntRect& clipRect) final;
    void scrollContentsSlowPath(const IntRect& updateRect) final;

    void traverseForPaintInvalidation(NullGraphicsContextPaintInvalidationReasons);
    void repaintSlowRepaintObjects();

    bool isVerticalDocument() const final;
    bool isFlippedDocument() const final;

    void incrementVisuallyNonEmptyCharacterCountSlowCase(const String&);

    void reset();
    void init();

    enum LayoutPhase {
        OutsideLayout,
        InPreLayout,
        InRenderTreeLayout,
        InViewSizeAdjust,
        InPostLayout
    };

    friend class RenderWidget;
    bool useSlowRepaints(bool considerOverlap = true) const;
    bool useSlowRepaintsIfNotOverlapped() const;
    void updateCanBlitOnScrollRecursively();
    bool shouldLayoutAfterContentsResized() const;
    
    void cancelScheduledScrollToFocusedElement();
    void cancelScheduledTextFragmentIndicatorTimer();

    ScrollingCoordinator* scrollingCoordinator() const;
    bool shouldUpdateCompositingLayersAfterScrolling() const;
    bool flushCompositingStateForThisFrame(const LocalFrame& rootFrameForFlush);

    bool shouldDeferScrollUpdateAfterContentSizeChange() final;

    void scrollOffsetChangedViaPlatformWidgetImpl(const ScrollOffset& oldOffset, const ScrollOffset& newOffset) final;

    void applyOverflowToViewport(const RenderElement&, ScrollbarMode& hMode, ScrollbarMode& vMode);
    void applyPaginationToViewport();

    void forceLayoutParentViewIfNeeded();
    void flushPostLayoutTasksQueue();
    void performPostLayoutTasks();

    enum class AutoSizeMode : uint8_t { FixedWidth, SizeToContent };
    void enableAutoSizeMode(bool enable, const IntSize& minSize, AutoSizeMode);
    void autoSizeIfEnabled();
    void performFixedWidthAutoSize();
    void performSizeToContentAutoSize();

    void applyRecursivelyWithVisibleRect(const Function<void(LocalFrameView& frameView, const IntRect& visibleRect)>&);
    void resumeVisibleImageAnimations(const IntRect& visibleRect);
#if ENABLE(ACCESSIBILITY_ANIMATION_CONTROL)
    void updatePlayStateForAllAnimations(const IntRect& visibleRect);
#endif
    void updateScriptedAnimationsAndTimersThrottlingState(const IntRect& visibleRect);

    WEBCORE_EXPORT void adjustTiledBackingCoverage();

    void repaintContentRectangle(const IntRect&) final;
    void addedOrRemovedScrollbar() final;

    void scrollToFocusedElementTimerFired();
    void scrollToFocusedElementInternal();

    void delegatedScrollingModeDidChange() final;

    void unobscuredContentSizeChanged() final;
    
    void textFragmentIndicatorTimerFired();

    // ScrollableArea interface
    void invalidateScrollbarRect(Scrollbar&, const IntRect&) final;
    void setVisibleScrollerThumbRect(const IntRect&) final;
    GraphicsLayer* layerForScrollCorner() const final;
#if HAVE(RUBBER_BANDING)
    GraphicsLayer* layerForOverhangAreas() const final;
#endif
    bool isInStableState() const final;
    void contentsResized() final;

#if ENABLE(DARK_MODE_CSS)
    RenderObject* rendererForColorScheme() const;
#endif

    bool usesCompositedScrolling() const final;
    bool mockScrollbarsControllerEnabled() const final;
    void logMockScrollbarsControllerMessage(const String&) const final;

    bool canShowNonOverlayScrollbars() const final;

    bool styleHidesScrollbarWithOrientation(ScrollbarOrientation) const;
    NativeScrollbarVisibility horizontalNativeScrollbarVisibility() const final;
    NativeScrollbarVisibility verticalNativeScrollbarVisibility() const final;

    void createScrollbarsController() final;
    // Override scrollbar notifications to update the AXObject cache.
    void didAddScrollbar(Scrollbar*, ScrollbarOrientation) final;
    void willRemoveScrollbar(Scrollbar*, ScrollbarOrientation) final;
    void scrollbarFrameRectChanged(const Scrollbar&) const final;

    IntSize sizeForResizeEvent() const;
    void scheduleResizeEventIfNeeded();
    
    RefPtr<Element> rootElementForCustomScrollbarPartStyle() const;

    void adjustScrollbarsForLayout(bool firstLayout);

    void handleDeferredScrollbarsUpdate();
    void handleDeferredPositionScrollbarLayers();

    void updateScrollableAreaSet();
    void updateLayoutViewport();

    void enableSpeculativeTilingIfNeeded();
    void speculativeTilingEnableTimerFired();

    void updateEmbeddedObjectsTimerFired();
    bool updateEmbeddedObjects();
    void updateEmbeddedObject(const SingleThreadWeakPtr<RenderEmbeddedObject>&);

    void updateWidgetPositionsTimerFired();

    bool scrollToFragmentInternal(StringView);
    void scheduleScrollToAnchorAndTextFragment();
    void scrollToAnchorAndTextFragmentNowIfNeeded();
    void scrollToAnchor();
    void scrollToTextFragmentRange();
    void scrollPositionChanged(const ScrollPosition& oldPosition, const ScrollPosition& newPosition);
    void scrollableAreaSetChanged();
    void scheduleScrollEvent();
    void resetScrollAnchor();

    void notifyScrollableAreasThatContentAreaWillPaint() const;

    bool hasCustomScrollbars() const;

    void updateScrollCorner() final;

    LocalFrameView* parentFrameView() const;

    void markRootOrBodyRendererDirty() const;

    bool qualifiesAsSignificantRenderedText() const;
    void updateHasReachedSignificantRenderedTextThreshold();

    bool isViewForDocumentInFrame() const;

    void notifyWidgetsInAllFrames(WidgetNotification);
    void removeFromAXObjectCache();
    void notifyWidgets(WidgetNotification);

    RenderElement* viewportRenderer() const;
    
    void willDoLayout(SingleThreadWeakPtr<RenderElement> layoutRoot);
    void didLayout(SingleThreadWeakPtr<RenderElement> layoutRoot, bool canDeferUpdateLayerPositions);

    FloatSize calculateSizeForCSSViewportUnitsOverride(std::optional<OverrideViewportSize>) const;

    void overrideWidthForCSSDefaultViewportUnits(float);
    void resetOverriddenWidthForCSSDefaultViewportUnits();

    void overrideWidthForCSSSmallViewportUnits(float);
    void resetOverriddenWidthForCSSSmallViewportUnits();

    void overrideWidthForCSSLargeViewportUnits(float);
    void resetOverriddenWidthForCSSLargeViewportUnits();

    void didFinishProhibitingScrollingWhenChangingContentSize() final;

    // ScrollableArea.
    float pageScaleFactor() const override;
    void didStartScrollAnimation() final;

    static MonotonicTime sCurrentPaintTimeStamp; // used for detecting decoded resource thrash in the cache

    void scrollRectToVisibleInChildView(const LayoutRect& absoluteRect, bool insideFixed, const ScrollRectToVisibleOptions&, const HTMLFrameOwnerElement*);
    void scrollRectToVisibleInTopLevelView(const LayoutRect& absoluteRect, bool insideFixed, const ScrollRectToVisibleOptions&);
    LayoutRect getPossiblyFixedRectToExpose(const LayoutRect& visibleRect, const LayoutRect& exposeRect, bool insideFixed, const ScrollAlignment& alignX, const ScrollAlignment& alignY) const;

    float deviceScaleFactor() const final;

    const Ref<LocalFrame> m_frame;
    LocalFrameViewLayoutContext m_layoutContext;

    HashSet<SingleThreadWeakRef<Widget>> m_widgetsInRenderTree;
    std::unique_ptr<ListHashSet<SingleThreadWeakRef<RenderEmbeddedObject>>> m_embeddedObjectsToUpdate;
    std::unique_ptr<SingleThreadWeakHashSet<RenderElement>> m_slowRepaintObjects;

    UncheckedKeyHashMap<ScrollingNodeID, WeakPtr<ScrollableArea>> m_scrollingNodeIDToPluginScrollableAreaMap;

    RefPtr<ContainerNode> m_maintainScrollPositionAnchor;
    RefPtr<ContainerNode> m_scheduledMaintainScrollPositionAnchor;
    RefPtr<Node> m_nodeToDraw;
    std::optional<SimpleRange> m_pendingTextFragmentIndicatorRange;
    String m_pendingTextFragmentIndicatorText;
    bool m_skipScrollResetOfScrollToTextFragmentRange { false };

    // Renderer to hold our custom scroll corner.
    RenderPtr<RenderScrollbarPart> m_scrollCorner;

    Timer m_updateEmbeddedObjectsTimer;
    Timer m_updateWidgetPositionsTimer;
    Timer m_delayedScrollEventTimer;
    Timer m_delayedScrollToFocusedElementTimer;
    Timer m_speculativeTilingEnableTimer;
    Timer m_delayedTextFragmentIndicatorTimer;

    MonotonicTime m_lastPaintTime;

    LayoutSize m_lastUsedSizeForLayout;

    Color m_baseBackgroundColor { Color::white };
    IntSize m_lastViewportSize;

    AtomString m_mediaType;
    AtomString m_mediaTypeWhenNotPrinting;

    Vector<FloatRect> m_trackedRepaintRects;
    
    IntRect* m_cachedWindowClipRect { nullptr };

    LayoutPoint m_layoutViewportOrigin;
    std::optional<LayoutRect> m_layoutViewportOverrideRect;
    std::optional<LayoutRect> m_visualViewportOverrideRect; // Used when the iOS keyboard is showing.

    std::optional<FloatRect> m_viewExposedRect;

    OptionSet<PaintBehavior> m_paintBehavior;

    float m_lastZoomFactor { 1 };
    unsigned m_visuallyNonEmptyCharacterCount { 0 };
    unsigned m_visuallyNonEmptyPixelCount { 0 };
    unsigned m_textRendererCountForVisuallyNonEmptyCharacters { 0 };
    int m_headerHeight { 0 };
    int m_footerHeight { 0 };

#if PLATFORM(IOS_FAMILY)
    bool m_useCustomFixedPositionLayoutRect { false };

    IntRect m_customFixedPositionLayoutRect;
    std::optional<IntSize> m_customSizeForResizeEvent;
#endif

    std::optional<OverrideViewportSize> m_defaultViewportSizeOverride;
    std::optional<OverrideViewportSize> m_smallViewportSizeOverride;
    std::optional<OverrideViewportSize> m_largeViewportSizeOverride;

    // The view size when autosizing.
    IntSize m_autoSizeConstraint;
    // The fixed height to resize the view to after autosizing is complete.
    int m_autoSizeFixedMinimumHeight { 0 };
    // The intrinsic content size decided by autosizing.
    IntSize m_autoSizeContentSize;

    std::unique_ptr<ScrollableAreaSet> m_scrollableAreas;
    std::unique_ptr<ScrollableAreaSet> m_scrollableAreasForAnimatedScroll;
    std::unique_ptr<SingleThreadWeakHashSet<RenderLayerModelObject>> m_viewportConstrainedObjects;

    OptionSet<LayoutMilestone> m_milestonesPendingPaint;

    static const unsigned visualCharacterThreshold = 200;
    static const unsigned visualPixelThreshold = 32 * 32;

    Pagination m_pagination;

    enum class ViewportRendererType : uint8_t { None, Document, Body };
    ViewportRendererType m_viewportRendererType { ViewportRendererType::None };
    ScrollPinningBehavior m_scrollPinningBehavior { ScrollPinningBehavior::DoNotPin };
    SelectionRevealMode m_selectionRevealModeForFocusedElement { SelectionRevealMode::DoNotReveal };
    ScrollableAreaSet m_scrollableAreasWithScrollAnchoringControllersNeedingUpdate;

    std::unique_ptr<ScrollAnchoringController> m_scrollAnchoringController;

    bool m_shouldUpdateWhileOffscreen { true };
    bool m_canHaveScrollbars { true };
    bool m_cannotBlitToWindow { false };
    bool m_isOverlapped { false };
    bool m_contentIsOpaque { false };
    bool m_firstLayoutCallbackPending { false };

    bool m_isTransparent { false };
#if ENABLE(DARK_MODE_CSS)
    OptionSet<StyleColorOptions> m_styleColorOptions;
#endif

    bool m_isTrackingRepaints { false }; // Used for testing.
    bool m_wasScrolledByUser { false };
    bool m_shouldScrollToFocusedElement { false };

    bool m_isPainting { false };

    bool m_contentQualifiesAsVisuallyNonEmpty { false };
    bool m_firstVisuallyNonEmptyLayoutMilestoneIsPending { true };

    bool m_renderedSignificantAmountOfText { false };
    bool m_hasReachedSignificantRenderedTextThreshold { false };

    bool m_needsDeferredScrollbarsUpdate { false };
    bool m_needsDeferredPositionScrollbarLayers { false };
    bool m_speculativeTilingEnabled { false };
    bool m_visualUpdatesAllowedByClient { true };
    bool m_hasFlippedBlockRenderers { false };
    bool m_speculativeTilingDelayDisabledForTesting { false };

    AutoSizeMode m_autoSizeMode { AutoSizeMode::FixedWidth };
    // If true, automatically resize the frame view around its content.
    bool m_shouldAutoSize { false };
    bool m_inAutoSize { false };
    // True if autosize has been run since m_shouldAutoSize was set.
    bool m_didRunAutosize { false };
    bool m_inUpdateEmbeddedObjects { false };
    bool m_scheduledToScrollToAnchor { false };
#if ASSERT_ENABLED
    bool m_layerAccessPrevented { false };
#endif
};

inline void LocalFrameView::incrementVisuallyNonEmptyPixelCount(const IntSize& size)
{
    if (m_visuallyNonEmptyPixelCount > visualPixelThreshold)
        return;

    auto area = size.area<RecordOverflow>() + m_visuallyNonEmptyPixelCount;
    if (UNLIKELY(area.hasOverflowed()))
        m_visuallyNonEmptyPixelCount = std::numeric_limits<decltype(m_visuallyNonEmptyPixelCount)>::max();
    else
        m_visuallyNonEmptyPixelCount = area;
}

inline void LocalFrameView::incrementVisuallyNonEmptyCharacterCount(const String& inlineText)
{
    if (m_visuallyNonEmptyCharacterCount > visualCharacterThreshold && m_hasReachedSignificantRenderedTextThreshold)
        return;

    incrementVisuallyNonEmptyCharacterCountSlowCase(inlineText);
}

inline bool LocalFrameView::hasEnoughContentForVisualMilestones() const
{
    if (!m_frame->page())
        return false;
    return isVisuallyNonEmpty() && hasContentfulDescendants() && (!m_frame->page()->requestedLayoutMilestones().contains(LayoutMilestone::DidRenderSignificantAmountOfText) || m_renderedSignificantAmountOfText);
}

inline RefPtr<LocalFrameView> LocalFrame::protectedView() const
{
    return m_view;
}

WTF::TextStream& operator<<(WTF::TextStream&, const LocalFrameView&);

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::LocalFrameView)
static bool isType(const WebCore::FrameView& view) { return view.viewType() == WebCore::FrameView::Type::Local; }
static bool isType(const WebCore::Widget& widget) { return widget.isLocalFrameView(); }
SPECIALIZE_TYPE_TRAITS_END()
