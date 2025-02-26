/*
 * Copyright (C) 2006-2023 Apple Inc. All rights reserved.
 * Copyright (C) 2007 Alp Toker <alp@atoker.com>
 * Copyright (C) 2008 Torch Mobile, Inc.
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

#include "Color.h"
#include "ColorInterpolationMethod.h"
#include "FloatPoint.h"
#include "GradientColorStops.h"
#include "GraphicsTypes.h"
#include "RenderingResource.h"
#include <variant>
#include <wtf/Vector.h>

#if USE(SKIA)
#include <skia/core/SkShader.h>
#endif

#if USE(CG)
#include "GradientRendererCG.h"
#endif

#if USE(CG)
typedef struct CGContext* CGContextRef;
#endif

#if USE(CAIRO)
typedef struct _cairo_pattern cairo_pattern_t;
#endif

namespace WTF {
class TextStream;
}

namespace WebCore {

class AffineTransform;
class FloatRect;
class GraphicsContext;

class Gradient : public RenderingResource {
public:
    struct LinearData {
        FloatPoint point0;
        FloatPoint point1;
    };

    struct RadialData {
        FloatPoint point0;
        FloatPoint point1;
        float startRadius;
        float endRadius;
        float aspectRatio; // For elliptical gradient, width / height.
    };

    struct ConicData {
        FloatPoint point0;
        float angleRadians;
    };

    using Data = std::variant<LinearData, RadialData, ConicData>;

    WEBCORE_EXPORT static Ref<Gradient> create(Data&&, ColorInterpolationMethod, GradientSpreadMethod = GradientSpreadMethod::Pad, GradientColorStops&& = { }, std::optional<RenderingResourceIdentifier> = std::nullopt);

    const Data& data() const { return m_data; }
    ColorInterpolationMethod colorInterpolationMethod() const { return m_colorInterpolationMethod; }
    GradientSpreadMethod spreadMethod() const { return m_spreadMethod; }
    const GradientColorStops& stops() const { return m_stops; }

    WEBCORE_EXPORT void addColorStop(GradientColorStop&&);

    bool isZeroSize() const;

    void fill(GraphicsContext&, const FloatRect&);
    void adjustParametersForTiledDrawing(FloatSize&, FloatRect&, const FloatSize& spacing);

    unsigned hash() const;

#if USE(CAIRO)
    RefPtr<cairo_pattern_t> createPattern(float globalAlpha, const AffineTransform&);
#endif

#if USE(CG)
    void paint(GraphicsContext&);
    void paint(CGContextRef);
#endif

#if USE(SKIA)
    sk_sp<SkShader> shader(float globalAlpha, const AffineTransform&);
#endif

private:
    Gradient(Data&&, ColorInterpolationMethod, GradientSpreadMethod, GradientColorStops&&, std::optional<RenderingResourceIdentifier>);

    bool isGradient() const final { return true; }

    void stopsChanged();

    Data m_data;
    ColorInterpolationMethod m_colorInterpolationMethod;
    GradientSpreadMethod m_spreadMethod;
    GradientColorStops m_stops;
    mutable unsigned m_cachedHash { 0 };

#if USE(CG)
    std::optional<GradientRendererCG> m_platformRenderer;
#endif

#if USE(SKIA)
    sk_sp<SkShader> m_shader;
#endif

};

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const Gradient&);

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::Gradient)
    static bool isType(const WebCore::RenderingResource& renderingResource) { return renderingResource.isGradient(); }
SPECIALIZE_TYPE_TRAITS_END()
