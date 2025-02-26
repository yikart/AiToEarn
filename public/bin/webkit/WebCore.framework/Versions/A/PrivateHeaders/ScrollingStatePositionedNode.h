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

#if ENABLE(ASYNC_SCROLLING)

#include "ScrollingConstraints.h"
#include "ScrollingStateNode.h"

#include <wtf/Forward.h>

namespace WebCore {

// ScrollingStatePositionedNode is used to manage the layers for z-order composited descendants of overflow:scroll
// which are not containing block descendants (i.e. position:absolute). These layers must have their position inside their ancestor clipping
// layer adjusted on the scrolling thread.
class ScrollingStatePositionedNode final : public ScrollingStateNode {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(ScrollingStatePositionedNode, WEBCORE_EXPORT);
public:
    template<typename... Args> static Ref<ScrollingStatePositionedNode> create(Args&&... args) { return adoptRef(*new ScrollingStatePositionedNode(std::forward<Args>(args)...)); }

    Ref<ScrollingStateNode> clone(ScrollingStateTree&) override;

    virtual ~ScrollingStatePositionedNode();

    // These are the overflow scrolling nodes whose scroll position affects the layers in this node.
    const Vector<ScrollingNodeID>& relatedOverflowScrollingNodes() const { return m_relatedOverflowScrollingNodes; }
    WEBCORE_EXPORT void setRelatedOverflowScrollingNodes(Vector<ScrollingNodeID>&&);

    WEBCORE_EXPORT void updateConstraints(const AbsolutePositionConstraints&);
    const AbsolutePositionConstraints& layoutConstraints() const { return m_constraints; }

private:
    WEBCORE_EXPORT ScrollingStatePositionedNode(ScrollingNodeID, Vector<Ref<ScrollingStateNode>>&&, OptionSet<ScrollingStateNodeProperty>, std::optional<PlatformLayerIdentifier>, Vector<ScrollingNodeID>&&, AbsolutePositionConstraints&&);
    ScrollingStatePositionedNode(ScrollingStateTree&, ScrollingNodeID);
    ScrollingStatePositionedNode(const ScrollingStatePositionedNode&, ScrollingStateTree&);

    void dumpProperties(WTF::TextStream&, OptionSet<ScrollingStateTreeAsTextBehavior>) const final;
    OptionSet<ScrollingStateNode::Property> applicableProperties() const final;

    Vector<ScrollingNodeID> m_relatedOverflowScrollingNodes;
    AbsolutePositionConstraints m_constraints;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_SCROLLING_STATE_NODE(ScrollingStatePositionedNode, isPositionedNode())

#endif // ENABLE(ASYNC_SCROLLING)
