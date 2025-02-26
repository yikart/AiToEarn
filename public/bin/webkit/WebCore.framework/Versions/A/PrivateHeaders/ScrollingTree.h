/*
 * Copyright (C) 2012-2015 Apple Inc. All rights reserved.
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

#if ENABLE(ASYNC_SCROLLING)

#include "EventTrackingRegions.h"
#include "FrameIdentifier.h"
#include "LayerHostingContextIdentifier.h"
#include "PageIdentifier.h"
#include "PlatformWheelEvent.h"
#include "RectEdges.h"
#include "Region.h"
#include "ScrollTypes.h"
#include "ScrollingCoordinatorTypes.h"
#include "ScrollingTreeGestureState.h"
#include "ScrollingTreeLatchingController.h"
#include "WheelEventTestMonitor.h"
#include <wtf/HashMap.h>
#include <wtf/Lock.h>
#include <wtf/MonotonicTime.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/ThreadSafeRefCounted.h>
#include <wtf/TypeCasts.h>

namespace WebCore {

class IntPoint;
class ScrollingStateTree;
class ScrollingStateNode;
class ScrollingTreeFrameScrollingNode;
class ScrollingTreeNode;
class ScrollingTreeOverflowScrollProxyNode;
class ScrollingTreePositionedNode;
class ScrollingTreeScrollingNode;
class ScrollingTreeFrameHostingNode;
enum class EventListenerRegionType : uint8_t;

using FramesPerSecond = unsigned;
using PlatformDisplayID = uint32_t;

enum class EventTargeting : uint8_t { NodeOnly, Propagate };

class ScrollingTree : public ThreadSafeRefCountedAndCanMakeThreadSafeWeakPtr<ScrollingTree> {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(ScrollingTree, WEBCORE_EXPORT);
    friend class ScrollingTreeLatchingController;
public:
    WEBCORE_EXPORT ScrollingTree();
    WEBCORE_EXPORT virtual ~ScrollingTree();

    virtual bool isThreadedScrollingTree() const { return false; }
    virtual bool isScrollingTreeMac() const { return false; }
    virtual bool isRemoteScrollingTree() const { return false; }
    virtual bool isScrollingTreeIOS() const { return false; }
    virtual bool isScrollingTreeCoordinated() const { return false; }

    // This implies that we'll do hit-testing in the scrolling tree.
    bool asyncFrameOrOverflowScrollingEnabled() const { return m_asyncFrameOrOverflowScrollingEnabled; }
    void setAsyncFrameOrOverflowScrollingEnabled(bool value) { m_asyncFrameOrOverflowScrollingEnabled = value; }

    bool wheelEventGesturesBecomeNonBlocking() const { return m_wheelEventGesturesBecomeNonBlocking; }
    void setWheelEventGesturesBecomeNonBlocking(bool value) { m_wheelEventGesturesBecomeNonBlocking = value; }

    bool scrollingPerformanceTestingEnabled() const { return m_scrollingPerformanceTestingEnabled; }
    void setScrollingPerformanceTestingEnabled(bool value) { m_scrollingPerformanceTestingEnabled = value; }

    WEBCORE_EXPORT bool isUserScrollInProgressAtEventLocation(const PlatformWheelEvent&);
    WEBCORE_EXPORT OptionSet<WheelEventProcessingSteps> determineWheelEventProcessing(const PlatformWheelEvent&);
    WEBCORE_EXPORT virtual WheelEventHandlingResult handleWheelEvent(const PlatformWheelEvent&, OptionSet<WheelEventProcessingSteps> = { });

    bool isRubberBandInProgressForNode(std::optional<ScrollingNodeID>);
    WEBCORE_EXPORT virtual void setRubberBandingInProgressForNode(ScrollingNodeID, bool);

    bool isUserScrollInProgressForNode(std::optional<ScrollingNodeID>);
    void setUserScrollInProgressForNode(ScrollingNodeID, bool);
    WEBCORE_EXPORT virtual void clearNodesWithUserScrollInProgress();

    bool isScrollSnapInProgressForNode(std::optional<ScrollingNodeID>);
    void setNodeScrollSnapInProgress(ScrollingNodeID, bool);

    bool isScrollAnimationInProgressForNode(std::optional<ScrollingNodeID>);
    void setScrollAnimationInProgressForNode(std::optional<ScrollingNodeID>, bool);

    WEBCORE_EXPORT bool hasNodeWithActiveScrollAnimations();

    virtual void invalidate() { }
    WEBCORE_EXPORT bool commitTreeState(std::unique_ptr<ScrollingStateTree>&&, std::optional<LayerHostingContextIdentifier> = std::nullopt);
    bool commitTreeStateInternal(std::unique_ptr<ScrollingStateTree>&&, std::optional<LayerHostingContextIdentifier>) WTF_REQUIRES_LOCK(m_treeLock);

    WEBCORE_EXPORT virtual void applyLayerPositions();
    WEBCORE_EXPORT void applyLayerPositionsAfterCommit();

    virtual Ref<ScrollingTreeNode> createScrollingTreeNode(ScrollingNodeType, ScrollingNodeID) = 0;
    
    WEBCORE_EXPORT ScrollingTreeNode* nodeForID(std::optional<ScrollingNodeID>) const;

    using VisitorFunction = Function<void(ScrollingNodeID, ScrollingNodeType, std::optional<FloatPoint> scrollPosition, std::optional<FloatPoint> layoutViewportOrigin, bool scrolledSinceLastCommit)>;
    void traverseScrollingTree(VisitorFunction&&);

    // Called after a scrolling tree node has handled a scroll and updated its layers.
    // Updates FrameView/RenderLayer scrolling state and GraphicsLayers.
    WEBCORE_EXPORT virtual void scrollingTreeNodeDidScroll(ScrollingTreeScrollingNode&, ScrollingLayerPositionAction = ScrollingLayerPositionAction::Sync);
    virtual void scrollingTreeNodeWillStartAnimatedScroll(ScrollingTreeScrollingNode&) { }
    virtual void scrollingTreeNodeDidStopAnimatedScroll(ScrollingTreeScrollingNode&) { }
    virtual void scrollingTreeNodeWillStartWheelEventScroll(ScrollingTreeScrollingNode&) { }
    virtual void scrollingTreeNodeDidStopWheelEventScroll(ScrollingTreeScrollingNode&) { }

    // Called for requested scroll position updates. Returns true if handled.
    virtual bool scrollingTreeNodeRequestsScroll(ScrollingNodeID, const RequestedScrollData&) { return false; }
    virtual bool scrollingTreeNodeRequestsKeyboardScroll(ScrollingNodeID, const RequestedKeyboardScrollData&) { return false; }

    // Delegated scrolling/zooming has caused the viewport to change, so update viewport-constrained layers
    WEBCORE_EXPORT void mainFrameViewportChangedViaDelegatedScrolling(const FloatPoint& scrollPosition, const WebCore::FloatRect& layoutViewport, double scale);

    void setNeedsApplyLayerPositionsAfterCommit() { m_needsApplyLayerPositionsAfterCommit = true; }

    void notifyRelatedNodesAfterScrollPositionChange(ScrollingTreeScrollingNode& changedNode);

    virtual void reportSynchronousScrollingReasonsChanged(MonotonicTime, OptionSet<SynchronousScrollingReason>) { }
    virtual void reportExposedUnfilledArea(MonotonicTime, unsigned /* unfilledArea */) { }

