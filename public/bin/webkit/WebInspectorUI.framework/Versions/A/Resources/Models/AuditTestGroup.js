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

WI.AuditTestGroup = class AuditTestGroup extends WI.AuditTestBase
{
    constructor(name, tests, options = {})
    {
        console.assert(Array.isArray(tests), tests);

        // Set disabled once `_tests` is set so that it propagates.
        let disabled = options.disabled;
        options.disabled = false;

        super(name, options);

        this._tests = [];
        for (let test of tests)
            this.addTest(test);

        if (disabled)
            this.updateDisabled(true);
    }

    // Static

    static async fromPayload(payload)
    {
        if (typeof payload !== "object" || payload === null)
            return null;

        if (payload.type !== WI.AuditTestGroup.TypeIdentifier)
            return null;

        if (typeof payload.name !== "string") {
            WI.AuditManager.synthesizeError(WI.UIString("\u0022%s\u0022 has a non-string \u0022%s\u0022 value").format(payload.name, WI.unlocalizedString("name")));
            return null;
        }

        if (!Array.isArray(payload.tests)) {
            WI.AuditManager.synthesizeError(WI.UIString("\u0022%s\u0022 has a non-array \u0022%s\u0022 value").format(payload.name, WI.unlocalizedString("tests")));
            return null;
        }

        let tests = await Promise.all(payload.tests.map(async (test) => {
            let testCase = await WI.AuditTestCase.fromPayload(test);
            if (testCase)
                return testCase;

            let testGroup = await WI.AuditTestGroup.fromPayload(test);
            if (testGroup)
                return testGroup;

            return null;
        }));
        tests = tests.filter((test) => !!test);
        if (!tests.length)
            return null;

        let options = {};

        if (typeof payload.description === "string")
            options.description = payload.description;
        else if ("description" in payload)
            WI.AuditManager.synthesizeWarning(WI.UIString("\u0022%s\u0022 has a non-string \u0022%s\u0022 value").format(payload.name, WI.unlocalizedString("description")));

        if (typeof payload.supports === "number")
            options.supports = payload.supports;
        else if ("supports" in payload)
            WI.AuditManager.synthesizeWarning(WI.UIString("\u0022%s\u0022 has a non-number \u0022%s\u0022 value").format(payload.name, WI.unlocalizedString("supports")));

        if (typeof payload.setup === "string")
            options.setup = payload.setup;
        else if ("setup" in payload)
            WI.AuditManager.synthesizeWarning(WI.UIString("\u0022%s\u0022 has a non-string \u0022%s\u0022 value").format(payload.name, WI.unlocalizedString("setup")));

        if (typeof payload.disabled === "boolean")
            options.disabled = payload.disabled;

        return new WI.AuditTestGroup(payload.name, tests, options);
    }

    // Public

    get tests() { return this._tests; }

    addTest(test)
    {
        console.assert(test instanceof WI.AuditTestBase, test);
        console.assert(!this._tests.includes(test), test);
        console.assert(!test._parent, test);

        this._tests.push(test);
        test._parent = this;

        test.addEventListener(WI.AuditTestBase.Event.Completed, this._handleTestCompleted, this);
        test.addEventListener(WI.AuditTestBase.Event.DisabledChanged, this._handleTestDisabledChanged, this);
        test.addEventListener(WI.AuditTestBase.Event.Progress, this._handleTestProgress, this);
        if (this.editable) {
            test.addEventListener(WI.AuditTestBase.Event.SupportedChanged, this._handleTestSupportedChanged, this);
            test.addEventListener(WI.AuditTestBase.Event.TestChanged, this._handleTestChanged, this);
        }

        this.dispatchEventToListeners(WI.AuditTestGroup.Event.TestAdded, {test});

        this.determineIfSupported();

        if (this._checkDisabled(test))
            test.updateDisabled(true, {silent: true});
    }

    removeTest(test)
    {
        console.assert(this.editable);
        console.assert(WI.auditManager.editing);
        console.assert(test instanceof WI.AuditTestBase, test);
        console.assert(test.editable, test);
        console.assert(this._tests.includes(test), test);
        console.assert(test._parent === this, test);

        test.removeEventListener(WI.AuditTestBase.Event.Completed, this._handleTestCompleted, this);
        test.removeEventListener(WI.AuditTestBase.Event.DisabledChanged, this._handleTestDisabledChanged, this);
        test.removeEventListener(WI.AuditTestBase.Event.Progress, this._handleTestProgress, this);
        test.removeEventListener(WI.AuditTestBase.Event.SupportedChanged, this._handleTestSupportedChanged, this);
        test.removeEventListener(WI.AuditTestBase.Event.TestChanged, this._handleTestChanged, this);

        this._tests.remove(test);
        test._parent = null;

        this.dispatchEventToListeners(WI.AuditTestGroup.Event.TestRemoved, {test});

        this.determineIfSupported();

        this._checkDisabled();
    }

    stop()
    {
        // Called from WI.AuditManager.

        for (let test of this._tests)
            test.stop();

        super.stop();
    }

    clearResult(options = {})
    {
        let cleared = !!this.result;

        if (!options.excludeTests && this._tests) {
            for (let test of this._tests) {
                if (test.clearResult(options))
                    cleared = true;
            }
        }

        return super.clearResult({
            ...options,
            suppressResultChangedEvent: !cleared,
        });
    }

    toJSON(key)
    {
        let json = super.toJSON(key);
        json.tests = this._tests.map((testCase) => testCase.toJSON(key));
        return json;
    }

    // Protected

    async run()
    {
        let count = this._tests.length;
        for (let index = 0; index < count && this._runningState === WI.AuditManager.RunningState.Active; ++index) {
            let test = this._tests[index];
            if (test.disabled || !test.supported)
                continue;

            await test.start();

            if (test instanceof WI.AuditTestCase)
                this.dispatchEventToListeners(WI.AuditTestBase.Event.Progress, {index, count});
        }

        this.updateResult();
    }

    determineIfSupported(options = {})
    {
        if (this._tests) {
            for (let test of this._tests)
                test.determineIfSupported({...options, warn: false, silent: true});
        }

        return super.determineIfSupported(options);
    }

    updateSupported(supported, options = {})
    {
        if (this._tests && (!supported || this._tests.every((test) => !test.supported))) {
            supported = false;

            for (let test of this._tests)
                test.updateSupported(supported, {silent: true});
        }

        super.updateSupported(supported, options);
    }

    updateDisabled(disabled, options = {})
    {
        if (!options.excludeTests && this._tests) {
            for (let test of this._tests)
                test.updateDisabled(disabled, options);
        }

        super.updateDisabled(disabled, options);
    }

    updateResult()
    {
        let results = this._tests.map((test) => test.result).filter((result) => !!result);
        if (!results.length)
            return;

        super.updateResult(new WI.AuditTestGroupResult(this.name, results, {
            description: this.description,
        }));
    }

    // Private

    _checkDisabled(test)
    {
        let testDisabled = !test || !test.supported || test.disabled;
        let enabledTestCount = this._tests.filter((existing) => existing.supported && !existing.disabled).length;

        if (testDisabled && !enabledTestCount)
            this.updateDisabled(true);
        else if (!testDisabled && enabledTestCount === 1)
            this.updateDisabled(false, {excludeTests: true});
        else {
            // Don't change `disabled`, as we're currently in an "indeterminate" state.
            this.dispatchEventToListeners(WI.AuditTestBase.Event.DisabledChanged);
        }

        return this.disabled;
    }

    _handleTestCompleted(event)
    {
        if (this._runningState === WI.AuditManager.RunningState.Active)
            return;

        this.updateResult();

        this.dispatchEventToListeners(WI.AuditTestBase.Event.Completed);
    }

    _handleTestDisabledChanged(event)
    {
        this._checkDisabled(event.target);
    }

    _handleTestProgress(event)
    {
        if (this._runningState !== WI.AuditManager.RunningState.Active)
            return;

        let walk = (tests) => {
            let count = 0;
            for (let test of tests) {
                if (test.disabled || !test.supported)
                    continue;

                if (test instanceof WI.AuditTestCase)
                    ++count;
                else if (test instanceof WI.AuditTestGroup)
                    count += walk(test.tests);
            }
            return count;
        };

        this.dispatchEventToListeners(WI.AuditTestBase.Event.Progress, {
            index: event.data.index + walk(this._tests.slice(0, this._tests.indexOf(event.target))),
            count: walk(this._tests),
        });
    }

    _handleTestSupportedChanged(event)
    {
        this.determineIfSupported();
    }

    _handleTestChanged(event)
    {
        console.assert(WI.auditManager.editing);

        this.clearResult({excludeTests: true});

        this.dispatchEventToListeners(WI.AuditTestBase.Event.TestChanged);
    }
};

WI.AuditTestGroup.TypeIdentifier = "test-group";

WI.AuditTestGroup.Event = {
    TestAdded: "audit-test-group-test-added",
    TestRemoved: "audit-test-group-test-removed",
};
