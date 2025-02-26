/*
 * (C) 1999 Lars Knoll (knoll@kde.org)
 * (C) 2000 Dirk Mueller (mueller@kde.org)
 * Copyright (C) 2004-2017 Apple Inc. All rights reserved.
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

#include "GlyphDisplayListCacheRemoval.h"
#include "LegacyInlineBox.h"
#include "RenderText.h"
#include "TextBoxSelectableRange.h"
#include "TextRun.h"

namespace WebCore {

namespace InlineIterator {
class BoxLegacyPath;
}

class LegacyInlineTextBox : public LegacyInlineBox {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(LegacyInlineTextBox);
public:
    explicit LegacyInlineTextBox(RenderText& renderer)
        : LegacyInlineBox(renderer)
    {
    }

    virtual ~LegacyInlineTextBox();

    RenderText& renderer() const { return downcast<RenderText>(LegacyInlineBox::renderer()); }
    const RenderStyle& lineStyle() const { return isFirstLine() ? renderer().firstLineStyle() : renderer().style(); }

    LegacyInlineTextBox* prevTextBox() const { return m_prevTextBox; }
    LegacyInlineTextBox* nextTextBox() const { return m_nextTextBox; }
    void setNextTextBox(LegacyInlineTextBox* n) { m_nextTextBox = n; }
    void setPreviousTextBox(LegacyInlineTextBox* p) { m_prevTextBox = p; }

    bool hasTextContent() const;

    unsigned start() const { return m_start; }
    unsigned end() const { return m_start + m_len; }
    unsigned len() const { return m_len; }

    void setStart(unsigned start) { m_start = start; }
    void setLen(unsigned len) { m_len = len; }

    void offsetRun(int d) { ASSERT(!isDirty()); ASSERT(d > 0 || m_start >= static_cast<unsigned>(-d)); m_start += d; }

    TextBoxSelectableRange selectableRange() const;

    void markDirty(bool dirty = true) final;

    using LegacyInlineBox::setIsInGlyphDisplayListCache;

    LayoutUnit baselinePosition(FontBaseline) const final;
    LayoutUnit lineHeight() const final;

    LayoutRect logicalOverflowRect() const;
    void setLogicalOverflowRect(const LayoutRect&);
    LayoutUnit logicalTopVisualOverflow() const { return logicalOverflowRect().y(); }
    LayoutUnit logicalBottomVisualOverflow() const { return logicalOverflowRect().maxY(); }
    LayoutUnit logicalLeftVisualOverflow() const { return logicalOverflowRect().x(); }
    LayoutUnit logicalRightVisualOverflow() const { return logicalOverflowRect().maxX(); }

    virtual void dirtyOwnLineBoxes() { dirtyLineBoxes(); }

    void removeFromGlyphDisplayListCache();

#if ENABLE(TREE_DEBUGGING)
    void outputLineBox(WTF::TextStream&, bool mark, int depth) const final;
    ASCIILiteral boxName() const final;
#endif

private:
    LayoutUnit selectionTop() const;
    LayoutUnit selectionBottom() const;
    LayoutUnit selectionHeight() const;

public:
    virtual LayoutRect localSelectionRect(unsigned startPos, unsigned endPos) const;
    std::pair<unsigned, unsigned> selectionStartEnd() const;

private:
    void deleteLine() final;
    void extractLine() final;
    void attachLine() final;
    
public:
    RenderObject::HighlightState selectionState() const final;

public:
    bool isLineBreak() const final;

private:
    bool isInlineTextBox() const final { return true; }

public:
    int caretMinOffset() const final;
    int caretMaxOffset() const final;

private:
    float textPos() const; // returns the x position relative to the left start of the text line.

public:
    bool hasMarkers() const;

private:
    friend class InlineIterator::BoxLegacyPath;

    const FontCascade& lineFont() const;

    String text() const; // The effective text for the run.
    TextRun createTextRun() const;

    LegacyInlineTextBox* m_prevTextBox { nullptr }; // The previous box that also uses our RenderObject
    LegacyInlineTextBox* m_nextTextBox { nullptr }; // The next box that also uses our RenderObject

    unsigned m_start { 0 };
    unsigned m_len { 0 };
};

inline void LegacyInlineTextBox::removeFromGlyphDisplayListCache()
{
    if (isInGlyphDisplayListCache()) {
        removeBoxFromGlyphDisplayListCache(*this);
        setIsInGlyphDisplayListCache(false);
    }
}

LayoutRect snappedSelectionRect(const LayoutRect&, float logicalRight, float selectionTop, float selectionHeight, bool isHorizontal);

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_INLINE_BOX(LegacyInlineTextBox, isInlineTextBox())
