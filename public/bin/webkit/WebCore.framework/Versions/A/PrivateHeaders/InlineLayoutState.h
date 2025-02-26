/*
 * Copyright (C) 2023 Apple Inc. All rights reserved.
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

#include "AvailableLineWidthOverride.h"
#include "BlockLayoutState.h"

namespace WebCore {
namespace Layout {

class InlineLayoutState {
public:
    InlineLayoutState(BlockLayoutState&);

    void setClearGapAfterLastLine(InlineLayoutUnit verticalGap);
    InlineLayoutUnit clearGapAfterLastLine() const { return m_clearGapAfterLastLine; }

    void setClearGapBeforeFirstLine(InlineLayoutUnit verticalGap) { m_clearGapBeforeFirstLine = verticalGap; }
    InlineLayoutUnit clearGapBeforeFirstLine() const { return m_clearGapBeforeFirstLine; }

    const BlockLayoutState& parentBlockLayoutState() const { return m_parentBlockLayoutState; }
    BlockLayoutState& parentBlockLayoutState() { return m_parentBlockLayoutState; }

    const PlacedFloats& placedFloats() const { return m_parentBlockLayoutState.placedFloats(); }
    PlacedFloats& placedFloats() { return m_parentBlockLayoutState.placedFloats(); }

    void setAvailableLineWidthOverride(AvailableLineWidthOverride availableLineWidthOverride) { m_availableLineWidthOverride = availableLineWidthOverride; }
    const AvailableLineWidthOverride& availableLineWidthOverride() const { return m_availableLineWidthOverride; }

    void setLegacyClampedLineIndex(size_t lineIndex) { m_legacyClampedLineIndex = lineIndex; }
    std::optional<size_t> legacyClampedLineIndex() const { return m_legacyClampedLineIndex; }

    void setHyphenationLimitLines(size_t hyphenationLimitLines) { m_hyphenationLimitLines = hyphenationLimitLines; }
    void incrementSuccessiveHyphenatedLineCount() { ++m_successiveHyphenatedLineCount; }
    void resetSuccessiveHyphenatedLineCount() { m_successiveHyphenatedLineCount = 0; }
    bool isHyphenationDisabled() const { return m_hyphenationLimitLines && *m_hyphenationLimitLines <= m_successiveHyphenatedLineCount; }

    void setFirstLineStartTrimForInitialLetter(InlineLayoutUnit trimmedThisMuch) { m_firstLineStartTrimForInitialLetter = trimmedThisMuch; }
    InlineLayoutUnit firstLineStartTrimForInitialLetter() const { return m_firstLineStartTrimForInitialLetter; }

    void setInStandardsMode() { m_inStandardsMode = true; }
    bool inStandardsMode() const { return m_inStandardsMode; }

    // Integration codepath
    void setNestedListMarkerOffsets(UncheckedKeyHashMap<const ElementBox*, LayoutUnit>&& nestedListMarkerOffsets) { m_nestedListMarkerOffsets = WTFMove(nestedListMarkerOffsets); }
    LayoutUnit nestedListMarkerOffset(const ElementBox& listMarkerBox) const { return m_nestedListMarkerOffsets.get(&listMarkerBox); }
    void setShouldNotSynthesizeInlineBlockBaseline() { m_shouldNotSynthesizeInlineBlockBaseline = true; }
    bool shouldNotSynthesizeInlineBlockBaseline() const { return m_shouldNotSynthesizeInlineBlockBaseline; }

private:
    BlockLayoutState& m_parentBlockLayoutState;
    InlineLayoutUnit m_clearGapBeforeFirstLine { 0.f };
    InlineLayoutUnit m_clearGapAfterLastLine { 0.f };
    InlineLayoutUnit m_firstLineStartTrimForInitialLetter { 0.f };
    std::optional<size_t> m_legacyClampedLineIndex { };
    std::optional<size_t> m_hyphenationLimitLines { };
    size_t m_successiveHyphenatedLineCount { 0 };
    // FIXME: This is required by the integaration codepath.
    UncheckedKeyHashMap<const ElementBox*, LayoutUnit> m_nestedListMarkerOffsets;
    AvailableLineWidthOverride m_availableLineWidthOverride;
    bool m_shouldNotSynthesizeInlineBlockBaseline { false };
    bool m_inStandardsMode { false };
};

inline InlineLayoutState::InlineLayoutState(BlockLayoutState& parentBlockLayoutState)
    : m_parentBlockLayoutState(parentBlockLayoutState)
{
}

inline void InlineLayoutState::setClearGapAfterLastLine(InlineLayoutUnit verticalGap)
{
    ASSERT(verticalGap >= 0);
    m_clearGapAfterLastLine = verticalGap;
}

}
}
