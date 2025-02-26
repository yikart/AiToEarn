/*
 * Copyright (C) 2020 Apple Inc. All rights reserved.
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

WI.MultiSidebar = class MultiSidebar extends WI.Sidebar
{
    constructor(element, side, label)
    {
        super(element, side, label);

        this.element.classList.add("multi-sidebar");

        this._sidebars = [];
        this._allowMultipleSidebars = false;
        this._multipleSidebarsVisible = false;

        this._ignoringSidebarCollapsedStateDidChangeEvents = false;

        this.addSidebar(new WI.SingleSidebar(null, this.side, label, true));
        this.primarySidebar.collapsed = false;

        this._requiredMinimumWidthForMultipleSidebars = 0;

        window.addEventListener("resize", this._handleWindowResize.bind(this));
    }

    // Public

    get sidebars() { return this._sidebars; }

    get primarySidebar()
    {
        return this._sidebars[0];
    }

    get allowMultipleSidebars()
    {
        return this._allowMultipleSidebars;
    }

    set allowMultipleSidebars(allow)
    {
        if (allow === this._allowMultipleSidebars)
            return;

        this._allowMultipleSidebars = !!allow;

        this._updateMultipleSidebarLayout();
    }

    get multipleSidebarsVisible()
    {
        return this._multipleSidebarsVisible;
    }

    set multipleSidebarsVisible(visible)
    {
        if (visible === this._multipleSidebarsVisible)
            return;

        this._multipleSidebarsVisible = !!visible;

        this.element.classList.toggle("showing-multiple", this._multipleSidebarsVisible);

        this._updateMultipleSidebarLayout();

        this.dispatchEventToListeners(WI.MultiSidebar.Event.MultipleSidebarsVisibleChanged);
    }

    addSidebar(sidebar)
    {
        console.assert(sidebar instanceof WI.Sidebar);
        if (!(sidebar instanceof WI.Sidebar))
            return;

        this._addSidebarEventListeners(sidebar);
        this._sidebars.push(sidebar);
        this.addSubview(sidebar);

        this.dispatchEventToListeners(WI.MultiSidebar.Event.SidebarAdded, {sidebar});
    }

    removeSidebar(sidebar)
    {
        console.assert(sidebar instanceof WI.Sidebar);
        if (!(sidebar instanceof WI.Sidebar))
            return;

        console.assert(sidebar !== this.primarySidebar, "Primary sidebar can not be removed.");
        if (sidebar === this.primarySidebar)
            return;

        this._removeSidebarEventListeners(sidebar);
        this._sidebars.remove(sidebar);
        this.removeSubview(sidebar);
    }

    get selectedSidebarPanel()
    {
        return this.primarySidebar.selectedSidebarPanel;
    }

    set selectedSidebarPanel(sidebarPanelOrIdentifierOrIndex)
    {
        this.primarySidebar.selectedSidebarPanel = sidebarPanelOrIdentifierOrIndex;
    }

    get collapsable()
    {
        return super.collapsable;
    }

    set collapsable(allow)
    {
        super.collapsable = allow;
        this.primarySidebar.collapsable = this.collapsable;
    }

    get minimumWidth()
    {
        let minimumWidth = 0;
        for (let sidebar of this.sidebars)
            minimumWidth += sidebar.minimumWidth;
        return minimumWidth;
    }

    get width()
    {
        return this.element.offsetWidth;
    }

    // Protected

    didInsertSidebarPanel(sidebarPanel, index)
    {
        this._updateMinimumWidthForMultipleSidebars({ignoreExistingComputedValue: true});
        this._updateMultipleSidebarLayout();
    }

    didRemoveSidebarPanel(sidebarPanel)
    {
        let sidebar = this._findSidebarForSidebarPanel(sidebarPanel);
        if (sidebar) {
            sidebar.removeSidebarPanel(sidebarPanel);
            if (sidebar !== this.primarySidebar)
                this.removeSidebar(sidebar);
        }

        this._updateMinimumWidthForMultipleSidebars({ignoreExistingComputedValue: true});
        this._updateMultipleSidebarLayout();
    }

    didSetCollapsed()
    {
        this.primarySidebar.collapsed = this.collapsed;

        this._updateMinimumWidthForMultipleSidebars({ignoreExistingComputedValue: true});
        this._updateMultipleSidebarLayout();
    }

    // Private

    get _canShowMultipleSidebars()
    {
        return this._allowMultipleSidebars && this._multipleSidebarsVisible && this._hasSidebarPanelSupportingExclusive && this.sidebarPanels.length >= 2;
    }

    _updateMinimumWidthForMultipleSidebars({ignoreExistingComputedValue} = {})
    {
        if (!ignoreExistingComputedValue && this._requiredMinimumWidthForMultipleSidebars)
            return;

        if (this.collapsed || !this.isAttached)
            return;

        // A 50px of additional required space helps make sure we collapse the multiple sidebars at an appropriate width
        // without preventing the user from sizing the single sidebar to fill up to the minimum width of the
        // #tab-browser once the sidebars are collapsed.
        const minimumWidthEasement = 50;

        let requiredMinimumWidth = this.primarySidebar.minimumWidth + minimumWidthEasement;
        for (let sidebarPanel of this.sidebarPanels) {
            if (sidebarPanel.allowExclusivePresentation)
                requiredMinimumWidth += Math.max(WI.Sidebar.AbsoluteMinimumWidth, sidebarPanel.minimumWidth);
        }

        this._requiredMinimumWidthForMultipleSidebars = requiredMinimumWidth;
        this.multipleSidebarsVisible = this._hasWidthForMultipleSidebars;
    }

    get _hasWidthForMultipleSidebars()
    {
        this._updateMinimumWidthForMultipleSidebars();
        return this._requiredMinimumWidthForMultipleSidebars < this.maximumWidth;
    }

    get _hasSidebarPanelSupportingExclusive()
    {
        return this.sidebarPanels.some((sidebarPanel) => sidebarPanel.allowExclusivePresentation);
    }

    _updateMultipleSidebarLayout()
    {
        for (let sidebarPanel of this.sidebarPanels) {
            let sidebar = this._findSidebarForSidebarPanel(sidebarPanel);
            if (this._canSidebarPanelBeExclusive(sidebarPanel) && (sidebar === this.primarySidebar || !sidebar))
                this._makeSidebarPanelExclusive(sidebarPanel);
            else if (!this._canSidebarPanelBeExclusive(sidebarPanel) && sidebar !== this.primarySidebar)
                this._makeSidebarPanelNotExclusive(sidebarPanel);
        }

        this.primarySidebar.allowResizingToCollapse = this.sidebars.length <= 1;
    }

    _canSidebarPanelBeExclusive(sidebarPanel)
    {
        return sidebarPanel.allowExclusivePresentation && this._canShowMultipleSidebars;
    }

    _makeSidebarPanelExclusive(sidebarPanel)
    {
        let existingSidebar = this._findSidebarForSidebarPanel(sidebarPanel);

        if (existingSidebar === this.primarySidebar)
            existingSidebar.removeSidebarPanel(sidebarPanel);

        sidebarPanel.exclusive = true;

        let sidebar = new WI.SingleSidebar(null, this.side, sidebarPanel.navigationItem.label);
        sidebar.collapsable = false;
        sidebar.addSidebarPanel(sidebarPanel);
        sidebar.selectedSidebarPanel = sidebarPanel;
        this.addSidebar(sidebar);
    }

    _makeSidebarPanelNotExclusive(sidebarPanel)
    {
        let existingSidebar = this._findSidebarForSidebarPanel(sidebarPanel);

        if (existingSidebar && existingSidebar !== this.primarySidebar) {
            existingSidebar.removeSidebarPanel(sidebarPanel);

            sidebarPanel.exclusive = false;

            this.removeSidebar(existingSidebar);
        }

        this.primarySidebar.insertSidebarPanel(sidebarPanel, this._nonExclusiveIndexOfSidebarPanel(sidebarPanel));
    }

    _nonExclusiveIndexOfSidebarPanel(sidebarPanel)
    {
        let index = this._sidebarPanels.indexOf(sidebarPanel);

        if (this.multipleSidebarsVisible) {
            for (let i = index - 1; i >= 0; i--) {
                if (this._canSidebarPanelBeExclusive(this._sidebarPanels[i]))
                    index--;
            }
        }

        return index;
    }

    _findSidebarForSidebarPanel(sidebarPanel)
    {
        // Panels that are not currently the selectedPanel for their sidebar will not have a parent.
        if (sidebarPanel.parentSidebar)
            return sidebarPanel.parentSidebar;

        return this._sidebars.find((sidebar) => sidebar.sidebarPanels.includes(sidebarPanel)) || null;
    }

    _addSidebarEventListeners(sidebar)
    {
        sidebar.addEventListener(WI.Sidebar.Event.SidebarPanelSelected, this._handleSidebarPanelSelected, this);
        sidebar.addEventListener(WI.Sidebar.Event.CollapsedStateDidChange, this._handleSidebarCollapsedStateDidChange, this);
        sidebar.addEventListener(WI.Sidebar.Event.WidthDidChange, this._handleSidebarWidthDidChange, this);
    }

    _removeSidebarEventListeners(sidebar)
    {
        sidebar.removeEventListener(WI.Sidebar.Event.SidebarPanelSelected, this._handleSidebarPanelSelected, this);
        sidebar.removeEventListener(WI.Sidebar.Event.CollapsedStateDidChange, this._handleSidebarCollapsedStateDidChange, this);
        sidebar.removeEventListener(WI.Sidebar.Event.WidthDidChange, this._handleSidebarWidthDidChange, this);
    }

    _handleSidebarPanelSelected(event)
    {
        if (event.target === this.primarySidebar)
            this.dispatchEventToListeners(WI.Sidebar.Event.SidebarPanelSelected);
    }

    _handleSidebarCollapsedStateDidChange(event)
    {
        if (event.target === this.primarySidebar)
            this.collapsed = event.target.collapsed;
    }

    _handleSidebarWidthDidChange(event)
    {
        this.dispatchEventToListeners(WI.Sidebar.Event.WidthDidChange, {sidebar: event.target, newWidth: event.data.newWidth});
    }

    _handleWindowResize(event)
    {
        if (!this.collapsed && this.allowMultipleSidebars)
            this.multipleSidebarsVisible = this._hasWidthForMultipleSidebars;
    }
};

WI.MultiSidebar.Event = {
    MultipleSidebarsVisibleChanged: "multi-sidebar-multiple-sidebars-visible-changed",
    SidebarAdded: "multi-sidebar-sidebar-added",
};
