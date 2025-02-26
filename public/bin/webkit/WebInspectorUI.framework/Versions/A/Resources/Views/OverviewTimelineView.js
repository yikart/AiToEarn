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

WI.OverviewTimelineView = class OverviewTimelineView extends WI.TimelineView
{
    constructor(recording, extraArguments)
    {
        console.assert(recording instanceof WI.TimelineRecording);

        super(recording, extraArguments);

        this._recording = recording;
        this._pendingRepresentedObjects = [];
        this._resourceDataGridNodeMap = new Map;

        if (WI.TimelineRecording.sourceCodeTimelinesSupported() && !this._recording.imported) {
            WI.settings.timelineOverviewGroupBySourceCode.addEventListener(WI.Setting.Event.Changed, this._handleGroupBySourceCodeSettingChanged, this);

            this._groupBySourceCodeNavigationItem = new WI.CheckboxNavigationItem("overview-timeline-group-by-resource", WI.UIString("Group By Resource"), WI.settings.timelineOverviewGroupBySourceCode.value);
            this._groupBySourceCodeNavigationItem.addEventListener(WI.CheckboxNavigationItem.Event.CheckedDidChange, this._handleGroupBySourceCodeNavigationItemCheckedDidChange, this);
        }

        let columns = {name: {}, source: {}, graph: {}};

        columns.name.title = WI.UIString("Name");
        columns.name.width = "20%";
        columns.name.icon = true;
        columns.name.locked = true;
        if (this._shouldGroupBySourceCode)
            columns.name.disclosure = true;

        columns.source.title = WI.UIString("Source");
        columns.source.width = "10%";
        columns.source.icon = true;
        columns.source.locked = true;
        if (this._shouldGroupBySourceCode)
            columns.source.hidden = true;

        this._timelineRuler = new WI.TimelineRuler;
        this._timelineRuler.allowsClippedLabels = true;

        columns.graph.width = "70%";
        columns.graph.headerView = this._timelineRuler;
        columns.graph.locked = true;

        this._dataGrid = new WI.TimelineDataGrid(columns);

        this.setupDataGrid(this._dataGrid);

        this._currentTimeMarker = new WI.TimelineMarker(0, WI.TimelineMarker.Type.CurrentTime);
        this._timelineRuler.addMarker(this._currentTimeMarker);

        this.element.classList.add("overview");
        this.addSubview(this._dataGrid);

        for (let timeline of this._relevantTimelines)
            timeline.addEventListener(WI.Timeline.Event.RecordAdded, this._handleTimelineRecordAdded, this);

        recording.addEventListener(WI.TimelineRecording.Event.SourceCodeTimelineAdded, this._sourceCodeTimelineAdded, this);
        recording.addEventListener(WI.TimelineRecording.Event.MarkerAdded, this._markerAdded, this);
        recording.addEventListener(WI.TimelineRecording.Event.Reset, this._recordingReset, this);

        this._loadExistingRecords();
    }

    // Public

    get secondsPerPixel()
    {
        return this._timelineRuler.secondsPerPixel;
    }

    set secondsPerPixel(x)
    {
        this._timelineRuler.secondsPerPixel = x;
    }

    attached()
    {
        super.attached();

        this._timelineRuler.needsLayout(WI.View.LayoutReason.Resize);
    }

    closed()
    {
        for (let timeline of this._recording.timelines.values())
            timeline.removeEventListener(WI.Timeline.Event.RecordAdded, this._handleTimelineRecordAdded, this);

        this._recording.removeEventListener(WI.TimelineRecording.Event.SourceCodeTimelineAdded, this._sourceCodeTimelineAdded, this);
        this._recording.removeEventListener(WI.TimelineRecording.Event.MarkerAdded, this._markerAdded, this);
        this._recording.removeEventListener(WI.TimelineRecording.Event.Reset, this._recordingReset, this);
    }

    get navigationItems()
    {
        let navigationItems = [];
        if (this._groupBySourceCodeNavigationItem)
            navigationItems.push(this._groupBySourceCodeNavigationItem);
        return navigationItems;
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

    reset()
    {
        super.reset();

        this._dataGrid.reset();

        this._pendingRepresentedObjects = [];
        this._resourceDataGridNodeMap.clear();
    }

    // Protected

    get showsImportedRecordingMessage()
    {
        return true;
    }

    dataGridNodePathComponentSelected(event)
    {
        let dataGridNode = event.data.pathComponent.timelineDataGridNode;
        console.assert(dataGridNode.dataGrid === this._dataGrid);

        dataGridNode.revealAndSelect();
    }

    layout()
    {
        let oldZeroTime = this._timelineRuler.zeroTime;
        let oldStartTime = this._timelineRuler.startTime;
        let oldEndTime = this._timelineRuler.endTime;
        let oldCurrentTime = this._currentTimeMarker.time;

        this._timelineRuler.zeroTime = this.zeroTime;
        this._timelineRuler.startTime = this.startTime;
        this._timelineRuler.endTime = this.endTime;
        this._currentTimeMarker.time = this.currentTime;

        // The TimelineDataGridNode graphs are positioned with percentages, so they auto resize with the view.
        // We only need to refresh the graphs when the any of the times change.
        if (this.zeroTime !== oldZeroTime || this.startTime !== oldStartTime || this.endTime !== oldEndTime || this.currentTime !== oldCurrentTime) {
            let dataGridNode = this._dataGrid.children[0];
            while (dataGridNode) {
                dataGridNode.refreshGraph();
                dataGridNode = dataGridNode.traverseNextNode(true, null, true);
            }
        }

        this._processPendingRepresentedObjects();
    }

    // Private

    get _relevantTimelines()
    {
        let timelines = [];
        for (let [type, timeline] of this._recording.timelines) {
            if (type === WI.TimelineRecord.Type.RenderingFrame || type === WI.TimelineRecord.Type.CPU || type === WI.TimelineRecord.Type.Memory)
                continue;

            timelines.push(timeline);
        }
        return timelines;
    }

    get _shouldGroupBySourceCode()
    {
        // Always show imported records as non-grouped.
        if (this._recording.imported)
            return false;

        return WI.TimelineRecording.sourceCodeTimelinesSupported() && WI.settings.timelineOverviewGroupBySourceCode.value;
    }

    _loadExistingRecords()
    {
        this._pendingRepresentedObjects = [];
        this._resourceDataGridNodeMap.clear();

        this._dataGrid.removeChildren();

        if (this._shouldGroupBySourceCode) {
            let networkTimeline = this._recording.timelines.get(WI.TimelineRecord.Type.Network);
            if (networkTimeline)
                this._pendingRepresentedObjects.pushAll(networkTimeline.records.map((record) => record.resource));

            this._pendingRepresentedObjects.pushAll(this._recording.sourceCodeTimelines);
        } else {
            for (let timeline of this._relevantTimelines)
                this._pendingRepresentedObjects.pushAll(timeline.records);
        }

        this.needsLayout();
    }

    _compareDataGridNodesByStartTime(a, b)
    {
        function getStartTime(dataGridNode)
        {
            if (dataGridNode instanceof WI.ResourceTimelineDataGridNode)
                return dataGridNode.resource.firstTimestamp;
            if (dataGridNode instanceof WI.SourceCodeTimelineTimelineDataGridNode)
                return dataGridNode.sourceCodeTimeline.startTime;

            console.error("Unknown data grid node.", dataGridNode);
            return 0;
        }

        let result = getStartTime(a) - getStartTime(b);
        if (result)
            return result;

        // Fallback to comparing titles.
        return a.displayName().extendedLocaleCompare(b.displayName());
    }

    _insertDataGridNode(dataGridNode, parentDataGridNode)
    {
        console.assert(dataGridNode);
        console.assert(!dataGridNode.parent);

        if (!parentDataGridNode)
            parentDataGridNode = this._dataGrid;

        parentDataGridNode.insertChild(dataGridNode, insertionIndexForObjectInListSortedByFunction(dataGridNode, parentDataGridNode.children, this._compareDataGridNodesByStartTime));
    }

    _addResourceToDataGridIfNeeded(resource)
    {
        console.assert(resource);
        if (!resource)
            return null;

        // FIXME: replace with this._dataGrid.findDataGridNode(resource) once <https://webkit.org/b/155305> is fixed.
        let dataGridNode = this._resourceDataGridNodeMap.get(resource);
        if (!dataGridNode) {
            let resourceTimelineRecord = this._networkTimeline ? this._networkTimeline.recordForResource(resource) : null;
            if (!resourceTimelineRecord)
                resourceTimelineRecord = new WI.ResourceTimelineRecord(resource);

            dataGridNode = new WI.ResourceTimelineDataGridNode(resourceTimelineRecord, {
                graphDataSource: this,
                includesGraph: true,
            });
            this._resourceDataGridNodeMap.set(resource, dataGridNode);
        }

        if (!dataGridNode.parent) {
            let parentFrame = resource.parentFrame;
            if (!parentFrame)
                return null;

            let expandedByDefault = false;
            if (parentFrame.mainResource === resource || parentFrame.provisionalMainResource === resource) {
                parentFrame = parentFrame.parentFrame;
                expandedByDefault = !parentFrame; // Main frame expands by default.
            }

            if (expandedByDefault)
                dataGridNode.expand();

            let parentDataGridNode = null;
            if (parentFrame) {
                // Find the parent main resource, adding it if needed, to append this resource as a child.
                let parentResource = parentFrame.provisionalMainResource || parentFrame.mainResource;

                parentDataGridNode = this._addResourceToDataGridIfNeeded(parentResource);
                console.assert(parentDataGridNode);
                if (!parentDataGridNode)
                    return null;
            }

            this._insertDataGridNode(dataGridNode, parentDataGridNode);
        }

        dataGridNode.refresh();
        return dataGridNode;
    }

    _addSourceCodeTimeline(sourceCodeTimeline)
    {
        let dataGridNode = this._resourceDataGridNodeMap.get(sourceCodeTimeline);
        if (!dataGridNode) {
            dataGridNode = new WI.SourceCodeTimelineTimelineDataGridNode(sourceCodeTimeline, {
                graphDataSource: this,
            });
            this._resourceDataGridNodeMap.set(sourceCodeTimeline, dataGridNode);
        }

        if (!dataGridNode.parent) {
            let parentDataGridNode = sourceCodeTimeline.sourceCodeLocation ? this._addResourceToDataGridIfNeeded(sourceCodeTimeline.sourceCode) : null;
            this._insertDataGridNode(dataGridNode, parentDataGridNode);
        }
    }

    _processPendingRepresentedObjects()
    {
        if (!this._pendingRepresentedObjects.length)
            return;

        for (var representedObject of this._pendingRepresentedObjects) {
            if (this._shouldGroupBySourceCode) {
                if (representedObject instanceof WI.Resource)
                    this._addResourceToDataGridIfNeeded(representedObject);
                else if (representedObject instanceof WI.SourceCodeTimeline)
                    this._addSourceCodeTimeline(representedObject);
                else
                    console.error("Unknown represented object", representedObject);
            } else {
                const options = {
                    graphDataSource: this,
                    shouldShowPopover: true,
                };

                let dataGridNode = null;
                if (representedObject instanceof WI.ResourceTimelineRecord)
                    dataGridNode = new WI.ResourceTimelineDataGridNode(representedObject, options);
                else if (representedObject instanceof WI.LayoutTimelineRecord)
                    dataGridNode = new WI.LayoutTimelineDataGridNode(representedObject, options);
                else if (representedObject instanceof WI.MediaTimelineRecord)
                    dataGridNode = new WI.MediaTimelineDataGridNode(representedObject, options);
                else if (representedObject instanceof WI.ScriptTimelineRecord)
                    dataGridNode = new WI.ScriptTimelineDataGridNode(representedObject, options);
                else if (representedObject instanceof WI.HeapAllocationsTimelineRecord)
                    dataGridNode = new WI.HeapAllocationsTimelineDataGridNode(representedObject, options);

                console.assert(dataGridNode, representedObject);
                if (!dataGridNode)
                    continue;

                let comparator = (a, b) => {
                    return a.record.startTime - b.record.startTime;
                };

                this._dataGrid.insertChild(dataGridNode, insertionIndexForObjectInListSortedByFunction(dataGridNode, this._dataGrid.children, comparator));
            }
        }

        this._pendingRepresentedObjects = [];
    }

    _handleGroupBySourceCodeSettingChanged(event)
    {
        let groupBySourceCode = this._shouldGroupBySourceCode;
        this._dataGrid.disclosureColumnIdentifier = groupBySourceCode ? "name" : undefined;
        this._dataGrid.setColumnVisible("source", !groupBySourceCode);
        if (this._groupBySourceCodeNavigationItem)
            this._groupBySourceCodeNavigationItem.checked = groupBySourceCode;

        this._loadExistingRecords();
    }

    _handleGroupBySourceCodeNavigationItemCheckedDidChange(event)
    {
        WI.settings.timelineOverviewGroupBySourceCode.value = !WI.settings.timelineOverviewGroupBySourceCode.value;
    }

    _handleTimelineRecordAdded(event)
    {
        let {record} = event.data;

        if (this._shouldGroupBySourceCode) {
            if (event.target.type !== WI.TimelineRecord.Type.Network)
                return;

            console.assert(record instanceof WI.ResourceTimelineRecord);

            this._pendingRepresentedObjects.push(record.resource);
        } else
            this._pendingRepresentedObjects.push(record);

        this.needsLayout();
    }

    _sourceCodeTimelineAdded(event)
    {
        if (!this._shouldGroupBySourceCode)
            return;

        var sourceCodeTimeline = event.data.sourceCodeTimeline;
        console.assert(sourceCodeTimeline);
        if (!sourceCodeTimeline)
            return;

        this._pendingRepresentedObjects.push(sourceCodeTimeline);

        this.needsLayout();
    }

    _markerAdded(event)
    {
        this._timelineRuler.addMarker(event.data.marker);
    }

    _recordingReset(event)
    {
        this._timelineRuler.clearMarkers();
        this._timelineRuler.addMarker(this._currentTimeMarker);
    }
};

WI.OverviewTimelineView.ReferencePage = WI.ReferencePage.TimelinesTab.EventsView;
