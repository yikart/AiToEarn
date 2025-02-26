/*
 * Copyright (C) 2024 Apple Inc. All rights reserved.
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

#include "CSSPrimitiveNumericTypes+EvaluateCalc.h"
#include "CSSPrimitiveNumericTypes.h"
#include "CSSValueKeywords.h"
#include "Color.h"
#include "ColorTypes.h"
#include "StylePrimitiveNumericTypes.h"
#include <optional>
#include <variant>
#include <wtf/Brigand.h>
#include <wtf/OptionSet.h>
#include <wtf/text/ASCIILiteral.h>

namespace WebCore {

enum class CSSColorFunctionSyntax { Legacy, Modern };
enum class CSSColorFunctionForm { Relative, Absolute };

template<typename... Ts> struct CSSColorComponent {
    using ResultTypeList = brigand::list<Ts...>;
    using Result = CSS::VariantOrSingle<ResultTypeList>;

    // Symbol used to represent component for relative color form.
    CSSValueID symbol;

    // The range parsed <number> and <percentage> values are clamped to
    // after a multiplier has been applied.
    double min = -std::numeric_limits<double>::infinity();
    double max = std::numeric_limits<double>::infinity();

    // The value parsed <number> values are multiplied by for normalization to typed-color value.
    double numberMultiplier = 1.0;

    // The value parsed <percentage> values are multiplied by for normalization to <number>.
    double percentMultiplier = 1.0 / 100.0;

    // Value the corresponding origin color component is multiplied by
    // for use as a symbol for relative color form.
    double symbolMultiplier = 1.0;

    // Component type for normalization. Angles get normalized using modular
    // arithmetic, numbers get normalized using clamping.
    ColorComponentType type = ColorComponentType::Number;
};

// e.g. for GetComponent<ColorRGBFunction<SRGB<float>>, 2> -> CSSColorComponent<CSS::Percentage<>, CSS::Number<>, CSS::None>
template<typename Descriptor, unsigned Index>
using GetComponent = std::decay_t<decltype(std::get<Index>(Descriptor::components))>;

// e.g. for GetComponentResult<ColorRGBFunction<SRGB<float>>, 2> -> std::variant<CSS::Percentage<>, CSS::Number<>, CSS::None>
template<typename Descriptor, unsigned Index>
using GetComponentResult = typename GetComponent<Descriptor, Index>::Result;

// e.g. for GetComponentResultTypeList<ColorRGBFunction<SRGB<float>>, 2> -> brigand::list<CSS::Percentage<>, CSS::Number<>, CSS::None>
template<typename Descriptor, unsigned Index>
using GetComponentResultTypeList = typename GetComponent<Descriptor, Index>::ResultTypeList;

// e.g. for GetColorType<ColorRGBFunction<SRGB<float>>> -> SRGB<float>
template<typename Descriptor>
using GetColorType = typename Descriptor::ColorType;

// e.g. for GetColorType<ColorRGBFunction<T>> -> typename SRGB<float>::ComponentType -> float
template<typename Descriptor>
using GetColorTypeComponentType = typename GetColorType<Descriptor>::ComponentType;

// MARK: Style resolved parse type (components are std::variants with Style namespaced primitives)

// e.g. for GetStyleColorParseTypeComponentTypeList<ColorRGBFunction<SRGB<float>>, 2> -> brigand::list<Style::Percentage, Style::Number, Style::None>
template<typename Descriptor, unsigned Index>
using GetStyleColorParseTypeComponentTypeList = CSS::TypeTransform::List::CSSToStyle<typename GetComponent<Descriptor, Index>::ResultTypeList>;

// e.g. for GetStyleColorParseTypeComponentResult<ColorRGBFunction<SRGB<float>>, 2> -> std::variant<Style::Percentage, Style::Number, Style::None>
template<typename Descriptor, unsigned Index>
using GetStyleColorParseTypeComponentResult = CSS::VariantOrSingle<GetStyleColorParseTypeComponentTypeList<Descriptor, Index>>;

// e.g. for StyleColorParseType<ColorRGBFunction<T>> -> std::tuple<std::variant<Style::Percentage, Style::Number, Style::None>, ...>
template<typename Descriptor>
using StyleColorParseType = std::tuple<
    GetStyleColorParseTypeComponentResult<Descriptor, 0>,
    GetStyleColorParseTypeComponentResult<Descriptor, 1>,
    GetStyleColorParseTypeComponentResult<Descriptor, 2>,
    std::optional<GetStyleColorParseTypeComponentResult<Descriptor, 3>>
>;

template<typename Descriptor> constexpr bool componentsContainsUnevaluatedCalc(const StyleColorParseType<Descriptor>&)
{
    return false;
}

template<typename Descriptor> constexpr bool componentsRequireConversionData(const StyleColorParseType<Descriptor>&)
{
    return false;
}

// MARK: CSS absolute color parse type (components are std::variants with CSS namespaced primitive, but no symbol values)

// e.g. for GetCSSColorParseTypeWithCalcComponentTypeList<ColorRGBFunction<SRGB<float>>, 2> -> brigand::list<CSS::Percentage<>, CSS::Number<>, CSS::None>
template<typename Descriptor, unsigned Index>
using GetCSSColorParseTypeWithCalcComponentTypeList = typename GetComponent<Descriptor, Index>::ResultTypeList;

// e.g. for GetCSSColorParseTypeWithCalcComponentResult<ColorRGBFunction<SRGB<float>>, 2> -> std::variant<CSS::Percentage<>, CSS::Number<>, CSS::None>
template<typename Descriptor, unsigned Index>
using GetCSSColorParseTypeWithCalcComponentResult = CSS::VariantOrSingle<GetCSSColorParseTypeWithCalcComponentTypeList<Descriptor, Index>>;

// e.g. for CSSColorParseTypeWithCalc<ColorRGBFunction<T>> -> std::tuple<std::variant<CSS::Percentage<>, CSS::Number<>, CSS::None>, ...>
template<typename Descriptor>
using CSSColorParseTypeWithCalc = std::tuple<
    GetCSSColorParseTypeWithCalcComponentResult<Descriptor, 0>,
    GetCSSColorParseTypeWithCalcComponentResult<Descriptor, 1>,
    GetCSSColorParseTypeWithCalcComponentResult<Descriptor, 2>,
    std::optional<GetCSSColorParseTypeWithCalcComponentResult<Descriptor, 3>>
>;

template<typename Descriptor> bool componentsContainsUnevaluatedCalc(const CSSColorParseTypeWithCalc<Descriptor>& components)
{
    return isUnevaluatedCalc(std::get<0>(components))
        || isUnevaluatedCalc(std::get<1>(components))
        || isUnevaluatedCalc(std::get<2>(components))
        || isUnevaluatedCalc(std::get<3>(components));
}

template<typename Descriptor> bool componentsRequireConversionData(const CSSColorParseTypeWithCalc<Descriptor>& components)
{
    return requiresConversionData(std::get<0>(components))
        || requiresConversionData(std::get<1>(components))
        || requiresConversionData(std::get<2>(components))
        || requiresConversionData(std::get<3>(components));
}

// MARK: CSS relative color parse type (components are std::variants with CSS namespaced primitive, includes symbol values)

// e.g. for GetCSSColorParseTypeWithCalcAndSymbolsComponentTypeList<ColorRGBFunction<SRGB<float>>, 2> -> brigand::list<CSS::Percentage<>, CSS::Number<>, CSS::None, CSS::Symbol>
template<typename Descriptor, unsigned Index>
using GetCSSColorParseTypeWithCalcAndSymbolsComponentTypeList = CSS::TypeTransform::List::PlusSymbol<typename GetComponent<Descriptor, Index>::ResultTypeList>;

// e.g. for GetCSSColorParseTypeWithCalcAndSymbolsComponentResult<ColorRGBFunction<SRGB<float>>, 2> -> std::variant<CSS::Percentage<>, CSS::Number<>, CSS::None, CSS::Symbol>
template<typename Descriptor, unsigned Index>
using GetCSSColorParseTypeWithCalcAndSymbolsComponentResult = CSS::VariantOrSingle<GetCSSColorParseTypeWithCalcAndSymbolsComponentTypeList<Descriptor, Index>>;

// e.g. for CSSColorParseTypeWithCalcAndSymbols<ColorRGBFunction<T>> -> std::tuple<std::variant<CSS::Percentage<>, CSS::Number<>, CSS::None, CSS::Symbol>, ...>
template<typename Descriptor>
using CSSColorParseTypeWithCalcAndSymbols = std::tuple<
    GetCSSColorParseTypeWithCalcAndSymbolsComponentResult<Descriptor, 0>,
    GetCSSColorParseTypeWithCalcAndSymbolsComponentResult<Descriptor, 1>,
    GetCSSColorParseTypeWithCalcAndSymbolsComponentResult<Descriptor, 2>,
    std::optional<GetCSSColorParseTypeWithCalcAndSymbolsComponentResult<Descriptor, 3>>
>;

template<typename Descriptor> bool componentsContainsUnevaluatedCalc(const CSSColorParseTypeWithCalcAndSymbols<Descriptor>& components)
{
    return isUnevaluatedCalc(std::get<0>(components))
        || isUnevaluatedCalc(std::get<1>(components))
        || isUnevaluatedCalc(std::get<2>(components))
        || isUnevaluatedCalc(std::get<3>(components));
}

template<typename Descriptor> bool componentsRequireConversionData(const CSSColorParseTypeWithCalcAndSymbols<Descriptor>& components)
{
    return requiresConversionData(std::get<0>(components))
        || requiresConversionData(std::get<1>(components))
        || requiresConversionData(std::get<2>(components))
        || requiresConversionData(std::get<3>(components));
}

// MARK: - Shared Component Descriptors

constexpr auto AlphaComponent = CSSColorComponent<CSS::Percentage<>, CSS::Number<>, CSS::None> { .symbol = CSSValueAlpha, .min = 0.0, .max = 1.0 };
constexpr auto AlphaLegacyComponent = CSSColorComponent<CSS::Percentage<>, CSS::Number<>> { .symbol = CSSValueAlpha, .min = 0.0, .max = 1.0 };

// MARK: - Color Function Descriptors

// <modern-rgb-syntax>  =  rgb( [<number> | <percentage> | none]{3} [ / [<alpha-value> | none] ]? )
// <modern-rgba-syntax> = rgba( [<number> | <percentage> | none]{3} [ / [<alpha-value> | none] ]? )
struct RGBFunctionModernAbsolute {
    using ColorType = SRGBA<float>;
    using Canonical = RGBFunctionModernAbsolute;
    static constexpr bool allowEagerEvaluationOfResolvableCalc = true;
    static constexpr bool allowConversionTo8BitSRGB = true;
    static constexpr OptionSet<Color::Flags> flagsForAbsolute = { };
    static constexpr auto syntax = CSSColorFunctionSyntax::Modern;
    static constexpr bool usesColorFunctionForSerialization = false;
    static constexpr ASCIILiteral serializationFunctionName = "rgb"_s;

    using R = CSSColorComponent<CSS::Percentage<>, CSS::Number<>, CSS::None>;
    using G = CSSColorComponent<CSS::Percentage<>, CSS::Number<>, CSS::None>;
    using B = CSSColorComponent<CSS::Percentage<>, CSS::Number<>, CSS::None>;

    static constexpr auto components = std::make_tuple(
        R { .symbol = CSSValueR, .min = 0.0, .max = 255.0, .numberMultiplier = 1.0 / 255.0, .percentMultiplier = 255.0 / 100.0, .symbolMultiplier = 255.0 },
        G { .symbol = CSSValueG, .min = 0.0, .max = 255.0, .numberMultiplier = 1.0 / 255.0, .percentMultiplier = 255.0 / 100.0, .symbolMultiplier = 255.0 },
        B { .symbol = CSSValueB, .min = 0.0, .max = 255.0, .numberMultiplier = 1.0 / 255.0, .percentMultiplier = 255.0 / 100.0, .symbolMultiplier = 255.0 },
        AlphaComponent
    );
};

template<typename T> concept RGBFunctionLegacyComponent = std::same_as<T, CSS::Percentage<>> || std::same_as<T, CSS::Number<>>;

// <legacy-rgb-syntax>  =  rgb( <percentage>#{3} , <alpha-value>? ) |  rgb( <number>#{3} , <alpha-value>? )
// <legacy-rgba-syntax> = rgba( <percentage>#{3} , <alpha-value>? ) | rgba( <number>#{3} , <alpha-value>? )
template<RGBFunctionLegacyComponent Component> struct RGBFunctionLegacy {
    using ColorType = SRGBA<float>;
    using Canonical = RGBFunctionModernAbsolute;
    static constexpr bool allowEagerEvaluationOfResolvableCalc = true;
    static constexpr bool allowConversionTo8BitSRGB = true;
    static constexpr OptionSet<Color::Flags> flagsForAbsolute = { };
    static constexpr auto syntax = CSSColorFunctionSyntax::Legacy;
    static constexpr bool usesColorFunctionForSerialization = false;
    static constexpr ASCIILiteral serializationFunctionName = "rgb"_s;

    using R = CSSColorComponent<Component>;
    using G = CSSColorComponent<Component>;
    using B = CSSColorComponent<Component>;

    static constexpr auto components = std::make_tuple(
        R { .symbol = CSSValueR, .min = 0.0, .max = 255.0, .numberMultiplier = 1.0 / 255.0,  .percentMultiplier = 255.0 / 100.0, .symbolMultiplier = 255.0 },
        G { .symbol = CSSValueG, .min = 0.0, .max = 255.0, .numberMultiplier = 1.0 / 255.0,  .percentMultiplier = 255.0 / 100.0, .symbolMultiplier = 255.0 },
        B { .symbol = CSSValueB, .min = 0.0, .max = 255.0, .numberMultiplier = 1.0 / 255.0,  .percentMultiplier = 255.0 / 100.0, .symbolMultiplier = 255.0 },
        AlphaLegacyComponent
    );
};

// <modern-rgb-syntax>  =  rgb( [from <color>] [<number> | <percentage> | none]{3} [ / [<alpha-value> | none] ]? )
// <modern-rgba-syntax> = rgba( [from <color>] [<number> | <percentage> | none]{3} [ / [<alpha-value> | none] ]? )
struct RGBFunctionModernRelative {
    using ColorType = ExtendedSRGBA<float>;
    using Canonical = RGBFunctionModernRelative;
    static constexpr bool allowEagerEvaluationOfResolvableCalc = true;
    static constexpr bool allowConversionTo8BitSRGB = true;
    static constexpr OptionSet<Color::Flags> flagsForRelative = Color::Flags::UseColorFunctionSerialization;
    static constexpr auto syntax = CSSColorFunctionSyntax::Modern;
    static constexpr bool usesColorFunctionForSerialization = false;
    static constexpr ASCIILiteral serializationFunctionName = "rgb"_s;

    using R = CSSColorComponent<CSS::Percentage<>, CSS::Number<>, CSS::None>;
    using G = CSSColorComponent<CSS::Percentage<>, CSS::Number<>, CSS::None>;
    using B = CSSColorComponent<CSS::Percentage<>, CSS::Number<>, CSS::None>;

    static constexpr auto components = std::make_tuple(
        R { .symbol = CSSValueR, .numberMultiplier = 1.0 / 255.0, .percentMultiplier = 255.0 / 100.0, .symbolMultiplier = 255.0 },
        G { .symbol = CSSValueG, .numberMultiplier = 1.0 / 255.0, .percentMultiplier = 255.0 / 100.0, .symbolMultiplier = 255.0 },
        B { .symbol = CSSValueB, .numberMultiplier = 1.0 / 255.0, .percentMultiplier = 255.0 / 100.0, .symbolMultiplier = 255.0 },
        AlphaComponent
    );
};

// <modern-hsl-syntax>  =  hsl( [from <color>]? [<hue> | none] [<percentage> | <number> | none]{2} [ / [<alpha-value> | none] ]? )
// <modern-hsla-syntax> = hsla( [from <color>]? [<hue> | none] [<percentage> | <number> | none]{2} [ / [<alpha-value> | none] ]? )
struct HSLFunctionModern {
    using ColorType = HSLA<float>;
    using Canonical = HSLFunctionModern;
    static constexpr bool allowEagerEvaluationOfResolvableCalc = true;
    static constexpr bool allowConversionTo8BitSRGB = true;
    static constexpr OptionSet<Color::Flags> flagsForRelative = Color::Flags::UseColorFunctionSerialization;
    static constexpr OptionSet<Color::Flags> flagsForAbsolute = { };
    static constexpr auto syntax = CSSColorFunctionSyntax::Modern;
    static constexpr bool usesColorFunctionForSerialization = false;
    static constexpr ASCIILiteral serializationFunctionName = "hsl"_s;

    using H = CSSColorComponent<CSS::Angle<>, CSS::Number<>, CSS::None>;
    using S = CSSColorComponent<CSS::Percentage<>, CSS::Number<>, CSS::None>;
    using L = CSSColorComponent<CSS::Percentage<>, CSS::Number<>, CSS::None>;

    static constexpr auto components = std::make_tuple(
        H { .symbol = CSSValueH, .type = ColorComponentType::Angle    },
        S { .symbol = CSSValueS, .min = 0.0, .percentMultiplier = 1.0 },
        L { .symbol = CSSValueL,             .percentMultiplier = 1.0 },
        AlphaComponent
    );
};

// <legacy-hsl-syntax>  =  hsl( <hue>, <percentage>, <percentage>, <alpha-value>? )
// <legacy-hsla-syntax> = hsla( <hue>, <percentage>, <percentage>, <alpha-value>? )
struct HSLFunctionLegacy {
    using ColorType = HSLA<float>;
    using Canonical = HSLFunctionModern;
    static constexpr bool allowEagerEvaluationOfResolvableCalc = true;
    static constexpr bool allowConversionTo8BitSRGB = true;
    static constexpr OptionSet<Color::Flags> flagsForAbsolute = { };
    static constexpr auto syntax = CSSColorFunctionSyntax::Legacy;
    static constexpr bool usesColorFunctionForSerialization = false;
    static constexpr ASCIILiteral serializationFunctionName = "hsl"_s;

    using H = CSSColorComponent<CSS::Angle<>, CSS::Number<>>;
    using S = CSSColorComponent<CSS::Percentage<>>;
    using L = CSSColorComponent<CSS::Percentage<>>;

    static constexpr auto components = std::make_tuple(
        H { .symbol = CSSValueH, .type = ColorComponentType::Angle    },
        S { .symbol = CSSValueS, .min = 0.0, .percentMultiplier = 1.0 },
        L { .symbol = CSSValueL,             .percentMultiplier = 1.0 },
        AlphaLegacyComponent
    );
};

// hwb() = hwb( [from <color>]? [<hue> | none] [<percentage> | <number> | none]{2} [ / [<alpha-value> | none] ]? )
struct HWBFunction {
    using ColorType = HWBA<float>;
    using Canonical = HWBFunction;
    static constexpr bool allowEagerEvaluationOfResolvableCalc = true;
    static constexpr bool allowConversionTo8BitSRGB = true;
    static constexpr OptionSet<Color::Flags> flagsForRelative = Color::Flags::UseColorFunctionSerialization;
    static constexpr OptionSet<Color::Flags> flagsForAbsolute = { };
    static constexpr auto syntax = CSSColorFunctionSyntax::Modern;
    static constexpr bool usesColorFunctionForSerialization = false;
    static constexpr ASCIILiteral serializationFunctionName = "hwb"_s;

    using H = CSSColorComponent<CSS::Angle<>, CSS::Number<>, CSS::None>;
    using W = CSSColorComponent<CSS::Percentage<>, CSS::Number<>, CSS::None>;
    using B = CSSColorComponent<CSS::Percentage<>, CSS::Number<>, CSS::None>;

    static constexpr auto components = std::make_tuple(
        H { .symbol = CSSValueH, .type = ColorComponentType::Angle },
        W { .symbol = CSSValueW, .percentMultiplier = 1.0          },
        B { .symbol = CSSValueB, .percentMultiplier = 1.0          },
        AlphaComponent
    );
};

// lab() = lab( [from <color>]? [<percentage> | <number> | none]{3} [ / [<alpha-value> | none] ]? )
struct LabFunction {
    using ColorType = Lab<float>;
    using Canonical = LabFunction;
    static constexpr bool allowEagerEvaluationOfResolvableCalc = false;
    static constexpr bool allowConversionTo8BitSRGB = false;
    static constexpr OptionSet<Color::Flags> flagsForRelative = { };
    static constexpr OptionSet<Color::Flags> flagsForAbsolute = { };
    static constexpr auto syntax = CSSColorFunctionSyntax::Modern;
    static constexpr bool usesColorFunctionForSerialization = false;
    static constexpr ASCIILiteral serializationFunctionName = "lab"_s;

    using L = CSSColorComponent<CSS::Percentage<>, CSS::Number<>, CSS::None>;
    using A = CSSColorComponent<CSS::Percentage<>, CSS::Number<>, CSS::None>;
    using B = CSSColorComponent<CSS::Percentage<>, CSS::Number<>, CSS::None>;

    static constexpr auto components = std::make_tuple(
        L { .symbol = CSSValueL, .min = 0.0, .max = 100.0, .percentMultiplier = 1.0           },
        A { .symbol = CSSValueA,                           .percentMultiplier = 125.0 / 100.0 },
        B { .symbol = CSSValueB,                           .percentMultiplier = 125.0 / 100.0 },
        AlphaComponent
    );
};

// lch() = lch( [from <color>]? [<percentage> | <number> | none]{2} [<hue> | none] [ / [<alpha-value> | none] ]? )
struct LCHFunction {
    using ColorType = LCHA<float>;
    using Canonical = LCHFunction;
    static constexpr bool allowEagerEvaluationOfResolvableCalc = false;
    static constexpr bool allowConversionTo8BitSRGB = false;
    static constexpr OptionSet<Color::Flags> flagsForRelative = { };
    static constexpr OptionSet<Color::Flags> flagsForAbsolute = { };
    static constexpr auto syntax = CSSColorFunctionSyntax::Modern;
    static constexpr bool usesColorFunctionForSerialization = false;
    static constexpr ASCIILiteral serializationFunctionName = "lch"_s;

    using L = CSSColorComponent<CSS::Percentage<>, CSS::Number<>, CSS::None>;
    using C = CSSColorComponent<CSS::Percentage<>, CSS::Number<>, CSS::None>;
    using H = CSSColorComponent<CSS::Angle<>, CSS::Number<>, CSS::None>;

    static constexpr auto components = std::make_tuple(
        L { .symbol = CSSValueL, .min = 0.0, .max = 100.0, .percentMultiplier = 1.0           },
        C { .symbol = CSSValueC, .min = 0.0,               .percentMultiplier = 150.0 / 100.0 },
        H { .symbol = CSSValueH, .type = ColorComponentType::Angle                            },
        AlphaComponent
    );
};

// oklab() = oklab( [from <color>]? [<percentage> | <number> | none]{3} [ / [<alpha-value> | none] ]? )
struct OKLabFunction {
    using ColorType = OKLab<float>;
    using Canonical = OKLabFunction;
    static constexpr bool allowEagerEvaluationOfResolvableCalc = false;
    static constexpr bool allowConversionTo8BitSRGB = false;
    static constexpr OptionSet<Color::Flags> flagsForRelative = { };
    static constexpr OptionSet<Color::Flags> flagsForAbsolute = { };
    static constexpr auto syntax = CSSColorFunctionSyntax::Modern;
    static constexpr bool usesColorFunctionForSerialization = false;
    static constexpr ASCIILiteral serializationFunctionName = "oklab"_s;

    using L = CSSColorComponent<CSS::Percentage<>, CSS::Number<>, CSS::None>;
    using A = CSSColorComponent<CSS::Percentage<>, CSS::Number<>, CSS::None>;
    using B = CSSColorComponent<CSS::Percentage<>, CSS::Number<>, CSS::None>;

    static constexpr auto components = std::make_tuple(
        L { .symbol = CSSValueL, .min = 0.0, .max = 1.0                                   },
        A { .symbol = CSSValueA,                         .percentMultiplier = 0.4 / 100.0 },
        B { .symbol = CSSValueB,                         .percentMultiplier = 0.4 / 100.0 },
        AlphaComponent
    );
};

// oklch() = oklch( [from <color>]? [<percentage> | <number> | none]{2} [<hue> | none] [ / [<alpha-value> | none] ]? )
struct OKLCHFunction {
    using ColorType = OKLCHA<float>;
    using Canonical = OKLCHFunction;
    static constexpr bool allowEagerEvaluationOfResolvableCalc = false;
    static constexpr bool allowConversionTo8BitSRGB = false;
    static constexpr OptionSet<Color::Flags> flagsForRelative = { };
    static constexpr OptionSet<Color::Flags> flagsForAbsolute = { };
    static constexpr auto syntax = CSSColorFunctionSyntax::Modern;
    static constexpr bool usesColorFunctionForSerialization = false;
    static constexpr ASCIILiteral serializationFunctionName = "oklch"_s;

    using L = CSSColorComponent<CSS::Percentage<>, CSS::Number<>, CSS::None>;
    using C = CSSColorComponent<CSS::Percentage<>, CSS::Number<>, CSS::None>;
    using H = CSSColorComponent<CSS::Angle<>, CSS::Number<>, CSS::None>;

    static constexpr auto components = std::make_tuple(
        L { .symbol = CSSValueL, .min = 0.0, .max = 1.0                                   },
        C { .symbol = CSSValueC, .min = 0.0,            .percentMultiplier = 0.4 / 100.0  },
        H { .symbol = CSSValueH, .type = ColorComponentType::Angle },
        AlphaComponent
    );
};

// color() = color( [from <color>]? <rgb-params> [ / [ <alpha-value> | none ] ]? )
// <rgb-params> = <rgb-color-space> [ <number> | <percentage> | none ]{3}
// <rgb-color-space> = srgb | srgb-linear | display-p3 | a98-rgb | prophoto-rgb | rec2020
template<typename T> struct ColorRGBFunction {
    using ColorType = T;
    using Canonical = ColorRGBFunction<T>;
    static constexpr bool allowEagerEvaluationOfResolvableCalc = false;
    static constexpr bool allowConversionTo8BitSRGB = false;
    static constexpr OptionSet<Color::Flags> flagsForRelative = Color::Flags::UseColorFunctionSerialization;
    static constexpr OptionSet<Color::Flags> flagsForAbsolute = Color::Flags::UseColorFunctionSerialization;
    static constexpr auto syntax = CSSColorFunctionSyntax::Modern;
    static constexpr bool usesColorFunctionForSerialization = true;
    static constexpr ASCIILiteral serializationFunctionName = "color"_s;

    using R = CSSColorComponent<CSS::Percentage<>, CSS::Number<>, CSS::None>;
    using G = CSSColorComponent<CSS::Percentage<>, CSS::Number<>, CSS::None>;
    using B = CSSColorComponent<CSS::Percentage<>, CSS::Number<>, CSS::None>;

    static constexpr auto components = std::make_tuple(
        R { .symbol = CSSValueR },
        G { .symbol = CSSValueG },
        B { .symbol = CSSValueB },
        AlphaComponent
    );
};

// color() = color( [from <color>]? <xyz-params> [ / [ <alpha-value> | none ] ]? )
// <xyz-params> = <xyz-color-space> [ <number> | <percentage> | none ]{3}
// <xyz-color-space> = xyz | xyz-d50 | xyz-d65
template<typename T> struct ColorXYZFunction {
    using ColorType = T;
    using Canonical = ColorXYZFunction<T>;
    static constexpr bool allowEagerEvaluationOfResolvableCalc = false;
    static constexpr bool allowConversionTo8BitSRGB = false;
    static constexpr OptionSet<Color::Flags> flagsForRelative = Color::Flags::UseColorFunctionSerialization;
    static constexpr OptionSet<Color::Flags> flagsForAbsolute = Color::Flags::UseColorFunctionSerialization;
    static constexpr auto syntax = CSSColorFunctionSyntax::Modern;
    static constexpr bool usesColorFunctionForSerialization = true;
    static constexpr ASCIILiteral serializationFunctionName = "color"_s;

    using X = CSSColorComponent<CSS::Percentage<>, CSS::Number<>, CSS::None>;
    using Y = CSSColorComponent<CSS::Percentage<>, CSS::Number<>, CSS::None>;
    using Z = CSSColorComponent<CSS::Percentage<>, CSS::Number<>, CSS::None>;

    static constexpr auto components = std::make_tuple(
        X { .symbol = CSSValueX },
        Y { .symbol = CSSValueY },
        Z { .symbol = CSSValueZ },
        AlphaComponent
    );
};

} // namespace WebCore
