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

WI.CanvasObserver = class CanvasObserver extends InspectorBackend.Dispatcher
{
    // Events defined by the "Canvas" domain.

    canvasAdded(canvas)
    {
        WI.canvasManager.canvasAdded(this._target, canvas);
    }

    canvasRemoved(canvasId)
    {
        WI.canvasManager.canvasRemoved(this._target, canvasId);
    }

    canvasSizeChanged(canvasId, width, height)
    {
        WI.canvasManager.canvasSizeChanged(this._target, canvasId, width, height);
    }

    canvasMemoryChanged(canvasId, memoryCost)
    {
        WI.canvasManager.canvasMemoryChanged(this._target, canvasId, memoryCost);
    }

    clientNodesChanged(canvasId)
    {
        WI.canvasManager.clientNodesChanged(this._target, canvasId);
    }

    recordingStarted(canvasId, initiator)
    {
        WI.canvasManager.recordingStarted(this._target, canvasId, initiator);
    }

    recordingProgress(canvasId, frames, bufferUsed)
    {
        WI.canvasManager.recordingProgress(this._target, canvasId, frames, bufferUsed);
    }

    recordingFinished(canvasId, recording)
    {
        WI.canvasManager.recordingFinished(this._target, canvasId, recording);
    }

    extensionEnabled(canvasId, extension)
    {
        WI.canvasManager.extensionEnabled(this._target, canvasId, extension);
    }

    programCreated(shaderProgram)
    {
        // COMPATIBILITY (iOS 13.0): `shaderProgram` replaced `canvasId` and `programId`.
        if (arguments.length === 2) {
            shaderProgram = {
                canvasId: arguments[0],
                programId: arguments[1],
            };
        }
        WI.canvasManager.programCreated(this._target, shaderProgram);
    }

    programDeleted(programId)
    {
        WI.canvasManager.programDeleted(this._target, programId);
    }

    // COMPATIBILITY (iOS 13): Canvas.events.cssCanvasClientNodesChanged was renamed to Canvas.events.clientNodesChanged.
    cssCanvasClientNodesChanged(canvasId)
    {
        WI.canvasManager.clientNodesChanged(this._target, canvasId);
    }
};
