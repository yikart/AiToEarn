/*
 * Copyright (C) 2013, 2015, 2020 Apple Inc. All rights reserved.
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

WI.SingleSidebar = class SingleSidebar extends WI.Sidebar
{
    constructor(element, side, label, supportsMultiplePanels)
    {
        super(element, side, label);

        this.element.classList.add("single-sidebar");

        this._allowResizingToCollapse = true;

        if (supportsMultiplePanels) {
            this.element.classList.add("has-navigation-bar");

            const navigationBarElement = null;
            this._navigationBar = new WI.NavigationBar(navigationBarElement, {role: "tablist"});
            this._navigationBar.addEventListener(WI.NavigationBar.Event.NavigationItemSelected, this._handleNavigationItemSelected, this);

            this.addSubview(this._navigationBar);
        }

        this._widthResizer = new WI.Resizer(WI.Resizer.RuleOrientation.Vertical, this);
        this.element.insertBefore(this._widthResizer.element, this.element.firstChild);
    }

    // Public

    get allowResizingToCollapse() { return this._allowResizingToCollapse; }
    set allowResizingToCollapse(allow) { this._allowResizingToCollapse = !!allow; }

    get minimumWidth()
    {
        let minimumWidth = super.minimumWidth;
        if (this._navigationBar)
            minimumWidth = Math.max(minimumWidth, this._navigationBar.minimumWidth);
        return minimumWidth;
    }

    get width()
    {
        return this.element.offsetWidth;
    }

    set width(newWidth)
    {
        if (newWidth === this.width)
            return;

        this._recalculateWidth(newWidth);
    }

    // Protected

    shouldInsertSidebarPanel(sidebarPanel, index)
    {
        console.assert(!sidebarPanel.parentSidebar || sidebarPanel.parentSidebar === this);
        return !sidebarPanel.parentSidebar || sidebarPanel.parentSidebar === this;
    }

    didInsertSidebarPanel(sidebarPanel, index)
    {
        if (!this._navigationBar)
            return;

        console.assert(sidebarPanel.navigationItem);
        this._navigationBar.insertNavigationItem(sidebarPanel.navigationItem, index);

        if (this.collapsed)
            return;

        this._recalculateWidth();   
    }

    didRemoveSidebarPanel(sidebarPanel)
    {
        if (!this._navigationBar)
            return;

        console.assert(sidebarPanel.navigationItem);
        this._navigationBar.removeNavigationItem(sidebarPanel.navigationItem);

        if (this.collapsed)
            return;

        this._recalculateWidth();
    }

    willSetSelectedSidebarPanel(sidebarPanel)
    {
        if (this.selectedSidebarPanel) {
            this.removeSubview(this.selectedSidebarPanel);
            this.selectedSidebarPanel.selected = false;
        }
    }

    didSetSelectedSidebarPanel(sidebarPanel)
    {
        if (this.selectedSidebarPanel) {
            this.selectedSidebarPanel.selected = true;
            this.addSubview(this.selectedSidebarPanel);
        }

        if (this._navigationBar)
            this._navigationBar.selectedNavigationItem = this.selectedSidebarPanel?.navigationItem ?? null;
    }

    didSetCollapsed()
    {
        if (this.selectedSidebarPanel) {
            if (this.collapsed) {
                if (this.selectedSidebarPanel.isAttached)
                    this.removeSubview(this.selectedSidebarPanel);
            } else {
                if (!this.selectedSidebarPanel.isAttached)
                    this.addSubview(this.selectedSidebarPanel);
            }
        }

        if (!this.collapsed && this._navigationBar)
            this._navigationBar.needsLayout();
    }

    resizerDragStarted(resizer)
    {
        super.resizerDragStarted(resizer);
        
        if (resizer !== this._widthResizer)
            return;
        
        this._widthBeforeResize = this.width;
    }

    resizerDragging(resizer, positionDelta)
    {
        super.resizerDragging(resizer);
        
        if (resizer !== this._widthResizer)
            return;
        
        if (this._side === WI.Sidebar.Sides.Leading)
            positionDelta *= -1;

        if (WI.resolvedLayoutDirection() === WI.LayoutDirection.RTL)
            positionDelta *= -1;

        let newWidth = positionDelta + this._widthBeforeResize;
        this.width = newWidth;

        if (this.collapsable && this._allowResizingToCollapse)
            this.collapsed = newWidth < (this.minimumWidth / 2);
    }

    resizerDragEnded(resizer)
    {
        super.resizerDragEnded(resizer);
        
        if (resizer !== this._widthResizer || this._widthBeforeResize === this.width)
            return;

        if (!this.collapsed && this._navigationBar)
            this._navigationBar.sizeDidChange();

        if (!this.collapsed && this._selectedSidebarPanel)
            this._selectedSidebarPanel.sizeDidChange();
    }

    // Private

    _recalculateWidth(newWidth = this.width)
    {
        console.assert(newWidth);

        // Need to add 1 because of the 1px border-inline-start or border-inline-end.
        newWidth = Math.ceil(Number.constrain(newWidth, this.minimumWidth + 1, this.maximumWidth));
        this.element.style.width = `${newWidth}px`;
        this.element.style.minWidth = `${this.minimumWidth}px`;

        if (this.collapsed)
            return;

        if (this._navigationBar)
            this._navigationBar.needsLayout(WI.View.LayoutReason.Resize);

        if (this.selectedSidebarPanel)
            this.selectedSidebarPanel.needsLayout(WI.View.LayoutReason.Resize);

        this.dispatchEventToListeners(WI.Sidebar.Event.WidthDidChange, {newWidth});
    }

    _handleNavigationItemSelected(event)
    {
        this.selectedSidebarPanel = event.target.selectedNavigationItem?.identifier ?? null;
    }
};
