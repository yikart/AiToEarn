/*
 * Copyright (C) 2020-2021 Apple Inc. All rights reserved.
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

#include "PlatformVideoColorSpace.h"
#include "ScreenDataOverrides.h"
#include <wtf/text/StringView.h>
#include <wtf/text/WTFString.h>
namespace WebCore {

namespace VPConfigurationLevel {
constexpr uint8_t Level_1   = 10;
constexpr uint8_t Level_1_1 = 11;
constexpr uint8_t Level_2   = 20;
constexpr uint8_t Level_2_1 = 21;
constexpr uint8_t Level_3   = 30;
constexpr uint8_t Level_3_1 = 31;
constexpr uint8_t Level_4   = 40;
constexpr uint8_t Level_4_1 = 41;
constexpr uint8_t Level_5   = 50;
constexpr uint8_t Level_5_1 = 51;
constexpr uint8_t Level_5_2 = 52;
constexpr uint8_t Level_6   = 60;
constexpr uint8_t Level_6_1 = 61;
constexpr uint8_t Level_6_2 = 62;
}

namespace VPConfigurationChromaSubsampling {
constexpr uint8_t Subsampling_420_Vertical = 0;
constexpr uint8_t Subsampling_420_Colocated = 1;
constexpr uint8_t Subsampling_422 = 2;
constexpr uint8_t Subsampling_444 = 3;
}

namespace VPConfigurationRange {
constexpr uint8_t VideoRange = 0;
constexpr uint8_t FullRange = 1;
}

// Ref: ISO/IEC 23091-2:2019
namespace VPConfigurationColorPrimaries {
constexpr uint8_t BT_709_6 = 1;
constexpr uint8_t Unspecified = 2;
constexpr uint8_t BT_470_6_M = 4;
constexpr uint8_t BT_470_7_BG = 5;
constexpr uint8_t BT_601_7 = 6;
constexpr uint8_t SMPTE_ST_240 = 7;
constexpr uint8_t Film = 8;
constexpr uint8_t BT_2020_Nonconstant_Luminance = 9;
constexpr uint8_t SMPTE_ST_428_1 = 10;
constexpr uint8_t SMPTE_RP_431_2 = 11;
constexpr uint8_t SMPTE_EG_432_1 = 12;
constexpr uint8_t EBU_Tech_3213_E = 22;
}

// Ref: ISO/IEC 23091-2:2019
namespace VPConfigurationTransferCharacteristics {
constexpr uint8_t BT_709_6 = 1;
constexpr uint8_t Unspecified = 2;
constexpr uint8_t BT_470_6_M = 4;
constexpr uint8_t BT_470_7_BG = 5;
constexpr uint8_t BT_601_7 = 6;
constexpr uint8_t SMPTE_ST_240 = 7;
constexpr uint8_t Linear = 8;
constexpr uint8_t Logrithmic = 9;
constexpr uint8_t Logrithmic_Sqrt = 10;
constexpr uint8_t IEC_61966_2_4 = 11;
constexpr uint8_t BT_1361_0 = 12;
constexpr uint8_t IEC_61966_2_1 = 13;
constexpr uint8_t BT_2020_10bit = 14;
constexpr uint8_t BT_2020_12bit = 15;
constexpr uint8_t SMPTE_ST_2084 = 16;
constexpr uint8_t SMPTE_ST_428_1 = 17;
constexpr uint8_t BT_2100_HLG = 18;
}

namespace VPConfigurationMatrixCoefficients {
constexpr uint8_t Identity = 0;
constexpr uint8_t BT_709_6 = 1;
constexpr uint8_t Unspecified = 2;
constexpr uint8_t FCC = 4;
constexpr uint8_t BT_470_7_BG = 5;
constexpr uint8_t BT_601_7 = 6;
constexpr uint8_t SMPTE_ST_240 = 7;
constexpr uint8_t YCgCo = 8;
constexpr uint8_t BT_2020_Nonconstant_Luminance = 9;
constexpr uint8_t BT_2020_Constant_Luminance = 10;
constexpr uint8_t SMPTE_ST_2085 = 11;
constexpr uint8_t Chromacity_Constant_Luminance = 12;
constexpr uint8_t Chromacity_Nonconstant_Luminance = 13;
constexpr uint8_t BT_2100_ICC = 14;
}

struct VPCodecConfigurationRecord {
    String codecName;
    uint8_t profile { 0 };
    uint8_t level { VPConfigurationLevel::Level_1 };
    uint8_t bitDepth { 8 };
    uint8_t chromaSubsampling { VPConfigurationChromaSubsampling::Subsampling_420_Colocated };
    uint8_t videoFullRangeFlag { VPConfigurationRange::VideoRange };
    uint8_t colorPrimaries { VPConfigurationColorPrimaries::BT_709_6 };
    uint8_t transferCharacteristics { VPConfigurationTransferCharacteristics::BT_709_6 };
    uint8_t matrixCoefficients { VPConfigurationMatrixCoefficients::BT_709_6 };
};

WEBCORE_EXPORT std::optional<VPCodecConfigurationRecord> parseVPCodecParameters(StringView codecString);
WEBCORE_EXPORT String createVPCodecParametersString(const VPCodecConfigurationRecord&);
std::optional<VPCodecConfigurationRecord> createVPCodecConfigurationRecordFromVPCC(std::span<const uint8_t>);
void setConfigurationColorSpaceFromVP9ColorSpace(VPCodecConfigurationRecord&, uint8_t);

enum class VPXCodec : uint8_t { Vp8, Vp9 };
std::optional<VPCodecConfigurationRecord> vPCodecConfigurationRecordFromVPXByteStream(VPXCodec, std::span<const uint8_t>);
Vector<uint8_t> vpcCFromVPCodecConfigurationRecord(const VPCodecConfigurationRecord&);

PlatformVideoColorSpace colorSpaceFromVPCodecConfigurationRecord(const VPCodecConfigurationRecord&);

}
