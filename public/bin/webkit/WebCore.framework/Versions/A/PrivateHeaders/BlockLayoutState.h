/*
 * Copyright (C) 2022 Apple Inc. All rights reserved.
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

#include "Font.h"
#include "PlacedFloats.h"
#include "StyleTextEdge.h"
#include <algorithm>

namespace WebCore {
namespace Layout {

class BlockFormattingContext;

// This class holds block level information shared across child inline formatting contexts.
class BlockLayoutState {
public:
    struct LineClamp {
        size_t maximumLines { 0 };
        bool shouldDiscardOverflow { false };
        bool isLegacy { true };
    };
    enum class TextBoxTrimSide : uint8_t {
        Start = 1 << 0,
        End   = 1 << 1
    };
    using TextBoxTrim = OptionSet<TextBoxTrimSide>;

    struct LineGrid {
        LayoutSize layoutOffset;
        LayoutSize gridOffset;
        InlineLayoutUnit columnWidth;
        LayoutUnit rowHeight;
        LayoutUnit topRowOffset;
        Ref<const Font> primaryFont;
        std::optional<LayoutSize> paginationOrigin;
        LayoutUnit pageLogicalTop;
    };

    BlockLayoutState(PlacedFloats&, std::optional<LineClamp> = { }, TextBoxTrim = { }, TextEdge = { }, std::optional<LayoutUnit> intrusiveInitialLetterLogicalBottom = { }, std::optional<LineGrid> lineGrid = { });

    PlacedFloats& placedFloats() { return m_placedFloats; }
    const PlacedFloats& placedFloats() const { return m_placedFloats; }

    std::optional<LineClamp> lineClamp() const { return m_lineClamp; }
    TextBoxTrim textBoxTrim() const { return m_textBoxTrim; }
    TextEdge textBoxEdge() const { return m_textBoxEdge; }

    std::optional<LayoutUnit> intrusiveInitialLetterLogicalBottom() const { return m_intrusiveInitialLetterLogicalBottom; }
    const std::optional<LineGrid>& lineGrid() const { return m_lineGrid; }

private:
    PlacedFloats& m_placedFloats;
    std::optional<LineClamp> m_lineClamp;
    TextBoxTrim m_textBoxTrim;
    TextEdge m_textBoxEdge;
    std::optional<LayoutUnit> m_intrusiveInitialLetterLogicalBottom;
    std::optional<LineGrid> m_lineGrid;
};

inline BlockLayoutState::BlockLayoutState(PlacedFloats& placedFloats, std::optional<LineClamp> lineClamp, TextBoxTrim textBoxTrim, TextEdge textBoxEdge, std::optional<LayoutUnit> intrusiveInitialLetterLogicalBottom, std::optional<LineGrid> lineGrid)
    : m_placedFloats(placedFloats)
    , m_lineClamp(lineClamp)
    , m_textBoxTrim(textBoxTrim)
    , m_textBoxEdge(textBoxEdge)
    , m_intrusiveInitialLetterLogicalBottom(intrusiveInitialLetterLogicalBottom)
    , m_lineGrid(lineGrid)
{
}

}
}
