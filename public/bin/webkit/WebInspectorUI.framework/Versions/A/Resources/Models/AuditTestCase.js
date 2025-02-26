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

WI.AuditTestCase = class AuditTestCase extends WI.AuditTestBase
{
    constructor(name, test, options = {})
    {
        console.assert(typeof test === "string", test);

        super(name, options);

        this._test = test;
    }

    // Static

    static async fromPayload(payload)
    {
        if (typeof payload !== "object" || payload === null)
            return null;

        if (payload.type !== WI.AuditTestCase.TypeIdentifier)
            return null;

        if (typeof payload.name !== "string") {
            WI.AuditManager.synthesizeError(WI.UIString("\u0022%s\u0022 has a non-string \u0022%s\u0022 value").format(payload.name, WI.unlocalizedString("name")));
            return null;
        }

        if (typeof payload.test !== "string") {
            WI.AuditManager.synthesizeError(WI.UIString("\u0022%s\u0022 has a non-string \u0022%s\u0022 value").format(payload.name, WI.unlocalizedString("test")));
            return null;
        }

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

        return new WI.AuditTestCase(payload.name, payload.test, options);
    }

    // Public

    get test()
    {
        return this._test;
    }

    set test(test)
    {
        console.assert(this.editable);
        console.assert(typeof test === "string", test);

        if (test === this._test)
            return;

        this._test = test;

        this.clearResult();

        this.dispatchEventToListeners(WI.AuditTestBase.Event.TestChanged);
    }

    toJSON(key)
    {
        let json = super.toJSON(key);
        json.test = this._test;
        return json;
    }

    // Protected

    async run()
    {
        const levelStrings = Object.values(WI.AuditTestCaseResult.Level);
        let level = null;
        let data = {};
        let metadata = {
            url: WI.networkManager.mainFrame.url,
            startTimestamp: null,
            endTimestamp: null,
        };
        let resolvedDOMNodes = null;

        function setLevel(newLevel) {
            let newLevelIndex = levelStrings.indexOf(newLevel);
            if (newLevelIndex < 0) {
                addError(WI.UIString("Return string must be one of %s").format(JSON.stringify(levelStrings)));
                return;
            }

            if (newLevelIndex <= levelStrings.indexOf(level))
                return;

            level = newLevel;
        }

        function addError(value) {
            setLevel(WI.AuditTestCaseResult.Level.Error);

            if (!data.errors)
                data.errors = [];

            data.errors.push(value);
        }

        async function parseResponse(response) {
            let remoteObject = WI.RemoteObject.fromPayload(response.result, WI.mainTarget);
            if (response.wasThrown || (remoteObject.type === "object" && remoteObject.subtype === "error")) {
                addError(remoteObject.description);
                return;
            }

            if (remoteObject.type === "boolean") {
                setLevel(remoteObject.value ? WI.AuditTestCaseResult.Level.Pass : WI.AuditTestCaseResult.Level.Fail);
                return;
            }

            if (remoteObject.type === "string") {
                setLevel(remoteObject.value.trim().toLowerCase());
                return;
            }

            if (remoteObject.type !== "object" || remoteObject.subtype) {
                addError(WI.UIString("Return value is not an object, string, or boolean"));
                return;
            }

            const options = {
                ownProperties: true,
            };

            function checkResultProperty(key, value, type, subtype) {
                function addErrorForValueType(valueType) {
                    let errorString = null;
                    if (valueType === "object" || valueType === "array")
                        errorString = WI.UIString("\u0022%s\u0022 must be an %s");
                    else
                        errorString = WI.UIString("\u0022%s\u0022 must be a %s");
                    addError(errorString.format(key, valueType));
                }

                if (value.subtype !== subtype) {
                    addErrorForValueType(subtype);
                    return null;
                }

                if (value.type !== type) {
                    addErrorForValueType(type);
                    return null;
                }

                if (type === "boolean" || type === "string")
                    return value.value;

                return value;
            }

            async function resultArrayForEach(key, value, callback) {
                let array = checkResultProperty(key, value, "object", "array");
                if (!array)
                    return;

                let arrayProperties = await new Promise((resolve, reject) => array.getPropertyDescriptors(resolve, options));
                for (let i = 0; i < array.size; ++i) {
                    let arrayPropertyForIndex = arrayProperties.find((arrayProperty) => arrayProperty.name === String(i));
                    if (arrayPropertyForIndex)
                        await callback(arrayPropertyForIndex);
                }
            }

            let properties = await new Promise((resolve, reject) => remoteObject.getPropertyDescriptors(resolve, options));
            for (let property of properties) {
                let key = property.name;
                if (key === "__proto__")
                    continue;

                let value = property.value;

                switch (key) {
                case "level": {
                    let levelString = checkResultProperty(key, value, "string");
                    if (levelString)
                        setLevel(levelString.trim().toLowerCase());
                    break;
                }

                case "pass":
                    if (checkResultProperty(key, value, "boolean"))
                        setLevel(WI.AuditTestCaseResult.Level.Pass);
                    break;

                case "warn":
                    if (checkResultProperty(key, value, "boolean"))
                        setLevel(WI.AuditTestCaseResult.Level.Warn);
                    break;

                case "fail":
                    if (checkResultProperty(key, value, "boolean"))
                        setLevel(WI.AuditTestCaseResult.Level.Fail);
                    break;

                case "error":
                    if (checkResultProperty(key, value, "boolean"))
                        setLevel(WI.AuditTestCaseResult.Level.Error);
                    break;

                case "unsupported":
                    if (checkResultProperty(key, value, "boolean"))
                        setLevel(WI.AuditTestCaseResult.Level.Unsupported);
                    break;

                case "domNodes":
                    await resultArrayForEach(key, value, async (item) => {
                        if (!item || !item.value || item.value.type !== "object" || item.value.subtype !== "node") {
                            addError(WI.UIString("All items in \u0022%s\u0022 must be valid DOM nodes").format(WI.unlocalizedString("domNodes")));
                            return;
                        }

                        let domNodeId = await new Promise((resolve, reject) => item.value.pushNodeToFrontend(resolve));
                        let domNode = WI.domManager.nodeForId(domNodeId);
                        if (!domNode)
                            return;

                        if (!data.domNodes)
                            data.domNodes = [];
                        data.domNodes.push(WI.cssPath(domNode, {full: true}));

                        if (!resolvedDOMNodes)
                            resolvedDOMNodes = [];
                        resolvedDOMNodes.push(domNode);
                    });
                    break;

                case "domAttributes":
                    await resultArrayForEach(key, value, (item) => {
                        if (!item || !item.value || item.value.type !== "string" || !item.value.value.length) {
                            addError(WI.UIString("All items in \u0022%s\u0022 must be non-empty strings").format(WI.unlocalizedString("domAttributes")));
                            return;
                        }

                        if (!data.domAttributes)
                            data.domAttributes = [];
                        data.domAttributes.push(item.value.value);
                    });
                    break;

                case "errors":
                    await resultArrayForEach(key, value, (item) => {
                        if (!item || !item.value || item.value.type !== "object" || item.value.subtype !== "error") {
                            addError(WI.UIString("All items in \u0022%s\u0022 must be error objects").format(WI.unlocalizedString("errors")));
                            return;
                        }

                        addError(item.value.description);
                    });
                    break;

                default:
                    if (value.objectId) {
                        try {
                            function inspectedPage_stringify() {
                                return JSON.stringify(this);
                            }
                            let stringifiedValue = await value.callFunction(inspectedPage_stringify);
                            data[key] = JSON.parse(stringifiedValue.value);
                        } catch {
                            addError(WI.UIString("\u0022%s\u0022 is not JSON serializable").format(key));
                        }
                    } else
                        data[key] = value.value;
                    break;
                }
            }
        }

        let target = WI.assumingMainTarget();

        let agentCommandFunction = null;
        let agentCommandArguments = {};
        if (target.hasDomain("Audit")) {
            agentCommandFunction = target.AuditAgent.run;
            agentCommandArguments.test = this._test;
        } else {
            agentCommandFunction = target.RuntimeAgent.evaluate;
            agentCommandArguments.expression = `(function() { "use strict"; return eval(\`(${this._test.replace(/`/g, "\\`")})\`)(); })()`;
            agentCommandArguments.objectGroup = WI.AuditTestCase.ObjectGroup;
            agentCommandArguments.doNotPauseOnExceptionsAndMuteConsole = true;
        }

        try {
            metadata.startTimestamp = new Date;
            let response = await agentCommandFunction.invoke(agentCommandArguments);
            metadata.endTimestamp = new Date;

            if (response.result.type === "object" && response.result.className === "Promise") {
                if (WI.RuntimeManager.supportsAwaitPromise()) {
                    metadata.asyncTimestamp = metadata.endTimestamp;
                    response = await target.RuntimeAgent.awaitPromise(response.result.objectId);
                    metadata.endTimestamp = new Date;
                } else {
                    response = null;
                    addError(WI.UIString("Async audits are not supported."));
                    setLevel(WI.AuditTestCaseResult.Level.Unsupported);
                }
            }

            if (response)
                await parseResponse(response);
        } catch (error) {
            metadata.endTimestamp = new Date;
            addError(error.message);
        }

        if (!level)
            addError(WI.UIString("Missing result level"));

        let options = {
            description: this.description,
            metadata,
        };
        if (!isEmptyObject(data))
            options.data = data;
        if (resolvedDOMNodes)
            options.resolvedDOMNodes = resolvedDOMNodes;
        this.updateResult(new WI.AuditTestCaseResult(this.name, level, options));
    }
};

WI.AuditTestCase.TypeIdentifier = "test-case";
