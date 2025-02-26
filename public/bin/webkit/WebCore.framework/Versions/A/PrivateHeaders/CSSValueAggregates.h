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

#include "CSSValueKeywords.h"
#include "RectEdges.h"
#include <optional>
#include <tuple>
#include <utility>
#include <variant>
#include <wtf/Markable.h>
#include <wtf/StdLibExtras.h>
#include <wtf/Vector.h>
#include <wtf/text/AtomString.h>

namespace WebCore {

// Types can specialize this and set the value to true to be treated as "empty-like"
// for CSS value type algorithms.
// Requirements: None.
template<typename> inline constexpr auto TreatAsEmptyLike = false;

// Types can specialize this and set the value to true to be treated as "optional-like"
// for CSS value type algorithms.
// Requirements: Types be comparable to bool and have a operator* function.
template<typename> inline constexpr auto TreatAsOptionalLike = false;

// Types can specialize this and set the value to true to be treated as "tuple-like"
// for CSS value type algorithms.
// NOTE: This gets automatically specialized when using the CSS_TUPLE_LIKE_CONFORMANCE macro.
// Requirements: Types must have conform the to the standard tuple-like pseudo-protocol.
template<typename> inline constexpr auto TreatAsTupleLike = false;

// Types can specialize this and set the value to true to be treated as "range-like"
// for CSS value type algorithms.
// Requirements: Types must have valid begin()/end() functions.
template<typename> inline constexpr auto TreatAsRangeLike = false;

// Types can specialize this and set the value to true to be treated as "variant-like"
// for CSS value type algorithms.
// Requirements: Types must be able to be passed to WTF::switchOn().
template<typename> inline constexpr auto TreatAsVariantLike = false;

// Types that specialize TreatAsTupleLike or TreatAsRangeLike can specialize this to
// indicate how to serialize the gaps between elements.
template<typename> inline constexpr ASCIILiteral SerializationSeparator = ""_s;

// Helper to define a simple `get()` implementation for a single value `name`.
#define DEFINE_TYPE_WRAPPER(t, name) \
    template<size_t> const auto& get(const t& value) { return value.name; }

// MARK: - Conforming Existing Types

// - Optional-like
template<typename T> inline constexpr auto TreatAsOptionalLike<std::optional<T>> = true;
template<typename T> inline constexpr auto TreatAsOptionalLike<WTF::Markable<T>> = true;

// - Tuple-like
template<typename... Ts> inline constexpr auto TreatAsTupleLike<std::tuple<Ts...>> = true;

// - Variant-like
template<typename... Ts> inline constexpr auto TreatAsVariantLike<std::variant<Ts...>> = true;


// MARK: Utility Concepts

template<typename T> concept HasIsZero = requires(T t) {
    { t.isZero() } -> std::convertible_to<bool>;
};


// MARK: - Standard Leaf Types

// Helper type used to represent an arbitrary constant identifier.
struct CustomIdentifier {
    AtomString value;

