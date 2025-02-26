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

#if ENABLE(GAMEPAD)

#include "GamepadHapticEffectType.h"
#include <wtf/Forward.h>
#include <wtf/HashSet.h>
#include <wtf/WeakHashSet.h>

namespace WebCore {

class GamepadProviderClient;
class PlatformGamepad;
struct GamepadEffectParameters;

class GamepadProvider {
public:
    virtual ~GamepadProvider() = default;

    WEBCORE_EXPORT static GamepadProvider& singleton();
    WEBCORE_EXPORT static void setSharedProvider(GamepadProvider&);

    virtual void startMonitoringGamepads(GamepadProviderClient&) = 0;
    virtual void stopMonitoringGamepads(GamepadProviderClient&) = 0;
    virtual const Vector<WeakPtr<PlatformGamepad>>& platformGamepads() = 0;
    virtual bool isMockGamepadProvider() const { return false; }

    virtual void playEffect(unsigned gamepadIndex, const String& gamepadID, GamepadHapticEffectType, const GamepadEffectParameters&, CompletionHandler<void(bool)>&&) = 0;
    virtual void stopEffects(unsigned gamepadIndex, const String& gamepadID, CompletionHandler<void()>&&) = 0;

    virtual void clearGamepadsForTesting() { }

protected:
    WEBCORE_EXPORT void dispatchPlatformGamepadInputActivity();
    void setShouldMakeGamepadsVisibile() { m_shouldMakeGamepadsVisible = true; }
    WeakHashSet<GamepadProviderClient> m_clients;

private:
    bool m_shouldMakeGamepadsVisible { false };
};

} // namespace WebCore

#endif // ENABLE(GAMEPAD)
