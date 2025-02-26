/*
 * Copyright (C) 2001 Peter Kelly (pmk@post.com)
 * Copyright (C) 2001 Tobias Anton (anton@stud.fbi.fh-darmstadt.de)
 * Copyright (C) 2006 Samuel Weinig (sam.weinig@gmail.com)
 * Copyright (C) 2003, 2004, 2005, 2006, 2008, 2010, 2013 Apple Inc. All rights reserved.
 * Copyright (C) 2013 Samsung Electronics. All rights reserved.
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Library General Public License
 * along with this library; see the file COPYING.LIB.  If not, write to
 * the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 * Boston, MA 02110-1301, USA.
 *
 */

#pragma once

#include "MouseEvent.h"
#include "PlatformWheelEvent.h"

namespace WebCore {

class WheelEvent final : public MouseEvent {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(WheelEvent);
public:
    static constexpr int TickMultiplier = 120;

    enum {
        DOM_DELTA_PIXEL = 0,
        DOM_DELTA_LINE,
        DOM_DELTA_PAGE
    };

    static Ref<WheelEvent> create(const PlatformWheelEvent&, RefPtr<WindowProxy>&&, IsCancelable = IsCancelable::Yes);
    static Ref<WheelEvent> createForBindings();

    struct Init : MouseEventInit {
        double deltaX { 0 };
        double deltaY { 0 };
        double deltaZ { 0 };
        unsigned deltaMode { DOM_DELTA_PIXEL };
        int wheelDeltaX { 0 }; // Deprecated.
        int wheelDeltaY { 0 }; // Deprecated.
    };

    static Ref<WheelEvent> create(const AtomString& type, const Init&);

    const std::optional<PlatformWheelEvent>& underlyingPlatformEvent() const { return m_underlyingPlatformEvent; }

    double deltaX() const { return m_deltaX; } // Positive when scrolling right.
    double deltaY() const { return m_deltaY; } // Positive when scrolling down.
    double deltaZ() const { return m_deltaZ; }
    int wheelDelta() const { return wheelDeltaY() ? wheelDeltaY() : wheelDeltaX(); } // Deprecated.
    int wheelDeltaX() const { return m_wheelDelta.x(); } // Deprecated, negative when scrolling right.
    int wheelDeltaY() const { return m_wheelDelta.y(); } // Deprecated, negative when scrolling down.
    unsigned deltaMode() const { return m_deltaMode; }

    bool webkitDirectionInvertedFromDevice() const { return m_underlyingPlatformEvent && m_underlyingPlatformEvent.value().directionInvertedFromDevice(); }

#if PLATFORM(MAC)
    PlatformWheelEventPhase phase() const { return m_underlyingPlatformEvent ? m_underlyingPlatformEvent.value().phase() : PlatformWheelEventPhase::None; }
    PlatformWheelEventPhase momentumPhase() const { return m_underlyingPlatformEvent ? m_underlyingPlatformEvent.value().momentumPhase() : PlatformWheelEventPhase::None; }
#endif

private:
    WheelEvent();
    WheelEvent(const AtomString&, const Init&);
    WheelEvent(const PlatformWheelEvent&, RefPtr<WindowProxy>&&, IsCancelable);

    bool isWheelEvent() const final;

    IntPoint m_wheelDelta;
    double m_deltaX { 0 };
    double m_deltaY { 0 };
    double m_deltaZ { 0 };
    unsigned m_deltaMode { DOM_DELTA_PIXEL };
    std::optional<PlatformWheelEvent> m_underlyingPlatformEvent;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_EVENT(WheelEvent)
