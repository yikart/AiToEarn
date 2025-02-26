/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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

WI.ResourceTimingBreakdownView = class ResourceTimingBreakdownView extends WI.View
{
    constructor(resource, fixedWidth)
    {
        super(null);

        console.assert(resource.timingData.startTime && resource.timingData.responseEnd, "Timing breakdown view requires a resource with timing data.");
        console.assert(!fixedWidth || fixedWidth >= 100, "fixedWidth must be at least wide enough for strings.");

        this._resource = resource;

        this.element.classList.add("resource-timing-breakdown");

        if (fixedWidth)
            this.element.style.width = fixedWidth + "px";
    }

    // Protected

    _appendEmptyRow()
    {
        let row = this._tableElement.appendChild(document.createElement("tr"));
        row.className = "empty";
        return row;
    }

    _appendHeaderRow(label, time, additionalClassName)
    {
        let row = this._tableElement.appendChild(document.createElement("tr"));
        row.className = "header";
        if (additionalClassName)
            row.classList.add(additionalClassName);

        let labelCell = row.appendChild(document.createElement("td"));
        labelCell.className = "label";
        labelCell.textContent = label;
        labelCell.colSpan = 2;

        let timeCell = row.appendChild(document.createElement("td"));
        timeCell.className = "time";
        if (time)
            timeCell.textContent = time;
        else if (time === undefined)
            timeCell.appendChild(document.createElement("hr"));

        return row;
    }

    _appendRow(label, type, startTime, endTime)
    {
        let row = this._tableElement.appendChild(document.createElement("tr"));

        let labelCell = row.appendChild(document.createElement("td"));
        labelCell.className = "label";
        labelCell.textContent = label;

        let duration = endTime - startTime;
        let graphWidth = (duration / this._graphDuration) * 100;
        let graphOffset = ((startTime - this._graphStartTime) / this._graphDuration) * 100;
        let positionProperty = WI.resolvedLayoutDirection() === WI.LayoutDirection.RTL ? "right" : "left";
        let graphCell = row.appendChild(document.createElement("td"));
        graphCell.className = "graph";
        let block = graphCell.appendChild(document.createElement("div"));
        block.classList.add("block", type);
        block.style.width = graphWidth + "%";
        block.style[positionProperty] = graphOffset + "%";

        let timeCell = row.appendChild(document.createElement("td"));
        timeCell.className = "time";
        timeCell.textContent = Number.secondsToMillisecondsString(duration);

        return row;
    }

    _appendServerTimingRow(label, duration, maxDuration)
    {
        let row = this._tableElement.appendChild(document.createElement("tr"));

        let labelCell = row.appendChild(document.createElement("td"));
        labelCell.className = "label";
        labelCell.textContent = label;

        // We need to allow duration to be zero.
        if (duration !== undefined) {
            let graphWidth = (duration / maxDuration) * 100;
            let graphCell = row.appendChild(document.createElement("td"));
            graphCell.className = "graph";

            let block = graphCell.appendChild(document.createElement("div"));
            // FIXME: Provide unique colors for the different ServerTiming rows based on the label/order.
            block.classList.add("block", "response");
            block.style.width = graphWidth + "%";
            block.style.right = 0;

            let timeCell = row.appendChild(document.createElement("td"));
            timeCell.className = "time";
            // Convert duration from milliseconds to seconds.
            timeCell.textContent = Number.secondsToMillisecondsString(duration / 1000);
        }

        return row;
    }

    _appendDividerRow()
    {
        let emptyCell = this._appendEmptyRow().appendChild(document.createElement("td"));
        emptyCell.colSpan = 3;
        emptyCell.appendChild(document.createElement("hr"));
    }

    initialLayout()
    {
        super.initialLayout();

        let {startTime, redirectStart, redirectEnd, fetchStart, domainLookupStart, domainLookupEnd, connectStart, connectEnd, secureConnectionStart, requestStart, responseStart, responseEnd} = this._resource.timingData;
        let serverTiming = this._resource.serverTiming;

        this._tableElement = this.element.appendChild(document.createElement("table"));
        this._tableElement.className = "waterfall network";

        this._graphStartTime = startTime;
        this._graphEndTime = responseEnd;
        this._graphDuration = this._graphEndTime - this._graphStartTime;

        this._appendHeaderRow(WI.UIString("Scheduling:"));

        if (redirectEnd - redirectStart) {
            // FIXME: <https://webkit.org/b/190214> Web Inspector: expose full load metrics for redirect requests
            this._appendRow(WI.UIString("Redirects"), "redirect", redirectStart, redirectEnd);
        }

        this._appendRow(WI.UIString("Queued"), "queue", fetchStart, domainLookupStart || connectStart || requestStart);

        if (domainLookupStart || connectStart) {
            this._appendEmptyRow();
            this._appendHeaderRow(WI.UIString("Connection:"));
            if (domainLookupStart)
                this._appendRow(WI.UIString("DNS"), "dns", domainLookupStart, domainLookupEnd || connectStart || requestStart);
            if (connectStart)
                this._appendRow(WI.UIString("TCP"), "connect", connectStart, connectEnd || requestStart);
            if (secureConnectionStart)
                this._appendRow(WI.UIString("Secure"), "secure", secureConnectionStart, connectEnd || requestStart);
        }

        this._appendEmptyRow();
        this._appendHeaderRow(WI.UIString("Response:"));
        this._appendRow(WI.UIString("Waiting"), "request", requestStart, responseStart);
        this._appendRow(WI.UIString("Download"), "response", responseStart, responseEnd);

        this._appendEmptyRow();
        this._appendHeaderRow(WI.UIString("Totals:"));
        this._appendHeaderRow(WI.UIString("Time to First Byte"), Number.secondsToMillisecondsString(responseStart - startTime), "total-row");
        this._appendHeaderRow(WI.UIString("Start to Finish"), Number.secondsToMillisecondsString(responseEnd - startTime), "total-row");

        if (serverTiming.length > 0) {
            this._appendDividerRow();
            this._appendHeaderRow(WI.UIString("Server Timing:"));

            let maxDuration = serverTiming.reduce((max, {duration = 0}) => Math.max(max, duration), 0);

            for (let entry of serverTiming) {
                let {name, duration, description} = entry;

                // For the label, prefer description over name.
                this._appendServerTimingRow(description || name, duration, maxDuration);
            }
        }
    }
};
