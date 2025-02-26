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

#include "FormattingConstraints.h"
#include "InlineFormattingContext.h"
#include "InlineFormattingUtils.h"
#include "InlineItem.h"
#include "InlineLineBuilder.h"
#include "InlineTextItem.h"
#include <optional>

namespace WebCore {
namespace Layout {

class InlineContentConstrainer {
public:
    InlineContentConstrainer(InlineFormattingContext&, const InlineItemList&, const HorizontalConstraints&);
    std::optional<Vector<LayoutUnit>> computeParagraphLevelConstraints(TextWrapStyle);

private:
    void initialize();

    std::optional<Vector<LayoutUnit>> balanceRangeWithLineRequirement(InlineItemRange, InlineLayoutUnit idealLineWidth, size_t numberOfLines, bool isFirstChunk);
    std::optional<Vector<LayoutUnit>> balanceRangeWithNoLineRequirement(InlineItemRange, InlineLayoutUnit idealLineWidth, bool isFirstChunk);
    std::optional<Vector<LayoutUnit>> prettifyRange(InlineItemRange, InlineLayoutUnit idealLineWidth, bool isFirstChunk);

    InlineLayoutUnit inlineItemWidth(size_t inlineItemIndex, bool useFirstLineStyle) const;
    bool shouldTrimLeading(size_t inlineItemIndex, bool useFirstLineStyle, bool isFirstLineInChunk) const;
    bool shouldTrimTrailing(size_t inlineItemIndex, bool useFirstLineStyle) const;
    Vector<size_t> computeBreakOpportunities(InlineItemRange) const;
    Vector<LayoutUnit> computeLineWidthsFromBreaks(InlineItemRange, const Vector<size_t>& breaks, bool isFirstChunk) const;
    InlineLayoutUnit computeTextIndent(std::optional<bool> previousLineEndsWithLineBreak) const;

    InlineFormattingContext& m_inlineFormattingContext;
    const InlineItemList& m_inlineItemList;
    const HorizontalConstraints& m_horizontalConstraints;

    Vector<InlineItemRange> m_originalLineInlineItemRanges;
    Vector<float> m_originalLineWidths;
    Vector<bool> m_originalLineEndsWithForcedBreak;
    Vector<InlineLayoutUnit> m_inlineItemWidths;
    Vector<InlineLayoutUnit> m_firstLineStyleInlineItemWidths;
    size_t m_numberOfLinesInOriginalLayout { 0 };
    size_t m_numberOfInlineItems { 0 };
    double m_maximumLineWidth { 0 };
    bool m_cannotConstrainContent { false };
    bool m_hasSingleLineVisibleContent { false };

    struct SlidingWidth {
        SlidingWidth(const InlineContentConstrainer&, const InlineItemList&, size_t start, size_t end, bool useFirstLineStyle, bool isFirstLineInChunk);
        InlineLayoutUnit width();
        void advanceStart();
        void advanceStartTo(size_t newStart);
        void advanceEnd();
        void advanceEndTo(size_t newEnd);

    private:
        const InlineContentConstrainer& m_inlineContentConstrainer;
        const InlineItemList& m_inlineItemList;
        size_t m_start { 0 };
        size_t m_end { 0 };
        bool m_useFirstLineStyle { false };
        bool m_isFirstLineInChunk { false };
        InlineLayoutUnit m_totalWidth { 0 };
        InlineLayoutUnit m_leadingTrimmableWidth { 0 };
        InlineLayoutUnit m_trailingTrimmableWidth { 0 };
        std::optional<size_t> m_firstLeadingNonTrimmedItem;
    };
};

}
}
