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

#include "FormattingContext.h"
#include "LayoutBoxGeometry.h"

namespace WebCore {
namespace Layout {

struct ComputedHorizontalMargin;
struct ComputedVerticalMargin;
class ElementBox;
struct ContentHeightAndMargin;
struct ContentWidthAndMargin;
struct HorizontalGeometry;
class LayoutState;
struct OverriddenHorizontalValues;
struct OverriddenVerticalValues;
struct VerticalGeometry;

// This class implements generic positioning and sizing.
class FormattingGeometry {
public:
    FormattingGeometry(const FormattingContext&);

    VerticalGeometry outOfFlowVerticalGeometry(const Box&, const HorizontalConstraints&, const VerticalConstraints&, const OverriddenVerticalValues&) const;
    HorizontalGeometry outOfFlowHorizontalGeometry(const Box&, const HorizontalConstraints&, const VerticalConstraints&, const OverriddenHorizontalValues&) const;

    ContentHeightAndMargin floatingContentHeightAndMargin(const Box&, const HorizontalConstraints&, const OverriddenVerticalValues&) const;
    ContentWidthAndMargin floatingContentWidthAndMargin(const Box&, const HorizontalConstraints&, const OverriddenHorizontalValues&) const;

    ContentHeightAndMargin inlineReplacedContentHeightAndMargin(const ElementBox&, const HorizontalConstraints&, std::optional<VerticalConstraints>, const OverriddenVerticalValues&) const;
    ContentWidthAndMargin inlineReplacedContentWidthAndMargin(const ElementBox&, const HorizontalConstraints&, std::optional<VerticalConstraints>, const OverriddenHorizontalValues&) const;

    LayoutSize inFlowPositionedPositionOffset(const Box&, const HorizontalConstraints&) const;

    ContentHeightAndMargin complicatedCases(const Box&, const HorizontalConstraints&, const OverriddenVerticalValues&) const;
    LayoutUnit shrinkToFitWidth(const Box&, LayoutUnit availableWidth) const;

    BoxGeometry::Edges computedBorder(const Box&) const;
    BoxGeometry::Edges computedPadding(const Box&, LayoutUnit containingBlockWidth) const;

    ComputedHorizontalMargin computedHorizontalMargin(const Box&, const HorizontalConstraints&) const;
    ComputedVerticalMargin computedVerticalMargin(const Box&, const HorizontalConstraints&) const;

    std::optional<LayoutUnit> computedValue(const Length& geometryProperty, LayoutUnit containingBlockWidth) const;
    std::optional<LayoutUnit> fixedValue(const Length& geometryProperty) const;

    std::optional<LayoutUnit> computedMinHeight(const Box&, std::optional<LayoutUnit> containingBlockHeight = std::nullopt) const;
    std::optional<LayoutUnit> computedMaxHeight(const Box&, std::optional<LayoutUnit> containingBlockHeight = std::nullopt) const;

    std::optional<LayoutUnit> computedMinWidth(const Box&, LayoutUnit containingBlockWidth) const;
    std::optional<LayoutUnit> computedMaxWidth(const Box&, LayoutUnit containingBlockWidth) const;

    IntrinsicWidthConstraints constrainByMinMaxWidth(const Box&, IntrinsicWidthConstraints) const;

    LayoutUnit contentHeightForFormattingContextRoot(const ElementBox&) const;

    ConstraintsForOutOfFlowContent constraintsForOutOfFlowContent(const ElementBox&) const;
    ConstraintsForInFlowContent constraintsForInFlowContent(const ElementBox&, std::optional<FormattingContext::EscapeReason> = std::nullopt) const;

    std::optional<LayoutUnit> computedHeight(const Box&, std::optional<LayoutUnit> containingBlockHeight = std::nullopt) const;
    std::optional<LayoutUnit> computedWidth(const Box&, LayoutUnit containingBlockWidth) const;

    bool isBlockFormattingGeometry() const { return formattingContext().isBlockFormattingContext(); }
    bool isTableFormattingGeometry() const { return formattingContext().isTableFormattingContext(); }

protected:
    const LayoutState& layoutState() const { return m_formattingContext.layoutState(); }
    const FormattingContext& formattingContext() const { return m_formattingContext; }

private:
    VerticalGeometry outOfFlowReplacedVerticalGeometry(const ElementBox&, const HorizontalConstraints&, const VerticalConstraints&, const OverriddenVerticalValues&) const;
    HorizontalGeometry outOfFlowReplacedHorizontalGeometry(const ElementBox&, const HorizontalConstraints&, const VerticalConstraints&, const OverriddenHorizontalValues&) const;

    VerticalGeometry outOfFlowNonReplacedVerticalGeometry(const ElementBox&, const HorizontalConstraints&, const VerticalConstraints&, const OverriddenVerticalValues&) const;
    HorizontalGeometry outOfFlowNonReplacedHorizontalGeometry(const ElementBox&, const HorizontalConstraints&, const OverriddenHorizontalValues&) const;

    ContentHeightAndMargin floatingReplacedContentHeightAndMargin(const ElementBox&, const HorizontalConstraints&, const OverriddenVerticalValues&) const;
    ContentWidthAndMargin floatingReplacedContentWidthAndMargin(const ElementBox&, const HorizontalConstraints&, const OverriddenHorizontalValues&) const;

    ContentWidthAndMargin floatingNonReplacedContentWidthAndMargin(const Box&, const HorizontalConstraints&, const OverriddenHorizontalValues&) const;

    LayoutUnit staticVerticalPositionForOutOfFlowPositioned(const Box&, const VerticalConstraints&) const;
    LayoutUnit staticHorizontalPositionForOutOfFlowPositioned(const Box&, const HorizontalConstraints&) const;

    enum class HeightType { Min, Max, Normal };
    std::optional<LayoutUnit> computedHeightValue(const Box&, HeightType, std::optional<LayoutUnit> containingBlockHeight) const;

    enum class WidthType { Min, Max, Normal };
    std::optional<LayoutUnit> computedWidthValue(const Box&, WidthType, LayoutUnit containingBlockWidth) const;

    const FormattingContext& m_formattingContext;
};

}
}

#define SPECIALIZE_TYPE_TRAITS_LAYOUT_FORMATTING_GEOMETRY(ToValueTypeName, predicate) \
SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::Layout::ToValueTypeName) \
    static bool isType(const WebCore::Layout::FormattingGeometry& formattingGeometry) { return formattingGeometry.predicate; } \
SPECIALIZE_TYPE_TRAITS_END()

