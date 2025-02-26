/*
 * Copyright (C) 2022 Apple Inc. All rights reserved.
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

#include "RegistrableDomain.h"
#include <wtf/text/StringHash.h>

namespace WebCore::PCM {

struct SourceSite {
    explicit SourceSite(const URL& url)
        : registrableDomain { url }
    {
    }

    explicit SourceSite(RegistrableDomain&& domain)
        : registrableDomain { WTFMove(domain) }
    {
    }

    SourceSite isolatedCopy() const & { return SourceSite { registrableDomain.isolatedCopy() }; }
    SourceSite isolatedCopy() && { return SourceSite { WTFMove(registrableDomain).isolatedCopy() }; }

    friend bool operator==(const SourceSite&, const SourceSite&) = default;

    bool matches(const URL& url) const
    {
        return registrableDomain.matches(url);
    }

    RegistrableDomain registrableDomain;
};

struct SourceSiteHash {
    static unsigned hash(const SourceSite& sourceSite)
    {
        return sourceSite.registrableDomain.hash();
    }
    
    static bool equal(const SourceSite& a, const SourceSite& b)
    {
        return a == b;
    }

    static const bool safeToCompareToEmptyOrDeleted = false;
};

struct AttributionDestinationSite {
    AttributionDestinationSite() = default;
    explicit AttributionDestinationSite(const URL& url)
        : registrableDomain { RegistrableDomain { url } }
    {
    }

    explicit AttributionDestinationSite(RegistrableDomain&& domain)
        : registrableDomain { WTFMove(domain) }
    {
    }

    AttributionDestinationSite isolatedCopy() const & { return AttributionDestinationSite { registrableDomain.isolatedCopy() }; }
    AttributionDestinationSite isolatedCopy() && { return AttributionDestinationSite { WTFMove(registrableDomain).isolatedCopy() }; }

    friend bool operator==(const AttributionDestinationSite&, const AttributionDestinationSite&) = default;

    bool matches(const URL& url) const
    {
        return registrableDomain == RegistrableDomain { url };
    }

    RegistrableDomain registrableDomain;
};

struct AttributionDestinationSiteHash {
    static unsigned hash(const AttributionDestinationSite& destinationSite)
    {
        return destinationSite.registrableDomain.hash();
    }
    
    static bool equal(const AttributionDestinationSite& a, const AttributionDestinationSite& b)
    {
        return a == b;
    }

    static const bool safeToCompareToEmptyOrDeleted = false;
};

} // namespace WebCore::PCM

namespace WTF {

template<typename T> struct DefaultHash;

template<> struct DefaultHash<WebCore::PCM::SourceSite> : WebCore::PCM::SourceSiteHash { };
template<> struct HashTraits<WebCore::PCM::SourceSite> : GenericHashTraits<WebCore::PCM::SourceSite> {
    static WebCore::PCM::SourceSite emptyValue() { return WebCore::PCM::SourceSite(WebCore::RegistrableDomain()); }
    static bool isEmptyValue(const WebCore::PCM::SourceSite& value) { return value.registrableDomain.string().isNull(); }
    static void constructDeletedValue(WebCore::PCM::SourceSite& slot) { new (NotNull, &slot.registrableDomain) WebCore::RegistrableDomain(WTF::HashTableDeletedValue); }
    static bool isDeletedValue(const WebCore::PCM::SourceSite& slot) { return slot.registrableDomain.isHashTableDeletedValue(); }
};

template<> struct DefaultHash<WebCore::PCM::AttributionDestinationSite> : WebCore::PCM::AttributionDestinationSiteHash { };
template<> struct HashTraits<WebCore::PCM::AttributionDestinationSite> : GenericHashTraits<WebCore::PCM::AttributionDestinationSite> {
    static WebCore::PCM::AttributionDestinationSite emptyValue() { return { }; }
    static bool isEmptyValue(const WebCore::PCM::AttributionDestinationSite& value) { return value.registrableDomain.string().isNull(); }
    static void constructDeletedValue(WebCore::PCM::AttributionDestinationSite& slot) { new (NotNull, &slot.registrableDomain) WebCore::RegistrableDomain(WTF::HashTableDeletedValue); }
    static bool isDeletedValue(const WebCore::PCM::AttributionDestinationSite& slot) { return slot.registrableDomain.isHashTableDeletedValue(); }
};

} // namespace WTF
