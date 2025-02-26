/*
 * Copyright (C) 2018-2024 Apple Inc. All rights reserved.
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

#include "FormattingConstraints.h"
#include "InlineDisplayContent.h"
#include "InlineItem.h"
#include "LineLayoutResult.h"
#include <wtf/HashMap.h>

namespace WebCore {
namespace Layout {

// InlineContentCache is used to cache content for subsequent layouts.
class InlineContentCache {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(InlineContentCache);
public:
    struct InlineItems {
        InlineItemList& content() { return m_inlineItemList; }
        const InlineItemList& content() const { return m_inlineItemList; }

        struct ContentAttributes {
            bool requiresVisualReordering { false };
            // Note that <span>this is text</span> returns true as inline boxes are not considered 'content' here.
            bool hasTextAndLineBreakOnlyContent { false };
            bool hasTextAutospace { false };
            size_t inlineBoxCount { 0 };
        };
        void set(InlineItemList&&, ContentAttributes);
        void replace(size_t insertionPosition, InlineItemList&&, ContentAttributes);
        void shrinkToFit() { m_inlineItemList.shrinkToFit(); }

        bool isEmpty() const { return content().isEmpty(); }
        size_t size() const { return content().size(); }

        bool requiresVisualReordering() const { return m_contentAttributes.requiresVisualReordering; }
        bool hasTextAndLineBreakOnlyContent() const { return m_contentAttributes.hasTextAndLineBreakOnlyContent; }
        bool hasTextAutospace() const { return m_contentAttributes.hasTextAutospace; }
        bool hasInlineBoxes() const { return !!inlineBoxCount(); }
        size_t inlineBoxCount() const { return m_contentAttributes.inlineBoxCount; }

    private:
        ContentAttributes m_contentAttributes;
        InlineItemList m_inlineItemList;

    };
    const InlineItems& inlineItems() const { return m_inlineItems; }
    InlineItems& inlineItems() { return m_inlineItems; }

    void setMaximumIntrinsicWidthLineContent(LineLayoutResult&& lineContent) { m_maximumIntrinsicWidthLineContent = WTFMove(lineContent); }
    void clearMaximumIntrinsicWidthLineContent() { m_maximumIntrinsicWidthLineContent = { }; }
    std::optional<LineLayoutResult>& maximumIntrinsicWidthLineContent() { return m_maximumIntrinsicWidthLineContent; }

    void setMinimumContentSize(InlineLayoutUnit minimumContentSize) { m_minimumContentSize = minimumContentSize; }
    void setMaximumContentSize(InlineLayoutUnit maximumContentSize) { m_maximumContentSize = maximumContentSize; }
    std::optional<InlineLayoutUnit> minimumContentSize() const { return m_minimumContentSize; }
    std::optional<InlineLayoutUnit> maximumContentSize() const { return m_maximumContentSize; }
    void resetMinimumMaximumContentSizes();

    const InlineBoxBoundaryTextSpacings& inlineBoxBoundaryTextSpacings() const { return m_textSpacingContext.inlineBoxBoundaryTextSpacings; }
    void setInlineBoxBoundaryTextSpacings(InlineBoxBoundaryTextSpacings&& spacings) { m_textSpacingContext.inlineBoxBoundaryTextSpacings = WTFMove(spacings); }
    const TrimmableTextSpacings& trimmableTextSpacings() const { return m_textSpacingContext.trimmableTextSpacings; }
    void setTrimmableTextSpacings(TrimmableTextSpacings&& spacings) { m_textSpacingContext.trimmableTextSpacings = WTFMove(spacings); }

    const TextSpacingContext& textSpacingContext() const { return m_textSpacingContext; }

private:
    InlineItems m_inlineItems;
    TextSpacingContext m_textSpacingContext;

    std::optional<LineLayoutResult> m_maximumIntrinsicWidthLineContent { };
    std::optional<InlineLayoutUnit> m_minimumContentSize { };
    std::optional<InlineLayoutUnit> m_maximumContentSize { };
};

inline void InlineContentCache::resetMinimumMaximumContentSizes()
{
    m_minimumContentSize = { };
    m_maximumContentSize = { };
    m_maximumIntrinsicWidthLineContent = { };
}

inline void InlineContentCache::InlineItems::set(InlineItemList&& inlineItemList, ContentAttributes contentAttributes)
{
    m_inlineItemList = WTFMove(inlineItemList);
    m_contentAttributes = contentAttributes;
}

inline void InlineContentCache::InlineItems::replace(size_t insertionPosition, InlineItemList&& inlineItemList, ContentAttributes contentAttributes)
{
    m_inlineItemList.remove(insertionPosition, m_inlineItemList.size() - insertionPosition);
    m_inlineItemList.appendVector(WTFMove(inlineItemList));
    m_contentAttributes = contentAttributes;
}

}
}

