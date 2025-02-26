/*
 * Copyright (C) 2013, 2014 Apple Inc. All rights reserved.
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

#if HAVE(IOSURFACE)

#include "IOSurface.h"
#include "IntSize.h"
#include "IntSizeHash.h"
#include "Timer.h"
#include <wtf/Deque.h>
#include <wtf/HashMap.h>
#include <wtf/Lock.h>
#include <wtf/NeverDestroyed.h>
#include <wtf/RunLoop.h>
#include <wtf/StdLibExtras.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/ThreadSafeRefCounted.h>

namespace WebCore {

class DestinatationColorSpace;

class IOSurfacePool : public ThreadSafeRefCounted<IOSurfacePool> {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(IOSurfacePool, WEBCORE_EXPORT);
    WTF_MAKE_NONCOPYABLE(IOSurfacePool);
    friend class LazyNeverDestroyed<IOSurfacePool>;

public:
    WEBCORE_EXPORT static IOSurfacePool& sharedPoolSingleton();
    WEBCORE_EXPORT static Ref<IOSurfacePool> create();

    WEBCORE_EXPORT ~IOSurfacePool();

    std::unique_ptr<IOSurface> takeSurface(IntSize, const DestinationColorSpace&, IOSurface::Format);
    WEBCORE_EXPORT void addSurface(std::unique_ptr<IOSurface>&&);

    WEBCORE_EXPORT void discardAllSurfaces();

    WEBCORE_EXPORT void setPoolSize(size_t);

private:
    IOSurfacePool();

    struct CachedSurfaceDetails {
        CachedSurfaceDetails()
            : hasMarkedPurgeable(false)
        { }

        void resetLastUseTime() { lastUseTime = MonotonicTime::now(); }

        MonotonicTime lastUseTime;
        bool hasMarkedPurgeable;
    };

    typedef Deque<std::unique_ptr<IOSurface>> CachedSurfaceQueue;
    typedef UncheckedKeyHashMap<IntSize, CachedSurfaceQueue> CachedSurfaceMap;
    typedef UncheckedKeyHashMap<IOSurface*, CachedSurfaceDetails> CachedSurfaceDetailsMap;

#if PLATFORM(MAC)
    static constexpr size_t defaultMaximumBytesCached { 256 * MB };
#else
    static constexpr size_t defaultMaximumBytesCached { 64 * MB };
#endif

    // We'll never allow more than 1/2 of the cache to be filled with in-use surfaces, because
    // they can't be immediately returned when requested (but will be freed up in the future).
    static constexpr size_t maximumInUseBytes = defaultMaximumBytesCached / 2;
    
    bool shouldCacheSurface(const IOSurface&) const WTF_REQUIRES_LOCK(m_lock);

    void willAddSurface(IOSurface&, bool inUse) WTF_REQUIRES_LOCK(m_lock);
    void didRemoveSurface(IOSurface&, bool inUse) WTF_REQUIRES_LOCK(m_lock);
    void didUseSurfaceOfSize(IntSize) WTF_REQUIRES_LOCK(m_lock);

    void insertSurfaceIntoPool(std::unique_ptr<IOSurface>) WTF_REQUIRES_LOCK(m_lock);

    void evict(size_t additionalSize) WTF_REQUIRES_LOCK(m_lock);
    void tryEvictInUseSurface() WTF_REQUIRES_LOCK(m_lock);
    void tryEvictOldestCachedSurface() WTF_REQUIRES_LOCK(m_lock);

    void scheduleCollectionTimer() WTF_REQUIRES_LOCK(m_lock);
    void collectionTimerFired();
    void collectInUseSurfaces() WTF_REQUIRES_LOCK(m_lock);
    bool markOlderSurfacesPurgeable() WTF_REQUIRES_LOCK(m_lock);

    void platformGarbageCollectNow();

    void discardAllSurfacesInternal() WTF_REQUIRES_LOCK(m_lock);

    String poolStatistics() const WTF_REQUIRES_LOCK(m_lock);

    Lock m_lock;
    RunLoop::Timer m_collectionTimer WTF_GUARDED_BY_LOCK(m_lock);
    CachedSurfaceMap m_cachedSurfaces WTF_GUARDED_BY_LOCK(m_lock);
    CachedSurfaceQueue m_inUseSurfaces WTF_GUARDED_BY_LOCK(m_lock);
    CachedSurfaceDetailsMap m_surfaceDetails WTF_GUARDED_BY_LOCK(m_lock);
    Vector<IntSize> m_sizesInPruneOrder WTF_GUARDED_BY_LOCK(m_lock);

    size_t m_bytesCached WTF_GUARDED_BY_LOCK(m_lock) { 0 };
    size_t m_inUseBytesCached WTF_GUARDED_BY_LOCK(m_lock) { 0 };
    size_t m_maximumBytesCached WTF_GUARDED_BY_LOCK(m_lock) { defaultMaximumBytesCached };
};

}
#endif // HAVE(IOSURFACE)
