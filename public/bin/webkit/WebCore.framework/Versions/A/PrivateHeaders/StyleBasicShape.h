/*
 * Copyright (C) 2024 Samuel Weinig <sam@webkit.org>
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
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "CSSBasicShape.h"
#include "StyleCircleFunction.h"
#include "StyleEllipseFunction.h"
#include "StyleInsetFunction.h"
#include "StylePathComputation.h"
#include "StylePathFunction.h"
#include "StylePolygonFunction.h"
#include "StyleRectFunction.h"
#include "StyleShapeFunction.h"
#include "StyleWindRuleComputation.h"
#include "StyleXywhFunction.h"

namespace WebCore {
namespace Style {

// NOTE: This differs from CSS::BasicShape due to lack of RectFunction and XywhFunction, both of
// which convert to InsetFunction during style conversion.
using BasicShape = std::variant<
    CircleFunction,
    EllipseFunction,
    InsetFunction,
    PathFunction,
    PolygonFunction,
    ShapeFunction
>;

template<typename T> concept ShapeWithCenterCoordinate = std::same_as<T, CircleFunction> || std::same_as<T, EllipseFunction>;

// MARK: - Conversion

template<> struct ToCSS<BasicShape> { auto operator()(const BasicShape&, const RenderStyle&) -> CSS::BasicShape; };
template<> struct ToStyle<CSS::BasicShape> { auto operator()(const CSS::BasicShape&, const BuilderState&) -> BasicShape; };

// MARK: - Blending

template<> struct Blending<BasicShape> {
    auto canBlend(const BasicShape&, const BasicShape&) -> bool;
    auto blend(const BasicShape&, const BasicShape&, const BlendingContext&) -> BasicShape;
};

// MARK: - Path

template<> struct PathComputation<BasicShape> { WebCore::Path operator()(const BasicShape&, const FloatRect&); };

// MARK: - Winding

template<> struct WindRuleComputation<BasicShape> { WebCore::WindRule operator()(const BasicShape&); };

} // namespace Style
} // namespace WebCore
