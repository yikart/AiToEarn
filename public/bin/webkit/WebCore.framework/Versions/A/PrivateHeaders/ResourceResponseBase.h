/*
 * Copyright (C) 2006, 2008, 2016 Apple Inc. All rights reserved.
 * Copyright (C) 2009 Google Inc. All rights reserved.
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

#include "CacheValidation.h"
#include "CertificateInfo.h"
#include "HTTPHeaderMap.h"
#include "NetworkLoadMetrics.h"
#include "ParsedContentRange.h"
#include <span>
#include <wtf/ArgumentCoder.h>
#include <wtf/Box.h>
#include <wtf/EnumTraits.h>
#include <wtf/Markable.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/URL.h>
#include <wtf/WallTime.h>
#include <wtf/persistence/PersistentCoders.h>

namespace WebCore {

namespace DataURLDecoder {
struct Result;
}

class ResourceResponse;
struct ResourceResponseData;

bool isScriptAllowedByNosniff(const ResourceResponse&);

enum class UsedLegacyTLS : bool { No, Yes };
static constexpr unsigned bitWidthOfUsedLegacyTLS = 1;
static_assert(static_cast<unsigned>(UsedLegacyTLS::Yes) <= ((1U << bitWidthOfUsedLegacyTLS) - 1));

enum class WasPrivateRelayed : bool { No, Yes };
static constexpr unsigned bitWidthOfWasPrivateRelayed = 1;
static_assert(static_cast<unsigned>(WasPrivateRelayed::Yes) <= ((1U << bitWidthOfWasPrivateRelayed) - 1));

enum class ResourceResponseBaseType : uint8_t { Basic, Cors, Default, Error, Opaque, Opaqueredirect };
enum class ResourceResponseBaseTainting : uint8_t { Basic, Cors, Opaque, Opaqueredirect };
enum class ResourceResponseBaseSource : uint8_t { Unknown, Network, DiskCache, DiskCacheAfterValidation, MemoryCache, MemoryCacheAfterValidation, ServiceWorker, ApplicationCache, DOMCache, InspectorOverride };

// Do not use this class directly, use the class ResourceResponse instead
class ResourceResponseBase {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(ResourceResponseBase, WEBCORE_EXPORT);
public:
    using Type = ResourceResponseBaseType;
    static constexpr unsigned bitWidthOfType = 3;
    using Tainting = ResourceResponseBaseTainting;
    static constexpr unsigned bitWidthOfTainting = 2;
    using Source = ResourceResponseBaseSource;
    static constexpr unsigned bitWidthOfSource = 4;

    static bool isRedirectionStatusCode(int code) { return code == 301 || code == 302 || code == 303 || code == 307 || code == 308; }

    using CrossThreadData = ResourceResponseData;

    WEBCORE_EXPORT CrossThreadData crossThreadData() const;
    WEBCORE_EXPORT static ResourceResponse fromCrossThreadData(CrossThreadData&&);

    bool isNull() const { return m_isNull; }
    WEBCORE_EXPORT bool isInHTTPFamily() const;
    WEBCORE_EXPORT bool isSuccessful() const;

    WEBCORE_EXPORT const URL& url() const;
    WEBCORE_EXPORT void setURL(const URL&);

    WEBCORE_EXPORT const String& mimeType() const;
    WEBCORE_EXPORT void setMimeType(String&&);

    WEBCORE_EXPORT long long expectedContentLength() const;
    WEBCORE_EXPORT void setExpectedContentLength(long long expectedContentLength);

    WEBCORE_EXPORT const String& textEncodingName() const;
    WEBCORE_EXPORT void setTextEncodingName(String&&);

    WEBCORE_EXPORT int httpStatusCode() const;
    WEBCORE_EXPORT void setHTTPStatusCode(int);
    WEBCORE_EXPORT bool isRedirection() const;

    WEBCORE_EXPORT const String& httpStatusText() const;
    WEBCORE_EXPORT void setHTTPStatusText(String&&);

    WEBCORE_EXPORT const String& httpVersion() const;
    WEBCORE_EXPORT void setHTTPVersion(String&&);
    WEBCORE_EXPORT bool isHTTP09() const;

    WEBCORE_EXPORT const HTTPHeaderMap& httpHeaderFields() const;
    void setHTTPHeaderFields(HTTPHeaderMap&&);

    enum class SanitizationType { Redirection, RemoveCookies, CrossOriginSafe };
    WEBCORE_EXPORT void sanitizeHTTPHeaderFields(SanitizationType);

    String httpHeaderField(StringView name) const;
    WEBCORE_EXPORT String httpHeaderField(HTTPHeaderName) const;
    WEBCORE_EXPORT void setHTTPHeaderField(const String& name, const String& value);
    WEBCORE_EXPORT void setUncommonHTTPHeaderField(const String& name, const String& value);
    WEBCORE_EXPORT void setHTTPHeaderField(HTTPHeaderName, const String& value);

    WEBCORE_EXPORT void addHTTPHeaderField(HTTPHeaderName, const String& value);
    WEBCORE_EXPORT void addHTTPHeaderField(const String& name, const String& value);
    WEBCORE_EXPORT void addUncommonHTTPHeaderField(const String& name, const String& value);

    // Instead of passing a string literal to any of these functions, just use a HTTPHeaderName instead.
    template<size_t length> String httpHeaderField(ASCIILiteral) const = delete;
    template<size_t length> void setHTTPHeaderField(ASCIILiteral, const String&) = delete;
    template<size_t length> void addHTTPHeaderField(ASCIILiteral, const String&) = delete;

    bool isMultipart() const { return mimeType() == "multipart/x-mixed-replace"_s; }

    WEBCORE_EXPORT bool isAttachment() const;
    WEBCORE_EXPORT bool isAttachmentWithFilename() const;
    WEBCORE_EXPORT String suggestedFilename() const;
    WEBCORE_EXPORT static String sanitizeSuggestedFilename(const String&);

    bool isNosniff() const;

    WEBCORE_EXPORT void includeCertificateInfo(std::span<const std::byte> = { }) const;
    void setCertificateInfo(CertificateInfo&& info) { m_certificateInfo = WTFMove(info); }
    const std::optional<CertificateInfo>& certificateInfo() const { return m_certificateInfo; };
    bool usedLegacyTLS() const { return m_usedLegacyTLS == UsedLegacyTLS::Yes; }
    void setUsedLegacyTLS(UsedLegacyTLS used) { m_usedLegacyTLS = used; }
    bool wasPrivateRelayed() const { return m_wasPrivateRelayed == WasPrivateRelayed::Yes; }
    void setWasPrivateRelayed(WasPrivateRelayed privateRelayed) { m_wasPrivateRelayed = privateRelayed; }
    
    // These functions return parsed values of the corresponding response headers.
    WEBCORE_EXPORT bool cacheControlContainsNoCache() const;
    WEBCORE_EXPORT bool cacheControlContainsNoStore() const;
    WEBCORE_EXPORT bool cacheControlContainsMustRevalidate() const;
    WEBCORE_EXPORT bool cacheControlContainsImmutable() const;
    WEBCORE_EXPORT bool hasCacheValidatorFields() const;
    WEBCORE_EXPORT std::optional<Seconds> cacheControlMaxAge() const;
    WEBCORE_EXPORT std::optional<Seconds> cacheControlStaleWhileRevalidate() const;
    WEBCORE_EXPORT std::optional<WallTime> date() const;
    WEBCORE_EXPORT std::optional<Seconds> age() const;
    WEBCORE_EXPORT std::optional<WallTime> expires() const;
    WEBCORE_EXPORT std::optional<WallTime> lastModified() const;
    const ParsedContentRange& contentRange() const;

    static_assert(static_cast<unsigned>(Source::InspectorOverride) <= ((1U << bitWidthOfSource) - 1));

    WEBCORE_EXPORT Source source() const;
    void setSource(Source source)
    {
        ASSERT(source != Source::Unknown);
        m_source = source;
    }

    // FIXME: This should be eliminated from ResourceResponse.
    // Network loading metrics should be delivered via didFinishLoad
    // and should not be part of the ResourceResponse.
    const NetworkLoadMetrics* deprecatedNetworkLoadMetricsOrNull() const
    {
        if (m_networkLoadMetrics)
            return m_networkLoadMetrics.get();
        return nullptr;
    }
    void setDeprecatedNetworkLoadMetrics(Box<NetworkLoadMetrics>&& metrics)
    {
        m_networkLoadMetrics = WTFMove(metrics);
    }
    Box<NetworkLoadMetrics> takeNetworkLoadMetrics()
    {
        return std::exchange(m_networkLoadMetrics, nullptr);
    }

    // The ResourceResponse subclass may "shadow" this method to provide platform-specific memory usage information
    unsigned memoryUsage() const
    {
        // average size, mostly due to URL and Header Map strings
        return 1280;
    }

    WEBCORE_EXPORT void setType(Type);
    Type type() const { return m_type; }

    void setRedirected(bool isRedirected) { m_isRedirected = isRedirected; }
    bool isRedirected() const { return m_isRedirected; }

    void setTainting(Tainting tainting) { m_tainting = tainting; }
    Tainting tainting() const { return m_tainting; }

    enum class PerformExposeAllHeadersCheck : bool { No, Yes };
    static ResourceResponse filter(const ResourceResponse&, PerformExposeAllHeadersCheck);

    WEBCORE_EXPORT static ResourceResponse syntheticRedirectResponse(const URL& fromURL, const URL& toURL);

    static bool equalForWebKitLegacyChallengeComparison(const ResourceResponse&, const ResourceResponse&);

    bool isRangeRequested() const { return m_isRangeRequested; }
    void setAsRangeRequested() { m_isRangeRequested = true; }

    WEBCORE_EXPORT bool containsInvalidHTTPHeaders() const;

    WEBCORE_EXPORT static ResourceResponse dataURLResponse(const URL&, const DataURLDecoder::Result&);
    
    WEBCORE_EXPORT ResourceResponseBase(std::optional<ResourceResponseData>);
    
    WEBCORE_EXPORT std::optional<ResourceResponseData> getResponseData() const;

protected:
    enum InitLevel {
        Uninitialized,
        CommonFieldsOnly,
        AllFields
    };

    WEBCORE_EXPORT ResourceResponseBase();
    WEBCORE_EXPORT ResourceResponseBase(const URL&, const String& mimeType, long long expectedLength, const String& textEncodingName);

    WEBCORE_EXPORT void lazyInit(InitLevel) const;

    // The ResourceResponse subclass should shadow these functions to lazily initialize platform specific fields
    void platformLazyInit(InitLevel) { }
    CertificateInfo platformCertificateInfo(std::span<const std::byte>) const { return CertificateInfo(); };
    String platformSuggestedFileName() const { return String(); }

    static bool platformCompare(const ResourceResponse&, const ResourceResponse&) { return true; }

private:
    void parseCacheControlDirectives() const;
    void updateHeaderParsedState(HTTPHeaderName);
    void sanitizeHTTPHeaderFieldsAccordingToTainting();

protected:
    URL m_url;
    String m_mimeType;
    long long m_expectedContentLength { 0 };
    String m_textEncodingName;
    String m_httpStatusText;
    String m_httpVersion;
    HTTPHeaderMap m_httpHeaderFields;

public:
    HTTPHeaderMap m_httpRequestHeaderFields;

protected:
    Box<NetworkLoadMetrics> m_networkLoadMetrics;

    mutable std::optional<CertificateInfo> m_certificateInfo;

    short m_httpStatusCode { 0 };

    bool m_isNull : 1 { true };
    unsigned m_initLevel : 3; // Controlled by ResourceResponse.
    mutable UsedLegacyTLS m_usedLegacyTLS : bitWidthOfUsedLegacyTLS { UsedLegacyTLS::No };
    mutable WasPrivateRelayed m_wasPrivateRelayed : bitWidthOfWasPrivateRelayed { WasPrivateRelayed::No };

private:
    friend struct WTF::Persistence::Coder<ResourceResponse>;
    mutable Markable<Seconds, Seconds::MarkableTraits> m_age;
    mutable Markable<WallTime> m_date;
    mutable Markable<WallTime> m_expires;
    mutable Markable<WallTime> m_lastModified;
    mutable ParsedContentRange m_contentRange;
    mutable CacheControlDirectives m_cacheControlDirectives;

    mutable bool m_haveParsedCacheControlHeader : 1 { false };
    mutable bool m_haveParsedAgeHeader : 1 { false };
    mutable bool m_haveParsedDateHeader : 1 { false };
    mutable bool m_haveParsedExpiresHeader : 1 { false };
    mutable bool m_haveParsedLastModifiedHeader : 1 { false };
    mutable bool m_haveParsedContentRangeHeader : 1 { false };
    bool m_isRedirected : 1 { false };
    bool m_isRangeRequested : 1 { false };

    Tainting m_tainting : bitWidthOfTainting { Tainting::Basic };
    Source m_source : bitWidthOfSource { Source::Unknown };
    Type m_type : bitWidthOfType { Type::Default };
};

struct ResourceResponseData {
    ResourceResponseData(const ResourceResponseData&) = delete;
    ResourceResponseData& operator=(const ResourceResponseData&) = delete;
    ResourceResponseData() = default;
    ResourceResponseData(ResourceResponseData&&) = default;
    ResourceResponseData& operator=(ResourceResponseData&&) = default;
    ResourceResponseData(URL&& url, String&& mimeType, long long expectedContentLength, String&& textEncodingName, int httpStatusCode, String&& httpStatusText, String&& httpVersion, HTTPHeaderMap&& httpHeaderFields, HTTPHeaderMap&& httpRequestHeaderFields, std::optional<NetworkLoadMetrics>&& networkLoadMetrics, ResourceResponseBaseSource source, ResourceResponseBaseType type, ResourceResponseBaseTainting tainting, bool isRedirected, UsedLegacyTLS usedLegacyTLS, WasPrivateRelayed wasPrivateRelayed, bool isRangeRequested, std::optional<CertificateInfo> certificateInfo)
        : url(WTFMove(url))
        , mimeType(WTFMove(mimeType))
        , expectedContentLength(expectedContentLength)
        , textEncodingName(WTFMove(textEncodingName))
        , httpStatusCode(httpStatusCode)
        , httpStatusText(WTFMove(httpStatusText))
        , httpVersion(WTFMove(httpVersion))
        , httpHeaderFields(WTFMove(httpHeaderFields))
        , httpRequestHeaderFields(WTFMove(httpRequestHeaderFields))
        , networkLoadMetrics(WTFMove(networkLoadMetrics))
        , source(source)
        , type(type)
        , tainting(tainting)
        , isRedirected(isRedirected)
        , usedLegacyTLS(usedLegacyTLS)
        , wasPrivateRelayed(wasPrivateRelayed)
        , isRangeRequested(isRangeRequested)
        , certificateInfo(certificateInfo)
    {
    }

    WEBCORE_EXPORT ResourceResponseData isolatedCopy() const;

    URL url;
    String mimeType;
    long long expectedContentLength;
    String textEncodingName;
    short httpStatusCode;
    String httpStatusText;
    String httpVersion;
    HTTPHeaderMap httpHeaderFields;
    HTTPHeaderMap httpRequestHeaderFields;
    std::optional<NetworkLoadMetrics> networkLoadMetrics;
    ResourceResponseBase::Source source;
    ResourceResponseBase::Type type;
    ResourceResponseBase::Tainting tainting;
    bool isRedirected;
    UsedLegacyTLS usedLegacyTLS;
    WasPrivateRelayed wasPrivateRelayed;
    bool isRangeRequested;
    std::optional<CertificateInfo> certificateInfo;
};

} // namespace WebCore

namespace WTF {

template<> struct EnumTraitsForPersistence<WebCore::ResourceResponseBase::Type> {
    using values = EnumValues<
        WebCore::ResourceResponseBase::Type,
        WebCore::ResourceResponseBase::Type::Basic,
        WebCore::ResourceResponseBase::Type::Cors,
        WebCore::ResourceResponseBase::Type::Default,
        WebCore::ResourceResponseBase::Type::Error,
        WebCore::ResourceResponseBase::Type::Opaque,
        WebCore::ResourceResponseBase::Type::Opaqueredirect
    >;
};

template<> struct EnumTraitsForPersistence<WebCore::ResourceResponseBase::Tainting> {
    using values = EnumValues<
        WebCore::ResourceResponseBase::Tainting,
        WebCore::ResourceResponseBase::Tainting::Basic,
        WebCore::ResourceResponseBase::Tainting::Cors,
        WebCore::ResourceResponseBase::Tainting::Opaque,
        WebCore::ResourceResponseBase::Tainting::Opaqueredirect
    >;
};

template<> struct EnumTraitsForPersistence<WebCore::ResourceResponseBase::Source> {
    using values = EnumValues<
        WebCore::ResourceResponseBase::Source,
        WebCore::ResourceResponseBase::Source::Unknown,
        WebCore::ResourceResponseBase::Source::Network,
        WebCore::ResourceResponseBase::Source::DiskCache,
        WebCore::ResourceResponseBase::Source::DiskCacheAfterValidation,
        WebCore::ResourceResponseBase::Source::MemoryCache,
        WebCore::ResourceResponseBase::Source::MemoryCacheAfterValidation,
        WebCore::ResourceResponseBase::Source::ServiceWorker,
        WebCore::ResourceResponseBase::Source::ApplicationCache,
        WebCore::ResourceResponseBase::Source::DOMCache,
        WebCore::ResourceResponseBase::Source::InspectorOverride
    >;
};

namespace Persistence {

class Decoder;
class Encoder;

template<> struct Coder<WebCore::ResourceResponseData> {
    WEBCORE_EXPORT static void encodeForPersistence(Encoder&, const WebCore::ResourceResponseData&);
    WEBCORE_EXPORT static std::optional<WebCore::ResourceResponseData> decodeForPersistence(Decoder&);
};

} // namespace Persistence

} // namespace WTF
