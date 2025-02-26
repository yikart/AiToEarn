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

#include "ColorComponents.h"
#include "ColorMatrix.h"
#include "ColorModels.h"
#include "ColorTransferFunctions.h"
#include <optional>

namespace WebCore {

enum class WhitePoint { D50, D65 };

template<typename, typename> struct BoundedGammaEncoded;
template<typename, typename> struct BoundedLinearEncoded;
template<typename, typename> struct ExtendedGammaEncoded;
template<typename, typename> struct ExtendedLinearEncoded;
template<typename> struct HSLA;
template<typename> struct HWBA;
template<typename> struct LCHA;
template<typename> struct Lab;
template<typename> struct OKLCHA;
template<typename> struct OKLab;
template<typename, WhitePoint> struct XYZA;

// MARK: Make functions.

template<typename, typename = void> inline constexpr bool HasCanonicalTypeMember = false;
template<typename T> inline constexpr bool HasCanonicalTypeMember<T, std::void_t<typename T::CanonicalType>> = true;

template<typename ColorType, bool hasCononicalType> struct CanonicalColorTypeHelper { using type = ColorType; };
template<typename ColorType> struct CanonicalColorTypeHelper<ColorType, true> { using type = typename ColorType::CanonicalType; };

template<typename ColorType> using CanonicalColorType = typename CanonicalColorTypeHelper<ColorType, HasCanonicalTypeMember<ColorType>>::type;

template<typename ColorType, typename T> constexpr auto makeFromComponents(const ColorComponents<T, 4>& c)
{
    return CanonicalColorType<ColorType> { c[0], c[1], c[2], c[3] };
}

template<typename ColorType, unsigned Index, typename T> constexpr auto clampedComponent(T c) -> typename ColorType::ComponentType
{
    static_assert(std::is_integral_v<T>);

    constexpr auto componentInfo = ColorType::Model::componentInfo[Index];
    return std::clamp<T>(c, componentInfo.min, componentInfo.max);
}

template<typename ColorType, unsigned Index> constexpr float clampedComponent(float c)
{
    constexpr auto componentInfo = ColorType::Model::componentInfo[Index];

    if constexpr (componentInfo.type == ColorComponentType::Angle)
        return std::fmod(std::fmod(c, 360.0) + 360.0, 360.0);

    if constexpr (componentInfo.min == -std::numeric_limits<float>::infinity() && componentInfo.max == std::numeric_limits<float>::infinity())
        return c;

    if constexpr (componentInfo.min == -std::numeric_limits<float>::infinity())
        return std::min(c, componentInfo.max);

    if constexpr (componentInfo.max == std::numeric_limits<float>::infinity())
        return std::max(c, componentInfo.min);

    return std::clamp(c, componentInfo.min, componentInfo.max);
}

template<typename ColorType, unsigned Index, typename T> constexpr T clampedComponent(const ColorComponents<T, 4>& c)
{
    return clampedComponent<ColorType, Index>(c[Index]);
}

template<typename T, typename ComponentType = T> constexpr ComponentType clampedAlpha(T alpha)
{
    return std::clamp<T>(alpha, AlphaTraits<ComponentType>::transparent, AlphaTraits<ComponentType>::opaque);
}

template<typename ColorType, typename T> constexpr ColorComponents<T, 4> clampedComponents(const ColorComponents<T, 4>& components)
{
    return { clampedComponent<ColorType, 0>(components), clampedComponent<ColorType, 1>(components), clampedComponent<ColorType, 2>(components), clampedAlpha(components[3]) };
}

template<typename ColorType, typename T> constexpr ColorComponents<T, 4> clampedComponentsExceptAlpha(const ColorComponents<T, 4>& components)
{
    return { clampedComponent<ColorType, 0>(components), clampedComponent<ColorType, 1>(components), clampedComponent<ColorType, 2>(components), components[3] };
}

template<typename ColorType, typename T> constexpr auto makeFromComponentsClamping(const ColorComponents<T, 4>& components)
{
    return makeFromComponents<ColorType>(clampedComponents<ColorType>(components));
}

template<typename ColorType, typename T> constexpr auto makeFromComponentsClamping(T c1, T c2, T c3)
{
    return makeFromComponents<ColorType>(ColorComponents { clampedComponent<ColorType, 0>(c1), clampedComponent<ColorType, 1>(c2), clampedComponent<ColorType, 2>(c3), AlphaTraits<typename ColorType::ComponentType>::opaque });
}

template<typename ColorType, typename T> constexpr auto makeFromComponentsClamping(T c1, T c2, T c3, T alpha)
{
    return makeFromComponents<ColorType>(ColorComponents { clampedComponent<ColorType, 0>(c1), clampedComponent<ColorType, 1>(c2), clampedComponent<ColorType, 2>(c3), clampedAlpha<T, typename ColorType::ComponentType>(alpha) });
}

template<typename ColorType, typename T> constexpr auto makeFromComponentsClampingExceptAlpha(const ColorComponents<T, 4>& components)
{
    return makeFromComponents<ColorType>(clampedComponentsExceptAlpha<ColorType>(components));
}

template<typename ColorType, typename T, typename Alpha> constexpr auto makeFromComponentsClampingExceptAlpha(T c1, T c2, T c3, Alpha alpha)
{
    return makeFromComponents<ColorType>(ColorComponents { clampedComponent<ColorType, 0>(c1), clampedComponent<ColorType, 1>(c2), clampedComponent<ColorType, 2>(c3), alpha });
}

#if ASSERT_ENABLED

template<typename ColorType, typename std::enable_if_t<std::is_same_v<typename ColorType::ComponentType, float>>* = nullptr>
constexpr void assertInRange(ColorType color)
{
    auto components = asColorComponents(color.unresolved());
    for (unsigned i = 0; i < 3; ++i) {
        if (isNaNConstExpr(components[i]))
            continue;
        ASSERT_WITH_MESSAGE(components[i] >= ColorType::Model::componentInfo[i].min, "Component at index %d is %f and is less than the allowed minimum %f", i,  components[i], ColorType::Model::componentInfo[i].min);
        ASSERT_WITH_MESSAGE(components[i] <= ColorType::Model::componentInfo[i].max, "Component at index %d is %f and is greater than the allowed maximum %f", i,  components[i], ColorType::Model::componentInfo[i].max);
    }
    if (!isNaNConstExpr(components[3])) {
        ASSERT_WITH_MESSAGE(components[3] >= AlphaTraits<typename ColorType::ComponentType>::transparent, "Alpha is %f and is less than the allowed minimum (transparent) %f", components[3], AlphaTraits<typename ColorType::ComponentType>::transparent);
        ASSERT_WITH_MESSAGE(components[3] <= AlphaTraits<typename ColorType::ComponentType>::opaque, "Alpha is %f and is greater than the allowed maximum (opaque) %f", components[3], AlphaTraits<typename ColorType::ComponentType>::opaque);
    }
}

template<typename ColorType, typename std::enable_if_t<std::is_same_v<typename ColorType::ComponentType, uint8_t>>* = nullptr>
constexpr void assertInRange(ColorType)
{
}

#else

template<typename T> constexpr void assertInRange(T)
{
}

#endif

template<typename, typename = void> inline constexpr bool IsConvertibleToColorComponents = false;
template<typename T> inline constexpr bool IsConvertibleToColorComponents<T, std::void_t<decltype(asColorComponents(std::declval<T>().unresolved()))>> = true;

template<typename, typename = void> inline constexpr bool HasComponentTypeMember = false;
template<typename T> inline constexpr bool HasComponentTypeMember<T, std::void_t<typename T::ComponentType>> = true;

template<typename T, typename U, bool enabled> inline constexpr bool HasComponentTypeValue = false;
template<typename T, typename U> inline constexpr bool HasComponentTypeValue<T, U, true> = std::is_same_v<typename T::ComponentType, U>;
template<typename T, typename U> inline constexpr bool HasComponentType = HasComponentTypeValue<T, U, HasComponentTypeMember<T>>;

template<typename T> inline constexpr bool IsColorType = IsConvertibleToColorComponents<T> && HasComponentTypeMember<T>;
template<typename T, typename U> inline constexpr bool IsColorTypeWithComponentType = IsConvertibleToColorComponents<T> && HasComponentType<T, U>;

template<template<typename> class ColorType, typename Replacement> struct ColorTypeReplacingComponentTypeHelper { using type = ColorType<Replacement>; };
template<template<typename> class ColorType, typename Replacement> using ColorTypeReplacingComponentType = typename ColorTypeReplacingComponentTypeHelper<ColorType, Replacement>::type;

template<typename Parent> struct ColorWithAlphaHelper {
    // Helper to allow convenient syntax for working with color types.
    // e.g. auto yellowWith50PercentAlpha = Color::yellow.colorWithAlphaByte(128);
    constexpr Parent colorWithAlphaByte(uint8_t overrideAlpha) const
    {
        static_assert(std::is_same_v<typename Parent::ComponentType, uint8_t>, "Only uint8_t based color types are supported.");

        auto copy = static_cast<const Parent*>(this)->unresolved();
        copy.alpha = overrideAlpha;
        return copy;
    }
};


template<typename ColorType, typename std::enable_if_t<IsConvertibleToColorComponents<ColorType>>* = nullptr>
constexpr bool operator==(const ColorType& a, const ColorType& b)
{
    return asColorComponents(a.unresolved()) == asColorComponents(b.unresolved());
}


// MARK: - RGB Color Types.

template<typename T, typename D, typename ColorType, typename M, typename TF> struct RGBAType : ColorWithAlphaHelper<ColorType> {
    using ComponentType = T;
    using Model = M;
    using TransferFunction = TF;
    using Descriptor = D;
    static constexpr auto whitePoint = D::whitePoint;

    constexpr RGBAType(T red, T green, T blue, T alpha = AlphaTraits<T>::opaque)
        : red { red }
        , green { green }
        , blue { blue }
        , alpha { alpha }
    {
        assertInRange(*static_cast<const ColorType*>(this));
    }

    constexpr RGBAType()
        : RGBAType { 0, 0, 0, 0 }
    {
    }

    constexpr auto resolved() const { return resolvedColor(*static_cast<const ColorType*>(this)); }
    constexpr auto unresolved() const { return unresolvedColor(*static_cast<const ColorType*>(this)); }

protected:
    T red;
    T green;
    T blue;
    T alpha;
};

template<typename T, typename D>
struct BoundedGammaEncoded : RGBAType<T, D, BoundedGammaEncoded<T, D>, RGBModel<T, RGBBoundedness::Bounded>, typename D::template TransferFunction<T, TransferFunctionMode::Clamped>> {
    using RGBAType<T, D, BoundedGammaEncoded<T, D>, RGBModel<T, RGBBoundedness::Bounded>, typename D::template TransferFunction<T, TransferFunctionMode::Clamped>>::RGBAType;

