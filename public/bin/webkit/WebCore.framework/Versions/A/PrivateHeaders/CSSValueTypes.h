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

#include "CSSValueAggregates.h"
#include "ComputedStyleDependencies.h"
#include <wtf/text/StringBuilder.h>

namespace WebCore {

class CSSValue;

namespace CSS {

// Helper for declaring types in the CSS namespace as Tuple-Like.
#define CSS_TUPLE_LIKE_CONFORMANCE(t, numberOfArguments) \
    namespace std { \
        template<> class tuple_size<WebCore::CSS::t> : public std::integral_constant<size_t, numberOfArguments> { }; \
        template<size_t I> class tuple_element<I, WebCore::CSS::t> { \
        public: \
            using type = decltype(WebCore::CSS::get<I>(std::declval<WebCore::CSS::t>())); \
        }; \
    } \
    template<> inline constexpr bool WebCore::TreatAsTupleLike<WebCore::CSS::t> = true; \
\

#define CSS_SPACE_SEPARATED_TUPLE_LIKE_CONFORMANCE(t, numberOfArguments) \
    CSS_TUPLE_LIKE_CONFORMANCE(t, numberOfArguments) \
    template<> inline constexpr ASCIILiteral WebCore::SerializationSeparator<WebCore::CSS::t> = " "_s; \
\

#define CSS_COMMA_SEPARATED_TUPLE_LIKE_CONFORMANCE(t, numberOfArguments) \
    CSS_TUPLE_LIKE_CONFORMANCE(t, numberOfArguments) \
    template<> inline constexpr ASCIILiteral WebCore::SerializationSeparator<WebCore::CSS::t> = ", "_s; \
\

// MARK: - Serialization

// All leaf types must implement the following conversions:
//
//    template<> struct WebCore::CSS::Serialize<CSSType> {
//        void operator()(StringBuilder&, const CSSType&);
//    };

template<typename CSSType> struct Serialize;

// Serialization Invokers
template<typename CSSType> void serializationForCSS(StringBuilder& builder, const CSSType& value)
{
    Serialize<CSSType>{}(builder, value);
}

template<typename CSSType> [[nodiscard]] String serializationForCSS(const CSSType& value)
{
    StringBuilder builder;
    serializationForCSS(builder, value);
    return builder.toString();
}

template<typename CSSType> void serializationForCSSOnOptionalLike(StringBuilder& builder, const CSSType& value) requires (TreatAsOptionalLike<CSSType>)
{
    if (!value)
        return;
    serializationForCSS(builder, *value);
}

template<typename CSSType> void serializationForCSSOnTupleLike(StringBuilder& builder, const CSSType& value, ASCIILiteral separator) requires (TreatAsTupleLike<CSSType>)
{
    auto swappedSeparator = ""_s;
    auto caller = WTF::makeVisitor(
        [&]<typename T>(const std::optional<T>& element) {
            if (!element)
                return;
            builder.append(std::exchange(swappedSeparator, separator));
            serializationForCSS(builder, *element);
        },
        [&]<typename T>(const Markable<T>& element) {
            if (!element)
                return;
            builder.append(std::exchange(swappedSeparator, separator));
            serializationForCSS(builder, *element);
        },
        [&](const auto& element) {
            builder.append(std::exchange(swappedSeparator, separator));
            serializationForCSS(builder, element);
        }
    );

    WTF::apply([&](const auto& ...x) { (..., caller(x)); }, value);
}

template<typename CSSType> void serializationForCSSOnRangeLike(StringBuilder& builder, const CSSType& value, ASCIILiteral separator) requires (TreatAsRangeLike<CSSType>)
{
    auto swappedSeparator = ""_s;
    for (const auto& element : value) {
        builder.append(std::exchange(swappedSeparator, separator));
        serializationForCSS(builder, element);
    }
}

template<typename CSSType> void serializationForCSSOnVariantLike(StringBuilder& builder, const CSSType& value) requires (TreatAsVariantLike<CSSType>)
{
    WTF::switchOn(value, [&](const auto& alternative) { serializationForCSS(builder, alternative); });
}

// Constrained for `TreatAsEmptyLike`.
template<typename CSSType> requires (TreatAsEmptyLike<CSSType>) struct Serialize<CSSType> {
    void operator()(StringBuilder&, const CSSType&)
    {
    }
};

// Constrained for `TreatAsOptionalLike`.
template<typename CSSType> requires (TreatAsOptionalLike<CSSType>) struct Serialize<CSSType> {
    void operator()(StringBuilder& builder, const CSSType& value)
    {
        serializationForCSSOnOptionalLike(builder, value);
    }
};

// Constrained for `TreatAsTupleLike`.
template<typename CSSType> requires (TreatAsTupleLike<CSSType>) struct Serialize<CSSType> {
    void operator()(StringBuilder& builder, const CSSType& value)
    {
        serializationForCSSOnTupleLike(builder, value, SerializationSeparator<CSSType>);
    }
};

// Constrained for `TreatAsRangeLike`.
template<typename CSSType> requires (TreatAsRangeLike<CSSType>) struct Serialize<CSSType> {
    void operator()(StringBuilder& builder, const CSSType& value)
    {
        serializationForCSSOnRangeLike(builder, value, SerializationSeparator<CSSType>);
    }
};

// Constrained for `TreatAsVariantLike`.
template<typename CSSType> requires (TreatAsVariantLike<CSSType>) struct Serialize<CSSType> {
    void operator()(StringBuilder& builder, const CSSType& value)
    {
        serializationForCSSOnVariantLike(builder, value);
    }
};

// Specialization for `Constant`.
template<CSSValueID C> struct Serialize<Constant<C>> {
    void operator()(StringBuilder& builder, const Constant<C>& value)
    {
        builder.append(nameLiteralForSerialization(value.value));
    }
};

// Specialization for `CustomIdentifier`.
template<> struct Serialize<CustomIdentifier> {
    void operator()(StringBuilder&, const CustomIdentifier&);
};

// Specialization for `FunctionNotation`.
template<CSSValueID Name, typename CSSType> struct Serialize<FunctionNotation<Name, CSSType>> {
    void operator()(StringBuilder& builder, const FunctionNotation<Name, CSSType>& value)
    {
        builder.append(nameLiteralForSerialization(value.name), '(');
        serializationForCSS(builder, value.parameters);
        builder.append(')');
    }
};

// Specialization for `MinimallySerializingSpaceSeparatedRectEdges`.
template<typename CSSType> struct Serialize<MinimallySerializingSpaceSeparatedRectEdges<CSSType>> {
    void operator()(StringBuilder& builder, const MinimallySerializingSpaceSeparatedRectEdges<CSSType>& value)
    {
        constexpr auto separator = SerializationSeparator<MinimallySerializingSpaceSeparatedRectEdges<CSSType>>;

        if (value.left() != value.right()) {
            serializationForCSSOnTupleLike(builder, std::tuple { value.top(), value.right(), value.bottom(), value.left() }, separator);
            return;
        }
        if (value.bottom() != value.top()) {
            serializationForCSSOnTupleLike(builder, std::tuple { value.top(), value.right(), value.bottom() }, separator);
            return;
        }
        if (value.right() != value.top()) {
            serializationForCSSOnTupleLike(builder, std::tuple { value.top(), value.right() }, separator);
            return;
        }
        serializationForCSS(builder, value.top());
    }
};

// MARK: - Computed Style Dependencies

// What properties does this value rely on (eg, font-size for em units)?

// All non-tuple-like leaf types must implement the following conversions:
//
//    template<> struct WebCore::CSS::ComputedStyleDependenciesCollector<CSSType> {
//        void operator()(ComputedStyleDependencies&, const CSSType&);
//    };

template<typename CSSType> struct ComputedStyleDependenciesCollector;

// ComputedStyleDependencies Invoker
template<typename CSSType> void collectComputedStyleDependencies(ComputedStyleDependencies& dependencies, const CSSType& value)
{
    ComputedStyleDependenciesCollector<CSSType>{}(dependencies, value);
}

template<typename CSSType> [[nodiscard]] ComputedStyleDependencies collectComputedStyleDependencies(const CSSType& value)
{
    ComputedStyleDependencies dependencies;
    collectComputedStyleDependencies(dependencies, value);
    return dependencies;
}

template<typename CSSType> auto collectComputedStyleDependenciesOnOptionalLike(ComputedStyleDependencies& dependencies, const CSSType& value) requires (TreatAsOptionalLike<CSSType>)
{
    if (!value)
        return;
    collectComputedStyleDependencies(dependencies, *value);
}

template<typename CSSType> auto collectComputedStyleDependenciesOnTupleLike(ComputedStyleDependencies& dependencies, const CSSType& value) requires (TreatAsTupleLike<CSSType>)
{
    WTF::apply([&](const auto& ...x) { (..., collectComputedStyleDependencies(dependencies, x)); }, value);
}

template<typename CSSType> auto collectComputedStyleDependenciesOnRangeLike(ComputedStyleDependencies& dependencies, const CSSType& value) requires (TreatAsRangeLike<CSSType>)
{
    for (const auto& element : value)
        collectComputedStyleDependencies(dependencies, element);
}

template<typename CSSType> auto collectComputedStyleDependenciesOnVariantLike(ComputedStyleDependencies& dependencies, const CSSType& value) requires (TreatAsVariantLike<CSSType>)
{
    WTF::switchOn(value, [&](const auto& alternative) { collectComputedStyleDependencies(dependencies, alternative); });
}

// Constrained for `TreatAsEmptyLike`.
template<typename CSSType> requires (TreatAsEmptyLike<CSSType>) struct ComputedStyleDependenciesCollector<CSSType> {
    void operator()(ComputedStyleDependencies&, const CSSType&)
    {
    }
};

// Constrained for `TreatAsOptionalLike`.
template<typename CSSType> requires (TreatAsOptionalLike<CSSType>) struct ComputedStyleDependenciesCollector<CSSType> {
    void operator()(ComputedStyleDependencies& dependencies, const CSSType& value)
    {
        collectComputedStyleDependenciesOnOptionalLike(dependencies, value);
    }
};

// Constrained for `TreatAsTupleLike`.
template<typename CSSType> requires (TreatAsTupleLike<CSSType>) struct ComputedStyleDependenciesCollector<CSSType> {
    void operator()(ComputedStyleDependencies& dependencies, const CSSType& value)
    {
        collectComputedStyleDependenciesOnTupleLike(dependencies, value);
    }
};

// Constrained for `TreatAsRangeLike`.
template<typename CSSType> requires (TreatAsRangeLike<CSSType>) struct ComputedStyleDependenciesCollector<CSSType> {
    void operator()(ComputedStyleDependencies& dependencies, const CSSType& value)
    {
        collectComputedStyleDependenciesOnRangeLike(dependencies, value);
    }
};

// Constrained for `TreatAsVariantLike`.
template<typename CSSType> requires (TreatAsVariantLike<CSSType>) struct ComputedStyleDependenciesCollector<CSSType> {
    void operator()(ComputedStyleDependencies& dependencies, const CSSType& value)
    {
        collectComputedStyleDependenciesOnVariantLike(dependencies, value);
    }
};

// Specialization for `Constant`.
template<CSSValueID C> struct ComputedStyleDependenciesCollector<Constant<C>> {
    constexpr void operator()(ComputedStyleDependencies&, const Constant<C>&)
    {
        // Nothing to do.
    }
};

// Specialization for `CustomIdentifier`.
template<> struct ComputedStyleDependenciesCollector<CustomIdentifier> {
    constexpr void operator()(ComputedStyleDependencies&, const CustomIdentifier&)
    {
        // Nothing to do.
    }
};

// MARK: - CSSValue Visitation

// All non-tuple-like leaf types must implement the following conversions:
//
//    template<> struct WebCore::CSS::CSSValueChildrenVisitor<CSSType> {
//        IterationStatus operator()(const Function<IterationStatus(CSSValue&)>&, const CSSType&);
//    };

template<typename CSSType> struct CSSValueChildrenVisitor;

// CSSValueVisitor Invoker
template<typename CSSType> IterationStatus visitCSSValueChildren(const Function<IterationStatus(CSSValue&)>& func, const CSSType& value)
{
    return CSSValueChildrenVisitor<CSSType>{}(func, value);
}

template<typename CSSType> IterationStatus visitCSSValueChildrenOnOptionalLike(const Function<IterationStatus(CSSValue&)>& func, const CSSType& value) requires (TreatAsOptionalLike<CSSType>)
{
    return value ? visitCSSValueChildren(func, *value) : IterationStatus::Continue;
}

template<typename CSSType> IterationStatus visitCSSValueChildrenOnTupleLike(const Function<IterationStatus(CSSValue&)>& func, const CSSType& value) requires (TreatAsTupleLike<CSSType>)
{
    // Process a single element of the tuple-like, updating result, and return true if result == IterationStatus::Done to
    // short circuit the fold in the apply lambda.
    auto process = [&](const auto& x, IterationStatus& result) -> bool {
        result = visitCSSValueChildren(func, x);
        return result == IterationStatus::Done;
    };

    return WTF::apply([&](const auto& ...x) {
        auto result = IterationStatus::Continue;
        (process(x, result) || ...);
        return result;
    }, value);
}

template<typename CSSType> IterationStatus visitCSSValueChildrenOnRangeLike(const Function<IterationStatus(CSSValue&)>& func, const CSSType& value) requires (TreatAsRangeLike<CSSType>)
{
    for (const auto& element : value) {
        if (visitCSSValueChildren(func, element) == IterationStatus::Done)
            return IterationStatus::Done;
    }
    return IterationStatus::Continue;
}

template<typename CSSType> IterationStatus visitCSSValueChildrenOnVariantLike(const Function<IterationStatus(CSSValue&)>& func, const CSSType& value) requires (TreatAsVariantLike<CSSType>)
{
    return WTF::switchOn(value, [&](const auto& alternative) { return visitCSSValueChildren(func, alternative); });
}

// Constrained for `TreatAsEmptyLike`.
template<typename CSSType> requires (TreatAsEmptyLike<CSSType>) struct CSSValueChildrenVisitor<CSSType> {
    IterationStatus operator()(const Function<IterationStatus(CSSValue&)>&, const CSSType&)
    {
        return IterationStatus::Continue;
    }
};

// Constrained for `TreatAsOptionalLike`.
template<typename CSSType> requires (TreatAsOptionalLike<CSSType>) struct CSSValueChildrenVisitor<CSSType> {
    IterationStatus operator()(const Function<IterationStatus(CSSValue&)>& func, const CSSType& value)
    {
        return visitCSSValueChildrenOnOptionalLike(func, value);
    }
};

// Constrained for `TreatAsTupleLike`.
template<typename CSSType> requires (TreatAsTupleLike<CSSType>) struct CSSValueChildrenVisitor<CSSType> {
    IterationStatus operator()(const Function<IterationStatus(CSSValue&)>& func, const CSSType& value)
    {
        return visitCSSValueChildrenOnTupleLike(func, value);
    }
};

// Constrained for `TreatAsRangeLike`.
template<typename CSSType> requires (TreatAsRangeLike<CSSType>) struct CSSValueChildrenVisitor<CSSType> {
    IterationStatus operator()(const Function<IterationStatus(CSSValue&)>& func, const CSSType& value)
    {
        return visitCSSValueChildrenOnRangeLike(func, value);
    }
};

// Constrained for `TreatAsVariantLike`.
template<typename CSSType> requires (TreatAsVariantLike<CSSType>) struct CSSValueChildrenVisitor<CSSType> {
    IterationStatus operator()(const Function<IterationStatus(CSSValue&)>& func, const CSSType& value)
    {
        return visitCSSValueChildrenOnVariantLike(func, value);
    }
};

// Specialization for `Constant`.
template<CSSValueID C> struct CSSValueChildrenVisitor<Constant<C>> {
    constexpr IterationStatus operator()(const Function<IterationStatus(CSSValue&)>&, const Constant<C>&)
    {
        return IterationStatus::Continue;
    }
};

// Specialization for `CustomIdentifier`.
template<> struct CSSValueChildrenVisitor<CustomIdentifier> {
    constexpr IterationStatus operator()(const Function<IterationStatus(CSSValue&)>&, const CustomIdentifier&)
    {
        return IterationStatus::Continue;
    }
};

} // namespace CSS
} // namespace WebCore
