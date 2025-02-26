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

#include <AudioToolbox/AudioToolbox.h>
#include <CoreAudio/CoreAudioTypes.h>
#include <wtf/ThreadSafeWeakPtr.h>

namespace WebCore {

class AudioMediaStreamTrackRendererUnit;
class CAAudioStreamDescription;

class AudioMediaStreamTrackRendererInternalUnit {
public:
    virtual ~AudioMediaStreamTrackRendererInternalUnit() = default;

    virtual void ref() const = 0;
    virtual void deref() const = 0;

    class Client : public ThreadSafeRefCountedAndCanMakeThreadSafeWeakPtr<Client> {
    public:
        virtual ~Client() = default;

        virtual OSStatus render(size_t sampleCount, AudioBufferList&, uint64_t sampleTime, double hostTime, AudioUnitRenderActionFlags&) = 0;
        virtual void reset() = 0;
    };
    WEBCORE_EXPORT static Ref<AudioMediaStreamTrackRendererInternalUnit> create(const String&, Client&);

    using CreateFunction = Ref<AudioMediaStreamTrackRendererInternalUnit>(*)(const String&, AudioMediaStreamTrackRendererInternalUnit::Client&);
    WEBCORE_EXPORT static void setCreateFunction(CreateFunction);
    virtual void start() = 0;
    virtual void stop() = 0;
    virtual void close() { };
    virtual void retrieveFormatDescription(CompletionHandler<void(std::optional<CAAudioStreamDescription>)>&&) = 0;
    virtual void setLastDeviceUsed(const String&) { }
};

}

#endif // ENABLE(MEDIA_STREAM)
