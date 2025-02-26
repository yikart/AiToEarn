/*
 * Copyright (C) 2013-2015 Apple Inc. All rights reserved.
 * Copyright (C) 2013 Samsung Electronics. All rights reserved.
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

WI.DOMStorageContentView = class DOMStorageContentView extends WI.ContentView
{
    constructor(representedObject)
    {
        super(representedObject);

        this.element.classList.add("dom-storage");

        representedObject.addEventListener(WI.DOMStorageObject.Event.ItemsCleared, this.itemsCleared, this);
        representedObject.addEventListener(WI.DOMStorageObject.Event.ItemAdded, this.itemAdded, this);
        representedObject.addEventListener(WI.DOMStorageObject.Event.ItemRemoved, this.itemRemoved, this);
        representedObject.addEventListener(WI.DOMStorageObject.Event.ItemUpdated, this.itemUpdated, this);

        let columns = {};
        columns.key = {title: WI.UIString("Key"), sortable: true};
        columns.displayValue = {title: WI.UIString("Value"), sortable: true};

        this._dataGrid = new WI.DataGrid(columns, {
            beforeEditCallback: this._beforeEditCallback.bind(this),
            afterEditCallback: this._afterEditCallback.bind(this),
            copyCallback: this._dataGridCopy.bind(this),
            deleteCallback: this._deleteCallback.bind(this),
        });
        this._dataGrid.sortOrder = WI.DataGrid.SortOrder.Ascending;
        this._dataGrid.sortColumnIdentifier = "key";
        this._dataGrid.allowsMultipleSelection = true;
        this._dataGrid.createSettings("dom-storage-content-view");
        this._dataGrid.addEventListener(WI.DataGrid.Event.SortChanged, this._sortDataGrid, this);
        this.addSubview(this._dataGrid);

        this._filterBarNavigationItem = new WI.FilterBarNavigationItem;
        this._filterBarNavigationItem.filterBar.addEventListener(WI.FilterBar.Event.FilterDidChange, this._handleFilterBarFilterDidChange, this);

        let clearButtonLabel = representedObject.isLocalStorage() ? WI.UIString("Clear Local Storage") : WI.UIString("Clear Session Storage");
        this._clearButtonNavigationItem = new WI.ButtonNavigationItem("dom-storage-clear", clearButtonLabel, "Images/NavigationItemTrash.svg", 15, 15);
        this._clearButtonNavigationItem.visibilityPriority = WI.NavigationItem.VisibilityPriority.Low;
        this._clearButtonNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._handleClearNavigationItemClicked, this);

        this._populate();
    }

    // Public

    get navigationItems()
    {
        return [
            this._filterBarNavigationItem,
            new WI.DividerNavigationItem,
            this._clearButtonNavigationItem,
        ];
    }

    saveToCookie(cookie)
    {
        cookie.type = WI.ContentViewCookieType.DOMStorage;
        cookie.isLocalStorage = this.representedObject.isLocalStorage();
        cookie.host = this.representedObject.host;
    }

    get scrollableElements()
    {
        return [this._dataGrid.scrollContainer];
    }

    get canFocusFilterBar()
    {
        return true;
    }

    focusFilterBar()
    {
        this._filterBarNavigationItem.filterBar.focus();
    }

    itemsCleared(event)
    {
        this._dataGrid.removeChildren();
        this._dataGrid.addPlaceholderNode();
    }

    itemRemoved(event)
    {
        for (let node of this._dataGrid.children) {
            if (node.data.key === event.data.key)
                return this._dataGrid.removeChild(node);
        }

        return null;
    }

    itemAdded(event)
    {
        let {key, value} = event.data;
        let displayValue = this._truncateValue(value);

        // Enforce key uniqueness.
        for (let node of this._dataGrid.children) {
            if (node.data.key === key)
                return;
        }

        this._dataGrid.appendChild(new WI.DataGridNode({key, value, displayValue}));
        this._sortDataGrid();
    }

    itemUpdated(event)
    {
        let {key, newValue: value} = event.data;
        let displayValue = this._truncateValue(value);

        let keyFound = false;
        for (let childNode of this._dataGrid.children) {
            if (childNode.data.key === key) {
                // Remove any rows that are now duplicates.
                if (keyFound) {
                    this._dataGrid.removeChild(childNode);
                    continue;
                }

                keyFound = true;
                childNode.data.value = value;
                childNode.data.displayValue = displayValue;
                childNode.refresh();
            }
        }
        this._sortDataGrid();
    }

    // Private

    _truncateValue(value)
    {
        return value.truncate(200);
    }

    _populate()
    {
        this.representedObject.getEntries(function(error, entries) {
            if (error)
                return;

            for (let [key, value] of entries) {
                if (!key || !value)
                    continue;

                let displayValue = this._truncateValue(value);
                let node = new WI.DataGridNode({key, value, displayValue});
                this._dataGrid.appendChild(node);
            }

            this._dataGrid.addPlaceholderNode();
            this._sortDataGrid();
        }.bind(this));
    }

    _sortDataGrid()
    {
        let sortColumnIdentifier = this._dataGrid.sortColumnIdentifier || "key";

        function comparator(a, b)
        {
            return a.data[sortColumnIdentifier].extendedLocaleCompare(b.data[sortColumnIdentifier]);
        }

        this._dataGrid.sortNodesImmediately(comparator);
    }

    _deleteCallback()
    {
        for (let dataGridNode of this._dataGrid.selectedDataGridNodes) {
            if (dataGridNode.isPlaceholderNode)
                continue;
            this._dataGrid.removeChild(dataGridNode);
            this.representedObject.removeItem(dataGridNode.data["key"]);
        }
    }

    _beforeEditCallback(editingNode, columnIdentifier)
    {
        switch (columnIdentifier) {
        case "displayValue":
            editingNode.data.displayValue = editingNode.data.value;
            editingNode.refresh();
            break;
        }
    }

    _afterEditCallback(editingNode, columnIdentifier, oldText, newText, moveDirection)
    {
        var key = editingNode.data["key"].trim().removeWordBreakCharacters();
        var value = editingNode.data["displayValue"].trim().removeWordBreakCharacters();
        var previousValue = oldText.trim().removeWordBreakCharacters();
        var enteredValue = newText.trim().removeWordBreakCharacters();
        var hasUncommittedEdits = editingNode.__hasUncommittedEdits;
        var hasChange = previousValue !== enteredValue;
        var isEditingKey = columnIdentifier === "key";
        var isEditingValue = !isEditingKey;
        var domStorage = this.representedObject;

        if (isEditingValue) {
            editingNode.data.value = value;
            editingNode.data.displayValue = this._truncateValue(value);
            editingNode.needsRefresh();
        }

        // Nothing changed, just bail.
        if (!hasChange && !hasUncommittedEdits)
            return;

        // Something changed, save the original key/value and enter uncommitted state.
        if (hasChange && !editingNode.__hasUncommittedEdits) {
            editingNode.__hasUncommittedEdits = true;
            editingNode.__originalKey = isEditingKey ? previousValue : key;
            editingNode.__originalValue = isEditingValue ? previousValue : value;
        }

        function cleanup()
        {
            editingNode.element.classList.remove(WI.DOMStorageContentView.MissingKeyStyleClassName);
            editingNode.element.classList.remove(WI.DOMStorageContentView.MissingValueStyleClassName);
            editingNode.element.classList.remove(WI.DOMStorageContentView.DuplicateKeyStyleClassName);
            editingNode.__hasUncommittedEdits = undefined;
            editingNode.__originalKey = undefined;
            editingNode.__originalValue = undefined;
        }

        // If the key/value field was cleared, add "missing" style.
        if (isEditingKey) {
            if (key.length)
                editingNode.element.classList.remove(WI.DOMStorageContentView.MissingKeyStyleClassName);
            else
                editingNode.element.classList.add(WI.DOMStorageContentView.MissingKeyStyleClassName);
        } else if (isEditingValue) {
            if (value.length)
                editingNode.element.classList.remove(WI.DOMStorageContentView.MissingValueStyleClassName);
            else
                editingNode.element.classList.add(WI.DOMStorageContentView.MissingValueStyleClassName);
        }

        // Check for key duplicates. If this is a new row, or an existing row that changed key.
        var keyChanged = key !== editingNode.__originalKey;
        if (keyChanged) {
            if (domStorage.entries.has(key))
                editingNode.element.classList.add(WI.DOMStorageContentView.DuplicateKeyStyleClassName);
            else
                editingNode.element.classList.remove(WI.DOMStorageContentView.DuplicateKeyStyleClassName);
        }

        // See if we are done editing this row or not.
        var columnIndex = this._dataGrid.orderedColumns.indexOf(columnIdentifier);
        var mayMoveToNextRow = moveDirection === "forward" && columnIndex === this._dataGrid.orderedColumns.length - 1;
        var mayMoveToPreviousRow = moveDirection === "backward" && columnIndex === 0;
        var doneEditing = mayMoveToNextRow || mayMoveToPreviousRow || !moveDirection;

        // Expecting more edits on this row.
        if (!doneEditing)
            return;

        // Key and value were cleared, remove the row.
        if (!key.length && !value.length && !editingNode.isPlaceholderNode) {
            this._dataGrid.removeChild(editingNode);
            domStorage.removeItem(editingNode.__originalKey);
            return;
        }

        // Done editing but leaving the row in an invalid state. Leave in uncommitted state.
        var isDuplicate = editingNode.element.classList.contains(WI.DOMStorageContentView.DuplicateKeyStyleClassName);
        if (!key.length || !value.length || isDuplicate)
            return;

        // Commit.
        if (keyChanged && !editingNode.isPlaceholderNode)
            domStorage.removeItem(editingNode.__originalKey);
        if (editingNode.isPlaceholderNode)
            this._dataGrid.addPlaceholderNode();
        cleanup();
        domStorage.setItem(key, value);
    }

    _dataGridCopy(node, columnIdentifier, text)
    {
        if (columnIdentifier === "displayValue" && node.data.value)
            return node.data.value;
        return text;
    }

    _handleFilterBarFilterDidChange(event)
    {
        this._dataGrid.filterText = this._filterBarNavigationItem.filterBar.filters.text || "";
    }

    _handleClearNavigationItemClicked(event)
    {
        this.representedObject.clear();
    }
};

WI.DOMStorageContentView.DuplicateKeyStyleClassName = "duplicate-key";
WI.DOMStorageContentView.MissingKeyStyleClassName = "missing-key";
WI.DOMStorageContentView.MissingValueStyleClassName = "missing-value";
