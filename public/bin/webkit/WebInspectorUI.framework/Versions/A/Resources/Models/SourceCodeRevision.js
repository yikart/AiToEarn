/*
 * Copyright (C) 2013-2019 Apple Inc. All rights reserved.
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

WI.SourceCodeRevision = class SourceCodeRevision extends WI.Revision
{
    constructor(sourceCode, content, base64Encoded, mimeType)
    {
        super();

        console.assert(sourceCode instanceof WI.SourceCode);
        console.assert(content === undefined || typeof content === "string");
        console.assert(base64Encoded === undefined || typeof base64Encoded === "boolean");
        console.assert(mimeType === undefined || typeof mimeType === "string");

        this._sourceCode = sourceCode;

        this._content = content || "";
        this._base64Encoded = !!base64Encoded;
        this._mimeType = mimeType;
        this._blobContent = null;
    }

    // Public

    get sourceCode() { return this._sourceCode; }
    get content() { return this._content; }
    get base64Encoded() { return this._base64Encoded; }
    get mimeType() { return this._mimeType; }

    get blobContent()
    {
        if (!this._blobContent && this._content)
            this._blobContent = WI.BlobUtilities.blobForContent(this._content, this._base64Encoded, this._mimeType);

        console.assert(!this._blobContent || this._blobContent instanceof Blob);
        return this._blobContent;
    }

    updateRevisionContent(content, {base64Encoded, mimeType, blobContent} = {})
    {
        console.assert(content === undefined || typeof content === "string");
        this._content = content || "";

        if (base64Encoded !== undefined) {
            console.assert(typeof base64Encoded === "boolean");
            this._base64Encoded = !!base64Encoded;
        }

        if (mimeType !== undefined) {
            console.assert(typeof mimeType === "string");
            this._mimeType = mimeType;
        }

        console.assert(!blobContent || blobContent instanceof Blob);
        this._blobContent = blobContent !== undefined ? blobContent : null;

        this._sourceCode.revisionContentDidChange(this);
    }

    apply()
    {
        this._sourceCode.currentRevision = this;
    }

    revert()
    {
        this._sourceCode.currentRevision = this._sourceCode.originalRevision;
    }

    copy()
    {
        return new WI.SourceCodeRevision(this._sourceCode, this._content, this._base64Encoded, this._mimeType);
    }
};
