/*
 * Copyright (C) 2003, 2006, 2007, 2008, 2013 Apple Inc. All rights reserved.
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

#include "BidiContext.h"
#include "LegacyInlineFlowBox.h"
#include "RenderBox.h"
#include <wtf/TZoneMalloc.h>
#include <wtf/WeakPtr.h>

namespace WebCore {

class HitTestResult;
class LogicalSelectionOffsetCaches;
class RenderBlockFlow;

struct BidiStatus;
struct GapRects;

class LegacyRootInlineBox : public LegacyInlineFlowBox, public CanMakeWeakPtr<LegacyRootInlineBox>, public CanMakeCheckedPtr<LegacyRootInlineBox> {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(LegacyRootInlineBox);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(LegacyRootInlineBox);
public:
    explicit LegacyRootInlineBox(RenderBlockFlow&);
    virtual ~LegacyRootInlineBox();

    RenderBlockFlow& blockFlow() const;

    LegacyRootInlineBox* nextRootBox() const;
    LegacyRootInlineBox* prevRootBox() const;

    void adjustPosition(float dx, float dy) final;

    LayoutUnit lineTop() const { return m_lineTop; }
    LayoutUnit lineBottom() const { return m_lineBottom; }
    LayoutUnit lineBoxWidth() const;

    LayoutUnit lineBoxTop() const { return m_lineBoxTop; }
    LayoutUnit lineBoxBottom() const { return m_lineBoxBottom; }
    LayoutUnit lineBoxHeight() const { return lineBoxBottom() - lineBoxTop(); }

    LayoutUnit selectionTop() const;
    LayoutUnit selectionBottom() const;
    LayoutUnit selectionHeight() const { return std::max<LayoutUnit>(0, selectionBottom() - selectionTop()); }

    LayoutUnit selectionTopAdjustedForPrecedingBlock() const;
    LayoutUnit selectionHeightAdjustedForPrecedingBlock() const { return std::max<LayoutUnit>(0, selectionBottom() - selectionTopAdjustedForPrecedingBlock()); }

    void setLineTopBottomPositions(LayoutUnit top, LayoutUnit bottom, LayoutUnit lineBoxTop, LayoutUnit lineBoxBottom)
    { 
        m_lineTop = top; 
        m_lineBottom = bottom;
        m_lineBoxTop = lineBoxTop;
        m_lineBoxBottom = lineBoxBottom;
    }

    LayoutUnit baselinePosition(FontBaseline baselineType) const final;
    LayoutUnit lineHeight() const final;

    RenderObject::HighlightState selectionState() const final;
    const LegacyInlineBox* firstSelectedBox() const;
    const LegacyInlineBox* lastSelectedBox() const;

    void extractLineBoxFromRenderObject() final;
    void attachLineBoxToRenderObject() final;
    void removeLineBoxFromRenderObject() final;
    
    FontBaseline baselineType() const { return static_cast<FontBaseline>(m_baselineType); }
    
    LayoutUnit logicalTopVisualOverflow() const
    {
        return LegacyInlineFlowBox::logicalTopVisualOverflow(lineTop());
    }
    LayoutUnit logicalBottomVisualOverflow() const
    {
        return LegacyInlineFlowBox::logicalBottomVisualOverflow(lineBottom());
    }

#if ENABLE(TREE_DEBUGGING)
    void outputLineBox(WTF::TextStream&, bool mark, int depth) const final;
    ASCIILiteral boxName() const final;
#endif
private:
    bool isRootInlineBox() const final { return true; }

    LayoutUnit lineSnapAdjustment(LayoutUnit delta = 0_lu) const;

    LayoutUnit m_lineTop;
    LayoutUnit m_lineBottom;

    LayoutUnit m_lineBoxTop;
    LayoutUnit m_lineBoxBottom;
};

inline LegacyRootInlineBox* LegacyRootInlineBox::nextRootBox() const
{
    return downcast<LegacyRootInlineBox>(m_nextLineBox);
}

inline LegacyRootInlineBox* LegacyRootInlineBox::prevRootBox() const
{
    return downcast<LegacyRootInlineBox>(m_prevLineBox);
}

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_INLINE_BOX(LegacyRootInlineBox, isRootInlineBox())
