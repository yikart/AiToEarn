/*
 * Copyright (C) 2012 Apple Inc. All rights reserved.
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

#include "GraphicsLayer.h"
#include "ScrollingCoordinator.h"
#include "ScrollingPlatformLayer.h"
#include <stdint.h>
#include <wtf/CheckedPtr.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/ThreadSafeWeakPtr.h>
#include <wtf/TypeCasts.h>
#include <wtf/Vector.h>

namespace WTF {
class TextStream;
}

namespace WebCore {

class GraphicsLayer;
class ScrollingStateTree;

// Used to allow ScrollingStateNodes to refer to layers in various contexts:
// a) Async scrolling, main thread: ScrollingStateNode holds onto a GraphicsLayer, and uses m_layerID
//    to detect whether that GraphicsLayer's underlying PlatformLayer changed.
// b) Threaded scrolling, commit to scrolling thread: ScrollingStateNode wraps a PlatformLayer, which
//    can be passed to the Scrolling Thread
// c) Remote scrolling UI process, where LayerRepresentation wraps just a PlatformLayerID.
class LayerRepresentation {
public:
    enum Type {
        EmptyRepresentation,
        GraphicsLayerRepresentation,
        PlatformLayerRepresentation,
        PlatformLayerIDRepresentation
    };

    LayerRepresentation() = default;

    LayerRepresentation(GraphicsLayer* graphicsLayer)
        : m_graphicsLayer(graphicsLayer)
        , m_layerID(graphicsLayer ? std::optional { graphicsLayer->primaryLayerID() } : std::nullopt)
        , m_representation(GraphicsLayerRepresentation)
    { }

    LayerRepresentation(ScrollingPlatformLayer* platformLayer)
        : m_typelessPlatformLayer(makePlatformLayerTypeless(platformLayer))
        , m_representation(PlatformLayerRepresentation)
    {
        retainPlatformLayer(m_typelessPlatformLayer);
    }

    LayerRepresentation(std::optional<PlatformLayerIdentifier> layerID)
        : m_layerID(layerID)
        , m_representation(PlatformLayerIDRepresentation)
    {
    }

    LayerRepresentation(const LayerRepresentation& other)
        : m_typelessPlatformLayer(other.m_typelessPlatformLayer)
        , m_layerID(other.m_layerID)
        , m_representation(other.m_representation)
    {
        if (m_representation == PlatformLayerRepresentation)
            retainPlatformLayer(m_typelessPlatformLayer);
    }

    ~LayerRepresentation()
    {
        if (m_representation == PlatformLayerRepresentation)
            releasePlatformLayer(m_typelessPlatformLayer);
    }

    explicit operator GraphicsLayer*() const
    {
        ASSERT(m_representation == GraphicsLayerRepresentation);
        return m_graphicsLayer.get();
    }

    explicit operator ScrollingPlatformLayer*() const
    {
        ASSERT(m_representation == PlatformLayerRepresentation);
        return makePlatformLayerTyped(m_typelessPlatformLayer);
    }
    
    std::optional<PlatformLayerIdentifier> layerID() const
    {
        return m_layerID.asOptional();
    }

    LayerRepresentation& operator=(const LayerRepresentation& other)
    {
        m_graphicsLayer = other.m_graphicsLayer;
        m_typelessPlatformLayer = other.m_typelessPlatformLayer;
        m_layerID = other.m_layerID;
        m_representation = other.m_representation;

        if (m_representation == PlatformLayerRepresentation)
            retainPlatformLayer(m_typelessPlatformLayer);

        return *this;
    }

    explicit operator bool() const
    {
        switch (m_representation) {
        case EmptyRepresentation:
            return false;
        case GraphicsLayerRepresentation:
            return !!m_graphicsLayer;
        case PlatformLayerRepresentation:
            return !!m_typelessPlatformLayer;
        case PlatformLayerIDRepresentation:
            return !!m_layerID;
        }
        ASSERT_NOT_REACHED();
        return false;
    }

    bool operator==(const LayerRepresentation& other) const
    {
        if (m_representation != other.m_representation)
            return false;
        switch (m_representation) {
        case EmptyRepresentation:
            return true;
        case GraphicsLayerRepresentation:
            return m_graphicsLayer == other.m_graphicsLayer
                && m_layerID == other.m_layerID;
        case PlatformLayerRepresentation:
            return m_typelessPlatformLayer == other.m_typelessPlatformLayer;
        case PlatformLayerIDRepresentation:
            return m_layerID == other.m_layerID;
        }
        ASSERT_NOT_REACHED();
        return true;
    }
    
    LayerRepresentation toRepresentation(Type representation) const
    {
        switch (representation) {
        case EmptyRepresentation:
            return LayerRepresentation();
        case GraphicsLayerRepresentation:
            ASSERT(m_representation == GraphicsLayerRepresentation);
            return LayerRepresentation(m_graphicsLayer.get());
        case PlatformLayerRepresentation:
            return m_graphicsLayer ? platformLayerFromGraphicsLayer(*m_graphicsLayer) : nullptr;
        case PlatformLayerIDRepresentation:
            return LayerRepresentation(m_layerID);
        }
        ASSERT_NOT_REACHED();
        return LayerRepresentation();
    }

    bool representsGraphicsLayer() const { return m_representation == GraphicsLayerRepresentation; }
    bool representsPlatformLayerID() const { return m_representation == PlatformLayerIDRepresentation; }
    
private:
    WEBCORE_EXPORT static void retainPlatformLayer(void* typelessPlatformLayer);
    WEBCORE_EXPORT static void releasePlatformLayer(void* typelessPlatformLayer);
    WEBCORE_EXPORT static ScrollingPlatformLayer* makePlatformLayerTyped(void* typelessPlatformLayer);
    WEBCORE_EXPORT static void* makePlatformLayerTypeless(ScrollingPlatformLayer*);
    WEBCORE_EXPORT static ScrollingPlatformLayer* platformLayerFromGraphicsLayer(GraphicsLayer&);

    RefPtr<GraphicsLayer> m_graphicsLayer;
    void* m_typelessPlatformLayer { nullptr };
    Markable<PlatformLayerIdentifier> m_layerID;
    Type m_representation { EmptyRepresentation };
};

enum class ScrollingStateNodeProperty : uint64_t {
    // ScrollingStateNode
    Layer                                       = 1LLU << 0,
    ChildNodes                                  = 1LLU << 45,
    // ScrollingStateScrollingNode
    ScrollableAreaSize                          = 1LLU << 1, // Same value as RelatedOverflowScrollingNodes, ViewportConstraints and OverflowScrollingNode
    TotalContentsSize                           = 1LLU << 2, // Same value as LayoutConstraintData
    ReachableContentsSize                       = 1LLU << 3,
    ScrollPosition                              = 1LLU << 4,
    ScrollOrigin                                = 1LLU << 5,
    ScrollableAreaParams                        = 1LLU << 6,
#if ENABLE(SCROLLING_THREAD)
    ReasonsForSynchronousScrolling              = 1LLU << 7,
    RequestedScrollPosition                     = 1LLU << 8,
#else
    RequestedScrollPosition                     = 1LLU << 7,
#endif
    SnapOffsetsInfo                             = RequestedScrollPosition << 1,
    CurrentHorizontalSnapOffsetIndex            = SnapOffsetsInfo << 1,
    CurrentVerticalSnapOffsetIndex              = CurrentHorizontalSnapOffsetIndex << 1,
    IsMonitoringWheelEvents                     = CurrentVerticalSnapOffsetIndex << 1,
    ScrollContainerLayer                        = IsMonitoringWheelEvents << 1,
    ScrolledContentsLayer                       = ScrollContainerLayer << 1,
    HorizontalScrollbarLayer                    = ScrolledContentsLayer << 1,
    VerticalScrollbarLayer                      = HorizontalScrollbarLayer << 1,
    PainterForScrollbar                         = 1LLU << 44, // Not serialized
    ContentAreaHoverState                       = VerticalScrollbarLayer << 1,
    MouseActivityState                          = ContentAreaHoverState << 1,
    ScrollbarHoverState                         = MouseActivityState << 1,
    ScrollbarEnabledState                       = ScrollbarHoverState << 1,
    ScrollbarLayoutDirection                    = ScrollbarEnabledState << 1,
    ScrollbarWidth                              = ScrollbarLayoutDirection << 1,
    UseDarkAppearanceForScrollbars              = ScrollbarWidth << 1,
    // ScrollingStateFrameScrollingNode
    KeyboardScrollData                          = UseDarkAppearanceForScrollbars << 1,
    FrameScaleFactor                            = KeyboardScrollData << 1,
    EventTrackingRegion                         = FrameScaleFactor << 1,
    RootContentsLayer                           = EventTrackingRegion << 1,
    CounterScrollingLayer                       = RootContentsLayer << 1,
    InsetClipLayer                              = CounterScrollingLayer << 1,
    ContentShadowLayer                          = InsetClipLayer << 1,
    HeaderHeight                                = ContentShadowLayer << 1,
    FooterHeight                                = HeaderHeight << 1,
    HeaderLayer                                 = 1LLU << 50, // Not serialized
    FooterLayer                                 = 1LLU << 43, // Not serialized
    BehaviorForFixedElements                    = FooterHeight << 1,
    TopContentInset                             = BehaviorForFixedElements << 1,
    VisualViewportIsSmallerThanLayoutViewport   = TopContentInset << 1,
    AsyncFrameOrOverflowScrollingEnabled        = VisualViewportIsSmallerThanLayoutViewport << 1,
    WheelEventGesturesBecomeNonBlocking         = AsyncFrameOrOverflowScrollingEnabled << 1,
    ScrollingPerformanceTestingEnabled          = WheelEventGesturesBecomeNonBlocking << 1,
    LayoutViewport                              = ScrollingPerformanceTestingEnabled << 1,
    MinLayoutViewportOrigin                     = LayoutViewport << 1,
    MaxLayoutViewportOrigin                     = MinLayoutViewportOrigin << 1,
    OverrideVisualViewportSize                  = MaxLayoutViewportOrigin << 1,
    OverlayScrollbarsEnabled                    = OverrideVisualViewportSize << 1,
    // ScrollingStatePositionedNode
    RelatedOverflowScrollingNodes               = 1LLU << 1, // Same value as ScrollableAreaSize, ViewportConstraints and OverflowScrollingNode
    LayoutConstraintData                        = 1LLU << 2, // Same value as TotalContentsSize
    // ScrollingStateFixedNode, ScrollingStateStickyNode
    ViewportConstraints                         = 1LLU << 1, // Same value as ScrollableAreaSize, RelatedOverflowScrollingNodes and OverflowScrollingNode
    // ScrollingStateOverflowScrollProxyNode
    OverflowScrollingNode                       = 1LLU << 1, // Same value as ScrollableAreaSize, ViewportConstraints and RelatedOverflowScrollingNodes
    // ScrollingStateFrameHostingNode
    LayerHostingContextIdentifier               = 1LLU << 1,

};

class ScrollingStateNode : public ThreadSafeRefCountedAndCanMakeThreadSafeWeakPtr<ScrollingStateNode> {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(ScrollingStateNode, WEBCORE_EXPORT);
public:
    virtual ~ScrollingStateNode();

    using Property = ScrollingStateNodeProperty;

    ScrollingNodeType nodeType() const { return m_nodeType; }

    bool isFixedNode() const { return m_nodeType == ScrollingNodeType::Fixed; }
    bool isStickyNode() const { return m_nodeType == ScrollingNodeType::Sticky; }
    bool isPositionedNode() const { return m_nodeType == ScrollingNodeType::Positioned; }
    bool isScrollingNode() const { return isFrameScrollingNode() || isOverflowScrollingNode() || isPluginScrollingNode(); }
    bool isFrameScrollingNode() const { return m_nodeType == ScrollingNodeType::MainFrame || m_nodeType == ScrollingNodeType::Subframe; }
    bool isFrameHostingNode() const { return m_nodeType == ScrollingNodeType::FrameHosting; }
    bool isPluginScrollingNode() const { return m_nodeType == ScrollingNodeType::PluginScrolling; }
    bool isPluginHostingNode() const { return m_nodeType == ScrollingNodeType::PluginHosting; }
    bool isOverflowScrollingNode() const { return m_nodeType == ScrollingNodeType::Overflow; }
    bool isOverflowScrollProxyNode() const { return m_nodeType == ScrollingNodeType::OverflowProxy; }

    virtual Ref<ScrollingStateNode> clone(ScrollingStateTree& adoptiveTree) = 0;
    Ref<ScrollingStateNode> cloneAndReset(ScrollingStateTree& adoptiveTree);
    void cloneAndResetChildren(ScrollingStateNode&, ScrollingStateTree& adoptiveTree);
    
    bool hasChangedProperties() const { return !m_changedProperties.isEmpty(); }
    bool hasChangedProperty(Property property) const { return m_changedProperties.contains(property); }
    void resetChangedProperties() { m_changedProperties = { }; }
    void setPropertyChanged(Property);

    void setPropertyChangesAfterReattach();

    OptionSet<Property> changedProperties() const { return m_changedProperties; }
    void setChangedProperties(OptionSet<Property> changedProperties) { m_changedProperties = changedProperties; }
    
    virtual void reconcileLayerPositionForViewportRect(const LayoutRect& /*viewportRect*/, ScrollingLayerPositionAction) { }

    const LayerRepresentation& layer() const { return m_layer; }
    WEBCORE_EXPORT void setLayer(const LayerRepresentation&);

    bool isAttachedToScrollingStateTree() const { return !!m_scrollingStateTree; }
    ScrollingStateTree& scrollingStateTree() const
    {
        ASSERT(m_scrollingStateTree);
        return *m_scrollingStateTree;
    }
    void attachAfterDeserialization(ScrollingStateTree&);

    ScrollingNodeID scrollingNodeID() const { return m_nodeID; }

    RefPtr<ScrollingStateNode> parent() const { return m_parent.get(); }
    void setParent(RefPtr<ScrollingStateNode>&& parent) { m_parent = parent; }
    std::optional<ScrollingNodeID> parentNodeID() const;

    Vector<Ref<ScrollingStateNode>>& children() { return m_children; }
    const Vector<Ref<ScrollingStateNode>>& children() const { return m_children; }
    Vector<Ref<ScrollingStateNode>> takeChildren() { return std::exchange(m_children, { }); }
    WEBCORE_EXPORT void setChildren(Vector<Ref<ScrollingStateNode>>&&);
    void traverse(const Function<void(ScrollingStateNode&)>&);

    void appendChild(Ref<ScrollingStateNode>&&);
    void insertChild(Ref<ScrollingStateNode>&&, size_t index);

    // Note that node ownership is via the parent, so these functions can trigger node deletion.
    void removeFromParent();
    void removeChild(ScrollingStateNode&);

    RefPtr<ScrollingStateNode> childAtIndex(size_t) const;

    String scrollingStateTreeAsText(OptionSet<ScrollingStateTreeAsTextBehavior> = { }) const;
