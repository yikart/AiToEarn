/*
 * Copyright (C) 2018 Apple Inc. All rights reserved.
 * Copyright 2017 The Chromium Authors. All rights reserved.
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

WI.ServerTimingEntry = class ServerTimingEntry
{
    constructor(name)
    {
        this._name = name;
        this._duration = undefined;
        this._description = undefined;
    }

    // Static

    static parseHeaders(valueString = "")
    {
        // https://w3c.github.io/server-timing/#the-server-timing-header-field
        function trimLeadingWhiteSpace() {
            valueString = valueString.trimStart();
        }

        function consumeDelimiter(char) {
            console.assert(char.length === 1);
            trimLeadingWhiteSpace();
            if (valueString.charAt(0) !== char)
                return false;

            valueString = valueString.substring(1);
            return true;
        }

        function consumeToken() {
            // https://tools.ietf.org/html/rfc7230#appendix-B
            let result = /^(?:\s*)([\w!#$%&'*+\-.^`|~]+)(?:\s*)(.*)/.exec(valueString);
            if (!result)
                return null;

            valueString = result[2];
            return result[1];
        }

        function consumeTokenOrQuotedString() {
            trimLeadingWhiteSpace();
            if (valueString.charAt(0) === "\"")
                return consumeQuotedString();

            return consumeToken();
        }

        function consumeQuotedString() {
            // https://tools.ietf.org/html/rfc7230#section-3.2.6
            console.assert(valueString.charAt(0) === "\"");

            // Consume the leading DQUOTE.
            valueString = valueString.substring(1);

            let unescapedValueString = "";
            for (let i = 0; i < valueString.length; ++i) {
                let char = valueString.charAt(i);
                switch (char) {
                  case "\\":
                    // Backslash character found, ignore it.
                    ++i;
                    if (i < valueString.length) {
                        // Take the character after the backslash.
                        unescapedValueString += valueString.charAt(i);
                    }
                    break;
                case "\"":
                    // Trailing DQUOTE.
                    valueString = valueString.substring(i + 1);
                    return unescapedValueString;
                default:
                    unescapedValueString += char;
                    break;
                }
            }

            // No trailing DQUOTE found, this was not a valid quoted-string. Consume the entire string to complete parsing.
            valueString = "";
            return null;
        }

        function consumeExtraneous() {
            let result = /([,;].*)/.exec(valueString);
            if (result)
                valueString = result[1];
        }

        function getParserForParameter(paramName) {
            switch (paramName) {
            case "dur":
                return function(paramValue, entry) {
                    if (paramValue !== null) {
                        let duration = parseFloat(paramValue);
                        if (!isNaN(duration)) {
                            entry.duration = duration;
                            return;
                        }
                    }
                    entry.duration = 0;
                };

            case "desc":
                return function(paramValue, entry) {
                    entry.description = paramValue || "";
                };

            default:
                return null;
            }
        }

        let entries = [];
        let name;
        while ((name = consumeToken()) !== null) {
            let entry = new WI.ServerTimingEntry(name);

            while (consumeDelimiter(";")) {
                let paramName;
                if ((paramName = consumeToken()) === null)
                    continue;

                paramName = paramName.toLowerCase();
                let parseParameter = getParserForParameter(paramName);
                let paramValue = null;
                if (consumeDelimiter("=")) {
                    // Always parse the value, even if we don't recognize the parameter name.
                    paramValue = consumeTokenOrQuotedString();
                    consumeExtraneous();
                }

                if (parseParameter)
                    parseParameter(paramValue, entry);
                else
                    console.warn("Unknown Server-Timing parameter:", paramName, paramValue);
            }

            entries.push(entry);
            if (!consumeDelimiter(","))
                break;
        }

        return entries;
    }

    // Public

    get name() { return this._name; }
    get duration() { return this._duration; }
    get description() { return this._description; }

    set duration(duration)
    {
        if (this._duration !== undefined) {
            console.warn("Ignoring redundant duration.");
            return;
        }

        this._duration = duration;
    }

    set description(description)
    {
        if (this._description !== undefined) {
            console.warn("Ignoring redundant description.");
            return;
        }

        this._description = description;
    }
};
