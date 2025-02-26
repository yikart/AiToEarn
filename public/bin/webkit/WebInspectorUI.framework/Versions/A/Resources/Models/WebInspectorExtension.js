/*
 * Copyright (C) 2020-2021 Apple Inc. All rights reserved.
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

WI.WebInspectorExtension = class WebInspectorExtension
{
    constructor(extensionID, extensionBundleIdentifier, displayName)
    {
        console.assert(typeof extensionID === "string", extensionID);
        console.assert(typeof extensionBundleIdentifier === "string", extensionBundleIdentifier);
        console.assert(typeof displayName === "string", displayName);

        this._extensionID = extensionID;
        this._extensionBundleIdentifier = extensionBundleIdentifier;
        this._displayName = displayName;
    }

    // Public

    get extensionID() { return this._extensionID; }
    get extensionBundleIdentifier() { return this._extensionBundleIdentifier; }
    get displayName() { return this._displayName; }
};

// Note: these values are synonymous with the values of enum class Inspector::ExtensionError.
WI.WebInspectorExtension.ErrorCode = {
    ContextDestroyed: "ContextDestroyed",
    InternalError: "InternalError",
    InvalidRequest: "InvalidRequest",
    RegistrationFailed: "RegistrationFailed",
    NotImplemented: "NotImplemented",
};