    bool operator==(const CustomIdentifier&) const = default;
    bool operator==(const AtomString& other) const { return value == other; }
};
WTF::TextStream& operator<<(WTF::TextStream&, const CustomIdentifier&);

// MARK: - Standard Aggregates

// Helper type used to represent a CSS function.
template<CSSValueID C, typename T> struct FunctionNotation {
    static constexpr auto name = C;
    T parameters;

    // Forward * and -> to the parameters for convenience.
    const T& operator*() const { return parameters; }
    T& operator*() { return parameters; }
    const T* operator->() const { return &parameters; }
    T* operator->() { return &parameters; }
    operator const T&() const { return parameters; }
    operator T&() { return parameters; }

    bool operator==(const FunctionNotation<C, T>&) const = default;
};

template<size_t, CSSValueID C, typename T> const auto& get(const FunctionNotation<C, T>& function)
{
    return function.parameters;
}

template<CSSValueID C, typename T> inline constexpr auto TreatAsTupleLike<FunctionNotation<C, T>> = true;

// Wraps a variable number of elements of a single type, semantically marking them as serializing as "space separated".
template<typename T, size_t inlineCapacity = 0> struct SpaceSeparatedVector {
    using Vector = WTF::Vector<T, inlineCapacity>;
    using const_iterator = typename Vector::const_iterator;
    using const_reverse_iterator = typename Vector::const_reverse_iterator;
    using value_type = typename Vector::value_type;

    SpaceSeparatedVector() = default;

    SpaceSeparatedVector(std::initializer_list<T> initializerList)
        : value { initializerList }
    {
    }

    SpaceSeparatedVector(WTF::Vector<T, inlineCapacity>&& value)
        : value { WTFMove(value) }
    {
    }

    const_iterator begin() const { return value.begin(); }
    const_iterator end() const { return value.end(); }
    const_reverse_iterator rbegin() const { return value.rbegin(); }
    const_reverse_iterator rend() const { return value.rend(); }

    bool isEmpty() const { return value.isEmpty(); }
    size_t size() const { return value.size(); }
    const T& operator[](size_t i) const { return value[i]; }

    template<typename F> decltype(auto) map(F&& functor) const { return value.map(std::forward<F>(functor)); }

    bool operator==(const SpaceSeparatedVector<T, inlineCapacity>&) const = default;

    WTF::Vector<T, inlineCapacity> value;
};

template<typename T, size_t N> inline constexpr auto TreatAsRangeLike<SpaceSeparatedVector<T, N>> = true;
template<typename T, size_t N> inline constexpr auto SerializationSeparator<SpaceSeparatedVector<T, N>> = " "_s;

// Wraps a variable number of elements of a single type, semantically marking them as serializing as "comma separated".
template<typename T, size_t inlineCapacity = 0> struct CommaSeparatedVector {
    using Vector = WTF::Vector<T, inlineCapacity>;
    using const_iterator = typename Vector::const_iterator;
    using const_reverse_iterator = typename Vector::const_reverse_iterator;
    using value_type = typename Vector::value_type;

    CommaSeparatedVector() = default;

    CommaSeparatedVector(std::initializer_list<T> initializerList)
        : value { initializerList }
    {
    }

    CommaSeparatedVector(WTF::Vector<T, inlineCapacity>&& value)
        : value { WTFMove(value) }
    {
    }

    const_iterator begin() const { return value.begin(); }
    const_iterator end() const { return value.end(); }
    const_reverse_iterator rbegin() const { return value.rbegin(); }
    const_reverse_iterator rend() const { return value.rend(); }

    bool isEmpty() const { return value.isEmpty(); }
    size_t size() const { return value.size(); }
    const T& operator[](size_t i) const { return value[i]; }

    template<typename F> decltype(auto) map(F&& functor) const { return value.map(std::forward<F>(functor)); }

    bool operator==(const CommaSeparatedVector<T, inlineCapacity>&) const = default;

    WTF::Vector<T, inlineCapacity> value;
};

template<typename T, size_t N> inline constexpr auto TreatAsRangeLike<CommaSeparatedVector<T, N>> = true;
template<typename T, size_t N> inline constexpr auto SerializationSeparator<CommaSeparatedVector<T, N>> = ", "_s;

// Wraps a list and enforces the invariant that it is either created with a non-empty value or `CSS::Keyword::None`.
template<typename T> struct ListOrNone {
    using List = T;

    explicit ListOrNone(List&& list)
        : value { WTFMove(list) }
    {
        RELEASE_ASSERT(!value.isEmpty());
    }

    explicit ListOrNone(CSS::Keyword::None)
        : value { }
    {
    }

    bool operator==(const ListOrNone&) const = default;

    bool isNone() const { return value.isEmpty(); }
    bool isList() const { return !value.isEmpty(); }

    template<typename... F> decltype(auto) switchOn(F&&... f) const
    {
        auto visitor = WTF::makeVisitor(std::forward<F>(f)...);

        if (isNone())
            return visitor(CSS::Keyword::None { });
        return visitor(value);
    }

private:
    // An empty list indicates the value `none`. This invariant is ensured
    // with a release assert in the constructor.
    List value;
};

template<typename T> inline constexpr auto TreatAsVariantLike<ListOrNone<T>> = true;

// Wraps a fixed size list of elements of a single type, semantically marking them as serializing as "space separated".
template<typename T, size_t N> struct SpaceSeparatedArray {
    using Array = std::array<T, N>;
    using value_type = T;

    template<typename... Ts>
        requires (sizeof...(Ts) == N && WTF::all<std::convertible_to<Ts, T>...>)
    constexpr SpaceSeparatedArray(Ts... values)
        : value { std::forward<Ts>(values)... }
    {
    }

    constexpr SpaceSeparatedArray(std::array<T, N>&& array)
        : value { WTFMove(array) }
    {
    }

    constexpr bool operator==(const SpaceSeparatedArray<T, N>&) const = default;

    std::array<T, N> value;
};

template<typename T, typename... Ts>
    requires (WTF::all<std::convertible_to<Ts, T>...>)
SpaceSeparatedArray(T, Ts...) -> SpaceSeparatedArray<T, 1 + sizeof...(Ts)>;

template<size_t I, typename T, size_t N> decltype(auto) get(const SpaceSeparatedArray<T, N>& array)
{
    return std::get<I>(array.value);
}

template<typename T, size_t N> inline constexpr auto TreatAsTupleLike<SpaceSeparatedArray<T, N>> = true;
template<typename T, size_t N> inline constexpr auto SerializationSeparator<SpaceSeparatedArray<T, N>> = " "_s;

// Convenience for representing a two element array.
template<typename T> using SpaceSeparatedPair = SpaceSeparatedArray<T, 2>;

// Wraps a fixed size list of elements of a single type, semantically marking them as serializing as "comma separated".
template<typename T, size_t N> struct CommaSeparatedArray {
    using Array = std::array<T, N>;
    using value_type = T;

    template<typename... Ts>
        requires (sizeof...(Ts) == N && WTF::all<std::convertible_to<Ts, T>...>)
    constexpr CommaSeparatedArray(Ts... values)
        : value { std::forward<Ts>(values)... }
    {
    }

    constexpr CommaSeparatedArray(std::array<T, N>&& array)
        : value { WTFMove(array) }
    {
    }

    constexpr bool operator==(const CommaSeparatedArray<T, N>&) const = default;

    std::array<T, N> value;
};


template<typename T, typename... Ts>
    requires (WTF::all<std::convertible_to<Ts, T>...>)
CommaSeparatedArray(T, Ts...) -> CommaSeparatedArray<T, 1 + sizeof...(Ts)>;

template<size_t I, typename T, size_t N> decltype(auto) get(const CommaSeparatedArray<T, N>& array)
{
    return std::get<I>(array.value);
}

template<typename T, size_t N> inline constexpr auto TreatAsTupleLike<CommaSeparatedArray<T, N>> = true;
template<typename T, size_t N> inline constexpr auto SerializationSeparator<CommaSeparatedArray<T, N>> = ", "_s;

// Convenience for representing a two element array.
template<typename T> using CommaSeparatedPair = CommaSeparatedArray<T, 2>;

// Wraps a variadic list of types, semantically marking them as serializing as "space separated".
template<typename... Ts> struct SpaceSeparatedTuple {
    using Tuple = std::tuple<Ts...>;

    constexpr SpaceSeparatedTuple(Ts&&... values)
        : value { std::make_tuple(std::forward<Ts>(values)...) }
    {
    }

    constexpr SpaceSeparatedTuple(const Ts&... values)
        : value { std::make_tuple(values...) }
    {
    }

    constexpr SpaceSeparatedTuple(std::tuple<Ts...>&& tuple)
        : value { WTFMove(tuple) }
    {
    }

    constexpr bool operator==(const SpaceSeparatedTuple<Ts...>&) const = default;

    std::tuple<Ts...> value;
};

template<size_t I, typename... Ts> decltype(auto) get(const SpaceSeparatedTuple<Ts...>& tuple)
{
    return std::get<I>(tuple.value);
}

template<typename... Ts> inline constexpr auto TreatAsTupleLike<SpaceSeparatedTuple<Ts...>> = true;
template<typename... Ts> inline constexpr auto SerializationSeparator<SpaceSeparatedTuple<Ts...>> = " "_s;

// Wraps a variadic list of types, semantically marking them as serializing as "comma separated".
template<typename... Ts> struct CommaSeparatedTuple {
    using Tuple = std::tuple<Ts...>;

    constexpr CommaSeparatedTuple(Ts&&... values)
        : value { std::make_tuple(std::forward<Ts>(values)...) }
    {
    }

    constexpr CommaSeparatedTuple(const Ts&... values)
        : value { std::make_tuple(values...) }
    {
    }

    constexpr CommaSeparatedTuple(std::tuple<Ts...>&& tuple)
        : value { WTFMove(tuple) }
    {
    }

    constexpr bool operator==(const CommaSeparatedTuple<Ts...>&) const = default;

    std::tuple<Ts...> value;
};

template<size_t I, typename... Ts> decltype(auto) get(const CommaSeparatedTuple<Ts...>& tuple)
{
    return std::get<I>(tuple.value);
}

template<typename... Ts> inline constexpr auto TreatAsTupleLike<CommaSeparatedTuple<Ts...>> = true;
template<typename... Ts> inline constexpr auto SerializationSeparator<CommaSeparatedTuple<Ts...>> = ", "_s;

// Wraps a pair of elements of a single type representing a point, semantically marking them as serializing as "space separated".
template<typename T> struct SpaceSeparatedPoint {
    using Array = SpaceSeparatedPair<T>;
    using value_type = T;

    constexpr SpaceSeparatedPoint(T p1, T p2)
        : value { WTFMove(p1), WTFMove(p2) }
    {
    }

    constexpr SpaceSeparatedPoint(SpaceSeparatedPair<T>&& array)
        : value { WTFMove(array) }
    {
    }

    constexpr bool operator==(const SpaceSeparatedPoint<T>&) const = default;

    const T& x() const { return get<0>(value); }
    const T& y() const { return get<1>(value); }

    bool isZero() const
        requires HasIsZero<T>
    {
        return x().isZero() && y().isZero();
    }

    SpaceSeparatedPair<T> value;
};

template<size_t I, typename T> decltype(auto) get(const SpaceSeparatedPoint<T>& point)
{
    return get<I>(point.value);
}

template<typename T> inline constexpr auto TreatAsTupleLike<SpaceSeparatedPoint<T>> = true;
template<typename T> inline constexpr auto SerializationSeparator<SpaceSeparatedPoint<T>> = " "_s;

// Wraps a pair of elements of a single type representing a size, semantically marking them as serializing as "space separated".
template<typename T> struct SpaceSeparatedSize {
    using Array = SpaceSeparatedPair<T>;
    using value_type = T;

    constexpr SpaceSeparatedSize(T p1, T p2)
        : value { WTFMove(p1), WTFMove(p2) }
    {
    }

    constexpr SpaceSeparatedSize(SpaceSeparatedPair<T>&& array)
        : value { WTFMove(array) }
    {
    }

    constexpr bool operator==(const SpaceSeparatedSize<T>&) const = default;

    const T& width() const { return get<0>(value); }
    const T& height() const { return get<1>(value); }

    bool isZero() const
        requires HasIsZero<T>
    {
        return width().isZero() && height().isZero();
    }

    bool isEmpty() const
        requires HasIsZero<T>
    {
        return width().isZero() || height().isZero();
    }

    SpaceSeparatedPair<T> value;
};

template<size_t I, typename T> decltype(auto) get(const SpaceSeparatedSize<T>& size)
{
    return get<I>(size.value);
}

template<typename T> inline constexpr auto TreatAsTupleLike<SpaceSeparatedSize<T>> = true;
template<typename T> inline constexpr auto SerializationSeparator<SpaceSeparatedSize<T>> = " "_s;

// Wraps a quad of elements of a single type representing the edges of a rect, semantically marking them as serializing as "space separated".
template<typename T> struct SpaceSeparatedRectEdges {
    using value_type = T;

    constexpr SpaceSeparatedRectEdges(T top, T right, T bottom, T left)
        : value { WTFMove(top), WTFMove(right), WTFMove(bottom), WTFMove(left) }
    {
    }

    constexpr SpaceSeparatedRectEdges(RectEdges<T>&& rectEdges)
        : value { WTFMove(rectEdges) }
    {
    }

    constexpr bool operator==(const SpaceSeparatedRectEdges<T>&) const = default;

    const T& top() const { return value.top(); }
    const T& right() const { return value.right(); }
    const T& bottom() const { return value.bottom(); }
    const T& left() const { return value.left(); }

    RectEdges<T> value;
};

template<size_t I, typename T> const auto& get(const SpaceSeparatedRectEdges<T>& rectEdges)
{
    if constexpr (!I)
        return rectEdges.top();
    else if constexpr (I == 1)
        return rectEdges.right();
    else if constexpr (I == 2)
        return rectEdges.bottom();
    else if constexpr (I == 3)
        return rectEdges.left();
}

template<typename T> inline constexpr auto TreatAsTupleLike<SpaceSeparatedRectEdges<T>> = true;
template<typename T> inline constexpr auto SerializationSeparator<SpaceSeparatedRectEdges<T>> = " "_s;

// A set of 4 values parsed and interpreted in the same manner as defined for the margin shorthand.
//
// <minimally-serializing-rect-edges> = <type>{1,4}
//
// - if only 1 value, `a`, is provided, set top, bottom, right & left to `a`.
// - if only 2 values, `a` and `b` are provided, set top & bottom to `a`, right & left to `b`.
// - if only 3 values, `a`, `b`, and `c` are provided, set top to `a`, right to `b`, bottom to `c`, & left to `b`.
//
// As the name implies, the benefit of using this over `SpaceSeparatedRectEdges` directly
// is that this will serialize in its minimal form, checking for element equality and only
// serializing what is necessary.
template<typename T> struct MinimallySerializingSpaceSeparatedRectEdges {
    using value_type = T;

    constexpr MinimallySerializingSpaceSeparatedRectEdges(T top, T right, T bottom, T left)
        : value { WTFMove(top), WTFMove(right), WTFMove(bottom), WTFMove(left) }
    {
    }

    constexpr MinimallySerializingSpaceSeparatedRectEdges(RectEdges<T>&& rectEdges)
        : value { WTFMove(rectEdges) }
    {
    }

    const T& top() const    { return value.top(); }
    const T& right() const  { return value.right(); }
    const T& bottom() const { return value.bottom(); }
    const T& left() const   { return value.left(); }

    constexpr bool operator==(const MinimallySerializingSpaceSeparatedRectEdges<T>&) const = default;

    RectEdges<T> value;
};

template<size_t I, typename T> decltype(auto) get(const MinimallySerializingSpaceSeparatedRectEdges<T>& value)
{
    if constexpr (!I)
        return value.top();
    else if constexpr (I == 1)
        return value.right();
    else if constexpr (I == 2)
        return value.bottom();
    else if constexpr (I == 3)
        return value.left();
}

template<typename T> inline constexpr auto TreatAsTupleLike<MinimallySerializingSpaceSeparatedRectEdges<T>> = true;
template<typename T> inline constexpr auto SerializationSeparator<MinimallySerializingSpaceSeparatedRectEdges<T>> = " "_s;

} // namespace WebCore

