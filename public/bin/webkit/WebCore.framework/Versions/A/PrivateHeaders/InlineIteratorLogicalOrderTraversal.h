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

#include "InlineIteratorLineBox.h"
#include "InlineIteratorTextBox.h"
#include "RenderBlockFlow.h"

namespace WebCore {
namespace InlineIterator {

struct TextLogicalOrderCacheData {
    WTF_MAKE_STRUCT_FAST_ALLOCATED;

    Vector<TextBoxIterator> boxes;
    size_t index { 0 };
};
using TextLogicalOrderCache = std::unique_ptr<TextLogicalOrderCacheData>;

std::pair<TextBoxIterator, TextLogicalOrderCache> firstTextBoxInLogicalOrderFor(const RenderText&);
TextBoxIterator nextTextBoxInLogicalOrder(const TextBoxIterator&, TextLogicalOrderCache&);

struct LineLogicalOrderCacheData {
    WTF_MAKE_STRUCT_FAST_ALLOCATED;

    LineBoxIterator lineBox;
    Vector<LeafBoxIterator> boxes;
    size_t index { 0 };
};
using LineLogicalOrderCache = std::unique_ptr<LineLogicalOrderCacheData>;

LeafBoxIterator firstLeafOnLineInLogicalOrder(const LineBoxIterator&, LineLogicalOrderCache&);
LeafBoxIterator lastLeafOnLineInLogicalOrder(const LineBoxIterator&, LineLogicalOrderCache&);
LeafBoxIterator nextLeafOnLineInLogicalOrder(const LeafBoxIterator&, LineLogicalOrderCache&);
LeafBoxIterator previousLeafOnLineInLogicalOrder(const LeafBoxIterator&, LineLogicalOrderCache&);

LeafBoxIterator firstLeafOnLineInLogicalOrderWithNode(const LineBoxIterator&, LineLogicalOrderCache&);
LeafBoxIterator lastLeafOnLineInLogicalOrderWithNode(const LineBoxIterator&, LineLogicalOrderCache&);

template<typename ReverseFunction>
Vector<LeafBoxIterator> leafBoxesInLogicalOrder(const LineBoxIterator& lineBox, ReverseFunction&& reverseFunction)
{
    Vector<LeafBoxIterator> boxes;

    unsigned char minLevel = 128;
    unsigned char maxLevel = 0;

    for (auto box = lineBox->firstLeafBox(); box; box = box.traverseNextOnLine()) {
        minLevel = std::min(minLevel, box->bidiLevel());
        maxLevel = std::max(maxLevel, box->bidiLevel());
        boxes.append(box);
    }

    if (lineBox->formattingContextRoot().style().rtlOrdering() == Order::Visual)
        return boxes;

    // Reverse of reordering of the line (L2 according to Bidi spec):
    // L2. From the highest level found in the text to the lowest odd level on each line,
    // reverse any contiguous sequence of characters that are at that level or higher.

    // Reversing the reordering of the line is only done up to the lowest odd level.
    if (!(minLevel % 2))
        ++minLevel;

    auto boxCount = boxes.size();
    for (; minLevel <= maxLevel; ++minLevel) {
        size_t boxIndex = 0;
        while (boxIndex < boxCount) {
            while (boxIndex < boxCount && boxes[boxIndex]->bidiLevel() < minLevel)
                ++boxIndex;

            auto first = boxIndex;
            while (boxIndex < boxCount && boxes[boxIndex]->bidiLevel() >= minLevel)
                ++boxIndex;

            reverseFunction(boxes.mutableSpan().subspan(first, boxIndex - first));
        }
    }

    return boxes;
}

}
}
