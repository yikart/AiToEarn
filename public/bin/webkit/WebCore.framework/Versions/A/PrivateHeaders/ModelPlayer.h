/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
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

#include "HTMLModelElementCamera.h"
#include "LayerHostingContextIdentifier.h"
#include "LayoutPoint.h"
#include "LayoutSize.h"
#include "PlatformLayer.h"
#include <optional>
#include <wtf/Forward.h>
#include <wtf/MonotonicTime.h>
#include <wtf/Seconds.h>
#include <wtf/TZoneMalloc.h>

#if ENABLE(MODEL_PROCESS)
#include "ModelPlayerIdentifier.h"
#endif

namespace WebCore {

class Color;
class Model;
class SharedBuffer;
class TransformationMatrix;

class WEBCORE_EXPORT ModelPlayer : public RefCounted<ModelPlayer> {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(ModelPlayer, WEBCORE_EXPORT);
public:
    virtual ~ModelPlayer();

#if ENABLE(MODEL_PROCESS)
    virtual ModelPlayerIdentifier identifier() const = 0;
#endif

    virtual void load(Model&, LayoutSize) = 0;
    virtual void sizeDidChange(LayoutSize) = 0;
    virtual PlatformLayer* layer() = 0;
    virtual std::optional<LayerHostingContextIdentifier> layerHostingContextIdentifier() = 0;
    virtual void setBackgroundColor(Color);
    virtual void setEntityTransform(TransformationMatrix);
    virtual void enterFullscreen() = 0;
    virtual bool supportsMouseInteraction();
    virtual bool supportsDragging();
    virtual bool supportsTransform(TransformationMatrix);
    virtual void setInteractionEnabled(bool);
    virtual void handleMouseDown(const LayoutPoint&, MonotonicTime) = 0;
    virtual void handleMouseMove(const LayoutPoint&, MonotonicTime) = 0;
    virtual void handleMouseUp(const LayoutPoint&, MonotonicTime) = 0;
    virtual void getCamera(CompletionHandler<void(std::optional<HTMLModelElementCamera>&&)>&&) = 0;
    virtual void setCamera(HTMLModelElementCamera, CompletionHandler<void(bool success)>&&) = 0;
    virtual void isPlayingAnimation(CompletionHandler<void(std::optional<bool>&&)>&&) = 0;
    virtual void setAnimationIsPlaying(bool, CompletionHandler<void(bool success)>&&) = 0;
    virtual void isLoopingAnimation(CompletionHandler<void(std::optional<bool>&&)>&&) = 0;
    virtual void setIsLoopingAnimation(bool, CompletionHandler<void(bool success)>&&) = 0;
    virtual void animationDuration(CompletionHandler<void(std::optional<Seconds>&&)>&&) = 0;
    virtual void animationCurrentTime(CompletionHandler<void(std::optional<Seconds>&&)>&&) = 0;
    virtual void setAnimationCurrentTime(Seconds, CompletionHandler<void(bool success)>&&) = 0;
    virtual void hasAudio(CompletionHandler<void(std::optional<bool>&&)>&&) = 0;
    virtual void isMuted(CompletionHandler<void(std::optional<bool>&&)>&&) = 0;
    virtual void setIsMuted(bool, CompletionHandler<void(bool success)>&&) = 0;
    virtual String inlinePreviewUUIDForTesting() const;
#if PLATFORM(COCOA)
    virtual Vector<RetainPtr<id>> accessibilityChildren() = 0;
#endif
#if ENABLE(MODEL_PROCESS)
    virtual void setAutoplay(bool);
    virtual void setLoop(bool);
    virtual void setPlaybackRate(double, CompletionHandler<void(double effectivePlaybackRate)>&&);
    virtual double duration() const;
    virtual bool paused() const;
    virtual void setPaused(bool, CompletionHandler<void(bool succeeded)>&&);
    virtual Seconds currentTime() const;
    virtual void setCurrentTime(Seconds, CompletionHandler<void()>&&);
    virtual void setEnvironmentMap(Ref<SharedBuffer>&& data);
    virtual void setHasPortal(bool);
#endif
};

}
