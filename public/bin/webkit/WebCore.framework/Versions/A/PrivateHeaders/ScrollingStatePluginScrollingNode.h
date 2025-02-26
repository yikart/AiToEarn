/*
 * Copyright (C) 2014-2023 Apple Inc. All rights reserved.
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
#include "ScrollTypes.h"
#include "ScrollbarThemeComposite.h"
#include "ScrollingCoordinator.h"
#include "ScrollingStateScrollingNode.h"

namespace WebCore {

class Scrollbar;

class ScrollingStatePluginScrollingNode final : public ScrollingStateScrollingNode {
public:
    template<typename... Args> static Ref<ScrollingStatePluginScrollingNode> create(Args&&... args) { return adoptRef(*new ScrollingStatePluginScrollingNode(std::forward<Args>(args)...)); }

    Ref<ScrollingStateNode> clone(ScrollingStateTree&) override;

    virtual ~ScrollingStatePluginScrollingNode();

    void dumpProperties(WTF::TextStream&, OptionSet<ScrollingStateTreeAsTextBehavior>) const override;

private:
    WEBCORE_EXPORT ScrollingStatePluginScrollingNode(
        ScrollingNodeID,
        Vector<Ref<WebCore::ScrollingStateNode>>&& children,
        OptionSet<ScrollingStateNodeProperty> changedProperties,
        std::optional<WebCore::PlatformLayerIdentifier>,
        FloatSize scrollableAreaSize,
        FloatSize totalContentsSize,
        FloatSize reachableContentsSize,
        FloatPoint scrollPosition,
        IntPoint scrollOrigin,
        ScrollableAreaParameters&&,
#if ENABLE(SCROLLING_THREAD)
        OptionSet<SynchronousScrollingReason> synchronousScrollingReasons,
#endif
        RequestedScrollData&&,
        FloatScrollSnapOffsetsInfo&&,
        std::optional<unsigned> currentHorizontalSnapPointIndex,
        std::optional<unsigned> currentVerticalSnapPointIndex,
        bool isMonitoringWheelEvents,
        std::optional<PlatformLayerIdentifier> scrollContainerLayer,
        std::optional<PlatformLayerIdentifier> scrolledContentsLayer,
        std::optional<PlatformLayerIdentifier> horizontalScrollbarLayer,
        std::optional<PlatformLayerIdentifier> verticalScrollbarLayer,
        bool mouseIsOverContentArea,
        MouseLocationState&&,
        ScrollbarHoverState&&,
        ScrollbarEnabledState&&,
        UserInterfaceLayoutDirection,
        ScrollbarWidth,
        bool useDarkAppearanceForScrollbars,
        RequestedKeyboardScrollData&&
    );

    ScrollingStatePluginScrollingNode(ScrollingStateTree&, ScrollingNodeType, ScrollingNodeID);
    ScrollingStatePluginScrollingNode(const ScrollingStatePluginScrollingNode&, ScrollingStateTree&);
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_SCROLLING_STATE_NODE(ScrollingStatePluginScrollingNode, isPluginScrollingNode())

#endif // ENABLE(ASYNC_SCROLLING)
