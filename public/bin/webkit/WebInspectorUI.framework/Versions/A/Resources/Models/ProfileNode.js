/*
 * Copyright (C) 2014 Apple Inc. All rights reserved.
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

WI.ProfileNode = class ProfileNode
{
    constructor(id, type, functionName, sourceCodeLocation, callInfo, childNodes)
    {
        childNodes = childNodes || [];

        console.assert(id);
        console.assert(callInfo && !isEmptyObject(callInfo));
        console.assert(childNodes instanceof Array);
        console.assert(childNodes.every((node) => node instanceof WI.ProfileNode));

        this._id = id;
        this._type = type || WI.ProfileNode.Type.Function;
        this._functionName = functionName || null;
        this._sourceCodeLocation = sourceCodeLocation || null;
        this._callInfo = callInfo;
        this._childNodes = childNodes;
        this._parentNode = null;
        this._previousSibling = null;
        this._nextSibling = null;
        this._computedTotalTimes = false;

        this._startTime = this._callInfo.startTime;
        this._endTime = this._callInfo.endTime;
        this._totalTime = this._callInfo.totalTime;
        this._callCount = this._callInfo.callCount;

        for (var i = 0; i < this._childNodes.length; ++i)
            this._childNodes[i].establishRelationships(this, this._childNodes[i - 1], this._childNodes[i + 1]);
    }

    // Public

    get id() { return this._id; }
    get type() { return this._type; }
    get functionName() { return this._functionName; }
    get sourceCodeLocation() { return this._sourceCodeLocation; }
    get callInfo() { return this._callInfo; }
    get previousSibling() { return this._previousSibling; }
    get nextSibling() { return this._nextSibling; }
    get parentNode() { return this._parentNode; }
    get childNodes() { return this._childNodes; }
    get startTime() { return this._startTime; }
    get endTime() { return this._endTime; }

    get selfTime()
    {
        this._computeTotalTimesIfNeeded();
        return this._selfTime;
    }

    get totalTime()
    {
        this._computeTotalTimesIfNeeded();
        return this._totalTime;
    }

    computeCallInfoForTimeRange(rangeStartTime, rangeEndTime)
    {
        console.assert(typeof rangeStartTime === "number");
        console.assert(typeof rangeEndTime === "number");

        // With aggregate call info we can't accurately partition self/total/average time
        // in partial ranges because we don't know exactly when each call started. So we
        // always return the entire range.
        if (this._selfTime === undefined) {
            var childNodesTotalTime = 0;
            for (var childNode of this._childNodes)
                childNodesTotalTime += childNode.totalTime;
            this._selfTime = this._totalTime - childNodesTotalTime;
            // selfTime can negative or very close to zero due to floating point error.
            // Since we show at most four decimal places, treat anything less as zero.
            if (this._selfTime < 0.0001)
                this._selfTime = 0.0;
        }

        return {
            callCount: this._callCount,
            startTime: this._startTime,
            endTime: this._endTime,
            selfTime: this._selfTime,
            totalTime: this._totalTime,
            averageTime: this._selfTime / this._callCount,
        };
    }

    traverseNextProfileNode(stayWithin)
    {
        var profileNode = this._childNodes[0];
        if (profileNode)
            return profileNode;

        if (this === stayWithin)
            return null;

        profileNode = this._nextSibling;
        if (profileNode)
            return profileNode;

        profileNode = this;
        while (profileNode && !profileNode.nextSibling && profileNode.parentNode !== stayWithin)
            profileNode = profileNode.parentNode;

        if (!profileNode)
            return null;

        return profileNode.nextSibling;
    }

    saveIdentityToCookie(cookie)
    {
        cookie[WI.ProfileNode.TypeCookieKey] = this._type || null;
        cookie[WI.ProfileNode.FunctionNameCookieKey] = this._functionName || null;
        cookie[WI.ProfileNode.SourceCodeURLCookieKey] = this._sourceCodeLocation ? this._sourceCodeLocation.sourceCode.url ? this._sourceCodeLocation.sourceCode.url.hash : null : null;
        cookie[WI.ProfileNode.SourceCodeLocationLineCookieKey] = this._sourceCodeLocation ? this._sourceCodeLocation.lineNumber : null;
        cookie[WI.ProfileNode.SourceCodeLocationColumnCookieKey] = this._sourceCodeLocation ? this._sourceCodeLocation.columnNumber : null;
    }

    // Protected

    establishRelationships(parentNode, previousSibling, nextSibling)
    {
        this._parentNode = parentNode || null;
        this._previousSibling = previousSibling || null;
        this._nextSibling = nextSibling || null;
    }

    // Private

    _computeTotalTimesIfNeeded()
    {
        if (this._computedTotalTimes)
            return;

        this._computedTotalTimes = true;

        var info = this.computeCallInfoForTimeRange(0, Infinity);
        this._startTime = info.startTime;
        this._endTime = info.endTime;
        this._selfTime = info.selfTime;
        this._totalTime = info.totalTime;
    }
};

WI.ProfileNode.Type = {
    Function: "profile-node-type-function",
    Program: "profile-node-type-program"
};

WI.ProfileNode.TypeIdentifier = "profile-node";
WI.ProfileNode.TypeCookieKey = "profile-node-type";
WI.ProfileNode.FunctionNameCookieKey = "profile-node-function-name";
WI.ProfileNode.SourceCodeURLCookieKey = "profile-node-source-code-url";
WI.ProfileNode.SourceCodeLocationLineCookieKey = "profile-node-source-code-location-line";
WI.ProfileNode.SourceCodeLocationColumnCookieKey = "profile-node-source-code-location-column";
