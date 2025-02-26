/*
 * Copyright (C) 2016-2019 Apple Inc. All rights reserved.
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

#if PLATFORM(IOS_FAMILY) || (PLATFORM(MAC) && ENABLE(VIDEO_PRESENTATION_MODE))

#include "NowPlayingMetadataObserver.h"
#include "PlatformMediaSession.h"
#include "VideoReceiverEndpoint.h"
#include <wtf/CheckedRef.h>
#include <wtf/Forward.h>
#include <wtf/Ref.h>
#include <wtf/Vector.h>
#include <wtf/WeakPtr.h>

namespace WebCore {
class PlaybackSessionModel;
class PlaybackSessionModelClient;
}

namespace WebCore {

class TimeRanges;
class PlaybackSessionModelClient;
struct MediaSelectionOption;
struct SpatialVideoMetadata;

enum class AudioSessionSoundStageSize : uint8_t;

enum class PlaybackSessionModelExternalPlaybackTargetType : uint8_t {
    TargetTypeNone,
    TargetTypeAirPlay,
    TargetTypeTVOut
};

enum class PlaybackSessionModelPlaybackState : uint8_t {
    Playing = 1 << 0,
    Stalled = 1 << 1,
};

class PlaybackSessionModel : public CanMakeWeakPtr<PlaybackSessionModel> {
public:
    virtual ~PlaybackSessionModel() { };
    virtual void addClient(PlaybackSessionModelClient&) = 0;
    virtual void removeClient(PlaybackSessionModelClient&) = 0;

    // CheckedPtr interface
    virtual uint32_t checkedPtrCount() const = 0;
    virtual uint32_t checkedPtrCountWithoutThreadCheck() const = 0;
    virtual void incrementCheckedPtrCount() const = 0;
    virtual void decrementCheckedPtrCount() const = 0;

    virtual void play() = 0;
    virtual void pause() = 0;
    virtual void togglePlayState() = 0;
    virtual void beginScrubbing() = 0;
    virtual void endScrubbing() = 0;
    virtual void seekToTime(double time, double toleranceBefore = 0, double toleranceAfter = 0) = 0;
    virtual void fastSeek(double time) = 0;
    virtual void beginScanningForward() = 0;
    virtual void beginScanningBackward() = 0;
    virtual void endScanning() = 0;
    virtual void setDefaultPlaybackRate(double) = 0;
    virtual void setPlaybackRate(double) = 0;
    virtual void selectAudioMediaOption(uint64_t index) = 0;
    virtual void selectLegibleMediaOption(uint64_t index) = 0;
    virtual void togglePictureInPicture() = 0;
    virtual void enterInWindowFullscreen() = 0;
    virtual void exitInWindowFullscreen() = 0;
    virtual void enterFullscreen() = 0;
    virtual void exitFullscreen() = 0;
    virtual void toggleMuted() = 0;
    virtual void setMuted(bool) = 0;
    virtual void setVolume(double) = 0;
    virtual void setPlayingOnSecondScreen(bool) = 0;
    virtual void sendRemoteCommand(PlatformMediaSession::RemoteControlCommandType, const PlatformMediaSession::RemoteCommandArgument&) { };
    virtual void setVideoReceiverEndpoint(const VideoReceiverEndpoint&) = 0;

#if HAVE(SPATIAL_TRACKING_LABEL)
    virtual const String& spatialTrackingLabel() const { return emptyString(); }
    virtual void setSpatialTrackingLabel(const String&) { }
#endif

    virtual void addNowPlayingMetadataObserver(const WebCore::NowPlayingMetadataObserver&) { }
    virtual void removeNowPlayingMetadataObserver(const WebCore::NowPlayingMetadataObserver&) { }

    using ExternalPlaybackTargetType = PlaybackSessionModelExternalPlaybackTargetType;

    virtual double playbackStartedTime() const = 0;
    virtual double duration() const = 0;
    virtual double currentTime() const = 0;
    virtual double bufferedTime() const = 0;

    using PlaybackState = PlaybackSessionModelPlaybackState;

    virtual bool isPlaying() const = 0;
    virtual bool isStalled() const = 0;
    virtual bool isScrubbing() const = 0;
    virtual double defaultPlaybackRate() const = 0;
    virtual double playbackRate() const = 0;
    virtual Ref<TimeRanges> seekableRanges() const = 0;
    virtual double seekableTimeRangesLastModifiedTime() const = 0;
    virtual double liveUpdateInterval() const = 0;
    virtual bool canPlayFastReverse() const = 0;
    virtual Vector<MediaSelectionOption> audioMediaSelectionOptions() const = 0;
    virtual uint64_t audioMediaSelectedIndex() const = 0;
    virtual Vector<MediaSelectionOption> legibleMediaSelectionOptions() const = 0;
    virtual uint64_t legibleMediaSelectedIndex() const = 0;
    virtual bool externalPlaybackEnabled() const = 0;
    virtual ExternalPlaybackTargetType externalPlaybackTargetType() const = 0;
    virtual String externalPlaybackLocalizedDeviceName() const = 0;
    virtual bool wirelessVideoPlaybackDisabled() const = 0;
    virtual bool isMuted() const = 0;
    virtual double volume() const = 0;
    virtual bool isPictureInPictureSupported() const = 0;
    virtual bool isPictureInPictureActive() const = 0;
    virtual bool isInWindowFullscreenActive() const { return false; }
    virtual AudioSessionSoundStageSize soundStageSize() const = 0;
    virtual void setSoundStageSize(AudioSessionSoundStageSize) = 0;
#if ENABLE(LINEAR_MEDIA_PLAYER)
    virtual bool supportsLinearMediaPlayer() const { return false; }
#endif

#if !RELEASE_LOG_DISABLED
    virtual uint64_t logIdentifier() const { return 0; }
    virtual const Logger* loggerPtr() const { return nullptr; }
#endif
};

class PlaybackSessionModelClient : public CanMakeWeakPtr<PlaybackSessionModelClient> {
public:
    virtual ~PlaybackSessionModelClient() { };

    // CheckedPtr interface
    virtual uint32_t checkedPtrCount() const = 0;
    virtual uint32_t checkedPtrCountWithoutThreadCheck() const = 0;
    virtual void incrementCheckedPtrCount() const = 0;
    virtual void decrementCheckedPtrCount() const = 0;

    virtual void durationChanged(double) { }
    virtual void currentTimeChanged(double /* currentTime */, double /* anchorTime */) { }
    virtual void bufferedTimeChanged(double) { }
    virtual void playbackStartedTimeChanged(double /* playbackStartedTime */) { }
    virtual void rateChanged(OptionSet<PlaybackSessionModel::PlaybackState>, double /* playbackRate */, double /* defaultPlaybackRate */) { }
    virtual void seekableRangesChanged(const TimeRanges&, double /* lastModified */, double /* liveInterval */) { }
    virtual void canPlayFastReverseChanged(bool) { }
    virtual void audioMediaSelectionOptionsChanged(const Vector<MediaSelectionOption>& /* options */, uint64_t /* selectedIndex */) { }
    virtual void legibleMediaSelectionOptionsChanged(const Vector<MediaSelectionOption>& /* options */, uint64_t /* selectedIndex */) { }
    virtual void audioMediaSelectionIndexChanged(uint64_t) { }
    virtual void legibleMediaSelectionIndexChanged(uint64_t) { }
    virtual void externalPlaybackChanged(bool /* enabled */, PlaybackSessionModel::ExternalPlaybackTargetType, const String& /* localizedDeviceName */) { }
    virtual void wirelessVideoPlaybackDisabledChanged(bool) { }
    virtual void mutedChanged(bool) { }
    virtual void volumeChanged(double) { }
    virtual void isPictureInPictureSupportedChanged(bool) { }
    virtual void pictureInPictureActiveChanged(bool) { }
    virtual void isInWindowFullscreenActiveChanged(bool) { }
#if ENABLE(LINEAR_MEDIA_PLAYER)
    virtual void supportsLinearMediaPlayerChanged(bool) { }
    virtual void spatialVideoMetadataChanged(const std::optional<SpatialVideoMetadata>&) { };
#endif
    virtual void ensureControlsManager() { }
    virtual void modelDestroyed() { }
};

} // namespace WebCore

#endif // PLATFORM(IOS_FAMILY) || (PLATFORM(MAC) && ENABLE(VIDEO_PRESENTATION_MODE))
