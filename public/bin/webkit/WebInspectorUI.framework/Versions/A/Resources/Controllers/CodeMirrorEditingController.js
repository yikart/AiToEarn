/*
 * Copyright (C) 2014 Apple Inc. All rights reserved.
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

WI.CodeMirrorEditingController = class CodeMirrorEditingController extends WI.Object
{
    constructor(codeMirror, marker)
    {
        super();

        this._codeMirror = codeMirror;
        this._marker = marker;
        this._delegate = null;

        this._range = marker.range;

        // The value must support .toString() and .copy() methods.
        this._value = this.initialValue;

        this._keyboardShortcutEsc = new WI.KeyboardShortcut(null, WI.KeyboardShortcut.Key.Escape);
    }

    // Public

    get marker()
    {
        return this._marker;
    }

    get range()
    {
        return this._range;
    }

    get value()
    {
        return this._value;
    }

    set value(value)
    {
        this.text = value.toString();
        this._value = value;
    }

    get delegate()
    {
        return this._delegate;
    }

    set delegate(delegate)
    {
        this._delegate = delegate;
    }

    get text()
    {
        var from = {line: this._range.startLine, ch: this._range.startColumn};
        var to = {line: this._range.endLine, ch: this._range.endColumn};
        return this._codeMirror.getRange(from, to);
    }

    set text(text)
    {
        var from = {line: this._range.startLine, ch: this._range.startColumn};
        var to = {line: this._range.endLine, ch: this._range.endColumn};
        this._codeMirror.replaceRange(text, from, to);

        var lines = text.split("\n");
        var endLine = this._range.startLine + lines.length - 1;
        var endColumn = lines.length > 1 ? lines.lastValue.length : this._range.startColumn + text.length;
        this._range = new WI.TextRange(this._range.startLine, this._range.startColumn, endLine, endColumn);
    }

    get initialValue()
    {
        // Implemented by subclasses.
        return this.text;
    }

    get cssClassName()
    {
        // Implemented by subclasses.
        return "";
    }

    get popover()
    {
        return this._popover;
    }

    get popoverPreferredEdges()
    {
        // Best to display the popover to the left or above the edited range since its end position may change, but not its start
        // position. This way we minimize the chances of overlaying the edited range as it changes.
        return [WI.RectEdge.MIN_X, WI.RectEdge.MIN_Y, WI.RectEdge.MAX_Y, WI.RectEdge.MAX_X];
    }

    popoverTargetFrameWithRects(rects)
    {
        return WI.Rect.unionOfRects(rects);
    }

    presentHoverMenu()
    {
        if (!this.cssClassName)
            return;

        this._hoverMenu = new WI.HoverMenu(this);
        this._hoverMenu.element.classList.add(this.cssClassName);
        this._rects = this._marker.rects;
        this._hoverMenu.present(this._rects);
    }

    dismissHoverMenu(discrete)
    {
        if (!this._hoverMenu)
            return;

        this._hoverMenu.dismiss(discrete);
    }

    popoverWillPresent(popover)
    {
        // Implemented by subclasses.
    }

    popoverDidPresent(popover)
    {
        // Implemented by subclasses.
    }

    popoverDidDismiss(popover)
    {
        // Implemented by subclasses.
    }

    // Protected

    handleKeydownEvent(event)
    {
        if (!this._keyboardShortcutEsc.matchesEvent(event) || !this._popover.visible)
            return false;

        this.value = this._originalValue;
        this._popover.dismiss();

        return true;
    }

    hoverMenuButtonWasPressed(hoverMenu)
    {
        this._popover = new WI.Popover(this);
        this.popoverWillPresent(this._popover);
        this._popover.present(this.popoverTargetFrameWithRects(this._rects).pad(2), this.popoverPreferredEdges);
        this.popoverDidPresent(this._popover);

        WI.addWindowKeydownListener(this);

        hoverMenu.dismiss();

        if (this._delegate && typeof this._delegate.editingControllerDidStartEditing === "function")
            this._delegate.editingControllerDidStartEditing(this);

        this._originalValue = this._value.copy();
    }

    didDismissPopover(popover)
    {
        delete this._popover;
        delete this._originalValue;

        WI.removeWindowKeydownListener(this);
        this.popoverDidDismiss();

        if (this._delegate && typeof this._delegate.editingControllerDidFinishEditing === "function")
            this._delegate.editingControllerDidFinishEditing(this);
    }
};
