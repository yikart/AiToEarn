/*
 * Copyright (C) 2008-2016 Apple Inc. All Rights Reserved.
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

#include "KeyboardScroll.h"
#include "RectEdges.h"
#include "ScrollAlignment.h"
#include "ScrollAnchoringController.h"
#include "ScrollSnapOffsetsInfo.h"
#include "ScrollTypes.h"
#include "Scrollbar.h"
#include "ScrollbarColor.h"
#include <wtf/CheckedPtr.h>
#include <wtf/Forward.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/WeakPtr.h>

namespace WTF {
class TextStream;
}

namespace WebCore {

class FloatPoint;
class GraphicsContext;
class LayoutPoint;
class LayoutSize;
class PlatformTouchEvent;
class PlatformWheelEvent;
class ScrollAnimator;
class ScrollbarsController;
class GraphicsLayer;
class TiledBacking;
class Element;

enum class WheelScrollGestureState : uint8_t;

struct ScrollbarColor;
struct ScrollbarGutter;

inline int offsetForOrientation(ScrollOffset offset, ScrollbarOrientation orientation)
{
    switch (orientation) {
    case ScrollbarOrientation::Horizontal: return offset.x();
    case ScrollbarOrientation::Vertical: return offset.y();
    }
    ASSERT_NOT_REACHED();
    return 0;
}

class ScrollableArea : public CanMakeWeakPtr<ScrollableArea> {
    WTF_MAKE_TZONE_ALLOCATED(ScrollableArea);
public:
    // CheckedPtr interface
    virtual uint32_t checkedPtrCount() const = 0;
    virtual uint32_t checkedPtrCountWithoutThreadCheck() const = 0;
    virtual void incrementCheckedPtrCount() const = 0;
    virtual void decrementCheckedPtrCount() const = 0;

    virtual bool isScrollView() const { return false; }
    virtual bool isRenderLayer() const { return false; }
    virtual bool isListBox() const { return false; }

    WEBCORE_EXPORT void beginKeyboardScroll(const KeyboardScroll& scrollData);
    WEBCORE_EXPORT void endKeyboardScroll(bool);

    WEBCORE_EXPORT bool scroll(ScrollDirection, ScrollGranularity, unsigned stepCount = 1);
    WEBCORE_EXPORT void scrollToPositionWithAnimation(const FloatPoint&, const ScrollPositionChangeOptions& options = ScrollPositionChangeOptions::createProgrammatic());
    WEBCORE_EXPORT void scrollToPositionWithoutAnimation(const FloatPoint&, ScrollClamping = ScrollClamping::Clamped);

    WEBCORE_EXPORT void scrollToOffsetWithoutAnimation(const FloatPoint&, ScrollClamping = ScrollClamping::Clamped);
    WEBCORE_EXPORT void scrollToOffsetWithoutAnimation(ScrollbarOrientation, float offset);

    // Should be called when the scroll position changes externally, for example if the scroll layer position
    // is updated on the scrolling thread and we need to notify the main thread.
    WEBCORE_EXPORT void notifyScrollPositionChanged(const ScrollPosition&);

    // Allows subclasses to handle scroll position updates themselves. If this member function
    // returns true, the scrollable area won't actually update the scroll position and instead
    // expect it to happen sometime in the future.
    virtual bool requestScrollToPosition(const ScrollPosition&, const ScrollPositionChangeOptions& = ScrollPositionChangeOptions::createProgrammatic()) { return false; }
    virtual void stopAsyncAnimatedScroll() { }

    virtual bool requestStartKeyboardScrollAnimation(const KeyboardScroll&) { return false; }
    virtual bool requestStopKeyboardScrollAnimation(bool) { return false; }

    WEBCORE_EXPORT virtual bool handleWheelEventForScrolling(const PlatformWheelEvent&, std::optional<WheelScrollGestureState>);

    virtual void updateSnapOffsets() { };
    WEBCORE_EXPORT const LayoutScrollSnapOffsetsInfo* snapOffsetsInfo() const;
    WEBCORE_EXPORT void setScrollSnapOffsetInfo(const LayoutScrollSnapOffsetsInfo&);
    WEBCORE_EXPORT void clearSnapOffsets();
    WEBCORE_EXPORT std::optional<unsigned> currentHorizontalSnapPointIndex() const;
    WEBCORE_EXPORT std::optional<unsigned> currentVerticalSnapPointIndex() const;
    WEBCORE_EXPORT void setCurrentHorizontalSnapPointIndex(std::optional<unsigned>);
    WEBCORE_EXPORT void setCurrentVerticalSnapPointIndex(std::optional<unsigned>);

    WEBCORE_EXPORT void resnapAfterLayout();
    void doPostThumbMoveSnapping(ScrollbarOrientation);

    void stopKeyboardScrollAnimation();

#if ENABLE(TOUCH_EVENTS)
    WEBCORE_EXPORT virtual bool handleTouchEvent(const PlatformTouchEvent&);
#endif

#if PLATFORM(IOS_FAMILY)
    virtual void didStartScroll() { }
    virtual void didEndScroll() { }
    virtual void didUpdateScroll() { }
#endif
    
    // "Stepped scrolling" is used by RenderListBox; it implies that scrollbar->pixelStep() is not 1 and never has rubberbanding.
    virtual bool hasSteppedScrolling() const { return false; }

    ScrollClamping scrollClamping() const { return m_scrollClamping; }
    void setScrollClamping(ScrollClamping clamping) { m_scrollClamping = clamping; }

    void setVerticalScrollElasticity(ScrollElasticity scrollElasticity) { m_verticalScrollElasticity = scrollElasticity; }
    ScrollElasticity verticalScrollElasticity() const { return m_verticalScrollElasticity; }

    void setHorizontalScrollElasticity(ScrollElasticity scrollElasticity) { m_horizontalScrollElasticity = scrollElasticity; }
    ScrollElasticity horizontalScrollElasticity() const { return m_horizontalScrollElasticity; }

    virtual ScrollbarMode horizontalScrollbarMode() const { return ScrollbarMode::Auto; }
    virtual ScrollbarMode verticalScrollbarMode() const { return ScrollbarMode::Auto; }
    bool canHaveScrollbars() const { return horizontalScrollbarMode() != ScrollbarMode::AlwaysOff || verticalScrollbarMode() != ScrollbarMode::AlwaysOff; }

    virtual NativeScrollbarVisibility horizontalNativeScrollbarVisibility() const { return NativeScrollbarVisibility::Visible; }
    virtual NativeScrollbarVisibility verticalNativeScrollbarVisibility() const { return NativeScrollbarVisibility::Visible; }
    
    virtual OverscrollBehavior horizontalOverscrollBehavior() const { return OverscrollBehavior::Auto; }
    virtual OverscrollBehavior verticalOverscrollBehavior() const { return OverscrollBehavior::Auto; }

    WEBCORE_EXPORT virtual Color scrollbarThumbColorStyle() const;
    WEBCORE_EXPORT virtual Color scrollbarTrackColorStyle() const;
    WEBCORE_EXPORT virtual ScrollbarGutter scrollbarGutterStyle() const;
    virtual ScrollbarWidth scrollbarWidthStyle() const { return ScrollbarWidth::Auto; }

    WEBCORE_EXPORT bool allowsHorizontalScrolling() const;
    WEBCORE_EXPORT bool allowsVerticalScrolling() const;

    WEBCORE_EXPORT String horizontalScrollbarStateForTesting() const;
    WEBCORE_EXPORT String verticalScrollbarStateForTesting() const;

    bool inLiveResize() const { return m_inLiveResize; }
    WEBCORE_EXPORT virtual void willStartLiveResize();
    WEBCORE_EXPORT virtual void willEndLiveResize();

    WEBCORE_EXPORT void contentAreaWillPaint() const;
    WEBCORE_EXPORT void mouseEnteredContentArea() const;
    WEBCORE_EXPORT void mouseExitedContentArea() const;
    WEBCORE_EXPORT void mouseMovedInContentArea() const;
    WEBCORE_EXPORT void mouseEnteredScrollbar(Scrollbar*) const;
    void mouseExitedScrollbar(Scrollbar*) const;
    void mouseIsDownInScrollbar(Scrollbar*, bool) const;
    void contentAreaDidShow() const;
    void contentAreaDidHide() const;

    void lockOverlayScrollbarStateToHidden(bool shouldLockState) const;
    WEBCORE_EXPORT bool scrollbarsCanBeActive() const;

    WEBCORE_EXPORT virtual void didAddScrollbar(Scrollbar*, ScrollbarOrientation);
    WEBCORE_EXPORT virtual void willRemoveScrollbar(Scrollbar*, ScrollbarOrientation);

    WEBCORE_EXPORT virtual void contentsResized();

    // Force the contents to recompute their size (i.e. do layout).
    virtual void updateContentsSize() { }

    enum class AvailableSizeChangeReason : bool {
        ScrollbarsChanged,
        AreaSizeChanged
    };
    WEBCORE_EXPORT virtual void availableContentSizeChanged(AvailableSizeChangeReason);

    // This returns information about existing scrollbars, not scrollbars that may be created in future.
    bool hasOverlayScrollbars() const;

    // Returns true if any scrollbars that might be created would be non-overlay scrollbars.
    WEBCORE_EXPORT virtual bool canShowNonOverlayScrollbars() const;

    WEBCORE_EXPORT virtual void setScrollbarOverlayStyle(ScrollbarOverlayStyle);
    ScrollbarOverlayStyle scrollbarOverlayStyle() const { return m_scrollbarOverlayStyle; }
    void invalidateScrollbars();
    bool useDarkAppearanceForScrollbars() const;

    virtual std::optional<ScrollingNodeID> scrollingNodeID() const { return std::nullopt; }
    ScrollingNodeID scrollingNodeIDForTesting();

    WEBCORE_EXPORT ScrollAnimator& scrollAnimator() const;
    ScrollAnimator* existingScrollAnimator() const { return m_scrollAnimator.get(); }

    WEBCORE_EXPORT ScrollbarsController& scrollbarsController() const;
    ScrollbarsController* existingScrollbarsController() const { return m_scrollbarsController.get(); }
    WEBCORE_EXPORT virtual void createScrollbarsController();

    virtual bool isActive() const = 0;
    WEBCORE_EXPORT virtual void invalidateScrollbar(Scrollbar&, const IntRect&);
    virtual bool isScrollCornerVisible() const = 0;
    virtual IntRect scrollCornerRect() const = 0;
    WEBCORE_EXPORT virtual void invalidateScrollCorner(const IntRect&);

    virtual bool forceUpdateScrollbarsOnMainThreadForPerformanceTesting() const = 0;

    // Convert points and rects between the scrollbar and its containing view.
    // The client needs to implement these in order to be aware of layout effects
    // like CSS transforms.
    virtual IntRect convertFromScrollbarToContainingView(const Scrollbar& scrollbar, const IntRect& scrollbarRect) const
    {
        return scrollbar.Widget::convertToContainingView(scrollbarRect);
    }
    virtual IntRect convertFromContainingViewToScrollbar(const Scrollbar& scrollbar, const IntRect& parentRect) const
    {
        return scrollbar.Widget::convertFromContainingView(parentRect);
    }
    virtual IntPoint convertFromScrollbarToContainingView(const Scrollbar& scrollbar, const IntPoint& scrollbarPoint) const
    {
        return scrollbar.Widget::convertToContainingView(scrollbarPoint);
    }
    virtual IntPoint convertFromContainingViewToScrollbar(const Scrollbar& scrollbar, const IntPoint& parentPoint) const
    {
        return scrollbar.Widget::convertFromContainingView(parentPoint);
    }

    int horizontalScrollbarIntrusion() const;
    int verticalScrollbarIntrusion() const;
    WEBCORE_EXPORT IntSize scrollbarIntrusion() const;

    virtual Scrollbar* horizontalScrollbar() const { return nullptr; }
    virtual Scrollbar* verticalScrollbar() const { return nullptr; }
    virtual void scrollbarFrameRectChanged(const Scrollbar&) const { };

    Scrollbar* scrollbarForDirection(ScrollDirection direction) const
    {
        switch (direction) {
        case ScrollDirection::ScrollUp:
        case ScrollDirection::ScrollDown:
            return verticalScrollbar();
        case ScrollDirection::ScrollLeft:
        case ScrollDirection::ScrollRight:
            return horizontalScrollbar();
        }
        return nullptr;
    }

    const IntPoint& scrollOrigin() const { return m_scrollOrigin; }
    bool scrollOriginChanged() const { return m_scrollOriginChanged; }

    virtual ScrollPosition scrollPosition() const = 0;
    WEBCORE_EXPORT virtual ScrollPosition minimumScrollPosition() const;
    WEBCORE_EXPORT virtual ScrollPosition maximumScrollPosition() const;

    ScrollPosition constrainedScrollPosition(const ScrollPosition& position) const
    {
        return position.constrainedBetween(minimumScrollPosition(), maximumScrollPosition());
    }

    WEBCORE_EXPORT ScrollOffset scrollOffset() const;

    ScrollOffset minimumScrollOffset() const { return { }; }
    ScrollOffset maximumScrollOffset() const;

    WEBCORE_EXPORT ScrollPosition scrollPositionFromOffset(ScrollOffset) const;
    WEBCORE_EXPORT ScrollOffset scrollOffsetFromPosition(ScrollPosition) const;

    template<typename PositionType, typename SizeType>
    static PositionType scrollPositionFromOffset(PositionType offset, SizeType scrollOrigin)
    {
        return offset - scrollOrigin;
    }

    template<typename PositionType, typename SizeType>
    static PositionType scrollOffsetFromPosition(PositionType position, SizeType scrollOrigin)
    {
        return position + scrollOrigin;
    }

    WEBCORE_EXPORT virtual bool scrolledToTop() const;
    WEBCORE_EXPORT virtual bool scrolledToBottom() const;
    WEBCORE_EXPORT virtual bool scrolledToLeft() const;
    WEBCORE_EXPORT virtual bool scrolledToRight() const;

    ScrollType currentScrollType() const { return m_currentScrollType; }
    void setCurrentScrollType(ScrollType scrollType) { m_currentScrollType = scrollType; }

    // This reflects animated scrolls triggered by CSS OM View "smooth" scrolls.
    ScrollAnimationStatus scrollAnimationStatus() { return m_scrollAnimationStatus; }
    void setScrollAnimationStatus(ScrollAnimationStatus status) { m_scrollAnimationStatus = status; }
    virtual void animatedScrollDidEnd() { };

    bool scrollShouldClearLatchedState() const { return m_scrollShouldClearLatchedState; }
    void setScrollShouldClearLatchedState(bool shouldClear) { m_scrollShouldClearLatchedState = shouldClear; }

    enum class VisibleContentRectIncludesScrollbars : bool { No, Yes };
    enum VisibleContentRectBehavior {
        ContentsVisibleRect,
#if PLATFORM(IOS_FAMILY)
        LegacyIOSDocumentViewRect,
        LegacyIOSDocumentVisibleRect = LegacyIOSDocumentViewRect
#else
        LegacyIOSDocumentVisibleRect = ContentsVisibleRect
#endif
    };
    
    virtual bool isVisibleToHitTesting() const { return false; };

    WEBCORE_EXPORT IntRect visibleContentRect(VisibleContentRectBehavior = ContentsVisibleRect) const;
    WEBCORE_EXPORT IntRect visibleContentRectIncludingScrollbars(VisibleContentRectBehavior = ContentsVisibleRect) const;

    int visibleWidth() const { return visibleSize().width(); }
    int visibleHeight() const { return visibleSize().height(); }
    virtual IntSize visibleSize() const = 0;

    virtual IntSize contentsSize() const = 0;
    virtual IntSize overhangAmount() const { return IntSize(); }
    virtual IntPoint lastKnownMousePositionInView() const { return IntPoint(); }
    virtual bool isHandlingWheelEvent() const { return false; }

    virtual int headerHeight() const { return 0; }
    virtual int footerHeight() const { return 0; }

    // The totalContentsSize() is equivalent to the contentsSize() plus the header and footer heights.
    WEBCORE_EXPORT IntSize totalContentsSize() const;
    WEBCORE_EXPORT virtual IntSize reachableTotalContentsSize() const;

    virtual bool useDarkAppearance() const { return false; }

    virtual bool shouldSuspendScrollAnimations() const { return true; }
    WEBCORE_EXPORT virtual void scrollbarStyleChanged(ScrollbarStyle /*newStyle*/, bool /*forceUpdate*/);
    virtual void setVisibleScrollerThumbRect(const IntRect&) { }
    
    // Note that this only returns scrollable areas that can actually be scrolled.
    virtual ScrollableArea* enclosingScrollableArea() const = 0;

    virtual bool isScrollableOrRubberbandable() = 0;
    virtual bool hasScrollableOrRubberbandableAncestor() = 0;

    // Returns the bounding box of this scrollable area, in the coordinate system of the enclosing scroll view.
    virtual IntRect scrollableAreaBoundingBox(bool* = nullptr) const = 0;

    virtual bool isUserScrollInProgress() const { return false; }
    virtual bool isRubberBandInProgress() const { return false; }
    virtual bool isScrollSnapInProgress() const { return false; }

    virtual bool scrollAnimatorEnabled() const { return false; }

    virtual bool isInStableState() const { return true; }

    // NOTE: Only called from Internals for testing.
    WEBCORE_EXPORT void setScrollOffsetFromInternals(const ScrollOffset&);

    WEBCORE_EXPORT static LayoutPoint constrainScrollPositionForOverhang(const LayoutRect& visibleContentRect, const LayoutSize& totalContentsSize, const LayoutPoint& scrollPosition, const LayoutPoint& scrollOrigin, int headerHeight, int footetHeight);
    LayoutPoint constrainScrollPositionForOverhang(const LayoutPoint& scrollPosition);

    // Computes the double value for the scrollbar's current position and the current overhang amount.
    // This function is static so that it can be called from the main thread or the scrolling thread.
    WEBCORE_EXPORT static void computeScrollbarValueAndOverhang(float currentPosition, float totalSize, float visibleSize, float& scrollbarValue, float& overhangAmount);

    WEBCORE_EXPORT static std::optional<BoxSide> targetSideForScrollDelta(FloatSize, ScrollEventAxis);

    // "Pinned" means scrolled at or beyond the edge.
    WEBCORE_EXPORT bool isPinnedOnSide(BoxSide) const;
    WEBCORE_EXPORT RectEdges<bool> edgePinnedState() const;

    // True if scrolling happens by moving compositing layers.
    virtual bool usesCompositedScrolling() const { return false; }
    // True if the contents can be scrolled asynchronously (i.e. by a ScrollingCoordinator).
    virtual bool usesAsyncScrolling() const { return false; }

    virtual GraphicsLayer* layerForHorizontalScrollbar() const { return nullptr; }
    virtual GraphicsLayer* layerForVerticalScrollbar() const { return nullptr; }

    bool hasLayerForHorizontalScrollbar() const;
    bool hasLayerForVerticalScrollbar() const;

    void verticalScrollbarLayerDidChange();
    void horizontalScrollbarLayerDidChange();

    virtual bool mockScrollbarsControllerEnabled() const { return false; }
    virtual void logMockScrollbarsControllerMessage(const String&) const { };

    virtual bool shouldPlaceVerticalScrollbarOnLeft() const = 0;
    
    virtual bool isHorizontalWritingMode() const { return false; }

    virtual String debugDescription() const = 0;

    virtual float pageScaleFactor() const
    {
        return 1.0f;
    }

    virtual float deviceScaleFactor() const { return 1; }

    virtual void didStartScrollAnimation() { }
    
    bool horizontalOverscrollBehaviorPreventsPropagation() const { return horizontalOverscrollBehavior() != OverscrollBehavior::Auto; }
    bool verticalOverscrollBehaviorPreventsPropagation() const { return verticalOverscrollBehavior() != OverscrollBehavior::Auto; }
    bool overscrollBehaviorAllowsRubberBand() const { return horizontalOverscrollBehavior() != OverscrollBehavior::None || verticalOverscrollBehavior() != OverscrollBehavior::None; }
    bool shouldBlockScrollPropagation(const FloatSize&) const;
    FloatSize deltaForPropagation(const FloatSize&) const;
    WEBCORE_EXPORT virtual float adjustVerticalPageScrollStepForFixedContent(float step);
    virtual bool needsAnimatedScroll() const { return false; }
    virtual void updateScrollAnchoringElement() { }
    virtual void updateScrollPositionForScrollAnchoringController() { }
    virtual void invalidateScrollAnchoringElement() { }
    virtual std::optional<FrameIdentifier> rootFrameID() const { return std::nullopt; }

    WEBCORE_EXPORT void setScrollbarsController(std::unique_ptr<ScrollbarsController>&&);
    WEBCORE_EXPORT virtual void scrollbarWidthChanged(ScrollbarWidth) { }

    virtual IntSize totalScrollbarSpace() const { return { }; }
    virtual int insetForLeftScrollbarSpace() const { return 0; }

