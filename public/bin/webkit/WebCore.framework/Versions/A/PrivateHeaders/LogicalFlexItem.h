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

#include "LayoutElementBox.h"

namespace WebCore {
namespace Layout {

class LogicalFlexItem {
public:
    struct MainAxisGeometry {
        LayoutUnit margin() const { return marginStart.value_or(0_lu) + marginEnd.value_or(0_lu); }

        std::optional<LayoutUnit> definiteFlexBasis;

        std::optional<LayoutUnit> size;
        std::optional<LayoutUnit> maximumSize;
        std::optional<LayoutUnit> minimumSize;

        std::optional<LayoutUnit> marginStart;
        std::optional<LayoutUnit> marginEnd;

        LayoutUnit borderAndPadding;
    };

    struct CrossAxisGeometry {
        LayoutUnit margin() const { return marginStart.value_or(0_lu) + marginEnd.value_or(0_lu); }

        bool hasNonAutoMargins() const { return marginStart && marginEnd; }

        std::optional<LayoutUnit> definiteSize;

        LayoutUnit ascent;
        LayoutUnit descent;

        std::optional<LayoutUnit> maximumSize;
        std::optional<LayoutUnit> minimumSize;

        std::optional<LayoutUnit> marginStart;
        std::optional<LayoutUnit> marginEnd;

        LayoutUnit borderAndPadding;

        bool hasSizeAuto { false };
    };

    LogicalFlexItem(const ElementBox&, const MainAxisGeometry&, const CrossAxisGeometry&, bool hasAspectRatio, bool isOrhogonal);
    LogicalFlexItem() = default;

    const MainAxisGeometry& mainAxis() const { return m_mainAxisGeometry; }
    const CrossAxisGeometry& crossAxis() const { return m_crossAxisGeometry; }

    float growFactor() const { return style().flexGrow(); }
    float shrinkFactor() const { return style().flexShrink(); }

    bool hasContentFlexBasis() const { return style().flexBasis().isContent(); }
    bool hasAvailableSpaceDependentFlexBasis() const { return false; }
    bool hasAspectRatio() const { return m_hasAspectRatio; }
    bool isOrhogonal() const { return m_isOrhogonal; }
    bool isContentBoxBased() const { return style().boxSizing() == BoxSizing::ContentBox; }

    const ElementBox& layoutBox() const { return *m_layoutBox; }
    const RenderStyle& style() const { return layoutBox().style(); }
    WritingMode writingMode() const { return style().writingMode(); }

private:
    CheckedPtr<const ElementBox> m_layoutBox;

    MainAxisGeometry m_mainAxisGeometry;
    CrossAxisGeometry m_crossAxisGeometry;
    bool m_hasAspectRatio { false };
    bool m_isOrhogonal { false };
};

inline LogicalFlexItem::LogicalFlexItem(const ElementBox& flexItem, const MainAxisGeometry& mainGeometry, const CrossAxisGeometry& crossGeometry, bool hasAspectRatio, bool isOrhogonal)
    : m_layoutBox(flexItem)
    , m_mainAxisGeometry(mainGeometry)
    , m_crossAxisGeometry(crossGeometry)
    , m_hasAspectRatio(hasAspectRatio)
    , m_isOrhogonal(isOrhogonal)
{
}

}
}
