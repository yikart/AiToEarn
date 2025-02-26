/*
 * Copyright (C) 2017-2021 Apple Inc. All rights reserved.
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

#include "FontCascadeCache.h"
#include <CoreText/CoreText.h>
#include <wtf/HashMap.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

struct FontFamilySpecificationKey {
    RetainPtr<CTFontDescriptorRef> fontDescriptor;
    FontDescriptionKey fontDescriptionKey;

    FontFamilySpecificationKey() = default;

    FontFamilySpecificationKey(CTFontDescriptorRef fontDescriptor, const FontDescription& fontDescription)
        : fontDescriptor(fontDescriptor)
        , fontDescriptionKey(fontDescription)
    { }

    explicit FontFamilySpecificationKey(WTF::HashTableDeletedValueType deletedValue)
        : fontDescriptionKey(deletedValue)
    { }

    bool operator==(const FontFamilySpecificationKey& other) const
    {
        return safeCFEqual(fontDescriptor.get(), other.fontDescriptor.get()) && fontDescriptionKey == other.fontDescriptionKey;
    }

    bool isHashTableDeletedValue() const { return fontDescriptionKey.isHashTableDeletedValue(); }
};

inline void add(Hasher& hasher, const FontFamilySpecificationKey& key)
{
    // FIXME: Ideally, we wouldn't be hashing a hash.
    add(hasher, safeCFHash(key.fontDescriptor.get()), key.fontDescriptionKey);
}

struct FontFamilySpecificationKeyHash {
    static unsigned hash(const FontFamilySpecificationKey& key) { return computeHash(key); }
    static bool equal(const FontFamilySpecificationKey& a, const FontFamilySpecificationKey& b) { return a == b; }
    static const bool safeToCompareToEmptyOrDeleted = true;
};

class FontFamilySpecificationCoreTextCache {
    WTF_MAKE_TZONE_ALLOCATED(FontFamilySpecificationCoreTextCache);
    WTF_MAKE_NONCOPYABLE(FontFamilySpecificationCoreTextCache);
public:
    FontFamilySpecificationCoreTextCache() = default;

    static FontFamilySpecificationCoreTextCache& forCurrentThread();

    template<typename Functor> FontPlatformData& ensure(FontFamilySpecificationKey&&, Functor&&);
    void clear();

private:
    UncheckedKeyHashMap<FontFamilySpecificationKey, std::unique_ptr<FontPlatformData>, FontFamilySpecificationKeyHash, SimpleClassHashTraits<FontFamilySpecificationKey>> m_fonts;
};

template<typename Functor> FontPlatformData& FontFamilySpecificationCoreTextCache::ensure(FontFamilySpecificationKey&& key, Functor&& functor)
{
    auto& fontPlatformData = m_fonts.ensure(std::forward<FontFamilySpecificationKey>(key), std::forward<Functor>(functor)).iterator->value;
    ASSERT(fontPlatformData);
    return *fontPlatformData;
}

} // namespace WebCore
