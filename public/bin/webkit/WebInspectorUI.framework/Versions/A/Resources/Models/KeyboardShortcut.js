/*
 * Copyright (C) 2013, 2015 Apple Inc. All rights reserved.
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

WI.KeyboardShortcut = class KeyboardShortcut
{
    constructor(modifiers, key, callback, targetElement)
    {
        console.assert(key);
        console.assert(!callback || typeof callback === "function");
        console.assert(!targetElement || targetElement instanceof Element);

        if (typeof key === "string") {
            key = key[0].toUpperCase();
            key = new WI.Key(key.charCodeAt(0), key);
        }

        if (callback && !targetElement)
            targetElement = document;

        this._modifiers = modifiers || WI.KeyboardShortcut.Modifier.None;
        this._key = key;
        this._targetElement = targetElement;
        this._callback = callback;
        this._disabled = false;
        this._implicitlyPreventsDefault = true;

        if (targetElement) {
            var targetKeyboardShortcuts = targetElement._keyboardShortcuts;
            if (!targetKeyboardShortcuts)
                targetKeyboardShortcuts = targetElement._keyboardShortcuts = [];

            targetKeyboardShortcuts.push(this);

            if (!WI.KeyboardShortcut._registeredKeyDownListener) {
                WI.KeyboardShortcut._registeredKeyDownListener = true;
                window.addEventListener("keydown", WI.KeyboardShortcut._handleKeyDown);
            }
        }
    }

    // Static

    static _handleKeyDown(event)
    {
        if (event.defaultPrevented)
            return;

        for (var targetElement = event.target; targetElement; targetElement = targetElement.parentNode) {
            if (!targetElement._keyboardShortcuts)
                continue;

            for (var i = 0; i < targetElement._keyboardShortcuts.length; ++i) {
                var keyboardShortcut = targetElement._keyboardShortcuts[i];
                if (!keyboardShortcut.matchesEvent(event))
                    continue;

                if (!keyboardShortcut.callback)
                    continue;

                keyboardShortcut.callback(event, keyboardShortcut);

                if (keyboardShortcut.implicitlyPreventsDefault)
                    event.preventDefault();

                return;
            }
        }
    }

    // Public

    get modifiers()
    {
        return this._modifiers;
    }

    get key()
    {
        return this._key;
    }

    get displayName()
    {
        var result = "";

        if (this._modifiers & WI.KeyboardShortcut.Modifier.Control)
            result += "\u2303";
        if (this._modifiers & WI.KeyboardShortcut.Modifier.Option)
            result += WI.Platform.name === "mac" ? "\u2325" : "\u2387";
        if (this._modifiers & WI.KeyboardShortcut.Modifier.Shift)
            result += "\u21e7";
        if (this._modifiers & WI.KeyboardShortcut.Modifier.Command)
            result += "\u2318";

        result += this._key.toString();

        return result;
    }

    get callback()
    {
        return this._callback;
    }

    set callback(callback)
    {
        console.assert(!callback || typeof callback === "function");

        this._callback = callback || null;
    }

    get disabled()
    {
        return this._disabled;
    }

    set disabled(disabled)
    {
        this._disabled = disabled || false;
    }

    get implicitlyPreventsDefault()
    {
        return this._implicitlyPreventsDefault;
    }

    set implicitlyPreventsDefault(implicitly)
    {
        this._implicitlyPreventsDefault = implicitly;
    }

    unbind()
    {
        this._disabled = true;

        if (!this._targetElement)
            return;

        var targetKeyboardShortcuts = this._targetElement._keyboardShortcuts;
        if (!targetKeyboardShortcuts)
            return;

        targetKeyboardShortcuts.remove(this);
    }

    matchesEvent(event)
    {
        if (this._disabled)
            return false;

        if (this._key.keyCode !== event.keyCode)
            return false;

        var eventModifiers = WI.KeyboardShortcut.Modifier.None;
        if (event.shiftKey)
            eventModifiers |= WI.KeyboardShortcut.Modifier.Shift;
        if (event.ctrlKey)
            eventModifiers |= WI.KeyboardShortcut.Modifier.Control;
        if (event.altKey)
            eventModifiers |= WI.KeyboardShortcut.Modifier.Option;
        if (event.metaKey)
            eventModifiers |= WI.KeyboardShortcut.Modifier.Command;
        return this._modifiers === eventModifiers;
    }
};

WI.Key = class Key
{
    constructor(keyCode, displayName)
    {
        this._keyCode = keyCode;
        this._displayName = displayName;
    }

    // Public

    get keyCode()
    {
        return this._keyCode;
    }

    get displayName()
    {
        return this._displayName;
    }

    toString()
    {
        return this._displayName;
    }
};

WI.KeyboardShortcut.Modifier = {
    None: 0,
    Shift: 1,
    Control: 2,
    Option: 4,
    Command: 8,

    get CommandOrControl()
    {
        return WI.Platform.name === "mac" ? this.Command : this.Control;
    }
};

WI.KeyboardShortcut.Key = {
    Backspace: new WI.Key(8, "\u232b"),
    Tab: new WI.Key(9, "\u21e5"),
    Enter: new WI.Key(13, "\u21a9"),
    Escape: new WI.Key(27, "\u238b"),
    Space: new WI.Key(32, "Space"), // UIString populated in WI.loaded.
    PageUp: new WI.Key(33, "\u21de"),
    PageDown: new WI.Key(34, "\u21df"),
    End: new WI.Key(35, "\u2198"),
    Home: new WI.Key(36, "\u2196"),
    Left: new WI.Key(37, "\u2190"),
    Up: new WI.Key(38, "\u2191"),
    Right: new WI.Key(39, "\u2192"),
    Down: new WI.Key(40, "\u2193"),
    Delete: new WI.Key(46, "\u2326"),
    Zero: new WI.Key(48, "0"),
    F1: new WI.Key(112, "F1"),
    F2: new WI.Key(113, "F2"),
    F3: new WI.Key(114, "F3"),
    F4: new WI.Key(115, "F4"),
    F5: new WI.Key(116, "F5"),
    F6: new WI.Key(117, "F6"),
    F7: new WI.Key(118, "F7"),
    F8: new WI.Key(119, "F8"),
    F9: new WI.Key(120, "F9"),
    F10: new WI.Key(121, "F10"),
    F11: new WI.Key(122, "F11"),
    F12: new WI.Key(123, "F12"),
    Semicolon: new WI.Key(186, ";"),
    Plus: new WI.Key(187, "+"),
    Comma: new WI.Key(188, ","),
    Minus: new WI.Key(189, "-"),
    Period: new WI.Key(190, "."),
    Slash: new WI.Key(191, "/"),
    Apostrophe: new WI.Key(192, "`"),
    LeftCurlyBrace: new WI.Key(219, "{"),
    Backslash: new WI.Key(220, "\\"),
    RightCurlyBrace: new WI.Key(221, "}"),
    SingleQuote: new WI.Key(222, "'")
};
