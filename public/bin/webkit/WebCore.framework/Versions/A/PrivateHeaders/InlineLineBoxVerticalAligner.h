/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
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

#include "InlineFormattingContext.h"
#include "InlineFormattingUtils.h"

namespace WebCore {
namespace Layout {

class LineBoxVerticalAligner {
public:
    LineBoxVerticalAligner(const InlineFormattingContext&);
    InlineLayoutUnit computeLogicalHeightAndAlign(LineBox&) const;

private:
    InlineLayoutUnit simplifiedVerticalAlignment(LineBox&) const;

    struct LineBoxAlignmentContent {
        InlineLayoutUnit height() const { return std::max(nonLineBoxRelativeAlignedMaximumHeight, std::max(topAndBottomAlignedMaximumHeight.top.value_or(0.f), topAndBottomAlignedMaximumHeight.bottom.value_or(0.f))); }

        InlineLayoutUnit nonLineBoxRelativeAlignedMaximumHeight { 0 };
        struct TopAndBottomAlignedMaximumHeight {
            std::optional<InlineLayoutUnit> top { };
            std::optional<InlineLayoutUnit> bottom { };
        };
        TopAndBottomAlignedMaximumHeight topAndBottomAlignedMaximumHeight { };
        bool hasTextEmphasis { false };
    };
    LineBoxAlignmentContent computeLineBoxLogicalHeight(LineBox&) const;
    void computeRootInlineBoxVerticalPosition(LineBox&, const LineBoxAlignmentContent&) const;
    void alignInlineLevelBoxes(LineBox&, InlineLayoutUnit lineBoxLogicalHeight) const;
    InlineLayoutUnit adjustForAnnotationIfNeeded(LineBox&, InlineLayoutUnit lineBoxHeight) const;
    std::optional<InlineLevelBox::AscentAndDescent> layoutBoundsForInlineBoxSubtree(const LineBox::InlineLevelBoxList& nonRootInlineLevelBoxes, size_t inlineBoxIndex) const;
    enum class IsInlineLeveBoxAlignment : bool { No, Yes };
    InlineLayoutUnit logicalTopOffsetFromParentBaseline(const InlineLevelBox&, const InlineLevelBox& parentInlineBox, IsInlineLeveBoxAlignment = IsInlineLeveBoxAlignment::No) const;

    const InlineFormattingUtils& formattingUtils() const { return formattingContext().formattingUtils(); }
    const InlineFormattingContext& formattingContext() const { return m_inlineFormattingContext; }
    const ElementBox& rootBox() const { return formattingContext().root(); }
    const InlineLayoutState& layoutState() const { return formattingContext().layoutState(); }

private:
    const InlineFormattingContext& m_inlineFormattingContext;
};

}
}

