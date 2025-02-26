/*
 * Copyright (C) 2016-2024 Apple Inc. All rights reserved.
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

#include "ImageDecoder.h"
#include <atomic>
#include <wtf/TZoneMalloc.h>

#if USE(CG)

namespace WebCore {

class SharedBuffer;

class ImageDecoderCG final : public ImageDecoder {
    WTF_MAKE_TZONE_ALLOCATED(ImageDecoderCG);
public:
    ImageDecoderCG(FragmentedSharedBuffer& data, AlphaOption, GammaAndColorProfileOption);

    static Ref<ImageDecoderCG> create(FragmentedSharedBuffer& data, AlphaOption alphaOption, GammaAndColorProfileOption gammaAndColorProfileOption)
    {
        return adoptRef(*new ImageDecoderCG(data, alphaOption, gammaAndColorProfileOption));
    }

    static bool supportsMediaType(MediaType type) { return type == MediaType::Image; }
    static bool canDecodeType(const String&);

    size_t bytesDecodedToDetermineProperties() const final;

    EncodedDataStatus encodedDataStatus() const final;
    IntSize size() const final { return IntSize(); }
    size_t frameCount() const final;
    size_t primaryFrameIndex() const final;
    RepetitionCount repetitionCount() const final;
    String uti() const final { return m_uti; }
    String filenameExtension() const final;
    String accessibilityDescription() const final;
    std::optional<IntPoint> hotSpot() const final;

    IntSize frameSizeAtIndex(size_t, SubsamplingLevel = SubsamplingLevel::Default) const final;
    bool frameIsCompleteAtIndex(size_t) const final;
    ImageOrientation frameOrientationAtIndex(size_t) const final;
    std::optional<IntSize> frameDensityCorrectedSizeAtIndex(size_t) const final;

    Seconds frameDurationAtIndex(size_t) const final;
    bool frameHasAlphaAtIndex(size_t) const final;
    unsigned frameBytesAtIndex(size_t, SubsamplingLevel = SubsamplingLevel::Default) const final;

    bool fetchFrameMetaDataAtIndex(size_t, SubsamplingLevel, const DecodingOptions&, ImageFrame&) const final;

    PlatformImagePtr createFrameImageAtIndex(size_t, SubsamplingLevel = SubsamplingLevel::Default, const DecodingOptions& = DecodingOptions(DecodingMode::Synchronous)) final;

    void setData(const FragmentedSharedBuffer&, bool allDataReceived) final;
    bool isAllDataReceived() const final { return m_isAllDataReceived; }
    void clearFrameBufferCache(size_t) final { }

    static String decodeUTI(CGImageSourceRef, const SharedBuffer&);

private:
    bool hasAlpha() const;
    String decodeUTI(const SharedBuffer&) const;

#if ENABLE(QUICKLOOK_FULLSCREEN)
    bool isSpatial() const;
    bool isMaybePanoramic() const;
    bool shouldUseQuickLookForFullscreen() const;
#endif

    bool m_isAllDataReceived { false };
    std::atomic<bool> m_isXBitmapImage { false };
    mutable EncodedDataStatus m_encodedDataStatus { EncodedDataStatus::Unknown };
    String m_uti;
    RetainPtr<CGImageSourceRef> m_nativeDecoder;
};

} // namespace WebCore

#endif // USE(CG)
