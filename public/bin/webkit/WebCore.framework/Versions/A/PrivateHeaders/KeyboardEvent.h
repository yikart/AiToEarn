/*
 * Copyright (C) 2001 Peter Kelly (pmk@post.com)
 * Copyright (C) 2001 Tobias Anton (anton@stud.fbi.fh-darmstadt.de)
 * Copyright (C) 2006 Samuel Weinig (sam.weinig@gmail.com)
 * Copyright (C) 2003-2024 Apple Inc. All rights reserved.
 * Copyright (C) 2017 Google Inc. All rights reserved.
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
#include "KeypressCommand.h"
#include "UIEventWithKeyState.h"
#include <memory>
#include <wtf/Vector.h>

namespace WebCore {

class Node;
class PlatformKeyboardEvent;

class KeyboardEvent final : public UIEventWithKeyState {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(KeyboardEvent);
public:
    enum KeyLocationCode {
        DOM_KEY_LOCATION_STANDARD = 0x00,
        DOM_KEY_LOCATION_LEFT = 0x01,
        DOM_KEY_LOCATION_RIGHT = 0x02,
        DOM_KEY_LOCATION_NUMPAD = 0x03
    };

    WEBCORE_EXPORT static Ref<KeyboardEvent> create(const PlatformKeyboardEvent&, RefPtr<WindowProxy>&&);
    static Ref<KeyboardEvent> createForBindings();

    struct Init : public EventModifierInit {
        String key;
        String code;
        unsigned location;
        bool repeat;
        bool isComposing;

        // Legacy.
        AtomString keyIdentifier;
        unsigned charCode;
        unsigned keyCode;
        unsigned which;
    };

    static Ref<KeyboardEvent> create(const AtomString& type, const Init&, IsTrusted = IsTrusted::No);

    virtual ~KeyboardEvent();
    
    WEBCORE_EXPORT void initKeyboardEvent(const AtomString& type, bool canBubble, bool cancelable, RefPtr<WindowProxy>&&,
        const AtomString& keyIdentifier, unsigned location,
        bool ctrlKey, bool altKey, bool shiftKey, bool metaKey);
    
    const String& key() const { return m_key; }
    const String& code() const { return m_code; }
    const AtomString& keyIdentifier() const { return m_keyIdentifier; }
    unsigned location() const { return m_location; }
    bool repeat() const { return m_repeat; }

    const PlatformKeyboardEvent* underlyingPlatformEvent() const { return m_underlyingPlatformEvent.get(); }
    PlatformKeyboardEvent* underlyingPlatformEvent() { return m_underlyingPlatformEvent.get(); }

    WEBCORE_EXPORT int keyCode() const; // key code for keydown and keyup, character for keypress
    WEBCORE_EXPORT int charCode() const; // character code for keypress, 0 for keydown and keyup

    bool isKeyboardEvent() const final;
    unsigned which() const final;

    bool isComposing() const { return m_isComposing; }

#if PLATFORM(COCOA)
    bool handledByInputMethod() const { return m_handledByInputMethod; }
    const Vector<KeypressCommand>& keypressCommands() const { return m_keypressCommands; }
    Vector<KeypressCommand>& keypressCommands() { return m_keypressCommands; }
#endif

private:
    KeyboardEvent();
    KeyboardEvent(const PlatformKeyboardEvent&, RefPtr<WindowProxy>&&);
    KeyboardEvent(const AtomString&, const Init&, IsTrusted = IsTrusted::No);

    std::unique_ptr<PlatformKeyboardEvent> m_underlyingPlatformEvent;
    String m_key;
    String m_code;
    AtomString m_keyIdentifier;
    unsigned m_location { DOM_KEY_LOCATION_STANDARD };
    bool m_repeat { false };
    bool m_isComposing { false };
    std::optional<unsigned> m_charCode;
    std::optional<unsigned> m_keyCode;
    std::optional<unsigned> m_which;

#if PLATFORM(COCOA)
    // Commands that were sent by AppKit when interpreting the event. Doesn't include input method commands.
    bool m_handledByInputMethod { false };
    Vector<KeypressCommand> m_keypressCommands;
#endif
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_EVENT(KeyboardEvent)
