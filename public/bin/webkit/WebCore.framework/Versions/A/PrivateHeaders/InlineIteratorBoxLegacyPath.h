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

#include "LegacyInlineTextBox.h"
#include "LegacyRootInlineBox.h"
#include "RenderText.h"
#include "SVGInlineTextBox.h"
#include "TextBoxSelectableRange.h"
#include <wtf/Vector.h>

namespace WebCore {
namespace InlineIterator {

enum class TextRunMode { Painting, Editing };

class BoxLegacyPath {
public:
    BoxLegacyPath(const LegacyInlineBox* inlineBox)
        : m_inlineBox(inlineBox)
    { }

    bool isText() const { return m_inlineBox->isInlineTextBox(); }
    bool isInlineBox() const { return m_inlineBox->isInlineFlowBox(); }
    bool isRootInlineBox() const { return m_inlineBox->isRootInlineBox(); }

    FloatRect visualRectIgnoringBlockDirection() const { return m_inlineBox->frameRect(); }

    bool isHorizontal() const { return m_inlineBox->isHorizontal(); }
    bool isLineBreak() const { return m_inlineBox->isLineBreak(); }

    unsigned minimumCaretOffset() const { return m_inlineBox->caretMinOffset(); }
    unsigned maximumCaretOffset() const { return m_inlineBox->caretMaxOffset(); }

    unsigned char bidiLevel() const { return m_inlineBox->bidiLevel(); }

    bool hasHyphen() const { return false; }
    StringView originalText() const { return StringView(inlineTextBox()->renderer().text()).substring(inlineTextBox()->start(), inlineTextBox()->len()); }
    size_t lineIndex() const
    {
        size_t precedingLines = 0;
        for (auto* rootBox = rootInlineBox().prevRootBox(); rootBox; rootBox = rootBox->prevRootBox())
            ++precedingLines;
        return precedingLines;
    }
    unsigned start() const { return inlineTextBox()->start(); }
    unsigned end() const { return inlineTextBox()->end(); }
    unsigned length() const { return inlineTextBox()->len(); }

    TextBoxSelectableRange selectableRange() const { return inlineTextBox()->selectableRange(); }

    TextRun textRun(TextRunMode = TextRunMode::Painting) const
    {
        if (isText())
            return inlineTextBox()->createTextRun();
        ASSERT_NOT_REACHED();
        return TextRun { emptyString() };
    }

    const RenderObject& renderer() const
    {
        return m_inlineBox->renderer();
    }

    bool hasRenderer() const
    {
        return true;
    }

    const RenderBlockFlow& formattingContextRoot() const
    {
        return m_inlineBox->root().blockFlow();
    }

    const RenderStyle& style() const
    {
        return m_inlineBox->lineStyle();
    }

    void traverseNextTextBox() { m_inlineBox = inlineTextBox()->nextTextBox(); }

    void traverseNextLeafOnLine()
    {
        m_inlineBox = m_inlineBox->nextLeafOnLine();
    }

    void traversePreviousLeafOnLine()
    {
        m_inlineBox = m_inlineBox->previousLeafOnLine();
    }

    void traverseNextInlineBox()
    {
        m_inlineBox = inlineFlowBox()->nextLineBox();
    }

    void traversePreviousInlineBox()
    {
        m_inlineBox = inlineFlowBox()->prevLineBox();
    }

    BoxLegacyPath firstLeafBoxForInlineBox() const
    {
        return { inlineFlowBox()->firstLeafDescendant() };
    }

    BoxLegacyPath lastLeafBoxForInlineBox() const
    {
        return { inlineFlowBox()->lastLeafDescendant() };
    }

    BoxLegacyPath parentInlineBox() const
    {
        return { m_inlineBox->parent() };
    }

    TextDirection direction() const { return bidiLevel() % 2 ? TextDirection::RTL : TextDirection::LTR; }
    bool isFirstLine() const { return !rootInlineBox().prevRootBox(); }

    friend bool operator==(BoxLegacyPath, BoxLegacyPath) = default;

    bool atEnd() const { return !m_inlineBox; }

    LegacyInlineBox* legacyInlineBox() const { return const_cast<LegacyInlineBox*>(m_inlineBox); }
    const LegacyRootInlineBox& rootInlineBox() const { return m_inlineBox->root(); }

    void traverseNextBoxOnLine()
    {
        if (auto* flowBox = dynamicDowncast<LegacyInlineFlowBox>(m_inlineBox); flowBox && flowBox->firstChild()) {
            m_inlineBox = flowBox->firstChild();
            return;
        }

        traverseNextBoxOnLineSkippingChildren();
    }

    void traverseNextBoxOnLineSkippingChildren()
    {
        if (m_inlineBox->nextOnLine()) {
            m_inlineBox = m_inlineBox->nextOnLine();
            return;
        }

        auto* parent = m_inlineBox->parent();
        while (parent && !parent->nextOnLine())
            parent = parent->parent();

        m_inlineBox = parent ? parent->nextOnLine() : nullptr;
    }

    const Vector<SVGTextFragment>& svgTextFragments() const
    {
        return svgInlineTextBox()->textFragments();
    }

private:
    const LegacyInlineTextBox* inlineTextBox() const { return downcast<LegacyInlineTextBox>(m_inlineBox); }
    const LegacyInlineFlowBox* inlineFlowBox() const { return downcast<LegacyInlineFlowBox>(m_inlineBox); }
    const SVGInlineTextBox* svgInlineTextBox() const { return downcast<SVGInlineTextBox>(m_inlineBox); }

    const LegacyInlineBox* m_inlineBox { nullptr };
};

}
}
