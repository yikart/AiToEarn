/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
 * Copyright (C) 2011 Google Inc. All rights reserved.
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

WI.Resource = class Resource extends WI.SourceCode
{
    constructor(url, {mimeType, type, loaderIdentifier, targetId, requestIdentifier, requestMethod, requestHeaders, requestData, requestSentTimestamp, requestSentWalltime, referrerPolicy, integrity, initiatorStackTrace, initiatorSourceCodeLocation, initiatorNode} = {})
    {
        console.assert(url);
        console.assert(!initiatorStackTrace || initiatorStackTrace instanceof WI.StackTrace, initiatorStackTrace);

        super(url);

        if (type in WI.Resource.Type)
            type = WI.Resource.Type[type];
        else if (type === "Stylesheet") {
            // COMPATIBILITY (iOS 13): Page.ResourceType.Stylesheet was renamed to Page.ResourceType.StyleSheet.
            type = WI.Resource.Type.StyleSheet;
        }

        this._mimeType = mimeType;
        this._mimeTypeComponents = null;
        this._type = Resource.resolvedType(type, mimeType);
        this._loaderIdentifier = loaderIdentifier || null;
        this._requestIdentifier = requestIdentifier || null;
        this._queryStringParameters = undefined;
        this._requestFormParameters = undefined;
        this._requestMethod = requestMethod || null;
        this._requestData = requestData || null;
        this._requestHeaders = requestHeaders || {};
        this._responseHeaders = {};
        this._requestCookies = null;
        this._responseCookies = null;
        this._serverTimingEntries = null;
        this._parentFrame = null;
        this._initiatorStackTrace = initiatorStackTrace || null;
        this._initiatorSourceCodeLocation = initiatorSourceCodeLocation || null;
        this._initiatorNode = initiatorNode || null;
        this._initiatedResources = [];
        this._requestSentTimestamp = requestSentTimestamp || NaN;
        this._requestSentWalltime = requestSentWalltime || NaN;
        this._responseReceivedTimestamp = NaN;
        this._lastDataReceivedTimestamp = NaN;
        this._finishedOrFailedTimestamp = NaN;
        this._finishThenRequestContentPromise = null;
        this._statusCode = NaN;
        this._statusText = null;
        this._cached = false;
        this._canceled = false;
        this._finished = false;
        this._failed = false;
        this._failureReasonText = null;
        this._receivedNetworkLoadMetrics = false;
        this._responseSource = WI.Resource.ResponseSource.Unknown;
        this._security = null;
        this._timingData = new WI.ResourceTimingData(this);
        this._protocol = null;
        this._priority = WI.Resource.NetworkPriority.Unknown;
        this._remoteAddress = null;
        this._connectionIdentifier = null;
        this._isProxyConnection = false;
        this._target = targetId ? WI.targetManager.targetForIdentifier(targetId) : WI.mainTarget;
        this._redirects = [];
        this._referrerPolicy = referrerPolicy ?? null;
        this._integrity = integrity ?? null;

        // Exact sizes if loaded over the network or cache.
        this._requestHeadersTransferSize = NaN;
        this._requestBodyTransferSize = NaN;
        this._responseHeadersTransferSize = NaN;
        this._responseBodyTransferSize = NaN;
        this._responseBodySize = NaN;
        this._cachedResponseBodySize = NaN;

        // Estimated sizes (if backend does not provide metrics).
        this._estimatedSize = NaN;
        this._estimatedTransferSize = NaN;
        this._estimatedResponseHeadersSize = NaN;

        if (this._initiatorSourceCodeLocation && this._initiatorSourceCodeLocation.sourceCode instanceof WI.Resource)
            this._initiatorSourceCodeLocation.sourceCode.addInitiatedResource(this);
    }

    // Static

    static resolvedType(type, mimeType)
    {
        if (type && type !== WI.Resource.Type.Other)
            return type;

        return Resource.typeFromMIMEType(mimeType);
    }

    static typeFromMIMEType(mimeType)
    {
        if (!mimeType)
            return WI.Resource.Type.Other;

        mimeType = parseMIMEType(mimeType).type;

        if (mimeType in WI.Resource._mimeTypeMap)
            return WI.Resource._mimeTypeMap[mimeType];

        if (mimeType.startsWith("image/"))
            return WI.Resource.Type.Image;

        if (mimeType.startsWith("font/"))
            return WI.Resource.Type.Font;

        return WI.Resource.Type.Other;
    }

    static displayNameForType(type, plural)
    {
        switch (type) {
        case WI.Resource.Type.Document:
            if (plural)
                return WI.UIString("Documents");
            return WI.UIString("Document");
        case WI.Resource.Type.StyleSheet:
            if (plural)
                return WI.UIString("Style Sheets");
            return WI.UIString("Style Sheet");
        case WI.Resource.Type.Image:
            if (plural)
                return WI.UIString("Images");
            return WI.UIString("Image");
        case WI.Resource.Type.Font:
            if (plural)
                return WI.UIString("Fonts");
            return WI.UIString("Font");
        case WI.Resource.Type.Script:
            if (plural)
                return WI.UIString("Scripts");
            return WI.UIString("Script");
        case WI.Resource.Type.XHR:
            if (plural)
                return WI.UIString("XHRs");
            return WI.UIString("XHR");
        case WI.Resource.Type.Fetch:
            if (plural)
                return WI.UIString("Fetches", "Resources loaded via 'fetch' method");
            return WI.repeatedUIString.fetch();
        case WI.Resource.Type.Ping:
            if (plural)
                return WI.UIString("Pings");
            return WI.UIString("Ping");
        case WI.Resource.Type.Beacon:
            if (plural)
                return WI.UIString("Beacons");
            return WI.UIString("Beacon");
        case WI.Resource.Type.WebSocket:
            if (plural)
                return WI.UIString("Sockets");
            return WI.UIString("Socket");
        case WI.Resource.Type.EventSource:
            if (plural)
                return WI.UIString("EventSources", "Display name for the type of network requests sent via EventSource(s) API (https://developer.mozilla.org/en-US/docs/Web/API/EventSource)");
            return WI.UIString("EventSource", "Display name for the type of network requests sent via EventSource API (https://developer.mozilla.org/en-US/docs/Web/API/EventSource)");
        case WI.Resource.Type.Other:
            return WI.UIString("Other");
        default:
            console.error("Unknown resource type", type);
            return null;
        }
    }

    static classNamesForResource(resource)
    {
        let classes = [];

        let localResourceOverride = resource.localResourceOverride || WI.networkManager.localResourceOverridesForURL(resource.url).filter((localResourceOverride) => !localResourceOverride.disabled)[0];
        let isOverride = !!resource.localResourceOverride;
        let wasOverridden = resource.responseSource === WI.Resource.ResponseSource.InspectorOverride;
        let shouldBeOverridden = resource.isLoading() && localResourceOverride;
        let shouldBeBlocked = (resource.failed || isOverride) && localResourceOverride?.type === WI.LocalResourceOverride.InterceptType.Block;
        if (isOverride || wasOverridden || shouldBeOverridden || shouldBeBlocked) {
            classes.push("override");

            if (shouldBeBlocked || localResourceOverride?.type === WI.LocalResourceOverride.InterceptType.ResponseSkippingNetwork)
                classes.push("skip-network");

            if (localResourceOverride?.localResource.mappedFilePath)
                classes.push("mapped-file");
        }

        if (resource.type === WI.Resource.Type.Other) {
            if (resource.requestedByteRange)
                classes.push("resource-type-range");
        } else
            classes.push(resource.type);

        return classes;
    }

    static displayNameForProtocol(protocol)
    {
        switch (protocol) {
        case "h2":
            return "HTTP/2";
        case "http/1.0":
            return "HTTP/1.0";
        case "http/1.1":
            return "HTTP/1.1";
        case "spdy/2":
            return "SPDY/2";
        case "spdy/3":
            return "SPDY/3";
        case "spdy/3.1":
            return "SPDY/3.1";
        default:
            return null;
        }
    }

    static comparePriority(a, b)
    {
        console.assert(typeof a === "symbol");
        console.assert(typeof b === "symbol");

        const map = {
            [WI.Resource.NetworkPriority.Unknown]: 0,
            [WI.Resource.NetworkPriority.Low]: 1,
            [WI.Resource.NetworkPriority.Medium]: 2,
            [WI.Resource.NetworkPriority.High]: 3,
        };

        let aNum = map[a] || 0;
        let bNum = map[b] || 0;
        return aNum - bNum;
    }

    static displayNameForPriority(priority)
    {
        switch (priority) {
        case WI.Resource.NetworkPriority.Low:
            return WI.UIString("Low", "Low @ Network Priority", "Low network request priority");
        case WI.Resource.NetworkPriority.Medium:
            return WI.UIString("Medium", "Medium @ Network Priority", "Medium network request priority");
        case WI.Resource.NetworkPriority.High:
            return WI.UIString("High", "High @ Network Priority", "High network request priority");
        default:
            return null;
        }
    }

    static responseSourceFromPayload(source)
    {
        if (!source)
            return WI.Resource.ResponseSource.Unknown;

        switch (source) {
        case InspectorBackend.Enum.Network.ResponseSource.Unknown:
            return WI.Resource.ResponseSource.Unknown;
        case InspectorBackend.Enum.Network.ResponseSource.Network:
            return WI.Resource.ResponseSource.Network;
        case InspectorBackend.Enum.Network.ResponseSource.MemoryCache:
            return WI.Resource.ResponseSource.MemoryCache;
        case InspectorBackend.Enum.Network.ResponseSource.DiskCache:
            return WI.Resource.ResponseSource.DiskCache;
        case InspectorBackend.Enum.Network.ResponseSource.ServiceWorker:
            return WI.Resource.ResponseSource.ServiceWorker;
        case InspectorBackend.Enum.Network.ResponseSource.InspectorOverride:
            return WI.Resource.ResponseSource.InspectorOverride;
        default:
            console.error("Unknown response source type", source);
            return WI.Resource.ResponseSource.Unknown;
        }
    }

    static networkPriorityFromPayload(priority)
    {
        switch (priority) {
        case InspectorBackend.Enum.Network.MetricsPriority.Low:
            return WI.Resource.NetworkPriority.Low;
        case InspectorBackend.Enum.Network.MetricsPriority.Medium:
            return WI.Resource.NetworkPriority.Medium;
        case InspectorBackend.Enum.Network.MetricsPriority.High:
            return WI.Resource.NetworkPriority.High;
        default:
            console.error("Unknown metrics priority", priority);
            return WI.Resource.NetworkPriority.Unknown;
        }
    }

    static connectionIdentifierFromPayload(connectionIdentifier)
    {
        // Map backend connection identifiers to an easier to read number.
        if (!WI.Resource.connectionIdentifierMap) {
            WI.Resource.connectionIdentifierMap = new Map;
            WI.Resource.nextConnectionIdentifier = 1;
        }

        let id = WI.Resource.connectionIdentifierMap.get(connectionIdentifier);
        if (id)
            return id;

        id = WI.Resource.nextConnectionIdentifier++;
        WI.Resource.connectionIdentifierMap.set(connectionIdentifier, id);
        return id;
    }

    // Public

    get mimeType() { return this._mimeType; }
    get target() { return this._target; }
    get type() { return this._type; }
    get loaderIdentifier() { return this._loaderIdentifier; }
    get requestIdentifier() { return this._requestIdentifier; }
    get requestMethod() { return this._requestMethod; }
    get requestData() { return this._requestData; }
    get initiatorStackTrace() { return this._initiatorStackTrace; }
    get initiatorSourceCodeLocation() { return this._initiatorSourceCodeLocation; }
    get initiatorNode() { return this._initiatorNode; }
    get initiatedResources() { return this._initiatedResources; }
    get statusCode() { return this._statusCode; }
    get statusText() { return this._statusText; }
    get responseSource() { return this._responseSource; }
    get security() { return this._security; }
    get timingData() { return this._timingData; }
    get protocol() { return this._protocol; }
    get priority() { return this._priority; }
    get remoteAddress() { return this._remoteAddress; }
    get connectionIdentifier() { return this._connectionIdentifier; }
    get parentFrame() { return this._parentFrame; }
    get finished() { return this._finished; }
    get failed() { return this._failed; }
    get canceled() { return this._canceled; }
    get failureReasonText() { return this._failureReasonText; }
    get requestHeaders() { return this._requestHeaders; }
    get responseHeaders() { return this._responseHeaders; }
    get requestSentTimestamp() { return this._requestSentTimestamp; }
    get requestSentWalltime() { return this._requestSentWalltime; }
    get responseReceivedTimestamp() { return this._responseReceivedTimestamp; }
    get lastDataReceivedTimestamp() { return this._lastDataReceivedTimestamp; }
    get finishedOrFailedTimestamp() { return this._finishedOrFailedTimestamp; }
    get cached() { return this._cached; }
    get requestHeadersTransferSize() { return this._requestHeadersTransferSize; }
    get requestBodyTransferSize() { return this._requestBodyTransferSize; }
    get responseHeadersTransferSize() { return this._responseHeadersTransferSize; }
    get responseBodyTransferSize() { return this._responseBodyTransferSize; }
    get cachedResponseBodySize() { return this._cachedResponseBodySize; }
    get redirects() { return this._redirects; }
    get referrerPolicy() { return this._referrerPolicy; }
    get integrity() { return this._integrity; }

    get loadedSecurely()
    {
        if (this.urlComponents.scheme !== "https" && this.urlComponents.scheme !== "wss" && this.urlComponents.scheme !== "sftp")
            return false;
        if (isNaN(this._timingData.secureConnectionStart) && !isNaN(this._timingData.connectionStart))
            return false;
        return true;
    }

    get isScript()
    {
        return this._type === Resource.Type.Script;
    }

    get supportsScriptBlackboxing()
    {
        if (this.localResourceOverride)
            return false;
        if (!this.finished || this.failed)
            return false;
        return super.supportsScriptBlackboxing;
    }

    get displayName()
    {
        return WI.displayNameForURL(this._url, this.urlComponents);
    }

    get displayURL()
    {
        const isMultiLine = true;
        const dataURIMaxSize = 64;
        return WI.truncateURL(this._url, isMultiLine, dataURIMaxSize);
    }

    get displayRemoteAddress()
    {
        if (this._isProxyConnection)
            return WI.UIString("%s (Proxy)", "%s (Proxy) @ Resource Remote Address", "Label for the IP address of a proxy server used to retrieve a network resource.").format(this._remoteAddress);

        return this._remoteAddress;
    }

    get mimeTypeComponents()
    {
        if (!this._mimeTypeComponents)
            this._mimeTypeComponents = parseMIMEType(this._mimeType);
        return this._mimeTypeComponents;
    }

    get syntheticMIMEType()
    {
        // Resources are often transferred with a MIME-type that doesn't match the purpose the
        // resource was loaded for, which is what WI.Resource.Type represents.
        // This getter generates a MIME-type, if needed, that matches the resource type.

        // If the type matches the Resource.Type of the MIME-type, then return the actual MIME-type.
        if (this._type === WI.Resource.typeFromMIMEType(this._mimeType))
            return this._mimeType;

        // Return the default MIME-types for the Resource.Type, since the current MIME-type
        // does not match what is expected for the Resource.Type.
        switch (this._type) {
        case WI.Resource.Type.StyleSheet:
            return "text/css";
        case WI.Resource.Type.Script:
            return "text/javascript";
        }

        // Return the actual MIME-type since we don't have a better synthesized one to return.
        return this._mimeType;
    }

    get hasMetadata()
    {
        // Some metadata is only collected when Web Inspector is open (e.g. resource timing data, HTTP method, request headers, etc.).
        // Use `_requestIdentifier` as a general signal since it is always included when metadata is collected.
        return !!this._requestIdentifier;
    }

    createObjectURL()
    {
        let revision = this.currentRevision;
        let blobContent = revision.blobContent;
        if (blobContent)
            return URL.createObjectURL(blobContent)

        // If content is not available, fallback to using original URL.
        // The client may try to revoke it, but nothing will happen.
        return this._url;
    }

    isMainResource()
    {
        return this._parentFrame ? this._parentFrame.mainResource === this : false;
    }

    addInitiatedResource(resource)
    {
        if (!(resource instanceof WI.Resource))
            return;

        this._initiatedResources.push(resource);

        this.dispatchEventToListeners(WI.Resource.Event.InitiatedResourcesDidChange);
    }

    get queryStringParameters()
    {
        if (this._queryStringParameters === undefined)
            this._queryStringParameters = parseQueryString(this.urlComponents.queryString, true);
        return this._queryStringParameters;
    }

    get requestFormParameters()
    {
        if (this._requestFormParameters === undefined)
            this._requestFormParameters = this.hasRequestFormParameters() ? parseQueryString(this.requestData, true) : null;
        return this._requestFormParameters;
    }

    get requestDataContentType()
    {
        return this._requestHeaders.valueForCaseInsensitiveKey("Content-Type") || null;
    }

    get requestCookies()
    {
        if (!this._requestCookies)
            this._requestCookies = WI.Cookie.parseCookieRequestHeader(this._requestHeaders.valueForCaseInsensitiveKey("Cookie"));

        return this._requestCookies;
    }

    get responseCookies()
    {
        if (!this._responseCookies) {
            // FIXME: The backend sends multiple "Set-Cookie" headers in one "Set-Cookie" with multiple values
            // separated by ", ". This doesn't allow us to safely distinguish between a ", " that separates
            // multiple headers or one that may be valid part of a Cookie's value or attribute, such as the
            // ", " in the the date format "Expires=Tue, 03-Oct-2017 04:39:21 GMT". To improve heuristics
            // we do a negative lookahead for numbers, but we can still fail on cookie values containing ", ".
            let rawCombinedHeader = this._responseHeaders.valueForCaseInsensitiveKey("Set-Cookie") || "";
            let setCookieHeaders = rawCombinedHeader.split(/, (?![0-9])/);
            let cookies = [];
            for (let header of setCookieHeaders) {
                let cookie = WI.Cookie.parseSetCookieResponseHeader(header);
                if (cookie)
                    cookies.push(cookie);
            }
            this._responseCookies = cookies;
        }

        return this._responseCookies;
    }

    get requestSentDate()
    {
        return isNaN(this._requestSentWalltime) ? null : new Date(this._requestSentWalltime * 1000);
    }

    get lastRedirectReceivedTimestamp()
    {
        return this._redirects.length ? this._redirects.lastValue.timestamp : NaN;
    }

    get firstTimestamp()
    {
        return this.timingData.startTime || this.lastRedirectReceivedTimestamp || this.responseReceivedTimestamp || this.lastDataReceivedTimestamp || this.finishedOrFailedTimestamp;
    }

    get lastTimestamp()
    {
        return this.timingData.responseEnd || this.lastDataReceivedTimestamp || this.responseReceivedTimestamp || this.lastRedirectReceivedTimestamp || this.requestSentTimestamp;
    }

    get latency()
    {
        return this.timingData.responseStart - this.timingData.requestStart;
    }

    get receiveDuration()
    {
        return this.timingData.responseEnd - this.timingData.responseStart;
    }

    get totalDuration()
    {
        return this.timingData.responseEnd - this.timingData.startTime;
    }

    get size()
    {
        if (!isNaN(this._cachedResponseBodySize))
            return this._cachedResponseBodySize;

        if (!isNaN(this._responseBodySize) && this._responseBodySize !== 0)
            return this._responseBodySize;

        return this._estimatedSize;
    }

    get networkEncodedSize()
    {
        return this._responseBodyTransferSize;
    }

    get networkDecodedSize()
    {
        return this._responseBodySize;
    }

    get networkTotalTransferSize()
    {
        return this._responseHeadersTransferSize + this._responseBodyTransferSize;
    }

    get estimatedNetworkEncodedSize()
    {
        let exact = this.networkEncodedSize;
        if (!isNaN(exact))
            return exact;

        if (this._cached)
            return 0;

        // FIXME: <https://webkit.org/b/158463> Network: Correctly report encoded data length (transfer size) from CFNetwork to NetworkResourceLoader
        // macOS provides the decoded transfer size instead of the encoded size
        // for estimatedTransferSize. So prefer the "Content-Length" property
        // on mac if it is available.
        if (WI.Platform.name === "mac") {
            let contentLength = Number(this._responseHeaders.valueForCaseInsensitiveKey("Content-Length"));
            if (!isNaN(contentLength))
                return contentLength;
        }

        if (!isNaN(this._estimatedTransferSize))
            return this._estimatedTransferSize;

        // If we did not receive actual transfer size from network
        // stack, we prefer using Content-Length over resourceSize as
        // resourceSize may differ from actual transfer size if platform's
        // network stack performed decoding (e.g. gzip decompression).
        // The Content-Length, though, is expected to come from raw
        // response headers and will reflect actual transfer length.
        // This won't work for chunked content encoding, so fall back to
        // resourceSize when we don't have Content-Length. This still won't
        // work for chunks with non-trivial encodings. We need a way to
        // get actual transfer size from the network stack.

        return Number(this._responseHeaders.valueForCaseInsensitiveKey("Content-Length") || this._estimatedSize);
    }

    get estimatedTotalTransferSize()
    {
        let exact = this.networkTotalTransferSize;
        if (!isNaN(exact))
            return exact;

        if (this.statusCode === 304) // Not modified
            return this._estimatedResponseHeadersSize;

        if (this._cached)
            return 0;

        return this._estimatedResponseHeadersSize + this.estimatedNetworkEncodedSize;
    }

    get compressed()
    {
        let contentEncoding = this._responseHeaders.valueForCaseInsensitiveKey("Content-Encoding");
        return !!(contentEncoding && /\b(?:gzip|deflate|br)\b/.test(contentEncoding));
    }

    get requestedByteRange()
    {
        let range = this._requestHeaders.valueForCaseInsensitiveKey("Range");
        if (!range)
            return null;

        let rangeValues = range.match(/bytes=(\d+)-(\d+)/);
        if (!rangeValues)
            return null;

        let start = parseInt(rangeValues[1]);
        if (isNaN(start))
            return null;

        let end = parseInt(rangeValues[2]);
        if (isNaN(end))
            return null;

        return {start, end};
    }

    get scripts()
    {
        return this._scripts || [];
    }

    get serverTiming()
    {
        if (!this._serverTimingEntries)
            this._serverTimingEntries = WI.ServerTimingEntry.parseHeaders(this._responseHeaders.valueForCaseInsensitiveKey("Server-Timing"));
        return this._serverTimingEntries;
    }

    scriptForLocation(sourceCodeLocation)
    {
        console.assert(!(this instanceof WI.SourceMapResource));
        console.assert(sourceCodeLocation.sourceCode === this, "SourceCodeLocation must be in this Resource");
        if (sourceCodeLocation.sourceCode !== this)
            return null;

        var lineNumber = sourceCodeLocation.lineNumber;
        var columnNumber = sourceCodeLocation.columnNumber;
        for (var i = 0; i < this._scripts.length; ++i) {
            var script = this._scripts[i];
            if (script.range.startLine <= lineNumber && script.range.endLine >= lineNumber) {
                if (script.range.startLine === lineNumber && columnNumber < script.range.startColumn)
                    continue;
                if (script.range.endLine === lineNumber && columnNumber > script.range.endColumn)
                    continue;
                return script;
            }
        }

        return null;
    }

    updateForRedirectResponse(request, response, elapsedTime, walltime)
    {
        console.assert(!this._finished);
        console.assert(!this._failed);
        console.assert(!this._canceled);

        let oldURL = this._url;
        let oldHeaders = this._requestHeaders;
        let oldMethod = this._requestMethod;

        if (request.url)
            this._url = request.url;

        this._requestHeaders = request.headers || {};
        this._requestCookies = null;
        this._requestMethod = request.method || null;
        this._redirects.push(new WI.Redirect(oldURL, oldMethod, oldHeaders, response.status, response.statusText, response.headers, elapsedTime));
        this._referrerPolicy = request.referrerPolicy ?? null;
        this._integrity = request.integrity ?? null;

        if (oldURL !== request.url) {
            // Delete the URL components so the URL is re-parsed the next time it is requested.
            this._urlComponents = null;

            this.dispatchEventToListeners(WI.Resource.Event.URLDidChange, {oldURL});
        }

        this.dispatchEventToListeners(WI.Resource.Event.RequestHeadersDidChange);
        this.dispatchEventToListeners(WI.Resource.Event.TimestampsDidChange);
    }

    hasResponse()
    {
        return !isNaN(this._statusCode) || this._finished || this._failed;
    }

    hasRequestFormParameters()
    {
        let requestDataContentType = this.requestDataContentType;
        return requestDataContentType && requestDataContentType.match(/^application\/x-www-form-urlencoded\s*(;.*)?$/i);
    }

    updateForResponse(url, mimeType, type, responseHeaders, statusCode, statusText, elapsedTime, timingData, source, security)
    {
        console.assert(!this._finished);
        console.assert(!this._failed);
        console.assert(!this._canceled);

        let oldURL = this._url;
        let oldMIMEType = this._mimeType;
        let oldType = this._type;

        if (type in WI.Resource.Type)
            type = WI.Resource.Type[type];
        else if (type === "Stylesheet") {
            // COMPATIBILITY (iOS 13): Page.ResourceType.Stylesheet was renamed to Page.ResourceType.StyleSheet.
            type = WI.Resource.Type.StyleSheet;
        }

        if (url)
            this._url = url;

        this._mimeType = mimeType;
        this._type = Resource.resolvedType(type, mimeType);
        this._statusCode = statusCode;
        this._statusText = statusText;
        this._responseHeaders = responseHeaders || {};
        this._responseCookies = null;
        this._serverTimingEntries = null;
        this._responseReceivedTimestamp = elapsedTime || NaN;
        this._timingData = WI.ResourceTimingData.fromPayload(timingData, this);

        if (source)
            this._responseSource = WI.Resource.responseSourceFromPayload(source);

        this._security = security || {};

        const headerBaseSize = 12; // Length of "HTTP/1.1 ", " ", and "\r\n".
        const headerPad = 4; // Length of ": " and "\r\n".
        this._estimatedResponseHeadersSize = String(this._statusCode).length + this._statusText.length + headerBaseSize;
        for (let name in this._responseHeaders)
            this._estimatedResponseHeadersSize += name.length + this._responseHeaders[name].length + headerPad;

        if (!this._cached) {
            if (statusCode === 304 || (this._responseSource === WI.Resource.ResponseSource.MemoryCache || this._responseSource === WI.Resource.ResponseSource.DiskCache))
                this.markAsCached();
        }

        if (oldURL !== url) {
            // Delete the URL components so the URL is re-parsed the next time it is requested.
            this._urlComponents = null;

            this.dispatchEventToListeners(WI.Resource.Event.URLDidChange, {oldURL});
        }

        if (oldMIMEType !== mimeType) {
            // Delete the MIME-type components so the MIME-type is re-parsed the next time it is requested.
            this._mimeTypeComponents = null;

            this.dispatchEventToListeners(WI.Resource.Event.MIMETypeDidChange, {oldMIMEType});
        }

        if (oldType !== type)
            this.dispatchEventToListeners(WI.Resource.Event.TypeDidChange, {oldType});

        console.assert(isNaN(this._estimatedSize));
        console.assert(isNaN(this._estimatedTransferSize));

        // The transferSize becomes 0 when status is 304 or Content-Length is available, so
        // notify listeners of that change.
        if (statusCode === 304 || this._responseHeaders.valueForCaseInsensitiveKey("Content-Length"))
            this.dispatchEventToListeners(WI.Resource.Event.TransferSizeDidChange);

        this.dispatchEventToListeners(WI.Resource.Event.ResponseReceived);
        this.dispatchEventToListeners(WI.Resource.Event.TimestampsDidChange);
    }

    updateWithMetrics(metrics)
    {
        this._receivedNetworkLoadMetrics = true;

        if (metrics.protocol)
            this._protocol = metrics.protocol;
        if (metrics.priority)
            this._priority = WI.Resource.networkPriorityFromPayload(metrics.priority);
        if (metrics.remoteAddress)
            this._remoteAddress = metrics.remoteAddress;
        if (metrics.connectionIdentifier)
            this._connectionIdentifier = WI.Resource.connectionIdentifierFromPayload(metrics.connectionIdentifier);
        if (metrics.requestHeaders) {
            this._requestHeaders = metrics.requestHeaders;
            this._requestCookies = null;
            this.dispatchEventToListeners(WI.Resource.Event.RequestHeadersDidChange);
        }

        if ("requestHeaderBytesSent" in metrics) {
            this._requestHeadersTransferSize = metrics.requestHeaderBytesSent;
            this._requestBodyTransferSize = metrics.requestBodyBytesSent;
            this._responseHeadersTransferSize = metrics.responseHeaderBytesReceived;
            this._responseBodyTransferSize = metrics.responseBodyBytesReceived;
            this._responseBodySize = metrics.responseBodyDecodedSize;

            console.assert(this._requestHeadersTransferSize >= 0);
            console.assert(this._requestBodyTransferSize >= 0);
            console.assert(this._responseHeadersTransferSize >= 0);
            console.assert(this._responseBodyTransferSize >= 0);
            console.assert(this._responseBodySize >= 0);

            // There may have been no size updates received during load if Content-Length was 0.
            if (isNaN(this._estimatedSize))
                this._estimatedSize = 0;

            this.dispatchEventToListeners(WI.Resource.Event.SizeDidChange, {previousSize: this._estimatedSize});
            this.dispatchEventToListeners(WI.Resource.Event.TransferSizeDidChange);
        }

        if (metrics.securityConnection) {
            if (!this._security)
                this._security = {};
            this._security.connection = metrics.securityConnection;
        }

        this._isProxyConnection = !!metrics.isProxyConnection;

        this.dispatchEventToListeners(WI.Resource.Event.MetricsDidChange);
    }

    setCachedResponseBodySize(size)
    {
        console.assert(!isNaN(size), "Size should be a valid number.");
        console.assert(isNaN(this._cachedResponseBodySize), "This should only be set once.");
        console.assert(this._estimatedSize === size, "The legacy path was updated already and matches.");

        this._cachedResponseBodySize = size;
    }

    requestContentFromBackend()
    {
        let specialContentPromise = WI.SourceCode.generateSpecialContentForURL(this._url);
        if (specialContentPromise)
            return specialContentPromise;

        if (this._target.type === WI.TargetType.Worker) {
            console.assert(this.isScript);
            let scriptForTarget = this.scripts.find((script) => script.target === this._target);
            console.assert(scriptForTarget);
            if (scriptForTarget)
                return scriptForTarget.requestContentFromBackend();
        } else {
            // If we have the requestIdentifier we can get the actual response for this specific resource.
            // Otherwise the content will be cached resource data, which might not exist anymore.
            if (this._requestIdentifier)
                return this._target.NetworkAgent.getResponseBody(this._requestIdentifier);

            // There is no request identifier or frame to request content from.
            if (this._parentFrame)
                return this._target.PageAgent.getResourceContent(this._parentFrame.id, this._url);
        }

        return Promise.reject(new Error("Content request failed."));
    }

    increaseSize(dataLength, elapsedTime)
    {
        console.assert(dataLength >= 0);
        console.assert(!this._receivedNetworkLoadMetrics, "If we received metrics we don't need to change the estimated size.");

        if (isNaN(this._estimatedSize))
            this._estimatedSize = 0;

        let previousSize = this._estimatedSize;

        this._estimatedSize += dataLength;

        this._lastDataReceivedTimestamp = elapsedTime || NaN;

        this.dispatchEventToListeners(WI.Resource.Event.SizeDidChange, {previousSize});

        // The estimatedTransferSize is based off of size when status is not 304 or Content-Length is missing.
        if (isNaN(this._estimatedTransferSize) && this._statusCode !== 304 && !this._responseHeaders.valueForCaseInsensitiveKey("Content-Length"))
            this.dispatchEventToListeners(WI.Resource.Event.TransferSizeDidChange);
    }

    increaseTransferSize(encodedDataLength)
    {
        console.assert(encodedDataLength >= 0);
        console.assert(!this._receivedNetworkLoadMetrics, "If we received metrics we don't need to change the estimated transfer size.");

        if (isNaN(this._estimatedTransferSize))
            this._estimatedTransferSize = 0;
        this._estimatedTransferSize += encodedDataLength;

        this.dispatchEventToListeners(WI.Resource.Event.TransferSizeDidChange);
    }

    markAsCached()
    {
        this._cached = true;

        this.dispatchEventToListeners(WI.Resource.Event.CacheStatusDidChange);

        // The transferSize starts returning 0 when cached is true, unless status is 304.
        if (this._statusCode !== 304)
            this.dispatchEventToListeners(WI.Resource.Event.TransferSizeDidChange);
    }

    markAsFinished(elapsedTime)
    {
        console.assert(!this._failed);
        console.assert(!this._canceled);

        this._finished = true;
        this._finishedOrFailedTimestamp = elapsedTime || NaN;
        this._timingData.markResponseEndTime(elapsedTime || NaN);

        if (this._finishThenRequestContentPromise)
            this._finishThenRequestContentPromise = null;

        this.dispatchEventToListeners(WI.Resource.Event.LoadingDidFinish);
        this.dispatchEventToListeners(WI.Resource.Event.TimestampsDidChange);
    }

    markAsFailed(canceled, elapsedTime, errorText)
    {
        console.assert(!this._finished);

        this._failed = true;
        this._canceled = canceled;
        this._finishedOrFailedTimestamp = elapsedTime || NaN;

        if (!this._failureReasonText)
            this._failureReasonText = errorText || null;

        this.dispatchEventToListeners(WI.Resource.Event.LoadingDidFail);
        this.dispatchEventToListeners(WI.Resource.Event.TimestampsDidChange);
    }

    revertMarkAsFinished()
    {
        console.assert(!this._failed);
        console.assert(!this._canceled);
        console.assert(this._finished);

        this._finished = false;
        this._finishedOrFailedTimestamp = NaN;
    }

    isLoading()
    {
        return !this._finished && !this._failed;
    }

    hadLoadingError()
    {
        return this._failed || this._canceled || this._statusCode >= 400;
    }

    getImageSize(callback)
    {
        // Throw an error in the case this resource is not an image.
        if (this.type !== WI.Resource.Type.Image)
            throw "Resource is not an image.";

        // See if we've already computed and cached the image size,
        // in which case we can provide them directly.
        if (this._imageSize !== undefined) {
            callback(this._imageSize);
            return;
        }

        var objectURL = null;

        // Event handler for the image "load" event.
        function imageDidLoad() {
            URL.revokeObjectURL(objectURL);

            // Cache the image metrics.
            this._imageSize = {
                width: image.width,
                height: image.height
            };

            callback(this._imageSize);
        }

        function requestContentFailure() {
            this._imageSize = null;
            callback(this._imageSize);
        }

        // Create an <img> element that we'll use to load the image resource
        // so that we can query its intrinsic size.
        var image = new Image;
        image.addEventListener("load", imageDidLoad.bind(this), false);

        // Set the image source using an object URL once we've obtained its data.
        this.requestContent().then((content) => {
            objectURL = image.src = content.sourceCode.createObjectURL();
            if (!objectURL)
                requestContentFailure.call(this);
        }, requestContentFailure.bind(this));
    }

    requestContent()
    {
        if (this._finished)
            return super.requestContent().catch(this._requestContentFailure.bind(this));

        if (this._failed)
            return this._requestContentFailure();

        if (!this._finishThenRequestContentPromise) {
            this._finishThenRequestContentPromise = new Promise((resolve, reject) => {
                this.singleFireEventListener(WI.Resource.Event.LoadingDidFinish, resolve, this);
                this.singleFireEventListener(WI.Resource.Event.LoadingDidFail, reject, this);
            }).then(this.requestContent.bind(this));
        }

        return this._finishThenRequestContentPromise;
    }

    associateWithScript(script)
    {
        if (!this._scripts)
            this._scripts = [];

        this._scripts.push(script);

        if (this._type === WI.Resource.Type.Other || this._type === WI.Resource.Type.XHR) {
            let oldType = this._type;
            this._type = WI.Resource.Type.Script;
            this.dispatchEventToListeners(WI.Resource.Event.TypeDidChange, {oldType});
        }
    }

    saveIdentityToCookie(cookie)
    {
        cookie[WI.Resource.URLCookieKey] = this.url.hash;
        cookie[WI.Resource.MainResourceCookieKey] = this.isMainResource();
    }

    async createLocalResourceOverride(type, {mimeType, base64Encoded, content} = {})
    {
        console.assert(!this.localResourceOverride);
        console.assert(WI.NetworkManager.supportsOverridingResponses());

        let resourceData = {
            requestURL: this.url,
        };

        switch (type) {
        case WI.LocalResourceOverride.InterceptType.Request:
            resourceData.requestMethod = this.requestMethod ?? WI.HTTPUtilities.RequestMethod.GET;
            resourceData.requestHeaders = Object.shallowCopy(this.requestHeaders);
            resourceData.requestData = this.requestData ?? "";
            break;

        case WI.LocalResourceOverride.InterceptType.Response:
        case WI.LocalResourceOverride.InterceptType.ResponseSkippingNetwork:
            resourceData.responseMIMEType = this.mimeType ?? WI.mimeTypeForFileExtension(WI.fileExtensionForFilename(this.urlComponents.lastPathComponent));
            resourceData.responseStatusCode = this.statusCode;
            resourceData.responseStatusText = this.statusText;
            if (!resourceData.responseStatusCode) {
                resourceData.responseStatusCode = 200;
                resourceData.responseStatusText = null;
            }
            resourceData.responseStatusText ||= WI.HTTPUtilities.statusTextForStatusCode(resourceData.responseStatusCode);

            if (base64Encoded === undefined || content === undefined) {
                try {
                    let {rawContent, rawBase64Encoded} = await this.requestContent();
                    content ??= rawContent;
                    base64Encoded ??= rawBase64Encoded;
                } catch {
                    content ??= "";
                    base64Encoded ??= !WI.shouldTreatMIMETypeAsText(resourceData.mimeType);
                }
            }
            resourceData.responseContent = content;
            resourceData.responseBase64Encoded = base64Encoded;
            resourceData.responseHeaders = Object.shallowCopy(this.responseHeaders);
            break;
        }

        return WI.LocalResourceOverride.create(this.url, type, resourceData);
    }

    updateLocalResourceOverrideRequestData(data)
    {
        console.assert(this.localResourceOverride);

        if (data === this._requestData)
            return;

        this._requestData = data;

        this.dispatchEventToListeners(WI.Resource.Event.RequestDataDidChange);
    }

    generateFetchCode()
    {
        let options = {};

        if (this.requestData)
            options.body = this.requestData;

        options.cache = "default";
        options.credentials = (this.requestCookies.length || this._requestHeaders.valueForCaseInsensitiveKey("Authorization")) ? "include" : "omit";

        // https://fetch.spec.whatwg.org/#forbidden-header-name
        const forbiddenHeaders = new Set([
            "accept-charset",
            "accept-encoding",
            "access-control-request-headers",
            "access-control-request-method",
            "connection",
            "content-length",
            "cookie",
            "cookie2",
            "date",
            "dnt",
            "expect",
            "host",
            "keep-alive",
            "origin",
            "referer",
            "te",
            "trailer",
            "transfer-encoding",
            "upgrade",
            "via",
        ]);
        let headers = Object.entries(this.requestHeaders)
            .filter((header) => {
                let key = header[0].toLowerCase();
                if (forbiddenHeaders.has(key))
                    return false;
                if (key.startsWith("proxy-") || key.startsWith("sec-"))
                    return false;
                return true;
            })
            .sort((a, b) => a[0].extendedLocaleCompare(b[0]))
            .reduce((accumulator, current) => {
                accumulator[current[0]] = current[1];
                return accumulator;
            }, {});
        if (!isEmptyObject(headers))
            options.headers = headers;

        if (this._integrity)
            options.integrity = this._integrity;

        if (this.requestMethod)
            options.method = this.requestMethod;

        options.mode = "cors";
        options.redirect = "follow";

        let referrer = this.requestHeaders.valueForCaseInsensitiveKey("Referer");
        if (referrer)
            options.referrer = referrer;

        if (this._referrerPolicy)
            options.referrerPolicy = this._referrerPolicy;

        return `fetch(${JSON.stringify(this.url)}, ${JSON.stringify(options, null, WI.indentString())})`;
    }

    generateCURLCommand()
    {
        function escapeStringPosix(str) {
            function escapeCharacter(x) {
                let code = x.charCodeAt(0);
                let hex = code.toString(16);
                if (code < 256)
                    return "\\x" + hex.padStart(2, "0");
                return "\\u" + hex.padStart(4, "0");
            }

            if (/[^\x20-\x7E]|'/.test(str)) {
                // Use ANSI-C quoting syntax.
                return "$'" + str.replace(/\\/g, "\\\\")
                                 .replace(/'/g, "\\'")
                                 .replace(/\n/g, "\\n")
                                 .replace(/\r/g, "\\r")
                                 .replace(/!/g, "\\041")
                                 .replace(/[^\x20-\x7E]/g, escapeCharacter) + "'";
            }

            // Use single quote syntax.
            return `'${str}'`;
        }

        let command = ["curl " + escapeStringPosix(this.url).replace(/[[{}\]]/g, "\\$&")];
        command.push("-X " + escapeStringPosix(this.requestMethod));

        for (let key in this.requestHeaders)
            command.push("-H " + escapeStringPosix(`${key}: ${this.requestHeaders[key]}`));

        if (this.requestDataContentType && this.requestMethod !== WI.HTTPUtilities.RequestMethod.GET && this.requestData) {
            if (this.requestDataContentType.match(/^application\/x-www-form-urlencoded\s*(;.*)?$/i))
                command.push("--data " + escapeStringPosix(this.requestData));
            else
                command.push("--data-binary " + escapeStringPosix(this.requestData));
        }

        return command.join(" \\\n");
    }

    stringifyHTTPRequest()
    {
        let lines = [];

        let protocol = this.protocol || "";
        if (protocol === "h2") {
            // HTTP/2 Request pseudo headers:
            // https://tools.ietf.org/html/rfc7540#section-8.1.2.3
            lines.push(`:method: ${this.requestMethod}`);
            lines.push(`:scheme: ${this.urlComponents.scheme}`);
            lines.push(`:authority: ${WI.h2Authority(this.urlComponents)}`);
            lines.push(`:path: ${WI.h2Path(this.urlComponents)}`);
        } else {
            // HTTP/1.1 request line:
            // https://www.w3.org/Protocols/rfc2616/rfc2616-sec5.html#sec5.1
            lines.push(`${this.requestMethod} ${this.urlComponents.path}${protocol ? " " + protocol.toUpperCase() : ""}`);
        }

        for (let key in this.requestHeaders)
            lines.push(`${key}: ${this.requestHeaders[key]}`);

        return lines.join("\n") + "\n";
    }

    stringifyHTTPResponse()
    {
        let lines = [];

        let protocol = this.protocol || "";
        if (protocol === "h2") {
            // HTTP/2 Response pseudo headers:
            // https://tools.ietf.org/html/rfc7540#section-8.1.2.4
            lines.push(`:status: ${this.statusCode}`);
        } else {
            // HTTP/1.1 response status line:
            // https://www.w3.org/Protocols/rfc2616/rfc2616-sec6.html#sec6.1
            lines.push(`${protocol ? protocol.toUpperCase() + " " : ""}${this.statusCode} ${this.statusText}`);
        }

        for (let key in this.responseHeaders)
            lines.push(`${key}: ${this.responseHeaders[key]}`);

        return lines.join("\n") + "\n";
    }

    async showCertificate()
    {
        let errorString = WI.UIString("Unable to show certificate for \u201C%s\u201D").format(this.url);

        try {
            let {serializedCertificate} = await this._target.NetworkAgent.getSerializedCertificate(this._requestIdentifier);
            if (InspectorFrontendHost.showCertificate(serializedCertificate))
                return;
        } catch (e) {
            console.error(e);
            throw errorString;
        }

        let consoleMessage = new WI.ConsoleMessage(this._target, WI.ConsoleMessage.MessageSource.Other, WI.ConsoleMessage.MessageLevel.Error, errorString);
        consoleMessage.shouldRevealConsole = true;
        WI.consoleLogViewController.appendConsoleMessage(consoleMessage);

        throw errorString;
    }

    // Private

    _requestContentFailure(error)
    {
        return Promise.resolve({
            error: WI.UIString("An error occurred trying to load the resource."),
            reason: error?.message || this._failureReasonText,
            sourceCode: this,
        });
    }
};

WI.Resource.TypeIdentifier = "resource";
WI.Resource.URLCookieKey = "resource-url";
WI.Resource.MainResourceCookieKey = "resource-is-main-resource";

WI.Resource.Event = {
    URLDidChange: "resource-url-did-change",
    MIMETypeDidChange: "resource-mime-type-did-change",
    TypeDidChange: "resource-type-did-change",
    RequestHeadersDidChange: "resource-request-headers-did-change",
    RequestDataDidChange: "resource-request-data-did-change",
    ResponseReceived: "resource-response-received",
    LoadingDidFinish: "resource-loading-did-finish",
    LoadingDidFail: "resource-loading-did-fail",
    TimestampsDidChange: "resource-timestamps-did-change",
    SizeDidChange: "resource-size-did-change",
    TransferSizeDidChange: "resource-transfer-size-did-change",
    CacheStatusDidChange: "resource-cached-did-change",
    MetricsDidChange: "resource-metrics-did-change",
    InitiatedResourcesDidChange: "resource-initiated-resources-did-change",
};

// Keep these in sync with the "ResourceType" enum defined by the "Page" domain.
WI.Resource.Type = {
    Document: "resource-type-document",
    StyleSheet: "resource-type-style-sheet",
    Image: "resource-type-image",
    Font: "resource-type-font",
    Script: "resource-type-script",
    XHR: "resource-type-xhr",
    Fetch: "resource-type-fetch",
    Ping: "resource-type-ping",
    Beacon: "resource-type-beacon",
    WebSocket: "resource-type-websocket",
    EventSource: "resource-type-eventsource",
    Other: "resource-type-other",
};

WI.Resource.ResponseSource = {
    Unknown: Symbol("unknown"),
    Network: Symbol("network"),
    MemoryCache: Symbol("memory-cache"),
    DiskCache: Symbol("disk-cache"),
    ServiceWorker: Symbol("service-worker"),
    InspectorOverride: Symbol("inspector-override"),
};

WI.Resource.NetworkPriority = {
    Unknown: Symbol("unknown"),
    Low: Symbol("low"),
    Medium: Symbol("medium"),
    High: Symbol("high"),
};

WI.Resource.GroupingMode = {
    Path: "group-resource-by-path",
    Type: "group-resource-by-type",
};
WI.settings.resourceGroupingMode = new WI.Setting("resource-grouping-mode", WI.Resource.GroupingMode.Type);

// This MIME Type map is private, use WI.Resource.typeFromMIMEType().
WI.Resource._mimeTypeMap = {
    "text/html": WI.Resource.Type.Document,
    "text/xml": WI.Resource.Type.Document,
    "application/xhtml+xml": WI.Resource.Type.Document,

    "text/plain": WI.Resource.Type.Other,

    "text/css": WI.Resource.Type.StyleSheet,
    "text/xsl": WI.Resource.Type.StyleSheet,
    "text/x-less": WI.Resource.Type.StyleSheet,
    "text/x-sass": WI.Resource.Type.StyleSheet,
    "text/x-scss": WI.Resource.Type.StyleSheet,

    "application/pdf": WI.Resource.Type.Image,
    "image/svg+xml": WI.Resource.Type.Image,

    "application/x-font-type1": WI.Resource.Type.Font,
    "application/x-font-ttf": WI.Resource.Type.Font,
    "application/x-font-woff": WI.Resource.Type.Font,
    "application/x-truetype-font": WI.Resource.Type.Font,

    "text/javascript": WI.Resource.Type.Script,
    "text/ecmascript": WI.Resource.Type.Script,
    "application/javascript": WI.Resource.Type.Script,
    "application/ecmascript": WI.Resource.Type.Script,
    "application/x-javascript": WI.Resource.Type.Script,
    "application/json": WI.Resource.Type.Script,
    "application/x-json": WI.Resource.Type.Script,
    "text/x-javascript": WI.Resource.Type.Script,
    "text/x-json": WI.Resource.Type.Script,
    "text/javascript1.1": WI.Resource.Type.Script,
    "text/javascript1.2": WI.Resource.Type.Script,
    "text/javascript1.3": WI.Resource.Type.Script,
    "text/jscript": WI.Resource.Type.Script,
    "text/livescript": WI.Resource.Type.Script,
    "text/x-livescript": WI.Resource.Type.Script,
    "text/typescript": WI.Resource.Type.Script,
    "text/typescript-jsx": WI.Resource.Type.Script,
    "text/jsx": WI.Resource.Type.Script,
    "text/x-clojure": WI.Resource.Type.Script,
    "text/x-coffeescript": WI.Resource.Type.Script,
};
