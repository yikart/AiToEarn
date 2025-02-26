/*
 * Copyright (C) 2016-2023 Apple Inc. All rights reserved.
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

#include "DisplayList.h"
#include "DisplayListItems.h"
#include "DrawGlyphsRecorder.h"
#include "GraphicsContext.h"
#include "Image.h" // For Image::TileRule.
#include "TextFlags.h"
#include <wtf/Noncopyable.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class FloatPoint;
class FloatRect;
class Font;
class GlyphBuffer;
class Gradient;
class Image;
class SourceImage;
class VideoFrame;

struct ImagePaintingOptions;

namespace DisplayList {

class Recorder : public GraphicsContext {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(Recorder, WEBCORE_EXPORT);
    WTF_MAKE_NONCOPYABLE(Recorder);
public:
    enum class DrawGlyphsMode {
        Normal,
        DeconstructUsingDrawGlyphsCommands,
        DeconstructUsingDrawDecomposedGlyphsCommands,
    };

    Recorder(const GraphicsContextState& state, const FloatRect& initialClip, const AffineTransform& transform, const DestinationColorSpace& colorSpace, DrawGlyphsMode drawGlyphsMode = DrawGlyphsMode::Normal)
        : Recorder(IsDeferred::Yes, state, initialClip, transform, colorSpace, drawGlyphsMode)
    {
    }
    WEBCORE_EXPORT virtual ~Recorder();

    // Records possible pending commands. Should be used when recording is known to end.
    WEBCORE_EXPORT void commitRecording();

protected:
    WEBCORE_EXPORT Recorder(IsDeferred, const GraphicsContextState&, const FloatRect& initialClip, const AffineTransform&, const DestinationColorSpace&, DrawGlyphsMode);

    virtual void recordSetInlineFillColor(PackedColor::RGBA) = 0;
    virtual void recordSetInlineStroke(SetInlineStroke&&) = 0;
    virtual void recordSetState(const GraphicsContextState&) = 0;
    virtual void recordClearDropShadow() = 0;
    virtual void recordClipToImageBuffer(ImageBuffer&, const FloatRect& destinationRect) = 0;
    virtual void recordDrawFilteredImageBuffer(ImageBuffer*, const FloatRect& sourceImageRect, Filter&) = 0;
    virtual void recordDrawGlyphs(const Font&, const GlyphBufferGlyph*, const GlyphBufferAdvance*, unsigned count, const FloatPoint& localAnchor, FontSmoothingMode) = 0;
    virtual void recordDrawDecomposedGlyphs(const Font&, const DecomposedGlyphs&) = 0;
    virtual void recordDrawImageBuffer(ImageBuffer&, const FloatRect& destRect, const FloatRect& srcRect, ImagePaintingOptions) = 0;
    virtual void recordDrawNativeImage(RenderingResourceIdentifier imageIdentifier, const FloatRect& destRect, const FloatRect& srcRect, ImagePaintingOptions) = 0;
    virtual void recordDrawSystemImage(SystemImage&, const FloatRect&) = 0;
    virtual void recordDrawPattern(RenderingResourceIdentifier, const FloatRect& destRect, const FloatRect& tileRect, const AffineTransform&, const FloatPoint& phase, const FloatSize& spacing, ImagePaintingOptions = { }) = 0;
#if ENABLE(INLINE_PATH_DATA)
    virtual void recordFillLine(const PathDataLine&) = 0;
    virtual void recordFillArc(const PathArc&) = 0;
    virtual void recordFillClosedArc(const PathClosedArc&) = 0;
    virtual void recordFillQuadCurve(const PathDataQuadCurve&) = 0;
    virtual void recordFillBezierCurve(const PathDataBezierCurve&) = 0;
#endif
    virtual void recordFillPathSegment(const PathSegment&) = 0;
    virtual void recordFillPath(const Path&) = 0;
#if ENABLE(INLINE_PATH_DATA)
    virtual void recordStrokeLine(const PathDataLine&) = 0;
    virtual void recordStrokeLineWithColorAndThickness(const PathDataLine&, SetInlineStroke&&) = 0;
    virtual void recordStrokeArc(const PathArc&) = 0;
    virtual void recordStrokeClosedArc(const PathClosedArc&) = 0;
    virtual void recordStrokeQuadCurve(const PathDataQuadCurve&) = 0;
    virtual void recordStrokeBezierCurve(const PathDataBezierCurve&) = 0;
#endif
    virtual void recordStrokePathSegment(const PathSegment&) = 0;
    virtual void recordStrokePath(const Path&) = 0;
    virtual void recordDrawDisplayListItems(const Vector<Item>&, const FloatPoint& destination) = 0;

    virtual bool recordResourceUse(NativeImage&) = 0;
    virtual bool recordResourceUse(ImageBuffer&) = 0;
    virtual bool recordResourceUse(const SourceImage&) = 0;
    virtual bool recordResourceUse(Font&) = 0;
    virtual bool recordResourceUse(DecomposedGlyphs&) = 0;
    virtual bool recordResourceUse(Gradient&) = 0;
    virtual bool recordResourceUse(Filter&) = 0;

    struct ContextState {
        GraphicsContextState state;
        AffineTransform ctm;
        FloatRect clipBounds;
        std::optional<GraphicsContextState> lastDrawingState { std::nullopt };

        ContextState cloneForTransparencyLayer() const
        {
            auto stateClone = state.clone(GraphicsContextState::Purpose::TransparencyLayer);
            std::optional<GraphicsContextState> lastDrawingStateClone;
            if (lastDrawingStateClone)
                lastDrawingStateClone = lastDrawingState->clone(GraphicsContextState::Purpose::TransparencyLayer);
            return ContextState { WTFMove(stateClone), ctm, clipBounds, WTFMove(lastDrawingStateClone) };
        }

        void translate(float x, float y);
        void rotate(float angleInRadians);
        void scale(const FloatSize&);
        void concatCTM(const AffineTransform&);
        void setCTM(const AffineTransform&);
    };

    const Vector<ContextState, 4>& stateStack() const { return m_stateStack; }

    const ContextState& currentState() const;
    ContextState& currentState();

protected:
    WEBCORE_EXPORT void updateStateForSave(GraphicsContextState::Purpose);
    [[nodiscard]] WEBCORE_EXPORT bool updateStateForRestore(GraphicsContextState::Purpose);
    [[nodiscard]] WEBCORE_EXPORT bool updateStateForTranslate(float x, float y);
    [[nodiscard]] WEBCORE_EXPORT bool updateStateForRotate(float angleInRadians);
    [[nodiscard]] WEBCORE_EXPORT bool updateStateForScale(const FloatSize&);
    [[nodiscard]] WEBCORE_EXPORT bool updateStateForConcatCTM(const AffineTransform&);
    WEBCORE_EXPORT void updateStateForSetCTM(const AffineTransform&);
    WEBCORE_EXPORT void updateStateForBeginTransparencyLayer(float opacity);
    WEBCORE_EXPORT void updateStateForBeginTransparencyLayer(CompositeOperator, BlendMode);
    WEBCORE_EXPORT void updateStateForEndTransparencyLayer();
    WEBCORE_EXPORT void updateStateForResetClip();
    WEBCORE_EXPORT void updateStateForClip(const FloatRect&);
    WEBCORE_EXPORT void updateStateForClipRoundedRect(const FloatRoundedRect&);
    WEBCORE_EXPORT void updateStateForClipPath(const Path&);
    WEBCORE_EXPORT void updateStateForClipOut(const FloatRect&);
    WEBCORE_EXPORT void updateStateForClipOut(const Path&);
    WEBCORE_EXPORT void updateStateForClipOutRoundedRect(const FloatRoundedRect&);
    WEBCORE_EXPORT void updateStateForApplyDeviceScaleFactor(float);
    WEBCORE_EXPORT void appendStateChangeItemIfNecessary();
    FloatRect initialClip() const { return m_initialClip; }

private:
    bool hasPlatformContext() const final { return false; }
    PlatformGraphicsContext* platformContext() const final { ASSERT_NOT_REACHED(); return nullptr; }

    const DestinationColorSpace& colorSpace() const final { return m_colorSpace; }

#if USE(CG)
    bool isCALayerContext() const final { return false; }
#endif

    void fillRoundedRectImpl(const FloatRoundedRect&, const Color&) final { ASSERT_NOT_REACHED(); }

    WEBCORE_EXPORT const GraphicsContextState& state() const final;

    WEBCORE_EXPORT void didUpdateState(GraphicsContextState&) final;
    WEBCORE_EXPORT void didUpdateSingleState(GraphicsContextState&, GraphicsContextState::ChangeIndex) final;
    WEBCORE_EXPORT void fillPath(const Path&) final;
    WEBCORE_EXPORT void strokePath(const Path&) final;
    WEBCORE_EXPORT void drawFilteredImageBuffer(ImageBuffer* sourceImage, const FloatRect& sourceImageRect, Filter&, FilterResults&) final;
    WEBCORE_EXPORT void drawGlyphs(const Font&, const GlyphBufferGlyph*, const GlyphBufferAdvance*, unsigned numGlyphs, const FloatPoint& anchorPoint, FontSmoothingMode) final;
    WEBCORE_EXPORT void drawDecomposedGlyphs(const Font&, const DecomposedGlyphs&) override;
    WEBCORE_EXPORT void drawGlyphsAndCacheResources(const Font&, const GlyphBufferGlyph*, const GlyphBufferAdvance*, unsigned count, const FloatPoint& localAnchor, FontSmoothingMode) final;
    WEBCORE_EXPORT void drawDisplayListItems(const Vector<Item>&, const ResourceHeap&, ControlFactory&, const FloatPoint& destination) final;
    WEBCORE_EXPORT void drawImageBuffer(ImageBuffer&, const FloatRect& destination, const FloatRect& source, ImagePaintingOptions) final;
    WEBCORE_EXPORT void drawConsumingImageBuffer(RefPtr<ImageBuffer>, const FloatRect& destination, const FloatRect& source, ImagePaintingOptions) final;
    WEBCORE_EXPORT void drawNativeImageInternal(NativeImage&, const FloatRect& destRect, const FloatRect& srcRect, ImagePaintingOptions) final;
    WEBCORE_EXPORT void drawSystemImage(SystemImage&, const FloatRect&) final;
    WEBCORE_EXPORT void drawPattern(NativeImage&, const FloatRect& destRect, const FloatRect& tileRect, const AffineTransform&, const FloatPoint& phase, const FloatSize& spacing, ImagePaintingOptions) final;
    WEBCORE_EXPORT void drawPattern(ImageBuffer&, const FloatRect& destRect, const FloatRect& tileRect, const AffineTransform&, const FloatPoint& phase, const FloatSize& spacing, ImagePaintingOptions) final;
    WEBCORE_EXPORT AffineTransform getCTM(GraphicsContext::IncludeDeviceScale = PossiblyIncludeDeviceScale) const final;
    WEBCORE_EXPORT IntRect clipBounds() const final;
    WEBCORE_EXPORT void clipToImageBuffer(ImageBuffer&, const FloatRect&) final;

    void appendStateChangeItem(const GraphicsContextState&);

    SetInlineStroke buildSetInlineStroke(const GraphicsContextState&);

    const AffineTransform& ctm() const;

    bool shouldDeconstructDrawGlyphs() const;

    Vector<ContextState, 4> m_stateStack;
    std::unique_ptr<DrawGlyphsRecorder> m_drawGlyphsRecorder;
    float m_initialScale { 1 };
    DestinationColorSpace m_colorSpace;
    const DrawGlyphsMode m_drawGlyphsMode { DrawGlyphsMode::Normal };
    const FloatRect m_initialClip;
};

} // namespace DisplayList
} // namespace WebCore
