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

WI.NotImplementedError = class NotImplementedError extends Error
{
    constructor(message = "This method is not implemented.")
    {
        super(message);
    }

    static subclassMustOverride()
    {
        return new WI.NotImplementedError("This method must be overridden by a subclass.");
    }
};

WI.AppControllerBase = class AppControllerBase
{
    constructor()
    {
        this._initialized = false;

        this._extensionController = new WI.WebInspectorExtensionController;
    }

    // Public

    get debuggableType() { throw WI.NotImplementedError.subclassMustOverride(); }
    get extensionController() { return this._extensionController; }

    // Since various members of the app controller depend on the global singleton to exist,
    // some initialization needs to happen after the app controller has been constructed.
    initialize()
    {
        if (this._initialized)
            throw new Error("App controller is already initialized.");

        this._initialized = true;

        // FIXME: eventually all code within WI.loaded should be distributed elsewhere.
        WI.loaded();
    }

    isWebDebuggable()
    {
        return this.debuggableType === WI.DebuggableType.Page
            || this.debuggableType === WI.DebuggableType.WebPage;
    }
};
