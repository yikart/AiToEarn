/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
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

WI.BreakpointPopover = class BreakpointPopover extends WI.Popover
{
    constructor(delegate, breakpoint)
    {
        console.assert(!breakpoint || breakpoint instanceof WI.Breakpoint, breakpoint);

        super(delegate);

        this._breakpoint = breakpoint || null;

        console.assert(this._breakpoint?.constructor.ReferencePage || this.constructor.ReferencePage, "Should have a link to a reference page.");

        this._contentElement = null;
        this._conditionCodeMirror = null;
        this._ignoreCountInputElement = null;
        this._actionsContainerElement = null;
        this._actionViews = [];
        this._optionsRowElement = null;
        this._autoContinueCheckboxElement = null;

        this._targetElement = null;

        this.windowResizeHandler = this._presentOverTargetElement.bind(this);
    }

    // Static

    static show(breakpoint, targetElement)
    {
        const delegate = null;
        let popover;
        if (breakpoint instanceof WI.EventBreakpoint)
            popover = new WI.EventBreakpointPopover(delegate, breakpoint);
        else if (breakpoint instanceof WI.URLBreakpoint)
            popover = new WI.URLBreakpointPopover(delegate, breakpoint);
        else if (breakpoint instanceof WI.SymbolicBreakpoint)
            popover = new WI.SymbolicBreakpointPopover(delegate, breakpoint);
        else
            popover = new WI.BreakpointPopover(delegate, breakpoint);
        popover.show(targetElement);
    }

    static appendContextMenuItems(contextMenu, breakpoint, targetElement)
    {
        if (breakpoint.editable && targetElement) {
            contextMenu.appendItem(WI.UIString("Edit Breakpoint\u2026"), () => {
                WI.BreakpointPopover.show(breakpoint, targetElement);
            });
        }

        if (!breakpoint.disabled) {
            contextMenu.appendItem(WI.UIString("Disable Breakpoint"), () => {
                breakpoint.disabled = !breakpoint.disabled;
            });

            if (breakpoint.editable && breakpoint.autoContinue) {
                contextMenu.appendItem(WI.UIString("Cancel Automatic Continue"), () => {
                    breakpoint.autoContinue = !breakpoint.autoContinue;
                });
            }
        } else {
            contextMenu.appendItem(WI.UIString("Enable Breakpoint"), () => {
                breakpoint.disabled = !breakpoint.disabled;
            });
        }

        if (breakpoint.editable && !breakpoint.autoContinue && !breakpoint.disabled && breakpoint.actions.length) {
            contextMenu.appendItem(WI.UIString("Set to Automatically Continue"), () => {
                breakpoint.autoContinue = !breakpoint.autoContinue;
            });
        }

        if (breakpoint.removable) {
            contextMenu.appendItem(WI.UIString("Delete Breakpoint"), () => {
                breakpoint.remove();
            });
        } else {
            contextMenu.appendItem(WI.UIString("Reset Breakpoint", "Reset Breakpoint @ Breakpoint Context Menu", "Context menu action for resetting the breakpoint to its initial configuration."), () => {
                breakpoint.reset();
            });
        }

        if (breakpoint instanceof WI.JavaScriptBreakpoint && breakpoint.sourceCodeLocation.hasMappedLocation()) {
            contextMenu.appendSeparator();
            contextMenu.appendItem(WI.UIString("Reveal in Original Resource"), () => {
                const options = {
                    ignoreNetworkTab: true,
                    ignoreSearchTab: true,
                };
                WI.showOriginalOrFormattedSourceCodeLocation(breakpoint.sourceCodeLocation, options);
            });
        }
    }

    // Public

    get breakpoint() { return this._breakpoint; }

    show(targetElement)
    {
        this._targetElement = targetElement;

        this._contentElement = document.createElement("div");
        this._contentElement.classList.add("edit-breakpoint-popover-content");

        if (this._breakpoint) {
            let toggleLabelElement = this._contentElement.appendChild(document.createElement("label"));
            toggleLabelElement.className = "toggle";

            let toggleCheckboxElement = toggleLabelElement.appendChild(document.createElement("input"));
            toggleCheckboxElement.type = "checkbox";
            toggleCheckboxElement.checked = !this._breakpoint.disabled;
            toggleCheckboxElement.addEventListener("change", this._handleEnabledCheckboxChange.bind(this));

            toggleLabelElement.appendChild(document.createTextNode(this._breakpoint.displayName));
        }

        this._tableElement = this._contentElement.appendChild(document.createElement("table"));

        if (!this._breakpoint)
            this.populateContent();

        if (this._breakpoint?.editable || this.constructor.supportsEditing) {
            let conditionLabelElement = document.createElement("label");
            conditionLabelElement.textContent = WI.UIString("Condition");

            let conditionEditorElement = document.createElement("div");
            conditionEditorElement.classList.add("editor", WI.SyntaxHighlightedStyleClassName);

            this._conditionCodeMirror = WI.CodeMirrorEditor.create(conditionEditorElement, {
                extraKeys: {Tab: false},
                lineWrapping: false,
                mode: "text/javascript",
                matchBrackets: true,
                placeholder: WI.UIString("Conditional expression"),
                scrollbarStyle: null,
                value: this._breakpoint?.condition || "",
            });

            let conditionCodeMirrorInputField = this._conditionCodeMirror.getInputField();
            conditionCodeMirrorInputField.id = "edit-breakpoint-popover-content-condition";
            conditionLabelElement.setAttribute("for", conditionCodeMirrorInputField.id);

            this.addRow("condition", conditionLabelElement, conditionEditorElement);

            this._conditionCodeMirror.addKeyMap({
                "Enter": () => { this.dismiss(); },
                "Esc": () => { this.dismiss(); },
            });

            this._conditionCodeMirror.on("beforeChange", this._handleConditionCodeMirrorBeforeChange.bind(this));
            if (this._breakpoint)
                this._conditionCodeMirror.on("change", this._handleConditionCodeMirrorChange.bind(this));

            let completionController = new WI.CodeMirrorCompletionController(this.codeMirrorCompletionControllerMode, this._conditionCodeMirror, this);
            completionController.addExtendedCompletionProvider("javascript", WI.javaScriptRuntimeCompletionProvider);

            let ignoreCountLabelElement = document.createElement("label");
            ignoreCountLabelElement.textContent = WI.UIString("Ignore");

            let ignoreCountContentFragment = document.createDocumentFragment();

            this._ignoreCountInputElement = ignoreCountContentFragment.appendChild(document.createElement("input"));
            this._ignoreCountInputElement.id = "edit-breakpoint-popover-ignore-count";
            this._ignoreCountInputElement.type = "number";
            this._ignoreCountInputElement.min = 0;
            this._ignoreCountInputElement.value = this._breakpoint?.ignoreCount || 0;
            this._ignoreCountInputElement.addEventListener("change", this._handleIgnoreCountInputChange.bind(this));

            this._ignoreCountText = ignoreCountContentFragment.appendChild(document.createElement("label"));
            this._updateIgnoreCountText();

            ignoreCountLabelElement.setAttribute("for", this._ignoreCountInputElement.id);
            this._ignoreCountText.setAttribute("for", this._ignoreCountInputElement.id);

            this.addRow("ignore-count", ignoreCountLabelElement, ignoreCountContentFragment);

            let actionsLabelElement = document.createElement("label");
            actionsLabelElement.textContent = WI.UIString("Action");

            this._actionsContainerElement = document.createElement("div");

            if (!this._breakpoint?.actions.length)
                this._createAddActionButton();
            else {
                this._contentElement.classList.add("wide");

                for (let i = 0; i < this._breakpoint.actions.length; ++i) {
                    let breakpointActionView = new WI.BreakpointActionView(this._breakpoint.actions[i], this, {omitFocus: true});
                    this._insertBreakpointActionView(breakpointActionView);
                }
            }

            this.addRow("actions", actionsLabelElement, this._actionsContainerElement);

            let optionsLabelElement = document.createElement("label");
            optionsLabelElement.textContent = WI.UIString("Options");

            let optionsDocumentFragment = document.createDocumentFragment();

            this._autoContinueCheckboxElement = optionsDocumentFragment.appendChild(document.createElement("input"));
            this._autoContinueCheckboxElement.id = "edit-breakpoint-popover-auto-continue";
            this._autoContinueCheckboxElement.type = "checkbox";
            this._autoContinueCheckboxElement.checked = this._breakpoint?.autoContinue || false;
            this._autoContinueCheckboxElement.addEventListener("change", this._handleAutoContinueCheckboxChange.bind(this));

            let optionsCheckboxLabel = optionsDocumentFragment.appendChild(document.createElement("label"));
            optionsCheckboxLabel.textContent = WI.UIString("Automatically continue after evaluating");

            optionsLabelElement.setAttribute("for", this._autoContinueCheckboxElement.id);
            optionsCheckboxLabel.setAttribute("for", this._autoContinueCheckboxElement.id);

            this._optionsRowElement = this.addRow("options", optionsLabelElement, optionsDocumentFragment);
            if (!this._breakpoint?.actions.length)
                this._optionsRowElement.classList.add("hidden");

            // CodeMirror needs to refresh after the popover is shown as otherwise it doesn't appear.
            setTimeout(() => {
                this._conditionCodeMirror.refresh();
                if (this._breakpoint)
                    this._conditionCodeMirror.focus();

                this.update();
            });
        }

        let referencePage = this._breakpoint?.constructor.ReferencePage || this.constructor.ReferencePage;
        if (this._breakpoint)
            referencePage = referencePage.Configuration;
        this._contentElement.appendChild(referencePage.createLinkElement());

        this.content = this._contentElement;

        this._presentOverTargetElement();
    }

    dismiss()
    {
        this._breakpoint ??= this.createBreakpoint({
            condition: this._conditionCodeMirror ? this._conditionCodeMirror.getValue().trim() : "",
            actions: this._actionViews.map((breakpointActionView) => breakpointActionView.action),
            ignoreCount: this._ignoreCountInputElement ? this._parseIgnoreCountNumber() : 0,
            autoContinue: this._autoContinueCheckboxElement ? this._autoContinueCheckboxElement.checked : false,
        });

        // Remove Evaluate and Probe actions that have no data.
        let emptyActions = this._breakpoint?.actions.filter(function(action) {
            if (action.type === WI.BreakpointAction.Type.Sound)
                return false;
            return !action.data?.trim();
        }) || [];
        for (let action of emptyActions)
            this._breakpoint.removeAction(action);

        super.dismiss();
    }

    // CodeMirrorCompletionController delegate

    completionControllerShouldAllowEscapeCompletion()
    {
        return false;
    }

    // BreakpointActionView delegate

    breakpointActionViewCodeMirrorCompletionControllerMode(breakpointActionView, codeMirror)
    {
        return this.codeMirrorCompletionControllerMode;
    }

    breakpointActionViewAppendActionView(breakpointActionView, newBreakpointAction)
    {
        this._breakpoint?.addAction(newBreakpointAction, {precedingAction: breakpointActionView.action});

        let newBreakpointActionView = new WI.BreakpointActionView(newBreakpointAction, this);

        let index = this._actionViews.indexOf(breakpointActionView) + 1;
        this._insertBreakpointActionView(newBreakpointActionView, index);
        this._optionsRowElement.classList.remove("hidden");

        this.update();
    }

    breakpointActionViewRemoveActionView(breakpointActionView)
    {
        this._breakpoint?.removeAction(breakpointActionView.action);

        breakpointActionView.element.remove();
        this._actionViews.remove(breakpointActionView);

        if (!this._actionViews.length) {
            this._createAddActionButton();
            this._optionsRowElement.classList.add("hidden");
            this._autoContinueCheckboxElement.checked = false;
        }

        this.update();
    }

    breakpointActionViewResized(breakpointActionView)
    {
        this.update();
    }

    // Protected

    get codeMirrorCompletionControllerMode()
    {
        // Overridden by subclasses if needed.

        if (this._breakpoint === WI.debuggerManager.allExceptionsBreakpoint || this._breakpoint === WI.debuggerManager.uncaughtExceptionsBreakpoint)
            return WI.CodeMirrorCompletionController.Mode.ExceptionBreakpoint;

        return WI.CodeMirrorCompletionController.Mode.Basic;
    }

    populateContent()
    {
        throw WI.NotImplementedError.subclassMustOverride();
    }

    addRow(className, label, content)
    {
        let rowElement = this._tableElement.appendChild(document.createElement("tr"));
        rowElement.className = className;

        let headerElement = rowElement.appendChild(document.createElement("th"));
        headerElement.append(label);

        let dataElement = rowElement.appendChild(document.createElement("td"));
        dataElement.append(content);

        return rowElement;
    }

    createBreakpoint(options = {})
    {
        throw WI.NotImplementedError.subclassMustOverride();
    }

    // Private

    _presentOverTargetElement()
    {
        if (!this._targetElement)
            return;

        let targetFrame = WI.Rect.rectFromClientRect(this._targetElement.getBoundingClientRect());
        this.present(targetFrame.pad(2), [WI.RectEdge.MAX_Y, WI.RectEdge.MIN_Y, WI.RectEdge.MAX_X]);
    }

    _parseIgnoreCountNumber()
    {
        let ignoreCount = 0;
        if (this._ignoreCountInputElement.value) {
            ignoreCount = parseInt(this._ignoreCountInputElement.value, 10);
            if (isNaN(ignoreCount) || ignoreCount < 0)
                ignoreCount = 0;
        }
        return ignoreCount;
    }

    _updateIgnoreCountText()
    {
        if (this._parseIgnoreCountNumber() === 1)
            this._ignoreCountText.textContent = WI.UIString("time before stopping");
        else
            this._ignoreCountText.textContent = WI.UIString("times before stopping");
    }

    _createAddActionButton()
    {
        this._contentElement.classList.remove("wide");
        this._actionsContainerElement.removeChildren();

        let addActionButton = this._actionsContainerElement.appendChild(document.createElement("button"));
        addActionButton.textContent = WI.UIString("Add Action");
        addActionButton.addEventListener("click", this._handleAddActionButtonClick.bind(this));
    }

    _insertBreakpointActionView(breakpointActionView, index = this._actionViews.length)
    {
        if (index >= this._actionViews.length) {
            this._actionsContainerElement.appendChild(breakpointActionView.element);
            this._actionViews.push(breakpointActionView);
        } else {
            this._actionsContainerElement.insertBefore(breakpointActionView.element, this._actionViews[index].element);
            this._actionViews.splice(index, 0, breakpointActionView)
        }
    }

    _handleEnabledCheckboxChange(event)
    {
        this._breakpoint.disabled = !event.target.checked;
    }

    _handleConditionCodeMirrorBeforeChange(codeMirror, change)
    {
        if (change.update) {
            let newText = change.text.join("").replace(/\n/g, "");
            change.update(change.from, change.to, [newText]);
        }

        return true;
    }

    _handleConditionCodeMirrorChange(codeMirror, change)
    {
        this._breakpoint.condition = this._conditionCodeMirror.getValue().trim();
    }

    _handleIgnoreCountInputChange(event)
    {
        let ignoreCount = this._parseIgnoreCountNumber();
        this._ignoreCountInputElement.value = ignoreCount;

        if (this._breakpoint)
            this._breakpoint.ignoreCount = ignoreCount;

        this._updateIgnoreCountText();
    }

    _handleAddActionButtonClick(event)
    {
        this._contentElement.classList.add("wide");

        this._actionsContainerElement.removeChildren();

        let action = new WI.BreakpointAction(WI.BreakpointAction.Type.Evaluate);
        this._breakpoint?.addAction(action);

        let breakpointActionView = new WI.BreakpointActionView(action, this);
        this._insertBreakpointActionView(breakpointActionView);

        this._optionsRowElement.classList.remove("hidden");

        setTimeout(() => {
            this.update();
        });
    }

    _handleAutoContinueCheckboxChange(event)
    {
        if (this._breakpoint)
            this._breakpoint.autoContinue = this._autoContinueCheckboxElement.checked;
    }
};
