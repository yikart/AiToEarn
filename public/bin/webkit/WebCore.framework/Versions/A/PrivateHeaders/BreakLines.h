/*
 * Copyright (C) 2005-2023 Apple Inc. All rights reserved.
 * Copyright (C) 2011 Google Inc. All rights reserved.
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

#include <unicode/ubrk.h>
#include <wtf/ASCIICType.h>
#include <wtf/StdLibExtras.h>
#include <wtf/text/TextBreakIterator.h>
#include <wtf/unicode/CharacterNames.h>

namespace WebCore {

class BreakLines {
public:
    enum class NoBreakSpaceBehavior {
        Normal,
        Break,
    };
    enum class WordBreakBehavior {
        Normal,
        BreakAll,
        KeepAll,
        AutoPhrase,
    };
    enum class LineBreakRules {
        Normal, // Fast path available when using default line-breaking rules within ASCII.
        Special, // Uses ICU to handle special line-breaking rules.
    };
    template<LineBreakRules, WordBreakBehavior, NoBreakSpaceBehavior>
    static inline unsigned nextBreakablePosition(CachedLineBreakIteratorFactory&, size_t startPosition);

    static inline unsigned nextBreakablePosition(CachedLineBreakIteratorFactory& iterator, size_t startPosition)
    {
        return nextBreakablePosition<LineBreakRules::Normal, WordBreakBehavior::Normal, NoBreakSpaceBehavior::Normal>(iterator, startPosition);
    }

    static inline bool isBreakable(CachedLineBreakIteratorFactory&, unsigned startPosition, std::optional<unsigned>& nextBreakable, bool breakNBSP, bool canUseShortcut, bool keepAllWords, bool breakAnywhere);

private:

    // Iterator implementations.
    template<typename CharacterType, LineBreakRules, WordBreakBehavior, NoBreakSpaceBehavior>
    static inline size_t nextBreakablePosition(CachedLineBreakIteratorFactory&, std::span<const CharacterType> string, size_t startPosition);

    template<typename CharacterType, NoBreakSpaceBehavior>
    static inline size_t nextBreakableSpace(std::span<const CharacterType> string, size_t startPosition);

    static inline unsigned nextCharacter(CachedLineBreakIteratorFactory&, unsigned startPosition);

    // Helper functions.
    enum BreakClass : uint16_t;
    template<LineBreakRules, NoBreakSpaceBehavior>
    static inline BreakClass classify(UChar character);

    template<NoBreakSpaceBehavior>
    static inline bool isBreakableSpace(UChar character);

    // Data types.
    enum BreakClass : uint16_t {
        // See UAX14 and LineBreak.txt
        // https://www.unicode.org/Public/UCD/latest/ucd/LineBreak.txt
        kIndeterminate = 0,
        kAL = 1,
        kID = 1 << 1,
        kCM = 1 << 2,
        kOP = 1 << 3,
        kCP = 1 << 4,
        kCL = 1 << 5,
        kGL = 1 << 6,
        kQU = 1 << 7,
        kSP = 1 << 8,
        kNU = kAL,
        kWeird = 1 << 15,
        // Currently we map
        //     1. HL to AL
        //     2. H2 and H3 to ID
        // We also don't distinguish AL and NU.
        // If we pull more logic into isBreakable, these may need to be distinguished.
    };

    template<typename CharacterType>
    struct CharacterInfo {
        CharacterType id { 0 };
        BreakClass type { kIndeterminate };
        CharacterInfo(CharacterType character = 0)
            : id(character)
            , type(kIndeterminate)
        { }
        inline void set(CharacterType character)
        {
            id = character;
            type = kIndeterminate;
        }
        operator CharacterType() const { return id; }
    };

    class LineBreakTable {
    public:
        static constexpr UChar firstCharacter = '!';
        static constexpr UChar lastCharacter = 0xFF;
        static constexpr unsigned rowCount = lastCharacter - firstCharacter + 1;
        static constexpr unsigned columnCount = (lastCharacter - firstCharacter) / 8 + 1;

        static inline bool unsafeLookup(UChar before, UChar after) // Must range check before calling.
        {
            const unsigned beforeIndex = before - firstCharacter;
            const unsigned afterIndex = after - firstCharacter;
            return breakTable[beforeIndex][afterIndex / 8] & (1 << (afterIndex % 8));
        }
    private:
        WEBCORE_EXPORT static const std::array<std::array<uint8_t, columnCount>, rowCount> breakTable;
    };
    static const LineBreakTable lineBreakTable;
};


template<BreakLines::NoBreakSpaceBehavior nonBreakingSpaceBehavior>
inline bool BreakLines::isBreakableSpace(UChar character)
{
    switch (character) {
    case ' ':
    case '\n':
    case '\t':
        return true;
    case noBreakSpace:
        return nonBreakingSpaceBehavior == NoBreakSpaceBehavior::Break;
    default:
        return false;
    }
}

template<typename CharacterType, BreakLines::LineBreakRules shortcutRules, BreakLines::WordBreakBehavior words, BreakLines::NoBreakSpaceBehavior nonBreakingSpaceBehavior>
inline size_t BreakLines::nextBreakablePosition(CachedLineBreakIteratorFactory& lineBreakIteratorFactory, std::span<const CharacterType> string, size_t startPosition)
{
    // Don't break if positioned at start of primary context and there is no prior context.
    auto priorContextLength = lineBreakIteratorFactory.priorContext().length();
    if (!startPosition && !priorContextLength) {
        if (string.size() <= 1)
            return string.size();
        startPosition++;
    }

    CharacterInfo<CharacterType> beforeBefore(startPosition > 1 ? string[startPosition - 2]
        : static_cast<CharacterType>(lineBreakIteratorFactory.priorContext().secondToLastCharacter()));
    CharacterInfo<CharacterType> before(startPosition > 0 ? string[startPosition - 1]
        : static_cast<CharacterType>(lineBreakIteratorFactory.priorContext().lastCharacter()));
    CharacterInfo<CharacterType> after;

    std::optional<size_t> nextBreak;
    for (size_t i = startPosition; i < string.size(); beforeBefore = before, before = after, ++i) {
        after.set(string[i]);

        // Breakable spaces.
        if (isBreakableSpace<nonBreakingSpaceBehavior>(after))
            return i;

        // ASCII rapid lookup.
        if constexpr (shortcutRules == LineBreakRules::Normal) { // Not valid for 'loose' line-breaking.
            // Don't allow line breaking between '-' and a digit if the '-' may mean a minus sign in the context,
            // while allow breaking in 'ABCD-1234' and '1234-5678' which may be in long URLs.
            if (before == '-' && isASCIIDigit(after)) {
                if (isASCIIAlphanumeric(beforeBefore))
                    return i;
                continue;
            }

            // If both characters are ASCII, use a lookup table for enhanced speed
            // and for compatibility with other browsers (see comments on lineBreakTable for details).
            if (before <= lineBreakTable.lastCharacter && after <= lineBreakTable.lastCharacter) {
                if (before >= lineBreakTable.firstCharacter && after >= lineBreakTable.firstCharacter) {
                    if (lineBreakTable.unsafeLookup(before, after))
                        return i;
                } // Else at least one is an ASCII control character; don't break.
                continue;
            }
        }

        // Non-ASCII rapid lookup.
        if constexpr (words != WordBreakBehavior::AutoPhrase) {
            if (!before.type)
                before.type = classify<shortcutRules, nonBreakingSpaceBehavior>(before);
            after.type = classify<shortcutRules, nonBreakingSpaceBehavior>(after);
            // Short-circuit the commonest cases: letter + letter.
            unsigned pair = before.type | after.type;
            // AL+AL SP+AL SP+QU AL+QU QU+QU QU+AL (after's SP is already filtered out).
            if (!(pair & ~(kSP | kAL | kQU))) {
                if constexpr (words == WordBreakBehavior::BreakAll) {
                    if (pair == kAL)
                        return i;
                }
                continue;
            }
            if ((pair | kAL) == (kID | kAL)) {
                if constexpr (words == WordBreakBehavior::KeepAll)
                    continue;
                return i;
            }
            // Handle special cases.
            if (pair & (kGL | kQU) && !(pair & kWeird)) // Keep nbsp high in our list.
                continue;
            if (after.type == kCM) {
                after.type = before.type;
                continue;
            }
            if constexpr (shortcutRules == LineBreakRules::Normal) {
                if (!(pair & kWeird)) {
                    // Handle some common and obvious punctuation behaviors.
                    if (pair & (kCL | kCP | kOP)) {
                        if (after.type == kCL || after.type == kCP || before.type == kOP)
                            continue;
                        if (pair & kID)
                            return i;
                    }
                }
            }
        }

        // ICU lookup (slow).
        if (!nextBreak || nextBreak.value() < i) {
            auto& breakIterator = lineBreakIteratorFactory.get();
            nextBreak = breakIterator.following(i - 1);
        }
        // Fast forward while our behavior matches ICU.
        if (nextBreak && i < nextBreak.value()) {
            for (size_t max = std::min(nextBreak.value(), string.size() - 1); i < max; beforeBefore = before, before = after, ++i) {
                CharacterType lookahead = string[i + 1];
                if ((lookahead <= lineBreakTable.lastCharacter && !isASCIIAlpha(lookahead))
                    || (nonBreakingSpaceBehavior == NoBreakSpaceBehavior::Break && lookahead == noBreakSpace))
                    break;
            }
        }
        if (i == nextBreak && !isBreakableSpace<nonBreakingSpaceBehavior>(before))
            return i;
    }

    return string.size();
}

template<typename CharacterType, BreakLines::NoBreakSpaceBehavior nonBreakingSpaceBehavior>
inline size_t BreakLines::nextBreakableSpace(std::span<const CharacterType> string, size_t startPosition)
{
    // FIXME: Use ICU instead.
    for (size_t i = startPosition; i < string.size(); ++i) {
        if (isBreakableSpace<nonBreakingSpaceBehavior>(string[i]))
            return i;
        // FIXME: This should either be in isBreakableSpace (though previous attempts broke the world) or should use ICU instead.
        if (string[i] == zeroWidthSpace)
            return i;
        if (string[i] == ideographicSpace)
            return i + 1;
    }
    return string.size();
}

inline unsigned BreakLines::nextCharacter(CachedLineBreakIteratorFactory& lineBreakIteratorFactory, unsigned startPosition)
{
    auto stringView = lineBreakIteratorFactory.stringView();
    ASSERT(startPosition <= stringView.length());
    // FIXME: Can/Should we implement this using a Shared Iterator (performance issue)
    // https://bugs.webkit.org/show_bug.cgi?id=197876
    NonSharedCharacterBreakIterator iterator(stringView);
    std::optional<unsigned> next = ubrk_following(iterator, startPosition);
    return next.value_or(stringView.length());
}

template<BreakLines::LineBreakRules rules, BreakLines::WordBreakBehavior words, BreakLines::NoBreakSpaceBehavior spaces>
inline unsigned BreakLines::nextBreakablePosition(CachedLineBreakIteratorFactory& lineBreakIteratorFactory, size_t startPosition)
{
    auto stringView = lineBreakIteratorFactory.stringView();

    if (stringView.is8Bit()) {
        return words == WordBreakBehavior::KeepAll
            ? nextBreakableSpace<LChar, spaces>(stringView.span8(), startPosition)
            : nextBreakablePosition<LChar, rules, words, spaces>(lineBreakIteratorFactory, stringView.span8(), startPosition);
    }
    return words == WordBreakBehavior::KeepAll
        ? nextBreakableSpace<UChar, spaces>(stringView.span16(), startPosition)
        : nextBreakablePosition<UChar, rules, words, spaces>(lineBreakIteratorFactory, stringView.span16(), startPosition);
}


inline bool BreakLines::isBreakable(CachedLineBreakIteratorFactory& lineBreakIteratorFactory, unsigned startPosition, std::optional<unsigned>& nextBreakable, bool breakNBSP, bool canUseShortcut, bool keepAllWords, bool breakAnywhere)
{
    if (nextBreakable && nextBreakable.value() >= startPosition)
        return startPosition == nextBreakable;

    if (breakAnywhere)
        return startPosition == nextCharacter(lineBreakIteratorFactory, startPosition);

    if (keepAllWords) {
        if (breakNBSP)
            return startPosition == nextBreakablePosition<LineBreakRules::Special, WordBreakBehavior::KeepAll, NoBreakSpaceBehavior::Break>(lineBreakIteratorFactory, startPosition);
        return startPosition == nextBreakablePosition<LineBreakRules::Special, WordBreakBehavior::KeepAll, NoBreakSpaceBehavior::Normal>(lineBreakIteratorFactory, startPosition);
    }

    if (canUseShortcut) {
        if (breakNBSP)
            return startPosition == nextBreakablePosition<LineBreakRules::Normal, WordBreakBehavior::Normal, NoBreakSpaceBehavior::Break>(lineBreakIteratorFactory, startPosition);
        return startPosition == nextBreakablePosition<LineBreakRules::Normal, WordBreakBehavior::Normal, NoBreakSpaceBehavior::Normal>(lineBreakIteratorFactory, startPosition);
    }

    if (breakNBSP)
        return startPosition == nextBreakablePosition<LineBreakRules::Special, WordBreakBehavior::Normal, NoBreakSpaceBehavior::Break>(lineBreakIteratorFactory, startPosition);

    return startPosition == nextBreakablePosition<LineBreakRules::Special, WordBreakBehavior::Normal, NoBreakSpaceBehavior::Normal>(lineBreakIteratorFactory, startPosition);
}

template<BreakLines::LineBreakRules rules, BreakLines::NoBreakSpaceBehavior nonBreakingSpaceBehavior>
inline BreakLines::BreakClass BreakLines::classify(UChar character)
{
    // This function is optimized for letters and NBSP.
    // See LineBreak.txt for classification.

    static constexpr UChar blockLast3 = ~0x07;
    static constexpr UChar blockLast4 = ~0x0F;
    static constexpr UChar blockLast6 = ~0x3F;
    static constexpr UChar blockLast7 = ~0x7F;
    static constexpr UChar blockLast8 = ~0xFF;

    switch ((character & blockLast7) / 0x80) {
        // Compilers are not smart enough to make a jump table if the step is not 1.
    case 0x0000 / 0x80: // ASCII
        switch ((character & blockLast4) / 0x10) {
        case 0x0000 / 0x10:
            return kWeird;
        case 0x0010 / 0x10:
            return kCM;
        case 0x0020 / 0x10:
            if (character == 0x0020) // space
                return kSP;
            if (character == 0x0022 || character == 0x0027)
                return kQU;
            if (character == 0x0028)
                return kOP;
            if (character == 0x0029)
                return kCP;
            return kWeird;
        case 0x0030 / 0x10:
            if (character <= 0x0039) // Numbers.
                return kNU;
            return kWeird;
        case 0x0040 / 0x10:
            return kAL;
        case 0x0050 / 0x10:
            if (character <= 0x005A)
                return kAL;
            if (character == 0x005B)
                return kOP;
            if (character == 0x005D)
                return kCP;
            return kWeird;
        case 0x0060 / 0x10:
            return kAL;
        case 0x0070 / 0x10:
            if (character <= 0x007A)
                return kAL;
            if (character == 0x007B)
                return kOP;
            if (character == 0x007D)
                return kCL;
            return kWeird;
        default:
            return kWeird;
        }
    case 0x0080 / 0x80: // Latin-1
        if (character == 0x00A0) // noBreakSpace
            return nonBreakingSpaceBehavior == NoBreakSpaceBehavior::Normal ? kGL : kSP;
        if (character > 0x00C0)
            return kAL;
        if (character == 0x00A1 || character == 0x00BF)
            return kOP;
        if (character == 0x00AB || character == 0x00BB)
            return kQU;
        return kWeird;
    case 0x0100 / 0x80:
    case 0x0180 / 0x80:
    case 0x0200 / 0x80:
        return kAL;
    case 0x0280 / 0x80:
        switch (character) {
        case 0x02C8:
        case 0x02CC:
        case 0x02DF:
            return kWeird;
        default:
            return kAL;
        }
    case 0x0300 / 0x80:
        if (character == 0x034F || (0x035C <= character && character <= 0x0362))
            return kGL;
        if (character < 0x370)
            return kCM;
        if (UNLIKELY(character == 0x037E))
            return kWeird;
        return kAL;
    case 0x0380 / 0x80:
    case 0x0400 / 0x80:
        return kAL;
    case 0x0480 / 0x80:
        if (0x0483 <= character && character <= 0x0489)
            return kCM;
        return kAL;
    case 0x0500 / 0x80:
        return kAL;
    case 0x0580 / 0x80:
        if (character <= 0x0588 || 0x05C8 <= character)
            return kAL; // WARNING: Some of these are actually HL.
        if (0x0591 <= character && character <= 0x05BD)
            return kCM;
        // 0x05BE to 0x05C7 is mixed up.
        switch (character) {
        case 0x05BF:
        case 0x05C1:
        case 0x05C2:
        case 0x05C4:
        case 0x05C5:
        case 0x05C7:
            return kCM;
        default:
            return kWeird;
        }
    case 0x0600 / 0x80:
    case 0x0680 / 0x80:
    case 0x0700 / 0x80:
    case 0x0780 / 0x80:
    case 0x0800 / 0x80:
    case 0x0880 / 0x80:
    case 0x0900 / 0x80:
    case 0x0980 / 0x80:
    case 0x1000 / 0x80:
    case 0x1080 / 0x80:
    case 0x1100 / 0x80:
    case 0x1180 / 0x80:
    case 0x1200 / 0x80:
    case 0x1280 / 0x80:
    case 0x1300 / 0x80:
    case 0x1380 / 0x80:
    case 0x1400 / 0x80:
    case 0x1480 / 0x80:
    case 0x1500 / 0x80:
    case 0x1580 / 0x80:
    case 0x1600 / 0x80:
    case 0x1680 / 0x80:
    case 0x1700 / 0x80:
    case 0x1780 / 0x80:
    case 0x1800 / 0x80:
    case 0x1880 / 0x80:
    case 0x1900 / 0x80:
    case 0x1980 / 0x80:
        return kWeird;
    case 0x2000 / 0x80:
        if (character == 0x2018 || character == 0x2019)
            return kQU;
        return kWeird;
    // FIXME: Continue bitmask switch up to 2E80.
    }

    // CJK
    if (0x2E80 <= character && character <= 0xA4CF) {
        if ((character & blockLast8) == 0x3000) {
            if (character <= 0x303F) {
                // This block (0x3000-0x303F) is categorically very mixed up.
                switch (character & 0x1F) {
                case 0x3001 & 0x1F:
                case 0x3002 & 0x1F:
                case 0x3009 & 0x1F:
                case 0x300B & 0x1F:
                case 0x300D & 0x1F:
                case 0x300F & 0x1F:
                case 0x3011 & 0x1F:
                case 0x3015 & 0x1F:
                case 0x3017 & 0x1F:
                case 0x3019 & 0x1F:
                case 0x301B & 0x1F:
                case 0x301E & 0x1F:
                case 0x301F & 0x1F:
                    return kCL;
                case 0x3008 & 0x1F:
                case 0x300A & 0x1F:
                case 0x300C & 0x1F:
                case 0x300E & 0x1F:
                case 0x3010 & 0x1F:
                case 0x3016 & 0x1F:
                case 0x3014 & 0x1F:
                case 0x3018 & 0x1F:
                case 0x301A & 0x1F:
                case 0x301D & 0x1F:
                    return kOP;
                default:
                    return kWeird;
                }
            }
            // This block (0x3040-0x30FF) is tangled up and sensitive to 'line-break'.
            return kWeird;
        }
        if (UNLIKELY((character & blockLast4) == 0x31F0)) // Small Kana.
            return kWeird;
        if (UNLIKELY((character & blockLast3) == 0x3248))
            return kAL;
        if (UNLIKELY((character & blockLast6) == 0x4DC0))
            return kAL;
        if (UNLIKELY(character == 0xA015))
            return kWeird;
        return kID;
    }
    // Precomposed Hangul
    if (0xAC00 <= character && character <= 0xD7AF)
        return kID; // WARNING: These are actually H2 or H3.
    // More CJK
    if (0xF900 <= character && character <= 0XFAFF)
        return kID;

    return kWeird;
}

} // namespace WebCore
