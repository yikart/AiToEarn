/*
 *  Copyright (C) 2013 University of Washington. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
 * TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 * PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

WI.BackForwardEntry = class BackForwardEntry
{
    constructor(contentView, cookie)
    {
        this._contentView = contentView;

        // ContentViews may be shared across multiple ContentViewContainers.
        // A BackForwardEntry containing a tombstone doesn't actually have
        // the real ContentView, and so should not close it.
        this._tombstone = false;

        // Cookies are compared with Object.shallowEqual, so should not store objects or arrays.
        this._cookie = cookie || {};
        this._scrollPositions = [];

        contentView.saveToCookie(this._cookie);
    }

    // Public

    makeCopy(newCookie)
    {
        let copy = new WI.BackForwardEntry(this._contentView, newCookie || this.cookie);
        copy._tombstone = this._tombstone;
        copy._scrollPositions = this._scrollPositions.slice();
        return copy;
    }

    get contentView()
    {
        return this._contentView;
    }

    get cookie()
    {
        // Cookies are immutable; they represent a specific navigation action.
        return Object.shallowCopy(this._cookie);
    }

    get tombstone()
    {
        return this._tombstone;
    }

    set tombstone(tombstone)
    {
        this._tombstone = tombstone;
    }

    prepareToShow()
    {
        console.assert(!this._tombstone, "Should not be calling shown on a tombstone");

        this._restoreFromCookie();

        this.contentView.needsLayout();
    }

    prepareToHide()
    {
        console.assert(!this._tombstone, "Should not be calling hidden on a tombstone");

        this._saveScrollPositions();

        if (this._contentView.shouldSaveStateWhenHidden) {
            this._cookie = {};
            this._contentView.saveToCookie(this._cookie);
        }
    }

    isEqual(other)
    {
        if (!other)
            return false;
        return this._contentView === other._contentView && Object.shallowEqual(this._cookie, other._cookie);
    }

    // Private

    _restoreFromCookie()
    {
        this._restoreScrollPositions();
        this.contentView.restoreFromCookie(this.cookie);
    }

    _restoreScrollPositions()
    {
        // If no scroll positions are saved, do nothing.
        if (!this._scrollPositions.length)
            return;

        var scrollableElements = this.contentView.scrollableElements || [];
        console.assert(this._scrollPositions.length === scrollableElements.length);

        for (var i = 0; i < scrollableElements.length; ++i) {
            var position = this._scrollPositions[i];
            var element = scrollableElements[i];
            if (!element)
                continue;

            // Restore the top scroll position by either scrolling to the bottom or to the saved position.
            element.scrollTop = position.isScrolledToBottom ? element.scrollHeight : position.scrollTop;

            // Don't restore the left scroll position when scrolled to the bottom. This way the when content changes
            // the user won't be left in a weird horizontal position.
            element.scrollLeft = position.isScrolledToBottom ? 0 : position.scrollLeft;
        }
    }

    _saveScrollPositions()
    {
        var scrollableElements = this.contentView.scrollableElements || [];
        var scrollPositions = [];
        for (var i = 0; i < scrollableElements.length; ++i) {
            var element = scrollableElements[i];
            if (!element)
                continue;

            let position = {scrollTop: element.scrollTop, scrollLeft: element.scrollLeft};
            if (this.contentView.shouldKeepElementsScrolledToBottom)
                position.isScrolledToBottom = element.isScrolledToBottom();

            scrollPositions.push(position);
        }

        this._scrollPositions = scrollPositions;
    }
};
