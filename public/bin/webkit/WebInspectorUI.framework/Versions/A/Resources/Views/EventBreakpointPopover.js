/*
 * Copyright (C) 2018 Apple Inc. All rights reserved.
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

WI.EventBreakpointPopover = class EventBreakpointPopover extends WI.BreakpointPopover
{
    constructor(delegate, breakpoint)
    {
        console.assert(!breakpoint || breakpoint instanceof WI.EventBreakpoint, breakpoint);

        super(delegate, breakpoint);
    }

    // Static

    static get supportsEditing()
    {
        return WI.EventBreakpoint.supportsEditing;
    }

    // CodeMirrorCompletionController delegate

    completionControllerCompletionsNeeded(completionController, prefix, defaultCompletions, base, suffix, forced)
    {
        let eventName = prefix.toLowerCase();

        WI.domManager.getSupportedEventNames().then((supportedEventNames) => {
            this._domEventNameCompletionController.updateCompletions(Array.from(supportedEventNames).filter((supportedEventName) => supportedEventName.toLowerCase().startsWith(eventName)));
        });
    }

    // Protected

    get codeMirrorCompletionControllerMode()
    {
        return WI.CodeMirrorCompletionController.Mode.EventBreakpoint;
    }

    populateContent()
    {
        let content = document.createDocumentFragment();

        let eventLabelElement = document.createElement("label");
        eventLabelElement.textContent = WI.UIString("Event");

        let domEventNameEditorElement = content.appendChild(document.createElement("div"));
        domEventNameEditorElement.classList.add("editor");

        this._domEventNameCodeMirror = WI.CodeMirrorEditor.create(domEventNameEditorElement, {
            extraKeys: {"Tab": false, "Shift-Tab": false},
            lineWrapping: false,
            mode: "text/plain",
            matchBrackets: true,
            scrollbarStyle: null,
        });

        this._domEventNameCompletionController = new WI.CodeMirrorCompletionController(WI.CodeMirrorCompletionController.Mode.Basic, this._domEventNameCodeMirror, this);

        this._domEventNameCodeMirror.addKeyMap({
            "Enter": () => {
                this._domEventNameCompletionController.commitCurrentCompletion();
                this.dismiss();
            },
            "Shift-Enter": () => {
                this._domEventNameCompletionController.commitCurrentCompletion();
                this.dismiss();
            },
            "Esc": () => {
                this.dismiss();
            },
        });

        let domEventNameInputElement = this._domEventNameCodeMirror.getInputField();
        domEventNameInputElement.id = "edit-breakpoint-popover-content-event-name";

        eventLabelElement.setAttribute("for", domEventNameInputElement.id);

        if (WI.EventBreakpoint.supportsCaseSensitive) {
            let caseSensitiveLabel = content.appendChild(document.createElement("label"));
            caseSensitiveLabel.className = "case-sensitive";

            this._caseSensitiveCheckboxElement = caseSensitiveLabel.appendChild(document.createElement("input"));
            this._caseSensitiveCheckboxElement.type = "checkbox";
            this._caseSensitiveCheckboxElement.checked = true;

            caseSensitiveLabel.append(WI.UIString("Case Sensitive"));
        }

        if (WI.EventBreakpoint.supportsIsRegex) {
            let isRegexLabel = content.appendChild(document.createElement("label"));
            isRegexLabel.className = "is-regex";

            this._isRegexCheckboxElement = isRegexLabel.appendChild(document.createElement("input"));
            this._isRegexCheckboxElement.type = "checkbox";
            this._isRegexCheckboxElement.checked = false;
            this._isRegexCheckboxElement.addEventListener("change", (event) => {
                this._updateDOMEventNameCodeMirrorMode();
            });
            this._updateDOMEventNameCodeMirrorMode();

            isRegexLabel.append(WI.UIString("Regular Expression"));
        }

        this.addRow("event", eventLabelElement, content);

        // Focus the event name input after the popover is shown.
        setTimeout(() => {
            this._domEventNameCodeMirror.refresh();

            this._domEventNameCodeMirror.focus();
            this._domEventNameCodeMirror.setCursor(this._domEventNameCodeMirror.lineCount(), 0);

            this.update();
        });
    }

    createBreakpoint(options = {})
    {
        console.assert(!options.eventName, options);
        options.eventName = this._domEventNameCodeMirror.getValue();
        if (!options.eventName)
            return null;

        if (this._caseSensitiveCheckboxElement)
            options.caseSensitive = this._caseSensitiveCheckboxElement.checked;
        if (this._isRegexCheckboxElement)
            options.isRegex = this._isRegexCheckboxElement.checked;

        return new WI.EventBreakpoint(WI.EventBreakpoint.Type.Listener, options);
    }

    // Private

    _updateDOMEventNameCodeMirrorMode()
    {
        let isRegex = this._isRegexCheckboxElement?.checked;

        this._domEventNameCodeMirror.setOption("mode", isRegex ? "text/x-regex" : "text/plain");
    }
};

WI.EventBreakpointPopover.ReferencePage = WI.ReferencePage.EventBreakpoints;
