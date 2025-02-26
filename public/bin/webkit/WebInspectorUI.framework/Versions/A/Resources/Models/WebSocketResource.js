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

WI.WebSocketResource = class WebSocketResource extends WI.Resource
{
    constructor(url, {loaderIdentifier, requestIdentifier, requestHeaders, timestamp, walltime, requestSentTimestamp} = {})
    {
        super(url, {
            type: WI.Resource.Type.WebSocket,
            loaderIdentifier,
            requestIdentifier,
            requestMethod: WI.HTTPUtilities.RequestMethod.GET,
            requestHeaders,
            requestSentTimestamp,
        });

        this._timestamp = timestamp;
        this._walltime = walltime;
        this._readyState = WI.WebSocketResource.ReadyState.Connecting;
        this._frames = [];
    }

    // Public

    get frames() { return this._frames; }
    get walltime() { return this._walltime; }

    get readyState()
    {
        return this._readyState;
    }

    set readyState(state)
    {
        if (state === this._readyState)
            return;

        let previousState = this._readyState;
        this._readyState = state;

        this.dispatchEventToListeners(WI.WebSocketResource.Event.ReadyStateChanged, {previousState, state});
    }

    addFrame(data, payloadLength, isOutgoing, opcode, timestamp, elapsedTime)
    {
        let frameData;

        // Binary data is never shown in the UI, don't clog memory with it.
        if (opcode === WI.WebSocketResource.OpCodes.BinaryFrame)
            frameData = null;
        else
            frameData = data;

        let frame = {data: frameData, isOutgoing, opcode, walltime: this._walltimeForWebSocketTimestamp(timestamp)};
        this._frames.push(frame);
        if (InspectorFrontendHost.isUnderTest())
            frame.dataForTest = data;

        this.increaseSize(payloadLength, elapsedTime);

        this.dispatchEventToListeners(WI.WebSocketResource.Event.FrameAdded, frame);
    }

    // Protected

    requestContentFromBackend()
    {
        console.assert(false, "A WebSocket's content was requested. WebSockets do not have content so the request is nonsensical.");

        return super.requestContentFromBackend();
    }

    // Private

    _walltimeForWebSocketTimestamp(timestamp)
    {
        return this._walltime + (timestamp - this._timestamp);
    }
};

WI.WebSocketResource.Event = {
    FrameAdded: "web-socket-frame-added",
    ReadyStateChanged: "web-socket-resource-ready-state-changed",
};

WI.WebSocketResource.ReadyState = {
    Closed: Symbol("closed"),
    Connecting: Symbol("connecting"),
    Open: Symbol("open"),
};

WI.WebSocketResource.OpCodes = {
    ContinuationFrame: 0,
    TextFrame: 1,
    BinaryFrame: 2,
    ConnectionCloseFrame: 8,
    PingFrame: 9,
    PongFrame: 10,
};
