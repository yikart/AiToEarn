/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
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

WI.TabContentView = class TabContentView extends WI.ContentView
{
    constructor(tabInfo, {navigationSidebarPanelConstructor, detailsSidebarPanelConstructors} = {})
    {
        console.assert(!navigationSidebarPanelConstructor || navigationSidebarPanelConstructor.prototype instanceof WI.NavigationSidebarPanel);
        console.assert(!detailsSidebarPanelConstructors || detailsSidebarPanelConstructors.every((detailsSidebarPanelConstructor) => detailsSidebarPanelConstructor.prototype instanceof WI.DetailsSidebarPanel));

        super(null);

        this._identifier = tabInfo.identifier;
        this._navigationSidebarPanelConstructor = navigationSidebarPanelConstructor || null;
        this._detailsSidebarPanelConstructors = detailsSidebarPanelConstructors || [];

        this._navigationSidebarCollapsedSetting = new WI.Setting(this._identifier + "-navigation-sidebar-collapsed", false);
        this._navigationSidebarWidthSetting = new WI.Setting(this._identifier + "-navigation-sidebar-width", WI.TabContentView.DefaultSidebarWidth);

        this._detailsSidebarCollapsedSetting = new WI.Setting(this._identifier + "-details-sidebar-collapsed", !this.detailsSidebarExpandedByDefault);
        this._detailsSidebarSelectedPanelSetting = new WI.Setting(this._identifier + "-details-sidebar-selected-panel", null);
        this._detailsSidebarWidthSetting = new WI.Setting(this._identifier + "-details-sidebar-widths", {});
        this._detailsSidebarHeightSetting = new WI.Setting(this._identifier + "-details-sidebar-height", null);

        this._cookieSetting = new WI.Setting(this._identifier + "-tab-cookie", {});

        this.element.classList.add("tab", this._identifier);
    }

    static isTabAllowed()
    {
        // Returns false if a necessary domain or other features are unavailable.
        return true;
    }

    static shouldPinTab()
    {
        // Returns true if the tab should not be allowed to be closed.
        return false;
    }

    static shouldSaveTab()
    {
        // Returns false if the tab should not be restored when re-opening the Inspector.
        return true;
    }

    // Public

    get type()
    {
        // Implemented by subclasses.
        return null;
    }

    get identifier()
    {
        return this._identifier;
    }

    get tabBarItem()
    {
        // This is created lazily to break a dependency cycle for dynamically-created TabContentViews.
        // TabContentViews with a non-static tabInfo() must be fully constructed before calling tabInfo().
        if (!this._tabBarItem)
            this._tabBarItem = this.constructor.shouldPinTab() ? WI.PinnedTabBarItem.fromTabContentView(this) : WI.GeneralTabBarItem.fromTabContentView(this);

        return this._tabBarItem;
    }

    get managesNavigationSidebarPanel()
    {
        // Implemented by subclasses.
        return false;
    }

    get managesDetailsSidebarPanels()
    {
        // Implemented by subclasses.
        return false;
    }

    get detailsSidebarExpandedByDefault()
    {
        // Implemented by subclasses.
        return false;
    }

    showDetailsSidebarPanels()
    {
        // Implemented by subclasses.
    }

    showRepresentedObject(representedObject, cookie)
    {
        // Implemented by subclasses.
    }

    canShowRepresentedObject(representedObject)
    {
        // Implemented by subclasses.
        return false;
    }

    get allowMultipleDetailSidebars()
    {
        // Can be overridden by subclasses.
        return false;
    }

    tabInfo()
    {
        // Can be overridden by subclasses.
        return this.constructor.tabInfo();
    }

    attached()
    {
        super.attached();

        if (this._shouldRestoreStateWhenShown)
            this.restoreStateFromCookie(WI.StateRestorationType.Delayed);
    }

    restoreStateFromCookie(restorationType)
    {
        if (!this.isAttached) {
            this._shouldRestoreStateWhenShown = true;
            return;
        }

        this._shouldRestoreStateWhenShown = false;

        var relaxMatchDelay = 0;
        if (restorationType === WI.StateRestorationType.Load)
            relaxMatchDelay = 1000;
        else if (restorationType === WI.StateRestorationType.Navigation)
            relaxMatchDelay = 2000;

        let cookie = this._cookieSetting.value || {};

        if (this.navigationSidebarPanel)
            this.navigationSidebarPanel.restoreStateFromCookie(cookie, relaxMatchDelay);

        this.restoreFromCookie(cookie);
    }

    saveStateToCookie(cookie)
    {
        if (this._shouldRestoreStateWhenShown)
            return;

        cookie = cookie || {};

        if (this.navigationSidebarPanel)
            this.navigationSidebarPanel.saveStateToCookie(cookie);

        this.saveToCookie(cookie);

        this._cookieSetting.value = cookie;
    }

    get navigationSidebarPanel()
    {
        if (!this._navigationSidebarPanelConstructor)
            return null;
        if (!this._navigationSidebarPanel)
            this._navigationSidebarPanel = new this._navigationSidebarPanelConstructor;

        return this._navigationSidebarPanel;
    }

    get navigationSidebarCollapsedSetting() { return this._navigationSidebarCollapsedSetting; }
    get navigationSidebarWidthSetting() { return this._navigationSidebarWidthSetting; }

    get detailsSidebarPanels()
    {
        if (!this._detailsSidebarPanels)
            this._detailsSidebarPanels = this._detailsSidebarPanelConstructors.map((constructor) => new constructor);

        return this._detailsSidebarPanels;
    }

    get detailsSidebarCollapsedSetting() { return this._detailsSidebarCollapsedSetting; }
    get detailsSidebarSelectedPanelSetting() { return this._detailsSidebarSelectedPanelSetting; }
    get detailsSidebarWidthSetting() { return this._detailsSidebarWidthSetting; }
    get detailsSidebarHeightSetting() { return this._detailsSidebarHeightSetting; }
};

WI.TabContentView.DefaultSidebarWidth = 300;
WI.TabContentView.DefaultSidebarHeight = 400;
