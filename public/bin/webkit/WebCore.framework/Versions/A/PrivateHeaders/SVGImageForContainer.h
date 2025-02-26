/*
 * Copyright (C) 2013 Google Inc. All rights reserved.
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
#include "FloatRect.h"
#include "FloatSize.h"
#include "Image.h"
#include "SVGImage.h"
#include <wtf/URL.h>

namespace WebCore {

class SVGImageForContainer final : public Image {
public:
    static Ref<SVGImageForContainer> create(SVGImage* image, const FloatSize& containerSize, float containerZoom, const URL& initialFragmentURL)
    {
        return adoptRef(*new SVGImageForContainer(image, containerSize, containerZoom, initialFragmentURL));
    }

    bool isSVGImageForContainer() const final { return true; }

    FloatSize size(ImageOrientation = ImageOrientation::Orientation::FromImage) const final;

    bool usesContainerSize() const final { return m_image->usesContainerSize(); }
    bool hasRelativeWidth() const final { return m_image->hasRelativeWidth(); }
    bool hasRelativeHeight() const final { return m_image->hasRelativeHeight(); }
    void computeIntrinsicDimensions(Length& intrinsicWidth, Length& intrinsicHeight, FloatSize& intrinsicRatio) final
    {
        protectedImage()->computeIntrinsicDimensions(intrinsicWidth, intrinsicHeight, intrinsicRatio);
    }

    ImageDrawResult draw(GraphicsContext&, const FloatRect&, const FloatRect&, ImagePaintingOptions = { }) final;

    void drawPattern(GraphicsContext&, const FloatRect&, const FloatRect&, const AffineTransform&, const FloatPoint&, const FloatSize&, ImagePaintingOptions = { }) final;

    // FIXME: Implement this to be less conservative.
    bool currentFrameKnownToBeOpaque() const final { return false; }

    RefPtr<NativeImage> currentNativeImage() final;

private:
    WEBCORE_EXPORT SVGImageForContainer(SVGImage*, const FloatSize& containerSize, float containerZoom, const URL& initialFragmentURL);
    RefPtr<SVGImage> protectedImage() const;

    WeakPtr<SVGImage> m_image;
    const FloatSize m_containerSize;
    const float m_containerZoom;
    const URL m_initialFragmentURL;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_IMAGE(SVGImageForContainer)
