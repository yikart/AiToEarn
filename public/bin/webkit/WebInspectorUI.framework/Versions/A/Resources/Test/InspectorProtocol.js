/*
 * Copyright (C) 2012 Samsung Electronics. All rights reserved.
 * Copyright (C) 2014, 2015 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

InspectorProtocol = {};
InspectorProtocol._dispatchTable = [];
InspectorProtocol._placeholderRequestIds = [];
InspectorProtocol._requestId = -1;
InspectorProtocol.eventHandler = {};

InspectorProtocol.sendCommand = function(methodOrObject, params, handler)
{
    // Allow new-style arguments object, as in awaitCommand.
    let method = methodOrObject;
    if (typeof methodOrObject === "object")
        ({method, params, handler} = methodOrObject);
    else if (!params)
        params = {};

    this._dispatchTable[++this._requestId] = handler;
    let messageObject = {method, params, id: this._requestId};
    this._sendMessage(messageObject);

    return this._requestId;
};

InspectorProtocol.awaitCommand = function(args)
{
    let {method, params} = args;
    let messageObject = {method, params, id: ++this._requestId};

    return this.awaitMessage(messageObject);
};

InspectorProtocol.awaitMessage = function(messageObject)
{
    // Send a raw message to the backend. Mostly used to test the backend's error handling.
    return new Promise((resolve, reject) => {
        let requestId = messageObject.id;

        // If the caller did not provide an id, then make one up so that the response
        // can be used to settle a promise.
        if (typeof requestId !== "number") {
            requestId = ++this._requestId;
            this._placeholderRequestIds.push(requestId);
        }

        this._dispatchTable[requestId] = {resolve, reject};
        this._sendMessage(messageObject);
    });
};

InspectorProtocol.awaitEvent = function(args)
{
    let event = args.event;
    if (typeof event !== "string")
        throw new Error("Event must be a string.");

    return new Promise((resolve, reject) => {
        InspectorProtocol.eventHandler[event] = function(message) {
            InspectorProtocol.eventHandler[event] = undefined;
            resolve(message);
        };
    });
};

InspectorProtocol._sendMessage = function(messageObject)
{
    let messageString = typeof messageObject !== "string" ? JSON.stringify(messageObject) : messageObject;

    if (ProtocolTest.dumpInspectorProtocolMessages)
        InspectorFrontendHost.unbufferedLog(`frontend: ${messageString}`);

    InspectorFrontendHost.sendMessageToBackend(messageString);
};

InspectorProtocol.addEventListener = function(eventTypeOrObject, listener)
{
    let event = eventTypeOrObject;
    if (typeof eventTypeOrObject === "object")
        ({event, listener} = eventTypeOrObject);

    if (typeof event !== "string")
        throw new Error("Event name must be a string.");

    if (typeof listener !== "function")
        throw new Error("Event listener must be callable.");

    // Convert to an array of listeners.
    let listeners = InspectorProtocol.eventHandler[event];
    if (!listeners)
        listeners = InspectorProtocol.eventHandler[event] = [];
    else if (typeof listeners === "function")
        listeners = InspectorProtocol.eventHandler[event] = [listeners];

    // Prevent registering multiple times.
    if (listeners.includes(listener))
        throw new Error("Cannot register the same listener more than once.");

    listeners.push(listener);
    return listener;
};

InspectorProtocol.removeEventListener = function(eventTypeOrObject, listener)
{
    let event = eventTypeOrObject;
    if (typeof eventTypeOrObject === "object")
        ({event, listener} = eventTypeOrObject);

    if (typeof event !== "string")
        throw new Error("Event name must be a string.");

    if (typeof listener !== "function")
        throw new Error("Event listener must be callable.");

    // Convert to an array of listeners.
    let listeners = InspectorProtocol.eventHandler[event];
    if (!listeners)
        return;

    listeners.removeAll(listener);
};

InspectorProtocol.checkForError = function(responseObject)
{
    if (responseObject.error) {
        ProtocolTest.log("PROTOCOL ERROR: " + JSON.stringify(responseObject.error));
        ProtocolTest.completeTest();
        throw "PROTOCOL ERROR";
    }
};

InspectorProtocol.dispatchMessageFromBackend = function(messageObject)
{
    // This matches the debug dumping in InspectorBackend, which is bypassed
    // by InspectorProtocol. Return messages should be dumped by InspectorBackend.
    if (ProtocolTest.dumpInspectorProtocolMessages)
        InspectorFrontendHost.unbufferedLog("backend: " + JSON.stringify(messageObject));

    // If the message has an id, then it is a reply to a command.
    let messageId = messageObject.id;

    // If the id is 'null', then it may be an error response.
    if (messageId === null)
        messageId = InspectorProtocol._placeholderRequestIds.shift();

    // If we could figure out a requestId, then dispatch the message.
    if (typeof messageId === "number") {
        let handler = InspectorProtocol._dispatchTable[messageId];
        if (!handler)
            return;

        if (typeof handler === "function")
            handler(messageObject);
        else if (typeof handler === "object") {
            let {resolve, reject} = handler;
            if ("error" in messageObject)
                reject(messageObject.error);
            else
                resolve(messageObject.result);
        }
    } else {
        // Otherwise, it is an event.
        let eventName = messageObject["method"];
        let handler = InspectorProtocol.eventHandler[eventName];
        if (!handler)
            return;

        if (typeof handler === "function")
            handler(messageObject);
        else if (handler instanceof Array) {
            handler.map((listener) => { listener.call(null, messageObject); });
        } else if (typeof handler === "object") {
            let {resolve, reject} = handler;
            if ("error" in messageObject)
                reject(messageObject.error);
            else
                resolve(messageObject.result);
        }
    }
};
