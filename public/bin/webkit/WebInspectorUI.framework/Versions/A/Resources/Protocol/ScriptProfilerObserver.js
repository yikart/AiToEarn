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

WI.ScriptProfilerObserver = class ScriptProfilerObserver extends InspectorBackend.Dispatcher
{
    // Events defined by the "ScriptProfiler" domain.

    trackingStart(timestamp)
    {
        WI.timelineManager.scriptProfilerTrackingStarted(timestamp);
    }

    trackingUpdate(event)
    {
        WI.timelineManager.scriptProfilerTrackingUpdated(event);
    }

    trackingComplete(timestamp, samples)
    {
        WI.timelineManager.scriptProfilerTrackingCompleted(timestamp, samples);
    }

    programmaticCaptureStarted()
    {
        // COMPATIBILITY (iOS 12.2): ScriptProfiler.programmaticCaptureStarted was removed after iOS 12.2.
    }

    programmaticCaptureStopped()
    {
        // COMPATIBILITY (iOS 12.2): ScriptProfiler.programmaticCaptureStopped was removed after iOS 12.2.
    }
};