protected:
    WEBCORE_EXPORT ScrollableArea();
    WEBCORE_EXPORT virtual ~ScrollableArea();

    void setScrollOrigin(const IntPoint&);
    void resetScrollOriginChanged() { m_scrollOriginChanged = false; }

    virtual void invalidateScrollbarRect(Scrollbar&, const IntRect&) = 0;
    virtual void invalidateScrollCornerRect(const IntRect&) = 0;

    friend class ScrollingCoordinator;
    virtual GraphicsLayer* layerForScrollCorner() const { return nullptr; }
#if HAVE(RUBBER_BANDING)
    virtual GraphicsLayer* layerForOverhangAreas() const { return nullptr; }
#endif

    bool hasLayerForScrollCorner() const;

    WEBCORE_EXPORT LayoutRect getRectToExposeForScrollIntoView(const LayoutRect& visibleBounds, const LayoutRect& exposeRect, const ScrollAlignment& alignX, const ScrollAlignment& alignY, const std::optional<LayoutRect> = std::nullopt) const;

private:
    WEBCORE_EXPORT virtual IntRect visibleContentRectInternal(VisibleContentRectIncludesScrollbars, VisibleContentRectBehavior) const;
    void scrollPositionChanged(const ScrollPosition&);

    void internalCreateScrollbarsController();

    // NOTE: Only called from the ScrollAnimator.
    friend class ScrollAnimator;
    void setScrollPositionFromAnimation(const ScrollPosition&);

    // This function should be overridden by subclasses to perform the actual
    // scroll of the content.
    virtual void setScrollOffset(const ScrollOffset&) = 0;

    mutable std::unique_ptr<ScrollAnimator> m_scrollAnimator;
    std::unique_ptr<ScrollbarsController> m_scrollbarsController;

    // There are 8 possible combinations of writing mode and direction. Scroll origin will be non-zero in the x or y axis
    // if there is any reversed direction or writing-mode. The combinations are:
    // writing-mode / direction     scrollOrigin.x() set    scrollOrigin.y() set
    // horizontal-tb / ltr          NO                      NO
    // horizontal-tb / rtl          YES                     NO
    // horizontal-bt / ltr          NO                      YES
    // horizontal-bt / rtl          YES                     YES
    // vertical-lr / ltr            NO                      NO
    // vertical-lr / rtl            NO                      YES
    // vertical-rl / ltr            YES                     NO
    // vertical-rl / rtl            YES                     YES
    IntPoint m_scrollOrigin;

    ScrollClamping m_scrollClamping { ScrollClamping::Clamped };

    ScrollElasticity m_verticalScrollElasticity { ScrollElasticity::None };
    ScrollElasticity m_horizontalScrollElasticity { ScrollElasticity::None };

    ScrollbarOverlayStyle m_scrollbarOverlayStyle { ScrollbarOverlayStyle::ScrollbarOverlayStyleDefault };

    ScrollType m_currentScrollType { ScrollType::User };
    ScrollAnimationStatus m_scrollAnimationStatus { ScrollAnimationStatus::NotAnimating };

    bool m_inLiveResize { false };
    bool m_scrollOriginChanged { false };
    bool m_scrollShouldClearLatchedState { false };

    Markable<ScrollingNodeID> m_scrollingNodeIDForTesting;
};

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const ScrollableArea&);

} // namespace WebCore
