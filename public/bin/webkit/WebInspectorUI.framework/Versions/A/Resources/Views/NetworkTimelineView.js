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

WI.NetworkTimelineView = class NetworkTimelineView extends WI.TimelineView
{
    constructor(timeline, extraArguments)
    {
        super(timeline, extraArguments);

        console.assert(timeline.type === WI.TimelineRecord.Type.Network);

        let columns = {name: {}, domain: {}, type: {}, method: {}, scheme: {}, statusCode: {}, cached: {}, protocol: {}, priority: {}, remoteAddress: {}, connectionIdentifier: {}, size: {}, transferSize: {}, requestSent: {}, latency: {}, duration: {}, initiator: {}, graph: {}};

        columns.name.title = WI.UIString("Name");
        columns.name.icon = true;
        columns.name.width = "10%";
        columns.name.locked = true;

        columns.domain.title = WI.UIString("Domain");
        columns.domain.width = "8%";

        columns.type.title = WI.UIString("Type");
        columns.type.width = "7%";

        let typeToLabelMap = new Map;
        for (let key in WI.Resource.Type) {
            let value = WI.Resource.Type[key];
            typeToLabelMap.set(value, WI.Resource.displayNameForType(value, true));
        }

        columns.type.scopeBar = WI.TimelineDataGrid.createColumnScopeBar("network", typeToLabelMap);
        this._scopeBar = columns.type.scopeBar;

        columns.method.title = WI.UIString("Method");
        columns.method.width = "4%";

        columns.scheme.title = WI.UIString("Scheme");
        columns.scheme.width = "4%";

        columns.statusCode.title = WI.UIString("Status");
        columns.statusCode.width = "4%";

        columns.cached.title = WI.UIString("Cached");
        columns.cached.width = "6%";

        columns.protocol.title = WI.UIString("Protocol");
        columns.protocol.width = "5%";
        columns.protocol.hidden = true;

        columns.priority.title = WI.UIString("Priority");
        columns.priority.width = "5%";
        columns.priority.hidden = true;

        columns.remoteAddress.title = WI.UIString("IP Address");
        columns.remoteAddress.width = "8%";
        columns.remoteAddress.hidden = true;

        columns.connectionIdentifier.title = WI.UIString("Connection ID");
        columns.connectionIdentifier.width = "5%";
        columns.connectionIdentifier.hidden = true;
        columns.connectionIdentifier.aligned = "right";

        columns.size.title = WI.UIString("Size");
        columns.size.width = "6%";
        columns.size.aligned = "right";

        columns.transferSize.title = WI.UIString("Transferred");
        columns.transferSize.width = "8%";
        columns.transferSize.aligned = "right";

        columns.requestSent.title = WI.UIString("Start Time");
        columns.requestSent.width = "9%";
        columns.requestSent.aligned = "right";

        columns.latency.title = WI.UIString("Latency");
        columns.latency.width = "9%";
        columns.latency.aligned = "right";

        columns.duration.title = WI.UIString("Duration");
        columns.duration.width = "9%";
        columns.duration.aligned = "right";

        columns.initiator.title = WI.UIString("Initiator");
        columns.initiator.width = "9%";
        columns.initiator.hidden = true;

        for (let column in columns)
            columns[column].sortable = true;

        this._timelineRuler = new WI.TimelineRuler;
        this._timelineRuler.allowsClippedLabels = true;

        columns.graph.title = WI.UIString("Timeline");
        columns.graph.width = "15%";
        columns.graph.headerView = this._timelineRuler;
        columns.graph.sortable = false;

        this._dataGrid = new WI.TimelineDataGrid(columns);
        this._dataGrid.sortDelegate = this;
        this._dataGrid.sortColumnIdentifier = "requestSent";
        this._dataGrid.sortOrder = WI.DataGrid.SortOrder.Ascending;
        this._dataGrid.createSettings("network-timeline-view");

        this.setupDataGrid(this._dataGrid);

        this.element.classList.add("network");
        this.addSubview(this._dataGrid);

        timeline.addEventListener(WI.Timeline.Event.RecordAdded, this._networkTimelineRecordAdded, this);

        this._pendingRecords = [];
        this._resourceDataGridNodeMap = new Map;

        for (let record of timeline.records)
            this._processRecord(record);
    }

    // Public

    get secondsPerPixel() { return this._timelineRuler.secondsPerPixel; }

    get selectionPathComponents()
    {
        if (!this._dataGrid.selectedNode || this._dataGrid.selectedNode.hidden)
            return null;

        console.assert(this._dataGrid.selectedNode instanceof WI.ResourceTimelineDataGridNode);

        let pathComponent = new WI.TimelineDataGridNodePathComponent(this._dataGrid.selectedNode, this._dataGrid.selectedNode.resource);
        pathComponent.addEventListener(WI.HierarchicalPathComponent.Event.SiblingWasSelected, this.dataGridNodePathComponentSelected, this);
        return [pathComponent];
    }

    closed()
    {
        this.representedObject.removeEventListener(WI.Timeline.Event.RecordAdded, this._networkTimelineRecordAdded, this);

        this._dataGrid.closed();
    }

    reset()
    {
        super.reset();

        this._dataGrid.reset();

        this._pendingRecords = [];
        this._resourceDataGridNodeMap.clear();
    }

    // TimelineDataGrid sort delegate

    dataGridSortComparator(sortColumnIdentifier, sortDirection, node1, node2)
    {
        if (sortColumnIdentifier === "priority")
            return WI.Resource.comparePriority(node1.data.priority, node2.data.priority) * sortDirection;

        if (sortColumnIdentifier === "name") {
            let displayName1 = node1.displayName();
            let displayName2 = node2.displayName();

            if (displayName1 !== displayName2)
                return displayName1.extendedLocaleCompare(displayName2) * sortDirection;

            return node1.resource.url.extendedLocaleCompare(node2.resource.url) * sortDirection;
        }

        return null;
    }

    // Protected

    dataGridNodePathComponentSelected(event)
    {
        let pathComponent = event.data.pathComponent;
        console.assert(pathComponent instanceof WI.TimelineDataGridNodePathComponent);

        let dataGridNode = pathComponent.timelineDataGridNode;
        console.assert(dataGridNode.dataGrid === this._dataGrid);

        dataGridNode.revealAndSelect();
    }

    layout()
    {
        this.endTime = Math.min(this.endTime, this.currentTime);

        let oldZeroTime = this._timelineRuler.zeroTime;
        let oldStartTime = this._timelineRuler.startTime;
        let oldEndTime = this._timelineRuler.endTime;

        this._timelineRuler.zeroTime = this.zeroTime;
        this._timelineRuler.startTime = this.startTime;
        this._timelineRuler.endTime = this.endTime;

        // We only need to refresh the graphs when the any of the times change.
        if (this.zeroTime !== oldZeroTime || this.startTime !== oldStartTime || this.endTime !== oldEndTime) {
            for (let dataGridNode of this._resourceDataGridNodeMap.values())
                dataGridNode.refreshGraph();
        }

        this._processPendingRecords();
    }

    // Private

    _processPendingRecords()
    {
        if (!this._pendingRecords.length)
            return;

        for (let resourceTimelineRecord of this._pendingRecords) {
            // Skip the record if it already exists in the grid.
            // FIXME: replace with this._dataGrid.findDataGridNode(resourceTimelineRecord.resource) once <https://webkit.org/b/155305> is fixed.
            let dataGridNode = this._resourceDataGridNodeMap.get(resourceTimelineRecord.resource);
            if (dataGridNode)
                continue;

            dataGridNode = new WI.ResourceTimelineDataGridNode(resourceTimelineRecord, {
                graphDataSource: this,
                shouldShowPopover: true,
            });

            this._resourceDataGridNodeMap.set(resourceTimelineRecord.resource, dataGridNode);

            this._dataGrid.addRowInSortOrder(dataGridNode);
        }

        this._pendingRecords = [];
    }

    _networkTimelineRecordAdded(event)
    {
        let resourceTimelineRecord = event.data.record;
        console.assert(resourceTimelineRecord instanceof WI.ResourceTimelineRecord);

        this._processRecord(resourceTimelineRecord);

        this.needsLayout();
    }

    _processRecord(resourceTimelineRecord)
    {
        this._pendingRecords.push(resourceTimelineRecord);
    }
};

WI.NetworkTimelineView.ReferencePage = WI.ReferencePage.TimelinesTab.NetworkRequestsTimeline;
