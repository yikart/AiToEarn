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

#include "ScrollingStateNode.h"

namespace WebCore {

class ScrollingStateOverflowScrollProxyNode : public ScrollingStateNode {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(ScrollingStateOverflowScrollProxyNode, WEBCORE_EXPORT);
public:
    template<typename... Args> static Ref<ScrollingStateOverflowScrollProxyNode> create(Args&&... args) { return adoptRef(*new ScrollingStateOverflowScrollProxyNode(std::forward<Args>(args)...)); }

    Ref<ScrollingStateNode> clone(ScrollingStateTree&) override;

    virtual ~ScrollingStateOverflowScrollProxyNode();

    // This is the node we get our scroll position from.
    std::optional<ScrollingNodeID> overflowScrollingNode() const { return m_overflowScrollingNodeID; }
    WEBCORE_EXPORT void setOverflowScrollingNode(std::optional<ScrollingNodeID>);

private:
    WEBCORE_EXPORT ScrollingStateOverflowScrollProxyNode(ScrollingNodeID, Vector<Ref<ScrollingStateNode>>&&, OptionSet<ScrollingStateNodeProperty>, std::optional<PlatformLayerIdentifier>, std::optional<ScrollingNodeID> overflowScrollingNode);
    ScrollingStateOverflowScrollProxyNode(ScrollingStateTree&, ScrollingNodeID);
    ScrollingStateOverflowScrollProxyNode(const ScrollingStateOverflowScrollProxyNode&, ScrollingStateTree&);

    void dumpProperties(WTF::TextStream&, OptionSet<ScrollingStateTreeAsTextBehavior>) const final;
    OptionSet<ScrollingStateNode::Property> applicableProperties() const final;

    Markable<ScrollingNodeID> m_overflowScrollingNodeID;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_SCROLLING_STATE_NODE(ScrollingStateOverflowScrollProxyNode, isOverflowScrollProxyNode())

#endif // ENABLE(ASYNC_SCROLLING)
