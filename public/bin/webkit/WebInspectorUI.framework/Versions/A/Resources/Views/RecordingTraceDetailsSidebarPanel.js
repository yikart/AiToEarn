/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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

WI.RecordingTraceDetailsSidebarPanel = class RecordingTraceDetailsSidebarPanel extends WI.DetailsSidebarPanel
{
    constructor()
    {
        super("recording-trace", WI.UIString("Trace"));

        const selectable = false;
        this._backtraceTreeOutline = new WI.TreeOutline(selectable);
        this._backtraceTreeOutline.disclosureButtons = false;
        this._backtraceTreeController = new WI.StackTraceTreeController(this._backtraceTreeOutline);

        this._recording = null;
        this._action = null;
    }

    // Public

    inspect(objects)
    {
        if (!(objects instanceof Array))
            objects = [objects];

        this.recording = objects.find((object) => object instanceof WI.Recording);
        this.action = objects.find((object) => object instanceof WI.RecordingAction);

        return this._recording && this._action;
    }

    set recording(recording)
    {
        if (recording === this._recording)
            return;

        this._recording = recording;
        this._action = null;

        this.contentView.element.removeChildren();
    }

    set action(action)
    {
        console.assert(!action || action instanceof WI.RecordingAction);
        if (!this._recording || action === this._action)
            return;

        this._action = action;

        this.contentView.element.removeChildren();

        if (!this._action)
            return;

        let stackTrace = this._action.stackTrace;
        this._backtraceTreeController.stackTrace = stackTrace;

        if (!stackTrace?.callFrames.length) {
            let noStackTraceContainerElement = this.contentView.element.appendChild(document.createElement("div"));
            noStackTraceContainerElement.classList.add("no-stack-trace");

            let noStackTraceMessageElement = noStackTraceContainerElement.appendChild(document.createElement("div"));
            noStackTraceMessageElement.classList.add("message");
            noStackTraceMessageElement.textContent = WI.UIString("Call Stack Unavailable");
            return;
        }

        this.contentView.element.appendChild(this._backtraceTreeOutline.element);
    }
};
