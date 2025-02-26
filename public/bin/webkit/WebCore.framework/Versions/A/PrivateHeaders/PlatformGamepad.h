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
#include "SharedGamepadValue.h"
#include <wtf/CompletionHandler.h>
#include <wtf/Forward.h>
#include <wtf/MonotonicTime.h>
#include <wtf/TZoneMallocInlines.h>
#include <wtf/WeakHashMap.h>
#include <wtf/WeakHashSet.h>
#include <wtf/WeakPtr.h>
#include <wtf/text/WTFString.h>

namespace WebCore {
class PlatformGamepad;
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<WebCore::PlatformGamepad> : std::true_type { };
}

namespace WebCore {

struct GamepadEffectParameters;

class PlatformGamepad : public CanMakeWeakPtr<PlatformGamepad> {
    WTF_MAKE_TZONE_ALLOCATED_INLINE(PlatformGamepad);
public:
    virtual ~PlatformGamepad() = default;

    const String& id() const { return m_id; }
    const String& mapping() const { return m_mapping; }
    unsigned index() const { return m_index; }
    virtual MonotonicTime lastUpdateTime() const { return m_lastUpdateTime; }
    MonotonicTime connectTime() const { return m_connectTime; }
    const GamepadHapticEffectTypeSet& supportedEffectTypes() const { return m_supportedEffectTypes; }
    
    virtual const Vector<SharedGamepadValue>& axisValues() const = 0;
    virtual const Vector<SharedGamepadValue>& buttonValues() const = 0;
    virtual void playEffect(GamepadHapticEffectType, const GamepadEffectParameters&, CompletionHandler<void(bool)>&& completionHandler) { completionHandler(false); }
    virtual void stopEffects(CompletionHandler<void()>&& completionHandler) { completionHandler(); }

    virtual ASCIILiteral source() const { return "Unknown"_s; }

protected:
    explicit PlatformGamepad(unsigned index)
        : m_index(index)
    {
    }

    String m_id;
    String m_mapping;
    unsigned m_index;
    MonotonicTime m_lastUpdateTime;
    MonotonicTime m_connectTime;
    GamepadHapticEffectTypeSet m_supportedEffectTypes;
};

} // namespace WebCore

#endif // ENABLE(GAMEPAD)
