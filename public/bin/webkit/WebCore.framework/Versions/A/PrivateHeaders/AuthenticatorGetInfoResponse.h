// Copyright 2018 The Chromium Authors. All rights reserved.
// Copyright (C) 2018 Apple Inc. All rights reserved.
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

#include "AuthenticatorSupportedOptions.h"
#include "AuthenticatorTransport.h"
#include "FidoConstants.h"
#include <wtf/StdSet.h>

namespace fido {

// Authenticator response for AuthenticatorGetInfo request that encapsulates
// versions, options, AAGUID(Authenticator Attestation GUID), other
// authenticator device information.
// https://fidoalliance.org/specs/fido-v2.0-ps-20170927/fido-client-to-authenticator-protocol-v2.0-ps-20170927.html#authenticatorgetinfo-0x04
class WEBCORE_EXPORT AuthenticatorGetInfoResponse {
    WTF_MAKE_NONCOPYABLE(AuthenticatorGetInfoResponse);
public:
    AuthenticatorGetInfoResponse(StdSet<ProtocolVersion>&& versions, Vector<uint8_t>&& aaguid);
    AuthenticatorGetInfoResponse(AuthenticatorGetInfoResponse&& that) = default;
    AuthenticatorGetInfoResponse& operator=(AuthenticatorGetInfoResponse&& other) = default;

    AuthenticatorGetInfoResponse& setMaxMsgSize(uint32_t);
    AuthenticatorGetInfoResponse& setPinProtocols(Vector<uint8_t>&&);
    AuthenticatorGetInfoResponse& setExtensions(Vector<String>&&);
    AuthenticatorGetInfoResponse& setOptions(AuthenticatorSupportedOptions&&);
    AuthenticatorGetInfoResponse& setTransports(Vector<WebCore::AuthenticatorTransport>&&);
    AuthenticatorGetInfoResponse& setRemainingDiscoverableCredentials(uint32_t);

    const StdSet<ProtocolVersion>& versions() const { return m_versions; }
    const Vector<uint8_t>& aaguid() const { return m_aaguid; }
    const std::optional<uint32_t>& maxMsgSize() const { return m_maxMsgSize; }
    const std::optional<Vector<uint8_t>>& pinProtocol() const { return m_pinProtocols; }
    const std::optional<Vector<String>>& extensions() const { return m_extensions; }
    const AuthenticatorSupportedOptions& options() const { return m_options; }
    const std::optional<Vector<WebCore::AuthenticatorTransport>>& transports() const { return m_transports; }
    const std::optional<uint32_t>& remainingDiscoverableCredentials() const { return m_remainingDiscoverableCredentials; }

private:
    StdSet<ProtocolVersion> m_versions;
    Vector<uint8_t> m_aaguid;
    std::optional<uint32_t> m_maxMsgSize;
    std::optional<Vector<uint8_t>> m_pinProtocols;
    std::optional<Vector<String>> m_extensions;
    AuthenticatorSupportedOptions m_options;
    std::optional<Vector<WebCore::AuthenticatorTransport>> m_transports;
    std::optional<uint32_t> m_remainingDiscoverableCredentials;
};

WEBCORE_EXPORT Vector<uint8_t> encodeAsCBOR(const AuthenticatorGetInfoResponse&);

} // namespace fido

#endif // ENABLE(WEB_AUTHN)
