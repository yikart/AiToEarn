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

#ifndef AudioBus_h
#define AudioBus_h

#include "AudioChannel.h"
#include <memory>
#include <wtf/Noncopyable.h>
#include <wtf/ThreadSafeRefCounted.h>
#include <wtf/Vector.h>

namespace WebCore {

// An AudioBus represents a collection of one or more AudioChannels.
// The data layout is "planar" as opposed to "interleaved".
// An AudioBus with one channel is mono, an AudioBus with two channels is stereo, etc.

enum class ChannelInterpretation {
    Speakers,
    Discrete,
};

class AudioBus final : public ThreadSafeRefCounted<AudioBus> {
    WTF_MAKE_NONCOPYABLE(AudioBus);
public:
    enum {
        ChannelLeft = 0,
        ChannelRight = 1,
        ChannelCenter = 2, // center and mono are the same
        ChannelMono = 2,
        ChannelLFE = 3,
        ChannelSurroundLeft = 4,
        ChannelSurroundRight = 5,
    };

    enum {
        LayoutCanonical = 0
        // Can define non-standard layouts here
    };

    // allocate indicates whether or not to initially have the AudioChannels created with managed storage.
    // Normal usage is to pass true here, in which case the AudioChannels will memory-manage their own storage.
    // If allocate is false then setChannelMemory() has to be called later on for each channel before the AudioBus is useable...
    WEBCORE_EXPORT static RefPtr<AudioBus> create(unsigned numberOfChannels, size_t length, bool allocate = true);

    // Tells the given channel to use an externally allocated buffer.
    WEBCORE_EXPORT void setChannelMemory(unsigned channelIndex, std::span<float> storage);

    // Channels
    unsigned numberOfChannels() const { return m_channels.size(); }

    AudioChannel* channel(unsigned channel) { return m_channels[channel].get(); }
    const AudioChannel* channel(unsigned channel) const { return m_channels[channel].get(); }
    AudioChannel* channelByType(unsigned type);
    const AudioChannel* channelByType(unsigned type) const;

    // Number of sample-frames
    size_t length() const { return m_length; }

    // Reduce the number of frames available without changing the allocated memory size.
    void setLength(size_t);

    // Sample-rate : 0.0 if unknown or "don't care"
    float sampleRate() const { return m_sampleRate; }
    void setSampleRate(float sampleRate) { m_sampleRate = sampleRate; }

    // Zeroes all channels.
    void zero();

    // Clears the silent flag on all channels.
    void clearSilentFlag();

    // Returns true if the silent bit is set on all channels.
    bool isSilent() const;

    // Returns true if the channel count and frame-size match.
    bool topologyMatches(const AudioBus &sourceBus) const;

    // Creates a new buffer from a range in the source buffer.
    // 0 may be returned if the range does not fit in the sourceBuffer
    static RefPtr<AudioBus> createBufferFromRange(const AudioBus* sourceBuffer, unsigned startFrame, unsigned endFrame);


    // Creates a new AudioBus by sample-rate converting sourceBus to the newSampleRate.
    // setSampleRate() must have been previously called on sourceBus.
    // Note: sample-rate conversion is already handled in the file-reading code for the mac port, so we don't need this.
    static RefPtr<AudioBus> createBySampleRateConverting(const AudioBus* sourceBus, bool mixToMono, double newSampleRate);

    // Creates a new AudioBus by mixing all the channels down to mono.
    // If sourceBus is already mono, then the returned AudioBus will simply be a copy.
    static RefPtr<AudioBus> createByMixingToMono(const AudioBus* sourceBus);

    // Scales all samples by the same amount.
    void scale(float scale);

    void reset() { m_isFirstTime = true; } // for de-zippering

    // Copies the samples from the source bus to this one.
    void copyFromRange(const AudioBus& sourceBus, unsigned startFrame, unsigned endFrame);

    // Copies the samples from the source bus to this one.
    // This is just a simple per-channel copy if the number of channels match, otherwise an up-mix or down-mix is done.
    WEBCORE_EXPORT void copyFrom(const AudioBus& sourceBus, ChannelInterpretation = ChannelInterpretation::Speakers);

    // Sums the samples from the source bus to this one.
    // This is just a simple per-channel summing if the number of channels match, otherwise an up-mix or down-mix is done.
    void sumFrom(const AudioBus& sourceBus, ChannelInterpretation = ChannelInterpretation::Speakers);

    // Copy each channel from sourceBus into our corresponding channel.
    // We scale by targetGain (and our own internal gain m_busGain).
    void copyWithGainFrom(const AudioBus& sourceBus, float targetGain);

    // Copies the sourceBus by scaling with sample-accurate gain values.
    void copyWithSampleAccurateGainValuesFrom(const AudioBus &sourceBus, std::span<float> gainValues);

    // Returns maximum absolute value across all channels (useful for normalization).
    float maxAbsValue() const;

    // Makes maximum absolute value == 1.0 (if possible).
    void normalize();

    static RefPtr<AudioBus> loadPlatformResource(const char* name, float sampleRate);

private:
    AudioBus() { }

    AudioBus(unsigned numberOfChannels, size_t length, bool allocate);

    void speakersSumFromByUpMixing(const AudioBus&);
    void speakersSumFromByDownMixing(const AudioBus&);
    void discreteSumFrom(const AudioBus&);

    size_t m_length;
    Vector<std::unique_ptr<AudioChannel>> m_channels;
    int m_layout;
    float m_busGain { 1 };
    std::unique_ptr<AudioFloatArray> m_dezipperGainValues;
    bool m_isFirstTime { 0 };
    float m_sampleRate { 0 }; // 0.0 if unknown or N/A
};

} // WebCore

#endif // AudioBus_h