    using LinearCounterpart = BoundedLinearEncoded<T, D>;
    using ExtendedCounterpart = ExtendedGammaEncoded<T, D>;
    
    template<typename Replacement> using SelfWithReplacementComponent = BoundedGammaEncoded<Replacement, D>;
};

template<typename T, typename D>
struct BoundedLinearEncoded : RGBAType<T, D, BoundedLinearEncoded<T, D>, RGBModel<T, RGBBoundedness::Bounded>, typename D::template TransferFunction<T, TransferFunctionMode::Clamped>> {
    using RGBAType<T, D, BoundedLinearEncoded<T, D>, RGBModel<T, RGBBoundedness::Bounded>, typename D::template TransferFunction<T, TransferFunctionMode::Clamped>>::RGBAType;

    static constexpr auto linearToXYZ = D::linearToXYZ;
    static constexpr auto xyzToLinear = D::xyzToLinear;

    using GammaEncodedCounterpart = BoundedGammaEncoded<T, D>;
    using ExtendedCounterpart = ExtendedLinearEncoded<T, D>;

    template<typename Replacement> using SelfWithReplacementComponent = BoundedLinearEncoded<Replacement, D>;
};

template<typename T, typename D>
struct ExtendedGammaEncoded : RGBAType<T, D, ExtendedGammaEncoded<T, D>, RGBModel<T, RGBBoundedness::Extended>, typename D::template TransferFunction<T, TransferFunctionMode::Unclamped>> {
    using RGBAType<T, D, ExtendedGammaEncoded<T, D>, RGBModel<T, RGBBoundedness::Extended>, typename D::template TransferFunction<T, TransferFunctionMode::Unclamped>>::RGBAType;

