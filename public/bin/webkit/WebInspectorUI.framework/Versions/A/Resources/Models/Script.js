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

WI.Script = class Script extends WI.SourceCode
{
    constructor(target, id, range, url, sourceType, injected, sourceURL, sourceMapURL)
    {
        super(url);

        console.assert(target instanceof WI.Target || this instanceof WI.LocalScript);
        console.assert(range instanceof WI.TextRange);

        this._target = target;
        this._id = id || null;
        this._range = range || null;
        this._sourceType = sourceType || WI.Script.SourceType.Program;
        this._sourceURL = sourceURL || null;
        this._sourceMappingURL = sourceMapURL || null;
        this._injected = injected || false;
        this._dynamicallyAddedScriptElement = false;
        this._scriptSyntaxTree = null;

        this._resource = this._resolveResource();

        // If this Script was a dynamically added <script> to a Document,
        // do not associate with the Document resource, instead associate
        // with the frame as a dynamic script.
        if (this._resource && this._resource.type === WI.Resource.Type.Document && !this._range.startLine && !this._range.startColumn) {
            console.assert(this._resource.isMainResource());
            let documentResource = this._resource;
            this._resource = null;
            this._dynamicallyAddedScriptElement = true;
            documentResource.parentFrame.addExtraScript(this);
            this._dynamicallyAddedScriptElementNumber = documentResource.parentFrame.extraScriptCollection.size;
        } else if (this._resource)
            this._resource.associateWithScript(this);

        if (isWebInspectorConsoleEvaluationScript(this._sourceURL)) {
            // Assign a unique number to the script object so it will stay the same.
            this._uniqueDisplayNameNumber = this._nextUniqueConsoleDisplayNameNumber();
        }

        if (this._sourceMappingURL)
            WI.networkManager.downloadSourceMap(this._sourceMappingURL, this._url, this);
    }

    // Static

    static resetUniqueDisplayNameNumbers(target)
    {
        if (WI.Script._uniqueDisplayNameNumbersForRootTargetMap)
            WI.Script._uniqueDisplayNameNumbersForRootTargetMap.delete(target);
    }

    // Public

    get target() { return this._target; }
    get id() { return this._id; }
    get range() { return this._range; }
    get sourceType() { return this._sourceType; }
    get sourceURL() { return this._sourceURL; }
    get sourceMappingURL() { return this._sourceMappingURL; }
    get injected() { return this._injected; }

    get contentIdentifier()
    {
        if (this._url)
            return this._url;

        if (!this._sourceURL)
            return null;

        // Since reused content identifiers can cause breakpoints
        // to show up in completely unrelated files, sourceURLs should
        // be unique where possible. The checks below exclude cases
        // where sourceURLs are intentionally reused and we would never
        // expect a breakpoint to be persisted across sessions.
        if (isWebInspectorConsoleEvaluationScript(this._sourceURL))
            return null;

        if (isWebInspectorInternalScript(this._sourceURL))
            return null;

        return this._sourceURL;
    }

    get mimeType()
    {
        return this._resource ? this._resource.mimeType : "text/javascript";
    }

    get isScript()
    {
        return true;
    }

    get displayName()
    {
        if (isWebInspectorBootstrapScript(this._sourceURL || this._url)) {
            console.assert(WI.NetworkManager.supportsBootstrapScript());
            return WI.UIString("Inspector Bootstrap Script");
        }

        if (this._url && !this._dynamicallyAddedScriptElement)
            return WI.displayNameForURL(this._url, this.urlComponents);

        if (isWebInspectorConsoleEvaluationScript(this._sourceURL)) {
            console.assert(this._uniqueDisplayNameNumber);
            return WI.UIString("Console Evaluation %d").format(this._uniqueDisplayNameNumber);
        }

        if (this._sourceURL) {
            if (!this._sourceURLComponents)
                this._sourceURLComponents = parseURL(this._sourceURL);
            return WI.displayNameForURL(this._sourceURL, this._sourceURLComponents);
        }

        if (this._dynamicallyAddedScriptElement)
            return WI.UIString("Script Element %d").format(this._dynamicallyAddedScriptElementNumber);

        // Assign a unique number to the script object so it will stay the same.
        if (!this._uniqueDisplayNameNumber)
            this._uniqueDisplayNameNumber = this._nextUniqueDisplayNameNumber();

        return WI.UIString("Anonymous Script %d").format(this._uniqueDisplayNameNumber);
    }

    get displayURL()
    {
        if (isWebInspectorBootstrapScript(this._sourceURL || this._url)) {
            console.assert(WI.NetworkManager.supportsBootstrapScript());
            return WI.UIString("Inspector Bootstrap Script");
        }

        const isMultiLine = true;
        const dataURIMaxSize = 64;
        if (this._url)
            return WI.truncateURL(this._url, isMultiLine, dataURIMaxSize);
        if (this._sourceURL)
            return WI.truncateURL(this._sourceURL, isMultiLine, dataURIMaxSize);
        return null;
    }

    get dynamicallyAddedScriptElement()
    {
        return this._dynamicallyAddedScriptElement;
    }

    get anonymous()
    {
        return !this._resource && !this._url && !this._sourceURL;
    }

    get resource()
    {
        return this._resource;
    }

    get scriptSyntaxTree()
    {
        return this._scriptSyntaxTree;
    }

    couldBeMainResource(target)
    {
        console.assert(target instanceof WI.Target, target);

        return this._url === target.name;
    }

    isMainResource()
    {
        return this._target && this._target.mainResource === this;
    }

    requestContentFromBackend()
    {
        let specialContentPromise = WI.SourceCode.generateSpecialContentForURL(this._url);
        if (specialContentPromise)
            return specialContentPromise;

        if (!this._id) {
            // There is no identifier to request content with. Return false to cause the
            // pending callbacks to get null content.
            return Promise.reject(new Error("There is no identifier to request content with."));
        }

        return this._target.DebuggerAgent.getScriptSource(this._id);
    }

    saveIdentityToCookie(cookie)
    {
        cookie[WI.Script.URLCookieKey] = this.url;
        cookie[WI.Script.DisplayNameCookieKey] = this.displayName;
    }

    requestScriptSyntaxTree(callback)
    {
        if (this._scriptSyntaxTree) {
            setTimeout(() => { callback(this._scriptSyntaxTree); }, 0);
            return;
        }

        var makeSyntaxTreeAndCallCallback = (content) => {
            this._makeSyntaxTree(content);
            callback(this._scriptSyntaxTree);
        };

        var content = this.content;
        if (!content && this._resource && this._resource.type === WI.Resource.Type.Script && this._resource.finished)
            content = this._resource.content;
        if (content) {
            setTimeout(makeSyntaxTreeAndCallCallback, 0, content);
            return;
        }

        this.requestContent().then(function(parameters) {
            makeSyntaxTreeAndCallCallback(parameters.sourceCode.content);
        }).catch(function(error) {
            makeSyntaxTreeAndCallCallback(null);
        });
    }

    async breakpointLocations(startPosition, endPosition)
    {
        console.assert(startPosition instanceof WI.SourceCodePosition, startPosition);
        console.assert(endPosition instanceof WI.SourceCodePosition, endPosition);

        // COMPATIBILITY (macOS 13.0, iOS 16.0): Debugger.getBreakpointLocations did not exist yet.
        if (!this._target.hasCommand("Debugger.getBreakpointLocations"))
            return [];

        let {locations} = await this._target.DebuggerAgent.getBreakpointLocations.invoke({
            start: {
                scriptId: this._id,
                lineNumber: startPosition.lineNumber,
                columnNumber: startPosition.columnNumber,
            },
            end: {
                scriptId: this._id,
                lineNumber: endPosition.lineNumber,
                columnNumber: endPosition.columnNumber,
            },
        });
        return locations.map((location) => {
            console.assert(location.scriptId === this._id, location);
            let sourceCode = this._resource || this;
            return sourceCode.createLazySourceCodeLocation(location.lineNumber, location.columnNumber);
        });
    }

    // Private

    _nextUniqueDisplayNameNumber()
    {
        let numbers = this._uniqueDisplayNameNumbersForRootTarget();
        return ++numbers.lastUniqueDisplayNameNumber;
    }

    _nextUniqueConsoleDisplayNameNumber()
    {
        let numbers = this._uniqueDisplayNameNumbersForRootTarget();
        return ++numbers.lastUniqueConsoleDisplayNameNumber;
    }

    _uniqueDisplayNameNumbersForRootTarget()
    {
        if (!WI.Script._uniqueDisplayNameNumbersForRootTargetMap)
            WI.Script._uniqueDisplayNameNumbersForRootTargetMap = new WeakMap();

        console.assert(this._target);
        let key = this._target.rootTarget;
        let numbers = WI.Script._uniqueDisplayNameNumbersForRootTargetMap.get(key);
        if (!numbers) {
            numbers = {
                lastUniqueDisplayNameNumber: 0,
                lastUniqueConsoleDisplayNameNumber: 0
            };
            WI.Script._uniqueDisplayNameNumbersForRootTargetMap.set(key, numbers);
        }
        return numbers;
    }

    _resolveResource()
    {
        // FIXME: We should be able to associate a Script with a Resource through identifiers,
        // we shouldn't need to lookup by URL, which is not safe with frames, where there might
        // be multiple resources with the same URL.
        // <rdar://problem/13373951> Scripts should be able to associate directly with a Resource

        // No URL, no resource.
        if (!this._url)
            return null;

        let isOtherTarget = this._target && this._target !== WI.mainTarget;
        let resolver = isOtherTarget ? this._target.resourceCollection : WI.networkManager;

        let filters = [
            (item) => item.type === WI.Resource.Type.Document || item.type === WI.Resource.Type.Script,
        ];

        // For `Worker`, the main resource might not get marked as a script by the time it's sent to the frontend.
        if (isOtherTarget && this._target instanceof WI.WorkerTarget && this.couldBeMainResource(this._target))
            filters.push((item) => WI.Resource.typeFromMIMEType(item.mimeType) === WI.Resource.Type.Script);

        try {
            for (let filter of filters) {
                // Try with the Script's full URL.
                let resource = resolver.resourcesForURL(this._url).find(filter);
                if (resource)
                    return resource;

                // Try with the Script's full decoded URL.
                let decodedURL = decodeURI(this._url);
                if (decodedURL !== this._url) {
                    resource = resolver.resourcesForURL(decodedURL).find(filter);
                    if (resource)
                        return resource;
                }

                // Next try removing any fragment in the original URL.
                let urlWithoutFragment = removeURLFragment(this._url);
                if (urlWithoutFragment !== this._url) {
                    resource = resolver.resourcesForURL(urlWithoutFragment).find(filter);
                    if (resource)
                        return resource;
                }

                // Finally try removing any fragment in the decoded URL.
                let decodedURLWithoutFragment = removeURLFragment(decodedURL);
                if (decodedURLWithoutFragment !== decodedURL) {
                    resource = resolver.resourcesForURL(decodedURLWithoutFragment).find(filter);
                    if (resource)
                        return resource;
                }
            }
        } catch { }

        if (!this.isMainResource()) {
            for (let frame of WI.networkManager.frames) {
                if (frame.mainResource.type === WI.Resource.Type.Document && frame.mainResource.url.startsWith(this._url))
                    return frame.mainResource;
            }
        }

        return null;
    }

    _makeSyntaxTree(sourceText)
    {
        if (this._scriptSyntaxTree || !sourceText)
            return;

        this._scriptSyntaxTree = new WI.ScriptSyntaxTree(sourceText, this);
    }
};

WI.Script.SourceType = {
    Program: "script-source-type-program",
    Module: "script-source-type-module",
};

WI.Script.TypeIdentifier = "script";
WI.Script.URLCookieKey = "script-url";
WI.Script.DisplayNameCookieKey = "script-display-name";
