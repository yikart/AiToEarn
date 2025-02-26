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

WI.HeapSnapshotDiffProxy = class HeapSnapshotDiffProxy extends WI.Object
{
    constructor(snapshotDiffObjectId, snapshot1, snapshot2, totalSize, totalObjectCount, categories)
    {
        super();

        this._proxyObjectId = snapshotDiffObjectId;

        console.assert(snapshot1 instanceof WI.HeapSnapshotProxy);
        console.assert(snapshot2 instanceof WI.HeapSnapshotProxy);

        this._snapshot1 = snapshot1;
        this._snapshot2 = snapshot2;
        this._totalSize = totalSize;
        this._totalObjectCount = totalObjectCount;
        this._categories = Map.fromObject(categories);
    }

    // Static

    static deserialize(objectId, serializedSnapshotDiff)
    {
        let {snapshot1: serializedSnapshot1, snapshot2: serializedSnapshot2, totalSize, totalObjectCount, categories} = serializedSnapshotDiff;
        // FIXME: The objectId for these snapshots is the snapshotDiff's objectId. Currently these
        // snapshots are only used for static data so the proxing doesn't matter. However,
        // should we serialize the objectId with the snapshot so we have the right objectId?
        let snapshot1 = WI.HeapSnapshotProxy.deserialize(objectId, serializedSnapshot1);
        let snapshot2 = WI.HeapSnapshotProxy.deserialize(objectId, serializedSnapshot2);
        return new WI.HeapSnapshotDiffProxy(objectId, snapshot1, snapshot2, totalSize, totalObjectCount, categories);
    }

    // Public

    get snapshot1() { return this._snapshot1; }
    get snapshot2() { return this._snapshot2; }
    get totalSize() { return this._totalSize; }
    get totalObjectCount() { return this._totalObjectCount; }
    get categories() { return this._categories; }
    get invalid() { return this._snapshot1.invalid || this._snapshot2.invalid; }

    updateForCollectionEvent(event)
    {
        console.assert(!this.invalid);
        if (!event.data.affectedSnapshots.includes(this._snapshot2._identifier))
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
};
