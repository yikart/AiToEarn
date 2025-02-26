/*
 * Copyright (C) 2011 Google Inc. All rights reserved.
 * Copyright (C) 2013-2016 Apple Inc. All rights reserved.
 * Copyright (C) 2014 University of Washington.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

InspectorBackend.globalSequenceId = 1;

InspectorBackend.Connection = class InspectorBackendConnection
{
    constructor()
    {
        this._pendingResponses = new Map;
        this._deferredCallbacks = [];
        this._target = null;
        this._provisionalMessages = [];
    }

    // Public

    get target()
    {
        return this._target;
    }

    set target(target)
    {
        console.assert(!this._target);
        this._target = target;
    }

    addProvisionalMessage(message)
    {
        console.assert(this.target && this.target.isProvisional);
        this._provisionalMessages.push(message);
    }

    dispatchProvisionalMessages()
    {
        console.assert(this.target && !this.target.isProvisional);
        for (let message of this._provisionalMessages)
            this.dispatch(message);
        this._provisionalMessages = [];
    }

    dispatch(message)
    {
        let messageObject = typeof message === "string" ? JSON.parse(message) : message;

        if ("id" in messageObject)
            this._dispatchResponse(messageObject);
        else
            this._dispatchEvent(messageObject);
    }

    runAfterPendingDispatches(callback)
    {
        console.assert(typeof callback === "function");

        if (!this._pendingResponses.size)
            callback.call(this);
        else
            this._deferredCallbacks.push(callback);
    }

    // Protected

    sendMessageToBackend(message)
    {
        throw new Error("Should be implemented by a InspectorBackend.Connection subclass");
    }

    // Private

    _dispatchResponse(messageObject)
    {
        console.assert(this._pendingResponses.size >= 0);

        if (messageObject.error && messageObject.error.code !== -32_000)
            console.error("Request with id = " + messageObject["id"] + " failed. " + JSON.stringify(messageObject.error));

        let sequenceId = messageObject["id"];
        console.assert(this._pendingResponses.has(sequenceId), sequenceId, this._target ? this._target.identifier : "(unknown)", this._pendingResponses);

        let responseData = this._pendingResponses.take(sequenceId) || {};
        let {request, command, callback, promise} = responseData;

        let processingStartTimestamp = performance.now();
        for (let tracer of InspectorBackend.activeTracers)
            tracer.logWillHandleResponse(this, messageObject);

        InspectorBackend.currentDispatchState.request = request;
        InspectorBackend.currentDispatchState.response = messageObject;

        if (typeof callback === "function")
            this._dispatchResponseToCallback(command, request, messageObject, callback);
        else if (typeof promise === "object")
            this._dispatchResponseToPromise(command, messageObject, promise);
        else
            console.error("Received a command response without a corresponding callback or promise.", messageObject, command);

        InspectorBackend.currentDispatchState.request = null;
        InspectorBackend.currentDispatchState.response = null;

        let processingTime = (performance.now() - processingStartTimestamp).toFixed(3);
        let roundTripTime = (processingStartTimestamp - responseData.sendRequestTimestamp).toFixed(3);

        for (let tracer of InspectorBackend.activeTracers)
            tracer.logDidHandleResponse(this, messageObject, {rtt: roundTripTime, dispatch: processingTime});

        if (this._deferredCallbacks.length && !this._pendingResponses.size)
            this._flushPendingScripts();
    }

    _dispatchResponseToCallback(command, requestObject, responseObject, callback)
    {
        let callbackArguments = [];
        callbackArguments.push(responseObject["error"] ? responseObject["error"].message : null);

        if (responseObject["result"]) {
            for (let parameterName of command._replySignature)
                callbackArguments.push(responseObject["result"][parameterName]);
        }

        try {
            callback.apply(null, callbackArguments);
        } catch (e) {
            WI.reportInternalError(e, {"cause": `An uncaught exception was thrown while dispatching response callback for command ${command._qualifiedName}.`});
        }
    }

    _dispatchResponseToPromise(command, messageObject, promise)
    {
        let {resolve, reject} = promise;
        if (messageObject["error"])
            reject(new Error(messageObject["error"].message));
        else
            resolve(messageObject["result"]);
    }

    _dispatchEvent(messageObject)
    {
        let qualifiedName = messageObject.method;
        let [domainName, eventName] = qualifiedName.split(".");

        // COMPATIBILITY (iOS 12.2 and iOS 13): because the multiplexing target isn't created until
        // `Target.exists` returns, any `Target.targetCreated` won't have a dispatcher for the
        // message, so create a multiplexing target here to force this._target._agents.Target.
        if (!this._target && this === InspectorBackend.backendConnection && WI.sharedApp.debuggableType === WI.DebuggableType.WebPage && qualifiedName === "Target.targetCreated")
            WI.targetManager.createMultiplexingBackendTarget();

        let agent = this._target._agents[domainName];
        if (!agent) {
            console.error(`Protocol Error: Attempted to dispatch method '${qualifiedName}' for non-existing domain '${domainName}'`, messageObject);
            return;
        }

        let dispatcher = agent._dispatcher;
        if (!dispatcher) {
            console.error(`Protocol Error: Missing dispatcher for domain '${domainName}', for event '${qualifiedName}'`, messageObject);
            return;
        }

        let event = agent._events[eventName];
        if (!event) {
            console.error(`Protocol Error: Attempted to dispatch an unspecified method '${qualifiedName}'`, messageObject);
            return;
        }

        let handler = dispatcher[eventName];
        if (!handler) {
            console.error(`Protocol Error: Attempted to dispatch an unimplemented method '${qualifiedName}'`, messageObject);
            return;
        }

        let processingStartTimestamp = performance.now();
        for (let tracer of InspectorBackend.activeTracers)
            tracer.logWillHandleEvent(this, messageObject);

        InspectorBackend.currentDispatchState.event = messageObject;

        try {
            let params = messageObject.params || {};
            handler.apply(dispatcher, event._parameterNames.map((name) => params[name]));
        } catch (e) {
            for (let tracer of InspectorBackend.activeTracers)
                tracer.logFrontendException(this, messageObject, e);

            WI.reportInternalError(e, {"cause": `An uncaught exception was thrown while handling event: ${qualifiedName}`});
        }

        InspectorBackend.currentDispatchState.event = null;

        let processingDuration = (performance.now() - processingStartTimestamp).toFixed(3);
        for (let tracer of InspectorBackend.activeTracers)
            tracer.logDidHandleEvent(this, messageObject, {dispatch: processingDuration});
    }

    _sendCommandToBackendWithCallback(command, parameters, callback)
    {
        let sequenceId = InspectorBackend.globalSequenceId++;

        let messageObject = {
            "id": sequenceId,
            "method": command._qualifiedName,
        };

        if (!isEmptyObject(parameters))
            messageObject["params"] = parameters;

        let responseData = {command, request: messageObject, callback};

        if (InspectorBackend.activeTracer)
            responseData.sendRequestTimestamp = performance.now();

        this._pendingResponses.set(sequenceId, responseData);
        this._sendMessageToBackend(messageObject);
    }

    _sendCommandToBackendExpectingPromise(command, parameters)
    {
        let sequenceId = InspectorBackend.globalSequenceId++;

        let messageObject = {
            "id": sequenceId,
            "method": command._qualifiedName,
        };

        if (!isEmptyObject(parameters))
            messageObject["params"] = parameters;

        let responseData = {command, request: messageObject};

        if (InspectorBackend.activeTracer)
            responseData.sendRequestTimestamp = performance.now();

        let responsePromise = new Promise(function(resolve, reject) {
            responseData.promise = {resolve, reject};
        });

        this._pendingResponses.set(sequenceId, responseData);
        this._sendMessageToBackend(messageObject);

        return responsePromise;
    }

    _sendMessageToBackend(messageObject)
    {
        for (let tracer of InspectorBackend.activeTracers)
            tracer.logFrontendRequest(this, messageObject);

        this.sendMessageToBackend(JSON.stringify(messageObject));
    }

    _flushPendingScripts()
    {
        console.assert(this._pendingResponses.size === 0);

        let scriptsToRun = this._deferredCallbacks;
        this._deferredCallbacks = [];
        for (let script of scriptsToRun)
            script.call(this);
    }
};

InspectorBackend.BackendConnection = class InspectorBackendBackendConnection extends InspectorBackend.Connection
{
    sendMessageToBackend(message)
    {
        InspectorFrontendHost.sendMessageToBackend(message);
    }
};

InspectorBackend.WorkerConnection = class InspectorBackendWorkerConnection extends InspectorBackend.Connection
{
    sendMessageToBackend(message)
    {
        let workerId = this.target.identifier;
        this.target.parentTarget.WorkerAgent.sendMessageToWorker(workerId, message).catch((error) => {
            // Ignore errors if a worker went away quickly.
            if (this.target.isDestroyed)
                return;
            WI.reportInternalError(error);
        });
    }
};

InspectorBackend.TargetConnection = class InspectorBackendTargetConnection extends InspectorBackend.Connection
{
    sendMessageToBackend(message)
    {
        let targetId = this.target.identifier;
        this.target.parentTarget.TargetAgent.sendMessageToTarget(targetId, message).catch((error) => {
            // Ignore errors if the target was destroyed after the command was dispatched.
            if (this.target.isDestroyed)
                return;
            WI.reportInternalError(error);
        });
    }
};

InspectorBackend.backendConnection = new InspectorBackend.BackendConnection;
