/*
 * Copyright (C) 2005-2023 Apple Inc. All rights reserved.
 * Copyright (C) 2006 Alexey Proskuryakov
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer. 
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution. 
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission. 
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "TextFlags.h"
#include <wtf/HashMap.h>
#include <wtf/HashTraits.h>
#include <wtf/Hasher.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/text/AtomString.h>

namespace WebCore {

class Font;
class FontDescription;
enum class IsForPlatformFont : bool;
    
struct CharacterFallbackMapKey {
    AtomString locale;
    String string;
    bool isForPlatformFont { false };
    ResolvedEmojiPolicy resolvedEmojiPolicy { ResolvedEmojiPolicy::NoPreference };

    bool operator==(const CharacterFallbackMapKey& other) const = default;
};

inline void add(Hasher& hasher, const CharacterFallbackMapKey& key)
{
    add(hasher, key.locale, key.string, key.isForPlatformFont, key.resolvedEmojiPolicy);
}

struct CharacterFallbackMapKeyHash {
    static unsigned hash(const CharacterFallbackMapKey& key) { return computeHash(key); }
    static bool equal(const CharacterFallbackMapKey& a, const CharacterFallbackMapKey& b) { return a == b; }
    static const bool safeToCompareToEmptyOrDeleted = false;
};

class SystemFallbackFontCache {
    WTF_MAKE_TZONE_ALLOCATED(SystemFallbackFontCache);
    WTF_MAKE_NONCOPYABLE(SystemFallbackFontCache);
public:
    static SystemFallbackFontCache& forCurrentThread();
    static SystemFallbackFontCache* forCurrentThreadIfExists();

    SystemFallbackFontCache() = default;

    RefPtr<Font> systemFallbackFontForCharacterCluster(const Font*, StringView, const FontDescription&, ResolvedEmojiPolicy, IsForPlatformFont);
    void remove(Font*);

private:
    struct CharacterFallbackMapKeyHashTraits : SimpleClassHashTraits<CharacterFallbackMapKey> {
        static void constructDeletedValue(CharacterFallbackMapKey& slot) { new (NotNull, &slot) CharacterFallbackMapKey { { }, WTF::HashTableDeletedValue, { } }; }
        static bool isDeletedValue(const CharacterFallbackMapKey& key) { return key.string.isHashTableDeletedValue(); }
    };

    // Fonts are not ref'd to avoid cycles.
    // FIXME: Consider changing these maps to use WeakPtr instead of raw pointers.
    using CharacterFallbackMap = UncheckedKeyHashMap<CharacterFallbackMapKey, Font*, CharacterFallbackMapKeyHash, CharacterFallbackMapKeyHashTraits>;

    UncheckedKeyHashMap<const Font*, CharacterFallbackMap> m_characterFallbackMaps;
};

} // namespace WebCore
