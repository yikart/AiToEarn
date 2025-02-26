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

WI.CompletionSuggestionsView = class CompletionSuggestionsView extends WI.Object
{
    constructor(delegate, {preventBlur} = {})
    {
        super();

        this._delegate = delegate || null;
        this._preventBlur = preventBlur || false;

        this._completions = [];
        this._selectedIndex = NaN;
        this._moveIntervalIdentifier = null;

        this._element = document.createElement("div");
        this._element.setAttribute("dir", "ltr");
        this._element.classList.add("completion-suggestions", WI.Popover.IgnoreAutoDismissClassName);

        this._containerElement = document.createElement("div");
        this._containerElement.classList.add("completion-suggestions-container");
        this._containerElement.addEventListener("mousedown", this._mouseDown.bind(this));
        this._containerElement.addEventListener("mouseup", this._mouseUp.bind(this));
        this._containerElement.addEventListener("click", this._itemClicked.bind(this));
        this._element.appendChild(this._containerElement);
    }

    // Public

    get delegate()
    {
        return this._delegate;
    }

    get visible()
    {
        return !!this._element.parentNode;
    }

    get selectedIndex()
    {
        return this._selectedIndex;
    }

    set selectedIndex(index)
    {
        var selectedItemElement = this._selectedItemElement;
        if (selectedItemElement)
            selectedItemElement.classList.remove("selected");

        this._selectedIndex = index;

        selectedItemElement = this._selectedItemElement;
        if (selectedItemElement) {
            selectedItemElement.classList.add("selected");
            selectedItemElement.scrollIntoViewIfNeeded(false);
        }

        if (this._completions[this._selectedIndex])
            this._delegate?.completionSuggestionsSelectedCompletion?.(this, WI.CSSCompletions.getCompletionText(this._completions[this._selectedIndex]));
    }

    selectNext()
    {
        var count = this._containerElement.children.length;

        if (isNaN(this._selectedIndex) || this._selectedIndex === count - 1)
            this.selectedIndex = 0;
        else
            ++this.selectedIndex;
    }

    selectPrevious()
    {
        if (isNaN(this._selectedIndex) || this._selectedIndex === 0)
            this.selectedIndex = this._containerElement.children.length - 1;
        else
            --this.selectedIndex;
    }

    isHandlingClickEvent()
    {
        return this._mouseIsDown;
    }

    show(anchorBounds)
    {
        // Measure the container so we can know the intrinsic size of the items.
        let intrinsicSize = WI.measureElement(this._containerElement);
        let containerWidth = Math.ceil(intrinsicSize.width);
        let containerHeight = Math.ceil(intrinsicSize.height);

        // Lay out the suggest-box relative to the anchorBounds.
        let margin = 10;
        let absoluteMaximumHeight = 160;

        let x = anchorBounds.origin.x;
        let y = anchorBounds.origin.y + anchorBounds.size.height;

        let maximumWidth = window.innerWidth - anchorBounds.origin.x - margin;
        let width = Math.min(containerWidth, maximumWidth);

        if (width < containerWidth) {
            // Shift the suggest box to the left to accommodate the content without trimming to the BODY edge.
            maximumWidth = window.innerWidth - margin;
            width = Math.min(containerWidth, maximumWidth);
            x = document.body.offsetWidth - width;
        }

        let aboveHeight = anchorBounds.origin.y;
        let underHeight = window.innerHeight - anchorBounds.origin.y - anchorBounds.size.height;
        let maximumHeight = Math.min(absoluteMaximumHeight, Math.max(underHeight, aboveHeight) - margin);
        let height = Math.min(containerHeight, maximumHeight);

        // Position the suggestions below the anchor. If there is no room, position the suggestions above.
        if (underHeight - height < 0)
            y = aboveHeight - height;

        this._element.style.left = x + "px";
        this._element.style.top = y + "px";
        this._element.style.width = width + "px";
        this._element.style.height = height + "px";

        if (!this._element.parentNode)
            document.body.appendChild(this._element);
    }

    hide()
    {
        this._element.remove();
        this._stopMoveTimer();
    }

    hideWhenElementMoves(element)
    {
        this._stopMoveTimer();
        let initialClientRect = element.getBoundingClientRect();

        this._moveIntervalIdentifier = setInterval(() => {
            let clientRect = element.getBoundingClientRect();
            if (clientRect.x !== initialClientRect.x || clientRect.y !== initialClientRect.y)
                this.hide();
        }, 200);

    }

    update(completions, selectedIndex)
    {
        this._containerElement.removeChildren();
        this._completions = completions;

        if (typeof selectedIndex === "number")
            this._selectedIndex = selectedIndex;

        for (let completion of completions) {
            var itemElement = document.createElement("div");
            itemElement.classList.add("item");

            if (typeof completion === "string")
                itemElement.textContent = completion;
            else if (completion instanceof WI.QueryResult)
                itemElement.appendChild(this._createMatchedCompletionFragment(completion.value, completion.matchingTextRanges));

            this._containerElement.appendChild(itemElement);
            this._delegate?.completionSuggestionsViewCustomizeCompletionElement?.(this, itemElement, completion);
        }

        let selectedItemElement = this._selectedItemElement;
        if (selectedItemElement) {
            selectedItemElement.classList.add("selected");
            selectedItemElement.scrollIntoViewIfNeeded(false);
        }
    }

    // Private

    get _selectedItemElement()
    {
        if (isNaN(this._selectedIndex))
            return null;

        var element = this._containerElement.children[this._selectedIndex] || null;
        console.assert(element);
        return element;
    }

    _createMatchedCompletionFragment(completionText, matchingTextRanges)
    {
        let completionFragment = document.createDocumentFragment();
        let lastIndex = 0;
        for (let textRange of matchingTextRanges) {
            console.assert(textRange.startColumn >= 0 && textRange.startColumn < completionText.length, textRange);
            console.assert(textRange.endColumn > 0 && textRange.endColumn <= completionText.length, textRange);
            console.assert(textRange.startColumn < textRange.endColumn);

            if (textRange.startColumn > lastIndex)
                completionFragment.append(completionText.substring(lastIndex, textRange.startColumn));

            let matchedSpan = document.createElement("span");
            matchedSpan.classList.add("matched");
            matchedSpan.append(completionText.substring(textRange.startColumn, textRange.endColumn));
            completionFragment.append(matchedSpan);
            lastIndex = textRange.endColumn;
        }

        if (lastIndex < completionText.length)
            completionFragment.append(completionText.substring(lastIndex, completionText.length));

        return completionFragment;
    }

    _mouseDown(event)
    {
        if (event.button !== 0)
            return;

        if (this._preventBlur)
            event.preventDefault();

        this._mouseIsDown = true;
    }

    _mouseUp(event)
    {
        if (event.button !== 0)
            return;
        this._mouseIsDown = false;
    }

    _itemClicked(event)
    {
        if (event.button !== 0)
            return;

        let itemElement = event.target.closest(".item");
        console.assert(itemElement);
        if (!itemElement)
            return;

        if (this._delegate && typeof this._delegate.completionSuggestionsClickedCompletion === "function")
            this._delegate.completionSuggestionsClickedCompletion(this, itemElement.textContent);
    }

    _stopMoveTimer()
    {
        if (!this._moveIntervalIdentifier)
            return;

        clearInterval(this._moveIntervalIdentifier);
        this._moveIntervalIdentifier = null;
    }
};
