/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

WI.CPUTimelineOverviewGraph = class CPUTimelineOverviewGraph extends WI.TimelineOverviewGraph
{
    constructor(timeline, timelineOverview)
    {
        console.assert(timeline instanceof WI.Timeline);
        console.assert(timeline.type === WI.TimelineRecord.Type.CPU, timeline);

        super(timelineOverview);

        this.element.classList.add("cpu");

        this._cpuTimeline = timeline;
        this._cpuTimeline.addEventListener(WI.Timeline.Event.RecordAdded, this._cpuTimelineRecordAdded, this);

        let size = new WI.Size(0, this.height);
        this._chart = new WI.StackedColumnChart(size);
        this._chart.initializeSections(["main-thread-usage", "worker-thread-usage", "total-usage"]);
        this.addSubview(this._chart);
        this.element.appendChild(this._chart.element);

        this._chart.element.addEventListener("click", this._handleChartClick.bind(this));

        this._legendElement = this.element.appendChild(document.createElement("div"));
        this._legendElement.classList.add("legend");

        this._lastSelectedRecordInLayout = null;

        this.reset();

        for (let record of this._cpuTimeline.records)
            this._processRecord(record);
    }

    // Protected

    get height()
    {
        return 60;
    }

    reset()
    {
        super.reset();

        this._maxUsage = 0;
        this._cachedMaxUsage = undefined;
        this._lastSelectedRecordInLayout = null;

        this._updateLegend();
        this._chart.clear();
        this._chart.needsLayout();
    }

    layout()
    {
        super.layout();

        if (this.hidden)
            return;

        this._updateLegend();
        this._chart.clear();

        let graphWidth = this.timelineOverview.scrollContainerWidth;
        if (isNaN(graphWidth))
            return;

        this._lastSelectedRecordInLayout = this.selectedRecord;

        if (this._chart.size.width !== graphWidth || this._chart.size.height !== this.height)
            this._chart.size = new WI.Size(graphWidth, this.height);

        let graphStartTime = this.startTime;
        let visibleEndTime = Math.min(this.endTime, this.currentTime);
        let secondsPerPixel = this.timelineOverview.secondsPerPixel;
        let maxCapacity = Math.max(20, this._maxUsage * 1.05); // Add 5% for padding.

        function xScale(time) {
            return (time - graphStartTime) / secondsPerPixel;
        }

        let height = this.height;
        function yScale(size) {
            return (size / maxCapacity) * height;
        }

        let visibleRecords = this._cpuTimeline.recordsInTimeRange(graphStartTime, visibleEndTime, {
            includeRecordBeforeStart: true,
        });
        if (!visibleRecords.length)
            return;

        const minimumDisplayHeight = 4;

        for (let record of visibleRecords) {
            let additionalClass = record === this.selectedRecord ? "selected" : undefined;
            let w = (record.endTime - record.startTime) / secondsPerPixel;
            let x = xScale(record.startTime);
            let h1 = Math.max(minimumDisplayHeight, yScale(record.mainThreadUsage));
            let h2 = Math.max(minimumDisplayHeight, yScale(record.mainThreadUsage + record.workerThreadUsage));
            let h3 = Math.max(minimumDisplayHeight, yScale(record.usage));
            this._chart.addColumnSet(x, height, w, [h1, h2, h3], additionalClass);
        }
    }

    updateSelectedRecord()
    {
        super.updateSelectedRecord();

        if (this._lastSelectedRecordInLayout !== this.selectedRecord) {
            // Since we don't have the exact element to re-style with a selected appearance
            // we trigger another layout to re-layout the graph and provide additional
            // styles for the column for the selected record.
            this.needsLayout();
        }
    }

    // Private

    _updateLegend()
    {
        if (this._cachedMaxUsage === this._maxUsage)
            return;

        this._cachedMaxUsage = this._maxUsage;

        if (!this._maxUsage) {
            this._legendElement.hidden = true;
            this._legendElement.textContent = "";
        } else {
            this._legendElement.hidden = false;
            this._legendElement.textContent = WI.UIString("Maximum CPU Usage: %s").format(Number.percentageString(this._maxUsage / 100));
        }
    }

    _graphPositionForMouseEvent(event)
    {
        // Only trigger if clicking on a rect, not anywhere in the graph.
        let elements = document.elementsFromPoint(event.pageX, event.pageY);
        let rectElement = elements.find((x) => x.localName === "rect");
        if (!rectElement)
            return NaN;

        let chartElement = rectElement.closest(".stacked-column-chart");
        if (!chartElement)
            return NaN;

        let rect = chartElement.getBoundingClientRect();
        let position = event.pageX - rect.left;

        if (WI.resolvedLayoutDirection() === WI.LayoutDirection.RTL)
            return rect.width - position;
        return position;
    }

    _handleChartClick(event)
    {
        let position = this._graphPositionForMouseEvent(event);
        if (isNaN(position))
            return;

        let secondsPerPixel = this.timelineOverview.secondsPerPixel;
        let graphClickTime = position * secondsPerPixel;
        let graphStartTime = this.startTime;

        let clickTime = graphStartTime + graphClickTime;
        let record = this._cpuTimeline.closestRecordTo(clickTime);
        if (!record)
            return;

        // Ensure that the container "click" listener added by `WI.TimelineOverview` isn't called.
        event.__timelineRecordClickEventHandled = true;

        this.selectedRecord = record;
        this.needsLayout();
    }

    _cpuTimelineRecordAdded(event)
    {
        let cpuTimelineRecord = event.data.record;

        this._processRecord(cpuTimelineRecord);

        this.needsLayout();
    }

    _processRecord(cpuTimelineRecord)
    {
        this._maxUsage = Math.max(this._maxUsage, cpuTimelineRecord.usage);
    }
};
