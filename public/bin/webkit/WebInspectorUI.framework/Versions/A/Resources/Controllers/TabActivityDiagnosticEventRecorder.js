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

WI.TabActivityDiagnosticEventRecorder = class TabActivityDiagnosticEventRecorder extends WI.DiagnosticEventRecorder
{
    constructor(controller)
    {
        super("TabActivity", controller);

        this._inspectorHasFocus = true;
        this._lastUserInteractionTimestamp = undefined;

        this._eventSamplingTimerIdentifier = undefined;
        this._initialDelayBeforeSamplingTimerIdentifier = undefined;
    }

    // Static

    // In milliseconds.
    static get eventSamplingInterval() { return 60 * 1000; }
    static get initialDelayBeforeSamplingInterval() { return 10 * 1000; }

    // Protected

    setup()
    {
        const options = {
            capture: true,
        };
        window.addEventListener("focus", this, options);
        window.addEventListener("blur", this, options);
        window.addEventListener("keydown", this, options);
        window.addEventListener("mousedown", this, options);

        // If it's been less than 10 seconds since the frontend loaded, wait a bit.
        if (performance.now() - WI.frontendCompletedLoadTimestamp < TabActivityDiagnosticEventRecorder.initialDelayBeforeSamplingInterval)
            this._startInitialDelayBeforeSamplingTimer();
        else
            this._startEventSamplingTimer();

    }

    teardown()
    {
        const options = {
            capture: true,
        };
        window.removeEventListener("focus", this, options);
        window.removeEventListener("blur", this, options);
        window.removeEventListener("keydown", this, options);
        window.removeEventListener("mousedown", this, options);

        this._stopInitialDelayBeforeSamplingTimer();
        this._stopEventSamplingTimer();

    }

    // Public

    handleEvent(event)
    {
        switch (event.type) {
        case "focus":
            this._handleWindowFocus(event);
            break;
        case "blur":
            this._handleWindowBlur(event);
            break;
        case "keydown":
            this._handleWindowKeyDown(event);
            break;
        case "mousedown":
            this._handleWindowMouseDown(event);
            break;
        }
    }

    // Private

    _startInitialDelayBeforeSamplingTimer()
    {
        if (this._initialDelayBeforeSamplingTimerIdentifier) {
            clearTimeout(this._initialDelayBeforeSamplingTimerIdentifier);
            this._initialDelayBeforeSamplingTimerIdentifier = undefined;
        }

        // All intervals are in milliseconds.
        let maximumInitialDelay = TabActivityDiagnosticEventRecorder.initialDelayBeforeSamplingInterval;
        let elapsedTime = performance.now() - WI.frontendCompletedLoadTimestamp;
        let remainingTime = maximumInitialDelay - elapsedTime;
        let initialDelay = Number.constrain(remainingTime, 0, maximumInitialDelay);
        this._initialDelayBeforeSamplingTimerIdentifier = setTimeout(this._sampleCurrentTabActivity.bind(this), initialDelay);
    }

    _stopInitialDelayBeforeSamplingTimer()
    {
        if (this._initialDelayBeforeSamplingTimerIdentifier) {
            clearTimeout(this._initialDelayBeforeSamplingTimerIdentifier);
            this._initialDelayBeforeSamplingTimerIdentifier = undefined;
        }
    }

    _startEventSamplingTimer()
    {
        if (this._eventSamplingTimerIdentifier) {
            clearTimeout(this._eventSamplingTimerIdentifier);
            this._eventSamplingTimerIdentifier = undefined;
        }

        this._eventSamplingTimerIdentifier = setTimeout(this._sampleCurrentTabActivity.bind(this), TabActivityDiagnosticEventRecorder.eventSamplingInterval);
    }

    _stopEventSamplingTimer()
    {
        if (this._eventSamplingTimerIdentifier) {
            clearTimeout(this._eventSamplingTimerIdentifier);
            this._eventSamplingTimerIdentifier = undefined;
        }
    }

    _sampleCurrentTabActivity()
    {
        // Set up the next timer first so later code can bail out if there's nothing to do.
        this._stopEventSamplingTimer();
        this._stopInitialDelayBeforeSamplingTimer();
        this._startEventSamplingTimer();

        let intervalSinceLastUserInteraction = performance.now() - this._lastUserInteractionTimestamp;
        if (intervalSinceLastUserInteraction > TabActivityDiagnosticEventRecorder.eventSamplingInterval) {
            if (WI.settings.debugAutoLogDiagnosticEvents.valueRespectingDebugUIAvailability)
                console.log("TabActivity: sample not reported, last user interaction was %.1f seconds ago.".format(intervalSinceLastUserInteraction / 1000));
            return;
        }

        let selectedTabContentView = WI.tabBrowser.selectedTabContentView;
        console.assert(selectedTabContentView);
        if (!selectedTabContentView)
            return;

        let tabType = selectedTabContentView.type;
        let interval = TabActivityDiagnosticEventRecorder.eventSamplingInterval / 1000;
        this.logDiagnosticEvent(this.name, {tabType, interval});
    }

    _didObserveUserInteraction()
    {
        if (!this._inspectorHasFocus)
            return;

        this._lastUserInteractionTimestamp = performance.now();
    }

    _handleWindowFocus(event)
    {
        if (event.target !== window)
            return;

        this._inspectorHasFocus = true;
    }

    _handleWindowBlur(event)
    {
        if (event.target !== window)
            return;

        this._inspectorHasFocus = false;
    }

    _handleWindowKeyDown(event)
    {
        this._didObserveUserInteraction();
    }

    _handleWindowMouseDown(event)
    {
        this._didObserveUserInteraction();
    }
};

