/*
 * Copyright (C) 2018 Apple Inc. All rights reserved.
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

#include "LayoutBox.h"
#include "LayoutBoxGeometry.h"
#include "LayoutPoint.h"
#include "LayoutUnits.h"
#include <wtf/TZoneMalloc.h>

namespace WebCore {

namespace Layout {

class FloatAvoider {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(FloatAvoider);
public:
    FloatAvoider(LayoutPoint absoluteTopLeft, LayoutUnit borderBoxWidth, const BoxGeometry::Edges& margin, BoxGeometry::HorizontalEdges containingBlockAbsoluteContentBox, bool isFloatingPositioned, bool isLeftAligned);
    virtual ~FloatAvoider() = default;

    void setInlineStart(LayoutUnit);
    void setBlockStart(LayoutUnit);
    void resetInlineStart() { m_absoluteTopLeft.setX(initialInlineStart()); }

    bool overflowsContainingBlock() const;

    LayoutUnit blockStart() const;
    LayoutUnit inlineStart() const;
    LayoutUnit inlineEnd() const;

    bool isStartAligned() const { return m_isStartAligned; }

private:
    LayoutUnit borderBoxWidth() const { return m_borderBoxWidth; }
    LayoutUnit initialInlineStart() const;

    LayoutUnit marginBefore() const { return m_margin.vertical.before; }
    LayoutUnit marginAfter() const { return m_margin.vertical.after; }
    LayoutUnit marginStart() const { return m_margin.horizontal.start; }
    LayoutUnit marginEnd() const { return m_margin.horizontal.end; }
    LayoutUnit marginBoxWidth() const { return marginStart() + borderBoxWidth() + marginEnd(); }

    bool isFloatingBox() const { return m_isFloatingPositioned; }

private:
    // These coordinate values are relative to the formatting root's border box.
    LayoutPoint m_absoluteTopLeft;
    // Note that float avoider should work with no height value.
    LayoutUnit m_borderBoxWidth;
    BoxGeometry::Edges m_margin;
    BoxGeometry::HorizontalEdges m_containingBlockAbsoluteContentBox;
    bool m_isFloatingPositioned { true };
    bool m_isStartAligned { true };
};

inline LayoutUnit FloatAvoider::blockStart() const
{
    auto blockStart = m_absoluteTopLeft.y();
    if (isFloatingBox())
        blockStart -= marginBefore();
    return blockStart;
}

inline LayoutUnit FloatAvoider::inlineStart() const
{
    auto inlineStart = m_absoluteTopLeft.x();
    if (isFloatingBox())
        inlineStart -= marginStart();
    return inlineStart;
}

inline LayoutUnit FloatAvoider::inlineEnd() const
{
    auto inlineEnd = inlineStart() + borderBoxWidth();
    if (isFloatingBox())
        inlineEnd += marginEnd();
    return inlineEnd;
}

}
}
