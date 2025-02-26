/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

WI.MediaTimeline = class MediaTimeline extends WI.Timeline
{
    // Public

    recordForTrackingAnimationId(trackingAnimationId)
    {
        return this._trackingAnimationIdRecordMap.get(trackingAnimationId) || null;
    }

    recordForMediaElementEvents(domNode)
    {
        console.assert(domNode.isMediaElement());
        return this._mediaElementRecordMap.get(domNode) || null;
    }

    reset(suppressEvents)
    {
        this._trackingAnimationIdRecordMap = new Map;
        this._mediaElementRecordMap = new Map;

        super.reset(suppressEvents);
    }

    addRecord(record, options = {})
    {
        console.assert(record instanceof WI.MediaTimelineRecord);

        if (record.trackingAnimationId) {
            console.assert(!this._trackingAnimationIdRecordMap.has(record.trackingAnimationId));
            this._trackingAnimationIdRecordMap.set(record.trackingAnimationId, record);
        }

        if (record.eventType === WI.MediaTimelineRecord.EventType.MediaElement) {
            console.assert(!(record.domNode instanceof WI.DOMNode) || record.domNode.isMediaElement());
            console.assert(!this._mediaElementRecordMap.has(record.domNode));
            this._mediaElementRecordMap.set(record.domNode, record);
        }

        super.addRecord(record, options);
    }
};
