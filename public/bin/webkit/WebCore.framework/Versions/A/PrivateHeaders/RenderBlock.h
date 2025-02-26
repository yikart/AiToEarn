/*
 * Copyright (C) 1999 Lars Knoll (knoll@kde.org)
 *           (C) 1999 Antti Koivisto (koivisto@kde.org)
 *           (C) 2007 David Smith (catfish.man@gmail.com)
 * Copyright (C) 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010 Apple Inc. All rights reserved.
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Library General Public License
 * along with this library; see the file COPYING.LIB.  If not, write to
 * the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 * Boston, MA 02110-1301, USA.
 */

#pragma once

#include "GapRects.h"
#include "LineWidth.h"
#include "RenderBox.h"
#include "TextRun.h"
#include <memory>
#include <wtf/WeakListHashSet.h>

namespace WebCore {

class LineLayoutState;
class LogicalSelectionOffsetCaches;
class RenderInline;
class RenderText;

struct BidiRun;
struct PaintInfo;
struct RenderBlockRareData;

using TrackedRendererListHashSet = SingleThreadWeakListHashSet<RenderBox>;

enum CaretType { CursorCaret, DragCaret };
enum ContainingBlockState { NewContainingBlock, SameContainingBlock };

enum TextRunFlag {
    DefaultTextRunFlags = 0,
    RespectDirection = 1 << 0,
    RespectDirectionOverride = 1 << 1
};

typedef unsigned TextRunFlags;

class RenderBlock : public RenderBox {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(RenderBlock);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(RenderBlock);
public:
    friend class LineLayoutState;
    virtual ~RenderBlock();

protected:
    RenderBlock(Type, Element&, RenderStyle&&, OptionSet<TypeFlag>, TypeSpecificFlags = { });
    RenderBlock(Type, Document&, RenderStyle&&, OptionSet<TypeFlag>, TypeSpecificFlags = { });

public:
    // These two functions are overridden for inline-block.
    LayoutUnit lineHeight(bool firstLine, LineDirectionMode, LinePositionMode = PositionOnContainingLine) const final;
    LayoutUnit baselinePosition(FontBaseline, bool firstLine, LineDirectionMode, LinePositionMode = PositionOnContainingLine) const override;

    LayoutUnit minLineHeightForReplacedRenderer(bool isFirstLine, LayoutUnit replacedHeight) const;

    // FIXME-BLOCKFLOW: Remove virtualizaion when all callers have moved to RenderBlockFlow
    virtual void deleteLines();

    virtual void layoutBlock(bool relayoutChildren, LayoutUnit pageLogicalHeight = 0_lu);

    void insertPositionedObject(RenderBox&);
    static void removePositionedObject(const RenderBox&);
    void removePositionedObjects(const RenderBlock*, ContainingBlockState = SameContainingBlock);

    TrackedRendererListHashSet* positionedObjects() const;
    bool hasPositionedObjects() const
    {
        auto* objects = positionedObjects();
        return objects && !objects->isEmptyIgnoringNullReferences();
    }

    void addPercentHeightDescendant(RenderBox&);
    static void removePercentHeightDescendant(RenderBox&);
    TrackedRendererListHashSet* percentHeightDescendants() const;
    bool hasPercentHeightDescendants() const
    {
        auto* objects = percentHeightDescendants();
        return objects && !objects->isEmptyIgnoringNullReferences();
    }
    static bool hasPercentHeightContainerMap();
    static bool hasPercentHeightDescendant(RenderBox&);
    static void clearPercentHeightDescendantsFrom(RenderBox&);
    static void removePercentHeightDescendantIfNeeded(RenderBox&);

    bool isContainingBlockAncestorFor(RenderObject&) const;

    void setHasMarginBeforeQuirk(bool b) { setRenderBlockHasMarginBeforeQuirk(b); }
    void setHasMarginAfterQuirk(bool b) { setRenderBlockHasMarginAfterQuirk(b); }
    void setShouldForceRelayoutChildren(bool b) { setRenderBlockShouldForceRelayoutChildren(b); }

