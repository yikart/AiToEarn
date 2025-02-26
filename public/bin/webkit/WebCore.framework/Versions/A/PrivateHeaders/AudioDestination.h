/*
 * Copyright (C) 2010 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#ifndef AudioDestination_h
#define AudioDestination_h

#include "AudioBus.h"
#include "AudioIOCallback.h"
#include <memory>
#include <wtf/AbstractRefCounted.h>
#include <wtf/CompletionHandler.h>
#include <wtf/Lock.h>
#include <wtf/ThreadSafeRefCounted.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

// AudioDestination is an abstraction for audio hardware I/O.
// The audio hardware periodically calls the AudioIOCallback render() method asking it to render/output the next render quantum of audio.
// It optionally will pass in local/live audio input when it calls render().

class AudioDestination : public AbstractRefCounted {
public:
    // Pass in (numberOfInputChannels > 0) if live/local audio input is desired.
    // Port-specific device identification information for live/local input streams can be passed in the inputDeviceId.
    WEBCORE_EXPORT static Ref<AudioDestination> create(AudioIOCallback&, const String& inputDeviceId, unsigned numberOfInputChannels, unsigned numberOfOutputChannels, float sampleRate);

    virtual ~AudioDestination() = default;

    void clearCallback();

    virtual void start(Function<void(Function<void()>&&)>&& dispatchToRenderThread, CompletionHandler<void(bool)>&& = [](bool) { }) = 0;
    virtual void stop(CompletionHandler<void(bool)>&& = [](bool) { }) = 0;
    virtual bool isPlaying() = 0;

    // Sample-rate conversion may happen in AudioDestination to the hardware sample-rate
    virtual float sampleRate() const { return m_sampleRate; }
    WEBCORE_EXPORT static float hardwareSampleRate();

    virtual unsigned framesPerBuffer() const = 0;

    // maxChannelCount() returns the total number of output channels of the audio hardware.
    // A value of 0 indicates that the number of channels cannot be configured and
    // that only stereo (2-channel) destinations can be created.
    // The numberOfOutputChannels parameter of AudioDestination::create() is allowed to
    // be a value: 1 <= numberOfOutputChannels <= maxChannelCount(),
    // or if maxChannelCount() equals 0, then numberOfOutputChannels must be 2.
    static unsigned long maxChannelCount();

    void callRenderCallback(AudioBus* sourceBus, AudioBus* destinationBus, size_t framesToProcess, const AudioIOPosition& outputPosition);

protected:
    explicit AudioDestination(AudioIOCallback&, float sampleRate);

    Lock m_callbackLock;
    AudioIOCallback* m_callback WTF_GUARDED_BY_LOCK(m_callbackLock) { nullptr };

private:
    const float m_sampleRate;
};

inline AudioDestination::AudioDestination(AudioIOCallback& callback, float sampleRate)
    : m_sampleRate(sampleRate)
{
    Locker locker { m_callbackLock };
    m_callback = &callback;
}

inline void AudioDestination::clearCallback()
{
    Locker locker { m_callbackLock };
    m_callback = nullptr;
}

inline void AudioDestination::callRenderCallback(AudioBus* sourceBus, AudioBus* destinationBus, size_t framesToProcess, const AudioIOPosition& outputPosition)
{
    if (m_callbackLock.tryLock()) {
        Locker locker { AdoptLock, m_callbackLock };
        if (m_callback) {
            m_callback->render(sourceBus, destinationBus, framesToProcess, outputPosition);
            return;
        }
    }
    destinationBus->zero();
}

} // namespace WebCore

#endif // AudioDestination_h
