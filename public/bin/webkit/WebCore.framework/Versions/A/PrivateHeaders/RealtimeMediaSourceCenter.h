/*
 * Copyright (C) 2011 Ericsson AB. All rights reserved.
 * Copyright (C) 2012 Google Inc. All rights reserved.
 * Copyright (C) 2013-2022 Apple Inc. All rights reserved.
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

#include "ExceptionOr.h"
#include "MediaStreamRequest.h"
#include "RealtimeMediaSource.h"
#include <wtf/AbstractRefCountedAndCanMakeWeakPtr.h>
#include <wtf/Function.h>
#include <wtf/RefPtr.h>
#include <wtf/RunLoop.h>
#include <wtf/text/WTFString.h>

#if PLATFORM(COCOA)
#include <pal/spi/cocoa/TCCSPI.h>
#include <wtf/OSObjectPtr.h>
#endif

namespace WebCore {

class CaptureDevice;
class CaptureDeviceManager;
class RealtimeMediaSourceSettings;
class TrackSourceInfo;

struct MediaConstraints;

class WEBCORE_EXPORT RealtimeMediaSourceCenterObserver : public AbstractRefCountedAndCanMakeWeakPtr<RealtimeMediaSourceCenterObserver> {
public:
    virtual ~RealtimeMediaSourceCenterObserver();

    virtual void devicesChanged() = 0;
    virtual void deviceWillBeRemoved(const String& persistentId) = 0;
};

class WEBCORE_EXPORT RealtimeMediaSourceCenter : public ThreadSafeRefCounted<RealtimeMediaSourceCenter, WTF::DestructionThread::MainRunLoop> {
public:
    ~RealtimeMediaSourceCenter();

    WEBCORE_EXPORT static RealtimeMediaSourceCenter& singleton();

    using ValidConstraintsHandler = Function<void(Vector<CaptureDevice>&& audioDeviceUIDs, Vector<CaptureDevice>&& videoDeviceUIDs)>;
    using InvalidConstraintsHandler = Function<void(MediaConstraintType)>;
    WEBCORE_EXPORT void validateRequestConstraints(ValidConstraintsHandler&&, InvalidConstraintsHandler&&, const MediaStreamRequest&, MediaDeviceHashSalts&&);

    using NewMediaStreamHandler = Function<void(Expected<Ref<MediaStreamPrivate>, CaptureSourceError>&&)>;
    void createMediaStream(Ref<const Logger>&&, NewMediaStreamHandler&&, MediaDeviceHashSalts&&, CaptureDevice&& audioDevice, CaptureDevice&& videoDevice, const MediaStreamRequest&);

    WEBCORE_EXPORT void getMediaStreamDevices(CompletionHandler<void(Vector<CaptureDevice>&&)>&&);
    WEBCORE_EXPORT std::optional<RealtimeMediaSourceCapabilities> getCapabilities(const CaptureDevice&);

    WEBCORE_EXPORT AudioCaptureFactory& audioCaptureFactory();
    WEBCORE_EXPORT void setAudioCaptureFactory(AudioCaptureFactory&);
    WEBCORE_EXPORT void unsetAudioCaptureFactory(AudioCaptureFactory&);

    WEBCORE_EXPORT VideoCaptureFactory& videoCaptureFactory();
    WEBCORE_EXPORT void setVideoCaptureFactory(VideoCaptureFactory&);
    WEBCORE_EXPORT void unsetVideoCaptureFactory(VideoCaptureFactory&);

    WEBCORE_EXPORT DisplayCaptureFactory& displayCaptureFactory();
    WEBCORE_EXPORT void setDisplayCaptureFactory(DisplayCaptureFactory&);
    WEBCORE_EXPORT void unsetDisplayCaptureFactory(DisplayCaptureFactory&);

    WEBCORE_EXPORT static String hashStringWithSalt(const String& id, const String& hashSalt);

    WEBCORE_EXPORT void addDevicesChangedObserver(RealtimeMediaSourceCenterObserver&);
    WEBCORE_EXPORT void removeDevicesChangedObserver(RealtimeMediaSourceCenterObserver&);

    void captureDevicesChanged();
    void captureDeviceWillBeRemoved(const String& persistentId);

    WEBCORE_EXPORT static bool shouldInterruptAudioOnPageVisibilityChange();

#if ENABLE(APP_PRIVACY_REPORT)
    void setIdentity(OSObjectPtr<tcc_identity_t>&& identity) { m_identity = WTFMove(identity); }
    OSObjectPtr<tcc_identity_t> identity() const { return m_identity; }
    bool hasIdentity() const { return !!m_identity; }
#endif

#if ENABLE(EXTENSION_CAPABILITIES)
    const String& currentMediaEnvironment() const;
    void setCurrentMediaEnvironment(String&&);
#endif

private:
    RealtimeMediaSourceCenter();
    friend class NeverDestroyed<RealtimeMediaSourceCenter>;

    AudioCaptureFactory& defaultAudioCaptureFactory();
    VideoCaptureFactory& defaultVideoCaptureFactory();
    DisplayCaptureFactory& defaultDisplayCaptureFactory();

    struct DeviceInfo {
        double fitnessScore;
        CaptureDevice device;
    };

    void getDisplayMediaDevices(const MediaStreamRequest&, MediaDeviceHashSalts&&, Vector<DeviceInfo>&, MediaConstraintType&);
    void getUserMediaDevices(const MediaStreamRequest&, MediaDeviceHashSalts&&, Vector<DeviceInfo>& audioDevices, Vector<DeviceInfo>& videoDevices, MediaConstraintType&);
    void validateRequestConstraintsAfterEnumeration(ValidConstraintsHandler&&, InvalidConstraintsHandler&&, const MediaStreamRequest&, MediaDeviceHashSalts&&);
    void enumerateDevices(bool shouldEnumerateCamera, bool shouldEnumerateDisplay, bool shouldEnumerateMicrophone, bool shouldEnumerateSpeakers, CompletionHandler<void()>&&);

    RunLoop::Timer m_debounceTimer;
    void triggerDevicesChangedObservers();

    WeakHashSet<RealtimeMediaSourceCenterObserver> m_observers;

    AudioCaptureFactory* m_audioCaptureFactoryOverride { nullptr };
    VideoCaptureFactory* m_videoCaptureFactoryOverride { nullptr };
    DisplayCaptureFactory* m_displayCaptureFactoryOverride { nullptr };

    bool m_shouldInterruptAudioOnPageVisibilityChange { false };

#if ENABLE(APP_PRIVACY_REPORT)
    OSObjectPtr<tcc_identity_t> m_identity;
#endif

#if ENABLE(EXTENSION_CAPABILITIES)
    String m_currentMediaEnvironment;
#endif

    bool m_useMockCaptureDevices { false };
};

} // namespace WebCore

#endif // ENABLE(MEDIA_STREAM)

