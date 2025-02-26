/*
 * Copyright (C) 2023 Apple Inc. All rights reserved.
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

#include "Structure.h"
#include <wtf/TZoneMalloc.h>

namespace JSC {

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(MegamorphicCache);

class MegamorphicCache {
    WTF_MAKE_TZONE_ALLOCATED(MegamorphicCache);
    WTF_MAKE_NONCOPYABLE(MegamorphicCache);
public:
    static constexpr uint32_t loadCachePrimarySize = 2048;
    static constexpr uint32_t loadCacheSecondarySize = 512;
    static_assert(hasOneBitSet(loadCachePrimarySize), "size should be a power of two.");
    static_assert(hasOneBitSet(loadCacheSecondarySize), "size should be a power of two.");
    static constexpr uint32_t loadCachePrimaryMask = loadCachePrimarySize - 1;
    static constexpr uint32_t loadCacheSecondaryMask = loadCacheSecondarySize - 1;

    static constexpr uint32_t storeCachePrimarySize = 2048;
    static constexpr uint32_t storeCacheSecondarySize = 512;
    static_assert(hasOneBitSet(storeCachePrimarySize), "size should be a power of two.");
    static_assert(hasOneBitSet(storeCacheSecondarySize), "size should be a power of two.");
    static constexpr uint32_t storeCachePrimaryMask = storeCachePrimarySize - 1;
    static constexpr uint32_t storeCacheSecondaryMask = storeCacheSecondarySize - 1;

    static constexpr uint32_t hasCachePrimarySize = 512;
    static constexpr uint32_t hasCacheSecondarySize = 128;
    static_assert(hasOneBitSet(hasCachePrimarySize), "size should be a power of two.");
    static_assert(hasOneBitSet(hasCacheSecondarySize), "size should be a power of two.");
    static constexpr uint32_t hasCachePrimaryMask = hasCachePrimarySize - 1;
    static constexpr uint32_t hasCacheSecondaryMask = hasCacheSecondarySize - 1;

    static constexpr uint16_t invalidEpoch = 0;
    static constexpr PropertyOffset maxOffset = UINT16_MAX;

    struct LoadEntry {
        static constexpr ptrdiff_t offsetOfUid() { return OBJECT_OFFSETOF(LoadEntry, m_uid); }
        static constexpr ptrdiff_t offsetOfStructureID() { return OBJECT_OFFSETOF(LoadEntry, m_structureID); }
        static constexpr ptrdiff_t offsetOfEpoch() { return OBJECT_OFFSETOF(LoadEntry, m_epoch); }
        static constexpr ptrdiff_t offsetOfOffset() { return OBJECT_OFFSETOF(LoadEntry, m_offset); }
        static constexpr ptrdiff_t offsetOfHolder() { return OBJECT_OFFSETOF(LoadEntry, m_holder); }

        void initAsMiss(StructureID structureID, UniquedStringImpl* uid, uint16_t epoch)
        {
            m_uid = uid;
            m_structureID = structureID;
            m_epoch = epoch;
            m_offset = 0;
            m_holder = nullptr;
        }

        void initAsHit(StructureID structureID, UniquedStringImpl* uid, uint16_t epoch, JSCell* holder, uint16_t offset, bool ownProperty)
        {
            m_uid = uid;
            m_structureID = structureID;
            m_epoch = epoch;
            m_offset = offset;
            m_holder = (ownProperty) ? JSCell::seenMultipleCalleeObjects() : holder;
        }

        RefPtr<UniquedStringImpl> m_uid;
        StructureID m_structureID { };
        uint16_t m_epoch { invalidEpoch };
        uint16_t m_offset { 0 };
        JSCell* m_holder { nullptr };
    };

    struct StoreEntry {
        static constexpr ptrdiff_t offsetOfUid() { return OBJECT_OFFSETOF(StoreEntry, m_uid); }
        static constexpr ptrdiff_t offsetOfOldStructureID() { return OBJECT_OFFSETOF(StoreEntry, m_oldStructureID); }
        static constexpr ptrdiff_t offsetOfNewStructureID() { return OBJECT_OFFSETOF(StoreEntry, m_newStructureID); }
        static constexpr ptrdiff_t offsetOfEpoch() { return OBJECT_OFFSETOF(StoreEntry, m_epoch); }
        static constexpr ptrdiff_t offsetOfOffset() { return OBJECT_OFFSETOF(StoreEntry, m_offset); }
        static constexpr ptrdiff_t offsetOfReallocating() { return OBJECT_OFFSETOF(StoreEntry, m_reallocating); }

        void init(StructureID oldStructureID, StructureID newStructureID, UniquedStringImpl* uid, uint16_t epoch, uint16_t offset, bool reallocating)
        {
            m_uid = uid;
            m_oldStructureID = oldStructureID;
            m_newStructureID = newStructureID;
            m_epoch = epoch;
            m_offset = offset;
            m_reallocating = reallocating;
        }

        RefPtr<UniquedStringImpl> m_uid;
        StructureID m_oldStructureID { };
        StructureID m_newStructureID { };
        uint16_t m_epoch { invalidEpoch };
        uint16_t m_offset { 0 };
        uint8_t m_reallocating { 0 };
    };

    struct HasEntry {
        static constexpr ptrdiff_t offsetOfUid() { return OBJECT_OFFSETOF(HasEntry, m_uid); }
        static constexpr ptrdiff_t offsetOfStructureID() { return OBJECT_OFFSETOF(HasEntry, m_structureID); }
        static constexpr ptrdiff_t offsetOfEpoch() { return OBJECT_OFFSETOF(HasEntry, m_epoch); }
        static constexpr ptrdiff_t offsetOfResult() { return OBJECT_OFFSETOF(HasEntry, m_result); }

        void init(StructureID structureID, UniquedStringImpl* uid, uint16_t epoch, bool result)
        {
            m_uid = uid;
            m_structureID = structureID;
            m_epoch = epoch;
            m_result = !!result;
        }

        RefPtr<UniquedStringImpl> m_uid;
        StructureID m_structureID { };
        uint16_t m_epoch { invalidEpoch };
        uint16_t m_result { false };
    };

    static constexpr ptrdiff_t offsetOfLoadCachePrimaryEntries() { return OBJECT_OFFSETOF(MegamorphicCache, m_loadCachePrimaryEntries); }
    static constexpr ptrdiff_t offsetOfLoadCacheSecondaryEntries() { return OBJECT_OFFSETOF(MegamorphicCache, m_loadCacheSecondaryEntries); }

    static constexpr ptrdiff_t offsetOfStoreCachePrimaryEntries() { return OBJECT_OFFSETOF(MegamorphicCache, m_storeCachePrimaryEntries); }
    static constexpr ptrdiff_t offsetOfStoreCacheSecondaryEntries() { return OBJECT_OFFSETOF(MegamorphicCache, m_storeCacheSecondaryEntries); }

    static constexpr ptrdiff_t offsetOfHasCachePrimaryEntries() { return OBJECT_OFFSETOF(MegamorphicCache, m_hasCachePrimaryEntries); }
    static constexpr ptrdiff_t offsetOfHasCacheSecondaryEntries() { return OBJECT_OFFSETOF(MegamorphicCache, m_hasCacheSecondaryEntries); }

    static constexpr ptrdiff_t offsetOfEpoch() { return OBJECT_OFFSETOF(MegamorphicCache, m_epoch); }

    MegamorphicCache() = default;

#if CPU(ADDRESS64) && !ENABLE(STRUCTURE_ID_WITH_SHIFT)
    // Because Structure is allocated with 16-byte alignment, we should assume that StructureID's lower 4 bits are zeros.
    static constexpr unsigned structureIDHashShift1 = 4;
#else
    // When using STRUCTURE_ID_WITH_SHIFT, all bits can be different. Thus we do not need to shift the first level.
    static constexpr unsigned structureIDHashShift1 = 0;
#endif
    static constexpr unsigned structureIDHashShift2 = structureIDHashShift1 + 11;
    static constexpr unsigned structureIDHashShift3 = structureIDHashShift1 + 9;

    static constexpr unsigned structureIDHashShift4 = structureIDHashShift1 + 11;
    static constexpr unsigned structureIDHashShift5 = structureIDHashShift1 + 9;

    static constexpr unsigned structureIDHashShift6 = structureIDHashShift1 + 9;
    static constexpr unsigned structureIDHashShift7 = structureIDHashShift1 + 7;

    ALWAYS_INLINE static uint32_t primaryHash(StructureID structureID, UniquedStringImpl* uid)
    {
        uint32_t sid = std::bit_cast<uint32_t>(structureID);
        return ((sid >> structureIDHashShift1) ^ (sid >> structureIDHashShift2)) + uid->hash();
    }

    ALWAYS_INLINE static uint32_t secondaryHash(StructureID structureID, UniquedStringImpl* uid)
    {
        uint32_t key = std::bit_cast<uint32_t>(structureID) + static_cast<uint32_t>(std::bit_cast<uintptr_t>(uid));
        return key + (key >> structureIDHashShift3);
    }

    ALWAYS_INLINE static uint32_t storeCachePrimaryHash(StructureID structureID, UniquedStringImpl* uid)
    {
        uint32_t sid = std::bit_cast<uint32_t>(structureID);
        return ((sid >> structureIDHashShift1) ^ (sid >> structureIDHashShift4)) + uid->hash();
    }

    ALWAYS_INLINE static uint32_t storeCacheSecondaryHash(StructureID structureID, UniquedStringImpl* uid)
    {
        uint32_t key = std::bit_cast<uint32_t>(structureID) + static_cast<uint32_t>(std::bit_cast<uintptr_t>(uid));
        return key + (key >> structureIDHashShift5);
    }

    ALWAYS_INLINE static uint32_t hasCachePrimaryHash(StructureID structureID, UniquedStringImpl* uid)
    {
        uint32_t sid = std::bit_cast<uint32_t>(structureID);
        return ((sid >> structureIDHashShift1) ^ (sid >> structureIDHashShift6)) + uid->hash();
    }

    ALWAYS_INLINE static uint32_t hasCacheSecondaryHash(StructureID structureID, UniquedStringImpl* uid)
    {
        uint32_t key = std::bit_cast<uint32_t>(structureID) + static_cast<uint32_t>(std::bit_cast<uintptr_t>(uid));
        return key + (key >> structureIDHashShift7);
    }

    JS_EXPORT_PRIVATE void age(CollectionScope);

    void initAsMiss(StructureID structureID, UniquedStringImpl* uid)
    {
        uint32_t primaryIndex = MegamorphicCache::primaryHash(structureID, uid) & loadCachePrimaryMask;
        auto& entry = m_loadCachePrimaryEntries[primaryIndex];
        if (entry.m_epoch == m_epoch) {
            uint32_t secondaryIndex = MegamorphicCache::secondaryHash(entry.m_structureID, entry.m_uid.get()) & loadCacheSecondaryMask;
            m_loadCacheSecondaryEntries[secondaryIndex] = WTFMove(entry);
        }
        m_loadCachePrimaryEntries[primaryIndex].initAsMiss(structureID, uid, m_epoch);
    }

    void initAsHit(StructureID structureID, UniquedStringImpl* uid, JSCell* holder, uint16_t offset, bool ownProperty)
    {
        uint32_t primaryIndex = MegamorphicCache::primaryHash(structureID, uid) & loadCachePrimaryMask;
        auto& entry = m_loadCachePrimaryEntries[primaryIndex];
        if (entry.m_epoch == m_epoch) {
            uint32_t secondaryIndex = MegamorphicCache::secondaryHash(entry.m_structureID, entry.m_uid.get()) & loadCacheSecondaryMask;
            m_loadCacheSecondaryEntries[secondaryIndex] = WTFMove(entry);
        }
        m_loadCachePrimaryEntries[primaryIndex].initAsHit(structureID, uid, m_epoch, holder, offset, ownProperty);
    }

    void initAsTransition(StructureID oldStructureID, StructureID newStructureID, UniquedStringImpl* uid, uint16_t offset, bool reallocating)
    {
        uint32_t primaryIndex = MegamorphicCache::storeCachePrimaryHash(oldStructureID, uid) & storeCachePrimaryMask;
        auto& entry = m_storeCachePrimaryEntries[primaryIndex];
        if (entry.m_epoch == m_epoch) {
            uint32_t secondaryIndex = MegamorphicCache::storeCacheSecondaryHash(entry.m_oldStructureID, entry.m_uid.get()) & storeCacheSecondaryMask;
            m_storeCacheSecondaryEntries[secondaryIndex] = WTFMove(entry);
        }
        m_storeCachePrimaryEntries[primaryIndex].init(oldStructureID, newStructureID, uid, m_epoch, offset, reallocating);
    }

    void initAsReplace(StructureID structureID, UniquedStringImpl* uid, uint16_t offset)
    {
        uint32_t primaryIndex = MegamorphicCache::storeCachePrimaryHash(structureID, uid) & storeCachePrimaryMask;
        auto& entry = m_storeCachePrimaryEntries[primaryIndex];
        if (entry.m_epoch == m_epoch) {
            uint32_t secondaryIndex = MegamorphicCache::storeCacheSecondaryHash(entry.m_oldStructureID, entry.m_uid.get()) & storeCacheSecondaryMask;
            m_storeCacheSecondaryEntries[secondaryIndex] = WTFMove(entry);
        }
        m_storeCachePrimaryEntries[primaryIndex].init(structureID, structureID, uid, m_epoch, offset, false);
    }

    void initAsHasHit(StructureID structureID, UniquedStringImpl* uid)
    {
        uint32_t primaryIndex = MegamorphicCache::hasCachePrimaryHash(structureID, uid) & hasCachePrimaryMask;
        auto& entry = m_hasCachePrimaryEntries[primaryIndex];
        if (entry.m_epoch == m_epoch) {
            uint32_t secondaryIndex = MegamorphicCache::hasCacheSecondaryHash(entry.m_structureID, entry.m_uid.get()) & hasCacheSecondaryMask;
            m_hasCacheSecondaryEntries[secondaryIndex] = WTFMove(entry);
        }
        m_hasCachePrimaryEntries[primaryIndex].init(structureID, uid, m_epoch, true);
    }

    void initAsHasMiss(StructureID structureID, UniquedStringImpl* uid)
    {
        uint32_t primaryIndex = MegamorphicCache::hasCachePrimaryHash(structureID, uid) & hasCachePrimaryMask;
        auto& entry = m_hasCachePrimaryEntries[primaryIndex];
        if (entry.m_epoch == m_epoch) {
            uint32_t secondaryIndex = MegamorphicCache::hasCacheSecondaryHash(entry.m_structureID, entry.m_uid.get()) & hasCacheSecondaryMask;
            m_hasCacheSecondaryEntries[secondaryIndex] = WTFMove(entry);
        }
        m_hasCachePrimaryEntries[primaryIndex].init(structureID, uid, m_epoch, false);
    }

    uint16_t epoch() const { return m_epoch; }

    void bumpEpoch()
    {
        ++m_epoch;
        if (UNLIKELY(m_epoch == invalidEpoch))
            clearEntries();
    }

private:
    JS_EXPORT_PRIVATE void clearEntries();

    std::array<LoadEntry, loadCachePrimarySize> m_loadCachePrimaryEntries { };
    std::array<LoadEntry, loadCacheSecondarySize> m_loadCacheSecondaryEntries { };
    std::array<StoreEntry, storeCachePrimarySize> m_storeCachePrimaryEntries { };
    std::array<StoreEntry, storeCacheSecondarySize> m_storeCacheSecondaryEntries { };
    std::array<HasEntry, hasCachePrimarySize> m_hasCachePrimaryEntries { };
    std::array<HasEntry, hasCacheSecondarySize> m_hasCacheSecondaryEntries { };
    uint16_t m_epoch { 1 };
};

} // namespace JSC
