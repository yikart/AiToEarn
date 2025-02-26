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

WI.HeapAllocationsTimelineView = class HeapAllocationsTimelineView extends WI.TimelineView
{
    constructor(timeline, extraArguments)
    {
        super(timeline, extraArguments);

        console.assert(timeline.type === WI.TimelineRecord.Type.HeapAllocations, timeline);

        this.element.classList.add("heap-allocations");

        let columns = {
            name: {
                title: WI.UIString("Name"),
                width: "150px",
                icon: true,
            },
            timestamp: {
                title: WI.UIString("Time"),
                width: "80px",
                sortable: true,
                aligned: "right",
            },
            size: {
                title: WI.UIString("Size"),
                width: "80px",
                sortable: true,
                aligned: "right",
            },
            liveSize: {
                title: WI.UIString("Live Size"),
                width: "80px",
                sortable: true,
                aligned: "right",
            },
        };

        this._importButtonNavigationItem = new WI.ButtonNavigationItem("import", WI.UIString("Import"), "Images/Import.svg", 15, 15);
        this._importButtonNavigationItem.tooltip = WI.UIString("Import");
        this._importButtonNavigationItem.buttonStyle = WI.ButtonNavigationItem.Style.ImageAndText;
        this._importButtonNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._importButtonNavigationItemClicked, this);

        let snapshotTooltip = WI.UIString("Take snapshot");
        this._takeHeapSnapshotButtonItem = new WI.ButtonNavigationItem("take-snapshot", snapshotTooltip, "Images/Camera.svg", 16, 16);
        this._takeHeapSnapshotButtonItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._takeHeapSnapshotClicked, this);

        let defaultToolTip = WI.UIString("Compare snapshots");
        let activatedToolTip = WI.UIString("Cancel comparison");
        this._compareHeapSnapshotsButtonItem = new WI.ActivateButtonNavigationItem("compare-heap-snapshots", defaultToolTip, activatedToolTip, "Images/Compare.svg", 16, 16);
        this._compareHeapSnapshotsButtonItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._compareHeapSnapshotsClicked, this);
        this._compareHeapSnapshotsButtonItem.enabled = false;
        this._compareHeapSnapshotsButtonItem.activated = false;

        this._compareHeapSnapshotHelpTextItem = new WI.TextNavigationItem("compare-heap-snapshot-help-text", "");

        this._selectingComparisonHeapSnapshots = false;
        this._baselineDataGridNode = null;
        this._baselineHeapSnapshotTimelineRecord = null;
        this._heapSnapshotDiff = null;

        this._snapshotListScrollTop = 0;
        this._showingSnapshotList = true;

        this._snapshotListPathComponent = new WI.HierarchicalPathComponent(WI.UIString("Snapshot List"), "snapshot-list-icon", "snapshot-list", false, false);
        this._snapshotListPathComponent.addEventListener(WI.HierarchicalPathComponent.Event.Clicked, this._snapshotListPathComponentClicked, this);

        this._unseenRecords = [];
        this._unseenRecordsBannerView = new WI.BannerView(WI.UIString("There are new snapshots that have been filtered", "There are new snapshots that have been filtered @ Heap Allocations Timeline View", "Message displayed in a banner when one or more snapshots that the user has not yet seen are being filtered."), {
            actionButtonMessage: WI.UIString("Clear Filters", "Clear Filters @ Heap Allocations Timeline View", "Text for button that will clear both text filters and time range filters."),
            showDismissButton: true,
        });
        this._unseenRecordsBannerView.addEventListener(WI.BannerView.Event.ActionButtonClicked, this._handleUnseenRecordsBannerClearFiltersClicked, this);
        this._unseenRecordsBannerView.addEventListener(WI.BannerView.Event.DismissButtonClicked, this._handleUnseenRecordsBannerDismissClicked, this);

        this._dataGrid = new WI.TimelineDataGrid(columns);
        this._dataGrid.sortColumnIdentifier = "timestamp";
        this._dataGrid.sortOrder = WI.DataGrid.SortOrder.Ascending;
        this._dataGrid.createSettings("heap-allocations-timeline-view");
        this._dataGrid.addEventListener(WI.DataGrid.Event.SelectedNodeChanged, this._dataGridNodeSelected, this);
        this.setupDataGrid(this._dataGrid);
        this.addSubview(this._dataGrid);

        this._contentViewContainer = new WI.ContentViewContainer;
        this._contentViewContainer.addEventListener(WI.ContentViewContainer.Event.CurrentContentViewDidChange, this._currentContentViewDidChange, this);
        WI.ContentView.addEventListener(WI.ContentView.Event.SelectionPathComponentsDidChange, this._contentViewSelectionPathComponentDidChange, this);

        this._pendingRecords = Array.from(timeline.records);

        timeline.addEventListener(WI.Timeline.Event.RecordAdded, this._heapAllocationsTimelineRecordAdded, this);

        WI.HeapSnapshotProxy.addEventListener(WI.HeapSnapshotProxy.Event.Invalidated, this._heapSnapshotInvalidated, this);
        WI.HeapSnapshotWorkerProxy.singleton().addEventListener(WI.HeapSnapshotWorkerProxy.Event.Collection, this._heapSnapshotCollectionEvent, this);
    }

    // Public

    get scrollableElements()
    {
        if (this._showingSnapshotList)
            return [this._dataGrid.scrollContainer];
        if (this._contentViewContainer.currentContentView)
            return this._contentViewContainer.currentContentView.scrollableElements;
        return [];
    }

    showHeapSnapshotList()
    {
        if (this._showingSnapshotList)
            return;

        this._showingSnapshotList = true;
        this._heapSnapshotDiff = null;
        this._cancelSelectComparisonHeapSnapshots();

        this.removeSubview(this._contentViewContainer);
        this.addSubview(this._dataGrid);

        this._dataGrid.scrollContainer.scrollTop = this._snapshotListScrollTop;

        this.dispatchEventToListeners(WI.ContentView.Event.SelectionPathComponentsDidChange);
        this.dispatchEventToListeners(WI.ContentView.Event.NavigationItemsDidChange);
    }

    showHeapSnapshotTimelineRecord(heapSnapshotTimelineRecord)
    {
        if (this._showingSnapshotList) {
            this._snapshotListScrollTop = this._dataGrid.scrollContainer.scrollTop;
            this.removeSubview(this._dataGrid);
            this.addSubview(this._contentViewContainer);
        }

        this._showingSnapshotList = false;
        this._heapSnapshotDiff = null;
        this._cancelSelectComparisonHeapSnapshots();

        for (let dataGridNode of this._dataGrid.children) {
            if (dataGridNode.record === heapSnapshotTimelineRecord) {
                dataGridNode.hidden = false;
                dataGridNode.select();
                break;
            }
        }

        let shouldTriggerContentViewUpdate = this._contentViewContainer.currentContentView && this._contentViewContainer.currentContentView.representedObject === heapSnapshotTimelineRecord.heapSnapshot;

        this._contentViewContainer.showContentViewForRepresentedObject(heapSnapshotTimelineRecord.heapSnapshot);

        if (shouldTriggerContentViewUpdate)
            this._currentContentViewDidChange();
    }

    showHeapSnapshotDiff(heapSnapshotDiff)
    {
        if (this._showingSnapshotList) {
            this.removeSubview(this._dataGrid);
            this.addSubview(this._contentViewContainer);
        }

        this._showingSnapshotList = false;
        this._heapSnapshotDiff = heapSnapshotDiff;

        this._contentViewContainer.showContentViewForRepresentedObject(heapSnapshotDiff);
    }

    // Protected

    get navigationItems()
    {
        if (this._showingSnapshotList) {
            let items = [this._importButtonNavigationItem, this._takeHeapSnapshotButtonItem, this._compareHeapSnapshotsButtonItem];
            if (this._selectingComparisonHeapSnapshots)
                items.push(this._compareHeapSnapshotHelpTextItem);
            return items;
        }

        if (this._contentViewContainer.currentContentView)
            return this._contentViewContainer.currentContentView.navigationItems;

        return [];
    }

    get selectionPathComponents()
    {
        let components = [this._snapshotListPathComponent];

        if (this._showingSnapshotList)
            return components;

        if (this._heapSnapshotDiff) {
            let firstSnapshotIdentifier = this._heapSnapshotDiff.snapshot1.identifier;
            let secondSnapshotIdentifier = this._heapSnapshotDiff.snapshot2.identifier;
            let diffComponent = new WI.HierarchicalPathComponent(WI.UIString("Snapshot Comparison (%d and %d)").format(firstSnapshotIdentifier, secondSnapshotIdentifier), "snapshot-diff-icon", "snapshot-diff");
            components.push(diffComponent);
        } else if (this._dataGrid.selectedNode) {
            let heapSnapshotPathComponent = new WI.HeapAllocationsTimelineDataGridNodePathComponent(this._dataGrid.selectedNode);
            heapSnapshotPathComponent.addEventListener(WI.HierarchicalPathComponent.Event.SiblingWasSelected, this._snapshotPathComponentSelected, this);
            components.push(heapSnapshotPathComponent);
        }

        if (this._contentViewContainer.currentContentView)
            components.pushAll(this._contentViewContainer.currentContentView.selectionPathComponents);

        return components;
    }

    selectRecord(record)
    {
        if (record)
            this.showHeapSnapshotTimelineRecord(record);
        else
            this.showHeapSnapshotList();
    }

    closed()
    {
        this.representedObject.removeEventListener(WI.Timeline.Event.RecordAdded, this._heapAllocationsTimelineRecordAdded, this);

        this._dataGrid.closed();

        this._contentViewContainer.closeAllContentViews();

        WI.ContentView.removeEventListener(WI.ContentView.Event.SelectionPathComponentsDidChange, this._contentViewSelectionPathComponentDidChange, this);
        WI.HeapSnapshotProxy.removeEventListener(WI.HeapSnapshotProxy.Event.Invalidated, this._heapSnapshotInvalidated, this);
        WI.HeapSnapshotWorkerProxy.singleton().removeEventListener(WI.HeapSnapshotWorkerProxy.Event.Collection, this._heapSnapshotCollectionEvent, this);
    }

    layout()
    {
        super.layout();

        if (!this._pendingRecords.length)
            return;

        for (let heapAllocationsTimelineRecord of this._pendingRecords) {
            let dataGridNode = new WI.HeapAllocationsTimelineDataGridNode(heapAllocationsTimelineRecord, {
                graphDataSource: this,
                heapAllocationsView: this,
            });
            this._dataGrid.addRowInSortOrder(dataGridNode);
            if (dataGridNode.hidden)
                this._unseenRecords.push(dataGridNode);
        }

        this._pendingRecords = [];
        this._updateUnseenRecordsBannerView();
        this._updateCompareHeapSnapshotButton();
    }

    reset()
    {
        super.reset();

        this._dataGrid.reset();

        this.showHeapSnapshotList();
        this._pendingRecords = [];
        this._unseenRecords = [];
        this._updateUnseenRecordsBannerView();
        this._updateCompareHeapSnapshotButton();
    }

    updateFilter(filters)
    {
        if (this._showingSnapshotList) {
            this._dataGrid.filterText = filters ? filters.text : "";
            return;
        }

        console.assert(this._contentViewContainer.currentContentView);
        this._contentViewContainer.currentContentView.updateFilter(filters);
    }

    filterDidChange()
    {
        super.filterDidChange();

        this._updateUnseenRecordsBannerView();
    }

    // Private

    _heapAllocationsTimelineRecordAdded(event)
    {
        this._pendingRecords.push(event.data.record);

        this.needsLayout();
    }

    _heapSnapshotCollectionEvent(event)
    {
        function updateHeapSnapshotForEvent(heapSnapshot) {
            if (heapSnapshot.invalid)
                return;
            heapSnapshot.updateForCollectionEvent(event);
        }

        for (let node of this._dataGrid.children)
            updateHeapSnapshotForEvent(node.record.heapSnapshot);
        for (let record of this._pendingRecords)
            updateHeapSnapshotForEvent(record.heapSnapshot);
        if (this._heapSnapshotDiff)
            updateHeapSnapshotForEvent(this._heapSnapshotDiff);
    }

    _snapshotListPathComponentClicked(event)
    {
        this.showHeapSnapshotList();
    }

    _snapshotPathComponentSelected(event)
    {
        console.assert(event.data.pathComponent.representedObject instanceof WI.HeapAllocationsTimelineRecord);
        this.showHeapSnapshotTimelineRecord(event.data.pathComponent.representedObject);
    }

    _currentContentViewDidChange(event)
    {
        this.dispatchEventToListeners(WI.ContentView.Event.SelectionPathComponentsDidChange);
        this.dispatchEventToListeners(WI.ContentView.Event.NavigationItemsDidChange);
    }

    _contentViewSelectionPathComponentDidChange(event)
    {
        if (event.target !== this._contentViewContainer.currentContentView)
            return;
        this.dispatchEventToListeners(WI.ContentView.Event.SelectionPathComponentsDidChange);
    }

    _heapSnapshotInvalidated(event)
    {
        let heapSnapshot = event.target;

        if (this._baselineHeapSnapshotTimelineRecord) {
            if (heapSnapshot === this._baselineHeapSnapshotTimelineRecord.heapSnapshot)
                this._cancelSelectComparisonHeapSnapshots();
        }

        if (this._heapSnapshotDiff) {
            if (heapSnapshot === this._heapSnapshotDiff.snapshot1 || heapSnapshot === this._heapSnapshotDiff.snapshot2)
                this.showHeapSnapshotList();
        } else if (this._dataGrid.selectedNode) {
            if (heapSnapshot === this._dataGrid.selectedNode.record.heapSnapshot)
                this.showHeapSnapshotList();
        }

        this._updateCompareHeapSnapshotButton();
    }

    _updateCompareHeapSnapshotButton()
    {
        let hasAtLeastTwoValidSnapshots = false;

        let count = 0;
        for (let node of this._dataGrid.children) {
            if (node.revealed && !node.hidden && !node.record.heapSnapshot.invalid) {
                count++;
                if (count === 2) {
                    hasAtLeastTwoValidSnapshots = true;
                    break;
                }
            }
        }

        this._compareHeapSnapshotsButtonItem.enabled = hasAtLeastTwoValidSnapshots;
    }

    _updateUnseenRecordsBannerView()
    {
        this._unseenRecords = this._unseenRecords.filter((record) => record.hidden);
        if (this._unseenRecords.length) {
            if (this._unseenRecordsBannerView.parentView !== this)
                this.insertSubviewBefore(this._unseenRecordsBannerView, this._dataGrid);
        } else {
            if (this._unseenRecordsBannerView.parentView === this)
                this.removeSubview(this._unseenRecordsBannerView);
        }
    }

    _importButtonNavigationItemClicked()
    {
        WI.FileUtilities.importText((result) => {
            let snapshotStringData = result.text;
            let workerProxy = WI.HeapSnapshotWorkerProxy.singleton();
            workerProxy.createImportedSnapshot(snapshotStringData, result.filename, ({objectId, snapshot: serializedSnapshot}) => {
                let snapshot = WI.HeapSnapshotProxy.deserialize(objectId, serializedSnapshot);
                snapshot.snapshotStringData = snapshotStringData;
                const timestamp = NaN;
                WI.timelineManager.heapSnapshotAdded(timestamp, snapshot);
                this.dispatchEventToListeners(WI.TimelineView.Event.NeedsEntireSelectedRange);
            });
        }, {multiple: true});
    }

    _takeHeapSnapshotClicked()
    {
        WI.heapManager.snapshot((error, timestamp, snapshotStringData) => {
            let workerProxy = WI.HeapSnapshotWorkerProxy.singleton();
            workerProxy.createSnapshot(snapshotStringData, ({objectId, snapshot: serializedSnapshot}) => {
                let snapshot = WI.HeapSnapshotProxy.deserialize(objectId, serializedSnapshot);
                snapshot.snapshotStringData = snapshotStringData;
                WI.timelineManager.heapSnapshotAdded(timestamp, snapshot);
                this.dispatchEventToListeners(WI.TimelineView.Event.NeedsEntireSelectedRange);
            });
        });
    }

    _cancelSelectComparisonHeapSnapshots()
    {
        if (!this._selectingComparisonHeapSnapshots)
            return;

        if (this._baselineDataGridNode)
            this._baselineDataGridNode.clearBaseline();

        this._selectingComparisonHeapSnapshots = false;
        this._baselineDataGridNode = null;
        this._baselineHeapSnapshotTimelineRecord = null;

        this._compareHeapSnapshotsButtonItem.activated = false;

        this.dispatchEventToListeners(WI.ContentView.Event.NavigationItemsDidChange);
    }

    _compareHeapSnapshotsClicked(event)
    {
        let newActivated = !this._compareHeapSnapshotsButtonItem.activated;
        this._compareHeapSnapshotsButtonItem.activated = newActivated;

        if (!newActivated) {
            this._cancelSelectComparisonHeapSnapshots();
            return;
        }

        if (this._dataGrid.selectedNode)
            this._dataGrid.selectedNode.deselect();

        this._selectingComparisonHeapSnapshots = true;
        this._baselineHeapSnapshotTimelineRecord = null;
        this._compareHeapSnapshotHelpTextItem.text = WI.UIString("Select baseline snapshot");

        this.dispatchEventToListeners(WI.ContentView.Event.NavigationItemsDidChange);
    }

    _dataGridNodeSelected(event)
    {
        if (!this._selectingComparisonHeapSnapshots)
            return;

        let dataGridNode = this._dataGrid.selectedNode;
        if (!dataGridNode)
            return;

        let heapAllocationsTimelineRecord = dataGridNode.record;

        // Cancel the selection if the heap snapshot is invalid, or was already selected as the baseline.
        if (heapAllocationsTimelineRecord.heapSnapshot.invalid || this._baselineHeapSnapshotTimelineRecord === heapAllocationsTimelineRecord) {
            this._dataGrid.selectedNode.deselect();
            return;
        }

        // Selected Baseline.
        if (!this._baselineHeapSnapshotTimelineRecord) {
            this._baselineDataGridNode = dataGridNode;
            this._baselineDataGridNode.markAsBaseline();
            this._baselineHeapSnapshotTimelineRecord = heapAllocationsTimelineRecord;
            this._dataGrid.selectedNode.deselect();
            this._compareHeapSnapshotHelpTextItem.text = WI.UIString("Select comparison snapshot");
            this.dispatchEventToListeners(WI.ContentView.Event.NavigationItemsDidChange);
            return;
        }

        // Selected Comparison.
        let snapshot1 = this._baselineHeapSnapshotTimelineRecord.heapSnapshot;
        let snapshot2 = heapAllocationsTimelineRecord.heapSnapshot;
        if (snapshot1.identifier > snapshot2.identifier)
            [snapshot1, snapshot2] = [snapshot2, snapshot1];

        let workerProxy = WI.HeapSnapshotWorkerProxy.singleton();
        workerProxy.createSnapshotDiff(snapshot1.proxyObjectId, snapshot2.proxyObjectId, ({objectId, snapshotDiff: serializedSnapshotDiff}) => {
            let diff = WI.HeapSnapshotDiffProxy.deserialize(objectId, serializedSnapshotDiff);
            this.showHeapSnapshotDiff(diff);
        });

        this._baselineDataGridNode.clearBaseline();
        this._baselineDataGridNode = null;
        this._selectingComparisonHeapSnapshots = false;
        this._compareHeapSnapshotsButtonItem.activated = false;
    }

    _handleUnseenRecordsBannerClearFiltersClicked(event)
    {
        this.dispatchEventToListeners(WI.TimelineView.Event.NeedsFiltersCleared);
        this.dispatchEventToListeners(WI.TimelineView.Event.NeedsEntireSelectedRange);
    }

    _handleUnseenRecordsBannerDismissClicked(event)
    {
        this._unseenRecords = [];
        this._updateUnseenRecordsBannerView();
    }
};

WI.HeapAllocationsTimelineView.ReferencePage = WI.ReferencePage.TimelinesTab.JavaScriptAllocationsTimeline;
