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

WI.AuditManager = class AuditManager extends WI.Object
{
    constructor()
    {
        super();

        this._tests = [];
        this._results = [];

        this._runningState = WI.AuditManager.RunningState.Inactive;
        this._runningTests = [];

        this._disabledDefaultTestsSetting = new WI.Setting("audit-disabled-default-tests", []);

        WI.Frame.addEventListener(WI.Frame.Event.MainResourceDidChange, this._handleFrameMainResourceDidChange, this);
    }

    // Static

    static synthesizeWarning(message)
    {
        message = WI.UIString("Audit Warning: %s").format(message);

        if (window.InspectorTest) {
            console.warn(message);
            return;
        }

        let consoleMessage = new WI.ConsoleMessage(WI.mainTarget, WI.ConsoleMessage.MessageSource.Other, WI.ConsoleMessage.MessageLevel.Warning, message);
        consoleMessage.shouldRevealConsole = true;

        WI.consoleLogViewController.appendConsoleMessage(consoleMessage);
    }

    static synthesizeError(message)
    {
        message = WI.UIString("Audit Error: %s").format(message);

        if (window.InspectorTest) {
            console.error(message);
            return;
        }

        let consoleMessage = new WI.ConsoleMessage(WI.mainTarget, WI.ConsoleMessage.MessageSource.Other, WI.ConsoleMessage.MessageLevel.Error, message);
        consoleMessage.shouldRevealConsole = true;

        WI.consoleLogViewController.appendConsoleMessage(consoleMessage);
    }

    // Public

    get tests() { return this._tests; }
    get results() { return this._results; }
    get runningState() { return this._runningState; }

    get editing()
    {
        return this._runningState === WI.AuditManager.RunningState.Disabled;
    }

    set editing(editing)
    {
        console.assert(this._runningState === WI.AuditManager.RunningState.Disabled || this._runningState === WI.AuditManager.RunningState.Inactive);
        if (this._runningState !== WI.AuditManager.RunningState.Disabled && this._runningState !== WI.AuditManager.RunningState.Inactive)
            return;

        let runningState = editing ? WI.AuditManager.RunningState.Disabled : WI.AuditManager.RunningState.Inactive;
        console.assert(runningState !== this._runningState);
        if (runningState === this._runningState)
            return;

        this._runningState = runningState;

        this.dispatchEventToListeners(WI.AuditManager.Event.EditingChanged);

        if (!this.editing) {
            WI.objectStores.audits.clear();

            let disabledDefaultTests = [];
            let saveDisabledDefaultTest = (test) => {
                if (test.supported && test.disabled)
                    disabledDefaultTests.push(test.name);

                if (test instanceof WI.AuditTestGroup) {
                    for (let child of test.tests)
                        saveDisabledDefaultTest(child);
                }
            };

            for (let test of this._tests) {
                if (test.default)
                    saveDisabledDefaultTest(test);
                else
                    WI.objectStores.audits.putObject(test);
            }

            this._disabledDefaultTestsSetting.value = disabledDefaultTests;
        }
    }

    async start(tests)
    {
        console.assert(this._runningState === WI.AuditManager.RunningState.Inactive);
        if (this._runningState !== WI.AuditManager.RunningState.Inactive)
            return null;

        if (tests && tests.length)
            tests = tests.filter((test) => typeof test === "object" && test instanceof WI.AuditTestBase);
        else
            tests = this._tests;

        console.assert(tests.length);
        if (!tests.length)
            return null;

        let mainResource = WI.networkManager.mainFrame.mainResource;

        this._runningState = WI.AuditManager.RunningState.Active;
        this.dispatchEventToListeners(WI.AuditManager.Event.RunningStateChanged);

        this._runningTests = tests;
        for (let test of this._runningTests)
            test.clearResult();

        this.dispatchEventToListeners(WI.AuditManager.Event.TestScheduled);

        let target = WI.assumingMainTarget();

        await Promise.chain(this._runningTests.map((test) => async () => {
            if (this._runningState !== WI.AuditManager.RunningState.Active)
                return;

            if (target.hasDomain("Audit"))
                await target.AuditAgent.setup();

            let topLevelTest = test.topLevelTest;
            console.assert(topLevelTest || window.InspectorTest, "No matching top-level test found", test);
            if (topLevelTest)
                await topLevelTest.runSetup();

            await test.start();

            if (target.hasDomain("Audit"))
                await target.AuditAgent.teardown();
        }));

        let result = this._runningTests.map((test) => test.result).filter((result) => !!result);

        this._runningState = WI.AuditManager.RunningState.Inactive;
        this.dispatchEventToListeners(WI.AuditManager.Event.RunningStateChanged);

        this._runningTests = [];

        this._addResult(result);

        if (mainResource !== WI.networkManager.mainFrame.mainResource) {
            // Navigated while tests were running.
            for (let test of this._tests)
                test.clearResult();
        }

        return this._results.lastValue === result ? result : null;
    }

    stop()
    {
        console.assert(this._runningState === WI.AuditManager.RunningState.Active);
        if (this._runningState !== WI.AuditManager.RunningState.Active)
            return;

        this._runningState = WI.AuditManager.RunningState.Stopping;
        this.dispatchEventToListeners(WI.AuditManager.Event.RunningStateChanged);

        for (let test of this._runningTests)
            test.stop();
    }

    async processJSON({json, error})
    {
        if (error) {
            WI.AuditManager.synthesizeError(error);
            return;
        }

        if (typeof json !== "object" || json === null) {
            WI.AuditManager.synthesizeError(WI.UIString("invalid JSON"));
            return;
        }

        if (json.type !== WI.AuditTestCase.TypeIdentifier && json.type !== WI.AuditTestGroup.TypeIdentifier
            && json.type !== WI.AuditTestCaseResult.TypeIdentifier && json.type !== WI.AuditTestGroupResult.TypeIdentifier) {
            WI.AuditManager.synthesizeError(WI.UIString("unknown %s \u0022%s\u0022").format(WI.unlocalizedString("type"), json.type));
            return;
        }

        let object = await WI.AuditTestGroup.fromPayload(json) || await WI.AuditTestCase.fromPayload(json) || await WI.AuditTestGroupResult.fromPayload(json) || await WI.AuditTestCaseResult.fromPayload(json);
        if (!object)
            return;

        if (object instanceof WI.AuditTestBase)
            this.addTest(object, {save: true});
        else if (object instanceof WI.AuditTestResultBase)
            this._addResult(object);

        WI.showRepresentedObject(object);
    }

    export(saveMode, object)
    {
        console.assert(object instanceof WI.AuditTestCase || object instanceof WI.AuditTestGroup || object instanceof WI.AuditTestCaseResult || object instanceof WI.AuditTestGroupResult, object);

        function dataForObject(object) {
            return {
                displayType: object instanceof WI.AuditTestResultBase ? WI.UIString("Result") : WI.UIString("Audit"),
                content: JSON.stringify(object),
                suggestedName: object.name + (object instanceof WI.AuditTestResultBase ? ".result" : ".audit"),
            };
        }

        let data = [dataForObject(object)];

        if (saveMode === WI.FileUtilities.SaveMode.FileVariants && object instanceof WI.AuditTestBase && object.result)
            data.push(dataForObject(object.result));

        WI.FileUtilities.save(saveMode, data);
    }

    loadStoredTests()
    {
        if (this._tests.length)
            return;

        this._addDefaultTests();

        WI.objectStores.audits.getAll().then(async (tests) => {
            for (let payload of tests) {
                let test = await WI.AuditTestGroup.fromPayload(payload) || await WI.AuditTestCase.fromPayload(payload);
                if (!test)
                    continue;

                const key = null;
                WI.objectStores.audits.associateObject(test, key, payload);

                this.addTest(test);
            }
        });
    }

    addTest(test, {save} = {})
    {
        console.assert(test instanceof WI.AuditTestBase, test);
        console.assert(!this._tests.includes(test), test);

        this._tests.push(test);

        if (save)
            WI.objectStores.audits.putObject(test);

        this.dispatchEventToListeners(WI.AuditManager.Event.TestAdded, {test});
    }

    removeTest(test)
    {
        console.assert(this.editing);
        console.assert(test instanceof WI.AuditTestBase, test);
        console.assert(this._tests.includes(test) || test.default, test);

        if (test.default) {
            test.clearResult();

            if (test.disabled) {
                InspectorFrontendHost.beep();
                return;
            }

            test.disabled = true;

            let disabledTests = this._disabledDefaultTestsSetting.value.slice();
            disabledTests.push(test.name);
            this._disabledDefaultTestsSetting.value = disabledTests;

            return;
        }

        console.assert(test.editable, test);

        this._tests.remove(test);

        this.dispatchEventToListeners(WI.AuditManager.Event.TestRemoved, {test});

        WI.objectStores.audits.deleteObject(test);
    }

    // Private

    _addResult(result)
    {
        if (!result || (Array.isArray(result) && !result.length))
            return;

        this._results.push(result);

        this.dispatchEventToListeners(WI.AuditManager.Event.TestCompleted, {
            result,
            index: this._results.length - 1,
        });
    }

    _handleFrameMainResourceDidChange(event)
    {
        if (!event.target.isMainFrame())
            return;

        if (this._runningState === WI.AuditManager.RunningState.Active)
            this.stop();
        else {
            for (let test of this._tests)
                test.clearResult();
        }
    }

    _addDefaultTests()
    {
        console.assert(WI.DefaultAudits, "Default audits not loaded.");
        if (!WI.DefaultAudits)
            return;

        const defaultTests = [
            new WI.AuditTestGroup(WI.UIString("Demo Audit"), [
                new WI.AuditTestGroup(WI.UIString("Result Levels"), [
                    new WI.AuditTestCase("level-pass", WI.DefaultAudits.levelPass.toString(), {description: WI.UIString("This is what the result of a passing test with no data looks like.")}),
                    new WI.AuditTestCase("level-warn", WI.DefaultAudits.levelWarn.toString(), {description: WI.UIString("This is what the result of a warning test with no data looks like.")}),
                    new WI.AuditTestCase("level-fail", WI.DefaultAudits.levelFail.toString(), {description: WI.UIString("This is what the result of a failing test with no data looks like.")}),
                    new WI.AuditTestCase("level-error", WI.DefaultAudits.levelError.toString(), {description: WI.UIString("This is what the result of a test that threw an error with no data looks like.")}),
                    new WI.AuditTestCase("level-unsupported", WI.DefaultAudits.levelUnsupported.toString(), {description: WI.UIString("This is what the result of an unsupported test with no data looks like.")}),
                ], {description: WI.UIString("These are all of the different test result levels.")}),
                new WI.AuditTestGroup(WI.UIString("Result Data"), [
                    new WI.AuditTestCase("data-domNodes", WI.DefaultAudits.dataDOMNodes.toString(), {description: WI.UIString("This is an example of how result DOM nodes are shown. It will pass with the <body> element.")}),
                    new WI.AuditTestCase("data-domAttributes", WI.DefaultAudits.dataDOMAttributes.toString(), {description: WI.UIString("This is an example of how result DOM attributes are highlighted on any returned DOM nodes. It will pass with all elements with an id attribute.")}),
                    new WI.AuditTestCase("data-errors", WI.DefaultAudits.dataErrors.toString(), {description: WI.UIString("This is an example of how errors are shown. The error was thrown manually, but execution errors will appear in the same way.")}),
                    new WI.AuditTestCase("data-custom", WI.DefaultAudits.dataCustom.toString(), {description: WI.UIString("This is an example of how custom result data is shown."), supports: 3}),
                ], {description: WI.UIString("These are example tests that demonstrate all of the different types of data that can be returned with the test result.")}),
                new WI.AuditTestGroup(WI.UIString("Specially Exposed Data"), [
                    new WI.AuditTestGroup(WI.UIString("Accessibility"), [
                        new WI.AuditTestCase("getElementsByComputedRole", WI.DefaultAudits.getElementsByComputedRole.toString(), {description: WI.UIString("This is an example test that uses %s to find elements with a computed role of \u201Clink\u201D.").format(WI.unlocalizedString("WebInspectorAudit.Accessibility.getElementsByComputedRole")), supports: 1}),
                        new WI.AuditTestCase("getActiveDescendant", WI.DefaultAudits.getActiveDescendant.toString(), {description: WI.UIString("This is an example test that uses %s to find any element that meets criteria for active descendant (\u201C%s\u201D) of the <body> element, if it exists.").format(WI.unlocalizedString("WebInspectorAudit.Accessibility.getActiveDescendant"), WI.unlocalizedString("aria-activedescendant")), supports: 1}),
                        new WI.AuditTestCase("getChildNodes", WI.DefaultAudits.getChildNodes.toString(), {description: WI.UIString("This is an example test that uses %s to find child nodes of the <body> element in the accessibility tree.").format(WI.unlocalizedString("WebInspectorAudit.Accessibility.getChildNodes")), supports: 1}),
                        new WI.AuditTestCase("getComputedProperties", WI.DefaultAudits.getComputedProperties.toString(), {description: WI.UIString("This is an example test that uses %s to find a variety of accessibility information about the <body> element.").format(WI.unlocalizedString("WebInspectorAudit.Accessibility.getComputedProperties")), supports: 3}),
                        new WI.AuditTestCase("getControlledNodes", WI.DefaultAudits.getControlledNodes.toString(), {description: WI.UIString("This is an example test that uses %s to find all nodes controlled (\u201C%s\u201D) by the <body> element, if any exist.").format(WI.unlocalizedString("WebInspectorAudit.Accessibility.getControlledNodes"), WI.unlocalizedString("aria-controls")), supports: 1}),
                        new WI.AuditTestCase("getFlowedNodes", WI.DefaultAudits.getFlowedNodes.toString(), {description: WI.UIString("This is an example test that uses %s to find all nodes flowed to (\u201C%s\u201D) from the <body> element, if any exist.").format(WI.unlocalizedString("WebInspectorAudit.Accessibility.getFlowedNodes"), WI.unlocalizedString("aria-flowto")), supports: 1}),
                        new WI.AuditTestCase("getMouseEventNode", WI.DefaultAudits.getMouseEventNode.toString(), {description: WI.UIString("This is an example test that uses %s to find the node that would handle mouse events for the <body> element, if applicable.").format(WI.unlocalizedString("WebInspectorAudit.Accessibility.getMouseEventNode")), supports: 1}),
                        new WI.AuditTestCase("getOwnedNodes", WI.DefaultAudits.getOwnedNodes.toString(), {description: WI.UIString("This is an example test that uses %s to find all nodes owned (\u201C%s\u201D) by the <body> element, if any exist.").format(WI.unlocalizedString("WebInspectorAudit.Accessibility.getOwnedNodes"), WI.unlocalizedString("aria-owns")), supports: 1}),
                        new WI.AuditTestCase("getParentNode", WI.DefaultAudits.getParentNode.toString(), {description: WI.UIString("This is an example test that uses %s to find the parent node of the <body> element in the accessibility tree.").format(WI.unlocalizedString("WebInspectorAudit.Accessibility.getParentNode")), supports: 1}),
                        new WI.AuditTestCase("getSelectedChildNodes", WI.DefaultAudits.getSelectedChildNodes.toString(), {description: WI.UIString("This is an example test that uses %s to find all child nodes that are selected (\u201C%s\u201D) of the <body> element in the accessibility tree.").format(WI.unlocalizedString("WebInspectorAudit.Accessibility.getSelectedChildNodes"), WI.unlocalizedString("aria-selected")), supports: 1}),
                    ], {description: WI.UIString("These are example tests that demonstrate how to use %s to get information about the accessibility tree.").format(WI.unlocalizedString("WebInspectorAudit.Accessibility")), supports: 1}),
                    new WI.AuditTestGroup(WI.UIString("DOM"), [
                        new WI.AuditTestCase("hasEventListeners", WI.DefaultAudits.hasEventListeners.toString(), {description: WI.UIString("This is an example test that uses %s to find data indicating whether the <body> element has any event listeners.").format(WI.unlocalizedString("WebInspectorAudit.Accessibility.hasEventListeners")), supports: 3}),
                        new WI.AuditTestCase("hasEventListeners-click", WI.DefaultAudits.hasEventListenersClick.toString(), {description: WI.UIString("This is an example test that uses %s to find data indicating whether the <body> element has any click event listeners.").format(WI.unlocalizedString("WebInspectorAudit.Accessibility.hasEventListenersClick")), supports: 3}),
                    ], {description: WI.UIString("These are example tests that demonstrate how to use %s to get information about DOM nodes.").format(WI.unlocalizedString("WebInspectorAudit.DOM")), supports: 1}),
                    new WI.AuditTestGroup(WI.UIString("Resources"), [
                        new WI.AuditTestCase("getResources", WI.DefaultAudits.getResources.toString(), {description: WI.UIString("This is an example test that uses %s to find basic information about each resource.").format(WI.unlocalizedString("WebInspectorAudit.Accessibility.getResources")), supports: 3}),
                        new WI.AuditTestCase("getResourceContent", WI.DefaultAudits.getResourceContent.toString(), {description: WI.UIString("This is an example test that uses %s to find the contents of the main resource.").format(WI.unlocalizedString("WebInspectorAudit.Accessibility.getResourceContent")), supports: 3}),
                    ], {description: WI.UIString("These are example tests that demonstrate how to use %s to get information about loaded resources.").format(WI.unlocalizedString("WebInspectorAudit.Resources")), supports: 2}),
                ], {description: WI.UIString("These are example tests that demonstrate how to use %s to access information not normally available to JavaScript.").format(WI.unlocalizedString("WebInspectorAudit")), supports: 1}),
                new WI.AuditTestCase("unsupported", WI.DefaultAudits.unsupported.toString(), {description: WI.UIString("This is an example of a test that will not run because it is unsupported."), supports: Infinity}),
            ], {description: WI.UIString("These are example tests that demonstrate the functionality and structure of audits.")}),
            new WI.AuditTestGroup(WI.UIString("Accessibility"), [
                new WI.AuditTestCase("testMenuRoleForRequiredChildren", WI.DefaultAudits.testMenuRoleForRequiredChildren.toString(), {description: WI.UIString("Ensure that elements of role \u201C%s\u201D and \u201C%s\u201D have required owned elements in accordance with WAI-ARIA.").format(WI.unlocalizedString("menu"), WI.unlocalizedString("menubar")), supports: 1}),
                new WI.AuditTestCase("testGridRoleForRequiredChildren", WI.DefaultAudits.testGridRoleForRequiredChildren.toString(), {description: WI.UIString("Ensure that elements of role \u201C%s\u201D have required owned elements in accordance with WAI-ARIA.").format(WI.unlocalizedString("grid")), supports: 1}),
                new WI.AuditTestCase("testForAriaLabelledBySpelling", WI.DefaultAudits.testForAriaLabelledBySpelling.toString(), {description: WI.UIString("Ensure that \u201C%s\u201D is spelled correctly.").format(WI.unlocalizedString("aria-labelledby")), supports: 1}),
                new WI.AuditTestCase("testForMultipleBanners", WI.DefaultAudits.testForMultipleBanners.toString(), {description: WI.UIString("Ensure that only one banner is used on the page."), supports: 1}),
                new WI.AuditTestCase("testForLinkLabels", WI.DefaultAudits.testForLinkLabels.toString(), {description: WI.UIString("Ensure that links have accessible labels for assistive technology."), supports: 1}),
                new WI.AuditTestCase("testRowGroupRoleForRequiredChildren", WI.DefaultAudits.testRowGroupRoleForRequiredChildren.toString(), {description: WI.UIString("Ensure that elements of role \u201C%s\u201D have required owned elements in accordance with WAI-ARIA.").format(WI.unlocalizedString("rowgroup")), supports: 1}),
                new WI.AuditTestCase("testTableRoleForRequiredChildren", WI.DefaultAudits.testTableRoleForRequiredChildren.toString(), {description: WI.UIString("Ensure that elements of role \u201C%s\u201D have required owned elements in accordance with WAI-ARIA.").format(WI.unlocalizedString("table")), supports: 1}),
                new WI.AuditTestCase("testForMultipleLiveRegions", WI.DefaultAudits.testForMultipleLiveRegions.toString(), {description: WI.UIString("Ensure that only one live region is used on the page."), supports: 1}),
                new WI.AuditTestCase("testListBoxRoleForRequiredChildren", WI.DefaultAudits.testListBoxRoleForRequiredChildren.toString(), {description: WI.UIString("Ensure that elements of role \u201C%s\u201D have required owned elements in accordance with WAI-ARIA.").format(WI.unlocalizedString("listbox")), supports: 1}),
                new WI.AuditTestCase("testImageLabels", WI.DefaultAudits.testImageLabels.toString(), {description: WI.UIString("Ensure that elements of role \u201C%s\u201D have accessible labels for assistive technology.").format(WI.unlocalizedString("img")), supports: 1}),
                new WI.AuditTestCase("testForAriaHiddenFalse", WI.DefaultAudits.testForAriaHiddenFalse.toString(), {description: WI.UIString("Ensure aria-hidden=\u0022%s\u0022 is not used.").format(WI.unlocalizedString("false")), supports: 1}),
                new WI.AuditTestCase("testTreeRoleForRequiredChildren", WI.DefaultAudits.testTreeRoleForRequiredChildren.toString(), {description: WI.UIString("Ensure that elements of role \u201C%s\u201D have required owned elements in accordance with WAI-ARIA.").format(WI.unlocalizedString("tree")), supports: 1}),
                new WI.AuditTestCase("testRadioGroupRoleForRequiredChildren", WI.DefaultAudits.testRadioGroupRoleForRequiredChildren.toString(), {description: WI.UIString("Ensure that elements of role \u201C%s\u201D have required owned elements in accordance with WAI-ARIA.").format(WI.unlocalizedString("radiogroup")), supports: 1}),
                new WI.AuditTestCase("testFeedRoleForRequiredChildren", WI.DefaultAudits.testFeedRoleForRequiredChildren.toString(), {description: WI.UIString("Ensure that elements of role \u201C%s\u201D have required owned elements in accordance with WAI-ARIA.").format(WI.unlocalizedString("feed")), supports: 1}),
                new WI.AuditTestCase("testTabListRoleForRequiredChildren", WI.DefaultAudits.testTabListRoleForRequiredChildren.toString(), {description: WI.UIString("Ensure that elements of role \u201C%s\u201D have required owned elements in accordance with WAI-ARIA.").format(WI.unlocalizedString("tablist")), supports: 1}),
                new WI.AuditTestCase("testButtonLabels", WI.DefaultAudits.testButtonLabels.toString(), {description: WI.UIString("Ensure that buttons have accessible labels for assistive technology."), supports: 1}),
                new WI.AuditTestCase("testRowRoleForRequiredChildren", WI.DefaultAudits.testRowRoleForRequiredChildren.toString(), {description: WI.UIString("Ensure that elements of role \u201C%s\u201D have required owned elements in accordance with WAI-ARIA.").format(WI.unlocalizedString("row")), supports: 1}),
                new WI.AuditTestCase("testListRoleForRequiredChildren", WI.DefaultAudits.testListRoleForRequiredChildren.toString(), {description: WI.UIString("Ensure that elements of role \u201C%s\u201D have required owned elements in accordance with WAI-ARIA.").format(WI.unlocalizedString("list")), supports: 1}),
                new WI.AuditTestCase("testComboBoxRoleForRequiredChildren", WI.DefaultAudits.testComboBoxRoleForRequiredChildren.toString(), {description: WI.UIString("Ensure that elements of role \u201C%s\u201D have required owned elements in accordance with WAI-ARIA.").format(WI.unlocalizedString("combobox")), supports: 1}),
                new WI.AuditTestCase("testForMultipleMainContentSections", WI.DefaultAudits.testForMultipleMainContentSections.toString(), {description: WI.UIString("Ensure that only one main content section is used on the page."), supports: 1}),
                new WI.AuditTestCase("testDialogsForLabels", WI.DefaultAudits.testDialogsForLabels.toString(), {description: WI.UIString("Ensure that dialogs have accessible labels for assistive technology."), supports: 1}),
                new WI.AuditTestCase("testForInvalidAriaHiddenValue", WI.DefaultAudits.testForInvalidAriaHiddenValue.toString(), {description: WI.UIString("Ensure that values for \u201C%s\u201D are valid.").format(WI.unlocalizedString("aria-hidden")), supports: 1})
            ], {description: WI.UIString("Diagnoses common accessibility problems affecting screen readers and other assistive technology.")}),
        ];

        let checkDisabledDefaultTest = (test) => {
            test.markAsDefault();

            if (this._disabledDefaultTestsSetting.value.includes(test.name))
                test.disabled = true;

            if (test instanceof WI.AuditTestGroup) {
                for (let child of test.tests)
                    checkDisabledDefaultTest(child);
            }
        };

        for (let test of defaultTests) {
            checkDisabledDefaultTest(test);

            this.addTest(test);
        }
    }
};

WI.AuditManager.RunningState = {
    Disabled: "disabled",
    Inactive: "inactive",
    Active: "active",
    Stopping: "stopping",
};

WI.AuditManager.Event = {
    EditingChanged: "audit-manager-editing-changed",
    RunningStateChanged: "audit-manager-running-state-changed",
    TestAdded: "audit-manager-test-added",
    TestCompleted: "audit-manager-test-completed",
    TestRemoved: "audit-manager-test-removed",
    TestScheduled: "audit-manager-test-scheduled",
};
