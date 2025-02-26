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

WI.HeapAllocationsTimelineOverviewGraph = class HeapAllocationsTimelineOverviewGraph extends WI.TimelineOverviewGraph
{
    constructor(timeline, timelineOverview)
    {
        super(timelineOverview);

        this.element.classList.add("heap-allocations");

        this._heapAllocationsTimeline = timeline;
        this._heapAllocationsTimeline.addEventListener(WI.Timeline.Event.RecordAdded, this._heapAllocationTimelineRecordAdded, this);

        this._selectedImageElement = null;

        this.reset();
    }

    // Protected

    reset()
    {
        super.reset();

        this.element.removeChildren();
    }

    layout()
    {
        super.layout();

        if (this.hidden)
            return;

        this.element.removeChildren();

        if (this._selectedImageElement) {
            this._selectedImageElement.classList.remove("selected");
            this._selectedImageElement = null;
        }

        // This may display records past the current time marker.
        let visibleRecords = this._heapAllocationsTimeline.recordsInTimeRange(this.startTime, this.endTime);
        if (!visibleRecords.length)
            return;

        let graphStartTime = this.startTime;
        let secondsPerPixel = this.timelineOverview.secondsPerPixel;

        function xScale(time) {
            return (time - graphStartTime) / secondsPerPixel;
        }

        for (let record of visibleRecords) {
            if (isNaN(record.timestamp))
                continue;

            const halfImageWidth = 8;
            let x = xScale(record.timestamp) - halfImageWidth;
            if (x <= 1)
                x = 1;

            let imageElement = record[WI.HeapAllocationsTimelineOverviewGraph.RecordElementAssociationSymbol];
            if (!imageElement) {
                imageElement = record[WI.HeapAllocationsTimelineOverviewGraph.RecordElementAssociationSymbol] = document.createElement("img");
                imageElement.classList.add("snapshot");
                imageElement.addEventListener("click", (event) => {
                    if (record.heapSnapshot.invalid)
                        return;

                    // Ensure that the container "click" listener added by `WI.TimelineOverview` isn't called.
                    event.__timelineRecordClickEventHandled = true;

                    this.selectedRecord = record;
                });
            }

            imageElement.style.setProperty(WI.resolvedLayoutDirection() === WI.LayoutDirection.RTL ? "right" : "left", `${x}px`);

            if (record.heapSnapshot.invalid)
                imageElement.classList.add("invalid");

            this.element.appendChild(imageElement);
        }

        this._updateSnapshotMarkers();
    }

    updateSelectedRecord()
    {
        this._updateSnapshotMarkers();
    }

    // Private

    _updateSnapshotMarkers()
    {
        if (this._selectedImageElement)
            this._selectedImageElement.classList.remove("selected");

        if (!this.selectedRecord) {
            this._selectedImageElement = null;
            return;
        }

        let imageElement = this.selectedRecord[WI.HeapAllocationsTimelineOverviewGraph.RecordElementAssociationSymbol];
        if (!imageElement)
            return;

        imageElement.classList.add("selected");

        this._selectedImageElement = imageElement;
    }

    _heapAllocationTimelineRecordAdded(event)
    {
        this.needsLayout();
    }
};

WI.HeapAllocationsTimelineOverviewGraph.RecordElementAssociationSymbol = Symbol("record-element-association");
