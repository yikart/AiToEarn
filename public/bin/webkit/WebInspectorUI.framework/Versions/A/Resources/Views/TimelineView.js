/*
 * Copyright (C) 2013, 2015 Apple Inc. All rights reserved.
 * Copyright (C) 2015 University of Washington.
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

WI.TimelineView = class TimelineView extends WI.ContentView
{
    constructor(representedObject)
    {
        super(representedObject);

        // This class should not be instantiated directly. Create a concrete subclass instead.
        console.assert(this.constructor !== WI.TimelineView && this instanceof WI.TimelineView);
        console.assert(this.constructor.ReferencePage, this);

        this.element.classList.add("timeline-view");

        this._zeroTime = 0;
        this._startTime = 0;
        this._endTime = 5;
        this._currentTime = 0;
    }

    // Public

    get scrollableElements()
    {
        if (!this._timelineDataGrid)
            return [];
        return [this._timelineDataGrid.scrollContainer];
    }

    get showsLiveRecordingData()
    {
        // Implemented by sub-classes if needed.
        return true;
    }

    get showsImportedRecordingMessage()
    {
        // Implemented by sub-classes if needed.
        return false;
    }

    get showsFilterBar()
    {
        // Implemented by sub-classes if needed.
        return true;
    }

    get navigationItems()
    {
        return this._scopeBar ? [this._scopeBar] : [];
    }

    get selectionPathComponents()
    {
        // Implemented by sub-classes if needed.
        return null;
    }

    get zeroTime()
    {
        return this._zeroTime;
    }

    set zeroTime(x)
    {
        x = x || 0;

        if (this._zeroTime === x)
            return;

        this._zeroTime = x;

        this._timesDidChange();
    }

    get startTime()
    {
        return this._startTime;
    }

    set startTime(x)
    {
        x = x || 0;

        if (this._startTime === x)
            return;

        this._startTime = x;

        this._timesDidChange();
        this._scheduleFilterDidChange();
    }

    get endTime()
    {
        return this._endTime;
    }

    set endTime(x)
    {
        x = x || 0;

        if (this._endTime === x)
            return;

        this._endTime = x;

        this._timesDidChange();
        this._scheduleFilterDidChange();
    }

    get currentTime()
    {
        return this._currentTime;
    }

    set currentTime(x)
    {
        x = x || 0;

        if (this._currentTime === x)
            return;

        let oldCurrentTime = this._currentTime;

        this._currentTime = x;

        function checkIfLayoutIsNeeded(currentTime)
        {
            // Include some wiggle room since the current time markers can be clipped off the ends a bit and still partially visible.
            const wiggleTime = 0.05; // 50ms
            return this._startTime - wiggleTime <= currentTime && currentTime <= this._endTime + wiggleTime;
        }

        if (checkIfLayoutIsNeeded.call(this, oldCurrentTime) || checkIfLayoutIsNeeded.call(this, this._currentTime))
            this._timesDidChange();
    }

    get filterStartTime()
    {
        // Implemented by sub-classes if needed.
        return this.startTime;
    }

    get filterEndTime()
    {
        // Implemented by sub-classes if needed.
        return this.endTime;
    }

    setupDataGrid(dataGrid)
    {
        if (this._timelineDataGrid) {
            this._timelineDataGrid.filterDelegate = null;
            this._timelineDataGrid.removeEventListener(WI.DataGrid.Event.SelectedNodeChanged, this._timelineDataGridSelectedNodeChanged, this);
            this._timelineDataGrid.removeEventListener(WI.DataGrid.Event.NodeWasFiltered, this._timelineDataGridNodeWasFiltered, this);
            this._timelineDataGrid.removeEventListener(WI.DataGrid.Event.FilterDidChange, this.filterDidChange, this);
        }

        this._timelineDataGrid = dataGrid;
        this._timelineDataGrid.filterDelegate = this;
        this._timelineDataGrid.addEventListener(WI.DataGrid.Event.SelectedNodeChanged, this._timelineDataGridSelectedNodeChanged, this);
        this._timelineDataGrid.addEventListener(WI.DataGrid.Event.NodeWasFiltered, this._timelineDataGridNodeWasFiltered, this);
        this._timelineDataGrid.addEventListener(WI.DataGrid.Event.FilterDidChange, this.filterDidChange, this);
    }

    selectRecord(record)
    {
        if (!this._timelineDataGrid)
            return;

        let selectedDataGridNode = this._timelineDataGrid.selectedNode;
        if (!record) {
            if (selectedDataGridNode)
                selectedDataGridNode.deselect();
            return;
        }

        let dataGridNode = this._timelineDataGrid.findNode((node) => node.record === record);
        console.assert(dataGridNode, "Timeline view has no grid node for record selected in timeline overview.", this, record);
        if (!dataGridNode || dataGridNode.selected)
            return;

        // Don't select the record's grid node if one of it's children is already selected.
        if (selectedDataGridNode && selectedDataGridNode.hasAncestor(dataGridNode))
            return;

        dataGridNode.revealAndSelect();
    }

    reset()
    {
        // Implemented by sub-classes if needed.
    }

    updateFilter(filters)
    {
        if (!this._timelineDataGrid)
            return;

        this._timelineDataGrid.filterText = filters ? filters.text : "";
    }

    matchDataGridNodeAgainstCustomFilters(node)
    {
        // Implemented by sub-classes if needed.
        return true;
    }

    // DataGrid filter delegate

    dataGridMatchNodeAgainstCustomFilters(node)
    {
        console.assert(node);
        if (!this.matchDataGridNodeAgainstCustomFilters(node))
            return false;

        let startTime = this.filterStartTime;
        let endTime = this.filterEndTime;
        let currentTime = this.currentTime;

        function checkTimeBounds(itemStartTime, itemEndTime)
        {
            itemStartTime = itemStartTime || currentTime;
            itemEndTime = itemEndTime || currentTime;

            return startTime <= itemEndTime && itemStartTime <= endTime;
        }

        if (node instanceof WI.ResourceTimelineDataGridNode) {
            let resource = node.resource;
            return checkTimeBounds(resource.requestSentTimestamp, resource.finishedOrFailedTimestamp);
        }

        if (node instanceof WI.SourceCodeTimelineTimelineDataGridNode) {
            let sourceCodeTimeline = node.sourceCodeTimeline;

            // Do a quick check of the timeline bounds before we check each record.
            if (!checkTimeBounds(sourceCodeTimeline.startTime, sourceCodeTimeline.endTime))
                return false;

            for (let record of sourceCodeTimeline.records) {
                if (checkTimeBounds(record.startTime, record.endTime))
                    return true;
            }

            return false;
        }

        if (node instanceof WI.ProfileNodeDataGridNode) {
            let profileNode = node.profileNode;
            if (checkTimeBounds(profileNode.startTime, profileNode.endTime))
                return true;

            return false;
        }

        if (node instanceof WI.TimelineDataGridNode) {
            let record = node.record;
            return checkTimeBounds(record.startTime, record.endTime);
        }

        if (node instanceof WI.ProfileDataGridNode)
            return node.callingContextTreeNode.hasStackTraceInTimeRange(startTime, endTime);

        console.error("Unknown DataGridNode, can't filter by time.");
        return true;
    }

    // Protected

    initialLayout()
    {
        super.initialLayout();

        this.element.appendChild(this.constructor.ReferencePage.createLinkElement());
    }

    filterDidChange()
    {
        // Implemented by sub-classes if needed.
    }

    // Private

    _timelineDataGridSelectedNodeChanged(event)
    {
        this.dispatchEventToListeners(WI.ContentView.Event.SelectionPathComponentsDidChange);
    }

    _timelineDataGridNodeWasFiltered(event)
    {
        let node = event.data.node;
        if (!(node instanceof WI.TimelineDataGridNode))
            return;

        this.dispatchEventToListeners(WI.TimelineView.Event.RecordWasFiltered, {record: node.record, filtered: node.hidden});
    }

    _timesDidChange()
    {
        if (!WI.timelineManager.isCapturing() || this.showsLiveRecordingData)
            this.needsLayout();
    }

    _scheduleFilterDidChange()
    {
        if (!this._timelineDataGrid || this._updateFilterTimeout)
            return;

        this._updateFilterTimeout = setTimeout(() => {
            this._updateFilterTimeout = undefined;
            this._timelineDataGrid.filterDidChange();
        }, 0);
    }
};

WI.TimelineView.Event = {
    RecordWasFiltered: "timeline-view-record-was-filtered",
    RecordWasSelected: "timeline-view-record-was-selected",
    ScannerShow: "timeline-view-scanner-show",
    ScannerHide: "timeline-view-scanner-hide",
    NeedsEntireSelectedRange: "timeline-view-needs-entire-selected-range",
    NeedsFiltersCleared: "timeline-view-needs-filters-cleared",
};
