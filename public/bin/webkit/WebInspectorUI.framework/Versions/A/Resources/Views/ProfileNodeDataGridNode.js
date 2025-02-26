/*
 * Copyright (C) 2014, 2015 Apple Inc. All rights reserved.
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

WI.ProfileNodeDataGridNode = class ProfileNodeDataGridNode extends WI.TimelineDataGridNode
{
    constructor(profileNode, options = {})
    {
        console.assert(profileNode instanceof WI.ProfileNode);

        options.hasChildren = !!profileNode.childNodes.length;

        super(null, options);

        this._profileNode = profileNode;

        this.addEventListener(WI.DataGridNode.Event.Populate, this._populate, this);
    }

    // Public

    get profileNode() { return this._profileNode; }

    get data()
    {
        if (this._cachedData)
            return this._cachedData;

        let baseStartTime = 0;
        let rangeStartTime = 0;
        let rangeEndTime = Infinity;
        if (this.graphDataSource) {
            baseStartTime = this.graphDataSource.zeroTime;
            rangeStartTime = this.graphDataSource.startTime;
            rangeEndTime = this.graphDataSource.endTime;
        }

        let callInfo = this._profileNode.computeCallInfoForTimeRange(rangeStartTime, rangeEndTime);

        this._cachedData = super.data;
        for (let key in callInfo)
            this._cachedData[key] = callInfo[key];
        this._cachedData.startTime -= baseStartTime;
        this._cachedData.name = this.displayName();
        this._cachedData.location = this._profileNode.sourceCodeLocation;

        return this._cachedData;
    }

    createCellContent(columnIdentifier, cell)
    {
        const higherResolution = true;

        var value = this.data[columnIdentifier];

        switch (columnIdentifier) {
        case "name":
            cell.classList.add(...this.iconClassNames());
            return value;

        case "startTime":
        case "selfTime":
        case "totalTime":
        case "averageTime":
            return isNaN(value) ? emDash : Number.secondsToString(value, higherResolution);
        }

        return super.createCellContent(columnIdentifier, cell);
    }

    displayName()
    {
        let title = this._profileNode.functionName;
        if (!title) {
            switch (this._profileNode.type) {
            case WI.ProfileNode.Type.Function:
                title = WI.UIString("(anonymous function)");
                break;
            case WI.ProfileNode.Type.Program:
                title = WI.UIString("(program)");
                break;
            default:
                title = WI.UIString("(anonymous function)");
                console.error("Unknown ProfileNode type: " + this._profileNode.type);
            }
        }

        return title;
    }

    iconClassNames()
    {
        let className;
        switch (this._profileNode.type) {
        case WI.ProfileNode.Type.Function:
            className = WI.CallFrameView.FunctionIconStyleClassName;
            if (!this._profileNode.sourceCodeLocation)
                className = WI.CallFrameView.NativeIconStyleClassName;
            break;
        case WI.ProfileNode.Type.Program:
            className = WI.TimelineRecordTreeElement.EvaluatedRecordIconStyleClass;
            break;
        }

        console.assert(className);

        // This is more than likely an event listener function with an "on" prefix and it is
        // as long or longer than the shortest event listener name -- "oncut".
        if (this._profileNode.functionName && this._profileNode.functionName.startsWith("on") && this._profileNode.functionName.length >= 5)
            className = WI.CallFrameView.EventListenerIconStyleClassName;

        return [className];
    }

    // Private

    _populate()
    {
        if (!this.shouldRefreshChildren)
            return;

        this.removeEventListener(WI.DataGridNode.Event.Populate, this._populate, this);
        this.removeChildren();

        for (let node of this._profileNode.childNodes)
            this.appendChild(new WI.ProfileNodeDataGridNode(node, {
                graphDataSource: this.graphDataSource,
            }));
    }
};
