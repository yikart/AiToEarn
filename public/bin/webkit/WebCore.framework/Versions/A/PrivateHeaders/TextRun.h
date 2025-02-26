/*
 * Copyright (C) 2000 Lars Knoll (knoll@kde.org)
 *           (C) 2000 Antti Koivisto (koivisto@kde.org)
 *           (C) 2000 Dirk Mueller (mueller@kde.org)
 * Copyright (C) 2003-2022 Apple Inc. All rights reserved.
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

#include "TabSize.h"
#include "TextFlags.h"
#include "TextSpacing.h"
#include "WritingMode.h"
#include <wtf/CheckedRef.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/text/StringView.h>

namespace WebCore {

class FloatPoint;
class FloatRect;
class FontCascade;
class GraphicsContext;
class GlyphBuffer;
class Font;

struct GlyphData;

class TextRun final : public CanMakeCheckedPtr<TextRun> {
    WTF_MAKE_TZONE_ALLOCATED(TextRun);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(TextRun);
    friend void add(Hasher&, const TextRun&);
public:
    explicit TextRun(const String& text, float xpos = 0, float expansion = 0, ExpansionBehavior expansionBehavior = ExpansionBehavior::defaultBehavior(), TextDirection direction = TextDirection::LTR, bool directionalOverride = false, bool characterScanForCodePath = true)
        : m_text(text)
        , m_tabSize(0)
        , m_xpos(xpos)
        , m_horizontalGlyphStretch(1)
        , m_expansion(expansion)
        , m_expansionBehavior(expansionBehavior)
        , m_allowTabs(false)
        , m_direction(static_cast<unsigned>(direction))
        , m_directionalOverride(directionalOverride)
        , m_characterScanForCodePath(characterScanForCodePath)
        , m_disableSpacing(false)
    {
        ASSERT(!m_text.isNull());
    }

    explicit TextRun(StringView stringView, float xpos = 0, float expansion = 0, ExpansionBehavior expansionBehavior = ExpansionBehavior::defaultBehavior(), TextDirection direction = TextDirection::LTR, bool directionalOverride = false, bool characterScanForCodePath = true)
        : TextRun(stringView.toStringWithoutCopying(), xpos, expansion, expansionBehavior, direction, directionalOverride, characterScanForCodePath)
    {
    }

    explicit TextRun(WTF::HashTableDeletedValueType)
        : m_text(WTF::HashTableDeletedValue)
        , m_tabSize(0)
        , m_xpos(0)
        , m_horizontalGlyphStretch(0)
        , m_expansion(0)
        , m_expansionBehavior(ExpansionBehavior::defaultBehavior())
        , m_allowTabs(0)
        , m_direction(0)
        , m_directionalOverride(0)
        , m_characterScanForCodePath(0)
        , m_disableSpacing(0)
    {
    }

    explicit TextRun(WTF::HashTableEmptyValueType)
        : m_text()
        , m_tabSize(0)
        , m_xpos(0)
        , m_horizontalGlyphStretch(0)
        , m_expansion(0)
        , m_expansionBehavior(ExpansionBehavior::defaultBehavior())
        , m_allowTabs(0)
        , m_direction(0)
        , m_directionalOverride(0)
        , m_characterScanForCodePath(0)
        , m_disableSpacing(0)
    {
    }

    TextRun(const TextRun&) = default;
    TextRun& operator=(const TextRun&) = default;
    bool operator==(const TextRun&) const;

    bool isHashTableEmptyValue() const { return m_text.isNull(); }
    bool isHashTableDeletedValue() const { return m_text.isHashTableDeletedValue(); }

    TextRun subRun(unsigned startOffset, unsigned length) const
    {
        ASSERT_WITH_SECURITY_IMPLICATION((startOffset + length) <= m_text.length());

        auto result { *this };

        if (is8Bit())
            result.setText(subspan8(startOffset).first(length));
        else
            result.setText(subspan16(startOffset).first(length));
        return result;
    }

    UChar operator[](unsigned i) const { RELEASE_ASSERT(i < m_text.length()); return m_text[i]; }
    std::span<const LChar> span8() const { ASSERT(is8Bit()); return m_text.span8(); }
    std::span<const UChar> span16() const { ASSERT(!is8Bit()); return m_text.span16(); }
    std::span<const LChar> subspan8(unsigned i) const { return span8().subspan(i); }
    std::span<const UChar> subspan16(unsigned i) const { return span16().subspan(i); }

    bool is8Bit() const { return m_text.is8Bit(); }
    unsigned length() const { return m_text.length(); }

    void setText(StringView text) { ASSERT(!text.isNull()); m_text = text.toStringWithoutCopying(); }

    float horizontalGlyphStretch() const { return m_horizontalGlyphStretch; }
    void setHorizontalGlyphStretch(float scale) { m_horizontalGlyphStretch = scale; }

    bool allowTabs() const { return m_allowTabs; }
    const TabSize& tabSize() const { return m_tabSize; }
    void setTabSize(bool, const TabSize&);

    float xPos() const { return m_xpos; }
    void setXPos(float xPos) { m_xpos = xPos; }
    float expansion() const { return m_expansion; }
    ExpansionBehavior expansionBehavior() const { return m_expansionBehavior; }
    TextDirection direction() const { return static_cast<TextDirection>(m_direction); }
    bool rtl() const { return static_cast<TextDirection>(m_direction) == TextDirection::RTL; }
    bool ltr() const { return static_cast<TextDirection>(m_direction) == TextDirection::LTR; }
    bool directionalOverride() const { return m_directionalOverride; }
    bool characterScanForCodePath() const { return m_characterScanForCodePath; }
    bool spacingDisabled() const { return m_disableSpacing; }

    void disableSpacing() { m_disableSpacing = true; }
    void setDirection(TextDirection direction) { m_direction = static_cast<unsigned>(direction); }
    void setDirectionalOverride(bool override) { m_directionalOverride = override; }
    void setCharacterScanForCodePath(bool scan) { m_characterScanForCodePath = scan; }
    StringView text() const { return m_text; }

    TextRun isolatedCopy() const;

    const String& textAsString() const { return m_text; }

    void setTextSpacingState(TextSpacing::SpacingState spacingState) { m_textSpacingState = spacingState; }
    TextSpacing::SpacingState textSpacingState() const { return m_textSpacingState; }

private:
    String m_text;

    TabSize m_tabSize;

    // m_xpos is the x position relative to the left start of the text line, not relative to the left
    // start of the containing block. In the case of right alignment or center alignment, left start of
    // the text line is not the same as left start of the containing block. This variable is only used
    // to calculate the width of \t
    float m_xpos;  
    float m_horizontalGlyphStretch;

    float m_expansion;
    ExpansionBehavior m_expansionBehavior;

    TextSpacing::SpacingState m_textSpacingState;

    unsigned m_allowTabs : 1;
    unsigned m_direction : 1;
    unsigned m_directionalOverride : 1; // Was this direction set by an override character.
    unsigned m_characterScanForCodePath : 1;
    unsigned m_disableSpacing : 1;
};

inline void TextRun::setTabSize(bool allow, const TabSize& size)
{
    m_allowTabs = allow;
    m_tabSize = size;
}

inline TextRun TextRun::isolatedCopy() const
{
    TextRun clone = *this;
    // We need to ensure a deep copy here, calling `clone.m_text.isolatedCopy()`
    // is insufficient (rdar://125823370).
    if (clone.m_text.is8Bit())
        clone.m_text = clone.m_text.span8();
    else
        clone.m_text = clone.m_text.span16();
    return clone;
}

TextStream& operator<<(TextStream&, const TextRun&);

} // namespace WebCore
