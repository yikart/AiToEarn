/*
 * Copyright (C) 2015-2020 Apple Inc. All rights reserved.
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

#if ENABLE(WIRELESS_PLAYBACK_TARGET) && !PLATFORM(IOS_FAMILY)

#include "MediaPlaybackTargetContext.h"
#include "MediaPlaybackTargetPicker.h"
#include "MediaPlaybackTargetPickerMock.h"
#include "MediaProducer.h"
#include "PlaybackTargetClientContextIdentifier.h"
#include <wtf/CheckedPtr.h>
#include <wtf/Ref.h>
#include <wtf/RefPtr.h>
#include <wtf/RunLoop.h>

namespace WebCore {

struct ClientState;
class IntRect;
class WebMediaSessionLogger;
class WebMediaSessionManagerClient;

class WebMediaSessionManager : public MediaPlaybackTargetPicker::Client, public CanMakeCheckedPtr<WebMediaSessionManager> {
    WTF_MAKE_NONCOPYABLE(WebMediaSessionManager);
    WTF_MAKE_FAST_ALLOCATED;
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(WebMediaSessionManager);
public:

    WEBCORE_EXPORT static WebMediaSessionManager& shared();

    WEBCORE_EXPORT void setMockMediaPlaybackTargetPickerEnabled(bool);
    WEBCORE_EXPORT void setMockMediaPlaybackTargetPickerState(const String&, MediaPlaybackTargetContext::MockState);
    WEBCORE_EXPORT void mockMediaPlaybackTargetPickerDismissPopup();

    WEBCORE_EXPORT std::optional<PlaybackTargetClientContextIdentifier> addPlaybackTargetPickerClient(WebMediaSessionManagerClient&, PlaybackTargetClientContextIdentifier);
    WEBCORE_EXPORT void removePlaybackTargetPickerClient(WebMediaSessionManagerClient&, PlaybackTargetClientContextIdentifier);
    WEBCORE_EXPORT void removeAllPlaybackTargetPickerClients(WebMediaSessionManagerClient&);
    WEBCORE_EXPORT void showPlaybackTargetPicker(WebMediaSessionManagerClient&, PlaybackTargetClientContextIdentifier, const IntRect&, bool, bool);
    WEBCORE_EXPORT void clientStateDidChange(WebMediaSessionManagerClient&, PlaybackTargetClientContextIdentifier, WebCore::MediaProducerMediaStateFlags);

    bool alwaysOnLoggingAllowed() const;

protected:
    WebMediaSessionManager();
    virtual ~WebMediaSessionManager();

    virtual WebCore::MediaPlaybackTargetPicker& platformPicker() = 0;
    static WebMediaSessionManager& platformManager();

private:

    WebCore::MediaPlaybackTargetPicker& targetPicker();
    WebCore::MediaPlaybackTargetPickerMock& mockPicker();

    // MediaPlaybackTargetPicker::Client
    void setPlaybackTarget(Ref<WebCore::MediaPlaybackTarget>&&) final;
    void externalOutputDeviceAvailableDidChange(bool) final;
    void playbackTargetPickerWasDismissed() final;

    size_t find(WebMediaSessionManagerClient*, PlaybackTargetClientContextIdentifier);

    void configurePlaybackTargetClients();
    void configureNewClients();
    void configurePlaybackTargetMonitoring();
    void configureWatchdogTimer();

    enum ConfigurationTaskFlags {
        NoTask = 0,
        InitialConfigurationTask = 1 << 0,
        TargetClientsConfigurationTask = 1 << 1,
        TargetMonitoringConfigurationTask = 1 << 2,
        WatchdogTimerConfigurationTask = 1 << 3,
    };
    typedef unsigned ConfigurationTasks;
    String toString(ConfigurationTasks);

    void scheduleDelayedTask(ConfigurationTasks);
    void taskTimerFired();

    void watchdogTimerFired();

    WebMediaSessionLogger& logger();

    RunLoop::Timer m_taskTimer;
    RunLoop::Timer m_watchdogTimer;

    Vector<std::unique_ptr<ClientState>> m_clientState;
    RefPtr<MediaPlaybackTarget> m_playbackTarget;
    std::unique_ptr<WebCore::MediaPlaybackTargetPickerMock> m_pickerOverride;
    ConfigurationTasks m_taskFlags { NoTask };
    std::unique_ptr<WebMediaSessionLogger> m_logger;
    Seconds m_currentWatchdogInterval;
    bool m_externalOutputDeviceAvailable { false };
    bool m_targetChanged { false };
    bool m_playbackTargetPickerDismissed { false };
    bool m_mockPickerEnabled { false };
};

String mediaProducerStateString(WebCore::MediaProducerMediaStateFlags);

} // namespace WebCore

namespace WTF {

template<typename> struct LogArgument;

template<> struct LogArgument<WebCore::MediaProducerMediaStateFlags> {
    static String toString(WebCore::MediaProducerMediaStateFlags flags) { return WebCore::mediaProducerStateString(flags); }
};

} // namespace WTF

#endif // ENABLE(WIRELESS_PLAYBACK_TARGET) && !PLATFORM(IOS_FAMILY)
