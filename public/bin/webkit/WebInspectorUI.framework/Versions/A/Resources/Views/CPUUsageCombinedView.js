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

WI.CPUUsageCombinedView = class CPUUsageCombinedView extends WI.View
{
    constructor(displayName)
    {
        super();

        this.element.classList.add("cpu-usage-combined-view");

        this._detailsElement = this.element.appendChild(document.createElement("div"));
        this._detailsElement.classList.add("details");

        let detailsNameElement = this._detailsElement.appendChild(document.createElement("span"));
        detailsNameElement.classList.add("name");
        detailsNameElement.textContent = displayName;

        this._detailsElement.appendChild(document.createElement("br"));
        this._detailsAverageElement = this._detailsElement.appendChild(document.createElement("span"));
        this._detailsElement.appendChild(document.createElement("br"));
        this._detailsMaxElement = this._detailsElement.appendChild(document.createElement("span"));
        this._detailsElement.appendChild(document.createElement("br"));
        this._detailsElement.appendChild(document.createElement("br"));
        this._updateDetails(NaN, NaN);

        this._graphElement = this.element.appendChild(document.createElement("div"));
        this._graphElement.classList.add("graph");

        // Combined thread usage area chart.
        this._chart = new WI.StackedAreaChart;
        this._chart.initializeSections(["main-thread-usage", "worker-thread-usage", "total-usage"]);
        this.addSubview(this._chart);
        this._graphElement.appendChild(this._chart.element);

        // Main thread indicator strip.
        this._rangeChart = new WI.RangeChart;
        this.addSubview(this._rangeChart);
        this._graphElement.appendChild(this._rangeChart.element);

        function appendLegendRow(legendElement, className) {
            let rowElement = legendElement.appendChild(document.createElement("div"));
            rowElement.classList.add("row");

            let swatchElement = rowElement.appendChild(document.createElement("div"));
            swatchElement.classList.add("swatch", className);

            let labelElement = rowElement.appendChild(document.createElement("div"));
            labelElement.classList.add("label");

            return labelElement;
        }

        this._legendElement = this._detailsElement.appendChild(document.createElement("div"));
        this._legendElement.classList.add("legend-container");

        this._legendMainThreadElement = appendLegendRow(this._legendElement, "main-thread");
        this._legendWorkerThreadsElement = appendLegendRow(this._legendElement, "worker-threads");
        this._legendOtherThreadsElement = appendLegendRow(this._legendElement, "other-threads");
        this._legendTotalThreadsElement = appendLegendRow(this._legendElement, "total");

        this.clearLegend();
    }

    // Public

    get graphElement() { return this._graphElement; }
    get chart() { return this._chart; }
    get rangeChart() { return this._rangeChart; }

    clear()
    {
        this._cachedAverageSize = undefined;
        this._cachedMaxSize = undefined;
        this._updateDetails(NaN, NaN);

        this.clearLegend();

        this._chart.clear();
        this._chart.needsLayout();

        this._rangeChart.clear();
        this._rangeChart.needsLayout();
    }

    updateChart(dataPoints, size, visibleEndTime, min, max, average, xScale, yScale)
    {
        console.assert(size instanceof WI.Size);
        console.assert(min >= 0);
        console.assert(max >= 0);
        console.assert(min <= max);
        console.assert(min <= average && average <= max);

        this._updateDetails(max, average);

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
        let firstY1 = yScale(dataPoints[0].mainThreadUsage);
        let firstY2 = yScale(dataPoints[0].mainThreadUsage + dataPoints[0].workerThreadUsage);
        let firstY3 = yScale(dataPoints[0].usage);
        this._chart.addPointSet(firstX, [firstY1, firstY2, firstY3]);

        // Points for data points.
        for (let dataPoint of dataPoints) {
            let x = xScale(dataPoint.time);
            let y1 = yScale(dataPoint.mainThreadUsage);
            let y2 = yScale(dataPoint.mainThreadUsage + dataPoint.workerThreadUsage);
            let y3 = yScale(dataPoint.usage);
            this._chart.addPointSet(x, [y1, y2, y3]);
        }

        // Extend the last data point to the end time.
        let lastDataPoint = dataPoints.lastValue;
        let lastX = Math.floor(xScale(visibleEndTime));
        let lastY1 = yScale(lastDataPoint.mainThreadUsage);
        let lastY2 = yScale(lastDataPoint.mainThreadUsage + lastDataPoint.workerThreadUsage);
        let lastY3 = yScale(lastDataPoint.usage);
        this._chart.addPointSet(lastX, [lastY1, lastY2, lastY3]);
    }

    updateMainThreadIndicator(samples, size, visibleEndTime, xScale)
    {
        console.assert(size instanceof WI.Size);

        this._rangeChart.clear();
        this._rangeChart.size = size;
        this._rangeChart.needsLayout();

        if (!samples.length)
            return;

        // Coalesce ranges of samples.
        let ranges = [];
        let currentRange = null;
        let currentSampleType = undefined;
        for (let i = 0; i < samples.length; ++i) {
            // Back to idle, close any current chunk.
            let type = samples[i];
            if (!type) {
                if (currentRange) {
                    ranges.push(currentRange);
                    currentRange = null;
                    currentSampleType = undefined;
                }
                continue;
            }

            // Expand existing chunk.
            if (type === currentSampleType) {
                currentRange.endIndex = i;
                continue;
            }

            // If type changed, close current chunk.
            if (currentSampleType) {
                ranges.push(currentRange);
                currentRange = null;
                currentSampleType = undefined;
            }

            // Start a new chunk.
            console.assert(!currentRange);
            console.assert(!currentSampleType);
            currentRange = {type, startIndex: i, endIndex: i};
            currentSampleType = type;
        }

        for (let {type, startIndex, endIndex} of ranges) {
            let startX = xScale(startIndex);
            let endX = xScale(endIndex + 1);
            let width = endX - startX;
            this._rangeChart.addRange(startX, width, type);
        }
    }

    clearLegend()
    {
        this._legendMainThreadElement.textContent = WI.UIString("Main Thread");
        this._legendWorkerThreadsElement.textContent = WI.UIString("Worker Threads");
        this._legendOtherThreadsElement.textContent = WI.UIString("Other Threads");
        this._legendTotalThreadsElement.textContent = "";
    }

    updateLegend(record)
    {
        if (!record) {
            this.clearLegend();
            return;
        }

        let {usage, mainThreadUsage, workerThreadUsage, webkitThreadUsage, unknownThreadUsage} = record;

        this._legendMainThreadElement.textContent = WI.UIString("Main: %s").format(Number.percentageString(mainThreadUsage / 100));
        this._legendWorkerThreadsElement.textContent = WI.UIString("Worker: %s").format(Number.percentageString(workerThreadUsage / 100));
        this._legendOtherThreadsElement.textContent = WI.UIString("Other: %s").format(Number.percentageString((webkitThreadUsage + unknownThreadUsage) / 100));
        this._legendTotalThreadsElement.textContent = WI.UIString("Total: %s").format(Number.percentageString(usage / 100));
    }

    // Private

    _updateDetails(maxSize, averageSize)
    {
        if (this._cachedMaxSize === maxSize && this._cachedAverageSize === averageSize)
            return;

        this._cachedAverageSize = averageSize;
        this._cachedMaxSize = maxSize;

        this._detailsAverageElement.textContent = WI.UIString("Average: %s").format(Number.isFinite(maxSize) ? Number.percentageString(averageSize / 100) : emDash);
        this._detailsMaxElement.textContent = WI.UIString("Highest: %s").format(Number.isFinite(maxSize) ? Number.percentageString(maxSize / 100) : emDash);
    }
};
