/*
 * Copyright (C) 2016 Apple Inc. All rights reserved.
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

WI.TimelineTreeElement = class TimelineTreeElement extends WI.GeneralTreeElement
{
    constructor(timeline, placeholder)
    {
        let displayName = WI.TimelineTabContentView.displayNameForTimelineType(timeline.type);
        let iconClassName = WI.TimelineTabContentView.iconClassNameForTimelineType(timeline.type);
        let genericClassName = WI.TimelineTabContentView.genericClassNameForTimelineType(timeline.type);

        super([iconClassName, genericClassName], displayName, "", timeline);

        this._placeholder = placeholder || false;
        this.editing = this._placeholder;
        this.tooltipHandledSeparately = true;
    }

    // Public

    get placeholder()
    {
        return this._placeholder;
    }

    get editing()
    {
        return this._editing;
    }

    set editing(x)
    {
        if (this._editing === x)
            return;

        this._editing = x;
        this.selectable = !this._editing;

        this._updateStatusButton();
    }

    // Protected

    onattach()
    {
        super.onattach();

        this.listItemElement.addEventListener("click", this._clickHandler.bind(this));
    }

    // Private

    _showCloseButton()
    {
        let tooltip = WI.UIString("Close %s timeline view").format(this.mainTitle);
        let button = new WI.TreeElementStatusButton(WI.ImageUtilities.useSVGSymbol("Images/CloseLarge.svg", "close-button", tooltip));
        button.addEventListener(WI.TreeElementStatusButton.Event.Clicked, function(event) {
            this.deselect();
        }, this);
        this.status = button.element;
    }

    _showCheckbox()
    {
        let checkboxElement = document.createElement("input");
        checkboxElement.type = "checkbox";
        checkboxElement.checked = !this._placeholder;

        let button = new WI.TreeElementStatusButton(checkboxElement);
        checkboxElement.addEventListener("change", () => { this._dispatchEnabledDidChangeEvent(); });

        this.status = checkboxElement;
    }

    _updateStatusButton()
    {
        if (this._editing)
            this._showCheckbox();
        else
            this._showCloseButton();
    }

    _clickHandler()
    {
        if (!this._editing)
            return;

        this.status.checked = !this.status.checked;
        this._dispatchEnabledDidChangeEvent();
    }

    _dispatchEnabledDidChangeEvent()
    {
        this.dispatchEventToListeners(WI.TimelineTreeElement.Event.EnabledDidChange);
    }
};

WI.TimelineTreeElement.Event = {
    EnabledDidChange: "timeline-tree-element-enabled-did-change"
};
