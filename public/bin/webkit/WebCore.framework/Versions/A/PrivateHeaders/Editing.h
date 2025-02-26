/*
 * Copyright (C) 2004, 2006, 2008, 2016 Apple Inc. All rights reserved.
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

#include "Position.h"
#include "TextIteratorBehavior.h"
#include <wtf/Forward.h>
#include <wtf/HashSet.h>
#include <wtf/unicode/CharacterNames.h>

namespace WebCore {

class Document;
class HTMLElement;
class HTMLImageElement;
class HTMLSpanElement;
class HTMLTextFormControlElement;
class RenderBlock;
class VisiblePosition;
class VisibleSelection;

struct SimpleRange;

enum class TextDirection : bool;

// -------------------------------------------------------------------------
// Node
// -------------------------------------------------------------------------

RefPtr<ContainerNode> highestEditableRoot(const Position&, EditableType = ContentIsEditable);

RefPtr<Node> highestEnclosingNodeOfType(const Position&, bool (*nodeIsOfType)(const Node&), EditingBoundaryCrossingRule = CannotCrossEditingBoundary, Node* stayWithin = nullptr);
RefPtr<Node> highestNodeToRemoveInPruning(Node*);
Element* lowestEditableAncestor(Node*);

Element* deprecatedEnclosingBlockFlowElement(Node*); // Use enclosingBlock instead.
RefPtr<Element> enclosingBlock(RefPtr<Node>, EditingBoundaryCrossingRule = CannotCrossEditingBoundary);
RefPtr<Element> enclosingTableCell(const Position&);
RefPtr<Node> enclosingEmptyListItem(const VisiblePosition&);
RefPtr<Element> enclosingAnchorElement(const Position&);
Element* enclosingElementWithTag(const Position&, const QualifiedName&);
RefPtr<Node> enclosingNodeOfType(const Position&, bool (*nodeIsOfType)(const Node&), EditingBoundaryCrossingRule = CannotCrossEditingBoundary);
HTMLSpanElement* tabSpanNode(Node*);
HTMLSpanElement* parentTabSpanNode(Node*);
RefPtr<Element> isLastPositionBeforeTable(const VisiblePosition&); // FIXME: Strange to name this isXXX, but return an element.
RefPtr<Element> isFirstPositionAfterTable(const VisiblePosition&); // FIXME: Strange to name this isXXX, but return an element.

// These two deliver leaf nodes as if the whole DOM tree were a linear chain of its leaf nodes.
Node* nextLeafNode(const Node*);
Node* previousLeafNode(const Node*);

WEBCORE_EXPORT int lastOffsetForEditing(const Node&);
int caretMinOffset(const Node&);
int caretMaxOffset(const Node&);

bool hasEditableStyle(const Node&, EditableType);
bool isEditableNode(const Node&);

// FIXME: editingIgnoresContent, canHaveChildrenForEditing, and isAtomicNode should be named to clarify how they differ.

// Returns true for nodes that either have no content, or have content that is ignored (skipped over) while editing.
// There are no VisiblePositions inside these nodes.
bool editingIgnoresContent(const Node&);

bool canHaveChildrenForEditing(const Node&);
bool isAtomicNode(const Node*);

bool isBlock(const Node&);
bool isBlockFlowElement(const Node&);
bool isInline(const Node&);
bool isMailBlockquote(const Node&);
bool isRenderedTable(const Node*);
bool isTableCell(const Node&);
bool isEmptyTableCell(const Node*);
bool isTableStructureNode(const Node&);
bool isListHTMLElement(Node*);
bool isListItem(const Node&);
bool isNodeRendered(const Node&);
bool isRenderedAsNonInlineTableImageOrHR(const Node*);
bool isNonTableCellHTMLBlockElement(const Node*);

bool isNodeVisiblyContainedWithin(Node&, const SimpleRange&);

Element* elementIfEquivalent(const Element&, Node&);

bool positionBeforeOrAfterNodeIsCandidate(Node&);

// -------------------------------------------------------------------------
// SimpleRange
// -------------------------------------------------------------------------

PositionRange positionsForRange(const SimpleRange&);
WEBCORE_EXPORT HashSet<RefPtr<HTMLImageElement>> visibleImageElementsInRangeWithNonLoadedImages(const SimpleRange&);
WEBCORE_EXPORT SimpleRange adjustToVisuallyContiguousRange(const SimpleRange&);

// -------------------------------------------------------------------------
// Position
// -------------------------------------------------------------------------

Position nextCandidate(const Position&);
Position previousCandidate(const Position&);

enum class SkipDisplayContents : bool { No, Yes };
Position nextVisuallyDistinctCandidate(const Position&, SkipDisplayContents = SkipDisplayContents::Yes);
Position previousVisuallyDistinctCandidate(const Position&);

Position firstPositionInOrBeforeNode(Node*);
Position lastPositionInOrAfterNode(Node*);

Position firstEditablePositionAfterPositionInRoot(const Position&, ContainerNode* root);
Position lastEditablePositionBeforePositionInRoot(const Position&, ContainerNode* root);

WEBCORE_EXPORT bool isEditablePosition(const Position&, EditableType = ContentIsEditable);
bool isRichlyEditablePosition(const Position&);
bool lineBreakExistsAtPosition(const Position&);
bool isAtUnsplittableElement(const Position&);

unsigned numEnclosingMailBlockquotes(const Position&);
void updatePositionForNodeRemoval(Position&, Node&);

WEBCORE_EXPORT TextDirection directionOfEnclosingBlock(const Position&);
TextDirection primaryDirectionForSingleLineRange(const Position& start, const Position& end);

// -------------------------------------------------------------------------
// VisiblePosition
// -------------------------------------------------------------------------

VisiblePosition visiblePositionBeforeNode(Node&);
VisiblePosition visiblePositionAfterNode(Node&);

bool lineBreakExistsAtVisiblePosition(const VisiblePosition&);

WEBCORE_EXPORT int indexForVisiblePosition(const VisiblePosition&, RefPtr<ContainerNode>& scope);
int indexForVisiblePosition(Node&, const VisiblePosition&, TextIteratorBehaviors);
WEBCORE_EXPORT VisiblePosition visiblePositionForPositionWithOffset(const VisiblePosition&, int offset);
WEBCORE_EXPORT VisiblePosition visiblePositionForIndex(int index, Node* scope, TextIteratorBehaviors = TextIteratorBehavior::EmitsCharactersBetweenAllVisiblePositions);
VisiblePosition visiblePositionForIndexUsingCharacterIterator(Node&, int index); // FIXME: Why do we need this version?

WEBCORE_EXPORT VisiblePosition closestEditablePositionInElementForAbsolutePoint(const Element&, const IntPoint&);

// -------------------------------------------------------------------------
// HTMLElement
// -------------------------------------------------------------------------

WEBCORE_EXPORT Ref<HTMLElement> createDefaultParagraphElement(Document&);
Ref<HTMLElement> createHTMLElement(Document&, const QualifiedName&);
Ref<HTMLElement> createHTMLElement(Document&, const AtomString&);

WEBCORE_EXPORT RefPtr<HTMLElement> enclosingList(Node*);
RefPtr<HTMLElement> outermostEnclosingList(Node*, Node* rootList = nullptr);
RefPtr<Node> enclosingListChild(Node*);

// -------------------------------------------------------------------------
// Element
// -------------------------------------------------------------------------

Ref<Element> createTabSpanElement(Document&);
Ref<Element> createTabSpanElement(Document&, String&& tabText);
Ref<Element> createBlockPlaceholderElement(Document&);

Element* editableRootForPosition(const Position&, EditableType = ContentIsEditable);
Element* unsplittableElementForPosition(const Position&);

bool canMergeLists(Element* firstList, Element* secondList);

// -------------------------------------------------------------------------
// VisibleSelection
// -------------------------------------------------------------------------

VisibleSelection selectionForParagraphIteration(const VisibleSelection&);
Position adjustedSelectionStartForStyleComputation(const VisibleSelection&);

// -------------------------------------------------------------------------

// FIXME: This is only one of many definitions of whitespace. Possibly never the right one to use.
bool deprecatedIsEditingWhitespace(UChar);

// FIXME: Can't answer this question correctly without being passed the white-space mode.
bool deprecatedIsCollapsibleWhitespace(UChar);

bool isAmbiguousBoundaryCharacter(UChar);

String stringWithRebalancedWhitespace(const String&, bool startIsStartOfParagraph, bool shouldEmitNBSPbeforeEnd);
const String& nonBreakingSpaceString();

// Miscellaneous functions for caret rendering.

RenderBlock* rendererForCaretPainting(const Node*);
LayoutRect localCaretRectInRendererForCaretPainting(const VisiblePosition&, RenderBlock*&);
LayoutRect localCaretRectInRendererForRect(LayoutRect&, Node*, RenderObject*, RenderBlock*&);
IntRect absoluteBoundsForLocalCaretRect(RenderBlock* rendererForCaretPainting, const LayoutRect&, bool* insideFixed = nullptr);

// -------------------------------------------------------------------------

inline bool deprecatedIsEditingWhitespace(UChar c)
{
    return c == noBreakSpace || c == ' ' || c == '\n' || c == '\t';
}

// FIXME: Can't really answer this question correctly without knowing the white-space mode.
inline bool deprecatedIsCollapsibleWhitespace(UChar c)
{
    return c == ' ' || c == '\n';
}

bool isAmbiguousBoundaryCharacter(UChar);

inline bool editingIgnoresContent(const Node& node)
{
    return !node.canContainRangeEndPoint();
}

inline bool positionBeforeOrAfterNodeIsCandidate(Node& node)
{
    return isRenderedTable(&node) || editingIgnoresContent(node);
}

inline Position firstPositionInOrBeforeNode(Node* node)
{
    if (!node)
        return { };
    return editingIgnoresContent(*node) ? positionBeforeNode(node) : firstPositionInNode(node);
}

inline Position lastPositionInOrAfterNode(Node* node)
{
    if (!node)
        return { };
    return editingIgnoresContent(*node) ? positionAfterNode(node) : lastPositionInNode(node);
}

}
