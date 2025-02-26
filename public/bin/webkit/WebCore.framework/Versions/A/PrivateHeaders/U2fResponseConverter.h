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

#include "AttestationConveyancePreference.h"
#include "AuthenticatorAssertionResponse.h"
#include "AuthenticatorAttestationResponse.h"
#include <wtf/Forward.h>

namespace WebCore {
class BufferSource;
}

namespace fido {

// Converts a U2F register response to WebAuthN makeCredential response.
// https://fidoalliance.org/specs/fido-v2.0-id-20180227/fido-client-to-authenticator-protocol-v2.0-id-20180227.html#u2f-authenticatorMakeCredential-interoperability
WEBCORE_EXPORT RefPtr<WebCore::AuthenticatorAttestationResponse> readU2fRegisterResponse(const String& rpId, const Vector<uint8_t>& u2fData, WebCore::AuthenticatorAttachment, Vector<WebCore::AuthenticatorTransport>&& transports = { }, const WebCore::AttestationConveyancePreference& = WebCore::AttestationConveyancePreference::Direct);

// Converts a U2F authentication response to WebAuthN getAssertion response.
// https://fidoalliance.org/specs/fido-v2.0-id-20180227/fido-client-to-authenticator-protocol-v2.0-id-20180227.html#u2f-authenticatorGetAssertion-interoperability
WEBCORE_EXPORT RefPtr<WebCore::AuthenticatorAssertionResponse> readU2fSignResponse(const String& rpId, const WebCore::BufferSource& keyHandle, const Vector<uint8_t>& u2fData, WebCore::AuthenticatorAttachment);

} // namespace fido

#endif // ENABLE(WEB_AUTHN)
