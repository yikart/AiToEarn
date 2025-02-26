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

WI.SourceCode = class SourceCode extends WI.Object
{
    constructor(url)
    {
        super();

        this._url = url;
        this._urlComponents = null;

        this._originalRevision = new WI.SourceCodeRevision(this);
        this._currentRevision = this._originalRevision;

        this._sourceMaps = null;
        this._formatterSourceMap = null;
        this._requestContentPromise = null;
    }

    // Static

    static generateSpecialContentForURL(url)
    {
        if (url === "about:blank") {
            return Promise.resolve({
                content: "",
                message: WI.unlocalizedString("about:blank")
            });
        }
        return null;
    }

    // Public

    get displayName()
    {
        // Implemented by subclasses.
        console.error("Needs to be implemented by a subclass.");
        return "";
    }

    get originalRevision()
    {
        return this._originalRevision;
    }

    get currentRevision()
    {
        return this._currentRevision;
    }

    set currentRevision(revision)
    {
        console.assert(revision instanceof WI.SourceCodeRevision);
        if (!(revision instanceof WI.SourceCodeRevision))
            return;

        console.assert(revision.sourceCode === this);
        if (revision.sourceCode !== this)
            return;

        this._currentRevision = revision;

        this.dispatchEventToListeners(WI.SourceCode.Event.ContentDidChange);
    }

    get editableRevision()
    {
        if (this._currentRevision === this._originalRevision)
            this._currentRevision = this._originalRevision.copy();
        return this._currentRevision;
    }

    get content()
    {
        return this._currentRevision.content;
    }

    get base64Encoded()
    {
        return this._currentRevision.base64Encoded;
    }

    get url()
    {
        return this._url;
    }

    get urlComponents()
    {
        if (!this._urlComponents)
            this._urlComponents = parseURL(this._url);
        return this._urlComponents;
    }

    get contentIdentifier()
    {
        // A contentIdentifier is roughly `url || sourceURL` for cases where
        // the content is consistent between sessions and not ephemeral.

        // Can be overridden by subclasses if better behavior is possible.
        return this.url;
    }

    get isScript()
    {
        // Implemented by subclasses if needed.
        return false;
    }

    get supportsScriptBlackboxing()
    {
        if (!this.isScript)
            return false;
        if (!WI.DebuggerManager.supportsBlackboxingScripts())
            return false;
        let contentIdentifier = this.contentIdentifier;
        return contentIdentifier && !isWebKitInjectedScript(contentIdentifier);
    }

    get localResourceOverride()
    {
        // Overridden by subclasses if needed.
        return null;
    }

    get sourceMaps()
    {
        return this._sourceMaps || [];
    }

    addSourceMap(sourceMap)
    {
        console.assert(sourceMap instanceof WI.SourceMap);

        if (!this._sourceMaps)
            this._sourceMaps = [];

        this._sourceMaps.push(sourceMap);

        this.dispatchEventToListeners(WI.SourceCode.Event.SourceMapAdded, {sourceMap});
    }

    get formatterSourceMap()
    {
        return this._formatterSourceMap;
    }

    set formatterSourceMap(formatterSourceMap)
    {
        console.assert(this._formatterSourceMap === null || formatterSourceMap === null);
        console.assert(formatterSourceMap === null || formatterSourceMap instanceof WI.FormatterSourceMap);

        this._formatterSourceMap = formatterSourceMap;

        this.dispatchEventToListeners(WI.SourceCode.Event.FormatterDidChange);
    }

    requestContent()
    {
        this._requestContentPromise = this._requestContentPromise || this.requestContentFromBackend().then(this._processContent.bind(this));

        return this._requestContentPromise;
    }

    createSourceCodeLocation(lineNumber, columnNumber)
    {
        return new WI.SourceCodeLocation(this, lineNumber, columnNumber);
    }

    createLazySourceCodeLocation(lineNumber, columnNumber)
    {
        return new WI.LazySourceCodeLocation(this, lineNumber, columnNumber);
    }

    createSourceCodeTextRange(textRange)
    {
        return new WI.SourceCodeTextRange(this, textRange);
    }

    // Protected

    revisionContentDidChange(revision)
    {
        if (this._ignoreRevisionContentDidChangeEvent)
            return;

        console.assert(revision === this._currentRevision);
        if (revision !== this._currentRevision)
            return;

        this.handleCurrentRevisionContentChange();

        this.dispatchEventToListeners(WI.SourceCode.Event.ContentDidChange);
    }

    handleCurrentRevisionContentChange()
    {
        // Implemented by subclasses if needed.
    }

    get revisionForRequestedContent()
    {
        // Implemented by subclasses if needed.
        return this._originalRevision;
    }

    markContentAsStale()
    {
        this._requestContentPromise = null;
        this._contentReceived = false;
    }

    requestContentFromBackend()
    {
        // Implemented by subclasses.
        console.error("Needs to be implemented by a subclass.");
        return Promise.reject(new Error("Needs to be implemented by a subclass."));
    }

    get mimeType()
    {
        // Implemented by subclasses.
        console.error("Needs to be implemented by a subclass.");
    }

    // Private

    _processContent(parameters)
    {
        // Different backend APIs return one of `content, `body`, `text`, or `scriptSource`.
        let rawContent = parameters.content || parameters.body || parameters.text || parameters.scriptSource;
        let rawBase64Encoded = !!parameters.base64Encoded;
        let content = rawContent;
        let error = parameters.error;
        let message = parameters.message;

        if (parameters.base64Encoded)
            content = content ? WI.BlobUtilities.decodeBase64ToBlob(content, this.mimeType) : "";

        let revision = this.revisionForRequestedContent;

        this._ignoreRevisionContentDidChangeEvent = true;
        revision.updateRevisionContent(rawContent, {
            base64Encoded: rawBase64Encoded,
            mimeType: this.mimeType,
            blobContent: content instanceof Blob ? content : null,
        });
        this._ignoreRevisionContentDidChangeEvent = false;

        // FIXME: Returning the content in this promise is misleading. It may not be current content
        // now, and it may become out-dated later on. We should drop content from this promise
        // and require clients to ask for the current contents from the sourceCode in the result.
        // That would also avoid confusion around `content` being a Blob and eliminate the work
        // of creating the Blob if it is not used.

        return Promise.resolve({
            error,
            message,
            sourceCode: this,
            content,
            rawContent,
            rawBase64Encoded,
        });
    }
};

WI.SourceCode.Event = {
    ContentDidChange: "source-code-content-did-change",
    SourceMapAdded: "source-code-source-map-added",
    FormatterDidChange: "source-code-formatter-did-change",
    LoadingDidFinish: "source-code-loading-did-finish",
    LoadingDidFail: "source-code-loading-did-fail"
};
