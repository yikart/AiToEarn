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

#include "FloatPoint.h"
#include "KeyboardScroll.h"
#include "ScrollTypes.h"
#include <wtf/OptionSet.h>

namespace WebCore {

enum class SynchronousScrollingReason : uint8_t {
    // Flags for frame scrolling.
    ForcedOnMainThread                                          = 1 << 0,
    HasViewportConstrainedObjectsWithoutSupportingFixedLayers   = 1 << 1,
    HasNonLayerViewportConstrainedObjects                       = 1 << 2,
    IsImageDocument                                             = 1 << 3,
    // Flags for frame and overflow scrolling.
    HasSlowRepaintObjects                                       = 1 << 4,
    DescendantScrollersHaveSynchronousScrolling                 = 1 << 5,
};

enum class ScrollingNodeType : uint8_t {
    MainFrame,
    Subframe,
    FrameHosting,
    PluginScrolling,
    PluginHosting,
    Overflow,
    OverflowProxy,
    Fixed,
    Sticky,
    Positioned
};

enum class ScrollingStateTreeAsTextBehavior : uint8_t {
    IncludeLayerIDs         = 1 << 0,
    IncludeNodeIDs          = 1 << 1,
    IncludeLayerPositions   = 1 << 2,
};

constexpr auto debugScrollingStateTreeAsTextBehaviors = OptionSet<ScrollingStateTreeAsTextBehavior> {
    ScrollingStateTreeAsTextBehavior::IncludeLayerIDs, ScrollingStateTreeAsTextBehavior::IncludeNodeIDs, ScrollingStateTreeAsTextBehavior::IncludeLayerPositions
};

enum class ScrollingLayerPositionAction : uint8_t {
    Set,
    SetApproximate,
    Sync
};

struct ScrollableAreaParameters {
    ScrollElasticity horizontalScrollElasticity { ScrollElasticity::None };
    ScrollElasticity verticalScrollElasticity { ScrollElasticity::None };

    ScrollbarMode horizontalScrollbarMode { ScrollbarMode::Auto };
    ScrollbarMode verticalScrollbarMode { ScrollbarMode::Auto };
    
    OverscrollBehavior horizontalOverscrollBehavior { OverscrollBehavior::Auto };
    OverscrollBehavior verticalOverscrollBehavior { OverscrollBehavior::Auto };

    bool allowsHorizontalScrolling { false };
    bool allowsVerticalScrolling { false };

    NativeScrollbarVisibility horizontalNativeScrollbarVisibility { NativeScrollbarVisibility::Visible };
    NativeScrollbarVisibility verticalNativeScrollbarVisibility { NativeScrollbarVisibility::Visible };

    ScrollbarWidth scrollbarWidthStyle { ScrollbarWidth::Auto };

    friend bool operator==(const ScrollableAreaParameters&, const ScrollableAreaParameters&) = default;
};

enum class ViewportRectStability {
    Stable,
    Unstable,
    ChangingObscuredInsetsInteractively // This implies Unstable.
};

enum class ScrollRequestType : uint8_t {
    PositionUpdate,
    DeltaUpdate,
    CancelAnimatedScroll
};

struct RequestedScrollData {
    ScrollRequestType requestType { ScrollRequestType::PositionUpdate };
    std::variant<FloatPoint, FloatSize> scrollPositionOrDelta;
    ScrollType scrollType { ScrollType::User };
    ScrollClamping clamping { ScrollClamping::Clamped };
    ScrollIsAnimated animated { ScrollIsAnimated::No };
    std::optional<std::tuple<ScrollRequestType, std::variant<FloatPoint, FloatSize>, ScrollType, ScrollClamping>> requestedDataBeforeAnimatedScroll { };

    void merge(RequestedScrollData&&);

    WEBCORE_EXPORT FloatPoint destinationPosition(FloatPoint currentScrollPosition) const;
    WEBCORE_EXPORT static FloatPoint computeDestinationPosition(FloatPoint currentScrollPosition, ScrollRequestType, const std::variant<FloatPoint, FloatSize>& scrollPositionOrDelta);

