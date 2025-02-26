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

#include "InlineIteratorBox.h"
#include "InlineIteratorLineBox.h"
#include "RenderBlockFlow.h"

namespace WebCore {

class LineSelection {
public:
    static float logicalTop(const InlineIterator::LineBox& lineBox) { return lineBox.contentLogicalTopAdjustedForPrecedingLineBox(); }
    static float logicalBottom(const InlineIterator::LineBox& lineBox) { return lineBox.contentLogicalBottomAdjustedForFollowingLineBox(); }

    static FloatRect logicalRect(const InlineIterator::LineBox& lineBox)
    {
        return { FloatPoint { lineBox.contentLogicalLeft(), lineBox.contentLogicalTopAdjustedForPrecedingLineBox() }, FloatPoint { lineBox.contentLogicalRight(), lineBox.contentLogicalBottomAdjustedForFollowingLineBox() } };
    }

    static FloatRect physicalRect(const InlineIterator::LineBox& lineBox)
    {
        auto physicalRect = logicalRect(lineBox);
        if (!lineBox.isHorizontal())
            physicalRect = physicalRect.transposedRect();
        lineBox.formattingContextRoot().flipForWritingMode(physicalRect);
        return physicalRect;
    }

    static float logicalTopAdjustedForPrecedingBlock(const InlineIterator::LineBox& lineBox)
    {
        // FIXME: Move adjustEnclosingTopForPrecedingBlock from RenderBlockFlow to here.
        return lineBox.formattingContextRoot().adjustEnclosingTopForPrecedingBlock(LayoutUnit { lineBox.contentLogicalTopAdjustedForPrecedingLineBox() });
    }

    static RenderObject::HighlightState selectionState(const InlineIterator::LineBox& lineBox)
    {
        auto& root = lineBox.formattingContextRoot();
        if (root.selectionState() == RenderObject::HighlightState::None)
            return RenderObject::HighlightState::None;

        auto lineState = RenderObject::HighlightState::None;
        for (auto box = lineBox.firstLeafBox(); box; box.traverseNextOnLine()) {
            auto boxState = box->selectionState();
            if (lineState == RenderObject::HighlightState::None)
                lineState = boxState;
            else if (lineState == RenderObject::HighlightState::Start) {
                if (boxState == RenderObject::HighlightState::End || boxState == RenderObject::HighlightState::None)
                    lineState = RenderObject::HighlightState::Both;
            } else if (lineState == RenderObject::HighlightState::Inside) {
                if (boxState == RenderObject::HighlightState::Start || boxState == RenderObject::HighlightState::End)
                    lineState = boxState;
                else if (boxState == RenderObject::HighlightState::None)
                    lineState = RenderObject::HighlightState::End;
            } else if (lineState == RenderObject::HighlightState::End) {
                if (boxState == RenderObject::HighlightState::Start)
                    lineState = RenderObject::HighlightState::Both;
            }

            if (lineState == RenderObject::HighlightState::Both)
                break;
        }
        return lineState;
    }

};

}

