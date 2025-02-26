/*
 * Copyright (C) 2018 Apple Inc. All rights reserved.
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

WI.MediaTimelineView = class MediaTimelineView extends WI.TimelineView
{
    constructor(timeline, extraArguments)
    {
        console.assert(timeline instanceof WI.Timeline);
        console.assert(timeline.type === WI.TimelineRecord.Type.Media);

        super(timeline, extraArguments);

        this._timelineRuler = new WI.TimelineRuler;

        const columns = {
            name: {
                title: WI.UIString("Name"),
                width: "200px",
                icon: true,
                sortable: true,
                locked: true,
            },
            element: {
                title: WI.UIString("Element"),
                width: "150px",
                sortable: true,
                locked: true,
            },
            graph: {
                headerView: this._timelineRuler,
                sortable: true,
                locked: true,
            },
        };

        this._dataGrid = new WI.TimelineDataGrid(columns);
        this._dataGrid.sortDelegate = this;
        this._dataGrid.sortColumnIdentifier = "graph";
        this._dataGrid.sortOrder = WI.DataGrid.SortOrder.Ascending;
        this._dataGrid.createSettings("media-timeline-view");
        this.setupDataGrid(this._dataGrid);
        this.addSubview(this._dataGrid);

        this.element.classList.add("media");

        timeline.addEventListener(WI.Timeline.Event.RecordAdded, this._handleRecordAdded, this);

        this._pendingRecords = [];

        for (let record of timeline.records)
            this._processRecord(record);
    }

    // Public

    get secondsPerPixel() { return this._timelineRuler.secondsPerPixel; }

    get selectionPathComponents()
    {
        if (!this._dataGrid.selectedNode || this._dataGrid.selectedNode.hidden)
            return null;

        let pathComponent = new WI.TimelineDataGridNodePathComponent(this._dataGrid.selectedNode);
        pathComponent.addEventListener(WI.HierarchicalPathComponent.Event.SiblingWasSelected, this._handleSelectionPathComponentSiblingSelected, this);
        return [pathComponent];
    }

    closed()
    {
        this.representedObject.removeEventListener(WI.Timeline.Event.RecordAdded, this._handleRecordAdded, this);

        this._dataGrid.closed();

        super.closed();
    }

    reset()
    {
        this._dataGrid.reset();

        this._pendingRecords = [];

        super.reset();
    }

    // TimelineDataGrid delegate

    dataGridSortComparator(sortColumnIdentifier, sortDirection, node1, node2)
    {
        function compareDOMNodes(a, b) {
            if (a && !b)
                return -1;
            if (b && !a)
                return 1;
            if (!a && !b)
                return 0;
            return a.displayName.extendedLocaleCompare(b.displayName);
        }

        if (sortColumnIdentifier === "name") {
            let displayName1 = node1.displayName();
            let displayName2 = node2.displayName();
            return displayName1.extendedLocaleCompare(displayName2) * sortDirection;
        }

        if (sortColumnIdentifier === "element")
            return compareDOMNodes(node1.record.domNode, node2.record.domNode) * sortDirection;

        if (sortColumnIdentifier === "graph")
            return (node1.record.startTime - node2.record.startTime) * sortDirection;

        return null;
    }

    // Protected

    layout()
    {
        super.layout();

        this.endTime = Math.min(this.endTime, this.currentTime);

        let oldZeroTime = this._timelineRuler.zeroTime;
        let oldStartTime = this._timelineRuler.startTime;
        let oldEndTime = this._timelineRuler.endTime;

        this._timelineRuler.zeroTime = this.zeroTime;
        this._timelineRuler.startTime = this.startTime;
        this._timelineRuler.endTime = this.endTime;

        // We only need to refresh the graphs when the any of the times change.
        if (this.zeroTime !== oldZeroTime || this.startTime !== oldStartTime || this.endTime !== oldEndTime) {
            for (let dataGridNode of this._dataGrid.children)
                dataGridNode.refreshGraph();
        }

        this._processPendingRecords();
    }

    // Private

    _processPendingRecords()
    {
        if (!this._pendingRecords.length)
            return;

        for (let timelineRecord of this._pendingRecords) {
            this._dataGrid.addRowInSortOrder(new WI.MediaTimelineDataGridNode(timelineRecord, {
                graphDataSource: this,
            }));
        }

        this._pendingRecords = [];
    }

    _handleRecordAdded(event)
    {
        let mediaTimelineRecord = event.data.record;
        console.assert(mediaTimelineRecord instanceof WI.MediaTimelineRecord);

        this._processRecord(mediaTimelineRecord);

        this.needsLayout();
    }

    _processRecord(mediaTimelineRecord)
    {
        this._pendingRecords.push(mediaTimelineRecord);
    }

    _handleSelectionPathComponentSiblingSelected(event)
    {
        let pathComponent = event.data.pathComponent;
        console.assert(pathComponent instanceof WI.TimelineDataGridNodePathComponent);

        let dataGridNode = pathComponent.timelineDataGridNode;
        console.assert(dataGridNode.dataGrid === this._dataGrid);

        dataGridNode.revealAndSelect();
    }
};

WI.MediaTimelineView.ReferencePage = WI.ReferencePage.TimelinesTab.MediaAndAnimationsTimeline;
