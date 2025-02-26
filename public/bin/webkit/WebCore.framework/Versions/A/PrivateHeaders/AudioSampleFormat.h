/*
 * Copyright (C) 2022-2024 Apple Inc. All rights reserved.
 * Copyright (C) 2023 Igalia S.L
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

#include <algorithm>
#include <limits>

namespace WebCore {

enum class AudioSampleFormat {
    U8,
    S16,
    S32,
    F32,
    U8Planar,
    S16Planar,
    S32Planar,
    F32Planar,
};

namespace detail {

// Utility methods to convert one data type to another.
template <typename T>
constexpr float maxAsFloat()
{
    return static_cast<float>(std::numeric_limits<T>::max());
}

template <typename T>
constexpr float maxPlus1AsFloat()
{
    return -static_cast<float>(std::numeric_limits<T>::lowest());
}

template <typename T>
constexpr float lowestAsFloat()
{
    return static_cast<float>(std::numeric_limits<T>::lowest());
}

// The bias value for an audio sample type is the value that often corresponds to the middle of the range
// (but for ints, this range is not symmetrical). An audio buffer comprised only of values equal to the bias value is silent.
// Operation clips the values to be between [-1, 1] inclusive.
// The operation is done in such a way that the value of +1 can be achieved from an int. e.g the lowest representable int will be converted to -1, and the maximum to 1.
template <typename T, typename TExtreme = T>
inline float divideWithBiasAndClamp(T value, auto bias)
{
    return std::clamp((static_cast<float>(value) - bias) / ((value < bias) ? maxPlus1AsFloat<TExtreme>() : maxAsFloat<TExtreme>()), -1.0f, 1.0f);
}

template <typename T>
inline T floatToAudioSample(float value)
{
    if constexpr (std::is_same_v<float, T>)
        return value;
    else if constexpr (std::is_same_v<T, uint8_t>)
        return static_cast<T>(std::clamp((value + 1.0f) * 128.0f, lowestAsFloat<T>(), maxAsFloat<T>()));
    else if constexpr (std::is_same_v<T, int16_t>)
        return static_cast<T>(std::clamp(value * maxPlus1AsFloat<T>(), lowestAsFloat<T>(), maxAsFloat<T>()));
    else if constexpr (std::is_same_v<T, int32_t>) {
        // We can't use divideWithBiasAndClamp here as a float32 only have 24 bits mantissa and rounding conversion causes error.
        // So we need to handle this case slightly differently than the others.
        if (value >= 0.0f) {
            if (value >= 1.0f)
                return std::numeric_limits<T>::max();
            // A 32-bits float can't represent int32_max (causing compilation error), so extend to a double
            constexpr double max = static_cast<double>(std::numeric_limits<T>::max());
            return static_cast<T>(value * max);
        }
        if (value <= -1.0f)
            return std::numeric_limits<T>::lowest();
        // A float32 would do here, but as in the positive case we upconvert to a double first, to maintain consistency, upconvert to a double first too.
        constexpr double magnitudeNeg = -1.0f * std::numeric_limits<T>::lowest();
        return static_cast<T>(value * magnitudeNeg);
    }
}

template <typename T>
inline T uint8ToAudioSample(uint8_t value)
{
    // uint8_t audio has a range of [0, 255] with a bias value of 128
    // https://w3c.github.io/webcodecs/#bias-value
    if constexpr (std::is_same_v<T, uint8_t>)
        return value;
    else if constexpr (std::is_same_v<T, int16_t>)
        return static_cast<int16_t>((value << 8) - (1 << 15));
    else if constexpr (std::is_same_v<T, int32_t>)
        return static_cast<int32_t>((value << 24) - (1 << 31));
    else if constexpr (std::is_same_v<T, float>)
        return divideWithBiasAndClamp<uint8_t, int8_t>(value, 128);
}

template <typename T>
inline T int16ToAudioSample(int16_t value)
{
    if constexpr (std::is_same_v<T, uint8_t>)
        return static_cast<uint8_t>((value >> 8) + 128);
    else if constexpr (std::is_same_v<T, int16_t>)
        return value;
    else if constexpr (std::is_same_v<T, int32_t>)
        return value << 16;
    else if constexpr (std::is_same_v<T, float>)
        return divideWithBiasAndClamp(value, 0);
}

template <typename T>
inline T int32ToAudioSample(int32_t value)
{
    if constexpr (std::is_same_v<T, uint8_t>)
        return static_cast<uint8_t>((value >> 24) + 128);
    else if constexpr (std::is_same_v<T, int16_t>)
        return value >> 16;
    else if constexpr (std::is_same_v<T, int32_t>)
        return value;
    else if constexpr (std::is_same_v<T, float>)
        return divideWithBiasAndClamp(value, 0);
}

} // namespace detail

template <typename D, typename S>
inline D convertAudioSample(S source)
{
    if constexpr (std::is_same_v<S, D> && std::is_same_v<D, float>)
        return std::clamp(source, -1.0f, 1.0f);
    if constexpr (std::is_same_v<S, D>)
        return source;
    else if constexpr (std::is_same_v<S, uint8_t>)
        return detail::uint8ToAudioSample<D>(source);
    else if constexpr (std::is_same_v<S, int16_t>)
        return detail::int16ToAudioSample<D>(source);
    else if constexpr (std::is_same_v<S, int32_t>)
        return detail::int32ToAudioSample<D>(source);
    else if constexpr (std::is_same_v<S, float>)
        return detail::floatToAudioSample<D>(source);
    // This doesn't return anything on purpose. It will cause a compilation error if used with unsupported types.
}

} // namespace WebCore
