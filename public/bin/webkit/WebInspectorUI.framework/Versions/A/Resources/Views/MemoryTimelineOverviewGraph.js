/*
 * Copyright (C) 2016 Apple Inc. All rights reserved.
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

WI.MemoryTimelineOverviewGraph = class MemoryTimelineOverviewGraph extends WI.TimelineOverviewGraph
{
    constructor(timeline, timelineOverview)
    {
        console.assert(timeline instanceof WI.MemoryTimeline);

        super(timelineOverview);

        this.element.classList.add("memory");

        this._memoryTimeline = timeline;
        this._memoryTimeline.addEventListener(WI.Timeline.Event.RecordAdded, this._memoryTimelineRecordAdded, this);
        this._memoryTimeline.addEventListener(WI.MemoryTimeline.Event.MemoryPressureEventAdded, this._memoryTimelineMemoryPressureEventAdded, this);

        this._didInitializeCategories = false;

        this._chart = new WI.StackedAreaChart;
        this._chart.size = new WI.Size(0, this.height);
        this.addSubview(this._chart);
        this.element.appendChild(this._chart.element);

        this._legendElement = this.element.appendChild(document.createElement("div"));
        this._legendElement.classList.add("legend");

        this._memoryPressureMarkersContainerElement = this.element.appendChild(document.createElement("div"));
        this._memoryPressureMarkersContainerElement.classList.add("memory-pressure-markers-container");
        this._memoryPressureMarkerElements = [];

        this.reset();

        for (let record of this._memoryTimeline.records)
            this._processRecord(record);
    }

    // Protected

    get height()
    {
        return 108;
    }

    reset()
    {
        super.reset();

        this._maxSize = 0;
        this._cachedMaxSize = undefined;

        this._updateLegend();
        this._chart.clear();
        this._chart.needsLayout();

        this._memoryPressureMarkersContainerElement.removeChildren();
        this._memoryPressureMarkerElements = [];
    }

    layout()
    {
        super.layout();

        if (this.hidden)
            return;

        this._updateLegend();
        this._chart.clear();

        if (!this._didInitializeCategories)
            return;

        let graphWidth = this.timelineOverview.scrollContainerWidth;
        if (isNaN(graphWidth))
            return;

        if (this._chart.size.width !== graphWidth || this._chart.size.height !== this.height)
            this._chart.size = new WI.Size(graphWidth, this.height);

        let graphStartTime = this.startTime;
        let visibleEndTime = Math.min(this.endTime, this.currentTime);

        let secondsPerPixel = this.timelineOverview.secondsPerPixel;
        let maxCapacity = this._maxSize * 1.05; // Add 5% for padding.

        function xScale(time) {
            return (time - graphStartTime) / secondsPerPixel;
        }

        let height = this.height;
        function yScale(size) {
            return height - ((size / maxCapacity) * height);
        }

        let visibleMemoryPressureEventMarkers = this._visibleMemoryPressureEvents(graphStartTime, visibleEndTime);

        // Reuse existing marker elements.
        for (let i = 0; i < visibleMemoryPressureEventMarkers.length; ++i) {
            let markerElement = this._memoryPressureMarkerElements[i];
            if (!markerElement) {
                markerElement = this._memoryPressureMarkersContainerElement.appendChild(document.createElement("div"));
                markerElement.classList.add("memory-pressure-event");
                this._memoryPressureMarkerElements[i] = markerElement;
            }

            let memoryPressureEvent = visibleMemoryPressureEventMarkers[i];
            let property = WI.resolvedLayoutDirection() === WI.LayoutDirection.RTL ? "right" : "left";
            markerElement.style.setProperty(property, `${xScale(memoryPressureEvent.timestamp)}px`);
        }

        // Remove excess marker elements.
        let excess = this._memoryPressureMarkerElements.length - visibleMemoryPressureEventMarkers.length;
        if (excess) {
            let elementsToRemove = this._memoryPressureMarkerElements.splice(visibleMemoryPressureEventMarkers.length);
            for (let element of elementsToRemove)
                element.remove();
        }

        let discontinuities = this.timelineOverview.discontinuitiesInTimeRange(graphStartTime, visibleEndTime);

        let visibleRecords = this._memoryTimeline.recordsInTimeRange(graphStartTime, visibleEndTime, {
            includeRecordBeforeStart: !discontinuities.length || discontinuities[0].startTime > graphStartTime,
            includeRecordAfterEnd: true,
        });
        if (!visibleRecords.length)
            return;

        function pointSetForRecord(record) {
            let size = 0;
            let ys = [];
            for (let i = 0; i < record.categories.length; ++i) {
                size += record.categories[i].size;
                ys[i] = yScale(size);
            }
            return ys;
        }

        // Extend the first record to the start so it doesn't look like we originate at zero size.
        if (visibleRecords[0] === this._memoryTimeline.records[0] && (!discontinuities.length || discontinuities[0].startTime > visibleRecords[0].startTime))
            this._chart.addPointSet(0, pointSetForRecord(visibleRecords[0]));

        function insertDiscontinuity(previousRecord, startDiscontinuity, endDiscontinuity, nextRecord)
        {
            console.assert(previousRecord || nextRecord);
            if (!(previousRecord || nextRecord))
                return;

            let xStart = xScale(previousRecord ? previousRecord.endTime : startDiscontinuity.startTime);
            let xEnd = xScale(endDiscontinuity.endTime);

            // Extend the previous record to the start of the discontinuity.
            if (previousRecord)
                this._chart.addPointSet(xStart, pointSetForRecord(previousRecord));

            let zeroValues = Array((previousRecord || nextRecord).categories.length).fill(yScale(0));
            this._chart.addPointSet(xStart, zeroValues);

            if (nextRecord) {
                this._chart.addPointSet(xEnd, zeroValues);
                this._chart.addPointSet(xEnd, pointSetForRecord(nextRecord));
            } else {
                // Extend the discontinuity to the visible end time to prevent
                // drawing artifacts when the next record arrives.
                this._chart.addPointSet(xScale(visibleEndTime), zeroValues);
            }
        }

        // Points for visible records.
        let previousRecord = null;
        for (let record of visibleRecords) {
            if (discontinuities.length && discontinuities[0].endTime <= record.startTime) {
                let startDiscontinuity = discontinuities.shift();
                let endDiscontinuity = startDiscontinuity;
                while (discontinuities.length && discontinuities[0].endTime <= record.startTime)
                    endDiscontinuity = discontinuities.shift();
                insertDiscontinuity.call(this, previousRecord, startDiscontinuity, endDiscontinuity, record);
            }

            let x = xScale(record.startTime);
            this._chart.addPointSet(x, pointSetForRecord(record));

            previousRecord = record;
        }

        if (discontinuities.length)
            insertDiscontinuity.call(this, previousRecord, discontinuities[0], discontinuities[0], null);
        else {
            // Extend the last value to current / end time.
            let lastRecord = visibleRecords.lastValue;
            if (lastRecord.startTime <= visibleEndTime) {
                let x = Math.floor(xScale(lastRecord.endTime));
                this._chart.addPointSet(x, pointSetForRecord(lastRecord));
            }
        }
    }

    // Private

    _updateLegend()
    {
        if (this._cachedMaxSize === this._maxSize)
            return;

        this._cachedMaxSize = this._maxSize;

        if (!this._maxSize) {
            this._legendElement.hidden = true;
            this._legendElement.textContent = "";
        } else {
            this._legendElement.hidden = false;
            this._legendElement.textContent = WI.UIString("Maximum Size: %s").format(Number.bytesToString(this._maxSize));
        }
    }

    _visibleMemoryPressureEvents(startTime, endTime)
    {
        let events = this._memoryTimeline.memoryPressureEvents;
        if (!events.length)
            return [];

        let lowerIndex = events.lowerBound(startTime, (time, event) => time - event.timestamp);
        let upperIndex = events.upperBound(endTime, (time, event) => time - event.timestamp);
        return events.slice(lowerIndex, upperIndex);
    }

    _memoryTimelineRecordAdded(event)
    {
        let memoryTimelineRecord = event.data.record;
        console.assert(memoryTimelineRecord instanceof WI.MemoryTimelineRecord);

        this._processRecord(memoryTimelineRecord);

        this.needsLayout();
    }

    _processRecord(memoryTimelineRecord)
    {
        this._maxSize = Math.max(this._maxSize, memoryTimelineRecord.totalSize);

        if (!this._didInitializeCategories) {
            this._didInitializeCategories = true;
            let types = [];
            for (let category of memoryTimelineRecord.categories)
                types.push(category.type);
            this._chart.initializeSections(types);
        }
    }

    _memoryTimelineMemoryPressureEventAdded(event)
    {
        this.needsLayout();
    }
};
