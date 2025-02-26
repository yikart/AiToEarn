/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

WI.URLBreakpointPopover = class URLBreakpointPopover extends WI.BreakpointPopover
{
    constructor(delegate, breakpoint)
    {
        console.assert(!breakpoint || breakpoint instanceof WI.URLBreakpoint, breakpoint);

        super(delegate, breakpoint);

        this._urlCodeMirror = null;
    }

    // Static

    static get supportsEditing()
    {
        return WI.URLBreakpoint.supportsEditing;
    }

    // Protected

    populateContent(contentElement)
    {
        let typeLabelElement = document.createElement("label");
        typeLabelElement.textContent = WI.UIString("Type");

        this._typeSelectElement = document.createElement("select");
        this._typeSelectElement.id = "edit-breakpoint-popover-content-type";

        let createOption = (text, value) => {
            let optionElement = this._typeSelectElement.appendChild(document.createElement("option"));
            optionElement.textContent = text;
            optionElement.value = value;
        };

        createOption(WI.UIString("Containing"), WI.URLBreakpoint.Type.Text);
        createOption(WI.UIString("Matching"), WI.URLBreakpoint.Type.RegularExpression);

        this._typeSelectElement.value = WI.URLBreakpoint.Type.Text;
        this._typeSelectElement.addEventListener("change", (event) => {
            this._updateEditor();
            this._urlCodeMirror.focus();
        });

        typeLabelElement.setAttribute("for", this._typeSelectElement.id);

        this.addRow("type", typeLabelElement, this._typeSelectElement);

        let urlLabelElement = document.createElement("label");
        urlLabelElement.textContent = WI.UIString("URL");

        let urlEditorElement = document.createElement("div");
        urlEditorElement.classList.add("editor");

        this._urlCodeMirror = WI.CodeMirrorEditor.create(urlEditorElement, {
            lineWrapping: false,
            matchBrackets: false,
            scrollbarStyle: null,
        });
        this._updateEditor();

        this._urlCodeMirror.addKeyMap({
            "Enter": () => { this.dismiss(); },
            "Esc": () => { this.dismiss(); },
        });

        let urlCodeMirrorInputField = this._urlCodeMirror.getInputField();
        urlCodeMirrorInputField.id = "edit-breakpoint-popover-content-url";
        urlLabelElement.setAttribute("for", urlCodeMirrorInputField.id);

        this.addRow("url", urlLabelElement, urlEditorElement);

        // CodeMirror needs to refresh after the popover is shown as otherwise it doesn't appear.
        setTimeout(() => {
            this._urlCodeMirror.refresh();
            this._urlCodeMirror.focus();

            this.update();
        });
    }

    createBreakpoint(options = {})
    {
        let type = this._typeSelectElement.value;
        if (!type)
            return null;

        let url = this._urlCodeMirror.getValue();
        if (!url)
            return null;

        return new WI.URLBreakpoint(type, url, options);
    }

    // Private

    _updateEditor()
    {
        let placeholder;
        let mimeType;
        if (this._typeSelectElement.value === WI.URLBreakpoint.Type.Text) {
            placeholder = WI.UIString("Text");
            mimeType = "text/plain";
        } else {
            placeholder = WI.UIString("Regular Expression");
            mimeType = "text/x-regex";
        }

        this._urlCodeMirror.setOption("mode", mimeType);
        this._urlCodeMirror.setOption("placeholder", placeholder);
    }
};

WI.URLBreakpointPopover.ReferencePage = WI.ReferencePage.URLBreakpoints;
