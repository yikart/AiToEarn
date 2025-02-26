/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

#include "AuthenticationExtensionsClientOutputsJSON.h"
#include "CBORReader.h"
#include "CBORWriter.h"
#include "CredentialPropertiesOutput.h"
#include <JavaScriptCore/ArrayBuffer.h>
#include <optional>

namespace WebCore {
struct CredentialPropertiesOutput;

struct AuthenticationExtensionsClientOutputs {
    struct LargeBlobOutputs {
        std::optional<bool> supported;
        RefPtr<ArrayBuffer> blob;
        std::optional<bool> written;
    };

    struct PRFValues {
        RefPtr<ArrayBuffer> first;
        RefPtr<ArrayBuffer> second;
    };

    struct PRFOutputs {
        std::optional<bool> enabled;
        std::optional<AuthenticationExtensionsClientOutputs::PRFValues> results;
    };

    std::optional<bool> appid;
    std::optional<CredentialPropertiesOutput> credProps;
    std::optional<LargeBlobOutputs> largeBlob;
    std::optional<PRFOutputs> prf;

    WEBCORE_EXPORT Vector<uint8_t> toCBOR() const;
    AuthenticationExtensionsClientOutputsJSON toJSON() const;
    WEBCORE_EXPORT static std::optional<AuthenticationExtensionsClientOutputs> fromCBOR(const Vector<uint8_t>&);
};

} // namespace WebCore

#endif // ENABLE(WEB_AUTHN)