    using LinearCounterpart = ExtendedLinearEncoded<T, D>;
    using BoundedCounterpart = BoundedGammaEncoded<T, D>;
    using Reference = LinearCounterpart;
};

template<typename T, typename D>
struct ExtendedLinearEncoded : RGBAType<T, D, ExtendedLinearEncoded<T, D>, RGBModel<T, RGBBoundedness::Extended>, typename D::template TransferFunction<T, TransferFunctionMode::Unclamped>> {
    using RGBAType<T, D, ExtendedLinearEncoded<T, D>, RGBModel<T, RGBBoundedness::Extended>, typename D::template TransferFunction<T, TransferFunctionMode::Unclamped>>::RGBAType;

    static constexpr auto linearToXYZ = D::linearToXYZ;
    static constexpr auto xyzToLinear = D::xyzToLinear;

    using GammaEncodedCounterpart = ExtendedGammaEncoded<T, D>;
    using BoundedCounterpart = BoundedLinearEncoded<T, D>;
    using Reference = XYZA<T, D::whitePoint>;
};

template<typename, typename = void> inline constexpr bool HasDescriptorMember = false;
template<typename ColorType> inline constexpr bool HasDescriptorMember<ColorType, std::void_t<typename ColorType::Descriptor>> = true;

template<typename, typename = void> inline constexpr bool HasExtendedCounterpartMember = false;
template<typename ColorType> inline constexpr bool HasExtendedCounterpartMember<ColorType, std::void_t<typename ColorType::ExtendedCounterpart>> = true;

template<typename, typename = void> inline constexpr bool HasBoundedCounterpartMember = false;
template<typename ColorType> inline constexpr bool HasBoundedCounterpartMember<ColorType, std::void_t<typename ColorType::BoundedCounterpart>> = true;

template<typename, typename = void> inline constexpr bool HasGammaEncodedCounterpartMember = false;
template<typename ColorType> inline constexpr bool HasGammaEncodedCounterpartMember<ColorType, std::void_t<typename ColorType::GammaEncodedCounterpart>> = true;

template<typename, typename = void> inline constexpr bool HasLinearCounterpartMember = false;
template<typename ColorType> inline constexpr bool HasLinearCounterpartMember<ColorType, std::void_t<typename ColorType::LinearCounterpart>> = true;

template<typename, typename = void> inline constexpr bool HasSelfWithReplacementComponentMember = false;
template<typename ColorType> inline constexpr bool HasSelfWithReplacementComponentMember<ColorType, std::void_t<typename ColorType::SelfWithReplacementComponent>> = true;

template<typename ColorType, typename Replacement> using ColorTypeWithReplacementComponent = typename ColorType::template SelfWithReplacementComponent<Replacement>;

template<typename ColorType> inline constexpr bool IsRGBType = HasDescriptorMember<ColorType>;
template<typename ColorType> inline constexpr bool IsRGBExtendedType = IsRGBType<ColorType> && HasBoundedCounterpartMember<ColorType>;
template<typename ColorType> inline constexpr bool IsRGBBoundedType = IsRGBType<ColorType> && HasExtendedCounterpartMember<ColorType>;
template<typename ColorType> inline constexpr bool IsRGBGammaEncodedType = IsRGBType<ColorType> && HasLinearCounterpartMember<ColorType>;
template<typename ColorType> inline constexpr bool IsRGBLinearEncodedType = IsRGBType<ColorType> && HasGammaEncodedCounterpartMember<ColorType>;

template<typename ColorType1, typename ColorType2, bool enabled> inline constexpr bool IsSameRGBTypeFamilyValue = false;
template<typename ColorType1, typename ColorType2> inline constexpr bool IsSameRGBTypeFamilyValue<ColorType1, ColorType2, true> = std::is_same_v<typename ColorType1::Descriptor, typename ColorType2::Descriptor>;
template<typename ColorType1, typename ColorType2> inline constexpr bool IsSameRGBTypeFamily = IsSameRGBTypeFamilyValue<ColorType1, ColorType2, IsRGBType<ColorType1> && IsRGBType<ColorType2>>;

template<typename BoundedColorType> constexpr bool inGamut(typename BoundedColorType::ComponentType component)
{
    static_assert(IsRGBBoundedType<BoundedColorType>);

    return component >= 0.0f && component <= 1.0f;
}

template<typename BoundedColorType> constexpr bool inGamut(ColorComponents<typename BoundedColorType::ComponentType, 4> components)
{
    static_assert(IsRGBBoundedType<BoundedColorType>);

    return inGamut<BoundedColorType>(components[0]) && inGamut<BoundedColorType>(components[1]) && inGamut<BoundedColorType>(components[2]);
}

template<typename BoundedColorType, typename ColorType> constexpr bool inGamut(ColorType color)
{
    static_assert(IsRGBBoundedType<BoundedColorType>);
    static_assert(std::is_same_v<BoundedColorType, typename ColorType::BoundedCounterpart>);

    return inGamut<BoundedColorType>(asColorComponents(color.resolved()));
}

template<typename BoundedColorType, typename ColorType> constexpr std::optional<BoundedColorType> colorIfInGamut(ColorType color)
{
    static_assert(IsRGBBoundedType<BoundedColorType>);
    static_assert(std::is_same_v<BoundedColorType, typename ColorType::BoundedCounterpart>);

    auto components = asColorComponents(color.resolved());
    if (!inGamut<BoundedColorType>(components))
        return std::nullopt;
    return makeFromComponents<BoundedColorType>(components);
}

template<typename BoundedColorType, typename ColorType> constexpr BoundedColorType clipToGamut(ColorType color)
{
    static_assert(IsRGBBoundedType<BoundedColorType>);
    static_assert(std::is_same_v<BoundedColorType, typename ColorType::BoundedCounterpart>);

    return makeFromComponentsClampingExceptAlpha<BoundedColorType>(asColorComponents(color.resolved()));
}

struct SRGBADescriptor {
    template<typename T, TransferFunctionMode Mode> using TransferFunction = SRGBTransferFunction<T, Mode>;
    static constexpr auto whitePoint = WhitePoint::D65;

