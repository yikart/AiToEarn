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

WI.ScopeBarItem = class ScopeBarItem extends WI.Object
{
    constructor(id, label, {className, exclusive, independent, hidden} = {})
    {
        super();

        this._element = document.createElement("li");
        this._element.classList.toggle("exclusive", !!exclusive);
        if (className)
            this._element.classList.add(className);
        this._element.textContent = label;

        this._element.addEventListener("mousedown", this._handleMouseDown.bind(this));
        this._element.addEventListener("keydown", this._handleKeyDown.bind(this));

        this._id = id;
        this._label = label;
        this._exclusive = !!exclusive;
        this._independent = !!independent;
        this._hidden = !!hidden;
        this._scopeBar = null;

        this._selectedSetting = new WI.Setting("scopebaritem-" + id, false);
        this._updateSelected(this._selectedSetting.value);

        this._element.classList.toggle("hidden", this._hidden);
    }

    // Public

    get scopeBar() { return this._scopeBar; }
    set scopeBar(scopeBar) { this._scopeBar = scopeBar; }

    get element()
    {
        return this._element;
    }

    get id()
    {
        return this._id;
    }

    get label()
    {
        return this._label;
    }

    get exclusive()
    {
        return this._exclusive;
    }

    get selected()
    {
        return this._selectedSetting.value;
    }

    set selected(selected)
    {
        this.toggle(selected, {
            extendSelection: this._independent || (WI.modifierKeys.metaKey && !WI.modifierKeys.ctrlKey && !WI.modifierKeys.altKey && !WI.modifierKeys.shiftKey),
        });
    }

    get hidden()
    {
        return this._hidden;
    }

    set hidden(flag)
    {
        if (this._hidden === flag)
            return;

        this._hidden = flag;

        this._element.classList.toggle("hidden", flag);

        this.dispatchEventToListeners(WI.ScopeBarItem.Event.HiddenChanged);
    }

    toggle(selected, {extendSelection} = {})
    {
        if (this._selectedSetting.value === selected)
            return;

        this._updateSelected(selected);
        this._selectedSetting.value = selected;

        this.dispatchEventToListeners(WI.ScopeBarItem.Event.SelectionChanged, {extendSelection});
    }

    // Private

    _updateSelected(selected)
    {
        selected = !!selected;
        this._element.classList.toggle("selected", selected);
        this._element.ariaPressed = selected;
        this._element.tabIndex = selected ? 0 : -1;
    }

    _handleMouseDown(event)
    {
        // Only handle left mouse clicks.
        if (event.button !== 0)
            return;

        this.selected = !this.selected;

        // Move the focus to the clicked element only when the focus is already inside the scope bar element.
        if (!this._scopeBar?.element.contains(document.activeElement))
            event.preventDefault();
    }

    _handleKeyDown(event)
    {
        if (event.code === "Space" || event.code === "Enter") {
            event.stop();
            this.selected = !this.selected;
        }
    }
};

WI.ScopeBarItem.Event = {
    SelectionChanged: "scope-bar-item-selection-changed",
    HiddenChanged: "scope-bar-item-hidden-changed",
};
