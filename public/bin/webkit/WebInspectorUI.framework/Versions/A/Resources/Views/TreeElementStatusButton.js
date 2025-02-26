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

WI.TreeElementStatusButton = class TreeElementStatusButton extends WI.Object
{
    constructor(element)
    {
        super();

        console.assert(element);

        this._element = element;
        this._element.classList.add("status-button");
        this._element.addEventListener("click", this._clicked.bind(this));
    }

    // Public

    get element()
    {
        return this._element;
    }

    get hidden()
    {
        return !this._element.classList.contains(WI.TreeElementStatusButton.DisabledStyleClassName);
    }

    set hidden(flag)
    {
        this._element.classList.toggle("hidden", flag);
    }

    get enabled()
    {
        return !this._element.classList.contains(WI.TreeElementStatusButton.DisabledStyleClassName);
    }

    set enabled(flag)
    {
        if (flag)
            this._element.classList.remove(WI.TreeElementStatusButton.DisabledStyleClassName);
        else
            this._element.classList.add(WI.TreeElementStatusButton.DisabledStyleClassName);
    }

    // Private

    _clicked(event)
    {
        if (!this.enabled)
            return;

        event.stopPropagation();

        this.dispatchEventToListeners(WI.TreeElementStatusButton.Event.Clicked, event);
    }
};

WI.TreeElementStatusButton.DisabledStyleClassName = "disabled";

WI.TreeElementStatusButton.Event = {
    Clicked: "status-button-clicked"
};
