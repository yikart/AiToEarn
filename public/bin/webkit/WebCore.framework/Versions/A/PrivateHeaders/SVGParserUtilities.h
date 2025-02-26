/*
 * Copyright (C) 2002, 2003 The Karbon Developers
 * Copyright (C) 2006, 2007 Rob Buis <buis@kde.org>
 * Copyright (C) 2013-2024 Apple Inc. All rights reserved.
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
 */

#pragma once

#include "ParsingUtilities.h"
#include <wtf/Forward.h>

typedef std::pair<char32_t, char32_t> UnicodeRange;
typedef Vector<UnicodeRange> UnicodeRanges;

namespace WebCore {

class FloatPoint;
class FloatRect;

enum class SuffixSkippingPolicy {
    DontSkip,
    Skip
};

std::optional<float> parseNumber(StringParsingBuffer<LChar>&, SuffixSkippingPolicy = SuffixSkippingPolicy::Skip);
std::optional<float> parseNumber(StringParsingBuffer<UChar>&, SuffixSkippingPolicy = SuffixSkippingPolicy::Skip);
std::optional<float> parseNumber(StringView, SuffixSkippingPolicy = SuffixSkippingPolicy::Skip);

std::optional<std::pair<float, float>> parseNumberOptionalNumber(StringView);

std::optional<bool> parseArcFlag(StringParsingBuffer<LChar>&);
std::optional<bool> parseArcFlag(StringParsingBuffer<UChar>&);

std::optional<FloatPoint> parsePoint(StringView);
std::optional<FloatRect> parseRect(StringView);

std::optional<FloatPoint> parseFloatPoint(StringParsingBuffer<LChar>&);
std::optional<FloatPoint> parseFloatPoint(StringParsingBuffer<UChar>&);

std::optional<std::pair<UnicodeRanges, HashSet<String>>> parseKerningUnicodeString(StringView);
std::optional<HashSet<String>> parseGlyphName(StringView);

template<typename CharacterType> constexpr bool isSVGSpaceOrComma(CharacterType c)
{
    return isASCIIWhitespace(c) || c == ',';
}

template<typename CharacterType> constexpr bool skipOptionalSVGSpaces(const CharacterType*& ptr, const CharacterType* end)
{
    skipWhile<isASCIIWhitespace>(ptr, end);
    return ptr < end;
}

template<typename CharacterType> constexpr bool skipOptionalSVGSpaces(StringParsingBuffer<CharacterType>& characters)
{
    skipWhile<isASCIIWhitespace>(characters);
    return characters.hasCharactersRemaining();
}

template<typename CharacterType> constexpr bool skipOptionalSVGSpacesOrDelimiter(const CharacterType*& ptr, const CharacterType* end, char delimiter = ',')
{
    if (ptr < end && !isASCIIWhitespace(*ptr) && *ptr != delimiter)
        return false;
    if (skipOptionalSVGSpaces(ptr, end)) {
        if (ptr < end && *ptr == delimiter) {
            ptr++;
            skipOptionalSVGSpaces(ptr, end);
        }
    }
    return ptr < end;
}

template<typename CharacterType> constexpr bool skipOptionalSVGSpacesOrDelimiter(StringParsingBuffer<CharacterType>& characters, char delimiter = ',')
{
    if (!characters.hasCharactersRemaining())
        return false;

    if (!isASCIIWhitespace(*characters) && *characters != delimiter)
        return false;

    // There are only spaces in the remaining characters.
    if (!skipOptionalSVGSpaces(characters))
        return false;

    if (*characters != delimiter)
        return true;

    // A delimiter is hit. Skip the following spaces also e.g. " , ".
    return skipOptionalSVGSpaces(++characters);
}

} // namespace WebCore
