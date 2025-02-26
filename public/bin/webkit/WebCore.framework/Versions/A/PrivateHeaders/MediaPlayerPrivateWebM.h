/*
 * Copyright (C) 2022 Apple Inc. All rights reserved.
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

#if ENABLE(ALTERNATE_WEBM_PLAYER)

#include "MediaPlayerPrivate.h"
#include "PlatformLayer.h"
#include "SourceBufferParserWebM.h"
#include "TimeRanges.h"
#include "VideoFrameMetadata.h"
#include "WebAVSampleBufferListener.h"
#include "WebMResourceClient.h"
#include <wtf/HashFunctions.h>
#include <wtf/LoggerHelper.h>
#include <wtf/NativePromise.h>
#include <wtf/StdUnorderedMap.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/UniqueRef.h>
#include <wtf/Vector.h>

OBJC_CLASS AVSampleBufferAudioRenderer;
OBJC_CLASS AVSampleBufferDisplayLayer;
OBJC_CLASS AVSampleBufferRenderSynchronizer;
OBJC_CLASS AVSampleBufferVideoRenderer;
OBJC_PROTOCOL(WebSampleBufferVideoRendering);

typedef struct __CVBuffer *CVPixelBufferRef;

namespace WTF {
class WorkQueue;
}

namespace WebCore {

class AudioTrackPrivateWebM;
class FragmentedSharedBuffer;
class MediaDescription;
class MediaPlaybackTarget;
class MediaSample;
class MediaSampleAVFObjC;
class PixelBufferConformerCV;
class ResourceError;
class SharedBuffer;
class TextTrackRepresentation;
class TrackBuffer;
class VideoFrame;
class VideoMediaSampleRenderer;
class VideoLayerManagerObjC;
class VideoTrackPrivateWebM;
class WebCoreDecompressionSession;

class MediaPlayerPrivateWebM
    : public MediaPlayerPrivateInterface
    , public WebMResourceClientParent
    , public WebAVSampleBufferListenerClient
    , private LoggerHelper {
    WTF_MAKE_TZONE_ALLOCATED(MediaPlayerPrivateWebM);
public:
    MediaPlayerPrivateWebM(MediaPlayer*);
    ~MediaPlayerPrivateWebM();

    constexpr MediaPlayerType mediaPlayerType() const final { return MediaPlayerType::CocoaWebM; }

    void ref() const final { WebMResourceClientParent::ref(); }
    void deref() const final { WebMResourceClientParent::deref(); }

    static void registerMediaEngine(MediaEngineRegistrar);
private:
    void setPreload(MediaPlayer::Preload) final;
    void doPreload();
    void load(const String&) final;
    bool createResourceClient();

#if ENABLE(MEDIA_SOURCE)
    void load(const URL&, const ContentType&, MediaSourcePrivateClient&) final;
#endif
#if ENABLE(MEDIA_STREAM)
    void load(MediaStreamPrivate&) final;
#endif
    
    // WebMResourceClientParent
    friend class WebMResourceClient;
    void dataLengthReceived(size_t) final;
    void dataReceived(const SharedBuffer&) final;
    void loadFailed(const ResourceError&) final;
    void loadFinished() final;

    void cancelLoad() final;

    PlatformLayer* platformLayer() const final;

    bool supportsPictureInPicture() const final { return true; }
    bool supportsFullscreen() const final { return true; }

    void prepareToPlay() final;
    void play() final;
    void pause() final;
    bool paused() const final;
    bool timeIsProgressing() const final;

    WebSampleBufferVideoRendering *layerOrVideoRenderer() const;

    FloatSize naturalSize() const final { return m_naturalSize; }

    bool hasVideo() const final { return m_hasVideo; }
    bool hasAudio() const final { return m_hasAudio; }

    void setPageIsVisible(bool) final;

    MediaTime timeFudgeFactor() const { return { 1, 10 }; }
    MediaTime currentTime() const final;
    MediaTime duration() const final { return m_duration; }
    MediaTime startTime() const final { return MediaTime::zeroTime(); }
    MediaTime initialTime() const final { return MediaTime::zeroTime(); }

    void setRateDouble(double) final;
    double rate() const final { return m_rate; }
    double effectiveRate() const final;

    void setVolume(float) final;
    void setMuted(bool) final;

    MediaPlayer::NetworkState networkState() const final { return m_networkState; }
    MediaPlayer::ReadyState readyState() const final { return m_readyState; }

    MediaTime maxTimeSeekable() const final { return duration(); }
    MediaTime minTimeSeekable() const final { return startTime(); }
    const PlatformTimeRanges& buffered() const final;

    void setBufferedRanges(PlatformTimeRanges);
    void updateBufferedFromTrackBuffers(bool);
    void updateDurationFromTrackBuffers();

    void setLoadingProgresssed(bool);
    bool didLoadingProgress() const final;

    RefPtr<NativeImage> nativeImageForCurrentTime() final;
    bool updateLastPixelBuffer();
    bool updateLastImage();
    void paint(GraphicsContext&, const FloatRect&) final;
    void paintCurrentFrameInContext(GraphicsContext&, const FloatRect&) final;
    RefPtr<VideoFrame> videoFrameForCurrentTime() final;
    DestinationColorSpace colorSpace() final;

    void setNaturalSize(FloatSize);
    void setHasAudio(bool);
    void setHasVideo(bool);
    void setHasAvailableVideoFrame(bool);
    bool hasAvailableVideoFrame() const final { return m_hasAvailableVideoFrame; }
    void setDuration(MediaTime);
    void setNetworkState(MediaPlayer::NetworkState);
    void setReadyState(MediaPlayer::ReadyState);
    void characteristicsChanged();

    void setPresentationSize(const IntSize&) final;
    bool supportsAcceleratedRendering() const final { return true; }
    void acceleratedRenderingStateChanged() final;
    void updateDisplayLayer();

    RetainPtr<PlatformLayer> createVideoFullscreenLayer() final;
    void setVideoFullscreenLayer(PlatformLayer*, Function<void()>&& completionHandler) final;
    void setVideoFullscreenFrame(FloatRect) final;

    void setTextTrackRepresentation(TextTrackRepresentation*) final;
    void syncTextTrackBounds() final;
        
    String engineDescription() const final;
    MediaPlayer::MovieLoadType movieLoadType() const final { return MediaPlayer::MovieLoadType::Download; }
        
#if ENABLE(WIRELESS_PLAYBACK_TARGET)
    bool isCurrentPlaybackTargetWireless() const final;
    void setWirelessPlaybackTarget(Ref<MediaPlaybackTarget>&&) final;
    void setShouldPlayToPlaybackTarget(bool) final;
    bool wirelessVideoPlaybackDisabled() const final { return false; }
#endif

    std::optional<VideoPlaybackQualityMetrics> videoPlaybackQualityMetrics() final;

    void enqueueSample(Ref<MediaSample>&&, TrackID);
    enum class NeedsFlush: bool {
        No = 0,
        Yes
    };
    void reenqueSamples(TrackID, NeedsFlush = NeedsFlush::Yes);
    void reenqueueMediaForTime(TrackBuffer&, TrackID, const MediaTime&, NeedsFlush = NeedsFlush::Yes);
    void notifyClientWhenReadyForMoreSamples(TrackID);

    void setMinimumUpcomingPresentationTime(TrackID, const MediaTime&);
    void clearMinimumUpcomingPresentationTime(TrackID);

    bool isReadyForMoreSamples(TrackID);
    void didBecomeReadyForMoreSamples(TrackID);
    void appendCompleted(bool);
    void provideMediaData(TrackID);
    void provideMediaData(TrackBuffer&, TrackID);

    void trackDidChangeSelected(VideoTrackPrivate&, bool);
    void trackDidChangeEnabled(AudioTrackPrivate&, bool);

    using InitializationSegment = SourceBufferParserWebM::InitializationSegment;
    void didParseInitializationData(InitializationSegment&&);
    void didProvideMediaDataForTrackId(Ref<MediaSampleAVFObjC>&&, TrackID, const String& mediaType);
    void didUpdateFormatDescriptionForTrackId(Ref<TrackInfo>&&, TrackID);

    void flush();
#if PLATFORM(IOS_FAMILY)
    void flushIfNeeded();
#endif
    void flushTrack(TrackID);
    void flushVideo();
    void flushAudio(AVSampleBufferAudioRenderer*);

    void addTrackBuffer(TrackID, RefPtr<MediaDescription>&&);

    bool shouldEnsureLayerOrVideoRenderer() const;
    void ensureLayer();
    void destroyLayer();
    void ensureVideoRenderer();
    void destroyVideoRenderer();

    void ensureLayerOrVideoRenderer(MediaPlayerEnums::NeedsRenderingModeChanged);
    void destroyLayerOrVideoRendererAndCreateRenderlessVideoMediaSampleRenderer();
    void configureLayerOrVideoRenderer(WebSampleBufferVideoRendering *);

    void addAudioRenderer(TrackID);
    void removeAudioRenderer(TrackID);
    void destroyAudioRenderer(RetainPtr<AVSampleBufferAudioRenderer>);
    void destroyAudioRenderers();
    void clearTracks();

    void configureVideoRenderer(VideoMediaSampleRenderer&);
    void invalidateVideoRenderer(VideoMediaSampleRenderer&);
    void setVideoRenderer(WebSampleBufferVideoRendering *);
    void stageVideoRenderer(WebSampleBufferVideoRendering *);

    void startVideoFrameMetadataGathering() final;
    void stopVideoFrameMetadataGathering() final;
    std::optional<VideoFrameMetadata> videoFrameMetadata() final { return std::exchange(m_videoFrameMetadata, { }); }
    void setResourceOwner(const ProcessIdentity& resourceOwner) final { m_resourceOwner = resourceOwner; }

    void checkNewVideoFrameMetadata(const MediaTime& presentationTime, double displayTime);

    // WebAVSampleBufferListenerParent
    // Methods are called on the WebMResourceClient's WorkQueue
    void videoRendererDidReceiveError(WebSampleBufferVideoRendering *, NSError *) final;
    void audioRendererDidReceiveError(AVSampleBufferAudioRenderer *, NSError *) final;

    void setShouldDisableHDR(bool) final;
    void playerContentBoxRectChanged(const LayoutRect&) final;
    void setShouldMaintainAspectRatio(bool) final;
    bool m_shouldMaintainAspectRatio { true };

#if HAVE(SPATIAL_TRACKING_LABEL)
    const String& defaultSpatialTrackingLabel() const final;
    void setDefaultSpatialTrackingLabel(const String&) final;
    const String& spatialTrackingLabel() const final;
    void setSpatialTrackingLabel(const String&) final;
    void updateSpatialTrackingLabel();
#endif

#if ENABLE(LINEAR_MEDIA_PLAYER)
    void setVideoTarget(const PlatformVideoTarget&) final;
#endif
    void isInFullscreenOrPictureInPictureChanged(bool) final;

#if ENABLE(LINEAR_MEDIA_PLAYER)
    bool supportsLinearMediaPlayer() const final { return true; }
#endif

    enum class AcceleratedVideoMode: uint8_t {
        Layer = 0,
        StagedVideoRenderer,
        VideoRenderer,
        StagedLayer
    };
    AcceleratedVideoMode acceleratedVideoMode() const;

    const Logger& logger() const final { return m_logger.get(); }
    ASCIILiteral logClassName() const final { return "MediaPlayerPrivateWebM"_s; }
    uint64_t logIdentifier() const final { return m_logIdentifier; }
    WTFLogChannel& logChannel() const final;

    friend class MediaPlayerFactoryWebM;
    static bool isAvailable();
    static void getSupportedTypes(HashSet<String>&);
    static MediaPlayer::SupportsType supportsType(const MediaEngineSupportParameters&);

    void maybeFinishLoading();
    void readyToProcessData();

    URL m_assetURL;
    MediaPlayer::Preload m_preload { MediaPlayer::Preload::Auto };
    ThreadSafeWeakPtr<MediaPlayer> m_player;
    RetainPtr<AVSampleBufferRenderSynchronizer> m_synchronizer;
    RetainPtr<id> m_durationObserver;
    RetainPtr<CVPixelBufferRef> m_lastPixelBuffer;
    MediaTime m_lastPixelBufferPresentationTimeStamp;
    RefPtr<NativeImage> m_lastImage;
    std::unique_ptr<PixelBufferConformerCV> m_rgbConformer;
    RefPtr<WebMResourceClient> m_resourceClient;

    Vector<RefPtr<VideoTrackPrivateWebM>> m_videoTracks;
    Vector<RefPtr<AudioTrackPrivateWebM>> m_audioTracks;
    StdUnorderedMap<TrackID, UniqueRef<TrackBuffer>> m_trackBufferMap;
    StdUnorderedMap<TrackID, bool> m_readyForMoreSamplesMap;
    PlatformTimeRanges m_buffered;

    RefPtr<VideoMediaSampleRenderer> m_videoRenderer;
    RefPtr<VideoMediaSampleRenderer> m_expiringVideoRenderer;

    RetainPtr<AVSampleBufferDisplayLayer> m_sampleBufferDisplayLayer;
    RetainPtr<AVSampleBufferVideoRenderer> m_sampleBufferVideoRenderer;
    StdUnorderedMap<TrackID, RetainPtr<AVSampleBufferAudioRenderer>> m_audioRenderers;
    Ref<SourceBufferParserWebM> m_parser;
    const Ref<WTF::WorkQueue> m_appendQueue;

    MediaPlayer::NetworkState m_networkState { MediaPlayer::NetworkState::Empty };
    MediaPlayer::ReadyState m_readyState { MediaPlayer::ReadyState::HaveNothing };

#if ENABLE(WIRELESS_PLAYBACK_TARGET)
    RefPtr<MediaPlaybackTarget> m_playbackTarget;
    bool m_shouldPlayToTarget { false };
#endif
    Ref<const Logger> m_logger;
    const uint64_t m_logIdentifier;
    std::unique_ptr<VideoLayerManagerObjC> m_videoLayerManager;
    bool m_isGatheringVideoFrameMetadata { false };
    std::optional<VideoFrameMetadata> m_videoFrameMetadata;
    uint64_t m_lastConvertedSampleCount { 0 };
    ProcessIdentity m_resourceOwner;

    FloatSize m_naturalSize;
    MediaTime m_currentTime;
    MediaTime m_duration;
    double m_rate { 1 };

    bool isEnabledVideoTrackID(TrackID) const;
    bool hasSelectedVideo() const;
    std::optional<TrackID> m_enabledVideoTrackID;
    std::atomic<uint32_t> m_abortCalled { 0 };
    size_t m_contentLength { 0 };
    size_t m_contentReceived { 0 };
    uint32_t m_pendingAppends { 0 };
#if PLATFORM(IOS_FAMILY)
    bool m_displayLayerWasInterrupted { false };
#endif
    bool m_hasAudio { false };
    bool m_hasVideo { false };
    bool m_hasAvailableVideoFrame { false };
    bool m_visible { false };
    mutable bool m_loadingProgressed { false };
    bool m_loadFinished { false };
    bool m_errored { false };
    bool m_processingInitializationSegment { false };
    Ref<WebAVSampleBufferListener> m_listener;

    // Seek logic support
    void seekToTarget(const SeekTarget&) final;
    bool seeking() const final;
    void seekInternal();
    Ref<GenericPromise> seekTo(const MediaTime&);
    void maybeCompleteSeek();
    MediaTime clampTimeToLastSeekTime(const MediaTime&) const;
    bool shouldBePlaying() const;

    bool m_isPlaying { false };
    RetainPtr<id> m_timeJumpedObserver;
    Timer m_seekTimer;
    MediaTime m_lastSeekTime;
    std::optional<SeekTarget> m_pendingSeek;
    enum SeekState {
        Seeking,
        WaitingForAvailableFame,
        SeekCompleted,
    };
    SeekState m_seekState { SeekCompleted };
    std::optional<GenericPromise::Producer> m_seekPromise;
    bool m_isSynchronizerSeeking { false };
#if HAVE(SPATIAL_TRACKING_LABEL)
    String m_defaultSpatialTrackingLabel;
    String m_spatialTrackingLabel;
#endif
#if ENABLE(LINEAR_MEDIA_PLAYER)
    bool m_usingLinearMediaPlayer { false };
    RetainPtr<FigVideoTargetRef> m_videoTarget;
#endif
};

} // namespace WebCore

#endif // ENABLE(ALTERNATE_WEBM_PLAYER)
