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

WI.InputPopover = class InputPopover extends WI.Popover
{
    constructor(identifier, message, delegate)
    {
        super(delegate);

        this._identifier = identifier;
        this._message = message;

        this._targetElement = null;
        this._preferredEdges = null;

        this.windowResizeHandler = this._presentOverTargetElement.bind(this);
    }

    get identifier() { return this._identifier; }
    get value()
    {
        return this._inputElement?.value ?? "";
    }

    show(targetElement, preferredEdges)
    {
        this._targetElement = targetElement;
        this._preferredEdges = preferredEdges;

        let contentElement = document.createElement("div");
        contentElement.classList.add("input-popover-content", this._identifier);

        if (this._message) {
            let label = document.createElement("div");
            label.classList.add("label");
            label.textContent = this._message;
            contentElement.appendChild(label);
        }

        this._inputElement = document.createElement("input");
        this._inputElement.spellcheck = false;

        this._inputElement.addEventListener("keydown", (event) => {
            if (isEnterKey(event))
                this.dismiss();
        });

        contentElement.appendChild(this._inputElement);
        this.content = contentElement;

        this._presentOverTargetElement();
    }

    // Private

    _presentOverTargetElement()
    {
        if (!this._targetElement)
            return;

        let targetFrame = WI.Rect.rectFromClientRect(this._targetElement.getBoundingClientRect());
        this.present(targetFrame, this._preferredEdges);

        this._inputElement.select();
    }
};
