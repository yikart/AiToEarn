/*
 * Copyright (C) 2015 Igalia S.L.
 * Copyright (C) 2006-2016 Apple Inc. All rights reserved.
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

#include "SharedTimer.h"
#include <wtf/Forward.h>
#include <wtf/TZoneMalloc.h>

#if !USE(CF) && !OS(WINDOWS)
#include <wtf/RunLoop.h>
#endif

namespace WebCore {

class MainThreadSharedTimer final : public SharedTimer {
    WTF_MAKE_TZONE_ALLOCATED(MainThreadSharedTimer);
    friend class NeverDestroyed<MainThreadSharedTimer>;
public:
    static MainThreadSharedTimer& singleton();

    // Do nothing since this is a singleton.
    void ref() const { }
    void deref() const { }

    void setFiredFunction(Function<void()>&&) override;
    void setFireInterval(Seconds) override;
    void stop() override;
    void invalidate() override;

    // FIXME: This should be private, but CF and Windows implementations
    // need to call this from non-member functions at the moment.
    void fired();

    WEBCORE_EXPORT static bool& shouldSetupPowerObserver();
    WEBCORE_EXPORT static void restartSharedTimer();

private:
    MainThreadSharedTimer();

    Function<void()> m_firedFunction;
#if !USE(CF) && !OS(WINDOWS)
    RunLoop::Timer m_timer;
#endif
};

} // namespace WebCore
