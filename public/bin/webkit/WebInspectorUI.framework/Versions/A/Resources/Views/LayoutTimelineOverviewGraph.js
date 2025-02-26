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

WI.LayoutTimelineOverviewGraph = class LayoutTimelineOverviewGraph extends WI.TimelineOverviewGraph
{
    constructor(timeline, timelineOverview)
    {
        super(timelineOverview);

        this.element.classList.add("layout-overview");

        this._layoutTimeline = timeline;
        this._layoutTimeline.addEventListener(WI.Timeline.Event.RecordAdded, this._layoutTimelineRecordAdded, this);

        this.reset();

        for (let record of this._layoutTimeline.records)
            this._processRecord(record);
    }

    // Public

    reset()
    {
        super.reset();

        function createRecordRow()
        {
            var element = document.createElement("div");
            element.className = "graph-row";
            this.element.appendChild(element);
            return {element, recordBars: [], records: []};
        }

        this.element.removeChildren();

        this._timelineLayoutRecordRow = createRecordRow.call(this);
        this._timelinePaintRecordRow = createRecordRow.call(this);
    }

    // Protected

    layout()
    {
        super.layout();

        if (this.hidden)
            return;

        this._updateRowLayout(this._timelinePaintRecordRow);
        this._updateRowLayout(this._timelineLayoutRecordRow);
    }

    updateSelectedRecord()
    {
        super.updateSelectedRecord();

        for (let recordRow of [this._timelineLayoutRecordRow, this._timelinePaintRecordRow]) {
            for (let recordBar of recordRow.recordBars) {
                if (recordBar.records.includes(this.selectedRecord)) {
                    this.selectedRecordBar = recordBar;
                    return;
                }
            }
        }

        this.selectedRecordBar = null;
    }

    // Private

    _updateRowLayout(row)
    {
        var secondsPerPixel = this.timelineOverview.secondsPerPixel;
        var recordBarIndex = 0;

        function createBar(records, renderMode)
        {
            var timelineRecordBar = row.recordBars[recordBarIndex];
            if (!timelineRecordBar)
                timelineRecordBar = row.recordBars[recordBarIndex] = new WI.TimelineRecordBar(this, records, renderMode);
            else {
                timelineRecordBar.renderMode = renderMode;
                timelineRecordBar.records = records;
            }

            timelineRecordBar.refresh(this);
            if (!timelineRecordBar.element.parentNode)
                row.element.appendChild(timelineRecordBar.element);
            ++recordBarIndex;
        }

        WI.TimelineRecordBar.createCombinedBars(row.records, secondsPerPixel, this, createBar.bind(this));

        // Remove the remaining unused TimelineRecordBars.
        for (; recordBarIndex < row.recordBars.length; ++recordBarIndex) {
            row.recordBars[recordBarIndex].records = null;
            row.recordBars[recordBarIndex].element.remove();
        }
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
        if (layoutTimelineRecord.eventType === WI.LayoutTimelineRecord.EventType.Paint || layoutTimelineRecord.eventType === WI.LayoutTimelineRecord.EventType.Composite)
            this._timelinePaintRecordRow.records.push(layoutTimelineRecord);
        else
            this._timelineLayoutRecordRow.records.push(layoutTimelineRecord);
    }
};
