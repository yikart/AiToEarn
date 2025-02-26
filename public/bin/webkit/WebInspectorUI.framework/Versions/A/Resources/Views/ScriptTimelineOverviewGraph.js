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

WI.ScriptTimelineOverviewGraph = class ScriptTimelineOverviewGraph extends WI.TimelineOverviewGraph
{
    constructor(timeline, timelineOverview)
    {
        super(timelineOverview);

        this.element.classList.add("script");

        this._scriptTimeline = timeline;
        this._scriptTimeline.addEventListener(WI.Timeline.Event.RecordAdded, this._scriptTimelineRecordAdded, this);

        this._timelineRecordBars = [];

        this.reset();
    }

    // Public

    reset()
    {
        super.reset();

        this.element.removeChildren();
    }

    // Protected

    layout()
    {
        super.layout();

        if (this.hidden)
            return;

        let secondsPerPixel = this.timelineOverview.secondsPerPixel;
        let recordBarIndex = 0;

        function createBar(records, renderMode)
        {
            let timelineRecordBar = this._timelineRecordBars[recordBarIndex];
            if (!timelineRecordBar)
                timelineRecordBar = this._timelineRecordBars[recordBarIndex] = new WI.TimelineRecordBar(this, records, renderMode);
            else {
                timelineRecordBar.renderMode = renderMode;
                timelineRecordBar.records = records;
            }
            timelineRecordBar.refresh(this);
            if (!timelineRecordBar.element.parentNode)
                this.element.appendChild(timelineRecordBar.element);
            ++recordBarIndex;
        }

        // Create bars for non-GC records and GC records.
        let [gcRecords, nonGCRecords] = this._scriptTimeline.records.partition((x) => x.isGarbageCollection());
        let boundCreateBar = createBar.bind(this);
        WI.TimelineRecordBar.createCombinedBars(nonGCRecords, secondsPerPixel, this, boundCreateBar);
        WI.TimelineRecordBar.createCombinedBars(gcRecords, secondsPerPixel, this, boundCreateBar);

        // Remove the remaining unused TimelineRecordBars.
        for (; recordBarIndex < this._timelineRecordBars.length; ++recordBarIndex) {
            this._timelineRecordBars[recordBarIndex].records = null;
            this._timelineRecordBars[recordBarIndex].element.remove();
        }
    }

    updateSelectedRecord()
    {
        super.updateSelectedRecord();

        for (let recordBar of this._timelineRecordBars) {
            if (recordBar.records.includes(this.selectedRecord)) {
                this.selectedRecordBar = recordBar;
                return;
            }
        }

        this.selectedRecordBar = null;
    }

    // Private

    _scriptTimelineRecordAdded(event)
    {
        this.needsLayout();
    }
};
