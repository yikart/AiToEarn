/*
 * Copyright (C) 2004-2016 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. 
 */

#pragma once

#include "FloatPoint.h"
#include "IntPoint.h"
#include "PlatformEvent.h"
#include <wtf/WindowsExtras.h>

namespace WTF {
class TextStream;
}

namespace WebCore {

class PlatformGestureEvent;

enum class WheelScrollGestureState : uint8_t {
    Blocking,
    NonBlocking
};

// The ScrollByPixelWheelEvent is a fine-grained event that specifies the precise number of pixels to scroll.
// It is sent directly by touch pads on macOS, or synthesized when platforms generate line-by-line scrolling events.
//
// The ScrollByPageWheelEvent indicates that the wheel event should scroll an entire page.
// In this case, WebKit built in paging behavior is used to page up and down.
// This yields the same behavior as clicking in a scrollbar track to page up and down.

enum PlatformWheelEventGranularity : uint8_t {
    ScrollByPageWheelEvent,
    ScrollByPixelWheelEvent,
};

enum class PlatformWheelEventPhase : uint8_t {
    None        = 0,
#if ENABLE(ASYNC_SCROLLING) || ENABLE(KINETIC_SCROLLING)
    Began       = 1 << 0,
    Stationary  = 1 << 1,
    Changed     = 1 << 2,
    Ended       = 1 << 3,
    Cancelled   = 1 << 4,
    MayBegin    = 1 << 5,
#endif
};

#if PLATFORM(WIN)
// How many pixels should we scroll per line? Gecko uses the height of the
// current line, which means scroll distance changes as you go through the
// page or go to different pages. IE 7 is ~50 px/line, although the value
// seems to vary slightly by page and zoom level. Since IE 7 has a
// smoothing algorithm on scrolling, it can get away with slightly larger
// scroll values without feeling jerky. Here we use 100 px per three lines
// (the default scroll amount on Windows is three lines per wheel tick).
const float cScrollbarPixelsPerLine = 100.0f / 3.0f;
#endif

class PlatformWheelEvent : public PlatformEvent {
public:
    PlatformWheelEvent()
        : PlatformEvent(Type::Wheel)
    {
    }

    PlatformWheelEvent(IntPoint position, IntPoint globalPosition, float deltaX, float deltaY, float wheelTicksX, float wheelTicksY, PlatformWheelEventGranularity granularity, bool shiftKey, bool ctrlKey, bool altKey, bool metaKey)
        : PlatformEvent(Type::Wheel, shiftKey, ctrlKey, altKey, metaKey, { })
        , m_granularity(granularity)
        , m_position(position)
        , m_globalPosition(globalPosition)
        , m_deltaX(deltaX)
        , m_deltaY(deltaY)
        , m_wheelTicksX(wheelTicksX)
        , m_wheelTicksY(wheelTicksY)
    {
    }

#if ENABLE(MAC_GESTURE_EVENTS)
    static PlatformWheelEvent createFromGesture(const PlatformGestureEvent&, double deltaY);
#endif

    PlatformWheelEvent copySwappingDirection() const
    {
        PlatformWheelEvent copy = *this;
        std::swap(copy.m_deltaX, copy.m_deltaY);
        std::swap(copy.m_wheelTicksX, copy.m_wheelTicksY);
        return copy;
    }

    PlatformWheelEvent copyWithDeltaAndVelocity(FloatSize delta, FloatSize velocity) const
    {
        PlatformWheelEvent copy = *this;
        copy.m_deltaX = delta.width();
        copy.m_deltaY = delta.height();
        copy.m_scrollingVelocity = velocity;
        return copy;
    }

    PlatformWheelEvent copyWithVelocity(FloatSize velocity) const
    {
        PlatformWheelEvent copy = *this;
        copy.m_scrollingVelocity = velocity;
        return copy;
    }

    const IntPoint& position() const { return m_position; } // PlatformWindow coordinates.
    const IntPoint& globalPosition() const { return m_globalPosition; } // Screen coordinates.

    float deltaX() const { return m_deltaX; }
    float deltaY() const { return m_deltaY; }
    FloatSize delta() const { return { m_deltaX, m_deltaY}; }

    float wheelTicksX() const { return m_wheelTicksX; }
    float wheelTicksY() const { return m_wheelTicksY; }

    PlatformWheelEventGranularity granularity() const { return m_granularity; }

    bool directionInvertedFromDevice() const { return m_directionInvertedFromDevice; }

    const FloatSize& scrollingVelocity() const { return m_scrollingVelocity; }

    bool hasPreciseScrollingDeltas() const { return m_hasPreciseScrollingDeltas; }
    void setHasPreciseScrollingDeltas(bool hasPreciseScrollingDeltas) { m_hasPreciseScrollingDeltas = hasPreciseScrollingDeltas; }

#if PLATFORM(COCOA)
    unsigned scrollCount() const { return m_scrollCount; }
    FloatSize unacceleratedScrollingDelta() const { return { m_unacceleratedScrollingDeltaX, m_unacceleratedScrollingDeltaY }; }
    
    WallTime ioHIDEventTimestamp() const { return m_ioHIDEventTimestamp; }

