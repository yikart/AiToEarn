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

WI.MemoryTimelineRecord = class MemoryTimelineRecord extends WI.TimelineRecord
{
    constructor(timestamp, categories)
    {
        super(WI.TimelineRecord.Type.Memory, timestamp - MemoryTimelineRecord.samplingRatePerSecond, timestamp);

        console.assert(typeof timestamp === "number");
        console.assert(categories instanceof Array);

        this._timestamp = timestamp;
        this._categories = WI.MemoryTimelineRecord.memoryCategoriesFromProtocol(categories);
        this._exportCategories = categories;

        this._totalSize = 0;
        for (let {size} of categories)
            this._totalSize += size;
    }

    // Static

    static get samplingRatePerSecond()
    {
        // 500ms. This matches the ResourceUsageThread sampling frequency in the backend.
        return 0.5;
    }

    static memoryCategoriesFromProtocol(categories)
    {
        let javascriptSize = 0;
        let imagesSize = 0;
        let layersSize = 0;
        let pageSize = 0;

        for (let {type, size} of categories) {
            switch (type) {
            case InspectorBackend.Enum.Memory.CategoryDataType.JavaScript:
            case InspectorBackend.Enum.Memory.CategoryDataType.JIT:
                javascriptSize += size;
                break;
            case InspectorBackend.Enum.Memory.CategoryDataType.Images:
                imagesSize += size;
                break;
            case InspectorBackend.Enum.Memory.CategoryDataType.Layers:
                layersSize += size;
                break;
            case InspectorBackend.Enum.Memory.CategoryDataType.Page:
            case InspectorBackend.Enum.Memory.CategoryDataType.Other:
                pageSize += size;
                break;
            default:
                console.warn("Unhandled Memory.CategoryDataType: " + type);
                break;
            }
        }

        let memoryCategories = [];
        if (javascriptSize)
            memoryCategories.push({type: WI.MemoryCategory.Type.JavaScript, size: javascriptSize});
        if (imagesSize)
            memoryCategories.push({type: WI.MemoryCategory.Type.Images, size: imagesSize});
        if (layersSize)
            memoryCategories.push({type: WI.MemoryCategory.Type.Layers, size: layersSize});
        if (pageSize)
            memoryCategories.push({type: WI.MemoryCategory.Type.Page, size: pageSize});
        return memoryCategories;
    }

    // Import / Export

    static async fromJSON(json)
    {
        let {timestamp, categories} = json;
        return new WI.MemoryTimelineRecord(timestamp, categories);
    }

    toJSON()
    {
        return {
            type: this.type,
            timestamp: this.startTime,
            categories: this._exportCategories,
        };
    }

    // Public

    get timestamp() { return this._timestamp; }
    get categories() { return this._categories; }
    get totalSize() { return this._totalSize; }

    get unadjustedStartTime() { return this._timestamp; }

    adjustStartTime(startTime)
    {
        console.assert(startTime < this._endTime);
        this._startTime = startTime;
    }
};
