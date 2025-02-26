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

WI.ClusterContentView = class ClusterContentView extends WI.ContentView
{
    constructor(representedObject)
    {
        super(representedObject);

        this.element.classList.add("cluster");

        this._contentViewContainer = new WI.ContentViewContainer;
        this._contentViewContainer.addEventListener(WI.ContentViewContainer.Event.CurrentContentViewDidChange, this._currentContentViewDidChange, this);
        this.addSubview(this._contentViewContainer);

        WI.ContentView.addEventListener(WI.ContentView.Event.SelectionPathComponentsDidChange, this._contentViewSelectionPathComponentDidChange, this);
        WI.ContentView.addEventListener(WI.ContentView.Event.SupplementalRepresentedObjectsDidChange, this._contentViewSupplementalRepresentedObjectsDidChange, this);
        WI.ContentView.addEventListener(WI.ContentView.Event.NumberOfSearchResultsDidChange, this._contentViewNumberOfSearchResultsDidChange, this);
    }

    // Public

    get navigationItems()
    {
        var currentContentView = this._contentViewContainer.currentContentView;
        return currentContentView ? currentContentView.navigationItems : [];
    }

    get contentViewContainer()
    {
        return this._contentViewContainer;
    }

    get supportsSplitContentBrowser()
    {
        if (this._contentViewContainer.currentContentView)
            return this._contentViewContainer.currentContentView.supportsSplitContentBrowser;

        return super.supportsSplitContentBrowser;
    }

    get shouldSaveStateWhenHidden()
    {
        return true;
    }

    closed()
    {
        super.closed();

        this._contentViewContainer.closeAllContentViews();

        WI.ContentView.removeEventListener(WI.ContentView.Event.SelectionPathComponentsDidChange, this._contentViewSelectionPathComponentDidChange, this);
        WI.ContentView.removeEventListener(WI.ContentView.Event.SupplementalRepresentedObjectsDidChange, this._contentViewSupplementalRepresentedObjectsDidChange, this);
        WI.ContentView.removeEventListener(WI.ContentView.Event.NumberOfSearchResultsDidChange, this._contentViewNumberOfSearchResultsDidChange, this);
    }

    canGoBack()
    {
        return this._contentViewContainer.canGoBack();
    }

    canGoForward()
    {
        return this._contentViewContainer.canGoForward();
    }

    goBack()
    {
        this._contentViewContainer.goBack();
    }

    goForward()
    {
        this._contentViewContainer.goForward();
    }

    get scrollableElements()
    {
        if (!this._contentViewContainer.currentContentView)
            return [];
        return this._contentViewContainer.currentContentView.scrollableElements;
    }

    get selectionPathComponents()
    {
        if (!this._contentViewContainer.currentContentView)
            return [];
        return this._contentViewContainer.currentContentView.selectionPathComponents;
    }

    get supplementalRepresentedObjects()
    {
        if (!this._contentViewContainer.currentContentView)
            return [];
        return this._contentViewContainer.currentContentView.supplementalRepresentedObjects;
    }

    get handleCopyEvent()
    {
        var currentContentView = this._contentViewContainer.currentContentView;
        return currentContentView && typeof currentContentView.handleCopyEvent === "function" ? currentContentView.handleCopyEvent.bind(currentContentView) : null;
    }

    get supportsSave()
    {
        return !!this._contentViewContainer.currentContentView?.supportsSave;
    }

    get saveMode()
    {
        console.assert(this.supportsSave);
        return this._contentViewContainer.currentContentView?.saveMode;
    }

    get saveData()
    {
        console.assert(this.supportsSave);
        return this._contentViewContainer.currentContentView?.saveData;
    }

    get supportsSearch()
    {
        // Always return true so we can intercept the search query to resend it when switching content views.
        return true;
    }

    get numberOfSearchResults()
    {
        var currentContentView = this._contentViewContainer.currentContentView;
        if (!currentContentView || !currentContentView.supportsSearch)
            return null;
        return currentContentView.numberOfSearchResults;
    }

    get hasPerformedSearch()
    {
        var currentContentView = this._contentViewContainer.currentContentView;
        if (!currentContentView || !currentContentView.supportsSearch)
            return false;
        return currentContentView.hasPerformedSearch;
    }

    set automaticallyRevealFirstSearchResult(reveal)
    {
        var currentContentView = this._contentViewContainer.currentContentView;
        if (!currentContentView || !currentContentView.supportsSearch)
            return;
        currentContentView.automaticallyRevealFirstSearchResult = reveal;
    }

    performSearch(query)
    {
        this._searchQuery = query;

        var currentContentView = this._contentViewContainer.currentContentView;
        if (!currentContentView || !currentContentView.supportsSearch)
            return;
        currentContentView.performSearch(query);
    }

    searchCleared()
    {
        this._searchQuery = null;

        var currentContentView = this._contentViewContainer.currentContentView;
        if (!currentContentView || !currentContentView.supportsSearch)
            return;
        currentContentView.searchCleared();
    }

    searchQueryWithSelection()
    {
        var currentContentView = this._contentViewContainer.currentContentView;
        if (!currentContentView || !currentContentView.supportsSearch)
            return null;
        return currentContentView.searchQueryWithSelection();
    }

    revealPreviousSearchResult(changeFocus)
    {
        var currentContentView = this._contentViewContainer.currentContentView;
        if (!currentContentView || !currentContentView.supportsSearch)
            return;
        currentContentView.revealPreviousSearchResult(changeFocus);
    }

    revealNextSearchResult(changeFocus)
    {
        var currentContentView = this._contentViewContainer.currentContentView;
        if (!currentContentView || !currentContentView.supportsSearch)
            return;
        currentContentView.revealNextSearchResult(changeFocus);
    }

    // Private

    _currentContentViewDidChange(event)
    {
        var currentContentView = this._contentViewContainer.currentContentView;
        if (currentContentView && currentContentView.supportsSearch) {
            if (this._searchQuery)
                currentContentView.performSearch(this._searchQuery);
            else
                currentContentView.searchCleared();
        }

        this.dispatchEventToListeners(WI.ContentView.Event.SelectionPathComponentsDidChange);
        this.dispatchEventToListeners(WI.ContentView.Event.NumberOfSearchResultsDidChange);
        this.dispatchEventToListeners(WI.ContentView.Event.NavigationItemsDidChange);
    }

    _contentViewSelectionPathComponentDidChange(event)
    {
        if (event.target !== this._contentViewContainer.currentContentView)
            return;
        this.dispatchEventToListeners(WI.ContentView.Event.SelectionPathComponentsDidChange);
    }

    _contentViewSupplementalRepresentedObjectsDidChange(event)
    {
        if (event.target !== this._contentViewContainer.currentContentView)
            return;
        this.dispatchEventToListeners(WI.ContentView.Event.SupplementalRepresentedObjectsDidChange);
    }

    _contentViewNumberOfSearchResultsDidChange(event)
    {
        if (event.target !== this._contentViewContainer.currentContentView)
            return;
        this.dispatchEventToListeners(WI.ContentView.Event.NumberOfSearchResultsDidChange);
    }
};
