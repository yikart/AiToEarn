/*
 * Copyright (C) 2015-2020 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE COMPUTER, INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE COMPUTER, INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. 
 */

#pragma once

#if ENABLE(WEB_AUDIO)

#include "CAAudioStreamDescription.h"
#include "WebAudioSourceProvider.h"
#include <CoreAudio/CoreAudioTypes.h>
#include <wtf/Lock.h>
#include <wtf/RefCounted.h>
#include <wtf/RefPtr.h>

typedef struct AudioBufferList AudioBufferList;
typedef struct OpaqueAudioConverter* AudioConverterRef;
typedef struct AudioStreamBasicDescription AudioStreamBasicDescription;
typedef const struct opaqueCMFormatDescription *CMFormatDescriptionRef;
typedef struct opaqueCMSampleBuffer *CMSampleBufferRef;

namespace WTF {
class LoggerHelper;
}

namespace WebCore {

class AudioSampleDataSource;
class CAAudioStreamDescription;
class PlatformAudioData;
class WebAudioBufferList;

class WEBCORE_EXPORT WebAudioSourceProviderCocoa
    : public WebAudioSourceProvider {
public:
    WebAudioSourceProviderCocoa();
    ~WebAudioSourceProviderCocoa();

protected:
    void receivedNewAudioSamples(const PlatformAudioData&, const AudioStreamDescription&, size_t);

        void setPollSamplesCount(size_t);

private:
    virtual void hasNewClient(AudioSourceProviderClient*) = 0;
#if !RELEASE_LOG_DISABLED
    virtual WTF::LoggerHelper& loggerHelper() = 0;
#endif

    // AudioSourceProvider
    void provideInput(AudioBus*, size_t) final;
    void setClient(WeakPtr<AudioSourceProviderClient>&&) final;

    void prepare(const AudioStreamBasicDescription&);

    Lock m_lock;
    WeakPtr<AudioSourceProviderClient> m_client;

    std::optional<CAAudioStreamDescription> m_inputDescription;
    std::optional<CAAudioStreamDescription> m_outputDescription;
    std::unique_ptr<WebAudioBufferList> m_audioBufferList;
    RefPtr<AudioSampleDataSource> m_dataSource;

    size_t m_pollSamplesCount { 3 };
    uint64_t m_writeCount { 0 };
    uint64_t m_readCount { 0 };
};

inline void WebAudioSourceProviderCocoa::setPollSamplesCount(size_t count)
{
    m_pollSamplesCount = count;
}

}

#endif // ENABLE(WEB_AUDIO)
