/*
 * Copyright (C) 2013, 2015 Apple Inc. All rights reserved.
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

WI.ResourceClusterContentView = class ResourceClusterContentView extends WI.ClusterContentView
{
    constructor(resource, {disableDropZone} = {})
    {
        super(resource);

        this._resource = resource;
        this._resource.addEventListener(WI.Resource.Event.TypeDidChange, this._resourceTypeDidChange, this);
        this._resource.addEventListener(WI.Resource.Event.LoadingDidFinish, this._resourceLoadingDidFinish, this);
        this._disableDropZone = disableDropZone || false;

        this._responsePathComponent = this._createPathComponent({
            displayName: WI.UIString("Response"),
            identifier: ResourceClusterContentView.Identifier.Response,
            styleClassNames: ["response-icon"],
        });

        if (this._canShowRequestContentView()) {
            this._requestPathComponent = this._createPathComponent({
                displayName: WI.UIString("Request"),
                identifier: ResourceClusterContentView.Identifier.Request,
                styleClassNames: ["request-icon"],
                nextSibling: this._responsePathComponent,
            });

            this._tryEnableCustomRequestContentViews();
        }

        // FIXME: Since a custom response content view may only become available after a response is received
        // we need to figure out a way to restore / prefer the custom content view. For example if users
        // always want to prefer the JSON view to the normal Response text view.

        this._currentContentViewSetting = new WI.Setting("resource-current-view-" + this._resource.url.hash, ResourceClusterContentView.Identifier.Response);

        this._tryEnableCustomResponseContentViews();
    }

    // Public

    get resource() { return this._resource; }

    get selectionPathComponents()
    {
        let currentContentView = this._contentViewContainer.currentContentView;
        if (!currentContentView)
            return [];

        if (!this._canShowRequestContentView() && !this._canShowCustomRequestContentView() && !this._canShowCustomResponseContentView())
            return currentContentView.selectionPathComponents;

        // Append the current view's path components to the path component representing the current view.
        let components = [this._pathComponentForContentView(currentContentView)];
        return components.concat(currentContentView.selectionPathComponents);
    }

    attached()
    {
        super.attached();

        if (this._shownInitialContent)
            return;

        this._showContentViewForIdentifier(this._currentContentViewSetting.value);
    }

    closed()
    {
        super.closed();

        this._shownInitialContent = false;
    }

    restoreFromCookie(cookie)
    {
        let contentView = this._showContentViewForIdentifier(cookie[WI.ResourceClusterContentView.ContentViewIdentifierCookieKey]);

        if (contentView.revealPosition) {
            let textRangeToSelect = null;
            if (!isNaN(cookie.startLine) && !isNaN(cookie.startColumn) && !isNaN(cookie.endLine) && !isNaN(cookie.endColumn))
                textRangeToSelect = new WI.TextRange(cookie.startLine, cookie.startColumn, cookie.endLine, cookie.endColumn);

            let position = null;
            if (!isNaN(cookie.lineNumber) && !isNaN(cookie.columnNumber))
                position = new WI.SourceCodePosition(cookie.lineNumber, cookie.columnNumber);
            else if (textRangeToSelect)
                position = textRangeToSelect.startPosition();

            let scrollOffset = null;
            if (!isNaN(cookie.scrollOffsetX) && !isNaN(cookie.scrollOffsetY))
                scrollOffset = new WI.Point(cookie.scrollOffsetX, cookie.scrollOffsetY);

            if (position)
                contentView.revealPosition(position, {...cookie, textRangeToSelect, scrollOffset});
        }
    }

    showRequest()
    {
        this._shownInitialContent = true;

        return this._showContentViewForIdentifier(ResourceClusterContentView.Identifier.Request);
    }

    showResponse()
    {
        this._shownInitialContent = true;

        return this._showContentViewForIdentifier(ResourceClusterContentView.Identifier.Response);
    }

    // Private

    get requestContentView()
    {
        if (!this._canShowRequestContentView())
            return null;

        if (this._requestContentView)
            return this._requestContentView;

        this._requestContentView = new WI.TextContentView(this._resource.requestData || "", this._resource.requestDataContentType);

        return this._requestContentView;
    }

    get responseContentView()
    {
        if (this._responseContentView)
            return this._responseContentView;

        let typeFromMIMEType = WI.Resource.typeFromMIMEType(this._resource.mimeType);

        // COMPATIBILITY (macOS 13.3, iOS 16.3): Images inspected as the main resource used to have a resource type of Document.
        if (typeFromMIMEType === WI.Resource.Type.Image && this._resource.type === WI.Resource.Type.Document)
            return this._contentViewForResourceType(WI.Resource.Type.Image);

        this._responseContentView = this._contentViewForResourceType(this._resource.type);
        if (this._responseContentView)
            return this._responseContentView;

        this._responseContentView = this._contentViewForResourceType(typeFromMIMEType);
        if (this._responseContentView)
            return this._responseContentView;

        if (WI.shouldTreatMIMETypeAsText(this._resource.mimeType)) {
            this._responseContentView = new WI.TextResourceContentView(this._resource);
            return this._responseContentView;
        }

        this._responseContentView = new WI.GenericResourceContentView(this._resource);
        return this._responseContentView;
    }

    get customRequestDOMContentView()
    {
        if (!this._customRequestDOMContentView && this._customRequestDOMContentViewInitializer)
            this._customRequestDOMContentView = this._customRequestDOMContentViewInitializer();
        return this._customRequestDOMContentView;
    }

    get customRequestJSONContentView()
    {
        if (!this._customRequestJSONContentView && this._customRequestJSONContentViewInitializer)
            this._customRequestJSONContentView = this._customRequestJSONContentViewInitializer();
        return this._customRequestJSONContentView;
    }

    get customResponseDOMContentView()
    {
        if (!this._customResponseDOMContentView && this._customResponseDOMContentViewInitializer)
            this._customResponseDOMContentView = this._customResponseDOMContentViewInitializer();
        return this._customResponseDOMContentView;
    }

    get customResponseJSONContentView()
    {
        if (!this._customResponseJSONContentView && this._customResponseJSONContentViewInitializer)
            this._customResponseJSONContentView = this._customResponseJSONContentViewInitializer();
        return this._customResponseJSONContentView;
    }

    get customResponseTextContentView()
    {
        if (!this._customResponseTextContentView && this._customResponseTextContentViewInitializer)
            this._customResponseTextContentView = this._customResponseTextContentViewInitializer();
        return this._customResponseTextContentView;
    }

    _createPathComponent({displayName, styleClassNames, identifier, previousSibling, nextSibling})
    {
        const textOnly = false;
        const showSelectorArrows = true;
        let pathComponent = new WI.HierarchicalPathComponent(displayName, styleClassNames, identifier, textOnly, showSelectorArrows);
        pathComponent.comparisonData = this._resource;

        if (previousSibling) {
            previousSibling.nextSibling = pathComponent;
            pathComponent.previousSibling = previousSibling;
        }

        if (nextSibling) {
            nextSibling.previousSibling = pathComponent;
            pathComponent.nextSibling = nextSibling;
        }

        pathComponent.addEventListener(WI.HierarchicalPathComponent.Event.SiblingWasSelected, this._pathComponentSelected, this);

        return pathComponent;
    }

    _canShowRequestContentView()
    {
        let requestData = this._resource.requestData;
        if (!requestData)
            return false;

        if (this._resource.hasRequestFormParameters())
            return false;

        return true;
    }

    _canShowCustomRequestContentView()
    {
        return !!(this._customRequestDOMContentViewInitializer || this._customRequestJSONContentViewInitializer);
    }

    _canShowCustomResponseContentView()
    {
        return !!(this._customResponseDOMContentViewInitializer || this._customResponseJSONContentViewInitializer || this._customResponseTextContentViewInitializer);
    }

    _contentViewForResourceType(type)
    {
        switch (type) {
        case WI.Resource.Type.Document:
        case WI.Resource.Type.Script:
        case WI.Resource.Type.StyleSheet:
            return new WI.TextResourceContentView(this._resource);

        case WI.Resource.Type.Image:
            return new WI.ImageResourceContentView(this._resource, {disableDropZone: this._disableDropZone});

        case WI.Resource.Type.Font:
            return new WI.FontResourceContentView(this._resource);

        case WI.Resource.Type.WebSocket:
            return new WI.WebSocketContentView(this._resource);

        default:
            return null;
        }
    }

    _pathComponentForContentView(contentView)
    {
        switch (contentView) {
        case this._requestContentView:
            return this._requestPathComponent;

        case this._customRequestDOMContentView:
            return this._customRequestDOMPathComponent;

        case this._customRequestJSONContentView:
            return this._customRequestJSONPathComponent;

        case this._responseContentView:
            return this._responsePathComponent;

        case this._customResponseDOMContentView:
            return this._customResponseDOMPathComponent;

        case this._customResponseJSONContentView:
            return this._customResponseJSONPathComponent;

        case this._customResponseTextContentView:
            return this._customResponseTextPathComponent;
        }

        console.error("Unknown contentView", contentView);
        return null;
    }

    _identifierForContentView(contentView)
    {
        console.assert(contentView);

        switch (contentView) {
        case this._requestContentView:
            return ResourceClusterContentView.Identifier.Request;

        case this._customRequestDOMContentView:
            return ResourceClusterContentView.Identifier.RequestDOM;

        case this._customRequestJSONContentView:
            return ResourceClusterContentView.Identifier.RequestJSON;

        case this._responseContentView:
            return ResourceClusterContentView.Identifier.Response;

        case this._customResponseDOMContentView:
            return ResourceClusterContentView.Identifier.ResponseDOM;

        case this._customResponseJSONContentView:
            return ResourceClusterContentView.Identifier.ResponseJSON;

        case this._customResponseTextContentView:
            return ResourceClusterContentView.Identifier.ResponseText;
        }

        console.error("Unknown contentView", contentView);
        return null;
    }

    _showContentViewForIdentifier(identifier)
    {
        let contentViewToShow = null;

        // This is expected to fall through all the way to the `default`.
        switch (identifier) {
        case ResourceClusterContentView.Identifier.RequestDOM:
            contentViewToShow = this.customRequestDOMContentView;
            if (contentViewToShow)
                break;
            // fallthrough
        case ResourceClusterContentView.Identifier.RequestJSON:
            contentViewToShow = this.customRequestJSONContentView;
            if (contentViewToShow)
                break;
            // fallthrough
        case ResourceClusterContentView.Identifier.Request:
            contentViewToShow = this.requestContentView;
            if (contentViewToShow)
                break;
            // fallthrough
        case ResourceClusterContentView.Identifier.ResponseDOM:
            contentViewToShow = this.customResponseDOMContentView;
            if (contentViewToShow)
                break;
            // fallthrough
        case ResourceClusterContentView.Identifier.ResponseJSON:
            contentViewToShow = this.customResponseJSONContentView;
            if (contentViewToShow)
                break;
            // fallthrough
        case ResourceClusterContentView.Identifier.ResponseText:
            contentViewToShow = this.customResponseTextContentView;
            if (contentViewToShow)
                break;
            // fallthrough
        case ResourceClusterContentView.Identifier.Response:
        default:
            contentViewToShow = this.responseContentView;
            break;
        }

        console.assert(contentViewToShow);

        this._currentContentViewSetting.value = this._identifierForContentView(contentViewToShow);

        return this.contentViewContainer.showContentView(contentViewToShow);
    }

    _pathComponentSelected(event)
    {
        this._showContentViewForIdentifier(event.data.pathComponent.representedObject);
    }

    _resourceTypeDidChange(event)
    {
        // Since resource views are based on the type, we need to make a new content view and tell the container to replace this
        // content view with the new one. Make a new ResourceContentView which will use the new resource type to make the correct
        // concrete ResourceContentView subclass.

        let currentResponseContentView = this._responseContentView;
        if (!currentResponseContentView)
            return;

        this._responseContentView = null;

        this.contentViewContainer.replaceContentView(currentResponseContentView, this.responseContentView);
    }

    _resourceLoadingDidFinish(event)
    {
        this._tryEnableCustomResponseContentViews();
    }

    _canUseJSONContentViewForContent(content)
    {
        return typeof content === "string" && content.isJSON((json) => json && (typeof json === "object" || Array.isArray(json)));
    }

    _canUseDOMContentViewForContent(content, mimeType)
    {
        if (typeof content !== "string")
            return false;

        switch (mimeType) {
        case "text/html":
            return true;

        case "text/xml":
        case "application/xml":
        case "application/xhtml+xml":
        case "image/svg+xml":
            try {
                let dom = (new DOMParser).parseFromString(content, mimeType);
                return !dom.querySelector("parsererror");
            } catch { }
            return false;
        }

        return false;
    }

    _normalizeMIMETypeForDOM(mimeType)
    {
        mimeType = parseMIMEType(mimeType).type;

        if (!mimeType)
            return mimeType;

        if (mimeType.endsWith("/html") || mimeType.endsWith("+html"))
            return "text/html";

        if (mimeType.endsWith("/xml") || mimeType.endsWith("+xml")) {
            if (mimeType !== "application/xhtml+xml" && mimeType !== "image/svg+xml")
                return "application/xml";
        }

        if (mimeType.endsWith("/xhtml") || mimeType.endsWith("+xhtml"))
            return "application/xhtml+xml";

        if (mimeType.endsWith("/svg") || mimeType.endsWith("+svg"))
            return "image/svg+xml";

        return mimeType;
    }

    _tryEnableCustomRequestContentViews()
    {
        let content = this._resource.requestData;

        if (this._canUseJSONContentViewForContent(content)) {
            this._customRequestJSONContentViewInitializer = () => new WI.LocalJSONContentView(content, this._resource);

            this._customRequestJSONPathComponent = this._createPathComponent({
                displayName: WI.UIString("Request (Object Tree)"),
                styleClassNames: ["object-icon"],
                identifier: ResourceClusterContentView.Identifier.RequestJSON,
                previousSibling: this._requestPathComponent,
                nextSibling: this._responsePathComponent,
            });

            this.dispatchEventToListeners(WI.ContentView.Event.SelectionPathComponentsDidChange);
            return;
        }

        let mimeType = this._normalizeMIMETypeForDOM(this._resource.requestDataContentType);

        if (this._canUseDOMContentViewForContent(content, mimeType)) {
            this._customRequestDOMContentViewInitializer = () => new WI.LocalDOMContentView(content, mimeType, this._resource);

            this._customRequestDOMPathComponent = this._createPathComponent({
                displayName: WI.UIString("Request (DOM Tree)"),
                styleClassNames: ["dom-document-icon"],
                identifier: ResourceClusterContentView.Identifier.RequestDOM,
                previousSibling: this._requestPathComponent,
                nextSibling: this._responsePathComponent,
            });

            this.dispatchEventToListeners(WI.ContentView.Event.SelectionPathComponentsDidChange);
            return;
        }
    }

    _tryEnableCustomResponseContentViews()
    {
        if (!this._resource.hasResponse())
            return;

        // WebSocket resources already use a "custom" response content view.
        if (this._resource instanceof WI.WebSocketResource)
            return;

        this._resource.requestContent()
        .then(({error, content}) => {
            if (error || typeof content !== "string")
                return;

            if (this._canUseJSONContentViewForContent(content)) {
                this._customResponseJSONContentViewInitializer = () => new WI.LocalJSONContentView(content, this._resource);

                this._customResponseJSONPathComponent = this._createPathComponent({
                    displayName: WI.UIString("Response (Object Tree)"),
                    styleClassNames: ["object-icon"],
                    identifier: ResourceClusterContentView.Identifier.ResponseJSON,
                    previousSibling: this._responsePathComponent,
                });

                this.dispatchEventToListeners(WI.ContentView.Event.SelectionPathComponentsDidChange);
                return;
            }

            let mimeType = this._normalizeMIMETypeForDOM(this._resource.mimeType);

            if (this._canUseDOMContentViewForContent(content, mimeType)) {
                if (mimeType === "image/svg+xml") {
                    this._customResponseTextContentViewInitializer = () => new WI.TextContentView(content, mimeType, this._resource);

                    this._customResponseTextPathComponent = this._createPathComponent({
                        displayName: WI.UIString("Response (Text)"),
                        styleClassNames: ["source-icon"],
                        identifier: ResourceClusterContentView.Identifier.ResponseText,
                        previousSibling: this._responsePathComponent,
                    });
                }

                this._customResponseDOMContentViewInitializer = () => new WI.LocalDOMContentView(content, mimeType, this._resource);

                this._customResponseDOMPathComponent = this._createPathComponent({
                    displayName: WI.UIString("Response (DOM Tree)"),
                    styleClassNames: ["dom-document-icon"],
                    identifier: ResourceClusterContentView.Identifier.ResponseDOM,
                    previousSibling: this._customResponseTextPathComponent || this._responsePathComponent,
                });

                this.dispatchEventToListeners(WI.ContentView.Event.SelectionPathComponentsDidChange);
                return;
            }
        });
    }
};

WI.ResourceClusterContentView.ContentViewIdentifierCookieKey = "resource-cluster-content-view-identifier";

WI.ResourceClusterContentView.Identifier = {
    Request: "request",
    RequestDOM: "request-dom",
    RequestJSON: "request-json",
    Response: "response",
    ResponseDOM: "response-dom",
    ResponseJSON: "response-json",
    ResponseText: "response-text",
};
