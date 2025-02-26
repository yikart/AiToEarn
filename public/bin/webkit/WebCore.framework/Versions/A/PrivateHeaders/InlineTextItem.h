/*
 * Copyright (C) 2018 Apple Inc. All rights reserved.
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

#include "InlineItem.h"
#include "LayoutInlineTextBox.h"

namespace WebCore {
namespace Layout {

class InlineItemsBuilder;

class InlineTextItem : public InlineItem {
public:
    static InlineTextItem createWhitespaceItem(const InlineTextBox&, unsigned start, unsigned length, UBiDiLevel, bool isWordSeparator, std::optional<InlineLayoutUnit> width);
    static InlineTextItem createNonWhitespaceItem(const InlineTextBox&, unsigned start, unsigned length, UBiDiLevel, bool hasTrailingSoftHyphen, std::optional<InlineLayoutUnit> width);
    static InlineTextItem createEmptyItem(const InlineTextBox&);

    unsigned start() const { return m_startOrPosition; }
    unsigned end() const { return start() + length(); }
    unsigned length() const { return m_length; }

    bool isEmpty() const { return !length() && m_textItemType == TextItemType::Undefined; }
    bool isWhitespace() const { return m_textItemType == TextItemType::Whitespace; }
    bool isWordSeparator() const { return m_isWordSeparator; }
    bool isZeroWidthSpaceSeparator() const;
    bool isQuirkNonBreakingSpace() const;
    bool isFullyTrimmable() const;
    bool hasTrailingSoftHyphen() const { return m_hasTrailingSoftHyphen; }
    std::optional<InlineLayoutUnit> width() const { return m_hasWidth ? std::make_optional(m_width) : std::optional<InlineLayoutUnit> { }; }

    const InlineTextBox& inlineTextBox() const { return downcast<InlineTextBox>(layoutBox()); }

    InlineTextItem left(unsigned length) const;
    InlineTextItem right(unsigned length, std::optional<InlineLayoutUnit> width) const;

    static bool shouldPreserveSpacesAndTabs(const InlineTextItem&);

private:
    friend class InlineItemsBuilder;
    using InlineItem::TextItemType;

    InlineTextItem split(size_t leftSideLength);

    InlineTextItem(const InlineTextBox&, unsigned start, unsigned length, UBiDiLevel, bool hasTrailingSoftHyphen, bool isWordSeparator, std::optional<InlineLayoutUnit> width, TextItemType);
    explicit InlineTextItem(const InlineTextBox&);
};

inline InlineTextItem InlineTextItem::createWhitespaceItem(const InlineTextBox& inlineTextBox, unsigned start, unsigned length, UBiDiLevel bidiLevel, bool isWordSeparator, std::optional<InlineLayoutUnit> width)
{
    return { inlineTextBox, start, length, bidiLevel, false, isWordSeparator, width, TextItemType::Whitespace };
}

inline InlineTextItem InlineTextItem::createNonWhitespaceItem(const InlineTextBox& inlineTextBox, unsigned start, unsigned length, UBiDiLevel bidiLevel, bool hasTrailingSoftHyphen, std::optional<InlineLayoutUnit> width)
{
    // FIXME: Use the following list of non-whitespace characters to set the "isWordSeparator" bit: noBreakSpace, ethiopicWordspace, aegeanWordSeparatorLine aegeanWordSeparatorDot ugariticWordDivider.
    return { inlineTextBox, start, length, bidiLevel, hasTrailingSoftHyphen, false, width, TextItemType::NonWhitespace };
}

inline InlineTextItem InlineTextItem::createEmptyItem(const InlineTextBox& inlineTextBox)
{
    ASSERT(!inlineTextBox.content().length());
    return InlineTextItem { inlineTextBox };
}

}
}

SPECIALIZE_TYPE_TRAITS_INLINE_ITEM(InlineTextItem, isText())

