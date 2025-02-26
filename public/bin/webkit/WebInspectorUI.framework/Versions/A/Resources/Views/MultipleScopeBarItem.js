/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
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

WI.MultipleScopeBarItem = class MultipleScopeBarItem extends WI.Object
{
    constructor(scopeBarItems)
    {
        super();

        this._element = document.createElement("li");
        this._element.classList.add("multiple");

        this._titleElement = document.createElement("span");
        this._element.appendChild(this._titleElement);
        this._element.addEventListener("mousedown", this._handleMouseDown.bind(this));

        this._selectElement = document.createElement("select");
        this._selectElement.addEventListener("change", this._selectElementSelectionChanged.bind(this));
        this._element.appendChild(this._selectElement);

        this._element.appendChild(WI.ImageUtilities.useSVGSymbol("Images/UpDownArrows.svg", "arrows"));

        this.scopeBarItems = scopeBarItems;
    }

    // Public

    get element()
    {
        return this._element;
    }

    get exclusive()
    {
        return false;
    }

    get scopeBarItems()
    {
        return this._scopeBarItems;
    }

    set scopeBarItems(scopeBarItems)
    {
        if (this._scopeBarItems) {
            for (var scopeBarItem of this._scopeBarItems) {
                scopeBarItem.removeEventListener(WI.ScopeBarItem.Event.SelectionChanged, this._itemSelectionDidChange, this);
                scopeBarItem.removeEventListener(WI.ScopeBarItem.Event.HiddenChanged, this._handleItemHiddenChanged, this);
            }
        }

        this._scopeBarItems = scopeBarItems || [];
        this._visibleScopeBarItems = [];
        this._selectedScopeBarItem = null;

        this._selectElement.removeChildren();

        function createOption(scopeBarItem)
        {
            var optionElement = document.createElement("option");
            var maxPopupMenuLength = 130; // <rdar://problem/13445374> <select> with very long option has clipped text and popup menu is still very wide
            optionElement.textContent = scopeBarItem.label.length <= maxPopupMenuLength ? scopeBarItem.label : scopeBarItem.label.substring(0, maxPopupMenuLength) + ellipsis;
            return optionElement;
        }

        for (let scopeBarItem of this._scopeBarItems) {
            scopeBarItem.addEventListener(WI.ScopeBarItem.Event.SelectionChanged, this._itemSelectionDidChange, this);
            scopeBarItem.addEventListener(WI.ScopeBarItem.Event.HiddenChanged, this._handleItemHiddenChanged, this);

            if (scopeBarItem.hidden)
                continue;

            if (scopeBarItem.selected && !this._selectedScopeBarItem)
                this._selectedScopeBarItem = scopeBarItem;
            else if (scopeBarItem.selected) {
                // Only one selected item is allowed at a time.
                // Deselect any other items after the first.
                scopeBarItem.selected = false;
            }

            this._visibleScopeBarItems.push(scopeBarItem);
            this._selectElement.appendChild(createOption(scopeBarItem));
        }

        this._lastSelectedScopeBarItem = this._selectedScopeBarItem || this._scopeBarItems[0] || null;
        this._titleElement.textContent = this._lastSelectedScopeBarItem ? this._lastSelectedScopeBarItem.label : "";

        this._element.classList.toggle("selected", !!this._selectedScopeBarItem);
        this._selectElement.selectedIndex = this._scopeBarItems.indexOf(this._selectedScopeBarItem);
    }

    get selected()
    {
        return !!this._selectedScopeBarItem;
    }

    set selected(selected)
    {
        this.selectedScopeBarItem = selected ? this._lastSelectedScopeBarItem : null;
    }

    get selectedScopeBarItem()
    {
        return this._selectedScopeBarItem;
    }

    set selectedScopeBarItem(selectedScopeBarItem)
    {
        this._ignoreItemSelectedEvent = true;

        if (this._selectedScopeBarItem) {
            this._selectedScopeBarItem.selected = false;
            this._lastSelectedScopeBarItem = this._selectedScopeBarItem;
        } else if (!this._lastSelectedScopeBarItem)
            this._lastSelectedScopeBarItem = selectedScopeBarItem;

        this._element.classList.toggle("selected", !!selectedScopeBarItem);
        this._selectedScopeBarItem = selectedScopeBarItem || null;

        let selectedIndex = this._visibleScopeBarItems.indexOf(this._selectedScopeBarItem);
        if (selectedIndex < 0)
            selectedIndex = 0;
        this._selectElement.selectedIndex = selectedIndex;

        if (this._selectedScopeBarItem) {
            this.displaySelectedItem();
            this._selectedScopeBarItem.selected = true;
        }

        this.dispatchEventToListeners(WI.ScopeBarItem.Event.SelectionChanged, {
            extendSelection: WI.modifierKeys.metaKey && !WI.modifierKeys.ctrlKey && !WI.modifierKeys.altKey && !WI.modifierKeys.shiftKey,
        });

        this._ignoreItemSelectedEvent = false;
    }

    displaySelectedItem()
    {
        this._titleElement.textContent = (this._selectedScopeBarItem || this._scopeBarItems[0]).label;
    }

    displayWidestItem()
    {
        let widestLabel = null;
        let widestSize = 0;
        for (let option of Array.from(this._selectElement.options)) {
            this._titleElement.textContent = option.label;
            if (this._titleElement.realOffsetWidth > widestSize) {
                widestSize = this._titleElement.realOffsetWidth;
                widestLabel = option.label;
            }
        }
        this._titleElement.textContent = widestLabel;
    }

    // Private

    _handleMouseDown(event)
    {
        // Only handle left mouse clicks.
        if (event.button !== 0)
            return;

        if (event.__original)
            return;

        // Only support click to select when the item is not selected yet.
        // Clicking when selected will cause the menu to appear instead.
        if (this._element.classList.contains("selected")) {
            let newEvent = new event.constructor(event.type, event);
            newEvent.__original = event;

            event.stop();

            this._selectElement.dispatchEvent(newEvent);
            return;
        }

        this.selected = true;
    }

    _selectElementSelectionChanged(event)
    {
        this.selectedScopeBarItem = this._visibleScopeBarItems[this._selectElement.selectedIndex];
    }

    _itemSelectionDidChange(event)
    {
        if (this._ignoreItemSelectedEvent)
            return;

        let scopeBarItem = event.target;
        if (scopeBarItem.hidden)
            return;

        this.selectedScopeBarItem = scopeBarItem.selected ? scopeBarItem : null;
    }

    _handleItemHiddenChanged(event)
    {
        // Regenerate the <select> with the new options.
        this.scopeBarItems = this._scopeBarItems;
    }
};
