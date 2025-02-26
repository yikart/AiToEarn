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

#include "Supplementable.h"
#include <wtf/CheckedRef.h>
#include <wtf/MonotonicTime.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>

namespace WebCore {
class NavigatorGamepad;
}

namespace WebCore {

class Gamepad;
class Navigator;
class Page;
class PlatformGamepad;
template<typename> class ExceptionOr;

class NavigatorGamepad : public Supplement<Navigator> {
    WTF_MAKE_TZONE_ALLOCATED(NavigatorGamepad);
public:
    explicit NavigatorGamepad(Navigator&);
    virtual ~NavigatorGamepad();

    static NavigatorGamepad& from(Navigator&);

    Navigator& navigator() const;

    // The array of Gamepads might be sparse.
    // Null checking each entry is necessary.
    static ExceptionOr<const Vector<RefPtr<Gamepad>>&> getGamepads(Navigator&);

    void gamepadConnected(PlatformGamepad&);
    void gamepadDisconnected(PlatformGamepad&);

    Ref<Gamepad> gamepadFromPlatformGamepad(PlatformGamepad&);

    WEBCORE_EXPORT static void setGamepadsRecentlyAccessedThreshold(Seconds);
    static Seconds gamepadsRecentlyAccessedThreshold();

    RefPtr<Page> protectedPage() const;

private:
    static ASCIILiteral supplementName();
    Ref<Navigator> protectedNavigator() const;

    void gamepadsBecameVisible();
    void maybeNotifyRecentAccess();

    const Vector<RefPtr<Gamepad>>& gamepads();

    CheckedRef<Navigator> m_navigator;
    Vector<RefPtr<Gamepad>> m_gamepads;
};

} // namespace WebCore

#endif // ENABLE(GAMEPAD)
