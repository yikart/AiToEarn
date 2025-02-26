/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
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

#include "PushCrypto.h"
#include <span>
#include <wtf/Forward.h>
#include <wtf/Vector.h>

namespace WebCore::PushCrypto {

struct ClientKeys {
    P256DHKeyPair clientP256DHKeyPair;
    Vector<uint8_t> sharedAuthSecret;

    WEBCORE_EXPORT static ClientKeys generate();
};

// Decrypts a push payload encoded with the aes128gcm Content-Encoding as described in RFC8291.
WEBCORE_EXPORT std::optional<Vector<uint8_t>> decryptAES128GCMPayload(const ClientKeys&, std::span<const uint8_t> payload);

// Decrypts a push payload encoded with the aesgcm Content-Encoding as described in draft-ietf-webpush-encryption-04.
WEBCORE_EXPORT std::optional<Vector<uint8_t>> decryptAESGCMPayload(const ClientKeys&, std::span<const uint8_t> serverP256DHPublicKey, std::span<const uint8_t> salt, std::span<const uint8_t> payload);

} // namespace WebCore::PushCrypto
