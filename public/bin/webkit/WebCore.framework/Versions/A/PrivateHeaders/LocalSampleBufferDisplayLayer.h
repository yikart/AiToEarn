/*
 * Copyright (C) 2020 Apple Inc. All rights reserved.
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

#include "FrameRateMonitor.h"
#include "SampleBufferDisplayLayer.h"
#include "VideoFrame.h"
#include <wtf/Deque.h>
#include <wtf/Forward.h>
#include <wtf/RetainPtr.h>
#include <wtf/MediaTime.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/WorkQueue.h>

OBJC_CLASS AVSampleBufferDisplayLayer;
OBJC_CLASS WebAVSampleBufferStatusChangeListener;

typedef struct __CVBuffer* CVPixelBufferRef;

namespace WebCore {

enum class VideoFrameRotation : uint16_t;

class WEBCORE_EXPORT LocalSampleBufferDisplayLayer final : public SampleBufferDisplayLayer {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(LocalSampleBufferDisplayLayer, WEBCORE_EXPORT);
public:
    static RefPtr<LocalSampleBufferDisplayLayer> create(SampleBufferDisplayLayerClient&);

    LocalSampleBufferDisplayLayer(RetainPtr<AVSampleBufferDisplayLayer>&&, SampleBufferDisplayLayerClient&);
    ~LocalSampleBufferDisplayLayer();

    // API used by WebAVSampleBufferStatusChangeListener
    void layerStatusDidChange();
    void layerErrorDidChange();
    void rootLayerBoundsDidChange();

    CGRect bounds() const;

    PlatformLayer* displayLayer();

    void updateSampleLayerBoundsAndPosition(std::optional<CGRect>);

    // SampleBufferDisplayLayer.
    PlatformLayer* rootLayer() final;
    void initialize(bool hideRootLayer, IntSize, bool shouldMaintainAspectRatio, CompletionHandler<void(bool didSucceed)>&&) final;
#if !RELEASE_LOG_DISABLED
    void setLogIdentifier(String&& logIdentifier) final { m_logIdentifier = WTFMove(logIdentifier); }
#endif
    bool didFail() const final;

    void updateDisplayMode(bool hideDisplayLayer, bool hideRootLayer) final;
    void updateBoundsAndPosition(CGRect, std::optional<WTF::MachSendRight>&&) final;

    void flush() final;
    void flushAndRemoveImage() final;

    void play() final;
    void pause() final;

    void enqueueVideoFrame(VideoFrame&) final;
    void clearVideoFrames() final;
    void setRenderPolicy(RenderPolicy) final;
    void setShouldMaintainAspectRatio(bool) final;

private:
    void enqueueBufferInternal(CVPixelBufferRef, MediaTime);
    void removeOldVideoFramesFromPendingQueue();
    void addVideoFrameToPendingQueue(Ref<VideoFrame>&&);
    void requestNotificationWhenReadyForVideoData();

#if !RELEASE_LOG_DISABLED
    void onIrregularFrameRateNotification(MonotonicTime frameTime, MonotonicTime lastFrameTime);
#endif

    WorkQueue& workQueue() { return m_processingQueue.get(); }

private:
    RetainPtr<WebAVSampleBufferStatusChangeListener> m_statusChangeListener;
    RetainPtr<AVSampleBufferDisplayLayer> m_sampleBufferDisplayLayer;
    RetainPtr<PlatformLayer> m_rootLayer;
    RenderPolicy m_renderPolicy { RenderPolicy::TimingInfo };

    Ref<WorkQueue> m_processingQueue;

    // Only accessed through m_processingQueue or if m_processingQueue is null.
    using PendingSampleQueue = Deque<Ref<VideoFrame>>;
    PendingSampleQueue m_pendingVideoFrameQueue;

    WebCore::VideoFrameRotation m_videoFrameRotation { WebCore::VideoFrameRotation::None };
    CGAffineTransform m_affineTransform { CGAffineTransformIdentity };

    bool m_paused { false };
    bool m_didFail { false };
#if !RELEASE_LOG_DISABLED
    String m_logIdentifier;
    FrameRateMonitor m_frameRateMonitor WTF_GUARDED_BY_CAPABILITY(workQueue());
#endif
};

inline void LocalSampleBufferDisplayLayer::setRenderPolicy(RenderPolicy renderPolicy)
{
    m_renderPolicy = renderPolicy;
}

inline void LocalSampleBufferDisplayLayer::play()
{
    m_paused = false;
}

inline void LocalSampleBufferDisplayLayer::pause()
{
    m_paused = true;
}


}

#endif // ENABLE(MEDIA_STREAM) && USE(AVFOUNDATION)
