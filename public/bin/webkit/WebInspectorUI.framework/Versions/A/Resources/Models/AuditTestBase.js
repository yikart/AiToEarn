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

WI.AuditTestBase = class AuditTestBase extends WI.Object
{
    constructor(name, {description, supports, setup, disabled} = {})
    {
        console.assert(typeof name === "string", name);
        console.assert(!description || typeof description === "string", description);
        console.assert(supports === undefined || typeof supports === "number", supports);
        console.assert(!setup || typeof setup === "string", setup);
        console.assert(disabled === undefined || typeof disabled === "boolean", disabled);

        super();

        // This class should not be instantiated directly. Create a concrete subclass instead.
        console.assert(this.constructor !== WI.AuditTestBase && this instanceof WI.AuditTestBase, this);

        this._name = name;
        this._description = description || "";
        this._supports = supports ?? NaN;
        this._setup = setup || "";

        this.determineIfSupported({warn: true});

        this._runningState = disabled ? WI.AuditManager.RunningState.Disabled : WI.AuditManager.RunningState.Inactive;
        this._result = null;

        this._parent = null;

        this._default = false;
    }

    // Public

    get runningState() { return this._runningState; }
    get result() { return this._result; }
    get supported() { return this._supported; }

    get name()
    {
        return this._name;
    }

    set name(name)
    {
        console.assert(this.editable);
        console.assert(WI.auditManager.editing);
        console.assert(name && typeof name === "string", name);

        if (name === this._name)
            return;

        let oldName = this._name;
        this._name = name;
        this.dispatchEventToListeners(WI.AuditTestBase.Event.NameChanged, {oldName});
    }

    get description()
    {
        return this._description;
    }

    set description(description)
    {
        console.assert(this.editable);
        console.assert(WI.auditManager.editing);
        console.assert(typeof description === "string", description);

        if (description === this._description)
            return;

        this._description = description;
    }

    get supports()
    {
        return this._supports;
    }

    set supports(supports)
    {
        console.assert(this.editable);
        console.assert(WI.auditManager.editing);
        console.assert(typeof supports === "number", supports);

        if (supports === this._supports)
            return;

        this._supports = supports;
        this.determineIfSupported();
    }

    get setup()
    {
        return this._setup;
    }

    set setup(setup)
    {
        console.assert(this.editable);
        console.assert(typeof setup === "string", setup);

        if (setup === this._setup)
            return;

        this._setup = setup;

        this.clearResult();
    }

    get disabled()
    {
        return this._runningState === WI.AuditManager.RunningState.Disabled;
    }

    set disabled(disabled)
    {
        this.updateDisabled(disabled);
    }

    get editable()
    {
        return !this._default;
    }

    get default()
    {
        return this._default;
    }

    markAsDefault()
    {
        console.assert(!this._default);
        this._default = true;
    }

    get topLevelTest()
    {
        let test = this;
        while (test._parent)
            test = test._parent;
        return test;
    }

    async runSetup()
    {
        console.assert(this.topLevelTest === this);

        if (!this._setup)
            return;

        let target = WI.assumingMainTarget();

        let agentCommandFunction = null;
        let agentCommandArguments = {};
        if (target.hasDomain("Audit")) {
            agentCommandFunction = target.AuditAgent.run;
            agentCommandArguments.test = this._setup;
        } else {
            agentCommandFunction = target.RuntimeAgent.evaluate;
            agentCommandArguments.expression = `(function() { "use strict"; return eval(\`(${this._setup.replace(/`/g, "\\`")})\`)(); })()`;
            agentCommandArguments.objectGroup = AuditTestBase.ObjectGroup;
            agentCommandArguments.doNotPauseOnExceptionsAndMuteConsole = true;
        }

        try {
            let response = await agentCommandFunction.invoke(agentCommandArguments);

            if (response.result.type === "object" && response.result.className === "Promise") {
                if (WI.RuntimeManager.supportsAwaitPromise())
                    response = await target.RuntimeAgent.awaitPromise(response.result.objectId);
                else {
                    response = null;
                    WI.AuditManager.synthesizeError(WI.UIString("Async audits are not supported."));
                }
            }

            if (response) {
                let remoteObject = WI.RemoteObject.fromPayload(response.result, WI.mainTarget);
                if (response.wasThrown || (remoteObject.type === "object" && remoteObject.subtype === "error"))
                    WI.AuditManager.synthesizeError(remoteObject.description);
            }
        } catch (error) {
            WI.AuditManager.synthesizeError(error.message);
        }
    }

    async start()
    {
        // Called from WI.AuditManager.

        if (!this._supported || this.disabled)
            return;

        console.assert(WI.auditManager.runningState === WI.AuditManager.RunningState.Active);

        console.assert(this._runningState === WI.AuditManager.RunningState.Inactive);
        if (this._runningState !== WI.AuditManager.RunningState.Inactive)
            return;

        this._runningState = WI.AuditManager.RunningState.Active;
        this.dispatchEventToListeners(WI.AuditTestBase.Event.Scheduled);

        await this.run();

        this._runningState = WI.AuditManager.RunningState.Inactive;
        this.dispatchEventToListeners(WI.AuditTestBase.Event.Completed);
    }

    stop()
    {
        // Called from WI.AuditManager.
        // Overridden by sub-classes if needed.

        if (!this._supported || this.disabled)
            return;

        console.assert(WI.auditManager.runningState === WI.AuditManager.RunningState.Stopping);

        if (this._runningState !== WI.AuditManager.RunningState.Active)
            return;

        this._runningState = WI.AuditManager.RunningState.Stopping;
        this.dispatchEventToListeners(WI.AuditTestBase.Event.Stopping);
    }

    clearResult(options = {})
    {
        // Overridden by sub-classes if needed.

        if (!this._result)
            return false;

        this._result = null;

        if (!options.suppressResultChangedEvent)
            this.dispatchEventToListeners(WI.AuditTestBase.Event.ResultChanged);

        return true;
    }

    async clone()
    {
        console.assert(WI.auditManager.editing);

        return this.constructor.fromPayload(this.toJSON());
    }

    remove()
    {
        console.assert(WI.auditManager.editing);

        if (!this._parent || this._default) {
            WI.auditManager.removeTest(this);
            return;
        }

        console.assert(this.editable);
        console.assert(this._parent instanceof WI.AuditTestGroup);
        this._parent.removeTest(this);
    }

    saveIdentityToCookie(cookie)
    {
        let path = [];
        let test = this;
        while (test) {
            path.push(test.name);
            test = test._parent;
        }
        path.reverse();

        cookie["audit-path"] = path.join(",");
    }

    toJSON(key)
    {
        // Overridden by sub-classes if needed.

        let json = {
            type: this.constructor.TypeIdentifier,
            name: this._name,
        };
        if (this._description)
            json.description = this._description;
        if (!isNaN(this._supports))
            json.supports = Number.isFinite(this._supports) ? this._supports : WI.AuditTestBase.Version + 1;
        if (this._setup)
            json.setup = this._setup;
        if (key === WI.ObjectStore.toJSONSymbol)
            json.disabled = this.disabled;
        return json;
    }

    // Protected

    async run()
    {
        throw WI.NotImplementedError.subclassMustOverride();
    }

    determineIfSupported(options = {})
    {
        // Overridden by sub-classes if needed.

        let supportedBefore = this._supported;

        if (this._supports > WI.AuditTestBase.Version) {
            this.updateSupported(false, options);

            if (options.warn && supportedBefore !== this._supported && Number.isFinite(this._supports))
                WI.AuditManager.synthesizeWarning(WI.UIString("\u0022%s\u0022 is too new to run in this Web Inspector").format(this.name));
        } else if (InspectorBackend.hasDomain("Audit") && this._supports > InspectorBackend.getVersion("Audit")) {
            this.updateSupported(false, options);

            if (options.warn && supportedBefore !== this._supported && Number.isFinite(this._supports))
                WI.AuditManager.synthesizeWarning(WI.UIString("\u0022%s\u0022 is too new to run in the inspected page").format(this.name));
        } else
            this.updateSupported(true, options);

        return this._supported;
    }

    updateSupported(supported, options = {})
    {
        // Overridden by sub-classes if needed.

        if (supported === this._supported)
            return;

        this._supported = supported;

        if (!options.silent)
            this.dispatchEventToListeners(WI.AuditTestBase.Event.SupportedChanged);

        if (!this._supported)
            this.clearResult();
    }

    updateDisabled(disabled, options = {})
    {
        // Overridden by sub-classes if needed.

        console.assert(this._runningState === WI.AuditManager.RunningState.Disabled || this._runningState === WI.AuditManager.RunningState.Inactive);
        if (this._runningState !== WI.AuditManager.RunningState.Disabled && this._runningState !== WI.AuditManager.RunningState.Inactive)
            return;

        let runningState = disabled ? WI.AuditManager.RunningState.Disabled : WI.AuditManager.RunningState.Inactive;
        if (runningState === this._runningState)
            return;

        this._runningState = runningState;

        if (!options.silent)
            this.dispatchEventToListeners(WI.AuditTestBase.Event.DisabledChanged);

        if (this.disabled)
            this.clearResult();
    }

    updateResult(result)
    {
        // Overridden by sub-classes if needed.

        console.assert(result instanceof WI.AuditTestResultBase, result);

        this._result = result;

        this.dispatchEventToListeners(WI.AuditTestBase.Event.ResultChanged);
    }
};

// Keep this in sync with Inspector::Protocol::Audit::VERSION.
WI.AuditTestBase.Version = 4;

WI.AuditTestBase.ObjectGroup = "audit";

WI.AuditTestBase.Event = {
    Completed: "audit-test-base-completed",
    DisabledChanged: "audit-test-base-disabled-changed",
    NameChanged: "audit-test-base-name-changed",
    Progress: "audit-test-base-progress",
    ResultChanged: "audit-test-base-result-changed",
    Scheduled: "audit-test-base-scheduled",
    Stopping: "audit-test-base-stopping",
    SupportedChanged: "audit-test-base-supported-changed",
    TestChanged: "audit-test-base-test-changed",
};
