/*
 * Copyright (C) 2020 Apple Inc. All rights reserved.
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

#if ENABLE(GAMEPAD) && HAVE(MULTIGAMEPADPROVIDER_SUPPORT)

#include "GamepadProvider.h"
#include "GamepadProviderClient.h"
#include "PlatformGamepad.h"
#include <wtf/Forward.h>
#include <wtf/HashSet.h>

namespace WebCore {

class MultiGamepadProvider : public GamepadProvider, public GamepadProviderClient {
public:
    virtual ~MultiGamepadProvider() = default;

    WEBCORE_EXPORT static MultiGamepadProvider& singleton();

    void setUsesOnlyHIDGamepadProvider(bool hidProviderOnly) { m_usesOnlyHIDProvider = hidProviderOnly; }

    // GamepadProvider
    void startMonitoringGamepads(GamepadProviderClient&) final;
    void stopMonitoringGamepads(GamepadProviderClient&) final;
    const Vector<WeakPtr<PlatformGamepad>>& platformGamepads() final { return m_gamepadVector; }
    bool isMockGamepadProvider() const { return false; }
    void playEffect(unsigned gamepadIndex, const String& gamepadID, GamepadHapticEffectType, const GamepadEffectParameters&, CompletionHandler<void(bool)>&&) final;
    void stopEffects(unsigned gamepadIndex, const String& gamepadID, CompletionHandler<void()>&&) final;

    // GamepadProviderClient
    void platformGamepadConnected(PlatformGamepad&, EventMakesGamepadsVisible) final;
    void platformGamepadDisconnected(PlatformGamepad&) final;
    void platformGamepadInputActivity(EventMakesGamepadsVisible) final;

protected:
    WEBCORE_EXPORT void dispatchPlatformGamepadInputActivity();

private:
    unsigned indexForNewlyConnectedDevice();

    bool m_shouldMakeGamepadsVisible { false };
    size_t m_initialGamepadsCount { 0 };
    Vector<WeakPtr<PlatformGamepad>> m_gamepadVector;

    // We create our own Gamepad type - to wrap both HID and GameController gamepads -
    // because MultiGamepadProvider needs to manage the indexes of its own gamepads
    // no matter what the HID or GameController index is.
    class PlatformGamepadWrapper : public PlatformGamepad {
    public:
        PlatformGamepadWrapper(unsigned index, PlatformGamepad* wrapped)
            : PlatformGamepad(index)
            , m_platformGamepad(wrapped)
        {
            m_id = wrapped->id();
            m_mapping = wrapped->mapping();
            m_connectTime = wrapped->connectTime();
        }

        MonotonicTime lastUpdateTime() const final { return m_platformGamepad->lastUpdateTime(); }
        const Vector<SharedGamepadValue>& axisValues() const final { return m_platformGamepad->axisValues(); }
        const Vector<SharedGamepadValue>& buttonValues() const final { return m_platformGamepad->buttonValues(); }

        ASCIILiteral source() const final { return m_platformGamepad->source(); }

    private:
        WeakPtr<PlatformGamepad> m_platformGamepad;
    };

    WeakHashMap<PlatformGamepad, std::unique_ptr<PlatformGamepadWrapper>> m_gamepadMap;
    bool m_hidImportComplete { false };
    bool m_usesOnlyHIDProvider { false };
};

} // namespace WebCore

#endif // ENABLE(GAMEPAD) && HAVE(MULTIGAMEPADPROVIDER_SUPPORT)
