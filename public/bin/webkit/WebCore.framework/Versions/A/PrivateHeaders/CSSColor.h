/*
 * Copyright (C) 2008-2021 Apple Inc. All rights reserved.
 * Copyright (C) 2024 Samuel Weinig <sam@webkit.org>
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

#include "CSSColorDescriptors.h"
#include "CSSHexColor.h"
#include "CSSKeywordColor.h"
#include "CSSResolvedColor.h"
#include "CSSValueTypes.h"
#include <variant>
#include <wtf/Markable.h>

namespace WebCore {
namespace CSS {

// The following color kinds are forward declared and stored in UniqueRefs to
// avoid unnecessarily growing the size of Color for the uncommon cases.
struct ColorLayers;
struct ColorMix;
struct ContrastColor;
struct LightDarkColor;
template<typename Descriptor> struct AbsoluteColor;
template<typename Descriptor> struct RelativeColor;

struct Color {
private:
    struct EmptyToken { constexpr bool operator==(const EmptyToken&) const = default; };

    // FIXME: Replace std::variant with a generic CompactPointerVariant type.
    using ColorKind = std::variant<
        EmptyToken, // Special value used by Markable to represent empty state.
        ResolvedColor,
        KeywordColor,
        HexColor,
        UniqueRef<ColorLayers>,
        UniqueRef<ColorMix>,
        UniqueRef<ContrastColor>,
        UniqueRef<LightDarkColor>,
        UniqueRef<AbsoluteColor<RGBFunctionLegacy<Number<>>>>,
        UniqueRef<AbsoluteColor<RGBFunctionLegacy<Percentage<>>>>,
        UniqueRef<AbsoluteColor<RGBFunctionModernAbsolute>>,
        UniqueRef<AbsoluteColor<HSLFunctionLegacy>>,
        UniqueRef<AbsoluteColor<HSLFunctionModern>>,
        UniqueRef<AbsoluteColor<HWBFunction>>,
        UniqueRef<AbsoluteColor<LabFunction>>,
        UniqueRef<AbsoluteColor<LCHFunction>>,
        UniqueRef<AbsoluteColor<OKLabFunction>>,
        UniqueRef<AbsoluteColor<OKLCHFunction>>,
        UniqueRef<AbsoluteColor<ColorRGBFunction<ExtendedA98RGB<float>>>>,
        UniqueRef<AbsoluteColor<ColorRGBFunction<ExtendedDisplayP3<float>>>>,
        UniqueRef<AbsoluteColor<ColorRGBFunction<ExtendedProPhotoRGB<float>>>>,
        UniqueRef<AbsoluteColor<ColorRGBFunction<ExtendedRec2020<float>>>>,
        UniqueRef<AbsoluteColor<ColorRGBFunction<ExtendedSRGBA<float>>>>,
        UniqueRef<AbsoluteColor<ColorRGBFunction<ExtendedLinearSRGBA<float>>>>,
        UniqueRef<AbsoluteColor<ColorXYZFunction<XYZA<float, WhitePoint::D50>>>>,
        UniqueRef<AbsoluteColor<ColorXYZFunction<XYZA<float, WhitePoint::D65>>>>,
        UniqueRef<RelativeColor<RGBFunctionModernRelative>>,
        UniqueRef<RelativeColor<HSLFunctionModern>>,
        UniqueRef<RelativeColor<HWBFunction>>,
        UniqueRef<RelativeColor<LabFunction>>,
        UniqueRef<RelativeColor<LCHFunction>>,
        UniqueRef<RelativeColor<OKLabFunction>>,
        UniqueRef<RelativeColor<OKLCHFunction>>,
        UniqueRef<RelativeColor<ColorRGBFunction<ExtendedA98RGB<float>>>>,
        UniqueRef<RelativeColor<ColorRGBFunction<ExtendedDisplayP3<float>>>>,
        UniqueRef<RelativeColor<ColorRGBFunction<ExtendedProPhotoRGB<float>>>>,
        UniqueRef<RelativeColor<ColorRGBFunction<ExtendedRec2020<float>>>>,
        UniqueRef<RelativeColor<ColorRGBFunction<ExtendedSRGBA<float>>>>,
        UniqueRef<RelativeColor<ColorRGBFunction<ExtendedLinearSRGBA<float>>>>,
        UniqueRef<RelativeColor<ColorXYZFunction<XYZA<float, WhitePoint::D50>>>>,
        UniqueRef<RelativeColor<ColorXYZFunction<XYZA<float, WhitePoint::D65>>>>
    >;

    explicit Color(EmptyToken);
    explicit Color(ColorKind&&);

public:
    explicit Color(ResolvedColor&&);
    explicit Color(KeywordColor&&);
    explicit Color(HexColor&&);
    explicit Color(ColorLayers&&);
    explicit Color(ColorMix&&);
    explicit Color(ContrastColor&&);
    explicit Color(LightDarkColor&&);
    explicit Color(AbsoluteColor<RGBFunctionLegacy<Number<>>>&&);
    explicit Color(AbsoluteColor<RGBFunctionLegacy<Percentage<>>>&&);
    explicit Color(AbsoluteColor<RGBFunctionModernAbsolute>&&);
    explicit Color(AbsoluteColor<HSLFunctionLegacy>&&);
    explicit Color(AbsoluteColor<HSLFunctionModern>&&);
    explicit Color(AbsoluteColor<HWBFunction>&&);
    explicit Color(AbsoluteColor<LabFunction>&&);
    explicit Color(AbsoluteColor<LCHFunction>&&);
    explicit Color(AbsoluteColor<OKLabFunction>&&);
    explicit Color(AbsoluteColor<OKLCHFunction>&&);
    explicit Color(AbsoluteColor<ColorRGBFunction<ExtendedA98RGB<float>>>&&);
    explicit Color(AbsoluteColor<ColorRGBFunction<ExtendedDisplayP3<float>>>&&);
    explicit Color(AbsoluteColor<ColorRGBFunction<ExtendedProPhotoRGB<float>>>&&);
    explicit Color(AbsoluteColor<ColorRGBFunction<ExtendedRec2020<float>>>&&);
    explicit Color(AbsoluteColor<ColorRGBFunction<ExtendedSRGBA<float>>>&&);
    explicit Color(AbsoluteColor<ColorRGBFunction<ExtendedLinearSRGBA<float>>>&&);
    explicit Color(AbsoluteColor<ColorXYZFunction<XYZA<float, WhitePoint::D50>>>&&);
    explicit Color(AbsoluteColor<ColorXYZFunction<XYZA<float, WhitePoint::D65>>>&&);
    explicit Color(RelativeColor<RGBFunctionModernRelative>&&);
    explicit Color(RelativeColor<HSLFunctionModern>&&);
    explicit Color(RelativeColor<HWBFunction>&&);
    explicit Color(RelativeColor<LabFunction>&&);
    explicit Color(RelativeColor<LCHFunction>&&);
    explicit Color(RelativeColor<OKLabFunction>&&);
    explicit Color(RelativeColor<OKLCHFunction>&&);
    explicit Color(RelativeColor<ColorRGBFunction<ExtendedA98RGB<float>>>&&);
    explicit Color(RelativeColor<ColorRGBFunction<ExtendedDisplayP3<float>>>&&);
    explicit Color(RelativeColor<ColorRGBFunction<ExtendedProPhotoRGB<float>>>&&);
    explicit Color(RelativeColor<ColorRGBFunction<ExtendedRec2020<float>>>&&);
    explicit Color(RelativeColor<ColorRGBFunction<ExtendedSRGBA<float>>>&&);
    explicit Color(RelativeColor<ColorRGBFunction<ExtendedLinearSRGBA<float>>>&&);
    explicit Color(RelativeColor<ColorXYZFunction<XYZA<float, WhitePoint::D50>>>&&);
    explicit Color(RelativeColor<ColorXYZFunction<XYZA<float, WhitePoint::D65>>>&&);

    Color(const Color&);
    Color& operator=(const Color&);
    Color(Color&&);
    Color& operator=(Color&&);

    ~Color();

    bool operator==(const Color&) const;

    bool isResolved() const;
    std::optional<ResolvedColor> resolved() const;
    bool isKeyword() const;
    std::optional<KeywordColor> keyword() const;
    bool isHex() const;
    std::optional<HexColor> hex() const;

    // Return an absolute color if possible, otherwise an invalid color.
    // https://drafts.csswg.org/css-color-5/#absolute-color
    WebCore::Color absoluteColor() const;

    // This helper allows us to treat all the alternatives in ColorKind
    // as const references, pretending the UniqueRefs don't exist.
    template<typename... F> decltype(auto) switchOn(F&&...) const;

    struct MarkableTraits {
        static bool isEmptyValue(const Color&);
        static Color emptyValue();
    };

private:
    template<typename T>
    static ColorKind makeIndirectColor(T&&);
    static ColorKind copy(const ColorKind&);

    ColorKind value;
};

WebCore::Color createColor(const Color&, PlatformColorResolutionState&);
bool containsCurrentColor(const Color&);
bool containsColorSchemeDependentColor(const Color&);

template<> struct Serialize<Color> { void operator()(StringBuilder&, const Color&); };
template<> struct ComputedStyleDependenciesCollector<Color> { void operator()(ComputedStyleDependencies&, const Color&); };
template<> struct CSSValueChildrenVisitor<Color> { IterationStatus operator()(const Function<IterationStatus(CSSValue&)>&, const Color&); };

template<typename... F> decltype(auto) Color::switchOn(F&&... f) const
{
    auto visitor = WTF::makeVisitor(std::forward<F>(f)...);
    using ResultType = decltype(visitor(std::declval<KeywordColor>()));

    return WTF::switchOn(value,
        [&](const EmptyToken&) -> ResultType {
            RELEASE_ASSERT_NOT_REACHED();
        },
        [&]<typename T>(const T& color) -> ResultType {
            return visitor(color);
        },
        [&]<typename T>(const UniqueRef<T>& color) -> ResultType {
            return visitor(color.get());
        }
    );
}

} // namespace CSS
} // namespace WebCore

template<> inline constexpr auto WebCore::TreatAsVariantLike<WebCore::CSS::Color> = true;
