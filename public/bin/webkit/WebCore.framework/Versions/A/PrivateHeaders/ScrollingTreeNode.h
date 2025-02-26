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

#include "IntRect.h"
#include "ScrollTypes.h"
#include "ScrollingCoordinator.h"
#include "ScrollingStateNode.h"
#include <wtf/RefCounted.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/ThreadSafeWeakPtr.h>
#include <wtf/TypeCasts.h>

namespace WebCore {

class ScrollingStateFixedNode;
class ScrollingTree;
class ScrollingTreeFrameScrollingNode;
class ScrollingTreeScrollingNode;

class ScrollingTreeNode : public ThreadSafeRefCountedAndCanMakeThreadSafeWeakPtr<ScrollingTreeNode> {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(ScrollingTreeNode, WEBCORE_EXPORT);
    friend class ScrollingTree;
public:
    virtual ~ScrollingTreeNode();

    ScrollingNodeType nodeType() const { return m_nodeType; }
    ScrollingNodeID scrollingNodeID() const { return m_nodeID; }
    
    bool isFixedNode() const { return nodeType() == ScrollingNodeType::Fixed; }
    bool isStickyNode() const { return nodeType() == ScrollingNodeType::Sticky; }
    bool isPositionedNode() const { return nodeType() == ScrollingNodeType::Positioned; }
#if PLATFORM(COCOA)
    bool isFixedNodeCocoa() const { return isFixedNode(); }
    bool isPositionedNodeCocoa() const { return isPositionedNode(); }
    bool isOverflowScrollProxyNodeCocoa() const { return isOverflowScrollProxyNode(); }
#endif
#if USE(COORDINATED_GRAPHICS)
    bool isFixedNodeCoordinated() const { return isFixedNode(); }
    bool isPositionedNodeCoordinated() const { return isPositionedNode(); }
    bool isOverflowScrollProxyNodeCoordinated() const { return isOverflowScrollProxyNode(); }
#endif
    bool isScrollingNode() const { return isFrameScrollingNode() || isOverflowScrollingNode() || isPluginScrollingNode(); }
    bool isFrameScrollingNode() const { return nodeType() == ScrollingNodeType::MainFrame || nodeType() == ScrollingNodeType::Subframe; }
    bool isFrameHostingNode() const { return nodeType() == ScrollingNodeType::FrameHosting; }
    bool isPluginScrollingNode() const { return nodeType() == ScrollingNodeType::PluginScrolling; }
    bool isPluginHostingNode() const { return nodeType() == ScrollingNodeType::PluginHosting; }
    bool isOverflowScrollingNode() const { return nodeType() == ScrollingNodeType::Overflow; }
    bool isOverflowScrollProxyNode() const { return nodeType() == ScrollingNodeType::OverflowProxy; }

    virtual bool commitStateBeforeChildren(const ScrollingStateNode&) = 0;
    virtual bool commitStateAfterChildren(const ScrollingStateNode&) { return true; }
    virtual void didCompleteCommitForNode() { }
    
    virtual void willBeDestroyed() { }

    RefPtr<ScrollingTreeNode> parent() const { return m_parent.get(); }
    void setParent(RefPtr<ScrollingTreeNode>&& parent) { m_parent = parent; }

    WEBCORE_EXPORT bool isRootNode() const;

    const Vector<Ref<ScrollingTreeNode>>& children() const { return m_children; }

    void appendChild(Ref<ScrollingTreeNode>&&);
    void removeChild(ScrollingTreeNode&);
    void removeAllChildren();

    virtual bool isRootOfHostedSubtree() const { return false; }

    WEBCORE_EXPORT RefPtr<ScrollingTreeFrameScrollingNode> enclosingFrameNodeIncludingSelf();
    WEBCORE_EXPORT RefPtr<ScrollingTreeScrollingNode> enclosingScrollingNodeIncludingSelf();

    WEBCORE_EXPORT void dump(WTF::TextStream&, OptionSet<ScrollingStateTreeAsTextBehavior>) const;

    FrameIdentifier frameIdentifier() const { return *m_parentFrameIdentifier; }
    void setFrameIdentifier(FrameIdentifier frameID) { m_parentFrameIdentifier = frameID; }

protected:
    ScrollingTreeNode(ScrollingTree&, ScrollingNodeType, ScrollingNodeID);
    RefPtr<ScrollingTree> scrollingTree() const { return m_scrollingTree.get(); }

    virtual void applyLayerPositions() = 0;

    WEBCORE_EXPORT virtual void dumpProperties(WTF::TextStream&, OptionSet<ScrollingStateTreeAsTextBehavior>) const;

    Vector<Ref<ScrollingTreeNode>> m_children;

private:
    ThreadSafeWeakPtr<ScrollingTree> m_scrollingTree;

    const ScrollingNodeType m_nodeType;
    const ScrollingNodeID m_nodeID;
    Markable<FrameIdentifier> m_parentFrameIdentifier;

    ThreadSafeWeakPtr<ScrollingTreeNode> m_parent;
};

} // namespace WebCore

#define SPECIALIZE_TYPE_TRAITS_SCROLLING_NODE(ToValueTypeName, predicate) \
SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::ToValueTypeName) \
    static bool isType(const WebCore::ScrollingTreeNode& node) { return node.predicate; } \
SPECIALIZE_TYPE_TRAITS_END()

#endif // ENABLE(ASYNC_SCROLLING)
