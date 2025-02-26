/*
 * Copyright (C) 1999 Lars Knoll (knoll@kde.org)
 *           (C) 1999 Antti Koivisto (koivisto@kde.org)
 * Copyright (C) 2003-2024 Apple Inc. All rights reserved.
 * Copyright (C) 2010-2018 Google Inc. All rights reserved.
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Library General Public License
 * along with this library; see the file COPYING.LIB.  If not, write to
 * the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 * Boston, MA 02110-1301, USA.
 *
 */

#pragma once

#include "FontBaseline.h"
#include "LayoutRect.h"
#include "RectEdges.h"
#include "RenderLayerModelObject.h"

namespace WebCore {

// Modes for some of the line-related functions.
enum LinePositionMode { PositionOnContainingLine, PositionOfInteriorLineBoxes };
enum LineDirectionMode { HorizontalLine, VerticalLine };

enum class BleedAvoidance : uint8_t {
    None,
    ShrinkBackground,
    UseTransparencyLayer,
    BackgroundOverBorder
};

enum class ContentChangeType : uint8_t {
    Image,
    MaskImage,
    BackgroundIImage,
    Canvas,
    CanvasPixels,
    Video,
    FullScreen,
    Model
};

class BorderEdge;
class BorderShape;
class ImageBuffer;
class RenderTextFragment;
class StickyPositionViewportConstraints;
class TransformationMatrix;

namespace InlineIterator {
class InlineBoxIterator;
};

enum class BoxSideFlag : uint8_t;
using BoxSideSet = OptionSet<BoxSideFlag>;
using BorderEdges = RectEdges<BorderEdge>;

// This class is the base for all objects that adhere to the CSS box model as described
// at http://www.w3.org/TR/CSS21/box.html

class RenderBoxModelObject : public RenderLayerModelObject {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(RenderBoxModelObject);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(RenderBoxModelObject);
public:
    virtual ~RenderBoxModelObject();
    
    LayoutSize relativePositionOffset() const;
    inline LayoutSize relativePositionLogicalOffset() const;

    FloatRect constrainingRectForStickyPosition() const;
    std::pair<const RenderBox&, const RenderLayer*> enclosingClippingBoxForStickyPosition() const;
    void computeStickyPositionConstraints(StickyPositionViewportConstraints&, const FloatRect& constrainingRect) const;
    LayoutSize stickyPositionOffset() const;
    inline LayoutSize stickyPositionLogicalOffset() const;

    LayoutSize offsetForInFlowPosition() const;

    // IE extensions. Used to calculate offsetWidth/Height.  Overridden by inlines (RenderFlow)
    // to return the remaining width on a given line (and the height of a single line).
    virtual LayoutUnit offsetLeft() const;
    virtual LayoutUnit offsetTop() const;
    virtual LayoutUnit offsetWidth() const = 0;
    virtual LayoutUnit offsetHeight() const = 0;

    void updateFromStyle() override;

    bool requiresLayer() const override;

    // This will work on inlines to return the bounding box of all of the lines' border boxes.
    virtual LayoutRect borderBoundingBox() const = 0;

    // These return the CSS computed padding values.
    inline LayoutUnit computedCSSPaddingTop() const;
    inline LayoutUnit computedCSSPaddingBottom() const;
    inline LayoutUnit computedCSSPaddingLeft() const;
    inline LayoutUnit computedCSSPaddingRight() const;
    inline LayoutUnit computedCSSPaddingBefore() const;
    inline LayoutUnit computedCSSPaddingAfter() const;
    inline LayoutUnit computedCSSPaddingStart() const;
    inline LayoutUnit computedCSSPaddingEnd() const;

    // These functions are used during layout. Table cells and the MathML
    // code override them to include some extra intrinsic padding.
    virtual inline RectEdges<LayoutUnit> padding() const;
    virtual inline LayoutUnit paddingTop() const;
    virtual inline LayoutUnit paddingBottom() const;
    virtual inline LayoutUnit paddingLeft() const;
    virtual inline LayoutUnit paddingRight() const;
    virtual inline LayoutUnit paddingBefore() const;
    virtual inline LayoutUnit paddingAfter() const;
    virtual inline LayoutUnit paddingStart() const;
    virtual inline LayoutUnit paddingEnd() const;

