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

WI.ScriptContentView = class ScriptContentView extends WI.ContentView
{
    constructor(script)
    {
        console.assert(script instanceof WI.Script, script);

        super(script);

        this.element.classList.add("script");

        // Append a spinner while waiting for _contentWillPopulate.
        var spinner = new WI.IndeterminateProgressSpinner;
        this.element.appendChild(spinner.element);

        this._script = script;

        // This view is only for standalone Scripts with no corresponding Resource. All other Scripts
        // should be handled by TextResourceContentView via the Resource.
        console.assert(!script.resource);
        console.assert(script.range.startLine === 0);
        console.assert(script.range.startColumn === 0);

        var toolTip = WI.UIString("Pretty print");
        var activatedToolTip = WI.UIString("Original formatting");
        this._prettyPrintButtonNavigationItem = new WI.ActivateButtonNavigationItem("pretty-print", toolTip, activatedToolTip, "Images/NavigationItemCurleyBraces.svg", 13, 13);
        this._prettyPrintButtonNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._togglePrettyPrint, this);
        this._prettyPrintButtonNavigationItem.enabled = false; // Enabled when the text editor is populated with content.
        this._prettyPrintButtonNavigationItem.visibilityPriority = WI.NavigationItem.VisibilityPriority.Low;

        var toolTipTypes = WI.UIString("Show type information");
        var activatedToolTipTypes = WI.UIString("Hide type information");
        this._showTypesButtonNavigationItem = new WI.ActivateButtonNavigationItem("show-types", toolTipTypes, activatedToolTipTypes, "Images/NavigationItemTypes.svg", 13, 14);
        this._showTypesButtonNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._toggleTypeAnnotations, this);
        this._showTypesButtonNavigationItem.enabled = false;
        this._showTypesButtonNavigationItem.visibilityPriority = WI.NavigationItem.VisibilityPriority.Low;

        WI.settings.showJavaScriptTypeInformation.addEventListener(WI.Setting.Event.Changed, this._showJavaScriptTypeInformationSettingChanged, this);

        let toolTipCodeCoverage = WI.UIString("Fade unexecuted code");
        let activatedToolTipCodeCoverage = WI.UIString("Do not fade unexecuted code");
        this._codeCoverageButtonNavigationItem = new WI.ActivateButtonNavigationItem("code-coverage", toolTipCodeCoverage, activatedToolTipCodeCoverage, "Images/NavigationItemCodeCoverage.svg", 13, 14);
        this._codeCoverageButtonNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._toggleUnexecutedCodeHighlights, this);
        this._codeCoverageButtonNavigationItem.enabled = false;
        this._codeCoverageButtonNavigationItem.visibilityPriority = WI.NavigationItem.VisibilityPriority.Low;

        WI.settings.enableControlFlowProfiler.addEventListener(WI.Setting.Event.Changed, this._enableControlFlowProfilerSettingChanged, this);

        this._textEditor = new WI.SourceCodeTextEditor(script);
        this._textEditor.addEventListener(WI.TextEditor.Event.ExecutionLineNumberDidChange, this._executionLineNumberDidChange, this);
        this._textEditor.addEventListener(WI.TextEditor.Event.NumberOfSearchResultsDidChange, this._numberOfSearchResultsDidChange, this);
        this._textEditor.addEventListener(WI.TextEditor.Event.FormattingDidChange, this._textEditorFormattingDidChange, this);
        this._textEditor.addEventListener(WI.TextEditor.Event.MIMETypeChanged, this._handleTextEditorMIMETypeChanged, this);
        this._textEditor.addEventListener(WI.SourceCodeTextEditor.Event.ContentWillPopulate, this._contentWillPopulate, this);
        this._textEditor.addEventListener(WI.SourceCodeTextEditor.Event.ContentDidPopulate, this._contentDidPopulate, this);

        if (this._script instanceof WI.LocalScript && this._script.editable)
            this._textEditor.addEventListener(WI.TextEditor.Event.ContentDidChange, this._handleTextEditorContentDidChange, this);
    }

    // Public

    get navigationItems()
    {
        return [this._prettyPrintButtonNavigationItem, this._showTypesButtonNavigationItem, this._codeCoverageButtonNavigationItem];
    }

    get script()
    {
        return this._script;
    }

    get textEditor()
    {
        return this._textEditor;
    }

    get supplementalRepresentedObjects()
    {
        if (isNaN(this._textEditor.executionLineNumber))
            return [];

        // If the SourceCodeTextEditor has an executionLineNumber, we can assume
        // it is always the active call frame.
        return [WI.debuggerManager.activeCallFrame];
    }

    revealPosition(position, options = {})
    {
        this._textEditor.revealPosition(position, options);
    }

    closed()
    {
        super.closed();

        WI.settings.showJavaScriptTypeInformation.removeEventListener(WI.Setting.Event.Changed, this._showJavaScriptTypeInformationSettingChanged, this);
        WI.settings.enableControlFlowProfiler.removeEventListener(WI.Setting.Event.Changed, this._enableControlFlowProfilerSettingChanged, this);

        this._textEditor.close();
    }

    saveToCookie(cookie)
    {
        cookie.type = WI.ContentViewCookieType.Resource;
        cookie.url = this.representedObject.url;
    }

    restoreFromCookie(cookie)
    {
        let textRangeToSelect = null;
        if (!isNaN(cookie.startLine) && !isNaN(cookie.startColumn) && !isNaN(cookie.endLine) && !isNaN(cookie.endColumn))
            textRangeToSelect = new WI.TextRange(cookie.startLine, cookie.startColumn, cookie.endLine, cookie.endColumn);

        let position = null;
        if (!isNaN(cookie.lineNumber) && !isNaN(cookie.columnNumber))
            position = new WI.SourceCodePosition(cookie.lineNumber, cookie.columnNumber);
        else if (textRangeToSelect)
            position = textRangeToSelect.startPosition();

        let scrollOffset = null;
        if (!isNaN(cookie.scrollOffsetX) && !isNaN(cookie.scrollOffsetY))
            scrollOffset = new WI.Point(cookie.scrollOffsetX, cookie.scrollOffsetY);

        if (position)
            this.revealPosition(position, {...cookie, textRangeToSelect, scrollOffset});
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
        let saveData = {
            url: this._script.url,
            content: this._textEditor.string,
        };

        if (!this._script.url)
            saveData.suggestedName = this._script.displayName + ".js";

        return saveData;
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

    _contentWillPopulate(event)
    {
        if (this._textEditor.element.parentNode === this.element)
            return;

        // Allow editing any local file since edits can be saved and reloaded right from the Inspector.
        if (this._script.urlComponents.scheme === "file" || (this._script instanceof WI.LocalScript && this._script.editable))
            this._textEditor.readOnly = false;

        this.element.removeChildren();
        this.addSubview(this._textEditor);
    }

    _contentDidPopulate(event)
    {
        let isLocalScript = this._script instanceof WI.LocalScript;

        this._prettyPrintButtonNavigationItem.enabled = this._textEditor.canBeFormatted();

        this._showTypesButtonNavigationItem.enabled = !isLocalScript && this._textEditor.canShowTypeAnnotations();
        this._showTypesButtonNavigationItem.activated = WI.settings.showJavaScriptTypeInformation.value;

        this._codeCoverageButtonNavigationItem.enabled = !isLocalScript && this._textEditor.canShowCoverageHints();
        this._codeCoverageButtonNavigationItem.activated = WI.settings.enableControlFlowProfiler.value;
    }

    _handleTextEditorContentDidChange(event)
    {
        this._updateRevisionContentDebouncer ||= new Debouncer(() => {
            this._script.editableRevision.updateRevisionContent(this._textEditor.string);
        });
        this._updateRevisionContentDebouncer.delayForTime(250);
    }

    _togglePrettyPrint(event)
    {
        var activated = !this._prettyPrintButtonNavigationItem.activated;
        this._textEditor.updateFormattedState(activated);
    }

    _toggleTypeAnnotations(event)
    {
        this._showTypesButtonNavigationItem.enabled = false;
        this._textEditor.toggleTypeAnnotations().then(() => {
            this._showTypesButtonNavigationItem.enabled = true;
        });
    }

    _toggleUnexecutedCodeHighlights(event)
    {
        this._codeCoverageButtonNavigationItem.enabled = false;
        this._textEditor.toggleUnexecutedCodeHighlights().then(() => {
            this._codeCoverageButtonNavigationItem.enabled = true;
        });
    }

    _showJavaScriptTypeInformationSettingChanged(event)
    {
        this._showTypesButtonNavigationItem.activated = WI.settings.showJavaScriptTypeInformation.value;
    }

    _enableControlFlowProfilerSettingChanged(event)
    {
        this._codeCoverageButtonNavigationItem.activated = WI.settings.enableControlFlowProfiler.value;
    }

    _textEditorFormattingDidChange(event)
    {
        this._prettyPrintButtonNavigationItem.activated = this._textEditor.formatted;
    }

    _handleTextEditorMIMETypeChanged(event)
    {
        this._prettyPrintButtonNavigationItem.enabled = this._textEditor.canBeFormatted();
    }

    _executionLineNumberDidChange(event)
    {
        this.dispatchEventToListeners(WI.ContentView.Event.SupplementalRepresentedObjectsDidChange);
    }

    _numberOfSearchResultsDidChange(event)
    {
        this.dispatchEventToListeners(WI.ContentView.Event.NumberOfSearchResultsDidChange);
    }
};
