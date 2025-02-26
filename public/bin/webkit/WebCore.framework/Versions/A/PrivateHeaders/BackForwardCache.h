/*
 * Copyright (C) 2007, 2015 Apple Inc. All rights reserved.
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

#include "BackForwardItemIdentifier.h"
#include "HistoryItem.h"
#include <wtf/Forward.h>
#include <wtf/ListHashSet.h>
#include <wtf/Noncopyable.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class CachedPage;
class LocalFrame;
class Page;

enum class PruningReason { None, ProcessSuspended, MemoryPressure, ReachedMaxSize };

class BackForwardCache {
    WTF_MAKE_TZONE_ALLOCATED(BackForwardCache);
    WTF_MAKE_NONCOPYABLE(BackForwardCache);
public:
    // Function to obtain the global back/forward cache.
    WEBCORE_EXPORT static BackForwardCache& singleton();

    bool canCache(Page&) const;

    // Used when memory is low to prune some cached pages.
    WEBCORE_EXPORT void pruneToSizeNow(unsigned maxSize, PruningReason);
    WEBCORE_EXPORT void setMaxSize(unsigned); // number of pages to cache.
    unsigned maxSize() const { return m_maxSize; }

    WEBCORE_EXPORT std::unique_ptr<CachedPage> suspendPage(Page&);
    WEBCORE_EXPORT bool addIfCacheable(HistoryItem&, Page*); // Prunes if maxSize() is exceeded.
    WEBCORE_EXPORT void remove(BackForwardItemIdentifier);
    WEBCORE_EXPORT void remove(HistoryItem&);
    CachedPage* get(HistoryItem&, Page*);
    std::unique_ptr<CachedPage> take(HistoryItem&, Page*);

    void removeAllItemsForPage(Page&);

    WEBCORE_EXPORT void clearEntriesForOrigins(const HashSet<RefPtr<SecurityOrigin>>&);

    unsigned pageCount() const { return m_items.size(); }
    WEBCORE_EXPORT unsigned frameCount() const;

    void markPagesForDeviceOrPageScaleChanged(Page&);
    void markPagesForContentsSizeChanged(Page&);
#if ENABLE(VIDEO)
    void markPagesForCaptionPreferencesChanged();
#endif

    bool isInBackForwardCache(BackForwardItemIdentifier) const;
    bool hasCachedPageExpired(BackForwardItemIdentifier) const;

private:
    BackForwardCache();
    ~BackForwardCache() = delete; // Make sure nobody accidentally calls delete -- WebCore does not delete singletons.

    static bool canCachePageContainingThisFrame(LocalFrame&);

    enum class ForceSuspension : bool { No, Yes };
    std::unique_ptr<CachedPage> trySuspendPage(Page&, ForceSuspension);
    void prune(PruningReason);
    void dump() const;

    HashMap<BackForwardItemIdentifier, std::variant<PruningReason, UniqueRef<CachedPage>>> m_cachedPageMap;
    ListHashSet<BackForwardItemIdentifier> m_items;
    unsigned m_maxSize {0};

#if ASSERT_ENABLED
    bool m_isInRemoveAllItemsForPage { false };
#endif

    friend class WTF::NeverDestroyed<BackForwardCache>;
};

} // namespace WebCore
