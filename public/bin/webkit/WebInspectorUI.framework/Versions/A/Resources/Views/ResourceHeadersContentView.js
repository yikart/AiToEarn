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

WI.ResourceHeadersContentView = class ResourceHeadersContentView extends WI.ContentView
{
    constructor(resource, delegate)
    {
        super(null);

        console.assert(resource instanceof WI.Resource);
        console.assert(delegate);

        this._resource = resource;
        this._resource.addEventListener(WI.Resource.Event.MetricsDidChange, this._resourceMetricsDidChange, this);
        this._resource.addEventListener(WI.Resource.Event.RequestHeadersDidChange, this._resourceRequestHeadersDidChange, this);
        this._resource.addEventListener(WI.Resource.Event.ResponseReceived, this._resourceResponseReceived, this);

        this._delegate = delegate;

        this._searchQuery = null;
        this._searchResults = null;
        this._searchDOMChanges = [];
        this._searchIndex = -1;
        this._automaticallyRevealFirstSearchResult = false;
        this._bouncyHighlightElement = null;
        this._popover = null;
        this._popoverCallStackIconElement = null;

        this._redirectDetailsSections = [];

        this.element.classList.add("resource-details", "resource-headers");
        this.element.tabIndex = 0;

        this._needsSummaryRefresh = false;
        this._needsRedirectHeadersRefresh = false;
        this._needsRequestHeadersRefresh = false;
        this._needsResponseHeadersRefresh = false;
    }

    // Protected

    initialLayout()
    {
        super.initialLayout();

        this._summarySection = new WI.ResourceDetailsSection(WI.UIString("Summary"), "summary");
        this.element.appendChild(this._summarySection.element);
        this._refreshSummarySection();

        this._refreshRedirectHeadersSections();

        this._requestHeadersSection = new WI.ResourceDetailsSection(WI.UIString("Request"), "headers");
        this.element.appendChild(this._requestHeadersSection.element);
        this._refreshRequestHeadersSection();

        this._responseHeadersSection = new WI.ResourceDetailsSection(WI.UIString("Response"), "headers");
        this.element.appendChild(this._responseHeadersSection.element);
        this._refreshResponseHeadersSection();

        if (this._resource.urlComponents.queryString) {
            this._queryStringSection = new WI.ResourceDetailsSection(WI.UIString("Query String Parameters"));
            this.element.appendChild(this._queryStringSection.element);
            this._refreshQueryStringSection();
        }

        if (this._resource.requestData) {
            this._requestDataSection = new WI.ResourceDetailsSection(WI.UIString("Request Data"));
            this.element.appendChild(this._requestDataSection.element);
            this._refreshRequestDataSection();
        }

        this._needsSummaryRefresh = false;
        this._needsRedirectHeadersRefresh = false;
        this._needsRequestHeadersRefresh = false;
        this._needsResponseHeadersRefresh = false;
    }

    layout()
    {
        super.layout();

        if (this._needsSummaryRefresh) {
            this._refreshSummarySection();
            this._needsSummaryRefresh = false;
        }

        if (this._needsRedirectHeadersRefresh) {
            this._refreshRedirectHeadersSections();
            this._needsRedirectHeadersRefresh = false;
        }

        if (this._needsRequestHeadersRefresh) {
            this._refreshRequestHeadersSection();
            this._needsRequestHeadersRefresh = false;
        }

        if (this._needsResponseHeadersRefresh) {
            this._refreshResponseHeadersSection();
            this._needsResponseHeadersRefresh = false;
        }
    }

    detached()
    {
        if (this._popover)
            this._popover.dismiss();

        super.detached();
    }

    closed()
    {
        this._resource.removeEventListener(WI.Resource.Event.MetricsDidChange, this._resourceMetricsDidChange, this);
        this._resource.removeEventListener(WI.Resource.Event.RequestHeadersDidChange, this._resourceRequestHeadersDidChange, this);
        this._resource.removeEventListener(WI.Resource.Event.ResponseReceived, this._resourceResponseReceived, this);

        super.closed();
    }

    get supportsSearch()
    {
        return true;
    }

    get numberOfSearchResults()
    {
        return this._searchResults ? this._searchResults.length : null;
    }

    get hasPerformedSearch()
    {
        return this._searchResults !== null;
    }

    set automaticallyRevealFirstSearchResult(reveal)
    {
        this._automaticallyRevealFirstSearchResult = reveal;

        // If we haven't shown a search result yet, reveal one now.
        if (this._automaticallyRevealFirstSearchResult && this.numberOfSearchResults > 0) {
            if (this._searchIndex === -1)
                this.revealNextSearchResult();
        }
    }

    performSearch(query)
    {
        if (query === this._searchQuery)
            return;

        WI.revertDOMChanges(this._searchDOMChanges);

        this._searchQuery = query;
        this._searchResults = [];
        this._searchDOMChanges = [];
        this._searchIndex = -1;

        this._perfomSearchOnKeyValuePairs();

        this.dispatchEventToListeners(WI.ContentView.Event.NumberOfSearchResultsDidChange);

        if (this._automaticallyRevealFirstSearchResult && this._searchResults.length > 0)
            this.revealNextSearchResult();
    }

    searchCleared()
    {
        WI.revertDOMChanges(this._searchDOMChanges);

        this._searchQuery = null;
        this._searchResults = null;
        this._searchDOMChanges = [];
        this._searchIndex = -1;
    }

    revealPreviousSearchResult(changeFocus)
    {
        if (!this.numberOfSearchResults)
            return;

        if (this._searchIndex > 0)
            --this._searchIndex;
        else
            this._searchIndex = this._searchResults.length - 1;

        this._revealSearchResult(this._searchIndex, changeFocus);
    }

    revealNextSearchResult(changeFocus)
    {
        if (!this.numberOfSearchResults)
            return;

        if (this._searchIndex + 1 < this._searchResults.length)
            ++this._searchIndex;
        else
            this._searchIndex = 0;

        this._revealSearchResult(this._searchIndex, changeFocus);
    }

    // Private

    _responseSourceDisplayString(responseSource)
    {
        switch (responseSource) {
        case WI.Resource.ResponseSource.Network:
            return WI.UIString("Network");
        case WI.Resource.ResponseSource.MemoryCache:
            return WI.UIString("Memory Cache");
        case WI.Resource.ResponseSource.DiskCache:
            return WI.UIString("Disk Cache");
        case WI.Resource.ResponseSource.ServiceWorker:
            return WI.UIString("Service Worker");
        case WI.Resource.ResponseSource.InspectorOverride:
            return WI.UIString("Local Override");
        case WI.Resource.ResponseSource.Unknown:
        default:
            return null;
        }
    }

    _createSortedArrayForHeaders(headers)
    {
        return Object.entries(headers).sort((a, b) => a[0].toLowerCase().extendedLocaleCompare(b[0].toLowerCase()));
    }

    _refreshSummarySection()
    {
        let detailsElement = this._summarySection.detailsElement;
        detailsElement.removeChildren();

        this._summarySection.toggleError(this._resource.hadLoadingError());

        for (let redirect of this._resource.redirects)
            this._summarySection.appendKeyValuePair(WI.UIString("URL"), redirect.url.insertWordBreakCharacters(), "url");
        this._summarySection.appendKeyValuePair(WI.UIString("URL"), this._resource.displayURL.insertWordBreakCharacters(), "url");

        let status = emDash;
        if (!isNaN(this._resource.statusCode))
            status = this._resource.statusCode + (this._resource.statusText ? " " + this._resource.statusText : "");
        this._summarySection.appendKeyValuePair(WI.UIString("Status"), status);

        // FIXME: <https://webkit.org/b/178827> Web Inspector: Should be able to link directly to the ServiceWorker that handled a particular load

        let source = this._responseSourceDisplayString(this._resource.responseSource) || emDash;
        this._summarySection.appendKeyValuePair(WI.UIString("Source"), source);

        if (this._resource.remoteAddress)
            this._summarySection.appendKeyValuePair(WI.UIString("Address"), this._resource.displayRemoteAddress);

        let initiatorLocation = this._resource.initiatorSourceCodeLocation;
        if (initiatorLocation) {

            let fragment = document.createDocumentFragment();

            const options = {
                dontFloat: true,
                ignoreSearchTab: true,
                ignoreNetworkTab: true,
            };
            let link = WI.createSourceCodeLocationLink(initiatorLocation, options);
            fragment.appendChild(link);

            if (this._resource.initiatorStackTrace) {
                this._popoverCallStackIconElement = document.createElement("img");
                this._popoverCallStackIconElement.className = "call-stack";
                fragment.appendChild(this._popoverCallStackIconElement);

                this._popoverCallStackIconElement.addEventListener("click", (event) => {
                    if (!this._popover) {
                        this._popover = new WI.Popover(this);
                        this._popover.windowResizeHandler = () => { this._presentPopoverBelowCallStackElement(); };
                    }

                    const selectable = false;
                    let callFramesTreeOutline = new WI.TreeOutline(selectable);
                    callFramesTreeOutline.disclosureButtons = false;
                    let callFrameTreeController = new WI.StackTraceTreeController(callFramesTreeOutline);
                    callFrameTreeController.stackTrace = this._resource.initiatorStackTrace;

                    let popoverContent = document.createElement("div");
                    popoverContent.appendChild(callFrameTreeController.treeOutline.element);
                    this._popover.content = popoverContent;

                    this._presentPopoverBelowCallStackElement();
                });
            }

            let pair = this._summarySection.appendKeyValuePair(WI.UIString("Initiator"), fragment);
            pair.classList.add("initiator");

            if (this._popover && this._popover.visible)
                this._presentPopoverBelowCallStackElement();
        }
    }

    _refreshRedirectHeadersSections()
    {
        let referenceElement = this._redirectDetailsSections.length ? this._redirectDetailsSections.lastValue.element : this._summarySection.element;

        for (let i = this._redirectDetailsSections.length; i < this._resource.redirects.length; ++i) {
            let redirect = this._resource.redirects[i];

            let redirectRequestSection = new WI.ResourceDetailsSection(WI.UIString("Request"), "redirect");

            // FIXME: <https://webkit.org/b/190214> Web Inspector: expose full load metrics for redirect requests
            redirectRequestSection.appendKeyValuePair(`${redirect.requestMethod} ${redirect.urlComponents.path}`, null, "h1-status");

            for (let [key, value] of this._createSortedArrayForHeaders(redirect.requestHeaders))
                redirectRequestSection.appendKeyValuePair(key, value, "header");

            referenceElement = this.element.insertBefore(redirectRequestSection.element, referenceElement.nextElementSibling);
            this._redirectDetailsSections.push(redirectRequestSection);

            let redirectResponseSection = new WI.ResourceDetailsSection(WI.UIString("Redirect Response"), "redirect");

            // FIXME: <https://webkit.org/b/190214> Web Inspector: expose full load metrics for redirect requests
            redirectResponseSection.appendKeyValuePair(`${redirect.responseStatusCode} ${redirect.responseStatusText}`, null, "h1-status");

            for (let [key, value] of this._createSortedArrayForHeaders(redirect.responseHeaders))
                redirectResponseSection.appendKeyValuePair(key, value, "header");

            referenceElement = this.element.insertBefore(redirectResponseSection.element, referenceElement.nextElementSibling);
            this._redirectDetailsSections.push(redirectResponseSection);
        }
    }

    _refreshRequestHeadersSection()
    {
        let detailsElement = this._requestHeadersSection.detailsElement;
        detailsElement.removeChildren();

        // A revalidation request still sends a request even though we served from cache, so show the request.
        if (this._resource.statusCode !== 304) {
            if (this._resource.responseSource === WI.Resource.ResponseSource.MemoryCache) {
                this._requestHeadersSection.markIncompleteSectionWithMessage(WI.UIString("No request, served from the memory cache."));
                return;
            }
            if (this._resource.responseSource === WI.Resource.ResponseSource.DiskCache) {
                this._requestHeadersSection.markIncompleteSectionWithMessage(WI.UIString("No request, served from the disk cache."));
                return;
            }
        }

        let protocol = this._resource.protocol || "";
        let urlComponents = this._resource.urlComponents;
        if (protocol.startsWith("http/1")) {
            // HTTP/1.1 request line:
            // https://www.w3.org/Protocols/rfc2616/rfc2616-sec5.html#sec5.1
            let requestLine = `${this._resource.requestMethod} ${urlComponents.path} ${protocol.toUpperCase()}`;
            this._requestHeadersSection.appendKeyValuePair(requestLine, null, "h1-status");
        } else if (protocol === "h2") {
            // HTTP/2 Request pseudo headers:
            // https://tools.ietf.org/html/rfc7540#section-8.1.2.3
            this._requestHeadersSection.appendKeyValuePair(":method", this._resource.requestMethod, "h2-pseudo-header");
            this._requestHeadersSection.appendKeyValuePair(":scheme", urlComponents.scheme, "h2-pseudo-header");
            this._requestHeadersSection.appendKeyValuePair(":authority", WI.h2Authority(urlComponents), "h2-pseudo-header");
            this._requestHeadersSection.appendKeyValuePair(":path", WI.h2Path(urlComponents), "h2-pseudo-header");
        }

        for (let [key, value] of this._createSortedArrayForHeaders(this._resource.requestHeaders))
            this._requestHeadersSection.appendKeyValuePair(key, value, "header");

        if (!detailsElement.firstChild)
            this._requestHeadersSection.markIncompleteSectionWithMessage(WI.UIString("No request headers"));
    }

    _refreshResponseHeadersSection()
    {
        let detailsElement = this._responseHeadersSection.detailsElement;
        detailsElement.removeChildren();

        if (!this._resource.hasResponse()) {
            this._responseHeadersSection.markIncompleteSectionWithLoadingIndicator();
            return;
        }

        this._responseHeadersSection.toggleIncomplete(false);

        let protocol = this._resource.protocol || "";
        if (protocol.startsWith("http/1")) {
            // HTTP/1.1 response status line:
            // https://www.w3.org/Protocols/rfc2616/rfc2616-sec6.html#sec6.1
            let responseLine = `${protocol.toUpperCase()} ${this._resource.statusCode} ${this._resource.statusText}`;
            this._responseHeadersSection.appendKeyValuePair(responseLine, null, "h1-status");
        } else if (protocol === "h2") {
            // HTTP/2 Response pseudo headers:
            // https://tools.ietf.org/html/rfc7540#section-8.1.2.4
            this._responseHeadersSection.appendKeyValuePair(":status", this._resource.statusCode, "h2-pseudo-header");
        }

        for (let [key, value] of this._createSortedArrayForHeaders(this._resource.responseHeaders)) {
            // Split multiple Set-Cookie response headers out into their multiple headers instead of as a combined value.
            if (key.toLowerCase() === "set-cookie") {
                let responseCookies = this._resource.responseCookies;
                console.assert(responseCookies.length > 0);
                for (let cookie of responseCookies)
                    this._responseHeadersSection.appendKeyValuePair(key, cookie.header, "header");
                continue;
            }

            this._responseHeadersSection.appendKeyValuePair(key, value, "header");
        }

        if (!detailsElement.firstChild)
            this._responseHeadersSection.markIncompleteSectionWithMessage(WI.UIString("No response headers"));
    }

    _refreshQueryStringSection()
    {
        if (!this._queryStringSection)
            return;

        let detailsElement = this._queryStringSection.detailsElement;
        detailsElement.removeChildren();

        let queryString = this._resource.urlComponents.queryString;
        let queryStringPairs = parseQueryString(queryString, true);
        for (let {name, value} of queryStringPairs)
            this._queryStringSection.appendKeyValuePair(name, value);
    }

    _refreshRequestDataSection()
    {
        if (!this._requestDataSection)
            return;

        let detailsElement = this._requestDataSection.detailsElement;
        detailsElement.removeChildren();

        let requestData = this._resource.requestData;
        let requestDataContentType = this._resource.requestDataContentType || "";

        if (requestDataContentType && requestDataContentType.match(/^application\/x-www-form-urlencoded\s*(;.*)?$/i)) {
            // Simple form data that should be parsable like a query string.
            this._requestDataSection.appendKeyValuePair(WI.UIString("MIME Type"), requestDataContentType);
            let queryStringPairs = parseQueryString(requestData, true);
            for (let {name, value} of queryStringPairs)
                this._requestDataSection.appendKeyValuePair(name, value);
            return;
        }

        let mimeTypeComponents = parseMIMEType(requestDataContentType);
        let mimeType = mimeTypeComponents.type;
        let boundary = mimeTypeComponents.boundary;
        let encoding = mimeTypeComponents.encoding;

        this._requestDataSection.appendKeyValuePair(WI.UIString("MIME Type"), mimeType);
        if (boundary)
            this._requestDataSection.appendKeyValuePair(WI.UIString("Boundary"), boundary);
        if (encoding)
            this._requestDataSection.appendKeyValuePair(WI.UIString("Encoding"), encoding);

        let goToButton = detailsElement.appendChild(WI.createGoToArrowButton());
        goToButton.addEventListener("click", () => { this._delegate.headersContentViewGoToRequestData(this); });
        this._requestDataSection.appendKeyValuePair(WI.UIString("Request Data"), goToButton);
    }

    _perfomSearchOnKeyValuePairs()
    {
        let searchRegex = WI.SearchUtilities.searchRegExpForString(this._searchQuery, WI.SearchUtilities.defaultSettings);
        if (!searchRegex) {
            this.searchCleared();
            this.dispatchEventToListeners(WI.TextEditor.Event.NumberOfSearchResultsDidChange);
            return;
        }

        let elements = this.element.querySelectorAll(".key, .value");
        for (let element of elements) {
            let matchRanges = [];
            let text = element.textContent;
            let match;
            while (match = searchRegex.exec(text))
                matchRanges.push({offset: match.index, length: match[0].length});

            if (matchRanges.length) {
                let highlightedNodes = WI.highlightRangesWithStyleClass(element, matchRanges, "search-highlight", this._searchDOMChanges);
                this._searchResults.pushAll(highlightedNodes);
            }
        }
    }

    _revealSearchResult(index, changeFocus)
    {
        let highlightElement = this._searchResults[index];
        if (!highlightElement)
            return;

        highlightElement.scrollIntoViewIfNeeded();

        if (!this._bouncyHighlightElement) {
            this._bouncyHighlightElement = document.createElement("div");
            this._bouncyHighlightElement.className = "bouncy-highlight";
            this._bouncyHighlightElement.addEventListener("animationend", (event) => {
                this._bouncyHighlightElement.remove();
            });
        }

        this._bouncyHighlightElement.remove();

        let computedStyles = window.getComputedStyle(highlightElement);
        let highlightElementRect = highlightElement.getBoundingClientRect();
        let contentViewRect = this.element.getBoundingClientRect();
        let contentViewScrollTop = this.element.scrollTop;
        let contentViewScrollLeft = this.element.scrollLeft;

        this._bouncyHighlightElement.textContent = highlightElement.textContent;
        this._bouncyHighlightElement.style.top = (highlightElementRect.top - contentViewRect.top + contentViewScrollTop) + "px";
        this._bouncyHighlightElement.style.left = (highlightElementRect.left - contentViewRect.left + contentViewScrollLeft) + "px";
        this._bouncyHighlightElement.style.fontWeight = computedStyles.fontWeight;

        this.element.appendChild(this._bouncyHighlightElement);
    }

    _presentPopoverBelowCallStackElement()
    {
        let bounds = WI.Rect.rectFromClientRect(this._popoverCallStackIconElement.getBoundingClientRect());
        this._popover.present(bounds.pad(2), [WI.RectEdge.MAX_Y, WI.RectEdge.MIN_Y, WI.RectEdge.MAX_X]);
    }

    _resourceMetricsDidChange(event)
    {
        this._needsSummaryRefresh = true;
        this._needsRequestHeadersRefresh = true;
        this._needsResponseHeadersRefresh = true;
        this.needsLayout();
    }

    _resourceRequestHeadersDidChange(event)
    {
        this._needsSummaryRefresh = true;
        this._needsRedirectHeadersRefresh = true;
        this._needsRequestHeadersRefresh = true;
        this.needsLayout();
    }

    _resourceResponseReceived(event)
    {
        this._needsSummaryRefresh = true;
        this._needsResponseHeadersRefresh = true;
        this.needsLayout();
    }
};

WI.ResourceHeadersContentView.ReferencePage = WI.ReferencePage.NetworkTab.HeadersPane;
