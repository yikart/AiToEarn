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

WI.ScopeBar = class ScopeBar extends WI.NavigationItem
{
    constructor(identifier, items, defaultItem, shouldGroupNonExclusiveItems)
    {
        super(identifier);

        this._element.classList.add("scope-bar");

        this._items = items;
        this._defaultItem = defaultItem;
        this._shouldGroupNonExclusiveItems = shouldGroupNonExclusiveItems || false;

        for (let item of this._items)
            item.scopeBar = this;

        this._minimumWidth = 0;

        this._populate();

        this._element.addEventListener("keydown", this._handleKeyDown.bind(this));
    }

    // Public

    get minimumWidth()
    {
        if (!this._minimumWidth) {
            // If a "display: flex;" element is too small for its contents and
            // has "flex-wrap: wrap;" set as well, this will cause the contents
            // to wrap (potentially overflowing), thus preventing a proper
            // measurement of the width of the element. Removing the "flex-wrap"
            // property will ensure that the contents are rendered on one line.
            this.element.style.flexWrap = "initial !important";

            if (this._multipleItem)
                this._multipleItem.displayWidestItem();

            this._minimumWidth = this.element.realOffsetWidth;
            this.element.style.flexWrap = null;

            if (this._multipleItem)
                this._multipleItem.displaySelectedItem();
        }
        return this._minimumWidth;
    }

    get defaultItem()
    {
        return this._defaultItem;
    }

    get items()
    {
        return this._items;
    }

    item(id)
    {
        return this._itemsById.get(id);
    }

    get selectedItems()
    {
        return this._items.filter((item) => item.selected);
    }

    hasNonDefaultItemSelected()
    {
        return this._items.some((item) => item.selected && item !== this._defaultItem);
    }

    resetToDefault()
    {
        let selectedItems = this.selectedItems;
        if (selectedItems.length === 1 && selectedItems[0] === this._defaultItem)
            return;

        for (let item of this._items)
            item.selected = false;
        this._defaultItem.selected = true;

        this.dispatchEventToListeners(WI.ScopeBar.Event.SelectionChanged);
    }

    // Private

    _populate()
    {
        this._itemsById = new Map;

        if (this._shouldGroupNonExclusiveItems) {
            var nonExclusiveItems = [];

            for (var item of this._items) {
                this._itemsById.set(item.id, item);

                if (!item.exclusive) {
                    nonExclusiveItems.push(item);
                    continue;
                }

                this._element.appendChild(item.element);
                item.addEventListener(WI.ScopeBarItem.Event.SelectionChanged, this._itemSelectionDidChange, this);
            }

            this._multipleItem = new WI.MultipleScopeBarItem(nonExclusiveItems);
            this._multipleItem.addEventListener(WI.ScopeBarItem.Event.SelectionChanged, this._itemSelectionDidChange, this);
            this._element.appendChild(this._multipleItem.element);
        } else {
            for (var item of this._items) {
                this._itemsById.set(item.id, item);
                this._element.appendChild(item.element);

                item.addEventListener(WI.ScopeBarItem.Event.SelectionChanged, this._itemSelectionDidChange, this);
            }
        }

        if (this._defaultItem) {
            if (!this.selectedItems.length)
                this._defaultItem.selected = true;

            this._element.classList.toggle("default-item-selected", this._defaultItem.selected);
        }
    }

    _itemSelectionDidChange(event)
    {
        if (this._ignoreItemSelectedEvent)
            return;

        this._ignoreItemSelectedEvent = true;

        let target = event.target;
        if (target.selected) {
            for (let item of this._items) {
                if (item === target)
                    continue;
                if (target === this._multipleItem && !item.exclusive)
                    continue;
                if (event.data.extendSelection && !target.exclusive && !item.exclusive)
                    continue;

                item.selected = false;
            }
        }

        if (this._defaultItem) {
            if (!this.selectedItems.length)
                this._defaultItem.selected = true;

            this._element.classList.toggle("default-item-selected", this._defaultItem.selected);
        }

        this.dispatchEventToListeners(WI.ScopeBar.Event.SelectionChanged);

        this._ignoreItemSelectedEvent = false;
    }

    _handleKeyDown(event)
    {
        if (event.code === "ArrowLeft" || event.code === "ArrowRight") {
            event.stop();
            let focusedIndex = -1;

            for (let i = 0; i < this._items.length; ++i) {
                let element = this._items[i].element;
                if (element === document.activeElement) {
                    focusedIndex = i;
                    break;
                }
            }

            if (focusedIndex === -1)
                return;

            let delta = (event.code === "ArrowLeft") ? -1 : 1;
            if (WI.resolveLayoutDirectionForElement(this._element) === WI.LayoutDirection.RTL)
                delta *= -1;

            focusedIndex += delta;
            focusedIndex = (focusedIndex + this._items.length) % this._items.length;
            this._items[focusedIndex].element.focus();
        }
    }
};

WI.ScopeBar.Event = {
    SelectionChanged: "scopebar-selection-did-change"
};
