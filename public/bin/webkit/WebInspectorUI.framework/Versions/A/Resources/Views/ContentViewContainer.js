/*
 * Copyright (C) 2013–2021 Apple Inc. All rights reserved.
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

WI.ContentViewContainer = class ContentViewContainer extends WI.View
{
    constructor({disableBackForwardNavigation} = {})
    {
        super();

        this._disableBackForwardNavigation = !!disableBackForwardNavigation;

        this.element.classList.add("content-view-container");

        this._backForwardList = [];
        this._currentIndex = -1;
    }

    // Public

    get currentIndex()
    {
        return this._currentIndex;
    }

    get backForwardList()
    {
        return this._backForwardList;
    }

    get currentContentView()
    {
        if (this._currentIndex < 0 || this._currentIndex > this._backForwardList.length - 1)
            return null;
        return this._backForwardList[this._currentIndex].contentView;
    }

    get currentBackForwardEntry()
    {
        if (this._currentIndex < 0 || this._currentIndex > this._backForwardList.length - 1)
            return null;
        return this._backForwardList[this._currentIndex];
    }

    contentViewForRepresentedObject(representedObject, onlyExisting, extraArguments)
    {
        return WI.ContentView.contentViewForRepresentedObject(representedObject, onlyExisting, extraArguments);
    }

    showContentViewForRepresentedObject(representedObject, extraArguments)
    {
        var contentView = this.contentViewForRepresentedObject(representedObject, false, extraArguments);
        if (!contentView)
            return null;

        this.showContentView(contentView);

        return contentView;
    }

    showContentView(contentView, cookie)
    {
        if (this._disableBackForwardNavigation && this.currentContentView) {
            this.replaceContentView(this.currentContentView, contentView, cookie);
            return;
        }

        console.assert(contentView instanceof WI.ContentView);
        if (!(contentView instanceof WI.ContentView))
            return null;

        // No change.
        if (contentView === this.currentContentView && !cookie)
            return contentView;

        // ContentViews can be shared between containers. If this content view is
        // not owned by us, it may need to be transferred to this container.
        if (contentView.parentContainer !== this)
            this._takeOwnershipOfContentView(contentView);

        let currentEntry = this.currentBackForwardEntry;

        // Try to find the last entry with the same content view so we can copy it
        // to preserve the last scroll positions. The supplied cookie (if any) could
        // still change the scroll position afterwards, but in most cases the cookie
        // is undefined, so we want to show with a state last used.
        let provisionalEntry = null;
        for (let i = this._backForwardList.length - 1; i >= 0; --i) {
            if (this._backForwardList[i].contentView === contentView) {
                provisionalEntry = this._backForwardList[i].makeCopy(cookie);
                break;
            }
        }

        if (!provisionalEntry)
            provisionalEntry = new WI.BackForwardEntry(contentView, cookie);

        // Don't do anything if we would have added an identical back/forward list entry.
        if (provisionalEntry.isEqual(currentEntry)) {
            currentEntry.prepareToShow();
            return currentEntry.contentView;
        }

        // Showing a content view will truncate the back/forward list after the current index and insert the content view
        // at the end of the list. Finally, the current index will be updated to point to the end of the back/forward list.

        // Increment the current index to where we will insert the content view.
        let newIndex = this._currentIndex + 1;

        // Insert the content view at the new index. This will remove any content views greater than or equal to the index.
        let removedEntries = this._backForwardList.splice(newIndex, this._backForwardList.length - newIndex, provisionalEntry);

        console.assert(newIndex === this._backForwardList.length - 1);
        console.assert(this._backForwardList[newIndex] === provisionalEntry);

        // Disassociate with the removed content views.
        for (let i = 0; i < removedEntries.length; ++i) {
            // Skip disassociation if this content view is still in the back/forward list.
            let shouldDissociateContentView = !this._backForwardList.some((existingEntry) => existingEntry.contentView === removedEntries[i].contentView);
            if (shouldDissociateContentView)
                this._disassociateFromContentView(removedEntries[i].contentView, removedEntries[i].tombstone);
        }

        // Associate with the new content view.
        contentView._parentContainer = this;

        this.showBackForwardEntryForIndex(newIndex);

        console.assert(!this._disableBackForwardNavigation || this._backForwardList.length <= 1);

        return contentView;
    }

    showBackForwardEntryForIndex(index)
    {
        console.assert(index >= 0 && index <= this._backForwardList.length - 1);
        if (index < 0 || index > this._backForwardList.length - 1)
            return;

        if (this._currentIndex === index)
            return;

        var previousEntry = this.currentBackForwardEntry;
        this._currentIndex = index;
        var currentEntry = this.currentBackForwardEntry;
        console.assert(currentEntry);

        if (previousEntry && (!currentEntry.contentView.isAttached || previousEntry.contentView !== currentEntry.contentView))
            this._hideEntry(previousEntry);
        this._showEntry(currentEntry);

        this.dispatchEventToListeners(WI.ContentViewContainer.Event.CurrentContentViewDidChange);
    }

    replaceContentView(oldContentView, newContentView, newCookie)
    {
        console.assert(oldContentView instanceof WI.ContentView);
        if (!(oldContentView instanceof WI.ContentView))
            return;

        console.assert(newContentView instanceof WI.ContentView);
        if (!(newContentView instanceof WI.ContentView))
            return;

        console.assert(oldContentView.parentContainer === this);
        if (oldContentView.parentContainer !== this)
            return;

        console.assert(!newContentView.parentContainer || newContentView.parentContainer === this);
        if (newContentView.parentContainer && newContentView.parentContainer !== this)
            return;

        var currentlyShowing = this.currentContentView === oldContentView;
        if (currentlyShowing)
            this._hideEntry(this.currentBackForwardEntry);

        // Disassociate with the old content view.
        this._disassociateFromContentView(oldContentView, false);

        // Associate with the new content view.
        newContentView._parentContainer = this;

        // Replace all occurrences of oldContentView with newContentView in the back/forward list.
        for (var i = 0; i < this._backForwardList.length; ++i) {
            if (this._backForwardList[i].contentView === oldContentView) {
                console.assert(!this._backForwardList[i].tombstone);
                let currentCookie = newCookie ?? this._backForwardList[i].cookie;
                this._backForwardList[i] = new WI.BackForwardEntry(newContentView, currentCookie);
            }
        }

        this._removeIdenticalAdjacentBackForwardEntries();

        // Re-show the current entry, because its content view instance was replaced.
        if (currentlyShowing) {
            this._showEntry(this.currentBackForwardEntry);
            this.dispatchEventToListeners(WI.ContentViewContainer.Event.CurrentContentViewDidChange);
        }

        console.assert(!this._disableBackForwardNavigation || this._backForwardList.length <= 1);
    }

    closeContentView(contentViewToClose)
    {
        if (!this._backForwardList.length) {
            console.assert(this._currentIndex === -1);
            return;
        }

        // Do a check to see if all the content views are instances of this prototype.
        // If they all are we can use the quicker closeAllContentViews method.
        var allSameContentView = true;
        for (var i = this._backForwardList.length - 1; i >= 0; --i) {
            if (this._backForwardList[i].contentView !== contentViewToClose) {
                allSameContentView = false;
                break;
            }
        }

        if (allSameContentView) {
            this.closeAllContentViews();
            return;
        }

        var visibleContentView = this.currentContentView;
        var backForwardListDidChange = false;
        // Hide and disassociate with all the content views that are the same as contentViewToClose.
        for (var i = this._backForwardList.length - 1; i >= 0; --i) {
            var entry = this._backForwardList[i];
            if (entry.contentView !== contentViewToClose)
                continue;

            if (entry.contentView === visibleContentView)
                this._hideEntry(entry);

            if (this._currentIndex >= i) {
                // Decrement the currentIndex since we will remove an item in the back/forward array
                // that is the current index or comes before it.
                --this._currentIndex;
            }

            this._disassociateFromContentView(entry.contentView, entry.tombstone);

            // Remove the item from the back/forward list.
            this._backForwardList.splice(i, 1);
            backForwardListDidChange = true;
        }

        if (backForwardListDidChange)
            this._removeIdenticalAdjacentBackForwardEntries();

        var currentEntry = this.currentBackForwardEntry;
        console.assert(currentEntry || (!currentEntry && this._currentIndex === -1));

        if (currentEntry && currentEntry.contentView !== visibleContentView || backForwardListDidChange) {
            this._showEntry(currentEntry);
            this.dispatchEventToListeners(WI.ContentViewContainer.Event.CurrentContentViewDidChange);
        }
    }

    closeAllContentViews(filter)
    {
        console.assert(!filter || typeof filter === "function");

        if (!this._backForwardList.length) {
            console.assert(this._currentIndex === -1);
            return;
        }

        var visibleContentView = this.currentContentView;

        // Hide and disassociate with all the content views.
        for (let i = 0; i < this._backForwardList.length; ++i) {
            let entry = this._backForwardList[i];
            if (filter && !filter(entry.contentView))
                continue;

            if (entry.contentView === visibleContentView)
                this._hideEntry(entry);

            this._disassociateFromContentView(entry.contentView, entry.tombstone);
        }

        this._backForwardList = [];
        this._currentIndex = -1;

        this.dispatchEventToListeners(WI.ContentViewContainer.Event.CurrentContentViewDidChange);
    }

    canGoBack()
    {
        return this._currentIndex > 0;
    }

    canGoForward()
    {
        return this._currentIndex < this._backForwardList.length - 1;
    }

    goBack()
    {
        if (!this.canGoBack())
            return;
        this.showBackForwardEntryForIndex(this._currentIndex - 1);
    }

    goForward()
    {
        if (!this.canGoForward())
            return;
        this.showBackForwardEntryForIndex(this._currentIndex + 1);
    }

    attached()
    {
        super.attached();

        var currentEntry = this.currentBackForwardEntry;
        if (currentEntry)
            this._showEntry(currentEntry);
    }

    detached()
    {
        var currentEntry = this.currentBackForwardEntry;
        if (currentEntry)
            this._hideEntry(currentEntry);

        super.detached();
    }

    // Private

    _takeOwnershipOfContentView(contentView)
    {
        console.assert(contentView.parentContainer !== this, "We already have ownership of the ContentView");
        if (contentView.parentContainer === this)
            return;

        if (contentView.parentContainer)
            contentView.parentContainer._placeTombstonesForContentView(contentView);

        contentView._parentContainer = this;

        this._clearTombstonesForContentView(contentView);

        // These contentView navigation items need to move to the new content browser.
        contentView.dispatchEventToListeners(WI.ContentView.Event.NavigationItemsDidChange);
    }

    _placeTombstonesForContentView(contentView)
    {
        console.assert(contentView.parentContainer === this);

        // Ensure another ContentViewContainer doesn't close this ContentView while we still have it.
        let tombstoneContentViewContainers = this._tombstoneContentViewContainersForContentView(contentView);
        console.assert(!tombstoneContentViewContainers.includes(this));

        let visibleContentView = this.currentContentView;

        for (let entry of this._backForwardList) {
            if (entry.contentView !== contentView)
                continue;

            if (entry.contentView === visibleContentView) {
                this._hideEntry(entry);
                visibleContentView = null;
            }

            console.assert(!entry.tombstone);
            entry.tombstone = true;

            tombstoneContentViewContainers.push(this);
        }
    }

    _clearTombstonesForContentView(contentView)
    {
        console.assert(contentView.parentContainer === this);

        let tombstoneContentViewContainers = this._tombstoneContentViewContainersForContentView(contentView);
        tombstoneContentViewContainers.removeAll(this);

        for (let entry of this._backForwardList) {
            if (entry.contentView !== contentView)
                continue;

            console.assert(entry.tombstone);
            entry.tombstone = false;
        }
    }

    _disassociateFromContentView(contentView, isTombstone)
    {
        // Just remove one of our tombstone back references.
        // There may be other back/forward entries that need a reference.
        if (isTombstone) {
            let tombstoneContentViewContainers = this._tombstoneContentViewContainersForContentView(contentView);
            tombstoneContentViewContainers.remove(this);
            return;
        }

        if (contentView.constructor.shouldNotRemoveFromDOMWhenHidden()) {
            // Hidden/non-visible extension tabs must remain attached to the DOM to avoid reloading.
            if (!contentView.visible)
                return;

            if (contentView.isAttached)
                this.removeSubview(contentView);
        }

        console.assert(!contentView.isAttached);

        if (!contentView._parentContainer)
            return;

        contentView._parentContainer = null;

        // If another ContentViewContainer has tombstones for this, just transfer
        // ownership to that ContentViewContainer and avoid closing the ContentView.
        // We don't care who we transfer this to, so just use the first.
        let tombstoneContentViewContainers = this._tombstoneContentViewContainersForContentView(contentView);
        if (tombstoneContentViewContainers && tombstoneContentViewContainers.length) {
            tombstoneContentViewContainers[0]._takeOwnershipOfContentView(contentView);
            return;
        }

        contentView.closed();

        if (contentView.representedObject)
            WI.ContentView.closedContentViewForRepresentedObject(contentView.representedObject);
    }

    _showEntry(entry)
    {
        console.assert(entry instanceof WI.BackForwardEntry);

        // We may be showing a tombstone from a BackForward list or when re-showing a container
        // that had previously had the content view transferred away from it.
        // Take over the ContentView.
        if (entry.tombstone) {
            this._takeOwnershipOfContentView(entry.contentView);
            console.assert(!entry.tombstone);
        }

        if (!this.subviews.includes(entry.contentView))
            this.addSubview(entry.contentView);
        else if (entry.contentView.constructor.shouldNotRemoveFromDOMWhenHidden()) {
            entry.contentView.visible = true;
            entry.contentView._didMoveToParent(this);
        }

        entry.prepareToShow();
    }

    _hideEntry(entry)
    {
        console.assert(entry instanceof WI.BackForwardEntry);

        // If this was a tombstone, the content view should already have been
        // hidden when we placed the tombstone.
        if (entry.tombstone)
            return;

        entry.prepareToHide();
        if (this.subviews.includes(entry.contentView)) {
            if (entry.contentView.constructor.shouldNotRemoveFromDOMWhenHidden()) {
                entry.contentView.visible = false;
                entry.contentView._didMoveToParent(null);
            } else
                this.removeSubview(entry.contentView);
        }
    }

    _tombstoneContentViewContainersForContentView(contentView)
    {
        let tombstoneContentViewContainers = contentView[WI.ContentViewContainer.TombstoneContentViewContainersSymbol];
        if (!tombstoneContentViewContainers)
            tombstoneContentViewContainers = contentView[WI.ContentViewContainer.TombstoneContentViewContainersSymbol] = [];
        return tombstoneContentViewContainers;
    }

    _removeIdenticalAdjacentBackForwardEntries()
    {
        if (this._backForwardList.length < 2)
            return;

        let previousEntry;
        for (let i = this._backForwardList.length - 1; i >= 0; --i) {
            let entry = this._backForwardList[i];
            if (!entry.isEqual(previousEntry)) {
                previousEntry = entry;
                continue;
            }

           if (this._currentIndex >= i) {
                // Decrement the currentIndex since we will remove an item in the back/forward array
                // that is the current index or comes before it.
                --this._currentIndex;
            }

            this._backForwardList.splice(i, 1);
        }
    }
};

WI.ContentViewContainer.Event = {
    CurrentContentViewDidChange: "content-view-container-current-content-view-did-change"
};

WI.ContentViewContainer.TombstoneContentViewContainersSymbol = Symbol("content-view-container-tombstone-content-view-containers");
