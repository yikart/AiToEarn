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

WI.NavigationBar = class NavigationBar extends WI.View
{
    constructor(element, {role, sizesToFit, navigationItems} = {})
    {
        super(element);

        this.element.classList.add(this.constructor.StyleClassName || "navigation-bar");

        if (role)
            this.element.setAttribute("role", role);

        this.element.addEventListener("keydown", this._keyDown.bind(this), false);
        this.element.addEventListener("mousedown", this._mouseDown.bind(this), true);

        this._role = role;
        this._sizesToFit = sizesToFit || false;
        this._minimumWidth = NaN;
        this._navigationItems = [];
        this._selectedNavigationItem = null;

        this._mouseMovedEventListener = this._mouseMoved.bind(this);
        this._mouseUpEventListener = this._mouseUp.bind(this);

        if (navigationItems) {
            for (var i = 0; i < navigationItems.length; ++i)
                this.addNavigationItem(navigationItems[i]);
        }
    }

    // Public

    get sizesToFit() { return this._sizesToFit; }

    addNavigationItem(navigationItem, parentElement)
    {
        return this.insertNavigationItem(navigationItem, Infinity, parentElement);
    }

    insertNavigationItem(navigationItem, index, parentElement)
    {
        console.assert(navigationItem instanceof WI.NavigationItem);
        if (!(navigationItem instanceof WI.NavigationItem))
            return null;

        if (navigationItem.parentNavigationBar)
            navigationItem.parentNavigationBar.removeNavigationItem(navigationItem);

        navigationItem.didAttach(this);

        console.assert(!isFinite(index) || (index >= 0 && index <= this._navigationItems.length));
        index = Math.max(0, Math.min(index, this._navigationItems.length));

        this._navigationItems.splice(index, 0, navigationItem);

        if (!parentElement)
            parentElement = this.element;

        var nextSibling = this._navigationItems[index + 1];
        var nextSiblingElement = nextSibling ? nextSibling.element : null;
        if (nextSiblingElement && nextSiblingElement.parentNode !== parentElement)
            nextSiblingElement = null;

        parentElement.insertBefore(navigationItem.element, nextSiblingElement);

        this._minimumWidth = NaN;

        this.needsLayout();

        return navigationItem;
    }

    removeNavigationItem(navigationItem)
    {
        console.assert(navigationItem instanceof WI.NavigationItem);
        if (!(navigationItem instanceof WI.NavigationItem))
            return null;

        if (!navigationItem._parentNavigationBar)
            return null;

        console.assert(navigationItem._parentNavigationBar === this, "Cannot remove item with unexpected parent bar.", navigationItem);
        if (navigationItem._parentNavigationBar !== this)
            return null;

        navigationItem.didDetach();

        if (this._selectedNavigationItem === navigationItem)
            this.selectedNavigationItem = null;

        this._navigationItems.remove(navigationItem);
        navigationItem.element.remove();

        this._minimumWidth = NaN;

        this.needsLayout();

        return navigationItem;
    }

    get selectedNavigationItem()
    {
        return this._selectedNavigationItem;
    }

    set selectedNavigationItem(navigationItem)
    {
        let navigationItemHasOtherParent = navigationItem && navigationItem.parentNavigationBar !== this;
        console.assert(!navigationItemHasOtherParent, "Cannot select item with unexpected parent bar.", navigationItem);
        if (navigationItemHasOtherParent)
            return;

        // Only radio navigation items can be selected.
        if (!(navigationItem instanceof WI.RadioButtonNavigationItem))
            navigationItem = null;

        if (this._selectedNavigationItem === navigationItem)
            return;

        if (this._selectedNavigationItem)
            this._selectedNavigationItem.selected = false;

        this._selectedNavigationItem = navigationItem || null;

        if (this._selectedNavigationItem)
            this._selectedNavigationItem.selected = true;

        // When the mouse is down don't dispatch the selected event, it will be dispatched on mouse up.
        // This prevents sending the event while the user is scrubbing the bar.
        if (!this._mouseIsDown)
            this.dispatchEventToListeners(WI.NavigationBar.Event.NavigationItemSelected);
    }

    get navigationItems()
    {
        return this._navigationItems;
    }

    get minimumWidth()
    {
        if (isNaN(this._minimumWidth))
            this._minimumWidth = this._calculateMinimumWidth();
        return this._minimumWidth;
    }

    findNavigationItem(identifier)
    {
        function matchingSelfOrChild(item) {
            if (item.identifier === identifier)
                return item;

            if (item instanceof WI.GroupNavigationItem) {
                for (let childItem of item.navigationItems) {
                    let result = matchingSelfOrChild(childItem);
                    if (result)
                        return result;
                }
            }

            return null;
        }

        for (let item of this._navigationItems) {
            let result = matchingSelfOrChild(item);
            if (result)
                return result;
        }

        return null;
    }

    layout()
    {
        super.layout();

        this._minimumWidth = NaN;

        // Remove the collapsed style class to test if the items can fit at full width.
        this.element.classList.remove(WI.NavigationBar.CollapsedStyleClassName);

        function forceItemHidden(item, hidden) {
            item[WI.NavigationBar.ForceHiddenSymbol] = hidden;
            item.element.classList.toggle("force-hidden", hidden);
        }

        function isDivider(item) {
            return item instanceof WI.DividerNavigationItem;
        }

        // Tell each navigation item to update to full width if needed.
        for (let item of this._navigationItems) {
            forceItemHidden(item, false);
            item.update({expandOnly: true});
        }

        if (this.sizesToFit)
            return;

        let visibleNavigationItems = this._visibleNavigationItems;

        function calculateVisibleItemWidth() {
            return visibleNavigationItems.reduce((total, item) => total + item.width, 0);
        }

        let totalItemWidth = calculateVisibleItemWidth();

        const barWidth = this.element.realOffsetWidth;

        // Add the collapsed class back if the items are wider than the bar.
        if (totalItemWidth > barWidth)
            this.element.classList.add(WI.NavigationBar.CollapsedStyleClassName);

        // Give each navigation item the opportunity to collapse further.
        for (let item of visibleNavigationItems)
            item.update();

        totalItemWidth = calculateVisibleItemWidth();

        if (totalItemWidth > barWidth) {
            if (this.parentView instanceof WI.Sidebar) {
                this.parentView.width = this.minimumWidth;
                return;
            }

            // Hide visible items, starting with the lowest priority item, until
            // the bar fits the available width.
            visibleNavigationItems.sort((a, b) => a.visibilityPriority - b.visibilityPriority);

            while (totalItemWidth > barWidth && visibleNavigationItems.length) {
                let navigationItem = visibleNavigationItems.shift();
                totalItemWidth -= navigationItem.width;
                forceItemHidden(navigationItem, true);
            }

            visibleNavigationItems = this._visibleNavigationItems;
        }

        // Hide leading, trailing, and consecutive dividers.
        let previousItem = null;
        for (let item of visibleNavigationItems) {
            if (isDivider(item) && (!previousItem || isDivider(previousItem))) {
                forceItemHidden(item);
                continue;
            }

            previousItem = item;
        }

        if (isDivider(previousItem))
            forceItemHidden(previousItem);
    }

    // Private

    _mouseDown(event)
    {
        // Only handle left mouse clicks.
        if (event.button !== 0)
            return;

        var itemElement = event.target.closest("." + WI.RadioButtonNavigationItem.StyleClassName);
        if (!itemElement || !itemElement.navigationItem)
            return;

        if (this._role === "tablist") {
            if (this.element.contains(document.activeElement)) {
                // If clicking on a tab, stop the event from being handled by the button element. Instead,
                // pass focus to the selected tab. Otherwise, let the button become activated normally.
                event.stopPropagation();
            }
        }

        this._previousSelectedNavigationItem = this.selectedNavigationItem;
        this.selectedNavigationItem = itemElement.navigationItem;

        this._mouseIsDown = true;

        if (typeof this.selectedNavigationItem.dontPreventDefaultOnNavigationBarMouseDown === "function"
            && this.selectedNavigationItem.dontPreventDefaultOnNavigationBarMouseDown()
            && this._previousSelectedNavigationItem === this.selectedNavigationItem)
            return;

        // Register these listeners on the document so we can track the mouse if it leaves the navigation bar.
        document.addEventListener("mousemove", this._mouseMovedEventListener, false);
        document.addEventListener("mouseup", this._mouseUpEventListener, false);
    }

    _mouseMoved(event)
    {
        console.assert(event.button === 0);
        console.assert(this._mouseIsDown);
        if (!this._mouseIsDown)
            return;

        event.preventDefault();
        event.stopPropagation();

        var itemElement = event.target.closest("." + WI.RadioButtonNavigationItem.StyleClassName);
        if (!itemElement || !itemElement.navigationItem || !this.element.contains(itemElement)) {
            // Find the element that is at the X position of the mouse, even when the mouse is no longer
            // vertically in the navigation bar.
            var element = document.elementFromPoint(event.pageX, this.element.totalOffsetTop + (this.element.offsetHeight / 2));
            if (!element)
                return;

            itemElement = element.closest("." + WI.RadioButtonNavigationItem.StyleClassName);
            if (!itemElement || !itemElement.navigationItem || !this.element.contains(itemElement))
                return;
        }

        if (this.selectedNavigationItem)
            this.selectedNavigationItem.active = false;

        this.selectedNavigationItem = itemElement.navigationItem;

        this.selectedNavigationItem.active = true;
    }

    _mouseUp(event)
    {
        console.assert(event.button === 0);
        console.assert(this._mouseIsDown);
        if (!this._mouseIsDown)
            return;

        if (this.selectedNavigationItem)
            this.selectedNavigationItem.active = false;

        this._mouseIsDown = false;

        document.removeEventListener("mousemove", this._mouseMovedEventListener, false);
        document.removeEventListener("mouseup", this._mouseUpEventListener, false);

        // Dispatch the selected event here since the selectedNavigationItem setter surpresses it
        // while the mouse is down to prevent sending it while scrubbing the bar.
        if (this._previousSelectedNavigationItem !== this.selectedNavigationItem)
            this.dispatchEventToListeners(WI.NavigationBar.Event.NavigationItemSelected);

        delete this._previousSelectedNavigationItem;

        event.preventDefault();
        event.stopPropagation();
    }

    _keyDown(event)
    {
        let isLeftArrow = event.code === "ArrowLeft";
        if (!isLeftArrow && event.code !== "ArrowRight")
            return;

        if (this._selectedNavigationItem?.element !== document.activeElement)
            return;

        event.preventDefault();
        event.stopPropagation();

        let delta = isLeftArrow ? -1 : 1;
        if (WI.resolveLayoutDirectionForElement(this._element) === WI.LayoutDirection.RTL)
            delta *= -1;

        let selectedIndex = this._navigationItems.indexOf(this._selectedNavigationItem);

        if (selectedIndex === -1)
            selectedIndex = (this._navigationItems.length + delta) % this._navigationItems.length;

        while (true) {
            selectedIndex += delta;

            if (selectedIndex < 0 || selectedIndex >= this._navigationItems.length)
                break;

            let selectedItemCandidate = this._navigationItems[selectedIndex];
            if (selectedItemCandidate instanceof WI.RadioButtonNavigationItem) {
                this.selectedNavigationItem = selectedItemCandidate;
                this.selectedNavigationItem.element.focus();
                break;
            }
        }
    }

    _calculateMinimumWidth()
    {
        let visibleNavigationItems = this._visibleNavigationItems;
        if (!visibleNavigationItems.length)
            return 0;

        const wasCollapsed = this.element.classList.contains(WI.NavigationBar.CollapsedStyleClassName);

        // Add the collapsed style class to calculate the width of the items when they are collapsed.
        if (!wasCollapsed)
            this.element.classList.add(WI.NavigationBar.CollapsedStyleClassName);

        let totalItemWidth = visibleNavigationItems.reduce((total, item) => total + Math.ceil(item.minimumWidth), 0);

        // Remove the collapsed style class if we were not collapsed before.
        if (!wasCollapsed)
            this.element.classList.remove(WI.NavigationBar.CollapsedStyleClassName);

        return totalItemWidth;
    }

    get _visibleNavigationItems()
    {
        return this._navigationItems.filter((item) => {
            if (item instanceof WI.FlexibleSpaceNavigationItem)
                return false;
            if (item.hidden || item[WI.NavigationBar.ForceHiddenSymbol])
                return false;
            return true;
        });
    }
};

WI.NavigationBar.ForceHiddenSymbol = Symbol("force-hidden");

WI.NavigationBar.CollapsedStyleClassName = "collapsed";

WI.NavigationBar.Event = {
    NavigationItemSelected: "navigation-bar-navigation-item-selected"
};
