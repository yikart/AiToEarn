/*
 * Copyright (C) 2007 Apple Inc.  All rights reserved.
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
#ifndef AuthenticationChallengeBase_h
#define AuthenticationChallengeBase_h

#include "Credential.h"
#include "ProtectionSpace.h"
#include "ResourceResponse.h"
#include "ResourceError.h"

namespace WebCore {

class AuthenticationChallenge;

class AuthenticationChallengeBase {
public:
    WEBCORE_EXPORT AuthenticationChallengeBase();
    WEBCORE_EXPORT AuthenticationChallengeBase(const ProtectionSpace& protectionSpace, const Credential& proposedCredential, unsigned previousFailureCount, const ResourceResponse& response, const ResourceError& error);

    WEBCORE_EXPORT unsigned previousFailureCount() const;
    WEBCORE_EXPORT const Credential& proposedCredential() const;
    WEBCORE_EXPORT const ProtectionSpace& protectionSpace() const;
    WEBCORE_EXPORT const ResourceResponse& failureResponse() const;
    WEBCORE_EXPORT const ResourceError& error() const;
    
    WEBCORE_EXPORT bool isNull() const;
    WEBCORE_EXPORT void nullify();
    
    WEBCORE_EXPORT static bool equalForWebKitLegacyChallengeComparison(const AuthenticationChallenge&, const AuthenticationChallenge&);

protected:
    // The AuthenticationChallenge subclass may "shadow" this method to compare platform specific fields
    static bool platformCompare(const AuthenticationChallengeBase&, const AuthenticationChallengeBase&) { return true; }

    bool m_isNull;
    ProtectionSpace m_protectionSpace;
    Credential m_proposedCredential;
    unsigned m_previousFailureCount;
    ResourceResponse m_failureResponse;
    ResourceError m_error;
};

}

#endif
