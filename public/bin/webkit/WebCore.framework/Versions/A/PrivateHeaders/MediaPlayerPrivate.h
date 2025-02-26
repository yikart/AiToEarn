/*
 * Copyright (C) 2009-2018 Apple Inc. All rights reserved.
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

#if ENABLE(VIDEO)

#include "MediaPlayer.h"
#include "MediaPlayerIdentifier.h"
#include "NativeImage.h"
#include "PlatformTimeRanges.h"
#include "ProcessIdentity.h"
#include <optional>
#include <wtf/AbstractRefCounted.h>
#include <wtf/CompletionHandler.h>

#if ENABLE(LEGACY_ENCRYPTED_MEDIA)
#include "LegacyCDMSession.h"
#endif

namespace WebCore {

class VideoFrame;

// MediaPlayerPrivateInterface subclasses should be ref-counted, but each subclass may choose whether
// to be RefCounted or ThreadSafeRefCounted. Therefore, each subclass must implement a pair of
// virtual ref()/deref() methods. See NullMediaPlayerPrivate for an example.
class MediaPlayerPrivateInterface : public AbstractRefCounted {
public:
    WEBCORE_EXPORT MediaPlayerPrivateInterface();
    WEBCORE_EXPORT virtual ~MediaPlayerPrivateInterface();

    virtual constexpr MediaPlayerType mediaPlayerType() const = 0;

    virtual void load(const String&) { }
    virtual void load(const URL& url, const ContentType&, const String&) { load(url.string()); }

#if ENABLE(MEDIA_SOURCE)
    virtual void load(const URL&, const ContentType&, MediaSourcePrivateClient&) = 0;
#endif
#if ENABLE(MEDIA_STREAM)
    virtual void load(MediaStreamPrivate&) = 0;
#endif
    virtual void cancelLoad() = 0;

    virtual void prepareForPlayback(bool privateMode, MediaPlayer::Preload preload, bool preservesPitch, bool prepareToPlay, bool prepareToRender)
    {
        setPrivateBrowsingMode(privateMode);
        setPreload(preload);
        setPreservesPitch(preservesPitch);
        if (prepareToPlay)
            this->prepareToPlay();
        if (prepareToRender)
            prepareForRendering();
    }

    virtual void prepareToPlay() { }
    virtual PlatformLayer* platformLayer() const { return nullptr; }

#if ENABLE(VIDEO_PRESENTATION_MODE)
    virtual RetainPtr<PlatformLayer> createVideoFullscreenLayer() { return nullptr; }
    virtual void setVideoFullscreenLayer(PlatformLayer*, Function<void()>&& completionHandler) { completionHandler(); }
    virtual void updateVideoFullscreenInlineImage() { }
    virtual void setVideoFullscreenFrame(FloatRect) { }
    virtual void setVideoFullscreenGravity(MediaPlayer::VideoGravity) { }
    virtual void setVideoFullscreenMode(MediaPlayer::VideoFullscreenMode) { }
    virtual void videoFullscreenStandbyChanged() { }
#endif

    using LayerHostingContextIDCallback = CompletionHandler<void(LayerHostingContextID)>;
    virtual void requestHostingContextID(LayerHostingContextIDCallback&& completionHandler) { completionHandler({ }); }
    virtual LayerHostingContextID hostingContextID() const { return 0; }
    virtual FloatSize videoLayerSize() const { return { }; }
    virtual void setVideoLayerSizeFenced(const FloatSize&, WTF::MachSendRight&&) { }

#if PLATFORM(IOS_FAMILY)
    virtual NSArray *timedMetadata() const { return nil; }
    virtual String accessLog() const { return emptyString(); }
    virtual String errorLog() const { return emptyString(); }
#endif
    virtual long platformErrorCode() const { return 0; }

    virtual void play() = 0;
    virtual void pause() = 0;
    virtual void setBufferingPolicy(MediaPlayer::BufferingPolicy) { }

    virtual bool supportsPictureInPicture() const { return false; }
    virtual bool supportsFullscreen() const { return false; }
    virtual bool supportsScanning() const { return false; }
    virtual bool supportsProgressMonitoring() const { return true; }
    virtual bool requiresImmediateCompositing() const { return false; }

    virtual bool canSaveMediaData() const { return false; }

    virtual FloatSize naturalSize() const = 0;

    virtual bool hasVideo() const = 0;
    virtual bool hasAudio() const = 0;

    virtual void setPageIsVisible(bool) = 0;
    virtual void setVisibleForCanvas(bool visible) { setPageIsVisible(visible); }
    virtual void setVisibleInViewport(bool) { }

    virtual MediaTime duration() const { return MediaTime::zeroTime(); }

    WEBCORE_EXPORT virtual MediaTime currentOrPendingSeekTime() const;
    virtual MediaTime currentTime() const { return MediaTime::zeroTime(); }
    virtual bool timeIsProgressing() const { return !paused(); }

    virtual bool setCurrentTimeDidChangeCallback(MediaPlayer::CurrentTimeDidChangeCallback&&) { return false; }

    virtual MediaTime getStartDate() const { return MediaTime::createWithDouble(std::numeric_limits<double>::quiet_NaN()); }

    virtual void willSeekToTarget(const MediaTime& time) { m_pendingSeekTime = time; }
    virtual MediaTime pendingSeekTime() const { return m_pendingSeekTime; }
    virtual void seekToTarget(const SeekTarget&) = 0;
    virtual bool seeking() const = 0;

    virtual MediaTime startTime() const { return MediaTime::zeroTime(); }
    virtual MediaTime initialTime() const { return MediaTime::zeroTime(); }

    virtual void setRate(float) { }
    virtual void setRateDouble(double rate) { setRate(rate); }
    virtual double rate() const { return 0; }
    virtual double effectiveRate() const { return rate(); }

    virtual void setPreservesPitch(bool) { }
    virtual void setPitchCorrectionAlgorithm(MediaPlayer::PitchCorrectionAlgorithm) { }

    // Indicates whether playback is currently paused indefinitely: such as having been paused
    // explicitly by the HTMLMediaElement or through remote media playback control.
    // This excludes video potentially playing but having stalled.
    virtual bool paused() const = 0;

    virtual void setVolume(float) { }
    virtual void setVolumeDouble(double volume) { return setVolume(volume); }
#if PLATFORM(IOS_FAMILY) || USE(GSTREAMER)
    virtual float volume() const { return 1; }
#endif

    virtual void setMuted(bool) { }

    virtual bool hasClosedCaptions() const { return false; }
    virtual void setClosedCaptionsVisible(bool) { }

    virtual double maxFastForwardRate() const { return std::numeric_limits<double>::infinity(); }
    virtual double minFastReverseRate() const { return -std::numeric_limits<double>::infinity(); }

    virtual MediaPlayer::NetworkState networkState() const = 0;
    virtual MediaPlayer::ReadyState readyState() const = 0;

    WEBCORE_EXPORT virtual const PlatformTimeRanges& seekable() const;
    virtual MediaTime maxTimeSeekable() const { return MediaTime::zeroTime(); }
    virtual MediaTime minTimeSeekable() const { return MediaTime::zeroTime(); }
    virtual const PlatformTimeRanges& buffered() const = 0;
    virtual double seekableTimeRangesLastModifiedTime() const { return 0; }
    virtual double liveUpdateInterval() const { return 0; }

    virtual unsigned long long totalBytes() const { return 0; }
    virtual bool didLoadingProgress() const = 0;
    // The default implementation of didLoadingProgressAsync is implemented in terms of
    // synchronous didLoadingProgress() calls. Implementations may also
    // override didLoadingProgressAsync to create a more proper async implementation.
    virtual void didLoadingProgressAsync(MediaPlayer::DidLoadingProgressCompletionHandler&& callback) const { callback(didLoadingProgress()); }

    virtual void setPresentationSize(const IntSize&) { }

    virtual void paint(GraphicsContext&, const FloatRect&) = 0;

    virtual void paintCurrentFrameInContext(GraphicsContext& c, const FloatRect& r) { paint(c, r); }

    virtual RefPtr<VideoFrame> videoFrameForCurrentTime();
    virtual RefPtr<NativeImage> nativeImageForCurrentTime() { return nullptr; }
    virtual DestinationColorSpace colorSpace() = 0;
    virtual bool shouldGetNativeImageForCanvasDrawing() const { return true; }

    virtual void setShouldDisableHDR(bool) { }

    virtual void setPreload(MediaPlayer::Preload) { }

    virtual bool hasAvailableVideoFrame() const { return readyState() >= MediaPlayer::ReadyState::HaveCurrentData; }

#if ENABLE(WIRELESS_PLAYBACK_TARGET)

    virtual String wirelessPlaybackTargetName() const { return emptyString(); }
    virtual MediaPlayer::WirelessPlaybackTargetType wirelessPlaybackTargetType() const { return MediaPlayer::WirelessPlaybackTargetType::TargetTypeNone; }

    virtual bool wirelessVideoPlaybackDisabled() const { return true; }
    virtual void setWirelessVideoPlaybackDisabled(bool) { }

    virtual bool canPlayToWirelessPlaybackTarget() const { return false; }
    virtual bool isCurrentPlaybackTargetWireless() const { return false; }
    virtual void setWirelessPlaybackTarget(Ref<MediaPlaybackTarget>&&) { }

    virtual void setShouldPlayToPlaybackTarget(bool) { }
#endif

    // whether accelerated rendering is supported by the media engine for the current media.
    virtual bool supportsAcceleratedRendering() const { return false; }
    // called when the rendering system flips the into or out of accelerated rendering mode.
    virtual void acceleratedRenderingStateChanged() { }

    virtual void setShouldMaintainAspectRatio(bool) { }

    virtual bool didPassCORSAccessCheck() const { return false; }
    virtual std::optional<bool> isCrossOrigin(const SecurityOrigin&) const { return std::nullopt; }

    virtual MediaPlayer::MovieLoadType movieLoadType() const { return MediaPlayer::MovieLoadType::Unknown; }

    virtual void prepareForRendering() { }

    // Time value in the movie's time scale. It is only necessary to override this if the media
    // engine uses rational numbers to represent media time.
    virtual MediaTime mediaTimeForTimeValue(const MediaTime& timeValue) const { return timeValue; }

    // Overide this if it is safe for HTMLMediaElement to cache movie time and report
    // 'currentTime' as [cached time + elapsed wall time]. Returns the maximum wall time
    // it is OK to calculate movie time before refreshing the cached time.
    virtual double maximumDurationToCacheMediaTime() const { return 0; }

    virtual unsigned decodedFrameCount() const { return 0; }
    virtual unsigned droppedFrameCount() const { return 0; }
    virtual unsigned audioDecodedByteCount() const { return 0; }
    virtual unsigned videoDecodedByteCount() const { return 0; }

    HashSet<SecurityOriginData> originsInMediaCache(const String&) { return { }; }
    void clearMediaCache(const String&, WallTime) { }
    void clearMediaCacheForOrigins(const String&, const HashSet<SecurityOriginData>&) { }

    virtual void setPrivateBrowsingMode(bool) { }

    virtual String engineDescription() const { return emptyString(); }

#if ENABLE(WEB_AUDIO)
    virtual AudioSourceProvider* audioSourceProvider() { return 0; }
#endif

#if ENABLE(LEGACY_ENCRYPTED_MEDIA)
    virtual RefPtr<LegacyCDMSession> createSession(const String&, LegacyCDMSessionClient&) { return nullptr; }
    virtual void setCDM(LegacyCDM*) { }
    virtual void setCDMSession(LegacyCDMSession*) { }
    virtual void keyAdded() { }
#endif

#if ENABLE(ENCRYPTED_MEDIA)
    virtual void cdmInstanceAttached(CDMInstance&) { }
    virtual void cdmInstanceDetached(CDMInstance&) { }
    virtual void attemptToDecryptWithInstance(CDMInstance&) { }
    virtual bool waitingForKey() const { return false; }
#endif

#if ENABLE(LEGACY_ENCRYPTED_MEDIA) && ENABLE(ENCRYPTED_MEDIA)
    virtual void setShouldContinueAfterKeyNeeded(bool) { }
#endif

    virtual void setTextTrackRepresentation(TextTrackRepresentation*) { }
    virtual void syncTextTrackBounds() { };
    virtual void tracksChanged() { };

#if USE(GSTREAMER)
    virtual void simulateAudioInterruption() { }
#endif

    virtual void beginSimulatedHDCPError() { }
    virtual void endSimulatedHDCPError() { }

    virtual String languageOfPrimaryAudioTrack() const { return emptyString(); }

    virtual size_t extraMemoryCost() const
    {
        MediaTime duration = this->duration();
        if (!duration)
            return 0;

        unsigned long long extra = totalBytes() * buffered().totalDuration().toDouble() / duration.toDouble();
        return static_cast<unsigned>(extra);
    }

    virtual unsigned long long fileSize() const { return 0; }

    virtual bool ended() const { return false; }

    virtual std::optional<VideoPlaybackQualityMetrics> videoPlaybackQualityMetrics() { return std::nullopt; }
    using VideoPlaybackQualityMetricsPromise = MediaPlayer::VideoPlaybackQualityMetricsPromise;
    WEBCORE_EXPORT virtual Ref<VideoPlaybackQualityMetricsPromise> asyncVideoPlaybackQualityMetrics();

    virtual void notifyTrackModeChanged() { }

    virtual void notifyActiveSourceBuffersChanged() { }

    virtual void setShouldDisableSleep(bool) { }

    virtual void applicationWillResignActive() { }
    virtual void applicationDidBecomeActive() { }

#if USE(AVFOUNDATION)
    virtual AVPlayer *objCAVFoundationAVPlayer() const { return nullptr; }
    virtual void setDecompressionSessionPreferences(bool, bool) { }
#endif

    virtual bool performTaskAtTime(Function<void()>&&, const MediaTime&) { return false; }

    virtual bool shouldIgnoreIntrinsicSize() { return false; }

    virtual void setPreferredDynamicRangeMode(DynamicRangeMode) { }

    virtual void audioOutputDeviceChanged() { }

    virtual std::optional<MediaPlayerIdentifier> identifier() const { return std::nullopt; }

    virtual bool supportsPlayAtHostTime() const { return false; }
    virtual bool supportsPauseAtHostTime() const { return false; }
    virtual bool playAtHostTime(const MonotonicTime&) { return false; }
    virtual bool pauseAtHostTime(const MonotonicTime&) { return false; }

    virtual std::optional<VideoFrameMetadata> videoFrameMetadata();
    virtual void startVideoFrameMetadataGathering() { }
    virtual void stopVideoFrameMetadataGathering() { }

    virtual void playerContentBoxRectChanged(const LayoutRect&) { }

    virtual void setResourceOwner(const ProcessIdentity&) { }

    virtual String errorMessage() const { return { }; }

    virtual void renderVideoWillBeDestroyed() { }

    virtual void mediaPlayerWillBeDestroyed() { }

    virtual void isLoopingChanged() { }

    virtual void setShouldCheckHardwareSupport(bool value) { m_shouldCheckHardwareSupport = value; }
    bool shouldCheckHardwareSupport() const { return m_shouldCheckHardwareSupport; }

    virtual void setVideoTarget(const PlatformVideoTarget&) { }

#if HAVE(SPATIAL_TRACKING_LABEL)
    virtual const String& defaultSpatialTrackingLabel() const { return emptyString(); }
    virtual void setDefaultSpatialTrackingLabel(const String&) { }
    virtual const String& spatialTrackingLabel() const { return emptyString(); }
    virtual void setSpatialTrackingLabel(const String&) { }
#endif

    virtual void isInFullscreenOrPictureInPictureChanged(bool) { }

#if ENABLE(LINEAR_MEDIA_PLAYER)
    virtual bool supportsLinearMediaPlayer() const { return false; }
#endif

protected:
    mutable PlatformTimeRanges m_seekable;
    bool m_shouldCheckHardwareSupport { false };
    MediaTime m_pendingSeekTime { MediaTime::invalidTime() };
};

}

#endif
