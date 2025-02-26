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

#include "InlineFormattingContext.h"
#include "InlineLineBuilder.h"
#include "LayoutUnits.h"
#include <wtf/Range.h>

namespace WebCore {
namespace Layout {

struct AncestorStack;
class ElementBox;
struct DisplayBoxTree;
struct IsFirstLastIndex;
class LineBox;

class InlineDisplayContentBuilder {
public:
    InlineDisplayContentBuilder(InlineFormattingContext&, const ConstraintsForInlineContent&, const LineBox&, const InlineDisplay::Line&);

    InlineDisplay::Boxes build(const LineLayoutResult&);

private:
    void processNonBidiContent(const LineLayoutResult&, InlineDisplay::Boxes&);
    void processBidiContent(const LineLayoutResult&, InlineDisplay::Boxes&);
    void collectInkOverflowForInlineBoxes(InlineDisplay::Boxes&);
    void collectInkOverflowForTextDecorations(InlineDisplay::Boxes&);
    void truncateForEllipsisPolicy(LineEndingTruncationPolicy, const LineLayoutResult&, InlineDisplay::Boxes&);

    void appendTextDisplayBox(const Line::Run&, const InlineRect&, InlineDisplay::Boxes&);
    void appendSoftLineBreakDisplayBox(const Line::Run&, const InlineRect&, InlineDisplay::Boxes&);
    void appendHardLineBreakDisplayBox(const Line::Run&, const InlineRect&, InlineDisplay::Boxes&);
    void appendAtomicInlineLevelDisplayBox(const Line::Run&, const InlineRect&, InlineDisplay::Boxes&);
    void appendRootInlineBoxDisplayBox(const InlineRect&, bool lineHasContent, InlineDisplay::Boxes&);
    void appendInlineBoxDisplayBox(const Line::Run&, const InlineLevelBox&, const InlineRect&, InlineDisplay::Boxes&);
    void appendInlineDisplayBoxAtBidiBoundary(const Box&, InlineDisplay::Boxes&);
    void insertRubyAnnotationBox(const Box& annotationBox, size_t insertionPosition, const InlineRect&, InlineDisplay::Boxes&);

    size_t processRubyBase(size_t rubyBaseStart, InlineDisplay::Boxes&, Vector<WTF::Range<size_t>>& interlinearRubyColumnRangeList, Vector<size_t>& rubyBaseStartIndexListWithAnnotation);
    void processRubyContent(InlineDisplay::Boxes&, const LineLayoutResult&);

    void setInlineBoxGeometry(const Box& inlineBox, Layout::BoxGeometry&, const InlineRect&, bool isFirstInlineBoxFragment);
    void adjustVisualGeometryForDisplayBox(size_t displayBoxNodeIndex, InlineLayoutUnit& accumulatedOffset, InlineLayoutUnit lineBoxLogicalTop, const DisplayBoxTree&, InlineDisplay::Boxes&, const UncheckedKeyHashMap<const Box*, IsFirstLastIndex>&);
    size_t ensureDisplayBoxForContainer(const ElementBox&, DisplayBoxTree&, AncestorStack&, InlineDisplay::Boxes&);

    InlineRect flipLogicalRectToVisualForWritingModeWithinLine(const InlineRect& logicalRect, const InlineRect& lineLogicalRect, WritingMode) const;
    InlineRect flipRootInlineBoxRectToVisualForWritingMode(const InlineRect& rootInlineBoxLogicalRect, WritingMode) const;
    template <typename BoxType, typename LayoutUnitType>
    void setLeftForWritingMode(BoxType&, LayoutUnitType logicalLeft, WritingMode) const;
    void setRightForWritingMode(InlineDisplay::Box&, InlineLayoutUnit logicalRight, WritingMode) const;
    InlineLayoutPoint movePointHorizontallyForWritingMode(const InlineLayoutPoint& topLeft, InlineLayoutUnit horizontalOffset, WritingMode) const;
    InlineLayoutUnit outsideListMarkerVisualPosition(const ElementBox&) const;
    void setGeometryForBlockLevelOutOfFlowBoxes(const Vector<size_t>& indexList, const Line::RunList&, const Vector<int32_t>& visualOrderList = { });

    bool isLineFullyTruncatedInBlockDirection() const { return m_lineIsFullyTruncatedInBlockDirection; }

    const LineBox& lineBox() const { return m_lineBox; }
    size_t lineIndex() const { return lineBox().lineIndex(); }
    const ConstraintsForInlineContent& constraints() const { return m_constraints; }
    const ElementBox& root() const { return m_formattingContext.root(); }
    const RenderStyle& rootStyle() const { return lineIndex() ? root().style() : root().firstLineStyle(); }
    InlineFormattingContext& formattingContext() { return m_formattingContext; }
    const InlineFormattingContext& formattingContext() const { return m_formattingContext; }

private:
    InlineFormattingContext& m_formattingContext;
    const ConstraintsForInlineContent& m_constraints;
    const LineBox& m_lineBox;
    const InlineDisplay::Line& m_displayLine;
    IntSize m_initialContaingBlockSize;
    // FIXME: This should take DisplayLine::isFullyTruncatedInBlockDirection() for non-prefixed line-clamp.
    bool m_lineIsFullyTruncatedInBlockDirection { false };
    bool m_contentHasInkOverflow { false };
    bool m_hasSeenRubyBase { false };
    bool m_hasSeenTextDecoration { false };
};

}
}

