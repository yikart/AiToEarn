/*
 * Copyright (C) 2016 Apple Inc. All rights reserved.
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

#if ENABLE(GAMEPAD)

#include "GamepadProvider.h"
#include <wtf/HashMap.h>
#include <wtf/RetainPtr.h>
#include <wtf/RunLoop.h>

OBJC_CLASS GCController;
OBJC_CLASS NSObject;

namespace WebCore {

class GameControllerGamepad;
class GamepadProviderClient;

class GameControllerGamepadProvider : public GamepadProvider {
    WTF_MAKE_NONCOPYABLE(GameControllerGamepadProvider);
    friend class NeverDestroyed<GameControllerGamepadProvider>;
public:
    WEBCORE_EXPORT static GameControllerGamepadProvider& singleton();

    // Do nothing since this is a singleton.
    void ref() const { }
    void deref() const { }

    WEBCORE_EXPORT void startMonitoringGamepads(GamepadProviderClient&) final;
    WEBCORE_EXPORT void stopMonitoringGamepads(GamepadProviderClient&) final;
    const Vector<WeakPtr<PlatformGamepad>>& platformGamepads() final { return m_gamepadVector; }
    void playEffect(unsigned gamepadIndex, const String& gamepadID, GamepadHapticEffectType, const GamepadEffectParameters&, CompletionHandler<void(bool)>&&) final;
    void stopEffects(unsigned gamepadIndex, const String& gamepadID, CompletionHandler<void()>&&) final;

    WEBCORE_EXPORT void stopMonitoringInput();
    WEBCORE_EXPORT void startMonitoringInput();

    void gamepadHadInput(GameControllerGamepad&, bool hadButtonPresses);
    void prewarmGameControllerDevicesIfNecessary();

    void makeInvisibleGamepadsVisible();

    size_t numberOfConnectedGamepads() const { return m_gamepadMap.size(); };

#if !HAVE(GCCONTROLLER_HID_DEVICE_CHECK)
    static bool willHandleVendorAndProduct(uint16_t vendorID, uint16_t productID);
#endif

private:
    GameControllerGamepadProvider();
    virtual ~GameControllerGamepadProvider();

    enum class ConnectionVisibility {
        Visible,
        Invisible,
    };

    void controllerDidConnect(GCController *, ConnectionVisibility);
    void controllerDidDisconnect(GCController *);

    unsigned indexForNewlyConnectedDevice();

    void inputNotificationTimerFired();

    HashMap<CFTypeRef, std::unique_ptr<GameControllerGamepad>> m_gamepadMap;
    Vector<WeakPtr<PlatformGamepad>> m_gamepadVector;
    WeakHashSet<PlatformGamepad> m_invisibleGamepads;

    RetainPtr<NSObject> m_connectObserver;
    RetainPtr<NSObject> m_disconnectObserver;

    RunLoop::Timer m_inputNotificationTimer;
    bool m_shouldMakeInvisibleGamepadsVisible { false };
};

} // namespace WebCore

#endif // ENABLE(GAMEPAD)
