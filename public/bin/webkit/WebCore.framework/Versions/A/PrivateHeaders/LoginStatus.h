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

#include "ExceptionOr.h"
#include "RegistrableDomain.h"
#include <wtf/TZoneMalloc.h>
#include <wtf/UniqueRef.h>
#include <wtf/WallTime.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class LoginStatus {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED_EXPORT(LoginStatus, WEBCORE_EXPORT);
public:
    static constexpr uint32_t UsernameMaxLength = 64;
    static constexpr Seconds TimeToLiveAuthentication { 30_s };
    static constexpr Seconds TimeToLiveShort { 24_h * 7 };
    static constexpr Seconds TimeToLiveLong { 24_h * 90 };

    enum class CredentialTokenType : bool { LegacyCookie, HTTPStateToken };
    enum class AuthenticationType : uint8_t { WebAuthn, PasswordManager, Unmanaged };

    WEBCORE_EXPORT static ExceptionOr<UniqueRef<LoginStatus>> create(const RegistrableDomain&, const String& username, CredentialTokenType, AuthenticationType);
    WEBCORE_EXPORT static ExceptionOr<UniqueRef<LoginStatus>> create(const RegistrableDomain&, const String& username, CredentialTokenType, AuthenticationType, Seconds timeToLive);
    WEBCORE_EXPORT LoginStatus(const RegistrableDomain&, const String& username, CredentialTokenType, AuthenticationType, WallTime loggedInTime, Seconds timeToLive);

    WEBCORE_EXPORT void setTimeToLive(Seconds);
    WEBCORE_EXPORT bool hasExpired() const;
    WEBCORE_EXPORT WallTime expiry() const;

    const RegistrableDomain& domain() const { return m_domain; }
    const String& username() const { return m_username; }
    CredentialTokenType tokenType() const { return m_tokenType; }
    AuthenticationType authType() const { return m_authType; }
    WallTime loggedInTime() const { return m_loggedInTime; }
    Seconds timeToLive() const { return m_timeToLive; }

private:
    LoginStatus(const RegistrableDomain&, const String& username, CredentialTokenType, AuthenticationType, Seconds timeToLive);

    RegistrableDomain m_domain;
    String m_username;
    CredentialTokenType m_tokenType;
    AuthenticationType m_authType;
    WallTime m_loggedInTime;
    Seconds m_timeToLive;
};

} // namespace WebCore