#if PLATFORM(IOS_FAMILY)
    virtual void scrollingTreeNodeWillStartPanGesture(ScrollingNodeID) { }
#endif
    virtual void scrollingTreeNodeWillStartScroll(ScrollingNodeID) { }
    virtual void scrollingTreeNodeDidEndScroll(ScrollingNodeID) { }

    virtual void scrollingTreeNodeDidBeginScrollSnapping(ScrollingNodeID) { }
    virtual void scrollingTreeNodeDidEndScrollSnapping(ScrollingNodeID) { }

    WEBCORE_EXPORT TrackingType eventTrackingTypeForPoint(EventTrackingRegions::EventType, IntPoint);

    virtual void receivedWheelEventWithPhases(PlatformWheelEventPhase /* phase */, PlatformWheelEventPhase /* momentumPhase */) { }
    virtual void deferWheelEventTestCompletionForReason(ScrollingNodeID, WheelEventTestMonitor::DeferReason) { }
    virtual void removeWheelEventTestCompletionDeferralForReason(ScrollingNodeID, WheelEventTestMonitor::DeferReason) { }

#if PLATFORM(MAC)
    virtual void handleWheelEventPhase(ScrollingNodeID, PlatformWheelEventPhase) = 0;
#else
    void handleWheelEventPhase(ScrollingNodeID, PlatformWheelEventPhase) { }
#endif

    virtual void setActiveScrollSnapIndices(ScrollingNodeID, std::optional<unsigned> /*horizontalIndex*/, std::optional<unsigned> /*verticalIndex*/) { }

