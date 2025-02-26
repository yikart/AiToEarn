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

#include "NativeImage.h"
#include "PlatformLayer.h"
#include <wtf/Function.h>

namespace WebCore {

class FloatRect;
class IntSize;

class VideoLayerManager {
public:
    virtual ~VideoLayerManager() = default;

    virtual PlatformLayer* videoInlineLayer() const = 0;
    virtual void setVideoLayer(PlatformLayer*, FloatSize) = 0;
    virtual void didDestroyVideoLayer() = 0;

#if ENABLE(VIDEO_PRESENTATION_MODE)
    virtual PlatformLayer* videoFullscreenLayer() const = 0;
    virtual void setVideoFullscreenLayer(PlatformLayer*, Function<void()>&& completionHandler, PlatformImagePtr) = 0;
    virtual FloatRect videoFullscreenFrame() const = 0;
    virtual void setVideoFullscreenFrame(FloatRect) = 0;
    virtual void updateVideoFullscreenInlineImage(PlatformImagePtr) = 0;
#endif

    virtual void setTextTrackRepresentationLayer(PlatformLayer*) = 0;
    virtual void syncTextTrackBounds() = 0;
};

}
