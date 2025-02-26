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

#pragma once

#if ENABLE(WEB_AUTHN)

#include "AuthenticationExtensionsClientOutputs.h"
#include "AuthenticatorTransport.h"
#include <JavaScriptCore/ArrayBuffer.h>
#include <wtf/Forward.h>

namespace WebCore {

class AuthenticatorResponse;

struct AuthenticatorResponseBaseData {
    RefPtr<ArrayBuffer> rawId;
    std::optional<AuthenticationExtensionsClientOutputs> extensionOutputs;
};

struct AuthenticatorAttestationResponseData {
    RefPtr<ArrayBuffer> rawId;
    std::optional<AuthenticationExtensionsClientOutputs> extensionOutputs;
    RefPtr<ArrayBuffer> clientDataJSON;
    RefPtr<ArrayBuffer> attestationObject;
    Vector<WebCore::AuthenticatorTransport> transports;
};

struct AuthenticatorAssertionResponseData {
    RefPtr<ArrayBuffer> rawId;
    std::optional<AuthenticationExtensionsClientOutputs> extensionOutputs;
    RefPtr<ArrayBuffer> clientDataJSON;
    RefPtr<ArrayBuffer> authenticatorData;
    RefPtr<ArrayBuffer> signature;
    RefPtr<ArrayBuffer> userHandle;
};

using AuthenticatorResponseDataSerializableForm = std::variant<std::nullptr_t, AuthenticatorResponseBaseData, AuthenticatorAttestationResponseData, AuthenticatorAssertionResponseData>;

struct AuthenticatorResponseData {
    AuthenticatorResponseData() = default;
    AuthenticatorResponseData(const AuthenticatorResponseDataSerializableForm& data)
    {
        WTF::switchOn(data, [](std::nullptr_t) {
        }, [&](const AuthenticatorResponseBaseData& v) {
            rawId = v.rawId;
            extensionOutputs = v.extensionOutputs;
        }, [&](const AuthenticatorAttestationResponseData& v) {
            isAuthenticatorAttestationResponse = true;
            rawId = v.rawId;
            extensionOutputs = v.extensionOutputs;
            clientDataJSON = v.clientDataJSON;
            attestationObject = v.attestationObject;
            transports = v.transports;
        }, [&](const AuthenticatorAssertionResponseData& v) {
            rawId = v.rawId;
            extensionOutputs = v.extensionOutputs;
            clientDataJSON = v.clientDataJSON;
            authenticatorData = v.authenticatorData;
            signature = v.signature;
            userHandle = v.userHandle;
        });
    }

    bool isAuthenticatorAttestationResponse { false };

    // AuthenticatorResponse
    RefPtr<ArrayBuffer> rawId;

    // Extensions
    std::optional<AuthenticationExtensionsClientOutputs> extensionOutputs;

    RefPtr<ArrayBuffer> clientDataJSON;

    // AuthenticatorAttestationResponse
    RefPtr<ArrayBuffer> attestationObject;

    // AuthenticatorAssertionResponse
    RefPtr<ArrayBuffer> authenticatorData;
    RefPtr<ArrayBuffer> signature;
    RefPtr<ArrayBuffer> userHandle;

    Vector<WebCore::AuthenticatorTransport> transports;

    AuthenticatorResponseDataSerializableForm getSerializableForm() const
    {
        if (!rawId)
            return nullptr;

        if (isAuthenticatorAttestationResponse && attestationObject)
            return AuthenticatorAttestationResponseData { rawId, extensionOutputs, clientDataJSON, attestationObject, transports };

        if (!authenticatorData || !signature)
            return AuthenticatorResponseBaseData { rawId, extensionOutputs };

        return AuthenticatorAssertionResponseData { rawId, extensionOutputs, clientDataJSON, authenticatorData, signature, userHandle };
    }
};
    
} // namespace WebCore

#endif // ENABLE(WEB_AUTHN)
