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

WI.ScriptTimelineDataGridNode = class ScriptTimelineDataGridNode extends WI.TimelineDataGridNode
{
    constructor(record, options = {})
    {
        console.assert(record instanceof WI.ScriptTimelineRecord);

        super([record], options);
    }

    // Public

    get data()
    {
        if (this._cachedData)
            return this._cachedData;

        let baseStartTime = 0;
        let rangeStartTime = 0;
        let rangeEndTime = Infinity;
        if (this.graphDataSource) {
            baseStartTime = this.graphDataSource.zeroTime;
            rangeStartTime = this.graphDataSource.startTime;
            rangeEndTime = this.graphDataSource.endTime;
        }

        let startTime = this.record.startTime;
        let duration = this.record.startTime + this.record.duration - startTime;

        this._cachedData = super.data;
        this._cachedData.type = this.record.eventType;
        this._cachedData.name = this.displayName();
        this._cachedData.startTime = startTime - baseStartTime;
        this._cachedData.selfTime = duration;
        this._cachedData.totalTime = duration;
        this._cachedData.averageTime = duration;
        this._cachedData.callCount = this.record.callCountOrSamples;
        this._cachedData.location = this.record.initiatorCallFrame || this.record.sourceCodeLocation;
        return this._cachedData;
    }

    get subtitle()
    {
        if (this._subtitle !== undefined)
            return this._subtitle;

        this._subtitle = "";

        if (this.record.eventType === WI.ScriptTimelineRecord.EventType.TimerInstalled) {
            let timeoutString = Number.secondsToString(this.record.details.timeout / 1000);
            if (this.record.details.repeating)
                this._subtitle = WI.UIString("%s interval").format(timeoutString);
            else
                this._subtitle = WI.UIString("%s delay").format(timeoutString);
        } else if (this.record.eventType === WI.ScriptTimelineRecord.EventType.EventDispatched) {
            if (this.record.extraDetails && this.record.extraDetails.defaultPrevented)
                this._subtitle = WI.UIString("default prevented");
        }

        return this._subtitle;
    }

    createCellContent(columnIdentifier, cell)
    {
        const higherResolution = true;

        var value = this.data[columnIdentifier];

        switch (columnIdentifier) {
        case "name":
            cell.classList.add(...this.iconClassNames());
            return this._createNameCellDocumentFragment();

        case "startTime":
        case "selfTime":
        case "totalTime":
        case "averageTime":
            return isNaN(value) ? emDash : Number.secondsToString(value, higherResolution);

        case "callCount":
            return isNaN(value) ? emDash : value.toLocaleString();

        // Necessary to be displayed in WI.LayoutTimelineView.
        case "width":
        case "height":
        case "area":
            return zeroWidthSpace;

        case "source": // Timeline Overview
            return super.createCellContent("location", cell);
        }

        return super.createCellContent(columnIdentifier, cell);
    }

    // Protected

    filterableDataForColumn(columnIdentifier)
    {
        if (columnIdentifier === "name")
            return [this.displayName(), this.subtitle];

        return super.filterableDataForColumn(columnIdentifier);
    }

    // Private

    _createNameCellDocumentFragment(cellElement)
    {
        let fragment = document.createDocumentFragment();
        fragment.append(this.displayName());

        if (this.subtitle) {
            let subtitleElement = document.createElement("span");
            subtitleElement.classList.add("subtitle");
            subtitleElement.textContent = this.subtitle;
            fragment.append(subtitleElement);
        }

        return fragment;
    }
};
