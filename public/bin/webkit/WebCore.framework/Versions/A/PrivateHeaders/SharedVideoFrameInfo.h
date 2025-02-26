/*
 * Copyright (C) 2022 Apple Inc. All rights reserved.
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

#if ENABLE(VIDEO) && PLATFORM(COCOA)

#include <span>
#include <wtf/RetainPtr.h>

typedef struct __CVBuffer* CVPixelBufferRef;
typedef struct __CVPixelBufferPool* CVPixelBufferPoolRef;

namespace webrtc {
class VideoFrameBuffer;
}

namespace WebCore {

class SharedVideoFrameInfo {
public:
    SharedVideoFrameInfo() = default;
    SharedVideoFrameInfo(OSType, uint32_t width, uint32_t height, uint32_t bytesPerRow, uint32_t widthPlaneB = 0, uint32_t heightPlaneB = 0, uint32_t bytesPerRowPlaneB = 0, uint32_t bytesPerRowPlaneA = 0);

    WEBCORE_EXPORT void encode(std::span<uint8_t>);
    WEBCORE_EXPORT static std::optional<SharedVideoFrameInfo> decode(std::span<const uint8_t>);

    WEBCORE_EXPORT static SharedVideoFrameInfo fromCVPixelBuffer(CVPixelBufferRef);
    WEBCORE_EXPORT bool writePixelBuffer(CVPixelBufferRef, std::span<uint8_t> data);

#if USE(LIBWEBRTC)
    WEBCORE_EXPORT static SharedVideoFrameInfo fromVideoFrameBuffer(const webrtc::VideoFrameBuffer&);
    WEBCORE_EXPORT bool writeVideoFrameBuffer(webrtc::VideoFrameBuffer&, std::span<uint8_t> data);
#endif

    WEBCORE_EXPORT size_t storageSize() const;

    WEBCORE_EXPORT RetainPtr<CVPixelBufferRef> createPixelBufferFromMemory(std::span<const uint8_t> data, CVPixelBufferPoolRef = nullptr);

    WEBCORE_EXPORT bool isReadWriteSupported() const;
    WEBCORE_EXPORT RetainPtr<CVPixelBufferPoolRef> createCompatibleBufferPool() const;

    OSType bufferType() const { return m_bufferType; }
    uint32_t width() const { return m_width; };
    uint32_t height() const { return m_height; };

private:
    OSType m_bufferType { 0 };
    uint32_t m_width { 0 };
    uint32_t m_height { 0 };
    uint32_t m_bytesPerRow { 0 };
    uint32_t m_widthPlaneB { 0 };
    uint32_t m_heightPlaneB { 0 };
    uint32_t m_bytesPerRowPlaneB { 0 };
    uint32_t m_bytesPerRowPlaneAlpha { 0 };
    size_t m_storageSize { 0 };
};


static constexpr size_t SharedVideoFrameInfoEncodingLength = sizeof(SharedVideoFrameInfo);

inline SharedVideoFrameInfo::SharedVideoFrameInfo(OSType bufferType, uint32_t width, uint32_t height, uint32_t bytesPerRow, uint32_t widthPlaneB, uint32_t heightPlaneB, uint32_t bytesPerRowPlaneB, uint32_t bytesPerRowPlaneAlpha)
    : m_bufferType(bufferType)
    , m_width(width)
    , m_height(height)
    , m_bytesPerRow(bytesPerRow)
    , m_widthPlaneB(widthPlaneB)
    , m_heightPlaneB(heightPlaneB)
    , m_bytesPerRowPlaneB(bytesPerRowPlaneB)
    , m_bytesPerRowPlaneAlpha(bytesPerRowPlaneAlpha)
{
}

}

#endif // ENABLE(MEDIA_STREAM)
