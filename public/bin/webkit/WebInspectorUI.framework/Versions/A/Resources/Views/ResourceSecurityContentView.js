/*
 * Copyright (C) 2018 Apple Inc. All rights reserved.
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

WI.ResourceSecurityContentView = class ResourceSecurityContentView extends WI.ContentView
{
    constructor(resource)
    {
        console.assert(resource instanceof WI.Resource);

        super();

        this._resource = resource;

        this._insecureMessageElement = null;
        this._needsConnectionRefresh = true;
        this._needsCertificateRefresh = true;

        this._searchQuery = null;
        this._searchResults = null;
        this._searchDOMChanges = [];
        this._searchIndex = -1;
        this._automaticallyRevealFirstSearchResult = false;
        this._bouncyHighlightElement = null;

        this.element.classList.add("resource-details", "resource-security");
    }

    // Protected

    initialLayout()
    {
        super.initialLayout();

        this._connectionSection = new WI.ResourceDetailsSection(WI.UIString("Connection"), "connection");
        this.element.appendChild(this._connectionSection.element);

        this._certificateSection = new WI.ResourceDetailsSection(WI.UIString("Certificate"), "certificate");
        this.element.appendChild(this._certificateSection.element);

        this._resource.addEventListener(WI.Resource.Event.ResponseReceived, this._handleResourceResponseReceived, this);
        this._resource.addEventListener(WI.Resource.Event.MetricsDidChange, this._handleResourceMetricsDidChange, this);
    }

    layout()
    {
        super.layout();

        if (!this._resource.loadedSecurely) {
            if (!this._insecureMessageElement)
                this._insecureMessageElement = WI.createMessageTextView(WI.UIString("The resource was requested insecurely."), true);
            this.element.appendChild(this._insecureMessageElement);
            return;
        }

        if (this._needsConnectionRefresh) {
            this._needsConnectionRefresh = false;
            this._refreshConnectionSection();
        }

        if (this._needsCertificateRefresh) {
            this._needsCertificateRefresh = false;
            this._refreshCetificateSection();
        }
    }

    closed()
    {
        if (this.didInitialLayout) {
            this._resource.removeEventListener(WI.Resource.Event.ResponseReceived, this._handleResourceResponseReceived, this);
            this._resource.removeEventListener(WI.Resource.Event.MetricsDidChange, this._handleResourceMetricsDidChange, this);
        }

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

        if (this._searchIndex < this._searchResults.length - 1)
            ++this._searchIndex;
        else
            this._searchIndex = 0;

        this._revealSearchResult(this._searchIndex, changeFocus);
    }

    // Private

    _refreshConnectionSection()
    {
        let detailsElement = this._connectionSection.detailsElement;
        detailsElement.removeChildren();

        let security = this._resource.security;
        if (isEmptyObject(security)) {
            this._connectionSection.markIncompleteSectionWithMessage(WI.UIString("No connection security information."));
            return;
        }

        let connection = security.connection;
        if (isEmptyObject(connection) || Object.values(connection).every((value) => !value)) {
            this._connectionSection.markIncompleteSectionWithMessage(WI.UIString("No connection security information."));
            return;
        }

        this._connectionSection.appendKeyValuePair(WI.UIString("Protocol"), connection.protocol || emDash);
        this._connectionSection.appendKeyValuePair(WI.UIString("Cipher"), connection.cipher || emDash);
    }

    _refreshCetificateSection()
    {
        let detailsElement = this._certificateSection.detailsElement;
        detailsElement.removeChildren();

        let security = this._resource.security;
        if (isEmptyObject(security)) {
            this._certificateSection.markIncompleteSectionWithMessage(WI.UIString("No certificate security information."));
            return;
        }

        let certificate = security.certificate;
        if (isEmptyObject(certificate) || Object.values(certificate).every((value) => !value)) {
            this._certificateSection.markIncompleteSectionWithMessage(WI.UIString("No certificate security information."));
            return;
        }

        if (WI.NetworkManager.supportsShowCertificate()) {
            let button = document.createElement("button");
            button.textContent = WI.UIString("Show full certificate");

            let errorElement = null;
            button.addEventListener("click", (event) => {
                this._resource.showCertificate()
                .then(() => {
                    if (errorElement) {
                        errorElement.remove();
                        errorElement = null;
                    }
                })
                .catch((error) => {
                    if (!errorElement)
                        errorElement = WI.ImageUtilities.useSVGSymbol("Images/Error.svg", "error", error);
                    button.insertAdjacentElement("afterend", errorElement);
                });
            });

            let pairElement = this._certificateSection.appendKeyValuePair(button);
            pairElement.classList.add("show-certificate");
        }

        this._certificateSection.appendKeyValuePair(WI.UIString("Subject"), certificate.subject || emDash);

        let appendFormattedDate = (key, timestamp) => {
            if (isNaN(timestamp))
                return;

            let date = new Date(timestamp * 1000);

            let timeElement = document.createElement("time");
            timeElement.datetime = date.toISOString();
            timeElement.textContent = date.toLocaleString();
            this._certificateSection.appendKeyValuePair(key, timeElement);

        };
        appendFormattedDate(WI.UIString("Valid From"), certificate.validFrom);
        appendFormattedDate(WI.UIString("Valid Until"), certificate.validUntil);

        let appendList = (key, values, className) => {
            if (!Array.isArray(values))
                return;

            const initialCount = 5;
            for (let i = 0; i < Math.min(values.length, initialCount); ++i)
                this._certificateSection.appendKeyValuePair(key, values[i], className);

            let remaining = values.length - initialCount;
            if (remaining <= 0)
                return;

            let showMoreElement = document.createElement("a");
            showMoreElement.classList.add("show-more");
            showMoreElement.textContent = WI.UIString("Show %d More").format(remaining);

            let showMorePair = this._certificateSection.appendKeyValuePair(key, showMoreElement, className);

            showMoreElement.addEventListener("click", (event) => {
                showMorePair.remove();

                for (let i = initialCount; i < values.length; ++i)
                    this._certificateSection.appendKeyValuePair(key, values[i], className);
            }, {once: true});
        };
        appendList(WI.UIString("DNS"), certificate.dnsNames, "dns-name");
        appendList(WI.UIString("IP"), certificate.ipAddresses, "ip-address");
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

    _handleResourceResponseReceived(event)
    {
        this._needsCertificateRefresh = true;
        this.needsLayout();
    }

    _handleResourceMetricsDidChange(event)
    {
        this._needsConnectionRefresh = true;
        this.needsLayout();
    }
};

WI.ResourceSecurityContentView.ReferencePage = WI.ReferencePage.NetworkTab.SecurityPane;
