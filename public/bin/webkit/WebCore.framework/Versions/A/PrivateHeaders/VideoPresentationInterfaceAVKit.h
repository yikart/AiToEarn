/*
 * Copyright (C) 2024 Apple Inc. All rights reserved.
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

#if HAVE(AVKIT_CONTENT_SOURCE)

#include "VideoPresentationInterfaceIOS.h"
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class VideoPresentationInterfaceAVKit final : public VideoPresentationInterfaceIOS {
    WTF_MAKE_TZONE_ALLOCATED(VideoPresentationInterfaceAVKit);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(VideoPresentationInterfaceAVKit);
public:
    WEBCORE_EXPORT static Ref<VideoPresentationInterfaceAVKit> create(PlaybackSessionInterfaceIOS&);
    ~VideoPresentationInterfaceAVKit();

#if !RELEASE_LOG_DISABLED
    ASCIILiteral logClassName() const { return "VideoPresentationInterfaceAVKit"_s; };
#endif

private:
    VideoPresentationInterfaceAVKit(PlaybackSessionInterfaceIOS&);

    // VideoPresentationInterfaceIOS overrides
    bool pictureInPictureWasStartedWhenEnteringBackground() const final { return false; }
    bool mayAutomaticallyShowVideoPictureInPicture() const final { return false; }
    bool isPlayingVideoInEnhancedFullscreen() const final { return false; }
    void setupFullscreen(UIView&, const FloatRect&, const FloatSize&, UIView*, HTMLMediaElementEnums::VideoFullscreenMode, bool, bool, bool) final { }
    void hasVideoChanged(bool) final { }
    void finalizeSetup() final { }
    void updateRouteSharingPolicy() final { }
    void setupPlayerViewController() final { }
    void invalidatePlayerViewController() final { }
    UIViewController *playerViewController() const final { return nullptr; }
    void tryToStartPictureInPicture() final { }
    void stopPictureInPicture() final { }
    void presentFullscreen(bool, Function<void(BOOL, NSError *)>&&) final { }
    void dismissFullscreen(bool, Function<void(BOOL, NSError *)>&&) final { }
    void setShowsPlaybackControls(bool) final { }
    void setContentDimensions(const FloatSize&) final { }
    void setAllowsPictureInPicturePlayback(bool) final { }
    bool isExternalPlaybackActive() const final { return false; }
    bool willRenderToLayer() const final { return false; }
    AVPlayerViewController *avPlayerViewController() const final { return nullptr; }
    CALayer *captionsLayer() final { return nullptr; }
    void setupCaptionsLayer(CALayer *, const FloatSize&) final { }
#if ENABLE(LINEAR_MEDIA_PLAYER)
    LMPlayableViewController *playableViewController() final { return nullptr; }
#endif
    void setSpatialImmersive(bool) final { }
};

} // namespace WebCore

#endif // HAVE(AVKIT_CONTENT_SOURCE)
