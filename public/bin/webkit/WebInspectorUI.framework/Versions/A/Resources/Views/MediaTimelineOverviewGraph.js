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

WI.MediaTimelineOverviewGraph = class MediaTimelineOverviewGraph extends WI.TimelineOverviewGraph
{
    constructor(timeline, timelineOverview)
    {
        console.assert(timeline instanceof WI.Timeline);
        console.assert(timeline.type === WI.TimelineRecord.Type.Media);

        super(timelineOverview);

        this.element.classList.add("media");

        this.reset();

        for (let record of timeline.records)
            this._processRecord(record);

        timeline.addEventListener(WI.Timeline.Event.RecordAdded, this._handleRecordAdded, this);
        timeline.addEventListener(WI.Timeline.Event.TimesUpdated, this._handleTimesUpdated, this);
    }

    // Static

    static get maximumRowCount() {
        return 6;
    }

    // Public

    reset()
    {
        super.reset();

        this._recordsWithoutStartTime = new Set;

        this.element.removeChildren();

        this._nextDumpRow = 0;
        this._timelineRecordGridRows = [];

        for (let i = 0; i < MediaTimelineOverviewGraph.maximumRowCount; ++i) {
            let rowElement = this.element.appendChild(document.createElement("div"));
            rowElement.className = "graph-row";

            this._timelineRecordGridRows.push({
                records: [],
                recordBars: [],
                element: rowElement,
            });
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

        let createBar = (element, recordBars, records, renderMode) => {
            let timelineRecordBar = recordBars[recordBarIndex];
            if (!timelineRecordBar)
                timelineRecordBar = recordBars[recordBarIndex] = new WI.TimelineRecordBar(this, records, renderMode);
            else {
                timelineRecordBar.renderMode = renderMode;
                timelineRecordBar.records = records;
            }
            timelineRecordBar.refresh(this);
            if (!timelineRecordBar.element.parentNode)
                element.appendChild(timelineRecordBar.element);
            ++recordBarIndex;
        };

        for (let {records, recordBars, element} of this._timelineRecordGridRows) {
            recordBarIndex = 0;

            WI.TimelineRecordBar.createCombinedBars(records, secondsPerPixel, this, createBar.bind(this, element, recordBars));

            // Remove the remaining unused `WI.TimelineRecordBar`.
            for (; recordBarIndex < recordBars.length; ++recordBarIndex) {
                recordBars[recordBarIndex].records = null;
                recordBars[recordBarIndex].element.remove();
            }
        }
    }

    updateSelectedRecord()
    {
        super.updateSelectedRecord();

        for (let {recordBars} of this._timelineRecordGridRows) {
            for (let recordBar of recordBars) {
                if (recordBar.records.includes(this.selectedRecord)) {
                    this.selectedRecordBar = recordBar;
                    return;
                }
            }
        }

        this.selectedRecordBar = null;
    }

    // Private

    _processRecord(record)
    {
        console.assert(record instanceof WI.MediaTimelineRecord);

        if (isNaN(record.startTime)) {
            this._recordsWithoutStartTime.add(record);
            record.singleFireEventListener(WI.TimelineRecord.Event.Updated, function(event) {
                this._processRecord(record);

                this.needsLayout();
            }, this);
            return;
        }

        this._recordsWithoutStartTime.delete(record);

        function compareByStartTime(a, b) {
            return a.startTime - b.startTime;
        }

        let minimumBarPaddingTime = WI.TimelineOverview.MinimumDurationPerPixel * (WI.TimelineRecordBar.MinimumWidthPixels + WI.TimelineRecordBar.MinimumMarginPixels);

        // Try to find a row that has room and does not overlap a previous record.
        for (let i = 0; i < this._timelineRecordGridRows.length; ++i) {
            let records = this._timelineRecordGridRows[i].records;
            let lastRecord = records.lastValue;
            if (!lastRecord || lastRecord.endTime + minimumBarPaddingTime <= record.startTime) {
                insertObjectIntoSortedArray(record, records, compareByStartTime);
                this._nextDumpRow = i + 1;
                return;
            }
        }

        // Try to find a row that does not overlap a previous record's active time, but it can overlap the inactive time.
        for (let i = 0; i < this._timelineRecordGridRows.length; ++i) {
            let records = this._timelineRecordGridRows[i].records;
            let lastRecord = records.lastValue;
            console.assert(lastRecord);
            if (lastRecord.usesActiveStartTime && lastRecord.activeStartTime + minimumBarPaddingTime <= record.startTime) {
                insertObjectIntoSortedArray(record, records, compareByStartTime);
                this._nextDumpRow = i + 1;
                break;
            }
        }

        // We didn't find a empty spot, so dump into the designated dump row.
        if (this._nextDumpRow >= MediaTimelineOverviewGraph.maximumRowCount)
            this._nextDumpRow = 0;
        insertObjectIntoSortedArray(record, this._timelineRecordGridRows[this._nextDumpRow++].records, compareByStartTime);
    }

    _handleRecordAdded(event)
    {
        this._processRecord(event.data.record);

        this.needsLayout();
    }

    _handleTimesUpdated(event)
    {
        this.needsLayout();
    }
};
