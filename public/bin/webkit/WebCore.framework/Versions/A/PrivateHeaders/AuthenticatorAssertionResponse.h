/*
 * Copyright (C) 2018-2021 Apple Inc. All rights reserved.
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

#include "AuthenticationResponseJSON.h"
#include "AuthenticatorResponse.h"
#include <wtf/RetainPtr.h>
#include <wtf/spi/cocoa/SecuritySPI.h>

OBJC_CLASS LAContext;

namespace WebCore {

class AuthenticatorAssertionResponse : public AuthenticatorResponse {
public:
    static Ref<AuthenticatorAssertionResponse> create(Ref<ArrayBuffer>&& rawId, Ref<ArrayBuffer>&& authenticatorData, Ref<ArrayBuffer>&& signature, RefPtr<ArrayBuffer>&& userHandle, std::optional<AuthenticationExtensionsClientOutputs>&&, AuthenticatorAttachment);
    WEBCORE_EXPORT static Ref<AuthenticatorAssertionResponse> create(const Vector<uint8_t>& rawId, const Vector<uint8_t>& authenticatorData, const Vector<uint8_t>& signature,  const Vector<uint8_t>& userHandle, AuthenticatorAttachment);
    WEBCORE_EXPORT static Ref<AuthenticatorAssertionResponse> create(Ref<ArrayBuffer>&& rawId, RefPtr<ArrayBuffer>&& userHandle, String&& name, SecAccessControlRef, AuthenticatorAttachment);
    virtual ~AuthenticatorAssertionResponse() = default;

    ArrayBuffer* authenticatorData() const { return m_authenticatorData.get(); }
    ArrayBuffer* signature() const { return m_signature.get(); }
    ArrayBuffer* userHandle() const { return m_userHandle.get(); }
    const String& name() const { return m_name; }
    const String& displayName() const { return m_displayName; }
    size_t numberOfCredentials() const { return m_numberOfCredentials; }
    SecAccessControlRef accessControl() const { return m_accessControl.get(); }
    const String& group() const { return m_group; }
    bool synchronizable() const { return m_synchronizable; }
    LAContext * laContext() const { return m_laContext.get(); }
    RefPtr<ArrayBuffer> largeBlob() const { return m_largeBlob; }
    const String& accessGroup() const { return m_accessGroup; }

    WEBCORE_EXPORT void setAuthenticatorData(Vector<uint8_t>&&);
    void setSignature(Ref<ArrayBuffer>&& signature) { m_signature = WTFMove(signature); }
    void setName(const String& name) { m_name = name; }
    void setDisplayName(const String& displayName) { m_displayName = displayName; }
    void setNumberOfCredentials(size_t numberOfCredentials) { m_numberOfCredentials = numberOfCredentials; }
    void setGroup(const String& group) { m_group = group; }
    void setSynchronizable(bool synchronizable) { m_synchronizable = synchronizable; }
    void setLAContext(LAContext *context) { m_laContext = context; }
    void setLargeBlob(Ref<ArrayBuffer>&& largeBlob) { m_largeBlob = WTFMove(largeBlob); }
    void setAccessGroup(const String& accessGroup) { m_accessGroup = accessGroup; }

    AuthenticationResponseJSON::AuthenticatorAssertionResponseJSON toJSON();

private:
    AuthenticatorAssertionResponse(Ref<ArrayBuffer>&&, Ref<ArrayBuffer>&&, Ref<ArrayBuffer>&&, RefPtr<ArrayBuffer>&&, AuthenticatorAttachment);
    AuthenticatorAssertionResponse(Ref<ArrayBuffer>&&, RefPtr<ArrayBuffer>&&, String&&, SecAccessControlRef, AuthenticatorAttachment);

    Type type() const final { return Type::Assertion; }
    AuthenticatorResponseData data() const final;

    RefPtr<ArrayBuffer> m_authenticatorData;
    RefPtr<ArrayBuffer> m_signature;
    RefPtr<ArrayBuffer> m_userHandle;

    String m_name;
    String m_displayName;
    String m_group;
    bool m_synchronizable;
    size_t m_numberOfCredentials { 0 };
    RetainPtr<SecAccessControlRef> m_accessControl;
    RetainPtr<LAContext> m_laContext;
    RefPtr<ArrayBuffer> m_largeBlob;
    String m_accessGroup;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_AUTHENTICATOR_RESPONSE(AuthenticatorAssertionResponse, AuthenticatorResponse::Type::Assertion)

#endif // ENABLE(WEB_AUTHN)