    virtual inline RectEdges<LayoutUnit> borderWidths() const;
    virtual inline LayoutUnit borderTop() const;
    virtual inline LayoutUnit borderBottom() const;
    virtual inline LayoutUnit borderLeft() const;
    virtual inline LayoutUnit borderRight() const;

    virtual inline LayoutUnit horizontalBorderExtent() const;
    virtual inline LayoutUnit verticalBorderExtent() const;

    virtual inline LayoutUnit borderBefore() const;
    virtual inline LayoutUnit borderAfter() const;
    virtual inline LayoutUnit borderStart() const;
    virtual inline LayoutUnit borderEnd() const;

    inline LayoutUnit borderAndPaddingStart() const;
    inline LayoutUnit borderAndPaddingEnd() const;
    inline LayoutUnit borderAndPaddingBefore() const;
    inline LayoutUnit borderAndPaddingAfter() const;

    inline LayoutUnit marginAndBorderAndPaddingStart() const;
    inline LayoutUnit marginAndBorderAndPaddingEnd() const;
    inline LayoutUnit marginAndBorderAndPaddingBefore() const;
    inline LayoutUnit marginAndBorderAndPaddingAfter() const;

    inline LayoutUnit verticalBorderAndPaddingExtent() const;
    inline LayoutUnit horizontalBorderAndPaddingExtent() const;
    inline LayoutUnit borderAndPaddingLogicalHeight() const;
    inline LayoutUnit borderAndPaddingLogicalWidth() const;
    inline LayoutUnit borderAndPaddingLogicalLeft() const;
    inline LayoutUnit borderAndPaddingLogicalRight() const;

    inline LayoutUnit borderLogicalLeft() const;
    inline LayoutUnit borderLogicalRight() const;
    inline LayoutUnit borderLogicalWidth() const;
    inline LayoutUnit borderLogicalHeight() const;

    inline LayoutUnit paddingLogicalLeft() const;
    inline LayoutUnit paddingLogicalRight() const;
    inline LayoutUnit paddingLogicalWidth() const;
    inline LayoutUnit paddingLogicalHeight() const;

    virtual LayoutUnit marginTop() const = 0;
    virtual LayoutUnit marginBottom() const = 0;
    virtual LayoutUnit marginLeft() const = 0;
    virtual LayoutUnit marginRight() const = 0;
    virtual LayoutUnit marginBefore(const WritingMode) const = 0;
    virtual LayoutUnit marginAfter(const WritingMode) const = 0;
    virtual LayoutUnit marginStart(const WritingMode) const = 0;
    virtual LayoutUnit marginEnd(const WritingMode) const = 0;
    LayoutUnit marginBefore() const { return marginBefore(writingMode()); }
    LayoutUnit marginAfter() const { return marginAfter(writingMode()); }
    LayoutUnit marginStart() const { return marginStart(writingMode()); }
    LayoutUnit marginEnd() const { return marginEnd(writingMode()); }
    LayoutUnit verticalMarginExtent() const { return marginTop() + marginBottom(); }
    LayoutUnit horizontalMarginExtent() const { return marginLeft() + marginRight(); }
    LayoutUnit marginLogicalHeight() const { return marginBefore() + marginAfter(); }
    LayoutUnit marginLogicalWidth() const { return marginStart() + marginEnd(); }

    BorderShape borderShapeForContentClipping(const LayoutRect& borderBoxRect, bool includeLeftEdge = true, bool includeRightEdge = true) const;

    inline bool hasInlineDirectionBordersPaddingOrMargin() const;
    inline bool hasInlineDirectionBordersOrPadding() const;

    virtual LayoutUnit containingBlockLogicalWidthForContent() const;

    // Overridden by subclasses to determine line height and baseline position.
    virtual LayoutUnit lineHeight(bool firstLine, LineDirectionMode, LinePositionMode = PositionOnContainingLine) const = 0;
    virtual LayoutUnit baselinePosition(FontBaseline, bool firstLine, LineDirectionMode, LinePositionMode = PositionOnContainingLine) const = 0;

