/*
 * Copyright (C) 2013, 2015-2016 Apple Inc. All rights reserved.
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

WI.TimelineOverview = class TimelineOverview extends WI.View
{
    constructor(timelineRecording)
    {
        super();

        console.assert(timelineRecording instanceof WI.TimelineRecording);

        this._timelinesViewModeSettings = this._createViewModeSettings(WI.TimelineOverview.ViewMode.Timelines, WI.TimelineOverview.MinimumDurationPerPixel, WI.TimelineOverview.MaximumDurationPerPixel, 0.01, 0, 15);
        this._instrumentTypes = WI.TimelineManager.availableTimelineTypes();

        let minimumDurationPerPixel = 1 / WI.TimelineRecordFrame.MaximumWidthPixels;
        let maximumDurationPerPixel = 1 / WI.TimelineRecordFrame.MinimumWidthPixels;
        this._renderingFramesViewModeSettings = this._createViewModeSettings(WI.TimelineOverview.ViewMode.RenderingFrames, minimumDurationPerPixel, maximumDurationPerPixel, minimumDurationPerPixel, 0, 100);

        this._recording = timelineRecording;
        this._recording.addEventListener(WI.TimelineRecording.Event.InstrumentAdded, this._instrumentAdded, this);
        this._recording.addEventListener(WI.TimelineRecording.Event.InstrumentRemoved, this._instrumentRemoved, this);
        this._recording.addEventListener(WI.TimelineRecording.Event.MarkerAdded, this._markerAdded, this);
        this._recording.addEventListener(WI.TimelineRecording.Event.Reset, this._recordingReset, this);

        this.element.classList.add("timeline-overview");
        this._updateWheelAndGestureHandlers();

        this._graphsContainerView = new WI.View;
        this._graphsContainerView.element.classList.add("graphs-container");
        this._graphsContainerView.element.addEventListener("click", this._handleGraphsContainerClick.bind(this));
        this.addSubview(this._graphsContainerView);

        this._selectedTimelineRecord = null;
        this._overviewGraphsByTypeMap = new Map;

        this._editInstrumentsButton = new WI.ActivateButtonNavigationItem("toggle-edit-instruments", WI.UIString("Edit configuration"), WI.UIString("Save configuration"), "Images/Pencil.svg", 16, 16);
        this._editInstrumentsButton.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._toggleEditingInstruments, this);
        this._editingInstruments = false;
        this._updateEditInstrumentsButton();

        let instrumentsNavigationBar = new WI.NavigationBar;
        instrumentsNavigationBar.element.classList.add("timelines");
        instrumentsNavigationBar.addNavigationItem(new WI.TextNavigationItem("enabled-timelines", WI.UIString("Enabled Timelines", "Enabled Timelines @ Timelines Tab", "Label for column showing the list of enabled timelines.")));
        instrumentsNavigationBar.addNavigationItem(new WI.FlexibleSpaceNavigationItem);
        instrumentsNavigationBar.addNavigationItem(this._editInstrumentsButton);
        this.addSubview(instrumentsNavigationBar);

        this._timelinesTreeOutline = new WI.TreeOutline;
        this._timelinesTreeOutline.element.classList.add("timelines");
        this._timelinesTreeOutline.disclosureButtons = false;
        this._timelinesTreeOutline.large = true;
        this._timelinesTreeOutline.addEventListener(WI.TreeOutline.Event.SelectionDidChange, this._timelinesTreeSelectionDidChange, this);
        this.element.appendChild(this._timelinesTreeOutline.element);

        this._treeElementsByTypeMap = new Map;

        this._timelineRuler = new WI.TimelineRuler;
        this._timelineRuler.allowsClippedLabels = true;
        this._timelineRuler.allowsTimeRangeSelection = true;
        this._timelineRuler.element.addEventListener("mousedown", this._timelineRulerMouseDown.bind(this));
        this._timelineRuler.element.addEventListener("click", this._timelineRulerMouseClicked.bind(this));
        this._timelineRuler.addEventListener(WI.TimelineRuler.Event.TimeRangeSelectionChanged, this._timeRangeSelectionChanged, this);
        this.addSubview(this._timelineRuler);

        this._currentTimeMarker = new WI.TimelineMarker(0, WI.TimelineMarker.Type.CurrentTime);
        this._timelineRuler.addMarker(this._currentTimeMarker);

        this._scrollContainerElement = document.createElement("div");
        this._scrollContainerElement.classList.add("scroll-container");
        this._scrollContainerElement.addEventListener("scroll", this._handleScrollEvent.bind(this));
        this.element.appendChild(this._scrollContainerElement);

        this._scrollWidthSizer = document.createElement("div");
        this._scrollWidthSizer.classList.add("scroll-width-sizer");
        this._scrollContainerElement.appendChild(this._scrollWidthSizer);

        this._startTime = 0;
        this._currentTime = 0;
        this._revealCurrentTime = false;
        this._endTime = 0;
        this._pixelAlignDuration = false;
        this._mouseWheelDelta = 0;
        this._cachedScrollContainerWidth = NaN;
        this._timelineRulerSelectionChanged = false;
        this._viewMode = WI.TimelineOverview.ViewMode.Timelines;
        this._selectedTimeline = null;

        for (let instrument of this._recording.instruments)
            this._instrumentAdded(instrument);

        if (!WI.timelineManager.isCapturingPageReload())
            this._resetSelection();

        this._viewModeDidChange();

        WI.timelineManager.addEventListener(WI.TimelineManager.Event.CapturingStateChanged, this._handleTimelineCapturingStateChanged, this);
        WI.timelineManager.addEventListener(WI.TimelineManager.Event.RecordingImported, this._recordingImported, this);
    }

    // Import / Export

    exportData()
    {
        let json = {
            secondsPerPixel: this.secondsPerPixel,
            scrollStartTime: this.scrollStartTime,
            selectionStartTime: this.selectionStartTime,
            selectionDuration: this.selectionDuration,
        };

        if (this._selectedTimeline)
            json.selectedTimelineType = this._selectedTimeline.type;

        return json;
    }

    // Public

    get selectedTimeline()
    {
        return this._selectedTimeline;
    }

    set selectedTimeline(x)
    {
        if (this._editingInstruments)
            return;

        if (this._selectedTimeline === x)
            return;

        this._selectedTimeline = x;
        if (this._selectedTimeline) {
            let treeElement = this._treeElementsByTypeMap.get(this._selectedTimeline.type);
            console.assert(treeElement, "Missing tree element for timeline", this._selectedTimeline);

            let omitFocus = true;
            let wasSelectedByUser = false;
            treeElement.select(omitFocus, wasSelectedByUser);
        } else if (this._timelinesTreeOutline.selectedTreeElement)
            this._timelinesTreeOutline.selectedTreeElement.deselect();
    }

    get editingInstruments()
    {
        return this._editingInstruments;
    }

    get viewMode()
    {
        return this._viewMode;
    }

    set viewMode(x)
    {
        if (this._viewMode === x)
            return;

        this._viewMode = x;
        this._viewModeDidChange();
    }

    get startTime()
    {
        return this._startTime;
    }

    set startTime(x)
    {
        x = x || 0;

        if (this._startTime === x)
            return;

        if (this._viewMode !== WI.TimelineOverview.ViewMode.RenderingFrames) {
            let selectionOffset = this.selectionStartTime - this._startTime;
            this.selectionStartTime = selectionOffset + x;
        }

        this._startTime = x;

        this.needsLayout();
    }

    get currentTime()
    {
        return this._currentTime;
    }

    set currentTime(x)
    {
        x = x || 0;

        if (this._currentTime === x)
            return;

        this._currentTime = x;
        this._revealCurrentTime = true;

        this.needsLayout();
    }

    get secondsPerPixel()
    {
        return this._currentSettings.durationPerPixelSetting.value;
    }

    set secondsPerPixel(x)
    {
        x = Math.min(this._currentSettings.maximumDurationPerPixel, Math.max(this._currentSettings.minimumDurationPerPixel, x));

        if (this.secondsPerPixel === x)
            return;

        if (this._pixelAlignDuration) {
            x = 1 / Math.round(1 / x);
            if (this.secondsPerPixel === x)
                return;
        }

        this._currentSettings.durationPerPixelSetting.value = x;

        this.needsLayout();
    }

    get pixelAlignDuration()
    {
        return this._pixelAlignDuration;
    }

    set pixelAlignDuration(x)
    {
        if (this._pixelAlignDuration === x)
            return;

        this._mouseWheelDelta = 0;
        this._pixelAlignDuration = x;
        if (this._pixelAlignDuration)
            this.secondsPerPixel = 1 / Math.round(1 / this.secondsPerPixel);
    }

    get endTime()
    {
        return this._endTime;
    }

    set endTime(x)
    {
        x = x || 0;

        if (this._endTime === x)
            return;

        this._endTime = x;

        this.needsLayout();
    }

    get scrollStartTime()
    {
        return this._currentSettings.scrollStartTime;
    }

    set scrollStartTime(x)
    {
        x = x || 0;

        if (this.scrollStartTime === x)
            return;

        this._currentSettings.scrollStartTime = x;

        this.needsLayout();
    }

    get scrollContainerWidth()
    {
        return this._cachedScrollContainerWidth;
    }

    get visibleDuration()
    {
        if (isNaN(this._cachedScrollContainerWidth)) {
            this._cachedScrollContainerWidth = this._scrollContainerElement.offsetWidth;
            if (!this._cachedScrollContainerWidth)
                this._cachedScrollContainerWidth = NaN;
        }

        return this._cachedScrollContainerWidth * this.secondsPerPixel;
    }

    get selectionStartTime()
    {
        return this._timelineRuler.selectionStartTime;
    }

    set selectionStartTime(x)
    {
        x = x || 0;

        if (this._timelineRuler.selectionStartTime === x)
            return;

        let selectionDuration = this.selectionDuration;
        this._timelineRuler.selectionStartTime = x;
        this._timelineRuler.selectionEndTime = x + selectionDuration;
    }

    get selectionDuration()
    {
        return this._timelineRuler.selectionEndTime - this._timelineRuler.selectionStartTime;
    }

    set selectionDuration(x)
    {
        x = Math.max(this._timelineRuler.minimumSelectionDuration, x);

        this._timelineRuler.selectionEndTime = this._timelineRuler.selectionStartTime + x;
    }

    get height()
    {
        let height = 0;
        for (let overviewGraph of this._overviewGraphsByTypeMap.values()) {
            if (!overviewGraph.hidden)
                height += overviewGraph.height;
        }
        return height;
    }

    attached()
    {
        super.attached();

        for (let [type, overviewGraph] of this._overviewGraphsByTypeMap) {
            if (this._canShowTimelineType(type))
                overviewGraph.hidden = false;
        }

        this.needsLayout(WI.View.LayoutReason.Resize);
    }

    detached()
    {
        for (let overviewGraph of this._overviewGraphsByTypeMap.values())
            overviewGraph.hidden = true;

        this.hideScanner();

        super.detached();
    }

    closed()
    {
        WI.timelineManager.removeEventListener(WI.TimelineManager.Event.CapturingStateChanged, this._handleTimelineCapturingStateChanged, this);
        WI.timelineManager.removeEventListener(WI.TimelineManager.Event.RecordingImported, this._recordingImported, this);

        super.closed();
    }

    reset()
    {
        this._selectedTimelineRecord = null;
        for (let overviewGraph of this._overviewGraphsByTypeMap.values())
            overviewGraph.reset();

        this._mouseWheelDelta = 0;

        this._resetSelection();
    }

    revealMarker(marker)
    {
        this.scrollStartTime = marker.time - (this.visibleDuration / 2);
    }

    recordWasFiltered(timeline, record, filtered)
    {
        let overviewGraph = this._overviewGraphsByTypeMap.get(timeline.type);
        console.assert(overviewGraph, "Missing overview graph for timeline type " + timeline.type);
        if (!overviewGraph)
            return;

        console.assert(!overviewGraph.hidden, "Record filtered in hidden overview graph", record);

        overviewGraph.recordWasFiltered(record, filtered);
    }

    selectRecord(timeline, record)
    {
        let overviewGraph = this._overviewGraphsByTypeMap.get(timeline.type);
        console.assert(overviewGraph, "Missing overview graph for timeline type " + timeline.type);
        if (!overviewGraph)
            return;

        console.assert(!overviewGraph.hidden, "Record selected in hidden overview graph", record);

        overviewGraph.selectedRecord = record;
    }

    showScanner(time)
    {
        this._timelineRuler.showScanner(time);
    }

    hideScanner()
    {
        this._timelineRuler.hideScanner();
    }

    updateLayoutIfNeeded(layoutReason)
    {
        if (this.layoutPending) {
            super.updateLayoutIfNeeded(layoutReason);
            return;
        }

        this._timelineRuler.updateLayoutIfNeeded(layoutReason);

        for (let overviewGraph of this._overviewGraphsByTypeMap.values()) {
            if (!overviewGraph.hidden)
                overviewGraph.updateLayoutIfNeeded(layoutReason);
        }
    }

    discontinuitiesInTimeRange(startTime, endTime)
    {
        return this._recording.discontinuitiesInTimeRange(startTime, endTime);
    }

    // Protected

    get timelineRuler()
    {
        return this._timelineRuler;
    }

    layout()
    {
        let startTime = this._startTime;
        let endTime = this._endTime;
        let currentTime = this._currentTime;
        if (this._viewMode === WI.TimelineOverview.ViewMode.RenderingFrames) {
            let renderingFramesTimeline = this._recording.timelines.get(WI.TimelineRecord.Type.RenderingFrame);
            console.assert(renderingFramesTimeline, "Recoring missing rendering frames timeline");

            startTime = 0;
            endTime = renderingFramesTimeline.records.length;
            currentTime = endTime;
        }

        // Calculate the required width based on the duration and seconds per pixel.
        let duration = endTime - startTime;
        let newWidth = Math.ceil(duration / this.secondsPerPixel);

        // Update all relevant elements to the new required width.
        this._updateElementWidth(this._scrollWidthSizer, newWidth);

        this._currentTimeMarker.time = currentTime;

        if (this._revealCurrentTime) {
            this.revealMarker(this._currentTimeMarker);
            this._revealCurrentTime = false;
        }

        const visibleDuration = this.visibleDuration;

        // Clamp the scroll start time to match what the scroll bar would allow.
        let scrollStartTime = Math.min(this.scrollStartTime, endTime - visibleDuration);
        scrollStartTime = Math.max(startTime, scrollStartTime);

        this._timelineRuler.zeroTime = startTime;
        this._timelineRuler.startTime = scrollStartTime;
        this._timelineRuler.secondsPerPixel = this.secondsPerPixel;

        if (!this._dontUpdateScrollLeft) {
            this._ignoreNextScrollEvent = true;
            let scrollLeft = Math.ceil((scrollStartTime - startTime) / this.secondsPerPixel);
            if (scrollLeft)
                this._scrollContainerElement.scrollLeft = scrollLeft;
        }

        for (let overviewGraph of this._overviewGraphsByTypeMap.values()) {
            if (overviewGraph.hidden)
                continue;

            overviewGraph.zeroTime = startTime;
            overviewGraph.startTime = scrollStartTime;
            overviewGraph.currentTime = currentTime;
            overviewGraph.endTime = scrollStartTime + visibleDuration;
        }
    }

    sizeDidChange()
    {
        this._cachedScrollContainerWidth = NaN;
    }

    // Private

    _updateElementWidth(element, newWidth)
    {
        var currentWidth = parseInt(element.style.width);
        if (currentWidth !== newWidth)
            element.style.width = newWidth + "px";
    }

    _handleScrollEvent(event)
    {
        if (this._ignoreNextScrollEvent) {
            this._ignoreNextScrollEvent = false;
            return;
        }

        this._dontUpdateScrollLeft = true;

        let scrollOffset = this._scrollContainerElement.scrollLeft;
        if (WI.resolvedLayoutDirection() === WI.LayoutDirection.RTL)
            this.scrollStartTime = this._startTime - (scrollOffset * this.secondsPerPixel);
        else
            this.scrollStartTime = this._startTime + (scrollOffset * this.secondsPerPixel);

        // Force layout so we can update with the scroll position synchronously.
        this.updateLayoutIfNeeded();

        this._dontUpdateScrollLeft = false;

        this.element.classList.toggle("has-scrollbar", this._scrollContainerElement.clientHeight <= 1);
    }

    _handleWheelEvent(event)
    {
        // Ignore cloned events that come our way, we already handled the original.
        if (event.__cloned)
            return;

        // Ignore wheel events while handing gestures.
        if (this._handlingGesture)
            return;

        // Require twice the vertical delta to overcome horizontal scrolling. This prevents most
        // cases of inadvertent zooming for slightly diagonal scrolls.
        if (Math.abs(event.deltaX) >= Math.abs(event.deltaY) * 0.5) {
            // Clone the event to dispatch it on the scroll container. Mark it as cloned so we don't get into a loop.
            let newWheelEvent = new event.constructor(event.type, event);
            newWheelEvent.__cloned = true;

            this._scrollContainerElement.dispatchEvent(newWheelEvent);
            return;
        }

        // Remember the mouse position in time.
        let mouseOffset = event.pageX - this._graphsContainerView.element.totalOffsetLeft;
        let mousePositionTime = this._currentSettings.scrollStartTime + (mouseOffset * this.secondsPerPixel);
        let deviceDirection = event.webkitDirectionInvertedFromDevice ? 1 : -1;
        let delta = event.deltaY * (this.secondsPerPixel / WI.TimelineOverview.ScrollDeltaDenominator) * deviceDirection;

        // Reset accumulated wheel delta when direction changes.
        if (this._pixelAlignDuration && (delta < 0 && this._mouseWheelDelta >= 0 || delta >= 0 && this._mouseWheelDelta < 0))
            this._mouseWheelDelta = 0;

        let previousDurationPerPixel = this.secondsPerPixel;
        this._mouseWheelDelta += delta;
        this.secondsPerPixel += this._mouseWheelDelta;

        if (this.secondsPerPixel === this._currentSettings.minimumDurationPerPixel && delta < 0 || this.secondsPerPixel === this._currentSettings.maximumDurationPerPixel && delta >= 0)
            this._mouseWheelDelta = 0;
        else
            this._mouseWheelDelta = previousDurationPerPixel + this._mouseWheelDelta - this.secondsPerPixel;

        // Center the zoom around the mouse based on the remembered mouse position time.
        this.scrollStartTime = mousePositionTime - (mouseOffset * this.secondsPerPixel);

        this.element.classList.toggle("has-scrollbar", this._scrollContainerElement.clientHeight <= 1);

        event.preventDefault();
        event.stopPropagation();
    }

    _handleGestureStart(event)
    {
        if (this._handlingGesture) {
            // FIXME: <https://webkit.org/b/151068> [Mac] Unexpected gesturestart events when already handling gesture
            return;
        }

        let mouseOffset = event.pageX - this._graphsContainerView.element.totalOffsetLeft;
        let mousePositionTime = this._currentSettings.scrollStartTime + (mouseOffset * this.secondsPerPixel);

        this._handlingGesture = true;
        this._gestureStartStartTime = mousePositionTime;
        this._gestureStartDurationPerPixel = this.secondsPerPixel;

        this.element.classList.toggle("has-scrollbar", this._scrollContainerElement.clientHeight <= 1);

        event.preventDefault();
        event.stopPropagation();
    }

    _handleGestureChange(event)
    {
        // Cap zooming out at 5x.
        let scale = Math.max(1 / 5, event.scale);

        let mouseOffset = event.pageX - this._graphsContainerView.element.totalOffsetLeft;
        let newSecondsPerPixel = this._gestureStartDurationPerPixel / scale;

        this.secondsPerPixel = newSecondsPerPixel;
        this.scrollStartTime = this._gestureStartStartTime - (mouseOffset * this.secondsPerPixel);

        event.preventDefault();
        event.stopPropagation();
    }

    _handleGestureEnd(event)
    {
        this._handlingGesture = false;
        this._gestureStartStartTime = NaN;
        this._gestureStartDurationPerPixel = NaN;
    }

    _instrumentAdded(instrumentOrEvent)
    {
        let instrument = instrumentOrEvent instanceof WI.Instrument ? instrumentOrEvent : instrumentOrEvent.data.instrument;
        console.assert(instrument instanceof WI.Instrument, instrument);

        let timeline = this._recording.timelineForInstrument(instrument);
        console.assert(!this._overviewGraphsByTypeMap.has(timeline.type), timeline);
        console.assert(!this._treeElementsByTypeMap.has(timeline.type), timeline);

        let treeElement = new WI.TimelineTreeElement(timeline);
        let insertionIndex = insertionIndexForObjectInListSortedByFunction(treeElement, this._timelinesTreeOutline.children, this._compareTimelineTreeElements.bind(this));
        this._timelinesTreeOutline.insertChild(treeElement, insertionIndex);
        this._treeElementsByTypeMap.set(timeline.type, treeElement);

        let overviewGraph = WI.TimelineOverviewGraph.createForTimeline(timeline, this);
        overviewGraph.addEventListener(WI.TimelineOverviewGraph.Event.RecordSelected, this._handleOverviewGraphRecordSelected, this);
        this._overviewGraphsByTypeMap.set(timeline.type, overviewGraph);
        this._graphsContainerView.insertSubviewBefore(overviewGraph, this._graphsContainerView.subviews[insertionIndex]);

        treeElement.element.style.height = overviewGraph.height + "px";

        if (!this._canShowTimelineType(timeline.type)) {
            overviewGraph.hidden = true;
            treeElement.hidden = true;
        }

        this.needsLayout();
    }

    _instrumentRemoved(event)
    {
        let instrument = event.data.instrument;
        console.assert(instrument instanceof WI.Instrument, instrument);

        let timeline = this._recording.timelineForInstrument(instrument);
        let overviewGraph = this._overviewGraphsByTypeMap.get(timeline.type);
        console.assert(overviewGraph, "Missing overview graph for timeline type", timeline.type);

        let treeElement = this._treeElementsByTypeMap.get(timeline.type);
        let shouldSuppressOnDeselect = false;
        let shouldSuppressSelectSibling = true;
        this._timelinesTreeOutline.removeChild(treeElement, shouldSuppressOnDeselect, shouldSuppressSelectSibling);

        overviewGraph.removeEventListener(WI.TimelineOverviewGraph.Event.RecordSelected, this._handleOverviewGraphRecordSelected, this);
        this._graphsContainerView.removeSubview(overviewGraph);

        this._overviewGraphsByTypeMap.delete(timeline.type);
        this._treeElementsByTypeMap.delete(timeline.type);
    }

    _markerAdded(event)
    {
        this._timelineRuler.addMarker(event.data.marker);
    }

    _handleGraphsContainerClick(event)
    {
        // Set when a WI.TimelineRecordBar receives the "click" first and is about to be selected.
        if (event.__timelineRecordClickEventHandled)
            return;

        this._recordSelected(null, null);
    }

    _timelineRulerMouseDown(event)
    {
        this._timelineRulerSelectionChanged = false;
    }

    _timelineRulerMouseClicked(event)
    {
        if (this._timelineRulerSelectionChanged)
            return;

        for (let overviewGraph of this._overviewGraphsByTypeMap.values()) {
            if (overviewGraph.hidden)
                continue;

            let graphRect = overviewGraph.element.getBoundingClientRect();
            if (!(event.pageX >= graphRect.left && event.pageX <= graphRect.right && event.pageY >= graphRect.top && event.pageY <= graphRect.bottom))
                continue;

            // Clone the event to dispatch it on the overview graph element.
            let newClickEvent = new event.constructor(event.type, event);
            overviewGraph.element.dispatchEvent(newClickEvent);
            return;
        }
    }

    _timeRangeSelectionChanged(event)
    {
        this._timelineRulerSelectionChanged = true;

        let startTime = this._viewMode === WI.TimelineOverview.ViewMode.Timelines ? this._startTime : 0;
        this._currentSettings.selectionStartValueSetting.value = this.selectionStartTime - startTime;
        this._currentSettings.selectionDurationSetting.value = this.selectionDuration;

        this.dispatchEventToListeners(WI.TimelineOverview.Event.TimeRangeSelectionChanged);
    }

    _handleOverviewGraphRecordSelected(event)
    {
        let {record, recordBar} = event.data;

        // Ignore deselection events, as they are handled by the newly selected record's timeline.
        if (!record)
            return;

        this._recordSelected(record, recordBar);
    }

    _recordSelected(record, recordBar)
    {
        if (record === this._selectedTimelineRecord)
            return;

        if (this._selectedTimelineRecord && (!record || this._selectedTimelineRecord.type !== record.type)) {
            let timelineOverviewGraph = this._overviewGraphsByTypeMap.get(this._selectedTimelineRecord.type);
            console.assert(timelineOverviewGraph);
            if (timelineOverviewGraph)
                timelineOverviewGraph.selectedRecord = null;
        }

        this._selectedTimelineRecord = record;

        if (this._selectedTimelineRecord) {
            let firstRecord = this._selectedTimelineRecord;
            let lastRecord = this._selectedTimelineRecord;
            if (recordBar) {
                firstRecord = recordBar.records[0];
                lastRecord = recordBar.records.lastValue;
            }

            let startTime = firstRecord instanceof WI.RenderingFrameTimelineRecord ? firstRecord.frameIndex : firstRecord.startTime;
            let endTime = lastRecord instanceof WI.RenderingFrameTimelineRecord ? lastRecord.frameIndex : lastRecord.endTime;
            if (startTime < this.selectionStartTime || (endTime > this.selectionStartTime + this.selectionDuration) || firstRecord instanceof WI.CPUTimelineRecord) {
                let selectionPadding = this.secondsPerPixel * 10;
                this.selectionStartTime = startTime - selectionPadding;
                this.selectionDuration = endTime - startTime + (selectionPadding * 2);
            }
        }

        this.dispatchEventToListeners(WI.TimelineOverview.Event.RecordSelected, {record: this._selectedTimelineRecord});
    }

    _resetSelection()
    {
        function reset(settings)
        {
            settings.durationPerPixelSetting.reset();
            settings.selectionStartValueSetting.reset();
            settings.selectionDurationSetting.reset();
        }

        reset(this._timelinesViewModeSettings);
        if (this._renderingFramesViewModeSettings)
            reset(this._renderingFramesViewModeSettings);

        this.secondsPerPixel = this._currentSettings.durationPerPixelSetting.value;
        this.selectionStartTime = this._currentSettings.selectionStartValueSetting.value;
        this.selectionDuration = this._currentSettings.selectionDurationSetting.value;
    }

    _recordingReset(event)
    {
        this._timelineRuler.clearMarkers();

        this._timelineRuler.addMarker(this._currentTimeMarker);
    }

    _canShowTimelineType(type)
    {
        let timelineViewMode = WI.TimelineOverview.ViewMode.Timelines;
        if (type === WI.TimelineRecord.Type.RenderingFrame)
            timelineViewMode = WI.TimelineOverview.ViewMode.RenderingFrames;

        return timelineViewMode === this._viewMode;
    }

    _viewModeDidChange()
    {
        this._stopEditingInstruments();

        let startTime = 0;
        let isRenderingFramesMode = this._viewMode === WI.TimelineOverview.ViewMode.RenderingFrames;
        if (isRenderingFramesMode) {
            this._timelineRuler.minimumSelectionDuration = 1;
            this._timelineRuler.snapInterval = 1;
            this._timelineRuler.formatLabelCallback = (value) => value.maxDecimals(0).toLocaleString();
        } else {
            this._timelineRuler.minimumSelectionDuration = 0.01;
            this._timelineRuler.snapInterval = NaN;
            this._timelineRuler.formatLabelCallback = null;

            startTime = this._startTime;
        }

        this.pixelAlignDuration = isRenderingFramesMode;
        this.selectionStartTime = this._currentSettings.selectionStartValueSetting.value + startTime;
        this.selectionDuration = this._currentSettings.selectionDurationSetting.value;

        for (let [type, overviewGraph] of this._overviewGraphsByTypeMap) {
            let treeElement = this._treeElementsByTypeMap.get(type);
            console.assert(treeElement, "Missing tree element for timeline type", type);

            let hidden = !this._canShowTimelineType(type);
            treeElement.hidden = hidden;
            overviewGraph.hidden = hidden;
        }

        this.element.classList.toggle("frames", isRenderingFramesMode);

        if (this.didInitialLayout)
            this.updateLayout(WI.View.LayoutReason.Resize);
    }

    _createViewModeSettings(viewMode, minimumDurationPerPixel, maximumDurationPerPixel, durationPerPixel, selectionStartValue, selectionDuration)
    {
        durationPerPixel = Math.min(maximumDurationPerPixel, Math.max(minimumDurationPerPixel, durationPerPixel));

        let durationPerPixelSetting = new WI.Setting(viewMode + "-duration-per-pixel", durationPerPixel);
        let selectionStartValueSetting = new WI.Setting(viewMode + "-selection-start-value", selectionStartValue);
        let selectionDurationSetting = new WI.Setting(viewMode + "-selection-duration", selectionDuration);

        return {
            scrollStartTime: 0,
            minimumDurationPerPixel,
            maximumDurationPerPixel,
            durationPerPixelSetting,
            selectionStartValueSetting,
            selectionDurationSetting
        };
    }

    get _currentSettings()
    {
        return this._viewMode === WI.TimelineOverview.ViewMode.Timelines ? this._timelinesViewModeSettings : this._renderingFramesViewModeSettings;
    }

    _timelinesTreeSelectionDidChange(event)
    {
        let timeline = null;
        let selectedTreeElement = this._timelinesTreeOutline.selectedTreeElement;
        if (selectedTreeElement) {
            timeline = selectedTreeElement.representedObject;
            console.assert(timeline instanceof WI.Timeline, timeline);
            console.assert(this._recording.timelines.get(timeline.type) === timeline, timeline);

            for (let [type, overviewGraph] of this._overviewGraphsByTypeMap)
                overviewGraph.selected = type === timeline.type;
        }

        this._selectedTimeline = timeline;
        this.dispatchEventToListeners(WI.TimelineOverview.Event.TimelineSelected);
    }

    _toggleEditingInstruments(event)
    {
        if (this._editingInstruments)
            this._stopEditingInstruments();
        else
            this._startEditingInstruments();
    }

    _editingInstrumentsDidChange()
    {
        this.element.classList.toggle(WI.TimelineOverview.EditInstrumentsStyleClassName, this._editingInstruments);
        this._timelineRuler.enabled = !this._editingInstruments;

        this._updateWheelAndGestureHandlers();
        this._updateEditInstrumentsButton();

        this.dispatchEventToListeners(WI.TimelineOverview.Event.EditingInstrumentsDidChange);
    }

    _updateEditInstrumentsButton()
    {
        let newLabel = this._editingInstruments ? WI.UIString("Done") : WI.UIString("Edit");
        this._editInstrumentsButton.label = newLabel;
        this._editInstrumentsButton.activated = this._editingInstruments;
        this._editInstrumentsButton.enabled = !WI.timelineManager.isCapturing();
    }

    _updateWheelAndGestureHandlers()
    {
        if (this._editingInstruments) {
            this.element.removeEventListener("wheel", this._handleWheelEventListener);
            this.element.removeEventListener("gesturestart", this._handleGestureStartEventListener);
            this.element.removeEventListener("gesturechange", this._handleGestureChangeEventListener);
            this.element.removeEventListener("gestureend", this._handleGestureEndEventListener);
            this._handleWheelEventListener = null;
            this._handleGestureStartEventListener = null;
            this._handleGestureChangeEventListener = null;
            this._handleGestureEndEventListener = null;
        } else {
            this._handleWheelEventListener = this._handleWheelEvent.bind(this);
            this._handleGestureStartEventListener = this._handleGestureStart.bind(this);
            this._handleGestureChangeEventListener = this._handleGestureChange.bind(this);
            this._handleGestureEndEventListener = this._handleGestureEnd.bind(this);
            this.element.addEventListener("wheel", this._handleWheelEventListener);
            this.element.addEventListener("gesturestart", this._handleGestureStartEventListener);
            this.element.addEventListener("gesturechange", this._handleGestureChangeEventListener);
            this.element.addEventListener("gestureend", this._handleGestureEndEventListener);
        }
    }

    _startEditingInstruments()
    {
        console.assert(this._viewMode === WI.TimelineOverview.ViewMode.Timelines);

        if (this._editingInstruments)
            return;

        this._editingInstruments = true;

        for (let type of this._instrumentTypes) {
            let treeElement = this._treeElementsByTypeMap.get(type);
            if (!treeElement) {
                let timeline = this._recording.timelines.get(type);
                console.assert(timeline, "Missing timeline for type " + type);

                const placeholder = true;
                treeElement = new WI.TimelineTreeElement(timeline, placeholder);

                let insertionIndex = insertionIndexForObjectInListSortedByFunction(treeElement, this._timelinesTreeOutline.children, this._compareTimelineTreeElements.bind(this));
                this._timelinesTreeOutline.insertChild(treeElement, insertionIndex);

                let placeholderGraph = new WI.View;
                placeholderGraph.element.classList.add("timeline-overview-graph");
                treeElement[WI.TimelineOverview.PlaceholderOverviewGraph] = placeholderGraph;
                this._graphsContainerView.insertSubviewBefore(placeholderGraph, this._graphsContainerView.subviews[insertionIndex]);
            }

            treeElement.editing = true;
            treeElement.addEventListener(WI.TimelineTreeElement.Event.EnabledDidChange, this._timelineTreeElementEnabledDidChange, this);
        }

        this._editingInstrumentsDidChange();
    }

    _stopEditingInstruments()
    {
        if (!this._editingInstruments)
            return;

        this._editingInstruments = false;

        let instruments = this._recording.instruments;
        for (let treeElement of this._treeElementsByTypeMap.values()) {
            if (treeElement.status.checked) {
                treeElement.editing = false;
                treeElement.removeEventListener(WI.TimelineTreeElement.Event.EnabledDidChange, this._timelineTreeElementEnabledDidChange, this);
                continue;
            }

            let timelineInstrument = instruments.find((instrument) => instrument.timelineRecordType === treeElement.representedObject.type);
            this._recording.removeInstrument(timelineInstrument);
        }

        let placeholderTreeElements = this._timelinesTreeOutline.children.filter((treeElement) => treeElement.placeholder);
        for (let treeElement of placeholderTreeElements) {
            this._timelinesTreeOutline.removeChild(treeElement);

            let placeholderGraph = treeElement[WI.TimelineOverview.PlaceholderOverviewGraph];
            console.assert(placeholderGraph);
            this._graphsContainerView.removeSubview(placeholderGraph);

            if (treeElement.status.checked) {
                let instrument = WI.Instrument.createForTimelineType(treeElement.representedObject.type);
                this._recording.addInstrument(instrument);
            }
        }

        let instrumentTypes = instruments.map((instrument) => instrument.timelineRecordType);
        WI.timelineManager.enabledTimelineTypes = instrumentTypes;

        this._editingInstrumentsDidChange();
    }

    _handleTimelineCapturingStateChanged(event)
    {
        switch (WI.timelineManager.capturingState) {
        case WI.TimelineManager.CapturingState.Active:
            this._editInstrumentsButton.enabled = false;
            this._stopEditingInstruments();
            break;

        case WI.TimelineManager.CapturingState.Inactive:
            this._editInstrumentsButton.enabled = true;
            break;
        }
    }

    _recordingImported(event)
    {
        let {overviewData} = event.data;

        if (overviewData.secondsPerPixel !== undefined)
            this.secondsPerPixel = overviewData.secondsPerPixel;
        if (overviewData.scrollStartTime !== undefined)
            this.scrollStartTime = overviewData.scrollStartTime;
        if (overviewData.selectionStartTime !== undefined)
            this.selectionStartTime = overviewData.selectionStartTime;
        if (overviewData.selectionDuration !== undefined) {
            if (overviewData.selectionDuration === Number.MAX_VALUE)
                this._timelineRuler.selectEntireRange();
            else
                this.selectionDuration = overviewData.selectionDuration;
        }
        if (overviewData.selectedTimelineType !== undefined) {
            let timeline = this._recording.timelineForRecordType(overviewData.selectedTimelineType);
            if (timeline)
                this.selectedTimeline = timeline;
        }
    }

    _compareTimelineTreeElements(a, b)
    {
        let aTimelineType = a.representedObject.type;
        let bTimelineType = b.representedObject.type;

        // Always sort the Rendering Frames timeline last.
        if (aTimelineType === WI.TimelineRecord.Type.RenderingFrame)
            return 1;
        if (bTimelineType === WI.TimelineRecord.Type.RenderingFrame)
            return -1;

        if (a.placeholder !== b.placeholder)
            return a.placeholder ? 1 : -1;

        let aTimelineIndex = this._instrumentTypes.indexOf(aTimelineType);
        let bTimelineIndex = this._instrumentTypes.indexOf(bTimelineType);
        return aTimelineIndex - bTimelineIndex;
    }

    _timelineTreeElementEnabledDidChange(event)
    {
        let enabled = this._timelinesTreeOutline.children.some((treeElement) => {
            let timelineType = treeElement.representedObject.type;
            return this._canShowTimelineType(timelineType) && treeElement.status.checked;
        });

        this._editInstrumentsButton.enabled = enabled;
    }
};

WI.TimelineOverview.PlaceholderOverviewGraph = Symbol("placeholder-overview-graph");

WI.TimelineOverview.ScrollDeltaDenominator = 500;
WI.TimelineOverview.EditInstrumentsStyleClassName = "edit-instruments";
WI.TimelineOverview.MinimumDurationPerPixel = 0.0001;
WI.TimelineOverview.MaximumDurationPerPixel = 60;

WI.TimelineOverview.ViewMode = {
    Timelines: "timeline-overview-view-mode-timelines",
    RenderingFrames: "timeline-overview-view-mode-rendering-frames"
};

WI.TimelineOverview.Event = {
    EditingInstrumentsDidChange: "editing-instruments-did-change",
    RecordSelected: "timeline-overview-record-selected",
    TimelineSelected: "timeline-overview-timeline-selected",
    TimeRangeSelectionChanged: "timeline-overview-time-range-selection-changed"
};
