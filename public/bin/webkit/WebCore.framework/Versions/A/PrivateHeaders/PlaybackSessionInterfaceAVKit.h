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

#include "PlaybackSessionInterfaceIOS.h"
#include <wtf/TZoneMalloc.h>

OBJC_CLASS WebAVContentSource;

namespace WebCore {

class PlaybackSessionInterfaceAVKit final : public PlaybackSessionInterfaceIOS {
    WTF_MAKE_TZONE_ALLOCATED(PlaybackSessionInterfaceAVKit);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(PlaybackSessionInterfaceAVKit);
public:
    WEBCORE_EXPORT static Ref<PlaybackSessionInterfaceAVKit> create(PlaybackSessionModel&);
    ~PlaybackSessionInterfaceAVKit();

    void nowPlayingMetadataChanged(const NowPlayingMetadata&);

    // PlaybackSessionInterfaceIOS overrides
    WebAVPlayerController *playerController() const final { return nullptr; }
    WKSLinearMediaPlayer *linearMediaPlayer() const final { return nullptr; }
    void durationChanged(double) final;
    void currentTimeChanged(double, double) final;
    void bufferedTimeChanged(double) final { }
    void rateChanged(OptionSet<PlaybackSessionModel::PlaybackState>, double, double) final;
    void seekableRangesChanged(const TimeRanges&, double, double) final;
    void canPlayFastReverseChanged(bool) final;
    void audioMediaSelectionOptionsChanged(const Vector<MediaSelectionOption>&, uint64_t) final;
    void legibleMediaSelectionOptionsChanged(const Vector<MediaSelectionOption>&, uint64_t) final;
    void audioMediaSelectionIndexChanged(uint64_t) final;
    void legibleMediaSelectionIndexChanged(uint64_t) final;
    void externalPlaybackChanged(bool, PlaybackSessionModel::ExternalPlaybackTargetType, const String&) final { }
    void wirelessVideoPlaybackDisabledChanged(bool) final { }
    void mutedChanged(bool) final;
    void volumeChanged(double) final;
    void startObservingNowPlayingMetadata() final;
    void stopObservingNowPlayingMetadata() final;
#if !RELEASE_LOG_DISABLED
    ASCIILiteral logClassName() const final;
#endif

private:
    PlaybackSessionInterfaceAVKit(PlaybackSessionModel&);

    RetainPtr<WebAVContentSource> m_contentSource;
    NowPlayingMetadataObserver m_nowPlayingMetadataObserver;
};

} // namespace WebCore

#endif // HAVE(AVKIT_CONTENT_SOURCE)
