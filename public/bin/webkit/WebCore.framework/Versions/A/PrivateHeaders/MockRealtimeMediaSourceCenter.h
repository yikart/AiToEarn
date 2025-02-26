/*
 * Copyright (C) 2013 Google Inc. All rights reserved.
 * Copyright (C) 2013-2022 Apple Inc.  All rights reserved.
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

#include "DisplayCaptureManager.h"
#include "MockMediaDevice.h"
#include "MockRealtimeAudioSource.h"
#include "MockRealtimeVideoSource.h"
#include "RealtimeMediaSourceCenter.h"

namespace WebCore {

class MockRealtimeMediaSourceCenter {
public:
    WEBCORE_EXPORT static MockRealtimeMediaSourceCenter& singleton();

    WEBCORE_EXPORT static void setMockRealtimeMediaSourceCenterEnabled(bool);
    WEBCORE_EXPORT static bool mockRealtimeMediaSourceCenterEnabled();

    WEBCORE_EXPORT static void setDevices(Vector<MockMediaDevice>&&);
    WEBCORE_EXPORT static void addDevice(const MockMediaDevice&);
    WEBCORE_EXPORT static void removeDevice(const String&);
    WEBCORE_EXPORT static void setDeviceIsEphemeral(const String&, bool);
    WEBCORE_EXPORT static void resetDevices();
    WEBCORE_EXPORT static void setMockCaptureDevicesInterrupted(bool isCameraInterrupted, bool isMicrophoneInterrupted);

    WEBCORE_EXPORT void triggerMockCaptureConfigurationChange(bool forMicrophone, bool forDisplay);

    void setMockAudioCaptureEnabled(bool isEnabled) { m_isMockAudioCaptureEnabled = isEnabled; }
    void setMockVideoCaptureEnabled(bool isEnabled) { m_isMockVideoCaptureEnabled = isEnabled; }
    void setMockDisplayCaptureEnabled(bool isEnabled) { m_isMockDisplayCaptureEnabled = isEnabled; }

    static Vector<CaptureDevice>& microphoneDevices();
    static Vector<CaptureDevice>& speakerDevices();
    static Vector<CaptureDevice>& videoDevices();
    WEBCORE_EXPORT static Vector<CaptureDevice>& displayDevices();

    static std::optional<MockMediaDevice> mockDeviceWithPersistentID(const String&);
    static std::optional<CaptureDevice> captureDeviceWithPersistentID(CaptureDevice::DeviceType, const String&);

    CaptureDeviceManager& audioCaptureDeviceManager() { return m_audioCaptureDeviceManager; }
    CaptureDeviceManager& videoCaptureDeviceManager() { return m_videoCaptureDeviceManager; }
    DisplayCaptureManager& displayCaptureDeviceManager() { return m_displayCaptureDeviceManager; }

private:
    MockRealtimeMediaSourceCenter() = default;
    friend NeverDestroyed<MockRealtimeMediaSourceCenter>;

    AudioCaptureFactory& audioCaptureFactory();
    VideoCaptureFactory& videoCaptureFactory();
    DisplayCaptureFactory& displayCaptureFactory();

    class MockAudioCaptureDeviceManager final : public CaptureDeviceManager {
    private:
        const Vector<CaptureDevice>& captureDevices() final { return MockRealtimeMediaSourceCenter::microphoneDevices(); }
        std::optional<CaptureDevice> captureDeviceWithPersistentID(CaptureDevice::DeviceType type, const String& id) final { return MockRealtimeMediaSourceCenter::captureDeviceWithPersistentID(type, id); }
    };
    class MockVideoCaptureDeviceManager final : public CaptureDeviceManager {
    private:
        const Vector<CaptureDevice>& captureDevices() final { return MockRealtimeMediaSourceCenter::videoDevices(); }
        std::optional<CaptureDevice> captureDeviceWithPersistentID(CaptureDevice::DeviceType type, const String& id) final { return MockRealtimeMediaSourceCenter::captureDeviceWithPersistentID(type, id); }
    };
    class MockDisplayCaptureDeviceManager final : public DisplayCaptureManager {
    private:
        const Vector<CaptureDevice>& captureDevices() final { return MockRealtimeMediaSourceCenter::displayDevices(); }
        std::optional<CaptureDevice> captureDeviceWithPersistentID(CaptureDevice::DeviceType type, const String& id) final { return MockRealtimeMediaSourceCenter::captureDeviceWithPersistentID(type, id); }
    };

    MockAudioCaptureDeviceManager m_audioCaptureDeviceManager;
    MockVideoCaptureDeviceManager m_videoCaptureDeviceManager;
    MockDisplayCaptureDeviceManager m_displayCaptureDeviceManager;

    bool m_isMockAudioCaptureEnabled { true };
    bool m_isMockVideoCaptureEnabled { true };
    bool m_isMockDisplayCaptureEnabled { true };
    bool m_isEnabled { false };
};

}

#endif // MockRealtimeMediaSourceCenter_h
