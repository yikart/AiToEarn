/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

#include "AttestationConveyancePreference.h"
#include "AuthenticatorTransport.h"
#include "BufferSource.h"
#include "CBORValue.h"
#include "SecurityOrigin.h"
#include "WebAuthenticationConstants.h"
#include <wtf/Forward.h>

namespace WebCore {

WEBCORE_EXPORT Vector<uint8_t> convertBytesToVector(const uint8_t byteArray[], const size_t length);

// Produce a SHA-256 hash of the given RP ID.
WEBCORE_EXPORT Vector<uint8_t> produceRpIdHash(const String& rpId);

WEBCORE_EXPORT Vector<uint8_t> encodeES256PublicKeyAsCBOR(Vector<uint8_t>&& x, Vector<uint8_t>&& y);

// https://www.w3.org/TR/webauthn/#attested-credential-data
WEBCORE_EXPORT Vector<uint8_t> buildAttestedCredentialData(const Vector<uint8_t>& aaguid, const Vector<uint8_t>& credentialId, const Vector<uint8_t>& coseKey);

// https://www.w3.org/TR/webauthn/#sec-authenticator-data
WEBCORE_EXPORT Vector<uint8_t> buildAuthData(const String& rpId, const uint8_t flags, const uint32_t counter, const Vector<uint8_t>& optionalAttestedCredentialData);

WEBCORE_EXPORT cbor::CBORValue::MapValue buildAttestationMap(Vector<uint8_t>&&, String&&, cbor::CBORValue::MapValue&&, const AttestationConveyancePreference&, ShouldZeroAAGUID = ShouldZeroAAGUID::No);

WEBCORE_EXPORT cbor::CBORValue::MapValue buildCredentialDescriptor(const Vector<uint8_t>& credentialId);

// https://www.w3.org/TR/webauthn/#attestation-object
WEBCORE_EXPORT Vector<uint8_t> buildAttestationObject(Vector<uint8_t>&& authData, String&& format, cbor::CBORValue::MapValue&& statementMap, const AttestationConveyancePreference&, ShouldZeroAAGUID = ShouldZeroAAGUID::No);

WEBCORE_EXPORT Ref<ArrayBuffer> buildClientDataJson(ClientDataType /*type*/, const BufferSource& challenge, const SecurityOrigin& /*origin*/, WebAuthn::Scope, const String& topOrigin = { });

WEBCORE_EXPORT Vector<uint8_t> buildClientDataJsonHash(const ArrayBuffer& clientDataJson);

WEBCORE_EXPORT cbor::CBORValue::MapValue buildUserEntityMap(const Vector<uint8_t>& userId, const String& name, const String& displayName);

// encodeRawPublicKey takes X & Y and returns them as a 0x04 || X || Y byte array.
WEBCORE_EXPORT Vector<uint8_t> encodeRawPublicKey(const Vector<uint8_t>& X, const Vector<uint8_t>& Y);

WEBCORE_EXPORT String toString(AuthenticatorTransport);

WEBCORE_EXPORT std::optional<AuthenticatorTransport> convertStringToAuthenticatorTransport(const String& transport);

} // namespace WebCore

#endif // ENABLE(WEB_AUTHN)
