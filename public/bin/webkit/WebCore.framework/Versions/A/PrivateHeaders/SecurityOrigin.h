/*
 * Copyright (C) 2007-2018 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "SecurityOriginData.h"
#include <wtf/ArgumentCoder.h>
#include <wtf/Hasher.h>
#include <wtf/ThreadSafeRefCounted.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class OriginAccessPatterns;

class SecurityOrigin : public ThreadSafeRefCounted<SecurityOrigin> {
public:
    enum class Policy : uint8_t {
        AlwaysDeny = 0,
        AlwaysAllow,
        Ask
    };

    // https://url.spec.whatwg.org/#concept-url-origin
    WEBCORE_EXPORT static Ref<SecurityOrigin> create(const URL&);
    WEBCORE_EXPORT static Ref<SecurityOrigin> createForBlobURL(const URL&);
    WEBCORE_EXPORT static Ref<SecurityOrigin> createOpaque();
    WEBCORE_EXPORT static SecurityOrigin& opaqueOrigin();

    WEBCORE_EXPORT static Ref<SecurityOrigin> createFromString(const String&);
    WEBCORE_EXPORT static Ref<SecurityOrigin> create(const String& protocol, const String& host, std::optional<uint16_t> port);
    WEBCORE_EXPORT static Ref<SecurityOrigin> create(SecurityOriginData&&);
    WEBCORE_EXPORT static Ref<SecurityOrigin> create(WebCore::SecurityOriginData&&, String&& domain, String&& filePath, bool universalAccess, bool domainWasSetInDOM, bool canLoadLocalResources, bool enforcesFilePathSeparation, bool needsStorageAccessFromFileURLsQuirk, std::optional<bool> isPotentiallyTrustworthy, bool isLocal);

    // QuickLook documents are in non-local origins even when loaded from file: URLs. They need to
    // be allowed to display their own file: URLs in order to perform reloads and same-document
    // navigations. This lets those documents specify the file path that should be allowed to be
    // displayed from their non-local origin.
    static Ref<SecurityOrigin> createNonLocalWithAllowedFilePath(const URL&, const String& filePath);

    // Create a deep copy of this SecurityOrigin. This method is useful
    // when marshalling a SecurityOrigin to another thread.
    WEBCORE_EXPORT Ref<SecurityOrigin> isolatedCopy() const;

    // Set the domain property of this security origin to newDomain. This
    // function does not check whether newDomain is a suffix of the current
    // domain. The caller is responsible for validating newDomain.
    void setDomainFromDOM(const String& newDomain);
    bool domainWasSetInDOM() const { return m_domainWasSetInDOM; }

    const String& protocol() const { return m_data.protocol(); }
    const String& host() const { return m_data.host(); }
    const String& domain() const { return m_domain; }
    std::optional<uint16_t> port() const { return m_data.port(); }

    static bool shouldIgnoreHost(const URL&);

    // Returns true if a given URL is secure, based either directly on its
    // own protocol, or, for blob:, on the protocol of its "inner URL"
    WEBCORE_EXPORT static bool isSecure(const URL&);

    // This method implements the "same origin-domain" algorithm from the HTML Standard:
    // https://html.spec.whatwg.org/#same-origin-domain
    // Returns true if this SecurityOrigin can script objects in the given
    // SecurityOrigin. For example, call this function before allowing
    // script from one security origin to read or write objects from
    // another SecurityOrigin.
    WEBCORE_EXPORT bool isSameOriginDomain(const SecurityOrigin&) const;

    // Returns true if this SecurityOrigin can read content retrieved from
    // the given URL. For example, call this function before issuing
    // XMLHttpRequests.
    WEBCORE_EXPORT bool canRequest(const URL&, const OriginAccessPatterns&) const;

    // Returns true if this SecurityOrigin can receive drag content from the
    // initiator. For example, call this function before allowing content to be
    // dropped onto a target.
    bool canReceiveDragData(const SecurityOrigin& dragInitiator) const;

    // Returns true if |document| can display content from the given URL (e.g.,
    // in an iframe or as an image). For example, web sites generally cannot
    // display content from the user's files system.
    WEBCORE_EXPORT bool canDisplay(const URL&, const OriginAccessPatterns&) const;

    // Returns true if this SecurityOrigin can load local resources, such
    // as images, iframes, and style sheets, and can link to local URLs.
    // For example, call this function before creating an iframe to a
    // file:// URL.
    //
    // Note: A SecurityOrigin might be allowed to load local resources
    //       without being able to issue an XMLHttpRequest for a local URL.
    //       To determine whether the SecurityOrigin can issue an
    //       XMLHttpRequest for a URL, call canRequest(url).
    bool canLoadLocalResources() const { return m_canLoadLocalResources; }

    // Explicitly grant the ability to load local resources to this
    // SecurityOrigin.
    //
    // Note: This method exists only to support backwards compatibility
    //       with older versions of WebKit.
    void grantLoadLocalResources();

    // Explicitly grant the ability to access very other SecurityOrigin.
    //
    // WARNING: This is an extremely powerful ability. Use with caution!
    WEBCORE_EXPORT void grantUniversalAccess();
    bool hasUniversalAccess() const { return m_universalAccess; }

    void grantStorageAccessFromFileURLsQuirk();
    bool needsStorageAccessFromFileURLsQuirk() const { return m_needsStorageAccessFromFileURLsQuirk; }

    WEBCORE_EXPORT String domainForCachePartition() const;
    Policy canShowNotifications() const;

    // The local SecurityOrigin is the most privileged SecurityOrigin.
    // The local SecurityOrigin can script any document, navigate to local
    // resources, and can set arbitrary headers on XMLHttpRequests.
    bool isLocal() const { return m_isLocal; }

    // The origin is a globally unique identifier assigned when the Document is
    // created. http://www.whatwg.org/specs/web-apps/current-work/#sandboxOrigin
    //
    // There's a subtle difference between an opaque origin and an origin that
    // has the SandboxFlag::Origin flag set. The latter implies the former, and, in
    // addition, the SandboxFlag::Origin flag is inherited by iframes.
    bool isOpaque() const { return m_data.isOpaque(); }

    // Marks a file:// origin as being in a domain defined by its path.
    // FIXME 81578: The naming of this is confusing. Files with restricted access to other local files
    // still can have other privileges that can be remembered, thereby not making them unique.
    void setEnforcesFilePathSeparation();
    bool enforcesFilePathSeparation() const { return m_enforcesFilePathSeparation; }

    // Convert this SecurityOrigin into a string. The string
    // representation of a SecurityOrigin is similar to a URL, except it
    // lacks a path component. The string representation does not encode
    // the value of the SecurityOrigin's domain property.
    //
    // When using the string value, it's important to remember that it might be
    // "null". This happens when this SecurityOrigin is opaque. For example,
    // this SecurityOrigin might have come from a sandboxed iframe, the
    // SecurityOrigin might be empty, or we might have explicitly decided that
    // we shouldTreatURLSchemeAsNoAccess.
    WEBCORE_EXPORT String toString() const;

    // Similar to toString(), but does not take into account any factors that
    // could make the string return "null".
    WEBCORE_EXPORT String toRawString() const;

    WEBCORE_EXPORT URL toURL() const;

    // This method checks for equality between SecurityOrigins, not whether
    // one origin can access another. It is used for hash table keys.
    // For access checks, use isSameOriginDomain().
    // FIXME: If this method is really only useful for hash table keys, it
    // should be refactored into SecurityOriginHash.
    WEBCORE_EXPORT bool equal(const SecurityOrigin&) const;

    // This method checks for equality, ignoring the value of document.domain
    // (and whether it was set) but considering the host. It is used for postMessage.
    WEBCORE_EXPORT bool isSameSchemeHostPort(const SecurityOrigin&) const;

    // This method implements the "same origin" algorithm from the HTML Standard:
    // https://html.spec.whatwg.org/multipage/browsers.html#same-origin
    WEBCORE_EXPORT bool isSameOriginAs(const SecurityOrigin&) const;

    // This method implements "same site" algorithm from the HTML Standard:
    // https://html.spec.whatwg.org/multipage/origin.html#same-site
    WEBCORE_EXPORT bool isSameSiteAs(const SecurityOrigin&) const;

    // This method implements the "is a registrable domain suffix of or is equal to" algorithm from the HTML Standard:
    // https://html.spec.whatwg.org/multipage/origin.html#is-a-registrable-domain-suffix-of-or-is-equal-to
    WEBCORE_EXPORT bool isMatchingRegistrableDomainSuffix(const String&, bool treatIPAddressAsDomain = false) const;

    WEBCORE_EXPORT bool isPotentiallyTrustworthy() const;
    void setIsPotentiallyTrustworthy(bool value) { m_isPotentiallyTrustworthy = value; }

    WEBCORE_EXPORT static bool isLocalHostOrLoopbackIPAddress(StringView);
    WEBCORE_EXPORT static bool isLocalhostAddress(StringView);

    const SecurityOriginData& data() const { return m_data; }

private:
    friend struct IPC::ArgumentCoder<SecurityOrigin, void>;
    WEBCORE_EXPORT SecurityOrigin();
    explicit SecurityOrigin(const URL&);
    explicit SecurityOrigin(const SecurityOrigin*);
    explicit SecurityOrigin(SecurityOriginData&&);
    void initializeShared(const URL&);

    bool hasLocalUnseparatedPath(const SecurityOrigin&) const;

    // This method checks that the scheme for this origin is an HTTP-family
    // scheme, e.g. HTTP and HTTPS.
    bool isHTTPFamily() const { return m_data.protocol() == "http"_s || m_data.protocol() == "https"_s; }
    
    enum class ShouldAllowFromThirdParty : uint8_t { AlwaysAllowFromThirdParty, MaybeAllowFromThirdParty };
    WEBCORE_EXPORT bool canAccessStorage(const SecurityOrigin*, ShouldAllowFromThirdParty = ShouldAllowFromThirdParty::MaybeAllowFromThirdParty) const;

    SecurityOriginData m_data;
    String m_domain;
    String m_filePath;
    bool m_universalAccess { false };
    bool m_domainWasSetInDOM { false };
    bool m_canLoadLocalResources { false };
    bool m_enforcesFilePathSeparation { false };
    bool m_needsStorageAccessFromFileURLsQuirk { false };
    mutable std::optional<bool> m_isPotentiallyTrustworthy;
    bool m_isLocal { false };
};

WEBCORE_EXPORT bool shouldTreatAsPotentiallyTrustworthy(const URL&);

// Returns true if the Origin header values serialized from these two origins would be the same.
bool serializedOriginsMatch(const SecurityOrigin&, const SecurityOrigin&);
bool serializedOriginsMatch(const SecurityOrigin*, const SecurityOrigin*);

inline void add(Hasher& hasher, const SecurityOrigin& origin)
{
    add(hasher, origin.data());
}

} // namespace WebCore
