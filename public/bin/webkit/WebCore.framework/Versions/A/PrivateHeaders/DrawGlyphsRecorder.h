/*
 * Copyright (C) 2020-2023 Apple Inc. All rights reserved.
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

#include "AffineTransform.h"
#include "Color.h"
#include "Gradient.h"
#include "GraphicsContext.h"
#include "Pattern.h"
#include "TextFlags.h"
#include <wtf/TZoneMallocInlines.h>
#include <wtf/UniqueRef.h>

#if USE(CORE_TEXT)
#include <CoreGraphics/CoreGraphics.h>
#include <CoreText/CoreText.h>
#include <pal/spi/cf/CoreTextSPI.h>
#include <pal/spi/cg/CoreGraphicsSPI.h>
#endif

namespace WebCore {

class FloatPoint;
class Font;
class GlyphBuffer;
class GraphicsContext;

class DrawGlyphsRecorder {
    WTF_MAKE_TZONE_ALLOCATED_INLINE(DrawGlyphsRecorder);
    WTF_MAKE_NONCOPYABLE(DrawGlyphsRecorder);
public:
    enum class DeriveFontFromContext : bool { No, Yes };
    explicit DrawGlyphsRecorder(GraphicsContext&, float scaleFactor = 1, DeriveFontFromContext = DeriveFontFromContext::No);

    void drawGlyphs(const Font&, const GlyphBufferGlyph*, const GlyphBufferAdvance*, unsigned numGlyphs, const FloatPoint& anchorPoint, FontSmoothingMode);

#if USE(CORE_TEXT)
    void drawNativeText(CTFontRef, CGFloat fontSize, CTLineRef, CGRect lineRect);

    void recordBeginLayer(CGRenderingStateRef, CGGStateRef, CGRect);
    void recordEndLayer(CGRenderingStateRef, CGGStateRef);
    void recordDrawGlyphs(CGRenderingStateRef, CGGStateRef, const CGAffineTransform*, const CGGlyph[], const CGPoint positions[], size_t count);
    void recordDrawImage(CGRenderingStateRef, CGGStateRef, CGRect, CGImageRef);
    void recordDrawPath(CGRenderingStateRef, CGGStateRef, CGPathDrawingMode, CGPathRef);
#endif

private:
#if USE(CORE_TEXT)
    UniqueRef<GraphicsContext> createInternalContext();
#endif

    void drawBySplittingIntoOTSVGAndNonOTSVGRuns(const Font&, const GlyphBufferGlyph*, const GlyphBufferAdvance*, unsigned numGlyphs, const FloatPoint& anchorPoint, FontSmoothingMode);
    void drawOTSVGRun(const Font&, const GlyphBufferGlyph*, const GlyphBufferAdvance*, unsigned numGlyphs, const FloatPoint& anchorPoint, FontSmoothingMode);
    void drawNonOTSVGRun(const Font&, const GlyphBufferGlyph*, const GlyphBufferAdvance*, unsigned numGlyphs, const FloatPoint& anchorPoint, FontSmoothingMode);

    void populateInternalState(const GraphicsContextState&);
    void populateInternalContext(const GraphicsContextState&);
    void prepareInternalContext(const Font&, FontSmoothingMode);
    void recordInitialColors();
    void concludeInternalContext();

    void updateFillBrush(const SourceBrush&);
    void updateStrokeBrush(const SourceBrush&);
    void updateCTM(const AffineTransform&);
    enum class ShadowsIgnoreTransforms {
        Unspecified,
        Yes,
        No
    };
    void updateShadow(const std::optional<GraphicsDropShadow>&, ShadowsIgnoreTransforms);

#if USE(CORE_TEXT)
    void updateFillColor(CGColorRef);
    void updateStrokeColor(CGColorRef);
    void updateShadow(CGStyleRef);
#endif

    GraphicsContext& m_owner;

#if USE(CORE_TEXT)
    UniqueRef<GraphicsContext> m_internalContext;
#endif

    const Font* m_originalFont { nullptr };

    const DeriveFontFromContext m_deriveFontFromContext;
    FontSmoothingMode m_smoothingMode { FontSmoothingMode::AutoSmoothing };

    AffineTransform m_originalTextMatrix;

    struct State {
        SourceBrush fillBrush;
        SourceBrush strokeBrush;
        AffineTransform ctm;
        std::optional<GraphicsDropShadow> dropShadow;
        bool ignoreTransforms { false };
    };
    State m_originalState;

#if USE(CORE_TEXT)
    RetainPtr<CGColorRef> m_initialFillColor;
    RetainPtr<CGColorRef> m_initialStrokeColor;
#endif
};

} // namespace WebCore
