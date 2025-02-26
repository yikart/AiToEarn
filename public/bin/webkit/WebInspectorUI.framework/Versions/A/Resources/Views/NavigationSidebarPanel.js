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

WI.NavigationSidebarPanel = class NavigationSidebarPanel extends WI.SidebarPanel
{
    constructor(identifier, displayName, shouldAutoPruneStaleTopLevelResourceTreeElements, wantsTopOverflowShadow)
    {
        super(identifier, displayName);

        this.element.classList.add("navigation");

        this._updateContentOverflowShadowVisibilityDebouncer = new Debouncer(() => {
            this._updateContentOverflowShadowVisibility();
        });
        this._boundUpdateContentOverflowShadowVisibilitySoon = (event) => {
            this._updateContentOverflowShadowVisibilityDebouncer.delayForTime(0);
        };

        this.contentView.element.addEventListener("scroll", this._boundUpdateContentOverflowShadowVisibilitySoon);

        this._contentTreeOutlineGroup = new WI.TreeOutlineGroup;
        this._contentTreeOutline = this.createContentTreeOutline();

        this._filterBar = new WI.FilterBar;
        this._filterBar.addEventListener(WI.FilterBar.Event.FilterDidChange, this._filterDidChange, this);
        this.element.appendChild(this._filterBar.element);

        this._bottomOverflowShadowElement = document.createElement("div");
        this._bottomOverflowShadowElement.className = WI.NavigationSidebarPanel.OverflowShadowElementStyleClassName;
        this.element.appendChild(this._bottomOverflowShadowElement);

        if (wantsTopOverflowShadow) {
            this._topOverflowShadowElement = this.element.appendChild(document.createElement("div"));
            this._topOverflowShadowElement.classList.add(WI.NavigationSidebarPanel.OverflowShadowElementStyleClassName, "top");
        }

        window.addEventListener("resize", this._boundUpdateContentOverflowShadowVisibilitySoon);

        this._filtersSetting = new WI.Setting(identifier + "-navigation-sidebar-filters", {});
        this._filterBar.filters = this._filtersSetting.value;

        this._emptyContentPlaceholderElements = new Map;
        this._emptyFilterResults = new Set;

        this._shouldAutoPruneStaleTopLevelResourceTreeElements = shouldAutoPruneStaleTopLevelResourceTreeElements || false;

        if (this._shouldAutoPruneStaleTopLevelResourceTreeElements) {
            WI.Frame.addEventListener(WI.Frame.Event.MainResourceDidChange, this.pruneStaleResourceTreeElements, this);
            WI.Frame.addEventListener(WI.Frame.Event.ChildFrameWasRemoved, this.pruneStaleResourceTreeElements, this);
            WI.Frame.addEventListener(WI.Frame.Event.ResourceWasRemoved, this.pruneStaleResourceTreeElements, this);
        }

        this._pendingViewStateCookie = null;
        this._restoringState = false;
    }

    // Public

    get filterBar() { return this._filterBar; }
    get hasActiveFilters() { return this._filterBar.hasActiveFilters(); }

    closed()
    {
        window.removeEventListener("resize", this._boundUpdateContentOverflowShadowVisibilitySoon);

        if (this._shouldAutoPruneStaleTopLevelResourceTreeElements) {
            WI.Frame.removeEventListener(WI.Frame.Event.MainResourceDidChange, this.pruneStaleResourceTreeElements, this);
            WI.Frame.removeEventListener(WI.Frame.Event.ChildFrameWasRemoved, this.pruneStaleResourceTreeElements, this);
            WI.Frame.removeEventListener(WI.Frame.Event.ResourceWasRemoved, this.pruneStaleResourceTreeElements, this);
        }
    }

    get contentBrowser()
    {
        return this._contentBrowser;
    }

    set contentBrowser(contentBrowser)
    {
        this._contentBrowser = contentBrowser || null;
    }

    get contentTreeOutline()
    {
        return this._contentTreeOutline;
    }

    get contentTreeOutlines()
    {
        return Array.from(this._contentTreeOutlineGroup);
    }

    get currentRepresentedObject()
    {
        if (!this._contentBrowser)
            return null;

        return this._contentBrowser.currentRepresentedObjects[0] || null;
    }

    get restoringState()
    {
        return this._restoringState;
    }

    cancelRestoringState()
    {
        this._pendingViewStateCookie = null;
        if (!this._finalAttemptToRestoreViewStateTimeout)
            return;

        clearTimeout(this._finalAttemptToRestoreViewStateTimeout);
        this._finalAttemptToRestoreViewStateTimeout = undefined;
    }

    createContentTreeOutline({ignoreCookieRestoration, suppressFiltering} = {})
    {
        let contentTreeOutline = new WI.TreeOutline;
        contentTreeOutline.allowsRepeatSelection = true;
        contentTreeOutline.element.classList.add(WI.NavigationSidebarPanel.ContentTreeOutlineElementStyleClassName);

        this._contentTreeOutlineGroup.add(contentTreeOutline);

        this.contentView.element.appendChild(contentTreeOutline.element);

        if (!suppressFiltering) {
            contentTreeOutline.addEventListener(WI.TreeOutline.Event.ElementAdded, this._treeElementAddedOrChanged, this);
            contentTreeOutline.addEventListener(WI.TreeOutline.Event.ElementDidChange, this._treeElementAddedOrChanged, this);
            contentTreeOutline.addEventListener(WI.TreeOutline.Event.ElementDisclosureDidChanged, this._treeElementDisclosureDidChange, this);
            contentTreeOutline.addEventListener(WI.TreeOutline.Event.ElementRemoved, this._handleTreeElementRemoved, this);
        }

        contentTreeOutline[WI.NavigationSidebarPanel.IgnoreCookieRestoration] = ignoreCookieRestoration;
        contentTreeOutline[WI.NavigationSidebarPanel.SuppressFilteringSymbol] = suppressFiltering;

        return contentTreeOutline;
    }

    suppressFilteringOnTreeElements(treeElements)
    {
        console.assert(Array.isArray(treeElements), "TreeElements should be an array.");

        for (let treeElement of treeElements)
            treeElement[WI.NavigationSidebarPanel.SuppressFilteringSymbol] = true;

        this.updateFilter();
    }

    treeElementForRepresentedObject(representedObject)
    {
        let treeElement = null;
        for (let treeOutline of this.contentTreeOutlines) {
            treeElement = treeOutline.getCachedTreeElement(representedObject);
            if (treeElement)
                break;
        }

        return treeElement;
    }

    showDefaultContentView()
    {
        // Implemented by subclasses if needed to show a content view when no existing tree element is selected.
    }

    showDefaultContentViewForTreeElement(treeElement)
    {
        console.assert(treeElement);
        console.assert(treeElement.representedObject);
        if (!treeElement || !treeElement.representedObject)
            return false;

        // FIXME: <https://webkit.org/b/153634> Web Inspector: some background tabs think they are the foreground tab and do unnecessary work
        // Do not steal a content view if we are not the active tab/sidebar.
        if (!this.selected) {
            let contentView = this.contentBrowser.contentViewForRepresentedObject(treeElement.representedObject);
            if (contentView && contentView.parentContainer && contentView.parentContainer !== this.contentBrowser.contentViewContainer)
                return false;

            // contentView.parentContainer may be null. Check for selected tab, too.
            let selectedTabContentView = WI.tabBrowser.selectedTabContentView;
            if (selectedTabContentView && selectedTabContentView.contentBrowser !== this.contentBrowser)
                return false;
        }

        let contentView = this.contentBrowser.showContentViewForRepresentedObject(treeElement.representedObject);
        if (!contentView)
            return false;

        treeElement.revealAndSelect(true, false, true);
        return true;
    }

    canShowRepresentedObject(representedObject)
    {
        let selectedTabContentView = WI.tabBrowser.selectedTabContentView;
        console.assert(selectedTabContentView instanceof WI.TabContentView, "Missing TabContentView for NavigationSidebarPanel.");
        return selectedTabContentView && selectedTabContentView.canShowRepresentedObject(representedObject);
    }

    saveStateToCookie(cookie)
    {
        console.assert(cookie);

        if (!this._contentBrowser)
            return;

        let representedObject = this.currentRepresentedObject;
        if (!representedObject)
            return;

        cookie[WI.TypeIdentifierCookieKey] = representedObject.constructor.TypeIdentifier;

        if (representedObject.saveIdentityToCookie) {
            representedObject.saveIdentityToCookie(cookie);
            return;
        }

        console.error("NavigationSidebarPanel representedObject is missing a saveIdentityToCookie implementation.", representedObject);
    }

    // This can be supplemented by subclasses that admit a simpler strategy for static tree elements.
    restoreStateFromCookie(cookie, relaxedMatchDelay)
    {
        this._pendingViewStateCookie = cookie;
        this._restoringState = true;

        // Check if any existing tree elements in any outline match the cookie.
        this._checkOutlinesForPendingViewStateCookie();

        if (this._finalAttemptToRestoreViewStateTimeout)
            clearTimeout(this._finalAttemptToRestoreViewStateTimeout);

        if (relaxedMatchDelay === 0)
            return;

        function finalAttemptToRestoreViewStateFromCookie()
        {
            this._finalAttemptToRestoreViewStateTimeout = undefined;

            this._checkOutlinesForPendingViewStateCookie(true);

            this._pendingViewStateCookie = null;
            this._restoringState = false;
        }

        // If the specific tree element wasn't found, we may need to wait for the resources
        // to be registered. We try one last time (match type only) after an arbitrary amount of timeout.
        this._finalAttemptToRestoreViewStateTimeout = setTimeout(finalAttemptToRestoreViewStateFromCookie.bind(this), relaxedMatchDelay);
    }

    showEmptyContentPlaceholder(message, treeOutline)
    {
        console.assert(message);

        treeOutline = treeOutline || this._contentTreeOutline;

        let emptyContentPlaceholderElement = this._emptyContentPlaceholderElements.get(treeOutline);
        if (emptyContentPlaceholderElement)
            emptyContentPlaceholderElement.remove();

        emptyContentPlaceholderElement = message instanceof Node ? message : WI.createMessageTextView(message);
        this._emptyContentPlaceholderElements.set(treeOutline, emptyContentPlaceholderElement);

        let emptyContentPlaceholderParentElement = treeOutline.element.parentNode;
        emptyContentPlaceholderParentElement.appendChild(emptyContentPlaceholderElement);

        this._updateContentOverflowShadowVisibilityDebouncer.force();

        return emptyContentPlaceholderElement;
    }

    hideEmptyContentPlaceholder(treeOutline)
    {
        treeOutline = treeOutline || this._contentTreeOutline;

        let emptyContentPlaceholderElement = this._emptyContentPlaceholderElements.get(treeOutline);
        if (!emptyContentPlaceholderElement || !emptyContentPlaceholderElement.parentNode)
            return;

        emptyContentPlaceholderElement.remove();
        this._emptyContentPlaceholderElements.delete(treeOutline);

        this._updateContentOverflowShadowVisibilityDebouncer.force();
    }

    updateEmptyContentPlaceholder(message, treeOutline)
    {
        treeOutline = treeOutline || this._contentTreeOutline;

        if (!treeOutline.children.length) {
            // No tree elements, so no results.
            this.showEmptyContentPlaceholder(message, treeOutline);
        } else if (!this._emptyFilterResults.has(treeOutline)) {
            // There are tree elements, and not all of them are hidden by the filter.
            this.hideEmptyContentPlaceholder(treeOutline);
        }
    }

    updateFilter()
    {
        let filters = this._filterBar.filters;
        this._textFilterRegex = filters.text ? WI.SearchUtilities.filterRegExpForString(filters.text, WI.SearchUtilities.defaultSettings) : null;
        this._filtersSetting.value = filters;
        this._filterFunctions = filters.functions;

        this._filterBar.invalid = filters.text && !this._textFilterRegex;

        // Don't populate if we don't have any active filters.
        // We only need to populate when a filter needs to reveal.
        let dontPopulate = !this._filterBar.hasActiveFilters() && !this.shouldFilterPopulate();

        // Update all trees that allow filtering.
        for (let treeOutline of this.contentTreeOutlines) {
            if (treeOutline.hidden || treeOutline[WI.NavigationSidebarPanel.SuppressFilteringSymbol])
                continue;

            let currentTreeElement = treeOutline.children[0];
            while (currentTreeElement && !currentTreeElement.root) {
                if (!currentTreeElement[WI.NavigationSidebarPanel.SuppressFilteringSymbol]) {
                    const currentTreeElementWasHidden = currentTreeElement.hidden;
                    this.applyFiltersToTreeElement(currentTreeElement);
                    if (currentTreeElementWasHidden !== currentTreeElement.hidden)
                        this._treeElementWasFiltered(currentTreeElement);
                }

                currentTreeElement = currentTreeElement.traverseNextTreeElement(false, null, dontPopulate);
            }

            this._checkForEmptyFilterResults(treeOutline);
        }

        this._updateContentOverflowShadowVisibilityDebouncer.force();
    }

    resetFilter()
    {
        this._filterBar.clear();
    }

    shouldFilterPopulate()
    {
        // Overridden by subclasses if needed.
        return this.hasCustomFilters();
    }

    hasCustomFilters()
    {
        // Implemented by subclasses if needed.
        return false;
    }

    matchTreeElementAgainstCustomFilters(treeElement)
    {
        // Implemented by subclasses if needed.
        return true;
    }

    matchTreeElementAgainstFilterFunctions(treeElement)
    {
        if (!this._filterFunctions || !this._filterFunctions.length)
            return true;

        for (var filterFunction of this._filterFunctions) {
            if (filterFunction(treeElement))
                return true;
        }

        return false;
    }

    applyFiltersToTreeElement(treeElement)
    {
        if (!this._filterBar.hasActiveFilters() && !this.hasCustomFilters()) {
            // No filters, so make everything visible.
            treeElement.hidden = false;

            // If this tree element was expanded during filtering, collapse it again.
            if (treeElement.expanded && treeElement[WI.NavigationSidebarPanel.WasExpandedDuringFilteringSymbol]) {
                treeElement[WI.NavigationSidebarPanel.WasExpandedDuringFilteringSymbol] = false;
                treeElement.collapse();
            }

            return;
        }

        var filterableData = treeElement.filterableData || {};

        var flags = {expandTreeElement: false};
        var filterRegex = this._textFilterRegex;

        function matchTextFilter(inputs)
        {
            if (!inputs || !filterRegex)
                return true;

            console.assert(inputs instanceof Array, "filterableData.text should be an array of text inputs");

            // Loop over all the inputs and try to match them.
            for (var input of inputs) {
                if (!input)
                    continue;
                if (filterRegex.test(input)) {
                    flags.expandTreeElement = true;
                    return true;
                }
            }

            // No inputs matched.
            return false;
        }

        function makeVisible()
        {
            // Make this element visible.
            treeElement.hidden = false;

            // Make the ancestors visible and expand them.
            var currentAncestor = treeElement.parent;
            while (currentAncestor && !currentAncestor.root) {
                currentAncestor.hidden = false;

                // Only expand if the built-in filters matched, not custom filters.
                if (flags.expandTreeElement && !currentAncestor.expanded) {
                    currentAncestor.__wasExpandedDuringFiltering = true;
                    currentAncestor.expand();
                }

                currentAncestor = currentAncestor.parent;
            }
        }

        let suppressFiltering = treeElement[WI.NavigationSidebarPanel.SuppressFilteringSymbol];

        if (suppressFiltering || (matchTextFilter(filterableData.text) && this.matchTreeElementAgainstFilterFunctions(treeElement, flags) && this.matchTreeElementAgainstCustomFilters(treeElement, flags))) {
            // Make this element visible since it matches.
            makeVisible();

            // If this tree element didn't match a built-in filter and was expanded earlier during filtering, collapse it again.
            if (!flags.expandTreeElement && treeElement.expanded && treeElement[WI.NavigationSidebarPanel.WasExpandedDuringFilteringSymbol]) {
                treeElement[WI.NavigationSidebarPanel.WasExpandedDuringFilteringSymbol] = false;
                treeElement.collapse();
            }

            return;
        }

        // Make this element invisible since it does not match.
        treeElement.hidden = true;
    }

    attached()
    {
        super.attached();

        this._updateContentOverflowShadowVisibilityDebouncer.force();

        if (this._contentBrowser && !this._contentBrowser.currentContentView)
            this.showDefaultContentView();
    }

    // Protected

    pruneStaleResourceTreeElements()
    {
        for (let contentTreeOutline of this.contentTreeOutlines) {
            // Check all the ResourceTreeElements at the top level to make sure their Resource still has a parentFrame in the frame hierarchy.
            // If the parentFrame is no longer in the frame hierarchy we know it was removed due to a navigation or some other page change and
            // we should remove the issues for that resource.
            for (let i = contentTreeOutline.children.length - 1; i >= 0; --i) {
                let treeElement = contentTreeOutline.children[i];
                if (!(treeElement instanceof WI.ResourceTreeElement))
                    continue;

                // Local Overrides are never stale resources.
                let resource = treeElement.resource;
                if (resource.localResourceOverride)
                    continue;

                if (!resource.parentFrame || resource.parentFrame.isDetached())
                    contentTreeOutline.removeChildAtIndex(i, true, true);
            }
        }
    }

    // Private

    _updateContentOverflowShadowVisibility()
    {
        if (!this.visible)
            return;

        let scrollHeight = this.contentView.element.scrollHeight;
        let offsetHeight = this.contentView.element.offsetHeight;

        if (scrollHeight < offsetHeight) {
            if (this._topOverflowShadowElement)
                this._topOverflowShadowElement.style.opacity = 0;
            this._bottomOverflowShadowElement.style.opacity = 0;
            return;
        }

        let edgeThreshold = 1;
        let scrollTop = this.contentView.element.scrollTop;

        let topCoverage = Math.min(scrollTop, edgeThreshold);
        let bottomCoverage = Math.max(0, (offsetHeight + scrollTop) - (scrollHeight - edgeThreshold));

        if (this._topOverflowShadowElement)
            this._topOverflowShadowElement.style.opacity = (topCoverage / edgeThreshold).toFixed(1);
        this._bottomOverflowShadowElement.style.opacity = (1 - (bottomCoverage / edgeThreshold)).toFixed(1);
    }

    _checkForEmptyFilterResults(treeOutline)
    {
        if (treeOutline[WI.NavigationSidebarPanel.SuppressFilteringSymbol])
            return;

        // No tree elements, so don't touch the empty content placeholder.
        if (!treeOutline.children.length)
            return;

        // Iterate over all the top level tree elements. If any filterable elements are visible, return early.
        let filterableTreeElementFound = false;
        let unfilteredTreeElementFound = false;
        let currentTreeElement = treeOutline.children[0];
        while (currentTreeElement) {
            let suppressFilteringForTreeElement = currentTreeElement[WI.NavigationSidebarPanel.SuppressFilteringSymbol];
            if (!suppressFilteringForTreeElement) {
                filterableTreeElementFound = true;

                if (!currentTreeElement.hidden) {
                    unfilteredTreeElementFound = true;
                    break;
                }
            }

            currentTreeElement = currentTreeElement.nextSibling;
        }

        if (unfilteredTreeElementFound || !filterableTreeElementFound) {
            this.hideEmptyContentPlaceholder(treeOutline);
            this._emptyFilterResults.delete(treeOutline);
            return;
        }

        let message = WI.createMessageTextView(WI.UIString("No Filter Results"));

        let buttonElement = message.appendChild(document.createElement("button"));
        buttonElement.textContent = WI.UIString("Clear Filters");
        buttonElement.addEventListener("click", () => {
            this.resetFilter();
        });

        // All top level tree elements are hidden, so filtering hid everything. Show a message.
        this.showEmptyContentPlaceholder(message, treeOutline);
        this._emptyFilterResults.add(treeOutline);
    }

    _filterDidChange()
    {
        this.updateFilter();
    }

    _treeElementAddedOrChanged(event)
    {
        // Don't populate if we don't have any active filters.
        // We only need to populate when a filter needs to reveal.
        var dontPopulate = !this._filterBar.hasActiveFilters() && !this.shouldFilterPopulate();

        // Apply the filters to the tree element and its descendants.
        let treeElement = event.data.element;
        let currentTreeElement = treeElement;
        while (currentTreeElement && !currentTreeElement.root) {
            if (!currentTreeElement[WI.NavigationSidebarPanel.SuppressFilteringSymbol]) {
                const currentTreeElementWasHidden = currentTreeElement.hidden;
                this.applyFiltersToTreeElement(currentTreeElement);
                if (currentTreeElementWasHidden !== currentTreeElement.hidden)
                    this._treeElementWasFiltered(currentTreeElement);
            }

            currentTreeElement = currentTreeElement.traverseNextTreeElement(false, treeElement, dontPopulate);
        }

        this._checkForEmptyFilterResults(event.target);

        if (this.visible)
            this._updateContentOverflowShadowVisibilityDebouncer.delayForTime(0);

        if (this.selected && !treeElement.treeOutline[WI.NavigationSidebarPanel.IgnoreCookieRestoration])
            this._checkElementsForPendingViewStateCookie([treeElement]);
    }

    _treeElementDisclosureDidChange(event)
    {
        this._updateContentOverflowShadowVisibilityDebouncer.delayForTime(0);
    }

    _handleTreeElementRemoved(event)
    {
        this._checkForEmptyFilterResults(event.target);

        if (this.visible)
            this._updateContentOverflowShadowVisibilityDebouncer.delayForTime(0);
    }

    _isTreeElementWithoutRepresentedObject(treeElement)
    {
        return treeElement instanceof WI.FolderTreeElement
            || treeElement instanceof WI.DatabaseHostTreeElement
            || treeElement instanceof WI.IndexedDatabaseHostTreeElement
            || treeElement instanceof WI.ApplicationCacheManifestTreeElement
            || treeElement instanceof WI.ThreadTreeElement
            || treeElement instanceof WI.IdleTreeElement
            || treeElement instanceof WI.DOMBreakpointTreeElement
            || treeElement instanceof WI.EventBreakpointTreeElement
            || treeElement instanceof WI.URLBreakpointTreeElement
            || treeElement instanceof WI.SymbolicBreakpointTreeElement
            || treeElement instanceof WI.CSSStyleSheetTreeElement
            || typeof treeElement.representedObject === "string"
            || treeElement.representedObject instanceof String;
    }

    _checkOutlinesForPendingViewStateCookie(matchTypeOnly)
    {
        if (!this._pendingViewStateCookie)
            return;

        if (this.shouldAutoPruneStaleTopLevelResourceTreeElements)
            this.pruneStaleResourceTreeElements();

        var visibleTreeElements = [];
        this.contentTreeOutlines.forEach(function(outline) {
            if (outline[WI.NavigationSidebarPanel.IgnoreCookieRestoration])
                return;

            var currentTreeElement = outline.hasChildren ? outline.children[0] : null;
            while (currentTreeElement) {
                visibleTreeElements.push(currentTreeElement);
                currentTreeElement = currentTreeElement.traverseNextTreeElement(false, null, false);
            }
        });

        this._checkElementsForPendingViewStateCookie(visibleTreeElements, matchTypeOnly);
    }

    _checkElementsForPendingViewStateCookie(treeElements, matchTypeOnly)
    {
        if (!this._pendingViewStateCookie)
            return;

        var cookie = this._pendingViewStateCookie;

        function treeElementMatchesCookie(treeElement)
        {
            if (this._isTreeElementWithoutRepresentedObject(treeElement))
                return false;

            var representedObject = treeElement.representedObject;
            if (!representedObject)
                return false;

            var typeIdentifier = cookie[WI.TypeIdentifierCookieKey];
            if (typeIdentifier !== representedObject.constructor.TypeIdentifier)
                return false;

            if (matchTypeOnly)
                return !!typeIdentifier;

            var candidateObjectCookie = {};
            if (representedObject.saveIdentityToCookie)
                representedObject.saveIdentityToCookie(candidateObjectCookie);

            var candidateCookieKeys = Object.keys(candidateObjectCookie);
            return candidateCookieKeys.length && candidateCookieKeys.every((key) => candidateObjectCookie[key] === cookie[key]);
        }

        var matchedElement = null;
        treeElements.some((element) => {
            if (treeElementMatchesCookie.call(this, element)) {
                matchedElement = element;
                return true;
            }
            return false;
        });

        if (matchedElement) {
            let didShowContentView = this.showDefaultContentViewForTreeElement(matchedElement);
            if (!didShowContentView)
                return;

            this._pendingViewStateCookie = null;

            // Delay clearing the restoringState flag until the next runloop so listeners
            // checking for it in this runloop still know state was being restored.
            setTimeout(() => {
                this._restoringState = false;
            }, 0);

            if (this._finalAttemptToRestoreViewStateTimeout) {
                clearTimeout(this._finalAttemptToRestoreViewStateTimeout);
                this._finalAttemptToRestoreViewStateTimeout = undefined;
            }
        }
    }

    _treeElementWasFiltered(treeElement)
    {
        if (treeElement.selected || treeElement.hidden)
            return;

        let representedObject = this.currentRepresentedObject;
        if (!representedObject || treeElement.representedObject !== representedObject)
            return;

        const omitFocus = true;
        const selectedByUser = false;
        const suppressNotification = true;
        treeElement.revealAndSelect(omitFocus, selectedByUser, suppressNotification);
    }
};

WI.NavigationSidebarPanel.IgnoreCookieRestoration = Symbol("ignore-cookie-restoration");
WI.NavigationSidebarPanel.SuppressFilteringSymbol = Symbol("suppress-filtering");
WI.NavigationSidebarPanel.WasExpandedDuringFilteringSymbol = Symbol("was-expanded-during-filtering");

WI.NavigationSidebarPanel.OverflowShadowElementStyleClassName = "overflow-shadow";
WI.NavigationSidebarPanel.ContentTreeOutlineElementStyleClassName = "navigation-sidebar-panel-content-tree-outline";
