/*
 * Copyright (C) 2007, 2013 Apple Inc.  All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. 
 */

#pragma once

#include "LayoutRect.h"
#include "LocalFrameViewLayoutContext.h"
#include "StyleTextEdge.h"
#include <wtf/Noncopyable.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/WeakPtr.h>

namespace WebCore {

class RenderBlockFlow;
class RenderBox;
class RenderElement;
class RenderFragmentedFlow;
class RenderMultiColumnFlow;
class RenderObject;

class RenderLayoutState {
    WTF_MAKE_TZONE_ALLOCATED(RenderLayoutState);
    WTF_MAKE_NONCOPYABLE(RenderLayoutState);

public:
    struct TextBoxTrim {
        bool trimFirstFormattedLine { false };
        SingleThreadWeakPtr<const RenderBlockFlow> lastFormattedLineRoot;
    };

    struct LineClamp {
        size_t maximumLines { 0 };
        bool shouldDiscardOverflow { false };
    };

    struct LegacyLineClamp {
        size_t maximumLineCount { 0 };
        size_t currentLineCount { 0 };
        std::optional<LayoutUnit> clampedContentLogicalHeight;
        SingleThreadWeakPtr<const RenderBlockFlow> clampedRenderer;
    };

    RenderLayoutState()
        : m_clipped(false)
        , m_isPaginated(false)
        , m_pageLogicalHeightChanged(false)
#if ASSERT_ENABLED
        , m_layoutDeltaXSaturated(false)
        , m_layoutDeltaYSaturated(false)
#endif
        , m_blockStartTrimming(false)
    {
    }
    RenderLayoutState(const LocalFrameViewLayoutContext::LayoutStateStack&, RenderBox&, const LayoutSize& offset, LayoutUnit pageHeight, bool pageHeightChanged, std::optional<LineClamp>, std::optional<LegacyLineClamp>, std::optional<TextBoxTrim>);
    explicit RenderLayoutState(RenderElement&);

    bool isPaginated() const { return m_isPaginated; }

    // The page logical offset is the object's offset from the top of the page in the page progression
    // direction (so an x-offset in vertical text and a y-offset for horizontal text).
    LayoutUnit pageLogicalOffset(RenderBox*, LayoutUnit childLogicalOffset) const;
    
    LayoutUnit pageLogicalHeight() const { return m_pageLogicalHeight; }
    bool pageLogicalHeightChanged() const { return m_pageLogicalHeightChanged; }

    RenderBlockFlow* lineGrid() const { return m_lineGrid.get(); }
    LayoutSize lineGridOffset() const { return m_lineGridOffset; }
    LayoutSize lineGridPaginationOrigin() const { return m_lineGridPaginationOrigin; }

    LayoutSize paintOffset() const { return m_paintOffset; }
    LayoutSize layoutOffset() const { return m_layoutOffset; }

    LayoutSize pageOffset() const { return m_pageOffset; }

    bool needsBlockDirectionLocationSetBeforeLayout() const { return m_lineGrid || (m_isPaginated && m_pageLogicalHeight); }

#if ASSERT_ENABLED
    RenderElement* renderer() const { return m_renderer; }
#endif
    LayoutRect clipRect() const { return m_clipRect; }
    bool isClipped() const { return m_clipped; }

    void addLayoutDelta(LayoutSize);
    LayoutSize layoutDelta() const { return m_layoutDelta; }
#if ASSERT_ENABLED
    bool layoutDeltaMatches(LayoutSize) const;
#endif

    void setLineClamp(std::optional<LineClamp> lineClamp) { m_lineClamp = lineClamp; }
    std::optional<LineClamp> lineClamp() { return m_lineClamp; }

    void setLegacyLineClamp(std::optional<LegacyLineClamp> legacyLineClamp) { m_legacyLineClamp = legacyLineClamp; }
    std::optional<LegacyLineClamp> legacyLineClamp() const { return m_legacyLineClamp; }

    std::optional<TextBoxTrim> textBoxTrim() { return m_textBoxTrim; }
    void setTextBoxTrim(std::optional<TextBoxTrim> textBoxTrim) { m_textBoxTrim = textBoxTrim; }

    bool hasTextBoxTrimStart() const { return m_textBoxTrim && m_textBoxTrim->trimFirstFormattedLine; }
    bool hasTextBoxTrimEnd(const RenderBlockFlow& candidate) const { return m_textBoxTrim && m_textBoxTrim->lastFormattedLineRoot.get() == &candidate; }
    void removeTextBoxTrimStart();

