/*
 * Copyright (C) 2014-2017 Apple Inc. All rights reserved.
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

#if ENABLE(ASYNC_SCROLLING) && ENABLE(SCROLLING_THREAD)

#include "ScrollingStateScrollingNode.h"
#include "ScrollingStateTree.h"
#include "ScrollingTree.h"
#include <wtf/Condition.h>
#include <wtf/RefPtr.h>
#include <wtf/RunLoop.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class AsyncScrollingCoordinator;

// The ThreadedScrollingTree class lives almost exclusively on the scrolling thread and manages the
// hierarchy of scrollable regions on the page. It's also responsible for dispatching events
// to the correct scrolling tree nodes or dispatching events back to the ScrollingCoordinator
// object on the main thread if they can't be handled on the scrolling thread for various reasons.
class ThreadedScrollingTree : public ScrollingTree {
    WTF_MAKE_TZONE_ALLOCATED(ThreadedScrollingTree);
public:
    virtual ~ThreadedScrollingTree();

    WheelEventHandlingResult handleWheelEvent(const PlatformWheelEvent&, OptionSet<WheelEventProcessingSteps>) override;

    bool handleWheelEventAfterMainThread(const PlatformWheelEvent&, ScrollingNodeID, std::optional<WheelScrollGestureState>);
    void wheelEventWasProcessedByMainThread(const PlatformWheelEvent&, std::optional<WheelScrollGestureState>);

    WEBCORE_EXPORT void willSendEventToMainThread(const PlatformWheelEvent&);
    WEBCORE_EXPORT void waitForEventToBeProcessedByMainThread(const PlatformWheelEvent&);

    void invalidate() override;

    void displayDidRefresh(PlatformDisplayID) override;

    void didScheduleRenderingUpdate();
    void willStartRenderingUpdate();
    virtual void didCompleteRenderingUpdate();

    Lock& treeLock() WTF_RETURNS_LOCK(m_treeLock) { return m_treeLock; }

    bool scrollAnimatorEnabled() const { return m_scrollAnimatorEnabled; }
    void removePendingScrollAnimationForNode(ScrollingNodeID) WTF_REQUIRES_LOCK(m_treeLock) final;

protected:
    explicit ThreadedScrollingTree(AsyncScrollingCoordinator&);

    void scrollingTreeNodeDidScroll(ScrollingTreeScrollingNode&, ScrollingLayerPositionAction = ScrollingLayerPositionAction::Sync) override;
    void scrollingTreeNodeWillStartAnimatedScroll(ScrollingTreeScrollingNode&) override;
    void scrollingTreeNodeDidStopAnimatedScroll(ScrollingTreeScrollingNode&) override;
    void scrollingTreeNodeWillStartWheelEventScroll(ScrollingTreeScrollingNode&) override;
    void scrollingTreeNodeDidStopWheelEventScroll(ScrollingTreeScrollingNode&) override;
    bool scrollingTreeNodeRequestsScroll(ScrollingNodeID, const RequestedScrollData&) override WTF_REQUIRES_LOCK(m_treeLock);
    bool scrollingTreeNodeRequestsKeyboardScroll(ScrollingNodeID, const RequestedKeyboardScrollData&) override WTF_REQUIRES_LOCK(m_treeLock);

#if PLATFORM(MAC)
    void handleWheelEventPhase(ScrollingNodeID, PlatformWheelEventPhase) override;
#endif

    void setActiveScrollSnapIndices(ScrollingNodeID, std::optional<unsigned> horizontalIndex, std::optional<unsigned> verticalIndex) override;

#if PLATFORM(COCOA)
    void currentSnapPointIndicesDidChange(ScrollingNodeID, std::optional<unsigned> horizontal, std::optional<unsigned> vertical) override;
#endif

    void renderingUpdateComplete();

    void reportExposedUnfilledArea(MonotonicTime, unsigned unfilledArea) override;
    void reportSynchronousScrollingReasonsChanged(MonotonicTime, OptionSet<SynchronousScrollingReason>) override;

    RefPtr<AsyncScrollingCoordinator> m_scrollingCoordinator;
    mutable Lock m_layerHitTestMutex;

private:
    bool isThreadedScrollingTree() const override { return true; }
    void propagateSynchronousScrollingReasons(const HashSet<ScrollingNodeID>&) WTF_REQUIRES_LOCK(m_treeLock) override;

    void didCommitTree() final;
    void didCommitTreeOnScrollingThread() WTF_REQUIRES_LOCK(m_treeLock);

    void displayDidRefreshOnScrollingThread();
    void waitForRenderingUpdateCompletionOrTimeout() WTF_REQUIRES_LOCK(m_treeLock);

    bool canUpdateLayersOnScrollingThread() const WTF_REQUIRES_LOCK(m_treeLock);

    void scheduleDelayedRenderingUpdateDetectionTimer(Seconds) WTF_REQUIRES_LOCK(m_treeLock);
    void delayedRenderingUpdateDetectionTimerFired();

    void hasNodeWithAnimatedScrollChanged(bool) final;
    
    bool isScrollingSynchronizedWithMainThread() final WTF_REQUIRES_LOCK(m_treeLock);

    void receivedWheelEventWithPhases(PlatformWheelEventPhase, PlatformWheelEventPhase) final;
    void deferWheelEventTestCompletionForReason(ScrollingNodeID, WheelEventTestMonitor::DeferReason) final;
    void removeWheelEventTestCompletionDeferralForReason(ScrollingNodeID, WheelEventTestMonitor::DeferReason) final;

    void lockLayersForHitTesting() final WTF_ACQUIRES_LOCK(m_layerHitTestMutex);
    void unlockLayersForHitTesting() final WTF_RELEASES_LOCK(m_layerHitTestMutex);

    void scrollingTreeNodeScrollUpdated(ScrollingTreeScrollingNode&, const ScrollUpdateType&);

    enum class SynchronizationState : uint8_t {
        Idle,
        WaitingForRenderingUpdate,
        InRenderingUpdate,
        Desynchronized,
    };

    SynchronizationState m_state WTF_GUARDED_BY_LOCK(m_treeLock) { SynchronizationState::Idle };
    Condition m_stateCondition;

    bool m_receivedBeganEventFromMainThread WTF_GUARDED_BY_LOCK(m_treeLock) { false };
    Condition m_waitingForBeganEventCondition;
    
    MonotonicTime m_lastDisplayDidRefreshTime;

    // Dynamically allocated because it has to use the ScrollingThread's runloop.
    std::unique_ptr<RunLoop::Timer> m_delayedRenderingUpdateDetectionTimer WTF_GUARDED_BY_LOCK(m_treeLock);

    UncheckedKeyHashMap<ScrollingNodeID, RequestedScrollData> m_nodesWithPendingScrollAnimations WTF_GUARDED_BY_LOCK(m_treeLock);
    UncheckedKeyHashMap<ScrollingNodeID, RequestedKeyboardScrollData> m_nodesWithPendingKeyboardScrollAnimations WTF_GUARDED_BY_LOCK(m_treeLock);
    const bool m_scrollAnimatorEnabled { false };
    bool m_hasNodesWithSynchronousScrollingReasons WTF_GUARDED_BY_LOCK(m_treeLock) { false };
    std::atomic<bool> m_renderingUpdateWasScheduled;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_SCROLLING_TREE(WebCore::ThreadedScrollingTree, isThreadedScrollingTree())

#endif // ENABLE(ASYNC_SCROLLING) && ENABLE(SCROLLING_THREAD)
