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

WI.ResourceTimingData = class ResourceTimingData
{
    constructor(resource, data)
    {
        data = data || {};

        console.assert(isNaN(data.startTime) || data.startTime <= data.fetchStart);
        console.assert(isNaN(data.redirectStart) === isNaN(data.redirectEnd));
        console.assert(isNaN(data.domainLookupStart) === isNaN(data.domainLookupEnd));
        console.assert(isNaN(data.connectStart) === isNaN(data.connectEnd));

        this._resource = resource;

        this._startTime = data.startTime || NaN;
        this._redirectStart = data.redirectStart || NaN;
        this._redirectEnd = data.redirectEnd || NaN;
        this._fetchStart = data.fetchStart || NaN;
        this._domainLookupStart = data.domainLookupStart || NaN;
        this._domainLookupEnd = data.domainLookupEnd || NaN;
        this._connectStart = data.connectStart || NaN;
        this._connectEnd = data.connectEnd || NaN;
        this._secureConnectionStart = data.secureConnectionStart || NaN;
        this._requestStart = data.requestStart || NaN;
        this._responseStart = data.responseStart || NaN;
        this._responseEnd = data.responseEnd || NaN;

        if (this._domainLookupStart >= this._domainLookupEnd)
            this._domainLookupStart = this._domainLookupEnd = NaN;

        if (this._connectStart >= this._connectEnd)
            this._connectStart = this._connectEnd = NaN;
    }

    // Static

    static fromPayload(payload, resource)
    {
        payload = payload || {};

        // COMPATIBILITY (iOS 12.0): Resource Timing data was based on startTime, not fetchStart.
        let startTime = payload.startTime;
        let fetchStart = payload.fetchStart;
        let redirectStart = payload.redirectStart;
        let redirectEnd = payload.redirectEnd;

        if (isNaN(fetchStart) || fetchStart < startTime)
            fetchStart = startTime;

        if (redirectStart < startTime || redirectStart > fetchStart || redirectStart > redirectEnd)
            redirectStart = NaN;

        if (redirectEnd < startTime || redirectEnd > fetchStart || redirectEnd < redirectStart)
            redirectEnd = NaN;

        function offsetToTimestamp(offset) {
            return offset > 0 ? fetchStart + (offset / 1000) : NaN;
        }

        let data = {
            startTime,
            redirectStart,
            redirectEnd,
            fetchStart,
            domainLookupStart: offsetToTimestamp(payload.domainLookupStart),
            domainLookupEnd: offsetToTimestamp(payload.domainLookupEnd),
            connectStart: offsetToTimestamp(payload.connectStart),
            connectEnd: offsetToTimestamp(payload.connectEnd),
            secureConnectionStart: offsetToTimestamp(payload.secureConnectionStart),
            requestStart: offsetToTimestamp(payload.requestStart),
            responseStart: offsetToTimestamp(payload.responseStart),
            responseEnd: offsetToTimestamp(payload.responseEnd)
        };

        return new WI.ResourceTimingData(resource, data);
    }

    // Public

    get startTime() { return this._startTime || this._resource.requestSentTimestamp; }
    get redirectStart() { return this._redirectStart; }
    get redirectEnd() { return this._redirectEnd; }
    get fetchStart() { return this._fetchStart || this._resource.requestSentTimestamp; }
    get domainLookupStart() { return this._domainLookupStart; }
    get domainLookupEnd() { return this._domainLookupEnd; }
    get connectStart() { return this._connectStart; }
    get connectEnd() { return this._connectEnd; }
    get secureConnectionStart() { return this._secureConnectionStart; }
    get requestStart() { return this._requestStart || this._startTime || this._resource.requestSentTimestamp; }
    get responseStart() { return this._responseStart || this._startTime || this._resource.responseReceivedTimestamp || this._resource.finishedOrFailedTimestamp; }
    get responseEnd() { return this._responseEnd || this._resource.finishedOrFailedTimestamp; }

    markResponseEndTime(responseEnd)
    {
        console.assert(typeof responseEnd === "number");
        console.assert(isNaN(responseEnd) || responseEnd >= this.startTime, "responseEnd time should be greater than the start time", this.startTime, responseEnd);
        console.assert(isNaN(responseEnd) || responseEnd >= this.requestStart, "responseEnd time should be greater than the request time", this.requestStart, responseEnd);
        this._responseEnd = responseEnd;
    }
};
