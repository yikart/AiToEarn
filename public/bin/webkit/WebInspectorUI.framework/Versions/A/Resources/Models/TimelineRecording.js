/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
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

WI.TimelineRecording = class TimelineRecording extends WI.Object
{
    constructor(identifier, displayName, instruments)
    {
        super();

        this._identifier = identifier;
        this._timelines = new Map;
        this._displayName = displayName;
        this._capturing = false;
        this._readonly = false;
        this._imported = false;
        this._instruments = instruments || [];

        this._startTime = NaN;
        this._endTime = NaN;

        this._discontinuityStartTime = NaN;
        this._discontinuities = null;
        this._firstRecordOfTypeAfterDiscontinuity = new Set;

        this._exportDataMarkers = null;
        this._exportDataRecords = null;
        this._exportDataMemoryPressureEvents = null;
        this._exportDataSampleStackTraces = null;
        this._exportDataSampleDurations = null;

        this._topDownCallingContextTree = new WI.CallingContextTree(WI.CallingContextTree.Type.TopDown);
        this._bottomUpCallingContextTree = new WI.CallingContextTree(WI.CallingContextTree.Type.BottomUp);
        this._topFunctionsTopDownCallingContextTree = new WI.CallingContextTree(WI.CallingContextTree.Type.TopFunctionsTopDown);
        this._topFunctionsBottomUpCallingContextTree = new WI.CallingContextTree(WI.CallingContextTree.Type.TopFunctionsBottomUp);

        for (let type of WI.TimelineManager.availableTimelineTypes()) {
            let timeline = WI.Timeline.create(type);
            this._timelines.set(type, timeline);
            timeline.addEventListener(WI.Timeline.Event.TimesUpdated, this._timelineTimesUpdated, this);
        }

        this.reset(true);
    }

    // Static

    static sourceCodeTimelinesSupported()
    {
        // FIXME: Support Network Timeline in ServiceWorker.
        return WI.sharedApp.isWebDebuggable();
    }

    // Import / Export

    static async import(identifier, json, displayName)
    {
        let {startTime, endTime, discontinuities, instrumentTypes, records, markers, memoryPressureEvents, sampleStackTraces, sampleDurations} = json;
        let importedDisplayName = WI.UIString("Imported - %s").format(displayName);
        let instruments = instrumentTypes.map((type) => WI.Instrument.createForTimelineType(type));
        let recording = new WI.TimelineRecording(identifier, importedDisplayName, instruments);

        recording._readonly = true;
        recording._imported = true;
        recording._startTime = startTime;
        recording._endTime = endTime;
        recording._discontinuities = discontinuities;

        recording.initializeCallingContextTrees(sampleStackTraces, sampleDurations);

        for (let recordJSON of records) {
            let record = await WI.TimelineRecord.fromJSON(recordJSON);
            if (record) {
                recording.addRecord(record);

                if (record instanceof WI.ScriptTimelineRecord)
                    record.profilePayload = recording._topDownCallingContextTree.toCPUProfilePayload(record.startTime, record.endTime);
            }
        }

        for (let memoryPressureJSON of memoryPressureEvents) {
            let memoryPressureEvent = WI.MemoryPressureEvent.fromJSON(memoryPressureJSON);
            if (memoryPressureEvent)
                recording.addMemoryPressureEvent(memoryPressureEvent);
        }

        // Add markers once we've transitioned the active recording.
        setTimeout(() => {
            recording.__importing = true;

            for (let markerJSON of markers) {
                let marker = WI.TimelineMarker.fromJSON(markerJSON);
                if (marker)
                    recording.addEventMarker(marker);
            }

            recording.__importing = false;
        });

        return recording;
    }

    exportData()
    {
        console.assert(this.canExport(), "Attempted to export a recording which should not be exportable.");

        // FIXME: Overview data (sourceCodeTimelinesMap).
        // FIXME: Record hierarchy (parent / child relationship) is lost.

        return {
            displayName: this._displayName,
            startTime: this._startTime,
            endTime: this._endTime,
            discontinuities: this._discontinuities,
            instrumentTypes: this._instruments.map((instrument) => instrument.timelineRecordType),
            records: this._exportDataRecords,
            markers: this._exportDataMarkers,
            memoryPressureEvents: this._exportDataMemoryPressureEvents,
            sampleStackTraces: this._exportDataSampleStackTraces,
            sampleDurations: this._exportDataSampleDurations,
        };
    }

    // Public

    get displayName() { return this._displayName; }
    get identifier() { return this._identifier; }
    get timelines() { return this._timelines; }
    get instruments() { return this._instruments; }
    get capturing() { return this._capturing; }
    get readonly() { return this._readonly; }
    get imported() { return this._imported; }
    get startTime() { return this._startTime; }
    get endTime() { return this._endTime; }

    get topDownCallingContextTree() { return this._topDownCallingContextTree; }
    get bottomUpCallingContextTree() { return this._bottomUpCallingContextTree; }
    get topFunctionsTopDownCallingContextTree() { return this._topFunctionsTopDownCallingContextTree; }
    get topFunctionsBottomUpCallingContextTree() { return this._topFunctionsBottomUpCallingContextTree; }

    start(initiatedByBackend)
    {
        console.assert(!this._capturing, "Attempted to start an already started session.");
        console.assert(!this._readonly, "Attempted to start a readonly session.");

        this._capturing = true;

        for (let instrument of this._instruments)
            instrument.startInstrumentation(initiatedByBackend);

        if (!isNaN(this._discontinuityStartTime)) {
            for (let instrument of this._instruments)
                this._firstRecordOfTypeAfterDiscontinuity.add(instrument.timelineRecordType);
        }
    }

    stop(initiatedByBackend)
    {
        console.assert(this._capturing, "Attempted to stop an already stopped session.");
        console.assert(!this._readonly, "Attempted to stop a readonly session.");

        this._capturing = false;

        for (let instrument of this._instruments)
            instrument.stopInstrumentation(initiatedByBackend);
    }

    capturingStarted(startTime)
    {
        // A discontinuity occurs when the recording is stopped and resumed at
        // a future time. Capturing started signals the end of the current
        // discontinuity, if one exists.
        if (!isNaN(this._discontinuityStartTime)) {
            this._discontinuities.push({
                startTime: this._discontinuityStartTime,
                endTime: startTime,
            });
            this._discontinuityStartTime = NaN;
        }
    }

    capturingStopped(endTime)
    {
        this._discontinuityStartTime = endTime;
    }

    saveIdentityToCookie()
    {
        // Do nothing. Timeline recordings are not persisted when the inspector is
        // re-opened, so do not attempt to restore by identifier or display name.
    }

    isEmpty()
    {
        for (var timeline of this._timelines.values()) {
            if (timeline.records.length)
                return false;
        }

        return true;
    }

    unloaded(importing)
    {
        console.assert(importing || !this.isEmpty(), "Shouldn't unload an empty recording; it should be reused instead.");

        this._readonly = true;

        this.dispatchEventToListeners(WI.TimelineRecording.Event.Unloaded);
    }

    reset(suppressEvents)
    {
        console.assert(!this._readonly, "Can't reset a read-only recording.");

        this._sourceCodeTimelinesMap = new Map;

        this._startTime = NaN;
        this._endTime = NaN;

        this._discontinuityStartTime = NaN;
        this._discontinuities = [];
        this._firstRecordOfTypeAfterDiscontinuity.clear();

        this._exportDataMarkers = [];
        this._exportDataRecords = [];
        this._exportDataMemoryPressureEvents = [];
        this._exportDataSampleStackTraces = [];
        this._exportDataSampleDurations = [];

        this._topDownCallingContextTree.reset();
        this._bottomUpCallingContextTree.reset();
        this._topFunctionsTopDownCallingContextTree.reset();
        this._topFunctionsBottomUpCallingContextTree.reset();

        for (var timeline of this._timelines.values())
            timeline.reset(suppressEvents);

        WI.RenderingFrameTimelineRecord.resetFrameIndex();

        if (!suppressEvents) {
            this.dispatchEventToListeners(WI.TimelineRecording.Event.Reset);
            this.dispatchEventToListeners(WI.TimelineRecording.Event.TimesUpdated);
        }
    }

    get sourceCodeTimelines()
    {
        let timelines = [];
        for (let timelinesForSourceCode of this._sourceCodeTimelinesMap.values())
            timelines.pushAll(timelinesForSourceCode.values());
        return timelines;
    }

    timelineForInstrument(instrument)
    {
        return this._timelines.get(instrument.timelineRecordType);
    }

    instrumentForTimeline(timeline)
    {
        return this._instruments.find((instrument) => instrument.timelineRecordType === timeline.type);
    }

    timelineForRecordType(recordType)
    {
        return this._timelines.get(recordType);
    }

    addInstrument(instrument)
    {
        console.assert(instrument instanceof WI.Instrument, instrument);
        console.assert(!this._instruments.includes(instrument), this._instruments, instrument);

        this._instruments.push(instrument);

        this.dispatchEventToListeners(WI.TimelineRecording.Event.InstrumentAdded, {instrument});
    }

    removeInstrument(instrument)
    {
        console.assert(instrument instanceof WI.Instrument, instrument);
        console.assert(this._instruments.includes(instrument), this._instruments, instrument);

        this._instruments.remove(instrument);

        this.dispatchEventToListeners(WI.TimelineRecording.Event.InstrumentRemoved, {instrument});
    }

    addEventMarker(marker)
    {
        this._exportDataMarkers.push(marker);

        if (!this._capturing && !this.__importing)
            return;

        this.dispatchEventToListeners(WI.TimelineRecording.Event.MarkerAdded, {marker});
    }

    addRecord(record)
    {
        this._exportDataRecords.push(record);

        let timeline = this._timelines.get(record.type);
        console.assert(timeline, record, this._timelines);
        if (!timeline)
            return;

        let discontinuity = null;
        if (this._firstRecordOfTypeAfterDiscontinuity.take(record.type))
            discontinuity = this._discontinuities.lastValue;

        // Add the record to the global timeline by type.
        timeline.addRecord(record, {discontinuity});

        // Some records don't have source code timelines.
        if (record.type === WI.TimelineRecord.Type.Network
            || record.type === WI.TimelineRecord.Type.RenderingFrame
            || record.type === WI.TimelineRecord.Type.CPU
            || record.type === WI.TimelineRecord.Type.Memory
            || record.type === WI.TimelineRecord.Type.HeapAllocations
            || record.type === WI.TimelineRecord.Type.Screenshots)
            return;

        if (!WI.TimelineRecording.sourceCodeTimelinesSupported())
            return;

        // Add the record to the source code timelines.
        let sourceCode = null;
        if (record.sourceCodeLocation)
            sourceCode = record.sourceCodeLocation.sourceCode;
        else if (record.type === WI.TimelineRecord.Type.Media) {
            if (record.domNode && record.domNode.frame)
                sourceCode = record.domNode.frame.mainResource;
        }
        if (!sourceCode)
            sourceCode = WI.networkManager.mainFrame.provisionalMainResource || WI.networkManager.mainFrame.mainResource;

        var sourceCodeTimelines = this._sourceCodeTimelinesMap.get(sourceCode);
        if (!sourceCodeTimelines) {
            sourceCodeTimelines = new Map;
            this._sourceCodeTimelinesMap.set(sourceCode, sourceCodeTimelines);
        }

        var newTimeline = false;
        var key = this._keyForRecord(record);
        var sourceCodeTimeline = sourceCodeTimelines.get(key);
        if (!sourceCodeTimeline) {
            sourceCodeTimeline = new WI.SourceCodeTimeline(sourceCode, record.sourceCodeLocation, record.type, record.eventType);
            sourceCodeTimelines.set(key, sourceCodeTimeline);
            newTimeline = true;
        }

        sourceCodeTimeline.addRecord(record);

        if (newTimeline)
            this.dispatchEventToListeners(WI.TimelineRecording.Event.SourceCodeTimelineAdded, {sourceCodeTimeline});
    }

    addMemoryPressureEvent(memoryPressureEvent)
    {
        this._exportDataMemoryPressureEvents.push(memoryPressureEvent);

        let memoryTimeline = this._timelines.get(WI.TimelineRecord.Type.Memory);
        console.assert(memoryTimeline, this._timelines);
        if (!memoryTimeline)
            return;

        memoryTimeline.addMemoryPressureEvent(memoryPressureEvent);
    }

    discontinuitiesInTimeRange(startTime, endTime)
    {
        return this._discontinuities.filter((item) => item.startTime <= endTime && item.endTime >= startTime);
    }

    addScriptInstrumentForProgrammaticCapture()
    {
        for (let instrument of this._instruments) {
            if (instrument instanceof WI.ScriptInstrument)
                return;
        }

        this.addInstrument(new WI.ScriptInstrument);

        let instrumentTypes = this._instruments.map((instrument) => instrument.timelineRecordType);
        WI.timelineManager.enabledTimelineTypes = instrumentTypes;
    }

    computeElapsedTime(timestamp)
    {
        if (!timestamp || isNaN(timestamp))
            return NaN;
        return timestamp;
    }

    initializeTimeBoundsIfNecessary(timestamp)
    {
        if (isNaN(this._startTime)) {
            console.assert(isNaN(this._endTime));

            this._startTime = timestamp;
            this._endTime = timestamp;

            this.dispatchEventToListeners(WI.TimelineRecording.Event.TimesUpdated);
        }
    }

    initializeCallingContextTrees(stackTraces, sampleDurations)
    {
        this._exportDataSampleStackTraces.pushAll(stackTraces);
        this._exportDataSampleDurations.pushAll(sampleDurations);

        for (let i = 0; i < stackTraces.length; i++) {
            this._topDownCallingContextTree.updateTreeWithStackTrace(stackTraces[i], sampleDurations[i]);
            this._bottomUpCallingContextTree.updateTreeWithStackTrace(stackTraces[i], sampleDurations[i]);
            this._topFunctionsTopDownCallingContextTree.updateTreeWithStackTrace(stackTraces[i], sampleDurations[i]);
            this._topFunctionsBottomUpCallingContextTree.updateTreeWithStackTrace(stackTraces[i], sampleDurations[i]);
        }
    }

    get exportMode()
    {
        return WI.FileUtilities.SaveMode.SingleFile;
    }

    canExport()
    {
        if (!WI.FileUtilities.canSave(this.exportMode))
            return false;

        if (this._capturing)
            return false;

        if (isNaN(this._startTime))
            return false;

        return true;
    }

    // Testing

    get markersForTesting() { return this._exportDataMarkers; }

    // Private

    _keyForRecord(record)
    {
        var key = record.type;
        if (record instanceof WI.ScriptTimelineRecord || record instanceof WI.LayoutTimelineRecord)
            key += ":" + record.eventType;
        if (record instanceof WI.ScriptTimelineRecord && record.eventType === WI.ScriptTimelineRecord.EventType.EventDispatched)
            key += ":" + record.details;
        if (record instanceof WI.MediaTimelineRecord) {
            key += ":" + record.eventType;
            if (record.eventType === WI.MediaTimelineRecord.EventType.DOMEvent) {
                if (record.domEvent && record.domEvent.eventName)
                    key += ":" + record.domEvent.eventName;
            } else if (record.eventType === WI.MediaTimelineRecord.EventType.PowerEfficientPlaybackStateChanged)
                key += ":" + (record.isPowerEfficient ? "enabled" : "disabled");
        }
        if (record.sourceCodeLocation)
            key += ":" + record.sourceCodeLocation.lineNumber + ":" + record.sourceCodeLocation.columnNumber;
        return key;
    }

    _timelineTimesUpdated(event)
    {
        var timeline = event.target;
        var changed = false;

        if (isNaN(this._startTime) || timeline.startTime < this._startTime) {
            this._startTime = timeline.startTime;
            changed = true;
        }

        if (isNaN(this._endTime) || this._endTime < timeline.endTime) {
            this._endTime = timeline.endTime;
            changed = true;
        }

        if (changed)
            this.dispatchEventToListeners(WI.TimelineRecording.Event.TimesUpdated);
    }
};

WI.TimelineRecording.Event = {
    Reset: "timeline-recording-reset",
    Unloaded: "timeline-recording-unloaded",
    SourceCodeTimelineAdded: "timeline-recording-source-code-timeline-added",
    InstrumentAdded: "timeline-recording-instrument-added",
    InstrumentRemoved: "timeline-recording-instrument-removed",
    TimesUpdated: "timeline-recording-times-updated",
    MarkerAdded: "timeline-recording-marker-added",
};

WI.TimelineRecording.SerializationVersion = 1;
