/*
 * Copyright (C) 2021 Apple Inc.  All rights reserved.
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

#include "FloatRect.h"
#include "ImageBuffer.h"
#include "IntRect.h"
#include "PixelBuffer.h"
#include "RenderingMode.h"
#include <JavaScriptCore/Forward.h>
#include <wtf/RefCounted.h>
#include <wtf/Vector.h>

#if USE(CORE_IMAGE)
OBJC_CLASS CIImage;
#endif

#if USE(SKIA)
#include <skia/core/SkPicture.h>
#include <skia/core/SkPictureRecorder.h>
#endif

namespace WebCore {

class Filter;
class FloatRect;

class FilterImage : public RefCounted<FilterImage> {
public:
    static RefPtr<FilterImage> create(const FloatRect& primitiveSubregion, const FloatRect& imageRect, const IntRect& absoluteImageRect, bool isAlphaImage, bool isValidPremultiplied, RenderingMode, const DestinationColorSpace&, ImageBufferAllocator&);
    static RefPtr<FilterImage> create(const FloatRect& primitiveSubregion, const FloatRect& imageRect, const IntRect& absoluteImageRect, Ref<ImageBuffer>&&, ImageBufferAllocator&);

    // The return values are in filter coordinates.
    FloatRect primitiveSubregion() const { return m_primitiveSubregion; }
    FloatRect maxEffectRect(const Filter&) const;
    FloatRect imageRect() const { return m_imageRect; }

    // The return values are in user-space coordinates.
    IntRect absoluteImageRect() const { return m_absoluteImageRect; }
    IntRect absoluteImageRectRelativeTo(const FilterImage& origin) const;
    FloatPoint mappedAbsolutePoint(const FloatPoint&) const;

    bool isAlphaImage() const { return m_isAlphaImage; }
    RenderingMode renderingMode() const { return m_renderingMode; }
    const DestinationColorSpace& colorSpace() const { return m_colorSpace; }

    size_t memoryCost() const;

    WEBCORE_EXPORT ImageBuffer* imageBuffer();
    PixelBuffer* pixelBuffer(AlphaPremultiplication);

    RefPtr<PixelBuffer> getPixelBuffer(AlphaPremultiplication, const IntRect& sourceRect, std::optional<DestinationColorSpace> = std::nullopt);
    void copyPixelBuffer(PixelBuffer& destinationPixelBuffer, const IntRect& sourceRect);

    void correctPremultipliedPixelBuffer();
    void transformToColorSpace(const DestinationColorSpace&);

#if USE(CORE_IMAGE)
    RetainPtr<CIImage> ciImage() const { return m_ciImage; }
    void setCIImage(RetainPtr<CIImage>&&);
    size_t memoryCostOfCIImage() const;
#endif

private:
    FilterImage(const FloatRect& primitiveSubregion, const FloatRect& imageRect, const IntRect& absoluteImageRect, bool isAlphaImage, bool isValidPremultiplied, RenderingMode, const DestinationColorSpace&, ImageBufferAllocator&);
    FilterImage(const FloatRect& primitiveSubregion, const FloatRect& imageRect, const IntRect& absoluteImageRect, Ref<ImageBuffer>&&, ImageBufferAllocator&);

    RefPtr<PixelBuffer>& pixelBufferSlot(AlphaPremultiplication);

    ImageBuffer* imageBufferFromPixelBuffer();

#if USE(CORE_IMAGE)
    ImageBuffer* imageBufferFromCIImage();
#endif

    bool requiresPixelBufferColorSpaceConversion(std::optional<DestinationColorSpace>) const;

    FloatRect m_primitiveSubregion;
    FloatRect m_imageRect;
    IntRect m_absoluteImageRect;

    bool m_isAlphaImage { false };
    bool m_isValidPremultiplied { true };
    RenderingMode m_renderingMode;
    DestinationColorSpace m_colorSpace;

    RefPtr<ImageBuffer> m_imageBuffer;
    RefPtr<PixelBuffer> m_unpremultipliedPixelBuffer;
    RefPtr<PixelBuffer> m_premultipliedPixelBuffer;

#if USE(CORE_IMAGE)
    RetainPtr<CIImage> m_ciImage;
#endif

    ImageBufferAllocator& m_allocator;
};

} // namespace WebCore
