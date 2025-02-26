/*
 * Copyright (C) 2023-2024 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "AccessibilityObject.h"
#include <wtf/StdLibExtras.h>

namespace WebCore {

#if ENABLE(ACCESSIBILITY_ISOLATED_TREE)
class AXIsolatedObject;
#endif
struct CharacterOffset;
struct AXTextRuns;

enum class AXTextUnit : uint8_t {
    Line,
    Paragraph,
    Sentence,
    Word,
};
enum class AXTextUnitBoundary : bool { Start, End };

enum class LineRangeType : uint8_t {
    Current,
    Left,
    Right,
};

enum class WordRangeType : uint8_t {
    Left,
    Right,
};

enum class SentenceRangeType : uint8_t {
    Current,
    Left,
    Right,
};

// Options for findMarker
enum class CoalesceObjectBreaks : bool { No, Yes };
enum class IgnoreBRs : bool { No, Yes };

struct TextMarkerData {
    unsigned treeID;
    unsigned objectID;

    unsigned offset;
    Position::AnchorType anchorType;
    Affinity affinity;

    unsigned characterStart;
    unsigned characterOffset;
    bool ignored;

    // Constructors of TextMarkerData must zero the struct's block of memory because platform client code may rely on a byte-comparison to determine instances equality.
    // Members initialization alone is not enough to guaranty that all bytes in the struct memeory are initialized, and may cause random inequalities when doing byte-comparisons.
    // For an example of such byte-comparison, see the TestRunner WTR::AccessibilityTextMarker::isEqual.
    TextMarkerData()
    {
        zeroBytes(*this);
    }

    TextMarkerData(std::optional<AXID> axTreeID, std::optional<AXID> axObjectID,
        unsigned offsetParam = 0,
        Position::AnchorType anchorTypeParam = Position::PositionIsOffsetInAnchor,
        Affinity affinityParam = Affinity::Downstream,
        unsigned charStart = 0, unsigned charOffset = 0, bool ignoredParam = false)
    {
        zeroBytes(*this);
        treeID = axTreeID ? axTreeID->toUInt64() : 0;
        objectID = axObjectID ? axObjectID->toUInt64() : 0;
        offset = offsetParam;
        anchorType = anchorTypeParam;
        affinity = affinityParam;
        characterStart = charStart;
        characterOffset = charOffset;
        ignored = ignoredParam;
    }

    TextMarkerData(AXObjectCache&, const VisiblePosition&, int charStart = 0, int charOffset = 0, bool ignoredParam = false);
    TextMarkerData(AXObjectCache&, const CharacterOffset&, bool ignoredParam = false);

    friend bool operator==(const TextMarkerData&, const TextMarkerData&) = default;

    std::optional<AXID> axTreeID() const
    {
        return treeID ? std::optional { ObjectIdentifier<AXIDType>(treeID) } : std::nullopt;
    }

    std::optional<AXID> axObjectID() const
    {
        return objectID ? std::optional { ObjectIdentifier<AXIDType>(objectID) } : std::nullopt;
    }
};

#if PLATFORM(MAC)
using PlatformTextMarkerData = AXTextMarkerRef;
#elif PLATFORM(IOS_FAMILY)
using PlatformTextMarkerData = NSData *;
#endif

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(AXTextMarker);
class AXTextMarker {
    WTF_MAKE_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(AXTextMarker);
    friend class AXTextMarkerRange;
    friend std::partial_ordering partialOrder(const AXTextMarker&, const AXTextMarker&);
public:
    // Constructors
    AXTextMarker(const VisiblePosition&);
    AXTextMarker(const CharacterOffset&);
    AXTextMarker(const TextMarkerData& data)
        : m_data(data)
    { }
    AXTextMarker(TextMarkerData&& data)
        : m_data(WTFMove(data))
    { }
#if PLATFORM(COCOA)
    AXTextMarker(PlatformTextMarkerData);
#endif
    AXTextMarker(std::optional<AXID> treeID, std::optional<AXID> objectID, unsigned offset)
        : m_data({ treeID, objectID, offset, Position::PositionIsOffsetInAnchor, Affinity::Downstream, 0, offset })
    { }
    AXTextMarker(const AXCoreObject& object, unsigned offset)
        : m_data({ object.treeID(), object.objectID(), offset, Position::PositionIsOffsetInAnchor, Affinity::Downstream, 0, offset })
    { }

    AXTextMarker() = default;

    operator bool() const { return !isNull(); }
    bool isEqual(const AXTextMarker& other) const { return m_data == other.m_data; }
    operator VisiblePosition() const;
    operator CharacterOffset() const;
    std::optional<BoundaryPoint> boundaryPoint() const;
    bool hasSameObjectAndOffset(const AXTextMarker&) const;

#if PLATFORM(COCOA)
    RetainPtr<PlatformTextMarkerData> platformData() const;
    operator PlatformTextMarkerData() const { return platformData().autorelease(); }
#endif

    std::optional<AXID> treeID() const { return m_data.axTreeID(); }
    std::optional<AXID> objectID() const { return m_data.axObjectID(); }
    unsigned offset() const { return m_data.offset; }
    bool isNull() const { return !treeID() || !objectID(); }
#if ENABLE(ACCESSIBILITY_ISOLATED_TREE)
    // FIXME: Currently, the logic for serving text APIs off the main-thread requires isolated objects, but should eventually be refactored to work with AXCoreObjects.
    RefPtr<AXIsolatedObject> isolatedObject() const;
#endif
    RefPtr<AXCoreObject> object() const;
    bool isValid() const { return object(); }
    bool isIgnored() const { return m_data.ignored; }

    String debugDescription() const;

#if ENABLE(AX_THREAD_TEXT_APIS)
    AXTextMarker toTextRunMarker(std::optional<AXID> stopAtID = std::nullopt) const;
    // True if this marker points to an object with non-empty text runs.
    bool isInTextRun() const;

    // Find the next or previous marker, optionally stopping at the given ID and returning an invalid marker.
    AXTextMarker findMarker(AXDirection, CoalesceObjectBreaks = CoalesceObjectBreaks::Yes, IgnoreBRs = IgnoreBRs::No, std::optional<AXID> = std::nullopt) const;
    // Starting from this text marker, creates a new position for the given direction and text unit type.
    AXTextMarker findMarker(AXDirection, AXTextUnit, AXTextUnitBoundary, std::optional<AXID> stopAtID = std::nullopt) const;
    AXTextMarker previousLineStart(std::optional<AXID> stopAtID = std::nullopt) const { return findMarker(AXDirection::Previous, AXTextUnit::Line, AXTextUnitBoundary::Start, stopAtID); }
    AXTextMarker nextLineEnd(std::optional<AXID> stopAtID = std::nullopt) const { return findMarker(AXDirection::Next, AXTextUnit::Line, AXTextUnitBoundary::End, stopAtID); }
    AXTextMarker nextWordStart(std::optional<AXID> stopAtID = std::nullopt) const { return findMarker(AXDirection::Next, AXTextUnit::Word, AXTextUnitBoundary::Start, stopAtID); }
    AXTextMarker nextWordEnd(std::optional<AXID> stopAtID = std::nullopt) const { return findMarker(AXDirection::Next, AXTextUnit::Word, AXTextUnitBoundary::End, stopAtID); }
    AXTextMarker previousWordStart(std::optional<AXID> stopAtID = std::nullopt) const { return findMarker(AXDirection::Previous, AXTextUnit::Word, AXTextUnitBoundary::Start, stopAtID); }
    AXTextMarker previousWordEnd(std::optional<AXID> stopAtID = std::nullopt) const { return findMarker(AXDirection::Previous, AXTextUnit::Word, AXTextUnitBoundary::End, stopAtID); }
    AXTextMarker previousSentenceStart(std::optional<AXID> stopAtID = std::nullopt) const { return findMarker(AXDirection::Previous, AXTextUnit::Sentence, AXTextUnitBoundary::Start, stopAtID); }
    AXTextMarker nextSentenceEnd(std::optional<AXID> stopAtID = std::nullopt) const { return findMarker(AXDirection::Next, AXTextUnit::Sentence, AXTextUnitBoundary::End, stopAtID); }
    AXTextMarker previousParagraphStart(std::optional<AXID> stopAtID = std::nullopt) const;
    AXTextMarker nextParagraphEnd(std::optional<AXID> stopAtID = std::nullopt) const;

    // Creates a range for the line this marker points to.
    AXTextMarkerRange lineRange(LineRangeType) const;
    // Creates a range for the word specified by the line range type.
    AXTextMarkerRange wordRange(WordRangeType) const;
    // Creates a range for the sentence specified by the sentence range type;
    AXTextMarkerRange sentenceRange(SentenceRangeType) const;
    // Creates a range for the paragraph at the current marker.
    AXTextMarkerRange paragraphRange() const;
    // Returns a range pointing to the start and end positions that have the same text styles as `this`.
    AXTextMarkerRange rangeWithSameStyle() const;
    // Given a character offset relative to this marker, find the next marker the offset points to.
    AXTextMarker nextMarkerFromOffset(unsigned) const;
    // Returns the number of intermediate text markers between this and the root.
    unsigned offsetFromRoot() const;
    // Starting from this marker, navigate to the last marker before the given AXID. Assumes `this`
    // is before the AXID in the AX tree (anything else is a bug). std::nullopt means we will find
    // the last marker on the entire webpage.
    AXTextMarker findLastBefore(std::optional<AXID>) const;
    AXTextMarker findLast() const { return findLastBefore(std::nullopt); }
    // Determines partial order by traversing forward and backwards to try the other marker.
    std::partial_ordering partialOrderByTraversal(const AXTextMarker&) const;
    // The index of the line this text marker is on relative to the nearest editable ancestor (or start of the page if there are no editable ancestors).
    // Returns -1 if the line couldn't be computed (i.e. because `this` is invalid).
    int lineIndex() const;
    // Returns the line number for the character index within the descendants of this marker's object.
    // Returns -1 if the index is out of bounds, or this marker isn't valid.
    int lineNumberForIndex(unsigned) const;
    // The location and length of the line that is `lineIndex` lines away from the start of this marker.
    CharacterRange characterRangeForLine(unsigned lineIndex) const;
    // The AXTextMarkerRange of the line that is `lineIndex` lines away from the start of this marker.
    AXTextMarkerRange markerRangeForLineIndex(unsigned lineIndex) const;
#endif // ENABLE(AX_THREAD_TEXT_APIS)

private:
#if ENABLE(AX_THREAD_TEXT_APIS)
    const AXTextRuns* runs() const;
    // After resolving this marker to a text-run marker, what line does the offset point to?
    AXTextRunLineID lineID() const;
    // Are we at the start or end of a line?
    bool atLineBoundaryForDirection(AXDirection) const;
    bool atLineStart() const { return atLineBoundaryForDirection(AXDirection::Previous); }
    bool atLineEnd() const { return atLineBoundaryForDirection(AXDirection::Next); }
    // True when two nodes are visually the same (i.e. on the boundary of an object)
    bool equivalentTextPosition(const AXTextMarker&) const;
#endif // ENABLE(AX_THREAD_TEXT_APIS)

    TextMarkerData m_data;
};

class AXTextMarkerRange {
    WTF_MAKE_TZONE_ALLOCATED(AXTextMarkerRange);
    friend bool operator==(const AXTextMarkerRange&, const AXTextMarkerRange&);
    friend bool operator<(const AXTextMarkerRange&, const AXTextMarkerRange&);
    friend bool operator>(const AXTextMarkerRange&, const AXTextMarkerRange&);
public:
    // Constructors.
    AXTextMarkerRange(const VisiblePositionRange&);
    AXTextMarkerRange(const std::optional<SimpleRange>&);
    AXTextMarkerRange(const AXTextMarker&, const AXTextMarker&);
    AXTextMarkerRange(AXTextMarker&&, AXTextMarker&&);
#if PLATFORM(MAC)
    AXTextMarkerRange(AXTextMarkerRangeRef);
#endif
    AXTextMarkerRange(std::optional<AXID> treeID, std::optional<AXID> objectID, const CharacterRange&);
    AXTextMarkerRange(std::optional<AXID> treeID, std::optional<AXID> objectID, unsigned offset, unsigned length);
    AXTextMarkerRange() = default;

    operator bool() const { return m_start && m_end; }
    operator VisiblePositionRange() const;
    std::optional<SimpleRange> simpleRange() const;
    std::optional<CharacterRange> characterRange() const;

    std::optional<AXTextMarkerRange> intersectionWith(const AXTextMarkerRange&) const;

#if PLATFORM(MAC)
    RetainPtr<AXTextMarkerRangeRef> platformData() const;
    operator AXTextMarkerRangeRef() const { return platformData().autorelease(); }
#elif PLATFORM(IOS_FAMILY)
    // There is no iOS native type for a TextMarkerRange analogous to AXTextMarkerRangeRef on Mac.
    // Instead, an NSArray of 2 elements is used.
    AXTextMarkerRange(NSArray *);
    RetainPtr<NSArray> platformData() const;
#endif

#if PLATFORM(COCOA)
    std::optional<NSRange> nsRange() const;
#endif

    AXTextMarker start() const { return m_start; }
    AXTextMarker end() const { return m_end; }
    bool isCollapsed() const { return m_start.isEqual(m_end); }
    bool isConfinedTo(std::optional<AXID>) const;
    bool isConfined() const;

#if ENABLE(AX_THREAD_TEXT_APIS)
    // Traverses from m_start to m_end, collecting all text along the way.
    String toString() const;
#if PLATFORM(COCOA)
    RetainPtr<NSAttributedString> toAttributedString(AXCoreObject::SpellCheck) const;
#endif // PLATFORM(COCOA)
#endif // ENABLE(AX_THREAD_TEXT_APIS)

    String debugDescription() const;
private:
    AXTextMarker m_start;
    AXTextMarker m_end;
};

inline AXTextMarkerRange::AXTextMarkerRange(std::optional<AXID> treeID, std::optional<AXID> objectID, const CharacterRange& range)
    : AXTextMarkerRange(treeID, objectID, range.location, range.location + range.length)
{ }

inline bool operator==(const AXTextMarker& marker1, const AXTextMarker& marker2)
{
    return marker1.isEqual(marker2);
}

inline bool operator==(const AXTextMarkerRange& range1, const AXTextMarkerRange& range2)
{
    return range1.m_start == range2.m_start && range1.m_end == range2.m_end;
}

inline bool operator!=(const AXTextMarkerRange& range1, const AXTextMarkerRange& range2)
{
    return !(range1 == range2);
}

inline bool operator<(const AXTextMarkerRange& range1, const AXTextMarkerRange& range2)
{
    return is_lt(partialOrder(range1.m_start, range2.m_start))
        || is_lt(partialOrder(range1.m_end, range2.m_end));
}

inline bool operator>(const AXTextMarkerRange& range1, const AXTextMarkerRange& range2)
{
    return is_gt(partialOrder(range1.m_start, range2.m_start))
        || is_gt(partialOrder(range1.m_end, range2.m_end));
}

inline bool operator<=(const AXTextMarkerRange& range1, const AXTextMarkerRange& range2)
{
    return range1 == range2 || range1 < range2;
}

inline bool operator>=(const AXTextMarkerRange& range1, const AXTextMarkerRange& range2)
{
    return range1 == range2 || range1 > range2;
}

namespace Accessibility {

#if ENABLE(AX_THREAD_TEXT_APIS)
AXIsolatedObject* findObjectWithRuns(AXIsolatedObject& start, AXDirection direction, std::optional<AXID> stopAtID = std::nullopt, const std::function<void(AXIsolatedObject&)>& exitObject = [] (AXIsolatedObject&) { });
#endif // ENABLE(AX_THREAD_TEXT_APIS)

} // namespace Accessibility

} // namespace WebCore
