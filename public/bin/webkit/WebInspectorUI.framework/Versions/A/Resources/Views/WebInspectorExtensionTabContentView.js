/*
 * Copyright (C) 2020-2021 Apple Inc. All rights reserved.
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

WI.WebInspectorExtensionTabContentView = class WebInspectorExtensionTabContentView extends WI.TabContentView
{
    constructor(extension, extensionTabID, tabLabel, iconURL, sourceURL)
    {
        let tabInfo = {
            identifier: WI.WebInspectorExtensionTabContentView.Type,
            image: iconURL,
            displayName: tabLabel,
            title: tabLabel,
        };
        super(tabInfo);

        this._extension = extension;
        this._extensionTabID = extensionTabID;
        this._tabInfo = tabInfo;
        this._sourceURL = sourceURL;

        this._whenPageAvailablePromise = new WI.WrappedPromise;

        this._iframeElement = this.element.appendChild(document.createElement("iframe"));
        this._iframeElement.src = sourceURL;
        this._iframeElement.addEventListener("load", this._extensionFrameDidLoad.bind(this));
    }

    // Static

    static shouldSaveTab() { return false; }
    static shouldNotRemoveFromDOMWhenHidden() { return true; }

    static isTabAllowed()
    {
        return InspectorFrontendHost.supportsWebExtensions;
    }

    // Public

    get extension() { return this._extension; }
    get extensionTabID() { return this._extensionTabID; }
    get iframeElement() { return this._iframeElement; }

    get type()
    {
        return WI.WebInspectorExtensionTabContentView.Type;
    }

    get supportsSplitContentBrowser()
    {
        return true;
    }

    get savedTabPositionKey()
    {
        return `ExtensionTab-${this._extension.extensionBundleIdentifier}-${this._tabInfo.displayName}`;
    }

    set iframeURL(sourceURL)
    {
        this._iframeElement.src = sourceURL;
    }

    whenPageAvailable()
    {
        return this._whenPageAvailablePromise.promise;
    }

    attached()
    {
        super.attached();

        this._maybeDispatchDidShowExtensionTab();
    }

    detached()
    {
        if (InspectorFrontendHost.supportsWebExtensions)
            InspectorFrontendHost.didHideExtensionTab(this._extension.extensionID, this._extensionTabID);

        super.detached();
    }

    dispose()
    {
        this.element?.remove();
    }

    tabInfo()
    {
        return this._tabInfo;
    }

    static shouldSaveTab() { return false; }

    static shouldNotRemoveFromDOMWhenHidden() {
        // This is necessary to avoid the <iframe> content from being reloaded when the extension tab is hidden.
        return true;
    }

    // Private

    _extensionFrameDidLoad()
    {
        // Signal that the page is available since we already bounced to the requested page.
        if (!this._whenPageAvailablePromise.settled)
            this._whenPageAvailablePromise.resolve(this._sourceURL);

        this._maybeDispatchDidNavigateExtensionTab();
    }

    async _maybeDispatchDidNavigateExtensionTab()
    {
        if (!this.element.isConnected)
            return;

        let payload = await WI.sharedApp.extensionController.evaluateScriptInExtensionTab(this._extensionTabID, "document.location.href");
        console.assert(payload.result, "Should be able to unwrap evaluation in extension tab!", payload.result);

        if (InspectorFrontendHost.supportsWebExtensions)
            InspectorFrontendHost.didNavigateExtensionTab(this._extension.extensionID, this._extensionTabID, payload.result);
    }

    _maybeDispatchDidShowExtensionTab()
    {
        if (!this.element.isConnected)
            return;

        if (InspectorFrontendHost.supportsWebExtensions)
            InspectorFrontendHost.didShowExtensionTab(this._extension.extensionID, this._extensionTabID, this._iframeElement);
    }
};

WI.WebInspectorExtensionTabContentView.Type = "web-inspector-extension";
