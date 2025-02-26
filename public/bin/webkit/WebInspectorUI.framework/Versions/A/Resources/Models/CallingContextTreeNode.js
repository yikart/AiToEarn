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

WI.CallingContextTreeNode = class CallingContextTreeNode
{
    constructor(sourceID, line, column, name, url, hash)
    {
        this._children = {};
        this._sourceID = sourceID;
        this._line = line;
        this._column = column;
        this._name = name;
        this._url = url;
        this._uid = WI.CallingContextTreeNode.__uid++;

        this._timestamps = [];
        this._durations = [];
        this._leafTimestamps = [];
        this._leafDurations = [];
        this._expressionLocations = {}; // Keys are "line:column" strings. Values are arrays of timestamps in sorted order.

        this._hash = hash || WI.CallingContextTreeNode._hash(this);
    }

    // Static and Private

    static _hash(stackFrame)
    {
        return stackFrame.name + ":" + stackFrame.sourceID + ":" + stackFrame.line + ":" + stackFrame.column;
    }

    // Public

    get sourceID() { return this._sourceID; }
    get line() { return this._line; }
    get column() { return this._column; }
    get name() { return this._name; }
    get uid() { return this._uid; }
    get url() { return this._url; }
    get hash() { return this._hash; }

    hasChildrenInTimeRange(startTime, endTime)
    {
        for (let propertyName of Object.getOwnPropertyNames(this._children)) {
            let child = this._children[propertyName];
            if (child.hasStackTraceInTimeRange(startTime, endTime))
                return true;
        }
        return false;
    }

    hasStackTraceInTimeRange(startTime, endTime)
    {
        console.assert(startTime <= endTime);
        if (startTime > endTime)
            return false;

        let timestamps = this._timestamps;
        let length = timestamps.length;
        if (!length)
            return false;

        let index = timestamps.lowerBound(startTime);
        if (index === length)
            return false;
        console.assert(startTime <= timestamps[index]);

        let hasTimestampInRange = timestamps[index] <= endTime;
        return hasTimestampInRange;
    }

    filteredTimestampsAndDuration(startTime, endTime)
    {
        let lowerIndex = this._timestamps.lowerBound(startTime);
        let upperIndex = this._timestamps.upperBound(endTime);

        let totalDuration = 0;
        for (let i = lowerIndex; i < upperIndex; ++i)
            totalDuration += this._durations[i];

        return {
            timestamps: this._timestamps.slice(lowerIndex, upperIndex),
            duration: totalDuration,
        };
    }

    filteredLeafTimestampsAndDuration(startTime, endTime)
    {
        let lowerIndex = this._leafTimestamps.lowerBound(startTime);
        let upperIndex = this._leafTimestamps.upperBound(endTime);

        let totalDuration = 0;
        for (let i = lowerIndex; i < upperIndex; ++i)
            totalDuration += this._leafDurations[i];

        return {
            leafTimestamps: this._leafTimestamps.slice(lowerIndex, upperIndex),
            leafDuration: totalDuration,
        };
    }

    hasChildren()
    {
        return !isEmptyObject(this._children);
    }

    findOrMakeChild(stackFrame)
    {
        let hash = WI.CallingContextTreeNode._hash(stackFrame);
        let node = this._children[hash];
        if (node)
            return node;
        node = new WI.CallingContextTreeNode(stackFrame.sourceID, stackFrame.line, stackFrame.column, stackFrame.name, stackFrame.url, hash);
        this._children[hash] = node;
        return node;
    }

    addTimestampAndExpressionLocation(timestamp, duration, expressionLocation, leaf)
    {
        console.assert(!this._timestamps.length || this._timestamps.lastValue <= timestamp, "Expected timestamps to be added in sorted, increasing, order.");
        this._timestamps.push(timestamp);
        this._durations.push(duration);

        if (leaf) {
            this._leafTimestamps.push(timestamp);
            this._leafDurations.push(duration);
        }

        if (!expressionLocation)
            return;

        let {line, column} = expressionLocation;
        let hashCons = line + ":" + column;
        let timestamps = this._expressionLocations[hashCons];
        if (!timestamps) {
            timestamps = [];
            this._expressionLocations[hashCons] = timestamps;
        }
        console.assert(!timestamps.length || timestamps.lastValue <= timestamp, "Expected timestamps to be added in sorted, increasing, order.");
        timestamps.push(timestamp);
    }

    forEachChild(callback)
    {
        for (let propertyName of Object.getOwnPropertyNames(this._children))
            callback(this._children[propertyName]);
    }

    forEachNode(callback)
    {
        callback(this);
        this.forEachChild(function(child) {
            child.forEachNode(callback);
        });
    }

    equals(other)
    {
        return this._hash === other.hash;
    }

    toCPUProfileNode(numSamples, startTime, endTime)
    {
        let children = [];
        this.forEachChild((child) => {
            if (child.hasStackTraceInTimeRange(startTime, endTime))
                children.push(child.toCPUProfileNode(numSamples, startTime, endTime));
        });
        let cpuProfileNode = {
            id: this._uid,
            functionName: this._name,
            url: this._url,
            lineNumber: this._line,
            columnNumber: this._column,
            children: children
        };

        let timestamps = [];
        let frameStartTime = Number.MAX_VALUE;
        let frameEndTime = Number.MIN_VALUE;
        for (let i = 0; i < this._timestamps.length; i++) {
            let timestamp = this._timestamps[i];
            if (startTime <= timestamp && timestamp <= endTime) {
                timestamps.push(timestamp);
                frameStartTime = Math.min(frameStartTime, timestamp);
                frameEndTime = Math.max(frameEndTime, timestamp);
            }
        }

        cpuProfileNode.callInfo = {
            callCount: timestamps.length, // Totally not callCount, but oh well, this makes life easier because of field names.
            startTime: frameStartTime,
            endTime: frameEndTime,
            totalTime: (timestamps.length / numSamples) * (endTime - startTime)
        };

        return cpuProfileNode;
    }

    // Testing.

    __test_buildLeafLinkedLists(parent, result)
    {
        let linkedListNode = {
            name: this._name,
            url: this._url,
            parent: parent
        };
        if (this.hasChildren()) {
            this.forEachChild((child) => {
                child.__test_buildLeafLinkedLists(linkedListNode, result);
            });
        } else {
            // We're a leaf.
            result.push(linkedListNode);
        }
    }
};

WI.CallingContextTreeNode.__uid = 0;
