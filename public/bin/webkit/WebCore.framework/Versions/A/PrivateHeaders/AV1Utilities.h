/*
 * Copyright (C) 2022 Apple Inc. All rights reserved.
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

#include "SharedBuffer.h"
#include <JavaScriptCore/DataView.h>
#include <wtf/EnumTraits.h>
#include <wtf/text/StringView.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class SharedBuffer;

enum class AV1ConfigurationProfile : uint8_t {
    Main         = 0,
    High         = 1,
    Professional = 2,
};

enum class AV1ConfigurationLevel : uint8_t {
    Level_2_0 = 0,
    Level_2_1 = 1,
    Level_2_2 = 2,
    Level_2_3 = 3,
    Level_3_0 = 4,
    Level_3_1 = 5,
    Level_3_2 = 6,
    Level_3_3 = 7,
    Level_4_0 = 8,
    Level_4_1 = 9,
    Level_4_2 = 10,
    Level_4_3 = 11,
    Level_5_0 = 12,
    Level_5_1 = 13,
    Level_5_2 = 14,
    Level_5_3 = 15,
    Level_6_0 = 16,
    Level_6_1 = 17,
    Level_6_2 = 18,
    Level_6_3 = 19,
    Level_7_0 = 20,
    Level_7_1 = 21,
    Level_7_2 = 22,
    Level_7_3 = 23,
};

enum class AV1ConfigurationTier : uint8_t {
    Main = 0,
    High = 1,
};

enum class AV1ConfigurationChromaSubsampling : uint8_t {
    Subsampling_444            = 000,
    Subsampling_422            = 100,
    Subsampling_420_Unknown    = 110,
    Subsampling_420_Vertical   = 111,
    Subsampling_420_Colocated  = 112,
};

enum class AV1ConfigurationRange : uint8_t {
    VideoRange = 0,
    FullRange = 1,
};

// Ref: ISO/IEC 23091-2:2019
enum class AV1ConfigurationColorPrimaries : uint8_t {
    BT_709_6 = 1,
    Unspecified = 2,
    BT_470_6_M = 4,
    BT_470_7_BG = 5,
    BT_601_7 = 6,
    SMPTE_ST_240 = 7,
    Film = 8,
    BT_2020_Nonconstant_Luminance = 9,
    SMPTE_ST_428_1 = 10,
    SMPTE_RP_431_2 = 11,
    SMPTE_EG_432_1 = 12,
    EBU_Tech_3213_E = 22,
};

// Ref: ISO/IEC 23091-4:2019
enum class AV1ConfigurationTransferCharacteristics : uint8_t {
    BT_709_6 = 1,
    Unspecified = 2,
    BT_470_6_M = 4,
    BT_470_7_BG = 5,
    BT_601_7 = 6,
    SMPTE_ST_240 = 7,
    Linear = 8,
    Logrithmic = 9,
    Logrithmic_Sqrt = 10,
    IEC_61966_2_4 = 11,
    BT_1361_0 = 12,
    IEC_61966_2_1 = 13,
    BT_2020_10bit = 14,
    BT_2020_12bit = 15,
    SMPTE_ST_2084 = 16,
    SMPTE_ST_428_1 = 17,
    BT_2100_HLG = 18,
};

enum class AV1ConfigurationMatrixCoefficients : uint8_t {
    Identity = 0,
    BT_709_6 = 1,
    Unspecified = 2,
    FCC = 4,
    BT_470_7_BG = 5,
    BT_601_7 = 6,
    SMPTE_ST_240 = 7,
    YCgCo = 8,
    BT_2020_Nonconstant_Luminance = 9,
    BT_2020_Constant_Luminance = 10,
    SMPTE_ST_2085 = 11,
    Chromacity_Nonconstant_Luminance = 12,
    Chromacity_Constant_Luminance = 13,
    BT_2100_ICC = 14,
};

struct AV1CodecConfigurationRecord {
    static constexpr AV1ConfigurationProfile defaultProfile { AV1ConfigurationProfile::Main };
    static constexpr AV1ConfigurationLevel defaultLevel { AV1ConfigurationLevel::Level_2_0 };
    static constexpr AV1ConfigurationTier defaultTier { AV1ConfigurationTier::Main };
    static constexpr uint8_t defaultBitDepth { 8 };
    static constexpr uint8_t defaultMonochrome { 0 };
    static constexpr uint8_t defaultChromaSubsampling { static_cast<uint8_t>(AV1ConfigurationChromaSubsampling::Subsampling_420_Unknown) };
    static constexpr uint8_t defaultColorPrimaries { static_cast<uint8_t>(AV1ConfigurationColorPrimaries::BT_709_6) };
    static constexpr uint8_t defaultTransferCharacteristics { static_cast<uint8_t>(AV1ConfigurationTransferCharacteristics::BT_709_6) };
    static constexpr uint8_t defaultMatrixCoefficients { static_cast<uint8_t>(AV1ConfigurationMatrixCoefficients::BT_709_6) };
    static constexpr AV1ConfigurationRange defaultVideoFullRangeFlag { AV1ConfigurationRange::VideoRange };

    String codecName;
    AV1ConfigurationProfile profile { defaultProfile };
    AV1ConfigurationLevel level { defaultLevel };
    AV1ConfigurationTier tier { defaultTier };
    uint8_t bitDepth { defaultBitDepth };
    uint8_t monochrome { defaultMonochrome };
    uint8_t chromaSubsampling { defaultChromaSubsampling };
    uint8_t colorPrimaries { defaultColorPrimaries };
    uint8_t transferCharacteristics { defaultTransferCharacteristics };
    uint8_t matrixCoefficients { defaultMatrixCoefficients };
    AV1ConfigurationRange videoFullRangeFlag { defaultVideoFullRangeFlag };
};

struct MediaCapabilitiesInfo;
struct VideoConfiguration;
struct VideoInfo;

WEBCORE_EXPORT std::optional<AV1CodecConfigurationRecord> parseAV1CodecParameters(StringView codecString);
WEBCORE_EXPORT String createAV1CodecParametersString(const AV1CodecConfigurationRecord&);

WEBCORE_EXPORT bool validateAV1ConfigurationRecord(const AV1CodecConfigurationRecord&);
WEBCORE_EXPORT bool validateAV1PerLevelConstraints(const AV1CodecConfigurationRecord&, const VideoConfiguration&);

std::optional<AV1CodecConfigurationRecord> parseAV1DecoderConfigurationRecord(const SharedBuffer&);

}
