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

WI.HeapSnapshotWorkerProxy = class HeapSnapshotWorkerProxy extends WI.Object
{
    constructor()
    {
        super();

        this._heapSnapshotWorker = new Worker("Workers/HeapSnapshot/HeapSnapshotWorker.js");
        this._heapSnapshotWorker.addEventListener("message", this._handleMessage.bind(this));

        this._nextCallId = 1;
        this._callbacks = new Map;

        WI.Frame.addEventListener(WI.Frame.Event.MainResourceDidChange, this._mainResourceDidChange, this);
    }

    // Static

    static singleton()
    {
        if (!HeapSnapshotWorkerProxy.instance)
            HeapSnapshotWorkerProxy.instance = new HeapSnapshotWorkerProxy;
        return HeapSnapshotWorkerProxy.instance;
    }

    // Actions

    clearSnapshots(callback)
    {
        this.performAction("clearSnapshots", callback);
    }

    createSnapshot(snapshotStringData, callback)
    {
        this.performAction("createSnapshot", ...arguments);
    }

    createSnapshotDiff(objectId1, objectId2, callback)
    {
        this.performAction("createSnapshotDiff", ...arguments);
    }

    createImportedSnapshot(snapshotStringData, title, callback)
    {
        const imported = true;
        this.performAction("createSnapshot", snapshotStringData, title, imported, callback);
    }

    // Public

    performAction(actionName)
    {
        let callId = this._nextCallId++;
        let callback = arguments[arguments.length - 1];
        let actionArguments = Array.prototype.slice.call(arguments, 1, arguments.length - 1);

        console.assert(typeof actionName === "string", "performAction should always have an actionName");
        console.assert(typeof callback === "function", "performAction should always have a callback");

        this._callbacks.set(callId, callback);
        this._postMessage({callId, actionName, actionArguments});
    }

    callMethod(objectId, methodName)
    {
        let callId = this._nextCallId++;
        let callback = arguments[arguments.length - 1];
        let methodArguments = Array.prototype.slice.call(arguments, 2, arguments.length - 1);

        console.assert(typeof objectId === "number", "callMethod should always have an objectId");
        console.assert(typeof methodName === "string", "callMethod should always have a methodName");
        console.assert(typeof callback === "function", "callMethod should always have a callback");

        this._callbacks.set(callId, callback);
        this._postMessage({callId, objectId, methodName, methodArguments});
    }

    // Private

    _mainResourceDidChange(event)
    {
        if (!event.target.isMainFrame())
            return;

        this.clearSnapshots(() => {
            WI.HeapSnapshotProxy.invalidateSnapshotProxies();
        });
    }

    _postMessage()
    {
        this._heapSnapshotWorker.postMessage(...arguments);
    }

    _handleMessage(event)
    {
        let data = event.data;

        // Error.
        if (data.error) {
            console.assert(data.callId);
            this._callbacks.delete(data.callId);
            return;
        }

        // Event.
        if (data.eventName) {
            this.dispatchEventToListeners(data.eventName, data.eventData);
            return;
        }

        // Action or Method Response.
        if (data.callId) {
            let callback = this._callbacks.get(data.callId);
            this._callbacks.delete(data.callId);
            callback(data.result);
            return;
        }

        console.error("Unexpected HeapSnapshotWorker message", data);
    }
};

WI.HeapSnapshotWorkerProxy.Event = {
    Collection: "heap-snapshot-collection",
};
