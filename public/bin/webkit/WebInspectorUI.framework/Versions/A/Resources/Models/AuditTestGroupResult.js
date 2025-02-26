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

WI.AuditTestGroupResult = class AuditTestGroupResult extends WI.AuditTestResultBase
{
    constructor(name, results, {description} = {})
    {
        console.assert(Array.isArray(results));

        super(name, {description});

        this._results = results;
    }

    // Static

    static async fromPayload(payload)
    {
        if (typeof payload !== "object" || payload === null)
            return null;

        if (payload.type !== WI.AuditTestGroupResult.TypeIdentifier)
            return null;

        if (typeof payload.name !== "string") {
            WI.AuditManager.synthesizeError(WI.UIString("\u0022%s\u0022 has a non-string \u0022%s\u0022 value").format(payload.name, WI.unlocalizedString("name")));
            return null;
        }

        if (!Array.isArray(payload.results)) {
            WI.AuditManager.synthesizeError(WI.UIString("\u0022%s\u0022 has a non-array \u0022%s\u0022 value").format(payload.name, WI.unlocalizedString("results")));
            return null;
        }

        let results = await Promise.all(payload.results.map(async (test) => {
            let testCaseResult = await WI.AuditTestCaseResult.fromPayload(test);
            if (testCaseResult)
                return testCaseResult;

            let testGroupResult = await WI.AuditTestGroupResult.fromPayload(test);
            if (testGroupResult)
                return testGroupResult;

            return null;
        }));
        results = results.filter((result) => !!result);
        if (!results.length)
            return null;

        let options = {};

        if (typeof payload.description === "string")
            options.description = payload.description;
        else if ("description" in payload)
            WI.AuditManager.synthesizeWarning(WI.UIString("\u0022%s\u0022 has a non-string \u0022%s\u0022 value").format(payload.name, WI.unlocalizedString("description")));

        return new WI.AuditTestGroupResult(payload.name, results, options);
    }

    // Public

    get results() { return this._results; }

    get levelCounts()
    {
        let counts = {};
        for (let level of Object.values(WI.AuditTestCaseResult.Level))
            counts[level] = 0;

        for (let result of this._results) {
            if (result instanceof WI.AuditTestCaseResult)
                ++counts[result.level];
            else if (result instanceof WI.AuditTestGroupResult) {
                for (let [level, count] of Object.entries(result.levelCounts))
                    counts[level] += count;
            }
        }

        return counts;
    }

    get didPass()
    {
        return this._results.some((result) => result.didPass);
    }

    get didWarn()
    {
        return this._results.some((result) => result.didWarn);
    }

    get didFail()
    {
        return this._results.some((result) => result.didFail);
    }

    get didError()
    {
        return this._results.some((result) => result.didError);
    }

    get unsupported()
    {
        return this._results.some((result) => result.unsupported);
    }

    toJSON()
    {
        let json = super.toJSON();
        json.results = this._results.map((result) => result.toJSON());
        return json;
    }
};

WI.AuditTestGroupResult.TypeIdentifier = "test-group-result";
