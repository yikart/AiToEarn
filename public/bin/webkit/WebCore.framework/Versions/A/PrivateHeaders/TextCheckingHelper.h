/*
 * Copyright (C) 2006-2020 Apple Inc. All rights reserved.
 * Copyright (C) 2008 Nokia Corporation and/or its subsidiary(-ies)
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

#include "ExceptionOr.h"
#include "SimpleRange.h"
#include "TextChecking.h"

namespace WebCore {

class EditorClient;
class LocalFrame;
class Position;
class TextCheckerClient;
class VisibleSelection;

struct TextCheckingResult;

// FIXME: Should move this class to its own header.
class TextCheckingParagraph {
public:
    explicit TextCheckingParagraph(const SimpleRange& checkingAndAutomaticReplacementRange);
    TextCheckingParagraph(const SimpleRange& checkingRange, const SimpleRange& automaticReplacementRange, const std::optional<SimpleRange>& paragraphRange);

    uint64_t rangeLength() const;
    SimpleRange subrange(CharacterRange) const;
    ExceptionOr<uint64_t> offsetTo(const Position&) const;
    void expandRangeToNextEnd();

    StringView text() const;

    bool isEmpty() const;

    uint64_t checkingStart() const;
    uint64_t checkingEnd() const;
    uint64_t checkingLength() const;
    StringView checkingSubstring() const { return text().substring(checkingStart(), checkingLength()); }

    uint64_t automaticReplacementStart() const;
    uint64_t automaticReplacementLength() const;

    bool checkingRangeMatches(CharacterRange range) const { return range.location == checkingStart() && range.length == checkingLength(); }
    bool isCheckingRangeCoveredBy(CharacterRange range) const { return range.location <= checkingStart() && range.location + range.length >= checkingStart() + checkingLength(); }
    bool checkingRangeCovers(CharacterRange range) const { return range.location < checkingEnd() && range.location + range.length > checkingStart(); }

    const SimpleRange& paragraphRange() const;

private:
    void invalidateParagraphRangeValues();
    const SimpleRange& offsetAsRange() const;

    SimpleRange m_checkingRange;
    SimpleRange m_automaticReplacementRange;
    mutable std::optional<SimpleRange> m_paragraphRange;
    mutable std::optional<SimpleRange> m_offsetAsRange;
    mutable String m_text;
    mutable std::optional<uint64_t> m_checkingStart;
    mutable std::optional<uint64_t> m_checkingLength;
    mutable std::optional<uint64_t> m_automaticReplacementStart;
    mutable std::optional<uint64_t> m_automaticReplacementLength;
};

class TextCheckingHelper {
public:
    TextCheckingHelper(EditorClient&, const SimpleRange&);

    struct MisspelledWord {
        String word;
        uint64_t offset { 0 };
    };
    struct UngrammaticalPhrase {
        String phrase;
        uint64_t offset { 0 };
        GrammarDetail detail;
    };

    MisspelledWord findFirstMisspelledWord() const;
    UngrammaticalPhrase findFirstUngrammaticalPhrase() const;
    std::variant<MisspelledWord, UngrammaticalPhrase> findFirstMisspelledWordOrUngrammaticalPhrase(bool checkGrammar) const;

    std::optional<SimpleRange> markAllMisspelledWords() const; // Returns the range of the first misspelled word.
    void markAllUngrammaticalPhrases() const;

    TextCheckingGuesses guessesForMisspelledWordOrUngrammaticalPhrase(bool checkGrammar) const;

private:
    enum class Operation : bool { FindFirst, MarkAll };
    std::pair<MisspelledWord, std::optional<SimpleRange>> findMisspelledWords(Operation) const; // Returns the first.
    UngrammaticalPhrase findUngrammaticalPhrases(Operation) const; // Returns the first.
    bool unifiedTextCheckerEnabled() const;
    int findUngrammaticalPhrases(Operation, const Vector<GrammarDetail>&, uint64_t badGrammarPhraseLocation, uint64_t startOffset, uint64_t endOffset) const;

    EditorClient& m_client;
    SimpleRange m_range;
};

void checkTextOfParagraph(TextCheckerClient&, StringView, OptionSet<TextCheckingType>, Vector<TextCheckingResult>&, const VisibleSelection& currentSelection);

bool unifiedTextCheckerEnabled(const LocalFrame*);
bool platformDrivenTextCheckerEnabled();
bool platformOrClientDrivenTextCheckerEnabled();

} // namespace WebCore
