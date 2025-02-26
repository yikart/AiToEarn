/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
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

WI.GarbageCollection = class GarbageCollection
{
    constructor(type, startTime, endTime)
    {
        console.assert(endTime >= startTime);

        this._type = type;
        this._startTime = startTime;
        this._endTime = endTime;
    }

    // Static

    static fromPayload(payload)
    {
        let type = WI.GarbageCollection.Type.Full;
        if (payload.type === InspectorBackend.Enum.Heap.GarbageCollectionType.Partial)
            type = WI.GarbageCollection.Type.Partial;

        return new WI.GarbageCollection(type, payload.startTime, payload.endTime);
    }

    // Import / Export

    static fromJSON(json)
    {
        let {type, startTime, endTime} = json;
        return new WI.GarbageCollection(type, startTime, endTime);
    }

    toJSON()
    {
        return {
            __type: "GarbageCollection",
            type: this.type,
            startTime: this.startTime,
            endTime: this.endTime,
        };
    }

    // Public

    get type() { return this._type; }
    get startTime() { return this._startTime; }
    get endTime() { return this._endTime; }

    get duration()
    {
        return this._endTime - this._startTime;
    }
};

WI.GarbageCollection.Type = {
    Partial: "partial",
    Full: "full",
};
