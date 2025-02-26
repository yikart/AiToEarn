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

#include <wtf/Forward.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

struct MockWebAuthenticationConfiguration {
    enum class HidStage : bool {
        Info,
        Request
    };

    enum class HidSubStage : bool {
        Init,
        Msg
    };

    enum class HidError : uint8_t {
        Success,
        DataNotSent,
        EmptyReport,
        WrongChannelId,
        MaliciousPayload,
        UnsupportedOptions,
        WrongNonce
    };

    enum class NfcError : uint8_t {
        Success,
        NoTags,
        WrongTagType,
        NoConnections,
        MaliciousPayload
    };

    enum class UserVerification : uint8_t {
        No,
        Yes,
        Cancel,
        Presence
    };

    struct LocalConfiguration {
        UserVerification userVerification { UserVerification::No };
        bool acceptAttestation { false };
        String privateKeyBase64;
        String userCertificateBase64;
        String intermediateCACertificateBase64;
        String preferredCredentialIdBase64;
    };

    struct HidConfiguration {
        Vector<String> payloadBase64;
        HidStage stage { HidStage::Info };
        HidSubStage subStage { HidSubStage::Init };
        HidError error { HidError::Success };
        bool isU2f { false };
        bool keepAlive { false };
        bool fastDataArrival { false };
        bool continueAfterErrorData { false };
        bool canDowngrade { false };
        bool expectCancel { false };
        bool supportClientPin { false };
        bool supportInternalUV { false };
    };

    struct NfcConfiguration {
        NfcError error { NfcError::Success };
        Vector<String> payloadBase64;
        bool multipleTags { false };
        bool multiplePhysicalTags { false };
    };

    struct CcidConfiguration {
        Vector<String> payloadBase64;
    };

    bool silentFailure { false };
    std::optional<LocalConfiguration> local;
    std::optional<HidConfiguration> hid;
    std::optional<NfcConfiguration> nfc;
    std::optional<CcidConfiguration> ccid;
};

} // namespace WebCore

#endif // ENABLE(WEB_AUTHN)
