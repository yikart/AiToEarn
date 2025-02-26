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

WI.ScriptDetailsTimelineView = class ScriptDetailsTimelineView extends WI.TimelineView
{
    constructor(timeline, extraArguments)
    {
        super(timeline, extraArguments);

        console.assert(timeline.type === WI.TimelineRecord.Type.Script);

        let columns = {name: {}, location: {}, callCount: {}, startTime: {}, totalTime: {}, selfTime: {}, averageTime: {}};

        columns.name.title = WI.UIString("Name");
        columns.name.width = "30%";
        columns.name.icon = true;
        columns.name.disclosure = true;
        columns.name.locked = true;

        columns.location.title = WI.UIString("Location");
        columns.location.icon = true;
        columns.location.width = "15%";

        columns.callCount.title = WI.UIString("Samples");
        columns.callCount.width = "5%";
        columns.callCount.aligned = "right";

        columns.startTime.title = WI.UIString("Start Time");
        columns.startTime.width = "10%";
        columns.startTime.aligned = "right";

        columns.totalTime.title = WI.UIString("Total Time");
        columns.totalTime.width = "10%";
        columns.totalTime.aligned = "right";

        columns.selfTime.title = WI.UIString("Self Time");
        columns.selfTime.width = "10%";
        columns.selfTime.aligned = "right";

        columns.averageTime.title = WI.UIString("Average Time");
        columns.averageTime.width = "10%";
        columns.averageTime.aligned = "right";

        for (var column in columns)
            columns[column].sortable = true;

        this._dataGrid = new WI.ScriptTimelineDataGrid(columns);
        this._dataGrid.sortDelegate = this;
        this._dataGrid.sortColumnIdentifier = "startTime";
        this._dataGrid.sortOrder = WI.DataGrid.SortOrder.Ascending;
        this._dataGrid.createSettings("script-timeline-view");

        this.setupDataGrid(this._dataGrid);

        this.element.classList.add("script");
        this.addSubview(this._dataGrid);

        timeline.addEventListener(WI.Timeline.Event.RecordAdded, this._scriptTimelineRecordAdded, this);
        timeline.addEventListener(WI.Timeline.Event.Refreshed, this._scriptTimelineRecordRefreshed, this);

        this._pendingRecords = [];

        for (let record of timeline.records)
            this._processRecord(record);
    }

    // Public

    get showsLiveRecordingData() { return false; }

    closed()
    {
        this.representedObject.removeEventListener(WI.Timeline.Event.RecordAdded, this._scriptTimelineRecordAdded, this);
        this.representedObject.removeEventListener(WI.Timeline.Event.Refreshed, this._scriptTimelineRecordRefreshed, this);

        this._dataGrid.closed();
    }

    get selectionPathComponents()
    {
        var dataGridNode = this._dataGrid.selectedNode;
        if (!dataGridNode)
            return null;

        var pathComponents = [];

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

    reset()
    {
        super.reset();

        this._dataGrid.reset();

        this._pendingRecords = [];
    }

    // TimelineDataGrid sort delegate

    dataGridSortComparator(sortColumnIdentifier, sortDirection, node1, node2)
    {
        if (sortColumnIdentifier !== "name")
            return null;

        let displayName1 = node1.displayName();
        let displayName2 = node2.displayName();
        if (displayName1 !== displayName2)
            return displayName1.extendedLocaleCompare(displayName2) * sortDirection;

        return node1.subtitle.extendedLocaleCompare(node2.subtitle) * sortDirection;
    }

    // Protected

    dataGridNodePathComponentSelected(event)
    {
        let dataGridNode = event.data.pathComponent.timelineDataGridNode;
        console.assert(dataGridNode.dataGrid === this._dataGrid);

        dataGridNode.revealAndSelect();
    }

    layout()
    {
        if (this.startTime !== this._oldStartTime || this.endTime !== this._oldEndTime) {
            let dataGridNode = this._dataGrid.children[0];
            while (dataGridNode) {
                if (dataGridNode.revealed)
                    dataGridNode.refresh();
                else
                    dataGridNode.needsRefresh();

                dataGridNode = dataGridNode.traverseNextNode(false, null, true);
            }

            this._oldStartTime = this.startTime;
            this._oldEndTime = this.endTime;
        }

        this._processPendingRecords();
    }

    // Private

    _processPendingRecords()
    {
        if (WI.timelineManager.scriptProfilerIsTracking())
            return;

        if (!this._pendingRecords.length)
            return;

        for (let scriptTimelineRecord of this._pendingRecords) {
            let rootNodes = [];
            if (scriptTimelineRecord.profile) {
                // FIXME: Support using the bottom-up tree once it is implemented.
                rootNodes = scriptTimelineRecord.profile.topDownRootNodes;
            }

            let dataGridNode = new WI.ScriptTimelineDataGridNode(scriptTimelineRecord, {
                graphDataSource: this,
            });
            this._dataGrid.addRowInSortOrder(dataGridNode);

            for (let profileNode of rootNodes) {
                let profileNodeDataGridNode = new WI.ProfileNodeDataGridNode(profileNode, {
                    graphDataSource: this,
                });
                this._dataGrid.addRowInSortOrder(profileNodeDataGridNode, dataGridNode);
            }
        }

        this._pendingRecords = [];
    }

    _scriptTimelineRecordAdded(event)
    {
        let scriptTimelineRecord = event.data.record;
        console.assert(scriptTimelineRecord instanceof WI.ScriptTimelineRecord);

        this._processRecord(scriptTimelineRecord);

        this.needsLayout();
    }

    _processRecord(scriptTimelineRecord)
    {
        this._pendingRecords.push(scriptTimelineRecord);
    }

    _scriptTimelineRecordRefreshed(event)
    {
        this.needsLayout();
    }
};

WI.ScriptDetailsTimelineView.ReferencePage = WI.ReferencePage.TimelinesTab.JavaScriptAndEventsTimeline;