    void mapAbsoluteToLocalPoint(OptionSet<MapCoordinatesMode>, TransformState&) const override;

    void setSelectionState(HighlightState) override;

    bool canHaveBoxInfoInFragment() const { return !isFloating() && !isReplacedOrInlineBlock() && !isInline() && !isRenderTableCell() && isRenderBlock() && !isRenderSVGBlock(); }

    void contentChanged(ContentChangeType);
    bool hasAcceleratedCompositing() const;

    RenderBoxModelObject* continuation() const;
    WEBCORE_EXPORT RenderInline* inlineContinuation() const;

    static void forRendererAndContinuations(RenderBoxModelObject&, const std::function<void(RenderBoxModelObject&)>&);

    void insertIntoContinuationChainAfter(RenderBoxModelObject&);
    void removeFromContinuationChain();

    bool hasRunningAcceleratedAnimations() const;

    void applyTransform(TransformationMatrix&, const RenderStyle&, const FloatRect& boundingBox, OptionSet<RenderStyle::TransformOperationOption>) const override;

protected:
    RenderBoxModelObject(Type, Element&, RenderStyle&&, OptionSet<TypeFlag>, TypeSpecificFlags);
    RenderBoxModelObject(Type, Document&, RenderStyle&&, OptionSet<TypeFlag>, TypeSpecificFlags);

    void willBeDestroyed() override;

    void styleWillChange(StyleDifference, const RenderStyle& newStyle) override;

    LayoutPoint adjustedPositionRelativeToOffsetParent(const LayoutPoint&) const;

    bool hasVisibleBoxDecorationStyle() const;
    bool borderObscuresBackgroundEdge(const FloatSize& contextScale) const;
    bool borderObscuresBackground() const;

public:
    bool fixedBackgroundPaintsInLocalCoordinates() const;
    InterpolationQuality chooseInterpolationQuality(GraphicsContext&, Image&, const void*, const LayoutSize&) const;
    DecodingMode decodingModeForImageDraw(const Image&, const PaintInfo&) const;

    void paintMaskForTextFillBox(GraphicsContext&, const FloatRect&, const InlineIterator::InlineBoxIterator&, const LayoutRect&);

    // For RenderBlocks and RenderInlines with m_style->pseudoElementType() == PseudoId::FirstLetter, this tracks their remaining text fragments
    RenderTextFragment* firstLetterRemainingText() const;
    void setFirstLetterRemainingText(RenderTextFragment&);
    void clearFirstLetterRemainingText();

    enum class ScaleByUsedZoom : bool { No, Yes };
    LayoutSize calculateImageIntrinsicDimensions(StyleImage*, const LayoutSize& scaledPositioningAreaSize, ScaleByUsedZoom) const;

    RenderBlock* containingBlockForAutoHeightDetection(Length logicalHeight) const;

    struct ContinuationChainNode {
        WTF_MAKE_STRUCT_FAST_ALLOCATED;

        SingleThreadWeakPtr<RenderBoxModelObject> renderer;
        ContinuationChainNode* previous { nullptr };
        ContinuationChainNode* next { nullptr };

        ContinuationChainNode(RenderBoxModelObject&);
        ~ContinuationChainNode();

        void insertAfter(ContinuationChainNode&);
    };

    ContinuationChainNode* continuationChainNode() const;

protected:
    LayoutUnit resolveLengthPercentageUsingContainerLogicalWidth(const Length&) const;
    virtual void absoluteQuadsIgnoringContinuation(const FloatRect&, Vector<FloatQuad>&, bool* /*wasFixed*/) const { ASSERT_NOT_REACHED(); }
    void collectAbsoluteQuadsForContinuation(Vector<FloatQuad>& quads, bool* wasFixed) const;

private:
    ContinuationChainNode& ensureContinuationChainNode();
    
    virtual LayoutRect frameRectForStickyPositioning() const = 0;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_RENDER_OBJECT(RenderBoxModelObject, isRenderBoxModelObject())
