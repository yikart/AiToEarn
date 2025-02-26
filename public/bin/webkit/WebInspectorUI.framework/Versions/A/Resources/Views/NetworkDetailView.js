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

WI.NetworkDetailView = class NetworkDetailView extends WI.View
{
    constructor(representedObject, delegate)
    {
        super();

        this._representedObject = representedObject;
        this._delegate = delegate || null;

        this.element.classList.add("network-detail");

        this._contentBrowser = null;

        this._detailNavigationItemMap = new Map;

        this._contentViewCookie = null;
    }

    // Public

    get representedObject() { return this._representedObject; }

    attached()
    {
        super.attached();

        if (!this._contentBrowser)
            return;

        this._showPreferredContentView();

        if (this._contentViewCookie) {
            this._contentBrowser.showContentView(this._contentBrowser.currentContentView, this._contentViewCookie);
            this._contentViewCookie = null;
        }
    }

    dispose()
    {
        this._delegate = null;

        this._contentBrowser.contentViewContainer.closeAllContentViews();
    }

    willShowWithCookie(cookie)
    {
        this._contentViewCookie = cookie;
    }

    // Protected

    initialLayout()
    {
        let closeNavigationItem = new WI.ButtonNavigationItem("close", WI.UIString("Close detail view"), "Images/CloseLarge.svg", 16, 16);
        closeNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._handleCloseButton, this);
        closeNavigationItem.visibilityPriority = WI.NavigationItem.VisibilityPriority.High;

        let contentViewNavigationItemGroup = new WI.GroupNavigationItem;
        let flexibleNavigationItem = new WI.FlexibleSpaceNavigationItem(contentViewNavigationItemGroup, WI.FlexibleSpaceNavigationItem.Align.End);
        flexibleNavigationItem.visibilityPriority = WI.NavigationItem.VisibilityPriority.Low;

        const element = null;
        this._contentBrowser = new WI.ContentBrowser(element, this, {hideBackForwardButtons: true, flexibleNavigationItem, contentViewNavigationItemGroup});
        this._contentBrowser.addEventListener(WI.ContentBrowser.Event.CurrentContentViewDidChange, this._handleCurrentContentViewDidChange, this);

        // Insert all of our custom navigation items at the start of the ContentBrowser's NavigationBar.
        let index = 0;
        this._contentBrowser.navigationBar.insertNavigationItem(closeNavigationItem, index++);
        for (let detailNavigationItem of this._detailNavigationItemMap.values())
            this._contentBrowser.navigationBar.insertNavigationItem(detailNavigationItem, index++);

        this._contentBrowser.navigationBar.addEventListener(WI.NavigationBar.Event.NavigationItemSelected, this._navigationItemSelected, this);

        this.addSubview(this._contentBrowser);

        this._showPreferredContentView();
    }

    createDetailNavigationItem(identifier, toolTip)
    {
        this._detailNavigationItemMap.set(identifier, new WI.RadioButtonNavigationItem(identifier, toolTip));
    }

    detailNavigationItemForIdentifier(identifier)
    {
        return this._detailNavigationItemMap.get(identifier);
    }

    showContentViewForIdentifier(identifier)
    {
        // Implemented by subclasses.
    }

    // Private

    _showPreferredContentView()
    {
        let detailNavigationItems = Array.from(this._detailNavigationItemMap.values());

        // Restore the preferred navigation item.
        let firstNavigationItem = null;
        let defaultIdentifier = WI.settings.selectedNetworkDetailContentViewIdentifier.value;
        for (let navigationItem of this._contentBrowser.navigationBar.navigationItems) {
            if (!(navigationItem instanceof WI.RadioButtonNavigationItem))
                continue;

            if (!detailNavigationItems.includes(navigationItem))
                continue;

            if (!firstNavigationItem)
                firstNavigationItem = navigationItem;

            if (navigationItem.identifier === defaultIdentifier) {
                this._contentBrowser.navigationBar.selectedNavigationItem = navigationItem;
                return;
            }
        }

        console.assert(firstNavigationItem, "Should have found at least one navigation item above");
        this._contentBrowser.navigationBar.selectedNavigationItem = firstNavigationItem;
    }

    _handleCurrentContentViewDidChange(event)
    {
        // Redispatch this event since this view is basically just a wrapper.
        this.dispatchEventToListeners(event.type, event.data);
    }

    _navigationItemSelected(event)
    {
        let navigationItem = event.target.selectedNavigationItem;
        if (!(navigationItem instanceof WI.RadioButtonNavigationItem))
            return;

        this.showContentViewForIdentifier(navigationItem.identifier);

        console.assert(navigationItem.identifier);
        WI.settings.selectedNetworkDetailContentViewIdentifier.value = navigationItem.identifier;
    }

    _handleCloseButton(event)
    {
        if (this._delegate && this._delegate.networkDetailViewClose)
            this._delegate.networkDetailViewClose(this);
    }
};
