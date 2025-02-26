/*
 * Copyright (C) 2000 Lars Knoll (knoll@kde.org)
 *           (C) 2000 Antti Koivisto (koivisto@kde.org)
 *           (C) 2000 Dirk Mueller (mueller@kde.org)
 * Copyright (C) 2003-2021 Apple Inc. All rights reserved.
 * Copyright (C) 2007 Nicholas Shanks <webkit@nickshanks.com>
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Library General Public License
 * along with this library; see the file COPYING.LIB.  If not, write to
 * the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 * Boston, MA 02110-1301, USA.
 *
 */

#pragma once

#include "CSSValueKeywords.h"
#include "FontDescription.h"
#include <variant>
#include <wtf/RefCountedFixedVector.h>

#if PLATFORM(COCOA)
#include "FontFamilySpecificationCoreText.h"
#else
#include "FontFamilySpecificationNull.h"
#endif

namespace WTF {
class TextStream;
}

namespace WebCore {

#if PLATFORM(COCOA)
typedef FontFamilySpecificationCoreText FontFamilyPlatformSpecification;
#else
typedef FontFamilySpecificationNull FontFamilyPlatformSpecification;
#endif

typedef std::variant<AtomString, FontFamilyPlatformSpecification> FontFamilySpecification;

class Font;

class FontCascadeDescription : public FontDescription {
public:
    WEBCORE_EXPORT FontCascadeDescription();

    bool operator==(const FontCascadeDescription&) const;

    unsigned familyCount() const { return m_families->size(); }
    const AtomString& firstFamily() const { return familyAt(0); }
    const AtomString& familyAt(unsigned i) const { return m_families.get()[i]; }
    RefCountedFixedVector<AtomString>& families() const { return m_families.get(); }

    static bool familyNamesAreEqual(const AtomString&, const AtomString&);
    static unsigned familyNameHash(const AtomString&);
    static String foldedFamilyName(const String&);

    unsigned effectiveFamilyCount() const;
    FontFamilySpecification effectiveFamilyAt(unsigned) const;

    float specifiedSize() const { return m_specifiedSize; }
    bool isAbsoluteSize() const { return m_isAbsoluteSize; }
    FontSelectionValue lighterWeight() const { return lighterWeight(weight()); }
    FontSelectionValue bolderWeight() const { return bolderWeight(weight()); }
    static FontSelectionValue lighterWeight(FontSelectionValue);
    static FontSelectionValue bolderWeight(FontSelectionValue);

    // only use fixed default size when there is only one font family, and that family is "monospace"
    bool useFixedDefaultSize() const { return familyCount() == 1 && firstFamily() == monospaceFamily; }

    Kerning kerning() const { return static_cast<Kerning>(m_kerning); }
    unsigned keywordSize() const { return m_keywordSize; }
    CSSValueID keywordSizeAsIdentifier() const
    {
        CSSValueID identifier = m_keywordSize ? static_cast<CSSValueID>(CSSValueXxSmall + m_keywordSize - 1) : CSSValueInvalid;
        ASSERT(identifier == CSSValueInvalid || (identifier >= CSSValueXxSmall && identifier <= CSSValueXxxLarge));
        return identifier;
    }
    FontSmoothingMode fontSmoothing() const { return static_cast<FontSmoothingMode>(m_fontSmoothing); }
    FontSmoothingMode usedFontSmoothing() const;
    bool isSpecifiedFont() const { return m_isSpecifiedFont; }

    void setOneFamily(const AtomString& family) { ASSERT(m_families->size() == 1); m_families.get()[0] = family; }
    void setFamilies(const Vector<AtomString>& families) { m_families = RefCountedFixedVector<AtomString>::createFromVector(families); }
    void setFamilies(RefCountedFixedVector<AtomString>& families) { m_families = families; }
    void setSpecifiedSize(float s) { m_specifiedSize = clampToFloat(s); }
    void setIsAbsoluteSize(bool s) { m_isAbsoluteSize = s; }
    void setKerning(Kerning kerning) { m_kerning = static_cast<unsigned>(kerning); }
    void setKeywordSize(unsigned size)
    {
        ASSERT(size <= 8);
        m_keywordSize = size;
        ASSERT(m_keywordSize == size); // Make sure it fits in the bitfield.
    }
    void setKeywordSizeFromIdentifier(CSSValueID identifier)
    {
        ASSERT(!identifier || (identifier >= CSSValueXxSmall && identifier <= CSSValueXxxLarge));
        static_assert(CSSValueXxxLarge - CSSValueXxSmall + 1 == 8, "Maximum keyword size should be 8.");
        setKeywordSize(identifier ? identifier - CSSValueXxSmall + 1 : 0);
    }
    void setFontSmoothing(FontSmoothingMode smoothing) { m_fontSmoothing = static_cast<unsigned>(smoothing); }
    void setIsSpecifiedFont(bool isSpecifiedFont) { m_isSpecifiedFont = isSpecifiedFont; }

#if ENABLE(TEXT_AUTOSIZING)
    bool familiesEqualForTextAutoSizing(const FontCascadeDescription& other) const;

