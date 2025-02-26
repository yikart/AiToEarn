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

WI.CodeMirrorTokenTrackingController = class CodeMirrorTokenTrackingController extends WI.Object
{
    constructor(codeMirror, delegate)
    {
        super();

        console.assert(codeMirror);

        this._codeMirror = codeMirror;
        this._delegate = delegate || null;
        this._mode = WI.CodeMirrorTokenTrackingController.Mode.None;

        this._mouseOverDelayDuration = 0;
        this._mouseOutReleaseDelayDuration = 0;
        this._classNameForHighlightedRange = null;

        this._enabled = false;
        this._tracking = false;
        this._previousTokenInfo = null;
        this._hoveredMarker = null;
        this._ignoreNextMouseMove = false;

        const hidePopover = this._hidePopover.bind(this);

        this._codeMirror.addKeyMap({
            "Cmd-Enter": this._handleCommandEnterKey.bind(this),
            "Esc": hidePopover
        });

        this._codeMirror.on("cursorActivity", hidePopover);
    }

    // Public

    get delegate()
    {
        return this._delegate;
    }

    set delegate(x)
    {
        this._delegate = x;
    }

    get enabled()
    {
        return this._enabled;
    }

    set enabled(enabled)
    {
        if (this._enabled === enabled)
            return;

        this._enabled = enabled;

        var wrapper = this._codeMirror.getWrapperElement();
        if (enabled) {
            wrapper.addEventListener("mouseenter", this);
            wrapper.addEventListener("mouseleave", this);
            this._updateHoveredTokenInfo({left: WI.mouseCoords.x, top: WI.mouseCoords.y});
            this._startTracking();
        } else {
            wrapper.removeEventListener("mouseenter", this);
            wrapper.removeEventListener("mouseleave", this);
            this._stopTracking();
        }
    }

    get mode()
    {
        return this._mode;
    }

    set mode(mode)
    {
        var oldMode = this._mode;

        this._mode = mode || WI.CodeMirrorTokenTrackingController.Mode.None;

        if (oldMode !== this._mode && this._tracking && this._previousTokenInfo)
            this._processNewHoveredToken(this._previousTokenInfo);
    }

    get mouseOverDelayDuration()
    {
        return this._mouseOverDelayDuration;
    }

    set mouseOverDelayDuration(x)
    {
        console.assert(x >= 0);
        this._mouseOverDelayDuration = Math.max(x, 0);
    }

    get mouseOutReleaseDelayDuration()
    {
        return this._mouseOutReleaseDelayDuration;
    }

    set mouseOutReleaseDelayDuration(x)
    {
        console.assert(x >= 0);
        this._mouseOutReleaseDelayDuration = Math.max(x, 0);
    }

    get classNameForHighlightedRange()
    {
        return this._classNameForHighlightedRange;
    }

    set classNameForHighlightedRange(x)
    {
        this._classNameForHighlightedRange = x || null;
    }

    get candidate()
    {
        return this._candidate;
    }

    get hoveredMarker()
    {
        return this._hoveredMarker;
    }

    set hoveredMarker(hoveredMarker)
    {
        this._hoveredMarker = hoveredMarker;
    }

    highlightLastHoveredRange()
    {
        if (this._candidate)
            this.highlightRange(this._candidate.hoveredTokenRange);
    }

    highlightRange(range)
    {
        // Nothing to do if we're trying to highlight the same range.
        if (this._codeMirrorMarkedText && this._codeMirrorMarkedText.className === this._classNameForHighlightedRange) {
            var highlightedRange = this._codeMirrorMarkedText.find();
            if (!highlightedRange)
                return;
            if (WI.compareCodeMirrorPositions(highlightedRange.from, range.start) === 0 &&
                WI.compareCodeMirrorPositions(highlightedRange.to, range.end) === 0)
                return;
        }

        this.removeHighlightedRange();

        var className = this._classNameForHighlightedRange || "";
        this._codeMirrorMarkedText = this._codeMirror.markText(range.start, range.end, {className});

        window.addEventListener("mousemove", this, true);
    }

    removeHighlightedRange()
    {
        if (!this._codeMirrorMarkedText)
            return;

        this._codeMirrorMarkedText.clear();
        this._codeMirrorMarkedText = null;

        window.removeEventListener("mousemove", this, true);
    }

    // Private

    _startTracking()
    {
        if (this._tracking)
            return;

        this._tracking = true;
        this._ignoreNextMouseMove = false;

        var wrapper = this._codeMirror.getWrapperElement();
        wrapper.addEventListener("mousemove", this, true);
        wrapper.addEventListener("mouseout", this, false);
        wrapper.addEventListener("mousedown", this, false);
        wrapper.addEventListener("mouseup", this, false);
        wrapper.addEventListener("mousewheel", this, false);
        window.addEventListener("blur", this, true);
    }

    _stopTracking()
    {
        if (!this._tracking)
            return;

        this._tracking = false;
        this._candidate = null;

        var wrapper = this._codeMirror.getWrapperElement();
        wrapper.removeEventListener("mousemove", this, true);
        wrapper.removeEventListener("mouseout", this, false);
        wrapper.removeEventListener("mousedown", this, false);
        wrapper.removeEventListener("mouseup", this, false);
        wrapper.removeEventListener("mousewheel", this, false);
        window.removeEventListener("blur", this, true);
        window.removeEventListener("mousemove", this, true);

        this._resetTrackingStates();
    }

    handleEvent(event)
    {
        switch (event.type) {
        case "mouseenter":
            this._mouseEntered(event);
            break;
        case "mouseleave":
            this._mouseLeft(event);
            break;
        case "mousemove":
            if (event.currentTarget === window)
                this._mouseMovedWithMarkedText(event);
            else
                this._mouseMovedOverEditor(event);
            break;
        case "mouseout":
            // Only deal with a mouseout event that has the editor wrapper as the target.
            if (!event.currentTarget.contains(event.relatedTarget))
                this._mouseMovedOutOfEditor(event);
            break;
        case "mousedown":
            this._mouseButtonWasPressedOverEditor(event);
            break;
        case "mouseup":
            this._mouseButtonWasReleasedOverEditor(event);
            break;
        case "mousewheel":
            this._ignoreNextMouseMove = true;
            break;
        case "blur":
            this._windowLostFocus(event);
            break;
        }
    }

    _handleCommandEnterKey(codeMirror)
    {
        const tokenInfo = this._getTokenInfoForPosition(codeMirror.getCursor("head"));
        tokenInfo.triggeredBy = WI.CodeMirrorTokenTrackingController.TriggeredBy.Keyboard;
        this._processNewHoveredToken(tokenInfo);
    }

    _hidePopover()
    {
        if (!this._candidate)
            return CodeMirror.Pass;

        if (this._delegate && typeof this._delegate.tokenTrackingControllerHighlightedRangeReleased === "function") {
            const forceHidePopover = true;
            this._delegate.tokenTrackingControllerHighlightedRangeReleased(this, forceHidePopover);
        }
    }

    _mouseEntered(event)
    {
        if (!this._tracking)
            this._startTracking();
    }

    _mouseLeft(event)
    {
        this._stopTracking();
    }

    _mouseMovedWithMarkedText(event)
    {
        if (this._candidate && this._candidate.triggeredBy === WI.CodeMirrorTokenTrackingController.TriggeredBy.Keyboard)
            return;

        var shouldRelease = !event.target.classList.contains(this._classNameForHighlightedRange);
        if (shouldRelease && this._delegate && typeof this._delegate.tokenTrackingControllerCanReleaseHighlightedRange === "function")
            shouldRelease = this._delegate.tokenTrackingControllerCanReleaseHighlightedRange(this, event.target);

        if (shouldRelease) {
            if (!this._markedTextMouseoutTimer)
                this._markedTextMouseoutTimer = setTimeout(this._markedTextIsNoLongerHovered.bind(this), this._mouseOutReleaseDelayDuration);
            return;
        }

        if (this._markedTextMouseoutTimer)
            clearTimeout(this._markedTextMouseoutTimer);

        this._markedTextMouseoutTimer = 0;
    }

    _markedTextIsNoLongerHovered()
    {
        if (this._delegate && typeof this._delegate.tokenTrackingControllerHighlightedRangeReleased === "function")
            this._delegate.tokenTrackingControllerHighlightedRangeReleased(this);

        this._markedTextMouseoutTimer = 0;
    }

    _mouseMovedOverEditor(event)
    {
        if (this._ignoreNextMouseMove) {
            this._ignoreNextMouseMove = false;
            return;
        }

        this._updateHoveredTokenInfo({left: event.pageX, top: event.pageY});
    }

    _updateHoveredTokenInfo(mouseCoords)
    {
        // Get the position in the text and the token at that position.
        var position = this._codeMirror.coordsChar(mouseCoords);
        if (WI.settings.experimentalLimitSourceCodeHighlighting.value && position.ch > 120)
            return;

        var token = this._codeMirror.getTokenAt(position);

        if (!token || !token.type || !token.string) {
            if (this._hoveredMarker && this._delegate && typeof this._delegate.tokenTrackingControllerMouseOutOfHoveredMarker === "function") {
                if (!this._codeMirror.findMarksAt(position).includes(this._hoveredMarker.codeMirrorTextMarker))
                    this._delegate.tokenTrackingControllerMouseOutOfHoveredMarker(this, this._hoveredMarker);
            }

            this._resetTrackingStates();
            return;
        }

        // Stop right here if we're hovering the same token as we were last time.
        if (this._previousTokenInfo &&
            this._previousTokenInfo.position.line === position.line &&
            this._previousTokenInfo.token.start === token.start &&
            this._previousTokenInfo.token.end === token.end)
            return;

        // We have a new hovered token.
        var tokenInfo = this._previousTokenInfo = this._getTokenInfoForPosition(position);

        if (/\bmeta\b/.test(token.type)) {
            let nextTokenPosition = Object.shallowCopy(position);
            nextTokenPosition.ch = tokenInfo.token.end + 1;

            let nextToken = this._codeMirror.getTokenAt(nextTokenPosition);
            if (nextToken && nextToken.type && !/\bmeta\b/.test(nextToken.type)) {
                console.assert(tokenInfo.token.end === nextToken.start);

                tokenInfo.token.type = nextToken.type;
                tokenInfo.token.string = tokenInfo.token.string + nextToken.string;
                tokenInfo.token.end = nextToken.end;
            }
        } else {
            let previousTokenPosition = Object.shallowCopy(position);
            previousTokenPosition.ch = tokenInfo.token.start - 1;

            let previousToken = this._codeMirror.getTokenAt(previousTokenPosition);
            if (previousToken && previousToken.type && /\bmeta\b/.test(previousToken.type)) {
                console.assert(tokenInfo.token.start === previousToken.end);

                tokenInfo.token.string = previousToken.string + tokenInfo.token.string;
                tokenInfo.token.start = previousToken.start;
            }
        }

        if (this._tokenHoverTimer)
            clearTimeout(this._tokenHoverTimer);

        this._tokenHoverTimer = 0;

        if (this._codeMirrorMarkedText || !this._mouseOverDelayDuration)
            this._processNewHoveredToken(tokenInfo);
        else
            this._tokenHoverTimer = setTimeout(this._processNewHoveredToken.bind(this, tokenInfo), this._mouseOverDelayDuration);
    }

    _getTokenInfoForPosition(position)
    {
        var token = this._codeMirror.getTokenAt(position);
        var innerMode = CodeMirror.innerMode(this._codeMirror.getMode(), token.state);
        var codeMirrorModeName = innerMode.mode.alternateName || innerMode.mode.name;
        return {
            token,
            position,
            innerMode,
            modeName: codeMirrorModeName
        };
    }

    _mouseMovedOutOfEditor(event)
    {
        if (this._tokenHoverTimer)
            clearTimeout(this._tokenHoverTimer);

        this._tokenHoverTimer = 0;
        this._previousTokenInfo = null;
        this._selectionMayBeInProgress = false;
    }

    _mouseButtonWasPressedOverEditor(event)
    {
        this._selectionMayBeInProgress = true;
    }

    _mouseButtonWasReleasedOverEditor(event)
    {
        this._selectionMayBeInProgress = false;
        this._mouseMovedOverEditor(event);

        if (this._codeMirrorMarkedText && this._previousTokenInfo) {
            var position = this._codeMirror.coordsChar({left: event.pageX, top: event.pageY});
            var marks = this._codeMirror.findMarksAt(position);
            for (var i = 0; i < marks.length; ++i) {
                if (marks[i] === this._codeMirrorMarkedText) {
                    if (this._delegate && typeof this._delegate.tokenTrackingControllerHighlightedRangeWasClicked === "function")
                        this._delegate.tokenTrackingControllerHighlightedRangeWasClicked(this);

                    break;
                }
            }
        }
    }

    _windowLostFocus(event)
    {
        this._resetTrackingStates();
    }

    _processNewHoveredToken(tokenInfo)
    {
        console.assert(tokenInfo);

        if (this._selectionMayBeInProgress)
            return;

        this._candidate = null;

        switch (this._mode) {
        case WI.CodeMirrorTokenTrackingController.Mode.NonSymbolTokens:
            this._candidate = this._processNonSymbolToken(tokenInfo);
            break;
        case WI.CodeMirrorTokenTrackingController.Mode.JavaScriptExpression:
        case WI.CodeMirrorTokenTrackingController.Mode.JavaScriptTypeInformation:
            this._candidate = this._processJavaScriptExpression(tokenInfo);
            break;
        case WI.CodeMirrorTokenTrackingController.Mode.MarkedTokens:
            this._candidate = this._processMarkedToken(tokenInfo);
            break;
        }

        if (!this._candidate)
            return;

        this._candidate.triggeredBy = tokenInfo.triggeredBy;

        if (this._markedTextMouseoutTimer)
            clearTimeout(this._markedTextMouseoutTimer);

        this._markedTextMouseoutTimer = 0;

        if (this._delegate && typeof this._delegate.tokenTrackingControllerNewHighlightCandidate === "function")
            this._delegate.tokenTrackingControllerNewHighlightCandidate(this, this._candidate);
    }

    _processNonSymbolToken(tokenInfo)
    {
        // Ignore any symbol tokens.
        var type = tokenInfo.token.type;
        if (!type)
            return null;

        var startPosition = {line: tokenInfo.position.line, ch: tokenInfo.token.start};
        var endPosition = {line: tokenInfo.position.line, ch: tokenInfo.token.end};

        return {
            hoveredToken: tokenInfo.token,
            hoveredTokenRange: {start: startPosition, end: endPosition},
        };
    }

    _processJavaScriptExpression(tokenInfo)
    {
        // Only valid within JavaScript.
        if (tokenInfo.modeName !== "javascript")
            return null;

        var startPosition = {line: tokenInfo.position.line, ch: tokenInfo.token.start};
        var endPosition = {line: tokenInfo.position.line, ch: tokenInfo.token.end};

        function tokenIsInRange(token, range)
        {
            return token.line >= range.start.line && token.ch >= range.start.ch &&
                   token.line <= range.end.line && token.ch <= range.end.ch;
        }

        // If the hovered token is within a selection, use the selection as our expression.
        if (this._codeMirror.somethingSelected()) {
            var selectionRange = {
                start: this._codeMirror.getCursor("start"),
                end: this._codeMirror.getCursor("end")
            };

            if (tokenIsInRange(startPosition, selectionRange) || tokenIsInRange(endPosition, selectionRange)) {
                return {
                    hoveredToken: tokenInfo.token,
                    hoveredTokenRange: selectionRange,
                    expression: this._codeMirror.getSelection(),
                    expressionRange: selectionRange,
                };
            }
        }

        // We only handle vars, definitions, properties, and the keyword 'this'.
        var type = tokenInfo.token.type;
        var isProperty = type.indexOf("property") !== -1;
        var isKeyword = type.indexOf("keyword") !== -1;
        if (!isProperty && !isKeyword && type.indexOf("variable") === -1 && type.indexOf("def") === -1)
            return null;

        // Not object literal property names, but yes if an object literal shorthand property, which is a variable.
        let state = tokenInfo.innerMode.state;
        if (isProperty && state.lexical && state.lexical.type === "}") {
            // Peek ahead to see if the next token is "}" or ",". If it is, we are a shorthand and therefore a variable.
            let shorthand = false;
            let mode = tokenInfo.innerMode.mode;
            let position = {line: tokenInfo.position.line, ch: tokenInfo.token.end};
            WI.walkTokens(this._codeMirror, mode, position, function(tokenType, string) {
                if (tokenType)
                    return false;
                if (string === "(")
                    return false;
                if (string === "," || string === "}") {
                    shorthand = true;
                    return false;
                }
                return true;
            });

            if (!shorthand)
                return null;
        }

        // Only the "this" keyword.
        if (isKeyword && tokenInfo.token.string !== "this")
            return null;

        // Work out the full hovered expression.
        var expression = tokenInfo.token.string;
        var expressionStartPosition = {line: tokenInfo.position.line, ch: tokenInfo.token.start};
        while (true) {
            var token = this._codeMirror.getTokenAt(expressionStartPosition);
            if (!token)
                break;

            var isDot = !token.type && token.string === ".";
            var isExpression = token.type && token.type.includes("m-javascript");
            if (!isDot && !isExpression)
                break;

            if (isExpression) {
                // Disallow operators. We want the hovered expression to be just a single operand.
                // Also, some operators can modify values, such as pre-increment and assignment operators.
                if (token.type.includes("operator"))
                    break;

                // Don't break out of a template string quasi group.
                if (token.type.includes("string-2"))
                    break;
            }

            expression = token.string + expression;
            expressionStartPosition.ch = token.start;
        }

        // Return the candidate for this token and expression.
        return {
            hoveredToken: tokenInfo.token,
            hoveredTokenRange: {start: startPosition, end: endPosition},
            expression,
            expressionRange: {start: expressionStartPosition, end: endPosition},
        };
    }

    _processMarkedToken(tokenInfo)
    {
        return this._processNonSymbolToken(tokenInfo);
    }

    _resetTrackingStates()
    {
        if (this._tokenHoverTimer)
            clearTimeout(this._tokenHoverTimer);

        this._tokenHoverTimer = 0;

        this._selectionMayBeInProgress = false;
        this._previousTokenInfo = null;
        this.removeHighlightedRange();
    }
};

WI.CodeMirrorTokenTrackingController.JumpToSymbolHighlightStyleClassName = "jump-to-symbol-highlight";

WI.CodeMirrorTokenTrackingController.Mode = {
    None: "none",
    NonSymbolTokens: "non-symbol-tokens",
    JavaScriptExpression: "javascript-expression",
    JavaScriptTypeInformation: "javascript-type-information",
    MarkedTokens: "marked-tokens"
};

WI.CodeMirrorTokenTrackingController.TriggeredBy = {
    Keyboard: "keyboard",
    Hover: "hover"
};
