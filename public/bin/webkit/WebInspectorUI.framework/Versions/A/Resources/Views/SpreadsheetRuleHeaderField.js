/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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

WI.SpreadsheetRuleHeaderField = class SpreadsheetRuleHeaderField extends WI.Object
{
    constructor(delegate, element)
    {
        super();

        this._delegate = delegate;
        this._element = element;
        this._element.classList.add("spreadsheet-rule-header-field");

        this._element.addEventListener("mousedown", this._handleMouseDown.bind(this));
        this._element.addEventListener("mouseup", this._handleMouseUp.bind(this));
        this._element.addEventListener("blur", this._handleBlur.bind(this));
        this._element.addEventListener("keydown", this._handleKeyDown.bind(this));

        this._editing = false;
        this._valueBeforeEditing = "";
        this._handledMouseDown = false;
        this._tabNavigationDirection = null;
    }

    // Public

    get element() { return this._element; }
    get editing() { return this._editing; }

    startEditing()
    {
        if (this._editing)
            return;

        this._editing = true;
        this._valueBeforeEditing = this._element.textContent;

        let element = this._element;
        element.classList.add("editing");
        element.contentEditable = "plaintext-only";
        element.spellcheck = false;
        element.focus();

        // Disable syntax highlighting.
        element.textContent = element.textContent;

        this._selectText();

        this.dispatchEventToListeners(WI.SpreadsheetRuleHeaderField.Event.StartedEditing);
    }

    stopEditing()
    {
        if (!this._editing)
            return;

        this._editing = false;
        this._valueBeforeEditing = "";
        this._element.classList.remove("editing");
        this._element.contentEditable = false;
        this._tabNavigationDirection = null;

        this.dispatchEventToListeners(WI.SpreadsheetRuleHeaderField.Event.StoppedEditing);
    }

    // Private

    _selectText()
    {
        window.getSelection().selectAllChildren(this._element);
    }

    _handleMouseDown(event)
    {
        this._handledMouseDown = true;
    }

    _handleMouseUp(event)
    {
        if (!this._handledMouseDown)
            return;

        this._handledMouseDown = false;

        this.startEditing();
    }

    _handleBlur(event)
    {
        // Keep editing after tabbing out of Web Inspector window and back.
        if (document.activeElement === this._element)
            return;

        let changed = this._element.textContent !== this._valueBeforeEditing;
        this._delegate?.spreadsheetRuleHeaderFieldDidCommit?.(this, changed);

        if (this._tabNavigationDirection)
            this._delegate?.spreadsheetRuleHeaderFieldWillNavigate?.(this, this._tabNavigationDirection);

        this.stopEditing();
    }

    _handleKeyDown(event)
    {
        if (event.key === "Enter" && !this._editing) {
            event.stop();

            this.startEditing();
            return;
        }

        if (!this._editing)
            return;

        if (event.key === "Enter" || event.key === "Tab") {
            event.stop();

            this._tabNavigationDirection = (event.shiftKey && event.key === "Tab") ? "backward" : "forward";
            this._element.blur();
            return;
        }

        if (event.key === "Escape") {
            event.stop();

            this.stopEditing();

            this._delegate?.spreadsheetRuleHeaderFieldDidDiscard?.(this);
        }
    }
};

WI.SpreadsheetRuleHeaderField.Event = {
    StartedEditing: "spreadsheet-rule-header-field-started-editing",
    StoppedEditing: "spreadsheet-rule-header-field-stopped-editing",
};
