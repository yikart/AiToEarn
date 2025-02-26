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

WI.RenderingFrameTimelineRecord = class RenderingFrameTimelineRecord extends WI.TimelineRecord
{
    constructor(startTime, endTime, name)
    {
        super(WI.TimelineRecord.Type.RenderingFrame, startTime, endTime);

        this._name = name || "";
        this._durationByTaskType = new Map;
        this._frameIndex = -1;
    }

    // Static

    static resetFrameIndex()
    {
        WI.RenderingFrameTimelineRecord._nextFrameIndex = 0;
    }

    static displayNameForTaskType(taskType)
    {
        switch (taskType) {
        case WI.RenderingFrameTimelineRecord.TaskType.Script:
            return WI.UIString("Script");
        case WI.RenderingFrameTimelineRecord.TaskType.Layout:
            return WI.repeatedUIString.timelineRecordLayout();
        case WI.RenderingFrameTimelineRecord.TaskType.Paint:
            return WI.repeatedUIString.timelineRecordPaint();
        case WI.RenderingFrameTimelineRecord.TaskType.Other:
            return WI.UIString("Other");
        }
    }

    static taskTypeForTimelineRecord(record)
    {
        switch (record.type) {
        case WI.TimelineRecord.Type.Script:
            return WI.RenderingFrameTimelineRecord.TaskType.Script;
        case WI.TimelineRecord.Type.Layout:
            if (record.eventType === WI.LayoutTimelineRecord.EventType.Paint || record.eventType === WI.LayoutTimelineRecord.EventType.Composite)
                return WI.RenderingFrameTimelineRecord.TaskType.Paint;
            return WI.RenderingFrameTimelineRecord.TaskType.Layout;
        default:
            console.error("Unsupported timeline record type: " + record.type);
            return null;
        }
    }

    // Import / Export

    static async fromJSON(json)
    {
        let {startTime, endTime} = json;
        let record = new WI.RenderingFrameTimelineRecord(startTime, endTime);
        record.setupFrameIndex();
        return record;
    }

    toJSON()
    {
        // FIXME: durationByTaskType data cannot be calculated if this does not have children.

        return {
            type: this.type,
            startTime: this.startTime,
            endTime: this.endTime,
        };
    }

    // Public

    get frameIndex()
    {
        return this._frameIndex;
    }

    get frameNumber()
    {
        return this._frameIndex + 1;
    }

    get name()
    {
        return this._name;
    }

    setupFrameIndex()
    {
        console.assert(this._frameIndex === -1, "Frame index should only be set once.");
        if (this._frameIndex >= 0)
            return;
        this._frameIndex = WI.RenderingFrameTimelineRecord._nextFrameIndex++;
    }

    durationForTask(taskType)
    {
        if (this._durationByTaskType.has(taskType))
            return this._durationByTaskType.get(taskType);

        var duration;
        if (taskType === WI.RenderingFrameTimelineRecord.TaskType.Other)
            duration = this._calculateDurationRemainder();
        else {
            duration = this.children.reduce(function(previousValue, currentValue) {
                if (taskType !== WI.RenderingFrameTimelineRecord.taskTypeForTimelineRecord(currentValue))
                    return previousValue;

                var currentDuration = currentValue.duration;
                if (currentValue.usesActiveStartTime)
                    currentDuration -= currentValue.inactiveDuration;
                return previousValue + currentDuration;
            }, 0);

            if (taskType === WI.RenderingFrameTimelineRecord.TaskType.Script) {
                // Layout events synchronously triggered from JavaScript must be subtracted from the total
                // script time, to prevent the time from being counted twice.
                duration -= this.children.reduce(function(previousValue, currentValue) {
                    if (currentValue.type === WI.TimelineRecord.Type.Layout && (currentValue.sourceCodeLocation || currentValue.stackTrace))
                        return previousValue + currentValue.duration;
                    return previousValue;
                }, 0);
            }
        }

        this._durationByTaskType.set(taskType, duration);
        return duration;
    }

    // Private

    _calculateDurationRemainder()
    {
        return Object.keys(WI.RenderingFrameTimelineRecord.TaskType).reduce((previousValue, key) => {
            let taskType = WI.RenderingFrameTimelineRecord.TaskType[key];
            if (taskType === WI.RenderingFrameTimelineRecord.TaskType.Other)
                return previousValue;
            return previousValue - this.durationForTask(taskType);
        }, this.duration);
    }
};

WI.RenderingFrameTimelineRecord.TaskType = {
    Script: "rendering-frame-timeline-record-script",
    Layout: "rendering-frame-timeline-record-layout",
    Paint: "rendering-frame-timeline-record-paint",
    Other: "rendering-frame-timeline-record-other"
};

WI.RenderingFrameTimelineRecord.TypeIdentifier = "rendering-frame-timeline-record";

WI.RenderingFrameTimelineRecord._nextFrameIndex = 0;
