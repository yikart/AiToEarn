
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

WI.NetworkTimelineOverviewGraph = class NetworkTimelineOverviewGraph extends WI.TimelineOverviewGraph
{
    constructor(timeline, timelineOverview)
    {
        super(timelineOverview);

        this.element.classList.add("network");

        timeline.addEventListener(WI.Timeline.Event.RecordAdded, this._networkTimelineRecordAdded, this);
        timeline.addEventListener(WI.Timeline.Event.TimesUpdated, this.needsLayout, this);

        this.reset();

        for (let record of timeline.records)
            this._processRecord(record);
    }

    // Public

    reset()
    {
        super.reset();

        this._nextDumpRow = 0;
        this._timelineRecordGridRows = [];

        for (let i = 0; i < WI.NetworkTimelineOverviewGraph.MaximumRowCount; ++i)
            this._timelineRecordGridRows.push([]);

        this.element.removeChildren();

        for (let rowRecords of this._timelineRecordGridRows) {
            rowRecords.__element = document.createElement("div");
            rowRecords.__element.classList.add("graph-row");
            this.element.appendChild(rowRecords.__element);

            rowRecords.__recordBars = [];
        }
    }

    // Protected

    layout()
    {
        super.layout();

        if (this.hidden)
            return;

        let secondsPerPixel = this.timelineOverview.secondsPerPixel;
        let recordBarIndex = 0;

        function createBar(rowElement, rowRecordBars, records, renderMode)
        {
            let timelineRecordBar = rowRecordBars[recordBarIndex];
            if (!timelineRecordBar)
                timelineRecordBar = rowRecordBars[recordBarIndex] = new WI.TimelineRecordBar(this, records, renderMode);
            else {
                timelineRecordBar.renderMode = renderMode;
                timelineRecordBar.records = records;
            }
            timelineRecordBar.refresh(this);
            if (!timelineRecordBar.element.parentNode)
                rowElement.appendChild(timelineRecordBar.element);
            ++recordBarIndex;
        }

        for (let rowRecords of this._timelineRecordGridRows) {
            let rowElement = rowRecords.__element;
            let rowRecordBars = rowRecords.__recordBars;

            recordBarIndex = 0;

            WI.TimelineRecordBar.createCombinedBars(rowRecords, secondsPerPixel, this, createBar.bind(this, rowElement, rowRecordBars));

            // Remove the remaining unused TimelineRecordBars.
            for (; recordBarIndex < rowRecordBars.length; ++recordBarIndex) {
                rowRecordBars[recordBarIndex].records = null;
                rowRecordBars[recordBarIndex].element.remove();
            }
        }
    }

    // Private

    _networkTimelineRecordAdded(event)
    {
        let resourceTimelineRecord = event.data.record;
        console.assert(resourceTimelineRecord instanceof WI.ResourceTimelineRecord);

        this._processRecord(resourceTimelineRecord);

        this.needsLayout();
    }

    _processRecord(resourceTimelineRecord)
    {
        let compareByStartTime = (a, b) => a.startTime - b.startTime;
        let minimumBarPaddingTime = WI.TimelineOverview.MinimumDurationPerPixel * (WI.TimelineRecordBar.MinimumWidthPixels + WI.TimelineRecordBar.MinimumMarginPixels);

        // Try to find a row that has room and does not overlap a previous record.
        let foundRowForRecord = false;
        for (let i = 0; i < this._timelineRecordGridRows.length; ++i) {
            let rowRecords = this._timelineRecordGridRows[i];
            let lastRecord = rowRecords.lastValue;

            if (!lastRecord || lastRecord.endTime + minimumBarPaddingTime <= resourceTimelineRecord.startTime) {
                insertObjectIntoSortedArray(resourceTimelineRecord, rowRecords, compareByStartTime);
                this._nextDumpRow = i + 1;
                foundRowForRecord = true;
                break;
            }
        }

        if (!foundRowForRecord) {
            // Try to find a row that does not overlap a previous record's active time, but it can overlap the inactive time.
            for (let i = 0; i < this._timelineRecordGridRows.length; ++i) {
                let rowRecords = this._timelineRecordGridRows[i];
                let lastRecord = rowRecords.lastValue;
                console.assert(lastRecord);

                if (lastRecord.activeStartTime + minimumBarPaddingTime <= resourceTimelineRecord.startTime) {
                    insertObjectIntoSortedArray(resourceTimelineRecord, rowRecords, compareByStartTime);
                    this._nextDumpRow = i + 1;
                    foundRowForRecord = true;
                    break;
                }
            }
        }

        // We didn't find a empty spot, so dump into the designated dump row.
        if (!foundRowForRecord) {
            if (this._nextDumpRow >= WI.NetworkTimelineOverviewGraph.MaximumRowCount)
                this._nextDumpRow = 0;
            insertObjectIntoSortedArray(resourceTimelineRecord, this._timelineRecordGridRows[this._nextDumpRow++], compareByStartTime);
        }
    }
};

WI.NetworkTimelineOverviewGraph.MaximumRowCount = 6;