    std::optional<FloatSize> rawPlatformDelta() const { return m_rawPlatformDelta; }
#endif

#if ENABLE(ASYNC_SCROLLING)
    bool useLatchedEventElement() const;
    bool isGestureContinuation() const; // The fingers-down part of the gesture excluding momentum.
    bool shouldResetLatching() const;
    bool isEndOfMomentumScroll() const;
#else
    bool useLatchedEventElement() const { return false; }
#endif

    PlatformWheelEventPhase phase() const { return m_phase; }
    PlatformWheelEventPhase momentumPhase() const { return m_momentumPhase; }

#if ENABLE(KINETIC_SCROLLING)
    bool isGestureStart() const;
    bool isGestureCancel() const;

    bool isGestureEvent() const;
    bool isNonGestureEvent() const;

    bool isEndOfNonMomentumScroll() const;
    bool isTransitioningToMomentumScroll() const;
    FloatSize swipeVelocity() const;
#endif

#if PLATFORM(WIN)
    WEBCORE_EXPORT PlatformWheelEvent(HWND, WPARAM, LPARAM, bool isMouseHWheel);
#endif

protected:
    PlatformWheelEventGranularity m_granularity { ScrollByPixelWheelEvent };
    bool m_directionInvertedFromDevice { false };
    bool m_hasPreciseScrollingDeltas { false };

    IntPoint m_position;
    IntPoint m_globalPosition;
    float m_deltaX { 0 };
    float m_deltaY { 0 };
    float m_wheelTicksX { 0 };
    float m_wheelTicksY { 0 };

    // Scrolling velocity in pixels per second.
    FloatSize m_scrollingVelocity;

    PlatformWheelEventPhase m_phase { PlatformWheelEventPhase::None };
    PlatformWheelEventPhase m_momentumPhase { PlatformWheelEventPhase::None };

#if PLATFORM(COCOA)
    WallTime m_ioHIDEventTimestamp;
    std::optional<FloatSize> m_rawPlatformDelta;
    unsigned m_scrollCount { 0 };
    float m_unacceleratedScrollingDeltaX { 0 };
    float m_unacceleratedScrollingDeltaY { 0 };
#endif
};

#if ENABLE(ASYNC_SCROLLING)

inline bool PlatformWheelEvent::useLatchedEventElement() const
{
    return m_phase == PlatformWheelEventPhase::Began
        || m_phase == PlatformWheelEventPhase::Changed
        || m_momentumPhase == PlatformWheelEventPhase::Began
        || m_momentumPhase == PlatformWheelEventPhase::Changed
        || (m_phase == PlatformWheelEventPhase::Ended && m_momentumPhase == PlatformWheelEventPhase::None)
        || (m_phase == PlatformWheelEventPhase::None && m_momentumPhase == PlatformWheelEventPhase::Ended);
}

inline bool PlatformWheelEvent::isGestureContinuation() const
{
    return m_phase == PlatformWheelEventPhase::Changed;
}

inline bool PlatformWheelEvent::shouldResetLatching() const
{
    return m_phase == PlatformWheelEventPhase::Cancelled || m_phase == PlatformWheelEventPhase::MayBegin || (m_phase == PlatformWheelEventPhase::None && m_momentumPhase == PlatformWheelEventPhase::None) || isEndOfMomentumScroll();
}

inline bool PlatformWheelEvent::isEndOfMomentumScroll() const
{
    return m_phase == PlatformWheelEventPhase::None && m_momentumPhase == PlatformWheelEventPhase::Ended;
}

#endif // ENABLE(ASYNC_SCROLLING)

#if ENABLE(KINETIC_SCROLLING)

inline bool PlatformWheelEvent::isGestureEvent() const
{
    return m_phase != PlatformWheelEventPhase::None || m_momentumPhase != PlatformWheelEventPhase::None;
}

inline bool PlatformWheelEvent::isNonGestureEvent() const
{
    return !isGestureEvent();
}

inline bool PlatformWheelEvent::isGestureStart() const
{
    return m_phase == PlatformWheelEventPhase::Began || m_phase == PlatformWheelEventPhase::MayBegin;
}

inline bool PlatformWheelEvent::isGestureCancel() const
{
    return m_phase == PlatformWheelEventPhase::Cancelled;
}

inline bool PlatformWheelEvent::isEndOfNonMomentumScroll() const
{
    return m_phase == PlatformWheelEventPhase::Ended && m_momentumPhase == PlatformWheelEventPhase::None;
}

inline bool PlatformWheelEvent::isTransitioningToMomentumScroll() const
{
    return m_phase == PlatformWheelEventPhase::None && m_momentumPhase == PlatformWheelEventPhase::Began;
}

inline FloatSize PlatformWheelEvent::swipeVelocity() const
{
    // The swiping velocity is stored in the deltas of the event declaring it.
    return isTransitioningToMomentumScroll() ? FloatSize(m_wheelTicksX, m_wheelTicksY) : FloatSize();
}

#endif // ENABLE(KINETIC_SCROLLING)

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const PlatformWheelEvent&);
WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, EventHandling);
WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, WheelScrollGestureState);
WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, PlatformWheelEventPhase);

} // namespace WebCore

