/*
 * Copyright (C) 2010-2023 Apple Inc. All rights reserved.
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

#include <wtf/RetainPtr.h>
#include <wtf/Vector.h>
#include <wtf/cf/TypeCastsCF.h>

#if PLATFORM(COCOA)
#include <Security/SecCertificate.h>
#include <Security/SecTrust.h>
#include <wtf/spi/cocoa/SecuritySPI.h>

WTF_DECLARE_CF_TYPE_TRAIT(SecCertificate);
#endif

namespace WebCore {

struct CertificateSummary;

class CertificateInfo {
public:
    CertificateInfo() = default;
    explicit CertificateInfo(RetainPtr<SecTrustRef>&& trust)
        : m_trust(WTFMove(trust))
    {
    }
    const RetainPtr<SecTrustRef>& trust() const { return m_trust; }
    CertificateInfo isolatedCopy() const { return *this; }

    WEBCORE_EXPORT bool containsNonRootSHA1SignedCertificate() const;

    std::optional<CertificateSummary> summary() const;

    bool isEmpty() const
    {
        return !m_trust;
    }

    friend bool operator==(const CertificateInfo&, const CertificateInfo&) = default;

    WEBCORE_EXPORT static RetainPtr<CFArrayRef> certificateChainFromSecTrust(SecTrustRef);
    WEBCORE_EXPORT static RetainPtr<SecTrustRef> secTrustFromCertificateChain(CFArrayRef);

#ifndef NDEBUG
    void dump() const;
#endif

private:
    RetainPtr<SecTrustRef> m_trust;
};

WEBCORE_EXPORT bool certificatesMatch(SecTrustRef, SecTrustRef);

} // namespace WebCore
