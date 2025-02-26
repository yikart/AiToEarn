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

WI.CPUUsageView = class CPUUsageView extends WI.View
{
    constructor(displayName)
    {
        super();

        this.element.classList.add("cpu-usage-view");

        this._detailsElement = this.element.appendChild(document.createElement("div"));
        this._detailsElement.classList.add("details");

        if (displayName) {
            let detailsNameElement = this._detailsElement.appendChild(document.createElement("span"));
            detailsNameElement.classList.add("name");
            detailsNameElement.textContent = displayName;
            if (displayName.length >= 20)
                detailsNameElement.title = displayName;
            this._detailsElement.appendChild(document.createElement("br"));
        }

        this._detailsAverageElement = this._detailsElement.appendChild(document.createElement("span"));
        this._detailsElement.appendChild(document.createElement("br"));
        this._detailsUsageElement = this._detailsElement.appendChild(document.createElement("span"));

        this.clearLegend();
        this._updateDetails(NaN);

        this._graphElement = this.element.appendChild(document.createElement("div"));
        this._graphElement.classList.add("graph");

        this._chart = new WI.AreaChart;
        this.addSubview(this._chart);
        this._graphElement.appendChild(this._chart.element);
    }

    // Public

    get graphElement() { return this._graphElement; }
    get chart() { return this._chart; }

    clear()
    {
        this._cachedAverageSize = undefined;
        this._updateDetails(NaN);

        this.clearLegend();

        this._chart.clear();
        this._chart.needsLayout();
    }

    updateChart(dataPoints, size, visibleEndTime, min, max, average, xScale, yScale, property)
    {
        console.assert(size instanceof WI.Size);
        console.assert(min >= 0);
        console.assert(max >= 0);
        console.assert(min <= max);
        console.assert(min <= average && average <= max);
        console.assert(property, "CPUUsageView needs a property of the dataPoints to graph");

        this._updateDetails(average);

        this._chart.clearPoints();
        this._chart.size = size;
        this._chart.needsLayout();

        if (!dataPoints.length)
            return;

        // Ensure an empty graph is empty.
        if (!max)
            return;

        // Extend the first data point to the start so it doesn't look like we originate at zero size.
        let firstX = 0;
        let firstY = yScale(dataPoints[0][property]);
        this._chart.addPoint(firstX, firstY);

        // Points for data points.
        for (let dataPoint of dataPoints) {
            let x = xScale(dataPoint.time);
            let y = yScale(dataPoint[property]);
            this._chart.addPoint(x, y);
        }

        // Extend the last data point to the end time.
        let lastDataPoint = dataPoints.lastValue;
        let lastX = Math.floor(xScale(visibleEndTime));
        let lastY = yScale(lastDataPoint[property]);
        this._chart.addPoint(lastX, lastY);
    }

    clearLegend()
    {
        this._detailsUsageElement.hidden = true;
        this._detailsUsageElement.textContent = emDash;
    }

    updateLegend(value)
    {
        let usage = Number.isFinite(value) ? Number.percentageString(value / 100) : emDash;

        this._detailsUsageElement.hidden = false;
        this._detailsUsageElement.textContent = WI.UIString("Usage: %s").format(usage);
    }

    // Private

    _updateDetails(averageSize)
    {
        if (this._cachedAverageSize === averageSize)
            return;

        this._cachedAverageSize = averageSize;

        this._detailsAverageElement.hidden = !Number.isFinite(averageSize);
        this._detailsAverageElement.textContent = WI.UIString("Average: %s").format(Number.isFinite(averageSize) ? Number.percentageString(averageSize / 100) : emDash);
    }
};
