/*
 * Copyright (C) 1999 Lars Knoll (knoll@kde.org)
 *           (C) 1999 Antti Koivisto (koivisto@kde.org)
 * Copyright (C) 2003-2024 Apple Inc. All rights reserved.
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
 *
 */

#pragma once

#include "FontBaseline.h"
#include "LocalFrameView.h"
#include "RenderBoxModelObject.h"
#include "RenderOverflow.h"
#include "ScrollSnapOffsetsInfo.h"
#include "ScrollTypes.h"
#include "ShapeOutsideInfo.h"
#include <wtf/TypeCasts.h>

namespace WebCore {

class RenderBlockFlow;
class RenderBoxFragmentInfo;
class RenderFragmentContainer;
class RoundedRectRadii;
struct PaintInfo;

enum class AvailableLogicalHeightType : bool { ExcludeMarginBorderPadding, IncludeMarginBorderPadding };

enum class ShouldComputePreferred : bool { ComputeActual, ComputePreferred };

enum class StretchingMode { Any, Explicit };

class RenderBox : public RenderBoxModelObject {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(RenderBox);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(RenderBox);
public:
    virtual ~RenderBox();

    bool requiresLayer() const override;

    bool requiresLayerWithScrollableArea() const;
    bool backgroundIsKnownToBeOpaqueInRect(const LayoutRect& localRect) const final;

    LayoutUnit x() const { return m_frameRect.x(); }
    LayoutUnit y() const { return m_frameRect.y(); }
    LayoutUnit width() const { return m_frameRect.width(); }
    LayoutUnit height() const { return m_frameRect.height(); }

    // These represent your location relative to your container as a physical offset.
    // In layout related methods you almost always want the logical location (e.g. x() and y()).
    LayoutUnit top() const { return topLeftLocation().y(); }
    LayoutUnit left() const { return topLeftLocation().x(); }

    template<typename T> void setX(T x) { m_frameRect.setX(x); }
    template<typename T> void setY(T y) { m_frameRect.setY(y); }
    template<typename T> void setWidth(T width) { m_frameRect.setWidth(width); }
    template<typename T> void setHeight(T height) { m_frameRect.setHeight(height); }

    inline LayoutUnit logicalLeft() const;
    inline LayoutUnit logicalRight() const;
    inline LayoutUnit logicalTop() const;
    inline LayoutUnit logicalBottom() const;
    inline LayoutUnit logicalWidth() const;
    inline LayoutUnit logicalHeight() const;

    enum class AllowIntrinsic : bool { No, Yes };
    LayoutUnit constrainLogicalWidthInFragmentByMinMax(LayoutUnit, LayoutUnit, const RenderBlock&, RenderFragmentContainer*, AllowIntrinsic = AllowIntrinsic::Yes) const;
    LayoutUnit constrainLogicalHeightByMinMax(LayoutUnit logicalHeight, std::optional<LayoutUnit> intrinsicContentHeight) const;
    LayoutUnit constrainContentBoxLogicalHeightByMinMax(LayoutUnit logicalHeight, std::optional<LayoutUnit> intrinsicContentHeight) const;

    inline void setLogicalLeft(LayoutUnit);
    inline void setLogicalTop(LayoutUnit);
    inline void setLogicalLocation(LayoutPoint);
    inline void setLogicalWidth(LayoutUnit);
    inline void setLogicalHeight(LayoutUnit);
    inline void setLogicalSize(LayoutSize);

    LayoutPoint location() const { return m_frameRect.location(); }
    LayoutSize locationOffset() const { return LayoutSize(x(), y()); }
    LayoutSize size() const { return m_frameRect.size(); }
    inline LayoutSize logicalSize() const;

    void setLocation(const LayoutPoint& location) { m_frameRect.setLocation(location); }
    
    void setSize(const LayoutSize& size) { m_frameRect.setSize(size); }
    void move(LayoutUnit dx, LayoutUnit dy) { m_frameRect.move(dx, dy); }

    LayoutRect frameRect() const { return m_frameRect; }
    void setFrameRect(const LayoutRect& rect) { m_frameRect = rect; }

    inline LayoutRect marginBoxRect() const;
    LayoutRect borderBoxRect() const { return LayoutRect(LayoutPoint(), size()); }
    LayoutRect borderBoundingBox() const final { return borderBoxRect(); }
    inline LayoutSize borderBoxLogicalSize() const;

    // Don't use this; it doesn't make sense in a future world with corner-shape. Use BorderShape instead.
    WEBCORE_EXPORT RoundedRectRadii borderRadii() const;

    // The content area of the box (excludes padding - and intrinsic padding for table cells, etc... - and border).
    inline LayoutRect contentBoxRect() const;
    LayoutPoint contentBoxLocation() const;

    // https://www.w3.org/TR/css-transforms-1/#reference-box
    FloatRect referenceBoxRect(CSSBoxType) const override;

    // The content box in absolute coords. Ignores transforms.
    IntRect absoluteContentBox() const;
    // The content box converted to absolute coords (taking transforms into account).
    WEBCORE_EXPORT FloatQuad absoluteContentQuad() const;

    // This returns the content area of the box (excluding padding and border). The only difference with contentBoxRect is that computedCSSContentBoxRect
    // does include the intrinsic padding in the content box as this is what some callers expect (like getComputedStyle).
    inline LayoutRect computedCSSContentBoxRect() const;

    // Bounds of the outline box in absolute coords. Respects transforms
    LayoutRect outlineBoundsForRepaint(const RenderLayerModelObject* /*repaintContainer*/, const RenderGeometryMap* = nullptr) const final;
    void addFocusRingRects(Vector<LayoutRect>&, const LayoutPoint& additionalOffset, const RenderLayerModelObject* paintContainer = nullptr) const override;
    
    FloatRect repaintRectInLocalCoordinates(RepaintRectCalculation = RepaintRectCalculation::Fast) const override { return borderBoxRect(); }
    FloatRect objectBoundingBox() const override { return borderBoxRect(); }

    // Note these functions are not equivalent of childrenOfType<RenderBox>
    RenderBox* parentBox() const;
    RenderBox* firstChildBox() const;
    RenderBox* firstInFlowChildBox() const;
    RenderBox* lastChildBox() const;
    RenderBox* lastInFlowChildBox() const;
    RenderBox* previousSiblingBox() const;
    RenderBox* previousInFlowSiblingBox() const;
    RenderBox* nextSiblingBox() const;
    RenderBox* nextInFlowSiblingBox() const;

