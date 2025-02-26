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

#include "LayoutUnit.h"
#include <optional>
#include <wtf/Vector.h>

namespace WebCore {
namespace Layout {

// This class overrides the total line width available for candidate content on a line.
// Note that this only impacts how much content can fit in a line, and it does not change
// the line box dimensions themselves (i.e. this won't change where text is aligned, etc).
class AvailableLineWidthOverride {
public:
    AvailableLineWidthOverride() = default;
    AvailableLineWidthOverride(LayoutUnit globalLineWidthOverride) { m_globalLineWidthOverride = globalLineWidthOverride; }
    AvailableLineWidthOverride(Vector<LayoutUnit> individualLineWidthOverrides) { m_individualLineWidthOverrides = individualLineWidthOverrides; }
    std::optional<LayoutUnit> availableLineWidthOverrideForLine(size_t lineIndex) const
    {
        if (m_globalLineWidthOverride)
            return m_globalLineWidthOverride;
        if (m_individualLineWidthOverrides && lineIndex < m_individualLineWidthOverrides->size())
            return m_individualLineWidthOverrides.value()[lineIndex];
        return { };
    }

private:
    // Logical width constraint applied to all lines
    // Takes precedence over individual width overrides
    std::optional<LayoutUnit> m_globalLineWidthOverride;

    // Logical width constraints applied separately for each line
    std::optional<Vector<LayoutUnit>> m_individualLineWidthOverrides;
};

}
}
