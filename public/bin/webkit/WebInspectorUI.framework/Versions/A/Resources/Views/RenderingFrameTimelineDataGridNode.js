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

WI.RenderingFrameTimelineDataGridNode = class RenderingFrameTimelineDataGridNode extends WI.TimelineDataGridNode
{
    constructor(record, options = {})
    {
        console.assert(record instanceof WI.RenderingFrameTimelineRecord);

        super([record], options);
    }

    // Public

    get data()
    {
        if (this._cachedData)
            return this._cachedData;

        this._cachedData = super.data;
        this._cachedData.name = WI.TimelineTabContentView.displayNameForRecord(this.record);
        this._cachedData.startTime = this.record.startTime - (this.graphDataSource ? this.graphDataSource.zeroTime : 0);
        this._cachedData.totalTime = this.record.duration;
        this._cachedData.scriptTime = this.record.durationForTask(WI.RenderingFrameTimelineRecord.TaskType.Script);
        this._cachedData.layoutTime = this.record.durationForTask(WI.RenderingFrameTimelineRecord.TaskType.Layout);
        this._cachedData.paintTime = this.record.durationForTask(WI.RenderingFrameTimelineRecord.TaskType.Paint);
        this._cachedData.otherTime = this.record.durationForTask(WI.RenderingFrameTimelineRecord.TaskType.Other);
        return this._cachedData;
    }

    createCellContent(columnIdentifier, cell)
    {
        const higherResolution = true;

        var value = this.data[columnIdentifier];

        switch (columnIdentifier) {
        case "name":
            cell.classList.add(...this.iconClassNames());
            return value;

        case "startTime":
            return isNaN(value) ? emDash : Number.secondsToString(value, higherResolution);

        case "scriptTime":
        case "layoutTime":
        case "paintTime":
        case "otherTime":
        case "totalTime":
            return (isNaN(value) || value === 0) ? emDash : Number.secondsToString(value, higherResolution);
        }

        return super.createCellContent(columnIdentifier, cell);
    }
};
