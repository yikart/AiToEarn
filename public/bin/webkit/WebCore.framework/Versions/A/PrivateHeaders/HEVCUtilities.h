/*
 * Copyright (C) 2018-2021 Apple Inc. All rights reserved.
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

#include <optional>
#include <wtf/Forward.h>
#include <wtf/Vector.h>

namespace WebCore {

class SharedBuffer;
struct FourCC;

struct AVCParameters {
    uint8_t profileIDC { 0 };
    uint8_t constraintsFlags { 0 };
    uint8_t levelIDC { 0 };
};

WEBCORE_EXPORT std::optional<AVCParameters> parseAVCCodecParameters(StringView);
WEBCORE_EXPORT std::optional<AVCParameters> parseAVCDecoderConfigurationRecord(const SharedBuffer&);
WEBCORE_EXPORT String createAVCCodecParametersString(const AVCParameters&);

struct HEVCParameters {
    enum class Codec { Hev1, Hvc1 } codec { Codec::Hvc1 };
    uint16_t generalProfileSpace { 0 };
    uint16_t generalProfileIDC { 0 };
    uint32_t generalProfileCompatibilityFlags { 0 };
    uint8_t generalTierFlag { 0 };
    Vector<unsigned char, 6> generalConstraintIndicatorFlags { 0, 0, 0, 0, 0, 0 };
    uint16_t generalLevelIDC { 0 };
};

WEBCORE_EXPORT std::optional<HEVCParameters> parseHEVCCodecParameters(StringView);
WEBCORE_EXPORT std::optional<HEVCParameters> parseHEVCDecoderConfigurationRecord(FourCC, const SharedBuffer&);
WEBCORE_EXPORT String createHEVCCodecParametersString(const HEVCParameters&);

struct DoViParameters {
    enum class Codec { AVC1, AVC3, HEV1, HVC1 } codec { Codec::HVC1 };
    uint16_t bitstreamProfileID { 0 };
    uint16_t bitstreamLevelID { 0 };
};

WEBCORE_EXPORT std::optional<DoViParameters> parseDoViCodecParameters(StringView);
WEBCORE_EXPORT std::optional<DoViParameters> parseDoViDecoderConfigurationRecord(const SharedBuffer&);
WEBCORE_EXPORT String createDoViCodecParametersString(const DoViParameters&);

}
