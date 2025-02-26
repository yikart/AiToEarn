/*
 * Copyright (C) 2011 Google Inc.  All rights reserved.
 * Copyright (C) 2007, 2008, 2013-2015 Apple Inc.  All rights reserved.
 * Copyright (C) 2009 Joseph Pecoraro
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

WI.ConsoleMessageView = class ConsoleMessageView extends WI.Object
{
    constructor(message)
    {
        super();

        console.assert(message instanceof WI.ConsoleMessage);

        this._message = message;
        this._expandable = false;
        this._repeatCount = message._repeatCount || 0;
        this._timestamp = message._timestamp || null;

        // These are the parameters unused by the messages's optional format string.
        // Any extra parameters will be displayed as children of this message.
        this._extraParameters = message.parameters;

        this._timestampElement = null;
    }

    // Public

    render()
    {
        console.assert(!this._element);
        this._element = document.createElement("div");
        this._element.classList.add("console-message");
        this._element.dir = "ltr";

        // FIXME: <https://webkit.org/b/143545> Web Inspector: LogContentView should use higher level objects
        this._element.__message = this._message;
        this._element.__messageView = this;

        if (this._message.type === WI.ConsoleMessage.MessageType.Result) {
            this._element.classList.add("console-user-command-result");
            this._element.setAttribute("data-labelprefix", WI.UIString("Output: "));
        } else if (this._message.type === WI.ConsoleMessage.MessageType.StartGroup || this._message.type === WI.ConsoleMessage.MessageType.StartGroupCollapsed)
            this._element.classList.add("console-group-title");

        switch (this._message.level) {
        case WI.ConsoleMessage.MessageLevel.Log:
            this._element.classList.add("console-log-level");
            this._element.setAttribute("data-labelprefix", WI.UIString("Log: "));
            break;
        case WI.ConsoleMessage.MessageLevel.Info:
            this._element.classList.add("console-info-level");
            this._element.setAttribute("data-labelprefix", WI.UIString("Info: "));
            break;
        case WI.ConsoleMessage.MessageLevel.Debug:
            this._element.classList.add("console-debug-level");
            this._element.setAttribute("data-labelprefix", WI.UIString("Debug: "));
            break;
        case WI.ConsoleMessage.MessageLevel.Warning:
            this._element.classList.add("console-warning-level");
            this._element.setAttribute("data-labelprefix", WI.UIString("Warning: "));
            break;
        case WI.ConsoleMessage.MessageLevel.Error:
            this._element.classList.add("console-error-level");
            this._element.setAttribute("data-labelprefix", WI.UIString("Error: "));
            break;
        }

        // FIXME: The location link should include stack trace information.
        this._appendLocationLink();

        this._messageBodyElement = this._element.appendChild(document.createElement("span"));
        this._messageBodyElement.classList.add("console-top-level-message", "console-message-body");
        this._appendMessageTextAndArguments(this._messageBodyElement);
        this._appendSavedResultIndex();

        this._appendExtraParameters();
        this._appendStackTrace();

        this._renderRepeatCount();
        this.renderTimestamp();            

        if (this._message.type === WI.ConsoleMessage.MessageType.Dir)
            this.expand();
        else if (this._message.type === WI.ConsoleMessage.MessageType.Image) {
            this._element.classList.add("console-image");
            this._element.addEventListener("contextmenu", this._handleContextMenu.bind(this));
        }

        WI.debuggerManager.addEventListener(WI.DebuggerManager.Event.BlackboxChanged, this._handleDebuggerBlackboxChanged, this);
    }

    get element()
    {
        return this._element;
    }

    get message()
    {
        return this._message;
    }

    get repeatCount()
    {
        return this._repeatCount;
    }

    set repeatCount(count)
    {
        console.assert(typeof count === "number");

        if (this._repeatCount === count)
            return;

        this._repeatCount = count;

        if (this._element)
            this._renderRepeatCount();
    }

    _renderRepeatCount()
    {
        let count = this._repeatCount;

        if (count <= 1) {
            if (this._repeatCountElement) {
                this._repeatCountElement.remove();
                this._repeatCountElement = null;
            }
            return;
        }

        if (!this._repeatCountElement) {
            this._repeatCountElement = document.createElement("span");
            this._repeatCountElement.classList.add("repeat-count");
            this._element.insertBefore(this._repeatCountElement, this._element.firstChild);
        }

        this._repeatCountElement.textContent = Number.abbreviate(count);
    }

    get timestamp()
    {
        return this._timestamp;
    }

    set timestamp(timestamp)
    {
        this._timestamp = timestamp;
        if (this._element) {
            this.renderTimestamp();
        }
    }

    renderTimestamp()
    {
        if (!this._timestamp) {
            this._timestampElement?.remove();
            this._timestampElement = null;
            return;
        }

        if (!this._timestampElement) {
            this._timestampElement = document.createElement("span");
            this._timestampElement.classList.add("timestamp");
            this._element.insertBefore(this._timestampElement, this._element.firstChild);
        }
    
        let date = new Date(this._timestamp * 1000);
        let timeFormat = new Intl.DateTimeFormat("default", { hour: "2-digit", minute: "2-digit", second: "2-digit", fractionalSecondDigits: 3, hour12: false });
        this._timestampElement.textContent = timeFormat.format(date);
    }

    get expandable()
    {
        // There are extra arguments or a call stack that can be shown.
        if (this._expandable)
            return true;

        // There is an object tree that could be expanded.
        if (this._objectTree)
            return true;

        return false;
    }

    expand()
    {
        if (this._expandable)
            this._element.classList.add("expanded");

        // Auto-expand an inner object tree if there is a single object.
        // For Trace messages we are auto-expanding for the call stack, don't also auto-expand an object as well.
        if (this._objectTree && this._message.type !== WI.ConsoleMessage.MessageType.Trace) {
            if (!this._extraParameters || this._extraParameters.length <= 1)
                this._objectTree.expand();
        }
    }

    collapse()
    {
        if (this._expandable)
            this._element.classList.remove("expanded");

        // Collapse the object tree just in cases where it was autoexpanded.
        if (this._objectTree) {
            if (!this._extraParameters || this._extraParameters.length <= 1)
                this._objectTree.collapse();
        }
    }

    toggle()
    {
        if (this._element.classList.contains("expanded"))
            this.collapse();
        else
            this.expand();
    }

    toClipboardString(isPrefixOptional)
    {
        let clipboardString = this._messageBodyElement.innerText.removeWordBreakCharacters();
        if (this._message.savedResultIndex) {
            let escapedSavedResultPrefix = WI.RuntimeManager.preferredSavedResultPrefix().escapeForRegExp();
            clipboardString = clipboardString.replace(new RegExp(`\\s*=\\s*${escapedSavedResultPrefix}\\d+\\s*$`), "");
        }

        let hasStackTrace = this._shouldShowStackTrace();
        if (!hasStackTrace) {
            let repeatString = this.repeatCount > 1 ? "x" + this.repeatCount : "";
            let urlLine = "";
            if (this._message.url) {
                let components = [WI.displayNameForURL(this._message.url), "line " + this._message.line];
                if (repeatString)
                    components.push(repeatString);
                urlLine = " (" + components.join(", ") + ")";
            } else if (repeatString)
                urlLine = " (" + repeatString + ")";

            if (urlLine) {
                let lines = clipboardString.split("\n");
                lines[0] += urlLine;
                clipboardString = lines.join("\n");
            }
        }

        if (this._extraElementsList)
            clipboardString += "\n" + this._extraElementsList.innerText.removeWordBreakCharacters().trim();

        if (hasStackTrace) {
            this._message.stackTrace.callFrames.forEach(function(frame) {
                clipboardString += "\n\t" + frame.displayName;
                if (frame.sourceCodeLocation)
                    clipboardString += " (" + frame.sourceCodeLocation.originalLocationString() + ")";
            });
        }

        if (!isPrefixOptional || this._enforcesClipboardPrefixString())
            return this._clipboardPrefixString() + clipboardString;
        return clipboardString;
    }

    clearSessionState()
    {
        for (let node of this._messageBodyElement.querySelectorAll(".console-saved-variable"))
            node.remove();

        if (this._objectTree instanceof WI.ObjectTreeView)
            this._objectTree.resetPropertyPath();

        WI.debuggerManager.removeEventListener(WI.DebuggerManager.Event.BlackboxChanged, this._handleDebuggerBlackboxChanged, this);
    }

    // Private

    _appendMessageTextAndArguments(element)
    {
        if (this._message.source === WI.ConsoleMessage.MessageSource.ConsoleAPI) {
            switch (this._message.type) {
            case WI.ConsoleMessage.MessageType.Trace:
                var args = [WI.UIString("Trace")];
                if (this._message.parameters) {
                    if (this._message.parameters[0].type === "string") {
                        var prefixedFormatString = WI.UIString("Trace: %s").format(this._message.parameters[0].description);
                        args = [prefixedFormatString].concat(this._message.parameters.slice(1));
                    } else
                        args.pushAll(this._message.parameters);
                }
                this._appendFormattedArguments(element, args);
                return;

            case WI.ConsoleMessage.MessageType.Assert:
                var args = [WI.UIString("Assertion Failed")];
                if (this._message.parameters) {
                    if (this._message.parameters[0].type === "string") {
                        var prefixedFormatString = WI.UIString("Assertion Failed: %s").format(this._message.parameters[0].description);
                        args = [prefixedFormatString].concat(this._message.parameters.slice(1));
                    } else
                        args.pushAll(this._message.parameters);
                }
                this._appendFormattedArguments(element, args);
                return;

            case WI.ConsoleMessage.MessageType.Dir:
                var obj = this._message.parameters ? this._message.parameters[0] : undefined;
                this._appendFormattedArguments(element, ["%O", obj]);
                return;

            case WI.ConsoleMessage.MessageType.Table:
                var args = this._message.parameters;
                element.appendChild(this._formatParameterAsTable(args));
                this._extraParameters = null;
                return;

            case WI.ConsoleMessage.MessageType.StartGroup:
            case WI.ConsoleMessage.MessageType.StartGroupCollapsed:
                var args = this._message.parameters || [this._message.messageText || WI.UIString("Group")];
                this._formatWithSubstitutionString(args, element);
                this._extraParameters = null;
                return;

            case WI.ConsoleMessage.MessageType.Timing: {
                let args = [this._message.messageText];
                if (this._extraParameters)
                    args.pushAll(this._extraParameters);
                this._appendFormattedArguments(element, args);
                return;
            }

            case WI.ConsoleMessage.MessageType.Image: {
                if (this._message.level === WI.ConsoleMessage.MessageLevel.Log) {
                    let divider = null;

                    if (this._message.parameters.length > 1) {
                        this._appendFormattedArguments(element, this._message.parameters.slice(1));

                        divider = element.appendChild(document.createElement("hr"));
                    }

                    let target = this._message.parameters[0];
                    if (target === "Viewport")
                        target = WI.UIString("Viewport");
                    this._appendFormattedArguments(element, [target]);

                    if (this._message.messageText) {
                        let img = document.createElement("img");
                        img.classList.add("show-grid");
                        img.src = this._message.messageText;
                        img.setAttribute("filename", WI.FileUtilities.screenshotString() + ".png");
                        img.addEventListener("load", (event) => {
                            if (img.width >= img.height)
                                img.width = img.width / window.devicePixelRatio;
                            else
                                img.height = img.height / window.devicePixelRatio;
                            element.appendChild(img);
                        });
                        img.addEventListener("error", (event) => {
                            this._element.setAttribute("data-labelprefix", WI.UIString("Error: "));
                            this._element.classList.add("console-error-level");
                            this._element.classList.remove("console-log-level");

                            if (divider) {
                                while (divider.nextSibling)
                                    divider.nextSibling.remove();
                            } else
                                element.removeChildren();

                            let args = [WI.UIString("Could not capture screenshot"), this._message.messageText];
                            if (this._extraParameters)
                                args.pushAll(this._extraParameters);
                            this._appendFormattedArguments(element, args);
                        });
                    }
                    return;
                }

                if (this._message.level === WI.ConsoleMessage.MessageLevel.Error) {
                    let args = [];
                    if (this._message.messageText === "Could not capture screenshot")
                        args.push(WI.UIString("Could not capture screenshot"));
                    else
                        args.push(this._message.messageText);
                    if (this._extraParameters)
                        args.pushAll(this._extraParameters);
                    this._appendFormattedArguments(element, args);
                    return;
                }

                console.assert();
                break;
            }
            }
        }

        // FIXME: Better handle WI.ConsoleMessage.MessageSource.Network once it has request info.

        var args = this._message.parameters || [this._message.messageText];
        this._appendFormattedArguments(element, args);
    }

    _appendSavedResultIndex(element)
    {
        let savedResultIndex = this._message.savedResultIndex;
        if (!savedResultIndex)
            return;

        console.assert(this._message instanceof WI.ConsoleCommandResultMessage);
        console.assert(this._message.type === WI.ConsoleMessage.MessageType.Result);

        var savedVariableElement = document.createElement("span");
        savedVariableElement.classList.add("console-saved-variable");

        // FIXME: <https://webkit.org/b/196956> Web Inspector: use weak collections for holding event listeners
        function updateSavedVariableText() {
            savedVariableElement.textContent = " = " + WI.RuntimeManager.preferredSavedResultPrefix() + savedResultIndex;
        }
        WI.settings.consoleSavedResultAlias.addEventListener(WI.Setting.Event.Changed, updateSavedVariableText, savedVariableElement);
        updateSavedVariableText();

        if (this._objectTree)
            this._objectTree.appendTitleSuffix(savedVariableElement);
        else
            this._messageBodyElement.appendChild(savedVariableElement);
    }

    _appendLocationLink()
    {
        if (this._message.source === WI.ConsoleMessage.MessageSource.Network) {
            if (this._message.url) {
                var anchor = WI.linkifyURLAsNode(this._message.url, this._message.url, "console-message-url");
                anchor.classList.add("console-message-location");
                this._element.appendChild(anchor);
            }
            return;
        }

        var callFrame;
        let firstNonNativeNonAnonymousNotBlackboxedCallFrame = this._message.stackTrace?.firstNonNativeNonAnonymousNotBlackboxedCallFrame;
        if (firstNonNativeNonAnonymousNotBlackboxedCallFrame) {
            // JavaScript errors and console.* methods.
            callFrame = firstNonNativeNonAnonymousNotBlackboxedCallFrame;
        } else if (this._message.url && !this._shouldHideURL(this._message.url)) {
            // CSS warnings have no stack traces.
            callFrame = WI.CallFrame.fromPayload(this._message.target, {
                functionName: "",
                url: this._message.url,
                lineNumber: this._message.line,
                columnNumber: this._message.column
            });
        }

        if (callFrame && (!callFrame.isConsoleEvaluation || WI.settings.debugShowConsoleEvaluations.value)) {
            let existingCallFrameView = this._callFrameView;

            this._callFrameView = new WI.CallFrameView(callFrame, {showFunctionName: !!callFrame.functionName});
            this._callFrameView.classList.add("console-message-location");

            if (existingCallFrameView)
                this._element.replaceChild(this._callFrameView, existingCallFrameView);
            else
                this._element.appendChild(this._callFrameView);
            return;
        }

        if (this._message.parameters && this._message.parameters.length === 1) {
            var parameter = this._createRemoteObjectIfNeeded(this._message.parameters[0]);

            parameter.findFunctionSourceCodeLocation().then((result) => {
                if (result === WI.RemoteObject.SourceCodeLocationPromise.NoSourceFound || result === WI.RemoteObject.SourceCodeLocationPromise.MissingObjectId)
                    return;

                let link = WI.linkifySourceCode(result.sourceCode, new WI.SourceCodePosition(result.lineNumber, result.columnNumber), {
                    className: "console-message-url",
                    ignoreNetworkTab: true,
                    ignoreSearchTab: true,
                });
                link.classList.add("console-message-location");

                if (this._element.hasChildNodes())
                    this._element.insertBefore(link, this._element.firstChild);
                else
                    this._element.appendChild(link);
            });
        }
    }

    _appendExtraParameters()
    {
        if (!this._extraParameters || !this._extraParameters.length)
            return;

        this._makeExpandable();

        // Auto-expand if there are multiple objects or if there were simple parameters.
        if (this._extraParameters.length > 1)
            this.expand();

        this._extraElementsList = this._element.appendChild(document.createElement("ol"));
        this._extraElementsList.classList.add("console-message-extra-parameters-container");

        for (var parameter of this._extraParameters) {
            var listItemElement = this._extraElementsList.appendChild(document.createElement("li"));
            const forceObjectFormat = parameter.type === "object" && (parameter.subtype !== "null" && parameter.subtype !== "regexp" && parameter.subtype !== "node" && parameter.subtype !== "error");
            listItemElement.classList.add("console-message-extra-parameter");
            listItemElement.appendChild(this._formatParameter(parameter, forceObjectFormat));
        }
    }

    _appendStackTrace()
    {
        if (!this._shouldShowStackTrace())
            return;

        this._makeExpandable();

        if (this._message.type === WI.ConsoleMessage.MessageType.Trace && WI.settings.consoleAutoExpandTrace.value)
            this.expand();

        this._stackTraceElement = this._element.appendChild(document.createElement("div"));
        this._stackTraceElement.classList.add("console-message-body", "console-message-stack-trace-container");

        let callFramesElement = new WI.StackTraceView(this._message.stackTrace);
        this._stackTraceElement.appendChild(callFramesElement);
    }

    _createRemoteObjectIfNeeded(parameter)
    {
        // FIXME: Only pass RemoteObjects here so we can avoid this work.
        if (parameter instanceof WI.RemoteObject)
            return parameter;

        if (typeof parameter === "object")
            return WI.RemoteObject.fromPayload(parameter, this._message.target);

        return WI.RemoteObject.fromPrimitiveValue(parameter);
    }

    _appendFormattedArguments(element, parameters)
    {
        if (!parameters.length)
            return;

        for (let i = 0; i < parameters.length; ++i)
            parameters[i] = this._createRemoteObjectIfNeeded(parameters[i]);

        let builderElement = element.appendChild(document.createElement("span"));
        let shouldFormatWithStringSubstitution = parameters[0].type === "string" && this._message.type !== WI.ConsoleMessage.MessageType.Result;

        // Single object (e.g. console result or logging a non-string object).
        if (parameters.length === 1 && !shouldFormatWithStringSubstitution) {
            this._extraParameters = null;
            builderElement.appendChild(this._formatParameter(parameters[0], false));
            return;
        }

        console.assert(this._message.type !== WI.ConsoleMessage.MessageType.Result);

        if (shouldFormatWithStringSubstitution && this._isStackTrace(parameters[0]))
            shouldFormatWithStringSubstitution = false;

        let needsDivider = false;
        function appendDividerIfNeeded() {
            if (!needsDivider)
                return null;
            let element = builderElement.appendChild(document.createElement("span"));
            element.classList.add("console-message-preview-divider");
            element.textContent = ` ${enDash} `;
            return element;
        }

        // Format string.
        if (shouldFormatWithStringSubstitution) {
            let result = this._formatWithSubstitutionString(parameters, builderElement);
            parameters = result.unusedSubstitutions;
            this._extraParameters = parameters;
            needsDivider = true;
        }

        // Trailing inline parameters.
        if (parameters.length) {
            let simpleParametersCount = 0;
            for (let parameter of parameters) {
                if (!this._hasSimpleDisplay(parameter))
                    break;
                simpleParametersCount++;
            }

            // Show one or more simple parameters inline on the message line.
            if (simpleParametersCount) {
                let simpleParameters = parameters.splice(0, simpleParametersCount);
                this._extraParameters = parameters;

                for (let parameter of simpleParameters) {
                    let dividerElement = appendDividerIfNeeded();
                    if (dividerElement)
                        dividerElement.classList.add("inline-lossless");

                    let previewContainer = builderElement.appendChild(document.createElement("span"));
                    previewContainer.classList.add("inline-lossless");

                    let preview = WI.FormattedValue.createObjectPreviewOrFormattedValueForRemoteObject(parameter, WI.ObjectPreviewView.Mode.Brief);
                    let isPreviewView = preview instanceof WI.ObjectPreviewView;

                    if (isPreviewView)
                        preview.setOriginatingObjectInfo(parameter, null);

                    let previewElement = isPreviewView ? preview.element : preview;
                    previewContainer.appendChild(previewElement);

                    needsDivider = true;

                    // Simple displayable parameters should pretty much always be lossless.
                    // An exception might be a truncated string.
                    console.assert((isPreviewView && preview.lossless) || (!isPreviewView && this._shouldConsiderObjectLossless(parameter)));
                }
            }

            // If there is a single non-simple parameter after simple paramters, show it inline.
            if (parameters.length === 1 && !this._isStackTrace(parameters[0])) {
                let parameter = parameters[0];

                let dividerElement = appendDividerIfNeeded();

                let previewContainer = builderElement.appendChild(document.createElement("span"));
                previewContainer.classList.add("console-message-preview");

                let preview = WI.FormattedValue.createObjectPreviewOrFormattedValueForRemoteObject(parameter, WI.ObjectPreviewView.Mode.Brief);
                let isPreviewView = preview instanceof WI.ObjectPreviewView;

                if (isPreviewView)
                    preview.setOriginatingObjectInfo(parameter, null);

                let previewElement = isPreviewView ? preview.element : preview;
                previewContainer.appendChild(previewElement);

                needsDivider = true;

                // If this preview is effectively lossless, we can avoid making this console message expandable.
                if ((isPreviewView && preview.lossless) || (!isPreviewView && this._shouldConsiderObjectLossless(parameter))) {
                    this._extraParameters = null;
                    if (dividerElement)
                        dividerElement.classList.add("inline-lossless");
                    previewContainer.classList.add("inline-lossless");
                }
            } else if (parameters.length) {
                // Multiple remaining objects. Show an indicator and they will be appended as extra parameters.
                let enclosedElement = document.createElement("span");
                builderElement.append(" ", enclosedElement);
                enclosedElement.classList.add("console-message-enclosed");
                enclosedElement.textContent = "(" + parameters.length + ")";
            }
        }
    }

    _hasSimpleDisplay(parameter)
    {
        console.assert(parameter instanceof WI.RemoteObject);

        return WI.FormattedValue.hasSimpleDisplay(parameter) && !this._isStackTrace(parameter);
    }

    _isStackTrace(parameter)
    {
        console.assert(parameter instanceof WI.RemoteObject);

        return parameter.type === "string" && WI.StackTrace.isLikelyStackTrace(parameter.description);
    }

    _shouldConsiderObjectLossless(object)
    {
        if (object.type === "string")
            return WI.FormattedValue.isSimpleString(object.description);

        return object.type !== "object" || object.subtype === "null" || object.subtype === "regexp";
    }

    _formatParameter(parameter, forceObjectFormat)
    {
        var type;
        if (forceObjectFormat)
            type = "object";
        else if (parameter instanceof WI.RemoteObject)
            type = parameter.subtype || parameter.type;
        else {
            console.assert(false, "no longer reachable");
            type = typeof parameter;
        }

        var formatters = {
            "object": this._formatParameterAsObject,
            "error": this._formatParameterAsError,
            "map": this._formatParameterAsObject,
            "set": this._formatParameterAsObject,
            "weakmap": this._formatParameterAsObject,
            "weakset": this._formatParameterAsObject,
            "iterator": this._formatParameterAsObject,
            "class": this._formatParameterAsObject,
            "proxy": this._formatParameterAsObject,
            "weakref": this._formatParameterAsObject,
            "array": this._formatParameterAsArray,
            "node": this._formatParameterAsNode,
            "string": this._formatParameterAsString,
        };

        var formatter = formatters[type] || this._formatParameterAsValue;

        const fragment = document.createDocumentFragment();
        formatter.call(this, parameter, fragment, forceObjectFormat);
        return fragment;
    }

    _formatParameterAsValue(value, fragment)
    {
        fragment.appendChild(WI.FormattedValue.createElementForRemoteObject(value));
    }

    _formatParameterAsString(object, fragment)
    {
        if (this._isStackTrace(object)) {
            let stackTrace = WI.StackTrace.fromString(this._message.target, object.description);
            if (stackTrace.callFrames.length) {
                let stackView = new WI.StackTraceView(stackTrace);
                fragment.appendChild(stackView);
                return;
            }
        }

        fragment.appendChild(WI.FormattedValue.createLinkifiedElementString(object.description));
    }

    _formatParameterAsNode(object, fragment)
    {
        fragment.appendChild(WI.FormattedValue.createElementForNode(object));
    }

    _formatParameterAsObject(object, fragment, forceExpansion)
    {
        // FIXME: Should have a better ObjectTreeView mode for classes (static methods and methods).
        this._objectTree = new WI.ObjectTreeView(object, null, this._rootPropertyPathForObject(object), forceExpansion);
        fragment.appendChild(this._objectTree.element);
    }

    _formatParameterAsError(object, fragment)
    {
        this._objectTree = new WI.ErrorObjectView(object);
        fragment.appendChild(this._objectTree.element);
    }

    _formatParameterAsArray(array, fragment)
    {
        this._objectTree = new WI.ObjectTreeView(array, WI.ObjectTreeView.Mode.Properties, this._rootPropertyPathForObject(array));
        fragment.appendChild(this._objectTree.element);
    }

    _rootPropertyPathForObject(object)
    {
        let savedResultIndex = this._message.savedResultIndex;
        if (!savedResultIndex)
            return null;

        function prefixSavedResultIndex() {
            return WI.RuntimeManager.preferredSavedResultPrefix() + savedResultIndex;
        }

        let propertyPath = new WI.PropertyPath(object, prefixSavedResultIndex());

        WI.settings.consoleSavedResultAlias.addEventListener(WI.Setting.Event.Changed, function(event) {
            this.pathComponent = prefixSavedResultIndex();
        }, propertyPath);

        return propertyPath;
    }

    _formatWithSubstitutionString(parameters, formattedResult)
    {
        function parameterFormatter(force, obj)
        {
            return this._formatParameter(obj, force);
        }

        function stringFormatter(obj)
        {
            return obj.description;
        }

        function floatFormatter(obj, token)
        {
            return parseFloat(typeof obj.value === "number" ? obj.value : obj.description).maxDecimals(token.precision);
        }

        function integerFormatter(obj)
        {
            return parseInt(typeof obj.value === "number" ? obj.value : obj.description);
        }

        var currentStyle = null;
        function styleFormatter(obj)
        {
            currentStyle = {};
            var buffer = document.createElement("span");
            buffer.setAttribute("style", obj.description);
            for (var i = 0; i < buffer.style.length; i++) {
                var property = buffer.style[i];
                if (isAllowedProperty(property) && isAllowedValue(buffer.style[property]))
                    currentStyle[property] = buffer.style[property];
            }
        }

        function isAllowedProperty(property)
        {
            for (var prefix of ["background", "border", "color", "font", "line", "margin", "padding", "text"]) {
                if (property.startsWith(prefix) || property.startsWith("-webkit-" + prefix))
                    return true;
            }
            return false;
        }

        function isAllowedValue(value) {
            if (value.startsWith("url") || value.startsWith("src"))
                return false;
            return true;
        }

        // Firebug uses %o for formatting objects.
        var formatters = {};
        formatters.o = parameterFormatter.bind(this, false);
        formatters.s = stringFormatter;
        formatters.f = floatFormatter;

        // Firebug allows both %i and %d for formatting integers.
        formatters.i = integerFormatter;
        formatters.d = integerFormatter;

        // Firebug uses %c for styling the message.
        formatters.c = styleFormatter;

        // Support %O to force object formatting, instead of the type-based %o formatting.
        formatters.O = parameterFormatter.bind(this, true);

        function append(a, b)
        {
            if (b instanceof Node)
                a.appendChild(b);
            else if (b !== undefined) {
                var toAppend = WI.linkifyStringAsFragment(b.toString());
                if (currentStyle) {
                    var wrapper = document.createElement("span");
                    for (var key in currentStyle)
                        wrapper.style[key] = currentStyle[key];
                    wrapper.appendChild(toAppend);
                    toAppend = wrapper;
                }

                a.appendChild(toAppend);
            }
            return a;
        }

        // String.format does treat formattedResult like a Builder, result is an object.
        return String.format(parameters[0].description, parameters.slice(1), formatters, formattedResult, append);
    }

    _shouldShowStackTrace()
    {
        if (!this._message.stackTrace?.callFrames.length)
            return false;

        return this._message.source === WI.ConsoleMessage.MessageSource.Network
            || this._message.level === WI.ConsoleMessage.MessageLevel.Error
            || this._message.type === WI.ConsoleMessage.MessageType.Trace;
    }

    _shouldHideURL(url)
    {
        return url === "undefined" || url === "[native code]";
    }

    _userProvidedColumnNames(columnNamesArgument)
    {
        if (!columnNamesArgument)
            return null;

        console.assert(columnNamesArgument instanceof WI.RemoteObject);

        // Single primitive argument.
        if (columnNamesArgument.type === "string" || columnNamesArgument.type === "number")
            return [String(columnNamesArgument.value)];

        // Ignore everything that is not an array with property previews.
        if (columnNamesArgument.type !== "object" || columnNamesArgument.subtype !== "array" || !columnNamesArgument.preview || !columnNamesArgument.preview.propertyPreviews)
            return null;

        // Array. Look into the preview and get string values.
        var extractedColumnNames = [];
        for (var propertyPreview of columnNamesArgument.preview.propertyPreviews) {
            if (propertyPreview.type === "string" || propertyPreview.type === "number")
                extractedColumnNames.push(String(propertyPreview.value));
        }

        return extractedColumnNames.length ? extractedColumnNames : null;
    }

    _formatParameterAsTable(parameters)
    {
        var element = document.createElement("span");
        var table = parameters[0];
        if (!table || !table.preview)
            return element;

        var rows = [];
        var columnNames = [];
        var flatValues = [];
        var preview = table.preview;
        var userProvidedColumnNames = false;

        // User provided columnNames.
        var extractedColumnNames = this._userProvidedColumnNames(parameters[1]);
        if (extractedColumnNames) {
            userProvidedColumnNames = true;
            columnNames = extractedColumnNames;
        }

        // Check first for valuePreviews in the properties meaning this was an array of objects.
        if (preview.propertyPreviews) {
            for (var i = 0; i < preview.propertyPreviews.length; ++i) {
                var rowProperty = preview.propertyPreviews[i];
                var rowPreview = rowProperty.valuePreview;
                if (!rowPreview || !rowPreview.propertyPreviews)
                    continue;

                var rowValue = {};
                var maxColumnsToRender = 15;
                for (var j = 0; j < rowPreview.propertyPreviews.length; ++j) {
                    var cellProperty = rowPreview.propertyPreviews[j];
                    var columnRendered = columnNames.includes(cellProperty.name);
                    if (!columnRendered) {
                        if (userProvidedColumnNames || columnNames.length === maxColumnsToRender)
                            continue;
                        columnRendered = true;
                        columnNames.push(cellProperty.name);
                    }

                    rowValue[cellProperty.name] = WI.FormattedValue.createElementForPropertyPreview(cellProperty);
                }
                rows.push([rowProperty.name, rowValue]);
            }
        }

        // If there were valuePreviews, convert to a flat list.
        if (rows.length) {
            columnNames.unshift(WI.UIString("(Index)"));
            for (var i = 0; i < rows.length; ++i) {
                var rowName = rows[i][0];
                var rowValue = rows[i][1];
                flatValues.push(rowName);
                for (var j = 1; j < columnNames.length; ++j) {
                    var columnName = columnNames[j];
                    if (!(columnName in rowValue))
                        flatValues.push(emDash);
                    else
                        flatValues.push(rowValue[columnName]);
                }
            }
        }

        // If there were no value Previews, then check for an array of values.
        if (!flatValues.length && preview.propertyPreviews) {
            for (var i = 0; i < preview.propertyPreviews.length; ++i) {
                var rowProperty = preview.propertyPreviews[i];
                if (!("value" in rowProperty))
                    continue;

                if (!columnNames.length) {
                    columnNames.push(WI.UIString("Index"));
                    columnNames.push(WI.UIString("Value"));
                }

                flatValues.push(rowProperty.name);
                flatValues.push(WI.FormattedValue.createElementForPropertyPreview(rowProperty));
            }
        }

        // If no table data show nothing.
        if (!flatValues.length)
            return element;

        // FIXME: Should we output something extra if the preview is lossless?

        var dataGrid = WI.DataGrid.createSortableDataGrid(columnNames, flatValues);
        dataGrid.inline = true;
        dataGrid.variableHeightRows = true;

        element.appendChild(dataGrid.element);

        dataGrid.updateLayoutIfNeeded();

        return element;
    }

    _levelString()
    {
        switch (this._message.level) {
        case WI.ConsoleMessage.MessageLevel.Log:
            return "Log";
        case WI.ConsoleMessage.MessageLevel.Info:
            return "Info";
        case WI.ConsoleMessage.MessageLevel.Warning:
            return "Warning";
        case WI.ConsoleMessage.MessageLevel.Debug:
            return "Debug";
        case WI.ConsoleMessage.MessageLevel.Error:
            return "Error";
        }
    }

    _enforcesClipboardPrefixString()
    {
        return this._message.type !== WI.ConsoleMessage.MessageType.Result;
    }

    _clipboardPrefixString()
    {
        if (this._message.type === WI.ConsoleMessage.MessageType.Result)
            return "< ";

        return "[" + this._levelString() + "] ";
    }

    _makeExpandable()
    {
        if (this._expandable)
            return;

        this._expandable = true;

        this._element.classList.add("expandable");

        this._boundClickHandler = this.toggle.bind(this);
        this._messageBodyElement.addEventListener("click", this._boundClickHandler);
    }

    _handleContextMenu(event)
    {
        let image = event.target.closest(".console-image > .console-message-body > img");
        if (!image)
            return;

        let contextMenu = WI.ContextMenu.createFromEvent(event);

        if (WI.FileUtilities.canSave(WI.FileUtilities.SaveMode.SingleFile)) {
            contextMenu.appendItem(WI.UIString("Save Image"), () => {
                const forceSaveAs = true;
                WI.FileUtilities.save(WI.FileUtilities.SaveMode.SingleFile, {
                    content: parseDataURL(this._message.messageText).data,
                    base64Encoded: true,
                    suggestedName: image.getAttribute("filename"),
                }, forceSaveAs);
            });
        }

        contextMenu.appendSeparator();
    }

    _handleDebuggerBlackboxChanged(event)
    {
        if (this._callFrameView)
            this._appendLocationLink();
    }
};
