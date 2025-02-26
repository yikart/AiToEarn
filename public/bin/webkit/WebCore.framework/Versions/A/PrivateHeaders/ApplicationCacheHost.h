/*
 * Copyright (c) 2009, Google Inc. All rights reserved.
 * Copyright (c) 2017 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 * 
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "LoaderMalloc.h"
#include <wtf/CheckedRef.h>
#include <wtf/Deque.h>
#include <wtf/URL.h>
#include <wtf/Vector.h>
#include <wtf/WeakPtr.h>

namespace WebCore {

class ApplicationCache;
class ApplicationCacheGroup;
class ApplicationCacheResource;
class ApplicationCacheStorage;
class SharedBuffer;
class DOMApplicationCache;
class DocumentLoader;
class LocalFrame;
class ResourceError;
class ResourceLoader;
class ResourceRequest;
class ResourceResponse;
class SubstituteData;
class WeakPtrImplWithEventTargetData;

class ApplicationCacheHost {
    WTF_MAKE_NONCOPYABLE(ApplicationCacheHost); WTF_MAKE_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(Loader);
public:
    // The Status numeric values are specified in the HTML5 spec.
    enum Status {
        UNCACHED = 0,
        IDLE = 1,
        CHECKING = 2,
        DOWNLOADING = 3,
        UPDATEREADY = 4,
        OBSOLETE = 5
    };

    struct CacheInfo {
        URL manifest;
        double creationTime;
        double updateTime;
        long long size;
    };

    struct ResourceInfo {
        URL resource;
        bool isMaster;
        bool isManifest;
        bool isFallback;
        bool isForeign;
        bool isExplicit;
        long long size;
    };

    explicit ApplicationCacheHost(DocumentLoader&);
    ~ApplicationCacheHost();

    static URL createFileURL(const String&);

    void selectCacheWithoutManifest();
    void selectCacheWithManifest(const URL& manifestURL);

    bool canLoadMainResource(const ResourceRequest&);

    void maybeLoadMainResource(const ResourceRequest&, SubstituteData&);
    void maybeLoadMainResourceForRedirect(const ResourceRequest&, SubstituteData&);
    bool maybeLoadFallbackForMainResponse(const ResourceRequest&, const ResourceResponse&);
    void mainResourceDataReceived(const SharedBuffer&, long long encodedDataLength, bool allAtOnce);
    void finishedLoadingMainResource();
    void failedLoadingMainResource();

    WEBCORE_EXPORT bool maybeLoadResource(ResourceLoader&, const ResourceRequest&, const URL& originalURL);
    WEBCORE_EXPORT bool maybeLoadFallbackForRedirect(ResourceLoader*, ResourceRequest&, const ResourceResponse&);
    WEBCORE_EXPORT bool maybeLoadFallbackForResponse(ResourceLoader*, const ResourceResponse&);
    WEBCORE_EXPORT bool maybeLoadFallbackForError(ResourceLoader*, const ResourceError&);

    bool maybeLoadSynchronously(ResourceRequest&, ResourceError&, ResourceResponse&, RefPtr<SharedBuffer>&);
    void maybeLoadFallbackSynchronously(const ResourceRequest&, ResourceError&, ResourceResponse&, RefPtr<SharedBuffer>&);

    bool canCacheInBackForwardCache();

    Status status() const;
    bool update();
    bool swapCache();
    void abort();

    void setDOMApplicationCache(DOMApplicationCache*);
    void notifyDOMApplicationCache(const AtomString& eventType, int progressTotal, int progressDone);

    void stopLoadingInFrame(LocalFrame&);

    void stopDeferringEvents(); // Also raises the events that have been queued up.

    Vector<ResourceInfo> resourceList();
    CacheInfo applicationCacheInfo();

    bool shouldLoadResourceFromApplicationCache(const ResourceRequest&, RefPtr<ApplicationCacheResource>&);
    bool getApplicationCacheFallbackResource(const ResourceRequest&, RefPtr<ApplicationCacheResource>&, ApplicationCache* = nullptr);

private:
    friend class ApplicationCacheGroup;

    struct DeferredEvent {
        AtomString eventType;
        int progressTotal;
        int progressDone;
    };

    bool isApplicationCacheEnabled();
    bool isApplicationCacheBlockedForRequest(const ResourceRequest&);

    void dispatchDOMEvent(const AtomString& eventType, int progressTotal, int progressDone);

    bool scheduleLoadFallbackResourceFromApplicationCache(ResourceLoader*, ApplicationCache* = nullptr);
    void setCandidateApplicationCacheGroup(ApplicationCacheGroup*);
    ApplicationCacheGroup* candidateApplicationCacheGroup() const;
    void setApplicationCache(RefPtr<ApplicationCache>&&);
    ApplicationCache* applicationCache() const { return m_applicationCache.get(); }
    ApplicationCache* mainResourceApplicationCache() const { return m_mainResourceApplicationCache.get(); }
    bool maybeLoadFallbackForMainError(const ResourceRequest&, const ResourceError&);

    WeakPtr<DOMApplicationCache, WeakPtrImplWithEventTargetData> m_domApplicationCache;
    SingleThreadWeakRef<DocumentLoader> m_documentLoader;

    bool m_defersEvents { true }; // Events are deferred until after document onload.
    Vector<DeferredEvent> m_deferredEvents;

    // The application cache that the document loader is associated with (if any).
    RefPtr<ApplicationCache> m_applicationCache;

    // Before an application cache has finished loading, this will be the candidate application
    // group that the document loader is associated with.
    WeakPtr<ApplicationCacheGroup> m_candidateApplicationCacheGroup;

    // This is the application cache the main resource was loaded from (if any).
    RefPtr<ApplicationCache> m_mainResourceApplicationCache;
};

}  // namespace WebCore
