/*
 * Copyright (C) 2004, 2006, 2014-2015 Apple Inc.  All rights reserved.
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

#include "ScrollTypes.h"
#include "Timer.h"
#include "Widget.h"

namespace WebCore {

class GraphicsContext;
class IntRect;
class PlatformMouseEvent;
class ScrollableArea;
class ScrollbarTheme;

class Scrollbar : public Widget {
public:
    // Must be implemented by platforms that can't simply use the Scrollbar base class.  Right now the only platform that is not using the base class is GTK.
    WEBCORE_EXPORT static Ref<Scrollbar> createNativeScrollbar(ScrollableArea&, ScrollbarOrientation, ScrollbarWidth);

    virtual ~Scrollbar();

    // Called by the ScrollableArea when the scroll offset changes.
    void offsetDidChange();

    WEBCORE_EXPORT void setFrameRect(const IntRect&) final;

    static int pixelsPerLineStep() { return 40; }
    WEBCORE_EXPORT static int pixelsPerLineStep(int viewWidthOrHeight);
    WEBCORE_EXPORT static void setShouldUseFixedPixelsPerLineStepForTesting(bool);
    static float minFractionToStepWhenPaging() { return 0.8; }
    WEBCORE_EXPORT static int maxOverlapBetweenPages();
    static int pageStep(int viewWidthOrHeight, int contentWidthOrHeight) { return std::max(std::max<int>(lroundf(viewWidthOrHeight * Scrollbar::minFractionToStepWhenPaging()), lroundf(contentWidthOrHeight - Scrollbar::maxOverlapBetweenPages())), 1); }
    static int pageStep(int viewWidthOrHeight) { return pageStep(viewWidthOrHeight, viewWidthOrHeight); }
    static float pageStepDelta(int widthOrHeight) { return std::max(std::max(static_cast<float>(widthOrHeight) * Scrollbar::minFractionToStepWhenPaging(), static_cast<float>(widthOrHeight) - Scrollbar::maxOverlapBetweenPages()), 1.0f); }

    ScrollableArea& scrollableArea() const { return m_scrollableArea; }

    bool isCustomScrollbar() const { return m_isCustomScrollbar; }
    WEBCORE_EXPORT bool isMockScrollbar() const;

    ScrollbarOrientation orientation() const { return m_orientation; }

    int value() const { return lroundf(m_currentPos); }
    float currentPos() const { return m_currentPos; }
    int pressedPos() const { return m_pressedPos; }
    int visibleSize() const { return m_visibleSize; }
    int totalSize() const { return m_totalSize; }
    int maximum() const { return m_totalSize - m_visibleSize; }
    ScrollbarWidth widthStyle() const { return m_widthStyle; }

    int occupiedWidth() const;
    int occupiedHeight() const;

    int lineStep() const { return m_lineStep; }
    int pageStep() const { return m_pageStep; }
    float pixelStep() const { return m_pixelStep; }

    ScrollbarPart pressedPart() const { return m_pressedPart; }
    ScrollbarPart hoveredPart() const { return m_hoveredPart; }
    virtual void setHoveredPart(ScrollbarPart);
    virtual void setPressedPart(ScrollbarPart);

    WEBCORE_EXPORT void setSteps(int lineStep, int pageStep, int pixelsPerStep = 1);
    WEBCORE_EXPORT void setProportion(int visibleSize, int totalSize);
    void setPressedPos(int p) { m_pressedPos = p; }

    void paint(GraphicsContext&, const IntRect& damageRect, Widget::SecurityOriginPaintPolicy = SecurityOriginPaintPolicy::AnyOrigin, RegionContext* = nullptr) override;

    bool enabled() const { return m_enabled; }
    virtual void setEnabled(bool);

    virtual bool isOverlayScrollbar() const;
    bool shouldParticipateInHitTesting();
    virtual bool isHiddenByStyle() const;

    bool isWindowActive() const;

    // These methods are used for platform scrollbars to give :hover feedback.  They will not get called
    // when the mouse went down in a scrollbar, since it is assumed the scrollbar will start
    // grabbing all events in that case anyway.
#if !PLATFORM(IOS_FAMILY)
    WEBCORE_EXPORT bool mouseMoved(const PlatformMouseEvent&);
#endif
    WEBCORE_EXPORT void mouseEntered();
    WEBCORE_EXPORT bool mouseExited();

    // Used by some platform scrollbars to know when they've been released from capture.
    WEBCORE_EXPORT bool mouseUp(const PlatformMouseEvent&);

    WEBCORE_EXPORT bool mouseDown(const PlatformMouseEvent&);

    ScrollbarTheme& theme() const { return m_theme; }

    void invalidateRect(const IntRect&) override;

    bool suppressInvalidation() const { return m_suppressInvalidation; }
    void setSuppressInvalidation(bool s) { m_suppressInvalidation = s; }

    virtual void styleChanged() { }

    IntRect convertToContainingView(const IntRect&) const override;
    IntRect convertFromContainingView(const IntRect&) const override;

    IntPoint convertToContainingView(const IntPoint&) const override;
    IntPoint convertFromContainingView(const IntPoint&) const override;

    void moveThumb(int pos, bool draggingDocument = false);

#if !PLATFORM(COCOA)
    float opacity() const { return m_opacity; }
    void setOpacity(float opacity) { m_opacity = opacity; }
#endif

    bool supportsUpdateOnSecondaryThread() const;
    static NativeScrollbarVisibility nativeScrollbarVisibility(const Scrollbar*);

    float deviceScaleFactor() const;

    bool shouldRegisterScrollbar() const;
    int minimumThumbLength() const;
    void updateScrollbarThickness();

    virtual bool isMacScrollbar() const { return false; }

protected:
    Scrollbar(ScrollableArea&, ScrollbarOrientation, ScrollbarWidth, ScrollbarTheme* = nullptr, bool isCustomScrollbar = false);

    void updateThumb();
    virtual void updateThumbPosition();
    virtual void updateThumbProportion();

    void autoscrollTimerFired();
    void startTimerIfNeeded(Seconds delay);
    void stopTimerIfNeeded();
    void autoscrollPressedPart(Seconds delay);
    ScrollDirection pressedPartScrollDirection();
    ScrollGranularity pressedPartScrollGranularity();

    ScrollableArea& m_scrollableArea;
    ScrollbarOrientation m_orientation;
    ScrollbarWidth m_widthStyle;
    ScrollbarTheme& m_theme;

    int m_visibleSize { 0 };
    int m_totalSize { 0 };
    float m_currentPos { 0 };
    float m_dragOrigin { 0 };
    int m_lineStep { 0 };
    int m_pageStep { 0 };
    float m_pixelStep { 1 };

    ScrollbarPart m_hoveredPart { NoPart };
    ScrollbarPart m_pressedPart { NoPart };
    int m_pressedPos { 0 };
    bool m_draggingDocument { false };
    int m_documentDragPos { 0 };

    bool m_enabled { true };
    bool m_isCustomScrollbar { false };

    Timer m_scrollTimer;

    bool m_suppressInvalidation { false };

#if !PLATFORM(COCOA)
    float m_opacity { 1 };
#endif

private:
    bool isScrollbar() const override { return true; }
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_WIDGET(Scrollbar, isScrollbar())

#define SPECIALIZE_TYPE_TRAITS_SCROLLBAR_HOLDS_SCROLLER_IMP(ToValueTypeName, predicate) \
SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::ToValueTypeName) \
    static bool isType(const WebCore::Scrollbar& scrollbar) { return scrollbar.predicate; } \
SPECIALIZE_TYPE_TRAITS_END()
