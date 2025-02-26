/*
 * Copyright (C) 2010 Nikita Vasilyev. All rights reserved.
 * Copyright (C) 2010 Joseph Pecoraro. All rights reserved.
 * Copyright (C) 2010 Google Inc. All rights reserved.
 * Copyright (C) 2013 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

WI.CSSCompletions = class CSSCompletions
{
    constructor(values, {acceptEmptyPrefix} = {})
    {
        console.assert(Array.isArray(values), values);
        console.assert(!values.length || typeof values[0] === "string", "Expected an array of string values or an empty array", values);

        this._values = values.slice();
        this._values.sort();
        this._acceptEmptyPrefix = !!acceptEmptyPrefix;
        this._queryController = null;
    }

    // Static

    static completeUnbalancedValue(value)
    {
        const State = {
            Data: 0,
            SingleQuoteString: 1,
            DoubleQuoteString: 2,
            Comment: 3
        };

        let state = State.Data;
        let unclosedParenthesisCount = 0;
        let trailingBackslash = false;
        let length = value.length;

        for (let i = 0; i < length; ++i) {
            switch (value[i]) {
            case "'":
                if (state === State.Data)
                    state = State.SingleQuoteString;
                else if (state === State.SingleQuoteString)
                    state = State.Data;
                break;

            case "\"":
                if (state === State.Data)
                    state = State.DoubleQuoteString;
                else if (state === State.DoubleQuoteString)
                    state = State.Data;
                break;

            case "(":
                if (state === State.Data)
                    ++unclosedParenthesisCount;
                break;

            case ")":
                if (state === State.Data && unclosedParenthesisCount)
                    --unclosedParenthesisCount;
                break;

            case "/":
                if (state === State.Data) {
                    if (value[i + 1] === "*")
                        state = State.Comment;
                }
                break;

            case "\\":
                if (i === length - 1)
                    trailingBackslash = true;
                else
                    ++i; // Skip next character.
                break;

            case "*":
                if (state === State.Comment) {
                    if (value[i + 1] === "/")
                        state = State.Data;
                }
                break;
            }
        }

        let suffix = "";

        if (trailingBackslash)
            suffix += "\\";

        switch (state) {
        case State.SingleQuoteString:
            suffix += "'";
            break;
        case State.DoubleQuoteString:
            suffix += "\"";
            break;
        case State.Comment:
            suffix += "*/";
            break;
        }

        suffix += ")".repeat(unclosedParenthesisCount);

        return suffix;
    }

    static getCompletionText(completion)
    {
        // FIXME <https://webkit.org/b/273721>: Make callers use the more generic WI.Completions.getCompletionText instead.
        return WI.Completions.getCompletionText(completion);
    }

    // Public

    get values()
    {
        return this._values;
    }

    executeQuery(query)
    {
        if (!query)
            return this._acceptEmptyPrefix ? this._values.slice() : [];

        this._queryController ||= new WI.CSSQueryController(this._values);

        return this._queryController.executeQuery(query);
    }

    startsWith(prefix)
    {
        if (!prefix)
            return this._acceptEmptyPrefix ? this._values.slice() : [];

        let firstIndex = this._firstIndexOfPrefix(prefix);
        if (firstIndex === -1)
            return [];

        let results = [];
        while (firstIndex < this._values.length && this._values[firstIndex].startsWith(prefix))
            results.push(this._values[firstIndex++]);
        return results;
    }

    // Protected

    replaceValues(values)
    {
        console.assert(Array.isArray(values), values);
        console.assert(typeof values[0] === "string", "Expect an array of string values", values);

        this._values = values;
        this._values.sort();

        this._queryController?.reset();
        this._queryController?.addValues(values);
    }

    // Private

    _firstIndexOfPrefix(prefix)
    {
        if (!this._values.length)
            return -1;
        if (!prefix)
            return this._acceptEmptyPrefix ? 0 : -1;

        var maxIndex = this._values.length - 1;
        var minIndex = 0;
        var foundIndex;

        do {
            var middleIndex = (maxIndex + minIndex) >> 1;
            if (this._values[middleIndex].startsWith(prefix)) {
                foundIndex = middleIndex;
                break;
            }
            if (this._values[middleIndex] < prefix)
                minIndex = middleIndex + 1;
            else
                maxIndex = middleIndex - 1;
        } while (minIndex <= maxIndex);

        if (foundIndex === undefined)
            return -1;

        while (foundIndex && this._values[foundIndex - 1].startsWith(prefix))
            foundIndex--;

        return foundIndex;
    }
};

WI.CSSCompletions.lengthUnits = new Set([
    "ch",
    "cm",
    "dvb",
    "dvh",
    "dvi",
    "dvmax",
    "dvmin",
    "dvw",
    "em",
    "ex",
    "in",
    "lvb",
    "lvh",
    "lvi",
    "lvmax",
    "lvmin",
    "lvw",
    "mm",
    "pc",
    "pt",
    "px",
    "q",
    "rem",
    "svb",
    "svh",
    "svi",
    "svmax",
    "svmin",
    "svw",
    "vb",
    "vh",
    "vi",
    "vmax",
    "vmin",
    "vw",
]);
