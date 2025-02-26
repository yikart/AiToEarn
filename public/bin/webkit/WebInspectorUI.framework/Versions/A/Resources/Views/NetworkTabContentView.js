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

WI.NetworkTabContentView = class NetworkTabContentView extends WI.TabContentView
{
    constructor()
    {
        super(NetworkTabContentView.tabInfo());

        this._networkTableContentView = new WI.NetworkTableContentView;

        this._contentBrowser = new WI.ContentBrowser(null, this, {hideBackForwardButtons: true, disableFindBanner: true});
        this._contentBrowser.showContentView(this._networkTableContentView);

        let filterNavigationItems = this._networkTableContentView.filterNavigationItems;
        for (let i = 0; i < filterNavigationItems.length; ++i)
            this._contentBrowser.navigationBar.insertNavigationItem(filterNavigationItems[i], i);

        this.addSubview(this._contentBrowser);

        WI.networkManager.addEventListener(WI.NetworkManager.Event.EmulatedConditionChanged, this._handleEmulatedConditionChanged, this);
    }

    // Static

    static tabInfo()
    {
        let hasEmulatedCondition = WI.networkManager.emulatedCondition !== WI.NetworkManager.EmulatedCondition.None;

        return {
            identifier: NetworkTabContentView.Type,
            image: hasEmulatedCondition ? "Images/Warning.svg" : "Images/Network.svg",
            title: hasEmulatedCondition ? WI.UIString("Network throttling is enabled") : "",
            displayName: WI.UIString("Network", "Network Tab Name", "Name of Network Tab"),
        };
    }

    static isTabAllowed()
    {
        return InspectorBackend.hasDomain("Network");
    }

    // Protected

    closed()
    {
        this._contentBrowser.contentViewContainer.closeAllContentViews();

        super.closed();
    }

    initialLayout()
    {
        super.initialLayout();

        let dropZoneView = new WI.DropZoneView(this);
        dropZoneView.text = WI.UIString("Import HAR");
        dropZoneView.targetElement = this.element;
        this.addSubview(dropZoneView);
    }

    get canHandleFindEvent()
    {
        return this._networkTableContentView.canFocusFilterBar;
    }

    handleFindEvent()
    {
        this._networkTableContentView.focusFilterBar();
    }

    // Public

    get contentBrowser() { return this._contentBrowser; }

    get type()
    {
        return WI.NetworkTabContentView.Type;
    }

    canShowRepresentedObject(representedObject)
    {
        return representedObject instanceof WI.Resource;
    }

    showRepresentedObject(representedObject, cookie)
    {
        console.assert(this._contentBrowser.currentContentView === this._networkTableContentView);
        this._networkTableContentView.showRepresentedObject(representedObject, cookie);
    }

    get supportsSplitContentBrowser()
    {
        return true;
    }

    // DropZoneView delegate

    dropZoneShouldAppearForDragEvent(dropZone, event)
    {
        return event.dataTransfer.types.includes("Files");
    }

    dropZoneHandleDrop(dropZone, event)
    {
        let files = event.dataTransfer.files;
        if (files.length !== 1) {
            InspectorFrontendHost.beep();
            return;
        }

        WI.FileUtilities.readJSON(files, (result) => this._networkTableContentView.processHAR(result));
    }

    // Private

    _handleEmulatedConditionChanged(event)
    {
        let hasEmulatedCondition = WI.networkManager.emulatedCondition !== WI.NetworkManager.EmulatedCondition.None;

        this.tabBarItem.image = hasEmulatedCondition ? "Images/Warning.svg" : "Images/Network.svg";
        this.tabBarItem.title = hasEmulatedCondition ? WI.UIString("Network throttling is enabled") : "";
    }
};

WI.NetworkTabContentView.Type = "network";