    // Visual and layout overflow are in the coordinate space of the box.  This means that they aren't purely physical directions.
    // For horizontal-tb and vertical-lr they will match physical directions, but for horizontal-bt and vertical-rl, the top/bottom and left/right
    // respectively are flipped when compared to their physical counterparts.  For example minX is on the left in vertical-lr,
    // but it is on the right in vertical-rl.
    WEBCORE_EXPORT LayoutRect flippedClientBoxRect() const;
    LayoutRect layoutOverflowRect() const { return m_overflow ? m_overflow->layoutOverflowRect() : flippedClientBoxRect(); }
    inline LayoutUnit logicalLeftLayoutOverflow() const;
    inline LayoutUnit logicalRightLayoutOverflow() const;
    
    LayoutRect visualOverflowRect() const { return m_overflow ? m_overflow->visualOverflowRect() : borderBoxRect(); }
    inline LayoutUnit logicalLeftVisualOverflow() const;
    inline LayoutUnit logicalRightVisualOverflow() const;

    // RenderBox's basic implementation accounts for the writing mode (only).
    virtual LayoutOptionalOutsets allowedLayoutOverflow() const;
    void addLayoutOverflow(const LayoutRect&);
    void addVisualOverflow(const LayoutRect&);
    void clearOverflow();

    void addVisualEffectOverflow();
    LayoutRect applyVisualEffectOverflow(const LayoutRect&) const;

    void addOverflowFromChild(const RenderBox& child) { addOverflowFromChild(child, child.locationOffset()); }
    void addOverflowFromChild(const RenderBox& child, const LayoutSize& delta);
    void addOverflowFromChild(const RenderBox&, const LayoutSize& delta, const LayoutRect& flippedClientRect);

    void applyTransform(TransformationMatrix&, const RenderStyle&, const FloatRect& boundingBox, OptionSet<RenderStyle::TransformOperationOption>) const override;

    inline LayoutSize contentSize() const;
    inline LayoutUnit contentWidth() const;
    inline LayoutUnit contentHeight() const;
    inline LayoutSize contentLogicalSize() const;
    inline LayoutUnit contentLogicalWidth() const;
    inline LayoutUnit contentLogicalHeight() const;

    inline LayoutUnit paddingBoxWidth() const;
    inline LayoutUnit paddingBoxHeight() const;
    LayoutRect paddingBoxRect() const;
    inline LayoutRect paddingBoxRectIncludingScrollbar() const;

    // IE extensions. Used to calculate offsetWidth/Height.  Overridden by inlines (RenderFlow)
    // to return the remaining width on a given line (and the height of a single line).
    LayoutUnit offsetWidth() const override { return width(); }
    LayoutUnit offsetHeight() const override { return height(); }

    // More IE extensions.  clientWidth and clientHeight represent the interior of an object
    // excluding border and scrollbar.  clientLeft/Top are just the borderLeftWidth and borderTopWidth.
    inline LayoutUnit clientLeft() const;
    inline LayoutUnit clientTop() const;
    WEBCORE_EXPORT LayoutUnit clientWidth() const;
    WEBCORE_EXPORT LayoutUnit clientHeight() const;
    inline LayoutUnit clientLogicalWidth() const;
    inline LayoutUnit clientLogicalHeight() const;
    inline LayoutUnit clientLogicalBottom() const;
    inline LayoutRect clientBoxRect() const;

    // scrollWidth/scrollHeight will be the same as clientWidth/clientHeight unless the
    // object has overflow:hidden/scroll/auto specified and also has overflow.
    // scrollLeft/Top return the current scroll position.  These methods are virtual so that objects like
    // textareas can scroll shadow content (but pretend that they are the objects that are
    // scrolling).
    virtual int scrollLeft() const;
    virtual int scrollTop() const;
    virtual int scrollWidth() const;
    virtual int scrollHeight() const;
    virtual void setScrollLeft(int, const ScrollPositionChangeOptions&);
    virtual void setScrollTop(int, const ScrollPositionChangeOptions&);
    void setScrollPosition(const ScrollPosition&, const ScrollPositionChangeOptions&);

    const LayoutBoxExtent& marginBox() const { return m_marginBox; }
    LayoutUnit marginTop() const override { return m_marginBox.top(); }
    LayoutUnit marginBottom() const override { return m_marginBox.bottom(); }
    LayoutUnit marginLeft() const override { return m_marginBox.left(); }
    LayoutUnit marginRight() const override { return m_marginBox.right(); }
    void setMarginTop(LayoutUnit margin) { m_marginBox.setTop(margin); }
    void setMarginBottom(LayoutUnit margin) { m_marginBox.setBottom(margin); }
    void setMarginLeft(LayoutUnit margin) { m_marginBox.setLeft(margin); }
    void setMarginRight(LayoutUnit margin) { m_marginBox.setRight(margin); }

    LayoutUnit marginLogicalLeft(const WritingMode writingMode) const { return m_marginBox.logicalLeft(writingMode); }
    LayoutUnit marginLogicalRight(const WritingMode writingMode) const { return m_marginBox.logicalRight(writingMode); }
    LayoutUnit marginLogicalLeft() const { return marginLogicalLeft(writingMode()); }
    LayoutUnit marginLogicalRight() const { return marginLogicalRight(writingMode()); }

    LayoutUnit marginBefore(const WritingMode writingMode) const override { return m_marginBox.before(writingMode); }
    LayoutUnit marginAfter(const WritingMode writingMode) const override { return m_marginBox.after(writingMode); }
    LayoutUnit marginStart(const WritingMode writingMode) const override { return m_marginBox.start(writingMode); }
    LayoutUnit marginEnd(const WritingMode writingMode) const override { return m_marginBox.end(writingMode); }
    LayoutUnit marginBefore() const { return marginBefore(writingMode()); }
    LayoutUnit marginAfter() const { return marginAfter(writingMode()); }
    LayoutUnit marginStart() const { return marginStart(writingMode()); }
    LayoutUnit marginEnd() const { return marginEnd(writingMode()); }