    bool hasMarginBeforeQuirk() const { return renderBlockHasMarginBeforeQuirk(); }
    bool hasMarginAfterQuirk() const { return renderBlockHasMarginAfterQuirk(); }
    bool hasBorderOrPaddingLogicalWidthChanged() const { return renderBlockShouldForceRelayoutChildren(); }

    bool hasMarginBeforeQuirk(const RenderBox& child) const;
    bool hasMarginAfterQuirk(const RenderBox& child) const;

    virtual bool shouldChildInlineMarginContributeToContainerIntrinsicSize(MarginTrimType /* marginSide */, const RenderElement&) const { return true; }

    void markPositionedObjectsForLayout();
    void markForPaginationRelayoutIfNeeded() override;
    
    // FIXME-BLOCKFLOW: Remove virtualizaion when all of the line layout code has been moved out of RenderBlock
    virtual bool containsFloats() const { return false; }

    // Versions that can compute line offsets with the fragment and page offset passed in. Used for speed to avoid having to
    // compute the fragment all over again when you already know it.
    LayoutUnit availableLogicalWidthForLineInFragment(LayoutUnit position, RenderFragmentContainer* fragment, LayoutUnit logicalHeight = 0_lu) const
    {
        return std::max<LayoutUnit>(0, logicalRightOffsetForLineInFragment(position, fragment, logicalHeight)
            - logicalLeftOffsetForLineInFragment(position, fragment, logicalHeight));
    }
    LayoutUnit logicalRightOffsetForLineInFragment(LayoutUnit position, RenderFragmentContainer* fragment, LayoutUnit logicalHeight = 0_lu) const
    {
        return adjustLogicalRightOffsetForLine(logicalRightFloatOffsetForLine(position, logicalRightOffsetForContent(fragment), logicalHeight));
    }
    LayoutUnit logicalLeftOffsetForLineInFragment(LayoutUnit position, RenderFragmentContainer* fragment, LayoutUnit logicalHeight = 0_lu) const
    {
        return adjustLogicalLeftOffsetForLine(logicalLeftFloatOffsetForLine(position, logicalLeftOffsetForContent(fragment), logicalHeight));
    }
    inline LayoutUnit startOffsetForLineInFragment(LayoutUnit position, RenderFragmentContainer*, LayoutUnit logicalHeight = 0_lu) const;
    inline LayoutUnit endOffsetForLineInFragment(LayoutUnit position, RenderFragmentContainer*, LayoutUnit logicalHeight = 0_lu) const;

    LayoutUnit availableLogicalWidthForLine(LayoutUnit position, LayoutUnit logicalHeight = 0_lu) const
    {
        return availableLogicalWidthForLineInFragment(position, fragmentAtBlockOffset(position), logicalHeight);
    }
    LayoutUnit logicalRightOffsetForLine(LayoutUnit position, LayoutUnit logicalHeight = 0_lu) const
    {
        return adjustLogicalRightOffsetForLine(logicalRightFloatOffsetForLine(position, logicalRightOffsetForContent(position), logicalHeight));
    }
    LayoutUnit logicalLeftOffsetForLine(LayoutUnit position, LayoutUnit logicalHeight = 0_lu) const
    {
        return adjustLogicalLeftOffsetForLine(logicalLeftFloatOffsetForLine(position, logicalLeftOffsetForContent(position), logicalHeight));
    }
    inline LayoutUnit startOffsetForLine(LayoutUnit position, LayoutUnit logicalHeight = 0_lu) const;
    inline LayoutUnit endOffsetForLine(LayoutUnit position, LayoutUnit logicalHeight = 0_lu) const;

    LayoutUnit textIndentOffset() const;

    VisiblePosition positionForPoint(const LayoutPoint&, HitTestSource, const RenderFragmentContainer*) override;