    bool equalForTextAutoSizing(const FontCascadeDescription& other) const
    {
        return familiesEqualForTextAutoSizing(other)
            && m_specifiedSize == other.m_specifiedSize
            && variantSettings() == other.variantSettings()
            && m_isAbsoluteSize == other.m_isAbsoluteSize;
    }
#endif

    WEBCORE_EXPORT void resolveFontSizeAdjustFromFontIfNeeded(const Font&);

    // Initial values for font properties.
    static std::optional<FontSelectionValue> initialItalic() { return std::nullopt; }
    static FontStyleAxis initialFontStyleAxis() { return FontStyleAxis::slnt; }
    static FontSelectionValue initialWeight() { return normalWeightValue(); }
    static FontSelectionValue initialWidth() { return normalWidthValue(); }
    static FontSmallCaps initialSmallCaps() { return FontSmallCaps::Off; }
    static Kerning initialKerning() { return Kerning::Auto; }
    static FontSmoothingMode initialFontSmoothing() { return FontSmoothingMode::AutoSmoothing; }
    static TextRenderingMode initialTextRenderingMode() { return TextRenderingMode::AutoTextRendering; }
    static FontSynthesisLonghandValue initialFontSynthesisWeight() { return FontSynthesisLonghandValue::Auto; }
    static FontSynthesisLonghandValue initialFontSynthesisStyle() { return FontSynthesisLonghandValue::Auto; }
    static FontSynthesisLonghandValue initialFontSynthesisSmallCaps() { return FontSynthesisLonghandValue::Auto; }
    static FontVariantPosition initialVariantPosition() { return FontVariantPosition::Normal; }
    static FontVariantCaps initialVariantCaps() { return FontVariantCaps::Normal; }
    static FontVariantAlternates initialVariantAlternates() { return FontVariantAlternates::Normal(); }
    static FontVariantEmoji initialVariantEmoji() { return FontVariantEmoji::Normal; }
    static FontOpticalSizing initialOpticalSizing() { return FontOpticalSizing::Enabled; }
    static const AtomString& initialSpecifiedLocale() { return nullAtom(); }
    static FontPalette initialFontPalette() { return { FontPalette::Type::Normal, nullAtom() }; }
    static FontSizeAdjust initialFontSizeAdjust() { return { FontSizeAdjust::Metric::ExHeight }; }
    static TextSpacingTrim initialTextSpacingTrim() { return { }; }
    static TextAutospace initialTextAutospace() { return { }; }

private:
    Ref<RefCountedFixedVector<AtomString>> m_families;

    // Specified CSS value. Independent of rendering issues such as integer rounding, minimum font sizes, and zooming.
    float m_specifiedSize { 0 };
    // Whether or not CSS specified an explicit size (logical sizes like "medium" don't count).
    unsigned m_isAbsoluteSize : 1;
    unsigned m_kerning : 2; // Kerning
    // We cache whether or not a font is currently represented by a CSS keyword (e.g., medium). If so,
    // then we can accurately translate across different generic families to adjust for different preference settings
    // (e.g., 13px monospace vs. 16px everything else). Sizes are 1-8 (like the HTML size values for <font>).
    unsigned m_keywordSize : 4;
    unsigned m_fontSmoothing : 2; // FontSmoothingMode
    // True if a web page specifies a non-generic font family as the first font family.
    unsigned m_isSpecifiedFont : 1;
};

inline bool FontCascadeDescription::operator==(const FontCascadeDescription& other) const
{
    return static_cast<const FontDescription&>(*this) == static_cast<const FontDescription&>(other)
        && m_families.get() == other.m_families.get()
        && m_specifiedSize == other.m_specifiedSize
        && m_isAbsoluteSize == other.m_isAbsoluteSize
        && m_kerning == other.m_kerning
        && m_keywordSize == other.m_keywordSize
        && m_fontSmoothing == other.m_fontSmoothing
        && m_isSpecifiedFont == other.m_isSpecifiedFont;
}

WTF::TextStream& operator<<(WTF::TextStream&, const FontCascadeDescription&);

}
