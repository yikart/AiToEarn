/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
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

WI.Instrument = class Instrument
{
    // Static

    static createForTimelineType(type)
    {
        switch (type) {
        case WI.TimelineRecord.Type.Network:
            return new WI.NetworkInstrument;
        case WI.TimelineRecord.Type.Layout:
            return new WI.LayoutInstrument;
        case WI.TimelineRecord.Type.Script:
            return new WI.ScriptInstrument;
        case WI.TimelineRecord.Type.RenderingFrame:
            return new WI.FPSInstrument;
        case WI.TimelineRecord.Type.CPU:
            return new WI.CPUInstrument;
        case WI.TimelineRecord.Type.Memory:
            return new WI.MemoryInstrument;
        case WI.TimelineRecord.Type.HeapAllocations:
            return new WI.HeapAllocationsInstrument;
        case WI.TimelineRecord.Type.Media:
            return new WI.MediaInstrument;
        case WI.TimelineRecord.Type.Screenshots:
            return new WI.ScreenshotsInstrument;
        default:
            console.error("Unknown TimelineRecord.Type: " + type);
            return null;
        }
    }

    static startLegacyTimelineAgent(initiatedByBackend)
    {
        console.assert(WI.timelineManager._enabled);

        if (WI.Instrument._legacyTimelineAgentStarted)
            return;

        WI.Instrument._legacyTimelineAgentStarted = true;

        if (initiatedByBackend)
            return;

        let target = WI.assumingMainTarget();
        target.TimelineAgent.start();
    }

    static stopLegacyTimelineAgent(initiatedByBackend)
    {
        console.assert(WI.timelineManager._enabled);

        if (!WI.Instrument._legacyTimelineAgentStarted)
            return;

        WI.Instrument._legacyTimelineAgentStarted = false;

        if (initiatedByBackend)
            return;

        let target = WI.assumingMainTarget();
        target.TimelineAgent.stop();
    }

    // Protected

    get timelineRecordType()
    {
        return null; // Implemented by subclasses.
    }

    startInstrumentation(initiatedByBackend)
    {
        WI.Instrument.startLegacyTimelineAgent(initiatedByBackend);
    }

    stopInstrumentation(initiatedByBackend)
    {
        WI.Instrument.stopLegacyTimelineAgent(initiatedByBackend);
    }
};

WI.Instrument._legacyTimelineAgentStarted = false;
