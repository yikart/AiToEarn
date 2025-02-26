/*
 * Copyright (C) 2020 Apple Inc. All rights reserved.
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

#include "FontBaseline.h"
#include "InlineIteratorLineBoxLegacyPath.h"
#include "InlineIteratorLineBoxModernPath.h"
#include "RenderBlockFlow.h"
#include <variant>

namespace WebCore {

class LineSelection;

namespace InlineIterator {

class LineBoxIterator;
class PathIterator;
class LeafBoxIterator;

struct EndLineBoxIterator { };

class LineBox {
public:
    using PathVariant = std::variant<
        LineBoxIteratorModernPath,
        LineBoxIteratorLegacyPath
    >;

    LineBox(PathVariant&&);

    float logicalTop() const;
    float logicalBottom() const;
    float logicalHeight() const { return logicalBottom() - logicalTop(); }
    float logicalWidth() const;

    float contentLogicalTop() const;
    float contentLogicalBottom() const;
    float contentLogicalLeft() const;
    float contentLogicalRight() const;
    float contentLogicalWidth() const;
    float contentLogicalHeight() const;

    float contentLogicalTopAdjustedForPrecedingLineBox() const;
    float contentLogicalBottomAdjustedForFollowingLineBox() const;

    float inkOverflowLogicalTop() const;
    float inkOverflowLogicalBottom() const;
    float scrollableOverflowTop() const;
    float scrollableOverflowBottom() const;

    const RenderStyle& style() const { return isFirst() ? formattingContextRoot().firstLineStyle() : formattingContextRoot().style(); }

    bool hasEllipsis() const;
    enum AdjustedForSelection : bool { No, Yes };
    FloatRect ellipsisVisualRect(AdjustedForSelection = AdjustedForSelection::No) const;
    TextRun ellipsisText() const;
    RenderObject::HighlightState ellipsisSelectionState() const;

    const RenderBlockFlow& formattingContextRoot() const;
    RenderFragmentContainer* containingFragment() const;

    bool isHorizontal() const;
    FontBaseline baselineType() const;

    bool isFirst() const;
    bool isFirstAfterPageBreak() const;

    LeafBoxIterator firstLeafBox() const;
    LeafBoxIterator lastLeafBox() const;

    LineBoxIterator next() const;
    LineBoxIterator previous() const;

    size_t lineIndex() const;

private:
    friend class LineBoxIterator;

    PathVariant m_pathVariant;
};

class LineBoxIterator {
public:
    LineBoxIterator() : m_lineBox(LineBoxIteratorLegacyPath { nullptr }) { };
    LineBoxIterator(const LegacyRootInlineBox* rootInlineBox) : m_lineBox(LineBoxIteratorLegacyPath { rootInlineBox }) { };
    LineBoxIterator(LineBox::PathVariant&&);
    LineBoxIterator(const LineBox&);

    LineBoxIterator& operator++() { return traverseNext(); }
    WEBCORE_EXPORT LineBoxIterator& traverseNext();
    LineBoxIterator& traversePrevious();

    WEBCORE_EXPORT explicit operator bool() const;

    bool operator==(const LineBoxIterator&) const;
    bool operator==(EndLineBoxIterator) const { return atEnd(); }

    const LineBox& operator*() const { return m_lineBox; }
    const LineBox* operator->() const { return &m_lineBox; }

    bool atEnd() const;

private:
    LineBox m_lineBox;
};

WEBCORE_EXPORT LineBoxIterator firstLineBoxFor(const RenderBlockFlow&);
LineBoxIterator lastLineBoxFor(const RenderBlockFlow&);
LineBoxIterator lineBoxFor(const LayoutIntegration::InlineContent&, size_t lineIndex);

LeafBoxIterator closestBoxForHorizontalPosition(const LineBox&, float horizontalPosition, bool editableOnly = false);

inline float previousLineBoxContentBottomOrBorderAndPadding(const LineBox&);
inline float contentStartInBlockDirection(const LineBox&);

// -----------------------------------------------

inline LineBox::LineBox(PathVariant&& path)
    : m_pathVariant(WTFMove(path))
{
}

inline float LineBox::contentLogicalTop() const
{
    return WTF::switchOn(m_pathVariant, [](const auto& path) {
        return path.contentLogicalTop();
    });
}

inline float LineBox::contentLogicalBottom() const
{
    return WTF::switchOn(m_pathVariant, [](const auto& path) {
        return path.contentLogicalBottom();
    });
}

inline float LineBox::contentLogicalTopAdjustedForPrecedingLineBox() const
{
    return WTF::switchOn(m_pathVariant, [](const auto& path) {
        return path.contentLogicalTopAdjustedForPrecedingLineBox();
    });
}

inline float LineBox::contentLogicalBottomAdjustedForFollowingLineBox() const
{
    return WTF::switchOn(m_pathVariant, [](const auto& path) {
        return path.contentLogicalBottomAdjustedForFollowingLineBox();
    });
}

inline float LineBox::logicalTop() const
{
    return WTF::switchOn(m_pathVariant, [](const auto& path) {
        return path.logicalTop();
    });
}

inline float LineBox::logicalBottom() const
{
    return WTF::switchOn(m_pathVariant, [](const auto& path) {
        return path.logicalBottom();
    });
}

inline float LineBox::logicalWidth() const
{
    return WTF::switchOn(m_pathVariant, [](const auto& path) {
        return path.logicalWidth();
    });
}

inline float LineBox::inkOverflowLogicalTop() const
{
    return WTF::switchOn(m_pathVariant, [](const auto& path) {
        return path.inkOverflowLogicalTop();
    });
}

inline float LineBox::inkOverflowLogicalBottom() const
{
    return WTF::switchOn(m_pathVariant, [](const auto& path) {
        return path.inkOverflowLogicalBottom();
    });
}

inline float LineBox::scrollableOverflowTop() const
{
    return WTF::switchOn(m_pathVariant, [](const auto& path) {
        return path.scrollableOverflowTop();
    });
}

inline float LineBox::scrollableOverflowBottom() const
{
    return WTF::switchOn(m_pathVariant, [](const auto& path) {
        return path.scrollableOverflowBottom();
    });
}

inline bool LineBox::hasEllipsis() const
{
    return WTF::switchOn(m_pathVariant, [](const auto& path) {
        return path.hasEllipsis();
    });
}

inline FloatRect LineBox::ellipsisVisualRect(AdjustedForSelection adjustedForSelection) const
{
    ASSERT(hasEllipsis());

    auto visualRect = WTF::switchOn(m_pathVariant, [](const auto& path) {
        return path.ellipsisVisualRectIgnoringBlockDirection();
    });

    // FIXME: Add pixel snapping here.
    if (adjustedForSelection == AdjustedForSelection::No) {
        formattingContextRoot().flipForWritingMode(visualRect);
        return visualRect;
    }
    auto selectionTop = formattingContextRoot().adjustEnclosingTopForPrecedingBlock(LayoutUnit { contentLogicalTopAdjustedForPrecedingLineBox() });
    auto selectionBottom = contentLogicalBottomAdjustedForFollowingLineBox();

    visualRect.setY(selectionTop);
    visualRect.setHeight(selectionBottom - selectionTop);
    formattingContextRoot().flipForWritingMode(visualRect);
    return visualRect;
}

inline TextRun LineBox::ellipsisText() const
{
    ASSERT(hasEllipsis());

    return WTF::switchOn(m_pathVariant, [](const auto& path) {
        return path.ellipsisText();
    });
}

inline float LineBox::contentLogicalLeft() const
{
    return WTF::switchOn(m_pathVariant, [](const auto& path) {
        return path.contentLogicalLeft();
    });
}

inline float LineBox::contentLogicalRight() const
{
    return WTF::switchOn(m_pathVariant, [](const auto& path) {
        return path.contentLogicalRight();
    });
}

inline float LineBox::contentLogicalWidth() const
{
    return contentLogicalRight() - contentLogicalLeft();
}

inline float LineBox::contentLogicalHeight() const
{
    return contentLogicalBottom() - contentLogicalTop();
}

inline bool LineBox::isHorizontal() const
{
    return WTF::switchOn(m_pathVariant, [](const auto& path) {
        return path.isHorizontal();
    });
}

inline FontBaseline LineBox::baselineType() const
{
    return WTF::switchOn(m_pathVariant, [](const auto& path) {
        return path.baselineType();
    });
}

inline const RenderBlockFlow& LineBox::formattingContextRoot() const
{
    return WTF::switchOn(m_pathVariant, [](const auto& path) -> const RenderBlockFlow& {
        return path.formattingContextRoot();
    });
}

inline RenderFragmentContainer* LineBox::containingFragment() const
{
    return WTF::switchOn(m_pathVariant, [](const auto& path) {
        return path.containingFragment();
    });
}

inline bool LineBox::isFirstAfterPageBreak() const
{
    return WTF::switchOn(m_pathVariant, [](const auto& path) {
        return path.isFirstAfterPageBreak();
    });
}

inline bool LineBox::isFirst() const
{
    return !previous();
}

inline size_t LineBox::lineIndex() const
{
    return WTF::switchOn(m_pathVariant, [](const auto& path) {
        return path.lineIndex();
    });
}

}
}

