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

WI.TimelineMarker = class TimelineMarker extends WI.Object
{
    constructor(time, type, details)
    {
        super();

        console.assert(type);

        this._time = time || 0;
        this._type = type;
        this._details = details || null;
    }

    // Import / Export

    static fromJSON(json)
    {
        let {time, type, details} = json;
        return new WI.TimelineMarker(time, type, details);
    }

    toJSON()
    {
        return {
            time: this._time,
            type: this._type,
            details: this._details || undefined,
        };
    }

    // Public

    get type() { return this._type; }
    get details() { return this._details; }

    get time()
    {
        return this._time;
    }

    set time(x)
    {
        console.assert(typeof x === "number", "Time should be a number.");

        x = x || 0;

        if (this._time === x)
            return;

        this._time = x;

        this.dispatchEventToListeners(WI.TimelineMarker.Event.TimeChanged);
    }
};

WI.TimelineMarker.Event = {
    TimeChanged: "timeline-marker-time-changed"
};

WI.TimelineMarker.Type = {
    CurrentTime: "current-time",
    LoadEvent: "load-event",
    DOMContentEvent: "dom-content-event",
    TimeStamp: "timestamp",
    Scanner: "scanner",
};
