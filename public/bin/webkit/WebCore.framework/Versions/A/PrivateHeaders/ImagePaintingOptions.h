/*
 * Copyright (C) 2019-2024 Apple Inc.  All rights reserved.
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

#include "DecodingOptions.h"
#include "GraphicsTypes.h"
#include "ImageOrientation.h"
#include "ImageTypes.h"
#include <initializer_list>
#include <wtf/Forward.h>

namespace WebCore {

struct ImagePaintingOptions {
    template<typename Type> static constexpr bool isOptionType =
        std::is_same_v<Type, CompositeOperator>
        || std::is_same_v<Type, BlendMode>
        || std::is_same_v<Type, DecodingMode>
        || std::is_same_v<Type, ImageOrientation>
        || std::is_same_v<Type, ImageOrientation::Orientation>
        || std::is_same_v<Type, InterpolationQuality>
        || std::is_same_v<Type, AllowImageSubsampling>
#if USE(SKIA)
        || std::is_same_v<Type, StrictImageClamping>
#endif
        || std::is_same_v<Type, ShowDebugBackground>
        || std::is_same_v<Type, Headroom>;

    // This is a single-argument initializer to support pattern of
    // ImageDrawResult drawImage(..., ImagePaintingOptions = { ImageOrientation::Orientation::FromImage });
    // Should be removed once the pattern is not so prevalent.
    template<typename T, typename = std::enable_if_t<isOptionType<std::decay_t<T>>>>
    ImagePaintingOptions(std::initializer_list<T> options)
    {
        for (auto& option : options)
            setOption(option);
    }
    template<typename T, typename = std::enable_if_t<isOptionType<std::decay_t<T>>>>
    explicit ImagePaintingOptions(T option)
    {
        setOption(option);
    }

    template<typename T, typename U, typename... Rest, typename = std::enable_if_t<isOptionType<std::decay_t<T>>>>
    ImagePaintingOptions(T first, U second, Rest... rest)
    {
        setOption(first);
        setOption(second);
        (setOption(rest), ...);
    }

    template<typename... Overrides>
    ImagePaintingOptions(const ImagePaintingOptions& other, Overrides... overrides)
        : ImagePaintingOptions(other)
    {
        (setOption(overrides), ...);
    }

    ImagePaintingOptions() = default;
    ImagePaintingOptions(const ImagePaintingOptions&) = default;
    ImagePaintingOptions(ImagePaintingOptions&&) = default;
    ImagePaintingOptions& operator=(const ImagePaintingOptions&) = default;
    ImagePaintingOptions& operator=(ImagePaintingOptions&&) = default;

    CompositeOperator compositeOperator() const { return m_compositeOperator; }
    BlendMode blendMode() const { return m_blendMode; }
    DecodingMode decodingMode() const { return m_decodingMode; }
    ImageOrientation orientation() const { return m_orientation; }
    InterpolationQuality interpolationQuality() const { return m_interpolationQuality; }
    AllowImageSubsampling allowImageSubsampling() const { return m_allowImageSubsampling; }
#if USE(SKIA)
    StrictImageClamping strictImageClamping() const { return m_strictImageClamping; }
#endif
    ShowDebugBackground showDebugBackground() const { return m_showDebugBackground; }
    Headroom headroom() const { return m_headroom; }

private:
    void setOption(CompositeOperator compositeOperator) { m_compositeOperator = compositeOperator; }
    void setOption(BlendMode blendMode) { m_blendMode = blendMode; }
    void setOption(DecodingMode decodingMode) { m_decodingMode = decodingMode; }
    void setOption(ImageOrientation orientation) { m_orientation = orientation.orientation(); }
    void setOption(ImageOrientation::Orientation orientation) { m_orientation = orientation; }
    void setOption(InterpolationQuality interpolationQuality) { m_interpolationQuality = interpolationQuality; }
    void setOption(AllowImageSubsampling allowImageSubsampling) { m_allowImageSubsampling = allowImageSubsampling; }
#if USE(SKIA)
    void setOption(StrictImageClamping strictImageClamping) { m_strictImageClamping = strictImageClamping; }
#endif
    void setOption(ShowDebugBackground showDebugBackground) { m_showDebugBackground = showDebugBackground; }
    void setOption(Headroom headroom) { m_headroom = headroom; }

    BlendMode m_blendMode : 5 { BlendMode::Normal };
    DecodingMode m_decodingMode : 3 { DecodingMode::Synchronous };
    CompositeOperator m_compositeOperator : 4 { CompositeOperator::SourceOver };
    ImageOrientation::Orientation m_orientation : 4 { ImageOrientation::Orientation::None };
    InterpolationQuality m_interpolationQuality : 4 { InterpolationQuality::Default };
    AllowImageSubsampling m_allowImageSubsampling : 1 { AllowImageSubsampling::No };
#if USE(SKIA)
    StrictImageClamping m_strictImageClamping: 1 { StrictImageClamping::Yes };
#endif
    ShowDebugBackground m_showDebugBackground : 1 { ShowDebugBackground::No };
    Headroom m_headroom { Headroom::FromImage };
};

WEBCORE_EXPORT TextStream& operator<<(TextStream&, ImagePaintingOptions);

} // namespace WebCore
