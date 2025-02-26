/*
 * Copyright (C) 2007-2020 Apple Inc.  All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. 
 */

#pragma once

#include <wtf/text/WTFString.h>

namespace WebCore {

class Credential;

enum class CredentialPersistence : uint8_t {
    None,
    ForSession,
    Permanent
};

class CredentialBase {
public:
    WEBCORE_EXPORT bool isEmpty() const;
    
    WEBCORE_EXPORT const String& user() const;
    WEBCORE_EXPORT const String& password() const;
    WEBCORE_EXPORT bool hasPassword() const;
    WEBCORE_EXPORT CredentialPersistence persistence() const;

    bool encodingRequiresPlatformData() const { return false; }

    WEBCORE_EXPORT static bool compare(const Credential&, const Credential&);

    WEBCORE_EXPORT String serializationForBasicAuthorizationHeader() const;

    struct NonPlatformData {
        String user;
        String password;
        CredentialPersistence persistence;
    };

    WEBCORE_EXPORT NonPlatformData nonPlatformData() const;

protected:
    WEBCORE_EXPORT CredentialBase();
    WEBCORE_EXPORT CredentialBase(const String& user, const String& password, CredentialPersistence);
    CredentialBase(const Credential& original, CredentialPersistence);

    static bool platformCompare(const Credential&, const Credential&) { return true; }

private:
    String m_user;
    String m_password;
    CredentialPersistence m_persistence;
};

inline bool operator==(const Credential& a, const Credential& b) { return CredentialBase::compare(a, b); }
    
} // namespace WebCore
