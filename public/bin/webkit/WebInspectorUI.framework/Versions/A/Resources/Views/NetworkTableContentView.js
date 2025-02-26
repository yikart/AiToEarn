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

WI.NetworkTableContentView = class NetworkTableContentView extends WI.ContentView
{
    constructor(representedObject, extraArguments)
    {
        super(representedObject);

        // Collections contain the set of values needed to render the table.
        // The main collection reflects the main target's live activity.
        // We create other collections for HAR imports.
        this._collections = [];
        this._activeCollection = null;
        this._mainCollection = this._addCollection();
        this._setActiveCollection(this._mainCollection);

        this._entriesSortComparator = null;

        this._showingRepresentedObjectCookie = null;

        this._table = null;
        this._hoveredRowIndex = null;
        this._nameColumnWidthSetting = new WI.Setting("network-table-content-view-name-column-width", WI.Sidebar.AbsoluteMinimumWidth);

        this._selectedObject = null;
        this._detailView = null;
        this._detailViewMap = new Map;

        this._domNodeEntries = new Map;

        this._waterfallTimelineRuler = null;
        this._waterfallPopover = null;

        // FIXME: Network Timeline.
        // FIXME: Throttling.

        this._statistics = {};

        this.element.classList.add("network-table");

        this._typeFilterScopeBarItemAll = new WI.ScopeBarItem("network-type-filter-all", WI.UIString("All"));
        let typeFilterScopeBarItems = [this._typeFilterScopeBarItemAll];

        function addScopeBarItem(id, label, checker) {
            let scopeBarItem = new WI.ScopeBarItem("network-type-filter-" + id, label);
            scopeBarItem.__checker = checker;
            typeFilterScopeBarItems.push(scopeBarItem);
        }
        addScopeBarItem("document", WI.UIString("Document"), (type) => type === WI.Resource.Type.Document);
        addScopeBarItem("styleSheet", WI.unlocalizedString("CSS"), (type) => type === WI.Resource.Type.StyleSheet);
        addScopeBarItem("image", WI.UIString("Image"), (type) => type === WI.Resource.Type.Image);
        addScopeBarItem("font", WI.UIString("Font"), (type) => type === WI.Resource.Type.Font);
        addScopeBarItem("script", WI.unlocalizedString("JS"), (type) => type === WI.Resource.Type.Script);
        addScopeBarItem("xhr-fetch", WI.UIString("%s/Fetch", "%s/Fetch @ Network Tab Table Filter", "Scope bar button that filter for dynamic resource loads, like from the 'fetch' method.").format(WI.unlocalizedString("XHR")), (type) => type === WI.Resource.Type.XHR || type === WI.Resource.Type.Fetch);
        addScopeBarItem("other", WI.UIString("Other"), (type) => {
            return type !== WI.Resource.Type.Document
                && type !== WI.Resource.Type.StyleSheet
                && type !== WI.Resource.Type.Image
                && type !== WI.Resource.Type.Font
                && type !== WI.Resource.Type.Script
                && type !== WI.Resource.Type.XHR
                && type !== WI.Resource.Type.Fetch;
        });

        const shouldGroupNonExclusiveItems = true;
        this._typeFilterScopeBar = new WI.ScopeBar("network-type-filter-scope-bar", typeFilterScopeBarItems, typeFilterScopeBarItems[0], shouldGroupNonExclusiveItems);
        this._typeFilterScopeBar.visibilityPriority = WI.NavigationItem.VisibilityPriority.High;
        this._typeFilterScopeBar.addEventListener(WI.ScopeBar.Event.SelectionChanged, this._typeFilterScopeBarSelectionChanged, this);

        this._otherFiltersNavigationItem = new WI.NavigationItem("network-other-filters-button", "button");
        this._otherFiltersNavigationItem.tooltip = WI.UIString("Other filter options\u2026");
        this._otherFiltersNavigationItem.visibilityPriority = WI.NavigationItem.VisibilityPriority.High;
        WI.addMouseDownContextMenuHandlers(this._otherFiltersNavigationItem.element, this._handleOtherFiltersNavigationItemContextMenu.bind(this));
        this._updateOtherFiltersNavigationItemState();
        this._otherFiltersNavigationItem.element.appendChild(WI.ImageUtilities.useSVGSymbol("Images/Filter.svg", "glyph"));

        this._urlFilterSearchText = null;
        this._urlFilterSearchRegex = null;
        this._urlFilterIsActive = false;

        this._urlFilterNavigationItem = new WI.FilterBarNavigationItem;
        this._urlFilterNavigationItem.visibilityPriority = WI.NavigationItem.VisibilityPriority.High;
        this._urlFilterNavigationItem.filterBar.addEventListener(WI.FilterBar.Event.FilterDidChange, this._urlFilterDidChange, this);
        this._urlFilterNavigationItem.filterBar.placeholder = WI.UIString("Filter Full URL");

        this._activeTypeFilters = this._generateTypeFilter();
        this._activeURLFilterResources = new Set;

        this._emptyFilterResultsMessageElement = null;

        this._harImportNavigationItem = new WI.ButtonNavigationItem("har-import", WI.UIString("Import"), "Images/Import.svg", 15, 15);
        this._harImportNavigationItem.buttonStyle = WI.ButtonNavigationItem.Style.ImageAndText;
        this._harImportNavigationItem.tooltip = WI.UIString("HAR Import");
        this._harImportNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, function(event) {
            this._importHAR();
        }, this);

        this._harExportNavigationItem = new WI.ButtonNavigationItem("har-export", WI.UIString("Export"), "Images/Export.svg", 15, 15);
        this._harExportNavigationItem.buttonStyle = WI.ButtonNavigationItem.Style.ImageAndText;
        this._harExportNavigationItem.tooltip = WI.UIString("HAR Export (%s)").format(WI.saveKeyboardShortcut.displayName);
        this._harExportNavigationItem.enabled = false;
        this._harExportNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, function(event) {
            this._exportHAR();
        }, this);

        this._collectionsPathNavigationItem = new WI.HierarchicalPathNavigationItem;
        this._collectionsPathNavigationItem.addEventListener(WI.HierarchicalPathNavigationItem.Event.PathComponentWasSelected, this._collectionsHierarchicalPathComponentWasSelected, this);

        this._pathComponentsMap = new Map;
        this._lastPathComponent = null;
        let pathComponent = this._addCollectionPathComponent(this._mainCollection, WI.UIString("Live Activity"), "network-overview-icon");
        this._collectionsPathNavigationItem.components = [pathComponent];

        this._pathComponentsNavigationItemGroup = new WI.GroupNavigationItem([this._collectionsPathNavigationItem, new WI.DividerNavigationItem]);
        this._pathComponentsNavigationItemGroup.visibilityPriority = WI.NavigationItem.VisibilityPriority.High;
        this._pathComponentsNavigationItemGroup.hidden = true;

        this._buttonsNavigationItemGroup = new WI.GroupNavigationItem([this._harImportNavigationItem, this._harExportNavigationItem, new WI.DividerNavigationItem]);
        this._buttonsNavigationItemGroup.visibilityPriority = WI.NavigationItem.VisibilityPriority.Low;

        this._disableResourceCacheNavigationItem = new WI.CheckboxNavigationItem("network-disable-resource-cache", WI.UIString("Disable Caches"), WI.settings.resourceCachingDisabled.value);
        this._disableResourceCacheNavigationItem.visibilityPriority = WI.NavigationItem.VisibilityPriority.High;
        this._disableResourceCacheNavigationItem.addEventListener(WI.CheckboxNavigationItem.Event.CheckedDidChange, this._toggleDisableResourceCache, this);

        // COMPATIBILITY (macOS 13.0, iOS 16.0): Network.setEmulatedConditions did not exist.
        if (WI.settings.experimentalEnableNetworkEmulatedCondition.value && InspectorBackend.hasCommand("Network.setEmulatedConditions")) {
            let networkConditionScopeBarItems = [];
            for (let networkCondition of Object.values(WI.NetworkManager.EmulatedCondition)) {
                let scopeBarItem = new WI.ScopeBarItem("network-condition-" + networkCondition.id, networkCondition.displayName);
                scopeBarItem.__networkCondition = networkCondition;
                networkConditionScopeBarItems.push(scopeBarItem);
            }
            const shouldGroupNonExclusiveItems = true;
            this._networkConditionScopeBar = new WI.ScopeBar("network-condition-scope-bar", networkConditionScopeBarItems, networkConditionScopeBarItems[0], shouldGroupNonExclusiveItems);
            this._networkConditionScopeBar.visibilityPriority = WI.NavigationItem.VisibilityPriority.High;
            this._networkConditionScopeBar.addEventListener(WI.ScopeBar.Event.SelectionChanged, this._handleNetworkConditionSelectionChanged, this);
            this._handleNetworkConditionSelectionChanged();
        }

        this._clearNetworkItemsNavigationItem = new WI.ButtonNavigationItem("clear-network-items", WI.UIString("Clear Network Items (%s)").format(WI.clearKeyboardShortcut.displayName), "Images/NavigationItemTrash.svg", 15, 15);
        this._clearNetworkItemsNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, function(event) {
            this.reset();
        }, this);

        WI.Target.addEventListener(WI.Target.Event.ResourceAdded, this._handleResourceAdded, this);
        WI.Frame.addEventListener(WI.Frame.Event.MainResourceDidChange, this._mainResourceDidChange, this);
        WI.Frame.addEventListener(WI.Frame.Event.ResourceWasAdded, this._handleResourceAdded, this);
        WI.Frame.addEventListener(WI.Frame.Event.ChildFrameWasAdded, this._handleFrameWasAdded, this);
        WI.Resource.addEventListener(WI.Resource.Event.LoadingDidFinish, this._resourceLoadingDidFinish, this);
        WI.Resource.addEventListener(WI.Resource.Event.LoadingDidFail, this._resourceLoadingDidFail, this);
        WI.Resource.addEventListener(WI.Resource.Event.SizeDidChange, this._handleResourceSizeDidChange, this);
        WI.Resource.addEventListener(WI.Resource.Event.TransferSizeDidChange, this._resourceTransferSizeDidChange, this);
        WI.networkManager.addEventListener(WI.NetworkManager.Event.MainFrameDidChange, this._mainFrameDidChange, this);

        WI.settings.clearNetworkOnNavigate.addEventListener(WI.Setting.Event.Changed, this._handleClearNetworkOnNavigateChanged, this);
        WI.settings.resourceCachingDisabled.addEventListener(WI.Setting.Event.Changed, this._resourceCachingDisabledSettingChanged, this);
        if (WI.MediaInstrument.supported())
            WI.settings.groupMediaRequestsByDOMNode.addEventListener(WI.Setting.Event.Changed, this._handleGroupMediaRequestsByDOMNodeChanged, this);

        this._needsInitialPopulate = true;

        // FIXME: This is working around the order of events. Normal page navigation
        // triggers a MainResource change and then a MainFrame change. Page Transition
        // triggers a MainFrame change then a MainResource change.
        this._transitioningPageTarget = false;

        WI.notifications.addEventListener(WI.Notification.TransitionPageTarget, this._transitionPageTarget, this);
    }

    // Static

    static displayNameForResource(resource)
    {
        if (resource.type === WI.Resource.Type.Image || resource.type === WI.Resource.Type.Font || resource.type === WI.Resource.Type.Other) {
            let fileExtension;
            if (resource.mimeType)
                fileExtension = WI.fileExtensionForMIMEType(resource.mimeType);
            if (!fileExtension)
                fileExtension = WI.fileExtensionForURL(resource.url);
            if (fileExtension)
                return fileExtension;
        }

        switch (resource.type) {
        case WI.Resource.Type.Document:
            return WI.UIString("document", "document @ Network Tab Resource Type Column Value", "Shown in the 'Type' column of the Network Table for document resources.");

        case WI.Resource.Type.StyleSheet:
            return WI.unlocalizedString("css");

        case WI.Resource.Type.Image:
            return WI.UIString("image", "image @ Network Tab Resource Type Column Value", "Shown in the 'Type' column of the Network Table for image resources.");

        case WI.Resource.Type.Font:
            return WI.UIString("font", "font @ Network Tab Resource Type Column Value", "Shown in the 'Type' column of the Network Table for font resources.");

        case WI.Resource.Type.Script:
            return WI.unlocalizedString("js");

        case WI.Resource.Type.XHR:
            return WI.unlocalizedString("xhr");

        case WI.Resource.Type.Fetch:
            return WI.UIString("fetch", "fetch @ Network Tab Resource Type Column Value", "Shown in the 'Type' column of the Network Table for resources loaded via the 'fetch' method.");

        case WI.Resource.Type.Ping:
            return WI.UIString("ping", "ping @ Network Tab Resource Type Column Value", "Shown in the 'Type' column of the Network Table for resources loaded via '<a ping>' elements.");

        case WI.Resource.Type.Beacon:
            return WI.UIString("beacon", "beacon @ Network Tab Resource Type Column Value", "Shown in the 'Type' column of the Network Table for resources loaded via the Beacon API.");

        case WI.Resource.Type.WebSocket:
            return WI.UIString("socket", "socket @ Network Tab Resource Type Column Value", "Shown in the 'Type' column of the Network Table for WebSocket resources.");

        case WI.Resource.Type.EventSource:
            return WI.UIString("eventsource", "eventsource @ Network Tab Resource Type Column Value", "Shown in the 'Type' column of the Network Table for resources loaded via the EventSource API.");

        case WI.Resource.Type.Other:
            return WI.UIString("other", "other @ Network Tab Resource Type Column Value", "Shown in the 'Type' column of the Network Table for resources that don't fall into any of the other known types/categories.");
        }

        console.assert(false, resource.type);
        return "";
    }

    static get nodeWaterfallDOMEventSize() { return 8; }

    // Public

    get selectionPathComponents()
    {
        return null;
    }

    get navigationItems()
    {
        let items = [];
        if (this._disableResourceCacheNavigationItem)
            items.push(this._disableResourceCacheNavigationItem);
        if (this._networkConditionScopeBar)
            items.push(this._networkConditionScopeBar);
        if (items.length)
            items.push(new WI.DividerNavigationItem);
        items.push(this._pathComponentsNavigationItemGroup, this._buttonsNavigationItemGroup, this._clearNetworkItemsNavigationItem);
        return items;
    }

    get filterNavigationItems()
    {
        return [this._urlFilterNavigationItem, this._typeFilterScopeBar, this._otherFiltersNavigationItem];
    }

    get supportsSave()
    {
        return this._canExportHAR();
    }

    get saveMode()
    {
        return WI.FileUtilities.SaveMode.SingleFile;
    }

    get saveData()
    {
        return {customSaveHandler: () => { this._exportHAR(); }};
    }

    attached()
    {
        super.attached();

        WI.notifications.addEventListener(WI.Notification.GlobalModifierKeysDidChange, this._handleGlobalModifierKeysDidChange, this);
    }

    detached()
    {
        WI.notifications.removeEventListener(WI.Notification.GlobalModifierKeysDidChange, this._handleGlobalModifierKeysDidChange, this);

        this._hidePopover();

        super.detached();
    }

    closed()
    {
        for (let detailView of this._detailViewMap.values())
            detailView.dispose();
        this._detailViewMap.clear();

        this._domNodeEntries.clear();

        this._hidePopover();
        this._hideDetailView();

        // COMPATIBILITY (iOS 10.3): Network.setResourceCachingDisabled did not exist.
        if (InspectorBackend.hasCommand("Network.setResourceCachingDisabled"))
            WI.settings.resourceCachingDisabled.removeEventListener(WI.Setting.Event.Changed, this._resourceCachingDisabledSettingChanged, this);

        WI.Target.removeEventListener(WI.Target.Event.ResourceAdded, this._handleResourceAdded, this);
        WI.Frame.removeEventListener(WI.Frame.Event.MainResourceDidChange, this._mainResourceDidChange, this);
        WI.Frame.removeEventListener(WI.Frame.Event.ResourceWasAdded, this._handleResourceAdded, this);
        WI.Frame.removeEventListener(WI.Frame.Event.ChildFrameWasAdded, this._handleFrameWasAdded, this);
        WI.Resource.removeEventListener(WI.Resource.Event.LoadingDidFinish, this._resourceLoadingDidFinish, this);
        WI.Resource.removeEventListener(WI.Resource.Event.LoadingDidFail, this._resourceLoadingDidFail, this);
        WI.Resource.removeEventListener(WI.Resource.Event.SizeDidChange, this._handleResourceSizeDidChange, this);
        WI.Resource.removeEventListener(WI.Resource.Event.TransferSizeDidChange, this._resourceTransferSizeDidChange, this);
        WI.networkManager.removeEventListener(WI.NetworkManager.Event.MainFrameDidChange, this._mainFrameDidChange, this);

        if (WI.MediaInstrument.supported())
            WI.settings.groupMediaRequestsByDOMNode.removeEventListener(WI.Setting.Event.Changed, this._handleGroupMediaRequestsByDOMNodeChanged, this);

        super.closed();
    }

    reset()
    {
        this._runForMainCollection((collection, wasMain) => {
            this._resetCollection(collection);

            if (wasMain)
                this._updateStatistics();
        });

        for (let detailView of this._detailViewMap.values())
            detailView.dispose();
        this._detailViewMap.clear();

        this._domNodeEntries.clear();

        this._updateWaterfallTimelineRuler();
        this._updateExportButton();

        if (this._table) {
            this._selectedObject = null;
            this._table.reloadData();
            this._hidePopover();
            this._hideDetailView();
        }
    }

    showRepresentedObject(representedObject, cookie)
    {
        console.assert(representedObject instanceof WI.Resource);

        let rowIndex = this._rowIndexForRepresentedObject(representedObject);
        if (rowIndex === -1) {
            this._selectedObject = null;
            this._table.deselectAll();
            this._hideDetailView();
            return;
        }

        this._showingRepresentedObjectCookie = cookie;
        this._table.selectRow(rowIndex);
        this._showingRepresentedObjectCookie = null;
    }

    get canFocusFilterBar()
    {
        return !this._detailView;
    }

    focusFilterBar()
    {
        this._urlFilterNavigationItem.filterBar.focus();
    }

    // NetworkDetailView delegate

    networkDetailViewClose(networkDetailView)
    {
        this._selectedObject = null;
        this._table.deselectAll();
        this._hideDetailView();
    }

    // Table dataSource

    tableIndexForRepresentedObject(table, object)
    {
        return this._activeCollection.filteredEntries.indexOf(object);
    }

    tableRepresentedObjectForIndex(table, index)
    {
        console.assert(index >= 0 && index < this._activeCollection.filteredEntries.length);
        return this._activeCollection.filteredEntries[index];
    }

    tableNumberOfRows(table)
    {
        return this._activeCollection.filteredEntries.length;
    }

    tableSortChanged(table)
    {
        this._generateSortComparator();

        if (!this._entriesSortComparator)
            return;

        this._hideDetailView();

        for (let nodeEntry of this._domNodeEntries.values())
            nodeEntry.initiatedResourceEntries.sort(this._entriesSortComparator);

        this._updateSort();
        this._updateFilteredEntries();
        this._reloadTable();
    }

    // Table delegate

    tableCellContextMenuClicked(table, cell, column, rowIndex, event)
    {
        if (column !== this._nameColumn)
            return;

        this._table.selectRow(rowIndex);

        let entry = this._activeCollection.filteredEntries[rowIndex];
        let contextMenu = WI.ContextMenu.createFromEvent(event);
        WI.appendContextMenuItemsForSourceCode(contextMenu, entry.resource);

        contextMenu.appendSeparator();
        contextMenu.appendItem(WI.UIString("Export HAR"), () => { this._exportHAR(); }, !this._canExportHAR());
    }

    tableRowHovered(table, rowIndex)
    {
        this._hoveredRowIndex = rowIndex;

        this._highlightRelatedResourcesForHoveredResource();
    }

    tableShouldSelectRow(table, cell, column, rowIndex)
    {
        return column === this._nameColumn;
    }

    tableSelectionDidChange(table)
    {
        let rowIndex = table.selectedRow;
        if (isNaN(rowIndex)) {
            this._selectedObject = null;
            this._hideDetailView();
            return;
        }

        let entry = this._activeCollection.filteredEntries[rowIndex];
        if (entry.resource === this._selectedObject || entry.domNode === this._selectedObject)
            return;

        this._selectedObject = entry.resource || entry.domNode;
        if (this._selectedObject)
            this._showDetailView(this._selectedObject);
        else
            this._hideDetailView();
    }

    tableRowClassNames(table, rowIndex)
    {
        let entry = this._activeCollection.filteredEntries[rowIndex];
        return entry.rowClassNames;
    }

    tablePopulateCell(table, cell, column, rowIndex)
    {
        let entry = this._activeCollection.filteredEntries[rowIndex];

        cell.classList.toggle("current-session", entry.currentSession);

        if (entry.resource)
            cell.classList.toggle("error", entry.resource.hadLoadingError());

        let setTextContent = (accessor) => {
            let uniqueValues = this._uniqueValuesForDOMNodeEntry(entry, accessor);
            if (uniqueValues) {
                if (uniqueValues.size > 1) {
                    cell.classList.add("multiple");
                    cell.textContent = WI.UIString("(multiple)");
                    return;
                }

                cell.textContent = uniqueValues.values().next().value || emDash;
                return;
            }

            cell.textContent = accessor(entry) || emDash;
        };

        switch (column.identifier) {
        case "name":
            this._populateNameCell(cell, entry);
            break;
        case "domain":
            this._populateDomainCell(cell, entry);
            break;
        case "path":
            setTextContent((resourceEntry) => resourceEntry.path);
            break;
        case "type":
            setTextContent((resourceEntry) => resourceEntry.displayType);
            break;
        case "mimeType":
            setTextContent((resourceEntry) => resourceEntry.mimeType);
            break;
        case "method":
            setTextContent((resourceEntry) => resourceEntry.method);
            break;
        case "scheme":
            setTextContent((resourceEntry) => resourceEntry.scheme);
            break;
        case "status":
            setTextContent((resourceEntry) => resourceEntry.status);
            break;
        case "protocol":
            setTextContent((resourceEntry) => resourceEntry.protocol);
            break;
        case "initiator":
            this._populateInitiatorCell(cell, entry);
            break;
        case "priority":
            setTextContent((resourceEntry) => WI.Resource.displayNameForPriority(resourceEntry.priority));
            break;
        case "remoteAddress":
            setTextContent((resourceEntry) => resourceEntry.remoteAddress);
            break;
        case "connectionIdentifier":
            setTextContent((resourceEntry) => resourceEntry.connectionIdentifier);
            break;
        case "resourceSize": {
            let resourceSize = entry.resourceSize;
            let resourceEntries = entry.initiatedResourceEntries;
            if (resourceEntries)
                resourceSize = resourceEntries.reduce((accumulator, current) => accumulator + (current.resourceSize || 0), 0);
            cell.textContent = isNaN(resourceSize) ? emDash : Number.bytesToString(resourceSize);
            break;
        }
        case "transferSize":
            this._populateTransferSizeCell(cell, entry);
            break;
        case "time": {
            // FIXME: <https://webkit.org/b/176748> Web Inspector: Frontend sometimes receives resources with negative duration (responseEnd - requestStart)
            let time = entry.time;
            let resourceEntries = entry.initiatedResourceEntries;
            if (resourceEntries)
                time = resourceEntries.reduce((accumulator, current) => accumulator + (current.time || 0), 0);
            cell.textContent = isNaN(time) ? emDash : Number.secondsToString(Math.max(time, 0));
            break;
        }
        case "waterfall":
            this._populateWaterfallGraph(cell, entry);
            break;
        }

        return cell;
    }

    // Private

    _addCollection()
    {
        let collection = {};
        this._resetCollection(collection);
        this._collections.push(collection);
        return collection;
    }

    _resetCollection(collection)
    {
        collection.entries = [];
        collection.filteredEntries = [];
        collection.pendingInsertions = [];
        collection.pendingUpdates = [];
        collection.waterfallStartTime = NaN;
        collection.waterfallEndTime = NaN;
    }

    _setActiveCollection(collection)
    {
        console.assert(this._collections.includes(collection));

        if (this._activeCollection === collection)
            return;

        this._activeCollection = collection;
    }

    _addCollectionPathComponent(collection, displayName, iconClassName)
    {
        let pathComponent = new WI.HierarchicalPathComponent(displayName, iconClassName, collection);
        this._pathComponentsMap.set(collection, pathComponent);

        if (this._lastPathComponent) {
            this._lastPathComponent.nextSibling = pathComponent;
            pathComponent.previousSibling = this._lastPathComponent;
        }

        this._lastPathComponent = pathComponent;

        if (this._pathComponentsNavigationItemGroup && this._pathComponentsMap.size > 1)
            this._pathComponentsNavigationItemGroup.hidden = false;

        return pathComponent;
    }

    _collectionsHierarchicalPathComponentWasSelected(event)
    {
        console.assert(event.data.pathComponent instanceof WI.HierarchicalPathComponent);

        let collection = event.data.pathComponent.representedObject;

        this._changeCollection(collection);
    }

    _changeCollection(collection)
    {
        if (collection === this._activeCollection)
            return;

        this._setActiveCollection(collection);

        let isMain = collection === this._mainCollection;
        this._clearNetworkItemsNavigationItem.enabled = isMain;
        this._collectionsPathNavigationItem.components = [this._pathComponentsMap.get(collection)];

        this._updateSort();
        this._updateActiveFilterResources();
        this._updateFilteredEntries();
        this._updateWaterfallTimelineRuler();
        this._reloadTable();
        this._updateStatistics();
        this._hideDetailView();

        this.needsLayout();
    }

    _populateNameCell(cell, entry)
    {
        console.assert(!cell.firstChild, "We expect the cell to be empty.", cell, cell.firstChild);

        function createIconElement() {
            let iconElement = cell.appendChild(document.createElement("img"));
            iconElement.className = "icon";
            return iconElement;
        }

        let domNode = entry.domNode;
        if (domNode) {
            this._table.element.classList.add("grouped");

            cell.classList.add("parent");

            let disclosureElement = cell.appendChild(document.createElement("img"));
            disclosureElement.classList.add("disclosure");
            disclosureElement.classList.toggle("expanded", !!entry.expanded);
            disclosureElement.addEventListener("click", (event) => {
                entry.expanded = !entry.expanded;

                this._updateFilteredEntries();
                this._reloadTable();
            });

            createIconElement();

            cell.classList.add("dom-node");
            cell.appendChild(WI.linkifyNodeReference(domNode));
            return;
        }

        let resource = entry.resource;
        if (resource.isLoading()) {
            let statusElement = cell.appendChild(document.createElement("div"));
            statusElement.className = "status";
            let spinner = new WI.IndeterminateProgressSpinner;
            statusElement.appendChild(spinner.element);
        }

        let resourceIconElement = createIconElement();

        cell.classList.add(WI.ResourceTreeElement.ResourceIconStyleClassName, ...WI.Resource.classNamesForResource(resource));

        if (WI.settings.groupMediaRequestsByDOMNode.value && resource.initiatorNode) {
            let nodeEntry = this._domNodeEntries.get(resource.initiatorNode);
            if (nodeEntry.initiatedResourceEntries.length > 1 || nodeEntry.domNode.domEvents.length)
                cell.classList.add("child");
        }

        let nameElement = cell.appendChild(document.createElement("span"));
        nameElement.textContent = entry.name;

        let range = resource.requestedByteRange;
        if (range) {
            let rangeElement = nameElement.appendChild(document.createElement("span"));
            rangeElement.classList.add("range");
            rangeElement.textContent = WI.UIString("Byte Range %s\u2013%s").format(range.start, range.end);
        }

        cell.title = resource.url;
        if (resource.responseSource === WI.Resource.ResponseSource.InspectorOverride)
            resourceIconElement.title = WI.UIString("This resource was loaded from a local override");
    }

    _populateDomainCell(cell, entry)
    {
        console.assert(!cell.firstChild, "We expect the cell to be empty.", cell, cell.firstChild);

        function createIconAndText(scheme, domain) {
            let secure = scheme === "https" || scheme === "wss";
            if (secure) {
                let lockIconElement = cell.appendChild(document.createElement("img"));
                lockIconElement.className = "lock";
            }

            cell.append(domain || emDash);
        }

        let uniqueSchemeValues = this._uniqueValuesForDOMNodeEntry(entry, (resourceEntry) => resourceEntry.scheme);
        let uniqueDomainValues = this._uniqueValuesForDOMNodeEntry(entry, (resourceEntry) => resourceEntry.domain);
        if (uniqueSchemeValues && uniqueDomainValues) {
            if (uniqueSchemeValues.size > 1 || uniqueDomainValues.size > 1) {
                cell.classList.add("multiple");
                cell.textContent = WI.UIString("(multiple)");
                return;
            }

            createIconAndText(uniqueSchemeValues.values().next().value, uniqueDomainValues.values().next().value);
            return;
        }

        createIconAndText(entry.scheme, entry.domain);
    }

    _populateInitiatorCell(cell, entry)
    {
        let domNode = entry.domNode;
        if (domNode) {
            cell.textContent = emDash;
            return;
        }

        let initiatorLocation = entry.resource.initiatorSourceCodeLocation;
        if (!initiatorLocation) {
            cell.textContent = emDash;
            return;
        }

        const options = {
            dontFloat: true,
            ignoreSearchTab: true,
        };
        cell.appendChild(WI.createSourceCodeLocationLink(initiatorLocation, options));
    }

    _populateTransferSizeCell(cell, entry)
    {
        let resourceEntries = entry.initiatedResourceEntries;
        if (resourceEntries) {
            if (resourceEntries.every((resourceEntry) => resourceEntry.resource.responseSource === WI.Resource.ResponseSource.MemoryCache)) {
                cell.classList.add("cache-type");
                cell.textContent = WI.UIString("(memory)");
                cell.title = WI.UIString("This resource was loaded from the memory cache");
                return;
            }
            if (resourceEntries.every((resourceEntry) => resourceEntry.resource.responseSource === WI.Resource.ResponseSource.DiskCache)) {
                cell.classList.add("cache-type");
                cell.textContent = WI.UIString("(disk)");
                cell.title = WI.UIString("This resource was loaded from the disk cache");
                return;
            }
            if (resourceEntries.every((resourceEntry) => resourceEntry.resource.responseSource === WI.Resource.ResponseSource.ServiceWorker)) {
                cell.classList.add("cache-type");
                cell.textContent = WI.UIString("(service worker)");
                cell.title = WI.UIString("This resource was loaded from a service worker");
                return;
            }

            console.assert(!cell.classList.contains("cache-type"), "Should not have cache-type class on cell.");

            let transferSize = resourceEntries.reduce((accumulator, current) => accumulator + (current.transferSize || 0), 0);
            cell.textContent = isNaN(transferSize) ? emDash : Number.bytesToString(transferSize);
            cell.title = "";
            return;
        }

        let responseSource = entry.resource.responseSource;
        if (responseSource === WI.Resource.ResponseSource.MemoryCache) {
            cell.classList.add("cache-type");
            cell.textContent = WI.UIString("(memory)");
            cell.title = WI.UIString("This resource was loaded from the memory cache");
            return;
        }
        if (responseSource === WI.Resource.ResponseSource.DiskCache) {
            cell.classList.add("cache-type");
            cell.textContent = WI.UIString("(disk)");
            cell.title = WI.UIString("This resource was loaded from the disk cache");
            return;
        }
        if (responseSource === WI.Resource.ResponseSource.ServiceWorker) {
            cell.classList.add("cache-type");
            cell.textContent = WI.UIString("(service worker)");
            cell.title = WI.UIString("This resource was loaded from a service worker");
            return;
        }
        if (responseSource === WI.Resource.ResponseSource.InspectorOverride) {
            cell.classList.add("cache-type");
            cell.textContent = WI.UIString("(local override)");
            cell.title = WI.UIString("This resource was loaded from a local override");
            return;
        }

        console.assert(!cell.classList.contains("cache-type"), "Should not have cache-type class on cell.");

        let transferSize = entry.transferSize;
        cell.textContent = isNaN(transferSize) ? emDash : Number.bytesToString(transferSize);
        cell.title = "";
    }

    _populateWaterfallGraph(cell, entry)
    {
        cell.classList.add("network");

        cell.removeChildren();

        let container = cell.appendChild(document.createElement("div"));
        container.className = "waterfall-container";

        let collection = this._activeCollection;
        let graphStartTime = this._waterfallTimelineRuler.startTime;
        let secondsPerPixel = this._waterfallTimelineRuler.secondsPerPixel;

        function positionByStartOffset(element, timestamp) {
            let styleAttribute = WI.resolvedLayoutDirection() === WI.LayoutDirection.LTR ? "left" : "right";
            element.style.setProperty(styleAttribute, ((timestamp - graphStartTime) / secondsPerPixel) + "px");
        }

        function setWidthForDuration(element, startTimestamp, endTimestamp) {
            element.style.setProperty("width", ((endTimestamp - startTimestamp) / secondsPerPixel) + "px");
        }

        let domNode = entry.domNode;
        if (domNode) {
            let groupedDOMEvents = [];
            for (let domEvent of domNode.domEvents) {
                if (domEvent.originator)
                    continue;

                if (!groupedDOMEvents.length || (domEvent.timestamp - groupedDOMEvents.lastValue.endTimestamp) >= (NetworkTableContentView.nodeWaterfallDOMEventSize * secondsPerPixel)) {
                    groupedDOMEvents.push({
                        startTimestamp: domEvent.timestamp,
                        domEvents: [],
                    });
                }
                groupedDOMEvents.lastValue.endTimestamp = domEvent.timestamp;
                groupedDOMEvents.lastValue.domEvents.push(domEvent);
            }

            let fullscreenDOMEvents = WI.DOMNode.getFullscreenDOMEvents(domNode.domEvents);
            if (fullscreenDOMEvents.length) {
                if (!fullscreenDOMEvents[0].data.enabled)
                    fullscreenDOMEvents.unshift({timestamp: graphStartTime});

                if (fullscreenDOMEvents.lastValue.data.enabled)
                    fullscreenDOMEvents.push({timestamp: collection.waterfallEndTime});

                console.assert((fullscreenDOMEvents.length % 2) === 0, "Every enter/exit of fullscreen should have a corresponding exit/enter.");

                for (let i = 0; i < fullscreenDOMEvents.length; i += 2) {
                    let fullscreenElement = container.appendChild(document.createElement("div"));
                    fullscreenElement.classList.add("area", "dom-fullscreen");
                    positionByStartOffset(fullscreenElement, fullscreenDOMEvents[i].timestamp);
                    setWidthForDuration(fullscreenElement, fullscreenDOMEvents[i].timestamp, fullscreenDOMEvents[i + 1].timestamp);

                    let originator = fullscreenDOMEvents[i].originator || fullscreenDOMEvents[i + 1].originator;
                    if (originator)
                        fullscreenElement.title = WI.UIString("Full-Screen from \u201C%s\u201D").format(originator.displayName);
                    else
                        fullscreenElement.title = WI.UIString("Full-Screen");
                }
            }

            for (let powerEfficientPlaybackRange of domNode.powerEfficientPlaybackRanges) {
                let startTimestamp = powerEfficientPlaybackRange.startTimestamp || graphStartTime;
                let endTimestamp = powerEfficientPlaybackRange.endTimestamp || collection.waterfallEndTime;

                let powerEfficientPlaybackRangeElement = container.appendChild(document.createElement("div"));
                powerEfficientPlaybackRangeElement.classList.add("area", "power-efficient-playback");
                powerEfficientPlaybackRangeElement.title = WI.UIString("Power Efficient Playback");
                positionByStartOffset(powerEfficientPlaybackRangeElement, startTimestamp);
                setWidthForDuration(powerEfficientPlaybackRangeElement, startTimestamp, endTimestamp);
            }

            let playing = false;

            function createDOMEventLine(domEvents, startTimestamp, endTimestamp) {
                if (WI.DOMNode.isStopEvent(domEvents.lastValue.eventName))
                    return;

                for (let i = domEvents.length - 1; i >= 0; --i) {
                    let domEvent = domEvents[i];
                    if (WI.DOMNode.isPlayEvent(domEvent.eventName)) {
                        playing = true;
                        break;
                    }

                    if (WI.DOMNode.isPauseEvent(domEvent.eventName)) {
                        playing = false;
                        break;
                    }
                }

                let lineElement = container.appendChild(document.createElement("div"));
                lineElement.classList.add("dom-activity");
                lineElement.classList.toggle("playing", playing);
                positionByStartOffset(lineElement, startTimestamp);
                setWidthForDuration(lineElement, startTimestamp, endTimestamp);
            }

            for (let [a, b] of groupedDOMEvents.adjacencies())
                createDOMEventLine(a.domEvents, a.endTimestamp, b.startTimestamp);

            if (groupedDOMEvents.length)
                createDOMEventLine(groupedDOMEvents.lastValue.domEvents, groupedDOMEvents.lastValue.endTimestamp, collection.waterfallEndTime);

            for (let {startTimestamp, endTimestamp, domEvents} of groupedDOMEvents) {
                let paddingForCentering = NetworkTableContentView.nodeWaterfallDOMEventSize * secondsPerPixel / 2;

                let eventElement = container.appendChild(document.createElement("div"));
                eventElement.classList.add("dom-event");
                positionByStartOffset(eventElement, startTimestamp - paddingForCentering);
                setWidthForDuration(eventElement, startTimestamp, endTimestamp + paddingForCentering);
                eventElement.addEventListener("mousedown", (event) => {
                    if (event.button !== 0 || event.ctrlKey)
                        return;
                    this._handleNodeEntryMousedownWaterfall(entry, domEvents);
                });

                for (let domEvent of domEvents)
                    entry.domEventElements.set(domEvent, eventElement);
            }

            return;
        }

        let resource = entry.resource;
        if (!resource.hasResponse()) {
            cell.textContent = zeroWidthSpace;
            return;
        }

        let {startTime, redirectStart, redirectEnd, fetchStart, domainLookupStart, domainLookupEnd, connectStart, connectEnd, secureConnectionStart, requestStart, responseStart, responseEnd} = resource.timingData;
        if (isNaN(startTime) || isNaN(responseEnd) || startTime > responseEnd) {
            cell.textContent = zeroWidthSpace;
            return;
        }

        if (responseEnd < graphStartTime) {
            cell.textContent = zeroWidthSpace;
            return;
        }

        let graphEndTime = this._waterfallTimelineRuler.endTime;
        if (startTime > graphEndTime) {
            cell.textContent = zeroWidthSpace;
            return;
        }

        let lastEndTimestamp = NaN;
        function appendBlock(startTimestamp, endTimestamp, className) {
            if (isNaN(startTimestamp) || isNaN(endTimestamp))
                return null;

            if (Math.abs(startTimestamp - lastEndTimestamp) < secondsPerPixel * 2)
                startTimestamp = lastEndTimestamp;
            lastEndTimestamp = endTimestamp;

            let block = container.appendChild(document.createElement("div"));
            block.classList.add("block", className);
            positionByStartOffset(block, startTimestamp);
            setWidthForDuration(block, startTimestamp, endTimestamp);
            return block;
        }

        // Mouse block sits on top and accepts mouse events on this group.
        let padSeconds = 10 * secondsPerPixel;
        let mouseBlock = appendBlock(startTime - padSeconds, responseEnd + padSeconds, "mouse-tracking");
        mouseBlock.addEventListener("mousedown", (event) => {
            if (event.button !== 0 || event.ctrlKey)
                return;
            this._handleResourceEntryMousedownWaterfall(entry);
        });

        // Super small visualization.
        let totalWidth = (responseEnd - startTime) / secondsPerPixel;
        if (totalWidth <= 3) {
            let twoPixels = secondsPerPixel * 2;
            appendBlock(startTime, startTime + twoPixels, "queue");
            appendBlock(startTime + twoPixels, startTime + (2 * twoPixels), "response");
            return;
        }

        appendBlock(startTime, responseEnd, "filler");

        // FIXME: <https://webkit.org/b/190214> Web Inspector: expose full load metrics for redirect requests
        appendBlock(redirectStart, redirectEnd, "redirect");

        if (domainLookupStart) {
            appendBlock(fetchStart, domainLookupStart, "queue");
            appendBlock(domainLookupStart, domainLookupEnd || connectStart || requestStart, "dns");
        } else if (connectStart)
            appendBlock(fetchStart, connectStart, "queue");
        else if (requestStart)
            appendBlock(fetchStart, requestStart, "queue");
        if (connectStart)
            appendBlock(connectStart, secureConnectionStart || connectEnd, "connect");
        if (secureConnectionStart)
            appendBlock(secureConnectionStart, connectEnd, "secure");
        appendBlock(requestStart, responseStart, "request");
        appendBlock(responseStart, responseEnd, "response");
    }

    _generateSortComparator()
    {
        let sortColumnIdentifier = this._table.sortColumnIdentifier;
        if (!sortColumnIdentifier) {
            this._entriesSortComparator = null;
            return;
        }

        let comparator;

        switch (sortColumnIdentifier) {
        case "name":
        case "domain":
        case "path":
        case "mimeType":
        case "method":
        case "scheme":
        case "protocol":
        case "initiator":
        case "remoteAddress":
            // Simple string.
            comparator = (a, b) => (a[sortColumnIdentifier] || "").extendedLocaleCompare(b[sortColumnIdentifier] || "");
            break;

        case "status":
        case "connectionIdentifier":
        case "resourceSize":
        case "time":
            // Simple number.
            comparator = (a, b) => {
                let aValue = a[sortColumnIdentifier];
                let bValue = b[sortColumnIdentifier];

                if (isNaN(aValue) && isNaN(bValue))
                    return 0;
                if (isNaN(aValue))
                    return 1;
                if (isNaN(bValue))
                    return -1;
                return aValue - bValue;
            };
            break;

        case "priority":
            // Resource.NetworkPriority enum.
            comparator = (a, b) => WI.Resource.comparePriority(a.priority, b.priority);
            break;

        case "type":
            // Sort by displayType string.
            comparator = (a, b) => (a.displayType || "").extendedLocaleCompare(b.displayType || "");
            break;

        case "transferSize":
            // Handle (memory) and (disk) values.
            comparator = (a, b) => {
                let transferSizeA = a.transferSize;
                let transferSizeB = b.transferSize;

                if (isNaN(transferSizeA) && isNaN(transferSizeB))
                    return 0;

                // Treat NaN as the largest value.
                if (isNaN(transferSizeA))
                    return 1;
                if (isNaN(transferSizeB))
                    return -1;

                // Treat memory cache and disk cache as small values.
                let sourceA = a.resource.responseSource;
                if (sourceA === WI.Resource.ResponseSource.MemoryCache)
                    transferSizeA = -20;
                else if (sourceA === WI.Resource.ResponseSource.DiskCache)
                    transferSizeA = -10;
                else if (sourceA === WI.Resource.ResponseSource.ServiceWorker)
                    transferSizeA = -5;
                else if (sourceA === WI.Resource.ResponseSource.InspectorOverride)
                    transferSizeA = -3;

                let sourceB = b.resource.responseSource;
                if (sourceB === WI.Resource.ResponseSource.MemoryCache)
                    transferSizeB = -20;
                else if (sourceB === WI.Resource.ResponseSource.DiskCache)
                    transferSizeB = -10;
                else if (sourceB === WI.Resource.ResponseSource.ServiceWorker)
                    transferSizeB = -5;
                else if (sourceB === WI.Resource.ResponseSource.InspectorOverride)
                    transferSizeB = -3;

                return transferSizeA - transferSizeB;
            };
            break;

        case "waterfall":
            // Sort by startTime number.
            comparator = (a, b) => a.startTime - b.startTime;
            break;

        default:
            console.assert("Unexpected sort column", sortColumnIdentifier);
            return;
        }

        let reverseFactor = this._table.sortOrder === WI.Table.SortOrder.Ascending ? 1 : -1;

        // If the entry has an `initiatorNode`, use that node's "first" resource as the value of
        // `entry`, so long as the entry being compared to doesn't have the same `initiatorNode`.
        // This will ensure that all resource entries for a given `initiatorNode` will appear right
        // next to each other, as they will all effectively be sorted by the first resource.
        let substitute = (entry, other) => {
            if (WI.settings.groupMediaRequestsByDOMNode.value && entry.resource.initiatorNode) {
                let nodeEntry = this._domNodeEntries.get(entry.resource.initiatorNode);
                if (!nodeEntry.initiatedResourceEntries.includes(other))
                    return nodeEntry.initiatedResourceEntries[0];
            }
            return entry;
        };

        this._entriesSortComparator = (a, b) => reverseFactor * comparator(substitute(a, b), substitute(b, a));
    }

    // Protected

    initialLayout()
    {
        super.initialLayout();

        this.element.style.setProperty("--node-waterfall-dom-event-size", NetworkTableContentView.nodeWaterfallDOMEventSize + "px");

        this._waterfallTimelineRuler = new WI.TimelineRuler;
        this._waterfallTimelineRuler.allowsClippedLabels = true;

        this._nameColumn = new WI.TableColumn("name", WI.UIString("Name"), {
            minWidth: this._nameColumnWidthSetting.defaultValue,
            maxWidth: 500,
            initialWidth: this._nameColumnWidthSetting.value,
            resizeType: WI.TableColumn.ResizeType.Locked,
        });

        this._domainColumn = new WI.TableColumn("domain", WI.UIString("Domain"), {
            minWidth: 120,
            maxWidth: 200,
            initialWidth: 150,
        });

        this._pathColumn = new WI.TableColumn("path", WI.UIString("Path"), {
            hidden: true,
            minWidth: 120,
            maxWidth: 400,
            initialWidth: 150,
        });

        this._typeColumn = new WI.TableColumn("type", WI.UIString("Type"), {
            minWidth: 70,
            maxWidth: 120,
            initialWidth: 70,
        });

        this._mimeTypeColumn = new WI.TableColumn("mimeType", WI.UIString("MIME Type"), {
            hidden: true,
            minWidth: 50,
            maxWidth: 150,
            initialWidth: 100,
        });

        this._methodColumn = new WI.TableColumn("method", WI.UIString("Method"), {
            hidden: true,
            minWidth: 55,
            maxWidth: 80,
            initialWidth: 65,
        });

        this._schemeColumn = new WI.TableColumn("scheme", WI.UIString("Scheme"), {
            hidden: true,
            minWidth: 55,
            maxWidth: 80,
            initialWidth: 65,
        });

        this._statusColumn = new WI.TableColumn("status", WI.UIString("Status"), {
            hidden: true,
            minWidth: 50,
            maxWidth: 50,
            align: "left",
        });

        this._protocolColumn = new WI.TableColumn("protocol", WI.UIString("Protocol"), {
            hidden: true,
            minWidth: 65,
            maxWidth: 80,
            initialWidth: 75,
        });

        this._initiatorColumn = new WI.TableColumn("initiator", WI.UIString("Initiator"), {
            minWidth: 75,
            maxWidth: 175,
            initialWidth: 100,
        });

        this._priorityColumn = new WI.TableColumn("priority", WI.UIString("Priority"), {
            hidden: true,
            minWidth: 65,
            maxWidth: 80,
            initialWidth: 70,
        });

        this._remoteAddressColumn = new WI.TableColumn("remoteAddress", WI.UIString("IP Address"), {
            hidden: true,
            minWidth: 150,
        });

        this._connectionIdentifierColumn = new WI.TableColumn("connectionIdentifier", WI.UIString("Connection ID"), {
            hidden: true,
            minWidth: 50,
            maxWidth: 120,
            initialWidth: 80,
            align: "right",
        });

        this._resourceSizeColumn = new WI.TableColumn("resourceSize", WI.UIString("Resource Size"), {
            hidden: true,
            minWidth: 80,
            maxWidth: 100,
            initialWidth: 80,
            align: "right",
        });

        this._transferSizeColumn = new WI.TableColumn("transferSize", WI.UIString("Transfer Size", "Amount of data sent over the network for a single resource"), {
            minWidth: 50,
            maxWidth: 150,
            initialWidth: 50,
            align: "right",
        });

        this._timeColumn = new WI.TableColumn("time", WI.UIString("Time"), {
            minWidth: 65,
            maxWidth: 90,
            initialWidth: 65,
            align: "right",
        });

        this._waterfallColumn = new WI.TableColumn("waterfall", WI.UIString("Waterfall"), {
            minWidth: 230,
            headerView: this._waterfallTimelineRuler,
            needsReloadOnResize: true,
        });

        this._nameColumn.addEventListener(WI.TableColumn.Event.WidthDidChange, this._tableNameColumnDidChangeWidth, this);
        this._waterfallColumn.addEventListener(WI.TableColumn.Event.WidthDidChange, this._tableWaterfallColumnDidChangeWidth, this);

        this._table = new WI.Table("network-table", this, this, 20);

        this._table.addColumn(this._nameColumn);
        this._table.addColumn(this._domainColumn);
        this._table.addColumn(this._pathColumn);
        this._table.addColumn(this._typeColumn);
        this._table.addColumn(this._mimeTypeColumn);
        this._table.addColumn(this._methodColumn);
        this._table.addColumn(this._schemeColumn);
        this._table.addColumn(this._statusColumn);
        this._table.addColumn(this._protocolColumn);
        this._table.addColumn(this._initiatorColumn);
        this._table.addColumn(this._priorityColumn);
        this._table.addColumn(this._remoteAddressColumn);
        this._table.addColumn(this._connectionIdentifierColumn);
        this._table.addColumn(this._resourceSizeColumn);
        this._table.addColumn(this._transferSizeColumn);
        this._table.addColumn(this._timeColumn);
        this._table.addColumn(this._waterfallColumn);

        if (!this._table.sortColumnIdentifier) {
            this._table.sortOrder = WI.Table.SortOrder.Ascending;
            this._table.sortColumnIdentifier = "waterfall";
        }

        this.addSubview(this._table);

        let statisticsContainer = this.element.appendChild(document.createElement("div"));
        statisticsContainer.className = "statistics";

        this._referencePageLinkElement = statisticsContainer.appendChild(document.createElement("div"));
        this._handleCurrentResourceDetailViewDidChange();

        let createStatisticElement = (name, image) => {
            let statistic = this._statistics[name];
            if (!statistic)
                statistic = this._statistics[name] = {};

            statistic.container = statisticsContainer.appendChild(document.createElement("div"));
            statistic.container.classList.add("statistic", name);

            statistic.container.appendChild(WI.ImageUtilities.useSVGSymbol(image, "icon"));

            statistic.element = statistic.container.appendChild(document.createElement("div"));
            statistic.element.className = "text";
        };
        createStatisticElement("domain-count", "Images/Origin.svg");
        createStatisticElement("resource-count", "Images/Resources.svg");
        createStatisticElement("resource-size", "Images/Weight.svg");
        createStatisticElement("transfer-size", "Images/Network.svg");
        createStatisticElement("redirect-count", "Images/StepOver.svg");
        createStatisticElement("load-time", "Images/Time.svg");

        this._updateStatistics();
    }

    layout()
    {
        this._updateWaterfallTimelineRuler();
        this._processPendingEntries();
        this._positionDetailView();
        this._updateExportButton();
    }

    didLayoutSubtree()
    {
        super.didLayoutSubtree();

        if (this._waterfallPopover)
            this._waterfallPopover.resize();
    }

    processHAR(result)
    {
        let resources = WI.networkManager.processHAR(result);
        if (!resources)
            return;

        let importedCollection = this._addCollection();

        let displayName = WI.UIString("Imported - %s").format(result.filename);
        this._addCollectionPathComponent(importedCollection, displayName, "network-har-icon");

        this._changeCollection(importedCollection);

        for (let resource of resources)
            this._insertResourceAndReloadTable(resource);

        this._updateStatistics();
    }

    handleClearShortcut(event)
    {
        if (!this._isShowingMainCollection())
            return;

        this.reset();
    }

    // Private

    _updateWaterfallTimeRange(startTimestamp, endTimestamp)
    {
        let collection = this._activeCollection;

        if (isNaN(collection.waterfallStartTime) || startTimestamp < collection.waterfallStartTime)
            collection.waterfallStartTime = startTimestamp;

        if (isNaN(collection.waterfallEndTime) || endTimestamp > collection.waterfallEndTime)
            collection.waterfallEndTime = endTimestamp;
    }

    _updateWaterfallTimelineRuler()
    {
        if (!this._waterfallTimelineRuler)
            return;

        let collection = this._activeCollection;

        if (isNaN(collection.waterfallStartTime)) {
            this._waterfallTimelineRuler.zeroTime = 0;
            this._waterfallTimelineRuler.startTime = 0;
            this._waterfallTimelineRuler.endTime = 0.250;
        } else {
            this._waterfallTimelineRuler.zeroTime = collection.waterfallStartTime;
            this._waterfallTimelineRuler.startTime = collection.waterfallStartTime;
            this._waterfallTimelineRuler.endTime = collection.waterfallEndTime;

            // Add a little bit of padding on the each side.
            const paddingPixels = 5;
            let padSeconds = paddingPixels * this._waterfallTimelineRuler.secondsPerPixel;
            this._waterfallTimelineRuler.zeroTime = collection.waterfallStartTime - padSeconds;
            this._waterfallTimelineRuler.startTime = collection.waterfallStartTime - padSeconds;
            this._waterfallTimelineRuler.endTime = collection.waterfallEndTime + padSeconds;
        }
    }

    _canExportHAR()
    {
        if (!WI.FileUtilities.canSave(WI.FileUtilities.SaveMode.SingleFile))
            return false;

        if (!this._isShowingMainCollection())
            return false;

        let mainFrame = WI.networkManager.mainFrame;
        if (!mainFrame)
            return false;

        let mainResource = mainFrame.mainResource;
        if (!mainResource)
            return false;

        if (!mainResource.requestSentDate)
            return false;

        if (!this._HARResources().length)
            return false;

        return true;
    }

    _updateExportButton()
    {
        this._harExportNavigationItem.enabled = this._canExportHAR();
    }

    _processPendingEntries()
    {
        let collection = this._activeCollection;
        let needsSort = collection.pendingUpdates.length > 0;

        // No global sort is needed, so just insert new records into their sorted position.
        if (!needsSort) {
            let originalLength = collection.pendingInsertions.length;
            for (let resource of collection.pendingInsertions)
                this._insertResourceAndReloadTable(resource);
            console.assert(collection.pendingInsertions.length === originalLength);
            collection.pendingInsertions = [];
            this._updateStatistics();
            return;
        }

        for (let resource of collection.pendingInsertions) {
            let resourceEntry = this._entryForResource(resource);
            this._tryLinkResourceToDOMNode(resourceEntry);
            collection.entries.push(resourceEntry);
        }
        collection.pendingInsertions = [];

        for (let updateObject of collection.pendingUpdates) {
            if (updateObject instanceof WI.Resource)
                this._updateEntryForResource(updateObject);
        }
        collection.pendingUpdates = [];

        this._updateSort();
        this._updateFilteredEntries();
        this._reloadTable();
        this._updateStatistics();
    }

    _populateWithInitialResourcesIfNeeded(mainFrame, collection)
    {
        if (!this._needsInitialPopulate)
            return;

        this._needsInitialPopulate = false;

        let populateResourcesForFrame = (frame) => {
            if (frame.provisionalMainResource)
                collection.pendingInsertions.push(frame.provisionalMainResource);
            else if (frame.mainResource)
                collection.pendingInsertions.push(frame.mainResource);

            for (let resource of frame.resourceCollection)
                collection.pendingInsertions.push(resource);

            for (let childFrame of frame.childFrameCollection)
                populateResourcesForFrame(childFrame);
        };

        let populateResourcesForTarget = (target) => {
            if (target.mainResource instanceof WI.Resource)
                collection.pendingInsertions.push(target.mainResource);
            for (let resource of target.resourceCollection)
                collection.pendingInsertions.push(resource);
        };

        for (let target of WI.targets) {
            if (target === WI.pageTarget)
                populateResourcesForFrame(mainFrame);
            else
                populateResourcesForTarget(target);
        }

        this.needsLayout();
    }

    _checkURLFilterAgainstResource(resource)
    {
        if (this._urlFilterSearchRegex.test(resource.url)) {
            this._activeURLFilterResources.add(resource);
            return;
        }

        for (let redirect of resource.redirects) {
            if (this._urlFilterSearchRegex.test(redirect.url)) {
                this._activeURLFilterResources.add(resource);
                return;
            }
        }
    }

    _rowIndexForRepresentedObject(object)
    {
        return this._activeCollection.filteredEntries.findIndex((x) => {
            if (x.resource === object)
                return true;
            if (x.domNode === object)
                return true;
            return false;
        });
    }

    _updateEntryForResource(resource)
    {
        let collection = this._activeCollection;

        let index = collection.entries.findIndex((x) => x.resource === resource);
        if (index === -1)
            return;

        // Don't wipe out the previous entry, as it may be used by a node entry.
        function updateExistingEntry(existingEntry, newEntry) {
            for (let key in newEntry)
                existingEntry[key] = newEntry[key];
        }

        let entry = this._entryForResource(resource);
        updateExistingEntry(collection.entries[index], entry);

        let rowIndex = this._rowIndexForRepresentedObject(resource);
        if (rowIndex === -1)
            return;

        updateExistingEntry(collection.filteredEntries[rowIndex], entry);

        this._updateStatistics();
    }

    _highlightRelatedResourcesForHoveredResource()
    {
        let highlightInitiated = !isNaN(this._hoveredRowIndex) && WI.modifierKeys.shiftKey;
        this.element.classList.toggle("highlight-initiated", highlightInitiated);

        let needsRestyle = false;

        if (!highlightInitiated) {
            for (let entry of this._activeCollection.entries) {
                if (entry.rowClassNames.length)
                    needsRestyle = true;
                entry.rowClassNames = [];
            }
        } else {
            let hoveredEntry = this._activeCollection.filteredEntries[this._hoveredRowIndex];
            let hoveredResource = hoveredEntry?.resource;
            if (!hoveredResource)
                return;

            for (let entry of this._activeCollection.entries) {
                if (!hoveredResource.initiatedResources.includes(entry.resource))
                    continue;

                if (entry.rowClassNames.includes("initiated"))
                    continue;

                entry.rowClassNames.push("initiated");

                needsRestyle = true;
            }
        }

        if (!needsRestyle)
            return;

        for (let i = 0; i < this._activeCollection.filteredEntries.length; ++i)
            this._table.restyleRow(i);
    }

    _hidePopover()
    {
        if (this._waterfallPopover)
            this._waterfallPopover.dismiss();
    }

    _hideDetailView()
    {
        if (!this._detailView)
            return;

        this.element.classList.remove("showing-detail");
        this._table.scrollContainer.style.removeProperty("width");

        this.removeSubview(this._detailView);
        this._detailView = null;
        this._handleCurrentResourceDetailViewDidChange();

        this._table.updateLayout(WI.View.LayoutReason.Resize);
        this._table.reloadVisibleColumnCells(this._waterfallColumn);
    }

    _showDetailView(object)
    {
        let oldDetailView = this._detailView;

        this._detailView = this._detailViewMap.get(object);
        if (this._detailView === oldDetailView)
            return;

        if (!this._detailView) {
            if (object instanceof WI.Resource) {
                this._detailView = new WI.NetworkResourceDetailView(object, this);
                this._detailView.addEventListener(WI.ContentBrowser.Event.CurrentContentViewDidChange, this._handleCurrentResourceDetailViewDidChange, this);
            } else if (object instanceof WI.DOMNode) {
                this._detailView = new WI.NetworkDOMNodeDetailView(object, this);
            }

            this._detailViewMap.set(object, this._detailView);
        }

        if (oldDetailView)
            this.replaceSubview(oldDetailView, this._detailView);
        else
            this.addSubview(this._detailView);

        if (this._showingRepresentedObjectCookie)
            this._detailView.willShowWithCookie(this._showingRepresentedObjectCookie);

        this.element.classList.add("showing-detail");
        this._table.scrollContainer.style.width = this._nameColumn.width + "px";

        // FIXME: It would be nice to avoid this.
        // Currently the ResourceDetailView is in the heirarchy but has not yet done a layout so we
        // end up seeing the table behind it. This forces us to layout now instead of after a beat.
        this.updateLayout();

        if (!oldDetailView)
            this._handleCurrentResourceDetailViewDidChange();
    }

    _positionDetailView()
    {
        if (!this._detailView)
            return;

        let side = WI.resolvedLayoutDirection() === WI.LayoutDirection.RTL ? "right" : "left";
        this._detailView.element.style[side] = this._nameColumn.width + "px";
        this._table.scrollContainer.style.width = this._nameColumn.width + "px";
    }

    _updateEmptyFilterResultsMessage()
    {
        if (this._hasActiveFilter() && !this._activeCollection.filteredEntries.length)
            this._showEmptyFilterResultsMessage();
        else
            this._hideEmptyFilterResultsMessage();
    }

    _showEmptyFilterResultsMessage()
    {
        if (!this._emptyFilterResultsMessageElement) {
            let buttonElement = document.createElement("button");
            buttonElement.textContent = WI.UIString("Clear Filters");
            buttonElement.addEventListener("click", () => { this._resetFilters(); });

            this._emptyFilterResultsMessageElement = WI.createMessageTextView(WI.UIString("No Filter Results"));
            this._emptyFilterResultsMessageElement.appendChild(buttonElement);
        }

        this.element.appendChild(this._emptyFilterResultsMessageElement);
    }

    _hideEmptyFilterResultsMessage()
    {
        if (!this._emptyFilterResultsMessageElement)
            return;

        this._emptyFilterResultsMessageElement.remove();
    }

    _handleClearNetworkOnNavigateChanged(event)
    {
        this._updateOtherFiltersNavigationItemState();
    }

    _handleNetworkConditionSelectionChanged(event)
    {
        let selectedItems = this._networkConditionScopeBar.selectedItems;
        if (!selectedItems.length)
            return;

        WI.networkManager.emulatedCondition = selectedItems[0].__networkCondition;
    }

    _resourceCachingDisabledSettingChanged()
    {
        this._disableResourceCacheNavigationItem.checked = WI.settings.resourceCachingDisabled.value;
    }

    _toggleDisableResourceCache()
    {
        WI.settings.resourceCachingDisabled.value = !WI.settings.resourceCachingDisabled.value;
    }

    _mainResourceDidChange(event)
    {
        let frame = event.target;

        if (frame.isMainFrame() && !this._transitioningPageTarget)
            this._startUpdatingLoadTimeStatistic();

        this._runForMainCollection((collection, wasMain) => {
            if (frame.isMainFrame()) {
                if (WI.settings.clearNetworkOnNavigate.value) {
                    this._resetCollection(collection);

                    if (wasMain && !this._needsInitialPopulate)
                        this._hideDetailView();
                } else {
                    for (let entry of collection.entries)
                        entry.currentSession = false;

                    for (let resource of collection.pendingInsertions)
                        resource[WI.NetworkTableContentView._currentSessionSymbol] = false;
                }
            }

            if (this._transitioningPageTarget) {
                this._transitioningPageTarget = false;
                this._needsInitialPopulate = true;
                this._populateWithInitialResourcesIfNeeded(frame, collection);
            } else
                this._insertResourceAndReloadTable(frame.mainResource);

            if (wasMain)
                this._updateStatistics();
        });
    }

    _mainFrameDidChange()
    {
        this._runForMainCollection((collection) => {
            this._populateWithInitialResourcesIfNeeded(WI.networkManager.mainFrame, collection);
        });
    }

    _resourceLoadingDidFinish(event)
    {
        this._runForMainCollection((collection, wasMain) => {
            let resource = event.target;
            collection.pendingUpdates.push(resource);

            this._updateWaterfallTimeRange(resource.firstTimestamp, resource.timingData.responseEnd);

            if (this._hasURLFilter())
                this._checkURLFilterAgainstResource(resource);

            if (wasMain)
                this.needsLayout();
        });
    }

    _resourceLoadingDidFail(event)
    {
        this._runForMainCollection((collection, wasMain) => {
            let resource = event.target;
            collection.pendingUpdates.push(resource);

            this._updateWaterfallTimeRange(resource.firstTimestamp, resource.timingData.responseEnd);

            if (this._hasURLFilter())
                this._checkURLFilterAgainstResource(resource);

            if (wasMain)
                this.needsLayout();
        });
    }

    _handleResourceSizeDidChange(event)
    {
        if (!this._table)
            return;

        this._runForMainCollection((collection, wasMain) => {
            let resource = event.target;

            // In the unlikely event that this is the sort column, we may need to resort.
            if (this._table.sortColumnIdentifier === "resourceSize") {
                collection.pendingUpdates.push(resource);
                this.needsLayout();
                return;
            }

            let index = collection.entries.findIndex((x) => x.resource === resource);
            if (index === -1)
                return;

            let entry = collection.entries[index];
            entry.resourceSize = resource.size;

            if (!wasMain)
                return;

            let rowIndex = this._rowIndexForRepresentedObject(resource);
            if (rowIndex === -1)
                return;

            this._table.reloadCell(rowIndex, "resourceSize");

            this._updateStatistics();
        });
    }

    _resourceTransferSizeDidChange(event)
    {
        if (!this._table)
            return;

        this._runForMainCollection((collection, wasMain) => {
            let resource = event.target;

            // In the unlikely event that this is the sort column, we may need to resort.
            if (this._table.sortColumnIdentifier === "transferSize") {
                collection.pendingUpdates.push(resource);
                this.needsLayout();
                return;
            }

            let index = collection.entries.findIndex((x) => x.resource === resource);
            if (index === -1)
                return;

            let entry = collection.entries[index];
            entry.transferSize = !isNaN(resource.networkTotalTransferSize) ? resource.networkTotalTransferSize : resource.estimatedTotalTransferSize;

            if (!wasMain)
                return;

            let rowIndex = this._rowIndexForRepresentedObject(resource);
            if (rowIndex === -1)
                return;

            this._table.reloadCell(rowIndex, "transferSize");

            this._updateStatistics();
        });
    }

    _handleResourceAdded(event)
    {
        this._runForMainCollection((collection, wasMain) => {
            this._insertResourceAndReloadTable(event.data.resource);

            if (wasMain)
                this._updateStatistics();
        });
    }

    _handleFrameWasAdded(event)
    {
        if (this._needsInitialPopulate)
            return;

        this._runForMainCollection((collection, wasMain) => {
            let frame = event.data.childFrame;
            let mainResource = frame.provisionalMainResource || frame.mainResource;
            console.assert(mainResource, "Frame should have a main resource.");
            this._insertResourceAndReloadTable(mainResource);

            if (wasMain)
                this._updateStatistics();

            console.assert(!frame.resourceCollection.size, "New frame should be empty.");
            console.assert(!frame.childFrameCollection.size, "New frame should be empty.");
        });
    }

    _runForMainCollection(callback)
    {
        let currentCollection = this._activeCollection;
        let wasMain = currentCollection === this._mainCollection;

        if (!wasMain)
            this._setActiveCollection(this._mainCollection);

        callback(this._activeCollection, wasMain);

        if (!wasMain)
            this._setActiveCollection(currentCollection);
    }

    _isShowingMainCollection()
    {
        return this._activeCollection === this._mainCollection;
    }

    _isDefaultSort()
    {
        return this._table.sortColumnIdentifier === "waterfall" && this._table.sortOrder === WI.Table.SortOrder.Ascending;
    }

    _insertResourceAndReloadTable(resource)
    {
        if (this._needsInitialPopulate)
            return;

        let collection = this._activeCollection;

        this._updateWaterfallTimeRange(resource.firstTimestamp, resource.timingData.responseEnd);

        if (!this._table || !(WI.tabBrowser.selectedTabContentView instanceof WI.NetworkTabContentView)) {
            collection.pendingInsertions.push(resource);
            this.needsLayout();
            return;
        }

        let resourceEntry = this._entryForResource(resource);

        this._tryLinkResourceToDOMNode(resourceEntry);

        if (WI.settings.groupMediaRequestsByDOMNode.value && resource.initiatorNode) {
            if (!this._entriesSortComparator)
                this._generateSortComparator();
        } else if (this._isDefaultSort() || !this._entriesSortComparator) {
            // Default sort has fast path.
            collection.entries.push(resourceEntry);
            if (this._passFilter(resourceEntry)) {
                collection.filteredEntries.push(resourceEntry);
                this._table.reloadDataAddedToEndOnly();
            }
            return;
        }

        insertObjectIntoSortedArray(resourceEntry, collection.entries, this._entriesSortComparator);

        if (this._passFilter(resourceEntry)) {
            if (WI.settings.groupMediaRequestsByDOMNode.value)
                this._updateFilteredEntries();
            else
                insertObjectIntoSortedArray(resourceEntry, collection.filteredEntries, this._entriesSortComparator);

            // Probably a useless optimization here, but if we only added this row to the end
            // we may avoid recreating all visible rows by saying as such.
            if (collection.filteredEntries.lastValue === resourceEntry)
                this._table.reloadDataAddedToEndOnly();
            else
                this._reloadTable();
        }
    }

    _entryForResource(resource)
    {
        // FIXME: <https://webkit.org/b/143632> Web Inspector: Resources with the same name in different folders aren't distinguished
        // FIXME: <https://webkit.org/b/176765> Web Inspector: Resource names should be less ambiguous

        let rowClassNames = [];

        if (!isNaN(this._hoveredRowIndex) && WI.modifierKeys.shiftKey) {
            let hoveredEntry = this._activeCollection.filteredEntries[this._hoveredRowIndex];
            if (hoveredEntry?.resource?.initiatedResources.includes(resource))
                rowClassNames.push("initiated");
        }

        let subpath = resource.urlComponents.path;
        if (subpath && resource.urlComponents.lastPathComponent)
            subpath = subpath.substring(0, subpath.length - resource.urlComponents.lastPathComponent.length);

        return {
            resource,
            name: WI.displayNameForURL(resource.url, resource.urlComponents),
            domain: WI.displayNameForHost(resource.urlComponents.host),
            path: subpath || "",
            scheme: resource.urlComponents.scheme ? resource.urlComponents.scheme.toLowerCase() : "",
            method: resource.requestMethod,
            type: resource.type,
            displayType: WI.NetworkTableContentView.displayNameForResource(resource),
            mimeType: resource.mimeType,
            status: resource.statusCode,
            cached: resource.cached,
            resourceSize: resource.size,
            transferSize: !isNaN(resource.networkTotalTransferSize) ? resource.networkTotalTransferSize : resource.estimatedTotalTransferSize,
            time: resource.totalDuration,
            protocol: resource.protocol,
            initiator: resource.initiatorSourceCodeLocation ? resource.initiatorSourceCodeLocation.displayLocationString() : "",
            priority: resource.priority,
            remoteAddress: resource.displayRemoteAddress,
            connectionIdentifier: resource.connectionIdentifier,
            startTime: resource.firstTimestamp,
            currentSession: resource[WI.NetworkTableContentView._currentSessionSymbol] ?? true,
            rowClassNames,
        };
    }

    _entryForDOMNode(domNode)
    {
        return {
            domNode,
            initiatedResourceEntries: [],
            domEventElements: new Map,
            expanded: true,
            rowClassNames: [],
        };
    }

    _tryLinkResourceToDOMNode(resourceEntry)
    {
        let resource = resourceEntry.resource;
        if (!resource || !resource.initiatorNode)
            return;

        let nodeEntry = this._domNodeEntries.get(resource.initiatorNode);
        if (!nodeEntry) {
            nodeEntry = this._entryForDOMNode(resource.initiatorNode, Object.keys(resourceEntry));
            this._domNodeEntries.set(resource.initiatorNode, nodeEntry);

            resource.initiatorNode.addEventListener(WI.DOMNode.Event.DidFireEvent, this._handleNodeDidFireEvent, this);
            if (resource.initiatorNode.canEnterPowerEfficientPlaybackState())
                resource.initiatorNode.addEventListener(WI.DOMNode.Event.PowerEfficientPlaybackStateChanged, this._handleDOMNodePowerEfficientPlaybackStateChanged, this);
        }

        if (!this._entriesSortComparator)
            this._generateSortComparator();

        insertObjectIntoSortedArray(resourceEntry, nodeEntry.initiatedResourceEntries, this._entriesSortComparator);
    }

    _uniqueValuesForDOMNodeEntry(nodeEntry, accessor)
    {
        let resourceEntries = nodeEntry.initiatedResourceEntries;
        if (!resourceEntries)
            return null;

        return resourceEntries.reduce((accumulator, current) => {
            let value = accessor(current);
            if (value || typeof value === "number")
                accumulator.add(value);
            return accumulator;
        }, new Set);
    }

    _handleNodeDidFireEvent(event)
    {
        this._runForMainCollection((collection, wasMain) => {
            let domNode = event.target;
            let {domEvent} = event.data;

            collection.pendingUpdates.push(domNode);

            this._updateWaterfallTimeRange(NaN, domEvent.timestamp + (this._waterfallTimelineRuler.secondsPerPixel * 10));

            if (wasMain)
                this.needsLayout();
        });
    }

    _handleDOMNodePowerEfficientPlaybackStateChanged(event)
    {
        this._runForMainCollection((collection, wasMain) => {
            let domNode = event.target;
            let {timestamp} = event.data;

            collection.pendingUpdates.push(domNode);

            this._updateWaterfallTimeRange(NaN, timestamp + (this._waterfallTimelineRuler.secondsPerPixel * 10));

            if (wasMain)
                this.needsLayout();
        });
    }

    _hasTypeFilter()
    {
        return !!this._activeTypeFilters;
    }

    _hasURLFilter()
    {
        return this._urlFilterIsActive;
    }

    _hasActiveFilter()
    {
        return this._hasTypeFilter()
            || this._hasURLFilter();
    }

    _passTypeFilter(entry)
    {
        if (!this._hasTypeFilter())
            return true;
        return this._activeTypeFilters.some((checker) => checker(entry.resource.type));
    }

    _passURLFilter(entry)
    {
        if (!this._hasURLFilter())
            return true;
        return this._activeURLFilterResources.has(entry.resource);
    }

    _passFilter(entry)
    {
        return this._passTypeFilter(entry)
            && this._passURLFilter(entry);
    }

    _updateSort()
    {
        if (this._entriesSortComparator) {
            let collection = this._activeCollection;
            collection.entries = collection.entries.sort(this._entriesSortComparator);
        }
    }

    _updateFilteredEntries()
    {
        let collection = this._activeCollection;

        if (this._hasActiveFilter())
            collection.filteredEntries = collection.entries.filter(this._passFilter, this);
        else
            collection.filteredEntries = collection.entries.slice();

        if (WI.settings.groupMediaRequestsByDOMNode.value) {
            for (let nodeEntry of this._domNodeEntries.values()) {
                if (nodeEntry.initiatedResourceEntries.length < 2 && !nodeEntry.domNode.domEvents.length)
                    continue;

                let firstIndex = Infinity;
                for (let resourceEntry of nodeEntry.initiatedResourceEntries) {
                    if (this._hasActiveFilter() && !this._passFilter(resourceEntry))
                        continue;

                    let index = collection.filteredEntries.indexOf(resourceEntry);
                    if (index >= 0 && index < firstIndex)
                        firstIndex = index;
                }

                if (!isFinite(firstIndex))
                    continue;

                collection.filteredEntries.insertAtIndex(nodeEntry, firstIndex);
            }

            collection.filteredEntries = collection.filteredEntries.filter((entry) => {
                if (entry.resource && entry.resource.initiatorNode) {
                    let nodeEntry = this._domNodeEntries.get(entry.resource.initiatorNode);
                    if (!nodeEntry.expanded)
                        return false;
                }
                return true;
            });
        }

        this._updateStatistics();

        this._updateEmptyFilterResultsMessage();
    }

    _updateStatistics()
    {
        if (!this.didInitialLayout)
            return;

        let entries = this._activeCollection.filteredEntries.filter((entry) => entry.currentSession);

        let domains = new Set;
        let resourceSize = 0;
        let transferSize = 0;
        let redirectCount = 0;
        for (let entry of entries) {
            domains.add(entry.domain);
            if (!isNaN(entry.resourceSize))
                resourceSize += entry.resourceSize;
            if (!isNaN(entry.transferSize))
                transferSize += entry.transferSize;
            if (entry.resource)
                redirectCount += entry.resource.redirects.length;
        }

        this._updateStatistic("domain-count", domains.size === 1 ? WI.UIString("%d domain") : WI.UIString("%d domains"), domains.size);

        let resourceCount = entries.length;
        this._updateStatistic("resource-count", resourceCount === 1 ? WI.UIString("%d resource") : WI.UIString("%d resources"), resourceCount);

        const higherResolution = false;
        this._updateStatistic("resource-size", WI.UIString("%s total"), Number.bytesToString(resourceSize, higherResolution));
        this._updateStatistic("transfer-size", WI.UIString("%s transferred"), Number.bytesToString(transferSize, higherResolution));

        this._updateStatistic("redirect-count", redirectCount === 1 ? WI.UIString("%d redirect") : WI.UIString("%d redirects"), redirectCount);

        let loadTimeStatistic = this._statistics["load-time"];
        if (loadTimeStatistic.format && this._isShowingMainCollection() && !this._hasActiveFilter()) {
            this._updateStatistic("load-time");
            loadTimeStatistic.container.hidden = false;
        } else
            loadTimeStatistic.container.hidden = true;
    }

    _updateStatistic(name, format, value)
    {
        let statistic = this._statistics[name];

        if (format)
            statistic.format = format;
        else
            format = statistic.format;

        if (value || value === 0)
            statistic.value = value;
        else
            value = statistic.value;

        if (statistic.container)
            statistic.container.title = format.format(value);

        if (statistic.element)
            statistic.element.textContent = value;
    }

    _startUpdatingLoadTimeStatistic()
    {
        this._stopUpdatingLoadTimeStatistic();

        let loadTimeStatistic = this._statistics["load-time"];
        if (!loadTimeStatistic)
            loadTimeStatistic = this._statistics["load-time"] = {};

        loadTimeStatistic.start = Date.now();
        loadTimeStatistic.delay = 50;
        loadTimeStatistic.timer = setInterval(this._updateLoadTimeStatistic.bind(this), loadTimeStatistic.delay);
    }

    _stopUpdatingLoadTimeStatistic()
    {
        let loadTimeStatistic = this._statistics["load-time"];
        if (!loadTimeStatistic)
            return;

        if (loadTimeStatistic.timer) {
            clearInterval(loadTimeStatistic.timer);
            loadTimeStatistic.timer = undefined;
        }
    }

    _updateLoadTimeStatistic()
    {
        let loadTimeStatistic = this._statistics["load-time"];
        console.assert(loadTimeStatistic);

        let duration = Date.now() - loadTimeStatistic.start;

        let delay = loadTimeStatistic.delay;
        if (duration >= 1_000) // 1 second
            delay = 100;
        else if (duration >= 60_000) // 60 seconds
            delay = 1_000;
        else if (duration >= 3_600_000) // 1 minute
            delay = 10_000;

        if (delay !== loadTimeStatistic.delay) {
            loadTimeStatistic.delay = delay;

            clearInterval(loadTimeStatistic.timer);
            loadTimeStatistic.timer = setInterval(this._updateLoadTimeStatistic.bind(this), loadTimeStatistic.delay);
        }

        let mainFrame = WI.networkManager.mainFrame;
        let mainFrameStartTime = mainFrame.mainResource.firstTimestamp;
        let mainFrameLoadEventTime = mainFrame.loadEventTimestamp;

        if (loadTimeStatistic.container)
            loadTimeStatistic.container.hidden = !this._isShowingMainCollection() || this._hasActiveFilter();

        if (isNaN(mainFrameStartTime) || isNaN(mainFrameLoadEventTime)) {
            this._updateStatistic("load-time", WI.UIString("Loading for %s"), Number.secondsToString(duration / 1_000));
            return;
        }

        this._updateStatistic("load-time", WI.UIString("Loaded in %s"), Number.secondsToString(mainFrameLoadEventTime - mainFrameStartTime));

        this._stopUpdatingLoadTimeStatistic();
    }

    _reloadTable()
    {
        this._table.reloadData();
        this._restoreSelectedRow();
    }

    _generateTypeFilter()
    {
        let selectedItems = this._typeFilterScopeBar.selectedItems;
        if (!selectedItems.length || selectedItems.includes(this._typeFilterScopeBarItemAll))
            return null;

        return selectedItems.map((item) => item.__checker);
    }

    _resetFilters()
    {
        console.assert(this._hasActiveFilter());

        // Clear url filter.
        this._urlFilterSearchText = null;
        this._urlFilterSearchRegex = null;
        this._urlFilterIsActive = false;
        this._activeURLFilterResources.clear();
        this._urlFilterNavigationItem.filterBar.clear();
        console.assert(!this._hasURLFilter());

        // Clear type filter.
        this._typeFilterScopeBar.resetToDefault();
        console.assert(!this._hasTypeFilter());

        console.assert(!this._hasActiveFilter());

        this._updateFilteredEntries();
        this._reloadTable();
    }

    _areFilterListsIdentical(listA, listB)
    {
        if (listA && listB) {
            if (listA.length !== listB.length)
                return false;

            for (let i = 0; i < listA.length; ++i) {
                if (listA[i] !== listB[i])
                    return false;
            }

            return true;
        }

        return false;
    }

    _updateOtherFiltersNavigationItemState()
    {
        let active = false;
        if (!WI.settings.clearNetworkOnNavigate.value)
            active = true;
        else if (WI.MediaInstrument.supported() && WI.settings.groupMediaRequestsByDOMNode.value)
            active = true;
        this._otherFiltersNavigationItem.element.classList.toggle("active", active);
    }

    _typeFilterScopeBarSelectionChanged(event)
    {
        // FIXME: <https://webkit.org/b/176763> Web Inspector: ScopeBar SelectionChanged event may dispatch multiple times for a single logical change
        // We can't use shallow equals here because the contents are functions.
        let oldFilter = this._activeTypeFilters;
        let newFilter = this._generateTypeFilter();
        if (this._areFilterListsIdentical(oldFilter, newFilter))
            return;

        // Even if the selected resource would still be visible, lets close the detail view if a filter changes.
        this._hideDetailView();

        this._activeTypeFilters = newFilter;
        this._updateFilteredEntries();
        this._reloadTable();
    }

    _handleOtherFiltersNavigationItemContextMenu(contextMenu)
    {
        contextMenu.appendCheckboxItem(WI.UIString("Preserve Log"), () => {
            WI.settings.clearNetworkOnNavigate.value = !WI.settings.clearNetworkOnNavigate.value;
        }, !WI.settings.clearNetworkOnNavigate.value);

        if (WI.MediaInstrument.supported()) {
            contextMenu.appendSeparator();

            contextMenu.appendCheckboxItem(WI.UIString("Group Media Requests"), () => {
                WI.settings.groupMediaRequestsByDOMNode.value = !WI.settings.groupMediaRequestsByDOMNode.value;
            }, !!WI.settings.groupMediaRequestsByDOMNode.value);
        }
    }

    _handleGroupMediaRequestsByDOMNodeChanged(event)
    {
        if (!WI.settings.groupMediaRequestsByDOMNode.value) {
            this._table.element.classList.remove("grouped");

            if (this._selectedObject && this._selectedObject instanceof WI.DOMNode) {
                this._selectedObject = null;
                this._hideDetailView();
            }
        }

        this._updateOtherFiltersNavigationItemState();
        this._updateSort();
        this._updateFilteredEntries();
        this._reloadTable();
    }

    _urlFilterDidChange(event)
    {
        let filterBar = this._urlFilterNavigationItem.filterBar;
        let searchQuery = filterBar.filters.text;
        if (searchQuery === this._urlFilterSearchText)
            return;

        // Even if the selected resource would still be visible, lets close the detail view if a filter changes.
        this._hideDetailView();

        this._urlFilterSearchRegex = searchQuery ? WI.SearchUtilities.filterRegExpForString(searchQuery, WI.SearchUtilities.defaultSettings) : null;
        filterBar.invalid = searchQuery && !this._urlFilterSearchRegex

        // Search cleared.
        if (!this._urlFilterSearchRegex) {
            this._urlFilterSearchText = null;
            this._urlFilterSearchRegex = null;
            this._urlFilterIsActive = false;
            this._activeURLFilterResources.clear();

            this._updateFilteredEntries();
            this._reloadTable();
            return;
        }

        this._urlFilterIsActive = true;
        this._urlFilterSearchText = searchQuery;

        this._updateActiveFilterResources();
        this._updateFilteredEntries();
        this._reloadTable();
    }

    _updateActiveFilterResources()
    {
        this._activeURLFilterResources.clear();

        if (this._hasURLFilter()) {
            for (let entry of this._activeCollection.entries)
                this._checkURLFilterAgainstResource(entry.resource);
        }
    }

    _restoreSelectedRow()
    {
        if (!this._selectedObject)
            return;

        let rowIndex = this._rowIndexForRepresentedObject(this._selectedObject);
        if (rowIndex === -1) {
            this._selectedObject = null;
            this._table.deselectAll();
            return;
        }

        this._table.selectRow(rowIndex);
        this._showDetailView(this._selectedObject);
    }

    _HARResources()
    {
        let resources = this._activeCollection.filteredEntries.map((x) => x.resource);
        const supportedHARSchemes = new Set(["http", "https", "ws", "wss"]);
        return resources.filter((resource) => {
            if (!resource) {
                // DOM node entries are also added to `filteredEntries`.
                return false;
            }

            if (!resource.finished)
                return false;
            if (!resource.requestSentDate)
                return false;
            if (!supportedHARSchemes.has(resource.urlComponents.scheme))
                return false;
            return true;
        });
    }

    _exportHAR()
    {
        let resources = this._HARResources();
        if (!resources.length) {
            InspectorFrontendHost.beep();
            return;
        }

        WI.HARBuilder.buildArchive(resources).then((har) => {
            let mainFrame = WI.networkManager.mainFrame;
            let archiveName = mainFrame.mainResource.urlComponents.host || mainFrame.mainResource.displayName || "Archive";

            const forceSaveAs = true;
            WI.FileUtilities.save(WI.FileUtilities.SaveMode.SingleFile, {
                content: JSON.stringify(har, null, 2),
                suggestedName: archiveName + ".har",
            }, forceSaveAs);
        });
    }

    _importHAR()
    {
        WI.FileUtilities.importJSON((result) => this.processHAR(result), {multiple: true});
    }

    _waterfallPopoverContent()
    {
        let contentElement = document.createElement("div");
        contentElement.classList.add("waterfall-popover-content");
        return contentElement;
    }

    _waterfallPopoverContentForResourceEntry(resourceEntry)
    {
        let contentElement = this._waterfallPopoverContent();

        let resource = resourceEntry.resource;
        if (!resource.hasResponse() || !resource.firstTimestamp || !resource.lastTimestamp) {
            contentElement.textContent = WI.UIString("Resource has no timing data");
            return contentElement;
        }

        let breakdownView = new WI.ResourceTimingBreakdownView(resource, 300);
        contentElement.appendChild(breakdownView.element);
        breakdownView.updateLayout();

        return contentElement;
    }

    _waterfallPopoverContentForNodeEntry(nodeEntry, domEvents)
    {
        let contentElement = this._waterfallPopoverContent();

        let breakdownView = new WI.DOMEventsBreakdownView(domEvents);
        contentElement.appendChild(breakdownView.element);
        breakdownView.updateLayout();

        return contentElement;
    }

    _handleResourceEntryMousedownWaterfall(resourceEntry)
    {
        let popoverContentElement = this._waterfallPopoverContentForResourceEntry(resourceEntry);
        this._handleMousedownWaterfall(resourceEntry, popoverContentElement, (cell) => {
            return cell.querySelector(".block.mouse-tracking");
        });
    }

    _handleNodeEntryMousedownWaterfall(nodeEntry, domEvents)
    {
        let popoverContentElement = this._waterfallPopoverContentForNodeEntry(nodeEntry, domEvents);
        this._handleMousedownWaterfall(nodeEntry, popoverContentElement, (cell) => {
            let domEventElement = nodeEntry.domEventElements.get(domEvents[0]);

            // Show any additional DOM events that have been merged into the range.
            if (domEventElement && this._waterfallPopover.visible) {
                let newDOMEvents = Array.from(nodeEntry.domEventElements)
                .filter(([domEvent, element]) => element === domEventElement)
                .map(([domEvent, element]) => domEvent);

                this._waterfallPopover.content = this._waterfallPopoverContentForNodeEntry(nodeEntry, newDOMEvents);
            }

            return domEventElement;
        });
    }

    _handleMousedownWaterfall(entry, popoverContentElement, updateTargetAndContentFunction)
    {
        if (!this._waterfallPopover) {
            this._waterfallPopover = new WI.Popover;
            this._waterfallPopover.element.classList.add("waterfall-popover");
        }

        if (this._waterfallPopover.visible)
            return;

        let calculateTargetFrame = () => {
            let rowIndex = this._rowIndexForRepresentedObject(entry.resource || entry.domNode);
            let cell = this._table.cellForRowAndColumn(rowIndex, this._waterfallColumn);
            if (cell) {
                let targetElement = updateTargetAndContentFunction(cell);
                if (targetElement)
                    return WI.Rect.rectFromClientRect(targetElement.getBoundingClientRect());
            }

            this._waterfallPopover.dismiss();
            return null;
        };

        let targetFrame = calculateTargetFrame();
        if (!targetFrame)
            return;
        if (!targetFrame.size.width && !targetFrame.size.height)
            return;

        let isRTL = WI.resolvedLayoutDirection() === WI.LayoutDirection.RTL;
        let preferredEdges = isRTL ? [WI.RectEdge.MAX_Y, WI.RectEdge.MIN_Y, WI.RectEdge.MAX_X] : [WI.RectEdge.MAX_Y, WI.RectEdge.MIN_Y, WI.RectEdge.MIN_X];
        this._waterfallPopover.windowResizeHandler = () => {
            let bounds = calculateTargetFrame();
            if (bounds)
                this._waterfallPopover.present(bounds, preferredEdges);
        };

        this._waterfallPopover.presentNewContentWithFrame(popoverContentElement, targetFrame, preferredEdges);
    }

    _tableNameColumnDidChangeWidth(event)
    {
        this._nameColumnWidthSetting.value = event.target.width;

        this._positionDetailView();
    }

    _tableWaterfallColumnDidChangeWidth(event)
    {
        this._table.reloadVisibleColumnCells(this._waterfallColumn);
    }

    _transitionPageTarget(event)
    {
        this._transitioningPageTarget = true;
    }

    _handleGlobalModifierKeysDidChange(event)
    {
        this._highlightRelatedResourcesForHoveredResource();
    }

    _handleCurrentResourceDetailViewDidChange(event)
    {
        let oldReferencePageLinkElement = this._referencePageLinkElement;

        let referencePage = this._detailView?.referencePage ?? WI.ReferencePage.NetworkTab;
        this._referencePageLinkElement = referencePage.createLinkElement();

        oldReferencePageLinkElement.parentNode.replaceChild(this._referencePageLinkElement, oldReferencePageLinkElement);
    }
};

WI.NetworkTableContentView._currentSessionSymbol = Symbol("current-session");
