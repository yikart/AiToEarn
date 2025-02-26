/*
 * Copyright (C) 2017-2021 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "ColorComponents.h"
#include "ColorTypes.h"
#include <algorithm>
#include <cmath>
#include <functional>
#include <math.h>

namespace WebCore {

SRGBA<float> premultiplied(const SRGBA<float>&);
SRGBA<float> unpremultiplied(const SRGBA<float>&);

SRGBA<uint8_t> premultipliedFlooring(SRGBA<uint8_t>);
SRGBA<uint8_t> premultipliedCeiling(SRGBA<uint8_t>);
SRGBA<uint8_t> unpremultiplied(SRGBA<uint8_t>);

uint8_t convertPrescaledSRGBAFloatToSRGBAByte(float);

template<typename T> T convertByteAlphaTo(uint8_t);
template<typename T> T convertFloatAlphaTo(float);

template<typename ColorType, typename Functor> auto colorByModifingEachNonAlphaComponent(const ColorType&, Functor&&);

template<typename ColorType> constexpr auto colorWithOverriddenAlpha(const ColorType&, uint8_t overrideAlpha);
template<typename ColorType> auto colorWithOverriddenAlpha(const ColorType&, float overrideAlpha);

template<typename ColorType> constexpr auto invertedColorWithOverriddenAlpha(const ColorType&, uint8_t overrideAlpha);
template<typename ColorType> auto invertedColorWithOverriddenAlpha(const ColorType&, float overrideAlpha);

template<typename ColorType, typename std::enable_if_t<UsesLabModel<ColorType> || UsesLCHModel<ColorType> || UsesOKLabModel<ColorType> || UsesOKLCHModel<ColorType> || UsesHSLModel<ColorType>>* = nullptr> constexpr bool isBlack(const ColorType&);
template<typename ColorType, typename std::enable_if_t<UsesRGBModel<ColorType>>* = nullptr> constexpr bool isBlack(const ColorType&);
template<typename ColorType, typename std::enable_if_t<UsesHWBModel<ColorType>>* = nullptr> constexpr bool isBlack(const ColorType&);
template<WhitePoint W> constexpr bool isBlack(const XYZA<float, W>&);

template<typename ColorType, typename std::enable_if_t<UsesLabModel<ColorType> || UsesLCHModel<ColorType> || UsesHSLModel<ColorType>>* = nullptr> constexpr bool isWhite(const ColorType&);
template<typename ColorType, typename std::enable_if_t<UsesOKLabModel<ColorType> || UsesOKLCHModel<ColorType>>* = nullptr> constexpr bool isWhite(const ColorType&);
template<typename ColorType, typename std::enable_if_t<UsesRGBModel<ColorType> && std::is_same_v<typename ColorType::ComponentType, float>>* = nullptr> constexpr bool isWhite(const ColorType&);
template<typename ColorType, typename std::enable_if_t<UsesRGBModel<ColorType> && std::is_same_v<typename ColorType::ComponentType, uint8_t>>* = nullptr> constexpr bool isWhite(const ColorType&);
template<typename ColorType, typename std::enable_if_t<UsesHWBModel<ColorType>>* = nullptr> constexpr bool isWhite(const ColorType&);
template<WhitePoint W> constexpr bool isWhite(const XYZA<float, W>&);

constexpr uint16_t fastMultiplyBy255(uint16_t);
constexpr uint16_t fastDivideBy255(uint16_t);


inline uint8_t convertPrescaledSRGBAFloatToSRGBAByte(float value)
{
    return std::clamp(std::lround(value), 0l, 255l);
}

template<> constexpr uint8_t convertByteAlphaTo<uint8_t>(uint8_t value)
{
    return value;
}

template<> constexpr float convertByteAlphaTo<float>(uint8_t value)
{
    return value / 255.0f;
}

template<> inline uint8_t convertFloatAlphaTo<uint8_t>(float value)
{
    return std::clamp(std::lround(value * 255.0f), 0l, 255l);
}

template<> inline float convertFloatAlphaTo<float>(float value)
{
    return clampedAlpha(value);
}

template<typename ColorType, typename Functor> auto colorByModifingEachNonAlphaComponent(const ColorType& color, Functor&& functor)
{
    auto components = asColorComponents(color.resolved());
    auto copy = components;
    copy[0] = std::invoke(functor, components[0]);
    copy[1] = std::invoke(functor, components[1]);
    copy[2] = std::invoke(std::forward<Functor>(functor), components[2]);
    return makeFromComponents<ColorType>(copy);
}

template<typename ColorType> constexpr auto colorWithOverriddenAlpha(const ColorType& color, uint8_t overrideAlpha)
{
    auto copy = color.unresolved();
    copy.alpha = convertByteAlphaTo<typename ColorType::ComponentType>(overrideAlpha);
    return copy;
}

template<typename ColorType> auto colorWithOverriddenAlpha(const ColorType& color, float overrideAlpha)
{
    auto copy = color.unresolved();
    copy.alpha = convertFloatAlphaTo<typename ColorType::ComponentType>(overrideAlpha);
    return copy;
}

template<typename ColorType> constexpr auto invertedColorWithOverriddenAlpha(const ColorType& color, uint8_t overrideAlpha)
{
    static_assert(ColorType::Model::isInvertible);

    auto components = asColorComponents(color.resolved());
    auto copy = components;

    for (unsigned i = 0; i < 3; ++i)
        copy[i] = ColorType::Model::componentInfo[i].max - components[i];
    copy[3] = convertByteAlphaTo<typename ColorType::ComponentType>(overrideAlpha);

    return makeFromComponents<ColorType>(copy);
}

template<typename ColorType> auto invertedColorWithOverriddenAlpha(const ColorType& color, float overrideAlpha)
{
    static_assert(ColorType::Model::isInvertible);

    auto components = asColorComponents(color.resolved());
    auto copy = components;

    for (unsigned i = 0; i < 3; ++i)
        copy[i] = ColorType::Model::componentInfo[i].max - components[i];
    copy[3] = convertFloatAlphaTo<typename ColorType::ComponentType>(overrideAlpha);

    return makeFromComponents<ColorType>(copy);
}

template<WhitePoint W> constexpr bool isBlack(const XYZA<float, W>& color)
{
    auto resolvedColor = color.resolved();
    return resolvedColor.y == 0 && resolvedColor.alpha == AlphaTraits<float>::opaque;
}

template<typename ColorType, typename std::enable_if_t<UsesLabModel<ColorType> || UsesLCHModel<ColorType> || UsesOKLabModel<ColorType> || UsesOKLCHModel<ColorType> || UsesHSLModel<ColorType>>*>
constexpr bool isBlack(const ColorType& color)
{
    auto resolvedColor = color.resolved();
    return resolvedColor.lightness == 0 && resolvedColor.alpha == AlphaTraits<float>::opaque;
}

template<typename ColorType, typename std::enable_if_t<UsesRGBModel<ColorType>>*>
constexpr bool isBlack(const ColorType& color)
{
    auto [c1, c2, c3, alpha] = color.resolved();
    return c1 == 0 && c2 == 0 && c3 == 0 && alpha == AlphaTraits<typename ColorType::ComponentType>::opaque;
}

template<typename ColorType, typename std::enable_if_t<UsesHWBModel<ColorType>>*>
constexpr bool isBlack(const ColorType& color)
{
    auto resolvedColor = color.resolved();
    return resolvedColor.blackness == 100 && resolvedColor.alpha == AlphaTraits<float>::opaque;
}

template<WhitePoint W> constexpr bool isWhite(const XYZA<float, W>& color)
{
    auto resolvedColor = color.resolved();
    return resolvedColor.y == 1 && resolvedColor.alpha == AlphaTraits<float>::opaque;
}

template<typename ColorType, typename std::enable_if_t<UsesLabModel<ColorType> || UsesLCHModel<ColorType> || UsesHSLModel<ColorType>>*>
constexpr bool isWhite(const ColorType& color)
{
    auto resolvedColor = color.resolved();
    return resolvedColor.lightness == 100 && resolvedColor.alpha == AlphaTraits<float>::opaque;
}

template<typename ColorType, typename std::enable_if_t<UsesOKLabModel<ColorType> || UsesOKLCHModel<ColorType>>*>
constexpr bool isWhite(const ColorType& color)
{
    auto resolvedColor = color.resolved();
    return resolvedColor.lightness == 1 && resolvedColor.alpha == AlphaTraits<float>::opaque;
}

template<typename ColorType, typename std::enable_if_t<UsesRGBModel<ColorType> && std::is_same_v<typename ColorType::ComponentType, float>>*>
constexpr bool isWhite(const ColorType& color)
{
    auto [c1, c2, c3, alpha] = color.resolved();
    return c1 == 1 && c2 == 1 && c3 == 1 && alpha == AlphaTraits<float>::opaque;
}

template<typename ColorType, typename std::enable_if_t<UsesRGBModel<ColorType> && std::is_same_v<typename ColorType::ComponentType, uint8_t>>*>
constexpr bool isWhite(const ColorType& color)
{
    auto [c1, c2, c3, alpha] = color.resolved();
    return c1 == 255 && c2 == 255 && c3 == 255 && alpha == AlphaTraits<uint8_t>::opaque;
}

template<typename ColorType, typename std::enable_if_t<UsesHWBModel<ColorType>>*>
constexpr bool isWhite(const ColorType& color)
{
    auto resolvedColor = color.resolved();
    return resolvedColor.whiteness == 100 && resolvedColor.alpha == AlphaTraits<float>::opaque;
}

constexpr uint16_t fastMultiplyBy255(uint16_t value)
{
    return (value << 8) - value;
}

constexpr uint16_t fastDivideBy255(uint16_t value)
{
    // While this is an approximate algorithm for division by 255, it gives perfectly accurate results for 16-bit values.
    // FIXME: Since this gives accurate results for 16-bit values, we should get this optimization into compilers like clang.
    uint16_t approximation = value >> 8;
    uint16_t remainder = value - (approximation * 255) + 1;
    return approximation + (remainder >> 8);
}

} // namespace WebCore
