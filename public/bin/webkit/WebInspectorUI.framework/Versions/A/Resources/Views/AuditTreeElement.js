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

WI.AuditTreeElement = class AuditTreeElement extends WI.GeneralTreeElement
{
    constructor(representedObject)
    {
        let isTestCase = representedObject instanceof WI.AuditTestCase;
        let isTestGroup = representedObject instanceof WI.AuditTestGroup;
        let isTestCaseResult = representedObject instanceof WI.AuditTestCaseResult;
        let isTestGroupResult = representedObject instanceof WI.AuditTestGroupResult;
        console.assert(isTestCase || isTestGroup || isTestCaseResult || isTestGroupResult);

        let classNames = ["audit"];
        if (isTestCase)
            classNames.push("test-case");
        else if (isTestGroup)
            classNames.push("test-group");
        else if (isTestCaseResult)
            classNames.push("test-case-result");
        else if (isTestGroupResult)
            classNames.push("test-group-result");

        let options = {
            hasChildren: isTestGroup || isTestGroupResult,
        };

        const subtitle = null;
        super(classNames, representedObject.name, subtitle, representedObject, options);

        if (isTestGroup)
            this._expandedSetting = new WI.Setting(WI.AuditTreeElement.expandedSettingKey(this.representedObject.name), false);
    }

    // Static

    static expandedSettingKey(name)
    {
        return `audit-tree-element-${name}-expanded`;
    }

    // Protected

    onattach()
    {
        super.onattach();

        if (this.representedObject instanceof WI.AuditTestBase) {
            this.representedObject.addEventListener(WI.AuditTestBase.Event.DisabledChanged, this._handleTestDisabledChanged, this);
            this.representedObject.addEventListener(WI.AuditTestBase.Event.ResultChanged, this._handleTestResultChanged, this);

            if (this.representedObject instanceof WI.AuditTestCase)
                this.representedObject.addEventListener(WI.AuditTestBase.Event.Scheduled, this._handleTestCaseScheduled, this);
            else if (this.representedObject instanceof WI.AuditTestGroup)
                this.representedObject.addEventListener(WI.AuditTestBase.Event.Scheduled, this._handleTestGroupScheduled, this);

            if (this.representedObject.editable) {
                this.representedObject.addEventListener(WI.AuditTestBase.Event.NameChanged, this._handleTestNameChanged, this);
                this.representedObject.addEventListener(WI.AuditTestBase.Event.SupportedChanged, this._handleTestSupportedChanged, this);

                if (this.representedObject instanceof WI.AuditTestGroup)
                    this.representedObject.addEventListener(WI.AuditTestGroup.Event.TestAdded, this._handleTestGroupTestAdded, this);
            }

            WI.auditManager.addEventListener(WI.AuditManager.Event.EditingChanged, this._handleManagerEditingChanged, this);
            WI.auditManager.addEventListener(WI.AuditManager.Event.TestScheduled, this._handleAuditManagerTestScheduled, this);
            WI.auditManager.addEventListener(WI.AuditManager.Event.TestCompleted, this._handleAuditManagerTestCompleted, this);
        }

        if (this.representedObject.supported && this._expandedSetting && this._expandedSetting.value)
            this.expand();

        this._updateStatus();
    }

    ondetach()
    {
        if (this.representedObject instanceof WI.AuditTestBase) {
            this.representedObject.removeEventListener(WI.AuditTestBase.Event.DisabledChanged, this._handleTestDisabledChanged, this);
            this.representedObject.removeEventListener(WI.AuditTestBase.Event.ResultChanged, this._handleTestResultChanged, this);

            if (this.representedObject instanceof WI.AuditTestCase)
                this.representedObject.removeEventListener(WI.AuditTestBase.Event.Scheduled, this._handleTestCaseScheduled, this);
            else if (this.representedObject instanceof WI.AuditTestGroup)
                this.representedObject.removeEventListener(WI.AuditTestBase.Event.Scheduled, this._handleTestGroupScheduled, this);

            if (this.representedObject.editable) {
                this.representedObject.removeEventListener(WI.AuditTestBase.Event.NameChanged, this._handleTestNameChanged, this);
                this.representedObject.removeEventListener(WI.AuditTestBase.Event.SupportedChanged, this._handleTestSupportedChanged, this);

                if (this.representedObject instanceof WI.AuditTestGroup)
                    this.representedObject.removeEventListener(WI.AuditTestGroup.Event.TestAdded, this._handleTestGroupTestAdded, this);
            }

            WI.auditManager.removeEventListener(WI.AuditManager.Event.EditingChanged, this._handleManagerEditingChanged, this);
            WI.auditManager.removeEventListener(WI.AuditManager.Event.TestScheduled, this._handleAuditManagerTestScheduled, this);
            WI.auditManager.removeEventListener(WI.AuditManager.Event.TestCompleted, this._handleAuditManagerTestCompleted, this);
        }

        super.ondetach();
    }

    onpopulate()
    {
        super.onpopulate();

        if (this.children.length && !this.shouldRefreshChildren)
            return;

        this.shouldRefreshChildren = false;

        this.removeChildren();

        if (this.representedObject instanceof WI.AuditTestGroup) {
            for (let test of this.representedObject.tests)
                this.appendChild(new WI.AuditTreeElement(test));
        } else if (this.representedObject instanceof WI.AuditTestGroupResult) {
            for (let result of this.representedObject.results)
                this.appendChild(new WI.AuditTreeElement(result));
        }
    }

    onexpand()
    {
        console.assert(this.expanded);

        if (this._expandedSetting)
            this._expandedSetting.value = this.expanded;
    }

    oncollapse()
    {
        console.assert(!this.expanded);

        if (this._expandedSetting)
            this._expandedSetting.value = this.expanded;
    }

    ondelete()
    {
        if (!(this.representedObject instanceof WI.AuditTestBase))
            return false;

        if (!WI.auditManager.editing)
            return false;

        this.representedObject.remove();

        return true;
    }

    canSelectOnMouseDown(event)
    {
        if (this.representedObject instanceof WI.AuditTestBase && this.representedObject.supported && this.status.contains(event.target))
            return false;

        return super.canSelectOnMouseDown(event);
    }

    populateContextMenu(contextMenu, event)
    {
        let isTest = this.representedObject instanceof WI.AuditTestBase;

        contextMenu.appendSeparator();

        if (WI.auditManager.editing) {
            if (isTest) {
                if (this.representedObject.supported) {
                    contextMenu.appendItem(this.representedObject.disabled ? WI.UIString("Enable Audit") : WI.UIString("Disable Audit"), () => {
                        this.representedObject.disabled = !this.representedObject.disabled;
                    });
                }

                contextMenu.appendItem(WI.UIString("Duplicate Audit"), async () => {
                    let audit = await this.representedObject.clone();
                    WI.auditManager.addTest(audit, {save: true});
                });

                if (this.representedObject.editable) {
                    contextMenu.appendItem(WI.UIString("Delete Audit"), () => {
                        this.representedObject.remove();
                    });
                }
            }
        } else {
            if (isTest) {
                contextMenu.appendItem(WI.UIString("Start Audit"), () => {
                    this._start();
                }, WI.auditManager.runningState !== WI.AuditManager.RunningState.Inactive);
            }

            contextMenu.appendSeparator();

            if (WI.FileUtilities.canSave(WI.FileUtilities.SaveMode.FileVariants)) {
                contextMenu.appendItem(WI.UIString("Export"), () => {
                    WI.auditManager.export(WI.FileUtilities.SaveMode.FileVariants, this.representedObject);
                });
            } else if (WI.FileUtilities.canSave(WI.FileUtilities.SaveMode.SingleFile)) {
                if (isTest) {
                    contextMenu.appendItem(WI.FileUtilities.SaveMode.SingleFile, WI.UIString("Export Audit"), () => {
                        WI.auditManager.export(this.representedObject);
                    });
                }

                contextMenu.appendItem(WI.FileUtilities.SaveMode.SingleFile, WI.UIString("Export Result"), () => {
                    WI.auditManager.export(this.representedObject.result);
                }, !this.representedObject.result);
            }

            if (isTest && this.representedObject.editable) {
                contextMenu.appendSeparator();

                contextMenu.appendItem(WI.UIString("Edit Audit"), () => {
                    WI.auditManager.editing = true;
                    WI.showRepresentedObject(this.representedObject);
                });
            }
        }

        contextMenu.appendSeparator();

        super.populateContextMenu(contextMenu, event);
    }

    // Private

    _start()
    {
        if (WI.auditManager.runningState !== WI.AuditManager.RunningState.Inactive)
            return;

        WI.auditManager.start([this.representedObject]);
    }

    _updateStatus()
    {
        if (this.representedObject instanceof WI.AuditTestBase && !this.representedObject.supported) {
            this.status = document.createElement("img");
            this.status.title = WI.UIString("This audit is not supported");
            this.addClassName("unsupported");
            return;
        }

        if (WI.auditManager.editing) {
            this.status = document.createElement("input");
            this.status.type = "checkbox";
            this._updateTestGroupDisabled();
            this.status.addEventListener("change", () => {
                this.representedObject.disabled = !this.representedObject.disabled;
            });

            this.addClassName("editing-audits");
            return;
        }

        let className = "";

        let result = this.representedObject.result;
        if (result) {
            if (result.didError)
                className = WI.AuditTestCaseResult.Level.Error;
            else if (result.didFail)
                className = WI.AuditTestCaseResult.Level.Fail;
            else if (result.didWarn)
                className = WI.AuditTestCaseResult.Level.Warn;
            else if (result.didPass)
                className = WI.AuditTestCaseResult.Level.Pass;
            else if (result.unsupported)
                className = WI.AuditTestCaseResult.Level.Unsupported;
        }

        this.status = document.createElement("img");

        if (this.representedObject instanceof WI.AuditTestBase) {
            this.status.title = WI.UIString("Start");
            this.status.addEventListener("click", this._handleStatusClick.bind(this));

            if (!className)
                className = "show-on-hover";
        }

        this.status.classList.add(className);

        this.removeClassName("editing-audits");
    }

    _showRunningSpinner()
    {
        if (this.representedObject.runningState === WI.AuditManager.RunningState.Inactive) {
            this._updateStatus();
            return;
        }

        if (!this.status || !this.status.__spinner) {
            let spinner = new WI.IndeterminateProgressSpinner;
            this.status = spinner.element;
            this.status.__spinner = true;
        }
    }

    _showRunningProgress(progress)
    {
        if (!this.representedObject.runningState === WI.AuditManager.RunningState.Inactive) {
            this._updateStatus();
            return;
        }

        if (!this.status || !this.status.__progress) {
            this.status = document.createElement("progress");
            this.status.__progress = true;
        }

        this.status.value = progress || 0;
    }

    _updateTestGroupDisabled()
    {
        this.status.checked = !this.representedObject.disabled;

        if (this.representedObject instanceof WI.AuditTestGroup) {
            let firstSupportedTest = this.representedObject.tests.find((test) => test.supported);
            this.status.indeterminate = this.representedObject.tests.some((test) => test.supported && test.disabled !== firstSupportedTest.disabled);
        }
    }

    _handleTestCaseCompleted(event)
    {
        this.representedObject.removeEventListener(WI.AuditTestBase.Event.Completed, this._handleTestCaseCompleted, this);

        this._updateStatus();
    }

    _handleTestDisabledChanged(event)
    {
        if (this.status instanceof HTMLInputElement && this.status.type === "checkbox")
            this._updateTestGroupDisabled();
    }

    _handleTestResultChanged(event)
    {
        this._updateStatus();
    }

    _handleTestCaseScheduled(event)
    {
        this.representedObject.addEventListener(WI.AuditTestBase.Event.Completed, this._handleTestCaseCompleted, this);

        this._showRunningSpinner();
    }

    _handleTestGroupCompleted(event)
    {
        this.representedObject.removeEventListener(WI.AuditTestBase.Event.Completed, this._handleTestGroupCompleted, this);
        this.representedObject.removeEventListener(WI.AuditTestBase.Event.Progress, this._handleTestGroupProgress, this);

        this._updateStatus();
    }

    _handleTestGroupProgress(event)
    {
        let {index, count} = event.data;
        this._showRunningProgress((index + 1) / count);
    }

    _handleTestGroupScheduled(event)
    {
        this.representedObject.addEventListener(WI.AuditTestBase.Event.Completed, this._handleTestGroupCompleted, this);
        this.representedObject.addEventListener(WI.AuditTestBase.Event.Progress, this._handleTestGroupProgress, this);

        this._showRunningProgress();
    }

    _handleTestNameChanged(event)
    {
        this.mainTitle = this.representedObject.name;

        if (this.representedObject instanceof WI.AuditTestGroup)
            this._expandedSetting = new WI.Setting(WI.AuditTreeElement.expandedSettingKey(this.representedObject.name), !!WI.Setting.migrateValue(WI.AuditTreeElement.expandedSettingKey(event.data.oldName)));
    }

    _handleTestSupportedChanged(event)
    {
        this._updateStatus();
    }

    _handleTestGroupTestAdded(event)
    {
        let {test} = event.data;

        this.appendChild(new WI.AuditTreeElement(test));
    }

    _handleManagerEditingChanged(event)
    {
        this._updateStatus();
    }

    _handleAuditManagerTestScheduled(event)
    {
        this.addClassName("manager-active");
    }

    _handleAuditManagerTestCompleted(event)
    {
        this.removeClassName("manager-active");
    }

    _handleStatusClick(event)
    {
        this._start();
    }
};
