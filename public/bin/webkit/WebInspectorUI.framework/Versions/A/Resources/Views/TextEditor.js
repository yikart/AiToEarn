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

WI.TextEditor = class TextEditor extends WI.View
{
    constructor(element, mimeType, delegate)
    {
        super(element);

        this.element.classList.add("text-editor", WI.SyntaxHighlightedStyleClassName);

        this._codeMirror = WI.CodeMirrorEditor.create(this.element, {
            readOnly: true,
            lineNumbers: true,
            matchBrackets: true,
            autoCloseBrackets: true,
            styleSelectedText: true,
        });

        this._codeMirror.on("focus", this._editorFocused.bind(this));
        this._codeMirror.on("change", this._contentChanged.bind(this));
        this._codeMirror.on("gutterClick", this._gutterMouseDown.bind(this));
        this._codeMirror.on("gutterContextMenu", this._gutterContextMenu.bind(this));
        this._codeMirror.getScrollerElement().addEventListener("click", this._openClickedLinks.bind(this), true);

        this._completionController = new WI.CodeMirrorCompletionController(WI.CodeMirrorCompletionController.Mode.Basic, this._codeMirror, this);
        this._tokenTrackingController = new WI.CodeMirrorTokenTrackingController(this._codeMirror, this);

        this._initialStringNotSet = true;

        this.mimeType = mimeType;

        this._breakpoints = {};
        this._executionLineNumber = NaN;
        this._executionColumnNumber = NaN;

        this._executionLineHandle = null;
        this._executionMultilineHandles = [];
        this._executionRangeHighlightMarker = null;

        this._searchQuery = null;
        this._searchResults = [];
        this._currentSearchResultIndex = -1;
        this._ignoreCodeMirrorContentDidChangeEvent = 0;

        this._formatted = false;
        this._formattingPromise = null;
        this._formatterSourceMap = null;
        this._deferReveal = false;
        this._repeatReveal = false;

        this._delegate = delegate || null;
    }

    // Public

    get string()
    {
        return this._codeMirror.getValue();
    }

    set string(newString)
    {
        let previousSelectedTextRange = this._repeatReveal ? this.selectedTextRange : null;

        function update()
        {
            // Clear any styles that may have been set on the empty line before content loaded.
            if (this._initialStringNotSet)
                this._codeMirror.removeLineClass(0, "wrap");

            if (this._codeMirror.getValue() !== newString)
                this._codeMirror.setValue(newString);
            else {
                // Ensure we at display content even if the value did not change. This often happens when auto formatting.
                this.layout();
            }

            if (this._initialStringNotSet) {
                this._codeMirror.clearHistory();
                this._codeMirror.markClean();

                this._initialStringNotSet = false;

                // There may have been an attempt at a search before the initial string was set. If so, reperform it now that we have content.
                if (this._searchQuery) {
                    let query = this._searchQuery;
                    this._searchQuery = null;
                    this.performSearch(query);
                }

                if (this._codeMirror.getMode().name === "null") {
                    // If the content matches a known MIME type, but isn't explicitly declared as
                    // such, attempt to detect that so we can enable syntax highlighting and
                    // formatting features.
                    this._attemptToDetermineMIMEType();
                }
            }

            // Update the execution line now that we might have content for that line.
            this._updateExecutionLine();
            this._updateExecutionRangeHighlight();

            // Set the breakpoint styles now that we might have content for those lines.
            for (var lineNumber in this._breakpoints)
                this._setBreakpointStylesOnLine(lineNumber);

            // Try revealing the pending line, or previous position, now that we might have new content.
            this._revealPendingPositionIfPossible();
            if (previousSelectedTextRange) {
                this.selectedTextRange = previousSelectedTextRange;
                let position = this._codeMirrorPositionFromTextRange(previousSelectedTextRange);
                this._scrollIntoViewCentered(position.start);
            }
        }

        this._ignoreCodeMirrorContentDidChangeEvent++;
        this._codeMirror.operation(update.bind(this));
        this._ignoreCodeMirrorContentDidChangeEvent--;
        console.assert(this._ignoreCodeMirrorContentDidChangeEvent >= 0);
    }

    get readOnly()
    {
        return this._codeMirror.getOption("readOnly") || false;
    }

    set readOnly(readOnly)
    {
        this._codeMirror.setOption("readOnly", readOnly);
        this._codeMirror.getWrapperElement().classList.toggle("read-only", !!readOnly);
    }

    get formatted()
    {
        return this._formatted;
    }

    get hasModified()
    {
        let historySize = this._codeMirror.historySize().undo;

        // Formatting code creates a history item.
        if (this._formatted)
            historySize--;

        return historySize > 0;
    }

    updateFormattedState(formatted)
    {
        return this._format(formatted);
    }

    hasFormatter()
    {
        let mode = this._codeMirror.getMode().name;
        return mode === "javascript" || mode === "css" || mode === "htmlmixed" || mode === "xml";
    }

    canBeFormatted()
    {
        // Can be overridden by subclasses.
        return this.hasFormatter();
    }

    canShowTypeAnnotations()
    {
        return false;
    }

    canShowCoverageHints()
    {
        return false;
    }

    get selectedTextRange()
    {
        var start = this._codeMirror.getCursor(true);
        var end = this._codeMirror.getCursor(false);
        return this._textRangeFromCodeMirrorPosition(start, end);
    }

    set selectedTextRange(textRange)
    {
        if (document.activeElement === document.body)
            this.focus();

        var position = this._codeMirrorPositionFromTextRange(textRange);
        this._codeMirror.setSelection(position.start, position.end);
    }

    get scrollOffset()
    {
        let scrollInfo = this._codeMirror.getScrollInfo();
        return new WI.Point(scrollInfo.left, scrollInfo.top);
    }

    set scrollOffset(scrollOffset)
    {
        console.assert(scrollOffset instanceof WI.Point, scrollOffset);

        this._codeMirror.scrollTo(scrollOffset.x, scrollOffset.y);
    }

    get mimeType()
    {
        return this._mimeType;
    }

    set mimeType(newMIMEType)
    {
        newMIMEType = parseMIMEType(newMIMEType).type;

        this._mimeType = newMIMEType;
        this._codeMirror.setOption("mode", {name: newMIMEType, globalVars: true});

        this.dispatchEventToListeners(WI.TextEditor.Event.MIMETypeChanged);
    }

    get executionLineNumber()
    {
        return this._executionLineNumber;
    }

    get executionColumnNumber()
    {
        return this._executionColumnNumber;
    }

    get formatterSourceMap()
    {
        return this._formatterSourceMap;
    }

    get tokenTrackingController()
    {
        return this._tokenTrackingController;
    }

    get delegate()
    {
        return this._delegate;
    }

    set delegate(newDelegate)
    {
        this._delegate = newDelegate || null;
    }

    get numberOfSearchResults()
    {
        return this._searchResults.length;
    }

    get currentSearchQuery()
    {
        return this._searchQuery;
    }

    set automaticallyRevealFirstSearchResult(reveal)
    {
        this._automaticallyRevealFirstSearchResult = reveal;

        // If we haven't shown a search result yet, reveal one now.
        if (this._automaticallyRevealFirstSearchResult && this._searchResults.length > 0) {
            if (this._currentSearchResultIndex === -1)
                this._revealFirstSearchResultAfterCursor();
        }
    }

    set deferReveal(defer)
    {
        this._deferReveal = defer;
    }

    set repeatReveal(repeat)
    {
        this._repeatReveal = repeat;
    }

    performSearch(query)
    {
        if (this._searchQuery === query)
            return;

        this.searchCleared();

        this._searchQuery = query;

        // Defer until the initial string is set.
        if (this._initialStringNotSet)
            return;

        // Allow subclasses to handle the searching if they have a better way.
        // If we are formatted, just use CodeMirror's search.
        if (typeof this.customPerformSearch === "function" && !this.formatted) {
            if (this.customPerformSearch(query))
                return;
        }

        let queryRegex = WI.SearchUtilities.searchRegExpForString(query, WI.SearchUtilities.defaultSettings);
        if (!queryRegex) {
            this.searchCleared();
            this.dispatchEventToListeners(WI.TextEditor.Event.NumberOfSearchResultsDidChange);
            return;
        }

        // Go down the slow patch for all other text content.
        var searchCursor = this._codeMirror.getSearchCursor(queryRegex, {line: 0, ch: 0}, false);
        var boundBatchSearch = batchSearch.bind(this);
        var numberOfSearchResultsDidChangeTimeout = null;

        function reportNumberOfSearchResultsDidChange()
        {
            if (numberOfSearchResultsDidChangeTimeout) {
                clearTimeout(numberOfSearchResultsDidChangeTimeout);
                numberOfSearchResultsDidChangeTimeout = null;
            }

            this.dispatchEventToListeners(WI.TextEditor.Event.NumberOfSearchResultsDidChange);
        }

        function batchSearch()
        {
            // Bail if the query changed since we started.
            if (this._searchQuery !== query)
                return;

            var newSearchResults = [];
            var foundResult = false;
            for (var i = 0; i < WI.TextEditor.NumberOfFindsPerSearchBatch && (foundResult = searchCursor.findNext()); ++i) {
                var textRange = this._textRangeFromCodeMirrorPosition(searchCursor.from(), searchCursor.to());
                newSearchResults.push(textRange);
            }

            this.addSearchResults(newSearchResults);

            // Don't report immediately, coalesce updates so they come in no faster than half a second.
            if (!numberOfSearchResultsDidChangeTimeout)
                numberOfSearchResultsDidChangeTimeout = setTimeout(reportNumberOfSearchResultsDidChange.bind(this), 500);

            if (foundResult) {
                // More lines to search, set a timeout so we don't block the UI long.
                setTimeout(boundBatchSearch, 50);
            } else {
                // Report immediately now that we are finished, canceling any pending update.
                reportNumberOfSearchResultsDidChange.call(this);
            }
        }

        // Start the search.
        boundBatchSearch();
    }

    setExecutionLineAndColumn(lineNumber, columnNumber)
    {
        // Only return early if there isn't a line handle and that isn't changing.
        if (!this._executionLineHandle && isNaN(lineNumber))
            return;

        this._executionLineNumber = lineNumber;
        this._executionColumnNumber = columnNumber;

        if (!this._initialStringNotSet) {
            this._updateExecutionLine();
            this._updateExecutionRangeHighlight();
        }

        // Still dispatch the event even if the number didn't change. The execution state still
        // could have changed (e.g. continuing in a loop with a breakpoint inside).
        this.dispatchEventToListeners(WI.TextEditor.Event.ExecutionLineNumberDidChange);
    }

    addSearchResults(textRanges)
    {
        console.assert(textRanges);
        if (!textRanges || !textRanges.length)
            return;

        function markRanges()
        {
            for (var i = 0; i < textRanges.length; ++i) {
                var position = this._codeMirrorPositionFromTextRange(textRanges[i]);
                var mark = this._codeMirror.markText(position.start, position.end, {className: WI.TextEditor.SearchResultStyleClassName});
                this._searchResults.push(mark);
            }

            // If we haven't shown a search result yet, reveal one now.
            if (this._automaticallyRevealFirstSearchResult) {
                if (this._currentSearchResultIndex === -1)
                    this._revealFirstSearchResultAfterCursor();
            }
        }

        this._codeMirror.operation(markRanges.bind(this));
    }

    searchCleared()
    {
        this._codeMirror.operation(() => {
            for (let searchResult of this._searchResults)
                searchResult.clear();
        });

        this._searchQuery = null;
        this._searchResults = [];
        this._currentSearchResultIndex = -1;
    }

    searchQueryWithSelection()
    {
        if (!this._codeMirror.somethingSelected())
            return null;

        return this._codeMirror.getSelection();
    }

    revealPreviousSearchResult(changeFocus)
    {
        if (!this._searchResults.length)
            return;

        if (this._currentSearchResultIndex === -1 || this._cursorDoesNotMatchLastRevealedSearchResult()) {
            this._revealFirstSearchResultBeforeCursor(changeFocus);
            return;
        }

        if (this._currentSearchResultIndex > 0)
            --this._currentSearchResultIndex;
        else
            this._currentSearchResultIndex = this._searchResults.length - 1;

        this._revealSearchResult(this._searchResults[this._currentSearchResultIndex], changeFocus, -1);
    }

    revealNextSearchResult(changeFocus)
    {
        if (!this._searchResults.length)
            return;

        if (this._currentSearchResultIndex === -1 || this._cursorDoesNotMatchLastRevealedSearchResult()) {
            this._revealFirstSearchResultAfterCursor(changeFocus);
            return;
        }

        if (this._currentSearchResultIndex + 1 < this._searchResults.length)
            ++this._currentSearchResultIndex;
        else
            this._currentSearchResultIndex = 0;

        this._revealSearchResult(this._searchResults[this._currentSearchResultIndex], changeFocus, 1);
    }

    line(lineNumber)
    {
        return this._codeMirror.getLine(lineNumber);
    }

    getTextInRange(startPosition, endPosition)
    {
        return this._codeMirror.getRange(startPosition.toCodeMirror(), endPosition.toCodeMirror());
    }

    addStyleToTextRange(startPosition, endPosition, styleClassName)
    {
        endPosition = endPosition.offsetColumn(1);
        return this._codeMirror.getDoc().markText(startPosition.toCodeMirror(), endPosition.toCodeMirror(), {className: styleClassName, inclusiveLeft: true, inclusiveRight: true});
    }

    revealPosition(position, options = {})
    {
        console.assert(position instanceof WI.SourceCodePosition, position);

        if (!this.isAttached || this._initialStringNotSet || this._deferReveal) {
            this._pendingPositionToReveal = position;
            this._pendingRevealPositionOptions = options;
            return;
        }

        delete this._pendingPositionToReveal;
        delete this._pendingRevealPositionOptions;

        let {textRangeToSelect, scrollOffset, forceUnformatted, preventHighlight} = options;

        console.assert(!textRangeToSelect || textRangeToSelect instanceof WI.TextRange, textRangeToSelect);
        console.assert(!scrollOffset || scrollOffset instanceof WI.Point, scrollOffset);

        // If we need to unformat, reveal the line after a wait.
        // Otherwise the line highlight doesn't work properly.
        if (this._formatted && forceUnformatted) {
            this.updateFormattedState(false).then(() => {
                setTimeout(this.revealPosition.bind(this), 0, position, textRangeToSelect);
            });
            return;
        }

        let line = Number.constrain(position.lineNumber, 0, this._codeMirror.lineCount() - 1);
        let lineHandle = this._codeMirror.getLineHandle(line);

        if (!textRangeToSelect) {
            let column = Number.constrain(position.columnNumber, 0, this._codeMirror.getLine(line).length);
            textRangeToSelect = new WI.TextRange(line, column, line, column);
        }

        function removeStyleClass()
        {
            this._codeMirror.removeLineClass(lineHandle, "wrap", WI.TextEditor.HighlightedStyleClassName);
        }

        function revealAndHighlightLine()
        {
            if (scrollOffset)
                this._codeMirror.scrollTo(scrollOffset.x, scrollOffset.y);
            else {
                // If the line is not visible, reveal it as the center line in the editor.
                let position = this._codeMirrorPositionFromTextRange(textRangeToSelect);
                if (!this._isPositionVisible(position.start))
                    this._scrollIntoViewCentered(position.start);
            }

            this.selectedTextRange = textRangeToSelect;

            if (!this.readOnly)
                this.focus();

            if (preventHighlight)
                return;

            // Avoid highlighting the execution line while debugging.
            if (WI.debuggerManager.paused && line === this._executionLineNumber)
                return;

            this._codeMirror.addLineClass(lineHandle, "wrap", WI.TextEditor.HighlightedStyleClassName);

            // Use a timeout instead of a animationEnd event listener because the line element might
            // be removed if the user scrolls during the animation. In that case animationEnd isn't
            // fired, and the line would highlight again the next time it scrolls into view.
            setTimeout(removeStyleClass.bind(this), WI.TextEditor.HighlightAnimationDuration);
        }

        this._codeMirror.operation(revealAndHighlightLine.bind(this));
    }

    attached()
    {
        super.attached();

        // Refresh since our size might have changed.
        this._codeMirror.refresh();

        // Try revealing the pending line now that we are visible.
        // This needs to be done as a separate operation from the refresh
        // so that the scrollInfo coordinates are correct.
        this._revealPendingPositionIfPossible();
    }

    setBreakpointInfoForLineAndColumn(lineNumber, columnNumber, breakpointInfo)
    {
        if (this._ignoreSetBreakpointInfoCalls)
            return;

        if (breakpointInfo)
            this._addBreakpointToLineAndColumnWithInfo(lineNumber, columnNumber, breakpointInfo);
        else
            this._removeBreakpointFromLineAndColumn(lineNumber, columnNumber);
    }

    updateBreakpointLineAndColumn(oldLineNumber, oldColumnNumber, newLineNumber, newColumnNumber)
    {
        console.assert(this._breakpoints[oldLineNumber]);
        if (!this._breakpoints[oldLineNumber])
            return;

        console.assert(this._breakpoints[oldLineNumber][oldColumnNumber]);
        if (!this._breakpoints[oldLineNumber][oldColumnNumber])
            return;

        var breakpointInfo = this._breakpoints[oldLineNumber][oldColumnNumber];
        this._removeBreakpointFromLineAndColumn(oldLineNumber, oldColumnNumber);
        this._addBreakpointToLineAndColumnWithInfo(newLineNumber, newColumnNumber, breakpointInfo);
    }

    addStyleClassToLine(lineNumber, styleClassName)
    {
        var lineHandle = this._codeMirror.getLineHandle(lineNumber);
        if (!lineHandle)
            return null;

        return this._codeMirror.addLineClass(lineHandle, "wrap", styleClassName);
    }

    removeStyleClassFromLine(lineNumber, styleClassName)
    {
        var lineHandle = this._codeMirror.getLineHandle(lineNumber);
        console.assert(lineHandle);
        if (!lineHandle)
            return null;

        return this._codeMirror.removeLineClass(lineHandle, "wrap", styleClassName);
    }

    toggleStyleClassForLine(lineNumber, styleClassName)
    {
        var lineHandle = this._codeMirror.getLineHandle(lineNumber);
        console.assert(lineHandle);
        if (!lineHandle)
            return false;

        return this._codeMirror.toggleLineClass(lineHandle, "wrap", styleClassName);
    }

    createWidgetForLine(lineNumber)
    {
        var lineHandle = this._codeMirror.getLineHandle(lineNumber);
        if (!lineHandle)
            return null;

        var widgetElement = document.createElement("div");
        var lineWidget = this._codeMirror.addLineWidget(lineHandle, widgetElement, {coverGutter: false, noHScroll: true});
        return new WI.LineWidget(lineWidget, widgetElement);
    }

    get lineCount()
    {
        return this._codeMirror.lineCount();
    }

    focus()
    {
        this._codeMirror.focus();
    }

    contentDidChange(replacedRanges, newRanges)
    {
        // Implemented by subclasses.
    }

    rectsForRange(range)
    {
        return this._codeMirror.rectsForRange(range);
    }

    get markers()
    {
        return this._codeMirror.getAllMarks().map(WI.TextMarker.textMarkerForCodeMirrorTextMarker);
    }

    markersAtPosition(position)
    {
        return this._codeMirror.findMarksAt(position).map(WI.TextMarker.textMarkerForCodeMirrorTextMarker);
    }

    createColorMarkers(range)
    {
        return createCodeMirrorColorTextMarkers(this._codeMirror, range);
    }

    createGradientMarkers(range)
    {
        return createCodeMirrorGradientTextMarkers(this._codeMirror, range);
    }

    createCubicBezierTimingFunctionMarkers(range)
    {
        return createCodeMirrorCubicBezierTimingFunctionTextMarkers(this._codeMirror, range);
    }

    createLinearTimingFunctionMarkers(range)
    {
        return createCodeMirrorLinearTimingFunctionTextMarkers(this._codeMirror, range);
    }

    createSpringTimingFunctionMarkers(range)
    {
        return createCodeMirrorSpringTimingFunctionTextMarkers(this._codeMirror, range);
    }

    createStepsTimingFunctionMarkers(range)
    {
        return createCodeMirrorStepsTimingFunctionTextMarkers(this._codeMirror, range);
    }

    editingControllerForMarker(editableMarker)
    {
        switch (editableMarker.type) {
        case WI.TextMarker.Type.Color:
            return new WI.CodeMirrorColorEditingController(this._codeMirror, editableMarker);
        case WI.TextMarker.Type.Gradient:
            return new WI.CodeMirrorGradientEditingController(this._codeMirror, editableMarker);
        case WI.TextMarker.Type.CubicBezierTimingFunction:
            return new WI.CodeMirrorCubicBezierTimingFunctionEditingController(this._codeMirror, editableMarker);
        case WI.TextMarker.Type.LinearTimingFunction:
            return new WI.CodeMirrorLinearTimingFunctionEditingController(this._codeMirror, editableMarker);
        case WI.TextMarker.Type.SpringTimingFunction:
            return new WI.CodeMirrorSpringTimingFunctionEditingController(this._codeMirror, editableMarker);
        case WI.TextMarker.Type.StepsTimingFunction:
            return new WI.CodeMirrorStepsTimingFunctionEditingController(this._codeMirror, editableMarker);
        default:
            return new WI.CodeMirrorEditingController(this._codeMirror, editableMarker);
        }
    }

    visibleRangeOffsets()
    {
        var startOffset = null;
        var endOffset = null;
        var visibleRange = this._codeMirror.getViewport();

        if (this._formatterSourceMap) {
            startOffset = this._formatterSourceMap.formattedToOriginalOffset(Math.max(visibleRange.from - 1, 0), 0);
            endOffset = this._formatterSourceMap.formattedToOriginalOffset(visibleRange.to - 1, 0);
        } else {
            startOffset = this._codeMirror.getDoc().indexFromPos({line: visibleRange.from, ch: 0});
            endOffset = this._codeMirror.getDoc().indexFromPos({line: visibleRange.to, ch: 0});
        }

        return {startOffset, endOffset};
    }

    visibleRangePositions()
    {
        let visibleRange = this._codeMirror.getViewport();
        let startLine;
        let endLine;

        if (this._formatterSourceMap) {
            startLine = this._formatterSourceMap.formattedToOriginal(Math.max(visibleRange.from - 1, 0), 0).lineNumber;
            endLine = this._formatterSourceMap.formattedToOriginal(visibleRange.to - 1, 0).lineNumber;
        } else {
            startLine = visibleRange.from;
            endLine = visibleRange.to;
        }

        return {
            startPosition: new WI.SourceCodePosition(startLine, 0),
            endPosition: new WI.SourceCodePosition(endLine, 0)
        };
    }

    originalPositionToCurrentPosition(position)
    {
        if (!this._formatterSourceMap)
            return position;

        let {lineNumber, columnNumber} = this._formatterSourceMap.originalToFormatted(position.lineNumber, position.columnNumber);
        return new WI.SourceCodePosition(lineNumber, columnNumber);
    }

    originalOffsetToCurrentPosition(offset)
    {
        var position = null;
        if (this._formatterSourceMap) {
            var location = this._formatterSourceMap.originalPositionToFormatted(offset);
            position = {line: location.lineNumber, ch: location.columnNumber};
        } else
            position = this._codeMirror.getDoc().posFromIndex(offset);

        return position;
    }

    currentOffsetToCurrentPosition(offset)
    {
        let pos = this._codeMirror.getDoc().posFromIndex(offset);
        return new WI.SourceCodePosition(pos.line, pos.ch);
    }

    currentPositionToOriginalOffset(position)
    {
        let offset = null;

        if (this._formatterSourceMap)
            offset = this._formatterSourceMap.formattedToOriginalOffset(position.line, position.ch);
        else
            offset = this._codeMirror.getDoc().indexFromPos(position);

        return offset;
    }

    currentPositionToOriginalPosition(position)
    {
        if (!this._formatterSourceMap)
            return position;

        let location = this._formatterSourceMap.formattedToOriginal(position.lineNumber, position.columnNumber);
        return new WI.SourceCodePosition(location.lineNumber, location.columnNumber);
    }

    currentPositionToCurrentOffset(position)
    {
        return this._codeMirror.getDoc().indexFromPos(position.toCodeMirror());
    }

    setInlineWidget(position, inlineElement)
    {
        return this._codeMirror.setUniqueBookmark(position.toCodeMirror(), {widget: inlineElement});
    }

    addScrollHandler(handler)
    {
        this._codeMirror.on("scroll", handler);
    }

    removeScrollHandler(handler)
    {
        this._codeMirror.off("scroll", handler);
    }

    // Protected

    layout()
    {
        super.layout();

        this._codeMirror.refresh();
    }

    _format(formatted)
    {
        if (this._formatted === formatted)
            return Promise.resolve(this._formatted);

        console.assert(!formatted || this.canBeFormatted());
        if (formatted && !this.canBeFormatted())
            return Promise.resolve(this._formatted);

        if (this._formattingPromise)
            return this._formattingPromise;

        this._ignoreCodeMirrorContentDidChangeEvent++;
        this._formattingPromise = this.prettyPrint(formatted).then(() => {
            this._ignoreCodeMirrorContentDidChangeEvent--;
            console.assert(this._ignoreCodeMirrorContentDidChangeEvent >= 0);

            this._formattingPromise = null;

            let originalFormatted = this._formatted;
            this._formatted = !!this._formatterSourceMap;

            if (this._formatted !== originalFormatted)
                this.dispatchEventToListeners(WI.TextEditor.Event.FormattingDidChange);

            return this._formatted;
        });

        return this._formattingPromise;
    }

    prettyPrint(pretty)
    {
        return new Promise((resolve, reject) => {
            let beforePrettyPrintState = {
                selectionAnchor: this._codeMirror.getCursor("anchor"),
                selectionHead: this._codeMirror.getCursor("head"),
            };

            if (!pretty)
                this._undoFormatting(beforePrettyPrintState, resolve);
            else
                this._startWorkerPrettyPrint(beforePrettyPrintState, resolve);
        });
    }

    _attemptToDetermineMIMEType()
    {
        let startTime = Date.now();

        const isModule = false;
        const includeSourceMapData = false;
        let workerProxy = WI.FormatterWorkerProxy.singleton();
        workerProxy.formatJavaScript(this.string, isModule, WI.indentString(), includeSourceMapData, ({formattedText}) => {
            if (!formattedText)
                return;

            this.mimeType = "text/javascript";

            if (Date.now() - startTime < 100)
                this.updateFormattedState(true);
        });
    }

    _startWorkerPrettyPrint(beforePrettyPrintState, callback)
    {
        let workerProxy = WI.FormatterWorkerProxy.singleton();
        let sourceText = this._codeMirror.getValue();
        let indentString = WI.indentString();
        const includeSourceMapData = true;

        let formatCallback = ({formattedText, sourceMapData}) => {
            // Handle if formatting failed, which is possible for invalid programs.
            if (formattedText === null) {
                callback();
                return;
            }
            this._finishPrettyPrint(beforePrettyPrintState, formattedText, sourceMapData, callback);
        };

        let mode = this._codeMirror.getMode().name;
        switch (mode) {
        case "javascript": {
            let sourceType = this._delegate ? this._delegate.textEditorScriptSourceType(this) : WI.Script.SourceType.Program;
            const isModule = sourceType === WI.Script.SourceType.Module;
            workerProxy.formatJavaScript(sourceText, isModule, indentString, includeSourceMapData, formatCallback);
            break;
        }
        case "css":
            workerProxy.formatCSS(sourceText, indentString, includeSourceMapData, formatCallback);
            break;
        case "htmlmixed":
            workerProxy.formatHTML(sourceText, indentString, includeSourceMapData, formatCallback);
            break;
        case "xml":
            workerProxy.formatXML(sourceText, indentString, includeSourceMapData, formatCallback);
            break;
        default:
            console.assert(false, "Unexpected mode attempted to pretty print.");
            break;
        }
    }

    _finishPrettyPrint(beforePrettyPrintState, formattedText, sourceMapData, callback)
    {
        this._codeMirror.operation(() => {
            this._formatterSourceMap = WI.FormatterSourceMap.fromSourceMapData(sourceMapData);
            this._codeMirror.setValue(formattedText);
            this._updateAfterFormatting(true, beforePrettyPrintState);
        });

        callback();
    }

    _undoFormatting(beforePrettyPrintState, callback)
    {
        this._codeMirror.operation(() => {
            this._codeMirror.undo();
            this._updateAfterFormatting(false, beforePrettyPrintState);
        });

        callback();
    }

    _updateAfterFormatting(pretty, beforePrettyPrintState)
    {
        let oldSelectionAnchor = beforePrettyPrintState.selectionAnchor;
        let oldSelectionHead = beforePrettyPrintState.selectionHead;
        let newSelectionAnchor, newSelectionHead;
        let newExecutionLocation = null;

        if (pretty) {
            if (this._pendingPositionToReveal) {
                let newRevealPosition = this._formatterSourceMap.originalToFormatted(this._pendingPositionToReveal.lineNumber, this._pendingPositionToReveal.columnNumber);
                this._pendingPositionToReveal = new WI.SourceCodePosition(newRevealPosition.lineNumber, newRevealPosition.columnNumber);
            }

            if (this._pendingRevealPositionOptions?.textRangeToSelect) {
                let mappedRevealSelectionStart = this._formatterSourceMap.originalToFormatted(this._pendingRevealPositionOptions.textRangeToSelect.startLine, this._pendingRevealPositionOptions.textRangeToSelect.startColumn);
                let mappedRevealSelectionEnd = this._formatterSourceMap.originalToFormatted(this._pendingRevealPositionOptions.textRangeToSelect.endLine, this._pendingRevealPositionOptions.textRangeToSelect.endColumn);
                this._pendingRevealPositionOptions.textRangeToSelect = new WI.TextRange(mappedRevealSelectionStart.lineNumber, mappedRevealSelectionStart.columnNumber, mappedRevealSelectionEnd.lineNumber, mappedRevealSelectionEnd.columnNumber);
            }

            if (!isNaN(this._executionLineNumber)) {
                console.assert(!isNaN(this._executionColumnNumber));
                newExecutionLocation = this._formatterSourceMap.originalToFormatted(this._executionLineNumber, this._executionColumnNumber);
            }

            let mappedAnchorLocation = this._formatterSourceMap.originalToFormatted(oldSelectionAnchor.line, oldSelectionAnchor.ch);
            let mappedHeadLocation = this._formatterSourceMap.originalToFormatted(oldSelectionHead.line, oldSelectionHead.ch);
            newSelectionAnchor = {line: mappedAnchorLocation.lineNumber, ch: mappedAnchorLocation.columnNumber};
            newSelectionHead = {line: mappedHeadLocation.lineNumber, ch: mappedHeadLocation.columnNumber};
        } else {
            if (this._pendingPositionToReveal) {
                let newRevealPosition = this._formatterSourceMap.formattedToOriginal(this._pendingPositionToReveal.lineNumber, this._pendingPositionToReveal.columnNumber);
                this._pendingPositionToReveal = new WI.SourceCodePosition(newRevealPosition.lineNumber, newRevealPosition.columnNumber);
            }

            if (this._pendingRevealPositionOptions?.textRangeToSelect) {
                let mappedRevealSelectionStart = this._formatterSourceMap.formattedToOriginal(this._pendingRevealPositionOptions.textRangeToSelect.startLine, this._pendingRevealPositionOptions.textRangeToSelect.startColumn);
                let mappedRevealSelectionEnd = this._formatterSourceMap.formattedToOriginal(this._pendingRevealPositionOptions.textRangeToSelect.endLine, this._pendingRevealPositionOptions.textRangeToSelect.endColumn);
                this._pendingRevealPositionOptions.textRangeToSelect = new WI.TextRange(mappedRevealSelectionStart.lineNumber, mappedRevealSelectionStart.columnNumber, mappedRevealSelectionEnd.lineNumber, mappedRevealSelectionEnd.columnNumber);
            }

            if (!isNaN(this._executionLineNumber)) {
                console.assert(!isNaN(this._executionColumnNumber));
                newExecutionLocation = this._formatterSourceMap.formattedToOriginal(this._executionLineNumber, this._executionColumnNumber);
            }

            let mappedAnchorLocation = this._formatterSourceMap.formattedToOriginal(oldSelectionAnchor.line, oldSelectionAnchor.ch);
            let mappedHeadLocation = this._formatterSourceMap.formattedToOriginal(oldSelectionHead.line, oldSelectionHead.ch);
            newSelectionAnchor = {line: mappedAnchorLocation.lineNumber, ch: mappedAnchorLocation.columnNumber};
            newSelectionHead = {line: mappedHeadLocation.lineNumber, ch: mappedHeadLocation.columnNumber};

            this._formatterSourceMap = null;
        }

        this._scrollIntoViewCentered(newSelectionAnchor);
        this._codeMirror.setSelection(newSelectionAnchor, newSelectionHead);

        if (newExecutionLocation) {
            this._executionLineHandle = null;
            this._executionMultilineHandles = [];
            this.setExecutionLineAndColumn(newExecutionLocation.lineNumber, newExecutionLocation.columnNumber);
        }

        // FIXME: <rdar://problem/13129955> FindBanner: New searches should not lose search position (start from current selection/caret)
        if (this.currentSearchQuery) {
            let searchQuery = this.currentSearchQuery;
            this.searchCleared();
            // Set timeout so that this happens after the current CodeMirror operation.
            // The editor has to update for the value and selection changes.
            setTimeout(() => { this.performSearch(searchQuery); }, 0);
        }

        if (this._delegate && typeof this._delegate.textEditorUpdatedFormatting === "function")
            this._delegate.textEditorUpdatedFormatting(this);
    }

    // Private

    hasEdits()
    {
        return !this._codeMirror.isClean();
    }

    _editorFocused(codeMirror)
    {
        this.dispatchEventToListeners(WI.TextEditor.Event.Focused);
    }

    _contentChanged(codeMirror, change)
    {
        if (this._ignoreCodeMirrorContentDidChangeEvent > 0)
            return;

        var replacedRanges = [];
        var newRanges = [];
        while (change) {
            replacedRanges.push(new WI.TextRange(
                change.from.line,
                change.from.ch,
                change.to.line,
                change.to.ch
            ));
            newRanges.push(new WI.TextRange(
                change.from.line,
                change.from.ch,
                change.from.line + change.text.length - 1,
                change.text.length === 1 ? change.from.ch + change.text[0].length : change.text.lastValue.length
            ));
            change = change.next;
        }
        this.contentDidChange(replacedRanges, newRanges);

        if (this._formatted) {
            this._formatterSourceMap = null;
            this._formatted = false;

            if (this._delegate && typeof this._delegate.textEditorUpdatedFormatting === "function")
                this._delegate.textEditorUpdatedFormatting(this);

            this.dispatchEventToListeners(WI.TextEditor.Event.FormattingDidChange);
        }

        this.dispatchEventToListeners(WI.TextEditor.Event.ContentDidChange);
    }

    _textRangeFromCodeMirrorPosition(start, end)
    {
        console.assert(start);
        console.assert(end);

        return new WI.TextRange(start.line, start.ch, end.line, end.ch);
    }

    _codeMirrorPositionFromTextRange(textRange)
    {
        console.assert(textRange);

        var start = {line: textRange.startLine, ch: textRange.startColumn};
        var end = {line: textRange.endLine, ch: textRange.endColumn};
        return {start, end};
    }

    _revealPendingPositionIfPossible()
    {
        if (!this._pendingPositionToReveal)
            return;

        if (!this.isAttached)
            return;

        this.revealPosition(this._pendingPositionToReveal, this._pendingRevealPositionOptions);
    }

    _revealSearchResult(result, changeFocus, directionInCaseOfRevalidation)
    {
        let position = result.find();

        // Check for a valid position, it might have been removed from editing by the user.
        // If the position is invalide, revalidate all positions reveal as needed.
        if (!position) {
            this._revalidateSearchResults(directionInCaseOfRevalidation);
            return;
        }

        // If the line is not visible, reveal it as the center line in the editor.
        if (!this._isPositionVisible(position.from))
            this._scrollIntoViewCentered(position.from);

        // Update the text selection to select the search result.
        this.selectedTextRange = this._textRangeFromCodeMirrorPosition(position.from, position.to);

        // Remove the automatically reveal state now that we have revealed a search result.
        this._automaticallyRevealFirstSearchResult = false;

        // Focus the editor if requested.
        if (changeFocus)
            this._codeMirror.focus();

        // Collect info for the bouncy highlight.
        let highlightEditorPosition = this._codeMirror.getCursor("start");
        let textContent = this._codeMirror.getSelection();

        // Remove the bouncy highlight if it is still around. The animation will not
        // start unless we remove it and add it back to the document.
        this._removeBouncyHighlightElementIfNeeded();

        // Create the bouncy highlight.
        this._bouncyHighlightElement = document.createElement("div");
        this._bouncyHighlightElement.className = WI.TextEditor.BouncyHighlightStyleClassName;
        this._bouncyHighlightElement.textContent = textContent;

        function positionBouncyHighlight() {
            // Adjust the coordinates to be based in the text editor's space.
            let coordinates = this._codeMirror.cursorCoords(highlightEditorPosition, "page");
            let textEditorRect = this.element.getBoundingClientRect();
            coordinates.top -= textEditorRect.top;
            coordinates.left -= textEditorRect.left;

            // Position the bouncy highlight.
            this._bouncyHighlightElement.style.top = coordinates.top + "px";
            this._bouncyHighlightElement.style.left = coordinates.left + "px";
        }

        // Position and show the highlight.
        positionBouncyHighlight.call(this);
        this.element.appendChild(this._bouncyHighlightElement);

        // Reposition the highlight if the editor scrolls.
        this._bouncyHighlightScrollHandler = () => { positionBouncyHighlight.call(this); };
        this.addScrollHandler(this._bouncyHighlightScrollHandler);

        // Listen for the end of the animation so we can remove the element.
        this._bouncyHighlightElement.addEventListener("animationend", () => {
            this._removeBouncyHighlightElementIfNeeded();
        });
    }

    _removeBouncyHighlightElementIfNeeded()
    {
        if (!this._bouncyHighlightElement)
            return;

        this.removeScrollHandler(this._bouncyHighlightScrollHandler);
        this._bouncyHighlightScrollHandler = null;

        this._bouncyHighlightElement.remove();
        this._bouncyHighlightElement = null;
    }

    _binarySearchInsertionIndexInSearchResults(object, comparator)
    {
        // It is possible that markers in the search results array may have been deleted.
        // In those cases the comparator will return "null" and we immediately stop
        // the binary search and return null. The search results list needs to be updated.
        var array = this._searchResults;

        var first = 0;
        var last = array.length - 1;

        while (first <= last) {
            var mid = (first + last) >> 1;
            var c = comparator(object, array[mid]);
            if (c === null)
                return null;
            if (c > 0)
                first = mid + 1;
            else if (c < 0)
                last = mid - 1;
            else
                return mid;
        }

        return first - 1;
    }

    _revealFirstSearchResultBeforeCursor(changeFocus)
    {
        console.assert(this._searchResults.length);

        var currentCursorPosition = this._codeMirror.getCursor("start");
        if (currentCursorPosition.line === 0 && currentCursorPosition.ch === 0) {
            this._currentSearchResultIndex = this._searchResults.length - 1;
            this._revealSearchResult(this._searchResults[this._currentSearchResultIndex], changeFocus, -1);
            return;
        }

        var index = this._binarySearchInsertionIndexInSearchResults(currentCursorPosition, function(current, searchResult) {
            var searchResultMarker = searchResult.find();
            if (!searchResultMarker)
                return null;
            return WI.compareCodeMirrorPositions(current, searchResultMarker.from);
        });

        if (index === null) {
            this._revalidateSearchResults(-1);
            return;
        }

        this._currentSearchResultIndex = index;
        this._revealSearchResult(this._searchResults[this._currentSearchResultIndex], changeFocus);
    }

    _revealFirstSearchResultAfterCursor(changeFocus)
    {
        console.assert(this._searchResults.length);

        var currentCursorPosition = this._codeMirror.getCursor("start");
        if (currentCursorPosition.line === 0 && currentCursorPosition.ch === 0) {
            this._currentSearchResultIndex = 0;
            this._revealSearchResult(this._searchResults[this._currentSearchResultIndex], changeFocus, 1);
            return;
        }

        var index = this._binarySearchInsertionIndexInSearchResults(currentCursorPosition, function(current, searchResult) {
            var searchResultMarker = searchResult.find();
            if (!searchResultMarker)
                return null;
            return WI.compareCodeMirrorPositions(current, searchResultMarker.from);
        });

        if (index === null) {
            this._revalidateSearchResults(1);
            return;
        }

        if (index + 1 < this._searchResults.length)
            ++index;
        else
            index = 0;

        this._currentSearchResultIndex = index;
        this._revealSearchResult(this._searchResults[this._currentSearchResultIndex], changeFocus);
    }

    _cursorDoesNotMatchLastRevealedSearchResult()
    {
        console.assert(this._currentSearchResultIndex !== -1);
        console.assert(this._searchResults.length);

        var lastRevealedSearchResultMarker = this._searchResults[this._currentSearchResultIndex].find();
        if (!lastRevealedSearchResultMarker)
            return true;

        var currentCursorPosition = this._codeMirror.getCursor("start");
        var lastRevealedSearchResultPosition = lastRevealedSearchResultMarker.from;

        return WI.compareCodeMirrorPositions(currentCursorPosition, lastRevealedSearchResultPosition) !== 0;
    }

    _revalidateSearchResults(direction)
    {
        console.assert(direction !== undefined);

        this._currentSearchResultIndex = -1;

        var updatedSearchResults = [];
        for (var i = 0; i < this._searchResults.length; ++i) {
            if (this._searchResults[i].find())
                updatedSearchResults.push(this._searchResults[i]);
        }

        console.assert(updatedSearchResults.length !== this._searchResults.length);

        this._searchResults = updatedSearchResults;
        this.dispatchEventToListeners(WI.TextEditor.Event.NumberOfSearchResultsDidChange);

        if (this._searchResults.length) {
            if (direction > 0)
                this._revealFirstSearchResultAfterCursor();
            else
                this._revealFirstSearchResultBeforeCursor();
        }
    }

    _clearMultilineExecutionLineHighlights()
    {
        if (this._executionMultilineHandles.length) {
            for (let lineHandle of this._executionMultilineHandles)
                this._codeMirror.removeLineClass(lineHandle, "wrap", WI.TextEditor.ExecutionLineStyleClassName);
            this._executionMultilineHandles = [];
        }
    }

    _updateExecutionLine()
    {
        this._codeMirror.operation(() => {
            if (this._executionLineHandle) {
                this._codeMirror.removeLineClass(this._executionLineHandle, "wrap", WI.TextEditor.ExecutionLineStyleClassName);
                this._codeMirror.removeLineClass(this._executionLineHandle, "wrap", "primary");
            }

            this._clearMultilineExecutionLineHighlights();

            this._executionLineHandle = !isNaN(this._executionLineNumber) ? this._codeMirror.getLineHandle(this._executionLineNumber) : null;

            if (this._executionLineHandle) {
                this._codeMirror.addLineClass(this._executionLineHandle, "wrap", WI.TextEditor.ExecutionLineStyleClassName);
                this._codeMirror.addLineClass(this._executionLineHandle, "wrap", "primary");
                this._codeMirror.removeLineClass(this._executionLineHandle, "wrap", WI.TextEditor.HighlightedStyleClassName);
            }
        });
    }

    _updateExecutionRangeHighlight()
    {
        if (this._executionRangeHighlightMarker) {
            this._executionRangeHighlightMarker.clear();
            this._executionRangeHighlightMarker = null;
        }

        if (isNaN(this._executionLineNumber))
            return;

        let currentPosition = new WI.SourceCodePosition(this._executionLineNumber, this._executionColumnNumber);

        this._delegate.textEditorExecutionHighlightRange(currentPosition, (range) => {
            let start, end;
            if (!range) {
                // Highlight the rest of the line.
                start = {line: this._executionLineNumber, ch: this._executionColumnNumber};
                end = {line: this._executionLineNumber};
            } else {
                // Highlight the range.
                start = range.startPosition.toCodeMirror();
                end = range.endPosition.toCodeMirror();
            }

            // Ensure the marker is cleared in case there were multiple updates very quickly.
            if (this._executionRangeHighlightMarker) {
                this._executionRangeHighlightMarker.clear();
                this._executionRangeHighlightMarker = null;
            }

            // Avoid highlighting trailing whitespace.
            let text = this._codeMirror.getRange(start, end);
            let trailingWhitespace = text.match(/\s+$/);
            if (trailingWhitespace)
                end.ch = Math.max(0, end.ch - trailingWhitespace[0].length);

            // Give each line containing part of the range the full line style.
            this._clearMultilineExecutionLineHighlights();
            if (start.line !== end.line) {
                for (let line = start.line; line < end.line; ++line) {
                    let lineHandle = this._codeMirror.getLineHandle(line);
                    this._codeMirror.addLineClass(lineHandle, "wrap", WI.TextEditor.ExecutionLineStyleClassName);
                    this._executionMultilineHandles.push(lineHandle);
                }
            }

            this._executionRangeHighlightMarker = this._codeMirror.markText(start, end, {className: "execution-range-highlight"});
        });
    }

    _setBreakpointStylesOnLine(lineNumber)
    {
        var columnBreakpoints = this._breakpoints[lineNumber];
        console.assert(columnBreakpoints);
        if (!columnBreakpoints)
            return;

        var allDisabled = true;
        var allResolved = true;
        var allAutoContinue = true;
        var multiple = Object.keys(columnBreakpoints).length > 1;
        for (var columnNumber in columnBreakpoints) {
            var breakpointInfo = columnBreakpoints[columnNumber];
            if (!breakpointInfo.disabled)
                allDisabled = false;
            if (!breakpointInfo.resolved)
                allResolved = false;
            if (!breakpointInfo.autoContinue)
                allAutoContinue = false;
        }

        allResolved = allResolved && WI.debuggerManager.breakpointsEnabled;

        function updateStyles()
        {
            // We might not have a line if the content isn't fully populated yet.
            // This will be called again when the content is available.
            var lineHandle = this._codeMirror.getLineHandle(lineNumber);
            if (!lineHandle)
                return;

            this._codeMirror.addLineClass(lineHandle, "wrap", WI.TextEditor.HasBreakpointStyleClassName);

            if (allResolved)
                this._codeMirror.addLineClass(lineHandle, "wrap", WI.TextEditor.BreakpointResolvedStyleClassName);
            else
                this._codeMirror.removeLineClass(lineHandle, "wrap", WI.TextEditor.BreakpointResolvedStyleClassName);

            if (allDisabled)
                this._codeMirror.addLineClass(lineHandle, "wrap", WI.TextEditor.BreakpointDisabledStyleClassName);
            else
                this._codeMirror.removeLineClass(lineHandle, "wrap", WI.TextEditor.BreakpointDisabledStyleClassName);

            if (allAutoContinue)
                this._codeMirror.addLineClass(lineHandle, "wrap", WI.TextEditor.BreakpointAutoContinueStyleClassName);
            else
                this._codeMirror.removeLineClass(lineHandle, "wrap", WI.TextEditor.BreakpointAutoContinueStyleClassName);

            if (multiple)
                this._codeMirror.addLineClass(lineHandle, "wrap", WI.TextEditor.MultipleBreakpointsStyleClassName);
            else
                this._codeMirror.removeLineClass(lineHandle, "wrap", WI.TextEditor.MultipleBreakpointsStyleClassName);
        }

        this._codeMirror.operation(updateStyles.bind(this));
    }

    _addBreakpointToLineAndColumnWithInfo(lineNumber, columnNumber, breakpointInfo)
    {
        if (!this._breakpoints[lineNumber])
            this._breakpoints[lineNumber] = {};
        this._breakpoints[lineNumber][columnNumber] = breakpointInfo;

        this._setBreakpointStylesOnLine(lineNumber);
    }

    _removeBreakpointFromLineAndColumn(lineNumber, columnNumber)
    {
        if (!nullish(columnNumber)) {
            console.assert(columnNumber in this._breakpoints[lineNumber]);
            delete this._breakpoints[lineNumber][columnNumber];

            // There are still breakpoints on the line. Update the breakpoint style.
            if (!isEmptyObject(this._breakpoints[lineNumber])) {
                this._setBreakpointStylesOnLine(lineNumber);
                return;
            }
        }

        delete this._breakpoints[lineNumber];

        function updateStyles()
        {
            var lineHandle = this._codeMirror.getLineHandle(lineNumber);
            if (!lineHandle)
                return;

            this._codeMirror.removeLineClass(lineHandle, "wrap", WI.TextEditor.HasBreakpointStyleClassName);
            this._codeMirror.removeLineClass(lineHandle, "wrap", WI.TextEditor.BreakpointResolvedStyleClassName);
            this._codeMirror.removeLineClass(lineHandle, "wrap", WI.TextEditor.BreakpointDisabledStyleClassName);
            this._codeMirror.removeLineClass(lineHandle, "wrap", WI.TextEditor.BreakpointAutoContinueStyleClassName);
            this._codeMirror.removeLineClass(lineHandle, "wrap", WI.TextEditor.MultipleBreakpointsStyleClassName);
        }

        this._codeMirror.operation(updateStyles.bind(this));
    }

    _allColumnBreakpointInfoForLine(lineNumber)
    {
        return this._breakpoints[lineNumber];
    }

    _setColumnBreakpointInfoForLine(lineNumber, columnBreakpointInfo)
    {
        console.assert(columnBreakpointInfo);
        this._breakpoints[lineNumber] = columnBreakpointInfo;
        this._setBreakpointStylesOnLine(lineNumber);
    }

    _gutterMouseDown(codeMirror, lineNumber, gutterElement, event)
    {
        if (event.button !== 0 || event.ctrlKey)
            return;

        if (!this._codeMirror.hasLineClass(lineNumber, "wrap", WI.TextEditor.HasBreakpointStyleClassName)) {
            console.assert(!(lineNumber in this._breakpoints));

            // No breakpoint, add a new one.
            if (this._delegate && typeof this._delegate.textEditorBreakpointAdded === "function") {
                var data = this._delegate.textEditorBreakpointAdded(this, lineNumber, 0);
                if (data) {
                    var breakpointInfo = data.breakpointInfo;
                    if (breakpointInfo)
                        this._addBreakpointToLineAndColumnWithInfo(data.lineNumber, data.columnNumber, breakpointInfo);
                }
            }

            return;
        }

        console.assert(lineNumber in this._breakpoints);

        this._lineNumberWithMousedDownBreakpoint = lineNumber;
        this._lineNumberWithDraggedBreakpoint = lineNumber;
        this._draggingBreakpointInfo = this._breakpoints[lineNumber];

        let columnNumbers = Object.keys(this._breakpoints[lineNumber]);
        if (columnNumbers.length === 1) {
            let columnNumber = columnNumbers[0];
            this._draggingBreakpointInfo = this._draggingBreakpointInfo[columnNumber];
            this._columnNumberWithMousedDownBreakpoint = columnNumber;
            this._columnNumberWithDraggedBreakpoint = columnNumber;
        }

        this._documentMouseMovedEventListener = this._documentMouseMoved.bind(this);
        this._documentMouseUpEventListener = this._documentMouseUp.bind(this);

        // Register these listeners on the document so we can track the mouse if it leaves the gutter.
        document.addEventListener("mousemove", this._documentMouseMovedEventListener, true);
        document.addEventListener("mouseup", this._documentMouseUpEventListener, true);
    }

    _gutterContextMenu(codeMirror, lineNumber, gutterElement, event)
    {
        if (this._delegate && typeof this._delegate.textEditorGutterContextMenu === "function") {
            var breakpoints = [];
            for (var columnNumber in this._breakpoints[lineNumber])
                breakpoints.push({lineNumber, columnNumber});

            this._delegate.textEditorGutterContextMenu(this, lineNumber, 0, breakpoints, event);
        }
    }

    _documentMouseMoved(event)
    {
        console.assert("_lineNumberWithMousedDownBreakpoint" in this);
        if (!("_lineNumberWithMousedDownBreakpoint" in this))
            return;

        event.preventDefault();

        var lineNumber;
        var position = this._codeMirror.coordsChar({left: event.pageX, top: event.pageY});

        // CodeMirror's coordsChar returns a position even if it is outside the bounds. Nullify the position
        // if the event is outside the bounds of the gutter so we will remove the breakpoint.
        var gutterBounds = this._codeMirror.getGutterElement().getBoundingClientRect();
        if (event.pageX < gutterBounds.left || event.pageX > gutterBounds.right || event.pageY < gutterBounds.top || event.pageY > gutterBounds.bottom)
            position = null;

        // If we have a position and it has a line then use it.
        if (position && "line" in position)
            lineNumber = position.line;

        // The _lineNumberWithDraggedBreakpoint property can be undefined if the user drags
        // outside of the gutter. The lineNumber variable can be undefined for the same reason.

        if (lineNumber === this._lineNumberWithDraggedBreakpoint)
            return;

        // Record that the mouse dragged some so when mouse up fires we know to do the
        // work of removing and moving the breakpoint.
        this._mouseDragged = true;

        if (!("_columnNumberWithMousedDownBreakpoint" in this)) {
            if (lineNumber === this._lineNumberWithMousedDownBreakpoint) {
                this._setColumnBreakpointInfoForLine(lineNumber, this._draggingBreakpointInfo);
                this._lineNumberWithDraggedBreakpoint = lineNumber;
            } else {
                this._removeBreakpointFromLineAndColumn(this._lineNumberWithMousedDownBreakpoint);
                delete this._lineNumberWithDraggedBreakpoint;
            }
            return;
        }

        if ("_lineNumberWithDraggedBreakpoint" in this) {
            // We have a line that is currently showing the dragged breakpoint. Remove that breakpoint
            // and restore the previous one (if any.)
            if (this._previousColumnBreakpointInfo)
                this._setColumnBreakpointInfoForLine(this._lineNumberWithDraggedBreakpoint, this._previousColumnBreakpointInfo);
            else
                this._removeBreakpointFromLineAndColumn(this._lineNumberWithDraggedBreakpoint, this._columnNumberWithDraggedBreakpoint);

            delete this._previousColumnBreakpointInfo;
            delete this._lineNumberWithDraggedBreakpoint;
            delete this._columnNumberWithDraggedBreakpoint;
        }

        if (lineNumber !== undefined) {
            // We have a new line that will now show the dragged breakpoint.
            var newColumnBreakpoints = {};
            var columnNumber = lineNumber === this._lineNumberWithMousedDownBreakpoint ? this._columnNumberWithDraggedBreakpoint : 0;
            newColumnBreakpoints[columnNumber] = this._draggingBreakpointInfo;
            this._previousColumnBreakpointInfo = this._allColumnBreakpointInfoForLine(lineNumber);
            this._setColumnBreakpointInfoForLine(lineNumber, newColumnBreakpoints);
            this._lineNumberWithDraggedBreakpoint = lineNumber;
            this._columnNumberWithDraggedBreakpoint = columnNumber;
        }
    }

    _documentMouseUp(event)
    {
        console.assert("_lineNumberWithMousedDownBreakpoint" in this);
        if (!("_lineNumberWithMousedDownBreakpoint" in this))
            return;

        event.preventDefault();

        document.removeEventListener("mousemove", this._documentMouseMovedEventListener, true);
        document.removeEventListener("mouseup", this._documentMouseUpEventListener, true);

        var delegateImplementsBreakpointClicked = this._delegate && typeof this._delegate.textEditorBreakpointClicked === "function";
        var delegateImplementsBreakpointRemoved = this._delegate && typeof this._delegate.textEditorBreakpointRemoved === "function";
        var delegateImplementsBreakpointMoved = this._delegate && typeof this._delegate.textEditorBreakpointMoved === "function";

        if (this._mouseDragged) {
            if (!("_lineNumberWithDraggedBreakpoint" in this)) {
                // The breakpoint was dragged off the gutter, remove it.
                if (delegateImplementsBreakpointRemoved) {
                    this._ignoreSetBreakpointInfoCalls = true;
                    this._delegate.textEditorBreakpointRemoved(this, this._lineNumberWithMousedDownBreakpoint, this._columnNumberWithMousedDownBreakpoint);
                    delete this._ignoreSetBreakpointInfoCalls;
                }
            } else if (this._lineNumberWithMousedDownBreakpoint !== this._lineNumberWithDraggedBreakpoint) {
                // The dragged breakpoint was moved to a new line.

                // If there is are breakpoints already at the drop line, tell the delegate to remove them.
                // We have already updated the breakpoint info internally, so when the delegate removes the breakpoints
                // and tells us to clear the breakpoint info, we can ignore those calls.
                if (this._previousColumnBreakpointInfo && delegateImplementsBreakpointRemoved) {
                    this._ignoreSetBreakpointInfoCalls = true;
                    this._delegate.textEditorBreakpointRemoved(this, this._lineNumberWithDraggedBreakpoint);
                    delete this._ignoreSetBreakpointInfoCalls;
                }

                // Tell the delegate to move the breakpoint from one line to another.
                if ("_columnNumberWithDraggedBreakpoint" in this && delegateImplementsBreakpointMoved) {
                    this._ignoreSetBreakpointInfoCalls = true;
                    this._delegate.textEditorBreakpointMoved(this, this._lineNumberWithMousedDownBreakpoint, this._columnNumberWithMousedDownBreakpoint, this._lineNumberWithDraggedBreakpoint, this._columnNumberWithDraggedBreakpoint);
                    delete this._ignoreSetBreakpointInfoCalls;
                }
            }
        } else {
            // Toggle the disabled state of the breakpoint.
            console.assert(this._lineNumberWithMousedDownBreakpoint in this._breakpoints);
            console.assert(!("_columnNumberWithMousedDownBreakpoint" in this) || this._columnNumberWithMousedDownBreakpoint in this._breakpoints[this._lineNumberWithMousedDownBreakpoint]);
            if (this._lineNumberWithMousedDownBreakpoint in this._breakpoints && (!("_columnNumberWithMousedDownBreakpoint" in this) || this._columnNumberWithMousedDownBreakpoint in this._breakpoints[this._lineNumberWithMousedDownBreakpoint]) && delegateImplementsBreakpointClicked)
                this._delegate.textEditorBreakpointClicked(this, this._lineNumberWithMousedDownBreakpoint, this._columnNumberWithMousedDownBreakpoint);
        }

        delete this._documentMouseMovedEventListener;
        delete this._documentMouseUpEventListener;
        delete this._lineNumberWithMousedDownBreakpoint;
        delete this._lineNumberWithDraggedBreakpoint;
        delete this._columnNumberWithMousedDownBreakpoint;
        delete this._columnNumberWithDraggedBreakpoint;
        delete this._previousColumnBreakpointInfo;
        delete this._mouseDragged;
    }

    _openClickedLinks(event)
    {
        if (!this.readOnly && !event.commandOrControlKey)
            return;

        // Get the position in the text and the token at that position.
        var position = this._codeMirror.coordsChar({left: event.pageX, top: event.pageY});
        var tokenInfo = this._codeMirror.getTokenAt(position);
        if (!tokenInfo || !tokenInfo.type || !tokenInfo.string)
            return;

        // If the token is not a link, then ignore it.
        if (!/\blink\b/.test(tokenInfo.type))
            return;

        // The token string is the URL we should open. It might be a relative URL.
        var url = tokenInfo.string;

        // Get the base URL.
        var baseURL = "";
        if (this._delegate && typeof this._delegate.textEditorBaseURL === "function")
            baseURL = this._delegate.textEditorBaseURL(this);

        // Open the link after resolving the absolute URL from the base URL.
        WI.openURL(absoluteURL(url, baseURL));

        // Stop processing the event.
        event.preventDefault();
        event.stopPropagation();
    }

    _isPositionVisible(position)
    {
        var scrollInfo = this._codeMirror.getScrollInfo();
        var visibleRangeStart = scrollInfo.top;
        var visibleRangeEnd = visibleRangeStart + scrollInfo.clientHeight;
        var coords = this._codeMirror.charCoords(position, "local");

        return coords.top >= visibleRangeStart && coords.bottom <= visibleRangeEnd;
    }

    _scrollIntoViewCentered(position)
    {
        var scrollInfo = this._codeMirror.getScrollInfo();
        var lineHeight = Math.ceil(this._codeMirror.defaultTextHeight());
        var margin = Math.floor((scrollInfo.clientHeight - lineHeight) / 2);
        this._codeMirror.scrollIntoView(position, margin);
    }
};

