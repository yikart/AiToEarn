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

WI.ThreadTreeElement = class ThreadTreeElement extends WI.GeneralTreeElement
{
    constructor(target)
    {
        super("thread", target.displayName);

        this._target = target;

        this._idleTreeElement = new WI.IdleTreeElement;
    }

    // Public

    get target() { return this._target; }

    refresh()
    {
        this.removeChildren();

        this._updateStatus();

        let targetData = WI.debuggerManager.dataForTarget(this._target);

        if (targetData.pausing || !targetData.stackTrace?.callFrames.length) {
            this.appendChild(this._idleTreeElement);
            this.expand();
            return;
        }

        let activeCallFrameTreeElement = WI.StackTraceTreeController.groupBlackboxedStackTrace(this, targetData.stackTrace, {rememberBlackboxedCallFrameGroupToAutoExpand: true});
        if (activeCallFrameTreeElement) {
            activeCallFrameTreeElement.select(true, true);
            activeCallFrameTreeElement.isActiveCallFrame = true;
        }

        this.expand();
    }

    // Protected (GeneralTreeElement)

    onattach()
    {
        super.onattach();

        this.refresh();
        this.expand();
    }

    populateContextMenu(contextMenu, event)
    {
        let targetData = WI.debuggerManager.dataForTarget(this._target);

        contextMenu.appendItem(WI.UIString("Resume Thread"), () => {
            WI.debuggerManager.continueUntilNextRunLoop(this._target);
        }, !targetData.paused);

        super.populateContextMenu(contextMenu, event);
    }

    // Private

    _updateStatus()
    {
        this.status = null;

        if (!this.element)
            return;

        let targetData = WI.debuggerManager.dataForTarget(this._target);
        if (!targetData.paused)
            return;

        if (!this._statusButton) {
            let tooltip = WI.UIString("Resume Thread");
            this._statusButton = new WI.TreeElementStatusButton(WI.ImageUtilities.useSVGSymbol("Images/Resume.svg", "resume", tooltip));
            this._statusButton.addEventListener(WI.TreeElementStatusButton.Event.Clicked, function(event) {
                WI.debuggerManager.continueUntilNextRunLoop(this._target);
            }, this);
            this._statusButton.element.addEventListener("mousedown", (event) => {
                // Prevent tree element from being selected.
                event.stopPropagation();
            });
        }

        this.status = this._statusButton.element;
    }
};
