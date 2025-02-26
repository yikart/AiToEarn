/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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

WI.StackTraceTreeController = class StackTraceTreeController extends WI.Object
{
    constructor(treeOutline)
    {
        console.assert(treeOutline instanceof WI.TreeOutline);

        super();

        this._stackTrace = null;

        this._treeOutline = treeOutline;

        if (this._treeOutline.selectable)
            this._treeOutline.addEventListener(WI.TreeOutline.Event.SelectionDidChange, this._treeSelectionDidChange, this);
        else
            this._treeOutline.addEventListener(WI.TreeOutline.Event.ElementClicked, this._treeElementClicked, this);
    }

    // Static

    static groupBlackboxedStackTrace(parent, stackTrace, {rememberBlackboxedCallFrameGroupToAutoExpand} = {})
    {
        let parentIsNode = parent instanceof Node;
        console.assert(parentIsNode || parent instanceof WI.TreeOutline || parent instanceof WI.TreeElement, parent);
        console.assert(stackTrace instanceof WI.StackTrace, stackTrace);

        let CallFrameUIClass = parentIsNode ? WI.CallFrameView : WI.CallFrameTreeElement;

        let activeCallFrameTreeElement = WI.StackTraceTreeController._groupBlackboxedCallFrames(parent, stackTrace.callFrames, {rememberBlackboxedCallFrameGroupToAutoExpand});

        let parentStackTrace = stackTrace.parentStackTrace;
        while (parentStackTrace) {
            console.assert(parentStackTrace.callFrames.length, "StackTrace should have non-empty call frames array.");
            if (!parentStackTrace.callFrames.length)
                break;

            let boundaryCallFrame;
            if (parentStackTrace.topCallFrameIsBoundary) {
                boundaryCallFrame = parentStackTrace.callFrames[0];
                console.assert(boundaryCallFrame.nativeCode && !boundaryCallFrame.sourceCodeLocation);
            } else {
                // Create a generic native CallFrame for the asynchronous boundary.
                boundaryCallFrame = new WI.CallFrame(parentStackTrace.callFrames[0].target, {
                    functionName: WI.UIString("(async)"),
                    nativeCode: true,
                });
            }

            parent.appendChild(new CallFrameUIClass(boundaryCallFrame, {showFunctionName: true, isAsyncBoundaryCallFrame: true}));

            let startIndex = parentStackTrace.topCallFrameIsBoundary ? 1 : 0;
            let parentCallFrames = startIndex ? parentStackTrace.callFrames.slice(startIndex) : parentStackTrace.callFrames;
            WI.StackTraceTreeController._groupBlackboxedCallFrames(parent, parentCallFrames, {rememberBlackboxedCallFrameGroupToAutoExpand});

            if (parentStackTrace.truncated) {
                let truncatedCallFrame = new WI.CallFrame(parentStackTrace.callFrames[0].target, {
                    functionName: WI.UIString("(call frames truncated)"),
                    nativeCode: true,
                });
                parent.appendChild(new CallFrameUIClass(truncatedCallFrame, {showFunctionName: true, isTruncatedBoundaryCallFrame: true}));
            }

            parentStackTrace = parentStackTrace.parentStackTrace;
        }

        return activeCallFrameTreeElement;
    }

    static _groupBlackboxedCallFrames(parent, callFrames, {rememberBlackboxedCallFrameGroupToAutoExpand} = {})
    {
        let parentIsNode = parent instanceof Node;
        console.assert(parentIsNode || parent instanceof WI.TreeOutline || parent instanceof WI.TreeElement, parent);
        console.assert(Array.isArray(callFrames) && callFrames.length && callFrames.every((callFrame) => callFrame instanceof WI.CallFrame), callFrames);

        let BlackboxedGroupUIClass = parentIsNode ? WI.BlackboxedGroupView : WI.BlackboxedGroupTreeElement;
        let blackboxedGroupUIOptions = {rememberBlackboxedCallFrameGroupToAutoExpand};

        let CallFrameUIClass = parentIsNode ? WI.CallFrameView : WI.CallFrameTreeElement;
        let callFrameUIOptions = {showFunctionName: true, indicateIfBlackboxed: true};

        let activeCallFrame = WI.debuggerManager.activeCallFrame;
        let activeCallFrameTreeElement = null;

        let blackboxedCallFrameGroupStartIndex = undefined;

        function displayable(callFrame) {
            if (parentIsNode) {
                if (!callFrame.sourceCodeLocation && callFrame.functionName === null)
                    return false;

                if (callFrame.isConsoleEvaluation && !WI.settings.debugShowConsoleEvaluations.value)
                    return false;
            }

            return true;
        }

        // Add one extra iteration to handle call stacks that start blackboxed.
        for (let i = 0; i < callFrames.length + 1; ++i) {
            let callFrame = callFrames[i];

            if (callFrame) {
                if (callFrames.length > 1 && !displayable(callFrame))
                    continue;

                if (callFrame.blackboxed) {
                    blackboxedCallFrameGroupStartIndex ??= i;
                    continue;
                }
            }

            if (blackboxedCallFrameGroupStartIndex !== undefined) {
                let blackboxedCallFrameGroup = callFrames.slice(blackboxedCallFrameGroupStartIndex, i).filter(displayable);
                blackboxedCallFrameGroupStartIndex = undefined;

                if (!rememberBlackboxedCallFrameGroupToAutoExpand || !WI.debuggerManager.shouldAutoExpandBlackboxedCallFrameGroup(blackboxedCallFrameGroup))
                    parent.appendChild(new BlackboxedGroupUIClass(blackboxedCallFrameGroup, blackboxedGroupUIOptions));
                else {
                    for (let blackboxedCallFrame of blackboxedCallFrameGroup)
                        parent.appendChild(new CallFrameUIClass(blackboxedCallFrame, callFrameUIOptions));
                }
            }

            if (!callFrame)
                continue;

            let callFrameTreeElement = new CallFrameUIClass(callFrame, callFrameUIOptions);
            if (callFrame === activeCallFrame && !parentIsNode)
                activeCallFrameTreeElement = callFrameTreeElement;
            parent.appendChild(callFrameTreeElement);
        }

        return activeCallFrameTreeElement;
    }

    // Public

    get treeOutline() { return this._treeOutline; }

    get stackTrace()
    {
        return this._stackTrace;
    }

    set stackTrace(stackTrace)
    {
        stackTrace = stackTrace || null;
        if (this._stackTrace === stackTrace)
            return;

        this._stackTrace = stackTrace;

        this._treeOutline.removeChildren();

        if (this._stackTrace)
            WI.StackTraceTreeController.groupBlackboxedStackTrace(this._treeOutline, this._stackTrace);
    }

    disconnect()
    {
        if (this._treeOutline.selectable)
            this._treeOutline.removeEventListener(WI.TreeOutline.Event.SelectionDidChange, this._treeSelectionDidChange, this);
        else
            this._treeOutline.removeEventListener(WI.TreeOutline.Event.ElementClicked, this._treeElementClicked, this);
    }

    // Private

    _treeElementClicked(event)
    {
        this._showSourceCodeLocation(event.data.treeElement);
    }

    _treeSelectionDidChange(event)
    {
        this._showSourceCodeLocation(this._treeOutline.selectedTreeElement);
    }

    _showSourceCodeLocation(treeElement)
    {
        let callFrame = treeElement.callFrame;
        if (!callFrame.sourceCodeLocation)
            return;

        WI.showSourceCodeLocation(callFrame.sourceCodeLocation, {
            ignoreNetworkTab: true,
            ignoreSearchTab: true,
            // Treat call frame clicks as link clicks since it jumps to a source location.
            initiatorHint: WI.TabBrowser.TabNavigationInitiator.LinkClick,
        });
    }
};
