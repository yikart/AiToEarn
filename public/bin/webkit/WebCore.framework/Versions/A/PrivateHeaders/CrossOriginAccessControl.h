/*
 * Copyright (C) 2008-2020 Apple Inc. All Rights Reserved.
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
 *
 */

#pragma once

#include "HTTPHeaderNames.h"
#include "ReferrerPolicy.h"
#include "ResourceResponse.h"
#include "StoredCredentialsPolicy.h"
#include <wtf/Expected.h>
#include <wtf/Forward.h>
#include <wtf/OptionSet.h>

namespace PAL {
class SessionID;
}

namespace WebCore {

class CachedResourceRequest;
class Document;
class HTTPHeaderMap;
class OriginAccessPatterns;
class ResourceError;
class ResourceRequest;
class ResourceResponse;
class SecurityOrigin;

struct ResourceLoaderOptions;

enum class CrossOriginEmbedderPolicyValue : bool;

WEBCORE_EXPORT bool isSimpleCrossOriginAccessRequest(const String& method, const HTTPHeaderMap&);
bool isOnAccessControlSimpleRequestMethodAllowlist(const String&);

void updateRequestReferrer(ResourceRequest&, ReferrerPolicy, const URL&, const OriginAccessPatterns&);
    
WEBCORE_EXPORT void updateRequestForAccessControl(ResourceRequest&, SecurityOrigin&, StoredCredentialsPolicy);

WEBCORE_EXPORT ResourceRequest createAccessControlPreflightRequest(const ResourceRequest&, SecurityOrigin&, const String&, bool includeFetchMetadata);
enum class SameOriginFlag : bool { No, Yes };
CachedResourceRequest createPotentialAccessControlRequest(ResourceRequest&&, ResourceLoaderOptions&&, Document&, const String& crossOriginAttribute, SameOriginFlag = SameOriginFlag::No);

enum class HTTPHeadersToKeepFromCleaning : uint8_t {
    ContentType = 1 << 0,
    Referer = 1 << 1,
    Origin = 1 << 2,
    UserAgent = 1 << 3,
    AcceptEncoding = 1 << 4,
    CacheControl = 1 << 5,
    Pragma = 1 << 6
};

OptionSet<HTTPHeadersToKeepFromCleaning> httpHeadersToKeepFromCleaning(const HTTPHeaderMap&);
WEBCORE_EXPORT void cleanHTTPRequestHeadersForAccessControl(ResourceRequest&, OptionSet<HTTPHeadersToKeepFromCleaning>);

class WEBCORE_EXPORT CrossOriginAccessControlCheckDisabler {
public:
    static CrossOriginAccessControlCheckDisabler& singleton();
    virtual ~CrossOriginAccessControlCheckDisabler() = default;
    void setCrossOriginAccessControlCheckEnabled(bool);
    virtual bool crossOriginAccessControlCheckEnabled() const;
private:
    bool m_accessControlCheckEnabled { true };
};

WEBCORE_EXPORT Expected<void, String> passesAccessControlCheck(const ResourceResponse&, StoredCredentialsPolicy, const SecurityOrigin&, const CrossOriginAccessControlCheckDisabler*);
WEBCORE_EXPORT Expected<void, String> validatePreflightResponse(PAL::SessionID, const ResourceRequest&, const ResourceResponse&, StoredCredentialsPolicy, const SecurityOrigin& topOrigin, const SecurityOrigin& securityOrigin, const CrossOriginAccessControlCheckDisabler*);

enum class ForNavigation : bool { No, Yes };
WEBCORE_EXPORT std::optional<ResourceError> validateCrossOriginResourcePolicy(CrossOriginEmbedderPolicyValue, const SecurityOrigin&, const URL&, const ResourceResponse&, ForNavigation, const OriginAccessPatterns&);
WEBCORE_EXPORT std::optional<ResourceError> validateCrossOriginResourcePolicy(CrossOriginEmbedderPolicyValue, const SecurityOrigin&, const URL&, bool isResponseNull, const URL& responseURL, const String& crossOriginResourcePolicyHeaderValue, ForNavigation, const OriginAccessPatterns&);
std::optional<ResourceError> validateRangeRequestedFlag(const ResourceRequest&, const ResourceResponse&);
String validateCrossOriginRedirectionURL(const URL&);

} // namespace WebCore
