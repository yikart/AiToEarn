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

#include "FontCascade.h"
#include "LayoutElementBox.h"
#include "LayoutIntegrationInlineContent.h"
#include "TextBoxSelectableRange.h"

namespace WebCore {
namespace InlineIterator {

class BoxModernPath {
public:
    BoxModernPath(const LayoutIntegration::InlineContent& inlineContent)
        : m_inlineContent(&inlineContent)
    {
        setAtEnd();
    }
    BoxModernPath(const LayoutIntegration::InlineContent& inlineContent, size_t startIndex)
        : m_inlineContent(&inlineContent)
        , m_boxIndex(startIndex)
    {
    }

    bool isText() const { return box().isTextOrSoftLineBreak(); }
    bool isInlineBox() const { return box().isInlineBox(); }
    bool isRootInlineBox() const { return box().isRootInlineBox(); }

    FloatRect visualRectIgnoringBlockDirection() const { return box().visualRectIgnoringBlockDirection(); }

    inline bool isHorizontal() const;
    bool isLineBreak() const { return box().isLineBreak(); }

    unsigned minimumCaretOffset() const { return isText() ? start() : 0; }
    unsigned maximumCaretOffset() const { return isText() ? end() : 1; }

    unsigned char bidiLevel() const { return box().bidiLevel(); }

    bool hasHyphen() const { return box().text().hasHyphen(); }
    StringView originalText() const { return box().text().originalContent(); }
    unsigned start() const { return box().text().start(); }
    unsigned end() const { return box().text().end(); }
    unsigned length() const { return box().text().length(); }
    size_t lineIndex() const { return box().lineIndex(); }

    TextBoxSelectableRange selectableRange() const
    {
        auto& box = this->box();
        auto& textContent = box.text();
        auto extraTrailingLength = [&] () -> unsigned {
            if (textContent.hasHyphen())
                return box.style().hyphenString().length();
            if (downcast<Layout::InlineTextBox>(box.layoutBox()).isCombined()) {
                ASSERT(textContent.renderedContent().length() >= length());
                return textContent.renderedContent().length() - length();
            }
            return 0;
        };
        return {
            start(),
            length(),
            extraTrailingLength(),
            box.isLineBreak(),
            textContent.partiallyVisibleContentLength()
        };
    }

    inline TextRun textRun(TextRunMode = TextRunMode::Painting) const;

    const RenderObject& renderer() const
    {
        return *box().layoutBox().rendererForIntegration();
    }

    bool hasRenderer() const
    {
        return !!box().layoutBox().rendererForIntegration();
    }

    const RenderBlockFlow& formattingContextRoot() const
    {
        return m_inlineContent->formattingContextRoot();
    }

    const RenderStyle& style() const
    {
        return box().style();
    }

    void traverseNextTextBox()
    {
        ASSERT(!atEnd());
        ASSERT(box().isTextOrSoftLineBreak());

        if (box().isLastForLayoutBox()) {
            setAtEnd();
            return;
        }

        traverseNextWithSameLayoutBox();

        ASSERT(box().isTextOrSoftLineBreak());
    }

    void traverseNextLeafOnLine()
    {
        ASSERT(!atEnd());

        auto oldLineIndex = box().lineIndex();

        traverseNextLeaf();

        if (!atEnd() && oldLineIndex != box().lineIndex())
            setAtEnd();
    }

    void traversePreviousLeafOnLine()
    {
        ASSERT(!atEnd());

        auto oldLineIndex = box().lineIndex();

        traversePreviousLeaf();

        if (!atEnd() && oldLineIndex != box().lineIndex())
            setAtEnd();
    }

    void traverseNextInlineBox()
    {
        ASSERT(!atEnd());
        ASSERT(box().isInlineBox());

        if (box().isLastForLayoutBox()) {
            setAtEnd();
            return;
        }

        traverseNextWithSameLayoutBox();

        ASSERT(box().isInlineBox());
    }

    void traversePreviousInlineBox()
    {
        ASSERT(!atEnd());
        ASSERT(box().isInlineBox());

        if (box().isFirstForLayoutBox()) {
            setAtEnd();
            return;
        }

        traversePreviousWithSameLayoutBox();

        ASSERT(box().isInlineBox());
    }

    void traverseNextBoxOnLine()
    {
        auto lineIndex = box().lineIndex();

        traverseNextBox();

        if (!atEnd() && lineIndex != box().lineIndex())
            setAtEnd();
    }

