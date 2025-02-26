/*
 * Copyright (C) 2018-2022 Apple Inc. All rights reserved.
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

#include "FontDescription.h"
#include "SystemFontDatabase.h"
#include <pal/spi/cf/CoreTextSPI.h>
#include <wtf/HashMap.h>
#include <wtf/HashTraits.h>
#include <wtf/RobinHoodHashMap.h>
#include <wtf/text/AtomString.h>
#include <wtf/text/AtomStringHash.h>

namespace WebCore {

enum class SystemFontKind : uint8_t {
    SystemUI,
    UISerif,
    UIMonospace,
    UIRounded,
    TextStyle
};

class SystemFontDatabaseCoreText : public SystemFontDatabase {
public:
    struct CascadeListParameters {
        CascadeListParameters()
        {
        }

        CascadeListParameters(WTF::HashTableDeletedValueType)
            : fontName(WTF::HashTableDeletedValue)
        {
        }

        bool isHashTableDeletedValue() const
        {
            return fontName.isHashTableDeletedValue();
        }

        friend bool operator==(const CascadeListParameters&, const CascadeListParameters&) = default;

        struct Hash {
            static unsigned hash(const CascadeListParameters&);
            static bool equal(const CascadeListParameters& a, const CascadeListParameters& b) { return a == b; }
            static const bool safeToCompareToEmptyOrDeleted = true;
        };

        AtomString fontName;
        AtomString locale;
        CGFloat weight { 0 };
        CGFloat width { 0 };
        float size { 0 };
        AllowUserInstalledFonts allowUserInstalledFonts { AllowUserInstalledFonts::No };
        bool italic { false };
    };

    SystemFontDatabaseCoreText();
    static SystemFontDatabaseCoreText& forCurrentThread();

    std::optional<SystemFontKind> matchSystemFontUse(const AtomString& family);
    Vector<RetainPtr<CTFontDescriptorRef>> cascadeList(const FontDescription&, const AtomString& cssFamily, SystemFontKind, AllowUserInstalledFonts);

    String serifFamily(const String& locale);
    String sansSerifFamily(const String& locale);
    String cursiveFamily(const String& locale);
    String fantasyFamily(const String& locale);
    String monospaceFamily(const String& locale);

    const AtomString& systemFontShorthandFamily(FontShorthand);
    float systemFontShorthandSize(FontShorthand);
    FontSelectionValue systemFontShorthandWeight(FontShorthand);

    void clear();

private:
    friend class SystemFontDatabase;

    Vector<RetainPtr<CTFontDescriptorRef>> cascadeList(const CascadeListParameters&, SystemFontKind);

    RetainPtr<CTFontRef> createSystemUIFont(const CascadeListParameters&, CFStringRef locale);
    RetainPtr<CTFontRef> createSystemDesignFont(SystemFontKind, const CascadeListParameters&);
    RetainPtr<CTFontRef> createTextStyleFont(const CascadeListParameters&);

    static RetainPtr<CTFontDescriptorRef> smallCaptionFontDescriptor();
    static RetainPtr<CTFontDescriptorRef> menuFontDescriptor();
    static RetainPtr<CTFontDescriptorRef> statusBarFontDescriptor();
    static RetainPtr<CTFontDescriptorRef> miniControlFontDescriptor();
    static RetainPtr<CTFontDescriptorRef> smallControlFontDescriptor();
    static RetainPtr<CTFontDescriptorRef> controlFontDescriptor();

    static RetainPtr<CTFontRef> createFontByApplyingWeightWidthItalicsAndFallbackBehavior(CTFontRef, CGFloat weight, CGFloat width, bool italic, float size, AllowUserInstalledFonts, CFStringRef design = nullptr);
    static RetainPtr<CTFontDescriptorRef> removeCascadeList(CTFontDescriptorRef);
    static Vector<RetainPtr<CTFontDescriptorRef>> computeCascadeList(CTFontRef, CFStringRef locale);
    static CascadeListParameters systemFontParameters(const FontDescription&, const AtomString& familyName, SystemFontKind, AllowUserInstalledFonts);

    UncheckedKeyHashMap<CascadeListParameters, Vector<RetainPtr<CTFontDescriptorRef>>, CascadeListParameters::Hash, SimpleClassHashTraits<CascadeListParameters>> m_systemFontCache;

    MemoryCompactRobinHoodHashMap<String, String> m_serifFamilies;
    MemoryCompactRobinHoodHashMap<String, String> m_sansSeriferifFamilies;
    MemoryCompactRobinHoodHashMap<String, String> m_cursiveFamilies;
    MemoryCompactRobinHoodHashMap<String, String> m_fantasyFamilies;
    MemoryCompactRobinHoodHashMap<String, String> m_monospaceFamilies;

    Vector<AtomString> m_textStyles;
};

inline void add(Hasher& hasher, const SystemFontDatabaseCoreText::CascadeListParameters& parameters)
{
    add(hasher, parameters.fontName, parameters.locale, parameters.weight, parameters.width, parameters.size, parameters.allowUserInstalledFonts, parameters.italic);
}

inline unsigned SystemFontDatabaseCoreText::CascadeListParameters::Hash::hash(const CascadeListParameters& parameters)
{
    return computeHash(parameters);
}

} // namespace WebCore