    // https://drafts.csswg.org/css-color/#color-conversion-code
    static constexpr ColorMatrix<3, 3> xyzToLinear {
          12831.0 /    3959.0,    -329.0 /    214.0,   -1974.0 /    3959.0,
        -851781.0 /  878810.0, 1648619.0 / 878810.0,   36519.0 /  878810.0,
            705.0 /   12673.0,   -2585.0 /  12673.0,     705.0 /     667.0,
    };
    static constexpr ColorMatrix<3, 3> linearToXYZ {
         506752.0 / 1228815.0,   87881.0 / 245763.0,   12673.0 /   70218.0,
          87098.0 /  409605.0,  175762.0 / 245763.0,   12673.0 /  175545.0,
           7918.0 /  409605.0,   87881.0 / 737289.0, 1001167.0 / 1053270.0,
    };
};

template<typename T> using SRGBA = BoundedGammaEncoded<T, SRGBADescriptor>;
template<typename T> using LinearSRGBA = BoundedLinearEncoded<T, SRGBADescriptor>;
template<typename T> using ExtendedSRGBA = ExtendedGammaEncoded<T, SRGBADescriptor>;
template<typename T> using ExtendedLinearSRGBA = ExtendedLinearEncoded<T, SRGBADescriptor>;


struct A98RGBDescriptor {
    template<typename T, TransferFunctionMode Mode> using TransferFunction = A98RGBTransferFunction<T, Mode>;
    static constexpr auto whitePoint = WhitePoint::D65;

