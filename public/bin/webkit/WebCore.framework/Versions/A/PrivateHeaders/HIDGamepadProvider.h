/*
 * Copyright (C) 2014 Apple Inc. All rights reserved.
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

#if ENABLE(GAMEPAD) && PLATFORM(MAC)

#include "GamepadProvider.h"
#include "HIDGamepad.h"
#include "Timer.h"
#include <IOKit/hid/IOHIDManager.h>
#include <pal/spi/cocoa/IOKitSPI.h>
#include <wtf/Deque.h>
#include <wtf/HashMap.h>
#include <wtf/RetainPtr.h>
#include <wtf/WorkQueue.h>

namespace WebCore {

class GamepadProviderClient;

class HIDGamepadProvider : public GamepadProvider {
    WTF_MAKE_NONCOPYABLE(HIDGamepadProvider);
    friend class NeverDestroyed<HIDGamepadProvider>;
public:
    WEBCORE_EXPORT static HIDGamepadProvider& singleton();

    // Do nothing since this is a singleton.
    void ref() const { }
    void deref() const { }

    WEBCORE_EXPORT void startMonitoringGamepads(GamepadProviderClient&) final;
    WEBCORE_EXPORT void stopMonitoringGamepads(GamepadProviderClient&) final;
    const Vector<WeakPtr<PlatformGamepad>>& platformGamepads() final { return m_gamepadVector; }
    void playEffect(unsigned, const String&, GamepadHapticEffectType, const GamepadEffectParameters&, CompletionHandler<void(bool)>&&) final;
    void stopEffects(unsigned, const String&, CompletionHandler<void()>&&) final;

    WEBCORE_EXPORT void stopMonitoringInput();
    WEBCORE_EXPORT void startMonitoringInput();

    void deviceAdded(IOHIDDeviceRef);
    void deviceRemoved(IOHIDDeviceRef);
    void valuesChanged(IOHIDValueRef);

    void ignoreGameControllerFrameworkDevices() { m_ignoresGameControllerFrameworkDevices = true; }

    size_t numberOfConnectedGamepads() const { return m_gamepadMap.size(); };

private:
    HIDGamepadProvider();

    std::unique_ptr<HIDGamepad> removeGamepadForDevice(IOHIDDeviceRef);

    void openAndScheduleManager();
    void closeAndUnscheduleManager();

    void initialGamepadsConnectedTimerFired();
    void inputNotificationTimerFired();

    unsigned indexForNewlyConnectedDevice();

    Vector<WeakPtr<PlatformGamepad>> m_gamepadVector;
    HashMap<IOHIDDeviceRef, std::unique_ptr<HIDGamepad>> m_gamepadMap;

    RetainPtr<IOHIDManagerRef> m_manager;

    bool m_initialGamepadsConnected { false };
    bool m_ignoresGameControllerFrameworkDevices { false };

    Timer m_initialGamepadsConnectedTimer;
    Timer m_inputNotificationTimer;

#if HAVE(MULTIGAMEPADPROVIDER_SUPPORT)
    HashSet<IOHIDDeviceRef> m_gameControllerManagedGamepads;
#endif // HAVE(MULTIGAMEPADPROVIDER_SUPPORT)
};

} // namespace WebCore

#endif // ENABLE(GAMEPAD) && PLATFORM(MAC)
