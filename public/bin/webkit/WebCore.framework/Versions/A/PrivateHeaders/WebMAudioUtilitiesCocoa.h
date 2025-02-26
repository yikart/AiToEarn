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

#if PLATFORM(COCOA)

#include <wtf/RefPtr.h>
#include <wtf/Vector.h>

struct AudioStreamBasicDescription;

namespace WebCore {

struct AudioInfo;
class SharedBuffer;

WEBCORE_EXPORT bool isVorbisDecoderAvailable();
WEBCORE_EXPORT bool registerVorbisDecoderIfNeeded();
static constexpr size_t kVorbisMinimumFrameDataSize = 1;
RefPtr<AudioInfo> createVorbisAudioInfo(std::span<const uint8_t>);

struct OpusCookieContents {
    uint8_t version { 0 };
    uint8_t channelCount { 0 };
    uint16_t preSkip { 0 };
    uint32_t sampleRate { 0 };
    int16_t outputGain { 0 };
    uint8_t mappingFamily { 0 };
    uint8_t config { 0 };
    Seconds frameDuration { 0_s };
    int32_t bandwidth { 0 };
    uint8_t framesPerPacket { 0 };
    bool isVBR { false };
    bool hasPadding { false };
#if HAVE(AUDIOFORMATPROPERTY_VARIABLEPACKET_SUPPORTED)
    RefPtr<SharedBuffer> cookieData;
#endif
};

WEBCORE_EXPORT bool isOpusDecoderAvailable();
WEBCORE_EXPORT bool registerOpusDecoderIfNeeded();
static constexpr size_t kOpusHeaderSize = 19;
static constexpr size_t kOpusMinimumFrameDataSize = 2;
std::optional<OpusCookieContents> parseOpusPrivateData(std::span<const uint8_t> privateData, std::span<const uint8_t> frameData);
bool parseOpusTOCData(std::span<const uint8_t> frameData, OpusCookieContents&);
RefPtr<AudioInfo> createOpusAudioInfo(const OpusCookieContents&);
Vector<uint8_t> createOpusPrivateData(const AudioStreamBasicDescription&, uint16_t preSkip = 0);

}

#endif // && PLATFORM(COCOA)
