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

WI.Redirect = class Redirect
{
    constructor(url, requestMethod, requestHeaders, responseStatusCode, responseStatusText, responseHeaders, timestamp)
    {
        console.assert(typeof url === "string");
        console.assert(typeof requestMethod === "string");
        console.assert(typeof requestHeaders === "object");
        console.assert(!isNaN(responseStatusCode));
        console.assert(typeof responseStatusText === "string");
        console.assert(typeof responseHeaders === "object");
        console.assert(!isNaN(timestamp));

        this._url = url;
        this._urlComponents = null;
        this._requestMethod = requestMethod;
        this._requestHeaders = requestHeaders;
        this._responseStatusCode = responseStatusCode;
        this._responseStatusText = responseStatusText;
        this._responseHeaders = responseHeaders;
        this._timestamp = timestamp;
    }

    // Public

    get url() { return this._url; }
    get requestMethod() { return this._requestMethod; }
    get requestHeaders() { return this._requestHeaders; }
    get responseStatusCode() { return this._responseStatusCode; }
    get responseStatusText() { return this._responseStatusText; }
    get responseHeaders() { return this._responseHeaders; }
    get timestamp() { return this._timestamp; }

    get urlComponents()
    {
        if (!this._urlComponents)
            this._urlComponents = parseURL(this._url);
        return this._urlComponents;
    }
};
