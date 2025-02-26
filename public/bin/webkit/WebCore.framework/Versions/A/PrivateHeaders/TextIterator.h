/*
 * Copyright (C) 2004-2020 Apple Inc. All rights reserved.
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

#include "CharacterRange.h"
#include "FindOptions.h"
#include "InlineIteratorLogicalOrderTraversal.h"
#include "InlineIteratorTextBox.h"
#include "SimpleRange.h"
#include "TextIteratorBehavior.h"
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>

namespace WebCore {

class RenderTextFragment;

// Character ranges based on characters from the text iterator.
WEBCORE_EXPORT uint64_t characterCount(const SimpleRange&, TextIteratorBehaviors = { });
CharacterRange characterRange(const BoundaryPoint& start, const SimpleRange&, TextIteratorBehaviors = { });
CharacterRange characterRange(const SimpleRange& scope, const SimpleRange&, TextIteratorBehaviors = { });
BoundaryPoint resolveCharacterLocation(const SimpleRange& scope, uint64_t, TextIteratorBehaviors = { });
WEBCORE_EXPORT SimpleRange resolveCharacterRange(const SimpleRange& scope, CharacterRange, TextIteratorBehaviors = { });

// Text from the text iterator.
WEBCORE_EXPORT String plainText(const SimpleRange&, TextIteratorBehaviors = { }, bool isDisplayString = false);
WEBCORE_EXPORT bool hasAnyPlainText(const SimpleRange&, TextIteratorBehaviors = { });
WEBCORE_EXPORT String plainTextReplacingNoBreakSpace(const SimpleRange&, TextIteratorBehaviors = { }, bool isDisplayString = false);

// Find within the document, based on the text from the text iterator.
WEBCORE_EXPORT SimpleRange findPlainText(const SimpleRange&, const String&, FindOptions);
WEBCORE_EXPORT SimpleRange findClosestPlainText(const SimpleRange&, const String&, FindOptions, uint64_t targetCharacterOffset);
WEBCORE_EXPORT bool containsPlainText(const String& document, const String&, FindOptions); // Lets us use the search algorithm on a string.
WEBCORE_EXPORT String foldQuoteMarks(const String&);

// FIXME: Move this somewhere else in the editing directory. It doesn't belong in the header with TextIterator.
bool isRendererReplacedElement(RenderObject*, TextIteratorBehaviors = { });

// FIXME: Move each iterator class into a separate header file.

class BitStack {
public:
    void push(bool);
    void pop();
    bool top() const;

private:
    unsigned m_size { 0 };
    Vector<unsigned, 1> m_words;
};

class TextIteratorCopyableText {
public:
    StringView text() const { return m_singleCharacter ? StringView(span(m_singleCharacter)) : StringView(m_string).substring(m_offset, m_length); }
    void appendToStringBuilder(StringBuilder&) const;

    void reset();
    void set(String&&);
    void set(String&&, unsigned offset, unsigned length);
    void set(UChar);

private:
    UChar m_singleCharacter { 0 };
    String m_string;
    unsigned m_offset { 0 };
    unsigned m_length { 0 };
};

// Iterates through the DOM range, returning all the text, and 0-length boundaries
// at points where replaced elements break up the text flow. The text is delivered in
// the chunks it's already stored in, to avoid copying any text.

bool shouldEmitNewlinesBeforeAndAfterNode(Node&);

class TextIterator {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(TextIterator, WEBCORE_EXPORT);
public:
    WEBCORE_EXPORT explicit TextIterator(const SimpleRange&, TextIteratorBehaviors = { });
    WEBCORE_EXPORT ~TextIterator();

    bool atEnd() const { return !m_positionNode; }
    WEBCORE_EXPORT void advance();

    StringView text() const { ASSERT(!atEnd()); return m_text; }
    WEBCORE_EXPORT SimpleRange range() const;
    WEBCORE_EXPORT Node* node() const;
    RefPtr<Node> protectedCurrentNode() const;

    const TextIteratorCopyableText& copyableText() const { ASSERT(!atEnd()); return m_copyableText; }
    void appendTextToStringBuilder(StringBuilder& builder) const { copyableText().appendToStringBuilder(builder); }

#if ENABLE(TREE_DEBUGGING)
    void showTreeForThis() const;
#endif
    String rendererTextForBehavior(RenderText& renderer) const { return m_behaviors.contains(TextIteratorBehavior::EmitsOriginalText) ? renderer.originalText() : renderer.text(); }

private:
    void init();
    void exitNode(Node*);
    bool shouldRepresentNodeOffsetZero();
    bool shouldEmitSpaceBeforeAndAfterNode(Node&);
    void representNodeOffsetZero();
    bool handleTextNode();
    bool handleReplacedElement();
    bool handleNonTextNode();
    void handleTextRun();
    void handleTextNodeFirstLetter(RenderTextFragment&);
    void emitCharacter(UChar, RefPtr<Node>&& characterNode, RefPtr<Node>&& offsetBaseNode, int textStartOffset, int textEndOffset);
    void emitText(Text& textNode, RenderText&, int textStartOffset, int textEndOffset);
    void revertToRemainingTextRun();

    Node* baseNodeForEmittingNewLine() const;

    RefPtr<Node> protectedStartContainer() const { return m_startContainer; }

    const TextIteratorBehaviors m_behaviors;

    // Current position, not necessarily of the text being returned, but position as we walk through the DOM tree.
    RefPtr<Node> m_currentNode;
    int m_offset { 0 };
    bool m_handledNode { false };
    bool m_handledChildren { false };
    BitStack m_fullyClippedStack;

    // The range.
    RefPtr<Node> m_startContainer;
    int m_startOffset { 0 };
    RefPtr<Node> m_endContainer;
    int m_endOffset { 0 };
    RefPtr<Node> m_pastEndNode;

    // The current text and its position, in the form to be returned from the iterator.
    RefPtr<Node> m_positionNode;
    mutable RefPtr<Node> m_positionOffsetBaseNode;
    mutable int m_positionStartOffset { 0 };
    mutable int m_positionEndOffset { 0 };
    TextIteratorCopyableText m_copyableText;
    StringView m_text;

    // Used when there is still some pending text from the current node; when these are false and null, we go back to normal iterating.
    RefPtr<Node> m_nodeForAdditionalNewline;
    InlineIterator::TextBoxIterator m_textRun;
    InlineIterator::TextLogicalOrderCache m_textRunLogicalOrderCache;

    // Used when iterating over :first-letter text to save pointer to remaining text box.
    InlineIterator::TextBoxIterator m_remainingTextRun;
    InlineIterator::TextLogicalOrderCache m_remainingTextRunLogicalOrderCache;

    // Used to point to RenderText object for :first-letter.
    SingleThreadWeakPtr<RenderText> m_firstLetterText;

    // Used to do the whitespace collapsing logic.
    RefPtr<Text> m_lastTextNode;
    bool m_lastTextNodeEndedWithCollapsedSpace { false };
    UChar m_lastCharacter { 0 };

    // Used when deciding whether to emit a "positioning" (e.g. newline) before any other content
    bool m_hasEmitted { false };

    // Used when deciding text fragment created by :first-letter should be looked into.
    bool m_handledFirstLetter { false };
};

// Iterates through the DOM range, returning all the text, and 0-length boundaries
// at points where replaced elements break up the text flow. The text comes back in
// chunks so as to optimize for performance of the iteration.
class SimplifiedBackwardsTextIterator {
public:
    WEBCORE_EXPORT explicit SimplifiedBackwardsTextIterator(const SimpleRange&);

    bool atEnd() const { return !m_positionNode; }
    WEBCORE_EXPORT void advance();

    StringView text() const { ASSERT(!atEnd()); return m_text; }
    WEBCORE_EXPORT SimpleRange range() const;
    Node* node() const { ASSERT(!atEnd()); return m_node.get(); }
    RefPtr<Node> protectedNode() const { return m_node.get(); }

private:
    void exitNode();
    bool handleTextNode();
    RenderText* handleFirstLetter(int& startOffset, int& offsetInNode);
    bool handleReplacedElement();
    bool handleNonTextNode();
    void emitCharacter(UChar, RefPtr<Node>&&, int startOffset, int endOffset);
    bool advanceRespectingRange(Node*);

    const TextIteratorBehaviors m_behaviors;

    // Current position, not necessarily of the text being returned, but position as we walk through the DOM tree.
    RefPtr<Node> m_node;
    int m_offset { 0 };
    bool m_handledNode { false };
    bool m_handledChildren { false };
    BitStack m_fullyClippedStack;

    // The range.
    RefPtr<Node> m_startContainer;
    int m_startOffset { 0 };
    RefPtr<Node> m_endContainer;
    int m_endOffset { 0 };
    
    // The current text and its position, in the form to be returned from the iterator.
    RefPtr<Node> m_positionNode;
    int m_positionStartOffset { 0 };
    int m_positionEndOffset { 0 };
    TextIteratorCopyableText m_copyableText;
    StringView m_text;

    // Used to do the whitespace logic.
    RefPtr<Text> m_lastTextNode;
    UChar m_lastCharacter { 0 };

    // Whether m_node has advanced beyond the iteration range (i.e. m_startContainer).
    bool m_havePassedStartContainer { false };

    // Should handle first-letter renderer in the next call to handleTextNode.
    bool m_shouldHandleFirstLetter { false };
};

// Builds on the text iterator, adding a character position so we can walk one
// character at a time, or faster, as needed. Useful for searching.
class CharacterIterator {
public:
    WEBCORE_EXPORT explicit CharacterIterator(const SimpleRange&, TextIteratorBehaviors = { });
    
    bool atEnd() const { return m_underlyingIterator.atEnd(); }
    WEBCORE_EXPORT void advance(int numCharacters);
    
    StringView text() const { return m_underlyingIterator.text().substring(m_runOffset); }
    WEBCORE_EXPORT SimpleRange range() const;

    bool atBreak() const { return m_atBreak; }
    unsigned characterOffset() const { return m_offset; }

private:
    TextIterator m_underlyingIterator;

    unsigned m_offset { 0 };
    unsigned m_runOffset { 0 };
    bool m_atBreak { true };
};
    
class BackwardsCharacterIterator {
public:
    explicit BackwardsCharacterIterator(const SimpleRange&);

    bool atEnd() const { return m_underlyingIterator.atEnd(); }
    void advance(int numCharacters);

    SimpleRange range() const;

private:
    SimplifiedBackwardsTextIterator m_underlyingIterator;

    unsigned m_offset { 0 };
    unsigned m_runOffset { 0 };
    bool m_atBreak { true };
};

// Similar to the TextIterator, except that the chunks of text returned are "well behaved", meaning
// they never split up a word. This is useful for spell checking and perhaps one day for searching as well.
class WordAwareIterator {
public:
    explicit WordAwareIterator(const SimpleRange&);

    bool atEnd() const { return !m_didLookAhead && m_underlyingIterator.atEnd(); }
    void advance();

    StringView text() const;

private:
    TextIterator m_underlyingIterator;

    // Text from the previous chunk from the text iterator.
    TextIteratorCopyableText m_previousText;

    // Many chunks from text iterator concatenated.
    Vector<UChar> m_buffer;

    // Did we have to look ahead in the text iterator to confirm the current chunk?
    bool m_didLookAhead { true };
};

constexpr TextIteratorBehaviors findIteratorOptions(FindOptions options = { })
{
    TextIteratorBehaviors iteratorOptions { TextIteratorBehavior::EntersTextControls, TextIteratorBehavior::ClipsToFrameAncestors, TextIteratorBehavior::EntersImageOverlays };
    if (!options.contains(FindOption::DoNotTraverseFlatTree))
        iteratorOptions.add(TextIteratorBehavior::TraversesFlatTree);
    return iteratorOptions;
}

inline CharacterRange characterRange(const BoundaryPoint& start, const SimpleRange& range, TextIteratorBehaviors behaviors)
{
    return { characterCount({ start, range.start }, behaviors), characterCount(range, behaviors) };
}

inline CharacterRange characterRange(const SimpleRange& scope, const SimpleRange& range, TextIteratorBehaviors behaviors)
{
    return characterRange(scope.start, range, behaviors);
}

inline BoundaryPoint resolveCharacterLocation(const SimpleRange& scope, uint64_t location, TextIteratorBehaviors behaviors)
{
    return resolveCharacterRange(scope, { location, 0 }, behaviors).start;
}

} // namespace WebCore

#if ENABLE(TREE_DEBUGGING)
// Outside the WebCore namespace for ease of invocation from the debugger.
void showTree(const WebCore::TextIterator&);
void showTree(const WebCore::TextIterator*);
#endif
