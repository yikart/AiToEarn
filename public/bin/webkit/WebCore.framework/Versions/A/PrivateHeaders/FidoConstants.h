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

#include "PublicKeyCredentialType.h"
#include <wtf/text/ASCIILiteral.h>

namespace fido {

enum class ProtocolVersion {
    kCtap,
    kU2f,
    kUnknown,
};

// Length of the U2F challenge/application parameter:
// https://fidoalliance.org/specs/fido-u2f-v1.2-ps-20170411/fido-u2f-raw-message-formats-v1.2-ps-20170411.html#registration-request-message---u2f_register
constexpr size_t kU2fChallengeParamLength = 32;
constexpr size_t kU2fApplicationParamLength = 32;
// https://fidoalliance.org/specs/fido-u2f-v1.2-ps-20170411/fido-u2f-raw-message-formats-v1.2-ps-20170411.html#registration-response-message-success
constexpr size_t kReservedLength = 1;
constexpr size_t kU2fKeyHandleLengthOffset = 66;
constexpr size_t kU2fKeyHandleOffset = 67;

// CTAP protocol device response code, as specified in
// https://fidoalliance.org/specs/fido-v2.0-ps-20170927/fido-client-to-authenticator-protocol-v2.0-ps-20170927.html#error-responses
enum class CtapDeviceResponseCode : uint8_t {
    kSuccess = 0x00,
    kCtap1ErrInvalidCommand = 0x01,
    kCtap1ErrInvalidParameter = 0x02,
    kCtap1ErrInvalidLength = 0x03,
    kCtap1ErrInvalidSeq = 0x04,
    kCtap1ErrTimeout = 0x05,
    kCtap1ErrChannelBusy = 0x06,
    kCtap1ErrLockRequired = 0x0A,
    kCtap1ErrInvalidChannel = 0x0B,
    kCtap2ErrCBORParsing = 0x10,
    kCtap2ErrUnexpectedType = 0x11,
    kCtap2ErrInvalidCBOR = 0x12,
    kCtap2ErrInvalidCBORType = 0x13,
    kCtap2ErrMissingParameter = 0x14,
    kCtap2ErrLimitExceeded = 0x15,
    kCtap2ErrUnsupportedExtension = 0x16,
    kCtap2ErrTooManyElements = 0x17,
    kCtap2ErrExtensionNotSupported = 0x18,
    kCtap2ErrCredentialExcluded = 0x19,
    kCtap2ErrProcesssing = 0x21,
    kCtap2ErrInvalidCredential = 0x22,
    kCtap2ErrUserActionPending = 0x23,
    kCtap2ErrOperationPending = 0x24,
    kCtap2ErrNoOperations = 0x25,
    kCtap2ErrUnsupportedAlgorithms = 0x26,
    kCtap2ErrOperationDenied = 0x27,
    kCtap2ErrKeyStoreFull = 0x28,
    kCtap2ErrNotBusy = 0x29,
    kCtap2ErrNoOperationPending = 0x2A,
    kCtap2ErrUnsupportedOption = 0x2B,
    kCtap2ErrInvalidOption = 0x2C,
    kCtap2ErrKeepAliveCancel = 0x2D,
    kCtap2ErrNoCredentials = 0x2E,
    kCtap2ErrUserActionTimeout = 0x2F,
    kCtap2ErrNotAllowed = 0x30,
    kCtap2ErrPinInvalid = 0x31,
    kCtap2ErrPinBlocked = 0x32,
    kCtap2ErrPinAuthInvalid = 0x33,
    kCtap2ErrPinAuthBlocked = 0x34,
    kCtap2ErrPinNotSet = 0x35,
    kCtap2ErrPinRequired = 0x36,
    kCtap2ErrPinPolicyViolation = 0x37,
    kCtap2ErrPinTokenExpired = 0x38,
    kCtap2ErrRequestTooLarge = 0x39,
    kCtap2ErrActionTimeout = 0x3A,
    kCtap2ErrOther = 0x7F,
    kCtap2ErrSpecLast = 0xDF,
    kCtap2ErrExtensionFirst = 0xE0,
    kCtap2ErrExtensionLast = 0xEF,
    kCtap2ErrVendorFirst = 0xF0,
    kCtap2ErrVendorLast = 0xFF
};

bool isCtapDeviceResponseCode(CtapDeviceResponseCode);

constexpr size_t kResponseCodeLength = 1;

// Commands supported by CTAPHID device as specified in
// https://fidoalliance.org/specs/fido-v2.0-ps-20170927/fido-client-to-authenticator-protocol-v2.0-ps-20170927.html#ctaphid-commands
enum class FidoHidDeviceCommand : uint8_t {
    kMsg = 0x03,
    kCbor = 0x10,
    kInit = 0x06,
    kPing = 0x01,
    kCancel = 0x11,
    kError = 0x3F,
    kKeepAlive = 0x3B,
    kWink = 0x08,
    kLock = 0x04,
};

bool isFidoHidDeviceCommand(FidoHidDeviceCommand);

// Parameters for fake U2F registration used to check for user presence.
constexpr std::array<uint8_t, 32> kBogusAppParam {
    0x41, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41,
    0x41, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41,
    0x41, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41
};

constexpr std::array<uint8_t, 32> kBogusChallenge {
    0x42, 0x42, 0x42, 0x42, 0x42, 0x42, 0x42, 0x42, 0x42, 0x42, 0x42,
    0x42, 0x42, 0x42, 0x42, 0x42, 0x42, 0x42, 0x42, 0x42, 0x42, 0x42,
    0x42, 0x42, 0x42, 0x42, 0x42, 0x42, 0x42, 0x42, 0x42, 0x42
};

// String key values for CTAP request optional parameters and
// AuthenticatorGetInfo response.
constexpr auto kResidentKeyMapKey = "rk"_s;
constexpr auto kUserVerificationMapKey = "uv"_s;
constexpr auto kUserPresenceMapKey = "up"_s;
constexpr auto kClientPinMapKey = "clientPin"_s;
constexpr auto kPlatformDeviceMapKey = "plat"_s;
constexpr auto kEntityIdMapKey = "id"_s;
constexpr auto kEntityNameMapKey = "name"_s;
constexpr auto kDisplayNameMapKey = "displayName"_s;
constexpr auto kIconUrlMapKey = "icon"_s;
constexpr auto kCredentialTypeMapKey = "type"_s;
constexpr auto kCredentialAlgorithmMapKey = "alg"_s;
// Keys for storing credential descriptor information in CBOR map.
constexpr auto kCredentialIdKey = "id"_s;
constexpr auto kCredentialTypeKey = "type"_s;

// HID transport specific constants.
constexpr size_t kHidPacketSize = 64;
constexpr uint32_t kHidBroadcastChannel = 0xffffffff;
constexpr size_t kHidInitPacketHeaderSize = 7;
constexpr size_t kHidContinuationPacketHeader = 5;
constexpr size_t kHidMaxPacketSize = 64;
constexpr size_t kHidInitPacketDataSize = kHidMaxPacketSize - kHidInitPacketHeaderSize;
constexpr size_t kHidContinuationPacketDataSize = kHidMaxPacketSize - kHidContinuationPacketHeader;
constexpr size_t kHidInitResponseSize = 17;
constexpr size_t kHidInitNonceLength = 8;

constexpr uint8_t kHidMaxLockSeconds = 10;

// Messages are limited to an initiation packet and 128 continuation packets.
constexpr size_t kHidMaxMessageSize = 7609;

// CTAP/U2F devices only provide a single report so specify a report ID of 0 here.
constexpr uint8_t kHidReportId = 0x00;

// U2F APDU encoding constants, as specified in
// https://fidoalliance.org/specs/fido-u2f-v1.2-ps-20170411/fido-u2f-raw-message-formats-v1.2-ps-20170411.html#authentication-messages

// P1 instructions.
constexpr uint8_t kP1EnforceUserPresenceAndSign = 0x03;
constexpr uint8_t kP1CheckOnly = 0x07;

constexpr size_t kMaxKeyHandleLength = 255;

// Authenticator API commands supported by CTAP devices, as specified in
// https://fidoalliance.org/specs/fido-v2.0-rd-20170927/fido-client-to-authenticator-protocol-v2.0-rd-20170927.html#authenticator-api
enum class CtapRequestCommand : uint8_t {
    kAuthenticatorMakeCredential = 0x01,
    kAuthenticatorGetAssertion = 0x02,
    kAuthenticatorGetNextAssertion = 0x08,
    kAuthenticatorGetInfo = 0x04,
    kAuthenticatorClientPin = 0x06,
    kAuthenticatorReset = 0x07,
};

// APDU instruction code for U2F request encoding.
// https://fidoalliance.org/specs/fido-u2f-v1.2-ps-20170411/fido-u2f-raw-message-formats-v1.2-ps-20170411.html#command-and-parameter-values
enum class U2fApduInstruction : uint8_t {
    kRegister = 0x01,
    kSign = 0x02,
    kVersion = 0x03,
    kVendorFirst = 0x40,
    kVenderLast = 0xBF,
};

// String key values for attestation object as a response to MakeCredential
// request.
constexpr auto kFormatKey = "fmt"_s;
constexpr auto kAttestationStatementKey = "attStmt"_s;
constexpr auto kAuthDataKey = "authData"_s;

// String representation of public key credential enum.
// https://w3c.github.io/webauthn/#credentialType
constexpr auto kPublicKey = "public-key"_s;

ASCIILiteral publicKeyCredentialTypeToString(WebCore::PublicKeyCredentialType);

// FIXME: Add url to the official spec once it's standardized.
constexpr auto kCtap2Version = "FIDO_2_0"_s;
constexpr auto kU2fVersion = "U2F_V2"_s;

// CTAPHID Usage Page and Usage
// https://fidoalliance.org/specs/fido-v2.0-ps-20170927/fido-client-to-authenticator-protocol-v2.0-ps-20170927.html#hid-report-descriptor-and-device-discovery
constexpr uint32_t kCtapHidUsagePage = 0xF1D0;
constexpr uint32_t kCtapHidUsage = 0x01;

// U2F_VERSION command
// https://fidoalliance.org/specs/fido-u2f-v1.2-ps-20170411/fido-u2f-raw-message-formats-v1.2-ps-20170411.html#getversion-request-and-response---u2f_version
constexpr std::array<uint8_t, 5> kCtapNfcU2fVersionCommand {
    0x00, 0x03, 0x00, 0x00, // CLA, INS, P1, P2
    0x00, // L
};

// CTAPNFC Applet selection command and responses
// https://fidoalliance.org/specs/fido-v2.0-ps-20190130/fido-client-to-authenticator-protocol-v2.0-ps-20190130.html#nfc-applet-selection
constexpr std::array<uint8_t, 13> kCtapNfcAppletSelectionCommand {
    0x00, 0xA4, 0x04, 0x00, // CLA, INS, P1, P2
    0x08, // L
    0xA0, 0x00, 0x00, 0x06, 0x47, // RID
    0x2F, 0x00, 0x01 // PIX
};

constexpr std::array<uint8_t, 8> kCtapNfcAppletSelectionU2f {
    0x55, 0x32, 0x46, 0x5F, 0x56, 0x32, // Version
    0x90, 0x00 // APDU response code
};

constexpr std::array<uint8_t, 10> kCtapNfcAppletSelectionCtap {
    0x46, 0x49, 0x44, 0x4f, 0x5f, 0x32, 0x5f, 0x30, // Version
    0x90, 0x00 // APDU response code
};

// https://fidoalliance.org/specs/fido-v2.0-ps-20190130/fido-client-to-authenticator-protocol-v2.0-ps-20190130.html#nfc-command-framing
constexpr uint8_t kCtapNfcApduCla = 0x80;
constexpr uint8_t kCtapNfcApduIns = 0x10;

// https://fidoalliance.org/specs/fido-v2.0-ps-20170927/fido-client-to-authenticator-protocol-v2.0-ps-20170927.html#mandatory-commands
constexpr size_t kCtapChannelIdSize = 4;
constexpr uint8_t kCtapKeepAliveStatusProcessing = 1;
// https://fidoalliance.org/specs/fido-v2.0-ps-20170927/fido-client-to-authenticator-protocol-v2.0-ps-20170927.html#commands
constexpr int64_t kCtapMakeCredentialClientDataHashKey = 1;
constexpr int64_t kCtapMakeCredentialRpKey = 2;
constexpr int64_t kCtapMakeCredentialUserKey = 3;
constexpr int64_t kCtapMakeCredentialPubKeyCredParamsKey = 4;
constexpr int64_t kCtapMakeCredentialExcludeListKey = 5;
constexpr int64_t kCtapMakeCredentialExtensionsKey = 6;
constexpr int64_t kCtapMakeCredentialRequestOptionsKey = 7;

constexpr int64_t kCtapGetAssertionRpIdKey = 1;
constexpr int64_t kCtapGetAssertionClientDataHashKey = 2;
constexpr int64_t kCtapGetAssertionAllowListKey = 3;
constexpr int64_t kCtapGetAssertionExtensionsKey = 4;
constexpr int64_t kCtapGetAssertionRequestOptionsKey = 5;
constexpr int64_t kCtapGetAssertionPinUvAuthParamKey = 6;
constexpr int64_t kCtapGetAssertionPinUvAuthProtocolKey = 7;

} // namespace fido

#endif // ENABLE(WEB_AUTHN)
