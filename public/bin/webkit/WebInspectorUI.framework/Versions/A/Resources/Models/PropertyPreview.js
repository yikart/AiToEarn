/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
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

WI.PropertyPreview = class PropertyPreview
{
    constructor(name, type, {subtype, value, valuePreview, isPrivateProperty, isInternalProperty} = {})
    {
        console.assert(typeof name === "string");
        console.assert(type);
        console.assert(!subtype || typeof subtype === "string");
        console.assert(!value || typeof value === "string");
        console.assert(!valuePreview || valuePreview instanceof WI.ObjectPreview);

        this._name = name;
        this._type = type;
        this._subtype = subtype;
        this._value = value;
        this._valuePreview = valuePreview;
        this._private = isPrivateProperty;
        this._internal = isInternalProperty;
    }

    // Static

    // Runtime.PropertyPreview.
    static fromPayload(payload)
    {
        return new WI.PropertyPreview(payload.name, payload.type, {
            subtype: payload.subtype,
            value: payload.value,
            valuePreview: payload.valuePreview ? WI.ObjectPreview.fromPayload(payload.valuePreview) : undefined,
            isPrivateProperty: payload.isPrivate,
            isInternalProperty: payload.internal,
        });
    }

    // Public

    get name() { return this._name; }
    get type() { return this._type; }
    get subtype() { return this._subtype; }
    get value() { return this._value; }
    get valuePreview() { return this._valuePreview; }
    get private() { return this._private; }
    get internal() { return this._internal; }
};
