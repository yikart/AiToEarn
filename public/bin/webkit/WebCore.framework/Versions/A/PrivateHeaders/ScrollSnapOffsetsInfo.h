/*
 * Copyright (C) 2016 Apple Inc. All rights reserved.
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

#include "ElementIdentifier.h"
#include "FloatRect.h"
#include "LayoutRect.h"
#include "LayoutUnit.h"
#include "ScrollTypes.h"
#include "StyleScrollSnapPoints.h"
#include <utility>
#include <wtf/Vector.h>

namespace WebCore {

class ScrollableArea;
class RenderBox;
class RenderStyle;
class Element;

template <typename T>
struct SnapOffset {
    T offset;
    ScrollSnapStop stop;
    bool hasSnapAreaLargerThanViewport;
    Markable<ElementIdentifier> snapTargetID;
    bool isFocused;
    Vector<size_t> snapAreaIndices;
};

template <typename UnitType, typename RectType>
struct ScrollSnapOffsetsInfo {
    WTF_MAKE_STRUCT_FAST_ALLOCATED;
    ScrollSnapStrictness strictness { ScrollSnapStrictness::None };
    Vector<SnapOffset<UnitType>> horizontalSnapOffsets;
    Vector<SnapOffset<UnitType>> verticalSnapOffsets;
    Vector<RectType> snapAreas;
    Vector<ElementIdentifier> snapAreasIDs;

    bool isEqual(const ScrollSnapOffsetsInfo<UnitType, RectType>& other) const
    {
        return strictness == other.strictness && horizontalSnapOffsets == other.horizontalSnapOffsets && verticalSnapOffsets == other.verticalSnapOffsets && snapAreas == other.snapAreas;
    }

    bool isEmpty() const
    {
        return horizontalSnapOffsets.isEmpty() && verticalSnapOffsets.isEmpty();
    }

    Vector<SnapOffset<UnitType>> offsetsForAxis(ScrollEventAxis axis) const
    {
        return axis == ScrollEventAxis::Vertical ? verticalSnapOffsets : horizontalSnapOffsets;
    }

    template<typename OutputType> OutputType convertUnits(float deviceScaleFactor = 0.0) const;
    template<typename SizeType, typename PointType>
    WEBCORE_EXPORT std::pair<UnitType, std::optional<unsigned>> closestSnapOffset(ScrollEventAxis, const SizeType& viewportSize, PointType scrollDestinationOffset, float velocity, std::optional<UnitType> originalPositionForDirectionalSnapping = std::nullopt) const;
};

template<typename UnitType> inline bool operator==(const SnapOffset<UnitType>& a, const SnapOffset<UnitType>& b)
{
    return a.offset == b.offset && a.stop == b.stop && a.snapAreaIndices == b.snapAreaIndices;
}

using LayoutScrollSnapOffsetsInfo = ScrollSnapOffsetsInfo<LayoutUnit, LayoutRect>;
using FloatScrollSnapOffsetsInfo = ScrollSnapOffsetsInfo<float, FloatRect>;
using FloatSnapOffset = SnapOffset<float>;

template <> template <>
LayoutScrollSnapOffsetsInfo FloatScrollSnapOffsetsInfo::convertUnits(float /* unusedScaleFactor */) const;
template <> template <>
WEBCORE_EXPORT std::pair<float, std::optional<unsigned>> FloatScrollSnapOffsetsInfo::closestSnapOffset(ScrollEventAxis, const FloatSize& viewportSize, FloatPoint scrollDestinationOffset, float velocity, std::optional<float> originalPositionForDirectionalSnapping) const;


template <> template <>
FloatScrollSnapOffsetsInfo LayoutScrollSnapOffsetsInfo::convertUnits(float deviceScaleFactor) const;
template <> template <>
WEBCORE_EXPORT std::pair<LayoutUnit, std::optional<unsigned>> LayoutScrollSnapOffsetsInfo::closestSnapOffset(ScrollEventAxis, const LayoutSize& viewportSize, LayoutPoint scrollDestinationOffset, float velocity, std::optional<LayoutUnit> originalPositionForDirectionalSnapping) const;

// Update the snap offsets for this scrollable area, given the RenderBox of the scroll container, the RenderStyle
// which defines the scroll-snap properties, and the viewport rectangle with the origin at the top left of
// the scrolling container's border box.
void updateSnapOffsetsForScrollableArea(ScrollableArea&, const RenderBox& scrollingElementBox, const RenderStyle& scrollingElementStyle, LayoutRect viewportRectInBorderBoxCoordinates, WritingMode, Element*);

template <typename T> WTF::TextStream& operator<<(WTF::TextStream& ts, SnapOffset<T> offset)
{
    ts << offset.offset << " snapTargetID: " <<  offset.snapTargetID << " isFocused: " << offset.isFocused;
    if (offset.stop == ScrollSnapStop::Always)
        ts << " (always)";
    return ts;
}

}; // namespace WebCore
