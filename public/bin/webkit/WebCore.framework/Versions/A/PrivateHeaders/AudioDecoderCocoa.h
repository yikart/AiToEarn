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

#if ENABLE(WEB_CODECS) && USE(AVFOUNDATION)

#include "AudioDecoder.h"
#include "AudioStreamDescription.h"
#include "FourCC.h"
#include <wtf/Expected.h>
#include <wtf/TZoneMalloc.h>

namespace WTF {
class WorkQueue;
}

namespace WebCore {

class InternalAudioDecoderCocoa;

class AudioDecoderCocoa final : public AudioDecoder {
    WTF_MAKE_TZONE_ALLOCATED(AudioDecoderCocoa);

public:
    static Ref<CreatePromise> create(const String& codecName, const Config&, OutputCallback&&);

    ~AudioDecoderCocoa();

    static Expected<std::pair<FourCharCode, std::optional<AudioStreamDescription::PCMFormat>>, String> isCodecSupported(const StringView&);

    static WTF::WorkQueue& queueSingleton();

private:
    explicit AudioDecoderCocoa(OutputCallback&&);
    Ref<DecodePromise> decode(EncodedData&&) final;
    Ref<GenericPromise> flush() final;
    void reset() final;
    void close() final;

    const Ref<InternalAudioDecoderCocoa> m_internalDecoder;
};

}

#endif // ENABLE(WEB_CODECS) && USE(AVFOUNDATION)
