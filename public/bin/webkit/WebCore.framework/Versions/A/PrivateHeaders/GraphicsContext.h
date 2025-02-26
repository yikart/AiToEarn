/*
 * Copyright (C) 2003-2024 Apple Inc. All rights reserved.
 * Copyright (C) 2008-2009 Torch Mobile, Inc.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "ControlPart.h"
#include "DashArray.h"
#include "DestinationColorSpace.h"
#include "DisplayListItem.h"
#include "FloatRect.h"
#include "FontCascade.h"
#include "GraphicsContextState.h"
#include "Image.h"
#include "ImageOrientation.h"
#include "ImagePaintingOptions.h"
#include "IntRect.h"
#include "Pattern.h"
#include "PlatformGraphicsContext.h"
#include "RenderingMode.h"
#include <wtf/Function.h>
#include <wtf/Noncopyable.h>
#include <wtf/OptionSet.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class AffineTransform;
class DecomposedGlyphs;
class Filter;
class FilterResults;
class FloatRoundedRect;
class Gradient;
class ImageBuffer;
class Path;
class SystemImage;
class TextRun;
class VideoFrame;

namespace DisplayList {
class DrawNativeImage;
class ResourceHeap;
}

class GraphicsContext {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(GraphicsContext, WEBCORE_EXPORT);
    WTF_MAKE_NONCOPYABLE(GraphicsContext);
    friend class BifurcatedGraphicsContext;
    friend class DisplayList::DrawNativeImage;
    friend class NativeImage;
    friend class ImageBuffer;
public:
    // Indicates if draw operations read the sources such as NativeImage backing stores immediately
    // during draw operations.
    enum class IsDeferred : bool {
        No,
        Yes
    };
    WEBCORE_EXPORT GraphicsContext(IsDeferred = IsDeferred::No, const GraphicsContextState::ChangeFlags& = { }, InterpolationQuality = InterpolationQuality::Default);
    WEBCORE_EXPORT GraphicsContext(IsDeferred, const GraphicsContextState&);
    WEBCORE_EXPORT virtual ~GraphicsContext();

    virtual bool hasPlatformContext() const { return false; }
    virtual PlatformGraphicsContext* platformContext() const { return nullptr; }

    virtual const DestinationColorSpace& colorSpace() const { return DestinationColorSpace::SRGB(); }

    virtual bool paintingDisabled() const { return false; }
    virtual bool performingPaintInvalidation() const { return false; }
    virtual bool invalidatingControlTints() const { return false; }
    virtual bool invalidatingImagesWithAsyncDecodes() const { return false; }
    virtual bool detectingContentfulPaint() const { return false; }

    // Context State

    const SourceBrush& fillBrush() const { return m_state.fillBrush(); }
    const Color& fillColor() const { return fillBrush().color(); }
    Gradient* fillGradient() const { return fillBrush().gradient(); }
    const AffineTransform& fillGradientSpaceTransform() const { return fillBrush().gradientSpaceTransform(); }
    Pattern* fillPattern() const { return fillBrush().pattern(); }
    void setFillBrush(const SourceBrush& brush) { m_state.setFillBrush(brush); didUpdateSingleState(m_state, GraphicsContextState::toIndex(GraphicsContextState::Change::FillBrush)); }
    void setFillColor(const Color& color) { m_state.setFillColor(color); didUpdateSingleState(m_state, GraphicsContextState::toIndex(GraphicsContextState::Change::FillBrush)); }
    void setFillGradient(Ref<Gradient>&& gradient, const AffineTransform& spaceTransform = { }) { m_state.setFillGradient(WTFMove(gradient), spaceTransform); didUpdateSingleState(m_state, GraphicsContextState::toIndex(GraphicsContextState::Change::FillBrush)); }
    void setFillPattern(Ref<Pattern>&& pattern) { m_state.setFillPattern(WTFMove(pattern)); didUpdateSingleState(m_state, GraphicsContextState::toIndex(GraphicsContextState::Change::FillBrush)); }

    WindRule fillRule() const { return m_state.fillRule(); }
    void setFillRule(WindRule fillRule) { m_state.setFillRule(fillRule); didUpdateSingleState(m_state, GraphicsContextState::toIndex(GraphicsContextState::Change::FillRule)); }

    const SourceBrush& strokeBrush() const { return m_state.strokeBrush(); }
    const Color& strokeColor() const { return strokeBrush().color(); }
    Gradient* strokeGradient() const { return strokeBrush().gradient(); }
    const AffineTransform& strokeGradientSpaceTransform() const { return strokeBrush().gradientSpaceTransform(); }
    Pattern* strokePattern() const { return strokeBrush().pattern(); }
    void setStrokeBrush(const SourceBrush& brush) { m_state.setStrokeBrush(brush); didUpdateSingleState(m_state, GraphicsContextState::toIndex(GraphicsContextState::Change::StrokeBrush)); }
    void setStrokeColor(const Color& color) { m_state.setStrokeColor(color); didUpdateSingleState(m_state, GraphicsContextState::toIndex(GraphicsContextState::Change::StrokeBrush)); }
    void setStrokeGradient(Ref<Gradient>&& gradient, const AffineTransform& spaceTransform = { }) { m_state.setStrokeGradient(WTFMove(gradient), spaceTransform); didUpdateSingleState(m_state, GraphicsContextState::toIndex(GraphicsContextState::Change::StrokeBrush)); }
    void setStrokePattern(Ref<Pattern>&& pattern) { m_state.setStrokePattern(WTFMove(pattern)); didUpdateSingleState(m_state, GraphicsContextState::toIndex(GraphicsContextState::Change::StrokeBrush)); }

    float strokeThickness() const { return m_state.strokeThickness(); }
    void setStrokeThickness(float thickness) { m_state.setStrokeThickness(thickness); didUpdateSingleState(m_state, GraphicsContextState::toIndex(GraphicsContextState::Change::StrokeThickness)); }

    StrokeStyle strokeStyle() const { return m_state.strokeStyle(); }
    void setStrokeStyle(StrokeStyle style) { m_state.setStrokeStyle(style); didUpdateSingleState(m_state, GraphicsContextState::toIndex(GraphicsContextState::Change::StrokeStyle)); }

    std::optional<GraphicsDropShadow> dropShadow() const { return m_state.dropShadow(); }
    void setDropShadow(const GraphicsDropShadow& dropShadow) { m_state.setDropShadow(dropShadow); didUpdateSingleState(m_state, GraphicsContextState::toIndex(GraphicsContextState::Change::DropShadow)); }
    void clearDropShadow() { m_state.setDropShadow(std::nullopt); didUpdateSingleState(m_state, GraphicsContextState::toIndex(GraphicsContextState::Change::DropShadow)); }
    bool hasBlurredDropShadow() const { return dropShadow() && dropShadow()->isBlurred(); }
    bool hasDropShadow() const { return dropShadow() && dropShadow()->hasOutsets(); }

    std::optional<GraphicsStyle> style() const { return m_state.style(); }
    void setStyle(const std::optional<GraphicsStyle>& style) { m_state.setStyle(style); didUpdateSingleState(m_state, GraphicsContextState::toIndex(GraphicsContextState::Change::Style)); }

    CompositeMode compositeMode() const { return m_state.compositeMode(); }
    CompositeOperator compositeOperation() const { return compositeMode().operation; }
    BlendMode blendMode() const { return compositeMode().blendMode; }
    void setCompositeMode(CompositeMode compositeMode) { m_state.setCompositeMode(compositeMode); didUpdateSingleState(m_state, GraphicsContextState::toIndex(GraphicsContextState::Change::CompositeMode)); }
    void setCompositeOperation(CompositeOperator operation, BlendMode blendMode = BlendMode::Normal) { setCompositeMode({ operation, blendMode }); }

    float alpha() const { return m_state.alpha(); }
    void setAlpha(float alpha) { m_state.setAlpha(alpha); didUpdateSingleState(m_state, GraphicsContextState::toIndex(GraphicsContextState::Change::Alpha)); }

    TextDrawingModeFlags textDrawingMode() const { return m_state.textDrawingMode(); }
    void setTextDrawingMode(TextDrawingModeFlags textDrawingMode) { m_state.setTextDrawingMode(textDrawingMode); didUpdateSingleState(m_state, GraphicsContextState::toIndex(GraphicsContextState::Change::TextDrawingMode)); }

    InterpolationQuality imageInterpolationQuality() const { return m_state.imageInterpolationQuality(); }
    void setImageInterpolationQuality(InterpolationQuality imageInterpolationQuality) { m_state.setImageInterpolationQuality(imageInterpolationQuality); didUpdateSingleState(m_state, GraphicsContextState::toIndex(GraphicsContextState::Change::ImageInterpolationQuality)); }

    bool shouldAntialias() const { return m_state.shouldAntialias(); }
    void setShouldAntialias(bool shouldAntialias) { m_state.setShouldAntialias(shouldAntialias); didUpdateSingleState(m_state, GraphicsContextState::toIndex(GraphicsContextState::Change::ShouldAntialias)); }

    bool shouldSmoothFonts() const { return m_state.shouldSmoothFonts(); }
    void setShouldSmoothFonts(bool shouldSmoothFonts) { m_state.setShouldSmoothFonts(shouldSmoothFonts); didUpdateSingleState(m_state, GraphicsContextState::toIndex(GraphicsContextState::Change::ShouldSmoothFonts)); }

    // Normally CG enables subpixel-quantization because it improves the performance of aligning glyphs.
    // In some cases we have to disable to to ensure a high-quality output of the glyphs.
    bool shouldSubpixelQuantizeFonts() const { return m_state.shouldSubpixelQuantizeFonts(); }
    void setShouldSubpixelQuantizeFonts(bool shouldSubpixelQuantizeFonts) { m_state.setShouldSubpixelQuantizeFonts(shouldSubpixelQuantizeFonts); didUpdateSingleState(m_state, GraphicsContextState::toIndex(GraphicsContextState::Change::ShouldSubpixelQuantizeFonts)); }

    bool shadowsIgnoreTransforms() const { return m_state.shadowsIgnoreTransforms(); }
    void setShadowsIgnoreTransforms(bool shadowsIgnoreTransforms) { m_state.setShadowsIgnoreTransforms(shadowsIgnoreTransforms); didUpdateSingleState(m_state, GraphicsContextState::toIndex(GraphicsContextState::Change::ShadowsIgnoreTransforms)); }
    FloatSize platformShadowOffset(const FloatSize&) const;

    bool drawLuminanceMask() const { return m_state.drawLuminanceMask(); }
    void setDrawLuminanceMask(bool drawLuminanceMask) { m_state.setDrawLuminanceMask(drawLuminanceMask); didUpdateSingleState(m_state, GraphicsContextState::toIndex(GraphicsContextState::Change::DrawLuminanceMask)); }

    bool useDarkAppearance() const { return m_state.useDarkAppearance(); }
    void setUseDarkAppearance(bool useDarkAppearance) { m_state.setUseDarkAppearance(useDarkAppearance); didUpdateSingleState(m_state, GraphicsContextState::toIndex(GraphicsContextState::Change::UseDarkAppearance)); }

    virtual const GraphicsContextState& state() const { return m_state; }
    void mergeLastChanges(const GraphicsContextState&, const std::optional<GraphicsContextState>& lastDrawingState = std::nullopt);
    void mergeAllChanges(const GraphicsContextState&);

    // Called *after* any change to GraphicsContextState; generally used to propagate changes
    // to the platform context's state.
    virtual void didUpdateState(GraphicsContextState&) = 0;
    virtual void didUpdateSingleState(GraphicsContextState& state, GraphicsContextState::ChangeIndex) { didUpdateState(state); }

    WEBCORE_EXPORT virtual void save(GraphicsContextState::Purpose = GraphicsContextState::Purpose::SaveRestore);
    WEBCORE_EXPORT virtual void restore(GraphicsContextState::Purpose = GraphicsContextState::Purpose::SaveRestore);

    void unwindStateStack(unsigned count);
    void unwindStateStack() { unwindStateStack(stackSize()); }

    unsigned stackSize() const { return m_stack.size(); }

#if USE(CG)
    // FIXME: Should these really be public GraphicsContext methods?
    virtual void applyStrokePattern() = 0;
    virtual void applyFillPattern() = 0;

    // FIXME: Can we make this a why instead of a what, and then have it exist cross-platform?
    virtual bool isCALayerContext() const = 0;
#endif

    virtual RenderingMode renderingMode() const { return RenderingMode::Unaccelerated; }

    // Pixel Snapping

    WEBCORE_EXPORT static void adjustLineToPixelBoundaries(FloatPoint& p1, FloatPoint& p2, float strokeWidth, StrokeStyle);

    // Shapes

    // These draw methods will do both stroking and filling.
    // FIXME: ...except drawRect(), which fills properly but always strokes
    // using a 1-pixel stroke inset from the rect borders (of the correct
    // stroke color).
    virtual void drawRect(const FloatRect&, float borderThickness = 1) = 0;
    virtual void drawLine(const FloatPoint&, const FloatPoint&) = 0;

    virtual void drawEllipse(const FloatRect&) = 0;
    WEBCORE_EXPORT virtual void drawRaisedEllipse(const FloatRect&, const Color& ellipseColor, const Color& shadowColor);

    virtual void fillPath(const Path&) = 0;
    virtual void strokePath(const Path&) = 0;
    WEBCORE_EXPORT virtual void drawPath(const Path&);

    virtual void fillEllipse(const FloatRect& ellipse) { fillEllipseAsPath(ellipse); }
    virtual void strokeEllipse(const FloatRect& ellipse) { strokeEllipseAsPath(ellipse); }

    enum class RequiresClipToRect : bool { No, Yes };
    virtual void fillRect(const FloatRect&, RequiresClipToRect = RequiresClipToRect::Yes) = 0;
    virtual void fillRect(const FloatRect&, const Color&) = 0;
    virtual void fillRect(const FloatRect&, Gradient&, const AffineTransform&, RequiresClipToRect = RequiresClipToRect::Yes) = 0;
    WEBCORE_EXPORT virtual void fillRect(const FloatRect&, Gradient&);
    WEBCORE_EXPORT virtual void fillRect(const FloatRect&, const Color&, CompositeOperator, BlendMode = BlendMode::Normal);
    virtual void fillRoundedRectImpl(const FloatRoundedRect&, const Color&) = 0;
    WEBCORE_EXPORT virtual void fillRoundedRect(const FloatRoundedRect&, const Color&, BlendMode = BlendMode::Normal);
    WEBCORE_EXPORT virtual void fillRectWithRoundedHole(const FloatRect&, const FloatRoundedRect& roundedHoleRect, const Color&);

    virtual void clearRect(const FloatRect&) = 0;

    virtual void strokeRect(const FloatRect&, float lineWidth) = 0;

    virtual void setLineCap(LineCap) = 0;
    virtual void setLineDash(const DashArray&, float dashOffset) = 0;
    virtual void setLineJoin(LineJoin) = 0;
    virtual void setMiterLimit(float) = 0;

    // Images, Patterns, ControlParts, and Media

    IntSize compatibleImageBufferSize(const FloatSize&) const;

    WEBCORE_EXPORT virtual RefPtr<ImageBuffer> createImageBuffer(const FloatSize&, float resolutionScale = 1, const DestinationColorSpace& = DestinationColorSpace::SRGB(), std::optional<RenderingMode> = std::nullopt, std::optional<RenderingMethod> = std::nullopt) const;

    WEBCORE_EXPORT RefPtr<ImageBuffer> createScaledImageBuffer(const FloatSize&, const FloatSize& scale = { 1, 1 }, const DestinationColorSpace& = DestinationColorSpace::SRGB(), std::optional<RenderingMode> = std::nullopt, std::optional<RenderingMethod> = std::nullopt) const;
    WEBCORE_EXPORT RefPtr<ImageBuffer> createScaledImageBuffer(const FloatRect&, const FloatSize& scale = { 1, 1 }, const DestinationColorSpace& = DestinationColorSpace::SRGB(), std::optional<RenderingMode> = std::nullopt, std::optional<RenderingMethod> = std::nullopt) const;

    WEBCORE_EXPORT virtual RefPtr<ImageBuffer> createAlignedImageBuffer(const FloatSize&, const DestinationColorSpace& = DestinationColorSpace::SRGB(), std::optional<RenderingMethod> = std::nullopt) const;
    WEBCORE_EXPORT virtual RefPtr<ImageBuffer> createAlignedImageBuffer(const FloatRect&, const DestinationColorSpace& = DestinationColorSpace::SRGB(), std::optional<RenderingMethod> = std::nullopt) const;

    WEBCORE_EXPORT void drawNativeImage(NativeImage&, const FloatRect& destRect, const FloatRect& srcRect, ImagePaintingOptions = { });

    WEBCORE_EXPORT virtual void drawSystemImage(SystemImage&, const FloatRect&);

    WEBCORE_EXPORT ImageDrawResult drawImage(Image&, const FloatPoint& destination, ImagePaintingOptions = { ImageOrientation::Orientation::FromImage });
    WEBCORE_EXPORT ImageDrawResult drawImage(Image&, const FloatRect& destination, ImagePaintingOptions = { ImageOrientation::Orientation::FromImage });
    WEBCORE_EXPORT virtual ImageDrawResult drawImage(Image&, const FloatRect& destination, const FloatRect& source, ImagePaintingOptions = { ImageOrientation::Orientation::FromImage });

    WEBCORE_EXPORT virtual ImageDrawResult drawTiledImage(Image&, const FloatRect& destination, const FloatPoint& source, const FloatSize& tileSize, const FloatSize& spacing, ImagePaintingOptions = { });
    WEBCORE_EXPORT virtual ImageDrawResult drawTiledImage(Image&, const FloatRect& destination, const FloatRect& source, const FloatSize& tileScaleFactor, Image::TileRule, Image::TileRule, ImagePaintingOptions = { });

    WEBCORE_EXPORT void drawImageBuffer(ImageBuffer&, const FloatPoint& destination, ImagePaintingOptions = { });
    WEBCORE_EXPORT void drawImageBuffer(ImageBuffer&, const FloatRect& destination, ImagePaintingOptions = { });
    WEBCORE_EXPORT virtual void drawImageBuffer(ImageBuffer&, const FloatRect& destination, const FloatRect& source, ImagePaintingOptions = { });

    WEBCORE_EXPORT void drawConsumingImageBuffer(RefPtr<ImageBuffer>, const FloatPoint& destination, ImagePaintingOptions = { });
    WEBCORE_EXPORT void drawConsumingImageBuffer(RefPtr<ImageBuffer>, const FloatRect& destination, ImagePaintingOptions = { });
    WEBCORE_EXPORT virtual void drawConsumingImageBuffer(RefPtr<ImageBuffer>, const FloatRect& destination, const FloatRect& source, ImagePaintingOptions = { });

    WEBCORE_EXPORT virtual void drawFilteredImageBuffer(ImageBuffer* sourceImage, const FloatRect& sourceImageRect, Filter&, FilterResults&);

#if ENABLE(MULTI_REPRESENTATION_HEIC)
    ImageDrawResult drawMultiRepresentationHEIC(Image&, const Font&, const FloatRect& destination, ImagePaintingOptions = { ImageOrientation::Orientation::FromImage });
#endif

    virtual void drawPattern(NativeImage&, const FloatRect& destRect, const FloatRect& tileRect, const AffineTransform& patternTransform, const FloatPoint& phase, const FloatSize& spacing, ImagePaintingOptions = { }) = 0;
    WEBCORE_EXPORT virtual void drawPattern(ImageBuffer&, const FloatRect& destRect, const FloatRect& tileRect, const AffineTransform& patternTransform, const FloatPoint& phase, const FloatSize& spacing, ImagePaintingOptions = { });

    WEBCORE_EXPORT virtual void drawControlPart(ControlPart&, const FloatRoundedRect& borderRect, float deviceScaleFactor, const ControlStyle&);

#if ENABLE(VIDEO)
    WEBCORE_EXPORT virtual void drawVideoFrame(VideoFrame&, const FloatRect& destination, ImageOrientation, bool shouldDiscardAlpha);
#endif

    // Clipping

    virtual void resetClip() = 0;
    virtual void clip(const FloatRect&) = 0;
    WEBCORE_EXPORT virtual void clipRoundedRect(const FloatRoundedRect&);

    virtual void clipOut(const FloatRect&) = 0;
    virtual void clipOut(const Path&) = 0;
    WEBCORE_EXPORT virtual void clipOutRoundedRect(const FloatRoundedRect&);
    virtual void clipPath(const Path&, WindRule = WindRule::EvenOdd) = 0;
    WEBCORE_EXPORT virtual void clipToImageBuffer(ImageBuffer&, const FloatRect&) = 0;
    WEBCORE_EXPORT virtual IntRect clipBounds() const;

    // Text

    WEBCORE_EXPORT virtual FloatSize drawText(const FontCascade&, const TextRun&, const FloatPoint&, unsigned from = 0, std::optional<unsigned> to = std::nullopt);
    WEBCORE_EXPORT virtual void drawEmphasisMarks(const FontCascade&, const TextRun&, const AtomString& mark, const FloatPoint&, unsigned from = 0, std::optional<unsigned> to = std::nullopt);
    WEBCORE_EXPORT virtual void drawBidiText(const FontCascade&, const TextRun&, const FloatPoint&, FontCascade::CustomFontNotReadyAction = FontCascade::CustomFontNotReadyAction::DoNotPaintIfFontNotReady);

    virtual void drawGlyphsAndCacheResources(const Font& font, const GlyphBufferGlyph* glyphs, const GlyphBufferAdvance* advances, unsigned numGlyphs, const FloatPoint& point, FontSmoothingMode fontSmoothingMode)
    {
        drawGlyphs(font, glyphs, advances, numGlyphs, point, fontSmoothingMode);
    }

    WEBCORE_EXPORT virtual void drawGlyphs(const Font&, const GlyphBufferGlyph*, const GlyphBufferAdvance*, unsigned numGlyphs, const FloatPoint&, FontSmoothingMode);
    WEBCORE_EXPORT virtual void drawDecomposedGlyphs(const Font&, const DecomposedGlyphs&);

    WEBCORE_EXPORT FloatRect computeUnderlineBoundsForText(const FloatRect&, bool printing);
    WEBCORE_EXPORT void drawLineForText(const FloatRect&, bool printing, bool doubleLines = false, StrokeStyle = StrokeStyle::SolidStroke);
    virtual void drawLinesForText(const FloatPoint&, float thickness, const DashArray& widths, bool printing, bool doubleLines = false, StrokeStyle = StrokeStyle::SolidStroke) = 0;
    virtual void drawDotsForDocumentMarker(const FloatRect&, DocumentMarkerLineStyle) = 0;

    // DisplayList
    WEBCORE_EXPORT virtual void drawDisplayListItems(const Vector<DisplayList::Item>&, const DisplayList::ResourceHeap&, ControlFactory&, const FloatPoint& destination);

    // Transparency Layers

    WEBCORE_EXPORT virtual void beginTransparencyLayer(float opacity);
    WEBCORE_EXPORT virtual void beginTransparencyLayer(CompositeOperator, BlendMode = BlendMode::Normal);
    WEBCORE_EXPORT virtual void endTransparencyLayer();
    bool isInTransparencyLayer() const { return (m_transparencyLayerCount > 0); }

    // Focus Rings

    virtual void drawFocusRing(const Path&, float outlineWidth, const Color&) = 0;
    virtual void drawFocusRing(const Vector<FloatRect>&, float outlineOffset, float outlineWidth, const Color&) = 0;

    // Transforms

    void scale(float s) { scale({ s, s }); }
    virtual void scale(const FloatSize&) = 0;
    virtual void rotate(float angleInRadians) = 0;
    void translate(const FloatSize& size) { translate(size.width(), size.height()); }
    void translate(const FloatPoint& p) { translate(p.x(), p.y()); }
    virtual void translate(float x, float y) = 0;

    virtual void concatCTM(const AffineTransform&) = 0;
    virtual void setCTM(const AffineTransform&) = 0;

    enum IncludeDeviceScale { DefinitelyIncludeDeviceScale, PossiblyIncludeDeviceScale };
    virtual AffineTransform getCTM(IncludeDeviceScale = PossiblyIncludeDeviceScale) const = 0;

    // This function applies the device scale factor to the context, making the context capable of
    // acting as a base-level context for a HiDPI environment.
    virtual void applyDeviceScaleFactor(float factor) { scale(factor); }
    WEBCORE_EXPORT FloatSize scaleFactor() const;
    WEBCORE_EXPORT FloatSize scaleFactorForDrawing(const FloatRect& destRect, const FloatRect& srcRect) const;

    // PDF, printing and snapshotting
    virtual void beginPage(const IntSize&) { }
    virtual void endPage() { }

    // Links

    virtual void setURLForRect(const URL&, const FloatRect&) { }

    virtual void setDestinationForRect(const String&, const FloatRect&) { }
    virtual void addDestinationAtPoint(const String&, const FloatPoint&) { }

    virtual bool supportsInternalLinks() const { return false; }

    // Contentful Paint Detection

    void setContentfulPaintDetected() { m_contentfulPaintDetected = true; }
    bool contentfulPaintDetected() const { return m_contentfulPaintDetected; }

    // FIXME: Nothing in this section belongs here, and should be moved elsewhere.
#if OS(WINDOWS)
    HDC getWindowsContext(const IntRect&, bool supportAlphaBlend); // The passed in rect is used to create a bitmap for compositing inside transparency layers.
    void releaseWindowsContext(HDC, const IntRect&, bool supportAlphaBlend); // The passed in HDC should be the one handed back by getWindowsContext.
#endif

private:
    virtual void drawNativeImageInternal(NativeImage&, const FloatRect& destRect, const FloatRect& srcRect, ImagePaintingOptions = { }) = 0;

protected:
    WEBCORE_EXPORT RefPtr<NativeImage> nativeImageForDrawing(ImageBuffer&);
    WEBCORE_EXPORT void fillEllipseAsPath(const FloatRect&);
    WEBCORE_EXPORT void strokeEllipseAsPath(const FloatRect&);

    FloatRect computeLineBoundsAndAntialiasingModeForText(const FloatRect&, bool printing, Color&);

    float dashedLineCornerWidthForStrokeWidth(float) const;
    float dashedLinePatternWidthForStrokeWidth(float) const;
    float dashedLinePatternOffsetForPatternAndStrokeWidth(float patternWidth, float strokeWidth) const;
    Vector<FloatPoint> centerLineAndCutOffCorners(bool isVerticalLine, float cornerWidth, FloatPoint point1, FloatPoint point2) const;

    GraphicsContextState m_state;
private:
    Vector<GraphicsContextState, 1> m_stack;

    unsigned m_transparencyLayerCount { 0 };
    const IsDeferred m_isDeferred : 1; // NOLINT
    bool m_contentfulPaintDetected : 1 { false };
};

} // namespace WebCore

#include "GraphicsContextStateSaver.h"
