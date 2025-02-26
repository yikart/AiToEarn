/*
 * Copyright (C) 2020 Apple Inc. All rights reserved.
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

#if ENABLE(WEB_RTC)

#include "ExceptionOr.h"
#include "RTCRtpTransformBackend.h"
#include <wtf/Lock.h>
#include <wtf/ThreadSafeRefCounted.h>

namespace WebCore {

class CryptoKey;

class RTCRtpSFrameTransformer : public ThreadSafeRefCounted<RTCRtpSFrameTransformer, WTF::DestructionThread::Main> {
public:
    enum class CompatibilityMode : uint8_t { None, H264, VP8 };

    WEBCORE_EXPORT static Ref<RTCRtpSFrameTransformer> create(CompatibilityMode = CompatibilityMode::None);
    WEBCORE_EXPORT ~RTCRtpSFrameTransformer();

    void setIsEncrypting(bool);
    void setAuthenticationSize(uint64_t);
    void setMediaType(RTCRtpTransformBackend::MediaType);

    WEBCORE_EXPORT ExceptionOr<void> setEncryptionKey(const Vector<uint8_t>& rawKey, std::optional<uint64_t>);

    enum class Error : uint8_t { KeyID, Authentication, Syntax, Other };
    struct ErrorInformation {
        Error error;
        String message;
        uint64_t keyId { 0 };
    };
    using TransformResult = Expected<Vector<uint8_t>, ErrorInformation>;
    WEBCORE_EXPORT TransformResult transform(std::span<const uint8_t>);

    const Vector<uint8_t>& authenticationKey() const { return m_authenticationKey; }
    const Vector<uint8_t>& encryptionKey() const { return m_encryptionKey; }
    const Vector<uint8_t>& saltKey() const { return m_saltKey; }

    uint64_t keyId() const { return m_keyId; }
    uint64_t counter() const { return m_counter; }
    void setCounter(uint64_t counter) { m_counter = counter; }

    bool hasKey(uint64_t) const;

private:
    WEBCORE_EXPORT explicit RTCRtpSFrameTransformer(CompatibilityMode);

    TransformResult decryptFrame(std::span<const uint8_t>);
    TransformResult encryptFrame(std::span<const uint8_t>);

    enum class ShouldUpdateKeys : bool { No, Yes };
    ExceptionOr<void> updateEncryptionKey(const Vector<uint8_t>& rawKey, std::optional<uint64_t>, ShouldUpdateKeys = ShouldUpdateKeys::Yes) WTF_REQUIRES_LOCK(m_keyLock);

    ExceptionOr<Vector<uint8_t>> computeSaltKey(const Vector<uint8_t>&);
    ExceptionOr<Vector<uint8_t>> computeAuthenticationKey(const Vector<uint8_t>&);
    ExceptionOr<Vector<uint8_t>> computeEncryptionKey(const Vector<uint8_t>&);

    ExceptionOr<Vector<uint8_t>> encryptData(std::span<const uint8_t>, const Vector<uint8_t>& iv, const Vector<uint8_t>& key);
    ExceptionOr<Vector<uint8_t>> decryptData(std::span<const uint8_t>, const Vector<uint8_t>& iv, const Vector<uint8_t>& key);
    Vector<uint8_t> computeEncryptedDataSignature(const Vector<uint8_t>& nonce, std::span<const uint8_t> header, std::span<const uint8_t> data, const Vector<uint8_t>& key);
    void updateAuthenticationSize();

    mutable Lock m_keyLock;
    bool m_hasKey { false };
    Vector<uint8_t> m_authenticationKey;
    Vector<uint8_t> m_encryptionKey;
    Vector<uint8_t> m_saltKey;

    struct IdentifiedKey {
        uint64_t keyId { 0 };
        Vector<uint8_t> keyData;
    };
    Vector<IdentifiedKey> m_keys WTF_GUARDED_BY_LOCK(m_keyLock);

    bool m_isEncrypting { false };
    uint64_t m_authenticationSize { 10 };
    uint64_t m_keyId { 0 };
    uint64_t m_counter { 0 };
    CompatibilityMode m_compatibilityMode { CompatibilityMode::None };
};

inline void RTCRtpSFrameTransformer::setIsEncrypting(bool isEncrypting)
{
    m_isEncrypting = isEncrypting;
}

inline void RTCRtpSFrameTransformer::setAuthenticationSize(uint64_t size)
{
    m_authenticationSize = size;
}

inline void RTCRtpSFrameTransformer::setMediaType(RTCRtpTransformBackend::MediaType mediaType)
{
    if (mediaType == RTCRtpTransformBackend::MediaType::Video) {
        m_authenticationSize = 10;
        return;
    }
    m_authenticationSize = 4;
    m_compatibilityMode = CompatibilityMode::None;
}

} // namespace WebCore

#endif // ENABLE(WEB_RTC)
