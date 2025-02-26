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

WI.InspectedTargetTypesDiagnosticEventRecorder = class InspectedTargetTypesDiagnosticEventRecorder extends WI.DiagnosticEventRecorder
{
    constructor(controller)
    {
        super("InspectedTargetTypes", controller);

        this._initialDelayBeforeSamplingTimerIdentifier = undefined;
    }

    // Static

    static get initialDelayBeforeSamplingInterval()
    {
        return 5 * 1000; // In milliseconds.
    }

    // Protected

    setup()
    {
        // If it's been less than 5 seconds since the frontend loaded, wait a bit.
        if (performance.now() - WI.frontendCompletedLoadTimestamp < InspectedTargetTypesDiagnosticEventRecorder.initialDelayBeforeSamplingInterval)
            this._startInitialDelayBeforeSamplingTimer();
        else
            this._sampleInspectedTarget();

    }

    teardown()
    {
        this._stopInitialDelayBeforeSamplingTimer();
    }

    // Private

    _startInitialDelayBeforeSamplingTimer()
    {
        if (this._initialDelayBeforeSamplingTimerIdentifier) {
            clearTimeout(this._initialDelayBeforeSamplingTimerIdentifier);
            this._initialDelayBeforeSamplingTimerIdentifier = undefined;
        }

        // All intervals are in milliseconds.
        let maximumInitialDelay = InspectedTargetTypesDiagnosticEventRecorder.initialDelayBeforeSamplingInterval;
        let elapsedTime = performance.now() - WI.frontendCompletedLoadTimestamp;
        let remainingTime = maximumInitialDelay - elapsedTime;
        let initialDelay = Number.constrain(remainingTime, 0, maximumInitialDelay);
        this._initialDelayBeforeSamplingTimerIdentifier = setTimeout(this._sampleInspectedTarget.bind(this), initialDelay);
    }

    _stopInitialDelayBeforeSamplingTimer()
    {
        if (this._initialDelayBeforeSamplingTimerIdentifier) {
            clearTimeout(this._initialDelayBeforeSamplingTimerIdentifier);
            this._initialDelayBeforeSamplingTimerIdentifier = undefined;
        }
    }

    _sampleInspectedTarget()
    {
        this._stopInitialDelayBeforeSamplingTimer();

        this.logDiagnosticEvent(this.name, {
            debuggableType: this._determineDebuggableType(),
            targetPlatformName: this._determineTargetPlatformName(),
            targetBuildVersion: this._determineTargetBuildVersion(),
            targetProductVersion: this._determineTargetProductVersion(),
            targetIsSimulator: this._determineTargetIsSimulator(),
        });
    }

    _determineDebuggableType()
    {
        this._ensureCachedDebuggableInfo();

        return this._cachedDebuggableInfo.debuggableType;
    }

    _determineTargetPlatformName()
    {
        this._ensureCachedDebuggableInfo();

        return this._cachedDebuggableInfo.targetPlatformName;
    }

    _determineTargetBuildVersion()
    {
        this._ensureCachedDebuggableInfo();

        return this._cachedDebuggableInfo.targetBuildVersion;
    }

    _determineTargetProductVersion()
    {
        this._ensureCachedDebuggableInfo();

        return this._cachedDebuggableInfo.targetProductVersion;
    }

    _determineTargetIsSimulator()
    {
        this._ensureCachedDebuggableInfo();

        return !!this._cachedDebuggableInfo.targetIsSimulator;
    }

    _ensureCachedDebuggableInfo()
    {
        if (this._cachedDebuggableInfo)
            return;

        let debuggableInfo = InspectorFrontendHost.debuggableInfo;
        this._cachedDebuggableInfo = {
            debuggableType: WI.DebuggableType.fromString(debuggableInfo.debuggableType) || WI.DebuggableType.JavaScript,
            targetPlatformName: debuggableInfo.targetPlatformName || "Unknown",
            targetBuildVersion: debuggableInfo.targetBuildVersion || "Unknown",
            targetProductVersion: debuggableInfo.targetProductVersion || "Unknown",
            targetIsSimulator: debuggableInfo.targetIsSimulator,
        };
    }
};
