/*
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
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "CSSCalcSymbolTable.h"
#include "CSSNoConversionDataRequiredToken.h"
#include "CSSValueTypes.h"
#include <optional>
#include <tuple>
#include <utility>
#include <variant>
#include <wtf/StdLibExtras.h>

namespace WebCore {

class CSSToLengthConversionData;
class RenderStyle;
struct BlendingContext;

namespace Style {

class BuilderState;

// Helper for declaring types in the Style namespace as Tuple-Like.
#define STYLE_TUPLE_LIKE_CONFORMANCE(t, numberOfArguments) \
    namespace std { \
        template<> class tuple_size<WebCore::Style::t> : public std::integral_constant<size_t, numberOfArguments> { }; \
        template<size_t I> class tuple_element<I, WebCore::Style::t> { \
        public: \
            using type = decltype(WebCore::Style::get<I>(std::declval<WebCore::Style::t>())); \
        }; \
    } \
    template<> inline constexpr bool WebCore::TreatAsTupleLike<WebCore::Style::t> = true; \
\

#define STYLE_SPACE_SEPARATED_TUPLE_LIKE_CONFORMANCE(t, numberOfArguments) \
    STYLE_TUPLE_LIKE_CONFORMANCE(t, numberOfArguments) \
    template<> inline constexpr ASCIILiteral WebCore::SerializationSeparator<WebCore::Style::t> = " "_s; \
\

#define STYLE_COMMA_SEPARATED_TUPLE_LIKE_CONFORMANCE(t, numberOfArguments) \
    STYLE_TUPLE_LIKE_CONFORMANCE(t, numberOfArguments) \
    template<> inline constexpr ASCIILiteral WebCore::SerializationSeparator<WebCore::Style::t> = ", "_s; \
\

// Types can specialize this and set the value to true to be treated as "non-converting"
// for css to style / style to css conversion algorithms. This means the type is identical
// for both CSS and Style systems (e.g. a constant value or an enum).
template<typename> inline constexpr bool TreatAsNonConverting = false;

// Types that are treated as "tuple-like" can have their conversion operations defined
// automatically by just defining their type mapping.
template<typename> struct ToStyleMapping;
template<typename> struct ToCSSMapping;

// Macro to define two-way mapping between a CSS and Style type. This is only needed
// for "tuple-like" types, in lieu of explicit ToCSS/ToStyle specializations.
#define DEFINE_TYPE_MAPPING(css, style) \
    template<> struct ToStyleMapping<css> { using type = style; }; \
    template<> struct ToCSSMapping<style> { using type = css; }; \

// All non-converting and non-tuple-like conforming types must implement the following for conversions:
//
//    template<> struct WebCore::Style::ToCSS<StyleType> {
//        CSSType operator()(const StyleType&, const RenderStyle&);
//    };
//
//    template<> struct WebCore::Style::ToStyle<CSSType> {
//        StyleType operator()(const CSSType&, const CSSToLengthConversionData&);
//        StyleType operator()(const CSSType&, const BuilderState&);
//        StyleType operator()(const CSSType&, NoConversionDataRequiredToken);
//    };

template<typename> struct ToCSS;
template<typename> struct ToStyle;

// MARK: Common Types.

// Specialize `TreatAsNonConverting` for `Constant<C>`, to indicate that its type does not change from the CSS representation.
template<CSSValueID C> inline constexpr bool TreatAsNonConverting<Constant<C>> = true;

// Specialize `TreatAsNonConverting` for `CustomIdentifier`, to indicate that its type does not change from the CSS representation.
template<> inline constexpr bool TreatAsNonConverting<CustomIdentifier> = true;


// MARK: - Conversion from "Style to "CSS"

// Conversion Invoker
template<typename StyleType, typename... Rest> decltype(auto) toCSS(const StyleType& styleType, const RenderStyle& style, Rest&&... rest)
{
    return ToCSS<StyleType>{}(styleType, style, std::forward<Rest>(rest)...);
}

// Conversion Utility Types
template<typename StyleType> using CSSType = std::decay_t<decltype(toCSS(std::declval<const StyleType&>(), std::declval<const RenderStyle&>()))>;

template<typename To, typename From, typename... Rest> auto toCSSOnTupleLike(const From& tupleLike, Rest&&... rest) -> To
{
    return WTF::apply([&](const auto& ...x) { return To { toCSS(x, rest...)... }; }, tupleLike);
}

// Standard Optional-Like type mappings:
template<typename T> struct ToCSSMapping<std::optional<T>> { using type = std::optional<CSSType<T>>; };
template<typename T> struct ToCSSMapping<WTF::Markable<T>> { using type = WTF::Markable<CSSType<T>>; };

// Standard Tuple-Like type mappings:
template<typename... Ts> struct ToCSSMapping<std::tuple<Ts...>> { using type = std::tuple<CSSType<Ts>...>; };
template<CSSValueID C, typename T> struct ToCSSMapping<FunctionNotation<C, T>> { using type = FunctionNotation<C, CSSType<T>>; };
template<typename T, size_t N> struct ToCSSMapping<SpaceSeparatedArray<T, N>> { using type = SpaceSeparatedArray<CSSType<T>, N>; };
template<typename T, size_t N> struct ToCSSMapping<CommaSeparatedArray<T, N>> { using type = CommaSeparatedArray<CSSType<T>, N>; };
template<typename... Ts> struct ToCSSMapping<SpaceSeparatedTuple<Ts...>> { using type = SpaceSeparatedTuple<CSSType<Ts>...>; };
template<typename... Ts> struct ToCSSMapping<CommaSeparatedTuple<Ts...>> { using type = CommaSeparatedTuple<CSSType<Ts>...>; };
template<typename T> struct ToCSSMapping<SpaceSeparatedPoint<T>> { using type = SpaceSeparatedPoint<CSSType<T>>; };
template<typename T> struct ToCSSMapping<SpaceSeparatedSize<T>> { using type = SpaceSeparatedSize<CSSType<T>>; };
template<typename T> struct ToCSSMapping<SpaceSeparatedRectEdges<T>> { using type = SpaceSeparatedRectEdges<CSSType<T>>; };
template<typename T> struct ToCSSMapping<MinimallySerializingSpaceSeparatedRectEdges<T>> { using type = MinimallySerializingSpaceSeparatedRectEdges<CSSType<T>>; };

// Standard Range-Like type mappings:
template<typename T, size_t N> struct ToCSSMapping<SpaceSeparatedVector<T, N>> { using type = SpaceSeparatedVector<CSSType<T>, N>; };
template<typename T, size_t N> struct ToCSSMapping<CommaSeparatedVector<T, N>> { using type = CommaSeparatedVector<CSSType<T>, N>; };

// Standard Variant-Like type mappings:
template<typename... Ts> struct ToCSSMapping<std::variant<Ts...>> { using type = std::variant<CSSType<Ts>...>; };

// Constrained for `TreatAsNonConverting`.
template<typename StyleType> requires (TreatAsNonConverting<StyleType>) struct ToCSS<StyleType> {
    constexpr StyleType operator()(const StyleType& value, const RenderStyle&)
    {
        return value;
    }
};

// Constrained for `TreatAsOptionalLike`.
template<typename StyleType> requires (TreatAsOptionalLike<StyleType>) struct ToCSS<StyleType> {
    using Result = typename ToCSSMapping<StyleType>::type;

    Result operator()(const StyleType& value, const RenderStyle& style)
    {
        if (value)
            return toCSS(*value, style);
        return std::nullopt;
    }
};

// Constrained for `TreatAsTupleLike`.
template<typename StyleType> requires (TreatAsTupleLike<StyleType>) struct ToCSS<StyleType> {
    using Result = typename ToCSSMapping<StyleType>::type;

    Result operator()(const StyleType& value, const RenderStyle& style)
    {
        return toCSSOnTupleLike<Result>(value, style);
    }
};

// Constrained for `TreatAsVariantLike`.
template<typename StyleType> requires (TreatAsVariantLike<StyleType>) struct ToCSS<StyleType> {
    using Result = typename ToCSSMapping<StyleType>::type;

    Result operator()(const StyleType& value, const RenderStyle& style)
    {
        return WTF::switchOn(value, [&](const auto& alternative) { return Result { toCSS(alternative, style) }; });
    }
};

// Specialization for `SpaceSeparatedVector`.
template<typename StyleType, size_t inlineCapacity> struct ToCSS<SpaceSeparatedVector<StyleType, inlineCapacity>> {
    using Result = SpaceSeparatedVector<CSSType<StyleType>, inlineCapacity>;

    Result operator()(const SpaceSeparatedVector<StyleType, inlineCapacity>& value, const RenderStyle& style)
    {
        return Result { value.value.template map<typename Result::Vector>([&](const auto& x) { return toCSS(x, style); }) };
    }
};

// Specialization for `CommaSeparatedVector`.
template<typename StyleType, size_t inlineCapacity> struct ToCSS<CommaSeparatedVector<StyleType, inlineCapacity>> {
    using Result = CommaSeparatedVector<CSSType<StyleType>, inlineCapacity>;

    Result operator()(const CommaSeparatedVector<StyleType, inlineCapacity>& value, const RenderStyle& style)
    {
        return Result { value.value.template map<typename Result::Vector>([&](const auto& x) { return toCSS(x, style); }) };
    }
};

// MARK: - Conversion from "CSS" to "Style"

// Conversion Invokers
template<typename CSSType, typename... Rest> decltype(auto) toStyle(const CSSType& cssType, const CSSToLengthConversionData& conversionData, Rest&&... rest)
{
    return ToStyle<CSSType>{}(cssType, conversionData, std::forward<Rest>(rest)...);
}

template<typename CSSType, typename... Rest> decltype(auto) toStyle(const CSSType& cssType, const BuilderState& builderState, Rest&&... rest)
{
    return ToStyle<CSSType>{}(cssType, builderState, std::forward<Rest>(rest)...);
}

template<typename CSSType, typename... Rest> decltype(auto) toStyle(const CSSType& cssType, NoConversionDataRequiredToken token, Rest&&... rest)
{
    return ToStyle<CSSType>{}(cssType, token, std::forward<Rest>(rest)...);
}

// Convenience invoker that adds a `NoConversionDataRequiredToken` argument.
template<typename CSSType, typename... Rest> decltype(auto) toStyleNoConversionDataRequired(const CSSType& cssType, Rest&&... rest)
{
    return toStyle(cssType, NoConversionDataRequiredToken { }, std::forward<Rest>(rest)...);
}

template<typename To, typename From, typename... Rest> auto toStyleOnTupleLike(const From& tupleLike, Rest&&... rest) -> To
{
    return WTF::apply([&](const auto& ...x) { return To { toStyle(x, rest...)... }; }, tupleLike);
}

template<typename To, typename From, typename... Rest> auto toStyleNoConversionDataRequiredOnTupleLike(const From& tupleLike, Rest&&... rest) -> To
{
    return WTF::apply([&](const auto& ...x) { return To { toStyleNoConversionDataRequired(x, rest...)... }; }, tupleLike);
}

// Conversion Utility Types
template<typename CSSType> using StyleType = std::decay_t<decltype(toStyle(std::declval<const CSSType&>(), std::declval<const BuilderState&>()))>;

// Standard Optional-Like type mappings:
template<typename T> struct ToStyleMapping<std::optional<T>> { using type = std::optional<StyleType<T>>; };
template<typename T> struct ToStyleMapping<WTF::Markable<T>> { using type = WTF::Markable<StyleType<T>>; };

// Standard Tuple-Like type mappings:
template<typename... Ts> struct ToStyleMapping<std::tuple<Ts...>> { using type = std::tuple<StyleType<Ts>...>; };
template<CSSValueID C, typename T> struct ToStyleMapping<FunctionNotation<C, T>> { using type = FunctionNotation<C, StyleType<T>>; };
template<typename T, size_t N> struct ToStyleMapping<SpaceSeparatedArray<T, N>> { using type = SpaceSeparatedArray<StyleType<T>, N>; };
template<typename T, size_t N> struct ToStyleMapping<CommaSeparatedArray<T, N>> { using type = CommaSeparatedArray<StyleType<T>, N>; };
template<typename... Ts> struct ToStyleMapping<SpaceSeparatedTuple<Ts...>> { using type = SpaceSeparatedTuple<StyleType<Ts>...>; };
template<typename... Ts> struct ToStyleMapping<CommaSeparatedTuple<Ts...>> { using type = CommaSeparatedTuple<StyleType<Ts>...>; };
template<typename T> struct ToStyleMapping<SpaceSeparatedPoint<T>> { using type = SpaceSeparatedPoint<StyleType<T>>; };
template<typename T> struct ToStyleMapping<SpaceSeparatedSize<T>> { using type = SpaceSeparatedSize<StyleType<T>>; };
template<typename T> struct ToStyleMapping<SpaceSeparatedRectEdges<T>> { using type = SpaceSeparatedRectEdges<StyleType<T>>; };
template<typename T> struct ToStyleMapping<MinimallySerializingSpaceSeparatedRectEdges<T>> { using type = MinimallySerializingSpaceSeparatedRectEdges<StyleType<T>>; };

// Standard Range-Like type mappings:
template<typename T, size_t N> struct ToStyleMapping<SpaceSeparatedVector<T, N>> { using type = SpaceSeparatedVector<StyleType<T>, N>; };
template<typename T, size_t N> struct ToStyleMapping<CommaSeparatedVector<T, N>> { using type = CommaSeparatedVector<StyleType<T>, N>; };

// Standard Variant-Like type mappings:
template<typename... Ts> struct ToStyleMapping<std::variant<Ts...>> { using type = std::variant<StyleType<Ts>...>; };

// Constrained for `TreatAsNonConverting`.
template<typename CSSType> requires (TreatAsNonConverting<CSSType>) struct ToStyle<CSSType> {
    template<typename... Rest> constexpr CSSType operator()(const CSSType& value, Rest&&...)
    {
        return value;
    }
};

// Constrained for `TreatAsOptionalLike`.
template<typename CSSType> requires (TreatAsOptionalLike<CSSType>) struct ToStyle<CSSType> {
    using Result = typename ToStyleMapping<CSSType>::type;

    template<typename... Rest> Result operator()(const CSSType& value, Rest&&... rest)
    {
        if (value)
            return toStyle(*value, std::forward<Rest>(rest)...);
        return std::nullopt;
    }
};

// Constrained for `TreatAsTupleLike`.
template<typename CSSType> requires (TreatAsTupleLike<CSSType>) struct ToStyle<CSSType> {
    using Result = typename ToStyleMapping<CSSType>::type;

    template<typename... Rest> Result operator()(const CSSType& value, Rest&&... rest)
    {
        return toStyleOnTupleLike<Result>(value, std::forward<Rest>(rest)...);
    }
};

// Constrained for `TreatAsVariantLike`.
template<typename CSSType> requires (TreatAsVariantLike<CSSType>) struct ToStyle<CSSType> {
    using Result = typename ToStyleMapping<CSSType>::type;

    template<typename... Rest> Result operator()(const CSSType& value, Rest&&... rest)
    {
        return WTF::switchOn(value, [&](const auto& alternative) { return Result { toStyle(alternative, std::forward<Rest>(rest)...) }; });
    }
};

// Specialization for `SpaceSeparatedVector`.
template<typename CSSType, size_t inlineCapacity> struct ToStyle<SpaceSeparatedVector<CSSType, inlineCapacity>> {
    using Result = SpaceSeparatedVector<StyleType<CSSType>, inlineCapacity>;

    template<typename... Rest> Result operator()(const SpaceSeparatedVector<CSSType, inlineCapacity>& value, Rest&&... rest)
    {
        return Result { value.value.template map<typename Result::Vector>([&](const auto& x) { return toStyle(x, rest...); }) };
    }
};

// Specialization for `CommaSeparatedVector`.
template<typename CSSType, size_t inlineCapacity> struct ToStyle<CommaSeparatedVector<CSSType, inlineCapacity>> {
    using Result = CommaSeparatedVector<StyleType<CSSType>, inlineCapacity>;

    template<typename... Rest> Result operator()(const CommaSeparatedVector<CSSType, inlineCapacity>& value, Rest&&... rest)
    {
        return Result { value.value.template map<typename Result::Vector>([&](const auto& x) { return toStyle(x, rest...); }) };
    }
};

// MARK: - Blending

// All non-tuple-like leaf types must specialize `Blending` with the following member functions:
//
//    template<> struct WebCore::Style::Blending<StyleType> {
//        bool canBlend(const StyleType&, const StyleType&);
//        StyleType blend(const StyleType&, const StyleType&, const BlendingContext&);
//    };
//
// or, if a RenderStyle is needed for blending:
//
//    template<> struct WebCore::Style::Blending<StyleType> {
//        bool canBlend(const StyleType&, const StyleType&, const RenderStyle&, const RenderStyle&);
//        StyleType blend(const StyleType&, const StyleType&, const RenderStyle&, const RenderStyle&, const BlendingContext&);
//    };

template<typename> struct Blending;

// `CanBlend` Invoker
template<typename StyleType> auto canBlend(const StyleType& a, const StyleType& b) -> bool
{
    return Blending<StyleType>{}.canBlend(a, b);
}

template<typename StyleType> auto canBlend(const StyleType& a, const StyleType& b, const RenderStyle& aStyle, const RenderStyle& bStyle) -> bool
{
    return Blending<StyleType>{}.canBlend(a, b, aStyle, bStyle);
}

// `Blend` Invoker
template<typename StyleType> auto blend(const StyleType& a, const StyleType& b, const BlendingContext& context) -> StyleType
{
    return Blending<StyleType>{}.blend(a, b, context);
}

template<typename StyleType> auto blend(const StyleType& a, const StyleType& b, const RenderStyle& aStyle, const RenderStyle& bStyle, const BlendingContext& context) -> StyleType
{
    return Blending<StyleType>{}.blend(a, b, aStyle, bStyle, context);
}

// Utilities for blending

template<typename StyleType> auto canBlendOnOptionalLike(const StyleType& a, const StyleType& b) -> bool
{
    if (a && b)
        return WebCore::Style::canBlend(*a, *b);
    return !a && !b;
}

template<typename StyleType> auto canBlendOnOptionalLike(const StyleType& a, const StyleType& b, const RenderStyle& aStyle, const RenderStyle& bStyle) -> bool
{
    if (a && b)
        return WebCore::Style::canBlend(*a, *b, aStyle, bStyle);
    return !a && !b;
}

template<typename StyleType> auto blendOnOptionalLike(const StyleType& a, const StyleType& b, const BlendingContext& context) -> StyleType
{
    if (a && b)
        return WebCore::Style::blend(*a, *b, context);
    return std::nullopt;
}

template<typename StyleType> auto blendOnOptionalLike(const StyleType& a, const StyleType& b, const RenderStyle& aStyle, const RenderStyle& bStyle, const BlendingContext& context) -> StyleType
{
    if (a && b)
        return WebCore::Style::blend(*a, *b, aStyle, bStyle, context);
    return std::nullopt;
}

template<typename StyleType> auto canBlendOnTupleLike(const StyleType& a, const StyleType& b) -> bool
{
    return WTF::apply([&](const auto& ...pair) {
        return (WebCore::Style::canBlend(std::get<0>(pair), std::get<1>(pair)) && ...);
    }, WTF::tuple_zip(a, b));
}

template<typename StyleType> auto canBlendOnTupleLike(const StyleType& a, const StyleType& b, const RenderStyle& aStyle, const RenderStyle& bStyle) -> bool
{
    return WTF::apply([&](const auto& ...pair) {
        return (WebCore::Style::canBlend(std::get<0>(pair), std::get<1>(pair), aStyle, bStyle) && ...);
    }, WTF::tuple_zip(a, b));
}

template<typename StyleType> auto blendOnTupleLike(const StyleType& a, const StyleType& b, const BlendingContext& context) -> StyleType
{
    return WTF::apply([&](const auto& ...pair) {
        return StyleType { WebCore::Style::blend(std::get<0>(pair), std::get<1>(pair), context)... };
    }, WTF::tuple_zip(a, b));
}

template<typename StyleType> auto blendOnTupleLike(const StyleType& a, const StyleType& b, const RenderStyle& aStyle, const RenderStyle& bStyle, const BlendingContext& context) -> StyleType
{
    return WTF::apply([&](const auto& ...pair) {
        return StyleType { WebCore::Style::blend(std::get<0>(pair), std::get<1>(pair), aStyle, bStyle, context)... };
    }, WTF::tuple_zip(a, b));
}

// Constrained for `TreatAsOptionalLike`.
template<typename StyleType> requires (TreatAsOptionalLike<StyleType>) struct Blending<StyleType> {
    constexpr auto canBlend(const StyleType& a, const StyleType& b) -> bool
    {
        return canBlendOnOptionalLike(a, b);
    }
    constexpr auto canBlend(const StyleType& a, const StyleType& b, const RenderStyle& aStyle, const RenderStyle& bStyle) -> bool
    {
        return canBlendOnOptionalLike(a, b, aStyle, bStyle);
    }
    auto blend(const StyleType& a, const StyleType& b, const BlendingContext& context) -> StyleType
    {
        return blendOnOptionalLike(a, b, context);
    }
    auto blend(const StyleType& a, const StyleType& b, const RenderStyle& aStyle, const RenderStyle& bStyle, const BlendingContext& context) -> StyleType
    {
        return blendOnOptionalLike(a, b, aStyle, bStyle, context);
    }
};

// Constrained for `TreatAsTupleLike`.
template<typename StyleType> requires (TreatAsTupleLike<StyleType>) struct Blending<StyleType> {
    constexpr auto canBlend(const StyleType& a, const StyleType& b) -> bool
    {
        return canBlendOnTupleLike(a, b);
    }
    constexpr auto canBlend(const StyleType& a, const StyleType& b, const RenderStyle& aStyle, const RenderStyle& bStyle) -> bool
    {
        return canBlendOnTupleLike(a, b, aStyle, bStyle);
    }
    auto blend(const StyleType& a, const StyleType& b, const BlendingContext& context) -> StyleType
    {
        return blendOnTupleLike(a, b, context);
    }
    auto blend(const StyleType& a, const StyleType& b, const RenderStyle& aStyle, const RenderStyle& bStyle, const BlendingContext& context) -> StyleType
    {
        return blendOnTupleLike(a, b, aStyle, bStyle, context);
    }
};

// Specialization for `Constant`.
template<CSSValueID C> struct Blending<Constant<C>> {
    constexpr auto canBlend(const Constant<C>&, const Constant<C>&) -> bool
    {
        return true;
    }
    constexpr auto canBlend(const Constant<C>&, const Constant<C>&, const RenderStyle&, const RenderStyle&) -> bool
    {
        return true;
    }
    auto blend(const Constant<C>&, const Constant<C>&, const BlendingContext&) -> Constant<C>
    {
        return { };
    }
    auto blend(const Constant<C>&, const Constant<C>&, const RenderStyle&, const RenderStyle&, const BlendingContext&) -> Constant<C>
    {
        return { };
    }
};

// Specialization for `std::variant`.
template<typename... StyleTypes> struct Blending<std::variant<StyleTypes...>> {
    auto canBlend(const std::variant<StyleTypes...>& a, const std::variant<StyleTypes...>& b) -> bool
    {
        return std::visit(WTF::makeVisitor(
            []<typename T>(const T& a, const T& b) -> bool {
                return WebCore::Style::canBlend(a, b);
            },
            [](const auto&, const auto&) -> bool {
                return false;
            }
        ), a, b);
    }
    auto canBlend(const std::variant<StyleTypes...>& a, const std::variant<StyleTypes...>& b, const RenderStyle& aStyle, const RenderStyle& bStyle) -> bool
    {
        return std::visit(WTF::makeVisitor(
            [&]<typename T>(const T& a, const T& b) -> bool {
                return WebCore::Style::canBlend(a, b, aStyle, bStyle);
            },
            [](const auto&, const auto&) -> bool {
                return false;
            }
        ), a, b);
    }
    auto blend(const std::variant<StyleTypes...>& a, const std::variant<StyleTypes...>& b, const BlendingContext& context) -> std::variant<StyleTypes...>
    {
        return std::visit(WTF::makeVisitor(
            [&]<typename T>(const T& a, const T& b) -> std::variant<StyleTypes...> {
                return WebCore::Style::blend(a, b, context);
            },
            [](const auto&, const auto&) -> std::variant<StyleTypes...> {
                RELEASE_ASSERT_NOT_REACHED();
            }
        ), a, b);
    }
    auto blend(const std::variant<StyleTypes...>& a, const std::variant<StyleTypes...>& b, const RenderStyle& aStyle, const RenderStyle& bStyle, const BlendingContext& context) -> std::variant<StyleTypes...>
    {
        return std::visit(WTF::makeVisitor(
            [&]<typename T>(const T& a, const T& b) -> std::variant<StyleTypes...> {
                return WebCore::Style::blend(a, b, aStyle, bStyle, context);
            },
            [](const auto&, const auto&) -> std::variant<StyleTypes...> {
                RELEASE_ASSERT_NOT_REACHED();
            }
        ), a, b);
    }
};

// Specialization for `SpaceSeparatedVector`.
template<typename StyleType, size_t inlineCapacity> struct Blending<SpaceSeparatedVector<StyleType, inlineCapacity>> {
    auto canBlend(const SpaceSeparatedVector<StyleType, inlineCapacity>& a, const SpaceSeparatedVector<StyleType, inlineCapacity>& b) -> bool
    {
        if (a.size() != b.size())
            return false;
        for (size_t i = 0; i < a.size(); ++i) {
            if (!WebCore::Style::canBlend(a[i], b[i]))
                return false;
        }
        return true;
    }
    auto canBlend(const SpaceSeparatedVector<StyleType, inlineCapacity>& a, const SpaceSeparatedVector<StyleType, inlineCapacity>& b, const RenderStyle& aStyle, const RenderStyle& bStyle) -> bool
    {
        if (a.size() != b.size())
            return false;
        for (size_t i = 0; i < a.size(); ++i) {
            if (!WebCore::Style::canBlend(a[i], b[i], aStyle, bStyle))
                return false;
        }
        return true;
    }
    auto blend(const SpaceSeparatedVector<StyleType, inlineCapacity>& a, const SpaceSeparatedVector<StyleType, inlineCapacity>& b, const BlendingContext& context) -> SpaceSeparatedVector<StyleType, inlineCapacity>
    {
        auto size = a.size();
        typename SpaceSeparatedVector<StyleType, inlineCapacity>::Vector result;
        result.reserveInitialCapacity(size);
        for (size_t i = 0; i < size; ++i)
            result.append(WebCore::Style::blend(a[i], b[i], context));
        return { WTFMove(result) };
    }
    auto blend(const SpaceSeparatedVector<StyleType, inlineCapacity>& a, const SpaceSeparatedVector<StyleType, inlineCapacity>& b, const RenderStyle& aStyle, const RenderStyle& bStyle, const BlendingContext& context) -> SpaceSeparatedVector<StyleType, inlineCapacity>
    {
        auto size = a.size();
        typename SpaceSeparatedVector<StyleType, inlineCapacity>::Vector result;
        result.reserveInitialCapacity(size);
        for (size_t i = 0; i < size; ++i)
            result.append(WebCore::Style::blend(a[i], b[i], aStyle, bStyle, context));
        return { WTFMove(result) };
    }
};

// Specialization for `CommaSeparatedVector`.
template<typename StyleType, size_t inlineCapacity> struct Blending<CommaSeparatedVector<StyleType, inlineCapacity>> {
    auto canBlend(const CommaSeparatedVector<StyleType, inlineCapacity>& a, const CommaSeparatedVector<StyleType, inlineCapacity>& b) -> bool
    {
        if (a.size() != b.size())
            return false;
        for (size_t i = 0; i < a.size(); ++i) {
            if (!WebCore::Style::canBlend(a[i], b[i]))
                return false;
        }
        return true;
    }
    auto canBlend(const CommaSeparatedVector<StyleType, inlineCapacity>& a, const CommaSeparatedVector<StyleType, inlineCapacity>& b, const RenderStyle& aStyle, const RenderStyle& bStyle) -> bool
    {
        if (a.size() != b.size())
            return false;
        for (size_t i = 0; i < a.size(); ++i) {
            if (!WebCore::Style::canBlend(a[i], b[i], aStyle, bStyle))
                return false;
        }
        return true;
    }
    auto blend(const CommaSeparatedVector<StyleType, inlineCapacity>& a, const CommaSeparatedVector<StyleType, inlineCapacity>& b, const BlendingContext& context) -> CommaSeparatedVector<StyleType, inlineCapacity>
    {
        auto size = a.size();
        typename CommaSeparatedVector<StyleType, inlineCapacity>::Vector result;
        result.reserveInitialCapacity(size);
        for (size_t i = 0; i < size; ++i)
            result.append(WebCore::Style::blend(a[i], b[i], context));
        return { WTFMove(result) };
    }
    auto blend(const CommaSeparatedVector<StyleType, inlineCapacity>& a, const CommaSeparatedVector<StyleType, inlineCapacity>& b, const RenderStyle& aStyle, const RenderStyle& bStyle, const BlendingContext& context) -> CommaSeparatedVector<StyleType, inlineCapacity>
    {
        auto size = a.size();
        typename CommaSeparatedVector<StyleType, inlineCapacity>::Vector result;
        result.reserveInitialCapacity(size);
        for (size_t i = 0; i < size; ++i)
            result.append(WebCore::Style::blend(a[i], b[i], aStyle, bStyle, context));
        return { WTFMove(result) };
    }
};

} // namespace Style
} // namespace WebCore
