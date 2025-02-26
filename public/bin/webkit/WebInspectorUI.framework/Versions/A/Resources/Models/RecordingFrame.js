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

WI.RecordingFrame = class RecordingFrame
{
    constructor(actions, {duration, incomplete} = {})
    {
        this._actions = actions;
        this._duration = duration || NaN;
        this._incomplete = incomplete || false;
    }

    // Static

    static fromPayload(payload)
    {
        if (typeof payload !== "object" || payload === null)
            payload = {};

        if (!Array.isArray(payload.actions)) {
            if ("actions" in payload)
                WI.Recording.synthesizeWarning(WI.UIString("non-array %s").format(WI.unlocalizedString("actions")));

            payload.actions = [];
        }

        let actions = payload.actions.map(WI.RecordingAction.fromPayload);
        return new WI.RecordingFrame(actions, {
            duration: payload.duration || NaN,
            incomplete: !!payload.incomplete,
        });
    }

    // Public

    get actions() { return this._actions; }
    get duration() { return this._duration; }
    get incomplete() { return this._incomplete; }

    toJSON()
    {
        let json = {
            actions: this._actions.map((action) => action.toJSON()),
        };
        if (!isNaN(this._duration))
            json.duration = this._duration;
        if (this._incomplete)
            json.incomplete = this._incomplete;
        return json;
    }
};
