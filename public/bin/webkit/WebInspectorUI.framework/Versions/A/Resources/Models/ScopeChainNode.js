/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
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

WI.ScopeChainNode = class ScopeChainNode
{
    constructor(type, objects, name, location, empty)
    {
        console.assert(typeof type === "string");
        console.assert(objects.every((x) => x instanceof WI.RemoteObject));

        if (type in WI.ScopeChainNode.Type)
            type = WI.ScopeChainNode.Type[type];

        this._type = type || null;
        this._objects = objects || [];
        this._name = name || "";
        this._location = location || null;
        this._empty = empty || false;
    }

    // Public

    get type() { return this._type; }
    get objects() { return this._objects; }
    get name() { return this._name; }
    get location() { return this._location; }
    get empty() { return this._empty; }

    get hash()
    {
        if (this._hash)
            return this._hash;

        this._hash = this._name;
        if (this._location)
            this._hash += `:${this._location.scriptId}:${this._location.lineNumber}:${this._location.columnNumber}`;
        return this._hash;
    }

    convertToLocalScope()
    {
        this._type = WI.ScopeChainNode.Type.Local;
    }
};

WI.ScopeChainNode.Type = {
    Local: "scope-chain-type-local",
    Global: "scope-chain-type-global",
    GlobalLexicalEnvironment: "scope-chain-type-global-lexical-environment",
    With: "scope-chain-type-with",
    Closure: "scope-chain-type-closure",
    Catch: "scope-chain-type-catch",
    FunctionName: "scope-chain-type-function-name",
    Block: "scope-chain-type-block",
};
