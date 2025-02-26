/*
 * Copyright (C) 2014-2015 Apple Inc. All rights reserved.
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

#include "pal/HysteresisActivity.h"
#if ENABLE(ASYNC_SCROLLING)

#include "ScrollingCoordinator.h"
#include "ScrollingStateNode.h"
#include "ScrollingTree.h"
#include "Timer.h"
#include <wtf/RefPtr.h>
#include <wtf/SmallMap.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class Page;
class Scrollbar;
class ScrollingStateNode;
class ScrollingStateScrollingNode;
class ScrollingStateTree;

// ScrollingCoordinator subclass that maintains a ScrollingStateTree and a ScrollingTree,
// allowing asynchronous scrolling (in another thread or process).
class AsyncScrollingCoordinator : public ScrollingCoordinator {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(AsyncScrollingCoordinator, WEBCORE_EXPORT);
public:
    static Ref<AsyncScrollingCoordinator> create(Page*);
    WEBCORE_EXPORT virtual ~AsyncScrollingCoordinator();

    ScrollingTree* scrollingTree() const { return m_scrollingTree.get(); }

    void scrollingStateTreePropertiesChanged();
    void scrollingThreadAddedPendingUpdate();

    void applyPendingScrollUpdates();

    WEBCORE_EXPORT void applyScrollUpdate(ScrollUpdate&&, ScrollType = ScrollType::User);

#if PLATFORM(COCOA)
    WEBCORE_EXPORT void handleWheelEventPhase(ScrollingNodeID, PlatformWheelEventPhase) final;
#endif

    WEBCORE_EXPORT void setActiveScrollSnapIndices(ScrollingNodeID, std::optional<unsigned> horizontalIndex, std::optional<unsigned> verticalIndex);
    WEBCORE_EXPORT void updateScrollSnapPropertiesWithFrameView(const LocalFrameView&) override;

    WEBCORE_EXPORT void updateIsMonitoringWheelEventsForFrameView(const LocalFrameView&) override;

    void reportExposedUnfilledArea(MonotonicTime, unsigned unfilledArea);
    void reportSynchronousScrollingReasonsChanged(MonotonicTime, OptionSet<SynchronousScrollingReason>);

    bool scrollAnimatorEnabled() const;

    virtual void hasNodeWithAnimatedScrollChanged(bool) { };
    
    WEBCORE_EXPORT void setScrollbarLayoutDirection(ScrollableArea&, UserInterfaceLayoutDirection) override;
    WEBCORE_EXPORT void setMouseIsOverContentArea(ScrollableArea&, bool) override;
    WEBCORE_EXPORT void setMouseMovedInContentArea(ScrollableArea&) override;
    WEBCORE_EXPORT void setLayerHostingContextIdentifierForFrameHostingNode(ScrollingNodeID, std::optional<LayerHostingContextIdentifier>) override;
    LocalFrameView* frameViewForScrollingNode(LocalFrame& localMainFrame, std::optional<ScrollingNodeID>) const;

    WEBCORE_EXPORT ScrollingStateTree& ensureScrollingStateTreeForRootFrameID(FrameIdentifier);
    const ScrollingStateTree* existingScrollingStateTreeForRootFrameID(std::optional<FrameIdentifier>) const;
    ScrollingStateTree* stateTreeForNodeID(std::optional<ScrollingNodeID>) const;
    std::unique_ptr<ScrollingStateTree> commitTreeStateForRootFrameID(FrameIdentifier, LayerRepresentation::Type);

    WEBCORE_EXPORT void scrollableAreaWillBeDetached(ScrollableArea&) override;

protected:
    WEBCORE_EXPORT AsyncScrollingCoordinator(Page*);

    void setScrollingTree(Ref<ScrollingTree>&& scrollingTree) { m_scrollingTree = WTFMove(scrollingTree); }
    const SmallMap<FrameIdentifier, UniqueRef<ScrollingStateTree>>& scrollingStateTrees() const { return m_scrollingStateTrees; }

    RefPtr<ScrollingTree> releaseScrollingTree() { return WTFMove(m_scrollingTree); }

    WEBCORE_EXPORT String scrollingStateTreeAsText(OptionSet<ScrollingStateTreeAsTextBehavior> = { }) const override;
    WEBCORE_EXPORT String scrollingTreeAsText(OptionSet<ScrollingStateTreeAsTextBehavior> = { }) const override;
    WEBCORE_EXPORT bool haveScrollingTree() const override;

    WEBCORE_EXPORT void willCommitTree(FrameIdentifier rootFrameID) override;
    void synchronizeStateFromScrollingTree();
    void scheduleRenderingUpdate();

    bool eventTrackingRegionsDirty() const { return m_eventTrackingRegionsDirty; }
    WEBCORE_EXPORT LocalFrameView* frameViewForScrollingNode(std::optional<ScrollingNodeID>) const;
    RefPtr<ScrollingStateNode> stateNodeForNodeID(std::optional<ScrollingNodeID>) const;
    RefPtr<ScrollingStateNode> stateNodeForScrollableArea(const ScrollableArea&) const;

private:
    bool isAsyncScrollingCoordinator() const override { return true; }

    bool hasVisibleSlowRepaintViewportConstrainedObjects(const LocalFrameView&) const override { return false; }

    WEBCORE_EXPORT std::optional<ScrollingNodeID> scrollableContainerNodeID(const RenderObject&) const override;

    WEBCORE_EXPORT void frameViewLayoutUpdated(LocalFrameView&) override;
    WEBCORE_EXPORT void frameViewRootLayerDidChange(LocalFrameView&) override;
    WEBCORE_EXPORT void frameViewVisualViewportChanged(LocalFrameView&) override;
    WEBCORE_EXPORT void frameViewEventTrackingRegionsChanged(LocalFrameView&) override;
    WEBCORE_EXPORT void frameViewWillBeDetached(LocalFrameView&) override;
    WEBCORE_EXPORT void rootFrameWasRemoved(FrameIdentifier rootFrameID) final;

    WEBCORE_EXPORT bool requestStartKeyboardScrollAnimation(ScrollableArea&, const KeyboardScroll&) final;
    WEBCORE_EXPORT bool requestStopKeyboardScrollAnimation(ScrollableArea&, bool) final;

    WEBCORE_EXPORT bool requestScrollToPosition(ScrollableArea&, const ScrollPosition&, const ScrollPositionChangeOptions& options) final;
    WEBCORE_EXPORT void stopAnimatedScroll(ScrollableArea&) final;

    WEBCORE_EXPORT void applyScrollingTreeLayerPositions() override;

    WEBCORE_EXPORT std::optional<ScrollingNodeID> createNode(FrameIdentifier rootFrameID, ScrollingNodeType, ScrollingNodeID newNodeID) override;
    WEBCORE_EXPORT std::optional<ScrollingNodeID> insertNode(FrameIdentifier rootFrameID, ScrollingNodeType, ScrollingNodeID newNodeID, std::optional<ScrollingNodeID> parentID, size_t childIndex) override;
    WEBCORE_EXPORT void unparentNode(ScrollingNodeID) override;
    WEBCORE_EXPORT void unparentChildrenAndDestroyNode(std::optional<ScrollingNodeID>) override;
    WEBCORE_EXPORT void detachAndDestroySubtree(ScrollingNodeID) override;
    WEBCORE_EXPORT void clearAllNodes(FrameIdentifier rootFrameID) override;

    WEBCORE_EXPORT std::optional<ScrollingNodeID> parentOfNode(ScrollingNodeID) const override;
    WEBCORE_EXPORT Vector<ScrollingNodeID> childrenOfNode(ScrollingNodeID) const override;

    WEBCORE_EXPORT void setNodeLayers(ScrollingNodeID, const NodeLayers&) override;

    WEBCORE_EXPORT void setScrollingNodeScrollableAreaGeometry(std::optional<ScrollingNodeID>, ScrollableArea&) override;
    WEBCORE_EXPORT void setFrameScrollingNodeState(ScrollingNodeID, const LocalFrameView&) override;
    WEBCORE_EXPORT void setViewportConstraintedNodeConstraints(ScrollingNodeID, const ViewportConstraints&) override;
    WEBCORE_EXPORT void setPositionedNodeConstraints(ScrollingNodeID, const AbsolutePositionConstraints&) override;
    WEBCORE_EXPORT void setRelatedOverflowScrollingNodes(ScrollingNodeID, Vector<ScrollingNodeID>&&) override;

    WEBCORE_EXPORT void reconcileScrollingState(LocalFrameView&, const FloatPoint&, const LayoutViewportOriginOrOverrideRect&, ScrollType, ViewportRectStability, ScrollingLayerPositionAction) override;
    void reconcileScrollPosition(LocalFrameView&, ScrollingLayerPositionAction);

    WEBCORE_EXPORT void scrollBySimulatingWheelEventForTesting(ScrollingNodeID, FloatSize) final;

    WEBCORE_EXPORT bool isUserScrollInProgress(std::optional<ScrollingNodeID>) const override;
    WEBCORE_EXPORT bool isRubberBandInProgress(std::optional<ScrollingNodeID>) const override;
    WEBCORE_EXPORT bool isScrollSnapInProgress(std::optional<ScrollingNodeID>) const override;

    WEBCORE_EXPORT void setScrollPinningBehavior(ScrollPinningBehavior) override;

    WEBCORE_EXPORT void reconcileViewportConstrainedLayerPositions(std::optional<ScrollingNodeID>, const LayoutRect& viewportRect, ScrollingLayerPositionAction) override;
    WEBCORE_EXPORT void scrollableAreaScrollbarLayerDidChange(ScrollableArea&, ScrollbarOrientation) override;

    WEBCORE_EXPORT void setSynchronousScrollingReasons(std::optional<ScrollingNodeID>, OptionSet<SynchronousScrollingReason>) final;
    WEBCORE_EXPORT OptionSet<SynchronousScrollingReason> synchronousScrollingReasons(std::optional<ScrollingNodeID>) const final;

    WEBCORE_EXPORT void windowScreenDidChange(PlatformDisplayID, std::optional<FramesPerSecond> nominalFramesPerSecond) final;

    WEBCORE_EXPORT bool hasSubscrollers(FrameIdentifier) const final;

    virtual void scheduleTreeStateCommit() = 0;

    void ensureRootStateNodeForFrameView(LocalFrameView&);

    void updateEventTrackingRegions(FrameIdentifier rootFrameID);
    
    void applyScrollPositionUpdate(ScrollUpdate&&, ScrollType);
    void updateScrollPositionAfterAsyncScroll(ScrollingNodeID, const FloatPoint&, std::optional<FloatPoint> layoutViewportOrigin, ScrollingLayerPositionAction, ScrollType);
    void animatedScrollWillStartForNode(ScrollingNodeID);
    void animatedScrollDidEndForNode(ScrollingNodeID);
    void wheelEventScrollWillStartForNode(ScrollingNodeID);
    void wheelEventScrollDidEndForNode(ScrollingNodeID);
    
    WEBCORE_EXPORT void setMouseIsOverScrollbar(Scrollbar*, bool isOverScrollbar) override;
    WEBCORE_EXPORT void setScrollbarEnabled(Scrollbar&) override;
    WEBCORE_EXPORT void setScrollbarWidth(ScrollableArea&, ScrollbarWidth) override;

    void hysterisisTimerFired(PAL::HysteresisState);

    SmallMap<FrameIdentifier, UniqueRef<ScrollingStateTree>> m_scrollingStateTrees;
    RefPtr<ScrollingTree> m_scrollingTree;

    bool m_eventTrackingRegionsDirty { false };

    PAL::HysteresisActivity m_hysterisisActivity;
};

#if ENABLE(SCROLLING_THREAD)
class LayerTreeHitTestLocker {
public:
    LayerTreeHitTestLocker(ScrollingCoordinator* scrollingCoordinator)
    {
        if (auto* asyncScrollingCoordinator = dynamicDowncast<AsyncScrollingCoordinator>(scrollingCoordinator)) {
            m_scrollingTree = asyncScrollingCoordinator->scrollingTree();
            if (m_scrollingTree)
                m_scrollingTree->lockLayersForHitTesting();
        }
    }
    
    ~LayerTreeHitTestLocker()
    {
        if (m_scrollingTree)
            m_scrollingTree->unlockLayersForHitTesting();
    }

private:
    RefPtr<ScrollingTree> m_scrollingTree;
};
#endif

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_SCROLLING_COORDINATOR(WebCore::AsyncScrollingCoordinator, isAsyncScrollingCoordinator());

#endif // ENABLE(ASYNC_SCROLLING)
