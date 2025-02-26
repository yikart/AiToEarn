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

WI.LocalScript = class LocalScript extends WI.Script
{
    constructor(target, url, sourceURL, sourceType, source, {injected, editable} = {})
    {
        const id = null;
        super(target, id, WI.TextRange.fromText(source), url, sourceType, injected, sourceURL);

        this._editable = !!editable;

        // Finalize WI.SourceCode.
        const base64Encoded = false;
        const mimeType = "text/javascript";
        this._originalRevision = new WI.SourceCodeRevision(this, source, base64Encoded, mimeType);
        this._currentRevision = this._originalRevision;
    }

    // Public

    get editable() { return this._editable; }

    get supportsScriptBlackboxing()
    {
        return false;
    }

    requestContentFromBackend()
    {
        return Promise.resolve({
            scriptSource: this._originalRevision.content,
        });
    }

    // Protected

    handleCurrentRevisionContentChange()
    {
        super.handleCurrentRevisionContentChange();

        this._range = WI.TextRange.fromText(this._currentRevision.content);
    }
};
