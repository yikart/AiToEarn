/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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

#include "AudioSampleDataConverter.h"
#include "CAAudioStreamDescription.h"
#include "CARingBuffer.h"
#include <CoreAudio/CoreAudioTypes.h>
#include <wtf/LoggerHelper.h>
#include <wtf/MediaTime.h>
#include <wtf/RefPtr.h>
#include <wtf/ThreadSafeRefCounted.h>
#include <wtf/text/WTFString.h>

typedef struct OpaqueAudioConverter* AudioConverterRef;
typedef struct opaqueCMSampleBuffer *CMSampleBufferRef;

namespace WebCore {

class AudioSampleBufferList;
class PlatformAudioData;

class AudioSampleDataSource : public ThreadSafeRefCounted<AudioSampleDataSource, WTF::DestructionThread::MainRunLoop>
#if !RELEASE_LOG_DISABLED
    , private LoggerHelper
#endif
    {
public:
    static Ref<AudioSampleDataSource> create(size_t, LoggerHelper&, size_t waitToStartForPushCount = 2);

    ~AudioSampleDataSource();

    OSStatus setInputFormat(const CAAudioStreamDescription&);
    OSStatus setOutputFormat(const CAAudioStreamDescription&);

    void pushSamples(const MediaTime&, const PlatformAudioData&, size_t);
    void pushSamples(const AudioStreamBasicDescription&, CMSampleBufferRef);

    enum PullMode { Copy, Mix };
    bool pullSamples(AudioBufferList&, size_t, uint64_t, double, PullMode);

    bool pullAvailableSamplesAsChunks(AudioBufferList&, size_t frameCount, uint64_t timeStamp, Function<void()>&&);
    bool pullAvailableSampleChunk(AudioBufferList&, size_t frameCount, uint64_t timeStamp, PullMode);

    void setVolume(float volume) { m_volume = volume; }
    float volume() const { return m_volume; }

    void setMuted(bool muted) { m_muted = muted; }
    bool muted() const { return m_muted; }

    const CAAudioStreamDescription* inputDescription() const { return m_inputDescription ? &m_inputDescription.value() : nullptr; }
    const CAAudioStreamDescription* outputDescription() const { return m_outputDescription ? &m_outputDescription.value() : nullptr; }

    void recomputeSampleOffset() { m_shouldComputeOutputSampleOffset = true; }

#if !RELEASE_LOG_DISABLED
    const Logger& logger() const final { return m_logger; }
    uint64_t logIdentifier() const final { return m_logIdentifier; }
    void setLogger(Ref<const Logger>&&, uint64_t);
#endif

    static constexpr float EquivalentToMaxVolume = 0.95;

private:
    AudioSampleDataSource(size_t, LoggerHelper&, size_t waitToStartForPushCount);

    OSStatus setupConverter();

    void pushSamplesInternal(const AudioBufferList&, const MediaTime&, size_t frameCount);
    bool pullSamplesInternal(AudioBufferList&, size_t sampleCount, uint64_t timeStamp, PullMode);

    std::optional<CAAudioStreamDescription> m_inputDescription;
    std::optional<CAAudioStreamDescription> m_outputDescription;

    MediaTime hostTime() const;

#if !RELEASE_LOG_DISABLED
    ASCIILiteral logClassName() const final { return "AudioSampleDataSource"_s; }
    WTFLogChannel& logChannel() const final;
#endif

    uint64_t m_lastPushedSampleCount { 0 };
    size_t m_waitToStartForPushCount { 2 };

    int64_t m_expectedNextPushedSampleTimeValue { 0 };
    int64_t m_converterInputOffset { 0 };
    std::optional<int64_t> m_inputSampleOffset;
    int64_t m_outputSampleOffset { 0 };
    uint64_t m_lastBufferedAmount { 0 };

    AudioSampleDataConverter m_converter;

    RefPtr<AudioSampleBufferList> m_scratchBuffer;

    std::unique_ptr<InProcessCARingBuffer> m_ringBuffer;
    size_t m_maximumSampleCount { 0 };

    float m_volume { 1.0 };
    bool m_muted { false };
    bool m_shouldComputeOutputSampleOffset { true };

    bool m_isInNeedOfMoreData { false };
#if !RELEASE_LOG_DISABLED
    Ref<const Logger> m_logger;
    uint64_t m_logIdentifier { 0 };
#endif
};

} // namespace WebCore
