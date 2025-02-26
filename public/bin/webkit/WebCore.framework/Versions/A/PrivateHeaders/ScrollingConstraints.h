/*
 * Copyright (C) 2012 Apple Inc. All rights reserved.
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

#include "FloatRect.h"
#include "ScrollTypes.h"
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class AbsolutePositionConstraints {
    WTF_MAKE_TZONE_ALLOCATED(AbsolutePositionConstraints);
public:
    AbsolutePositionConstraints() = default;
    WEBCORE_EXPORT AbsolutePositionConstraints(const FloatSize&, const FloatPoint&);

    friend bool operator==(const AbsolutePositionConstraints&, const AbsolutePositionConstraints&) = default;

    FloatSize alignmentOffset() const { return m_alignmentOffset; }
    void setAlignmentOffset(FloatSize offset) { m_alignmentOffset = offset; }

    FloatPoint layerPositionAtLastLayout() const { return m_layerPositionAtLastLayout; }
    void setLayerPositionAtLastLayout(FloatPoint position) { m_layerPositionAtLastLayout = position; }
    
private:
    FloatSize m_alignmentOffset;
    FloatPoint m_layerPositionAtLastLayout;
};

// ViewportConstraints classes encapsulate data and logic required to reposition elements whose layout
// depends on the viewport rect (positions fixed and sticky), when scrolling and zooming.
class ViewportConstraints {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(ViewportConstraints, WEBCORE_EXPORT);
public:
    enum ConstraintType {
        FixedPositionConstraint,
        StickyPositionConstraint
    };

    enum AnchorEdgeFlags {
        AnchorEdgeLeft = 1 << 0,
        AnchorEdgeRight = 1 << 1,
        AnchorEdgeTop = 1 << 2,
        AnchorEdgeBottom = 1 << 3
    };
    typedef unsigned AnchorEdges;
    
    virtual ~ViewportConstraints() = default;
    
    virtual ConstraintType constraintType() const = 0;
    
    AnchorEdges anchorEdges() const { return m_anchorEdges; }
    bool hasAnchorEdge(AnchorEdgeFlags flag) const { return m_anchorEdges & flag; }
    void addAnchorEdge(AnchorEdgeFlags edgeFlag) { m_anchorEdges |= edgeFlag; }
    void setAnchorEdges(AnchorEdges edges) { m_anchorEdges = edges; }
    
    FloatSize alignmentOffset() const { return m_alignmentOffset; }
    void setAlignmentOffset(FloatSize offset) { m_alignmentOffset = offset; }

    friend bool operator==(const ViewportConstraints&, const ViewportConstraints&) = default;

protected:
    ViewportConstraints()
        : m_anchorEdges(0)
    { }

    ViewportConstraints(FloatSize&& alignmentOffset, AnchorEdges&& anchorEdges)
        : m_alignmentOffset(WTFMove(alignmentOffset))
        , m_anchorEdges(WTFMove(anchorEdges))
    { }

    FloatSize m_alignmentOffset;
    AnchorEdges m_anchorEdges;
};

class FixedPositionViewportConstraints : public ViewportConstraints {
public:
    FixedPositionViewportConstraints()
        : ViewportConstraints()
    { }

    FixedPositionViewportConstraints(FloatSize&& alignmentOffset, AnchorEdges&& anchorEdges, FloatRect&& viewportRectAtLastLayout, FloatPoint&& layerPositionAtLastLayout)
        : ViewportConstraints(WTFMove(alignmentOffset), WTFMove(anchorEdges))
        , m_viewportRectAtLastLayout(WTFMove(viewportRectAtLastLayout))
        , m_layerPositionAtLastLayout(WTFMove(layerPositionAtLastLayout))
    { }
    
    WEBCORE_EXPORT FloatPoint layerPositionForViewportRect(const FloatRect& viewportRect) const;

    const FloatRect& viewportRectAtLastLayout() const { return m_viewportRectAtLastLayout; }
    void setViewportRectAtLastLayout(const FloatRect& rect) { m_viewportRectAtLastLayout = rect; }

    const FloatPoint& layerPositionAtLastLayout() const { return m_layerPositionAtLastLayout; }
    void setLayerPositionAtLastLayout(FloatPoint position) { m_layerPositionAtLastLayout = position; }

    friend bool operator==(const FixedPositionViewportConstraints&, const FixedPositionViewportConstraints&) = default;

private:
    ConstraintType constraintType() const override { return FixedPositionConstraint; };

    FloatRect m_viewportRectAtLastLayout;
    FloatPoint m_layerPositionAtLastLayout;
};

class StickyPositionViewportConstraints : public ViewportConstraints {
public:
    StickyPositionViewportConstraints()
        : m_leftOffset(0)
        , m_rightOffset(0)
        , m_topOffset(0)
        , m_bottomOffset(0)
    { }

    StickyPositionViewportConstraints(FloatSize&& alignmentOffset, AnchorEdges&& anchorEdges, float leftOffset, float rightOffset, float topOffset, float bottomOffset, FloatRect&& constrainingRectAtLastLayout, FloatRect&& containingBlockRect, FloatRect&& stickyBoxRect, FloatSize&& stickyOffsetAtLastLayout, FloatPoint&& layerPositionAtLastLayout)
        : ViewportConstraints(WTFMove(alignmentOffset), WTFMove(anchorEdges))
        , m_leftOffset(leftOffset)
        , m_rightOffset(rightOffset)
        , m_topOffset(topOffset)
        , m_bottomOffset(bottomOffset)
        , m_constrainingRectAtLastLayout(WTFMove(constrainingRectAtLastLayout))
        , m_containingBlockRect(WTFMove(containingBlockRect))
        , m_stickyBoxRect(WTFMove(stickyBoxRect))
        , m_stickyOffsetAtLastLayout(WTFMove(stickyOffsetAtLastLayout))
        , m_layerPositionAtLastLayout(WTFMove(layerPositionAtLastLayout))
    { }

    FloatSize computeStickyOffset(const FloatRect& constrainingRect) const;

    const FloatSize stickyOffsetAtLastLayout() const { return m_stickyOffsetAtLastLayout; }
    void setStickyOffsetAtLastLayout(FloatSize offset) { m_stickyOffsetAtLastLayout = offset; }

    WEBCORE_EXPORT FloatPoint layerPositionForConstrainingRect(const FloatRect& constrainingRect) const;

    const FloatPoint& layerPositionAtLastLayout() const { return m_layerPositionAtLastLayout; }
    void setLayerPositionAtLastLayout(FloatPoint position) { m_layerPositionAtLastLayout = position; }

    float leftOffset() const { return m_leftOffset; }
    float rightOffset() const { return m_rightOffset; }
    float topOffset() const { return m_topOffset; }
    float bottomOffset() const { return m_bottomOffset; }

    void setLeftOffset(float offset) { m_leftOffset = offset; }
    void setRightOffset(float offset) { m_rightOffset = offset; }
    void setTopOffset(float offset) { m_topOffset = offset; }
    void setBottomOffset(float offset) { m_bottomOffset = offset; }

    // constrainingRectAtLastLayout() is the viewport rect if this sticky object sticks to the viewport, and
    // it is the overflow area's scrolled clip rect if this sticky object sticks inside an overflow area.
    FloatRect constrainingRectAtLastLayout() const { return m_constrainingRectAtLastLayout; }
    void setConstrainingRectAtLastLayout(const FloatRect& rect) { m_constrainingRectAtLastLayout = rect; }

    // containingBlockRect() is in the scrolling ancestor's coordinate space.
    FloatRect containingBlockRect() const { return m_containingBlockRect; }
    void setContainingBlockRect(const FloatRect& rect) { m_containingBlockRect = rect; }

    // stickyBoxRect() is in the scrolling ancestor's coordinate space.
    FloatRect stickyBoxRect() const { return m_stickyBoxRect; }
    void setStickyBoxRect(const FloatRect& rect) { m_stickyBoxRect = rect; }

    friend bool operator==(const StickyPositionViewportConstraints&, const StickyPositionViewportConstraints&) = default;

private:
    ConstraintType constraintType() const override { return StickyPositionConstraint; };

    float m_leftOffset;
    float m_rightOffset;
    float m_topOffset;
    float m_bottomOffset;
    FloatRect m_constrainingRectAtLastLayout;
    FloatRect m_containingBlockRect;
    FloatRect m_stickyBoxRect;
    FloatSize m_stickyOffsetAtLastLayout;
    FloatPoint m_layerPositionAtLastLayout;
};


WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, ScrollPositioningBehavior);
WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const AbsolutePositionConstraints&);
WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const FixedPositionViewportConstraints&);
WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const StickyPositionViewportConstraints&);

} // namespace WebCore
