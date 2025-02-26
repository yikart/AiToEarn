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

#include "AbstractLineBuilder.h"
#include "InlineContentCache.h"

namespace WebCore {
namespace Layout {

class InlineContentBreaker;
struct CandidateTextContent;
struct TextOnlyLineBreakResult;

class TextOnlySimpleLineBuilder final : public AbstractLineBuilder {
public:
    TextOnlySimpleLineBuilder(InlineFormattingContext&, const ElementBox& rootBox, HorizontalConstraints rootHorizontalConstraints, const InlineItemList&);
    LineLayoutResult layoutInlineContent(const LineInput&, const std::optional<PreviousLine>&) final;

    static bool isEligibleForSimplifiedTextOnlyInlineLayoutByContent(const InlineContentCache::InlineItems&, const PlacedFloats&);
    static bool isEligibleForSimplifiedInlineLayoutByStyle(const RenderStyle&);

private:
    InlineItemPosition placeInlineTextContent(const RenderStyle&, const InlineItemRange&);
    InlineItemPosition placeNonWrappingInlineTextContent(const RenderStyle&, const InlineItemRange&);
    TextOnlyLineBreakResult handleOverflowingTextContent(const RenderStyle&, const InlineContentBreaker::ContinuousContent&, const InlineItemRange&);
    TextOnlyLineBreakResult commitCandidateContent(const RenderStyle&, const CandidateTextContent&, const InlineItemRange&);
    void initialize(const InlineItemRange&, const InlineRect& initialLogicalRect, const std::optional<PreviousLine>&);
    void handleLineEnding(const RenderStyle&, InlineItemPosition, size_t layoutRangeEndIndex);
    size_t revertToTrailingItem(const RenderStyle&, const InlineItemRange&, const InlineTextItem&);
    size_t revertToLastNonOverflowingItem(const RenderStyle&, const InlineItemRange&);
    InlineLayoutUnit availableWidth() const;
    bool isWrappingAllowed() const { return m_isWrappingAllowed; }

private:
    bool m_isWrappingAllowed { false };
    InlineLayoutUnit m_trimmedTrailingWhitespaceWidth { 0.f };
    std::optional<InlineLayoutUnit> m_overflowContentLogicalWidth { };
};

}
}
