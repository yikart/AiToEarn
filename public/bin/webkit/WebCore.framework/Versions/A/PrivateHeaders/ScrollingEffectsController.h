/*
 * Copyright (C) 2011, 2014-2015 Apple Inc. All rights reserved.
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

#include "KeyboardScroll.h"
#include "RectEdges.h"
#include "ScrollAnimation.h"
#include "ScrollSnapAnimatorState.h"
#include "ScrollSnapOffsetsInfo.h"
#include "ScrollTypes.h"
#include "WheelEventTestMonitor.h"
#include <wtf/Deque.h>
#include <wtf/Noncopyable.h>
#include <wtf/RunLoop.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class KeyboardScrollingAnimator;
class LayoutSize;
class PlatformWheelEvent;
class ScrollSnapAnimatorState;
class ScrollingEffectsController;
class ScrollableArea;
class WheelEventTestMonitor;
struct ScrollExtents;

class ScrollingEffectsControllerTimer : public RunLoop::TimerBase {
    WTF_MAKE_TZONE_ALLOCATED(ScrollingEffectsControllerTimer);
public:
    ScrollingEffectsControllerTimer(RunLoop& runLoop, Function<void()>&& callback)
        : RunLoop::TimerBase(runLoop)
        , m_callback(WTFMove(callback))
    {
    }

    void fired() final
    {
        m_callback();
    }

private:
    Function<void()> m_callback;
};

class ScrollingEffectsControllerClient {
protected:
    virtual ~ScrollingEffectsControllerClient() = default;

public:
    // Only used for non-animation timers.
    virtual std::unique_ptr<ScrollingEffectsControllerTimer> createTimer(Function<void()>&&) = 0;

    virtual void startAnimationCallback(ScrollingEffectsController&) = 0;
    virtual void stopAnimationCallback(ScrollingEffectsController&) = 0;

    virtual KeyboardScrollingAnimator *keyboardScrollingAnimator() const { return nullptr; }

    virtual bool allowsHorizontalScrolling() const = 0;
    virtual bool allowsVerticalScrolling() const = 0;

    virtual void immediateScrollBy(const FloatSize&, ScrollClamping = ScrollClamping::Clamped) = 0;

    // If the current scroll position is within the overhang area, this function will cause
    // the page to scroll to the nearest boundary point.
    virtual void adjustScrollPositionToBoundsIfNecessary() = 0;

#if HAVE(RUBBER_BANDING)
    virtual bool allowsHorizontalStretching(const PlatformWheelEvent&) const = 0;
    virtual bool allowsVerticalStretching(const PlatformWheelEvent&) const = 0;
    virtual IntSize stretchAmount() const = 0;

    // "Pinned" means scrolled at or beyond the edge.
    virtual bool isPinnedOnSide(BoxSide) const = 0;
    virtual RectEdges<bool> edgePinnedState() const = 0;

    virtual bool shouldRubberBandOnSide(BoxSide) const = 0;

    virtual void willStartRubberBandAnimation() { }
    virtual void didStopRubberBandAnimation() { }

    virtual void rubberBandingStateChanged(bool) { }
#endif

    virtual void deferWheelEventTestCompletionForReason(ScrollingNodeID, WheelEventTestMonitor::DeferReason) const { /* Do nothing */ }
    virtual void removeWheelEventTestCompletionDeferralForReason(ScrollingNodeID, WheelEventTestMonitor::DeferReason) const { /* Do nothing */ }

    virtual FloatPoint scrollOffset() const = 0;

    virtual void willStartAnimatedScroll() { }
    virtual void didStopAnimatedScroll() { }

    virtual void willStartWheelEventScroll() { }
    virtual void didStopWheelEventScroll() { }

    virtual void willStartScrollSnapAnimation() { }
    virtual void didStopScrollSnapAnimation() { }

    virtual float pageScaleFactor() const = 0;
    virtual ScrollExtents scrollExtents() const = 0;
    virtual bool scrollAnimationEnabled() const { return true; }
    virtual ScrollingNodeID scrollingNodeIDForTesting() const = 0;
};

class ScrollingEffectsController : public ScrollAnimationClient {
    WTF_MAKE_NONCOPYABLE(ScrollingEffectsController);

public:
    explicit ScrollingEffectsController(ScrollingEffectsControllerClient&);
    virtual ~ScrollingEffectsController();

    bool usesScrollSnap() const;
    void stopAllTimers();
    void scrollPositionChanged();

    bool startAnimatedScrollToDestination(FloatPoint startOffset, FloatPoint destinationOffset);
    bool retargetAnimatedScroll(FloatPoint newDestinationOffset);
    bool retargetAnimatedScrollBy(FloatSize);

    void stopAnimatedScroll();
    void stopAnimatedNonRubberbandingScroll();

    void stopKeyboardScrolling();

    bool startMomentumScrollWithInitialVelocity(const FloatPoint& initialOffset, const FloatSize& initialVelocity, const FloatSize& initialDelta, const Function<FloatPoint(const FloatPoint&)>& destinationModifier);

    void willBeginKeyboardScrolling();
    void didStopKeyboardScrolling();

    bool startKeyboardScroll(const KeyboardScroll&);

    void finishKeyboardScroll(bool immediate);
    
    // Should be called periodically by the client. Started by startAnimationCallback(), stopped by stopAnimationCallback().
    void animationCallback(MonotonicTime);

    void updateGestureInProgressState(const PlatformWheelEvent&);
    
    void contentsSizeChanged();