    GapRects selectionGapRectsForRepaint(const RenderLayerModelObject* repaintContainer);
    LayoutRect logicalLeftSelectionGap(RenderBlock& rootBlock, const LayoutPoint& rootBlockPhysicalPosition, const LayoutSize& offsetFromRootBlock, RenderElement* selObj, LayoutUnit logicalLeft, LayoutUnit logicalTop, LayoutUnit logicalHeight, const LogicalSelectionOffsetCaches&, const PaintInfo*);
    LayoutRect logicalRightSelectionGap(RenderBlock& rootBlock, const LayoutPoint& rootBlockPhysicalPosition, const LayoutSize& offsetFromRootBlock, RenderElement* selObj, LayoutUnit logicalRight, LayoutUnit logicalTop, LayoutUnit logicalHeight, const LogicalSelectionOffsetCaches&, const PaintInfo*);
    void getSelectionGapInfo(HighlightState, bool& leftGap, bool& rightGap);
    bool isSelectionRoot() const;

    LayoutRect logicalRectToPhysicalRect(const LayoutPoint& physicalPosition, const LayoutRect& logicalRect);

    void addContinuationWithOutline(RenderInline*);
    bool paintsContinuationOutline(RenderInline*);

    static RenderPtr<RenderBlock> createAnonymousWithParentRendererAndDisplay(const RenderBox& parent, DisplayType = DisplayType::Block);
    RenderPtr<RenderBlock> createAnonymousBlock(DisplayType = DisplayType::Block) const;

    RenderPtr<RenderBox> createAnonymousBoxWithSameTypeAs(const RenderBox&) const override;

    static inline bool shouldSkipCreatingRunsForObject(RenderObject&);

    static TextRun constructTextRun(StringView, const RenderStyle&,
        ExpansionBehavior = ExpansionBehavior::defaultBehavior(), TextRunFlags = DefaultTextRunFlags);
    static TextRun constructTextRun(const String&, const RenderStyle&,
        ExpansionBehavior = ExpansionBehavior::defaultBehavior(), TextRunFlags = DefaultTextRunFlags);
    static TextRun constructTextRun(const AtomString&, const RenderStyle&,
        ExpansionBehavior = ExpansionBehavior::defaultBehavior(), TextRunFlags = DefaultTextRunFlags);
    static TextRun constructTextRun(const RenderText&, const RenderStyle&,
        ExpansionBehavior = ExpansionBehavior::defaultBehavior());
    static TextRun constructTextRun(const RenderText&, unsigned offset, unsigned length, const RenderStyle&,
        ExpansionBehavior = ExpansionBehavior::defaultBehavior());
    static TextRun constructTextRun(std::span<const LChar> characters, const RenderStyle&,
        ExpansionBehavior = ExpansionBehavior::defaultBehavior());
    static TextRun constructTextRun(std::span<const UChar> characters, const RenderStyle&,
        ExpansionBehavior = ExpansionBehavior::defaultBehavior());

    LayoutUnit paginationStrut() const;
    void setPaginationStrut(LayoutUnit);

    // The page logical offset is the object's offset from the top of the page in the page progression
    // direction (so an x-offset in vertical text and a y-offset for horizontal text).
    LayoutUnit pageLogicalOffset() const;
    void setPageLogicalOffset(LayoutUnit);

    // Fieldset legends that are taller than the fieldset border add in intrinsic border
    // in order to ensure that content gets properly pushed down across all layout systems
    // (flexbox, block, etc.)
    LayoutUnit intrinsicBorderForFieldset() const;
    void setIntrinsicBorderForFieldset(LayoutUnit);

    RectEdges<LayoutUnit> borderWidths() const override;
    LayoutUnit borderTop() const override;
    LayoutUnit borderBottom() const override;
    LayoutUnit borderLeft() const override;
    LayoutUnit borderRight() const override;

    LayoutUnit borderBefore() const override;
    LayoutUnit adjustBorderBoxLogicalHeightForBoxSizing(LayoutUnit height) const override;
    LayoutUnit adjustContentBoxLogicalHeightForBoxSizing(std::optional<LayoutUnit> height) const override;
    LayoutUnit adjustIntrinsicLogicalHeightForBoxSizing(LayoutUnit height) const override;
    void paintExcludedChildrenInBorder(PaintInfo&, const LayoutPoint&);
    
