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

WI.HeapAllocationsTimelineRecord = class HeapAllocationsTimelineRecord extends WI.TimelineRecord
{
    constructor(timestamp, heapSnapshot)
    {
        super(WI.TimelineRecord.Type.HeapAllocations, timestamp, timestamp);

        console.assert(typeof timestamp === "number");
        console.assert(heapSnapshot instanceof WI.HeapSnapshotProxy);

        this._timestamp = timestamp;
        this._heapSnapshot = heapSnapshot;
    }

    // Import / Export

    static async fromJSON(json)
    {
        // NOTE: This just goes through and generates a new heap snapshot,
        // it is not perfect but does what we want. It asynchronously creates
        // a heap snapshot at the right time, and insert it into the active
        // recording, which on an import should be the newly imported recording.
        let {timestamp, title, snapshotStringData} = json;

        return await new Promise((resolve, reject) => {
            let workerProxy = WI.HeapSnapshotWorkerProxy.singleton();
            workerProxy.createImportedSnapshot(snapshotStringData, title, ({objectId, snapshot: serializedSnapshot}) => {
                let snapshot = WI.HeapSnapshotProxy.deserialize(objectId, serializedSnapshot);
                snapshot.snapshotStringData = snapshotStringData;
                resolve(new WI.HeapAllocationsTimelineRecord(timestamp, snapshot));
            });
        });
    }

    toJSON()
    {
        return {
            type: this.type,
            timestamp: this._timestamp,
            title: WI.TimelineTabContentView.displayNameForRecord(this),
            snapshotStringData: this._heapSnapshot.snapshotStringData,
        };
    }

    // Public

    get timestamp() { return this._timestamp; }
    get heapSnapshot() { return this._heapSnapshot; }
};
