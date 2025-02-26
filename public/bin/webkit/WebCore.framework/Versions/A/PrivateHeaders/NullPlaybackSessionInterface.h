/*
 * Copyright (C) 2023 Apple Inc. All rights reserved.
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

#if PLATFORM(COCOA)

#include "HTMLMediaElementEnums.h"
#include "PlaybackSessionModel.h"
#include <wtf/CheckedRef.h>
#include <wtf/TZoneMallocInlines.h>

OBJC_CLASS AVPlayerViewController;
OBJC_CLASS UIView;

namespace WebCore {

class FloatRect;
class FloatSize;

class NullPlaybackSessionInterface final
    : public PlaybackSessionModelClient
    , public RefCounted<NullPlaybackSessionInterface>
    , public CanMakeCheckedPtr<NullPlaybackSessionInterface> {
    WTF_MAKE_TZONE_ALLOCATED_INLINE(NullPlaybackSessionInterface);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(NullPlaybackSessionInterface);
public:
    static Ref<NullPlaybackSessionInterface> create(PlaybackSessionModel& model)
    {
        return adoptRef(*new NullPlaybackSessionInterface(model));
    }

    PlaybackSessionModel* playbackSessionModel() const { return m_model.get(); }

    void setupFullscreen(UIView&, const FloatRect&, const FloatSize&, UIView*, HTMLMediaElementEnums::VideoFullscreenMode, bool, bool, bool) { }
    void enterFullscreen() { }
    bool exitFullscreen(const FloatRect&) { return false; }
    void cleanupFullscreen() { }
    void invalidate() { }
    void requestHideAndExitFullscreen() { }
    void preparedToReturnToInline(bool visible, const FloatRect& inlineRect) { }
    void preparedToExitFullscreen() { }
    void setHasVideoContentLayer(bool) { }
    void setInlineRect(const FloatRect&, bool) { }
    void preparedToReturnToStandby() { }
    bool mayAutomaticallyShowVideoPictureInPicture() const { return false; }
    void applicationDidBecomeActive() { }
    void setMode(HTMLMediaElementEnums::VideoFullscreenMode, bool) { }
    bool pictureInPictureWasStartedWhenEnteringBackground() const { return false; }
    AVPlayerViewController *avPlayerViewController() const { return nullptr; }

private:
    NullPlaybackSessionInterface(PlaybackSessionModel& model)
        : m_model(model)
    {
    }

    // CheckedPtr interface
    uint32_t checkedPtrCount() const final { return CanMakeCheckedPtr::checkedPtrCount(); }
    uint32_t checkedPtrCountWithoutThreadCheck() const final { return CanMakeCheckedPtr::checkedPtrCountWithoutThreadCheck(); }
    void incrementCheckedPtrCount() const final { CanMakeCheckedPtr::incrementCheckedPtrCount(); }
    void decrementCheckedPtrCount() const final { CanMakeCheckedPtr::decrementCheckedPtrCount(); }

    void durationChanged(double) final { }
    void currentTimeChanged(double, double) final { }
    void bufferedTimeChanged(double) final { }
    void rateChanged(OptionSet<PlaybackSessionModel::PlaybackState>, double, double) final { }
    void seekableRangesChanged(const TimeRanges&, double, double) final { }
    void canPlayFastReverseChanged(bool) final { }
    void audioMediaSelectionOptionsChanged(const Vector<MediaSelectionOption>&, uint64_t) final { }
    void legibleMediaSelectionOptionsChanged(const Vector<MediaSelectionOption>&, uint64_t) final { }
    void externalPlaybackChanged(bool, PlaybackSessionModel::ExternalPlaybackTargetType, const String&) final { }
    void wirelessVideoPlaybackDisabledChanged(bool) final { }
    void mutedChanged(bool) final { }
    void volumeChanged(double) final { }
    void modelDestroyed() final { }

    WeakPtr<PlaybackSessionModel> m_model;
};

}

#endif