    bool comparePositionOrDelta(const RequestedScrollData& other) const
    {
        if (requestType == ScrollRequestType::PositionUpdate)
            return std::get<FloatPoint>(scrollPositionOrDelta) == std::get<FloatPoint>(other.scrollPositionOrDelta);
        if (requestType == ScrollRequestType::DeltaUpdate)
            return std::get<FloatSize>(scrollPositionOrDelta) == std::get<FloatSize>(other.scrollPositionOrDelta);
        return true;
    }

    bool operator==(const RequestedScrollData& other) const
    {
        return requestType == other.requestType
            && comparePositionOrDelta(other)
            && scrollType == other.scrollType
            && clamping == other.clamping
            && animated == other.animated
            && requestedDataBeforeAnimatedScroll == other.requestedDataBeforeAnimatedScroll;
    }
};

enum class KeyboardScrollAction : uint8_t {
    StartAnimation,
    StopWithAnimation,
    StopImmediately
};

struct RequestedKeyboardScrollData {
    KeyboardScrollAction action { KeyboardScrollAction::StartAnimation };
    std::optional<KeyboardScroll> keyboardScroll;

    friend bool operator==(const RequestedKeyboardScrollData&, const RequestedKeyboardScrollData&) = default;
};

enum class ScrollUpdateType : uint8_t {
    PositionUpdate,
    AnimatedScrollWillStart,
    AnimatedScrollDidEnd,
    WheelEventScrollWillStart,
    WheelEventScrollDidEnd,
};

struct ScrollUpdate {
    ScrollingNodeID nodeID;
    FloatPoint scrollPosition;
    std::optional<FloatPoint> layoutViewportOrigin;
    ScrollUpdateType updateType { ScrollUpdateType::PositionUpdate };
    ScrollingLayerPositionAction updateLayerPositionAction { ScrollingLayerPositionAction::Sync };
    
    bool canMerge(const ScrollUpdate& other) const
    {
        return nodeID == other.nodeID && updateLayerPositionAction == other.updateLayerPositionAction && updateType == other.updateType;
    }
    
    void merge(ScrollUpdate&& other)
    {
        scrollPosition = other.scrollPosition;
        layoutViewportOrigin = other.layoutViewportOrigin;
    }
};

enum class WheelEventProcessingSteps : uint8_t {
    AsyncScrolling                      = 1 << 0,
    SynchronousScrolling                = 1 << 1, // Synchronous with painting and script.
    NonBlockingDOMEventDispatch         = 1 << 2,
    BlockingDOMEventDispatch            = 1 << 3,
};

struct WheelEventHandlingResult {
    OptionSet<WheelEventProcessingSteps> steps;
    bool wasHandled { false };
    bool needsMainThreadProcessing() const { return steps.containsAny({ WheelEventProcessingSteps::SynchronousScrolling, WheelEventProcessingSteps::NonBlockingDOMEventDispatch, WheelEventProcessingSteps::BlockingDOMEventDispatch }); }

    static WheelEventHandlingResult handled(OptionSet<WheelEventProcessingSteps> steps = { })
    {
        return { steps, true };
    }
    static WheelEventHandlingResult unhandled(OptionSet<WheelEventProcessingSteps> steps = { })
    {
        return { steps, false };
    }
    static WheelEventHandlingResult result(bool handled)
    {
        return { { }, handled };
    }
};

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, SynchronousScrollingReason);
WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, ScrollingNodeType);
WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, ScrollingLayerPositionAction);
WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const ScrollableAreaParameters&);
WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, ViewportRectStability);
WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, WheelEventHandlingResult);
WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, WheelEventProcessingSteps);
WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, ScrollRequestType);
WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, ScrollUpdateType);
WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const RequestedScrollData&);

} // namespace WebCore