WI.TextEditor.HighlightedStyleClassName = "highlighted";
WI.TextEditor.SearchResultStyleClassName = "search-result";
WI.TextEditor.HasBreakpointStyleClassName = "has-breakpoint";
WI.TextEditor.BreakpointResolvedStyleClassName = "breakpoint-resolved";
WI.TextEditor.BreakpointAutoContinueStyleClassName = "breakpoint-auto-continue";
WI.TextEditor.BreakpointDisabledStyleClassName = "breakpoint-disabled";
WI.TextEditor.MultipleBreakpointsStyleClassName = "multiple-breakpoints";
WI.TextEditor.ExecutionLineStyleClassName = "execution-line";
WI.TextEditor.BouncyHighlightStyleClassName = "bouncy-highlight";
WI.TextEditor.NumberOfFindsPerSearchBatch = 10;
WI.TextEditor.HighlightAnimationDuration = 2000;

WI.TextEditor.Event = {
    Focused: "text-editor-focused",
    ExecutionLineNumberDidChange: "text-editor-execution-line-number-did-change",
    NumberOfSearchResultsDidChange: "text-editor-number-of-search-results-did-change",
    ContentDidChange: "text-editor-content-did-change",
    FormattingDidChange: "text-editor-formatting-did-change",
    MIMETypeChanged: "text-editor-mime-type-changed",
};