    // Accessors for logical width/height and margins in the containing block's block-flow direction.
    enum ApplyLayoutDeltaMode { ApplyLayoutDelta, DoNotApplyLayoutDelta };
    LayoutUnit logicalWidthForChild(const RenderBox& child) const { return isHorizontalWritingMode() ? child.width() : child.height(); }
    LayoutUnit logicalHeightForChild(const RenderBox& child) const { return isHorizontalWritingMode() ? child.height() : child.width(); }
    inline LayoutUnit logicalMarginBoxHeightForChild(const RenderBox& child) const;
    LayoutSize logicalSizeForChild(const RenderBox& child) const { return isHorizontalWritingMode() ? child.size() : child.size().transposedSize(); }
    LayoutUnit logicalTopForChild(const RenderBox& child) const { return isHorizontalWritingMode() ? child.y() : child.x(); }
    LayoutUnit logicalLeftForChild(const RenderBox& child) const { return isHorizontalWritingMode() ? child.x() : child.y(); }
    void setLogicalLeftForChild(RenderBox& child, LayoutUnit logicalLeft, ApplyLayoutDeltaMode = DoNotApplyLayoutDelta);
    void setLogicalTopForChild(RenderBox& child, LayoutUnit logicalTop, ApplyLayoutDeltaMode = DoNotApplyLayoutDelta);
    LayoutUnit marginBeforeForChild(const RenderBoxModelObject& child) const { return child.marginBefore(writingMode()); }
    LayoutUnit marginAfterForChild(const RenderBoxModelObject& child) const { return child.marginAfter(writingMode()); }
    LayoutUnit marginStartForChild(const RenderBoxModelObject& child) const { return child.marginStart(writingMode()); }
    LayoutUnit marginEndForChild(const RenderBoxModelObject& child) const { return child.marginEnd(writingMode()); }
    void setMarginStartForChild(RenderBox& child, LayoutUnit value) const { child.setMarginStart(value, writingMode()); }
    void setMarginEndForChild(RenderBox& child, LayoutUnit value) const { child.setMarginEnd(value, writingMode()); }
    void setMarginBeforeForChild(RenderBox& child, LayoutUnit value) const { child.setMarginBefore(value, writingMode()); }
    void setMarginAfterForChild(RenderBox& child, LayoutUnit value) const { child.setMarginAfter(value, writingMode()); }
    void setTrimmedMarginForChild(RenderBox& child, MarginTrimType);
    LayoutUnit collapsedMarginBeforeForChild(const RenderBox& child) const;
    LayoutUnit collapsedMarginAfterForChild(const RenderBox& child) const;

    void getFirstLetter(RenderObject*& firstLetter, RenderElement*& firstLetterContainer, RenderObject* skipObject = nullptr);

    virtual void scrollbarsChanged(bool /*horizontalScrollbarChanged*/, bool /*verticalScrollbarChanged*/) { }

    LayoutUnit logicalLeftOffsetForContent(RenderFragmentContainer*) const;
    LayoutUnit logicalRightOffsetForContent(RenderFragmentContainer*) const;
    LayoutUnit availableLogicalWidthForContent(RenderFragmentContainer* fragment) const
    { 
        return std::max<LayoutUnit>(0, logicalRightOffsetForContent(fragment) - logicalLeftOffsetForContent(fragment));
    }
    inline LayoutUnit startOffsetForContent(RenderFragmentContainer*) const;
    inline LayoutUnit endOffsetForContent(RenderFragmentContainer*) const;
    LayoutUnit logicalLeftOffsetForContent(LayoutUnit blockOffset) const
    {
        return logicalLeftOffsetForContent(fragmentAtBlockOffset(blockOffset));
    }
    LayoutUnit logicalRightOffsetForContent(LayoutUnit blockOffset) const
    {
        return logicalRightOffsetForContent(fragmentAtBlockOffset(blockOffset));
    }
    LayoutUnit availableLogicalWidthForContent(LayoutUnit blockOffset) const
    {
        return availableLogicalWidthForContent(fragmentAtBlockOffset(blockOffset));
    }
    inline LayoutUnit startOffsetForContent(LayoutUnit blockOffset) const;
    inline LayoutUnit endOffsetForContent(LayoutUnit blockOffset) const;
    inline LayoutUnit logicalLeftOffsetForContent() const;
    inline LayoutUnit logicalRightOffsetForContent() const;
    inline LayoutUnit startOffsetForContent() const;
    inline LayoutUnit endOffsetForContent() const;

