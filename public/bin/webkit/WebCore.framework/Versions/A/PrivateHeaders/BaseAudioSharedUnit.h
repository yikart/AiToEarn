/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

#if ENABLE(MEDIA_STREAM)

#include "RealtimeMediaSourceCapabilities.h"
#include "RealtimeMediaSourceCenter.h"
#include "Timer.h"
#include <wtf/CheckedPtr.h>
#include <wtf/Function.h>
#include <wtf/HashSet.h>
#include <wtf/Lock.h>
#include <wtf/MediaTime.h>
#include <wtf/WeakPtr.h>
#include <wtf/text/WTFString.h>

namespace WebCore {
class BaseAudioSharedUnit;
}

namespace WebCore {

class AudioStreamDescription;
class CaptureDevice;
class CoreAudioCaptureSource;
class PlatformAudioData;

class BaseAudioSharedUnit : public RefCounted<BaseAudioSharedUnit>, public RealtimeMediaSourceCenterObserver {
public:
    virtual ~BaseAudioSharedUnit();

    void ref() const final { RefCounted::ref(); }
    void deref() const final { RefCounted::deref(); }

    void startProducingData();
    void stopProducingData();
    WEBCORE_EXPORT void reconfigure();
    virtual bool isProducingData() const = 0;

    virtual void delaySamples(Seconds) { }
    virtual void prewarmAudioUnitCreation(CompletionHandler<void()>&& callback) { callback(); };

    void prepareForNewCapture();

    OSStatus resume();
    OSStatus suspend();

    bool isSuspended() const { return m_suspended; }

    double volume() const { return m_volume; }
    int sampleRate() const { return m_sampleRate; }
    bool enableEchoCancellation() const { return m_enableEchoCancellation; }

    void setVolume(double volume) { m_volume = volume; }
    void setSampleRate(int sampleRate) { m_sampleRate = sampleRate; }
    void setEnableEchoCancellation(bool enableEchoCancellation) { m_enableEchoCancellation = enableEchoCancellation; }

    void addClient(CoreAudioCaptureSource&);
    void removeClient(CoreAudioCaptureSource&);
    void clearClients();

    virtual bool hasAudioUnit() const = 0;
    void setCaptureDevice(String&&, uint32_t, bool isDefault);

    virtual LongCapabilityRange sampleRateCapacities() const = 0;
    virtual int actualSampleRate() const { return sampleRate(); }

    bool isRenderingAudio() const { return m_isRenderingAudio; }
    bool hasClients() const { return !m_clients.isEmptyIgnoringNullReferences(); }

    const String& persistentIDForTesting() const { return m_capturingDevice ? m_capturingDevice->first : emptyString(); }

    void handleNewCurrentMicrophoneDevice(CaptureDevice&&);

    uint32_t captureDeviceID() const { return m_capturingDevice ? m_capturingDevice->second : 0; }

protected:
    BaseAudioSharedUnit();

    void forEachClient(const Function<void(CoreAudioCaptureSource&)>&) const;
    void captureFailed();
    void continueStartProducingData();

    virtual void cleanupAudioUnit() = 0;
    virtual OSStatus startInternal() = 0;
    virtual void stopInternal() = 0;
    virtual OSStatus reconfigureAudioUnit() = 0;
    virtual void resetSampleRate() = 0;
    virtual void captureDeviceChanged() = 0;

    void setSuspended(bool value) { m_suspended = value; }

    void audioSamplesAvailable(const MediaTime&, const PlatformAudioData&, const AudioStreamDescription&, size_t /*numberOfFrames*/);

    const String& persistentID() const { return m_capturingDevice ? m_capturingDevice->first : emptyString(); }

    void setIsRenderingAudio(bool);

protected:
    void setIsProducingMicrophoneSamples(bool);
    bool isProducingMicrophoneSamples() const { return m_isProducingMicrophoneSamples; }
    void setOutputDeviceID(uint32_t deviceID) { m_outputDeviceID = deviceID; }

    virtual void isProducingMicrophoneSamplesChanged() { }
    virtual void validateOutputDevice(uint32_t /* currentOutputDeviceID */) { }
    virtual bool migrateToNewDefaultDevice(const CaptureDevice&) { return false; }

    void setVoiceActivityListenerCallback(Function<void()>&& callback) { m_voiceActivityCallback = WTFMove(callback); }
    bool hasVoiceActivityListenerCallback() const { return !!m_voiceActivityCallback; }
    void voiceActivityDetected();

    void disableVoiceActivityThrottleTimerForTesting() { m_voiceActivityThrottleTimer.stop(); }
    void stopRunning();

    bool isCapturingWithDefaultMicrophone() const { return m_isCapturingWithDefaultMicrophone; }

private:
    OSStatus startUnit();
    bool shouldContinueRunning() const { return m_producingCount || m_isRenderingAudio || hasClients(); }

    virtual void willChangeCaptureDevice() { };

    // RealtimeMediaSourceCenterObserver
    void devicesChanged() final;
    void deviceWillBeRemoved(const String&) final { }

    bool m_enableEchoCancellation { true };
    double m_volume { 1 };
    int m_sampleRate;
    bool m_suspended { false };
    bool m_needsReconfiguration { false };
    bool m_isRenderingAudio { false };

    int32_t m_producingCount { 0 };

    uint32_t m_outputDeviceID { 0 };
    std::optional<std::pair<String, uint32_t>> m_capturingDevice;

    ThreadSafeWeakHashSet<CoreAudioCaptureSource> m_clients;
    Vector<ThreadSafeWeakPtr<CoreAudioCaptureSource>> m_audioThreadClients WTF_GUARDED_BY_LOCK(m_audioThreadClientsLock);
    Lock m_audioThreadClientsLock;

    bool m_isCapturingWithDefaultMicrophone { false };
    bool m_isProducingMicrophoneSamples { true };
    Function<void()> m_voiceActivityCallback;
    Timer m_voiceActivityThrottleTimer;
};

} // namespace WebCore

#endif // ENABLE(MEDIA_STREAM)
