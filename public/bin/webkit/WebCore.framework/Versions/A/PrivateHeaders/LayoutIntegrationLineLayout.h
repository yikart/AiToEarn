/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

#include "FloatRect.h"
#include "InlineDamage.h"
#include "InlineFormattingConstraints.h"
#include "InlineFormattingContext.h"
#include "InlineIteratorInlineBox.h"
#include "InlineIteratorLineBox.h"
#include "InlineIteratorTextBox.h"
#include "LayoutIntegrationBoxGeometryUpdater.h"
#include "LayoutIntegrationBoxTreeUpdater.h"
#include "LayoutPoint.h"
#include "LayoutState.h"
#include "RenderObjectEnums.h"
#include "SVGTextChunk.h"
#include <wtf/CheckedPtr.h>

namespace WebCore {

class HitTestLocation;
class HitTestRequest;
class HitTestResult;
class RenderBlockFlow;
class RenderBox;
class RenderBoxModelObject;
class RenderInline;
struct PaintInfo;

namespace Layout {
class InlineDamage;
}

namespace LayoutIntegration {

struct InlineContent;
struct LineAdjustment;

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(LayoutIntegration_LineLayout);

class LineLayout final : public CanMakeCheckedPtr<LineLayout> {
    WTF_MAKE_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(LayoutIntegration_LineLayout);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(LineLayout);
public:
    LineLayout(RenderBlockFlow&);
    ~LineLayout();

    static RenderBlockFlow* blockContainer(const RenderObject&);
    static LineLayout* containing(RenderObject&);
    static const LineLayout* containing(const RenderObject&);

    static bool canUseFor(const RenderBlockFlow&);
    static bool canUseForPreferredWidthComputation(const RenderBlockFlow&);
    static bool shouldInvalidateLineLayoutPathAfterContentChange(const RenderBlockFlow& parent, const RenderObject& rendererWithNewContent, const LineLayout&);
    static bool shouldInvalidateLineLayoutPathAfterTreeMutation(const RenderBlockFlow& parent, const RenderObject& renderer, const LineLayout&, bool isRemoval);

    void updateFormattingContexGeometries(LayoutUnit availableLogicalWidth);
    void updateOverflow();
    static void updateStyle(const RenderObject&);

    // Partial invalidation.
    bool insertedIntoTree(const RenderElement& parent, RenderObject& child);
    bool removedFromTree(const RenderElement& parent, RenderObject& child);
    bool updateTextContent(const RenderText&, size_t offset, int delta);
    bool rootStyleWillChange(const RenderBlockFlow&, const RenderStyle& newStyle);
    bool styleWillChange(const RenderElement&, const RenderStyle& newStyle, StyleDifference);
    bool boxContentWillChange(const RenderBox&);

    std::pair<LayoutUnit, LayoutUnit> computeIntrinsicWidthConstraints();

    std::optional<LayoutRect> layout();
    void paint(PaintInfo&, const LayoutPoint& paintOffset, const RenderInline* layerRenderer = nullptr);
    bool hitTest(const HitTestRequest&, HitTestResult&, const HitTestLocation&, const LayoutPoint& accumulatedOffset, HitTestAction, const RenderInline* layerRenderer = nullptr);
    void adjustForPagination();
    void shiftLinesBy(LayoutUnit blockShift);

    void collectOverflow();
    LayoutRect visualOverflowBoundingBoxRectFor(const RenderInline&) const;
    Vector<FloatRect> collectInlineBoxRects(const RenderInline&) const;

    LayoutUnit contentLogicalHeight() const;
    std::optional<LayoutUnit> clampedContentLogicalHeight() const;
    bool hasEllipsisInBlockDirectionOnLastFormattedLine() const;
    bool contains(const RenderElement& renderer) const;

    bool isPaginated() const;
    size_t lineCount() const;
    bool hasVisualOverflow() const;
    LayoutUnit firstLinePhysicalBaseline() const;
    LayoutUnit lastLinePhysicalBaseline() const;
    LayoutUnit lastLineLogicalBaseline() const;
    LayoutRect firstInlineBoxRect(const RenderInline&) const;
    LayoutRect enclosingBorderBoxRectFor(const RenderInline&) const;

    InlineIterator::TextBoxIterator textBoxesFor(const RenderText&) const;
    InlineIterator::LeafBoxIterator boxFor(const RenderElement&) const;
    InlineIterator::InlineBoxIterator firstInlineBoxFor(const RenderInline&) const;
    InlineIterator::InlineBoxIterator firstRootInlineBox() const;
    InlineIterator::LineBoxIterator firstLineBox() const;
    InlineIterator::LineBoxIterator lastLineBox() const;

    const RenderBlockFlow& flow() const { return downcast<RenderBlockFlow>(*m_rootLayoutBox->rendererForIntegration()); }
    RenderBlockFlow& flow() { return downcast<RenderBlockFlow>(*m_rootLayoutBox->rendererForIntegration()); }

    static void releaseCaches(RenderView&);

#if ENABLE(TREE_DEBUGGING)
    void outputLineTree(WTF::TextStream&, size_t depth) const;
#endif

    // This is temporary, required by partial bailout check.
    bool contentNeedsVisualReordering() const;
    bool isDamaged() const { return !!m_lineDamage; }
    const Layout::InlineDamage* damage() const { return m_lineDamage.get(); }
#ifndef NDEBUG
    bool hasDetachedContent() const { return m_lineDamage && m_lineDamage->hasDetachedContent(); }
#endif

    FloatRect applySVGTextFragments(SVGTextFragmentMap&&);

private:
    void preparePlacedFloats();
    FloatRect constructContent(const Layout::InlineLayoutState&, Layout::InlineLayoutResult&&);
    Vector<LineAdjustment> adjustContentForPagination(const Layout::BlockLayoutState&, bool isPartialLayout);
    void updateRenderTreePositions(const Vector<LineAdjustment>&, const Layout::InlineLayoutState&);

    InlineContent& ensureInlineContent();

    Layout::LayoutState& layoutState() { return *m_layoutState; }
    const Layout::LayoutState& layoutState() const { return *m_layoutState; }

    Layout::InlineDamage& ensureLineDamage();

    const Layout::ElementBox& rootLayoutBox() const { return *m_rootLayoutBox; }
    Layout::ElementBox& rootLayoutBox() { return *m_rootLayoutBox; }
    void clearInlineContent();
    void releaseCachesAndResetDamage();

    LayoutUnit physicalBaselineForLine(const InlineDisplay::Line&) const;
    
    CheckedPtr<Layout::ElementBox> m_rootLayoutBox;
    WeakPtr<Layout::LayoutState> m_layoutState;
    Layout::BlockFormattingState& m_blockFormattingState;
    Layout::InlineContentCache& m_inlineContentCache;
    std::optional<Layout::ConstraintsForInlineContent> m_inlineContentConstraints;
    // FIXME: This should be part of LayoutState.
    std::unique_ptr<Layout::InlineDamage> m_lineDamage;
    std::unique_ptr<InlineContent> m_inlineContent;
    BoxGeometryUpdater m_boxGeometryUpdater;
};

}
}

