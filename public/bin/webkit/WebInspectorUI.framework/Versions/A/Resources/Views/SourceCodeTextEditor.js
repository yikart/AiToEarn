/*
 * Copyright (C) 2013-2018 Apple Inc. All rights reserved.
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

WI.SourceCodeTextEditor = class SourceCodeTextEditor extends WI.TextEditor
{
    constructor(sourceCode)
    {
        console.assert(sourceCode instanceof WI.SourceCode);

        super();

        this.delegate = this;

        this._sourceCode = sourceCode;
        this._breakpointMap = {};
        this._inlineBreakpointDataForLine = new Multimap;
        this._issuesLineNumberMap = new Map;
        this._widgetMap = new Map;
        this._contentPopulated = false;
        this._invalidLineNumbers = {0: true};
        this._requestingScriptContent = false;
        this._activeCallFrameSourceCodeLocation = null;

        this._threadLineNumberMap = new Map; // line -> [targets]
        this._threadWidgetMap = new Map; // line -> widget
        this._threadTargetMap = new Map; // target -> line

        this._typeTokenScrollHandler = null;
        this._typeTokenAnnotator = null;
        this._basicBlockAnnotator = null;
        this._editingController = null;

        this._autoFormat = false;
        this._isProbablyMinified = false;

        this._ignoreContentDidChange = 0;
        this._ignoreLocationUpdateBreakpoint = null;
        this._ignoreBreakpointAddedBreakpoint = null;
        this._ignoreBreakpointRemovedBreakpoint = null;
        this._ignoreAllBreakpointLocationUpdates = false;

        // FIXME: Currently this just jumps between resources and related source map resources. It doesn't "jump to symbol" yet.
        this._updateTokenTrackingControllerState();

        this.element.classList.add("source-code");

        if (this._supportsDebugging) {
            WI.JavaScriptBreakpoint.addEventListener(WI.Breakpoint.Event.DisabledStateDidChange, this._breakpointStatusDidChange, this);
            WI.JavaScriptBreakpoint.addEventListener(WI.Breakpoint.Event.AutoContinueDidChange, this._breakpointStatusDidChange, this);

            WI.JavaScriptBreakpoint.addEventListener(WI.JavaScriptBreakpoint.Event.ResolvedStateDidChange, this._breakpointStatusDidChange, this);
            WI.JavaScriptBreakpoint.addEventListener(WI.JavaScriptBreakpoint.Event.LocationDidChange, this._updateBreakpointLocation, this);

            WI.targetManager.addEventListener(WI.TargetManager.Event.TargetAdded, this._targetAdded, this);
            WI.targetManager.addEventListener(WI.TargetManager.Event.TargetRemoved, this._targetRemoved, this);

            WI.debuggerManager.addEventListener(WI.DebuggerManager.Event.BreakpointsEnabledDidChange, this._breakpointsEnabledDidChange, this);
            WI.debuggerManager.addEventListener(WI.DebuggerManager.Event.BreakpointAdded, this._breakpointAdded, this);
            WI.debuggerManager.addEventListener(WI.DebuggerManager.Event.BreakpointRemoved, this._breakpointRemoved, this);
            WI.debuggerManager.addEventListener(WI.DebuggerManager.Event.CallFramesDidChange, this._callFramesDidChange, this);
            WI.debuggerManager.addEventListener(WI.DebuggerManager.Event.ActiveCallFrameDidChange, this._activeCallFrameDidChange, this);

            WI.debuggerManager.addEventListener(WI.DebuggerManager.Event.Paused, this._debuggerDidPause, this);
            WI.debuggerManager.addEventListener(WI.DebuggerManager.Event.Resumed, this._debuggerDidResume, this);
            if (WI.debuggerManager.activeCallFrame)
                this._debuggerDidPause();

            this._activeCallFrameDidChange();
        }

        WI.consoleManager.addEventListener(WI.ConsoleManager.Event.IssueAdded, this._issueWasAdded, this);

        this._sourceCode.addEventListener(WI.SourceCode.Event.FormatterDidChange, this._handleFormatterDidChange, this);
        if (this._sourceCode instanceof WI.SourceMapResource || this._sourceCode.sourceMaps.length > 0)
            WI.notifications.addEventListener(WI.Notification.GlobalModifierKeysDidChange, this._updateTokenTrackingControllerState, this);
        else
            this._sourceCode.addEventListener(WI.SourceCode.Event.SourceMapAdded, this._sourceCodeSourceMapAdded, this);

        sourceCode.requestContent().then(this._contentAvailable.bind(this));

        new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.Control, "G", this.showGoToLineDialog.bind(this), this.element);

        WI.consoleManager.addEventListener(WI.ConsoleManager.Event.Cleared, this._logCleared, this);
    }

    // Public

    get sourceCode()
    {
        return this._sourceCode;
    }

    get target()
    {
        if (this._sourceCode instanceof WI.SourceMapResource) {
            if (this._sourceCode.sourceMap.originalSourceCode instanceof WI.Script)
                return this._sourceCode.sourceMap.originalSourceCode.target;
        }

        if (this._sourceCode instanceof WI.Script)
            return this._sourceCode.target;

        return WI.mainTarget;
    }

    attached()
    {
        super.attached();

        if (WI.settings.showJavaScriptTypeInformation.value) {
            if (this._typeTokenAnnotator)
                this._typeTokenAnnotator.resume();
            if (!this._typeTokenScrollHandler && this._typeTokenAnnotator)
                this._enableScrollEventsForTypeTokenAnnotator();
        } else {
            if (this._typeTokenAnnotator)
                this._setTypeTokenAnnotatorEnabledState(false);
        }

        if (WI.settings.enableControlFlowProfiler.value) {
            if (this._basicBlockAnnotator)
                this._basicBlockAnnotator.resume();

            if (!this._controlFlowScrollHandler && this._basicBlockAnnotator)
                this._enableScrollEventsForControlFlowAnnotator();
        } else {
            this._basicBlockAnnotatorEnabled = false;
        }
    }

    detached()
    {
        this.tokenTrackingController.removeHighlightedRange();

        this._dismissPopover();

        this._dismissEditingController(true);

        if (this._typeTokenAnnotator)
            this._typeTokenAnnotator.pause();
        if (this._basicBlockAnnotator)
            this._basicBlockAnnotator.pause();

        super.detached();
    }

    close()
    {
        if (this._supportsDebugging) {
            WI.JavaScriptBreakpoint.removeEventListener(WI.Breakpoint.Event.DisabledStateDidChange, this._breakpointStatusDidChange, this);
            WI.JavaScriptBreakpoint.removeEventListener(WI.Breakpoint.Event.AutoContinueDidChange, this._breakpointStatusDidChange, this);

            WI.JavaScriptBreakpoint.removeEventListener(WI.JavaScriptBreakpoint.Event.ResolvedStateDidChange, this._breakpointStatusDidChange, this);
            WI.JavaScriptBreakpoint.removeEventListener(WI.JavaScriptBreakpoint.Event.LocationDidChange, this._updateBreakpointLocation, this);

            WI.targetManager.removeEventListener(WI.TargetManager.Event.TargetAdded, this._targetAdded, this);
            WI.targetManager.removeEventListener(WI.TargetManager.Event.TargetRemoved, this._targetRemoved, this);

            WI.debuggerManager.removeEventListener(WI.DebuggerManager.Event.BreakpointsEnabledDidChange, this._breakpointsEnabledDidChange, this);
            WI.debuggerManager.removeEventListener(WI.DebuggerManager.Event.BreakpointAdded, this._breakpointAdded, this);
            WI.debuggerManager.removeEventListener(WI.DebuggerManager.Event.BreakpointRemoved, this._breakpointRemoved, this);
            WI.debuggerManager.removeEventListener(WI.DebuggerManager.Event.CallFramesDidChange, this._callFramesDidChange, this);
            WI.debuggerManager.removeEventListener(WI.DebuggerManager.Event.ActiveCallFrameDidChange, this._activeCallFrameDidChange, this);

            WI.debuggerManager.removeEventListener(WI.DebuggerManager.Event.Paused, this._debuggerDidPause, this);
            WI.debuggerManager.removeEventListener(WI.DebuggerManager.Event.Resumed, this._debuggerDidResume, this);

            if (this._activeCallFrameSourceCodeLocation) {
                this._activeCallFrameSourceCodeLocation.removeEventListener(WI.SourceCodeLocation.Event.LocationChanged, this._activeCallFrameSourceCodeLocationChanged, this);
                this._activeCallFrameSourceCodeLocation = null;
            }
        }

        WI.consoleManager.removeEventListener(WI.ConsoleManager.Event.IssueAdded, this._issueWasAdded, this);

        this._sourceCode.removeEventListener(WI.SourceCode.Event.FormatterDidChange, this._handleFormatterDidChange, this);
        if (this._sourceCode instanceof WI.SourceMapResource || this._sourceCode.sourceMaps.length > 0)
            WI.notifications.removeEventListener(WI.Notification.GlobalModifierKeysDidChange, this._updateTokenTrackingControllerState, this);
        else
            this._sourceCode.removeEventListener(WI.SourceCode.Event.SourceMapAdded, this._sourceCodeSourceMapAdded, this);

        WI.consoleManager.removeEventListener(WI.ConsoleManager.Event.Cleared, this._logCleared, this);
    }

    canBeFormatted()
    {
        // Currently we assume that source map resources are formatted how the author wants it.
        // We could allow source map resources to be formatted, we would then need to make
        // SourceCodeLocation watch listen for mappedResource's formatting changes, and keep
        // a formatted location alongside the regular mapped location.
        if (this._sourceCode instanceof WI.SourceMapResource)
            return false;

        return super.canBeFormatted();
    }

    canShowTypeAnnotations()
    {
        // Type annotations for modified scripts are currently unsupported.
        return !!this._getAssociatedScript() && !this.hasModified;
    }

    canShowCoverageHints()
    {
        // Code coverage hints for modified scripts are currently unsupported.
        return !!this._getAssociatedScript() && !this.hasModified;
    }

    customPerformSearch(query)
    {
        let queryRegex = WI.SearchUtilities.searchRegExpForString(query, WI.SearchUtilities.defaultSettings);
        if (!queryRegex) {
            this.searchCleared();
            this.dispatchEventToListeners(WI.TextEditor.Event.NumberOfSearchResultsDidChange);
            return true;
        }

        function searchResultCallback(error, matches)
        {
            // Bail if the query changed since we started.
            if (this.currentSearchQuery !== query)
                return;

            if (error || !matches || !matches.length) {
                // Report zero matches.
                this.dispatchEventToListeners(WI.TextEditor.Event.NumberOfSearchResultsDidChange);
                return;
            }

            var searchResults = [];

            for (var i = 0; i < matches.length; ++i) {
                var matchLineNumber = matches[i].lineNumber;
                var line = this.line(matchLineNumber);
                if (!line)
                    return;

                // Reset the last index to reuse the regex on a new line.
                queryRegex.lastIndex = 0;

                // Search the line and mark the ranges.
                var lineMatch = null;
                while (queryRegex.lastIndex + query.length <= line.length && (lineMatch = queryRegex.exec(line))) {
                    var resultTextRange = new WI.TextRange(matchLineNumber, lineMatch.index, matchLineNumber, queryRegex.lastIndex);
                    searchResults.push(resultTextRange);
                }
            }

            this.addSearchResults(searchResults);

            this.dispatchEventToListeners(WI.TextEditor.Event.NumberOfSearchResultsDidChange);
        }

        if (this.hasEdits())
            return false;

        if (this._sourceCode instanceof WI.SourceMapResource)
            return false;
        if (this._sourceCode instanceof WI.LocalResource)
            return false;
        if (this._sourceCode instanceof WI.LocalScript)
            return false;

        let target = this._sourceCode.target;
        let caseSensitive = WI.SearchUtilities.defaultSettings.caseSensitive.value;
        let isRegex = WI.SearchUtilities.defaultSettings.regularExpression.value;

        if (this._sourceCode instanceof WI.Resource && target.hasCommand("Page.searchInResource")) {
            target.PageAgent.searchInResource(this._sourceCode.parentFrame.id, this._sourceCode.url, query, caseSensitive, isRegex, searchResultCallback.bind(this));
            return true;
        }

        if (this._sourceCode instanceof WI.Script) {
            target.DebuggerAgent.searchInContent(this._sourceCode.id, query, caseSensitive, isRegex, searchResultCallback.bind(this));
            return true;
        }

        return false;
    }

    showGoToLineDialog()
    {
        if (!this._goToLineDialog)
            this._goToLineDialog = new WI.GoToLineDialog(this);

        this._goToLineDialog.present(this.element);
    }

    isDialogRepresentedObjectValid(goToLineDialog, lineNumber)
    {
        return !isNaN(lineNumber) && lineNumber > 0 && lineNumber <= this.lineCount;
    }

    dialogWasDismissedWithRepresentedObject(goToLineDialog, lineNumber)
    {
        this.revealPosition(new WI.SourceCodePosition(lineNumber - 1, 0), {
            textRangeToSelect: new WI.TextRange(lineNumber - 1, 0, lineNumber, 0),
            preventHighlight: true,
        });
    }

    contentDidChange(replacedRanges, newRanges)
    {
        super.contentDidChange(replacedRanges, newRanges);

        if (this._ignoreContentDidChange > 0)
            return;

        for (var range of newRanges)
            this._updateEditableMarkers(range);

        if (this._basicBlockAnnotator) {
            this._basicBlockAnnotatorEnabled = false;
            this._basicBlockAnnotator = null;
        }

        if (this._typeTokenAnnotator) {
            this._setTypeTokenAnnotatorEnabledState(false);
            this._typeTokenAnnotator = null;
        }
    }

    toggleTypeAnnotations()
    {
        if (!this._typeTokenAnnotator)
            return Promise.reject(new Error("TypeTokenAnnotator is not initialized."));

        var newActivatedState = !this._typeTokenAnnotator.isActive();
        if (newActivatedState && this._isProbablyMinified && !this.formatted) {
            return this.updateFormattedState(true).then(() => {
                this._setTypeTokenAnnotatorEnabledState(newActivatedState);
            });
        }

        this._setTypeTokenAnnotatorEnabledState(newActivatedState);
        return Promise.resolve();
    }

    toggleUnexecutedCodeHighlights()
    {
        if (!this._basicBlockAnnotator)
            return Promise.reject(new Error("BasicBlockAnnotator is not initialized."));

        let newActivatedState = !this._basicBlockAnnotator.isActive();
        if (newActivatedState && this._isProbablyMinified && !this.formatted) {
            return this.updateFormattedState(true).then(() => {
                this._basicBlockAnnotatorEnabled = newActivatedState;
            });
        }

        this._basicBlockAnnotatorEnabled = newActivatedState;
        return Promise.resolve();
    }

    showPopoverForTypes(typeDescription, bounds, title)
    {
        var content = document.createElement("div");
        content.className = "object expandable";

        var titleElement = document.createElement("div");
        titleElement.className = "title";
        titleElement.textContent = title;
        content.appendChild(titleElement);

        var bodyElement = content.appendChild(document.createElement("div"));
        bodyElement.className = "body";

        var typeTreeView = new WI.TypeTreeView(typeDescription);
        bodyElement.appendChild(typeTreeView.element);

        this._showPopover(content, bounds);
    }

    // Protected

    prettyPrint(pretty)
    {
        // The annotators must be cleared before pretty printing takes place and resumed
        // after so that they clear their annotations in a known state and insert new annotations
        // in the new state.

        var shouldResumeBasicBlockAnnotator = this._basicBlockAnnotator && this._basicBlockAnnotator.isActive();
        if (shouldResumeBasicBlockAnnotator)
            this._basicBlockAnnotatorEnabled = false;

        let shouldResumeTypeTokenAnnotator = this._typeTokenAnnotator && this._typeTokenAnnotator.isActive();
        if (shouldResumeTypeTokenAnnotator)
            this._setTypeTokenAnnotatorEnabledState(false);

        return super.prettyPrint(pretty).then(() => {
            if (pretty || !this._isProbablyMinified) {
                if (shouldResumeBasicBlockAnnotator)
                    this._basicBlockAnnotatorEnabled = true;

                if (shouldResumeTypeTokenAnnotator)
                    this._setTypeTokenAnnotatorEnabledState(true);
            } else {
                console.assert(!pretty && this._isProbablyMinified);
                if (this._basicBlockAnnotator)
                    this._basicBlockAnnotatorEnabled = false;

                this._setTypeTokenAnnotatorEnabledState(false);
            }
        });
    }

    // Private

    _unformattedLineInfoForEditorLineInfo(lineInfo)
    {
        if (this.formatterSourceMap)
            return this.formatterSourceMap.formattedToOriginal(lineInfo.lineNumber, lineInfo.columnNumber);
        return lineInfo;
    }

    _sourceCodeLocationForEditorPosition(position)
    {
        var lineInfo = {lineNumber: position.line, columnNumber: position.ch};
        var unformattedLineInfo = this._unformattedLineInfoForEditorLineInfo(lineInfo);
        return this.sourceCode.createSourceCodeLocation(unformattedLineInfo.lineNumber, unformattedLineInfo.columnNumber);
    }

    _editorPositionForSourceCodeLocation(sourceCodeLocation)
    {
        if (this._sourceCode instanceof WI.SourceMapResource)
            return sourceCodeLocation.displayPosition();
        return sourceCodeLocation.formattedPosition();
    }

    _editorLineInfoForSourceCodeLocation(sourceCodeLocation)
    {
        let position = this._editorPositionForSourceCodeLocation(sourceCodeLocation);
        return this._editorLineInfoForEditorPosition(position);
    }

    _editorLineInfoForEditorPosition(position)
    {
        return {
            lineNumber: position.lineNumber,
            columnNumber: position.columnNumber,
        };
    }

    _breakpointForEditorLineInfo(lineInfo)
    {
        if (!this._breakpointMap[lineInfo.lineNumber])
            return null;
        return this._breakpointMap[lineInfo.lineNumber][lineInfo.columnNumber];
    }

    _addBreakpointWithEditorLineInfo(breakpoint, lineInfo)
    {
        if (!this._breakpointMap[lineInfo.lineNumber]) {
            this._addBreakpointWidgetsForLine(lineInfo.lineNumber);

            this._breakpointMap[lineInfo.lineNumber] = {};
        }

        this._breakpointMap[lineInfo.lineNumber][lineInfo.columnNumber] = breakpoint;
    }

    _removeBreakpointWithEditorLineInfo(breakpoint, lineInfo)
    {
        console.assert(breakpoint === this._breakpointMap[lineInfo.lineNumber][lineInfo.columnNumber]);

        delete this._breakpointMap[lineInfo.lineNumber][lineInfo.columnNumber];

        if (isEmptyObject(this._breakpointMap[lineInfo.lineNumber])) {
            delete this._breakpointMap[lineInfo.lineNumber];

            this._removeBreakpointWidgetsForLine(lineInfo.lineNumber);
        }
    }

    _populateWithContent(content)
    {
        content = content || "";

        this._prepareEditorForInitialContent(content);

        // If we can auto format, format the TextEditor before showing it.
        if (this._autoFormat) {
            console.assert(!this.formatted);
            this._autoFormat = false;
            this.deferReveal = true;
            this.string = content;
            this.deferReveal = false;
            this.updateFormattedState(true).then(() => {
                this._proceedPopulateWithContent(this.string);
            });
            return;
        }

        this._proceedPopulateWithContent(content);
    }

    _proceedPopulateWithContent(content)
    {
        this.dispatchEventToListeners(WI.SourceCodeTextEditor.Event.ContentWillPopulate);

        this.string = content;

        this._createBasicBlockAnnotator();
        if (WI.settings.enableControlFlowProfiler.value && this._basicBlockAnnotator)
            this._basicBlockAnnotatorEnabled = true;

        this._createTypeTokenAnnotator();
        if (WI.settings.showJavaScriptTypeInformation.value)
            this._setTypeTokenAnnotatorEnabledState(true);

        this._contentDidPopulate();
    }

    _contentDidPopulate()
    {
        this._contentPopulated = true;

        this.dispatchEventToListeners(WI.SourceCodeTextEditor.Event.ContentDidPopulate);

        // We add the issues each time content is populated. This is needed because lines might not exist
        // if we tried added them before when the full content wasn't available. (When populating with
        // partial script content this can be called multiple times.)

        this._reinsertAllIssues();
        this._reinsertAllThreadIndicators();

        this._updateEditableMarkers();
    }

    _prepareEditorForInitialContent(content)
    {
        // Only do this work before the first populate.
        if (this._contentPopulated)
            return;

        if (this._sourceCode instanceof WI.Resource)
            this.mimeType = this._sourceCode.syntheticMIMEType;
        else if (this._sourceCode instanceof WI.Script)
            this.mimeType = "text/javascript";
        else if (this._sourceCode instanceof WI.CSSStyleSheet)
            this.mimeType = "text/css";

        // Decide to automatically format the content if it looks minified and it can be formatted.
        console.assert(!this.formatted);
        if (this.canBeFormatted() && isTextLikelyMinified(content)) {
            this._autoFormat = true;
            this._isProbablyMinified = true;
        }

        if (this._supportsDebugging) {
            this._removeBreakpointWidgets();

            this._breakpointMap = {};

            for (let breakpoint of WI.debuggerManager.breakpointsForSourceCode(this._sourceCode)) {
                console.assert(this._matchesBreakpoint(breakpoint));
                var lineInfo = this._editorLineInfoForSourceCodeLocation(breakpoint.sourceCodeLocation);
                this._addBreakpointWithEditorLineInfo(breakpoint, lineInfo);
                this.setBreakpointInfoForLineAndColumn(lineInfo.lineNumber, lineInfo.columnNumber, this._breakpointInfoForBreakpoint(breakpoint));
            }
        }
    }

    _contentAvailable(parameters)
    {
        // Return if resource is not available.
        if (parameters.error)
            return;

        if (parameters.message) {
            this._showMessage(parameters.message);
            return;
        }

        var sourceCode = parameters.sourceCode;
        var content = sourceCode.content;
        var base64Encoded = parameters.base64Encoded;

        console.assert(sourceCode === this._sourceCode);
        console.assert(!base64Encoded);

        // Abort if the full content populated while waiting for this async callback.
        if (this._fullContentPopulated)
            return;

        this._fullContentPopulated = true;
        this._invalidLineNumbers = {};

        // If we had partial content (such as inline script content) before we had full content, we
        // will want to re-restore the revealed position now that we are populating with full content.
        this.repeatReveal = !!this.string;

        this._populateWithContent(content);

        this.repeatReveal = false;
    }

    _showMessage(message)
    {
        this.element.removeChildren();
        this.element.appendChild(WI.createMessageTextView(message));
    }

    _breakpointStatusDidChange(event)
    {
        this._updateBreakpointStatus(event.target);
    }

    _breakpointsEnabledDidChange()
    {
        console.assert(this._supportsDebugging);

        for (let breakpoint of WI.debuggerManager.breakpointsForSourceCode(this._sourceCode))
            this._updateBreakpointStatus(breakpoint);
    }

    _updateBreakpointStatus(breakpoint)
    {
        console.assert(this._supportsDebugging);

        if (!this._contentPopulated)
            return;

        if (!this._matchesBreakpoint(breakpoint))
            return;

        var lineInfo = this._editorLineInfoForSourceCodeLocation(breakpoint.sourceCodeLocation);
        this.setBreakpointInfoForLineAndColumn(lineInfo.lineNumber, lineInfo.columnNumber, this._breakpointInfoForBreakpoint(breakpoint));
    }

    _updateBreakpointLocation(event)
    {
        console.assert(this._supportsDebugging);

        if (!this._contentPopulated)
            return;

        var breakpoint = event.target;
        if (!this._matchesBreakpoint(breakpoint))
            return;

        if (this._ignoreAllBreakpointLocationUpdates)
            return;

        if (breakpoint === this._ignoreLocationUpdateBreakpoint)
            return;

        var sourceCodeLocation = breakpoint.sourceCodeLocation;

        if (this._sourceCode instanceof WI.SourceMapResource) {
            // Update our breakpoint location if the display location changed.
            if (sourceCodeLocation.displaySourceCode !== this._sourceCode)
                return;
            var oldLineInfo = {lineNumber: event.data.oldDisplayLineNumber, columnNumber: event.data.oldDisplayColumnNumber};
            var newLineInfo = {lineNumber: sourceCodeLocation.displayLineNumber, columnNumber: sourceCodeLocation.displayColumnNumber};
        } else {
            // Update our breakpoint location if the original location changed.
            if (sourceCodeLocation.sourceCode !== this._sourceCode)
                return;
            var oldLineInfo = {lineNumber: event.data.oldFormattedLineNumber, columnNumber: event.data.oldFormattedColumnNumber};
            var newLineInfo = {lineNumber: sourceCodeLocation.formattedLineNumber, columnNumber: sourceCodeLocation.formattedColumnNumber};
        }

        var existingBreakpoint = this._breakpointForEditorLineInfo(oldLineInfo);
        if (!existingBreakpoint)
            return;

        console.assert(breakpoint === existingBreakpoint);

        this.setBreakpointInfoForLineAndColumn(oldLineInfo.lineNumber, oldLineInfo.columnNumber, null);
        this.setBreakpointInfoForLineAndColumn(newLineInfo.lineNumber, newLineInfo.columnNumber, this._breakpointInfoForBreakpoint(breakpoint));

        this._removeBreakpointWithEditorLineInfo(breakpoint, oldLineInfo);
        this._addBreakpointWithEditorLineInfo(breakpoint, newLineInfo);
    }

    _breakpointAdded(event)
    {
        console.assert(this._supportsDebugging);

        if (!this._contentPopulated)
            return;

        var breakpoint = event.data.breakpoint;
        if (!this._matchesBreakpoint(breakpoint))
            return;

        if (breakpoint === this._ignoreBreakpointAddedBreakpoint)
            return;

        var lineInfo = this._editorLineInfoForSourceCodeLocation(breakpoint.sourceCodeLocation);
        this._addBreakpointWithEditorLineInfo(breakpoint, lineInfo);
        this.setBreakpointInfoForLineAndColumn(lineInfo.lineNumber, lineInfo.columnNumber, this._breakpointInfoForBreakpoint(breakpoint));
    }

    _breakpointRemoved(event)
    {
        console.assert(this._supportsDebugging);

        if (!this._contentPopulated)
            return;

        var breakpoint = event.data.breakpoint;
        if (!this._matchesBreakpoint(breakpoint))
            return;

        if (breakpoint === this._ignoreBreakpointRemovedBreakpoint)
            return;

        var lineInfo = this._editorLineInfoForSourceCodeLocation(breakpoint.sourceCodeLocation);
        this._removeBreakpointWithEditorLineInfo(breakpoint, lineInfo);
        this.setBreakpointInfoForLineAndColumn(lineInfo.lineNumber, lineInfo.columnNumber, null);
    }

    async _addBreakpointWidgetsForLine(lineNumber)
    {
        console.assert(!(lineNumber in this._breakpointMap), this._breakpointMap[lineNumber]);

        let startPosition = this.currentPositionToOriginalPosition(new WI.SourceCodePosition(lineNumber, 0));
        let script = this._getAssociatedScript(startPosition);
        if (!script)
            return;

        // If the current content is minified code, only show pause locations within 100 characters.
        let limitLocations = this._isProbablyMinified && !this.formatterSourceMap;
        let endPosition = this.currentPositionToOriginalPosition(new WI.SourceCodePosition(limitLocations ? lineNumber : (lineNumber + 1), limitLocations ? 100 : 0));
        console.assert(script === this._getAssociatedScript(endPosition), script);

        let locations = await script.breakpointLocations(startPosition, endPosition);
        for (let location of locations) {
            let position = this.originalPositionToCurrentPosition(location.position());

            // Don't show an inline widget when there is only one breakpoint location on the line
            // and it's at the start of the line.
            if (locations.length === 1 && position.lineNumber === lineNumber && !this.line(lineNumber).slice(0, position.columnNumber).trim().length)
                continue;

            console.assert(!Array.from(this._inlineBreakpointDataForLine.values()).some(({widget}) => widget.sourceCodeLocation.isEqual(location)), location, this._inlineBreakpointDataForLine);
            let inlineBreakpointWidget = new WI.BreakpointInlineWidget(WI.debuggerManager.breakpointsForSourceCodeLocation(location).firstValue || location);
            let bookmark = this.setInlineWidget(position, inlineBreakpointWidget.element);
            this._inlineBreakpointDataForLine.add(lineNumber, {bookmark, widget: inlineBreakpointWidget});
        }
    }

    _removeBreakpointWidgetsForLine(lineNumber)
    {
        console.assert(!(lineNumber in this._breakpointMap), this._breakpointMap[lineNumber]);

        let inlineData = this._inlineBreakpointDataForLine.take(lineNumber);
        if (!inlineData)
            return;

        for (let {bookmark} of inlineData)
            bookmark.clear();
    }

    _removeBreakpointWidgets()
    {
        for (let {bookmark} of this._inlineBreakpointDataForLine.values())
            bookmark.clear();
        this._inlineBreakpointDataForLine.clear();
    }

    _targetAdded(event)
    {
        if (WI.targets.length === 2)
            this._reinsertAllThreadIndicators();
    }

    _targetRemoved(event)
    {
        if (WI.targets.length === 1) {
            // Back to one thread, remove thread indicators.
            this._reinsertAllThreadIndicators();
            return;
        }

        let target = event.data.target;
        this._removeThreadIndicatorForTarget(target);
    }

    _callFramesDidChange(event)
    {
        if (WI.targets.length === 1)
            return;

        let target = event.data.target;
        this._removeThreadIndicatorForTarget(target);
        this._addThreadIndicatorForTarget(target);
    }

    _addThreadIndicatorForTarget(target)
    {
        let targetData = WI.debuggerManager.dataForTarget(target);
        let topCallFrame = targetData.stackTrace?.callFrames[0];
        if (!topCallFrame)
            return;

        let sourceCodeLocation = topCallFrame.sourceCodeLocation;
        console.assert(sourceCodeLocation, "Expected source code location to place thread indicator.");
        if (!sourceCodeLocation)
            return;

        if (!this._looselyMatchesSourceCodeLocation(sourceCodeLocation))
            return;

        let lineNumberWithIndicator = sourceCodeLocation.formattedLineNumber;
        this._threadTargetMap.set(target, lineNumberWithIndicator);

        let threads = this._threadLineNumberMap.get(lineNumberWithIndicator);
        if (!threads) {
            threads = [];
            this._threadLineNumberMap.set(lineNumberWithIndicator, threads);
        }
        threads.push(target);

        let widget = this._threadIndicatorWidgetForLine(target, lineNumberWithIndicator);
        this._updateThreadIndicatorWidget(widget, threads);

        this.addStyleClassToLine(lineNumberWithIndicator, "thread-indicator");
    }

    _removeThreadIndicatorForTarget(target)
    {
        let lineNumberWithIndicator = this._threadTargetMap.take(target);
        if (lineNumberWithIndicator === undefined)
            return;

        let threads = this._threadLineNumberMap.get(lineNumberWithIndicator);
        threads.remove(target);
        if (threads.length) {
            let widget = this._threadWidgetMap.get(lineNumberWithIndicator);
            this._updateThreadIndicatorWidget(widget, threads);
            return;
        }

        this._threadLineNumberMap.delete(lineNumberWithIndicator);

        let widget = this._threadWidgetMap.take(lineNumberWithIndicator);
        if (widget)
            widget.clear();

        this.removeStyleClassFromLine(lineNumberWithIndicator, "thread-indicator");
    }

    _threadIndicatorWidgetForLine(target, lineNumber)
    {
        let widget = this._threadWidgetMap.get(lineNumber);
        if (widget)
            return widget;

        widget = this.createWidgetForLine(lineNumber);
        if (!widget)
            return null;

        let widgetElement = widget.widgetElement;
        widgetElement.classList.add("line-indicator-widget", "thread-widget", "inline");
        widgetElement.addEventListener("click", this._handleThreadIndicatorWidgetClick.bind(this, widget, lineNumber));

        this._threadWidgetMap.set(lineNumber, widget);

        return widget;
    }

    _updateThreadIndicatorWidget(widget, threads)
    {
        if (!widget)
            return;

        console.assert(WI.targets.length > 1);

        let widgetElement = widget.widgetElement;
        widgetElement.removeChildren();

        widget[WI.SourceCodeTextEditor.WidgetContainsMultipleThreadsSymbol] = threads.length > 1;

        if (widgetElement.classList.contains("inline") || threads.length === 1) {
            let textElement = widgetElement.appendChild(document.createElement("span"));
            textElement.className = "text";
            textElement.textContent = threads.length === 1 ? threads[0].displayName : WI.UIString("%d Threads").format(threads.length);
        } else {
            for (let target of threads) {
                let textElement = widgetElement.appendChild(document.createElement("span"));
                textElement.className = "text";
                textElement.textContent = target.displayName;

                widgetElement.appendChild(document.createElement("br"));
            }
        }

        widget.update();
    }

    _handleThreadIndicatorWidgetClick(widget, lineNumber, event)
    {
        if (!this._isWidgetToggleable(widget))
            return;

        widget.widgetElement.classList.toggle("inline");

        let threads = this._threadLineNumberMap.get(lineNumber);
        this._updateThreadIndicatorWidget(widget, threads);
    }

    _activeCallFrameDidChange()
    {
        console.assert(this._supportsDebugging);

        if (this._activeCallFrameSourceCodeLocation) {
            this._activeCallFrameSourceCodeLocation.removeEventListener(WI.SourceCodeLocation.Event.LocationChanged, this._activeCallFrameSourceCodeLocationChanged, this);
            this._activeCallFrameSourceCodeLocation = null;
        }

        let activeCallFrame = WI.debuggerManager.activeCallFrame;
        if (!activeCallFrame || !this._matchesSourceCodeLocation(activeCallFrame.sourceCodeLocation)) {
            this.setExecutionLineAndColumn(NaN, NaN);
            return;
        }

        this._dismissPopover();

        this._activeCallFrameSourceCodeLocation = activeCallFrame.sourceCodeLocation;
        this._activeCallFrameSourceCodeLocation.addEventListener(WI.SourceCodeLocation.Event.LocationChanged, this._activeCallFrameSourceCodeLocationChanged, this);

        // Don't return early if the line number didn't change. The execution state still
        // could have changed (e.g. continuing in a loop with a breakpoint inside).

        let lineInfo = this._editorLineInfoForSourceCodeLocation(activeCallFrame.sourceCodeLocation);
        this.setExecutionLineAndColumn(lineInfo.lineNumber, lineInfo.columnNumber);

        // If we have full content or this source code isn't a Resource we can return early.
        // Script source code populates from the request started in the constructor.
        if (this._fullContentPopulated || !(this._sourceCode instanceof WI.Resource) || this._requestingScriptContent)
            return;

        // Since we are paused in the debugger we need to show some content, and since the Resource
        // content hasn't populated yet we need to populate with content from the Scripts by URL.
        // Document resources will attempt to populate the scripts as inline (in <script> tags.)
        // Other resources are assumed to be full scripts (JavaScript resources).
        if (this._sourceCode.type === WI.Resource.Type.Document)
            this._populateWithInlineScriptContent();
        else
            this._populateWithScriptContent();
    }

    _activeCallFrameSourceCodeLocationChanged(event)
    {
        console.assert(!isNaN(this.executionLineNumber));
        if (isNaN(this.executionLineNumber))
            return;

        console.assert(WI.debuggerManager.activeCallFrame);
        console.assert(this._activeCallFrameSourceCodeLocation === WI.debuggerManager.activeCallFrame.sourceCodeLocation);

        var lineInfo = this._editorLineInfoForSourceCodeLocation(this._activeCallFrameSourceCodeLocation);
        this.setExecutionLineAndColumn(lineInfo.lineNumber, lineInfo.columnNumber);
    }

    _populateWithInlineScriptContent()
    {
        console.assert(this._sourceCode instanceof WI.Resource);
        console.assert(!this._fullContentPopulated);
        console.assert(!this._requestingScriptContent);

        var scripts = this._sourceCode.scripts;
        console.assert(scripts.length);
        if (!scripts.length)
            return;

        var pendingRequestCount = scripts.length;

        // If the number of scripts hasn't change since the last populate, then there is nothing to do.
        if (this._inlineScriptContentPopulated === pendingRequestCount)
            return;

        this._inlineScriptContentPopulated = pendingRequestCount;

        function scriptContentAvailable(parameters)
        {
            // Return early if we are still waiting for content from other scripts.
            if (--pendingRequestCount)
                return;

            this._requestingScriptContent = false;

            // Abort if the full content populated while waiting for these async callbacks.
            if (this._fullContentPopulated)
                return;

            var scriptOpenTag = "<script>";
            var scriptCloseTag = "</script>";

            var content = "";
            var lineNumber = 0;
            var columnNumber = 0;

            this._invalidLineNumbers = {};

            for (var i = 0; i < scripts.length; ++i) {
                // Fill the line gap with newline characters.
                for (var newLinesCount = scripts[i].range.startLine - lineNumber; newLinesCount > 0; --newLinesCount) {
                    if (!columnNumber)
                        this._invalidLineNumbers[scripts[i].range.startLine - newLinesCount] = true;
                    columnNumber = 0;
                    content += "\n";
                }

                // Fill the column gap with space characters.
                for (var spacesCount = scripts[i].range.startColumn - columnNumber - scriptOpenTag.length; spacesCount > 0; --spacesCount)
                    content += " ";

                // Add script tags and content.
                content += scriptOpenTag;
                content += scripts[i].content;
                content += scriptCloseTag;

                lineNumber = scripts[i].range.endLine;
                columnNumber = scripts[i].range.endColumn + scriptCloseTag.length;
            }

            this._populateWithContent(content);
        }

        this._requestingScriptContent = true;

        var boundScriptContentAvailable = scriptContentAvailable.bind(this);
        for (var i = 0; i < scripts.length; ++i)
            scripts[i].requestContent().then(boundScriptContentAvailable);
    }

    _populateWithScriptContent()
    {
        console.assert(this._sourceCode instanceof WI.Resource);
        console.assert(!this._fullContentPopulated);
        console.assert(!this._requestingScriptContent);

        // We can assume this resource only has one script that starts at line/column 0.
        var scripts = this._sourceCode.scripts;
        console.assert(scripts.length === 1);
        if (!scripts.length)
            return;

        console.assert(scripts[0].range.startLine === 0);
        console.assert(scripts[0].range.startColumn === 0);

        function scriptContentAvailable(parameters)
        {
            var content = parameters.content;
            this._requestingScriptContent = false;

            // Abort if the full content populated while waiting for this async callback.
            if (this._fullContentPopulated)
                return;

            // This is the full content.
            this._fullContentPopulated = true;

            this._populateWithContent(content);
        }

        this._requestingScriptContent = true;

        scripts[0].requestContent().then(scriptContentAvailable.bind(this));
    }

    _looselyMatchesSourceCodeLocation(sourceCodeLocation)
    {
        if (this._sourceCode instanceof WI.SourceMapResource)
            return sourceCodeLocation.displaySourceCode === this._sourceCode;
        if (this._sourceCode instanceof WI.Resource || this._sourceCode instanceof WI.Script || this._sourceCode instanceof WI.CSSStyleSheet)
            return sourceCodeLocation.sourceCode.url === this._sourceCode.url;
        return false;
    }

    _matchesSourceCodeLocation(sourceCodeLocation)
    {
        if (this._sourceCode instanceof WI.SourceMapResource)
            return sourceCodeLocation.displaySourceCode === this._sourceCode;
        if (this._sourceCode instanceof WI.Resource || this._sourceCode instanceof WI.CSSStyleSheet)
            return sourceCodeLocation.sourceCode.url === this._sourceCode.url;
        if (this._sourceCode instanceof WI.Script)
            return sourceCodeLocation.sourceCode === this._sourceCode;
        return false;
    }

    _matchesBreakpoint(breakpoint)
    {
        console.assert(this._supportsDebugging);
        if (this._sourceCode instanceof WI.SourceMapResource)
            return breakpoint.sourceCodeLocation.displaySourceCode === this._sourceCode;
        if (this._sourceCode instanceof WI.Resource)
            return breakpoint.contentIdentifier && breakpoint.contentIdentifier === this._sourceCode.contentIdentifier;
        if (this._sourceCode instanceof WI.Script) {
            return (breakpoint.contentIdentifier && breakpoint.contentIdentifier === this._sourceCode.contentIdentifier)
                || (breakpoint.scriptIdentifier && breakpoint.scriptIdentifier === this._sourceCode.id);
        }
        return false;
    }

    _issueWasAdded(event)
    {
        var issue = event.data.issue;
        if (!WI.ConsoleManager.issueMatchSourceCode(issue, this._sourceCode))
            return;

        this._addIssue(issue);
    }

    _addIssue(issue)
    {
        var sourceCodeLocation = issue.sourceCodeLocation;
        console.assert(sourceCodeLocation, "Expected source code location to place issue.");
        if (!sourceCodeLocation)
            return;

        var lineNumber = sourceCodeLocation.formattedLineNumber;

        var lineNumberIssues = this._issuesLineNumberMap.get(lineNumber);
        if (!lineNumberIssues) {
            lineNumberIssues = [];
            this._issuesLineNumberMap.set(lineNumber, lineNumberIssues);
        }

        // Avoid displaying duplicate issues on the same line.
        for (var existingIssue of lineNumberIssues) {
            if (existingIssue.sourceCodeLocation.columnNumber === sourceCodeLocation.columnNumber && existingIssue.text === issue.text)
                return;
        }

        lineNumberIssues.push(issue);

        if (issue.level === WI.IssueMessage.Level.Error)
            this.addStyleClassToLine(lineNumber, WI.SourceCodeTextEditor.LineErrorStyleClassName);
        else if (issue.level === WI.IssueMessage.Level.Warning)
            this.addStyleClassToLine(lineNumber, WI.SourceCodeTextEditor.LineWarningStyleClassName);
        else
            console.error("Unknown issue level");

        var widget = this._issueWidgetForLine(lineNumber);
        if (widget) {
            if (issue.level === WI.IssueMessage.Level.Error)
                widget.widgetElement.classList.add(WI.SourceCodeTextEditor.LineErrorStyleClassName);
            else if (issue.level === WI.IssueMessage.Level.Warning)
                widget.widgetElement.classList.add(WI.SourceCodeTextEditor.LineWarningStyleClassName);

            this._updateIssueWidgetForIssues(widget, lineNumberIssues);
        }
    }

    _issueWidgetForLine(lineNumber)
    {
        var widget = this._widgetMap.get(lineNumber);
        if (widget)
            return widget;

        widget = this.createWidgetForLine(lineNumber);
        if (!widget)
            return null;

        var widgetElement = widget.widgetElement;
        widgetElement.classList.add("line-indicator-widget", "issue-widget", "inline");
        widgetElement.addEventListener("click", this._handleWidgetClick.bind(this, widget, lineNumber));

        this._widgetMap.set(lineNumber, widget);

        return widget;
    }

    _iconClassNameForIssueLevel(level)
    {
        if (level === WI.IssueMessage.Level.Warning)
            return "icon-warning";

        console.assert(level === WI.IssueMessage.Level.Error);
        return "icon-error";
    }

    _updateIssueWidgetForIssues(widget, issues)
    {
        var widgetElement = widget.widgetElement;
        widgetElement.removeChildren();

        if (widgetElement.classList.contains("inline") || issues.length === 1) {
            var iconElement = widgetElement.appendChild(document.createElement("span"));
            iconElement.className = "icon";

            var textElement = widgetElement.appendChild(document.createElement("span"));
            textElement.className = "text";

            if (issues.length === 1) {
                iconElement.classList.add(this._iconClassNameForIssueLevel(issues[0].level));
                textElement.textContent = issues[0].text;
            } else {
                var errorsCount = 0;
                var warningsCount = 0;
                for (var issue of issues) {
                    if (issue.level === WI.IssueMessage.Level.Error)
                        ++errorsCount;
                    else if (issue.level === WI.IssueMessage.Level.Warning)
                        ++warningsCount;
                }

                if (warningsCount && errorsCount) {
                    iconElement.classList.add(this._iconClassNameForIssueLevel(issue.level));
                    textElement.textContent = WI.UIString("%d Errors, %d Warnings").format(errorsCount, warningsCount);
                } else if (errorsCount) {
                    iconElement.classList.add(this._iconClassNameForIssueLevel(issue.level));
                    textElement.textContent = WI.UIString("%d Errors").format(errorsCount);
                } else if (warningsCount) {
                    iconElement.classList.add(this._iconClassNameForIssueLevel(issue.level));
                    textElement.textContent = WI.UIString("%d Warnings").format(warningsCount);
                }

                widget[WI.SourceCodeTextEditor.WidgetContainsMultipleIssuesSymbol] = true;
            }
        } else {
            for (var issue of issues) {
                var iconElement = widgetElement.appendChild(document.createElement("span"));
                iconElement.className = "icon";
                iconElement.classList.add(this._iconClassNameForIssueLevel(issue.level));

                var textElement = widgetElement.appendChild(document.createElement("span"));
                textElement.className = "text";
                textElement.textContent = issue.text;

                widgetElement.appendChild(document.createElement("br"));
            }
        }

        widget.update();
    }

    _isWidgetToggleable(widget)
    {
        if (widget[WI.SourceCodeTextEditor.WidgetContainsMultipleIssuesSymbol])
            return true;

        if (widget[WI.SourceCodeTextEditor.WidgetContainsMultipleThreadsSymbol])
            return true;

        if (!widget.widgetElement.classList.contains("inline"))
            return true;

        var textElement = widget.widgetElement.lastChild;
        if (textElement.offsetWidth !== textElement.scrollWidth)
            return true;

        return false;
    }

    _handleWidgetClick(widget, lineNumber, event)
    {
        if (!this._isWidgetToggleable(widget))
            return;

        widget.widgetElement.classList.toggle("inline");

        var lineNumberIssues = this._issuesLineNumberMap.get(lineNumber);
        this._updateIssueWidgetForIssues(widget, lineNumberIssues);
    }

    _breakpointInfoForBreakpoint(breakpoint)
    {
        return {resolved: breakpoint.resolved, disabled: breakpoint.disabled, autoContinue: breakpoint.autoContinue};
    }

    get _supportsDebugging()
    {
        if (this._sourceCode instanceof WI.Resource) {
            if (this._sourceCode.localResourceOverride)
                return false;
            return this._sourceCode.type === WI.Resource.Type.Document || this._sourceCode.type === WI.Resource.Type.Script;
        }
        if (this._sourceCode instanceof WI.Script)
            return !(this._sourceCode instanceof WI.LocalScript);
        return false;
    }

    // TextEditor Delegate

    textEditorBaseURL(textEditor)
    {
        return this._sourceCode.url;
    }

    textEditorScriptSourceType(textEditor)
    {
        let script = this._getAssociatedScript();
        return script ? script.sourceType : WI.Script.SourceType.Program;
    }

    textEditorShouldHideLineNumber(textEditor, lineNumber)
    {
        return lineNumber in this._invalidLineNumbers;
    }

    textEditorGutterContextMenu(textEditor, lineNumber, columnNumber, editorBreakpoints, event)
    {
        if (!this._supportsDebugging)
            return;

        event.preventDefault();

        let addBreakpoint = () => {
            let data = this.textEditorBreakpointAdded(this, lineNumber, columnNumber);
            this.setBreakpointInfoForLineAndColumn(data.lineNumber, data.columnNumber, data.breakpointInfo);
        };

        let contextMenu = WI.ContextMenu.createFromEvent(event);

        // Paused. Add Continue to Here option only if we have a script identifier for the location.
        if (WI.debuggerManager.paused) {
            let editorLineInfo = {lineNumber, columnNumber};
            let unformattedLineInfo = this._unformattedLineInfoForEditorLineInfo(editorLineInfo);
            let sourceCodeLocation = this._sourceCode.createSourceCodeLocation(unformattedLineInfo.lineNumber, unformattedLineInfo.columnNumber);

            let script;
            if (sourceCodeLocation.sourceCode instanceof WI.Script)
                script = sourceCodeLocation.sourceCode;
            else if (sourceCodeLocation.sourceCode instanceof WI.Resource)
                script = sourceCodeLocation.sourceCode.scriptForLocation(sourceCodeLocation);

            if (script) {
                contextMenu.appendItem(WI.UIString("Continue to Here"), () => {
                    WI.debuggerManager.continueToLocation(script, sourceCodeLocation.lineNumber, sourceCodeLocation.columnNumber);
                });
                contextMenu.appendSeparator();
            }
        }

        let breakpoints = [];
        for (let lineInfo of editorBreakpoints) {
            let breakpoint = this._breakpointForEditorLineInfo(lineInfo);
            console.assert(breakpoint);
            if (breakpoint)
                breakpoints.push(breakpoint);
        }

        // No breakpoints.
        if (!breakpoints.length) {
            contextMenu.appendItem(WI.UIString("Add Breakpoint"), addBreakpoint.bind(this));
            return;
        }

        // Single breakpoint.
        if (breakpoints.length === 1) {
            WI.BreakpointPopover.appendContextMenuItems(contextMenu, breakpoints[0], event.target);

            if (!WI.isShowingSourcesTab()) {
                contextMenu.appendSeparator();
                contextMenu.appendItem(WI.UIString("Reveal in Sources Tab"), () => {
                    WI.showSourcesTab({
                        representedObjectToSelect: breakpoints[0],
                        initiatorHint: WI.TabBrowser.TabNavigationInitiator.ContextMenu,
                    });
                });
            }

            return;
        }

        let shouldDisable = breakpoints.some((breakpoint) => !breakpoint.disabled);
        contextMenu.appendItem(shouldDisable ? WI.UIString("Disable Breakpoints") : WI.UIString("Enable Breakpoints"), () => {
            for (let breakpoint of breakpoints)
                breakpoint.disabled = shouldDisable;
        });

        contextMenu.appendItem(WI.UIString("Delete Breakpoints"), () => {
            for (let breakpoint of breakpoints)
                WI.debuggerManager.removeBreakpoint(breakpoint);
        });
    }

    textEditorBreakpointAdded(textEditor, lineNumber, columnNumber)
    {
        if (!this._supportsDebugging)
            return null;

        var editorLineInfo = {lineNumber, columnNumber};
        var unformattedLineInfo = this._unformattedLineInfoForEditorLineInfo(editorLineInfo);
        var sourceCodeLocation = this._sourceCode.createSourceCodeLocation(unformattedLineInfo.lineNumber, unformattedLineInfo.columnNumber);
        var breakpoint = new WI.JavaScriptBreakpoint(sourceCodeLocation);

        var lineInfo = this._editorLineInfoForSourceCodeLocation(breakpoint.sourceCodeLocation);
        this._addBreakpointWithEditorLineInfo(breakpoint, lineInfo);

        this._ignoreBreakpointAddedBreakpoint = breakpoint;
        WI.debuggerManager.addBreakpoint(breakpoint);
        this._ignoreBreakpointAddedBreakpoint = null;

        // Return the more accurate location and breakpoint info.
        return {
            breakpointInfo: this._breakpointInfoForBreakpoint(breakpoint),
            lineNumber: lineInfo.lineNumber,
            columnNumber: lineInfo.columnNumber
        };
    }

    textEditorBreakpointRemoved(textEditor, lineNumber, columnNumber)
    {
        console.assert(this._supportsDebugging);
        if (!this._supportsDebugging)
            return;

        let breakpointsToRemove = this._breakpointMap[lineNumber];
        if (!nullish(columnNumber))
            breakpointsToRemove = {[columnNumber]: breakpointsToRemove[columnNumber]};
        for (let column in breakpointsToRemove) {
            let breakpoint = breakpointsToRemove[column];

            this._removeBreakpointWithEditorLineInfo(breakpoint, {
                lineNumber,
                columnNumber: column,
            });

            this._ignoreBreakpointRemovedBreakpoint = breakpoint;
            WI.debuggerManager.removeBreakpoint(breakpoint);
            this._ignoreBreakpointRemovedBreakpoint = null;
        }
    }

    textEditorBreakpointMoved(textEditor, oldLineNumber, oldColumnNumber, newLineNumber, newColumnNumber)
    {
        console.assert(this._supportsDebugging);
        if (!this._supportsDebugging)
            return;

        var oldLineInfo = {lineNumber: oldLineNumber, columnNumber: oldColumnNumber};
        var breakpoint = this._breakpointForEditorLineInfo(oldLineInfo);
        console.assert(breakpoint);
        if (!breakpoint)
            return;

        this._removeBreakpointWithEditorLineInfo(breakpoint, oldLineInfo);

        var newLineInfo = {lineNumber: newLineNumber, columnNumber: newColumnNumber};
        var unformattedNewLineInfo = this._unformattedLineInfoForEditorLineInfo(newLineInfo);
        this._ignoreLocationUpdateBreakpoint = breakpoint;
        breakpoint.sourceCodeLocation.update(this._sourceCode, unformattedNewLineInfo.lineNumber, unformattedNewLineInfo.columnNumber);
        this._ignoreLocationUpdateBreakpoint = null;

        var accurateNewLineInfo = this._editorLineInfoForSourceCodeLocation(breakpoint.sourceCodeLocation);
        this._addBreakpointWithEditorLineInfo(breakpoint, accurateNewLineInfo);

        if (accurateNewLineInfo.lineNumber !== newLineInfo.lineNumber || accurateNewLineInfo.columnNumber !== newLineInfo.columnNumber)
            this.updateBreakpointLineAndColumn(newLineInfo.lineNumber, newLineInfo.columnNumber, accurateNewLineInfo.lineNumber, accurateNewLineInfo.columnNumber);
    }

    textEditorBreakpointClicked(textEditor, lineNumber, columnNumber)
    {
        console.assert(this._supportsDebugging);
        if (!this._supportsDebugging)
            return;

        let breakpointsToToggle = this._breakpointMap[lineNumber];
        if (!nullish(columnNumber))
            breakpointsToToggle = {[columnNumber]: breakpointsToToggle[columnNumber]};
        breakpointsToToggle = Object.values(breakpointsToToggle);

        let shouldEnable = breakpointsToToggle.some((breakpoint) => breakpoint.disabled);
        for (let breakpoint of breakpointsToToggle)
            breakpoint.disabled = !shouldEnable;
    }

    textEditorUpdatedFormatting(textEditor)
    {
        this._ignoreAllBreakpointLocationUpdates = true;
        this._sourceCode.formatterSourceMap = this.formatterSourceMap;
        this._ignoreAllBreakpointLocationUpdates = false;

        // Always put the source map on both the Script and Resource if both exist. For example,
        // if this SourceCode is a Resource, then there might also be a Script. In the debugger,
        // the backend identifies call frames with Script line and column information, and the
        // Script needs the formatter source map to produce the proper display line and column.
        if (this._sourceCode instanceof WI.Resource && !(this._sourceCode instanceof WI.SourceMapResource)) {
            var scripts = this._sourceCode.scripts;
            for (var i = 0; i < scripts.length; ++i)
                scripts[i].formatterSourceMap = this.formatterSourceMap;
        } else if (this._sourceCode instanceof WI.Script) {
            if (this._sourceCode.resource)
                this._sourceCode.resource.formatterSourceMap = this.formatterSourceMap;
        }

        this._handleFormatterDidChange();
    }

    textEditorExecutionHighlightRange(currentPosition, callback)
    {
        let position = this.currentPositionToOriginalPosition(currentPosition);

        let script = this._getAssociatedScript(position);
        if (!script) {
            callback(null);
            return;
        }

        let {startLine, startColumn} = script.range;

        function toInlineScriptPosition(position) {
            let columnNumber = position.lineNumber === startLine ? position.columnNumber - startColumn : position.columnNumber;
            return new WI.SourceCodePosition(position.lineNumber - startLine, columnNumber);
        }

        function fromInlineScriptPosition(position) {
            let columnNumber = position.lineNumber ? position.columnNumber : position.columnNumber + startColumn;
            return new WI.SourceCodePosition(position.lineNumber + startLine, columnNumber);
        }

        // When returning positions, convert to positions relative to the TextEditor content.
        let highlightSourceCodeRange = (startPosition, endPosition) => {
            startPosition = this.originalPositionToCurrentPosition(fromInlineScriptPosition(startPosition));
            endPosition = this.originalPositionToCurrentPosition(fromInlineScriptPosition(endPosition));
            callback({startPosition, endPosition});
        };

        script.requestScriptSyntaxTree((syntaxTree) => {
            // After requesting the tree, we still might get a null tree from a parse error.
            if (!syntaxTree) {
                callback(null);
                return;
            }

            // Convert to the position within the inline script before querying the AST.
            position = toInlineScriptPosition(position);
            let nodes = syntaxTree.containersOfPosition(position);
            if (!nodes.length) {
                callback(null);
                return;
            }

            // Find a node starting at this offset.
            // Avoid highlighting the entire program if this is the start of the first statement.
            // Special case the assignment expression inside of a for..of and for..in to highlight a larger range.
            for (let node of nodes) {
                if (node.startPosition.equals(position) && node.type !== WI.ScriptSyntaxTree.NodeType.Program) {
                    highlightSourceCodeRange(node.startPosition, node.endPosition);
                    return;
                }
                if (node.type === WI.ScriptSyntaxTree.NodeType.ForInStatement || node.type === WI.ScriptSyntaxTree.NodeType.ForOfStatement) {
                    if (node.left.startPosition.equals(position)) {
                        highlightSourceCodeRange(node.left.startPosition, node.right.endPosition);
                        return;
                    }
                }
                if (node.startPosition.isAfter(position))
                    break;
            }

            // Find a node ending at this offset. (Leaving a block).
            // We check this after ensuring nothing starts with this offset,
            // as that would be more important.
            for (let node of nodes) {
                if (node.endPosition.equals(position)) {
                    if (node.type === WI.ScriptSyntaxTree.NodeType.BlockStatement) {
                        // Closing brace of a block, only highlight the closing brace character.
                        highlightSourceCodeRange(position.offsetColumn(-1), position);
                        return;
                    }
                }
                if (node.startPosition.isAfter(position))
                    break;
            }

            // Find the best container node for this expression.
            // Sort by the tightest bounds so we can walk from specific to general nodes.
            nodes.sort((a, b) => {
                let aLength = a.range[1] - a.range[0];
                let bLength = b.range[1] - b.range[0];
                return aLength - bLength;
            });

            let characterAtPosition = this.getTextInRange(currentPosition, currentPosition.offsetColumn(1));
            let characterAtPositionIsDotOrBracket = characterAtPosition === "." || characterAtPosition === "[";

            for (let i = 0; i < nodes.length; ++i) {
                let node = nodes[i];

                // In a function call.
                if (node.type === WI.ScriptSyntaxTree.NodeType.CallExpression
                    || node.type === WI.ScriptSyntaxTree.NodeType.NewExpression
                    || node.type === WI.ScriptSyntaxTree.NodeType.ThrowStatement) {
                    highlightSourceCodeRange(node.startPosition, node.endPosition);
                    return;
                }

                // In the middle of a member expression we want to highlight the best
                // member expression range. We can end up in the middle when we are
                // paused inside of a getter and select the parent call frame. For
                // these cases we may be at a '.' or '[' and we can find the best member
                // expression from there.
                //
                // Examples:
                //
                //     foo*.x.y.z => inside x looking at parent call frame => |foo.x|.y.z
                //     foo.x*.y.z => inside y looking at parent call frame => |foo.x.y|.z
                //
                //     foo*["x"]["y"]["z"] => inside x looking at parent call frame => |foo["x"]|["y"]["z"]
                //     foo["x"]*["y"]["z"] => inside y looking at parent call frame => |foo["x"]["y"]|["z"]
                //
                if (node.type === WI.ScriptSyntaxTree.NodeType.ThisExpression
                    || (characterAtPositionIsDotOrBracket && (node.type === WI.ScriptSyntaxTree.NodeType.Identifier || node.type === WI.ScriptSyntaxTree.NodeType.MemberExpression))) {
                    let memberExpressionNode = null;
                    for (let j = i + 1; j < nodes.length; ++j) {
                        let nextNode = nodes[j];
                        if (nextNode.type === WI.ScriptSyntaxTree.NodeType.MemberExpression) {
                            memberExpressionNode = nextNode;
                            if (position.equals(memberExpressionNode.endPosition))
                                continue;
                        }
                        break;
                    }

                    if (memberExpressionNode) {
                        highlightSourceCodeRange(memberExpressionNode.startPosition, memberExpressionNode.endPosition);
                        return;
                    }

                    highlightSourceCodeRange(node.startPosition, node.endPosition);
                    return;
                }
            }

            // No matches, just highlight the line.
            callback(null);
        });
    }

    _clearIssueWidgets()
    {
        for (var widget of this._widgetMap.values())
            widget.clear();

        this._widgetMap.clear();
    }

    _reinsertAllIssues()
    {
        this._issuesLineNumberMap.clear();
        this._clearIssueWidgets();

        let issues = WI.consoleManager.issuesForSourceCode(this._sourceCode);
        for (let issue of issues)
            this._addIssue(issue);
    }

    _reinsertAllThreadIndicators()
    {
        // Clear line styles.
        for (let lineNumber of this._threadLineNumberMap.keys())
            this.removeStyleClassFromLine(lineNumber, "thread-indicator");
        this._threadLineNumberMap.clear();

        // Clear widgets.
        for (let widget of this._threadWidgetMap.values())
            widget.clear();
        this._threadWidgetMap.clear();

        // Clear other maps.
        this._threadTargetMap.clear();

        let debuggableTargets = WI.targets;
        if (debuggableTargets.length > 1) {
            for (let target of debuggableTargets)
                this._addThreadIndicatorForTarget(target);
        }
    }

    _debuggerDidPause(event)
    {
        this._updateTokenTrackingControllerState();
        if (this._typeTokenAnnotator && this._typeTokenAnnotator.isActive())
            this._typeTokenAnnotator.refresh();
        if (this._basicBlockAnnotator && this._basicBlockAnnotator.isActive())
            this._basicBlockAnnotator.refresh();
    }

    _debuggerDidResume(event)
    {
        this._updateTokenTrackingControllerState();
        this._dismissPopover();
        if (this._typeTokenAnnotator && this._typeTokenAnnotator.isActive())
            this._typeTokenAnnotator.refresh();
        if (this._basicBlockAnnotator && this._basicBlockAnnotator.isActive())
            this._basicBlockAnnotator.refresh();
    }

    _handleFormatterDidChange(event)
    {
        if (this._ignoreAllBreakpointLocationUpdates)
            return;

        // Some breakpoints / issues may have moved, some might not have. Just go through
        // and remove and reinsert all the breakpoints / issues.

        this._removeBreakpointWidgets();

        var oldBreakpointMap = this._breakpointMap;
        this._breakpointMap = {};

        for (var lineNumber in oldBreakpointMap) {
            for (var columnNumber in oldBreakpointMap[lineNumber]) {
                var breakpoint = oldBreakpointMap[lineNumber][columnNumber];
                var newLineInfo = this._editorLineInfoForSourceCodeLocation(breakpoint.sourceCodeLocation);
                this._addBreakpointWithEditorLineInfo(breakpoint, newLineInfo);
                this.setBreakpointInfoForLineAndColumn(lineNumber, columnNumber, null);
                this.setBreakpointInfoForLineAndColumn(newLineInfo.lineNumber, newLineInfo.columnNumber, this._breakpointInfoForBreakpoint(breakpoint));
            }
        }

        this._reinsertAllIssues();
        this._reinsertAllThreadIndicators();
    }

    _sourceCodeSourceMapAdded(event)
    {
        WI.notifications.addEventListener(WI.Notification.GlobalModifierKeysDidChange, this._updateTokenTrackingControllerState, this);
        this._sourceCode.removeEventListener(WI.SourceCode.Event.SourceMapAdded, this._sourceCodeSourceMapAdded, this);

        this._updateTokenTrackingControllerState();
    }

    _updateTokenTrackingControllerState()
    {
        var mode = WI.CodeMirrorTokenTrackingController.Mode.None;
        if (WI.debuggerManager.paused)
            mode = WI.CodeMirrorTokenTrackingController.Mode.JavaScriptExpression;
        else if (this._typeTokenAnnotator && this._typeTokenAnnotator.isActive())
            mode = WI.CodeMirrorTokenTrackingController.Mode.JavaScriptTypeInformation;
        else if (this._hasColorMarkers())
            mode = WI.CodeMirrorTokenTrackingController.Mode.MarkedTokens;
        else if ((this._sourceCode instanceof WI.SourceMapResource || this._sourceCode.sourceMaps.length !== 0) && WI.modifierKeys.metaKey && !WI.modifierKeys.altKey && !WI.modifierKeys.shiftKey)
            mode = WI.CodeMirrorTokenTrackingController.Mode.NonSymbolTokens;

        this.tokenTrackingController.enabled = mode !== WI.CodeMirrorTokenTrackingController.Mode.None;

        if (mode === this.tokenTrackingController.mode)
            return;

        switch (mode) {
        case WI.CodeMirrorTokenTrackingController.Mode.MarkedTokens:
            this.tokenTrackingController.mouseOverDelayDuration = 0;
            this.tokenTrackingController.mouseOutReleaseDelayDuration = 0;
            break;
        case WI.CodeMirrorTokenTrackingController.Mode.NonSymbolTokens:
            this.tokenTrackingController.mouseOverDelayDuration = 0;
            this.tokenTrackingController.mouseOutReleaseDelayDuration = 0;
            this.tokenTrackingController.classNameForHighlightedRange = WI.CodeMirrorTokenTrackingController.JumpToSymbolHighlightStyleClassName;
            this._dismissPopover();
            break;
        case WI.CodeMirrorTokenTrackingController.Mode.JavaScriptExpression:
        case WI.CodeMirrorTokenTrackingController.Mode.JavaScriptTypeInformation:
            this.tokenTrackingController.mouseOverDelayDuration = WI.SourceCodeTextEditor.DurationToMouseOverTokenToMakeHoveredToken;
            this.tokenTrackingController.mouseOutReleaseDelayDuration = WI.SourceCodeTextEditor.DurationToMouseOutOfHoveredTokenToRelease;
            this.tokenTrackingController.classNameForHighlightedRange = WI.SourceCodeTextEditor.HoveredExpressionHighlightStyleClassName;
            break;
        }

        this.tokenTrackingController.mode = mode;
    }

    _hasColorMarkers()
    {
        for (var marker of this.markers) {
            if (marker.type === WI.TextMarker.Type.Color)
                return true;
        }
        return false;
    }

    // CodeMirrorTokenTrackingController Delegate

    tokenTrackingControllerCanReleaseHighlightedRange(tokenTrackingController, element)
    {
        if (!this._popover)
            return true;

        if (!window.getSelection().isCollapsed && this._popover.element.contains(window.getSelection().anchorNode))
            return false;

        return true;
    }

    tokenTrackingControllerHighlightedRangeReleased(tokenTrackingController, forceHide = false)
    {
        if (forceHide || !this._mouseIsOverPopover)
            this._dismissPopover();
    }

    tokenTrackingControllerHighlightedRangeWasClicked(tokenTrackingController)
    {
        if (this.tokenTrackingController.mode !== WI.CodeMirrorTokenTrackingController.Mode.NonSymbolTokens)
            return;

        // Links are handled by TextEditor.
        if (/\blink\b/.test(this.tokenTrackingController.candidate.hoveredToken.type))
            return;

        const options = {
            ignoreNetworkTab: true,
            ignoreSearchTab: true,
        };

        var sourceCodeLocation = this._sourceCodeLocationForEditorPosition(this.tokenTrackingController.candidate.hoveredTokenRange.start);
        if (this.sourceCode instanceof WI.SourceMapResource)
            WI.showOriginalOrFormattedSourceCodeLocation(sourceCodeLocation, options);
        else
            WI.showSourceCodeLocation(sourceCodeLocation, options);
    }

    tokenTrackingControllerNewHighlightCandidate(tokenTrackingController, candidate)
    {
        if (this.tokenTrackingController.mode === WI.CodeMirrorTokenTrackingController.Mode.NonSymbolTokens) {
            this.tokenTrackingController.highlightRange(candidate.hoveredTokenRange);
            return;
        }

        if (this.tokenTrackingController.mode === WI.CodeMirrorTokenTrackingController.Mode.JavaScriptExpression) {
            this._tokenTrackingControllerHighlightedJavaScriptExpression(candidate);
            return;
        }

        if (this.tokenTrackingController.mode === WI.CodeMirrorTokenTrackingController.Mode.JavaScriptTypeInformation) {
            this._tokenTrackingControllerHighlightedJavaScriptTypeInformation(candidate);
            return;
        }

        if (this.tokenTrackingController.mode === WI.CodeMirrorTokenTrackingController.Mode.MarkedTokens) {
            var markers = this.markersAtPosition(candidate.hoveredTokenRange.start);
            if (markers.length > 0)
                this._tokenTrackingControllerHighlightedMarkedExpression(candidate, markers);
            else
                this._dismissEditingController();
        }
    }

    tokenTrackingControllerMouseOutOfHoveredMarker(tokenTrackingController, hoveredMarker)
    {
        this._dismissEditingController();
    }

    _tokenTrackingControllerHighlightedJavaScriptExpression(candidate)
    {
        console.assert(candidate.expression);

        let target = WI.debuggerManager.activeCallFrame ? WI.debuggerManager.activeCallFrame.target : this.target;
        let expression = appendWebInspectorSourceURL(candidate.expression);

        function populate(error, result, wasThrown)
        {
            if (error || wasThrown)
                return;

            if (candidate !== this.tokenTrackingController.candidate)
                return;

            let data = WI.RemoteObject.fromPayload(result, target);
            switch (data.type) {
            case "function":
                this._showPopoverForFunction(data);
                break;
            case "object":
                if (data.subtype === "null" || data.subtype === "regexp")
                    this._showPopoverWithFormattedValue(data);
                else
                    this._showPopoverForObject(data);
                break;
            case "string":
            case "number":
            case "boolean":
            case "symbol":
            case "bigint":
            case "undefined":
                this._showPopoverWithFormattedValue(data);
                break;
            }
        }


        if (WI.debuggerManager.activeCallFrame) {
            target.DebuggerAgent.evaluateOnCallFrame.invoke({callFrameId: WI.debuggerManager.activeCallFrame.id, expression, objectGroup: "popover", doNotPauseOnExceptionsAndMuteConsole: true}, populate.bind(this));
            return;
        }

        // No call frame available. Use the SourceCode's page's context.
        target.RuntimeAgent.evaluate.invoke({expression, objectGroup: "popover", doNotPauseOnExceptionsAndMuteConsole: true}, populate.bind(this));
    }

    _tokenTrackingControllerHighlightedJavaScriptTypeInformation(candidate)
    {
        console.assert(candidate.expression);

        var sourceCode = this._sourceCode;
        var sourceID = sourceCode instanceof WI.Script ? sourceCode.id : sourceCode.scripts[0].id;
        var range = candidate.hoveredTokenRange;
        var offset = this.currentPositionToOriginalOffset(range.start);

        var allRequests = [{
            typeInformationDescriptor: WI.ScriptSyntaxTree.TypeProfilerSearchDescriptor.NormalExpression,
            sourceID,
            divot: offset
        }];

        function handler(error, allTypes) {
            if (error)
                return;

            if (candidate !== this.tokenTrackingController.candidate)
                return;

            console.assert(allTypes.length === 1);
            if (!allTypes.length)
                return;

            var typeDescription = WI.TypeDescription.fromPayload(allTypes[0]);
            if (typeDescription.valid) {
                var popoverTitle = WI.TypeTokenView.titleForPopover(WI.TypeTokenView.TitleType.Variable, candidate.expression);
                this.showPopoverForTypes(typeDescription, null, popoverTitle);
            }
        }

        this.target.RuntimeAgent.getRuntimeTypesForVariablesAtOffsets(allRequests, handler.bind(this));
    }

    _showPopover(content, bounds)
    {
        console.assert(this.tokenTrackingController.candidate || bounds);

        var shouldHighlightRange = false;
        var candidate = this.tokenTrackingController.candidate;
        // If bounds is falsey, this is a popover introduced from a hover event.
        // Otherwise, this is called from TypeTokenAnnotator.
        if (!bounds) {
            if (!candidate)
                return;

            var rects = this.rectsForRange(candidate.hoveredTokenRange);
            bounds = WI.Rect.unionOfRects(rects);

            if (this._popover && this._popover.visible) {
                let intersection = bounds.intersectionWithRect(this._popover.frame);
                if (intersection.size.width && intersection.size.height)
                    return;
            }

            shouldHighlightRange = true;
        }

        content.classList.add(WI.SourceCodeTextEditor.PopoverDebuggerContentStyleClassName);

        if (!this._popover) {
            this._popover = new WI.Popover(this);
            this._popover.element.addEventListener("mouseover", this._popoverMouseover.bind(this));
            this._popover.element.addEventListener("mouseout", this._popoverMouseout.bind(this));
        }

        this._popover.presentNewContentWithFrame(content, bounds.pad(5), [WI.RectEdge.MIN_Y, WI.RectEdge.MAX_Y, WI.RectEdge.MAX_X]);

        if (shouldHighlightRange)
            this.tokenTrackingController.highlightRange(candidate.expressionRange);
    }

    _showPopoverForFunction(data)
    {
        let candidate = this.tokenTrackingController.candidate;

        function didGetDetails(error, response)
        {
            if (error) {
                console.error(error);
                this._dismissPopover();
                return;
            }

            // Nothing to do if the token has changed since the time we
            // asked for the function details from the backend.
            if (candidate !== this.tokenTrackingController.candidate)
                return;

            let content = document.createElement("div");
            content.classList.add("function");

            let title = document.createElement("div");
            title.classList.add("title");
            title.textContent = response.name || response.displayName || WI.UIString("(anonymous function)");
            content.appendChild(title);

            let location = response.location;
            let sourceCode = WI.debuggerManager.scriptForIdentifier(location.scriptId, this.target);
            let sourceCodeLocation = sourceCode.createSourceCodeLocation(location.lineNumber, location.columnNumber);
            let functionSourceCodeLink = WI.createSourceCodeLocationLink(sourceCodeLocation);
            title.appendChild(functionSourceCodeLink);

            let wrapper = document.createElement("div");
            wrapper.classList.add("body");
            content.appendChild(wrapper);

            let codeMirror = WI.CodeMirrorEditor.create(wrapper, {
                mode: "text/javascript",
                readOnly: "nocursor",
            });

            const isModule = false;
            const indentString = WI.indentString();
            const includeSourceMapData = false;
            let workerProxy = WI.FormatterWorkerProxy.singleton();
            workerProxy.formatJavaScript(data.description, isModule, indentString, includeSourceMapData, ({formattedText}) => {
                if (candidate !== this.tokenTrackingController.candidate)
                    return;

                this._showPopover(content);
                codeMirror.setValue(formattedText || data.description);
                this._popover.update();

                // CodeMirror needs a refresh after the popover displays, to layout, otherwise it may appear with the wrong size.
                setTimeout(() => {
                    codeMirror.refresh();
                });
            });
        }

        data.target.DebuggerAgent.getFunctionDetails(data.objectId, didGetDetails.bind(this));
    }

    _showPopoverForObject(data)
    {
        var content = document.createElement("div");
        content.className = "object expandable";

        var titleElement = document.createElement("div");
        titleElement.className = "title";
        titleElement.textContent = data.description;
        content.appendChild(titleElement);

        if (data.subtype === "node") {
            data.pushNodeToFrontend(function(nodeId) {
                if (!nodeId)
                    return;

                var domNode = WI.domManager.nodeForId(nodeId);
                if (!domNode.ownerDocument)
                    return;

                WI.bindInteractionsForNodeToElement(domNode, titleElement, {
                    ignoreClick: true,
                });

                var goToButton = titleElement.appendChild(WI.createGoToArrowButton());
                goToButton.addEventListener("click", function() {
                    WI.domManager.inspectElement(nodeId, {
                        initiatorHint: WI.TabBrowser.TabNavigationInitiator.LinkClick,
                    });
                });
            });
        }

        // FIXME: If this is a variable, it would be nice to put the variable name in the PropertyPath.
        var objectTree = new WI.ObjectTreeView(data);
        objectTree.showOnlyProperties();
        objectTree.expand();

        var bodyElement = content.appendChild(document.createElement("div"));
        bodyElement.className = "body";
        bodyElement.appendChild(objectTree.element);

        // Show the popover once we have the first set of properties for the object.
        var candidate = this.tokenTrackingController.candidate;
        objectTree.singleFireEventListener(WI.ObjectTreeView.Event.Updated, function(event) {
            if (candidate === this.tokenTrackingController.candidate)
                this._showPopover(content);
        }, this);
    }

    _showPopoverWithFormattedValue(remoteObject)
    {
        let wrapper = document.createElement("div");
        wrapper.className = "formatted";
        wrapper.appendChild(WI.FormattedValue.createElementForRemoteObject(remoteObject));
        this._showPopover(wrapper);
    }

    willDismissPopover(popover)
    {
        this.tokenTrackingController.removeHighlightedRange();

        this.target.RuntimeAgent.releaseObjectGroup("popover");
    }

    _dismissPopover()
    {
        if (!this._popover)
            return;

        this._popover.dismiss();
    }

    _popoverMouseover(event)
    {
        this._mouseIsOverPopover = true;
    }

    _popoverMouseout(event)
    {
        this._mouseIsOverPopover = this._popover.element.contains(event.relatedTarget);
    }

    _hasStyleSheetContents()
    {
        let mimeType = this.mimeType;
        return mimeType === "text/css"
            || mimeType === "text/x-less"
            || mimeType === "text/x-sass"
            || mimeType === "text/x-scss";
    }

    _updateEditableMarkers(range)
    {
        if (this._hasStyleSheetContents()) {
            this.createColorMarkers(range);
            this.createGradientMarkers(range);
            this.createCubicBezierTimingFunctionMarkers(range);
            this.createLinearTimingFunctionMarkers(range);
            this.createSpringTimingFunctionMarkers(range);
            this.createStepsTimingFunctionMarkers(range);
        }

        this._updateTokenTrackingControllerState();
    }

    _tokenTrackingControllerHighlightedMarkedExpression(candidate, markers)
    {
        // Look for the outermost editable marker.
        var editableMarker;
        for (var marker of markers) {
            if (!marker.range || !Object.values(WI.TextMarker.Type).includes(marker.type))
                continue;

            if (!editableMarker || (marker.range.startLine < editableMarker.range.startLine || (marker.range.startLine === editableMarker.range.startLine && marker.range.startColumn < editableMarker.range.startColumn)))
                editableMarker = marker;
        }

        if (!editableMarker) {
            this.tokenTrackingController.hoveredMarker = null;
            return;
        }

        if (this.tokenTrackingController.hoveredMarker === editableMarker)
            return;

        this._dismissEditingController();

        this.tokenTrackingController.hoveredMarker = editableMarker;

        this._editingController = this.editingControllerForMarker(editableMarker);

        if (marker.type === WI.TextMarker.Type.Color) {
            var color = this._editingController.value;
            if (!color || !color.valid) {
                editableMarker.clear();
                this._editingController = null;
                return;
            }
        }

        this._editingController.delegate = this;
        this._editingController.presentHoverMenu();
    }

    _dismissEditingController(discrete)
    {
        if (this._editingController)
            this._editingController.dismissHoverMenu(discrete);

        this.tokenTrackingController.hoveredMarker = null;
        this._editingController = null;
    }

    // CodeMirrorEditingController Delegate

    editingControllerDidStartEditing(editingController)
    {
        // We can pause the token tracking controller during editing, it will be reset
        // to the expected state by calling _updateEditableMarkers() in the
        // editingControllerDidFinishEditing delegate.
        this.tokenTrackingController.enabled = false;

        // We clear the marker since we'll reset it after editing.
        editingController.marker.clear();

        // We ignore content changes made as a result of color editing.
        this._ignoreContentDidChange++;
    }

    editingControllerDidFinishEditing(editingController)
    {
        this._updateEditableMarkers(editingController.range);

        this._ignoreContentDidChange--;

        this._editingController = null;
    }

    _setTypeTokenAnnotatorEnabledState(shouldActivate)
    {
        if (!this._typeTokenAnnotator)
            return;

        if (shouldActivate) {
            console.assert(this.isAttached, "Annotators should not be enabled if the TextEditor is not visible");

            this._typeTokenAnnotator.reset();

            if (!this._typeTokenScrollHandler)
                this._enableScrollEventsForTypeTokenAnnotator();
        } else {
            this._typeTokenAnnotator.clear();

            if (this._typeTokenScrollHandler)
                this._disableScrollEventsForTypeTokenAnnotator();
        }

        WI.settings.showJavaScriptTypeInformation.value = shouldActivate;

        this._updateTokenTrackingControllerState();
    }

    set _basicBlockAnnotatorEnabled(shouldActivate)
    {
        if (!this._basicBlockAnnotator)
            return;

        if (shouldActivate) {
            console.assert(this.isAttached, "Annotators should not be enabled if the TextEditor is not visible");

            console.assert(!this._basicBlockAnnotator.isActive());
            this._basicBlockAnnotator.reset();

            if (!this._controlFlowScrollHandler)
                this._enableScrollEventsForControlFlowAnnotator();
        } else {
            this._basicBlockAnnotator.clear();

            if (this._controlFlowScrollHandler)
                this._disableScrollEventsForControlFlowAnnotator();
        }

        WI.settings.enableControlFlowProfiler.value = shouldActivate;
    }

    _getAssociatedScript(position)
    {
        let script = null;

        if (this._sourceCode instanceof WI.Script)
            script = this._sourceCode;
        else if (this._sourceCode instanceof WI.Resource && this._sourceCode.scripts.length) {
            if (this._sourceCode.type === WI.Resource.Type.Script)
                script = this._sourceCode.scripts[0];
            else if (this._sourceCode.type === WI.Resource.Type.Document && position) {
                for (let inlineScript of this._sourceCode.scripts) {
                    if (inlineScript.range.contains(position.lineNumber, position.columnNumber)) {
                        if (isNaN(inlineScript.range.startOffset))
                            inlineScript.range.resolveOffsets(this._sourceCode.content);
                        script = inlineScript;
                        break;
                    }
                }
            }
        }

        return script;
    }

    _createTypeTokenAnnotator()
    {
        var script = this._getAssociatedScript();
        if (!script)
            return;

        this._typeTokenAnnotator = new WI.TypeTokenAnnotator(this, script);
    }

    _createBasicBlockAnnotator()
    {
        var script = this._getAssociatedScript();
        if (!script)
            return;

        this._basicBlockAnnotator = new WI.BasicBlockAnnotator(this, script);
    }

    _enableScrollEventsForTypeTokenAnnotator()
    {
        // Pause updating type tokens while scrolling to prevent frame loss.
        console.assert(!this._typeTokenScrollHandler);
        this._typeTokenScrollHandler = this._createTypeTokenScrollEventHandler();
        this.addScrollHandler(this._typeTokenScrollHandler);
    }

    _enableScrollEventsForControlFlowAnnotator()
    {
        console.assert(!this._controlFlowScrollHandler);
        this._controlFlowScrollHandler = this._createControlFlowScrollEventHandler();
        this.addScrollHandler(this._controlFlowScrollHandler);
    }

    _disableScrollEventsForTypeTokenAnnotator()
    {
        console.assert(this._typeTokenScrollHandler);
        this.removeScrollHandler(this._typeTokenScrollHandler);
        this._typeTokenScrollHandler = null;
    }

    _disableScrollEventsForControlFlowAnnotator()
    {
        console.assert(this._controlFlowScrollHandler);
        this.removeScrollHandler(this._controlFlowScrollHandler);
        this._controlFlowScrollHandler = null;
    }

    _createTypeTokenScrollEventHandler()
    {
        let timeoutIdentifier = null;
        let scrollHandler = () => {
            if (timeoutIdentifier)
                clearTimeout(timeoutIdentifier);
            else {
                if (this._typeTokenAnnotator)
                    this._typeTokenAnnotator.pause();
            }

            timeoutIdentifier = setTimeout(() => {
                timeoutIdentifier = null;
                if (this._typeTokenAnnotator)
                    this._typeTokenAnnotator.resume();
            }, WI.SourceCodeTextEditor.DurationToUpdateTypeTokensAfterScrolling);
        };

        return scrollHandler;
    }

    _createControlFlowScrollEventHandler()
    {
        let timeoutIdentifier = null;
        let scrollHandler = () => {
            if (timeoutIdentifier)
                clearTimeout(timeoutIdentifier);
            else if (this._basicBlockAnnotator)
                this._basicBlockAnnotator.pause();

            timeoutIdentifier = setTimeout(() => {
                timeoutIdentifier = null;
                if (this._basicBlockAnnotator)
                    this._basicBlockAnnotator.resume();
            }, WI.SourceCodeTextEditor.DurationToUpdateTypeTokensAfterScrolling);
        };

        return scrollHandler;
    }

    _logCleared(event)
    {
        for (let lineNumber of this._issuesLineNumberMap.keys()) {
            this.removeStyleClassFromLine(lineNumber, WI.SourceCodeTextEditor.LineErrorStyleClassName);
            this.removeStyleClassFromLine(lineNumber, WI.SourceCodeTextEditor.LineWarningStyleClassName);
        }

        this._issuesLineNumberMap.clear();
        this._clearIssueWidgets();
    }
};

WI.SourceCodeTextEditor.LineErrorStyleClassName = "error";
WI.SourceCodeTextEditor.LineWarningStyleClassName = "warning";
WI.SourceCodeTextEditor.PopoverDebuggerContentStyleClassName = "debugger-popover-content";
WI.SourceCodeTextEditor.HoveredExpressionHighlightStyleClassName = "hovered-expression-highlight";
WI.SourceCodeTextEditor.DurationToMouseOverTokenToMakeHoveredToken = 500;
WI.SourceCodeTextEditor.DurationToMouseOutOfHoveredTokenToRelease = 1000;
WI.SourceCodeTextEditor.DurationToUpdateTypeTokensAfterScrolling = 100;
WI.SourceCodeTextEditor.WidgetContainsMultipleIssuesSymbol = Symbol("source-code-widget-contains-multiple-issues");
WI.SourceCodeTextEditor.WidgetContainsMultipleThreadsSymbol = Symbol("source-code-widget-contains-multiple-threads");

WI.SourceCodeTextEditor.Event = {
    ContentWillPopulate: "source-code-text-editor-content-will-populate",
    ContentDidPopulate: "source-code-text-editor-content-did-populate"
};
