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

WI.HeapSnapshotProxy = class HeapSnapshotProxy extends WI.Object
{
    constructor(snapshotObjectId, identifier, title, totalSize, totalObjectCount, liveSize, categories, imported)
    {
        super();

        this._proxyObjectId = snapshotObjectId;

        this._identifier = identifier;
        this._title = title;
        this._totalSize = totalSize;
        this._totalObjectCount = totalObjectCount;
        this._liveSize = liveSize;
        this._categories = Map.fromObject(categories);
        this._imported = imported;
        this._snapshotStringData = null;

        console.assert(!this.invalid);

        if (!WI.HeapSnapshotProxy.ValidSnapshotProxies)
            WI.HeapSnapshotProxy.ValidSnapshotProxies = [];
        WI.HeapSnapshotProxy.ValidSnapshotProxies.push(this);
    }

    // Static

    static deserialize(objectId, serializedSnapshot)
    {
        let {identifier, title, totalSize, totalObjectCount, liveSize, categories, imported} = serializedSnapshot;
        return new WI.HeapSnapshotProxy(objectId, identifier, title, totalSize, totalObjectCount, liveSize, categories, imported);
    }

    static invalidateSnapshotProxies()
    {
        if (!WI.HeapSnapshotProxy.ValidSnapshotProxies)
            return;

        for (let snapshotProxy of WI.HeapSnapshotProxy.ValidSnapshotProxies)
            snapshotProxy._invalidate();

        WI.HeapSnapshotProxy.ValidSnapshotProxies = null;
    }

    // Public

    get proxyObjectId() { return this._proxyObjectId; }
    get identifier() { return this._identifier; }
    get title() { return this._title; }
    get totalSize() { return this._totalSize; }
    get totalObjectCount() { return this._totalObjectCount; }
    get liveSize() { return this._liveSize; }
    get categories() { return this._categories; }
    get imported() { return this._imported; }
    get invalid() { return this._proxyObjectId === 0; }

    get snapshotStringData()
    {
        return this._snapshotStringData;
    }

    set snapshotStringData(data)
    {
        this._snapshotStringData = data;
    }

    updateForCollectionEvent(event)
    {
        console.assert(!this.invalid);
        if (!event.data.affectedSnapshots.includes(this._identifier))
            return;

        this.update(() => {
            this.dispatchEventToListeners(WI.HeapSnapshotProxy.Event.CollectedNodes, event.data);
        });
    }

    allocationBucketCounts(bucketSizes, callback)
    {
        console.assert(!this.invalid);
        WI.HeapSnapshotWorkerProxy.singleton().callMethod(this._proxyObjectId, "allocationBucketCounts", bucketSizes, callback);
    }

    instancesWithClassName(className, callback)
    {
        console.assert(!this.invalid);
        WI.HeapSnapshotWorkerProxy.singleton().callMethod(this._proxyObjectId, "instancesWithClassName", className, (serializedNodes) => {
            callback(serializedNodes.map(WI.HeapSnapshotNodeProxy.deserialize.bind(null, this._proxyObjectId)));
        });
    }

    update(callback)
    {
        console.assert(!this.invalid);
        WI.HeapSnapshotWorkerProxy.singleton().callMethod(this._proxyObjectId, "update", ({liveSize, categories}) => {
            this._liveSize = liveSize;
            this._categories = Map.fromObject(categories);
            callback();
        });
    }

    nodeWithIdentifier(nodeIdentifier, callback)
    {
        console.assert(!this.invalid);
        WI.HeapSnapshotWorkerProxy.singleton().callMethod(this._proxyObjectId, "nodeWithIdentifier", nodeIdentifier, (serializedNode) => {
            callback(WI.HeapSnapshotNodeProxy.deserialize(this._proxyObjectId, serializedNode));
        });
    }

    // Private

    _invalidate()
    {
        this._proxyObjectId = 0;
        this._liveSize = 0;

        this.dispatchEventToListeners(WI.HeapSnapshotProxy.Event.Invalidated);
    }
};

WI.HeapSnapshotProxy.Event = {
    CollectedNodes: "heap-snapshot-proxy-collected-nodes",
    Invalidated: "heap-snapshot-proxy-invalidated",
};
