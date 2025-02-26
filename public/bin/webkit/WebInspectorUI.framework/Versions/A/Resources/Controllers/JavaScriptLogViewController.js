/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
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

WI.JavaScriptLogViewController = class JavaScriptLogViewController extends WI.Object
{
    constructor(element, scrollElement, textPrompt, delegate, historySettingIdentifier)
    {
        super();

        console.assert(textPrompt instanceof WI.ConsolePrompt);
        console.assert(historySettingIdentifier);

        this._element = element;
        this._scrollElement = scrollElement;

        this._promptHistorySetting = new WI.Setting(historySettingIdentifier, null);

        this._prompt = textPrompt;
        this._prompt.delegate = this;
        this._prompt.history = this._promptHistorySetting.value;

        this.delegate = delegate;

        this._cleared = true;
        this._previousMessageView = null;
        this._lastCommitted = {text: "", special: false};
        this._repeatCountWasInterrupted = false;

        this._sessions = [];
        this._currentSessionOrGroup = null;

        this._failedSourceMapsGroup = null;

        this.messagesAlternateClearKeyboardShortcut = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.Control, "L", this.requestClearMessages.bind(this), this._element);

        this._messagesFindNextKeyboardShortcut = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.CommandOrControl, "G", this._handleFindNextShortcut.bind(this), this._element);
        this._messagesFindPreviousKeyboardShortcut = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.CommandOrControl | WI.KeyboardShortcut.Modifier.Shift, "G", this._handleFindPreviousShortcut.bind(this), this._element);

        this._promptAlternateClearKeyboardShortcut = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.Control, "L", this.requestClearMessages.bind(this), this._prompt.element);
        this._promptFindNextKeyboardShortcut = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.CommandOrControl, "G", this._handleFindNextShortcut.bind(this), this._prompt.element);
        this._promptFindPreviousKeyboardShortcut = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.CommandOrControl | WI.KeyboardShortcut.Modifier.Shift, "G", this._handleFindPreviousShortcut.bind(this), this._prompt.element);

        WI.settings.showConsoleMessageTimestamps.addEventListener(WI.Setting.Event.Changed, this._handleShowConsoleMessageTimestampsSettingChanged, this);

        this._pendingMessagesForSessionOrGroup = new Map;
        this._scheduledRenderIdentifier = 0;

        this._consoleMessageViews = [];
        this._showTimestamps = WI.settings.showConsoleMessageTimestamps.value;

        this.startNewSession();
    }

    // Public

    clear()
    {
        this._cleared = true;

        const clearPreviousSessions = true;
        this.startNewSession(clearPreviousSessions, {newSessionReason: WI.ConsoleSession.NewSessionReason.ConsoleCleared});
    }

    startNewSession(clearPreviousSessions = false, data = {})
    {
        if (clearPreviousSessions) {
            this._pendingMessagesForSessionOrGroup.clear();

            if (this._sessions.length) {
                for (let session of this._sessions)
                    session.element.remove();

                this._sessions = [];
                this._currentSessionOrGroup = null;
            }
        }

        // First session shows the time when the console was opened.
        if (!this._sessions.length)
            data.timestamp = Date.now();

        let lastSession = this._sessions.lastValue;

        // Remove empty session.
        if (lastSession && !lastSession.hasMessages() && !this._pendingMessagesForSessionOrGroup.has(lastSession)) {
            this._sessions.pop();
            lastSession.element.remove();
        }

        let consoleSession = new WI.ConsoleSession(data);

        this._previousMessageView = null;
        this._lastCommitted = {text: "", special: false};
        this._repeatCountWasInterrupted = false;

        this._sessions.push(consoleSession);
        this._currentSessionOrGroup = consoleSession;

        this._failedSourceMapsGroup = null;

        this._element.appendChild(consoleSession.element);

        // Make sure the new session is visible.
        consoleSession.element.scrollIntoView();
    }

    appendImmediateExecutionWithResult(text, result, {addSpecialUserLogClass, shouldRevealConsole, handleClick} = {})
    {
        console.assert(result instanceof WI.RemoteObject);

        if (this._lastCommitted.text !== text || this._lastCommitted.special !== addSpecialUserLogClass) {
            let classNames = [];
            if (addSpecialUserLogClass)
                classNames.push("special-user-log");

            let commandMessageView = new WI.ConsoleCommandView(text, {classNames, handleClick});
            this._appendConsoleMessageView(commandMessageView, true);
            this._lastCommitted = {text, special: addSpecialUserLogClass};
        }

        function saveResultCallback(savedResultIndex)
        {
            let commandResultMessage = new WI.ConsoleCommandResultMessage(result.target, result, false, savedResultIndex, { shouldRevealConsole });
            let commandResultMessageView = new WI.ConsoleMessageView(commandResultMessage);
            this._appendConsoleMessageView(commandResultMessageView, true);
        }

        WI.runtimeManager.saveResult(result, saveResultCallback.bind(this));
    }

    appendConsoleMessage(consoleMessage)
    {
        var consoleMessageView = new WI.ConsoleMessageView(consoleMessage);
        this._appendConsoleMessageView(consoleMessageView);
        return consoleMessageView;
    }

    updatePreviousMessageRepeatCount(count, timestamp)
    {
        console.assert(this._previousMessageView);
        if (!this._previousMessageView)
            return false;

        var previousIgnoredCount = this._previousMessageView[WI.JavaScriptLogViewController.IgnoredRepeatCount] || 0;
        var previousVisibleCount = this._previousMessageView.repeatCount;

        if (!this._repeatCountWasInterrupted) {
            this._previousMessageView.repeatCount = count - previousIgnoredCount;
            this._previousMessageView.timestamp = timestamp;
            return true;
        }

        var consoleMessage = this._previousMessageView.message;
        var duplicatedConsoleMessageView = new WI.ConsoleMessageView(consoleMessage);
        duplicatedConsoleMessageView[WI.JavaScriptLogViewController.IgnoredRepeatCount] = previousIgnoredCount + previousVisibleCount;
        duplicatedConsoleMessageView.repeatCount = 1;
        duplicatedConsoleMessageView.timestamp = timestamp;
        this._appendConsoleMessageView(duplicatedConsoleMessageView);

        return true;
    }

    isScrolledToBottom()
    {
        // Lie about being scrolled to the bottom if we have a pending request to scroll to the bottom soon.
        return this._scrollToBottomTimeout || this._scrollElement.isScrolledToBottom();
    }

    scrollToBottom()
    {
        if (this._scrollToBottomTimeout)
            return;

        function delayedWork()
        {
            this._scrollToBottomTimeout = null;
            this._scrollElement.scrollTop = this._scrollElement.scrollHeight;
        }

        // Don't scroll immediately so we are not causing excessive layouts when there
        // are many messages being added at once.
        this._scrollToBottomTimeout = setTimeout(delayedWork.bind(this), 0);
    }

    requestClearMessages()
    {
        WI.consoleManager.requestClearMessages();
    }

    // Protected

    consolePromptHistoryDidChange(prompt)
    {
        this._promptHistorySetting.value = this._prompt.history;
    }

    consolePromptShouldCommitText(prompt, text, cursorIsAtLastPosition, handler)
    {
        // Always commit the text if we are not at the last position.
        if (!cursorIsAtLastPosition) {
            handler(true);
            return;
        }

        function parseFinished(error, result, message, range)
        {
            handler(result !== InspectorBackend.Enum.Runtime.SyntaxErrorType.Recoverable);
        }

        WI.runtimeManager.activeExecutionContext.target.RuntimeAgent.parse(text, parseFinished.bind(this));
    }

    consolePromptTextCommitted(prompt, text)
    {
        console.assert(text);

        if (this._lastCommitted.text !== text || this._lastCommitted.special) {
            let commandMessageView = new WI.ConsoleCommandView(text);
            this._appendConsoleMessageView(commandMessageView, true);
            this._lastCommitted = {text, special: false};
        }

        function printResult(result, wasThrown, savedResultIndex)
        {
            if (!result || this._cleared)
                return;

            let commandResultMessage = new WI.ConsoleCommandResultMessage(result.target, result, wasThrown, savedResultIndex, { shouldRevealConsole: true });
            let commandResultMessageView = new WI.ConsoleMessageView(commandResultMessage);
            this._appendConsoleMessageView(commandResultMessageView, true);
        }

        let options = {
            objectGroup: WI.RuntimeManager.ConsoleObjectGroup,
            includeCommandLineAPI: true,
            doNotPauseOnExceptionsAndMuteConsole: false,
            returnByValue: false,
            generatePreview: true,
            saveResult: true,
            emulateUserGesture: WI.settings.emulateInUserGesture.value,
            sourceURLAppender: appendWebInspectorConsoleEvaluationSourceURL,
        };

        WI.javaScriptRuntimeCompletionProvider.clearCachedPropertyNames();

        WI.runtimeManager.evaluateInInspectedWindow(text, options, printResult.bind(this));
    }

    // Private

    _handleFindNextShortcut()
    {
        this.delegate.highlightNextSearchMatch();
    }

    _handleFindPreviousShortcut()
    {
        this.delegate.highlightPreviousSearchMatch();
    }

    _appendConsoleMessageView(messageView, repeatCountWasInterrupted)
    {
        let pendingMessagesForSession = this._pendingMessagesForSessionOrGroup.get(this._currentSessionOrGroup);
        if (!pendingMessagesForSession) {
            pendingMessagesForSession = [];
            this._pendingMessagesForSessionOrGroup.set(this._currentSessionOrGroup, pendingMessagesForSession);
        }
        pendingMessagesForSession.push(messageView);
        this._consoleMessageViews.push(messageView);

        this._cleared = false;
        this._repeatCountWasInterrupted = repeatCountWasInterrupted || false;

        if (!repeatCountWasInterrupted)
            this._previousMessageView = messageView;

        if (messageView.message && messageView.message.source !== WI.ConsoleMessage.MessageSource.JS)
            this._lastCommitted = {test: "", special: false};

        if (WI.consoleContentView.isAttached)
            this.renderPendingMessagesSoon();

        if (!WI.isShowingConsoleTab() && messageView.message && messageView.message.shouldRevealConsole)
            WI.showSplitConsole();
    }

    renderPendingMessages()
    {
        if (this._scheduledRenderIdentifier) {
            cancelAnimationFrame(this._scheduledRenderIdentifier);
            this._scheduledRenderIdentifier = 0;
        }

        if (!this._pendingMessagesForSessionOrGroup.size)
            return;

        let wasScrolledToBottom = this.isScrolledToBottom();
        let savedCurrentConsoleGroup = this._currentSessionOrGroup;
        let lastMessageView = null;

        const maxMessagesPerFrame = 100;
        let renderedMessages = 0;
        for (let [session, messages] of this._pendingMessagesForSessionOrGroup) {
            this._currentSessionOrGroup = session;

            let messagesToRender = messages.splice(0, maxMessagesPerFrame - renderedMessages);
            for (let message of messagesToRender) {
                message.render();
                this._didRenderConsoleMessageView(message);
            }

            lastMessageView = messagesToRender.lastValue;

            if (!messages.length)
                this._pendingMessagesForSessionOrGroup.delete(session);

            renderedMessages += messagesToRender.length;
            if (renderedMessages >= maxMessagesPerFrame)
                break;
        }

        this._currentSessionOrGroup = savedCurrentConsoleGroup;

        this._currentSessionOrGroup.element.classList.toggle("timestamps-visible", this._showTimestamps);

        if (wasScrolledToBottom || lastMessageView instanceof WI.ConsoleCommandView || lastMessageView.message.type === WI.ConsoleMessage.MessageType.Result || lastMessageView.message.type === WI.ConsoleMessage.MessageType.Image)
            this.scrollToBottom();

        WI.quickConsole.needsLayout();

        if (this._pendingMessagesForSessionOrGroup.size)
            this.renderPendingMessagesSoon();
    }

    renderPendingMessagesSoon()
    {
        if (this._scheduledRenderIdentifier)
            return;

        this._scheduledRenderIdentifier = requestAnimationFrame(() => this.renderPendingMessages());
    }

    _didRenderConsoleMessageView(messageView)
    {
        var type = messageView instanceof WI.ConsoleCommandView ? null : messageView.message.type;
        if (type === WI.ConsoleMessage.MessageType.EndGroup) {
            var parentGroup = this._currentSessionOrGroup.parentGroup;
            if (parentGroup)
                this._currentSessionOrGroup = parentGroup;
        } else {
            if (type === WI.ConsoleMessage.MessageType.StartGroup || type === WI.ConsoleMessage.MessageType.StartGroupCollapsed) {
                var group = new WI.ConsoleGroup(this._currentSessionOrGroup);
                var groupElement = group.render(messageView);
                this._currentSessionOrGroup.append(groupElement);
                this._currentSessionOrGroup = group;
            } else
                this._currentSessionOrGroup.addMessageView(messageView);
            
            // FIXME: <https://webkit.org/b/264490> (Improve failed SourceMap error grouping to avoid unnecessary work)
            if (WI.settings.experimentalGroupSourceMapErrors.value && WI.consoleManager.failedSourceMapConsoleMessages.has(messageView.message))
                this._addConsoleMessageToConsoleSourceMapErrorGroup(messageView);
        }

        if (this.delegate && typeof this.delegate.didAppendConsoleMessageView === "function")
            this.delegate.didAppendConsoleMessageView(messageView);
    }
    
    _addConsoleMessageToConsoleSourceMapErrorGroup(messageView)
    {
        if (!this._firstSourceMapErrorMessageView) {
            this._firstSourceMapErrorMessageView = messageView;
            return;
        }
        
        if (!this._failedSourceMapsGroup) {
            let currentTopLevelSession = this._sessions.lastValue;
            this._failedSourceMapsGroup = new WI.ConsoleSourceMapMessageGroup;
            currentTopLevelSession.append(this._failedSourceMapsGroup.element);
            this._failedSourceMapsGroup.addMessageView(this._firstSourceMapErrorMessageView);
        }

        this._failedSourceMapsGroup.addMessageView(messageView);
    }

    _handleShowConsoleMessageTimestampsSettingChanged()
    {
        this._showTimestamps = WI.settings.showConsoleMessageTimestamps.value;
        this._currentSessionOrGroup.element.classList.toggle("timestamps-visible", this._showTimestamps);
        if (this._showTimestamps) {
            for (let consoleMessageView of this._consoleMessageViews) {
                if (consoleMessageView instanceof WI.ConsoleMessageView)
                    consoleMessageView.renderTimestamp();
            }
        }
    }
};

WI.JavaScriptLogViewController.CachedPropertiesDuration = 30_000;
WI.JavaScriptLogViewController.IgnoredRepeatCount = Symbol("ignored-repeat-count");