    LayoutUnit logicalLeftSelectionOffset(RenderBlock& rootBlock, LayoutUnit position, const LogicalSelectionOffsetCaches&);
    LayoutUnit logicalRightSelectionOffset(RenderBlock& rootBlock, LayoutUnit position, const LogicalSelectionOffsetCaches&);

#if ASSERT_ENABLED
    void checkPositionedObjectsNeedLayout();
#endif

    void updateHitTestResult(HitTestResult&, const LayoutPoint&) const override;

    bool canHaveChildren() const override { return true; }
    virtual bool canDropAnonymousBlockChild() const { return true; }

    RenderFragmentedFlow* cachedEnclosingFragmentedFlow() const;
    void setCachedEnclosingFragmentedFlowNeedsUpdate();
    virtual bool cachedEnclosingFragmentedFlowNeedsUpdate() const;
    void resetEnclosingFragmentedFlowAndChildInfoIncludingDescendants(RenderFragmentedFlow* = nullptr) final;

    std::optional<LayoutUnit> availableLogicalHeightForPercentageComputation() const;
    bool hasDefiniteLogicalHeight() const;

    virtual bool shouldResetChildLogicalHeightBeforeLayout(const RenderBox&) const { return false; }

    static String updateSecurityDiscCharacters(const RenderStyle&, String&&);

    virtual bool hasLineIfEmpty() const;

    void updateDescendantTransformsAfterLayout();

protected:
    RenderFragmentedFlow* locateEnclosingFragmentedFlow() const override;

    void layout() override;

    void layoutPositionedObjects(bool relayoutChildren, bool fixedPositionObjectsOnly = false);
    virtual void layoutPositionedObject(RenderBox&, bool relayoutChildren, bool fixedPositionObjectsOnly);
    
    void markFixedPositionObjectForLayoutIfNeeded(RenderBox& child);

    LayoutUnit marginIntrinsicLogicalWidthForChild(RenderBox&) const;

    void paint(PaintInfo&, const LayoutPoint&) override;
    void paintObject(PaintInfo&, const LayoutPoint&) override;
    virtual void paintChildren(PaintInfo& forSelf, const LayoutPoint&, PaintInfo& forChild, bool usePrintRect);
    enum PaintBlockType { PaintAsBlock, PaintAsInlineBlock };
    bool paintChild(RenderBox&, PaintInfo& forSelf, const LayoutPoint&, PaintInfo& forChild, bool usePrintRect, PaintBlockType paintType = PaintAsBlock);

    bool nodeAtPoint(const HitTestRequest&, HitTestResult&, const HitTestLocation& locationInContainer, const LayoutPoint& accumulatedOffset, HitTestAction) override;

    void computeIntrinsicLogicalWidths(LayoutUnit& minLogicalWidth, LayoutUnit& maxLogicalWidth) const override;
    void computePreferredLogicalWidths() override;
    
    std::optional<LayoutUnit> firstLineBaseline() const override;
    std::optional<LayoutUnit> lastLineBaseline() const override;
    std::optional<LayoutUnit> inlineBlockBaseline(LineDirectionMode) const override;

    // Delay updating scrollbars until endAndCommitUpdateScrollInfoAfterLayoutTransaction() is called. These functions are used
    // when a flexbox is laying out its descendants. If multiple calls are made to beginUpdateScrollInfoAfterLayoutTransaction()
    // then endAndCommitUpdateScrollInfoAfterLayoutTransaction() will do nothing until it is called the same number of times.
    void beginUpdateScrollInfoAfterLayoutTransaction();
    void endAndCommitUpdateScrollInfoAfterLayoutTransaction();

