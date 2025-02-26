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

#include "BufferSource.h"
#include <wtf/KeyValuePair.h>
#include <wtf/Vector.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

struct AuthenticationExtensionsClientInputs {
    struct LargeBlobInputs {
        String support;
        std::optional<bool> read;
        std::optional<BufferSource> write;
    };

    struct PRFValues {
        BufferSource first;
        std::optional<BufferSource> second;
    };

    struct PRFInputs {
        std::optional<AuthenticationExtensionsClientInputs::PRFValues> eval;
        std::optional<Vector<KeyValuePair<String, AuthenticationExtensionsClientInputs::PRFValues>>> evalByCredential;
    };

    String appid;
    std::optional<bool> credProps;
    std::optional<AuthenticationExtensionsClientInputs::LargeBlobInputs> largeBlob;
    std::optional<AuthenticationExtensionsClientInputs::PRFInputs> prf;

    WEBCORE_EXPORT Vector<uint8_t> toCBOR() const;
    WEBCORE_EXPORT static std::optional<AuthenticationExtensionsClientInputs> fromCBOR(std::span<const uint8_t>);
};

} // namespace WebCore

#endif // ENABLE(WEB_AUTHN)
