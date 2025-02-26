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

#include "FormattingContext.h"
#include "LayoutElementBox.h"
#include "PlacedFloats.h"
#include <wtf/TZoneMalloc.h>

namespace WebCore {
namespace Layout {

class FloatAvoider;
class Box;

// FloatingContext is responsible for adjusting the position of a box in the current formatting context
// by taking the floating boxes into account.
// Note that a FloatingContext's inline direction always matches the root's inline direction but it may
// not match the PlacedFloats's inline direction (i.e. PlacedFloats may be constructed by a parent BFC with mismatching inline direction).
class FloatingContext {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(FloatingContext);
public:
    FloatingContext(const ElementBox& formattingContextRoot, const LayoutState&, const PlacedFloats&);

    const PlacedFloats& placedFloats() const { return m_placedFloats; }

    LayoutPoint positionForFloat(const Box&, const BoxGeometry&, const HorizontalConstraints&) const;
    LayoutPoint positionForNonFloatingFloatAvoider(const Box&, const BoxGeometry&) const;

    struct BlockAxisPositionWithClearance {
        LayoutUnit position;
        std::optional<LayoutUnit> clearance;
    };
    std::optional<BlockAxisPositionWithClearance> blockAxisPositionWithClearance(const Box&, const BoxGeometry&) const;

    bool isEmpty() const { return m_placedFloats.list().isEmpty(); }

    struct Constraints {
        std::optional<PointInContextRoot> start;
        std::optional<PointInContextRoot> end;
    };
    enum class MayBeAboveLastFloat : bool { No, Yes };
    Constraints constraints(LayoutUnit candidateTop, LayoutUnit candidateBottom, MayBeAboveLastFloat) const;

    PlacedFloats::Item makeFloatItem(const Box& floatBox, const BoxGeometry&, std::optional<size_t> line = { }) const;

    bool isStartPositioned(const Box& floatBox) const;

private:
    bool isFloatingCandidateStartPositionedInBlockFormattingContext(const Box&) const;
    Clear clearInBlockFormattingContext(const Box&) const;

    const ElementBox& root() const { return m_formattingContextRoot; }
    // FIXME: Turn this into an actual geometry cache.
    const LayoutState& containingBlockGeometries() const { return m_layoutState; }

    void findPositionForFormattingContextRoot(FloatAvoider&, BoxGeometry::HorizontalEdges containingBlockContentBoxEdges) const;

    struct AbsoluteCoordinateValuesForFloatAvoider;
    AbsoluteCoordinateValuesForFloatAvoider absoluteCoordinates(const Box&, LayoutPoint borderBoxTopLeft) const;
    LayoutPoint mapTopLeftToBlockFormattingContextRoot(const Box&, LayoutPoint borderBoxTopLeft) const;
    Point mapPointFromFloatingContextRootToBlockFormattingContextRoot(Point) const;

    CheckedRef<const ElementBox> m_formattingContextRoot;
    const LayoutState& m_layoutState;
    const PlacedFloats& m_placedFloats;
};

}
}
