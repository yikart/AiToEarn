/*
 * Copyright (C) 2016-2024 Apple Inc.  All rights reserved.
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

#include "ImageFrame.h"
#include "ImageOrientation.h"
#include "ImageTypes.h"
#include <wtf/ThreadSafeWeakPtr.h>

namespace WebCore {

class FragmentedSharedBuffer;

class ImageSource : public ThreadSafeRefCountedAndCanMakeThreadSafeWeakPtr<ImageSource> {
public:
    virtual ~ImageSource() = default;

    // Encoded and decoded data
    virtual EncodedDataStatus dataChanged(FragmentedSharedBuffer*, bool) { RELEASE_ASSERT_NOT_REACHED(); return EncodedDataStatus::Unknown; }
    virtual void destroyDecodedData(bool) { RELEASE_ASSERT_NOT_REACHED(); }

    // Animation
    virtual void startAnimation() { }
    virtual void stopAnimation() { }
    virtual void resetAnimation() { }
    virtual bool isAnimated() const { return false; }
    virtual bool isAnimating() const { return false; }
    virtual bool hasEverAnimated() const { return false; }

    // Decoding
    virtual bool isLargeForDecoding() const { return false; }
    virtual void stopDecodingWorkQueue() { RELEASE_ASSERT_NOT_REACHED(); }
    virtual void decode(Function<void(DecodingStatus)>&&)  { RELEASE_ASSERT_NOT_REACHED(); }

    // ImageFrame
    virtual unsigned currentFrameIndex() const { return primaryFrameIndex(); }

    virtual const ImageFrame& primaryImageFrame(const std::optional<SubsamplingLevel>& = std::nullopt) = 0;
    virtual const ImageFrame& currentImageFrame(const std::optional<SubsamplingLevel>& subsamplingLevel = std::nullopt) { return primaryImageFrame(subsamplingLevel); }

    // NativeImage
    virtual RefPtr<NativeImage> primaryNativeImage() = 0;
    virtual RefPtr<NativeImage> currentNativeImage() { return primaryNativeImage(); }
    virtual RefPtr<NativeImage> currentPreTransformedNativeImage(ImageOrientation) { return currentNativeImage(); }

    virtual RefPtr<NativeImage> nativeImageAtIndex(unsigned) { return primaryNativeImage(); }

    virtual Expected<Ref<NativeImage>, DecodingStatus> primaryNativeImageForDrawing(SubsamplingLevel, const DecodingOptions&);
    virtual Expected<Ref<NativeImage>, DecodingStatus> currentNativeImageForDrawing(SubsamplingLevel, const DecodingOptions&);

    // Image Metadata
    virtual IntSize size(ImageOrientation = ImageOrientation::Orientation::FromImage) const = 0;
    virtual IntSize sourceSize(ImageOrientation orientation = ImageOrientation::Orientation::FromImage) const { return size(orientation); }
    virtual bool hasDensityCorrectedSize() const { return false; }
    virtual ImageOrientation orientation() const { return ImageOrientation::Orientation::None; }
    virtual unsigned primaryFrameIndex() const { return 0; }
    virtual unsigned frameCount() const { return 1; }
    virtual DestinationColorSpace colorSpace() const = 0;
    virtual std::optional<Color> singlePixelSolidColor() const = 0;

    bool hasSolidColor() const;

    virtual String uti() const { return String(); }
    virtual String filenameExtension() const { return String(); }
    virtual String accessibilityDescription() const { return String(); }
    virtual std::optional<IntPoint> hotSpot() const { return { }; }

    virtual SubsamplingLevel subsamplingLevelForScaleFactor(GraphicsContext&, const FloatSize&, AllowImageSubsampling) { return SubsamplingLevel::Default; }

#if ENABLE(QUICKLOOK_FULLSCREEN)
    virtual bool shouldUseQuickLookForFullscreen() const { return false; }
#endif

#if ENABLE(SPATIAL_IMAGE_DETECTION)
    virtual bool isSpatial() const { return false; }
#endif

    // ImageFrame Metadata
    virtual Seconds frameDurationAtIndex(unsigned) const { RELEASE_ASSERT_NOT_REACHED(); return 0_s; }
    virtual ImageOrientation frameOrientationAtIndex(unsigned) const { RELEASE_ASSERT_NOT_REACHED(); return ImageOrientation::Orientation::None; }
    virtual Headroom frameHeadroomAtIndex(unsigned) const { RELEASE_ASSERT_NOT_REACHED(); return Headroom::None; }
    virtual DecodingStatus frameDecodingStatusAtIndex(unsigned) const { RELEASE_ASSERT_NOT_REACHED(); return DecodingStatus::Invalid; }

    // Testing support
    virtual unsigned decodeCountForTesting() const { return 0; }
    virtual unsigned blankDrawCountForTesting() const { return 0; }
    virtual void setMinimumDecodingDurationForTesting(Seconds) { RELEASE_ASSERT_NOT_REACHED(); }
    virtual void setClearDecoderAfterAsyncFrameRequestForTesting(bool) { RELEASE_ASSERT_NOT_REACHED(); }
    virtual void setAsyncDecodingEnabledForTesting(bool) { RELEASE_ASSERT_NOT_REACHED(); }
    virtual bool isAsyncDecodingEnabledForTesting() const { return false; }

    virtual void dump(WTF::TextStream&) const { }
};

} // namespace WebCore
