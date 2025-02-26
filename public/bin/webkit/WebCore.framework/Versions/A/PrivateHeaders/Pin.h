// Copyright 2019 The Chromium Authors. All rights reserved.
// Copyright (C) 2019 Apple Inc. All rights reserved.
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

// This file contains structures to implement the CTAP2 PIN protocol, version
// one. See
// https://fidoalliance.org/specs/fido-v2.0-rd-20180702/fido-client-to-authenticator-protocol-v2.0-rd-20180702.html#authenticatorClientPIN

#pragma once

#if ENABLE(WEB_AUTHN)

#include "CBORValue.h"
#include "FidoConstants.h"

namespace WebCore {
class CryptoKeyAES;
class CryptoKeyEC;
class CryptoKeyHMAC;
}

namespace fido {
namespace pin {

// Subcommand enumerates the subcommands to the main |authenticatorClientPIN|
// command. See
// https://fidoalliance.org/specs/fido-v2.0-rd-20180702/fido-client-to-authenticator-protocol-v2.0-rd-20180702.html#authenticatorClientPIN
enum class Subcommand : uint8_t {
    kGetRetries = 0x01,
    kGetKeyAgreement = 0x02,
    kSetPin = 0x03,
    kChangePin = 0x04,
    kGetPinToken = 0x05,
};

// RequestKey enumerates the keys in the top-level CBOR map for all PIN
// commands.
enum class RequestKey : uint8_t {
    kProtocol = 1,
    kSubcommand = 2,
    kKeyAgreement = 3,
    kPinAuth = 4,
    kNewPinEnc = 5,
    kPinHashEnc = 6,
    kPinUvAuthParam = 7,
};

// ResponseKey enumerates the keys in the top-level CBOR map for all PIN
// responses.
enum class ResponseKey : uint8_t {
    kKeyAgreement = 1,
    kPinToken = 2,
    kRetries = 3,
};

// kProtocolVersion is the version of the PIN protocol that this code
// implements.
constexpr int64_t kProtocolVersion = 1;

// encodeCOSEPublicKey takes a raw ECDH256 public key and returns it as a COSE structure.
WEBCORE_EXPORT cbor::CBORValue::MapValue encodeCOSEPublicKey(const Vector<uint8_t>& key);

// validateAndConvertToUTF8 convert the input to a UTF8 CString if it is a syntactically valid PIN.
WEBCORE_EXPORT std::optional<CString> validateAndConvertToUTF8(const String& pin);

// kMinBytes is the minimum number of *bytes* of PIN data that a CTAP2 device
// will accept. Since the PIN is UTF-8 encoded, this could be a single code
// point. However, the platform is supposed to additionally enforce a 4
// *character* minimum
constexpr size_t kMinBytes = 4;
// kMaxBytes is the maximum number of bytes of PIN data that a CTAP2 device will
// accept.
constexpr size_t kMaxBytes = 63;

// RetriesRequest asks an authenticator for the number of remaining PIN attempts
// before the device is locked.
struct RetriesRequest {
};

// RetriesResponse reflects an authenticator's response to a |RetriesRequest|.
struct RetriesResponse {
    WEBCORE_EXPORT static std::optional<RetriesResponse> parse(const Vector<uint8_t>&);

    // retries is the number of PIN attempts remaining before the authenticator
    // locks.
    uint64_t retries;

private:
    RetriesResponse();
};

// KeyAgreementRequest asks an authenticator for an ephemeral ECDH key for
// encrypting PIN material in future requests.
struct KeyAgreementRequest {
};

// KeyAgreementResponse reflects an authenticator's response to a
// |KeyAgreementRequest| and is also used as representation of the
// authenticator's ephemeral key.
struct KeyAgreementResponse {
    WEBCORE_EXPORT static std::optional<KeyAgreementResponse> parse(const Vector<uint8_t>&);
    WEBCORE_EXPORT static std::optional<KeyAgreementResponse> parseFromCOSE(const cbor::CBORValue::MapValue&);

