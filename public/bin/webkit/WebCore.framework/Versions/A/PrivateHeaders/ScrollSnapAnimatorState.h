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

#include "FloatPoint.h"
#include "FloatSize.h"
#include "LayoutPoint.h"
#include "PlatformWheelEvent.h"
#include "ScrollAnimationMomentum.h"
#include "ScrollSnapOffsetsInfo.h"
#include "ScrollTypes.h"
#include <wtf/MonotonicTime.h>
#include <wtf/TZoneMalloc.h>

namespace WTF {
class TextStream;
}

namespace WebCore {

class Page;
class ScrollingEffectsController;
struct ScrollExtents;

enum class ScrollSnapState {
    Snapping,
    Gliding,
    DestinationReached,
    UserInteraction
};

class ScrollSnapAnimatorState {
    WTF_MAKE_TZONE_ALLOCATED(ScrollSnapAnimatorState);
public:
    ScrollSnapAnimatorState(ScrollingEffectsController& scrollController)
        : m_scrollController(scrollController)
    { }
    virtual ~ScrollSnapAnimatorState();

    const Vector<SnapOffset<LayoutUnit>>& snapOffsetsForAxis(ScrollEventAxis axis) const
    {
        return axis == ScrollEventAxis::Horizontal ? m_snapOffsetsInfo.horizontalSnapOffsets : m_snapOffsetsInfo.verticalSnapOffsets;
    }

    const LayoutScrollSnapOffsetsInfo& snapOffsetInfo() const { return m_snapOffsetsInfo; }
    void setSnapOffsetInfo(const LayoutScrollSnapOffsetsInfo& newInfo) { m_snapOffsetsInfo = newInfo; }

    ScrollSnapState currentState() const { return m_currentState; }

    std::optional<unsigned> activeSnapIndexForAxis(ScrollEventAxis axis) const
    {
        return axis == ScrollEventAxis::Horizontal ? m_activeSnapIndexX : m_activeSnapIndexY;
    }
    
    void setActiveSnapIndexForAxis(ScrollEventAxis, std::optional<unsigned>);

    std::optional<unsigned> closestSnapPointForOffset(ScrollEventAxis, ScrollOffset, const ScrollExtents&, float pageScale) const;
    float adjustedScrollDestination(ScrollEventAxis, FloatPoint destinationOffset, float velocity, std::optional<float> originalOffset, const ScrollExtents&, float pageScale) const;

    // returns true if an active snap index changed.
    bool resnapAfterLayout(ScrollOffset, const ScrollExtents&, float pageScale);

    bool setNearestScrollSnapIndexForOffset(ScrollOffset, const ScrollExtents&, float pageScale);

    // State transition helpers.
    // These return true if they start a new animation.
    bool transitionToSnapAnimationState(const ScrollExtents&, float pageScale, const FloatPoint& initialOffset);
    bool transitionToGlideAnimationState(const ScrollExtents&, float pageScale, const FloatPoint& initialOffset, const FloatSize& initialVelocity, const FloatSize& initialDelta);

    void transitionToUserInteractionState();
    void transitionToDestinationReachedState();

private:
    std::pair<float, std::optional<unsigned>> targetOffsetForStartOffset(ScrollEventAxis, const ScrollExtents&, float startOffset, FloatPoint predictedOffset, float pageScale, float initialDelta) const;
    bool setupAnimationForState(ScrollSnapState, const ScrollExtents&, float pageScale, const FloatPoint& initialOffset, const FloatSize& initialVelocity, const FloatSize& initialDelta);
    void teardownAnimationForState(ScrollSnapState);

    bool preserveCurrentTargetForAxis(ScrollEventAxis, ElementIdentifier);

    Vector<SnapOffset<LayoutUnit>> currentlySnappedOffsetsForAxis(ScrollEventAxis) const;
    HashSet<ElementIdentifier> currentlySnappedBoxes(const Vector<SnapOffset<LayoutUnit>>& horizontalOffsets, const Vector<SnapOffset<LayoutUnit>>& verticalOffsets) const;

    bool setNearestScrollSnapIndexForAxisAndOffsetInternal(ScrollEventAxis, ScrollOffset, const ScrollExtents&, float pageScale);
    void updateCurrentlySnappedBoxes();

    void setActiveSnapIndexForAxisInternal(ScrollEventAxis axis, std::optional<unsigned> index)
    {
        if (axis == ScrollEventAxis::Horizontal)
            m_activeSnapIndexX = index;
        else
            m_activeSnapIndexY = index;
    }

    ScrollingEffectsController& m_scrollController;

    ScrollSnapState m_currentState { ScrollSnapState::UserInteraction };

    LayoutScrollSnapOffsetsInfo m_snapOffsetsInfo;
    
    std::optional<unsigned> m_activeSnapIndexX;
    std::optional<unsigned> m_activeSnapIndexY;
    HashSet<ElementIdentifier> m_currentlySnappedBoxes;
};

WTF::TextStream& operator<<(WTF::TextStream&, const ScrollSnapAnimatorState&);

} // namespace WebCore
