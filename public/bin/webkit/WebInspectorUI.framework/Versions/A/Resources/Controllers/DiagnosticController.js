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

WI.DiagnosticController = class DiagnosticController
{
    constructor()
    {
        this._diagnosticLoggingAvailable = false;
        this._recorders = new Set;

        this._autoLogDiagnosticEventsToConsole = WI.settings.debugAutoLogDiagnosticEvents.value;
        this._logToConsoleMethod = window.InspectorTest ? InspectorTest.log.bind(InspectorTest) : console.log;

        WI.settings.debugEnableDiagnosticLogging.addEventListener(WI.Setting.Event.Changed, this._debugEnableDiagnosticLoggingSettingDidChange, this);
        WI.settings.debugAutoLogDiagnosticEvents.addEventListener(WI.Setting.Event.Changed, this._debugAutoLogDiagnosticEventsSettingDidChange, this);
    }

    // Public

    get diagnosticLoggingAvailable()
    {
        return this._diagnosticLoggingAvailable;
    }

    set diagnosticLoggingAvailable(available)
    {
        if (this._diagnosticLoggingAvailable === available)
            return;

        this._diagnosticLoggingAvailable = available;
        this._updateRecorderStates();
    }

    addRecorder(recorder)
    {
        console.assert(!this._recorders.has(recorder), "Tried to add the same diagnostic recorder more than once.");
        this._recorders.add(recorder);
        this._updateRecorderStates();
    }

    logDiagnosticEvent(eventName, payload)
    {
        // Don't rely on a diagnostic logging delegate to unit test frontend diagnostics code.
        if (window.InspectorTest) {
            this._logToConsoleMethod(`Received diagnostic event: ${eventName} => ${JSON.stringify(payload)}`);
            return;
        }

        if (this._autoLogDiagnosticEventsToConsole)
            this._logToConsoleMethod(eventName, payload);

        InspectorFrontendHost.logDiagnosticEvent(eventName, JSON.stringify(payload));
    }

    // Private

    _debugEnableDiagnosticLoggingSettingDidChange()
    {
        this._updateRecorderStates();
    }

    _debugAutoLogDiagnosticEventsSettingDidChange()
    {
        this._autoLogDiagnosticEventsToConsole = WI.settings.debugAutoLogDiagnosticEvents.value;
    }

    _updateRecorderStates()
    {
        let isActive = this._diagnosticLoggingAvailable && WI.settings.debugEnableDiagnosticLogging.value;
        for (let recorder of this._recorders)
            recorder.active = isActive;
    }
};
