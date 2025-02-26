/*
 * Copyright (C) 2010, 2014 Apple Inc. All rights reserved.
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

#include "AnimationFrameRate.h"
#include "PlatformScreen.h"
#include <optional>
#include <wtf/CheckedRef.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class DisplayRefreshMonitor;
class DisplayRefreshMonitorFactory;

struct DisplayUpdate;

class DisplayRefreshMonitorClient : public CanMakeCheckedPtr<DisplayRefreshMonitorClient> {
    WTF_MAKE_TZONE_ALLOCATED(DisplayRefreshMonitorClient);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(DisplayRefreshMonitorClient);
public:
    DisplayRefreshMonitorClient();
    virtual ~DisplayRefreshMonitorClient();

    // Always called on the main thread.
    virtual void displayRefreshFired() = 0;

    virtual DisplayRefreshMonitorFactory* displayRefreshMonitorFactory() const = 0;

    PlatformDisplayID displayID() const { return m_displayID.value(); }
    bool hasDisplayID() const { return !!m_displayID; }
    void setDisplayID(PlatformDisplayID displayID) { m_displayID = displayID; }

    void setPreferredFramesPerSecond(FramesPerSecond);
    FramesPerSecond preferredFramesPerSecond() const { return m_preferredFramesPerSecond; }

    void setIsScheduled(bool isScheduled) { m_scheduled = isScheduled; }
    bool isScheduled() const { return m_scheduled; }

    void fireDisplayRefreshIfNeeded(const DisplayUpdate&);

private:
    std::optional<PlatformDisplayID> m_displayID;
    FramesPerSecond m_preferredFramesPerSecond { FullSpeedFramesPerSecond };
    bool m_scheduled { false };
};

}
