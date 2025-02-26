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

#include "InlineIteratorBoxModernPath.h"
#include "LayoutIntegrationInlineContent.h"
#include "RenderBlockFlow.h"

namespace WebCore {
namespace InlineIterator {

class BoxModernPath;

class LineBoxIteratorModernPath {
public:
    LineBoxIteratorModernPath(const LayoutIntegration::InlineContent& inlineContent, size_t lineIndex)
        : m_inlineContent(&inlineContent)
        , m_lineIndex(lineIndex)
    {
        ASSERT(lineIndex <= lines().size());
    }
    LineBoxIteratorModernPath(LineBoxIteratorModernPath&&) = default;
    LineBoxIteratorModernPath(const LineBoxIteratorModernPath&) = default;
    LineBoxIteratorModernPath& operator=(const LineBoxIteratorModernPath&) = default;
    LineBoxIteratorModernPath& operator=(LineBoxIteratorModernPath&&) = default;

    float contentLogicalTop() const { return line().enclosingContentLogicalTop(); }
    float contentLogicalBottom() const { return line().enclosingContentLogicalBottom(); }
    float logicalTop() const { return line().lineBoxLogicalRect().y(); }
    float logicalBottom() const { return line().lineBoxLogicalRect().maxY(); }
    float logicalWidth() const { return line().lineBoxLogicalRect().width(); }
    float inkOverflowLogicalTop() const { return line().isHorizontal() ? line().inkOverflow().y() : line().inkOverflow().x(); }
    float inkOverflowLogicalBottom() const { return line().isHorizontal() ? line().inkOverflow().maxY() : line().inkOverflow().maxX(); }
    float scrollableOverflowTop() const { return line().scrollableOverflow().y(); }
    float scrollableOverflowBottom() const { return line().scrollableOverflow().maxY(); }

    bool hasEllipsis() const { return line().hasEllipsis(); }
    FloatRect ellipsisVisualRectIgnoringBlockDirection() const { return line().ellipsis()->visualRect; }
    TextRun ellipsisText() const { return TextRun { line().ellipsis()->text.string() }; }

    float contentLogicalTopAdjustedForPrecedingLineBox() const
    {
        if (formattingContextRoot().style().writingMode().isLineInverted() || !m_lineIndex)
            return contentLogicalTop();
        return LineBoxIteratorModernPath { *m_inlineContent, m_lineIndex - 1 }.contentLogicalBottom();
    }
    float contentLogicalBottomAdjustedForFollowingLineBox() const
    {
        if (!formattingContextRoot().style().writingMode().isLineInverted() || m_lineIndex == lines().size() - 1)
            return contentLogicalBottom();
        return LineBoxIteratorModernPath { *m_inlineContent, m_lineIndex + 1 }.contentLogicalTop();
    }

    float contentLogicalLeft() const { return line().lineBoxLeft() + line().contentLogicalLeftIgnoringInlineDirection(); }
    float contentLogicalRight() const { return contentLogicalLeft() + line().contentLogicalWidth(); }
    bool isHorizontal() const { return line().isHorizontal(); }
    FontBaseline baselineType() const { return line().baselineType(); }

    const RenderBlockFlow& formattingContextRoot() const { return m_inlineContent->formattingContextRoot(); }

    RenderFragmentContainer* containingFragment() const { return nullptr; }
    bool isFirstAfterPageBreak() const { return line().isFirstAfterPageBreak(); }

    size_t lineIndex() const { return m_lineIndex; }

    void traverseNext()
    {
        ASSERT(!atEnd());

        ++m_lineIndex;
    }

    void traversePrevious()
    {
        ASSERT(!atEnd());

        if (!m_lineIndex) {
            setAtEnd();
            return;
        }

        --m_lineIndex;
    }

    friend bool operator==(const LineBoxIteratorModernPath&, const LineBoxIteratorModernPath&) = default;

    bool atEnd() const { return !m_inlineContent || m_lineIndex == lines().size(); }

    BoxModernPath firstLeafBox() const
    {
        if (!line().boxCount())
            return { *m_inlineContent };
        auto runIterator = BoxModernPath { *m_inlineContent, line().firstBoxIndex() };
        if (runIterator.box().isInlineBox())
            runIterator.traverseNextLeafOnLine();
        return runIterator;
    }

    BoxModernPath lastLeafBox() const
    {
        auto boxCount = line().boxCount();
        if (!boxCount)
            return { *m_inlineContent };
        auto runIterator = BoxModernPath { *m_inlineContent, line().firstBoxIndex() + boxCount - 1 };
        if (runIterator.box().isInlineBox())
            runIterator.traversePreviousLeafOnLine();
        return runIterator;
    }

private:
    void setAtEnd() { m_lineIndex = lines().size(); }

    const InlineDisplay::Lines& lines() const { return m_inlineContent->displayContent().lines; }
    const InlineDisplay::Line& line() const { return lines()[m_lineIndex]; }

    WeakPtr<const LayoutIntegration::InlineContent> m_inlineContent;
    size_t m_lineIndex { 0 };
};

}
}

