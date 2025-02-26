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

WI.LayoutTimelineView = class LayoutTimelineView extends WI.TimelineView
{
    constructor(timeline, extraArguments)
    {
        super(timeline, extraArguments);

        console.assert(timeline.type === WI.TimelineRecord.Type.Layout, timeline);

        let columns = {type: {}, name: {}, initiator: {}, area: {}, width: {}, height: {}, startTime: {}, totalTime: {}};

        columns.name.title = WI.UIString("Type");
        columns.name.width = "15%";

        var typeToLabelMap = new Map;
        for (var key in WI.LayoutTimelineRecord.EventType) {
            var value = WI.LayoutTimelineRecord.EventType[key];
            typeToLabelMap.set(value, WI.LayoutTimelineRecord.displayNameForEventType(value));
        }

        columns.type.scopeBar = WI.TimelineDataGrid.createColumnScopeBar("layout", typeToLabelMap);
        columns.type.hidden = true;
        columns.type.locked = true;

        columns.name.disclosure = true;
        columns.name.icon = true;
        columns.name.locked = true;

        this._scopeBar = columns.type.scopeBar;

        columns.initiator.title = WI.UIString("Initiator");
        columns.initiator.width = "25%";

        columns.area.title = WI.UIString("Area");
        columns.area.width = "8%";

        columns.width.title = WI.UIString("Width");
        columns.width.width = "8%";

        columns.height.title = WI.UIString("Height");
        columns.height.width = "8%";

        columns.startTime.title = WI.UIString("Start Time");
        columns.startTime.width = "8%";
        columns.startTime.aligned = "right";

        columns.totalTime.title = WI.UIString("Duration");
        columns.totalTime.width = "8%";
        columns.totalTime.aligned = "right";

        for (var column in columns)
            columns[column].sortable = true;

        this._dataGrid = new WI.LayoutTimelineDataGrid(columns);
        this._dataGrid.addEventListener(WI.DataGrid.Event.SelectedNodeChanged, this._dataGridSelectedNodeChanged, this);

        this.setupDataGrid(this._dataGrid);

        this._dataGrid.sortColumnIdentifier = "startTime";
        this._dataGrid.sortOrder = WI.DataGrid.SortOrder.Ascending;
        this._dataGrid.createSettings("layout-timeline-view");

        this._hoveredTreeElement = null;
        this._hoveredDataGridNode = null;
        this._showingHighlight = false;
        this._showingHighlightForRecord = null;

        this._dataGrid.element.addEventListener("mouseover", this._mouseOverDataGrid.bind(this));
        this._dataGrid.element.addEventListener("mouseleave", this._mouseLeaveDataGrid.bind(this));

        this.element.classList.add("layout");
        this.addSubview(this._dataGrid);

        timeline.addEventListener(WI.Timeline.Event.RecordAdded, this._layoutTimelineRecordAdded, this);

        this._pendingRecords = [];

        for (let record of timeline.records)
            this._processRecord(record);
    }

    // Public

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

    attached()
    {
        super.attached();

        this._updateHighlight();
    }

    detached()
    {
        this._hideHighlightIfNeeded();

        super.detached();
    }

    closed()
    {
        this.representedObject.removeEventListener(WI.Timeline.Event.RecordAdded, this._layoutTimelineRecordAdded, this);

        this._dataGrid.closed();
    }

    reset()
    {
        super.reset();

        this._hideHighlightIfNeeded();

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

    filterDidChange()
    {
        super.filterDidChange();

        this._updateHighlight();
    }

    treeElementSelected(treeElement, selectedByUser)
    {
        if (this._dataGrid.shouldIgnoreSelectionEvent())
            return;

        super.treeElementSelected(treeElement, selectedByUser);

        this._updateHighlight();
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

        for (var layoutTimelineRecord of this._pendingRecords) {
            let dataGridNode = new WI.LayoutTimelineDataGridNode(layoutTimelineRecord, {
                graphDataSource: this,
            });

            this._dataGrid.addRowInSortOrder(dataGridNode);

            let stack = [{children: layoutTimelineRecord.children, parentDataGridNode: dataGridNode, index: 0}];
            while (stack.length) {
                let entry = stack.lastValue;
                if (entry.index >= entry.children.length) {
                    stack.pop();
                    continue;
                }

                let childRecord = entry.children[entry.index];

                const options = {
                    graphDataSource: this,
                };
                let childDataGridNode = null;
                if (childRecord.type === WI.TimelineRecord.Type.Script)
                    childDataGridNode = new WI.ScriptTimelineDataGridNode(childRecord, options);
                else {
                    console.assert(childRecord.type === WI.TimelineRecord.Type.Layout, childRecord);
                    childDataGridNode = new WI.LayoutTimelineDataGridNode(childRecord, options);
                }

                console.assert(entry.parentDataGridNode, "Missing parent node for entry.", entry);
                this._dataGrid.addRowInSortOrder(childDataGridNode, entry.parentDataGridNode);

                if (childDataGridNode && childRecord.children.length)
                    stack.push({children: childRecord.children, parentDataGridNode: childDataGridNode, index: 0});

                ++entry.index;
            }
        }

        this._pendingRecords = [];
    }

    _layoutTimelineRecordAdded(event)
    {
        let layoutTimelineRecord = event.data.record;
        console.assert(layoutTimelineRecord instanceof WI.LayoutTimelineRecord);

        this._processRecord(layoutTimelineRecord);

        this.needsLayout();
    }

    _processRecord(layoutTimelineRecord)
    {
        // Only add top-level records, to avoid processing child records multiple times.
        if (layoutTimelineRecord.parent instanceof WI.LayoutTimelineRecord)
            return;

        this._pendingRecords.push(layoutTimelineRecord);
    }

    _updateHighlight()
    {
        var record = this._hoveredOrSelectedRecord();
        if (!record) {
            this._hideHighlightIfNeeded();
            return;
        }

        this._showHighlightForRecord(record);
    }

    _showHighlightForRecord(record)
    {
        if (this._showingHighlightForRecord === record)
            return;

        this._showingHighlightForRecord = record;

        let target = WI.assumingMainTarget();

        const contentColor = {r: 111, g: 168, b: 220, a: 0.66};
        const outlineColor = {r: 255, g: 229, b: 153, a: 0.66};

        var quad = record.quad;
        if (quad) {
            target.DOMAgent.highlightQuad(quad.toProtocol(), contentColor, outlineColor);
            this._showingHighlight = true;
            return;
        }

        // This record doesn't have a highlight, so hide any existing highlight.
        if (this._showingHighlight) {
            this._showingHighlight = false;
            target.DOMAgent.hideHighlight();
        }
    }

    _hideHighlightIfNeeded()
    {
        this._showingHighlightForRecord = null;

        if (this._showingHighlight) {
            this._showingHighlight = false;

            let target = WI.assumingMainTarget();
            target.DOMAgent.hideHighlight();
        }
    }

    _hoveredOrSelectedRecord()
    {
        if (this._hoveredDataGridNode)
            return this._hoveredDataGridNode.record;

        if (this._dataGrid.selectedNode && this._dataGrid.selectedNode.revealed)
            return this._dataGrid.selectedNode.record;

        return null;
    }

    _mouseOverDataGrid(event)
    {
        var hoveredDataGridNode = this._dataGrid.dataGridNodeFromNode(event.target);
        if (!hoveredDataGridNode)
            return;

        this._hoveredDataGridNode = hoveredDataGridNode;
        this._updateHighlight();
    }

    _mouseLeaveDataGrid(event)
    {
        this._hoveredDataGridNode = null;
        this._updateHighlight();
    }

    _dataGridSelectedNodeChanged(event)
    {
        this._updateHighlight();
    }
};

WI.LayoutTimelineView.ReferencePage = WI.ReferencePage.TimelinesTab.LayoutAndRenderingTimeline;
