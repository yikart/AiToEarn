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

WI.FindBanner = class FindBanner extends WI.NavigationItem
{
    constructor(delegate, {alwaysShowing, className} = {})
    {
        super();

        this._delegate = delegate || null;
        this._alwaysShowing = alwaysShowing;

        this.element.classList.add("find-banner");

        if (className)
            this.element.classList.add(className);

        this._resultCountLabel = document.createElement("label");
        this.element.appendChild(this._resultCountLabel);

        this._inputField = document.createElement("input");
        this._inputField.type = "search";
        this._inputField.placeholder = " "; // This is necessary for :placeholder-shown.
        this._inputField.spellcheck = false;
        this._inputField.setAttribute("results", 5);
        this._inputField.setAttribute("autosave", "inspector-search");
        this._inputField.addEventListener("keydown", this._inputFieldKeyDown.bind(this), false);
        this._inputFieldInputThrottler = new Throttler(this._inputFieldInput.bind(this), 250);
        this._inputField.addEventListener("input", (event) => {
            this._inputFieldInputThrottler.fire(event);
        }, false);
        this.element.appendChild(this._inputField);

        this._previousResultButton = document.createElement("button");
        this._previousResultButton.classList.add("segmented", "previous-result");
        this._previousResultButton.disabled = true;
        this._previousResultButton.title = WI.UIString("Find Previous (%s)").format(WI.findPreviousKeyboardShortcut.displayName);
        this._previousResultButton.addEventListener("click", this._previousResultButtonClicked.bind(this));
        this.element.appendChild(this._previousResultButton);

        let previousResultButtonGlyphElement = document.createElement("div");
        previousResultButtonGlyphElement.classList.add(WI.FindBanner.SegmentGlyphStyleClassName);
        this._previousResultButton.appendChild(previousResultButtonGlyphElement);

        this._nextResultButton = document.createElement("button");
        this._nextResultButton.classList.add("segmented", "next-result");
        this._nextResultButton.disabled = true;
        this._nextResultButton.title = WI.UIString("Find Next (%s)").format(WI.findNextKeyboardShortcut.displayName);
        this._nextResultButton.addEventListener("click", this._nextResultButtonClicked.bind(this));
        this.element.appendChild(this._nextResultButton);

        let nextResultButtonGlyphElement = document.createElement("div");
        nextResultButtonGlyphElement.classList.add(WI.FindBanner.SegmentGlyphStyleClassName);
        this._nextResultButton.appendChild(nextResultButtonGlyphElement);

        if (this._alwaysShowing) {
            this.element.classList.add(WI.FindBanner.ShowingStyleClassName);
            this._clearAndBlurKeyboardShortcut = new WI.KeyboardShortcut(null, WI.KeyboardShortcut.Key.Escape, this.clearAndBlur.bind(this), this.element);
        } else {
            let doneButtonElement = document.createElement("button");
            doneButtonElement.textContent = WI.UIString("Done");
            doneButtonElement.addEventListener("click", this._doneButtonClicked.bind(this));
            this.element.appendChild(doneButtonElement);
            this._hideKeyboardShortcut = new WI.KeyboardShortcut(null, WI.KeyboardShortcut.Key.Escape, this.hide.bind(this), this.element);
        }

        this._numberOfResults = null;
        this._previousSearchValue = "";
    }

    // Public

    get delegate() { return this._delegate; }
    set delegate(newDelegate) { this._delegate = newDelegate || null; }
    get inputField() { return this._inputField; }
    get searchQuery() { return this._inputField.value || ""; }
    set searchQuery(query) { this._inputField.value = query || ""; }
    get numberOfResults() { return this._numberOfResults; }

    set numberOfResults(numberOfResults)
    {
        if (numberOfResults === undefined || isNaN(numberOfResults))
            numberOfResults = null;

        this._numberOfResults = numberOfResults;

        this._previousResultButton.disabled = this._nextResultButton.disabled = numberOfResults <= 0;

        if (numberOfResults === null)
            this._resultCountLabel.textContent = "";
        else if (numberOfResults <= 0)
            this._resultCountLabel.textContent = WI.UIString("Not found");
        else if (numberOfResults === 1)
            this._resultCountLabel.textContent = WI.UIString("1 match");
        else if (numberOfResults > 1)
            this._resultCountLabel.textContent = WI.UIString("%d matches").format(numberOfResults);
    }

    get targetElement()
    {
        return this._targetElement;
    }

    set targetElement(element)
    {
        function delayedWork()
        {
            oldTargetElement.classList.remove(WI.FindBanner.NoTransitionStyleClassName);
            this.element.classList.remove(WI.FindBanner.NoTransitionStyleClassName);
        }

        if (this._targetElement) {
            var oldTargetElement = this._targetElement;

            this._targetElement.classList.add(WI.FindBanner.NoTransitionStyleClassName);
            this._targetElement.classList.remove(WI.FindBanner.SupportsFindBannerStyleClassName);
            this._targetElement.classList.remove(WI.FindBanner.ShowingFindBannerStyleClassName);

            this.element.classList.add(WI.FindBanner.NoTransitionStyleClassName);

            if (!this._alwaysShowing)
                this.element.classList.remove(WI.FindBanner.ShowingStyleClassName);

            // Delay so we can remove the no transition style class after the other style changes are committed.
            setTimeout(delayedWork.bind(this), 0);
        }

        this._targetElement = element || null;

        if (this._targetElement)
            this._targetElement.classList.add(WI.FindBanner.SupportsFindBannerStyleClassName);
    }

    get showing()
    {
        return this.element.classList.contains(WI.FindBanner.ShowingStyleClassName);
    }

    focus()
    {
        // FIXME: Workaround for: <https://webkit.org/b/149504> Caret missing from <input> after clearing text and calling select()
        if (!this._inputField.value.length)
            this._inputField.focus();
        else
            this._inputField.select();
    }

    clearAndBlur()
    {
        this.numberOfResults = null;

        this._inputField.value = "";
        this._previousSearchValue = "";

        if (this._delegate.findBannerSearchCleared)
            this._delegate.findBannerSearchCleared();
        if (this._delegate.findBannerWantsToClearAndBlur)
            this._delegate.findBannerWantsToClearAndBlur();
    }

    show()
    {
        console.assert(this._targetElement);
        if (!this._targetElement)
            return;

        console.assert(this._targetElement.parentNode);
        if (!this._targetElement.parentNode)
            return;

        if (this.element.parentNode !== this._targetElement.parentNode)
            this._targetElement.parentNode.insertBefore(this.element, this._targetElement);

        function delayedWork()
        {
            this._targetElement.classList.add(WI.FindBanner.ShowingFindBannerStyleClassName);
            this.element.classList.add(WI.FindBanner.ShowingStyleClassName);

            this._inputField.select();
        }

        // Delay adding the classes in case the target element and/or the find banner were just added to
        // the document. Adding the class right away will prevent the animation from working the first time.
        setTimeout(delayedWork.bind(this), 0);

        this.dispatchEventToListeners(WI.FindBanner.Event.DidShow);
    }

    hide()
    {
        console.assert(this._targetElement);
        if (!this._targetElement)
            return;

        this._inputField.blur();

        this._targetElement.classList.remove(WI.FindBanner.ShowingFindBannerStyleClassName);

        if (!this._alwaysShowing)
            this.element.classList.remove(WI.FindBanner.ShowingStyleClassName);

        this.dispatchEventToListeners(WI.FindBanner.Event.DidHide);
    }

    // Private

    _inputFieldKeyDown(event)
    {
        if (event.keyIdentifier === "Enter") {
            if (this._numberOfResults > 0) {
                if (event.shiftKey)
                    this._delegate?.findBannerRevealPreviousResult?.(this);
                else
                    this._delegate?.findBannerRevealNextResult?.(this);
            }
        }
    }

    _inputFieldInput(event)
    {
        if (this._inputField.value) {
            if (this._previousSearchValue !== this.searchQuery) {
                if (this._delegate && typeof this._delegate.findBannerPerformSearch === "function")
                    this._delegate.findBannerPerformSearch(this, this.searchQuery);
            }
        } else {
            this.numberOfResults = null;
            if (this._delegate && typeof this._delegate.findBannerSearchCleared === "function")
                this._delegate.findBannerSearchCleared(this);
        }

        this._previousSearchValue = this.searchQuery;
    }

    _previousResultButtonClicked(event)
    {
        if (this._delegate && typeof this._delegate.findBannerRevealPreviousResult === "function")
            this._delegate.findBannerRevealPreviousResult(this);
    }

    _nextResultButtonClicked(event)
    {
        if (this._delegate && typeof this._delegate.findBannerRevealNextResult === "function")
            this._delegate.findBannerRevealNextResult(this);
    }

    _doneButtonClicked(event)
    {
        this.hide();
    }
};

WI.FindBanner.SupportsFindBannerStyleClassName = "supports-find-banner";
WI.FindBanner.ShowingFindBannerStyleClassName = "showing-find-banner";
WI.FindBanner.NoTransitionStyleClassName = "no-find-banner-transition";
WI.FindBanner.ShowingStyleClassName = "showing";
WI.FindBanner.SegmentGlyphStyleClassName = "glyph";

WI.FindBanner.Event = {
    DidShow: "find-banner-did-show",
    DidHide: "find-banner-did-hide"
};
