/*
 * Copyright (C) 2017-2018 Apple Inc. All rights reserved.
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

WI.NetworkResourceDetailView = class NetworkResourceDetailView extends WI.NetworkDetailView
{
    constructor(resource, delegate)
    {
        console.assert(resource instanceof WI.Resource);

        super(resource, delegate);

        this.element.classList.add("resource");

        this._resourceContentView = null;
        this._headersContentView = null;
        this._cookiesContentView = null;
        this._sizesContentView = null;
        this._timingContentView = null;
        this._securityContentView = null;
    }

    // Public

    get referencePage()
    {
        let currentContentView = this._contentBrowser.currentContentView;
        if (!currentContentView)
            return null;

        if (currentContentView === this._resourceContentView)
            return WI.ReferencePage.NetworkTab.PreviewPane;

        return currentContentView?.constructor.ReferencePage;
    }

    // Protected

    attached()
    {
        super.attached();

        if (this._contentBrowser && this._contentViewCookie && "lineNumber" in this._contentViewCookie && "columnNumber" in this._contentViewCookie)
            this._contentBrowser.navigationBar.selectedNavigationItem = this.detailNavigationItemForIdentifier("preview");
    }

    // ResourceHeadersContentView delegate

    headersContentViewGoToRequestData(headersContentView)
    {
        this._contentBrowser.navigationBar.selectedNavigationItem = this.detailNavigationItemForIdentifier("preview");

        this._resourceContentView.showRequest();
    }

    // ResourceSizesContentView delegate

    sizesContentViewGoToHeaders(metricsContentView)
    {
        this._contentBrowser.navigationBar.selectedNavigationItem = this.detailNavigationItemForIdentifier("headers");
    }

    sizesContentViewGoToRequestBody(metricsContentView)
    {
        this._contentBrowser.navigationBar.selectedNavigationItem = this.detailNavigationItemForIdentifier("preview");

        this._resourceContentView.showRequest();
    }

    sizesContentViewGoToResponseBody(metricsContentView)
    {
        this._contentBrowser.navigationBar.selectedNavigationItem = this.detailNavigationItemForIdentifier("preview");

        this._resourceContentView.showResponse();
    }

    // Protected

    initialLayout()
    {
        this.createDetailNavigationItem("preview", WI.UIString("Preview"));
        this.createDetailNavigationItem("headers", WI.UIString("Headers"));
        this.createDetailNavigationItem("cookies", WI.UIString("Cookies"));
        this.createDetailNavigationItem("sizes", WI.UIString("Sizes"));
        this.createDetailNavigationItem("timing", WI.UIString("Timing"));
        this.createDetailNavigationItem("security", WI.UIString("Security"));

        super.initialLayout();
    }

    // Private

    showContentViewForIdentifier(identifier)
    {
        super.showContentViewForIdentifier(identifier);

        if (this._contentViewCookie && "lineNumber" in this._contentViewCookie && "columnNumber" in this._contentViewCookie)
            identifier = "preview";

        switch (identifier) {
        case "preview":
            if (!this._resourceContentView) {
                const cookie = false;
                this._resourceContentView = this._contentBrowser.showContentViewForRepresentedObject(this.representedObject, cookie, {disableDropZone: true});
            }
            this._contentBrowser.showContentView(this._resourceContentView, this._contentViewCookie);
            break;
        case "headers":
            if (!this._headersContentView)
                this._headersContentView = new WI.ResourceHeadersContentView(this.representedObject, this);
            this._contentBrowser.showContentView(this._headersContentView, this._contentViewCookie);
            break;
        case "cookies":
            if (!this._cookiesContentView)
                this._cookiesContentView = new WI.ResourceCookiesContentView(this.representedObject);
            this._contentBrowser.showContentView(this._cookiesContentView, this._contentViewCookie);
            break;
        case "sizes":
            if (!this._sizesContentView)
                this._sizesContentView = new WI.ResourceSizesContentView(this.representedObject, this);
            this._contentBrowser.showContentView(this._sizesContentView, this._contentViewCookie);
            break;
        case "timing":
            if (!this._timingContentView)
                this._timingContentView = new WI.ResourceTimingContentView(this.representedObject);
            this._contentBrowser.showContentView(this._timingContentView, this._contentViewCookie);
            break;
        case "security":
            if (!this._securityContentView)
                this._securityContentView = new WI.ResourceSecurityContentView(this.representedObject);
            this._contentBrowser.showContentView(this._securityContentView, this._contentViewCookie);
            break;
        }

        this._contentViewCookie = null;
    }
};
