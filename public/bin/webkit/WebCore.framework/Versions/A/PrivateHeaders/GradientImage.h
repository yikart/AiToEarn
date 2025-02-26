/*
 * Copyright (C) 2008-2016 Apple Inc. All rights reserved.
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

#include "GeneratedImage.h"

namespace WebCore {

class Gradient;
class ImageBuffer;

class GradientImage final : public GeneratedImage {
public:
    static Ref<GradientImage> create(Gradient& generator, const FloatSize& size)
    {
        return adoptRef(*new GradientImage(generator, size));
    }

    virtual ~GradientImage();

    const Gradient& gradient() const { return m_gradient.get(); }

private:
    WEBCORE_EXPORT GradientImage(Gradient&, const FloatSize&);

    ImageDrawResult draw(GraphicsContext&, const FloatRect& dstRect, const FloatRect& srcRect, ImagePaintingOptions = { }) final;
    void drawPattern(GraphicsContext&, const FloatRect& destRect, const FloatRect& srcRect, const AffineTransform& patternTransform, const FloatPoint& phase, const FloatSize& spacing, ImagePaintingOptions = { }) final;
    bool isGradientImage() const final { return true; }
    void dump(WTF::TextStream&) const final;
    
    Ref<Gradient> m_gradient;
    RefPtr<ImageBuffer> m_cachedImage;
    FloatSize m_cachedAdjustedSize;
    unsigned m_cachedGeneratorHash { 0 };
    FloatSize m_cachedScaleFactor;
};

}

SPECIALIZE_TYPE_TRAITS_IMAGE(GradientImage)
