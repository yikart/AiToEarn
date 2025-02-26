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

#include "LayoutUnits.h"

namespace WebCore {
namespace Layout {

class InlineItem;

using InlineBoxBoundaryTextSpacings = WTF::HashMap<size_t, float, DefaultHash<size_t>, WTF::UnsignedWithZeroKeyHashTraits<size_t>>;
using TrimmableTextSpacings = InlineBoxBoundaryTextSpacings;

struct TextSpacingContext {
    // InlineBoxBoundaryTextSpacings maps inline item indexes to spacing. It serves to identify start boxes that mark spacing between boxes boundaries. If we have start box with an entry here, this means that we have to add spacing between this start box and the previous box. We need to account for it during layout and to reproduce such spacing among 2 boxes during display. Therefore, this serve for identifying spacing between box boundaries such that we can both: add these spacing into layout/display and trim this spacing during line breaking if needed.
    InlineBoxBoundaryTextSpacings inlineBoxBoundaryTextSpacings;
    // TrimmableTextSpacings map inline item indexes to spacing. Text content can be split into multiple different inline text items. This structure serves to identify spacing that was added to a text item because of its adjacency to another text item. Ex: if we have 2 text items A and B, and the last character of A and the first character of B require spacing to be added between them. This spacing is always added as a leading spacing to B. However, during line breaking, if B gets placed on a different line as A, they are no longer adjacent and we must trim such spacing. We don't use this map for actually adding the spacing, just for trimming it. Therefore this maps serves only to identify trimmable spacing between text runs. Maybe this can be called TrimmableTextSpacingBetweenTextItems or something.
    TrimmableTextSpacings trimmableTextSpacings;
};

enum class LineEndingTruncationPolicy : uint8_t {
    NoTruncation,
    WhenContentOverflowsInInlineDirection,
    WhenContentOverflowsInBlockDirection
};

struct ExpansionInfo {
    size_t opportunityCount { 0 };
    Vector<size_t> opportunityList;
    Vector<ExpansionBehavior> behaviorList;
};

struct InlineItemPosition {
    size_t index { 0 };
    size_t offset { 0 }; // Note that this is offset relative to the start position of the InlineItem.

    friend bool operator==(const InlineItemPosition&, const InlineItemPosition&) = default;
    operator bool() const { return index || offset; }
};

struct InlineItemRange {
    InlineItemRange(InlineItemPosition start, InlineItemPosition end);
    InlineItemRange(size_t startIndex, size_t endIndex);
    InlineItemRange() = default;

    size_t startIndex() const { return start.index; }
    size_t endIndex() const { return end.index; }
    bool isEmpty() const { return startIndex() == endIndex() && start.offset == end.offset; }

    InlineItemPosition start;
    InlineItemPosition end;
};

struct PreviousLine {
    size_t lineIndex { 0 };
    // Content width measured during line breaking (avoid double-measuring).
    std::optional<InlineLayoutUnit> trailingOverflowingContentWidth { };
    bool endsWithLineBreak { false };
    bool hasInlineContent { false };
    TextDirection inlineBaseDirection { TextDirection::LTR };
    Vector<const Box*> suspendedFloats;
};

inline InlineItemRange::InlineItemRange(InlineItemPosition start, InlineItemPosition end)
    : start(start)
    , end(end)
{
}

inline InlineItemRange::InlineItemRange(size_t startIndex, size_t endIndex)
    : start { startIndex, { } }
    , end { endIndex, { } }
{
}

}
}
