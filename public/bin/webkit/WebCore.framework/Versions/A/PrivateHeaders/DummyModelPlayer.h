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

#include "ModelPlayer.h"
#include "ModelPlayerClient.h"
#include <wtf/Forward.h>
#include <wtf/WeakPtr.h>

namespace WebCore {

class WEBCORE_EXPORT DummyModelPlayer final : public ModelPlayer {
public:
    static Ref<DummyModelPlayer> create(ModelPlayerClient&);
    virtual ~DummyModelPlayer();

private:
    DummyModelPlayer(ModelPlayerClient&);

    // ModelPlayer overrides.
#if ENABLE(MODEL_PROCESS)
    ModelPlayerIdentifier identifier() const final { return m_id; }
#endif
    void load(Model&, LayoutSize) override;
    void sizeDidChange(LayoutSize) override;
    PlatformLayer* layer() override;
    std::optional<LayerHostingContextIdentifier> layerHostingContextIdentifier() override;
    void enterFullscreen() override;
    void handleMouseDown(const LayoutPoint&, MonotonicTime) override;
    void handleMouseMove(const LayoutPoint&, MonotonicTime) override;
    void handleMouseUp(const LayoutPoint&, MonotonicTime) override;
    void getCamera(CompletionHandler<void(std::optional<WebCore::HTMLModelElementCamera>&&)>&&) override;
    void setCamera(WebCore::HTMLModelElementCamera, CompletionHandler<void(bool success)>&&) override;
    void isPlayingAnimation(CompletionHandler<void(std::optional<bool>&&)>&&) override;
    void setAnimationIsPlaying(bool, CompletionHandler<void(bool success)>&&) override;
    void isLoopingAnimation(CompletionHandler<void(std::optional<bool>&&)>&&) override;
    void setIsLoopingAnimation(bool, CompletionHandler<void(bool success)>&&) override;
    void animationDuration(CompletionHandler<void(std::optional<Seconds>&&)>&&) override;
    void animationCurrentTime(CompletionHandler<void(std::optional<Seconds>&&)>&&) override;
    void setAnimationCurrentTime(Seconds, CompletionHandler<void(bool success)>&&) override;
    void hasAudio(CompletionHandler<void(std::optional<bool>&&)>&&) override;
    void isMuted(CompletionHandler<void(std::optional<bool>&&)>&&) override;
    void setIsMuted(bool, CompletionHandler<void(bool success)>&&) override;
#if PLATFORM(COCOA)
    Vector<RetainPtr<id>> accessibilityChildren() override;
#endif

    WeakPtr<ModelPlayerClient> m_client;
#if ENABLE(MODEL_PROCESS)
    ModelPlayerIdentifier m_id;
#endif
};

}
