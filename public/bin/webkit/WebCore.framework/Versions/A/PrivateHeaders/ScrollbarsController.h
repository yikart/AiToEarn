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

#include "FloatPoint.h"
#include "FloatSize.h"
#include "UserInterfaceLayoutDirection.h"
#include <wtf/TZoneMalloc.h>
#include <wtf/WeakHashSet.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class Scrollbar;
class ScrollableArea;
enum class ScrollbarOrientation : uint8_t;
enum class ScrollbarWidth : uint8_t;

class ScrollbarsController {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(ScrollbarsController, WEBCORE_EXPORT);
    WTF_MAKE_NONCOPYABLE(ScrollbarsController);
public:
    WEBCORE_EXPORT static std::unique_ptr<ScrollbarsController> create(ScrollableArea&);

    WEBCORE_EXPORT explicit ScrollbarsController(ScrollableArea&);
    virtual ~ScrollbarsController() = default;
    
    ScrollableArea& scrollableArea() const { return m_scrollableArea; }

    bool scrollbarAnimationsUnsuspendedByUserInteraction() const { return m_scrollbarAnimationsUnsuspendedByUserInteraction; }
    void setScrollbarAnimationsUnsuspendedByUserInteraction(bool unsuspended) { m_scrollbarAnimationsUnsuspendedByUserInteraction = unsuspended; }
    
    WEBCORE_EXPORT virtual bool isRemoteScrollbarsController() const { return false; }
    WEBCORE_EXPORT virtual bool isScrollbarsControllerMac() const { return false; }
    WEBCORE_EXPORT virtual bool isScrollbarsControllerMock() const { return false; }

    bool shouldSuspendScrollbarAnimations() const;

    virtual void notifyContentAreaScrolled(const FloatSize&) { }

    WEBCORE_EXPORT virtual void cancelAnimations();

    WEBCORE_EXPORT virtual void didBeginScrollGesture();
    WEBCORE_EXPORT virtual void didEndScrollGesture();
    WEBCORE_EXPORT virtual void mayBeginScrollGesture();

    WEBCORE_EXPORT virtual void contentAreaWillPaint() const { }
    WEBCORE_EXPORT virtual void mouseEnteredContentArea() { }
    WEBCORE_EXPORT virtual void mouseExitedContentArea() { }
    WEBCORE_EXPORT virtual void mouseMovedInContentArea() { }
    WEBCORE_EXPORT virtual void mouseEnteredScrollbar(Scrollbar*) const { }
    WEBCORE_EXPORT virtual void mouseExitedScrollbar(Scrollbar*) const { }
    WEBCORE_EXPORT virtual void mouseIsDownInScrollbar(Scrollbar*, bool) const { }
    WEBCORE_EXPORT virtual void willStartLiveResize() { }
    WEBCORE_EXPORT virtual void contentsSizeChanged() const { }
    WEBCORE_EXPORT virtual void willEndLiveResize() { }
    WEBCORE_EXPORT virtual void contentAreaDidShow() { }
    WEBCORE_EXPORT virtual void contentAreaDidHide() { }

    WEBCORE_EXPORT virtual void lockOverlayScrollbarStateToHidden(bool) { }
    WEBCORE_EXPORT virtual bool scrollbarsCanBeActive() const { return true; }

    WEBCORE_EXPORT virtual void didAddVerticalScrollbar(Scrollbar*) { }
    WEBCORE_EXPORT virtual void willRemoveVerticalScrollbar(Scrollbar*) { }
    WEBCORE_EXPORT virtual void didAddHorizontalScrollbar(Scrollbar*) { }
    WEBCORE_EXPORT virtual void willRemoveHorizontalScrollbar(Scrollbar*) { }

    WEBCORE_EXPORT virtual void invalidateScrollbarPartLayers(Scrollbar*) { }

    WEBCORE_EXPORT virtual void verticalScrollbarLayerDidChange() { }
    WEBCORE_EXPORT virtual void horizontalScrollbarLayerDidChange() { }

    WEBCORE_EXPORT virtual bool shouldScrollbarParticipateInHitTesting(Scrollbar*) { return true; }

    WEBCORE_EXPORT virtual String horizontalScrollbarStateForTesting() const { return emptyString(); }
    WEBCORE_EXPORT virtual String verticalScrollbarStateForTesting() const { return emptyString(); }

    WEBCORE_EXPORT virtual void setScrollbarVisibilityState(ScrollbarOrientation, bool) { }

    WEBCORE_EXPORT virtual bool shouldDrawIntoScrollbarLayer(Scrollbar&) const { return true; }
    WEBCORE_EXPORT virtual bool shouldRegisterScrollbars() const { return true; }
    WEBCORE_EXPORT virtual void updateScrollbarEnabledState(Scrollbar&) { }

    WEBCORE_EXPORT virtual void setScrollbarMinimumThumbLength(WebCore::ScrollbarOrientation, int) { }
    WEBCORE_EXPORT virtual int minimumThumbLength(WebCore::ScrollbarOrientation) { return 0; }
    WEBCORE_EXPORT virtual void scrollbarLayoutDirectionChanged(UserInterfaceLayoutDirection) { }

    WEBCORE_EXPORT virtual void updateScrollerStyle() { }

    WEBCORE_EXPORT void updateScrollbarsThickness();

    WEBCORE_EXPORT virtual void updateScrollbarStyle() { }

    WEBCORE_EXPORT virtual void scrollbarWidthChanged(WebCore::ScrollbarWidth) { }

private:
    ScrollableArea& m_scrollableArea;
    bool m_scrollbarAnimationsUnsuspendedByUserInteraction { true };
};

} // namespace WebCore
