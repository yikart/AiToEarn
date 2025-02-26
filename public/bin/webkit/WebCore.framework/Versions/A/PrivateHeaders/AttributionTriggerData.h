/*
 * Copyright (C) 2022 Apple Inc. All rights reserved.
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

#include "EphemeralNonce.h"
#include "PCMTokens.h"
#include "RegistrableDomain.h"
#include <wtf/JSONValues.h>
#include <wtf/URL.h>

namespace WebCore::PCM {

enum class WasSent : bool { No, Yes };

struct AttributionTriggerData {
    static constexpr uint8_t MaxEntropy = 15;

    struct Priority {
        static constexpr uint8_t MaxEntropy = 63;
        using PriorityValue = uint8_t;

        explicit Priority(PriorityValue value)
            : value { value }
        {
        }
        
        PriorityValue value { 0 };
    };

    bool isValid() const
    {
        return data <= MaxEntropy && priority <= Priority::MaxEntropy;
    }

    void setDestinationUnlinkableTokenValue(const String& value)
    {
        if (!destinationUnlinkableToken)
            destinationUnlinkableToken = DestinationUnlinkableToken { };
        destinationUnlinkableToken->valueBase64URL = value;
    }
    void setDestinationSecretToken(const DestinationSecretToken& token) { destinationSecretToken = token; }
    WEBCORE_EXPORT const std::optional<const URL> tokenPublicKeyURL() const;
    WEBCORE_EXPORT const std::optional<const URL> tokenSignatureURL() const;
    WEBCORE_EXPORT Ref<JSON::Object> tokenSignatureJSON() const;

    uint8_t data { 0 };
    Priority::PriorityValue priority;
    WasSent wasSent { WasSent::No };
    std::optional<RegistrableDomain> sourceRegistrableDomain;
    std::optional<EphemeralNonce> ephemeralDestinationNonce;
    std::optional<RegistrableDomain> destinationSite;

    // These values are not serialized.
    std::optional<DestinationUnlinkableToken> destinationUnlinkableToken { };
    std::optional<DestinationSecretToken> destinationSecretToken { };
};

}
