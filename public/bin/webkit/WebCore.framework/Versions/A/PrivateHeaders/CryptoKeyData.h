/*
 * Copyright (C) 2024 Apple Inc. All rights reserved.
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

#include "CryptoAlgorithmIdentifier.h"
#include "CryptoKeyType.h"
#include "CryptoKeyUsage.h"
#include "JsonWebKey.h"

namespace WebCore {

enum class CryptoKeyClass : uint8_t {
    AES,
    EC,
    HMAC,
    OKP,
    RSA,
    Raw
};

struct CryptoKeyData {
    CryptoKeyData(CryptoKeyClass keyClass, CryptoAlgorithmIdentifier algorithmIdentifier, bool extractable, CryptoKeyUsageBitmap usages, std::optional<Vector<uint8_t>> key, std::optional<JsonWebKey> jwk = std::nullopt, std::optional<CryptoAlgorithmIdentifier> hashAlgorithmIdentifier = std::nullopt, std::optional<String>&& namedCurveString = std::nullopt, std::optional<size_t> lengthBits = std::nullopt, std::optional<CryptoKeyType> type = std::nullopt)
        : keyClass(keyClass)
        , algorithmIdentifier(algorithmIdentifier)
        , extractable(extractable)
        , usages(usages)
        , key(WTFMove(key))
        , jwk(WTFMove(jwk))
        , hashAlgorithmIdentifier(hashAlgorithmIdentifier)
        , namedCurveString(WTFMove(namedCurveString))
        , lengthBits(lengthBits)
        , type(type)
    {
    }
    CryptoKeyData isolatedCopy() && {
        return {
            keyClass,
            algorithmIdentifier,
            extractable,
            usages,
            key,
            crossThreadCopy(WTFMove(jwk)),
            hashAlgorithmIdentifier,
            crossThreadCopy(WTFMove(namedCurveString)),
            lengthBits,
            type
        };
    }

    CryptoKeyClass keyClass;
    CryptoAlgorithmIdentifier algorithmIdentifier;
    bool extractable { false };
    CryptoKeyUsageBitmap usages { 0 };
    std::optional<Vector<uint8_t>> key;
    std::optional<JsonWebKey> jwk;
    std::optional<CryptoAlgorithmIdentifier> hashAlgorithmIdentifier;
    std::optional<String> namedCurveString;
    std::optional<size_t> lengthBits;
    std::optional<CryptoKeyType> type;
};

} // namespace WebCore
