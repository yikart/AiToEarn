/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
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

WI.RenderingFrameTimelineOverviewGraph = class RenderingFrameTimelineOverviewGraph extends WI.TimelineOverviewGraph
{
    constructor(timeline, timelineOverview)
    {
        super(timelineOverview);

        this.element.classList.add("rendering-frame");
        this.element.addEventListener("click", this._mouseClicked.bind(this));

        this._renderingFrameTimeline = timeline;
        this._renderingFrameTimeline.addEventListener(WI.Timeline.Event.RecordAdded, this._timelineRecordAdded, this);

        this._selectedFrameMarker = document.createElement("div");
        this._selectedFrameMarker.classList.add("frame-marker");

        this._timelineRecordFrames = [];
        this._selectedTimelineRecordFrame = null;
        this._graphHeightSeconds = NaN;
        this._framesPerSecondDividerMap = new Map;

        this.reset();
    }

    // Public

    get graphHeightSeconds()
    {
        if (!isNaN(this._graphHeightSeconds))
            return this._graphHeightSeconds;

        var maximumFrameDuration = this._renderingFrameTimeline.records.reduce(function(previousValue, currentValue) {
            return Math.max(previousValue, currentValue.duration);
        }, 0);

        this._graphHeightSeconds = maximumFrameDuration * 1.1; // Add 10% margin above frames.
        this._graphHeightSeconds = Math.min(this._graphHeightSeconds, WI.RenderingFrameTimelineOverviewGraph.MaximumGraphHeightSeconds);
        this._graphHeightSeconds = Math.max(this._graphHeightSeconds, WI.RenderingFrameTimelineOverviewGraph.MinimumGraphHeightSeconds);
        return this._graphHeightSeconds;
    }

    reset()
    {
        super.reset();

        this.element.removeChildren();

        this.selectedRecord = null;

        this._framesPerSecondDividerMap.clear();
    }

    recordWasFiltered(record, filtered)
    {
        super.recordWasFiltered(record, filtered);

        if (!(record instanceof WI.RenderingFrameTimelineRecord))
            return;

        record[WI.RenderingFrameTimelineOverviewGraph.RecordWasFilteredSymbol] = filtered;

        // Set filtered style if the frame element is within the visible range.
        const startIndex = Math.floor(this.startTime);
        const endIndex = Math.min(Math.floor(this.endTime), this._renderingFrameTimeline.records.length - 1);
        if (record.frameIndex < startIndex || record.frameIndex > endIndex)
            return;

        const frameIndex = record.frameIndex - startIndex;
        this._timelineRecordFrames[frameIndex].filtered = filtered;
    }

    // Protected

    get height()
    {
        return 108;
    }

    layout()
    {
        super.layout();

        if (this.hidden)
            return;

        if (!this._renderingFrameTimeline.records.length)
            return;

        let records = this._renderingFrameTimeline.records;
        let startIndex = Math.floor(this.startTime);
        let endIndex = Math.min(Math.floor(this.endTime), records.length - 1);
        let recordFrameIndex = 0;

        for (let i = startIndex; i <= endIndex; ++i) {
            let record = records[i];
            let timelineRecordFrame = this._timelineRecordFrames[recordFrameIndex];
            if (!timelineRecordFrame)
                timelineRecordFrame = this._timelineRecordFrames[recordFrameIndex] = new WI.TimelineRecordFrame(this, record);
            else
                timelineRecordFrame.record = record;

            timelineRecordFrame.refresh(this);
            if (!timelineRecordFrame.element.parentNode)
                this.element.appendChild(timelineRecordFrame.element);

            timelineRecordFrame.filtered = record[WI.RenderingFrameTimelineOverviewGraph.RecordWasFilteredSymbol] || false;
            ++recordFrameIndex;
        }

        // Remove the remaining unused TimelineRecordFrames.
        for (; recordFrameIndex < this._timelineRecordFrames.length; ++recordFrameIndex) {
            this._timelineRecordFrames[recordFrameIndex].record = null;
            this._timelineRecordFrames[recordFrameIndex].element.remove();
        }

        this._updateDividers();
        this._updateFrameMarker();
    }

    updateSelectedRecord()
    {
        if (!this.selectedRecord) {
            this._updateFrameMarker();
            return;
        }

        const visibleDuration = this.timelineOverview.visibleDuration;
        const frameIndex = this.selectedRecord.frameIndex;

        // Reveal a newly selected record if it's outside the visible range.
        if (frameIndex < Math.ceil(this.timelineOverview.scrollStartTime) || frameIndex >= this.timelineOverview.scrollStartTime + visibleDuration) {
            var scrollStartTime = frameIndex;
            if (!this._selectedTimelineRecordFrame || Math.abs(this._selectedTimelineRecordFrame.record.frameIndex - this.selectedRecord.frameIndex) > 1) {
                scrollStartTime -= Math.floor(visibleDuration / 2);
                scrollStartTime = Math.max(Math.min(scrollStartTime, this.timelineOverview.endTime), this.timelineOverview.startTime);
            }

            this.timelineOverview.scrollStartTime = scrollStartTime;
            return;
        }

        this._updateFrameMarker();
    }

    // Private

    _timelineRecordAdded(event)
    {
        this._graphHeightSeconds = NaN;

        this.needsLayout();
    }

    _updateDividers()
    {
        if (this.graphHeightSeconds === 0)
            return;

        let overviewGraphHeight = this.height;

        function createDividerAtPosition(framesPerSecond)
        {
            var secondsPerFrame = 1 / framesPerSecond;
            var dividerTop = 1 - secondsPerFrame / this.graphHeightSeconds;
            if (dividerTop < 0.01 || dividerTop >= 1)
                return;

            var divider = this._framesPerSecondDividerMap.get(framesPerSecond);
            if (!divider) {
                divider = document.createElement("div");
                divider.classList.add("divider");

                var label = document.createElement("div");
                label.classList.add("label");
                label.innerText = WI.UIString("%d FPS").format(framesPerSecond);
                divider.appendChild(label);

                this.element.appendChild(divider);

                this._framesPerSecondDividerMap.set(framesPerSecond, divider);
            }

            divider.style.marginTop = (dividerTop * overviewGraphHeight).toFixed(2) + "px";
        }

        createDividerAtPosition.call(this, 60);
        createDividerAtPosition.call(this, 30);
    }

    _updateFrameMarker()
    {
        if (this._selectedTimelineRecordFrame) {
            this._selectedTimelineRecordFrame.selected = false;
            this._selectedTimelineRecordFrame = null;
        }

        if (!this.selectedRecord) {
            if (this._selectedFrameMarker.parentElement)
                this.element.removeChild(this._selectedFrameMarker);
            return;
        }

        var frameWidth = 1 / this.timelineOverview.secondsPerPixel;
        this._selectedFrameMarker.style.width = frameWidth + "px";

        var markerLeftPosition = this.selectedRecord.frameIndex - this.startTime;
        let property = WI.resolvedLayoutDirection() === WI.LayoutDirection.RTL ? "right" : "left";
        this._selectedFrameMarker.style.setProperty(property, ((markerLeftPosition / this.timelineOverview.visibleDuration) * 100).toFixed(2) + "%");

        if (!this._selectedFrameMarker.parentElement)
            this.element.appendChild(this._selectedFrameMarker);

        // Find and update the selected frame element.
        var index = this._timelineRecordFrames.binaryIndexOf(this.selectedRecord, function(record, frame) {
            return frame.record ? record.frameIndex - frame.record.frameIndex : -1;
        });

        console.assert(index >= 0 && index < this._timelineRecordFrames.length, "Selected record not within visible graph duration.", this.selectedRecord);
        if (index < 0 || index >= this._timelineRecordFrames.length)
            return;

        this._selectedTimelineRecordFrame = this._timelineRecordFrames[index];
        this._selectedTimelineRecordFrame.selected = true;
    }

    _mouseClicked(event)
    {
        let position = 0;
        if (WI.resolvedLayoutDirection() === WI.LayoutDirection.RTL)
            position = this.element.totalOffsetRight - event.pageX;
        else
            position = event.pageX - this.element.totalOffsetLeft;

        var frameIndex = Math.floor(position * this.timelineOverview.secondsPerPixel + this.startTime);
        if (frameIndex < 0 || frameIndex >= this._renderingFrameTimeline.records.length)
            return;

        var newSelectedRecord = this._renderingFrameTimeline.records[frameIndex];
        if (newSelectedRecord[WI.RenderingFrameTimelineOverviewGraph.RecordWasFilteredSymbol])
            return;

        // Ensure that the container "click" listener added by `WI.TimelineOverview` isn't called.
        event.__timelineRecordClickEventHandled = true;

        if (this.selectedRecord === newSelectedRecord)
            return;

        if (frameIndex >= this.timelineOverview.selectionStartTime && frameIndex < this.timelineOverview.selectionStartTime + this.timelineOverview.selectionDuration) {
            this.selectedRecord = newSelectedRecord;
            return;
        }

        // Clicking a frame outside the current ruler selection changes the selection to include the frame.
        this.selectedRecord = newSelectedRecord;
        this.timelineOverview.selectionStartTime = frameIndex;
        this.timelineOverview.selectionDuration = 1;
    }
};

WI.RenderingFrameTimelineOverviewGraph.RecordWasFilteredSymbol = Symbol("rendering-frame-overview-graph-record-was-filtered");

WI.RenderingFrameTimelineOverviewGraph.MaximumGraphHeightSeconds = 0.037;
WI.RenderingFrameTimelineOverviewGraph.MinimumGraphHeightSeconds = 0.0185;