#if PLATFORM(COCOA)
    WEBCORE_EXPORT virtual void currentSnapPointIndicesDidChange(ScrollingNodeID, std::optional<unsigned> horizontal, std::optional<unsigned> vertical) = 0;
#endif

    void setMainFramePinnedState(RectEdges<bool>);

    // Can be called from any thread. Will update what edges allow rubber-banding.
    WEBCORE_EXPORT void setClientAllowedMainFrameRubberBandableEdges(RectEdges<bool>);
    bool clientAllowsMainFrameRubberBandingOnSide(BoxSide);

    bool isHandlingProgrammaticScroll() const { return m_isHandlingProgrammaticScroll; }
    void setIsHandlingProgrammaticScroll(bool isHandlingProgrammaticScroll) { m_isHandlingProgrammaticScroll = isHandlingProgrammaticScroll; }
    
    void setScrollPinningBehavior(ScrollPinningBehavior);
    WEBCORE_EXPORT ScrollPinningBehavior scrollPinningBehavior();

    WEBCORE_EXPORT bool willWheelEventStartSwipeGesture(const PlatformWheelEvent&);

    ScrollingTreeFrameScrollingNode* rootNode() const { return m_rootNode.get(); }
    std::optional<ScrollingNodeID> latchedNodeID() const;
    WEBCORE_EXPORT void clearLatchedNode();

    bool hasFixedOrSticky() const;
    void fixedOrStickyNodeAdded(ScrollingTreeNode&);

    // A map of overflow scrolling nodes to positioned nodes which need to be updated
    // when the scroller changes, but are not descendants.
    using RelatedNodesMap = UncheckedKeyHashMap<ScrollingNodeID, Vector<ScrollingNodeID>>;
    RelatedNodesMap& overflowRelatedNodes() { return m_overflowRelatedNodesMap; }

    HashSet<Ref<ScrollingTreeOverflowScrollProxyNode>>& activeOverflowScrollProxyNodes() { return m_activeOverflowScrollProxyNodes; }
    HashSet<Ref<ScrollingTreePositionedNode>>& activePositionedNodes() { return m_activePositionedNodes; }

    WEBCORE_EXPORT String scrollingTreeAsText(OptionSet<ScrollingStateTreeAsTextBehavior> = { });

    bool isMonitoringWheelEvents() const { return m_isMonitoringWheelEvents; }
    void setIsMonitoringWheelEvents(bool b) { m_isMonitoringWheelEvents = b; }
    bool inCommitTreeState() const { return m_inCommitTreeState; }

    WEBCORE_EXPORT bool hasRecentActivity();

    void scrollBySimulatingWheelEventForTesting(ScrollingNodeID, FloatSize);

    virtual void lockLayersForHitTesting() { }
    virtual void unlockLayersForHitTesting() { }

    virtual bool isScrollingSynchronizedWithMainThread() WTF_REQUIRES_LOCK(m_treeLock) { return true; }

    Lock& treeLock() WTF_RETURNS_LOCK(m_treeLock) { return m_treeLock; }

    WEBCORE_EXPORT void windowScreenDidChange(PlatformDisplayID, std::optional<FramesPerSecond> nominalFramesPerSecond);
    PlatformDisplayID displayID();
    WEBCORE_EXPORT virtual void displayDidRefresh(PlatformDisplayID) { }

    WEBCORE_EXPORT void willProcessWheelEvent();

    WEBCORE_EXPORT void addPendingScrollUpdate(ScrollUpdate&&);
    WEBCORE_EXPORT Vector<ScrollUpdate> takePendingScrollUpdates();
    WEBCORE_EXPORT bool hasPendingScrollUpdates();

    virtual void removePendingScrollAnimationForNode(ScrollingNodeID) { }

    WEBCORE_EXPORT float mainFrameTopContentInset() const;

    WEBCORE_EXPORT FloatPoint mainFrameScrollPosition() const;

    WEBCORE_EXPORT ScrollbarWidth mainFrameScrollbarWidth() const;

    WEBCORE_EXPORT OverscrollBehavior mainFrameHorizontalOverscrollBehavior() const;
    WEBCORE_EXPORT OverscrollBehavior mainFrameVerticalOverscrollBehavior() const;
    
    WEBCORE_EXPORT IntPoint mainFrameScrollOrigin() const;
    WEBCORE_EXPORT int mainFrameHeaderHeight() const;
    WEBCORE_EXPORT int mainFrameFooterHeight() const;
    WEBCORE_EXPORT float mainFrameScaleFactor() const;
    WEBCORE_EXPORT FloatSize totalContentsSize() const;
    WEBCORE_EXPORT FloatRect layoutViewport() const;
    
    WEBCORE_EXPORT void viewWillStartLiveResize();
    WEBCORE_EXPORT void viewWillEndLiveResize();
    WEBCORE_EXPORT void viewSizeDidChange();
    WEBCORE_EXPORT bool overlayScrollbarsEnabled();

    WEBCORE_EXPORT Seconds frameDuration();
    WEBCORE_EXPORT Seconds maxAllowableRenderingUpdateDurationForSynchronization();
    WEBCORE_EXPORT virtual void scrollingTreeNodeScrollbarVisibilityDidChange(ScrollingNodeID, ScrollbarOrientation, bool) { };
    WEBCORE_EXPORT virtual void scrollingTreeNodeScrollbarMinimumThumbLengthDidChange(WebCore::ScrollingNodeID, ScrollbarOrientation, int) { };

    void addScrollingNodeToHostedSubtreeMap(WebCore::LayerHostingContextIdentifier, Ref<ScrollingTreeFrameHostingNode>);
    void removeNode(ScrollingNodeID, ScrollingTreeFrameHostingNode* = nullptr);
    void removeFrameHostingNode(LayerHostingContextIdentifier);

    WEBCORE_EXPORT std::optional<FrameIdentifier> frameIDForScrollingNodeID(ScrollingNodeID);

