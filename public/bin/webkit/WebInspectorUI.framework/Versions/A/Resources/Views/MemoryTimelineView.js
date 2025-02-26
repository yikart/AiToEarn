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

WI.MemoryTimelineView = class MemoryTimelineView extends WI.TimelineView
{
    constructor(timeline, extraArguments)
    {
        super(timeline, extraArguments);

        this._recording = extraArguments.recording;

        console.assert(timeline.type === WI.TimelineRecord.Type.Memory, timeline);

        this.element.classList.add("memory");

        let contentElement = this.element.appendChild(document.createElement("div"));
        contentElement.classList.add("content");

        let overviewElement = contentElement.appendChild(document.createElement("div"));
        overviewElement.classList.add("overview");

        function createChartContainer(parentElement, subtitle, tooltip) {
            let chartElement = parentElement.appendChild(document.createElement("div"));
            chartElement.classList.add("chart");

            let chartSubtitleElement = chartElement.appendChild(document.createElement("div"));
            chartSubtitleElement.classList.add("subtitle");
            chartSubtitleElement.textContent = subtitle;
            chartSubtitleElement.title = tooltip;

            let chartFlexContainerElement = chartElement.appendChild(document.createElement("div"));
            chartFlexContainerElement.classList.add("container");
            return chartFlexContainerElement;
        }

        let usageTooltip = WI.UIString("Breakdown of each memory category at the end of the selected time range");
        let usageChartContainerElement = createChartContainer(overviewElement, WI.UIString("Breakdown"), usageTooltip);
        this._usageCircleChart = new WI.CircleChart({size: 120, innerRadiusRatio: 0.5});
        this.addSubview(this._usageCircleChart);
        usageChartContainerElement.appendChild(this._usageCircleChart.element);
        this._usageLegendElement = usageChartContainerElement.appendChild(document.createElement("div"));
        this._usageLegendElement.classList.add("legend", "usage");

        let dividerElement = overviewElement.appendChild(document.createElement("div"));
        dividerElement.classList.add("divider");

        let maxComparisonTooltip = WI.UIString("Comparison of total memory size at the end of the selected time range to the maximum memory size in this recording");
        let maxComparisonChartContainerElement = createChartContainer(overviewElement, WI.UIString("Max Comparison"), maxComparisonTooltip);
        this._maxComparisonCircleChart = new WI.CircleChart({size: 120, innerRadiusRatio: 0.5});
        this.addSubview(this._maxComparisonCircleChart);
        maxComparisonChartContainerElement.appendChild(this._maxComparisonCircleChart.element);
        this._maxComparisonLegendElement = maxComparisonChartContainerElement.appendChild(document.createElement("div"));
        this._maxComparisonLegendElement.classList.add("legend", "maximum");

        let detailsContainerElement = this._detailsContainerElement = contentElement.appendChild(document.createElement("div"));
        detailsContainerElement.classList.add("details");

        this._timelineRuler = new WI.TimelineRuler;
        this.addSubview(this._timelineRuler);
        detailsContainerElement.appendChild(this._timelineRuler.element);

        let detailsSubtitleElement = detailsContainerElement.appendChild(document.createElement("div"));
        detailsSubtitleElement.classList.add("subtitle");
        detailsSubtitleElement.textContent = WI.UIString("Categories");

        this._didInitializeCategories = false;
        this._categoryViews = [];
        this._usageLegendSizeElementMap = new Map;

        this._maxSize = 0;
        this._maxComparisonMaximumSizeElement = null;
        this._maxComparisonCurrentSizeElement = null;

        timeline.addEventListener(WI.Timeline.Event.RecordAdded, this._memoryTimelineRecordAdded, this);

        this.element.addEventListener("mousemove", this._handleGraphMouseMove.bind(this));

        for (let record of timeline.records)
            this._processRecord(record);
    }

    // Static

    static displayNameForCategory(category)
    {
        switch (category) {
        case WI.MemoryCategory.Type.JavaScript:
            return WI.UIString("JavaScript");
        case WI.MemoryCategory.Type.Images:
            return WI.UIString("Images");
        case WI.MemoryCategory.Type.Layers:
            return WI.UIString("Layers");
        case WI.MemoryCategory.Type.Page:
            return WI.UIString("Page");
        }
    }

    static get memoryCategoryViewHeight() { return 75; }

    // Public

    attached()
    {
        super.attached();

        this._timelineRuler.needsLayout(WI.View.LayoutReason.Resize);
    }

    closed()
    {
        this.representedObject.removeEventListener(WI.Timeline.Event.RecordAdded, this._memoryTimelineRecordAdded, this);
    }

    reset()
    {
        super.reset();

        this._maxSize = 0;

        this.clear();
    }

    clear()
    {
        this._cachedLegendRecord = null;
        this._cachedLegendMaxSize = undefined;
        this._cachedLegendCurrentSize = undefined;

        this._usageCircleChart.clear();
        this._usageCircleChart.needsLayout();
        this._clearUsageLegend();

        this._maxComparisonCircleChart.clear();
        this._maxComparisonCircleChart.needsLayout();
        this._clearMaxComparisonLegend();

        for (let categoryView of this._categoryViews)
            categoryView.clear();
    }

    get scrollableElements()
    {
        return [this.element];
    }

    // Protected

    get showsFilterBar() { return false; }

    initialLayout()
    {
        super.initialLayout();

        this.element.style.setProperty("--memory-category-view-height", MemoryTimelineView.memoryCategoryViewHeight + "px");
    }

    layout()
    {
        if (this.layoutReason === WI.View.LayoutReason.Resize)
            return;

        // Always update timeline ruler.
        this._timelineRuler.zeroTime = this.zeroTime;
        this._timelineRuler.startTime = this.startTime;
        this._timelineRuler.endTime = this.endTime;

        if (!this._didInitializeCategories)
            return;

        let graphStartTime = this.startTime;
        let graphEndTime = this.endTime;
        let secondsPerPixel = this._timelineRuler.secondsPerPixel;
        let visibleEndTime = Math.min(this.endTime, this.currentTime);

        let discontinuities = this._recording.discontinuitiesInTimeRange(graphStartTime, visibleEndTime);

        let visibleRecords = this.representedObject.recordsInTimeRange(graphStartTime, visibleEndTime, {
            includeRecordBeforeStart: !discontinuities.length || discontinuities[0].startTime > graphStartTime,
            includeRecordAfterEnd: true,
        });
        if (!visibleRecords.length || (visibleRecords.length === 1 && visibleRecords[0].endTime < graphStartTime)) {
            this.clear();
            return;
        }

        // Update total usage chart with the last record's data.
        let lastRecord = visibleRecords.lastValue;
        let values = [];
        for (let {size} of lastRecord.categories)
            values.push(size);
        this._usageCircleChart.values = values;
        this._usageCircleChart.updateLayout();
        this._updateUsageLegend(lastRecord);

        // Update maximum comparison chart.
        this._maxComparisonCircleChart.values = [lastRecord.totalSize, this._maxSize - lastRecord.totalSize];
        this._maxComparisonCircleChart.updateLayout();
        this._updateMaxComparisonLegend(lastRecord.totalSize);

        let categoryDataMap = {};
        for (let categoryView of this._categoryViews)
            categoryDataMap[categoryView.category] = {dataPoints: [], max: -Infinity, min: Infinity};

        for (let record of visibleRecords) {
            let time = record.startTime;
            let startDiscontinuity = null;
            let endDiscontinuity = null;
            if (discontinuities.length && discontinuities[0].endTime <= time) {
                startDiscontinuity = discontinuities.shift();
                endDiscontinuity = startDiscontinuity;
                while (discontinuities.length && discontinuities[0].endTime <= time)
                    endDiscontinuity = discontinuities.shift();
            }

            for (let category of record.categories) {
                let categoryData = categoryDataMap[category.type];

                if (startDiscontinuity) {
                    if (categoryData.dataPoints.length) {
                        let previousDataPoint = categoryData.dataPoints.lastValue;
                        categoryData.dataPoints.push({time: startDiscontinuity.startTime, size: previousDataPoint.size});
                    }

                    categoryData.dataPoints.push({time: startDiscontinuity.startTime, size: 0});
                    categoryData.dataPoints.push({time: endDiscontinuity.endTime, size: 0});
                    categoryData.dataPoints.push({time: endDiscontinuity.endTime, size: category.size});
                }

                categoryData.dataPoints.push({time, size: category.size});
                categoryData.max = Math.max(categoryData.max, category.size);
                categoryData.min = Math.min(categoryData.min, category.size);
            }
        }

        // If the graph end time is inside a gap, the last data point should
        // only be extended to the start of the discontinuity.
        if (discontinuities.length)
            visibleEndTime = discontinuities[0].startTime;

        function layoutCategoryView(categoryView, {dataPoints, min, max}) {
            if (min === Infinity)
                min = 0;
            if (max === -Infinity)
                max = 0;

            // Zoom in to the top of each graph to accentuate small changes.
            let graphMin = min * 0.95;
            let graphMax = (max * 1.05) - graphMin;

            function xScale(time) {
                return (time - graphStartTime) / secondsPerPixel;
            }

            let size = new WI.Size(xScale(graphEndTime), MemoryTimelineView.memoryCategoryViewHeight);

            function yScale(value) {
                return size.height - (((value - graphMin) / graphMax) * size.height);
            }

            categoryView.updateChart(dataPoints, size, visibleEndTime, min, max, xScale, yScale);
        }

        for (let categoryView of this._categoryViews)
            layoutCategoryView(categoryView, categoryDataMap[categoryView.category]);
    }

    // Private

    _graphPositionForMouseEvent(event)
    {
        let chartElement = event.target.closest(".area-chart, .stacked-area-chart, .range-chart");
        if (!chartElement)
            return NaN;

        let chartRect = chartElement.getBoundingClientRect();
        let position = event.pageX - chartRect.left;

        if (WI.resolvedLayoutDirection() === WI.LayoutDirection.RTL)
            return chartRect.width - position;
        return position;
    }

    _handleGraphMouseMove(event)
    {
        let mousePosition = this._graphPositionForMouseEvent(event);
        if (isNaN(mousePosition)) {
            this.dispatchEventToListeners(WI.TimelineView.Event.ScannerHide);
            return;
        }

        let secondsPerPixel = this._timelineRuler.secondsPerPixel;
        let time = this.startTime + (mousePosition * secondsPerPixel);

        this.dispatchEventToListeners(WI.TimelineView.Event.ScannerShow, {time});
    }

    _clearUsageLegend()
    {
        for (let sizeElement of this._usageLegendSizeElementMap.values())
            sizeElement.textContent = emDash;

        let totalElement = this._usageCircleChart.centerElement.firstChild;
        if (totalElement) {
            totalElement.firstChild.textContent = "";
            totalElement.lastChild.textContent = "";
        }
    }

    _updateUsageLegend(record)
    {
        if (this._cachedLegendRecord === record)
            return;

        this._cachedLegendRecord = record;

        for (let {type, size} of record.categories) {
            let sizeElement = this._usageLegendSizeElementMap.get(type);
            sizeElement.textContent = Number.isFinite(size) ? Number.bytesToString(size) : emDash;
        }

        let centerElement = this._usageCircleChart.centerElement;
        let totalElement = centerElement.firstChild;
        if (!totalElement) {
            totalElement = centerElement.appendChild(document.createElement("div"));
            totalElement.classList.add("total-usage");
            totalElement.appendChild(document.createElement("span")); // firstChild
            totalElement.appendChild(document.createElement("br"));
            totalElement.appendChild(document.createElement("span")); // lastChild
        }

        let totalSize = Number.bytesToString(record.totalSize).split(/\s+/);
        totalElement.firstChild.textContent = totalSize[0];
        totalElement.lastChild.textContent = totalSize[1];
    }

    _clearMaxComparisonLegend()
    {
        if (this._maxComparisonMaximumSizeElement)
            this._maxComparisonMaximumSizeElement.textContent = emDash;
        if (this._maxComparisonCurrentSizeElement)
            this._maxComparisonCurrentSizeElement.textContent = emDash;

        let totalElement = this._maxComparisonCircleChart.centerElement.firstChild;
        if (totalElement)
            totalElement.textContent = "";
    }

    _updateMaxComparisonLegend(currentSize)
    {
        if (this._cachedLegendMaxSize === this._maxSize && this._cachedLegendCurrentSize === currentSize)
            return;

        this._cachedLegendMaxSize = this._maxSize;
        this._cachedLegendCurrentSize = currentSize;

        this._maxComparisonMaximumSizeElement.textContent = Number.isFinite(this._maxSize) ? Number.bytesToString(this._maxSize) : emDash;
        this._maxComparisonCurrentSizeElement.textContent = Number.isFinite(currentSize) ? Number.bytesToString(currentSize) : emDash;

        let centerElement = this._maxComparisonCircleChart.centerElement;
        let totalElement = centerElement.firstChild;
        if (!totalElement) {
            totalElement = centerElement.appendChild(document.createElement("div"));
            totalElement.classList.add("max-percentage");
        }

        // The chart will only show a perfect circle if the current and max are really the same value.
        // So do a little massaging to ensure 0.9995 doesn't get rounded up to 1.
        let percent = currentSize / this._maxSize;
        totalElement.textContent = Number.percentageString(percent === 1 ? percent : (percent - 0.0005));
    }

    _initializeCategoryViews(record)
    {
        console.assert(!this._didInitializeCategories, "Should only initialize category views once");
        this._didInitializeCategories = true;

        let segments = [];
        let lastCategoryViewElement = null;

        function appendLegendRow(legendElement, swatchClass, label, tooltip) {
            let rowElement = legendElement.appendChild(document.createElement("div"));
            rowElement.classList.add("row");

            let swatchElement = rowElement.appendChild(document.createElement("div"));
            swatchElement.classList.add("swatch", swatchClass);

            let valueContainer = rowElement.appendChild(document.createElement("div"));
            valueContainer.classList.add("value");

            let labelElement = valueContainer.appendChild(document.createElement("div"));
            labelElement.classList.add("label");
            labelElement.textContent = label;

            let sizeElement = valueContainer.appendChild(document.createElement("div"));
            sizeElement.classList.add("size");

            if (tooltip)
                rowElement.title = tooltip;

            return sizeElement;
        }

        for (let {type} of record.categories) {
            segments.push(type);

            // Per-category graph.
            let categoryView = new WI.MemoryCategoryView(type, WI.MemoryTimelineView.displayNameForCategory(type));
            this._categoryViews.push(categoryView);
            this.addSubview(categoryView);
            if (!lastCategoryViewElement)
                this._detailsContainerElement.appendChild(categoryView.element);
            else
                this._detailsContainerElement.insertBefore(categoryView.element, lastCategoryViewElement);
            lastCategoryViewElement = categoryView.element;

            // Usage legend rows.
            let sizeElement = appendLegendRow.call(this, this._usageLegendElement, type, WI.MemoryTimelineView.displayNameForCategory(type));
            this._usageLegendSizeElementMap.set(type, sizeElement);
        }

        this._usageCircleChart.segments = segments;

        // Max comparison legend rows.
        this._maxComparisonCircleChart.segments = ["current", "remainder"];
        this._maxComparisonMaximumSizeElement = appendLegendRow.call(this, this._maxComparisonLegendElement, "remainder", WI.UIString("Maximum"), WI.UIString("Maximum maximum memory size in this recording"));
        this._maxComparisonCurrentSizeElement = appendLegendRow.call(this, this._maxComparisonLegendElement, "current", WI.UIString("Current"), WI.UIString("Total memory size at the end of the selected time range"));
    }

    _memoryTimelineRecordAdded(event)
    {
        let memoryTimelineRecord = event.data.record;
        console.assert(memoryTimelineRecord instanceof WI.MemoryTimelineRecord);

        this._processRecord(memoryTimelineRecord);

        if (memoryTimelineRecord.startTime >= this.startTime && memoryTimelineRecord.endTime <= this.endTime)
            this.needsLayout();
    }

    _processRecord(memoryTimelineRecord)
    {
        if (!this._didInitializeCategories)
            this._initializeCategoryViews(memoryTimelineRecord);

        this._maxSize = Math.max(this._maxSize, memoryTimelineRecord.totalSize);
    }
};

WI.MemoryTimelineView.ReferencePage = WI.ReferencePage.TimelinesTab.MemoryTimeline;
