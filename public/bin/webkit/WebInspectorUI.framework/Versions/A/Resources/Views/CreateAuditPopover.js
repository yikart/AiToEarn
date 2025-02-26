/*
 * Copyright (C) 2020 Apple Inc. All rights reserved.
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

WI.CreateAuditPopover = class CreateAuditPopover extends WI.Popover
{
    constructor(delegate)
    {
        super(delegate);

        this._audit = null;

        this._targetElement = null;
        this._preferredEdges = null;

        this.windowResizeHandler = this._presentOverTargetElement.bind(this);
    }

    // Public

    get audit() { return this._audit; }

    show(targetElement, preferredEdges)
    {
        this._targetElement = targetElement;
        this._preferredEdges = preferredEdges;

        let contentElement = document.createElement("div");
        contentElement.classList.add("create-audit-content");

        let label = contentElement.appendChild(document.createElement("div"));
        label.classList.add("label");
        label.textContent = WI.UIString("Create audit:");

        let editorWrapper = contentElement.appendChild(document.createElement("div"));
        editorWrapper.classList.add("editor-wrapper");

        this._typeSelectElement = editorWrapper.appendChild(document.createElement("select"));

        let createOption = (text, value) => {
            let optionElement = this._typeSelectElement.appendChild(document.createElement("option"));
            optionElement.textContent = text;
            optionElement.value = value;
            return optionElement;
        };

        createOption(WI.UIString("Test Case", "Test Case @ Audit Tab Navigation Sidebar", "Dropdown option inside the popover used to creating an audit test case."), "test-case");
        createOption(WI.UIString("Group", "Group @ Audit Tab Navigation Sidebar", "Dropdown option inside the popover used to creating an audit group."), "group");

        this._nameInputElement = editorWrapper.appendChild(document.createElement("input"));
        this._nameInputElement.placeholder = WI.UIString("Name");
        this._nameInputElement.addEventListener("keydown", (event) => {
            if (event.keyCode === WI.KeyboardShortcut.Key.Enter.keyCode || event.keyCode === WI.KeyboardShortcut.Key.Escape.keyCode) {
                event.stop();
                this.dismiss();
            }
        });

        editorWrapper.appendChild(WI.ReferencePage.AuditTab.CreatingAudits.createLinkElement());

        this.content = contentElement;

        this._presentOverTargetElement();
    }

    dismiss()
    {
        const placeholderTestFunctionString = WI.DefaultAudits.newAuditPlaceholder.toString();

        let type = this._typeSelectElement.value;
        let name = this._nameInputElement.value;
        if (type && name) {
            switch (type) {
            case "test-case":
                this._audit = new WI.AuditTestCase(name, placeholderTestFunctionString);
                break;

            case "group":
                this._audit = new WI.AuditTestGroup(name, [new WI.AuditTestCase(WI.unlocalizedString("test-case"), placeholderTestFunctionString)]);
                break;
            }
        }

        super.dismiss();
    }

    // Private

    _presentOverTargetElement()
    {
        if (!this._targetElement)
            return;

        let targetFrame = WI.Rect.rectFromClientRect(this._targetElement.getBoundingClientRect());
        this.present(targetFrame.pad(2), this._preferredEdges);
    }
};
