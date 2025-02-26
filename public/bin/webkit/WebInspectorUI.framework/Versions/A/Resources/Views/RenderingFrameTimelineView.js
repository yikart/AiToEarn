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

WI.RenderingFrameTimelineView = class RenderingFrameTimelineView extends WI.TimelineView
{
    constructor(timeline, extraArguments)
    {
        super(timeline, extraArguments);

        console.assert(WI.TimelineRecord.Type.RenderingFrame);

        var scopeBarItems = [];
        for (var key in WI.RenderingFrameTimelineView.DurationFilter) {
            var value = WI.RenderingFrameTimelineView.DurationFilter[key];
            scopeBarItems.push(new WI.ScopeBarItem(value, WI.RenderingFrameTimelineView.displayNameForDurationFilter(value)));
        }

        this._scopeBar = new WI.ScopeBar("rendering-frame-scope-bar", scopeBarItems, scopeBarItems[0], true);
        this._scopeBar.addEventListener(WI.ScopeBar.Event.SelectionChanged, this._scopeBarSelectionDidChange, this);

        let columns = {name: {}, totalTime: {}, scriptTime: {}, layoutTime: {}, paintTime: {}, otherTime: {}, startTime: {}, location: {}};

        columns.name.title = WI.UIString("Name");
        columns.name.width = "20%";
        columns.name.icon = true;
        columns.name.disclosure = true;
        columns.name.locked = true;

        columns.totalTime.title = WI.UIString("Total Time");
        columns.totalTime.width = "15%";
        columns.totalTime.aligned = "right";

        columns.scriptTime.title = WI.RenderingFrameTimelineRecord.displayNameForTaskType(WI.RenderingFrameTimelineRecord.TaskType.Script);
        columns.scriptTime.width = "10%";
        columns.scriptTime.aligned = "right";

        columns.layoutTime.title = WI.RenderingFrameTimelineRecord.displayNameForTaskType(WI.RenderingFrameTimelineRecord.TaskType.Layout);
        columns.layoutTime.width = "10%";
        columns.layoutTime.aligned = "right";

        columns.paintTime.title = WI.RenderingFrameTimelineRecord.displayNameForTaskType(WI.RenderingFrameTimelineRecord.TaskType.Paint);
        columns.paintTime.width = "10%";
        columns.paintTime.aligned = "right";

        columns.otherTime.title = WI.RenderingFrameTimelineRecord.displayNameForTaskType(WI.RenderingFrameTimelineRecord.TaskType.Other);
        columns.otherTime.width = "10%";
        columns.otherTime.aligned = "right";

        columns.startTime.title = WI.UIString("Start Time");
        columns.startTime.width = "15%";
        columns.startTime.aligned = "right";

        columns.location.title = WI.UIString("Location");

        for (var column in columns)
            columns[column].sortable = true;

        this._dataGrid = new WI.TimelineDataGrid(columns);
        this._dataGrid.sortColumnIdentifier = "startTime";
        this._dataGrid.sortOrder = WI.DataGrid.SortOrder.Ascending;
        this._dataGrid.createSettings("rendering-frame-timeline-view");

        this.setupDataGrid(this._dataGrid);

        this.element.classList.add("rendering-frame");
        this.addSubview(this._dataGrid);

        timeline.addEventListener(WI.Timeline.Event.RecordAdded, this._renderingFrameTimelineRecordAdded, this);

        this._pendingRecords = [];

        for (let record of timeline.records)
            this._processRecord(record);
    }

    static displayNameForDurationFilter(filter)
    {
        switch (filter) {
            case WI.RenderingFrameTimelineView.DurationFilter.All:
                return WI.UIString("All");
            case WI.RenderingFrameTimelineView.DurationFilter.OverOneMillisecond:
                return WI.UIString("Over 1 ms");
            case WI.RenderingFrameTimelineView.DurationFilter.OverFifteenMilliseconds:
                return WI.UIString("Over 15 ms");
            default:
                console.error("Unknown filter type", filter);
        }

        return null;
    }

    // Public

    get showsLiveRecordingData() { return false; }

    closed()
    {
        this.representedObject.removeEventListener(WI.Timeline.Event.RecordAdded, this._renderingFrameTimelineRecordAdded, this);

        this._dataGrid.closed();
    }

    get selectionPathComponents()
    {
        let dataGridNode = this._dataGrid.selectedNode;
        if (!dataGridNode || dataGridNode.hidden)
            return null;

        let pathComponents = [];

        while (dataGridNode && !dataGridNode.root) {
            console.assert(dataGridNode instanceof WI.TimelineDataGridNode);
            if (dataGridNode.hidden)
                return null;

            let pathComponent = new WI.TimelineDataGridNodePathComponent(dataGridNode);
            pathComponent.addEventListener(WI.HierarchicalPathComponent.Event.SiblingWasSelected, this.dataGridNodePathComponentSelected, this);
            pathComponents.unshift(pathComponent);
            dataGridNode = dataGridNode.parent;
        }

        return pathComponents;
    }

    get filterStartTime()
    {
        let records = this.representedObject.records;
        let startIndex = this.startTime;
        if (startIndex >= records.length)
            return Infinity;

        return records[startIndex].startTime;
    }

    get filterEndTime()
    {
        let records = this.representedObject.records;
        let endIndex = this.endTime - 1;
        if (endIndex >= records.length)
            return Infinity;

        return records[endIndex].endTime;
    }

    reset()
    {
        super.reset();

        this._dataGrid.reset();

        this._pendingRecords = [];
    }

    // Protected

    dataGridNodePathComponentSelected(event)
    {
        let dataGridNode = event.data.pathComponent.timelineDataGridNode;
        console.assert(dataGridNode.dataGrid === this._dataGrid);

        dataGridNode.revealAndSelect();
    }

    matchDataGridNodeAgainstCustomFilters(node)
    {
        if (!super.matchDataGridNodeAgainstCustomFilters(node))
            return false;

        console.assert(node instanceof WI.TimelineDataGridNode);
        console.assert(this._scopeBar.selectedItems.length === 1);
        let selectedScopeBarItem = this._scopeBar.selectedItems[0];
        if (!selectedScopeBarItem || selectedScopeBarItem.id === WI.RenderingFrameTimelineView.DurationFilter.All)
            return true;

        while (node && !(node.record instanceof WI.RenderingFrameTimelineRecord))
            node = node.parent;

        console.assert(node, "Cannot apply duration filter: no RenderingFrameTimelineRecord found.");
        if (!node)
            return false;

        let minimumDuration = selectedScopeBarItem.id === WI.RenderingFrameTimelineView.DurationFilter.OverOneMillisecond ? 0.001 : 0.015;
        return node.record.duration > minimumDuration;
    }

    layout()
    {
        this._processPendingRecords();
    }

    // Private

    _processPendingRecords()
    {
        if (!this._pendingRecords.length)
            return;

        for (let renderingFrameTimelineRecord of this._pendingRecords) {
            console.assert(renderingFrameTimelineRecord instanceof WI.RenderingFrameTimelineRecord);

            let dataGridNode = new WI.RenderingFrameTimelineDataGridNode(renderingFrameTimelineRecord, {
                graphDataSource: this,
            });
            this._dataGrid.addRowInSortOrder(dataGridNode);

            let stack = [{children: renderingFrameTimelineRecord.children, parentDataGridNode: dataGridNode, index: 0}];
            while (stack.length) {
                let entry = stack.lastValue;
                if (entry.index >= entry.children.length) {
                    stack.pop();
                    continue;
                }

                let childRecord = entry.children[entry.index];
                let childDataGridNode = null;
                if (childRecord.type === WI.TimelineRecord.Type.Layout) {
                    childDataGridNode = new WI.LayoutTimelineDataGridNode(childRecord, {
                        graphDataSource: this,
                    });

                    this._dataGrid.addRowInSortOrder(childDataGridNode, entry.parentDataGridNode);
                } else if (childRecord.type === WI.TimelineRecord.Type.Script) {
                    let rootNodes = [];
                    if (childRecord.profile) {
                        // FIXME: Support using the bottom-up tree once it is implemented.
                        rootNodes = childRecord.profile.topDownRootNodes;
                    }

                    childDataGridNode = new WI.ScriptTimelineDataGridNode(childRecord, {
                        graphDataSource: this,
                    });

                    this._dataGrid.addRowInSortOrder(childDataGridNode, entry.parentDataGridNode);

                    for (let profileNode of rootNodes) {
                        let profileNodeDataGridNode = new WI.ProfileNodeDataGridNode(profileNode, {
                            graphDataSource: this,
                        });
                        this._dataGrid.addRowInSortOrder(profileNodeDataGridNode, childDataGridNode);
                    }
                }

                if (childDataGridNode && childRecord.children.length)
                    stack.push({children: childRecord.children, parentDataGridNode: childDataGridNode, index: 0});
                ++entry.index;
            }
        }

        this._pendingRecords = [];
    }

    _renderingFrameTimelineRecordAdded(event)
    {
        let renderingFrameTimelineRecord = event.data.record;
        console.assert(renderingFrameTimelineRecord instanceof WI.RenderingFrameTimelineRecord);
        console.assert(renderingFrameTimelineRecord.children.length, "Missing child records for rendering frame.");

        this._processRecord(renderingFrameTimelineRecord);

        this.needsLayout();
    }

    _processRecord(renderingFrameTimelineRecord)
    {
        this._pendingRecords.push(renderingFrameTimelineRecord);
    }

    _scopeBarSelectionDidChange()
    {
        this._dataGrid.filterDidChange();
    }
};

WI.RenderingFrameTimelineView.DurationFilter = {
    All: "rendering-frame-timeline-view-duration-filter-all",
    OverOneMillisecond: "rendering-frame-timeline-view-duration-filter-over-1-ms",
    OverFifteenMilliseconds: "rendering-frame-timeline-view-duration-filter-over-15-ms"
};

WI.RenderingFrameTimelineView.ReferencePage = WI.ReferencePage.TimelinesTab.FramesView;
