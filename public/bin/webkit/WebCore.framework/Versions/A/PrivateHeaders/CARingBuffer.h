/*
 * Copyright (C) 2014 Apple Inc. All rights reserved.
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

#if ENABLE(WEB_AUDIO) && USE(MEDIATOOLBOX)

#include "AudioStreamDescription.h"
#include <JavaScriptCore/ArrayBuffer.h>
#include <optional>
#include <wtf/CheckedArithmetic.h>
#include <wtf/Lock.h>
#include <wtf/SequenceLocked.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/UniqueRef.h>
#include <wtf/Vector.h>

typedef struct AudioBufferList AudioBufferList;

namespace WebCore {

class CAAudioStreamDescription;

class CARingBuffer {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(CARingBuffer, WEBCORE_EXPORT);
public:
    WEBCORE_EXPORT virtual ~CARingBuffer();

    enum Error {
        Ok,
        TooMuch, // fetch start time is earlier than buffer start time and fetch end time is later than buffer end time
    };
    struct TimeBounds {
        uint64_t startFrame { 0 };
        uint64_t endFrame { 0 };
        bool operator<=>(const TimeBounds&) const = default;
    };
    WEBCORE_EXPORT TimeBounds getStoreTimeBounds();
    WEBCORE_EXPORT Error store(const AudioBufferList*, size_t frameCount, uint64_t startFrame);

    enum FetchMode { Copy, MixInt16, MixInt32, MixFloat32, MixFloat64 };
    static FetchMode fetchModeForMixing(AudioStreamDescription::PCMFormat);
    WEBCORE_EXPORT bool fetchIfHasEnoughData(AudioBufferList*, size_t frameCount, uint64_t startFrame, FetchMode = Copy);

    // Fills buffer with silence if there is not enough data.
    WEBCORE_EXPORT void fetch(AudioBufferList*, size_t frameCount, uint64_t startFrame, FetchMode = Copy);

    WEBCORE_EXPORT TimeBounds getFetchTimeBounds();

    uint32_t channelCount() const { return m_channelCount; }

protected:
    WEBCORE_EXPORT CARingBuffer(size_t bytesPerFrame, size_t frameCount, uint32_t numChannelStreams);
    WEBCORE_EXPORT void initialize();

    WEBCORE_EXPORT static CheckedSize computeCapacityBytes(size_t bytesPerFrame, size_t frameCount);
    WEBCORE_EXPORT static CheckedSize computeSizeForBuffers(size_t bytesPerFrame, size_t frameCount, uint32_t numChannelStreams);

    virtual void* data() = 0;
    using TimeBoundsBuffer = SequenceLocked<TimeBounds>;
    virtual TimeBoundsBuffer& timeBoundsBuffer() = 0;

private:
    size_t frameOffset(uint64_t frameNumber) const { return (frameNumber % m_frameCount) * m_bytesPerFrame; }
    void setTimeBounds(TimeBounds bufferBounds);
    void fetchInternal(AudioBufferList*, size_t frameCount, uint64_t startFrame, FetchMode, TimeBounds bufferBounds);

    Vector<Byte*> m_pointers;
    const uint32_t m_channelCount;
    const size_t m_bytesPerFrame;
    const uint32_t m_frameCount;
    const size_t m_capacityBytes;

    // Stored range.
    TimeBounds m_storeBounds;
};

inline CARingBuffer::FetchMode CARingBuffer::fetchModeForMixing(AudioStreamDescription::PCMFormat format)
{
    switch (format) {
    case AudioStreamDescription::None:
    case AudioStreamDescription::Uint8:
    case AudioStreamDescription::Int24:
        ASSERT_NOT_REACHED();
        return MixInt32;
    case AudioStreamDescription::Int16:
        return MixInt16;
    case AudioStreamDescription::Int32:
        return MixInt32;
    case AudioStreamDescription::Float32:
        return MixFloat32;
    case AudioStreamDescription::Float64:
        return MixFloat64;
    }
}

class InProcessCARingBuffer final : public CARingBuffer {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(InProcessCARingBuffer, WEBCORE_EXPORT);
public:
    WEBCORE_EXPORT static std::unique_ptr<InProcessCARingBuffer> allocate(const WebCore::CAAudioStreamDescription& format, size_t frameCount);
    WEBCORE_EXPORT ~InProcessCARingBuffer();

    TimeBoundsBuffer& timeBoundsBufferForTesting() { return timeBoundsBuffer(); }

protected:
    WEBCORE_EXPORT InProcessCARingBuffer(size_t bytesPerFrame, size_t frameCount, uint32_t numChannelStreams, Vector<uint8_t>&& buffer);
    void* data() final { return m_buffer.data(); }
    TimeBoundsBuffer& timeBoundsBuffer() final { return m_timeBoundsBuffer; }

private:
    Vector<uint8_t> m_buffer;
    TimeBoundsBuffer m_timeBoundsBuffer;
};

}

#endif // ENABLE(WEB_AUDIO) && USE(MEDIATOOLBOX)
