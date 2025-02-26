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

#include <wtf/OptionSet.h>
#include <wtf/Seconds.h>

namespace WTF {
class TextStream;
}

namespace WebCore {

using FramesPerSecond = unsigned;

enum class ThrottlingReason : uint8_t {
    VisuallyIdle                    = 1 << 0,
    OutsideViewport                 = 1 << 1,
    LowPowerMode                    = 1 << 2,
    NonInteractedCrossOriginFrame   = 1 << 3,
    ThermalMitigation               = 1 << 4,
    AggressiveThermalMitigation     = 1 << 5,
};

// Allow a little more than 60fps to make sure we can at least hit that frame rate.
constexpr const Seconds FullSpeedAnimationInterval { 15_ms };
// Allow a little more than 30fps to make sure we can at least hit that frame rate.
constexpr const Seconds HalfSpeedThrottlingAnimationInterval { 30_ms };
constexpr const Seconds AggressiveThrottlingAnimationInterval { 10_s };
constexpr const int IntervalThrottlingFactor { 2 };

constexpr const FramesPerSecond FullSpeedFramesPerSecond = 60;
constexpr const FramesPerSecond HalfSpeedThrottlingFramesPerSecond = 30;

WEBCORE_EXPORT FramesPerSecond framesPerSecondNearestFullSpeed(FramesPerSecond);

// This will return std::nullopt if throttling results in a frequency < 1fps.
WEBCORE_EXPORT std::optional<FramesPerSecond> preferredFramesPerSecond(OptionSet<ThrottlingReason>, std::optional<FramesPerSecond> nominalFramesPerSecond, bool preferFrameRatesNear60FPS);

WEBCORE_EXPORT Seconds preferredFrameInterval(OptionSet<ThrottlingReason>, std::optional<FramesPerSecond> nominalFramesPerSecond, bool preferFrameRatesNear60FPS);

WEBCORE_EXPORT FramesPerSecond preferredFramesPerSecondFromInterval(Seconds);

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const OptionSet<ThrottlingReason>&);

} // namespace WebCore
