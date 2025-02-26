/*
 * Copyright (C) 2014, 2015 Apple Inc. All rights reserved.
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

WI.IndexedDatabaseObjectStoreContentView = class IndexedDatabaseObjectStoreContentView extends WI.ContentView
{
    constructor(objectStoreOrIndex)
    {
        super(objectStoreOrIndex);

        this.element.classList.add("indexed-database-object-store");

        if (objectStoreOrIndex instanceof WI.IndexedDatabaseObjectStore) {
            this._objectStore = objectStoreOrIndex;
            this._objectStoreIndex = null;
        } else if (objectStoreOrIndex instanceof WI.IndexedDatabaseObjectStoreIndex) {
            this._objectStore = objectStoreOrIndex.parentObjectStore;
            this._objectStoreIndex = objectStoreOrIndex;
        }

        function displayKeyPath(keyPath)
        {
            if (!keyPath)
                return "";
            if (keyPath instanceof Array)
                return keyPath.join(WI.UIString(", "));
            console.assert(keyPath instanceof String || typeof keyPath === "string");
            return keyPath;
        }

        var displayPrimaryKeyPath = displayKeyPath(this._objectStore.keyPath);

        var columnInfo = {
            primaryKey: {title: displayPrimaryKeyPath ? WI.UIString("Primary Key \u2014 %s").format(displayPrimaryKeyPath) : WI.UIString("Primary Key")},
            key: {},
            value: {title: WI.UIString("Value")}
        };

        if (this._objectStoreIndex) {
            // When there is an index, show the key path in the Key column.
            var displayIndexKeyPath = displayKeyPath(this._objectStoreIndex.keyPath);
            columnInfo.key.title = WI.UIString("Index Key \u2014 %s").format(displayIndexKeyPath);
        } else {
            // Only need to show Key for indexes -- it is the same as Primary Key
            // when there is no index being used.
            delete columnInfo.key;
        }

        this._dataGrid = new WI.DataGrid(columnInfo);
        this._dataGrid.variableHeightRows = true;
        this._dataGrid.filterDelegate = this;
        this._dataGrid.scrollContainer.addEventListener("scroll", this._dataGridScrolled.bind(this));
        this.addSubview(this._dataGrid);

        this._entries = [];

        this._fetchingMoreData = false;
        this._fetchMoreData();

        this._filterBarNavigationItem = new WI.FilterBarNavigationItem;
        this._filterBarNavigationItem.filterBar.addEventListener(WI.FilterBar.Event.FilterDidChange, this._handleFilterBarFilterDidChange, this);

        this._refreshButtonNavigationItem = new WI.ButtonNavigationItem("indexed-database-object-store-refresh", WI.UIString("Refresh"), "Images/ReloadFull.svg", 13, 13);
        this._refreshButtonNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._refreshButtonClicked, this);

        this._clearButtonNavigationItem = new WI.ButtonNavigationItem("indexed-database-object-store-clear", WI.UIString("Clear object store"), "Images/NavigationItemTrash.svg", 15, 15);
        this._clearButtonNavigationItem.visibilityPriority = WI.NavigationItem.VisibilityPriority.Low;
        this._clearButtonNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._clearButtonClicked, this);
    }

    // Public

    get navigationItems()
    {
        return [
            this._filterBarNavigationItem,
            new WI.DividerNavigationItem,
            this._refreshButtonNavigationItem,
            this._clearButtonNavigationItem,
        ];
    }

    closed()
    {
        super.closed();

        this._reset();
    }

    saveToCookie(cookie)
    {
        cookie.type = WI.ContentViewCookieType.IndexedDatabaseObjectStore;
        cookie.securityOrigin = this._objectStore.parentDatabase.securityOrigin;
        cookie.databaseName = this._objectStore.parentDatabase.name;
        cookie.objectStoreName = this._objectStore.name;
        cookie.objectStoreIndexName = this._objectStoreIndex && this._objectStoreIndex.name;
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

    // Protected

    dataGridMatchNodeAgainstCustomFilters(node)
    {
        let filterBar = this._filterBarNavigationItem.filterBar;
        filterBar.invalid = false;

        let filterText = filterBar.filters.text;
        if (!filterText)
            return true;

        let regex = WI.SearchUtilities.filterRegExpForString(filterText, WI.SearchUtilities.defaultSettings);
        if (!regex) {
            filterBar.invalid = true;
            return true;
        }

        // Iterate over each cell.
        for (let child of node.element.children) {
            if (regex.test(child.textContent))
                return true;
        }

        return false;
    }

    // Private

    _reset()
    {
        for (var entry of this._entries) {
            entry.primaryKey.release();
            entry.key.release();
            entry.value.release();
        }

        this._entries = [];
        this._dataGrid.removeChildren();
    }

    _dataGridScrolled()
    {
        if (!this._moreEntriesAvailable || !this._dataGrid.isScrolledToLastRow())
            return;

        this._fetchMoreData();
    }

    _fetchMoreData()
    {
        if (this._fetchingMoreData)
            return;

        function processEntries(entries, moreAvailable)
        {
            this._entries.pushAll(entries);
            this._moreEntriesAvailable = moreAvailable;

            for (var entry of entries) {
                var dataGridNode = new WI.IndexedDatabaseEntryDataGridNode(entry);
                this._dataGrid.appendChild(dataGridNode);
            }

            this._fetchingMoreData = false;

            if (moreAvailable && this._dataGrid.isScrolledToLastRow())
                this._fetchMoreData();
        }

        this._fetchingMoreData = true;

        WI.indexedDBManager.requestIndexedDatabaseData(this._objectStore, this._objectStoreIndex, this._entries.length, 25, processEntries.bind(this));
    }

    _handleFilterBarFilterDidChange(event)
    {
        this._dataGrid.filterDidChange();
    }

    _refreshButtonClicked()
    {
        this._reset();
        this._fetchMoreData();
    }

    _clearButtonClicked()
    {
        WI.indexedDBManager.clearObjectStore(this._objectStore);
        this._reset();
    }
};
