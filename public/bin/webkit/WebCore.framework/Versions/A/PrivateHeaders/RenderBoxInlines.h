/**
 * Copyright (C) 2003-2023 Apple Inc. All rights reserved.
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

#include "RenderBox.h"
#include "RenderBoxModelObjectInlines.h"

namespace WebCore {

inline LayoutUnit RenderBox::availableHeight() const { return writingMode().isHorizontal() ? availableLogicalHeight(AvailableLogicalHeightType::IncludeMarginBorderPadding) : availableLogicalWidth(); }
inline LayoutUnit RenderBox::availableLogicalWidth() const { return contentLogicalWidth(); }
inline LayoutUnit RenderBox::availableWidth() const { return writingMode().isHorizontal() ? availableLogicalWidth() : availableLogicalHeight(AvailableLogicalHeightType::IncludeMarginBorderPadding); }
inline LayoutSize RenderBox::borderBoxLogicalSize() const { return logicalSize(); }
inline LayoutRect RenderBox::clientBoxRect() const { return LayoutRect(clientLeft(), clientTop(), clientWidth(), clientHeight()); }
inline LayoutUnit RenderBox::clientLeft() const { return borderLeft(); }
inline LayoutUnit RenderBox::clientLogicalBottom() const { return borderBefore() + clientLogicalHeight(); }
inline LayoutUnit RenderBox::clientLogicalHeight() const { return writingMode().isHorizontal() ? clientHeight() : clientWidth(); }
inline LayoutUnit RenderBox::clientLogicalWidth() const { return writingMode().isHorizontal() ? clientWidth() : clientHeight(); }
inline LayoutUnit RenderBox::clientTop() const { return borderTop(); }
inline LayoutRect RenderBox::computedCSSContentBoxRect() const { return LayoutRect(borderLeft() + computedCSSPaddingLeft(), borderTop() + computedCSSPaddingTop(), paddingBoxWidth() - computedCSSPaddingLeft() - computedCSSPaddingRight()  - (style().scrollbarGutter().bothEdges ? verticalScrollbarWidth() : 0), paddingBoxHeight() - computedCSSPaddingTop() - computedCSSPaddingBottom() - (style().scrollbarGutter().bothEdges ? horizontalScrollbarHeight() : 0)); }
inline LayoutUnit RenderBox::contentHeight() const { return std::max(0_lu, paddingBoxHeight() - paddingTop() - paddingBottom() - (style().scrollbarGutter().bothEdges ? horizontalScrollbarHeight() : 0)); }
inline LayoutUnit RenderBox::contentLogicalHeight() const { return writingMode().isHorizontal() ? contentHeight() : contentWidth(); }
inline LayoutSize RenderBox::contentLogicalSize() const { return writingMode().isHorizontal() ? contentSize() : contentSize().transposedSize(); }
inline LayoutUnit RenderBox::contentLogicalWidth() const { return writingMode().isHorizontal() ? contentWidth() : contentHeight(); }
inline LayoutSize RenderBox::contentSize() const { return { contentWidth(), contentHeight() }; }
inline LayoutUnit RenderBox::contentWidth() const { return std::max(0_lu, paddingBoxWidth() - paddingLeft() - paddingRight() - (style().scrollbarGutter().bothEdges ? verticalScrollbarWidth() : 0)); }
inline std::optional<LayoutUnit> RenderBox::explicitIntrinsicInnerLogicalHeight() const { return writingMode().isHorizontal() ? explicitIntrinsicInnerHeight() : explicitIntrinsicInnerWidth(); }
inline std::optional<LayoutUnit> RenderBox::explicitIntrinsicInnerLogicalWidth() const { return writingMode().isHorizontal() ? explicitIntrinsicInnerWidth() : explicitIntrinsicInnerHeight(); }
inline bool RenderBox::hasHorizontalOverflow() const { return scrollWidth() != roundToInt(paddingBoxWidth()); }
inline bool RenderBox::hasScrollableOverflowX() const { return scrollsOverflowX() && hasHorizontalOverflow(); }
inline bool RenderBox::hasScrollableOverflowY() const { return scrollsOverflowY() && hasVerticalOverflow(); }
inline bool RenderBox::hasVerticalOverflow() const { return scrollHeight() != roundToInt(paddingBoxHeight()); }
inline LayoutUnit RenderBox::intrinsicLogicalHeight() const { return writingMode().isHorizontal() ? intrinsicSize().height() : intrinsicSize().width(); }
inline LayoutUnit RenderBox::logicalBottom() const { return logicalTop() + logicalHeight(); }
inline LayoutUnit RenderBox::logicalHeight() const { return writingMode().isHorizontal() ? height() : width(); }
inline LayoutUnit RenderBox::logicalLeft() const { return writingMode().isHorizontal() ? x() : y(); }
inline LayoutUnit RenderBox::logicalLeftLayoutOverflow() const { return writingMode().isHorizontal() ? layoutOverflowRect().x() : layoutOverflowRect().y(); }
inline LayoutUnit RenderBox::logicalLeftVisualOverflow() const { return writingMode().isHorizontal() ? visualOverflowRect().x() : visualOverflowRect().y(); }
inline LayoutUnit RenderBox::logicalRight() const { return logicalLeft() + logicalWidth(); }
inline LayoutUnit RenderBox::logicalRightLayoutOverflow() const { return writingMode().isHorizontal() ? layoutOverflowRect().maxX() : layoutOverflowRect().maxY(); }
inline LayoutUnit RenderBox::logicalRightVisualOverflow() const { return writingMode().isHorizontal() ? visualOverflowRect().maxX() : visualOverflowRect().maxY(); }
inline LayoutSize RenderBox::logicalSize() const { return writingMode().isHorizontal() ? m_frameRect.size() : m_frameRect.size().transposedSize(); }
inline LayoutUnit RenderBox::logicalTop() const { return writingMode().isHorizontal() ? y() : x(); }
inline LayoutUnit RenderBox::logicalWidth() const { return writingMode().isHorizontal() ? width() : height(); }
inline LayoutUnit RenderBox::overridingContentLogicalHeight(LayoutUnit overridingLogicalHeight) const { return std::max(0_lu, overridingLogicalHeight - borderAndPaddingLogicalHeight() - scrollbarLogicalHeight() - (style().scrollbarGutter().bothEdges ? scrollbarLogicalHeight() : 0)); }
inline LayoutUnit RenderBox::overridingContentLogicalWidth(LayoutUnit overridingLogicalWidth) const { return std::max(LayoutUnit(), overridingLogicalWidth - borderAndPaddingLogicalWidth() - scrollbarLogicalWidth() - (style().scrollbarGutter().bothEdges ? scrollbarLogicalWidth() : 0)); }
inline LayoutUnit RenderBox::paddingBoxHeight() const { return std::max(0_lu, height() - borderTop() - borderBottom() - horizontalScrollbarHeight()); }
inline LayoutUnit RenderBox::paddingBoxWidth() const { return std::max(0_lu, width() - borderLeft() - borderRight() - verticalScrollbarWidth()); }
inline int RenderBox::scrollbarLogicalHeight() const { return writingMode().isHorizontal() ? horizontalScrollbarHeight() : verticalScrollbarWidth(); }
inline int RenderBox::scrollbarLogicalWidth() const { return writingMode().isHorizontal() ? verticalScrollbarWidth() : horizontalScrollbarHeight(); }
inline void RenderBox::setLogicalLocation(LayoutPoint location) { setLocation(writingMode().isHorizontal() ? location : location.transposedPoint()); }
inline void RenderBox::setLogicalSize(LayoutSize size) { setSize(writingMode().isHorizontal() ? size : size.transposedSize()); }
inline bool RenderBox::shouldTrimChildMargin(MarginTrimType type, const RenderBox& child) const { return style().marginTrim().contains(type) && isChildEligibleForMarginTrim(type, child); }
inline bool RenderBox::stretchesToViewport() const { return document().inQuirksMode() && style().logicalHeight().isAuto() && !isFloatingOrOutOfFlowPositioned() && (isDocumentElementRenderer() || isBody()) && !shouldComputeLogicalHeightFromAspectRatio() && !isInline(); }

inline LayoutRect RenderBox::paddingBoxRectIncludingScrollbar() const
{
    auto borderWidths = this->borderWidths();
    return LayoutRect(borderWidths.left(), borderWidths.top(), width() - borderWidths.left() - borderWidths.right(), height() - borderWidths.top() - borderWidths.bottom());
}

inline LayoutRect RenderBox::contentBoxRect() const
{
    auto verticalScrollbarWidth = 0_lu;
    auto horizontalScrollbarHeight = 0_lu;
    auto leftScrollbarSpace = 0_lu;
    auto topScrollbarSpace = 0_lu;

    if (hasNonVisibleOverflow()) {
        verticalScrollbarWidth = this->verticalScrollbarWidth();
        horizontalScrollbarHeight = this->horizontalScrollbarHeight();

        bool bothEdgeScrollbarGutters = style().scrollbarGutter().bothEdges;

        if ((shouldPlaceVerticalScrollbarOnLeft() || bothEdgeScrollbarGutters))
            leftScrollbarSpace = verticalScrollbarWidth;
        // FIXME: It's wrong that scrollbar-gutter: both-edges affects height: webkit.org/b/266938
        if (bothEdgeScrollbarGutters)
            topScrollbarSpace = horizontalScrollbarHeight;
    }

    auto padding = this->padding();
    auto borderWidths = this->borderWidths();
    auto location = LayoutPoint { borderWidths.left() + padding.left() + leftScrollbarSpace, borderWidths.top() + padding.top() + topScrollbarSpace };

    auto paddingBoxWidth = std::max(0_lu, width() - borderWidths.left() - borderWidths.right() - verticalScrollbarWidth);
    auto paddingBoxHeight = std::max(0_lu, height() - borderWidths.top() - borderWidths.bottom() - horizontalScrollbarHeight);

    auto width = std::max(0_lu, paddingBoxWidth - padding.left() - padding.right() - leftScrollbarSpace);
    auto height = std::max(0_lu, paddingBoxHeight - padding.top() - padding.bottom() - topScrollbarSpace);

    auto size = LayoutSize { width, height };

    return { location, size };
}

inline LayoutRect RenderBox::marginBoxRect() const
{
    auto left = resolveLengthPercentageUsingContainerLogicalWidth(style().marginLeft());
    auto right = resolveLengthPercentageUsingContainerLogicalWidth(style().marginRight());
    auto top = resolveLengthPercentageUsingContainerLogicalWidth(style().marginTop());
    auto bottom = resolveLengthPercentageUsingContainerLogicalWidth(style().marginBottom());
    return { -left, -top, size().width() + left + right, size().height() + top + bottom };
}

inline void RenderBox::setLogicalHeight(LayoutUnit size)
{
    if (writingMode().isHorizontal())
        setHeight(size);
    else
        setWidth(size);
}

inline void RenderBox::setLogicalLeft(LayoutUnit left)
{
    if (writingMode().isHorizontal())
        setX(left);
    else
        setY(left);
}

inline void RenderBox::setLogicalTop(LayoutUnit top)
{
    if (writingMode().isHorizontal())
        setY(top);
    else
        setX(top);
}

inline void RenderBox::setLogicalWidth(LayoutUnit size)
{
    if (writingMode().isHorizontal())
        setWidth(size);
    else
        setHeight(size);
}

inline LayoutUnit resolveHeightForRatio(LayoutUnit borderAndPaddingLogicalWidth, LayoutUnit borderAndPaddingLogicalHeight, LayoutUnit logicalWidth, double aspectRatio, BoxSizing boxSizing)
{
    if (boxSizing == BoxSizing::BorderBox)
        return LayoutUnit((logicalWidth + borderAndPaddingLogicalWidth) * aspectRatio) - borderAndPaddingLogicalHeight;
    return LayoutUnit(logicalWidth * aspectRatio);
}

} // namespace WebCore
