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

#include "LayoutBox.h"
#include "LayoutUnits.h"
#include <unicode/ubidi.h>

namespace WebCore {
namespace Layout {

class InlineItemsBuilder;

class InlineItem {
public:
    enum class Type : uint8_t {
        Text,
        HardLineBreak,
        SoftLineBreak,
        WordBreakOpportunity,
        AtomicInlineBox,
        InlineBoxStart,
        InlineBoxEnd,
        Float,
        Opaque
    };
    InlineItem(const Box& layoutBox, Type, UBiDiLevel = UBIDI_DEFAULT_LTR);

    Type type() const { return m_type; }
    static constexpr UBiDiLevel opaqueBidiLevel = 0xff;
    UBiDiLevel bidiLevel() const { return m_bidiLevel; }
    const Box& layoutBox() const { return *m_layoutBox; }
    const RenderStyle& style() const { return layoutBox().style(); }
    const RenderStyle& firstLineStyle() const { return layoutBox().firstLineStyle(); }

    bool isText() const { return type() == Type::Text; }
    bool isAtomicInlineBox() const { return type() == Type::AtomicInlineBox; }
    bool isFloat() const { return type() == Type::Float; }
    bool isLineBreak() const { return isSoftLineBreak() || isHardLineBreak(); }
    bool isWordBreakOpportunity() const { return type() == Type::WordBreakOpportunity; }
    bool isSoftLineBreak() const { return type() == Type::SoftLineBreak; }
    bool isHardLineBreak() const { return type() == Type::HardLineBreak; }
    bool isInlineBoxStart() const { return type() == Type::InlineBoxStart; }
    bool isInlineBoxEnd() const { return type() == Type::InlineBoxEnd; }
    bool isInlineBoxStartOrEnd() const { return isInlineBoxStart() || isInlineBoxEnd(); }
    bool isOpaque() const { return type() == Type::Opaque; }

private:
    friend class InlineItemsBuilder;

    void setBidiLevel(UBiDiLevel bidiLevel) { m_bidiLevel = bidiLevel; }
    void setWidth(InlineLayoutUnit);

    const Box* m_layoutBox { nullptr };

protected:
    InlineLayoutUnit m_width { };
    unsigned m_length { 0 };

    // For InlineTextItem and InlineSoftLineBreakItem
    unsigned m_startOrPosition { 0 };
private:
    UBiDiLevel m_bidiLevel { UBIDI_DEFAULT_LTR };

    Type m_type : 4 { };

protected:
    // For InlineTextItem
    enum class TextItemType  : uint8_t { Undefined, Whitespace, NonWhitespace };

    TextItemType m_textItemType : 2 { TextItemType::Undefined };
    bool m_hasWidth : 1 { false };
    bool m_hasTrailingSoftHyphen : 1 { false };
    bool m_isWordSeparator : 1 { false };
};

inline InlineItem::InlineItem(const Box& layoutBox, Type type, UBiDiLevel bidiLevel)
    : m_layoutBox(&layoutBox)
    , m_bidiLevel(bidiLevel)
    , m_type(type)
{
}

inline void InlineItem::setWidth(InlineLayoutUnit width)
{
    m_width = width;
    m_hasWidth = true;
}

using InlineItemList = Vector<InlineItem>;

#define SPECIALIZE_TYPE_TRAITS_INLINE_ITEM(ToValueTypeName, predicate) \
SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::Layout::ToValueTypeName) \
    static bool isType(const WebCore::Layout::InlineItem& inlineItem) { return inlineItem.predicate; } \
SPECIALIZE_TYPE_TRAITS_END()

}
}

namespace WTF {

template<>
struct VectorTraits<WebCore::Layout::InlineItem> : public VectorTraitsBase<false, void> {
    static constexpr bool canCopyWithMemcpy = true;
    static constexpr bool canMoveWithMemcpy = true;
};

}
