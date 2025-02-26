/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer
 *    in the documentation and/or other materials provided with the
 *    distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#if USE(LIBWEBRTC)

#include "RealtimeIncomingVideoSource.h"

using CVPixelBufferPoolRef = struct __CVPixelBufferPool*;
using CVPixelBufferRef = struct __CVBuffer*;

namespace webrtc {
enum class BufferType;
};

namespace WebCore {

enum class VideoFrameRotation : uint16_t;

class RealtimeIncomingVideoSourceCocoa final : public RealtimeIncomingVideoSource {
public:
    static Ref<RealtimeIncomingVideoSourceCocoa> create(rtc::scoped_refptr<webrtc::VideoTrackInterface>&&, String&&);

private:
    RealtimeIncomingVideoSourceCocoa(rtc::scoped_refptr<webrtc::VideoTrackInterface>&&, String&&);
    RetainPtr<CVPixelBufferRef> pixelBufferFromVideoFrame(const webrtc::VideoFrame&);
    CVPixelBufferPoolRef pixelBufferPool(size_t width, size_t height, webrtc::BufferType);
    RefPtr<VideoFrame> toVideoFrame(const webrtc::VideoFrame&, VideoFrameRotation);
    Ref<VideoFrame> createVideoSampleFromCVPixelBuffer(RetainPtr<CVPixelBufferRef>&&, VideoFrameRotation, int64_t);

    // rtc::VideoSinkInterface
    void OnFrame(const webrtc::VideoFrame&) final;

    RetainPtr<CVPixelBufferRef> m_blackFrame;
    int m_blackFrameWidth { 0 };
    int m_blackFrameHeight { 0 };
#if !RELEASE_LOG_DISABLED
    size_t m_numberOfFrames { 0 };
#endif
    Lock m_pixelBufferPoolLock;
    RetainPtr<CVPixelBufferPoolRef> m_pixelBufferPool WTF_GUARDED_BY_LOCK(m_pixelBufferPoolLock);
    size_t m_pixelBufferPoolWidth { 0 };
    size_t m_pixelBufferPoolHeight { 0 };
    webrtc::BufferType m_pixelBufferPoolBufferType;
};

} // namespace WebCore

#endif // USE(LIBWEBRTC)
