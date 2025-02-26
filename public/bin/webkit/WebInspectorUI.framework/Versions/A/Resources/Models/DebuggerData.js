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

WI.DebuggerData = class DebuggerData
{
    constructor(target)
    {
        console.assert(target instanceof WI.Target);

        this._target = target;

        this._paused = false;
        this._pausing = false;
        this._pauseReason = null;
        this._pauseData = null;
        this._stackTrace = null;

        this._scriptIdMap = new Map;
        this._scriptContentIdentifierMap = new Map;

        this._makePausingAfterNextResume = false;
    }

    // Public

    get target() { return this._target; }
    get paused() { return this._paused; }
    get pausing() { return this._pausing; }
    get pauseReason() { return this._pauseReason; }
    get pauseData() { return this._pauseData; }
    get stackTrace() { return this._stackTrace; }

    get scripts()
    {
        return Array.from(this._scriptIdMap.values());
    }

    scriptForIdentifier(id)
    {
        return this._scriptIdMap.get(id);
    }

    scriptsForURL(url)
    {
        return this._scriptContentIdentifierMap.get(WI.urlWithoutUserQueryOrFragment(url)) || [];
    }

    // Protected (Called by DebuggerManager)

    reset()
    {
        this._scriptIdMap.clear();
    }

    addScript(script)
    {
        this._scriptIdMap.set(script.id, script);

        if (script.contentIdentifier) {
            let url = WI.urlWithoutUserQueryOrFragment(script.contentIdentifier);
            let scripts = this._scriptContentIdentifierMap.get(url);
            if (!scripts) {
                scripts = [];
                this._scriptContentIdentifierMap.set(url, scripts);
            }
            scripts.push(script);
        }
    }

    pauseIfNeeded()
    {
        if (this._paused || this._pausing)
            return Promise.resolve();

        this._pausing = true;

        return this._target.DebuggerAgent.pause();
    }

    resumeIfNeeded()
    {
        if (!this._paused && !this._pausing)
            return Promise.resolve();

        this._pausing = false;

        return this._target.DebuggerAgent.resume();
    }

    continueUntilNextRunLoop()
    {
        if (!this._paused || this._pausing)
            return Promise.resolve();

        // The backend will automatically start pausing
        // after resuming, so we need to match that here.
        this._makePausingAfterNextResume = true;

        return this._target.DebuggerAgent.continueUntilNextRunLoop();
    }

    updateForPause(stackTrace, pauseReason, pauseData)
    {
        this._paused = true;
        this._pausing = false;
        this._pauseReason = pauseReason;
        this._pauseData = pauseData;
        this._stackTrace = stackTrace;

        // We paused, no need for auto-pausing.
        this._makePausingAfterNextResume = false;
    }

    updateForResume()
    {
        this._paused = false;
        this._pausing = false;
        this._pauseReason = null;
        this._pauseData = null;
        this._stackTrace = null;

        // We resumed, but may be auto-pausing.
        if (this._makePausingAfterNextResume) {
            this._makePausingAfterNextResume = false;
            this._pausing = true;
        }
    }
};
