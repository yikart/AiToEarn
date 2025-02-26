/*
 * Copyright (C) 2003-2023 Apple Inc.  All rights reserved.
 * Copyright (C) 2006 Samuel Weinig <sam.weinig@gmail.com>
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

#include "ResourceRequestBase.h"
#include <wtf/RetainPtr.h>
#include <wtf/TZoneMalloc.h>

OBJC_CLASS NSCachedURLResponse;
OBJC_CLASS NSURLRequest;

typedef const struct _CFURLRequest* CFURLRequestRef;
typedef const struct __CFURLStorageSession* CFURLStorageSessionRef;

namespace WebCore {

struct ResourceRequestPlatformData {
    RetainPtr<NSURLRequest> m_urlRequest;
    std::optional<bool> m_isAppInitiated;
    std::optional<ResourceRequestRequester> m_requester;
    bool m_privacyProxyFailClosedForUnreachableNonMainHosts { false };
    bool m_useAdvancedPrivacyProtections { false };
    bool m_didFilterLinkDecoration { false };
    bool m_isPrivateTokenUsageByThirdPartyAllowed { false };
    bool m_wasSchemeOptimisticallyUpgraded { false };
};

using ResourceRequestData = std::variant<ResourceRequestBase::RequestData, ResourceRequestPlatformData>;

class ResourceRequest : public ResourceRequestBase {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(ResourceRequest, WEBCORE_EXPORT);
public:
    explicit ResourceRequest(const String& url) 
        : ResourceRequestBase(URL({ }, url), ResourceRequestCachePolicy::UseProtocolCachePolicy)
    {
    }

    ResourceRequest(const URL& url) 
        : ResourceRequestBase(url, ResourceRequestCachePolicy::UseProtocolCachePolicy)
    {
    }

    ResourceRequest(const URL& url, const String& referrer, ResourceRequestCachePolicy policy = ResourceRequestCachePolicy::UseProtocolCachePolicy)
        : ResourceRequestBase(url, policy)
    {
        setHTTPReferrer(referrer);
    }
    
    ResourceRequest()
        : ResourceRequestBase(URL(), ResourceRequestCachePolicy::UseProtocolCachePolicy)
    {
    }
    
    WEBCORE_EXPORT ResourceRequest(NSURLRequest *);

    ResourceRequest(ResourceRequestBase&& base
        , const String& cachePartition
        , bool hiddenFromInspector
    )
        : ResourceRequestBase(WTFMove(base))
    {
        m_cachePartition = cachePartition;
        m_hiddenFromInspector = hiddenFromInspector;
    }

    ResourceRequest(ResourceRequestPlatformData&&, const String& cachePartition, bool hiddenFromInspector);

    WEBCORE_EXPORT static ResourceRequest fromResourceRequestData(ResourceRequestData, const String& cachePartition, bool hiddenFromInspector);

    WEBCORE_EXPORT void updateFromDelegatePreservingOldProperties(const ResourceRequest&);
    
    bool encodingRequiresPlatformData() const { return m_httpBody || m_nsRequest; }
    WEBCORE_EXPORT NSURLRequest *nsURLRequest(HTTPBodyUpdatePolicy) const;

    WEBCORE_EXPORT static CFStringRef isUserInitiatedKey();
    WEBCORE_EXPORT ResourceRequestPlatformData getResourceRequestPlatformData() const;
    WEBCORE_EXPORT ResourceRequestData getRequestDataToSerialize() const;
    WEBCORE_EXPORT CFURLRequestRef cfURLRequest(HTTPBodyUpdatePolicy) const;
    void setStorageSession(CFURLStorageSessionRef);

    WEBCORE_EXPORT static bool httpPipeliningEnabled();
    WEBCORE_EXPORT static void setHTTPPipeliningEnabled(bool);

    static bool resourcePrioritiesEnabled() { return true; }

    WEBCORE_EXPORT void replacePlatformRequest(HTTPBodyUpdatePolicy);

private:
    friend class ResourceRequestBase;

    void doUpdatePlatformRequest();
    void doUpdateResourceRequest();
    void doUpdatePlatformHTTPBody();
    void doUpdateResourceHTTPBody();

    void doPlatformSetAsIsolatedCopy(const ResourceRequest&);

    RetainPtr<NSURLRequest> m_nsRequest;
    static bool s_httpPipeliningEnabled;
};

RetainPtr<NSURLRequest> copyRequestWithStorageSession(CFURLStorageSessionRef, NSURLRequest *);
WEBCORE_EXPORT NSCachedURLResponse *cachedResponseForRequest(CFURLStorageSessionRef, NSURLRequest *);

} // namespace WebCore
