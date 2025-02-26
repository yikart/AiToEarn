/*
 * Copyright (C) 2004 Apple Inc.  All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. 
 */

#pragma once

#include "EditingBoundary.h"
#include "VisibleSelection.h"

namespace WebCore {

class Node;
class LayoutUnit;
class VisiblePosition;
class SimplifiedBackwardsTextIterator;
class TextIterator;

enum class WordSide : bool { RightWordIfOnBoundary, LeftWordIfOnBoundary };

// words
WEBCORE_EXPORT VisiblePosition startOfWord(const VisiblePosition&, WordSide = WordSide::RightWordIfOnBoundary);
WEBCORE_EXPORT VisiblePosition endOfWord(const VisiblePosition&, WordSide = WordSide::RightWordIfOnBoundary);
WEBCORE_EXPORT VisiblePosition previousWordPosition(const VisiblePosition&);
WEBCORE_EXPORT VisiblePosition nextWordPosition(const VisiblePosition&);
WEBCORE_EXPORT VisiblePosition rightWordPosition(const VisiblePosition&, bool skipsSpaceWhenMovingRight);
WEBCORE_EXPORT VisiblePosition leftWordPosition(const VisiblePosition&, bool skipsSpaceWhenMovingRight);
bool isStartOfWord(const VisiblePosition&);

// sentences
WEBCORE_EXPORT VisiblePosition startOfSentence(const VisiblePosition&);
WEBCORE_EXPORT VisiblePosition endOfSentence(const VisiblePosition&);
WEBCORE_EXPORT VisiblePosition previousSentencePosition(const VisiblePosition&);
WEBCORE_EXPORT VisiblePosition nextSentencePosition(const VisiblePosition&);

// lines
WEBCORE_EXPORT VisiblePosition startOfLine(const VisiblePosition&);
WEBCORE_EXPORT VisiblePosition endOfLine(const VisiblePosition&);
WEBCORE_EXPORT VisiblePosition previousLinePosition(const VisiblePosition&, LayoutUnit lineDirectionPoint, EditableType = ContentIsEditable);
WEBCORE_EXPORT VisiblePosition nextLinePosition(const VisiblePosition&, LayoutUnit lineDirectionPoint, EditableType = ContentIsEditable);
WEBCORE_EXPORT bool inSameLine(const VisiblePosition&, const VisiblePosition&);
WEBCORE_EXPORT bool isStartOfLine(const VisiblePosition&);
WEBCORE_EXPORT bool isEndOfLine(const VisiblePosition&);
VisiblePosition logicalStartOfLine(const VisiblePosition&, bool* reachedBoundary = nullptr);
VisiblePosition logicalEndOfLine(const VisiblePosition&, bool* reachedBoundary = nullptr);
bool isLogicalEndOfLine(const VisiblePosition&);
VisiblePosition leftBoundaryOfLine(const VisiblePosition&, TextDirection, bool* reachedBoundary);
VisiblePosition rightBoundaryOfLine(const VisiblePosition&, TextDirection, bool* reachedBoundary);

// paragraphs (perhaps a misnomer, can be divided by line break elements)
WEBCORE_EXPORT VisiblePosition startOfParagraph(const VisiblePosition&, EditingBoundaryCrossingRule = CannotCrossEditingBoundary);
WEBCORE_EXPORT VisiblePosition endOfParagraph(const VisiblePosition&, EditingBoundaryCrossingRule = CannotCrossEditingBoundary);
VisiblePosition startOfNextParagraph(const VisiblePosition&);
WEBCORE_EXPORT VisiblePosition previousParagraphPosition(const VisiblePosition&, LayoutUnit x);
WEBCORE_EXPORT VisiblePosition nextParagraphPosition(const VisiblePosition&, LayoutUnit x);
WEBCORE_EXPORT bool isStartOfParagraph(const VisiblePosition&, EditingBoundaryCrossingRule = CannotCrossEditingBoundary);
WEBCORE_EXPORT bool isEndOfParagraph(const VisiblePosition&, EditingBoundaryCrossingRule = CannotCrossEditingBoundary);
bool inSameParagraph(const VisiblePosition&, const VisiblePosition&, EditingBoundaryCrossingRule = CannotCrossEditingBoundary);
bool isBlankParagraph(const VisiblePosition&);

// blocks (true paragraphs; line break elements don't break blocks)
VisiblePosition startOfBlock(const VisiblePosition&, EditingBoundaryCrossingRule = CannotCrossEditingBoundary);
VisiblePosition endOfBlock(const VisiblePosition&, EditingBoundaryCrossingRule = CannotCrossEditingBoundary);
bool inSameBlock(const VisiblePosition&, const VisiblePosition&);
bool isStartOfBlock(const VisiblePosition&);
bool isEndOfBlock(const VisiblePosition&);

// document
WEBCORE_EXPORT VisiblePosition startOfDocument(const Node*);
WEBCORE_EXPORT VisiblePosition endOfDocument(const Node*);
WEBCORE_EXPORT VisiblePosition startOfDocument(const VisiblePosition&);
WEBCORE_EXPORT VisiblePosition endOfDocument(const VisiblePosition&);
WEBCORE_EXPORT bool isStartOfDocument(const VisiblePosition&);
WEBCORE_EXPORT bool isEndOfDocument(const VisiblePosition&);

// editable content
WEBCORE_EXPORT VisiblePosition startOfEditableContent(const VisiblePosition&);
WEBCORE_EXPORT VisiblePosition endOfEditableContent(const VisiblePosition&);
WEBCORE_EXPORT bool isEndOfEditableOrNonEditableContent(const VisiblePosition&);

WEBCORE_EXPORT bool atBoundaryOfGranularity(const VisiblePosition&, TextGranularity, SelectionDirection);
WEBCORE_EXPORT bool withinTextUnitOfGranularity(const VisiblePosition&, TextGranularity, SelectionDirection);
WEBCORE_EXPORT VisiblePosition positionOfNextBoundaryOfGranularity(const VisiblePosition&, TextGranularity, SelectionDirection);
WEBCORE_EXPORT std::optional<SimpleRange> enclosingTextUnitOfGranularity(const VisiblePosition&, TextGranularity, SelectionDirection);
WEBCORE_EXPORT std::ptrdiff_t distanceBetweenPositions(const VisiblePosition&, const VisiblePosition&);
WEBCORE_EXPORT std::optional<SimpleRange> wordRangeFromPosition(const VisiblePosition&);
WEBCORE_EXPORT VisiblePosition closestWordBoundaryForPosition(const VisiblePosition& position);
WEBCORE_EXPORT void charactersAroundPosition(const VisiblePosition&, char32_t& oneAfter, char32_t& oneBefore, char32_t& twoBefore);
WEBCORE_EXPORT std::optional<SimpleRange> rangeExpandedAroundPositionByCharacters(const VisiblePosition&, int numberOfCharactersToExpand);
WEBCORE_EXPORT std::optional<SimpleRange> rangeExpandedAroundRangeByCharacters(const VisibleSelection&, uint64_t numberOfCharactersToExpandBackwards, uint64_t numberOfCharactersToExpandForwards);
WEBCORE_EXPORT std::optional<SimpleRange> rangeExpandedByCharactersInDirectionAtWordBoundary(const VisiblePosition&, int numberOfCharactersToExpand, SelectionDirection);
enum class WithinWordBoundary : bool { No, Yes };
WEBCORE_EXPORT std::pair<VisiblePosition, WithinWordBoundary> wordBoundaryForPositionWithoutCrossingLine(const VisiblePosition&);

// helper function
enum BoundarySearchContextAvailability { DontHaveMoreContext, MayHaveMoreContext };
typedef unsigned (*BoundarySearchFunction)(StringView, unsigned offset, BoundarySearchContextAvailability, bool& needMoreContext);
unsigned startWordBoundary(StringView, unsigned, BoundarySearchContextAvailability, bool&);
unsigned endWordBoundary(StringView, unsigned, BoundarySearchContextAvailability, bool&);
unsigned startSentenceBoundary(StringView, unsigned, BoundarySearchContextAvailability, bool&);
unsigned endSentenceBoundary(StringView, unsigned, BoundarySearchContextAvailability, bool&);
unsigned suffixLengthForRange(const SimpleRange&, Vector<UChar, 1024>&);
unsigned prefixLengthForRange(const SimpleRange&, Vector<UChar, 1024>&);
unsigned backwardSearchForBoundaryWithTextIterator(SimplifiedBackwardsTextIterator&, Vector<UChar, 1024>&, unsigned, BoundarySearchFunction);
unsigned forwardSearchForBoundaryWithTextIterator(TextIterator&, Vector<UChar, 1024>&, unsigned, BoundarySearchFunction);
RefPtr<Node> findStartOfParagraph(Node*, Node*, Node*, int&, Position::AnchorType&, EditingBoundaryCrossingRule);
RefPtr<Node> findEndOfParagraph(Node*, Node*, Node*, int&, Position::AnchorType&, EditingBoundaryCrossingRule);

} // namespace WebCore