    Ref<WebCore::CryptoKeyEC> peerKey;
    WEBCORE_EXPORT ~KeyAgreementResponse();
    WEBCORE_EXPORT KeyAgreementResponse(KeyAgreementResponse&&);
    WEBCORE_EXPORT KeyAgreementResponse& operator=(KeyAgreementResponse&&);
private:
    explicit KeyAgreementResponse(Ref<WebCore::CryptoKeyEC>&&);
};

struct SetPinRequest {
public:
    WEBCORE_EXPORT const WebCore::CryptoKeyAES& sharedKey() const;
    WEBCORE_EXPORT static std::optional<SetPinRequest> tryCreate(const String& newPin, const WebCore::CryptoKeyEC&);

    friend Vector<uint8_t> encodeAsCBOR(const SetPinRequest&);

private:
    Ref<WebCore::CryptoKeyAES> m_sharedKey;
    mutable cbor::CBORValue::MapValue m_coseKey;
    Vector<uint8_t> m_newPinEnc;
    Vector<uint8_t> m_pinUvAuthParam;

    SetPinRequest(Ref<WebCore::CryptoKeyAES>&& sharedKey, cbor::CBORValue::MapValue&& coseKey, Vector<uint8_t>&& m_newPinEnc, Vector<uint8_t>&& m_pinUvAuthParam);
};

// TokenRequest requests a pin-token from an authenticator. These tokens can be
// used to show user-verification in other operations, e.g. when getting an
// assertion.
class TokenRequest {
    WTF_MAKE_NONCOPYABLE(TokenRequest);
public:
    WEBCORE_EXPORT static std::optional<TokenRequest> tryCreate(const CString& pin, const WebCore::CryptoKeyEC&);
    TokenRequest(TokenRequest&&) = default;

    // sharedKey returns the shared ECDH key that was used to encrypt the PIN.
    // This is needed to decrypt the response.
    WEBCORE_EXPORT const WebCore::CryptoKeyAES& sharedKey() const;

    friend Vector<uint8_t> encodeAsCBOR(const TokenRequest&);

private:
    TokenRequest(Ref<WebCore::CryptoKeyAES>&& sharedKey, cbor::CBORValue::MapValue&& coseKey, Vector<uint8_t>&& pinHash);

    Ref<WebCore::CryptoKeyAES> m_sharedKey;
    mutable cbor::CBORValue::MapValue m_coseKey;
    Vector<uint8_t> m_pinHash; // Only the left 16 bytes are kept.
};

// TokenResponse represents the response to a pin-token request. In order to
// decrypt a response, the shared key from the request is needed. Once a pin-
// token has been decrypted, it can be used to calculate the pinAuth parameters
// needed to show user-verification in future operations.
class TokenResponse {
public:
    WEBCORE_EXPORT static std::optional<TokenResponse> parse(const WebCore::CryptoKeyAES& sharedKey, const Vector<uint8_t>& inBuffer);

    // pinAuth returns a pinAuth parameter for a request that will use the given
    // client-data hash.
    WEBCORE_EXPORT Vector<uint8_t> pinAuth(const Vector<uint8_t>& clientDataHash) const;

    WEBCORE_EXPORT const Vector<uint8_t>& token() const;

private:
    explicit TokenResponse(Ref<WebCore::CryptoKeyHMAC>&&);

    Ref<WebCore::CryptoKeyHMAC> m_token;
};

WEBCORE_EXPORT Vector<uint8_t> encodeAsCBOR(const RetriesRequest&);
WEBCORE_EXPORT Vector<uint8_t> encodeAsCBOR(const KeyAgreementRequest&);
WEBCORE_EXPORT Vector<uint8_t> encodeAsCBOR(const TokenRequest&);
WEBCORE_EXPORT Vector<uint8_t> encodeAsCBOR(const SetPinRequest&);

} // namespace pin
} // namespace fido

#endif // ENABLE(WEB_AUTHN)
