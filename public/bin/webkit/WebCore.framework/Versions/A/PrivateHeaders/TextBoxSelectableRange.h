/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include <optional>

namespace WebCore {

struct TextBoxSelectableRange {
    const unsigned start;
    const unsigned length;
    const unsigned additionalLengthAtEnd { 0 };
    const bool isLineBreak { false };
    // FIXME: Consider holding onto the truncation position instead. See webkit.org/b/164999
    const std::optional<unsigned> truncation { };

    unsigned clamp(unsigned offset) const
    {
        auto clampedOffset = std::clamp(offset, start, start + length) - start;

        // FIXME: For some reason we allow the caret move to (invisible) fully truncated text. The zero test is to keep that behavior.
        if (truncation && *truncation)
            return std::min<unsigned>(clampedOffset, *truncation);

        if (clampedOffset == length)
            clampedOffset += additionalLengthAtEnd;

        return clampedOffset;
    }

    std::pair<unsigned, unsigned> clamp(unsigned startOffset, unsigned endOffset) const
    {
        return { clamp(startOffset), clamp(endOffset) };
    }

    bool intersects(unsigned startOffset, unsigned endOffset) const
    {
        return clamp(startOffset) < clamp(endOffset);
    }
};

}
