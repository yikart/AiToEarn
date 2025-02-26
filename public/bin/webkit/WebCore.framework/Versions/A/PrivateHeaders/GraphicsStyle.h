/*
 * Copyright (C) 2022 Apple Inc.  All rights reserved.
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
#include "FloatSize.h"
#include <wtf/Vector.h>

namespace WTF {
class TextStream;
}

namespace WebCore {

// Legacy shadow blur radius is used for canvas, and -webkit-box-shadow.
// It has different treatment of radii > 8px.
enum class ShadowRadiusMode : bool {
    Default,
    Legacy
};

struct GraphicsDropShadow {
    FloatSize offset;
    float radius;
    Color color;
    ShadowRadiusMode radiusMode { ShadowRadiusMode::Default };
    float opacity { 1 };

    bool isVisible() const { return color.isVisible(); }
    bool isBlurred() const { return isVisible() && radius; }
    bool hasOutsets() const { return isBlurred() || (isVisible() && !offset.isZero()); }
};

inline bool operator==(const GraphicsDropShadow& a, const GraphicsDropShadow& b)
{
    return a.offset == b.offset && a.radius == b.radius && a.color == b.color;
}

struct GraphicsGaussianBlur {
    FloatSize radius;

    friend bool operator==(const GraphicsGaussianBlur&, const GraphicsGaussianBlur&) = default;
};

struct GraphicsColorMatrix {
    std::array<float, 20> values;

    friend bool operator==(const GraphicsColorMatrix&, const GraphicsColorMatrix&) = default;
};

using GraphicsStyle = std::variant<
    GraphicsDropShadow,
    GraphicsGaussianBlur,
    GraphicsColorMatrix
>;

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const GraphicsDropShadow&);
WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const GraphicsGaussianBlur&);
WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const GraphicsColorMatrix&);
WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const GraphicsStyle&);

} // namespace WebCore
