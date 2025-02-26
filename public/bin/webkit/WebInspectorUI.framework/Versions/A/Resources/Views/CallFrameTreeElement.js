/*
 * Copyright (C) 2013, 2015 Apple Inc. All rights reserved.
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

WI.CallFrameTreeElement = class CallFrameTreeElement extends WI.GeneralTreeElement
{
    constructor(callFrame, {isAsyncBoundaryCallFrame, isTruncatedBoundaryCallFrame} = {})
    {
        console.assert(callFrame instanceof WI.CallFrame);

        let className = WI.CallFrameView.iconClassNameForCallFrame(callFrame);
        let title = callFrame.displayName;
        const subtitle = null;
        super(["call-frame", className], title, subtitle, callFrame);

        this._callFrame = callFrame;
        this._isActiveCallFrame = false;

        this._isAsyncBoundaryCallFrame = isAsyncBoundaryCallFrame || false;
         if (this._isAsyncBoundaryCallFrame) {
            this.addClassName("async-boundary");
            this.selectable = false;
         }

        this._isTruncatedBoundaryCallFrame = !!isTruncatedBoundaryCallFrame;
        if (this._isTruncatedBoundaryCallFrame) {
            this.addClassName("truncated-boundary");
            this.selectable = false;
        }

        if (this._callFrame.nativeCode || !this._callFrame.sourceCodeLocation) {
            this.subtitle = "";
            this.selectable = false;
            return;
        }

        let displayScriptURL = this._callFrame.sourceCodeLocation.displaySourceCode.url;
        if (displayScriptURL) {
            this.subtitle = document.createElement("span");
            this._callFrame.sourceCodeLocation.populateLiveDisplayLocationString(this.subtitle, "textContent");
            // Set the tooltip on the entire tree element in onattach, once the element is created.
            this.tooltipHandledSeparately = true;
        }

        if (this._callFrame.blackboxed) {
            this.addClassName("blackboxed");
            this.tooltipHandledSeparately = true;
        }
    }

    // Public

    get callFrame() { return this._callFrame; }
    get isAsyncBoundaryCallFrame() { return this._isAsyncBoundaryCallFrame; }

    get isActiveCallFrame()
    {
        return this._isActiveCallFrame;
    }

    set isActiveCallFrame(x)
    {
        if (this._isActiveCallFrame === x)
            return;

        this._isActiveCallFrame = x;
        this._updateStatus();
    }

    // Protected

    onattach()
    {
        super.onattach();

        console.assert(this.element);

        if (this.tooltipHandledSeparately) {
            let tailCallSuffix = "";
            if (this._callFrame.isTailDeleted)
                tailCallSuffix = " " + WI.UIString("(Tail Call)");
            let tooltipPrefix = this.mainTitle + tailCallSuffix + "\n";

            let tooltipSuffix = "";
            if (this._callFrame.blackboxed)
                tooltipSuffix += "\n\n" + WI.UIString("Script ignored due to blackbox");

            this._callFrame.sourceCodeLocation.populateLiveDisplayLocationTooltip(this.element, tooltipPrefix, tooltipSuffix);
        }

        this._updateStatus();
    }

    populateContextMenu(contextMenu, event)
    {
        if (this._callFrame.sourceCodeLocation)
            WI.appendContextMenuItemsForSourceCode(contextMenu, this._callFrame.sourceCodeLocation);

        super.populateContextMenu(contextMenu, event);
    }

    // Private

    _updateStatus()
    {
        if (!this.element)
            return;

        if (!this._isActiveCallFrame) {
            this.status = null;
            return;
        }

        if (!this._statusImageElement)
            this._statusImageElement = WI.ImageUtilities.useSVGSymbol("Images/ActiveCallFrame.svg", "status-image");
        this.status = this._statusImageElement;
    }
};
