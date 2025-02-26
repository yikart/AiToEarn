/*
 * Copyright (C) 2017-2024 Apple Inc. All rights reserved.
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

#include "DecodingOptions.h"
#include "ImageOrientation.h"
#include "ImageTypes.h"
#include "IntPoint.h"
#include "IntSize.h"
#include "PlatformImage.h"
#include <wtf/Seconds.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/text/WTFString.h>
#include <wtf/ThreadSafeRefCounted.h>

namespace WebCore {

class FragmentedSharedBuffer;
class ImageFrame;

struct ImageDecoderFrameInfo {
    bool hasAlpha;
    Seconds duration;
};

class ImageDecoder : public ThreadSafeRefCounted<ImageDecoder> {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(ImageDecoder, WEBCORE_EXPORT);
public:
    static RefPtr<ImageDecoder> create(FragmentedSharedBuffer&, const String& mimeType, AlphaOption, GammaAndColorProfileOption);
    WEBCORE_EXPORT virtual ~ImageDecoder();

    using FrameInfo = ImageDecoderFrameInfo;

    enum class MediaType {
        Image,
        Video,
    };

    static bool supportsMediaType(MediaType);

#if ENABLE(GPU_PROCESS)
    using SupportsMediaTypeFunc = Function<bool(MediaType)>;
    using CanDecodeTypeFunc = Function<bool(const String&)>;
    using CreateImageDecoderFunc = Function<RefPtr<ImageDecoder>(FragmentedSharedBuffer&, const String&, AlphaOption, GammaAndColorProfileOption)>;

    struct ImageDecoderFactory {
        SupportsMediaTypeFunc supportsMediaType;
        CanDecodeTypeFunc canDecodeType;
        CreateImageDecoderFunc createImageDecoder;
    };

    WEBCORE_EXPORT static void installFactory(ImageDecoderFactory&&);
    WEBCORE_EXPORT static void resetFactories();
    WEBCORE_EXPORT static void clearFactories();
#endif

    virtual size_t bytesDecodedToDetermineProperties() const = 0;

    virtual EncodedDataStatus encodedDataStatus() const = 0;
    virtual void setEncodedDataStatusChangeCallback(Function<void(EncodedDataStatus)>&&) { }
    virtual bool isSizeAvailable() const { return encodedDataStatus() >= EncodedDataStatus::SizeAvailable; }
    virtual IntSize size() const = 0;
    virtual size_t frameCount() const = 0;
    virtual size_t primaryFrameIndex() const { return 0; }
    virtual RepetitionCount repetitionCount() const = 0;
    virtual String uti() const { return emptyString(); }
    virtual String filenameExtension() const = 0;
    virtual String accessibilityDescription() const { return emptyString(); };
    virtual std::optional<IntPoint> hotSpot() const = 0;

#if ENABLE(QUICKLOOK_FULLSCREEN)
    virtual bool shouldUseQuickLookForFullscreen() const { return false; }
#endif

#if ENABLE(SPATIAL_IMAGE_DETECTION)
    virtual bool isSpatial() const { return false; }
#endif

    virtual IntSize frameSizeAtIndex(size_t, SubsamplingLevel = SubsamplingLevel::Default) const = 0;
    virtual bool frameIsCompleteAtIndex(size_t) const = 0;
    virtual ImageOrientation frameOrientationAtIndex(size_t) const { return ImageOrientation::Orientation::None; }
    virtual std::optional<IntSize> frameDensityCorrectedSizeAtIndex(size_t) const { return std::nullopt; }

    virtual Seconds frameDurationAtIndex(size_t) const = 0;
    virtual bool frameHasAlphaAtIndex(size_t) const = 0;
    virtual unsigned frameBytesAtIndex(size_t, SubsamplingLevel = SubsamplingLevel::Default) const = 0;

    WEBCORE_EXPORT virtual bool fetchFrameMetaDataAtIndex(size_t, SubsamplingLevel, const DecodingOptions&, ImageFrame&) const;

    virtual PlatformImagePtr createFrameImageAtIndex(size_t, SubsamplingLevel = SubsamplingLevel::Default, const DecodingOptions& = DecodingOptions(DecodingMode::Synchronous)) = 0;

    virtual void setExpectedContentSize(long long) { }
    virtual void setData(const FragmentedSharedBuffer&, bool allDataReceived) = 0;
    virtual bool isAllDataReceived() const = 0;
    virtual void clearFrameBufferCache(size_t) = 0;

protected:
    WEBCORE_EXPORT ImageDecoder();
};

} // namespace WebCore
