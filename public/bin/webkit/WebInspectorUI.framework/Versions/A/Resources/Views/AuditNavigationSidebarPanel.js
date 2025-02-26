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

WI.AuditNavigationSidebarPanel = class AuditNavigationSidebarPanel extends WI.NavigationSidebarPanel
{
    constructor()
    {
        super("audit", WI.UIString("Audits"));
    }

    // Static

    static _createNavigationItemTitle()
    {
        return WI.UIString("Create", "Create @ Audit Tab Navigation Sidebar", "Title of button that creates a new audit.");
    }

    // Public

    showDefaultContentView()
    {
        let contentView = new WI.ContentView;

        if (WI.auditManager.editing) {
            let contentPlaceholder = WI.createMessageTextView(WI.UIString("Editing audits"));
            contentView.element.appendChild(contentPlaceholder);

            let descriptionElement = contentPlaceholder.appendChild(document.createElement("div"));
            descriptionElement.className = "description";
            descriptionElement.textContent = WI.UIString("Select an audit in the navigation sidebar to edit it.");

            let createAuditNavigationItem = new WI.ButtonNavigationItem("create-audit", WI.AuditNavigationSidebarPanel._createNavigationItemTitle(), "Images/Plus15.svg", 15, 15);
            createAuditNavigationItem.buttonStyle = WI.ButtonNavigationItem.Style.ImageAndText;
            createAuditNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._handleCreateButtonNavigationItemClicked, this);

            let createAuditHelpElement = WI.createNavigationItemHelp(WI.UIString("Press %s to create a new audit."), createAuditNavigationItem);
            createAuditHelpElement.classList.add("create-audit");
            contentPlaceholder.appendChild(createAuditHelpElement);

            let stopEditingAuditsNavigationItem = new WI.ButtonNavigationItem("stop-editing-audits", WI.UIString("Done"), "Images/Pencil.svg", 16, 16);
            stopEditingAuditsNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._handleEditButtonNavigationItemClicked, this);

            let stopEditingAuditsHelpElement = WI.createNavigationItemHelp(WI.UIString("Press %s to stop editing audits."), stopEditingAuditsNavigationItem);
            stopEditingAuditsHelpElement.classList.add("stop-editing-audits");
            contentPlaceholder.appendChild(stopEditingAuditsHelpElement);
        } else {
            let hasEnabledAudit = WI.auditManager.tests.length && WI.auditManager.tests.some((test) => !test.disabled && test.supported);

            let contentPlaceholder = WI.createMessageTextView(WI.UIString("No audit selected"));
            contentView.element.appendChild(contentPlaceholder);

            if (hasEnabledAudit) {
                let descriptionElement = contentPlaceholder.appendChild(document.createElement("div"));
                descriptionElement.className = "description";
                descriptionElement.textContent = WI.UIString("Select an audit in the navigation sidebar to view its results.");
            }

            let importAuditNavigationItem = new WI.ButtonNavigationItem("import-audit", WI.UIString("Import"), "Images/Import.svg", 15, 15);
            importAuditNavigationItem.title = WI.UIString("Import audit or result");
            importAuditNavigationItem.buttonStyle = WI.ButtonNavigationItem.Style.ImageAndText;
            importAuditNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._handleImportButtonNavigationItemClicked, this);

            let importAuditHelpElement = WI.createNavigationItemHelp(WI.UIString("Press %s to import an audit or a result."), importAuditNavigationItem);
            importAuditHelpElement.classList.add("import-audit");
            contentPlaceholder.appendChild(importAuditHelpElement);

            let startEditingAuditsNavigationItem = new WI.ButtonNavigationItem("start-editing-audits", WI.UIString("Edit"), "Images/Pencil.svg", 16, 16);
            startEditingAuditsNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._handleEditButtonNavigationItemClicked, this);

            let startEditingAuditsHelpElement = WI.createNavigationItemHelp(hasEnabledAudit ? WI.UIString("Press %s to start editing audits.") : WI.UIString("Press %s to enable audits."), startEditingAuditsNavigationItem);
            startEditingAuditsHelpElement.classList.add("start-editing-audits");
            contentPlaceholder.appendChild(startEditingAuditsHelpElement);
        }

        let versionContainer = contentView.element.appendChild(document.createElement("div"));
        versionContainer.classList.add("audit-version");

        let version = WI.AuditTestBase.Version;
        if (InspectorBackend.hasDomain("Audit"))
            version = Math.min(version, InspectorBackend.getVersion("Audit"));
        versionContainer.textContent = WI.UIString("Audit version: %s").format(version);

        versionContainer.appendChild(WI.auditManager.editing ? WI.ReferencePage.AuditTab.EditingAudits.createLinkElement() : WI.ReferencePage.AuditTab.createLinkElement());

        this.contentBrowser.showContentView(contentView);
    }

    // Popover delegate

    willDismissPopover(popover)
    {
        console.assert(popover instanceof WI.CreateAuditPopover, popover);

        let audit = popover.audit;
        if (!audit) {
            InspectorFrontendHost.beep();
            return;
        }

        WI.auditManager.addTest(audit, {save: true});

        WI.showRepresentedObject(audit);
    }

    // Protected

    initialLayout()
    {
        super.initialLayout();

        this.contentTreeOutline.allowsRepeatSelection = false;

        let controlsNavigationBar = new WI.NavigationBar;

        this._startStopButtonNavigationItem = new WI.ToggleButtonNavigationItem("start-stop-audit", WI.UIString("Start"), WI.UIString("Stop"), "Images/AuditStart.svg", "Images/AuditStop.svg", 13, 13);
        this._startStopButtonNavigationItem.buttonStyle = WI.ButtonNavigationItem.Style.ImageAndText;
        this._startStopButtonNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._handleStartStopButtonNavigationItemClicked, this);
        controlsNavigationBar.addNavigationItem(this._startStopButtonNavigationItem);

        this._createButtonNavigationItem = new WI.ButtonNavigationItem("create-audit", WI.AuditNavigationSidebarPanel._createNavigationItemTitle(), "Images/Plus15.svg", 15, 15);
        this._createButtonNavigationItem.buttonStyle = WI.ButtonNavigationItem.Style.ImageAndText;
        this._createButtonNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._handleCreateButtonNavigationItemClicked, this);
        controlsNavigationBar.addNavigationItem(this._createButtonNavigationItem);

        controlsNavigationBar.addNavigationItem(new WI.DividerNavigationItem);

        let importButtonNavigationItem = new WI.ButtonNavigationItem("import-audit", WI.UIString("Import"), "Images/Import.svg", 15, 15);
        importButtonNavigationItem.title = WI.UIString("Import audit or result");
        importButtonNavigationItem.buttonStyle = WI.ButtonNavigationItem.Style.ImageAndText;
        importButtonNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._handleImportButtonNavigationItemClicked, this);
        controlsNavigationBar.addNavigationItem(importButtonNavigationItem);

        this.addSubview(controlsNavigationBar);

        this._editButtonNavigationItem = new WI.ActivateButtonNavigationItem("edit-audits", WI.UIString("Edit"), WI.UIString("Done"), "Images/Pencil.svg", 16, 16);
        this._editButtonNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._handleEditButtonNavigationItemClicked, this);
        this.filterBar.addFilterNavigationItem(this._editButtonNavigationItem);

        for (let test of WI.auditManager.tests)
            this._addTest(test);

        WI.auditManager.results.forEach((result, i) => {
            this._addResult(result, i);
        });

        this._updateControlNavigationItems();
        this._updateEditNavigationItems();
        this._updateNoAuditsPlaceholder();

        WI.AuditTestGroup.addEventListener(WI.AuditTestGroup.Event.TestRemoved, this._handleAuditTestRemoved, this);

        WI.auditManager.addEventListener(WI.AuditManager.Event.EditingChanged, this._handleAuditManagerEditingChanged, this);
        WI.auditManager.addEventListener(WI.AuditManager.Event.RunningStateChanged, this._handleAuditManagerRunningStateChanged, this);
        WI.auditManager.addEventListener(WI.AuditManager.Event.TestAdded, this._handleAuditTestAdded, this);
        WI.auditManager.addEventListener(WI.AuditManager.Event.TestCompleted, this._handleAuditTestCompleted, this);
        WI.auditManager.addEventListener(WI.AuditManager.Event.TestRemoved, this._handleAuditTestRemoved, this);
        WI.auditManager.addEventListener(WI.AuditManager.Event.TestScheduled, this._handleAuditTestScheduled, this);

        this.contentTreeOutline.addEventListener(WI.TreeOutline.Event.SelectionDidChange, this._treeSelectionDidChange, this);
    }

    closed()
    {
        super.closed();

        if (this.didInitialLayout) {
            WI.auditManager.removeEventListener(WI.AuditManager.Event.EditingChanged, this._handleAuditManagerEditingChanged, this);
            WI.auditManager.removeEventListener(WI.AuditManager.Event.RunningStateChanged, this._handleAuditManagerRunningStateChanged, this);
            WI.auditManager.removeEventListener(WI.AuditManager.Event.TestAdded, this._handleAuditTestAdded, this);
            WI.auditManager.removeEventListener(WI.AuditManager.Event.TestCompleted, this._handleAuditTestCompleted, this);
            WI.auditManager.removeEventListener(WI.AuditManager.Event.TestRemoved, this._handleAuditTestRemoved, this);
            WI.auditManager.removeEventListener(WI.AuditManager.Event.TestScheduled, this._handleAuditTestScheduled, this);
        }
    }

    updateFilter()
    {
        super.updateFilter();

        if (!this.hasActiveFilters)
            this._updateNoAuditsPlaceholder();
    }

    hasCustomFilters()
    {
        return true;
    }

    matchTreeElementAgainstCustomFilters(treeElement, flags)
    {
        if (WI.auditManager.editing) {
            if (treeElement.representedObject instanceof WI.AuditTestResultBase || treeElement.hasAncestor(this._resultsFolderTreeElement) || treeElement === this._resultsFolderTreeElement)
                return false;
        } else {
            if (treeElement.representedObject instanceof WI.AuditTestBase && (treeElement.representedObject.disabled || !treeElement.representedObject.supported))
                return false;
        }

        return super.matchTreeElementAgainstCustomFilters(treeElement, flags);
    }

    // Private

    _addTest(test)
    {
        let treeElement = new WI.AuditTreeElement(test);

        if (this._resultsFolderTreeElement) {
            this.contentTreeOutline.insertChild(treeElement, this.contentTreeOutline.children.indexOf(this._resultsFolderTreeElement));
            this._resultsFolderTreeElement.hidden = !this._resultsFolderTreeElement.children.length || WI.auditManager.editing;
        } else
            this.contentTreeOutline.appendChild(treeElement);
    }

    _addResult(result, index)
    {
        this.element.classList.add("has-results");

        if (!this._resultsFolderTreeElement) {
            this._resultsFolderTreeElement = new WI.FolderTreeElement(WI.UIString("Results"));
            this.contentTreeOutline.appendChild(this._resultsFolderTreeElement);
        }

        this._resultsFolderTreeElement.expand();

        let resultFolderTreeElement = new WI.FolderTreeElement(WI.UIString("Run %d").format(index + 1));
        if (result instanceof WI.AuditTestResultBase) {
            resultFolderTreeElement.subtitle = WI.UIString("Imported");
            result = [result];
        }
        this._resultsFolderTreeElement.appendChild(resultFolderTreeElement);

        console.assert(this._resultsFolderTreeElement.children.length === WI.auditManager.results.length);

        for (let resultItem of result)
            resultFolderTreeElement.appendChild(new WI.AuditTreeElement(resultItem));
    }

    _updateControlNavigationItems()
    {
        this._startStopButtonNavigationItem.toggled = WI.auditManager.runningState === WI.AuditManager.RunningState.Active || WI.auditManager.runningState === WI.AuditManager.RunningState.Stopping;
        this._startStopButtonNavigationItem.enabled = WI.auditManager.tests.some((test) => !test.disabled && test.supported) && (WI.auditManager.runningState === WI.AuditManager.RunningState.Inactive || WI.auditManager.runningState === WI.AuditManager.RunningState.Active);
        this._startStopButtonNavigationItem.hidden = WI.auditManager.editing;

        this._createButtonNavigationItem.hidden = !WI.auditManager.editing;
    }

     _updateEditNavigationItems()
    {
        this._editButtonNavigationItem.label = WI.auditManager.editing ? this._editButtonNavigationItem.activatedToolTip : this._editButtonNavigationItem.defaultToolTip;
        this._editButtonNavigationItem.activated = WI.auditManager.editing;
        this._editButtonNavigationItem.enabled = WI.auditManager.editing || WI.auditManager.runningState === WI.AuditManager.RunningState.Inactive;
    }

    _updateNoAuditsPlaceholder()
    {
        if (WI.auditManager.editing || WI.auditManager.tests.some((test) => !test.disabled && test.supported)) {
            if (!this.hasActiveFilters)
                this.hideEmptyContentPlaceholder();
            return;
        }

        let contentPlaceholder = this.showEmptyContentPlaceholder(WI.UIString("No Enabled Audits"));
        contentPlaceholder.classList.add("no-enabled-audits");

        if (WI.auditManager.results.length) {
            // Move the placeholder to be the first element in the content area, where it will
            // be styled so that it doesn't obstruct the results elements.
            this.contentView.element.insertBefore(contentPlaceholder, this.contentView.element.firstChild);
        }
    }

    _handleAuditManagerEditingChanged(event)
    {
        let previousSelectedTreeElement = this.contentTreeOutline.selectedTreeElement;
        if (previousSelectedTreeElement) {
            if (WI.auditManager.editing) {
                if (!(previousSelectedTreeElement.representedObject instanceof WI.AuditTestBase))
                    previousSelectedTreeElement.deselect();
            } else {
                if (previousSelectedTreeElement.representedObject.disabled || !previousSelectedTreeElement.representedObject.supported)
                    previousSelectedTreeElement.deselect();
            }
        }

        this.updateFilter();

        if (!this.contentTreeOutline.selectedTreeElement)
            this.showDefaultContentView();

        this._updateControlNavigationItems();
        this._updateEditNavigationItems();
        this._updateNoAuditsPlaceholder();
    }

    _handleAuditManagerRunningStateChanged(event)
    {
        this._updateControlNavigationItems();
        this._updateEditNavigationItems();
    }

    _handleAuditTestAdded(event)
    {
        let {test} = event.data;

        this._addTest(test);

        this._updateControlNavigationItems();
        this._updateNoAuditsPlaceholder();
    }

    _handleAuditTestCompleted(event)
    {
        let {result, index} = event.data;
        this._addResult(result, index);

        this._updateControlNavigationItems();
        this._updateEditNavigationItems();
    }

    _handleAuditTestRemoved(event)
    {
        console.assert(WI.auditManager.editing);

        let {test} = event.data;

        let treeElement = this.treeElementForRepresentedObject(test);
        treeElement.parent.removeChild(treeElement);

        this._updateControlNavigationItems();
    }

    _handleAuditTestScheduled(event)
    {
        this._updateControlNavigationItems();
        this._updateEditNavigationItems();
    }

    _treeSelectionDidChange(event)
    {
        if (!this.selected)
            return;

        let treeElement = this.contentTreeOutline.selectedTreeElement;
        if (!treeElement || treeElement instanceof WI.FolderTreeElement) {
            this.showDefaultContentView();
            return;
        }

        let representedObject = treeElement.representedObject;
        if (representedObject instanceof WI.AuditTestCase || representedObject instanceof WI.AuditTestGroup
            || representedObject instanceof WI.AuditTestCaseResult || representedObject instanceof WI.AuditTestGroupResult) {
            WI.showRepresentedObject(representedObject);
            return;
        }

        console.error("Unknown tree element", treeElement);
    }

    _handleStartStopButtonNavigationItemClicked(event)
    {
        if (WI.auditManager.runningState === WI.AuditManager.RunningState.Inactive)
            WI.auditManager.start();
        else if (WI.auditManager.runningState === WI.AuditManager.RunningState.Active)
            WI.auditManager.stop();
    }

    _handleCreateButtonNavigationItemClicked(event)
    {
        console.assert(WI.auditManager.editing);

        let popover = new WI.CreateAuditPopover(this);
        popover.show(event.target.element, [WI.RectEdge.MAX_Y, WI.RectEdge.MAX_X, WI.RectEdge.MIN_X]);
    }

    _handleImportButtonNavigationItemClicked(event)
    {
        WI.FileUtilities.importJSON((result) => WI.auditManager.processJSON(result), {multiple: true});
    }

    _handleEditButtonNavigationItemClicked(event)
    {
        WI.auditManager.editing = !WI.auditManager.editing;
    }
};
