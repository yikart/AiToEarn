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

#include "InlineDamage.h"
#include "InlineDisplayContent.h"
#include <optional>
#include <wtf/Forward.h>

namespace WebCore {

class RenderStyle;

namespace Layout {

class Box;
class ElementBox;
class InlineTextBox;
struct InvalidatedLine;

class InlineInvalidation {
public:
    InlineInvalidation(InlineDamage&, const InlineItemList&, const InlineDisplay::Content&);

    bool rootStyleWillChange(const ElementBox& formattingContextRoot, const RenderStyle& newStyle);
    bool styleWillChange(const Box&, const RenderStyle& newStyle, StyleDifference);

    bool textInserted(const InlineTextBox& newOrDamagedInlineTextBox, std::optional<size_t> offset = { });
    bool textWillBeRemoved(const InlineTextBox&, std::optional<size_t> offset = { });

    bool inlineLevelBoxInserted(const Box&);
    bool inlineLevelBoxWillBeRemoved(const Box&);
    bool inlineLevelBoxContentWillChange(const Box&);

    bool restartForPagination(size_t lineIndex, LayoutUnit pageTopAdjustment);

    static bool mayOnlyNeedPartialLayout(const InlineDamage* inlineDamage) { return inlineDamage && inlineDamage->layoutStartPosition(); }
    static void resetInlineDamage(InlineDamage&);

private:
    enum class ShouldApplyRangeLayout : bool { No, Yes };
    bool updateInlineDamage(const InvalidatedLine&, InlineDamage::Reason, ShouldApplyRangeLayout = ShouldApplyRangeLayout::No, LayoutUnit restartPaginationAdjustment = 0_lu);
    bool setFullLayoutIfNeeded(const Box&);
    const InlineDisplay::Boxes& displayBoxes() const { return m_displayContent.boxes; }
    const InlineDisplay::Lines& displayLines() const { return m_displayContent.lines; }

    InlineDamage& m_inlineDamage;

    const InlineItemList& m_inlineItemList;
    const InlineDisplay::Content& m_displayContent;
};

}
}
