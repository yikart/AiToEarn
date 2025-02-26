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

WI.ConsolePrompt = class ConsolePrompt extends WI.View
{
    constructor(delegate, mimeType)
    {
        super();

        mimeType = parseMIMEType(mimeType).type;

        this.element.classList.add("console-prompt", WI.SyntaxHighlightedStyleClassName);

        this.element.appendChild(WI.ImageUtilities.useSVGSymbol("Images/UserInputPrompt.svg", "glyph"));

        this._delegate = delegate || null;

        this._codeMirror = WI.CodeMirrorEditor.create(this.element, {
            lineWrapping: true,
            mode: {name: mimeType, globalVars: true},
            matchBrackets: true
        });

        var keyMap = {
            "Up": this._handlePreviousKey.bind(this),
            "Down": this._handleNextKey.bind(this),
            "Ctrl-P": this._handlePreviousKey.bind(this),
            "Ctrl-N": this._handleNextKey.bind(this),
            "Enter": this._handleEnterKey.bind(this),
            "Cmd-Enter": this._handleCommandEnterKey.bind(this),
            "Tab": this._handleTabKey.bind(this),
            "Esc": this._handleEscapeKey.bind(this)
        };

        this._codeMirror.addKeyMap(keyMap);

        this._completionController = new WI.CodeMirrorCompletionController(WI.CodeMirrorCompletionController.Mode.PausedConsoleCommandLineAPI, this._codeMirror, this);
        this._completionController.addExtendedCompletionProvider("javascript", WI.javaScriptRuntimeCompletionProvider);

        let textarea = this._codeMirror.getInputField();
        if (textarea)
            textarea.ariaLabel = WI.UIString("Console prompt");

        this._history = [{}];
        this._historyIndex = 0;
    }

    // Public

    get delegate()
    {
        return this._delegate;
    }

    set delegate(delegate)
    {
        this._delegate = delegate || null;
    }

    set escapeKeyHandlerWhenEmpty(handler)
    {
        this._escapeKeyHandlerWhenEmpty = handler;
    }

    get text()
    {
        return this._codeMirror.getValue();
    }

    set text(text)
    {
        this._codeMirror.setValue(text || "");
        this._codeMirror.clearHistory();
        this._codeMirror.markClean();
    }

    get history()
    {
        this._history[this._historyIndex] = this._historyEntryForCurrentText();
        return this._history;
    }

    set history(history)
    {
        this._history = history instanceof Array ? history.slice(0, WI.ConsolePrompt.MaximumHistorySize) : [{}];
        this._historyIndex = 0;
        this._restoreHistoryEntry(0);
    }

    get focused()
    {
        return this._codeMirror.getWrapperElement().classList.contains("CodeMirror-focused");
    }

    focus()
    {
        this._codeMirror.focus();
    }

    updateCompletions(completions, implicitSuffix)
    {
        this._completionController.updateCompletions(completions, implicitSuffix);
    }

    pushHistoryItem(text)
    {
        this._commitHistoryEntry({text});
    }

    // Protected

    completionControllerCompletionsNeeded(completionController, prefix, defaultCompletions, base, suffix, forced)
    {
        if (this.delegate && typeof this.delegate.consolePromptCompletionsNeeded === "function")
            this.delegate.consolePromptCompletionsNeeded(this, defaultCompletions, base, prefix, suffix, forced);
        else
            this._completionController.updateCompletions(defaultCompletions);
    }

    completionControllerShouldAllowEscapeCompletion(completionController)
    {
        // Only allow escape to complete if there is text in the prompt. Otherwise allow it to pass through
        // so escape to toggle the quick console still works.
        return !!this.text;
    }

    sizeDidChange()
    {
        super.sizeDidChange();

        if (this.text)
            this._codeMirror.refresh();
    }

    // Private

    _handleTabKey(codeMirror)
    {
        var cursor = codeMirror.getCursor();
        var line = codeMirror.getLine(cursor.line);

        if (!line.trim().length)
            return CodeMirror.Pass;

        var firstNonSpace = line.search(/[^\s]/);

        if (cursor.ch <= firstNonSpace)
            return CodeMirror.Pass;

        this._completionController.completeAtCurrentPositionIfNeeded().then(function(result) {
            if (result === WI.CodeMirrorCompletionController.UpdatePromise.NoCompletionsFound)
                InspectorFrontendHost.beep();
        });
    }

    _handleEscapeKey(codeMirror)
    {
        if (this.text)
            return CodeMirror.Pass;

        if (!this._escapeKeyHandlerWhenEmpty)
            return CodeMirror.Pass;

        this._escapeKeyHandlerWhenEmpty();
    }

    _handlePreviousKey(codeMirror)
    {
        if (this._codeMirror.somethingSelected())
            return CodeMirror.Pass;

        // Pass unless we are on the first line.
        if (this._codeMirror.getCursor().line)
            return CodeMirror.Pass;

        var historyEntry = this._history[this._historyIndex + 1];
        if (!historyEntry)
            return CodeMirror.Pass;

        this._rememberCurrentTextInHistory();

        ++this._historyIndex;

        this._restoreHistoryEntry(this._historyIndex);
    }

    _handleNextKey(codeMirror)
    {
        if (this._codeMirror.somethingSelected())
            return CodeMirror.Pass;

        // Pass unless we are on the last line.
        if (this._codeMirror.getCursor().line !== this._codeMirror.lastLine())
            return CodeMirror.Pass;

        var historyEntry = this._history[this._historyIndex - 1];
        if (!historyEntry)
            return CodeMirror.Pass;

        this._rememberCurrentTextInHistory();

        --this._historyIndex;

        this._restoreHistoryEntry(this._historyIndex);
    }

    _handleEnterKey(codeMirror, forceCommit, keepCurrentText)
    {
        var currentText = this.text;

        // Always do nothing when there is just whitespace.
        if (!currentText.trim())
            return;

        var cursor = this._codeMirror.getCursor();
        var lastLine = this._codeMirror.lastLine();
        var lastLineLength = this._codeMirror.getLine(lastLine).length;
        var cursorIsAtLastPosition = positionsEqual(cursor, {line: lastLine, ch: lastLineLength});

        function positionsEqual(a, b)
        {
            console.assert(a);
            console.assert(b);
            return a.line === b.line && a.ch === b.ch;
        }

        function commitTextOrInsertNewLine(commit)
        {
            if (!commit) {
                // Only insert a new line if the previous cursor and the current cursor are in the same position.
                if (positionsEqual(cursor, this._codeMirror.getCursor()))
                    CodeMirror.commands.newlineAndIndent(this._codeMirror);
                return;
            }

            this._commitHistoryEntry(this._historyEntryForCurrentText());

            if (!keepCurrentText) {
                this._codeMirror.setValue("");
                this._codeMirror.clearHistory();
            }

            if (this.delegate && typeof this.delegate.consolePromptHistoryDidChange === "function")
                this.delegate.consolePromptHistoryDidChange(this);

            if (this.delegate && typeof this.delegate.consolePromptTextCommitted === "function")
                this.delegate.consolePromptTextCommitted(this, currentText);
        }

        if (!forceCommit && this.delegate && typeof this.delegate.consolePromptShouldCommitText === "function") {
            this.delegate.consolePromptShouldCommitText(this, currentText, cursorIsAtLastPosition, commitTextOrInsertNewLine.bind(this));
            return;
        }

        commitTextOrInsertNewLine.call(this, true);
    }

    _commitHistoryEntry(historyEntry)
    {
        // Replace the previous entry if it does not have text or if the text is the same.
        if (this._history[1] && (!this._history[1].text || this._history[1].text === historyEntry.text)) {
            this._history[1] = historyEntry;
            this._history[0] = {};
        } else {
            // Replace the first history entry and push a new empty one.
            this._history[0] = historyEntry;
            this._history.unshift({});

            // Trim the history length if needed.
            if (this._history.length > WI.ConsolePrompt.MaximumHistorySize)
                this._history = this._history.slice(0, WI.ConsolePrompt.MaximumHistorySize);
        }

        this._historyIndex = 0;
    }

    _handleCommandEnterKey(codeMirror)
    {
        this._handleEnterKey(codeMirror, true, true);
    }

    _restoreHistoryEntry(index)
    {
        var historyEntry = this._history[index];

        this._codeMirror.setValue(historyEntry.text || "");

        if (historyEntry.undoHistory)
            this._codeMirror.setHistory(historyEntry.undoHistory);
        else
            this._codeMirror.clearHistory();

        this._codeMirror.setCursor(historyEntry.cursor || {line: 0});
    }

    _historyEntryForCurrentText()
    {
        return {text: this.text, undoHistory: this._codeMirror.getHistory(), cursor: this._codeMirror.getCursor()};
    }

    _rememberCurrentTextInHistory()
    {
        this._history[this._historyIndex] = this._historyEntryForCurrentText();

        if (this.delegate && typeof this.delegate.consolePromptHistoryDidChange === "function")
            this.delegate.consolePromptHistoryDidChange(this);
    }
};

WI.ConsolePrompt.MaximumHistorySize = 30;
