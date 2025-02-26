/*
 * Copyright (C) 2022 Apple Inc. All rights reserved.
 * Copyright (C) 2023 Igalia S.L
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

#if ENABLE(WEB_CODECS)

#include "AudioSampleFormat.h"
#include "BufferSource.h"
#include "ContextDestructionObserver.h"
#include "WebCodecsAudioInternalData.h"
#include <wtf/RefCounted.h>

namespace WebCore {

class PlatformRawAudioData;
template<typename> class ExceptionOr;

class WebCodecsAudioData : public RefCounted<WebCodecsAudioData>, public ContextDestructionObserver {
public:
    ~WebCodecsAudioData();

    struct Init {
        AudioSampleFormat format { AudioSampleFormat::U8 };
        float sampleRate;
        int64_t timestamp { 0 };

        BufferSource data;
        size_t numberOfFrames;
        size_t numberOfChannels;
    };

    static ExceptionOr<Ref<WebCodecsAudioData>> create(ScriptExecutionContext&, Init&&);
    static Ref<WebCodecsAudioData> create(ScriptExecutionContext&, Ref<PlatformRawAudioData>&&);
    static Ref<WebCodecsAudioData> create(ScriptExecutionContext& context, WebCodecsAudioInternalData&& data) { return adoptRef(*new WebCodecsAudioData(context, WTFMove(data))); }

    std::optional<AudioSampleFormat> format() const;
    float sampleRate() const;
    size_t numberOfFrames() const;
    size_t numberOfChannels() const;
    std::optional<uint64_t> duration();
    int64_t timestamp() const;

    struct CopyToOptions {
        size_t planeIndex;
        std::optional<size_t> frameOffset { 0 };
        std::optional<size_t> frameCount;
        std::optional<AudioSampleFormat> format;
    };
    ExceptionOr<size_t> allocationSize(const CopyToOptions&);

    ExceptionOr<void> copyTo(BufferSource&&, CopyToOptions&&);
    ExceptionOr<Ref<WebCodecsAudioData>> clone(ScriptExecutionContext&);
    void close();

    bool isDetached() const { return m_isDetached; }

    const WebCodecsAudioInternalData& data() const { return m_data; }

    size_t memoryCost() const { return m_data.memoryCost(); }

private:
    explicit WebCodecsAudioData(ScriptExecutionContext&);
    WebCodecsAudioData(ScriptExecutionContext&, WebCodecsAudioInternalData&&);

    WebCodecsAudioInternalData m_data;
    bool m_isDetached { false };
};

} // namespace WebCore

#endif
