/*
 * Copyright (C) 2013, 2015 Apple Inc. All rights reserved.
 * Copyright (C) 2015 University of Washington.
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

WI.TimelineRecordingContentView = class TimelineRecordingContentView extends WI.ContentView
{
    constructor(recording)
    {
        super(recording);

        this._recording = recording;

        this.element.classList.add("timeline-recording");

        this._timelineOverview = new WI.TimelineOverview(this._recording);
        this._timelineOverview.addEventListener(WI.TimelineOverview.Event.TimeRangeSelectionChanged, this._timeRangeSelectionChanged, this);
        this._timelineOverview.addEventListener(WI.TimelineOverview.Event.RecordSelected, this._recordSelected, this);
        this._timelineOverview.addEventListener(WI.TimelineOverview.Event.TimelineSelected, this._timelineSelected, this);
        this._timelineOverview.addEventListener(WI.TimelineOverview.Event.EditingInstrumentsDidChange, this._editingInstrumentsDidChange, this);
        this.addSubview(this._timelineOverview);

        this._timelineContentBrowser = new WI.ContentBrowser(null, this, {hideBackForwardButtons: true, disableFindBanner: true});
        this._timelineContentBrowser.addEventListener(WI.ContentBrowser.Event.CurrentContentViewDidChange, this._currentContentViewDidChange, this);

        this._entireRecordingPathComponent = this._createTimelineRangePathComponent(WI.UIString("Entire Recording"));
        this._timelineSelectionPathComponent = this._createTimelineRangePathComponent();
        this._timelineSelectionPathComponent.previousSibling = this._entireRecordingPathComponent;
        this._selectedTimeRangePathComponent = this._entireRecordingPathComponent;

        this._filterBarNavigationItem = new WI.FilterBarNavigationItem;
        this._filterBarNavigationItem.filterBar.addEventListener(WI.FilterBar.Event.FilterDidChange, this._filterDidChange, this);
        this._timelineContentBrowser.navigationBar.addNavigationItem(this._filterBarNavigationItem);
        this.addSubview(this._timelineContentBrowser);

        if (WI.sharedApp.isWebDebuggable()) {
            this._autoStopCheckboxNavigationItem = new WI.CheckboxNavigationItem("auto-stop-recording", WI.UIString("Stop recording once page loads"), WI.settings.timelinesAutoStop.value);
            this._autoStopCheckboxNavigationItem.visibilityPriority = WI.NavigationItem.VisibilityPriority.Low;
            this._autoStopCheckboxNavigationItem.addEventListener(WI.CheckboxNavigationItem.Event.CheckedDidChange, this._handleAutoStopCheckboxCheckedDidChange, this);

            WI.settings.timelinesAutoStop.addEventListener(WI.Setting.Event.Changed, this._handleTimelinesAutoStopSettingChanged, this);
        }

        this._exportButtonNavigationItem = new WI.ButtonNavigationItem("export", WI.UIString("Export"), "Images/Export.svg", 15, 15);
        this._exportButtonNavigationItem.toolTip = WI.UIString("Export (%s)").format(WI.saveKeyboardShortcut.displayName);
        this._exportButtonNavigationItem.buttonStyle = WI.ButtonNavigationItem.Style.ImageAndText;
        this._exportButtonNavigationItem.visibilityPriority = WI.NavigationItem.VisibilityPriority.Low;
        this._exportButtonNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._exportButtonNavigationItemClicked, this);
        this._exportButtonNavigationItem.enabled = false;

        this._importButtonNavigationItem = new WI.ButtonNavigationItem("import", WI.UIString("Import"), "Images/Import.svg", 15, 15);
        this._importButtonNavigationItem.toolTip = WI.UIString("Import");
        this._importButtonNavigationItem.buttonStyle = WI.ButtonNavigationItem.Style.ImageAndText;
        this._importButtonNavigationItem.visibilityPriority = WI.NavigationItem.VisibilityPriority.Low;
        this._importButtonNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._importButtonNavigationItemClicked, this);

        this._clearTimelineNavigationItem = new WI.ButtonNavigationItem("clear-timeline", WI.UIString("Clear Timeline (%s)").format(WI.clearKeyboardShortcut.displayName), "Images/NavigationItemTrash.svg", 15, 15);
        this._clearTimelineNavigationItem.visibilityPriority = WI.NavigationItem.VisibilityPriority.Low;
        this._clearTimelineNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._clearTimeline, this);

        this._overviewTimelineView = new WI.OverviewTimelineView(recording);
        this._overviewTimelineView.secondsPerPixel = this._timelineOverview.secondsPerPixel;

        this._progressView = new WI.TimelineRecordingProgressView;
        this._timelineContentBrowser.addSubview(this._progressView);

        this._timelineViewMap = new Map;
        this._pathComponentMap = new Map;

        this._updating = false;
        this._currentTime = NaN;
        this._lastUpdateTimestamp = NaN;
        this._startTimeNeedsReset = true;
        this._renderingFrameTimeline = null;

        this._recording.addEventListener(WI.TimelineRecording.Event.InstrumentAdded, this._instrumentAdded, this);
        this._recording.addEventListener(WI.TimelineRecording.Event.InstrumentRemoved, this._instrumentRemoved, this);
        this._recording.addEventListener(WI.TimelineRecording.Event.Reset, this._recordingReset, this);
        this._recording.singleFireEventListener(WI.TimelineRecording.Event.Unloaded, this._recordingUnloaded, this);

        WI.timelineManager.addEventListener(WI.TimelineManager.Event.CapturingStateChanged, this._handleTimelineCapturingStateChanged, this);

        WI.debuggerManager.addEventListener(WI.DebuggerManager.Event.Paused, this._debuggerPaused, this);
        WI.debuggerManager.addEventListener(WI.DebuggerManager.Event.Resumed, this._debuggerResumed, this);

        WI.ContentView.addEventListener(WI.ContentView.Event.SelectionPathComponentsDidChange, this._contentViewSelectionPathComponentDidChange, this);
        WI.ContentView.addEventListener(WI.ContentView.Event.SupplementalRepresentedObjectsDidChange, this._contentViewSupplementalRepresentedObjectsDidChange, this);

        WI.TimelineView.addEventListener(WI.TimelineView.Event.RecordWasFiltered, this._handleTimelineViewRecordFiltered, this);
        WI.TimelineView.addEventListener(WI.TimelineView.Event.RecordWasSelected, this._handleTimelineViewRecordSelected, this);
        WI.TimelineView.addEventListener(WI.TimelineView.Event.ScannerShow, this._handleTimelineViewScannerShow, this);
        WI.TimelineView.addEventListener(WI.TimelineView.Event.ScannerHide, this._handleTimelineViewScannerHide, this);
        WI.TimelineView.addEventListener(WI.TimelineView.Event.NeedsEntireSelectedRange, this._handleTimelineViewNeedsEntireSelectedRange, this);
        WI.TimelineView.addEventListener(WI.TimelineView.Event.NeedsFiltersCleared, this._handleTimelineViewNeedsFiltersCleared, this);


        WI.notifications.addEventListener(WI.Notification.VisibilityStateDidChange, this._inspectorVisibilityStateChanged, this);

        for (let instrument of this._recording.instruments)
            this._instrumentAdded(instrument);

        this.showOverviewTimelineView();

        if (this._recording.imported) {
            let {startTime, endTime} = this._recording;
            this._updateTimes(startTime, endTime, endTime);
        }
    }

    // Public

    showOverviewTimelineView()
    {
        this._timelineContentBrowser.showContentView(this._overviewTimelineView);
    }

    showTimelineViewForTimeline(timeline)
    {
        console.assert(timeline instanceof WI.Timeline, timeline);
        console.assert(this._timelineViewMap.has(timeline), timeline);
        if (!this._timelineViewMap.has(timeline))
            return;

        let contentView = this._timelineContentBrowser.showContentView(this._timelineViewMap.get(timeline));

        // FIXME: `WI.HeapAllocationsTimelineView` relies on it's `_dataGrid` for determining what
        // object is currently selected. If that `_dataGrid` hasn't yet called `layout()` when first
        // shown, we will lose the selection.
        if (!contentView.didInitialLayout)
            contentView.updateLayout();
    }

    get supportsSplitContentBrowser()
    {
        // The layout of the overview and split content browser don't work well.
        return false;
    }

    get selectionPathComponents()
    {
        if (!this._timelineContentBrowser.currentContentView)
            return [];

        let pathComponents = [];
        let representedObject = this._timelineContentBrowser.currentContentView.representedObject;
        if (representedObject instanceof WI.Timeline)
            pathComponents.push(this._pathComponentMap.get(representedObject));

        pathComponents.push(this._selectedTimeRangePathComponent);
        return pathComponents;
    }

    get supplementalRepresentedObjects()
    {
        if (!this._timelineContentBrowser.currentContentView)
            return [];
        return this._timelineContentBrowser.currentContentView.supplementalRepresentedObjects;
    }

    get navigationItems()
    {
        let navigationItems = [];
        if (this._autoStopCheckboxNavigationItem)
            navigationItems.push(this._autoStopCheckboxNavigationItem);
        navigationItems.push(new WI.DividerNavigationItem);
        navigationItems.push(this._importButtonNavigationItem);
        navigationItems.push(this._exportButtonNavigationItem);
        navigationItems.push(new WI.DividerNavigationItem);
        navigationItems.push(this._clearTimelineNavigationItem);
        return navigationItems;
    }

    get handleCopyEvent()
    {
        let currentContentView = this._timelineContentBrowser.currentContentView;
        return currentContentView && typeof currentContentView.handleCopyEvent === "function" ? currentContentView.handleCopyEvent.bind(currentContentView) : null;
    }

    get supportsSave()
    {
        return this._recording.canExport();
    }

    get saveMode()
    {
        return this._recording.exportMode;
    }

    get saveData()
    {
        return {customSaveHandler: () => { this._exportTimelineRecording(); }};
    }

    get currentTimelineView()
    {
        return this._timelineContentBrowser.currentContentView;
    }

    attached()
    {
        super.attached();

        this._clearTimelineNavigationItem.enabled = !this._recording.readonly && !isNaN(this._recording.startTime);
        this._exportButtonNavigationItem.enabled = this._recording.canExport();

        if (!this._updating && WI.timelineManager.activeRecording === this._recording && WI.timelineManager.isCapturing())
            this._startUpdatingCurrentTime(this._currentTime);
    }

    detached()
    {
        if (this._updating)
            this._stopUpdatingCurrentTime();

        super.detached();
    }

    initialLayout()
    {
        super.initialLayout();

        this._currentContentViewDidChange();
    }

    closed()
    {
        super.closed();

        this._timelineContentBrowser.contentViewContainer.closeAllContentViews();

        this._recording.removeEventListener(WI.TimelineRecording.Event.InstrumentAdded, this._instrumentAdded, this);
        this._recording.removeEventListener(WI.TimelineRecording.Event.InstrumentRemoved, this._instrumentRemoved, this);
        this._recording.removeEventListener(WI.TimelineRecording.Event.Reset, this._recordingReset, this);
        if (!this._recording.readonly)
            this._recording.removeEventListener(WI.TimelineRecording.Event.Unloaded, this._recordingUnloaded, this);

        WI.timelineManager.removeEventListener(WI.TimelineManager.Event.CapturingStateChanged, this._handleTimelineCapturingStateChanged, this);

        WI.debuggerManager.removeEventListener(WI.DebuggerManager.Event.Paused, this._debuggerPaused, this);
        WI.debuggerManager.removeEventListener(WI.DebuggerManager.Event.Resumed, this._debuggerResumed, this);

        WI.ContentView.removeEventListener(WI.ContentView.Event.SelectionPathComponentsDidChange, this._contentViewSelectionPathComponentDidChange, this);
        WI.ContentView.removeEventListener(WI.ContentView.Event.SupplementalRepresentedObjectsDidChange, this._contentViewSupplementalRepresentedObjectsDidChange, this);

        WI.TimelineView.removeEventListener(WI.TimelineView.Event.RecordWasFiltered, this._handleTimelineViewRecordFiltered, this);
        WI.TimelineView.removeEventListener(WI.TimelineView.Event.RecordWasSelected, this._handleTimelineViewRecordSelected, this);
        WI.TimelineView.removeEventListener(WI.TimelineView.Event.ScannerShow, this._handleTimelineViewScannerShow, this);
        WI.TimelineView.removeEventListener(WI.TimelineView.Event.ScannerHide, this._handleTimelineViewScannerHide, this);
        WI.TimelineView.removeEventListener(WI.TimelineView.Event.NeedsEntireSelectedRange, this._handleTimelineViewNeedsEntireSelectedRange, this);
    }

    canGoBack()
    {
        return this._timelineContentBrowser.canGoBack();
    }

    canGoForward()
    {
        return this._timelineContentBrowser.canGoForward();
    }

    goBack()
    {
        this._timelineContentBrowser.goBack();
    }

    goForward()
    {
        this._timelineContentBrowser.goForward();
    }

    handleClearShortcut(event)
    {
        this._clearTimeline();
    }

    get canFocusFilterBar()
    {
        return !this._filterBarNavigationItem.hidden;
    }

    focusFilterBar()
    {
        this._filterBarNavigationItem.filterBar.focus();
    }

    // ContentBrowser delegate

    contentBrowserTreeElementForRepresentedObject(contentBrowser, representedObject)
    {
        if (!(representedObject instanceof WI.Timeline) && !(representedObject instanceof WI.TimelineRecording))
            return null;

        let iconClassName;
        let title;
        if (representedObject instanceof WI.Timeline) {
            iconClassName = WI.TimelineTabContentView.iconClassNameForTimelineType(representedObject.type);
            title = WI.UIString("Details");
        } else {
            iconClassName = WI.TimelineTabContentView.StopwatchIconStyleClass;
            title = WI.UIString("Overview");
        }

        const hasChildren = false;
        return new WI.GeneralTreeElement(iconClassName, title, representedObject, hasChildren);
    }

    // Private

    _currentContentViewDidChange(event)
    {
        let newViewMode;
        let timelineView = this.currentTimelineView;
        if (timelineView && timelineView.representedObject.type === WI.TimelineRecord.Type.RenderingFrame)
            newViewMode = WI.TimelineOverview.ViewMode.RenderingFrames;
        else
            newViewMode = WI.TimelineOverview.ViewMode.Timelines;

        this._timelineOverview.viewMode = newViewMode;
        this._updateTimelineOverviewHeight();
        this._updateProgressView();
        this._updateFilterBar();

        if (timelineView) {
            this._updateTimelineViewTimes(timelineView);
            this._filterDidChange();

            let timeline = null;
            if (timelineView.representedObject instanceof WI.Timeline)
                timeline = timelineView.representedObject;

            this._timelineOverview.selectedTimeline = timeline;
        }

        this.dispatchEventToListeners(WI.ContentView.Event.SelectionPathComponentsDidChange);
        this.dispatchEventToListeners(WI.ContentView.Event.NavigationItemsDidChange);
    }

    _timelinePathComponentSelected(event)
    {
        let selectedTimeline = event.data.pathComponent.representedObject;
        this.showTimelineViewForTimeline(selectedTimeline);
    }

    _timeRangePathComponentSelected(event)
    {
        let selectedPathComponent = event.data.pathComponent;
        if (selectedPathComponent === this._selectedTimeRangePathComponent)
            return;

        let timelineRuler = this._timelineOverview.timelineRuler;
        if (selectedPathComponent === this._entireRecordingPathComponent)
            timelineRuler.selectEntireRange();
        else {
            let timelineRange = selectedPathComponent.representedObject;
            timelineRuler.selectionStartTime = timelineRuler.zeroTime + timelineRange.startValue;
            timelineRuler.selectionEndTime = timelineRuler.zeroTime + timelineRange.endValue;
        }
    }

    _contentViewSelectionPathComponentDidChange(event)
    {
        if (!this.isAttached)
            return;

        if (event.target !== this._timelineContentBrowser.currentContentView)
            return;

        this._updateFilterBar();

        this.dispatchEventToListeners(WI.ContentView.Event.SelectionPathComponentsDidChange);

        if (this.currentTimelineView === this._overviewTimelineView)
            return;

        let record = null;
        if (this.currentTimelineView.selectionPathComponents) {
            let recordPathComponent = this.currentTimelineView.selectionPathComponents.find((element) => element.representedObject instanceof WI.TimelineRecord);
            record = recordPathComponent ? recordPathComponent.representedObject : null;
        }

        this._timelineOverview.selectRecord(event.target.representedObject, record);
    }

    _contentViewSupplementalRepresentedObjectsDidChange(event)
    {
        if (event.target !== this._timelineContentBrowser.currentContentView)
            return;
        this.dispatchEventToListeners(WI.ContentView.Event.SupplementalRepresentedObjectsDidChange);
    }

    _inspectorVisibilityStateChanged()
    {
        if (WI.timelineManager.activeRecording !== this._recording)
            return;

        // Stop updating since the results won't be rendered anyway.
        if (!WI.visible && this._updating) {
            this._stopUpdatingCurrentTime();
            return;
        }

        // Nothing else to do if the current time was not being updated.
        if (!WI.visible)
            return;

        let {startTime, endTime} = this.representedObject;
        if (!WI.timelineManager.isCapturing()) {
            // Force the overview to render data from the entire recording.
            // This is necessary if the recording was started when the inspector was not
            // visible because the views were never updated with currentTime/endTime.
            this._updateTimes(startTime, endTime, endTime);
            return;
        }

        this._startUpdatingCurrentTime(endTime);
    }

    _update(timestamp)
    {
        // FIXME: <https://webkit.org/b/153634> Web Inspector: some background tabs think they are the foreground tab and do unnecessary work
        if (!(WI.tabBrowser.selectedTabContentView instanceof WI.TimelineTabContentView))
            return;

        if (this._waitingToResetCurrentTime) {
            requestAnimationFrame(this._updateCallback);
            return;
        }

        var startTime = this._recording.startTime;
        var currentTime = this._currentTime || startTime;
        var endTime = this._recording.endTime;
        var timespanSinceLastUpdate = (timestamp - this._lastUpdateTimestamp) / 1000 || 0;

        currentTime += timespanSinceLastUpdate;

        this._updateTimes(startTime, currentTime, endTime);

        // Only stop updating if the current time is greater than the end time, or the end time is NaN.
        // The recording end time will be NaN if no records were added.
        if (!this._updating && (currentTime >= endTime || isNaN(endTime))) {
            if (this.isAttached)
                this._lastUpdateTimestamp = NaN;
            return;
        }

        this._lastUpdateTimestamp = timestamp;

        requestAnimationFrame(this._updateCallback);
    }

    _updateTimes(startTime, currentTime, endTime)
    {
        if (this._startTimeNeedsReset && !isNaN(startTime)) {
            this._timelineOverview.startTime = startTime;
            this._overviewTimelineView.zeroTime = startTime;
            for (let timelineView of this._timelineViewMap.values())
                timelineView.zeroTime = startTime;

            this._startTimeNeedsReset = false;
        }

        if (WI.timelineManager.capturingState !== WI.TimelineManager.CapturingState.Stopping || this._recording.imported) {
            // Only update end time while not stopping, otherwise the interface continues scrolling.
            this._timelineOverview.endTime = Math.max(endTime, currentTime);

            if (WI.timelineManager.capturingState !== WI.TimelineManager.CapturingState.Inactive || this._recording.imported) {
                // Only update current time while active/starting or else the interface continues scrolling.
                this._currentTime = currentTime;
                this._timelineOverview.currentTime = currentTime;
            }
        }

        if (this.currentTimelineView)
            this._updateTimelineViewTimes(this.currentTimelineView);

        if (this._recording.imported) {
            this._timelineOverview.needsLayout();
            this.currentTimelineView?.needsLayout();
        } else {
            // Force a layout now since we are already in an animation frame and don't need to delay it until the next.
            this._timelineOverview.updateLayoutIfNeeded();
            this.currentTimelineView?.updateLayoutIfNeeded();
        }
    }

    _startUpdatingCurrentTime(startTime)
    {
        console.assert(!this._updating);
        if (this._updating)
            return;

        // Don't update the current time if the Inspector is not visible, as the requestAnimationFrames won't work.
        if (!WI.visible)
            return;

        if (typeof startTime === "number")
            this._currentTime = startTime;
        else if (!isNaN(this._currentTime)) {
            // This happens when you stop and later restart recording. We likely need to jump into
            // the future to a better current time which we can ascertain from a new incoming
            // timeline record, so we wait for a Timeline to update.
            console.assert(!this._waitingToResetCurrentTime);
            this._waitingToResetCurrentTime = true;
            this._recording.addEventListener(WI.TimelineRecording.Event.TimesUpdated, this._recordingTimesUpdated, this);
        }

        this._updating = true;

        if (!this._updateCallback)
            this._updateCallback = this._update.bind(this);

        requestAnimationFrame(this._updateCallback);
    }

    _stopUpdatingCurrentTime()
    {
        console.assert(this._updating);
        this._updating = false;

        if (this._waitingToResetCurrentTime) {
            // Did not get any event while waiting for the current time, but we should stop waiting.
            this._recording.removeEventListener(WI.TimelineRecording.Event.TimesUpdated, this._recordingTimesUpdated, this);
            this._waitingToResetCurrentTime = false;
        }
    }

    _handleTimelineCapturingStateChanged(event)
    {
        let {startTime, endTime} = event.data;

        this._updateProgressView();

        switch (WI.timelineManager.capturingState) {
        case WI.TimelineManager.CapturingState.Active:
            if (!this._updating)
                this._startUpdatingCurrentTime(startTime);

            this._clearTimelineNavigationItem.enabled = !this._recording.readonly;
            this._exportButtonNavigationItem.enabled = false;
            break;

        case WI.TimelineManager.CapturingState.Inactive:
            if (this._updating)
                this._stopUpdatingCurrentTime();

            if (this.currentTimelineView)
                this._updateTimelineViewTimes(this.currentTimelineView);

            this._exportButtonNavigationItem.enabled = this._recording.canExport();
            break;
        }
    }

    _debuggerPaused(event)
    {
        if (this._updating)
            this._stopUpdatingCurrentTime();
    }

    _debuggerResumed(event)
    {
        if (!this._updating)
            this._startUpdatingCurrentTime();
    }

    _recordingTimesUpdated(event)
    {
        if (!this._waitingToResetCurrentTime)
            return;

        // Make the current time be the start time of the last added record. This is the best way
        // currently to jump to the right period of time after recording starts.

        for (var timeline of this._recording.timelines.values()) {
            var lastRecord = timeline.records.lastValue;
            if (!lastRecord)
                continue;
            this._currentTime = Math.max(this._currentTime, lastRecord.startTime);
        }

        this._recording.removeEventListener(WI.TimelineRecording.Event.TimesUpdated, this._recordingTimesUpdated, this);
        this._waitingToResetCurrentTime = false;
    }

    _handleAutoStopCheckboxCheckedDidChange(event)
    {
        WI.settings.timelinesAutoStop.value = this._autoStopCheckboxNavigationItem.checked;
    }

    _handleTimelinesAutoStopSettingChanged(event)
    {
        this._autoStopCheckboxNavigationItem.checked = WI.settings.timelinesAutoStop.value;
    }

    _exportTimelineRecording()
    {
        let json = {
            version: WI.TimelineRecording.SerializationVersion,
            recording: this._recording.exportData(),
            overview: this._timelineOverview.exportData(),
        };
        if (!json.recording || !json.overview) {
            InspectorFrontendHost.beep();
            return;
        }

        let frameName = null;
        let mainFrame = WI.networkManager.mainFrame;
        if (mainFrame)
            frameName = mainFrame.mainResource.urlComponents.host || mainFrame.mainResource.displayName;

        let filename = frameName ? `${frameName}-recording` : this._recording.displayName;

        const forceSaveAs = true;
        WI.FileUtilities.save(this._recording.exportMode, {
            content: JSON.stringify(json),
            suggestedName: filename + ".json",
        }, forceSaveAs);
    }

    _exportButtonNavigationItemClicked(event)
    {
        this._exportTimelineRecording();
    }

    _importButtonNavigationItemClicked(event)
    {
        WI.FileUtilities.importJSON((result) => WI.timelineManager.processJSON(result), {multiple: true});
    }

    _clearTimeline(event)
    {
        if (this._recording.readonly)
            return;

        if (WI.timelineManager.activeRecording === this._recording && WI.timelineManager.isCapturing())
            WI.timelineManager.stopCapturing();

        this._recording.reset();
    }

    _updateTimelineOverviewHeight()
    {
        if (this._timelineOverview.editingInstruments)
            this._timelineOverview.element.style.height = "";
        else {
            const rulerHeight = 23;

            let styleValue = (rulerHeight + this._timelineOverview.height) + "px";
            this._timelineOverview.element.style.height = styleValue;
            this._timelineContentBrowser.element.style.top = styleValue;
        }
    }

    _instrumentAdded(instrumentOrEvent)
    {
        let instrument = instrumentOrEvent instanceof WI.Instrument ? instrumentOrEvent : instrumentOrEvent.data.instrument;
        console.assert(instrument instanceof WI.Instrument, instrument);

        let timeline = this._recording.timelineForInstrument(instrument);
        console.assert(!this._timelineViewMap.has(timeline), timeline);

        this._timelineViewMap.set(timeline, WI.ContentView.createFromRepresentedObject(timeline, {recording: this._recording}));
        if (timeline.type === WI.TimelineRecord.Type.RenderingFrame)
            this._renderingFrameTimeline = timeline;

        let displayName = WI.TimelineTabContentView.displayNameForTimelineType(timeline.type);
        let iconClassName = WI.TimelineTabContentView.iconClassNameForTimelineType(timeline.type);
        let pathComponent = new WI.HierarchicalPathComponent(displayName, iconClassName, timeline);
        pathComponent.addEventListener(WI.HierarchicalPathComponent.Event.SiblingWasSelected, this._timelinePathComponentSelected, this);
        this._pathComponentMap.set(timeline, pathComponent);

        this._timelineCountChanged();
    }

    _instrumentRemoved(event)
    {
        let instrument = event.data.instrument;
        console.assert(instrument instanceof WI.Instrument);

        let timeline = this._recording.timelineForInstrument(instrument);
        console.assert(this._timelineViewMap.has(timeline), timeline);

        let timelineView = this._timelineViewMap.take(timeline);
        if (this.currentTimelineView === timelineView)
            this.showOverviewTimelineView();
        if (timeline.type === WI.TimelineRecord.Type.RenderingFrame)
            this._renderingFrameTimeline = null;

        this._pathComponentMap.delete(timeline);

        this._timelineCountChanged();
    }

    _timelineCountChanged()
    {
        var previousPathComponent = null;
        for (var pathComponent of this._pathComponentMap.values()) {
            if (previousPathComponent) {
                previousPathComponent.nextSibling = pathComponent;
                pathComponent.previousSibling = previousPathComponent;
            }

            previousPathComponent = pathComponent;
        }

        this._updateTimelineOverviewHeight();
    }

    _recordingReset(event)
    {
        for (let timelineView of this._timelineViewMap.values())
            timelineView.reset();

        this._currentTime = NaN;

        if (!this._updating) {
            // Force the time ruler and views to reset to 0.
            this._startTimeNeedsReset = true;
            this._updateTimes(0, 0, 0);
        }

        this._lastUpdateTimestamp = NaN;
        this._startTimeNeedsReset = true;

        this._recording.removeEventListener(WI.TimelineRecording.Event.TimesUpdated, this._recordingTimesUpdated, this);
        this._waitingToResetCurrentTime = false;

        this._timelineOverview.reset();
        this._overviewTimelineView.reset();
        this._clearTimelineNavigationItem.enabled = false;
        this._exportButtonNavigationItem.enabled = false;
    }

    _recordingUnloaded(event)
    {
        console.assert(!this._updating);

        WI.timelineManager.removeEventListener(WI.TimelineManager.Event.CapturingStateChanged, this._handleTimelineCapturingStateChanged, this);
    }

    _timeRangeSelectionChanged(event)
    {
        console.assert(this.currentTimelineView);
        if (!this.currentTimelineView)
            return;

        this._updateTimelineViewTimes(this.currentTimelineView);

        let selectedPathComponent;
        if (this._timelineOverview.timelineRuler.entireRangeSelected)
            selectedPathComponent = this._entireRecordingPathComponent;
        else {
            let timelineRange = this._timelineSelectionPathComponent.representedObject;
            timelineRange.startValue = this.currentTimelineView.startTime;
            timelineRange.endValue = this.currentTimelineView.endTime;

            if (!(this.currentTimelineView instanceof WI.RenderingFrameTimelineView)) {
                timelineRange.startValue -= this.currentTimelineView.zeroTime;
                timelineRange.endValue -= this.currentTimelineView.zeroTime;
            }

            this._updateTimeRangePathComponents();
            selectedPathComponent = this._timelineSelectionPathComponent;
        }

        if (this._selectedTimeRangePathComponent !== selectedPathComponent) {
            this._selectedTimeRangePathComponent = selectedPathComponent;
            this.dispatchEventToListeners(WI.ContentView.Event.SelectionPathComponentsDidChange);
        }
    }

    _recordSelected(event)
    {
        let {record} = event.data;

        this._selectRecordInTimelineView(record);
    }

    _timelineSelected()
    {
        let timeline = this._timelineOverview.selectedTimeline;
        if (timeline)
            this.showTimelineViewForTimeline(timeline);
        else
            this.showOverviewTimelineView();
    }

    _updateTimeRangePathComponents()
    {
        let timelineRange = this._timelineSelectionPathComponent.representedObject;
        let startValue = timelineRange.startValue;
        let endValue = timelineRange.endValue;
        if (isNaN(startValue) || isNaN(endValue)) {
            this._entireRecordingPathComponent.nextSibling = null;
            return;
        }

        this._entireRecordingPathComponent.nextSibling = this._timelineSelectionPathComponent;

        let displayName;
        if (this._timelineOverview.viewMode === WI.TimelineOverview.ViewMode.Timelines) {
            const higherResolution = true;
            let selectionStart = Number.secondsToString(startValue, higherResolution);
            let selectionEnd = Number.secondsToString(endValue, higherResolution);
            const epsilon = 0.0001;
            if (startValue < epsilon)
                displayName = WI.UIString("%s \u2013 %s").format(selectionStart, selectionEnd);
            else {
                let duration = Number.secondsToString(endValue - startValue, higherResolution);
                displayName = WI.UIString("%s \u2013 %s (%s)").format(selectionStart, selectionEnd, duration);
            }
        } else {
            startValue += 1; // Convert index to frame number.
            if (startValue === endValue)
                displayName = WI.UIString("Frame %d").format(startValue);
            else
                displayName = WI.UIString("Frames %d \u2013 %d").format(startValue, endValue);
        }

        this._timelineSelectionPathComponent.displayName = displayName;
        this._timelineSelectionPathComponent.title = displayName;
    }

    _createTimelineRangePathComponent(title)
    {
        let range = new WI.TimelineRange(NaN, NaN);
        let pathComponent = new WI.HierarchicalPathComponent(title || enDash, "time-icon", range);
        pathComponent.addEventListener(WI.HierarchicalPathComponent.Event.SiblingWasSelected, this._timeRangePathComponentSelected, this);

        return pathComponent;
    }

    _updateTimelineViewTimes(timelineView)
    {
        let timelineRuler = this._timelineOverview.timelineRuler;
        let entireRangeSelected = timelineRuler.entireRangeSelected;
        let endTime = this._timelineOverview.selectionStartTime + this._timelineOverview.selectionDuration;

        if (entireRangeSelected) {
            if (timelineView instanceof WI.RenderingFrameTimelineView)
                endTime = this._renderingFrameTimeline.records.length;
            else if (timelineView instanceof WI.HeapAllocationsTimelineView) {
                // Since heap snapshots can be added at any time, including when not actively recording,
                // make sure to set the end time to an effectively infinite number so any new records
                // that are added in the future aren't filtered out.
                endTime = Number.MAX_VALUE;
            } else {
                // Clamp selection to the end of the recording (with padding),
                // so graph views will show an auto-sized graph without a lot of
                // empty space at the end.
                endTime = isNaN(this._recording.endTime) ? this._recording.currentTime : this._recording.endTime;
                endTime += timelineRuler.minimumSelectionDuration;
            }
        }

        timelineView.startTime = this._timelineOverview.selectionStartTime;
        timelineView.currentTime = this._currentTime;
        timelineView.endTime = endTime;
    }

    _editingInstrumentsDidChange(event)
    {
        let editingInstruments = this._timelineOverview.editingInstruments;
        this.element.classList.toggle(WI.TimelineOverview.EditInstrumentsStyleClassName, editingInstruments);

        this._updateTimelineOverviewHeight();
    }

    _filterDidChange()
    {
        if (!this.currentTimelineView)
            return;

        this.currentTimelineView.updateFilter(this._filterBarNavigationItem.filterBar.filters);
    }

    _handleTimelineViewRecordFiltered(event)
    {
        if (event.target !== this.currentTimelineView)
            return;

        console.assert(this.currentTimelineView);

        let timeline = this.currentTimelineView.representedObject;
        if (!(timeline instanceof WI.Timeline))
            return;

        let record = event.data.record;
        let filtered = event.data.filtered;
        this._timelineOverview.recordWasFiltered(timeline, record, filtered);
    }

    _handleTimelineViewRecordSelected(event)
    {
        if (!this.isAttached)
            return;

        let {record} = event.data;

        this._selectRecordInTimelineOverview(record);
        this._selectRecordInTimelineView(record);
    }

    _selectRecordInTimelineOverview(record)
    {
        let timeline = this._recording.timelineForRecordType(record.type);
        if (!timeline)
            return;

        this._timelineOverview.selectRecord(timeline, record);
    }

    _selectRecordInTimelineView(record)
    {
        for (let timelineView of this._timelineViewMap.values()) {
            let recordMatchesTimeline = record && timelineView.representedObject.type === record.type;

            if (recordMatchesTimeline && timelineView !== this.currentTimelineView)
                this.showTimelineViewForTimeline(timelineView.representedObject);

            if (!record || recordMatchesTimeline)
                timelineView.selectRecord(record);
        }
    }

    _handleTimelineViewScannerShow(event)
    {
        if (!this.isAttached)
            return;

        let {time} = event.data;
        this._timelineOverview.showScanner(time);
    }

    _handleTimelineViewScannerHide(event)
    {
        if (!this.isAttached)
            return;

        this._timelineOverview.hideScanner();
    }

    _handleTimelineViewNeedsEntireSelectedRange(event)
    {
        if (!this.isAttached)
            return;

        this._timelineOverview.timelineRuler.selectEntireRange();
    }

    _handleTimelineViewNeedsFiltersCleared(event)
    {
        if (!this.isAttached)
            return;

        this._filterBarNavigationItem.filterBar.clear();
    }

    _updateProgressView()
    {
        let isCapturing = WI.timelineManager.isCapturing();
        this._progressView.visible = isCapturing && this.currentTimelineView && !this.currentTimelineView.showsLiveRecordingData;
    }

    _updateFilterBar()
    {
        this._filterBarNavigationItem.hidden = !this.currentTimelineView || !this.currentTimelineView.showsFilterBar;
    }
};
