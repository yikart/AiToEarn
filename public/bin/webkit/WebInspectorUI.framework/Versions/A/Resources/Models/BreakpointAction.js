/*
 * Copyright (C) 2013, 2014 Apple Inc. All rights reserved.
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

WI.BreakpointAction = class BreakpointAction extends WI.Object
{
    constructor(type, {data, emulateUserGesture} = {})
    {
        console.assert(Object.values(WI.BreakpointAction.Type).includes(type), type);
        console.assert(!data || typeof data === "string", data);

        super();

        this._type = type;
        this._data = data || null;
        this._id = WI.debuggerManager.nextBreakpointActionIdentifier();
        this._emulateUserGesture = !!emulateUserGesture;
    }

    // Static

    static supportsEmulateUserAction()
    {
        // COMPATIBILITY (iOS 14): the `emulateUserGesture` property of `Debugger.BreakpointAction` did not exist yet.
        // Since support can't be tested directly, check for the `options` parameter of `Debugger.setPauseOnExceptions`.
        // FIXME: Use explicit version checking once <https://webkit.org/b/148680> is fixed.
        return WI.sharedApp.isWebDebuggable() && InspectorBackend.hasCommand("Debugger.setPauseOnExceptions", "options");
    }

    // Import / Export

    static fromJSON(json)
    {
        return new WI.BreakpointAction(json.type, {
            data: json.data,
            emulateUserGesture: json.emulateUserGesture,
        });
    }

    toJSON()
    {
        let json = {
            type: this._type,
        };
        if (this._data)
            json.data = this._data;
        if (this._emulateUserGesture)
            json.emulateUserGesture = this._emulateUserGesture;
        return json;
    }

    // Public

    get id() { return this._id; }

    get type()
    {
        return this._type;
    }

    set type(type)
    {
        console.assert(Object.values(WI.BreakpointAction.Type).includes(type), type);

        if (type === this._type)
            return;

        this._type = type;

        this.dispatchEventToListeners(WI.BreakpointAction.Event.Modified);
    }

    get data()
    {
        return this._data;
    }

    set data(data)
    {
        console.assert(!data || typeof data === "string", data);

        if (this._data === data)
            return;

        this._data = data;

        this.dispatchEventToListeners(WI.BreakpointAction.Event.Modified);
    }

    get emulateUserGesture()
    {
        return this._emulateUserGesture;
    }

    set emulateUserGesture(emulateUserGesture)
    {
        if (this._emulateUserGesture === emulateUserGesture)
            return;

        this._emulateUserGesture = emulateUserGesture;

        this.dispatchEventToListeners(WI.BreakpointAction.Event.Modified);
    }

    toProtocol()
    {
        let json = this.toJSON();
        json.id = this._id;
        return json;
    }
};

WI.BreakpointAction.Type = {
    Log: "log",
    Evaluate: "evaluate",
    Sound: "sound",
    Probe: "probe"
};

WI.BreakpointAction.Event = {
    Modified: "breakpoint-action-modified",
};
