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

#include "NullPlaybackSessionInterface.h"
#include "VideoFullscreenCaptions.h"
#include "VideoPresentationModel.h"
#include <wtf/TZoneMallocInlines.h>

namespace WebCore {

class NullVideoPresentationInterface final
    : public VideoPresentationModelClient
    , public PlaybackSessionModelClient
    , public VideoFullscreenCaptions
    , public RefCounted<NullVideoPresentationInterface>
    , public CanMakeCheckedPtr<NullVideoPresentationInterface> {
    WTF_MAKE_TZONE_ALLOCATED_INLINE(NullVideoPresentationInterface);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(NullVideoPresentationInterface);
public:
    static Ref<NullVideoPresentationInterface> create(NullPlaybackSessionInterface& playbackSessionInterface)
    {
        return adoptRef(*new NullVideoPresentationInterface(playbackSessionInterface));
    }

    ~NullVideoPresentationInterface() = default;
    NullPlaybackSessionInterface& playbackSessionInterface() const { return m_playbackSessionInterface.get(); }
    PlaybackSessionModel* playbackSessionModel() const { return m_playbackSessionInterface->playbackSessionModel(); }

    void setSpatialVideoMetadata(const std::optional<SpatialVideoMetadata>&) { }
    void setVideoPresentationModel(VideoPresentationModel* model) { m_videoPresentationModel = model; }
    void setupFullscreen(UIView&, const FloatRect&, const FloatSize&, UIView*, HTMLMediaElementEnums::VideoFullscreenMode, bool, bool, bool) { }
    void enterFullscreen() { }
    bool exitFullscreen(const FloatRect& finalRect) { return false; }
    void exitFullscreenWithoutAnimationToMode(HTMLMediaElementEnums::VideoFullscreenMode) { }
    void cleanupFullscreen() { }
    void invalidate() { }
    void requestHideAndExitFullscreen() { }
    void preparedToReturnToInline(bool visible, const FloatRect& inlineRect) { }
    void preparedToExitFullscreen() { }
    void setHasVideoContentLayer(bool) { }
    void setInlineRect(const FloatRect&, bool visible) { }
    void preparedToReturnToStandby() { }
    bool mayAutomaticallyShowVideoPictureInPicture() const { return false; }
    void applicationDidBecomeActive() { }
    void setMode(HTMLMediaElementEnums::VideoFullscreenMode, bool) { }
    HTMLMediaElementEnums::VideoFullscreenMode mode() const { return HTMLMediaElementEnums::VideoFullscreenModeNone; }
    bool hasMode(HTMLMediaElementEnums::VideoFullscreenMode) const { return false; }
    bool pictureInPictureWasStartedWhenEnteringBackground() const { return false; }
    AVPlayerViewController *avPlayerViewController() const { return nullptr; }
    bool isPlayingVideoInEnhancedFullscreen() const { return false; }
    std::optional<MediaPlayerIdentifier> playerIdentifier() const { return std::nullopt; }
    bool changingStandbyOnly() { return false; }
    bool returningToStandby() const { return false; }

    // VideoPresentationModelClient
    void hasVideoChanged(bool) final { }
    void videoDimensionsChanged(const FloatSize&) final { }
    void setPlayerIdentifier(std::optional<MediaPlayerIdentifier>) final { }

    // PlaybackSessionModelClient
    void externalPlaybackChanged(bool, PlaybackSessionModel::ExternalPlaybackTargetType, const String&) final { }

private:
    NullVideoPresentationInterface(NullPlaybackSessionInterface& playbackSessionInterface)
        : m_playbackSessionInterface(playbackSessionInterface)
    {
    }

    // CheckedPtr interface
    uint32_t checkedPtrCount() const final { return CanMakeCheckedPtr::checkedPtrCount(); }
    uint32_t checkedPtrCountWithoutThreadCheck() const final { return CanMakeCheckedPtr::checkedPtrCountWithoutThreadCheck(); }
    void incrementCheckedPtrCount() const final { CanMakeCheckedPtr::incrementCheckedPtrCount(); }
    void decrementCheckedPtrCount() const final { CanMakeCheckedPtr::decrementCheckedPtrCount(); }

    Ref<NullPlaybackSessionInterface> m_playbackSessionInterface;
    ThreadSafeWeakPtr<VideoPresentationModel> m_videoPresentationModel;
};

} // namespace WebCore

#endif // PLATFORM(COCOA)
