/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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

WI.Cookie = class Cookie
{
    constructor(type, name, value, {header, expires, session, maxAge, path, domain, secure, httpOnly, sameSite, partitionKey, partitioned} = {})
    {
        console.assert(Object.values(WI.Cookie.Type).includes(type));
        console.assert(typeof name === "string");
        console.assert(typeof value === "string");
        console.assert(!header || typeof header === "string");
        console.assert(!expires || expires instanceof Date);
        console.assert(!session || typeof session === "boolean");
        console.assert(!maxAge || typeof maxAge === "number");
        console.assert(!path || typeof path === "string");
        console.assert(!domain || typeof domain === "string");
        console.assert(!secure || typeof secure === "boolean");
        console.assert(!httpOnly || typeof httpOnly === "boolean");
        console.assert(!sameSite || Object.values(WI.Cookie.SameSiteType).includes(sameSite));
        console.assert(!partitionKey || typeof partitionKey === "string");
        console.assert(!partitioned || typeof partitioned === "boolean");

        this._type = type;
        this._name = name;
        this._value = value;
        this._size = this._name.length + this._value.length;

        if (this._type === WI.Cookie.Type.Response) {
            this._header = header || "";
            this._expires = (!session && expires) || null;
            this._session = session || false;
            this._maxAge = maxAge || null;
            this._path = path || null;
            this._domain = domain || null;
            this._secure = secure || false;
            this._httpOnly = httpOnly || false;
            this._sameSite = sameSite || WI.Cookie.SameSiteType.None;
            this._partitionKey = partitionKey || null;
            this._partitioned = !!partitionKey || partitioned || false;
        }
    }

    // Static

    static fromPayload(payload)
    {
        let {name, value, ...options} = payload;
        options.expires = options.expires ? new Date(options.expires.maxDecimals(-3)) : null;

        return new WI.Cookie(WI.Cookie.Type.Response, name, value, options);
    }

    // RFC 6265 defines the HTTP Cookie and Set-Cookie header fields:
    // https://www.ietf.org/rfc/rfc6265.txt

    static parseCookieRequestHeader(header)
    {
        if (!header)
            return [];

        header = header.trim();
        if (!header)
            return [];

        let cookies = [];

        // Cookie: <name> = <value> ( ";" SP <name> = <value> )*?
        // NOTE: Just name/value pairs.

        let pairs = header.split(/; /);
        for (let pair of pairs) {
            let match = pair.match(/^(?<name>[^\s=]+)[ \t]*=[ \t]*(?<value>.*)$/);
            if (!match) {
                WI.reportInternalError("Failed to parse Cookie pair", {header, pair});
                continue;
            }

            let {name, value} = match.groups;
            cookies.push(new WI.Cookie(WI.Cookie.Type.Request, name, value));
        }

        return cookies;
    }

    static displayNameForSameSiteType(sameSiteType)
    {
        switch (sameSiteType) {
        case WI.Cookie.SameSiteType.None:
            return WI.unlocalizedString("None");
        case WI.Cookie.SameSiteType.Lax:
            return WI.unlocalizedString("Lax");
        case WI.Cookie.SameSiteType.Strict:
            return WI.unlocalizedString("Strict");
        default:
            console.error("Invalid SameSite type", sameSiteType);
            return sameSiteType;
        }
    }

    // <https://httpwg.org/http-extensions/rfc6265bis.html#the-samesite-attribute-1>
    static parseSameSiteAttributeValue(attributeValue)
    {
        if (!attributeValue)
            return WI.Cookie.SameSiteType.None;

        switch (attributeValue.toLowerCase()) {
        case "lax":
            return WI.Cookie.SameSiteType.Lax;
        case "strict":
            return WI.Cookie.SameSiteType.Strict;
        }

        return WI.Cookie.SameSiteType.None;
    }

    static parseSetCookieResponseHeader(header)
    {
        if (!header)
            return null;

        // Set-Cookie: <name> = <value> ( ";" SP <attr-maybe-pair> )*?
        // NOTE: Some attributes can have pairs (e.g. "Path=/"), some are only a
        // single word (e.g. "Secure").

        // Parse name/value.
        let nameValueMatch = header.match(/^(?<name>[^\s=]+)[ \t]*=[ \t]*(?<value>[^;]*)/);
        if (!nameValueMatch) {
            WI.reportInternalError("Failed to parse Set-Cookie header", {header});
            return null;
        }

        let {name, value} = nameValueMatch.groups;
        let expires = null;
        let session = false;
        let maxAge = null;
        let path = null;
        let domain = null;
        let secure = false;
        let httpOnly = false;
        let partitioned = false;
        let sameSite = WI.Cookie.SameSiteType.None;

        // Parse Attributes
        let remaining = header.substr(nameValueMatch[0].length);
        let attributes = remaining.split(/; ?/);
        for (let attribute of attributes) {
            if (!attribute)
                continue;

            let match = attribute.match(/^(?<name>[^\s=]+)(?:=(?<value>.*))?$/);
            if (!match) {
                console.error("Failed to parse Set-Cookie attribute:", attribute);
                continue;
            }

            let attributeName = match.groups.name;
            let attributeValue = match.groups.value;
            switch (attributeName.toLowerCase()) {
            case "expires":
                console.assert(attributeValue);
                expires = new Date(attributeValue);
                if (isNaN(expires.getTime())) {
                    console.warn("Invalid Expires date:", attributeValue);
                    expires = null;
                }
                break;
            case "max-age":
                console.assert(attributeValue);
                maxAge = parseInt(attributeValue, 10);
                if (isNaN(maxAge) || !/^\d+$/.test(attributeValue)) {
                    console.warn("Invalid MaxAge value:", attributeValue);
                    maxAge = null;
                }
                break;
            case "path":
                console.assert(attributeValue);
                path = attributeValue;
                break;
            case "domain":
                console.assert(attributeValue);
                domain = attributeValue;
                break;
            case "secure":
                console.assert(!attributeValue);
                secure = true;
                break;
            case "httponly":
                console.assert(!attributeValue);
                httpOnly = true;
                break;
            case "samesite":
                sameSite = WI.Cookie.parseSameSiteAttributeValue(attributeValue);
                break;
            case "partitioned":
                console.assert(!attributeValue);
                partitioned = true;
                break;
            default:
                console.warn("Unknown Cookie attribute:", attribute);
                break;
            }
        }

        if (!expires)
            session = true;

        return new WI.Cookie(WI.Cookie.Type.Response, name, value, {header, expires, session, maxAge, path, domain, secure, httpOnly, sameSite, partitioned});
    }

    // Public

    get type() { return this._type; }
    get name() { return this._name; }
    get value() { return this._value; }
    get header() { return this._header; }
    get expires() { return this._expires; }
    get session() { return this._session; }
    get maxAge() { return this._maxAge; }
    get path() { return this._path; }
    get domain() { return this._domain; }
    get secure() { return this._secure; }
    get httpOnly() { return this._httpOnly; }
    get sameSite() { return this._sameSite; }
    get partitionKey() { return this._partitionKey; }
    get partitioned() { return this._partitioned; }
    get size() { return this._size; }

    get url()
    {
        let url = this._secure ? "https://" : "http://";
        url += this._domain || "";
        url += this._path || "";
        return url;
    }

    expirationDate(requestSentDate)
    {
        if (this._session)
            return null;

        if (this._maxAge) {
            let startDate = requestSentDate || new Date;
            return new Date(startDate.getTime() + (this._maxAge * 1000));
        }

        return this._expires;
    }

    equals(other)
    {
        return this._type === other.type
            && this._name === other.name
            && this._value === other.value
            && this._header === other.header
            && this._expires?.getTime() === other.expires?.getTime()
            && this._session === other.session
            && this._maxAge === other.maxAge
            && this._path === other.path
            && this._domain === other.domain
            && this._secure === other.secure
            && this._httpOnly === other.httpOnly
            && this._sameSite === other.sameSite
            && this._partitionKey === other.partitionKey
            && this._partitioned === other.partitioned;
    }

    toProtocol()
    {
        if (typeof this._name !== "string")
            return null;

        if (typeof this._value !== "string")
            return null;

        if (typeof this._domain !== "string")
            return null;

        if (typeof this._path !== "string")
            return null;

        if (!this._session && !this._expires)
            return null;

        if (!Object.values(WI.Cookie.SameSiteType).includes(this._sameSite))
            return null;

        let json = {
            name: this._name,
            value: this._value,
            domain: this._domain,
            path: this._path,
            expires: this._expires?.getTime(),
            session: this._session,
            httpOnly: !!this._httpOnly,
            secure: !!this._secure,
            sameSite: this._sameSite,
            partitionKey: this._partitionKey,
        };

        return json;
    }
};

WI.Cookie.Type = {
    Request: "request",
    Response: "response",
};

// Keep these in sync with the "CookieSameSitePolicy" enum defined by the "Page" domain.
WI.Cookie.SameSiteType = {
    None: "None",
    Lax: "Lax",
    Strict: "Strict",
};
