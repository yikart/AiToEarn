/*
 * Copyright (C) 2013 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "CSSPropertyNames.h"
#include "Element.h"
#include <optional>
#include <wtf/Assertions.h>

namespace WebCore {

class Element;
class FloatSize;
class FontCascade;
class RenderStyle;
class RenderView;

namespace Style {
class BuilderState;
};

class CSSToLengthConversionData {
public:
    // This is used during style building. The 'zoom' property is taken into account.
    CSSToLengthConversionData(const RenderStyle&, Style::BuilderState&);
    // This constructor ignores the `zoom` property.
    CSSToLengthConversionData(const RenderStyle&, const RenderStyle* rootStyle, const RenderStyle* parentStyle, const RenderView*, const Element* elementForContainerUnitResolution = nullptr);

    CSSToLengthConversionData() = default;

    const RenderStyle* style() const { return m_style; }
    const RenderStyle* rootStyle() const { return m_rootStyle; }
    const RenderStyle* parentStyle() const { return m_parentStyle; }
    float zoom() const;
    bool computingFontSize() const { return m_propertyToCompute == CSSPropertyFontSize; }
    bool computingLineHeight() const { return m_propertyToCompute == CSSPropertyLineHeight; }
    CSSPropertyID propertyToCompute() const { return m_propertyToCompute.value_or(CSSPropertyInvalid); }
    const RenderView* renderView() const { return m_renderView; }
    const Element* elementForContainerUnitResolution() const { return m_elementForContainerUnitResolution.get(); }

    const FontCascade& fontCascadeForFontUnits() const;
    int computedLineHeightForFontUnits() const;

    FloatSize defaultViewportFactor() const;
    FloatSize smallViewportFactor() const;
    FloatSize largeViewportFactor() const;
    FloatSize dynamicViewportFactor() const;

    CSSToLengthConversionData copyForFontSize() const
    {
        CSSToLengthConversionData copy(*this);
        copy.m_zoom = 1.f;
        copy.m_propertyToCompute = CSSPropertyFontSize;
        return copy;
    };

    CSSToLengthConversionData copyWithAdjustedZoom(float zoom) const
    {
        CSSToLengthConversionData copy(*this);
        copy.m_zoom = zoom;
        return copy;
    }

    CSSToLengthConversionData copyForLineHeight(float zoom) const
    {
        CSSToLengthConversionData copy(*this);
        copy.m_zoom = zoom;
        copy.m_propertyToCompute = CSSPropertyLineHeight;
        return copy;
    }

    void setUsesContainerUnits() const;

    Style::BuilderState* styleBuilderState() const { return m_styleBuilderState; }

private:
    const RenderStyle* m_style { nullptr };
    const RenderStyle* m_rootStyle { nullptr };
    const RenderStyle* m_parentStyle { nullptr };
    const RenderView* m_renderView { nullptr };
    RefPtr<const Element> m_elementForContainerUnitResolution;
    std::optional<float> m_zoom;
    std::optional<CSSPropertyID> m_propertyToCompute;
    // FIXME: Remove this hack.
    RenderStyle* m_viewportDependencyDetectionStyle { nullptr };

    Style::BuilderState* m_styleBuilderState { nullptr };
};

} // namespace WebCore
