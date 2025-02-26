/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

#include "AudioDestinationResampler.h"
#include "AudioOutputUnitAdaptor.h"
#include <AudioUnit/AudioUnit.h>
#include <wtf/Lock.h>
#include <wtf/RefPtr.h>
#include <wtf/UniqueRef.h>

namespace WebCore {

class AudioBus;
class MultiChannelResampler;
class PushPullFIFO;

using CreateAudioDestinationCocoaOverride = Ref<AudioDestination>(*)(AudioIOCallback&, float sampleRate);

// An AudioDestination using CoreAudio's default output AudioUnit
class AudioDestinationCocoa : public AudioDestinationResampler, public AudioUnitRenderer, public ThreadSafeRefCounted<AudioDestinationCocoa, WTF::DestructionThread::Main> {
public:
    WEBCORE_EXPORT AudioDestinationCocoa(AudioIOCallback&, unsigned numberOfOutputChannels, float sampleRate);
    WEBCORE_EXPORT virtual ~AudioDestinationCocoa();
    void ref() const final { return ThreadSafeRefCounted<AudioDestinationCocoa, WTF::DestructionThread::Main>::ref(); }
    void deref() const final { return ThreadSafeRefCounted<AudioDestinationCocoa, WTF::DestructionThread::Main>::deref(); }

    WEBCORE_EXPORT static CreateAudioDestinationCocoaOverride createOverride;

protected:
    WEBCORE_EXPORT OSStatus render(double sampleTime, uint64_t hostTime, UInt32 numberOfFrames, AudioBufferList* ioData) final;

private:
    friend Ref<AudioDestination> AudioDestination::create(AudioIOCallback&, const String&, unsigned, unsigned, float);

    void startRendering(CompletionHandler<void(bool)>&&) override;
    void stopRendering(CompletionHandler<void(bool)>&&) override;

    AudioOutputUnitAdaptor m_audioOutputUnitAdaptor;

};

} // namespace WebCore

#endif // ENABLE(WEB_AUDIO)
