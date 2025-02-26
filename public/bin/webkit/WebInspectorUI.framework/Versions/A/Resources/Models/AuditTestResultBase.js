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

WI.AuditTestResultBase = class AuditTestResultBase
{
    constructor(name, {description} = {})
    {
        console.assert(typeof name === "string");
        console.assert(!description || typeof description === "string");

        this._name = name;
        this._description = description || null;
    }

    // Public

    get name() { return this._name; }
    get description() { return this._description; }

    get result()
    {
        return this;
    }

    get didPass()
    {
        throw WI.NotImplementedError.subclassMustOverride();
    }

    get didWarn()
    {
        throw WI.NotImplementedError.subclassMustOverride();
    }

    get didFail()
    {
        throw WI.NotImplementedError.subclassMustOverride();
    }

    get didError()
    {
        throw WI.NotImplementedError.subclassMustOverride();
    }

    get unsupported()
    {
        throw WI.NotImplementedError.subclassMustOverride();
    }

    get disabled()
    {
        return false;
    }

    get editable()
    {
        return false;
    }

    saveIdentityToCookie(cookie)
    {
        cookie["audit-" + this.constructor.TypeIdentifier + "-name"] = this._name;
    }

    toJSON()
    {
        let json = {
            type: this.constructor.TypeIdentifier,
            name: this._name,
        };
        if (this._description)
            json.description = this._description;
        return json;
    }
};
