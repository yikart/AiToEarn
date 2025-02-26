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

WI.StorageSidebarPanel = class StorageSidebarPanel extends WI.NavigationSidebarPanel
{
    constructor()
    {
        super("storage", WI.UIString("Storage"));

        this._navigationBar = new WI.NavigationBar;
        this.addSubview(this._navigationBar);

        var scopeItemPrefix = "storage-sidebar-";
        var scopeBarItems = [];

        scopeBarItems.push(new WI.ScopeBarItem(scopeItemPrefix + "type-all", WI.UIString("All Storage"), {exclusive: true}));

        var storageTypes = [
            {identifier: "application-cache", title: WI.UIString("Application Cache"), classes: [WI.ApplicationCacheFrameTreeElement, WI.ApplicationCacheManifestTreeElement]},
            {identifier: "cookies", title: WI.UIString("Cookies"), classes: [WI.CookieStorageTreeElement]},
            {identifier: "database", title: WI.UIString("Databases"), classes: [WI.DatabaseHostTreeElement, WI.DatabaseTableTreeElement, WI.DatabaseTreeElement]},
            {identifier: "indexed-database", title: WI.UIString("Indexed Databases"), classes: [WI.IndexedDatabaseHostTreeElement, WI.IndexedDatabaseObjectStoreTreeElement, WI.IndexedDatabaseTreeElement]},
            {identifier: "local-storage", title: WI.UIString("Local Storage"), classes: [WI.DOMStorageTreeElement], localStorage: true},
            {identifier: "session-storage", title: WI.UIString("Session Storage"), classes: [WI.DOMStorageTreeElement], localStorage: false}
        ];

        storageTypes.sort(function(a, b) { return a.title.extendedLocaleCompare(b.title); });

        for (var info of storageTypes) {
            var scopeBarItem = new WI.ScopeBarItem(scopeItemPrefix + info.identifier, info.title);
            scopeBarItem.__storageTypeInfo = info;
            scopeBarItems.push(scopeBarItem);
        }

        this._scopeBar = new WI.ScopeBar("storage-sidebar-scope-bar", scopeBarItems, scopeBarItems[0], true);
        this._scopeBar.addEventListener(WI.ScopeBar.Event.SelectionChanged, this._scopeBarSelectionDidChange, this);

        this._navigationBar.addNavigationItem(this._scopeBar);

        this._localStorageRootTreeElement = null;
        this._sessionStorageRootTreeElement = null;

        this._databaseRootTreeElement = null;
        this._databaseHostTreeElementMap = new Map;

        this._indexedDatabaseRootTreeElement = null;
        this._indexedDatabaseHostTreeElementMap = new Map;

        this._cookieStorageRootTreeElement = null;

        this._applicationCacheRootTreeElement = null;
        this._applicationCacheURLTreeElementMap = new Map;

        WI.domStorageManager.addEventListener(WI.DOMStorageManager.Event.CookieStorageObjectWasAdded, this._cookieStorageObjectWasAdded, this);
        WI.domStorageManager.addEventListener(WI.DOMStorageManager.Event.DOMStorageObjectWasAdded, this._domStorageObjectWasAdded, this);
        WI.domStorageManager.addEventListener(WI.DOMStorageManager.Event.DOMStorageObjectWasInspected, this._domStorageObjectWasInspected, this);
        WI.domStorageManager.addEventListener(WI.DOMStorageManager.Event.Cleared, this._domStorageCleared, this);
        WI.databaseManager.addEventListener(WI.DatabaseManager.Event.DatabaseWasAdded, this._databaseWasAdded, this);
        WI.databaseManager.addEventListener(WI.DatabaseManager.Event.DatabaseWasInspected, this._databaseWasInspected, this);
        WI.databaseManager.addEventListener(WI.DatabaseManager.Event.Cleared, this._databaseCleared, this);
        WI.indexedDBManager.addEventListener(WI.IndexedDBManager.Event.IndexedDatabaseWasAdded, this._indexedDatabaseWasAdded, this);
        WI.indexedDBManager.addEventListener(WI.IndexedDBManager.Event.Cleared, this._indexedDatabaseCleared, this);
        WI.applicationCacheManager.addEventListener(WI.ApplicationCacheManager.Event.FrameManifestAdded, this._frameManifestAdded, this);
        WI.applicationCacheManager.addEventListener(WI.ApplicationCacheManager.Event.FrameManifestRemoved, this._frameManifestRemoved, this);
        WI.applicationCacheManager.addEventListener(WI.ApplicationCacheManager.Event.Cleared, this._applicationCacheCleared, this);

        this.contentTreeOutline.addEventListener(WI.TreeOutline.Event.SelectionDidChange, this._treeSelectionDidChange, this);

        for (var domStorageObject of WI.domStorageManager.domStorageObjects)
            this._addDOMStorageObject(domStorageObject);

        for (var cookieStorageObject of WI.domStorageManager.cookieStorageObjects)
            this._addCookieStorageObject(cookieStorageObject);

        for (var database of WI.databaseManager.databases)
            this._addDatabase(database);

        for (var indexedDatabase of WI.indexedDBManager.indexedDatabases)
            this._addIndexedDatabase(indexedDatabase);

        for (var applicationCacheObject of WI.applicationCacheManager.applicationCacheObjects)
            this._addFrameManifest(applicationCacheObject);
    }

    // Public

    get minimumWidth()
    {
        return this._navigationBar.minimumWidth;
    }

    showDefaultContentView()
    {
        // Don't show anything by default. It doesn't make a whole lot of sense here.
    }

    closed()
    {
        super.closed();

        WI.domStorageManager.removeEventListener(WI.DOMStorageManager.Event.CookieStorageObjectWasAdded, this._cookieStorageObjectWasAdded, this);
        WI.domStorageManager.removeEventListener(WI.DOMStorageManager.Event.DOMStorageObjectWasAdded, this._domStorageObjectWasAdded, this);
        WI.domStorageManager.removeEventListener(WI.DOMStorageManager.Event.DOMStorageObjectWasInspected, this._domStorageObjectWasInspected, this);
        WI.domStorageManager.removeEventListener(WI.DOMStorageManager.Event.Cleared, this._domStorageCleared, this);
        WI.databaseManager.removeEventListener(WI.DatabaseManager.Event.DatabaseWasAdded, this._databaseWasAdded, this);
        WI.databaseManager.removeEventListener(WI.DatabaseManager.Event.DatabaseWasInspected, this._databaseWasInspected, this);
        WI.databaseManager.removeEventListener(WI.DatabaseManager.Event.Cleared, this._databaseCleared, this);
        WI.indexedDBManager.removeEventListener(WI.IndexedDBManager.Event.IndexedDatabaseWasAdded, this._indexedDatabaseWasAdded, this);
        WI.indexedDBManager.removeEventListener(WI.IndexedDBManager.Event.Cleared, this._indexedDatabaseCleared, this);
        WI.applicationCacheManager.removeEventListener(WI.ApplicationCacheManager.Event.FrameManifestAdded, this._frameManifestAdded, this);
        WI.applicationCacheManager.removeEventListener(WI.ApplicationCacheManager.Event.FrameManifestRemoved, this._frameManifestRemoved, this);
        WI.applicationCacheManager.removeEventListener(WI.ApplicationCacheManager.Event.Cleared, this._applicationCacheCleared, this);
    }

    // Protected

    resetFilter()
    {
        this._scopeBar.resetToDefault();

        super.resetFilter();
    }

    hasCustomFilters()
    {
        console.assert(this._scopeBar.selectedItems.length === 1);
        var selectedScopeBarItem = this._scopeBar.selectedItems[0];
        return selectedScopeBarItem && !selectedScopeBarItem.exclusive;
    }

    matchTreeElementAgainstCustomFilters(treeElement, flags)
    {
        console.assert(this._scopeBar.selectedItems.length === 1);
        var selectedScopeBarItem = this._scopeBar.selectedItems[0];

        // Show everything if there is no selection or "All Storage" is selected (the exclusive item).
        if (!selectedScopeBarItem || selectedScopeBarItem.exclusive)
            return true;

        // Folders are hidden on the first pass, but visible childen under the folder will force the folder visible again.
        if (treeElement instanceof WI.FolderTreeElement)
            return false;

        function match()
        {
            for (var constructor of selectedScopeBarItem.__storageTypeInfo.classes) {
                if (constructor === WI.DOMStorageTreeElement && treeElement instanceof constructor)
                    return treeElement.representedObject.isLocalStorage() === selectedScopeBarItem.__storageTypeInfo.localStorage;
                if (treeElement instanceof constructor)
                    return true;
            }

            return false;
        }

        var matched = match();
        if (matched)
            flags.expandTreeElement = true;
        return matched;
    }

    // Private

    _treeSelectionDidChange(event)
    {
        if (!this.selected)
            return;

        let treeElement = this.contentTreeOutline.selectedTreeElement;
        if (!treeElement)
            return;

        if (treeElement instanceof WI.FolderTreeElement || treeElement instanceof WI.DatabaseHostTreeElement ||
            treeElement instanceof WI.IndexedDatabaseHostTreeElement || treeElement instanceof WI.ApplicationCacheManifestTreeElement)
            return;

        if (treeElement instanceof WI.StorageTreeElement || treeElement instanceof WI.DatabaseTableTreeElement ||
            treeElement instanceof WI.DatabaseTreeElement || treeElement instanceof WI.ApplicationCacheFrameTreeElement ||
            treeElement instanceof WI.IndexedDatabaseTreeElement || treeElement instanceof WI.IndexedDatabaseObjectStoreTreeElement || treeElement instanceof WI.IndexedDatabaseObjectStoreIndexTreeElement) {
            WI.showRepresentedObject(treeElement.representedObject);
            return;
        }

        console.error("Unknown tree element", treeElement);
    }

    _domStorageObjectWasAdded(event)
    {
        this._addDOMStorageObject(event.data.domStorage);
    }

    _addDOMStorageObject(domStorage)
    {
        var storageElement = new WI.DOMStorageTreeElement(domStorage);

        if (domStorage.isLocalStorage())
            this._localStorageRootTreeElement = this._addStorageChild(storageElement, this._localStorageRootTreeElement, WI.UIString("Local Storage"), "local-storage");
        else
            this._sessionStorageRootTreeElement = this._addStorageChild(storageElement, this._sessionStorageRootTreeElement, WI.UIString("Session Storage"), "session-storage");
    }

    _domStorageObjectWasInspected(event)
    {
        var domStorage = event.data.domStorage;
        var treeElement = this.treeElementForRepresentedObject(domStorage);
        treeElement.revealAndSelect(true);
    }

    _databaseWasAdded(event)
    {
        this._addDatabase(event.data.database);
    }

    _addDatabase(database)
    {
        console.assert(database instanceof WI.DatabaseObject);

        let databaseHostElement = this._databaseHostTreeElementMap.get(database.host);
        if (!databaseHostElement) {
            databaseHostElement = new WI.DatabaseHostTreeElement(database.host);
            this._databaseHostTreeElementMap.set(database.host, databaseHostElement);
            this._databaseRootTreeElement = this._addStorageChild(databaseHostElement, this._databaseRootTreeElement, WI.UIString("Databases"), "databases");
        }

        let databaseElement = new WI.DatabaseTreeElement(database);
        databaseHostElement.appendChild(databaseElement);
    }

    _databaseWasInspected(event)
    {
        var database = event.data.database;
        var treeElement = this.treeElementForRepresentedObject(database);
        treeElement.revealAndSelect(true);
    }

    _indexedDatabaseWasAdded(event)
    {
        this._addIndexedDatabase(event.data.indexedDatabase);
    }

    _addIndexedDatabase(indexedDatabase)
    {
        console.assert(indexedDatabase instanceof WI.IndexedDatabase);

        let indexedDatabaseHostElement = this._indexedDatabaseHostTreeElementMap.get(indexedDatabase.host);
        if (!indexedDatabaseHostElement) {
            indexedDatabaseHostElement = new WI.IndexedDatabaseHostTreeElement(indexedDatabase.host);
            this._indexedDatabaseHostTreeElementMap.set(indexedDatabase.host, indexedDatabaseHostElement);
            this._indexedDatabaseRootTreeElement = this._addStorageChild(indexedDatabaseHostElement, this._indexedDatabaseRootTreeElement, WI.UIString("Indexed Databases"), "indexed-databases");
        }

        let indexedDatabaseElement = new WI.IndexedDatabaseTreeElement(indexedDatabase);
        indexedDatabaseHostElement.appendChild(indexedDatabaseElement);
    }

    _cookieStorageObjectWasAdded(event)
    {
        this._addCookieStorageObject(event.data.cookieStorage);
    }

    _addCookieStorageObject(cookieStorage)
    {
        console.assert(cookieStorage instanceof WI.CookieStorageObject);

        var cookieElement = new WI.CookieStorageTreeElement(cookieStorage);
        this._cookieStorageRootTreeElement = this._addStorageChild(cookieElement, this._cookieStorageRootTreeElement, WI.UIString("Cookies"), "cookies");
    }

    _frameManifestAdded(event)
    {
        this._addFrameManifest(event.data.frameManifest);
    }

    _addFrameManifest(frameManifest)
    {
        console.assert(frameManifest instanceof WI.ApplicationCacheFrame);

        let manifest = frameManifest.manifest;
        let manifestURL = manifest.manifestURL;
        let applicationCacheManifestElement = this._applicationCacheURLTreeElementMap.get(manifestURL);
        if (!applicationCacheManifestElement) {
            applicationCacheManifestElement = new WI.ApplicationCacheManifestTreeElement(manifest);
            this._applicationCacheURLTreeElementMap.set(manifestURL, applicationCacheManifestElement);
            this._applicationCacheRootTreeElement = this._addStorageChild(applicationCacheManifestElement, this._applicationCacheRootTreeElement, WI.UIString("Application Cache"), "application-cache");
        }

        let frameCacheElement = new WI.ApplicationCacheFrameTreeElement(frameManifest);
        applicationCacheManifestElement.appendChild(frameCacheElement);
    }

    _frameManifestRemoved(event)
    {
         // FIXME: Implement this.
    }

    _compareTreeElements(a, b)
    {
        console.assert(a.mainTitle);
        console.assert(b.mainTitle);

        return (a.mainTitle || "").extendedLocaleCompare(b.mainTitle || "");
    }

    _addStorageChild(childElement, parentElement, folderName, folderId)
    {
        if (!parentElement) {
            childElement.flattened = true;

            this.contentTreeOutline.insertChild(childElement, insertionIndexForObjectInListSortedByFunction(childElement, this.contentTreeOutline.children, this._compareTreeElements));

            return childElement;
        }

        if (parentElement instanceof WI.StorageTreeElement) {
            console.assert(parentElement.flattened);

            let previousOnlyChild = parentElement;
            previousOnlyChild.flattened = false;
            this.contentTreeOutline.removeChild(previousOnlyChild);

            const representedObject = null;
            let folderElement = new WI.FolderTreeElement(folderName, representedObject, {id: folderId});
            this.contentTreeOutline.insertChild(folderElement, insertionIndexForObjectInListSortedByFunction(folderElement, this.contentTreeOutline.children, this._compareTreeElements));

            folderElement.appendChild(previousOnlyChild);
            folderElement.insertChild(childElement, insertionIndexForObjectInListSortedByFunction(childElement, folderElement.children, this._compareTreeElements));

            return folderElement;
        }

        console.assert(parentElement instanceof WI.FolderTreeElement);
        parentElement.insertChild(childElement, insertionIndexForObjectInListSortedByFunction(childElement, parentElement.children, this._compareTreeElements));

        return parentElement;
    }

    _closeContentViewForTreeElement(treeElement)
    {
        const onlyExisting = true;
        let contentView = this.contentBrowser.contentViewForRepresentedObject(treeElement.representedObject, onlyExisting);
        if (contentView)
            this.contentBrowser.contentViewContainer.closeContentView(contentView);
    }

    _domStorageCleared(event)
    {
        if (this._localStorageRootTreeElement && this._localStorageRootTreeElement.parent) {
            this._closeContentViewForTreeElement(this._localStorageRootTreeElement);
            this._localStorageRootTreeElement.parent.removeChild(this._localStorageRootTreeElement);
        }

        if (this._sessionStorageRootTreeElement && this._sessionStorageRootTreeElement.parent) {
            this._closeContentViewForTreeElement(this._sessionStorageRootTreeElement);
            this._sessionStorageRootTreeElement.parent.removeChild(this._sessionStorageRootTreeElement);
        }

        if (this._cookieStorageRootTreeElement && this._cookieStorageRootTreeElement.parent) {
            this._closeContentViewForTreeElement(this._cookieStorageRootTreeElement);
            this._cookieStorageRootTreeElement.parent.removeChild(this._cookieStorageRootTreeElement);
        }

        this._localStorageRootTreeElement = null;
        this._sessionStorageRootTreeElement = null;
        this._cookieStorageRootTreeElement = null;
    }

    _applicationCacheCleared(event)
    {
        if (this._applicationCacheRootTreeElement && this._applicationCacheRootTreeElement.parent) {
            this._closeContentViewForTreeElement(this._applicationCacheRootTreeElement);
            this._applicationCacheRootTreeElement.parent.removeChild(this._applicationCacheRootTreeElement);
        }

        this._applicationCacheRootTreeElement = null;
        this._applicationCacheURLTreeElementMap.clear();
    }

    _indexedDatabaseCleared(event)
    {
        if (this._indexedDatabaseRootTreeElement && this._indexedDatabaseRootTreeElement.parent) {
            this._closeContentViewForTreeElement(this._indexedDatabaseRootTreeElement);
            this._indexedDatabaseRootTreeElement.parent.removeChild(this._indexedDatabaseRootTreeElement);
        }

        this._indexedDatabaseRootTreeElement = null;
        this._indexedDatabaseHostTreeElementMap.clear();
    }

    _databaseCleared(event)
    {
        if (this._databaseRootTreeElement && this._databaseRootTreeElement.parent) {
            this._closeContentViewForTreeElement(this._databaseRootTreeElement);
            this._databaseRootTreeElement.parent.removeChild(this._databaseRootTreeElement);
        }

        this._databaseRootTreeElement = null;
        this._databaseHostTreeElementMap.clear();
    }

    _scopeBarSelectionDidChange(event)
    {
        this.updateFilter();
    }
};
