/*
 * Copyright (C) 2020 Apple Inc. All rights reserved.
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

#if ENABLE(MEDIA_STREAM)

#if USE(LIBWEBRTC)
#include "LibWebRTCAudioModule.h"
#endif

#include <wtf/Function.h>
#include <wtf/LoggerHelper.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/ThreadSafeWeakPtr.h>

namespace WTF {
class MediaTime;
}

namespace WebCore {

class AudioStreamDescription;
class PlatformAudioData;

class WEBCORE_EXPORT AudioMediaStreamTrackRenderer : public ThreadSafeRefCountedAndCanMakeThreadSafeWeakPtr<AudioMediaStreamTrackRenderer, WTF::DestructionThread::Main>, public LoggerHelper {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(AudioMediaStreamTrackRenderer, WEBCORE_EXPORT);
public:
    struct Init {
        Function<void()>&& crashCallback;
#if USE(LIBWEBRTC)
        RefPtr<LibWebRTCAudioModule> audioModule;
#endif
#if !RELEASE_LOG_DISABLED
        const Logger& logger;
        uint64_t logIdentifier;
#endif
    };
    static RefPtr<AudioMediaStreamTrackRenderer> create(Init&&);
    virtual ~AudioMediaStreamTrackRenderer() = default;

    static String defaultDeviceID();

    virtual void start(CompletionHandler<void()>&&) = 0;
    virtual void stop() = 0;
    virtual void clear() = 0;
    // May be called on a background thread. It should only be called after start/before stop is called.
    virtual void pushSamples(const WTF::MediaTime&, const PlatformAudioData&, const AudioStreamDescription&, size_t) = 0;

    virtual void setVolume(float);
    float volume() const;

    virtual void setAudioOutputDevice(const String&);

protected:
    explicit AudioMediaStreamTrackRenderer(Init&&);

#if !RELEASE_LOG_DISABLED
    const Logger& logger() const final;
    uint64_t logIdentifier() const final;

    ASCIILiteral logClassName() const final;
    WTFLogChannel& logChannel() const final;
#endif

#if USE(LIBWEBRTC)
    LibWebRTCAudioModule* audioModule();
#endif

    void crashed();

private:
    // Main thread writable members
    float m_volume { 1 };
    Function<void()> m_crashCallback;

#if USE(LIBWEBRTC)
    RefPtr<LibWebRTCAudioModule> m_audioModule;
#endif

#if !RELEASE_LOG_DISABLED
    Ref<const Logger> m_logger;
    const uint64_t m_logIdentifier;
#endif
};

inline void AudioMediaStreamTrackRenderer::setVolume(float volume)
{
    m_volume = volume;
}

inline float AudioMediaStreamTrackRenderer::volume() const
{
    return m_volume;
}

inline void AudioMediaStreamTrackRenderer::crashed()
{
    if (m_crashCallback)
        m_crashCallback();
}

#if USE(LIBWEBRTC)
inline LibWebRTCAudioModule* AudioMediaStreamTrackRenderer::audioModule()
{
    return m_audioModule.get();
}
#endif

inline void AudioMediaStreamTrackRenderer::setAudioOutputDevice(const String&)
{
}

}

#endif // ENABLE(MEDIA_STREAM)
