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

WI.AuditTestCaseResult = class AuditTestCaseResult extends WI.AuditTestResultBase
{
    constructor(name, level, {description, data, metadata, resolvedDOMNodes} = {})
    {
        console.assert(Object.values(WI.AuditTestCaseResult.Level).includes(level));
        console.assert(!data || typeof data === "object");
        console.assert(!metadata || typeof metadata === "object");

        super(name, {description});

        this._level = level;
        this._data = data || {};
        this._metadata = metadata || {};

        // This array is a mirror of `this._data.domNodes` where each item is a `WI.DOMNode`.
        this._resolvedDOMNodes = resolvedDOMNodes || [];
    }

    // Static

    static async fromPayload(payload)
    {
        if (typeof payload !== "object" || payload === null)
            return null;

        if (payload.type !== WI.AuditTestCaseResult.TypeIdentifier)
            return null;

        if (typeof payload.name !== "string") {
            WI.AuditManager.synthesizeError(WI.UIString("\u0022%s\u0022 has a non-string \u0022%s\u0022 value").format(payload.name, WI.unlocalizedString("name")));
            return null;
        }

        if (!Object.values(WI.AuditTestCaseResult.Level).includes(payload.level)) {
            WI.AuditManager.synthesizeError(WI.UIString("\u0022%s\u0022 has an invalid \u0022%s\u0022 value").format(payload.name, WI.unlocalizedString("level")));
            return null;
        }

        if (typeof payload.data !== "object" || payload.data === null) {
            if ("data" in payload)
                WI.AuditManager.synthesizeWarning(WI.UIString("\u0022%s\u0022 has a non-object \u0022%s\u0022 value").format(payload.name, WI.unlocalizedString("data")));
            payload.data = {};
        } else {
            function checkArray(key) {
                if (!(key in payload.data))
                    return;

                if (!Array.isArray(payload.data[key])) {
                    WI.AuditManager.synthesizeWarning(WI.UIString("\u0022%s\u0022 has a non-array \u0022%s\u0022 value").format(payload.name, WI.unlocalizedString("data.%s").format(key)));
                    payload.data[key] = [];
                }

                payload.data[key] = payload.data[key].filter((item) => typeof item === "string");
            }
            checkArray("domNodes");
            checkArray("domAttributes");
            checkArray("errors");
        }

        if (typeof payload.metadata !== "object" || payload.metadata === null) {
            if ("metadata" in payload)
                WI.AuditManager.synthesizeWarning(WI.UIString("\u0022%s\u0022 has a non-object \u0022%s\u0022 value").format(payload.name, WI.unlocalizedString("metadata")));

            payload.metadata = {};
        } else {
            if (typeof payload.metadata.startTimestamp === "string")
                payload.metadata.startTimestamp = new Date(payload.metadata.startTimestamp);
            else {
                if ("startTimestamp" in payload.metadata)
                    WI.AuditManager.synthesizeWarning(WI.UIString("\u0022%s\u0022 has a non-object \u0022%s\u0022 value").format(payload.name, WI.unlocalizedString("metadata.startTimestamp")));

                payload.metadata.startTimestamp = null;
            }

            if (typeof payload.metadata.asyncTimestamp === "string")
                payload.metadata.asyncTimestamp = new Date(payload.metadata.asyncTimestamp);
            else {
                if ("asyncTimestamp" in payload.metadata)
                    WI.AuditManager.synthesizeWarning(WI.UIString("\u0022%s\u0022 has a non-object \u0022%s\u0022 value").format(payload.name, WI.unlocalizedString("metadata.asyncTimestamp")));

                payload.metadata.asyncTimestamp = null;
            }

            if (typeof payload.metadata.endTimestamp === "string")
                payload.metadata.endTimestamp = new Date(payload.metadata.endTimestamp);
            else {
                if ("endTimestamp" in payload.metadata)
                    WI.AuditManager.synthesizeWarning(WI.UIString("\u0022%s\u0022 has a non-object \u0022%s\u0022 value").format(payload.name, WI.unlocalizedString("metadata.endTimestamp")));

                payload.metadata.endTimestamp = null;
            }

            if (typeof payload.metadata.url !== "string") {
                if ("url" in payload.metadata)
                    WI.AuditManager.synthesizeWarning(WI.UIString("\u0022%s\u0022 has a non-object \u0022%s\u0022 value").format(payload.name, WI.unlocalizedString("metadata.url")));

                payload.metadata.url = null;
            }
        }

        let options = {};

        if (typeof payload.description === "string")
            options.description = payload.description;
        else if ("description" in payload)
            WI.AuditManager.synthesizeWarning(WI.UIString("\u0022%s\u0022 has a non-string \u0022%s\u0022 value").format(payload.name, WI.unlocalizedString("description")));

        if (!isEmptyObject(payload.data)) {
            options.data = {};
            for (let key in payload.data) {
                if (key === "domNodes" || key === "domAttributes" || key === "errors") {
                    if (!payload.data[key].length)
                        continue;
                }

                if (key === "domNodes") {
                    if (InspectorBackend.hasDomain("DOM") && (!payload.metadata.url || payload.metadata.url === WI.networkManager.mainFrame.url)) {
                        let documentNode = await new Promise((resolve) => WI.domManager.requestDocument(resolve));
                        options.resolvedDOMNodes = await Promise.all(payload.data.domNodes.map(async (domNodeString) => {
                            let nodeId = 0;
                            try {
                                nodeId = await documentNode.querySelector(domNodeString);
                            } catch { }
                            return WI.domManager.nodeForId(nodeId);
                        }));
                    }
                }

                options.data[key] = payload.data[key];
            }
        }

        if (!isEmptyObject(payload.metadata)) {
            options.metadata = {};
            if (payload.metadata.startTimestamp && !isNaN(payload.metadata.startTimestamp))
                options.metadata.startTimestamp = payload.metadata.startTimestamp;
            if (payload.metadata.asyncTimestamp && !isNaN(payload.metadata.asyncTimestamp))
                options.metadata.asyncTimestamp = payload.metadata.asyncTimestamp;
            if (payload.metadata.endTimestamp && !isNaN(payload.metadata.endTimestamp))
                options.metadata.endTimestamp = payload.metadata.endTimestamp;
            if (payload.metadata.url)
                options.metadata.url = payload.metadata.url;
        }

        return new WI.AuditTestCaseResult(payload.name, payload.level, options);
    }

    // Public

    get level() { return this._level; }
    get data() { return this._data; }
    get metadata() { return this._metadata; }
    get resolvedDOMNodes() { return this._resolvedDOMNodes; }

    get result()
    {
        return this;
    }

    get didPass()
    {
        return this._level === WI.AuditTestCaseResult.Level.Pass;
    }

    get didWarn()
    {
        return this._level === WI.AuditTestCaseResult.Level.Warn;
    }

    get didFail()
    {
        return this._level === WI.AuditTestCaseResult.Level.Fail;
    }

    get didError()
    {
        return this._level === WI.AuditTestCaseResult.Level.Error;
    }

    get unsupported()
    {
        return this._level === WI.AuditTestCaseResult.Level.Unsupported;
    }

    toJSON()
    {
        let json = super.toJSON();
        json.level = this._level;

        let data = {};
        for (let key in this._data) {
            if (key === "domNodes" || key === "domAttributes" || key === "errors") {
                if (!this._data[key].length)
                    continue;
            }

            data[key] = this._data[key];
        }
        if (!isEmptyObject(data))
            json.data = data;

        let metadata = {};
        if (this._metadata.startTimestamp && !isNaN(this._metadata.startTimestamp))
            metadata.startTimestamp = this._metadata.startTimestamp;
        if (this._metadata.asyncTimestamp && !isNaN(this._metadata.asyncTimestamp))
            metadata.asyncTimestamp = this._metadata.asyncTimestamp;
        if (this._metadata.endTimestamp && !isNaN(this._metadata.endTimestamp))
            metadata.endTimestamp = this._metadata.endTimestamp;
        if (this._metadata.url)
            metadata.url = this._metadata.url;
        if (!isEmptyObject(metadata))
            json.metadata = metadata;

        return json;
    }
};

WI.AuditTestCaseResult.TypeIdentifier = "test-case-result";

// Keep this ordered by precedence.
WI.AuditTestCaseResult.Level = {
    Pass: "pass",
    Warn: "warn",
    Fail: "fail",
    Error: "error",
    Unsupported: "unsupported",
};
