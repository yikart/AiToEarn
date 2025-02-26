/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
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

WI.ResourceTimelineRecord = class ResourceTimelineRecord extends WI.TimelineRecord
{
    constructor(resource)
    {
        super(WI.TimelineRecord.Type.Network);

        this._resource = resource;
        this._resource.addEventListener(WI.Resource.Event.TimestampsDidChange, this._dispatchUpdatedEvent, this);
    }

    // Import / Export

    static async fromJSON(json)
    {
        let {entry, archiveStartTime} = json;
        let localResource = WI.LocalResource.fromHAREntry(entry, archiveStartTime);
        return new WI.ResourceTimelineRecord(localResource);
    }

    toJSON()
    {
        const content = "";

        return {
            type: this.type,
            archiveStartTime: this._resource.requestSentWalltime - this.startTime,
            entry: WI.HARBuilder.entry(this._resource, content),
        };
    }

    // Public

    get resource()
    {
        return this._resource;
    }

    get updatesDynamically()
    {
        return true;
    }

    get usesActiveStartTime()
    {
        return true;
    }

    get startTime()
    {
        return this._resource.timingData.startTime;
    }

    get activeStartTime()
    {
        return this._resource.timingData.responseStart;
    }

    get endTime()
    {
        return this._resource.timingData.responseEnd;
    }

    // Private

    _dispatchUpdatedEvent()
    {
        this.dispatchEventToListeners(WI.TimelineRecord.Event.Updated);
    }
};
