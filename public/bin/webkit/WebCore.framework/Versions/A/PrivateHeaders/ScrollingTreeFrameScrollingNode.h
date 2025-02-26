/*
 * Copyright (C) 2014 Apple Inc. All rights reserved.
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

#include "ScrollingTreeScrollingNode.h"
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class PlatformWheelEvent;
class ScrollingTree;

class WEBCORE_EXPORT ScrollingTreeFrameScrollingNode : public ScrollingTreeScrollingNode {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(ScrollingTreeFrameScrollingNode, WEBCORE_EXPORT);
public:
    virtual ~ScrollingTreeFrameScrollingNode();

    bool commitStateBeforeChildren(const ScrollingStateNode&) override;
    
    bool visualViewportIsSmallerThanLayoutViewport() const { return m_visualViewportIsSmallerThanLayoutViewport; }

    FloatSize viewToContentsOffset(const FloatPoint& scrollPosition) const;

    FloatRect layoutViewport() const { return m_layoutViewport; };
    void setLayoutViewport(const FloatRect& r) { m_layoutViewport = r; };

    FloatRect layoutViewportRespectingRubberBanding() const;

    float frameScaleFactor() const { return m_frameScaleFactor; }
    int headerHeight() const { return m_headerHeight; }
    int footerHeight() const { return m_footerHeight; }
    float topContentInset() const { return m_topContentInset; }
    virtual void viewWillStartLiveResize() { }
    virtual void viewWillEndLiveResize() { }
    virtual void viewSizeDidChange() { }
protected:
    ScrollingTreeFrameScrollingNode(ScrollingTree&, ScrollingNodeType, ScrollingNodeID);

    FloatPoint minLayoutViewportOrigin() const { return m_minLayoutViewportOrigin; }
    FloatPoint maxLayoutViewportOrigin() const { return m_maxLayoutViewportOrigin; }

    ScrollBehaviorForFixedElements scrollBehaviorForFixedElements() const { return m_behaviorForFixed; }

private:
    void updateViewportForCurrentScrollPosition(std::optional<FloatRect>) override;
    bool scrollPositionAndLayoutViewportMatch(const FloatPoint& position, std::optional<FloatRect> overrideLayoutViewport) override;
    FloatRect layoutViewportForScrollPosition(const FloatPoint&, float scale, ScrollBehaviorForFixedElements = ScrollBehaviorForFixedElements::StickToDocumentBounds) const;

    void dumpProperties(WTF::TextStream&, OptionSet<ScrollingStateTreeAsTextBehavior>) const override;

    FloatRect m_layoutViewport;
    FloatPoint m_minLayoutViewportOrigin;
    FloatPoint m_maxLayoutViewportOrigin;
    std::optional<FloatSize> m_overrideVisualViewportSize;
    
    float m_frameScaleFactor { 1 };
    float m_topContentInset { 0 };

    int m_headerHeight { 0 };
    int m_footerHeight { 0 };
    
    ScrollBehaviorForFixedElements m_behaviorForFixed { ScrollBehaviorForFixedElements::StickToDocumentBounds };
    
    bool m_visualViewportIsSmallerThanLayoutViewport { false };
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_SCROLLING_NODE(ScrollingTreeFrameScrollingNode, isFrameScrollingNode())

#endif // ENABLE(ASYNC_SCROLLING)
