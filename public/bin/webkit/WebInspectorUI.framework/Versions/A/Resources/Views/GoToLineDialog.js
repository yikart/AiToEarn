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

WI.GoToLineDialog = class GoToLineDialog extends WI.Dialog
{
    constructor(delegate)
    {
        super(delegate);

        this.element.classList.add("go-to-line-dialog");

        let field = this.element.appendChild(document.createElement("div"));

        this._input = field.appendChild(document.createElement("input"));
        this._input.type = "text";
        this._input.placeholder = WI.UIString("Line Number");
        this._input.spellcheck = false;

        this._clearIcon = field.appendChild(document.createElement("img"));

        this._input.addEventListener("input", this);
        this._input.addEventListener("keydown", this);
        this._input.addEventListener("blur", this);
        this._clearIcon.addEventListener("mousedown", this);
        this._clearIcon.addEventListener("click", this);

        this._dismissing = false;
    }

    // Protected

    handleEvent(event)
    {
        switch (event.type) {
        case "input":
            this._handleInputEvent(event);
            break;
        case "keydown":
            this._handleKeydownEvent(event);
            break;
        case "blur":
            this._handleBlurEvent(event);
            break;
        case "mousedown":
            this._handleMousedownEvent(event);
            break;
        case "click":
            this._handleClickEvent(event);
            break;
        }
    }

    didPresentDialog()
    {
        this._input.focus();
        this._clear();
    }

    // Private

    _handleInputEvent(event)
    {
        let force = this._input.value !== "";
        this.element.classList.toggle(WI.GoToLineDialog.NonEmptyClassName, force);
    }

    _handleKeydownEvent(event)
    {
        if (event.keyCode === WI.KeyboardShortcut.Key.Escape.keyCode) {
            if (this._input.value === "") {
                this.dismiss();
                event.preventDefault();
            } else
                this._clear();

            event.preventDefault();
        } else if (event.keyCode === WI.KeyboardShortcut.Key.Enter.keyCode) {
            let value = parseInt(this._input.value, 10);

            if (this.representedObjectIsValid(value)) {
                this.dismiss(value);
                event.preventDefault();
                return;
            }

            this._input.select();

            InspectorFrontendHost.beep();
        }
    }

    _handleBlurEvent(event)
    {
        this.dismiss();
    }

    _handleMousedownEvent(event)
    {
        this._input.select();
        // This ensures we don't get a "blur" event triggered for the text field
        // which would end up dimissing the dialog, which is not the intent.
        event.preventDefault();
    }

    _handleClickEvent(event)
    {
        this._clear();
    }

    _clear()
    {
        this._input.value = "";
        this.element.classList.remove(WI.GoToLineDialog.NonEmptyClassName);
    }
};

WI.GoToLineDialog.NonEmptyClassName = "non-empty";
