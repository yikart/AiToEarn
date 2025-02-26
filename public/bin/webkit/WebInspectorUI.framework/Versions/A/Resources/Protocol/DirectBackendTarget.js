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

// This class is used when connecting directly to a single target.
// The main connection is a direct connection to a target.

WI.DirectBackendTarget = class DirectBackendTarget extends WI.Target
{
    constructor()
    {
        const parentTarget = null;
        const targetId = "direct";
        let {type, displayName} = DirectBackendTarget.connectionInfoForDebuggable();
        super(parentTarget, targetId, displayName, type, InspectorBackend.backendConnection);

        this._executionContext = new WI.ExecutionContext(this, WI.RuntimeManager.TopLevelContextExecutionIdentifier, WI.ExecutionContext.Type.Normal, displayName);
        this._mainResource = null;
    }

    // Static

    static connectionInfoForDebuggable()
    {
        switch (WI.sharedApp.debuggableType) {
        case WI.DebuggableType.ITML:
            return {
                type: WI.TargetType.ITML,
                displayName: WI.UIString("ITML Context"),
            };
        case WI.DebuggableType.JavaScript:
            return {
                type: WI.TargetType.JavaScript,
                displayName: WI.UIString("JavaScript Context"),
            };
        case WI.DebuggableType.Page:
            return {
                type: WI.TargetType.Page,
                displayName: WI.UIString("Page"),
            };
        case WI.DebuggableType.ServiceWorker:
            return {
                type: WI.TargetType.ServiceWorker,
                displayName: WI.UIString("ServiceWorker"),
            };
        case WI.DebuggableType.WebPage:
            return {
                type: WI.TargetType.WebPage,
                displayName: WI.UIString("Page"),
            };
        default:
            console.error("Unexpected debuggable type: ", WI.sharedApp.debuggableType);
            return {
                type: WI.TargetType.JavaScript,
                displayName: WI.UIString("JavaScript Context"),
            };
        }
    }

    // Protected (Target)

    get mainResource()
    {
        if (this._mainResource)
            return this._mainResource;

        let mainFrame = WI.networkManager.mainFrame;
        return mainFrame ? mainFrame.mainResource : null;
    }

    set mainResource(resource)
    {
        this._mainResource = resource;
    }
};
