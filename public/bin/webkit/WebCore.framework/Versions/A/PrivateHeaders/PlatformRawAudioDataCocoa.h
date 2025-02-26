/*
 * Copyright (C) 2024 Apple Inc. All rights reserved.
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

#include "CAAudioStreamDescription.h"
#include "PlatformRawAudioData.h"
#include <wtf/Forward.h>

#if ENABLE(WEB_CODECS) && USE(AVFOUNDATION)

typedef struct opaqueCMSampleBuffer *CMSampleBufferRef;
struct AudioStreamBasicDescription;

namespace WebCore {

class MediaSampleAVFObjC;

class PlatformRawAudioDataCocoa final : public PlatformRawAudioData {
public:
    static Ref<PlatformRawAudioData> create(Ref<MediaSampleAVFObjC>&& sample)
    {
        return adoptRef(*new PlatformRawAudioDataCocoa(WTFMove(sample)));
    }
    AudioSampleFormat format() const final;
    size_t sampleRate() const final;
    size_t numberOfChannels() const final;
    size_t numberOfFrames() const final;
    std::optional<uint64_t> duration() const final;
    int64_t timestamp() const final;
    size_t memoryCost() const final;

    constexpr MediaPlatformType platformType() const final { return MediaPlatformType::AVFObjC; }

    const CAAudioStreamDescription& description() const;
    CMSampleBufferRef sampleBuffer() const;

private:
    friend class PlatformRawAudioData;
    PlatformRawAudioDataCocoa(Ref<MediaSampleAVFObjC>&&);
    const AudioStreamBasicDescription& asbd() const;
    bool isInterleaved() const;

    const Ref<MediaSampleAVFObjC> m_sample;
    const CAAudioStreamDescription m_description;
};

}

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::PlatformRawAudioDataCocoa)
static bool isType(const WebCore::PlatformRawAudioData& data) { return data.platformType() == WebCore::MediaPlatformType::AVFObjC; }
SPECIALIZE_TYPE_TRAITS_END()

#endif // ENABLE(WEB_CODECS) && USE(GSTREAMER)
