/*
 * Copyright (C) 2022 Apple Inc. All rights reserved.
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

#if ENABLE(WEB_AUDIO)

#include "AudioDestination.h"
#include "PushPullFIFO.h"
#include <wtf/Lock.h>
#include <wtf/RefPtr.h>

namespace WebCore {

class AudioBus;
class MultiChannelResampler;

// Base class for audio destinations that may need resampling.
// The subclass should use m_outputBus to access the rendering.
class AudioDestinationResampler : public AudioDestination {
public:
    WEBCORE_EXPORT AudioDestinationResampler(AudioIOCallback&, unsigned numberOfOutputChannels, float inputSampleRate, float outputSampleRate);
    WEBCORE_EXPORT virtual ~AudioDestinationResampler();

    WEBCORE_EXPORT void start(Function<void(Function<void()>&&)>&& dispatchToRenderThread, CompletionHandler<void(bool)>&&) final;
    WEBCORE_EXPORT void stop(CompletionHandler<void(bool)>&&) final;

protected:
    WEBCORE_EXPORT void setIsPlaying(bool);
    bool isPlaying() final { return m_isPlaying; }
    WEBCORE_EXPORT unsigned framesPerBuffer() const final;

    // The caller is expected to call both pullRendered and render.
    // The caller fills the m_outputBus channel data pointers before calling this.
    // Returns the number of frames to render.
    WEBCORE_EXPORT size_t pullRendered(size_t numberOfFrames);
    WEBCORE_EXPORT bool render(double sampleTime, MonotonicTime hostTime, size_t framesToRender);

private:
    void renderOnRenderingThreadIfPlaying(size_t framesToRender);

    virtual void startRendering(CompletionHandler<void(bool)>&&) = 0;
    virtual void stopRendering(CompletionHandler<void(bool)>&&) = 0;

protected:
    // To pass the data from FIFO to the audio device callback.
    Ref<AudioBus> m_outputBus;

private:
    // To push the rendered result from WebAudio graph into the FIFO.
    Ref<AudioBus> m_renderBus;

    // Resolves the buffer size mismatch between the WebAudio engine and
    // the callback function from the actual audio device.
    Lock m_fifoLock;
    PushPullFIFO m_fifo WTF_GUARDED_BY_LOCK(m_fifoLock);

    std::unique_ptr<MultiChannelResampler> m_resampler;
    AudioIOPosition m_outputTimestamp;

    Lock m_dispatchToRenderThreadLock;
    Function<void(Function<void()>&&)> m_dispatchToRenderThread WTF_GUARDED_BY_LOCK(m_dispatchToRenderThreadLock);

    std::atomic<bool> m_isPlaying;
};

} // namespace WebCore

#endif // ENABLE(WEB_AUDIO)
