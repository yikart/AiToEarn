/*
 * Copyright (C) 2019-2021 Apple Inc. All rights reserved.
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

#include "AuthenticationExtensionsClientOutputs.h"
#include "IDLTypes.h"
#include <wtf/RefCounted.h>
#include <wtf/TypeCasts.h>

namespace WebCore {

enum class AuthenticatorAttachment : uint8_t;
enum class AuthenticatorTransport : uint8_t;

struct AuthenticatorResponseData;

class AuthenticatorResponse : public RefCounted<AuthenticatorResponse> {
public:
    enum class Type {
        Assertion,
        Attestation
    };

    static RefPtr<AuthenticatorResponse> tryCreate(AuthenticatorResponseData&&, AuthenticatorAttachment);
    virtual ~AuthenticatorResponse() = default;

    virtual Type type() const = 0;
    virtual AuthenticatorResponseData data() const;

    WEBCORE_EXPORT ArrayBuffer* rawId() const;
    WEBCORE_EXPORT void setExtensions(AuthenticationExtensionsClientOutputs&&);
    WEBCORE_EXPORT AuthenticationExtensionsClientOutputs extensions() const;
    WEBCORE_EXPORT void setClientDataJSON(Ref<ArrayBuffer>&&);
    ArrayBuffer* clientDataJSON() const;
    WEBCORE_EXPORT AuthenticatorAttachment attachment() const;

protected:
    AuthenticatorResponse(Ref<ArrayBuffer>&&, AuthenticatorAttachment);

private:
    Ref<ArrayBuffer> m_rawId;
    AuthenticationExtensionsClientOutputs m_extensions;
    RefPtr<ArrayBuffer> m_clientDataJSON;
    AuthenticatorAttachment m_attachment;
};

} // namespace WebCore

#define SPECIALIZE_TYPE_TRAITS_AUTHENTICATOR_RESPONSE(ToClassName, Type) \
SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::ToClassName) \
    static bool isType(const WebCore::AuthenticatorResponse& response) { return response.type() == WebCore::Type; } \
SPECIALIZE_TYPE_TRAITS_END()

#endif // ENABLE(WEB_AUTHN)
