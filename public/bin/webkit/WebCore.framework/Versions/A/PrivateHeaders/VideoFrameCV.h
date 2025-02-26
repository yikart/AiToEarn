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

#if ENABLE(VIDEO) && USE(AVFOUNDATION)

#include "ImageOrientation.h"
#include "VideoFrame.h"
#include <wtf/ArgumentCoder.h>
#include <wtf/RetainPtr.h>

using CMSampleBufferRef = struct opaqueCMSampleBuffer*;

namespace WebCore {

class PixelBuffer;

class VideoFrameCV : public VideoFrame {
public:
    WEBCORE_EXPORT static Ref<VideoFrameCV> create(MediaTime presentationTime, bool isMirrored, Rotation, RetainPtr<CVPixelBufferRef>&&, std::optional<PlatformVideoColorSpace>&& = { });
    WEBCORE_EXPORT static Ref<VideoFrameCV> create(CMSampleBufferRef, bool isMirrored, Rotation);
    WEBCORE_EXPORT ~VideoFrameCV();

    CVPixelBufferRef pixelBuffer() const final { return m_pixelBuffer.get(); }
    ImageOrientation orientation() const;

    // VideoFrame overrides.
    WEBCORE_EXPORT WebCore::IntSize presentationSize() const final;
    WEBCORE_EXPORT uint32_t pixelFormat() const final;
    WEBCORE_EXPORT void setOwnershipIdentity(const ProcessIdentity&) final;
    bool isCV() const final { return true; }

private:
    friend struct IPC::ArgumentCoder<VideoFrameCV, void>;
    WEBCORE_EXPORT VideoFrameCV(MediaTime presentationTime, bool isMirrored, Rotation, RetainPtr<CVPixelBufferRef>&&, std::optional<PlatformVideoColorSpace>&&);
    VideoFrameCV(MediaTime presentationTime, bool isMirrored, Rotation, RetainPtr<CVPixelBufferRef>&&, PlatformVideoColorSpace&&);

    Ref<VideoFrame> clone() final;

    const RetainPtr<CVPixelBufferRef> m_pixelBuffer;
};

}

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::VideoFrameCV)
    static bool isType(const WebCore::VideoFrame& videoFrame) { return videoFrame.isCV(); }
SPECIALIZE_TYPE_TRAITS_END()

#endif
