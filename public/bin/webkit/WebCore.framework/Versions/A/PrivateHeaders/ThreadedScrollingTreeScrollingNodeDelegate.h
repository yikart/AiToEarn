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

#include "ScrollingTreeScrollingNodeDelegate.h"

#if ENABLE(ASYNC_SCROLLING) && ENABLE(SCROLLING_THREAD)

#include "ScrollingEffectsController.h"
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class FloatPoint;
class FloatSize;
class IntPoint;
class ScrollingStateScrollingNode;
class ScrollingTreeScrollingNode;
class ScrollingTree;

class ThreadedScrollingTreeScrollingNodeDelegate : public ScrollingTreeScrollingNodeDelegate, private ScrollingEffectsControllerClient {
    WTF_MAKE_TZONE_ALLOCATED(ThreadedScrollingTreeScrollingNodeDelegate);
public:
    void updateSnapScrollState();

protected:
    explicit ThreadedScrollingTreeScrollingNodeDelegate(ScrollingTreeScrollingNode&);
    virtual ~ThreadedScrollingTreeScrollingNodeDelegate();

    void updateUserScrollInProgressForEvent(const PlatformWheelEvent&);

    void updateFromStateNode(const ScrollingStateScrollingNode&) override;

    bool startAnimatedScrollToPosition(FloatPoint) override;
    void stopAnimatedScroll() override;
    void serviceScrollAnimation(MonotonicTime) override;

    // ScrollingEffectsControllerClient.
    std::unique_ptr<ScrollingEffectsControllerTimer> createTimer(Function<void()>&&) override;
    void startAnimationCallback(ScrollingEffectsController&) override;
    void stopAnimationCallback(ScrollingEffectsController&) override;

    bool allowsHorizontalScrolling() const override;
    bool allowsVerticalScrolling() const override;

    void immediateScrollBy(const FloatSize&, ScrollClamping = ScrollClamping::Clamped) override;
    void adjustScrollPositionToBoundsIfNecessary() override;

    bool scrollPositionIsNotRubberbandingEdge(const FloatPoint&) const;

    FloatPoint scrollOffset() const override;
    float pageScaleFactor() const override;

    void willStartAnimatedScroll() override;
    void didStopAnimatedScroll() override;
    void willStartWheelEventScroll() override;
    void didStopWheelEventScroll() override;
    void willStartScrollSnapAnimation() override;
    void didStopScrollSnapAnimation() override;

    ScrollExtents scrollExtents() const override;

    void deferWheelEventTestCompletionForReason(ScrollingNodeID, WheelEventTestMonitor::DeferReason) const override;
    void removeWheelEventTestCompletionDeferralForReason(ScrollingNodeID, WheelEventTestMonitor::DeferReason) const override;

    ScrollingNodeID scrollingNodeIDForTesting() const final;

    FloatPoint adjustedScrollPosition(const FloatPoint&) const override;

    void handleKeyboardScrollRequest(const RequestedKeyboardScrollData&) override;

    ScrollingEffectsController m_scrollController;
};

} // namespace WebCore

#endif // ENABLE(ASYNC_SCROLLING) && ENABLE(SCROLLING_THREAD)