    // https://drafts.csswg.org/css-color/#color-conversion-code
    static constexpr ColorMatrix<3, 3> xyzToLinear {
        1829569.0 /  896150.0, -506331.0 /  896150.0, -308931.0 /  896150.0,
        -851781.0 /  878810.0, 1648619.0 /  878810.0,   36519.0 /  878810.0,
          16779.0 / 1248040.0, -147721.0 / 1248040.0, 1266979.0 / 1248040.0,
    };
    static constexpr ColorMatrix<3, 3> linearToXYZ {
         573536.0 /  994567.0,  263643.0 / 1420810.0,  187206.0 /  994567.0,
         591459.0 / 1989134.0, 6239551.0 / 9945670.0,  374412.0 / 4972835.0,
          53769.0 / 1989134.0,  351524.0 / 4972835.0, 4929758.0 / 4972835.0,
    };
};

template<typename T> using A98RGB = BoundedGammaEncoded<T, A98RGBDescriptor>;
template<typename T> using LinearA98RGB = BoundedLinearEncoded<T, A98RGBDescriptor>;
template<typename T> using ExtendedA98RGB = ExtendedGammaEncoded<T, A98RGBDescriptor>;
template<typename T> using ExtendedLinearA98RGB = ExtendedLinearEncoded<T, A98RGBDescriptor>;


struct DisplayP3Descriptor {
    template<typename T, TransferFunctionMode Mode> using TransferFunction = SRGBTransferFunction<T, Mode>;
    static constexpr auto whitePoint = WhitePoint::D65;