    void setMarginBefore(LayoutUnit value, const WritingMode writingMode) { m_marginBox.setBefore(value, writingMode); }
    void setMarginAfter(LayoutUnit value, const WritingMode writingMode) { m_marginBox.setAfter(value, writingMode); }
    void setMarginStart(LayoutUnit value, const WritingMode writingMode) { m_marginBox.setStart(value, writingMode); }
    void setMarginEnd(LayoutUnit value, const WritingMode writingMode) { m_marginBox.setEnd(value, writingMode); }
    void setMarginBefore(LayoutUnit value) { setMarginBefore(value, writingMode()); }
    void setMarginAfter(LayoutUnit value) { setMarginAfter(value, writingMode()); }
    void setMarginStart(LayoutUnit value) { setMarginStart(value, writingMode()); }
    void setMarginEnd(LayoutUnit value) { setMarginEnd(value, writingMode()); }

    virtual bool isSelfCollapsingBlock() const { return false; }
    virtual LayoutUnit collapsedMarginBefore() const { return marginBefore(); }
    virtual LayoutUnit collapsedMarginAfter() const { return marginAfter(); }

    LayoutUnit constrainBlockMarginInAvailableSpaceOrTrim(const RenderBox& containingBlock, LayoutUnit availableSpace, MarginTrimType marginSide) const;

    void boundingRects(Vector<LayoutRect>&, const LayoutPoint& accumulatedOffset) const override;
    void absoluteQuads(Vector<FloatQuad>&, bool* wasFixed) const override;
    
    int reflectionOffset() const;
    // Given a rect in the object's coordinate space, returns the corresponding rect in the reflection.
    LayoutRect reflectedRect(const LayoutRect&) const;

    void layout() override;
    bool nodeAtPoint(const HitTestRequest&, HitTestResult&, const HitTestLocation&, const LayoutPoint& accumulatedOffset, HitTestAction) override;
    bool hitTestVisualOverflow(const HitTestLocation&, const LayoutPoint& accumulatedOffset) const;
    bool hitTestClipPath(const HitTestLocation&, const LayoutPoint& accumulatedOffset) const;
    bool hitTestBorderRadius(const HitTestLocation&, const LayoutPoint& accumulatedOffset) const;

    LayoutUnit minPreferredLogicalWidth() const override;
    LayoutUnit maxPreferredLogicalWidth() const override;
    virtual void computeIntrinsicLogicalWidths(LayoutUnit& minLogicalWidth, LayoutUnit& maxLogicalWidth) const = 0;

    std::optional<LayoutUnit> overridingLogicalWidth() const;
    std::optional<LayoutUnit> overridingLogicalHeight() const;
    void setOverridingLogicalHeight(LayoutUnit);
    void setOverridingLogicalWidth(LayoutUnit);
    void clearOverridingContentSize();
    void clearOverridingLogicalHeight();
    void clearOverridingLogicalWidth();

    inline LayoutUnit overridingContentLogicalWidth(LayoutUnit overridingLogicalWidth) const;
    inline LayoutUnit overridingContentLogicalHeight(LayoutUnit overridingLogicalHeight) const;

    using ContainingBlockOverrideValue = std::optional<LayoutUnit>;
    std::optional<ContainingBlockOverrideValue> overridingContainingBlockContentWidth(WritingMode) const;
    std::optional<ContainingBlockOverrideValue> overridingContainingBlockContentHeight(WritingMode) const;
    std::optional<ContainingBlockOverrideValue> overridingContainingBlockContentLogicalWidth() const;
    std::optional<ContainingBlockOverrideValue> overridingContainingBlockContentLogicalHeight() const;
    void setOverridingContainingBlockContentLogicalWidth(ContainingBlockOverrideValue);
    void setOverridingContainingBlockContentLogicalHeight(ContainingBlockOverrideValue);
    void clearOverridingContainingBlockContentSize();
    void clearOverridingContainingBlockContentLogicalHeight();

    // These are currently only used by Flexbox code. In some cases we must layout flex items with a different main size
    // (the size in the main direction) than the one specified by the item in order to compute the value of flex basis, i.e.,
    // the initial main size of the flex item before the free space is distributed.
    std::optional<Length> overridingLogicalHeightLength() const;
    std::optional<Length> overridingLogicalWidthLength() const;
    void setOverridingLogicalHeightLength(const Length&);
    void setOverridingLogicalWidthLength(const Length&);
    void clearOverridingLogicalHeightLength();
    void clearOverridingLogicalWidthLength();

    void markMarginAsTrimmed(MarginTrimType);
    void clearTrimmedMarginsMarkings();
    bool hasTrimmedMargin(std::optional<MarginTrimType>) const;

    LayoutSize offsetFromContainer(RenderElement&, const LayoutPoint&, bool* offsetDependsOnPoint = nullptr) const override;
    
    LayoutUnit adjustBorderBoxLogicalWidthForBoxSizing(const Length& logicalWidth) const;
    LayoutUnit adjustContentBoxLogicalWidthForBoxSizing(const Length& logicalWidth) const;

    LayoutUnit adjustBorderBoxLogicalWidthForBoxSizing(LayoutUnit computedLogicalWidth, LengthType originalType) const;
    LayoutUnit adjustContentBoxLogicalWidthForBoxSizing(LayoutUnit computedLogicalWidth, LengthType originalType) const;

    template<typename T> LayoutUnit adjustBorderBoxLogicalWidthForBoxSizing(T computedLogicalWidth, LengthType originalType) const { return adjustBorderBoxLogicalWidthForBoxSizing(LayoutUnit(computedLogicalWidth), originalType); }
    template<typename T> LayoutUnit adjustContentBoxLogicalWidthForBoxSizing(T computedLogicalWidth, LengthType originalType) const { return adjustContentBoxLogicalWidthForBoxSizing(LayoutUnit(computedLogicalWidth), originalType); }

    // Overridden by fieldsets to subtract out the intrinsic border.
    virtual LayoutUnit adjustBorderBoxLogicalHeightForBoxSizing(LayoutUnit height) const;
    virtual LayoutUnit adjustContentBoxLogicalHeightForBoxSizing(std::optional<LayoutUnit> height) const;
    virtual LayoutUnit adjustIntrinsicLogicalHeightForBoxSizing(LayoutUnit height) const;

