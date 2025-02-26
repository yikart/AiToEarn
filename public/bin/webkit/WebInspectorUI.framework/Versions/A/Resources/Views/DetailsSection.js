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

WI.DetailsSection = class DetailsSection extends WI.Object
{
    constructor(identifier, title, groups, optionsElement, defaultCollapsedSettingValue)
    {
        super();

        console.assert(identifier);

        this._element = document.createElement("div");
        this._element.classList.add(identifier, "details-section");

        this._headerElement = document.createElement("div");
        this._headerElement.addEventListener("mousedown", this._headerElementMouseDown.bind(this));
        this._headerElement.addEventListener("click", this._headerElementClicked.bind(this));
        this._headerElement.addEventListener("keydown", this._handleHeaderElementKeyDown.bind(this));
        this._headerElement.className = "header";
        this._headerElement.tabIndex = 0;
        this._element.appendChild(this._headerElement);

        if (optionsElement instanceof HTMLElement) {
            this._optionsElement = optionsElement;
            this._optionsElement.classList.add("options");
            this._optionsElement.addEventListener("mousedown", this._optionsElementMouseDown.bind(this));
            this._optionsElement.addEventListener("mouseup", this._optionsElementMouseUp.bind(this));
            this._headerElement.appendChild(this._optionsElement);
        }

        this._titleElement = document.createElement("span");
        this._titleElement.className = "title";
        this._headerElement.appendChild(this._titleElement);

        this._contentElement = document.createElement("div");
        this._contentElement.className = "content";
        this._element.appendChild(this._contentElement);

        this._identifier = identifier;
        this.title = title;
        this.groups = groups || [new WI.DetailsSectionGroup];

        this._collapsedSetting = new WI.Setting(identifier + "-details-section-collapsed", !!defaultCollapsedSettingValue);
        this.collapsed = this._collapsedSetting.value;
    }

    // Public

    get element() { return this._element; }
    get headerElement() { return this._headerElement; }
    get identifier() { return this._identifier; }

    get title()
    {
        return this._titleElement.textContent;
    }

    set title(title)
    {
        this._headerElement.toggleAttribute("hidden", !title);
        this._titleElement.textContent = title;
    }

    get titleElement()
    {
        return this._titleElement;
    }

    set titleElement(element)
    {
        console.assert(element instanceof HTMLElement, "Expected titleElement to be an HTMLElement.", element);

        this._headerElement.replaceChild(element, this._titleElement);
        this._titleElement = element;
    }

    get collapsed()
    {
        return this._element.classList.contains(WI.DetailsSection.CollapsedStyleClassName);
    }

    set collapsed(flag)
    {
        if (flag)
            this._element.classList.add(WI.DetailsSection.CollapsedStyleClassName);
        else
            this._element.classList.remove(WI.DetailsSection.CollapsedStyleClassName);

        this._collapsedSetting.value = flag || false;

        this.dispatchEventToListeners(WI.DetailsSection.Event.CollapsedStateChanged, {collapsed: this._collapsedSetting.value});
    }

    get groups()
    {
        return this._groups;
    }

    set groups(groups)
    {
        this._contentElement.removeChildren();

        this._groups = groups || [];

        for (var i = 0; i < this._groups.length; ++i)
            this._contentElement.appendChild(this._groups[i].element);
    }

    // Private

    _headerElementMouseDown(event)
    {
        if (this._optionsElement?.contains(event.target))
            return;

        // Don't lose focus if already focused.
        if (document.activeElement === this._headerElement)
            return;

        event.preventDefault();
    }

    _headerElementClicked(event)
    {
        if (this._optionsElement?.contains(event.target))
            return;

        let collapsed = this.collapsed;
        this.collapsed = !collapsed;

        this._element.scrollIntoViewIfNeeded(false);
    }

    _handleHeaderElementKeyDown(event)
    {
        let isSpaceOrEnterKey = event.code === "Space" || event.code === "Enter";
        if (!isSpaceOrEnterKey && event.code !== "ArrowLeft" && event.code !== "ArrowRight")
            return;

        if (this._optionsElement?.contains(event.target))
            return;

        event.preventDefault();

        if (isSpaceOrEnterKey) {
            this.collapsed = !this.collapsed;
            return;
        }

        let collapsed = event.code === "ArrowLeft";

        if (WI.resolveLayoutDirectionForElement(this._headerElement) === WI.LayoutDirection.RTL)
            collapsed = !collapsed;

        this.collapsed = collapsed;
    }

    _optionsElementMouseDown(event)
    {
        this._headerElement.classList.add(WI.DetailsSection.MouseOverOptionsElementStyleClassName);
    }

    _optionsElementMouseUp(event)
    {
        this._headerElement.classList.remove(WI.DetailsSection.MouseOverOptionsElementStyleClassName);
    }
};

WI.DetailsSection.CollapsedStyleClassName = "collapsed";
WI.DetailsSection.MouseOverOptionsElementStyleClassName = "mouse-over-options-element";

WI.DetailsSection.Event = {
    CollapsedStateChanged: "details-section-collapsed-state-changed"
};
