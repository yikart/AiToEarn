/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

WI.LocalRemoteObjectContentView = class LocalRemoteObjectContentView extends WI.ContentView
{
    constructor(representedObject)
    {
        super(representedObject);

        this._remoteObject = null;
        this._spinnerTimeout = undefined;

        this.element.classList.add("local-remote-object");
    }

    // Protected

    get expression()
    {
        throw WI.NotImplementedError.subclassMustOverride();
    }

    renderRemoteObject(remoteObject)
    {
        throw WI.NotImplementedError.subclassMustOverride();
    }

    initialLayout()
    {
        super.initialLayout();

        let target = WI.assumingMainTarget();
        let options = {
            expression: "(" + this.expression + ")",
            doNotPauseOnExceptionsAndMuteConsole: true,
            generatePreview: true,
        };
        target.RuntimeAgent.evaluate.invoke(options, (error, result, wasThrown) => {
            console.assert(!error);
            console.assert(!wasThrown);

            this._remoteObject = WI.RemoteObject.fromPayload(result);

            if (this._spinnerTimeout) {
                clearTimeout(this._spinnerTimeout);
                this._spinnerTimeout = undefined;
            }

            this.element.removeChildren();

            this.renderRemoteObject(this._remoteObject);
        });
    }

    attached()
    {
        super.attached();

        if (this._spinnerTimeout || this._remoteObject)
            return;

        this._spinnerTimeout = setTimeout(() => {
            console.assert(this._spinnerTimeout);

            let spinner = new WI.IndeterminateProgressSpinner;
            this.element.appendChild(spinner.element);

            this._spinnerTimeout = undefined;
        }, 100);
    }

    closed()
    {
        super.closed();

        if (this._remoteObject) {
            this._remoteObject.release();
            this._remoteObject = null;
        }
    }
};