    struct ComputedMarginValues {
        LayoutUnit m_before;
        LayoutUnit m_after;
        LayoutUnit m_start;
        LayoutUnit m_end;
    };
    struct LogicalExtentComputedValues {
        LayoutUnit m_extent;
        LayoutUnit m_position;
        ComputedMarginValues m_margins;
    };
    // Resolve auto margins in the inline direction of the containing block so that objects can be pushed to the start, middle or end
    // of the containing block.
    void computeInlineDirectionMargins(const RenderBlock& containingBlock, LayoutUnit containerWidth, std::optional<LayoutUnit> availableSpaceAdjustedWithFloats, LayoutUnit childWidth, LayoutUnit& marginStart, LayoutUnit& marginEnd) const;

    // Used to resolve margins in the containing block's block-flow direction.
    void computeBlockDirectionMargins(const RenderBlock& containingBlock, LayoutUnit& marginBefore, LayoutUnit& marginAfter) const;
    void computeAndSetBlockDirectionMargins(const RenderBlock& containingBlock);

    enum class RenderBoxFragmentInfoFlags : bool { CacheRenderBoxFragmentInfo, DoNotCacheRenderBoxFragmentInfo };
    LayoutRect borderBoxRectInFragment(const RenderFragmentContainer*, RenderBoxFragmentInfoFlags = RenderBoxFragmentInfoFlags::CacheRenderBoxFragmentInfo) const;
    LayoutRect clientBoxRectInFragment(const RenderFragmentContainer*) const;
    RenderFragmentContainer* clampToStartAndEndFragments(RenderFragmentContainer*) const;
    bool hasFragmentRangeInFragmentedFlow() const;
    virtual LayoutUnit offsetFromLogicalTopOfFirstPage() const;

    RepaintRects localRectsForRepaint(RepaintOutlineBounds) const override;
    std::optional<RepaintRects> computeVisibleRectsInContainer(const RepaintRects&, const RenderLayerModelObject* container, VisibleRectContext) const override;
    void repaintDuringLayoutIfMoved(const LayoutRect&);
    virtual void repaintOverhangingFloats(bool paintAllDescendants);

    LayoutUnit containingBlockLogicalWidthForContent() const override;
    LayoutUnit containingBlockLogicalHeightForContent(AvailableLogicalHeightType) const;
    LayoutUnit containingBlockLogicalWidthForPositioned(const RenderBoxModelObject& containingBlock, RenderFragmentContainer* = nullptr, bool checkForPerpendicularWritingMode = true) const;
    LayoutUnit containingBlockLogicalHeightForPositioned(const RenderBoxModelObject& containingBlock, bool checkForPerpendicularWritingMode = true) const;
    LayoutUnit containingBlockLogicalWidthForContentInFragment(RenderFragmentContainer*) const;
    LayoutUnit containingBlockAvailableLineWidthInFragment(RenderFragmentContainer*) const;
    LayoutUnit perpendicularContainingBlockLogicalHeight() const;

    virtual void updateLogicalWidth();
    void updateLogicalHeight();
    virtual LogicalExtentComputedValues computeLogicalHeight(LayoutUnit logicalHeight, LayoutUnit logicalTop) const;

    void overrideLogicalHeightForSizeContainment();

    void cacheIntrinsicContentLogicalHeightForFlexItem(LayoutUnit) const;
    
    // This function will compute the logical border-box height, without laying
    // out the box. This means that the result is only "correct" when the height
    // is explicitly specified. This function exists so that intrinsic width
    // calculations have a way to deal with children that have orthogonal writing modes.
    // When there is no explicit height, this function assumes a content height of
    // zero (and returns just border + padding).
    LayoutUnit computeLogicalHeightWithoutLayout() const;

    RenderBoxFragmentInfo* renderBoxFragmentInfo(RenderFragmentContainer*, RenderBoxFragmentInfoFlags = RenderBoxFragmentInfoFlags::CacheRenderBoxFragmentInfo) const;
    void computeLogicalWidthInFragment(LogicalExtentComputedValues&, RenderFragmentContainer* = nullptr) const;

    inline bool stretchesToViewport() const;

    virtual LayoutSize intrinsicSize() const { return LayoutSize(); }
    LayoutUnit intrinsicLogicalWidth() const;
    inline LayoutUnit intrinsicLogicalHeight() const;

    // Whether or not the element shrinks to its intrinsic width (rather than filling the width
    // of a containing block).  HTML4 buttons, <select>s, <input>s, legends, and floating/compact elements do this.
    enum class SizeType : uint8_t {
        MainOrPreferredSize,
        MinSize,
        MaxSize
    };
    bool sizesLogicalWidthToFitContent(SizeType) const;

    bool hasStretchedLogicalHeight() const;
    bool hasStretchedLogicalWidth(StretchingMode = StretchingMode::Any) const;
    bool isStretchingColumnFlexItem() const;
    bool columnFlexItemHasStretchAlignment() const;
    
    LayoutUnit shrinkLogicalWidthToAvoidFloats(LayoutUnit childMarginStart, LayoutUnit childMarginEnd, const RenderBlock& cb, RenderFragmentContainer*) const;

    LayoutUnit computeLogicalWidthInFragmentUsing(SizeType, Length logicalWidth, LayoutUnit availableLogicalWidth, const RenderBlock& containingBlock, RenderFragmentContainer*) const;
    std::optional<LayoutUnit> computeLogicalHeightUsing(SizeType, const Length& height, std::optional<LayoutUnit> intrinsicContentHeight) const;
    std::optional<LayoutUnit> computeContentLogicalHeight(SizeType, const Length& height, std::optional<LayoutUnit> intrinsicContentHeight) const;
    std::optional<LayoutUnit> computeContentAndScrollbarLogicalHeightUsing(SizeType, const Length& height, std::optional<LayoutUnit> intrinsicContentHeight) const;
    LayoutUnit computeReplacedLogicalWidthUsing(SizeType, Length width) const;
    LayoutUnit computeReplacedLogicalWidthRespectingMinMaxWidth(LayoutUnit logicalWidth, ShouldComputePreferred  = ShouldComputePreferred::ComputeActual) const;
    LayoutUnit computeReplacedLogicalHeightUsing(SizeType, Length height) const;
    LayoutUnit computeReplacedLogicalHeightRespectingMinMaxHeight(LayoutUnit logicalHeight) const;

