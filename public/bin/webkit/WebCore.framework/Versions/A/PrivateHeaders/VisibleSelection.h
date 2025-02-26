/*
 * Copyright (C) 2004, 2015 Apple Inc. All rights reserved.
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

#include "TextGranularity.h"
#include "VisiblePosition.h"

namespace WebCore {

enum class SelectionDirection : uint8_t { Forward, Backward, Right, Left };

class VisibleSelection {
public:
    WEBCORE_EXPORT VisibleSelection();
    static const VisibleSelection& emptySelection();

    static constexpr auto defaultAffinity = VisiblePosition::defaultAffinity;

    VisibleSelection(const Position& anchor, const Position& focus, Affinity = defaultAffinity, bool isDirectional = false);

    VisibleSelection(const Position&, Affinity, bool isDirectional = false);
    WEBCORE_EXPORT VisibleSelection(const SimpleRange&, Affinity = defaultAffinity, bool isDirectional = false);
    WEBCORE_EXPORT VisibleSelection(const VisiblePosition&, bool isDirectional = false);
    WEBCORE_EXPORT VisibleSelection(const VisiblePosition& anchor, const VisiblePosition& focus, bool isDirectional = false);

    WEBCORE_EXPORT static VisibleSelection selectionFromContentsOfNode(Node*);

    void setAffinity(Affinity affinity) { m_affinity = affinity; }
    Affinity affinity() const { return m_affinity; }

    // FIXME: Move to the terms "focus" and "anchor" instead of "base" and "extent".

    void setBase(const Position&);
    void setBase(const VisiblePosition&);
    void setExtent(const Position&);
    void setExtent(const VisiblePosition&);

    // These functions return the values that were passed in, without the canonicalization done by VisiblePosition.
    // FIXME: When we expand granularity, we canonicalize as a side effect, so expanded values have been made canonical.
    // FIXME: Replace start/range/base/end/firstRange with these, renaming these to the shorter names.
    const Position& uncanonicalizedStart() const;
    const Position& uncanonicalizedEnd() const;
    const Position& anchor() const { return m_anchor; }
    const Position& focus() const { return m_focus; }
    WEBCORE_EXPORT std::optional<SimpleRange> range() const;

    // FIXME: Rename these to include the word "canonical" or remove.
    const Position& base() const { return m_base; }
    const Position& extent() const { return m_extent; }
    const Position& start() const { return m_start; }
    const Position& end() const { return m_end; }

    VisiblePosition visibleStart() const { return VisiblePosition(m_start, isRange() ? Affinity::Downstream : affinity()); }
    VisiblePosition visibleEnd() const { return VisiblePosition(m_end, isRange() ? Affinity::Upstream : affinity()); }
    VisiblePosition visibleBase() const { return VisiblePosition(m_base, isRange() ? (isBaseFirst() ? Affinity::Upstream : Affinity::Downstream) : affinity()); }
    VisiblePosition visibleExtent() const { return VisiblePosition(m_extent, isRange() ? (isBaseFirst() ? Affinity::Downstream : Affinity::Upstream) : affinity()); }

    operator VisiblePositionRange() const { return { visibleStart(), visibleEnd() }; }

    bool isNone() const { return m_type == Type::None; }
    bool isCaret() const { return m_type == Type::Caret; }
    bool isRange() const { return m_type == Type::Range; }
    bool isCaretOrRange() const { return !isNone(); }
    bool isNonOrphanedRange() const { return isRange() && !start().isOrphan() && !end().isOrphan(); }
    bool isNoneOrOrphaned() const { return isNone() || start().isOrphan() || end().isOrphan(); }
    bool isOrphan() const;
    RefPtr<Document> document() const;

    bool isBaseFirst() const { return m_anchorIsFirst; }
    bool isDirectional() const { return m_isDirectional; }
    void setIsDirectional(bool isDirectional) { m_isDirectional = isDirectional; }

    WEBCORE_EXPORT bool isAll(EditingBoundaryCrossingRule) const;

    void appendTrailingWhitespace();

    WEBCORE_EXPORT bool expandUsingGranularity(TextGranularity granularity);

    // FIXME: Rename to include the word "canonical" and remove the word "first" or remove.
    // We don't yet support multi-range selections, so we only ever have one range to return.
    WEBCORE_EXPORT std::optional<SimpleRange> firstRange() const;

    // FIXME: Most callers probably don't want this function, and should use range instead.
    // This function contracts the range around text and moves the caret upstream before returning the range.
    WEBCORE_EXPORT std::optional<SimpleRange> toNormalizedRange() const;

    WEBCORE_EXPORT Element* rootEditableElement() const;
    WEBCORE_EXPORT bool isContentEditable() const;
    WEBCORE_EXPORT bool hasEditableStyle() const;
    WEBCORE_EXPORT bool isContentRichlyEditable() const;

    // Returns a shadow tree node for legacy shadow trees, a child of the
    // ShadowRoot node for new shadow trees, or 0 for non-shadow trees.
    Node* nonBoundaryShadowTreeRootNode() const;

    WEBCORE_EXPORT bool isInPasswordField() const;
    WEBCORE_EXPORT bool isInAutoFilledAndViewableField() const;

    WEBCORE_EXPORT bool canEnableWritingSuggestions() const;

    WEBCORE_EXPORT static Position adjustPositionForEnd(const Position& currentPosition, Node* startContainerNode);
    WEBCORE_EXPORT static Position adjustPositionForStart(const Position& currentPosition, Node* startContainerNode);

#if ENABLE(TREE_DEBUGGING)
    void debugPosition() const;
    String debugDescription() const;
    void showTreeForThis() const;
#endif

    void setWithoutValidation(const Position&, const Position&);

private:
    void validate(TextGranularity = TextGranularity::CharacterGranularity);

    // Support methods for validate()
    void setBaseAndExtentToDeepEquivalents();
    void adjustSelectionRespectingGranularity(TextGranularity);
    void adjustSelectionToAvoidCrossingShadowBoundaries();
    void adjustSelectionToAvoidCrossingEditingBoundaries();
    void updateSelectionType();

    // We store only Positions because VisibleSelection is used to store values in
    // editing commands for use when undoing the command. We need to be able to store
    // a selection that, while currently invalid, will be valid once the changes are undone.

    // FIXME: Consider doing canonicalization only as part of editing operations, and keeping all selection endpoints non-canonical outside of that code.
    // FIXME: Rename m_base to m_canonicalAnchor.
    // FIXME: Rename m_extent to m_canonicalFocus.
    Position m_anchor; // Where the first click happened.
    Position m_focus; // Where the end click/release happened.
    Position m_base; // Anchor, canonical, not yet expended to respect granularity.
    Position m_extent; // Focus, canonical, but not expended to respect granularity.
    Position m_start; // First of anchor and focus, caonicalized and expanded to respect granularity.
    Position m_end; // Last of anchor and focus, caonicalized and expanded to respect granularity.

    Affinity m_affinity { defaultAffinity };

    // These are cached, can be recalculated by validate()
    enum class Type : uint8_t { None, Caret, Range };
    Type m_type { Type::None };
    bool m_anchorIsFirst : 1; // True if the anchor is before the focus.
    bool m_isDirectional : 1; // On Mac, Shift-arrow keys move the anchor in a directional selection and moves either end to always extend in a non-directional selection.
};

inline bool operator==(const VisibleSelection& a, const VisibleSelection& b)
{
    return a.start() == b.start() && a.end() == b.end() && a.affinity() == b.affinity() && a.isBaseFirst() == b.isBaseFirst() && a.isDirectional() == b.isDirectional();
}

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const VisibleSelection&);

} // namespace WebCore

#if ENABLE(TREE_DEBUGGING)
// Outside the WebCore namespace for ease of invocation from the debugger.
void showTree(const WebCore::VisibleSelection&);
void showTree(const WebCore::VisibleSelection*);
#endif
