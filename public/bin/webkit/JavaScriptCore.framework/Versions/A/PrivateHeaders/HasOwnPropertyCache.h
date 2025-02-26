/*
 * Copyright (C) 2016 Apple Inc. All rights reserved.
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

#include "JSObject.h"
#include "PropertySlot.h"
#include "Structure.h"
#include <wtf/UniqueRef.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(HasOwnPropertyCache);

class alignas(8) HasOwnPropertyCache {
    static const uint32_t size = 2 * 1024;
    static_assert(hasOneBitSet(size), "size should be a power of two.");
public:
    static const uint32_t mask = size - 1;

    struct Entry {
        static constexpr ptrdiff_t offsetOfStructureID() { return OBJECT_OFFSETOF(Entry, structureID); }
        static constexpr ptrdiff_t offsetOfImpl() { return OBJECT_OFFSETOF(Entry, impl); }
        static constexpr ptrdiff_t offsetOfResult() { return OBJECT_OFFSETOF(Entry, result); }

        RefPtr<UniquedStringImpl> impl;
        StructureID structureID;
        bool result { false };
    };

    HasOwnPropertyCache() = delete;

    void operator delete(void* cache)
    {
        static_cast<HasOwnPropertyCache*>(cache)->clear();
        HasOwnPropertyCacheMalloc::free(cache);
    }

    static UniqueRef<HasOwnPropertyCache> create()
    {
        size_t allocationSize = sizeof(Entry) * size;
        HasOwnPropertyCache* result = static_cast<HasOwnPropertyCache*>(HasOwnPropertyCacheMalloc::malloc(allocationSize));
        result->clearBuffer();
        return UniqueRef { *result };
    }

    ALWAYS_INLINE static uint32_t hash(StructureID structureID, UniquedStringImpl* impl)
    {
        return std::bit_cast<uint32_t>(structureID) + impl->hash();
    }

    ALWAYS_INLINE std::optional<bool> get(Structure* structure, PropertyName propName)
    {
        UniquedStringImpl* impl = propName.uid();
        StructureID id = structure->id();
        uint32_t index = HasOwnPropertyCache::hash(id, impl) & mask;
        Entry& entry = std::bit_cast<Entry*>(this)[index];
        if (entry.structureID == id && entry.impl.get() == impl)
            return entry.result;
        return std::nullopt;
    }

    ALWAYS_INLINE void tryAdd(PropertySlot& slot, JSObject* object, PropertyName propName, bool result)
    {
        if (parseIndex(propName))
            return;

        if (!slot.isCacheable() && !slot.isUnset())
            return;

        if (object->type() == GlobalProxyType)
            return;

        Structure* structure = object->structure();
        if (!structure->typeInfo().prohibitsPropertyCaching()
            && structure->propertyAccessesAreCacheable()
            && (!slot.isUnset() || structure->propertyAccessesAreCacheableForAbsence())) {
            if (structure->isDictionary()) {
                // FIXME: We should be able to flatten a dictionary object again.
                // https://bugs.webkit.org/show_bug.cgi?id=163092
                return;
            }

            ASSERT(!result == slot.isUnset());

            UniquedStringImpl* impl = propName.uid();
            StructureID id = structure->id();
            uint32_t index = HasOwnPropertyCache::hash(id, impl) & mask;
            std::bit_cast<Entry*>(this)[index] = Entry { RefPtr<UniquedStringImpl>(impl), id, result };
        }
    }

    void clear()
    {
        Entry* buffer = std::bit_cast<Entry*>(this);
        for (uint32_t i = 0; i < size; ++i)
            buffer[i].Entry::~Entry();

        clearBuffer();
    }

private:
    void clearBuffer()
    {
        Entry* buffer = std::bit_cast<Entry*>(this);
        for (uint32_t i = 0; i < size; ++i)
            new (&buffer[i]) Entry();
    }
};

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