    template<typename T> LayoutUnit computeReplacedLogicalWidthRespectingMinMaxWidth(T logicalWidth, ShouldComputePreferred shouldComputePreferred = ShouldComputePreferred::ComputeActual) const { return computeReplacedLogicalWidthRespectingMinMaxWidth(LayoutUnit(logicalWidth), shouldComputePreferred); }
    template<typename T> LayoutUnit computeReplacedLogicalHeightRespectingMinMaxHeight(T logicalHeight) const { return computeReplacedLogicalHeightRespectingMinMaxHeight(LayoutUnit(logicalHeight)); }

    virtual LayoutUnit computeReplacedLogicalWidth(ShouldComputePreferred  = ShouldComputePreferred::ComputeActual) const;
    virtual LayoutUnit computeReplacedLogicalHeight(std::optional<LayoutUnit> estimatedUsedWidth = std::nullopt) const;

    enum class UpdatePercentageHeightDescendants : bool { No, Yes };
    std::optional<LayoutUnit> computePercentageLogicalHeight(const Length& height, UpdatePercentageHeightDescendants = UpdatePercentageHeightDescendants::Yes) const;
    bool hasAutoHeightOrContainingBlockWithAutoHeight(UpdatePercentageHeightDescendants = UpdatePercentageHeightDescendants::Yes) const;

    inline LayoutUnit availableLogicalWidth() const;
    virtual LayoutUnit availableLogicalHeight(AvailableLogicalHeightType) const;
    LayoutUnit availableLogicalHeightUsing(const Length&, AvailableLogicalHeightType) const;

    // There are a few cases where we need to refer specifically to the available physical width and available physical height.
    // Relative positioning is one of those cases, since left/top offsets are physical.
    inline LayoutUnit availableWidth() const;
    inline LayoutUnit availableHeight() const;

    WEBCORE_EXPORT virtual int verticalScrollbarWidth() const;
    WEBCORE_EXPORT virtual int horizontalScrollbarHeight() const;
    int intrinsicScrollbarLogicalWidthIncludingGutter() const;
    inline int scrollbarLogicalWidth() const;
    inline int scrollbarLogicalHeight() const;
    virtual bool scroll(ScrollDirection, ScrollGranularity, unsigned stepCount = 1, Element** stopElement = nullptr, RenderBox* startBox = nullptr, const IntPoint& wheelEventAbsolutePoint = IntPoint());
    virtual bool logicalScroll(ScrollLogicalDirection, ScrollGranularity, unsigned stepCount = 1, Element** stopElement = nullptr);
    WEBCORE_EXPORT bool canBeScrolledAndHasScrollableArea() const;
    virtual bool canBeProgramaticallyScrolled() const;
    virtual void autoscroll(const IntPoint&);
    bool canAutoscroll() const;
    IntSize calculateAutoscrollDirection(const IntPoint& windowPoint) const;
    static RenderBox* findAutoscrollable(RenderObject*);
    virtual void stopAutoscroll() { }
    virtual void panScroll(const IntPoint&);

    bool canUseOverlayScrollbars() const;
    bool hasAutoScrollbar(ScrollbarOrientation) const;
    bool hasAlwaysPresentScrollbar(ScrollbarOrientation) const;

    bool scrollsOverflow() const { return scrollsOverflowX() || scrollsOverflowY(); }
    bool scrollsOverflowX() const { return hasNonVisibleOverflow() && (style().overflowX() == Overflow::Scroll || style().overflowX() == Overflow::Auto); }
    bool scrollsOverflowY() const { return hasNonVisibleOverflow() && (style().overflowY() == Overflow::Scroll || style().overflowY() == Overflow::Auto); }

    inline bool hasHorizontalOverflow() const;
    inline bool hasVerticalOverflow() const;
    inline bool hasScrollableOverflowX() const;
    inline bool hasScrollableOverflowY() const;

    bool isScrollContainerX() const { return style().overflowX() == Overflow::Scroll || style().overflowX() == Overflow::Hidden || style().overflowX() == Overflow::Auto;  }
    bool isScrollContainerY() const { return style().overflowY() == Overflow::Scroll || style().overflowY() == Overflow::Hidden || style().overflowY() == Overflow::Auto; }

    LayoutBoxExtent scrollPaddingForViewportRect(const LayoutRect& viewportRect);

    bool usesCompositedScrolling() const;
    
    bool percentageLogicalHeightIsResolvable() const;
    bool hasUnsplittableScrollingOverflow() const;
    bool isUnsplittableForPagination() const;

    bool shouldTreatChildAsReplacedInTableCells() const;

    virtual LayoutRect overflowClipRect(const LayoutPoint& location, RenderFragmentContainer* = nullptr, OverlayScrollbarSizeRelevancy = OverlayScrollbarSizeRelevancy::IgnoreOverlayScrollbarSize, PaintPhase = PaintPhase::BlockBackground) const;
    virtual LayoutRect overflowClipRectForChildLayers(const LayoutPoint& location, RenderFragmentContainer* fragment, OverlayScrollbarSizeRelevancy relevancy) const { return overflowClipRect(location, fragment, relevancy); }
    LayoutRect clipRect(const LayoutPoint& location, RenderFragmentContainer*) const;
    virtual bool hasControlClip() const { return false; }
    virtual LayoutRect controlClipRect(const LayoutPoint&) const { return LayoutRect(); }
    bool pushContentsClip(PaintInfo&, const LayoutPoint& accumulatedOffset);
    void popContentsClip(PaintInfo&, PaintPhase originalPhase, const LayoutPoint& accumulatedOffset);

    ControlPart* ensureControlPart();
    ControlPart* ensureControlPartForRenderer();
    ControlPart* ensureControlPartForBorderOnly();
    ControlPart* ensureControlPartForDecorations();

    virtual void paintObject(PaintInfo&, const LayoutPoint&) { ASSERT_NOT_REACHED(); }
    virtual void paintBoxDecorations(PaintInfo&, const LayoutPoint&);
    virtual void paintMask(PaintInfo&, const LayoutPoint&);
    virtual void paintClippingMask(PaintInfo&, const LayoutPoint&);
    void imageChanged(WrappedImagePtr, const IntRect* = nullptr) override;

