/*
    Copyright (C) 2009 Nokia Corporation and/or its subsidiary(-ies)

    This library is free software; you can redistribute it and/or
    modify it under the terms of the GNU Library General Public
    License as published by the Free Software Foundation; either
    version 2 of the License, or (at your option) any later version.

    This library is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
    Library General Public License for more details.

    You should have received a copy of the GNU Library General Public License
    along with this library; see the file COPYING.LIB.  If not, write to
    the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
    Boston, MA 02110-1301, USA.
*/

#ifndef PlatformTouchEvent_h
#define PlatformTouchEvent_h

#include "PlatformEvent.h"
#include "PlatformTouchPoint.h"
#include <wtf/Vector.h>

#if ENABLE(TOUCH_EVENTS)

namespace WebCore {


class PlatformTouchEvent : public PlatformEvent {
public:
    PlatformTouchEvent()
        : PlatformEvent(PlatformEvent::Type::TouchStart)
    {
    }

    const Vector<PlatformTouchPoint>& touchPoints() const { return m_touchPoints; }

    const Vector<PlatformTouchEvent>& coalescedEvents() const { return m_coalescedEvents; }

    const Vector<PlatformTouchEvent>& predictedEvents() const { return m_predictedEvents; }

#if !ENABLE(IOS_TOUCH_EVENTS)
    // FIXME: since WPE currently does not send touch stationary events, we need to be able to set
    // TouchCancelled touchPoints subsequently
    void setTouchPoints(Vector<PlatformTouchPoint>& touchPoints) { m_touchPoints = touchPoints; }
#endif

protected:
    Vector<PlatformTouchPoint> m_touchPoints;
    Vector<PlatformTouchEvent> m_coalescedEvents;
    Vector<PlatformTouchEvent> m_predictedEvents;
};

}

#endif // ENABLE(TOUCH_EVENTS)

#endif // PlatformTouchEvent_h
