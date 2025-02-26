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

#include "LayoutUnit.h"

namespace WebCore {
namespace Layout {

struct ConstraintsForFlexContent {
    struct AxisGeometry {
        std::optional<LayoutUnit> minimumSize;
        std::optional<LayoutUnit> maximumSize;
        std::optional<LayoutUnit> availableSize;
        LayoutUnit startPosition;
    };
    ConstraintsForFlexContent(const AxisGeometry& mainAxis, const AxisGeometry& crossAxis, bool isSizedUnderMinMax);
    const AxisGeometry& mainAxis() const { return m_mainAxisGeometry; }
    const AxisGeometry& crossAxis() const { return m_crossAxisGeometry; }
    bool isSizedUnderMinMax() const { return m_isSizedUnderMinMax; }

private:
    AxisGeometry m_mainAxisGeometry;
    AxisGeometry m_crossAxisGeometry;
    bool m_isSizedUnderMinMax { false };
};

inline ConstraintsForFlexContent::ConstraintsForFlexContent(const AxisGeometry& mainAxis, const AxisGeometry& crossAxis, bool isSizedUnderMinMax)
    : m_mainAxisGeometry(mainAxis)
    , m_crossAxisGeometry(crossAxis)
    , m_isSizedUnderMinMax(isSizedUnderMinMax)
{
}

}
}

