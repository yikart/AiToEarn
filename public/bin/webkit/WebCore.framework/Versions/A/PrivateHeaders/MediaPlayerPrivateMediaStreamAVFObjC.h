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

#if ENABLE(MEDIA_STREAM) && USE(AVFOUNDATION)

#include "MediaPlayerPrivate.h"
#include "MediaStreamPrivate.h"
#include "SampleBufferDisplayLayer.h"
#include <wtf/Deque.h>
#include <wtf/Forward.h>
#include <wtf/Lock.h>
#include <wtf/LoggerHelper.h>
#include <wtf/RefCounted.h>
#include <wtf/RobinHoodHashMap.h>

OBJC_CLASS AVSampleBufferDisplayLayer;
OBJC_CLASS WebRootSampleBufferBoundsChangeListener;

namespace WebCore {

class AudioTrackPrivateMediaStream;
class AVVideoCaptureSource;
class MediaSourcePrivateClient;
class PixelBufferConformerCV;
class VideoLayerManagerObjC;
class VideoTrackPrivateMediaStream;

enum class VideoFrameRotation : uint16_t;

class MediaPlayerPrivateMediaStreamAVFObjC final
    : public MediaPlayerPrivateInterface
    , public RefCounted<MediaPlayerPrivateMediaStreamAVFObjC>
    , private MediaStreamPrivateObserver
    , public MediaStreamTrackPrivateObserver
    , public RealtimeMediaSource::VideoFrameObserver
    , public SampleBufferDisplayLayerClient
    , private LoggerHelper
{
public:
    void ref() const final { RefCounted::ref(); }
    void deref() const final { RefCounted::deref(); }

    explicit MediaPlayerPrivateMediaStreamAVFObjC(MediaPlayer*);
    virtual ~MediaPlayerPrivateMediaStreamAVFObjC();

    constexpr MediaPlayerType mediaPlayerType() const final { return MediaPlayerType::AVFObjCMediaStream; }

    static void registerMediaEngine(MediaEngineRegistrar);

    using NativeImageCreator = RefPtr<NativeImage> (*)(const VideoFrame&);
    WEBCORE_EXPORT static void setNativeImageCreator(NativeImageCreator&&);

    // MediaPlayer Factory Methods
    static bool isAvailable();
    static void getSupportedTypes(HashSet<String>& types);
    static MediaPlayer::SupportsType supportsType(const MediaEngineSupportParameters&);

    MediaPlayer::NetworkState networkState() const override;
    void setNetworkState(MediaPlayer::NetworkState);
    MediaPlayer::ReadyState readyState() const override;
    void setReadyState(MediaPlayer::ReadyState);

    void ensureLayers();
    void destroyLayers();

    const Logger& logger() const final { return m_logger.get(); }
    ASCIILiteral logClassName() const override { return "MediaPlayerPrivateMediaStreamAVFObjC"_s; }
    uint64_t logIdentifier() const final { return m_logIdentifier; }
    WTFLogChannel& logChannel() const final;

    USING_CAN_MAKE_WEAKPTR(MediaStreamTrackPrivateObserver);

private:
    PlatformLayer* rootLayer() const;
    void rootLayerBoundsDidChange();

    // MediaPlayerPrivateInterface

    // FIXME(146853): Implement necessary conformations to standard in HTMLMediaElement for MediaStream

    bool didPassCORSAccessCheck() const final;

    void load(const String&) override;
#if ENABLE(MEDIA_SOURCE)
    void load(const URL&, const ContentType&, MediaSourcePrivateClient&) override;
#endif
    void load(MediaStreamPrivate&) override;
    void cancelLoad() override;

    void prepareToPlay() override;
    PlatformLayer* platformLayer() const override;
    
    bool supportsPictureInPicture() const final { return true; }
    bool supportsFullscreen() const override { return true; }

    void play() override;
    void pause() override;
    bool paused() const override { return !playing(); }

    void setVolume(float) override;
    void setMuted(bool) override;

    bool supportsScanning() const override { return false; }

    FloatSize naturalSize() const override { return m_intrinsicSize; }

    bool hasVideo() const override;
    bool hasAudio() const override;

    void setPageIsVisible(bool) final;
    void setVisibleForCanvas(bool) final;
    void setVisibleInViewport(bool) final;

    MediaTime duration() const override;
    MediaTime currentTime() const override;

    void seekToTarget(const SeekTarget&) final { };
    bool seeking() const final { return false; }

    const PlatformTimeRanges& seekable() const override;
    const PlatformTimeRanges& buffered() const override;

    bool didLoadingProgress() const override { return m_playing; }

    void flushRenderers();

    void processNewVideoFrame(VideoFrame&, VideoFrameTimeMetadata, Seconds);
    void enqueueVideoFrame(VideoFrame&);
    void reenqueueCurrentVideoFrameIfNeeded();
    void requestNotificationWhenReadyForVideoData();

    void setPresentationSize(const IntSize&) final;
    void paint(GraphicsContext&, const FloatRect&) override;
    void paintCurrentFrameInContext(GraphicsContext&, const FloatRect&) override;
    RefPtr<VideoFrame> videoFrameForCurrentTime() override;
    DestinationColorSpace colorSpace() override;
    bool metaDataAvailable() const { return m_mediaStreamPrivate && m_readyState >= MediaPlayer::ReadyState::HaveMetadata; }

    void acceleratedRenderingStateChanged() final { updateLayersAsNeeded(); }
    bool supportsAcceleratedRendering() const override { return true; }

    MediaPlayer::MovieLoadType movieLoadType() const override { return MediaPlayer::MovieLoadType::LiveStream; }

    String engineDescription() const override;

    size_t extraMemoryCost() const override { return 0; }

    bool ended() const override { return m_ended; }

    void setBufferingPolicy(MediaPlayer::BufferingPolicy) override;
    void audioOutputDeviceChanged() final;
    std::optional<VideoFrameMetadata> videoFrameMetadata() final;
    void setResourceOwner(const ProcessIdentity&) final { ASSERT_NOT_REACHED(); }
    void renderVideoWillBeDestroyed() final { destroyLayers(); }
    void setShouldMaintainAspectRatio(bool) final;

    MediaPlayer::ReadyState currentReadyState();
    void updateReadyState();

    void updateTracks();
    void updateRenderingMode();
    void scheduleRenderingModeChanged();
    void checkSelectedVideoTrack();
    void updateDisplayLayer();

    enum class SizeChanged : bool { No, Yes };
    void scheduleTaskForCharacteristicsChanged(SizeChanged);
    void scheduleDeferredTask(Function<void ()>&&);

    void layersAreInitialized(IntSize, bool);
    void updateLayersAsNeeded();

    enum DisplayMode {
        None,
        PaintItBlack,
        WaitingForFirstImage,
        PausedImage,
        LivePreview,
    };
    DisplayMode currentDisplayMode() const;
    bool updateDisplayMode();
    void updateCurrentFrameImage();

    enum class PlaybackState {
        None,
        Playing,
        Paused,
    };
    bool playing() const { return m_playbackState == PlaybackState::Playing; }

    // MediaStreamPrivateObserver
    void activeStatusChanged() override;
    void characteristicsChanged() override;
    void didAddTrack(MediaStreamTrackPrivate&) override;
    void didRemoveTrack(MediaStreamTrackPrivate&) override;

    // MediaStreamPrivateTrack::Observer
    void trackStarted(MediaStreamTrackPrivate&) override { };
    void trackEnded(MediaStreamTrackPrivate&) override { };
    void trackMutedChanged(MediaStreamTrackPrivate&) override { };
    void trackSettingsChanged(MediaStreamTrackPrivate&) override { };
    void trackEnabledChanged(MediaStreamTrackPrivate&) override { };
    void readyStateChanged(MediaStreamTrackPrivate&) override;

    // RealtimeMediaSouce::VideoFrameObserver
    void videoFrameAvailable(VideoFrame&, VideoFrameTimeMetadata) final;

#if ENABLE(VIDEO_PRESENTATION_MODE)
    RetainPtr<PlatformLayer> createVideoFullscreenLayer() override;
    void setVideoFullscreenLayer(PlatformLayer*, Function<void()>&& completionHandler) override;
    void setVideoFullscreenFrame(FloatRect) override;
#endif

    AudioSourceProvider* audioSourceProvider() final;

    void applicationDidBecomeActive() final;

    bool hideRootLayer() const { return (!activeVideoTrack() || m_waitingForFirstImage) && m_displayMode != PaintItBlack; }

    MediaStreamTrackPrivate* activeVideoTrack() const;

    LayerHostingContextID hostingContextID() const final;
    void setVideoLayerSizeFenced(const FloatSize&, WTF::MachSendRight&&) final;
    void requestHostingContextID(LayerHostingContextIDCallback&&) final;

    ThreadSafeWeakPtr<MediaPlayer> m_player;
    RefPtr<MediaStreamPrivate> m_mediaStreamPrivate;
    RefPtr<VideoTrackPrivateMediaStream> m_activeVideoTrack;

    MediaTime m_startTime;
    MediaTime m_pausedTime;

    struct CurrentFramePainter {
        CurrentFramePainter() = default;
        void reset();

        RefPtr<NativeImage> cgImage;
        RefPtr<VideoFrame> videoFrame;
        std::unique_ptr<PixelBufferConformerCV> pixelBufferConformer;
    };
    CurrentFramePainter m_imagePainter;

    MemoryCompactRobinHoodHashMap<String, Ref<AudioTrackPrivateMediaStream>> m_audioTrackMap;
    MemoryCompactRobinHoodHashMap<String, Ref<VideoTrackPrivateMediaStream>> m_videoTrackMap;

    MediaPlayer::NetworkState m_networkState { MediaPlayer::NetworkState::Empty };
    MediaPlayer::ReadyState m_readyState { MediaPlayer::ReadyState::HaveNothing };
    IntSize m_intrinsicSize;
    float m_volume { 1 };
    DisplayMode m_displayMode { None };
    PlaybackState m_playbackState { PlaybackState::None };

    // Used on both main thread and sample thread.
    RefPtr<SampleBufferDisplayLayer> m_sampleBufferDisplayLayer;
    Lock m_sampleBufferDisplayLayerLock;
    // Written on main thread, read on sample thread.
    bool m_canEnqueueDisplayLayer { false };
    // Used on sample thread.
    VideoFrameRotation m_videoRotation { };
    bool m_videoMirrored { false };

    Ref<const Logger> m_logger;
    const uint64_t m_logIdentifier;
    std::unique_ptr<VideoLayerManagerObjC> m_videoLayerManager;

    // SampleBufferDisplayLayerClient
    void sampleBufferDisplayLayerStatusDidFail() final;
#if PLATFORM(IOS_FAMILY)
    bool canShowWhileLocked() const final;
#endif

    RetainPtr<WebRootSampleBufferBoundsChangeListener> m_boundsChangeListener;

    Lock m_currentVideoFrameLock;
    RefPtr<VideoFrame> m_currentVideoFrame WTF_GUARDED_BY_LOCK(m_currentVideoFrameLock);

    bool m_playing { false };
    bool m_muted { false };
    bool m_ended { false };
    bool m_hasEverEnqueuedVideoFrame { false };
    bool m_isPageVisible { false };
    bool m_isVisibleInViewPort { false };
    bool m_haveSeenMetadata { false };
    bool m_waitingForFirstImage { false };
    bool m_isActiveVideoTrackEnabled { true };
    bool m_hasEnqueuedBlackFrame { false };
    bool m_isMediaLayerRehosting { true };

    uint64_t m_sampleCount { 0 };
    uint64_t m_lastVideoFrameMetadataSampleCount { 0 };
    Seconds m_presentationTime { 0 };
    VideoFrameTimeMetadata m_sampleMetadata;

    std::optional<CGRect> m_storedBounds;
    static NativeImageCreator m_nativeImageCreator;
    LayerHostingContextIDCallback m_layerHostingContextIDCallback;
    bool m_shouldMaintainAspectRatio { true };
};

}

#endif // ENABLE(MEDIA_STREAM) && USE(AVFOUNDATION)
