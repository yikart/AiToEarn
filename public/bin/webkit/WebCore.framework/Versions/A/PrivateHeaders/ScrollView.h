/*
 * Copyright (C) 2004-2018 Apple Inc. All rights reserved.
 * Copyright (C) 2009 Holger Hans Peter Freyther
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

#include "FloatRect.h"
#include "IntRect.h"
#include "Scrollbar.h"
#include "ScrollableArea.h"
#include "ScrollTypes.h"
#include "Widget.h"
#include <wtf/HashSet.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/WeakPtr.h>

#if PLATFORM(IOS_FAMILY)

OBJC_CLASS WAKScrollView;
OBJC_CLASS WAKView;

#ifndef NSScrollView
#define NSScrollView WAKScrollView
#endif

#ifndef NSView
#define NSView WAKView
#endif

#endif // PLATFORM(IOS_FAMILY)

#if PLATFORM(COCOA) && defined __OBJC__
@class NSScrollView;
@protocol WebCoreFrameScrollView;
#endif

namespace WebCore {

class FloatQuad;
class HostWindow;
class LegacyTileCache;
class RegionContext;
class Scrollbar;

enum class DelegatedScrollingMode : uint8_t {
    NotDelegated,
    DelegatedToNativeScrollView,
    DelegatedToWebKit,
};

class ScrollView : public Widget, public ScrollableArea, public CanMakeCheckedPtr<ScrollView> {
    WTF_MAKE_TZONE_ALLOCATED(ScrollView);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(ScrollView);
public:
    virtual ~ScrollView();

    // CheckedPtr interface
    uint32_t checkedPtrCount() const final { return CanMakeCheckedPtr::checkedPtrCount(); }
    uint32_t checkedPtrCountWithoutThreadCheck() const final { return CanMakeCheckedPtr::checkedPtrCountWithoutThreadCheck(); }
    void incrementCheckedPtrCount() const final { CanMakeCheckedPtr::incrementCheckedPtrCount(); }
    void decrementCheckedPtrCount() const final { CanMakeCheckedPtr::decrementCheckedPtrCount(); }

    USING_CAN_MAKE_WEAKPTR(Widget);

    // ScrollableArea functions.
    WEBCORE_EXPORT void setScrollOffset(const ScrollOffset&) final;
    bool isScrollCornerVisible() const final;
    void scrollbarStyleChanged(ScrollbarStyle, bool forceUpdate) override;

    IntPoint locationOfContents() const;

    // NOTE: This should only be called by the overridden setScrollOffset from ScrollableArea.
    virtual void scrollTo(const ScrollPosition&);

    // The window thats hosts the ScrollView. The ScrollView will communicate scrolls and repaints to the
    // host window in the window's coordinate space.
    virtual HostWindow* hostWindow() const = 0;

    // Returns a clip rect in host window coordinates. Used to clip the blit on a scroll.
    virtual IntRect windowClipRect() const = 0;

    // Functions for child manipulation and inspection.
    const HashSet<Ref<Widget>>& children() const { return m_children; }
    WEBCORE_EXPORT virtual void addChild(Widget&);
    WEBCORE_EXPORT virtual void removeChild(Widget&);

    // If the scroll view does not use a native widget, then it will have cross-platform Scrollbars. These functions
    // can be used to obtain those scrollbars.
    Scrollbar* horizontalScrollbar() const final { return m_horizontalScrollbar.get(); }
    Scrollbar* verticalScrollbar() const final { return m_verticalScrollbar.get(); }
    bool isScrollViewScrollbar(const Widget* child) const { return horizontalScrollbar() == child || verticalScrollbar() == child; }

    void positionScrollbarLayers();

    // Functions for setting and retrieving the scrolling mode in each axis (horizontal/vertical). The mode has values of
    // AlwaysOff, AlwaysOn, and Auto. AlwaysOff means never show a scrollbar, AlwaysOn means always show a scrollbar.
    // Auto means show a scrollbar only when one is needed.
    // Note that for platforms with native widgets, these modes are considered advisory. In other words the underlying native
    // widget may choose not to honor the requested modes.
    WEBCORE_EXPORT void setScrollbarModes(ScrollbarMode horizontalMode, ScrollbarMode verticalMode, bool horizontalLock = false, bool verticalLock = false);
    void setHorizontalScrollbarMode(ScrollbarMode mode, bool lock = false) { setScrollbarModes(mode, verticalScrollbarMode(), lock, verticalScrollbarLock()); }
    void setVerticalScrollbarMode(ScrollbarMode mode, bool lock = false) { setScrollbarModes(horizontalScrollbarMode(), mode, horizontalScrollbarLock(), lock); }
    WEBCORE_EXPORT void scrollbarModes(ScrollbarMode& horizontalMode, ScrollbarMode& verticalMode) const;
    ScrollbarMode horizontalScrollbarMode() const final { ScrollbarMode horizontal, vertical; scrollbarModes(horizontal, vertical); return horizontal; }
    ScrollbarMode verticalScrollbarMode() const final { ScrollbarMode horizontal, vertical; scrollbarModes(horizontal, vertical); return vertical; }

    void setHorizontalScrollbarLock(bool lock = true) { m_horizontalScrollbarLock = lock; }
    bool horizontalScrollbarLock() const { return m_horizontalScrollbarLock; }
    void setVerticalScrollbarLock(bool lock = true) { m_verticalScrollbarLock = lock; }
    bool verticalScrollbarLock() const { return m_verticalScrollbarLock; }

    void setScrollingModesLock(bool lock = true) { m_horizontalScrollbarLock = m_verticalScrollbarLock = lock; }

    WEBCORE_EXPORT virtual void setCanHaveScrollbars(bool);

    void setScrollbarOverlayStyle(ScrollbarOverlayStyle) final;

    // By default you only receive paint events for the area that is visible. In the case of using a
    // tiled backing store, this function can be set, so that the view paints the entire contents.
    bool paintsEntireContents() const { return m_paintsEntireContents; }
    WEBCORE_EXPORT void setPaintsEntireContents(bool);

    // By default scrolling is handled by WebCore, but some WebKit implementations take over scrolling,
    // delegating it to a native scrolling widget or the UI process.
    DelegatedScrollingMode delegatedScrollingMode() const { return m_delegatedScrollingMode; }
    WEBCORE_EXPORT void setDelegatedScrollingMode(DelegatedScrollingMode);

    bool delegatesScrolling() const { return m_delegatedScrollingMode != DelegatedScrollingMode::NotDelegated; }
    bool delegatesScrollingToNativeView() const { return m_delegatedScrollingMode == DelegatedScrollingMode::DelegatedToNativeScrollView; }

    // Overridden by FrameView to create custom CSS scrollbars if applicable.
    virtual Ref<Scrollbar> createScrollbar(ScrollbarOrientation);

    virtual void styleAndRenderTreeDidChange();

    // If the prohibits scrolling flag is set, then all scrolling in the view (even programmatic scrolling) is turned off.
    void setProhibitsScrolling(bool b) { m_prohibitsScrolling = b; }
    bool prohibitsScrolling() const { return m_prohibitsScrolling; }

    class ProhibitScrollingWhenChangingContentSizeForScope {
        WTF_MAKE_TZONE_ALLOCATED(ProhibitScrollingWhenChangingContentSizeForScope);
    public:
        ProhibitScrollingWhenChangingContentSizeForScope(ScrollView&);
        ~ProhibitScrollingWhenChangingContentSizeForScope();

    private:
        SingleThreadWeakPtr<ScrollView> m_scrollView;
    };

    std::unique_ptr<ProhibitScrollingWhenChangingContentSizeForScope> prohibitScrollingWhenChangingContentSizeForScope();

    // Whether or not a scroll view will blit visible contents when it is scrolled. Blitting is disabled in situations
    // where it would cause rendering glitches (such as with fixed backgrounds or when the view is partially transparent).
    void setCanBlitOnScroll(bool);
    bool canBlitOnScroll() const;

    // There are at least three types of contentInset. Usually we just care about WebCoreContentInset, which is the inset
    // that is set on a Page that requires WebCore to move its layers to accomodate the inset. However, there are platform
    // concepts that are similar on both iOS and Mac when there is a platformWidget(). Sometimes we need the Mac platform value
    // for topContentInset, so when the TopContentInsetType is WebCoreOrPlatformContentInset, platformTopContentInset()
    // will be returned instead of the value set on Page.
    enum class TopContentInsetType { WebCoreContentInset, WebCoreOrPlatformContentInset };
    virtual float topContentInset(TopContentInsetType = TopContentInsetType::WebCoreContentInset) const { return 0; }
    IntRect frameRectShrunkByInset() const;

    // The visible content rect has a location that is the scrolled offset of the document. The width and height are the unobscured viewport
    // width and height. By default the scrollbars themselves are excluded from this rectangle, but an optional boolean argument allows them
    // to be included.
    IntSize visibleSize() const final { return visibleContentRect(LegacyIOSDocumentVisibleRect).size(); }

    // Parts of the document can be visible through transparent or blured UI widgets of the chrome. Those parts
    // contribute to painting but not to the scrollable area.
    // The unobscuredContentRect is the area that is not covered by UI elements.
    WEBCORE_EXPORT IntRect unobscuredContentRect(VisibleContentRectIncludesScrollbars = VisibleContentRectIncludesScrollbars::No) const;

#if PLATFORM(IOS_FAMILY)
    IntRect unobscuredContentRectIncludingScrollbars() const { return unobscuredContentRect(VisibleContentRectIncludesScrollbars::Yes); }
#else
    IntRect unobscuredContentRectIncludingScrollbars() const { return visibleContentRectIncludingScrollbars(); }
#endif

    // This is the area that is partially or fully exposed, and may extend under overlapping UI elements.
    WEBCORE_EXPORT FloatRect exposedContentRect() const;

    // The given rects are only used if there is no platform widget.
    WEBCORE_EXPORT void setExposedContentRect(const FloatRect&);

    WEBCORE_EXPORT FloatSize unobscuredContentSize() const;
    WEBCORE_EXPORT void setUnobscuredContentSize(const FloatSize&);

#if PLATFORM(IOS_FAMILY)
    void setActualScrollPosition(const IntPoint&);
    LegacyTileCache* legacyTileCache();
#endif

    // Size available for view contents, including content inset areas. Not affected by zooming.
    IntSize sizeForVisibleContent(VisibleContentRectIncludesScrollbars = VisibleContentRectIncludesScrollbars::No) const;
    // FIXME: remove this. It's only used for the incorrectly behaving ScrollView::unobscuredContentRectInternal().
    virtual float visibleContentScaleFactor() const { return 1; }

    // Functions for getting/setting the size webkit should use to layout the contents. By default this is the same as the visible
    // content size. Explicitly setting a layout size value will cause webkit to layout the contents using this size instead.
    WEBCORE_EXPORT IntSize layoutSize() const;
    int layoutWidth() const { return layoutSize().width(); }
    int layoutHeight() const { return layoutSize().height(); }

    WEBCORE_EXPORT IntSize fixedLayoutSize() const;
    WEBCORE_EXPORT void setFixedLayoutSize(const IntSize&);
    WEBCORE_EXPORT bool useFixedLayout() const;
    WEBCORE_EXPORT void setUseFixedLayout(bool enable);

    // Functions for getting/setting the size of the document contained inside the ScrollView (as an IntSize or as individual width and height
    // values).
    WEBCORE_EXPORT IntSize contentsSize() const final; // Always at least as big as the visibleWidth()/visibleHeight().
    int contentsWidth() const { return contentsSize().width(); }
    int contentsHeight() const { return contentsSize().height(); }
    virtual void setContentsSize(const IntSize&);

    // Functions for querying the current scrolled position (both as a point, a size, or as individual X and Y values).
    ScrollPosition scrollPosition() const final { return visibleContentRect(LegacyIOSDocumentVisibleRect).location(); }

    ScrollPosition maximumScrollPosition() const override; // The maximum position we can be scrolled to.

    // Adjust the passed in scroll position to keep it between the minimum and maximum positions.
    ScrollPosition adjustScrollPositionWithinRange(const ScrollPosition&) const;
    int scrollX() const { return scrollPosition().x(); }
    int scrollY() const { return scrollPosition().y(); }

    // Scroll position used by web-exposed features (has legacy iOS behavior).
    WEBCORE_EXPORT IntPoint contentsScrollPosition() const;
    void setContentsScrollPosition(const IntPoint&, const ScrollPositionChangeOptions& = ScrollPositionChangeOptions::createProgrammatic());

#if PLATFORM(IOS_FAMILY)
    int actualScrollX() const { return unobscuredContentRect().x(); }
    int actualScrollY() const { return unobscuredContentRect().y(); }
    // FIXME: maybe fix scrollPosition() on iOS to return the actual scroll position.
    IntPoint actualScrollPosition() const { return unobscuredContentRect().location(); }
#endif

    // scrollOffset() anchors its (0,0) point at the ScrollableArea's origin. When the Page has a
    // header, the header is positioned at (0,0), ABOVE the start of the Document. So when a page with
    // a header is pinned to the top, the scrollOffset() is (0,0), but the Document is actually at
    // (0, -headerHeight()). documentScrollPositionRelativeToScrollableAreaOrigin() will return this
    // version of the offset, which tracks the top of Document relative to where scrolling was achored.
    ScrollPosition documentScrollPositionRelativeToScrollableAreaOrigin() const;

    // scrollPostion() anchors its (0,0) point at the ScrollableArea's origin. The top of the scrolling
    // layer does not represent the top of the view when there is a topContentInset. Additionally, as
    // detailed above, the origin of the scrolling layer also does not necessarily correspond with the
    // top of the document anyway, since there could also be header. documentScrollPositionRelativeToViewOrigin()
    // will return a version of the current scroll offset which tracks the top of the Document
    // relative to the very top of the view.
    WEBCORE_EXPORT ScrollPosition documentScrollPositionRelativeToViewOrigin() const;

    IntSize overhangAmount() const final;

    void cacheCurrentScrollState();
    ScrollPosition cachedScrollPosition() const { return m_cachedScrollPosition; }
#if PLATFORM(IOS_FAMILY)
    IntRect cachedUnobscuredContentRect() const { return m_cachedUnobscuredContentRect; }
    FloatRect cachedExposedContentRect() const { return m_cachedExposedContentRect; }
#endif

    // Functions for scrolling the view.
    virtual void setScrollPosition(const ScrollPosition&, const ScrollPositionChangeOptions& = ScrollPositionChangeOptions::createProgrammatic());

    void scrollBy(const IntSize& s) { return setScrollPosition(scrollPosition() + s); }

    // This function scrolls by lines, pages or pixels.
    bool scroll(ScrollDirection, ScrollGranularity);
    
    // A logical scroll that just ends up calling the corresponding physical scroll() based off the document's writing mode.
    bool logicalScroll(ScrollLogicalDirection, ScrollGranularity);

    // Scroll the actual contents of the view (either blitting or invalidating as needed).
    void scrollContents(const IntSize& scrollDelta);

    // This gives us a means of blocking painting on our scrollbars until the first layout has occurred.
    WEBCORE_EXPORT void setScrollbarsSuppressed(bool suppressed, bool repaintOnUnsuppress = false);
    bool scrollbarsSuppressed() const { return m_scrollbarsSuppressed; }

    WEBCORE_EXPORT FloatPoint rootViewToContents(const FloatPoint&) const;
    WEBCORE_EXPORT IntPoint rootViewToContents(const IntPoint&) const;
    WEBCORE_EXPORT IntPoint contentsToRootView(const IntPoint&) const;
    WEBCORE_EXPORT FloatPoint contentsToRootView(const FloatPoint&) const;
    WEBCORE_EXPORT IntRect rootViewToContents(const IntRect&) const;
    WEBCORE_EXPORT IntRect contentsToRootView(const IntRect&) const;
    WEBCORE_EXPORT FloatRect rootViewToContents(const FloatRect&) const;
    WEBCORE_EXPORT FloatRect contentsToRootView(const FloatRect&) const;
    WEBCORE_EXPORT FloatQuad rootViewToContents(const FloatQuad&) const;
    WEBCORE_EXPORT FloatQuad contentsToRootView(const FloatQuad&) const;

    IntPoint viewToContents(const IntPoint&) const;
    IntPoint contentsToView(const IntPoint&) const;

    FloatPoint viewToContents(const FloatPoint&) const;
    FloatPoint contentsToView(const FloatPoint&) const;

    IntRect viewToContents(IntRect) const;
    IntRect contentsToView(IntRect) const;

    FloatRect viewToContents(FloatRect) const;
    FloatRect contentsToView(FloatRect) const;

    IntPoint contentsToContainingViewContents(const IntPoint&) const;
    IntRect contentsToContainingViewContents(IntRect) const;

    WEBCORE_EXPORT IntPoint rootViewToTotalContents(const IntPoint&) const;

    // Event coordinates are assumed to be in the coordinate space of a window that contains
    // the entire widget hierarchy. It is up to the platform to decide what the precise definition
    // of containing window is. (For example on Mac it is the containing NSWindow.)
    WEBCORE_EXPORT IntPoint windowToContents(const IntPoint&) const;
    WEBCORE_EXPORT IntPoint contentsToWindow(const IntPoint&) const;
    WEBCORE_EXPORT IntRect windowToContents(const IntRect&) const;
    WEBCORE_EXPORT IntRect contentsToWindow(const IntRect&) const;

    // Functions for converting to and from screen coordinates.
    WEBCORE_EXPORT IntRect contentsToScreen(const IntRect&) const;
    WEBCORE_EXPORT IntPoint screenToContents(const IntPoint&) const;

    // The purpose of this function is to answer whether or not the scroll view is currently visible. Animations and painting updates can be suspended if
    // we know that we are either not in a window right now or if that window is not visible.
    bool isOffscreen() const;

    // Called when our frame rect changes (or the rect/scroll position of an ancestor changes).
    void frameRectsChanged() final;
    
    // Widget override to update our scrollbars and notify our contents of the resize.
    void setFrameRect(const IntRect&) override;

    // Widget override to notify our contents of a cliprect change.
    void clipRectChanged() final;

    // For platforms that need to hit test scrollbars from within the engine's event handlers (like Win32).
    Scrollbar* scrollbarAtPoint(const IntPoint& windowPoint);

    IntPoint convertChildToSelf(const Widget*, IntPoint) const;
    FloatPoint convertChildToSelf(const Widget*, FloatPoint) const;
    IntPoint convertSelfToChild(const Widget*, IntPoint) const;

    // Widget override. Handles painting of the contents of the view as well as the scrollbars.
    WEBCORE_EXPORT void paint(GraphicsContext&, const IntRect&, Widget::SecurityOriginPaintPolicy = SecurityOriginPaintPolicy::AnyOrigin, RegionContext* = nullptr) final;
    void paintScrollbars(GraphicsContext&, const IntRect&);

    // Widget overrides to ensure that our children's visibility status is kept up to date when we get shown and hidden.
    WEBCORE_EXPORT void show() override;
    WEBCORE_EXPORT void hide() override;
    WEBCORE_EXPORT void setParentVisible(bool) final;
    
    // Pan scrolling.
    static const int noPanScrollRadius = 15;
    void addPanScrollIcon(const IntPoint&);
    void removePanScrollIcon();
    void paintPanScrollIcon(GraphicsContext&);

    bool isPointInScrollbarCorner(const IntPoint&);
    bool scrollbarCornerPresent() const;
    IntRect scrollCornerRect() const final;
    virtual void paintScrollCorner(GraphicsContext&, const IntRect& cornerRect);
    virtual void paintScrollbar(GraphicsContext&, Scrollbar&, const IntRect&);

    IntRect convertFromScrollbarToContainingView(const Scrollbar&, const IntRect&) const final;
    IntRect convertFromContainingViewToScrollbar(const Scrollbar&, const IntRect&) const final;
    IntPoint convertFromScrollbarToContainingView(const Scrollbar&, const IntPoint&) const final;
    IntPoint convertFromContainingViewToScrollbar(const Scrollbar&, const IntPoint&) const final;

    void calculateAndPaintOverhangAreas(GraphicsContext&, const IntRect& dirtyRect);

    WEBCORE_EXPORT void scrollOffsetChangedViaPlatformWidget(const ScrollOffset& oldOffset, const ScrollOffset& newOffset);

    void setAllowsUnclampedScrollPositionForTesting(bool allowsUnclampedScrollPosition) { m_allowsUnclampedScrollPosition = allowsUnclampedScrollPosition; }
    bool allowsUnclampedScrollPosition() const { return m_allowsUnclampedScrollPosition; }

    bool managesScrollbars() const;
    virtual void updateScrollbarSteps();

    // Called to update the scrollbars to accurately reflect the state of the view.
    void updateScrollbars(const ScrollPosition& desiredPosition);

protected:
    ScrollView();

    virtual void repaintContentRectangle(const IntRect&);
    virtual void paintContents(GraphicsContext&, const IntRect& damageRect, SecurityOriginPaintPolicy = SecurityOriginPaintPolicy::AnyOrigin, RegionContext* = nullptr) = 0;

    virtual void paintOverhangAreas(GraphicsContext&, const IntRect& horizontalOverhangArea, const IntRect& verticalOverhangArea, const IntRect& dirtyRect);

    void availableContentSizeChanged(AvailableSizeChangeReason) override;
    virtual void addedOrRemovedScrollbar() = 0;
    virtual void delegatedScrollingModeDidChange() = 0;

    // These functions are used to create/destroy scrollbars.
    // They return true if the scrollbar was added or removed.
    bool setHasHorizontalScrollbar(bool, bool* contentSizeAffected = nullptr);
    bool setHasVerticalScrollbar(bool, bool* contentSizeAffected = nullptr);

    virtual void updateScrollCorner() = 0;
    void invalidateScrollCornerRect(const IntRect&) final;

    // Scroll the content by blitting the pixels.
    virtual bool scrollContentsFastPath(const IntSize& scrollDelta, const IntRect& rectToScroll, const IntRect& clipRect) = 0;
    // Scroll the content by invalidating everything.
    virtual void scrollContentsSlowPath(const IntRect& updateRect);

    void setScrollOrigin(const IntPoint&, bool updatePositionAtAll, bool updatePositionSynchronously);

    // Subclassed by FrameView to check the writing-mode of the document.
    virtual bool isVerticalDocument() const = 0;
    virtual bool isFlippedDocument() const = 0;

    float platformTopContentInset() const;
    void platformSetTopContentInset(float);

    void handleDeferredScrollUpdateAfterContentSizeChange();

    virtual bool shouldDeferScrollUpdateAfterContentSizeChange() = 0;

    virtual void scrollOffsetChangedViaPlatformWidgetImpl(const ScrollOffset&, const ScrollOffset&) = 0;

    virtual void unobscuredContentSizeChanged() = 0;

    virtual void didFinishProhibitingScrollingWhenChangingContentSize() = 0;

#if PLATFORM(COCOA) && defined __OBJC__
public:
    WEBCORE_EXPORT NSView* documentView() const;

private:
    NSScrollView<WebCoreFrameScrollView>* scrollView() const;
#endif

private:
    // Size available for view contents, excluding content insets. Not affected by zooming.
    IntSize sizeForUnobscuredContent(VisibleContentRectIncludesScrollbars = VisibleContentRectIncludesScrollbars::No) const;

    IntRect visibleContentRectInternal(VisibleContentRectIncludesScrollbars, VisibleContentRectBehavior) const final;
    WEBCORE_EXPORT IntRect unobscuredContentRectInternal(VisibleContentRectIncludesScrollbars = VisibleContentRectIncludesScrollbars::No) const;

    void completeUpdatesAfterScrollTo(const IntSize& scrollDelta);

    bool setHasScrollbarInternal(RefPtr<Scrollbar>&, ScrollbarOrientation, bool hasBar, bool* contentSizeAffected);

    bool isScrollView() const final { return true; }
    String debugDescription() const override;

    void init();
    void destroy();

    IntRect rectToCopyOnScroll() const;

    // Called when the scroll position within this view changes. FrameView overrides this to generate repaint invalidations.
    virtual void updateLayerPositionsAfterScrolling() = 0;
    virtual void updateCompositingLayersAfterScrolling() = 0;

    void platformAddChild(Widget*);
    void platformRemoveChild(Widget*);
    void platformSetScrollbarModes();
    void platformScrollbarModes(ScrollbarMode& horizontal, ScrollbarMode& vertical) const;
    void platformSetCanBlitOnScroll(bool);
    bool platformCanBlitOnScroll() const;
    
    IntRect platformVisibleContentRect(bool includeScrollbars) const;
    IntSize platformVisibleContentSize(bool includeScrollbars) const;
    IntRect platformVisibleContentRectIncludingObscuredArea(bool includeScrollbars) const;
    IntSize platformVisibleContentSizeIncludingObscuredArea(bool includeScrollbars) const;

    IntRect platformUnobscuredContentRect(VisibleContentRectIncludesScrollbars) const;
    FloatRect platformExposedContentRect() const;

    void platformSetContentsSize();

    IntRect platformContentsToScreen(const IntRect&) const;
    IntPoint platformScreenToContents(const IntPoint&) const;

    void platformSetScrollPosition(const IntPoint&);
    bool platformScroll(ScrollDirection, ScrollGranularity);
    void platformSetScrollbarsSuppressed(bool repaintOnUnsuppress);
    void platformRepaintContentRectangle(const IntRect&);
    bool platformIsOffscreen() const;
    void platformSetScrollbarOverlayStyle(ScrollbarOverlayStyle);
    void platformSetScrollOrigin(const IntPoint&, bool updatePositionAtAll, bool updatePositionSynchronously);

    void calculateOverhangAreasForPainting(IntRect& horizontalOverhangRect, IntRect& verticalOverhangRect);
    void updateOverhangAreas();

    void incrementProhibitsScrollingWhenChangingContentSizeCount() { ++m_prohibitsScrollingWhenChangingContentSizeCount; }
    void decrementProhibitsScrollingWhenChangingContentSizeCount()
    {
        if (!m_prohibitsScrollingWhenChangingContentSizeCount) {
            ASSERT_NOT_REACHED();
            return;
        }

        if (!--m_prohibitsScrollingWhenChangingContentSizeCount)
            didFinishProhibitingScrollingWhenChangingContentSize();
    }

    HashSet<Ref<Widget>> m_children;

    RefPtr<Scrollbar> m_horizontalScrollbar;
    RefPtr<Scrollbar> m_verticalScrollbar;
    ScrollbarMode m_horizontalScrollbarMode { ScrollbarMode::Auto };
    ScrollbarMode m_verticalScrollbarMode { ScrollbarMode::Auto };


    // FIXME: More things will move into here.
    struct DelegatedScrollingGeometry {
        FloatSize unobscuredContentSize;
        FloatRect exposedContentRect;
    };
    std::optional<DelegatedScrollingGeometry> m_delegatedScrollingGeometry;

    ScrollPosition m_scrollPosition;
    IntPoint m_cachedScrollPosition;
#if PLATFORM(IOS_FAMILY)
    IntRect m_cachedUnobscuredContentRect;
    FloatRect m_cachedExposedContentRect;
#endif
    IntSize m_fixedLayoutSize;
    IntSize m_contentsSize;

    std::optional<IntSize> m_deferredScrollDelta; // Needed for WebKit scrolling
    std::optional<std::pair<ScrollOffset, ScrollOffset>> m_deferredScrollOffsets; // Needed for platform widget scrolling

    IntPoint m_panScrollIconPoint;

    unsigned m_updateScrollbarsPass { 0 };
    unsigned m_prohibitsScrollingWhenChangingContentSizeCount { 0 };

    DelegatedScrollingMode m_delegatedScrollingMode { DelegatedScrollingMode::NotDelegated };

    bool m_horizontalScrollbarLock { false };
    bool m_verticalScrollbarLock { false };

    bool m_prohibitsScrolling { false };
    bool m_allowsUnclampedScrollPosition { false };

    // This bool is unused on Mac OS because we directly ask the platform widget
    // whether it is safe to blit on scroll.
    bool m_canBlitOnScroll { true };

    bool m_scrollbarsSuppressed { false };
    bool m_inUpdateScrollbars { false };

    bool m_drawPanScrollIcon { false };
    bool m_useFixedLayout { false };

    bool m_paintsEntireContents { false };

}; // class ScrollView

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::ScrollView)
    static bool isType(const WebCore::Widget& widget) { return widget.isScrollView(); }
    static bool isType(const WebCore::ScrollableArea& area) { return area.isScrollView(); }
SPECIALIZE_TYPE_TRAITS_END()
