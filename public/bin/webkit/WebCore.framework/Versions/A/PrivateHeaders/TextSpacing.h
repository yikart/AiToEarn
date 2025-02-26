/*
 * Copyright (C) 2023 Apple Inc. All rights reserved.
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
#include <unicode/umachine.h>
#include <wtf/Forward.h>
#include <wtf/text/CharacterProperties.h>
#include <wtf/text/TextStream.h>
#include <wtf/unicode/CharacterNames.h>

namespace WebCore {

class Font;
class TextSpacingTrim;

namespace TextSpacing {

enum class CharacterClass : uint8_t {
    Undefined = 0,
    Ideograph = 1 << 0,
    NonIdeographLetter = 1 << 1,
    NonIdeographNumeral = 1 << 2,
    FullWidthOpeningPunctuation = 1 << 3,
    FullWidthClosingPunctuation = 1 << 4,
    FullWidthMiddleDotPunctuation = 1 << 5,
    FullWidthColonPunctuation = 1 << 6,
    FullWidthDotPunctuation = 1 << 7
};

struct CharactersData {
    char32_t previousCharacter { 0 };
    char32_t currentCharacter { 0 };
    char32_t nextCharacter { 0 };
    CharacterClass previousCharacterClass { };
    CharacterClass currentCharacterClass { };
    CharacterClass nextCharacterClass { };
};

// Classes are defined at https://www.w3.org/TR/css-text-4/#text-spacing-classes
CharacterClass characterClass(char32_t character);
struct SpacingState {
    bool operator==(const SpacingState&) const = default;
    CharacterClass lastCharacterClassFromPreviousRun { CharacterClass::Undefined };
};

bool isIdeograph(char32_t character);

RefPtr<Font> getHalfWidthFontIfNeeded(const Font&, const TextSpacingTrim&, CharactersData&);
} // namespace TextSpacing

class TextSpacingTrim {
public:
    enum class TrimType : uint8_t {
        SpaceAll = 0, // equivalent to None in text-spacing shorthand
        TrimAll,
        Auto
    };

    TextSpacingTrim() = default;
    TextSpacingTrim(TrimType trimType)
        : m_trim(trimType)
        { }

    bool isAuto() const { return m_trim == TrimType::Auto; }
    bool isSpaceAll() const { return m_trim == TrimType::SpaceAll; }
    bool shouldTrimSpacing(const TextSpacing::CharactersData&) const;
    friend bool operator==(const TextSpacingTrim&, const TextSpacingTrim&) = default;
    TrimType type() const { return m_trim; }
private:
    TrimType m_trim { TrimType::SpaceAll };
};

inline WTF::TextStream& operator<<(WTF::TextStream& ts, const TextSpacingTrim& value)
{
    // FIXME: add remaining values;
    switch (value.type()) {
    case TextSpacingTrim::TrimType::Auto:
        return ts << "auto";
    case TextSpacingTrim::TrimType::SpaceAll:
        return ts << "space-all";
    case TextSpacingTrim::TrimType::TrimAll:
        return ts << "trim-all";
    }
    return ts;
}

class TextAutospace {
public:
    enum class Type: uint8_t {
        Auto = 1 << 0,
        IdeographAlpha = 1 << 1,
        IdeographNumeric = 1 << 2,
        Normal = 1 << 3
    };

    using Options = OptionSet<Type>;

    TextAutospace() = default;
    TextAutospace(Options options)
        : m_options(options)
        { }

    bool isAuto() const { return m_options.contains(Type::Auto); }
    bool isNoAutospace() const { return m_options.isEmpty(); }
    bool isNormal() const { return m_options.contains(Type::Normal); }
    bool hasIdeographAlpha() const { return m_options.containsAny({ Type::IdeographAlpha, Type::Normal }); }
    bool hasIdeographNumeric() const { return m_options.containsAny({ Type::IdeographNumeric, Type::Normal }); }
    Options options() { return m_options; }
    friend bool operator==(const TextAutospace&, const TextAutospace&) = default;
    bool shouldApplySpacing(TextSpacing::CharacterClass firstCharacterClass, TextSpacing::CharacterClass secondCharacterClass) const;
    bool shouldApplySpacing(char32_t firstCharacter, char32_t secondCharacter) const;
    static float textAutospaceSize(const Font&);

private:
    Options m_options { };
};

inline WTF::TextStream& operator<<(WTF::TextStream& ts, const TextAutospace& value)
{
    // FIXME: add remaining values;
    if (value.isAuto())
        return ts << "auto";
    if (value.isNoAutospace())
        return ts << "no-autospace";
    if (value.isNormal())
        return ts << "normal";
    if (value.hasIdeographAlpha())
        ts << "ideograph-alpha";
    if (value.hasIdeographNumeric())
        ts << "ideograph-numeric";
    return ts;
}


} // namespace WebCore
