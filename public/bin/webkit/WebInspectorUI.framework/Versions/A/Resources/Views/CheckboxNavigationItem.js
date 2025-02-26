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

WI.CheckboxNavigationItem = class CheckboxNavigationItem extends WI.NavigationItem
{
    constructor(identifier, label, checked)
    {
        super(identifier, "checkbox");

        this._checkboxElement = this.element.appendChild(document.createElement("input"));
        this._checkboxElement.checked = checked;
        this._checkboxElement.id = "checkbox-navigation-item-" + identifier;
        this._checkboxElement.type = "checkbox";
        this._checkboxElement.addEventListener("change", this._checkboxChanged.bind(this));

        this._checkboxLabel = this.element.appendChild(document.createElement("label"));
        this._checkboxLabel.className = "toggle";
        this._checkboxLabel.setAttribute("for", this._checkboxElement.id);
        this._checkboxLabel.addEventListener("click", this._handleLabelClick.bind(this));

        this.label = label;
    }

    // Public

    get checked()
    {
        return this._checkboxElement.checked;
    }

    set checked(flag)
    {
        this._checkboxElement.checked = flag;
    }

    set label(label)
    {
        this._checkboxLabel.removeChildren();

        if (label)
            this._checkboxLabel.append(label);
    }

    // Protected

    get additionalClassNames()
    {
        return ["checkbox", "button"];
    }

    // Private

    _checkboxChanged(event)
    {
        this.dispatchEventToListeners(WI.CheckboxNavigationItem.Event.CheckedDidChange);
    }

    _handleLabelClick(event)
    {
        if (WI.isEventTargetAnEditableField(event))
            event.stop();
    }
};

WI.CheckboxNavigationItem.Event = {
    CheckedDidChange: "checkbox-navigation-item-checked-did-change",
};
