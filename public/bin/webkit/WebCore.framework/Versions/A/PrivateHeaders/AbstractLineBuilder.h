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
#include "InlineContentBreaker.h"
#include "InlineLayoutState.h"
#include "InlineLine.h"
#include "InlineLineTypes.h"
#include "LineLayoutResult.h"

namespace WebCore {
namespace Layout {

struct LineInput {
    InlineItemRange needsLayoutRange;
    InlineRect initialLogicalRect;
};

class AbstractLineBuilder {
public:
    virtual LineLayoutResult layoutInlineContent(const LineInput&, const std::optional<PreviousLine>&) = 0;
    virtual ~AbstractLineBuilder() { };

    void setIntrinsicWidthMode(IntrinsicWidthMode);

protected:
    AbstractLineBuilder(InlineFormattingContext&, const ElementBox& rootBox, HorizontalConstraints rootHorizontalConstraints, const InlineItemList&);

    void reset();

    std::optional<InlineLayoutUnit> eligibleOverflowWidthAsLeading(const InlineContentBreaker::ContinuousContent::RunList&, const InlineContentBreaker::Result&, bool) const;

    std::optional<IntrinsicWidthMode> intrinsicWidthMode() const { return m_intrinsicWidthMode; }
    bool isInIntrinsicWidthMode() const { return !!intrinsicWidthMode(); }

    bool isFirstFormattedLine() const { return !m_previousLine.has_value(); }

    InlineContentBreaker& inlineContentBreaker() { return m_inlineContentBreaker; }

    InlineFormattingContext& formattingContext() { return m_inlineFormattingContext; }
    const InlineFormattingContext& formattingContext() const { return m_inlineFormattingContext; }
    const HorizontalConstraints& rootHorizontalConstraints() const { return m_rootHorizontalConstraints; }
    const InlineLayoutState& layoutState() const;
    InlineLayoutState& layoutState();
    const BlockLayoutState& blockLayoutState() const { return layoutState().parentBlockLayoutState(); }
    const ElementBox& root() const { return m_rootBox; }
    const RenderStyle& rootStyle() const;

protected:
    Line m_line;
    InlineRect m_lineLogicalRect;
    std::span<const InlineItem> m_inlineItemList;
    Vector<const InlineItem*, 32> m_wrapOpportunityList;
    std::optional<InlineTextItem> m_partialLeadingTextItem;
    std::optional<PreviousLine> m_previousLine { };

private:
    InlineFormattingContext& m_inlineFormattingContext;
    const ElementBox& m_rootBox; // Note that this is not necessarily a block container (see range builder).
    HorizontalConstraints m_rootHorizontalConstraints;

    InlineContentBreaker m_inlineContentBreaker;
    std::optional<IntrinsicWidthMode> m_intrinsicWidthMode;
};


}
}
