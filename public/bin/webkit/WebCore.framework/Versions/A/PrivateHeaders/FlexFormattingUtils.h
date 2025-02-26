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

#include "FormattingGeometry.h"

namespace WebCore {
namespace Layout {

class FlexFormattingContext;
class LogicalFlexItem;

// Helper class for flex layout.
class FlexFormattingUtils {
public:
    FlexFormattingUtils(const FlexFormattingContext&);

    static bool isMainAxisParallelWithInlineAxis(const ElementBox& flexContainer);
    static bool isMainReversedToContentDirection(const ElementBox& flexContainer);
    static bool areFlexLinesReversedInCrossAxis(const ElementBox& flexContainer);

    // FIXME: These values should probably be computed by FlexFormattingContext and get passed in to FlexLayout.
    static LayoutUnit mainAxisGapValue(const ElementBox& flexContainer, LayoutUnit flexContainerContentBoxWidth);
    static LayoutUnit crossAxisGapValue(const ElementBox& flexContainer, LayoutUnit flexContainerContentBoxHeight);

    static ContentPosition logicalJustifyContentPosition(const ElementBox& flexContainer, ContentPosition);

    LayoutUnit usedMinimumSizeInMainAxis(const LogicalFlexItem&) const;
    std::optional<LayoutUnit> usedMaximumSizeInMainAxis(const LogicalFlexItem&) const;
    LayoutUnit usedMaxContentSizeInMainAxis(const LogicalFlexItem&) const;
    LayoutUnit usedSizeInCrossAxis(const LogicalFlexItem&, LayoutUnit maxAxisConstraint) const;

private:
    const FlexFormattingContext& formattingContext() const { return m_flexFormattingContext; }

private:
    const FlexFormattingContext& m_flexFormattingContext;
};

}
}

