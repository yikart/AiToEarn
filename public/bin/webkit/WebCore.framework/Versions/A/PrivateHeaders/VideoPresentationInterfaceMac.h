/*
 * Copyright (C) 2016-2019 Apple Inc. All rights reserved.
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

#if PLATFORM(MAC) && ENABLE(VIDEO_PRESENTATION_MODE)

#include "HTMLMediaElementEnums.h"
#include "MediaPlayerIdentifier.h"
#include "PlaybackSessionInterfaceMac.h"
#include "PlaybackSessionModel.h"
#include "VideoFullscreenCaptions.h"
#include "VideoPresentationModel.h"
#include <wtf/CheckedRef.h>
#include <wtf/RefCounted.h>
#include <wtf/RetainPtr.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/ThreadSafeWeakPtr.h>
#include <wtf/text/WTFString.h>

OBJC_CLASS NSWindow;
OBJC_CLASS WebVideoPresentationInterfaceMacObjC;

namespace WebCore {

class IntRect;
class FloatSize;
class PlaybackSessionInterfaceMac;

class VideoPresentationInterfaceMac final
    : public VideoPresentationModelClient
    , private PlaybackSessionModelClient
    , public VideoFullscreenCaptions
    , public RefCounted<VideoPresentationInterfaceMac>
    , public CanMakeCheckedPtr<VideoPresentationInterfaceMac> {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(VideoPresentationInterfaceMac, WEBCORE_EXPORT);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(VideoPresentationInterfaceMac);
public:
    static Ref<VideoPresentationInterfaceMac> create(PlaybackSessionInterfaceMac& playbackSessionInterface)
    {
        return adoptRef(*new VideoPresentationInterfaceMac(playbackSessionInterface));
    }
    ~VideoPresentationInterfaceMac();
    PlaybackSessionInterfaceMac& playbackSessionInterface() const { return m_playbackSessionInterface.get(); }
    RefPtr<VideoPresentationModel> videoPresentationModel() const { return m_videoPresentationModel.get(); }
    PlaybackSessionModel* playbackSessionModel() const { return m_playbackSessionInterface->playbackSessionModel(); }
    WEBCORE_EXPORT void setVideoPresentationModel(VideoPresentationModel*);

    // PlaybackSessionModelClient
    WEBCORE_EXPORT void rateChanged(OptionSet<PlaybackSessionModel::PlaybackState>, double playbackRate, double defaultPlaybackRate) override;
    WEBCORE_EXPORT void externalPlaybackChanged(bool  enabled, PlaybackSessionModel::ExternalPlaybackTargetType, const String& localizedDeviceName) override;
    WEBCORE_EXPORT void ensureControlsManager() override;

    // VideoPresentationModelClient
    WEBCORE_EXPORT void hasVideoChanged(bool) final;
    WEBCORE_EXPORT void videoDimensionsChanged(const FloatSize&) final;
    void setPlayerIdentifier(std::optional<MediaPlayerIdentifier> identifier) final { m_playerIdentifier = identifier; }

    WEBCORE_EXPORT void setupFullscreen(NSView& layerHostedView, const IntRect& initialRect, NSWindow *parentWindow, HTMLMediaElementEnums::VideoFullscreenMode, bool allowsPictureInPicturePlayback);
    WEBCORE_EXPORT void enterFullscreen();
    WEBCORE_EXPORT bool exitFullscreen(const IntRect& finalRect, NSWindow *parentWindow);
    WEBCORE_EXPORT void exitFullscreenWithoutAnimationToMode(HTMLMediaElementEnums::VideoFullscreenMode);
    WEBCORE_EXPORT void cleanupFullscreen();
    WEBCORE_EXPORT void invalidate();
    void requestHideAndExitFullscreen() { }
    WEBCORE_EXPORT void preparedToReturnToInline(bool visible, const IntRect& inlineRect, NSWindow *parentWindow);
    void preparedToExitFullscreen() { }

    HTMLMediaElementEnums::VideoFullscreenMode mode() const { return m_mode; }
    bool hasMode(HTMLMediaElementEnums::VideoFullscreenMode mode) const { return m_mode & mode; }
    bool isMode(HTMLMediaElementEnums::VideoFullscreenMode mode) const { return m_mode == mode; }
    WEBCORE_EXPORT void setMode(HTMLMediaElementEnums::VideoFullscreenMode, bool);
    WEBCORE_EXPORT void clearMode(HTMLMediaElementEnums::VideoFullscreenMode);

    WEBCORE_EXPORT bool isPlayingVideoInEnhancedFullscreen() const;

    bool mayAutomaticallyShowVideoPictureInPicture() const { return false; }
    void applicationDidBecomeActive() { }

    WEBCORE_EXPORT WebVideoPresentationInterfaceMacObjC *videoPresentationInterfaceObjC();

    WEBCORE_EXPORT void requestHideAndExitPiP();

    std::optional<MediaPlayerIdentifier> playerIdentifier() const { return m_playerIdentifier; }

    WEBCORE_EXPORT void documentVisibilityChanged(bool) final;

#if !RELEASE_LOG_DISABLED
    uint64_t logIdentifier() const;
    const Logger* loggerPtr() const;
    ASCIILiteral logClassName() const { return "VideoPresentationInterfaceMac"_s; };
    WTFLogChannel& logChannel() const;
#endif

private:
    WEBCORE_EXPORT VideoPresentationInterfaceMac(PlaybackSessionInterfaceMac&);

    // CheckedPtr interface
    uint32_t checkedPtrCount() const final { return CanMakeCheckedPtr::checkedPtrCount(); }
    uint32_t checkedPtrCountWithoutThreadCheck() const final { return CanMakeCheckedPtr::checkedPtrCountWithoutThreadCheck(); }
    void incrementCheckedPtrCount() const final { CanMakeCheckedPtr::incrementCheckedPtrCount(); }
    void decrementCheckedPtrCount() const final { CanMakeCheckedPtr::decrementCheckedPtrCount(); }
    void setDocumentBecameVisibleCallback(Function<void()>&& callback) { m_documentBecameVisibleCallback = WTFMove(callback); }

    Ref<PlaybackSessionInterfaceMac> m_playbackSessionInterface;
    std::optional<MediaPlayerIdentifier> m_playerIdentifier;
    ThreadSafeWeakPtr<VideoPresentationModel> m_videoPresentationModel;
    HTMLMediaElementEnums::VideoFullscreenMode m_mode { HTMLMediaElementEnums::VideoFullscreenModeNone };
    RetainPtr<WebVideoPresentationInterfaceMacObjC> m_webVideoPresentationInterfaceObjC;
    bool m_documentIsVisible { true };
    Function<void()> m_documentBecameVisibleCallback;
};

} // namespace WebCore

#endif // PLATFORM(MAC) && ENABLE(VIDEO_PRESENTATION_MODE)
