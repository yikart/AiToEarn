/*
 * Copyright (C) 2006-2023 Apple Inc. All rights reserved.
 * Copyright (C) 2007-2008 Torch Mobile, Inc.
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

#include "FloatRect.h"
#include "FontMetrics.h"
#include "FontPlatformData.h"
#include "GlyphBuffer.h"
#include "GlyphMetricsMap.h"
#include "GlyphPage.h"
#include "RenderingResourceIdentifier.h"
#include <variant>
#include <wtf/BitVector.h>
#include <wtf/Hasher.h>
#include <wtf/WeakPtr.h>
#include <wtf/text/StringHash.h>

#if PLATFORM(COCOA)
#include <CoreFoundation/CoreFoundation.h>
#include <pal/cf/OTSVGTable.h>
#include <wtf/RetainPtr.h>
#endif

#if ENABLE(MATHML)
#include "OpenTypeMathData.h"
#endif

#if ENABLE(OPENTYPE_VERTICAL)
#include "OpenTypeVerticalData.h"
#endif

#if PLATFORM(WIN)
#include <usp10.h>
#endif

namespace WTF {
class TextStream;
}

namespace WebCore {

class FontCache;
class FontDescription;
class GlyphPage;

struct GlyphData;
#if ENABLE(MULTI_REPRESENTATION_HEIC)
struct MultiRepresentationHEICMetrics;
#endif

enum FontVariant : uint8_t { AutoVariant, NormalVariant, SmallCapsVariant, EmphasisMarkVariant, BrokenIdeographVariant };
enum Pitch : uint8_t { UnknownPitch, FixedPitch, VariablePitch };
enum class IsForPlatformFont : bool { No, Yes };

// Used to create platform fonts.
enum class FontOrigin : bool { Remote, Local };
enum class FontIsInterstitial : bool { No, Yes };
enum class FontVisibility : bool { Visible, Invisible };
enum class FontIsOrientationFallback : bool { No, Yes };

#if USE(CORE_TEXT)
bool fontHasEitherTable(CTFontRef, unsigned tableTag1, unsigned tableTag2);
bool supportsOpenTypeFeature(CTFontRef, CFStringRef featureTag);
#endif

struct FontInternalAttributes {
    WEBCORE_EXPORT RenderingResourceIdentifier ensureRenderingResourceIdentifier() const;

    mutable std::optional<RenderingResourceIdentifier> renderingResourceIdentifier;
    FontOrigin origin : 1;
    FontIsInterstitial isInterstitial : 1;
    FontVisibility visibility : 1;
    FontIsOrientationFallback isTextOrientationFallback : 1;
};

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(Font);
class Font : public RefCounted<Font>, public CanMakeSingleThreadWeakPtr<Font> {
    WTF_MAKE_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(Font);
public:
    using Origin = FontOrigin;
    using IsInterstitial = FontIsInterstitial;
    using Visibility = FontVisibility;
    using IsOrientationFallback = FontIsOrientationFallback;

    WEBCORE_EXPORT static Ref<Font> create(const FontPlatformData&, Origin = Origin::Local, IsInterstitial = IsInterstitial::No, Visibility = Visibility::Visible, IsOrientationFallback = IsOrientationFallback::No, std::optional<RenderingResourceIdentifier> = std::nullopt);
    WEBCORE_EXPORT static Ref<Font> create(Ref<SharedBuffer>&& fontFaceData, Font::Origin, float fontSize, bool syntheticBold, bool syntheticItalic);
    WEBCORE_EXPORT static Ref<Font> create(WebCore::FontInternalAttributes&&, WebCore::FontPlatformData&&);

    WEBCORE_EXPORT ~Font();

    static Ref<Font> createSystemFallbackFontPlaceholder() { return adoptRef(*new Font(IsSystemFallbackFontPlaceholder::Yes)); }
    bool isSystemFontFallbackPlaceholder() const { return m_isSystemFontFallbackPlaceholder; }
    const FontPlatformData& platformData() const { return m_platformData; }
#if ENABLE(MATHML)
    const OpenTypeMathData* mathData() const;
#endif
#if ENABLE(OPENTYPE_VERTICAL)
    const OpenTypeVerticalData* verticalData() const { return m_verticalData.get(); }
#endif

    WEBCORE_EXPORT RenderingResourceIdentifier renderingResourceIdentifier() const;

    const Font* smallCapsFont(const FontDescription&) const;
    const Font& noSynthesizableFeaturesFont() const;
    const Font* emphasisMarkFont(const FontDescription&) const;
    const Font& brokenIdeographFont() const;
    const RefPtr<Font> halfWidthFont() const;

    bool isProbablyOnlyUsedToRenderIcons() const;

    const Font* variantFont(const FontDescription& description, FontVariant variant) const
    {
        switch (variant) {
        case SmallCapsVariant:
            return smallCapsFont(description);
        case EmphasisMarkVariant:
            return emphasisMarkFont(description);
        case BrokenIdeographVariant:
            return &brokenIdeographFont();
        case AutoVariant:
        case NormalVariant:
            break;
        }
        ASSERT_NOT_REACHED();
        return const_cast<Font*>(this);
    }

    bool variantCapsSupportedForSynthesis(FontVariantCaps) const;

    const Font& verticalRightOrientationFont() const;
    const Font& uprightOrientationFont() const;
    const Font& invisibleFont() const;

    bool hasVerticalGlyphs() const { return m_hasVerticalGlyphs; }
    bool isTextOrientationFallback() const { return m_attributes.isTextOrientationFallback == IsOrientationFallback::Yes; }

    const FontMetrics& fontMetrics() const { return m_fontMetrics; }
    float sizePerUnit() const { return platformData().size() / (fontMetrics().unitsPerEm() ? fontMetrics().unitsPerEm() : 1); }

    float maxCharWidth() const { return m_maxCharWidth; }
    void setMaxCharWidth(float maxCharWidth) { m_maxCharWidth = maxCharWidth; }

    float avgCharWidth() const { return m_avgCharWidth; }
    void setAvgCharWidth(float avgCharWidth) { m_avgCharWidth = avgCharWidth; }

    FloatRect boundsForGlyph(Glyph) const;

    // Should the result of this function include the results of synthetic bold?
    enum class SyntheticBoldInclusion {
        Incorporate,
        Exclude
    };

    enum class IsSystemFallbackFontPlaceholder : bool {
        No,
        Yes
    };

    float widthForGlyph(Glyph, SyntheticBoldInclusion = SyntheticBoldInclusion::Incorporate) const;

    Path pathForGlyph(Glyph) const;

    float spaceWidth(SyntheticBoldInclusion SyntheticBoldInclusion = SyntheticBoldInclusion::Incorporate) const
    {
        return m_spaceWidth + (SyntheticBoldInclusion == SyntheticBoldInclusion::Incorporate ? syntheticBoldOffset() : 0);
    }

    float syntheticBoldOffset() const { return m_syntheticBoldOffset; }

    Glyph spaceGlyph() const { return m_spaceGlyph; }
    Glyph zeroWidthSpaceGlyph() const { return m_zeroWidthSpaceGlyph; }
    bool isZeroWidthSpaceGlyph(Glyph glyph) const { return glyph == m_zeroWidthSpaceGlyph && glyph; }

    GlyphData glyphDataForCharacter(char32_t) const;
    Glyph glyphForCharacter(char32_t) const;
    bool supportsCodePoint(char32_t) const;
    bool platformSupportsCodePoint(char32_t, std::optional<char32_t> variation = std::nullopt) const;

    RefPtr<Font> systemFallbackFontForCharacterCluster(StringView, const FontDescription&, ResolvedEmojiPolicy, IsForPlatformFont) const;

    const GlyphPage* glyphPage(unsigned pageNumber) const;

    void determinePitch();
    Pitch pitch() const { return m_treatAsFixedPitch ? FixedPitch : VariablePitch; }
    bool canTakeFixedPitchFastContentMeasuring() const { return m_canTakeFixedPitchFastContentMeasuring; }

    Origin origin() const { return m_attributes.origin; }
    bool isInterstitial() const { return m_attributes.isInterstitial == IsInterstitial::Yes; }
    Visibility visibility() const { return m_attributes.visibility; }
    bool allowsAntialiasing() const { return m_allowsAntialiasing; }

#if !LOG_DISABLED
    String description() const;
#endif

#if PLATFORM(IOS_FAMILY)
    bool shouldNotBeUsedForArabic() const { return m_shouldNotBeUsedForArabic; };
#endif
#if USE(CORE_TEXT)
    CTFontRef getCTFont() const { return m_platformData.ctFont(); }
    RetainPtr<CFDictionaryRef> getCFStringAttributes(bool enableKerning, FontOrientation, const AtomString& locale) const;
    bool supportsSmallCaps() const;
    bool supportsAllSmallCaps() const;
    bool supportsPetiteCaps() const;
    bool supportsAllPetiteCaps() const;
    bool supportsOpenTypeAlternateHalfWidths() const;
#if ENABLE(MULTI_REPRESENTATION_HEIC)
    MultiRepresentationHEICMetrics metricsForMultiRepresentationHEIC() const;
#endif
#endif

    bool canRenderCombiningCharacterSequence(StringView) const;
    GlyphBufferAdvance applyTransforms(GlyphBuffer&, unsigned beginningGlyphIndex, unsigned beginningStringIndex, bool enableKerning, bool requiresShaping, const AtomString& locale, StringView text, TextDirection) const;

    // Returns nullopt if none of the glyphs are OT-SVG glyphs.
    std::optional<BitVector> findOTSVGGlyphs(const GlyphBufferGlyph*, unsigned count) const;

    bool hasAnyComplexColorFormatGlyphs(const GlyphBufferGlyph*, unsigned count) const;

#if PLATFORM(WIN)
    SCRIPT_CACHE* scriptCache() const { return &m_scriptCache; }
#endif

    void setIsUsedInSystemFallbackFontCache() { m_isUsedInSystemFallbackFontCache = true; }
    bool isUsedInSystemFallbackFontCache() const { return m_isUsedInSystemFallbackFontCache; }

    using Attributes = FontInternalAttributes;
    const Attributes& attributes() const { return m_attributes; }

    ColorGlyphType colorGlyphType(Glyph) const;

private:
    WEBCORE_EXPORT Font(const FontPlatformData&, Origin, IsInterstitial, Visibility, IsOrientationFallback, std::optional<RenderingResourceIdentifier>);
    Font(IsSystemFallbackFontPlaceholder);

    void platformInit();
    void platformGlyphInit();
    void platformCharWidthInit();
    void platformDestroy();

    void initCharWidths();

    RefPtr<Font> createFontWithoutSynthesizableFeatures() const;
    RefPtr<Font> createScaledFont(const FontDescription&, float scaleFactor) const;
    RefPtr<Font> platformCreateScaledFont(const FontDescription&, float scaleFactor) const;
    RefPtr<Font> createHalfWidthFont() const;
    RefPtr<Font> platformCreateHalfWidthFont() const;

    struct DerivedFonts;
    DerivedFonts& ensureDerivedFontData() const;

    FloatRect platformBoundsForGlyph(Glyph) const;
    float platformWidthForGlyph(Glyph) const;
    Path platformPathForGlyph(Glyph) const;

#if PLATFORM(COCOA)
    class ComplexColorFormatGlyphs {
    public:
        static ComplexColorFormatGlyphs createWithNoRelevantTables();
        static ComplexColorFormatGlyphs createWithRelevantTablesAndGlyphCount(unsigned glyphCount);

        bool hasValueFor(Glyph) const;
        bool get(Glyph) const;
        void set(Glyph, bool value);

        bool hasRelevantTables() const { return m_hasRelevantTables; }

    private:
        static constexpr size_t bitForInitialized(Glyph glyphID) { return static_cast<size_t>(glyphID) * 2; }
        static constexpr size_t bitForValue(Glyph glyphID) { return static_cast<size_t>(glyphID) * 2 + 1; }
        static constexpr size_t bitsRequiredForGlyphCount(unsigned glyphCount) { return glyphCount * 2; }

        ComplexColorFormatGlyphs(bool hasRelevantTables, unsigned glyphCount)
            : m_hasRelevantTables(hasRelevantTables)
            , m_bits(bitsRequiredForGlyphCount(glyphCount))
        { }

        bool m_hasRelevantTables;
        BitVector m_bits; // pairs of (initialized, value) bits
    };

    const PAL::OTSVGTable& otSVGTable() const;
    bool glyphHasComplexColorFormat(Glyph) const;
    bool hasComplexColorFormatTables() const;
    ComplexColorFormatGlyphs& glyphsWithComplexColorFormat() const;
#endif

    FontMetrics m_fontMetrics;
    float m_maxCharWidth { -1 };
    float m_avgCharWidth { -1 };

    const FontPlatformData m_platformData;

    mutable UncheckedKeyHashMap<unsigned, RefPtr<GlyphPage>, IntHash<unsigned>, WTF::UnsignedWithZeroKeyHashTraits<unsigned>> m_glyphPages;
    mutable GlyphMetricsMap<float> m_glyphToWidthMap;
    mutable std::unique_ptr<GlyphMetricsMap<FloatRect>> m_glyphToBoundsMap;
    // FIXME: Find a more efficient way to represent std::optional<Path>.
    mutable std::unique_ptr<GlyphMetricsMap<std::optional<Path>>> m_glyphPathMap;
    mutable BitVector m_codePointSupport;

#if ENABLE(MATHML)
    mutable RefPtr<OpenTypeMathData> m_mathData;
#endif
#if ENABLE(OPENTYPE_VERTICAL)
    RefPtr<OpenTypeVerticalData> m_verticalData;
#endif

    Attributes m_attributes;

    struct DerivedFonts {
        WTF_MAKE_STRUCT_FAST_ALLOCATED;
    public:

        RefPtr<Font> smallCapsFont;
        RefPtr<Font> noSynthesizableFeaturesFont;
        RefPtr<Font> emphasisMarkFont;
        RefPtr<Font> brokenIdeographFont;
        RefPtr<Font> verticalRightOrientationFont;
        RefPtr<Font> uprightOrientationFont;
        RefPtr<Font> invisibleFont;
        RefPtr<Font> halfWidthFont;
    };

    mutable std::unique_ptr<DerivedFonts> m_derivedFontData;

    struct NoEmojiGlyphs { };
    struct AllEmojiGlyphs { };
    struct SomeEmojiGlyphs {
        BitVector colorGlyphs;
    };
    using EmojiType = std::variant<NoEmojiGlyphs, AllEmojiGlyphs, SomeEmojiGlyphs>;
    EmojiType m_emojiType { NoEmojiGlyphs { } };

#if PLATFORM(COCOA)
    mutable std::optional<PAL::OTSVGTable> m_otSVGTable;
    mutable std::optional<ComplexColorFormatGlyphs> m_glyphsWithComplexColorFormat; // SVG and sbix

    enum class SupportsFeature : uint8_t {
        No,
        Yes,
        Unknown
    };
    mutable SupportsFeature m_supportsSmallCaps { SupportsFeature::Unknown };
    mutable SupportsFeature m_supportsAllSmallCaps { SupportsFeature::Unknown };
    mutable SupportsFeature m_supportsPetiteCaps { SupportsFeature::Unknown };
    mutable SupportsFeature m_supportsAllPetiteCaps { SupportsFeature::Unknown };
    mutable SupportsFeature m_supportsOpenTypeAlternateHalfWidths { SupportsFeature::Unknown };
#endif

#if PLATFORM(WIN)
    mutable SCRIPT_CACHE m_scriptCache { 0 };
#endif

    Glyph m_spaceGlyph { 0 };
    Glyph m_zeroWidthSpaceGlyph { 0 };

    float m_spaceWidth { 0 };
    float m_syntheticBoldOffset { 0 };

    unsigned m_treatAsFixedPitch : 1;
    unsigned m_canTakeFixedPitchFastContentMeasuring : 1 { false };
    unsigned m_isBrokenIdeographFallback : 1;
    unsigned m_hasVerticalGlyphs : 1;

    unsigned m_isUsedInSystemFallbackFontCache : 1;
    
    unsigned m_allowsAntialiasing : 1;

    unsigned m_isSystemFontFallbackPlaceholder : 1 { false };

#if PLATFORM(IOS_FAMILY)
    unsigned m_shouldNotBeUsedForArabic : 1;
#endif

    // Adding any non-derived information to Font needs a parallel change in WebCoreArgumentCoders.cpp.
};

#if PLATFORM(IOS_FAMILY)
bool fontFamilyShouldNotBeUsedForArabic(CFStringRef);
#endif

ALWAYS_INLINE FloatRect Font::boundsForGlyph(Glyph glyph) const
{
    if (isZeroWidthSpaceGlyph(glyph))
        return FloatRect();

    FloatRect bounds;
    if (m_glyphToBoundsMap) {
        bounds = m_glyphToBoundsMap->metricsForGlyph(glyph);
        if (bounds.width() != cGlyphSizeUnknown)
            return bounds;
    }

    bounds = platformBoundsForGlyph(glyph);
    if (!m_glyphToBoundsMap)
        m_glyphToBoundsMap = makeUnique<GlyphMetricsMap<FloatRect>>();
    m_glyphToBoundsMap->setMetricsForGlyph(glyph, bounds);
    return bounds;
}

ALWAYS_INLINE float Font::widthForGlyph(Glyph glyph, SyntheticBoldInclusion SyntheticBoldInclusion) const
{
    // The optimization of returning 0 for the zero-width-space glyph is incorrect for the LastResort font,
    // used in place of the actual font when isLoading() is true on both macOS and iOS.
    // The zero-width-space glyph in that font does not have a width of zero and, further, that glyph is used
    // for many other characters and must not be zero width when used for them.
    if (isZeroWidthSpaceGlyph(glyph) && !isInterstitial())
        return 0;

    float width = m_glyphToWidthMap.metricsForGlyph(glyph);
    if (width != cGlyphSizeUnknown)
        return width + (SyntheticBoldInclusion == SyntheticBoldInclusion::Incorporate ? syntheticBoldOffset() : 0);

#if ENABLE(OPENTYPE_VERTICAL)
    if (m_verticalData)
        width = m_verticalData->advanceHeight(this, glyph);
    else
#endif
        width = platformWidthForGlyph(glyph);

    m_glyphToWidthMap.setMetricsForGlyph(glyph, width);
    return width + (SyntheticBoldInclusion == SyntheticBoldInclusion::Incorporate ? syntheticBoldOffset() : 0);
}

#if !LOG_DISABLED
WEBCORE_EXPORT TextStream& operator<<(TextStream&, const Font&);
#endif

} // namespace WebCore
