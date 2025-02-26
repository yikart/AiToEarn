/*
 * Copyright (C) 2022 Apple Inc. All rights reserved.
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

WI.SymbolicBreakpointPopover = class SymbolicBreakpointPopover extends WI.BreakpointPopover
{
    constructor(delegate, breakpoint)
    {
        console.assert(!breakpoint || breakpoint instanceof WI.SymbolicBreakpoint, breakpoint);

        super(delegate, breakpoint);
    }

    // Static

    static get supportsEditing()
    {
        return true;
    }

    // Protected

    populateContent()
    {
        let content = document.createDocumentFragment();

        let symbolLabelElement = document.createElement("label");
        symbolLabelElement.textContent = WI.UIString("Symbol");

        let symbolEditorElement = content.appendChild(document.createElement("div"));
        symbolEditorElement.classList.add("editor", "symbol");

        this._symbolCodeMirror = WI.CodeMirrorEditor.create(symbolEditorElement, {
            extraKeys: {"Tab": false, "Shift-Tab": false},
            lineWrapping: false,
            mode: "text/plain",
            matchBrackets: true,
            scrollbarStyle: null,
        });
        this._symbolCodeMirror.addKeyMap({
            "Enter": () => { this.dismiss(); },
            "Shift-Enter": () => { this.dismiss(); },
            "Esc": () => { this.dismiss(); },
        });

        let symbolInputElement = this._symbolCodeMirror.getInputField();
        symbolInputElement.id = "edit-breakpoint-popover-content-symbol";

        symbolLabelElement.setAttribute("for", symbolInputElement.id);

        let caseSensitiveLabel = content.appendChild(document.createElement("label"));
        caseSensitiveLabel.className = "case-sensitive";

        this._caseSensitiveCheckboxElement = caseSensitiveLabel.appendChild(document.createElement("input"));
        this._caseSensitiveCheckboxElement.type = "checkbox";
        this._caseSensitiveCheckboxElement.checked = true;

        caseSensitiveLabel.append(WI.UIString("Case Sensitive"));

        let isRegexLabel = content.appendChild(document.createElement("label"));
        isRegexLabel.className = "is-regex";

        this._isRegexCheckboxElement = isRegexLabel.appendChild(document.createElement("input"));
        this._isRegexCheckboxElement.type = "checkbox";
        this._isRegexCheckboxElement.checked = false;
        this._isRegexCheckboxElement.addEventListener("change", (event) => {
            this._updateSymbolCodeMirrorMode();
        });
        this._updateSymbolCodeMirrorMode();

        isRegexLabel.append(WI.UIString("Regular Expression"));

        this.addRow("symbol", symbolLabelElement, content);

        // CodeMirror needs a refresh after the popover displays, to layout, otherwise it doesn't appear.
        setTimeout(() => {
            this._symbolCodeMirror.refresh();

            this._symbolCodeMirror.focus();
            this._symbolCodeMirror.setCursor(this._symbolCodeMirror.lineCount(), 0);

            this.update();
        });
    }

    createBreakpoint(options = {})
    {
        let symbol = this._symbolCodeMirror.getValue();
        if (!symbol)
            return null;

        options.caseSensitive = this._caseSensitiveCheckboxElement.checked;
        options.isRegex = this._isRegexCheckboxElement.checked;

        return new WI.SymbolicBreakpoint(symbol, options);
    }

    // Private

    _updateSymbolCodeMirrorMode()
    {
        let isRegex = this._isRegexCheckboxElement.checked;

        this._symbolCodeMirror.setOption("mode", isRegex ? "text/x-regex" : "text/plain");
    }
};

WI.SymbolicBreakpointPopover.ReferencePage = WI.ReferencePage.SymbolicBreakpoints;
