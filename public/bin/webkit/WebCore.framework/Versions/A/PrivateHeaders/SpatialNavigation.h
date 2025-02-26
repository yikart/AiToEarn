/*
 * Copyright (C) 2009 Nokia Corporation and/or its subsidiary(-ies)
 * Copyright (C) 2009 Antonio Gomes <tonikitoo@webkit.org>
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

#include "FocusDirection.h"
#include "HTMLFrameOwnerElement.h"
#include "LayoutRect.h"
#include "Node.h"
#include <limits>

namespace WebCore {

class Element;
class HTMLAreaElement;
class IntRect;
class LocalFrame;
class RenderObject;

inline long long maxDistance()
{
    return std::numeric_limits<long long>::max();
}

inline int fudgeFactor()
{
    return 2;
}

bool isSpatialNavigationEnabled(const LocalFrame*);

// Spatially speaking, two given elements in a web page can be:
// 1) Fully aligned: There is a full intersection between the rects, either
//    vertically or horizontally.
//
// * Horizontally       * Vertically
//    _
//   |_|                   _ _ _ _ _ _
//   |_|...... _          |_|_|_|_|_|_|
//   |_|      |_|         .       .
//   |_|......|_|   OR    .       .
//   |_|      |_|         .       .
//   |_|......|_|          _ _ _ _
//   |_|                  |_|_|_|_|
//
//
// 2) Partially aligned: There is a partial intersection between the rects, either
//    vertically or horizontally.
//
// * Horizontally       * Vertically
//    _                   _ _ _ _ _
//   |_|                 |_|_|_|_|_|
//   |_|.... _      OR           . .
//   |_|    |_|                  . .
//   |_|....|_|                  ._._ _
//          |_|                  |_|_|_|
//          |_|
//
// 3) Or, otherwise, not aligned at all.
//
// * Horizontally       * Vertically
//         _              _ _ _ _
//        |_|            |_|_|_|_|
//        |_|                    .
//        |_|                     .
//       .          OR             .
//    _ .                           ._ _ _ _ _
//   |_|                            |_|_|_|_|_|
//   |_|
//   |_|
//
// "Totally Aligned" elements are preferable candidates to move
// focus to over "Partially Aligned" ones, that on its turns are
// more preferable than "Not Aligned".
enum class RectsAlignment {
    None = 0,
    Partial,
    Full
};

struct FocusCandidate {
    FocusCandidate()
        : visibleNode(nullptr)
        , focusableNode(nullptr)
        , enclosingScrollableBox(nullptr)
        , distance(maxDistance())
        , alignment(RectsAlignment::None)
        , isOffscreen(true)
        , isOffscreenAfterScrolling(true)
    {
    }

    FocusCandidate(Node* n, FocusDirection);
    explicit FocusCandidate(HTMLAreaElement* area, FocusDirection);
    bool isNull() const { return !visibleNode; }
    bool inScrollableContainer() const { return visibleNode && enclosingScrollableBox; }
    Document* document() const { return visibleNode ? &visibleNode->document() : 0; }

    // We handle differently visibleNode and FocusableNode to properly handle the areas of imagemaps,
    // where visibleNode would represent the image element and focusableNode would represent the area element.
    // In all other cases, visibleNode and focusableNode are one and the same.
    WeakPtr<Node, WeakPtrImplWithEventTargetData> visibleNode;
    WeakPtr<Node, WeakPtrImplWithEventTargetData> focusableNode;
    WeakPtr<Node, WeakPtrImplWithEventTargetData> enclosingScrollableBox;
    long long distance;
    RectsAlignment alignment;
    LayoutRect rect;
    bool isOffscreen;
    bool isOffscreenAfterScrolling;
};

bool hasOffscreenRect(Node*, FocusDirection = FocusDirection::None);
bool scrollInDirection(LocalFrame*, FocusDirection);
bool scrollInDirection(Node* container, FocusDirection);
bool canScrollInDirection(const Node* container, FocusDirection);
bool canScrollInDirection(const LocalFrame*, FocusDirection);
bool canBeScrolledIntoView(FocusDirection, const FocusCandidate&);
bool areElementsOnSameLine(const FocusCandidate& firstCandidate, const FocusCandidate& secondCandidate);
bool isValidCandidate(FocusDirection, const FocusCandidate&, FocusCandidate&);
void distanceDataForNode(FocusDirection, const FocusCandidate& current, FocusCandidate& candidate);
Node* scrollableEnclosingBoxOrParentFrameForNodeInDirection(FocusDirection, Node*);
LayoutRect nodeRectInAbsoluteCoordinates(Node*, bool ignoreBorder = false);
LayoutRect frameRectInAbsoluteCoordinates(LocalFrame*);
LayoutRect virtualRectForDirection(FocusDirection, const LayoutRect& startingRect, LayoutUnit width = 0_lu);
LayoutRect virtualRectForAreaElementAndDirection(HTMLAreaElement*, FocusDirection);
HTMLFrameOwnerElement* frameOwnerElement(FocusCandidate&);

} // namespace WebCore
