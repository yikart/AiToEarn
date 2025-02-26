/*
 * Copyright (C) 2013-2018 Apple Inc. All rights reserved.
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

WI.TimelineDataGrid = class TimelineDataGrid extends WI.DataGrid
{
    constructor(columns)
    {
        super(columns);

        this.element.classList.add("timeline");

        this._sortDelegate = null;
        this._scopeBarColumns = [];

        // Check if any of the cells can be filtered.
        for (var [identifier, column] of this.columns) {
            var scopeBar = column.scopeBar;

            if (!scopeBar)
                continue;

            this._scopeBarColumns.push(identifier);
            scopeBar.columnIdentifier = identifier;
            scopeBar.addEventListener(WI.ScopeBar.Event.SelectionChanged, this._scopeBarSelectedItemsDidChange, this);
        }

        if (this._scopeBarColumns.length > 1) {
            console.error("Creating a TimelineDataGrid with more than one filterable column is not yet supported.");
            return;
        }

        this.addEventListener(WI.DataGrid.Event.SelectedNodeChanged, this._dataGridSelectedNodeChanged, this);
        this.addEventListener(WI.DataGrid.Event.SortChanged, this._sort, this);

        this.columnChooserEnabled = true;
    }

    static createColumnScopeBar(prefix, map)
    {
        prefix = prefix + "-timeline-data-grid-";

        var scopeBarItems = [];
        for (var [key, value] of map) {
            var id = prefix + key;
            var item = new WI.ScopeBarItem(id, value);
            item.value = key;
            scopeBarItems.push(item);
        }

        var allItem = new WI.ScopeBarItem(prefix + "type-all", WI.UIString("All"));
        scopeBarItems.unshift(allItem);

        return new WI.ScopeBar(prefix + "scope-bar", scopeBarItems, allItem, true);
    }

    // Public

    get sortDelegate()
    {
        return this._sortDelegate;
    }

    set sortDelegate(delegate)
    {
        delegate = delegate || null;
        if (this._sortDelegate === delegate)
            return;

        this._sortDelegate = delegate;

        if (this.sortOrder !== WI.DataGrid.SortOrder.Indeterminate)
            this.dispatchEventToListeners(WI.DataGrid.Event.SortChanged);
    }

    reset()
    {
        // May be overridden by subclasses. If so, they should call the superclass.

        this.removeChildren();

        this._hidePopover();
    }

    detached()
    {
        this._hidePopover();

        super.detached();
    }

    callFramePopoverAnchorElement()
    {
        // Implemented by subclasses.
        return null;
    }

    shouldShowCallFramePopover()
    {
        // Implemented by subclasses.
        return false;
    }

    addRowInSortOrder(dataGridNode, parentDataGridNode)
    {
        parentDataGridNode = parentDataGridNode || this;

        if (this.sortColumnIdentifier) {
            let insertionIndex = insertionIndexForObjectInListSortedByFunction(dataGridNode, parentDataGridNode.children, this._sortComparator.bind(this));
            parentDataGridNode.insertChild(dataGridNode, insertionIndex);
        } else
            parentDataGridNode.appendChild(dataGridNode);
    }

    shouldIgnoreSelectionEvent()
    {
        return this._ignoreSelectionEvent || false;
    }

    // Protected

    dataGridNodeNeedsRefresh(dataGridNode)
    {
        if (!this._dirtyDataGridNodes)
            this._dirtyDataGridNodes = new Set;
        this._dirtyDataGridNodes.add(dataGridNode);

        if (this._scheduledDataGridNodeRefreshIdentifier)
            return;

        this._scheduledDataGridNodeRefreshIdentifier = requestAnimationFrame(this._refreshDirtyDataGridNodes.bind(this));
    }

    hasCustomFilters()
    {
        return true;
    }

    matchNodeAgainstCustomFilters(node)
    {
        if (!super.matchNodeAgainstCustomFilters(node))
            return false;

        for (let identifier of this._scopeBarColumns) {
            let scopeBar = this.columns.get(identifier).scopeBar;
            if (!scopeBar || scopeBar.defaultItem.selected)
                continue;

            let value = node.data[identifier];
            if (!scopeBar.selectedItems.some((scopeBarItem) => scopeBarItem.value === value))
                return false;
        }

        return true;
    }

    // Private

    _refreshDirtyDataGridNodes()
    {
        if (this._scheduledDataGridNodeRefreshIdentifier) {
            cancelAnimationFrame(this._scheduledDataGridNodeRefreshIdentifier);
            this._scheduledDataGridNodeRefreshIdentifier = undefined;
        }

        if (!this._dirtyDataGridNodes)
            return;

        let selectedNode = this.selectedNode;
        let sortComparator = this._sortComparator.bind(this);

        for (let dataGridNode of this._dirtyDataGridNodes) {
            dataGridNode.refresh();

            if (!this.sortColumnIdentifier)
                continue;

            if (dataGridNode === selectedNode)
                this._ignoreSelectionEvent = true;

            console.assert(!dataGridNode.parent || dataGridNode.parent === this);
            if (dataGridNode.parent === this)
                this.removeChild(dataGridNode);

            let insertionIndex = insertionIndexForObjectInListSortedByFunction(dataGridNode, this.children, sortComparator);
            this.insertChild(dataGridNode, insertionIndex);

            if (dataGridNode === selectedNode) {
                selectedNode.revealAndSelect();
                this._ignoreSelectionEvent = false;
            }
        }

        this._dirtyDataGridNodes = null;
    }

    _sort()
    {
        if (!this.children.length)
            return;

        let sortColumnIdentifier = this.sortColumnIdentifier;
        if (!sortColumnIdentifier)
            return;

        let selectedNode = this.selectedNode;
        this._ignoreSelectionEvent = true;

        // Collect parent nodes that need their children sorted. So this in two phases since
        // traverseNextNode would get confused if we sort the tree while traversing it.
        let parentDataGridNodes = [this];
        let currentDataGridNode = this.children[0];
        while (currentDataGridNode) {
            if (currentDataGridNode.children.length)
                parentDataGridNodes.push(currentDataGridNode);
            currentDataGridNode = currentDataGridNode.traverseNextNode(false, null, true);
        }

        // Sort the children of collected parent nodes.
        for (let parentDataGridNode of parentDataGridNodes) {
            let childDataGridNodes = parentDataGridNode.children.slice();
            parentDataGridNode.removeChildren();
            childDataGridNodes.sort(this._sortComparator.bind(this));

            for (let dataGridNode of childDataGridNodes)
                parentDataGridNode.appendChild(dataGridNode);
        }

        if (selectedNode)
            selectedNode.revealAndSelect();

        this._ignoreSelectionEvent = false;
    }

    _sortComparator(node1, node2)
    {
        var sortColumnIdentifier = this.sortColumnIdentifier;
        if (!sortColumnIdentifier)
            return 0;

        var sortDirection = this.sortOrder === WI.DataGrid.SortOrder.Ascending ? 1 : -1;

        if (this._sortDelegate && typeof this._sortDelegate.dataGridSortComparator === "function") {
            let result = this._sortDelegate.dataGridSortComparator(sortColumnIdentifier, sortDirection, node1, node2);
            if (typeof result === "number")
                return result;
        }

        var value1 = node1.data[sortColumnIdentifier];
        var value2 = node2.data[sortColumnIdentifier];

        if (typeof value1 === "number" && typeof value2 === "number") {
            if (isNaN(value1) && isNaN(value2))
                return 0;
            if (isNaN(value1))
                return -sortDirection;
            if (isNaN(value2))
                return sortDirection;
            return (value1 - value2) * sortDirection;
        }

        if (typeof value1 === "string" && typeof value2 === "string")
            return value1.extendedLocaleCompare(value2) * sortDirection;

        if (value1 instanceof WI.CallFrame || value2 instanceof WI.CallFrame) {
            // Sort by function name if available, then fall back to the source code object.
            value1 = value1 && value1.functionName ? value1.functionName : (value1 && value1.sourceCodeLocation ? value1.sourceCodeLocation.sourceCode : "");
            value2 = value2 && value2.functionName ? value2.functionName : (value2 && value2.sourceCodeLocation ? value2.sourceCodeLocation.sourceCode : "");
        }

        if (value1 instanceof WI.SourceCode || value2 instanceof WI.SourceCode) {
            value1 = value1 ? value1.displayName || "" : "";
            value2 = value2 ? value2.displayName || "" : "";
        }

        if (value1 instanceof WI.SourceCodeLocation || value2 instanceof WI.SourceCodeLocation) {
            value1 = value1 ? value1.displayLocationString() || "" : "";
            value2 = value2 ? value2.displayLocationString() || "" : "";
        }

        // For everything else (mostly booleans).
        return (value1 < value2 ? -1 : (value1 > value2 ? 1 : 0)) * sortDirection;
    }

    _scopeBarSelectedItemsDidChange(event)
    {
        this.filterDidChange();
    }

    _dataGridSelectedNodeChanged(event)
    {
        if (!this.selectedNode) {
            this._hidePopover();
            return;
        }

        var record = this.selectedNode.record;
        if (!record || !record.stackTrace?.callFrames.length) {
            this._hidePopover();
            return;
        }

        if (this.shouldShowCallFramePopover())
            this._showPopoverForSelectedNodeSoon();
    }

    _showPopoverForSelectedNodeSoon()
    {
        if (this._showPopoverTimeout)
            return;

        this._showPopoverTimeout = setTimeout(() => {
            if (!this._popover) {
                this._popover = new WI.Popover;
                this._popover.windowResizeHandler = () => { this._updatePopoverForSelectedNode(false); };
            }
            this._updatePopoverForSelectedNode(true);
            this._showPopoverTimeout = undefined;
        }, WI.TimelineDataGrid.DelayedPopoverShowTimeout);
    }

    _hidePopover()
    {
        if (this._showPopoverTimeout) {
            clearTimeout(this._showPopoverTimeout);
            this._showPopoverTimeout = undefined;
        }

        if (this._popover)
            this._popover.dismiss();

        if (this._hidePopoverContentClearTimeout)
            clearTimeout(this._hidePopoverContentClearTimeout);

        this._hidePopoverContentClearTimeout = setTimeout(() => {
            if (this._popoverCallStackTreeOutline)
                this._popoverCallStackTreeOutline.removeChildren();
        }, WI.TimelineDataGrid.DelayedPopoverHideContentClearTimeout);
    }

    _updatePopoverForSelectedNode(updateContent)
    {
        if (!this._popover || !this.selectedNode)
            return;

        let targetPopoverElement = this.callFramePopoverAnchorElement();
        console.assert(targetPopoverElement, "TimelineDataGrid subclass should always return a valid element from callFramePopoverAnchorElement.");
        if (!targetPopoverElement)
            return;

        // The element might be hidden if it does not have a width and height.
        let rect = WI.Rect.rectFromClientRect(targetPopoverElement.getBoundingClientRect());
        if (!rect.size.width && !rect.size.height)
            return;

        if (this._hidePopoverContentClearTimeout) {
            clearTimeout(this._hidePopoverContentClearTimeout);
            this._hidePopoverContentClearTimeout = undefined;
        }

        let targetFrame = rect.pad(2);
        let preferredEdges = [WI.RectEdge.MAX_Y, WI.RectEdge.MIN_Y, WI.RectEdge.MAX_X];

        if (updateContent)
            this._popover.presentNewContentWithFrame(this._createPopoverContent(), targetFrame, preferredEdges);
        else
            this._popover.present(targetFrame, preferredEdges);
    }

    _createPopoverContent()
    {
        if (!this._popoverCallStackTreeOutline) {
            this._popoverCallStackTreeOutline = new WI.TreeOutline;
            this._popoverCallStackTreeOutline.disclosureButtons = false;
            this._popoverCallStackTreeOutline.element.classList.add("timeline-data-grid");
            this._popoverCallStackTreeOutline.addEventListener(WI.TreeOutline.Event.SelectionDidChange, this._popoverCallStackTreeSelectionDidChange, this);
            this._popoverCallStackTreeOutline.addEventListener(WI.TreeOutline.Event.ElementRemoved, this._popoverCallStackTreeElementRemoved, this);
        } else
            this._popoverCallStackTreeOutline.removeChildren();

        if (this.selectedNode.record.stackTrace)
            WI.StackTraceTreeController.groupBlackboxedStackTrace(this._popoverCallStackTreeOutline, this.selectedNode.record.stackTrace);

        let content = document.createElement("div");
        content.appendChild(this._popoverCallStackTreeOutline.element);
        return content;
    }

    _popoverCallStackTreeSelectionDidChange(event)
    {
        let treeElement = this._popoverCallStackTreeOutline.selectedTreeElement;
        if (!treeElement)
            return;

        this._popover.dismiss();

        console.assert(treeElement instanceof WI.CallFrameTreeElement, "TreeElements in TimelineDataGrid popover should always be CallFrameTreeElements");
        var callFrame = treeElement.callFrame;
        if (!callFrame.sourceCodeLocation)
            return;

        WI.showSourceCodeLocation(callFrame.sourceCodeLocation, {
            ignoreNetworkTab: true,
            ignoreSearchTab: true,
        });
    }

    _popoverCallStackTreeElementRemoved(event)
    {
        if (event.data.element instanceof WI.BlackboxedGroupTreeElement)
            this._popover?.update();
    }
};

WI.TimelineDataGrid.HasNonDefaultFilterStyleClassName = "has-non-default-filter";
WI.TimelineDataGrid.DelayedPopoverShowTimeout = 250;
WI.TimelineDataGrid.DelayedPopoverHideContentClearTimeout = 500;
