/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
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

WI.SpreadsheetTextField = class SpreadsheetTextField
{
    constructor(delegate, element, completionProvider)
    {
        this._delegate = delegate;
        this._element = element;
        this._pendingValue = null;

        this._completionProvider = completionProvider || null;
        if (this._completionProvider) {
            this._suggestionHintElement = document.createElement("span");
            this._suggestionHintElement.contentEditable = false;
            this._suggestionHintElement.classList.add("completion-hint");
            this._suggestionsView = new WI.CompletionSuggestionsView(this, {preventBlur: true});
        }

        this._element.classList.add("spreadsheet-text-field");

        this._element.addEventListener("mousedown", this._handleMouseDown.bind(this), true);
        this._element.addEventListener("click", this._handleClick.bind(this));
        this._element.addEventListener("blur", this._handleBlur.bind(this));
        this._element.addEventListener("keydown", this._handleKeyDown.bind(this));
        this._element.addEventListener("keyup", this._handleKeyUp.bind(this));
        this._element.addEventListener("input", this._handleInput.bind(this));

        this._editing = false;
        this._preventDiscardingCompletionsOnKeyUp = false;
        this._keyDownCaretPosition = -1;
        this._valueBeforeEditing = "";
        this._completionPrefix = "";
        this._completionText = "";
        this._controlSpaceKeyboardShortcut = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.Control, WI.KeyboardShortcut.Key.Space);
    }

    // Public

    get element() { return this._element; }

    get editing() { return this._editing; }

    get value()
    {
        return this._pendingValue ?? this._element.textContent;
    }

    set value(value)
    {
        this._element.textContent = value;

        this._pendingValue = null;
    }

    valueWithoutSuggestion()
    {
        // The suggestion could appear anywhere within the element, and the text of the element can span multiple nodes.
        let valueWithoutSuggestion = "";
        for (let childNode of this._element.childNodes) {
            if (childNode === this._suggestionHintElement)
                continue;
            valueWithoutSuggestion += childNode.textContent;
        }
        return valueWithoutSuggestion;
    }

    get suggestionHint()
    {
        return this._suggestionHintElement.textContent;
    }

    set suggestionHint(value)
    {
        if (this._suggestionHintElement.textContent === value)
            return;

        this._suggestionHintElement.textContent = value;

        if (value) {
            this._reAttachSuggestionHint();
            return;
        }

        this._suggestionHintElement.remove();
    }

    startEditing()
    {
        if (this._editing)
            return;

        if (this._delegate && typeof this._delegate.spreadsheetTextFieldWillStartEditing === "function")
            this._delegate.spreadsheetTextFieldWillStartEditing(this);

        this._editing = true;
        this._valueBeforeEditing = this.value;

        this._keyDownCaretPosition = -1;

        this._element.classList.add("editing");
        this._element.contentEditable = "plaintext-only";
        this._element.spellcheck = false;

        this._element.focus();
        this._selectText();

        this._updateCompletions();
    }

    stopEditing()
    {
        if (!this._editing)
            return;

        this._editing = false;
        this._valueBeforeEditing = "";
        this._pendingValue = null;
        this._completionText = "";
        this._element.classList.remove("editing");
        this._element.contentEditable = false;

        this.discardCompletion();
    }

    discardCompletion()
    {
        if (!this._completionProvider)
            return;

        this._suggestionsView.hide();

        let hadCompletionText = this._completionText.length > 0;

        // Resetting the suggestion hint removes any suggestion hint element that is attached.
        this.suggestionHint = "";
        this._completionText = "";

        if (hadCompletionText) {
            this._pendingValue = this.valueWithoutSuggestion();
            this._delegate?.spreadsheetTextFieldDidChange?.(this);
        }
    }

    detached()
    {
        this.discardCompletion();
        this._element.remove();
    }

    // CompletionSuggestionsView delegate

    completionSuggestionsSelectedCompletion(suggestionsView, completionText = "")
    {
        this._completionText = completionText;

        if (this._completionText.startsWith(this._completionPrefix))
            this.suggestionHint = this._completionText.slice(this._completionPrefix.length);
        else
            this.suggestionHint = "";

        this._updatePendingValueWithCompletionText();

        if (this._delegate && typeof this._delegate.spreadsheetTextFieldDidChange === "function")
            this._delegate.spreadsheetTextFieldDidChange(this);
    }

    completionSuggestionsClickedCompletion(suggestionsView, completionText)
    {
        this._completionText = completionText;
        this._updatePendingValueWithCompletionText();
        this._applyPendingValue({moveCaretToEndOfCompletion: true});
        this.discardCompletion();

        if (this._delegate && typeof this._delegate.spreadsheetTextFieldDidChange === "function")
            this._delegate.spreadsheetTextFieldDidChange(this);
    }

    // Private

    _selectText()
    {
        window.getSelection().selectAllChildren(this._element);
    }

    _discardChange()
    {
        if (this._valueBeforeEditing !== this.value) {
            this.value = this._valueBeforeEditing;

            if (this._delegate && typeof this._delegate.spreadsheetTextFieldDidChange === "function")
                this._delegate.spreadsheetTextFieldDidChange(this);
        }
    }

    _handleClick(event)
    {
        this.startEditing();
    }

    _handleMouseDown(event)
    {
        if (!this._editing)
            return;

        event.stopPropagation();
        this.discardCompletion();
    }

    _handleBlur(event)
    {
        if (!this._editing)
            return;

        // Keep editing after tabbing out of Web Inspector window and back.
        if (document.activeElement === this._element)
            return;

        this._applyPendingValue();
        this.discardCompletion();

        let changed = this._valueBeforeEditing !== this.value;
        this._delegate.spreadsheetTextFieldDidBlur(this, event, changed);
        this.stopEditing();
    }

    _handleKeyDown(event)
    {
        if (!this._editing)
            return;

        this._preventDiscardingCompletionsOnKeyUp = false;
        this._keyDownCaretPosition = this._getCaretPosition();

        if (this._suggestionsView) {
            let consumed = this._handleKeyDownForSuggestionView(event);
            this._preventDiscardingCompletionsOnKeyUp = consumed;
            if (consumed)
                return;
        }

        let isEnterKey = event.key === "Enter";

        if (isEnterKey && event.shiftKey) {
            if (this._delegate && this._delegate.spreadsheetTextFieldAllowsNewlines(this))
                return;
        }

        let isTabKey = event.key === "Tab";
        if (isEnterKey || isTabKey) {
            event.stop();
            this._applyPendingValue();

            let direction = (isTabKey && event.shiftKey) ? "backward" : "forward";

            if (this._delegate && typeof this._delegate.spreadsheetTextFieldDidCommit === "function")
                this._delegate.spreadsheetTextFieldDidCommit(this, {direction});

            this.stopEditing();
            return;
        }

        if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            let delta = 1;
            if (event.metaKey)
                delta = 100;
            else if (event.shiftKey)
                delta = 10;
            else if (event.altKey)
                delta = 0.1;

            if (event.key === "ArrowDown")
                delta = -delta;

            let didModify = WI.incrementElementValue(this._element, delta);
            if (!didModify)
                return;

            event.stop();

            if (this._delegate && typeof this._delegate.spreadsheetTextFieldDidChange === "function")
                this._delegate.spreadsheetTextFieldDidChange(this);
        }

        if (event.key === "Backspace") {
            if (!this.value) {
                event.stop();
                this.stopEditing();

                if (this._delegate && this._delegate.spreadsheetTextFieldDidBackspace)
                    this._delegate.spreadsheetTextFieldDidBackspace(this);

                return;
            }
        }

        if (this._controlSpaceKeyboardShortcut.matchesEvent(event)) {
            event.stop();
            if (this._suggestionsView.visible)
                this._suggestionsView.hide();
            else {
                this._preventDiscardingCompletionsOnKeyUp = true;
                const forceCompletions = true;
                this._updateCompletions(forceCompletions);
            }
            return;
        }

        if (event.key === "Escape") {
            event.stop();
            this._discardChange();
            window.getSelection().removeAllRanges();

            if (this._delegate && this._delegate.spreadsheetTextFieldDidPressEsc)
                this._delegate.spreadsheetTextFieldDidPressEsc(this, this._valueBeforeEditing);
        }
    }

    _handleKeyDownForSuggestionView(event)
    {
        if ((event.key === "ArrowDown" || event.key === "ArrowUp") && this._suggestionsView.visible) {
            event.stop();

            if (event.key === "ArrowDown")
                this._suggestionsView.selectNext();
            else
                this._suggestionsView.selectPrevious();

            // Update popover position in case text moved, e.g. started or stopped wrapping.
            this._showSuggestionsView();

            if (this._delegate && typeof this._delegate.spreadsheetTextFieldDidChange === "function")
                this._delegate.spreadsheetTextFieldDidChange(this);

            return true;
        }

        if (event.key === "ArrowRight" && this._completionText.length) {
            let selection = window.getSelection();

            if (selection.isCollapsed) {
                event.stop();
                this._applyPendingValue({moveCaretToEndOfCompletion: true});

                // When completing "background", don't hide the completion popover.
                // Continue showing the popover with properties such as "background-color" and "background-image".
                this._updateCompletions();

                if (this._delegate && typeof this._delegate.spreadsheetTextFieldDidChange === "function")
                    this._delegate.spreadsheetTextFieldDidChange(this);

                return true;
            }
        }

        if (event.key === "Escape" && this._suggestionsView.visible) {
            event.stop();
            this.discardCompletion();

            return true;
        }

        if (event.key === "ArrowLeft" && (this._completionText.length || this._suggestionsView.visible)) {
            this.discardCompletion();

            return true;
        }

        return false;
    }

    _handleKeyUp()
    {
        if (!this._editing || !this._suggestionsView)
            return;

        // Certain actions, like Ctrl+Space will handle updating or discarding completions as necessary.
        if (this._preventDiscardingCompletionsOnKeyUp)
            return;

        // Some key events, like the arrow keys and Ctrl+A (move to line start), will move the caret without committing
        // any input to the text field. In those situations we should discard completion if they are available. It is
        // also possible that we receive a KeyUp event for a key that was not pressed inside this text field, in which
        // case the _keyDownCaretPosition will still be -1. This can occur when the user types a `:` to begin editing
        // the value for a property, and the KeyUp events for each of those keys will be handled here, even though the
        // corresponding KeyDown events was never handled by this text field.
        if (this._keyDownCaretPosition === -1 || this._keyDownCaretPosition === this._getCaretPosition())
            return;

        this.discardCompletion();
    }

    _handleInput(event)
    {
        if (!this._editing)
            return;

        this._pendingValue = this.valueWithoutSuggestion().trim();
        this._preventDiscardingCompletionsOnKeyUp = true;
        this._updateCompletions();

        if (this._delegate && typeof this._delegate.spreadsheetTextFieldDidChange === "function")
            this._delegate.spreadsheetTextFieldDidChange(this);
    }

    _updateCompletions(forceCompletions = false)
    {
        if (!this._completionProvider)
            return;

        let valueWithoutSuggestion = this.valueWithoutSuggestion();
        let {completions, prefix} = this._completionProvider(valueWithoutSuggestion, {allowEmptyPrefix: forceCompletions, caretPosition: this._getCaretPosition()});
        this._completionPrefix = prefix;

        if (!completions.length) {
            this.discardCompletion();
            return;
        }

        // No need to show the completion popover with only one item that matches the entered value.
        if (completions.length === 1 && WI.CSSCompletions.getCompletionText(completions[0]) === valueWithoutSuggestion) {
            this.discardCompletion();
            return;
        }

        console.assert(this._element.isConnected, "SpreadsheetTextField already removed from the DOM.");
        if (!this._element.isConnected) {
            this._suggestionsView.hide();
            return;
        }

        this._suggestionsView.update(completions);

        if (completions.length === 1 && WI.CSSCompletions.getCompletionText(completions[0]).startsWith(this._completionPrefix)) {
            // No need to show the completion popover with only one item that begins with the completion prefix.
            // When using fuzzy matching, the completion prefix may not occur at the beginning of the suggestion.
            this._suggestionsView.hide();
        } else
            this._showSuggestionsView();

        this._suggestionsView.selectedIndex = NaN;
        if (this._completionPrefix) {
            if (this._delegate?.spreadsheetTextFieldInitialCompletionIndex)
                this._suggestionsView.selectedIndex = this._delegate.spreadsheetTextFieldInitialCompletionIndex(this, completions);
            else
                this._suggestionsView.selectNext();
        } else
            this.suggestionHint = "";
    }

    _showSuggestionsView()
    {
        // Adjust the used caret position to correctly align autocompletion results with existing text. The suggestions
        // should appear aligned as below:
        //
        // border: 1px solid ro|
        //                   rosybrown
        //                   royalblue
        //
        // FIXME: Account for the caret being within the token when fixing <webkit.org/b/227157> Styles: Support completions mid-token.
        let adjustedCaretPosition = this._getCaretPosition() - this._completionPrefix.length;
        let caretRect = this._getCaretRect(adjustedCaretPosition);

        // Hide completion popover when the anchor element is removed from the DOM.
        if (!caretRect)
            this._suggestionsView.hide();
        else {
            this._suggestionsView.show(caretRect);
            this._suggestionsView.hideWhenElementMoves(this._element);
        }
    }

    _getCaretPosition()
    {
        let selection = window.getSelection();
        if (!selection.rangeCount)
            return 0;

        // The window's selection range will only contain the current line's positioning in multiline text, so a new
        // range must be created between the end of the current range and the beginning of the first line of text in
        // order to get an accurate character position for the caret.
        let lineRange = selection.getRangeAt(0);
        let multilineRange = document.createRange();
        multilineRange.setStart(this._element, 0);
        multilineRange.setEnd(lineRange.endContainer, lineRange.endOffset);
        return multilineRange.toString().length;
    }

    _getCaretRect(caretPosition)
    {
        let isHidden = (clientRect) => {
            return clientRect.x === 0 && clientRect.y === 0;
        };

        let caretRange = this._rangeAtCaretPosition(caretPosition);
        let caretClientRect = caretRange.getBoundingClientRect();
        if (!isHidden(caretClientRect))
            return WI.Rect.rectFromClientRect(caretClientRect);

        let elementClientRect = this._element.getBoundingClientRect();
        if (isHidden(elementClientRect))
            return null;

        const leftPadding = parseInt(getComputedStyle(this._element).paddingLeft) || 0;
        return new WI.Rect(elementClientRect.left + leftPadding, elementClientRect.top, elementClientRect.width, elementClientRect.height);
    }

    _rangeAtCaretPosition(caretPosition) {
        for (let node of this._element.childNodes) {
            let textContent = node.textContent;
            if (caretPosition <= textContent.length) {
                let range = document.createRange();
                range.setStart(node, caretPosition);
                range.setEnd(node, caretPosition);
                return range;
            }

            caretPosition -= textContent.length;
        }

        // If there are no nodes, or the caret position is greater than the total text content, provide the range of a
        // caret at the end of the element.
        let range = document.createRange();
        range.selectNodeContents(this._element);
        range.collapse();
        return range;
    }

    _applyPendingValue({moveCaretToEndOfCompletion} = {})
    {
        if (!this._pendingValue)
            return;

        let caretPosition = this._getCaretPosition();
        let newCaretPosition = moveCaretToEndOfCompletion ? caretPosition - this._completionPrefix.length + this._completionText.length : caretPosition;

        // Setting the value collapses the text selection. Get the caret position before doing this.
        this.value = this._pendingValue;

        if (this._element.textContent.length) {
            let textChildNode = this._element.firstChild;
            window.getSelection().setBaseAndExtent(textChildNode, newCaretPosition, textChildNode, newCaretPosition);
        }
    }

    _updatePendingValueWithCompletionText()
    {
        let caretPosition = this._getCaretPosition();
        let value = this.valueWithoutSuggestion();

        this._pendingValue = value.slice(0, caretPosition - this._completionPrefix.length) + this._completionText + value.slice(caretPosition + 1, value.length);
    }

    _reAttachSuggestionHint()
    {
        console.assert(this.suggestionHint.length, "Suggestion hint should not be empty when attaching the suggestion hint element.");

        if (this._suggestionHintElement.parentElement === this._element)
            return;

        let selection = window.getSelection();
        if (!this._element.textContent.length || !selection.rangeCount) {
            this._element.append(this._suggestionHintElement);
            return;
        }

        let range = selection.getRangeAt(0);

        console.assert(range.endContainer instanceof Text, range.endContainer);
        if (!(range.endContainer instanceof Text))
            return;

        this._element.insertBefore(this._suggestionHintElement, range.endContainer.splitText(range.endOffset));
    }
};
