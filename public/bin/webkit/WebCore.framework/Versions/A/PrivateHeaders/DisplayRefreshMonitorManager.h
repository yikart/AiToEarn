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
#include "DisplayRefreshMonitor.h"
#include "PlatformScreen.h"
#include <wtf/NeverDestroyed.h>
#include <wtf/RefPtr.h>
#include <wtf/Vector.h>

namespace WebCore {

struct DisplayUpdate;

class DisplayRefreshMonitorManager {
    friend class NeverDestroyed<DisplayRefreshMonitorManager>;
    friend class DisplayRefreshMonitor;
public:
    WEBCORE_EXPORT static DisplayRefreshMonitorManager& sharedManager();

    void unregisterClient(DisplayRefreshMonitorClient&);

    bool scheduleAnimation(DisplayRefreshMonitorClient&);
    void windowScreenDidChange(PlatformDisplayID, DisplayRefreshMonitorClient&);
    
    WEBCORE_EXPORT std::optional<FramesPerSecond> nominalFramesPerSecondForDisplay(PlatformDisplayID, DisplayRefreshMonitorFactory*);

    void clientPreferredFramesPerSecondChanged(DisplayRefreshMonitorClient&);

    WEBCORE_EXPORT void displayDidRefresh(PlatformDisplayID, const DisplayUpdate&);

private:
    DisplayRefreshMonitorManager() = default;
    virtual ~DisplayRefreshMonitorManager();

    void displayMonitorDisplayDidRefresh(DisplayRefreshMonitor&);

    size_t findMonitorForDisplayID(PlatformDisplayID) const;
    DisplayRefreshMonitor* monitorForDisplayID(PlatformDisplayID) const;
    DisplayRefreshMonitor* monitorForClient(DisplayRefreshMonitorClient&);

    DisplayRefreshMonitor* ensureMonitorForDisplayID(PlatformDisplayID, DisplayRefreshMonitorFactory*);

    struct DisplayRefreshMonitorWrapper {
        ~DisplayRefreshMonitorWrapper()
        {
            if (monitor)
                monitor->stop();
        }

        RefPtr<DisplayRefreshMonitor> monitor;
    };

    Vector<DisplayRefreshMonitorWrapper> m_monitors;
};

}