    // https://drafts.csswg.org/css-color/#color-conversion-code
    static constexpr ColorMatrix<3, 3> xyzToLinear {
        446124.0 / 178915.0, -333277.0 / 357830.0,  -72051.0 /  178915.0,
        -14852.0 /  17905.0,   63121.0 /  35810.0,     423.0 /   17905.0,
         11844.0 / 330415.0,  -50337.0 / 660830.0,  316169.0 /  330415.0,
    };
    static constexpr ColorMatrix<3, 3> linearToXYZ {
        608311.0 / 1250200.0,  189793.0 / 714400.0,  198249.0 / 1000160.0,
         35783.0 /  156275.0,  247089.0 / 357200.0,  198249.0 / 2500400.0,
             0.0 /       1.0,   32229.0 / 714400.0, 5220557.0 / 5000800.0,
    };
};

template<typename T> using DisplayP3 = BoundedGammaEncoded<T, DisplayP3Descriptor>;
template<typename T> using LinearDisplayP3 = BoundedLinearEncoded<T, DisplayP3Descriptor>;
template<typename T> using ExtendedDisplayP3 = ExtendedGammaEncoded<T, DisplayP3Descriptor>;
template<typename T> using ExtendedLinearDisplayP3 = ExtendedLinearEncoded<T, DisplayP3Descriptor>;


struct ProPhotoRGBDescriptor {
    template<typename T, TransferFunctionMode Mode> using TransferFunction = ProPhotoRGBTransferFunction<T, Mode>;
    static constexpr auto whitePoint = WhitePoint::D50;

    // https://drafts.csswg.org/css-color/#color-conversion-code
    static constexpr ColorMatrix<3, 3> xyzToLinear {
         1.34578688164715830, -0.25557208737979464, -0.05110186497554526,
        -0.54463070512490190,  1.50824774284514680,  0.02052744743642139,
         0.00000000000000000,  0.00000000000000000,  1.21196754563894520
    };
    static constexpr ColorMatrix<3, 3> linearToXYZ {
         0.79776664490064230,  0.13518129740053308,  0.03134773412839220,
         0.28807482881940130,  0.71183523424187300,  0.00008993693872564,
         0.00000000000000000,  0.00000000000000000,  0.82510460251046020
    };
};

template<typename T> using ProPhotoRGB = BoundedGammaEncoded<T, ProPhotoRGBDescriptor>;
template<typename T> using LinearProPhotoRGB = BoundedLinearEncoded<T, ProPhotoRGBDescriptor>;
template<typename T> using ExtendedProPhotoRGB = ExtendedGammaEncoded<T, ProPhotoRGBDescriptor>;
template<typename T> using ExtendedLinearProPhotoRGB = ExtendedLinearEncoded<T, ProPhotoRGBDescriptor>;


struct Rec2020Descriptor {
    template<typename T, TransferFunctionMode Mode> using TransferFunction = Rec2020TransferFunction<T, Mode>;
    static constexpr auto whitePoint = WhitePoint::D65;

