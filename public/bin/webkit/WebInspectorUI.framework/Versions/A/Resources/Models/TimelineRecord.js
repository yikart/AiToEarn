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

WI.TimelineRecord = class TimelineRecord extends WI.Object
{
    constructor(type, startTime, endTime, stackTrace, sourceCodeLocation)
    {
        super();

        console.assert(type);

        if (type in WI.TimelineRecord.Type)
            type = WI.TimelineRecord.Type[type];

        this._type = type;
        this._startTime = startTime || NaN;
        this._endTime = endTime || NaN;
        this._stackTrace = stackTrace || null;
        this._sourceCodeLocation = sourceCodeLocation || null;
        this._children = [];
    }

    // Import / Export

    static async fromJSON(json)
    {
        switch (json.type) {
        case WI.TimelineRecord.Type.Network:
            return WI.ResourceTimelineRecord.fromJSON(json);
        case WI.TimelineRecord.Type.Layout:
            return WI.LayoutTimelineRecord.fromJSON(json);
        case WI.TimelineRecord.Type.Script:
            return WI.ScriptTimelineRecord.fromJSON(json);
        case WI.TimelineRecord.Type.RenderingFrame:
            return WI.RenderingFrameTimelineRecord.fromJSON(json);
        case WI.TimelineRecord.Type.CPU:
            return WI.CPUTimelineRecord.fromJSON(json);
        case WI.TimelineRecord.Type.Memory:
            return WI.MemoryTimelineRecord.fromJSON(json);
        case WI.TimelineRecord.Type.HeapAllocations:
            return WI.HeapAllocationsTimelineRecord.fromJSON(json);
        case WI.TimelineRecord.Type.Media:
            return WI.MediaTimelineRecord.fromJSON(json);
        case WI.TimelineRecord.Type.Screenshots:
            return WI.ScreenshotsTimelineRecord.fromJSON(json);
        default:
            console.error("Unknown TimelineRecord.Type: " + json.type, json);
            return null;
        }
    }

    toJSON()
    {
        throw WI.NotImplementedError.subclassMustOverride();
    }

    // Public

    get type()
    {
        return this._type;
    }

    get startTime()
    {
        // Implemented by subclasses if needed.
        return this._startTime;
    }

    get activeStartTime()
    {
        // Implemented by subclasses if needed.
        return this.startTime;
    }

    get unadjustedStartTime()
    {
        // Overridden by subclasses if needed.
        return this.startTime;
    }

    get endTime()
    {
        // Implemented by subclasses if needed.
        return this._endTime;
    }

    get unadjustedEndTime()
    {
        // Overridden by subclasses if needed.
        return this.endTime;
    }

    get duration()
    {
        // Use the getters instead of the properties so this works for subclasses that override the getters.
        return this.endTime - this.startTime;
    }

    get inactiveDuration()
    {
        // Use the getters instead of the properties so this works for subclasses that override the getters.
        return this.activeStartTime - this.startTime;
    }

    get activeDuration()
    {
        // Use the getters instead of the properties so this works for subclasses that override the getters.
        return this.endTime - this.activeStartTime;
    }

    get updatesDynamically()
    {
        // Implemented by subclasses if needed.
        return false;
    }

    get usesActiveStartTime()
    {
        // Implemented by subclasses if needed.
        return false;
    }

    get stackTrace()
    {
        return this._stackTrace;
    }

    get initiatorCallFrame()
    {
        if (!this._stackTrace)
            return null;

        // Return the first non-native code call frame as the initiator.
        for (let frame of this._stackTrace.callFrames) {
            if (!frame.nativeCode)
                return frame;
        }

        return null;
    }

    get sourceCodeLocation()
    {
        return this._sourceCodeLocation;
    }

    get parent()
    {
        return this._parent;
    }

    set parent(x)
    {
        if (this._parent === x)
            return;

        this._parent = x;
    }

    get children()
    {
        return this._children;
    }

    saveIdentityToCookie(cookie)
    {
        cookie[WI.TimelineRecord.SourceCodeURLCookieKey] = this._sourceCodeLocation ? this._sourceCodeLocation.sourceCode.url ? this._sourceCodeLocation.sourceCode.url.hash : null : null;
        cookie[WI.TimelineRecord.SourceCodeLocationLineCookieKey] = this._sourceCodeLocation ? this._sourceCodeLocation.lineNumber : null;
        cookie[WI.TimelineRecord.SourceCodeLocationColumnCookieKey] = this._sourceCodeLocation ? this._sourceCodeLocation.columnNumber : null;
        cookie[WI.TimelineRecord.TypeCookieKey] = this._type || null;
    }
};

WI.TimelineRecord.Event = {
    Updated: "timeline-record-updated"
};

WI.TimelineRecord.Type = {
    Network: "timeline-record-type-network",
    Layout: "timeline-record-type-layout",
    Script: "timeline-record-type-script",
    RenderingFrame: "timeline-record-type-rendering-frame",
    CPU: "timeline-record-type-cpu",
    Memory: "timeline-record-type-memory",
    HeapAllocations: "timeline-record-type-heap-allocations",
    Media: "timeline-record-type-media",
    Screenshots: "timeline-record-type-screenshots",
};

WI.TimelineRecord.TypeIdentifier = "timeline-record";
WI.TimelineRecord.SourceCodeURLCookieKey = "timeline-record-source-code-url";
WI.TimelineRecord.SourceCodeLocationLineCookieKey = "timeline-record-source-code-location-line";
WI.TimelineRecord.SourceCodeLocationColumnCookieKey = "timeline-record-source-code-location-column";
WI.TimelineRecord.TypeCookieKey = "timeline-record-type";