    // Called when a positioned object moves but doesn't necessarily change size.  A simplified layout is attempted
    // that just updates the object's position. If the size does change, the object remains dirty.
    bool tryLayoutDoingPositionedMovementOnly()
    {
        LayoutUnit oldWidth = width();
        updateLogicalWidth();
        // If we shrink to fit our width may have changed, so we still need full layout.
        if (oldWidth != width())
            return false;
        updateLogicalHeight();
        return true;
    }

    LayoutRect maskClipRect(const LayoutPoint& paintOffset);

    VisiblePosition positionForPoint(const LayoutPoint&, HitTestSource, const RenderFragmentContainer*) override;

    void removeFloatingAndInvalidateForLayout();
    void removeFloatingOrPositionedChildFromBlockLists();
    
    RenderLayer* enclosingFloatPaintingLayer() const;
    
    virtual std::optional<LayoutUnit> firstLineBaseline() const { return { }; }
    virtual std::optional<LayoutUnit> lastLineBaseline() const { return { }; }
    virtual std::optional<LayoutUnit> inlineBlockBaseline(LineDirectionMode) const { return { }; } // Returns empty if we should skip this box when computing the baseline of an inline-block.
    LayoutUnit synthesizeBaseline(FontBaseline baselineType, BaselineSynthesisEdge) const;

    bool shrinkToAvoidFloats() const;
    virtual bool avoidsFloats() const;

    virtual void markForPaginationRelayoutIfNeeded() { }
    
    LayoutUnit lineHeight(bool firstLine, LineDirectionMode, LinePositionMode = PositionOnContainingLine) const override;
    LayoutUnit baselinePosition(FontBaseline, bool firstLine, LineDirectionMode, LinePositionMode = PositionOnContainingLine) const override;

    LayoutUnit offsetLeft() const override;
    LayoutUnit offsetTop() const override;

    LayoutPoint flipForWritingModeForChild(const RenderBox& child, const LayoutPoint&) const;
    LayoutUnit flipForWritingMode(LayoutUnit position) const; // The offset is in the block direction (y for horizontal writing modes, x for vertical writing modes).
    LayoutPoint flipForWritingMode(const LayoutPoint&) const;
    LayoutSize flipForWritingMode(const LayoutSize&) const;
    FloatPoint flipForWritingMode(const FloatPoint&) const;

    void flipForWritingMode(LayoutRect&) const;
    void flipForWritingMode(FloatRect&) const;
    void flipForWritingMode(RepaintRects&) const;

    // These represent your location relative to your container as a physical offset.
    // In layout related methods you almost always want the logical location (e.g. x() and y()).
    LayoutPoint topLeftLocation() const
    {
        // This is inlined for speed, since it is used by updateLayerPosition() during scrolling.
        if (!document().view() || !document().view()->hasFlippedBlockRenderers())
            return location();
        return topLeftLocationWithFlipping();
    }

    LayoutSize topLeftLocationOffset() const
    {
        // This is inlined for speed, since it is used by updateLayerPosition() during scrolling.
        if (!document().view() || !document().view()->hasFlippedBlockRenderers())
            return locationOffset();
        return toLayoutSize(topLeftLocationWithFlipping());
    }

    LayoutRect logicalVisualOverflowRectForPropagation(const WritingMode) const;
    LayoutRect visualOverflowRectForPropagation(const WritingMode) const;
    LayoutRect logicalLayoutOverflowRectForPropagation(const WritingMode) const;
    LayoutRect layoutOverflowRectForPropagation(const WritingMode) const;

    bool hasRenderOverflow() const { return m_overflow; }    
    bool hasVisualOverflow() const { return m_overflow && !borderBoxRect().contains(m_overflow->visualOverflowRect()); }

    virtual bool needsPreferredWidthsRecalculation() const;
    virtual void computeIntrinsicRatioInformation(FloatSize& /* intrinsicSize */, FloatSize& /* intrinsicRatio */) const { }

    ScrollPosition scrollPosition() const;
    LayoutSize cachedSizeForOverflowClip() const;

    // Returns false if the rect has no intersection with the applied clip rect. When the context specifies edge-inclusive
    // intersection, this return value allows distinguishing between no intersection and zero-area intersection.
    bool applyCachedClipAndScrollPosition(RepaintRects&, const RenderLayerModelObject* container, VisibleRectContext) const final;

    virtual bool hasRelativeDimensions() const;
    virtual bool hasRelativeLogicalHeight() const;
    virtual bool hasRelativeLogicalWidth() const;

    bool hasHorizontalLayoutOverflow() const
    {
        if (!m_overflow)
            return false;

        auto layoutOverflowRect = m_overflow->layoutOverflowRect();
        auto paddingBoxRect = flippedClientBoxRect();
        return layoutOverflowRect.x() < paddingBoxRect.x() || layoutOverflowRect.maxX() > paddingBoxRect.maxX();
    }

    bool hasVerticalLayoutOverflow() const
    {
        if (!m_overflow)
            return false;

        auto layoutOverflowRect = m_overflow->layoutOverflowRect();
        auto paddingBoxRect = flippedClientBoxRect();
        return layoutOverflowRect.y() < paddingBoxRect.y() || layoutOverflowRect.maxY() > paddingBoxRect.maxY();
    }

    virtual RenderPtr<RenderBox> createAnonymousBoxWithSameTypeAs(const RenderBox&) const
    {
        ASSERT_NOT_REACHED();
        return nullptr;
    }

    void markShapeOutsideDependentsForLayout()
    {
        if (isFloating())
            removeFloatingOrPositionedChildFromBlockLists();
    }

    // True if this box can have a range in an outside fragmentation context.
    bool canHaveOutsideFragmentRange() const { return !isRenderFragmentedFlow(); }
    virtual bool needsLayoutAfterFragmentRangeChange() const { return false; }

    bool isGridItem() const { return parent() && parent()->isRenderGrid() && !isExcludedFromNormalLayout(); }
    bool isFlexItem() const { return parent() && parent()->isRenderFlexibleBox() && !isExcludedFromNormalLayout(); }

    virtual void adjustBorderBoxRectForPainting(LayoutRect&) { };

    bool shouldComputeLogicalHeightFromAspectRatio() const;

    bool shouldIgnoreLogicalMinMaxWidthSizes() const;
    bool shouldIgnoreLogicalMinMaxHeightSizes() const;

