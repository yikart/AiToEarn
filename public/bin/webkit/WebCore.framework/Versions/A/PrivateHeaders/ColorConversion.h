/*
 * Copyright (C) 2017-2022 Apple Inc. All rights reserved.
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

#include "ColorTypes.h"
#include <wtf/MathExtras.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace WebCore {

class DestinationColorSpace;

enum class ColorSpace : uint8_t;

// Conversion function for typed colors.
template<typename Output, typename Input> Output convertColor(const Input& color);

// Conversion function for typed colors that carries forward missing component values
// from analogous components in the input type.
template<typename Output, typename Input> Output convertColorCarryingForwardMissing(const Input& color);

// Conversion functions for raw color components with associated color spaces.
ColorComponents<float, 4> convertAndResolveColorComponents(ColorSpace inputColorSpace, ColorComponents<float, 4> inputColorComponents, ColorSpace outputColorSpace);
ColorComponents<float, 4> convertAndResolveColorComponents(ColorSpace inputColorSpace, ColorComponents<float, 4> inputColorComponents, const DestinationColorSpace& outputColorSpace);


// All color types, other than XYZA or those inheriting from RGBType, must implement
// the following conversions to and from their "Reference" color.
//
//    template<> struct ColorConversion<`ColorType`<float>::Reference, `ColorType`<float>> {
//        WEBCORE_EXPORT static `ColorType`<float>::Reference convert(const `ColorType`<float>&);
//    };
//    
//    template<> struct ColorConversion<`ColorType`<float>, `ColorType`<float>::Reference> {
//        WEBCORE_EXPORT static `ColorType`<float> convert(const `ColorType`<float>::Reference&);
//    };
//

template<typename Output, typename Input, typename = void> struct ColorConversion;

template<typename Output, typename Input> Output convertColor(const Input& color)
{
    return ColorConversion<CanonicalColorType<Output>, CanonicalColorType<Input>>::convert(color);
}

// MARK: Specialized converters

// Looks for a an analogous component in `Output` of `Input[IndexInInput]`.
// For example, take the following:
//
//   auto result = analogousComponentIndex<LCHA<float>, HSLA<float>, 0>;
//
// This returns "2", because the input component specified (the hue in HSLA)
// is analogous to component "2" in the output (the hue in LCHA).
//
// If there is no analogous component, `std::nullopt` is returned.
template<typename Output, typename Input, unsigned IndexInInput>
constexpr std::optional<unsigned> analogousComponentIndex()
{
    if constexpr (IndexInInput == 3)
        return 3; // Special case alpha, it always should carry forward.
    else {
        constexpr auto inputCategory = Input::Model::componentInfo[IndexInInput].category;
        if constexpr (!inputCategory)
            return std::nullopt;
        else if constexpr (*inputCategory == Output::Model::componentInfo[0].category)
            return 0;
        else if constexpr (*inputCategory == Output::Model::componentInfo[1].category)
            return 1;
        else if constexpr (*inputCategory == Output::Model::componentInfo[2].category)
            return 2;
        else
            return std::nullopt;
    }
}

// Utility to update appropriate component in `output` if an analogous component
// in `input` is missing (which is encoded as NaN in color types).
template<typename Output, typename Input, unsigned IndexInInput>
constexpr void tryToCarryForwardComponentIfMissing(const ColorComponents<float, 4>& input, ColorComponents<float, 4>& output)
{
    constexpr auto analogousComponentIndexInOutput = analogousComponentIndex<Output, Input, IndexInInput>();
    if constexpr (analogousComponentIndexInOutput) {
        if (std::isnan(input[IndexInInput]))
            output[*analogousComponentIndexInOutput] = std::numeric_limits<float>::quiet_NaN();
    }
}

// Performs color space conversion followed by carrying forward missing components
// from `Input` for analogous components in `Output` as described by CSS Color 4
// § 12. Color Interpolation, https://drafts.csswg.org/css-color-4/#interpolation.
template<typename Output, typename Input> Output convertColorCarryingForwardMissing(const Input& color)
{
    if constexpr (std::is_same_v<Input, Output>)
        return convertColor<Output>(color);
    else if constexpr (std::is_same_v<typename Input::ComponentType, uint8_t> || std::is_same_v<typename Output::ComponentType, uint8_t>)
        return convertColor<Output>(color);
    else {
        auto input = asColorComponents(color.unresolved());
        auto output = asColorComponents(convertColor<Output>(color).unresolved());

        tryToCarryForwardComponentIfMissing<Output, Input, 0>(input, output);
        tryToCarryForwardComponentIfMissing<Output, Input, 1>(input, output);
        tryToCarryForwardComponentIfMissing<Output, Input, 2>(input, output);
        tryToCarryForwardComponentIfMissing<Output, Input, 3>(input, output);

        return makeFromComponents<Output>(output);
    }
}

// MARK: White Point.

constexpr float D50WhitePoint[] = { 0.3457 / 0.3585, 1.0, (1.0 - 0.3457 - 0.3585) / 0.3585 };
constexpr float D65WhitePoint[] = { 0.3127 / 0.3290, 1.0, (1.0 - 0.3127 - 0.3290) / 0.3290 };

// MARK: Chromatic Adaptation conversions.

template<WhitePoint From, WhitePoint To> struct ChromaticAdaptation;

// Chromatic Adaptation allows conversion from one white point to another.
//
// The values we use are pre-calculated for the two white points we support, D50
// and D65 using the Bradford method's chromatic adaptation transform (CAT), but
// can be extended to any pair of white points.
//
// The process to compute new ones is:
//
//  1. Choose a CAT and lookup its values (these are not derivable).
//     We currently use the Bradford CAT
//
//     let toCone =
//         [  0.8951000,  0.2664000, -0.1614000 ],
//         [ -0.7502000,  1.7135000,  0.0367000 ],
//         [  0.0389000, -0.0685000,  1.0296000 ]
//
//  2. In addition, you will need the inverse
//
//     let fromCone = toCone ^ -1
//
//  3. Choose source and destination XYZ white points
//
//     let whitePoint_src = [ ... , ... , ... ]
//     let whitePoint_dst = [ ... , ... , ... ]
//
//  4. Convert the white points into the cone response domain (denoted ρ, γ, β)
//
//     let [ ρ_src, γ_src, β_src ] = toCone * whitePoint_src
//     let [ ρ_dst, γ_dst, β_dst ] = toCone * whitePoint_dst
//
//  5. Compute a scale transform
//
//     let scale =
//         [ ρ_dst / ρ_src, 0,             0             ],
//         [ 0,             γ_dst / γ_src, 0             ],
//         [ 0,             0,             β_dst / β_src ]
//
//  6. Finally, use the scale to compute the adaptation transform
//     (what is stored ChromaticAdaptation.matrix) as the concatenation
//     of the toCone, scale and fromCone transforms.
//
//     let adaptation = fromCone * scale * toCone
//
// Additional details and more CATs / white point values can be found at: http://www.brucelindbloom.com/index.html?Eqn_ChromAdapt.html

template<> struct ChromaticAdaptation<WhitePoint::D65, WhitePoint::D50> {
    static constexpr ColorMatrix<3, 3> matrix {
         1.0479297925449969,    0.022946870601609652, -0.05019226628920524,
         0.02962780877005599,   0.9904344267538799,   -0.017073799063418826,
        -0.009243040646204504,  0.015055191490298152,  0.7518742814281371
    };
};

template<> struct ChromaticAdaptation<WhitePoint::D50, WhitePoint::D65> {
    static constexpr ColorMatrix<3, 3> matrix {
         0.955473421488075,    -0.02309845494876471,   0.06325924320057072,
        -0.0283697093338637,    1.0099953980813041,    0.021041441191917323,
         0.012314014864481998, -0.020507649298898964,  1.330365926242124
    };
};

// MARK: HSLA
template<> struct ColorConversion<ExtendedSRGBA<float>, HSLA<float>> {
    WEBCORE_EXPORT static ExtendedSRGBA<float> convert(const HSLA<float>&);
};
template<> struct ColorConversion<HSLA<float>, ExtendedSRGBA<float>> {
    WEBCORE_EXPORT static HSLA<float> convert(const ExtendedSRGBA<float>&);
};

// MARK: HWBA
template<> struct ColorConversion<ExtendedSRGBA<float>, HWBA<float>> {
    WEBCORE_EXPORT static ExtendedSRGBA<float> convert(const HWBA<float>&);
};
template<> struct ColorConversion<HWBA<float>, ExtendedSRGBA<float>> {
    WEBCORE_EXPORT static HWBA<float> convert(const ExtendedSRGBA<float>&);
};

// MARK: LCHA
template<> struct ColorConversion<Lab<float>, LCHA<float>> {
    WEBCORE_EXPORT static Lab<float> convert(const LCHA<float>&);
};
template<> struct ColorConversion<LCHA<float>, Lab<float>> {
    WEBCORE_EXPORT static LCHA<float> convert(const Lab<float>&);
};

// MARK: Lab
template<> struct ColorConversion<XYZA<float, WhitePoint::D50>, Lab<float>> {
    WEBCORE_EXPORT static XYZA<float, WhitePoint::D50> convert(const Lab<float>&);
};
template<> struct ColorConversion<Lab<float>, XYZA<float, WhitePoint::D50>> {
    WEBCORE_EXPORT static Lab<float> convert(const XYZA<float, WhitePoint::D50>&);
};

// MARK: OKLCHA
template<> struct ColorConversion<OKLab<float>, OKLCHA<float>> {
    WEBCORE_EXPORT static OKLab<float> convert(const OKLCHA<float>&);
};
template<> struct ColorConversion<OKLCHA<float>, OKLab<float>> {
    WEBCORE_EXPORT static OKLCHA<float> convert(const OKLab<float>&);
};

// MARK: OKLab
template<> struct ColorConversion<XYZA<float, WhitePoint::D65>, OKLab<float>> {
    WEBCORE_EXPORT static XYZA<float, WhitePoint::D65> convert(const OKLab<float>&);
};
template<> struct ColorConversion<OKLab<float>, XYZA<float, WhitePoint::D65>> {
    WEBCORE_EXPORT static OKLab<float> convert(const XYZA<float, WhitePoint::D65>&);
};

// Identity conversion.

template<typename ColorType> struct ColorConversion<ColorType, ColorType> {
    static ColorType convert(const ColorType& color)
    {
        return color;
    }
};

// MARK: DeltaE color difference algorithms.

template<typename ColorType1, typename ColorType2> constexpr float computeDeltaEOK(ColorType1 color1, ColorType2 color2)
{
    // https://drafts.csswg.org/css-color/#color-difference-OK

    auto [L1, a1, b1, alpha1] = convertColor<OKLab<float>>(color1).resolved();
    auto [L2, a2, b2, alpha2] = convertColor<OKLab<float>>(color2).resolved();

    auto deltaL = (L1 / 100.0f) - (L2 / 100.0f);
    auto deltaA = a1 - a2;
    auto deltaB = b1 - b2;

    return std::hypot(deltaL, deltaA, deltaB);
}

// MARK: Gamut mapping algorithms.

struct ClipGamutMapping {
    template<typename ColorType> static auto mapToBoundedGamut(const ColorType& color) -> typename ColorType::BoundedCounterpart
    {
        return clipToGamut<typename ColorType::BoundedCounterpart>(color);
    }
};

struct CSSGamutMapping {
    // This implements the CSS gamut mapping algorithm (https://drafts.csswg.org/css-color/#css-gamut-mapping) for RGB
    // colors that are out of gamut for a particular RGB color space. It implements a relative colorimetric intent mapping
    // for colors that are outside the destination gamut and leaves colors inside the destination gamut unchanged.

    // A simple optimization over the pseudocode in the specification has been made to avoid unnecessary work in the
    // main bisection loop by checking the gamut using the extended linear color space of the RGB family regardless of
    // of whether the final type is gamma encoded or not. This avoids unnecessary gamma encoding for non final loops.

    // FIXME: This is a naive iterative solution that works for any bounded RGB color space. This can be optimized by
    // using an analytical solution that computes the exact intersection.

    static constexpr float JND = 0.02f;

    template<typename ColorType> static auto mapToBoundedGamut(const ColorType& color) -> typename ColorType::BoundedCounterpart
    {
        using BoundedColorType = typename ColorType::BoundedCounterpart;
        using ExtendedLinearColorType = ExtendedLinearEncoded<typename BoundedColorType::ComponentType, typename BoundedColorType::Descriptor>;
        using BoundedLinearColorType = BoundedLinearEncoded<typename BoundedColorType::ComponentType, typename BoundedColorType::Descriptor>;

        auto resolvedColor = color.resolved();

        if (auto result = colorIfInGamut<BoundedColorType>(resolvedColor))
            return *result;

        auto colorInOKLCHColorSpace = convertColor<OKLCHA<float>>(resolvedColor).resolved();

        if (WTF::areEssentiallyEqual(colorInOKLCHColorSpace.lightness, 100.0f) || colorInOKLCHColorSpace.lightness > 100.0f)
            return { 1.0, 1.0, 1.0, resolvedColor.alpha };
        else if (WTF::areEssentiallyEqual(colorInOKLCHColorSpace.lightness, 0.0f))
            return { 0.0f, 0.0f, 0.0f, resolvedColor.alpha };

        float min = 0.0f;
        float max = colorInOKLCHColorSpace.chroma;

        while (true) {
            auto chroma = (min + max) / 2.0f;

            auto current = colorInOKLCHColorSpace;
            current.chroma = chroma;

            auto currentInExtendedLinearColorSpace = convertColor<ExtendedLinearColorType>(current).resolved();

            if (inGamut<BoundedLinearColorType>(currentInExtendedLinearColorSpace)) {
                min = chroma;
                continue;
            }

            auto currentClippedToBoundedLinearColorSpace = clipToGamut<BoundedLinearColorType>(currentInExtendedLinearColorSpace);

            auto deltaE = computeDeltaEOK(currentClippedToBoundedLinearColorSpace, current);
            if (deltaE < JND)
                return convertColor<BoundedColorType>(currentClippedToBoundedLinearColorSpace);

            max = chroma;
        }
    }
};

// Main conversion.

//                ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┼ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
//                 Matrix Conversions    ┌───────────┐│┌───────────┐
//                │                      │ XYZ (D50) │││ XYZ (D65) │                                                                                                                      │
//                                       └─────▲─────┘│└─────▲─────┘
//                │                            │      │      │                                                                                                                            │
//       ┌─────────────────────────┬───────────┘      │      └───────────┬───────────────────────────────┬───────────────────────────────┬───────────────────────────────┬─────────────────────────┐
//       │        │                │                  │                  │                               │                               │                               │                │        │
//       │                         │                  │                  │                               │                               │                               │                         │
//       │        │                │                  │                  │                               │                               │                               │                │        │
//       │          ProPhotoRGB───────────────────┐   │   SRGB──────────────────────────┐ DisplayP3─────────────────────┐ A98RGB────────────────────────┐ Rec2020───────────────────────┐          │
//       │        │ │           ┌────────────────┐│   │   │           ┌────────────────┐│ │           ┌────────────────┐│ │           ┌────────────────┐│ │           ┌────────────────┐│ │        │
//       │          │     ┌─────▶︎ LinearExtended ││   │   │     ┌─────▶︎ LinearExtended ││ │     ┌─────▶︎ LinearExtended ││ │     ┌─────▶︎ LinearExtended ││ │     ┌─────▶︎ LinearExtended ││          │
//       │        │ │     │     └────────▲───────┘│   │   │     │     └────────▲───────┘│ │     │     └────────▲───────┘│ │     │     └────────▲───────┘│ │     │     └────────▲───────┘│ │        │
//       │         ─│─ ─ ─│─ ─ ─ ─ ─ ─ ─ ┼ ─ ─ ─ ─│─ ─│─ ─│─ ─ ─│─ ─ ─ ─ ─ ─ ─ ┼ ─ ─ ─ ─│─│─ ─ ─│─ ─ ─ ─ ─ ─ ─ ┼ ─ ─ ─ ─│─│─ ─ ─│─ ─ ─ ─ ─ ─ ─ ┼ ─ ─ ─ ─│─│─ ─ ─│─ ─ ─ ─ ─ ─ ─ ┼ ─ ─ ─ ─│─         │
//       │          │┌────────┐          │        │   │   │┌────────┐          │        │ │┌────────┐          │        │ │┌────────┐          │        │ │┌────────┐          │        │          │
//       │          ││ Linear │          │        │   │   ││ Linear │          │        │ ││ Linear │          │        │ ││ Linear │          │        │ ││ Linear │          │        │          │
//       │          │└────▲───┘          │        │   │   │└────▲───┘          │        │ │└────▲───┘          │        │ │└────▲───┘          │        │ │└────▲───┘          │        │          │
//       │          │     │              │        │   │   │     │              │        │ │     │              │        │ │     │              │        │ │     │              │        │          │
// ┌───────────┐    │┌────────┐ ┌────────────────┐│   │   │┌────────┐ ┌────────────────┐│ │┌────────┐ ┌────────────────┐│ │┌────────┐ ┌────────────────┐│ │┌────────┐ ┌────────────────┐│    ┌───────────┐
// │    Lab    │    ││ Gamma  │─│ GammaExtended  ││   │   ││ Gamma  │─│ GammaExtended  ││ ││ Gamma  │─│ GammaExtended  ││ ││ Gamma  │─│ GammaExtended  ││ ││ Gamma  │─│ GammaExtended  ││    │   OKLab   │
// └─────▲─────┘    │└────────┘ └────────────────┘│   │   │└────▲───┘ └────────────────┘│ │└────────┘ └────────────────┘│ │└────────┘ └────────────────┘│ │└────────┘ └────────────────┘│    └─────▲─────┘
//       │          └─────────────────────────────┘   │   └─────┼───────────────────────┘ └─────────────────────────────┘ └─────────────────────────────┘ └─────────────────────────────┘          │
//       │                                            │      ┌──┴──────────┐                                                                                                                       │
//       │                                            │      │             │                                                                                                                       │
// ┌───────────┐                                      │┌───────────┐ ┌───────────┐                                                                                                           ┌───────────┐
// │    LCH    │                                      ││    HSL    │ │    HWB    │                                                                                                           │   OKLCH   │
// └───────────┘                                      │└───────────┘ └───────────┘                                                                                                           └───────────┘

template<typename Output, typename Input, typename> struct ColorConversion {
public:
    static constexpr Output convert(const Input& color)
    {
        // 1. Handle the special case of Input or Output with a uint8_t component type.
        if constexpr (std::is_same_v<typename Input::ComponentType, uint8_t>)
            return handleToFloatConversion(color);
        else if constexpr (std::is_same_v<typename Output::ComponentType, uint8_t>)
            return handleToByteConversion(color);

        // 2. Handle all color types that are not IsRGBType<T> or IsXYZA<T> for Input and Output. For all
        //    these other color types, we can unconditionally convert them to their "reference" color, as
        //    either they have already been handled by a ColorConversion specialization or this will
        //    get us closer to the final conversion.
        else if constexpr (!IsRGBType<Input> && !IsXYZA<Input>)
            return convertColor<Output>(convertColor<typename Input::Reference>(color));
        else if constexpr (!IsRGBType<Output> && !IsXYZA<Output>)
            return convertColor<Output>(convertColor<typename Output::Reference>(color));

        // 3. Handle conversions within a RGBFamily (e.g. all have the same descriptor).
        else if constexpr (IsSameRGBTypeFamily<Output, Input>)
            return handleRGBFamilyConversion(color);

        // 4. Handle any gamma conversions for the Input and Output.
        else if constexpr (IsRGBGammaEncodedType<Input>)
            return convertColor<Output>(convertColor<typename Input::LinearCounterpart>(color));
        else if constexpr (IsRGBGammaEncodedType<Output>)
            return convertColor<Output>(convertColor<typename Output::LinearCounterpart>(color));

        // 5. Handle any bounds conversions for the Input and Output.
        else if constexpr (IsRGBBoundedType<Input>)
            return convertColor<Output>(convertColor<typename Input::ExtendedCounterpart>(color));
        else if constexpr (IsRGBBoundedType<Output>)
            return convertColor<Output>(convertColor<typename Output::ExtendedCounterpart>(color));

        // 6. At this point, Input and Output are each either ExtendedLinear-RGB types (of different families) or XYZA
        //    and therefore all additional conversion can happen via matrix transformation.
        else
            return handleMatrixConversion(color);
    }

private:
    static constexpr Output handleToFloatConversion(const Input& color)
    {
        static_assert(IsRGBBoundedType<Input>, "Only bounded ([0..1]) RGB color types support conversion to/from bytes.");

        using InputWithReplacement = ColorTypeWithReplacementComponent<Input, float>;
        if constexpr (std::is_same_v<InputWithReplacement, Output>)
            return makeFromComponents<InputWithReplacement>(asColorComponents(color.resolved()).map([](uint8_t value) -> float { return value / 255.0f; }));
        else
            return convertColor<Output>(convertColor<InputWithReplacement>(color));
    }

    static constexpr Output handleToByteConversion(const Input& color)
    {
        static_assert(IsRGBBoundedType<Output>, "Only bounded ([0..1]) RGB color types support conversion to/from bytes.");

        using OutputWithReplacement = ColorTypeWithReplacementComponent<Output, float>;
        if constexpr (std::is_same_v<OutputWithReplacement, Input>)
            return makeFromComponents<Output>(asColorComponents(color.resolved()).map([](float value) -> uint8_t { return std::clamp(std::lround(value * 255.0f), 0l, 255l); }));
        else
            return convertColor<Output>(convertColor<OutputWithReplacement>(color));
    }

    template<typename ColorType> static constexpr auto toLinearEncoded(const ColorType& color) -> typename ColorType::LinearCounterpart
    {
        auto [c1, c2, c3, alpha] = color.resolved();
        return { ColorType::TransferFunction::toLinear(c1), ColorType::TransferFunction::toLinear(c2), ColorType::TransferFunction::toLinear(c3), alpha };
    }

    template<typename ColorType> static constexpr auto toGammaEncoded(const ColorType& color) -> typename ColorType::GammaEncodedCounterpart
    {
        auto [c1, c2, c3, alpha] = color.resolved();
        return { ColorType::TransferFunction::toGammaEncoded(c1), ColorType::TransferFunction::toGammaEncoded(c2), ColorType::TransferFunction::toGammaEncoded(c3), alpha };
    }

    template<typename ColorType> static constexpr auto toExtended(const ColorType& color) -> typename ColorType::ExtendedCounterpart
    {
        return makeFromComponents<typename ColorType::ExtendedCounterpart>(asColorComponents(color.resolved()));
    }

    template<typename ColorType> static constexpr auto toBounded(const ColorType& color) -> typename ColorType::BoundedCounterpart
    {
        return ClipGamutMapping::mapToBoundedGamut(color);
    }

    static constexpr Output handleRGBFamilyConversion(const Input& color)
    {
        static_assert(IsSameRGBTypeFamily<Output, Input>);

        //  RGB Family────────────────────┐
        //  │           ┌────────────────┐│
        //  │     ┌─────▶︎ LinearExtended ││
        //  │     │     └────────▲───────┘│
        //  │     │              │        │
        //  │┌────────┐          │        │
        //  ││ Linear │          │        │
        //  │└────▲───┘          │        │
        //  │     │              │        │
        //  │┌────────┐ ┌────────────────┐│
        //  ││ Gamma  │─│ GammaExtended  ││
        //  │└────────┘ └────────────────┘│
        //  └─────────────────────────────┘

        // This handles conversions between any two of these within the same family, so SRGBLinear -> SRGB, but not
        // SRGBLinear -> A98RGB.

        auto boundsConversion = [](auto color) {
            if constexpr (IsRGBExtendedType<Output> && IsRGBBoundedType<Input>)
                return toExtended(color);
            else if constexpr (IsRGBBoundedType<Output> && IsRGBExtendedType<Input>)
                return toBounded(color);
            else
                return color;
        };

        auto gammaConversion = [](auto color) {
            if constexpr (IsRGBGammaEncodedType<Output> && IsRGBLinearEncodedType<Input>)
                return toGammaEncoded(color);
            else if constexpr (IsRGBLinearEncodedType<Output> && IsRGBGammaEncodedType<Input>)
                return toLinearEncoded(color);
            else
                return color;
        };

        return boundsConversion(gammaConversion(color));
    }

    static constexpr Output handleMatrixConversion(const Input& color)
    {
        static_assert((IsRGBLinearEncodedType<Input> && IsRGBExtendedType<Input>) || IsXYZA<Input>);
        static_assert((IsRGBLinearEncodedType<Output> && IsRGBExtendedType<Output>) || IsXYZA<Output>);

        //  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┼ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
        //   Matrix Conversions    ┌───────────┐│┌───────────┐
        //  │                      │ XYZ (D50) │││ XYZ (D65) │                                                                                                                      │
        //                         └─────▲─────┘│└─────▲─────┘
        //  │                            │      │      │                                                                                                                            │
        //                   ┌───────────┘      │      └───────────┬───────────────────────────────┬───────────────────────────────┬───────────────────────────────┐
        //  │                │                  │                  │                               │                               │                               │                │
        //                   │                  │                  │                               │                               │                               │
        //  │                │                  │                  │                               │                               │                               │                │
        //    ProPhotoRGB───────────────────┐   │   SRGB──────────────────────────┐ DisplayP3─────────────────────┐ A98RGB────────────────────────┐ Rec2020───────────────────────┐
        //  │ │           ┌────────────────┐│   │   │           ┌────────────────┐│ │           ┌────────────────┐│ │           ┌────────────────┐│ │           ┌────────────────┐│ │
        //    │     ┌─────▶︎ LinearExtended ││   │   │     ┌─────▶︎ LinearExtended ││ │     ┌─────▶︎ LinearExtended ││ │     ┌─────▶︎ LinearExtended ││ │     ┌─────▶︎ LinearExtended ││
        //  │ │     │     └────────▲───────┘│   │   │     │     └────────▲───────┘│ │     │     └────────▲───────┘│ │     │     └────────▲───────┘│ │     │     └────────▲───────┘│ │
        //   ─│─ ─ ─│─ ─ ─ ─ ─ ─ ─ ┼ ─ ─ ─ ─│─ ─│─ ─│─ ─ ─│─ ─ ─ ─ ─ ─ ─ ┼ ─ ─ ─ ─│─│─ ─ ─│─ ─ ─ ─ ─ ─ ─ ┼ ─ ─ ─ ─│─│─ ─ ─│─ ─ ─ ─ ─ ─ ─ ┼ ─ ─ ─ ─│─│─ ─ ─│─ ─ ─ ─ ─ ─ ─ ┼ ─ ─ ─ ─│─

        // This handles conversions between extended linear color types that can be converted using pre-defined
        // 3x3 matrices.
        
        // FIXME: Pre-compute (using constexpr) the concatenation of the matrices prior to applying them
        // to reduce number of matrix multiplications to a minimum. This will likely give subtly different
        // results (due to floating point effects) so if this optimization is considered we should ensure we
        // have sufficient testing coverage to notice any adverse effects.

        auto applyMatrices = [](const Input& color, auto... matrices) {
            return makeFromComponents<Output>(applyMatricesToColorComponents(asColorComponents(color.resolved()), matrices...));
        };

        if constexpr (Input::whitePoint == Output::whitePoint) {
            if constexpr (IsXYZA<Input>)
                return applyMatrices(color, Output::xyzToLinear);
            else if constexpr (IsXYZA<Output>)
                return applyMatrices(color, Input::linearToXYZ);
            else
                return applyMatrices(color, Input::linearToXYZ, Output::xyzToLinear);
        } else {
            if constexpr (IsXYZA<Input> && IsXYZA<Output>)
                return applyMatrices(color, ChromaticAdaptation<Input::whitePoint, Output::whitePoint>::matrix);
            else if constexpr (IsXYZA<Input>)
                return applyMatrices(color, ChromaticAdaptation<Input::whitePoint, Output::whitePoint>::matrix, Output::xyzToLinear);
            else if constexpr (IsXYZA<Output>)
                return applyMatrices(color, Input::linearToXYZ, ChromaticAdaptation<Input::whitePoint, Output::whitePoint>::matrix);
            else
                return applyMatrices(color, Input::linearToXYZ, ChromaticAdaptation<Input::whitePoint, Output::whitePoint>::matrix, Output::xyzToLinear);
        }
    }
};

} // namespace WebCore

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
