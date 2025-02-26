/*
 * Copyright (C) 2013, 2016 Apple Inc. All rights reserved.
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

WI.IssueMessage = class IssueMessage extends WI.Object
{
    constructor(consoleMessage)
    {
        super();

        console.assert(consoleMessage instanceof WI.ConsoleMessage);

        this._consoleMessage = consoleMessage;

        this._text = this._issueText();

        switch (this._consoleMessage.source) {
        case WI.ConsoleMessage.MessageSource.JS:
            // FIXME: It would be nice if we had this information (the specific type of JavaScript error)
            // as part of the data passed from WebCore, instead of having to determine it ourselves.
            var prefixRegex = /^([^:]+): (?:DOM Exception \d+: )?/;
            var match = prefixRegex.exec(this._text);
            if (match && match[1] in WI.IssueMessage.Type._prefixTypeMap) {
                this._type = WI.IssueMessage.Type._prefixTypeMap[match[1]];
                this._text = this._text.substring(match[0].length);
            } else
                this._type = WI.IssueMessage.Type.OtherIssue;
            break;

        case WI.ConsoleMessage.MessageSource.CSS:
        case WI.ConsoleMessage.MessageSource.XML:
            this._type = WI.IssueMessage.Type.PageIssue;
            break;

        case WI.ConsoleMessage.MessageSource.Network:
            this._type = WI.IssueMessage.Type.NetworkIssue;
            break;

        case WI.ConsoleMessage.MessageSource.Security:
            this._type = WI.IssueMessage.Type.SecurityIssue;
            break;

        case WI.ConsoleMessage.MessageSource.ConsoleAPI:
        case WI.ConsoleMessage.MessageSource.Storage:
        case WI.ConsoleMessage.MessageSource.Appcache:
        case WI.ConsoleMessage.MessageSource.Rendering:
        case WI.ConsoleMessage.MessageSource.Media:
        case WI.ConsoleMessage.MessageSource.Mediasource:
        case WI.ConsoleMessage.MessageSource.WebRTC:
        case WI.ConsoleMessage.MessageSource.ITPDebug:
        case WI.ConsoleMessage.MessageSource.PrivateClickMeasurement:
        case WI.ConsoleMessage.MessageSource.PaymentRequest:
        case WI.ConsoleMessage.MessageSource.AdClickAttribution: // COMPATIBILITY (iOS 14.0): `Console.ChannelSource.AdClickAttribution` was renamed to `Console.ChannelSource.PrivateClickMeasurement`.
        case WI.ConsoleMessage.MessageSource.Other:
            this._type = WI.IssueMessage.Type.OtherIssue;
            break;

        default:
            console.error("Unknown issue source:", this._consoleMessage.source);
            this._type = WI.IssueMessage.Type.OtherIssue;
        }

        this._sourceCodeLocation = consoleMessage.sourceCodeLocation;
        if (this._sourceCodeLocation)
            this._sourceCodeLocation.addEventListener(WI.SourceCodeLocation.Event.DisplayLocationChanged, this._sourceCodeLocationDisplayLocationChanged, this);
    }

    // Static

    static displayName(type)
    {
        switch (type) {
        case WI.IssueMessage.Type.SemanticIssue:
            return WI.UIString("Semantic Issue");
        case WI.IssueMessage.Type.RangeIssue:
            return WI.UIString("Range Issue");
        case WI.IssueMessage.Type.ReferenceIssue:
            return WI.UIString("Reference Issue");
        case WI.IssueMessage.Type.TypeIssue:
            return WI.UIString("Type Issue");
        case WI.IssueMessage.Type.PageIssue:
            return WI.UIString("Page Issue");
        case WI.IssueMessage.Type.NetworkIssue:
            return WI.UIString("Network Issue");
        case WI.IssueMessage.Type.SecurityIssue:
            return WI.UIString("Security Issue");
        case WI.IssueMessage.Type.OtherIssue:
            return WI.UIString("Other Issue");
        default:
            console.error("Unknown issue message type:", type);
            return WI.UIString("Other Issue");
        }
    }

    // Public

    get text() { return this._text; }
    get type() { return this._type; }
    get level() { return this._consoleMessage.level; }
    get source() { return this._consoleMessage.source; }
    get url() { return this._consoleMessage.url; }
    get sourceCodeLocation() { return this._sourceCodeLocation; }

    // Protected

    saveIdentityToCookie(cookie)
    {
        cookie[WI.IssueMessage.URLCookieKey] = this.url;
        cookie[WI.IssueMessage.LineNumberCookieKey] = this._sourceCodeLocation ? this._sourceCodeLocation.lineNumber : 0;
        cookie[WI.IssueMessage.ColumnNumberCookieKey] = this._sourceCodeLocation ? this._sourceCodeLocation.columnNumber : 0;
    }

    // Private

    _issueText()
    {
        let parameters = this._consoleMessage.parameters;
        if (!parameters)
            return this._consoleMessage.messageText;

        if (parameters[0].type !== "string")
            return this._consoleMessage.messageText;

        function valueFormatter(obj)
        {
            return obj.description;
        }

        let formatters = {};
        formatters.o = valueFormatter;
        formatters.s = valueFormatter;
        formatters.f = valueFormatter;
        formatters.i = valueFormatter;
        formatters.d = valueFormatter;

        function append(a, b)
        {
            a += b;
            return a;
        }

        let result = String.format(parameters[0].description, parameters.slice(1), formatters, "", append);
        let resultText = result.formattedResult;

        for (let i = 0; i < result.unusedSubstitutions.length; ++i)
            resultText += " " + result.unusedSubstitutions[i].description;

        return resultText;
    }

    _sourceCodeLocationDisplayLocationChanged(event)
    {
        this.dispatchEventToListeners(WI.IssueMessage.Event.DisplayLocationDidChange, event.data);
    }
};

WI.IssueMessage.Level = {
    Error: "error",
    Warning: "warning"
};

WI.IssueMessage.Type = {
    SemanticIssue: "issue-message-type-semantic-issue",
    RangeIssue: "issue-message-type-range-issue",
    ReferenceIssue: "issue-message-type-reference-issue",
    TypeIssue: "issue-message-type-type-issue",
    PageIssue: "issue-message-type-page-issue",
    NetworkIssue: "issue-message-type-network-issue",
    SecurityIssue: "issue-message-type-security-issue",
    OtherIssue: "issue-message-type-other-issue"
};

WI.IssueMessage.TypeIdentifier = "issue-message";
WI.IssueMessage.URLCookieKey = "issue-message-url";
WI.IssueMessage.LineNumberCookieKey = "issue-message-line-number";
WI.IssueMessage.ColumnNumberCookieKey = "issue-message-column-number";

WI.IssueMessage.Event = {
    LocationDidChange: "issue-message-location-did-change",
    DisplayLocationDidChange: "issue-message-display-location-did-change"
};

WI.IssueMessage.Type._prefixTypeMap = {
    "SyntaxError": WI.IssueMessage.Type.SemanticIssue,
    "URIError": WI.IssueMessage.Type.SemanticIssue,
    "AggregateError": WI.IssueMessage.Type.SemanticIssue,
    "EvalError": WI.IssueMessage.Type.SemanticIssue,
    "INVALID_CHARACTER_ERR": WI.IssueMessage.Type.SemanticIssue,
    "SYNTAX_ERR": WI.IssueMessage.Type.SemanticIssue,

    "RangeError": WI.IssueMessage.Type.RangeIssue,
    "INDEX_SIZE_ERR": WI.IssueMessage.Type.RangeIssue,
    "DOMSTRING_SIZE_ERR": WI.IssueMessage.Type.RangeIssue,

    "ReferenceError": WI.IssueMessage.Type.ReferenceIssue,
    "HIERARCHY_REQUEST_ERR": WI.IssueMessage.Type.ReferenceIssue,
    "INVALID_STATE_ERR": WI.IssueMessage.Type.ReferenceIssue,
    "NOT_FOUND_ERR": WI.IssueMessage.Type.ReferenceIssue,
    "WRONG_DOCUMENT_ERR": WI.IssueMessage.Type.ReferenceIssue,

    "TypeError": WI.IssueMessage.Type.TypeIssue,
    "INVALID_NODE_TYPE_ERR": WI.IssueMessage.Type.TypeIssue,
    "TYPE_MISMATCH_ERR": WI.IssueMessage.Type.TypeIssue,

    "SECURITY_ERR": WI.IssueMessage.Type.SecurityIssue,

    "NETWORK_ERR": WI.IssueMessage.Type.NetworkIssue,

    "ABORT_ERR": WI.IssueMessage.Type.OtherIssue,
    "DATA_CLONE_ERR": WI.IssueMessage.Type.OtherIssue,
    "INUSE_ATTRIBUTE_ERR": WI.IssueMessage.Type.OtherIssue,
    "INVALID_ACCESS_ERR": WI.IssueMessage.Type.OtherIssue,
    "INVALID_MODIFICATION_ERR": WI.IssueMessage.Type.OtherIssue,
    "NAMESPACE_ERR": WI.IssueMessage.Type.OtherIssue,
    "NOT_SUPPORTED_ERR": WI.IssueMessage.Type.OtherIssue,
    "NO_DATA_ALLOWED_ERR": WI.IssueMessage.Type.OtherIssue,
    "NO_MODIFICATION_ALLOWED_ERR": WI.IssueMessage.Type.OtherIssue,
    "QUOTA_EXCEEDED_ERR": WI.IssueMessage.Type.OtherIssue,
    "TIMEOUT_ERR": WI.IssueMessage.Type.OtherIssue,
    "URL_MISMATCH_ERR": WI.IssueMessage.Type.OtherIssue,
    "VALIDATION_ERR": WI.IssueMessage.Type.OtherIssue
};
