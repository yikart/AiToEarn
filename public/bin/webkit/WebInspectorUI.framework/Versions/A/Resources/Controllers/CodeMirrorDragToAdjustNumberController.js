/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
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

WI.CodeMirrorDragToAdjustNumberController = class CodeMirrorDragToAdjustNumberController extends WI.Object
{
    constructor(codeMirror)
    {
        super();

        this._codeMirror = codeMirror;

        this._dragToAdjustController = new WI.DragToAdjustController(this);
    }

    // Public

    get enabled()
    {
        return this._dragToAdjustController.enabled;
    }

    set enabled(enabled)
    {
        if (this.enabled === enabled)
            return;

        this._dragToAdjustController.element = this._codeMirror.getWrapperElement();
        this._dragToAdjustController.enabled = enabled;
    }

    // Protected

    dragToAdjustControllerActiveStateChanged(dragToAdjustController)
    {
        if (!dragToAdjustController.active)
            this._hoveredTokenInfo = null;
    }

    dragToAdjustControllerCanBeActivated(dragToAdjustController)
    {
        return !this._codeMirror.getOption("readOnly");
    }

    dragToAdjustControllerCanBeAdjusted(dragToAdjustController)
    {

        return this._hoveredTokenInfo && this._hoveredTokenInfo.containsNumber;
    }

    dragToAdjustControllerWasAdjustedByAmount(dragToAdjustController, amount)
    {
        this._codeMirror.alterNumberInRange(amount, this._hoveredTokenInfo.startPosition, this._hoveredTokenInfo.endPosition, false);
    }

    dragToAdjustControllerDidReset(dragToAdjustController)
    {
        this._hoveredTokenInfo = null;
    }

    dragToAdjustControllerCanAdjustObjectAtPoint(dragToAdjustController, point)
    {
        var position = this._codeMirror.coordsChar({left: point.x, top: point.y});
        var token = this._codeMirror.getTokenAt(position);

        if (!token || !token.type || !token.string) {
            if (this._hoveredTokenInfo)
                dragToAdjustController.reset();
            return false;
        }

        // Stop right here if we're hovering the same token as we were last time.
        if (this._hoveredTokenInfo && this._hoveredTokenInfo.line === position.line &&
            this._hoveredTokenInfo.token.start === token.start && this._hoveredTokenInfo.token.end === token.end)
            return this._hoveredTokenInfo.token.type.indexOf("number") !== -1;

        var containsNumber = token.type.indexOf("number") !== -1;
        this._hoveredTokenInfo = {
            token,
            line: position.line,
            containsNumber,
            startPosition: {
                ch: token.start,
                line: position.line
            },
            endPosition: {
                ch: token.end,
                line: position.line
            }
        };

        return containsNumber;
    }
};

CodeMirror.defineOption("dragToAdjustNumbers", true, function(codeMirror, value, oldValue) {
    if (!codeMirror.dragToAdjustNumberController)
        codeMirror.dragToAdjustNumberController = new WI.CodeMirrorDragToAdjustNumberController(codeMirror);
    codeMirror.dragToAdjustNumberController.enabled = value;
});
