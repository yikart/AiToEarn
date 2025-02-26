/*
 * Copyright (C) 2013-2020 Apple Inc. All rights reserved.
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

WI.ResourceTreeElement = class ResourceTreeElement extends WI.SourceCodeTreeElement
{
    constructor(resource, representedObject, {allowDirectoryAsName, hideOrigin} = {})
    {
        console.assert(resource instanceof WI.Resource);

        const title = null;
        const subtitle = null;
        let styleClassNames = ["resource", WI.ResourceTreeElement.ResourceIconStyleClassName, ...WI.Resource.classNamesForResource(resource)];
        super(resource, styleClassNames, title, subtitle, representedObject || resource);

        if (allowDirectoryAsName)
            this._allowDirectoryAsName = allowDirectoryAsName;
        if (hideOrigin)
            this._hideOrigin = hideOrigin;

        this._updateResource(resource);
    }

    // Static

    static compareResourceTreeElements(a, b)
    {
        console.assert(a instanceof WI.SourceCodeTreeElement);
        console.assert(b instanceof WI.SourceCodeTreeElement);

        let resourceA = a.resource || a.representedObject;
        let resourceB = b.resource || b.representedObject;

        function resolvedType(resource) {
            if (resource instanceof WI.Resource)
                return resource.type;
            if (resource instanceof WI.CSSStyleSheet)
                return WI.Resource.Type.StyleSheet;
            if (resource instanceof WI.Script)
                return WI.Resource.Type.Script;
            return WI.Resource.Type.Other;
        }

        let typeA = resolvedType(resourceA);
        let typeB = resolvedType(resourceB);

        // Compare by type first to keep resources grouped by type when not sorted into folders.
        var comparisonResult = typeA.extendedLocaleCompare(typeB);
        if (comparisonResult !== 0)
            return comparisonResult;

        // Compare async resource types by their first timestamp so they are in chronological order.
        if (typeA === WI.Resource.Type.XHR
            || typeA === WI.Resource.Type.Fetch
            || typeA === WI.Resource.Type.WebSocket)
            return resourceA.firstTimestamp - resourceB.firstTimestamp || 0;

        // Compare by subtitle when the types are the same. The subtitle is used to show the
        // domain of the resource. This causes resources to group by domain. If the resource
        // is on the same domain as the frame it will have an empty subtitle. This is good
        // because empty string sorts first, so those will appear before external resources.
        comparisonResult = a.subtitle.extendedLocaleCompare(b.subtitle);
        if (comparisonResult !== 0)
            return comparisonResult;

        // Compare by title without file extensions when the subtitles are the same.
        function filenameWithoutExtension(resourceTitle) {
            return resourceTitle.substring(0, resourceTitle.lastIndexOf("."));
        }
        
        let titleA = filenameWithoutExtension(a.mainTitle);
        let titleB = filenameWithoutExtension(b.mainTitle);
        comparisonResult = titleA.extendedLocaleCompare(titleB);
        if (comparisonResult !== 0)
            return comparisonResult;

        // Compare by complete title (with extensions) when the filenames are the same.
        return a.mainTitle.extendedLocaleCompare(b.mainTitle);
    }

    static compareFolderAndResourceTreeElements(a, b)
    {
        var aIsFolder = a instanceof WI.FolderTreeElement;
        var bIsFolder = b instanceof WI.FolderTreeElement;

        if (aIsFolder && !bIsFolder)
            return -1;
        if (!aIsFolder && bIsFolder)
            return 1;
        if (aIsFolder && bIsFolder)
            return a.mainTitle.extendedLocaleCompare(b.mainTitle);

        return WI.ResourceTreeElement.compareResourceTreeElements(a, b);
    }

    // Public

    get resource()
    {
        return this._resource;
    }

    get filterableData()
    {
        let urlComponents = this._resource.urlComponents;
        return {text: [urlComponents.lastPathComponent, urlComponents.path, this._resource.url]};
    }

    ondblclick()
    {
        if (this._resource.type === WI.Resource.Type.WebSocket)
            return;

        WI.openURL(this._resource.url);
    }

    // Protected (Used by FrameTreeElement)

    _updateResource(resource)
    {
        console.assert(resource instanceof WI.Resource);

        // This method is for subclasses like FrameTreeElement who don't use a resource as the representedObject.
        // This method should only be called once if the representedObject is a resource, since changing the resource
        // without changing the representedObject is bad. If you need to change the resource, make a new ResourceTreeElement.
        console.assert(!this._resource || !(this.representedObject instanceof WI.Resource));

        if (this._resource) {
            this._resource.removeEventListener(WI.Resource.Event.URLDidChange, this._urlDidChange, this);
            this._resource.removeEventListener(WI.Resource.Event.TypeDidChange, this._typeDidChange, this);
            this._resource.removeEventListener(WI.Resource.Event.LoadingDidFinish, this.updateStatus, this);
            this._resource.removeEventListener(WI.Resource.Event.LoadingDidFail, this._loadingDidFail, this);
            this._resource.removeEventListener(WI.Resource.Event.ResponseReceived, this._responseReceived, this);
        }

        this._updateSourceCode(resource);

        this._resource = resource;

        resource.addEventListener(WI.Resource.Event.URLDidChange, this._urlDidChange, this);
        resource.addEventListener(WI.Resource.Event.TypeDidChange, this._typeDidChange, this);
        resource.addEventListener(WI.Resource.Event.LoadingDidFinish, this.updateStatus, this);
        resource.addEventListener(WI.Resource.Event.LoadingDidFail, this._loadingDidFail, this);
        resource.addEventListener(WI.Resource.Event.ResponseReceived, this._responseReceived, this);

        this._updateTitles();
        this.updateStatus();
        this._updateToolTip();
        this._updateIcon();
    }

    // Protected

    get mainTitleText()
    {
        // Overridden by subclasses if needed.
        return WI.displayNameForURL(this._resource.url, this._resource.urlComponents, {
            allowDirectoryAsName: this._allowDirectoryAsName,
        });
    }

    _updateTitles()
    {
        var frame = this._resource.parentFrame;
        var target = this._resource.target;

        var isMainResource = this._resource.isMainResource();
        var parentResourceHost = target.mainResource ? target.mainResource.urlComponents.host : null;
        if (isMainResource && frame) {
            // When the resource is a main resource, get the host from the current frame's parent frame instead of the current frame.
            parentResourceHost = frame.parentFrame ? frame.parentFrame.mainResource.urlComponents.host : null;
        } else if (frame) {
            // When the resource is a normal sub-resource, get the host from the current frame's main resource.
            parentResourceHost = frame.mainResource.urlComponents.host;
        }

        var urlComponents = this._resource.urlComponents;

        var oldMainTitle = this.mainTitle;
        this.mainTitle = this.mainTitleText;

        if (!this._hideOrigin) {
            if (this._resource.localResourceOverride) {
                if (WI.NetworkManager.supportsOverridingRequests())
                    this.subtitle = this._resource.localResourceOverride.displayType;
                else {
                    // Show the host for a local resource override if it is different from the main frame.
                    let localResourceOverrideHost = urlComponents.host;
                    let mainFrameHost = (WI.networkManager.mainFrame && WI.networkManager.mainFrame.mainResource) ? WI.networkManager.mainFrame.mainResource.urlComponents.host : null;
                    let subtitle = localResourceOverrideHost !== mainFrameHost ? localResourceOverrideHost : null;
                    this.subtitle = this.mainTitle !== subtitle ? subtitle : null;
                }
            } else {
                // Show the host as the subtitle if it is different from the main resource or if this is the main frame's main resource.
                let subtitle = (parentResourceHost !== urlComponents.host || (frame && frame.isMainFrame() && isMainResource)) ? WI.displayNameForHost(urlComponents.host) : null;
                this.subtitle = this.mainTitle !== subtitle ? subtitle : null;
            }
        }

        if (oldMainTitle !== this.mainTitle)
            this.callFirstAncestorFunction("descendantResourceTreeElementMainTitleDidChange", [this, oldMainTitle]);
    }

    updateStatus()
    {
        super.updateStatus();

        if (!this._resource)
            return;

        if (this._resource.hadLoadingError())
            this.addClassName(WI.ResourceTreeElement.FailedStyleClassName);
        else
            this.removeClassName(WI.ResourceTreeElement.FailedStyleClassName);

        if (this._resource.isLoading()) {
            if (!this.status || !this.status[WI.ResourceTreeElement.SpinnerSymbol]) {
                let spinner = new WI.IndeterminateProgressSpinner;
                if (this.status)
                    this.statusElement.insertAdjacentElement("afterbegin", spinner.element);
                else
                    this.status = spinner.element;
                this.status[WI.ResourceTreeElement.SpinnerSymbol] = spinner.element;
            }
        } else {
            if (this.status && this.status[WI.ResourceTreeElement.SpinnerSymbol]) {
                if (this.status === this.status[WI.ResourceTreeElement.SpinnerSymbol])
                    this.status = null;
                else {
                    this.status[WI.ResourceTreeElement.SpinnerSymbol].remove();
                    this.status[WI.ResourceTreeElement.SpinnerSymbol] = null;
                }
            }
        }
    }

    populateContextMenu(contextMenu, event)
    {
        WI.appendContextMenuItemsForSourceCode(contextMenu, this._resource);

        super.populateContextMenu(contextMenu, event);
    }

    // Private

    _updateToolTip()
    {
        this.tooltip = this._resource.displayURL;
    }

    _updateIcon()
    {
        let localResourceOverride = this._resource.localResourceOverride || WI.networkManager.localResourceOverridesForURL(this._resource.url).filter((localResourceOverride) => !localResourceOverride.disabled)[0];
        let isOverride = !!this._resource.localResourceOverride;
        let wasOverridden = this._resource.responseSource === WI.Resource.ResponseSource.InspectorOverride;
        let shouldBeOverridden = this._resource.isLoading() && localResourceOverride;
        let shouldBeBlocked = (this._resource.failed || isOverride) && localResourceOverride?.type === WI.LocalResourceOverride.InterceptType.Block;
        if (isOverride || wasOverridden || shouldBeOverridden || shouldBeBlocked) {
            this.addClassName("override");

            if (shouldBeBlocked || localResourceOverride?.type === WI.LocalResourceOverride.InterceptType.ResponseSkippingNetwork)
                this.addClassName("skip-network");

            if (localResourceOverride?.localResource.mappedFilePath)
                this.addClassName("mapped-file");
        } else {
            this.removeClassName("override");
            this.removeClassName("skip-network");
            this.removeClassName("mapped-file");
        }

        if (wasOverridden)
            this.iconElement.title = WI.UIString("This resource was loaded from a local override");
        else if (shouldBeBlocked)
            this.iconElement.title = WI.UIString("This resource was blocked by a local override");
        else
            this.iconElement.title = "";
    }

    _urlDidChange(event)
    {
        this._updateTitles();
        this._updateToolTip();
    }

    _typeDidChange(event)
    {
        this.removeClassName(event.data.oldType);
        this.addClassName(this._resource.type);

        this.callFirstAncestorFunction("descendantResourceTreeElementTypeDidChange", [this, event.data.oldType]);
    }

    _loadingDidFail(event)
    {
        this.updateStatus();
        this._updateIcon();
    }

    _responseReceived(event)
    {
        this._updateIcon();
    }
};

WI.ResourceTreeElement.ResourceIconStyleClassName = "resource-icon";
WI.ResourceTreeElement.FailedStyleClassName = "failed";

WI.ResourceTreeElement.SpinnerSymbol = Symbol("spinner");
