/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
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

#include <wtf/TZoneMalloc.h>

typedef struct AudioBufferList AudioBufferList;
struct AudioStreamBasicDescription;
typedef struct OpaqueAudioConverter* AudioConverterRef;

namespace WebCore {

class AudioSampleBufferList;
class CAAudioStreamDescription;
class PlatformAudioData;

class AudioSampleDataConverter {
    WTF_MAKE_TZONE_ALLOCATED(AudioSampleDataConverter);
public:
    AudioSampleDataConverter();
    ~AudioSampleDataConverter();

    OSStatus setFormats(const CAAudioStreamDescription& inputDescription, const CAAudioStreamDescription& outputDescription);
    bool updateBufferedAmount(size_t currentBufferedAmount, size_t pushedSampleSize);
    OSStatus convert(const AudioBufferList&, AudioSampleBufferList&, size_t sampleCount);
    size_t regularBufferSize() const { return m_regularBufferSize; }
    bool isRegular() const { return m_selectedConverter == m_regularConverter; }

private:
    size_t m_highBufferSize { 0 };
    size_t m_regularHighBufferSize { 0 };
    size_t m_regularBufferSize { 0 };
    size_t m_regularLowBufferSize { 0 };
    size_t m_lowBufferSize { 0 };

    class Converter {
    public:
        Converter() = default;
        ~Converter();

        OSStatus initialize(const AudioStreamBasicDescription& inputDescription, const AudioStreamBasicDescription& outputDescription);
        operator AudioConverterRef() const { return m_audioConverter; }

    private:
        AudioConverterRef m_audioConverter { nullptr };
    };

    bool m_latencyAdaptationEnabled { true };
    Converter m_lowConverter;
    Converter m_regularConverter;
    Converter m_highConverter;
    AudioConverterRef m_selectedConverter;
};

} // namespace WebCore
