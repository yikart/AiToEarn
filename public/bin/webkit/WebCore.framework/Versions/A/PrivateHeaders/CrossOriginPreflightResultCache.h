/*
 * Copyright (C) 2008 Apple Inc. All Rights Reserved.
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

#include "ClientOrigin.h"
#include "LoaderMalloc.h"
#include "StoredCredentialsPolicy.h"
#include <pal/SessionID.h>
#include <wtf/Expected.h>
#include <wtf/HashMap.h>
#include <wtf/HashSet.h>
#include <wtf/MonotonicTime.h>
#include <wtf/URLHash.h>
#include <wtf/UniqueRef.h>

namespace WebCore {

class HTTPHeaderMap;
class ResourceResponse;

class CrossOriginPreflightResultCacheItem {
    WTF_MAKE_NONCOPYABLE(CrossOriginPreflightResultCacheItem); WTF_MAKE_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(Loader);
public:
    static Expected<UniqueRef<CrossOriginPreflightResultCacheItem>, String> create(StoredCredentialsPolicy, const ResourceResponse&);

    CrossOriginPreflightResultCacheItem(MonotonicTime, StoredCredentialsPolicy, HashSet<String>&&, HashSet<String, ASCIICaseInsensitiveHash>&&);

    std::optional<String> validateMethodAndHeaders(const String& method, const HTTPHeaderMap&) const;
    bool allowsRequest(StoredCredentialsPolicy, const String& method, const HTTPHeaderMap&) const;

private:
    bool allowsCrossOriginMethod(const String&, StoredCredentialsPolicy) const;
    std::optional<String> validateCrossOriginHeaders(const HTTPHeaderMap&, StoredCredentialsPolicy) const;

    // FIXME: A better solution to holding onto the absolute expiration time might be
    // to start a timer for the expiration delta that removes this from the cache when
    // it fires.
    MonotonicTime m_absoluteExpiryTime;
    StoredCredentialsPolicy m_storedCredentialsPolicy;
    HashSet<String> m_methods;
    HashSet<String, ASCIICaseInsensitiveHash> m_headers;
};

class CrossOriginPreflightResultCache {
    WTF_MAKE_NONCOPYABLE(CrossOriginPreflightResultCache); WTF_MAKE_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(Loader);
public:
    WEBCORE_EXPORT static CrossOriginPreflightResultCache& singleton();
    WEBCORE_EXPORT void appendEntry(PAL::SessionID, const ClientOrigin&, const URL&, std::unique_ptr<CrossOriginPreflightResultCacheItem>);
    WEBCORE_EXPORT bool canSkipPreflight(PAL::SessionID, const ClientOrigin&, const URL&, StoredCredentialsPolicy, const String& method, const HTTPHeaderMap& requestHeaders);
    WEBCORE_EXPORT void clear();

private:
    friend NeverDestroyed<CrossOriginPreflightResultCache>;
    CrossOriginPreflightResultCache();

    HashMap<std::tuple<PAL::SessionID, ClientOrigin, URL>, std::unique_ptr<CrossOriginPreflightResultCacheItem>> m_preflightHashMap;
};

inline CrossOriginPreflightResultCacheItem::CrossOriginPreflightResultCacheItem(MonotonicTime absoluteExpiryTime, StoredCredentialsPolicy  storedCredentialsPolicy, HashSet<String>&& methods, HashSet<String, ASCIICaseInsensitiveHash>&& headers)
    : m_absoluteExpiryTime(absoluteExpiryTime)
    , m_storedCredentialsPolicy(storedCredentialsPolicy)
    , m_methods(WTFMove(methods))
    , m_headers(WTFMove(headers))
{
}

} // namespace WebCore
