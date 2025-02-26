/*
 * Copyright (C) 2016-2024 Apple Inc. All rights reserved.
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

#if PLATFORM(COCOA) && HAVE(AVKIT)

#include "EventListener.h"
#include "HTMLMediaElementEnums.h"
#include "MediaPlayerIdentifier.h"
#include "PlaybackSessionModel.h"
#include "Timer.h"
#include <functional>
#include <objc/objc.h>
#include <wtf/CheckedRef.h>
#include <wtf/Forward.h>
#include <wtf/Ref.h>
#include <wtf/RefCounted.h>
#include <wtf/RetainPtr.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/WeakPtr.h>

OBJC_CLASS WKSLinearMediaPlayer;
OBJC_CLASS WebAVPlayerController;

namespace WebCore {

class IntRect;
class PlaybackSessionModel;
class WebPlaybackSessionChangeObserver;

class WEBCORE_EXPORT PlaybackSessionInterfaceIOS
    : public PlaybackSessionModelClient
    , public RefCounted<PlaybackSessionInterfaceIOS>
    , public CanMakeCheckedPtr<PlaybackSessionInterfaceIOS> {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(PlaybackSessionInterfaceIOS, WEBCORE_EXPORT);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(PlaybackSessionInterfaceIOS);
public:
    void initialize();
    virtual void invalidate();
    virtual ~PlaybackSessionInterfaceIOS();

    virtual WebAVPlayerController *playerController() const = 0;
    virtual WKSLinearMediaPlayer *linearMediaPlayer() const = 0;
    PlaybackSessionModel* playbackSessionModel() const;
    void durationChanged(double) override = 0;
    void currentTimeChanged(double currentTime, double anchorTime) override = 0;
    void bufferedTimeChanged(double) override = 0;
    void rateChanged(OptionSet<PlaybackSessionModel::PlaybackState>, double playbackRate, double defaultPlaybackRate) override = 0;
    void seekableRangesChanged(const TimeRanges&, double lastModifiedTime, double liveUpdateInterval) override = 0;
    void canPlayFastReverseChanged(bool) override = 0;
    void audioMediaSelectionOptionsChanged(const Vector<MediaSelectionOption>& options, uint64_t selectedIndex) override = 0;
    void legibleMediaSelectionOptionsChanged(const Vector<MediaSelectionOption>& options, uint64_t selectedIndex) override = 0;
    void externalPlaybackChanged(bool enabled, PlaybackSessionModel::ExternalPlaybackTargetType, const String& localizedDeviceName) override = 0;
    void wirelessVideoPlaybackDisabledChanged(bool) override = 0;
    void mutedChanged(bool) override = 0;
    void volumeChanged(double) override = 0;
    void modelDestroyed() override;

    std::optional<MediaPlayerIdentifier> playerIdentifier() const;
    void setPlayerIdentifier(std::optional<MediaPlayerIdentifier>);

    virtual void startObservingNowPlayingMetadata();
    virtual void stopObservingNowPlayingMetadata();

#if !RELEASE_LOG_DISABLED
    uint64_t logIdentifier() const;
    const Logger* loggerPtr() const;
    virtual ASCIILiteral logClassName() const = 0;
    WTFLogChannel& logChannel() const;
#endif

protected:
#if HAVE(SPATIAL_TRACKING_LABEL)
    void updateSpatialTrackingLabel();
#endif

    PlaybackSessionInterfaceIOS(PlaybackSessionModel&);
    PlaybackSessionModel* m_playbackSessionModel { nullptr };

    // CheckedPtr interface
    uint32_t checkedPtrCount() const final;
    uint32_t checkedPtrCountWithoutThreadCheck() const final;
    void incrementCheckedPtrCount() const final;
    void decrementCheckedPtrCount() const final;

private:
    std::optional<MediaPlayerIdentifier> m_playerIdentifier;
#if HAVE(SPATIAL_TRACKING_LABEL)
    String m_spatialTrackingLabel;
    String m_defaultSpatialTrackingLabel;
#endif
};

} // namespace WebCore

#endif // PLATFORM(COCOA) && HAVE(AVKIT)
