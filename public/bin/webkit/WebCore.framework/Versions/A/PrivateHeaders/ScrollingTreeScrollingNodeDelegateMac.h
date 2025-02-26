/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

#if ENABLE(ASYNC_SCROLLING) && PLATFORM(MAC)

#include "ScrollerPairMac.h"
#include "ScrollingEffectsController.h"
#include "ThreadedScrollingTreeScrollingNodeDelegate.h"
#include <wtf/RunLoop.h>
#include <wtf/TZoneMalloc.h>

OBJC_CLASS NSScrollerImp;

namespace WebCore {

class FloatPoint;
class FloatSize;
class IntPoint;
class ScrollingStateScrollingNode;
class ScrollingTreeScrollingNode;
class ScrollingTree;

class ScrollingTreeScrollingNodeDelegateMac final : public ThreadedScrollingTreeScrollingNodeDelegate {
    WTF_MAKE_TZONE_ALLOCATED(ScrollingTreeScrollingNodeDelegateMac);
public:
    explicit ScrollingTreeScrollingNodeDelegateMac(ScrollingTreeScrollingNode&);
    virtual ~ScrollingTreeScrollingNodeDelegateMac();

    void nodeWillBeDestroyed();

    bool handleWheelEvent(const PlatformWheelEvent&);

    void willDoProgrammaticScroll(const FloatPoint&);
    void currentScrollPositionChanged();

    bool isRubberBandInProgress() const;

    void updateScrollbarPainters();
    void updateScrollbarLayers() final;
    
    void handleWheelEventPhase(const PlatformWheelEventPhase) final;
    void viewWillStartLiveResize() final;
    void viewWillEndLiveResize() final;
    void viewSizeDidChange() final;
    void initScrollbars() final;
    String scrollbarStateForOrientation(ScrollbarOrientation) const final;

private:
    void updateFromStateNode(const ScrollingStateScrollingNode&) final;

    // ScrollingEffectsControllerClient.
    bool allowsHorizontalStretching(const PlatformWheelEvent&) const final;
    bool allowsVerticalStretching(const PlatformWheelEvent&) const final;
    IntSize stretchAmount() const final;
    bool isPinnedOnSide(BoxSide) const final;
    RectEdges<bool> edgePinnedState() const final;

    bool shouldRubberBandOnSide(BoxSide) const final;
    void didStopRubberBandAnimation() final;
    void rubberBandingStateChanged(bool) final;
    bool scrollPositionIsNotRubberbandingEdge(const FloatPoint&) const;

    Ref<ScrollerPairMac> m_scrollerPair;

    bool m_inMomentumPhase { false };
};

} // namespace WebCore

#endif // PLATFORM(MAC) && ENABLE(ASYNC_SCROLLING)