protected:
    WEBCORE_EXPORT WheelEventHandlingResult handleWheelEventWithNode(const PlatformWheelEvent&, OptionSet<WheelEventProcessingSteps>, ScrollingTreeNode*, EventTargeting = EventTargeting::Propagate);

    void setMainFrameScrollPosition(FloatPoint);

    WEBCORE_EXPORT void setGestureState(std::optional<WheelScrollGestureState>);
    WEBCORE_EXPORT std::optional<WheelScrollGestureState> gestureState();

    std::optional<FramesPerSecond> nominalFramesPerSecond();

    WEBCORE_EXPORT virtual void applyLayerPositionsInternal() WTF_REQUIRES_LOCK(m_treeLock);
    WEBCORE_EXPORT void removeAllNodes() WTF_REQUIRES_LOCK(m_treeLock);
    
    virtual void hasNodeWithAnimatedScrollChanged(bool /* hasNodeWithAnimatedScroll */) { }

    bool hasProcessedWheelEventsRecently();

    HashSet<ScrollingNodeID> nodesWithActiveScrollAnimations();
    WEBCORE_EXPORT void serviceScrollAnimations(MonotonicTime) WTF_REQUIRES_LOCK(m_treeLock);

    mutable Lock m_treeLock; // Protects the scrolling tree.

private:
    bool updateTreeFromStateNodeRecursive(const ScrollingStateNode*, struct CommitTreeState&) WTF_REQUIRES_LOCK(m_treeLock);
    virtual void propagateSynchronousScrollingReasons(const HashSet<ScrollingNodeID>&) WTF_REQUIRES_LOCK(m_treeLock) { }

    void applyLayerPositionsRecursive(ScrollingTreeNode&) WTF_REQUIRES_LOCK(m_treeLock);
    void notifyRelatedNodesRecursive(ScrollingTreeNode&);
    void traverseScrollingTreeRecursive(ScrollingTreeNode&, const VisitorFunction&) WTF_REQUIRES_LOCK(m_treeLock);
    
    void setOverlayScrollbarsEnabled(bool);
    
    virtual void didCommitTree() { }

    WEBCORE_EXPORT virtual RefPtr<ScrollingTreeNode> scrollingNodeForPoint(FloatPoint);
#if ENABLE(WHEEL_EVENT_REGIONS)
    WEBCORE_EXPORT virtual OptionSet<EventListenerRegionType> eventListenerRegionTypesForPoint(FloatPoint) const;