    // The explicit intrinsic inner size of contain-intrinsic-size
    std::optional<LayoutUnit> explicitIntrinsicInnerWidth() const;
    std::optional<LayoutUnit> explicitIntrinsicInnerHeight() const;
    inline std::optional<LayoutUnit> explicitIntrinsicInnerLogicalWidth() const;
    inline std::optional<LayoutUnit> explicitIntrinsicInnerLogicalHeight() const;

    bool establishesIndependentFormattingContext() const override;

    void updateFloatPainterAfterSelfPaintingLayerChange();

    bool computeHasTransformRelatedProperty(const RenderStyle&) const;

    ShapeOutsideInfo* shapeOutsideInfo() const;

    LayoutUnit computeIntrinsicLogicalWidthUsing(Length logicalWidthLength, LayoutUnit availableLogicalWidth, LayoutUnit borderAndPadding) const;

    bool includeVerticalScrollbarSize() const;
    bool includeHorizontalScrollbarSize() const;

    void invalidateAncestorBackgroundObscurationStatus();

protected:
    RenderBox(Type, Element&, RenderStyle&&, OptionSet<TypeFlag> = { }, TypeSpecificFlags = { });
    RenderBox(Type, Document&, RenderStyle&&, OptionSet<TypeFlag> = { }, TypeSpecificFlags = { });

    void styleWillChange(StyleDifference, const RenderStyle& newStyle) override;
    void styleDidChange(StyleDifference, const RenderStyle* oldStyle) override;
    void updateFromStyle() override;

    void willBeDestroyed() override;

    inline bool shouldTrimChildMargin(MarginTrimType, const RenderBox&) const;
    virtual bool isChildEligibleForMarginTrim(MarginTrimType, const RenderBox&) const { return false; }

    virtual bool shouldResetLogicalHeightBeforeLayout() const { return false; }
    void resetLogicalHeightBeforeLayoutIfNeeded();

    virtual ItemPosition selfAlignmentNormalBehavior(const RenderBox* = nullptr) const { return ItemPosition::Stretch; }

    // Returns false if it could not cheaply compute the extent (e.g. fixed background), in which case the returned rect may be incorrect.
    bool getBackgroundPaintedExtent(const LayoutPoint& paintOffset, LayoutRect&) const;
    virtual bool foregroundIsKnownToBeOpaqueInRect(const LayoutRect& localRect, unsigned maxDepthToTest) const;
    bool computeBackgroundIsKnownToBeObscured(const LayoutPoint& paintOffset) override;

    void paintMaskImages(const PaintInfo&, const LayoutRect&);

    void clipToPaddingBoxShape(GraphicsContext&, const LayoutPoint&, float deviceScaleFactor) const;
    void clipToContentBoxShape(GraphicsContext&, const LayoutPoint&, float deviceScaleFactor) const;

    BleedAvoidance determineBleedAvoidance(GraphicsContext&) const;
    bool backgroundHasOpaqueTopLayer() const;

    void computePositionedLogicalWidth(LogicalExtentComputedValues&, RenderFragmentContainer* = nullptr) const;

    std::optional<LayoutUnit> computeIntrinsicLogicalContentHeightUsing(Length logicalHeightLength, std::optional<LayoutUnit> intrinsicContentHeight, LayoutUnit borderAndPadding) const;
    
    virtual bool shouldComputeSizeAsReplaced() const { return isReplacedOrInlineBlock() && !isInlineBlockOrInlineTable(); }

    LayoutRect localOutlineBoundsRepaintRect() const;

    void mapLocalToContainer(const RenderLayerModelObject* ancestorContainer, TransformState&, OptionSet<MapCoordinatesMode>, bool* wasFixed) const override;
    const RenderObject* pushMappingToContainer(const RenderLayerModelObject*, RenderGeometryMap&) const override;
    void mapAbsoluteToLocalPoint(OptionSet<MapCoordinatesMode>, TransformState&) const override;

    bool skipContainingBlockForPercentHeightCalculation(const RenderBox& containingBlock, bool isPerpendicularWritingMode) const;

    void incrementVisuallyNonEmptyPixelCountIfNeeded(const IntSize&);

    std::optional<double> resolveAspectRatio() const;
    bool shouldIgnoreAspectRatio() const;
    bool isRenderReplacedWithIntrinsicRatio() const;
    bool shouldComputeLogicalWidthFromAspectRatio() const;
    LayoutUnit computeLogicalWidthFromAspectRatioInternal() const;
    LayoutUnit computeLogicalWidthFromAspectRatio(RenderFragmentContainer* = nullptr) const;
    std::pair<LayoutUnit, LayoutUnit> computeMinMaxLogicalWidthFromAspectRatio() const;
    std::pair<LayoutUnit, LayoutUnit> computeMinMaxLogicalHeightFromAspectRatio() const;
    enum class ConstrainDimension { Width, Height };
    enum class MinimumSizeIsAutomaticContentBased : bool { No, Yes };
    void constrainLogicalMinMaxSizesByAspectRatio(LayoutUnit& minSize, LayoutUnit& maxSize, LayoutUnit computedSize, MinimumSizeIsAutomaticContentBased, ConstrainDimension) const;

    static LayoutUnit blockSizeFromAspectRatio(LayoutUnit borderPaddingInlineSum, LayoutUnit borderPaddingBlockSum, double aspectRatio, BoxSizing boxSizing, LayoutUnit inlineSize, AspectRatioType aspectRatioType, bool isRenderReplaced)
    {
        if (boxSizing == BoxSizing::BorderBox && aspectRatioType == AspectRatioType::Ratio && !isRenderReplaced)
            return std::max(borderPaddingBlockSum, LayoutUnit(inlineSize / aspectRatio));
        return LayoutUnit((inlineSize - borderPaddingInlineSum) / aspectRatio) + borderPaddingBlockSum;
    }

    void computePreferredLogicalWidths(const Length& minLogicalWidth, const Length& maxLogicalWidth, LayoutUnit borderAndPaddingLogicalWidth);
    
    bool isAspectRatioDegenerate(double aspectRatio) const { return !aspectRatio || isnan(aspectRatio); }
    
private:
    bool replacedMinMaxLogicalHeightComputesAsNone(SizeType) const;

