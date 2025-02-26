/*
 * Copyright (C) 2019-2021 Apple Inc. All rights reserved.
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

#include "InlineIteratorBox.h"
#include "RenderText.h"

namespace WebCore {

namespace InlineIterator {

class TextBox : public Box {
public:
    TextBox(PathVariant&&);

    bool hasHyphen() const;
    StringView originalText() const;

    unsigned start() const;
    unsigned end() const;
    unsigned length() const;

    TextBoxSelectableRange selectableRange() const;

    const FontCascade& fontCascade() const;

    inline TextRun textRun(TextRunMode = TextRunMode::Painting) const;

    const RenderText& renderer() const { return downcast<RenderText>(Box::renderer()); }

    // FIXME: Remove. For intermediate porting steps only.
    const LegacyInlineTextBox* legacyInlineBox() const { return downcast<LegacyInlineTextBox>(Box::legacyInlineBox()); }

    // This returns the next text box generated for the same RenderText/Layout::InlineTextBox.
    TextBoxIterator nextTextBox() const;
};

class TextBoxIterator : public LeafBoxIterator {
public:
    TextBoxIterator() = default;
    TextBoxIterator(Box::PathVariant&&);
    TextBoxIterator(const Box&);

    TextBoxIterator& operator++() { return traverseNextTextBox(); }

    const TextBox& operator*() const { return get(); }
    const TextBox* operator->() const { return &get(); }

    // This traverses to the next text box generated for the same RenderText/Layout::InlineTextBox.
    TextBoxIterator& traverseNextTextBox();

private:
    BoxIterator& traverseNextOnLine() = delete;
    BoxIterator& traversePreviousOnLine() = delete;
    BoxIterator& traverseNextOnLineIgnoringLineBreak() = delete;
    BoxIterator& traversePreviousOnLineIgnoringLineBreak() = delete;

    const TextBox& get() const { return downcast<TextBox>(m_box); }
};

TextBoxIterator firstTextBoxFor(const RenderText&);
TextBoxIterator textBoxFor(const LegacyInlineTextBox*);
TextBoxIterator textBoxFor(const LayoutIntegration::InlineContent&, const InlineDisplay::Box&);
TextBoxIterator textBoxFor(const LayoutIntegration::InlineContent&, size_t boxIndex);
BoxRange<TextBoxIterator> textBoxesFor(const RenderText&);

inline bool TextBox::hasHyphen() const
{
    return WTF::switchOn(m_pathVariant, [](auto& path) {
        return path.hasHyphen();
    });
}

inline TextBox::TextBox(PathVariant&& path)
    : Box(WTFMove(path))
{
}

inline StringView TextBox::originalText() const
{
    return WTF::switchOn(m_pathVariant, [](auto& path) {
        return path.originalText();
    });
}

inline unsigned TextBox::start() const
{
    return WTF::switchOn(m_pathVariant, [](auto& path) {
        return path.start();
    });
}

inline unsigned TextBox::end() const
{
    return WTF::switchOn(m_pathVariant, [](auto& path) {
        return path.end();
    });
}

inline unsigned TextBox::length() const
{
    return WTF::switchOn(m_pathVariant, [](auto& path) {
        return path.length();
    });
}

inline TextBoxSelectableRange TextBox::selectableRange() const
{
    return WTF::switchOn(m_pathVariant, [&](auto& path) {
        return path.selectableRange();
    });
}

}
}

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::InlineIterator::TextBox)
static bool isType(const WebCore::InlineIterator::Box& box) { return box.isText(); }
SPECIALIZE_TYPE_TRAITS_END()

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::InlineIterator::TextBoxIterator)
static bool isType(const WebCore::InlineIterator::BoxIterator& box) { return !box || box->isText(); }
SPECIALIZE_TYPE_TRAITS_END()

