/*
 * Copyright (C) 2017 Apple Inc.  All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#if USE(CG)
typedef struct CGImageSource* CGImageSourceRef;
#endif

namespace WebCore {

// There are four subsampling levels: 0 = 1x, 1 = 0.5x, 2 = 0.25x, 3 = 0.125x.
enum class SubsamplingLevel {
    First = 0,
    Default = First,
    Level0 = First,
    Level1,
    Level2,
    Level3,
    Last = Level3,
    Max
};

inline SubsamplingLevel& operator++(SubsamplingLevel& subsamplingLevel)
{
    subsamplingLevel = static_cast<SubsamplingLevel>(static_cast<int>(subsamplingLevel) + 1);
    ASSERT(subsamplingLevel <= SubsamplingLevel::Max);
    return subsamplingLevel;
}

typedef int RepetitionCount;

enum {
    RepetitionCountNone = 0,
    RepetitionCountOnce = 1,
    RepetitionCountInfinite = -1,
};

enum class AlphaOption {
    Premultiplied,
    NotPremultiplied
};

enum class GammaAndColorProfileOption {
    Applied,
    Ignored
};

enum class ImageAnimatingState : bool { No, Yes };

enum class EncodedDataStatus {
    Error,
    Unknown,
    TypeAvailable,
    SizeAvailable,
    Complete
};

enum class DecodingStatus {
    Invalid,
    Partial,
    Complete,
    Decoding
};

enum class ImageDrawResult {
    DidNothing,
    DidRequestDecoding,
    DidRecord,
    DidDraw
};

enum class ShowDebugBackground : bool {
    No,
    Yes
};

enum class AllowImageSubsampling : bool {
    No,
    Yes
};

struct Headroom {
    constexpr Headroom(float headroom)
    {
        this->headroom = headroom;
    }

    constexpr operator float() const { return headroom; }

    friend constexpr bool operator==(const Headroom&, const Headroom&) = default;

    static const Headroom FromImage;
    static const Headroom None;

    float headroom;
};

constexpr const Headroom Headroom::FromImage = { 0 };
constexpr const Headroom Headroom::None = { 1 };

#if USE(SKIA)
enum class StrictImageClamping : bool {
    No,
    Yes
};
#endif

}
