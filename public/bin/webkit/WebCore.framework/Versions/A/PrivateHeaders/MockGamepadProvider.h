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
#include "MockGamepad.h"
#include <wtf/HashMap.h>
#include <wtf/HashSet.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class MockGamepadProvider : public GamepadProvider {
    WTF_MAKE_NONCOPYABLE(MockGamepadProvider);
    friend class NeverDestroyed<MockGamepadProvider>;
public:
    WEBCORE_TESTSUPPORT_EXPORT static MockGamepadProvider& singleton();

    WEBCORE_TESTSUPPORT_EXPORT void startMonitoringGamepads(GamepadProviderClient&) final;
    WEBCORE_TESTSUPPORT_EXPORT void stopMonitoringGamepads(GamepadProviderClient&) final;
    const Vector<WeakPtr<PlatformGamepad>>& platformGamepads() final { return m_connectedGamepadVector; }
    bool isMockGamepadProvider() const final { return true; }
    void playEffect(unsigned, const String&, GamepadHapticEffectType, const GamepadEffectParameters&, CompletionHandler<void(bool)>&&) final;
    void stopEffects(unsigned, const String&, CompletionHandler<void()>&&) final;
    void clearGamepadsForTesting() final;

    void setMockGamepadDetails(unsigned index, const String& gamepadID, const String& mapping, unsigned axisCount, unsigned buttonCount, bool supportsDualRumble);
    bool setMockGamepadAxisValue(unsigned index, unsigned axisIndex, double value);
    bool setMockGamepadButtonValue(unsigned index, unsigned buttonIndex, double value);
    bool connectMockGamepad(unsigned index);
    bool disconnectMockGamepad(unsigned index);

private:
    MockGamepadProvider();

    void gamepadInputActivity();

    Vector<WeakPtr<PlatformGamepad>> m_connectedGamepadVector;
    WeakHashMap<GamepadProviderClient, WeakHashSet<PlatformGamepad>>  m_invisibleGamepadsForClient;
    Vector<std::unique_ptr<MockGamepad>> m_mockGamepadVector;

    bool m_shouldScheduleActivityCallback { true };
};

}

#endif // ENABLE(GAMEPAD)
