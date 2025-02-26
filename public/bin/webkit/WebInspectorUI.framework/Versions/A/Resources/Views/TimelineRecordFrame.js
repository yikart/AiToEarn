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

WI.TimelineRecordFrame = class TimelineRecordFrame extends WI.Object
{
    constructor(graphDataSource, record)
    {
        super();

        this._element = document.createElement("div");
        this._element.classList.add("timeline-record-frame");

        this._graphDataSource = graphDataSource;
        this._record = record || null;
        this._filtered = false;
    }

    // Public

    get element()
    {
        return this._element;
    }

    get record()
    {
        return this._record;
    }

    set record(record)
    {
        this._record = record;
    }

    get selected()
    {
        return this._element.classList.contains("selected");
    }

    set selected(x)
    {
        if (this.selected === x)
            return;

        this._element.classList.toggle("selected");
    }

    get filtered()
    {
        return this._filtered;
    }

    set filtered(x)
    {
        if (this._filtered === x)
            return;

        this._filtered = x;
        this._element.classList.toggle("filtered");
    }

    refresh(graphDataSource)
    {
        if (!this._record)
            return false;

        var frameIndex = this._record.frameIndex;
        var graphStartFrameIndex = Math.floor(graphDataSource.startTime);
        var graphEndFrameIndex = graphDataSource.endTime;

        // If this frame is completely before or after the bounds of the graph, return early.
        if (frameIndex < graphStartFrameIndex || frameIndex > graphEndFrameIndex)
            return false;

        this._element.style.width = (1 / graphDataSource.timelineOverview.secondsPerPixel) + "px";

        var graphDuration = graphDataSource.endTime - graphDataSource.startTime;
        let recordPosition = (frameIndex - graphDataSource.startTime) / graphDuration;

        let property = WI.resolvedLayoutDirection() === WI.LayoutDirection.RTL ? "right" : "left";
        this._updateElementPosition(this._element, recordPosition, property);

        this._updateChildElements(graphDataSource);

        return true;
    }

    // Private

    _calculateFrameDisplayData(graphDataSource)
    {
        var secondsPerBlock = (graphDataSource.graphHeightSeconds / graphDataSource.height) * WI.TimelineRecordFrame.MinimumHeightPixels;
        var segments = [];
        var invisibleSegments = [];
        var currentSegment = null;

        function updateDurationRemainder(segment)
        {
            if (segment.duration <= secondsPerBlock) {
                segment.remainder = 0;
                return;
            }

            var roundedDuration = Math.roundTo(segment.duration, secondsPerBlock);
            segment.remainder = Math.max(segment.duration - roundedDuration, 0);
        }

        function pushCurrentSegment()
        {
            updateDurationRemainder(currentSegment);
            segments.push(currentSegment);
            if (currentSegment.duration < secondsPerBlock)
                invisibleSegments.push({segment: currentSegment, index: segments.length - 1});

            currentSegment = null;
        }

        // Frame segments aren't shown at arbitrary pixel heights, but are divided into blocks of pixels. One block
        // represents the minimum displayable duration of a rendering frame, in seconds. Contiguous tasks less than a
        // block high are grouped until the minimum is met, or a task meeting the minimum is found. The group is then
        // added to the list of segment candidates. Large tasks (one block or more) are not grouped with other tasks
        // and are simply added to the candidate list.
        for (var key in WI.RenderingFrameTimelineRecord.TaskType) {
            var taskType = WI.RenderingFrameTimelineRecord.TaskType[key];
            var duration = this._record.durationForTask(taskType);
            if (duration === 0)
                continue;

            if (currentSegment && duration >= secondsPerBlock)
                pushCurrentSegment();

            if (!currentSegment)
                currentSegment = {taskType: null, longestTaskDuration: 0, duration: 0, remainder: 0};

            currentSegment.duration += duration;
            if (duration > currentSegment.longestTaskDuration) {
                currentSegment.taskType = taskType;
                currentSegment.longestTaskDuration = duration;
            }

            if (currentSegment.duration >= secondsPerBlock)
                pushCurrentSegment();
        }

        if (currentSegment)
            pushCurrentSegment();

        // A frame consisting of a single segment is always visible.
        if (segments.length === 1) {
            segments[0].duration = Math.max(segments[0].duration, secondsPerBlock);
            invisibleSegments = [];
        }

        // After grouping sub-block tasks, a second pass is needed to handle those groups that are still beneath the
        // minimum displayable duration. Each sub-block task has one or two adjacent display segments greater than one
        // block. The rounded-off time from these tasks is added to the sub-block, if it's sufficient to create a full
        // block. Failing that, the task is merged with an adjacent segment.
        invisibleSegments.sort(function(a, b) { return a.segment.duration - b.segment.duration; });

        for (var item of invisibleSegments) {
            var segment = item.segment;
            var previousSegment = item.index > 0 ? segments[item.index - 1] : null;
            var nextSegment = item.index < segments.length - 1 ? segments[item.index + 1] : null;
            console.assert(previousSegment || nextSegment, "Invisible segment should have at least one adjacent visible segment.");

            // Try to increase the segment's size to exactly one block, by taking subblock time from neighboring segments.
            // If there are two neighbors, the one with greater subblock duration is borrowed from first.
            var adjacentSegments;
            var availableDuration;
            if (previousSegment && nextSegment) {
                adjacentSegments = previousSegment.remainder > nextSegment.remainder ? [previousSegment, nextSegment] : [nextSegment, previousSegment];
                availableDuration = previousSegment.remainder + nextSegment.remainder;
            } else {
                adjacentSegments = [previousSegment || nextSegment];
                availableDuration = adjacentSegments[0].remainder;
            }

            if (availableDuration < (secondsPerBlock - segment.duration)) {
                // Merge with largest adjacent segment.
                var targetSegment;
                if (previousSegment && nextSegment)
                    targetSegment = previousSegment.duration > nextSegment.duration ? previousSegment : nextSegment;
                else
                    targetSegment = previousSegment || nextSegment;

                targetSegment.duration += segment.duration;
                updateDurationRemainder(targetSegment);
                continue;
            }

            adjacentSegments.forEach(function(adjacentSegment) {
                if (segment.duration >= secondsPerBlock)
                    return;
                var remainder = Math.min(secondsPerBlock - segment.duration, adjacentSegment.remainder);
                segment.duration += remainder;
                adjacentSegment.remainder -= remainder;
            });
        }

        // Round visible segments to the nearest block, and compute the rounded frame duration.
        var frameDuration = 0;
        segments = segments.filter(function(segment) {
            if (segment.duration < secondsPerBlock)
                return false;
            segment.duration = Math.roundTo(segment.duration, secondsPerBlock);
            frameDuration += segment.duration;
            return true;
        });

        return {frameDuration, segments};
    }

    _updateChildElements(graphDataSource)
    {
        this._element.removeChildren();

        console.assert(this._record);
        if (!this._record)
            return;

        if (graphDataSource.graphHeightSeconds === 0)
            return;

        var frameElement = document.createElement("div");
        frameElement.classList.add("frame");
        this._element.appendChild(frameElement);

        // Display data must be recalculated when the overview graph's vertical axis changes.
        if (this._record.__displayData && this._record.__displayData.graphHeightSeconds !== graphDataSource.graphHeightSeconds)
            this._record.__displayData = null;

        if (!this._record.__displayData) {
            this._record.__displayData = this._calculateFrameDisplayData(graphDataSource);
            this._record.__displayData.graphHeightSeconds = graphDataSource.graphHeightSeconds;
        }

        var frameHeight = this._record.__displayData.frameDuration / graphDataSource.graphHeightSeconds;
        if (frameHeight >= 0.95)
            this._element.classList.add("tall");
        else
            this._element.classList.remove("tall");

        this._updateElementPosition(frameElement, frameHeight, "height");

        for (var segment of this._record.__displayData.segments) {
            var element = document.createElement("div");
            this._updateElementPosition(element, segment.duration / this._record.__displayData.frameDuration, "height");
            element.classList.add("duration", segment.taskType);
            frameElement.insertBefore(element, frameElement.firstChild);
        }
    }

    _updateElementPosition(element, newPosition, property)
    {
        newPosition *= 100;

        let newPositionAprox = Math.round(newPosition * 100);
        let currentPositionAprox = Math.round(parseFloat(element.style[property]) * 100);
        if (currentPositionAprox !== newPositionAprox)
            element.style[property] = (newPositionAprox / 100) + "%";
    }
};

WI.TimelineRecordFrame.MinimumHeightPixels = 3;
WI.TimelineRecordFrame.MaximumWidthPixels = 14;
WI.TimelineRecordFrame.MinimumWidthPixels = 4;
