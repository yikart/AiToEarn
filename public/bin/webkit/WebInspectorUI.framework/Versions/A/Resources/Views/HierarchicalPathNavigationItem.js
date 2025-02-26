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

WI.HierarchicalPathNavigationItem = class HierarchicalPathNavigationItem extends WI.NavigationItem
{
    constructor(identifier, components)
    {
        super(identifier);

        this._collapsedComponent = null;
        this._needsUpdate = false;

        this.components = components;
    }

    // Public

    get components()
    {
        return this._components;
    }

    set components(newComponents)
    {
        if (!newComponents)
            newComponents = [];

        let componentsEqual = function(a, b) {
            let getRepresentedObjects = (component) => component.representedObject;
            let representedObjectsA = a.map(getRepresentedObjects);
            let representedObjectsB = b.map(getRepresentedObjects);
            if (!Array.shallowEqual(representedObjectsA, representedObjectsB))
                return false;

            let getExtraComparisonData = (component) => component.comparisonData;
            let extraComparisonDataA = a.map(getExtraComparisonData);
            let extraComparisonDataB = b.map(getExtraComparisonData);
            return Array.shallowEqual(extraComparisonDataA, extraComparisonDataB);
        };

        if (this._components && componentsEqual(this._components, newComponents))
            return;

        if (this._components) {
            for (let component of this._components)
                component.removeEventListener(WI.HierarchicalPathComponent.Event.SiblingWasSelected, this._siblingPathComponentWasSelected, this);
        }

        this._components = newComponents.slice(0);

        for (let component of this._components)
            component.addEventListener(WI.HierarchicalPathComponent.Event.SiblingWasSelected, this._siblingPathComponentWasSelected, this);

        // Wait until layout to update the DOM.
        this._needsUpdate = true;

        // Update layout for the so other items can adjust to the extra space (or lack thereof) too.
        if (this.parentNavigationBar)
            this.parentNavigationBar.needsLayout();
    }

    get lastComponent()
    {
        return this._components.lastValue || null;
    }

    get alwaysShowLastPathComponentSeparator()
    {
        return this.element.classList.contains(WI.HierarchicalPathNavigationItem.AlwaysShowLastPathComponentSeparatorStyleClassName);
    }

    set alwaysShowLastPathComponentSeparator(flag)
    {
        if (flag)
            this.element.classList.add(WI.HierarchicalPathNavigationItem.AlwaysShowLastPathComponentSeparatorStyleClassName);
        else
            this.element.classList.remove(WI.HierarchicalPathNavigationItem.AlwaysShowLastPathComponentSeparatorStyleClassName);
    }

    update(options = {})
    {
        this._updateComponentsIfNeeded();

        super.update(options);

        var navigationBar = this.parentNavigationBar;
        if (!navigationBar)
            return;

        if (this._collapsedComponent) {
            this.element.removeChild(this._collapsedComponent.element);
            this._collapsedComponent = null;
        }

        let sizesToFit = navigationBar.sizesToFit;

        // Expand our components to full width to test if the items can fit at full width.
        for (var i = 0; i < this._components.length; ++i) {
            this._components[i].hidden = false;
            this._components[i].forcedWidth = null;
            this._components[i].hideTooltip = !sizesToFit;
        }

        if (options.expandOnly)
            return;

        if (sizesToFit)
            return;

        // Iterate over all the other navigation items in the bar and calculate their width.
        var totalOtherItemsWidth = 0;
        for (var i = 0; i < navigationBar.navigationItems.length; ++i) {
            // Skip ourself.
            if (navigationBar.navigationItems[i] === this)
                continue;

            // Skip flexible space items since they can take up no space at the minimum width.
            if (navigationBar.navigationItems[i] instanceof WI.FlexibleSpaceNavigationItem)
                continue;

            totalOtherItemsWidth += navigationBar.navigationItems[i].width;
        }

        // Calculate the width for all the components.
        var thisItemWidth = 0;
        var componentWidths = [];
        for (var i = 0; i < this._components.length; ++i) {
            var componentWidth = this._components[i].element.realOffsetWidth;
            componentWidths.push(componentWidth);
            thisItemWidth += componentWidth;
        }

        // If all our components fit with the other navigation items in the width of the bar,
        // then we don't need to collapse any components.
        var barWidth = navigationBar.element.realOffsetWidth;
        if (totalOtherItemsWidth + thisItemWidth <= barWidth)
            return;

        // Calculate the width we need to remove from our components, then iterate over them
        // and force their width to be smaller.
        var widthToRemove = totalOtherItemsWidth + thisItemWidth - barWidth;
        for (var i = 0; i < this._components.length; ++i) {
            var componentWidth = componentWidths[i];

            this._components[i].hideTooltip = false;

            // Try to take the whole width we need to remove from each component.
            var forcedWidth = componentWidth - widthToRemove;
            this._components[i].forcedWidth = forcedWidth;

            // Since components have a minimum width, we need to see how much was actually
            // removed and subtract that from what remans to be removed.
            componentWidths[i] = Math.max(this._components[i].minimumWidth, forcedWidth);
            widthToRemove -= componentWidth - componentWidths[i];

            // If there is nothing else to remove, then we can stop.
            if (widthToRemove <= 0)
                break;
        }

        // If there is nothing else to remove, then we can stop.
        if (widthToRemove <= 0)
            return;

        // If there are 3 or fewer components, then we can stop. Collapsing the middle of 3 components
        // does not save more than a few pixels over just the icon, so it isn't worth it unless there
        // are 4 or more components.
        if (this._components.length <= 3)
            return;

        // We want to collapse the middle components, so find the nearest middle index.
        var middle = this._components.length >> 1;
        var distance = -1;
        var i = middle;

        // Create a component that will represent the hidden components with a ellipse as the display name.
        this._collapsedComponent = new WI.HierarchicalPathComponent(ellipsis, []);
        this._collapsedComponent.collapsed = true;

        // Insert it in the middle, it doesn't matter exactly where since the elements around it will be hidden soon.
        this.element.insertBefore(this._collapsedComponent.element, this._components[middle].element);

        // Add the width of the collapsed component to the width we need to remove.
        widthToRemove += this._collapsedComponent.minimumWidth;

        var hiddenDisplayNames = [];

        // Loop through the components starting at the middle and fanning out in each direction.
        while (i >= 0 && i <= this._components.length - 1) {
            // Only hide components in the middle and never the ends.
            if (i > 0 && i < this._components.length - 1) {
                var component = this._components[i];
                component.hidden = true;

                // Remember the displayName so it can be put in the tool tip of the collapsed component.
                if (distance > 0)
                    hiddenDisplayNames.unshift(component.displayName);
                else
                    hiddenDisplayNames.push(component.displayName);

                // Fully subtract the hidden component's width.
                widthToRemove -= componentWidths[i];

                // If there is nothing else to remove, then we can stop.
                if (widthToRemove <= 0)
                    break;
            }

            // Calculate the next index.
            i = middle + distance;

            // Increment the distance when it is in the positive direction.
            if (distance > 0)
                ++distance;

            // Flip the direction of the distance.
            distance *= -1;
        }

        // Set the tool tip of the collapsed component.
        this._collapsedComponent.element.title = hiddenDisplayNames.join("\n");
    }

    // Protected

    get additionalClassNames()
    {
        return ["hierarchical-path"];
    }

    // Private

    _updateComponentsIfNeeded()
    {
        if (!this._needsUpdate)
            return;

        this._needsUpdate = false;

        this.element.removeChildren();
        this._collapsedComponent = null;

        for (let component of this._components)
            this.element.appendChild(component.element);
    }

    _siblingPathComponentWasSelected(event)
    {
        this.dispatchEventToListeners(WI.HierarchicalPathNavigationItem.Event.PathComponentWasSelected, event.data);
    }
};

WI.HierarchicalPathNavigationItem.AlwaysShowLastPathComponentSeparatorStyleClassName = "always-show-last-path-component-separator";

WI.HierarchicalPathNavigationItem.Event = {
    PathComponentWasSelected: "hierarchical-path-navigation-item-path-component-was-selected"
};
