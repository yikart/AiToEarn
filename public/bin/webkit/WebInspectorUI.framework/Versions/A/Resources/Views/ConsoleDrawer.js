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

WI.ConsoleDrawer = class ConsoleDrawer extends WI.ContentBrowser
{
    constructor(element)
    {
        const delegate = null;
        super(element, delegate, {
            hideBackForwardButtons: true,
            disableBackForwardNavigation: true,
            disableFindBanner: true,
            flexibleNavigationItem: new WI.NavigationItem,
        });

        this.element.classList.add("console-drawer");

        this._drawerHeightSetting = new WI.Setting("console-drawer-height", 150);

        this.navigationBar.element.addEventListener("mousedown", this._consoleResizerMouseDown.bind(this));

        this._toggleDrawerButton = new WI.ToggleButtonNavigationItem("toggle-drawer", WI.UIString("Hide Console"), WI.UIString("Show Console"), "Images/HideConsoleDrawer.svg", "Images/ShowConsoleDrawer.svg");

        this._toggleDrawerButton.visibilityPriority = WI.NavigationItem.VisibilityPriority.High;
        this._toggleDrawerButton.addEventListener(WI.ButtonNavigationItem.Event.Clicked, function(event) {
            WI.toggleSplitConsole();
        }, this._toggleDrawerButton);
        this.navigationBar.insertNavigationItem(this._toggleDrawerButton, 0);

        this.collapsed = true;

        WI.TabBrowser.addEventListener(WI.TabBrowser.Event.SelectedTabContentViewDidChange, this._selectedTabContentViewDidChange, this);
    }

    // Public

    toggleButtonShortcutTooltip(keyboardShortcut)
    {
        this._toggleDrawerButton.defaultToolTip = WI.UIString("Hide Console (%s)").format(keyboardShortcut.displayName);
    }

    get collapsed()
    {
        return this._collapsed;
    }

    set collapsed(flag)
    {
        if (flag === this._collapsed)
            return;

        this._collapsed = flag || false;
        this._toggleDrawerButton.toggled = this._collapsed;

        this.element.classList.toggle("hidden", this._collapsed);

        // Manually call `attached`/`detached` because we never expect to actually remove this node
        // from the DOM, meaning that the `WI.ContentViewContainer` would not show/hide entries in
        // the back/forward list, which is what adds/removes subviews from the DOM.
        this._didMoveToParent(this._collapsed ? null : WI.View.rootView());

        this.dispatchEventToListeners(WI.ConsoleDrawer.Event.CollapsedStateChanged);
    }

    get height()
    {
        return this.element.offsetHeight;
    }

    // Protected

    attached()
    {
        super.attached();

        this._restoreDrawerHeight();
    }

    sizeDidChange()
    {
        super.sizeDidChange();

        if (this._collapsed)
            return;

        let height = this.height;
        this._restoreDrawerHeight();

        if (height !== this.height)
            this.dispatchEventToListeners(WI.ConsoleDrawer.Event.Resized);
    }

    // Private

    _consoleResizerMouseDown(event)
    {
        if (event.button !== 0 || event.ctrlKey)
            return;

        // Only start dragging if the target is one of the elements that we expect.
        if (event.target !== this.navigationBar.element && !event.target.classList.contains("flexible-space"))
            return;

        let resizerElement = event.target;
        let quickConsoleHeight = WI.quickConsole.element.offsetHeight;
        let mouseOffset = quickConsoleHeight - (event.pageY - resizerElement.totalOffsetTop);

        function dockedResizerDrag(event)
        {
            let height = window.innerHeight - event.pageY - mouseOffset;
            this._drawerHeightSetting.value = height;
            this._updateDrawerHeight(height, quickConsoleHeight);
            this.collapsed = false;
        }

        function dockedResizerDragEnd(event)
        {
            if (event.button !== 0)
                return;

            WI.elementDragEnd(event);
        }

        WI.elementDragStart(resizerElement, dockedResizerDrag.bind(this), dockedResizerDragEnd.bind(this), event, "row-resize");
    }

    _restoreDrawerHeight()
    {
        this._updateDrawerHeight(this._drawerHeightSetting.value, WI.quickConsole.element.offsetHeight);
    }

    _updateDrawerHeight(height, quickConsoleHeight)
    {
        const minimumHeight = 64;
        let maximumHeight = this.element.parentNode.offsetHeight - WI.TabBrowser.MinimumHeight - quickConsoleHeight;

        let heightCSSValue = Number.constrain(height, minimumHeight, maximumHeight) + "px";
        if (this.element.style.height === heightCSSValue)
            return;

        this.element.style.height = heightCSSValue;

        this.dispatchEventToListeners(WI.ConsoleDrawer.Event.Resized);
    }

    _selectedTabContentViewDidChange()
    {
        if (WI.doesCurrentTabSupportSplitContentBrowser())
            return;

        this.element.classList.add("hidden");
    }
};

WI.ConsoleDrawer.Event = {
    CollapsedStateChanged: "console-drawer-collapsed-state-changed",
    Resized: "console-drawer-resized",
};
