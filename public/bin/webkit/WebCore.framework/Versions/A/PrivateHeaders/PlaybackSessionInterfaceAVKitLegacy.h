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

#include "PlaybackSessionInterfaceIOS.h"
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class WEBCORE_EXPORT PlaybackSessionInterfaceAVKitLegacy final : public PlaybackSessionInterfaceIOS {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(PlaybackSessionInterfaceAVKitLegacy, WEBCORE_EXPORT);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(PlaybackSessionInterfaceAVKitLegacy);
public:
    static Ref<PlaybackSessionInterfaceAVKitLegacy> create(PlaybackSessionModel&);
    ~PlaybackSessionInterfaceAVKitLegacy();
    void invalidate() final;

    WebAVPlayerController *playerController() const final;
    WKSLinearMediaPlayer *linearMediaPlayer() const final;
    void durationChanged(double) final;
    void currentTimeChanged(double currentTime, double anchorTime) final;
    void bufferedTimeChanged(double) final;
    void rateChanged(OptionSet<PlaybackSessionModel::PlaybackState>, double playbackRate, double defaultPlaybackRate) final;
    void seekableRangesChanged(const TimeRanges&, double lastModifiedTime, double liveUpdateInterval) final;
    void canPlayFastReverseChanged(bool) final;
    void audioMediaSelectionOptionsChanged(const Vector<MediaSelectionOption>& options, uint64_t selectedIndex) final;
    void legibleMediaSelectionOptionsChanged(const Vector<MediaSelectionOption>& options, uint64_t selectedIndex) final;
    void externalPlaybackChanged(bool enabled, PlaybackSessionModel::ExternalPlaybackTargetType, const String& localizedDeviceName) final;
    void wirelessVideoPlaybackDisabledChanged(bool) final;
    void mutedChanged(bool) final;
    void volumeChanged(double) final;
#if !RELEASE_LOG_DISABLED
    ASCIILiteral logClassName() const final;
#endif

private:
    PlaybackSessionInterfaceAVKitLegacy(PlaybackSessionModel&);

    RetainPtr<WebAVPlayerController> m_playerController;

};

} // namespace WebCore

#endif // PLATFORM(COCOA) && HAVE(AVKIT)
