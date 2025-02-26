/*
 * Copyright (C) 2013-2023 Apple Inc. All rights reserved.
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

#include "MediaUniqueIdentifier.h"
#include "NowPlayingMetadataObserver.h"
#include "PlatformMediaSession.h"
#include "RemoteCommandListener.h"
#include "Timer.h"
#include <wtf/AggregateLogger.h>
#include <wtf/CancellableTask.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>
#include <wtf/WeakHashSet.h>
#include <wtf/WeakPtr.h>

namespace WebCore {

class Page;
class PlatformMediaSession;
struct MediaConfiguration;
struct NowPlayingInfo;
struct NowPlayingMetadata;

class PlatformMediaSessionManager
#if !RELEASE_LOG_DISABLED
    : private LoggerHelper
#endif
{
    WTF_MAKE_TZONE_ALLOCATED(PlatformMediaSessionManager);
public:
    WEBCORE_EXPORT static PlatformMediaSessionManager* singletonIfExists();
    WEBCORE_EXPORT static PlatformMediaSessionManager& singleton();

    // Do nothing since this is a singleton.
    void ref() const { }
    void deref() const { }

    static void updateNowPlayingInfoIfNecessary();
    static void updateAudioSessionCategoryIfNecessary();

    WEBCORE_EXPORT static void setShouldDeactivateAudioSession(bool);
    WEBCORE_EXPORT static bool shouldDeactivateAudioSession();

    WEBCORE_EXPORT static void setVorbisDecoderEnabled(bool);
    WEBCORE_EXPORT static bool vorbisDecoderEnabled();
    WEBCORE_EXPORT static void setOpusDecoderEnabled(bool);
    WEBCORE_EXPORT static bool opusDecoderEnabled();
    WEBCORE_EXPORT static void setAlternateWebMPlayerEnabled(bool);
    WEBCORE_EXPORT static bool alternateWebMPlayerEnabled();
    WEBCORE_EXPORT static void setUseSCContentSharingPicker(bool);
    WEBCORE_EXPORT static bool useSCContentSharingPicker();

#if ENABLE(VP9)
    WEBCORE_EXPORT static void setShouldEnableVP9Decoder(bool);
    WEBCORE_EXPORT static bool shouldEnableVP9Decoder();
    WEBCORE_EXPORT static void setSWVPDecodersAlwaysEnabled(bool);
    WEBCORE_EXPORT static bool swVPDecodersAlwaysEnabled();
#endif

#if ENABLE(EXTENSION_CAPABILITIES)
    WEBCORE_EXPORT static bool mediaCapabilityGrantsEnabled();
    WEBCORE_EXPORT static void setMediaCapabilityGrantsEnabled(bool);
#endif

    virtual ~PlatformMediaSessionManager();

    virtual void scheduleSessionStatusUpdate() { }

    bool has(PlatformMediaSession::MediaType) const;
    int count(PlatformMediaSession::MediaType) const;
    bool activeAudioSessionRequired() const;
    bool hasActiveAudioSession() const;
    bool canProduceAudio() const;

    virtual std::optional<NowPlayingInfo> nowPlayingInfo() const;
    virtual bool hasActiveNowPlayingSession() const { return false; }
    virtual String lastUpdatedNowPlayingTitle() const { return emptyString(); }
    virtual double lastUpdatedNowPlayingDuration() const { return NAN; }
    virtual double lastUpdatedNowPlayingElapsedTime() const { return NAN; }
    virtual std::optional<MediaUniqueIdentifier> lastUpdatedNowPlayingInfoUniqueIdentifier() const { return std::nullopt; }
    virtual bool registeredAsNowPlayingApplication() const { return false; }
    virtual bool haveEverRegisteredAsNowPlayingApplication() const { return false; }
    virtual void prepareToSendUserMediaPermissionRequestForPage(Page&) { }

    bool willIgnoreSystemInterruptions() const { return m_willIgnoreSystemInterruptions; }
    void setWillIgnoreSystemInterruptions(bool ignore) { m_willIgnoreSystemInterruptions = ignore; }

    WEBCORE_EXPORT virtual void beginInterruption(PlatformMediaSession::InterruptionType);
    WEBCORE_EXPORT void endInterruption(PlatformMediaSession::EndInterruptionFlags);

    WEBCORE_EXPORT void applicationWillBecomeInactive();
    WEBCORE_EXPORT void applicationDidBecomeActive();
    WEBCORE_EXPORT void applicationWillEnterForeground(bool suspendedUnderLock);
    WEBCORE_EXPORT void applicationDidEnterBackground(bool suspendedUnderLock);
    WEBCORE_EXPORT void processWillSuspend();
    WEBCORE_EXPORT void processDidResume();

    bool mediaPlaybackIsPaused(std::optional<MediaSessionGroupIdentifier>);
    void pauseAllMediaPlaybackForGroup(std::optional<MediaSessionGroupIdentifier>);
    WEBCORE_EXPORT void stopAllMediaPlaybackForProcess();

    void suspendAllMediaPlaybackForGroup(std::optional<MediaSessionGroupIdentifier>);
    void resumeAllMediaPlaybackForGroup(std::optional<MediaSessionGroupIdentifier>);
    void suspendAllMediaBufferingForGroup(std::optional<MediaSessionGroupIdentifier>);
    void resumeAllMediaBufferingForGroup(std::optional<MediaSessionGroupIdentifier>);

    enum SessionRestrictionFlags {
        NoRestrictions = 0,
        ConcurrentPlaybackNotPermitted = 1 << 0,
        BackgroundProcessPlaybackRestricted = 1 << 1,
        BackgroundTabPlaybackRestricted = 1 << 2,
        InterruptedPlaybackNotPermitted = 1 << 3,
        InactiveProcessPlaybackRestricted = 1 << 4,
        SuspendedUnderLockPlaybackRestricted = 1 << 5,
    };
    typedef unsigned SessionRestrictions;

    WEBCORE_EXPORT void addRestriction(PlatformMediaSession::MediaType, SessionRestrictions);
    WEBCORE_EXPORT void removeRestriction(PlatformMediaSession::MediaType, SessionRestrictions);
    WEBCORE_EXPORT SessionRestrictions restrictions(PlatformMediaSession::MediaType);
    virtual void resetRestrictions();

    virtual bool sessionWillBeginPlayback(PlatformMediaSession&);

    virtual void sessionWillEndPlayback(PlatformMediaSession&, DelayCallingUpdateNowPlaying);
    virtual void sessionStateChanged(PlatformMediaSession&);
    virtual void sessionDidEndRemoteScrubbing(PlatformMediaSession&) { };
    virtual void clientCharacteristicsChanged(PlatformMediaSession&, bool) { }
    virtual void sessionCanProduceAudioChanged();

#if PLATFORM(IOS_FAMILY)
    virtual void configureWirelessTargetMonitoring() { }
#endif
    virtual bool hasWirelessTargetsAvailable() { return false; }
    virtual bool isMonitoringWirelessTargets() const { return false; }

    virtual void setCurrentSession(PlatformMediaSession&);
    PlatformMediaSession* currentSession() const;

    void sessionIsPlayingToWirelessPlaybackTargetChanged(PlatformMediaSession&);

    WEBCORE_EXPORT void setIsPlayingToAutomotiveHeadUnit(bool);
    bool isPlayingToAutomotiveHeadUnit() const { return m_isPlayingToAutomotiveHeadUnit; }

    WEBCORE_EXPORT void setSupportsSpatialAudioPlayback(bool);
    virtual std::optional<bool> supportsSpatialAudioPlaybackForConfiguration(const MediaConfiguration&);

    void forEachMatchingSession(const Function<bool(const PlatformMediaSession&)>& predicate, const Function<void(PlatformMediaSession&)>& matchingCallback);

    bool processIsSuspended() const { return m_processIsSuspended; }

    WEBCORE_EXPORT void addAudioCaptureSource(AudioCaptureSource&);
    WEBCORE_EXPORT void removeAudioCaptureSource(AudioCaptureSource&);
    void audioCaptureSourceStateChanged() { updateSessionState(); }
    bool hasAudioCaptureSource(AudioCaptureSource& source) const { return m_audioCaptureSources.contains(source); }

    WEBCORE_EXPORT void processDidReceiveRemoteControlCommand(PlatformMediaSession::RemoteControlCommandType, const PlatformMediaSession::RemoteCommandArgument&);

    bool isInterrupted() const { return !!m_currentInterruption; }
    bool hasNoSession() const;

    virtual void addSupportedCommand(PlatformMediaSession::RemoteControlCommandType) { };
    virtual void removeSupportedCommand(PlatformMediaSession::RemoteControlCommandType) { };
    virtual RemoteCommandListener::RemoteCommandsSet supportedCommands() const { return { }; };

    WEBCORE_EXPORT void processSystemWillSleep();
    WEBCORE_EXPORT void processSystemDidWake();

    virtual void resetHaveEverRegisteredAsNowPlayingApplicationForTesting() { };
    virtual void resetSessionState() { };

    bool isApplicationInBackground() const { return m_isApplicationInBackground; }

    WeakPtr<PlatformMediaSession> bestEligibleSessionForRemoteControls(const Function<bool(const PlatformMediaSession&)>&, PlatformMediaSession::PlaybackControlsPurpose);

    WEBCORE_EXPORT void addNowPlayingMetadataObserver(const NowPlayingMetadataObserver&);
    WEBCORE_EXPORT void removeNowPlayingMetadataObserver(const NowPlayingMetadataObserver&);

    bool hasActiveNowPlayingSessionInGroup(std::optional<MediaSessionGroupIdentifier>);

    virtual void updatePresentingApplicationPIDIfNecessary(ProcessID) { }

protected:
    friend class PlatformMediaSession;
    static std::unique_ptr<PlatformMediaSessionManager> create();
    PlatformMediaSessionManager();

    virtual void addSession(PlatformMediaSession&);
    virtual void removeSession(PlatformMediaSession&);

    void forEachSession(const Function<void(PlatformMediaSession&)>&);
    void forEachSessionInGroup(std::optional<MediaSessionGroupIdentifier>, const Function<void(PlatformMediaSession&)>&);
    bool anyOfSessions(const Function<bool(const PlatformMediaSession&)>&) const;

    void maybeDeactivateAudioSession();
    bool maybeActivateAudioSession();

#if !RELEASE_LOG_DISABLED
    const Logger& logger() const final { return m_logger; }
    uint64_t logIdentifier() const final { return 0; }
    ASCIILiteral logClassName() const override { return "PlatformMediaSessionManager"_s; }
    WTFLogChannel& logChannel() const final;
#endif

    int countActiveAudioCaptureSources();

    bool computeSupportsSeeking() const;

    std::optional<bool> supportsSpatialAudioPlayback() { return m_supportsSpatialAudioPlayback; }

    void nowPlayingMetadataChanged(const NowPlayingMetadata&);
    void enqueueTaskOnMainThread(Function<void()>&&);

private:
    friend class Internals;

    void scheduleUpdateSessionState();
    virtual void updateSessionState() { }

    Vector<WeakPtr<PlatformMediaSession>> sessionsMatching(const Function<bool(const PlatformMediaSession&)>&) const;

#if !RELEASE_LOG_DISABLED
    void scheduleStateLog();
    void dumpSessionStates();
#endif

    SessionRestrictions m_restrictions[static_cast<unsigned>(PlatformMediaSession::MediaType::WebAudio) + 1];
    mutable Vector<WeakPtr<PlatformMediaSession>> m_sessions;

    std::optional<PlatformMediaSession::InterruptionType> m_currentInterruption;
    mutable bool m_isApplicationInBackground { false };
    bool m_willIgnoreSystemInterruptions { false };
    bool m_processIsSuspended { false };
    bool m_isPlayingToAutomotiveHeadUnit { false };
    std::optional<bool> m_supportsSpatialAudioPlayback;

    bool m_alreadyScheduledSessionStatedUpdate { false };
#if USE(AUDIO_SESSION)
    bool m_becameActive { false };
#endif

    WeakHashSet<AudioCaptureSource> m_audioCaptureSources;
    bool m_hasScheduledSessionStateUpdate { false };

    WeakHashSet<NowPlayingMetadataObserver> m_nowPlayingMetadataObservers;
    TaskCancellationGroup m_taskGroup;

#if ENABLE(VORBIS)
    static bool m_vorbisDecoderEnabled;
#endif
#if ENABLE(OPUS)
    static bool m_opusDecoderEnabled;
#endif
#if ENABLE(ALTERNATE_WEBM_PLAYER)
    static bool m_alternateWebMPlayerEnabled;
#endif
#if HAVE(SC_CONTENT_SHARING_PICKER)
    static bool s_useSCContentSharingPicker;
#endif

#if ENABLE(VP9)
    static bool m_vp9DecoderEnabled;
    static bool m_swVPDecodersAlwaysEnabled;
#endif

#if ENABLE(EXTENSION_CAPABILITIES)
    static bool s_mediaCapabilityGrantsEnabled;
#endif

#if !RELEASE_LOG_DISABLED
    UniqueRef<Timer> m_stateLogTimer;
    Ref<AggregateLogger> m_logger;
#endif
};

} // namespace WebCore
