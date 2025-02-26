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

WI.TextContentView = class TextContentView extends WI.ContentView
{
    constructor(string, mimeType, representedObject)
    {
        super(representedObject || string);

        this.element.classList.add("text");

        this._textEditor = new WI.TextEditor;
        this._textEditor.addEventListener(WI.TextEditor.Event.NumberOfSearchResultsDidChange, this._numberOfSearchResultsDidChange, this);
        this._textEditor.addEventListener(WI.TextEditor.Event.FormattingDidChange, this._textEditorFormattingDidChange, this);
        this._textEditor.addEventListener(WI.TextEditor.Event.MIMETypeChanged, this._handleTextEditorMIMETypeChanged, this);
        this.addSubview(this._textEditor);

        var toolTip = WI.UIString("Pretty print");
        var activatedToolTip = WI.UIString("Original formatting");
        this._prettyPrintButtonNavigationItem = new WI.ActivateButtonNavigationItem("pretty-print", toolTip, activatedToolTip, "Images/NavigationItemCurleyBraces.svg", 13, 13);
        this._prettyPrintButtonNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._togglePrettyPrint, this);
        this._prettyPrintButtonNavigationItem.visibilityPriority = WI.NavigationItem.VisibilityPriority.Low;

        var toolTipTypes = WI.UIString("Show type information");
        var activatedToolTipTypes = WI.UIString("Hide type information");
        this._showTypesButtonNavigationItem = new WI.ActivateButtonNavigationItem("show-types", toolTipTypes, activatedToolTipTypes, "Images/NavigationItemTypes.svg", 13, 14);
        this._showTypesButtonNavigationItem.enabled = false;
        this._showTypesButtonNavigationItem.visibilityPriority = WI.NavigationItem.VisibilityPriority.Low;

        let toolTipCodeCoverage = WI.UIString("Fade unexecuted code");
        let activatedToolTipCodeCoverage = WI.UIString("Do not fade unexecuted code");
        this._codeCoverageButtonNavigationItem = new WI.ActivateButtonNavigationItem("code-coverage", toolTipCodeCoverage, activatedToolTipCodeCoverage, "Images/NavigationItemCodeCoverage.svg", 13, 14);
        this._codeCoverageButtonNavigationItem.enabled = false;
        this._codeCoverageButtonNavigationItem.visibilityPriority = WI.NavigationItem.VisibilityPriority.Low;

        this._textEditor.readOnly = true;
        this._textEditor.mimeType = mimeType;
        this._textEditor.string = string;
        this._prettyPrintButtonNavigationItem.enabled = this._textEditor.canBeFormatted();
    }

    // Public

    get textEditor()
    {
        return this._textEditor;
    }

    get navigationItems()
    {
        return [this._prettyPrintButtonNavigationItem, this._showTypesButtonNavigationItem, this._codeCoverageButtonNavigationItem];
    }

    revealPosition(position, options = {})
    {
        this._textEditor.revealPosition(position, options);
    }

    get supportsSave()
    {
        return true;
    }

    get saveMode()
    {
        return WI.FileUtilities.SaveMode.SingleFile;
    }

    get saveData()
    {
        return {
            content: this._textEditor.string,
            suggestedName: WI.UIString("Untitled") + ".txt",
            forceSaveAs: true,
        };
    }

    get supportsSearch()
    {
        return true;
    }

    get numberOfSearchResults()
    {
        return this._textEditor.numberOfSearchResults;
    }

    get hasPerformedSearch()
    {
        return this._textEditor.currentSearchQuery !== null;
    }

    set automaticallyRevealFirstSearchResult(reveal)
    {
        this._textEditor.automaticallyRevealFirstSearchResult = reveal;
    }

    performSearch(query)
    {
        this._textEditor.performSearch(query);
    }

    searchCleared()
    {
        this._textEditor.searchCleared();
    }

    searchQueryWithSelection()
    {
        return this._textEditor.searchQueryWithSelection();
    }

    revealPreviousSearchResult(changeFocus)
    {
        this._textEditor.revealPreviousSearchResult(changeFocus);
    }

    revealNextSearchResult(changeFocus)
    {
        this._textEditor.revealNextSearchResult(changeFocus);
    }

    // Private

    _togglePrettyPrint(event)
    {
        var activated = !this._prettyPrintButtonNavigationItem.activated;
        this._textEditor.updateFormattedState(activated);
    }

    _textEditorFormattingDidChange(event)
    {
        this._prettyPrintButtonNavigationItem.activated = this._textEditor.formatted;
    }

    _handleTextEditorMIMETypeChanged(event)
    {
        this._prettyPrintButtonNavigationItem.enabled = this._textEditor.canBeFormatted();
    }

    _numberOfSearchResultsDidChange(event)
    {
        this.dispatchEventToListeners(WI.ContentView.Event.NumberOfSearchResultsDidChange);
    }
};