#if ASSERT_ENABLED
    bool parentPointersAreCorrect() const;
#endif

protected:
    ScrollingStateNode(const ScrollingStateNode&, ScrollingStateTree&);
    ScrollingStateNode(ScrollingNodeType, ScrollingStateTree&, ScrollingNodeID);
    ScrollingStateNode(ScrollingNodeType, ScrollingNodeID, Vector<Ref<ScrollingStateNode>>&&, OptionSet<ScrollingStateNodeProperty>, std::optional<PlatformLayerIdentifier>);

    void setPropertyChangedInternal(Property property) { m_changedProperties.add(property); }
    void setPropertiesChangedInternal(OptionSet<Property> properties) { m_changedProperties.add(properties); }

    virtual void dumpProperties(WTF::TextStream&, OptionSet<ScrollingStateTreeAsTextBehavior>) const;
    virtual OptionSet<Property> applicableProperties() const;

private:
    void dump(WTF::TextStream&, OptionSet<ScrollingStateTreeAsTextBehavior>) const;

    const ScrollingNodeType m_nodeType;
    const ScrollingNodeID m_nodeID;
    OptionSet<Property> m_changedProperties;

    CheckedPtr<ScrollingStateTree> m_scrollingStateTree; // Only null between deserialization and attachAfterDeserialization.

    ThreadSafeWeakPtr<ScrollingStateNode> m_parent;
    Vector<Ref<ScrollingStateNode>> m_children;

    LayerRepresentation m_layer;
};

inline std::optional<ScrollingNodeID> ScrollingStateNode::parentNodeID() const
{
    auto parent = m_parent.get();
    if (!parent)
        return std::nullopt;
    return parent->scrollingNodeID();
}

} // namespace WebCore

#define SPECIALIZE_TYPE_TRAITS_SCROLLING_STATE_NODE(ToValueTypeName, predicate) \
SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::ToValueTypeName) \
    static bool isType(const WebCore::ScrollingStateNode& node) { return node.predicate; } \
SPECIALIZE_TYPE_TRAITS_END()

#endif // ENABLE(ASYNC_SCROLLING)
