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

#include "ScrollingStateNode.h"
#include <wtf/CheckedPtr.h>
#include <wtf/RefPtr.h>
#include <wtf/TZoneMalloc.h>
 
namespace WebCore {

class AsyncScrollingCoordinator;
class ScrollingStateFrameScrollingNode;

// The ScrollingStateTree is a tree that manages ScrollingStateNodes. The nodes keep track of the current
// state of scrolling related properties. Whenever any properties change, the scrolling coordinator
// will be informed and will schedule a timer that will clone the new state tree and send it over to
// the scrolling thread, avoiding locking. 

class ScrollingStateTree final : public CanMakeCheckedPtr<ScrollingStateTree> {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(ScrollingStateTree, WEBCORE_EXPORT);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(ScrollingStateTree);
    friend class ScrollingStateNode;
public:
    WEBCORE_EXPORT static std::optional<ScrollingStateTree> createAfterReconstruction(bool, bool, RefPtr<ScrollingStateFrameScrollingNode>&&);
    WEBCORE_EXPORT ScrollingStateTree(AsyncScrollingCoordinator* = nullptr);
    WEBCORE_EXPORT ScrollingStateTree(ScrollingStateTree&&);
    WEBCORE_EXPORT ~ScrollingStateTree();

    WEBCORE_EXPORT RefPtr<ScrollingStateFrameScrollingNode> rootStateNode() const;
    WEBCORE_EXPORT RefPtr<ScrollingStateNode> stateNodeForID(std::optional<ScrollingNodeID>) const;

    ScrollingNodeID createUnparentedNode(ScrollingNodeType, ScrollingNodeID);
    WEBCORE_EXPORT std::optional<ScrollingNodeID> insertNode(ScrollingNodeType, ScrollingNodeID, std::optional<ScrollingNodeID> parentID, size_t childIndex);
    void unparentNode(std::optional<ScrollingNodeID>);
    void unparentChildrenAndDestroyNode(std::optional<ScrollingNodeID>);
    void detachAndDestroySubtree(std::optional<ScrollingNodeID>);
    void clear();

    // Copies the current tree state and clears the changed properties mask in the original.
    WEBCORE_EXPORT std::unique_ptr<ScrollingStateTree> commit(LayerRepresentation::Type preferredLayerRepresentation);

    WEBCORE_EXPORT void attachDeserializedNodes();

    WEBCORE_EXPORT void setHasChangedProperties(bool = true);
    bool hasChangedProperties() const { return m_hasChangedProperties; }

    bool hasNewRootStateNode() const { return m_hasNewRootStateNode; }

    unsigned nodeCount() const { return m_stateNodeMap.size(); }
    unsigned scrollingNodeCount() const { return m_scrollingNodeCount; }

    using StateNodeMap = UncheckedKeyHashMap<ScrollingNodeID, Ref<ScrollingStateNode>>;
    const StateNodeMap& nodeMap() const { return m_stateNodeMap; }

    LayerRepresentation::Type preferredLayerRepresentation() const { return m_preferredLayerRepresentation; }
    void setPreferredLayerRepresentation(LayerRepresentation::Type representation) { m_preferredLayerRepresentation = representation; }

    void reconcileViewportConstrainedLayerPositions(std::optional<ScrollingNodeID>, const LayoutRect& viewportRect, ScrollingLayerPositionAction);

    void scrollingNodeAdded()
    {
        ++m_scrollingNodeCount;
    }
    void scrollingNodeRemoved()
    {
        ASSERT(m_scrollingNodeCount);
        --m_scrollingNodeCount;
    }

    WEBCORE_EXPORT String scrollingStateTreeAsText(OptionSet<ScrollingStateTreeAsTextBehavior>) const;
    FrameIdentifier rootFrameIdentifier() const { return *m_rootFrameIdentifier; }
    void setRootFrameIdentifier(std::optional<FrameIdentifier> frameID) { m_rootFrameIdentifier = frameID; }

private:
    ScrollingStateTree(bool hasNewRootStateNode, bool hasChangedProperties, RefPtr<ScrollingStateFrameScrollingNode>&&);

    void setRootStateNode(Ref<ScrollingStateFrameScrollingNode>&&);
    void addNode(ScrollingStateNode&);

    Ref<ScrollingStateNode> createNode(ScrollingNodeType, ScrollingNodeID);

    void removeNodeAndAllDescendants(ScrollingStateNode&);

    void recursiveNodeWillBeRemoved(ScrollingStateNode&);
    void willRemoveNode(ScrollingStateNode&);
    
    bool isValid() const;
    void traverse(const ScrollingStateNode&, const Function<void(const ScrollingStateNode&)>&) const;

    ThreadSafeWeakPtr<AsyncScrollingCoordinator> m_scrollingCoordinator;
    Markable<FrameIdentifier> m_rootFrameIdentifier;

    // Contains all the nodes we know about (those in the m_rootStateNode tree, and in m_unparentedNodes subtrees).
    StateNodeMap m_stateNodeMap;
    // Owns roots of unparented subtrees.
    UncheckedKeyHashMap<ScrollingNodeID, RefPtr<ScrollingStateNode>> m_unparentedNodes;

    RefPtr<ScrollingStateFrameScrollingNode> m_rootStateNode;
    unsigned m_scrollingNodeCount { 0 };
    LayerRepresentation::Type m_preferredLayerRepresentation { LayerRepresentation::GraphicsLayerRepresentation };
    bool m_hasChangedProperties { false };
    bool m_hasNewRootStateNode { false };
};

} // namespace WebCore

#ifndef NDEBUG
void showScrollingStateTree(const WebCore::ScrollingStateTree&);
void showScrollingStateTree(const WebCore::ScrollingStateNode&);
#endif

#endif // ENABLE(ASYNC_SCROLLING)
