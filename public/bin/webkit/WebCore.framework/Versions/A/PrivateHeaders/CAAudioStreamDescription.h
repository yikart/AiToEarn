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

#include "AudioStreamDescription.h"
#include <CoreAudio/CoreAudioTypes.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

WEBCORE_EXPORT bool operator==(const AudioStreamBasicDescription&, const AudioStreamBasicDescription&);

class WEBCORE_EXPORT CAAudioStreamDescription final : public AudioStreamDescription {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(CAAudioStreamDescription, WEBCORE_EXPORT);
public:
    CAAudioStreamDescription(const AudioStreamBasicDescription&);
    enum class IsInterleaved : bool {
        No,
        Yes
    };
    CAAudioStreamDescription(double sampleRate, uint32_t channels, PCMFormat, IsInterleaved);
    ~CAAudioStreamDescription();

    const PlatformDescription& platformDescription() const final;

    PCMFormat format() const final;

    double sampleRate() const final;
    bool isPCM() const final;
    bool isInterleaved() const final;
    bool isSignedInteger() const final;
    bool isFloat() const final;
    bool isNativeEndian() const final;

    uint32_t numberOfInterleavedChannels() const final;
    uint32_t numberOfChannelStreams() const final;
    uint32_t numberOfChannels() const final;
    uint32_t sampleWordSize() const final;
    uint32_t bytesPerFrame() const;
    uint32_t bytesPerPacket() const;
    uint32_t formatFlags() const;

    bool operator==(const CAAudioStreamDescription& other) const { return operator==(static_cast<const AudioStreamDescription&>(other)); }
    bool operator==(const AudioStreamBasicDescription&) const;
    bool operator==(const AudioStreamDescription&) const;

    const AudioStreamBasicDescription& streamDescription() const;
    AudioStreamBasicDescription& streamDescription();

private:
    AudioStreamBasicDescription m_streamDescription;
    mutable PlatformDescription m_platformDescription;
    mutable PCMFormat m_format { None };
};

inline CAAudioStreamDescription toCAAudioStreamDescription(const AudioStreamDescription& description)
{
    ASSERT(description.platformDescription().type == PlatformDescription::CAAudioStreamBasicType);
    return CAAudioStreamDescription(*std::get<const AudioStreamBasicDescription*>(description.platformDescription().description));
}

}
