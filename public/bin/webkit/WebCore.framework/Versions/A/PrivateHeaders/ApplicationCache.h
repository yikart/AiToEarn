/*
 * Copyright (C) 2008-2017 Apple Inc. All Rights Reserved.
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

#include <wtf/HashMap.h>
#include <wtf/WeakPtr.h>
#include <wtf/text/StringHash.h>

namespace WebCore {

class ApplicationCacheGroup;
class ApplicationCacheResource;
class ResourceRequest;

using FallbackURLVector = Vector<std::pair<URL, URL>>;

class ApplicationCache : public RefCounted<ApplicationCache> {
public:
    static Ref<ApplicationCache> create() { return adoptRef(*new ApplicationCache); }

    ~ApplicationCache();

    void addResource(Ref<ApplicationCacheResource>&&);

    void setManifestResource(Ref<ApplicationCacheResource>&&);
    ApplicationCacheResource* manifestResource() const;

    void setGroup(ApplicationCacheGroup*);
    ApplicationCacheGroup* group() const;

    bool isComplete();

    ApplicationCacheResource* resourceForRequest(const ResourceRequest&);
    ApplicationCacheResource* resourceForURL(const String& url);

    void setAllowsAllNetworkRequests(bool value) { m_allowAllNetworkRequests = value; }
    bool allowsAllNetworkRequests() const { return m_allowAllNetworkRequests; }
    void setOnlineAllowlist(const Vector<URL>&);
    const Vector<URL>& onlineAllowlist() const { return m_onlineAllowlist; }
    bool isURLInOnlineAllowlist(const URL&); // There is an entry in online allowlist that has the same origin as the resource's URL and that is a prefix match for the resource's URL.

    void setFallbackURLs(const FallbackURLVector&);
    const FallbackURLVector& fallbackURLs() const { return m_fallbackURLs; }
    bool urlMatchesFallbackNamespace(const URL&, URL* fallbackURL = nullptr);

#ifndef NDEBUG
    void dump();
#endif

    using ResourceMap = HashMap<String, RefPtr<ApplicationCacheResource>>;
    const ResourceMap& resources() const { return m_resources; }

    void setStorageID(unsigned storageID) { m_storageID = storageID; }
    unsigned storageID() const { return m_storageID; }
    void clearStorageID();

    static bool requestIsHTTPOrHTTPSGet(const ResourceRequest&);

    int64_t estimatedSizeInStorage() const { return m_estimatedSizeInStorage; }

private:
    ApplicationCache();

    WeakPtr<ApplicationCacheGroup> m_group;
    ResourceMap m_resources;
    WeakPtr<ApplicationCacheResource> m_manifest;

    bool m_allowAllNetworkRequests { false };
    Vector<URL> m_onlineAllowlist;
    FallbackURLVector m_fallbackURLs;

    // The total size of the resources belonging to this Application Cache instance.
    // This is an estimation of the size this Application Cache occupies in the database file.
    int64_t m_estimatedSizeInStorage { 0 };

    unsigned m_storageID { 0 };
};

} // namespace WebCore
