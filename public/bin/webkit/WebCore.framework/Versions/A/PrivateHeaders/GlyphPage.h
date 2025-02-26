/*
 * Copyright (C) 2006-2023 Apple Inc. All rights reserved.
 * Copyright (C) Research In Motion Limited 2011. All rights reserved.
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

#include "Font.h"
#include "Glyph.h"
#include "TextFlags.h"
#include <unicode/utypes.h>
#include <wtf/BitSet.h>
#include <wtf/CheckedPtr.h>
#include <wtf/RefCounted.h>
#include <wtf/Ref.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace WebCore {

// Holds the glyph index and the corresponding Font information for a given
// character.
struct GlyphData {
    GlyphData(Glyph glyph = 0, const Font* font = nullptr, ColorGlyphType colorGlyphType = ColorGlyphType::Outline)
        : glyph(glyph)
        , colorGlyphType(colorGlyphType)
        , font(font)
    {
    }

    bool isValid() const { return !!font; }

    Glyph glyph;
    ColorGlyphType colorGlyphType;
    SingleThreadWeakPtr<const Font> font;
};

// A GlyphPage contains a fixed-size set of GlyphData mappings for a contiguous
// range of characters in the Unicode code space. GlyphPages are indexed
// starting from 0 and incrementing for each "size" number of glyphs.
class GlyphPage final : public RefCounted<GlyphPage> {
public:
    static Ref<GlyphPage> create(const Font& font)
    {
        return adoptRef(*new GlyphPage(font));
    }

    ~GlyphPage()
    {
        --s_count;
    }

    static unsigned count() { return s_count; }

    static constexpr unsigned size = 16;

    static constexpr unsigned sizeForPageNumber(unsigned) { return size; }
    static constexpr unsigned indexForCodePoint(char32_t c) { return c % size; }
    static constexpr unsigned pageNumberForCodePoint(char32_t c) { return c / size; }
    static constexpr char32_t startingCodePointInPageNumber(unsigned pageNumber) { return pageNumber * size; }
    static constexpr bool pageNumberIsUsedForArabic(unsigned pageNumber) { return startingCodePointInPageNumber(pageNumber) >= 0x600 && startingCodePointInPageNumber(pageNumber) + sizeForPageNumber(pageNumber) < 0x700; }

    GlyphData glyphDataForCharacter(char32_t c) const
    {
        return glyphDataForIndex(indexForCodePoint(c));
    }

    Glyph glyphForCharacter(char32_t c) const
    {
        return glyphForIndex(indexForCodePoint(c));
    }

    GlyphData glyphDataForIndex(unsigned index) const
    {
        Glyph glyph = glyphForIndex(index);
        auto colorGlyphType = colorGlyphTypeForIndex(index);
        return GlyphData(glyph, glyph ? m_font.get() : nullptr, colorGlyphType);
    }

    Glyph glyphForIndex(unsigned index) const
    {
        RELEASE_ASSERT_WITH_SECURITY_IMPLICATION(index < size);
        return m_glyphs[index];
    }

    ColorGlyphType colorGlyphTypeForIndex(unsigned index) const
    {
        RELEASE_ASSERT_WITH_SECURITY_IMPLICATION(index < size);
        return m_isColor.get(index) ? ColorGlyphType::Color : ColorGlyphType::Outline;
    }

    // FIXME: Pages are immutable after initialization. This should be private.
    void setGlyphForIndex(unsigned index, Glyph glyph, ColorGlyphType colorGlyphType)
    {
        ASSERT_WITH_SECURITY_IMPLICATION(index < size);
        m_glyphs[index] = glyph;
        m_isColor.set(index, colorGlyphType == ColorGlyphType::Color);
    }

    const Font& font() const
    {
        return *m_font;
    }

    // Implemented by the platform.
    bool fill(std::span<const UChar> characterBuffer);

private:
    explicit GlyphPage(const Font& font)
        : m_font(font)
    {
        ++s_count;
    }

    SingleThreadWeakPtr<const Font> m_font;
    Glyph m_glyphs[size] { };
    WTF::BitSet<size> m_isColor;

    WEBCORE_EXPORT static unsigned s_count;
};

} // namespace WebCore

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
