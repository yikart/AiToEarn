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
#include "InlineFormattingConstraints.h"
#include "LayoutBoxGeometry.h"
#include "LayoutIntegrationBoxTreeUpdater.h"
#include "LayoutState.h"

namespace WebCore {

class RenderBox;
class RenderBlock;
class RenderLineBreak;
class RenderInline;
class RenderTable;
class RenderListItem;
class RenderListMarker;

namespace LayoutIntegration {

class BoxGeometryUpdater {
public:
    BoxGeometryUpdater(Layout::LayoutState&, const Layout::ElementBox& rootLayoutBox);

    void clear();

    void setFormattingContextRootGeometry(LayoutUnit availableLogicalWidth);
    void setFormattingContextContentGeometry(std::optional<LayoutUnit> availableLogicalWidth, std::optional<Layout::IntrinsicWidthMode>);
    void updateBoxGeometryAfterIntegrationLayout(const Layout::ElementBox&, LayoutUnit availableWidth);

    Layout::ConstraintsForInlineContent formattingContextConstraints(LayoutUnit availableWidth);

    UncheckedKeyHashMap<const Layout::ElementBox*, LayoutUnit> takeNestedListMarkerOffsets() { return WTFMove(m_nestedListMarkerOffsets); }

private:
    void updateBoxGeometry(const RenderElement&, std::optional<LayoutUnit> availableWidth, std::optional<Layout::IntrinsicWidthMode>);

    void updateLayoutBoxDimensions(const RenderBox&, std::optional<LayoutUnit> availableWidth, std::optional<Layout::IntrinsicWidthMode> = std::nullopt);
    void updateLineBreakBoxDimensions(const RenderLineBreak&);
    void updateInlineBoxDimensions(const RenderInline&, std::optional<LayoutUnit> availableWidth, std::optional<Layout::IntrinsicWidthMode> = std::nullopt);
    void setListMarkerOffsetForMarkerOutside(const RenderListMarker&);

    Layout::BoxGeometry::HorizontalEdges horizontalLogicalMargin(const RenderBoxModelObject&, std::optional<LayoutUnit> availableWidth, WritingMode, bool retainMarginStart = true, bool retainMarginEnd = true);
    Layout::BoxGeometry::VerticalEdges verticalLogicalMargin(const RenderBoxModelObject&, std::optional<LayoutUnit> availableWidth, WritingMode);
    Layout::BoxGeometry::Edges logicalBorder(const RenderBoxModelObject&, WritingMode, bool isIntrinsicWidthMode = false, bool retainBorderStart = true, bool retainBorderEnd = true);
    Layout::BoxGeometry::Edges logicalPadding(const RenderBoxModelObject&, std::optional<LayoutUnit> availableWidth, WritingMode, bool retainPaddingStart = true, bool retainPaddingEnd = true);

    Layout::LayoutState& layoutState() { return *m_layoutState; }
    const Layout::LayoutState& layoutState() const { return *m_layoutState; }
    const Layout::ElementBox& rootLayoutBox() const;
    const RenderBlock& rootRenderer() const;
    inline WritingMode writingMode() const;

private:
    WeakPtr<Layout::LayoutState> m_layoutState;
    CheckedPtr<const Layout::ElementBox> m_rootLayoutBox;
    UncheckedKeyHashMap<const Layout::ElementBox*, LayoutUnit> m_nestedListMarkerOffsets;
};

}
}

