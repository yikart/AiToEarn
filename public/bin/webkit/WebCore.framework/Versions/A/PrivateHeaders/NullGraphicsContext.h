/*
 * Copyright (C) 2021-2023 Apple Inc. All rights reserved.
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
#include <wtf/TZoneMallocInlines.h>

namespace WebCore {

enum class NullGraphicsContextPaintInvalidationReasons : uint8_t {
    None,
    InvalidatingControlTints,
    InvalidatingImagesWithAsyncDecodes,
    DetectingContentfulPaint
};

class NullGraphicsContext : public GraphicsContext {
    WTF_MAKE_TZONE_ALLOCATED_INLINE(NullGraphicsContext);
public:
    using PaintInvalidationReasons = NullGraphicsContextPaintInvalidationReasons;

    NullGraphicsContext() = default;

    NullGraphicsContext(PaintInvalidationReasons reasons)
        : m_paintInvalidationReasons(reasons)
    {
    }

private:
#if USE(CG)
    bool isCALayerContext() const final { return false; }
#endif

    bool paintingDisabled() const final { return true; }
    bool performingPaintInvalidation() const final { return m_paintInvalidationReasons != PaintInvalidationReasons::None; }
    bool invalidatingControlTints() const final { return m_paintInvalidationReasons == PaintInvalidationReasons::InvalidatingControlTints; }
    bool invalidatingImagesWithAsyncDecodes() const final { return m_paintInvalidationReasons == PaintInvalidationReasons::InvalidatingImagesWithAsyncDecodes; }
    bool detectingContentfulPaint() const final { return m_paintInvalidationReasons == PaintInvalidationReasons::DetectingContentfulPaint; }

    void didUpdateState(GraphicsContextState&) final { }

    void drawNativeImageInternal(NativeImage&, const FloatRect&, const FloatRect&, ImagePaintingOptions) final { }

    void drawSystemImage(SystemImage&, const FloatRect&) final { };

    void drawPattern(NativeImage&, const FloatRect&, const FloatRect&, const AffineTransform&, const FloatPoint&, const FloatSize&, ImagePaintingOptions) final { }

    IntRect clipBounds() const final { return { }; }

#if USE(CG)
    void applyStrokePattern() final { }
    void applyFillPattern() final { }
    void drawPath(const Path&) final { }
#endif

    void drawRect(const FloatRect&, float = 1) final { }
    void drawLine(const FloatPoint&, const FloatPoint&) final { }
    void drawEllipse(const FloatRect&) final { }
    void fillPath(const Path&) final { }
    void strokePath(const Path&) final { }
    void fillRect(const FloatRect&, RequiresClipToRect) final { }
    void fillRect(const FloatRect&, Gradient&, const AffineTransform&, RequiresClipToRect) final { }
    void fillRect(const FloatRect&, const Color&) final { }
    void fillRoundedRectImpl(const FloatRoundedRect&, const Color&) final { }
    void strokeRect(const FloatRect&, float) final { }
    void clipPath(const Path&, WindRule = WindRule::EvenOdd) final { }
    void drawLinesForText(const FloatPoint&, float, const DashArray&, bool, bool = false, StrokeStyle = StrokeStyle::SolidStroke) final { }
    void setLineCap(LineCap) final { }
    void setLineDash(const DashArray&, float) final { }
    void setLineJoin(LineJoin) final { }
    void setMiterLimit(float) final { }
    void clipOut(const Path&) final { }
    void scale(const FloatSize&) final { }
    void rotate(float) final { }
    void translate(float, float) final { }
    void concatCTM(const AffineTransform&) final { }
    void setCTM(const AffineTransform&) final { }
    AffineTransform getCTM(IncludeDeviceScale = PossiblyIncludeDeviceScale) const final { return { }; }
    void clearRect(const FloatRect&) final { }
    void resetClip() final { }
    void clip(const FloatRect&) final { }
    void clipOut(const FloatRect&) final { }
    void save(GraphicsContextState::Purpose = GraphicsContextState::Purpose::SaveRestore) final { }
    void restore(GraphicsContextState::Purpose = GraphicsContextState::Purpose::SaveRestore) final { }

    void drawRaisedEllipse(const FloatRect&, const Color&, const Color&) final { }

    FloatSize drawText(const FontCascade&, const TextRun&, const FloatPoint&, unsigned = 0, std::optional<unsigned> = std::nullopt) final { return { }; }

    void drawGlyphs(const Font&, const GlyphBufferGlyph*, const GlyphBufferAdvance*, unsigned, const FloatPoint&, FontSmoothingMode) final { }
    void drawDecomposedGlyphs(const Font&, const DecomposedGlyphs&) final { }

    void drawEmphasisMarks(const FontCascade&, const TextRun&, const AtomString&, const FloatPoint&, unsigned = 0, std::optional<unsigned> = std::nullopt) final { }
    void drawBidiText(const FontCascade&, const TextRun&, const FloatPoint&, FontCascade::CustomFontNotReadyAction = FontCascade::CustomFontNotReadyAction::DoNotPaintIfFontNotReady) final { }

    void drawDotsForDocumentMarker(const FloatRect&, DocumentMarkerLineStyle) final { }

    ImageDrawResult drawImage(Image&, const FloatRect&, const FloatRect&, ImagePaintingOptions = { ImageOrientation::Orientation::FromImage }) final { return ImageDrawResult::DidNothing; }

    ImageDrawResult drawTiledImage(Image&, const FloatRect&, const FloatPoint&, const FloatSize&, const FloatSize&, ImagePaintingOptions = { }) final { return ImageDrawResult::DidNothing; }
    ImageDrawResult drawTiledImage(Image&, const FloatRect&, const FloatRect&, const FloatSize&, Image::TileRule, Image::TileRule, ImagePaintingOptions = { }) final { return ImageDrawResult::DidNothing; }

    void drawFocusRing(const Path&, float, const Color&) final { }
    void drawFocusRing(const Vector<FloatRect>&, float, float, const Color&) final { }

    void drawImageBuffer(ImageBuffer&, const FloatRect&, const FloatRect&, ImagePaintingOptions = { }) final { }

    void clipRoundedRect(const FloatRoundedRect&) final { }
    void clipOutRoundedRect(const FloatRoundedRect&) final { }
    void clipToImageBuffer(ImageBuffer&, const FloatRect&) final { }

    void fillRect(const FloatRect&, Gradient&) final { }
    void fillRect(const FloatRect&, const Color&, CompositeOperator, BlendMode = BlendMode::Normal) final { }

    void fillRoundedRect(const FloatRoundedRect&, const Color&, BlendMode = BlendMode::Normal) final { }
    void fillRectWithRoundedHole(const FloatRect&, const FloatRoundedRect&, const Color&) final { }

#if ENABLE(VIDEO)
    void drawVideoFrame(VideoFrame&, const FloatRect&, ImageOrientation, bool) final { }
#endif

private:
    const PaintInvalidationReasons m_paintInvalidationReasons { PaintInvalidationReasons::None };
};

} // namespace WebCore
