/*
 * Copyright (C) 2015-2022 Apple Inc. All rights reserved.
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

#if ENABLE(MEDIA_STREAM)

#include "ImageBuffer.h"
#include "MockMediaDevice.h"
#include "RealtimeMediaSourceFactory.h"
#include <wtf/RunLoop.h>
#include <wtf/WorkQueue.h>

namespace WebCore {

class MockRealtimeAudioSource : public RealtimeMediaSource, public ThreadSafeRefCountedAndCanMakeThreadSafeWeakPtr<MockRealtimeAudioSource, WTF::DestructionThread::MainRunLoop> {
public:
    static CaptureSourceOrError create(String&& deviceID, AtomString&& name, MediaDeviceHashSalts&&, const MediaConstraints*, std::optional<PageIdentifier>);
    virtual ~MockRealtimeAudioSource();

    static void setIsInterrupted(bool);

    WEBCORE_EXPORT void setChannelCount(unsigned);

    WTF_ABSTRACT_THREAD_SAFE_REF_COUNTED_AND_CAN_MAKE_WEAK_PTR_IMPL;

protected:
    MockRealtimeAudioSource(String&& deviceID, AtomString&& name, MediaDeviceHashSalts&&, std::optional<PageIdentifier>);

    virtual void render(Seconds) = 0;
    void settingsDidChange(OptionSet<RealtimeMediaSourceSettings::Flag>) override;

    static Seconds renderInterval() { return 60_ms; }

private:
    friend class MockRealtimeAudioSourceGStreamer;

    const RealtimeMediaSourceCapabilities& capabilities() final;
    const RealtimeMediaSourceSettings& settings() final;

    void startProducingData() override;
    void stopProducingData() override;

    bool isCaptureSource() const final { return true; }
    CaptureDevice::DeviceType deviceType() const final { return CaptureDevice::DeviceType::Microphone; }

    void delaySamples(Seconds) final;
    bool isMockSource() const final { return true; }

    void tick();

protected:
    Ref<WorkQueue> m_workQueue;
    unsigned m_channelCount { 2 };

private:
    std::optional<RealtimeMediaSourceCapabilities> m_capabilities;
    std::optional<RealtimeMediaSourceSettings> m_currentSettings;
    RealtimeMediaSourceSupportedConstraints m_supportedConstraints;

    RunLoop::Timer m_timer;
    MonotonicTime m_startTime { MonotonicTime::nan() };
    MonotonicTime m_lastRenderTime { MonotonicTime::nan() };
    Seconds m_elapsedTime { 0_s };
    MonotonicTime m_delayUntil;
    MockMediaDevice m_device;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::MockRealtimeAudioSource)
    static bool isType(const WebCore::RealtimeMediaSource& source) { return source.isCaptureSource() && source.isMockSource() && source.deviceType() == WebCore::CaptureDevice::DeviceType::Microphone; }
SPECIALIZE_TYPE_TRAITS_END()


#endif // ENABLE(MEDIA_STREAM)