    void removeFromUpdateScrollInfoAfterLayoutTransaction();

    void updateScrollInfoAfterLayout();

    void styleWillChange(StyleDifference, const RenderStyle& newStyle) override;
    void styleDidChange(StyleDifference, const RenderStyle* oldStyle) override;

    virtual bool canPerformSimplifiedLayout() const;
    bool simplifiedLayout();
    virtual void simplifiedNormalFlowLayout();

    bool childBoxIsUnsplittableForFragmentation(const RenderBox& child) const;

    static LayoutUnit layoutOverflowLogicalBottom(const RenderBlock&);

    String debugDescription() const override;

public:
    virtual void computeOverflow(LayoutUnit oldClientAfterEdge, bool recomputeFloats = false);
    void clearLayoutOverflow();
    
    // Adjust from painting offsets to the local coords of this renderer
    void offsetForContents(LayoutPoint&) const;

    enum FieldsetFindLegendOption { FieldsetIgnoreFloatingOrOutOfFlow, FieldsetIncludeFloatingOrOutOfFlow };
    RenderBox* findFieldsetLegend(FieldsetFindLegendOption = FieldsetIgnoreFloatingOrOutOfFlow) const;
    virtual void layoutExcludedChildren(bool /*relayoutChildren*/);
    virtual bool computePreferredWidthsForExcludedChildren(LayoutUnit&, LayoutUnit&) const;
    
    void adjustBorderBoxRectForPainting(LayoutRect&) override;
    LayoutRect paintRectToClipOutFromBorder(const LayoutRect&) override;
    bool isInlineBlockOrInlineTable() const final { return isInline() && isReplacedOrInlineBlock(); }
    
    void boundingRects(Vector<LayoutRect>&, const LayoutPoint& accumulatedOffset) const override;
    void absoluteQuads(Vector<FloatQuad>&, bool* wasFixed) const override;

protected:
    virtual bool isPointInOverflowControl(HitTestResult&, const LayoutPoint& locationInContainer, const LayoutPoint& accumulatedOffset);

    virtual void addOverflowFromChildren();
    // FIXME-BLOCKFLOW: Remove virtualization when all callers have moved to RenderBlockFlow
    virtual void addOverflowFromInlineChildren() { }
    void addOverflowFromBlockChildren();
    void addOverflowFromPositionedObjects();
    void addVisualOverflowFromTheme();

    void addFocusRingRects(Vector<LayoutRect>&, const LayoutPoint& additionalOffset, const RenderLayerModelObject* paintContainer = 0) const override;
    virtual void addFocusRingRectsForInlineChildren(Vector<LayoutRect>&, const LayoutPoint& additionalOffset, const RenderLayerModelObject* paintContainer) const;

    void computeFragmentRangeForBoxChild(const RenderBox&) const;

    void estimateFragmentRangeForBoxChild(const RenderBox&) const;
    bool updateFragmentRangeForBoxChild(const RenderBox&) const;

    void updateBlockChildDirtyBitsBeforeLayout(bool relayoutChildren, RenderBox&);

    void preparePaginationBeforeBlockLayout(bool&);

    void computeChildPreferredLogicalWidths(RenderObject&, LayoutUnit& minPreferredLogicalWidth, LayoutUnit& maxPreferredLogicalWidth) const;

    virtual void computeChildIntrinsicLogicalWidths(RenderObject&, LayoutUnit& minPreferredLogicalWidth, LayoutUnit& maxPreferredLogicalWidth) const;

private:
    static RenderPtr<RenderBlock> createAnonymousBlockWithStyleAndDisplay(Document&, const RenderStyle&, DisplayType);

