/*
 * Copyright (C) 2013, 2016 Apple Inc. All rights reserved.
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

// FIXME: TimelineManager lacks advanced multi-target support. (Instruments/Profilers per-target)

WI.TimelineManager = class TimelineManager extends WI.Object
{
    constructor()
    {
        super();

        this._enabled = false;

        WI.Frame.addEventListener(WI.Frame.Event.ProvisionalLoadStarted, this._provisionalLoadStarted, this);
        WI.Frame.addEventListener(WI.Frame.Event.MainResourceDidChange, this._mainResourceDidChange, this);

        WI.consoleManager.addEventListener(WI.ConsoleManager.Event.MessageAdded, this._handleMessageAdded, this);

        this._enabledTimelineTypesSetting = new WI.Setting("enabled-instrument-types", WI.TimelineManager.defaultTimelineTypes());

        this._capturingState = TimelineManager.CapturingState.Inactive;
        this._capturingInstrumentCount = 0;
        this._capturingStartTime = NaN;
        this._capturingEndTime = NaN;

        this._initiatedByBackendStart = false;
        this._initiatedByBackendStop = false;

        this._isCapturingPageReload = false;
        this._autoCaptureOnPageLoad = false;
        this._mainResourceForAutoCapturing = null;
        this._shouldSetAutoCapturingMainResource = false;
        this._transitioningPageTarget = false;

        this._webTimelineScriptRecordsExpectingScriptProfilerEvents = null;
        this._scriptProfilerRecords = null;

        this._boundStopCapturing = this.stopCapturing.bind(this);
        this._stopCapturingTimeout = undefined;
        this._deadTimeTimeout = undefined;
        this._lastDeadTimeTickle = 0;
    }

    // Agent

    get domains() { return ["Timeline"]; }

    activateExtraDomain(domain)
    {
        // COMPATIBILITY (iOS 14.0): Inspector.activateExtraDomains was removed in favor of a declared debuggable type

        console.assert(domain === "Timeline");

        for (let target of WI.targets)
            this.initializeTarget(target);
    }

    // Target

    initializeTarget(target)
    {
        if (!this._enabled)
            return;

        if (target.hasDomain("Timeline")) {
            // COMPATIBILITY (iOS 13): Timeline.enable did not exist yet.
            if (target.hasCommand("Timeline.enable"))
                target.TimelineAgent.enable();

            this._updateAutoCaptureInstruments([target]);

            target.TimelineAgent.setAutoCaptureEnabled(this._autoCaptureOnPageLoad);
        }
    }

    transitionPageTarget()
    {
        this._transitioningPageTarget = true;
    }

    // Static

    static defaultTimelineTypes()
    {
        if (WI.sharedApp.debuggableType === WI.DebuggableType.JavaScript || WI.sharedApp.debuggableType === WI.DebuggableType.ITML) {
            return [
                WI.TimelineRecord.Type.Script,
                WI.TimelineRecord.Type.HeapAllocations,
            ];
        }

        if (WI.sharedApp.debuggableType === WI.DebuggableType.ServiceWorker) {
            // FIXME: Support Network Timeline in ServiceWorker.
            return [
                WI.TimelineRecord.Type.Script,
                WI.TimelineRecord.Type.HeapAllocations,
            ];
        }

        let defaultTypes = [];

        if (WI.ScreenshotsInstrument.supported())
            defaultTypes.push(WI.TimelineRecord.Type.Screenshots);

        defaultTypes.push(WI.TimelineRecord.Type.Network);
        defaultTypes.push(WI.TimelineRecord.Type.Layout);
        defaultTypes.push(WI.TimelineRecord.Type.Script);
        defaultTypes.push(WI.TimelineRecord.Type.RenderingFrame);

        if (WI.CPUInstrument.supported())
            defaultTypes.push(WI.TimelineRecord.Type.CPU);

        return defaultTypes;
    }

    static availableTimelineTypes()
    {
        let types = WI.TimelineManager.defaultTimelineTypes();
        if (WI.sharedApp.debuggableType === WI.DebuggableType.JavaScript || WI.sharedApp.debuggableType === WI.DebuggableType.ServiceWorker || WI.sharedApp.debuggableType === WI.DebuggableType.ITML)
            return types;

        types.push(WI.TimelineRecord.Type.Memory);
        types.push(WI.TimelineRecord.Type.HeapAllocations);

        if (WI.MediaInstrument.supported()) {
            let insertionIndex = types.indexOf(WI.TimelineRecord.Type.Layout) + 1;
            types.insertAtIndex(WI.TimelineRecord.Type.Media, insertionIndex || types.length);
        }

        return types;
    }

    static synthesizeImportError(message)
    {
        message = WI.UIString("Timeline Recording Import Error: %s").format(message);

        if (window.InspectorTest) {
            console.error(message);
            return;
        }

        let consoleMessage = new WI.ConsoleMessage(WI.mainTarget, WI.ConsoleMessage.MessageSource.Other, WI.ConsoleMessage.MessageLevel.Error, message);
        consoleMessage.shouldRevealConsole = true;

        WI.consoleLogViewController.appendConsoleMessage(consoleMessage);
    }

    // Public

    get capturingState() { return this._capturingState; }

    reset()
    {
        if (this._capturingState === TimelineManager.CapturingState.Starting || this._capturingState === TimelineManager.CapturingState.Active)
            this.stopCapturing();

        this._recordings = [];
        this._activeRecording = null;
        this._nextRecordingIdentifier = 1;

        this._loadNewRecording();
    }

    // The current recording that new timeline records will be appended to, if any.
    get activeRecording()
    {
        console.assert(this._activeRecording || !this.isCapturing());
        return this._activeRecording;
    }

    get autoCaptureOnPageLoad()
    {
        return this._autoCaptureOnPageLoad;
    }

    set autoCaptureOnPageLoad(autoCapture)
    {
        console.assert(this._enabled);

        autoCapture = !!autoCapture;

        if (this._autoCaptureOnPageLoad === autoCapture)
            return;

        this._autoCaptureOnPageLoad = autoCapture;

        for (let target of WI.targets) {
            if (target.hasCommand("Timeline.setAutoCaptureEnabled"))
                target.TimelineAgent.setAutoCaptureEnabled(this._autoCaptureOnPageLoad);
        }
    }

    get enabledTimelineTypes()
    {
        let availableTimelineTypes = WI.TimelineManager.availableTimelineTypes();
        return this._enabledTimelineTypesSetting.value.filter((type) => availableTimelineTypes.includes(type));
    }

    set enabledTimelineTypes(x)
    {
        this._enabledTimelineTypesSetting.value = x || [];

        this._updateAutoCaptureInstruments(WI.targets);
    }

    isCapturing()
    {
        return this._capturingState !== TimelineManager.CapturingState.Inactive;
    }

    isCapturingPageReload()
    {
        return this._isCapturingPageReload;
    }

    willAutoStop()
    {
        return !!this._stopCapturingTimeout;
    }

    relaxAutoStop()
    {
        if (this._stopCapturingTimeout) {
            clearTimeout(this._stopCapturingTimeout);
            this._stopCapturingTimeout = undefined;
        }

        if (this._deadTimeTimeout) {
            clearTimeout(this._deadTimeTimeout);
            this._deadTimeTimeout = undefined;
        }
    }

    enable()
    {
        if (this._enabled)
            return;

        this._enabled = true;

        this.reset();

        for (let target of WI.targets)
            this.initializeTarget(target);
    }

    disable()
    {
        if (!this._enabled)
            return;

        this.reset();

        for (let target of WI.targets) {
            // COMPATIBILITY (iOS 13): Timeline.disable did not exist yet.
            if (target.hasCommand("Timeline.disable"))
                target.TimelineAgent.disable();
        }

        this._enabled = false;
    }

    startCapturing(shouldCreateRecording)
    {
        console.assert(this._enabled);

        console.assert(this._capturingState === TimelineManager.CapturingState.Stopping || this._capturingState === TimelineManager.CapturingState.Inactive, "TimelineManager is already capturing.");
        if (this._capturingState !== TimelineManager.CapturingState.Stopping && this._capturingState !== TimelineManager.CapturingState.Inactive)
            return;

        if (!this._activeRecording || shouldCreateRecording)
            this._loadNewRecording();

        this._updateCapturingState(TimelineManager.CapturingState.Starting);

        this._capturingStartTime = NaN;
        this._activeRecording.start(this._initiatedByBackendStart);
    }

    stopCapturing()
    {
        console.assert(this._enabled);

        console.assert(this._capturingState === TimelineManager.CapturingState.Starting || this._capturingState === TimelineManager.CapturingState.Active, "TimelineManager is not capturing.");
        if (this._capturingState !== TimelineManager.CapturingState.Starting && this._capturingState !== TimelineManager.CapturingState.Active)
            return;

        this._updateCapturingState(TimelineManager.CapturingState.Stopping);

        this._capturingEndTime = NaN;
        this._activeRecording.stop(this._initiatedByBackendStop);
    }

    async processJSON({filename, json, error})
    {
        if (error) {
            WI.TimelineManager.synthesizeImportError(error);
            return;
        }

        if (typeof json !== "object" || json === null) {
            WI.TimelineManager.synthesizeImportError(WI.UIString("invalid JSON"));
            return;
        }

        if (!json.recording || typeof json.recording !== "object" || !json.overview || typeof json.overview !== "object" || typeof json.version !== "number") {
            WI.TimelineManager.synthesizeImportError(WI.UIString("invalid JSON"));
            return;
        }

        if (json.version !== WI.TimelineRecording.SerializationVersion) {
            WI.NetworkManager.synthesizeImportError(WI.UIString("unsupported version"));
            return;
        }

        let recordingData = json.recording;
        let overviewData = json.overview;

        let identifier = this._nextRecordingIdentifier++;
        let newRecording = await WI.TimelineRecording.import(identifier, recordingData, filename);
        this._recordings.push(newRecording);

        this.dispatchEventToListeners(WI.TimelineManager.Event.RecordingCreated, {recording: newRecording});

        if (this._capturingState === TimelineManager.CapturingState.Starting || this._capturingState === TimelineManager.CapturingState.Active)
            this.stopCapturing();

        let oldRecording = this._activeRecording;
        if (oldRecording) {
            const importing = true;
            oldRecording.unloaded(importing);
        }

        this._activeRecording = newRecording;

        this.dispatchEventToListeners(WI.TimelineManager.Event.RecordingLoaded, {oldRecording});
        this.dispatchEventToListeners(WI.TimelineManager.Event.RecordingImported, {overviewData});
    }

    computeElapsedTime(timestamp)
    {
        if (!this._activeRecording)
            return 0;

        return this._activeRecording.computeElapsedTime(timestamp);
    }

    scriptProfilerIsTracking()
    {
        return this._scriptProfilerRecords !== null;
    }

    // ConsoleObserver

    heapSnapshotAdded(timestamp, snapshot)
    {
        if (!this._enabled)
            return;

        this._addRecord(new WI.HeapAllocationsTimelineRecord(timestamp, snapshot));
    }

    // TimelineObserver

    capturingStarted(startTime)
    {
        // The frontend didn't start capturing, so this was a programmatic start.
        if (this._capturingState === TimelineManager.CapturingState.Inactive) {
            this._initiatedByBackendStart = true;
            this._activeRecording.addScriptInstrumentForProgrammaticCapture();
            this.startCapturing();
        }

        if (!isNaN(startTime)) {
            if (isNaN(this._capturingStartTime) || startTime < this._capturingStartTime)
                this._capturingStartTime = startTime;

            this._activeRecording.initializeTimeBoundsIfNecessary(startTime);
        }

        this._capturingInstrumentCount++;
        console.assert(this._capturingInstrumentCount);
        if (this._capturingInstrumentCount > 1)
            return;

        if (this._capturingState === TimelineManager.CapturingState.Active)
            return;

        this._lastDeadTimeTickle = 0;

        this._webTimelineScriptRecordsExpectingScriptProfilerEvents = [];

        this._activeRecording.capturingStarted(this._capturingStartTime);

        WI.settings.timelinesAutoStop.addEventListener(WI.Setting.Event.Changed, this._handleTimelinesAutoStopSettingChanged, this);

        WI.Frame.addEventListener(WI.Frame.Event.ResourceWasAdded, this._resourceWasAdded, this);
        WI.Target.addEventListener(WI.Target.Event.ResourceAdded, this._resourceWasAdded, this);

        WI.heapManager.addEventListener(WI.HeapManager.Event.GarbageCollected, this._garbageCollected, this);

        WI.memoryManager.addEventListener(WI.MemoryManager.Event.MemoryPressure, this._memoryPressure, this);

        WI.DOMNode.addEventListener(WI.DOMNode.Event.DidFireEvent, this._handleDOMNodeDidFireEvent, this);
        WI.DOMNode.addEventListener(WI.DOMNode.Event.PowerEfficientPlaybackStateChanged, this._handleDOMNodePowerEfficientPlaybackStateChanged, this);

        this._updateCapturingState(TimelineManager.CapturingState.Active, {startTime: this._capturingStartTime});
    }

    capturingStopped(endTime)
    {
        // The frontend didn't stop capturing, so this was a programmatic stop.
        if (this._capturingState === TimelineManager.CapturingState.Active) {
            this._initiatedByBackendStop = true;
            this.stopCapturing();
        }

        if (!isNaN(endTime)) {
            if (isNaN(this._capturingEndTime) || endTime > this._capturingEndTime)
                this._capturingEndTime = endTime;
        }

        this._capturingInstrumentCount--;
        console.assert(this._capturingInstrumentCount >= 0);
        if (this._capturingInstrumentCount)
            return;

        if (this._capturingState === TimelineManager.CapturingState.Inactive)
            return;

        WI.DOMNode.removeEventListener(WI.DOMNode.Event.DidFireEvent, this._handleDOMNodeDidFireEvent, this);
        WI.DOMNode.removeEventListener(WI.DOMNode.Event.PowerEfficientPlaybackStateChanged, this._handleDOMNodePowerEfficientPlaybackStateChanged, this);

        WI.heapManager.removeEventListener(WI.HeapManager.Event.GarbageCollected, this._garbageCollected, this);

        WI.memoryManager.removeEventListener(WI.MemoryManager.Event.MemoryPressure, this._memoryPressure, this);

        WI.Target.removeEventListener(WI.Target.Event.ResourceAdded, this._resourceWasAdded, this);
        WI.Frame.removeEventListener(WI.Frame.Event.ResourceWasAdded, this._resourceWasAdded, this);

        WI.settings.timelinesAutoStop.removeEventListener(WI.Setting.Event.Changed, this._handleTimelinesAutoStopSettingChanged, this);

        this._activeRecording.capturingStopped(this._capturingEndTime);

        this.relaxAutoStop();

        this._isCapturingPageReload = false;
        this._shouldSetAutoCapturingMainResource = false;
        this._mainResourceForAutoCapturing = null;
        this._initiatedByBackendStart = false;
        this._initiatedByBackendStop = false;

        this._updateCapturingState(TimelineManager.CapturingState.Inactive, {endTime: this._capturingEndTime});
    }

    autoCaptureStarted()
    {
        console.assert(this._enabled);

        let waitingForCapturingStartedEvent = this._capturingState === TimelineManager.CapturingState.Starting;

        if (this._capturingState === TimelineManager.CapturingState.Starting || this._capturingState === TimelineManager.CapturingState.Active)
            this.stopCapturing();

        this._initiatedByBackendStart = true;

        // We may already have an fresh TimelineRecording created if autoCaptureStarted is received
        // between sending the Timeline.start command and receiving Timeline.capturingStarted event.
        // In that case, there is no need to call startCapturing again. Reuse the fresh recording.
        if (!waitingForCapturingStartedEvent) {
            const createNewRecording = true;
            this.startCapturing(createNewRecording);
        }

        this._shouldSetAutoCapturingMainResource = true;
    }

    eventRecorded(recordPayload)
    {
        if (!this._enabled)
            return;

        console.assert(this.isCapturing());
        if (!this.isCapturing())
            return;

        var records = [];

        // Iterate over the records tree using a stack. Doing this recursively has
        // been known to cause a call stack overflow. https://webkit.org/b/79106
        var stack = [{array: [recordPayload], parent: null, parentRecord: null, index: 0}];
        while (stack.length) {
            var entry = stack.lastValue;
            var recordPayloads = entry.array;

            if (entry.index < recordPayloads.length) {
                var recordPayload = recordPayloads[entry.index];
                var record = this._processEvent(recordPayload, entry.parent);
                if (record) {
                    record.parent = entry.parentRecord;
                    records.push(record);
                    if (entry.parentRecord)
                        entry.parentRecord.children.push(record);
                }

                if (recordPayload.children && recordPayload.children.length)
                    stack.push({array: recordPayload.children, parent: recordPayload, parentRecord: record || entry.parentRecord, index: 0});
                ++entry.index;
            } else
                stack.pop();
        }

        for (var record of records) {
            if (record.type === WI.TimelineRecord.Type.RenderingFrame) {
                if (!record.children.length)
                    continue;
                record.setupFrameIndex();
            }

            this._addRecord(record);
        }
    }

    // PageObserver

    pageDOMContentLoadedEventFired(timestamp)
    {
        if (!this._enabled)
            return;

        console.assert(this._activeRecording);

        let computedTimestamp = this._activeRecording.computeElapsedTime(timestamp);

        if (WI.networkManager.mainFrame)
            WI.networkManager.mainFrame.markDOMContentReadyEvent(computedTimestamp);

        let eventMarker = new WI.TimelineMarker(computedTimestamp, WI.TimelineMarker.Type.DOMContentEvent);
        this._activeRecording.addEventMarker(eventMarker);
    }

    pageLoadEventFired(timestamp)
    {
        if (!this._enabled)
            return;

        console.assert(this._activeRecording);

        let computedTimestamp = this._activeRecording.computeElapsedTime(timestamp);

        if (WI.networkManager.mainFrame)
            WI.networkManager.mainFrame.markLoadEvent(computedTimestamp);

        let eventMarker = new WI.TimelineMarker(computedTimestamp, WI.TimelineMarker.Type.LoadEvent);
        this._activeRecording.addEventMarker(eventMarker);

        this._stopAutoRecordingSoon();
    }

    // CPUProfilerObserver

    cpuProfilerTrackingStarted(timestamp)
    {
        this.capturingStarted(timestamp);
    }

    cpuProfilerTrackingUpdated(event)
    {
        if (!this._enabled)
            return;

        console.assert(this.isCapturing());
        if (!this.isCapturing())
            return;

        this._addRecord(new WI.CPUTimelineRecord(event));
    }

    cpuProfilerTrackingCompleted(timestamp)
    {
        this.capturingStopped(timestamp);
    }

    // ScriptProfilerObserver

    scriptProfilerTrackingStarted(timestamp)
    {
        this._scriptProfilerRecords = [];

        this.capturingStarted(timestamp);
    }

    scriptProfilerTrackingUpdated(event)
    {
        if (!this._enabled)
            return;

        let {startTime, endTime, type} = event;
        let scriptRecordType = this._scriptProfilerTypeToScriptTimelineRecordType(type);
        let record = new WI.ScriptTimelineRecord(scriptRecordType, startTime, endTime, null, null, null, null);
        record.__scriptProfilerType = type;
        this._scriptProfilerRecords.push(record);

        // "Other" events, generated by Web content, will have wrapping Timeline records
        // and need to be merged. Non-Other events, generated purely by the JavaScript
        // engine or outside of the page via APIs, will not have wrapping Timeline
        // records, so these records can just be added right now.
        if (type !== InspectorBackend.Enum.ScriptProfiler.EventType.Other)
            this._addRecord(record);
    }

    scriptProfilerTrackingCompleted(timestamp, samples)
    {
        if (this._enabled) {
            console.assert(!this._webTimelineScriptRecordsExpectingScriptProfilerEvents || this._scriptProfilerRecords.length >= this._webTimelineScriptRecordsExpectingScriptProfilerEvents.length);

            if (samples) {
                let {stackTraces} = samples;
                let topDownCallingContextTree = this._activeRecording.topDownCallingContextTree;

                // Calculate a per-sample duration.
                let timestampIndex = 0;
                let timestampCount = stackTraces.length;
                let sampleDurations = new Array(timestampCount);
                let sampleDurationIndex = 0;
                const defaultDuration = 1 / 1000; // 1ms.
                for (let i = 0; i < this._scriptProfilerRecords.length; ++i) {
                    let record = this._scriptProfilerRecords[i];

                    // Use a default duration for timestamps recorded outside of ScriptProfiler events.
                    while (timestampIndex < timestampCount && stackTraces[timestampIndex].timestamp < record.startTime) {
                        sampleDurations[sampleDurationIndex++] = defaultDuration;
                        timestampIndex++;
                    }

                    // Average the duration per sample across all samples during the record.
                    let samplesInRecord = 0;
                    while (timestampIndex < timestampCount && stackTraces[timestampIndex].timestamp < record.endTime) {
                        timestampIndex++;
                        samplesInRecord++;
                    }
                    if (samplesInRecord) {
                        let averageDuration = (record.endTime - record.startTime) / samplesInRecord;
                        sampleDurations.fill(averageDuration, sampleDurationIndex, sampleDurationIndex + samplesInRecord);
                        sampleDurationIndex += samplesInRecord;
                    }
                }

                // Use a default duration for timestamps recorded outside of ScriptProfiler events.
                if (timestampIndex < timestampCount)
                    sampleDurations.fill(defaultDuration, sampleDurationIndex);

                this._activeRecording.initializeCallingContextTrees(stackTraces, sampleDurations);

                // FIXME: This transformation should not be needed after introducing ProfileView.
                // Once we eliminate ProfileNodeTreeElements and ProfileNodeDataGridNodes.
                // <https://webkit.org/b/154973> Web Inspector: Timelines UI redesign: Remove TimelineSidebarPanel
                for (let i = 0; i < this._scriptProfilerRecords.length; ++i) {
                    let record = this._scriptProfilerRecords[i];
                    record.profilePayload = topDownCallingContextTree.toCPUProfilePayload(record.startTime, record.endTime);
                }
            }

            // Associate the ScriptProfiler created records with Web Timeline records.
            // Filter out the already added ScriptProfiler events which should not have been wrapped.
            if (WI.sharedApp.debuggableType !== WI.DebuggableType.JavaScript && WI.sharedApp.debuggableType !== WI.DebuggableType.ITML) {
                this._scriptProfilerRecords = this._scriptProfilerRecords.filter((x) => x.__scriptProfilerType === InspectorBackend.Enum.ScriptProfiler.EventType.Other);
                this._mergeScriptProfileRecords();
            }

            this._scriptProfilerRecords = null;

            let timeline = this._activeRecording.timelineForRecordType(WI.TimelineRecord.Type.Script);
            timeline.refresh();
        }

        this.capturingStopped(timestamp);
    }

    // MemoryObserver

    memoryTrackingStarted(timestamp)
    {
        this.capturingStarted(timestamp);
    }

    memoryTrackingUpdated(event)
    {
        if (!this._enabled)
            return;

        console.assert(this.isCapturing());
        if (!this.isCapturing())
            return;

        this._addRecord(new WI.MemoryTimelineRecord(event.timestamp, event.categories));
    }

    memoryTrackingCompleted(timestamp)
    {
        this.capturingStopped(timestamp);
    }

    // HeapObserver

    heapTrackingStarted(timestamp, snapshot)
    {
        this.capturingStarted(timestamp);

        if (this._enabled)
            this._addRecord(new WI.HeapAllocationsTimelineRecord(timestamp, snapshot));
    }

    heapTrackingCompleted(timestamp, snapshot)
    {
        if (this._enabled)
            this._addRecord(new WI.HeapAllocationsTimelineRecord(timestamp, snapshot));

        this.capturingStopped();
    }

    // AnimationObserver

    animationTrackingStarted(timestamp)
    {
        this.capturingStarted(timestamp);
    }

    animationTrackingUpdated(timestamp, event)
    {
        if (!this._enabled)
            return;

        console.assert(this.isCapturing());
        if (!this.isCapturing())
            return;

        let mediaTimeline = this._activeRecording.timelineForRecordType(WI.TimelineRecord.Type.Media);
        console.assert(mediaTimeline);

        let record = mediaTimeline.recordForTrackingAnimationId(event.trackingAnimationId);
        if (!record) {
            let details = {
                trackingAnimationId: event.trackingAnimationId,
            };

            let eventType;
            if (event.animationName) {
                eventType = WI.MediaTimelineRecord.EventType.CSSAnimation;
                details.animationName = event.animationName;
            } else if (event.transitionProperty) {
                eventType = WI.MediaTimelineRecord.EventType.CSSTransition;
                details.transitionProperty = event.transitionProperty;
            } else {
                WI.reportInternalError(`Unknown event type for event '${JSON.stringify(event)}'`);
                return;
            }

            let domNode = WI.domManager.nodeForId(event.nodeId);
            console.assert(domNode);

            record = new WI.MediaTimelineRecord(eventType, domNode, details);
            this._addRecord(record);
        }

        record.updateAnimationState(timestamp, event.animationState);
    }

    animationTrackingCompleted(timestamp)
    {
        this.capturingStopped(timestamp);
    }

    // Private

    _updateCapturingState(state, data = {})
    {
        if (this._capturingState === state)
            return;

        this._capturingState = state;

        this.dispatchEventToListeners(TimelineManager.Event.CapturingStateChanged, data);
    }

    _processRecord(recordPayload, parentRecordPayload)
    {
        console.assert(this.isCapturing());

        var startTime = this._activeRecording.computeElapsedTime(recordPayload.startTime);
        var endTime = this._activeRecording.computeElapsedTime(recordPayload.endTime);
        let stackTrace = this._stackTraceFromPayload(recordPayload.stackTrace);

        var significantCallFrame = null;
        if (stackTrace) {
            for (let callFrame of stackTrace.callFrames) {
                if (callFrame.nativeCode)
                    continue;
                significantCallFrame = callFrame;
                break;
            }
        }

        var sourceCodeLocation = significantCallFrame && significantCallFrame.sourceCodeLocation;

        switch (recordPayload.type) {
        case InspectorBackend.Enum.Timeline.EventType.ScheduleStyleRecalculation:
            console.assert(isNaN(endTime));

            // Pass the startTime as the endTime since this record type has no duration.
            return new WI.LayoutTimelineRecord(WI.LayoutTimelineRecord.EventType.InvalidateStyles, startTime, startTime, stackTrace, sourceCodeLocation);

        case InspectorBackend.Enum.Timeline.EventType.RecalculateStyles:
            return new WI.LayoutTimelineRecord(WI.LayoutTimelineRecord.EventType.RecalculateStyles, startTime, endTime, stackTrace, sourceCodeLocation);

        case InspectorBackend.Enum.Timeline.EventType.InvalidateLayout:
            console.assert(isNaN(endTime));

            // Pass the startTime as the endTime since this record type has no duration.
            return new WI.LayoutTimelineRecord(WI.LayoutTimelineRecord.EventType.InvalidateLayout, startTime, startTime, stackTrace, sourceCodeLocation);

        case InspectorBackend.Enum.Timeline.EventType.Layout:
            var layoutRecordType = sourceCodeLocation ? WI.LayoutTimelineRecord.EventType.ForcedLayout : WI.LayoutTimelineRecord.EventType.Layout;
            var quad = new WI.Quad(recordPayload.data.root);
            return new WI.LayoutTimelineRecord(layoutRecordType, startTime, endTime, stackTrace, sourceCodeLocation, quad);

        case InspectorBackend.Enum.Timeline.EventType.Paint:
            var quad = new WI.Quad(recordPayload.data.clip);
            return new WI.LayoutTimelineRecord(WI.LayoutTimelineRecord.EventType.Paint, startTime, endTime, stackTrace, sourceCodeLocation, quad);

        case InspectorBackend.Enum.Timeline.EventType.Composite:
            return new WI.LayoutTimelineRecord(WI.LayoutTimelineRecord.EventType.Composite, startTime, endTime, stackTrace, sourceCodeLocation);

        case InspectorBackend.Enum.Timeline.EventType.RenderingFrame:
            if (!recordPayload.children || !recordPayload.children.length)
                return null;

            return new WI.RenderingFrameTimelineRecord(startTime, endTime, recordPayload.data.name);

        case InspectorBackend.Enum.Timeline.EventType.EvaluateScript:
            if (!sourceCodeLocation) {
                var mainFrame = WI.networkManager.mainFrame;
                const recursivelySearchChildFrames = true;
                let scriptResource = mainFrame.url === recordPayload.data.url ? mainFrame.mainResource : mainFrame.resourcesForURL(recordPayload.data.url, recursivelySearchChildFrames).lastValue;
                if (scriptResource) {
                    // The lineNumber is 1-based, but we expect 0-based.
                    let lineNumber = recordPayload.data.lineNumber - 1;
                    let columnNumber = "columnNumber" in recordPayload.data ? recordPayload.data.columnNumber - 1 : 0;
                    sourceCodeLocation = scriptResource.createSourceCodeLocation(lineNumber, columnNumber);
                }
            }

            var profileData = recordPayload.data.profile;

            var record;
            switch (parentRecordPayload && parentRecordPayload.type) {
            case InspectorBackend.Enum.Timeline.EventType.TimerFire:
                record = new WI.ScriptTimelineRecord(WI.ScriptTimelineRecord.EventType.TimerFired, startTime, endTime, stackTrace, sourceCodeLocation, parentRecordPayload.data.timerId, profileData);
                break;
            case InspectorBackend.Enum.Timeline.EventType.ObserverCallback:
                record = new WI.ScriptTimelineRecord(WI.ScriptTimelineRecord.EventType.ObserverCallback, startTime, endTime, stackTrace, sourceCodeLocation, parentRecordPayload.data.type, profileData);
                break;
            case InspectorBackend.Enum.Timeline.EventType.FireAnimationFrame:
                record = new WI.ScriptTimelineRecord(WI.ScriptTimelineRecord.EventType.AnimationFrameFired, startTime, endTime, stackTrace, sourceCodeLocation, parentRecordPayload.data.id, profileData);
                break;
            default:
                record = new WI.ScriptTimelineRecord(WI.ScriptTimelineRecord.EventType.ScriptEvaluated, startTime, endTime, stackTrace, sourceCodeLocation, null, profileData);
                break;
            }

            this._webTimelineScriptRecordsExpectingScriptProfilerEvents.push(record);
            return record;

        case InspectorBackend.Enum.Timeline.EventType.ConsoleProfile:
            return new WI.ScriptTimelineRecord(WI.ScriptTimelineRecord.EventType.ConsoleProfileRecorded, startTime, endTime, stackTrace, sourceCodeLocation, recordPayload.data.title);

        case InspectorBackend.Enum.Timeline.EventType.TimerFire:
        case InspectorBackend.Enum.Timeline.EventType.EventDispatch:
        case InspectorBackend.Enum.Timeline.EventType.FireAnimationFrame:
        case InspectorBackend.Enum.Timeline.EventType.ObserverCallback:
            // These are handled when we see the child FunctionCall or EvaluateScript.
            break;

        case InspectorBackend.Enum.Timeline.EventType.FunctionCall:
            // FunctionCall always happens as a child of another record, and since the FunctionCall record
            // has useful info we just make the timeline record here (combining the data from both records).
            if (!parentRecordPayload) {
                console.warn("Unexpectedly received a FunctionCall timeline record without a parent record");
                break;
            }

            if (!sourceCodeLocation) {
                var mainFrame = WI.networkManager.mainFrame;
                const recursivelySearchChildFrames = true;
                let scriptResource = mainFrame.url === recordPayload.data.scriptName ? mainFrame.mainResource : mainFrame.resourcesForURL(recordPayload.data.scriptName, recursivelySearchChildFrames).lastValue;
                if (scriptResource) {
                    // The lineNumber is 1-based, but we expect 0-based.
                    let lineNumber = recordPayload.data.scriptLine - 1;
                    let columnNumber = "scriptColumn" in recordPayload.data ? recordPayload.data.scriptColumn - 1 : 0;
                    sourceCodeLocation = scriptResource.createSourceCodeLocation(lineNumber, columnNumber);
                }
            }

            var profileData = recordPayload.data.profile;

            var record;
            switch (parentRecordPayload.type) {
            case InspectorBackend.Enum.Timeline.EventType.TimerFire:
                record = new WI.ScriptTimelineRecord(WI.ScriptTimelineRecord.EventType.TimerFired, startTime, endTime, stackTrace, sourceCodeLocation, parentRecordPayload.data.timerId, profileData);
                break;
            case InspectorBackend.Enum.Timeline.EventType.EventDispatch:
                record = new WI.ScriptTimelineRecord(WI.ScriptTimelineRecord.EventType.EventDispatched, startTime, endTime, stackTrace, sourceCodeLocation, parentRecordPayload.data.type, profileData, parentRecordPayload.data);
                break;
            case InspectorBackend.Enum.Timeline.EventType.ObserverCallback:
                record = new WI.ScriptTimelineRecord(WI.ScriptTimelineRecord.EventType.ObserverCallback, startTime, endTime, stackTrace, sourceCodeLocation, parentRecordPayload.data.type, profileData);
                break;
            case InspectorBackend.Enum.Timeline.EventType.FireAnimationFrame:
                record = new WI.ScriptTimelineRecord(WI.ScriptTimelineRecord.EventType.AnimationFrameFired, startTime, endTime, stackTrace, sourceCodeLocation, parentRecordPayload.data.id, profileData);
                break;
            case InspectorBackend.Enum.Timeline.EventType.FunctionCall:
                record = new WI.ScriptTimelineRecord(WI.ScriptTimelineRecord.EventType.ScriptEvaluated, startTime, endTime, stackTrace, sourceCodeLocation, parentRecordPayload.data.id, profileData);
                break;
            case InspectorBackend.Enum.Timeline.EventType.RenderingFrame:
                record = new WI.ScriptTimelineRecord(WI.ScriptTimelineRecord.EventType.ScriptEvaluated, startTime, endTime, stackTrace, sourceCodeLocation, parentRecordPayload.data.id, profileData);
                break;

            default:
                console.assert(false, "Missed FunctionCall embedded inside of: " + parentRecordPayload.type);
                break;
            }

            if (record) {
                this._webTimelineScriptRecordsExpectingScriptProfilerEvents.push(record);
                return record;
            }
            break;

        case InspectorBackend.Enum.Timeline.EventType.ProbeSample: {
            let probe = WI.debuggerManager.probeForIdentifier(recordPayload.data.probeId);
            if (probe.breakpoint instanceof WI.JavaScriptBreakpoint)
                sourceCodeLocation = probe.breakpoint.sourceCodeLocation;

            // Pass the startTime as the endTime since this record type has no duration.
            return new WI.ScriptTimelineRecord(WI.ScriptTimelineRecord.EventType.ProbeSampleRecorded, startTime, startTime, stackTrace, sourceCodeLocation, recordPayload.data.probeId);
        }

        case InspectorBackend.Enum.Timeline.EventType.TimerInstall:
            console.assert(isNaN(endTime));

            // Pass the startTime as the endTime since this record type has no duration.
            var timerDetails = {timerId: recordPayload.data.timerId, timeout: recordPayload.data.timeout, repeating: !recordPayload.data.singleShot};
            return new WI.ScriptTimelineRecord(WI.ScriptTimelineRecord.EventType.TimerInstalled, startTime, startTime, stackTrace, sourceCodeLocation, timerDetails);

        case InspectorBackend.Enum.Timeline.EventType.TimerRemove:
            console.assert(isNaN(endTime));

            // Pass the startTime as the endTime since this record type has no duration.
            return new WI.ScriptTimelineRecord(WI.ScriptTimelineRecord.EventType.TimerRemoved, startTime, startTime, stackTrace, sourceCodeLocation, recordPayload.data.timerId);

        case InspectorBackend.Enum.Timeline.EventType.RequestAnimationFrame:
            console.assert(isNaN(endTime));

            // Pass the startTime as the endTime since this record type has no duration.
            return new WI.ScriptTimelineRecord(WI.ScriptTimelineRecord.EventType.AnimationFrameRequested, startTime, startTime, stackTrace, sourceCodeLocation, recordPayload.data.id);

        case InspectorBackend.Enum.Timeline.EventType.CancelAnimationFrame:
            console.assert(isNaN(endTime));

            // Pass the startTime as the endTime since this record type has no duration.
            return new WI.ScriptTimelineRecord(WI.ScriptTimelineRecord.EventType.AnimationFrameCanceled, startTime, startTime, stackTrace, sourceCodeLocation, recordPayload.data.id);

        case InspectorBackend.Enum.Timeline.EventType.Screenshot:
            console.assert(isNaN(endTime));

            return new WI.ScreenshotsTimelineRecord(startTime, recordPayload.data.imageData);

        default:
            console.error("Missing handling of Timeline Event Type: " + recordPayload.type);
        }

        return null;
    }

    _processEvent(recordPayload, parentRecordPayload)
    {
        console.assert(this.isCapturing());

        switch (recordPayload.type) {
        case InspectorBackend.Enum.Timeline.EventType.TimeStamp:
            var timestamp = this._activeRecording.computeElapsedTime(recordPayload.startTime);
            var eventMarker = new WI.TimelineMarker(timestamp, WI.TimelineMarker.Type.TimeStamp, recordPayload.data.message);
            this._activeRecording.addEventMarker(eventMarker);
            break;

        case InspectorBackend.Enum.Timeline.EventType.Time:
        case InspectorBackend.Enum.Timeline.EventType.TimeEnd:
            // FIXME: <https://webkit.org/b/150690> Web Inspector: Show console.time/timeEnd ranges in Timeline
            // FIXME: Make use of "message" payload properties.
            break;

        default:
            return this._processRecord(recordPayload, parentRecordPayload);
        }

        return null;
    }

    _loadNewRecording()
    {
        if (this._activeRecording && this._activeRecording.isEmpty())
            return;

        let instruments = this.enabledTimelineTypes.map((type) => WI.Instrument.createForTimelineType(type));
        let identifier = this._nextRecordingIdentifier++;
        let newRecording = new WI.TimelineRecording(identifier, WI.UIString("Timeline Recording %d").format(identifier), instruments);

        this._recordings.push(newRecording);
        this.dispatchEventToListeners(WI.TimelineManager.Event.RecordingCreated, {recording: newRecording});

        if (this._capturingState === TimelineManager.CapturingState.Starting || this._capturingState === TimelineManager.CapturingState.Active)
            this.stopCapturing();

        var oldRecording = this._activeRecording;
        if (oldRecording)
            oldRecording.unloaded();

        this._activeRecording = newRecording;

        this.dispatchEventToListeners(WI.TimelineManager.Event.RecordingLoaded, {oldRecording});
    }

    _stackTraceFromPayload(payload)
    {
        let target = WI.assumingMainTarget();

        // COMPATIBILITY (macOS 13.0, iOS 16.0): `stackTrace` was an array of `Console.CallFrame`.
        if (Array.isArray(payload))
            payload = {callFrames: payload};

        return WI.StackTrace.fromPayload(target, payload);
    }

    _addRecord(record)
    {
        this._activeRecording.addRecord(record);

        // Only worry about dead time after the load event.
        if (WI.networkManager.mainFrame && isNaN(WI.networkManager.mainFrame.loadEventTimestamp))
            this._resetAutoRecordingDeadTimeTimeout();
    }

    _attemptAutoCapturingForFrame(frame)
    {
        if (!this._autoCaptureOnPageLoad)
            return false;

        if (!frame.isMainFrame())
            return false;

        if (!InspectorBackend.hasDomain("Timeline"))
            return false;

        if (!this._shouldSetAutoCapturingMainResource)
            return false;

        console.assert(this.isCapturing(), "We saw autoCaptureStarted so we should already be capturing");

        let mainResource = frame.provisionalMainResource || frame.mainResource;
        if (mainResource === this._mainResourceForAutoCapturing)
            return false;

        let oldMainResource = frame.mainResource || null;
        this._isCapturingPageReload = oldMainResource !== null && oldMainResource.url === mainResource.url;

        this._mainResourceForAutoCapturing = mainResource;

        this._addRecord(new WI.ResourceTimelineRecord(mainResource));

        this._resetAutoRecordingMaxTimeTimeout();

        this._shouldSetAutoCapturingMainResource = false;

        return true;
    }

    _legacyAttemptStartAutoCapturingForFrame(frame)
    {
        if (this.isCapturing() && !this._mainResourceForAutoCapturing)
            return false;

        let mainResource = frame.provisionalMainResource || frame.mainResource;
        if (mainResource === this._mainResourceForAutoCapturing)
            return false;

        let oldMainResource = frame.mainResource || null;
        this._isCapturingPageReload = oldMainResource !== null && oldMainResource.url === mainResource.url;

        if (this._capturingState === TimelineManager.CapturingState.Starting || this._capturingState === TimelineManager.CapturingState.Active)
            this.stopCapturing();

        this._mainResourceForAutoCapturing = mainResource;

        this._loadNewRecording();

        this.startCapturing();

        this._addRecord(new WI.ResourceTimelineRecord(mainResource));

        this._resetAutoRecordingMaxTimeTimeout();

        return true;
    }

    _stopAutoRecordingSoon()
    {
        if (!WI.settings.timelinesAutoStop.value)
            return;

        // Only auto stop when auto capturing.
        if (!this.isCapturing() || !this._mainResourceForAutoCapturing)
            return;

        if (this._stopCapturingTimeout)
            clearTimeout(this._stopCapturingTimeout);
        this._stopCapturingTimeout = setTimeout(this._boundStopCapturing, WI.TimelineManager.MaximumAutoRecordDurationAfterLoadEvent);
    }

    _resetAutoRecordingMaxTimeTimeout()
    {
        if (!WI.settings.timelinesAutoStop.value)
            return;

        if (this._stopCapturingTimeout)
            clearTimeout(this._stopCapturingTimeout);
        this._stopCapturingTimeout = setTimeout(this._boundStopCapturing, WI.TimelineManager.MaximumAutoRecordDuration);
    }

    _resetAutoRecordingDeadTimeTimeout()
    {
        if (!WI.settings.timelinesAutoStop.value)
            return;

        // Only monitor dead time when auto capturing.
        if (!this.isCapturing() || !this._mainResourceForAutoCapturing)
            return;

        // Avoid unnecessary churning of timeout identifier by not tickling until 10ms have passed.
        let now = Date.now();
        if (now <= this._lastDeadTimeTickle)
            return;
        this._lastDeadTimeTickle = now + 10;

        if (this._deadTimeTimeout)
            clearTimeout(this._deadTimeTimeout);
        this._deadTimeTimeout = setTimeout(this._boundStopCapturing, WI.TimelineManager.DeadTimeRequiredToStopAutoRecordingEarly);
    }

    _provisionalLoadStarted(event)
    {
        if (!this._enabled)
            return;

        this._attemptAutoCapturingForFrame(event.target);
    }

    _mainResourceDidChange(event)
    {
        if (!this._enabled)
            return;

        // Ignore resource events when there isn't a main frame yet. Those events are triggered by
        // loading the cached resources when the inspector opens, and they do not have timing information.
        if (!WI.networkManager.mainFrame)
            return;

        let frame = event.target;

        // When performing a page transition start a recording once the main resource changes.
        // We start a legacy capture because the backend wasn't available to automatically
        // initiate the capture, so the frontend must start the capture.
        if (this._transitioningPageTarget) {
            this._transitioningPageTarget = false;
            if (this._autoCaptureOnPageLoad)
                this._legacyAttemptStartAutoCapturingForFrame(frame);
            return;
        }

        if (this._attemptAutoCapturingForFrame(frame))
            return;

        if (!this.isCapturing())
            return;

        let mainResource = frame.mainResource;
        if (mainResource === this._mainResourceForAutoCapturing)
            return;

        this._addRecord(new WI.ResourceTimelineRecord(mainResource));
    }

    _handleMessageAdded(event)
    {
        if (!this._enabled)
            return;

        let {message} = event.data;

        if (WI.ScreenshotsInstrument.supported() && message.source === WI.ConsoleMessage.MessageSource.ConsoleAPI && message.type === WI.ConsoleMessage.MessageType.Image && message.level === WI.ConsoleMessage.MessageLevel.Log && message.messageText)
            this._addRecord(new WI.ScreenshotsTimelineRecord(message.timestamp, message.messageText));
    }

    _resourceWasAdded(event)
    {
        if (!this._enabled)
            return;

        // Ignore resource events when there isn't a main frame yet. Those events are triggered by
        // loading the cached resources when the inspector opens, and they do not have timing information.
        if (!WI.networkManager.mainFrame)
            return;

        this._addRecord(new WI.ResourceTimelineRecord(event.data.resource));
    }

    _garbageCollected(event)
    {
        if (!this._enabled)
            return;

        let {collection} = event.data;
        this._addRecord(new WI.ScriptTimelineRecord(WI.ScriptTimelineRecord.EventType.GarbageCollected, collection.startTime, collection.endTime, null, null, collection));
    }

    _memoryPressure(event)
    {
        if (!this._enabled)
            return;

        this._activeRecording.addMemoryPressureEvent(event.data.memoryPressureEvent);
    }

    _handleTimelinesAutoStopSettingChanged(event)
    {
        if (WI.settings.timelinesAutoStop.value) {
            if (this._mainResourceForAutoCapturing && !isNaN(this._mainResourceForAutoCapturing.parentFrame.loadEventTimestamp))
                this._stopAutoRecordingSoon();
            else
                this._resetAutoRecordingMaxTimeTimeout();
            this._resetAutoRecordingDeadTimeTimeout();
        } else
            this.relaxAutoStop();
    }

    _scriptProfilerTypeToScriptTimelineRecordType(type)
    {
        switch (type) {
        case InspectorBackend.Enum.ScriptProfiler.EventType.API:
            return WI.ScriptTimelineRecord.EventType.APIScriptEvaluated;
        case InspectorBackend.Enum.ScriptProfiler.EventType.Microtask:
            return WI.ScriptTimelineRecord.EventType.MicrotaskDispatched;
        case InspectorBackend.Enum.ScriptProfiler.EventType.Other:
            return WI.ScriptTimelineRecord.EventType.ScriptEvaluated;
        }
    }

    _mergeScriptProfileRecords()
    {
        let nextRecord = function(list) { return list.shift() || null; };
        let nextWebTimelineRecord = nextRecord.bind(null, this._webTimelineScriptRecordsExpectingScriptProfilerEvents);
        let nextScriptProfilerRecord = nextRecord.bind(null, this._scriptProfilerRecords);
        let recordEnclosesRecord = function(record1, record2) {
            return record1.startTime <= record2.startTime && record1.endTime >= record2.endTime;
        };

        let webRecord = nextWebTimelineRecord();
        let profilerRecord = nextScriptProfilerRecord();

        while (webRecord && profilerRecord) {
            // Skip web records with parent web records. For example an EvaluateScript with an EvaluateScript parent.
            if (webRecord.parent instanceof WI.ScriptTimelineRecord) {
                console.assert(recordEnclosesRecord(webRecord.parent, webRecord), "Timeline Record incorrectly wrapping another Timeline Record");
                webRecord = nextWebTimelineRecord();
                continue;
            }

            // Normal case of a Web record wrapping a Script record.
            if (recordEnclosesRecord(webRecord, profilerRecord)) {
                webRecord.profilePayload = profilerRecord.profilePayload;
                profilerRecord = nextScriptProfilerRecord();

                // If there are more script profile records in the same time interval, add them
                // as individual script evaluated records with profiles. This can happen with
                // web microtask checkpoints that are technically inside of other web records.
                // FIXME: <https://webkit.org/b/152903> Web Inspector: Timeline Cleanup: Better Timeline Record for Microtask Checkpoints
                while (profilerRecord && recordEnclosesRecord(webRecord, profilerRecord)) {
                    this._addRecord(profilerRecord);
                    profilerRecord = nextScriptProfilerRecord();
                }

                webRecord = nextWebTimelineRecord();
                continue;
            }

            // Profiler Record is entirely after the Web Record. This would mean an empty web record.
            if (profilerRecord.startTime > webRecord.endTime) {
                console.warn("Unexpected case of a Timeline record not containing a ScriptProfiler event and profile data");
                webRecord = nextWebTimelineRecord();
                continue;
            }

            // Non-wrapped profiler record.
            console.warn("Unexpected case of a ScriptProfiler event not being contained by a Timeline record");
            this._addRecord(profilerRecord);
            profilerRecord = nextScriptProfilerRecord();
        }

        // Skipping the remaining ScriptProfiler events to match the current UI for handling Timeline records.
        // However, the remaining ScriptProfiler records are valid and could be shown.
        // FIXME: <https://webkit.org/b/152904> Web Inspector: Timeline UI should keep up with processing all incoming records
    }

    _updateAutoCaptureInstruments(targets)
    {
        console.assert(this._enabled);

        let enabledTimelineTypes = this.enabledTimelineTypes;

        for (let target of targets) {
            if (!target.hasCommand("Timeline.setInstruments"))
                continue;

            let instrumentSet = new Set;
            for (let timelineType of enabledTimelineTypes) {
                switch (timelineType) {
                case WI.TimelineRecord.Type.Script:
                    instrumentSet.add(InspectorBackend.Enum.Timeline.Instrument.ScriptProfiler);
                    break;
                case WI.TimelineRecord.Type.HeapAllocations:
                    instrumentSet.add(InspectorBackend.Enum.Timeline.Instrument.Heap);
                    break;
                case WI.TimelineRecord.Type.Network:
                case WI.TimelineRecord.Type.RenderingFrame:
                case WI.TimelineRecord.Type.Layout:
                    instrumentSet.add(InspectorBackend.Enum.Timeline.Instrument.Timeline);
                    break;
                case WI.TimelineRecord.Type.CPU:
                    instrumentSet.add(InspectorBackend.Enum.Timeline.Instrument.CPU);
                    break;
                case WI.TimelineRecord.Type.Screenshots:
                    instrumentSet.add(InspectorBackend.Enum.Timeline.Instrument.Screenshot);
                    break;
                case WI.TimelineRecord.Type.Memory:
                    instrumentSet.add(InspectorBackend.Enum.Timeline.Instrument.Memory);
                    break;
                case WI.TimelineRecord.Type.Media:
                    // COMPATIBILITY (iOS 13): Animation domain did not exist yet.
                    if (InspectorBackend.hasDomain("Animation"))
                        instrumentSet.add(InspectorBackend.Enum.Timeline.Instrument.Animation);
                    break;
                }
            }

            target.TimelineAgent.setInstruments(Array.from(instrumentSet));
        }
    }

    _handleDOMNodeDidFireEvent(event)
    {
        if (!this._enabled)
            return;

        let domNode = event.target;
        if (!domNode.isMediaElement())
            return;

        let {domEvent} = event.data;

        let mediaTimeline = this._activeRecording.timelineForRecordType(WI.TimelineRecord.Type.Media);
        console.assert(mediaTimeline);

        let record = mediaTimeline.recordForMediaElementEvents(domNode);
        if (!record) {
            record = new WI.MediaTimelineRecord(WI.MediaTimelineRecord.EventType.MediaElement, domNode);
            this._addRecord(record);
        }

        record.addDOMEvent(domEvent.timestamp, domEvent);
    }

    _handleDOMNodePowerEfficientPlaybackStateChanged(event)
    {
        if (!this._enabled)
            return;

        let domNode = event.target;
        console.assert(domNode.isMediaElement());

        let {timestamp, isPowerEfficient} = event.data;

        let mediaTimeline = this._activeRecording.timelineForRecordType(WI.TimelineRecord.Type.Media);
        console.assert(mediaTimeline);

        let record = mediaTimeline.recordForMediaElementEvents(domNode);
        if (!record) {
            record = new WI.MediaTimelineRecord(WI.MediaTimelineRecord.EventType.MediaElement, domNode);
            this._addRecord(record);
        }

        record.powerEfficientPlaybackStateChanged(timestamp, isPowerEfficient);
    }
};

WI.TimelineManager.CapturingState = {
    Inactive: "inactive",
    Starting: "starting",
    Active: "active",
    Stopping: "stopping",
};

WI.TimelineManager.Event = {
    CapturingStateChanged: "timeline-manager-capturing-started",
    RecordingCreated: "timeline-manager-recording-created",
    RecordingLoaded: "timeline-manager-recording-loaded",
    RecordingImported: "timeline-manager-recording-imported",
};

WI.TimelineManager.MaximumAutoRecordDuration = 90_000; // 90 seconds
WI.TimelineManager.MaximumAutoRecordDurationAfterLoadEvent = 10_000; // 10 seconds
WI.TimelineManager.DeadTimeRequiredToStopAutoRecordingEarly = 2_000; // 2 seconds
