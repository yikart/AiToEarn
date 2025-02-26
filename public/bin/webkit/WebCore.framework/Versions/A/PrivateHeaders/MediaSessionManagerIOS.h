/*
 * Copyright (C) 2014-2023 Apple Inc. All rights reserved.
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

#if PLATFORM(IOS_FAMILY)

#include "AudioSession.h"
#include "MediaSessionHelperIOS.h"
#include "MediaSessionManagerCocoa.h"
#include <wtf/RetainPtr.h>
#include <wtf/TZoneMalloc.h>

OBJC_CLASS WebMediaSessionHelper;

#if defined(__OBJC__) && __OBJC__
extern NSString *WebUIApplicationWillResignActiveNotification;
extern NSString *WebUIApplicationWillEnterForegroundNotification;
extern NSString *WebUIApplicationDidBecomeActiveNotification;
extern NSString *WebUIApplicationDidEnterBackgroundNotification;
#endif

namespace WebCore {

class MediaSessionManageriOS
    : public MediaSessionManagerCocoa
    , public MediaSessionHelperClient
    , public AudioSessionInterruptionObserver {
    WTF_MAKE_TZONE_ALLOCATED(MediaSessionManageriOS);
public:
    virtual ~MediaSessionManageriOS();

    bool hasWirelessTargetsAvailable() override;
    bool isMonitoringWirelessTargets() const override;

    USING_CAN_MAKE_WEAKPTR(MediaSessionHelperClient);

private:
    friend class PlatformMediaSessionManager;

    MediaSessionManageriOS();

#if !PLATFORM(MACCATALYST)
    void resetRestrictions() final;
#endif

    void configureWirelessTargetMonitoring() final;
    void providePresentingApplicationPIDIfNecessary(ProcessID) final;
    void updatePresentingApplicationPIDIfNecessary(ProcessID) final;
    bool sessionWillBeginPlayback(PlatformMediaSession&) final;
    void sessionWillEndPlayback(PlatformMediaSession&, DelayCallingUpdateNowPlaying) final;

    // AudioSessionInterruptionObserver
    void beginAudioSessionInterruption() final { beginInterruption(PlatformMediaSession::InterruptionType::SystemInterruption); }
    void endAudioSessionInterruption(AudioSession::MayResume mayResume) final { endInterruption(mayResume == AudioSession::MayResume::Yes ? PlatformMediaSession::EndInterruptionFlags::MayResumePlaying : PlatformMediaSession::EndInterruptionFlags::NoFlags); }

    // MediaSessionHelperClient
    void applicationWillEnterForeground(SuspendedUnderLock) final;
    void applicationDidEnterBackground(SuspendedUnderLock) final;
    void applicationWillBecomeInactive() final;
    void applicationDidBecomeActive() final;
    void externalOutputDeviceAvailableDidChange(HasAvailableTargets) final;
    void activeAudioRouteDidChange(ShouldPause) final;
    void activeVideoRouteDidChange(SupportsAirPlayVideo, Ref<MediaPlaybackTarget>&&) final;
    void isPlayingToAutomotiveHeadUnitDidChange(PlayingToAutomotiveHeadUnit) final;
    void activeAudioRouteSupportsSpatialPlaybackDidChange(SupportsSpatialAudioPlayback) final;
#if !RELEASE_LOG_DISABLED
    ASCIILiteral logClassName() const final { return "MediaSessionManageriOS"_s; }
#endif

#if !PLATFORM(WATCHOS)
    RefPtr<MediaPlaybackTarget> m_playbackTarget;
    bool m_playbackTargetSupportsAirPlayVideo { false };
#endif

    bool m_isMonitoringWirelessRoutes { false };
    bool m_havePresentedApplicationPID { false };
};

} // namespace WebCore

#endif // PLATFORM(IOS_FAMILY)
