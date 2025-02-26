/*
 * Copyright (C) 2011 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "OrderIterator.h"
#include "RenderBlock.h"
#include "RenderStyleInlines.h"
#include <wtf/WeakHashSet.h>

namespace WebCore {

class FlexLayoutItem;
namespace LayoutIntegration {
class FlexLayout;
}
    
class RenderFlexibleBox : public RenderBlock {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(RenderFlexibleBox);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(RenderFlexibleBox);
public:
    RenderFlexibleBox(Type, Element&, RenderStyle&&);
    RenderFlexibleBox(Type, Document&, RenderStyle&&);
    virtual ~RenderFlexibleBox();

    using Direction = FlowDirection;

    ASCIILiteral renderName() const override;

    bool avoidsFloats() const final { return true; }
    bool canDropAnonymousBlockChild() const final { return false; }
    void layoutBlock(bool relayoutChildren, LayoutUnit pageLogicalHeight = 0_lu) final;

    LayoutUnit baselinePosition(FontBaseline, bool firstLine, LineDirectionMode, LinePositionMode = PositionOnContainingLine) const override;
    std::optional<LayoutUnit> firstLineBaseline() const override;
    std::optional<LayoutUnit> lastLineBaseline() const override;
    std::optional<LayoutUnit> inlineBlockBaseline(LineDirectionMode) const override;

    void styleDidChange(StyleDifference, const RenderStyle*) override;
    bool hitTestChildren(const HitTestRequest&, HitTestResult&, const HitTestLocation&, const LayoutPoint& adjustedLocation, HitTestAction) override;
    void paintChildren(PaintInfo& forSelf, const LayoutPoint&, PaintInfo& forChild, bool usePrintRect) override;

    bool isHorizontalFlow() const;
    inline Direction crossAxisDirection() const
    {
        switch (writingMode().blockDirection()) {
        case FlowDirection::TopToBottom:
            if (style().isRowFlexDirection())
                return (style().flexWrap() == FlexWrap::Reverse) ? Direction::BottomToTop : Direction::TopToBottom;
            return (style().flexWrap() == FlexWrap::Reverse) ? Direction::RightToLeft : Direction::LeftToRight;
        case FlowDirection::BottomToTop:
            if (style().isRowFlexDirection())
                return (style().flexWrap() == FlexWrap::Reverse) ? Direction::TopToBottom : Direction::BottomToTop;
            return (style().flexWrap() == FlexWrap::Reverse) ? Direction::RightToLeft : Direction::LeftToRight;
        case FlowDirection::LeftToRight:
            if (style().isRowFlexDirection())
                return (style().flexWrap() == FlexWrap::Reverse) ? Direction::RightToLeft : Direction::LeftToRight;
            return (style().flexWrap() == FlexWrap::Reverse) ? Direction::BottomToTop : Direction::TopToBottom;
        case FlowDirection::RightToLeft:
            if (style().isRowFlexDirection())
                return (style().flexWrap() == FlexWrap::Reverse) ? Direction::LeftToRight : Direction::RightToLeft;
            return (style().flexWrap() == FlexWrap::Reverse) ? Direction::BottomToTop : Direction::TopToBottom;
        default:
            ASSERT_NOT_REACHED();
            return Direction::TopToBottom;
        }
    }

    const OrderIterator& orderIterator() const { return m_orderIterator; }

    LayoutOptionalOutsets allowedLayoutOverflow() const override;

    virtual bool isFlexibleBoxImpl() const { return false; };
    
    std::optional<LayoutUnit> usedFlexItemOverridingLogicalHeightForPercentageResolution(const RenderBox&);
    
    void clearCachedMainSizeForFlexItem(const RenderBox& flexItem);
    
    LayoutUnit cachedFlexItemIntrinsicContentLogicalHeight(const RenderBox& flexItem) const;
    void setCachedFlexItemIntrinsicContentLogicalHeight(const RenderBox& flexItem, LayoutUnit);
    void clearCachedFlexItemIntrinsicContentLogicalHeight(const RenderBox& flexItem);

    LayoutUnit staticMainAxisPositionForPositionedFlexItem(const RenderBox&);
    LayoutUnit staticCrossAxisPositionForPositionedFlexItem(const RenderBox&);
    
    LayoutUnit staticInlinePositionForPositionedFlexItem(const RenderBox&);
    LayoutUnit staticBlockPositionForPositionedFlexItem(const RenderBox&);
    
    // Returns true if the position changed. In that case, the flexItem will have to
    // be laid out again.
    bool setStaticPositionForPositionedLayout(const RenderBox&);

    enum class GapType : uint8_t { BetweenLines, BetweenItems };
    LayoutUnit computeGap(GapType) const;

    bool shouldApplyMinBlockSizeAutoForFlexItem(const RenderBox&) const;

    bool isComputingFlexBaseSizes() const { return m_isComputingFlexBaseSizes; }

    static std::optional<TextDirection> leftRightAxisDirectionFromStyle(const RenderStyle&);

    bool hasModernLayout() const { return m_hasFlexFormattingContextLayout && *m_hasFlexFormattingContextLayout; }

protected:
    void computeIntrinsicLogicalWidths(LayoutUnit& minLogicalWidth, LayoutUnit& maxLogicalWidth) const override;

    bool shouldResetChildLogicalHeightBeforeLayout(const RenderBox&) const override { return m_shouldResetFlexItemLogicalHeightBeforeLayout; }

private:
    friend class FlexLayoutAlgorithm;
    enum class FlexSign : uint8_t {
        PositiveFlexibility,
        NegativeFlexibility,
    };
    
    enum class SizeDefiniteness : uint8_t { Definite, Indefinite, Unknown };
    
    // Use an inline capacity of 8, since flexbox containers usually have less than 8 children.
    typedef Vector<LayoutRect, 8> FlexItemFrameRects;

    struct LineState;

    using FlexLineStates = Vector<LineState>;
    using FlexLayoutItems = Vector<FlexLayoutItem>;

    bool mainAxisIsFlexItemInlineAxis(const RenderBox&) const;
    bool isColumnFlow() const;
    bool isColumnOrRowReverse() const;
    bool isLeftToRightFlow() const;
    bool isMultiline() const;
    Length flexBasisForFlexItem(const RenderBox& flexItem) const;
    Length mainSizeLengthForFlexItem(RenderBox::SizeType, const RenderBox&) const;
    Length crossSizeLengthForFlexItem(RenderBox::SizeType, const RenderBox&) const;
    bool shouldApplyMinSizeAutoForFlexItem(const RenderBox&) const;
    LayoutUnit crossAxisExtentForFlexItem(const RenderBox& flexItem) const;
    LayoutUnit crossAxisIntrinsicExtentForFlexItem(RenderBox& flexItem);
    LayoutUnit flexItemIntrinsicLogicalHeight(RenderBox& flexItem) const;
    LayoutUnit flexItemIntrinsicLogicalWidth(RenderBox& flexItem);
    LayoutUnit mainAxisExtentForFlexItem(const RenderBox& flexItem) const;
    LayoutUnit mainAxisContentExtentForFlexItemIncludingScrollbar(const RenderBox& flexItem) const;
    LayoutUnit crossAxisExtent() const;
    LayoutUnit mainAxisExtent() const;
    LayoutUnit crossAxisContentExtent() const;
    LayoutUnit mainAxisContentExtent(LayoutUnit contentLogicalHeight);
    std::optional<LayoutUnit> computeMainAxisExtentForFlexItem(RenderBox& flexItem, RenderBox::SizeType, const Length& size);
    FlowDirection transformedBlockFlowDirection() const;
    LayoutUnit flowAwareBorderStart() const;
    LayoutUnit flowAwareBorderEnd() const;
    LayoutUnit flowAwareBorderBefore() const;
    LayoutUnit flowAwareBorderAfter() const;
    LayoutUnit flowAwarePaddingStart() const;
    LayoutUnit flowAwarePaddingEnd() const;
    LayoutUnit flowAwarePaddingBefore() const;
    LayoutUnit flowAwarePaddingAfter() const;
    LayoutUnit flowAwareMarginStartForFlexItem(const RenderBox& flexItem) const;
    LayoutUnit flowAwareMarginEndForFlexItem(const RenderBox& flexItem) const;
    LayoutUnit flowAwareMarginBeforeForFlexItem(const RenderBox& flexItem) const;
    LayoutUnit crossAxisMarginExtentForFlexItem(const RenderBox& flexItem) const;
    LayoutUnit mainAxisMarginExtentForFlexItem(const RenderBox& flexItem) const;
    LayoutUnit crossAxisScrollbarExtent() const;
    LayoutUnit crossAxisScrollbarExtentForFlexItem(const RenderBox& flexItem) const;
    LayoutPoint flowAwareLocationForFlexItem(const RenderBox& flexItem) const;
    bool flexItemHasComputableAspectRatio(const RenderBox&) const;
    bool flexItemHasComputableAspectRatioAndCrossSizeIsConsideredDefinite(const RenderBox&);
    bool crossAxisIsPhysicalWidth() const;
    bool flexItemCrossSizeShouldUseContainerCrossSize(const RenderBox& flexItem) const;
    LayoutUnit computeCrossSizeForFlexItemUsingContainerCrossSize(const RenderBox& flexItem) const;
    void computeChildIntrinsicLogicalWidths(RenderObject&, LayoutUnit& minLogicalWidth, LayoutUnit& maxLogicalWidth) const override;
    LayoutUnit computeMainSizeFromAspectRatioUsing(const RenderBox& flexItem, Length crossSizeLength) const;
    void setFlowAwareLocationForFlexItem(RenderBox& flexItem, const LayoutPoint&);
    LayoutUnit computeFlexBaseSizeForFlexItem(RenderBox& flexItem, LayoutUnit mainAxisBorderAndPadding, bool relayoutChildren);
    void maybeCacheFlexItemMainIntrinsicSize(RenderBox& flexItem, bool relayoutChildren);
    void adjustAlignmentForFlexItem(RenderBox& flexItem, LayoutUnit);
    ItemPosition alignmentForFlexItem(const RenderBox& flexItem) const;
    inline OverflowAlignment overflowAlignmentForFlexItem(const RenderBox& flexItem) const;
    bool canComputePercentageFlexBasis(const RenderBox& flexItem, const Length& flexBasis, UpdatePercentageHeightDescendants);
    bool flexItemMainSizeIsDefinite(const RenderBox&, const Length& flexBasis);
    bool flexItemCrossSizeIsDefinite(const RenderBox&, const Length& flexBasis);
    bool needToStretchFlexItemLogicalHeight(const RenderBox& flexItem) const;
    bool flexItemHasIntrinsicMainAxisSize(const RenderBox& flexItem);
    Overflow mainAxisOverflowForFlexItem(const RenderBox& flexItem) const;
    Overflow crossAxisOverflowForFlexItem(const RenderBox& flexItem) const;
    void cacheFlexItemMainSize(const RenderBox& flexItem);
    std::optional<LayoutUnit> usedFlexItemOverridingCrossSizeForPercentageResolution(const RenderBox&);
    std::optional<LayoutUnit> usedFlexItemOverridingMainSizeForPercentageResolution(const RenderBox&);

    void performFlexLayout(bool relayoutChildren);
    LayoutUnit autoMarginOffsetInMainAxis(const FlexLayoutItems&, LayoutUnit& availableFreeSpace);
    void updateAutoMarginsInMainAxis(RenderBox& flexItem, LayoutUnit autoMarginOffset);
    void initializeMarginTrimState(); 
    // Start margin parallel with the cross axis
    bool shouldTrimMainAxisMarginStart() const;
    // End margin parallel with the cross axis
    bool shouldTrimMainAxisMarginEnd() const;
    // Margins parallel with the main axis
    bool shouldTrimCrossAxisMarginStart() const;
    bool shouldTrimCrossAxisMarginEnd() const;
    void trimMainAxisMarginStart(const FlexLayoutItem&);
    void trimMainAxisMarginEnd(const FlexLayoutItem&);
    void trimCrossAxisMarginStart(const FlexLayoutItem&);
    void trimCrossAxisMarginEnd(const FlexLayoutItem&);
    bool isChildEligibleForMarginTrim(MarginTrimType, const RenderBox&) const final;
    bool hasAutoMarginsInCrossAxis(const RenderBox& flexItem) const;
    bool updateAutoMarginsInCrossAxis(RenderBox& flexItem, LayoutUnit availableAlignmentSpace);
    void repositionLogicalHeightDependentFlexItems(FlexLineStates&, LayoutUnit gapBetweenLines);
    
    LayoutUnit availableAlignmentSpaceForFlexItem(LayoutUnit lineCrossAxisExtent, const RenderBox& flexItem);
    LayoutUnit marginBoxAscentForFlexItem(const RenderBox& flexItem);
    
    LayoutUnit computeFlexItemMarginValue(Length margin);
    void prepareOrderIteratorAndMargins();
    std::pair<LayoutUnit, LayoutUnit> computeFlexItemMinMaxSizes(RenderBox& flexItem);
    LayoutUnit adjustFlexItemSizeForAspectRatioCrossAxisMinAndMax(const RenderBox& flexItem, LayoutUnit flexItemSize);
    FlexLayoutItem constructFlexLayoutItem(RenderBox&, bool relayoutChildren);
    
    void freezeInflexibleItems(FlexSign, FlexLayoutItems&, LayoutUnit& remainingFreeSpace, double& totalFlexGrow, double& totalFlexShrink, double& totalWeightedFlexShrink);
    bool resolveFlexibleLengths(FlexSign, FlexLayoutItems&, LayoutUnit initialFreeSpace, LayoutUnit& remainingFreeSpace, double& totalFlexGrow, double& totalFlexShrink, double& totalWeightedFlexShrink);
    void freezeViolations(Vector<FlexLayoutItem*>&, LayoutUnit& availableFreeSpace, double& totalFlexGrow, double& totalFlexShrink, double& totalWeightedFlexShrink);
    
    void resetAutoMarginsAndLogicalTopInCrossAxis(RenderBox& flexItem);
    void setOverridingMainSizeForFlexItem(RenderBox&, LayoutUnit);
    void prepareFlexItemForPositionedLayout(RenderBox& flexItem);
    void layoutAndPlaceFlexItems(LayoutUnit& crossAxisOffset, FlexLayoutItems&, LayoutUnit availableFreeSpace, bool relayoutChildren, FlexLineStates&, LayoutUnit gapBetweenItems);
    void layoutColumnReverse(const FlexLayoutItems&, LayoutUnit crossAxisOffset, LayoutUnit availableFreeSpace, LayoutUnit gapBetweenItems);
    void alignFlexLines(FlexLineStates&, LayoutUnit gapBetweenLines);
    void alignFlexItems(FlexLineStates&);
    void applyStretchAlignmentToFlexItem(RenderBox& flexItem, LayoutUnit lineCrossAxisExtent);
    void performBaselineAlignment(LineState&);
    void flipForRightToLeftColumn(const FlexLineStates& linesState);
    void flipForWrapReverse(const FlexLineStates&, LayoutUnit crossAxisStartEdge);
    
    void appendFlexItemFrameRects(FlexItemFrameRects&);
    void repaintFlexItemsDuringLayoutIfMoved(const FlexItemFrameRects&);

    bool flexItemHasPercentHeightDescendants(const RenderBox&) const;

    void resetHasDefiniteHeight() { m_hasDefiniteHeight = SizeDefiniteness::Unknown; }
    const RenderBox* flexItemForFirstBaseline() const;
    const RenderBox* flexItemForLastBaseline() const;
    const RenderBox* firstBaselineCandidateOnLine(OrderIterator, ItemPosition baselinePosition, size_t numberOfItemsOnLine) const;
    const RenderBox* lastBaselineCandidateOnLine(OrderIterator, ItemPosition baselinePosition, size_t numberOfItemsOnLine) const;

    bool layoutUsingFlexFormattingContext();

    // This is used to cache the preferred size for orthogonal flow children so we
    // don't have to relayout to get it
    UncheckedKeyHashMap<SingleThreadWeakRef<const RenderBox>, LayoutUnit> m_intrinsicSizeAlongMainAxis;
    
    // This is used to cache the intrinsic size on the cross axis to avoid
    // relayouts when stretching.
    UncheckedKeyHashMap<SingleThreadWeakRef<const RenderBox>, LayoutUnit> m_intrinsicContentLogicalHeights;

    // This set is used to keep track of which children we laid out in this
    // current layout iteration. We need it because the ones in this set may
    // need an additional layout pass for correct stretch alignment handling, as
    // the first layout likely did not use the correct value for percentage
    // sizing of children.
    SingleThreadWeakHashSet<const RenderBox> m_relaidOutFlexItems;

    mutable OrderIterator m_orderIterator { *this };
    size_t m_numberOfFlexItemsOnFirstLine { 0 };
    size_t m_numberOfFlexItemsOnLastLine { 0 };

    struct MarginTrimItems {
        SingleThreadWeakHashSet<const RenderBox> m_itemsAtFlexLineStart;
        SingleThreadWeakHashSet<const RenderBox> m_itemsAtFlexLineEnd;
        SingleThreadWeakHashSet<const RenderBox> m_itemsOnFirstFlexLine;
        SingleThreadWeakHashSet<const RenderBox> m_itemsOnLastFlexLine;
    } m_marginTrimItems;

    LayoutUnit m_alignContentStartOverflow { 0 };
    LayoutUnit m_justifyContentStartOverflow { 0 };

    // This is SizeIsUnknown outside of layoutBlock()
    SizeDefiniteness m_hasDefiniteHeight { SizeDefiniteness::Unknown };
    bool m_inLayout { false };
    bool m_shouldResetFlexItemLogicalHeightBeforeLayout { false };
    bool m_isComputingFlexBaseSizes { false };
    std::optional<bool> m_hasFlexFormattingContextLayout;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_RENDER_OBJECT(RenderFlexibleBox, isRenderFlexibleBox())
