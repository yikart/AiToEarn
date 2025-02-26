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

#include "MarginTypes.h"

namespace WebCore {
namespace Layout {

class BlockFormattingGeometry;
class BlockFormattingState;
class ElementBox;
class LayoutState;

// This class implements margin collapsing for block formatting context.
class BlockMarginCollapse {
public:
    BlockMarginCollapse(const LayoutState&, const BlockFormattingState&);

    UsedVerticalMargin collapsedVerticalValues(const ElementBox&, UsedVerticalMargin::NonCollapsedValues);

    LayoutUnit marginBeforeIgnoringCollapsingThrough(const ElementBox&, UsedVerticalMargin::NonCollapsedValues);

    bool marginBeforeCollapsesWithParentMarginBefore(const ElementBox&) const;
    bool marginBeforeCollapsesWithFirstInFlowChildMarginBefore(const ElementBox&) const;
    bool marginBeforeCollapsesWithParentMarginAfter(const ElementBox&) const;
    bool marginBeforeCollapsesWithPreviousSiblingMarginAfter(const ElementBox&) const;

    bool marginAfterCollapsesWithParentMarginAfter(const ElementBox&) const;
    bool marginAfterCollapsesWithLastInFlowChildMarginAfter(const ElementBox&) const;
    bool marginAfterCollapsesWithParentMarginBefore(const ElementBox&) const;
    bool marginAfterCollapsesWithNextSiblingMarginBefore(const ElementBox&) const;
    bool marginAfterCollapsesWithSiblingMarginBeforeWithClearance(const ElementBox&) const;

    UsedVerticalMargin::PositiveAndNegativePair::Values computedPositiveAndNegativeMargin(UsedVerticalMargin::PositiveAndNegativePair::Values, UsedVerticalMargin::PositiveAndNegativePair::Values) const;

    bool marginsCollapseThrough(const ElementBox&) const;

    PrecomputedMarginBefore precomputedMarginBefore(const ElementBox&, UsedVerticalMargin::NonCollapsedValues, const BlockFormattingGeometry&);

private:
    enum class MarginType { Before, After };
    UsedVerticalMargin::PositiveAndNegativePair::Values positiveNegativeValues(const ElementBox&, MarginType) const;
    UsedVerticalMargin::PositiveAndNegativePair::Values positiveNegativeMarginBefore(const ElementBox&, UsedVerticalMargin::NonCollapsedValues) const;
    UsedVerticalMargin::PositiveAndNegativePair::Values positiveNegativeMarginAfter(const ElementBox&, UsedVerticalMargin::NonCollapsedValues) const;

    UsedVerticalMargin::PositiveAndNegativePair::Values precomputedPositiveNegativeMarginBefore(const ElementBox&, UsedVerticalMargin::NonCollapsedValues, const BlockFormattingGeometry&) const;
    UsedVerticalMargin::PositiveAndNegativePair::Values precomputedPositiveNegativeValues(const ElementBox&, const BlockFormattingGeometry&) const;

    std::optional<LayoutUnit> marginValue(UsedVerticalMargin::PositiveAndNegativePair::Values) const;

    bool hasClearance(const ElementBox&) const;

    bool inQuirksMode() const { return m_inQuirksMode; }
    const LayoutState& layoutState() const { return m_layoutState; }
    const BlockFormattingState& formattingState() const { return m_blockFormattingState; }

    const LayoutState& m_layoutState;
    const BlockFormattingState& m_blockFormattingState;
    bool m_inQuirksMode { false };
};

}
}

