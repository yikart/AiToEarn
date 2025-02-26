/**
 * Copyright (C) 2024 Apple Inc. All rights reserved.
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

#include "RenderLayoutState.h"
#include "RenderView.h"
#include <wtf/CheckedPtr.h>

namespace WebCore {

class LineClampUpdater {
public:
    LineClampUpdater(const RenderBlockFlow& blockContainer);
    ~LineClampUpdater();

private:
    CheckedPtr<const RenderBlockFlow> m_blockContainer;
    std::optional<RenderLayoutState::LineClamp> m_previousLineClamp { };
    std::optional<RenderLayoutState::LegacyLineClamp> m_skippedLegacyLineClampToRestore { };
};

inline LineClampUpdater::LineClampUpdater(const RenderBlockFlow& blockContainer)
    : m_blockContainer(blockContainer)
{
    auto* layoutState = m_blockContainer->view().frameView().layoutContext().layoutState();
    if (!layoutState)
        return;

    m_previousLineClamp = layoutState->lineClamp();
    if (blockContainer.isFieldset()) {
        layoutState->setLineClamp({ });

        m_skippedLegacyLineClampToRestore = layoutState->legacyLineClamp();
        layoutState->setLegacyLineClamp({ });
        return;
    }

    auto maximumLinesForBlockContainer = m_blockContainer->style().maxLines();
    if (maximumLinesForBlockContainer) {
        // New, top level line clamp.
        layoutState->setLineClamp(RenderLayoutState::LineClamp { maximumLinesForBlockContainer, m_blockContainer->style().overflowContinue() == OverflowContinue::Discard });
        return;
    }

    if (m_previousLineClamp) {
        // Propagated line clamp.
        if (blockContainer.establishesIndependentFormattingContext()) {
            // Contents of descendants that establish independent formatting contexts are skipped over while counting line boxes.
            layoutState->setLineClamp({ });
            return;
        }
        auto effectiveShouldDiscard = m_previousLineClamp->shouldDiscardOverflow  || m_blockContainer->style().overflowContinue() == OverflowContinue::Discard;
        layoutState->setLineClamp(RenderLayoutState::LineClamp { m_previousLineClamp->maximumLines, effectiveShouldDiscard });
        return;
    }
}

inline LineClampUpdater::~LineClampUpdater()
{
    auto* layoutState = m_blockContainer->view().frameView().layoutContext().layoutState();
    if (!layoutState)
        return;

    if (m_skippedLegacyLineClampToRestore)
        layoutState->setLegacyLineClamp(m_skippedLegacyLineClampToRestore);

    if (!m_previousLineClamp) {
        layoutState->setLineClamp({ });
        return;
    }

    layoutState->setLineClamp(RenderLayoutState::LineClamp { m_previousLineClamp->maximumLines - (m_blockContainer->childrenInline() ? m_blockContainer->lineCount() : 0), m_previousLineClamp->shouldDiscardOverflow });
}

}
