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

WI.AuditTestGroupContentView = class AuditTestGroupContentView extends WI.AuditTestContentView
{
    constructor(representedObject)
    {
        console.assert(representedObject instanceof WI.AuditTestGroup || representedObject instanceof WI.AuditTestGroupResult);

        super(representedObject);

        this.element.classList.add("audit-test-group");

        this._levelScopeBar = null;

        this._viewForSubobject = new Map;
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

        this.representedObject.addTest(audit);
    }

    // Protected

    createControlsTableElement()
    {
        let controlsTableElement = super.createControlsTableElement();

        let actionsRowElement = controlsTableElement.appendChild(document.createElement("tr"));
        actionsRowElement.className = "actions";

        let actionsHeaderElement = controlsTableElement.appendChild(document.createElement("th"));
        let actionsDataElement = controlsTableElement.appendChild(document.createElement("td"));

        let addTestCaseButtonElement = actionsDataElement.appendChild(document.createElement("button"));
        addTestCaseButtonElement.disabled = !this.representedObject.editable;
        addTestCaseButtonElement.textContent = WI.UIString("Add Test Case", "Add Test Case @ Audit Tab - Group", "Text of button to add a new audit test case to the currently shown audit group.");
        addTestCaseButtonElement.addEventListener("click", (event) => {
            console.assert(WI.auditManager.editing);

            let popover = new WI.CreateAuditPopover(this);
            popover.show(addTestCaseButtonElement, [WI.RectEdge.MAX_Y, WI.RectEdge.MAX_X, WI.RectEdge.MIN_X]);
        });

        return controlsTableElement;
    }

    initialLayout()
    {
        super.initialLayout();

        let informationContainer = this.headerView.element.appendChild(document.createElement("div"));
        informationContainer.classList.add("information");

        let nameContainer = informationContainer.appendChild(document.createElement("h1"));

        nameContainer.appendChild(this.createNameElement("span"));

        informationContainer.appendChild(this.createDescriptionElement("p"));

        if (this.representedObject instanceof WI.AuditTestGroup)
            informationContainer.appendChild(this.createControlsTableElement());

        this._levelNavigationBar = new WI.NavigationBar(document.createElement("nav"));
        this.headerView.addSubview(this._levelNavigationBar);

        this._percentageContainer = this.headerView.element.appendChild(document.createElement("div"));
        this._percentageContainer.classList.add("percentage-pass");
        this._percentageContainer.hidden = true;

        this._percentageTextElement = document.createElement("span");

        const format = WI.UIString("%s%%", "Percentage (of audits)", "The number of tests that passed expressed as a percentage, followed by a literal %.");
        String.format(format, [this._percentageTextElement], String.standardFormatters, this._percentageContainer, (a, b) => {
            a.append(b);
            return a;
        });

        this._updateClassList();
    }

    layout()
    {
        if (this.layoutReason !== WI.View.LayoutReason.Dirty)
            return;

        super.layout();

        if (WI.auditManager.editing) {
            if (this._levelScopeBar) {
                this._levelNavigationBar.removeNavigationItem(this._levelScopeBar);
                this._levelScopeBar = null;
            }

            this._percentageContainer.hidden = true;

            this.resetFilter();
            return;
        }

        let result = this.representedObject.result;
        if (!result) {
            if (this._levelScopeBar) {
                this._levelNavigationBar.removeNavigationItem(this._levelScopeBar);
                this._levelScopeBar = null;
            }

            this._percentageContainer.hidden = true;
            this._percentageTextElement.textContent = "";

            if (this.representedObject.runningState === WI.AuditManager.RunningState.Inactive)
                this.showNoResultPlaceholder();
            else if (this.representedObject.runningState === WI.AuditManager.RunningState.Active)
                this.showRunningPlaceholder();
            else if (this.representedObject.runningState === WI.AuditManager.RunningState.Stopping)
                this.showStoppingPlaceholder();

            return;
        }

        let levelCounts = result.levelCounts;
        let totalCount = Object.values(levelCounts).reduce((accumulator, current) => accumulator + current);
        this._percentageTextElement.textContent = Math.floor(100 * levelCounts[WI.AuditTestCaseResult.Level.Pass] / totalCount);
        this._percentageContainer.hidden = false;

        if (!this._levelScopeBar) {
            let scopeBarItems = [];

            let addScopeBarItem = (level, labelSingular, labelPlural) => {
                let count = levelCounts[level];
                if (isNaN(count) || count <= 0)
                    return;

                let label = (labelPlural && count !== 1) ? labelPlural : labelSingular;
                let scopeBarItem = new WI.ScopeBarItem(level, label.format(count), {
                    className: level,
                    exclusive: false,
                    independent: true,
                });
                scopeBarItem.selected = true;

                scopeBarItem.element.insertBefore(document.createElement("img"), scopeBarItem.element.firstChild);

                scopeBarItems.push(scopeBarItem);
            };

            addScopeBarItem(WI.AuditTestCaseResult.Level.Pass, WI.UIString("%d Passed", "%d Passed (singular)", ""), WI.UIString("%d Passed", "%d Passed (plural)", ""));
            addScopeBarItem(WI.AuditTestCaseResult.Level.Warn, WI.UIString("%d Warning"), WI.UIString("%d Warnings"));
            addScopeBarItem(WI.AuditTestCaseResult.Level.Fail, WI.UIString("%d Failed", "%d Failed (singular)", ""), WI.UIString("%d Failed", "%d Failed (plural)", ""));
            addScopeBarItem(WI.AuditTestCaseResult.Level.Error, WI.UIString("%d Error"), WI.UIString("%d Errors"));
            addScopeBarItem(WI.AuditTestCaseResult.Level.Unsupported, WI.UIString("%d Unsupported", "%d Unsupported (singular)", ""), WI.UIString("%d Unsupported", "%d Unsupported (plural)", ""));

            this._levelScopeBar = new WI.ScopeBar(null, scopeBarItems);
            this._levelScopeBar.addEventListener(WI.ScopeBar.Event.SelectionChanged, this._handleLevelScopeBarSelectionChanged, this);
            this._levelNavigationBar.addNavigationItem(this._levelScopeBar);
        }

        if (this.applyFilter())
            this.hidePlaceholder();
        else
            this.showFilteredPlaceholder();
    }

    attached()
    {
        super.attached();

        if (this.representedObject instanceof WI.AuditTestGroup) {
            this.representedObject.addEventListener(WI.AuditTestBase.Event.Progress, this._handleTestGroupProgress, this);
            this.representedObject.addEventListener(WI.AuditTestBase.Event.Scheduled, this._handleTestGroupScheduled, this);

            if (this.representedObject.editable) {
                this.representedObject.addEventListener(WI.AuditTestGroup.Event.TestAdded, this._handleTestGroupTestAdded, this);
                this.representedObject.addEventListener(WI.AuditTestGroup.Event.TestRemoved, this._handleTestGroupTestRemoved, this);
            }
        }

        console.assert(!this._viewForSubobject.size);
        for (let subobject of this._subobjects())
            this._addTest(subobject);
    }

    detached()
    {
        if (this.representedObject instanceof WI.AuditTestGroup) {
            this.representedObject.removeEventListener(WI.AuditTestBase.Event.Progress, this._handleTestGroupProgress, this);
            this.representedObject.removeEventListener(WI.AuditTestBase.Event.Scheduled, this._handleTestGroupScheduled, this);

            if (this.representedObject.editable) {
                this.representedObject.removeEventListener(WI.AuditTestGroup.Event.TestAdded, this._handleTestGroupTestAdded, this);
                this.representedObject.removeEventListener(WI.AuditTestGroup.Event.TestRemoved, this._handleTestGroupTestRemoved, this);
            }
        }

        this.contentView.removeAllSubviews();
        this._viewForSubobject.clear();

        super.detached();
    }

    applyFilter(levels)
    {
        if (this._levelScopeBar && !levels)
            levels = this._levelScopeBar.selectedItems.map((item) => item.id);

        this._updateLevelScopeBar(levels);

        return super.applyFilter(levels);
    }

    resetFilter()
    {
        this._updateLevelScopeBar(Object.values(WI.AuditTestCaseResult.Level));

        super.resetFilter();
    }

    showRunningPlaceholder()
    {
        if (!this.placeholderElement || !this.placeholderElement.__placeholderRunning) {
            this.placeholderElement = WI.createMessageTextView(WI.UIString("Running the \u201C%s\u201D audit").format(this.representedObject.name));
            this.placeholderElement.__placeholderRunning = true;

            this.placeholderElement.__progress = document.createElement("progress");
            this.placeholderElement.__progress.value = 0;
            this.placeholderElement.appendChild(this.placeholderElement.__progress);

            let stopAuditNavigationItem = new WI.ButtonNavigationItem("stop-audit", WI.UIString("Stop"), "Images/AuditStop.svg", 13, 13);
            stopAuditNavigationItem.buttonStyle = WI.ButtonNavigationItem.Style.ImageAndText;
            stopAuditNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, function(event) {
                WI.auditManager.stop();
            }, stopAuditNavigationItem);

            let stopAuditHelpElement = WI.createNavigationItemHelp(WI.UIString("Press %s to stop running."), stopAuditNavigationItem);
            this.placeholderElement.appendChild(stopAuditHelpElement);

            this.placeholderElement.appendChild(WI.ReferencePage.AuditTab.RunningAudits.createLinkElement());
        }

        super.showRunningPlaceholder();
    }

    // Private

    _subobjects()
    {
        if (this.representedObject instanceof WI.AuditTestGroup)
            return this.representedObject.tests;

        if (this.representedObject instanceof WI.AuditTestGroupResult)
            return this.representedObject.results;

        console.error("Unknown representedObject", this.representedObject);
        return [];
    }

    _updateClassList()
    {
        let subobjects = this._subobjects();
        let containsTestGroup = subobjects.some((test) => test instanceof WI.AuditTestGroup || test instanceof WI.AuditTestGroupResult);
        this.element.classList.toggle("contains-test-group", containsTestGroup);
        this.element.classList.toggle("contains-test-case", !containsTestGroup && subobjects.some((test) => test instanceof WI.AuditTestCase || test instanceof WI.AuditTestCaseResult));
    }

    _updateLevelScopeBar(levels)
    {
        if (!this._levelScopeBar)
            return;

        for (let item of this._levelScopeBar.items)
            item.selected = levels.includes(item.id);

        for (let view of this._viewForSubobject.values()) {
            if (view instanceof WI.AuditTestGroupContentView)
                view._updateLevelScopeBar(levels);
        }
    }

    _addTest(test)
    {
        console.assert(!this._viewForSubobject.has(test));

        let view = WI.ContentView.contentViewForRepresentedObject(test);
        this.contentView.addSubview(view);

        this._viewForSubobject.set(test, view);
    }

    _handleTestGroupProgress(event)
    {
        let {index, count} = event.data;
        if (this.placeholderElement && this.placeholderElement.__progress)
            this.placeholderElement.__progress.value = (index + 1) / count;
    }

    _handleTestGroupScheduled(event)
    {
        if (this.placeholderElement && this.placeholderElement.__progress)
            this.placeholderElement.__progress.value = 0;
    }

    _handleTestGroupTestAdded(event)
    {
        console.assert(WI.auditManager.editing);

        let {test} = event.data;

        this._addTest(test);

        this._updateClassList();
    }

    _handleTestGroupTestRemoved(event)
    {
        console.assert(WI.auditManager.editing);

        let {test} = event.data;

        let view = this._viewForSubobject.get(test);
        console.assert(view);

        this.contentView.removeSubview(view);

        this._updateClassList();
    }

    _handleLevelScopeBarSelectionChanged(event)
    {
        this.needsLayout();
    }
};
