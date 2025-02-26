/*
 * Copyright (C) 2018 Apple Inc. All rights reserved.
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

WI.MediaInstrument = class MediaInstrument extends WI.Instrument
{
    constructor()
    {
        super();

        console.assert(WI.MediaInstrument.supported());
    }

    // Static

    static supported()
    {
        // COMPATIBILITY (iOS 12): DOM.didFireEvent did not exist yet.
        return InspectorBackend.hasEvent("DOM.didFireEvent");
    }

    // Protected

    get timelineRecordType()
    {
        return WI.TimelineRecord.Type.Media;
    }

    startInstrumentation(initiatedByBackend)
    {
        // Audio/Video/Picture instrumentation is always happening.

        if (!initiatedByBackend) {
            // COMPATIBILITY (iOS 13): Animation domain did not exist yet.
            if (InspectorBackend.hasDomain("Animation")) {
                let target = WI.assumingMainTarget();
                target.AnimationAgent.startTracking();
            }
        }
    }

    stopInstrumentation(initiatedByBackend)
    {
        // Audio/Video/Picture instrumentation is always happening.

        if (!initiatedByBackend) {
            // COMPATIBILITY (iOS 13): Animation domain did not exist yet.
            if (InspectorBackend.hasDomain("Animation")) {
                let target = WI.assumingMainTarget();
                target.AnimationAgent.stopTracking();
            }
        }
    }
};
