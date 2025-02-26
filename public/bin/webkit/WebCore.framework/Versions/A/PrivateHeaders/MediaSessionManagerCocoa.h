/*
 * Copyright (C) 2020-2023 Apple Inc. All rights reserved.
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

#if PLATFORM(COCOA)

#include "AudioHardwareListener.h"
#include "AudioSession.h"
#include "NowPlayingManager.h"
#include "PlatformMediaSessionManager.h"
#include "RemoteCommandListener.h"
#include <wtf/RunLoop.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

struct NowPlayingInfo;

enum class MediaPlayerPitchCorrectionAlgorithm : uint8_t;

class MediaSessionManagerCocoa
    : public PlatformMediaSessionManager
    , private NowPlayingManagerClient
    , private AudioHardwareListener::Client {
    WTF_MAKE_TZONE_ALLOCATED(MediaSessionManagerCocoa);
public:
    MediaSessionManagerCocoa();
    
    void updateSessionState() final;
    void beginInterruption(PlatformMediaSession::InterruptionType) final;

    bool hasActiveNowPlayingSession() const final { return m_nowPlayingActive; }
    String lastUpdatedNowPlayingTitle() const final { return m_lastUpdatedNowPlayingTitle; }
    double lastUpdatedNowPlayingDuration() const final { return m_lastUpdatedNowPlayingDuration; }
    double lastUpdatedNowPlayingElapsedTime() const final { return m_lastUpdatedNowPlayingElapsedTime; }
    std::optional<MediaUniqueIdentifier> lastUpdatedNowPlayingInfoUniqueIdentifier() const final { return m_lastUpdatedNowPlayingInfoUniqueIdentifier; }
    bool registeredAsNowPlayingApplication() const final { return m_registeredAsNowPlayingApplication; }
    bool haveEverRegisteredAsNowPlayingApplication() const final { return m_haveEverRegisteredAsNowPlayingApplication; }

    void prepareToSendUserMediaPermissionRequestForPage(Page&) final;

    std::optional<NowPlayingInfo> nowPlayingInfo() const final { return m_nowPlayingInfo; }
    static WEBCORE_EXPORT void clearNowPlayingInfo();
    static WEBCORE_EXPORT void setNowPlayingInfo(bool setAsNowPlayingApplication, bool shouldUpdateNowPlayingSuppression, const NowPlayingInfo&);

    static WEBCORE_EXPORT void updateMediaUsage(PlatformMediaSession&);

    static void ensureCodecsRegistered();

    static WEBCORE_EXPORT void setShouldUseModernAVContentKeySession(bool);
    static WEBCORE_EXPORT bool shouldUseModernAVContentKeySession();

    static String audioTimePitchAlgorithmForMediaPlayerPitchCorrectionAlgorithm(MediaPlayerPitchCorrectionAlgorithm, bool preservesPitch, double rate);

protected:
    void scheduleSessionStatusUpdate() final;
    void updateNowPlayingInfo();
    void updateActiveNowPlayingSession(CheckedPtr<PlatformMediaSession>);

    void removeSession(PlatformMediaSession&) final;
    void addSession(PlatformMediaSession&) final;
    void setCurrentSession(PlatformMediaSession&) final;

    bool sessionWillBeginPlayback(PlatformMediaSession&) override;
    void sessionWillEndPlayback(PlatformMediaSession&, DelayCallingUpdateNowPlaying) override;
    void sessionDidEndRemoteScrubbing(PlatformMediaSession&) final;
    void clientCharacteristicsChanged(PlatformMediaSession&, bool) final;
    void sessionCanProduceAudioChanged() final;

    virtual void providePresentingApplicationPIDIfNecessary(ProcessID) { }

    WeakPtr<PlatformMediaSession> nowPlayingEligibleSession();

    void addSupportedCommand(PlatformMediaSession::RemoteControlCommandType) final;
    void removeSupportedCommand(PlatformMediaSession::RemoteControlCommandType) final;
    RemoteCommandListener::RemoteCommandsSet supportedCommands() const final;

    void resetHaveEverRegisteredAsNowPlayingApplicationForTesting() final { m_haveEverRegisteredAsNowPlayingApplication = false; };
    void resetSessionState() final;

private:
#if !RELEASE_LOG_DISABLED
    ASCIILiteral logClassName() const override { return "MediaSessionManagerCocoa"_s; }
#endif

    // NowPlayingManagerClient
    void didReceiveRemoteControlCommand(PlatformMediaSession::RemoteControlCommandType type, const PlatformMediaSession::RemoteCommandArgument& argument) final { processDidReceiveRemoteControlCommand(type, argument); }

    // AudioHardwareListenerClient
    void audioHardwareDidBecomeActive() final { }
    void audioHardwareDidBecomeInactive() final { }
    void audioOutputDeviceChanged() final;

    void possiblyChangeAudioCategory();

    std::optional<bool> supportsSpatialAudioPlaybackForConfiguration(const MediaConfiguration&) final;

#if USE(NOW_PLAYING_ACTIVITY_SUPPRESSION)
    static void updateNowPlayingSuppression(const NowPlayingInfo*);
#endif

    bool m_nowPlayingActive { false };
    bool m_registeredAsNowPlayingApplication { false };
    bool m_haveEverRegisteredAsNowPlayingApplication { false };

    // For testing purposes only.
    String m_lastUpdatedNowPlayingTitle;
    double m_lastUpdatedNowPlayingDuration { NAN };
    double m_lastUpdatedNowPlayingElapsedTime { NAN };
    Markable<MediaUniqueIdentifier> m_lastUpdatedNowPlayingInfoUniqueIdentifier;
    std::optional<NowPlayingInfo> m_nowPlayingInfo;

    const std::unique_ptr<NowPlayingManager> m_nowPlayingManager;
    RefPtr<AudioHardwareListener> m_audioHardwareListener;

    AudioHardwareListener::BufferSizeRange m_supportedAudioHardwareBufferSizes;
    size_t m_defaultBufferSize;

    RunLoop::Timer m_delayCategoryChangeTimer;
    AudioSession::CategoryType m_previousCategory { AudioSession::CategoryType::None };
    bool m_previousHadAudibleAudioOrVideoMediaType { false };
};

} // namespace WebCore

#endif // PLATFORM(COCOA)