    void traverseNextBoxOnLineSkippingChildren()
    {
        auto lineIndex = box().lineIndex();
        bool wasInlineBox = box().isInlineBox();
        auto& startBox = box().layoutBox();

        traverseNextBox();

        if (wasInlineBox) {
            while (!atEnd() && isWithinInlineBox(startBox))
                traverseNextBox();
        }

        if (!atEnd() && lineIndex != box().lineIndex())
            setAtEnd();
    }

    BoxModernPath firstLeafBoxForInlineBox() const
    {
        ASSERT(box().isInlineBox());

        auto& inlineBox = box().layoutBox();

        // The next box is the first descendant of this box;
        auto first = *this;
        first.traverseNextLeafOnLine();

        if (!first.atEnd() && !first.isWithinInlineBox(inlineBox))
            first.setAtEnd();

        return first;
    }

    BoxModernPath lastLeafBoxForInlineBox() const
    {
        ASSERT(box().isInlineBox());

        auto& inlineBox = box().layoutBox();

        // FIXME: Get the last box index directly from the display box.
        auto last = firstLeafBoxForInlineBox();
        for (auto box = last; !box.atEnd() && box.isWithinInlineBox(inlineBox); box.traverseNextLeafOnLine())
            last = box;

        return last;
    }

    BoxModernPath parentInlineBox() const
    {
        ASSERT(!atEnd());

        auto candidate = *this;

        if (isRootInlineBox()) {
            candidate.setAtEnd();
            return candidate;
        }

        auto& parentLayoutBox = box().layoutBox().parent();
        do {
            candidate.traversePreviousBox();
        } while (!candidate.atEnd() && &candidate.box().layoutBox() != &parentLayoutBox);

        ASSERT(candidate.atEnd() || candidate.box().isInlineBox());

        return candidate;
    }

    TextDirection direction() const { return bidiLevel() % 2 ? TextDirection::RTL : TextDirection::LTR; }
    bool isFirstLine() const { return !box().lineIndex(); }

    const Vector<SVGTextFragment>& svgTextFragments() const
    {
        return m_inlineContent->svgTextFragments(m_boxIndex);
    }

    friend bool operator==(const BoxModernPath&, const BoxModernPath&) = default;

    bool atEnd() const { return !m_inlineContent || m_boxIndex == boxes().size(); }
    const InlineDisplay::Box& box() const { return boxes()[m_boxIndex]; }
    auto& inlineContent() const { return *m_inlineContent; }

    size_t boxIndex() const { return m_boxIndex; }

private:
    bool isWithinInlineBox(const Layout::Box& inlineBox)
    {
        for (auto* layoutBox = &box().layoutBox().parent();; layoutBox = &layoutBox->parent()) {
            if (layoutBox == &inlineBox)
                return true;
            if (!layoutBox->isInlineBox())
                return false;
        }
        return false;
    }

    void traverseNextBox()
    {
        ASSERT(!atEnd());
        ++m_boxIndex;
    }

    void traversePreviousBox()
    {
        ASSERT(!atEnd());
        m_boxIndex = m_boxIndex ? m_boxIndex - 1 : boxes().size();
    }

    void traverseNextLeaf()
    {
        do {
            traverseNextBox();
        } while (!atEnd() && box().isInlineBox());
    }

    void traversePreviousLeaf()
    {
        do {
            traversePreviousBox();
        } while (!atEnd() && box().isInlineBox());
    }

    void traverseNextWithSameLayoutBox()
    {
        auto& layoutBox = box().layoutBox();
        do {
            traverseNextBox();
        } while (!atEnd() && &box().layoutBox() != &layoutBox);
    }

    void traversePreviousWithSameLayoutBox()
    {
        auto& layoutBox = box().layoutBox();
        do {
            traversePreviousBox();
        } while (!atEnd() && &box().layoutBox() != &layoutBox);
    }

    void setAtEnd() { m_boxIndex = boxes().size(); }

    const InlineDisplay::Boxes& boxes() const { return m_inlineContent->displayContent().boxes; }
    const InlineDisplay::Line& line() const { return m_inlineContent->lineForBox(box()); }

    const RenderText& renderText() const { return downcast<RenderText>(renderer()); }

    WeakPtr<const LayoutIntegration::InlineContent> m_inlineContent;
    size_t m_boxIndex { 0 };
};

}
}

