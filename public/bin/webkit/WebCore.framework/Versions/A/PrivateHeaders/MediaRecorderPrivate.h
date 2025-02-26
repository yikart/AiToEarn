/*
 * Copyright (C) 2018 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "ExceptionOr.h"
#include "MediaRecorderPrivateOptions.h"
#include "RealtimeMediaSource.h"
#include <wtf/CheckedRef.h>
#include <wtf/CompletionHandler.h>
#include <wtf/Forward.h>
#include <wtf/TZoneMalloc.h>

#if ENABLE(MEDIA_RECORDER)

namespace WTF {
class MediaTime;
}

namespace WebCore {

class AudioStreamDescription;
class MediaSample;
class MediaStreamPrivate;
class MediaStreamTrackPrivate;
class PlatformAudioData;
class FragmentedSharedBuffer;

struct MediaRecorderPrivateOptions;

class MediaRecorderPrivate
    : public RealtimeMediaSource::AudioSampleObserver
    , public RealtimeMediaSource::VideoFrameObserver
    , public CanMakeCheckedPtr<MediaRecorderPrivate> {
    WTF_MAKE_TZONE_ALLOCATED(MediaRecorderPrivate);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(MediaRecorderPrivate);
public:
    ~MediaRecorderPrivate();

    // CheckedPtr interface
    uint32_t checkedPtrCount() const final { return CanMakeCheckedPtr::checkedPtrCount(); }
    uint32_t checkedPtrCountWithoutThreadCheck() const final { return CanMakeCheckedPtr::checkedPtrCountWithoutThreadCheck(); }
    void incrementCheckedPtrCount() const final { CanMakeCheckedPtr::incrementCheckedPtrCount(); }
    void decrementCheckedPtrCount() const final { CanMakeCheckedPtr::decrementCheckedPtrCount(); }

    struct AudioVideoSelectedTracks {
        MediaStreamTrackPrivate* audioTrack { nullptr };
        MediaStreamTrackPrivate* videoTrack { nullptr };
    };
    WEBCORE_EXPORT static AudioVideoSelectedTracks selectTracks(MediaStreamPrivate&);

    using FetchDataCallback = CompletionHandler<void(RefPtr<FragmentedSharedBuffer>&&, const String& mimeType, double)>;
    virtual void fetchData(FetchDataCallback&&) = 0;
    virtual String mimeType() const = 0;

    void stop(CompletionHandler<void()>&&);
    void pause(CompletionHandler<void()>&&);
    void resume(CompletionHandler<void()>&&);

    using StartRecordingCallback = CompletionHandler<void(ExceptionOr<String>&&, unsigned, unsigned)>;
    virtual void startRecording(StartRecordingCallback&& callback) { callback(String(mimeType()), 0, 0); }

    void trackMutedChanged(MediaStreamTrackPrivate& track) { checkTrackState(track); }
    void trackEnabledChanged(MediaStreamTrackPrivate& track) { checkTrackState(track); }

    struct BitRates {
        unsigned audio;
        unsigned video;
    };
    static BitRates computeBitRates(const MediaRecorderPrivateOptions&, const MediaStreamPrivate* = nullptr);

protected:
    void setAudioSource(RefPtr<RealtimeMediaSource>&&);
    void setVideoSource(RefPtr<RealtimeMediaSource>&&);

    void checkTrackState(const MediaStreamTrackPrivate&);

    bool shouldMuteAudio() const { return m_shouldMuteAudio; }
    bool shouldMuteVideo() const { return m_shouldMuteVideo; }

private:

    virtual void stopRecording(CompletionHandler<void()>&&) = 0;
    virtual void pauseRecording(CompletionHandler<void()>&&) = 0;
    virtual void resumeRecording(CompletionHandler<void()>&&) = 0;

private:
    bool m_shouldMuteAudio { false };
    bool m_shouldMuteVideo { false };
    RefPtr<RealtimeMediaSource> m_audioSource;
    RefPtr<RealtimeMediaSource> m_videoSource;
    RefPtr<RealtimeMediaSource> m_pausedAudioSource;
    RefPtr<RealtimeMediaSource> m_pausedVideoSource;
};

inline void MediaRecorderPrivate::setAudioSource(RefPtr<RealtimeMediaSource>&& audioSource)
{
    if (m_audioSource)
        m_audioSource->removeAudioSampleObserver(*this);

    m_audioSource = WTFMove(audioSource);

    if (m_audioSource)
        m_audioSource->addAudioSampleObserver(*this);
}

inline void MediaRecorderPrivate::setVideoSource(RefPtr<RealtimeMediaSource>&& videoSource)
{
    if (m_videoSource)
        m_videoSource->removeVideoFrameObserver(*this);

    m_videoSource = WTFMove(videoSource);

    if (m_videoSource)
        m_videoSource->addVideoFrameObserver(*this);
}

inline MediaRecorderPrivate::~MediaRecorderPrivate()
{
    // Subclasses should stop observing sonner than here. Otherwise they might be called from a background thread while half destroyed
    ASSERT(!m_audioSource);
    ASSERT(!m_videoSource);
    if (m_audioSource)
        m_audioSource->removeAudioSampleObserver(*this);
    if (m_videoSource)
        m_videoSource->removeVideoFrameObserver(*this);
}

} // namespace WebCore

#endif // ENABLE(MEDIA_RECORDER)
