/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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

#if HAVE(AVASSETREADER)

#include "ImageDecoder.h"
#include "ProcessIdentity.h"
#include "SampleMap.h"
#include <wtf/Lock.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>
#include <wtf/text/WTFString.h>

OBJC_CLASS AVAssetTrack;
OBJC_CLASS AVAssetReader;
OBJC_CLASS AVURLAsset;
OBJC_CLASS WebCoreSharedBufferResourceLoaderDelegate;
typedef struct opaqueCMSampleBuffer* CMSampleBufferRef;

namespace WTF {
class MediaTime;
}

namespace WebCore {

class ContentType;
class ImageDecoderAVFObjCSample;
class ImageRotationSessionVT;
class PixelBufferConformerCV;
class WebCoreDecompressionSession;

class ImageDecoderAVFObjC : public ImageDecoder {
    WTF_MAKE_TZONE_ALLOCATED(ImageDecoderAVFObjC);
public:
    WEBCORE_EXPORT static RefPtr<ImageDecoderAVFObjC> create(const FragmentedSharedBuffer&, const String& mimeType, AlphaOption, GammaAndColorProfileOption, ProcessIdentity resourceOwner);
    virtual ~ImageDecoderAVFObjC();

    WEBCORE_EXPORT static bool supportsMediaType(MediaType);
    static bool supportsContainerType(const String&);

    size_t bytesDecodedToDetermineProperties() const override { return 0; }
    WEBCORE_EXPORT static bool canDecodeType(const String& mimeType);

    const String& mimeType() const { return m_mimeType; }

    WEBCORE_EXPORT void setEncodedDataStatusChangeCallback(Function<void(EncodedDataStatus)>&&) final;
    EncodedDataStatus encodedDataStatus() const final;
    WEBCORE_EXPORT IntSize size() const final;
    WEBCORE_EXPORT size_t frameCount() const final;
    RepetitionCount repetitionCount() const final;
    String uti() const final;
    String filenameExtension() const final;
    std::optional<IntPoint> hotSpot() const final { return std::nullopt; }
    String accessibilityDescription() const final { return String(); }

    IntSize frameSizeAtIndex(size_t, SubsamplingLevel = SubsamplingLevel::Default) const final;
    bool frameIsCompleteAtIndex(size_t) const final;

    Seconds frameDurationAtIndex(size_t) const final;
    bool frameHasAlphaAtIndex(size_t) const final;
    unsigned frameBytesAtIndex(size_t, SubsamplingLevel = SubsamplingLevel::Default) const final;

    WEBCORE_EXPORT PlatformImagePtr createFrameImageAtIndex(size_t, SubsamplingLevel = SubsamplingLevel::Default, const DecodingOptions& = DecodingOptions(DecodingMode::Synchronous)) final;

    WEBCORE_EXPORT void setExpectedContentSize(long long) final;
    WEBCORE_EXPORT void setData(const FragmentedSharedBuffer&, bool allDataReceived) final;
    bool isAllDataReceived() const final { return m_isAllDataReceived; }
    WEBCORE_EXPORT void clearFrameBufferCache(size_t) final;

    bool hasTrack() const { return !!m_track; }
    WEBCORE_EXPORT Vector<ImageDecoder::FrameInfo> frameInfos() const;

private:
    ImageDecoderAVFObjC(const FragmentedSharedBuffer&, const String& mimeType, AlphaOption, GammaAndColorProfileOption, ProcessIdentity resourceOwner);

    AVAssetTrack *firstEnabledTrack();
    void readSamples();
    void readTrackMetadata();
    bool storeSampleBuffer(CMSampleBufferRef);
    void advanceCursor();
    void setTrack(AVAssetTrack *);

    const ImageDecoderAVFObjCSample* sampleAtIndex(size_t) const;
    bool sampleIsComplete(const ImageDecoderAVFObjCSample&) const;

    String m_mimeType;
    String m_uti;
    RetainPtr<AVURLAsset> m_asset;
    RetainPtr<AVAssetTrack> m_track;
    RetainPtr<WebCoreSharedBufferResourceLoaderDelegate> m_loader;
    std::unique_ptr<ImageRotationSessionVT> m_imageRotationSession;
    Ref<WebCoreDecompressionSession> m_decompressionSession;
    Function<void(EncodedDataStatus)> m_encodedDataStatusChangedCallback;

    SampleMap m_sampleData;
    DecodeOrderSampleMap::iterator m_cursor;
    Lock m_sampleGeneratorLock;
    bool m_isAllDataReceived { false };
    std::optional<IntSize> m_size;
    ProcessIdentity m_resourceOwner;
};

}
#endif
