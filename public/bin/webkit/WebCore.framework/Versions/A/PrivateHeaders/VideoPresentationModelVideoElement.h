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

#if ENABLE(VIDEO_PRESENTATION_MODE)

#include "EventListener.h"
#include "FloatRect.h"
#include "HTMLMediaElementEnums.h"
#include "MediaPlayerEnums.h"
#include "MediaPlayerIdentifier.h"
#include "PlatformLayer.h"
#include "VideoPresentationModel.h"
#include <wtf/CheckedPtr.h>
#include <wtf/Function.h>
#include <wtf/HashSet.h>
#include <wtf/RefPtr.h>
#include <wtf/RetainPtr.h>
#include <wtf/Vector.h>

namespace WebCore {

class AudioTrack;
class HTMLVideoElement;
class TextTrack;
class PlaybackSessionModelMediaElement;

class VideoPresentationModelVideoElement final : public VideoPresentationModel {
public:
    static Ref<VideoPresentationModelVideoElement> create()
    {
        return adoptRef(*new VideoPresentationModelVideoElement());
    }
    WEBCORE_EXPORT ~VideoPresentationModelVideoElement();
    WEBCORE_EXPORT void setVideoElement(HTMLVideoElement*);
    HTMLVideoElement* videoElement() const { return m_videoElement.get(); }
    WEBCORE_EXPORT RetainPtr<PlatformLayer> createVideoFullscreenLayer();
    WEBCORE_EXPORT void setVideoFullscreenLayer(PlatformLayer*, Function<void()>&& completionHandler = [] { });
    WEBCORE_EXPORT void willExitFullscreen() final;
    WEBCORE_EXPORT void waitForPreparedForInlineThen(Function<void()>&& completionHandler);

    WEBCORE_EXPORT void addClient(VideoPresentationModelClient&) final;
    WEBCORE_EXPORT void removeClient(VideoPresentationModelClient&) final;
    WEBCORE_EXPORT void requestFullscreenMode(HTMLMediaElementEnums::VideoFullscreenMode, bool finishedWithMedia = false) final;
    WEBCORE_EXPORT void setVideoLayerFrame(FloatRect) final;
    WEBCORE_EXPORT void setVideoLayerGravity(MediaPlayerEnums::VideoGravity) final;
    WEBCORE_EXPORT void setVideoFullscreenFrame(FloatRect) final;
    WEBCORE_EXPORT void fullscreenModeChanged(HTMLMediaElementEnums::VideoFullscreenMode) final;
    FloatSize videoDimensions() const final { return m_videoDimensions; }
    bool hasVideo() const final { return m_hasVideo; }

    WEBCORE_EXPORT void setVideoSizeFenced(const FloatSize&, WTF::MachSendRight&&);

    WEBCORE_EXPORT void requestRouteSharingPolicyAndContextUID(CompletionHandler<void(RouteSharingPolicy, String)>&&) final;
    WEBCORE_EXPORT void setRequiresTextTrackRepresentation(bool) final;
    WEBCORE_EXPORT void setTextTrackRepresentationBounds(const IntRect&) final;

#if !RELEASE_LOG_DISABLED
    const Logger* loggerPtr() const final;
    WEBCORE_EXPORT uint64_t logIdentifier() const final;
    WEBCORE_EXPORT uint64_t nextChildIdentifier() const final;
    ASCIILiteral logClassName() const { return "VideoPresentationModelVideoElement"_s; }
    WTFLogChannel& logChannel() const;
#endif

protected:
    WEBCORE_EXPORT VideoPresentationModelVideoElement();

private:
    class VideoListener final : public EventListener {
    public:
        static Ref<VideoListener> create(VideoPresentationModelVideoElement& parent)
        {
            return adoptRef(*new VideoListener(parent));
        }
        void handleEvent(WebCore::ScriptExecutionContext&, WebCore::Event&) final;
    private:
        explicit VideoListener(VideoPresentationModelVideoElement&);

        ThreadSafeWeakPtr<VideoPresentationModelVideoElement> m_parent;
    };

    void setHasVideo(bool);
    void setVideoDimensions(const FloatSize&);
    void setPlayerIdentifier(std::optional<MediaPlayerIdentifier>);

    void willEnterPictureInPicture() final;
    void didEnterPictureInPicture() final;
    void failedToEnterPictureInPicture() final;
    void willExitPictureInPicture() final;
    void didExitPictureInPicture() final;

    static std::span<const AtomString> observedEventNames();
    static std::span<const AtomString> documentObservedEventNames();
    const AtomString& eventNameAll();
    friend class VideoListener;
    void updateForEventName(const AtomString&);
    void cleanVideoListeners();
    void documentVisibilityChanged();

    Ref<VideoListener> m_videoListener;
    RefPtr<HTMLVideoElement> m_videoElement;
    RetainPtr<PlatformLayer> m_videoFullscreenLayer;
    bool m_isListening { false };
    HashSet<CheckedPtr<VideoPresentationModelClient>> m_clients;
    bool m_hasVideo { false };
    bool m_documentIsVisible { true };
    FloatSize m_videoDimensions;
    FloatRect m_videoFrame;
    Vector<RefPtr<TextTrack>> m_legibleTracksForMenu;
    Vector<RefPtr<AudioTrack>> m_audioTracksForMenu;
    std::optional<MediaPlayerIdentifier> m_playerIdentifier;

#if !RELEASE_LOG_DISABLED
    mutable uint64_t m_childIdentifierSeed { 0 };
#endif
};

} // namespace WebCore

#endif // ENABLE(VIDEO_PRESENTATION_MODE)
