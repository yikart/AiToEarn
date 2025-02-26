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

WI.ContentBrowser = class ContentBrowser extends WI.View
{
    constructor(element, delegate, {hideBackForwardButtons, disableBackForwardNavigation, disableFindBanner, flexibleNavigationItem, contentViewNavigationItemGroup} = {})
    {
        super(element);

        this.element.classList.add("content-browser");

        this._navigationBar = new WI.NavigationBar;
        this.addSubview(this._navigationBar);

        this._contentViewContainer = new WI.ContentViewContainer({disableBackForwardNavigation});
        this._contentViewContainer.addEventListener(WI.ContentViewContainer.Event.CurrentContentViewDidChange, this._currentContentViewDidChange, this);
        this.addSubview(this._contentViewContainer);

        if (!hideBackForwardButtons) {
            let isRTL = WI.resolvedLayoutDirection() === WI.LayoutDirection.RTL;

            let goBack = () => { this.goBack(); };
            let goForward = () => { this.goForward(); };

            let backShortcutKey = isRTL ? WI.KeyboardShortcut.Key.Right : WI.KeyboardShortcut.Key.Left;
            let forwardShortcutKey = isRTL ? WI.KeyboardShortcut.Key.Left : WI.KeyboardShortcut.Key.Right;
            this._backKeyboardShortcut = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.CommandOrControl | WI.KeyboardShortcut.Modifier.Control, backShortcutKey, goBack, this.element);
            this._forwardKeyboardShortcut = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.CommandOrControl | WI.KeyboardShortcut.Modifier.Control, forwardShortcutKey, goForward, this.element);

            let leftArrow = "Images/BackForwardArrows.svg#left-arrow-mask";
            let rightArrow = "Images/BackForwardArrows.svg#right-arrow-mask";
            let backButtonImage = isRTL ? rightArrow : leftArrow;
            let forwardButtonImage = isRTL ? leftArrow : rightArrow;

            this._backNavigationItem = new WI.ButtonNavigationItem("back", WI.UIString("Back (%s)").format(this._backKeyboardShortcut.displayName), backButtonImage, 8, 13);
            this._backNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, goBack, this);
            this._backNavigationItem.enabled = false;

            this._forwardNavigationItem = new WI.ButtonNavigationItem("forward", WI.UIString("Forward (%s)").format(this._forwardKeyboardShortcut.displayName), forwardButtonImage, 8, 13);
            this._forwardNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, goForward, this);
            this._forwardNavigationItem.enabled = false;

            let navigationButtonsGroup = new WI.GroupNavigationItem([this._backNavigationItem, this._forwardNavigationItem]);
            this._navigationBar.addNavigationItem(navigationButtonsGroup);
        }

        if (!disableFindBanner) {
            this._findBanner = new WI.FindBanner(this);
            this._findBanner.addEventListener(WI.FindBanner.Event.DidShow, this._findBannerDidShow, this);
            this._findBanner.addEventListener(WI.FindBanner.Event.DidHide, this._findBannerDidHide, this);
        }

        this._hierarchicalPathNavigationItem = new WI.HierarchicalPathNavigationItem;
        this._hierarchicalPathNavigationItem.addEventListener(WI.HierarchicalPathNavigationItem.Event.PathComponentWasSelected, this._hierarchicalPathComponentWasSelected, this);
        this._navigationBar.addNavigationItem(this._hierarchicalPathNavigationItem);

        this._contentViewSelectionPathNavigationItem = new WI.HierarchicalPathNavigationItem;

        this._flexibleNavigationItem = flexibleNavigationItem || new WI.FlexibleSpaceNavigationItem;
        this._navigationBar.addNavigationItem(this._flexibleNavigationItem);

        this._currentContentViewNavigationItemsGroup = contentViewNavigationItemGroup || null;

        WI.ContentView.addEventListener(WI.ContentView.Event.SelectionPathComponentsDidChange, this._contentViewSelectionPathComponentDidChange, this);
        WI.ContentView.addEventListener(WI.ContentView.Event.SupplementalRepresentedObjectsDidChange, this._contentViewSupplementalRepresentedObjectsDidChange, this);
        WI.ContentView.addEventListener(WI.ContentView.Event.NumberOfSearchResultsDidChange, this._contentViewNumberOfSearchResultsDidChange, this);
        WI.ContentView.addEventListener(WI.ContentView.Event.NavigationItemsDidChange, this._contentViewNavigationItemsDidChange, this);

        this._delegate = delegate || null;

        this._currentContentViewNavigationItems = [];

        this._dispatchCurrentRepresentedObjectsDidChangeDebouncer = new Debouncer(() => {
            this.dispatchEventToListeners(WI.ContentBrowser.Event.CurrentRepresentedObjectsDidChange);
        });
    }

    // Public

    get navigationBar()
    {
        return this._navigationBar;
    }

    get contentViewContainer()
    {
        return this._contentViewContainer;
    }

    get delegate()
    {
        return this._delegate;
    }

    set delegate(newDelegate)
    {
        this._delegate = newDelegate || null;
    }

    get currentContentView()
    {
        return this._contentViewContainer.currentContentView;
    }

    get currentRepresentedObjects()
    {
        var representedObjects = [];

        var lastComponent = this._hierarchicalPathNavigationItem.lastComponent;
        if (lastComponent && lastComponent.representedObject)
            representedObjects.push(lastComponent.representedObject);

        lastComponent = this._contentViewSelectionPathNavigationItem.lastComponent;
        if (lastComponent && lastComponent.representedObject)
            representedObjects.push(lastComponent.representedObject);

        var currentContentView = this.currentContentView;
        if (currentContentView) {
            var supplementalRepresentedObjects = currentContentView.supplementalRepresentedObjects;
            if (supplementalRepresentedObjects && supplementalRepresentedObjects.length)
                representedObjects.pushAll(supplementalRepresentedObjects);
        }

        return representedObjects;
    }

    showContentViewForRepresentedObject(representedObject, cookie, extraArguments)
    {
        var contentView = this.contentViewForRepresentedObject(representedObject, false, extraArguments);
        return this._contentViewContainer.showContentView(contentView, cookie);
    }

    showContentView(contentView, cookie)
    {
        return this._contentViewContainer.showContentView(contentView, cookie);
    }

    contentViewForRepresentedObject(representedObject, onlyExisting, extraArguments)
    {
        return this._contentViewContainer.contentViewForRepresentedObject(representedObject, onlyExisting, extraArguments);
    }

    updateHierarchicalPathForCurrentContentView()
    {
        var currentContentView = this.currentContentView;
        this._updateHierarchicalPathNavigationItem(currentContentView ? currentContentView.representedObject : null);
    }

    canGoBack()
    {
        var currentContentView = this.currentContentView;
        if (currentContentView && currentContentView.canGoBack())
            return true;
        return this._contentViewContainer.canGoBack();
    }

    canGoForward()
    {
        var currentContentView = this.currentContentView;
        if (currentContentView && currentContentView.canGoForward())
            return true;
        return this._contentViewContainer.canGoForward();
    }

    goBack()
    {
        var currentContentView = this.currentContentView;
        if (currentContentView && currentContentView.canGoBack()) {
            currentContentView.goBack();
            this._updateBackForwardButtons();
            return;
        }

        this._contentViewContainer.goBack();

        // The _updateBackForwardButtons function is called by _currentContentViewDidChange,
        // so it does not need to be called here.
    }

    goForward()
    {
        var currentContentView = this.currentContentView;
        if (currentContentView && currentContentView.canGoForward()) {
            currentContentView.goForward();
            this._updateBackForwardButtons();
            return;
        }

        this._contentViewContainer.goForward();

        // The _updateBackForwardButtons function is called by _currentContentViewDidChange,
        // so it does not need to be called here.
    }

    showFindBanner()
    {
        if (!this._findBanner)
            return;

        var currentContentView = this.currentContentView;
        if (!currentContentView || !currentContentView.supportsSearch)
            return;

        if (currentContentView.supportsCustomFindBanner) {
            currentContentView.showCustomFindBanner();
            return;
        }

        this._findBanner.show();
    }

    attached()
    {
        super.attached();

        this._updateContentViewSelectionPathNavigationItem(this.currentContentView);
        this.updateHierarchicalPathForCurrentContentView();
    }

    // Global ContentBrowser KeyboardShortcut handlers

    handlePopulateFindShortcut()
    {
        let currentContentView = this.currentContentView;
        if (!currentContentView?.supportsSearch)
            return;

        if (!WI.updateFindString(currentContentView.searchQueryWithSelection()))
            return;

        this._findBanner.searchQuery = WI.findString;

        currentContentView.performSearch(this._findBanner.searchQuery);
    }

    async handleFindNextShortcut()
    {
        if (!this._findBanner.showing && this._findBanner.searchQuery !== WI.findString) {
            let searchQuery = WI.findString;
            this._findBanner.searchQuery = searchQuery;

            let currentContentView = this.currentContentView;
            if (currentContentView?.supportsSearch) {
                currentContentView.performSearch(this._findBanner.searchQuery);
                await currentContentView.awaitEvent(WI.ContentView.Event.NumberOfSearchResultsDidChange, this);
                if (this._findBanner.searchQuery !== searchQuery || this.currentContentView !== currentContentView)
                    return;
            }
        }

        this.findBannerRevealNextResult(this._findBanner);
    }

    async handleFindPreviousShortcut()
    {
        if (!this._findBanner.showing && this._findBanner.searchQuery !== WI.findString) {
            let searchQuery = WI.findString;
            this._findBanner.searchQuery = searchQuery;

            let currentContentView = this.currentContentView;
            if (currentContentView?.supportsSearch) {
                currentContentView.performSearch(this._findBanner.searchQuery);
                await currentContentView.awaitEvent(WI.ContentView.Event.NumberOfSearchResultsDidChange, this);
                if (this._findBanner.searchQuery !== searchQuery || this.currentContentView !== currentContentView)
                    return;
            }
        }

        this.findBannerRevealPreviousResult(this._findBanner);
    }

    // FindBanner delegate

    findBannerPerformSearch(findBanner, query)
    {
        let currentContentView = this.currentContentView;
        if (!currentContentView || !currentContentView.supportsSearch)
            return;

        currentContentView.performSearch(query);
    }

    findBannerSearchCleared(findBanner)
    {
        let currentContentView = this.currentContentView;
        if (!currentContentView || !currentContentView.supportsSearch)
            return;

        currentContentView.searchCleared();
    }

    findBannerRevealPreviousResult(findBanner)
    {
        let currentContentView = this.currentContentView;
        if (!currentContentView || !currentContentView.supportsSearch)
            return;

        currentContentView.revealPreviousSearchResult(!findBanner.showing);
    }

    findBannerRevealNextResult(findBanner)
    {
        let currentContentView = this.currentContentView;
        if (!currentContentView || !currentContentView.supportsSearch)
            return;

        currentContentView.revealNextSearchResult(!findBanner.showing);
    }

    // Private

    _findBannerDidShow(event)
    {
        var currentContentView = this.currentContentView;
        if (!currentContentView || !currentContentView.supportsSearch)
            return;

        currentContentView.automaticallyRevealFirstSearchResult = true;
        if (this._findBanner.searchQuery !== "")
            currentContentView.performSearch(this._findBanner.searchQuery);
    }

    _findBannerDidHide(event)
    {
        var currentContentView = this.currentContentView;
        if (!currentContentView || !currentContentView.supportsSearch)
            return;

        currentContentView.automaticallyRevealFirstSearchResult = false;
        currentContentView.searchHidden();
    }

    _contentViewNumberOfSearchResultsDidChange(event)
    {
        if (!this._findBanner)
            return;

        if (event.target !== this.currentContentView)
            return;

        this._findBanner.numberOfResults = this.currentContentView.numberOfSearchResults;
    }

    _updateHierarchicalPathNavigationItem(representedObject)
    {
        if (!this.delegate || typeof this.delegate.contentBrowserTreeElementForRepresentedObject !== "function")
            return;

        var treeElement = representedObject ? this.delegate.contentBrowserTreeElementForRepresentedObject(this, representedObject) : null;
        var pathComponents = [];

        while (treeElement && !treeElement.root) {
            var pathComponent = new WI.GeneralTreeElementPathComponent(treeElement);
            pathComponents.unshift(pathComponent);
            treeElement = treeElement.parent;
        }

        this._hierarchicalPathNavigationItem.components = pathComponents;
    }

    _updateContentViewSelectionPathNavigationItem(contentView)
    {
        var selectionPathComponents = contentView ? contentView.selectionPathComponents || [] : [];
        this._contentViewSelectionPathNavigationItem.components = selectionPathComponents;

        if (this._currentContentViewNavigationItemsGroup)
            return;

        if (!selectionPathComponents.length) {
            this._hierarchicalPathNavigationItem.alwaysShowLastPathComponentSeparator = false;
            this._navigationBar.removeNavigationItem(this._contentViewSelectionPathNavigationItem);
            return;
        }

        // Insert the _contentViewSelectionPathNavigationItem after the _hierarchicalPathNavigationItem, if needed.
        if (!this._navigationBar.navigationItems.includes(this._contentViewSelectionPathNavigationItem)) {
            var hierarchicalPathItemIndex = this._navigationBar.navigationItems.indexOf(this._hierarchicalPathNavigationItem);
            console.assert(hierarchicalPathItemIndex !== -1);
            this._navigationBar.insertNavigationItem(this._contentViewSelectionPathNavigationItem, hierarchicalPathItemIndex + 1);
            this._hierarchicalPathNavigationItem.alwaysShowLastPathComponentSeparator = true;
        }
    }

    _updateBackForwardButtons()
    {
        if (!this._backNavigationItem || !this._forwardNavigationItem)
            return;

        this._backNavigationItem.enabled = this.canGoBack();
        this._forwardNavigationItem.enabled = this.canGoForward();
    }

    _updateContentViewNavigationItems(forceUpdate)
    {
        let currentContentView = this.currentContentView;
        if (!currentContentView) {
            this._removeAllNavigationItems();
            this._currentContentViewNavigationItems = [];
            if (this._currentContentViewNavigationItemsGroup)
                this._currentContentViewNavigationItems.push(this._contentViewSelectionPathNavigationItem);
            return;
        }

        // If the ContentView is a tombstone within our ContentViewContainer, don't steal its navigationItems.
        // Only the owning ContentBrowser should have the navigationItems.
        if (currentContentView.parentContainer !== this._contentViewContainer)
            return;

        if (!forceUpdate) {
            let previousItems = this._currentContentViewNavigationItems.filter((item) => !(item instanceof WI.DividerNavigationItem));
            let isUnchanged = Array.shallowEqual(previousItems, currentContentView.navigationItems);

            if (isUnchanged)
                return;
        }

        this._removeAllNavigationItems();

        let navigationBar = this.navigationBar;
        let insertionIndex = navigationBar.navigationItems.indexOf(this._flexibleNavigationItem) + 1;
        console.assert(insertionIndex >= 0);

        // Keep track of items we'll be adding to the navigation bar.
        let newNavigationItems = [];
        let shouldInsert = !this._currentContentViewNavigationItemsGroup;

        // Go through each of the items of the new content view and add a divider before them.
        currentContentView.navigationItems.forEach(function(navigationItem, index) {
            if (shouldInsert)
                navigationBar.insertNavigationItem(navigationItem, insertionIndex++);
            newNavigationItems.push(navigationItem);
        });

        if (this._currentContentViewNavigationItemsGroup)
            this._currentContentViewNavigationItemsGroup.navigationItems = [this._contentViewSelectionPathNavigationItem].concat(newNavigationItems);

        // Remember the navigation items we inserted so we can remove them
        // for the next content view.
        this._currentContentViewNavigationItems = newNavigationItems;
    }

    _removeAllNavigationItems()
    {
        if (this._currentContentViewNavigationItemsGroup)
            this._currentContentViewNavigationItemsGroup.navigationItems = [];
        else {
            for (let navigationItem of this._currentContentViewNavigationItems) {
                if (navigationItem.parentNavigationBar)
                    navigationItem.parentNavigationBar.removeNavigationItem(navigationItem);
            }
        }
    }

    _updateFindBanner(currentContentView)
    {
        if (!this._findBanner)
            return;

        if (!currentContentView) {
            this._findBanner.targetElement = null;
            this._findBanner.numberOfResults = null;
            return;
        }

        this._findBanner.targetElement = currentContentView.element;
        this._findBanner.numberOfResults = currentContentView.hasPerformedSearch ? currentContentView.numberOfSearchResults : null;

        if (currentContentView.supportsSearch && this._findBanner.searchQuery) {
            currentContentView.automaticallyRevealFirstSearchResult = this._findBanner.showing;
            currentContentView.performSearch(this._findBanner.searchQuery);
        }
    }

    _contentViewSelectionPathComponentDidChange(event)
    {
        if (event.target !== this.currentContentView)
            return;

        // If the ContentView is a tombstone within our ContentViewContainer, do nothing. Let the owning ContentBrowser react.
        if (event.target.parentContainer !== this._contentViewContainer)
            return;

        this._updateContentViewSelectionPathNavigationItem(event.target);
        this._updateBackForwardButtons();

        this._updateContentViewNavigationItems();

        this._navigationBar.needsLayout();

        this._dispatchCurrentRepresentedObjectsDidChangeDebouncer.delayForTime(0);
    }

    _contentViewSupplementalRepresentedObjectsDidChange(event)
    {
        if (event.target !== this.currentContentView)
            return;

        // If the ContentView is a tombstone within our ContentViewContainer, do nothing. Let the owning ContentBrowser react.
        if (event.target.parentContainer !== this._contentViewContainer)
            return;

        this._dispatchCurrentRepresentedObjectsDidChangeDebouncer.delayForTime(0);
    }

    _currentContentViewDidChange(event)
    {
        var currentContentView = this.currentContentView;

        this._updateHierarchicalPathNavigationItem(currentContentView ? currentContentView.representedObject : null);
        this._updateContentViewSelectionPathNavigationItem(currentContentView);
        this._updateBackForwardButtons();

        this._updateContentViewNavigationItems();
        this._updateFindBanner(currentContentView);

        this._navigationBar.needsLayout();

        this.dispatchEventToListeners(WI.ContentBrowser.Event.CurrentContentViewDidChange);

        this._dispatchCurrentRepresentedObjectsDidChangeDebouncer.force();
    }

    _contentViewNavigationItemsDidChange(event)
    {
        if (event.target !== this.currentContentView)
            return;

        // If the ContentView is a tombstone within our ContentViewContainer, do nothing. Let the owning ContentBrowser react.
        if (event.target.parentContainer !== this._contentViewContainer)
            return;

        const forceUpdate = true;
        this._updateContentViewNavigationItems(forceUpdate);
        this._navigationBar.needsLayout();
    }

    _hierarchicalPathComponentWasSelected(event)
    {
        console.assert(event.data.pathComponent instanceof WI.GeneralTreeElementPathComponent);

        var treeElement = event.data.pathComponent.generalTreeElement;
        var originalTreeElement = treeElement;

        // Some tree elements (like folders) are not viewable. Find the first descendant that is viewable.
        while (treeElement && !WI.ContentView.isViewable(treeElement.representedObject))
            treeElement = treeElement.traverseNextTreeElement(false, originalTreeElement, false);

        if (!treeElement)
            return;

        treeElement.revealAndSelect();
    }
};

WI.ContentBrowser.Event = {
    CurrentRepresentedObjectsDidChange: "content-browser-current-represented-objects-did-change",
    CurrentContentViewDidChange: "content-browser-current-content-view-did-change"
};
