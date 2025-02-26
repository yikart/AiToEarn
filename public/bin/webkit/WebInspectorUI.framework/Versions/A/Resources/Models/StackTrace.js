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

WI.StackTrace = class StackTrace
{
    constructor(callFrames, {topCallFrameIsBoundary, truncated, parentStackTrace} = {})
    {
        console.assert(callFrames.every((callFrame) => callFrame instanceof WI.CallFrame), callFrames);
        console.assert(!parentStackTrace || parentStackTrace instanceof WI.StackTrace, parentStackTrace);

        this._callFrames = callFrames;
        this._topCallFrameIsBoundary = topCallFrameIsBoundary || false;
        this._truncated = truncated || false;
        this._parentStackTrace = parentStackTrace || null;
    }

    // Static

    static fromPayload(target, payload)
    {
        let result = null;
        let previousStackTrace = null;

        while (payload) {
            let callFrames = payload.callFrames.map((x) => WI.CallFrame.fromPayload(target, x));
            let stackTrace = new WI.StackTrace(callFrames, {
                topCallFrameIsBoundary: payload.topCallFrameIsBoundary,
                truncated: payload.truncated,
            });
            if (!result)
                result = stackTrace;
            if (previousStackTrace)
                previousStackTrace._parentStackTrace = stackTrace;

            previousStackTrace = stackTrace;
            payload = payload.parentStackTrace;
        }

        return result;
    }

    static fromString(target, stack)
    {
        let callFrames = WI.StackTrace._parseStackTrace(stack);
        return WI.StackTrace.fromPayload(target, {callFrames});
    }

    // May produce false negatives; must not produce any false positives.
    // It may return false on a valid stack trace, but it will never return true on an invalid stack trace.
    static isLikelyStackTrace(stack)
    {
        // This function runs for every logged string. It penalizes the performance.
        // As most logged strings are not stack traces, exit as early as possible.
        const smallestPossibleStackTraceLength = "http://a.bc/:9:1".length;
        if (stack.length < smallestPossibleStackTraceLength.length * 2)
            return false;

        const approximateStackLengthOf50Items = 5000;
        if (stack.length > approximateStackLengthOf50Items)
            return false;

        if (/^[^a-z$_@]/i.test(stack[0]))
            return false;

        if (!WI.StackTrace._likelyStackTraceRegex) {
            const reasonablyLongProtocolLength = 10;
            const reasonablyLongLineLength = 500;
            const reasonablyLongNativeMethodLength = 120;
            const stackTraceLine = `(global code|eval code|module code|\\w+)?([^:]{1,${reasonablyLongProtocolLength}}://[^:]{1,${reasonablyLongLineLength}}:\\d+:\\d+|[^@]{1,${reasonablyLongNativeMethodLength}}@\\[native code\\])`;
            WI.StackTrace._likelyStackTraceRegex = new RegExp(`^${stackTraceLine}([\\n\\r]${stackTraceLine})+$`);
        }

        WI.StackTrace._likelyStackTraceRegex.lastIndex = 0;
        return WI.StackTrace._likelyStackTraceRegex.test(stack);
    }

    static _parseStackTrace(stack)
    {
        var lines = stack.split(/\n/g);
        var result = [];

        for (var line of lines) {
            var functionName = "";
            var url = "";
            var lineNumber = 0;
            var columnNumber = 0;
            var atIndex = line.indexOf("@");

            if (atIndex !== -1) {
                functionName = line.slice(0, atIndex);
                ({url, lineNumber, columnNumber} = WI.StackTrace._parseLocation(line.slice(atIndex + 1)));
            } else if (line.includes("/"))
                ({url, lineNumber, columnNumber} = WI.StackTrace._parseLocation(line));
            else
                functionName = line;

            result.push({functionName, url, lineNumber, columnNumber});
        }

        return result;
    }

    static _parseLocation(locationString)
    {
        var result = {url: "", lineNumber: 0, columnNumber: 0};
        var locationRegEx = /(.+?)(?::(\d+)(?::(\d+))?)?$/;
        var matched = locationString.match(locationRegEx);

        if (!matched)
            return result;

        result.url = matched[1];

        if (matched[2])
            result.lineNumber = parseInt(matched[2]);

        if (matched[3])
            result.columnNumber = parseInt(matched[3]);

        return result;
    }

    // Public

    get callFrames() { return this._callFrames; }
    get topCallFrameIsBoundary() { return this._topCallFrameIsBoundary; }
    get truncated() { return this._truncated; }
    get parentStackTrace() { return this._parentStackTrace; }

    get firstNonNativeNonAnonymousNotBlackboxedCallFrame()
    {
        let firstNonNativeNonAnonymousCallFrame = null;

        for (let frame of this._callFrames) {
            if (frame.nativeCode)
                continue;

            if (frame.sourceCodeLocation) {
                let sourceCode = frame.sourceCodeLocation.sourceCode;
                if (sourceCode instanceof WI.Script && sourceCode.anonymous)
                    continue;

                // Save the first non-native non-anonymous call frame so it can be used as a
                // fallback if all remaining call frames are blackboxed.
                firstNonNativeNonAnonymousCallFrame ??= frame;
            }

            if (frame.blackboxed)
                continue;

            return frame;
        }

        return firstNonNativeNonAnonymousCallFrame;
    }
};
