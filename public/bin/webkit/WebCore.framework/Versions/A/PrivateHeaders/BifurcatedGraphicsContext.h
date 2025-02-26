/*
 * Copyright (C) 2021-2024 Apple Inc. All rights reserved.
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

#include "GraphicsContext.h"
#include <wtf/TZoneMalloc.h>
#include <wtf/UniqueRef.h>

namespace WebCore {

// BifurcatedGraphicsContext allows you to duplicate painting between two given GraphicsContexts;
// for example, for painting into a bitmap-backed and a display-list-backed context simultaneously.
// Any state that is returned by GraphicsContext methods will be retrieved from the primary context.

class WEBCORE_EXPORT BifurcatedGraphicsContext : public GraphicsContext {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(BifurcatedGraphicsContext, WEBCORE_EXPORT);
    WTF_MAKE_NONCOPYABLE(BifurcatedGraphicsContext);
public:
    BifurcatedGraphicsContext(GraphicsContext& primaryContext, GraphicsContext& secondaryContext);
    ~BifurcatedGraphicsContext();

    bool hasPlatformContext() const;
    PlatformGraphicsContext* platformContext() const final;

    const DestinationColorSpace& colorSpace() const final;

    void save(GraphicsContextState::Purpose = GraphicsContextState::Purpose::SaveRestore) final;
    void restore(GraphicsContextState::Purpose = GraphicsContextState::Purpose::SaveRestore) final;

    void drawRect(const FloatRect&, float borderThickness = 1) final;
    void drawLine(const FloatPoint&, const FloatPoint&) final;
    void drawEllipse(const FloatRect&) final;

#if USE(CG)
    void applyStrokePattern() final;
    void applyFillPattern() final;
#endif
    void drawPath(const Path&) final;
    void fillPath(const Path&) final;
    void strokePath(const Path&) final;

    void beginTransparencyLayer(float opacity) final;
    void beginTransparencyLayer(CompositeOperator, BlendMode) final;
    void endTransparencyLayer() final;

    void applyDeviceScaleFactor(float factor) final;

    using GraphicsContext::fillRect;
    void fillRect(const FloatRect&, RequiresClipToRect) final;
    void fillRect(const FloatRect&, const Color&) final;
    void fillRect(const FloatRect&, Gradient&) final;
    void fillRect(const FloatRect&, Gradient&, const AffineTransform&, RequiresClipToRect) final;
    void fillRoundedRectImpl(const FloatRoundedRect&, const Color&) final;
    void fillRectWithRoundedHole(const FloatRect&, const FloatRoundedRect& roundedHoleRect, const Color&) final;
    void clearRect(const FloatRect&) final;
    void strokeRect(const FloatRect&, float lineWidth) final;

    void fillEllipse(const FloatRect& ellipse) final;
    void strokeEllipse(const FloatRect& ellipse) final;

#if USE(CG)
    bool isCALayerContext() const final;
#endif

    RenderingMode renderingMode() const final;

    void resetClip() final;

    void clip(const FloatRect&) final;
    void clipRoundedRect(const FloatRoundedRect&) final;
    void clipPath(const Path&, WindRule = WindRule::EvenOdd) final;

    void clipOut(const FloatRect&) final;
    void clipOutRoundedRect(const FloatRoundedRect&) final;
    void clipOut(const Path&) final;

    void clipToImageBuffer(ImageBuffer&, const FloatRect&) final;

    IntRect clipBounds() const final;

    void setLineCap(LineCap) final;
    void setLineDash(const DashArray&, float dashOffset) final;
    void setLineJoin(LineJoin) final;
    void setMiterLimit(float) final;

    void drawNativeImageInternal(NativeImage&, const FloatRect& destRect, const FloatRect& srcRect, ImagePaintingOptions = { }) final;
    void drawSystemImage(SystemImage&, const FloatRect&) final;
    void drawPattern(NativeImage&, const FloatRect& destRect, const FloatRect& tileRect, const AffineTransform& patternTransform, const FloatPoint& phase, const FloatSize& spacing, ImagePaintingOptions = { }) final;
    ImageDrawResult drawImage(Image&, const FloatRect& destination, const FloatRect& source, ImagePaintingOptions = { ImageOrientation::Orientation::FromImage }) final;
    ImageDrawResult drawTiledImage(Image&, const FloatRect& destination, const FloatPoint& source, const FloatSize& tileSize, const FloatSize& spacing, ImagePaintingOptions = { }) final;
    ImageDrawResult drawTiledImage(Image&, const FloatRect& destination, const FloatRect& source, const FloatSize& tileScaleFactor, Image::TileRule, Image::TileRule, ImagePaintingOptions = { }) final;
    void drawControlPart(ControlPart&, const FloatRoundedRect& borderRect, float deviceScaleFactor, const ControlStyle&) final;

#if ENABLE(VIDEO)
    void drawVideoFrame(VideoFrame&, const FloatRect& destination, WebCore::ImageOrientation, bool shouldDiscardAlpha) final;
#endif

    using GraphicsContext::scale;
    void scale(const FloatSize&) final;
    void rotate(float angleInRadians) final;
    void translate(float x, float y) final;

    void concatCTM(const AffineTransform&) final;
    void setCTM(const AffineTransform&) final;

    AffineTransform getCTM(IncludeDeviceScale = PossiblyIncludeDeviceScale) const final;

    void drawFocusRing(const Path&, float outlineWidth, const Color&) final;
    void drawFocusRing(const Vector<FloatRect>&, float outlineOffset, float outlineWidth, const Color&) final;

    FloatSize drawText(const FontCascade&, const TextRun&, const FloatPoint&, unsigned from = 0, std::optional<unsigned> to = std::nullopt) final;
    void drawGlyphs(const Font&, const GlyphBufferGlyph*, const GlyphBufferAdvance*, unsigned numGlyphs, const FloatPoint&, FontSmoothingMode) final;
    void drawDecomposedGlyphs(const Font&, const DecomposedGlyphs&) final;
    void drawEmphasisMarks(const FontCascade&, const TextRun&, const AtomString& mark, const FloatPoint&, unsigned from = 0, std::optional<unsigned> to = std::nullopt) final;
    void drawBidiText(const FontCascade&, const TextRun&, const FloatPoint&, FontCascade::CustomFontNotReadyAction = FontCascade::CustomFontNotReadyAction::DoNotPaintIfFontNotReady) final;

    void drawLinesForText(const FloatPoint&, float thickness, const DashArray& widths, bool printing, bool doubleLines, StrokeStyle) final;

    void drawDotsForDocumentMarker(const FloatRect&, DocumentMarkerLineStyle) final;

    void beginPage(const IntSize&) final;
    void endPage() final;

    void setURLForRect(const URL&, const FloatRect&) final;

    void setDestinationForRect(const String& name, const FloatRect&) final;
    void addDestinationAtPoint(const String& name, const FloatPoint&) final;

    bool supportsInternalLinks() const final;

    void didUpdateState(GraphicsContextState&) final;

private:
    void verifyStateSynchronization();

    bool m_hasLoggedAboutDesynchronizedState { false };

    GraphicsContext& m_primaryContext;
    GraphicsContext& m_secondaryContext;
};

}

