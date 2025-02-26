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

#if PLATFORM(APPLETV)

#include "VideoPresentationInterfaceIOS.h"

namespace WebCore {

class VideoPresentationInterfaceTVOS final : public VideoPresentationInterfaceIOS {
    WTF_MAKE_FAST_ALLOCATED;
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(VideoPresentationInterfaceTVOS);
public:
    WEBCORE_EXPORT static Ref<VideoPresentationInterfaceTVOS> create(PlaybackSessionInterfaceIOS&);

    // VideoPresentationInterfaceIOS
    void hasVideoChanged(bool) final { }
    AVPlayerViewController *avPlayerViewController() const final { return { }; }
    bool mayAutomaticallyShowVideoPictureInPicture() const final { return false; }
    bool isPlayingVideoInEnhancedFullscreen() const final { return false; }
    bool pictureInPictureWasStartedWhenEnteringBackground() const final { return false; }
    
private:
    VideoPresentationInterfaceTVOS(PlaybackSessionInterfaceIOS&);

    // VideoPresentationInterfaceIOS
    void updateRouteSharingPolicy() final { }
    void setupPlayerViewController() final { }
    void invalidatePlayerViewController() final { }
    UIViewController *playerViewController() const final { return { }; }
    void presentFullscreen(bool animated, Function<void(BOOL, NSError *)>&&) final;
    void dismissFullscreen(bool animated, Function<void(BOOL, NSError *)>&&) final;
    void tryToStartPictureInPicture() final { }
    void stopPictureInPicture() final { }
    void setShowsPlaybackControls(bool) final { }
    void setContentDimensions(const FloatSize&) final { }
    void setAllowsPictureInPicturePlayback(bool) final { }
    bool isExternalPlaybackActive() const final { return false; }
    bool willRenderToLayer() const final { return true; }
};

} // namespace WebCore

#endif // PLATFORM(APPLETV)