#endif

    OptionSet<WheelEventProcessingSteps> computeWheelProcessingSteps(const PlatformWheelEvent&) WTF_REQUIRES_LOCK(m_treeStateLock);

    RefPtr<ScrollingTreeFrameScrollingNode> m_rootNode;

    using ScrollingTreeNodeMap = UncheckedKeyHashMap<ScrollingNodeID, RefPtr<ScrollingTreeNode>>;
    ScrollingTreeNodeMap m_nodeMap;

    Lock m_frameIDMapLock;
    UncheckedKeyHashMap<FrameIdentifier, HashSet<ScrollingNodeID>> m_nodeMapPerFrame WTF_GUARDED_BY_LOCK(m_frameIDMapLock);

    ScrollingTreeLatchingController m_latchingController;
    ScrollingTreeGestureState m_gestureState;

    RelatedNodesMap m_overflowRelatedNodesMap;

    HashSet<Ref<ScrollingTreeOverflowScrollProxyNode>> m_activeOverflowScrollProxyNodes;
    HashSet<Ref<ScrollingTreePositionedNode>> m_activePositionedNodes;

    struct TreeState {
        EventTrackingRegions eventTrackingRegions;
        FloatPoint mainFrameScrollPosition;
        PlatformDisplayID displayID { 0 };
        std::optional<FramesPerSecond> nominalFramesPerSecond;
        std::optional<WheelScrollGestureState> gestureState;
        HashSet<ScrollingNodeID> nodesWithActiveRubberBanding;
        HashSet<ScrollingNodeID> nodesWithActiveScrollSnap;
        HashSet<ScrollingNodeID> nodesWithActiveUserScrolls;
        HashSet<ScrollingNodeID> nodesWithActiveScrollAnimations;
    };
    
    mutable Lock m_treeStateLock;
    TreeState m_treeState WTF_GUARDED_BY_LOCK(m_treeStateLock);

    struct SwipeState {
        RectEdges<bool> clientAllowedRubberBandableEdges  { true, true, true, true };
        RectEdges<bool> mainFramePinnedState { true, true, true, true };
        ScrollPinningBehavior scrollPinningBehavior { ScrollPinningBehavior::DoNotPin };
    };

    Lock m_swipeStateLock;
    SwipeState m_swipeState WTF_GUARDED_BY_LOCK(m_swipeStateLock);

    Lock m_pendingScrollUpdatesLock;
    Vector<ScrollUpdate> m_pendingScrollUpdates WTF_GUARDED_BY_LOCK(m_pendingScrollUpdatesLock);

    Lock m_lastWheelEventTimeLock;
    MonotonicTime m_lastWheelEventTime WTF_GUARDED_BY_LOCK(m_lastWheelEventTimeLock);

    UncheckedKeyHashMap<LayerHostingContextIdentifier, Vector<std::unique_ptr<ScrollingStateTree>>> m_hostedSubtreesNeedingPairing;
    UncheckedKeyHashMap<LayerHostingContextIdentifier, Ref<ScrollingTreeFrameHostingNode>> m_hostedSubtrees;

protected:
    bool m_allowLatching { true };

private:
    ThreadSafeWeakHashSet<ScrollingTreeNode> m_fixedOrStickyNodes;
    std::atomic<bool> m_isHandlingProgrammaticScroll { false };
    bool m_isMonitoringWheelEvents { false };
    bool m_scrollingPerformanceTestingEnabled { false };
    bool m_overlayScrollbarsEnabled { false };
    bool m_asyncFrameOrOverflowScrollingEnabled { false };
    bool m_wheelEventGesturesBecomeNonBlocking { false };
    bool m_needsApplyLayerPositionsAfterCommit { false };
    bool m_inCommitTreeState { false };
};

class ScrollingTreeWheelEventTestMonitorCompletionDeferrer {
public:
    ScrollingTreeWheelEventTestMonitorCompletionDeferrer(ScrollingTree& scrollingTree, ScrollingNodeID nodeID, WheelEventTestMonitor::DeferReason reason)
        : m_scrollingTree(scrollingTree)
        , m_scrollingNodeID(nodeID)
        , m_deferReason(reason)
    {
        m_scrollingTree->deferWheelEventTestCompletionForReason(m_scrollingNodeID, m_deferReason);
    }
    
    ~ScrollingTreeWheelEventTestMonitorCompletionDeferrer()
    {
        m_scrollingTree->removeWheelEventTestCompletionDeferralForReason(m_scrollingNodeID, m_deferReason);
    }

private:
    Ref<ScrollingTree> m_scrollingTree;
    ScrollingNodeID m_scrollingNodeID;
    WheelEventTestMonitor::DeferReason m_deferReason;
};

} // namespace WebCore

#define SPECIALIZE_TYPE_TRAITS_SCROLLING_TREE(ToValueTypeName, predicate) \
SPECIALIZE_TYPE_TRAITS_BEGIN(ToValueTypeName) \
    static bool isType(const WebCore::ScrollingTree& tree) { return tree.predicate; } \
SPECIALIZE_TYPE_TRAITS_END()
#endif // ENABLE(ASYNC_SCROLLING)
