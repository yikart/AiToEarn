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

#include "PlatformLayer.h"
#include <wtf/AbstractRefCountedAndCanMakeWeakPtr.h>
#include <wtf/CompletionHandler.h>
#include <wtf/MachSendRight.h>
#include <wtf/ThreadSafeWeakPtr.h>
#include <wtf/WeakPtr.h>

namespace WTF {
class MediaTime;
}

namespace WebCore {
class IntSize;
class VideoFrame;

enum class VideoFrameRotation : uint16_t;

using LayerHostingContextID = uint32_t;

class SampleBufferDisplayLayerClient : public AbstractRefCountedAndCanMakeWeakPtr<SampleBufferDisplayLayerClient> {
public:
    virtual ~SampleBufferDisplayLayerClient() = default;
    virtual void sampleBufferDisplayLayerStatusDidFail() = 0;
#if PLATFORM(IOS_FAMILY)
    virtual bool canShowWhileLocked() const = 0;
#endif
};

class SampleBufferDisplayLayer : public ThreadSafeRefCountedAndCanMakeThreadSafeWeakPtr<SampleBufferDisplayLayer, WTF::DestructionThread::MainRunLoop> {
public:
    WEBCORE_EXPORT static RefPtr<SampleBufferDisplayLayer> create(SampleBufferDisplayLayerClient&);
    using LayerCreator = RefPtr<SampleBufferDisplayLayer> (*)(SampleBufferDisplayLayerClient&);
    WEBCORE_EXPORT static void setCreator(LayerCreator);

    virtual ~SampleBufferDisplayLayer() = default;

    virtual void initialize(bool hideRootLayer, IntSize, bool shouldMaintainAspectRatio, CompletionHandler<void(bool didSucceed)>&&) = 0;
#if !RELEASE_LOG_DISABLED
    virtual void setLogIdentifier(String&&) = 0;
#endif
    virtual bool didFail() const = 0;

    virtual void updateDisplayMode(bool hideDisplayLayer, bool hideRootLayer) = 0;

    virtual void updateBoundsAndPosition(CGRect, std::optional<WTF::MachSendRight>&& = std::nullopt) = 0;

    virtual void flush() = 0;
    virtual void flushAndRemoveImage() = 0;

    virtual void play() = 0;
    virtual void pause() = 0;

    virtual void enqueueBlackFrameFrom(const VideoFrame&) { };
    virtual void enqueueVideoFrame(VideoFrame&) = 0;
    virtual void clearVideoFrames() = 0;

    virtual PlatformLayer* rootLayer() = 0;
    virtual void setShouldMaintainAspectRatio(bool) = 0;

    enum class RenderPolicy { TimingInfo, Immediately };
    virtual void setRenderPolicy(RenderPolicy) { };

    virtual LayerHostingContextID hostingContextID() const { return 0; }

protected:
    explicit SampleBufferDisplayLayer(SampleBufferDisplayLayerClient&);

    bool canShowWhileLocked();
    WeakPtr<SampleBufferDisplayLayerClient> m_client;

private:
    static LayerCreator m_layerCreator;
};

inline SampleBufferDisplayLayer::SampleBufferDisplayLayer(SampleBufferDisplayLayerClient& client)
    : m_client(client)
{
}

inline bool SampleBufferDisplayLayer::canShowWhileLocked()
{
#if PLATFORM(IOS_FAMILY)
    return m_client && m_client->canShowWhileLocked();
#else
    return false;
#endif
}

}
