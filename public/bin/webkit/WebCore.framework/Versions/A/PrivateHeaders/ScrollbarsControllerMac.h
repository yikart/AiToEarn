/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#if PLATFORM(MAC)

#include "IntRect.h"
#include "ScrollbarsController.h"
#include "Timer.h"
#include <wtf/CheckedPtr.h>
#include <wtf/RetainPtr.h>
#include <wtf/TZoneMalloc.h>

OBJC_CLASS WebScrollerImpPairDelegate;
OBJC_CLASS WebScrollerImpDelegate;

typedef id ScrollerImpPair;

namespace WebCore {

class WheelEventTestMonitor;

class ScrollbarsControllerMac final : public ScrollbarsController, public CanMakeCheckedPtr<ScrollbarsControllerMac> {
    WTF_MAKE_TZONE_ALLOCATED(ScrollbarsControllerMac);
    WTF_MAKE_NONCOPYABLE(ScrollbarsControllerMac);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(ScrollbarsControllerMac);
public:
    explicit ScrollbarsControllerMac(ScrollableArea&);
    ~ScrollbarsControllerMac();

    bool isScrollbarsControllerMac() const final { return true; }

    void notifyContentAreaScrolled(const FloatSize& delta) final;

    void cancelAnimations() final;

    void didBeginScrollGesture() final;
    void didEndScrollGesture() final;
    void mayBeginScrollGesture() final;

    void contentAreaWillPaint() const final;
    void mouseEnteredContentArea() final;
    void mouseExitedContentArea() final;
    void mouseMovedInContentArea() final;
    void mouseEnteredScrollbar(Scrollbar*) const final;
    void mouseExitedScrollbar(Scrollbar*) const final;
    void mouseIsDownInScrollbar(Scrollbar*, bool) const final;
    void willStartLiveResize() final;
    void contentsSizeChanged() const final;
    void willEndLiveResize() final;
    void contentAreaDidShow() final;
    void contentAreaDidHide() final;

    void lockOverlayScrollbarStateToHidden(bool shouldLockState) final;
    bool scrollbarsCanBeActive() const final;

    void didAddVerticalScrollbar(Scrollbar*) final;
    void willRemoveVerticalScrollbar(Scrollbar*) final;
    void didAddHorizontalScrollbar(Scrollbar*) final;
    void willRemoveHorizontalScrollbar(Scrollbar*) final;

    void invalidateScrollbarPartLayers(Scrollbar*) final;

    void verticalScrollbarLayerDidChange() final;
    void horizontalScrollbarLayerDidChange() final;

    bool shouldScrollbarParticipateInHitTesting(Scrollbar*) final;

    String horizontalScrollbarStateForTesting() const final;
    String verticalScrollbarStateForTesting() const final;


    // Public to be callable from Obj-C.
    void updateScrollerStyle() final;
    bool scrollbarPaintTimerIsActive() const;
    void startScrollbarPaintTimer();
    void stopScrollbarPaintTimer();
    void setVisibleScrollerThumbRect(const IntRect&);

    void scrollbarWidthChanged(WebCore::ScrollbarWidth) final;
private:

    void updateScrollerImps();

    // sendContentAreaScrolledSoon() will do the same work that sendContentAreaScrolled() does except
    // it does it after a zero-delay timer fires. This will prevent us from updating overlay scrollbar
    // information during layout.
    void sendContentAreaScrolled(const FloatSize& scrollDelta);
    void sendContentAreaScrolledSoon(const FloatSize& scrollDelta);

    void initialScrollbarPaintTimerFired();
    void sendContentAreaScrolledTimerFired();

    WheelEventTestMonitor* wheelEventTestMonitor() const;

    Timer m_initialScrollbarPaintTimer;
    Timer m_sendContentAreaScrolledTimer;

    RetainPtr<ScrollerImpPair> m_scrollerImpPair;
    RetainPtr<WebScrollerImpPairDelegate> m_scrollerImpPairDelegate;
    RetainPtr<WebScrollerImpDelegate> m_horizontalScrollerImpDelegate;
    RetainPtr<WebScrollerImpDelegate> m_verticalScrollerImpDelegate;

    FloatSize m_contentAreaScrolledTimerScrollDelta;
    IntRect m_visibleScrollerThumbRect;

    bool m_needsScrollerStyleUpdate { false };
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::ScrollbarsControllerMac)
    static bool isType(const WebCore::ScrollbarsController& controller) { return controller.isScrollbarsControllerMac(); }
SPECIALIZE_TYPE_TRAITS_END()

#endif // PLATFORM(MAC)
