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

#if PLATFORM(MAC) && ENABLE(VIDEO_PRESENTATION_MODE)

#include "HTMLMediaElementEnums.h"
#include "PlaybackSessionModel.h"
#include <wtf/RefCounted.h>
#include <wtf/RetainPtr.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/WeakObjCPtr.h>
#include <wtf/WeakPtr.h>
#include <wtf/text/WTFString.h>

OBJC_CLASS WebPlaybackControlsManager;

namespace WebCore {
class IntRect;
class PlaybackSessionModel;

class WEBCORE_EXPORT PlaybackSessionInterfaceMac final
    : public PlaybackSessionModelClient
    , public RefCounted<PlaybackSessionInterfaceMac>
    , public CanMakeCheckedPtr<PlaybackSessionInterfaceMac> {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(PlaybackSessionInterfaceMac, WEBCORE_EXPORT);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(PlaybackSessionInterfaceMac);
public:
    static Ref<PlaybackSessionInterfaceMac> create(PlaybackSessionModel&);
    virtual ~PlaybackSessionInterfaceMac();
    PlaybackSessionModel* playbackSessionModel() const;

    bool isInWindowFullscreenActive() const;
    void enterInWindowFullscreen();
    void exitInWindowFullscreen();

    // PlaybackSessionModelClient
    void durationChanged(double) final;
    void currentTimeChanged(double /*currentTime*/, double /*anchorTime*/) final;
    void rateChanged(OptionSet<PlaybackSessionModel::PlaybackState>, double /* playbackRate */, double /* defaultPlaybackRate */) final;
    void seekableRangesChanged(const TimeRanges&, double /*lastModifiedTime*/, double /*liveUpdateInterval*/) final;
    void audioMediaSelectionOptionsChanged(const Vector<MediaSelectionOption>& /*options*/, uint64_t /*selectedIndex*/) final;
    void legibleMediaSelectionOptionsChanged(const Vector<MediaSelectionOption>& /*options*/, uint64_t /*selectedIndex*/) final;
    void audioMediaSelectionIndexChanged(uint64_t) final;
    void legibleMediaSelectionIndexChanged(uint64_t) final;
    void externalPlaybackChanged(bool /* enabled */, PlaybackSessionModel::ExternalPlaybackTargetType, const String& /* localizedDeviceName */) final;
    void isPictureInPictureSupportedChanged(bool) final;
    void ensureControlsManager() final;

#if ENABLE(WEB_PLAYBACK_CONTROLS_MANAGER)
    void setPlayBackControlsManager(WebPlaybackControlsManager *);
    WebPlaybackControlsManager *playBackControlsManager();

    void updatePlaybackControlsManagerCanTogglePictureInPicture();
#endif
    void willBeginScrubbing();
    void beginScrubbing();
    void endScrubbing();

    void invalidate();

#if !RELEASE_LOG_DISABLED
    uint64_t logIdentifier() const;
    const Logger* loggerPtr() const;
    ASCIILiteral logClassName() const { return "PlaybackSessionInterfaceMac"_s; };
    WTFLogChannel& logChannel() const;
#endif

private:
    PlaybackSessionInterfaceMac(PlaybackSessionModel&);

    // CheckedPtr interface
    uint32_t checkedPtrCount() const final;
    uint32_t checkedPtrCountWithoutThreadCheck() const final;
    void incrementCheckedPtrCount() const final;
    void decrementCheckedPtrCount() const final;

    WeakPtr<PlaybackSessionModel> m_playbackSessionModel;
#if ENABLE(WEB_PLAYBACK_CONTROLS_MANAGER)
    WeakObjCPtr<WebPlaybackControlsManager> m_playbackControlsManager;

    void updatePlaybackControlsManagerTiming(double currentTime, double anchorTime, double playbackRate, bool isPlaying);
#endif
};

}

#endif // PLATFORM(MAC) && ENABLE(VIDEO_PRESENTATION_MODE)
