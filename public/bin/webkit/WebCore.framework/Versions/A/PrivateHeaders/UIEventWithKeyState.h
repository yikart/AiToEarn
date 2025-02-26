/*
 * Copyright (C) 2001 Peter Kelly (pmk@post.com)
 * Copyright (C) 2001 Tobias Anton (anton@stud.fbi.fh-darmstadt.de)
 * Copyright (C) 2006 Samuel Weinig (sam.weinig@gmail.com)
 * Copyright (C) 2003, 2004, 2005, 2006, 2008, 2013 Apple Inc. All rights reserved.
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

#include "EventModifierInit.h"
#include "PlatformEvent.h"
#include "UIEvent.h"

namespace WebCore {

class UIEventWithKeyState : public UIEvent {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(UIEventWithKeyState);
public:
    using Modifier = PlatformEvent::Modifier;

    bool ctrlKey() const { return m_modifiers.contains(Modifier::ControlKey); }
    bool shiftKey() const { return m_modifiers.contains(Modifier::ShiftKey); }
    bool altKey() const { return m_modifiers.contains(Modifier::AltKey); }
    bool metaKey() const { return m_modifiers.contains(Modifier::MetaKey); }
    bool capsLockKey() const { return m_modifiers.contains(Modifier::CapsLockKey); }

    OptionSet<Modifier> modifierKeys() const { return m_modifiers; }

    WEBCORE_EXPORT bool getModifierState(const String& keyIdentifier) const;

protected:
    UIEventWithKeyState(enum EventInterfaceType eventInterface)
        : UIEvent(eventInterface)
    {
    }

    UIEventWithKeyState(enum EventInterfaceType eventInterface, const AtomString& type, CanBubble canBubble, IsCancelable cancelable, IsComposed isComposed,
        RefPtr<WindowProxy>&& view, int detail, OptionSet<Modifier> modifiers)
        : UIEvent(eventInterface, type, canBubble, cancelable, isComposed, WTFMove(view), detail)
        , m_modifiers(modifiers)
    {
    }

    UIEventWithKeyState(enum EventInterfaceType eventInterface, const AtomString& type, CanBubble canBubble, IsCancelable cancelable, IsComposed isComposed,
        MonotonicTime timestamp, RefPtr<WindowProxy>&& view, int detail, OptionSet<Modifier> modifiers, IsTrusted isTrusted)
        : UIEvent(eventInterface, type, canBubble, cancelable, isComposed, timestamp, WTFMove(view), detail, isTrusted)
        , m_modifiers(modifiers)
    {
    }

    UIEventWithKeyState(enum EventInterfaceType eventInterface, const AtomString& type, const EventModifierInit& initializer, IsTrusted isTrusted = IsTrusted::No)
        : UIEvent(eventInterface, type, initializer, isTrusted)
        , m_modifiers(modifiersFromInitializer(initializer))
    {
    }

    void setModifierKeys(bool ctrlKey, bool altKey, bool shiftKey, bool metaKey);

private:
    OptionSet<Modifier> m_modifiers;

    static OptionSet<Modifier> modifiersFromInitializer(const EventModifierInit& initializer);
};

UIEventWithKeyState* findEventWithKeyState(Event*);

} // namespace WebCore
