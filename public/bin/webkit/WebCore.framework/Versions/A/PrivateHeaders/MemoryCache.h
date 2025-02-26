/*
    Copyright (C) 1998 Lars Knoll (knoll@mpi-hd.mpg.de)
    Copyright (C) 2001 Dirk Mueller <mueller@kde.org>
    Copyright (C) 2004, 2005, 2006, 2007, 2008 Apple Inc. All rights reserved.

    This library is free software; you can redistribute it and/or
    modify it under the terms of the GNU Library General Public
    License as published by the Free Software Foundation; either
    version 2 of the License, or (at your option) any later version.

    This library is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
    Library General Public License for more details.

    You should have received a copy of the GNU Library General Public License
    along with this library; see the file COPYING.LIB.  If not, write to
    the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
    Boston, MA 02110-1301, USA.

    This class provides all functionality needed for loading images, style sheets and html
    pages from the web. It has a memory cache for these objects.
*/

#pragma once

#include "LoaderMalloc.h"
#include "SecurityOriginHash.h"
#include "Timer.h"
#include <pal/SessionID.h>
#include <wtf/Forward.h>
#include <wtf/Function.h>
#include <wtf/HashMap.h>
#include <wtf/HashSet.h>
#include <wtf/Noncopyable.h>
#include <wtf/Vector.h>
#include <wtf/WeakListHashSet.h>
#include <wtf/text/StringHash.h>
#include <wtf/text/WTFString.h>

namespace WebCore  {

class CachedResource;
class CookieJar;
class ResourceRequest;
class ResourceResponse;
class ScriptExecutionContext;
class SecurityOrigin;
struct ClientOrigin;

// This cache holds subresources used by Web pages: images, scripts, stylesheets, etc.

// The cache keeps a flexible but bounded window of dead resources that grows/shrinks 
// depending on the live resource load. Here's an example of cache growth over time,
// with a min dead resource capacity of 25% and a max dead resource capacity of 50%:

//        |-----|                              Dead: -
//        |----------|                         Live: +
//      --|----------|                         Cache boundary: | (objects outside this mark have been evicted)
//      --|----------++++++++++|
// -------|-----+++++++++++++++|
// -------|-----+++++++++++++++|+++++

class MemoryCache {
    WTF_MAKE_NONCOPYABLE(MemoryCache); WTF_MAKE_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(Loader);
    friend NeverDestroyed<MemoryCache>;
    friend class Internals;
public:
    struct TypeStatistic {
        int count;
        int size;
        int liveSize;
        int decodedSize;

        TypeStatistic()
            : count(0)
            , size(0)
            , liveSize(0)
            , decodedSize(0)
        { 
        }

        void addResource(CachedResource&);
    };
    
    struct Statistics {
        TypeStatistic images;
        TypeStatistic cssStyleSheets;
        TypeStatistic scripts;
        TypeStatistic xslStyleSheets;
        TypeStatistic fonts;
    };

    WEBCORE_EXPORT static MemoryCache& singleton();

    // Do nothing since this is a singleton.
    void ref() const { }
    void deref() const { }

    WEBCORE_EXPORT CachedResource* resourceForRequest(const ResourceRequest&, PAL::SessionID);

    bool add(CachedResource&);
    void remove(CachedResource&);

    static bool shouldRemoveFragmentIdentifier(const URL&);
    WEBCORE_EXPORT static URL removeFragmentIdentifierIfNeeded(const URL&);

    void revalidationSucceeded(CachedResource& revalidatingResource, const ResourceResponse&);
    void revalidationFailed(CachedResource& revalidatingResource);

    void forEachResource(const Function<void(CachedResource&)>&);
    void forEachSessionResource(PAL::SessionID, const Function<void(CachedResource&)>&);
    WEBCORE_EXPORT void destroyDecodedDataForAllImages();

    // Sets the cache's memory capacities, in bytes. These will hold only approximately,
    // since the decoded cost of resources like scripts and stylesheets is not known.
    //  - minDeadBytes: The maximum number of bytes that dead resources should consume when the cache is under pressure.
    //  - maxDeadBytes: The maximum number of bytes that dead resources should consume when the cache is not under pressure.
    //  - totalBytes: The maximum number of bytes that the cache should consume overall.
    WEBCORE_EXPORT void setCapacities(unsigned minDeadBytes, unsigned maxDeadBytes, unsigned totalBytes);

    // Turn the cache on and off.  Disabling the cache will remove all resources from the cache.  They may
    // still live on if they are referenced by some Web page though.
    WEBCORE_EXPORT void setDisabled(bool);
    bool disabled() const { return m_disabled; }

    WEBCORE_EXPORT void evictResources();
    WEBCORE_EXPORT void evictResources(PAL::SessionID);

