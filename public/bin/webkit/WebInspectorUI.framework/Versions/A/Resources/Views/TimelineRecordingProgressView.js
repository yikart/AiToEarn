/*
 * Copyright (C) 2016 Apple Inc. All rights reserved.
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

WI.TimelineRecordingProgressView = class TimelineRecordingProgressView extends WI.View
{
    constructor()
    {
        super();

        this.element.classList.add("recording-progress");

        let statusGroup = this.element.appendChild(document.createElement("div"));
        statusGroup.className = "status";

        this._statusElement = statusGroup.appendChild(document.createElement("span"));

        let spinner = new WI.IndeterminateProgressSpinner;
        statusGroup.appendChild(spinner.element);

        this._stopRecordingButtonElement = document.createElement("button");
        this._stopRecordingButtonElement.textContent = WI.UIString("Stop Recording");
        this._stopRecordingButtonElement.addEventListener("click", () => WI.timelineManager.stopCapturing());
        this.element.appendChild(this._stopRecordingButtonElement);

        WI.timelineManager.addEventListener(WI.TimelineManager.Event.CapturingStateChanged, this._handleTimelineCapturingStateChanged, this);
    }

    // Public

    get visible()
    {
        return this._visible;
    }

    set visible(x)
    {
        if (this._visible === x)
            return;

        // FIXME: remove once <https://webkit.org/b/150741> is fixed.
        this._visible = x;
        this.element.classList.toggle("hidden", !this._visible);

        if (this._visible)
            this._updateState();
    }

    // Private

    _updateState() {
        if (!this._visible)
            return;

        switch (WI.timelineManager.capturingState) {
        case WI.TimelineManager.CapturingState.Starting:
        case WI.TimelineManager.CapturingState.Active:
            this._statusElement.textContent = WI.UIString("Recording Timeline Data", "Recording Timeline Data @ Timeline Recording Progress", "Message for progress of a timeline recording.");
            this._stopRecordingButtonElement.disabled = false;
            break;
        case WI.TimelineManager.CapturingState.Stopping:
            this._statusElement.textContent = WI.UIString("Stopping Timeline Recording", "Stopping Timeline Recording @ Timeline Recording Progress", "Message for progress of stopping a timeline recording.");
            this._stopRecordingButtonElement.disabled = true;
            break;
        case WI.TimelineManager.CapturingState.Inactive:
            // When inactive this view should be hidden by its parent, so keep the state the same to avoid possibly
            // flickering to a different state just before the parent hides us.
            break;
        }
    }

    _handleTimelineCapturingStateChanged(event)
    {
        this._updateState();
    }

};
