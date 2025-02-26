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

WI.CallingContextTree = class CallingContextTree
{
    constructor(type)
    {
        this._type = type || WI.CallingContextTree.Type.TopDown;

        this.reset();
    }

    // Public

    get type() { return this._type; }
    get totalNumberOfSamples() { return this._totalNumberOfSamples; }

    reset()
    {
        this._root = new WI.CallingContextTreeNode(-1, -1, -1, "<root>", null);
        this._totalNumberOfSamples = 0;
    }

    totalDurationInTimeRange(startTime, endTime)
    {
        return this._root.filteredTimestampsAndDuration(startTime, endTime).duration;
    }

    updateTreeWithStackTrace({timestamp, stackFrames}, duration)
    {
        this._totalNumberOfSamples++;

        let node = this._root;
        node.addTimestampAndExpressionLocation(timestamp, duration, null);

        switch (this._type) {
        case WI.CallingContextTree.Type.TopDown:
            for (let i = stackFrames.length; i--; ) {
                let stackFrame = stackFrames[i];
                node = node.findOrMakeChild(stackFrame);
                node.addTimestampAndExpressionLocation(timestamp, duration, stackFrame.expressionLocation || null, i === 0);
            }
            break;
        case WI.CallingContextTree.Type.BottomUp:
            for (let i = 0; i < stackFrames.length; ++i) {
                let stackFrame = stackFrames[i];
                node = node.findOrMakeChild(stackFrame);
                node.addTimestampAndExpressionLocation(timestamp, duration, stackFrame.expressionLocation || null, i === 0);
            }
            break;
        case WI.CallingContextTree.Type.TopFunctionsTopDown:
            for (let i = stackFrames.length; i--; ) {
                node = this._root;
                for (let j = i + 1; j--; ) {
                    let stackFrame = stackFrames[j];
                    node = node.findOrMakeChild(stackFrame);
                    node.addTimestampAndExpressionLocation(timestamp, duration, stackFrame.expressionLocation || null, j === 0);
                }
            }
            break;
        case WI.CallingContextTree.Type.TopFunctionsBottomUp:
            for (let i = 0; i < stackFrames.length; i++) {
                node = this._root;
                for (let j = i; j < stackFrames.length; j++) {
                    let stackFrame = stackFrames[j];
                    node = node.findOrMakeChild(stackFrame);
                    node.addTimestampAndExpressionLocation(timestamp, duration, stackFrame.expressionLocation || null, j === 0);
                }
            }
            break;
        default:
            console.assert(false, "This should not be reached.");
            break;
        }
    }

    toCPUProfilePayload(startTime, endTime)
    {
        let cpuProfile = {};
        let roots = [];
        let numSamplesInTimeRange = this._root.filteredTimestampsAndDuration(startTime, endTime).timestamps.length;

        this._root.forEachChild((child) => {
            if (child.hasStackTraceInTimeRange(startTime, endTime))
                roots.push(child.toCPUProfileNode(numSamplesInTimeRange, startTime, endTime));
        });

        cpuProfile.rootNodes = roots;
        return cpuProfile;
    }

    forEachChild(callback)
    {
        this._root.forEachChild(callback);
    }

    forEachNode(callback)
    {
        this._root.forEachNode(callback);
    }

    // Testing.

    static __test_makeTreeFromProtocolMessageObject(messageObject)
    {
        let tree = new WI.CallingContextTree;
        let stackTraces = messageObject.params.samples.stackTraces;
        for (let i = 0; i < stackTraces.length; i++)
            tree.updateTreeWithStackTrace(stackTraces[i]);
        return tree;
    }

    __test_matchesStackTrace(stackTrace)
    {
        // StackTrace should have top frame first in the array and bottom frame last.
        // We don't look for a match that traces down the tree from the root; instead,
        // we match by looking at all the leafs, and matching while walking up the tree
        // towards the root. If we successfully make the walk, we've got a match that
        // suffices for a particular test. A successful match doesn't mean we actually
        // walk all the way up to the root; it just means we didn't fail while walking
        // in the direction of the root.
        let leaves = this.__test_buildLeafLinkedLists();

        outer:
        for (let node of leaves) {
            for (let stackNode of stackTrace) {
                for (let propertyName of Object.getOwnPropertyNames(stackNode)) {
                    if (stackNode[propertyName] !== node[propertyName])
                        continue outer;
                }
                node = node.parent;
            }
            return true;
        }
        return false;
    }

    __test_buildLeafLinkedLists()
    {
        let result = [];
        let parent = null;
        this._root.__test_buildLeafLinkedLists(parent, result);
        return result;
    }
};

WI.CallingContextTree.Type = {
    TopDown: Symbol("TopDown"),
    BottomUp: Symbol("BottomUp"),
    TopFunctionsTopDown: Symbol("TopFunctionsTopDown"),
    TopFunctionsBottomUp: Symbol("TopFunctionsBottomUp"),
};
