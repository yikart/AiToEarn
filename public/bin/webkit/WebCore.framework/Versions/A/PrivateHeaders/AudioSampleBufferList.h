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

#include "CAAudioStreamDescription.h"
#include "CARingBuffer.h"
#include "WebAudioBufferList.h"
#include <CoreAudio/CoreAudioTypes.h>
#include <wtf/Lock.h>
#include <wtf/RefCounted.h>
#include <wtf/RefPtr.h>

typedef struct AudioStreamBasicDescription AudioStreamBasicDescription;
typedef struct OpaqueAudioConverter* AudioConverterRef;

namespace WebCore {

class AudioSampleBufferList : public RefCounted<AudioSampleBufferList> {
public:
    static Ref<AudioSampleBufferList> create(const CAAudioStreamDescription&, size_t);

    ~AudioSampleBufferList();

    static inline size_t audioBufferListSizeForStream(const CAAudioStreamDescription&);

    WEBCORE_EXPORT static void applyGain(AudioBufferList&, float, AudioStreamDescription::PCMFormat);
    void applyGain(float);

    OSStatus copyFrom(const AudioSampleBufferList&, size_t count = SIZE_MAX);
    OSStatus copyFrom(const AudioBufferList&, size_t frameCount, AudioConverterRef);
    OSStatus copyFrom(CARingBuffer&, size_t frameCount, uint64_t startFrame, CARingBuffer::FetchMode);

    OSStatus mixFrom(const AudioSampleBufferList&, size_t count = SIZE_MAX);

    OSStatus mixFrom(const AudioBufferList&, size_t count = SIZE_MAX);
    OSStatus copyTo(AudioBufferList&, size_t count = SIZE_MAX);

    const AudioStreamBasicDescription& streamDescription() const { return m_internalFormat.streamDescription(); }
    const WebAudioBufferList& bufferList() const { return m_bufferList; }
    WebAudioBufferList& bufferList() { return m_bufferList; }

    uint32_t sampleCapacity() const { return m_sampleCapacity; }
    uint32_t sampleCount() const { return m_sampleCount; }
    void setSampleCount(size_t);

    uint64_t timestamp() const { return m_timestamp; }
    double hostTime() const { return m_hostTime; }
    void setTimes(uint64_t time, double hostTime) { m_timestamp = time; m_hostTime = hostTime; }

    void reset();

    WEBCORE_EXPORT static void zeroABL(AudioBufferList&, size_t);
    void zero();

protected:
    AudioSampleBufferList(const CAAudioStreamDescription&, size_t);

    CAAudioStreamDescription m_internalFormat;

    uint64_t m_timestamp { 0 };
    double m_hostTime { -1 };
    size_t m_sampleCount { 0 };
    size_t m_sampleCapacity { 0 };
    size_t m_maxBufferSizePerChannel { 0 };
    size_t m_bufferListBaseSize { 0 };
    UniqueRef<WebAudioBufferList> m_bufferList;
};

inline size_t AudioSampleBufferList::audioBufferListSizeForStream(const CAAudioStreamDescription& description)
{
    return offsetof(AudioBufferList, mBuffers) + (sizeof(AudioBuffer) * std::max<uint32_t>(1, description.numberOfChannelStreams()));
}

} // namespace WebCore