    void setBlockStartTrimming(bool blockStartTrimming) { m_blockStartTrimming = blockStartTrimming; }
    bool blockStartTrimming() const { return m_blockStartTrimming; }

private:
    void computeOffsets(const RenderLayoutState& ancestor, RenderBox&, LayoutSize offset);
    void computeClipRect(const RenderLayoutState& ancestor, RenderBox&);
    // FIXME: webkit.org/b/179440 these functions should be part of the pagination code/LocalFrameViewLayoutContext.
    void computePaginationInformation(const LocalFrameViewLayoutContext::LayoutStateStack&, RenderBox&, LayoutUnit pageLogicalHeight, bool pageLogicalHeightChanged);
    void propagateLineGridInfo(const RenderLayoutState& ancestor, RenderBox&);
    void establishLineGrid(const LocalFrameViewLayoutContext::LayoutStateStack&, RenderBlockFlow&);
    void computeLineGridPaginationOrigin(const RenderMultiColumnFlow&);

    // Do not add anything apart from bitfields. See https://bugs.webkit.org/show_bug.cgi?id=100173
    bool m_clipped : 1;
    bool m_isPaginated : 1;
    // If our page height has changed, this will force all blocks to relayout.
    bool m_pageLogicalHeightChanged : 1;
#if ASSERT_ENABLED
    bool m_layoutDeltaXSaturated : 1;
    bool m_layoutDeltaYSaturated : 1;
#endif
    bool m_blockStartTrimming : 1 { false };

    // The current line grid that we're snapping to and the offset of the start of the grid.
    SingleThreadWeakPtr<RenderBlockFlow> m_lineGrid;

    // FIXME: Distinguish between the layout clip rect and the paint clip rect which may be larger,
    // e.g., because of composited scrolling.
    LayoutRect m_clipRect;
    
    // x/y offset from layout root. Includes in-flow positioning and scroll offsets.
    LayoutSize m_paintOffset;
    // x/y offset from layout root. Does not include in-flow positioning or scroll offsets.
    LayoutSize m_layoutOffset;
    // Transient offset from the final position of the object
    // used to ensure that repaints happen in the correct place.
    // This is a total delta accumulated from the root. 
    LayoutSize m_layoutDelta;

    // The current page height for the pagination model that encloses us.
    LayoutUnit m_pageLogicalHeight;
    // The offset of the start of the first page in the nearest enclosing pagination model.
    LayoutSize m_pageOffset;
    LayoutSize m_lineGridOffset;
    LayoutSize m_lineGridPaginationOrigin;
    std::optional<LineClamp> m_lineClamp;
    std::optional<LegacyLineClamp> m_legacyLineClamp;
    std::optional<TextBoxTrim> m_textBoxTrim;
#if ASSERT_ENABLED
    RenderElement* m_renderer { nullptr };
#endif
};

// Stack-based class to assist with LayoutState push/pop
class LayoutStateMaintainer {
    WTF_MAKE_NONCOPYABLE(LayoutStateMaintainer);
public:
    explicit LayoutStateMaintainer(RenderBox&, LayoutSize offset, bool disableState = false, LayoutUnit pageHeight = 0_lu, bool pageHeightChanged = false);
    ~LayoutStateMaintainer();

private:
    LocalFrameViewLayoutContext& m_context;
    bool m_paintOffsetCacheIsDisabled { false };
    bool m_didPushLayoutState { false };
};

class SubtreeLayoutStateMaintainer {
public:
    SubtreeLayoutStateMaintainer(RenderElement* subtreeLayoutRoot);
    ~SubtreeLayoutStateMaintainer();

private:
    LocalFrameViewLayoutContext* m_context { nullptr };
    bool m_didDisablePaintOffsetCache { false };
};

class LayoutStateDisabler {
    WTF_MAKE_NONCOPYABLE(LayoutStateDisabler);
public:
    LayoutStateDisabler(LocalFrameViewLayoutContext&);
    ~LayoutStateDisabler();

private:
    LocalFrameViewLayoutContext& m_context;
};

class ContentVisibilityForceLayoutScope {
public:
    ContentVisibilityForceLayoutScope(RenderView&, const Element*);
    ~ContentVisibilityForceLayoutScope();

private:
    LocalFrameViewLayoutContext* m_context { nullptr };
};

inline void RenderLayoutState::removeTextBoxTrimStart()
{
    ASSERT(m_textBoxTrim && m_textBoxTrim->trimFirstFormattedLine);
    m_textBoxTrim->trimFirstFormattedLine = false;
}

} // namespace WebCore
