/*
 * Copyright (C) 2016 Apple Inc. All rights reserved.
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

#include "FloatRect.h"
#include "IntSize.h"
#include "NativeImage.h"
#include "PlatformLayer.h"
#include "VideoLayerManager.h"
#include <wtf/Function.h>
#include <wtf/LoggerHelper.h>
#include <wtf/Noncopyable.h>
#include <wtf/RetainPtr.h>
#include <wtf/TZoneMalloc.h>

OBJC_CLASS WebVideoContainerLayer;

namespace WebCore {

class VideoLayerManagerObjC final
    : public VideoLayerManager
#if !RELEASE_LOG_DISABLED
    , public LoggerHelper
#endif
{
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(VideoLayerManagerObjC, WEBCORE_EXPORT);
    WTF_MAKE_NONCOPYABLE(VideoLayerManagerObjC);

public:
#if !RELEASE_LOG_DISABLED
    WEBCORE_EXPORT VideoLayerManagerObjC(const Logger&, uint64_t);
#else
    VideoLayerManagerObjC() = default;
#endif

    WEBCORE_EXPORT ~VideoLayerManagerObjC();

    WEBCORE_EXPORT PlatformLayer* videoInlineLayer() const final;

    WEBCORE_EXPORT void setVideoLayer(PlatformLayer*, FloatSize) final;
    WEBCORE_EXPORT void didDestroyVideoLayer() final;

#if ENABLE(VIDEO_PRESENTATION_MODE)
    WEBCORE_EXPORT PlatformLayer* videoFullscreenLayer() const final;
    WEBCORE_EXPORT void setVideoFullscreenLayer(PlatformLayer*, Function<void()>&& completionHandler, PlatformImagePtr) final;
    WEBCORE_EXPORT FloatRect videoFullscreenFrame() const final;
    WEBCORE_EXPORT void setVideoFullscreenFrame(FloatRect) final;
    WEBCORE_EXPORT void updateVideoFullscreenInlineImage(PlatformImagePtr) final;
#endif

    WEBCORE_EXPORT void setTextTrackRepresentationLayer(PlatformLayer*) final;
    WEBCORE_EXPORT void syncTextTrackBounds() final;

private:

#if !RELEASE_LOG_DISABLED
    const Logger& logger() const final { return m_logger.get(); }
    uint64_t logIdentifier() const final { return m_logIdentifier; }
    ASCIILiteral logClassName() const final { return "VideoLayerManagerObjC"_s; }
    WTFLogChannel& logChannel() const final;

    Ref<const Logger> m_logger;
    const uint64_t m_logIdentifier;
#endif

    RetainPtr<WebVideoContainerLayer> m_videoInlineLayer;
#if ENABLE(VIDEO_PRESENTATION_MODE)
    RetainPtr<PlatformLayer> m_videoFullscreenLayer;
    FloatRect m_videoFullscreenFrame;
#endif
    RetainPtr<PlatformLayer> m_textTrackRepresentationLayer;

    RetainPtr<PlatformLayer> m_videoLayer;
};

}
