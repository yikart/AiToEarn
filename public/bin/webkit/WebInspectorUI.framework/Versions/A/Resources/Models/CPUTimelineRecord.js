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

WI.CPUTimelineRecord = class CPUTimelineRecord extends WI.TimelineRecord
{
    constructor({timestamp, usage, threads})
    {
        super(WI.TimelineRecord.Type.CPU, timestamp - CPUTimelineRecord.samplingRatePerSecond, timestamp);

        console.assert(typeof timestamp === "number");
        console.assert(typeof usage === "number");
        console.assert(usage >= 0);
        console.assert(threads === undefined || Array.isArray(threads));

        this._timestamp = timestamp;
        this._usage = usage;
        this._threads = threads || [];

        this._mainThreadUsage = 0;
        this._webkitThreadUsage = 0;
        this._workerThreadUsage = 0;
        this._unknownThreadUsage = 0;
        this._workersData = null;

        for (let thread of this._threads) {
            if (thread.type === InspectorBackend.Enum.CPUProfiler.ThreadInfoType.Main) {
                console.assert(!this._mainThreadUsage, "There should only be one main thread.");
                this._mainThreadUsage += thread.usage;
                continue;
            }

            if (thread.type === InspectorBackend.Enum.CPUProfiler.ThreadInfoType.WebKit) {
                if (thread.targetId) {
                    if (!this._workersData)
                        this._workersData = [];
                    this._workersData.push(thread);
                    this._workerThreadUsage += thread.usage;
                    continue;
                }

                this._webkitThreadUsage += thread.usage;
                continue;
            }

            this._unknownThreadUsage += thread.usage;
        }
    }

    // Static

    static get samplingRatePerSecond()
    {
        // 500ms. This matches the ResourceUsageThread sampling frequency in the backend.
        return 0.5;
    }

    // Import / Export

    static async fromJSON(json)
    {
        return new WI.CPUTimelineRecord(json);
    }

    toJSON()
    {
        return {
            type: this.type,
            timestamp: this._timestamp,
            usage: this._usage,
            threads: this._threads,
        };
    }

    // Public

    get timestamp() { return this._timestamp; }
    get usage() { return this._usage; }

    get unadjustedStartTime() { return this._timestamp; }

    get mainThreadUsage() { return this._mainThreadUsage; }
    get webkitThreadUsage() { return this._webkitThreadUsage; }
    get workerThreadUsage() { return this._workerThreadUsage; }
    get unknownThreadUsage() { return this._unknownThreadUsage; }
    get workersData() { return this._workersData; }

    adjustStartTime(startTime)
    {
        console.assert(startTime < this._endTime);
        this._startTime = startTime;
    }
};