    // https://drafts.csswg.org/css-color/#color-conversion-code
    static constexpr ColorMatrix<3, 3> xyzToLinear {
         30757411.0 / 17917100.0,  -6372589.0 /  17917100.0,  -4539589.0 /  17917100.0,
        -19765991.0 / 29648200.0,  47925759.0 /  29648200.0,    467509.0 /  29648200.0,
           792561.0 / 44930125.0,  -1921689.0 /  44930125.0,  42328811.0 /  44930125.0,
    };
    static constexpr ColorMatrix<3, 3> linearToXYZ {
         63426534.0 / 99577255.0,  20160776.0 / 139408157.0,  47086771.0 / 278816314.0,
         26158966.0 / 99577255.0, 472592308.0 / 697040785.0,   8267143.0 / 139408157.0,
                0.0 /        1.0,  19567812.0 / 697040785.0, 295819943.0 / 278816314.0,
    };
};

template<typename T> using Rec2020 = BoundedGammaEncoded<T, Rec2020Descriptor>;
template<typename T> using LinearRec2020 = BoundedLinearEncoded<T, Rec2020Descriptor>;
template<typename T> using ExtendedRec2020 = ExtendedGammaEncoded<T, Rec2020Descriptor>;
template<typename T> using ExtendedLinearRec2020 = ExtendedLinearEncoded<T, Rec2020Descriptor>;


// MARK: - Lab Color Type.

template<typename T> struct Lab : ColorWithAlphaHelper<Lab<T>> {
    using ComponentType = T;
    using Model = LabModel<T>;
    static constexpr auto whitePoint = WhitePoint::D50;
    using Reference = XYZA<T, whitePoint>;

    constexpr Lab(T lightness, T a, T b, T alpha = AlphaTraits<T>::opaque)
        : lightness { lightness }
        , a { a }
        , b { b }
        , alpha { alpha }
    {
        assertInRange(*this);
    }

    constexpr Lab()
        : Lab { 0, 0, 0, 0 }
    {
    }

    constexpr auto resolved() const { return resolvedColor(*this); }
    constexpr auto unresolved() const { return unresolvedColor(*this); }

protected:
    T lightness;
    T a;
    T b;
    T alpha;
};

template<typename ColorType> inline constexpr bool IsLab = std::is_same_v<Lab<typename ColorType::ComponentType>, ColorType>;

// MARK: - LCHA Color Type.

template<typename T> struct LCHA : ColorWithAlphaHelper<LCHA<T>> {
    using ComponentType = T;
    using Model = LCHModel<T>;
    static constexpr auto whitePoint = WhitePoint::D50;
    using Reference = Lab<T>;

    constexpr LCHA(T lightness, T chroma, T hue, T alpha = AlphaTraits<T>::opaque)
        : lightness { lightness }
        , chroma { chroma }
        , hue { hue }
        , alpha { alpha }
    {
        assertInRange(*this);
    }

    constexpr LCHA()
        : LCHA { 0, 0, 0, 0 }
    {
    }

    constexpr auto resolved() const { return resolvedColor(*this); }
    constexpr auto unresolved() const { return unresolvedColor(*this); }

protected:
    T lightness;
    T chroma;
    T hue;
    T alpha;
};

template<typename ColorType> inline constexpr bool IsLCHA = std::is_same_v<LCHA<typename ColorType::ComponentType>, ColorType>;

// MARK: - OKLab Color Type.

template<typename T> struct OKLab : ColorWithAlphaHelper<OKLab<T>> {
    using ComponentType = T;
    using Model = OKLabModel<T>;
    static constexpr auto whitePoint = WhitePoint::D65;
    using Reference = XYZA<T, whitePoint>;

    constexpr OKLab(T lightness, T a, T b, T alpha = AlphaTraits<T>::opaque)
        : lightness { lightness }
        , a { a }
        , b { b }
        , alpha { alpha }
    {
        assertInRange(*this);
    }

    constexpr OKLab()
        : OKLab { 0, 0, 0, 0 }
    {
    }

    constexpr auto resolved() const { return resolvedColor(*this); }
    constexpr auto unresolved() const { return unresolvedColor(*this); }

protected:
    T lightness;
    T a;
    T b;
    T alpha;
};

template<typename ColorType> inline constexpr bool IsOKLab = std::is_same_v<OKLab<typename ColorType::ComponentType>, ColorType>;

// MARK: - OKLCHA Color Type.

template<typename T> struct OKLCHA : ColorWithAlphaHelper<OKLCHA<T>> {
    using ComponentType = T;
    using Model = OKLCHModel<T>;
    static constexpr auto whitePoint = WhitePoint::D65;
    using Reference = OKLab<T>;

    constexpr OKLCHA(T lightness, T chroma, T hue, T alpha = AlphaTraits<T>::opaque)
        : lightness { lightness }
        , chroma { chroma }
        , hue { hue }
        , alpha { alpha }
    {
        assertInRange(*this);
    }

    constexpr OKLCHA()
        : OKLCHA { 0, 0, 0, 0 }
    {
    }

    constexpr auto resolved() const { return resolvedColor(*this); }
    constexpr auto unresolved() const { return unresolvedColor(*this); }

protected:
    T lightness;
    T chroma;
    T hue;
    T alpha;
};

template<typename ColorType> inline constexpr bool IsOKLCHA = std::is_same_v<OKLCHA<typename ColorType::ComponentType>, ColorType>;


// MARK: - HSLA Color Type.

template<typename T> struct HSLA : ColorWithAlphaHelper<HSLA<T>> {
    using ComponentType = T;
    using Model = HSLModel<T>;
    static constexpr auto whitePoint = WhitePoint::D65;
    using Reference = ExtendedSRGBA<T>;

    constexpr HSLA(T hue, T saturation, T lightness, T alpha = AlphaTraits<T>::opaque)
        : hue { hue }
        , saturation { saturation }
        , lightness { lightness }
        , alpha { alpha }
    {
        assertInRange(*this);
    }

    constexpr HSLA()
        : HSLA { 0, 0, 0, 0 }
    {
    }

    constexpr auto resolved() const { return resolvedColor(*this); }
    constexpr auto unresolved() const { return unresolvedColor(*this); }

protected:
    T hue;
    T saturation;
    T lightness;
    T alpha;
};

template<typename ColorType> inline constexpr bool IsHSLA = std::is_same_v<HSLA<typename ColorType::ComponentType>, ColorType>;

// MARK: - HWBA Color Type.

template<typename T> struct HWBA : ColorWithAlphaHelper<HWBA<T>> {
    using ComponentType = T;
    using Model = HWBModel<T>;
    static constexpr auto whitePoint = WhitePoint::D65;
    using Reference = ExtendedSRGBA<T>;

    constexpr HWBA(T hue, T whiteness, T blackness, T alpha = AlphaTraits<T>::opaque)
        : hue { hue }
        , whiteness { whiteness }
        , blackness { blackness }
        , alpha { alpha }
    {
        assertInRange(*this);
    }

    constexpr HWBA()
        : HWBA { 0, 0, 0, 0 }
    {
    }

    constexpr auto resolved() const { return resolvedColor(*this); }
    constexpr auto unresolved() const { return unresolvedColor(*this); }

protected:
    T hue;
    T whiteness;
    T blackness;
    T alpha;
};

template<typename ColorType> inline constexpr bool IsHWBA = std::is_same_v<HWBA<typename ColorType::ComponentType>, ColorType>;

// MARK: - XYZ Color Type.

template<typename T, WhitePoint W> struct XYZA : ColorWithAlphaHelper<XYZA<T, W>> {
    using ComponentType = T;
    using Model = XYZModel<T>;
    using ReferenceXYZ = XYZA<T, W>;
    static constexpr auto whitePoint = W;

    constexpr XYZA(T x, T y, T z, T alpha = AlphaTraits<T>::opaque)
        : x { x }
        , y { y }
        , z { z }
        , alpha { alpha }
    {
        assertInRange(*this);
    }

    constexpr XYZA()
        : XYZA { 0, 0, 0, 0 }
    {
    }

    constexpr auto resolved() const { return resolvedColor(*this); }
    constexpr auto unresolved() const { return unresolvedColor(*this); }

protected:
    T x;
    T y;
    T z;
    T alpha;
};

template<typename ColorType> inline constexpr bool IsXYZA = std::is_same_v<XYZA<typename ColorType::ComponentType, ColorType::whitePoint>, ColorType>;

// Packed Color Formats

namespace PackedColor {

struct RGBA {
    constexpr explicit RGBA(uint32_t rgba)
        : value { rgba }
    {
    }

