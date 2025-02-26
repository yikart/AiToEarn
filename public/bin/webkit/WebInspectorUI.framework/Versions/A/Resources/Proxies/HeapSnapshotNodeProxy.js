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

WI.HeapSnapshotNodeProxy = class HeapSnapshotNodeProxy
{
    constructor(snapshotObjectId, {id, className, size, retainedSize, internal, isObjectType, gcRoot, dead, dominatorNodeIdentifier, hasChildren})
    {
        this._proxyObjectId = snapshotObjectId;

        this.id = id;
        this.className = className;
        this.size = size;
        this.retainedSize = retainedSize;
        this.internal = internal;
        this.isObjectType = isObjectType;
        this.gcRoot = gcRoot;
        this.dead = dead;
        this.dominatorNodeIdentifier = dominatorNodeIdentifier;
        this.hasChildren = hasChildren;
    }

    // Static

    static deserialize(objectId, serializedNode)
    {
        return new WI.HeapSnapshotNodeProxy(objectId, serializedNode);
    }

    // Proxied

    shortestGCRootPath(callback)
    {
        WI.HeapSnapshotWorkerProxy.singleton().callMethod(this._proxyObjectId, "shortestGCRootPath", this.id, (serializedPath) => {
            let isNode = false;
            let path = serializedPath.map((component) => {
                isNode = !isNode;
                if (isNode)
                    return WI.HeapSnapshotNodeProxy.deserialize(this._proxyObjectId, component);
                return WI.HeapSnapshotEdgeProxy.deserialize(this._proxyObjectId, component);
            });

            for (let i = 1; i < path.length; i += 2) {
                console.assert(path[i] instanceof WI.HeapSnapshotEdgeProxy);
                let edge = path[i];
                edge.from = path[i - 1];
                edge.to = path[i + 1];
            }

            callback(path);
        });
    }

    dominatedNodes(callback)
    {
        WI.HeapSnapshotWorkerProxy.singleton().callMethod(this._proxyObjectId, "dominatedNodes", this.id, (serializedNodes) => {
            callback(serializedNodes.map(WI.HeapSnapshotNodeProxy.deserialize.bind(null, this._proxyObjectId)));
        });
    }

    retainedNodes(callback)
    {
        WI.HeapSnapshotWorkerProxy.singleton().callMethod(this._proxyObjectId, "retainedNodes", this.id, ({retainedNodes: serializedNodes, edges: serializedEdges}) => {
            let deserializedNodes = serializedNodes.map(WI.HeapSnapshotNodeProxy.deserialize.bind(null, this._proxyObjectId));
            let deserializedEdges = serializedEdges.map(WI.HeapSnapshotEdgeProxy.deserialize.bind(null, this._proxyObjectId));
            callback(deserializedNodes, deserializedEdges);
        });
    }

    retainers(callback)
    {
        WI.HeapSnapshotWorkerProxy.singleton().callMethod(this._proxyObjectId, "retainers", this.id, ({retainers: serializedNodes, edges: serializedEdges}) => {
            let deserializedNodes = serializedNodes.map(WI.HeapSnapshotNodeProxy.deserialize.bind(null, this._proxyObjectId));
            let deserializedEdges = serializedEdges.map(WI.HeapSnapshotEdgeProxy.deserialize.bind(null, this._proxyObjectId));
            callback(deserializedNodes, deserializedEdges);
        });
    }
};
