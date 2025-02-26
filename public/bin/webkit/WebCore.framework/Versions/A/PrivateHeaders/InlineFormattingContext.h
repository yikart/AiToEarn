/*
 * Copyright (C) 2018 Apple Inc. All rights reserved.
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

#include "InlineDisplayContent.h"
#include "InlineFormattingConstraints.h"
#include "InlineFormattingUtils.h"
#include "InlineLayoutState.h"
#include "InlineQuirks.h"
#include "IntrinsicWidthHandler.h"
#include "LayoutIntegrationUtils.h"
#include <wtf/TZoneMalloc.h>

namespace WebCore {
namespace Layout {

class InlineDamage;
class InlineContentCache;
class LineBox;

struct InlineLayoutResult {
    InlineDisplay::Content displayContent;
    enum class Range : uint8_t {
        Full, // Display content represents the complete inline content -result of full layout
        FullFromDamage, // Display content represents part of the inline content starting from damaged line until the end of inline content -result of partial layout with continuous damage all the way to the end of the inline content
        PartialFromDamage // Display content represents part of the inline content starting from damaged line until damage stops -result of partial layout with damage that does not cover the entire inline content
    };
    Range range { Range::Full };
};

// This class implements the layout logic for inline formatting context.
// https://www.w3.org/TR/CSS22/visuren.html#inline-formatting
class InlineFormattingContext {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(InlineFormattingContext);
public:
    InlineFormattingContext(const ElementBox& formattingContextRoot, LayoutState&, BlockLayoutState& parentBlockLayoutState);

    InlineLayoutResult layout(const ConstraintsForInlineContent&, InlineDamage* = nullptr);

    std::pair<LayoutUnit, LayoutUnit> minimumMaximumContentSize(InlineDamage* = nullptr);
    LayoutUnit minimumContentSize(InlineDamage* = nullptr);
    LayoutUnit maximumContentSize(InlineDamage* = nullptr);

    const ElementBox& root() const { return m_rootBlockContainer; }
    const InlineFormattingUtils& formattingUtils() const { return m_inlineFormattingUtils; }
    const InlineQuirks& quirks() const { return m_inlineQuirks; }
    const FloatingContext& floatingContext() const { return m_floatingContext; }

    InlineLayoutState& layoutState() { return m_inlineLayoutState; }
    const InlineLayoutState& layoutState() const { return m_inlineLayoutState; }

    enum class EscapeReason {
        InkOverflowNeedsInitialContiningBlockForStrokeWidth
    };
    const BoxGeometry& geometryForBox(const Box&, std::optional<EscapeReason> = std::nullopt) const;
    BoxGeometry& geometryForBox(const Box&);

    const IntegrationUtils& integrationUtils() const { return m_integrationUtils; }

private:
    InlineLayoutResult lineLayout(AbstractLineBuilder&, const InlineItemList&, InlineItemRange, std::optional<PreviousLine>, const ConstraintsForInlineContent&, const InlineDamage* = nullptr);
    void layoutFloatContentOnly(const ConstraintsForInlineContent&);

    void collectContentIfNeeded();
    InlineRect createDisplayContentForInlineContent(const LineBox&, const LineLayoutResult&, const ConstraintsForInlineContent&, InlineDisplay::Content&, size_t& numberOfPreviousLContentfulLines);
    void updateInlineLayoutStateWithLineLayoutResult(const LineLayoutResult&, const InlineRect& lineLogicalRect, const FloatingContext&);
    void updateBoxGeometryForPlacedFloats(const LineLayoutResult::PlacedFloatList&);
    void resetBoxGeometriesForDiscardedContent(const InlineItemRange& discardedRange, const LineLayoutResult::SuspendedFloatList& suspendedFloats);
    bool createDisplayContentForLineFromCachedContent(const ConstraintsForInlineContent&, InlineLayoutResult&);
    void createDisplayContentForEmptyInlineContent(const ConstraintsForInlineContent&, InlineLayoutResult&);
    void initializeInlineLayoutState(const LayoutState&);
    void rebuildInlineItemListIfNeeded(InlineDamage*);

    InlineContentCache& inlineContentCache() { return m_inlineContentCache; }

private:
    const ElementBox& m_rootBlockContainer;
    LayoutState& m_globalLayoutState;
    const FloatingContext m_floatingContext;
    const InlineFormattingUtils m_inlineFormattingUtils;
    const InlineQuirks m_inlineQuirks;
    const IntegrationUtils m_integrationUtils;
    InlineContentCache& m_inlineContentCache;
    InlineLayoutState m_inlineLayoutState;
};

}
}
