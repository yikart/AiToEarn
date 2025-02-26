/*
 * Copyright (C) 2017-2019 Apple Inc. All rights reserved.
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
 * 3. Neither the name of Ericsson nor the names of its contributors
 *    may be used to endorse or promote products derived from this
 *    software without specific prior written permission.
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

#include "LibWebRTCMacros.h"
#include "RealtimeMediaSource.h"

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN
ALLOW_UNUSED_PARAMETERS_BEGIN
ALLOW_COMMA_BEGIN

#include <webrtc/api/media_stream_interface.h>

ALLOW_UNUSED_PARAMETERS_END
ALLOW_COMMA_END
WTF_ALLOW_UNSAFE_BUFFER_USAGE_END

#include <wtf/RetainPtr.h>

namespace WebCore {

class CaptureDevice;
class FrameRateMonitor;

class RealtimeIncomingVideoSource
    : public RealtimeMediaSource
    , private rtc::VideoSinkInterface<webrtc::VideoFrame>
    , private webrtc::ObserverInterface
    , public ThreadSafeRefCountedAndCanMakeThreadSafeWeakPtr<RealtimeIncomingVideoSource, WTF::DestructionThread::MainRunLoop>
{
public:
    static Ref<RealtimeIncomingVideoSource> create(rtc::scoped_refptr<webrtc::VideoTrackInterface>&&, String&&);
    ~RealtimeIncomingVideoSource();
    WTF_ABSTRACT_THREAD_SAFE_REF_COUNTED_AND_CAN_MAKE_WEAK_PTR_IMPL;

    void enableFrameRatedMonitoring();

protected:
    RealtimeIncomingVideoSource(rtc::scoped_refptr<webrtc::VideoTrackInterface>&&, String&&);

#if !RELEASE_LOG_DISABLED
    ASCIILiteral logClassName() const final { return "RealtimeIncomingVideoSource"_s; }
#endif

    static VideoFrameTimeMetadata metadataFromVideoFrame(const webrtc::VideoFrame&);

    void notifyNewFrame();

private:
    // RealtimeMediaSource API
    void startProducingData() final;
    void stopProducingData()  final;
    void settingsDidChange(OptionSet<RealtimeMediaSourceSettings::Flag>) final;

    const RealtimeMediaSourceCapabilities& capabilities() final;
    const RealtimeMediaSourceSettings& settings() final;

    bool isIncomingVideoSource() const final { return true; }

    // webrtc::ObserverInterface API
    void OnChanged() final;

    std::optional<RealtimeMediaSourceSettings> m_currentSettings;
    rtc::scoped_refptr<webrtc::VideoTrackInterface> m_videoTrack;

    double m_currentFrameRate { -1 };
    std::unique_ptr<FrameRateMonitor> m_frameRateMonitor;
#if !RELEASE_LOG_DISABLED
    bool m_enableFrameRatedMonitoringLogging { false };
    mutable RefPtr<const Logger> m_logger;
    uint64_t m_logIdentifier { 0 };
#endif
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::RealtimeIncomingVideoSource)
static bool isType(const WebCore::RealtimeMediaSource& source) { return source.isIncomingVideoSource(); }
SPECIALIZE_TYPE_TRAITS_END()

#endif // USE(LIBWEBRTC)