    void setSnapOffsetsInfo(const LayoutScrollSnapOffsetsInfo&);
    const LayoutScrollSnapOffsetsInfo* snapOffsetsInfo() const;
    void setActiveScrollSnapIndexForAxis(ScrollEventAxis, std::optional<unsigned>);
    void updateActiveScrollSnapIndexForClientOffset();
    void resnapAfterLayout();

    std::optional<unsigned> activeScrollSnapIndexForAxis(ScrollEventAxis) const;
    float adjustedScrollDestination(ScrollEventAxis, FloatPoint destinationOffset, float velocity, std::optional<float> originalOffset) const;

    bool activeScrollSnapIndexDidChange() const { return m_activeScrollSnapIndexDidChange; }
    // FIXME: This is never called. We never set m_activeScrollSnapIndexDidChange back to false.
    void setScrollSnapIndexDidChange(bool state) { m_activeScrollSnapIndexDidChange = state; }

    // Returns true if handled.
    bool handleWheelEvent(const PlatformWheelEvent&);

    bool isScrollSnapInProgress() const;
    bool isUserScrollInProgress() const;

#if PLATFORM(MAC)
    static FloatSize wheelDeltaBiasingTowardsVertical(const FloatSize&);

    // Returns true if handled.
    bool processWheelEventForScrollSnap(const PlatformWheelEvent&);

    void stopRubberBanding();
    bool isRubberBandInProgress() const;
    RectEdges<bool> rubberBandingEdges() const { return m_rubberBandingEdges; }
#endif

private:
    void updateRubberBandAnimatingState();

    void setIsAnimatingRubberBand(bool);
    void setIsAnimatingScrollSnap(bool);
    void setIsAnimatingKeyboardScrolling(bool);

    void startScrollSnapAnimation();
    void stopScrollSnapAnimation();

#if PLATFORM(MAC)
    bool shouldOverrideMomentumScrolling() const;
    void discreteSnapTransitionTimerFired();
    void scheduleDiscreteScrollSnap(const FloatSize& delta);

    bool modifyScrollDeltaForStretching(const PlatformWheelEvent&, FloatSize&, bool isHorizontallyStretched, bool isVerticallyStretched);
    bool applyScrollDeltaWithStretching(const PlatformWheelEvent&, FloatSize, bool isHorizontallyStretched, bool isVerticallyStretched);

    void startRubberBandAnimationIfNecessary();

    bool startRubberBandAnimation(const FloatSize& initialVelocity, const FloatSize& initialOverscroll);
    void stopRubberBandAnimation();

    void willStartRubberBandAnimation();
    void didStopRubberBandAnimation();

    bool shouldRubberBandOnSide(BoxSide) const;
    bool isRubberBandInProgressInternal() const;
    void updateRubberBandingState();
    void updateRubberBandingEdges(IntSize clientStretch);
#endif

    void startOrStopAnimationCallbacks();

    void startDeferringWheelEventTestCompletion(WheelEventTestMonitor::DeferReason);
    void stopDeferringWheelEventTestCompletion(WheelEventTestMonitor::DeferReason);

    // ScrollAnimationClient
    void scrollAnimationDidUpdate(ScrollAnimation&, const FloatPoint& /* currentOffset */) final;
    void scrollAnimationWillStart(ScrollAnimation&) final;
    void scrollAnimationDidEnd(ScrollAnimation&) final;
    ScrollExtents scrollExtentsForAnimation(ScrollAnimation&) final;
    FloatSize overscrollAmount(ScrollAnimation&) final;
    FloatPoint scrollOffset(ScrollAnimation&) final;

    void adjustDeltaForSnappingIfNeeded(float& deltaX, float& deltaY);

#if ENABLE(KINETIC_SCROLLING) && !PLATFORM(MAC)
    // Returns true if handled.
    bool processWheelEventForKineticScrolling(const PlatformWheelEvent&);

    Deque<PlatformWheelEvent> m_scrollHistory;

    struct {
        MonotonicTime startTime;
        FloatPoint initialOffset;
        FloatSize initialVelocity;
    } m_previousKineticAnimationInfo;
#endif

    ScrollingEffectsControllerClient& m_client;

    std::unique_ptr<ScrollAnimation> m_currentAnimation;

    std::unique_ptr<ScrollSnapAnimatorState> m_scrollSnapState;
    bool m_activeScrollSnapIndexDidChange { false };

    bool m_isRunningAnimatingCallback { false };
    bool m_isAnimatingRubberBand { false };
    bool m_isAnimatingScrollSnap { false };
    bool m_isAnimatingKeyboardScrolling { false };
    bool m_inScrollGesture { false };

#if PLATFORM(MAC)
    WallTime m_lastMomentumScrollTimestamp;
    FloatSize m_unappliedOverscrollDelta;
    FloatSize m_stretchScrollForce;
    FloatSize m_momentumVelocity;

    FloatSize m_scrollingVelocityForScrollSnap;

    bool m_momentumScrollInProgress { false };
    bool m_ignoreMomentumScrolls { false };
    bool m_isRubberBanding { false };

    Deque<FloatSize> m_recentDiscreteWheelDeltas;
    std::unique_ptr<ScrollingEffectsControllerTimer> m_discreteSnapTransitionTimer;

#if HAVE(RUBBER_BANDING)
    RectEdges<bool> m_rubberBandingEdges;
#endif

#if ASSERT_ENABLED
    bool m_timersWereStopped { false };
#endif
#endif
};

} // namespace WebCore
