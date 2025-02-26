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

// Directed edge between two HeapSnapshotNodes 'from' and 'to'.

WI.HeapSnapshotEdgeProxy = class HeapSnapshotEdgeProxy
{
    constructor(objectId, fromIdentifier, toIdentifier, type, data)
    {
        this._proxyObjectId = objectId;

        console.assert(type in WI.HeapSnapshotEdgeProxy.EdgeType);

        this.fromIdentifier = fromIdentifier;
        this.toIdentifier = toIdentifier;
        this.type = type;
        this.data = data;

        this.from = null;
        this.to = null;
    }

    isPrivateSymbol()
    {
        if (WI.settings.engineeringShowPrivateSymbolsInHeapSnapshot.value)
            return false;

        return typeof this.data === "string" && this.data.startsWith("PrivateSymbol");
    }

    // Static

    static deserialize(objectId, serializedEdge)
    {
        let {from, to, type, data} = serializedEdge;
        return new WI.HeapSnapshotEdgeProxy(objectId, from, to, type, data);
    }
};

WI.HeapSnapshotEdgeProxy.EdgeType = {
    Internal: "Internal",       // No data.
    Property: "Property",       // data is string property name.
    Index: "Index",             // data is numeric index.
    Variable: "Variable",       // data is string variable name.
};
