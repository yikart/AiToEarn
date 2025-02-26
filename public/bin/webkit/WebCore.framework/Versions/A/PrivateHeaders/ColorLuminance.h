/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "ColorConversion.h"

namespace WebCore {

class Color;

template<typename ColorType> inline double relativeLuminance(const ColorType& color)
{
    // https://en.wikipedia.org/wiki/Relative_luminance

    // FIXME: This can be optimized a bit by observing that in some cases the conversion
    // to XYZA<float, WhitePoint::D65> in its entirety is unnecessary to get just the Y
    // component. For instance, for SRGBA<float>, this could be done as:
    //
    //     convertColor<LinearSRGBA<float>>(color) * LinearSRGBA<float>::linearToXYZ.row(1)
    //
    // (for a hypothetical row() function on ColorMatrix). We would probably want to implement
    // this in ColorConversion.h as a sibling function to convertColor which can get a channel
    // of a color in another space in this kind of optimal way.

    return convertColor<XYZA<float, WhitePoint::D65>>(color).resolved().y;
}

inline double contrastRatio(double relativeLuminanceA, double relativeLuminanceB)
{
    // Uses the WCAG 2.0 definition of contrast ratio.
    // https://www.w3.org/TR/WCAG20/#contrast-ratiodef
    auto lighterLuminance = relativeLuminanceA;
    auto darkerLuminance = relativeLuminanceB;

    if (lighterLuminance < darkerLuminance)
        std::swap(lighterLuminance, darkerLuminance);

    return (lighterLuminance + 0.05) / (darkerLuminance + 0.05);
}

template<typename ColorTypeA, typename ColorTypeB> inline double contrastRatio(const ColorTypeA& colorA, const ColorTypeB& colorB)
{
    return contrastRatio(relativeLuminance(colorA), relativeLuminance(colorB));
}

double relativeLuminance(const Color&);
double contrastRatio(const Color&, const Color&);

}
