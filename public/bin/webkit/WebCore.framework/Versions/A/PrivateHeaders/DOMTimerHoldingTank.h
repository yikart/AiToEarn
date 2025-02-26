/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

#if ENABLE(CONTENT_CHANGE_OBSERVER)

#include "Timer.h"
#include <wtf/CheckedPtr.h>
#include <wtf/Forward.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/WeakHashSet.h>

namespace WebCore {

class DOMTimer;

class DOMTimerHoldingTank final : public CanMakeCheckedPtr<DOMTimerHoldingTank> {
    WTF_MAKE_TZONE_ALLOCATED(DOMTimerHoldingTank);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(DOMTimerHoldingTank);
public:
    DOMTimerHoldingTank();
    ~DOMTimerHoldingTank();

    void add(const DOMTimer&);
    void remove(const DOMTimer&);
    bool contains(const DOMTimer&);
    WEBCORE_EXPORT void removeAll();

private:
    void stopExceededMaximumHoldTimer();

    WeakHashSet<DOMTimer> m_timers;
    Timer m_exceededMaximumHoldTimer;
};

class DeferDOMTimersForScope {
public:
    explicit DeferDOMTimersForScope(bool enable)
        : m_previousIsDeferring { s_isDeferring }
    {
        if (enable)
            s_isDeferring = true;
    }

    ~DeferDOMTimersForScope() { s_isDeferring = m_previousIsDeferring; }

    static bool isDeferring() { return s_isDeferring; }

private:
    bool m_previousIsDeferring;
    static bool s_isDeferring;
};

} // namespace WebCore

#endif // ENABLE(CONTENT_CHANGE_OBSERVER)