    void prune();
    void pruneSoon();
    unsigned size() const { return m_liveSize + m_deadSize; }

    void setDeadDecodedDataDeletionInterval(Seconds interval) { m_deadDecodedDataDeletionInterval = interval; }
    Seconds deadDecodedDataDeletionInterval() const { return m_deadDecodedDataDeletionInterval; }

    // Calls to put the cached resource into and out of LRU lists.
    void insertInLRUList(CachedResource&);
    void removeFromLRUList(CachedResource&);

    // Called to adjust the cache totals when a resource changes size.
    void adjustSize(bool live, long long delta);

    // Track decoded resources that are in the cache and referenced by a Web page.
    void insertInLiveDecodedResourcesList(CachedResource&);
    void removeFromLiveDecodedResourcesList(CachedResource&);
    void moveToEndOfLiveDecodedResourcesListIfPresent(CachedResource&);

    void addToLiveResourcesSize(CachedResource&);
    void removeFromLiveResourcesSize(CachedResource&);

    static void removeRequestFromSessionCaches(ScriptExecutionContext&, const ResourceRequest&);

    // Function to collect cache statistics for the caches window in the Safari Debug menu.
    WEBCORE_EXPORT Statistics getStatistics();
    
    void resourceAccessed(CachedResource&);
    bool inLiveDecodedResourcesList(CachedResource&) const;

    typedef HashSet<RefPtr<SecurityOrigin>> SecurityOriginSet;
    WEBCORE_EXPORT void removeResourcesWithOrigin(const SecurityOrigin&);
    void removeResourcesWithOrigin(const SecurityOrigin&, const String& cachePartition);
    WEBCORE_EXPORT void removeResourcesWithOrigin(const ClientOrigin&);
    WEBCORE_EXPORT void removeResourcesWithOrigins(PAL::SessionID, const HashSet<RefPtr<SecurityOrigin>>&);
    WEBCORE_EXPORT void getOriginsWithCache(SecurityOriginSet& origins);
    WEBCORE_EXPORT HashSet<RefPtr<SecurityOrigin>> originsWithCache(PAL::SessionID) const;

    // pruneDead*() - Flush decoded and encoded data from resources not referenced by Web pages.
    // pruneLive*() - Flush decoded data from resources still referenced by Web pages.
    WEBCORE_EXPORT void pruneDeadResources(); // Automatically decide how much to prune.
    WEBCORE_EXPORT void pruneLiveResources(bool shouldDestroyDecodedDataForAllLiveResources = false);

    WEBCORE_EXPORT void pruneDeadResourcesToSize(unsigned targetSize);
    WEBCORE_EXPORT void pruneLiveResourcesToSize(unsigned targetSize, bool shouldDestroyDecodedDataForAllLiveResources = false);

private:
    using CachedResourceMap = HashMap<std::pair<URL, String /* partitionName */>, WeakPtr<CachedResource>>;
    using LRUList = WeakListHashSet<CachedResource>;

    MemoryCache();
    ~MemoryCache(); // Not implemented to make sure nobody accidentally calls delete -- WebCore does not delete singletons.

    LRUList& lruListFor(CachedResource&);

    void dumpStats();
    void dumpLRULists(bool includeLive) const;

    unsigned liveCapacity() const;
    unsigned deadCapacity() const;
    bool needsPruning() const;

    CachedResource* resourceForRequestImpl(const ResourceRequest&, CachedResourceMap&);

    CachedResourceMap& ensureSessionResourceMap(PAL::SessionID);
    CachedResourceMap* sessionResourceMap(PAL::SessionID) const;

    bool m_disabled { false };
    bool m_inPruneResources { false };

    unsigned m_capacity;
    unsigned m_minDeadCapacity { 0 };
    unsigned m_maxDeadCapacity;
    Seconds m_deadDecodedDataDeletionInterval;

    unsigned m_liveSize { 0 }; // The number of bytes currently consumed by "live" resources in the cache.
    unsigned m_deadSize { 0 }; // The number of bytes currently consumed by "dead" resources in the cache.

    // Size-adjusted and popularity-aware LRU list collection for cache objects.  This collection can hold
    // more resources than the cached resource map, since it can also hold "stale" multiple versions of objects that are
    // waiting to die when the clients referencing them go away.
    Vector<std::unique_ptr<LRUList>, 32> m_allResources;
    
    // List just for live resources with decoded data.  Access to this list is based off of painting the resource.
    LRUList m_liveDecodedResources;
    
    // A URL-based map of all resources that are in the cache (including the freshest version of objects that are currently being 
    // referenced by a Web page).
    typedef HashMap<PAL::SessionID, std::unique_ptr<CachedResourceMap>> SessionCachedResourceMap;
    SessionCachedResourceMap m_sessionResources;

    Timer m_pruneTimer;
};

} // namespace WebCore
