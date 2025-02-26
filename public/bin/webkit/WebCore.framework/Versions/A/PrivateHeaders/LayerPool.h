/*
 * Copyright (C) 2012, 2014 Apple Inc. All rights reserved.
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

#ifndef LayerPool_h
#define LayerPool_h

#include "IntSize.h"
#include "IntSizeHash.h"
#include "PlatformCALayer.h"
#include "Timer.h"
#include <wtf/CheckedPtr.h>
#include <wtf/Deque.h>
#include <wtf/HashMap.h>
#include <wtf/RetainPtr.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>

namespace WebCore {
    
class LayerPool final : public CanMakeCheckedPtr<LayerPool> {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(LayerPool, WEBCORE_EXPORT);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(LayerPool);
    WTF_MAKE_NONCOPYABLE(LayerPool);
public:
    WEBCORE_EXPORT LayerPool();
    WEBCORE_EXPORT ~LayerPool();

    static HashSet<CheckedPtr<LayerPool>>& allLayerPools();
    
    void addLayer(const RefPtr<PlatformCALayer>&);
    RefPtr<PlatformCALayer> takeLayerWithSize(const IntSize&);

    void drain();

    // The maximum size of all queued layers in bytes.
    unsigned capacity() const { return m_maxBytesForPool; }

private:
    typedef Deque<RefPtr<PlatformCALayer>> LayerList;

    unsigned decayedCapacity() const;

    bool canReuseLayerWithSize(const IntSize& size) const { return m_maxBytesForPool && !size.isEmpty(); }
    void schedulePrune();
    void pruneTimerFired();

    typedef enum { LeaveUnchanged, MarkAsUsed } AccessType;
    LayerList& listOfLayersWithSize(const IntSize&, AccessType = LeaveUnchanged);

    static unsigned backingStoreBytesForSize(const IntSize&);

    UncheckedKeyHashMap<IntSize, LayerList> m_reuseLists;
    // Ordered by recent use. The last size is the most recently used.
    Vector<IntSize> m_sizesInPruneOrder;
    unsigned m_totalBytes { 0 };
    unsigned m_maxBytesForPool;

    Timer m_pruneTimer;

    MonotonicTime m_lastAddTime;
};

}

#endif
