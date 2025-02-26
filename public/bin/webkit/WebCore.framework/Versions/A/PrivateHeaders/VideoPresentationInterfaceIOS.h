/*
 * Copyright (C) 2014-2023 Apple Inc. All rights reserved.
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

#if PLATFORM(IOS_FAMILY)

#include "EventListener.h"
#include "HTMLMediaElementEnums.h"
#include "MediaPlayerIdentifier.h"
#include "PlatformImage.h"
#include "PlatformLayer.h"
#include "PlaybackSessionInterfaceIOS.h"
#include "SpatialVideoMetadata.h"
#include "VideoFullscreenCaptions.h"
#include "VideoPresentationModel.h"
#include <objc/objc.h>
#include <wtf/Forward.h>
#include <wtf/Function.h>
#include <wtf/OptionSet.h>
#include <wtf/RetainPtr.h>
#include <wtf/RunLoop.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/ThreadSafeWeakPtr.h>

OBJC_CLASS AVPlayerViewController;
OBJC_CLASS LMPlayableViewController;
OBJC_CLASS UIViewController;
OBJC_CLASS UIWindow;
OBJC_CLASS UIView;
OBJC_CLASS CALayer;
OBJC_CLASS NSError;
OBJC_CLASS WebAVPlayerController;
OBJC_CLASS WebAVPlayerLayer;
OBJC_CLASS WebAVPlayerLayerView;

namespace WebCore {

class FloatRect;
class FloatSize;

class VideoPresentationInterfaceIOS
    : public VideoPresentationModelClient
    , public PlaybackSessionModelClient
    , public VideoFullscreenCaptions
    , public ThreadSafeRefCountedAndCanMakeThreadSafeWeakPtr<VideoPresentationInterfaceIOS, WTF::DestructionThread::MainRunLoop>
    , public CanMakeCheckedPtr<VideoPresentationInterfaceIOS> {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(VideoPresentationInterfaceIOS, WEBCORE_EXPORT);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(VideoPresentationInterfaceIOS);
public:
    WEBCORE_EXPORT ~VideoPresentationInterfaceIOS();

    // CheckedPtr interface
    uint32_t checkedPtrCount() const final { return CanMakeCheckedPtr::checkedPtrCount(); }
    uint32_t checkedPtrCountWithoutThreadCheck() const final { return CanMakeCheckedPtr::checkedPtrCountWithoutThreadCheck(); }
    void incrementCheckedPtrCount() const final { CanMakeCheckedPtr::incrementCheckedPtrCount(); }
    void decrementCheckedPtrCount() const final { CanMakeCheckedPtr::decrementCheckedPtrCount(); }

    WEBCORE_EXPORT void setVideoPresentationModel(VideoPresentationModel*);
    PlaybackSessionInterfaceIOS& playbackSessionInterface() const { return m_playbackSessionInterface.get(); }
    PlaybackSessionModel* playbackSessionModel() const { return m_playbackSessionInterface->playbackSessionModel(); }
    WEBCORE_EXPORT virtual void hasVideoChanged(bool) = 0;
    WEBCORE_EXPORT void videoDimensionsChanged(const FloatSize&);
    virtual void setSpatialImmersive(bool) { }
    WEBCORE_EXPORT virtual void setPlayerIdentifier(std::optional<MediaPlayerIdentifier>);
    WEBCORE_EXPORT virtual void setupFullscreen(UIView& videoView, const FloatRect& initialRect, const FloatSize& videoDimensions, UIView* parentView, HTMLMediaElementEnums::VideoFullscreenMode, bool allowsPictureInPicturePlayback, bool standby, bool blocksReturnToFullscreenFromPictureInPicture);
    WEBCORE_EXPORT virtual void externalPlaybackChanged(bool enabled, PlaybackSessionModel::ExternalPlaybackTargetType, const String& localizedDeviceName);
    WEBCORE_EXPORT virtual AVPlayerViewController *avPlayerViewController() const = 0;
    WebAVPlayerController *playerController() const;
    WebAVPlayerLayerView *playerLayerView() const { return m_playerLayerView.get(); }
    WebAVPlayerLayer *playerLayer() const;
    WEBCORE_EXPORT void enterFullscreen();
    WEBCORE_EXPORT virtual bool exitFullscreen(const FloatRect& finalRect);
    WEBCORE_EXPORT void exitFullscreenWithoutAnimationToMode(HTMLMediaElementEnums::VideoFullscreenMode);
    WEBCORE_EXPORT virtual void cleanupFullscreen();
    WEBCORE_EXPORT void invalidate();
    WEBCORE_EXPORT virtual void requestHideAndExitFullscreen();
    WEBCORE_EXPORT virtual void preparedToReturnToInline(bool visible, const FloatRect& inlineRect);
    WEBCORE_EXPORT void preparedToExitFullscreen();
    WEBCORE_EXPORT void setHasVideoContentLayer(bool);
    WEBCORE_EXPORT virtual void setInlineRect(const FloatRect&, bool visible);
    WEBCORE_EXPORT void preparedToReturnToStandby();
    bool changingStandbyOnly() { return m_changingStandbyOnly; }
    WEBCORE_EXPORT void failedToRestoreFullscreen();

    enum class ExitFullScreenReason {
        DoneButtonTapped,
        FullScreenButtonTapped,
        PinchGestureHandled,
        RemoteControlStopEventReceived,
        PictureInPictureStarted
    };

    class Mode {
        HTMLMediaElementEnums::VideoFullscreenMode m_mode { HTMLMediaElementEnums::VideoFullscreenModeNone };

    public:
        Mode() = default;
        Mode(const Mode&) = default;
        Mode(HTMLMediaElementEnums::VideoFullscreenMode mode) : m_mode(mode) { }
        void operator=(HTMLMediaElementEnums::VideoFullscreenMode mode) { m_mode = mode; }
        HTMLMediaElementEnums::VideoFullscreenMode mode() const { return m_mode; }

        void setModeValue(HTMLMediaElementEnums::VideoFullscreenMode mode, bool value) { value ? setMode(mode) : clearMode(mode); }
        void setMode(HTMLMediaElementEnums::VideoFullscreenMode mode) { m_mode |= mode; }
        void clearMode(HTMLMediaElementEnums::VideoFullscreenMode mode) { m_mode &= ~mode; }
        bool hasMode(HTMLMediaElementEnums::VideoFullscreenMode mode) const { return m_mode & mode; }

        bool isPictureInPicture() const { return m_mode == HTMLMediaElementEnums::VideoFullscreenModePictureInPicture; }
        bool isFullscreen() const { return m_mode == HTMLMediaElementEnums::VideoFullscreenModeStandard; }

        void setPictureInPicture(bool value) { setModeValue(HTMLMediaElementEnums::VideoFullscreenModePictureInPicture, value); }
        void setFullscreen(bool value) { setModeValue(HTMLMediaElementEnums::VideoFullscreenModeStandard, value); }

        bool hasFullscreen() const { return hasMode(HTMLMediaElementEnums::VideoFullscreenModeStandard); }
        bool hasPictureInPicture() const { return hasMode(HTMLMediaElementEnums::VideoFullscreenModePictureInPicture); }

        bool hasVideo() const { return m_mode & (HTMLMediaElementEnums::VideoFullscreenModeStandard | HTMLMediaElementEnums::VideoFullscreenModePictureInPicture); }
    };

    RefPtr<VideoPresentationModel> videoPresentationModel() const { return m_videoPresentationModel.get(); }
    WEBCORE_EXPORT virtual bool shouldExitFullscreenWithReason(ExitFullScreenReason);
    HTMLMediaElementEnums::VideoFullscreenMode mode() const { return m_currentMode.mode(); }
    WEBCORE_EXPORT virtual bool mayAutomaticallyShowVideoPictureInPicture() const = 0;
    void prepareForPictureInPictureStop(Function<void(bool)>&& callback);
    WEBCORE_EXPORT void applicationDidBecomeActive();
    bool inPictureInPicture() const { return m_enteringPictureInPicture || m_currentMode.hasPictureInPicture(); }
    bool returningToStandby() const { return m_returningToStandby; }

    WEBCORE_EXPORT virtual void willStartPictureInPicture();
    WEBCORE_EXPORT virtual void didStartPictureInPicture();
    WEBCORE_EXPORT virtual void failedToStartPictureInPicture();
    void willStopPictureInPicture();
    WEBCORE_EXPORT virtual void didStopPictureInPicture();
    WEBCORE_EXPORT virtual void prepareForPictureInPictureStopWithCompletionHandler(void (^)(BOOL));
    virtual bool isPlayingVideoInEnhancedFullscreen() const = 0;

    WEBCORE_EXPORT void setMode(HTMLMediaElementEnums::VideoFullscreenMode, bool shouldNotifyModel);
    void clearMode(HTMLMediaElementEnums::VideoFullscreenMode, bool shouldNotifyModel);
    bool hasMode(HTMLMediaElementEnums::VideoFullscreenMode mode) const { return m_currentMode.hasMode(mode); }
    WEBCORE_EXPORT UIViewController *presentingViewController();
    UIViewController *fullscreenViewController() const { return m_viewController.get(); }
    WEBCORE_EXPORT virtual bool pictureInPictureWasStartedWhenEnteringBackground() const = 0;

    WEBCORE_EXPORT std::optional<MediaPlayerIdentifier> playerIdentifier() const;

#if ENABLE(LINEAR_MEDIA_PLAYER)
    virtual LMPlayableViewController *playableViewController() { return nil; }
#endif

#if !RELEASE_LOG_DISABLED
    WEBCORE_EXPORT uint64_t logIdentifier() const;
    WEBCORE_EXPORT const Logger* loggerPtr() const;
    ASCIILiteral logClassName() const { return "VideoPresentationInterfaceIOS"_s; };
    WEBCORE_EXPORT WTFLogChannel& logChannel() const;
#endif

protected:
    WEBCORE_EXPORT VideoPresentationInterfaceIOS(PlaybackSessionInterfaceIOS&);

    RunLoop::Timer m_watchdogTimer;
    RetainPtr<UIView> m_parentView;
    Mode m_targetMode;
    RouteSharingPolicy m_routeSharingPolicy { RouteSharingPolicy::Default };
    String m_routingContextUID;
    ThreadSafeWeakPtr<VideoPresentationModel> m_videoPresentationModel;
    bool m_blocksReturnToFullscreenFromPictureInPicture { false };
    bool m_targetStandby { false };
    bool m_cleanupNeedsReturnVideoContentLayer { false };
    bool m_standby { false };
    Mode m_currentMode;
    bool m_enteringPictureInPicture { false };
    RetainPtr<UIWindow> m_window;
    RetainPtr<UIViewController> m_viewController;
    bool m_hasVideoContentLayer { false };
    Function<void(bool)> m_prepareToInlineCallback;
    bool m_exitingPictureInPicture { false };
    bool m_shouldReturnToFullscreenWhenStoppingPictureInPicture { false };
    bool m_enterFullscreenNeedsExitPictureInPicture { false };
    bool m_enterFullscreenNeedsEnterPictureInPicture { false };
    bool m_hasUpdatedInlineRect { false };
    bool m_inlineIsVisible { false };
    bool m_returningToStandby { false };
    bool m_exitFullscreenNeedsExitPictureInPicture { false };
    bool m_setupNeedsInlineRect { false };
    bool m_exitFullscreenNeedInlineRect { false };
    bool m_exitFullscreenNeedsReturnContentLayer { false };
    FloatRect m_inlineRect;
    bool m_shouldIgnoreAVKitCallbackAboutExitFullscreenReason { false };
    bool m_changingStandbyOnly { false };
    bool m_allowsPictureInPicturePlayback { false };
    RetainPtr<UIWindow> m_parentWindow;
    RetainPtr<UIView> m_videoView;
    RetainPtr<WebAVPlayerLayerView> m_playerLayerView;

    virtual void finalizeSetup();
    virtual void updateRouteSharingPolicy() = 0;
    virtual void setupPlayerViewController() = 0;
    virtual void invalidatePlayerViewController() = 0;
    virtual UIViewController *playerViewController() const = 0;
    WEBCORE_EXPORT void doSetup();

    enum class NextAction : uint8_t {
        NeedsEnterFullScreen = 1 << 0,
        NeedsExitFullScreen = 1 << 1,
    };
    using NextActions = OptionSet<NextAction>;

    WEBCORE_EXPORT void enterFullscreenHandler(BOOL success, NSError *, NextActions = NextActions());
    WEBCORE_EXPORT void exitFullscreenHandler(BOOL success, NSError *, NextActions = NextActions());
    void doEnterFullscreen();
    void doExitFullscreen();
    virtual void presentFullscreen(bool animated, Function<void(BOOL, NSError *)>&&) = 0;
    virtual void dismissFullscreen(bool animated, Function<void(BOOL, NSError *)>&&) = 0;
    virtual void tryToStartPictureInPicture() = 0;
    virtual void stopPictureInPicture() = 0;
    virtual void setShowsPlaybackControls(bool) = 0;
    virtual void setContentDimensions(const FloatSize&) = 0;
    virtual void setAllowsPictureInPicturePlayback(bool) = 0;
    virtual bool isExternalPlaybackActive() const = 0;
    virtual bool willRenderToLayer() const = 0;

#if PLATFORM(WATCHOS)
    bool m_waitingForPreparedToExit { false };
#endif
private:
    void returnToStandby();
    void watchdogTimerFired();

    bool m_finalizeSetupNeedsVideoContentLayer { false };
    bool m_finalizeSetupNeedsReturnVideoContentLayer { false };
    Ref<PlaybackSessionInterfaceIOS> m_playbackSessionInterface;
};

} // namespace WebCore

#endif // PLATFORM(IOS_FAMILY)
