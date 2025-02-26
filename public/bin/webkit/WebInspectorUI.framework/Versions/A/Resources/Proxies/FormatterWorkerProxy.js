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

WI.FormatterWorkerProxy = class FormatterWorkerProxy
{
    constructor()
    {
        this._formatterWorker = new Worker("Workers/Formatter/FormatterWorker.js");
        this._formatterWorker.addEventListener("message", this._handleMessage.bind(this));

        this._nextCallId = 1;
        this._callbacks = new Map;
    }

    // Static

    static singleton()
    {
        if (!FormatterWorkerProxy.instance)
            FormatterWorkerProxy.instance = new FormatterWorkerProxy;
        return FormatterWorkerProxy.instance;
    }

    // Actions

    formatJavaScript(sourceText, isModule, indentString, includeSourceMapData)
    {
        this.performAction("formatJavaScript", ...arguments);
    }

    formatCSS(sourceText, indentString, includeSourceMapData)
    {
        this.performAction("formatCSS", ...arguments);
    }

    formatHTML(sourceText, indentString, includeSourceMapData)
    {
        this.performAction("formatHTML", ...arguments);
    }

    formatXML(sourceText, indentString, includeSourceMapData)
    {
        this.performAction("formatXML", ...arguments);
    }

    // Public

    performAction(actionName)
    {
        let callId = this._nextCallId++;
        let callback = arguments[arguments.length - 1];
        let actionArguments = Array.prototype.slice.call(arguments, 1, arguments.length - 1);

        console.assert(typeof actionName === "string", "performAction should always have an actionName");
        console.assert(typeof callback === "function", "performAction should always have a callback");

        this._callbacks.set(callId, callback);
        this._postMessage({callId, actionName, actionArguments});
    }

    // Private

    _postMessage()
    {
        this._formatterWorker.postMessage(...arguments);
    }

    _handleMessage(event)
    {
        let data = event.data;

        // Action response.
        if (data.callId) {
            let callback = this._callbacks.get(data.callId);
            this._callbacks.delete(data.callId);
            callback(data.result);
            return;
        }

        console.error("Unexpected FormatterWorker message", data);
    }
};