    // FIXME-BLOCKFLOW: Remove virtualizaion when all callers have moved to RenderBlockFlow
    virtual LayoutUnit logicalRightFloatOffsetForLine(LayoutUnit, LayoutUnit fixedOffset, LayoutUnit) const { return fixedOffset; };
    // FIXME-BLOCKFLOW: Remove virtualizaion when all callers have moved to RenderBlockFlow
    virtual LayoutUnit logicalLeftFloatOffsetForLine(LayoutUnit, LayoutUnit fixedOffset, LayoutUnit) const { return fixedOffset; }
    LayoutUnit adjustLogicalRightOffsetForLine(LayoutUnit offsetFromFloats) const;
    LayoutUnit adjustLogicalLeftOffsetForLine(LayoutUnit offsetFromFloats) const;

    ASCIILiteral renderName() const override;

    bool isSelfCollapsingBlock() const override;
    virtual bool childrenPreventSelfCollapsing() const;

    // FIXME-BLOCKFLOW: Remove virtualizaion when all callers have moved to RenderBlockFlow
    virtual void paintFloats(PaintInfo&, const LayoutPoint&, bool) { }
    virtual void paintInlineChildren(PaintInfo&, const LayoutPoint&) { }
    void paintContents(PaintInfo&, const LayoutPoint&);
    virtual void paintColumnRules(PaintInfo&, const LayoutPoint&) { };
    void paintSelection(PaintInfo&, const LayoutPoint&);
    void paintCaret(PaintInfo&, const LayoutPoint&, CaretType);
    void paintCarets(PaintInfo&, const LayoutPoint&);

    Node* nodeForHitTest() const override;

    virtual bool hitTestContents(const HitTestRequest&, HitTestResult&, const HitTestLocation& locationInContainer, const LayoutPoint& accumulatedOffset, HitTestAction);
    // FIXME-BLOCKFLOW: Remove virtualization when all callers have moved to RenderBlockFlow
    virtual bool hitTestFloats(const HitTestRequest&, HitTestResult&, const HitTestLocation&, const LayoutPoint&) { return false; }
    virtual bool hitTestChildren(const HitTestRequest&, HitTestResult&, const HitTestLocation& locationInContainer, const LayoutPoint& adjustedLocation, HitTestAction);
    virtual bool hitTestInlineChildren(const HitTestRequest&, HitTestResult&, const HitTestLocation&, const LayoutPoint&, HitTestAction) { return false; }
    bool hitTestExcludedChildrenInBorder(const HitTestRequest&, HitTestResult&, const HitTestLocation& locationInContainer, const LayoutPoint& accumulatedOffset, HitTestAction);

    void computeBlockPreferredLogicalWidths(LayoutUnit& minLogicalWidth, LayoutUnit& maxLogicalWidth) const;
    
    LayoutRect rectWithOutlineForRepaint(const RenderLayerModelObject* repaintContainer, LayoutUnit outlineWidth) const final;
    const RenderStyle& outlineStyleForRepaint() const final;

    LayoutRect selectionRectForRepaint(const RenderLayerModelObject* repaintContainer, bool /*clipToVisibleContent*/) final
    {
        return selectionGapRectsForRepaint(repaintContainer);
    }
    bool shouldPaintSelectionGaps() const final;
    GapRects selectionGaps(RenderBlock& rootBlock, const LayoutPoint& rootBlockPhysicalPosition, const LayoutSize& offsetFromRootBlock,
        LayoutUnit& lastLogicalTop, LayoutUnit& lastLogicalLeft, LayoutUnit& lastLogicalRight, const LogicalSelectionOffsetCaches&, const PaintInfo* = 0);
    // FIXME-BLOCKFLOW: Remove virtualizaion when all callers have moved to RenderBlockFlow
    virtual GapRects inlineSelectionGaps(RenderBlock& rootBlock, const LayoutPoint& rootBlockPhysicalPosition, const LayoutSize& offsetFromRootBlock,
        LayoutUnit& lastLogicalTop, LayoutUnit& lastLogicalLeft, LayoutUnit& lastLogicalRight, const LogicalSelectionOffsetCaches&, const PaintInfo*);
    GapRects blockSelectionGaps(RenderBlock& rootBlock, const LayoutPoint& rootBlockPhysicalPosition, const LayoutSize& offsetFromRootBlock,
        LayoutUnit& lastLogicalTop, LayoutUnit& lastLogicalLeft, LayoutUnit& lastLogicalRight, const LogicalSelectionOffsetCaches&, const PaintInfo*);
    LayoutRect blockSelectionGap(RenderBlock& rootBlock, const LayoutPoint& rootBlockPhysicalPosition, const LayoutSize& offsetFromRootBlock,
        LayoutUnit lastLogicalTop, LayoutUnit lastLogicalLeft, LayoutUnit lastLogicalRight, LayoutUnit logicalBottom, const LogicalSelectionOffsetCaches&, const PaintInfo*);