    void updateShapeOutsideInfoAfterStyleChange(const RenderStyle&, const RenderStyle* oldStyle);

    void updateGridPositionAfterStyleChange(const RenderStyle&, const RenderStyle* oldStyle);

    bool scrollLayer(ScrollDirection, ScrollGranularity, unsigned stepCount, Element** stopElement);

    bool fixedElementLaysOutRelativeToFrame(const LocalFrameView&) const;

    template<typename Function> LayoutUnit computeOrTrimInlineMargin(const RenderBlock& containingBlock, MarginTrimType marginSide, const Function& computeInlineMargin) const;

    bool isScrollableOrRubberbandableBox() const override;

    // Returns true if we did a full repaint.
    bool repaintLayerRectsForImage(WrappedImagePtr, const FillLayer& layers, bool drawingBackground);

    void computePositionedLogicalHeight(LogicalExtentComputedValues&) const;
    void computePositionedLogicalWidthUsing(SizeType, Length logicalWidth, const RenderBoxModelObject& containerBlock, WritingMode containerWritingMode,
                                            LayoutUnit containerLogicalWidth, LayoutUnit bordersPlusPadding,
                                            Length logicalLeft, Length logicalRight, Length marginLogicalLeft, Length marginLogicalRight,
                                            LogicalExtentComputedValues&) const;
    void computePositionedLogicalHeightUsing(SizeType, Length logicalHeightLength, const RenderBoxModelObject& containerBlock,
                                             LayoutUnit containerLogicalHeight, LayoutUnit bordersPlusPadding, LayoutUnit logicalHeight,
                                             Length logicalTop, Length logicalBottom, Length marginLogicalTop, Length marginLogicalBottom,
                                             LogicalExtentComputedValues&) const;

    void computePositionedLogicalHeightReplaced(LogicalExtentComputedValues&) const;
    void computePositionedLogicalWidthReplaced(LogicalExtentComputedValues&) const;

    LayoutUnit fillAvailableMeasure(LayoutUnit availableLogicalWidth) const;
    LayoutUnit fillAvailableMeasure(LayoutUnit availableLogicalWidth, LayoutUnit& marginStart, LayoutUnit& marginEnd) const;

    virtual void computeIntrinsicKeywordLogicalWidths(LayoutUnit& minLogicalWidth, LayoutUnit& maxLogicalWidth) const
    {
        computeIntrinsicLogicalWidths(minLogicalWidth, maxLogicalWidth);
    }

    // This function calculates the minimum and maximum preferred widths for an object.
    // These values are used in shrink-to-fit layout systems.
    // These include tables, positioned objects, floats and flexible boxes.
    virtual void computePreferredLogicalWidths();
    bool shouldComputePreferredLogicalWidthsFromStyle() const;

    LayoutRect frameRectForStickyPositioning() const override { return frameRect(); }

    RepaintRects computeVisibleRectsUsingPaintOffset(const RepaintRects&) const;
    
    LayoutPoint topLeftLocationWithFlipping() const;

    void addLayoutOverflow(const LayoutRect&, const LayoutRect& flippedClientRect);

    ShapeOutsideInfo& ensureShapeOutsideInfo();
    void removeShapeOutsideInfo();

    void computeAnchorCenteredPosition(LogicalExtentComputedValues&, CheckedPtr<const RenderBoxModelObject> defaultAnchorBox, Length logicalLeftLength, Length logicalRightLength, LayoutUnit containerLogicalWidth, bool computeHorizontally) const;

private:
    // The width/height of the contents + borders + padding.  The x/y location is relative to our container (which is not always our parent).
    LayoutRect m_frameRect;

protected:
    LayoutBoxExtent m_marginBox;

    // The preferred logical width of the element if it were to break its lines at every possible opportunity.
    LayoutUnit m_minPreferredLogicalWidth;
    
    // The preferred logical width of the element if it never breaks any lines at all.
    LayoutUnit m_maxPreferredLogicalWidth;

    // Our overflow information.
    RefPtr<RenderOverflow> m_overflow;

private:
    // Used to store state between styleWillChange and styleDidChange
    static bool s_hadNonVisibleOverflow;
};

inline RenderBox* RenderBox::parentBox() const
{
    if (auto* box = dynamicDowncast<RenderBox>(parent()))
        return box;

    ASSERT(!parent());
    return nullptr;
}

inline RenderBox* RenderBox::firstChildBox() const
{
    if (auto* box = dynamicDowncast<RenderBox>(firstChild()))
        return box;

    ASSERT(!firstChild());
    return nullptr;
}

inline RenderBox* RenderBox::firstInFlowChildBox() const
{
    return dynamicDowncast<RenderBox>(firstInFlowChild());
}

inline RenderBox* RenderBox::lastChildBox() const
{
    if (auto* box = dynamicDowncast<RenderBox>(lastChild()))
        return box;

    ASSERT(!lastChild());
    return nullptr;
}

inline RenderBox* RenderBox::lastInFlowChildBox() const 
{
    return dynamicDowncast<RenderBox>(lastInFlowChild());
}

inline RenderBox* RenderBox::previousSiblingBox() const
{
    if (auto* box = dynamicDowncast<RenderBox>(previousSibling()))
        return box;

    ASSERT(!previousSibling());
    return nullptr;
}

inline RenderBox* RenderBox::previousInFlowSiblingBox() const
{
    for (RenderBox* curr = previousSiblingBox(); curr; curr = curr->previousSiblingBox()) {
        if (!curr->isFloatingOrOutOfFlowPositioned())
            return curr;
    }
    return nullptr;
}

inline RenderBox* RenderBox::nextSiblingBox() const
{
    if (auto* box = dynamicDowncast<RenderBox>(nextSibling()))
        return box;

    ASSERT(!nextSibling());
    return nullptr;
}

inline RenderBox* RenderBox::nextInFlowSiblingBox() const
{
    for (RenderBox* curr = nextSiblingBox(); curr; curr = curr->nextSiblingBox()) {
        if (!curr->isFloatingOrOutOfFlowPositioned())
            return curr;
    }
    return nullptr;
}

LayoutUnit synthesizedBaseline(const RenderBox&, const RenderStyle& parentStyle, LineDirectionMode, BaselineSynthesisEdge);

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_RENDER_OBJECT(RenderBox, isRenderBox())
