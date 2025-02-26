/*
 * Copyright (C) 2006-2023 Apple Inc. All rights reserved.
 * Copyright (C) 2007-2008 Torch Mobile, Inc.
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

#include "FontCascadeCache.h"
#include "FontCreationContext.h"
#include "FontDescription.h"
#include "FontPlatformData.h"
#include "FontSelector.h"
#include "FontTaggedSettings.h"
#include "SystemFallbackFontCache.h"
#include "Timer.h"
#include <array>
#include <limits.h>
#include <wtf/CheckedPtr.h>
#include <wtf/CrossThreadCopier.h>
#include <wtf/Forward.h>
#include <wtf/HashFunctions.h>
#include <wtf/HashTraits.h>
#include <wtf/ListHashSet.h>
#include <wtf/PointerComparison.h>
#include <wtf/RefPtr.h>
#include <wtf/RobinHoodHashSet.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/UniqueRef.h>
#include <wtf/Vector.h>
#include <wtf/WorkQueue.h>
#include <wtf/text/AtomStringHash.h>
#include <wtf/text/WTFString.h>

#if PLATFORM(COCOA)
#include "FontCacheCoreText.h"
#include "FontDatabase.h"
#include "FontFamilySpecificationCoreTextCache.h"
#include "SystemFontDatabaseCoreText.h"
#endif

#if PLATFORM(IOS_FAMILY)
#include <wtf/Lock.h>
#include <wtf/RecursiveLockAdapter.h>
#endif

#if OS(WINDOWS)
#include <windows.h>
#include <objidl.h>
#include <mlang.h>
struct IDWriteFactory;
struct IDWriteFontCollection;
#endif

#if USE(FREETYPE)
#include "FontSetCache.h"
#endif

#if USE(SKIA)
#include "SkiaHarfBuzzFontCache.h"
#include <skia/core/SkFontMgr.h>
#endif

namespace WebCore {

class Font;
class FontCascade;
class OpenTypeVerticalData;

enum class IsForPlatformFont : bool;

#if PLATFORM(WIN) && USE(IMLANG_FONT_LINK2)
using IMLangFontLinkType = IMLangFontLink2;
#endif

#if PLATFORM(WIN) && !USE(IMLANG_FONT_LINK2)
using IMLangFontLinkType = IMLangFontLink;
#endif

struct FontCachePrewarmInformation {
    Vector<String> seenFamilies;
    Vector<String> fontNamesRequiringSystemFallback;

    bool isEmpty() const;
    FontCachePrewarmInformation isolatedCopy() const & { return { crossThreadCopy(seenFamilies), crossThreadCopy(fontNamesRequiringSystemFallback) }; }
    FontCachePrewarmInformation isolatedCopy() && { return { crossThreadCopy(WTFMove(seenFamilies)), crossThreadCopy(WTFMove(fontNamesRequiringSystemFallback)) }; }
};

enum class FontLookupOptions : uint8_t {
    ExactFamilyNameMatch     = 1 << 0,
    DisallowBoldSynthesis    = 1 << 1,
    DisallowObliqueSynthesis = 1 << 2,
};

class FontCache : public CanMakeCheckedPtr<FontCache> {
    WTF_MAKE_TZONE_ALLOCATED(FontCache);
    WTF_MAKE_NONCOPYABLE(FontCache);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(FontCache);
public:
    WEBCORE_EXPORT static FontCache& forCurrentThread();
    static FontCache* forCurrentThreadIfExists();
    static FontCache* forCurrentThreadIfNotDestroyed();

    FontCache();
    ~FontCache();

    // These methods are implemented by the platform.
    enum class PreferColoredFont : bool { No, Yes };
    RefPtr<Font> systemFallbackForCharacterCluster(const FontDescription&, const Font& originalFontData, IsForPlatformFont, PreferColoredFont, StringView);
    Vector<String> systemFontFamilies();
    void platformInit();

    static bool isSystemFontForbiddenForEditing(const String&);

#if PLATFORM(COCOA)
    WEBCORE_EXPORT static void setFontAllowlist(const Vector<String>&);
#endif

#if PLATFORM(WIN)
    IMLangFontLinkType* getFontLinkInterface();
    static void comInitialize();
    static void comUninitialize();
    static IMultiLanguage* getMultiLanguageInterface();
#endif

    // This function exists so CSSFontSelector can have a unified notion of preinstalled fonts and @font-face.
    // It comes into play when you create an @font-face which shares a family name as a preinstalled font.
    Vector<FontSelectionCapabilities> getFontSelectionCapabilitiesInFamily(const AtomString&, AllowUserInstalledFonts);

    WEBCORE_EXPORT RefPtr<Font> fontForFamily(const FontDescription&, const String&, const FontCreationContext& = { }, OptionSet<FontLookupOptions> = { });
    WEBCORE_EXPORT Ref<Font> lastResortFallbackFont(const FontDescription&);
    WEBCORE_EXPORT Ref<Font> fontForPlatformData(const FontPlatformData&);
    RefPtr<Font> similarFont(const FontDescription&, const String& family);

    void addClient(FontSelector&);
    void removeClient(FontSelector&);

    unsigned short generation() const { return m_generation; }
    static void registerFontCacheInvalidationCallback(Function<void()>&&);

    // The invalidation callback runs a style recalc on the page.
    // If we're invalidating because of memory pressure, we shouldn't run a style recalc.
    // A style recalc would just allocate a bunch of the memory that we're trying to release.
    // On the other hand, if we're invalidating because the set of installed fonts changed,
    // or if some accessibility text settings were altered, we should run a style recalc
    // so the user can immediately see the effect of the new environment.
    enum class ShouldRunInvalidationCallback : bool { No, Yes };
    WEBCORE_EXPORT static void invalidateAllFontCaches(ShouldRunInvalidationCallback = ShouldRunInvalidationCallback::Yes);

    WEBCORE_EXPORT size_t fontCount();
    WEBCORE_EXPORT size_t inactiveFontCount();
    WEBCORE_EXPORT void purgeInactiveFontData(unsigned count = UINT_MAX);
    void platformPurgeInactiveFontData();

    static void releaseNoncriticalMemoryInAllFontCaches();

    void updateFontCascade(const FontCascade&, RefPtr<FontSelector>&&);

#if PLATFORM(WIN)
    RefPtr<Font> fontFromDescriptionAndLogFont(const FontDescription&, const LOGFONT&, String& outFontFamilyName);
#endif

#if ENABLE(OPENTYPE_VERTICAL)
    RefPtr<OpenTypeVerticalData> verticalData(const FontPlatformData&);
#endif

    std::unique_ptr<FontPlatformData> createFontPlatformDataForTesting(const FontDescription&, const AtomString& family);

    using PrewarmInformation = FontCachePrewarmInformation;

    PrewarmInformation collectPrewarmInformation() const;
    void prewarm(PrewarmInformation&&);
    static void prewarmGlobally();

    FontCascadeCache& fontCascadeCache() { return m_fontCascadeCache; }
    SystemFallbackFontCache& systemFallbackFontCache() { return m_systemFallbackFontCache; }
#if PLATFORM(COCOA)
    FontFamilySpecificationCoreTextCache& fontFamilySpecificationCoreTextCache() { return m_fontFamilySpecificationCoreTextCache; }
    SystemFontDatabaseCoreText& systemFontDatabaseCoreText() { return m_systemFontDatabaseCoreText; }
#endif

    bool useBackslashAsYenSignForFamily(const AtomString& family);

#if USE(FREETYPE)
    static bool configurePatternForFontDescription(FcPattern*, const FontDescription&);
#endif

#if USE(SKIA)
    static Vector<hb_feature_t> computeFeatures(const FontDescription&, const FontCreationContext&);
    WEBCORE_EXPORT SkFontMgr& fontManager() const;
    SkiaHarfBuzzFontCache& harfBuzzFontCache() { return m_harfBuzzFontCache; }
#endif

    void invalidate();

private:
    void releaseNoncriticalMemory();
    void platformReleaseNoncriticalMemory();
    void platformInvalidate();
    WEBCORE_EXPORT void purgeInactiveFontDataIfNeeded();

    FontPlatformData* cachedFontPlatformData(const FontDescription&, const String& family, const FontCreationContext& = { }, OptionSet<FontLookupOptions> = { });

    // These functions are implemented by each platform (unclear which functions this comment applies to).
    WEBCORE_EXPORT std::unique_ptr<FontPlatformData> createFontPlatformData(const FontDescription&, const AtomString& family, const FontCreationContext&, OptionSet<FontLookupOptions>);

    static std::optional<ASCIILiteral> alternateFamilyName(const String&);
    static std::optional<ASCIILiteral> platformAlternateFamilyName(const String&);

#if PLATFORM(MAC)
    bool shouldAutoActivateFontIfNeeded(const AtomString& family);
#endif

#if PLATFORM(COCOA)
    FontDatabase& database(AllowUserInstalledFonts);
#endif

    Timer m_purgeTimer;

    WeakHashSet<FontSelector> m_clients;
    struct FontDataCaches;
    UniqueRef<FontDataCaches> m_fontDataCaches;
    FontCascadeCache m_fontCascadeCache;
    SystemFallbackFontCache m_systemFallbackFontCache;
    MemoryCompactLookupOnlyRobinHoodHashSet<AtomString> m_familiesUsingBackslashAsYenSign;

    unsigned short m_generation { 0 };

#if PLATFORM(IOS_FAMILY)
    RecursiveLock m_fontLock;
#endif

#if PLATFORM(MAC)
    HashSet<AtomString> m_knownFamilies;
#endif

#if PLATFORM(COCOA)
    FontDatabase m_databaseAllowingUserInstalledFonts { AllowUserInstalledFonts::Yes };
    FontDatabase m_databaseDisallowingUserInstalledFonts { AllowUserInstalledFonts::No };

    using FallbackFontSet = HashSet<RetainPtr<CTFontRef>, WTF::RetainPtrObjectHash<CTFontRef>, WTF::RetainPtrObjectHashTraits<CTFontRef>>;
    FallbackFontSet m_fallbackFonts;

    ListHashSet<String> m_seenFamiliesForPrewarming;
    ListHashSet<String> m_fontNamesRequiringSystemFallbackForPrewarming;
    RefPtr<WorkQueue> m_prewarmQueue;

    FontFamilySpecificationCoreTextCache m_fontFamilySpecificationCoreTextCache;
    SystemFontDatabaseCoreText m_systemFontDatabaseCoreText;

    friend class ComplexTextController;
#endif

#if USE(FREETYPE)
    FontSetCache m_fontSetCache;
#endif

#if USE(SKIA)
    mutable sk_sp<SkFontMgr> m_fontManager;
    SkiaHarfBuzzFontCache m_harfBuzzFontCache;
#endif

#if PLATFORM(WIN) && USE(SKIA)
    struct CreateDWriteFactoryResult {
        COMPtr<IDWriteFactory> factory;
        COMPtr<IDWriteFontCollection> fontCollection;
    };
    static CreateDWriteFactoryResult createDWriteFactory();
#endif

    friend class Font;
};

inline std::unique_ptr<FontPlatformData> FontCache::createFontPlatformDataForTesting(const FontDescription& fontDescription, const AtomString& family)
{
    return createFontPlatformData(fontDescription, family, { }, FontLookupOptions::ExactFamilyNameMatch);
}

#if !PLATFORM(COCOA) && !USE(FREETYPE) && !USE(SKIA)

inline void FontCache::platformPurgeInactiveFontData()
{
}

#endif

inline bool FontCachePrewarmInformation::isEmpty() const
{
    return seenFamilies.isEmpty() && fontNamesRequiringSystemFallback.isEmpty();
}

}