    // FIXME-BLOCKFLOW: Remove virtualizaion when all callers have moved to RenderBlockFlow
    virtual void clipOutFloatingObjects(RenderBlock&, const PaintInfo*, const LayoutPoint&, const LayoutSize&) { };
    friend class LogicalSelectionOffsetCaches;

    void paintContinuationOutlines(PaintInfo&, const LayoutPoint&);

    // FIXME-BLOCKFLOW: Remove virtualizaion when all callers have moved to RenderBlockFlow
    virtual VisiblePosition positionForPointWithInlineChildren(const LayoutPoint&, HitTestSource, const RenderFragmentContainer*);

    RenderPtr<RenderBlock> clone() const;

    RenderFragmentedFlow* updateCachedEnclosingFragmentedFlow(RenderFragmentedFlow*) const;

    void removePositionedObjectsIfNeeded(const RenderStyle& oldStyle, const RenderStyle& newStyle);

    void absoluteQuadsIgnoringContinuation(const FloatRect&, Vector<FloatQuad>&, bool* wasFixed) const override;

    void paintDebugBoxShadowIfApplicable(GraphicsContext&, const LayoutRect&) const;

    bool contentBoxLogicalWidthChanged(const RenderStyle&, const RenderStyle&);
    bool paddingBoxLogicaHeightChanged(const RenderStyle& oldStyle, const RenderStyle& newStyle);
    bool scrollbarWidthDidChange(const RenderStyle&, const RenderStyle&, ScrollbarOrientation);

protected:
    void dirtyForLayoutFromPercentageHeightDescendants();

    RenderBlockRareData& ensureBlockRareData();
    RenderBlockRareData* getBlockRareData() const;

protected:
    bool recomputeLogicalWidth();
    
public:
    LayoutUnit offsetFromLogicalTopOfFirstPage() const override;
    RenderFragmentContainer* fragmentAtBlockOffset(LayoutUnit) const;

    // FIXME: This is temporary to allow us to move code from RenderBlock into RenderBlockFlow that accesses member variables that we haven't moved out of
    // RenderBlock yet.
    friend class RenderBlockFlow;
    // FIXME-BLOCKFLOW: Remove this when the line layout stuff has all moved out of RenderBlock
    friend class LineBreaker;

private:
    // Used to store state between styleWillChange and styleDidChange
    static bool s_canPropagateFloatIntoSibling;
};

LayoutUnit blockDirectionOffset(RenderBlock& rootBlock, const LayoutSize& offsetFromRootBlock);
LayoutUnit inlineDirectionOffset(RenderBlock& rootBlock, const LayoutSize& offsetFromRootBlock);
VisiblePosition positionForPointRespectingEditingBoundaries(RenderBlock&, RenderBox&, const LayoutPoint&, HitTestSource);

inline RenderPtr<RenderBlock> RenderBlock::createAnonymousWithParentRendererAndDisplay(const RenderBox& parent, DisplayType display)
{
    return createAnonymousBlockWithStyleAndDisplay(parent.document(), parent.style(), display);
}

inline RenderPtr<RenderBox> RenderBlock::createAnonymousBoxWithSameTypeAs(const RenderBox& renderer) const
{
    return createAnonymousBlockWithStyleAndDisplay(document(), renderer.style(), style().display());
}

inline RenderPtr<RenderBlock> RenderBlock::createAnonymousBlock(DisplayType display) const
{
    return createAnonymousBlockWithStyleAndDisplay(document(), style(), display);
}

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_RENDER_OBJECT(RenderBlock, isRenderBlock())
