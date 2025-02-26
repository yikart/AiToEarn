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

#include "InlineIteratorBoxLegacyPath.h"
#include "LayoutIntegrationInlineContent.h"
#include "LegacyRootInlineBox.h"
#include "RenderBlockFlow.h"

namespace WebCore {
namespace InlineIterator {

class LineBoxIteratorLegacyPath {
public:
    LineBoxIteratorLegacyPath(const LegacyRootInlineBox* rootInlineBox)
        : m_rootInlineBox(rootInlineBox)
    {
    }
    LineBoxIteratorLegacyPath(LineBoxIteratorLegacyPath&&) = default;
    LineBoxIteratorLegacyPath(const LineBoxIteratorLegacyPath&) = default;
    LineBoxIteratorLegacyPath& operator=(const LineBoxIteratorLegacyPath&) = default;
    LineBoxIteratorLegacyPath& operator=(LineBoxIteratorLegacyPath&&) = default;

    float contentLogicalTop() const { return m_rootInlineBox->lineTop().toFloat(); }
    float contentLogicalBottom() const { return m_rootInlineBox->lineBottom().toFloat(); }
    float contentLogicalTopAdjustedForPrecedingLineBox() const { return m_rootInlineBox->selectionTop().toFloat(); }
    float contentLogicalBottomAdjustedForFollowingLineBox() const { return m_rootInlineBox->selectionBottom().toFloat(); }
    float logicalTop() const { return m_rootInlineBox->lineBoxTop().toFloat(); }
    float logicalBottom() const { return m_rootInlineBox->lineBoxBottom().toFloat(); }
    float logicalWidth() const { return m_rootInlineBox->lineBoxWidth().toFloat(); }
    float inkOverflowLogicalTop() const { return m_rootInlineBox->logicalTopVisualOverflow(); }
    float inkOverflowLogicalBottom() const { return m_rootInlineBox->logicalBottomVisualOverflow(); }
    float scrollableOverflowTop() const { return logicalTop(); }
    float scrollableOverflowBottom() const { return logicalBottom(); }

    bool hasEllipsis() const { return false; }
    FloatRect ellipsisVisualRectIgnoringBlockDirection() const
    {
        ASSERT_NOT_REACHED();
        return { };
    }

    TextRun ellipsisText() const
    {
        ASSERT_NOT_REACHED();
        return TextRun { emptyString() };
    }

    float contentLogicalLeft() const { return m_rootInlineBox->logicalLeft(); }
    float contentLogicalRight() const { return m_rootInlineBox->logicalRight(); }
    bool isHorizontal() const { return m_rootInlineBox->isHorizontal(); }
    FontBaseline baselineType() const { return m_rootInlineBox->baselineType(); }

    const RenderBlockFlow& formattingContextRoot() const { return m_rootInlineBox->blockFlow(); }

    RenderFragmentContainer* containingFragment() const { return nullptr; }
    bool isFirstAfterPageBreak() const { return false; }

    size_t lineIndex() const
    {
        return formattingContextRoot().legacyRootBox() ? 1 : 0;
    }


    void traverseNext()
    {
        m_rootInlineBox = m_rootInlineBox->nextRootBox();
    }

    void traversePrevious()
    {
        m_rootInlineBox = m_rootInlineBox->prevRootBox();
    }

    friend bool operator==(LineBoxIteratorLegacyPath, LineBoxIteratorLegacyPath) = default;

    bool atEnd() const { return !m_rootInlineBox; }

    BoxLegacyPath firstLeafBox() const
    {
        return { m_rootInlineBox->firstLeafDescendant() };
    }

    BoxLegacyPath lastLeafBox() const
    {
        return { m_rootInlineBox->lastLeafDescendant() };
    }

private:
    WeakPtr<const LegacyRootInlineBox> m_rootInlineBox;
};

}
}
