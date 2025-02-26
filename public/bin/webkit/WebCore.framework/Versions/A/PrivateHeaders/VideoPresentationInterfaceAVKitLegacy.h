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

#if PLATFORM(IOS_FAMILY) && HAVE(AVKIT)

#include "VideoPresentationInterfaceIOS.h"
#include <wtf/TZoneMalloc.h>

OBJC_CLASS AVPlayerViewController;
OBJC_CLASS WebAVPlayerController;
OBJC_CLASS WebAVPlayerLayerView;
OBJC_CLASS WebAVPlayerLayer;
OBJC_CLASS WebAVPlayerViewController;
OBJC_CLASS WebAVPlayerViewControllerDelegate;

namespace WebCore {

class PlaybackSessionInterfaceIOS;

class VideoPresentationInterfaceAVKitLegacy final : public VideoPresentationInterfaceIOS {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(VideoPresentationInterfaceAVKitLegacy, WEBCORE_EXPORT);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(VideoPresentationInterfaceAVKitLegacy);
public:
    WEBCORE_EXPORT static Ref<VideoPresentationInterfaceAVKitLegacy> create(PlaybackSessionInterfaceIOS&);
    WEBCORE_EXPORT ~VideoPresentationInterfaceAVKitLegacy();

    WEBCORE_EXPORT void hasVideoChanged(bool) final;

#if !RELEASE_LOG_DISABLED
    ASCIILiteral logClassName() const { return "VideoPresentationInterfaceAVKitLegacy"_s; };
#endif

    WEBCORE_EXPORT AVPlayerViewController *avPlayerViewController() const final;
    WEBCORE_EXPORT void setupFullscreen(UIView& videoView, const FloatRect& initialRect, const FloatSize& videoDimensions, UIView* parentView, HTMLMediaElementEnums::VideoFullscreenMode, bool allowsPictureInPicturePlayback, bool standby, bool blocksReturnToFullscreenFromPictureInPicture);
    WEBCORE_EXPORT bool pictureInPictureWasStartedWhenEnteringBackground() const final;
    WEBCORE_EXPORT void setPlayerIdentifier(std::optional<MediaPlayerIdentifier>) final;
    WEBCORE_EXPORT bool mayAutomaticallyShowVideoPictureInPicture() const;
    bool isPlayingVideoInEnhancedFullscreen() const;
    bool allowsPictureInPicturePlayback() const { return m_allowsPictureInPicturePlayback; }
    void presentFullscreen(bool animated, Function<void(BOOL, NSError *)>&&) final;
    void dismissFullscreen(bool animated, Function<void(BOOL, NSError *)>&&) final;

    // VideoFullscreenCaptions:
    WEBCORE_EXPORT void setupCaptionsLayer(CALayer *parent, const WebCore::FloatSize&) final;

private:
    WEBCORE_EXPORT VideoPresentationInterfaceAVKitLegacy(PlaybackSessionInterfaceIOS&);

    void updateRouteSharingPolicy() final;
    void setupPlayerViewController() final;
    void invalidatePlayerViewController() final;
    UIViewController *playerViewController() const final;
    void tryToStartPictureInPicture() final;
    void stopPictureInPicture() final;
    void setShowsPlaybackControls(bool) final;
    void setContentDimensions(const FloatSize&) final;
    void setAllowsPictureInPicturePlayback(bool) final;
    bool isExternalPlaybackActive() const final;
    bool willRenderToLayer() const final;

    RetainPtr<WebAVPlayerViewControllerDelegate> m_playerViewControllerDelegate;
    RetainPtr<WebAVPlayerViewController> m_playerViewController;
};

} // namespace WebCore

#endif // PLATFORM(IOS_FAMILY) && HAVE(AVKIT)
