/*
 * Copyright (C) 2018-2021 Apple Inc. All rights reserved.
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

#include "AuthenticatorResponse.h"
#include "AuthenticatorTransport.h"
#include "RegistrationResponseJSON.h"

namespace WebCore {

class AuthenticatorAttestationResponse : public AuthenticatorResponse {
public:
    static Ref<AuthenticatorAttestationResponse> create(Ref<ArrayBuffer>&& rawId, Ref<ArrayBuffer>&& attestationObject, AuthenticatorAttachment, Vector<AuthenticatorTransport>&&);
    WEBCORE_EXPORT static Ref<AuthenticatorAttestationResponse> create(const Vector<uint8_t>& rawId, const Vector<uint8_t>& attestationObject, AuthenticatorAttachment, Vector<AuthenticatorTransport>&&);

    virtual ~AuthenticatorAttestationResponse() = default;

    ArrayBuffer* attestationObject() const { return m_attestationObject.ptr(); }
    const Vector<AuthenticatorTransport>& getTransports() const { return m_transports; }
    RefPtr<ArrayBuffer> getAuthenticatorData() const;
    RefPtr<ArrayBuffer> getPublicKey() const;
    int64_t getPublicKeyAlgorithm() const;
    RegistrationResponseJSON::AuthenticatorAttestationResponseJSON toJSON();

private:
    AuthenticatorAttestationResponse(Ref<ArrayBuffer>&&, Ref<ArrayBuffer>&&, AuthenticatorAttachment, Vector<AuthenticatorTransport>&&);

    Type type() const final { return Type::Attestation; }
    AuthenticatorResponseData data() const final;

    Ref<ArrayBuffer> m_attestationObject;
    Vector<AuthenticatorTransport> m_transports;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_AUTHENTICATOR_RESPONSE(AuthenticatorAttestationResponse, AuthenticatorResponse::Type::Attestation)

#endif // ENABLE(WEB_AUTHN)
