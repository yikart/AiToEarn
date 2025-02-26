// Copyright 2018 The Chromium Authors. All rights reserved.
// Copyright (C) 2019-2021 Apple Inc. All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//    * Redistributions of source code must retain the above copyright
// notice, this list of conditions and the following disclaimer.
//    * Redistributions in binary form must reproduce the above
// copyright notice, this list of conditions and the following disclaimer
// in the documentation and/or other materials provided with the
// distribution.
//    * Neither the name of Google Inc. nor the names of its
// contributors may be used to endorse or promote products derived from
// this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

#pragma once

#if ENABLE(WEB_AUTHN)

#include <wtf/Forward.h>

namespace WebCore {
class BufferSource;
struct AuthenticationExtensionsClientInputs;
struct PublicKeyCredentialCreationOptions;
struct PublicKeyCredentialDescriptor;
struct PublicKeyCredentialRequestOptions;
}

namespace fido {

// Checks whether the request can be translated to valid U2F request
// parameter. Namely, U2F request does not support resident key and
// user verification, and ES256 algorithm must be used for public key
// credential.
// https://fidoalliance.org/specs/fido-v2.0-id-20180227/fido-client-to-authenticator-protocol-v2.0-id-20180227.html#u2f-authenticatorMakeCredential-interoperability
WEBCORE_EXPORT bool isConvertibleToU2fRegisterCommand(const WebCore::PublicKeyCredentialCreationOptions&);

// Checks whether user verification is not required and that allow list is
// not empty.
// https://fidoalliance.org/specs/fido-v2.0-id-20180227/fido-client-to-authenticator-protocol-v2.0-id-20180227.html#u2f-authenticatorGetAssertion-interoperability
WEBCORE_EXPORT bool isConvertibleToU2fSignCommand(const WebCore::PublicKeyCredentialRequestOptions&);

// Extracts APDU encoded U2F register command from PublicKeyCredentialCreationOptions.
WEBCORE_EXPORT std::optional<Vector<uint8_t>> convertToU2fRegisterCommand(const Vector<uint8_t>& clientDataHash, const WebCore::PublicKeyCredentialCreationOptions&);

// Extracts APDU encoded U2F check only sign command from
// PublicKeyCredentialCreationOptions. Invoked when U2F register operation includes key
// handles in exclude list.
WEBCORE_EXPORT std::optional<Vector<uint8_t>> convertToU2fCheckOnlySignCommand(const Vector<uint8_t>& clientDataHash, const WebCore::PublicKeyCredentialCreationOptions&, const WebCore::PublicKeyCredentialDescriptor&);

// Extracts APDU encoded U2F sign command from PublicKeyCredentialRequestOptions.
WEBCORE_EXPORT std::optional<Vector<uint8_t>> convertToU2fSignCommand(const Vector<uint8_t>& clientDataHash, const WebCore::PublicKeyCredentialRequestOptions&, const WebCore::BufferSource& keyHandle, bool isAppId = false);

WEBCORE_EXPORT Vector<uint8_t> constructBogusU2fRegistrationCommand();

} // namespace fido

#endif // ENABLE(WEB_AUTHN)