    constexpr explicit RGBA(ResolvedColorType<SRGBA<uint8_t>> color)
        : value { static_cast<uint32_t>(color.red << 24 | color.green << 16 | color.blue << 8 | color.alpha) }
    {
    }

    constexpr explicit RGBA(SRGBA<uint8_t> color)
        : RGBA { color.resolved() }
    {
    }

    uint32_t value;
};

struct ARGB {
    constexpr explicit ARGB(uint32_t argb)
        : value { argb }
    {
    }

    constexpr explicit ARGB(ResolvedColorType<SRGBA<uint8_t>> color)
        : value { static_cast<uint32_t>(color.alpha << 24 | color.red << 16 | color.green << 8 | color.blue) }
    {
    }

    constexpr explicit ARGB(SRGBA<uint8_t> color)
        : ARGB { color.resolved() }
    {
    }

    uint32_t value;
};

}

constexpr SRGBA<uint8_t> asSRGBA(PackedColor::RGBA color)
{
    return { static_cast<uint8_t>(color.value >> 24), static_cast<uint8_t>(color.value >> 16), static_cast<uint8_t>(color.value >> 8), static_cast<uint8_t>(color.value) };
}

constexpr SRGBA<uint8_t> asSRGBA(PackedColor::ARGB color)
{
    return { static_cast<uint8_t>(color.value >> 16), static_cast<uint8_t>(color.value >> 8), static_cast<uint8_t>(color.value), static_cast<uint8_t>(color.value >> 24) };
}

} // namespace WebCore
