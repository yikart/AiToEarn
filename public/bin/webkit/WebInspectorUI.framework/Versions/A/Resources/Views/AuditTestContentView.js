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

WI.AuditTestContentView = class AuditTestContentView extends WI.ContentView
{
    constructor(representedObject)
    {
        console.assert(representedObject instanceof WI.AuditTestBase || representedObject instanceof WI.AuditTestResultBase);

        super(representedObject);

        // This class should not be instantiated directly. Create a concrete subclass instead.
        console.assert(this.constructor !== WI.AuditTestContentView && this instanceof WI.AuditTestContentView);

        this.element.classList.add("audit-test");
        if (this.representedObject.editable)
            this.element.classList.add("editable");

        if (WI.FileUtilities.canSave(WI.FileUtilities.SaveMode.FileVariants))
            this._saveMode = WI.FileUtilities.SaveMode.FileVariants;
        else if (WI.FileUtilities.canSave(WI.FileUtilities.SaveMode.SingleFile))
            this._saveMode = WI.FileUtilities.SaveMode.SingleFile;
        else
            this._saveMode = null;

        switch (this._saveMode) {
        case WI.FileUtilities.SaveMode.SingleFile:
            if (this.representedObject instanceof WI.AuditTestBase) {
                this._exportTestButtonNavigationItem = new WI.ButtonNavigationItem("audit-export-test", WI.UIString("Export Audit"), "Images/Export.svg", 15, 15);
                this._exportTestButtonNavigationItem.buttonStyle = WI.ButtonNavigationItem.Style.ImageAndText;
                this._exportTestButtonNavigationItem.visibilityPriority = WI.NavigationItem.VisibilityPriority.Low;
                this._exportTestButtonNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._handleExportTestButtonNavigationItemClicked, this);
            }

            this._exportResultButtonNavigationItem = new WI.ButtonNavigationItem("audit-export-result", WI.UIString("Export Result"), "Images/Export.svg", 15, 15);
            this._exportResultButtonNavigationItem.tooltip = WI.UIString("Export result (%s)", "Export result (%s) @ Audit Tab", "Tooltip for button that exports the most recent result after running an audit.").format(WI.saveKeyboardShortcut.displayName);
            this._exportResultButtonNavigationItem.buttonStyle = WI.ButtonNavigationItem.Style.ImageAndText;
            this._exportResultButtonNavigationItem.visibilityPriority = WI.NavigationItem.VisibilityPriority.Low;
            this._exportResultButtonNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._handleExportResultButtonNavigationItemClicked, this);
            break;

        case WI.FileUtilities.SaveMode.FileVariants:
            this._exportButtonNavigationItem = new WI.ButtonNavigationItem("audit-export", WI.UIString("Export"), "Images/Export.svg", 15, 15);
            this._exportButtonNavigationItem.tooltip = WI.UIString("Export (%s)").format(WI.saveKeyboardShortcut.displayName);
            this._exportButtonNavigationItem.buttonStyle = WI.ButtonNavigationItem.Style.ImageAndText;
            this._exportButtonNavigationItem.visibilityPriority = WI.NavigationItem.VisibilityPriority.Low;
            this._exportButtonNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._handleExportButtonNavigationItemClicked, this);
            break;
        }

        this._updateExportNavigationItems();

        this._headerView = new WI.View(document.createElement("header"));
        this._contentView = new WI.View(document.createElement("section"));
        this._placeholderElement = null;

        this._cachedName = this.representedObject.name;
        this._nameElement = null;

        this._descriptionElement = null;

        this._supportsInputElement = null;
        this._supportsWarningElement = null;

        this._shownResult = null;
    }

    // Public

    get navigationItems()
    {
        let navigationItems = [];
        if (this._exportTestButtonNavigationItem)
            navigationItems.push(this._exportTestButtonNavigationItem);
        if (this._exportResultButtonNavigationItem)
            navigationItems.push(this._exportResultButtonNavigationItem);
        if (this._exportButtonNavigationItem)
            navigationItems.push(this._exportButtonNavigationItem);
        return navigationItems;
    }

    // Protected

    get headerView() { return this._headerView; }
    get contentView() { return this._contentView; }

    get supportsSave()
    {
        return !!this._saveMode && !WI.auditManager.editing && !!this.representedObject.result;
    }

    get saveMode()
    {
        return this._saveMode;
    }

    get saveData()
    {
        return {customSaveHandler: () => { this._export(); }};
    }

    get result()
    {
        if (this.representedObject instanceof WI.AuditTestBase)
            return this.representedObject;
        return this.representedObject.result;
    }

    createNameElement(tagName)
    {
        console.assert(!this._nameElement);

        this._nameElement = document.createElement(tagName);
        this._nameElement.textContent = this.representedObject.name;
        this._nameElement.className = "name";

        if (this.representedObject.editable) {
            this._nameElement.spellcheck = false;

            this._nameElement.addEventListener("keydown", (event) => {
                this._handleEditorKeydown(event, this._descriptionElement);
            });

            this._nameElement.addEventListener("input", (event) => {
                console.assert(WI.auditManager.editing);

                let name = this._nameElement.textContent;
                if (!name.trim()) {
                    name = this._cachedName;
                    this._nameElement.removeChildren();
                }
                this.representedObject.name = name;
            });
        }

        return this._nameElement;
    }

    createDescriptionElement(tagName)
    {
        console.assert(!this._descriptionElement);

        this._descriptionElement = document.createElement(tagName);
        this._descriptionElement.textContent = this.representedObject.description;
        this._descriptionElement.className = "description";

        if (this.representedObject.editable) {
            this._descriptionElement.spellcheck = false;

            this._descriptionElement.addEventListener("keydown", (event) => {
                this._handleEditorKeydown(event, this._supportsInputElement);
            });

            this._descriptionElement.addEventListener("input", (event) => {
                console.assert(WI.auditManager.editing);

                let description = this._descriptionElement.textContent;
                if (!description.trim()) {
                    description = "";
                    this._descriptionElement.removeChildren();
                }
                this.representedObject.description = description;
            });
        }

        return this._descriptionElement;
    }

    createControlsTableElement()
    {
        console.assert(this.representedObject instanceof WI.AuditTestBase);
        console.assert(!this._supportsInputElement);
        console.assert(!this._supportsWarningElement);

        let controlsTableElement = document.createElement("table");
        controlsTableElement.className = "controls";

        let supportsRowElement = controlsTableElement.appendChild(document.createElement("tr"));
        supportsRowElement.className = "supports";

        let supportsHeaderElement = supportsRowElement.appendChild(document.createElement("th"));
        supportsHeaderElement.textContent = WI.unlocalizedString("supports");

        let supportsDataElement = supportsRowElement.appendChild(document.createElement("td"));

        this._supportsInputElement = supportsDataElement.appendChild(document.createElement("input"));
        this._supportsInputElement.type = "number";
        this._supportsInputElement.disabled = !this.representedObject.editable;
        this._supportsInputElement.min = 0;
        this._supportsInputElement.placeholder = Math.min(WI.AuditTestBase.Version, InspectorBackend.hasDomain("Audit") ? InspectorBackend.getVersion("Audit") : Infinity);
        if (!isNaN(this.representedObject.supports))
            this._supportsInputElement.value = this.representedObject.supports;

        if (this.representedObject.editable) {
            this._supportsInputElement.addEventListener("keydown", (event) => {
                this._handleEditorKeydown(event, this._setupEditorElement);
            });
        }

        this._supportsWarningElement = supportsDataElement.appendChild(document.createElement("span"));
        this._supportsWarningElement.className = "warning";

        if (this.representedObject.topLevelTest === this.representedObject) {
            let setupRowElement = controlsTableElement.appendChild(document.createElement("tr"));
            setupRowElement.className = "setup";

            let setupHeaderElement = setupRowElement.appendChild(document.createElement("th"));
            setupHeaderElement.textContent = WI.unlocalizedString("setup");

            let setupDataElement = setupRowElement.appendChild(document.createElement("td"));

            this._setupEditorElement = setupDataElement.appendChild(document.createElement("div"));
        }

        if (this.representedObject.editable) {
            this._supportsInputElement.addEventListener("input", (event) => {
                this.representedObject.supports = parseInt(this._supportsInputElement.value);

                this._updateSupportsInputState();
            });
        }

        return controlsTableElement;
    }

    initialLayout()
    {
        super.initialLayout();

        this.addSubview(this._headerView);
        this.addSubview(this._contentView);
    }

    layout()
    {
        super.layout();

        if (this.representedObject instanceof WI.AuditTestBase) {
            this.element.classList.toggle("unsupported", !this.representedObject.supported);
            this.element.classList.toggle("disabled", this.representedObject.disabled);
            this.element.classList.toggle("manager-editing", WI.auditManager.editing);

            if (this.representedObject.editable) {
                let contentEditable = WI.auditManager.editing ? "plaintext-only" : "inherit";
                this._nameElement.contentEditable = contentEditable;
                this._descriptionElement.contentEditable = contentEditable;
            }

            if (WI.auditManager.editing) {
                this._cachedName = this.representedObject.name;
                this._nameElement.dataset.name = this._cachedName;

                this._updateSupportsInputState();
                this._createSetupEditor();
            } else {
                this._nameElement.textContent ||= this._cachedName;

                this._setupEditorElement?.removeChildren();
            }
        }

        this.hidePlaceholder();
        this._updateExportNavigationItems();
    }

    attached()
    {
        super.attached();

        if (this.representedObject instanceof WI.AuditTestBase) {
            this.representedObject.addEventListener(WI.AuditTestBase.Event.Completed, this._handleTestChanged, this);
            this.representedObject.addEventListener(WI.AuditTestBase.Event.DisabledChanged, this._handleTestDisabledChanged, this);
            this.representedObject.addEventListener(WI.AuditTestBase.Event.Progress, this._handleTestChanged, this);
            this.representedObject.addEventListener(WI.AuditTestBase.Event.ResultChanged, this.handleResultChanged, this);
            this.representedObject.addEventListener(WI.AuditTestBase.Event.Scheduled, this._handleTestChanged, this);
            this.representedObject.addEventListener(WI.AuditTestBase.Event.Stopping, this._handleTestChanged, this);
            this.representedObject.addEventListener(WI.AuditTestBase.Event.SupportedChanged, this._handleTestSupportedChanged, this);

            WI.auditManager.addEventListener(WI.AuditManager.Event.EditingChanged, this._handleEditingChanged, this);
        }
    }

    detached()
    {
        if (this.representedObject instanceof WI.AuditTestBase) {
            this.representedObject.removeEventListener(WI.AuditTestBase.Event.Completed, this._handleTestChanged, this);
            this.representedObject.removeEventListener(WI.AuditTestBase.Event.DisabledChanged, this._handleTestDisabledChanged, this);
            this.representedObject.removeEventListener(WI.AuditTestBase.Event.Progress, this._handleTestChanged, this);
            this.representedObject.removeEventListener(WI.AuditTestBase.Event.ResultChanged, this.handleResultChanged, this);
            this.representedObject.removeEventListener(WI.AuditTestBase.Event.Scheduled, this._handleTestChanged, this);
            this.representedObject.removeEventListener(WI.AuditTestBase.Event.Stopping, this._handleTestChanged, this);
            this.representedObject.removeEventListener(WI.AuditTestBase.Event.SupportedChanged, this._handleTestSupportedChanged, this);

            WI.auditManager.removeEventListener(WI.AuditManager.Event.EditingChanged, this._handleEditingChanged, this);
            if (this.representedObject.editable && WI.auditManager.editing)
                this.saveEditedData();
        }

        super.detached();
    }

    handleResultChanged(event)
    {
        // Overridden by sub-classes.

        if (!WI.auditManager.editing)
            this.needsLayout();
    }

    get placeholderElement()
    {
        return this._placeholderElement;
    }

    set placeholderElement(placeholderElement)
    {
        this.hidePlaceholder();

        this._placeholderElement = placeholderElement;
    }

    saveEditedData()
    {
        console.assert(this.representedObject.editable, this.representedObject);
        if (this._setupCodeMirror)
            this.representedObject.setup = this._setupCodeMirror.getValue().trim();
    }

    showRunningPlaceholder()
    {
        // Overridden by sub-classes.

        console.assert(this.placeholderElement);

        this._showPlaceholder();
    }

    showStoppingPlaceholder()
    {
        if (!this.placeholderElement || !this.placeholderElement.__placeholderStopping) {
            this.placeholderElement = WI.createMessageTextView(WI.UIString("Stopping the \u201C%s\u201D audit").format(this.representedObject.name));
            this.placeholderElement.__placeholderStopping = true;

            let spinner = new WI.IndeterminateProgressSpinner;
            this.placeholderElement.appendChild(spinner.element);

            this.placeholderElement.appendChild(WI.ReferencePage.AuditTab.RunningAudits.createLinkElement());
        }

        this._showPlaceholder();
    }

    showNoResultPlaceholder()
    {
        if (!this.placeholderElement || !this.placeholderElement.__placeholderNoResult) {
            this.placeholderElement = WI.createMessageTextView(WI.UIString("No Result"));
            this.placeholderElement.__placeholderNoResult = true;

            let startNavigationItem = new WI.ButtonNavigationItem("run-audit", WI.UIString("Start"), "Images/AuditStart.svg", 15, 15);
            startNavigationItem.buttonStyle = WI.ButtonNavigationItem.Style.ImageAndText;
            startNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, function(event) {
                WI.auditManager.start([this.representedObject]);
            }, this);

            let importHelpElement = WI.createNavigationItemHelp(WI.UIString("Press %s to start running the audit."), startNavigationItem);
            this.placeholderElement.appendChild(importHelpElement);

            this.placeholderElement.appendChild(WI.ReferencePage.AuditTab.RunningAudits.createLinkElement());
        }

        this._showPlaceholder();
    }

    showNoResultDataPlaceholder()
    {
        if (!this.placeholderElement || !this.placeholderElement.__placeholderNoResultData) {
            let result = this.representedObject.result;
            if (!result) {
                this.showNoResultPlaceholder();
                return;
            }

            let message = null;
            if (result.didError)
                message = WI.UIString("The \u201C%s\u201D audit threw an error");
            else if (result.didFail)
                message = WI.UIString("The \u201C%s\u201D audit failed");
            else if (result.didWarn)
                message = WI.UIString("The \u201C%s\u201D audit resulted in a warning");
            else if (result.didPass)
                message = WI.UIString("The \u201C%s\u201D audit passed");
            else if (result.unsupported)
                message = WI.UIString("The \u201C%s\u201D audit is unsupported");
            else {
                console.error("Unknown result", result);
                return;
            }

            this.placeholderElement = WI.createMessageTextView(message.format(this.representedObject.name), result.didError);
            this.placeholderElement.__placeholderNoResultData = true;

            this.placeholderElement.appendChild(WI.ReferencePage.AuditTab.AuditResults.createLinkElement());
        }

        this._showPlaceholder();
    }

    showFilteredPlaceholder()
    {
        if (!this.placeholderElement || !this.placeholderElement.__placeholderFiltered) {
            this.placeholderElement = WI.createMessageTextView(WI.UIString("No Filter Results"));
            this.placeholderElement.__placeholderFiltered = true;

            let buttonElement = this.placeholderElement.appendChild(document.createElement("button"));
            buttonElement.textContent = WI.UIString("Clear Filters");
            buttonElement.addEventListener("click", () => {
                this.resetFilter();
                this.needsLayout();
            });

            this.placeholderElement.appendChild(WI.ReferencePage.AuditTab.createLinkElement());
        }

        this._showPlaceholder();
    }

    hidePlaceholder()
    {
        this.element.classList.remove("showing-placeholder");
        if (this.placeholderElement)
            this.placeholderElement.remove();
    }

    applyFilter(levels)
    {
        let hasMatch = false;
        for (let view of this.contentView.subviews) {
            let matches = view.applyFilter(levels);
            view.element.classList.toggle("filtered", !matches);

            if (matches)
                hasMatch = true;
        }

        this.element.classList.toggle("no-matches", !hasMatch);

        if (!Array.isArray(levels))
            return true;

        let result = this.representedObject.result;
        if (!result)
            return false;

        if ((levels.includes(WI.AuditTestCaseResult.Level.Error) && result.didError)
            || (levels.includes(WI.AuditTestCaseResult.Level.Fail) && result.didFail)
            || (levels.includes(WI.AuditTestCaseResult.Level.Warn) && result.didWarn)
            || (levels.includes(WI.AuditTestCaseResult.Level.Pass) && result.didPass)
            || (levels.includes(WI.AuditTestCaseResult.Level.Unsupported) && result.unsupported)) {
            return true;
        }

        return false;
    }

    resetFilter()
    {
        for (let view of this.contentView.subviews)
            view.element.classList.remove("filtered");

        this.element.classList.remove("no-matches");
    }

    // Private

    _export()
    {
        let object = this.representedObject;
        if (this._saveMode === WI.FileUtilities.SaveMode.SingleFile)
            object = object.result;
        WI.auditManager.export(this._saveMode, object);
    }

    _updateExportNavigationItems()
    {
        if (this._exportTestButtonNavigationItem)
            this._exportTestButtonNavigationItem.enabled = !WI.auditManager.editing;

        if (this._exportResultButtonNavigationItem)
            this._exportResultButtonNavigationItem.enabled = !WI.auditManager.editing && this.representedObject.result;

        if (this._exportButtonNavigationItem)
            this._exportButtonNavigationItem.enabled = this._saveMode && !WI.auditManager.editing;
    }

    _updateSupportsInputState()
    {
        console.assert(WI.auditManager.editing);

        this._supportsInputElement.autosize(4);

        this._supportsWarningElement.removeChildren();
        if (this.representedObject.supports > WI.AuditTestBase.Version)
            this._supportsWarningElement.textContent = WI.UIString("too new to run in this Web Inspector", "too new to run in this Web Inspector @ Audit Tab", "Warning text shown if the version number in the 'supports' input is too new.");
        else if (InspectorBackend.hasDomain("Audit") && this._supports > InspectorBackend.getVersion("Audit"))
            this._supportsWarningElement.textContent = WI.UIString("too new to run in the inspected page", "too new to run in the inspected page @ Audit Tab", "Warning text shown if the version number in the 'supports' input is too new.");
    }

    _createSetupEditor()
    {
        if (!this._setupEditorElement)
            return;

        let setupEditorElement = document.createElement(this._setupEditorElement.nodeName);
        setupEditorElement.className = "editor";

        // Give the rest of the view a chance to load.
        setTimeout(() => {
            this._setupCodeMirror = WI.CodeMirrorEditor.create(setupEditorElement, {
                autoCloseBrackets: true,
                lineNumbers: true,
                lineWrapping: true,
                matchBrackets: true,
                mode: "text/javascript",
                readOnly: this.representedObject.editable ? false : "nocursor",
                styleSelectedText: true,
                value: this.representedObject.setup,
            });
        });

        this._setupEditorElement.parentNode.replaceChild(setupEditorElement, this._setupEditorElement);
        this._setupEditorElement = setupEditorElement;
    }

    _showPlaceholder()
    {
        this.element.classList.add("showing-placeholder");
        this.contentView.element.appendChild(this.placeholderElement);
    }

    _handleEditorKeydown(event, nextEditor)
    {
        console.assert(WI.auditManager.editing);

        switch (event.keyCode) {
        case WI.KeyboardShortcut.Key.Enter.keyCode:
            if (nextEditor) {
                nextEditor.focus();
                break;
            }
            // fallthrough

        case WI.KeyboardShortcut.Key.Escape.keyCode:
            event.target.blur();
            break;

        default:
            return;
        }

        event.preventDefault();
    }

    _handleExportTestButtonNavigationItemClicked(event)
    {
        WI.auditManager.export(WI.FileUtilities.SaveMode.SingleFile, this.representedObject);
    }

    _handleExportResultButtonNavigationItemClicked(event)
    {
        WI.auditManager.export(WI.FileUtilities.SaveMode.SingleFile, this.representedObject.result);
    }

    _handleExportButtonNavigationItemClicked(event)
    {
        WI.auditManager.export(WI.FileUtilities.SaveMode.FileVariants, this.representedObject);
    }

    _handleTestChanged(event)
    {
        this.needsLayout();
    }

    _handleTestDisabledChanged(event)
    {
        console.assert(WI.auditManager.editing);

        this.element.classList.toggle("disabled", this.representedObject.disabled);
    }

    _handleTestSupportedChanged(event)
    {
        console.assert(WI.auditManager.editing);

        this.element.classList.toggle("unsupported", !this.representedObject.supported);
    }

    _handleEditingChanged(event)
    {
        this.needsLayout();

        // We only need to save changes when editing is done. No need to save it after entering the editing mode.
        if (!WI.auditManager.editing && this.representedObject.editable)
            this.saveEditedData();

        this._updateExportNavigationItems();
    }
};
