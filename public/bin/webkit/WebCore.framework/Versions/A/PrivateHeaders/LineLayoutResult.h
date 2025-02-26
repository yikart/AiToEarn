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

#include "InlineLine.h"
#include "InlineLineTypes.h"
#include "LayoutUnits.h"
#include "PlacedFloats.h"

namespace WebCore {
namespace Layout {

struct LineLayoutResult {
    using PlacedFloatList = PlacedFloats::List;
    using SuspendedFloatList = Vector<const Box*>;

    InlineItemRange inlineItemRange;
    Line::RunList inlineContent;

    struct FloatContent {
        PlacedFloatList placedFloats;
        SuspendedFloatList suspendedFloats;
        OptionSet<UsedFloat> hasIntrusiveFloat { };
    };
    FloatContent floatContent { };

    struct ContentGeometry {
        InlineLayoutUnit logicalLeft { 0.f };
        InlineLayoutUnit logicalWidth { 0.f };
        InlineLayoutUnit logicalRightIncludingNegativeMargin { 0.f }; // Note that with negative horizontal margin value, contentLogicalLeft + contentLogicalWidth is not necessarily contentLogicalRight.
        std::optional<InlineLayoutUnit> trailingOverflowingContentWidth { };
    };
    ContentGeometry contentGeometry { };

    struct LineGeometry {
        InlineLayoutPoint logicalTopLeft;
        InlineLayoutUnit logicalWidth { 0.f };
        InlineLayoutUnit initialLogicalLeftIncludingIntrusiveFloats { 0.f };
        std::optional<InlineLayoutUnit> initialLetterClearGap { };
    };
    LineGeometry lineGeometry { };

    struct HangingContent {
        bool shouldContributeToScrollableOverflow { false };
        InlineLayoutUnit logicalWidth { 0.f };
        InlineLayoutUnit hangablePunctuationStartWidth { 0.f };
    };
    HangingContent hangingContent { };

    struct Directionality {
        Vector<int32_t> visualOrderList;
        TextDirection inlineBaseDirection { TextDirection::LTR };
    };
    Directionality directionality { };

    struct IsFirstLast {
        enum class FirstFormattedLine : uint8_t {
            No,
            WithinIFC,
            WithinBFC
        };
        FirstFormattedLine isFirstFormattedLine { FirstFormattedLine::WithinIFC };
        bool isLastLineWithInlineContent { true };
    };
    IsFirstLast isFirstLast { };

    struct Ruby {
        UncheckedKeyHashMap<const Box*, InlineLayoutUnit> baseAlignmentOffsetList { };
        InlineLayoutUnit annotationAlignmentOffset { 0.f };
    };
    Ruby ruby { };

    // Misc
    bool endsWithHyphen { false };
    size_t nonSpanningInlineLevelBoxCount { 0 };
    InlineLayoutUnit trimmedTrailingWhitespaceWidth { 0.f }; // only used for line-break: after-white-space currently
    InlineLayoutUnit firstLineStartTrim { 0.f }; // This is how much text-box-trim: start adjusts the first line box. We only need it to adjust the initial letter float position (which will not be needed once we drop the float behavior)
    std::optional<InlineLayoutUnit> hintForNextLineTopToAvoidIntrusiveFloat { }; // This is only used for cases when intrusive floats prevent any content placement at current vertical position.
};

}
}
