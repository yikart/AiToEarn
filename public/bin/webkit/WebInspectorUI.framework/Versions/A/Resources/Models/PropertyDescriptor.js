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

WI.PropertyDescriptor = class PropertyDescriptor
{
    constructor(descriptor, symbol, isOwnProperty, wasThrown, nativeGetter, isPrivateProperty, isInternalProperty)
    {
        console.assert(descriptor);
        console.assert(descriptor.name);
        console.assert(!descriptor.value || descriptor.value instanceof WI.RemoteObject);
        console.assert(!descriptor.get || descriptor.get instanceof WI.RemoteObject);
        console.assert(!descriptor.set || descriptor.set instanceof WI.RemoteObject);
        console.assert(!symbol || symbol instanceof WI.RemoteObject);

        this._name = descriptor.name;
        this._value = descriptor.value;
        this._hasValue = "value" in descriptor;
        this._get = descriptor.get;
        this._set = descriptor.set;
        this._symbol = symbol;

        this._writable = descriptor.writable || false;
        this._configurable = descriptor.configurable || false;
        this._enumerable = descriptor.enumerable || false;

        this._own = isOwnProperty || false;
        this._wasThrown = wasThrown || false;
        this._nativeGetterValue = nativeGetter || false;
        this._private = isPrivateProperty || false;
        this._internal = isInternalProperty || false;
    }

    // Static

    // Runtime.PropertyDescriptor or Runtime.InternalPropertyDescriptor (second argument).
    static fromPayload(payload, internal, target)
    {
        if (payload.value)
            payload.value = WI.RemoteObject.fromPayload(payload.value, target);
        if (payload.get)
            payload.get = WI.RemoteObject.fromPayload(payload.get, target);
        if (payload.set)
            payload.set = WI.RemoteObject.fromPayload(payload.set, target);

        if (payload.symbol)
            payload.symbol = WI.RemoteObject.fromPayload(payload.symbol, target);

        if (internal) {
            console.assert(payload.value);
            payload.writable = payload.configurable = payload.enumerable = false;
            payload.isOwn = true;
        }

        return new WI.PropertyDescriptor(payload, payload.symbol, payload.isOwn, payload.wasThrown, payload.nativeGetter, payload.isPrivate, internal);
    }

    // Public

    get name() { return this._name; }
    get value() { return this._value; }
    get get() { return this._get; }
    get set() { return this._set; }
    get writable() { return this._writable; }
    get configurable() { return this._configurable; }
    get enumerable() { return this._enumerable; }
    get symbol() { return this._symbol; }
    get isOwnProperty() { return this._own; }
    get wasThrown() { return this._wasThrown; }
    get nativeGetter() { return this._nativeGetterValue; }
    get isPrivateProperty() { return this._private; }
    get isInternalProperty() { return this._internal; }

    hasValue()
    {
        return this._hasValue;
    }

    hasGetter()
    {
        return this._get && this._get.type === "function";
    }

    hasSetter()
    {
        return this._set && this._set.type === "function";
    }

    isIndexProperty()
    {
        return !isNaN(Number(this._name));
    }

    isSymbolProperty()
    {
        return !!this._symbol;
    }
};
