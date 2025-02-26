/*
 * Copyright (C) 2014-2021 Apple Inc. All rights reserved.
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

#include "MediaSessionGroupIdentifier.h"
#include "MediaSessionIdentifier.h"
#include "Timer.h"
#include <wtf/Logger.h>
#include <wtf/LoggerHelper.h>
#include <wtf/Noncopyable.h>
#include <wtf/ProcessID.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/WeakPtr.h>
#include <wtf/text/WTFString.h>

#if ENABLE(WIRELESS_PLAYBACK_TARGET)
#include "MediaPlaybackTargetClient.h"
#endif

namespace WebCore {
class PlatformMediaSession;
class AudioCaptureSource;
}

namespace WTF {
class MediaTime;
}

namespace WebCore {

class Document;
class MediaPlaybackTarget;
class PlatformMediaSessionClient;
class PlatformMediaSessionManager;
enum class DelayCallingUpdateNowPlaying : bool { No, Yes };
struct NowPlayingInfo;

enum class PlatformMediaSessionRemoteControlCommandType : uint8_t {
    NoCommand,
    PlayCommand,
    PauseCommand,
    StopCommand,
    TogglePlayPauseCommand,
    BeginSeekingBackwardCommand,
    EndSeekingBackwardCommand,
    BeginSeekingForwardCommand,
    EndSeekingForwardCommand,
    SeekToPlaybackPositionCommand,
    SkipForwardCommand,
    SkipBackwardCommand,
    NextTrackCommand,
    PreviousTrackCommand,
    BeginScrubbingCommand,
    EndScrubbingCommand,
};

enum class PlatformMediaSessionMediaType : uint8_t {
    None,
    Video,
    VideoAudio,
    Audio,
    WebAudio,
};

enum class PlatformMediaSessionState : uint8_t {
    Idle,
    Autoplaying,
    Playing,
    Paused,
    Interrupted,
};

enum class PlatformMediaSessionInterruptionType : uint8_t {
    NoInterruption,
    SystemSleep,
    EnteringBackground,
    SystemInterruption,
    SuspendedUnderLock,
    InvisibleAutoplay,
    ProcessInactive,
    PlaybackSuspended,
    PageNotVisible,
};

enum class PlatformMediaSessionEndInterruptionFlags : uint8_t {
    NoFlags = 0,
    MayResumePlaying = 1 << 0,
};

struct PlatformMediaSessionRemoteCommandArgument {
    std::optional<double> time;
    std::optional<bool> fastSeek;
};

class AudioCaptureSource : public CanMakeWeakPtr<AudioCaptureSource> {
public:
    virtual ~AudioCaptureSource() = default;
    virtual bool isCapturingAudio() const = 0;
    virtual bool wantsToCaptureAudio() const = 0;
};

class PlatformMediaSession
    : public CanMakeCheckedPtr<PlatformMediaSession>
    , public CanMakeWeakPtr<PlatformMediaSession>
#if ENABLE(WIRELESS_PLAYBACK_TARGET)
    , public MediaPlaybackTargetClient
#endif
#if !RELEASE_LOG_DISABLED
    , private LoggerHelper
#endif
{
    WTF_MAKE_TZONE_ALLOCATED(PlatformMediaSession);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(PlatformMediaSession);
public:
    static std::unique_ptr<PlatformMediaSession> create(PlatformMediaSessionManager&, PlatformMediaSessionClient&);

    virtual ~PlatformMediaSession();

    void setActive(bool);

    using MediaType = WebCore::PlatformMediaSessionMediaType;
    enum class PlaybackControlsPurpose { ControlsManager, NowPlaying, MediaSession };

    MediaType mediaType() const;
    MediaType presentationType() const;

    using State = PlatformMediaSessionState;

    State state() const { return m_state; }
    void setState(State);

    State stateToRestore() const { return m_stateToRestore; }

    using InterruptionType = PlatformMediaSessionInterruptionType;

    InterruptionType interruptionType() const;

    using EndInterruptionFlags = PlatformMediaSessionEndInterruptionFlags;

    virtual void clientCharacteristicsChanged(bool);

    void beginInterruption(InterruptionType);
    void endInterruption(OptionSet<EndInterruptionFlags>);

    virtual void clientWillBeginAutoplaying();
    virtual bool clientWillBeginPlayback();
    virtual bool clientWillPausePlayback();

    void clientWillBeDOMSuspended();

    void pauseSession();
    void stopSession();

    virtual void suspendBuffering() { }
    virtual void resumeBuffering() { }

    using RemoteCommandArgument = PlatformMediaSessionRemoteCommandArgument;

    using RemoteControlCommandType = PlatformMediaSessionRemoteControlCommandType;
    bool canReceiveRemoteControlCommands() const;
    virtual void didReceiveRemoteControlCommand(RemoteControlCommandType, const RemoteCommandArgument&);
    bool supportsSeeking() const;

    enum DisplayType : uint8_t {
        Normal,
        Fullscreen,
        Optimized,
    };
    DisplayType displayType() const;

    bool isHidden() const;
    bool isSuspended() const;
    bool isPlaying() const;
    bool isAudible() const;
    bool isEnded() const;
    WTF::MediaTime duration() const;

    bool shouldOverrideBackgroundLoadingRestriction() const;

    virtual bool isPlayingToWirelessPlaybackTarget() const { return m_isPlayingToWirelessPlaybackTarget; }
    void isPlayingToWirelessPlaybackTargetChanged(bool);

#if ENABLE(WIRELESS_PLAYBACK_TARGET)
    // MediaPlaybackTargetClient
    void setPlaybackTarget(Ref<MediaPlaybackTarget>&&) override { }
    void externalOutputDeviceAvailableDidChange(bool) override { }
    void setShouldPlayToPlaybackTarget(bool) override { }
    void playbackTargetPickerWasDismissed() override { }
#endif

#if PLATFORM(IOS_FAMILY)
    virtual bool requiresPlaybackTargetRouteMonitoring() const { return false; }
#endif

    bool blockedBySystemInterruption() const;
    bool activeAudioSessionRequired() const;
    bool canProduceAudio() const;
    bool hasMediaStreamSource() const;
    void canProduceAudioChanged();

    virtual void resetPlaybackSessionState() { }
    String sourceApplicationIdentifier() const;

    bool hasPlayedAudiblySinceLastInterruption() const { return m_hasPlayedAudiblySinceLastInterruption; }
    void clearHasPlayedAudiblySinceLastInterruption() { m_hasPlayedAudiblySinceLastInterruption = false; }

    bool preparingToPlay() const { return m_preparingToPlay; }

#if !RELEASE_LOG_DISABLED
    const Logger& logger() const final;
    uint64_t logIdentifier() const final;
    ASCIILiteral logClassName() const override { return "PlatformMediaSession"_s; }
    WTFLogChannel& logChannel() const final;
#endif

    bool canPlayConcurrently(const PlatformMediaSession&) const;
    bool shouldOverridePauseDuringRouteChange() const;

    std::optional<NowPlayingInfo> nowPlayingInfo() const;
    bool isNowPlayingEligible() const;
    WeakPtr<PlatformMediaSession> selectBestMediaSession(const Vector<WeakPtr<PlatformMediaSession>>&, PlaybackControlsPurpose);

    virtual void updateMediaUsageIfChanged() { }

    virtual bool isLongEnoughForMainContent() const { return false; }

    MediaSessionIdentifier mediaSessionIdentifier() const { return m_mediaSessionIdentifier; }

    bool isActiveNowPlayingSession() const { return m_isActiveNowPlayingSession; }
    void setActiveNowPlayingSession(bool);

    ProcessID presentingApplicationPID() const;

#if !RELEASE_LOG_DISABLED
    virtual String description() const;
#endif

protected:
    PlatformMediaSession(PlatformMediaSessionManager&, PlatformMediaSessionClient&);
    PlatformMediaSessionClient& client() const { return m_client; }

private:
    bool processClientWillPausePlayback(DelayCallingUpdateNowPlaying);
    size_t activeInterruptionCount() const;

    PlatformMediaSessionClient& m_client;
    MediaSessionIdentifier m_mediaSessionIdentifier;
    State m_state { State::Idle };
    State m_stateToRestore { State::Idle };
    struct Interruption {
        InterruptionType type { InterruptionType::NoInterruption };
        bool ignored { false };
    };
    Vector<Interruption> m_interruptionStack;
    bool m_active { false };
    bool m_notifyingClient { false };
    bool m_isPlayingToWirelessPlaybackTarget { false };
    bool m_hasPlayedAudiblySinceLastInterruption { false };
    bool m_preparingToPlay { false };
    bool m_isActiveNowPlayingSession { false };

    friend class PlatformMediaSessionManager;
};

class PlatformMediaSessionClient {
    WTF_MAKE_NONCOPYABLE(PlatformMediaSessionClient);
public:
    PlatformMediaSessionClient() = default;
    
    virtual PlatformMediaSession::MediaType mediaType() const = 0;
    virtual PlatformMediaSession::MediaType presentationType() const = 0;
    virtual PlatformMediaSession::DisplayType displayType() const { return PlatformMediaSession::Normal; }

    virtual void resumeAutoplaying() { }
    virtual void mayResumePlayback(bool shouldResume) = 0;
    virtual void suspendPlayback() = 0;

    virtual bool canReceiveRemoteControlCommands() const = 0;
    virtual void didReceiveRemoteControlCommand(PlatformMediaSession::RemoteControlCommandType, const PlatformMediaSession::RemoteCommandArgument&) = 0;
    virtual bool supportsSeeking() const = 0;

    virtual bool canProduceAudio() const { return false; }
    virtual bool isSuspended() const { return false; }
    virtual bool isPlaying() const { return false; }
    virtual bool isAudible() const { return false; }
    virtual bool isEnded() const { return false; }
    virtual WTF::MediaTime mediaSessionDuration() const;

    virtual bool shouldOverrideBackgroundPlaybackRestriction(PlatformMediaSession::InterruptionType) const = 0;
    virtual bool shouldOverrideBackgroundLoadingRestriction() const { return false; }

    virtual void wirelessRoutesAvailableDidChange() { }
    virtual void setWirelessPlaybackTarget(Ref<MediaPlaybackTarget>&&) { }
    virtual bool isPlayingToWirelessPlaybackTarget() const { return false; }
    virtual void setShouldPlayToPlaybackTarget(bool) { }
    virtual void playbackTargetPickerWasDismissed() { }

    virtual bool isPlayingOnSecondScreen() const { return false; }

    virtual std::optional<MediaSessionGroupIdentifier> mediaSessionGroupIdentifier() const = 0;

    virtual bool hasMediaStreamSource() const { return false; }

    virtual void processIsSuspendedChanged() { }

    virtual bool shouldOverridePauseDuringRouteChange() const { return false; }

    virtual bool isNowPlayingEligible() const { return false; }
    virtual std::optional<NowPlayingInfo> nowPlayingInfo() const;
    virtual WeakPtr<PlatformMediaSession> selectBestMediaSession(const Vector<WeakPtr<PlatformMediaSession>>&, PlatformMediaSession::PlaybackControlsPurpose) { return nullptr; }

    virtual void isActiveNowPlayingSessionChanged() = 0;

    virtual ProcessID presentingApplicationPID() const = 0;

#if !RELEASE_LOG_DISABLED
    virtual const Logger& logger() const = 0;
    virtual uint64_t logIdentifier() const = 0;
#endif

protected:
    virtual ~PlatformMediaSessionClient() = default;
};

String convertEnumerationToString(PlatformMediaSession::State);
String convertEnumerationToString(PlatformMediaSession::InterruptionType);
String convertEnumerationToString(PlatformMediaSession::MediaType);
WEBCORE_EXPORT String convertEnumerationToString(PlatformMediaSession::RemoteControlCommandType);

} // namespace WebCore

namespace WTF {

template<typename Type>
struct LogArgument;

template <>
struct LogArgument<WebCore::PlatformMediaSession::State> {
    static String toString(const WebCore::PlatformMediaSession::State state)
    {
        return convertEnumerationToString(state);
    }
};

template <>
struct LogArgument<WebCore::PlatformMediaSession::InterruptionType> {
    static String toString(const WebCore::PlatformMediaSession::InterruptionType state)
    {
        return convertEnumerationToString(state);
    }
};

template <>
struct LogArgument<WebCore::PlatformMediaSession::RemoteControlCommandType> {
    static String toString(const WebCore::PlatformMediaSession::RemoteControlCommandType command)
    {
        return convertEnumerationToString(command);
    }
};

template <>
struct LogArgument<WebCore::PlatformMediaSession::MediaType> {
    static String toString(const WebCore::PlatformMediaSession::MediaType mediaType)
    {
        return convertEnumerationToString(mediaType);
    }
};

} // namespace WTF
