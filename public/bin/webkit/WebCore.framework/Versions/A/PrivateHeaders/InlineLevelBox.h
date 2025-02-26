/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
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
#include "InlineRect.h"
#include "LayoutBox.h"
#include "LayoutUnits.h"
#include "LengthFunctions.h"
#include "StyleTextEdge.h"
#include <wtf/OptionSet.h>

namespace WebCore {
namespace Layout {

class LineBox;
class LineBoxBuilder;
class LineBoxVerticalAligner;

class InlineLevelBox {
public:
    enum class LineSpanningInlineBox : bool { No, Yes };
    static inline InlineLevelBox createInlineBox(const Box&, const RenderStyle&, InlineLayoutUnit logicalLeft, InlineLayoutUnit logicalWidth, LineSpanningInlineBox = LineSpanningInlineBox::No);
    static inline InlineLevelBox createRootInlineBox(const Box&, const RenderStyle&, InlineLayoutUnit logicalLeft, InlineLayoutUnit logicalWidth);
    static inline InlineLevelBox createAtomicInlineBox(const Box&, const RenderStyle&, InlineLayoutUnit logicalLeft, InlineLayoutUnit logicalWidth);
    static inline InlineLevelBox createLineBreakBox(const Box&, const RenderStyle&, InlineLayoutUnit logicalLeft);
    static inline InlineLevelBox createGenericInlineLevelBox(const Box&, const RenderStyle&, InlineLayoutUnit logicalLeft);

    struct AscentAndDescent {
        InlineLayoutUnit ascent { 0 };
        InlineLayoutUnit descent { 0 };

        InlineLayoutUnit height() const { return ascent + descent; }
        friend bool operator==(const AscentAndDescent&, const AscentAndDescent&) = default;
        // FIXME: Remove this.
        // We need floor/ceil to match legacy layout integral positioning.
        void round();
    };
    InlineLayoutUnit ascent() const { return m_ascentAndDescent.ascent; }
    InlineLayoutUnit descent() const { return m_ascentAndDescent.descent; }
    // See https://www.w3.org/TR/css-inline-3/#layout-bounds
    AscentAndDescent layoutBounds() const { return m_layoutBounds; }

    bool hasContent() const { return m_hasContent; }
    void setHasContent();

    struct VerticalAlignment {
        VerticalAlign type { VerticalAlign::Baseline };
        std::optional<InlineLayoutUnit> baselineOffset;
    };
    VerticalAlignment verticalAlign() const { return m_style.verticalAlignment; }
    bool hasLineBoxRelativeAlignment() const;

    InlineLayoutUnit preferredLineHeight() const;
    bool isPreferredLineHeightFontMetricsBased() const { return m_style.lineHeight.isNormal(); }

    inline bool mayStretchLineBox() const;

    const FontMetrics& primarymetricsOfPrimaryFont() const { return m_style.primaryFontMetrics; }
    InlineLayoutUnit fontSize() const { return m_style.primaryFontSize; }

    TextBoxTrim textBoxTrim() const { return m_style.textBoxTrim; }
    TextEdge textBoxEdge() const { return m_style.textBoxEdge; }
    TextEdge lineFitEdge() const { return m_style.lineFitEdge; }
    InlineLayoutUnit inlineBoxContentOffsetForTextBoxTrim() const { return m_inlineBoxContentOffsetForTextBoxTrim; }

    bool hasTextEmphasis() const { return (hasContent() || isAtomicInlineBox()) && m_textEmphasis.has_value(); };
    std::optional<InlineLayoutUnit> textEmphasisAbove() const { return hasTextEmphasis() ? std::optional { m_textEmphasis->above } : std::nullopt; }
    std::optional<InlineLayoutUnit> textEmphasisBelow() const { return hasTextEmphasis() ? std::optional { m_textEmphasis->below } : std::nullopt; }

    bool isInlineBox() const { return m_type == Type::InlineBox || isRootInlineBox() || isLineSpanningInlineBox(); }
    bool isRootInlineBox() const { return m_type == Type::RootInlineBox; }
    bool isLineSpanningInlineBox() const { return m_type == Type::LineSpanningInlineBox; }
    bool isAtomicInlineBox() const { return m_type == Type::AtomicInlineBox; }
    bool isListMarker() const { return isAtomicInlineBox() && layoutBox().isListMarkerBox(); }
    bool isLineBreakBox() const { return m_type == Type::LineBreakBox; }

    enum class Type : uint8_t {
        InlineBox             = 1 << 0,
        LineSpanningInlineBox = 1 << 1,
        RootInlineBox         = 1 << 2,
        AtomicInlineBox       = 1 << 3,
        LineBreakBox          = 1 << 4,
        GenericInlineLevelBox = 1 << 5
    };
    Type type() const { return m_type; }

    const Box& layoutBox() const { return m_layoutBox; }

