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

WI.CPUTimelineView = class CPUTimelineView extends WI.TimelineView
{
    constructor(timeline, extraArguments)
    {
        console.assert(timeline.type === WI.TimelineRecord.Type.CPU, timeline);

        super(timeline, extraArguments);

        this._recording = extraArguments.recording;

        this.element.classList.add("cpu");

        this._sectionLimit = CPUTimelineView.defaultSectionLimit;

        this._statisticsData = null;
        this._secondsPerPixelInLayout = undefined;
        this._visibleRecordsInLayout = [];
        this._discontinuitiesInLayout = [];

        this._stickingOverlay = false;
        this._overlayRecord = null;
        this._overlayTime = NaN;

        timeline.addEventListener(WI.Timeline.Event.RecordAdded, this._cpuTimelineRecordAdded, this);
    }

    // Static

    static displayNameForSampleType(type)
    {
        switch (type) {
        case CPUTimelineView.SampleType.JavaScript:
            return WI.UIString("JavaScript");
        case CPUTimelineView.SampleType.Layout:
            return WI.repeatedUIString.timelineRecordLayout();
        case CPUTimelineView.SampleType.Paint:
            return WI.repeatedUIString.timelineRecordPaint();
        case CPUTimelineView.SampleType.Style:
            return WI.UIString("Styles");
        }
        console.error("Unknown sample type", type);
    }

    static get cpuUsageViewHeight() { return 135; }
    static get threadCPUUsageViewHeight() { return 65; }
    static get indicatorViewHeight() { return 15; }

    static get lowEnergyThreshold() { return 3; }
    static get mediumEnergyThreshold() { return 30; }
    static get highEnergyThreshold() { return 100; }

    static get lowEnergyGraphBoundary() { return 10; }
    static get mediumEnergyGraphBoundary() { return 70; }
    static get highEnergyGraphBoundary() { return 100; }

    static get defaultSectionLimit() { return 5; }

    // Public

    attached()
    {
        super.attached();

        this._timelineRuler?.needsLayout(WI.View.LayoutReason.Resize);
    }

    closed()
    {
        this.representedObject.removeEventListener(WI.Timeline.Event.RecordAdded, this._cpuTimelineRecordAdded, this);
    }

    reset()
    {
        super.reset();

        this._resetSourcesFilters();

        this.clear();
    }

    clear()
    {
        if (!this.didInitialLayout)
            return;

        this._breakdownChart.clear();
        this._breakdownChart.needsLayout();
        this._clearBreakdownLegend();

        this._energyChart.clear();
        this._energyChart.needsLayout();
        this._clearEnergyImpactText();

        this._clearStatistics();
        this._clearSources();

        function clearUsageView(view) {
            view.clear();

            let markersElement = view.chart.element.querySelector(".markers");
            if (markersElement)
                markersElement.remove();
        }

        clearUsageView(this._cpuUsageView);
        clearUsageView(this._mainThreadUsageView);
        clearUsageView(this._webkitThreadUsageView);
        clearUsageView(this._unknownThreadUsageView);

        this._removeWorkerThreadViews();

        this._sectionLimit = CPUTimelineView.defaultSectionLimit;

        this._statisticsData = null;
        this._secondsPerPixelInLayout = undefined;
        this._visibleRecordsInLayout = [];
        this._discontinuitiesInLayout = [];

        this._stickingOverlay = false;
        this._hideGraphOverlay();
    }

    // Protected

    get showsFilterBar() { return false; }

    get scrollableElements()
    {
        return [this.element];
    }

    initialLayout()
    {
        super.initialLayout();

        this.element.style.setProperty("--cpu-usage-combined-view-height", CPUTimelineView.cpuUsageViewHeight + "px");
        this.element.style.setProperty("--cpu-usage-view-height", CPUTimelineView.threadCPUUsageViewHeight + "px");
        this.element.style.setProperty("--cpu-usage-indicator-view-height", CPUTimelineView.indicatorViewHeight + "px");

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
            if (tooltip)
                chartSubtitleElement.title = tooltip;

            let chartFlexContainerElement = chartElement.appendChild(document.createElement("div"));
            chartFlexContainerElement.classList.add("container");
            return chartFlexContainerElement;
        }

        function appendLegendRow(legendElement, sampleType) {
            let rowElement = legendElement.appendChild(document.createElement("div"));
            rowElement.classList.add("row");

            let swatchElement = rowElement.appendChild(document.createElement("div"));
            swatchElement.classList.add("swatch", sampleType);

            let valueContainer = rowElement.appendChild(document.createElement("div"));

            let labelElement = valueContainer.appendChild(document.createElement("div"));
            labelElement.classList.add("label");
            labelElement.textContent = WI.CPUTimelineView.displayNameForSampleType(sampleType);

            let sizeElement = valueContainer.appendChild(document.createElement("div"));
            sizeElement.classList.add("size");

            return sizeElement;
        }

        let breakdownChartContainerElement = createChartContainer(overviewElement, WI.UIString("Main Thread"), WI.UIString("Breakdown of time spent on the main thread"));
        this._breakdownChart = new WI.CircleChart({size: 120, innerRadiusRatio: 0.5});
        this._breakdownChart.segments = Object.values(WI.CPUTimelineView.SampleType);
        this.addSubview(this._breakdownChart);
        breakdownChartContainerElement.appendChild(this._breakdownChart.element);

        this._breakdownLegendElement = breakdownChartContainerElement.appendChild(document.createElement("div"));
        this._breakdownLegendElement.classList.add("legend");

        this._breakdownLegendScriptElement = appendLegendRow(this._breakdownLegendElement, CPUTimelineView.SampleType.JavaScript);
        this._breakdownLegendLayoutElement = appendLegendRow(this._breakdownLegendElement, CPUTimelineView.SampleType.Layout);
        this._breakdownLegendPaintElement = appendLegendRow(this._breakdownLegendElement, CPUTimelineView.SampleType.Paint);
        this._breakdownLegendStyleElement = appendLegendRow(this._breakdownLegendElement, CPUTimelineView.SampleType.Style);

        let dividerElement = overviewElement.appendChild(document.createElement("div"));
        dividerElement.classList.add("divider");

        let energyContainerElement = createChartContainer(overviewElement, WI.UIString("Energy Impact"), WI.UIString("Estimated energy impact."));
        energyContainerElement.classList.add("energy");

        let energyChartElement = energyContainerElement.parentElement;
        let energySubtitleElement = energyChartElement.firstChild;
        let energyInfoElement = energySubtitleElement.appendChild(document.createElement("span"));
        energyInfoElement.classList.add("info", WI.Popover.IgnoreAutoDismissClassName);
        energyInfoElement.textContent = "?";

        this._energyInfoPopover = null;
        this._energyInfoPopoverContentElement = null;
        energyInfoElement.addEventListener("click", (event) => {
            if (!this._energyInfoPopover)
                this._energyInfoPopover = new WI.Popover;

            if (!this._energyInfoPopoverContentElement) {
                this._energyInfoPopoverContentElement = document.createElement("div");
                this._energyInfoPopoverContentElement.className = "energy-info-popover-content";

                const precision = 0;
                let lowPercent = Number.percentageString(CPUTimelineView.lowEnergyThreshold / 100, precision);

                let p1 = this._energyInfoPopoverContentElement.appendChild(document.createElement("p"));
                p1.textContent = WI.UIString("Periods of high CPU utilization will rapidly drain battery. Strive to keep idle pages under %s average CPU utilization.").format(lowPercent);

                let p2 = this._energyInfoPopoverContentElement.appendChild(document.createElement("p"));
                p2.textContent = WI.UIString("There is an incurred energy penalty each time the page enters script. This commonly happens with timers, event handlers, and observers.");

                let p3 = this._energyInfoPopoverContentElement.appendChild(document.createElement("p"));
                p3.textContent = WI.UIString("To improve CPU utilization reduce or batch workloads when the page is not visible or during times when the page is not being interacted with.");
            }

            let isRTL = WI.resolvedLayoutDirection() === WI.LayoutDirection.RTL;
            let preferredEdges = isRTL ? [WI.RectEdge.MAX_Y, WI.RectEdge.MIN_X] : [WI.RectEdge.MAX_Y, WI.RectEdge.MAX_X];
            let calculateTargetFrame = () => WI.Rect.rectFromClientRect(energyInfoElement.getBoundingClientRect()).pad(3);

            this._energyInfoPopover.presentNewContentWithFrame(this._energyInfoPopoverContentElement, calculateTargetFrame(), preferredEdges);
            this._energyInfoPopover.windowResizeHandler = () => {
                this._energyInfoPopover.present(calculateTargetFrame(), preferredEdges);
            };
        });

        this._energyChart = new WI.GaugeChart({
            height: 110,
            strokeWidth: 20,
            segments: [
                {className: "low", limit: CPUTimelineView.lowEnergyGraphBoundary},
                {className: "medium", limit: CPUTimelineView.mediumEnergyGraphBoundary},
                {className: "high", limit: CPUTimelineView.highEnergyGraphBoundary},
            ]
        });
        this.addSubview(this._energyChart);
        energyContainerElement.appendChild(this._energyChart.element);

        let energyTextContainerElement = energyContainerElement.appendChild(document.createElement("div"));

        this._energyImpactLabelElement = energyTextContainerElement.appendChild(document.createElement("div"));
        this._energyImpactLabelElement.className = "energy-impact";

        this._energyImpactNumberElement = energyTextContainerElement.appendChild(document.createElement("div"));
        this._energyImpactNumberElement.className = "energy-impact-number";

        this._energyImpactDurationElement = energyTextContainerElement.appendChild(document.createElement("div"));
        this._energyImpactDurationElement.className = "energy-impact-number";

        let detailsContainerElement = contentElement.appendChild(document.createElement("div"));
        detailsContainerElement.classList.add("details");

        this._timelineRuler = new WI.TimelineRuler;
        this._timelineRuler.zeroTime = this.zeroTime;
        this._timelineRuler.startTime = this.startTime;
        this._timelineRuler.endTime = this.endTime;

        this.addSubview(this._timelineRuler);
        detailsContainerElement.appendChild(this._timelineRuler.element);

        // Cause the TimelineRuler to layout now so we will have some of its
        // important properties initialized for our layout.
        this._timelineRuler.updateLayout(WI.View.LayoutReason.Resize);

        let detailsSubtitleElement = detailsContainerElement.appendChild(document.createElement("div"));
        detailsSubtitleElement.classList.add("subtitle");
        detailsSubtitleElement.textContent = WI.UIString("CPU Usage");

        this._cpuUsageView = new WI.CPUUsageCombinedView(WI.UIString("Total"));
        this.addSubview(this._cpuUsageView);
        detailsContainerElement.appendChild(this._cpuUsageView.element);

        this._cpuUsageView.rangeChart.element.addEventListener("click", this._handleIndicatorClick.bind(this));

        this._threadsDetailsElement = detailsContainerElement.appendChild(document.createElement("details"));
        this._threadsDetailsElement.open = WI.settings.cpuTimelineThreadDetailsExpanded.value;
        this._threadsDetailsElement.addEventListener("toggle", (event) => {
            WI.settings.cpuTimelineThreadDetailsExpanded.value = this._threadsDetailsElement.open;
            if (this._threadsDetailsElement.open)
                this.updateLayout(WI.CPUTimelineView.LayoutReason.Internal);
        });

        let threadsSubtitleElement = this._threadsDetailsElement.appendChild(document.createElement("summary"));
        threadsSubtitleElement.classList.add("subtitle", "threads", "expandable");
        threadsSubtitleElement.textContent = WI.UIString("Threads");

        this._mainThreadUsageView = new WI.CPUUsageView(WI.UIString("Main Thread"));
        this._mainThreadUsageView.element.classList.add("main-thread");
        this.addSubview(this._mainThreadUsageView);
        this._threadsDetailsElement.appendChild(this._mainThreadUsageView.element);

        this._webkitThreadUsageView = new WI.CPUUsageView(WI.UIString("WebKit Threads"));
        this.addSubview(this._webkitThreadUsageView);
        this._threadsDetailsElement.appendChild(this._webkitThreadUsageView.element);

        this._unknownThreadUsageView = new WI.CPUUsageView(WI.UIString("Other Threads"));
        this.addSubview(this._unknownThreadUsageView);
        this._threadsDetailsElement.appendChild(this._unknownThreadUsageView.element);

        this._workerViews = [];

        this._sourcesFilter = {
            timer: new Set,
            event: new Set,
            observer: new Set,
        };

        let bottomOverviewElement = contentElement.appendChild(document.createElement("div"));
        bottomOverviewElement.classList.add("overview");

        let statisticsContainerElement = createChartContainer(bottomOverviewElement, WI.UIString("Statistics"));
        statisticsContainerElement.classList.add("stats");

        this._statisticsTable = statisticsContainerElement.appendChild(document.createElement("table"));
        this._statisticsRows = [];

        {
            let {headerCell, numberCell} = this._createTableRow(this._statisticsTable);
            headerCell.textContent = WI.UIString("Network Requests:");
            this._networkRequestsNumberElement = numberCell;
        }
        {
            let {headerCell, numberCell} = this._createTableRow(this._statisticsTable);
            headerCell.textContent = WI.UIString("Script Entries:");
            this._scriptEntriesNumberElement = numberCell;
        }

        this._clearStatistics();

        let bottomDividerElement = bottomOverviewElement.appendChild(document.createElement("div"));
        bottomDividerElement.classList.add("divider");

        let sourcesContainerElement = createChartContainer(bottomOverviewElement, WI.UIString("Sources"));
        sourcesContainerElement.classList.add("stats");

        this._sourcesTable = sourcesContainerElement.appendChild(document.createElement("table"));
        this._sourcesRows = [];

        {
            let {row, headerCell, numberCell, labelCell} = this._createTableRow(this._sourcesTable);
            headerCell.textContent = WI.UIString("Filter:");
            this._sourcesFilterRow = row;
            this._sourcesFilterRow.hidden = true;
            this._sourcesFilterNumberElement = numberCell;
            this._sourcesFilterLabelElement = labelCell;

            let filterClearElement = numberCell.appendChild(document.createElement("span"));
            filterClearElement.className = "filter-clear";
            filterClearElement.textContent = multiplicationSign;
            filterClearElement.addEventListener("click", (event) => {
                this._resetSourcesFilters();
                this._layoutStatisticsAndSources();
            });
        }
        {
            let {row, headerCell, numberCell, labelCell} = this._createTableRow(this._sourcesTable);
            headerCell.textContent = WI.UIString("Timers:");
            this._timerInstallationsRow = row;
            this._timerInstallationsNumberElement = numberCell;
            this._timerInstallationsLabelElement = labelCell;
        }
        {
            let {row, headerCell, numberCell, labelCell} = this._createTableRow(this._sourcesTable);
            headerCell.textContent = WI.UIString("Event Handlers:");
            this._eventHandlersRow = row;
            this._eventHandlersNumberElement = numberCell;
            this._eventHandlersLabelElement = labelCell;
        }
        {
            let {row, headerCell, numberCell, labelCell} = this._createTableRow(this._sourcesTable);
            headerCell.textContent = WI.UIString("Observer Handlers:");
            this._observerHandlersRow = row;
            this._observerHandlersNumberElement = numberCell;
            this._observerHandlersLabelElement = labelCell;
        }

        this._clearSources();

        this.element.addEventListener("click", this._handleGraphClick.bind(this));
        this.element.addEventListener("mousemove", this._handleGraphMouseMove.bind(this));

        this._overlayMarker = new WI.TimelineMarker(-1, WI.TimelineMarker.Type.TimeStamp);
        this._timelineRuler.addMarker(this._overlayMarker);
    }

    layout()
    {
        if (this.layoutReason === WI.View.LayoutReason.Resize)
            return;

        if (this.layoutReason !== WI.CPUTimelineView.LayoutReason.Internal)
            this._sectionLimit = CPUTimelineView.defaultSectionLimit;

        // Always update timeline ruler.
        this._timelineRuler.zeroTime = this.zeroTime;
        this._timelineRuler.startTime = this.startTime;
        this._timelineRuler.endTime = this.endTime;

        let secondsPerPixel = this._timelineRuler.secondsPerPixel;
        if (!secondsPerPixel)
            return;

        let graphStartTime = this.startTime;
        let graphEndTime = this.endTime;

        // When viewing a timeline recording from JSON, this.currentTime is always 0.
        let visibleEndTime = Math.min(this.endTime, this.currentTime) || this.endTime;
        let visibleDuration = visibleEndTime - graphStartTime;

        let discontinuities = this._recording.discontinuitiesInTimeRange(graphStartTime, visibleEndTime);
        let originalDiscontinuities = discontinuities.slice();

        let visibleRecords = this.representedObject.recordsInTimeRange(graphStartTime, visibleEndTime, {
            includeRecordBeforeStart: !discontinuities.length || discontinuities[0].startTime > graphStartTime,
            includeRecordAfterEnd: true,
        });
        if (!visibleRecords.length || (visibleRecords.length === 1 && visibleRecords[0].endTime < graphStartTime)) {
            this.clear();
            return;
        }

        this._secondsPerPixelInLayout = secondsPerPixel;
        this._visibleRecordsInLayout = visibleRecords;
        this._discontinuitiesInLayout = discontinuities.slice();

        this._statisticsData = this._computeStatisticsData(graphStartTime, visibleEndTime);
        this._layoutBreakdownChart();
        this._layoutStatisticsAndSources();

        let dataPoints = [];
        let workersDataMap = new Map;
        let workersSeenInCurrentRecord = new Set;

        let max = -Infinity;
        let mainThreadMax = -Infinity;
        let webkitThreadMax = -Infinity;
        let unknownThreadMax = -Infinity;
        let workerMax = -Infinity;

        let min = Infinity;
        let mainThreadMin = Infinity;
        let webkitThreadMin = Infinity;
        let unknownThreadMin = Infinity;

        let average = 0;
        let mainThreadAverage = 0;
        let webkitThreadAverage = 0;
        let unknownThreadAverage = 0;

        for (let record of visibleRecords) {
            let time = record.timestamp;
            let {usage, mainThreadUsage, workerThreadUsage, webkitThreadUsage, unknownThreadUsage} = record;

            if (discontinuities.length && discontinuities[0].endTime <= time) {
                let startDiscontinuity = discontinuities.shift();
                let endDiscontinuity = startDiscontinuity;
                while (discontinuities.length && discontinuities[0].endTime <= time)
                    endDiscontinuity = discontinuities.shift();

                if (dataPoints.length) {
                    let previousDataPoint = dataPoints.lastValue;
                    dataPoints.push({
                        time: startDiscontinuity.startTime,
                        mainThreadUsage: previousDataPoint.mainThreadUsage,
                        workerThreadUsage: previousDataPoint.workerThreadUsage,
                        webkitThreadUsage: previousDataPoint.webkitThreadUsage,
                        unknownThreadUsage: previousDataPoint.unknownThreadUsage,
                        usage: previousDataPoint.usage,
                    });
                }

                dataPoints.push({time: startDiscontinuity.startTime, mainThreadUsage: 0, workerThreadUsage: 0, webkitThreadUsage: 0, unknownThreadUsage: 0, usage: 0});
                dataPoints.push({time: endDiscontinuity.endTime, mainThreadUsage: 0, workerThreadUsage: 0, webkitThreadUsage: 0, unknownThreadUsage: 0, usage: 0});
                dataPoints.push({time: endDiscontinuity.endTime, mainThreadUsage, workerThreadUsage, webkitThreadUsage, unknownThreadUsage, usage});
            }

            dataPoints.push({time, mainThreadUsage, workerThreadUsage, webkitThreadUsage, unknownThreadUsage, usage});

            max = Math.max(max, usage);
            mainThreadMax = Math.max(mainThreadMax, mainThreadUsage);
            webkitThreadMax = Math.max(webkitThreadMax, webkitThreadUsage);
            unknownThreadMax = Math.max(unknownThreadMax, unknownThreadUsage);

            min = Math.min(min, usage);
            mainThreadMin = Math.min(mainThreadMin, mainThreadUsage);
            webkitThreadMin = Math.min(webkitThreadMin, webkitThreadUsage);
            unknownThreadMin = Math.min(unknownThreadMin, unknownThreadUsage);

            average += usage;
            mainThreadAverage += mainThreadUsage;
            webkitThreadAverage += webkitThreadUsage;
            unknownThreadAverage += unknownThreadUsage;

            let workersSeenInLastRecord = workersSeenInCurrentRecord;
            workersSeenInCurrentRecord = new Set;

            if (record.workersData && record.workersData.length) {
                for (let {targetId, usage} of record.workersData) {
                    workersSeenInCurrentRecord.add(targetId);
                    let workerData = workersDataMap.get(targetId);
                    if (!workerData) {
                        workerData = {
                            discontinuities: originalDiscontinuities.slice(),
                            recordsCount: 0,
                            dataPoints: [],
                            min: Infinity,
                            max: -Infinity,
                            average: 0
                        };

                        while (workerData.discontinuities.length && workerData.discontinuities[0].endTime <= graphStartTime)
                            workerData.discontinuities.shift();
                        workerData.dataPoints.push({time: graphStartTime, usage: 0});
                        workerData.dataPoints.push({time, usage: 0});
                        workersDataMap.set(targetId, workerData);
                    }

                    if (workerData.discontinuities.length && workerData.discontinuities[0].endTime < time) {
                        let startDiscontinuity = workerData.discontinuities.shift();
                        let endDiscontinuity = startDiscontinuity;
                        while (workerData.discontinuities.length && workerData.discontinuities[0].endTime < time)
                            endDiscontinuity = workerData.discontinuities.shift();
                        if (workerData.dataPoints.length) {
                            let previousDataPoint = workerData.dataPoints.lastValue;
                            workerData.dataPoints.push({time: startDiscontinuity.startTime, usage: previousDataPoint.usage});
                        }
                        workerData.dataPoints.push({time: startDiscontinuity.startTime, usage: 0});
                        workerData.dataPoints.push({time: endDiscontinuity.endTime, usage: 0});
                        workerData.dataPoints.push({time: endDiscontinuity.endTime, usage});
                    }

                    workerData.dataPoints.push({time, usage});
                    workerData.recordsCount += 1;
                    workerData.max = Math.max(workerData.max, usage);
                    workerData.min = Math.min(workerData.min, usage);
                    workerData.average += usage;
                }
            }

            // Close any worker that died by dropping to zero.
            if (workersSeenInLastRecord.size) {
                let deadWorkers = workersSeenInLastRecord.difference(workersSeenInCurrentRecord);
                for (let workerId of deadWorkers) {
                    let workerData = workersDataMap.get(workerId);
                    if (workerData.dataPoints.lastValue.usage !== 0)
                        workerData.dataPoints.push({time, usage: 0});
                }
            }
        }

        average /= visibleRecords.length;
        mainThreadAverage /= visibleRecords.length;
        webkitThreadAverage /= visibleRecords.length;
        unknownThreadAverage /= visibleRecords.length;

        for (let [workerId, workerData] of workersDataMap) {
            workerData.average = workerData.average / workerData.recordsCount;
            if (workerData.max > workerMax)
                workerMax = workerData.max;
        }

        // If the graph end time is inside a gap, the last data point should
        // only be extended to the start of the discontinuity.
        if (discontinuities.length)
            visibleEndTime = discontinuities[0].startTime;

        function bestThreadLayoutMax(value) {
            if (value > 100)
                return Math.ceil(value);
            return (Math.floor(value / 25) + 1) * 25;
        }

        function removeGreaterThan(arr, max) {
            return arr.filter((x) => x <= max);
        }

        function markerValuesForMaxValue(max) {
            if (max < 1)
                return [0.5];
            if (max < 7)
                return removeGreaterThan([1, 3, 5], max);
            if (max < 12.5)
                return removeGreaterThan([5, 10], max);
            if (max < 20)
                return removeGreaterThan([5, 10, 15], max);
            if (max < 30)
                return removeGreaterThan([10, 20, 30], max);
            if (max < 50)
                return removeGreaterThan([15, 30, 45], max);
            if (max < 100)
                return removeGreaterThan([25, 50, 75], max);
            if (max < 200)
                return removeGreaterThan([50, 100, 150], max);
            if (max >= 200) {
                let hundreds = Math.floor(max / 100);
                let even = (hundreds % 2) === 0;
                if (even) {
                    let top = hundreds * 100;
                    let bottom = top / 2;
                    return [bottom, top];
                }
                let top = hundreds * 100;
                let bottom = 100;
                let mid = (top + bottom) / 2;
                return [bottom, mid, top];
            }
        }

        function layoutView(view, property, graphHeight, layoutMax, {dataPoints, min, max, average}) {
            if (min === Infinity)
                min = 0;
            if (max === -Infinity)
                max = 0;
            if (layoutMax === -Infinity)
                layoutMax = 0;

            let isAllThreadsGraph = property === null;

            let graphMax = layoutMax * 1.05;

            function xScale(time) {
                return (time - graphStartTime) / secondsPerPixel;
            }

            let size = new WI.Size(xScale(graphEndTime), graphHeight);

            function yScale(value) {
                return size.height - ((value / graphMax) * size.height);
            }

            view.updateChart(dataPoints, size, visibleEndTime, min, max, average, xScale, yScale, property);

            let markersElement = view.chart.element.querySelector(".markers");
            if (!markersElement) {
                markersElement = view.chart.element.appendChild(document.createElement("div"));
                markersElement.className = "markers";
            }
            markersElement.removeChildren();

            let markerValues;
            if (isAllThreadsGraph)
                markerValues = markerValuesForMaxValue(max);
            else {
                const minimumMarkerTextHeight = 17;
                let percentPerPixel = 1 / (graphHeight / layoutMax);
                if (layoutMax < 5) {
                    let minimumDisplayablePercentByTwo = Math.ceil((minimumMarkerTextHeight * percentPerPixel) / 2) * 2;
                    markerValues = [Math.max(minimumDisplayablePercentByTwo, Math.floor(max))];
                } else {
                    let minimumDisplayablePercentByFive = Math.ceil((minimumMarkerTextHeight * percentPerPixel) / 5) * 5;
                    markerValues = [Math.max(minimumDisplayablePercentByFive, Math.floor(max))];
                }
            }

            for (let value of markerValues) {
                let marginTop = yScale(value);

                let markerElement = markersElement.appendChild(document.createElement("div"));
                markerElement.style.marginTop = marginTop.toFixed(2) + "px";

                let labelElement = markerElement.appendChild(document.createElement("span"));
                labelElement.classList.add("label");
                const precision = 0;
                labelElement.innerText = Number.percentageString(value / 100, precision);
            }
        }

        // Layout the combined graph to the maximum total CPU usage.
        // Layout all the thread graphs to the same time scale, the maximum across threads / thread groups.
        this._layoutMax = max;
        this._threadLayoutMax = bestThreadLayoutMax(Math.max(mainThreadMax, webkitThreadMax, unknownThreadMax, workerMax));

        layoutView(this._cpuUsageView, null, CPUTimelineView.cpuUsageViewHeight, this._layoutMax, {dataPoints, min, max, average});

        if (this._threadsDetailsElement.open) {
            layoutView(this._mainThreadUsageView, "mainThreadUsage", CPUTimelineView.threadCPUUsageViewHeight, this._threadLayoutMax, {dataPoints, min: mainThreadMin, max: mainThreadMax, average: mainThreadAverage});
            layoutView(this._webkitThreadUsageView, "webkitThreadUsage", CPUTimelineView.threadCPUUsageViewHeight, this._threadLayoutMax, {dataPoints, min: webkitThreadMin, max: webkitThreadMax, average: webkitThreadAverage});
            layoutView(this._unknownThreadUsageView, "unknownThreadUsage", CPUTimelineView.threadCPUUsageViewHeight, this._threadLayoutMax, {dataPoints, min: unknownThreadMin, max: unknownThreadMax, average: unknownThreadAverage});

            this._removeWorkerThreadViews();

            for (let [workerId, workerData] of workersDataMap) {
                let worker = WI.targetManager.targetForIdentifier(workerId);
                let displayName = worker ? worker.displayName : WI.UIString("Worker Thread");
                let workerView = new WI.CPUUsageView(displayName);
                workerView.element.classList.add("worker-thread");
                workerView.__workerId = workerId;
                this.addSubview(workerView);
                this._threadsDetailsElement.insertBefore(workerView.element, this._webkitThreadUsageView.element);
                this._workerViews.push(workerView);

                layoutView(workerView, "usage", CPUTimelineView.threadCPUUsageViewHeight, this._threadLayoutMax, {dataPoints: workerData.dataPoints, min: workerData.min, max: workerData.max, average: workerData.average});
            }
        }

        function xScaleIndicatorRange(sampleIndex) {
            return (sampleIndex / 1000) / secondsPerPixel;
        }

        let graphWidth = (graphEndTime - graphStartTime) / secondsPerPixel;
        let size = new WI.Size(graphWidth, CPUTimelineView.indicatorViewHeight);
        this._cpuUsageView.updateMainThreadIndicator(this._statisticsData.samples, size, visibleEndTime, xScaleIndicatorRange);

        this._layoutEnergyChart(average, visibleDuration);

        this._updateGraphOverlay();
    }

    // Private

    _layoutBreakdownChart()
    {
        let {samples, samplesScript, samplesLayout, samplesPaint, samplesStyle, samplesIdle} = this._statisticsData;

        let nonIdleSamplesCount = samples.length - samplesIdle;
        if (!nonIdleSamplesCount) {
            this._breakdownChart.clear();
            this._breakdownChart.needsLayout();
            this._clearBreakdownLegend();
            return;
        }

        let percentScript = samplesScript / nonIdleSamplesCount;
        let percentLayout = samplesLayout / nonIdleSamplesCount;
        let percentPaint = samplesPaint / nonIdleSamplesCount;
        let percentStyle = samplesStyle / nonIdleSamplesCount;

        this._breakdownLegendScriptElement.textContent = `${Number.percentageString(percentScript)} (${samplesScript})`;
        this._breakdownLegendLayoutElement.textContent = `${Number.percentageString(percentLayout)} (${samplesLayout})`;
        this._breakdownLegendPaintElement.textContent = `${Number.percentageString(percentPaint)} (${samplesPaint})`;
        this._breakdownLegendStyleElement.textContent = `${Number.percentageString(percentStyle)} (${samplesStyle})`;

        this._breakdownChart.values = [percentScript * 100, percentLayout * 100, percentPaint * 100, percentStyle * 100];
        this._breakdownChart.needsLayout();

        let centerElement = this._breakdownChart.centerElement;
        let samplesElement = centerElement.firstChild;
        if (!samplesElement) {
            samplesElement = centerElement.appendChild(document.createElement("div"));
            samplesElement.classList.add("samples");
            samplesElement.title = WI.UIString("Time spent on the main thread");
        }

        let millisecondsStringNoDecimal = WI.UIString("%.0fms").format(nonIdleSamplesCount);
        samplesElement.textContent = millisecondsStringNoDecimal;
    }

    _layoutStatisticsAndSources()
    {
        this._layoutStatisticsSection();
        this._layoutSourcesSection();
    }

    _layoutStatisticsSection()
    {
        let statistics = this._statisticsData;

        this._clearStatistics();

        this._networkRequestsNumberElement.textContent = statistics.networkRequests;
        this._scriptEntriesNumberElement.textContent = statistics.scriptEntries;

        let createFilterElement = (type, name) => {
            let span = document.createElement("span");
            span.className = "filter";
            span.textContent = name;
            span.addEventListener("mouseup", (event) => {
                if (span.classList.contains("active"))
                    this._removeSourcesFilter(type, name);
                else
                    this._addSourcesFilter(type, name);

                this._layoutStatisticsAndSources();
            });

            span.classList.toggle("active", this._sourcesFilter[type].has(name));

            return span;
        };

        let expandAllSections = () => {
            this._sectionLimit = Infinity;
            this._layoutStatisticsAndSources();
        };

        function createEllipsisElement() {
            let span = document.createElement("span");
            span.className = "show-more";
            span.role = "button";
            span.textContent = ellipsis;
            span.addEventListener("click", (event) => {
                expandAllSections();
            });
            return span;
        }

        // Sort a Map of key => count values in descending order.
        function sortMapByEntryCount(map) {
            let entries = Array.from(map);
            entries.sort((entryA, entryB) => entryB[1] - entryA[1]);
            return new Map(entries);
        }

        if (statistics.timerTypes.size) {
            let i = 0;
            let sorted = sortMapByEntryCount(statistics.timerTypes);
            for (let [timerType, count] of sorted) {
                let headerValue = i === 0 ? WI.UIString("Timers:") : "";
                let timerTypeElement = createFilterElement("timer", timerType);
                this._insertTableRow(this._statisticsTable, this._statisticsRows, {headerValue, numberValue: count, labelValue: timerTypeElement});

                if (++i === this._sectionLimit && sorted.size > this._sectionLimit) {
                    this._insertTableRow(this._statisticsTable, this._statisticsRows, {labelValue: createEllipsisElement()});
                    break;
                }
            }
        }

        if (statistics.eventTypes.size) {
            let i = 0;
            let sorted = sortMapByEntryCount(statistics.eventTypes);
            for (let [eventType, count] of sorted) {
                let headerValue = i === 0 ? WI.UIString("Events:") : "";
                let eventTypeElement = createFilterElement("event", eventType);
                this._insertTableRow(this._statisticsTable, this._statisticsRows, {headerValue, numberValue: count, labelValue: eventTypeElement});

                if (++i === this._sectionLimit && sorted.size > this._sectionLimit) {
                    this._insertTableRow(this._statisticsTable, this._statisticsRows, {labelValue: createEllipsisElement()});
                    break;
                }
            }
        }

        if (statistics.observerTypes.size) {
            let i = 0;
            let sorted = sortMapByEntryCount(statistics.observerTypes);
            for (let [observerType, count] of sorted) {
                let headerValue = i === 0 ? WI.UIString("Observers:") : "";
                let observerTypeElement = createFilterElement("observer", observerType);
                this._insertTableRow(this._statisticsTable, this._statisticsRows, {headerValue, numberValue: count, labelValue: observerTypeElement});

                if (++i === this._sectionLimit && sorted.size > this._sectionLimit) {
                    this._insertTableRow(this._statisticsTable, this._statisticsRows, {labelValue: createEllipsisElement()});
                    break;
                }
            }
        }
    }

    _layoutSourcesSection()
    {
        let statistics = this._statisticsData;

        this._clearSources();

        const unknownLocationKey = "unknown";

        function keyForSourceCodeLocation(sourceCodeLocation) {
            if (!sourceCodeLocation)
                return unknownLocationKey;

            return sourceCodeLocation.sourceCode.url + ":" + sourceCodeLocation.lineNumber + ":" + sourceCodeLocation.columnNumber;
        }

        function labelForLocation(key, sourceCodeLocation, functionName) {
            if (key === unknownLocationKey) {
                let span = document.createElement("span");
                span.className = "unknown";
                span.textContent = WI.UIString("Unknown Location");
                return span;
            }

            const options = {
                nameStyle: WI.SourceCodeLocation.NameStyle.Short,
                columnStyle: WI.SourceCodeLocation.ColumnStyle.Shown,
                dontFloat: true,
                ignoreNetworkTab: true,
                ignoreSearchTab: true,
            };
            return WI.createSourceCodeLocationLink(sourceCodeLocation, options);
        }

        let timerFilters = this._sourcesFilter.timer;
        let eventFilters = this._sourcesFilter.event;
        let observerFilters = this._sourcesFilter.observer;
        let hasFilters = (timerFilters.size || eventFilters.size || observerFilters.size);

        let sectionLimit = this._sectionLimit;
        if (isFinite(sectionLimit) && hasFilters)
            sectionLimit = CPUTimelineView.defaultSectionLimit * 2;

        let expandAllSections = () => {
            this._sectionLimit = Infinity;
            this._layoutStatisticsAndSources();
        };

        function createEllipsisElement() {
            let span = document.createElement("span");
            span.className = "show-more";
            span.role = "button";
            span.textContent = ellipsis;
            span.addEventListener("click", (event) => {
                expandAllSections();
            });
            return span;
        }

        let timerMap = new Map;
        let eventHandlerMap = new Map;
        let observerCallbackMap = new Map;
        let seenTimers = new Set;

        if (!hasFilters || timerFilters.size) {
            // Aggregate timers on the location where the timers were installed.
            // For repeating timers, this includes the total counts the interval fired in the selected time range.
            for (let record of statistics.timerInstallationRecords) {
                if (timerFilters.size) {
                    if (record.eventType === WI.ScriptTimelineRecord.EventType.AnimationFrameRequested && !timerFilters.has("requestAnimationFrame"))
                        continue;
                    if (record.eventType === WI.ScriptTimelineRecord.EventType.TimerInstalled && !timerFilters.has("setTimeout"))
                        continue;
                }

                let callFrame = record.initiatorCallFrame;
                let sourceCodeLocation = callFrame ? callFrame.sourceCodeLocation : record.sourceCodeLocation;
                let functionName = callFrame ? callFrame.functionName : "";
                let key = keyForSourceCodeLocation(sourceCodeLocation);
                let entry = timerMap.getOrInitialize(key, {sourceCodeLocation, functionName, count: 0, repeating: false});
                if (record.details) {
                    let timerIdentifier = record.details.timerId;
                    let repeatingEntry = statistics.repeatingTimers.get(timerIdentifier);
                    let count = repeatingEntry ? repeatingEntry.count : 1;
                    entry.count += count;
                    if (record.details.repeating)
                        entry.repeating = true;
                    seenTimers.add(timerIdentifier);
                } else
                    entry.count += 1;
            }

            // Aggregate repeating timers where we did not see the installation in the selected time range.
            // This will use the source code location of where the timer fired, which is better than nothing.
            if (!hasFilters || timerFilters.has("setTimeout")) {
                for (let [timerId, repeatingEntry] of statistics.repeatingTimers) {
                    if (seenTimers.has(timerId))
                        continue;
                    // FIXME: <https://webkit.org/b/195351> Web Inspector: CPU Usage Timeline - better resolution of installation source for repeated timers
                    // We could have a map of all repeating timer installations in the whole recording
                    // so that we can provide a function name for these repeating timers lacking an installation point.
                    let sourceCodeLocation = repeatingEntry.record.sourceCodeLocation;
                    let key = keyForSourceCodeLocation(sourceCodeLocation);
                    let entry = timerMap.getOrInitialize(key, {sourceCodeLocation, count: 0, repeating: false});
                    entry.count += repeatingEntry.count;
                    entry.repeating = true;
                }
            }
        }

        if (!hasFilters || eventFilters.size) {
            for (let record of statistics.eventHandlerRecords) {
                if (eventFilters.size && !eventFilters.has(record.details))
                    continue;
                let sourceCodeLocation = record.sourceCodeLocation;
                let key = keyForSourceCodeLocation(sourceCodeLocation);
                let entry = eventHandlerMap.getOrInitialize(key, {sourceCodeLocation, count: 0});
                entry.count += 1;
            }
        }

        if (!hasFilters || observerFilters.size) {
            for (let record of statistics.observerCallbackRecords) {
                if (observerFilters.size && !observerFilters.has(record.details))
                    continue;
                let sourceCodeLocation = record.sourceCodeLocation;
                let key = keyForSourceCodeLocation(record.sourceCodeLocation);
                let entry = observerCallbackMap.getOrInitialize(key, {sourceCodeLocation, count: 0});
                entry.count += 1;
            }
        }

        const headerValue = "";

        // Sort a Map of key => {count} objects in descending order.
        function sortMapByEntryCountProperty(map) {
            let entries = Array.from(map);
            entries.sort((entryA, entryB) => entryB[1].count - entryA[1].count);
            return new Map(entries);
        }

        if (timerMap.size) {
            let i = 0;
            let sorted = sortMapByEntryCountProperty(timerMap);
            for (let [key, entry] of sorted) {
                let numberValue = entry.repeating ? WI.UIString("~%s", "Approximate Number", "Approximate count of events").format(entry.count) : entry.count;
                let sourceCodeLocation = entry.callFrame ? entry.callFrame.sourceCodeLocation : entry.sourceCodeLocation;
                let labelValue = labelForLocation(key, sourceCodeLocation);
                let followingRow = this._eventHandlersRow;

                let row;
                if (i === 0) {
                    row = this._timerInstallationsRow;
                    this._timerInstallationsNumberElement.textContent = numberValue;
                    this._timerInstallationsLabelElement.append(labelValue);
                } else
                    row = this._insertTableRow(this._sourcesTable, this._sourcesRows, {headerValue, numberValue, labelValue, followingRow});

                if (entry.functionName)
                    row.querySelector(".label").append(` ${enDash} ${entry.functionName}`);

                if (++i === sectionLimit && sorted.size > sectionLimit) {
                    this._insertTableRow(this._sourcesTable, this._sourcesRows, {labelValue: createEllipsisElement(), followingRow});
                    break;
                }
            }
        }

        if (eventHandlerMap.size) {
            let i = 0;
            let sorted = sortMapByEntryCountProperty(eventHandlerMap);
            for (let [key, entry] of sorted) {
                let numberValue = entry.count;
                let labelValue = labelForLocation(key, entry.sourceCodeLocation);
                let followingRow = this._observerHandlersRow;

                if (i === 0) {
                    this._eventHandlersNumberElement.textContent = numberValue;
                    this._eventHandlersLabelElement.append(labelValue);
                } else
                    this._insertTableRow(this._sourcesTable, this._sourcesRows, {headerValue, numberValue, labelValue, followingRow});

                if (++i === sectionLimit && sorted.size > sectionLimit) {
                    this._insertTableRow(this._sourcesTable, this._sourcesRows, {labelValue: createEllipsisElement(), followingRow});
                    break;
                }
            }
        }

        if (observerCallbackMap.size) {
            let i = 0;
            let sorted = sortMapByEntryCountProperty(observerCallbackMap);
            for (let [key, entry] of sorted) {
                let numberValue = entry.count;
                let labelValue = labelForLocation(key, entry.sourceCodeLocation);

                if (i === 0) {
                    this._observerHandlersNumberElement.textContent = numberValue;
                    this._observerHandlersLabelElement.append(labelValue);
                } else
                    this._insertTableRow(this._sourcesTable, this._sourcesRows, {headerValue, numberValue, labelValue});

                if (++i === sectionLimit && sorted.size > sectionLimit) {
                    this._insertTableRow(this._sourcesTable, this._sourcesRows, {labelValue: createEllipsisElement()});
                    break;
                }
            }
        }
    }

    _layoutEnergyChart(average, visibleDuration)
    {
        // The lower the bias value [0..1], the more it increases the skew towards rangeHigh.
        function mapWithBias(value, rangeLow, rangeHigh, outputRangeLow, outputRangeHigh, bias) {
            console.assert(value >= rangeLow && value <= rangeHigh, "value was not in range.", value);
            let percentInRange = (value - rangeLow) / (rangeHigh - rangeLow);
            let skewedPercent = Math.pow(percentInRange, bias);
            let valueInOutputRange = (skewedPercent * (outputRangeHigh - outputRangeLow)) + outputRangeLow;
            return valueInOutputRange;
        }

        this._clearEnergyImpactText();

        if (average <= CPUTimelineView.lowEnergyThreshold) {
            // Low. (<=3% CPU, mapped to 0-10)
            this._energyImpactLabelElement.textContent = WI.UIString("Low", "Low @ Timeline Energy Impact", "Energy Impact: Low");
            this._energyImpactLabelElement.classList.add("low");
            this._energyChart.value = mapWithBias(average, 0, CPUTimelineView.lowEnergyThreshold, 0, CPUTimelineView.lowEnergyGraphBoundary, 0.85);
        } else if (average <= CPUTimelineView. mediumEnergyThreshold) {
            // Medium (3%-30% CPU, mapped to 10-70)
            this._energyImpactLabelElement.textContent = WI.UIString("Medium", "Medium @ Timeline Energy Impact", "Energy Impact: Medium")
            this._energyImpactLabelElement.classList.add("medium");
            this._energyChart.value = mapWithBias(average, CPUTimelineView.lowEnergyThreshold, CPUTimelineView.mediumEnergyThreshold, CPUTimelineView.lowEnergyGraphBoundary, CPUTimelineView.mediumEnergyGraphBoundary, 0.6);
        } else if (average < CPUTimelineView. highEnergyThreshold) {
            // High. (30%-100% CPU, mapped to 70-100)
            this._energyImpactLabelElement.textContent = WI.UIString("High", "High @ Timeline Energy Impact", "Energy Impact: High")
            this._energyImpactLabelElement.classList.add("high");
            this._energyChart.value = mapWithBias(average, CPUTimelineView.mediumEnergyThreshold, CPUTimelineView.highEnergyThreshold, CPUTimelineView.mediumEnergyGraphBoundary, CPUTimelineView.highEnergyGraphBoundary, 0.9);
        } else {
            // Very High. (>100% CPU, mapped to 100)
            this._energyImpactLabelElement.textContent = WI.UIString("Very High", "Very High @ Timeline Energy Impact", "Energy Impact: Very High")
            this._energyImpactLabelElement.classList.add("high");
            this._energyChart.value = 100;
        }

        this._energyChart.needsLayout();

        this._energyImpactNumberElement.textContent = WI.UIString("Average CPU: %s").format(Number.percentageString(average / 100));

        if (visibleDuration < 5)
            this._energyImpactDurationElement.textContent = WI.UIString("Duration: Short");
        else {
            let durationDisplayString = Math.floor(visibleDuration);
            this._energyImpactDurationElement.textContent = WI.UIString("Duration: %ss", "The duration of the Timeline recording in seconds (s).").format(durationDisplayString);
        }
    }

    _computeStatisticsData(startTime, endTime)
    {
        // Compute per-millisecond samples of what the main thread was doing.
        // We construct an array for every millisecond between the start and end time
        // and mark each millisecond with the best representation of the work that
        // was being done at that time. We start by populating the samples with
        // all of the script periods and then override with layout and rendering
        // samples. This means a forced layout would be counted as a layout:
        //
        // Initial:        [ ------, ------, ------, ------, ------ ]
        // Script Samples: [ ------, Script, Script, Script, ------ ]
        // Layout Samples: [ ------, Script, Layout, Script, ------ ]
        //
        // The undefined samples are considered Idle, but in actuality WebKit
        // may have been doing some work (such as hit testing / inspector protocol)
        // that is not included it in generic Timeline data. This just works with
        // with the data available to the frontend and is quite accurate for most
        // Main Thread activity.

        function incrementTypeCount(map, key) {
            let entry = map.get(key);
            if (entry)
                map.set(key, entry + 1);
            else
                map.set(key, 1);
        }

        let timerInstallationRecords = [];
        let eventHandlerRecords = [];
        let observerCallbackRecords = [];
        let scriptEntries = 0;
        let timerTypes = new Map;
        let eventTypes = new Map;
        let observerTypes = new Map;

        let repeatingTimers = new Map;
        let possibleRepeatingTimers = new Set;

        let scriptTimeline = this._recording.timelineForRecordType(WI.TimelineRecord.Type.Script);
        let scriptRecords = scriptTimeline ? scriptTimeline.recordsInTimeRange(startTime, endTime, {includeRecordBeforeStart: true}) : [];
        scriptRecords = scriptRecords.filter((record) => {
            // Return true for event types that define script entries/exits.
            // Return false for events with no time ranges or if they are contained in other events.
            switch (record.eventType) {
            case WI.ScriptTimelineRecord.EventType.ScriptEvaluated:
            case WI.ScriptTimelineRecord.EventType.APIScriptEvaluated:
                scriptEntries++;
                return true;

            case WI.ScriptTimelineRecord.EventType.ObserverCallback:
                incrementTypeCount(observerTypes, record.details);
                observerCallbackRecords.push(record);
                scriptEntries++;
                return true;

            case WI.ScriptTimelineRecord.EventType.EventDispatched:
                incrementTypeCount(eventTypes, record.details);
                eventHandlerRecords.push(record);
                scriptEntries++;
                return true;

            case WI.ScriptTimelineRecord.EventType.MicrotaskDispatched:
                // Do not normally count this as a script entry, but they may have a time range
                // that is not covered by script entry (queueMicrotask).
                return true;

            case WI.ScriptTimelineRecord.EventType.TimerFired:
                incrementTypeCount(timerTypes, "setTimeout");
                if (possibleRepeatingTimers.has(record.details)) {
                    let entry = repeatingTimers.get(record.details);
                    if (entry)
                        entry.count += 1;
                    else
                        repeatingTimers.set(record.details, {record, count: 1});
                } else
                    possibleRepeatingTimers.add(record.details);
                scriptEntries++;
                return true;

            case WI.ScriptTimelineRecord.EventType.AnimationFrameFired:
                incrementTypeCount(timerTypes, "requestAnimationFrame");
                scriptEntries++;
                return true;

            case WI.ScriptTimelineRecord.EventType.AnimationFrameRequested:
            case WI.ScriptTimelineRecord.EventType.TimerInstalled:
                // These event types have no time range, or are contained by the others.
                timerInstallationRecords.push(record);
                return false;

            case WI.ScriptTimelineRecord.EventType.AnimationFrameCanceled:
            case WI.ScriptTimelineRecord.EventType.TimerRemoved:
            case WI.ScriptTimelineRecord.EventType.ProbeSampleRecorded:
            case WI.ScriptTimelineRecord.EventType.ConsoleProfileRecorded:
            case WI.ScriptTimelineRecord.EventType.GarbageCollected:
                // These event types have no time range, or are contained by the others.
                return false;

            default:
                console.error("Unhandled ScriptTimelineRecord.EventType", record.eventType);
                return false;
            }
        });

        let layoutTimeline = this._recording.timelineForRecordType(WI.TimelineRecord.Type.Layout);
        let layoutRecords = layoutTimeline ? layoutTimeline.recordsInTimeRange(startTime, endTime, {includeRecordBeforeStart: true}) : [];
        layoutRecords = layoutRecords.filter((record) => {
            switch (record.eventType) {
            case WI.LayoutTimelineRecord.EventType.RecalculateStyles:
            case WI.LayoutTimelineRecord.EventType.ForcedLayout:
            case WI.LayoutTimelineRecord.EventType.Layout:
            case WI.LayoutTimelineRecord.EventType.Paint:
            case WI.LayoutTimelineRecord.EventType.Composite:
                // These event types define layout and rendering entry/exits.
                return true;

            case WI.LayoutTimelineRecord.EventType.InvalidateStyles:
            case WI.LayoutTimelineRecord.EventType.InvalidateLayout:
                // These event types have no time range.
                return false;

            default:
                console.error("Unhandled LayoutTimelineRecord.EventType", record.eventType);
                return false;
            }
        });

        let networkTimeline = this._recording.timelineForRecordType(WI.TimelineRecord.Type.Network);
        let networkRecords = networkTimeline ? networkTimeline.recordsInTimeRange(startTime, endTime) : [];
        let networkRequests = networkRecords.length;

        let millisecondStartTime = Math.round(startTime * 1000);
        let millisecondEndTime = Math.round(endTime * 1000);
        let millisecondDuration = millisecondEndTime - millisecondStartTime;

        let samples = new Array(millisecondDuration);

        function markRecordEntries(records, callback) {
            for (let record of records) {
                let recordStart = Math.round(record.startTime * 1000);
                let recordEnd = Math.round(record.endTime * 1000);
                if (recordStart > millisecondEndTime)
                    continue;
                if (recordEnd < millisecondStartTime)
                    continue;

                recordStart = Math.max(recordStart, millisecondStartTime);
                recordEnd = Math.min(recordEnd, millisecondEndTime);

                let value = callback(record);
                for (let t = recordStart; t <= recordEnd; ++t)
                    samples[t - millisecondStartTime] = value;
            }
        }

        markRecordEntries(scriptRecords, (record) => {
            return CPUTimelineView.SampleType.JavaScript;
        });

        markRecordEntries(layoutRecords, (record) => {
            switch (record.eventType) {
            case WI.LayoutTimelineRecord.EventType.RecalculateStyles:
                return CPUTimelineView.SampleType.Style;
            case WI.LayoutTimelineRecord.EventType.ForcedLayout:
            case WI.LayoutTimelineRecord.EventType.Layout:
                return CPUTimelineView.SampleType.Layout;
            case WI.LayoutTimelineRecord.EventType.Paint:
            case WI.LayoutTimelineRecord.EventType.Composite:
                return CPUTimelineView.SampleType.Paint;
            }
        });

        let samplesIdle = 0;
        let samplesScript = 0;
        let samplesLayout = 0;
        let samplesPaint = 0;
        let samplesStyle = 0;
        for (let i = 0; i < samples.length; ++i) {
            switch (samples[i]) {
            case undefined:
                samplesIdle++;
                break;
            case CPUTimelineView.SampleType.JavaScript:
                samplesScript++;
                break;
            case CPUTimelineView.SampleType.Layout:
                samplesLayout++;
                break;
            case CPUTimelineView.SampleType.Paint:
                samplesPaint++;
                break;
            case CPUTimelineView.SampleType.Style:
                samplesStyle++;
                break;
            }
        }

        return {
            samples,
            samplesIdle,
            samplesScript,
            samplesLayout,
            samplesPaint,
            samplesStyle,
            scriptEntries,
            networkRequests,
            timerTypes,
            eventTypes,
            observerTypes,
            timerInstallationRecords,
            eventHandlerRecords,
            observerCallbackRecords,
            repeatingTimers,
        };
    }

    _removeWorkerThreadViews()
    {
        if (!this._workerViews.length)
            return;

        for (let view of this._workerViews)
            this.removeSubview(view);

        this._workerViews = [];
    }

    _resetSourcesFilters()
    {
        if (!this._sourcesFilter)
            return;

        this._sourcesFilterRow.hidden = true;
        this._sourcesFilterLabelElement.removeChildren();

        this._timerInstallationsRow.hidden = false;
        this._eventHandlersRow.hidden = false;
        this._observerHandlersRow.hidden = false;

        this._sourcesFilter.timer.clear();
        this._sourcesFilter.event.clear();
        this._sourcesFilter.observer.clear();
    }

    _addSourcesFilter(type, name)
    {
        this._sourcesFilter[type].add(name);
        this._updateSourcesFilters();
    }

    _removeSourcesFilter(type, name)
    {
        this._sourcesFilter[type].delete(name);
        this._updateSourcesFilters();
    }

    _updateSourcesFilters()
    {
        let timerFilters = this._sourcesFilter.timer;
        let eventFilters = this._sourcesFilter.event;
        let observerFilters = this._sourcesFilter.observer;

        if (!timerFilters.size && !eventFilters.size && !observerFilters.size) {
            this._resetSourcesFilters();
            return;
        }

        let createActiveFilterElement = (type, name) => {
            let span = document.createElement("span");
            span.className = "filter active";
            span.textContent = name;
            span.addEventListener("mouseup", (event) => {
                this._removeSourcesFilter(type, name);
                this._layoutStatisticsAndSources();
            });
            return span;
        };

        this._sourcesFilterRow.hidden = false;
        this._sourcesFilterLabelElement.removeChildren();

        for (let name of timerFilters)
            this._sourcesFilterLabelElement.appendChild(createActiveFilterElement("timer", name));
        for (let name of eventFilters)
            this._sourcesFilterLabelElement.appendChild(createActiveFilterElement("event", name));
        for (let name of observerFilters)
            this._sourcesFilterLabelElement.appendChild(createActiveFilterElement("observer", name));

        this._timerInstallationsRow.hidden = !timerFilters.size;
        this._eventHandlersRow.hidden = !eventFilters.size;
        this._observerHandlersRow.hidden = !observerFilters.size;
    }

    _createTableRow(table)
    {
        let row = table.appendChild(document.createElement("tr"));

        let headerCell = row.appendChild(document.createElement("th"));

        let numberCell = row.appendChild(document.createElement("td"));
        numberCell.className = "number";

        let labelCell = row.appendChild(document.createElement("td"));
        labelCell.className = "label";

        return {row, headerCell, numberCell, labelCell};
    }

    _insertTableRow(table, rowList, {headerValue, numberValue, labelValue, followingRow})
    {
        let {row, headerCell, numberCell, labelCell} = this._createTableRow(table);
        rowList.push(row);

        if (followingRow)
            table.insertBefore(row, followingRow);

        if (headerValue)
            headerCell.textContent = headerValue;

        if (numberValue)
            numberCell.textContent = numberValue;

        if (labelValue)
            labelCell.append(labelValue);

        return row;
    }

    _clearStatistics()
    {
        this._networkRequestsNumberElement.textContent = emDash;
        this._scriptEntriesNumberElement.textContent = emDash;

        for (let row of this._statisticsRows)
            row.remove();
        this._statisticsRows = [];
    }

    _clearSources()
    {
        this._timerInstallationsNumberElement.textContent = emDash;
        this._timerInstallationsLabelElement.textContent = "";

        this._eventHandlersNumberElement.textContent = emDash;
        this._eventHandlersLabelElement.textContent = "";

        this._observerHandlersNumberElement.textContent = emDash;
        this._observerHandlersLabelElement.textContent = "";

        for (let row of this._sourcesRows)
            row.remove();
        this._sourcesRows = [];
    }

    _clearEnergyImpactText()
    {
        this._energyImpactLabelElement.classList.remove("low", "medium", "high");
        this._energyImpactLabelElement.textContent = emDash;
        this._energyImpactNumberElement.textContent = "";
        this._energyImpactDurationElement.textContent = "";
    }

    _clearBreakdownLegend()
    {
        this._breakdownLegendScriptElement.textContent = emDash;
        this._breakdownLegendLayoutElement.textContent = emDash;
        this._breakdownLegendPaintElement.textContent = emDash;
        this._breakdownLegendStyleElement.textContent = emDash;

        this._breakdownChart.centerElement.removeChildren();
    }

    _cpuTimelineRecordAdded(event)
    {
        let cpuTimelineRecord = event.data.record;
        console.assert(cpuTimelineRecord instanceof WI.CPUTimelineRecord);

        if (cpuTimelineRecord.startTime >= this.startTime && cpuTimelineRecord.endTime <= this.endTime)
            this.needsLayout();
    }

    _graphPositionForMouseEvent(event)
    {
        let chartElement = event.target.closest(".area-chart, .stacked-area-chart, .range-chart");
        if (!chartElement)
            return NaN;

        let rect = chartElement.getBoundingClientRect();
        let position = event.pageX - rect.left;

        if (WI.resolvedLayoutDirection() === WI.LayoutDirection.RTL)
            return rect.width - position;
        return position;
    }

    _handleIndicatorClick(event)
    {
        let clickPosition = this._graphPositionForMouseEvent(event);
        if (isNaN(clickPosition))
            return;

        let secondsPerPixel = this._timelineRuler.secondsPerPixel;
        let graphClickTime = clickPosition * secondsPerPixel;
        let graphStartTime = this.startTime;

        let clickStartTime = graphStartTime + graphClickTime;
        let clickEndTime = clickStartTime + secondsPerPixel;

        // Try at the exact clicked pixel.
        if (event.target.localName === "rect") {
            if (this._attemptSelectIndicatatorTimelineRecord(clickStartTime, clickEndTime))
                return;
            console.assert(false, "If the user clicked on a rect there should have been a record in this pixel range");
        }

        // Spiral out 4 pixels each side to try and select a nearby record.
        for (let i = 1, delta = 0; i <= 4; ++i) {
            delta += secondsPerPixel;
            if (this._attemptSelectIndicatatorTimelineRecord(clickStartTime - delta, clickStartTime))
                return;
            if (this._attemptSelectIndicatatorTimelineRecord(clickEndTime, clickEndTime + delta))
                return;
        }
    }

    _attemptSelectIndicatatorTimelineRecord(startTime, endTime)
    {
        let layoutTimeline = this._recording.timelineForRecordType(WI.TimelineRecord.Type.Layout);
        let layoutRecords = layoutTimeline ? layoutTimeline.recordsInTimeRange(startTime, endTime, {includeRecordBeforeStart: true}) : [];
        layoutRecords = layoutRecords.filter((record) => {
            switch (record.eventType) {
            case WI.LayoutTimelineRecord.EventType.RecalculateStyles:
            case WI.LayoutTimelineRecord.EventType.ForcedLayout:
            case WI.LayoutTimelineRecord.EventType.Layout:
            case WI.LayoutTimelineRecord.EventType.Paint:
            case WI.LayoutTimelineRecord.EventType.Composite:
                return true;
            case WI.LayoutTimelineRecord.EventType.InvalidateStyles:
            case WI.LayoutTimelineRecord.EventType.InvalidateLayout:
                return false;
            default:
                console.error("Unhandled LayoutTimelineRecord.EventType", record.eventType);
                return false;
            }
        });

        if (layoutRecords.length) {
            this._selectTimelineRecord(layoutRecords[0]);
            return true;
        }

        let scriptTimeline = this._recording.timelineForRecordType(WI.TimelineRecord.Type.Script);
        let scriptRecords = scriptTimeline ? scriptTimeline.recordsInTimeRange(startTime, endTime, {includeRecordBeforeStart: true}) : [];
        scriptRecords = scriptRecords.filter((record) => {
            switch (record.eventType) {
            case WI.ScriptTimelineRecord.EventType.ScriptEvaluated:
            case WI.ScriptTimelineRecord.EventType.APIScriptEvaluated:
            case WI.ScriptTimelineRecord.EventType.ObserverCallback:
            case WI.ScriptTimelineRecord.EventType.EventDispatched:
            case WI.ScriptTimelineRecord.EventType.MicrotaskDispatched:
            case WI.ScriptTimelineRecord.EventType.TimerFired:
            case WI.ScriptTimelineRecord.EventType.AnimationFrameFired:
                return true;
            case WI.ScriptTimelineRecord.EventType.AnimationFrameRequested:
            case WI.ScriptTimelineRecord.EventType.AnimationFrameCanceled:
            case WI.ScriptTimelineRecord.EventType.TimerInstalled:
            case WI.ScriptTimelineRecord.EventType.TimerRemoved:
            case WI.ScriptTimelineRecord.EventType.ProbeSampleRecorded:
            case WI.ScriptTimelineRecord.EventType.ConsoleProfileRecorded:
            case WI.ScriptTimelineRecord.EventType.GarbageCollected:
                return false;
            default:
                console.error("Unhandled ScriptTimelineRecord.EventType", record.eventType);
                return false;
            }
        });

        if (scriptRecords.length) {
            this._selectTimelineRecord(scriptRecords[0]);
            return true;
        }

        return false;
    }

    _selectTimelineRecord(record)
    {
        this.dispatchEventToListeners(WI.TimelineView.Event.RecordWasSelected, {record});
    }

    _handleGraphClick(event)
    {
        let mousePosition = this._graphPositionForMouseEvent(event);
        if (isNaN(mousePosition))
            return;

        this._stickingOverlay = !this._stickingOverlay;

        if (!this._stickingOverlay)
            this._handleGraphMouseMove(event);
    }

    _handleGraphMouseMove(event)
    {
        let mousePosition = this._graphPositionForMouseEvent(event);
        if (isNaN(mousePosition)) {
            this._hideGraphOverlay();
            this.dispatchEventToListeners(WI.TimelineView.Event.ScannerHide);
            return;
        }

        let secondsPerPixel = this._timelineRuler.secondsPerPixel;
        let time = this.startTime + (mousePosition * secondsPerPixel);

        if (!this._stickingOverlay)
            this._showGraphOverlayNearTo(time);

        this.dispatchEventToListeners(WI.TimelineView.Event.ScannerShow, {time});
    }

    _showGraphOverlayNearTo(time)
    {
        let nearestRecord = null;
        let nearestDistance = Infinity;

        // Find the nearest record to the time.
        for (let record of this._visibleRecordsInLayout) {
            let distance = Math.abs(time - record.timestamp);
            if (distance < nearestDistance) {
                nearestRecord = record;
                nearestDistance = distance;
            }
        }

        if (!nearestRecord) {
            this._hideGraphOverlay();
            return;
        }

        let bestTime = nearestRecord.timestamp;

        // Snap to a discontinuity if closer.
        for (let {startTime, endTime} of this._discontinuitiesInLayout) {
            let distance = Math.abs(time - startTime);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                bestTime = startTime;
            }
            distance = Math.abs(time - endTime);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                bestTime = endTime;
            }
        }

        // Snap to end time if closer.
        let visibleEndTime = Math.min(this.endTime, this.currentTime);
        let distance = Math.abs(time - visibleEndTime);
        if (distance < nearestDistance) {
            nearestDistance = distance;
            bestTime = visibleEndTime;
        }

        let graphStartTime = this.startTime;
        let adjustedTime = Number.constrain(bestTime, graphStartTime, visibleEndTime);
        this._showGraphOverlay(nearestRecord, adjustedTime);
    }

    _updateGraphOverlay()
    {
        if (!this._overlayRecord)
            return;

        this._showGraphOverlay(this._overlayRecord, this._overlayTime, true);
    }

    _showGraphOverlay(record, time, force)
    {
        if (!force && record === this._overlayRecord && time === this._overlayTime)
            return;

        this._overlayRecord = record;
        this._overlayTime = time;

        let secondsPerPixel = this._secondsPerPixelInLayout;
        let graphStartTime = this.startTime;

        this._overlayMarker.time = time + (secondsPerPixel / 2);

        function xScale(time) {
            return (time - graphStartTime) / secondsPerPixel;
        }

        let x = xScale(time);

        let {mainThreadUsage, workerThreadUsage, webkitThreadUsage, unknownThreadUsage, workersData} = record;

        function addOverlayPoint(view, graphHeight, layoutMax, value) {
            if (!value)
                return;

            let graphMax = layoutMax * 1.05;

            function yScale(value) {
                return graphHeight - ((value / graphMax) * graphHeight);
            }

            view.chart.addPointMarker(x, yScale(value));
            view.chart.needsLayout();
        }

        this._clearOverlayMarkers();

        this._cpuUsageView.updateLegend(record);
        addOverlayPoint(this._cpuUsageView, CPUTimelineView.cpuUsageViewHeight, this._layoutMax, mainThreadUsage);
        addOverlayPoint(this._cpuUsageView, CPUTimelineView.cpuUsageViewHeight, this._layoutMax, mainThreadUsage + workerThreadUsage);
        addOverlayPoint(this._cpuUsageView, CPUTimelineView.cpuUsageViewHeight, this._layoutMax, mainThreadUsage + workerThreadUsage + webkitThreadUsage + unknownThreadUsage);

        if (this._threadsDetailsElement.open) {
            this._mainThreadUsageView.updateLegend(mainThreadUsage);
            addOverlayPoint(this._mainThreadUsageView, CPUTimelineView.threadCPUUsageViewHeight, this._threadLayoutMax, mainThreadUsage);

            this._webkitThreadUsageView.updateLegend(webkitThreadUsage);
            addOverlayPoint(this._webkitThreadUsageView, CPUTimelineView.threadCPUUsageViewHeight, this._threadLayoutMax, webkitThreadUsage);

            this._unknownThreadUsageView.updateLegend(unknownThreadUsage);
            addOverlayPoint(this._unknownThreadUsageView, CPUTimelineView.threadCPUUsageViewHeight, this._threadLayoutMax, unknownThreadUsage);

            for (let workerView of this._workerViews)
                workerView.updateLegend(NaN);

            if (workersData) {
                for (let {targetId, usage} of workersData) {
                    let workerView = this._workerViews.find((x) => x.__workerId === targetId);
                    if (workerView) {
                        workerView.updateLegend(usage);
                        addOverlayPoint(workerView, CPUTimelineView.threadCPUUsageViewHeight, this._threadLayoutMax, usage);
                    }
                }
            }
        }
    }

    _clearOverlayMarkers()
    {
        function clearGraphOverlayElement(view) {
            view.clearLegend();
            view.chart.clearPointMarkers();
            view.chart.needsLayout();
        }

        clearGraphOverlayElement(this._cpuUsageView);
        clearGraphOverlayElement(this._mainThreadUsageView);
        clearGraphOverlayElement(this._webkitThreadUsageView);
        clearGraphOverlayElement(this._unknownThreadUsageView);

        for (let workerView of this._workerViews)
            clearGraphOverlayElement(workerView);
    }

    _hideGraphOverlay()
    {
        if (this._stickingOverlay)
            return;

        this._overlayRecord = null;
        this._overlayTime = NaN;
        this._overlayMarker.time = -1;
        this._clearOverlayMarkers();
    }
};

WI.CPUTimelineView.LayoutReason = {
    Internal: Symbol("cpu-timeline-view-internal-layout"),
};

// NOTE: UI follows this order.
WI.CPUTimelineView.SampleType = {
    JavaScript: "sample-type-javascript",
    Layout: "sample-type-layout",
    Paint: "sample-type-paint",
    Style: "sample-type-style",
};

WI.CPUTimelineView.ReferencePage = WI.ReferencePage.TimelinesTab.CPUTimeline;
