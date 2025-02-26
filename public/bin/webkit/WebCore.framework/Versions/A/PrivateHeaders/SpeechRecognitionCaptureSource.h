/*
 * Copyright (C) 2020 Apple Inc. All rights reserved.
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

#include "SpeechRecognitionCaptureSourceImpl.h"
#include "SpeechRecognitionConnectionClientIdentifier.h"
#include <wtf/TZoneMalloc.h>

namespace WTF {
class MediaTime;
}

namespace WebCore {

class AudioStreamDescription;
class PlatformAudioData;
class SpeechRecognitionCaptureSourceImpl;
class SpeechRecognitionUpdate;

class SpeechRecognitionCaptureSource {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(SpeechRecognitionCaptureSource, WEBCORE_EXPORT);
public:
    SpeechRecognitionCaptureSource() = default;
    ~SpeechRecognitionCaptureSource() = default;
    WEBCORE_EXPORT void mute();

#if ENABLE(MEDIA_STREAM)
    using DataCallback = Function<void(const WTF::MediaTime&, const PlatformAudioData&, const AudioStreamDescription&, size_t)>;
    using StateUpdateCallback = Function<void(const SpeechRecognitionUpdate&)>;
    SpeechRecognitionCaptureSource(SpeechRecognitionConnectionClientIdentifier, DataCallback&&, StateUpdateCallback&&, Ref<RealtimeMediaSource>&&);
    WEBCORE_EXPORT static std::optional<WebCore::CaptureDevice> findCaptureDevice();
    WEBCORE_EXPORT static CaptureSourceOrError createRealtimeMediaSource(const CaptureDevice&, PageIdentifier);
#endif

private:
#if ENABLE(MEDIA_STREAM)
    std::unique_ptr<SpeechRecognitionCaptureSourceImpl> m_impl;
#endif
};

} // namespace WebCore