    bool isFirstBox() const { return m_isFirstWithinLayoutBox; }
    bool isLastBox() const { return m_isLastWithinLayoutBox; }

private:
    enum class PositionWithinLayoutBox {
        First = 1 << 0,
        Last  = 1 << 1
    };
    InlineLevelBox(const Box&, const RenderStyle&, InlineLayoutUnit logicalLeft, InlineLayoutSize, Type, OptionSet<PositionWithinLayoutBox> = { PositionWithinLayoutBox::First, PositionWithinLayoutBox::Last });

    friend class InlineDisplayLineBuilder;
    friend class LineBox;
    friend class LineBoxBuilder;
    friend class LineBoxVerticalAligner;
    friend class InlineFormattingUtils;
    friend class RubyFormattingContext;

    const InlineRect& logicalRect() const { return m_logicalRect; }
    InlineLayoutUnit logicalTop() const { return m_logicalRect.top(); }
    InlineLayoutUnit logicalBottom() const { return m_logicalRect.bottom(); }
    InlineLayoutUnit logicalLeft() const { return m_logicalRect.left(); }
    InlineLayoutUnit logicalRight() const { return m_logicalRect.right(); }
    InlineLayoutUnit logicalWidth() const { return m_logicalRect.width(); }
    InlineLayoutUnit logicalHeight() const { return m_logicalRect.height(); }

    // FIXME: Remove legacy rounding.
    void setLogicalWidth(InlineLayoutUnit logicalWidth) { m_logicalRect.setWidth(logicalWidth); }
    void setLogicalHeight(InlineLayoutUnit logicalHeight) { m_logicalRect.setHeight(logicalHeight); }
    void setLogicalTop(InlineLayoutUnit logicalTop) { m_logicalRect.setTop(logicalTop); }
    void setLogicalLeft(InlineLayoutUnit logicalLeft) { m_logicalRect.setLeft(logicalLeft); }
    void setAscentAndDescent(AscentAndDescent ascentAndDescent) { m_ascentAndDescent = ascentAndDescent; }
    void setLayoutBounds(const AscentAndDescent& layoutBounds) { m_layoutBounds = layoutBounds; }
    void setInlineBoxContentOffsetForTextBoxTrim(InlineLayoutUnit offset) { m_inlineBoxContentOffsetForTextBoxTrim = offset; }

    void setIsFirstBox() { m_isFirstWithinLayoutBox = true; }
    void setIsLastBox() { m_isLastWithinLayoutBox = true; }

    void setTextEmphasis(std::pair<InlineLayoutUnit, InlineLayoutUnit>);

private:
    CheckedRef<const Box> m_layoutBox;
    // This is the combination of margin and border boxes. Inline level boxes are vertically aligned using their margin boxes.
    InlineRect m_logicalRect;
    AscentAndDescent m_layoutBounds;
    AscentAndDescent m_ascentAndDescent;
    InlineLayoutUnit m_inlineBoxContentOffsetForTextBoxTrim { 0.f };
    bool m_hasContent { false };
    // These bits are about whether this inline level box is the first/last generated box of the associated Layout::Box
    // (e.g. always true for atomic inline level boxes, but inline boxes spanning over multiple lines can produce separate first/last boxes).
    bool m_isFirstWithinLayoutBox { false };
    bool m_isLastWithinLayoutBox { false };
    Type m_type { Type::InlineBox };

    struct Style {
        const FontMetrics& primaryFontMetrics;
        const Length& lineHeight;
        TextBoxTrim textBoxTrim;
        TextEdge textBoxEdge;
        TextEdge lineFitEdge;
        OptionSet<LineBoxContain> lineBoxContain;
        InlineLayoutUnit primaryFontSize { 0 };
        VerticalAlignment verticalAlignment { };
    };
    Style m_style;

    struct TextEmphasis {
        InlineLayoutUnit above;
        InlineLayoutUnit below;
    };
    std::optional<TextEmphasis> m_textEmphasis;
};

inline void InlineLevelBox::setHasContent()
{
    ASSERT(isInlineBox());
    m_hasContent = true;
}

inline InlineLayoutUnit InlineLevelBox::preferredLineHeight() const
{
    if (isPreferredLineHeightFontMetricsBased())
        return primarymetricsOfPrimaryFont().lineSpacing();

    if (m_style.lineHeight.isPercentOrCalculated())
        return minimumValueForLength(m_style.lineHeight, fontSize());
    return m_style.lineHeight.value();
}

inline bool InlineLevelBox::hasLineBoxRelativeAlignment() const
{
    auto verticalAlignment = verticalAlign().type;
    return verticalAlignment == VerticalAlign::Top || verticalAlignment == VerticalAlign::Bottom;
}

inline void InlineLevelBox::AscentAndDescent::round()
{
    ascent = floorf(ascent);
    descent = ceilf(descent);
}

}
}

