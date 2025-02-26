/*
 * Copyright (C) 2018 Apple Inc. All rights reserved.
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

#include "EventNames.h"
#include "MouseEvent.h"
#include "Node.h"
#include "PointerEventTypeNames.h"
#include "PointerID.h"
#include <wtf/text/WTFString.h>

#if ENABLE(TOUCH_EVENTS) && PLATFORM(IOS_FAMILY)
#include "PlatformTouchEventIOS.h"
#else
#include "PlatformTouchEvent.h"
#endif

#if ENABLE(TOUCH_EVENTS) && PLATFORM(WPE)
#include "PlatformTouchEvent.h"
#endif

namespace WebCore {

class Node;

class PointerEvent : public MouseEvent {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(PointerEvent);
public:
    struct Init : MouseEventInit {
        PointerID pointerId { mousePointerID };
        double width { 1 };
        double height { 1 };
        float pressure { 0 };
        float tangentialPressure { 0 };
        long tiltX { 0 };
        long tiltY { 0 };
        long twist { 0 };
        double altitudeAngle { piOverTwoDouble };
        double azimuthAngle { 0 };
        String pointerType { mousePointerEventType() };
        bool isPrimary { false };
        Vector<Ref<PointerEvent>> coalescedEvents;
        Vector<Ref<PointerEvent>> predictedEvents;
    };

    enum class IsPrimary : bool { No, Yes };

    static Ref<PointerEvent> create(const AtomString& type, Init&& initializer)
    {
        return adoptRef(*new PointerEvent(type, WTFMove(initializer), IsTrusted::No));
    }

    static Ref<PointerEvent> createForPointerCapture(const AtomString& type, PointerID pointerId, bool isPrimary, String pointerType)
    {
        Init initializer;
        initializer.bubbles = true;
        initializer.pointerId = pointerId;
        initializer.isPrimary = isPrimary;
        initializer.pointerType = pointerType;
        initializer.composed = true;
        return adoptRef(*new PointerEvent(type, WTFMove(initializer), IsTrusted::Yes));
    }

    static Ref<PointerEvent> createForBindings()
    {
        return adoptRef(*new PointerEvent);
    }

    static AtomString typeFromMouseEventType(const AtomString&);

    static RefPtr<PointerEvent> create(MouseButton, const MouseEvent&, PointerID, const String& pointerType);
    static Ref<PointerEvent> create(const AtomString& type, MouseButton, const MouseEvent&, PointerID, const String& pointerType);
    static Ref<PointerEvent> create(const AtomString& type, MouseButton, const MouseEvent&, PointerID, const String& pointerType, CanBubble, IsCancelable);
    static Ref<PointerEvent> create(const AtomString& type, PointerID, const String& pointerType, IsPrimary = IsPrimary::No);

#if ENABLE(TOUCH_EVENTS)
    static Ref<PointerEvent> create(const PlatformTouchEvent&, const Vector<Ref<PointerEvent>>& coalescedEvents, const Vector<Ref<PointerEvent>>& predictedEvents, unsigned touchIndex, bool isPrimary, Ref<WindowProxy>&&, const IntPoint& touchDelta = { });
    static Ref<PointerEvent> create(const PlatformTouchEvent&, const Vector<Ref<PointerEvent>>& coalescedEvents, const Vector<Ref<PointerEvent>>& predictedEvents, CanBubble, IsCancelable, unsigned touchIndex, bool isPrimary, Ref<WindowProxy>&& view, const IntPoint& touchDelta = { });
    static Ref<PointerEvent> create(const AtomString& type, const PlatformTouchEvent&, const Vector<Ref<PointerEvent>>& coalescedEvents, const Vector<Ref<PointerEvent>>& predictedEvents, unsigned touchIndex, bool isPrimary, Ref<WindowProxy>&&, const IntPoint& touchDelta = { });
#endif

    virtual ~PointerEvent();

    PointerID pointerId() const { return m_pointerId; }
    double width() const { return m_width; }
    double height() const { return m_height; }
    float pressure() const { return m_pressure; }
    float tangentialPressure() const { return m_tangentialPressure; }
    long tiltX() const { return m_tiltX; }
    long tiltY() const { return m_tiltY; }
    long twist() const { return m_twist; }
    double altitudeAngle() const { return m_altitudeAngle; }
    double azimuthAngle() const { return m_azimuthAngle; }
    String pointerType() const { return m_pointerType; }
    bool isPrimary() const { return m_isPrimary; }

    Vector<Ref<PointerEvent>> getCoalescedEvents() const;

    Vector<Ref<PointerEvent>> getPredictedEvents() const;

    void receivedTarget() final;

    bool isPointerEvent() const final { return true; }

    // https://w3c.github.io/pointerevents/#attributes-and-default-actions
    // Many user agents expose non-standard attributes fromElement and toElement in MouseEvents to
    // support legacy content. In those user agents, the values of those (inherited) attributes in
    // PointerEvents must be null to encourage the use of the standardized alternates (i.e. target
    // and relatedTarget).
    RefPtr<Node> toElement() const final { return nullptr; }
    RefPtr<Node> fromElement() const final { return nullptr; }

    static bool typeRequiresResolvedButton(const AtomString& type);
    static MouseButton buttonForType(const AtomString& type) { return !typeRequiresResolvedButton(type) ? MouseButton::PointerHasNotChanged : MouseButton::Left; }

protected:
    static CanBubble typeCanBubble(const AtomString& type) { return typeIsEnterOrLeave(type) ? CanBubble::No : CanBubble::Yes; }
    static IsCancelable typeIsCancelable(const AtomString& type) { return typeIsEnterOrLeave(type) ? IsCancelable::No : IsCancelable::Yes; }
    static IsComposed typeIsComposed(const AtomString& type) { return typeIsEnterOrLeave(type) ? IsComposed::No : IsComposed::Yes; }

    PointerEvent(const AtomString& type, MouseButton, const MouseEvent&, PointerID, const String& pointerType, CanBubble, IsCancelable, IsComposed);

private:
    static bool typeIsEnterOrLeave(const AtomString& type);
    static unsigned short buttonsForType(const AtomString& type)
    {
        // We have contact with the touch surface for most events except when we've released the touch or canceled it.
        auto& eventNames = WebCore::eventNames();
        return (type == eventNames.pointerupEvent || type == eventNames.pointeroutEvent || type == eventNames.pointerleaveEvent || type == eventNames.pointercancelEvent) ? 0 : 1;
    }
    static float pressureForPressureInsensitiveInputDevices(unsigned short buttons)
    {
        // https://www.w3.org/TR/pointerevents/#dfn-active-buttons-state
        bool isInActiveButtonsState = buttons;
        // https://www.w3.org/TR/pointerevents/#dom-pointerevent-pressure
        return isInActiveButtonsState ? 0.5 : 0;
    }

    struct PointerEventTilt {
        long tiltX;
        long tiltY;
    };

    struct PointerEventAngle {
        double altitudeAngle;
        double azimuthAngle;
    };

    static PointerEventAngle angleFromTilt(long tiltX, long tiltY);
    static PointerEventTilt tiltFromAngle(double altitudeAngle, double azimuthAngle);

    PointerEvent();
    PointerEvent(const AtomString&, Init&&, IsTrusted);
    PointerEvent(const AtomString& type, PointerID, const String& pointerType, IsPrimary);
#if ENABLE(TOUCH_EVENTS)
    PointerEvent(const AtomString& type, const PlatformTouchEvent&, const Vector<Ref<PointerEvent>>& coalescedEvents, const Vector<Ref<PointerEvent>>& predictedEvents, CanBubble canBubble, IsCancelable isCancelable, unsigned touchIndex, bool isPrimary, Ref<WindowProxy>&&, const IntPoint& touchDelta = { });
#endif

    PointerID m_pointerId { mousePointerID };
    double m_width { 1 };
    double m_height { 1 };
    float m_pressure { 0 };
    float m_tangentialPressure { 0 };
    long m_tiltX { 0 };
    long m_tiltY { 0 };
    long m_twist { 0 };
    double m_altitudeAngle { piOverTwoDouble };
    double m_azimuthAngle { 0 };
    String m_pointerType { mousePointerEventType() };
    bool m_isPrimary { false };
    Vector<Ref<PointerEvent>> m_coalescedEvents;
    Vector<Ref<PointerEvent>> m_predictedEvents;
};

inline bool PointerEvent::typeIsEnterOrLeave(const AtomString& type)
{
    auto& eventNames = WebCore::eventNames();
    return type == eventNames.pointerenterEvent || type == eventNames.pointerleaveEvent;
}

inline bool PointerEvent::typeRequiresResolvedButton(const AtomString& type)
{
    auto& eventNames = WebCore::eventNames();
    return type == eventNames.pointerupEvent
        || type == eventNames.pointerdownEvent
        || type == eventNames.clickEvent
        || type == eventNames.auxclickEvent
        || type == eventNames.contextmenuEvent;
}

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_EVENT(PointerEvent)
