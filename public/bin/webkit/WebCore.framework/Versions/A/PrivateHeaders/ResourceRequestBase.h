/*
 * Copyright (C) 2003, 2006 Apple Inc.  All rights reserved.
 * Copyright (C) 2006 Samuel Weinig <sam.weinig@gmail.com>
 * Copyright (C) 2009, 2012 Google Inc. All rights reserved.
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

#include "FormData.h"
#include "FrameLoaderTypes.h"
#include "HTTPHeaderMap.h"
#include "IntRect.h"
#include "ResourceLoadPriority.h"
#include <wtf/EnumTraits.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/URL.h>

namespace WebCore {

enum class ResourceRequestCachePolicy : uint8_t {
    UseProtocolCachePolicy, // normal load, equivalent to fetch "default" cache mode.
    ReloadIgnoringCacheData, // reload, equivalent to fetch "reload"cache mode.
    ReturnCacheDataElseLoad, // back/forward or encoding change - allow stale data, equivalent to fetch "force-cache" cache mode.
    ReturnCacheDataDontLoad, // results of a post - allow stale data and only use cache, equivalent to fetch "only-if-cached" cache mode.
    DoNotUseAnyCache, // Bypass the cache entirely, equivalent to fetch "no-store" cache mode.
    RefreshAnyCacheData, // Serve cache data only if revalidated, equivalent to fetch "no-cache" mode.
};

enum HTTPBodyUpdatePolicy : uint8_t {
    DoNotUpdateHTTPBody,
    UpdateHTTPBody
};

class ResourceRequest;
class ResourceResponse;

enum class ResourceRequestRequester : uint8_t { Unspecified, Main, XHR, Fetch, Media, Model, ImportScripts, Ping, Beacon, EventSource };
enum class ShouldUpgradeLocalhostAndIPAddress : bool { No, Yes };

// Do not use this type directly.  Use ResourceRequest instead.
class ResourceRequestBase {
    WTF_MAKE_TZONE_ALLOCATED(ResourceRequestBase);
public:
    
    enum class SameSiteDisposition : uint8_t { Unspecified, SameSite, CrossSite };

    struct RequestData {
        RequestData() { }
        
        RequestData(const URL& url, const URL& firstPartyForCookies, double timeoutInterval, const String& httpMethod, const HTTPHeaderMap& httpHeaderFields, const Vector<String>& responseContentDispositionEncodingFallbackArray, const ResourceRequestCachePolicy& cachePolicy, const SameSiteDisposition& sameSiteDisposition, const ResourceLoadPriority& priority, const ResourceRequestRequester& requester, bool allowCookies, bool isTopSite, bool isAppInitiated = true, bool privacyProxyFailClosedForUnreachableNonMainHosts = false, bool useAdvancedPrivacyProtections = false, bool didFilterLinkDecoration = false, bool isPrivateTokenUsageByThirdPartyAllowed = false, bool wasSchemeOptimisticallyUpgraded = false)
            : m_url(url)
            , m_firstPartyForCookies(firstPartyForCookies)
            , m_timeoutInterval(timeoutInterval)
            , m_httpMethod(httpMethod)
            , m_httpHeaderFields(httpHeaderFields)
            , m_responseContentDispositionEncodingFallbackArray(responseContentDispositionEncodingFallbackArray)
            , m_cachePolicy(cachePolicy)
            , m_sameSiteDisposition(sameSiteDisposition)
            , m_priority(priority)
            , m_requester(requester)
            , m_isTopSite(isTopSite)
            , m_allowCookies(allowCookies)
            , m_isAppInitiated(isAppInitiated)
            , m_privacyProxyFailClosedForUnreachableNonMainHosts(privacyProxyFailClosedForUnreachableNonMainHosts)
            , m_useAdvancedPrivacyProtections(useAdvancedPrivacyProtections)
            , m_didFilterLinkDecoration(didFilterLinkDecoration)
            , m_isPrivateTokenUsageByThirdPartyAllowed(isPrivateTokenUsageByThirdPartyAllowed)
            , m_wasSchemeOptimisticallyUpgraded(wasSchemeOptimisticallyUpgraded)
        {
        }
        
        RequestData(const URL& url, ResourceRequestCachePolicy cachePolicy)
            : m_url(url)
            , m_cachePolicy(cachePolicy)
        {
        }
        
        URL m_url;
        URL m_firstPartyForCookies;
        double m_timeoutInterval { s_defaultTimeoutInterval }; // 0 is a magic value for platform default on platforms that have one.
        String m_httpMethod { "GET"_s };
        HTTPHeaderMap m_httpHeaderFields;
        Vector<String> m_responseContentDispositionEncodingFallbackArray;
        ResourceRequestCachePolicy m_cachePolicy { ResourceRequestCachePolicy::UseProtocolCachePolicy };
        SameSiteDisposition m_sameSiteDisposition { SameSiteDisposition::Unspecified };
        ResourceLoadPriority m_priority { ResourceLoadPriority::Low };
        ResourceRequestRequester m_requester { ResourceRequestRequester::Unspecified };
        bool m_isTopSite : 1 { false };
        bool m_allowCookies : 1 { false };
        bool m_isAppInitiated : 1 { true };
        bool m_privacyProxyFailClosedForUnreachableNonMainHosts : 1 { false };
        bool m_useAdvancedPrivacyProtections : 1 { false };
        bool m_didFilterLinkDecoration : 1 { false };
        bool m_isPrivateTokenUsageByThirdPartyAllowed : 1 { false };
        bool m_wasSchemeOptimisticallyUpgraded : 1 { false };
    };

    ResourceRequestBase(RequestData&& requestData)
        : m_requestData(WTFMove(requestData))
        , m_resourceRequestUpdated(true)
        , m_platformRequestUpdated(false)
        , m_resourceRequestBodyUpdated(true)
        , m_platformRequestBodyUpdated(false)
        , m_hiddenFromInspector(false)
    {
    }
    
    WEBCORE_EXPORT ResourceRequest isolatedCopy() const;
    WEBCORE_EXPORT void setAsIsolatedCopy(const ResourceRequest&);

    WEBCORE_EXPORT bool isNull() const;
    WEBCORE_EXPORT bool isEmpty() const;
    
    WEBCORE_EXPORT const URL& url() const;
    WEBCORE_EXPORT void setURL(const URL&, bool didFilterLinkDecoration = false);

    void redirectAsGETIfNeeded(const ResourceRequestBase &, const ResourceResponse&);

    enum class ShouldSetHash : bool { No, Yes };
    WEBCORE_EXPORT ResourceRequest redirectedRequest(const ResourceResponse&, bool shouldClearReferrerOnHTTPSToHTTPRedirect, ShouldSetHash = ShouldSetHash::No) const;

    WEBCORE_EXPORT void removeCredentials();

    WEBCORE_EXPORT ResourceRequestCachePolicy cachePolicy() const;
    WEBCORE_EXPORT void setCachePolicy(ResourceRequestCachePolicy cachePolicy);
    
    WEBCORE_EXPORT double timeoutInterval() const; // May return 0 when using platform default.
    WEBCORE_EXPORT void setTimeoutInterval(double);
    
    WEBCORE_EXPORT const URL& firstPartyForCookies() const;
    WEBCORE_EXPORT void setFirstPartyForCookies(const URL&);

    WEBCORE_EXPORT bool isThirdParty() const;

    // Same-Site cookies; see <https://tools.ietf.org/html/draft-ietf-httpbis-cookie-same-site-00#section-2.1>
    // and <https://tools.ietf.org/html/draft-ietf-httpbis-cookie-same-site-00#section-5.2>.
    // FIXME: For some reason the main resource request may be updated more than once. We start off as Unspecified
    // to detect if we need to compute the same-site and top-site state or not. See FIXME in DocumentLoader::startLoadingMainResource().
    bool isSameSiteUnspecified() const { return m_requestData.m_sameSiteDisposition == SameSiteDisposition::Unspecified; }
    SameSiteDisposition sameSiteDisposition() const { return m_requestData.m_sameSiteDisposition; }
    void setSameSiteDisposition(SameSiteDisposition disposition) { m_requestData.m_sameSiteDisposition = disposition; }
    WEBCORE_EXPORT bool isSameSite() const; // Whether this request's registrable domain matches the request's initiator's "site for cookies".
    WEBCORE_EXPORT void setIsSameSite(bool);
    WEBCORE_EXPORT bool isTopSite() const; // Whether this request is for a top-level navigation.
    WEBCORE_EXPORT void setIsTopSite(bool);

    WEBCORE_EXPORT const String& httpMethod() const;
    WEBCORE_EXPORT void setHTTPMethod(const String& httpMethod);
    
    WEBCORE_EXPORT const HTTPHeaderMap& httpHeaderFields() const;
    WEBCORE_EXPORT void setHTTPHeaderFields(HTTPHeaderMap);

    WEBCORE_EXPORT String httpHeaderField(StringView name) const;
    WEBCORE_EXPORT String httpHeaderField(HTTPHeaderName) const;
    WEBCORE_EXPORT void setHTTPHeaderField(const String& name, const String& value);
    WEBCORE_EXPORT void setHTTPHeaderField(HTTPHeaderName, const String& value);
    WEBCORE_EXPORT void addHTTPHeaderField(HTTPHeaderName, const String& value);
    WEBCORE_EXPORT void addHTTPHeaderField(const String& name, const String& value);
    WEBCORE_EXPORT void addHTTPHeaderFieldIfNotPresent(HTTPHeaderName, const String&);
    void removeHTTPHeaderField(const String& name);
    void removeHTTPHeaderField(HTTPHeaderName);

    WEBCORE_EXPORT bool hasHTTPHeaderField(HTTPHeaderName) const;

    // Instead of passing a string literal to any of these functions, just use a HTTPHeaderName instead.
    template<size_t length> String httpHeaderField(ASCIILiteral) const = delete;
    template<size_t length> void setHTTPHeaderField(ASCIILiteral, const String&) = delete;
    template<size_t length> void addHTTPHeaderField(ASCIILiteral, const String&) = delete;

    WEBCORE_EXPORT void clearHTTPAuthorization();

    WEBCORE_EXPORT String httpContentType() const;
    WEBCORE_EXPORT void setHTTPContentType(const String&);
    WEBCORE_EXPORT void clearHTTPContentType();

    bool hasHTTPHeader(HTTPHeaderName) const;

    WEBCORE_EXPORT String httpReferrer() const;
    bool hasHTTPReferrer() const;
    WEBCORE_EXPORT void setHTTPReferrer(const String&);
    WEBCORE_EXPORT void setExistingHTTPReferrerToOriginString();
    WEBCORE_EXPORT void clearHTTPReferrer();

    WEBCORE_EXPORT String httpOrigin() const;
    bool hasHTTPOrigin() const;
    void setHTTPOrigin(const String&);
    WEBCORE_EXPORT void clearHTTPOrigin();

    WEBCORE_EXPORT String httpUserAgent() const;
    WEBCORE_EXPORT void setHTTPUserAgent(const String&);
    void clearHTTPUserAgent();

    void clearHTTPAcceptEncoding();

    WEBCORE_EXPORT void clearPurpose();

    const Vector<String>& responseContentDispositionEncodingFallbackArray() const { return m_requestData.m_responseContentDispositionEncodingFallbackArray; }
    WEBCORE_EXPORT void setResponseContentDispositionEncodingFallbackArray(const String& encoding1, const String& encoding2 = String(), const String& encoding3 = String());
    void setResponseContentDispositionEncodingFallbackArray(const Vector<String>& array) { m_requestData.m_responseContentDispositionEncodingFallbackArray = array; }

    WEBCORE_EXPORT RefPtr<FormData> httpBody() const;
    WEBCORE_EXPORT bool hasUpload() const;
    WEBCORE_EXPORT void setHTTPBody(RefPtr<FormData>&&);
    
    bool platformRequestUpdated() const { return m_platformRequestUpdated; }

    WEBCORE_EXPORT bool allowCookies() const;
    WEBCORE_EXPORT void setAllowCookies(bool);

    WEBCORE_EXPORT ResourceLoadPriority priority() const;
    WEBCORE_EXPORT void setPriority(ResourceLoadPriority);

    WEBCORE_EXPORT static String partitionName(const String& domain);
    const String& cachePartition() const { return m_cachePartition; }
    WEBCORE_EXPORT void setCachePartition(const String&);
    void setDomainForCachePartition(const String& domain) { setCachePartition(partitionName(domain)); }

    WEBCORE_EXPORT bool isConditional() const;
    WEBCORE_EXPORT void makeUnconditional();

    // Whether this request should be hidden from the Inspector.
    bool hiddenFromInspector() const { return m_hiddenFromInspector; }
    void setHiddenFromInspector(bool hiddenFromInspector) { m_hiddenFromInspector = hiddenFromInspector; }

    ResourceRequestRequester requester() const { return m_requestData.m_requester; }
    void setRequester(ResourceRequestRequester requester) { m_requestData.m_requester = requester; }
    
    // Who initiated the request so the Inspector can associate it with a context. E.g. a Web Worker.
    String initiatorIdentifier() const { return m_initiatorIdentifier; }
    void setInitiatorIdentifier(const String& identifier) { m_initiatorIdentifier = identifier; }

    // Additional information for the Inspector to be able to identify the node that initiated this request.
    const std::optional<int>& inspectorInitiatorNodeIdentifier() const { return m_inspectorInitiatorNodeIdentifier; }
    void setInspectorInitiatorNodeIdentifier(int inspectorInitiatorNodeIdentifier) { m_inspectorInitiatorNodeIdentifier = inspectorInitiatorNodeIdentifier; }

#if !PLATFORM(COCOA) && !USE(SOUP)
    bool encodingRequiresPlatformData() const { return true; }
#endif

    static bool upgradeInsecureRequest(URL&);
    static bool upgradeInsecureRequestIfNeeded(URL&, ShouldUpgradeLocalhostAndIPAddress, const std::optional<uint16_t>&);
    void upgradeInsecureRequest();
    void upgradeInsecureRequestIfNeeded(ShouldUpgradeLocalhostAndIPAddress, const std::optional<uint16_t>&);

    WEBCORE_EXPORT static double defaultTimeoutInterval(); // May return 0 when using platform default.
    WEBCORE_EXPORT static void setDefaultTimeoutInterval(double);

    WEBCORE_EXPORT static bool equal(const ResourceRequest&, const ResourceRequest&);

    bool isAppInitiated() const { return m_requestData.m_isAppInitiated; }
    WEBCORE_EXPORT void setIsAppInitiated(bool);

    bool privacyProxyFailClosedForUnreachableNonMainHosts() const { return m_requestData.m_privacyProxyFailClosedForUnreachableNonMainHosts; }
    WEBCORE_EXPORT void setPrivacyProxyFailClosedForUnreachableNonMainHosts(bool);

    bool useAdvancedPrivacyProtections() const { return m_requestData.m_useAdvancedPrivacyProtections; }
    WEBCORE_EXPORT void setUseAdvancedPrivacyProtections(bool);

    bool didFilterLinkDecoration() const { return m_requestData.m_didFilterLinkDecoration; }
    WEBCORE_EXPORT void setDidFilterLinkDecoration(bool);

    bool isPrivateTokenUsageByThirdPartyAllowed() const { return m_requestData.m_isPrivateTokenUsageByThirdPartyAllowed; }
    void setIsPrivateTokenUsageByThirdPartyAllowed(bool);

    bool wasSchemeOptimisticallyUpgraded() const { return m_requestData.m_wasSchemeOptimisticallyUpgraded; }
    void setWasSchemeOptimisticallyUpgraded(bool);

protected:
    // Used when ResourceRequest is initialized from a platform representation of the request
    ResourceRequestBase()
        : m_requestData()
        , m_resourceRequestUpdated(false)
        , m_platformRequestUpdated(true)
        , m_resourceRequestBodyUpdated(false)
        , m_platformRequestBodyUpdated(true)
        , m_hiddenFromInspector(false)
    {
    }

    ResourceRequestBase(const URL& url, ResourceRequestCachePolicy policy)
        : m_requestData({ url, policy })
        , m_resourceRequestUpdated(true)
        , m_platformRequestUpdated(false)
        , m_resourceRequestBodyUpdated(true)
        , m_platformRequestBodyUpdated(false)
        , m_hiddenFromInspector(false)
    {
        m_requestData.m_allowCookies = true;
    }

    void updatePlatformRequest(HTTPBodyUpdatePolicy = HTTPBodyUpdatePolicy::DoNotUpdateHTTPBody) const;
    void updateResourceRequest(HTTPBodyUpdatePolicy = HTTPBodyUpdatePolicy::DoNotUpdateHTTPBody) const;

    // The ResourceRequest subclass may "shadow" this method to compare platform specific fields
    static bool platformCompare(const ResourceRequest&, const ResourceRequest&) { return true; }
    
    RequestData m_requestData;
    String m_initiatorIdentifier;
    String m_cachePartition { emptyString() };
    RefPtr<FormData> m_httpBody;
    std::optional<int> m_inspectorInitiatorNodeIdentifier;
    mutable bool m_resourceRequestUpdated : 1;
    mutable bool m_platformRequestUpdated : 1;
    mutable bool m_resourceRequestBodyUpdated : 1;
    mutable bool m_platformRequestBodyUpdated : 1;
    bool m_hiddenFromInspector : 1;

private:
    const ResourceRequest& asResourceRequest() const;

    WEBCORE_EXPORT static double s_defaultTimeoutInterval;
};

bool equalIgnoringHeaderFields(const ResourceRequestBase&, const ResourceRequestBase&);

inline bool operator==(const ResourceRequest& a, const ResourceRequest& b) { return ResourceRequestBase::equal(a, b); }

WEBCORE_EXPORT unsigned initializeMaximumHTTPConnectionCountPerHost();
#if PLATFORM(IOS_FAMILY)
WEBCORE_EXPORT void initializeHTTPConnectionSettingsOnStartup();
#endif

} // namespace WebCore

namespace WTF {

template<> struct EnumTraitsForPersistence<WebCore::ResourceRequestCachePolicy> {
    using values = EnumValues<
        WebCore::ResourceRequestCachePolicy,
        WebCore::ResourceRequestCachePolicy::UseProtocolCachePolicy,
        WebCore::ResourceRequestCachePolicy::ReloadIgnoringCacheData,
        WebCore::ResourceRequestCachePolicy::ReturnCacheDataElseLoad,
        WebCore::ResourceRequestCachePolicy::ReturnCacheDataDontLoad,
        WebCore::ResourceRequestCachePolicy::DoNotUseAnyCache,
        WebCore::ResourceRequestCachePolicy::RefreshAnyCacheData
    >;
};

template<> struct EnumTraitsForPersistence<WebCore::ResourceRequestBase::SameSiteDisposition> {
    using values = EnumValues<
        WebCore::ResourceRequestBase::SameSiteDisposition,
        WebCore::ResourceRequestBase::SameSiteDisposition::Unspecified,
        WebCore::ResourceRequestBase::SameSiteDisposition::SameSite,
        WebCore::ResourceRequestBase::SameSiteDisposition::CrossSite
    >;
};

template<> struct EnumTraitsForPersistence<WebCore::ResourceRequestRequester> {
    using values = EnumValues<
        WebCore::ResourceRequestRequester,
        WebCore::ResourceRequestRequester::Unspecified,
        WebCore::ResourceRequestRequester::Main,
        WebCore::ResourceRequestRequester::XHR,
        WebCore::ResourceRequestRequester::Fetch,
        WebCore::ResourceRequestRequester::Media,
        WebCore::ResourceRequestRequester::ImportScripts,
        WebCore::ResourceRequestRequester::Ping,
        WebCore::ResourceRequestRequester::Beacon,
        WebCore::ResourceRequestRequester::EventSource
    >;
};

} // namespace WTF
