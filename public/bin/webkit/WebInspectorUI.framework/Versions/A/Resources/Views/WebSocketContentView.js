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

WI.WebSocketContentView = class WebSocketContentView extends WI.ContentView
{
    constructor(resource)
    {
        console.assert(resource instanceof WI.WebSocketResource, resource);

        super(resource);

        this._updateFramesDebouncer = new Debouncer(() => {
            this._updateFrames();
        });

        this._resource = resource;
        this._framesRendered = 0;
        this._lastRenderedReadyState = null;

        this.element.classList.add("web-socket", "resource");

        let columns = {data: {}, time: {}};

        columns.data.title = WI.UIString("Data");
        columns.data.sortable = false;
        columns.data.width = "85%";

        columns.time.title = WI.UIString("Time");
        columns.time.sortable = true;

        this._dataGrid = new WI.DataGrid(columns);
        this._dataGrid.variableHeightRows = true;
        this.addSubview(this._dataGrid);

        this._addRow(WI.UIString("WebSocket Connection Established"), this._resource.walltime);

        this._dataGrid.updateLayout();
    }

    // Static

    static textForOpcode(opcode)
    {
        switch (opcode) {
        case WI.WebSocketResource.OpCodes.ContinuationFrame:
            return WI.UIString("Continuation Frame");
        case WI.WebSocketResource.OpCodes.TextFrame:
            return WI.UIString("Text Frame");
        case WI.WebSocketResource.OpCodes.BinaryFrame:
            return WI.UIString("Binary Frame");
        case WI.WebSocketResource.OpCodes.ConnectionCloseFrame:
            return WI.UIString("Connection Close Frame");
        case WI.WebSocketResource.OpCodes.PingFrame:
            return WI.UIString("Ping Frame");
        case WI.WebSocketResource.OpCodes.PongFrame:
            return WI.UIString("Pong Frame");
        }
    }

    // Public

    attached()
    {
        super.attached();

        this._updateFramesDebouncer.force();
        this._resource.addEventListener(WI.WebSocketResource.Event.FrameAdded, this._updateFramesSoon, this);
        this._resource.addEventListener(WI.WebSocketResource.Event.ReadyStateChanged, this._updateFramesSoon, this);
    }

    detached()
    {
        this._resource.removeEventListener(WI.WebSocketResource.Event.FrameAdded, this._updateFramesSoon, this);
        this._resource.removeEventListener(WI.WebSocketResource.Event.ReadyStateChanged, this._updateFramesSoon, this);

        super.detached();
    }

    // Private

    _updateFramesSoon()
    {
        this._updateFramesDebouncer.delayForFrame();
    }

    _updateFrames()
    {
        let shouldScrollToBottom = this._dataGrid.isScrolledToLastRow();

        let framesLength = this._resource.frames.length;
        for (let index = this._framesRendered; index < framesLength; index++) {
            let frame = this._resource.frames[index];
            let {data, isOutgoing, opcode, walltime} = frame;
            this._addFrame(data, isOutgoing, opcode, walltime);
        }

        this._framesRendered = framesLength;

        if (this._lastRenderedReadyState !== this._resource.readyState) {
            if (this._resource.readyState === WI.WebSocketResource.ReadyState.Closed)
                this._dataGrid.appendChild(new WI.SpanningDataGridNode(WI.UIString("Connection Closed")));

            this._lastRenderedReadyState = this._resource.readyState;
        }

        if (shouldScrollToBottom) {
            if (!this._scrollToLastRowDebouncer) {
                this._scrollToLastRowDebouncer = new Debouncer(() => {
                    this._dataGrid.scrollToLastRow();
                });
            }

            this._scrollToLastRowDebouncer.delayForFrame();
        }
    }

    _addFrame(data, isOutgoing, opcode, time)
    {
        let nodeText;
        let isText = opcode === WI.WebSocketResource.OpCodes.TextFrame;
        if (isText)
            nodeText = data;
        else
            nodeText = WI.WebSocketContentView.textForOpcode(opcode);

        this._addRow(nodeText, time, {isOutgoing, isText});
    }

    _addRow(data, time, attributes = {})
    {
        let node = new WI.WebSocketDataGridNode({...attributes, data, time});

        this._dataGrid.appendChild(node);

        if (attributes.isText)
            node.element.classList.add("text-frame");
        else
            node.element.classList.add("non-text-frame");

        if (attributes.isOutgoing)
            node.element.classList.add("outgoing");
        else
            node.element.classList.add("incoming");
    }
};
