/*
 * Copyright (C) 2013, 2015 Apple Inc. All rights reserved.
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

WI.CookieStorageObject = class CookieStorageObject
{
    constructor(host)
    {
        this._host = host;
    }

    // Static

    static cookieMatchesResourceURL(cookie, resourceURL)
    {
        var parsedURL = parseURL(resourceURL);
        if (!parsedURL || !WI.CookieStorageObject.cookieDomainMatchesResourceDomain(cookie.domain, parsedURL.host))
            return false;

        return parsedURL.path.startsWith(cookie.path)
            && (!cookie.port || parsedURL.port === cookie.port)
            && (!cookie.secure || parsedURL.scheme === "https");
    }

    static cookieDomainMatchesResourceDomain(cookieDomain, resourceDomain)
    {
        if (cookieDomain.charAt(0) !== ".")
            return resourceDomain === cookieDomain;
        return !!resourceDomain.match(new RegExp("^(?:[^\\.]+\\.)*" + cookieDomain.substring(1).escapeForRegExp() + "$"), "i");
    }

    // Public

    get host()
    {
        return this._host;
    }

    saveIdentityToCookie(cookie)
    {
        // FIXME <https://webkit.org/b/151413>: This class should actually store cookie data for this host.
        cookie[WI.CookieStorageObject.CookieHostCookieKey] = this.host;
    }
};

WI.CookieStorageObject.TypeIdentifier = "cookie-storage";
WI.CookieStorageObject.CookieHostCookieKey = "cookie-storage-host";
