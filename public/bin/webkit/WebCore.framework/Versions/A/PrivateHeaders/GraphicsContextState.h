/*
 * Copyright (C) 2022-2023 Apple Inc.  All rights reserved.
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

#include "GraphicsStyle.h"
#include "GraphicsTypes.h"
#include "SourceBrush.h"
#include "WindRule.h"
#include <wtf/ArgumentCoder.h>
#include <wtf/OptionSet.h>

namespace WebCore {

class GraphicsContextState {
    friend class GraphicsContextCairo;
public:
    enum class Change : uint32_t {
        FillBrush                   = 1 << 0,
        FillRule                    = 1 << 1,

        StrokeBrush                 = 1 << 2,
        StrokeThickness             = 1 << 3,
        StrokeStyle                 = 1 << 4,

        CompositeMode               = 1 << 5,
        DropShadow                  = 1 << 6,
        Style                       = 1 << 7,

        Alpha                       = 1 << 8,
        TextDrawingMode             = 1 << 9,
        ImageInterpolationQuality   = 1 << 10,

        ShouldAntialias             = 1 << 11,
        ShouldSmoothFonts           = 1 << 12,
        ShouldSubpixelQuantizeFonts = 1 << 13,
        ShadowsIgnoreTransforms     = 1 << 14,
        DrawLuminanceMask           = 1 << 15,
        UseDarkAppearance           = 1 << 16,
    };
    using ChangeFlags = OptionSet<Change>;

    struct ChangeIndex {
        Change toChange() { return static_cast<Change>(1 << value); }

        uint32_t value;
    };
    static constexpr ChangeIndex toIndex(GraphicsContextState::Change change) { return { WTF::ctzConstexpr(enumToUnderlyingType(change)) }; }

    static constexpr ChangeFlags basicChangeFlags { Change::StrokeThickness, Change::StrokeBrush, Change::FillBrush };
    static constexpr ChangeFlags strokeChangeFlags { Change::StrokeThickness, Change::StrokeBrush };

    enum class Purpose : uint8_t {
        Initial,
        SaveRestore,
        TransparencyLayer
    };

    WEBCORE_EXPORT GraphicsContextState(const ChangeFlags& = { }, InterpolationQuality = InterpolationQuality::Default);

    void repurpose(Purpose);
    GraphicsContextState clone(Purpose) const;

    ChangeFlags changes() const { return m_changeFlags; }
    void didApplyChanges() { m_changeFlags = { }; }

    SourceBrush& fillBrush() { return m_fillBrush; }
    const SourceBrush& fillBrush() const { return m_fillBrush; }
    void setFillBrush(const SourceBrush& brush) { setProperty(Change::FillBrush, &GraphicsContextState::m_fillBrush, brush); }
    void setFillColor(const Color& color) { setProperty(Change::FillBrush, &GraphicsContextState::m_fillBrush, { color }); }
    void setFillGradient(Ref<Gradient>&& gradient, const AffineTransform& spaceTransform) { m_fillBrush.setGradient(WTFMove(gradient), spaceTransform); m_changeFlags.add(Change::FillBrush); }
    void setFillPattern(Ref<Pattern>&& pattern) { m_fillBrush.setPattern(WTFMove(pattern)); m_changeFlags.add(Change::FillBrush); }

    WindRule fillRule() const { return m_fillRule; }
    void setFillRule(WindRule fillRule) { setProperty(Change::FillRule, &GraphicsContextState::m_fillRule, fillRule); }

    SourceBrush& strokeBrush() { return m_strokeBrush; }
    const SourceBrush& strokeBrush() const { return m_strokeBrush; }
    void setStrokeBrush(const SourceBrush& brush) { setProperty(Change::StrokeBrush, &GraphicsContextState::m_strokeBrush, brush); }
    void setStrokeColor(const Color& color) { setProperty(Change::StrokeBrush, &GraphicsContextState::m_strokeBrush, { color }); }
    void setStrokeGradient(Ref<Gradient>&& gradient, const AffineTransform& spaceTransform) { m_strokeBrush.setGradient(WTFMove(gradient), spaceTransform); m_changeFlags.add(Change::StrokeBrush); }
    void setStrokePattern(Ref<Pattern>&& pattern) { m_strokeBrush.setPattern(WTFMove(pattern)); m_changeFlags.add(Change::StrokeBrush); }

    float strokeThickness() const { return m_strokeThickness; }
    void setStrokeThickness(float strokeThickness) { setProperty(Change::StrokeThickness, &GraphicsContextState::m_strokeThickness, strokeThickness); }

    StrokeStyle strokeStyle() const { return m_strokeStyle; }
    void setStrokeStyle(StrokeStyle strokeStyle) { setProperty(Change::StrokeStyle, &GraphicsContextState::m_strokeStyle, strokeStyle); }

    const CompositeMode& compositeMode() const { return m_compositeMode; }
    void setCompositeMode(CompositeMode compositeMode) { setProperty(Change::CompositeMode, &GraphicsContextState::m_compositeMode, compositeMode); }

    const std::optional<GraphicsDropShadow>& dropShadow() const { return m_dropShadow; }
    void setDropShadow(const std::optional<GraphicsDropShadow>& dropShadow) { setProperty(Change::DropShadow, &GraphicsContextState::m_dropShadow, dropShadow); }

    const std::optional<GraphicsStyle>& style() const { return m_style; }
    void setStyle(const std::optional<GraphicsStyle>& style) { setProperty(Change::Style, &GraphicsContextState::m_style, style); }

    float alpha() const { return m_alpha; }
    void setAlpha(float alpha) { setProperty(Change::Alpha, &GraphicsContextState::m_alpha, alpha); }

    InterpolationQuality imageInterpolationQuality() const { return m_imageInterpolationQuality; }
    void setImageInterpolationQuality(InterpolationQuality imageInterpolationQuality) { setProperty(Change::ImageInterpolationQuality, &GraphicsContextState::m_imageInterpolationQuality, imageInterpolationQuality); }

    TextDrawingModeFlags textDrawingMode() const { return m_textDrawingMode; }
    void setTextDrawingMode(TextDrawingModeFlags textDrawingMode) { setProperty(Change::TextDrawingMode, &GraphicsContextState::m_textDrawingMode, textDrawingMode); }

    bool shouldAntialias() const { return m_shouldAntialias; }
    void setShouldAntialias(bool shouldAntialias) { setProperty(Change::ShouldAntialias, &GraphicsContextState::m_shouldAntialias, shouldAntialias); }

    bool shouldSmoothFonts() const { return m_shouldSmoothFonts; }
    void setShouldSmoothFonts(bool shouldSmoothFonts) { setProperty(Change::ShouldSmoothFonts, &GraphicsContextState::m_shouldSmoothFonts, shouldSmoothFonts); }

    bool shouldSubpixelQuantizeFonts() const { return m_shouldSubpixelQuantizeFonts; }
    void setShouldSubpixelQuantizeFonts(bool shouldSubpixelQuantizeFonts) { setProperty(Change::ShouldSubpixelQuantizeFonts, &GraphicsContextState::m_shouldSubpixelQuantizeFonts, shouldSubpixelQuantizeFonts); }

    bool shadowsIgnoreTransforms() const { return m_shadowsIgnoreTransforms; }
    void setShadowsIgnoreTransforms(bool shadowsIgnoreTransforms) { setProperty(Change::ShadowsIgnoreTransforms, &GraphicsContextState::m_shadowsIgnoreTransforms, shadowsIgnoreTransforms); }

    bool drawLuminanceMask() const { return m_drawLuminanceMask; }
    void setDrawLuminanceMask(bool drawLuminanceMask) { setProperty(Change::DrawLuminanceMask, &GraphicsContextState::m_drawLuminanceMask, drawLuminanceMask); }

    bool useDarkAppearance() const { return m_useDarkAppearance; }
    void setUseDarkAppearance(bool useDarkAppearance) { setProperty(Change::UseDarkAppearance, &GraphicsContextState::m_useDarkAppearance, useDarkAppearance); }
    
    bool containsOnlyInlineChanges() const;
    bool containsOnlyInlineStrokeChanges() const;
    void mergeLastChanges(const GraphicsContextState&, const std::optional<GraphicsContextState>& lastDrawingState = std::nullopt);
    void mergeSingleChange(const GraphicsContextState&, ChangeIndex, const std::optional<GraphicsContextState>& lastDrawingState = std::nullopt);
    void mergeAllChanges(const GraphicsContextState&);

    Purpose purpose() const { return m_purpose; }

    WTF::TextStream& dump(WTF::TextStream&) const;

private:
    friend struct IPC::ArgumentCoder<GraphicsContextState, void>;

    template<typename T>
    void setProperty(Change change, T GraphicsContextState::*property, const T& value)
    {
#if !USE(CAIRO)
        if (this->*property == value)
            return;
#endif
        this->*property = value;
        m_changeFlags.add(change);
    }

    template<typename T>
    void setProperty(Change change, T GraphicsContextState::*property, T&& value)
    {
#if !USE(CAIRO)
        if (this->*property == value)
            return;
#endif
        this->*property = std::forward<T>(value);
        m_changeFlags.add(change);
    }

    SourceBrush m_fillBrush { Color::black };
    SourceBrush m_strokeBrush { Color::black };
    ChangeFlags m_changeFlags;
    float m_strokeThickness { 0 };
    WindRule m_fillRule { WindRule::NonZero };
    StrokeStyle m_strokeStyle { StrokeStyle::SolidStroke };

    CompositeMode m_compositeMode { CompositeOperator::SourceOver, BlendMode::Normal };
    std::optional<GraphicsDropShadow> m_dropShadow;
    std::optional<GraphicsStyle> m_style;

    float m_alpha { 1 };
    InterpolationQuality m_imageInterpolationQuality { InterpolationQuality::Default };
    TextDrawingModeFlags m_textDrawingMode { TextDrawingMode::Fill };

    bool m_shouldAntialias { true };
    bool m_shouldSmoothFonts { true };
    bool m_shouldSubpixelQuantizeFonts { true };
    bool m_shadowsIgnoreTransforms { false };
    bool m_drawLuminanceMask { false };
    bool m_useDarkAppearance { false };

    Purpose m_purpose { Purpose::Initial };
};

TextStream& operator<<(TextStream&, GraphicsContextState::Change);
TextStream& operator<<(TextStream&, const GraphicsContextState&);

} // namespace WebCore
