/*
 * Copyright (C) 2006-2023 Apple Inc. All rights reserved.
 * Copyright (C) 2006 Michael Emmel mike.emmel@gmail.com
 * Copyright (C) 2007 Holger Hans Peter Freyther
 * Copyright (C) 2007 Pioneer Research Center USA, Inc.
 * Copyright (C) 2010, 2011 Brent Fulgham <bfulgham@webkit.org>
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

#include "SharedBuffer.h"
#include "ShouldLocalizeAxisNames.h"
#include "TextFlags.h"
#include <wtf/Forward.h>
#include <wtf/RetainPtr.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>

#if PLATFORM(WIN)
#include "COMPtr.h"
#include "FontMemoryResource.h"
#include "SharedGDIObject.h"
#endif

#if USE(CAIRO)
#include "RefPtrCairo.h"
#elif USE(SKIA)
#include <hb.h>
WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN
#include <skia/core/SkFont.h>
WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
#endif

#if ENABLE(MATHML) && USE(HARFBUZZ)
#include "HbUniquePtr.h"
#endif

#if USE(FREETYPE)
#include "FcUniquePtr.h"
#include "RefPtrFontconfig.h"
#include <memory>
#endif

#if USE(APPKIT)
OBJC_CLASS NSFont;
#endif

#if USE(CORE_TEXT)
#include <pal/spi/cf/CoreTextSPI.h>
typedef const struct __CTFont* CTFontRef;
#endif

#if USE(CG)
#include <CoreGraphics/CoreGraphics.h>
#endif

#if PLATFORM(WIN)
#include <wtf/win/GDIObject.h>
typedef struct HFONT__* HFONT;
interface IDWriteFont;
interface IDWriteFontFace;
#endif

namespace WebCore {

class FontDescription;
struct FontCustomPlatformData;
struct FontSizeAdjust;
#if USE(SKIA)
class SkiaHarfBuzzFont;
#endif

struct FontPlatformDataAttributes {
    FontPlatformDataAttributes(float size, FontOrientation orientation, FontWidthVariant widthVariant, TextRenderingMode textRenderingMode, bool syntheticBold, bool syntheticOblique)
        : m_size(size)
        , m_orientation(orientation)
        , m_widthVariant(widthVariant)
        , m_textRenderingMode(textRenderingMode)
        , m_syntheticBold(syntheticBold)
        , m_syntheticOblique(syntheticOblique)
        { }

#if USE(CORE_TEXT)
    FontPlatformDataAttributes(float size, FontOrientation orientation, FontWidthVariant widthVariant, TextRenderingMode textRenderingMode, bool syntheticBold, bool syntheticOblique, RetainPtr<CFDictionaryRef> attributes, CTFontDescriptorOptions options, RetainPtr<CFStringRef> url, RetainPtr<CFStringRef> psName)
        : m_size(size)
        , m_orientation(orientation)
        , m_widthVariant(widthVariant)
        , m_textRenderingMode(textRenderingMode)
        , m_syntheticBold(syntheticBold)
        , m_syntheticOblique(syntheticOblique)
        , m_attributes(attributes)
        , m_options(options)
        , m_url(url)
        , m_psName(psName)
        { }
#endif

#if PLATFORM(WIN) && USE(CAIRO)
    FontPlatformDataAttributes(float size, FontOrientation orientation, FontWidthVariant widthVariant, TextRenderingMode textRenderingMode, bool syntheticBold, bool syntheticOblique, LOGFONT font)
        : m_size(size)
        , m_orientation(orientation)
        , m_widthVariant(widthVariant)
        , m_textRenderingMode(textRenderingMode)
        , m_syntheticBold(syntheticBold)
        , m_syntheticOblique(syntheticOblique)
        , m_font(font)
        { }
#endif

#if USE(SKIA)
    FontPlatformDataAttributes(float size, FontOrientation orientation, FontWidthVariant widthVariant, TextRenderingMode textRenderingMode, bool syntheticBold, bool syntheticOblique, SkString familyName, SkFontStyle style, Vector<hb_feature_t>&& features)
        : m_size(size)
        , m_orientation(orientation)
        , m_widthVariant(widthVariant)
        , m_textRenderingMode(textRenderingMode)
        , m_syntheticBold(syntheticBold)
        , m_syntheticOblique(syntheticOblique)
        , m_familyName(familyName)
        , m_style(style)
        , m_features(WTFMove(features))
        { }
#endif

    float m_size { 0 };

    FontOrientation m_orientation { FontOrientation::Horizontal };
    FontWidthVariant m_widthVariant { FontWidthVariant::RegularWidth };
    TextRenderingMode m_textRenderingMode { TextRenderingMode::AutoTextRendering };

    bool m_syntheticBold { false };
    bool m_syntheticOblique { false };

#if PLATFORM(WIN) && USE(CAIRO)
    LOGFONT m_font;
#elif USE(CORE_TEXT)
    RetainPtr<CFDictionaryRef> m_attributes;
    CTFontDescriptorOptions m_options { (CTFontDescriptorOptions)0 }; // FIXME: <rdar://121670125>
    RetainPtr<CFStringRef> m_url;
    RetainPtr<CFStringRef> m_psName;
#elif USE(SKIA)
    SkString m_familyName;
    SkFontStyle m_style;
    Vector<hb_feature_t> m_features;
#endif
};

#if USE(CORE_TEXT)

// FIXME: Some of these structures have std::optional<RetainPtr<>> which seems weird,
// but generated encode/decode of RetainPtrs doesn't currently handle null values very well.
// Once it does, remove the std::optional redirect.
struct FontPlatformSerializedTraits {
    static std::optional<FontPlatformSerializedTraits> fromCF(CFDictionaryRef);
    RetainPtr<CFDictionaryRef> toCFDictionary() const;

    String uiFontDesign;
    std::optional<RetainPtr<CFNumberRef>> weight;
    std::optional<RetainPtr<CFNumberRef>> width;
    std::optional<RetainPtr<CFNumberRef>> symbolic;
    std::optional<RetainPtr<CFNumberRef>> grade;
};

struct FontPlatformOpticalSize {
    static std::optional<FontPlatformOpticalSize> fromCF(CFTypeRef);
    RetainPtr<CFTypeRef> toCF() const;
    std::variant<RetainPtr<CFNumberRef>, String> opticalSize;
};

struct FontPlatformSerializedAttributes {
    static std::optional<FontPlatformSerializedAttributes> fromCF(CFDictionaryRef);
    RetainPtr<CFDictionaryRef> toCFDictionary() const;

    String fontName;
    String descriptorLanguage;
    String descriptorTextStyle;

    std::optional<RetainPtr<CFDataRef>> matrix;

    std::optional<RetainPtr<CFBooleanRef>> ignoreLegibilityWeight;

    std::optional<RetainPtr<CFNumberRef>> baselineAdjust;
    std::optional<RetainPtr<CFNumberRef>> fallbackOption;
    std::optional<RetainPtr<CFNumberRef>> fixedAdvance;
    std::optional<RetainPtr<CFNumberRef>> orientation;
    std::optional<RetainPtr<CFNumberRef>> palette;
    std::optional<RetainPtr<CFNumberRef>> size;
    std::optional<RetainPtr<CFNumberRef>> sizeCategory;
    std::optional<RetainPtr<CFNumberRef>> track;
    std::optional<RetainPtr<CFNumberRef>> unscaledTracking;

    std::optional<Vector<std::pair<RetainPtr<CFNumberRef>, RetainPtr<CGColorRef>>>> paletteColors;
    std::optional<Vector<std::pair<RetainPtr<CFNumberRef>, RetainPtr<CFNumberRef>>>> variations;

    std::optional<FontPlatformOpticalSize> opticalSize;
    std::optional<FontPlatformSerializedTraits> traits;

    // FIXME: featureSettings is an array of CFDictionaries whose layouts are highly variable
    std::optional<RetainPtr<CFArrayRef>> featureSettings;

#if HAVE(ADDITIONAL_FONT_PLATFORM_SERIALIZED_ATTRIBUTES)
    std::optional<RetainPtr<CFNumberRef>> additionalNumber;
    static CFStringRef additionalFontPlatformSerializedAttributesNumberDictionaryKey();
#endif
};

struct FontPlatformSerializedCreationData {
    Vector<uint8_t> fontFaceData;
    std::optional<FontPlatformSerializedAttributes> attributes;
    String itemInCollection;
};

struct FontPlatformSerializedData {
    CTFontDescriptorOptions options { 0 }; // <rdar://121670125>
    RetainPtr<CFStringRef> referenceURL;
    RetainPtr<CFStringRef> postScriptName;
    std::optional<FontPlatformSerializedAttributes> attributes;
};
#elif USE(SKIA)
struct FontPlatformSerializedCreationData {
    Vector<uint8_t> fontFaceData;
    String itemInCollection;
};

struct FontPlatformSerializedData {
    sk_sp<SkData> typefaceData;
};
#elif USE(CAIRO)
struct FontPlatformSerializedCreationData {
    Vector<uint8_t> fontFaceData;
    String itemInCollection;
};

struct FontPlatformSerializedData {
#if PLATFORM(WIN)
    LOGFONT logFont;
#endif
};
#endif

// This class is conceptually immutable. Once created, no instances should ever change (in an observable way).
class FontPlatformData {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(FontPlatformData, WEBCORE_EXPORT);
public:
    struct CreationData;
    struct FontVariationAxis {
        FontVariationAxis(const String& name, const String& tag, float defaultValue, float minimumValue, float maximumValue)
            : m_name(name)
            , m_tag(tag)
            , m_defaultValue(defaultValue)
            , m_minimumValue(minimumValue)
            , m_maximumValue(maximumValue)
        {
        }

        const String& name() const { return m_name; }
        const String& tag() const { return m_tag; }
        float defaultValue() const { return m_defaultValue; }
        float minimumValue() const { return m_minimumValue; }
        float maximumValue() const { return m_maximumValue; }

    private:
        const String m_name;
        const String m_tag;
        float m_defaultValue;
        float m_minimumValue;
        float m_maximumValue;
    };

    FontPlatformData(WTF::HashTableDeletedValueType);
    FontPlatformData();

    FontPlatformData(float size, bool syntheticBold, bool syntheticOblique, FontOrientation = FontOrientation::Horizontal, FontWidthVariant = FontWidthVariant::RegularWidth, TextRenderingMode = TextRenderingMode::AutoTextRendering, const FontCustomPlatformData* = nullptr);

#if USE(CORE_TEXT)
    WEBCORE_EXPORT FontPlatformData(RetainPtr<CTFontRef>&&, float size, bool syntheticBold = false, bool syntheticOblique = false, FontOrientation = FontOrientation::Horizontal, FontWidthVariant = FontWidthVariant::RegularWidth, TextRenderingMode = TextRenderingMode::AutoTextRendering, const FontCustomPlatformData* = nullptr);
#endif

#if PLATFORM(WIN) && USE(CAIRO)
    WEBCORE_EXPORT FontPlatformData(GDIObject<HFONT>, float size, bool syntheticBold, bool syntheticOblique, const FontCustomPlatformData* = nullptr);
    FontPlatformData(GDIObject<HFONT>, cairo_font_face_t*, float size, bool bold, bool italic, const FontCustomPlatformData* = nullptr);
#endif

#if USE(FREETYPE) && USE(CAIRO)
    FontPlatformData(cairo_font_face_t*, RefPtr<FcPattern>&&, float size, bool fixedWidth, bool syntheticBold, bool syntheticOblique, FontOrientation, const FontCustomPlatformData* = nullptr);
#elif USE(SKIA)
    WEBCORE_EXPORT FontPlatformData(sk_sp<SkTypeface>&&, float size, bool syntheticBold, bool syntheticOblique, FontOrientation, FontWidthVariant, TextRenderingMode, Vector<hb_feature_t>&&, const FontCustomPlatformData* = nullptr);
#endif

    using Attributes = FontPlatformDataAttributes;

    WEBCORE_EXPORT static FontPlatformData create(const Attributes&, const FontCustomPlatformData*);

    WEBCORE_EXPORT FontPlatformData(const FontPlatformData&);
    WEBCORE_EXPORT FontPlatformData& operator=(const FontPlatformData&);
    WEBCORE_EXPORT ~FontPlatformData();

    static FontPlatformData cloneWithOrientation(const FontPlatformData&, FontOrientation);
    static FontPlatformData cloneWithSyntheticOblique(const FontPlatformData&, bool);

    static FontPlatformData cloneWithSize(const FontPlatformData&, float);
    void updateSizeWithFontSizeAdjust(const FontSizeAdjust&, float);

#if PLATFORM(WIN)
    HFONT hfont() const { return m_hfont ? m_hfont->get() : 0; }
#endif

    using IPCData = std::variant<FontPlatformSerializedData, FontPlatformSerializedCreationData>;
#if USE(CORE_TEXT)
    WEBCORE_EXPORT FontPlatformData(float size, FontOrientation&&, FontWidthVariant&&, TextRenderingMode&&, bool syntheticBold, bool syntheticOblique, RetainPtr<CTFontRef>&&, RefPtr<FontCustomPlatformData>&&);
#elif USE(SKIA)
    WEBCORE_EXPORT FontPlatformData(float size, FontOrientation&&, FontWidthVariant&&, TextRenderingMode&&, bool syntheticBold, bool syntheticOblique, RefPtr<FontCustomPlatformData>&&);
#endif

    WEBCORE_EXPORT static std::optional<FontPlatformData> fromIPCData(float size, FontOrientation&&, FontWidthVariant&&, TextRenderingMode&&, bool syntheticBold, bool syntheticOblique, FontPlatformData::IPCData&& toIPCData);
    WEBCORE_EXPORT IPCData toIPCData() const;

#if USE(CORE_TEXT)
    WEBCORE_EXPORT CTFontRef registeredFont() const; // Returns nullptr iff the font is not registered, such as web fonts (otherwise returns font()).
    static RetainPtr<CFTypeRef> objectForEqualityCheck(CTFontRef);
    RetainPtr<CFTypeRef> objectForEqualityCheck() const;
    bool hasCustomTracking() const { return isSystemFont(); }

    CTFontRef ctFont() const { return m_font.get(); }
#endif

#if PLATFORM(COCOA)
    bool isSystemFont() const { return m_isSystemFont; }
#endif

    bool hasVariations() const { return m_hasVariations; }

    bool isFixedPitch() const;
    float size() const { return m_size; }
    bool syntheticBold() const { return m_syntheticBold; }
    bool syntheticOblique() const { return m_syntheticOblique; }
    bool isColorBitmapFont() const { return m_isColorBitmapFont; }
    FontOrientation orientation() const { return m_orientation; }
    FontWidthVariant widthVariant() const { return m_widthVariant; }
    TextRenderingMode textRenderingMode() const { return m_textRenderingMode; }
    bool isForTextCombine() const { return widthVariant() != FontWidthVariant::RegularWidth; } // Keep in sync with callers of FontDescription::setWidthVariant().

    String familyName() const;
    Vector<FontVariationAxis> variationAxes(ShouldLocalizeAxisNames) const;

#if USE(CAIRO)
    cairo_scaled_font_t* scaledFont() const { return m_scaledFont.get(); }
#elif USE(SKIA)
    const SkFont& skFont() const { return m_font; }
    SkiaHarfBuzzFont* skiaHarfBuzzFont() const { return m_hbFont.get(); }
    hb_font_t* hbFont() const;
    const Vector<hb_feature_t>& features() const { return m_features; }
#endif

#if ENABLE(MATHML) && USE(HARFBUZZ)
    HbUniquePtr<hb_font_t> createOpenTypeMathHarfBuzzFont() const;
#endif
#if USE(FREETYPE)
    bool hasCompatibleCharmap() const;
    FcPattern* fcPattern() const;
    bool isFixedWidth() const { return m_fixedWidth; }
#endif

    unsigned hash() const;

    bool operator==(const FontPlatformData& other) const
    {
        return platformIsEqual(other)
            && m_isHashTableDeletedValue == other.m_isHashTableDeletedValue
            && m_size == other.m_size
            && m_syntheticBold == other.m_syntheticBold
            && m_syntheticOblique == other.m_syntheticOblique
            && m_isColorBitmapFont == other.m_isColorBitmapFont
            && m_orientation == other.m_orientation
            && m_widthVariant == other.m_widthVariant
            && m_textRenderingMode == other.m_textRenderingMode;
    }

    bool isHashTableDeletedValue() const
    {
        return m_isHashTableDeletedValue;
    }

    bool isEmoji() const
    {
#if PLATFORM(IOS_FAMILY)
        return m_isEmoji;
#else
        return false;
#endif
    }

    RefPtr<SharedBuffer> openTypeTable(uint32_t table) const;
    RefPtr<SharedBuffer> platformOpenTypeTable(uint32_t table) const;

    String description() const;

    struct CreationData {
        Ref<SharedBuffer> fontFaceData;
        String itemInCollection;
#if PLATFORM(WIN) && USE(CAIRO)
        Ref<FontMemoryResource> m_fontResource;
#endif
    };

    WEBCORE_EXPORT const CreationData* creationData() const;
    const FontCustomPlatformData* customPlatformData() const
    {
        return m_customPlatformData.get();
    }
    inline RefPtr<const FontCustomPlatformData> protectedCustomPlatformData() const; // Defined in FontCustomPlatformData.h

    WEBCORE_EXPORT Attributes attributes() const;

private:
    bool platformIsEqual(const FontPlatformData&) const;
    //  updateSize to be implemented by each platform since it needs to re-instantiate the platform font object.
    void updateSize(float);

#if PLATFORM(COCOA)
    CGFloat ctFontSize() const;
#endif

#if PLATFORM(WIN)
    void platformDataInit(HFONT, float size);
#endif

#if USE(SKIA)
    void platformDataInit();
#endif

#if USE(FREETYPE) && USE(CAIRO)
    void buildScaledFont(cairo_font_face_t*);
#endif

#if PLATFORM(WIN)
    RefPtr<SharedGDIObject<HFONT>> m_hfont; // FIXME: Delete this in favor of m_hbFont
#elif USE(CORE_TEXT)
    RetainPtr<CTFontRef> m_font;
#endif

#if USE(CAIRO)
    RefPtr<cairo_scaled_font_t> m_scaledFont;
#elif USE(SKIA)
    SkFont m_font;
    RefPtr<SkiaHarfBuzzFont> m_hbFont;
    Vector<hb_feature_t> m_features;
#endif

#if USE(FREETYPE)
    RefPtr<FcPattern> m_pattern;
#endif

    float m_size { 0 };

    FontOrientation m_orientation { FontOrientation::Horizontal };
    FontWidthVariant m_widthVariant { FontWidthVariant::RegularWidth };
    TextRenderingMode m_textRenderingMode { TextRenderingMode::AutoTextRendering };

    // This is conceptually const, but we can't make it actually const,
    // because FontPlatformData is used as a key in a UncheckedKeyHashMap.
    RefPtr<const FontCustomPlatformData> m_customPlatformData;

    bool m_syntheticBold { false };
    bool m_syntheticOblique { false };
    bool m_isColorBitmapFont { false };
    bool m_isHashTableDeletedValue { false };
#if PLATFORM(COCOA)
    bool m_isSystemFont { false };
#endif
    bool m_hasVariations { false };
    // The values above are common to all ports

#if PLATFORM(IOS_FAMILY)
    bool m_isEmoji { false };
#endif

#if USE(FREETYPE)
    bool m_fixedWidth { false };
#endif

    // Adding any non-derived information to FontPlatformData needs a parallel change in WebCoreArgumentCodersCocoa.cpp.
};

#if USE(CORE_TEXT)
bool isSystemFont(CTFontRef);
WEBCORE_EXPORT RetainPtr<CTFontRef> createCTFont(CFDictionaryRef attributes, float size, CTFontDescriptorOptions, CFStringRef referenceURL, CFStringRef desiredPostScriptName);
#endif

#if USE(CG)

class ScopedTextMatrix {
public:
    ScopedTextMatrix(CGAffineTransform newMatrix, CGContextRef context)
        : m_context(context)
        , m_textMatrix(CGContextGetTextMatrix(context))
    {
        CGContextSetTextMatrix(m_context, newMatrix);
    }

    ~ScopedTextMatrix()
    {
        CGContextSetTextMatrix(m_context, m_textMatrix);
    }

    CGAffineTransform savedMatrix() const
    {
        return m_textMatrix;
    }

private:
    CGContextRef m_context;
    CGAffineTransform m_textMatrix;
};

#endif

#if PLATFORM(WIN)
// This is a scaling factor for Windows GDI fonts. We do this for
// subpixel precision when rendering using Uniscribe.
constexpr int cWindowsFontScaleFactor = 32;
#endif

} // namespace WebCore