namespace std {

template<WebCore::CSSValueID C, typename T> class tuple_size<WebCore::FunctionNotation<C, T>> : public std::integral_constant<size_t, 1> { };
template<size_t I, WebCore::CSSValueID C, typename T> class tuple_element<I, WebCore::FunctionNotation<C, T>> {
public:
    using type = T;
};

template<typename T, size_t N> class tuple_size<WebCore::SpaceSeparatedArray<T, N>> : public std::integral_constant<size_t, N> { };
template<size_t I, typename T, size_t N> class tuple_element<I, WebCore::SpaceSeparatedArray<T, N>> {
public:
    using type = T;
};

template<typename T, size_t N> class tuple_size<WebCore::CommaSeparatedArray<T, N>> : public std::integral_constant<size_t, N> { };
template<size_t I, typename T, size_t N> class tuple_element<I, WebCore::CommaSeparatedArray<T, N>> {
public:
    using type = T;
};

template<typename... Ts> class tuple_size<WebCore::SpaceSeparatedTuple<Ts...>> : public std::integral_constant<size_t, sizeof...(Ts)> { };
template<size_t I, typename... Ts> class tuple_element<I, WebCore::SpaceSeparatedTuple<Ts...>> {
public:
    using type = tuple_element_t<I, tuple<Ts...>>;
};

template<typename... Ts> class tuple_size<WebCore::CommaSeparatedTuple<Ts...>> : public std::integral_constant<size_t, sizeof...(Ts)> { };
template<size_t I, typename... Ts> class tuple_element<I, WebCore::CommaSeparatedTuple<Ts...>> {
public:
    using type = tuple_element_t<I, tuple<Ts...>>;
};

template<typename T> class tuple_size<WebCore::SpaceSeparatedPoint<T>> : public std::integral_constant<size_t, 2> { };
template<size_t I, typename T> class tuple_element<I, WebCore::SpaceSeparatedPoint<T>> {
public:
    using type = T;
};

template<typename T> class tuple_size<WebCore::SpaceSeparatedSize<T>> : public std::integral_constant<size_t, 2> { };
template<size_t I, typename T> class tuple_element<I, WebCore::SpaceSeparatedSize<T>> {
public:
    using type = T;
};

template<typename T> class tuple_size<WebCore::SpaceSeparatedRectEdges<T>> : public std::integral_constant<size_t, 4> { };
template<size_t I, typename T> class tuple_element<I, WebCore::SpaceSeparatedRectEdges<T>> {
public:
    using type = T;
};

template<typename T> class tuple_size<WebCore::MinimallySerializingSpaceSeparatedRectEdges<T>> : public std::integral_constant<size_t, 4> { };
template<size_t I, typename T> class tuple_element<I, WebCore::MinimallySerializingSpaceSeparatedRectEdges<T>> {
public:
    using type = T;
};

} // namespace std
