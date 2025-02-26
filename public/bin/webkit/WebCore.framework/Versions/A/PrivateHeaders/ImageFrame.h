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

#include "Color.h"
#include "DecodingOptions.h"
#include "ImageOrientation.h"
#include "ImageTypes.h"
#include "IntSize.h"
#include "NativeImage.h"
#include <wtf/Seconds.h>

// X11 headers define a bunch of macros with common terms, interfering with WebCore and WTF enum values.
// As a workaround, we explicitly undef them here.
#if defined(None)
#undef None
#endif

namespace WebCore {

class ImageFrame {
    friend class BitmapImageSource;
    friend class ImageDecoder;
    friend class ImageDecoderCG;
public:
    enum class Caching { Metadata, MetadataAndImage };

    ImageFrame();
    ImageFrame(Ref<NativeImage>&&);
    ImageFrame(const ImageFrame& other) { operator=(other); }

    ~ImageFrame();

    static const ImageFrame& defaultFrame();

    ImageFrame& operator=(const ImageFrame& other);

    unsigned clearImage();
    unsigned clear();

    void setDecodingStatus(DecodingStatus);
    DecodingStatus decodingStatus() const;

    bool isInvalid() const { return m_decodingStatus == DecodingStatus::Invalid; }
    bool isPartial() const { return m_decodingStatus == DecodingStatus::Partial; }
    bool isComplete() const { return m_decodingStatus == DecodingStatus::Complete; }

    void setSize(const IntSize& size) { m_size = size; }
    IntSize size() const { return m_size; }

    unsigned frameBytes() const { return hasNativeImage() ? (size().area() * sizeof(uint32_t)).value() : 0; }
    SubsamplingLevel subsamplingLevel() const { return m_subsamplingLevel; }
    DecodingOptions decodingOptions() const { return m_decodingOptions; }

    RefPtr<NativeImage> nativeImage() const { return m_nativeImage; }

    void setOrientation(ImageOrientation orientation) { m_orientation = orientation; };
    ImageOrientation orientation() const { return m_orientation; }

    void setHeadroom(Headroom headroom) { m_headroom = headroom; };
    Headroom headroom() const { return m_headroom; }

    void setDensityCorrectedSize(const IntSize& size) { m_densityCorrectedSize = size; }
    std::optional<IntSize> densityCorrectedSize() const { return m_densityCorrectedSize; }

    void setDuration(const Seconds& duration) { m_duration = duration; }
    Seconds duration() const { return m_duration; }

    void setHasAlpha(bool hasAlpha) { m_hasAlpha = hasAlpha; }
    bool hasAlpha() const { return !hasMetadata() || m_hasAlpha; }

    bool hasNativeImage(const std::optional<SubsamplingLevel>& = { }) const;
    bool hasFullSizeNativeImage(const std::optional<SubsamplingLevel>& = { }) const;
    bool hasDecodedNativeImageCompatibleWithOptions(const std::optional<SubsamplingLevel>&, const DecodingOptions&) const;
    bool hasMetadata() const { return !size().isEmpty(); }

private:
    DecodingStatus m_decodingStatus { DecodingStatus::Invalid };
    IntSize m_size;

    RefPtr<NativeImage> m_nativeImage;
    SubsamplingLevel m_subsamplingLevel { SubsamplingLevel::Default };
    DecodingOptions m_decodingOptions { DecodingMode::Auto };

    ImageOrientation m_orientation { ImageOrientation::Orientation::None };
    Headroom m_headroom { Headroom::None };
    std::optional<IntSize> m_densityCorrectedSize;
    Seconds m_duration;
    bool m_hasAlpha { true };
};

} // namespace WebCore
